"""Процедурный генератор аниме-чиби спрайтов.

Спрайт рисуется примитивами на сетке 64x64 (ступни на y=58) и вставляется
в кадр с целочисленным масштабом: x1 — общий план, x2 — крупный.

Стилистические правила, без которых «чиби» превращается в цветное пятно:
  * силуэт всегда обведён контуром в 1px (тёмный тон, не чёрный);
  * один тон тени на деталь (cel-shading по нижне-правой кромке);
  * голова — самый крупный объект, глаза занимают до половины лица;
  * волосы перекрывают лицо и создают «рваный» край из прядей;
  * никакого сглаживания и полупрозрачности.

Вертикальная раскладка (при height=1.0):
    8..25   голова (17 px)
    25..27  шея
    27..39  корпус
    38..47  юбка
    46..58  ноги + гольфы + туфли
"""
from __future__ import annotations

import math
from dataclasses import dataclass, fields, replace

import numpy as np

from .canvas import Raster
from .palette import Palette, lighten, mix, shade

SPR_W, SPR_H = 64, 64
GROUND_Y = 58
CX = 32


# ---------------------------------------------------------------------------
@dataclass
class CharacterSpec:
    """Параметры внешности: всё, что определяет «кто это»."""

    name: str = "Aoi"
    hair: str = "long"          # long | twin | short | bob | ponytail | braid
    hair_color: str = "hair"
    eye_color: str = "eye"
    outfit: str = "sailor"      # sailor | hoodie | coat | dress | pinafore
    accessory: str = ""         # hairpin | ribbon | headphones | cap | ""
    skin: str = "skin"
    height: float = 1.0

    def with_hair(self, style: str) -> "CharacterSpec":
        return replace(self, hair=style)


@dataclass
class Pose:
    """Состояние анимации в конкретном кадре."""

    bob: float = 0.0            # вертикальное покачивание корпуса
    head_tilt: float = 0.0
    head_y: float = 0.0
    arm_l: float = 0.0          # угол руки: 0 — вниз, pi/2 — в сторону
    arm_r: float = 0.0
    leg_phase: float = -1.0     # фаза шага 0..1; <0 — стоит
    blink: float = 0.0          # 0..1
    mouth: float = 0.0          # 0..1
    hair_sway: float = 0.0
    skirt_sway: float = 0.0
    look: float = 0.0           # смещение зрачков -1..1
    squash: float = 0.0         # приседание 0..1
    turn: float = 0.0           # 0 — анфас, 1 — в профиль (сдвиг деталей)

    def blend(self, other: "Pose", t: float) -> "Pose":
        return Pose(**{f.name: getattr(self, f.name) * (1 - t) + getattr(other, f.name) * t for f in fields(self)})


# ---------------------------------------------------------------------------
def _fill_widths(r: Raster, cx: int, y0: int, half_widths, color, dx: int = 0) -> np.ndarray:
    """Залить фигуру по таблице полуширин построчно; вернуть маску."""
    m = np.zeros((r.h, r.w), dtype=bool)
    for i, hw in enumerate(half_widths):
        y = y0 + i
        hw = int(round(hw))
        if hw <= 0 or not (0 <= y < r.h):
            continue
        x0 = max(0, int(cx + dx - hw))
        x1 = min(r.w - 1, int(cx + dx + hw))
        if x0 <= x1:
            m[y, x0 : x1 + 1] = True
    r.shade_mask(m, color)
    return m


def _cel(r: Raster, m: np.ndarray, dark, dx: int = 1, dy: int = 1) -> None:
    """Тень по внутренней кромке маски (один тон, без градиента)."""
    e = Raster.inner_edge(m, dx, dy)
    r.px[e, :3] = dark[:3]
    r.px[e, 3] = 255


def _line_mask(r: Raster, x0, y0, x1, y1, thick: int = 2) -> np.ndarray:
    m = np.zeros((r.h, r.w), dtype=bool)
    n = max(abs(int(x1) - int(x0)), abs(int(y1) - int(y0)), 1)
    for i in range(n + 1):
        t = i / n
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        if 0 <= y < r.h:
            m[y, max(0, x - thick // 2) : min(r.w, x - thick // 2 + thick)] = True
    return m


# ---------------------------------------------------------------------------
def render_character(spec: CharacterSpec, pose: Pose, pal: Palette) -> Raster:
    r = Raster(SPR_W, SPR_H)
    r_out = pal.get("outline", (12, 9, 16))

    hair = pal.get(spec.hair_color, pal.get("hair", (70, 45, 60)))
    hair_d = mix(shade(hair, 0.60), r_out, 0.18)
    hair_l = lighten(hair, 1.30)
    skin = pal.get(spec.skin, pal.get("skin", (245, 205, 175)))
    skin_d = pal.get("skin_shade", shade(skin, 0.80))
    eye = pal.get(spec.eye_color, pal.get("eye", (90, 140, 210)))
    eye_d = pal.get("eye_dark", shade(eye, 0.55))
    cloth = pal.get("uniform", (240, 240, 245))
    cloth_d = pal.get("uniform_shade", shade(cloth, 0.82))
    accent = pal.get("scarf", pal.get("accent", (210, 70, 90)))
    accent_d = pal.get("scarf_shade", shade(accent, 0.72))
    skirt = pal.get("skirt", (58, 70, 112))
    skirt_d = pal.get("skirt_shade", shade(skirt, 0.70))
    sock = pal.get("sock", (238, 238, 244))
    shoe = pal.get("shoe", (44, 34, 44))

    hs = spec.height
    bob = int(round(pose.bob))
    turn = pose.turn
    crouch = pose.squash

    # ---- вертикальные опорные точки --------------------------------------
    feet_y = GROUND_Y + int(round(crouch * 3))
    leg_h = max(4, int(round(12 * hs - crouch * 2)))
    skirt_h = int(round(9 * hs))
    torso_h = int(round(12 * hs))
    head_h = int(round(18 * hs))
    head_w = int(round(8.4 * hs))

    skirt_bottom = feet_y - leg_h + 1
    skirt_top = skirt_bottom - skirt_h
    torso_bottom = skirt_top + 1
    torso_top = torso_bottom - torso_h + bob
    neck_y = torso_top - 1
    head_bot = neck_y
    head_top = head_bot - head_h + int(round(pose.head_y))
    head_bot += int(round(pose.head_y)) - head_h + head_h  # оставляем как есть
    head_cx = int(round(CX + pose.head_tilt + turn * 2))
    torso_cx = CX
    sway = int(round(pose.hair_sway))

    # ---- волосы сзади ----------------------------------------------------
    back = np.zeros((r.h, r.w), dtype=bool)
    style = spec.hair
    if style in ("long", "braid", "ponytail", "twin"):
        length = {"long": int(34 * hs), "braid": int(30 * hs), "ponytail": int(22 * hs), "twin": int(24 * hs)}[style]
        for i in range(length):
            y = head_top + 1 + i
            t = i / max(1, length - 1)
            wave = math.sin(i * 0.34) * 1.2 + sway * (0.4 + t)
            hw = (head_w + 1.1) * (1.0 - 0.20 * t) + (1.0 if style == "long" else 0.0)
            if style in ("ponytail", "braid"):
                hw *= 0.85
            # скругление макушки: первые строки заметно уже
            hw *= min(1.0, 0.34 + 0.19 * i)
            x0 = int(round(head_cx - hw + wave))
            x1 = int(round(head_cx + hw + wave))
            if 0 <= y < r.h:
                back[y, max(0, x0) : min(r.w, x1 + 1)] = True
        # рваные кончики
        tip = head_top + 2 + length
        for k in range(-2, 3):
            x = head_cx + int(k * head_w * 0.55) + sway
            ln = 3 - abs(k)
            for j in range(max(1, ln)):
                y = tip + j
                if 0 <= y < r.h and 0 <= x < r.w:
                    back[y, max(0, x - 1) : min(r.w, x + 2)] = True
    elif style in ("short", "bob"):
        length = int((11 if style == "bob" else 7) * hs)
        for i in range(length):
            y = head_top + 2 + i
            hw = head_w + 1.4 - i * 0.05
            if 0 <= y < r.h:
                back[y, max(0, head_cx - int(hw) + sway) : min(r.w, head_cx + int(hw) + sway + 1)] = True
    if style == "twin":
        for side in (-1, 1):
            bx = head_cx + side * int(head_w + 1.5)
            for i in range(int(20 * hs)):
                y = head_top + 5 + i
                t = i / max(1, int(20 * hs))
                x = bx + side * int(2.4 * math.sin(t * 2.6) + sway * 0.6)
                hw = int(round(3.2 * (1 - 0.5 * t)))
                if 0 <= y < r.h and hw > 0:
                    back[y, max(0, x - hw) : min(r.w, x + hw + 1)] = True
    r.shade_mask(back, hair_d)
    if back.any():
        ys = np.where(back)[0]
        rows = np.arange(r.h)[:, None]
        cols = np.arange(r.w)[None, :]
        arc = np.abs(cols - head_cx) <= int(head_w * 0.72)
        band = back & (rows >= ys.min() + 1) & (rows <= ys.min() + 2) & arc
        r.px[band, :3] = hair_l[:3]
    _cel(r, back, hair_d, dx=1, dy=-1)

    # ---- ноги ------------------------------------------------------------
    leg_w = max(2, int(round(3 * hs)))
    gap = max(1, int(round(1.2 * hs)))
    inner = gap // 2 + 1
    for side in (-1, 1):
        dx = dy = 0
        if pose.leg_phase >= 0:
            ph = pose.leg_phase * 2 * math.pi + (0 if side < 0 else math.pi)
            dx = int(round(math.sin(ph) * 1.6 * hs))
            dy = -int(round(max(0.0, math.cos(ph)) * 2.0 * hs))
        cx_leg = torso_cx + side * (inner + leg_w // 2) + dx
        y_bot = feet_y + dy
        y_top = y_bot - leg_h
        thigh_col = skin
        leg = _fill_widths(r, cx_leg, y_top, [max(1, (leg_w - 1) // 2)] * (leg_h + 1), thigh_col)
        # гольфы — от середины голени до щиколотки
        sock_top = y_bot - int(round(7 * hs))
        sm = leg & (np.arange(r.h)[:, None] >= sock_top) & (np.arange(r.h)[:, None] <= y_bot - 2)
        r.px[sm, :3] = sock[:3]
        _cel(r, sm, mix(sock, r_out, 0.35))
        # туфли
        shm = leg & (np.arange(r.h)[:, None] >= y_bot - 1) & (np.arange(r.h)[:, None] <= y_bot + 1)
        r.px[shm, :3] = shoe[:3]
        _cel(r, shm, shade(shoe, 0.7))
        _cel(r, leg & ~sm & ~shm, skin_d)

    # ---- корпус ----------------------------------------------------------
    tw = [5, 5, 5, 4.6, 4.4, 4.4, 4.3, 4.2, 4.2, 4.2, 4.2, 4.2]
    torso = _fill_widths(r, torso_cx, torso_top, [w * hs for w in tw[:torso_h]], cloth)
    _cel(r, torso, cloth_d)

    if spec.outfit in ("sailor", "pinafore"):
        # матросский воротник: тёмная накидка на плечах + V-вырез
        for i, y in enumerate(range(torso_top + int(2 * hs), torso_top + int(7 * hs))):
            half = int(round((4.6 - i * 0.9) * hs))
            if half <= 0:
                break
            for x in range(torso_cx - int(4.8 * hs), torso_cx + int(4.8 * hs) + 1):
                if abs(x - torso_cx) >= half:
                    if 0 <= y < r.h:
                        r.put(x, y, skirt if spec.outfit == "sailor" else cloth_d)
        # лента на груди
        ry = torso_top + int(2 * hs)
        r.rect(torso_cx - 2, ry, torso_cx + 2, ry + 1, accent)
        r.rect(torso_cx - 1, ry + 2, torso_cx + 1, ry + 3, accent_d)
        r.rect(torso_cx - 1, ry + 1, torso_cx + 1, ry + 1, accent)
    elif spec.outfit == "coat":
        r.rect(torso_cx, torso_top, torso_cx, torso_top + torso_h - 1, cloth_d)
        r.rect(torso_cx - int(2 * hs), torso_top + 1, torso_cx + int(2 * hs), torso_top + 1, cloth_d)
        r.rect(torso_cx - int(4.6 * hs), torso_top + int(3 * hs), torso_cx - int(3.2 * hs), torso_bottom, cloth_d)
        r.rect(torso_cx + int(3.2 * hs), torso_top + int(3 * hs), torso_cx + int(4.6 * hs), torso_bottom, cloth_d)
    elif spec.outfit == "hoodie":
        r.rect(torso_cx - int(5 * hs), torso_top, torso_cx + int(5 * hs), torso_top + 1, cloth_d)
        r.rect(torso_cx - 1, torso_top + 2, torso_cx + 1, torso_bottom - 1, cloth_d)
        r.rect(torso_cx - 2, torso_top + int(5 * hs), torso_cx + 2, torso_top + int(6 * hs), cloth_d)

    # ---- юбка (поверх корпуса, ниже талии) --------------------------------
    sk_hw = [int(round((5.0 + i * 0.55) * hs)) for i in range(skirt_h)]
    sk = _fill_widths(r, torso_cx, skirt_top, sk_hw, skirt if spec.outfit != "coat" else cloth)
    for i in range(skirt_h):
        y = skirt_top + i
        for xo in (-int(2.4 * hs), 0, int(2.4 * hs)):
            x = torso_cx + xo + int(round(pose.skirt_sway * (i / max(1, skirt_h))))
            if 0 <= y < r.h and 0 <= x < r.w and sk[y, x]:
                r.put(x, y, skirt_d)
    _cel(r, sk, skirt_d if spec.outfit != "coat" else cloth_d)
    hem = sk & (np.arange(r.h)[:, None] == skirt_top + skirt_h - 1)
    r.px[hem, :3] = (skirt_d if spec.outfit != "coat" else cloth_d)[:3]

    # ---- руки ------------------------------------------------------------
    for side, ang in ((-1, pose.arm_l), (1, pose.arm_r)):
        sx = torso_cx + side * int(round(5.0 * hs))
        sy = torso_top + int(round(1.2 * hs))
        L = 11.0 * hs
        a = -side * ang  # положительный угол поднимает руку наружу
        hx = sx + side * (math.sin(abs(a)) * L * (1 if a >= 0 else 0.2) + 1.4)
        hy = sy + math.cos(a) * L
        if a < 0:  # рука прижата к телу
            hx = sx + side * math.sin(abs(a)) * L * 0.3
        arm = _line_mask(r, sx, sy, hx, hy, thick=max(2, int(round(2 * hs))))
        # плечо-рукав
        sleeve = arm & (np.arange(r.h)[:, None] <= sy + int(round(2.4 * hs)))
        r.shade_mask(arm, skin)
        if spec.outfit in ("coat", "hoodie"):
            r.px[arm, :3] = cloth[:3]
        if spec.outfit in ("sailor", "pinafore"):
            r.px[sleeve, :3] = cloth[:3]
        elif spec.outfit in ("coat", "hoodie"):
            pass
        _cel(r, arm, skin_d if spec.outfit in ("sailor", "pinafore") else cloth_d)
        # кисть
        hand = np.zeros_like(arm)
        hxi, hyi = int(round(hx)), int(round(hy))
        hand[max(0, hyi - 1) : hyi + 1, max(0, hxi - 1) : hxi + 2] = True
        hand &= Raster.dilate(arm, 1)
        r.shade_mask(hand, skin)
        _cel(r, hand, skin_d)

    # ---- шея и голова ----------------------------------------------------
    r.rect(head_cx - 1, neck_y, head_cx + 1, neck_y + 1, skin_d)
    prof = [0.40, 0.62, 0.80, 0.90, 0.97, 1.0, 1.0, 0.99, 0.96, 0.92, 0.87, 0.80, 0.71, 0.60, 0.46, 0.30, 0.14]
    widths = [max(1, int(round(head_w * k))) for k in prof]
    widths = (widths + [1] * head_h)[:head_h]
    head = _fill_widths(r, head_cx, head_top, widths, skin)
    _cel(r, head, skin_d)

    # ---- лицо ------------------------------------------------------------
    eye_y = head_top + int(round(head_h * 0.54))
    eye_w = max(3, int(round(head_w * 0.30)))
    eye_h = max(3, int(round(head_h * 0.28)))
    eye_gap = max(4, int(round(head_w * 0.52)))
    look = int(round(max(-1.0, min(1.0, pose.look))))
    furrow = int(round(turn * 1.5))
    for side in (-1, 1):
        ex = head_cx + side * eye_gap - eye_w // 2 + (furrow if side < 0 else 0)
        if pose.blink > 0.5:
            r.rect(ex, eye_y + 1, ex + eye_w - 1, eye_y + 1, r_out)
            r.put(ex - 1, eye_y + 1, r_out)
            r.put(ex + eye_w, eye_y + 1, r_out)
        else:
            r.rect(ex, eye_y, ex + eye_w - 1, eye_y + eye_h - 1, (252, 250, 255))
            # радужка: снизу-вверх, с зрачком и бликом
            ix0 = ex + (1 if side > 0 else 0)
            ix1 = ex + eye_w - 1 - (1 if side < 0 else 0)
            ix0 += look if side < 0 else 0
            ix1 += look if side < 0 else 0
            r.rect(ix0, eye_y, ix1, eye_y + eye_h - 1, eye)
            r.rect(ix0, eye_y + eye_h - 2, ix1, eye_y + eye_h - 1, eye_d)
            r.put(ix0 if side < 0 else ix1, eye_y, (255, 255, 255))
            if eye_h >= 4:
                r.put(ix1 if side < 0 else ix0, eye_y + eye_h - 2, mix(eye, (255, 255, 255), 0.55))
            # верхнее веко/ресницы
            r.rect(ex - (0 if side > 0 else 1), eye_y - 1, ex + eye_w - 1 + (0 if side < 0 else 1), eye_y - 1, r_out)
            # брови
            by = eye_y - 3
            r.rect(ex, by, ex + eye_w - 1, by, mix(hair_d, r_out, 0.45))
    # нос
    r.put(head_cx + furrow // 2, eye_y + eye_h + 1, skin_d)
    # рот
    my = eye_y + eye_h + 2
    if pose.mouth > 0.15:
        r.rect(head_cx - 1, my, head_cx + 1, my, mix(r_out, (190, 80, 90), 0.35))
        if pose.mouth > 0.55:
            r.rect(head_cx - 1, my + 1, head_cx + 1, my + 1, mix(r_out, (150, 55, 70), 0.5))
    else:
        r.rect(head_cx - 1, my, head_cx, my, mix(skin_d, r_out, 0.55))
    # румянец
    for side in (-1, 1):
        bx = head_cx + side * (eye_gap + 2)
        if 0 <= bx < r.w and eye_y + eye_h + 1 < r.h:
            c = mix(skin, (232, 128, 140), 0.5)
            r.put(bx, eye_y + eye_h + 1, c)
            r.put(bx + (1 if side < 0 else -1), eye_y + eye_h + 1, c)

    # ---- волосы спереди --------------------------------------------------
    # Шапка волос: повторяет округлость черепа, но на 1 px выше и шире,
    # снизу ограничена зигзагообразным профилем чёлки.
    yy = np.arange(r.h)[:, None]
    head_zone = Raster.dilate(head, 2) | Raster.dilate(head, 3) & (yy <= head_top + 3)
    dome = np.roll(head_zone, -1, axis=0) | head_zone
    ctrl_x = np.array([-1.30, -1.00, -0.80, -0.58, -0.34, -0.08, 0.16, 0.40, 0.64, 0.90, 1.24])
    ctrl_y = np.array([0.62, 0.42, 0.22, 0.34, 0.18, 0.31, 0.17, 0.30, 0.19, 0.38, 0.60])
    limit = np.zeros((r.h, r.w), dtype=np.int32)
    limit[:] = head_top + int(round(head_h * 0.5))
    for x in range(0, r.w):
        t = (x - head_cx + sway * 0.55) / max(1.0, head_w)
        depth = float(np.interp(t, ctrl_x, ctrl_y)) if -1.3 <= t <= 1.3 else 0.95
        limit[:, x] = head_top + int(round(depth * head_h))
    front = dome & (yy <= limit)
    # боковые пряди вдоль щёк
    for side in (-1, 1):
        for i in range(int(head_h * 0.85)):
            y = head_top + 3 + i
            x = head_cx + side * (head_w - 0) + int(0.5 * math.sin(i * 0.45 + sway * 0.3))
            for xx in (x, x + side):
                if 0 <= y < r.h and 0 <= xx < r.w:
                    front[y, xx] = True
    r.shade_mask(front, hair)
    fb = front & (np.arange(r.h)[:, None] <= head_top + 2) & (np.arange(r.h)[:, None] >= head_top - 1)
    r.px[fb, :3] = hair_l[:3]
    _cel(r, front, hair_d)
    # тёмная линия под чёлкой (отделяет волосы от лица)
    lower = front & ~np.roll(front, -1, axis=0)
    r.px[lower & head, :3] = mix(hair_d, r_out, 0.3)[:3]

    # ---- аксессуары ------------------------------------------------------
    if spec.accessory == "hairpin":
        px = head_cx + int(head_w * 0.45)
        py = head_top + 2
        r.rect(px, py, px + 2, py, pal.get("accent", (255, 200, 120)))
        r.put(px + 3, py, pal.get("accent", (255, 200, 120)))
    elif spec.accessory == "ribbon":
        px = head_cx - int(head_w * 0.85)
        py = head_top + 1
        r.rect(px, py, px + 2, py + 1, pal.get("accent", (230, 80, 100)))
        r.rect(px + 3, py, px + 5, py + 1, pal.get("scarf_shade", (160, 40, 70)))
    elif spec.accessory == "headphones":
        band = (58, 56, 70)
        for x in (head_cx - head_w - 1, head_cx + head_w):
            r.rect(x, head_top + int(head_h * 0.38), x + 1, head_top + int(head_h * 0.66), band)
        r.rect(head_cx - head_w - 1, head_top - 1, head_cx + head_w, head_top - 1, band)
    elif spec.accessory == "cap":
        cap = pal.get("accent", (230, 80, 100))
        r.rect(head_cx - head_w - 1, head_top - 2, head_cx + head_w + 1, head_top, cap)
        r.rect(head_cx + head_w + 1, head_top, head_cx + head_w + 3, head_top, shade(cap, 0.8))

    # ---- контур ----------------------------------------------------------
    sil = r.px[..., 3] > 0
    r.outline(sil, r_out, 1)
    return r


def sprite_sheet(specs, poses, pal, path: str = ".scratch/sprites.png", k: int = 3) -> None:
    from PIL import Image

    cell = SPR_W * k
    img = np.zeros((len(specs) * cell, len(poses) * cell, 3), dtype=np.uint8)
    img[:] = pal.get("sky_mid", (60, 50, 80))
    for ri, spec in enumerate(specs):
        for ci, pose in enumerate(poses):
            spr = render_character(spec, pose, pal)
            big = np.repeat(np.repeat(spr.px, k, axis=0), k, axis=1)
            m = big[..., 3] > 0
            sub = img[ri * cell : (ri + 1) * cell, ci * cell : (ci + 1) * cell]
            sub[m] = big[..., :3][m]
    Image.fromarray(img).save(path)
