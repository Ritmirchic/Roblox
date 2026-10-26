#!/usr/bin/env python3
"""Generate original tileable PBR texture sets with Pillow.

For every surface material we emit:
  <name>_albedo.png   - base color with multi-octave noise + surface detail
  <name>_normal.png   - tangent-space normal map (Sobel of height field)
  <name>_rough.png    - roughness mask (8-bit grayscale)
All textures are 512x512, fully original, no third-party assets.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "textures")
OUT = os.path.normpath(OUT)
SIZE = 512


def value_noise(rng, grid):
    """Tileable value noise grid -> bicubic-upsampled float field."""
    small = Image.new("L", (grid, grid))
    small.putdata([rng.randrange(256) for _ in range(grid * grid)])
    small = small.resize((SIZE, SIZE), Image.BICUBIC)
    return [p / 255.0 for p in small.getdata()]


def fbm(rng, octaves=5):
    field = [0.0] * (SIZE * SIZE)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        grid = 4 * (2 ** o)
        n = value_noise(rng, grid)
        for i in range(len(field)):
            field[i] += n[i] * amp
        total += amp
        amp *= 0.5
    return [v / total for v in field]


def blend(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def normal_from_height(height, strength=2.5):
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            l = height[y * SIZE + (x - 1) % SIZE]
            r = height[y * SIZE + (x + 1) % SIZE]
            u = height[((y - 1) % SIZE) * SIZE + x]
            d = height[((y + 1) % SIZE) * SIZE + x]
            dx = (r - l) * strength
            dy = (d - u) * strength
            nz = 1.0
            inv = 1.0 / math.sqrt(dx * dx + dy * dy + nz * nz)
            px[x, y] = (
                int((dx * inv * 0.5 + 0.5) * 255),
                int((-dy * inv * 0.5 + 0.5) * 255),
                int((nz * inv * 0.5 + 0.5) * 255),
            )
    return img


def write_set(name, albedo_px, height_px, rough_px):
    alb = Image.new("RGB", (SIZE, SIZE))
    albedo_px = [tuple(max(0, min(255, int(round(c)))) for c in px)
                 for px in albedo_px]
    alb.putdata(albedo_px)
    rgh = Image.new("L", (SIZE, SIZE))
    rgh.putdata([max(0, min(255, int(v * 255))) for v in rough_px])
    nrm = normal_from_height(height_px)
    alb.save(os.path.join(OUT, f"{name}_albedo.png"), optimize=True)
    nrm.save(os.path.join(OUT, f"{name}_normal.png"), optimize=True)
    rgh.save(os.path.join(OUT, f"{name}_rough.png"), optimize=True)
    print("wrote", name)


def gen_concrete(rng):
    h = fbm(rng)
    blotch = fbm(rng, 3)
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i]
        base = blend((108, 106, 101), (70, 69, 66), blotch[i])
        crack = 1.0 if rng.random() > 0.9985 else 0.0
        col = tuple(max(0, c - int((1 - v) * 40) - crack * 30) for c in base)
        albedo.append(col)
        rough.append(0.75 + 0.2 * v)
    return albedo, h, rough


def gen_asphalt(rng):
    h = fbm(rng, 6)
    grain = [rng.random() for _ in range(SIZE * SIZE)]
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i] * 0.7 + grain[i] * 0.3
        base = blend((38, 40, 42), (62, 60, 58), v)
        albedo.append(base)
        rough.append(0.82 + 0.15 * grain[i])
    return albedo, h, rough


def gen_brick(rng):
    h = fbm(rng, 4)
    albedo, rough, height = [], [], []
    bh, bw = 32, 64
    for y in range(SIZE):
        for x in range(SIZE):
            row = y // bh
            off = (row % 2) * (bw // 2)
            mx = (x + off) % bw
            my = y % bh
            mortar = mx < 3 or my < 3
            i = y * SIZE + x
            if mortar:
                albedo.append((150, 146, 138))
                height.append(0.25 + 0.1 * h[i])
                rough.append(0.9)
            else:
                tone = h[i]
                col = blend((112, 58, 48), (158, 92, 72), tone)
                if rng.random() > 0.995:
                    col = tuple(c // 2 for c in col)
                albedo.append(col)
                height.append(0.7 + 0.25 * tone)
                rough.append(0.78 + 0.15 * tone)
    return albedo, height, rough


def gen_rust_metal(rng):
    h = fbm(rng, 5)
    patches = fbm(rng, 3)
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        rust = max(0.0, min(1.0, (patches[i] - 0.45) * 2.2))
        metal = blend((96, 84, 74), (52, 48, 45), h[i])
        rust_col = blend((122, 62, 32), (70, 38, 22), h[i])
        col = blend(metal, rust_col, rust)
        scratch = 25 if rng.random() > 0.997 else 0
        albedo.append(tuple(min(255, c + scratch) for c in col))
        rough.append(0.45 + rust * 0.45)
    return albedo, h, rough


def gen_wood(rng):
    h = fbm(rng, 4)
    albedo, rough, height = [], [], []
    plank_w = 64
    for y in range(SIZE):
        for x in range(SIZE):
            i = y * SIZE + x
            grain = math.sin((x % plank_w) * 0.35 + h[i] * 9.0) * 0.5 + 0.5
            seam = 1.0 if (x % plank_w) < 2 else 0.0
            base = blend((96, 70, 46), (138, 104, 70), grain * 0.6 + h[i] * 0.4)
            base = tuple(max(0, c - seam * 50) for c in base)
            albedo.append(base)
            height.append((0.6 + 0.3 * grain) * (1 - seam * 0.5))
            rough.append(0.7 + 0.2 * grain)
    return albedo, height, rough


def gen_dirt(rng):
    h = fbm(rng, 6)
    pebble = [rng.random() for _ in range(SIZE * SIZE)]
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i] * 0.75 + pebble[i] * 0.25
        base = blend((62, 52, 40), (96, 82, 62), v)
        if pebble[i] > 0.992:
            base = tuple(min(255, c + 25) for c in base)
        albedo.append(base)
        rough.append(0.92)
    return albedo, h, rough


def gen_metal_panel(rng):
    h = fbm(rng, 3)
    albedo, rough, height = [], [], []
    for y in range(SIZE):
        for x in range(SIZE):
            i = y * SIZE + x
            rivet = (x % 128 < 6 and y % 128 < 6)
            v = h[i]
            base = blend((70, 76, 82), (110, 116, 122), v)
            if rivet:
                base = tuple(c + 18 for c in base)
            albedo.append(base)
            height.append(0.65 + 0.25 * v + rivet * 0.1)
            rough.append(0.42 + 0.2 * v)
    return albedo, height, rough


def gen_fabric(rng):
    h = fbm(rng, 4)
    albedo, rough = [], []
    for y in range(SIZE):
        for x in range(SIZE):
            i = y * SIZE + x
            weave = 12 if (x % 4 == 0 or y % 4 == 0) else 0
            base = blend((58, 62, 54), (86, 90, 78), h[i])
            albedo.append(tuple(c + weave for c in base))
            rough.append(0.88 + 0.1 * h[i])
    return albedo, h, rough


def gen_moss(rng):
    h = fbm(rng, 5)
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i]
        base = blend((42, 54, 30), (86, 102, 58), v)
        if rng.random() > 0.99:
            base = tuple(c + 15 for c in base)
        albedo.append(base)
        rough.append(0.95)
    return albedo, h, rough


def gen_sand(rng):
    h = fbm(rng, 6)
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i]
        base = blend((120, 96, 70), (170, 142, 104), v)
        albedo.append(base)
        rough.append(0.9)
    return albedo, h, rough


def gen_scorched(rng):
    h = fbm(rng, 5)
    crack_field = fbm(rng, 3)
    albedo, rough = [], []
    for i in range(SIZE * SIZE):
        v = h[i]
        base = blend((26, 22, 22), (58, 40, 34), v)
        if crack_field[i] > 0.72:
            base = tuple(c // 3 for c in base)
        albedo.append(base)
        rough.append(0.85 + 0.12 * v)
    return albedo, h, rough


GENERATORS = {
    "concrete": gen_concrete,
    "asphalt": gen_asphalt,
    "brick": gen_brick,
    "rust_metal": gen_rust_metal,
    "wood": gen_wood,
    "dirt": gen_dirt,
    "metal_panel": gen_metal_panel,
    "fabric": gen_fabric,
    "moss": gen_moss,
    "sand": gen_sand,
    "scorched": gen_scorched,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in GENERATORS.items():
        rng = random.Random(0xA0F + hash(name) % 10000)
        albedo, height, rough = fn(rng)
        write_set(name, albedo, height, rough)


if __name__ == "__main__":
    main()
