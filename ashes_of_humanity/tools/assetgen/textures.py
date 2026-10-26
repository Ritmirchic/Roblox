#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Procedural PBR texture generation.
#
#  Every surface in the game is authored here as an original, layered
#  material: base colour + height-derived normal + occlusion/roughness/
#  metallic (ORM).  No external image assets are used.
# ============================================================================
import os
import numpy as np

RNG = np.random.default_rng(20261026)

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "textures")
SIZE = 512


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _grid(size):
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    return x / size, y / size


def fbm(shape, scale, octaves=5, seed=0, persistence=0.5, lacunarity=2.0):
    """Tileable fractal value noise in [0,1]."""
    rng = np.random.default_rng(seed)
    h, w = shape
    out = np.zeros(shape, np.float32)
    amp = 1.0
    total = 0.0
    for o in range(octaves):
        freq = max(1, int(scale * (lacunarity ** o)))
        g = rng.random((freq, freq)).astype(np.float32)
        # tileable bilinear upsample
        gx = np.linspace(0, freq, w, endpoint=False, dtype=np.float32)
        gy = np.linspace(0, freq, h, endpoint=False, dtype=np.float32)
        ix, iy = gx.astype(np.int32), gy.astype(np.int32)
        fx, fy = gx - ix, gy - iy
        fx = fx * fx * (3 - 2 * fx)
        fy = fy * fy * (3 - 2 * fy)
        g00 = g[np.ix_(iy, ix)]
        g10 = g[np.ix_(iy, (ix + 1) % freq)]
        g01 = g[np.ix_((iy + 1) % freq, ix)]
        g11 = g[np.ix_((iy + 1) % freq, (ix + 1) % freq)]
        n = (g00 * (1 - fx) + g10 * fx) * (1 - fy) + (g01 * (1 - fx) + g11 * fx) * fy
        out += n * amp
        total += amp
        amp *= persistence
    return out / max(total, 1e-6)


def worley(shape, cells, seed=0):
    """Tileable Worley (cellular) noise, returns (f1 distance, f2 distance, cell id)."""
    rng = np.random.default_rng(seed)
    h, w = shape
    pts = rng.random((cells, cells, 2)).astype(np.float32)
    ys = np.arange(h, dtype=np.float32) / h * cells
    xs = np.arange(w, dtype=np.float32) / w * cells
    f1 = np.full((h, w), 1e9, np.float32)
    f2 = np.full((h, w), 1e9, np.float32)
    cid = np.zeros((h, w), np.int32)
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            cy = ys.astype(np.int32) + dy
            cx = xs.astype(np.int32) + dx
            py = pts[cy % cells, cx % cells, 1] + np.floor(cy / cells)
            px = pts[cy % cells, cx % cells, 0] + np.floor(cx / cells)
            py = (py + dy) % cells
            px = (px + dx) % cells
            ppx = pts[cy % cells, cx % cells, 0] + dx
            ppy = pts[cy % cells, cx % cells, 1] + dy
            dy_ = (ys[:, None] - ppy[None, :]) ** 2
            dx_ = (xs[None, :] - ppx[None, :]) ** 2
            d = np.sqrt(dx_ + dy_)
            cellid = (cy % cells) * cells + (cx % cells)
            upd = d < f1
            f2 = np.where(upd, f1, np.minimum(f2, d))
            f1 = np.where(upd, d, f1)
            cid = np.where(upd, cellid, cid)
    return f1, f2, cid


def height_to_normal(height, strength=2.0):
    h, w = height.shape
    dx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    dy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(height)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx * inv * 0.5 + 0.5, ny * inv * 0.5 + 0.5, nz * inv * 0.5 + 0.5], -1)


def box_blur(img, radius):
    if radius <= 0:
        return img
    out = img
    for _ in range(2):
        pad = np.pad(out, ((radius, radius), (radius, radius)), mode="edge")
        acc = np.zeros_like(out)
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                acc += pad[radius + dy:radius + dy + out.shape[0],
                           radius + dx:radius + dx + out.shape[1]]
        out = acc / ((2 * radius + 1) ** 2)
    return out


def srgb_to_linear(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def mix(a, b, t):
    """Blend two arrays. `t` may be (h,w) or (h,w,1)."""
    if a.ndim == 3 and t.ndim == 2:
        t = t[..., None]
    return a * (1.0 - t) + b * t


def to_u8(a):
    return np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# material builders -> (albedo RGB, normal RGB, ORM RGB)
# ---------------------------------------------------------------------------
def mat_concrete(seed=1, tint=(0.55, 0.55, 0.54), cracks=True, grime=0.55):
    h, w = SIZE, SIZE
    base = np.full((h, w, 3), np.array(tint, np.float32), np.float32)
    grain = fbm((h, w), 48, 5, seed)
    blotch = fbm((h, w), 5, 4, seed + 11)
    mottle = fbm((h, w), 14, 4, seed + 23)
    height = grain * 0.35 + blotch * 0.65
    base *= (0.78 + grain * 0.30)[..., None]
    base = mix(base, np.full_like(base, np.array(tint) * 0.55), (blotch * 0.55)[..., None])
    rough = 0.86 + grain * 0.12 - blotch * 0.06
    ao = 0.82 + mottle * 0.18
    if cracks:
        f1, f2, _ = worley((h, w), 7, seed + 5)
        crack = np.clip(1.0 - f2 * 1.9, 0, 1)
        crack = np.clip(crack * 2.0 - 1.0, 0, 1) ** 1.5
        base *= (1.0 - crack * 0.55)[..., None]
        height -= crack * 0.35
        rough = rough + crack * 0.08
        ao -= crack * 0.25
    # vertical grime streaks
    streak = fbm((h, w), 90, 3, seed + 31)
    streak = np.clip(streak * 1.4 - 0.5, 0, 1) * np.clip(np.linspace(1, 0, h)[:, None] ** 1.4, 0, 1)
    base *= (1.0 - streak * grime * 0.55)[..., None]
    rough = rough + streak * 0.05
    return base, height_to_normal(height, 2.2), np.stack([np.clip(ao, 0, 1), np.clip(rough, 0.05, 1), np.zeros_like(rough)], -1)


def mat_brick(seed=2):
    h, w = SIZE, SIZE
    rows, cols = 16, 8
    bh, bw = h // rows, w // cols
    mortar = np.zeros((h, w), np.float32)
    brickid = np.zeros((h, w), np.int32)
    height = np.zeros((h, w), np.float32)
    for r in range(rows):
        offset = (bw // 2) if (r % 2) else 0
        for c in range(cols):
            x0 = c * bw - offset
            x1 = x0 + bw
            y0, y1 = r * bh, (r + 1) * bh
            xs0, xs1 = max(0, x0), min(w, x1)
            xs0b, xs1b = (xs0 + w) % w, (xs0 + w) % w  # tileable wrap
            for xx in range(xs0, xs1):
                brickid[y0:y1, xx] = r * cols + c
            for xx in range(xs0, xs1):
                brickid[y0:y1, xx] = r * cols + c
            # mortar frame
            mortar[y0:y1, xs0:xs1] = 1.0
            mortar[y0:y0 + 3, :] = 1.0
            mortar[y1 - 3:y1, :] = 1.0
            mortar[y0:y1, xs0:xs0 + 3] = 1.0
            mortar[y0:y1, xs1 - 3:xs1] = 1.0
    n_bricks = rows * cols
    rng = np.random.default_rng(seed)
    shades = rng.uniform(0.55, 1.0, (n_bricks, 3)).astype(np.float32)
    base = shades[brickid % n_bricks]
    base = base * np.array([0.52, 0.26, 0.20], np.float32) * 1.9
    grain = fbm((h, w), 64, 4, seed + 3)
    base *= (0.82 + grain * 0.32)[..., None]
    mortar_col = np.array([0.48, 0.46, 0.42], np.float32)
    base = mix(base, np.full_like(base, mortar_col), mortar[..., None])
    height = (1.0 - mortar) * 0.75 + grain * 0.12
    ao = 0.72 + (1.0 - mortar) * 0.28
    rough = 0.88 + grain * 0.10
    # soot / grime
    grime = fbm((h, w), 4, 4, seed + 9)
    base *= (0.7 + grime * 0.5)[..., None]
    return base, height_to_normal(height, 3.0), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_asphalt(seed=3):
    h, w = SIZE, SIZE
    grain = fbm((h, w), 160, 5, seed)
    clumps = fbm((h, w), 26, 4, seed + 7)
    base = np.full((h, w, 3), 0.085, np.float32)
    base *= (0.72 + clumps * 0.55)[..., None]
    base += (grain * 0.10)[..., None]
    f1, f2, _ = worley((h, w), 34, seed + 4)
    pebbles = np.clip(1.0 - f1 * 2.4, 0, 1)
    base += (pebbles * 0.06)[..., None]
    height = grain * 0.5 + clumps * 0.3 + pebbles * 0.5
    rough = 0.80 + grain * 0.16 - pebbles * 0.05
    ao = 0.82 + clumps * 0.16
    patch = fbm((h, w), 3, 3, seed + 17)
    base = mix(base, np.full_like(base, np.array([0.05, 0.05, 0.055])), (patch * 0.5)[..., None])
    return base, height_to_normal(height, 2.6), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_dirt(seed=4):
    h, w = SIZE, SIZE
    lumps = fbm((h, w), 8, 5, seed)
    fine = fbm((h, w, ), 80, 4, seed + 6)
    stones = fbm((h, w), 34, 3, seed + 13)
    base = np.full((h, w, 3), np.array([0.22, 0.165, 0.115]), np.float32)
    base *= (0.68 + lumps * 0.62)[..., None]
    base += (fine * 0.05)[..., None]
    s = np.clip((stones - 0.72) * 4.0, 0, 1)
    base = mix(base, np.full_like(base, np.array([0.24, 0.23, 0.215])), s[..., None])
    height = lumps * 0.55 + fine * 0.2 + s * 0.45
    rough = 0.92 - s * 0.12 + fine * 0.05
    ao = 0.70 + lumps * 0.30
    return base, height_to_normal(height, 2.4), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_grass(seed=5):
    h, w = SIZE, SIZE
    clumps = fbm((h, w), 7, 5, seed)
    blades = fbm((h, w), 120, 4, seed + 8)
    dry = fbm((h, w), 4, 3, seed + 19)
    base = np.full((h, w, 3), np.array([0.14, 0.19, 0.075]), np.float32)
    base *= (0.65 + clumps * 0.7)[..., None]
    base += (blades * 0.09)[..., None]
    drym = np.clip((dry - 0.45) * 2.2, 0, 1)
    base = mix(base, np.full_like(base, np.array([0.30, 0.26, 0.12])), drym[..., None])
    height = clumps * 0.4 + blades * 0.5
    rough = 0.90 - clumps * 0.06
    ao = 0.66 + clumps * 0.34
    return base, height_to_normal(height, 2.0), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_rusted_metal(seed=6, paint=(0.22, 0.25, 0.24), rust_amount=0.55):
    h, w = SIZE, SIZE
    f1, f2, cid = worley((h, w), 9, seed)
    rustn = fbm((h, w), 5, 5, seed + 3)
    patch = np.clip((rustn - (1.0 - rust_amount)) * 3.0, 0, 1)
    grain = fbm((h, w), 90, 3, seed + 8)
    steel = np.full((h, w, 3), np.array([0.30, 0.31, 0.33]), np.float32) * (0.8 + grain * 0.35)[..., None]
    paint_col = np.full((h, w, 3), np.array(paint, np.float32), np.float32) * (0.75 + grain * 0.4)[..., None]
    base = mix(steel, paint_col, (1.0 - patch)[..., None])
    rust_cols = np.array([0.42, 0.17, 0.06], np.float32)
    rust_cols2 = np.array([0.26, 0.11, 0.05], np.float32)
    rust = mix(np.full_like(base, rust_cols), np.full_like(base, rust_cols2), grain[..., None])
    base = mix(base, rust, patch[..., None])
    height = grain * 0.18 + patch * 0.35 * (0.4 + rustn)
    rough = 0.55 + patch * 0.35 + grain * 0.06
    metal = (1.0 - patch * 0.85).astype(np.float32)
    ao = 0.80 + (1.0 - patch) * 0.18
    return base, height_to_normal(height, 2.0), np.stack([ao, rough, metal], -1)


def mat_peeling_paint(seed=7, color=(0.42, 0.40, 0.33)):
    h, w = SIZE, SIZE
    f1, f2, cid = worley((h, w), 13, seed)
    edge = np.clip((f2 - f1) * 3.0, 0, 1)
    grain = fbm((h, w), 70, 4, seed + 2)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32) * (0.8 + grain * 0.35)[..., None]
    peeled = np.clip((edge - 0.55) * 3.2, 0, 1)
    under = np.full_like(base, np.array([0.30, 0.24, 0.19])) * (0.7 + grain * 0.5)[..., None]
    base = mix(base, under, peeled[..., None])
    height = grain * 0.12 - peeled * 0.25
    rough = 0.62 + peeled * 0.22
    ao = 0.84 + (1 - peeled) * 0.16
    return base, height_to_normal(height, 1.8), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_wood(seed=8, planks=6, color=(0.30, 0.21, 0.13)):
    h, w = SIZE, SIZE
    grain = fbm((h, w), 120, 5, seed)
    streak = np.zeros((h, w), np.float32)
    for p in range(planks):
        y0 = int(p * h / planks)
        y1 = int((p + 1) * h / planks)
        if y1 - y0 < 2:
            continue
        g = np.linspace(0, 1, y1 - y0, dtype=np.float32)
        tone = 0.72 + 0.4 * np.sin((p * 2.1 + 0.6))
        streak[y0:y1] = tone * (0.85 + grain[y0:y1] * 0.3)
        streak[y0:y1] *= (0.55 + 0.75 * g)[:, None]
    knot = fbm((h, w), 6, 3, seed + 5)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32)
    base *= np.clip(streak, 0.2, 1.6)[..., None]
    seam = np.zeros((h, w), np.float32)
    for p in range(1, planks):
        seam[int(p * h / planks) - 1:int(p * h / planks) + 1] = 1.0
    base *= (1.0 - seam * 0.6)[..., None]
    base *= (0.82 + grain * 0.35)[..., None]
    height = streak * 0.3 + grain * 0.2 - seam * 0.6
    rough = 0.74 + grain * 0.16
    ao = 0.78 + (1 - seam) * 0.2
    return base, height_to_normal(height, 2.4), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_corrugated(seed=9, color=(0.26, 0.27, 0.26)):
    h, w = SIZE, SIZE
    x = np.arange(w, dtype=np.float32)
    wave = (np.sin(x / w * np.pi * 2 * 16) * 0.5 + 0.5)
    wave = np.tile(wave, (h, 1)).astype(np.float32)
    wave = box_blur(wave, 1)
    rustn = fbm((h, w), 5, 5, seed)
    grain = fbm((h, w), 90, 3, seed + 3)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32) * (0.72 + wave * 0.5)[..., None]
    rust = np.array([0.40, 0.17, 0.07], np.float32)
    base = mix(base, np.full_like(base, rust), np.clip((rustn - 0.45) * 1.8, 0, 1)[..., None])
    height = wave * 0.8 + grain * 0.08
    rough = 0.55 + grain * 0.12 + np.clip((rustn - 0.45) * 1.8, 0, 1) * 0.3
    metal = (0.9 - np.clip((rustn - 0.45) * 1.8, 0, 1) * 0.7).astype(np.float32)
    ao = 0.70 + wave * 0.3
    return base, height_to_normal(height, 3.0), np.stack([ao, rough, metal], -1)


def mat_fabric(seed=10, color=(0.22, 0.24, 0.22)):
    h, w = SIZE, SIZE
    weave = (np.sin(np.arange(w, dtype=np.float32)[None, :] * 1.6) *
             np.sin(np.arange(h, dtype=np.float32)[:, None] * 1.6)) * 0.5 + 0.5
    dirt = fbm((h, w), 6, 4, seed)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32)
    base *= (0.78 + weave * 0.22)[..., None]
    base *= (0.68 + dirt * 0.55)[..., None]
    height = weave * 0.35 + dirt * 0.12
    rough = 0.93 - weave * 0.05
    ao = 0.80 + dirt * 0.2
    return base, height_to_normal(height, 1.6), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_metal_painted(seed=11, color=(0.30, 0.33, 0.31)):
    h, w = SIZE, SIZE
    grain = fbm((h, w), 110, 4, seed)
    scratch = fbm((h, w), 200, 3, seed + 9)
    scratches = np.clip((scratch - 0.74) * 5.0, 0, 1)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32) * (0.8 + grain * 0.35)[..., None]
    base = mix(base, np.full_like(base, np.array([0.45, 0.45, 0.46])), scratches[..., None])
    height = grain * 0.12 + scratches * 0.06
    rough = 0.42 + grain * 0.12 + scratches * 0.2
    metal = (0.85 - scratches * 0.3).astype(np.float32)
    ao = 0.85 + grain * 0.15
    return base, height_to_normal(height, 1.5), np.stack([ao, rough, metal], -1)


def mat_glass_dirty(seed=12):
    h, w = SIZE, SIZE
    smear = fbm((h, w), 8, 4, seed)
    specks = fbm((h, w), 150, 3, seed + 2)
    dust = np.clip(smear * 0.8 + specks * 0.25, 0, 1)
    base = np.full((h, w, 3), np.array([0.22, 0.25, 0.26]), np.float32)
    base = mix(base, np.full_like(base, np.array([0.32, 0.30, 0.26])), dust[..., None])
    height = specks * 0.2
    rough = 0.12 + dust * 0.55
    metal = np.zeros_like(rough)
    ao = np.ones_like(rough)
    return base, height_to_normal(height, 1.2), np.stack([ao, rough, metal], -1)


def mat_tile(seed=13):
    h, w = SIZE, SIZE
    n = 8
    ts = h // n
    grout = np.zeros((h, w), np.float32)
    for r in range(n):
        for c in range(n):
            grout[r * ts:r * ts + 3, c * ts:c * ts + 3] = 1.0
            grout[r * ts + ts - 3:r * ts + ts, c * ts:c * ts + ts] = 1.0
    grout[:3, :] = 1.0
    grout[:, :3] = 1.0
    grout[-3:, :] = 1.0
    grout[:, -3:] = 1.0
    stain = fbm((h, w), 5, 4, seed)
    grain = fbm((h, w), 100, 3, seed + 5)
    base = np.full((h, w, 3), np.array([0.55, 0.56, 0.54]), np.float32)
    base *= (0.82 + grain * 0.3)[..., None]
    base = mix(base, np.full_like(base, np.array([0.30, 0.30, 0.28])), grout[..., None])
    base *= (0.72 + stain * 0.5)[..., None]
    height = (1 - grout) * 0.6 + grain * 0.06
    rough = 0.35 + stain * 0.3 + grout * 0.4
    ao = 0.72 + (1 - grout) * 0.25
    return base, height_to_normal(height, 2.2), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_bark(seed=14):
    h, w = SIZE, SIZE
    ridge = fbm((h, w), 14, 5, seed)
    fine = fbm((h, w), 120, 4, seed + 7)
    crack = np.clip((ridge - 0.48) * 3.0, 0, 1)
    base = np.full((h, w, 3), np.array([0.17, 0.13, 0.10]), np.float32)
    base *= (0.7 + fine * 0.5)[..., None]
    base *= (1.0 - crack * 0.5)[..., None]
    height = ridge * 0.7 + fine * 0.2 - crack * 0.4
    rough = np.full_like(height, 0.93)
    ao = 0.66 + ridge * 0.34
    return base, height_to_normal(height, 3.0), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_foliage(seed=15):
    """Leafy canopy card - alpha cutout."""
    h, w = SIZE, SIZE
    f1, f2, cid = worley((h, w), 16, seed)
    leaf = np.clip(1.0 - f1 * 2.6, 0, 1)
    fine = fbm((h, w), 90, 4, seed + 3)
    green = np.array([0.10, 0.20, 0.055], np.float32)
    green2 = np.array([0.22, 0.30, 0.08], np.float32)
    base = mix(np.full((h, w, 3), green), np.full((h, w, 3), green2), fine[..., None])
    alpha = np.clip(leaf * 1.4 - 0.15, 0, 1)
    base *= (0.75 + fine * 0.5)[..., None]
    height = leaf * 0.6 + fine * 0.3
    rough = np.full_like(height, 0.82)
    ao = 0.75 + leaf * 0.25
    return base, height_to_normal(height, 2.0), np.stack([ao, rough, np.zeros_like(rough)], -1), alpha


def mat_road_marking(seed=16):
    h, w = SIZE, SIZE
    asphalt = mat_asphalt(seed + 40)
    base = asphalt[0].copy()
    height = asphalt[1]
    orm = asphalt[2].copy()
    # dashed centre line
    line = np.zeros((h, w), np.float32)
    x0, x1 = int(w * 0.46), int(w * 0.54)
    for i in range(0, h, 64):
        line[i:i + 38, x0:x1] = 1.0
    wear = fbm((h, w), 20, 4, seed)
    line = np.clip(line - wear * 0.9, 0, 1)
    base = mix(base, np.full_like(base, np.array([0.62, 0.60, 0.50])), line[..., None])
    orm[..., 1] = np.clip(orm[..., 1] + line * 0.15, 0, 1)
    return base, height, orm


def mat_blood(seed=17):
    h, w = SIZE, SIZE
    f1, f2, _ = worley((h, w), 6, seed)
    splat = np.clip(1.0 - f1 * 1.6, 0, 1)
    detail = fbm((h, w), 40, 4, seed + 4)
    base = np.full((h, w, 3), np.array([0.16, 0.012, 0.010]), np.float32)
    base *= (0.6 + detail * 0.8)[..., None]
    alpha = np.clip(splat * 1.3, 0, 1)
    height = splat * 0.3
    rough = 0.35 + detail * 0.2
    return base, height_to_normal(height, 1.5), np.stack([np.ones_like(rough), rough, np.zeros_like(rough)], -1), alpha


def mat_metal_grate(seed=18):
    h, w = SIZE, SIZE
    cells = 12
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    hole = ((xx % (w // cells)) < (w // cells - 6)) & ((yy % (h // cells)) < (h // cells - 6))
    base = np.full((h, w, 3), np.array([0.16, 0.17, 0.17]), np.float32)
    base = mix(base, np.full_like(base, np.array([0.02, 0.02, 0.02])), hole.astype(np.float32)[..., None])
    grain = fbm((h, w), 110, 3, seed)
    base *= (0.8 + grain * 0.4)[..., None]
    height = (1 - hole.astype(np.float32)) * 0.7
    rough = 0.5 + grain * 0.2
    ao = np.where(hole, 0.35, 0.95).astype(np.float32)
    return base, height_to_normal(height, 2.4), np.stack([ao, rough, np.full_like(rough, 0.7)], -1)


def mat_plaster(seed=19, color=(0.46, 0.44, 0.40)):
    h, w = SIZE, SIZE
    fine = fbm((h, w), 90, 5, seed)
    patch = fbm((h, w), 6, 4, seed + 6)
    crack = fbm((h, w), 220, 3, seed + 12)
    cracks = np.clip((crack - 0.76) * 5.0, 0, 1)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32)
    base *= (0.86 + fine * 0.24)[..., None]
    base *= (0.78 + patch * 0.4)[..., None]
    base *= (1.0 - cracks * 0.4)[..., None]
    height = fine * 0.25 - cracks * 0.35
    rough = 0.9 + fine * 0.08
    ao = 0.84 + patch * 0.16 - cracks * 0.2
    return base, height_to_normal(height, 2.0), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_skin(seed=20, color=(0.52, 0.40, 0.34), rot=0.0):
    h, w = SIZE, SIZE
    pores = fbm((h, w), 180, 4, seed)
    blotch = fbm((h, w), 9, 4, seed + 3)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32)
    base *= (0.88 + pores * 0.2)[..., None]
    base *= (0.85 + blotch * 0.28)[..., None]
    height = pores * 0.2
    rough = 0.62 + blotch * 0.15
    ao = 0.9 + pores * 0.1
    return base, height_to_normal(height, 1.2), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_leather(seed=21, color=(0.19, 0.14, 0.10)):
    h, w = SIZE, SIZE
    f1, f2, _ = worley((h, w), 26, seed)
    grain = fbm((h, w), 120, 4, seed + 2)
    base = np.full((h, w, 3), np.array(color, np.float32), np.float32)
    base *= (0.78 + grain * 0.4)[..., None]
    base *= (1.0 - np.clip(1.0 - f1 * 2.2, 0, 1) * 0.35)[..., None]
    height = grain * 0.3 + f1 * 0.1
    rough = 0.70 + grain * 0.14
    ao = 0.84 + grain * 0.16
    return base, height_to_normal(height, 1.8), np.stack([ao, rough, np.zeros_like(rough)], -1)


def mat_gunmetal(seed=22):
    h, w = SIZE, SIZE
    grain = fbm((h, w), 200, 3, seed)
    scratch = fbm((h, w), 260, 3, seed + 8)
    sc = np.clip((scratch - 0.80) * 6.0, 0, 1)
    base = np.full((h, w, 3), np.array([0.10, 0.105, 0.115]), np.float32)
    base *= (0.82 + grain * 0.32)[..., None]
    base += (sc * 0.12)[..., None]
    height = grain * 0.12 + sc * 0.05
    rough = 0.34 + grain * 0.12 + sc * 0.15
    metal = np.full_like(height, 0.95)
    ao = 0.88 + grain * 0.12
    return base, height_to_normal(height, 1.4), np.stack([ao, rough, metal], -1)


def mat_wood_dark(seed=23):
    return mat_wood(seed + 70, planks=4, color=(0.16, 0.11, 0.07))


def mat_tarmac_cracked(seed=24):
    h, w = SIZE, SIZE
    base, nrm, orm = mat_asphalt(seed)
    f1, f2, _ = worley((h, w), 9, seed + 5)
    crack = np.clip(1.0 - f2 * 2.2, 0, 1) ** 1.4
    base *= (1.0 - crack * 0.55)[..., None]
    orm[..., 0] -= crack * 0.35
    return base, nrm, orm


# ---------------------------------------------------------------------------
def build_mipmaps(rgb):
    """Generate a mip chain by simple box filtering."""
    mips = [rgb]
    cur = rgb
    while cur.shape[0] > 1 or cur.shape[1] > 1:
        h, w = cur.shape[:2]
        nh, nw = max(1, h // 2), max(1, w // 2)
        if h == 1 and w == 1:
            break
        src = cur[:nh * 2, :nw * 2] if h >= 2 and w >= 2 else cur
        if h == 1:
            cur = cur[:, :nw]
        elif w == 1:
            cur = cur[:nh, :]
        else:
            acc = (src[0::2, 0::2].astype(np.uint16) + src[0::2, 1::2].astype(np.uint16) +
                   src[1::2, 0::2].astype(np.uint16) + src[1::2, 1::2].astype(np.uint16))
            cur = (acc // 4).astype(rgb.dtype)
        mips.append(cur)
    return mips


def write_texture(path, albedo, normal, orm, alpha=None, albedo_size=512, detail_size=256):
    """Write one material set: albedo (RGBA8) + normal (RGB8) + ORM (RGB8)."""
    def resize(arr, size):
        h, w = arr.shape[:2]
        if h == size and w == size:
            return arr
        yi = (np.arange(size) * h / size).astype(np.int32)
        xi = (np.arange(size) * w / size).astype(np.int32)
        return arr[yi[:, None], xi[None, :]]

    def to_rgba(arr):
        if arr.shape[-1] == 4:
            return arr
        a = np.full(arr.shape[:-1] + (1,), 255, np.uint8)
        return np.concatenate([arr, a], axis=-1)

    def to_rgb(arr):
        if arr.shape[-1] == 3:
            return arr
        return arr[..., :3]

    a = to_rgba(to_u8(srgb_to_linear(resize(albedo, albedo_size))))
    if alpha is not None:
        a[..., 3] = to_u8(resize(alpha, albedo_size))[..., 0]
    n = to_u8(resize(normal, detail_size))
    o = to_u8(resize(orm, detail_size))

    def pack(name, arr, fmt):
        mips = build_mipmaps(arr)
        buf = bytearray()
        for m in mips:
            buf += m.tobytes()
        hdr = bytearray()
        hdr += (0x31465441).to_bytes(4, "little")
        hdr += (1).to_bytes(2, "little")
        hdr += fmt.to_bytes(2, "little")
        hdr += arr.shape[1].to_bytes(4, "little")
        hdr += arr.shape[0].to_bytes(4, "little")
        hdr += len(mips).to_bytes(4, "little")
        hdr += len(buf).to_bytes(8, "little")
        with open(os.path.join(OUT_DIR, name + ".aft"), "wb") as f:
            f.write(bytes(hdr) + bytes(buf))

    pack(path + "_a", a, 0)   # RGBA8
    pack(path + "_n", n, 1)   # RGB8
    pack(path + "_o", o, 1)   # RGB8


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    sets = [
        ("concrete", mat_concrete(1)),
        ("concrete_dark", mat_concrete(31, tint=(0.34, 0.34, 0.33), cracks=True, grime=0.75)),
        ("brick", mat_brick(2)),
        ("asphalt", mat_asphalt(3)),
        ("tarmac_cracked", mat_tarmac_cracked(24)),
        ("road_marking", mat_road_marking(16)),
        ("dirt", mat_dirt(4)),
        ("grass", mat_grass(5)),
        ("rusted_metal", mat_rusted_metal(6)),
        ("rusted_metal_heavy", mat_rusted_metal(36, rust_amount=0.85)),
        ("painted_metal", mat_metal_painted(11, (0.30, 0.33, 0.31))),
        ("painted_metal_green", mat_metal_painted(37, (0.18, 0.24, 0.19))),
        ("peeling_paint", mat_peeling_paint(7)),
        ("wood", mat_wood(8)),
        ("wood_dark", mat_wood_dark(23)),
        ("corrugated", mat_corrugated(9)),
        ("fabric", mat_fabric(10)),
        ("fabric_red", mat_fabric(38, (0.30, 0.10, 0.09))),
        ("glass_dirty", mat_glass_dirty(12)),
        ("tile", mat_tile(13)),
        ("bark", mat_bark(14)),
        ("metal_grate", mat_metal_grate(18)),
        ("plaster", mat_plaster(19)),
        ("plaster_dirty", mat_plaster(39, (0.38, 0.36, 0.33))),
        ("skin", mat_skin(20)),
        ("skin_pale", mat_skin(40, (0.62, 0.58, 0.55))),
        ("skin_rotting", mat_skin(41, (0.34, 0.33, 0.24))),
        ("leather", mat_leather(21)),
        ("gunmetal", mat_gunmetal(22)),
    ]
    for name, (alb, nrm, orm) in sets:
        write_texture(name, alb, nrm, orm)
        print("texture:", name)

    # alpha-cutout sets
    for name, (alb, nrm, orm, alpha) in [
        ("foliage", mat_foliage(15)),
        ("blood", mat_blood(17)),
    ]:
        write_texture(name, alb, nrm, orm, alpha)
        print("texture:", name, "(alpha)")

    print("textures written to", os.path.abspath(OUT_DIR))


if __name__ == "__main__":
    main()
