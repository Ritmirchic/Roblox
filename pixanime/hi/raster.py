"""Растр высокого разрешения (внутренний 256 -> вывод 512).

Отличие от старого `canvas.py`: здесь рисование идёт через маски и полигоны
с поворотом, поэтому персонажа можно собирать из настоящих частей тела,
а не из прямоугольников. Всё по-прежнему без сглаживания: PIL рисует
полигоны «жёстко», а всё остальное — операции над булевыми масками.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

RGB = tuple[int, int, int]


def _arr(im) -> np.ndarray:
    return np.asarray(im, dtype=np.uint8)


class Mask:
    """Булева маска с примитивами. Координаты — пиксельные, y вниз."""

    __slots__ = ("m",)

    def __init__(self, w: int, h: int, fill: bool = False):
        self.m = np.full((h, w), fill, dtype=bool)

    # --- создание ----------------------------------------------------------
    @classmethod
    def of(cls, fn, w: int, h: int) -> "Mask":
        out = cls(w, h)
        im = Image.new("L", (w, h), 0)
        fn(ImageDraw.Draw(im))
        out.m = _arr(im) > 127
        return out

    def copy(self) -> "Mask":
        o = Mask(self.w, self.h)
        o.m = self.m.copy()
        return o

    @property
    def w(self) -> int:
        return self.m.shape[1]

    @property
    def h(self) -> int:
        return self.m.shape[0]

    def any(self) -> bool:
        return bool(self.m.any())

    def __and__(self, o): return self._bin(o, np.logical_and)
    def __or__(self, o): return self._bin(o, np.logical_or)
    def __invert__(self): 
        o = self.copy(); o.m = ~o.m; return o
    def __sub__(self, o): return self._bin(o, lambda a, b: a & ~b)

    def _bin(self, o, fn):
        out = self.copy()
        out.m = fn(self.m, o.m if isinstance(o, Mask) else o)
        return out

    # --- примитивы (все добавляются к маске, а не заменяют её) -------------
    def _draw(self, fn) -> "Mask":
        im = Image.new("L", (self.w, self.h), 0)
        fn(ImageDraw.Draw(im))
        self.m = self.m | (_arr(im) > 127)
        return self

    def poly(self, pts) -> "Mask":
        if len(pts) < 3:
            return self
        return self._draw(lambda d: d.polygon([(float(x), float(y)) for x, y in pts], fill=255))

    def ellipse(self, cx, cy, rx, ry) -> "Mask":
        return self._draw(lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255))

    def capsule(self, p0, p1, width: float) -> "Mask":
        w = int(max(1, round(width)))
        r = w / 2.0

        def _f(d):
            d.line([tuple(map(float, p0)), tuple(map(float, p1))], fill=255, width=w)
            for px, py in (p0, p1):
                d.ellipse([px - r, py - r, px + r, py + r], fill=255)

        return self._draw(_f)

    def rect(self, x0, y0, x1, y1) -> "Mask":
        return self._draw(lambda d: d.rectangle([x0, y0, x1, y1], fill=255))

    @property
    def _im(self):
        return Image.fromarray(np.where(self.m, 255, 0).astype(np.uint8), "L")

    # --- морфология --------------------------------------------------------
    def shift(self, dx: int, dy: int) -> "Mask":
        out = Mask(self.w, self.h)
        out.m = np.zeros_like(self.m)
        h, w = self.m.shape
        xs0, xs1 = max(0, dx), min(w, w + dx)
        ys0, ys1 = max(0, dy), min(h, h + dy)
        if xs0 < xs1 and ys0 < ys1:
            out.m[ys0:ys1, xs0:xs1] = self.m[ys0 - dy : ys1 - dy, xs0 - dx : xs1 - dx]
        return out

    def dilate(self, r: int = 1) -> "Mask":
        out = self.copy()
        for _ in range(r):
            m = out.m.copy()
            acc = m.copy()
            acc[1:, :] |= m[:-1, :]
            acc[:-1, :] |= m[1:, :]
            acc[:, 1:] |= m[:, :-1]
            acc[:, :-1] |= m[:, 1:]
            out.m = acc
        return out

    def erode(self, r: int = 1) -> "Mask":
        return ~(~self).dilate(r)

    def edge(self, dx: int = 1, dy: int = 1) -> "Mask":
        """Внутренняя кромка со стороны, противоположной сдвигу (тень)."""
        return self & ~self.shift(-dx, -dy)

    def outline(self, r: int = 1) -> "Mask":
        return self.dilate(r) & ~self


class Bitmap:
    """RGB-картинка + маска непрозрачности."""

    def __init__(self, w: int, h: int, color: RGB = (0, 0, 0)):
        self.w, self.h = w, h
        self.rgb = np.zeros((h, w, 3), dtype=np.uint8)
        self.rgb[:] = color
        self.mask = Mask(w, h)

    def paint(self, m: Mask | np.ndarray, color: RGB) -> None:
        mm = m.m if isinstance(m, Mask) else m
        self.rgb[mm] = np.array(color[:3], dtype=np.uint8)
        self.mask.m |= mm

    def paint_shifted(self, m: Mask, dx: int, dy: int, color: RGB) -> None:
        self.paint(m.shift(dx, dy), color)

    def blit(self, src: "Bitmap", x: int, y: int, flip: bool = False, clip: bool = True) -> None:
        xs, ys = int(round(x)), int(round(y))
        src_rgb = src.rgb[:, ::-1] if flip else src.rgb
        src_m = src.mask.m[:, ::-1] if flip else src.mask.m
        h, w = src_m.shape
        x0, y0 = max(0, xs), max(0, ys)
        x1, y1 = min(self.w, xs + w), min(self.h, ys + h)
        if x0 >= x1 or y0 >= y1:
            return
        sub_m = src_m[y0 - ys : y1 - ys, x0 - xs : x1 - xs]
        sub_c = src_rgb[y0 - ys : y1 - ys, x0 - xs : x1 - xs]
        dst = self.rgb[y0:y1, x0:x1]
        dst[sub_m] = sub_c[sub_m]
        self.mask.m[y0:y1, x0:x1] |= sub_m

    def scaled(self, k: int) -> "Bitmap":
        out = Bitmap(self.w * k, self.h * k)
        out.rgb = np.repeat(np.repeat(self.rgb, k, axis=0), k, axis=1)
        out.mask.m = np.repeat(np.repeat(self.mask.m, k, axis=0), k, axis=1)
        return out

    def to_pil(self):
        return Image.fromarray(self.rgb)


# ---------------------------------------------------------------------------
# геометрические помощники для скелета
# ---------------------------------------------------------------------------
def rot(pts, pivot, angle: float):
    """Повернуть точки вокруг pivot на угол (радианы)."""
    if abs(angle) < 1e-6:
        return [tuple(p) for p in pts]
    c, s = np.cos(angle), np.sin(angle)
    px, py = pivot
    out = []
    for x, y in pts:
        dx, dy = x - px, y - py
        out.append((px + dx * c - dy * s, py + dx * s + dy * c))
    return out


def along(origin, angle: float, length: float):
    """Точка на расстоянии length от origin под углом (0 = вниз)."""
    return (origin[0] + np.sin(angle) * length, origin[1] + np.cos(angle) * length)


def mix(a, b, t: float):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def shade(c, k: float):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3])


def lighten(c, k: float):
    return tuple(max(0, min(255, int(v * k + (255 * (k - 1) if k > 1 else 0) * 0.15))) for v in c[:3])


# ---------------------------------------------------------------------------
# дизеринг и фон
# ---------------------------------------------------------------------------
BAYER4 = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16.0


def bayer_pick(h: int, w: int, amount: float) -> np.ndarray:
    pat = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))[:h, :w]
    return pat < amount


def ramp(h: int, w: int, stops, levels: int = 6) -> np.ndarray:
    """Вертикальный градиент с дизерингом между опорными цветами."""
    pat = np.tile(BAYER4, (h // 4 + 2, w // 4 + 2))[:h, :w]
    out = np.empty((h, w, 3), dtype=np.uint8)
    ts = [s[0] for s in stops]
    for y in range(h):
        t = y / max(1, h - 1)
        i = 0
        while i < len(stops) - 2 and t > ts[i + 1]:
            i += 1
        t0, c0 = stops[i]
        t1, c1 = stops[min(i + 1, len(stops) - 1)]
        f = 0.0 if t1 <= t0 else min(1.0, max(0.0, (t - t0) / (t1 - t0)))
        q = f * levels
        k = int(q)
        fr = q - k
        a = mix(c0, c1, min(1.0, k / levels))
        b = mix(c0, c1, min(1.0, (k + 1) / levels))
        row = pat[y % pat.shape[0]] < fr
        out[y][row] = b
        out[y][~row] = a
    return out
