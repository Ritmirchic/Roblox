"""Hard-surface android bust kernel for the SPACE MINER crew cards (v2.3.0).

Everything a card portrait needs is sculpted here as a signed distance field:
layered armour plates, a recessed sensor face with emissive optics, temple fins,
crest/headgear per role, ribbed neck pistons, a reactor core in the chest,
pauldrons with rivets and trim, articulated arms with class tools, and a
thruster backpack. Shading lives in tools/render_crew_portraits.py.

Materials (int ids returned by map_robot):
  1 M_CERAMIC  porcelain shell plates        5 M_EMIT   reactor core / optics
  2 M_PAINT    rarity-painted armour         6 M_LENS   dark sensor glass
  3 M_CHROME   polished trim and pistons     7 M_HOSE   rubber cables and seals
  4 M_GUNMETAL chassis, joints, vents         8 M_GOLD   officer / legendary fittings

Only numpy + numba are required, so the portraits are fully reproducible offline:
no external meshes, no two cards can share geometry, and no part can be cropped.
"""
from __future__ import annotations

import math

import numpy as np
from numba import njit

M_CERAMIC = 1
M_PAINT = 2
M_CHROME = 3
M_GUNMETAL = 4
M_EMIT = 5
M_LENS = 6
M_HOSE = 7
M_GOLD = 8

EPS = 0.0014


@njit(cache=True, fastmath=True)
def sqrt3(v):
    return math.sqrt(v) if v > 0.0 else 0.0


@njit(cache=True, fastmath=True)
def rot_y(px, py, pz, c, s):
    """Rotate about the vertical axis (yaw)."""
    return px * c + pz * s, py, -px * s + pz * c


@njit(cache=True, fastmath=True)
def rot_z(px, py, pz, c, s):
    """Rotate about the view axis (roll), used for radial details."""
    return px * c - py * s, px * s + py * c, pz


@njit(cache=True, fastmath=True)
def _smin(a, b, k):
    h = max(0.0, 1.0 - abs(a - b) / k)
    return min(a, b) - h * h * k * 0.25


@njit(cache=True, fastmath=True)
def _smat(a, b, ka, kb, k):
    h = max(0.0, 1.0 - abs(a - b) / k)
    d = min(a, b) - h * h * k * 0.25
    return d, (ka if a < b else kb)


@njit(cache=True, fastmath=True)
def sd_sphere(px, py, pz, cx, cy, cz, r):
    x, y, z = px - cx, py - cy, pz - cz
    return sqrt3(x * x + y * y + z * z) - r


@njit(cache=True, fastmath=True)
def sd_ellip(px, py, pz, cx, cy, cz, rx, ry, rz):
    x, y, z = (px - cx) / rx, (py - cy) / ry, (pz - cz) / rz
    k = min(rx, min(ry, rz))
    return (sqrt3(x * x + y * y + z * z) - 1.0) * k


@njit(cache=True, fastmath=True)
def sd_capsule(px, py, pz, ax, ay, az, bx, by, bz, ra, rb):
    pax, pay, paz = px - ax, py - ay, pz - az
    bax, bay, baz = bx - ax, by - ay, bz - az
    hh = bax * bax + bay * bay + baz * baz
    t = (pax * bax + pay * bay + paz * baz) / max(hh, 1e-9)
    t = min(max(t, 0.0), 1.0)
    r = ra + (rb - ra) * t
    qx, qy, qz = pax - bax * t, pay - bay * t, paz - baz * t
    return sqrt3(qx * qx + qy * qy + qz * qz) - r


@njit(cache=True, fastmath=True)
def sd_box(px, py, pz, cx, cy, cz, bx, by, bz):
    qx = abs(px - cx) - bx
    qy = abs(py - cy) - by
    qz = abs(pz - cz) - bz
    ox = max(qx, 0.0)
    oy = max(qy, 0.0)
    oz = max(qz, 0.0)
    return sqrt3(ox * ox + oy * oy + oz * oz) + min(max(qx, max(qy, qz)), 0.0)


@njit(cache=True, fastmath=True)
def sd_rbox(px, py, pz, cx, cy, cz, bx, by, bz, rr):
    """Rounded box: the workhorse for armour plates."""
    qx = abs(px - cx) - bx
    qy = abs(py - cy) - by
    qz = abs(pz - cz) - bz
    ox = max(qx, 0.0)
    oy = max(qy, 0.0)
    oz = max(qz, 0.0)
    return (sqrt3(ox * ox + oy * oy + oz * oz)
            + min(max(qx, max(qy, qz)), 0.0) - rr)


@njit(cache=True, fastmath=True)
def sd_ring(px, py, pz, cx, cy, cz, R, r):
    """Horizontal torus: bezels, collars, halos, thruster rings."""
    dx, dz = px - cx, pz - cz
    q = sqrt3(dx * dx + dz * dz) - R
    dy = py - cy
    return sqrt3(q * q + dy * dy) - r


@njit(cache=True, fastmath=True)
def sd_ring_v(px, py, pz, cx, cy, cz, R, r):
    """Vertical torus facing the camera: eye rims, tool muzzles."""
    dx, dy = px - cx, py - cy
    q = sqrt3(dx * dx + dy * dy) - R
    dz = pz - cz
    return sqrt3(q * q + dz * dz) - r


# ---------------------------------------------------------------------------
# the android
# ---------------------------------------------------------------------------
@njit(cache=True, fastmath=True)
def map_robot(px, py, pz, P, lean_c, lean_s):
    """P layout (16 floats):
    0 twist, 1 chest, 2 bulk, 3 head scale, 4 arm size, 5 shoulder width,
    6 arm swing L, 7 arm swing R, 8 chassis(0-7), 9 headgear(0-7), 10 crest(0-7),
    11 optics(0-3), 12 backpack(0-3), 13 pauldron(0-3), 14 face width, 15 nobility.
    """
    x, y, z = rot_y(px, py, pz, lean_c, lean_s)
    tw = P[0]
    x, y, z = rot_y(x, y, z, math.cos(tw), math.sin(tw))

    chest = P[1]
    bulk = P[2]
    hs = P[3]
    asz = P[4]
    shw = P[5]
    face_w = P[14]
    chassis = int(P[8])
    gear = int(P[9])
    crest = int(P[10])
    optics = int(P[11])
    packv = int(P[12])
    pauld = int(P[13])
    noble = P[15] > 0.5                # gold fittings for the high tiers

    hip_y = 0.905
    chest_y = 1.252
    head_y = 1.618
    cw = 0.190 * chest

    # ============================ HEAD =====================================
    # Bold, readable forms: a dome, a chamfered face block, a protruding visor
    # and a separate chin guard. Micro-detail comes from the shading pass.
    hrx = 0.096 * hs
    hry = 0.118 * hs
    hrz = 0.112 * hs
    zc = 0.112 * hs                      # front plane of the face block
    dome = sd_ellip(x, y, z, 0.0, head_y + 0.030 * hs, -0.010 * hs,
                    hrx * 1.06, hry * 1.10, hrz * 1.06)
    faceb = sd_rbox(x, y, z, 0.0, head_y - 0.024 * hs, 0.016 * hs,
                    hrx * 0.94, 0.072 * hs, hrz * 0.72, 0.030 * hs)
    chin = sd_rbox(x, y, z, 0.0, head_y - 0.100 * hs, 0.048 * hs,
                   hrx * 0.56 * face_w, 0.030 * hs, hrz * 0.42, 0.018 * hs)
    helm = _smin(_smin(dome, faceb, 0.026 * hs), chin, 0.016 * hs)
    # chamfer the temples so the helm tapers toward the jaw
    for s in (-1.0, 1.0):
        px0, py0, pz0 = s * hrx * 1.02, head_y - 0.010 * hs, 0.030 * hs
        cx_, cy_, cz_ = rot_z(x - px0, y - py0, z - pz0, 1.0, -0.40 * s)
        cut = sd_box(cx_ + px0, cy_ + py0, cz_ + pz0, px0, py0, pz0,
                     0.055 * hs, 0.30 * hs, 0.30 * hs)
        helm = max(helm, -cut)
    d = helm
    mat = M_CERAMIC

    # ---- visor: dark glass standing proud of the face, in a chrome frame -----
    vz = 0.098 * hs
    glass = sd_rbox(x, y, z, 0.0, head_y + 0.004 * hs, vz + 0.014 * hs,
                    hrx * 0.80, 0.0280 * hs, 0.012 * hs, 0.010 * hs)
    d, mat = _smat(d, glass, mat, M_LENS, 0.004)
    frame_o = sd_rbox(x, y, z, 0.0, head_y + 0.004 * hs, vz,
                      hrx * 0.885, 0.0345 * hs, 0.022 * hs, 0.016 * hs)
    frame_i = sd_rbox(x, y, z, 0.0, head_y + 0.004 * hs, vz + 0.030 * hs,
                      hrx * 0.80, 0.0285 * hs, 0.026 * hs, 0.014 * hs)
    frame = max(frame_o, -frame_i)
    d, mat = _smat(d, frame, mat, M_CHROME, 0.003)

    # ---- optics inside the visor --------------------------------------------
    oz = vz + 0.034 * hs
    if optics == 0:                      # twin angled optics
        for s in (-1.0, 1.0):
            ox = s * 0.0435 * hs * face_w
            oy = head_y + 0.006 * hs
            rx_, ry_, rz_ = rot_z(x - ox, y - oy, z - oz, 1.0, 0.24 * s)
            eye = sd_rbox(rx_ + ox, ry_ + oy, rz_ + oz, ox, oy, oz,
                          0.0275 * hs, 0.0100 * hs, 0.0090 * hs, 0.0055 * hs)
            d, mat = _smat(d, eye, mat, M_EMIT, 0.003)
    elif optics == 1:                    # one continuous visor band
        band = sd_rbox(x, y, z, 0.0, head_y + 0.006 * hs, oz,
                       hrx * 0.74, 0.0090 * hs, 0.0085 * hs, 0.0050 * hs)
        d, mat = _smat(d, band, mat, M_EMIT, 0.003)
        for s in (-1.0, 1.0):
            hud = sd_rbox(x, y, z, s * hrx * 0.66, head_y - 0.010 * hs, oz,
                          0.0080 * hs, 0.0160 * hs, 0.0070 * hs, 0.0040 * hs)
            d, mat = _smat(d, hud, mat, M_EMIT, 0.002)
    elif optics == 2:                    # cyclops lens with a chrome rim
        big = sd_capsule(x, y, z, 0.0, head_y + 0.006 * hs, vz + 0.004 * hs,
                         0.0, head_y + 0.006 * hs, oz + 0.004 * hs,
                         0.0235 * hs, 0.0235 * hs)
        d, mat = _smat(d, big, mat, M_EMIT, 0.004)
        rim = sd_ring_v(x, y, z, 0.0, head_y + 0.006 * hs, oz + 0.006 * hs,
                        0.0265 * hs, 0.0048 * hs)
        d, mat = _smat(d, rim, mat, M_CHROME, 0.002)
    else:                                # compound optics: 3 lit dots per side
        for s in (-1.0, 1.0):
            for i in range(3):
                dot = sd_sphere(x, y, z, s * (0.024 + 0.017 * i) * hs * face_w,
                                head_y + (0.016 - 0.012 * i) * hs, oz, 0.0082 * hs)
                d, mat = _smat(d, dot, mat, M_EMIT, 0.0025)

    # brow bar over the visor + a nose keel under it
    brow = sd_rbox(x, y, z, 0.0, head_y + 0.052 * hs, 0.082 * hs,
                   hrx * 0.97, 0.0120 * hs, hrz * 0.34, 0.008 * hs)
    d, mat = _smat(d, brow, mat, M_PAINT, 0.006)
    keel = sd_rbox(x, y, z, 0.0, head_y - 0.040 * hs, zc * 0.98,
                   0.0105 * hs, 0.0225 * hs, 0.014 * hs, 0.006 * hs)
    d, mat = _smat(d, keel, mat, M_CERAMIC, 0.004)

    # vocaliser slats on the chin guard
    for i in range(3):
        slat = sd_rbox(x, y, z, 0.0, head_y - (0.084 + 0.0135 * i) * hs, zc * 0.92,
                       hrx * 0.42 * face_w, 0.0048 * hs, 0.0075 * hs, 0.004 * hs)
        d, mat = _smat(d, slat, mat, M_GUNMETAL, 0.002)

    # cheek vents, jaw hinges, ear pods and tapered side plates
    for s in (-1.0, 1.0):
        for i in range(2):
            vent = sd_rbox(x, y, z, s * hrx * 0.95, head_y - 0.028 * hs, 0.036 * hs - 0.030 * hs * i,
                           0.0085 * hs, 0.0190 * hs, 0.0240 * hs, 0.005 * hs)
            d, mat = _smat(d, vent, mat, M_GUNMETAL, 0.003)
        hinge = sd_sphere(x, y, z, s * hrx * 0.92, head_y - 0.058 * hs, -0.008 * hs,
                          0.0165 * hs)
        d, mat = _smat(d, hinge, mat, M_CHROME, 0.004)
        ear = sd_capsule(x, y, z, s * (hrx * 0.94), head_y + 0.024 * hs, -0.012 * hs,
                         s * (hrx * 1.16), head_y + 0.024 * hs, -0.012 * hs,
                         0.0265 * hs, 0.0215 * hs)
        d, mat = _smat(d, ear, mat, M_GUNMETAL, 0.006)
        ear_dot = sd_sphere(x, y, z, s * (hrx * 1.18), head_y + 0.024 * hs, -0.012 * hs,
                            0.0100 * hs)
        d, mat = _smat(d, ear_dot, mat, M_EMIT, 0.003)
        px0, py0, pz0 = s * hrx * 1.00, head_y + 0.076 * hs, -0.020 * hs
        sx_, sy_, sz_ = rot_z(x - px0, y - py0, z - pz0, 1.0, -0.22 * s)
        side = sd_rbox(sx_ + px0, sy_ + py0, sz_ + pz0, px0, py0, pz0,
                       0.0095 * hs, 0.0250 * hs, 0.0470 * hs, 0.0070 * hs)
        d, mat = _smat(d, side, mat, M_PAINT, 0.005)
        # antenna strut rising behind the ear (silhouette break)
        st = sd_capsule(x, y, z, s * hrx * 1.02, head_y + 0.048 * hs, -hrz * 0.66,
                        s * hrx * 1.10, head_y + 0.128 * hs, -hrz * 0.92,
                        0.0075 * hs, 0.0045 * hs)
        d, mat = _smat(d, st, mat, M_CHROME, 0.003)

    # rear skull plate with a data port
    back = sd_rbox(x, y, z, 0.0, head_y + 0.010 * hs, -hrz * 0.94,
                   hrx * 0.72, 0.052 * hs, 0.024 * hs, 0.014 * hs)
    d, mat = _smat(d, back, mat, M_GUNMETAL, 0.008)
    for i in range(3):
        pin = sd_sphere(x, y, z, (i - 1) * 0.022 * hs, head_y - 0.010 * hs,
                        -hrz * 1.00, 0.005 * hs)
        d, mat = _smat(d, pin, mat, M_GOLD if noble else M_CHROME, 0.002)

    # ---- crest options ------------------------------------------------------
    if crest == 1:                       # mohawk of stacked blades
        for i in range(4):
            bl = sd_rbox(x, y, z, 0.0, head_y + (0.116 + 0.015 * i) * hs,
                         (0.020 - 0.028 * i) * hs,
                         0.0058 * hs, (0.028 - 0.004 * i) * hs, 0.028 * hs, 0.005 * hs)
            d, mat = _smat(d, bl, mat, M_GOLD if noble else M_PAINT, 0.004)
    elif crest == 2:                     # technician halo on struts
        halo = sd_ring(x, y, z, 0.0, head_y + 0.168 * hs, 0.0, 0.126 * hs, 0.0072 * hs)
        d, mat = _smat(d, halo, mat, M_CHROME, 0.006)
        for i in range(4):
            ang = i * math.tau / 4.0 + 0.4
            st = sd_capsule(x, y, z, math.sin(ang) * 0.106 * hs, head_y + 0.100 * hs,
                            math.cos(ang) * 0.106 * hs,
                            math.sin(ang) * 0.122 * hs, head_y + 0.160 * hs,
                            math.cos(ang) * 0.122 * hs, 0.0068 * hs, 0.0055 * hs)
            d, mat = _smat(d, st, mat, M_GUNMETAL, 0.004)
    elif crest == 3:                     # whip antenna with a lit tip
        rod = sd_capsule(x, y, z, 0.050 * hs, head_y + 0.100 * hs, -0.050 * hs,
                         0.082 * hs, head_y + 0.282 * hs, -0.094 * hs,
                         0.0052 * hs, 0.0028 * hs)
        d, mat = _smat(d, rod, mat, M_CHROME, 0.003)
        tip = sd_sphere(x, y, z, 0.082 * hs, head_y + 0.286 * hs, -0.094 * hs, 0.010 * hs)
        d, mat = _smat(d, tip, mat, M_EMIT, 0.003)
    elif crest == 4:                     # twin swept horns
        for s in (-1.0, 1.0):
            horn = sd_capsule(x, y, z, s * 0.058 * hs, head_y + 0.096 * hs, -0.012 * hs,
                              s * 0.114 * hs, head_y + 0.190 * hs, -0.078 * hs,
                              0.0155 * hs, 0.0045 * hs)
            d, mat = _smat(d, horn, mat, M_CERAMIC, 0.006)
    elif crest == 5:                     # sensor dish tilted over one eye
        dish = sd_ellip(x, y, z, 0.050 * hs, head_y + 0.112 * hs, 0.008 * hs,
                        0.050 * hs, 0.044 * hs, 0.013 * hs)
        d, mat = _smat(d, dish, mat, M_CERAMIC, 0.006)
        dring = sd_ring(x, y, z, 0.050 * hs, head_y + 0.124 * hs, 0.008 * hs,
                        0.048 * hs, 0.0055 * hs)
        d, mat = _smat(d, dring, mat, M_CHROME, 0.004)
    elif crest == 6:                     # officer crown of plates
        for i in range(5):
            ang = -0.95 + i * 0.475
            cp = sd_rbox(x, y, z, math.sin(ang) * 0.096 * hs, head_y + 0.126 * hs,
                         math.cos(ang) * 0.096 * hs - 0.006 * hs,
                         0.0135 * hs, 0.0250 * hs, 0.0095 * hs, 0.005 * hs)
            d, mat = _smat(d, cp, mat, M_GOLD, 0.004)
    elif crest == 7:                     # dorsal spine fins
        for i in range(5):
            ff = sd_rbox(x, y, z, 0.0, head_y + (0.082 - 0.019 * i) * hs, -hrz * 0.98,
                         0.0072 * hs, 0.019 * hs, (0.034 - 0.004 * i) * hs, 0.0055 * hs)
            d, mat = _smat(d, ff, mat, M_PAINT, 0.004)

    # ---- role headgear ------------------------------------------------------
    if gear == 1:                        # miner hard hat with a forehead lamp
        hat = sd_ellip(x, y, z, 0.0, head_y + 0.070 * hs, -0.006 * hs,
                       hrx * 1.14, hry * 0.80, hrz * 1.10)
        hat = max(hat, -(sd_box(x, y, z, 0.0, head_y - 0.030 * hs, 0.0,
                                hrx * 1.4, hry * 0.9, hrz * 1.4)))
        d, mat = _smat(d, hat, mat, M_PAINT, 0.010)
        brim = sd_ring(x, y, z, 0.0, head_y + 0.072 * hs, -0.004 * hs,
                       hrx * 1.10, 0.0125 * hs)
        d, mat = _smat(d, brim, mat, M_GUNMETAL, 0.006)
        lamp = sd_rbox(x, y, z, 0.0, head_y + 0.062 * hs, hrz * 1.02,
                       0.024 * hs, 0.015 * hs, 0.014 * hs, 0.006 * hs)
        d, mat = _smat(d, lamp, mat, M_EMIT, 0.003)
        for s in (-1.0, 1.0):
            knob = sd_sphere(x, y, z, s * hrx * 1.06, head_y + 0.070 * hs, -hrz * 0.30,
                              0.0125 * hs)
            d, mat = _smat(d, knob, mat, M_CHROME, 0.004)
    elif gear == 2:                      # pilot helmet shell + breathing hoses
        shell = sd_ellip(x, y, z, 0.0, head_y + 0.010 * hs, -0.006 * hs,
                         hrx * 1.20, hry * 1.20, hrz * 1.18)
        shell = max(shell, -(sd_box(x, y, z, 0.0, head_y - 0.030 * hs, hrz * 1.05,
                                    hrx * 1.3, hry * 1.1, hrz * 0.9)))
        shell = max(shell, -(sd_rbox(x, y, z, 0.0, head_y + 0.004 * hs, hrz * 1.10,
                                    hrx * 0.86, 0.0400 * hs, 0.060 * hs, 0.020 * hs)))
        d, mat = _smat(d, shell, mat, M_CERAMIC, 0.012)
        seam = sd_rbox(x, y, z, 0.0, head_y - 0.046 * hs, hrz * 0.96,
                       hrx * 0.90, 0.010 * hs, 0.016 * hs, 0.006 * hs)
        d, mat = _smat(d, seam, mat, M_GUNMETAL, 0.005)
        for s in (-1.0, 1.0):
            hose = sd_capsule(x, y, z, s * hrx * 1.04, head_y - 0.040 * hs, hrz * 0.36,
                              s * hrx * 1.26, head_y - 0.150 * hs, -hrz * 0.34,
                              0.0125 * hs, 0.0145 * hs)
            d, mat = _smat(d, hose, mat, M_HOSE, 0.006)
    elif gear == 3:                      # engineer weld mask pushed up on the brow
        mask = sd_rbox(x, y, z, 0.0, head_y + 0.104 * hs, hrz * 0.62,
                       hrx * 1.00, 0.038 * hs, 0.046 * hs, 0.018 * hs)
        d, mat = _smat(d, mask, mat, M_GUNMETAL, 0.008)
        slit = sd_rbox(x, y, z, 0.0, head_y + 0.106 * hs, hrz * 0.86,
                       hrx * 0.64, 0.0095 * hs, 0.007 * hs, 0.006 * hs)
        d, mat = _smat(d, slit, mat, M_EMIT, 0.003)
        for s in (-1.0, 1.0):
            arm = sd_capsule(x, y, z, s * hrx * 0.94, head_y + 0.066 * hs, hrz * 0.28,
                             s * hrx * 0.96, head_y + 0.104 * hs, hrz * 0.56,
                             0.0072 * hs, 0.0065 * hs)
            d, mat = _smat(d, arm, mat, M_CHROME, 0.004)
    elif gear == 4:                      # gunner targeting booms
        for s in (-1.0, 1.0):
            boom = sd_rbox(x, y, z, s * hrx * 1.18, head_y + 0.048 * hs, -0.008 * hs,
                           0.0135 * hs, 0.048 * hs, 0.028 * hs, 0.008 * hs)
            d, mat = _smat(d, boom, mat, M_GUNMETAL, 0.006)
            tlens = sd_sphere(x, y, z, s * hrx * 1.18, head_y + 0.092 * hs, hrz * 0.20,
                              0.014 * hs)
            d, mat = _smat(d, tlens, mat, M_EMIT, 0.003)
    elif gear == 5:                      # collector grabber claws folded back
        for s in (-1.0, 1.0):
            for i in range(2):
                a0 = 0.55 + 0.60 * i
                cl = sd_capsule(x, y, z, s * hrx * 0.84, head_y + 0.086 * hs, 0.004 * hs,
                                s * (hrx * 0.92 + 0.050 * hs * math.cos(a0)),
                                head_y + 0.170 * hs, -0.092 * hs * math.sin(a0),
                                0.0105 * hs, 0.0048 * hs)
                d, mat = _smat(d, cl, mat, M_CHROME, 0.005)
    elif gear == 6:                      # navigator compass ring
        ring = sd_ring(x, y, z, 0.0, head_y + 0.056 * hs, 0.0, hrx * 1.22, 0.0085 * hs)
        d, mat = _smat(d, ring, mat, M_GOLD, 0.005)
        for i in range(4):
            ang = i * math.tau / 4.0
            mk = sd_sphere(x, y, z, math.sin(ang) * hrx * 1.22, head_y + 0.056 * hs,
                           math.cos(ang) * hrx * 1.22, 0.0105 * hs)
            d, mat = _smat(d, mk, mat, M_EMIT, 0.003)
    elif gear == 7:                      # scientist monocle + data fins
        mring = sd_ring_v(x, y, z, -0.046 * hs, head_y + 0.000 * hs, zc * 0.90,
                          0.0285 * hs, 0.0048 * hs)
        d, mat = _smat(d, mring, mat, M_GOLD, 0.003)
        mglass = sd_capsule(x, y, z, -0.046 * hs, head_y, zc * 0.88,
                            -0.046 * hs, head_y, zc * 0.92, 0.0255 * hs, 0.0255 * hs)
        d, mat = _smat(d, mglass, mat, M_LENS, 0.002)
        for i in range(3):
            dfn = sd_rbox(x, y, z, hrx * 1.00, head_y + (0.056 - 0.019 * i) * hs,
                          -hrz * 0.60, 0.0075 * hs, 0.0075 * hs, 0.028 * hs, 0.004 * hs)
            d, mat = _smat(d, dfn, mat, M_CERAMIC, 0.004)

    # ============================ NECK =====================================
    neck_r = 0.062 * bulk
    neck = sd_capsule(x, y, z, 0.0, head_y - 0.130 * hs, -0.008 * hs,
                      0.0, chest_y + 0.100, 0.0, neck_r, neck_r * 1.30)
    d, mat = _smat(d, neck, mat, M_GUNMETAL, 0.006)
    for s in (-1.0, 1.0):
        pis = sd_capsule(x, y, z, s * 0.042 * bulk, head_y - 0.120 * hs, -0.034 * hs,
                         s * 0.050 * bulk, chest_y + 0.086, -0.048 * hs,
                         0.0130 * bulk, 0.0105 * bulk)
        d, mat = _smat(d, pis, mat, M_CHROME, 0.004)
    for i in range(3):
        col = sd_ring(x, y, z, 0.0, head_y - (0.150 + 0.020 * i) * hs, -0.002 * hs,
                      neck_r + 0.011 * hs - 0.0025 * i, 0.0072 * hs)
        d, mat = _smat(d, col, mat, M_HOSE, 0.003)

    # ============================ TORSO ====================================
    torso = sd_rbox(x, y, z, 0.0, chest_y + 0.022, 0.004, cw, 0.150, 0.096 * chest, 0.042)
    waist = sd_rbox(x, y, z, 0.0, 1.058, 0.000, cw * 0.78, 0.084, 0.090 * chest, 0.036)
    pelvis = sd_rbox(x, y, z, 0.0, hip_y, 0.002, cw * 0.88, 0.080, 0.098 * chest, 0.038)
    torso = _smin(_smin(torso, waist, 0.052), pelvis, 0.048)
    d, mat = _smat(d, torso, mat, M_GUNMETAL, 0.010)

    # layered pectoral plates with a sternum keel
    pec = sd_rbox(x, y, z, 0.088 * chest, chest_y + 0.060, 0.128 * chest,
                  0.084 * chest, 0.068, 0.030 * chest, 0.024)
    pec = _smin(pec, sd_rbox(x, y, z, -0.088 * chest, chest_y + 0.060, 0.128 * chest,
                             0.084 * chest, 0.068, 0.030 * chest, 0.024), 0.006)
    keel = sd_rbox(x, y, z, 0.0, chest_y - 0.006, 0.160 * chest,
                   0.022 * chest, 0.094, 0.014 * chest, 0.012)
    pec = _smin(pec, keel, 0.006)
    d, mat = _smat(d, pec, mat, M_PAINT, 0.005)

    # yoke / collar plate
    yoke = sd_rbox(x, y, z, 0.0, chest_y + 0.138, 0.006, cw * 0.86, 0.030, 0.094 * chest, 0.020)
    d, mat = _smat(d, yoke, mat, M_GUNMETAL, 0.005)
    for s in (-1.0, 1.0):                # collar struts
        cst = sd_rbox(x, y, z, s * cw * 0.62, chest_y + 0.152, 0.030,
                      0.020 * chest, 0.016, 0.070 * chest, 0.008)
        d, mat = _smat(d, cst, mat, M_CHROME, 0.004)

    # reactor core in the sternum
    core_cy = chest_y + 0.040
    core_cz = 0.176 * chest
    bezel = sd_ring_v(x, y, z, 0.0, core_cy, core_cz, 0.040 * chest, 0.0095 * chest)
    d, mat = _smat(d, bezel, mat, M_CHROME, 0.006)
    core = sd_sphere(x, y, z, 0.0, core_cy, core_cz - 0.006, 0.029 * chest)
    d, mat = _smat(d, core, mat, M_EMIT, 0.005)
    for i in range(4):                   # radial iris spokes over the core
        ang = i * math.pi / 4.0
        sx, sy, sz = rot_z(x, y - core_cy, z - core_cz, math.cos(ang), math.sin(ang))
        spoke = sd_box(sx, sy + core_cy, sz + core_cz, 0.0, core_cy, core_cz + 0.004,
                       0.036 * chest, 0.0038 * chest, 0.004 * chest)
        d, mat = _smat(d, spoke, mat, M_GOLD if noble else M_CHROME, 0.003)

    # rib vents on both flanks + shoulder-to-core conduits
    for s in (-1.0, 1.0):
        for i in range(4):
            slat = sd_rbox(x, y, z, s * (cw * 0.95), chest_y + 0.026 - 0.028 * i, 0.020,
                           0.011, 0.0068, 0.046 * chest, 0.005)
            d, mat = _smat(d, slat, mat, M_GUNMETAL, 0.004)
        cond = sd_capsule(x, y, z, s * 0.118 * chest, chest_y + 0.148, 0.112 * chest,
                          s * 0.046 * chest, core_cy + 0.072, core_cz + 0.006,
                          0.0072 * chest, 0.0060 * chest)
        d, mat = _smat(d, cond, mat, M_HOSE, 0.006)

    # abdomen actuators
    for i in range(3):
        ab = sd_rbox(x, y, z, 0.0, 1.122 - 0.046 * i, 0.130 * chest,
                     0.058 * chest - 0.006 * i, 0.0150, 0.013, 0.008)
        d, mat = _smat(d, ab, mat, M_CERAMIC, 0.004)

    # belt, buckle and side canisters
    belt = sd_rbox(x, y, z, 0.0, hip_y + 0.030, 0.0, cw * 0.94, 0.024, 0.148 * chest, 0.016)
    d, mat = _smat(d, belt, mat, M_GUNMETAL, 0.006)
    buck = sd_rbox(x, y, z, 0.0, hip_y + 0.030, 0.176 * chest,
                   0.026 * chest, 0.019, 0.011, 0.006)
    d, mat = _smat(d, buck, mat, M_GOLD if noble else M_CHROME, 0.005)
    for s in (-1.0, 1.0):
        can = sd_capsule(x, y, z, s * cw * 0.90, hip_y + 0.034, -0.036,
                         s * cw * 0.94, hip_y + 0.090, -0.036, 0.0245 * chest, 0.0225 * chest)
        d, mat = _smat(d, can, mat, M_CERAMIC, 0.010)
        cap = sd_sphere(x, y, z, s * cw * 0.92, hip_y + 0.098, -0.036, 0.0175 * chest)
        d, mat = _smat(d, cap, mat, M_EMIT if s > 0 else M_CHROME, 0.005)

    # ======================= SHOULDERS + ARMS ================================
    sh_x = cw + 0.028 * shw
    sh_y = chest_y + 0.130
    for s in (-1.0, 1.0):
        ball = sd_sphere(x, y, z, s * sh_x, sh_y, 0.0, 0.054 * bulk)
        d, mat = _smat(d, ball, mat, M_CHROME, 0.010)
        trap = sd_capsule(x, y, z, s * cw * 0.30, chest_y + 0.176, 0.010,
                          s * (sh_x - 0.006), sh_y + 0.020, 0.0, 0.030 * shw, 0.042 * shw)
        d, mat = _smat(d, trap, mat, M_PAINT, 0.012)

        ptop = sh_y + 0.048 + 0.012 * pauld
        pr = 0.090 * shw * (1.0 + 0.05 * pauld)
        paul = sd_sphere(x, y, z, s * (sh_x + 0.014), ptop, 0.0, pr)
        paul = max(paul, -(sd_sphere(x, y, z, s * (sh_x + 0.014), ptop - 0.012, 0.0,
                                     pr * 0.87)))
        paul = max(paul, -(sd_box(x, y, z, s * (sh_x + 0.014), ptop - 0.128, 0.0,
                                  0.22, 0.128, 0.22)))
        d, mat = _smat(d, paul, mat, M_PAINT, 0.005)
        if pauld >= 1:
            lv = sd_rbox(x, y, z, s * (sh_x + 0.018), ptop + 0.042, 0.0,
                         0.048 * shw, 0.013, 0.062 * shw, 0.013)
            d, mat = _smat(d, lv, mat, M_CERAMIC, 0.004)
        if pauld >= 2:
            spk = sd_capsule(x, y, z, s * (sh_x + 0.056), ptop + 0.042, -0.008,
                             s * (sh_x + 0.098), ptop + 0.120, -0.026, 0.015, 0.004)
            d, mat = _smat(d, spk, mat, M_GOLD, 0.008)
        trim = sd_rbox(x, y, z, s * (sh_x + 0.012), ptop + 0.004, 0.070 * shw,
                       0.040 * shw, 0.0070, 0.0095, 0.005)
        d, mat = _smat(d, trim, mat, M_EMIT, 0.004)
        for i in range(3):
            rv = sd_sphere(x, y, z, s * (sh_x + 0.012), ptop + 0.028,
                           (i - 1) * 0.046 * shw, 0.0072)
            d, mat = _smat(d, rv, mat, M_CHROME, 0.003)
        if s < 0.0 and chassis >= 2:     # rank chevrons on the left pauldron
            for i in range(3):
                bar = sd_rbox(x, y, z, s * (sh_x + 0.020), chest_y + 0.112 - 0.020 * i,
                              0.058 * shw, 0.030 - 0.006 * i, 0.0042, 0.0075, 0.002)
                d, mat = _smat(d, bar, mat, M_GOLD, 0.002)

        sw = P[6] if s > 0.0 else P[7]
        ux0 = s * (sh_x + 0.028)
        ex0 = s * (sh_x + 0.054)
        ey0 = chest_y - 0.094
        ez0 = 0.030 + 0.100 * sw
        up = sd_capsule(x, y, z, ux0, sh_y - 0.018, 0.006, ex0, ey0, ez0,
                        0.048 * bulk, 0.041 * bulk)
        d, mat = _smat(d, up, mat, M_PAINT, 0.006)
        uplate = sd_rbox(x, y, z, s * (sh_x + 0.050), chest_y + 0.012, ez0 * 0.42 + 0.034,
                         0.026 * bulk, 0.058 * bulk, 0.024 * bulk, 0.012)
        d, mat = _smat(d, uplate, mat, M_CERAMIC, 0.004)
        elb = sd_sphere(x, y, z, ex0, ey0, ez0, 0.0325 * bulk)
        d, mat = _smat(d, elb, mat, M_CHROME, 0.008)
        for i in range(2):
            pst = sd_capsule(x, y, z, s * (sh_x + 0.014), chest_y + 0.004, ez0 * 0.30 - 0.026,
                             ex0 - s * 0.006, ey0 + 0.012, ez0 - 0.028, 0.0100, 0.0082)
            d, mat = _smat(d, pst, mat, M_CHROME, 0.004)
        wx = s * (sh_x + 0.066)
        wy = 0.958 - 0.010 * sw
        wz = 0.068 + 0.148 * sw
        gau = sd_capsule(x, y, z, ex0, ey0, ez0, wx, wy, wz, 0.045 * asz, 0.039 * asz)
        d, mat = _smat(d, gau, mat, M_PAINT, 0.006)
        grail = sd_rbox(x, y, z, (ex0 + wx) * 0.5, (ey0 + wy) * 0.5 + 0.012,
                        (ez0 + wz) * 0.5 + 0.032,
                        0.016 * asz, 0.048 * asz, 0.013 * asz, 0.007)
        d, mat = _smat(d, grail, mat, M_GUNMETAL, 0.004)
        wring = sd_ring(x, y, z, wx, wy + 0.010, wz, 0.039 * asz, 0.0075)
        d, mat = _smat(d, wring, mat, M_CHROME, 0.004)

        if chassis == 0 or chassis == 4:      # drill arm / plasma auger
            bit = sd_capsule(x, y, z, wx, wy - 0.048, wz + 0.118 * asz,
                             wx + s * 0.006, wy - 0.100, wz + 0.210 * asz,
                             0.028 * asz, 0.005 * asz)
            d, mat = _smat(d, bit, mat, M_CHROME, 0.010)
            collar = sd_ring(x, y, z, wx, wy - 0.016, wz + 0.036 * asz,
                             0.029 * asz, 0.0072)
            d, mat = _smat(d, collar, mat, M_EMIT, 0.004)
            for i in range(3):
                ridge = sd_ring(x, y, z, wx, wy - (0.030 + 0.016 * i), wz + (0.070 + 0.034 * i) * asz,
                                0.0245 * asz - 0.0045 * i, 0.0052)
                d, mat = _smat(d, ridge, mat, M_GUNMETAL, 0.003)
        elif chassis == 2 or chassis == 3:    # rivet gun / cutter
            body = sd_rbox(x, y, z, wx, wy - 0.016, wz + 0.030,
                           0.0235 * asz, 0.0285 * asz, 0.050 * asz, 0.011)
            d, mat = _smat(d, body, mat, M_GUNMETAL, 0.010)
            muz = sd_capsule(x, y, z, wx, wy - 0.016, wz + 0.076 * asz,
                             wx, wy - 0.016, wz + 0.138 * asz, 0.0125 * asz, 0.0095 * asz)
            d, mat = _smat(d, muz, mat, M_CHROME, 0.005)
            tip = sd_sphere(x, y, z, wx, wy - 0.016, wz + 0.142 * asz, 0.0085 * asz)
            d, mat = _smat(d, tip, mat, M_EMIT, 0.003)
            mag = sd_rbox(x, y, z, wx, wy - 0.046, wz + 0.018,
                          0.0155 * asz, 0.0265 * asz, 0.019 * asz, 0.007)
            d, mat = _smat(d, mag, mat, M_CERAMIC, 0.006)
        else:                                  # articulated hand
            palm = sd_rbox(x, y, z, wx, wy - 0.026, wz + 0.014,
                           0.025 * asz, 0.032 * asz, 0.016 * asz, 0.011)
            d, mat = _smat(d, palm, mat, M_CERAMIC, 0.010)
            for i in range(4):
                fg = sd_capsule(x, y, z, wx + (i - 1.5) * 0.0135 * asz, wy - 0.050,
                                wz + 0.020, wx + (i - 1.5) * 0.015 * asz, wy - 0.084,
                                wz + 0.050 + 0.009 * i, 0.0068 * asz, 0.0055 * asz)
                d, mat = _smat(d, fg, mat, M_GUNMETAL, 0.004)
            thumb = sd_capsule(x, y, z, wx - s * 0.023 * asz, wy - 0.028, wz + 0.020,
                               wx - s * 0.038 * asz, wy - 0.054, wz + 0.046,
                               0.0080 * asz, 0.0062 * asz)
            d, mat = _smat(d, thumb, mat, M_GUNMETAL, 0.004)

    # ============================ BACKPACK =================================
    bp_z = -0.108 * chest
    bp = sd_rbox(x, y, z, 0.0, chest_y + 0.030, bp_z - 0.014,
                 cw * 0.78, 0.128, 0.046, 0.028)
    d, mat = _smat(d, bp, mat, M_GUNMETAL, 0.008)
    bpframe = sd_rbox(x, y, z, 0.0, chest_y + 0.108, bp_z - 0.072,
                      cw * 0.52, 0.020, 0.014, 0.010)
    d, mat = _smat(d, bpframe, mat, M_CHROME, 0.008)
    if packv >= 1:
        for s in (-1.0, 1.0):
            noz = sd_capsule(x, y, z, s * cw * 0.50, chest_y - 0.016, bp_z - 0.070,
                             s * cw * 0.50, chest_y - 0.016, bp_z - 0.128,
                             0.0295 * chest, 0.0215 * chest)
            d, mat = _smat(d, noz, mat, M_GUNMETAL, 0.010)
            nring = sd_ring(x, y, z, s * cw * 0.50, chest_y - 0.016, bp_z - 0.130,
                            0.0205 * chest, 0.0058)
            d, mat = _smat(d, nring, mat, M_EMIT, 0.004)
            ln = sd_capsule(x, y, z, s * cw * 0.64, chest_y + 0.106, bp_z - 0.048,
                            s * (sh_x + 0.008), sh_y + 0.026, -0.028, 0.0122, 0.0105)
            d, mat = _smat(d, ln, mat, M_HOSE, 0.008)
    if packv >= 2:
        cell = sd_rbox(x, y, z, 0.0, chest_y + 0.096, bp_z - 0.066,
                       0.050 * chest, 0.020, 0.012, 0.007)
        d, mat = _smat(d, cell, mat, M_EMIT, 0.006)
    if packv == 3:
        mast = sd_capsule(x, y, z, cw * 0.48, chest_y + 0.146, bp_z - 0.036,
                          cw * 0.58, chest_y + 0.410, bp_z - 0.094, 0.0075, 0.004)
        d, mat = _smat(d, mast, mat, M_CHROME, 0.004)
        fl = sd_rbox(x, y, z, cw * 0.58, chest_y + 0.392, bp_z - 0.092,
                     0.0055, 0.028, 0.016, 0.004)
        d, mat = _smat(d, fl, mat, M_GOLD, 0.003)

    return d, mat


# ---------------------------------------------------------------------------
# ray march + g-buffer
# ---------------------------------------------------------------------------
@njit(cache=True, fastmath=True)
def normal_at(px, py, pz, P, lean_c, lean_s):
    e = EPS
    dx = map_robot(px + e, py, pz, P, lean_c, lean_s)[0] - map_robot(px - e, py, pz, P, lean_c, lean_s)[0]
    dy = map_robot(px, py + e, pz, P, lean_c, lean_s)[0] - map_robot(px, py - e, pz, P, lean_c, lean_s)[0]
    dz = map_robot(px, py, pz + e, P, lean_c, lean_s)[0] - map_robot(px, py, pz - e, P, lean_c, lean_s)[0]
    L = sqrt3(dx * dx + dy * dy + dz * dz)
    if L < 1e-9:
        return 0.0, 1.0, 0.0
    return dx / L, dy / L, dz / L


@njit(cache=True, fastmath=True)
def march_ao(px, py, pz, nx, ny, nz, P, lean_c, lean_s):
    acc = 0.0
    step = 0.016
    t = 0.009
    for i in range(7):
        dd = map_robot(px + nx * t, py + ny * t + 0.010 * t, pz + nz * t, P, lean_c, lean_s)[0]
        acc += (t - dd) / max(t, 1e-4) * (1.0 / (1.0 + t * 9.0))
        t += step
        step *= 1.62
    return min(max(1.0 - acc * 1.22, 0.08), 1.0)


@njit(cache=True, fastmath=True)
def march_shadow(px, py, pz, lx, ly, lz, P, lean_c, lean_s):
    t = 0.018
    res = 1.0
    for i in range(18):
        dd = map_robot(px + lx * t, py + ly * t, pz + lz * t, P, lean_c, lean_s)[0]
        if dd < 0.0006:
            return 0.13
        res = min(res, 8.0 * dd / t)
        t += max(dd, 0.009)
        if t > 2.2:
            break
    return min(max(res, 0.13), 1.0)


BBOX_ROBOT = (-0.48, 0.58, 2.02, 0.44, -0.42, 0.02)
# unit vector from a surface point toward the key light; shared with the shading
KEY_DIR = (-0.437, 0.728, 0.528)


@njit(cache=True, parallel=True, fastmath=True)
def render_robot(W, H, P, lean_c, lean_s, cam, out, depth, matbuf, shbuf):
    """Write a g-buffer: normals, AO, hit position, hit depth, material, shadow."""
    ex, ey, ez, fx, fy, fz, upx, upy, upz, tan_half = cam
    cx1 = fy * upz - fz * upy
    cx2 = fz * upx - fx * upz
    cx3 = fx * upy - fy * upx
    cl = sqrt3(cx1 * cx1 + cx2 * cx2 + cx3 * cx3)
    rx_, ry_, rz_ = cx1 / cl, cx2 / cl, cx3 / cl
    ux1 = ry_ * fz - rz_ * fy
    ux2 = rz_ * fx - rx_ * fz
    ux3 = rx_ * fy - ry_ * fx
    bmin_x, bmin_y, bmax_y, bmax_z, bmin_z, pad = BBOX_ROBOT
    aspect = W / float(H)
    for py in range(H):
        v = 1.0 - (py + 0.5) / H
        for px in range(W):
            u = (px + 0.5) / W
            ax = (2.0 * u - 1.0) * tan_half * aspect
            ay = (2.0 * v - 1.0) * tan_half
            dxv = rx_ * ax + ux1 * ay + fx
            dyv = ry_ * ax + ux2 * ay + fy
            dzv = rz_ * ax + ux3 * ay + fz
            dl = sqrt3(dxv * dxv + dyv * dyv + dzv * dzv)
            dxv /= dl
            dyv /= dl
            dzv /= dl
            lo, hi = 0.02, 4.0
            ok = True
            for axis in range(3):
                if axis == 0:
                    o, dcv, blo, bhi = ex, dxv, bmin_x - pad, -bmin_x + pad
                elif axis == 1:
                    o, dcv, blo, bhi = ey, dyv, bmin_y - pad, bmax_y + pad
                else:
                    o, dcv, blo, bhi = ez, dzv, bmin_z - pad, bmax_z + pad
                if abs(dcv) < 1e-7:
                    if o < blo or o > bhi:
                        ok = False
                        break
                    continue
                t1 = (blo - o) / dcv
                t2 = (bhi - o) / dcv
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
            for i in range(140):
                ppx = ex + dxv * t
                ppy = ey + dyv * t
                ppz = ez + dzv * t
                if ppy < 0.52 or ppy > 2.16:
                    break
                dd, m = map_robot(ppx, ppy, ppz, P, lean_c, lean_s)
                if dd < 0.0006 * max(t, 0.35):
                    hit = t
                    mat = m
                    break
                t += max(dd * 0.80, 0.0008)
                if t > 3.6:
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
            # key light shadow (the renderer lights with the same KEY_DIR);
            # surfaces already turned away from the key cannot be shadowed more
            sh = 1.0
            if nx * KEY_DIR[0] + ny * KEY_DIR[1] + nz * KEY_DIR[2] > -0.05:
                sh = march_shadow(ppx + nx * 0.004, ppy + ny * 0.004, ppz + nz * 0.004,
                                  KEY_DIR[0], KEY_DIR[1], KEY_DIR[2], P, lean_c, lean_s)
            out[idx * 8 + 0] = nx
            out[idx * 8 + 1] = ny
            out[idx * 8 + 2] = nz
            out[idx * 8 + 3] = ao
            out[idx * 8 + 4] = ppx
            out[idx * 8 + 5] = ppy
            out[idx * 8 + 6] = ppz
            out[idx * 8 + 7] = hit
            shbuf[idx] = sh


def make_camera(target, dist, yaw_deg, pitch_deg, tan_half, W, H):
    ty, tp = math.radians(yaw_deg), math.radians(pitch_deg)
    eye = (target[0] + dist * math.cos(tp) * math.sin(ty),
           target[1] + dist * math.sin(tp),
           target[2] + dist * math.cos(tp) * math.cos(ty))
    fwd = (target[0] - eye[0], target[1] - eye[1], target[2] - eye[2])
    fl = math.sqrt(sum(v * v for v in fwd))
    fwd = tuple(v / fl for v in fwd)
    up = (0.0, 1.0, 0.0)
    rx = (fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2],
          fwd[0] * up[1] - fwd[1] * up[0])
    rl = math.sqrt(sum(v * v for v in rx))
    rx = tuple(v / rl for v in rx)
    ux = (rx[1] * fwd[2] - rx[2] * fwd[1], rx[2] * fwd[0] - rx[0] * fwd[2],
          rx[0] * fwd[1] - rx[1] * fwd[0])
    return eye + fwd + ux + (tan_half,)


def gbuffer(P, lean_deg, twist_deg, W, H, cam, ss=2):
    """Render one character at a supersampled resolution and return the buffers."""
    w, h = W * ss, H * ss
    lean_c, lean_s = math.cos(math.radians(lean_deg)), math.sin(math.radians(lean_deg))
    out = np.zeros(w * h * 8, dtype=np.float32)
    depth = np.zeros(w * h, dtype=np.float32)
    matb = np.zeros(w * h, dtype=np.uint8)
    shb = np.zeros(w * h, dtype=np.float32)
    render_robot(w, h, P, lean_c, lean_s, cam, out, depth, matb, shb)
    out = out.reshape(h, w, 8)
    depth = depth.reshape(h, w)
    matb = matb.reshape(h, w)
    shb = shb.reshape(h, w)
    if ss > 1:
        o2 = np.zeros((H, W, 8), np.float32)
        d2 = np.zeros((H, W), np.float32)
        m2 = np.zeros((H, W), np.uint8)
        s2 = np.zeros((H, W), np.float32)
        for iy in range(ss):
            for ix in range(ss):
                o2 += out[iy::ss, ix::ss]
                d2 += depth[iy::ss, ix::ss]
                s2 += shb[iy::ss, ix::ss]
                m2 = np.where(depth[iy::ss, ix::ss] > 0,
                              matb[iy::ss, ix::ss], m2)
        out, depth, matb, shb = o2 / (ss * ss), d2 / (ss * ss), m2, s2 / (ss * ss)
    return np.ascontiguousarray(out), depth, matb, np.ascontiguousarray(shb)
