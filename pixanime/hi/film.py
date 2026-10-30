"""Камера, сцена и склейка кадра: из спрайтов получается кино.

Ключевые решения:
  * кадр 256x144, зум — целочисленная выборка окна (NEAREST), поэтому
    пиксели остаются пикселями, без мыла;
  * у каждого персонажа есть глубина: дальние подмешиваются к дымке,
    получают контактную тень и меньше контраста — это и есть «воздух»;
  * тряска камеры и зерно детерминированы от (сид, кадр), кадр
    воспроизводим;
  * субтитры рисуются своим шрифтом 5x7 с обводкой.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from ..font import draw_text, text_size, wrap_text
from . import bg as BG
from .char import Look, Pose, render
from .raster import Bitmap, Mask, bayer_pick, mix
from .rig import Clip, walk

W, H = BG.W, BG.H


# ---------------------------------------------------------------------------
# камера
# ---------------------------------------------------------------------------
@dataclass
class Cam:
    """Положение камеры в координатах сцены (центр + зум + тряска)."""

    cx: float = W / 2
    cy: float = H / 2
    zoom: float = 1.0
    shake: float = 0.0


def _shake(cam: Cam, frame: int, seed: int = 0) -> tuple[float, float]:
    if cam.shake <= 0.01:
        return 0.0, 0.0
    a = cam.shake
    x = math.sin((frame * 1.7 + seed) * 12.9898) * 43758.5453
    y = math.sin((frame * 2.3 + seed + 11) * 78.233) * 12345.6789
    return (x - math.floor(x) - 0.5) * a, (y - math.floor(y) - 0.5) * a


def camera_crop(bit: Bitmap, cam: Cam, frame: int = 0, seed: int = 0) -> Bitmap:
    """Вырезать окно камеры и растянуть до кадра целыми пикселями."""
    z = max(1.0, cam.zoom)
    vw, vh = max(8, int(round(bit.w / z))), max(8, int(round(bit.h / z)))
    sx, sy = _shake(cam, frame, seed)
    x0 = int(round(cam.cx + sx - vw / 2))
    y0 = int(round(cam.cy + sy - vh / 2))
    x0 = max(0, min(bit.w - vw, x0))
    y0 = max(0, min(bit.h - vh, y0))
    sub = bit.rgb[y0:y0 + vh, x0:x0 + vw]
    out = Bitmap(W, H)
    ys = (np.arange(H) * vh / H).astype(int).clip(0, vh - 1)
    xs = (np.arange(W) * vw / W).astype(int).clip(0, vw - 1)
    out.rgb = sub[ys][:, xs]
    out.mask.m[:] = True
    return out


# ---------------------------------------------------------------------------
# персонажи на сцене
# ---------------------------------------------------------------------------
@dataclass
class Actor:
    look: Look
    clip: Clip = field(default_factory=lambda: Clip([Pose()]))
    x: float = W / 2            # позиция стоп по x в координатах сцены
    y: float = 116              # линия пола
    depth: float = 0.0          # 0 — передний план, 1 — дальний
    scale: float = 1.0
    flip: bool = False
    offset: int = 0             # сдвиг кадра клипа
    fade: float = 1.0           # 0..1 — насколько проявляется
    tint: tuple | None = None

    def pose(self, t: int) -> Pose:
        if not self.clip.poses:
            return Pose()
        return self.clip.poses[(t + self.offset) % len(self.clip.poses)]


def contact_shadow(bit: Bitmap, x: float, y: float, rx: float, ry: float, color, amount: float = 0.85) -> None:
    m = Mask(bit.w, bit.h).ellipse(x, y, rx, ry)
    bit.paint(m & bayer_pick(bit.h, bit.w, amount), color)


def place_actor(bit: Bitmap, actor: Actor, t: int, light: BG.Light) -> None:
    pose = actor.pose(t)
    spr = render(actor.look, pose)
    if actor.scale != 1.0:
        k = actor.scale
        if k < 1:
            step = max(1, int(round(1 / k)))
            spr.rgb = spr.rgb[::step, ::step]
            spr.mask.m = spr.mask.m[::step, ::step]
        else:
            step = int(round(k))
            spr.rgb = np.repeat(np.repeat(spr.rgb, step, 0), step, 1)
            spr.mask.m = np.repeat(np.repeat(spr.mask.m, step, 0), step, 1)
    if actor.flip:
        spr.rgb = spr.rgb[:, ::-1]
        spr.mask.m = spr.mask.m[:, ::-1]

    # дымка по глубине: дальние уходят в цвет воздуха
    depth = max(0.0, min(1.0, actor.depth))
    if depth > 0.01:
        haze = np.array(light.haze, dtype=np.float32)
        spr.rgb = (spr.rgb.astype(np.float32) * (1 - depth * 0.45) + haze * depth * 0.45).astype(np.uint8)
        # контровой свет дальнего плана холоднее
    if actor.tint is not None:
        tint = np.array(actor.tint, dtype=np.float32)
        spr.rgb = (spr.rgb.astype(np.float32) * 0.72 + tint * 0.28).astype(np.uint8)

    # тень под ногами
    feet_y = actor.y
    contact_shadow(bit, actor.x, feet_y, 9 * actor.scale * (1 - depth * 0.3), 2.4 * actor.scale,
                   mix(light.shadow, (0, 0, 0), 0.25), 0.75 * (1 - depth * 0.4))

    # вставка спрайта: ноги спрайта стоят на линии пола
    px = int(round(actor.x - spr.w / 2))
    py = int(round(feet_y - spr.h * (148 / 160)))
    bit.blit(spr, px, py)


# ---------------------------------------------------------------------------
# эффекты кадра
# ---------------------------------------------------------------------------
def vignette(bit: Bitmap, amount: float = 0.35) -> None:
    """Мягкое затемнение по краям: вероятность берётся из позиции, не константа."""
    yy, xx = np.mgrid[0:bit.h, 0:bit.w]
    nx = (xx - bit.w / 2) / (bit.w / 2)
    ny = (yy - bit.h / 2) / (bit.h / 2)
    r = np.sqrt(nx * nx * 0.92 + ny * ny * 0.78) / 1.30
    a = np.clip((r - 0.62) / 0.48, 0.0, 1.0) ** 1.6 * (amount * 1.6)
    m = bayer_pick(bit.h, bit.w, a)
    bit.rgb[m] = (bit.rgb[m].astype(np.float32) * 0.78).astype(np.uint8)


def grain(bit: Bitmap, frame: int, seed: int = 0, amount: float = 0.05) -> None:
    """Плёночное зерно: сигма в уровнях, а не в процентах от 255."""
    if amount <= 0:
        return
    rng = np.random.default_rng((frame * 7919 + seed * 104729) % (2 ** 31))
    sigma = max(0.6, amount * 55)
    n = rng.normal(0, sigma, (bit.h, bit.w, 1)).astype(np.float32)
    bit.rgb = np.clip(bit.rgb.astype(np.float32) + n, 0, 255).astype(np.uint8)


def _blend(bit: Bitmap, t: float, color) -> None:
    """Плавное смешивание с цветом + дизеринг только в квантовании."""
    t = max(0.0, min(1.0, t))
    if t <= 0:
        return
    pat = np.tile(np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32),
                  (bit.h // 4 + 2, bit.w // 4 + 2))[: bit.h, : bit.w]
    src = bit.rgb.astype(np.float32)
    dst = np.array(color, dtype=np.float32)
    out = src * (1 - t) + dst * t + (pat[..., None] / 16.0 - 0.5)
    bit.rgb = np.clip(out, 0, 255).astype(np.uint8)


def flash(bit: Bitmap, t: float, color=(255, 255, 255)) -> None:
    """Вспышка при склейке (0..1)."""
    _blend(bit, t, color)


def fade(bit: Bitmap, t: float, color=(0, 0, 0)) -> None:
    _blend(bit, t, color)


class _Wrap:
    """Адаптер для font.draw_text (ему нужен метод put)."""

    __slots__ = ("bit",)

    def __init__(self, bit: Bitmap):
        self.bit = bit

    def put(self, x: int, y: int, color) -> None:
        if 0 <= x < self.bit.w and 0 <= y < self.bit.h:
            self.bit.rgb[y, x] = color
            self.bit.mask.m[y, x] = True


def subtitle(bit: Bitmap, text: str, y: int | None = None, scale: int = 1,
             color=(250, 250, 255), outline=(16, 14, 26), max_w: int = None) -> None:
    if not text:
        return
    maxw = (max_w or bit.w - 16) // scale
    lines = wrap_text(text, maxw)
    lh = 9
    block_h = len(lines) * lh * scale
    y0 = (bit.h - 9 - block_h) if y is None else y
    wrap = _Wrap(bit)
    widths = [text_size(ln, scale=scale)[0] for ln in lines]
    bw = max(widths) + 10
    bx0 = (bit.w - bw) // 2
    # плашка: 50% затемнение дизерингом, чтобы текст читался на светлом небе
    band = Mask(bit.w, bit.h).rect(bx0, y0 - 1, bx0 + bw, y0 + block_h + 1)
    m = (band & bayer_pick(bit.h, bit.w, 0.55)).m
    bit.rgb[m] = (bit.rgb[m].astype(np.float32) * 0.42).astype(np.uint8)
    for i, ln in enumerate(lines):
        x = (bit.w - widths[i]) // 2
        draw_text(wrap, x, y0 + i * lh * scale, ln, color, scale=scale, outline=outline)


def caption(bit: Bitmap, text: str, y: int = 14, scale: int = 1, color=(252, 244, 226),
            outline=(20, 16, 28)) -> None:
    if not text:
        return
    for i, ln in enumerate(text.split("\n")):
        tw, _ = text_size(ln, scale=scale)
        draw_text(_Wrap(bit), (bit.w - tw) // 2, y + i * 10 * scale, ln, color, scale=scale, outline=outline)


# ---------------------------------------------------------------------------
# сцена
# ---------------------------------------------------------------------------
@dataclass
class Shot:
    """Один монтажный кадр."""

    kind: str = "city_day"
    light: str = "day"
    frames: int = 24
    cam_from: Cam = field(default_factory=Cam)
    cam_to: Cam = field(default_factory=Cam)
    actors: list = field(default_factory=list)
    say: str = ""
    title: str = ""
    overlay: str = ""          # "", "fade_in", "fade_out", "flash"
    seed: int = 0
    pan: float = 0.0           # сдвиг фона (параллакс)
    bg_obj: Bitmap | None = None
    zoom_end: float | None = None
    grain: float = 0.05
    weather: str = ""          # "", "rain", "petals", "snow"

    def cam_at(self, i: int) -> Cam:
        t = i / max(1, self.frames - 1)
        return Cam(cx=self.cam_from.cx + (self.cam_to.cx - self.cam_from.cx) * t,
                   cy=self.cam_from.cy + (self.cam_to.cy - self.cam_from.cy) * t,
                   zoom=self.cam_from.zoom + (self.cam_to.zoom - self.cam_from.zoom) * t,
                   shake=self.cam_from.shake + (self.cam_to.shake - self.cam_from.shake) * t)


def render_shot(shot: Shot) -> list[Bitmap]:
    light = BG.LIGHTS[shot.light]
    base = shot.bg_obj if shot.bg_obj is not None else BG.build(shot.kind, light, seed=shot.seed)
    frames = []
    for i in range(shot.frames):
        cam = shot.cam_at(i)
        if abs(shot.pan) > 0.01:
            s = int(round(shot.pan * (i / max(1, shot.frames - 1))))
            shifted = BG.parallax(base, s)
            scene = shifted
        else:
            scene = base
        # персонажи рисуются в координатах «сцены», камера применяется один раз
        work = Bitmap(W, H)
        work.rgb = scene.rgb.copy()
        work.mask.m[:] = True
        for a in sorted(shot.actors, key=lambda a: (a.depth, a.y)):
            place_actor(work, a, i, light)
        if shot.weather == "rain":
            BG.rain(work, seed=shot.seed + i // 2, density=0.8)
        elif shot.weather == "petals":
            petals(work, seed=shot.seed, frame=i)
        elif shot.weather == "snow":
            snow(work, seed=shot.seed, frame=i)
        frame = camera_crop(work, cam, i, shot.seed)
        if shot.grain:
            grain(frame, i, shot.seed, shot.grain)
        vignette(frame, 0.4 if shot.kind != "room" else 0.55)
        if shot.say:
            subtitle(frame, shot.say)
        if shot.title:
            caption(frame, shot.title, 12, 1)
        t = i / max(1, shot.frames - 1)
        if shot.overlay == "fade_in":
            fade(frame, 1 - t)
        elif shot.overlay == "fade_out":
            fade(frame, t)
        elif shot.overlay == "flash" and t < 0.35:
            flash(frame, 1 - t / 0.35)
        frames.append(frame)
    return frames


def petals(bit: Bitmap, seed: int = 0, frame: int = 0, count: int = 26) -> None:
    rng = np.random.default_rng(seed)
    for k in range(count):
        x0 = rng.uniform(0, bit.w)
        y0 = rng.uniform(-10, bit.h)
        spd = rng.uniform(0.6, 1.6)
        y = (y0 + frame * spd * 1.4) % (bit.h + 20) - 10
        x = (x0 + math.sin(frame * 0.12 + k) * 7 + frame * 0.5) % bit.w
        col = (250, 210, 226) if k % 3 else (236, 176, 200)
        bit.rgb[int(y) % bit.h, int(x) % bit.w] = col
        if k % 4 == 0:
            bit.rgb[int(y + 1) % bit.h, int(x) % bit.w] = mix(col, (255, 255, 255), 0.4)


def snow(bit: Bitmap, seed: int = 0, frame: int = 0, count: int = 60) -> None:
    rng = np.random.default_rng(seed + 3)
    for k in range(count):
        x0 = rng.uniform(0, bit.w)
        y0 = rng.uniform(0, bit.h)
        y = (y0 + frame * 0.8) % bit.h
        x = (x0 + math.sin(frame * 0.06 + k) * 3) % bit.w
        bit.rgb[int(y), int(x)] = (244, 248, 255)


def render_scene(shot: Shot) -> Bitmap:
    """Один кадр (для постеров)."""
    return render_shot(Shot(**{**shot.__dict__, "frames": 1}))[0]
