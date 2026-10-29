#!/usr/bin/env python3
"""
Generates src/textures.h : every runtime texture baked into the executable.
 - 42 tileable material textures (128x128)
 - sky panorama (1024x512)
 - particle/sprite atlas (256x256, 4x4 cells)
 - two monospace font atlases (DejaVuSansMono)
All original and procedurally generated.  Vectorised with numpy.
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "textures.h")
TS = 96


def clamp_u8(a):
    return np.clip(a, 0, 255).astype(np.uint8)


def vnoise(size, freq, seed):
    rng = np.random.RandomState(seed)
    gw = max(1, int(freq))
    grid = rng.rand(gw, gw).astype(np.float32)
    ys = np.linspace(0, gw, size, endpoint=False, dtype=np.float32)
    xs = np.linspace(0, gw, size, endpoint=False, dtype=np.float32)
    x0 = xs.astype(int) % gw
    y0 = ys.astype(int) % gw
    x1 = (x0 + 1) % gw
    y1 = (y0 + 1) % gw
    tx = xs - xs.astype(int)
    ty = ys - ys.astype(int)
    tx = tx * tx * (3 - 2 * tx)
    ty = ty * ty * (3 - 2 * ty)
    a = grid[np.ix_(y0, x0)] * (1 - tx)[None, :] + grid[np.ix_(y0, x1)] * tx[None, :]
    b = grid[np.ix_(y1, x0)] * (1 - tx)[None, :] + grid[np.ix_(y1, x1)] * tx[None, :]
    return (a * (1 - ty)[:, None] + b * ty[:, None]).astype(np.float32)


def fbm(size, freq, octaves, seed):
    acc = np.zeros((size, size), np.float32)
    amp, norm = 0.5, 0.0
    for o in range(octaves):
        acc += vnoise(size, freq * (2 ** o), seed + o * 131) * amp
        norm += amp
        amp *= 0.5
    return acc / norm


def rgb(r, g, b):
    out = np.zeros((TS, TS, 3), np.float32)
    out[..., 0] = r
    out[..., 1] = g
    out[..., 2] = b
    return out


def shade(base, n, amount):
    k = (n - 0.5) * amount
    return rgb(base[0] + k, base[1] + k, base[2] + k)


def blur(img, r=1):
    out = img.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out += np.roll(np.roll(img, dy, 0), dx, 1)
    return out / ((2 * r + 1) ** 2)


# ---------------------------------------------------------------- materials
def t_concrete(seed=1, dirt=0.0):
    n1 = fbm(TS, 8, 5, seed)
    n2 = fbm(TS, 32, 2, seed + 7)
    v = n1 * 0.7 + n2 * 0.3
    c = 128 + (v - 0.5) * 55
    if dirt > 0:
        m = fbm(TS, 5, 4, seed + 30)
        c = c - np.maximum(0, m - 0.45) * dirt * 120 - dirt * 6
    c = c + (n2 > 0.86) * 18
    return rgb(c, c * 0.99, c * 0.95)


def t_brick(seed=2, base=(150, 74, 58), mortar=(185, 180, 170), bw=32, bh=16):
    yy, xx = np.mgrid[0:TS, 0:TS]
    row = yy // bh
    off = (row % 2) * (bw // 2)
    lx = (xx + off) % bw
    ly = yy % bh
    is_mortar = (ly < 2) | (lx < 2)
    rr = np.random.RandomState(seed)
    brickv = rr.rand(TS // bh + 2, 8).astype(np.float32)
    bx = ((xx + off) // bw) % 8
    rv = brickv[row % brickv.shape[0], bx]
    jitter = (rv - 0.5) * 34
    n = fbm(TS, 6, 4, seed)
    k = (n - 0.5) * 30 - 6
    c = np.zeros((TS, TS, 3), np.float32)
    c[..., 0] = base[0] + jitter + k
    c[..., 1] = base[1] + jitter * 0.7 + k
    c[..., 2] = base[2] + jitter * 0.6 + k
    edge = (ly < 3) | (lx < 3)
    c[edge] *= 0.8
    for i in range(3):
        c[..., i] = np.where(is_mortar, mortar[i], c[..., i])
    return c


def t_wood(seed=5, dark=False, plank=False):
    base = (108, 78, 52) if dark else (150, 112, 70)
    n = fbm(TS, 4, 4, seed)
    n2 = fbm(TS, 24, 2, seed + 3)
    yy, xx = np.mgrid[0:TS, 0:TS]
    g = np.sin((yy * 0.9 + n * 22) * 0.55) * 0.5 + 0.5
    c = shade(base, g * 0.6 + n2 * 0.4, 42)
    if plank:
        py = yy % 32
        c[py < 2] *= 0.55
        c[np.abs(py - 16) < 1] *= 0.85
    return c


def t_plaster(seed=4):
    n = fbm(TS, 7, 4, seed)
    n2 = fbm(TS, 40, 1, seed + 2)
    v = 196 + (n - 0.5) * 18 + (n2 - 0.5) * 8
    return rgb(v, v * 0.985, v * 0.94)


def t_metal(seed=8, rust=0.0, color=(150, 152, 158)):
    n = fbm(TS, 10, 4, seed)
    n2 = fbm(TS, 30, 2, seed + 1)
    scr = fbm(TS, 2, 2, seed + 9)
    yy, xx = np.mgrid[0:TS, 0:TS]
    c = shade(color, n * 0.4 + n2 * 0.3 + 0.3, 30)
    st = np.sin(yy * 3.4 + scr * 6) * 3
    c = c + st[..., None]
    if rust > 0:
        r = fbm(TS, 6, 4, seed + 77)
        rr = np.clip((r - (1.0 - rust)) / max(0.01, rust), 0, 1)[..., None]
        rustc = np.array([128, 72, 42], np.float32)
        c = c * (1 - rr) + rustc * rr
    return c


def t_glass(seed=11, dirty=0.0):
    yy, xx = np.mgrid[0:TS, 0:TS]
    g = np.sin((xx + yy) * 0.12) * 6
    c = rgb(170 + g, 205 + g, 220 + g)
    if dirty > 0:
        n = fbm(TS, 5, 4, seed + 5)
        d = np.maximum(0, n - 0.4) * dirty * 90
        c = c - d[..., None] * np.array([0.2, 0.1, -0.1], np.float32)
    return c


def t_asphalt(seed=13):
    n = fbm(TS, 12, 4, seed)
    n2 = fbm(TS, 48, 2, seed + 3)
    v = 62 + (n - 0.5) * 26 + (n2 - 0.5) * 20 + (n2 > 0.9) * 30
    return rgb(v, v, v * 1.04)


def t_soil(seed=14, sandy=False, grassy=False):
    n = fbm(TS, 10, 5, seed)
    n2 = fbm(TS, 40, 2, seed + 1)
    v = n * 0.6 + n2 * 0.4
    if sandy:
        c = rgb(160 + v * 55, 140 + v * 50, 100 + v * 40)
    elif grassy:
        c = rgb(44 + v * 40, 88 + v * 55, 34 + v * 26)
    else:
        c = rgb(76 + v * 44, 60 + v * 32, 44 + v * 24)
    sp = (n2 > 0.88)[..., None] * np.array([18, 14, 10], np.float32)
    return c + sp


def t_stone(seed=16):
    n = fbm(TS, 6, 5, seed)
    n2 = fbm(TS, 26, 3, seed + 2)
    v = n * 0.65 + n2 * 0.35
    c = 96 + v * 88
    yy, xx = np.mgrid[0:TS, 0:TS]
    cr = np.abs(np.sin(xx * 0.22 + n * 7.0))
    c = c * np.where(cr < 0.06, 0.6, 1.0)
    return rgb(c, c * 0.99, c * 0.96)


def t_rebar(seed=17):
    c = t_concrete(seed, 0.15)
    yy, xx = np.mgrid[0:TS, 0:TS]
    mask = ((yy % 42 == 0) & (xx % 32 < 30)) | (xx % 64 == 0)
    c[mask] = np.array([118, 78, 54], np.float32)
    return c


def t_tile(seed=18, ceramic=False):
    yy, xx = np.mgrid[0:TS, 0:TS]
    cell = 32 if ceramic else 16
    lx, ly = xx % cell, yy % cell
    n = fbm(TS, 20, 3, seed)
    if ceramic:
        c = rgb(236 + n * 15, 238 + n * 15, 240 + n * 12)
    else:
        c = rgb(215 + n * 25, 218 + n * 25, 222 + n * 22)
    c[(lx < 2) | (ly < 2)] = np.array([190, 190, 185], np.float32)
    return c


def t_roof(seed=19):
    yy, xx = np.mgrid[0:TS, 0:TS]
    row = yy // 16
    off = (row % 2) * 8
    lx = (xx + off) % 16
    ly = yy % 16
    base = 92 + (row % 3) * 6
    c = rgb(base + 40, base + 12, base)
    c[ly > 12] *= 0.6
    c[lx < 1] *= 0.7
    rr = np.random.RandomState(seed)
    c = c + (rr.rand(TS, TS, 1).astype(np.float32) - 0.5) * 8
    return c


def t_leaves(seed=20):
    rr = np.random.RandomState(seed)
    v = rr.rand(TS, TS)
    c = np.zeros((TS, TS, 3), np.float32)
    c[v < 0.22] = (18, 44, 20)
    c[(v >= 0.22) & (v < 0.7)] = (38, 86, 32)
    c[v >= 0.7] = (62, 118, 44)
    return blur(c, 1)


def t_bark(seed=21):
    n = fbm(TS, 8, 4, seed)
    yy, xx = np.mgrid[0:TS, 0:TS]
    g = np.sin(xx * 1.4 + n * 9) * 0.5 + 0.5
    c = 58 + g * 46 + n * 14
    return rgb(c, c * 0.82, c * 0.66)


def t_fabric(seed=22):
    yy, xx = np.mgrid[0:TS, 0:TS]
    w = np.sin(xx * 1.6) * np.sin(yy * 1.6) * 10
    c = 92 + w
    return rgb(c, c * 0.85, c * 0.7)


def t_plastic(seed=23):
    n = fbm(TS, 16, 3, seed)
    v = 70 + n * 24
    return rgb(v, v * 1.02, v * 1.06)


def t_paint(color, seed=24):
    n = fbm(TS, 14, 4, seed)
    n2 = fbm(TS, 44, 2, seed + 5)
    k = (n - 0.5) * 18 + (n2 - 0.5) * 10
    return rgb(color[0] + k, color[1] + k, color[2] + k)


def t_container(color, seed=29):
    n = fbm(TS, 20, 3, seed)
    yy, xx = np.mgrid[0:TS, 0:TS]
    rib = np.sin(xx * 0.55) * 0.5 + 0.5
    k = (rib - 0.5) * 34 + (n - 0.5) * 12
    c = rgb(color[0] + k, color[1] + k, color[2] + k)
    c[np.abs(yy - 64) < 2] *= 0.8
    return c


def t_water(seed=35):
    n = fbm(TS, 4, 3, seed)
    yy, xx = np.mgrid[0:TS, 0:TS]
    w = np.sin(xx * 0.3 + yy * 0.15 + n * 6) * 0.5 + 0.5
    return rgb(24 + w * 22, 62 + w * 34, 86 + w * 40)


def t_neon(seed=36):
    yy, xx = np.mgrid[0:TS, 0:TS]
    v = 200 + np.sin(xx * 0.4) * 40
    return rgb(v, v * 0.25, v * 0.9)


def t_lamp(seed=37):
    n = fbm(TS, 30, 2, seed)
    v = 230 + n * 25
    return rgb(v, v * 0.97, v * 0.85)


def t_rubber(seed=38):
    n = fbm(TS, 26, 3, seed)
    v = 26 + n * 18
    return rgb(v, v, v * 1.02)


def t_gold(seed=40):
    n = fbm(TS, 18, 3, seed)
    k = (n - 0.5) * 40
    return rgb(210 + k, 172 + k, 62 + k)


def t_copper(seed=41):
    n = fbm(TS, 16, 3, seed)
    k = (n - 0.5) * 44
    return rgb(178 + k, 106 + k, 66 + k)


def make_sky():
    W, H = 768, 384
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    elev = (0.5 - yy / H) * math.pi
    az = (xx / W) * 2 * math.pi
    t = np.maximum(0.0, np.sin(elev))
    top = np.array([0.09, 0.25, 0.58], np.float32)
    hor = np.array([0.70, 0.79, 0.88], np.float32)
    f = (t ** 0.45)[..., None]
    c = hor + (top - hor) * f
    u = az
    v = elev * 3.0
    n = np.zeros_like(u)
    amp = 0.5
    for o in range(4):
        fr = (2 ** o) * 1.7
        n += amp * (np.sin(u * fr * 1.3 + 1.7 * o) * np.sin(v * fr + 2.1) *
                    np.cos(u * fr * 0.7 - v * fr * 0.9))
        amp *= 0.5
    n = n * 0.5 + 0.5
    cl = np.maximum(0, n - 0.52) * 2.4
    cl = cl * np.clip((elev - 0.02) * 4, 0, 1)
    cl = np.where(elev > 0.03, cl, 0)
    c = c + cl[..., None] * np.array([0.55, 0.56, 0.58], np.float32)
    c = np.where((elev < 0)[..., None], np.array([0.22, 0.23, 0.25], np.float32), c)
    return clamp_u8(c * 255)


def make_sprites():
    S = 64
    img = np.zeros((S * 4, S * 4, 4), np.uint8)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    cx, cy = 32.0, 32.0
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / 31.0

    def put(cell, rgbc, alpha):
        r, c = cell // 4, cell % 4
        a = np.clip(alpha, 0, 1) * 255
        img[r * S:(r + 1) * S, c * S:(c + 1) * S, 0] = rgbc[0]
        img[r * S:(r + 1) * S, c * S:(c + 1) * S, 1] = rgbc[1]
        img[r * S:(r + 1) * S, c * S:(c + 1) * S, 2] = rgbc[2]
        img[r * S:(r + 1) * S, c * S:(c + 1) * S, 3] = a.astype(np.uint8)

    put(0, (235, 235, 235), np.clip(1 - d, 0, 1) ** 2.2)                 # smoke
    put(1, (255, 255, 255), np.clip(1 - d * 4.0, 0, 1) ** 1.5)           # spark
    put(2, (255, 205, 110), np.clip(1 - d, 0, 1) ** 1.4)                 # fire
    sh = np.zeros((S, S), np.float32)
    sh[8:56, 26:40] = 0.8                                                # shard
    sh = blur(sh[..., None], 1)[..., 0]
    put(3, (225, 240, 255), sh)
    ring = np.clip(1 - np.abs(d - 0.85) * 5, 0, 1) ** 1.5
    put(4, (255, 255, 255), ring)                                        # shockwave ring
    glow = np.clip(1 - d, 0, 1) ** 2.5
    put(5, (255, 255, 255), glow)                                        # soft glow
    put(6, (255, 255, 255), np.clip(1 - d * 1.3, 0, 1) ** 6)             # small core
    put(7, (200, 200, 200), np.clip(1 - d, 0, 1) ** 0.7 * 0.55)          # dust soft
    put(8, (255, 240, 210), np.clip(1 - abs(d - 0.4) * 3, 0, 1) * 0.9)   # muzzle flash star
    return img


def make_font(path, size, cell_w, cell_h, cols=16, rows=6):
    img = Image.new("RGBA", (cell_w * cols, cell_h * rows), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype(path, size)
    except Exception:
        f = ImageFont.load_default()
    for i in range(95):
        ch = chr(32 + i)
        cx = (i % cols) * cell_w
        cy = (i // cols) * cell_h
        bbox = d.textbbox((0, 0), ch, font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        d.text((cx + (cell_w - w) // 2 - bbox[0], cy + (cell_h - h) // 2 - bbox[1]),
               ch, font=f, fill=(255, 255, 255, 255))
    a = np.array(img)[..., 3]
    out = np.dstack([np.full_like(a, 255), np.full_like(a, 255), np.full_like(a, 255), a])
    return out, img.width, img.height


def build_blob(texs, sky, sprites, fsmall, fbig):
    """Simple binary asset container, hex-encoded into one C string literal."""
    import struct
    out = bytearray()
    out += b"FRAC"
    out += struct.pack("<I", 1)
    out += struct.pack("<II", len(texs), TS)
    for arr in texs:
        a = clamp_u8(arr)
        out += a.astype(np.uint8).tobytes()
    h, w, _ = sky.shape
    out += struct.pack("<II", w, h) + sky.astype(np.uint8).tobytes()
    for img, name in ((sprites, "spr"), (fsmall, "font"), (fbig, "fontbig")):
        hh, ww, cc = img.shape
        out += struct.pack("<II", ww, hh) + img.astype(np.uint8).tobytes()
    return bytes(out)


def main():
    print("materials...")
    t = [None] * 42
    t[0] = t_concrete(1, 0.0)
    t[1] = t_concrete(1, 0.55)
    t[2] = t_brick(2, (176, 92, 72))
    t[3] = t_brick(3, (152, 68, 56))
    t[4] = t_plaster(4)
    t[5] = t_wood(5)
    t[6] = t_wood(6, dark=True)
    t[7] = t_wood(7, plank=True)
    t[8] = t_metal(8)
    t[9] = t_metal(9, 0.75)
    t[10] = t_metal(10, 0.0, (172, 176, 184))
    t[11] = t_glass(11, 0.0)
    t[12] = t_glass(12, 0.5)
    t[13] = t_asphalt(13)
    t[14] = t_soil(14)
    t[15] = t_soil(15, grassy=True)
    t[16] = t_stone(16)
    t[17] = t_rebar(17)
    t[18] = t_tile(18)
    t[19] = t_roof(19)
    t[20] = t_leaves(20)
    t[21] = t_bark(21)
    t[22] = t_fabric(22)
    t[23] = t_plastic(23)
    t[24] = t_paint((168, 42, 38), 24)
    t[25] = t_paint((196, 154, 34), 25)
    t[26] = t_paint((216, 218, 216), 26)
    t[27] = t_paint((44, 78, 138), 27)
    t[28] = t_paint((46, 104, 62), 28)
    t[29] = t_container((118, 34, 30), 29)
    t[30] = t_container((30, 62, 112), 30)
    t[31] = t_container((34, 92, 56), 31)
    t[32] = t_container((150, 112, 26), 32)
    t[33] = t_soil(33, sandy=True)
    t[34] = t_soil(34)
    t[35] = t_water(35)
    t[36] = t_neon(36)
    t[37] = t_lamp(37)
    t[38] = t_rubber(38)
    t[39] = t_tile(39, ceramic=True)
    t[40] = t_gold(40)
    t[41] = t_copper(41)
    for i in range(42):
        if t[i] is None:
            t[i] = t_concrete(i)

    print("sky / sprites / fonts...")
    sky = make_sky()
    sprites = make_sprites()
    fsmall, fsw, fsh = make_font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 20, 13, 26)
    fbig, fbw, fbh = make_font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
                               34, 24, 44)

    print("writing", OUT)
    blob = build_blob(t, sky, sprites, fsmall, fbig)
    hexs = blob.hex()
    with open(OUT, "w") as f:
        f.write("// Auto-generated by tools/gen_textures.py - do not edit.\n")
        f.write("#pragma once\n#include <cstdint>\n")
        f.write("// hex encoded binary asset blob (%d bytes raw)\n" % len(blob))
        f.write("static const int g_assetBlobSize = %d;\n" % len(blob))
        f.write("static const char* g_assetBlobHex =\n")
        CH = 4096
        for i in range(0, len(hexs), CH):
            f.write('"%s"\n' % hexs[i:i + CH])
        f.write(";\n")
    print("size:", os.path.getsize(OUT) // 1024, "KB raw:", len(blob) // 1024, "KB")


if __name__ == "__main__":
    main()
