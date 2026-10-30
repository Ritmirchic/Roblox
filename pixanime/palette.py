"""Палитры и работа с цветом.

Всё в проекте рисуется ограниченными палитрами (4-6 цветов на объект, 32-48 на сцену).
Это не искусственное ограничение, а суть пиксель-арта: цвета выбираются заранее,
а переходы между ними делаются упорядоченным дизерингом (Bayer), а не градиентом.
"""
from __future__ import annotations

import numpy as np

# --- Bayer 4x4: матрица порогов для упорядоченного дизеринга -----------------
BAYER4 = (
    np.array(
        [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5],
        ],
        dtype=np.float32,
    )
    + 0.5
) / 16.0

BAYER2 = (np.array([[0, 2], [3, 1]], dtype=np.float32) + 0.5) / 4.0


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def rgb_hex(c) -> str:
    c = tuple(int(v) for v in c[:3])
    return "#%02x%02x%02x" % c


def shade(c, k: float = 0.75):
    """Затемнить цвет (k<1) — базовый тон тени в cel-shading."""
    return tuple(max(0, min(255, int(v * k))) for v in c[:3])


def lighten(c, k: float = 1.25):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3])


def mix(a, b, t: float):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def tint(c, color, t: float):
    """Смешать цвет с тоном (для ночных/закатных сцен)."""
    return mix(c, color, t)


class Palette:
    """Именованная палитра сцены.

    Цвета намеренно «грязные» и приглушённые: чистые RGB-значения выглядят как
    MS Paint, а не как кадр из аниме 90-х.
    """

    def __init__(self, name: str, colors: dict[str, str], bg: str = "#000000"):
        self.name = name
        self.raw = dict(colors)
        self.colors = {k: hex_rgb(v) for k, v in colors.items()}
        self.bg = hex_rgb(bg)

    def __getitem__(self, key: str):
        return self.colors[key]

    def get(self, key: str, default=(255, 0, 255)):
        return self.colors.get(key, default)

    def ramp(self, key: str, n: int = 3):
        """Тональная растяжка от тени к свету вокруг базового цвета."""
        base = self.colors[key]
        out = []
        for i in range(n):
            t = i / max(1, n - 1)
            out.append(mix(shade(base, 0.55), lighten(base, 1.15), t))
        return out


# ---------------------------------------------------------------------------
# Палитры сцен
# ---------------------------------------------------------------------------
DUSK = Palette(
    "dusk",
    {
        "sky_top": "#2b1b4d",
        "sky_mid": "#7a3f6b",
        "sky_low": "#e0715a",
        "sun": "#ffd08a",
        "cloud_dark": "#4a2a55",
        "cloud_light": "#c9707a",
        "city_far": "#3b2a52",
        "city_mid": "#2a1d3d",
        "city_near": "#1a1228",
        "window_on": "#ffcf6b",
        "window_off": "#2f2440",
        "roof": "#241a33",
        "fence": "#191227",
        "hair": "#4a2f4e",
        "hair_shade": "#33203a",
        "hair_light": "#8d5a77",
        "skin": "#f3c6a8",
        "skin_shade": "#cf9b84",
        "skin_light": "#ffe0c8",
        "eye": "#5a8fd6",
        "eye_dark": "#274a86",
        "uniform": "#f2f2f4",
        "uniform_shade": "#b9bcd0",
        "scarf": "#d8455f",
        "scarf_shade": "#9c2b45",
        "skirt": "#3a4a7a",
        "skirt_shade": "#26305a",
        "sock": "#f2f2f4",
        "shoe": "#2b2130",
        "outline": "#1b1226",
        "text": "#fff3e0",
        "box": "#1b1226",
        "accent": "#ffd08a",
    },
    bg="#1b1226",
)

NIGHT = Palette(
    "night",
    {
        "sky_top": "#0a0a1c",
        "sky_mid": "#141433",
        "sky_low": "#28305c",
        "moon": "#eef3ff",
        "star": "#cfd8ff",
        "cloud_dark": "#141430",
        "cloud_light": "#2b3a63",
        "city_far": "#1a1a38",
        "city_mid": "#12122a",
        "city_near": "#0a0a1a",
        "window_on": "#ffd98a",
        "window_off": "#1b1b33",
        "roof": "#141428",
        "fence": "#0e0e1e",
        "hair": "#3a2b45",
        "hair_shade": "#241a30",
        "hair_light": "#6b4f7a",
        "skin": "#e8bda6",
        "skin_shade": "#b98a7c",
        "skin_light": "#ffdcc8",
        "eye": "#7fb0e8",
        "eye_dark": "#2b4f86",
        "uniform": "#dfe2ee",
        "uniform_shade": "#9aa0c0",
        "scarf": "#c23d58",
        "scarf_shade": "#8a2440",
        "skirt": "#2f3d68",
        "skirt_shade": "#1e2748",
        "sock": "#dfe2ee",
        "shoe": "#1c1724",
        "outline": "#0b0813",
        "text": "#eaf0ff",
        "box": "#0b0813",
        "accent": "#8ad0ff",
    },
    bg="#0b0813",
)

DAY = Palette(
    "day",
    {
        "sky_top": "#5fa8e8",
        "sky_mid": "#9fd2f2",
        "sky_low": "#e8f4ff",
        "sun": "#fff6c8",
        "cloud_dark": "#c9dcef",
        "cloud_light": "#ffffff",
        "city_far": "#9fb8cc",
        "city_mid": "#7f9db5",
        "city_near": "#5c7d96",
        "window_on": "#fff0b8",
        "window_off": "#a8c0d0",
        "roof": "#c3cdd6",
        "fence": "#8c9aa6",
        "hair": "#4a2f3e",
        "hair_shade": "#31202b",
        "hair_light": "#9c6a76",
        "skin": "#ffd9bd",
        "skin_shade": "#e0ab93",
        "skin_light": "#fff0e2",
        "eye": "#4f7fd0",
        "eye_dark": "#24406e",
        "uniform": "#ffffff",
        "uniform_shade": "#c8d2e0",
        "scarf": "#e04a63",
        "scarf_shade": "#a82c46",
        "skirt": "#46578c",
        "skirt_shade": "#2f3c66",
        "sock": "#ffffff",
        "shoe": "#3a2c33",
        "outline": "#2a2030",
        "text": "#2a2030",
        "box": "#fdf6ec",
        "accent": "#e04a63",
    },
    bg="#2a2030",
)

GREEN = Palette(
    "green",
    {
        "sky_top": "#3f6f8f",
        "sky_mid": "#8fb8ae",
        "sky_low": "#d8e8c8",
        "sun": "#fff3c0",
        "cloud_dark": "#93a89a",
        "cloud_light": "#e8f0e0",
        "city_far": "#5c7a63",
        "city_mid": "#3f5c47",
        "city_near": "#2a3f30",
        "window_on": "#ffe6a0",
        "window_off": "#47604c",
        "roof": "#6a7f5c",
        "fence": "#3f5038",
        "hair": "#3d2b21",
        "hair_shade": "#281a14",
        "hair_light": "#7a5a3c",
        "skin": "#f7cfb0",
        "skin_shade": "#d3a086",
        "skin_light": "#ffe8d4",
        "eye": "#6b8f4a",
        "eye_dark": "#2f4a26",
        "uniform": "#f0ece0",
        "uniform_shade": "#bdb9a6",
        "scarf": "#c85a3a",
        "scarf_shade": "#94382a",
        "skirt": "#4a5a3c",
        "skirt_shade": "#2f3a26",
        "sock": "#f0ece0",
        "shoe": "#2e2620",
        "outline": "#1c1610",
        "text": "#f4f0e4",
        "box": "#1c1610",
        "accent": "#ffcf6b",
    },
    bg="#1c1610",
)

RAIN = Palette(
    "rain",
    {
        "sky_top": "#2a3444",
        "sky_mid": "#3f4c5e",
        "sky_low": "#61707f",
        "sun": "#9fb0bf",
        "cloud_dark": "#2a3440",
        "cloud_light": "#54637a",
        "city_far": "#3a4652",
        "city_mid": "#2a343d",
        "city_near": "#1c242c",
        "window_on": "#ffd98a",
        "window_off": "#333c46",
        "roof": "#242c34",
        "fence": "#1a2028",
        "hair": "#3a2c33",
        "hair_shade": "#241a20",
        "hair_light": "#6e5560",
        "skin": "#e6c0ac",
        "skin_shade": "#bb9282",
        "skin_light": "#ffe0d0",
        "eye": "#6ba0c4",
        "eye_dark": "#28475c",
        "uniform": "#dfe6ea",
        "uniform_shade": "#a4b0bb",
        "scarf": "#b84458",
        "scarf_shade": "#7f2a3e",
        "skirt": "#33405c",
        "skirt_shade": "#202838",
        "sock": "#dfe6ea",
        "shoe": "#241e26",
        "outline": "#141a20",
        "text": "#e8eef2",
        "box": "#141a20",
        "accent": "#ffd98a",
    },
    bg="#141a20",
)

PALETTES = {p.name: p for p in (DUSK, NIGHT, DAY, GREEN, RAIN)}


def bayer_gradient(h: int, w: int, c_top, c_bottom, bayer=None) -> np.ndarray:
    """Вертикальный градиент с дизерингом: единственный «правильный» способ
    сделать плавный переход в 8 палитровых цветах."""
    bayer = BAYER4 if bayer is None else bayer
    yy = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    pat = np.tile(bayer, (h // bayer.shape[0] + 1, w // bayer.shape[1] + 1))[:h, :w]
    t = np.clip(yy + (pat - 0.5) * (1.0 / max(h, 1)) * 2.5, 0.0, 1.0)
    out = np.zeros((h, w, 3), dtype=np.float32)
    for i in range(3):
        out[..., i] = c_top[i] * (1 - t) + c_bottom[i] * t
    return out.astype(np.uint8)


def dithered_ramp(h: int, w: int, stops, levels: int = 5, bayer=None) -> np.ndarray:
    """Мягкое небо: несколько опорных цветов + упорядоченный дизеринг между ними.

    Это и есть «магия» пиксельных градиентов: 5-6 оттенков, разложенных по
    матрице Байера, читаются глазом как плавный переход.
    """
    bayer = BAYER4 if bayer is None else bayer
    pat = np.tile(bayer, (h // bayer.shape[0] + 1, w // bayer.shape[1] + 1))[:h, :w]
    out = np.empty((h, w, 3), dtype=np.uint8)
    ts = [s[0] for s in stops]
    for y in range(h):
        t = y / max(1, h - 1)
        i = 0
        while i < len(stops) - 2 and t > ts[i + 1]:
            i += 1
        t0, c0 = stops[i]
        t1, c1 = stops[min(i + 1, len(stops) - 1)]
        f = 0.0 if t1 <= t0 else (t - t0) / (t1 - t0)
        f = min(1.0, max(0.0, f))
        q = f * levels
        k = int(q)
        fr = q - k
        a = mix(c0, c1, min(1.0, k / levels))
        b = mix(c0, c1, min(1.0, (k + 1) / levels))
        row = pat[y % pat.shape[0]]
        pick = row < fr
        out[y][pick] = b
        out[y][~pick] = a
    return out
