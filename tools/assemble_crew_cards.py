#!/usr/bin/env python3
"""Assemble the 42 crew card portraits from the authored paintings.

The art set is *authored*, not generated: every crew member is one hand-directed
painting (42 separate image generations, one per card, each with the pilot's own
sensor face, armour escalation and signature tool) kept as a source file under
``assets/cards/crew_src/``. This tool only does the mechanical work a card needs:

* subject-aware framing - the silhouette is located by comparing the frame against
  its own border, so the pilot always fills the card instead of floating in a
  corner of the original 2:3 painting; the window is biased to keep the helmet
  clear of the top edge, because a cropped head is the worst thing a crew card
  can do;
* a light key-art vignette so every figure peels off its backdrop once it sits on
  the game's dark card frame (the runtime foil shader does the rest);
* deterministic PNG output so CI can assert 42 unique digests.

Run:  .venv/bin/python tools/assemble_crew_cards.py [--only 1,41] [--contact]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "cards" / "crew_src"
OUT_DIR = ROOT / "assets" / "cards" / "crew"

CARD_W, CARD_H = 360, 440
AR = CARD_W / CARD_H
BORDER = 14        # px of the painting used as the background reference
CUT = 14.0         # max-channel difference that counts as "figure", not "sky"
EXPAND = 1.16      # keep some backdrop around the silhouette (the card frame needs it)
HEAD_ROOM = 0.09   # fraction of the subject height left empty above the helm


def subject_box(a: np.ndarray) -> tuple[int, int, int, int]:
    """Tight (top, bottom, left, right) of the figure, ignoring stray glow."""
    h, w = a.shape[:2]
    fr = min(BORDER, h // 8, w // 8)
    border = np.concatenate([a[:, :fr].reshape(-1, 3), a[:, -fr:].reshape(-1, 3),
                             a[:fr].reshape(-1, 3), a[-fr:].reshape(-1, 3)], axis=0)
    bg = np.median(border, axis=0)
    mask = (np.abs(a - bg).max(axis=2) > CUT).astype(np.float32)
    total = float(mask.sum())
    if total < 0.03 * h * w:                      # nothing readable: full-frame fallback
        return 0, h - 1, 0, w - 1
    clean = np.asarray(Image.fromarray((mask * 255).astype(np.uint8))
                       .filter(ImageFilter.MedianFilter(7)), np.float32) / 255.0
    mass = float(clean.sum())

    def band(v: np.ndarray, keep: float = 0.97) -> tuple[int, int]:
        c = np.cumsum(v) / max(mass, 1e-6)
        lo = int(np.searchsorted(c, (1.0 - keep) / 2.0))
        hi = int(np.searchsorted(c, 1.0 - (1.0 - keep) / 2.0))
        return lo, max(hi, lo + 1)

    t, b = band(clean.sum(axis=1))
    l, r = band(clean.sum(axis=0))
    return t, min(b, h - 1), l, min(r, w - 1)


def crop_to_card(im: Image.Image) -> Image.Image:
    """Frame the subject into 360x440, keeping the head inside and backdrop at the sides."""
    a = np.asarray(im.convert("RGB"), dtype=np.float32)
    h, w = a.shape[:2]
    t, b, l, r = subject_box(a)
    sh = max(b - t, 1)
    sw = max(r - l, 1)
    box_h = min(h, sh * EXPAND)
    box_w = min(w, sw * EXPAND)
    # window with the card aspect that contains that box
    if box_w / box_h > AR:
        ww, wh = box_w, box_w / AR
    else:
        ww, wh = box_h * AR, box_h
    ww = min(ww, float(w))
    wh = ww / AR
    if wh > h:
        wh, ww = float(h), h * AR
    # head priority: leave air above the helm, spend the slack on the torso
    pad = sh * HEAD_ROOM
    y0 = max(0.0, t - pad)
    y0 = min(y0, max(0.0, h - wh))
    x0 = min(max(0.0, (l + r) / 2.0 - ww / 2.0), max(0.0, w - ww))
    box = (int(round(x0)), int(round(y0)), int(round(x0 + ww)), int(round(y0 + wh)))
    return im.convert("RGB").crop(box).resize((CARD_W, CARD_H), Image.Resampling.LANCZOS)


def vignette(im: Image.Image, strength: float = 0.22, radius: float = 26.0) -> Image.Image:
    """Darken the edges the way key art does, without eating the armour highlights."""
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((-w * 0.24, -h * 0.18, w * 1.24, h * 1.18), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius))
    shade = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(im, shade, mask.point(lambda v: int(255 - (255 - v) * strength * 3.0)))


def finish(im: Image.Image) -> Image.Image:
    """Final unification pass so 42 separate paintings read as one printed set."""
    im = ImageEnhance.Color(im).enhance(1.04)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return vignette(im)


def contact_sheet(paths: list[str], dest: Path, cols: int = 7) -> None:
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (CARD_W + 4), rows * (CARD_H + 4)), (12, 14, 20))
    for i, n in enumerate(paths):
        sheet.paste(Image.open(n).convert("RGB"),
                    ((i % cols) * (CARD_W + 4) + 2, (i // cols) * (CARD_H + 4) + 2))
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest)
    print(f"contact sheet -> {dest} ({sheet.size[0]}x{sheet.size[1]})")


def main() -> int:
    ap = argparse.ArgumentParser(description="assemble crew cards from the painted sources")
    ap.add_argument("--only", default="", help="comma separated card numbers to rebuild")
    ap.add_argument("--contact", action="store_true", help="also write a review montage")
    ap.add_argument("--preview-dir", default=str(ROOT / "preview_renders"))
    args = ap.parse_args()

    wanted = ({int(x) for x in args.only.split(",") if x.strip()} if args.only
              else set(range(1, 43)))
    done = []
    for idx in sorted(wanted):
        src = SRC_DIR / f"crew_{idx:02d}.jpg"
        if not src.exists():
            print(f"!! missing source painting {src}", file=sys.stderr)
            return 1
        with Image.open(src) as im:
            card = finish(crop_to_card(im))
        out = OUT_DIR / f"crew_{idx:02d}.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        card.save(out, optimize=True)
        done.append(str(out))
        print(f"crew_{idx:02d}  {card.size[0]}x{card.size[1]}  {out.stat().st_size // 1024} KB")

    if args.contact and len(done) > 1:
        contact_sheet(sorted(done), Path(args.preview_dir) / "assembled.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
