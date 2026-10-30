"""Риг и анимация (12 принципов на пиксельном скелете).

Здесь нет покадровой анимации «руками»: движения собираются из
процедурных циклов (шаг, бег, дыхание) и ключевых поз с разными
кривыми easings. Вторичное движение (волосы, юбка, голова) считается
пружинами от ускорения корпуса — это и даёт «живость», которой не
бывает у покадровых поз.

Всё детерминировано от (seed, время), поэтому кадр можно пересчитать
и получить тот же результат.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, fields

import numpy as np

from .char import Pose

TAU = math.tau


# ---------------------------------------------------------------------------
# кривые
# ---------------------------------------------------------------------------
def linear(t: float) -> float:
    return t


def ease_in(t: float, p: float = 2.0) -> float:
    return t ** p


def ease_out(t: float, p: float = 2.0) -> float:
    return 1 - (1 - t) ** p


def smooth(t: float) -> float:
    return t * t * (3 - 2 * t)


def smoother(t: float) -> float:
    return t * t * t * (t * (t * 6 - 15) + 10)


def back(t: float, k: float = 1.6) -> float:
    return 1 + (k + 1) * (t - 1) ** 3 + k * (t - 1) ** 2


def elastic(t: float, k: float = 7.0) -> float:
    if t <= 0 or t >= 1:
        return float(t >= 1)
    return 1 - math.cos(t * TAU * k * 0.5) * (1 - t) ** 2


def snap(t: float) -> float:
    """Быстрый старт, мягкая остановка — для ударов и жестов."""
    return 1 - (1 - t) ** 4


EASINGS = {
    "linear": linear, "in": ease_in, "out": ease_out, "smooth": smooth,
    "smoother": smoother, "back": back, "elastic": elastic, "snap": snap,
}


def ease(name: str, t: float) -> float:
    return EASINGS.get(name, smooth)(max(0.0, min(1.0, t)))


# ---------------------------------------------------------------------------
# треки поз
# ---------------------------------------------------------------------------
def _diff(a: Pose, b: Pose) -> list[str]:
    return [f for f in a.__dataclass_fields__ if abs(getattr(a, f) - getattr(b, f)) > 1e-6]


def blend(a: Pose, b: Pose, t: float, only=None) -> Pose:
    names = only if only is not None else a.__dataclass_fields__
    out = Pose(**{f: getattr(a, f) for f in a.__dataclass_fields__})
    for f in names:
        setattr(out, f, getattr(a, f) * (1 - t) + getattr(b, f) * t)
    return out


@dataclass
class Key:
    frame: int
    pose: Pose
    ease: str = "smooth"
    hold: int = 0        # кадров удержания после ключа


def resolve(keys: list[Key], frames: int, base: Pose | None = None) -> list[Pose]:
    """Развернуть ключевые позы в покадровый список.

    Промежуточные кадры считаются по полному набору полей позы, поэтому
    рука не «телепортируется»: перетекание идёт по всем углам сразу.
    """
    keys = sorted(keys, key=lambda k: k.frame)
    if not keys:
        return [base or Pose() for _ in range(frames)]
    start = base or keys[0].pose
    out: list[Pose] = []
    cur = start
    ki = 0
    for f in range(frames):
        while ki + 1 < len(keys) and keys[ki + 1].frame <= f:
            ki += 1
        k = keys[ki]
        nxt = keys[ki + 1] if ki + 1 < len(keys) else None
        if nxt is None:
            out.append(k.pose)
            continue
        span = max(1, nxt.frame - k.frame)
        t = (f - k.frame) / span
        if f < keys[0].frame:
            t = 0.0
        t = ease(nxt.ease, min(1.0, t))
        out.append(blend(k.pose, nxt.pose, t))
    return out


# ---------------------------------------------------------------------------
# IK ног: стопа ставится в точку, угол колена считается аналитически
# ---------------------------------------------------------------------------
from .char import FEET_Y, FOOT_H, SHIN, THIGH, HIP_W, CX  # noqa: E402

ANKLE_Y = FEET_Y - FOOT_H


def leg_ik(hip_xy, target_xy, l1: float = THIGH, l2: float = SHIN):
    """Двухзвенная IK: возвращает (угол бедра, угол сгиба колена).

    Колено гнётся только назад (−), поэтому берём решение с отрицательной
    ветвью: иначе нога будет выворачиваться в обратную сторону.
    """
    dx = target_xy[0] - hip_xy[0]
    dy = target_xy[1] - hip_xy[1]
    d = math.hypot(dx, dy)
    d = max(abs(l1 - l2) + 0.8, min(l1 + l2 - 0.8, d))
    base = math.atan2(dx, dy)
    cos_a = (d * d + l1 * l1 - l2 * l2) / (2 * d * l1)
    a = math.acos(max(-1.0, min(1.0, cos_a)))
    hip = base - a
    cos_k = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)
    knee = -(math.pi - math.acos(max(-1.0, min(1.0, cos_k))))
    return hip, knee


def _pelvis(hs: float = 1.0, drop: float = 0.0):
    """Таз и бедренные суставы для IK (drop — насколько присели)."""
    py = FEET_Y - FOOT_H - (THIGH + SHIN) * hs + drop
    return py, (CX - HIP_W * hs * 0.55, py + 1.5), (CX + HIP_W * hs * 0.55, py + 1.5)


def foot_track(phase: float, stride: float = 3.0, lift: float = 4.5, stance: float = 0.58):
    """Траектория стопы в фас: стоит на земле, потом поднимается дугой.

    Возвращает (смещение по x от сустава, подъём над землёй, наклон стопы).
    """
    p = phase % 1.0
    if p < stance:                       # опора: стопа прибита к земле
        t = p / stance
        return 0.0, 0.0, -0.10 * (1 - t) + 0.12 * t
    t = (p - stance) / (1 - stance)      # перенос: дуга вперёд (в фас — внутрь и вверх)
    return stride * 0.5 * math.sin(math.pi * t), lift * math.sin(math.pi * t) ** 0.8, \
        0.28 * math.sin(math.pi * t)


def _leg(hip_xy, ox: float, up: float, hs: float = 1.0):
    """Поза одной ноги: стопа в точке (ox, ANKLE_Y-up), колено почти прямое.

    В фас согнутое колено не видно — видно, что нога стала короче. Поэтому
    вместо «выгибания вбок» масштабируем звенья: это и есть форшорченинг.
    """
    tgt = (hip_xy[0] + ox, ANKLE_Y - up)
    dx, dy = tgt[0] - hip_xy[0], tgt[1] - hip_xy[1]
    dist = math.hypot(dx, dy)
    full = (THIGH + SHIN) * hs
    scale = min(1.0, max(0.50, dist / full))
    base = math.atan2(dx, dy)
    # лёгкий сгиб колена наружу: стопа от этого почти не сдвигается
    b = 0.10 * hs
    return base + b, -2.0 * b, scale


def _legs(pelvis_l, pelvis_r, ph_l, ph_r, stride=3.0, lift=4.5, stance=0.58, hs=1.0):
    ox_l, up_l, roll_l = foot_track(ph_l, stride, lift, stance)
    ox_r, up_r, roll_r = foot_track(ph_r, stride, lift, stance)
    h_l, k_l, s_l = _leg(pelvis_l, ox_l, up_l, hs)
    h_r, k_r, s_r = _leg(pelvis_r, ox_r, up_r, hs)
    return h_l, k_l, h_r, k_r, roll_l, roll_r, s_l, s_r


# ---------------------------------------------------------------------------
# процедурные циклы
# ---------------------------------------------------------------------------
def walk(phase: float, speed: float = 1.0, style: str = "normal", hs: float = 1.0) -> Pose:
    """Шаг в фас: стопа фиксируется IK, поэтому нет «катания» по земле."""
    p = phase * TAU
    amp = {"normal": 1.0, "slow": 0.72, "run": 1.0}.get(style, 1.0) * speed
    drop = 5.0 + abs(math.sin(p)) * 1.1 * amp           # присед + двойной подъём
    py, pl, pr = _pelvis(hs, drop)
    h_l, k_l, h_r, k_r, r_l, r_r, s_l, s_r = _legs(pl, pr, phase, phase + 0.5,
                                                   stride=3.4 * amp, lift=4.2 * amp)
    arm = 0.26 * amp
    return Pose(
        dx=math.sin(p) * 0.7 * amp,
        dy=drop,
        spine=0.035 * amp + math.sin(p * 2) * 0.012,
        neck=-0.02,
        head=math.sin(p * 2 + 0.7) * 0.018,
        sh_l=math.sin(p) * arm + 0.10, el_l=0.18 + max(0.0, math.sin(p)) * 0.26,
        sh_r=-math.sin(p) * arm + 0.10, el_r=0.18 + max(0.0, -math.sin(p)) * 0.26,
        hip_l=h_l, knee_l=k_l, hip_r=h_r, knee_r=k_r,
        foot_l=r_l, foot_r=r_r, leg_l=s_l, leg_r=s_r,
        squash=0.0,
        hair_swing=math.sin(p * 2 + 1.1) * 1.4 * amp,
        skirt_swing=math.sin(p * 2 + 2.0) * 1.1 * amp,
    )


def run(phase: float, speed: float = 1.0, hs: float = 1.0) -> Pose:
    """Бег: длинный шаг, полётная фаза, корпус вперёд, руки согнуты."""
    p = phase * TAU
    drop = 4.0 + abs(math.sin(p * 2)) * 1.6
    py, pl, pr = _pelvis(hs, drop)
    h_l, k_l, h_r, k_r, r_l, r_r, s_l, s_r = _legs(pl, pr, phase, phase + 0.5,
                                                   stride=7.5 * speed, lift=8.5 * speed, stance=0.40)
    return Pose(
        dx=math.sin(p) * 0.9,
        dy=drop,
        spine=0.20 + math.sin(p * 2) * 0.02,
        neck=-0.12,
        head=-0.02 + math.sin(p * 2 + 0.5) * 0.02,
        sh_l=math.sin(p) * 0.40 + 0.20, el_l=0.95 + math.sin(p) * 0.12, arm_l=0.80,
        sh_r=-math.sin(p) * 0.40 + 0.20, el_r=0.95 - math.sin(p) * 0.12, arm_r=0.80,
        hip_l=h_l, knee_l=k_l, hip_r=h_r, knee_r=k_r,
        foot_l=r_l, foot_r=r_r, leg_l=s_l, leg_r=s_r,
        hair_swing=math.sin(p * 2 + 0.9) * 2.6,
        hair_lift=1.2 + abs(math.sin(p)) * 1.4,
        skirt_swing=math.sin(p * 2 + 1.7) * 2.2,
    )


def idle(t: float, breath: float = 1.0, shift: float = 1.0, seed: int = 0) -> Pose:
    """Дыхание + перенос веса + микродвижения головы."""
    b = math.sin(t * TAU * 0.28) * breath
    s = math.sin(t * TAU * 0.09 + 0.7) * shift
    return Pose(
        dx=s * 0.8,
        dy=-b * 0.5,
        spine=0.012 + b * 0.010 + s * 0.014,
        neck=-0.01 - b * 0.006,
        head=-s * 0.035 + math.sin(t * TAU * 0.17) * 0.015,
        sh_l=0.10 + b * 0.012, sh_r=0.10 + b * 0.012,
        el_l=0.16 + b * 0.02, el_r=0.16 + b * 0.02,
        hip_l=0.05 + s * 0.03, hip_r=0.05 - s * 0.03,
        knee_l=0.02, knee_r=0.02,
        squash=b * 0.012,
        hair_swing=s * 0.5 + math.sin(t * TAU * 0.21) * 0.35,
        skirt_swing=s * 0.4,
        look_x=math.sin(t * TAU * 0.06) * 0.35,
    )


def sit(t: float = 0.0) -> Pose:
    return Pose(dy=13, hip_l=1.45, hip_r=1.42, knee_l=-1.45, knee_r=-1.48,
                spine=0.06, neck=-0.04, sh_l=0.35, sh_r=0.33, el_l=0.85, el_r=0.9,
                squash=0.15)


def wave(phase: float, side: int = 1) -> Pose:
    """Машет: плечо вверх, локоть качает, корпус слегка откликается."""
    w = math.sin(phase * TAU * 2)
    return Pose(
        sh_r=2.25 + w * 0.22 if side > 0 else 0.10,
        el_r=0.55 + w * 0.35 if side > 0 else 0.16,
        sh_l=0.12, el_l=0.18,
        spine=0.02, head=0.05 + w * 0.02, neck=-0.03,
        dx=0.6 if side > 0 else -0.6,
        hair_swing=w * 0.8,
    )


def jump(t: float) -> Pose:
    """Прыжок: присед (anticipation) -> толчок -> полёт -> приземление (squash).

    Высота считается через `dy`, длина ног — через `leg_l/leg_r`, поэтому
    стопа честно отрывается от земли, а не «уезжает» в сторону.
    """
    if t < 0.20:                                    # присед
        k = ease_out(t / 0.20)
        return Pose(dy=5.5 * k, squash=0.30 * k, spine=0.24 * k, neck=-0.14 * k,
                    leg_l=1 - 0.16 * k, leg_r=1 - 0.16 * k,
                    sh_l=-0.35 * k, sh_r=-0.35 * k, el_l=0.55 * k, el_r=0.55 * k,
                    hair_lift=-0.4 * k)
    if t < 0.32:                                    # толчок
        k = (t - 0.20) / 0.12
        return Pose(dy=5.5 * (1 - k) - 6.0 * k, squash=0.30 * (1 - k) - 0.05 * k,
                    spine=0.24 * (1 - k) - 0.04 * k,
                    leg_l=0.84 + 0.16 * k, leg_r=0.84 + 0.16 * k,
                    sh_l=-0.35 + 2.75 * k, sh_r=-0.35 + 2.75 * k,
                    el_l=0.55 * (1 - k), el_r=0.55 * (1 - k),
                    hair_lift=1.5 * k, skirt_swing=-1.0 * k)
    if t < 0.72:                                    # полёт
        k = (t - 0.32) / 0.40
        arc = math.sin(k * math.pi)
        return Pose(dy=-6.0 - 22.0 * arc, squash=-0.05 * arc,
                    leg_l=1.0 - 0.30 * arc, leg_r=1.0 - 0.22 * arc,
                    hip_l=0.06, hip_r=-0.04, knee_l=0.10 * arc, knee_r=0.16 * arc,
                    spine=0.0, neck=0.05, head=-0.05 * arc,
                    sh_l=2.35 * arc, sh_r=2.35 * arc,
                    el_l=0.25, el_r=0.25,
                    hair_lift=2.6 * arc, skirt_swing=-1.6 * arc)
    k = (t - 0.72) / 0.28                            # удар и восстановление
    hit = ease_out(min(1.0, k * 1.8))
    rec = ease_out(max(0.0, (k - 0.30) / 0.70))
    return Pose(dy=-6.0 + 12.0 * hit * (1 - rec), squash=0.42 * hit * (1 - rec),
                leg_l=0.78 + 0.22 * rec, leg_r=0.78 + 0.22 * rec,
                spine=0.16 * hit * (1 - rec), neck=-0.10 * hit * (1 - rec),
                sh_l=2.35 * (1 - hit) + 0.55 * hit * (1 - rec) if hit < 1 else 0.10,
                sh_r=2.35 * (1 - hit) + 0.55 * hit * (1 - rec) if hit < 1 else 0.10,
                el_l=0.25 + 0.3 * hit * (1 - rec), el_r=0.25 + 0.3 * hit * (1 - rec),
                hair_lift=-1.2 * hit * (1 - rec), skirt_swing=1.2 * hit * (1 - rec))


# ---------------------------------------------------------------------------
# вторичное движение: пружины
# ---------------------------------------------------------------------------
def _spring(values: list[float], k: float = 0.32, damp: float = 0.72, drive=1.0) -> list[int]:
    x, v = 0.0, 0.0
    out = []
    for target in values:
        v += (target * drive - x) * k
        v *= damp
        x += v
        out.append(x)
    return out


def secondary(poses: list[Pose], fps: int = 12, hair: float = 1.0, cloth: float = 1.0) -> list[Pose]:
    """Волосы и юбка догоняют корпус: пружина от ускорения таза и головы."""
    n = len(poses)
    acc = [0.0] * n
    for i in range(2, n):
        a = poses[i].dx - 2 * poses[i - 1].dx + poses[i - 2].dx
        acc[i] = -a * 6.0
    hair_t = _spring(acc, 0.30, 0.74, hair)
    cloth_t = _spring(acc, 0.22, 0.68, cloth)
    out = []
    for i, p in enumerate(poses):
        q = Pose(**{f: getattr(p, f) for f in p.__dataclass_fields__})
        q.hair_swing = p.hair_swing + hair_t[i]
        q.skirt_swing = p.skirt_swing + cloth_t[i] * 0.8
        q.hair_lift = p.hair_lift + max(0.0, abs(hair_t[i]) * 0.25)
        out.append(q)
    return out


def head_lag(poses: list[Pose], amount: float = 0.35) -> list[Pose]:
    """Голова отстаёт от корпуса на 1-2 кадра — overlapping action."""
    out = []
    for i, p in enumerate(poses):
        q = Pose(**{f: getattr(p, f) for f in p.__dataclass_fields__})
        prev = poses[max(0, i - 2)]
        q.head = p.head * (1 - amount) + prev.head * amount + (prev.spine - p.spine) * -0.4
        out.append(q)
    return out


# ---------------------------------------------------------------------------
# мимика и липсинк
# ---------------------------------------------------------------------------
def blinks(frames: int, fps: int = 12, seed: int = 0, rate: float = 0.22) -> list[float]:
    """Моргание: 2-3 кадра, случайные интервалы, детерминировано от seed."""
    rng = np.random.default_rng(seed)
    out = [0.0] * frames
    t = int(rng.integers(6, 22))
    while t < frames - 4:
        dur = int(rng.integers(2, 4))
        for j in range(dur):
            if t + j < frames:
                out[t + j] = [1.0, 0.75, 1.0, 0.4][j] if j < 4 else 1.0
        t += int(rng.integers(int(fps * 1.6), int(fps * 4.2)))
    return out


_VOWELS = {"а": 0.85, "о": 0.7, "у": 0.55, "э": 0.65, "и": 0.4, "ы": 0.45, "я": 0.8, "ю": 0.6,
           "е": 0.6, "ё": 0.7}


def lipsync(text: str, frames: int, fps: int = 12) -> list[float]:
    """Грубая, но синхронная артикуляция: гласные широко, согласные узко."""
    if not text:
        return [0.0] * frames
    seq = []
    for ch in text.lower():
        if ch in _VOWELS:
            seq.append(_VOWELS[ch])
        elif ch in "бмп":
            seq.append(0.65)
        elif ch in "вф":
            seq.append(0.12)
        elif ch.isalpha():
            seq.append(0.28)
        elif ch in " ,.!?—":
            seq.append(0.0)
    if not seq:
        return [0.0] * frames
    out = []
    span = max(1.0, frames / len(seq))
    for f in range(frames):
        x = f / span
        i = int(x) % len(seq)
        j = (i + 1) % len(seq)
        t = x - int(x)
        v = seq[i] * (1 - smooth(t)) + seq[j] * smooth(t)
        out.append(v * 0.9 + 0.05)
    return out


@dataclass
class Clip:
    """Готовый клип: позы по кадрам + метаданные."""

    poses: list[Pose]
    fps: int = 12
    name: str = "clip"

    def __len__(self) -> int:
        return len(self.poses)


def cycle(fn, frames: int, fps: int = 12, loops: float = 1.0, springs: bool = True, **kw) -> Clip:
    poses = [fn(i / max(1, frames) * loops, **kw) for i in range(frames)]
    if springs:
        poses = head_lag(secondary(poses, fps))
    return Clip(poses, fps, getattr(fn, "__name__", "cycle"))
