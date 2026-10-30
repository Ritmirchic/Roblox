"""Фоны 256x144 с параллаксом и световыми схемами.

Каждый фон собирается из слоёв (небо, дальний план, средний, земля, передний),
чтобы камера могла двигать их с разной скоростью. Все градиенты — дизеринг
Байера в ограниченную палитру: это то, что отличает пиксель-арт от мыла.

Световая схема (`Light`) задаёт не только цвета неба, но и цвет контрового
света и тени — персонаж потом красится ею же, поэтому кадр не рассыпается.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from .raster import BAYER4, Bitmap, Mask, bayer_pick, mix, ramp, shade

W, H = 256, 144


@dataclass
class Light:
    """Световая схема сцены: небо, дымка, контровой свет, тень."""

    name: str = "day"
    sky: list = field(default_factory=lambda: [(126, 182, 232), (176, 214, 238), (222, 238, 226)])
    haze: tuple = (196, 216, 226)
    sun: tuple = (255, 246, 214)
    sun_at: tuple = (196, 0.22)        # x,y в долях кадра
    sun_size: float = 9.0
    cloud: tuple = (250, 250, 252)
    cloud_dark: tuple = (206, 214, 228)
    ground: tuple = (120, 158, 96)
    ground_dark: tuple = (78, 112, 74)
    road: tuple = (96, 96, 108)
    road_dark: tuple = (72, 72, 84)
    building: tuple = (150, 156, 178)
    building_dark: tuple = (104, 110, 138)
    window: tuple = (250, 236, 176)
    rim: tuple = (255, 232, 190)
    shadow: tuple = (54, 52, 86)
    night: bool = False
    stars: float = 0.0
    fog: float = 0.0


LIGHTS = {
    "day": Light(),
    "morning": Light("morning", [(196, 208, 232), (240, 214, 190), (250, 238, 208)],
                     haze=(232, 216, 208), sun=(255, 244, 206), sun_at=(0.72, 0.40),
                     cloud=(255, 246, 240), cloud_dark=(226, 200, 198),
                     ground=(128, 162, 100), ground_dark=(84, 116, 80),
                     building=(164, 160, 178), building_dark=(118, 112, 140),
                     rim=(255, 226, 186), shadow=(70, 56, 84)),
    "sunset": Light("sunset", [(72, 66, 118), (196, 108, 110), (250, 176, 108), (252, 216, 152)],
                    haze=(238, 168, 132), sun=(255, 224, 150), sun_at=(0.24, 0.62), sun_size=13,
                    cloud=(252, 198, 156), cloud_dark=(178, 108, 112),
                    ground=(112, 108, 84), ground_dark=(70, 66, 60),
                    road=(104, 84, 90), road_dark=(72, 58, 66),
                    building=(120, 92, 116), building_dark=(78, 58, 84),
                    window=(255, 208, 130), rim=(255, 196, 128), shadow=(58, 38, 74)),
    "night": Light("night", [(16, 20, 46), (26, 34, 72), (44, 52, 96), (58, 64, 108)],
                   haze=(52, 60, 96), sun=(226, 234, 255), sun_at=(0.74, 0.18), sun_size=11,
                   cloud=(66, 74, 112), cloud_dark=(42, 48, 82),
                   ground=(38, 52, 62), ground_dark=(24, 34, 44),
                   road=(42, 44, 60), road_dark=(28, 30, 44),
                   building=(44, 50, 84), building_dark=(28, 32, 58),
                   window=(248, 214, 138), rim=(150, 190, 255), shadow=(12, 14, 34),
                   night=True, stars=0.9),
    "rain": Light("rain", [(88, 98, 118), (110, 120, 138), (132, 140, 154)],
                  haze=(120, 130, 146), sun=(196, 204, 214), sun_at=(0.5, 0.1), sun_size=0,
                  cloud=(146, 152, 164), cloud_dark=(104, 110, 124),
                  ground=(88, 106, 88), ground_dark=(58, 72, 66),
                  road=(78, 80, 92), road_dark=(56, 58, 70),
                  building=(120, 126, 144), building_dark=(84, 90, 110),
                  window=(210, 206, 180), rim=(196, 210, 226), shadow=(44, 48, 66), fog=0.30),
    "dawn": Light("dawn", [(46, 54, 104), (110, 106, 150), (206, 152, 156), (248, 206, 176)],
                  haze=(220, 176, 170), sun=(255, 232, 200), sun_at=(0.5, 0.68), sun_size=10,
                  cloud=(238, 186, 186), cloud_dark=(150, 112, 138),
                  ground=(92, 104, 92), ground_dark=(58, 66, 68),
                  road=(80, 74, 92), road_dark=(56, 52, 68),
                  building=(96, 92, 118), building_dark=(62, 58, 86),
                  window=(250, 218, 156), rim=(210, 190, 255), shadow=(40, 34, 66)),
    "indoor": Light("indoor", [(58, 62, 92), (92, 92, 118), (132, 126, 138)],
                    haze=(120, 118, 130), sun=(255, 246, 214), sun_at=(0.86, 0.18), sun_size=0,
                    cloud=(180, 180, 190), cloud_dark=(130, 128, 140),
                    ground=(120, 104, 88), ground_dark=(84, 70, 60),
                    road=(118, 100, 86), road_dark=(84, 70, 60),
                    building=(170, 156, 140), building_dark=(120, 106, 96),
                    window=(255, 240, 200), rim=(255, 236, 200), shadow=(48, 42, 62)),
}


# ---------------------------------------------------------------------------
def sky(light: Light, w: int = W, h: int = H, horizon: float = 0.62, seed: int = 0,
        stars: bool | None = None) -> Bitmap:
    bit = Bitmap(w, h)
    hz = int(h * horizon)
    stops = [(i / max(1, len(light.sky) - 1), c) for i, c in enumerate(light.sky)]
    bit.rgb[:hz] = ramp(hz, w, stops)
    # звёзды
    if (stars if stars is not None else light.night):
        rng = np.random.default_rng(seed + 7)
        n = int(w * hz * 0.006 * max(0.0, light.stars))
        for _ in range(n):
            x, y = int(rng.integers(0, w)), int(rng.integers(0, max(1, hz - 12)))
            bit.rgb[y, x] = (232, 238, 255) if rng.random() > 0.35 else (170, 186, 226)
            if rng.random() > 0.8 and 0 < x < w - 1:
                bit.rgb[y, x - 1] = (120, 134, 180)
    # солнце/луна
    if light.sun_size > 0:
        cx, cy = int(w * light.sun_at[0]), int(hz * light.sun_at[1] * 1.2)
        r = light.sun_size
        yy, xx = np.mgrid[0:h, 0:w]
        rad = np.sqrt(((xx - cx) / (r * 3.4)) ** 2 + ((yy - cy) / (r * 3.0)) ** 2)
        halo = np.clip(1.0 - rad, 0.0, 1.0) ** 1.6 * 0.75
        m = bayer_pick(h, w, halo)
        bit.rgb[m] = np.array(mix(light.haze, light.sun, 0.5), dtype=np.uint8)
        m2 = Mask(w, h).ellipse(cx, cy, r * 1.25, r * 1.25)
        bit.paint(m2, mix(light.sun, light.haze, 0.25))
        bit.paint(Mask(w, h).ellipse(cx, cy, r, r), light.sun)
        if light.night:      # серп луны
            bit.paint(Mask(w, h).ellipse(cx + r * 0.45, cy - r * 0.35, r * 0.85, r * 0.85), light.sky[0])
    return bit


def _fade(w: int, h: int, amount: float) -> np.ndarray:
    return bayer_pick(h, w, amount)


def clouds(bit: Bitmap, light: Light, horizon: float = 0.62, seed: int = 1, count: int = 5,
           scale: float = 1.0) -> None:
    rng = np.random.default_rng(seed)
    hz = int(bit.h * horizon)
    for i in range(count):
        cx = rng.integers(-20, bit.w + 20)
        cy = rng.integers(int(hz * 0.10), int(hz * 0.66))
        s = rng.uniform(0.7, 1.5) * scale
        m = Mask(bit.w, bit.h)
        puffs = int(rng.integers(3, 6))
        for k in range(puffs):
            ox = rng.normal(0, 7 * s)
            m.ellipse(cx + ox, cy + rng.normal(0, 1.6 * s), rng.uniform(6, 11) * s, rng.uniform(3.5, 5.5) * s)
        bit.paint(m, light.cloud)
        bit.paint(m & ~m.shift(0, 2), mix(light.cloud, (255, 255, 255), 0.35))
        bit.paint(m.edge(0, -2) & _fade(bit.w, bit.h, 0.65), mix(light.cloud, light.cloud_dark, 0.75))


def skyline(bit: Bitmap, light: Light, horizon: float = 0.62, seed: int = 2,
            density: float = 0.9, height: float = 0.34, lit: float = 0.35, tint: float = 0.0) -> None:
    """Город: коробки домов с окнами. `tint` — насколько увести в дымку."""
    rng = np.random.default_rng(seed)
    hz = int(bit.h * horizon)
    x = -8
    while x < bit.w + 8:
        bw = int(rng.integers(14, 34) * density + 8)
        bh = int(rng.integers(10, int(hz * height) + 6))
        y0 = hz - bh
        base = mix(light.building, light.haze, tint)
        dark = mix(light.building_dark, light.haze, tint)
        m = Mask(bit.w, bit.h).rect(x, y0, x + bw, hz)
        bit.paint(m, base)
        bit.paint(m & _fade(bit.w, bit.h, 0.5), mix(base, dark, 0.35))
        bit.paint(m.edge(2, 0), dark)
        bit.paint(m.edge(0, -1), mix(base, (255, 255, 255), 0.12))
        # крыша
        if rng.random() > 0.6:
            bit.paint(Mask(bit.w, bit.h).rect(x + 2, y0 - 2, x + bw - 2, y0), dark)
        # антенна
        if rng.random() > 0.75:
            ax = x + bw // 2
            bit.paint(Mask(bit.w, bit.h).rect(ax, y0 - 8, ax + 1, y0), dark)
        # окна
        cols = max(1, (bw - 4) // 5)
        rows = max(1, (bh - 4) // 6)
        for r in range(rows):
            for c in range(cols):
                wx = x + 3 + c * 5
                wy = y0 + 3 + r * 6
                if wx + 2 > x + bw - 2:
                    continue
                on = rng.random() < lit
                col = mix(light.window, light.haze, 0.15) if on else mix(dark, base, 0.5)
                bit.paint(Mask(bit.w, bit.h).rect(wx, wy, wx + 2, wy + 3), col)
        x += bw + int(rng.integers(1, 5))


def tree(bit: Bitmap, light: Light, x: int, base_y: int, height: int, seed: int = 0,
         kind: str = "sakura", tint: float = 0.0) -> None:
    rng = np.random.default_rng(seed)
    trunk_col = mix((92, 70, 62), light.shadow, 0.35 + tint * 0.4)
    trunk_col = mix(trunk_col, light.haze, tint * 0.5)
    tw = max(2, height // 14)
    trunk = Mask(bit.w, bit.h).poly([
        (x - tw // 2 - 1, base_y), (x + tw // 2 + 1, base_y),
        (x + tw // 3 + 1, base_y - height // 2), (x - tw // 3 - 1, base_y - height // 2)])
    bit.paint(trunk, trunk_col)
    for br in range(3):
        dx = rng.integers(-height // 5, height // 5)
        yb = base_y - height // 2 + rng.integers(-3, 6)
        bit.paint(Mask(bit.w, bit.h).capsule((x, base_y - height // 3), (x + dx, yb - height // 5),
                                             max(1, tw // 2)), trunk_col)
    if kind == "sakura":
        col, col2 = (242, 172, 196), (200, 118, 154)
    elif kind == "autumn":
        col, col2 = (226, 146, 88), (172, 96, 62)
    else:
        col, col2 = (122, 174, 104), (74, 128, 82)
    col = mix(col, light.haze, tint * 0.6)
    col2 = mix(col2, light.haze, tint * 0.6)
    if light.night:
        col, col2 = mix(col, light.sky[1], 0.45), mix(col2, light.shadow, 0.55)
    canopy = Mask(bit.w, bit.h)
    for k in range(int(rng.integers(5, 9))):
        cx = x + rng.normal(0, height * 0.18)
        cy = base_y - height * 0.78 + rng.normal(0, height * 0.12)
        canopy.ellipse(cx, cy, rng.uniform(height * 0.16, height * 0.26),
                       rng.uniform(height * 0.13, height * 0.20))
    bit.paint(canopy, col)
    bit.paint(canopy & _fade(bit.w, bit.h, 0.42), col2)
    bit.paint(canopy.edge(0, -3) & _fade(bit.w, bit.h, 0.7), mix(col, light.sun, 0.35))
    bit.paint(canopy.edge(2, 3), mix(col2, light.shadow, 0.35))


def ground(bit: Bitmap, light: Light, horizon: float = 0.62, seed: int = 3,
           kind: str = "grass", tint: float = 0.0) -> None:
    hz = int(bit.h * horizon)
    base = mix(light.ground, light.haze, tint)
    dark = mix(light.ground_dark, light.haze, tint)
    bit.rgb[hz:] = ramp(bit.h - hz, bit.w, [(0.0, base), (0.5, mix(base, dark, 0.35)), (1.0, dark)])
    rng = np.random.default_rng(seed)
    if kind in ("grass", "park"):
        n = (bit.w * (bit.h - hz)) // 26
        for _ in range(n):
            x = int(rng.integers(0, bit.w))
            y = int(rng.integers(hz + 2, bit.h))
            depth = (y - hz) / max(1, bit.h - hz)
            col = mix(mix(base, (255, 255, 255), 0.16), dark, rng.uniform(0, 0.5))
            if depth < 0.5:
                col = mix(col, light.haze, 0.25 * (1 - depth))
            bit.rgb[y, x] = col
            if rng.random() > 0.86 and y + 2 < bit.h:
                bit.rgb[y + 1, x] = mix(col, dark, 0.4)
    elif kind == "road":
        road = mix(light.road, light.haze, tint)
        rd = mix(light.road_dark, light.haze, tint)
        walk = mix(road, (255, 255, 255), 0.16)
        # тротуар
        bit.paint(Mask(bit.w, bit.h).rect(0, hz + 2, bit.w, hz + 16), walk)
        for x in range(-4, bit.w, 14):
            bit.paint(Mask(bit.w, bit.h).rect(x, hz + 2, x + 1, hz + 16), mix(walk, dark, 0.5))
        # бордюр
        bit.paint(Mask(bit.w, bit.h).rect(0, hz + 16, bit.w, hz + 19), mix(walk, (255, 255, 255), 0.25))
        bit.paint(Mask(bit.w, bit.h).rect(0, hz + 19, bit.w, hz + 21), mix(rd, light.shadow, 0.35))
        # асфальт с перспективой
        bit.paint(Mask(bit.w, bit.h).rect(0, hz + 21, bit.w, bit.h), mix(rd, light.haze, 0.22 * (1 - tint)))
        for _ in range((bit.w * (bit.h - hz)) // 70):
            x = int(rng.integers(0, bit.w)); y = int(rng.integers(hz + 22, bit.h))
            depth = (y - hz - 22) / max(1, bit.h - hz - 22)
            bit.rgb[y, x] = mix(rd, (255, 255, 255), 0.06 + 0.10 * depth)
        # разметка: сплошная у бордюра и пунктир по центру (с перспективой)
        line = mix(light.window, (255, 255, 255), 0.35)
        bit.paint(Mask(bit.w, bit.h).rect(0, hz + 24, bit.w, hz + 26), mix(line, walk, 0.35))
        for i in range(3):
            y0 = hz + 34 + i * 7
            th = 2 + i
            step = 30 - i * 4
            for x in range(-step, bit.w, step):
                bit.paint(Mask(bit.w, bit.h).rect(x, y0, x + step // 2, y0 + th), line)


def fence(bit: Bitmap, light: Light, horizon: float = 0.62, y: int = 0, color=None) -> None:
    hz = int(bit.h * horizon)
    col = color or mix(light.building_dark, light.shadow, 0.4)
    yy = hz + y if y else hz - 4
    bit.paint(Mask(bit.w, bit.h).rect(0, yy, bit.w, yy + 2), col)
    bit.paint(Mask(bit.w, bit.h).rect(0, yy + 6, bit.w, yy + 8), mix(col, light.sun, 0.15))
    for x in range(0, bit.w, 12):
        bit.paint(Mask(bit.w, bit.h).rect(x, yy - 2, x + 2, yy + 10), mix(col, light.shadow, 0.25))


def school(bit: Bitmap, light: Light, horizon: float = 0.62, seed: int = 5) -> None:
    """Школьное здание: три этажа, окна, часы над входом."""
    hz = int(bit.h * horizon)
    x0, x1 = int(bit.w * 0.06), int(bit.w * 0.94)
    top = hz - int(bit.h * 0.30)
    wall = mix((214, 206, 196), light.haze, 0.35)
    wall_d = mix((164, 154, 152), light.haze, 0.35)
    bit.paint(Mask(bit.w, bit.h).rect(x0, top, x1, hz), wall)
    bit.paint(Mask(bit.w, bit.h).rect(x0, top, x1, top + 4), mix(wall_d, light.shadow, 0.25))
    bit.paint(Mask(bit.w, bit.h).rect(x1 - 3, top, x1, hz), wall_d)
    # окна по сетке
    for r in range(3):
        for c in range(9):
            wx = x0 + 8 + c * ((x1 - x0 - 16) // 9)
            wy = top + 10 + r * ((hz - top - 16) // 3)
            ww, wh = 10, 10
            if wx + ww > x1 - 4:
                continue
            on = (c + r) % 5 == 0
            col = mix(light.window, (255, 255, 255), 0.15) if on else mix((92, 116, 146), light.haze, 0.4)
            bit.paint(Mask(bit.w, bit.h).rect(wx, wy, wx + ww, wy + wh), col)
            bit.paint(Mask(bit.w, bit.h).rect(wx, wy, wx + ww, wy + 1), mix(col, (255, 255, 255), 0.3))
            bit.paint(Mask(bit.w, bit.h).rect(wx + ww // 2, wy, wx + ww // 2 + 1, wy + wh),
                      mix(wall_d, light.shadow, 0.3))
    # дверь и козырёк
    cx = (x0 + x1) // 2
    bit.paint(Mask(bit.w, bit.h).rect(cx - 9, hz - 18, cx + 9, hz), mix((126, 96, 84), light.haze, 0.3))
    bit.paint(Mask(bit.w, bit.h).rect(cx - 12, hz - 21, cx + 12, hz - 18), wall_d)
    bit.paint(Mask(bit.w, bit.h).ellipse(cx, top + 5, 5, 5), mix((236, 232, 224), light.haze, 0.2))
    bit.paint(Mask(bit.w, bit.h).rect(cx, top + 4, cx + 1, top + 7), light.shadow)


def classroom(light: Light, w: int = W, h: int = H, seed: int = 11, sun_from: int = 1) -> Bitmap:
    """Интерьер: окна с лучами, парты, доска. Свет важен — он и есть воздух."""
    bit = Bitmap(w, h)
    bit.rgb[:] = mix((92, 88, 104), light.shadow, 0.35)
    # задняя стена
    bit.paint(Mask(w, h).rect(0, 0, w, int(h * 0.78)), mix((146, 138, 126), light.haze, 0.30))
    bit.paint(Mask(w, h).rect(0, 0, w, 6), mix((120, 112, 104), light.shadow, 0.2))
    # пол
    floor_y = int(h * 0.78)
    bit.paint(Mask(w, h).rect(0, floor_y, w, h), mix((146, 118, 92), light.haze, 0.25))
    for i in range(10):
        y = floor_y + int((h - floor_y) * (i / 9) ** 1.6)
        bit.paint(Mask(w, h).rect(0, y, w, y + 1), mix((110, 86, 68), light.shadow, 0.2))
    # окна слева
    for k in range(2):
        x0 = 10 + k * 62
        wtop, wbot = 14, floor_y - 16
        stops = [(i / max(1, len(light.sky) - 1), c) for i, c in enumerate(light.sky)]
        bit.rgb[wtop:wbot, x0:x0 + 46] = ramp(wbot - wtop, 46, stops)
        # дальняя зелень за окном
        bit.paint(Mask(w, h).rect(x0, wtop + int((wbot - wtop) * 0.62), x0 + 46, wbot),
                  mix(light.ground, light.haze, 0.45))
        bit.paint(Mask(w, h).rect(x0, wtop, x0 + 46, 16), mix((196, 196, 196), light.haze, 0.3))
        bit.paint(Mask(w, h).rect(x0 + 22, 12, x0 + 24, floor_y - 16), mix((196, 196, 196), light.haze, 0.3))
        bit.paint(Mask(w, h).rect(x0 - 2, 10, x0, floor_y - 14), mix((168, 160, 156), light.haze, 0.25))
    # доска справа
    bx0, bx1 = int(w * 0.62), int(w * 0.94)
    bit.paint(Mask(w, h).rect(bx0, int(h * 0.18), bx1, int(h * 0.50)), (58, 84, 72))
    bit.paint(Mask(w, h).rect(bx0 - 2, int(h * 0.18) - 2, bx1 + 2, int(h * 0.18)), (150, 120, 90))
    # парты
    for px, py, sc in ((20, 104, 1.0), (96, 108, 1.1), (176, 112, 1.2)):
        top = mix((188, 156, 118), light.haze, 0.2)
        bit.paint(Mask(w, h).rect(px, py, px + int(56 * sc), py + 5), top)
        bit.paint(Mask(w, h).rect(px, py, px + int(56 * sc), py + 1), mix(top, (255, 255, 255), 0.25))
        bit.paint(Mask(w, h).rect(px, py + 5, px + int(56 * sc), py + 7), mix(top, light.shadow, 0.5))
        for lx in (px + 3, px + int(50 * sc)):
            bit.paint(Mask(w, h).rect(lx, py + 7, lx + 2, py + int(24 * sc)),
                      mix((120, 116, 120), light.shadow, 0.35))
        # стул
        sy = py + 9
        bit.paint(Mask(w, h).rect(px + 8, sy + 6, px + int(40 * sc), sy + 8), mix((110, 92, 78), light.shadow, 0.3))
        bit.paint(Mask(w, h).rect(px + 10, sy + 8, px + 12, sy + 16), mix((92, 78, 68), light.shadow, 0.4))
    # лучи света из окон (поверх парт, но почти прозрачные)
    for k in range(2):
        x0 = 10 + k * 62
        for step, amt in ((0, 0.085), (1, 0.045)):
            beam = Mask(w, h).poly([(x0 + 6 + step * 6, 14 + step * 8), (x0 + 44, 14 + step * 8),
                                    (x0 + 126 - step * 10, h), (x0 + 40 - step * 10, h)])
            bit.paint(beam & bayer_pick(h, w, amt), mix(light.sun, (255, 255, 255), 0.30))
    return bit


# ---------------------------------------------------------------------------
def parallax(bit: Bitmap, shift: float) -> Bitmap:
    """Сдвиг слоя по горизонтали с заворотом — для камеры без швов."""
    if abs(shift) < 0.5:
        return bit
    s = int(round(shift)) % bit.w
    out = Bitmap(bit.w, bit.h)
    out.rgb = np.roll(bit.rgb, s, axis=1)
    out.mask.m[:] = True
    return out


def rain(bit: Bitmap, seed: int = 0, density: float = 0.5, wind: float = -1.0) -> None:
    rng = np.random.default_rng(seed)
    n = int(bit.w * bit.h * 0.004 * density)
    for _ in range(n):
        x = int(rng.integers(0, bit.w)); y = int(rng.integers(0, bit.h))
        ln = int(rng.integers(3, 7))
        for j in range(ln):
            xx, yy = x + int(j * wind * 0.5), y + j
            if 0 <= xx < bit.w and 0 <= yy < bit.h:
                bit.rgb[yy, xx] = (206, 218, 232)


def fog(bit: Bitmap, light: Light, horizon: float = 0.62, amount: float = 0.5) -> None:
    hz = int(bit.h * horizon)
    band = Mask(bit.w, bit.h).rect(0, hz - 26, bit.w, hz + 10)
    bit.paint(band & bayer_pick(bit.h, bit.w, amount * 0.26), mix(light.haze, (255, 255, 255), 0.15))


def build(kind: str, light: Light, seed: int = 0, w: int = W, h: int = H) -> Bitmap:
    """Готовые сцены: каждый фон — несколько слоёв, склеенных в один растр."""
    bit = Bitmap(w, h)
    if kind == "city_day" or kind == "city_sunset" or kind == "city_night":
        bit = sky(light, w, h, 0.66, seed)
        clouds(bit, light, 0.66, seed + 1, 4)
        skyline(bit, light, 0.66, seed + 2, 1.0, 0.40, 0.25, 0.55)
        skyline(bit, light, 0.66, seed + 3, 1.2, 0.26, 0.5, 0.15)
        ground(bit, light, 0.66, seed + 4, "road")
        fence(bit, light, 0.66, 6)
    elif kind == "park":
        bit = sky(light, w, h, 0.60, seed)
        clouds(bit, light, 0.60, seed + 1, 5)
        skyline(bit, light, 0.60, seed + 2, 0.9, 0.20, 0.2, 0.65)
        ground(bit, light, 0.60, seed + 3, "grass")
        for i, tx in enumerate((18, 62, 118, 176, 232)):
            tree(bit, light, tx, int(h * 0.60) + 6 + (i % 2) * 3, 44 + (i % 3) * 8, seed + 10 + i,
                 "sakura" if i % 2 == 0 else "green")
        tree(bit, light, 40, int(h * 0.60) - 4, 34, seed + 30, "sakura", 0.35)
    elif kind == "school":
        bit = sky(light, w, h, 0.70, seed)
        clouds(bit, light, 0.70, seed + 1, 4)
        skyline(bit, light, 0.70, seed + 2, 0.7, 0.16, 0.3, 0.65)
        school(bit, light, 0.70, seed + 3)
        ground(bit, light, 0.70, seed + 4, "grass")
        tree(bit, light, 24, int(h * 0.70) + 10, 40, seed + 6, "sakura")
        tree(bit, light, 232, int(h * 0.70) + 12, 46, seed + 7, "green")
    elif kind == "rooftop":
        bit = sky(light, w, h, 0.56, seed)
        clouds(bit, light, 0.56, seed + 1, 6, 1.2)
        skyline(bit, light, 0.66, seed + 2, 1.1, 0.42, 0.3, 0.45)
        # бетон крыши
        bit.paint(Mask(w, h).rect(0, int(h * 0.66), w, int(h * 0.72)),
                  mix((156, 156, 162), light.haze, 0.3))
        bit.paint(Mask(w, h).rect(0, int(h * 0.72), w, h), mix((124, 124, 132), light.haze, 0.25))
        for x in range(0, w, 32):
            bit.paint(Mask(w, h).rect(x, int(h * 0.72), x + 1, h), mix((96, 96, 104), light.shadow, 0.2))
        # сетка-ограждение
        for x in range(6, w, 14):
            bit.paint(Mask(w, h).rect(x, int(h * 0.44), x + 1, int(h * 0.66)),
                      mix((120, 126, 140), light.haze, 0.35))
        bit.paint(Mask(w, h).rect(0, int(h * 0.44), w, int(h * 0.45)), mix((120, 126, 140), light.haze, 0.35))
        bit.paint(Mask(w, h).rect(0, int(h * 0.62), w, int(h * 0.63)), mix((120, 126, 140), light.haze, 0.35))
    elif kind == "room":
        bit = classroom(light, w, h, seed)
    elif kind == "station":
        bit = sky(light, w, h, 0.62, seed)
        clouds(bit, light, 0.62, seed + 1, 4)
        skyline(bit, light, 0.62, seed + 2, 1.0, 0.30, 0.4, 0.5)
        ground(bit, light, 0.62, seed + 3, "road")
        # навес платформы
        bit.paint(Mask(w, h).rect(0, int(h * 0.24), w, int(h * 0.28)),
                  mix((76, 82, 96), light.haze, 0.35))
        for x in range(12, w, 54):
            bit.paint(Mask(w, h).rect(x, int(h * 0.28), x + 3, int(h * 0.66)),
                      mix((96, 100, 112), light.haze, 0.3))
        bit.paint(Mask(w, h).rect(0, int(h * 0.66), w, int(h * 0.70)), mix((196, 186, 150), light.haze, 0.2))
    else:
        bit = sky(light, w, h, 0.62, seed)
        ground(bit, light, 0.62, seed + 1, "grass")
    if light.fog:
        fog(bit, light, 0.62, light.fog)
    return bit
