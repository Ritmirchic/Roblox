"""Процедурные фоны в стиле пиксель-арт аниме 90-х.

Каждый фон — набор слоёв с разным коэффициентом параллакса. Слои рисуются
целиком в numpy и кэшируются (фон не зависит от времени, кроме мелочей:
звёзды, окна, дождь), поэтому 60-секундный эпизод рендерится быстро.

Главные приёмы:
  * градиент неба — упорядоченный дизеринг Байера (2-4 цвета);
  * дальний город — силуэт без деталей, ближний — с окнами и тенями;
  * контровой свет: у силуэтов на закате подсвечен верхний край;
  * всё выровнено по целым пикселям, никакого сглаживания.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .canvas import Frame, Raster
from .palette import BAYER4, Palette, bayer_gradient, dithered_ramp, hex_rgb, lighten, mix, shade


def sky(pal: Palette, w: int, h: int, sun_key: str = "sun") -> np.ndarray:
    """Небо сцены: 4 опорных цвета и дизеринг между ними."""
    return dithered_ramp(
        h,
        w,
        [
            (0.0, pal["sky_top"]),
            (0.45, pal["sky_mid"]),
            (0.72, pal["sky_low"]),
            (1.0, lighten(pal["sky_low"], 1.10)),
        ],
        levels=5,
    )

W, H = 128, 128


# ---------------------------------------------------------------------------
def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def _fill_rect_arr(a: np.ndarray, x0, y0, x1, y1, color) -> None:
    x0, x1 = sorted((int(x0), int(x1)))
    y0, y1 = sorted((int(y0), int(y1)))
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(a.shape[1] - 1, x1), min(a.shape[0] - 1, y1)
    if x0 > x1 or y0 > y1:
        return
    a[y0 : y1 + 1, x0 : x1 + 1] = color[:3]


def dither_band(a: np.ndarray, y0, y1, c0, c1, x0=0, x1=None) -> None:
    """Горизонтальная полоса с дизерингом между двумя цветами (для облаков, светов)."""
    x1 = a.shape[1] if x1 is None else x1
    h = max(1, y1 - y0)
    for y in range(y0, y1):
        t = (y - y0) / h
        for x in range(x0, x1):
            b = BAYER4[(y - y0) % 4, (x - x0) % 4]
            a[y, x] = c1[:3] if b < t else c0[:3]


def star_field(a: np.ndarray, rng, n: int, color, y_max: int) -> None:
    for _ in range(n):
        x, y = int(rng.integers(0, a.shape[1])), int(rng.integers(0, y_max))
        a[y, x] = color[:3]
        if rng.random() < 0.22:  # крупная звезда крестиком
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < a.shape[1] and 0 <= yy < a.shape[0]:
                    a[yy, xx] = mix(color, (0, 0, 0), 0.25)


def draw_disc(a: np.ndarray, cx, cy, r, color, glow=None, glow_r=None) -> None:
    """Диск солнца/луны с затухающим свечением из концентрических колец дизеринга.

    Кольца (а не шум Байера по кругу) дают ровный «ореол» без артефактов.
    """
    yy, xx = np.ogrid[0 : a.shape[0], 0 : a.shape[1]]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    if glow is not None:
        gr = glow_r or int(r * 2.2)
        for rad in range(int(r) + 1, int(gr)):
            ring = (d >= rad - 0.5) & (d < rad + 0.5)
            dens = (1.0 - (rad - r) / max(1.0, gr - r)) ** 2
            if (rad % 2 == 0) and dens > 0.25:
                t = 0.55 * dens
            elif dens > 0.55:
                t = 0.35 * dens
            else:
                continue
            a[ring] = (a[ring] * (1.0 - t) + np.array(glow, dtype=np.float32) * t).astype(np.uint8)
    a[d <= r] = color[:3]
    # блик
    by, bx = int(cy - r * 0.4), int(cx - r * 0.45)
    a[max(0, by) : max(0, by) + 1, max(0, bx) : max(0, bx) + max(1, int(r * 0.4))] = lighten(color, 1.25)[:3]


# ---------------------------------------------------------------------------
class Scene:
    """Базовый класс фона. draw() заполняет кадр целиком."""

    name = "scene"
    parallax = 0.0

    def draw(self, frame: Frame, cam_x: float = 0.0, cam_y: float = 0.0, t: float = 0.0, pal: Palette | None = None):
        raise NotImplementedError

    def horizon(self) -> int:
        return 92


# ---------------------------------------------------------------------------
class Rooftop(Scene):
    """Классика: крыша школы, сетка-рабица, закат, город внизу."""

    name = "rooftop"
    parallax = 1.0

    def __init__(self, seed: int = 7, fence: bool = True, sun: bool = True):
        self.seed = seed
        self.fence = fence
        self.sun = sun
        self._cache: dict = {}

    def _base(self, pal: Palette, w: int, h: int) -> np.ndarray:
        key = ("base", pal.name, w, h)
        if key in self._cache:
            return self._cache[key].copy()
        a = sky(pal, w, h)
        rng = _rng(self.seed)
        # солнце/луна
        if self.sun:
            cx = int(w * (0.24 if "dusk" in pal.name else 0.72))
            cy = int(h * (0.30 if "dusk" in pal.name else 0.18))
            body = pal.get("sun") if pal.name != "night" else pal.get("moon")
            draw_disc(a, cx, cy, 7 if pal.name != "night" else 5, body,
                      glow=lighten(pal["sky_low"], 1.20), glow_r=20)
        # облака: горизонтальные мазки с дизерингом
        for i in range(5):
            cy = int(h * (0.14 + 0.11 * i)) + int(rng.integers(-3, 4))
            cx = int(rng.integers(-20, w + 20))
            cw = int(rng.integers(16, 34))
            chh = int(rng.integers(2, 5))
            col = pal["cloud_dark"] if i % 2 else pal["cloud_light"]
            for yy in range(cy, cy + chh):
                t = (yy - cy) / max(1, chh)
                half = int(cw * (1 - abs(t - 0.35) * 0.9))
                xx0, xx1 = cx - half // 2, cx + half // 2
                pat = np.tile(BAYER4, (4, 4))
                for xx in range(max(0, xx0), min(w, xx1)):
                    if pat[(yy - cy) % 4, (xx - cx) % 4] < (1 - t) * 0.8:
                        a[yy, xx] = col[:3]
            # подсветка облака снизу на закате
            if pal.name == "dusk":
                for xx in range(max(0, cx - cw // 2), min(w, cx + cw // 2)):
                    yy = cy + chh
                    if yy < h and (xx + cy) % 3 != 0:
                        a[yy, xx] = lighten(pal["cloud_light"], 1.15)[:3]
        # дальний город
        base_y = int(h * 0.78)
        x = -10
        while x < w + 10:
            rng2 = _rng(self.seed * 131 + x)
            bw = int(rng2.integers(6, 14))
            bh = int(rng2.integers(10, 30))
            _fill_rect_arr(a, x, base_y - bh, x + bw, base_y, pal["city_far"])
            if rng2.random() < 0.3:  # антенна/труба
                _fill_rect_arr(a, x + bw // 2, base_y - bh - 5, x + bw // 2 + 1, base_y - bh, pal["city_far"])
            x += bw + int(rng2.integers(0, 3))
        # средний город
        mid_y = int(h * 0.84)
        x = -6
        while x < w + 10:
            rng3 = _rng(self.seed * 977 + x)
            bw = int(rng3.integers(9, 20))
            bh = int(rng3.integers(12, 34))
            _fill_rect_arr(a, x, mid_y - bh, x + bw, mid_y, pal["city_mid"])
            # окна
            for wy in range(mid_y - bh + 3, mid_y - 3, 4):
                for wx in range(x + 2, x + bw - 2, 3):
                    if rng3.random() < 0.42:
                        lit = pal["window_on"] if rng3.random() < 0.7 else shade(pal["window_on"], 0.7)
                        _fill_rect_arr(a, wx, wy, wx + 1, wy + 1, lit if pal.name in ("night", "dusk") else pal["window_off"])
                    elif pal.name in ("night", "dusk"):
                        _fill_rect_arr(a, wx, wy, wx + 1, wy + 1, pal["window_off"])
            # контровой свет по верхней кромке
            _fill_rect_arr(a, x, mid_y - bh, x + bw, mid_y - bh, lighten(pal["city_mid"], 1.25) if pal.name == "dusk" else shade(pal["city_mid"], 1.15))
            x += bw + int(rng3.integers(1, 4))
        self._cache[key] = a.copy()
        return a

    def draw(self, frame: Frame, cam_x=0.0, cam_y=0.0, t=0.0, pal=None):
        pal = pal or Palette("x", {})
        w, h = frame.w, frame.h
        base = self._base(pal, w, h)
        ox = int(round(cam_x))
        oy = int(round(cam_y))
        # прокрутка: сдвиг с заворотом по X
        idx = (np.arange(w) - ox) % w
        frame.px[:] = base[:, idx]

        r = Raster(w, h)
        # пол крыши
        floor_y = 96 + oy
        if floor_y < h:
            floor = np.zeros((h, w), dtype=bool)
            floor[floor_y:] = True
            r.shade_mask(floor, pal.get("roof", (36, 26, 51)))
            # плитка
            for y in range(floor_y, h, 6):
                for x in range(-ox % 16, w, 16):
                    r.put(x, y, shade(pal.get("roof", (36, 26, 51)), 0.8))
            # парапет
            r.rect(0, floor_y, w - 1, floor_y + 1, lighten(pal.get("roof", (36, 26, 51)), 1.35))
            r.rect(0, floor_y + 2, w - 1, floor_y + 2, shade(pal.get("roof", (36, 26, 51)), 0.65))
        # сетка-рабица
        if self.fence:
            fy0, fy1 = 52 + oy, floor_y + 1
            fcol = pal.get("fence", (20, 16, 32))
            for y in range(fy0, fy1):
                fade = 1.0 if y < fy1 - 22 else 0.55  # к низу сетка «тает»
                for x in range(w):
                    xx = x - ox
                    on = ((xx + y) % 7 == 0) or ((xx - y) % 7 == 0)
                    if on and ((x * 7 + y * 3) % 10) / 10.0 < fade:
                        r.put(x, y, fcol)
            # столбы и верхняя перекладина
            for px in range(-ox % 44, w, 44):
                r.rect(px, fy0 - 2, px + 1, fy1, shade(fcol, 1.25))
            r.rect(0, fy0 - 2, w - 1, fy0, shade(fcol, 1.35))
        frame.blit(r, 0, 0)


# ---------------------------------------------------------------------------
class Street(Scene):
    """Ночная улица: фонари, дорога, магазинчики, столбы с проводами."""

    name = "street"
    parallax = 1.0

    def __init__(self, seed: int = 21, lamps: int = 3, rain: bool = False):
        self.seed = seed
        self.lamps = lamps
        self.rain = rain
        self._base = None

    def _build(self, pal: Palette, w: int, h: int) -> np.ndarray:
        a = sky(pal, w, h)
        rng = _rng(self.seed)
        if pal.name == "night":
            star_field(a, rng, 40, pal["star"], int(h * 0.3))
            draw_disc(a, int(w * 0.78), int(h * 0.16), 6, pal["moon"], glow=shade(pal["moon"], 0.6), glow_r=15)
        # здания по обеим сторонам
        base_y = int(h * 0.72)
        x = -8
        while x < w + 8:
            rng2 = _rng(self.seed * 37 + x)
            bw = int(rng2.integers(14, 26))
            bh = int(rng2.integers(24, 48))
            col = pal["city_mid"] if x % 2 else pal["city_far"]
            _fill_rect_arr(a, x, base_y - bh, x + bw, base_y, col)
            _fill_rect_arr(a, x, base_y - bh, x + bw, base_y - bh, lighten(col, 1.3) if pal.name == "dusk" else shade(col, 1.2))
            for wy in range(base_y - bh + 4, base_y - 4, 6):
                for wx in range(x + 3, x + bw - 3, 5):
                    on = rng2.random() < 0.35
                    _fill_rect_arr(a, wx, wy, wx + 2, wy + 1,
                                   mix(pal["window_on"], pal["city_far"], 0.25 if on else 0.85))
            # вывеска
            if rng2.random() < 0.45:
                sy = base_y - bh + 6
                sx = x + 3
                _fill_rect_arr(a, sx, sy, sx + 9, sy + 4, pal["window_on"] if pal.name != "day" else pal["accent"])
                _fill_rect_arr(a, sx + 1, sy + 1, sx + 8, sy + 3, shade(pal["window_on"], 0.55))
            x += bw + int(rng2.integers(0, 3))
        # тротуар и дорога
        walk_y = int(h * 0.72)
        _fill_rect_arr(a, 0, walk_y, w, walk_y + 4, shade(pal["city_near"], 1.4))
        _fill_rect_arr(a, 0, walk_y + 5, w, h, pal["city_near"])
        for x in range(0, w, 18):
            _fill_rect_arr(a, x, walk_y + 12, x + 9, walk_y + 14, shade(pal["city_near"], 1.6))
        # фонари
        for i in range(self.lamps):
            lx = 14 + i * 42
            _fill_rect_arr(a, lx, walk_y - 34, lx + 1, walk_y, shade(pal["city_near"], 0.9))
            _fill_rect_arr(a, lx - 3, walk_y - 36, lx + 4, walk_y - 34, shade(pal["city_near"], 1.1))
            _fill_rect_arr(a, lx - 2, walk_y - 34, lx + 3, walk_y - 32, pal["window_on"])
            # световое пятно на земле
            for yy in range(walk_y - 2, h):
                for xx in range(max(0, lx - 16), min(w, lx + 17)):
                    dxn = (xx - lx) / 15.0
                    dyn = (yy - walk_y) / max(1.0, (h - walk_y))
                    d = (dxn * dxn) / max(0.05, dyn + 0.25) + dyn * 0.4
                    if d < 1.0 and BAYER4[yy % 4, xx % 4] < 0.55 * (1 - d):
                        a[yy, xx] = mix(a[yy, xx], pal["window_on"], 0.45)
            # мягкое свечение вокруг плафона
            for yy in range(walk_y - 40, walk_y - 30):
                for xx in range(max(0, lx - 8), min(w, lx + 9)):
                    dd = math.hypot(xx - lx, (yy - (walk_y - 33)) * 1.6)
                    if dd < 8 and BAYER4[yy % 4, xx % 4] < 0.5 * (1 - dd / 8):
                        a[yy, xx] = mix(a[yy, xx], pal["window_on"], 0.4)
        # провода
        for i, yy in enumerate((int(h * 0.2), int(h * 0.24), int(h * 0.28))):
            for x in range(w):
                y = yy + int(2.5 * math.sin(x * 0.06 + i))
                if 0 <= y < h:
                    a[y, x] = shade(pal["city_near"], 0.7)
        return a

    def draw(self, frame, cam_x=0.0, cam_y=0.0, t=0.0, pal=None):
        pal = pal or Palette("x", {})
        if self._base is None or self._base_pal is not pal:
            self._base = self._build(pal, frame.w, frame.h)
            self._base_pal = pal
        ox = int(round(cam_x))
        frame.px[:] = self._base[:, (np.arange(frame.w) - ox) % frame.w]

    _base_pal = None


# ---------------------------------------------------------------------------
class Room(Scene):
    """Комната: окно, шторы, стол, лампа, вид на город."""

    name = "room"
    parallax = 0.6

    def __init__(self, seed: int = 3):
        self.seed = seed
        self._base = None

    def _build(self, pal: Palette, w: int, h: int) -> np.ndarray:
        a = np.zeros((h, w, 3), dtype=np.uint8)
        wall = mix(mix(pal["city_mid"], pal["sky_low"], 0.45), (70, 60, 66), 0.35)
        _fill_rect_arr(a, 0, 0, w, h, wall)
        # обои: вертикальные полосы
        for x in range(0, w, 8):
            _fill_rect_arr(a, x, 0, x, h, shade(wall, 0.92))
        # окно
        wx0, wy0, wx1, wy1 = 30, 18, 96, 68
        _fill_rect_arr(a, wx0 - 2, wy0 - 2, wx1 + 2, wy1 + 2, shade(wall, 0.7))
        a[wy0:wy1, wx0:wx1] = sky(pal, wx1 - wx0, wy1 - wy0)
        rng = _rng(self.seed)
        if pal.name == "night":
            star_field(a[wy0:wy1, wx0:wx1], rng, 25, pal["star"], int((wy1 - wy0) * 0.5))
            draw_disc(a, wx0 + 46, wy0 + 12, 5, pal["moon"])
        # город в окне
        for i in range(9):
            bx = wx0 + i * 8 + int(rng.integers(0, 3))
            bh = int(rng.integers(6, 18))
            _fill_rect_arr(a, bx, wy1 - bh, bx + 6, wy1, pal["city_far"])
            for wy in range(wy1 - bh + 2, wy1 - 2, 3):
                if rng.random() < 0.5:
                    _fill_rect_arr(a, bx + 1, wy, bx + 2, wy, pal["window_on"])
        # рама
        midx, midy = (wx0 + wx1) // 2, (wy0 + wy1) // 2
        _fill_rect_arr(a, midx, wy0, midx + 1, wy1, shade(wall, 1.2))
        _fill_rect_arr(a, wx0, midy, wx1, midy + 1, shade(wall, 1.2))
        _fill_rect_arr(a, wx0 - 2, wy0 - 2, wx1 + 2, wy0, shade(wall, 1.35))
        _fill_rect_arr(a, wx0 - 4, wy1 + 2, wx1 + 4, wy1 + 4, shade(wall, 0.6))
        # шторы
        for side in (0, 1):
            sx0 = (wx0 - 14) if side == 0 else (wx1 + 2)
            for x in range(sx0, sx0 + 12):
                if not (0 <= x < w):
                    continue
                col = mix(pal["skirt"], pal["sky_low"], 0.35) if (x - sx0) % 4 else shade(mix(pal["skirt"], pal["sky_low"], 0.3), 0.8)
                _fill_rect_arr(a, x, 10, x, wy1 + 12, col)
        # пол
        _fill_rect_arr(a, 0, 100, w, h, mix(shade(wall, 0.75), (90, 70, 60), 0.35))
        for x in range(0, w, 12):
            _fill_rect_arr(a, x, 100, x, h, shade(mix(shade(wall, 0.75), (90, 70, 60), 0.35), 0.85))
        # плакат на стене
        _fill_rect_arr(a, 8, 30, 26, 52, pal["uniform"])
        _fill_rect_arr(a, 9, 31, 25, 51, mix(pal["accent"], pal["sky_low"], 0.35))
        _fill_rect_arr(a, 12, 36, 22, 40, pal["sky_top"])
        _fill_rect_arr(a, 14, 44, 20, 49, pal["city_far"])
        # стол
        _fill_rect_arr(a, 0, 92, w, 96, shade(wall, 1.35))
        _fill_rect_arr(a, 6, 96, 10, h, shade(wall, 0.6))
        _fill_rect_arr(a, w - 12, 96, w - 8, h, shade(wall, 0.6))
        # лампа
        _fill_rect_arr(a, 104, 60, 106, 92, shade(wall, 0.8))
        _fill_rect_arr(a, 96, 52, 112, 60, pal.get("accent"))
        for yy in range(52, 92):
            for xx in range(88, 120):
                if BAYER4[yy % 4, xx % 4] < 0.12:
                    a[yy, xx] = mix(a[yy, xx], pal.get("accent"), 0.4)
        # кружка
        _fill_rect_arr(a, 78, 86, 86, 92, pal["uniform"])
        _fill_rect_arr(a, 86, 87, 88, 90, pal["uniform_shade"])
        return a

    def draw(self, frame, cam_x=0.0, cam_y=0.0, t=0.0, pal=None):
        pal = pal or Palette("x", {})
        if self._base is None or getattr(self, "_pal", None) is not pal:
            self._base = self._build(pal, frame.w, frame.h)
            self._pal = pal
        frame.px[:] = self._base


# ---------------------------------------------------------------------------
class Park(Scene):
    """Парк/сакура: трава, деревья, лепестки, дорожка, фонари."""

    name = "park"
    parallax = 1.0

    def __init__(self, seed: int = 11):
        self.seed = seed
        self._base = None

    def _build(self, pal: Palette, w: int, h: int) -> np.ndarray:
        a = sky(pal, w, h)
        rng = _rng(self.seed)
        # холмы
        for i, (yy, col) in enumerate(((int(h * 0.66), pal["city_far"]), (int(h * 0.7), pal["city_mid"]))):
            for x in range(w):
                y = yy + int(4 * math.sin(x * 0.05 + i * 2) + 2 * math.cos(x * 0.11))
                _fill_rect_arr(a, x, y, x, h, col)
        # трава
        for x in range(w):
            y = int(h * 0.78) + int(2 * math.sin(x * 0.17))
            _fill_rect_arr(a, x, y, x, h, pal["city_near"] if pal.name != "green" else mix(pal["city_near"], (40, 80, 40), 0.5))
        for x in range(0, w, 3):
            if rng.random() < 0.6:
                y = int(h * 0.78) + int(2 * math.sin(x * 0.17))
                a[y - 1, x] = lighten(a[y, x], 1.4)
        # дорожка
        for y in range(int(h * 0.86), h):
            t = (y - h * 0.86) / (h * 0.14)
            half = int(14 + 26 * t)
            _fill_rect_arr(a, w // 2 - half, y, w // 2 + half, y, mix(pal["roof"], (200, 190, 170), 0.45))
        # деревья-сакура
        for i, tx in enumerate((14, 108, 60)):
            base_y = int(h * 0.86) + i
            trunk = mix(pal["hair_shade"], (60, 40, 30), 0.5)
            _fill_rect_arr(a, tx, base_y - 26, tx + 2, base_y, trunk)
            _fill_rect_arr(a, tx - 3, base_y - 20, tx, base_y - 16, trunk)
            # крона: несколько перекрывающихся кругов с дизерингом
            crown = mix(pal["scarf"], (255, 200, 220), 0.5)
            crown_d = shade(crown, 0.78)
            crown_l = lighten(crown, 1.15)
            yy, xx = np.ogrid[0:h, 0:w]
            pat = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))[:h, :w]
            blobs = []
            for k in range(6):
                cx = tx + int(rng.integers(-13, 13))
                cy = base_y - 30 + int(rng.integers(-9, 7))
                rr = int(rng.integers(7, 12))
                blobs.append(((xx - cx) ** 2 + (yy - cy) ** 2 <= rr * rr, cx, cy, rr))
            for m, cx, cy, rr in blobs:
                a[m] = crown[:3]
            for m, cx, cy, rr in blobs:
                # тень снизу-справа
                sm = m & (yy > cy + rr * 0.15) & (xx > cx - rr * 0.5)
                a[sm & (pat >= 0.45)] = crown_d[:3]
                # свет сверху-слева
                lm = m & (yy < cy - rr * 0.3) & (xx < cx + rr * 0.4)
                a[lm & (pat <= 0.5)] = crown_l[:3]
            # ветки
            for k in range(3):
                bx = tx + (k - 1) * 6
                _fill_rect_arr(a, bx, base_y - 22 - k * 2, bx + 1, base_y - 14, shade(trunk, 1.1))
        # фонарь
        _fill_rect_arr(a, 88, int(h * 0.62), 89, int(h * 0.86), shade(pal["roof"], 1.3))
        _fill_rect_arr(a, 85, int(h * 0.6), 92, int(h * 0.62), pal.get("accent"))
        return a

    def draw(self, frame, cam_x=0.0, cam_y=0.0, t=0.0, pal=None):
        pal = pal or Palette("x", {})
        if self._base is None or getattr(self, "_pal", None) is not pal:
            self._base = self._build(pal, frame.w, frame.h)
            self._pal = pal
        ox = int(round(cam_x))
        frame.px[:] = self._base[:, (np.arange(frame.w) - ox) % frame.w]


SCENES = {
    "rooftop": Rooftop,
    "street": Street,
    "room": Room,
    "park": Park,
}
