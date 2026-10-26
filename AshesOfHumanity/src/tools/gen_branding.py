#!/usr/bin/env python3
"""Original branding art: app icon + loading splash (dark industrial motif).
A generated-art replacement can later drop into the same paths.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..",
                                    "assets", "branding"))
os.makedirs(OUT, exist_ok=True)
rng = random.Random(77)


def vignette(img, strength=0.75):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    for i in range(60):
        alpha = int(255 * (i / 60) ** 2 * strength)
        d.ellipse((-w * 0.3 + i * w * 0.013, -h * 0.3 + i * h * 0.013,
                   w * 1.3 - i * w * 0.013, h * 1.3 - i * h * 0.013),
                  fill=alpha)
    dark = Image.new("RGB", (w, h), (4, 5, 7))
    return Image.composite(img, dark, mask.filter(ImageFilter.GaussianBlur(48)))


def background(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / h
        r = int(18 + 14 * (1 - t))
        g = int(20 + 10 * (1 - t))
        b = int(26 + 18 * (1 - t))
        for x in range(w):
            noise = rng.randint(-6, 6)
            px[x, y] = (max(0, r + noise), max(0, g + noise),
                        max(0, b + noise))
    d = ImageDraw.Draw(img)
    # distant ruined skyline silhouettes
    for _ in range(26):
        bw = rng.randint(w // 18, w // 8)
        bh = rng.randint(h // 8, h // 3)
        x = rng.randint(-bw, w)
        d.rectangle((x, h - bh, x + bw, h),
                    fill=(rng.randint(8, 16), rng.randint(9, 15),
                          rng.randint(12, 20)))
        # broken rooftop teeth
        for _ in range(rng.randint(2, 5)):
            tw = max(4, bw // 6)
            x0 = x + rng.randint(0, max(1, bw - tw))
            top = h - bh - rng.randint(8, 26)
            d.rectangle((x0, top, x0 + tw, h - bh), fill=(10, 11, 14))
    # faint signal tower with red beacon
    tx = int(w * 0.72)
    d.line((tx, h * 0.18, tx, h * 0.62), fill=(28, 30, 34), width=4)
    for i in range(7):
        yy = h * (0.2 + i * 0.06)
        d.line((tx - 14 - i * 2, yy, tx + 14 + i * 2, yy),
               fill=(24, 26, 30), width=2)
    d.ellipse((tx - 7, h * 0.16, tx + 7, h * 0.16 + 14),
              fill=(190, 40, 30))
    return vignette(img)


def emblem(draw, cx, cy, r, color=(180, 150, 90)):
    # broadcast arcs over a broken ring
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=6)
    for k in (0.45, 0.7, 0.95):
        draw.arc((cx - r * k, cy - r * k, cx + r * k, cy + r * k),
                 start=210, end=330, fill=color, width=4)
    draw.line((cx, cy + r * 0.55, cx, cy - r * 0.25), fill=color, width=5)
    draw.ellipse((cx - 7, cy - r * 0.34, cx + 7, cy - r * 0.34 + 14),
                 fill=(200, 60, 45))


def load_font(size, bold=True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_loading():
    w, h = 1920, 1080
    img = background(w, h)
    d = ImageDraw.Draw(img)
    emblem(d, w // 2, int(h * 0.36), 120)
    title_font = load_font(108)
    sub_font = load_font(40, bold=False)
    title = "ASHES OF HUMANITY"
    sub = "LAST SIGNAL"
    tw = d.textlength(title, font=title_font)
    d.text(((w - tw) / 2, h * 0.52), title, font=title_font,
           fill=(206, 202, 188))
    sw = d.textlength(sub, font=sub_font)
    d.text(((w - sw) / 2, h * 0.66), sub, font=sub_font, fill=(150, 70, 60))
    # scanline grunge
    for y in range(0, h, 4):
        d.line((0, y, w, y), fill=(0, 0, 0))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(os.path.join(OUT, "loading.png"))
    print("wrote loading.png")


def make_icon():
    s = 256
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bg = background(s, s).resize((s, s))
    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((6, 6, s - 6, s - 6), radius=36, fill=255)
    img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)
    emblem(d, s // 2, int(s * 0.52), 78)
    img.save(os.path.join(OUT, "icon.png"))
    print("wrote icon.png")


if __name__ == "__main__":
    make_loading()
    make_icon()
