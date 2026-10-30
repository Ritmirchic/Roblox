"""Анимация: превращение (анимация, время) -> Pose.

Никаких ключевых кадров и интерполяции кривыми — для чиби достаточно
синусоид с разной частотой. Именно поэтому эпизод можно сделать сколь
угодно длинным: поза считается формулой, а не хранится.
"""
from __future__ import annotations

import math
import zlib

from .sprites import Pose


def _blink(t: float, seed: int = 0, period: float = 3.7, hold: float = 0.12) -> float:
    """Моргание: короткий импульс раз в period секунд, со сдвигом по seed."""
    ph = (t / period + (seed * 0.37) % 1.0) % 1.0
    return 1.0 if ph < hold else 0.0


def _breath(t: float, seed: int = 0) -> float:
    return math.sin(t * 2 * math.pi * 0.42 + seed) * 0.9


def pose_idle(t: float, seed: int = 0, sway: float = 1.0) -> Pose:
    return Pose(
        bob=_breath(t, seed) * 0.8,
        blink=_blink(t, seed),
        hair_sway=math.sin(t * 2 * math.pi * 0.33 + seed) * 1.2 * sway,
        skirt_sway=math.sin(t * 2 * math.pi * 0.27 + seed) * 0.8 * sway,
        arm_l=math.sin(t * 1.3 + seed) * 0.05,
        arm_r=math.sin(t * 1.1 + seed * 2) * 0.05,
    )


def pose_talk(t: float, seed: int = 0, rate: float = 5.5) -> Pose:
    p = pose_idle(t, seed)
    # «речь»: рот открывается рывками, как в аниме с ограниченной анимацией
    syllable = (math.sin(t * rate * 2 * math.pi) * 0.5 + 0.5) ** 0.7
    p.mouth = syllable if (t * rate) % 1.0 < 0.75 else 0.0
    p.head_tilt = math.sin(t * 1.7) * 1.0
    p.arm_r = 0.12 + math.sin(t * 2.2) * 0.10
    return p


def pose_wave(t: float, seed: int = 0) -> Pose:
    p = pose_idle(t, seed)
    p.arm_r = 2.3 + math.sin(t * 2 * math.pi * 1.7) * 0.35
    p.head_tilt = 0.8
    p.mouth = 0.2 + 0.2 * math.sin(t * 6)
    return p


def pose_walk(t: float, seed: int = 0, speed: float = 1.7) -> Pose:
    ph = (t * speed) % 1.0
    return Pose(
        bob=-abs(math.sin(ph * 2 * math.pi)) * 1.2,
        leg_phase=ph,
        blink=_blink(t, seed, 3.1),
        hair_sway=math.sin(ph * 2 * math.pi) * 1.6,
        skirt_sway=math.sin(ph * 2 * math.pi) * 1.2,
        arm_l=math.sin(ph * 2 * math.pi) * 0.35,
        arm_r=-math.sin(ph * 2 * math.pi) * 0.35,
    )


def pose_run(t: float, seed: int = 0) -> Pose:
    p = pose_walk(t, seed, speed=3.2)
    p.bob = -1.6 - abs(math.sin(t * 6)) * 0.8
    p.arm_l = 0.9 + math.sin(t * 12) * 0.3
    p.arm_r = 0.9 - math.sin(t * 12) * 0.3
    return p


def pose_sad(t: float, seed: int = 0) -> Pose:
    p = pose_idle(t, seed)
    p.head_y = 1.0
    p.head_tilt = -0.6
    p.arm_l = -0.15
    p.arm_r = -0.15
    p.bob = p.bob * 0.4 + 0.4
    p.mouth = 0.0
    return p


def pose_surprise(t: float, seed: int = 0) -> Pose:
    p = pose_idle(t, seed)
    p.mouth = 1.0
    p.head_y = -1.0
    p.arm_l = 0.9
    p.arm_r = 0.9
    p.bob = -0.4
    return p


def pose_sit(t: float, seed: int = 0) -> Pose:
    p = pose_idle(t, seed)
    p.squash = 0.25
    p.leg_phase = -1
    return p


ANIMS = {
    "idle": pose_idle,
    "talk": pose_talk,
    "wave": pose_wave,
    "walk": pose_walk,
    "run": pose_run,
    "sad": pose_sad,
    "surprise": pose_surprise,
    "sit": pose_sit,
}


def pose_for(anim: str, t: float, seed: int = 0) -> Pose:
    fn = ANIMS.get(anim, pose_idle)
    try:
        return fn(t, seed)
    except TypeError:
        return fn(t)


def jitter(seed: int, t: float, amp: float = 1.0) -> float:
    """Детерминированный «шум» для дрожания камеры и бликов."""
    return (math.sin(seed * 12.9898 + t * 78.233) * 43758.5453) % 1.0 * 2 * amp - amp
