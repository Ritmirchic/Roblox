"""Self-contained procedural character renderer for SPACE MINER crew portraits.

Every portrait is a coherent humanoid built from a signed-distance field
(anatomy primitives smooth-blended into suit, armour and helmet volumes) and
shaded with sphere tracing: soft shadow, ambient occlusion, dual-key light,
fresnel rim, emissive visor. Nothing is cropped out of an external model, so a
head can never end up floating above a torso, and no two cards share geometry.

Requires only numpy + numba + pillow: fully reproducible offline.
"""
from __future__ import annotations

import math

import numpy as np
from numba import njit

# material ids
M_SKIN = 1
M_SUIT = 2
M_ARMOR = 3
M_VISOR = 4
M_TRIM = 5
M_GEAR = 6
M_HAIR = 7


@njit(cache=True, fastmath=True)
def _smin(a, b, k):
    h = max(0.0, 1.0 - abs(a - b) / k)
    return min(a, b) - h * h * k * 0.25


@njit(cache=True, fastmath=True)
def _smat(a, b, ka, kb, k):
    """smin for distance + material blend (material follows the closer shape)."""
    h = max(0.0, 1.0 - abs(a - b) / k)
    m = h * h * 0.5
    d = min(a, b) - h * k * 0.2
    mat = ka if a < b else kb
    if m > 0.42:
        mat = ka if a < b else kb
    return d, mat


@njit(cache=True, fastmath=True)
def sd_sphere(px, py, pz, cx, cy, cz, r):
    x, y, z = px - cx, py - cy, pz - cz
    return sqrt3(x * x + y * y + z * z) - r


@njit(cache=True, fastmath=True)
def sd_ellip(px, py, pz, cx, cy, cz, rx, ry, rz):
    # conservative approximation (scaled-sphere k correction approximated by
    # dividing by the max radius so the march never oversteps)
    x, y, z = (px - cx) / rx, (py - cy) / ry, (pz - cz) / rz
    k = min(rx, min(ry, rz))
    return (sqrt3(x * x + y * y + z * z) - 1.0) * k


@njit(cache=True, fastmath=True)
def sd_capsule(px, py, pz, ax, ay, az, bx, by, bz, ra, rb):
    pax, pay, paz = px - ax, py - ay, pz - az
    bax, bay, baz = bx - ax, by - ay, bz - az
    h = bax * bax + bay * bay + baz * baz
    t = (pax * bax + pay * bay + paz * baz) / max(h, 1e-9)
    t = min(max(t, 0.0), 1.0)
    r = ra + (rb - ra) * t
    qx, qy, qz = pax - bax * t, pay - bay * t, paz - baz * t
    return sqrt3(qx * qx + qy * qy + qz * qz) - r


@njit(cache=True, fastmath=True)
def sd_roundbox(px, py, pz, cx, cy, cz, bx, by, bz, rr):
    qx = abs(px - cx) - bx + rr
    qy = abs(py - cy) - by + rr
    qz = abs(pz - cz) - bz + rr
    mx = max(qx, 0.0)
    my = max(qy, 0.0)
    mz = max(qz, 0.0)
    outer = sqrt3(mx * mx + my * my + mz * mz)
    inner = min(max(qx, max(qy, qz)), 0.0)
    return outer + inner - rr


@njit(cache=True, fastmath=True)
def sqrt3(v):
    return v ** 0.5


@njit(cache=True, fastmath=True)
def rot_y(px, py, pz, c, s):
    return px * c + pz * s, py, -px * s + pz * c


@njit(cache=True, fastmath=True)
def map_char(px, py, pz, P, lean_c, lean_s):
    """Returns (distance, material id). P = parameter vector (see PARAM_LAYOUT)."""
    # character-local space: lean the whole upper body slightly
    x, y, z = rot_y(px, py, pz, lean_c, lean_s)
    twist = P[0]
    x, y, z = rot_y(x, y, z, math.cos(twist), math.sin(twist))

    chest = P[1]
    bulk = P[2]
    head_s = P[3]
    arm = P[4]
    shoulder = P[5]
    hair = P[10] if P.shape[0] > 10 else 1.0
    beard = P[11] if P.shape[0] > 11 else 0.0
    jaw_w = P[13] if P.shape[0] > 13 else 1.0
    synth = P[12] if P.shape[0] > 12 else 0.0
    hip_y = 0.885
    chest_y = 1.245
    head_y = 1.615

    # ---------------- body (skin) -------------------------------------------
    d_head = sd_ellip(x, y, z, 0.0, head_y, 0.0,
                      0.118 * head_s * (0.86 + 0.14 * jaw_w), 0.136 * head_s, 0.124 * head_s)
    jaw = sd_ellip(x, y, z, 0.0, head_y - 0.082 * head_s, 0.010 * head_s,
                   0.086 * head_s * jaw_w, 0.060 * head_s * (1.10 - 0.10 * jaw_w),
                   0.074 * head_s * (0.92 + 0.08 * jaw_w))
    d_head = min(d_head, jaw)
    chin = sd_sphere(x, y, z, 0.0, head_y - 0.120 * head_s, 0.048 * head_s, 0.034 * head_s)
    d_head = min(d_head, chin)
    nose = sd_ellip(x, y, z, 0.0, head_y - 0.030 * head_s, 0.118 * head_s,
                    0.019 * head_s, 0.030 * head_s, 0.026 * head_s)
    d_head = min(d_head, nose)
    ear_l = sd_ellip(x, y, z, 0.108 * head_s, head_y - 0.01, 0.0, 0.018, 0.032, 0.026)
    ear_r = sd_ellip(x, y, z, -0.108 * head_s, head_y - 0.01, 0.0, 0.018, 0.032, 0.026)
    d_head = min(d_head, min(ear_l, ear_r))

    d = d_head
    mat = M_SKIN

    # ---------------- hair / facial hair (open-face helmets only) ----------
    htype0 = int(P[9])
    if synth < 0.5 and (htype0 == 1 or htype0 == 6 or htype0 == 7):
        hstyle = int(hair)
        cap = sd_ellip(x, y, z, 0.0, head_y + 0.030 * head_s, -0.014 * head_s,
                       0.1205 * head_s, 0.1300 * head_s, 0.1330 * head_s)
        face_cut = sd_ellip(x, y, z, 0.0, head_y - 0.050 * head_s, 0.082 * head_s,
                            0.100 * head_s, 0.116 * head_s, 0.092 * head_s)
        cap = max(cap, -face_cut)
        if hstyle == 2:                      # swept fringe
            cap = _smin(cap, sd_ellip(x, y, z, -0.026 * head_s, head_y + 0.056 * head_s,
                                      0.050 * head_s, 0.116 * head_s, 0.072 * head_s,
                                      0.096 * head_s), 0.028)
        elif hstyle == 3:                    # top knot
            cap = _smin(cap, sd_sphere(x, y, z, 0.0, head_y + 0.150 * head_s,
                                      -0.072 * head_s, 0.046 * head_s), 0.020)
        elif hstyle == 4:                    # high, tight fade
            cap = max(sd_ellip(x, y, z, 0.0, head_y + 0.048 * head_s, -0.010 * head_s,
                               0.1120 * head_s, 0.1220 * head_s, 0.1240 * head_s), -face_cut)
        elif hstyle == 5:                    # long, down the neck
            cap = _smin(cap, sd_capsule(x, y, z, 0.0, head_y + 0.055 * head_s, -0.108 * head_s,
                                        0.0, head_y - 0.115 * head_s, -0.140 * head_s,
                                        0.052 * head_s, 0.030 * head_s), 0.028)
        d, mat = _smat(d, cap, mat, M_HAIR, 0.018)
        if beard > 0.05:
            bd = sd_ellip(x, y, z, 0.0, head_y - 0.060 * head_s, 0.002 * head_s,
                          0.0920 * head_s, 0.026 * head_s + 0.032 * head_s * beard,
                          0.0760 * head_s)
            bd = max(bd, -(sd_ellip(x, y, z, 0.0, head_y + 0.006 * head_s, 0.070 * head_s,
                                   0.096 * head_s, 0.080 * head_s, 0.076 * head_s)))
            d, mat = _smat(d, bd, mat, M_HAIR, 0.012)

    neck = sd_capsule(x, y, z, 0.0, head_y - 0.15, 0.0, 0.0, chest_y + 0.06, -0.01,
                      0.052 * bulk, 0.06 * bulk)
    if neck < d:
        d, mat = neck, M_SUIT

    # ---------------- torso (suit) ------------------------------------------
    torso = sd_ellip(x, y, z, 0.0, chest_y, 0.0, 0.215 * chest, 0.20, 0.145 * chest)
    chest_lo = sd_ellip(x, y, z, 0.0, chest_y - 0.16, 0.005, 0.198 * chest, 0.14, 0.135 * chest)
    abdomen = sd_ellip(x, y, z, 0.0, 1.03, 0.0, 0.172 * chest, 0.135, 0.122 * chest)
    pelvis = sd_ellip(x, y, z, 0.0, hip_y, 0.0, 0.20 * chest, 0.105, 0.145 * chest)
    torso = _smin(_smin(torso, chest_lo, 0.09), _smin(abdomen, pelvis, 0.09), 0.10)

    d, mat = _smat(d, torso, mat, M_SUIT, 0.05)

    # legs (only the top is in frame; keeps the bust grounded)
    thigh_l = sd_capsule(x, y, z, 0.093 * chest, hip_y - 0.02, 0.005,
                         0.10 * chest, 0.60, 0.01, 0.082 * bulk, 0.07 * bulk)
    thigh_r = sd_capsule(x, y, z, -0.093 * chest, hip_y - 0.02, 0.005,
                         -0.10 * chest, 0.60, 0.01, 0.082 * bulk, 0.07 * bulk)
    legs = min(thigh_l, thigh_r)
    d, mat = _smat(d, legs, mat, M_SUIT, 0.05)

    # ---------------- arms ---------------------------------------------------
    sh_x = 0.213 * chest + 0.012 * shoulder
    up_a = sd_capsule(x, y, z, sh_x, chest_y + 0.075, 0.0,
                      sh_x + 0.048, 1.05, 0.028 * P[6], 0.062 * bulk, 0.055 * bulk)
    fore_a = sd_capsule(x, y, z, sh_x + 0.048, 1.05, 0.028 * P[6],
                        sh_x + 0.055, 0.86, 0.115 * P[6] + 0.02, 0.055 * bulk, 0.046 * bulk)
    hand_a = sd_ellip(x, y, z, sh_x + 0.052, 0.815, 0.15 * P[6] + 0.03,
                      0.048 * arm, 0.062 * arm, 0.036 * arm)
    up_b = sd_capsule(x, y, z, -sh_x, chest_y + 0.075, 0.0,
                      -sh_x - 0.040, 1.06, -0.03 + 0.02 * P[7], 0.062 * bulk, 0.055 * bulk)
    fore_b = sd_capsule(x, y, z, -sh_x - 0.040, 1.06, -0.03 + 0.02 * P[7],
                        -sh_x - 0.030, 0.885, 0.055 + 0.05 * P[7], 0.055 * bulk, 0.047 * bulk)
    hand_b = sd_ellip(x, y, z, -sh_x - 0.024, 0.84, 0.09 + 0.06 * P[7],
                      0.048 * arm, 0.062 * arm, 0.036 * arm)
    arms = _smin(_smin(up_a, fore_a, 0.05), hand_a, 0.04)
    arms = _smin(arms, _smin(_smin(up_b, fore_b, 0.05), hand_b, 0.04), 0.06)
    d, mat = _smat(d, arms, mat, M_SUIT, 0.035)

    # ---------------- armour shell ------------------------------------------
    pauld_l = sd_ellip(x, y, z, sh_x + 0.004, chest_y + 0.075, 0.0,
                       0.086 * shoulder, 0.058 * shoulder, 0.094 * shoulder)
    pauld_r = sd_ellip(x, y, z, -sh_x - 0.004, chest_y + 0.075, 0.0,
                       0.086 * shoulder, 0.058 * shoulder, 0.094 * shoulder)
    chestplate = sd_roundbox(x, y, z, 0.0, chest_y + 0.02, 0.108 * chest,
                             0.175 * chest, 0.15, 0.05, 0.045)
    sternum = sd_roundbox(x, y, z, 0.0, chest_y + 0.045, 0.152 * chest,
                          0.055, 0.11, 0.022, 0.02)
    backplate = sd_roundbox(x, y, z, 0.0, chest_y, -0.128 * chest,
                             0.17 * chest, 0.16, 0.05, 0.045)
    collar = sd_roundbox(x, y, z, 0.0, head_y - 0.185, 0.0, 0.128, 0.038, 0.10, 0.03)
    belt = sd_roundbox(x, y, z, 0.0, hip_y + 0.045, 0.0, 0.205 * chest, 0.032, 0.15 * chest, 0.022)
    bracer_l = sd_roundbox(x, y, z, sh_x + 0.05, 0.955, 0.075 * P[6] + 0.01,
                           0.052, 0.075, 0.058, 0.024)
    bracer_r = sd_roundbox(x, y, z, -sh_x - 0.036, 0.965, 0.02 + 0.028 * P[7],
                           0.052, 0.075, 0.058, 0.024)

    armor = _smin(pauld_l, pauld_r, 0.02)
    armor = _smin(armor, _smin(chestplate, sternum, 0.045), 0.05)
    armor = _smin(armor, backplate, 0.05)
    armor = _smin(armor, collar, 0.04)
    armor = _smin(armor, belt, 0.03)
    armor = _smin(armor, bracer_l, 0.02)
    armor = _smin(armor, bracer_r, 0.02)

    # armour must never swallow the head
    armor = max(armor, -(d_head + 0.004))
    d, mat = _smat(d, armor, mat, M_ARMOR, 0.028)

    # ---------------- backpack / gear --------------------------------------
    pack = sd_roundbox(x, y, z, 0.0, chest_y - 0.015, -0.185 * chest,
                       0.135 * chest, 0.145, 0.058, 0.035)
    tank_l = sd_capsule(x, y, z, 0.088, chest_y + 0.06, -0.225 * chest,
                        0.088, 0.99, -0.225 * chest, 0.045, 0.045)
    tank_r = sd_capsule(x, y, z, -0.088, chest_y + 0.06, -0.225 * chest,
                        -0.088, 0.99, -0.225 * chest, 0.045, 0.045)
    gear = _smin(pack, _smin(tank_l, tank_r, 0.02), 0.03)
    if P[8] > 0.5:  # no life-support pack (light roles)
        gear = 1e9
    d, mat = _smat(d, gear, mat, M_GEAR, 0.02)

    # ---------------- lit trim accents --------------------------------------
    neck_ring = sd_roundbox(x, y, z, 0.0, head_y - 0.172, 0.0,
                            0.096 * shoulder + 0.010, 0.0050, 0.102 * shoulder, 0.0040)
    chest_bar = sd_roundbox(x, y, z, 0.0, chest_y + 0.132, 0.152 * chest,
                           0.046, 0.0075, 0.010, 0.0045)
    shp_l = sd_roundbox(x, y, z, 0.213 * chest + 0.024, chest_y + 0.142, 0.0,
                        0.066 * shoulder, 0.0065, 0.080 * shoulder, 0.0045)
    shp_r = sd_roundbox(x, y, z, -0.213 * chest - 0.024, chest_y + 0.142, 0.0,
                        0.066 * shoulder, 0.0065, 0.080 * shoulder, 0.0045)
    trim = min(min(neck_ring, chest_bar), min(shp_l, shp_r))
    if synth > 0.5:      # synth optics: a single lit eye bar
        trim = min(trim, sd_roundbox(x, y, z, 0.0, head_y - 0.004, 0.104 * head_s,
                                     0.080 * head_s, 0.011, 0.020, 0.006))
    d, mat = _smat(d, trim, mat, M_TRIM, 0.006)

    # ---------------- helmet ------------------------------------------------
    htype = int(P[9])
    shell_r = 0.148 * head_s
    dome = sd_ellip(x, y, z, 0.0, head_y + 0.012, -0.006 * head_s,
                    shell_r * 1.03, shell_r * 1.07, shell_r * 1.06)
    dome = max(dome, -(sd_ellip(x, y, z, 0.0, head_y - 0.055, 0.10 * head_s,
                                0.115 * head_s, 0.115 * head_s, 0.10 * head_s)) - 0.0)

    if htype == 0:      # full dome + wide visor slit
        visor = sd_roundbox(x, y, z, 0.0, head_y + 0.008, 0.096 * head_s,
                            0.104 * head_s, 0.030, 0.05, 0.022)
        d, mat = _smat(d, _smin(dome, visor, 0.02), mat, M_VISOR, 0.02)
    elif htype == 1:    # open face: halo shell + goggles band
        band = sd_roundbox(x, y, z, 0.0, head_y + 0.028, 0.045 * head_s,
                           0.122 * head_s, 0.026, 0.10 * head_s, 0.02)
        cup_l = sd_capsule(x, y, z, 0.052 * head_s, head_y + 0.028, 0.10 * head_s,
                           0.052 * head_s, head_y + 0.028, 0.128 * head_s, 0.034, 0.034)
        cup_r = sd_capsule(x, y, z, -0.052 * head_s, head_y + 0.028, 0.10 * head_s,
                           -0.052 * head_s, head_y + 0.028, 0.128 * head_s, 0.034, 0.034)
        d, mat = _smat(d, _smin(band, _smin(cup_l, cup_r, 0.01), 0.012), mat, M_VISOR, 0.012)
        d, mat = _smat(d, dome, mat, M_ARMOR, 0.02)
    elif htype == 2:    # rebreather: dome + side cans + hoses to mouth
        can_l = sd_capsule(x, y, z, 0.10 * head_s, head_y - 0.055, 0.03, 0.10 * head_s,
                           head_y - 0.105, 0.03, 0.030, 0.030)
        can_r = sd_capsule(x, y, z, -0.10 * head_s, head_y - 0.055, 0.03, -0.10 * head_s,
                           head_y - 0.105, 0.03, 0.030, 0.030)
        hose_l = sd_capsule(x, y, z, 0.10 * head_s, head_y - 0.06, 0.055,
                            0.038 * head_s, head_y - 0.10, 0.108 * head_s, 0.014, 0.014)
        hose_r = sd_capsule(x, y, z, -0.10 * head_s, head_y - 0.06, 0.055,
                            -0.038 * head_s, head_y - 0.10, 0.108 * head_s, 0.014, 0.014)
        mouth = sd_roundbox(x, y, z, 0.0, head_y - 0.082, 0.104 * head_s,
                            0.044, 0.026, 0.026, 0.016)
        gearh = _smin(_smin(can_l, can_r, 0.01), _smin(hose_l, hose_r, 0.008), 0.012)
        gearh = _smin(gearh, mouth, 0.012)
        d, mat = _smat(d, _smin(dome, gearh, 0.02), mat, M_GEAR, 0.018)
    elif htype == 3:    # miner: hard hat, forward bill + headlamp
        cap = max(sd_ellip(x, y, z, 0.0, head_y + 0.045, -0.004,
                           shell_r * 1.06, shell_r * 0.80, shell_r * 1.06),
                   -(y - (head_y + 0.030)))
        brim = sd_ellip(x, y, z, 0.0, head_y + 0.030, 0.098 * head_s,
                        shell_r * 1.10, 0.010, shell_r * 0.86)
        lamp = sd_roundbox(x, y, z, 0.0, head_y + 0.045, shell_r * 0.98, 0.030, 0.017, 0.014, 0.01)
        d, mat = _smat(d, _smin(_smin(cap, brim, 0.015), lamp, 0.01), mat, M_ARMOR, 0.015)
        d, mat = _smat(d, lamp, mat, M_VISOR, 0.006)
    elif htype == 4:    # command: dome + crest fin + antenna
        crest = sd_roundbox(x, y, z, 0.0, head_y + 0.135, -0.01, 0.012, 0.042, 0.085, 0.008)
        ant = sd_capsule(x, y, z, 0.098 * head_s, head_y + 0.09, -0.03,
                         0.128 * head_s, head_y + 0.235, -0.02, 0.006, 0.005)
        antip = sd_sphere(x, y, z, 0.128 * head_s, head_y + 0.245, -0.02, 0.013)
        d, mat = _smat(d, _smin(dome, _smin(crest, ant, 0.01), 0.015), mat, M_ARMOR, 0.02)
        d, mat = _smat(d, antip, mat, M_VISOR, 0.004)
        vis = sd_roundbox(x, y, z, 0.0, head_y + 0.006, 0.10 * head_s, 0.098, 0.024, 0.04, 0.018)
        d, mat = _smat(d, vis, mat, M_VISOR, 0.01)
    elif htype == 5:    # pilot: bubble canopy
        bubble = sd_ellip(x, y, z, 0.0, head_y + 0.005, 0.012, shell_r * 1.16,
                          shell_r * 1.16, shell_r * 1.14)
        ring = sd_roundbox(x, y, z, 0.0, head_y - 0.115, 0.0, 0.135 * head_s, 0.022, 0.118 * head_s, 0.02)
        d, mat = _smat(d, bubble, mat, M_VISOR, 0.012)
        d, mat = _smat(d, ring, mat, M_ARMOR, 0.012)
    elif htype == 6:    # headset only (bare head, ear cups + mic boom)
        cup_l = sd_capsule(x, y, z, 0.113 * head_s, head_y - 0.005, 0.0, 0.127 * head_s,
                           head_y - 0.005, 0.0, 0.028, 0.028)
        cup_r = sd_capsule(x, y, z, -0.113 * head_s, head_y - 0.005, 0.0, -0.127 * head_s,
                           head_y - 0.005, 0.0, 0.028, 0.028)
        bandh = sd_capsule(x, y, z, 0.10 * head_s, head_y + 0.075, 0.0, -0.10 * head_s,
                           head_y + 0.108, 0.0, 0.010, 0.010)
        boom = sd_capsule(x, y, z, 0.112 * head_s, head_y - 0.02, 0.02,
                          0.048 * head_s, head_y - 0.095, 0.10 * head_s, 0.006, 0.006)
        tip = sd_sphere(x, y, z, 0.040 * head_s, head_y - 0.10, 0.108 * head_s, 0.013)
        d, mat = _smat(d, _smin(_smin(cup_l, cup_r, 0.004), _smin(bandh, boom, 0.006), 0.008),
                       mat, M_GEAR, 0.01)
        d, mat = _smat(d, tip, mat, M_VISOR, 0.003)
    else:               # engineer: scarf collar + weld mask pushed up
        mask = sd_roundbox(x, y, z, 0.0, head_y + 0.098, 0.072 * head_s, 0.104, 0.05, 0.03, 0.018)
        shade = sd_roundbox(x, y, z, 0.0, head_y + 0.118, 0.10 * head_s, 0.112, 0.012, 0.03, 0.008)
        d, mat = _smat(d, _smin(mask, shade, 0.012), mat, M_ARMOR, 0.015)
    return d, mat


@njit(cache=True, fastmath=True)
def normal_at(px, py, pz, P, lean_c, lean_s):
    e = 0.0016
    dx = map_char(px + e, py, pz, P, lean_c, lean_s)[0] - map_char(px - e, py, pz, P, lean_c, lean_s)[0]
    dy = map_char(px, py + e, pz, P, lean_c, lean_s)[0] - map_char(px, py - e, pz, P, lean_c, lean_s)[0]
    dz = map_char(px, py, pz + e, P, lean_c, lean_s)[0] - map_char(px, py, pz - e, P, lean_c, lean_s)[0]
    L = sqrt3(dx * dx + dy * dy + dz * dz)
    if L < 1e-9:
        return 0.0, 1.0, 0.0
    return dx / L, dy / L, dz / L


@njit(cache=True, fastmath=True)
def march_ao(px, py, pz, nx, ny, nz, P, lean_c, lean_s):
    acc = 0.0
    step = 0.02
    t = 0.012
    for i in range(9):
        d = map_char(px + nx * t, py + ny * t + 0.012 * t, pz + nz * t, P, lean_c, lean_s)[0]
        acc += (t - d) / max(t, 1e-4) * (1.0 / (1.0 + t * 7.0))
        t += step
        step *= 1.55
    return min(max(1.0 - acc * 1.15, 0.12), 1.0)


@njit(cache=True, fastmath=True)
def march_shadow(px, py, pz, lx, ly, lz, P, lean_c, lean_s):
    t = 0.02
    res = 1.0
    for i in range(22):
        sx = px + lx * t
        sy = py + ly * t
        sz = pz + lz * t
        d = map_char(sx, sy, sz, P, lean_c, lean_s)[0]
        if d < 0.0008:
            return 0.16
        res = min(res, 7.0 * d / t)
        t += max(d, 0.012)
        if t > 2.6:
            break
    return min(max(res, 0.16), 1.0)


BBOX = (0.40, 0.62, 1.72, 0.42, 0.34, 0.34)  # hx, hy0, hy1, hz(+front), hz(-back), pad


@njit(cache=True, parallel=True, fastmath=True)
def render_char(W, H, P, lean_c, lean_s, cam, out, depth, matbuf):
    ex, ey, ez, fx, fy, fz, upx, upy, upz, tan_half = cam
    _ = upx, upy
    # orthonormal basis: right = normalize(cross(forward, up))
    cx1 = fy * upz - fz * upy
    cx2 = fz * upx - fx * upz
    cx3 = fx * upy - fy * upx
    cl = sqrt3(cx1 * cx1 + cx2 * cx2 + cx3 * cx3)
    rx_, ry_, rz_ = cx1 / cl, cx2 / cl, cx3 / cl
    ux1 = ry_ * fz - rz_ * fy
    ux2 = rz_ * fx - rx_ * fz
    ux3 = rx_ * fy - ry_ * fx
    for py in range(H):
        v = 1.0 - (py + 0.5) / H
        for px in range(W):
            u = (px + 0.5) / W
            ax = (2.0 * u - 1.0) * tan_half * (W / float(H))
            ay = (2.0 * v - 1.0) * tan_half
            dxv = rx_ * ax + ux1 * ay + fx
            dyv = ry_ * ax + ux2 * ay + fy
            dzv = rz_ * ax + ux3 * ay + fz
            dl = sqrt3(dxv * dxv + dyv * dyv + dzv * dzv)
            dxv /= dl
            dyv /= dl
            dzv /= dl
            # slab test against the character bounds
            lo, hi = 0.02, 4.2
            ok = True
            bmin_x, bmin_y, bmax_y, bmax_z, bmin_z, pad = -0.42, 0.58, 1.92, 0.38, -0.32, 0.02
            for axis in range(3):
                if axis == 0:
                    o, dcv, bmin, bmax = ex, dxv, bmin_x - pad, -bmin_x + pad
                elif axis == 1:
                    o, dcv, bmin, bmax = ey, dyv, bmin_y - pad, bmax_y + pad
                else:
                    o, dcv, bmin, bmax = ez, dzv, bmin_z - pad, bmax_z + pad
                if abs(dcv) < 1e-7:
                    if o < bmin or o > bmax:
                        ok = False
                        break
                    continue
                t1 = (bmin - o) / dcv
                t2 = (bmax - o) / dcv
                if t1 > t2:
                    t1, t2 = t2, t1
                lo = max(lo, t1)
                hi = min(hi, t2)
                if lo > hi:
                    ok = False
                    break
            if not ok:
                continue
            t = lo
            hit = -1.0
            mat = 0
            for i in range(110):
                ppx = ex + dxv * t
                ppy = ey + dyv * t
                ppz = ez + dzv * t
                if ppy < 0.52 or ppy > 2.05:
                    break
                d, m = map_char(ppx, ppy, ppz, P, lean_c, lean_s)
                if d < 0.0009 * max(t, 0.35):
                    hit = t
                    mat = m
                    break
                t += max(d * 0.86, 0.0012)
                if t > 4.2:
                    break
            if hit < 0.0:
                continue
            ppx = ex + dxv * hit
            ppy = ey + dyv * hit
            ppz = ez + dzv * hit
            nx, ny, nz = normal_at(ppx, ppy, ppz, P, lean_c, lean_s)
            idx = py * W + px
            depth[idx] = hit
            matbuf[idx] = mat
            ao = march_ao(ppx, ppy, ppz, nx, ny, nz, P, lean_c, lean_s)
            out[idx * 8 + 0] = nx
            out[idx * 8 + 1] = ny
            out[idx * 8 + 2] = nz
            out[idx * 8 + 3] = ao
            out[idx * 8 + 4] = ppx
            out[idx * 8 + 5] = ppy
            out[idx * 8 + 6] = ppz
            out[idx * 8 + 7] = hit
