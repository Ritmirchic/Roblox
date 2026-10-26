#!/usr/bin/env python3
"""
Converts the branding artwork into the engine's own .aft texture format so
the title screen and loading screen use the same pipeline as everything else.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BRANDING = os.path.join(ROOT, "branding")
OUT_DIR = os.path.join(ROOT, "assets", "ui")


def build_mipmaps(rgb):
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
    path = os.path.join(OUT_DIR, name + ".aft")
    with open(path, "wb") as f:
        f.write(bytes(hdr) + bytes(buf))
    print("wrote", path, arr.shape, "mips", len(mips))


def load_rgba(path, max_size=1600):
    im = Image.open(path).convert("RGBA")
    if max(im.size) > max_size:
        ratio = max_size / max(im.size)
        im = im.resize((max(1, int(im.width * ratio)), max(1, int(im.height * ratio))),
                       Image.LANCZOS)
    return np.asarray(im, dtype=np.uint8)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    # NOTE: these live in assets/ui so they never disturb the lexicographic
    # ordering of the material texture sets in assets/textures.
    jobs = [
        ("menu_background", os.path.join(BRANDING, "menu_background.png"), 1024),
        ("loading_screen", os.path.join(BRANDING, "loading_screen.png"), 1024),
        ("title_logo", os.path.join(BRANDING, "icon_1024.png"), 512),
    ]
    for name, path, size in jobs:
        if not os.path.exists(path):
            print("skip (missing):", path)
            continue
        arr = load_rgba(path, size)
        pack(name, arr, 0)
    print("BRANDING_OK")


if __name__ == "__main__":
    main()
