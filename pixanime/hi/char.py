"""Персонаж с анатомией и скелетом (внутреннее разрешение 256).

Рост ~108 px, голова 24 px (≈1/4.5 роста), глаза 6x7 px: после апскейла x2
это 12x14 на экране 512 — хватает на ресницы, зрачок и два блика.

Скелет прямой кинематики, все части — капсулы и полигоны с поворотом.
Свет всегда сверху-слева: тень на нижне-правой кромке детали, контровой
свет по правому силуэту, «ambient occlusion» под подбородком, воротником
и подолом юбки.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .raster import Bitmap, Mask, along, bayer_pick, lighten, mix, shade

SPR_W, SPR_H = 150, 160
FEET_Y = 148
CX = 75

# --- пропорции (пиксели внутреннего кадра) ---------------------------------
FOOT_H = 5.0
SHIN = 24.0
THIGH = 22.0
TORSO = 30.0
NECK = 4.5
HEAD_HH = 19.0          # полувысота головы (полный размер ~1.32*HH)
HEAD_HW = 9.8           # полуширина черепа
SHOULDER_W = 11.5
HIP_W = 9.6
ARM_UP, ARM_LOW = 16.0, 15.0
THIGH_W, SHIN_W = 9.2, 6.4
ARM_W, FORE_W = 5.8, 4.8


@dataclass
class Look:
    name: str = "Аой"
    hair: str = "long"
    outfit: str = "sailor"
    accessory: str = ""
    height: float = 1.0
    skin: tuple = (250, 213, 186)
    skin_shade: tuple = (222, 170, 148)
    hair_color: tuple = (82, 54, 86)
    hair_light: tuple = (156, 108, 138)
    eye: tuple = (98, 152, 218)
    eye_dark: tuple = (30, 52, 104)
    cloth: tuple = (246, 246, 250)
    cloth_shade: tuple = (192, 196, 216)
    accent: tuple = (216, 70, 94)
    accent_dark: tuple = (152, 36, 58)
    skirt: tuple = (60, 76, 126)
    skirt_shade: tuple = (36, 46, 84)
    sock: tuple = (242, 242, 248)
    shoe: tuple = (54, 42, 54)
    outline: tuple = (26, 20, 34)
    rim: tuple = (255, 216, 176)


@dataclass
class Pose:
    dx: float = 0.0
    dy: float = 0.0
    spine: float = 0.0
    neck: float = 0.0
    head: float = 0.0
    sh_l: float = 0.10
    el_l: float = 0.16
    sh_r: float = 0.10
    el_r: float = 0.16
    hip_l: float = 0.05
    knee_l: float = 0.0
    hip_r: float = 0.05
    knee_r: float = 0.0
    foot_l: float = 0.0
    foot_r: float = 0.0
    leg_l: float = 1.0
    leg_r: float = 1.0
    arm_l: float = 1.0
    arm_r: float = 1.0
    blink: float = 0.0
    eye_open: float = 1.0
    brow: float = 0.0
    brow_raise: float = 0.0
    mouth: float = 0.0
    mouth_curve: float = 0.0
    look_x: float = 0.0
    look_y: float = 0.0
    blush: float = 0.0
    tears: float = 0.0
    hair_swing: float = 0.0
    hair_lift: float = 0.0
    skirt_swing: float = 0.0
    squash: float = 0.0

    def lerp(self, o: "Pose", t: float) -> "Pose":
        return Pose(**{f: getattr(self, f) * (1 - t) + getattr(o, f) * t for f in self.__dataclass_fields__})


@dataclass
class Joints:
    pelvis: tuple
    chest: tuple
    neck: tuple
    head: tuple
    sh_l: tuple
    sh_r: tuple
    el_l: tuple
    el_r: tuple
    wr_l: tuple
    wr_r: tuple
    hip_l: tuple
    hip_r: tuple
    kn_l: tuple
    kn_r: tuple
    an_l: tuple
    an_r: tuple
    head_angle: float


def skeleton(pose: Pose, ground_y: float = FEET_Y, height: float = 1.0) -> Joints:
    hs = height
    crouch = pose.squash * 7
    pelvis_y = ground_y - (FOOT_H + SHIN + THIGH) * hs + crouch + pose.dy
    pelvis = (CX + pose.dx, pelvis_y)
    chest = along(pelvis, pose.spine, -TORSO * hs)
    neck = along(chest, pose.spine + pose.neck, -NECK * hs)
    head_angle = pose.spine + pose.neck + pose.head
    # подбородок должен висеть над ключицами на длину шеи — иначе голова отрывается
    head = along(chest, head_angle, -(NECK + HEAD_HH * 0.54 + 1.0) * hs)

    def shoulder(side):
        return (chest[0] + side * SHOULDER_W * hs * math.cos(pose.spine),
                chest[1] + 2.0 * hs - side * SHOULDER_W * hs * math.sin(pose.spine) * 0.2)

    sh_l, sh_r = shoulder(-1), shoulder(1)
    # левая рука зеркальна: положительный угол уводит её от корпуса влево
    a_l = pose.spine - pose.sh_l
    a_r = pose.spine + pose.sh_r
    el_l = along(sh_l, a_l, ARM_UP * hs)
    el_r = along(sh_r, a_r, ARM_UP * hs)
    wr_l = along(el_l, a_l - pose.el_l, ARM_LOW * hs * pose.arm_l)
    wr_r = along(el_r, a_r + pose.el_r, ARM_LOW * hs * pose.arm_r)
    hip_l = (pelvis[0] - HIP_W * hs * 0.55, pelvis[1] + 1.5)
    hip_r = (pelvis[0] + HIP_W * hs * 0.55, pelvis[1] + 1.5)
    kn_l = along(hip_l, pose.hip_l, THIGH * hs * pose.leg_l)
    kn_r = along(hip_r, pose.hip_r, THIGH * hs * pose.leg_r)
    an_l = along(kn_l, pose.hip_l + pose.knee_l, SHIN * hs * pose.leg_l)
    an_r = along(kn_r, pose.hip_r + pose.knee_r, SHIN * hs * pose.leg_r)
    return Joints(pelvis, chest, neck, head, sh_l, sh_r, el_l, el_r, wr_l, wr_r,
                  hip_l, hip_r, kn_l, kn_r, an_l, an_r, head_angle)


# ---------------------------------------------------------------------------
def _band(y0, y1, x0=0, x1=SPR_W) -> Mask:
    m = Mask(SPR_W, SPR_H)
    y0c, y1c = int(max(0, round(y0))), int(min(SPR_H, round(y1)))
    x0c, x1c = int(max(0, round(x0))), int(min(SPR_W, round(x1)))
    if y0c < y1c and x0c < x1c:
        m.m[y0c:y1c, x0c:x1c] = True
    return m


def _head_mask(cx, cy, hw, hh) -> Mask:
    m = Mask(SPR_W, SPR_H)
    m.ellipse(cx, cy - hh * 0.20, hw, hh * 0.60)
    m.poly([
        (cx - hw * 0.96, cy - hh * 0.06),
        (cx - hw * 0.90, cy + hh * 0.20),
        (cx - hw * 0.66, cy + hh * 0.42),
        (cx - hw * 0.30, cy + hh * 0.54),
        (cx + hw * 0.30, cy + hh * 0.54),
        (cx + hw * 0.66, cy + hh * 0.42),
        (cx + hw * 0.90, cy + hh * 0.20),
        (cx + hw * 0.96, cy - hh * 0.06),
    ])
    return m


def _columns_bang_mask(cx, cy, hw, hh, style, swing, top_extra=2.0) -> Mask:
    """Чёлка: зигзаг из прядей, обрезанный по форме головы."""
    yy, xx = np.mgrid[0:SPR_H, 0:SPR_W]
    rel = (xx - cx) / hw
    patterns = {
        "long": ([(-1.10, 0.62), (-0.86, 0.34), (-0.60, 0.52), (-0.34, 0.26),
                  (-0.06, 0.46), (0.22, 0.24), (0.52, 0.50), (0.82, 0.30), (1.10, 0.58)]),
        "twin": ([(-1.10, 0.56), (-0.84, 0.32), (-0.56, 0.48), (-0.24, 0.24),
                  (0.08, 0.44), (0.42, 0.26), (0.74, 0.46), (1.10, 0.56)]),
        "short": ([(-1.06, 0.52), (-0.78, 0.30), (-0.46, 0.46), (-0.12, 0.26),
                   (0.22, 0.44), (0.58, 0.30), (1.06, 0.50)]),
        "bob": ([(-1.08, 0.60), (-0.80, 0.36), (-0.50, 0.50), (-0.18, 0.28),
                 (0.16, 0.48), (0.52, 0.32), (1.08, 0.56)]),
        "ponytail": ([(-1.10, 0.58), (-0.82, 0.34), (-0.52, 0.50), (-0.20, 0.26),
                      (0.14, 0.46), (0.50, 0.28), (0.80, 0.44), (1.10, 0.56)]),
        "braid": ([(-1.10, 0.60), (-0.84, 0.36), (-0.54, 0.50), (-0.20, 0.28),
                   (0.14, 0.46), (0.50, 0.30), (1.10, 0.58)]),
    }
    ctrl = patterns.get(style, patterns["long"])
    ctrl_x = np.array([c[0] for c in ctrl])
    ctrl_y = np.array([c[1] for c in ctrl])
    head_top = cy - hh * 0.80
    depth = np.interp(np.clip(rel, -1.15, 1.15), ctrl_x, ctrl_y)
    bottom = head_top + (0.10 + depth * 0.56) * hh
    inside = (np.abs(rel + swing / max(hw, 1e-3) * 0.6) <= 1.08)
    m = Mask(SPR_W, SPR_H)
    m.m = (yy >= head_top - top_extra) & (yy <= bottom) & inside
    return m


# ---------------------------------------------------------------------------
def render(look: Look, pose: Pose, ground_y: float = FEET_Y) -> Bitmap:
    j = skeleton(pose, ground_y, look.height)
    bit = Bitmap(SPR_W, SPR_H)
    hs = look.height
    hw, hh = HEAD_HW * hs, HEAD_HH * hs
    cx, cy = j.head

    hair, hair_l = look.hair_color, look.hair_light
    hair_d = mix(shade(hair, 0.60), look.outline, 0.30)
    skin, skin_d = look.skin, look.skin_shade
    cloth, cloth_d = look.cloth, look.cloth_shade
    skirt, skirt_d = look.skirt, look.skirt_shade
    sw = pose.hair_swing

    # ------------------------------------------------------------ волосы сзади
    back = Mask(SPR_W, SPR_H)
    style = look.hair
    if style in ("long", "braid", "ponytail", "twin"):
        length = {"long": 58.0, "braid": 52.0, "ponytail": 38.0, "twin": 44.0}[style] * hs
        left, right = [], []
        for i in range(13):
            t = i / 12
            y = cy - hh * 0.75 + (hh * 0.75 + length) * t
            taper = 1.0 - 0.44 * t
            wob = math.sin(t * 2.2) * 3.0 * hs + sw * (0.3 + 0.7 * t)
            left.append((cx - hw * 1.16 * taper + wob * 0.4, y))
            right.append((cx + hw * 1.16 * taper + wob, y))
        back.poly(left + right[::-1])
        for k in (-2, -1, 0, 1, 2):
            tip = (cx + k * hw * 0.5 + sw, cy - hh * 0.75 + (hh * 0.75 + length) - 4)
            back.poly([(tip[0] - 3.2, tip[1] - 10), (tip[0] + 3.2, tip[1] - 10),
                       (tip[0] + k * 0.8, tip[1] + 7 - abs(k) * 1.5)])
        # плечи перекрывают волосы — «мягкая» кромка
        back = back & _band(0, SPR_H, 0, SPR_W)
    elif style in ("short", "bob"):
        length = (32.0 if style == "bob" else 18.0) * hs
        back.poly([(cx - hw * 1.12, cy - hh * 0.5), (cx + hw * 1.12, cy - hh * 0.5),
                   (cx + hw * 1.20, cy + length * 0.55), (cx - hw * 1.20, cy + length * 0.55)])
        back.ellipse(cx, cy + length * 0.55, hw * 1.20, 6.5 * hs)
    if style == "twin":
        for side in (-1, 1):
            for i in range(10):
                t = i / 9
                x = cx + side * (hw * 1.30 + 3 + 5 * math.sin(t * 2.0)) + sw * t
                y = cy - hh * 0.45 + t * 40 * hs
                r = 5.4 * (1 - 0.46 * t)
                back.ellipse(x, y, r * 1.05, r * 1.35)
            # заколка у основания хвоста
            back.ellipse(cx + side * hw * 1.24, cy - hh * 0.42, 2.6, 2.2)

    bit.paint(back, mix(hair, hair_d, 0.45))
    if back.any():
        ys = np.where(back.m.any(axis=1))[0]
        arc = back & _band(ys.min() + 1, ys.min() + 4, cx - hw * 0.9, cx + hw * 0.9)
        bit.paint(arc, mix(hair, look.outline, 0.45))
        bit.paint(back.edge(2, 2), mix(hair_d, look.outline, 0.35))

    # ------------------------------------------------------------ ноги
    for hipj, kn, an, side, fa in ((j.hip_l, j.kn_l, j.an_l, -1, pose.foot_l),
                                   (j.hip_r, j.kn_r, j.an_r, 1, pose.foot_r)):
        thigh = Mask(SPR_W, SPR_H).capsule(hipj, kn, THIGH_W * hs)
        shin = Mask(SPR_W, SPR_H).capsule(kn, an, SHIN_W * hs)
        bit.paint(thigh, skin)
        bit.paint(shin, skin)
        sock_top = (an[0] + (kn[0] - an[0]) * 0.40, an[1] + (kn[1] - an[1]) * 0.40)
        sock = Mask(SPR_W, SPR_H).capsule(sock_top, (an[0], an[1] + 1.2), SHIN_W * hs + 0.8) & shin.dilate(1)
        bit.paint(sock, look.sock)
        bit.paint(sock & _band(sock_top[1] - 1.5, sock_top[1] + 1.0), mix(look.sock, look.outline, 0.55))
        bit.paint(sock.edge(2, 2), mix(look.sock, look.outline, 0.35))
        # туфля
        shoe = Mask(SPR_W, SPR_H)
        shoe.poly([(an[0] - 4.2, an[1] + 0.6), (an[0] + 4.2, an[1] + 0.6),
                   (an[0] + 5.4 + side * 0.6, an[1] + FOOT_H), (an[0] - 5.4 + side * 0.6, an[1] + FOOT_H)])
        shoe.ellipse(an[0], an[1] + 1.6, 4.6, 2.8)
        bit.paint(shoe, look.shoe)
        ys = shoe.m.nonzero()[0]
        if len(ys):
            bit.paint(shoe & _band(ys.min(), ys.min() + 1.2), lighten(look.shoe, 1.8))
            bit.paint(shoe.edge(1, 2), shade(look.shoe, 0.55))
        bit.paint(thigh.edge(2, 2) & ~sock, skin_d)
        bit.paint(shin.edge(2, 2) & ~sock, skin_d)
        # тень между ногами

    # ------------------------------------------------------------ юбка
    sway = pose.skirt_swing
    sk_top = j.pelvis[1] - 7 * hs
    sk_hem = sk_top + 17 * hs
    top_hw, hem_hw = HIP_W * hs * 1.08, HIP_W * hs * 1.42
    sk = Mask(SPR_W, SPR_H)
    top_pts = [(cx - top_hw + 2 * top_hw * i / 7, sk_top + 2 + 0.8 * math.sin(i * 2.4)) for i in range(8)]
    hem_pts = [(cx - hem_hw + 2 * hem_hw * i / 7 + sway, sk_hem + 1.2 * math.cos(i * 1.7)) for i in range(8)]
    sk.poly(top_pts + hem_pts[::-1])
    bit.paint(sk, skirt)
    # складки: чередующиеся клинья от талии к подолу
    pleats = 9
    for i in range(pleats):
        t0, t1 = i / pleats, (i + 1) / pleats
        quad = Mask(SPR_W, SPR_H).poly([
            (cx - top_hw + 2 * top_hw * t0, sk_top + 2),
            (cx - top_hw + 2 * top_hw * t1, sk_top + 2),
            (cx - hem_hw + 2 * hem_hw * t1 + sway, sk_hem + 1),
            (cx - hem_hw + 2 * hem_hw * t0 + sway, sk_hem + 1)])
        if i % 2 == 0:
            bit.paint(quad & sk, mix(skirt, skirt_d, 0.55))
        # тёмная линия сгиба
        edge_line = Mask(SPR_W, SPR_H).capsule(
            (cx - top_hw + 2 * top_hw * t0, sk_top + 3),
            (cx - hem_hw + 2 * hem_hw * t0 + sway, sk_hem), 1.0)
        bit.paint(edge_line & sk, skirt_d)
    # световой блик слева (свет сверху-слева)
    lit = sk & _band(0, SPR_H, cx - hem_hw, cx - top_hw * 0.25) & ~_band(sk_top + 8, SPR_H)
    bit.paint(lit, mix(skirt, (255, 255, 255), 0.10))
    bit.paint(sk.edge(2, 2), skirt_d)
    bit.paint(sk & _band(sk_hem - 2, sk_hem + 1), mix(skirt_d, look.outline, 0.45))
    # тень от юбки на ногах
    shade_legs = _band(sk_hem - 1, sk_hem + 3) & ~sk
    bit.paint(shade_legs & (bit.rgb[:, :, 0] > 200), mix(skin_d, skirt_d, 0.35))

    # ------------------------------------------------------------ корпус
    waist = (j.pelvis[0], j.pelvis[1] - 7 * hs)
    torso = Mask(SPR_W, SPR_H)
    torso.poly([
        (j.chest[0] - SHOULDER_W * hs * 0.94, j.chest[1] - 1.5 * hs),
        (j.chest[0] - SHOULDER_W * hs * 0.86, j.chest[1] + 5 * hs),
        (j.chest[0] - HIP_W * hs * 0.80, j.chest[1] * 0.58 + waist[1] * 0.42),
        (waist[0] - HIP_W * hs * 0.86, waist[1] + 2),
        (waist[0] + HIP_W * hs * 0.86, waist[1] + 2),
        (j.chest[0] + HIP_W * hs * 0.80, j.chest[1] * 0.58 + waist[1] * 0.42),
        (j.chest[0] + SHOULDER_W * hs * 0.86, j.chest[1] + 5 * hs),
        (j.chest[0] + SHOULDER_W * hs * 0.94, j.chest[1] - 1.5 * hs),
    ])
    bit.paint(torso, cloth)
    bit.paint(torso.edge(3, 2), cloth_d)
    bit.paint(torso.edge(-2, 0) & torso.erode(1), lighten(cloth, 1.05))

    if look.outfit in ("sailor", "pinafore"):
        collar = Mask(SPR_W, SPR_H)
        collar.poly([
            (j.chest[0] - SHOULDER_W * hs * 0.96, j.chest[1] - 2.5 * hs),
            (j.chest[0] + SHOULDER_W * hs * 0.96, j.chest[1] - 2.5 * hs),
            (j.chest[0] + SHOULDER_W * hs * 0.72, j.chest[1] + 8 * hs),
            (j.chest[0] + 2.6 * hs, j.chest[1] + 3.5 * hs),
            (j.chest[0], j.chest[1] + 11 * hs),
            (j.chest[0] - 2.6 * hs, j.chest[1] + 3.5 * hs),
            (j.chest[0] - SHOULDER_W * hs * 0.72, j.chest[1] + 8 * hs),
        ]) & torso
        col_base = skirt if look.outfit == "sailor" else cloth_d
        bit.paint(collar, col_base)
        bit.paint(collar.edge(2, 2), shade(col_base, 0.72))
        # белые полоски на воротнике
        for k in (1.5, 3.4):
            strip = collar & _band(j.chest[1] + k * hs, j.chest[1] + (k + 0.7) * hs)
            strip = strip & ~_band(0, SPR_H, j.chest[0] - 6 * hs, j.chest[0] + 6 * hs)
            bit.paint(strip, lighten(col_base, 1.55))
        ry = j.chest[1] + 6.5 * hs
        rib = Mask(SPR_W, SPR_H).poly([
            (j.chest[0] - 3.4 * hs, ry), (j.chest[0] + 3.4 * hs, ry),
            (j.chest[0] + 1.6 * hs, ry + 2.8 * hs), (j.chest[0], ry + 4.6 * hs),
            (j.chest[0] - 1.6 * hs, ry + 2.8 * hs)])
        bit.paint(rib, look.accent)
        bit.paint(rib.edge(1, 1), look.accent_dark)
    elif look.outfit == "coat":
        for k in (-1, 1):
            lap = Mask(SPR_W, SPR_H).poly([
                (j.chest[0] + k * 3.5 * hs, j.chest[1] - 1),
                (j.chest[0] + k * SHOULDER_W * hs * 0.92, j.chest[1] - 1),
                (j.chest[0] + k * 8.5 * hs, j.chest[1] + 15 * hs),
                (j.chest[0] + k * 1.6 * hs, j.chest[1] + 15 * hs)]) & torso
            bit.paint(lap, cloth_d)
        bit.paint(Mask(SPR_W, SPR_H).capsule((j.chest[0], j.chest[1]), (waist[0], waist[1] + 1), 1.6) & torso, cloth_d)
        sc = Mask(SPR_W, SPR_H).capsule((j.chest[0] - 7.5 * hs, j.chest[1] - 1.5), (j.chest[0] + 7.5 * hs, j.chest[1] - 1.5), 4.6 * hs)
        bit.paint(sc & torso.dilate(2), look.accent)
        bit.paint(sc.edge(1, 2) & torso.dilate(2), look.accent_dark)
    elif look.outfit == "hoodie":
        bit.paint(Mask(SPR_W, SPR_H).ellipse(j.chest[0], j.chest[1] - 1, SHOULDER_W * hs * 0.88, 4.6 * hs) & torso, cloth_d)
        bit.paint(Mask(SPR_W, SPR_H).capsule((j.chest[0], j.chest[1] + 2), (waist[0], waist[1]), 1.3) & torso, cloth_d)
        bit.paint(Mask(SPR_W, SPR_H).rect(int(j.chest[0] - 5), int(j.chest[1] + 12 * hs),
                                         int(j.chest[0] + 5), int(j.chest[1] + 14 * hs)) & torso, cloth_d)
    elif look.outfit == "dress":
        bit.paint(torso & _band(j.chest[1] + 4 * hs, waist[1] + 2), mix(skirt, cloth, 0.5))

    # тень под воротником на груди
    bit.paint(_band(j.chest[1] + 9 * hs, j.chest[1] + 11 * hs) & torso & ~_band(0, SPR_H, cx - 7, cx + 7),
              mix(cloth_d, look.outline, 0.15))

    # ------------------------------------------------------------ руки
    for sh, el, wr, sleeve in ((j.sh_l, j.el_l, j.wr_l, True), (j.sh_r, j.el_r, j.wr_r, True)):
        upper = Mask(SPR_W, SPR_H).capsule(sh, el, ARM_W * hs)
        fore = Mask(SPR_W, SPR_H).capsule(el, wr, FORE_W * hs)
        if look.outfit in ("coat", "hoodie"):
            bit.paint(upper, cloth)
            bit.paint(fore, cloth)
            bit.paint(upper.edge(2, 2) & ~fore, cloth_d)
            bit.paint(fore.edge(2, 2), cloth_d)
            bit.paint(Mask(SPR_W, SPR_H).ellipse(wr[0], wr[1] + 1.4, 2.7 * hs, 3.3 * hs), skin)
        else:
            ang = math.atan2(el[0] - sh[0], el[1] - sh[1])
            short = Mask(SPR_W, SPR_H).capsule(sh, along(sh, ang, ARM_UP * 0.44), ARM_W * hs + 1.6)
            bit.paint(upper, skin)
            bit.paint(fore, skin)
            bit.paint(upper.edge(2, 2) & ~short, skin_d)
            bit.paint(fore.edge(2, 2), skin_d)
            bit.paint(short, cloth)
            bit.paint(short & _band(sh[1], sh[1] + 2), lighten(cloth, 1.03))
            bit.paint(short.edge(2, 2), cloth_d)
            bit.paint(Mask(SPR_W, SPR_H).ellipse(wr[0], wr[1] + 1.6, 2.9 * hs, 3.5 * hs), skin)
            bit.paint(Mask(SPR_W, SPR_H).ellipse(wr[0] - 2.4 * hs, wr[1] + 0.2, 1.2 * hs, 1.9 * hs), skin_d)
            bit.paint(Mask(SPR_W, SPR_H).ellipse(wr[0], wr[1] + 1.6, 2.9 * hs, 3.5 * hs).edge(1, 2), skin_d)

    # ------------------------------------------------------------ шея и голова
    neck_m = Mask(SPR_W, SPR_H).capsule((j.chest[0], j.chest[1] + 1), (j.head[0], j.head[1] + hh * 0.5), 4.0 * hs)
    bit.paint(neck_m, skin)
    bit.paint(neck_m & _band(j.neck[1] - 5, j.neck[1] - 1), mix(skin_d, look.outline, 0.18))
    bit.paint(neck_m.edge(1, 0), skin_d)
    head_m = _head_mask(cx, cy, hw, hh)
    bit.paint(head_m, skin)
    bit.paint(head_m.edge(3, 2), skin_d)
    # тень под чёлкой
    bit.paint(head_m & _band(cy - hh * 0.55, cy - hh * 0.30), mix(skin, skin_d, 0.55))
    for side in (-1, 1):
        ear = Mask(SPR_W, SPR_H).ellipse(cx + side * hw * 0.96, cy + 1, 2.0 * hs, 3.0 * hs)
        bit.paint(ear, skin_d)

    # ------------------------------------------------------------ лицо
    eye_y = cy - hh * 0.02
    eye_dx = hw * 0.45
    ew, eh = 3.7 * hs, 3.8 * hs
    for side in (-1, 1):
        _eye(bit, cx + side * eye_dx, eye_y, ew, eh, pose, look, side)
        by = eye_y - eh - 2.8 * hs - pose.brow_raise * 1.4
        ang = -side * pose.brow * 2.2
        bx = cx + side * eye_dx
        bit.paint(Mask(SPR_W, SPR_H).poly([
            (bx - ew * 0.7, by + ang * 0.55), (bx + ew * 0.7, by - ang * 0.55),
            (bx + ew * 0.7, by - ang * 0.55 + 1.2), (bx - ew * 0.7, by + ang * 0.55 + 1.2)]),
            mix(hair, look.outline, 0.10))
    bit.paint(Mask(SPR_W, SPR_H).rect(int(cx) - 1, int(cy + hh * 0.20), int(cx) + 1, int(cy + hh * 0.20) + 1),
              mix(skin_d, skin, 0.30))
    bit.paint(Mask(SPR_W, SPR_H).rect(int(cx) - 1, int(cy + hh * 0.20) + 1, int(cx), int(cy + hh * 0.20) + 2),
              mix(skin_d, skin, 0.60))
    _mouth(bit, cx, cy + hh * 0.38, pose, look)
    if pose.blush > -0.5:
        pick = bayer_pick(SPR_H, SPR_W, 0.6 * max(0.18, pose.blush))
        for side in (-1, 1):
            bm = Mask(SPR_W, SPR_H).ellipse(cx + side * (eye_dx + 0.8), eye_y + eh + 1.6, 3.0, 1.7)
            bit.paint(bm & pick, mix(skin, (240, 132, 142), 0.6))
    if pose.tears > 0.02:
        for side in (-1, 1):
            tx = cx + side * (eye_dx + ew * 0.3)
            bit.paint(Mask(SPR_W, SPR_H).capsule((tx, eye_y + eh * 0.5),
                                                 (tx + side * 0.4, eye_y + eh + 3 * pose.tears), 1.0),
                      (208, 234, 255))

    # ------------------------------------------------------------ волосы спереди
    front = _columns_bang_mask(cx, cy, hw, hh, style, sw)
    front = front & _head_mask(cx, cy, hw * 1.10, hh * 1.06).dilate(3)
    # объём сверху
    cap = Mask(SPR_W, SPR_H).ellipse(cx, cy - hh * 0.24 - pose.hair_lift * 0.6, hw * 1.14, hh * 0.72)
    cap = cap & _band(0, cy - hh * 0.16)
    front = front | cap
    # боковые пряди: тонкие, вдоль щёк
    for side in (-1, 1):
        lock = Mask(SPR_W, SPR_H).capsule(
            (cx + side * hw * 1.10, cy - hh * 0.52),
            (cx + side * hw * 1.04 + sw * 0.4, cy + hh * 0.66), 2.6 * hs)
        front = front | lock
    # кончики прядей
    for k in (-0.8, -0.3, 0.3, 0.8):
        tip = (cx + k * hw + sw * 0.4, cy - hh * 0.40)
        front = front | Mask(SPR_W, SPR_H).poly(
            [(tip[0] - 2.2, tip[1] - 7), (tip[0] + 2.2, tip[1] - 7), (tip[0], tip[1] + 2.5)])

    bit.paint(front, hair)
    outer = Mask(SPR_W, SPR_H).ellipse(cx - hw * 0.10, cy - hh * 0.46, hw * 1.06, hh * 0.50)
    inner = Mask(SPR_W, SPR_H).ellipse(cx - hw * 0.10, cy - hh * 0.46, hw * 0.86, hh * 0.34)
    hl_band = front & outer & ~inner & _band(0, cy - hh * 0.28)
    hl_band = hl_band & _band(0, SPR_H, 0, int(cx + hw * 0.75))
    bit.paint(hl_band, hair_l)
    pick = bayer_pick(SPR_H, SPR_W, 0.5)
    bit.paint(hl_band & pick, mix(hair_l, hair, 0.45))
    for k in (-0.62, -0.18, 0.34, 0.7):
        sx = cx + k * hw
        bit.paint(Mask(SPR_W, SPR_H).capsule((sx, cy - hh * 0.78),
                                             (sx + k * hw * 0.12 + sw * 0.3, cy - hh * (0.24 + 0.1 * abs(k))), 1.0)
                  & front, mix(hair_d, hair, 0.35))
    bit.paint(front.edge(2, 2), hair_d)
    bit.paint(front.edge(0, 2) & head_m, mix(hair_d, look.outline, 0.55))

    # ------------------------------------------------------------ аксессуары
    if look.accessory == "hairpin":
        px, py = cx + hw * 0.52, cy - hh * 0.58
        bit.paint(Mask(SPR_W, SPR_H).poly([(px, py), (px + 7, py - 1.2), (px + 7, py + 3), (px, py + 2.4)]), look.accent)
        bit.paint(Mask(SPR_W, SPR_H).rect(int(px + 7), int(py), int(px + 9), int(py + 2)), lighten(look.accent, 1.35))
    elif look.accessory == "ribbon":
        px, py = cx - hw * 0.98, cy - hh * 0.66
        bit.paint(Mask(SPR_W, SPR_H).ellipse(px, py, 4.2, 3.0), look.accent)
        bit.paint(Mask(SPR_W, SPR_H).ellipse(px + 6.5, py, 4.2, 3.0), look.accent_dark)
        bit.paint(Mask(SPR_W, SPR_H).ellipse(px + 3, py, 1.9, 1.9), lighten(look.accent, 1.3))
    elif look.accessory == "headphones":
        band_col = (60, 58, 74)
        bit.paint(Mask(SPR_W, SPR_H).capsule((cx - hw * 1.15, cy - hh * 0.30),
                                             (cx + hw * 1.15, cy - hh * 0.30), 2.6), band_col)
        for side in (-1, 1):
            cup = Mask(SPR_W, SPR_H).ellipse(cx + side * hw * 1.10, cy + hh * 0.02, 3.2, 4.2)
            bit.paint(cup, band_col)
            bit.paint(cup.edge(1, 1), lighten(band_col, 1.7))
    elif look.accessory == "cap":
        cap_m = Mask(SPR_W, SPR_H).ellipse(cx, cy - hh * 0.55, hw * 1.12, hh * 0.45)
        bit.paint(cap_m, look.accent)
        bit.paint(cap_m.edge(2, 2), look.accent_dark)
        brim = Mask(SPR_W, SPR_H).poly([(cx + hw * 0.2, cy - hh * 0.42), (cx + hw * 1.5, cy - hh * 0.36),
                                        (cx + hw * 1.5, cy - hh * 0.22), (cx + hw * 0.2, cy - hh * 0.28)])
        bit.paint(brim, look.accent_dark)

    # ------------------------------------------------------------ контур, контровой свет, AO
    sil = bit.mask
    bit.paint(sil.outline(1), look.outline)
    rim = sil.edge(-1, 0) & ~sil.edge(-1, 3)
    bit.paint(rim, mix(look.rim, hair_l, 0.3))
    # тень под подбородком — только на шее, без «бороды»
    bit.paint(neck_m & Mask(SPR_W, SPR_H).ellipse(cx, cy + hh * 0.56, hw * 0.52, hh * 0.16),
              mix(skin_d, look.outline, 0.22))
    return bit


# ---------------------------------------------------------------------------
def _eye(bit: Bitmap, cx, cy, w, h, pose: Pose, look: Look, side: int) -> None:
    """Аниме-глаз: дуга века, радужка с градиентом, два блика.

    Веко рисуется дугой из трёх отрезков (толще к внешнему углу), поэтому
    глаз не выглядит прямоугольником под чёрной планкой.
    """
    closed = pose.blink > 0.55
    if closed:
        # закрытый глаз: дуга ресниц с «галочкой» на внешнем углу
        pts = [(cx - side * w, cy - h * 0.05), (cx - side * w * 0.4, cy + h * 0.42),
               (cx + side * w * 0.45, cy + h * 0.40), (cx + side * w * 1.05, cy - h * 0.12)]
        for a, b in zip(pts, pts[1:]):
            bit.paint(Mask(SPR_W, SPR_H).capsule(a, b, 1.6), look.outline)
        bit.paint(Mask(SPR_W, SPR_H).capsule((cx + side * w * 0.9, cy - h * 0.1),
                                             (cx + side * w * 1.3, cy - h * 0.45), 1.2), look.outline)
        return

    hh = h * max(0.3, min(1.25, pose.eye_open * (1 - pose.blink * 1.35)))
    sclera = Mask(SPR_W, SPR_H).ellipse(cx, cy, w, hh)
    bit.paint(sclera, (252, 250, 254))

    lx, ly = pose.look_x * 1.1, pose.look_y * 0.8
    ir = w * 0.80
    icx, icy = cx + lx, cy + ly + hh * 0.06
    iris = Mask(SPR_W, SPR_H).ellipse(icx, icy, ir, hh * 0.95) & sclera.dilate(1)
    bit.paint(iris, look.eye)
    # верх радужки темнее, низ — светлее (стеклянный глаз)
    bit.paint(iris & _band(icy - hh, icy - hh * 0.15), mix(look.eye, look.eye_dark, 0.62))
    bit.paint(iris & _band(icy + hh * 0.25, icy + hh), mix(look.eye, (255, 255, 255), 0.22))
    bit.paint(Mask(SPR_W, SPR_H).ellipse(icx, icy + hh * 0.10, ir * 0.44, hh * 0.50) & sclera.dilate(1),
              look.eye_dark)
    # блики
    bit.paint(Mask(SPR_W, SPR_H).ellipse(icx - ir * 0.40, icy - hh * 0.36, 1.25, 1.35) & sclera, (255, 255, 255))
    bit.paint(Mask(SPR_W, SPR_H).ellipse(icx + ir * 0.42, icy + hh * 0.30, 0.8, 0.9) & sclera,
              mix(look.eye, (255, 255, 255), 0.8))
    # тень от верхнего века на белке
    bit.paint(sclera & _band(cy - hh, cy - hh * 0.45) & ~iris, mix((252, 250, 254), look.eye_dark, 0.18))

    # верхнее веко дугой: три отрезка, толще снаружи
    arc = [(cx - side * w * 0.95, cy - hh * 0.30),
           (cx - side * w * 0.35, cy - hh * 0.86),
           (cx + side * w * 0.45, cy - hh * 0.92),
           (cx + side * w * 1.02, cy - hh * 0.42)]
    widths = (1.2, 1.5, 1.7)
    for (a, b), wd in zip(zip(arc, arc[1:]), widths):
        bit.paint(Mask(SPR_W, SPR_H).capsule(a, b, wd) & sclera.dilate(2), look.outline)
    # внешний уголок ресниц
    bit.paint(Mask(SPR_W, SPR_H).capsule((cx + side * w * 0.95, cy - hh * 0.55),
                                         (cx + side * w * 1.45, cy - hh * 1.05), 1.1), look.outline)
    # нижнее веко: тонкая тёплая линия только снаружи
    bit.paint(Mask(SPR_W, SPR_H).capsule((cx + side * w * 0.15, cy + hh * 0.95),
                                         (cx + side * w * 0.95, cy + hh * 0.72), 0.9)
              & sclera.dilate(1), mix(look.skin_shade, look.outline, 0.55))


def _mouth(bit: Bitmap, cx, cy, pose: Pose, look: Look) -> None:
    """Рот: линия-дуга (грусть/улыбка) или мягкий овал при речи."""
    col = mix(look.outline, (176, 76, 84), 0.42)
    cur = pose.mouth_curve
    if pose.mouth < 0.14:
        # линия рта: 3-4 пикселя, изгиб зависит от эмоции
        dip = 0.9 - cur * 0.8
        pts = [(cx - 1.6, cy - cur * 0.7), (cx, cy + dip), (cx + 1.6, cy - cur * 0.7)]
        for a, b in zip(pts, pts[1:]):
            bit.paint(Mask(SPR_W, SPR_H).capsule(a, b, 0.8), col)
        return
    w = 1.2 + pose.mouth * 1.6
    hh = 0.8 + pose.mouth * 1.9
    if cur > 0.25:                       # открытая улыбка
        mouth = Mask(SPR_W, SPR_H).poly([
            (cx - w, cy - hh * 0.35), (cx + w, cy - hh * 0.35),
            (cx + w * 0.62, cy + hh), (cx - w * 0.62, cy + hh)])
    else:                                # речь
        mouth = Mask(SPR_W, SPR_H).ellipse(cx, cy + hh * 0.15, w, hh)
    bit.paint(mouth, mix(look.outline, (112, 38, 48), 0.55))
    bit.paint(Mask(SPR_W, SPR_H).ellipse(cx, cy + hh * 0.55, w * 0.55, hh * 0.4) & mouth, (206, 118, 128))
    if pose.mouth > 0.3:
        bit.paint(mouth & _band(cy - hh, cy - hh * 0.45), (248, 246, 250))
