#!/usr/bin/env python3
"""
Wallpaper loop renderer.

Pipeline: 6 AI keyframes (calm -> brighter/ember flare -> calm) are
luminance-normalised so only the *content* differences (cape sway, fog, ember
glow) survive, then modulated by a smooth "breathing" curve that drives

  * a small vertical float (the knight rises and settles),
  * a micro zoom (parallax feel),
  * a gentle background light-up + ember glow pulse.

Frames are ping-ponged (forward + reverse) so the loop is perfectly seamless.
Raw RGB frames are streamed to two ffmpeg processes at once:
1080p master and the 16K desktop version.
"""
import os
import sys
import time
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
KEYS = [os.path.join(ROOT, 'ref.png')] + \
       [os.path.join(ROOT, 'keys', 'k%d.png' % i) for i in range(2, 7)]

BW, BH = 1376, 768          # keyframe resolution
FW, FH = 1920, 1080         # final master size
PAD = 36                    # extra bottom room for the float (px, at 1080 scale)
CH = FH + PAD               # canvas height the frames are composed on
CANVAS_GLOW = (int(1085 * FW / BW), int(235 * CH / BH))   # gauntlet / blade core
FPS = 24
NF = 240                    # forward frames, loop = 2*NF/NF = 20 s total
SEAM = 0                    # curve phase of the loop seam (min of the curve)

# --- look ------------------------------------------------------------------
Y_AMP = 8.0                 # extra px of float on top of the zoom margin
ZOOM_AMP = 0.0060           # peak zoom-in
TARGET_MEAN = (31.0, 32.6, 35.0, 39.0, 32.4, 29.4)   # per keyframe brightness
GLOW_MAX = 30.0             # additive RGB boost at the pulse peak
COOL_MAX = 13.0             # additive boost on the cathedral arches
WARM_R, WARM_B = 3.0, -2.5  # tiny warm push at the peak

# ---------------------------------------------------------------- keyframes
def load_keys():
    keys, scales = [], []
    ref = np.asarray(Image.open(KEYS[0]).convert('RGB'), dtype=np.float32)
    luma = lambda a: a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    m_ref = float(luma(ref).mean())
    for i, path in enumerate(KEYS):
        a = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
        if a.shape != ref.shape:                      # safety, sizes matched
            a = np.asarray(Image.open(path).convert('RGB').resize((BW, BH))).astype(np.float32)
        s = TARGET_MEAN[i] / max(float(luma(a).mean()), 1e-3)   # normalise brightness
        keys.append(a * s)
        scales.append(s)
    return np.stack(keys), np.array(scales, dtype=np.float32)


def base_masks():
    """Soft masks at canvas resolution: ember glow (right) / arches (left)."""
    y, x = np.mgrid[0:CH, 0:FW].astype(np.float32)
    gx, gy = CANVAS_GLOW
    # gauntlet + sword blade = elongated hot region on the right
    d = ((x - gx) / 460.0) ** 2 + ((y - gy) / 600.0) ** 2
    glow = np.exp(-d) ** 1.4
    # the arches / nave occupy the left half
    d2 = ((x - 460.0) / 585.0) ** 2 + ((y - 435.0) / 620.0) ** 2
    cool = np.exp(-d2)
    k = np.array([1.0, 0.62, 0.30], dtype=np.float32)     # warm ember
    k2 = np.array([0.55, 0.78, 1.0], dtype=np.float32)    # cool steel light
    return glow[..., None] * k, cool[..., None] * k2


def curve(i, n=NF):
    """0 -> 1 -> 0 breathing curve, minimum exactly at the loop seam."""
    t = (i - SEAM) / n
    return 0.5 - 0.5 * np.cos(2.0 * np.pi * t)


def weights(i, w_lo=1.8):
    """Continuous triangular keyframe weights around the loop."""
    p = (i / (NF - 1)) * 5.0          # position along keyframes 0..5
    w = np.zeros(6, dtype=np.float32)
    for j in range(6):
        d = abs(p - j)
        w[j] = np.exp(-(d / w_lo) ** 2)
    return w / w.sum()


# ------------------------------------------------------------------- ffmpeg
FFMPEG = None
def ff():
    global FFMPEG
    if FFMPEG is None:
        import imageio_ffmpeg
        FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    return FFMPEG


# ------------------------------------------------------------- frame compose
def frame(keys, mg, mc, i, rng=None):
    """Compose one full-quality frame (FW x CH canvas) as float32 RGB."""
    c = curve(i)
    base = np.tensordot(weights(i), keys, axes=(0, 0)).astype(np.float32)
    canvas = np.asarray(
        Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).resize((FW, CH), Image.BILINEAR),
        dtype=np.float32)
    # brightness / glow modulation: 0 at the loop seam, max at the pulse peak
    lift = c - 0.5
    canvas += lift * (mg * GLOW_MAX + mc * COOL_MAX)
    canvas[..., 0] += lift * WARM_R
    canvas[..., 2] += lift * WARM_B
    canvas *= 1.0 + lift * 0.012
    if rng is not None:                       # sub-pixel dither -> no banding
        canvas += rng.normal(0.0, 0.55, size=canvas.shape).astype(np.float32)
    return np.clip(canvas, 0.0, 255.0)


def geom(canvas, i):
    """Float + micro zoom: cut a window out of the FW x CH canvas.

    The window is pinned to the bottom edge (the stone floor of the cathedral
    never slides) and grows at the top as the knight rises -> the frame reads
    as "he lifts off, the hall opens up behind him", not as a plain zoom.
    """
    c = curve(i)
    z = 1.0 + ZOOM_AMP * c
    win_w = int(round(FW / z))
    win_h = int(round(FH / z))
    left = (FW - win_w) // 2
    top = CH - win_h + int(round(Y_AMP * c))      # < 0 => the frame floats up
    top = max(0, min(top, CH - win_h))
    crop = canvas[top:top + win_h, left:left + win_w]
    if crop.shape[0] != win_h or crop.shape[1] != win_w:
        raise SystemExit('crop %s != %dx%d (top=%d left=%d)' % (crop.shape, win_w, win_h, top, left))
    out = Image.fromarray(crop.astype(np.uint8)).resize((FW, FH), Image.BILINEAR)
    return np.asarray(out, dtype=np.uint8)


# --------------------------------------------------------------------- main
def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'still'
    keys, _ = load_keys()
    mg, mc = base_masks()
    build = os.path.join(ROOT, 'build')
    os.makedirs(build, exist_ok=True)
    rng = np.random.default_rng(7)

    if mode == 'still':
        idx = [int(float(x)) for x in sys.argv[2:]] or [0, 60, 120, 180]
        for i in idx:
            c = geom(frame(keys, mg, mc, i, rng), i)
            Image.fromarray(c).save(os.path.join(build, 'chk_%03d.png' % i))
            print('frame', i, 'mean', round(float(c.mean()), 2))
        rows = [np.asarray(Image.open(os.path.join(build, 'chk_%03d.png' % i))) for i in idx]
        strip = np.concatenate([r[:270] for r in rows], axis=1)
        Image.fromarray(strip).save(os.path.join(build, 'strip.png'))
        return

    if mode == 'cache':
        out = os.path.join(build, 'raw.bin')
        t0 = time.time()
        with open(out, 'wb') as fh:
            for rep in (0, 1):
                rng_ = rng
                seq = range(NF) if rep == 0 else range(NF - 2, -1, -1)
                for n, i in enumerate(seq):
                    fh.write(frame(keys, mg, mc, i, rng_ if n % 4 == 0 else None).astype(np.uint8).tobytes()
                             if False else geom(frame(keys, mg, mc, i, rng_), geom_i(i)).tobytes())
        print('raw.bin %.1f s  size %.0f MB' % (time.time() - t0, os.path.getsize(out) / 1e6))
        return

    raise SystemExit('unknown mode: %s' % mode)


if __name__ == '__main__':
    main()
