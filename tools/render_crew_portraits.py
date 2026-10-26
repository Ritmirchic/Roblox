#!/usr/bin/env python3
"""
Render the 42 SPACE MINER crew card portraits (360x440 PNG).

Every portrait is one coherent humanoid sculpted from a signed distance field
(tools/crew_sdf.py) and painted procedurally in character-local space, so the
result is a real bust - skull, jaw, face, hair, neck, shoulders, chest, arms -
never a cropped or mirrored fragment of some other model.

Per-card variation driven by the roster in scripts/autoload/GameData.gd:
  build        bulk, height, chest, shoulder width, head size, arm length
  pose         lean, torso twist, per-arm swing, camera yaw
  head gear    8 helmet types (dome, goggles, rebreather, miner cap, command
               crest, pilot bubble, headset, weld mask) + 6 hair styles + beard
  paint        suit/armour palette from rarity, rank bars, lit trim, chest
               plaque with a role sigil, face (eyes, brows, nose, mouth,
               cheeks), skin tone, hair colour, grime and edge wear
  scene        key/fill/rim lighting, nebula + planet + starfield backdrop

Run: .venv/bin/python tools/render_crew_portraits.py [--only 1,14] [--montage]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "cards" / "crew"
FRAME_W, FRAME_H = 720, 880          # render at 2x, LANCZOS down to card size
OUT_W, OUT_H = 360, 440
sys.path.insert(0, str(ROOT / "tools"))
from crew_sdf import (render_char, M_SKIN, M_SUIT, M_ARMOR, M_VISOR, M_TRIM,  # noqa: E402
                      M_GEAR, M_HAIR)

ROSTER_RE = re.compile(r'\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"')
HEAD_Y = 1.615

# rarity -> tier, suit, armour, trim, rim light, sky top, sky deep, nebula, planet, planet rim
RARITY = {
    "Common": (0, (0.235, 0.255, 0.295), (0.430, 0.455, 0.500), (0.55, 0.66, 0.74),
               (0.30, 0.50, 0.60), (0.030, 0.042, 0.068), (0.012, 0.020, 0.036),
               (0.085, 0.150, 0.205), (0.135, 0.145, 0.160), (0.35, 0.55, 0.65)),
    "Uncommon": (1, (0.185, 0.250, 0.215), (0.375, 0.455, 0.410), (0.36, 0.82, 0.52),
                 (0.24, 0.62, 0.46), (0.026, 0.048, 0.052), (0.010, 0.024, 0.030),
               (0.070, 0.190, 0.150), (0.115, 0.160, 0.140), (0.30, 0.70, 0.55)),
    "Rare": (2, (0.180, 0.220, 0.305), (0.355, 0.430, 0.555), (0.34, 0.64, 0.98),
             (0.26, 0.58, 1.00), (0.022, 0.038, 0.075), (0.008, 0.016, 0.042),
             (0.070, 0.135, 0.275), (0.110, 0.150, 0.225), (0.30, 0.55, 0.95)),
    "Epic": (3, (0.230, 0.175, 0.295), (0.430, 0.360, 0.540), (0.68, 0.38, 0.96),
             (0.70, 0.34, 1.00), (0.048, 0.024, 0.075), (0.020, 0.008, 0.038),
             (0.200, 0.090, 0.320), (0.150, 0.110, 0.215), (0.70, 0.35, 1.00)),
    "Legendary": (4, (0.295, 0.245, 0.145), (0.560, 0.460, 0.235), (1.00, 0.74, 0.22),
                  (1.00, 0.64, 0.24), (0.062, 0.038, 0.018), (0.028, 0.014, 0.006),
                 (0.290, 0.190, 0.075), (0.230, 0.180, 0.110), (1.00, 0.72, 0.32)),
    "Mythic": (5, (0.155, 0.255, 0.265), (0.305, 0.470, 0.485), (0.18, 0.92, 0.86),
               (0.24, 0.98, 0.88), (0.014, 0.046, 0.054), (0.006, 0.024, 0.030),
               (0.045, 0.215, 0.215), (0.090, 0.190, 0.190), (0.20, 0.95, 0.90)),
    "Secret": (6, (0.265, 0.140, 0.155), (0.470, 0.280, 0.295), (0.98, 0.24, 0.32),
               (1.00, 0.24, 0.34), (0.058, 0.014, 0.022), (0.026, 0.006, 0.012),
               (0.255, 0.055, 0.090), (0.195, 0.075, 0.090), (1.00, 0.28, 0.36)),
}
ROLE_HELMET = {"Miner": 3, "Pilot": 5, "Engineer": 7, "Gunner": 0, "Collector": 2,
               "Navigator": 4, "Scientist": 1, "Commander": 4}
ROLE_SIGIL = {"Miner": 0, "Pilot": 1, "Engineer": 2, "Gunner": 3, "Collector": 4,
              "Navigator": 5, "Scientist": 6, "Commander": 7}
# bulk, arm swing, head size, shoulder pad, heavy life-support pack
ROLE_BUILD = {"Miner": (1.10, 0.42, 1.00, 1.10, 0.0), "Engineer": (1.05, 0.32, 0.99, 1.04, 0.0),
              "Gunner": (1.04, 0.50, 1.01, 1.02, 0.0), "Pilot": (0.94, 0.18, 1.02, 0.96, 1.0),
              "Commander": (1.01, 0.10, 0.99, 1.04, 1.0), "Scientist": (0.92, 0.24, 1.03, 0.93, 1.0),
              "Navigator": (0.95, 0.28, 1.02, 0.96, 1.0), "Collector": (0.99, 0.36, 1.00, 0.99, 0.0)}
SKIN_TONES = [(0.808, 0.641, 0.533), (0.704, 0.524, 0.404), (0.553, 0.378, 0.268),
              (0.378, 0.247, 0.172), (0.872, 0.726, 0.610), (0.645, 0.459, 0.333),
              (0.472, 0.314, 0.224), (0.764, 0.594, 0.474)]
HAIR_TONES = [(0.055, 0.045, 0.042), (0.150, 0.088, 0.052), (0.295, 0.180, 0.095),
              (0.430, 0.300, 0.140), (0.520, 0.420, 0.255), (0.585, 0.580, 0.575),
              (0.360, 0.120, 0.075), (0.085, 0.075, 0.085)]


def load_roster():
    text = (ROOT / "scripts" / "autoload" / "GameData.gd").read_text(encoding="utf-8")
    block = text.split("func _init_crew_cards()", 1)[1].split("\nfunc ", 1)[0]
    return [{"idx": int(m.group(1)), "name": m.group(2), "role": m.group(3), "rarity": m.group(4)}
            for m in ROSTER_RE.finditer(block)]


# ── small image helpers ─────────────────────────────────────────────────────
def blur(a, px):
    from scipy import ndimage
    a = np.ascontiguousarray(a, np.float32)
    if a.ndim == 3:
        return ndimage.gaussian_filter(a, (px, px, 0), mode="nearest").astype(np.float32)
    return ndimage.gaussian_filter(a, px, mode="nearest").astype(np.float32)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / max(float(e1) - float(e0), 1e-6), 0.0, 1.0)
    return (t * t * (3.0 - 2.0 * t)).astype(np.float32)


def noise(rng, size, cells, octaves=4, warp=0.0):
    h, w = size
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(cells * (2 ** o)))
        gh = max(2, int(cells * (2 ** o) * h / w))
        g = Image.fromarray((255 * rng.random((gh, gw))).astype(np.uint8), "L").resize((w, h), Image.BICUBIC)
        acc += amp * (np.asarray(g, np.float32) / 255.0)
        tot += amp
        amp *= 0.52
    acc /= tot
    if warp > 0.0:
        yy, xx = np.mgrid[0:h, 0:w]
        shift = (acc - 0.5) * warp * (w / 40.0)
        xs = np.clip(xx + shift, 0, w - 1).astype(np.int32)
        acc = acc[yy, xs]
    return acc.astype(np.float32)


def rot_y(x, y, z, c, s):
    return x * c + z * s, y, -x * s + z * c


def sigil(kind, u, v):
    """Role badge drawn inside the chest plaque. u,v in [-1,1]."""
    r = np.sqrt(u * u + v * v)
    a = np.arctan2(v, u)
    if kind == 0:                                   # miner: twin chevron
        return np.clip(smoothstep(0.05, 0.0, np.abs(v + 0.10 + 1.0 * np.abs(u)))
                       + smoothstep(0.05, 0.0, np.abs(v - 0.34 + 1.0 * np.abs(u))), 0, 1) * (np.abs(u) < 0.82)
    if kind == 1:                                   # pilot: swept arrow
        return ((v > -0.50 + 1.20 * np.abs(u)) & (v < 0.60 - 1.20 * np.abs(u)) & (np.abs(u) < 0.88)).astype(np.float32)
    if kind == 2:                                   # engineer: hex nut
        ang = np.mod(a, np.pi / 3.0) - np.pi / 6.0
        hr = 0.60 / np.maximum(np.abs(np.cos(ang)), 1e-3)
        return np.clip(smoothstep(0.09, 0.0, np.abs(r - hr * 0.70)) + (r < 0.24).astype(np.float32), 0, 1)
    if kind == 3:                                   # gunner: cross
        return np.clip(((np.abs(u) < 0.11) | (np.abs(v) < 0.11)).astype(np.float32) * (r < 0.82)
                       + smoothstep(0.05, 0.0, np.abs(r - 0.56)), 0, 1)
    if kind == 4:                                   # collector: diamond
        return np.clip(smoothstep(0.07, 0.0, np.abs(np.abs(u) + np.abs(v) - 0.60))
                       + (np.abs(u) + np.abs(v) < 0.22).astype(np.float32), 0, 1)
    if kind == 5:                                   # navigator: 4-point star
        return smoothstep(0.04, 0.0, r - (0.28 + 0.60 * np.power(np.abs(np.cos(2.0 * a)), 6.0)))
    if kind == 6:                                   # scientist: orbit
        return np.clip(smoothstep(0.05, 0.0, np.abs(r - 0.58)) + (r < 0.15).astype(np.float32), 0, 1)
    return smoothstep(0.04, 0.0, r - (0.32 + 0.44 * np.power(np.abs(np.cos(2.5 * a - np.pi / 2)), 1.7)))


# ── painting ───────────────────────────────────────────────────────────────
def paint(dst, mask, col):
    """dst (h,w,3) <- col ((3,) or (h,w,3)) where mask (h,w) is set."""
    c = np.asarray(col, np.float32)
    if c.ndim == 1:
        c = c[None, None, :]
    return np.where(np.ascontiguousarray(mask)[..., None], c, dst)


def tone(dst, mask, mul):
    """scale dst by a per-pixel factor (h,w) where mask is set."""
    k = np.asarray(mul, np.float32)
    if k.ndim == 1:
        k = k[:, None]
    return dst * (1.0 + (k * mask)[..., None])


def shade_char(nv, mat, valid, pal, rng, role, rank, synth, head_s, lean_c, lean_s, twist,  # noqa: C901
                 helmet=6, key_az=0.0):
    h, w, _ = nv.shape
    n = nv[..., 0:3].astype(np.float32)
    ao = nv[..., 3].astype(np.float32)
    lx, ly, lz = rot_y(nv[..., 4], nv[..., 5], nv[..., 6], lean_c, lean_s)
    lx, _, lz = rot_y(lx, ly, lz, float(np.cos(twist)), float(np.sin(twist)))
    lx = lx.astype(np.float32); lz = lz.astype(np.float32); ly = ly.astype(np.float32)
    front = np.clip(n[..., 2], 0, 1) > 0.20

    suit_c = np.array(pal["suit"], np.float32)
    armor_c = np.array(pal["armor"], np.float32)
    trim_c = np.array(pal["trim"], np.float32)
    skin_c = np.array(pal["skin"], np.float32)
    hair_c = np.array(pal["hair"], np.float32)
    rim_c = np.array(pal["rim"], np.float32)
    sky_c = np.array(pal["nebula"], np.float32)

    L1 = np.array([np.sin(key_az) * 0.78 - 0.18, 0.62, np.cos(key_az) * 0.62 + 0.28], np.float32)
    L1 = L1 / np.linalg.norm(L1)
    L2 = np.array([0.78, 0.02, -0.42], np.float32); L2 /= np.linalg.norm(L2)
    L3 = np.array([-0.18, 0.30, -0.94], np.float32); L3 /= np.linalg.norm(L3)
    V = np.array([0.10, 0.06, 1.0], np.float32); V /= np.linalg.norm(V)

    d1 = np.clip(np.einsum("ijk,k->ij", n, L1), 0, 1)
    d2 = np.clip(np.einsum("ijk,k->ij", n, L2), 0, 1)
    d3 = np.clip(np.einsum("ijk,k->ij", n, L3), 0, 1)
    up = np.clip(n[..., 1], 0, 1)
    hv = L1 + V
    hv /= np.linalg.norm(hv)
    spec_ang = np.clip(np.einsum("ijk,k->ij", n, hv), 0, 1)

    fine = noise(rng, (h, w), 210, 3)
    broad = noise(rng, (h, w), 24, 3)
    wear = noise(rng, (h, w), 66, 2)
    m = {i: np.ascontiguousarray((mat == i) & valid)
         for i in (M_SKIN, M_SUIT, M_ARMOR, M_VISOR, M_TRIM, M_GEAR, M_HAIR)}

    albedo = np.zeros((h, w, 3), np.float32)
    rough = np.full((h, w), 0.60, np.float32)
    spec_k = np.zeros((h, w), np.float32)
    emis = np.zeros((h, w, 3), np.float32)

    grime = smoothstep(1.30, 0.88, ly) * (0.5 + 0.5 * wear)

    # ---- skin -------------------------------------------------------------
    skin = skin_c[None, None, :] * (1.16 + 0.20 * broad)[..., None]
    skin = skin * (1.0 - 0.28 * grime)[..., None]
    skin = skin * (1.0 - 0.18 * (1.0 - up))[..., None]
    skin = skin * (1.0 + 0.06 * (fine - 0.5) * 2.0)[..., None]
    warm = (smoothstep(0.030, 0.088, np.abs(np.abs(lx) - 0.070))
            * smoothstep(0.062, 0.016, np.abs(ly - (HEAD_Y - 0.030)))
            * np.clip(lz - 0.05, 0, 1))[..., None]
    skin = skin + np.array([0.034, 0.010, 0.003], np.float32)[None, None, :] * warm
    albedo = paint(albedo, m[M_SKIN], skin)
    rough = np.where(m[M_SKIN], 0.55 - 0.10 * fine, rough)
    spec_k = np.where(m[M_SKIN], 0.13, spec_k)

    # ---- face painter: shared by bare skin and by tinted canopy glass -----
    ax = np.abs(lx) - 0.0455 * head_s
    ay = ly - (HEAD_Y + 0.006 * head_s)
    eye_e = (ax / (0.0250 * head_s)) ** 2 + (ay / (0.0128 * head_s)) ** 2
    slot = (ax / (0.0192 * head_s)) ** 2 + (ay / (0.0084 * head_s)) ** 2
    r_ir = np.sqrt(ax ** 2 + (ay * 1.9) ** 2)
    brow_y = ly - (HEAD_Y + 0.040 * head_s + 0.0035 * (lx > 0).astype(np.float32))
    fbrow = (np.abs(brow_y / (0.0088 * head_s))
             + np.abs((np.abs(lx) - 0.0485 * head_s) / 0.0305)) < 1.0
    mouth_y = ly - (HEAD_Y - 0.0640 * head_s
                    + 0.0075 * np.clip(np.abs(lx) / (0.028 * head_s), 0, 1.3) ** 2)
    fmouth = (np.abs(lx) < 0.0245 * head_s) & (np.abs(mouth_y) < 0.0031 * head_s)
    sclera = np.array([0.82, 0.805, 0.785], np.float32)[None, None, :] \
        * (0.74 + 0.26 * smoothstep(1.0, 0.30, eye_e))[..., None]
    nose_sh = (smoothstep(0.030, 0.004, np.abs(lx - 0.014))
               * smoothstep(HEAD_Y - 0.078, HEAD_Y - 0.006, ly) * smoothstep(0.098, 0.128, lz))
    nose_hi = (smoothstep(0.013, 0.0, np.abs(lx)) * smoothstep(HEAD_Y - 0.052, HEAD_Y - 0.004, ly)
               * smoothstep(0.104, 0.140, lz))
    upper_lip = (np.abs(lx) < 0.034 * head_s) & (np.abs(ly - (HEAD_Y - 0.0555 * head_s)) < 0.0075)
    jaw_sh = smoothstep(HEAD_Y - 0.120, HEAD_Y - 0.088, ly) * smoothstep(0.01, 0.10, lz)
    glint = ((ax + 0.0044 * head_s) ** 2 + (ay - 0.0040 * head_s) ** 2) < (0.0042 * head_s) ** 2

    def paint_face(dst, mask, dim=1.0):
        fc = np.where(np.ascontiguousarray(mask)[..., None], dst * dim, 0.0)
        fc = fc * (1.0 - 0.15 * smoothstep(1.22, 1.00, eye_e))[..., None]
        fc = paint(fc, slot < 1.0, sclera)
        fc = paint(fc, (r_ir < 0.0124 * head_s) & (slot < 1.20), np.array(pal["eye"], np.float32))
        fc = paint(fc, r_ir < 0.0058 * head_s, np.array([0.028, 0.026, 0.028], np.float32))
        fc = paint(fc, glint & (slot < 1.2), np.array([1.05, 1.08, 1.12], np.float32))
        fc = paint(fc, fbrow, hair_c * 1.06)
        fc = tone(fc, (np.abs(brow_y) < 0.017) & (np.abs(lx) < 0.090) & ~fbrow,
                  np.full((h, w), -0.09, np.float32))
        fc = fc * (1.0 - 0.24 * nose_sh)[..., None]
        fc = fc + np.array([0.085, 0.070, 0.056], np.float32)[None, None, :] * nose_hi[..., None]
        fc = paint(fc, fmouth, np.array([0.262, 0.108, 0.092], np.float32))
        fc = tone(fc, upper_lip, np.full((h, w), 0.10, np.float32))
        fc = fc * (1.0 - 0.20 * jaw_sh)[..., None]
        return np.where(np.ascontiguousarray(mask)[..., None], fc, dst)

    face = (m[M_SKIN] & front & (np.abs(lx) < 0.140) & (ly > HEAD_Y - 0.150)
            & (ly < HEAD_Y + 0.135) & (lz > 0.035))
    albedo = paint_face(albedo, face, 1.0)

    # ---- hair + beard -----------------------------------------------------
    strands = np.sin(ly * 190.0 + lx * 58.0 + broad * 26.0)
    hairf = hair_c[None, None, :] * (0.78 + 0.44 * wear)[..., None] * (1.0 + 0.18 * strands)[..., None]
    hairf = hairf + np.array([0.11, 0.11, 0.12], np.float32)[None, None, :] * (
        smoothstep(-0.02, 0.10, up) * smoothstep(HEAD_Y + 0.02, HEAD_Y + 0.17, ly))[..., None] * 0.55
    beard = np.ascontiguousarray((mat == M_HAIR) & (ly < HEAD_Y - 0.032) & (lz > -0.01))
    hairf = np.where(beard[..., None], albedo * 0.60 + hairf * 0.40, hairf)
    albedo = paint(albedo, m[M_HAIR], hairf)
    rough = np.where(m[M_HAIR], 0.72, rough)
    spec_k = np.where(m[M_HAIR], 0.20, spec_k)

    # ---- suit -------------------------------------------------------------
    seam = np.minimum(smoothstep(0.024, 0.0, np.abs(np.mod(ly * 6.4 + 0.5, 1.0) - 0.5)),
                     smoothstep(0.015, 0.0, np.abs(np.mod(lx * 9.0, 1.0) - 0.5)))
    stripe = np.abs(np.abs(lx) - 0.205) < 0.011
    suit = suit_c[None, None, :] * (0.70 + 0.34 * fine)[..., None]
    suit = suit * (1.0 - 0.13 * seam)[..., None]
    suit = suit + (suit_c * 1.55)[None, None, :] * (smoothstep(1.30, 1.42, ly) * 0.30)[..., None]
    suit = suit + trim_c[None, None, :] * (stripe & (ly < 1.22))[..., None] * 0.5
    suit = suit * (1.0 - 0.28 * grime)[..., None] + np.array([0.070, 0.058, 0.045], np.float32)[None, None, :] * grime[..., None]
    albedo = paint(albedo, m[M_SUIT], suit)
    rough = np.where(m[M_SUIT], 0.74 - 0.10 * broad, rough)
    spec_k = np.where(m[M_SUIT], 0.10, spec_k)

    # ---- armour -----------------------------------------------------------
    gap = np.maximum(smoothstep(0.011, 0.0, np.abs(np.mod(ly * 4.05 + 0.25, 1.0) - 0.5)),
                    smoothstep(0.008, 0.0, np.abs(np.mod(np.arctan2(lz, lx) * 4.0, 1.0) - 0.5)))
    edge = smoothstep(0.87, 1.0, ao) * smoothstep(0.28, 0.80, d1)
    arm = armor_c[None, None, :] * (1.06 + 0.36 * wear)[..., None]
    arm = arm * (1.0 - 0.26 * gap)[..., None] * (1.0 - 0.24 * grime)[..., None]
    arm = arm + (np.array([0.640, 0.665, 0.700], np.float32)[None, None, :] - arm) * (0.50 * edge)[..., None]
    arm = arm + trim_c[None, None, :] * (0.05 * (1.0 - gap))[..., None]
    albedo = paint(albedo, m[M_ARMOR], arm)
    rough = np.where(m[M_ARMOR], 0.30 - 0.15 * edge, rough)
    spec_k = np.where(m[M_ARMOR], 0.50 + 0.40 * edge, spec_k)

    # ---- gear -------------------------------------------------------------
    packm = m[M_GEAR] & (lz < 0.02)
    haz = (np.abs(np.mod((lx + ly) * 12.0, 1.0)) < 0.40).astype(np.float32)
    gearc = np.array([0.092, 0.096, 0.108], np.float32)[None, None, :] * (0.82 + 0.34 * fine)[..., None]
    gearc = gearc + np.array([0.80, 0.40, 0.06], np.float32)[None, None, :] * (haz * packm)[..., None] * 0.5
    gearc = gearc * (1.0 - 0.22 * grime)[..., None]
    albedo = paint(albedo, m[M_GEAR], gearc)
    rough = np.where(m[M_GEAR], 0.52, rough)
    spec_k = np.where(m[M_GEAR], 0.26, spec_k)

    # ---- visor glass ------------------------------------------------------
    refl_y = np.clip(-n[..., 1] * 0.6 + 0.42, 0, 1)
    skyr = (np.array(pal["sky_top"], np.float32)[None, None, :] * (1.0 - refl_y)[..., None]
            + np.array(pal["nebula"], np.float32)[None, None, :] * refl_y[..., None]) * 2.2
    streak = smoothstep(0.68, 0.99, -n[..., 0] * 0.72 + n[..., 1] * 0.68)
    vis = np.array([0.026, 0.038, 0.054], np.float32)[None, None, :] + skyr * 0.26
    vis = vis + np.array(pal["trim"], np.float32)[None, None, :] * (0.18 + 0.28 * np.clip(n[..., 2], 0, 1))[..., None]
    vis = vis + np.array([0.86, 0.94, 1.00], np.float32)[None, None, :] * streak[..., None] * 0.46
    albedo = paint(albedo, m[M_VISOR], vis)
    emis = paint(emis, m[M_VISOR], vis * 0.30)
    rough = np.where(m[M_VISOR], 0.06, rough)
    spec_k = np.where(m[M_VISOR], 0.92, spec_k)

    # sealed helmets: the face still has to read through the tinted glass
    if helmet in (0, 4, 5):
        band = m[M_VISOR] & (ly > HEAD_Y - 0.170) & (ly < HEAD_Y + 0.160) & (lz > -0.02)
        if helmet != 5:
            band = band & front
        base = skin_c[None, None, :] * (0.34 + 0.52 * np.clip(d1, 0, 1))[..., None]
        gf = paint_face(base, band, 0.86)
        mix = 0.78 if helmet == 5 else 0.46
        albedo = np.where(band[..., None], albedo * (1.0 - mix) + gf * mix, albedo)
        emis = np.where(band[..., None], emis * (1.0 - 0.5 * mix), emis)

    # ---- lit trim ---------------------------------------------------------
    albedo = paint(albedo, m[M_TRIM], trim_c * 0.55)
    emis = paint(emis, m[M_TRIM], trim_c * 0.62)
    rough = np.where(m[M_TRIM], 0.30, rough)
    spec_k = np.where(m[M_TRIM], 0.45, spec_k)

    # ---- rank bars + unit plaque -----------------------------------------
    pauld = (np.abs(lx) > 0.198) & (np.abs(lx) < 0.296) & (ly > 1.298) & (ly < 1.452) & m[M_ARMOR]
    bars = np.zeros((h, w), np.float32)
    for i in range(rank):
        bars = np.maximum(bars, smoothstep(0.0066, 0.0, np.abs(ly - (1.400 - 0.0245 * i))))
    bm = pauld & (bars > 0.4) & (up > 0.25)
    albedo = paint(albedo, bm, trim_c * 0.75)
    emis = paint(emis, bm, trim_c * 0.42)

    px0, py0 = 0.0, 1.322
    plaque = (np.abs(lx - px0) < 0.031) & (np.abs(ly - py0) < 0.0215) & (lz > 0.140) & front & m[M_ARMOR]
    pu = np.clip((lx - px0) / 0.031, -1.05, 1.05)
    pv = np.clip((ly - py0) / 0.0215, -1.05, 1.05)
    plate = (np.abs(pu) ** 2.6 + np.abs(pv) ** 2.6) < 1.0
    sg = sigil(ROLE_SIGIL.get(role, 0), pu * 1.12, pv * 1.12) > 0.45
    albedo = paint(albedo, plaque & plate, trim_c * 0.34 + np.array([0.03, 0.03, 0.035], np.float32))
    albedo = paint(albedo, plaque & plate & sg, np.array([0.82, 0.85, 0.88], np.float32))
    emis = paint(emis, plaque & plate & sg, np.array([0.14, 0.15, 0.17], np.float32))

    # ---- synth crew -------------------------------------------------------
    if synth > 0.5:
        headm = m[M_SKIN] & (ly > HEAD_Y - 0.17)
        chrome = np.array([0.50, 0.53, 0.58], np.float32)[None, None, :] * (0.74 + 0.46 * wear)[..., None]
        albedo = paint(albedo, headm, chrome)
        rough = np.where(headm, 0.24, rough)
        spec_k = np.where(headm, 0.95, spec_k)
        optics = m[M_TRIM] & (ly > HEAD_Y - 0.06)
        emis = paint(emis, optics, trim_c * 2.6)

    # ---- lighting ---------------------------------------------------------
    sh = (0.40 + 0.60 * np.clip(ao, 0, 1))[..., None]
    amb = (np.array([0.105, 0.125, 0.165], np.float32)[None, None, :] + sky_c[None, None, :] * 0.50)         * (0.44 + 0.56 * up)[..., None]
    col = albedo * amb * sh
    col = col + albedo * np.array([1.00, 0.965, 0.915], np.float32)[None, None, :] * (d1 * 1.22)[..., None] * sh
    col = col + albedo * np.array([0.50, 0.60, 0.78], np.float32)[None, None, :] * (d2 * 0.42)[..., None] * sh
    # portrait reflector: keeps the face and chest front readable
    dl = np.clip(n[..., 2] * 0.88 + n[..., 1] * 0.34, 0, 1)
    col = col + albedo * np.array([0.86, 0.90, 1.00], np.float32)[None, None, :] * (dl * 0.62)[..., None] * sh
    col = col + albedo * rim_c[None, None, :] * (d3 * 1.18)[..., None] * (0.30 + 0.70 * ao)[..., None]
    wrap = np.clip(np.einsum("ijk,k->ij", n, L1) + 0.45, 0, 1.45) / 1.45
    col = col + np.array([0.26, 0.09, 0.045], np.float32)[None, None, :] * (wrap ** 2.4)[..., None] * m[M_SKIN][..., None] * 0.5
    shin = np.where(m[M_ARMOR], 55.0, np.where(m[M_VISOR], 140.0, np.where(m[M_SKIN], 20.0, 24.0)))
    sp = np.power(spec_ang[..., None], shin[..., None].astype(np.float32)) * spec_k[..., None]
    col = col + sp * (0.50 + 0.80 * d1[..., None]) * np.where(m[M_ARMOR][..., None], albedo,
                                                              np.array([0.94, 0.96, 1.00], np.float32))
    col = np.maximum(col + emis, 0.0) * 1.88
    return np.where(valid[..., None], col, 0.0).astype(np.float32)


# ── backdrop ────────────────────────────────────────────────────────────────
def make_sky(h, w, pal, rng, mode=0):
    top = np.array(pal["sky_top"], np.float32)
    bot = np.array(pal["sky_bot"], np.float32)
    yy = (np.arange(h, dtype=np.float32)[:, None] / h)
    sky = top[None, None, :] * (1.0 - yy)[:, :, None] + bot[None, None, :] * yy[:, :, None]
    sky = np.repeat(sky, w, axis=1).astype(np.float32)

    # structured nebula: ridge noise multiplied by a large soft cloud
    ridge = noise(rng, (h, w), 4, 5, warp=1.4)
    cloud = noise(rng, (h, w), 2, 3)
    neb = np.clip((ridge - 0.34) * 2.1, 0, 1) ** 1.5 * np.clip(cloud * 1.7 - 0.25, 0, 1)
    gx = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    neb *= np.clip(1.35 - np.abs(gx - rng.uniform(0.25, 0.75)) * 1.9, 0, 1)
    sky += np.array(pal["nebula"], np.float32)[None, None, :] * (neb * 2.15)[..., None]
    sky += np.array(pal["trim"], np.float32)[None, None, :] * (np.clip(neb - 0.62, 0, 1) * 0.5)[..., None]

    # planet limb: mostly out of frame, dim, with an atmosphere edge
    side = rng.random() < 0.5
    if mode == 1:      # deep-field: nebula only
        return _starfield(h, w, sky, rng)
    cx = (rng.uniform(-0.22, 0.12) if side else rng.uniform(0.88, 1.22)) * w
    cy = rng.uniform(1.02, 1.40) * h
    R = rng.uniform(0.62, 0.95) * h
    xx = np.arange(w, dtype=np.float32)[None, :]
    d = np.sqrt((xx - cx) ** 2 + (np.arange(h, dtype=np.float32)[:, None] - cy) ** 2)
    inside = smoothstep(R, R - 1.6, d)
    bands = noise(rng, (h, w), 9, 3)
    nx_, ny_ = (xx - cx) / R, (np.arange(h, dtype=np.float32)[:, None] - cy) / R
    limb = np.clip(1.0 - np.clip(np.abs(nx_), 0, 1) ** 2 - np.clip(ny_, -1, 1) ** 2, 0, 1) ** 0.45
    lit = np.clip(0.30 + 0.95 * np.clip(-nx_ * (1.0 if side else -1.0), 0, 1) + 0.35 * np.clip(-ny_, 0, 1), 0, 1.25)
    pcol = np.array(pal["planet"], np.float32)[None, None, :] * (0.62 + 0.70 * bands[..., None]) \
        * (lit ** 1.7 * limb)[..., None]
    sky = sky * (1.0 - inside[..., None]) + pcol * inside[..., None]
    atm = smoothstep(0.10, 0.0, np.abs(d / R - 1.0)) * (1.0 - inside)
    sky += np.array(pal["planet_rim"], np.float32)[None, None, :] * atm[..., None] * 0.55

    # stars: mostly pinpoint, a handful with small diffraction spikes
    stars = np.zeros((h, w), np.float32)
    n_stars = int(0.0021 * h * w)
    sx = rng.integers(0, w, n_stars)
    sy = rng.integers(0, h, n_stars)
    stars[sy, sx] = 0.35 + 0.85 * (rng.random(n_stars) ** 3.2)
    stars = np.clip(blur(stars, 0.55), 0, None)
    n_big = 3 + int(rng.random() * 3)
    for b in range(n_big):
        bx, by = int(rng.integers(0, w)), int(rng.integers(0, int(h * 0.55)))
        rr = int(rng.integers(9, 17))
        y0, y1 = max(0, by - rr), min(h, by + rr + 1)
        x0, x1 = max(0, bx - rr), min(w, bx + rr + 1)
        gy = np.abs(np.arange(y0, y1)[:, None] - by).astype(np.float32)
        gx2 = np.abs(np.arange(x0, x1)[None, :] - bx).astype(np.float32)
        spk = (np.maximum(0, 1 - gy / rr) ** 14 + np.maximum(0, 1 - gx2 / rr) ** 14) * 0.30
        dots = np.maximum(0, 1 - np.sqrt(gy ** 2 + gx2 ** 2) / 3.0) ** 2
        stars[y0:y1, x0:x1] += spk + dots
    sky += stars[..., None] * np.array([0.92, 0.95, 1.0], np.float32)[None, None, :] * 0.8
    return sky


def _starfield(h, w, sky, rng):
    """Backdrop without a planet: stars only (used by the deep-field variant)."""
    stars = np.zeros((h, w), np.float32)
    n = int(0.0030 * h * w)
    sx, sy = rng.integers(0, w, n), rng.integers(0, h, n)
    stars[sy, sx] = 0.4 + 0.9 * (rng.random(n) ** 3.0)
    sky += np.clip(blur(stars, 0.55), 0, None)[..., None] * np.array([0.9, 0.94, 1.0], np.float32)
    for _ in range(2):
        bx, by = int(rng.integers(0, w)), int(rng.integers(0, int(h * 0.6)))
        rr = int(rng.integers(11, 19))
        y0, y1 = max(0, by - rr), min(h, by + rr + 1)
        x0, x1 = max(0, bx - rr), min(w, bx + rr + 1)
        gy = np.abs(np.arange(y0, y1)[:, None] - by).astype(np.float32)
        gx = np.abs(np.arange(x0, x1)[None, :] - bx).astype(np.float32)
        sky[y0:y1, x0:x1] += ((np.maximum(0, 1 - gy / rr) ** 16 + np.maximum(0, 1 - gx / rr) ** 16) * 0.5)[..., None]
    return sky


def grade(col, rng, pal, h, w):
    col = np.clip(col, 0.0, 8.0)
    col = col / (1.0 + col * 0.36)
    col = col ** np.array([0.985, 1.0, 1.025], np.float32)
    mean = np.array(col.mean(axis=(0, 1), keepdims=True), np.float32)
    col = (col - mean) * 1.14 + mean * 0.99
    lum = col.mean(axis=2, keepdims=True)
    col = lum + (col - lum) * 1.16
    col = col * 1.0 + 0.014
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx / w - 0.5) * 2.0
    dy = (yy / h - 0.5) * 2.0
    vig = 1.0 - 0.34 * np.clip(dx * dx * 0.55 + dy * dy * 0.95, 0, 2.0) ** 1.4
    col *= np.clip(vig, 0.52, 1.0)[..., None]
    col += np.array(pal["rim"], np.float32)[None, None, :] * 0.022 * (1.0 - np.clip(vig, 0, 1))[..., None]
    col += rng.standard_normal((h, w, 1)).astype(np.float32) * 0.012
    fade = np.clip(smoothstep(1.0, 0.90, yy / h), 0, 1)
    col *= (0.62 + 0.38 * fade)[..., None]
    return np.clip(col, 0, 1)


def render_card(idx, rec, size=(FRAME_H, FRAME_W), seed=None):
    rng = np.random.default_rng(idx * 7919 + (0 if seed is None else seed))
    role, rarity = rec["role"], rec["rarity"]
    meta = RARITY[rarity]
    synth = 1.0 if re.search(r"\bUnit\b|synth|Prime\b", rec["name"]) else 0.0
    bulk, swing, head_s, shoulder, pack_off = ROLE_BUILD.get(role, (1.0, 0.25, 1.0, 1.0, 0.0))
    bulk *= rng.uniform(0.93, 1.09)
    chest = rng.uniform(0.92, 1.12)
    head_s *= rng.uniform(0.93, 1.07)
    shoulder *= rng.uniform(0.85, 1.22)
    twist = np.radians(rng.uniform(-32.0, 32.0))
    lean = np.radians(rng.uniform(-4.0, 9.0))
    yaw = np.radians(rng.uniform(6.0, 21.0)) * (1.0 if rng.random() < 0.55 else -1.0)
    pitch = np.radians(rng.uniform(-4.5, 5.5))
    key_az = np.radians(rng.uniform(-42.0, 42.0))
    sky_mode = int(rng.integers(0, 3))
    helmet = ROLE_HELMET.get(role, 0)
    if synth < 0.5 and rng.random() < 0.32:
        helmet = int(rng.integers(0, 8))
    if synth > 0.5:
        helmet = 6
    hair_style = int(rng.integers(1, 6)) if helmet in (1, 6, 7) and synth < 0.5 else 0
    beard = 0.0 if synth > 0.5 else float(rng.random() < 0.42) * rng.uniform(0.4, 1.0)
    if helmet not in (1, 6, 7):
        beard = 0.0

    P = np.zeros(16, np.float64)
    P[0] = twist                      # torso twist
    P[1] = chest                      # chest width
    P[2] = bulk                       # overall bulk
    P[3] = head_s                     # head scale
    P[4] = rng.uniform(0.90, 1.12)    # arm/hand size
    P[5] = shoulder                   # shoulder pad width
    P[6] = swing + rng.uniform(-0.10, 0.20)   # left arm forward swing
    P[7] = swing * 0.6 + rng.uniform(-0.12, 0.22)
    P[8] = pack_off                   # >0.5 disables the life-support pack
    P[9] = helmet
    P[10] = hair_style
    P[11] = beard
    P[12] = synth
    P[13] = rng.uniform(0.86, 1.16)        # jaw / lower-face width

    hue = rng.uniform(-0.10, 0.12)
    def tint(c, k):
        a = np.array(c, np.float32) * k
        return tuple(np.clip(a * (1.0 + hue * np.array([1.0, 0.4, -0.5], np.float32)), 0.02, 1.0))

    _tr = np.array(meta[3], np.float32)
    pal = {"suit": tint(tuple(np.array(meta[1], np.float32) * 0.70 + _tr * 0.30), rng.uniform(0.92, 1.16)),
           "armor": tint(tuple(np.array(meta[2], np.float32) * 0.76 + _tr * 0.24), rng.uniform(0.88, 1.16)),
           "trim": meta[3], "rim": meta[4],
           "sky_top": meta[5], "sky_bot": meta[6], "nebula": meta[7], "planet": meta[8],
           "planet_rim": meta[9],
           "skin": SKIN_TONES[(idx * 3 + int(rng.integers(0, 8))) % len(SKIN_TONES)],
           "hair": HAIR_TONES[(idx * 5 + int(rng.integers(0, 8))) % len(HAIR_TONES)],
           "eye": [(0.20, 0.34, 0.42), (0.13, 0.26, 0.20), (0.26, 0.17, 0.10),
                   (0.16, 0.30, 0.32), (0.30, 0.36, 0.40)][int(rng.integers(0, 5))]}
    rank = min(5, 2 + meta[0] // 2)
    mood = rng.uniform(0.90, 1.12)          # per-card exposure for mood variety

    h, w = size
    buf = np.zeros(h * w * 8, np.float32)
    dep = np.full(h * w, -1.0, np.float32)
    mb = np.zeros(h * w, np.int32)
    dist = 1.32 * rng.uniform(0.95, 1.05)
    tgt_y = 1.482 + rng.uniform(-0.016, 0.016)
    half_extent = 0.345 * rng.uniform(0.96, 1.05)
    tan_half = half_extent / dist          # kernel: |2v-1| <= 1 -> half-angle = tan_half
    cx = np.sin(yaw) * np.cos(pitch) * dist
    cz = np.cos(yaw) * np.cos(pitch) * dist
    cy = tgt_y + np.sin(pitch) * dist
    fx, fy, fz = -cx, tgt_y - cy, -cz
    fn = float(np.sqrt(fx * fx + fy * fy + fz * fz))
    cam = (float(cx), float(cy), float(cz), fx / fn, fy / fn, fz / fn, 0.0, 1.0, 0.0, tan_half)
    render_char(w, h, P, float(np.cos(lean)), float(np.sin(lean)), cam, buf, dep, mb)

    nv = buf.reshape(h, w, 8)
    mat = mb.reshape(h, w)
    valid = dep.reshape(h, w) > 0
    col = shade_char(nv, mat, valid, pal, rng, role, rank, synth, head_s,
                     float(np.cos(lean)), float(np.sin(lean)), twist, helmet, key_az)
    col = col * mood

    sky = make_sky(h, w, pal, rng, sky_mode)
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
    halo = np.exp(-(((gx - w * (0.5 - 0.10 * np.sign(yaw))) / (w * 0.46)) ** 2
                    + ((gy - h * 0.27) / (h * 0.30)) ** 2))
    sky += np.array(pal["rim"], np.float32)[None, None, :] * halo[..., None] * 0.20
    soft = blur(valid.astype(np.float32), 10.0)
    sky = sky * (1.0 - 0.30 * np.clip(soft - valid.astype(np.float32), 0, 1)[..., None])
    out = np.where(valid[..., None], np.clip(col, 0, 4.0), sky)

    bright = np.clip(out - 0.86, 0.0, None)
    bl = np.stack([blur(bright[..., i], 7.0) for i in range(3)], axis=2)
    out = out + bl * (0.30 + 0.26 * np.array(pal["rim"], np.float32)[None, None, :])
    wrapm = np.clip(blur(valid.astype(np.float32), 2.8) - valid.astype(np.float32), 0, 1)
    out = out + wrapm[..., None] * np.array(pal["rim"], np.float32)[None, None, :] * 0.40
    return np.clip(grade(out, rng, pal, h, w), 0, 1)


def to_png(arr, out_path, out_size=(OUT_W, OUT_H)):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255.0 + 0.5).astype(np.uint8)).resize(out_size, Image.LANCZOS)
    img.save(out_path, optimize=True)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--montage", action="store_true")
    ap.add_argument("--preview-dir", default="/tmp/crew_preview")
    args = ap.parse_args()
    roster = load_roster()
    only = {int(v) for v in args.only.split(",") if v.strip()} if args.only else None
    prev = Path(args.preview_dir)
    prev.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    imgs = []
    for rec in roster:
        if only and rec["idx"] not in only:
            continue
        arr = render_card(rec["idx"], rec)
        full = prev / f"crew_{rec['idx']:02d}_full.png"
        to_png(arr, full, (288, 352))
        if not only:
            to_png(arr, OUT_DIR / f"crew_{rec['idx']:02d}.png")
        print(f"crew_{rec['idx']:02d}  {rec['role']:10s} {rec['rarity']:10s} {rec['name']}", flush=True)
        if args.montage or only:
            imgs.append(Image.open(full))
    if imgs:
        cols = min(6, len(imgs))
        rows = (len(imgs) + cols - 1) // cols
        m = Image.new("RGB", (cols * 292, rows * 356), (12, 14, 20))
        d = ImageDraw.Draw(m)
        for i, im in enumerate(imgs):
            x, y = (i % cols) * 292 + 2, (i // cols) * 356 + 2
            m.paste(im, (x, y))
            d.rectangle([x, y, x + 287, y + 351], outline=(60, 70, 90))
        m.save(prev / "montage.png")
        print("montage ->", prev / "montage.png")


if __name__ == "__main__":
    main()
