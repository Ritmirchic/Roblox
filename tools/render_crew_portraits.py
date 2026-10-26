#!/usr/bin/env python3
"""
Render the 42 SPACE MINER crew card portraits (360x440 PNG) - v2.3.0 androids.

Every portrait is one coherent hard-surface android sculpted from a signed
distance field (tools/crew_robot.py) and lit like a studio product shot:
three light shapes, a procedural environment reflected by the chrome, GGX
specular, glazed ceramic and clear-coated paint, panel seams, crevice grime,
edge wear and emissive bloom. Nothing is a crop, a mirror or a decal of another
card, and the rarity of the crew member drives real geometry and paint:

  build        bulk, chest, shoulder width, head scale, arm size
  pose         torso twist, lean, per-arm swing, camera yaw/pitch
  helm         8 role headgear types + 8 crest options + 4 optics layouts
  armour       4 pauldron styles, 4 backpack styles, 8 class tools, rank bars
  paint        rarity palette, decals (stripes/chevrons), grime and edge wear
  scene        key/fill/rim lighting, nebula + planet + starfield backdrop

Run: .venv/bin/python tools/render_crew_portraits.py [--only 1,14] [--montage]
"""
from __future__ import annotations

import argparse
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "cards" / "crew"
FRAME_W, FRAME_H = 720, 880          # render at 2x supersample, LANCZOS down
OUT_W, OUT_H = 360, 440
sys.path.insert(0, str(ROOT / "tools"))
from crew_robot import (gbuffer, make_camera, KEY_DIR,                      # noqa: E402
                        M_CERAMIC, M_PAINT, M_CHROME, M_GUNMETAL,
                        M_EMIT, M_LENS, M_HOSE, M_GOLD)

ROSTER_RE = re.compile(r'\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"')
CHEST_Y = 1.252

# rarity -> tier, paint, ceramic, trim, rim, sky top, sky deep, nebula, planet, planet rim
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
# headgear per role (matches map_robot): 1 miner hat, 2 pilot shell, 3 weld mask,
# 4 gunner booms, 5 grabber claws, 6 compass ring, 7 monocle, 0 open helm
ROLE_GEAR = {"Miner": 1, "Pilot": 2, "Engineer": 3, "Gunner": 4, "Collector": 5,
             "Navigator": 6, "Scientist": 7, "Commander": 0}
# class tool / arm chassis: 0/4 drill, 2/3 gun, others articulated hand
ROLE_TOOL = {"Miner": 0, "Engineer": 2, "Gunner": 3, "Pilot": 1, "Collector": 4,
             "Navigator": 5, "Scientist": 6, "Commander": 7}
ROLE_OPTICS = {"Miner": 0, "Engineer": 0, "Pilot": 1, "Gunner": 1, "Collector": 3,
               "Navigator": 2, "Scientist": 2, "Commander": 0}
# crest: 1 blades, 2 halo, 3 antenna, 4 horns, 5 dish, 6 crown, 7 spine fins
ROLE_CREST = {"Miner": 0, "Pilot": 3, "Engineer": 2, "Gunner": 4, "Collector": 5,
              "Navigator": 7, "Scientist": 0, "Commander": 6}
ROLE_SIGIL = {"Miner": 0, "Pilot": 1, "Engineer": 2, "Gunner": 3, "Collector": 4,
              "Navigator": 5, "Scientist": 6, "Commander": 7}
# bulk, arm swing, head scale, shoulder width, backpack style
ROLE_BUILD = {"Miner": (1.12, 0.40, 0.99, 1.10, 1), "Engineer": (1.06, 0.32, 1.00, 1.05, 1),
              "Gunner": (1.08, 0.48, 1.00, 1.06, 2), "Pilot": (0.96, 0.20, 1.02, 0.98, 3),
              "Commander": (1.04, 0.12, 1.00, 1.08, 2), "Scientist": (0.94, 0.26, 1.03, 0.95, 0),
              "Navigator": (0.96, 0.30, 1.02, 0.97, 3), "Collector": (1.00, 0.36, 1.01, 1.00, 1)}
# pauldron style per rarity: bulkier plating for the high tiers
ROLE_PAULDRON = {0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 3, 6: 3}

# material shading parameters: albedo key, roughness, metalness, coat, emission
MATS = {
    M_CERAMIC: ("ceramic", 0.26, 0.00, 0.85, 0.00),
    M_PAINT:   ("paint",    0.31, 0.34, 1.00, 0.00),
    M_CHROME:  ("chrome",   0.075, 1.00, 0.00, 0.00),
    M_GUNMETAL: ("gunmetal", 0.40, 0.92, 0.00, 0.00),
    M_EMIT:    ("emit",     0.22, 0.00, 0.00, 1.00),
    M_LENS:    ("lens",     0.07, 0.10, 1.00, 0.16),
    M_HOSE:    ("hose",     0.66, 0.00, 0.00, 0.00),
    M_GOLD:    ("gold",     0.20, 1.00, 0.00, 0.00),
}


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
    """Hermite ramp; e1 < e0 inverts it (1 at e0, 0 at e1), which the masks use."""
    d = float(e1) - float(e0)
    if -1e-9 < d < 1e-9:
        d = 1e-9 if d >= 0.0 else -1e-9
    t = np.clip((np.asarray(x, np.float32) - float(e0)) / d, 0.0, 1.0)
    return (t * t * (3.0 - 2.0 * t)).astype(np.float32)


def noise(rng, size, cells, octaves=4, warp=0.0, stretch=1.0):
    """Fractal value noise. stretch>1 stretches the pattern horizontally."""
    h, w = size
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(cells * (2 ** o) / stretch))
        gh = max(2, int(cells * (2 ** o) * h / w * stretch))
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


def band(x, k, wdt):
    """Machined seam lines: 1 on the line, 0 by `wdt` (in band fractions) away."""
    f = np.mod(np.asarray(x, np.float32) * float(k), 1.0)
    d = np.minimum(f, 1.0 - f)
    return (1.0 - smoothstep(0.0, wdt, d)).astype(np.float32)


# ── lighting ────────────────────────────────────────────────────────────────
LIGHTS = [
    # (direction, colour key, intensity, softbox width, softbox height)
    (KEY_DIR, "key", 2.20, 0.55, 0.30),
    ((0.72, -0.16, 0.67), "fill", 0.48, 1.20, 0.80),
    ((-0.12, 0.30, -0.95), "rim", 2.05, 0.42, 1.10),
]


def _norm(v):
    v = np.asarray(v, np.float32)
    return v / max(float(np.sqrt((v * v).sum())), 1e-9)


def make_env(pal):
    """A tiny procedural studio: a graded space backdrop plus the light shapes,
    sampled by direction so chrome and glass reflect something believable."""
    top = np.array(pal["sky_top"], np.float32) * 5.2
    bot = np.array(pal["sky_bot"], np.float32) * 2.0
    accent = np.array(pal["trim"], np.float32)
    rims = np.array(pal["rim"], np.float32)
    dirs = [np.array(l[0], np.float32) for l in LIGHTS]
    cols = [np.array([1.00, 0.965, 0.905], np.float32) * LIGHTS[0][2],
            accent * 0.85 * LIGHTS[1][2],
            rims * 1.15 * LIGHTS[2][2]]
    size = [(LIGHTS[i][3], LIGHTS[i][4]) for i in range(len(LIGHTS))]

    def env(d):
        """d: (...,3) unit directions -> linear radiance."""
        dy = np.clip(d[..., 1], -1.0, 1.0)
        t = (dy * 0.5 + 0.5).astype(np.float32)
        out = bot[None, None, :] * (1.0 - t)[..., None] + top[None, None, :] * t[..., None]
        out = out + (accent * 0.30)[None, None, :] * np.exp(-(np.abs(dy) * 3.4) ** 2)[..., None]
        for i in range(len(dirs)):
            L = dirs[i]
            c = np.clip(d[..., 0] * L[0] + d[..., 1] * L[1] + d[..., 2] * L[2], -1.0, 1.0)
            sw, sh = size[i]
            blob = np.clip((c - (1.0 - sw)) / max(sw, 1e-3), 0.0, 1.0) ** 1.6
            out = out + cols[i][None, None, :] * blob[..., None]
        return out.astype(np.float32)

    return env


def ggx(n, v, L, rough, f0):
    """Cook-Torrance with a Smith-GGX term; n,v are (h,w,3), f0/rough (h,w)."""
    a = rough * rough
    h = np.asarray(L, np.float32)[None, None, :] + v
    hl = np.sqrt(np.maximum((h * h).sum(axis=2), 1e-9))
    h = h / hl[..., None]
    nh = np.maximum((n * h).sum(axis=2), 0.0)
    nv = np.maximum((n * v).sum(axis=2), 1e-4)
    nl = np.maximum(n[..., 0] * L[0] + n[..., 1] * L[1] + n[..., 2] * L[2], 0.0)
    d = nh * nh * (a * a - 1.0) + 1.0
    D = (a * a) / (np.pi * d * d + 1e-7)
    k = (rough + 1.0) ** 2 / 8.0
    G = (nv / (nv * (1.0 - k) + k)) * (nl / (nl * (1.0 - k) + k))
    F = f0 + (1.0 - f0) * np.power(1.0 - np.maximum((v * h).sum(axis=2), 0.0), 5.0)
    return ((D * G * F / (4.0 * nv * nl + 1e-5)) * nl)[..., None]


def shade_robot(nv, mat, valid, shb, eye, pal, rng, sigil_kind, lean_c, lean_s,  # noqa: C901
                twist, tier, decal):
    """Physically-plausible shading pass for the android g-buffer."""
    h, w = valid.shape
    n = nv[..., 0:3].astype(np.float32)
    nl = np.sqrt(np.maximum((n * n).sum(axis=2), 1e-9))
    n = n / np.maximum(nl, 1e-6)[..., None]
    ao = nv[..., 3].astype(np.float32)
    ao = np.where(valid, ao, 1.0)
    pos = nv[..., 4:7].astype(np.float32)
    depth = np.maximum(nv[..., 7].astype(np.float32), 1e-4)

    # character-local space (undo the camera-frame lean and the torso twist)
    lx, ly, lz = rot_y(pos[..., 0], pos[..., 1], pos[..., 2], math.cos(-twist), math.sin(-twist))
    lx, ly, lz = rot_y(lx, ly, lz, lean_c, -lean_s)
    loc = np.stack([lx, ly, lz], axis=2)

    eye = np.asarray(eye, np.float32)
    v = eye[None, None, :] - pos
    v = v / np.maximum(np.sqrt(np.maximum((v * v).sum(axis=2), 1e-9))[..., None], 1e-6)
    nvv = np.maximum((n * v).sum(axis=2), 0.0)

    env = make_env(pal)
    paint_col = np.array(pal["paint"], np.float32)
    cer_col = np.array(pal["ceramic"], np.float32)
    trim = np.array(pal["trim"], np.float32)
    gold = np.array([0.92, 0.68, 0.26], np.float32)
    gun = np.array([0.052, 0.058, 0.070], np.float32)
    hose = np.array([0.030, 0.031, 0.036], np.float32)
    chrome = np.array([0.80, 0.84, 0.90], np.float32)
    lens = np.array([0.012, 0.014, 0.021], np.float32)

    # ── per-pixel material fields ───────────────────────────────────────────
    albedo = np.zeros((h, w, 3), np.float32)
    rough = np.full((h, w), 0.45, np.float32)
    metal = np.zeros((h, w), np.float32)
    coat = np.zeros((h, w), np.float32)
    emit = np.zeros((h, w, 3), np.float32)
    idn = np.zeros((h, w), np.int32)
    for mid, (key, r, mt, ct, eg) in MATS.items():
        m = mat == mid
        idn = np.where(m, mid, idn)
        rough = np.where(m, np.float32(r), rough)
        metal = np.where(m, np.float32(mt), metal)
        coat = np.where(m, np.float32(ct), coat)
        if key == "paint":
            albedo = np.where(m[..., None], paint_col[None, None, :], albedo)
        elif key == "ceramic":
            albedo = np.where(m[..., None], cer_col[None, None, :], albedo)
        elif key == "chrome":
            albedo = np.where(m[..., None], chrome[None, None, :], albedo)
        elif key == "gunmetal":
            albedo = np.where(m[..., None], gun[None, None, :], albedo)
        elif key == "gold":
            albedo = np.where(m[..., None], gold[None, None, :], albedo)
        elif key == "hose":
            albedo = np.where(m[..., None], hose[None, None, :], albedo)
        elif key == "lens":
            albedo = np.where(m[..., None], lens[None, None, :], albedo)
        elif key == "emit":
            albedo = np.where(m[..., None], lens[None, None, :], albedo)
            emit = np.where(m[..., None], trim[None, None, :], emit)

    # ── surface detail: seams, micro-roughness, grime, edge wear ───────────
    break_up = 0.30 + 1.45 * noise(rng, (h, w), 3, 2)     # which lines are real
    seam_y = band(ly, 12.5, 0.055) * break_up
    seam_x = band(lx, 7.5, 0.070) * break_up * np.clip(np.abs(n[..., 0]) * 2.2 - 0.75, 0, 1)
    seam_h = band(np.sqrt(lx * lx + (ly - 1.620) ** 2), 9.0, 0.075)   # helm face rings
    seams = np.clip(seam_y + seam_x + seam_h * 0.85 * (ly > 1.470), 0.0, 1.0)
    is_shell = ((mat == M_PAINT) | (mat == M_CERAMIC) | (mat == M_GUNMETAL)).astype(np.float32)
    is_metal = ((mat == M_CHROME) | (mat == M_GOLD)).astype(np.float32)

    micro = noise(rng, (h, w), 150, 3)
    brushed = noise(rng, (h, w), 26, 2, stretch=16.0)
    rough = np.clip(rough * (0.78 + 0.55 * micro) + is_metal * (brushed - 0.5) * 0.10, 0.02, 1.0)

    grime_gain = [1.00, 0.92, 0.70, 0.46, 0.24, 0.14, 0.10][min(tier, 6)]
    grime = smoothstep(0.66, 0.10, ao) * (0.35 + 1.25 * noise(rng, (h, w), 34, 4, warp=0.9))
    grime = np.clip(grime, 0, 1) * grime_gain
    dirt_col = np.array([0.055, 0.048, 0.040], np.float32)

    # paint chips along plate rims: where the material id changes, plus a
    # small contribution from genuinely sharp geometric creases
    m32 = mat.astype(np.float32)
    dmat = np.abs(np.gradient(m32, axis=0)) + np.abs(np.gradient(m32, axis=1))
    rim = np.clip(blur(np.minimum(dmat * 1.4, 1.0), 0.85) * 2.9, 0.0, 1.0)
    dv = (np.gradient(n[..., 0], axis=1) + np.gradient(n[..., 1], axis=0)
          + np.gradient(n[..., 2], axis=1))
    crease = np.clip(smoothstep(4.5, 16.0, np.abs(dv) * depth * 60.0), 0.0, 1.0)
    wear = np.clip(np.maximum(rim, crease * 0.55) * is_shell
                   * (0.40 + 0.95 * noise(rng, (h, w), 46, 3)), 0.0, 1.0)

    paint_m = (mat == M_PAINT).astype(np.float32)
    cer_m = (mat == M_CERAMIC).astype(np.float32)
    g = (albedo * np.array([0.25, 0.62, 0.13], np.float32)[None, None, :]).sum(axis=2, keepdims=True)
    albedo = albedo + (g - albedo) * 0.16 * (paint_m + cer_m)[..., None]
    albedo = albedo * (1.0 - (0.58 * wear * paint_m + 0.26 * wear * cer_m)[..., None])
    albedo = albedo * (1.0 - 0.55 * grime[..., None] * is_shell[..., None])
    worn = np.clip((wear - 0.35) * is_shell * 2.2, 0, 1)
    albedo = albedo * (1.0 - 0.55 * worn[..., None]) + chrome[None, None, :] * (0.55 * worn)[..., None]
    albedo = np.where(grime[..., None] * is_shell[..., None] > 0.28,
                      0.60 * albedo + 0.40 * dirt_col[None, None, :], albedo)
    rough = np.clip(rough + grime * 0.30 * is_shell, 0.02, 1.0)
    seams *= is_shell
    albedo = albedo * (1.0 - 0.55 * seams[..., None])
    rough = np.clip(rough + 0.18 * seams, 0.02, 1.0)

    # ── decals: unit stripes on the helm, chevrons on the pauldron ─────────
    if decal > 0:
        front = np.clip(n[..., 2] * 2.0 - 0.35, 0.0, 1.0)
        helm_zone = ((ly > 1.560) & (ly < 1.80) & (np.abs(lx) < 0.14)).astype(np.float32)
        if decal == 1:                     # twin crown stripes
            pat = (np.abs(np.abs(lx) - 0.036) < 0.009).astype(np.float32)
        elif decal == 2:                   # centre keel stripe
            pat = (np.abs(lx) < 0.012).astype(np.float32)
        else:                              # diagonal slash across the helm
            pat = (np.abs((ly - 1.66) * 0.9 + lx * 1.5) < 0.011).astype(np.float32)
        strip = np.clip(pat * helm_zone * front, 0, 1) * ((mat == M_CERAMIC) | (mat == M_PAINT))
        albedo = albedo * (1.0 - strip[..., None]) + trim[None, None, :] * strip[..., None] * 0.85
        emit = emit + trim[None, None, :] * (strip * 0.35)[..., None]

    # ── role sigil plate on the left pectoral ───────────────────────────────
    su = (lx - 0.086) / 0.056
    sv = (ly - (CHEST_Y + 0.062)) / 0.052
    szone = (np.abs(su) < 1.0) & (np.abs(sv) < 1.0) & (lz > 0.130) & (n[..., 2] > 0.45) \
        & ((mat == M_PAINT) | (mat == M_CERAMIC))
    sg = np.clip(sigil(sigil_kind, np.where(szone, su, 2.0), np.where(szone, sv, 2.0)), 0, 1)
    sg = np.where(szone, sg, 0.0).astype(np.float32)
    badge = chrome if tier < 4 else gold
    albedo = albedo * (1.0 - sg[..., None]) + badge[None, None, :] * sg[..., None]
    rough = np.clip(rough * (1.0 - sg) + 0.16 * sg, 0.02, 1.0)
    metal = np.clip(metal + sg * 0.85, 0.0, 1.0)
    emit = emit + badge[None, None, :] * (np.clip(sg - 0.55, 0, 1) * 0.22)[..., None]

    # ── direct lighting: key (shadowed), cool fill, rarity-coloured rim ─────
    lit = np.zeros((h, w, 3), np.float32)
    shadowed = np.clip(shb, 0.0, 1.0)
    f0 = 0.045 + 0.90 * metal
    for ldir, lname, lint, _sw, _sh in LIGHTS:
        L = _norm(ldir)
        ndl = np.clip(n[..., 0] * L[0] + n[..., 1] * L[1] + n[..., 2] * L[2], 0.0, 1.0)
        if lname == "key":
            vis = shadowed
        elif lname == "rim":
            vis = np.clip(0.20 + 1.10 * (1.0 - nvv), 0.0, 1.0) * shadowed * 0.25 + \
                np.clip(1.35 * (1.0 - nvv) - 0.25, 0.0, 1.0)
        else:
            vis = np.ones((h, w), np.float32)
        if lname == "key":
            lcol = np.array([1.00, 0.955, 0.885], np.float32) * lint
        elif lname == "fill":
            lcol = (trim * 0.55 + np.array([0.20, 0.26, 0.34], np.float32)) * lint
        else:
            lcol = (np.array(pal["rim"], np.float32) * 1.15
                    + np.array([0.12, 0.12, 0.16], np.float32)) * lint
        lit = lit + albedo * (1.0 - 0.86 * metal[..., None]) * (ndl * vis)[..., None] * lcol[None, None, :]
        lit = lit + ggx(n, v, L, rough, f0) * (vis[..., None]) * lcol[None, None, :] * 1.35
    # clear coat over the paint and glaze over the ceramic: one tight lobe
    L0 = _norm(LIGHTS[0][0])
    ndl0 = np.clip(n[..., 0] * L0[0] + n[..., 1] * L0[1] + n[..., 2] * L0[2], 0.0, 1.0)
    coat_spec = ggx(n, v, L0, np.full((h, w), 0.075, np.float32),
                    np.full((h, w), 0.045, np.float32))
    lit = lit + coat_spec * (coat * ndl0 * shadowed * 2.10)[..., None] \
        * np.array([1.0, 0.985, 0.96], np.float32)[None, None, :]

    # ── ambient: sky irradiance + environment reflection ─────────────────────
    R = 2.0 * n * (n * v).sum(axis=2)[..., None] - v
    R = R / np.maximum(np.sqrt(np.maximum((R * R).sum(axis=2), 1e-9))[..., None], 1e-6)
    R[..., 1] = np.abs(R[..., 1])
    refl = env(np.clip(R, -1.0, 1.0))
    F = 0.030 + 0.97 * np.power(1.0 - nvv, 5.0)
    amb = albedo * env(np.clip(n, -1.0, 1.0)) * (0.16 * (1.0 - metal[..., None]))
    amb = amb * (0.35 + 0.65 * ao)[..., None]
    refl_gain = (np.clip(F + metal * 0.92, 0.0, 1.0)
                 * (1.0 - 0.55 * smoothstep(0.10, 0.60, rough))
                 * (0.55 + 0.45 * ao) * (rough < 0.85)).astype(np.float32)
    amb = amb + refl * refl_gain[..., None]
    amb = amb * (1.0 - 0.35 * (rough > 0.5))[..., None]

    col = lit + amb

    # ── emission, glow inside the lens, core pulse ──────────────────────────
    pulse = 0.72 + 0.55 * np.clip(1.0 - np.abs((ly - CHEST_Y) * 8.0), 0, 1)
    core = np.exp(-(((lx * lx + (ly - (CHEST_Y + 0.040)) ** 2) / 0.0045)))
    emit = emit * (2.05 + 1.30 * pulse)[..., None]
    # low tiers carry a dimmer reactor so the optic band stays the read;
    # Mythic gold keeps its full punch
    emit = emit + trim[None, None, :] * (core * (0.62 + 0.19 * tier) * (mat == M_CHROME))[..., None]
    lens_glow = np.clip(1.0 - nvv * 1.35, 0, 1) * (mat == M_LENS).astype(np.float32)
    emit = emit + trim[None, None, :] * (lens_glow * 0.55)[..., None]

    col = col + emit
    # occlusion of the emissive in deep crevices keeps the glow from leaking
    col = np.where(valid[..., None], col, 0.0)
    return np.clip(col, 0.0, 6.0)


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
    bands_ = noise(rng, (h, w), 9, 3)
    nx_, ny_ = (xx - cx) / R, (np.arange(h, dtype=np.float32)[:, None] - cy) / R
    limb = np.clip(1.0 - np.clip(np.abs(nx_), 0, 1) ** 2 - np.clip(ny_, -1, 1) ** 2, 0, 1) ** 0.45
    lit = np.clip(0.30 + 0.95 * np.clip(-nx_ * (1.0 if side else -1.0), 0, 1) + 0.35 * np.clip(-ny_, 0, 1), 0, 1.25)
    pcol = np.array(pal["planet"], np.float32)[None, None, :] * (0.62 + 0.70 * bands_[..., None]) \
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
    # hangar floor glow at the very bottom so the bust never floats on flat black
    glow = smoothstep(0.72, 1.0, np.arange(h, dtype=np.float32)[:, None] / h)
    sky += np.array(pal["rim"], np.float32)[None, None, :] * (glow ** 2.4 * 0.10)[..., None]
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
    # teal shadows / warm highlights, then a gentle S-curve for contrast
    lum = (col * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(axis=2, keepdims=True)
    shad = np.clip(1.0 - lum * 2.4, 0, 1)
    high = np.clip((lum - 0.55) * 2.2, 0, 1)
    col = col + shad * np.array([0.0, 0.030, 0.058], np.float32)[None, None, :]
    col = col + high * np.array([0.052, 0.020, -0.030], np.float32)[None, None, :]
    lum = col.mean(axis=2, keepdims=True)
    col = lum + (col - lum) * 1.14
    mean = float(col.mean())
    col = (col - mean) * 1.24 + mean * 0.965
    col = col * (1.0 - 0.20 * np.clip(np.abs(col - 0.5) - 0.30, 0, 1))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx / w - 0.5) * 2.0
    dy = (yy / h - 0.5) * 2.0
    vig = 1.0 - 0.30 * np.clip(dx * dx * 0.55 + dy * dy * 0.95, 0, 2.0) ** 1.4
    col *= np.clip(vig, 0.58, 1.0)[..., None]
    col += rng.standard_normal((h, w, 1)).astype(np.float32) * 0.010
    return np.clip(col, 0, 1)


# (vertical half-extent, camera target height) windows per framing archetype.
# Keep half <= 0.53 so the silhouette never reaches the SDF bounding box edge.
FRAME_LOOK = {
    0: (0.375, 0.415, 1.565, 1.610),   # tight bust, head and pauldrons fill the card
    1: (0.430, 0.475, 1.470, 1.530),   # classic chest portrait
    2: (0.480, 0.530, 1.330, 1.400),   # waist-up, tool arms and hips visible
    3: (0.455, 0.520, 1.355, 1.435),   # three-quarter body shot
    4: (0.420, 0.500, 1.380, 1.470),   # low hero angle
}
YAW_LO = {0: 6.0, 1: 10.0, 2: 14.0, 3: 24.0, 4: 8.0}
YAW_HI = {0: 22.0, 1: 30.0, 2: 38.0, 3: 46.0, 4: 26.0}
PITCH_LO = {0: -2.5, 1: -3.5, 2: -5.0, 3: -4.0, 4: -11.0}
PITCH_HI = {0: 2.0, 1: 3.0, 2: 4.5, 3: 3.5, 4: 1.5}


def render_card(idx, rec, size=(FRAME_H, FRAME_W), seed=None, ss=2):
    rng = np.random.default_rng(idx * 7919 + (0 if seed is None else seed))
    role, rarity = rec["role"], rec["rarity"]
    meta = RARITY[rarity]
    tier = meta[0]
    bulk, swing, head_s, shoulder, pack = ROLE_BUILD.get(role, (1.0, 0.25, 1.0, 1.0, 1))
    bulk *= rng.uniform(0.94, 1.08)
    chest = rng.uniform(0.94, 1.10) * (1.0 + 0.03 * tier)
    head_s *= rng.uniform(0.95, 1.05)
    shoulder *= rng.uniform(0.90, 1.14)

    # Compose a framing archetype per card so the set does not read as one bust
    # re-tinted 42 times: distance, crop height, angle and hero pitch all move.
    frame = int(rng.integers(0, 5))
    if tier >= 4:
        frame = int(rng.integers(1, 5))  # high tiers never get the flat tight bust
    half_lo, half_hi, tgt_lo, tgt_hi = FRAME_LOOK[frame]
    twist = np.radians(rng.uniform(-30.0, 30.0))
    lean = np.radians(rng.uniform(-4.0, 8.0))
    yaw = np.radians(rng.uniform(YAW_LO[frame], YAW_HI[frame])) * (1.0 if rng.random() < 0.55 else -1.0)
    pitch = np.radians(rng.uniform(PITCH_LO[frame], PITCH_HI[frame]))
    sky_mode = int(rng.integers(0, 3))

    gear = ROLE_GEAR.get(role, 0)
    if rng.random() < 0.30:
        gear = int(rng.integers(0, 8))
    crest = ROLE_CREST.get(role, 0)
    if rng.random() < 0.34:
        crest = int(rng.integers(0, 8))
    optics = ROLE_OPTICS.get(role, 0)
    if rng.random() < 0.28:
        optics = int(rng.integers(0, 4))
    chassis = ROLE_TOOL.get(role, 0)
    if rng.random() < 0.22:
        chassis = int(rng.integers(0, 8))
    pauld = ROLE_PAULDRON.get(tier, 1)
    if rng.random() < 0.25:
        pauld = int(rng.integers(0, 4))
    decal = 0 if tier < 2 else int(rng.integers(1, 4))

    P = np.zeros(16, np.float64)
    P[0] = twist
    P[1] = chest
    P[2] = bulk
    P[3] = head_s
    P[4] = rng.uniform(0.92, 1.10)          # arm / hand size
    P[5] = shoulder
    P[6] = swing + rng.uniform(-0.08, 0.18)
    P[7] = swing * 0.55 + rng.uniform(-0.10, 0.20)
    P[8] = chassis
    P[9] = gear
    P[10] = crest
    P[11] = optics
    P[12] = pack if rng.random() < 0.80 else int(rng.integers(0, 4))
    P[13] = pauld
    P[14] = rng.uniform(0.88, 1.16)         # face width
    P[15] = 1.0 if tier >= 4 else 0.0      # gold fittings on the high tiers

    hue = rng.uniform(-0.09, 0.11)

    def tint(c, k):
        a = np.array(c, np.float32) * k
        return tuple(np.clip(a * (1.0 + hue * np.array([1.0, 0.4, -0.5], np.float32)), 0.02, 1.0))

    _tr = np.array(meta[3], np.float32)
    pal = {"paint": tint(tuple(np.array(meta[1], np.float32) * 0.92 + _tr * 0.30), rng.uniform(0.92, 1.16)),
           "ceramic": tint(tuple(np.array(meta[2], np.float32) * 0.86 + np.array([0.10, 0.11, 0.13], np.float32)),
                           rng.uniform(0.94, 1.10)),
           "trim": meta[3], "rim": meta[4],
           "sky_top": meta[5], "sky_bot": meta[6], "nebula": meta[7], "planet": meta[8],
           "planet_rim": meta[9]}

    h, w = size
    half = rng.uniform(half_lo, half_hi)
    dist = rng.uniform(1.36, 1.62)
    tgt = (0.0, rng.uniform(tgt_lo, tgt_hi), 0.02)
    cam = make_camera(tgt, dist, math.degrees(yaw), math.degrees(pitch), half / dist, w, h)
    out, dep, matb, shb = gbuffer(P, math.degrees(lean), math.degrees(twist), w, h, cam, ss=ss)
    valid = dep > 0
    col = shade_robot(out, matb, valid, shb, cam[0:3], pal, rng,
                      ROLE_SIGIL.get(role, 0), float(np.cos(lean)), float(np.sin(lean)),
                      twist, tier, decal)

    sky = make_sky(h, w, pal, rng, sky_mode)
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
    halo = np.exp(-(((gx - w * (0.5 - 0.12 * np.sign(yaw))) / (w * 0.46)) ** 2
                    + ((gy - h * 0.30) / (h * 0.30)) ** 2))
    sky += np.array(pal["rim"], np.float32)[None, None, :] * halo[..., None] * 0.22
    soft = blur(valid.astype(np.float32), 10.0)
    sky = sky * (1.0 - 0.34 * np.clip(soft - valid.astype(np.float32), 0, 1)[..., None])

    out_img = np.where(valid[..., None], np.clip(col, 0, 4.0), sky)
    # bloom: the emissive optics, the reactor core and every specular hot spot
    bright = np.clip(out_img - 0.88, 0.0, None)
    bl = np.stack([blur(bright[..., i], 6.0) for i in range(3)], axis=2)
    out_img = out_img + bl * (0.22 + 0.24 * np.array(pal["rim"], np.float32)[None, None, :])
    # atmospheric rim wrap so the silhouette separates from the backdrop
    wrapm = np.clip(blur(valid.astype(np.float32), 2.6) - valid.astype(np.float32), 0, 1)
    out_img = out_img + wrapm[..., None] * np.array(pal["trim"], np.float32)[None, None, :] * 0.32
    return np.clip(grade(out_img, rng, pal, h, w), 0, 1)


def to_png(arr, out_path, out_size=(OUT_W, OUT_H)):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255.0 + 0.5).astype(np.uint8)).resize(out_size, Image.LANCZOS)
    img.save(out_path, optimize=True)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--montage", action="store_true")
    ap.add_argument("--preview-dir", default="/tmp/crew_preview")
    ap.add_argument("--draft", action="store_true",
                    help="half resolution, no supersampling - for fast art review only")
    ap.add_argument("--ss", type=int, default=2, choices=(1, 2),
                    help="supersampling factor of the ray marcher (1 is already 2x the card size)")
    args = ap.parse_args()
    roster = load_roster()
    only = {int(v) for v in args.only.split(",") if v.strip()} if args.only else None
    prev = Path(args.preview_dir)
    prev.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    imgs = []
    size = (440, 360) if args.draft else (FRAME_H, FRAME_W)
    for rec in roster:
        if only and rec["idx"] not in only:
            continue
        arr = render_card(rec["idx"], rec, size=size, ss=1 if args.draft else args.ss)
        full = prev / f"crew_{rec['idx']:02d}_full.png"
        to_png(arr, full, (360, 440))
        if not only and not args.draft:
            to_png(arr, OUT_DIR / f"crew_{rec['idx']:02d}.png")
        print(f"crew_{rec['idx']:02d}  {rec['role']:10s} {rec['rarity']:10s} {rec['name']}", flush=True)
        if args.montage or only:
            imgs.append(Image.open(full))
    if imgs:
        cw, ch = 360, 440
        cols = min(6, len(imgs))
        rows = (len(imgs) + cols - 1) // cols
        m = Image.new("RGB", (cols * (cw + 4), rows * (ch + 4)), (12, 14, 20))
        d = ImageDraw.Draw(m)
        for i, im in enumerate(imgs):
            x, y = (i % cols) * (cw + 4) + 2, (i // cols) * (ch + 4) + 2
            m.paste(im, (x, y))
            d.rectangle([x, y, x + cw - 1, y + ch - 1], outline=(60, 70, 90))
        m.save(prev / "montage.png")
        print("montage ->", prev / "montage.png")


if __name__ == "__main__":
    main()
