"""Эффекты поверх кадра: дождь, снег, лепестки, светлячки, лучи, виньетка.

Все эффекты детерминированы (сид + время), поэтому кадр можно пересчитать
в любой момент — это важно, когда видео кодируется потоком.
"""
from __future__ import annotations

import math

import numpy as np

from .palette import BAYER4, mix


def rain(frame, t: float, seed: int = 0, density: int = 40, pal=None, heavy: bool = False) -> None:
    rng = np.random.default_rng(seed)
    h, w = frame.h, frame.w
    col = (200, 215, 235)
    for _ in range(density):
        x0 = rng.integers(0, w)
        y0 = rng.integers(0, h)
        speed = rng.uniform(90, 140)
        ln = rng.integers(3, 6) + (2 if heavy else 0)
        y = int((y0 + t * speed) % (h + ln))
        x = int(x0 + y * 0.22) % w
        for k in range(ln):
            yy, xx = y + k, x + k // 3
            if 0 <= yy < h and 0 <= xx < w:
                if k % 2 == 0 or heavy:
                    frame.px[yy, xx] = mix(frame.px[yy, xx], col, 0.45)
    # всплески на земле
    if heavy:
        for _ in range(12):
            x = int(rng.integers(0, w))
            y = int(h - rng.integers(0, 6))
            if 0 <= y < h and (int(t * 8 + _) % 3) == 0:
                frame.px[y, x] = col


def snow(frame, t: float, seed: int = 1, density: int = 34) -> None:
    rng = np.random.default_rng(seed)
    h, w = frame.h, frame.w
    for _ in range(density):
        x0 = rng.integers(0, w)
        y0 = rng.integers(0, h)
        sp = rng.uniform(8, 22)
        drift = math.sin(t * 0.8 + x0) * 4
        x = int((x0 + drift) % w)
        y = int((y0 + t * sp) % (h + 2))
        if 0 <= y < h:
            frame.px[y, x] = (235, 238, 248)
            if rng.random() < 0.4 and y + 1 < h:
                frame.px[y + 1, x] = (210, 214, 230)


def petals(frame, t: float, seed: int = 2, density: int = 26, color=(245, 180, 200)) -> None:
    rng = np.random.default_rng(seed)
    h, w = frame.h, frame.w
    for _ in range(density):
        x0 = rng.integers(0, w)
        y0 = rng.integers(0, h)
        sp = rng.uniform(10, 26)
        ph = rng.uniform(0, 6.28)
        x = int((x0 + 12 * math.sin(t * 0.6 + ph)) % w)
        y = int((y0 + t * sp) % (h + 2))
        if 0 <= y < h:
            frame.px[y, x] = color
            if (int(t * 6 + ph * 10) % 5) != 0 and x + 1 < w:
                frame.px[y, x + 1] = mix(color, (255, 255, 255), 0.3)


def fireflies(frame, t: float, seed: int = 3, density: int = 14, color=(210, 240, 140)) -> None:
    rng = np.random.default_rng(seed)
    h, w = frame.h, frame.w
    for i in range(density):
        bx = rng.integers(0, w)
        by = rng.integers(int(h * 0.4), int(h * 0.9))
        x = int(bx + 6 * math.sin(t * 0.7 + i))
        y = int(by + 4 * math.cos(t * 0.9 + i * 2))
        glow = 0.5 + 0.5 * math.sin(t * 2.0 + i)
        if glow < 0.25:
            continue
        if 0 <= y < h and 0 <= x < w:
            frame.px[y, x] = color
            if glow > 0.75:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if 0 <= y + dy < h and 0 <= x + dx < w:
                        frame.px[y + dy, x + dx] = mix(frame.px[y + dy, x + dx], color, 0.35)


def sparkles(frame, t: float, seed: int = 4, density: int = 8, color=(255, 250, 210)) -> None:
    rng = np.random.default_rng(seed)
    h, w = frame.h, frame.w
    for i in range(density):
        x = int(rng.integers(0, w))
        y = int(rng.integers(0, int(h * 0.7)))
        ph = rng.uniform(0, 6.28)
        k = math.sin(t * 3 + ph)
        if k < 0.72:
            continue
        frame.px[y, x] = color
        if k > 0.9:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if 0 <= y + dy < h and 0 <= x + dx < w:
                    frame.px[y + dy, x + dx] = mix(frame.px[y + dy, x + dx], color, 0.5)


def light_rays(frame, t: float, seed: int = 5, color=(255, 235, 190), strength: float = 0.22) -> None:
    """Косые лучи света (закат/утро). Рисуются дизерингом, а не альфой."""
    h, w = frame.h, frame.w
    pat = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))[:h, :w]
    for x in range(w):
        phase = math.sin(x * 0.06 + t * 0.25)
        if phase < 0.2:
            continue
        for y in range(h):
            xx = x - int((h - y) * 0.35)
            if 0 <= xx < w and pat[y, xx] < strength * phase:
                frame.px[y, xx] = mix(frame.px[y, xx], color, 0.35)


def vignette(frame, strength: float = 0.45) -> None:
    h, w = frame.h, frame.w
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    pat = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    mask = (d > 0.95) & (pat < (d - 0.95) * strength * 3.0)
    frame.px[mask] = (frame.px[mask] * 0.55).astype(np.uint8)


def fade_to(frame, color, amount: float) -> None:
    """Затемнение/засветка через дизеринг: amount 0..1."""
    if amount <= 0:
        return
    amount = min(1.0, amount)
    h, w = frame.h, frame.w
    pat = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    q = amount * 16
    k = int(q)
    f = q - k
    lum = np.array(color, dtype=np.float32)
    frame.px = (frame.px * (1 - amount) + lum * amount).astype(np.uint8) if amount > 0.98 else frame.px
    if amount <= 0.98:
        # ступенчатое смешивание по матрице Байера (сохраняет «пиксельность»)
        base = frame.px.astype(np.float32)
        target = lum
        blended = (base * (1 - min(1.0, amount * 1.25)) + target * min(1.0, amount * 1.25)).astype(np.uint8)
        mask = pat < amount
        frame.px[mask] = blended[mask]


def dissolve(a_frames, amount: float):
    """Переход «дизеринг-растворение» между двумя кадрами — приём из 8-битных эпох."""
    raise NotImplementedError


def dither_dissolve(frame_a: np.ndarray, frame_b: np.ndarray, amount: float) -> np.ndarray:
    h, w = frame_a.shape[:2]
    pat = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    mask = pat < amount
    out = frame_a.copy()
    out[mask] = frame_b[mask]
    return out


def crt(frame, t: float = 0.0) -> None:
    """Псевдо-CRT: скан-линии через строку. Уместно для «VHS-записи»."""
    h = frame.h
    for y in range(0, h, 2):
        frame.px[y] = (frame.px[y] * 0.88).astype(np.uint8)
