"""Низкорезолюционный растр и примитивы рисования.

Идея: всё рисуется на холсте 128x128 (true pixel-art resolution), а на выход
отдаётся целочисленным апскейлом x2 -> 256x256. Никакого сглаживания нигде:
соседние пиксели не смешиваются, иначе пиксель-арт «мылится».
"""
from __future__ import annotations

import numpy as np

RGB = tuple[int, int, int]


class Raster:
    """RGBA-растр. Альфа бинарная (0 или 255) — это принципиально: полупрозрачность
    в пиксель-арте заменяется дизерингом, а не альфа-смешением."""

    def __init__(self, w: int, h: int, color=(0, 0, 0, 0)):
        self.w, self.h = w, h
        self.px = np.zeros((h, w, 4), dtype=np.uint8)
        if color[3] if len(color) == 4 else False:
            self.px[:] = color

    # --- служебное ---------------------------------------------------------
    def copy(self) -> "Raster":
        r = Raster(self.w, self.h)
        r.px = self.px.copy()
        return r

    @property
    def mask(self) -> np.ndarray:
        return self.px[..., 3] > 0

    def clear(self) -> None:
        self.px[:] = 0

    # --- пиксели -----------------------------------------------------------
    def put(self, x: int, y: int, color) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y, x, :3] = color[:3]
            self.px[y, x, 3] = 255

    def fill(self, color) -> None:
        self.px[..., :3] = color[:3]
        self.px[..., 3] = 255

    def rect(self, x0: int, y0: int, x1: int, y1: int, color) -> None:
        """Прямоугольник включительно по обеим границам."""
        x0, x1 = sorted((int(round(x0)), int(round(x1))))
        y0, y1 = sorted((int(round(y0)), int(round(y1))))
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(self.w - 1, x1), min(self.h - 1, y1)
        if x0 > x1 or y0 > y1:
            return
        self.px[y0 : y1 + 1, x0 : x1 + 1, :3] = color[:3]
        self.px[y0 : y1 + 1, x0 : x1 + 1, 3] = 255

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, color) -> None:
        yy, xx = np.ogrid[0 : self.h, 0 : self.w]
        m = ((xx - cx) / max(rx, 0.5)) ** 2 + ((yy - cy) / max(ry, 0.5)) ** 2 <= 1.0
        self._paint(m, color)

    def poly(self, pts, color) -> None:
        pts = np.asarray(pts, dtype=np.float32)
        if len(pts) < 3:
            return
        yy, xx = np.ogrid[0 : self.h, 0 : self.w]
        inside = np.zeros((self.h, self.w), dtype=bool)
        n = len(pts)
        for i in range(n):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % n]
            if y0 == y1:
                continue
            cond = (y0 > yy) != (y1 > yy)
            xint = (x1 - x0) * (yy - y0) / (y1 - y0) + x0
            inside ^= cond & (xx < xint)
        self._paint(inside, color)

    def line(self, x0, y0, x1, y1, color, width: int = 1) -> None:
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            if width <= 1:
                self.put(x0, y0, color)
            else:
                self.rect(x0 - width // 2, y0 - width // 2, x0 + width // 2, y0 + width // 2, color)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def _paint(self, m: np.ndarray, color) -> None:
        self.px[m, :3] = color[:3]
        self.px[m, 3] = 255

    # --- операции с силуэтом ----------------------------------------------
    def shade_mask(self, m: np.ndarray, color) -> None:
        """Закрасить маску цветом (маска bool)."""
        self.px[m, :3] = color[:3]
        self.px[m, 3] = 255

    @staticmethod
    def inner_edge(m: np.ndarray, dx: int = 1, dy: int = 1) -> np.ndarray:
        """Пиксели маски, у которых сосед справа/снизу вне маски.

        Используется для cel-shading: одна «тень» на одну форму, без градиентов.
        """
        e = m.copy()
        shifted = np.zeros_like(m)
        h, w = m.shape
        if dy > 0:
            shifted[: h - dy, :] |= m[dy:, :]
        elif dy < 0:
            shifted[-dy:, :] |= m[: h + dy, :]
        if dx > 0:
            shifted[:, : w - dx] |= m[:, dx:]
        elif dx < 0:
            shifted[:, -dx:] |= m[:, : w + dx]
        return m & ~shifted

    @staticmethod
    def dilate(m: np.ndarray, r: int = 1) -> np.ndarray:
        out = m.copy()
        for _ in range(r):
            g = out.copy()
            g[1:, :] |= out[:-1, :]
            g[:-1, :] |= out[1:, :]
            g[:, 1:] |= out[:, :-1]
            g[:, :-1] |= out[:, 1:]
            out = g
        return out

    @staticmethod
    def erode(m: np.ndarray, r: int = 1) -> np.ndarray:
        return ~Raster.dilate(~m, r)

    def outline(self, m: np.ndarray, color, thickness: int = 1) -> None:
        """Обводка силуэта — контур в один пиксель, обязательный атрибут читаемого спрайта."""
        edge = Raster.dilate(m, thickness) & ~m
        self.px[edge, :3] = color[:3]
        self.px[edge, 3] = 255

    # --- композиция --------------------------------------------------------
    def blit(self, src: "Raster", x: int, y: int, flip: bool = False) -> None:
        """Наложить спрайт с учётом его альфы (двоичная, поэтому просто копирование)."""
        img = src.px[::-1, ::-1] if flip else src.px
        xs, ys = int(round(x)), int(round(y))
        h, w = img.shape[:2]
        x0, y0 = max(0, xs), max(0, ys)
        x1, y1 = min(self.w, xs + w), min(self.h, ys + h)
        if x0 >= x1 or y0 >= y1:
            return
        sub = img[y0 - ys : y1 - ys, x0 - xs : x1 - xs]
        m = sub[..., 3] > 0
        dst = self.px[y0:y1, x0:x1]
        dst[m, :3] = sub[m, :3]
        dst[m, 3] = 255

    def to_rgb(self, bg: RGB = (0, 0, 0)) -> np.ndarray:
        out = np.empty((self.h, self.w, 3), dtype=np.uint8)
        out[:] = bg
        m = self.px[..., 3] > 0
        out[m] = self.px[m, :3]
        return out


class Frame:
    """Кадр сцены: RGB-подложка + позиции слоёв + служебные поля для анимации."""

    def __init__(self, w: int, h: int, bg: RGB = (0, 0, 0)):
        self.w, self.h = w, h
        self.px = np.empty((h, w, 3), dtype=np.uint8)
        self.px[:] = bg

    def layer(self) -> Raster:
        return Raster(self.w, self.h)

    def blit(self, src: Raster, x: int, y: int, flip: bool = False) -> None:
        img = src.px[:, ::-1] if flip else src.px
        xs, ys = int(round(x)), int(round(y))
        h, w = img.shape[:2]
        x0, y0 = max(0, xs), max(0, ys)
        x1, y1 = min(self.w, xs + w), min(self.h, ys + h)
        if x0 >= x1 or y0 >= y1:
            return
        sub = img[y0 - ys : y1 - ys, x0 - xs : x1 - xs]
        m = sub[..., 3] > 0
        dst = self.px[y0:y1, x0:x1]
        if flip:
            dst[m, :3] = sub[m, :3]
        else:
            dst[m, :3] = sub[m, :3]

    def upscale(self, k: int = 2) -> np.ndarray:
        return np.repeat(np.repeat(self.px, k, axis=0), k, axis=1)


def halftone(h: int, w: int, color_a, color_b, t: float, bayer=None) -> np.ndarray:
    """Дизеринг между двумя цветами с заданной долей t (0..1)."""
    from .palette import BAYER4

    bayer = BAYER4 if bayer is None else bayer
    pat = np.tile(bayer, (h // bayer.shape[0] + 1, w // bayer.shape[1] + 1))[:h, :w]
    pick = pat < t
    out = np.empty((h, w, 3), dtype=np.uint8)
    out[:] = np.array(color_a[:3], dtype=np.uint8)
    out[pick] = np.array(color_b[:3], dtype=np.uint8)
    return out
