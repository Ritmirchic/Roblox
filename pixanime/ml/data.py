"""Генерация обучающих клипов: движок рисует короткие видео заданного разрешения.

Модель учится на том же материале, что и сериал, поэтому получается «нейросеть
в стиле проекта», а не абстрактные пятна: небо с дизерингом, силуэты города,
медленный параллакс, мигающий персонаж.
"""
from __future__ import annotations

import math

import numpy as np

from ..backgrounds import Park, Room, Rooftop, Street
from ..canvas import Frame
from ..palette import DAY, DUSK, GREEN, NIGHT, RAIN
from ..sprites import CharacterSpec, Pose, render_character

SCENE_CLASSES = ["rooftop_dusk", "street_night", "room_night", "park_day", "rooftop_night"]


def _scene_for(cls: str):
    if cls == "rooftop_dusk":
        return Rooftop(seed=7), DUSK
    if cls == "street_night":
        return Street(seed=21, lamps=3), NIGHT
    if cls == "room_night":
        return Room(seed=3), NIGHT
    if cls == "park_day":
        return Park(seed=11), GREEN
    return Rooftop(seed=7), NIGHT


def make_clip(cls: str, frames: int = 8, size: int = 32, t0: float = 0.0, seed: int = 0) -> np.ndarray:
    """Один клип [T, size, size, 3] uint8.

    Сцена всегда рисуется в «родном» разрешении 128x128 и затем прореживается
    целым множителем: так модель видит ту же стилистику, что и сериал,
    только в маленьком разрешении.
    """
    rng = np.random.default_rng(seed)
    scene, pal = _scene_for(cls)
    k = max(1, 128 // size)
    out = np.zeros((frames, size, size, 3), dtype=np.uint8)
    with_char = rng.random() < 0.65
    spec = CharacterSpec(
        hair=str(rng.choice(["long", "twin", "short", "bob"])),
        outfit=str(rng.choice(["sailor", "hoodie", "coat"])),
        accessory=str(rng.choice(["", "hairpin", "ribbon"])),
    )
    cx = float(rng.uniform(0.32, 0.68)) * 128
    gy = float(rng.uniform(0.76, 0.84)) * 128
    cam0 = float(rng.uniform(-14, 14))
    cam_v = float(rng.uniform(-4, 4))
    for i in range(frames):
        t = t0 + i / 12.0
        f = Frame(128, 128)
        scene.draw(f, cam0 + cam_v * t, 0, t, pal)
        if with_char:
            pose = Pose(
                bob=math.sin(t * 2.6 + seed) * 0.8,
                blink=1.0 if (t * 1.9 + seed) % 3.4 < 0.12 else 0.0,
                hair_sway=math.sin(t * 2.1 + seed) * 1.2,
            )
            spr = render_character(spec, pose, pal)
            f.blit(spr, int(cx) - spr.w // 2, int(gy) - 58)
        out[i] = f.px[::k, ::k][:size, :size]
    return out


def build_dataset(n_per_class: int = 120, frames: int = 8, size: int = 32, seed: int = 0):
    """Вернуть (clips, labels). clips: [N, T, H, W, 3] uint8."""
    rng = np.random.default_rng(seed)
    clips, labels = [], []
    for ci, cls in enumerate(SCENE_CLASSES):
        for k in range(n_per_class):
            clips.append(make_clip(cls, frames, size, t0=float(rng.uniform(0, 20)), seed=int(rng.integers(0, 9999))))
            labels.append(ci)
    return np.stack(clips), np.array(labels, dtype=np.int64)
