#!/usr/bin/env python3
"""Render the achievement card backdrops (assets/cards/achievements/bg_<rarity>.png).

One physically shaded metal plaque per rarity, generated from a procedural
relief height field (starburst rays, laurel wreath, hex emblem, corner
brackets, brushed-metal micro noise) with normals, specular, ambient
occlusion, rim light, vignette and film grain. No emoji, no flat fills.
"""
from __future__ import annotations

import hashlib
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image

try:
    import numba
except Exception:  # pragma: no cover
    numba = None

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "cards" / "achievements"

W, H = 640, 360

RARITIES = {
    "common":    (0.58, 0.65, 0.74),
    "uncommon":  (0.22, 0.86, 0.54),
    "rare":      (0.20, 0.70, 1.00),
    "epic":      (0.74, 0.34, 1.00),
    "legendary": (1.00, 0.75, 0.16),
    "mythic":    (0.24, 0.96, 0.92),
    "secret":    (1.00, 0.22, 0.46),
}


def hashf(x, y, seed):
    """Deterministic value noise in [0,1)."""
    n = (x.astype(np.int64) * 1619 + y.astype(np.int64) * 31337 + seed * 6971) & 0x7FFFFFFF
    n = (n << 13) ^ n
    n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7FFFFFFF
    return (1.0 - ((n * (n * n * 1666 + 60493) + 1479897363) & 0x7FFFFFFF) / 1073741824.0) * 0.5 + 0.5


def vnoise(xs, ys, seed):
    xi = np.floor(xs).astype(np.int64)
    yi = np.floor(ys).astype(np.int64)
    tx = xs - xi
    ty = ys - yi
    sx = tx * tx * (3 - 2 * tx)
    sy = ty * ty * (3 - 2 * ty)
    a = hashf(xi, yi, seed)
    b = hashf(xi + 1, yi, seed)
    c = hashf(xi, yi + 1, seed)
    d = hashf(xi + 1, yi + 1, seed)
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy


def fbm(xs, ys, seed, octaves=4):
    acc = np.zeros_like(xs)
    amp = 0.5
    freq = 1.0
    for o in range(octaves):
        acc += vnoise(xs * freq, ys * freq, seed + o * 977) * amp
        amp *= 0.5
        freq *= 2.02
    return acc


def sd_segment(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    seglen2 = vx * vx + vy * vy
    t = np.clip((wx * vx + wy * vy) / max(seglen2, 1e-9), 0.0, 1.0)
    dx, dy = wx - vx * t, wy - vy * t
    return np.sqrt(dx * dx + dy * dy)


def sd_polygon(px, py, pts):
    """Signed distance to a convex-ish polygon (approximate, inside = positive)."""
    n = len(pts)
    d = np.full(px.shape, 1e9)
    for i in range(n):
        ax, ay = pts[i]
        bx, by = pts[(i + 1) % n]
        d = np.minimum(d, sd_segment(px, py, ax, ay, bx, by))
    return d


def relief(w=W, h=H, seed=7, rays=18, wreath=True, hexagon=True, brackets=True, rings=3,
             emblem_sides=6, chevrons=3, guilloche=150.0, leaf_pitch=144.0, leaf_n=11):
    """Height field of the engraved/embossed plaque."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    cx, cy = w * 0.5, h * 0.5
    # aspect-corrected coordinates
    px = (xx - cx) / (w * 0.5)
    py = (yy - cy) / (h * 0.5)
    r = np.sqrt(px * px + py * py * 1.9)
    ang = np.arctan2(py, px)

    hgt = np.zeros_like(px)

    # Convex base plate
    hgt += 0.16 * np.cos(np.clip(r * 1.35, 0, math.pi * 0.5))

    # Concentric engraved rings
    for i in range(rings):
        rr = 0.34 + i * 0.17
        band = np.exp(-((r - rr) / 0.0085) ** 2)
        hgt -= 0.075 * band

    # Starburst rays, embossed
    ray = np.cos(rays * ang + 0.4 * np.sin(r * 5.0))
    ray = np.where(r < 0.98, np.power(np.clip(ray, 0, 1), 6.0), 0.0)
    hgt += 0.115 * ray * np.clip(1.15 - r, 0, 1)

    # Fine radial guilloche
    hgt += 0.010 * np.sin(guilloche * ang) * np.clip(1.0 - r, 0, 1)

    # Laurel wreath: two mirrored branches rising up the left and right sides
    if wreath:
        for side in (-1.0, 1.0):
            prev = None
            for k in range(leaf_n):
                tt = k / max(leaf_n - 1, 1)
                th = math.radians(200.0 - leaf_pitch * tt)      # sweeps up the left flank
                th = math.pi - th if side > 0 else th            # mirror for the right flank
                rr = 0.58 + 0.05 * math.sin(tt * math.pi)
                lx, ly = math.cos(th) * rr, math.sin(th) * rr * 1.28
                ca, sa = math.cos(th + 1.15 * side), math.sin(th + 1.15 * side)
                qx = (px - lx) * ca + (py - ly) * sa
                qy = -(px - lx) * sa + (py - ly) * ca
                # pointed leaf: wide near the stem, tapering to a tip
                shape = np.abs((qx + 0.016) / 0.074) ** 1.55 + np.abs(qy / 0.030) ** 2.1
                leaf = np.clip(1.0 - shape, 0, 1)
                hgt += 0.40 * np.power(leaf, 0.8)
                # small berry between leaves
                bx2, by2 = math.cos(th + 0.10 * side) * (rr + 0.055), math.sin(th + 0.10 * side) * (rr + 0.055) * 1.28
                bd = np.sqrt((px - bx2) ** 2 + (py - by2) ** 2)
                hgt += 0.22 * np.clip(1.0 - bd / 0.021, 0, 1)
                # stem polyline
                cur = (lx, ly)
                if prev is not None:
                    sd = sd_segment(px, py / 1.28, prev[0], prev[1] * 1.28, cur[0], cur[1] * 1.28)
                    hgt += 0.075 * np.clip(1.0 - sd / 0.0075, 0, 1)
                prev = cur

    # Central emblem, raised with an engraved inner shape
    if hexagon:
        pts = [(0.235 * math.cos(math.pi / emblem_sides + i * 2 * math.pi / emblem_sides),
                0.330 * math.sin(math.pi / emblem_sides + i * 2 * math.pi / emblem_sides))
               for i in range(emblem_sides)]
        outer = sd_polygon(px, py, pts)
        hgt += 0.34 * np.clip(1.0 - outer / 0.028, 0, 1)
        pts_in = [(v[0] * 0.66, v[1] * 0.66) for v in pts]
        inner = sd_polygon(px, py, pts_in)
        hgt -= 0.19 * np.clip(1.0 - inner / 0.020, 0, 1)
        # stacked chevrons inside the emblem
        for i in range(chevrons):
            oy = 0.06 - i * 0.055
            for sgn in (1.0, -1.0):
                hgt += 0.17 * np.clip(1.0 - np.abs(py - oy - sgn * abs(px) * 0.55) / 0.013, 0, 1) * \
                    np.clip(1.0 - np.abs(px) / 0.155, 0, 1)

    # Corner brackets
    if brackets:
        for sx in (-1.0, 1.0):
            for sy in (-1.0, 1.0):
                ax, ay = sx * 0.90, sy * 0.86
                bx, by = sx * 0.66, sy * 0.86
                cx2, cy2 = sx * 0.90, sy * 0.62
                d = np.minimum(sd_segment(px, py, ax, ay, bx, by),
                               sd_segment(px, py, ax, ay, cx2, cy2))
                hgt += 0.30 * np.clip(1.0 - d / 0.013, 0, 1)

    # Brushed metal micro-relief, horizontally anisotropic
    hgt += 0.013 * (fbm(px * 18.0, py * 260.0, seed + 31) - 0.5)
    hgt += 0.010 * (fbm(px * 60.0, py * 60.0, seed + 991, 3) - 0.5)

    # Bevelled frame edge (cut off at the border)
    edge = np.minimum.reduce([px + 1.0, 1.0 - px, py + 1.0, 1.0 - py])
    hgt *= np.clip(edge / 0.05, 0, 1)
    hgt -= 0.30 * np.clip(1.0 - edge / 0.035, 0, 1)
    return hgt


def shade(hgt, rarity_rgb, seed=7, w=W, h=H):
    """Lambert + GGX-ish specular + rim + AO over the relief, in float32 RGB."""
    gy, gx = np.gradient(hgt)
    n = np.stack([-gx * 4.2, -gy * 4.2, np.ones_like(gx)], axis=-1)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-6)

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    px = (xx - w * 0.5) / (w * 0.5)
    py = (yy - h * 0.5) / (h * 0.5)
    rr = np.sqrt(px * px + py * py * 1.6)

    l1 = np.array([-0.48, -0.62, 0.62]); l1 /= np.linalg.norm(l1)
    l2 = np.array([0.72, 0.42, 0.55]);  l2 /= np.linalg.norm(l2)
    v = np.array([0.0, 0.0, 1.0])

    diff1 = np.clip(n @ l1, 0, 1)
    diff2 = np.clip(n @ l2, 0, 1)
    hvec1 = l1 + v
    hvec1 /= np.linalg.norm(hvec1)
    hvec2 = l2 + v
    hvec2 /= np.linalg.norm(hvec2)
    spec1 = np.power(np.clip(n @ hvec1, 0, 1), 46.0)
    spec2 = np.power(np.clip(n @ hvec2, 0, 1), 22.0)
    fres = np.power(1.0 - np.clip(n[..., 2], 0, 1), 3.0)

    curvature = np.abs(np.gradient(gx)[1] + np.gradient(gy)[0])
    ao = np.clip(1.0 - curvature * 6.5, 0.35, 1.0)
    # cavity darkening where the height dips
    ao *= np.clip(0.55 + 1.5 * (hgt - hgt.min()) / max(hgt.max() - hgt.min(), 1e-6), 0.30, 1.0)

    # Near-black brushed plate; the rarity shows up in metal highlights & glow.
    base = np.array([0.016, 0.020, 0.029])
    metal = np.array(rarity_rgb, dtype=np.float64)

    emboss = np.clip(hgt * 2.4, 0, 1)
    alb = base[None, None, :] + (0.055 * emboss)[..., None] * metal[None, None, :] \
        + np.array([0.030, 0.038, 0.050])[None, None, :] * (1.0 - emboss)[..., None]

    lum = (0.30 + 0.95 * diff1) * ao
    col = alb * lum[..., None]
    col = col * (0.62 + 0.38 * (np.array([1.0, 0.975, 0.94]) * diff1[..., None]))
    # polished specular keeps the metal feel without lighting the whole plate up
    col += np.array([1.0, 0.985, 0.96]) * (0.62 * np.power(spec1, 0.85))[..., None]
    col += metal * (0.46 * spec2[..., None])
    col += metal * (0.34 * fres[..., None])
    col += metal * (0.055 * diff2[..., None]) * ao[..., None]

    # engraved grooves catch light; emblem core self-lights softly
    edge_glow = np.clip(1.0 - np.abs(gy) * 4.6 - np.abs(gx) * 4.6, 0, 1)
    col += metal * (0.13 * edge_glow[..., None])
    col += metal * (0.11 * np.clip(1.0 - rr / 0.30, 0, 1))[..., None]

    vig = np.clip(1.01 - 0.26 * rr, 0.42, 1.0)
    col *= vig[..., None]
    edge = np.minimum.reduce([px + 1.0, 1.0 - px, py + 1.0, 1.0 - py])
    border = np.clip(1.0 - np.abs(edge - 0.055) / 0.016, 0, 1)
    col += metal * (0.30 * border[..., None])
    outer_fade = np.clip((edge - 0.004) / 0.05, 0, 1)
    col *= outer_fade[..., None]
    col += (1.0 - outer_fade[..., None]) * metal * 0.10

    # global exposure tuned so card text stays readable on top of it
    col *= 0.78

    # film grain (deterministic)
    grain = (hashf(xx * 3 + seed, yy * 3 + seed * 5, seed) - 0.5) * 0.012
    col += grain[..., None]

    col = np.clip(col, 0, 1)
    col = np.power(np.clip(col, 0, 1), 1.0 / 2.15) * 1.10
    return (np.clip(col, 0, 1) * 255.0).astype(np.uint8)


VARIANTS = {
    # rays, wreath, emblem sides, chevrons, guilloche, leaf pitch, leaves, rings
    "common":    dict(rays=12, wreath=False, hexagon=True, emblem_sides=6, chevrons=2,
                      guilloche=90.0, leaf_pitch=144.0, leaf_n=9, rings=2, brackets=False),
    "uncommon":  dict(rays=16, wreath=True, hexagon=True, emblem_sides=6, chevrons=3,
                      guilloche=120.0, leaf_pitch=132.0, leaf_n=8, rings=3, brackets=False),
    "rare":      dict(rays=20, wreath=True, hexagon=True, emblem_sides=7, chevrons=3,
                      guilloche=150.0, leaf_pitch=150.0, leaf_n=9, rings=3, brackets=True),
    "epic":      dict(rays=24, wreath=True, hexagon=True, emblem_sides=8, chevrons=4,
                      guilloche=180.0, leaf_pitch=158.0, leaf_n=10, rings=4, brackets=True),
    "legendary": dict(rays=28, wreath=True, hexagon=True, emblem_sides=5, chevrons=4,
                      guilloche=210.0, leaf_pitch=166.0, leaf_n=11, rings=4, brackets=True),
    "mythic":    dict(rays=32, wreath=True, hexagon=True, emblem_sides=9, chevrons=5,
                      guilloche=240.0, leaf_pitch=174.0, leaf_n=11, rings=5, brackets=True),
    "secret":    dict(rays=36, wreath=True, hexagon=True, emblem_sides=3, chevrons=6,
                      guilloche=275.0, leaf_pitch=182.0, leaf_n=12, rings=5, brackets=True),
}


def render(rarity, rgb, seed):
    hgt = relief(seed=seed, **VARIANTS[rarity])
    img = shade(hgt, rgb, seed=seed)
    im = Image.fromarray(img, "RGB")
    out = OUT / ("bg_%s.png" % rarity)
    im.save(out, optimize=True)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    hashes = {}
    for i, (rarity, rgb) in enumerate(RARITIES.items()):
        out = render(rarity, rgb, seed=17 + i * 53)
        hashes[rarity] = hashlib.sha256(out.read_bytes()).hexdigest()[:16]
        print("wrote %-38s %5d px  %s" % (out.relative_to(ROOT), out.stat().st_size, hashes[rarity]))
    vals = list(hashes.values())
    print("unique backdrops: %d/%d" % (len(set(vals)), len(vals)))
    if len(set(vals)) != len(vals):
        raise SystemExit("DUPLICATE BACKDROP DETECTED")


if __name__ == "__main__":
    main()
