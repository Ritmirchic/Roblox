#!/usr/bin/env python3
"""
Render the SPACE MINER UI skin kit: a coherent set of 9-slice panel/button/tab/
slider/card textures painted procedurally so the interface visibly belongs to
the game (chamfered armour plate, machined rails, lit edges) instead of generic
dark rounded rectangles.

Every texture is authored with an explicit 9-slice margin so the engine can
stretch it without distorting corners; card/frame art keeps its centre clear.

Run:  .venv/bin/python tools/render_ui_skin.py [--preview /tmp/ui_preview.png]
Outputs into assets/ui/.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ui"

# palette pulled from the in-game theme (ThemeHelper COL_*)
BG = (7, 14, 30)
BG_HI = (17, 30, 55)
PLATE = (16, 27, 48)
PLATE_HI = (27, 43, 72)
EDGE = (52, 178, 244)
EDGE_SOFT = (34, 96, 138)
GOLD = (255, 198, 68)
GREEN = (64, 232, 148)
RED = (255, 92, 104)
STEEL = (122, 150, 186)


def new(size, col=(0, 0, 0, 0)):
    return Image.new("RGBA", size, col)


def arr(im):
    return np.asarray(im, np.float32)


def put(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def chamfer_path(w, h, cut, r=0):
    """Chamfered rectangle (cut corners). r>0 additionally rounds with arcs."""
    cut = max(0, int(cut))
    pts = [(cut, 0), (w - cut, 0), (w, cut), (w, h - cut), (w - cut, h), (cut, h), (0, h - cut), (0, cut)]
    if r <= 0:
        return pts
    out, n = [], 8
    poly = pts + pts[:1]
    for i in range(len(poly) - 1):
        x0, y0 = poly[i]
        x1, y1 = poly[i + 1]
        seg = np.hypot(x1 - x0, y1 - y0)
        k = max(2, int(seg / r) * 1)
        for j in range(k):
            t = j / k
            out.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    out.append(poly[-1])
    _ = n
    return out


def mask_chamfer(size, cut, inset=0, blur=0.0):
    w, h = size
    m = new(size, (0, 0, 0, 0))
    d = ImageDraw.Draw(m)
    d.polygon(chamfer_path(w - 2 * inset, h - 2 * inset, cut), fill=(255, 255, 255, 255))
    m = m.convert("L")
    if blur > 0:
        m = m.filter(ImageFilter.GaussianBlur(blur))
    out = new(size, (0, 0, 0, 0))
    out.putalpha(m)
    return out.split()[3]


def brushed(w, h, seed=7, strength=16, lines=2600):
    rng = np.random.default_rng(seed)
    a = rng.normal(0, strength * 0.35, (h, w, 3)).astype(np.float32)
    img = Image.fromarray(np.clip(128 + a[..., 0], 0, 255).astype(np.uint8), "L")
    streak = np.asarray(img, np.float32) - 128.0
    fine = np.repeat(streak[:, ::3], 3, axis=1)[:, :w]
    out = a.copy()
    for c in range(3):
        out[..., c] += fine * (0.55 if c == 2 else 0.9 if c == 1 else 1.25)
    return np.clip(out, -60, 60)


def vgrad(w, h, top, bottom, curve=1.0):
    t = (np.arange(h, dtype=np.float32)[:, None] / max(h - 1, 1)) ** curve
    top = np.array(top, np.float32)[None, None, :]
    bot = np.array(bottom, np.float32)[None, None, :]
    g = top * (1.0 - t)[..., None] + bot * t[..., None]
    return np.repeat(g, w, axis=1)


def glow(im, px, gain=1.0):
    a = arr(im)
    g = np.zeros_like(a)
    for c in range(3):
        layer = Image.fromarray(np.clip(a[..., c] * (a[..., 3] / 255.0), 0, 255).astype(np.uint8), "L")
        layer = layer.filter(ImageFilter.GaussianBlur(px))
        g[..., c] = np.asarray(layer, np.float32) * gain
        g[..., 3] = np.maximum(g[..., 3], np.asarray(layer, np.float32) * gain)
    return put(g)


def add(base, layer, opacity=1.0):
    """Premultiplied source-over composite of `layer` onto `base` (in place)."""
    out = arr(base)
    l = arr(layer)
    a = (l[..., 3:4] / 255.0) * opacity
    alpha = out[..., 3:4] / 255.0
    na = a + alpha * (1.0 - a)
    rgb = (l[..., :3] * a + out[..., :3] * alpha * (1.0 - a)) / np.maximum(na, 1e-6)
    res = np.concatenate([np.nan_to_num(rgb), na * 255.0], axis=2)
    base.paste(put(res))
    return base


def edge_lines(size, cut, col, width=2, inset=0):
    w, h = size
    im = new(size)
    d = ImageDraw.Draw(im)
    pts = chamfer_path(w - 2 * inset, h - 2 * inset, cut)
    d.line(pts + pts[:1], fill=col + (255,), width=width, joint="curve")
    return im


def corner_brackets(size, cut, col, ln=16, wdt=3, inset=3, gain=1.0):
    w, h = size
    im = new(size)
    d = ImageDraw.Draw(im)
    c = cut
    segs = [
        ((c + inset, inset), (c + inset + ln, inset), (inset, c + inset), (inset, c + inset + ln)),
        ((w - c - inset, inset), (w - c - inset - ln, inset), (w - inset, c + inset), (w - inset, c + inset + ln)),
        ((c + inset, h - inset), (c + inset + ln, h - inset), (inset, h - c - inset), (inset, h - c - inset - ln)),
        ((w - c - inset, h - inset), (w - c - inset - ln, h - inset), (w - inset, h - c - inset), (w - inset, h - c - inset - ln)),
    ]
    for (x0, y0), (x1, y1), (x2, y2), (x3, y3) in segs:
        d.line([(x0, y0), (x1, y1)], fill=col + (int(255 * gain),), width=wdt)
        d.line([(x2, y2), (x3, y3)], fill=col + (int(255 * gain),), width=wdt)
    return im


def hatch(size, cut, col, step=7, width=1, band=None, angle=-1):
    w, h = size
    im = new(size)
    m = mask_chamfer(size, cut)
    d = ImageDraw.Draw(im)
    y0, y1 = (0, h) if band is None else band
    for i in range(-h, w + h, step):
        d.line([(i, y1), (i + (y1 - y0) * angle, y0)], fill=col + (70,), width=width)
    im.putalpha(Image.composite(im.split()[3], Image.new("L", size, 0), m))
    return im


def plate_body(size, cut, top=PLATE_HI, bottom=BG, seed=11, noise=14):
    w, h = size
    g = vgrad(w, h, top, bottom, 1.15)
    n = brushed(w, h, seed, noise)
    body = np.concatenate([np.clip(g + n, 0, 255), np.full((h, w, 1), 255.0, np.float32)], axis=2)
    im = put(body)
    m = mask_chamfer(size, cut)
    im.putalpha(m)
    return im


# ── the kit ─────────────────────────────────────────────────────────────────
def panel_main(size=(360, 360), cut=30):
    w, h = size
    im = plate_body(size, cut)
    # etched top rail with tick marks
    rail = new(size)
    dr = ImageDraw.Draw(rail)
    rh = 26
    dr.polygon([(0, 0), (w, 0), (w, rh - cut), (w - cut, rh), (cut, rh), (0, rh - cut)],
               fill=(255, 255, 255, 26))
    for x in range(cut + 6, w - cut - 4, 11):
        dr.line([(x, rh - 8), (x, rh - 1)], fill=(*EDGE, 120), width=1)
    dr.line([(0, rh - 1), (w, rh - 1)], fill=(0, 0, 0, 150), width=1)
    dr.line([(cut, rh - 3), (w - cut, rh - 3)], fill=(*EDGE, 70), width=1)
    for i, ln in enumerate((18, 10, 26, 6)):
        dr.line([(10, 6 + i * 4), (10 + ln, 6 + i * 4)], fill=(*EDGE, 190 - i * 30), width=2)
    add(im, rail)
    scan = new(size)
    dsc = ImageDraw.Draw(scan)
    for y in range(rh + 6, h - 6, 4):
        dsc.line([(cut // 2 + 2, y), (w - cut // 2 - 2, y)], fill=(255, 255, 255, 9), width=1)
    add(im, scan)
    add(im, hatch(size, cut, (190, 220, 255), step=9, width=1, band=(h - 25, h - 5)))
    # inner shadow at the top edge (thickness of the plate)
    sh = new(size)
    ds = ImageDraw.Draw(sh)
    for i in range(10):
        ds.line([(cut - i, i + 1), (w - cut + i, i + 1)], fill=(0, 0, 0, int(26 - i * 2.4)) if i < 13 else (0, 0, 0, 0), width=1)
    add(im, sh)
    add(im, edge_lines(size, cut, EDGE, 2, 0), 1.0)
    add(im, edge_lines(size, cut, (190, 240, 255), 1, 4), 0.40)
    add(im, corner_brackets(size, cut, (190, 240, 255), ln=20, wdt=3, inset=4, gain=1.0))
    g = glow(edge_lines(size, cut, EDGE, 2, 0), 6, 0.55)
    out = new(size)
    add(out, g)
    add(out, im)
    return out


def panel_inset(size=(280, 280), cut=16):
    w, h = size
    im = plate_body(size, cut, top=(10, 18, 33), bottom=(6, 11, 22), seed=31, noise=9)
    add(im, edge_lines(size, cut, (36, 92, 132), 1, 0), 0.9)
    add(im, edge_lines(size, cut, (0, 0, 0), 1, 1), 0.55)
    d = new(size)
    dd = ImageDraw.Draw(d)
    dd.line([(cut + 6, h - 6), (w - cut - 6, h - 6)], fill=(EDGE[0], EDGE[1], EDGE[2], 60), width=1)
    add(im, d)
    return im


def header_bar(size=(560, 62), cut=16):
    w, h = size
    im = new(size)
    a = np.concatenate([vgrad(w, h, (26, 46, 78), (9, 16, 30)), np.full((h, w, 1), 240.0, np.float32)], axis=2)
    base = put(a)
    base.putalpha(mask_chamfer(size, cut))
    add(im, base)
    d = ImageDraw.Draw(im)
    # left accent block + double rule to the right
    d.polygon([(0, h // 2 - 12), (10, h // 2 - 12), (16, h // 2), (10, h // 2 + 12), (0, h // 2 + 12)],
              fill=(*EDGE, 255))
    d.polygon([(20, h // 2 - 6), (26, h // 2 - 6), (30, h // 2), (26, h // 2 + 6), (20, h // 2 + 6)],
              fill=(*EDGE, 150))
    y = h - 6
    d.line([(cut + 40, y), (w - cut - 8, y)], fill=(*EDGE_SOFT, 210), width=2)
    d.line([(cut + 40, y - 3), (int(w * 0.42), y - 3)], fill=(*EDGE, 90), width=1)
    ha = hatch(size, cut, (200, 225, 255), step=9, width=1, band=(h - 20, h - 6))
    fade = np.tile(np.clip((np.arange(w) - w * 0.52) / (w * 0.30) * 110, 0, 110).astype(np.uint8), (h, 1))
    ha.putalpha(Image.composite(ha.split()[3], Image.new("L", size, 0), Image.fromarray(fade, "L")))
    add(im, ha)
    add(im, edge_lines(size, cut, EDGE, 2, 0), 0.85)
    return im


def button(state="normal", size=(280, 66), cut=14):
    w, h = size
    cols = {
        "normal": ((24, 44, 74), (11, 22, 40), EDGE, 0.75),
        "hover": ((38, 76, 120), (16, 34, 60), (170, 235, 255), 1.0),
        "pressed": ((58, 108, 150), (24, 46, 74), GOLD, 1.0),
        "disabled": ((18, 24, 34), (10, 14, 20), (60, 74, 92), 0.4),
    }[state]
    top, bot, accent, acc_a = cols
    im = plate_body(size, cut, top=top, bottom=bot, seed=17 if state != "pressed" else 23, noise=11)
    d = ImageDraw.Draw(im)
    # left accent wedge
    wd = 7 if state != "disabled" else 4
    d.polygon([(0, h // 2 - 9), (wd, h // 2 - 9), (wd + 7, h // 2), (wd, h // 2 + 9), (0, h // 2 + 9)],
              fill=(*accent, int(255 * acc_a)))
    # right hatch end-cap
    d.line([(w - cut - 26, h - 8), (w - cut - 8, h - 8)], fill=(*accent, int(120 * acc_a)), width=1)
    add(im, hatch(size, cut, accent, step=9, width=1, band=(h - 12, h)))
    # top bevel + bottom glow line
    d.line([(cut, 2), (w - cut, 2)], fill=(255, 255, 255, 26), width=1)
    d.line([(cut + 4, h - 3), (w - cut - 4, h - 3)], fill=(*accent, int(150 * acc_a)), width=2)
    if state == "pressed":
        sh = new(size)
        ImageDraw.Draw(sh).rectangle([0, 0, w, 7], fill=(0, 0, 0, 70))
        add(im, sh)
    add(im, edge_lines(size, cut, accent, 2 if state != "disabled" else 1, 0), acc_a)
    out = new(size)
    add(out, glow(edge_lines(size, cut, accent, 2, 0), 7, 0.5 * acc_a if state != "normal" else 0.3))
    add(out, im)
    return out


def tab(selected=False, size=(230, 56), cut=14):
    w, h = size
    if selected:
        im = plate_body(size, cut, top=(32, 62, 98), bottom=(14, 28, 48), seed=5, noise=12)
        accent = (200, 244, 255)
    else:
        im = plate_body(size, cut, top=(15, 26, 44), bottom=(8, 14, 26), seed=6, noise=8)
        accent = EDGE_SOFT
    add(im, edge_lines(size, cut, accent, 2 if selected else 1, 0), 1.0 if selected else 0.7)
    d = ImageDraw.Draw(im)
    if selected:
        d.line([(cut + 6, h - 4), (w - cut - 6, h - 4)], fill=(*EDGE, 255), width=3)
        d.line([(cut + 6, h - 9), (w - cut - 6, h - 9)], fill=(*EDGE, 90), width=1)
    return im


def slider_parts(size=(300, 26), cut=7):
    w, h = size
    back = plate_body(size, cut, top=(9, 15, 27), bottom=(5, 9, 17), seed=3, noise=6)
    d = ImageDraw.Draw(back)
    d.line([(cut, 2), (w - cut, 2)], fill=(0, 0, 0, 120), width=1)
    add(back, edge_lines(size, cut, (30, 74, 104), 1, 0), 0.8)
    for x in range(cut + 6, w - cut - 4, 10):
        d.line([(x, h - 4), (x, h - 7)], fill=(255, 255, 255, 14), width=1)
    fill = plate_body(size, cut, top=(58, 190, 236), bottom=(20, 104, 150), seed=4, noise=10)
    df = ImageDraw.Draw(fill)
    df.line([(cut, 3), (w - cut, 3)], fill=(255, 255, 255, 90), width=1)
    add(fill, hatch(size, cut, (255, 255, 255), step=11, width=2, band=(0, h)))
    add(fill, edge_lines(size, cut, (180, 245, 255), 1, 0), 0.9)
    return back, fill


def slider_grab(size=(46, 46)):
    w, h = size
    cut = 12
    im = plate_body(size, cut, top=(168, 214, 244), bottom=(48, 92, 132), seed=2, noise=9)
    add(im, edge_lines(size, cut, (255, 255, 255), 1, 3), 0.75)
    d = ImageDraw.Draw(im)
    d.line([(w // 2, 9), (w // 2, h - 10)], fill=(255, 255, 255, 210), width=2)
    d.line([(w // 2 - 6, 12), (w // 2 - 6, h - 13)], fill=(10, 20, 34, 150), width=1)
    d.line([(w // 2 + 6, 12), (w // 2 + 6, h - 13)], fill=(10, 20, 34, 150), width=1)
    out = new(size)
    add(out, glow(edge_lines(size, cut, EDGE, 2, 0), 7, 0.8))
    add(out, im)
    return out


def check(on=False, size=(44, 44), cut=10):
    w, h = size
    if on:
        im = plate_body(size, cut, top=(30, 74, 60), bottom=(10, 30, 26), seed=8, noise=8)
        col = (*GREEN, 255)
    else:
        im = plate_body(size, cut, top=(13, 23, 40), bottom=(7, 12, 22), seed=9, noise=7)
        col = (150, 190, 220, 190)
    add(im, edge_lines(size, cut, col[:3], 2, 0), 1.0)
    d = ImageDraw.Draw(im)
    if on:
        d.line([(12, 23), (19, 31), (33, 13)], fill=col, width=4, joint="curve")
        d.line([(12, 23), (19, 31), (33, 13)], fill=(255, 255, 255, 120), width=1, joint="curve")
    else:
        d.rectangle([13, 13, w - 14, h - 14], fill=(0, 0, 0, 90))
        d.rectangle([13, 13, w - 14, h - 14], outline=(126, 162, 198, 150), width=1)
    return im


def bar_parts(size=(300, 26), cut=6):
    w, h = size
    back = new(size)
    db = ImageDraw.Draw(back)
    db.polygon(chamfer_path(w, h, cut), fill=(6, 11, 21, 235))
    db.line([(0, 0), (w, 0)], fill=(0, 0, 0, 130), width=1)
    add(back, edge_lines(size, cut, (34, 78, 110), 1, 0), 0.9)
    for x in range(0, w, 18):
        db.line([(x, h - 2), (x + 6, 2)], fill=(255, 255, 255, 10), width=1)
    fill = new(size)
    df = ImageDraw.Draw(fill)
    df.polygon(chamfer_path(w, h, cut), fill=(255, 255, 255, 255))
    g = vgrad(w, h, (200, 250, 255), (40, 150, 200), 1.4)
    fa = arr(fill)
    grad = np.clip(g, 0, 255)
    for x in range(-6, w, 13):
        x0, x1 = max(0, x + 6), min(w, x + 13)
        if x1 > x0:
            grad[:, x0:x1] = np.clip(grad[:, x0:x1] + 44.0, 0, 255)
    fa[..., :3] = grad
    fill = put(fa)
    df2 = ImageDraw.Draw(fill)
    df2.line([(0, 2), (w, 2)], fill=(255, 255, 255, 120), width=1)
    add(fill, hatch(size, cut, (255, 255, 255), step=14, width=3, band=(0, h)), 0.35)
    return back, fill


def pill(size=(170, 40), cut=11, col=EDGE):
    w, h = size
    im = plate_body(size, cut, top=(20, 40, 66), bottom=(8, 17, 32), seed=12, noise=8)
    add(im, edge_lines(size, cut, col, 1, 0), 0.9)
    d = ImageDraw.Draw(im)
    d.polygon([(cut - 1, h // 2 - 5), (cut + 4, h // 2 - 5), (cut + 8, h // 2),
               (cut + 4, h // 2 + 5), (cut - 1, h // 2 + 5)], fill=(*col, 230))
    return im


def card_frame(size=(360, 440), cut=30):
    w, h = size
    im = new(size)
    base = new(size)
    ImageDraw.Draw(base).polygon(chamfer_path(w, h, cut), fill=(10, 17, 30, 120))
    add(im, base)
    add(im, edge_lines(size, cut, (196, 236, 255), 3, 0), 1.0)
    add(im, edge_lines(size, cut, (255, 255, 255), 1, 6), 0.30)
    add(im, corner_brackets(size, cut, (205, 240, 255), ln=26, wdt=4, inset=2, gain=1.0))
    d = ImageDraw.Draw(im)
    # top tab notch
    tw = 66
    d.polygon([(w // 2 - tw, 0), (w // 2 + tw, 0), (w // 2 + tw - 12, 13), (w // 2 - tw + 12, 13)],
              fill=(18, 34, 56, 235))
    d.line([(w // 2 - tw + 12, 13), (w // 2 + tw - 12, 13)], fill=(*EDGE, 220), width=2)
    # bottom info band
    bh = 96
    band = new(size)
    db = ImageDraw.Draw(band)
    db.polygon([(1, h - bh), (cut + 6, h - bh), (w // 2, h - bh + 14), (w - cut - 6, h - bh), (w - 1, h - bh),
                (w - 1, h - cut), (w - cut, h - 1), (cut, h - 1), (1, h - cut)], fill=(11, 20, 36, 245))
    db.line([(6, h - bh + 1), (w // 2 - 2, h - bh + 12)], fill=(*EDGE, 150), width=1)
    db.line([(w // 2 + 2, h - bh + 12), (w - 6, h - bh + 1)], fill=(*EDGE, 150), width=1)
    add(band, hatch(size, 0, (160, 200, 240), step=10, width=1, band=(h - bh + 16, h - 10)), 0.25)
    add(im, band)
    # side rails
    for x in (7, w - 8):
        d.line([(x, cut + 22), (x, h - bh - 12)], fill=(*EDGE_SOFT, 200), width=2)
        d.line([(x, cut + 22), (x, cut + 52)], fill=(*EDGE, 255), width=2)
    return im


def keycap(size=(64, 64), cut=13):
    im = plate_body(size, cut, top=(38, 62, 94), bottom=(11, 20, 36), seed=14, noise=9)
    add(im, edge_lines(size, cut, (190, 230, 255), 1, 2), 0.7)
    add(im, edge_lines(size, cut, EDGE, 2, 0), 0.75)
    d = ImageDraw.Draw(im)
    d.rectangle([7, 8, size[0] - 8, size[1] - 12], fill=(0, 0, 0, 60))
    return im


def divider(size=(560, 14), cut=0):
    w, h = size
    im = new(size)
    d = ImageDraw.Draw(im)
    y = h // 2
    d.line([(0, y), (w // 2 - 24, y)], fill=(*EDGE_SOFT, 190), width=1)
    d.line([(w // 2 + 24, y), (w, y)], fill=(*EDGE_SOFT, 190), width=1)
    d.polygon([(w // 2, y - 6), (w // 2 + 7, y), (w // 2, y + 6), (w // 2 - 7, y)], fill=(*EDGE, 210))
    d.line([(0, y + 3), (w // 2 - 40, y + 3)], fill=(255, 255, 255, 20), width=1)
    d.line([(w // 2 + 40, y + 3), (w, y + 3)], fill=(255, 255, 255, 20), width=1)
    return im


def backdrop(size=(720, 420), cut=34):
    """Big atmospheric plate used behind hero panels (title screen, modals)."""
    w, h = size
    rng = np.random.default_rng(41)
    g = vgrad(w, h, (18, 34, 62), (4, 8, 18), 1.3)
    stars = np.zeros((h, w), np.float32)
    n_s = 520
    sx, sy = rng.integers(0, w, n_s), rng.integers(0, h, n_s)
    stars[sy, sx] = rng.random(n_s) ** 3.2
    stars = np.asarray(Image.fromarray((stars * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.35)), np.float32)
    neb = np.asarray(Image.fromarray((rng.random((h // 7, w // 7)) * 255).astype(np.uint8), "L").resize((w, h), Image.BICUBIC), np.float32)
    neb = np.clip((neb - 150) / 150.0, 0, 1)
    neb = np.asarray(Image.fromarray((neb * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(6)),
                     np.float32) / 255.0
    glowc = np.zeros((h, w, 3), np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    halo = np.exp(-(((xx - w * 0.5) / (w * 0.55)) ** 2 + ((yy - h * 0.72) / (h * 0.5)) ** 2))
    glowc += halo[..., None] * np.array([24, 54, 82], np.float32)
    a = np.concatenate([np.clip(g + stars[..., None] * 120 + neb[..., None] * np.array([10, 17, 32], np.float32)
                               + glowc, 0, 255),
                        np.full((h, w, 1), 250.0, np.float32)], axis=2)
    im = put(a)
    im.putalpha(mask_chamfer(size, cut))
    add(im, hatch(size, cut, (150, 200, 250), step=13, width=1, band=(h - 60, h)), 0.3)
    add(im, edge_lines(size, cut, EDGE, 2, 0), 0.75)
    add(im, corner_brackets(size, cut, (200, 240, 255), ln=30, wdt=4, inset=4, gain=0.9))
    return im


KIT = {
    "panel_main": (panel_main, 30),
    "panel_inset": (panel_inset, 16),
    "header_bar": (header_bar, 16),
    "btn_normal": (lambda: button("normal"), 14),
    "btn_hover": (lambda: button("hover"), 14),
    "btn_pressed": (lambda: button("pressed"), 14),
    "btn_disabled": (lambda: button("disabled"), 14),
    "tab_off": (lambda: tab(False), 14),
    "tab_on": (lambda: tab(True), 14),
    "slider_back": (lambda: slider_parts()[0], 7),
    "slider_fill": (lambda: slider_parts()[1], 7),
    "slider_grab": (slider_grab, 12),
    "check_off": (lambda: check(False), 10),
    "check_on": (lambda: check(True), 10),
    "bar_back": (lambda: bar_parts()[0], 6),
    "bar_fill": (lambda: bar_parts()[1], 6),
    "pill": (pill, 11),
    "card_frame": (card_frame, 30),
    "keycap": (keycap, 13),
    "divider": (divider, 0),
    "backdrop": (backdrop, 34),
}


def preview(path):
    tiles = []
    labels = []
    for name, (fn, _cut) in KIT.items():
        out = fn()
        if isinstance(out, tuple):
            out = out[0]
        tiles.append(out)
        labels.append(name)
    tw = 300
    row_h = 170
    pad = 14
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * (tw + pad) + pad, rows * (row_h + pad + 18) + pad), (12, 16, 26, 255))
    d = ImageDraw.Draw(sheet)
    for i, (im, name) in enumerate(zip(tiles, labels)):
        sc = max(1.0, min(tw / im.width, row_h / im.height))
        r = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.LANCZOS)
        cx = pad + (i % cols) * (tw + pad)
        cy = pad + (i // cols) * (row_h + pad + 18)
        cell = Image.new("RGBA", (tw, row_h), (20, 26, 40, 255))
        bg = Image.new("RGBA", (tw, row_h), (0, 0, 0, 0))
        d.rectangle([cx, cy, cx + tw, cy + row_h], fill=(24, 32, 50, 255))
        cell = cell.convert("RGBA")
        cell.alpha_composite(r, ((tw - r.width) // 2, (row_h - r.height) // 2))
        sheet.alpha_composite(cell, (cx, cy))
        d.text((cx + 4, cy + row_h + 3), name, fill=(170, 200, 230, 255))
    sheet.convert("RGB").save(path)
    print("preview ->", path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", default="/tmp/ui_skin_preview.png")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (fn, cut) in KIT.items():
        im = fn()
        p = OUT / f"{name}.png"
        im.save(p, optimize=True)
        meta[p.name] = {"cut": cut, "size": list(im.size)}
        print(f"{p.name:24s} {im.size[0]}x{im.size[1]}  chamfer={cut}")
    (OUT / "skin_manifest.txt").write_text(
        "SPACE MINER UI skin kit - generated by tools/render_ui_skin.py\n"
        "Each texture is authored as a 9-slice plate: `cut` is the corner chamfer in px and\n"
        "is also the texture/content margin the engine should use (see ThemeHelper.SKIN_MARGINS).\n",
        encoding="utf-8")
    preview(args.preview)


if __name__ == "__main__":
    main()
