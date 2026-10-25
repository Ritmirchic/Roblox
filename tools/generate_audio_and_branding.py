#!/usr/bin/env python3
"""
Studio-Grade Procedural Sci-Fi Audio & Branding Generator for
SPACE MINER: BUILD & CONQUER v2.0.0:
- 44.1 kHz warm polyphonic synthesis with Butterworth lowpass/bandpass filtering,
  Schroeder/Freeverb spatial reverb diffuser, soft analog saturation, and ear-friendly
  headroom across all 23 WAV files (zero raw square waves or piercing pure sines).
- High-res application icon, main logo, boot splash, installer bitmaps, and OFL font notices.
"""
import math
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter, sosfilt
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "assets" / "audio"
BRAND_DIR = ROOT / "assets" / "branding"
FONT_DIR = ROOT / "assets" / "fonts"

SR = 44100


def load_font(name: str, size: int, bold_var: bool = False) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT_DIR / name), size)
    if bold_var:
        try:
            f.set_variation_by_axes([800])
        except Exception:
            pass
    return f


def lp(sig: np.ndarray, cutoff_hz: float, order: int = 4) -> np.ndarray:
    nyq = 0.5 * SR
    wn = min(0.96, max(0.002, cutoff_hz / nyq))
    sos = butter(order, wn, btype="low", output="sos")
    return sosfilt(sos, sig)


def bp(sig: np.ndarray, low_hz: float, high_hz: float, order: int = 3) -> np.ndarray:
    nyq = 0.5 * SR
    lo = min(0.90, max(0.002, low_hz / nyq))
    hi = min(0.96, max(lo + 0.01, high_hz / nyq))
    sos = butter(order, [lo, hi], btype="band", output="sos")
    return sosfilt(sos, sig)


def pink_noise(rng: np.random.Generator, n: int) -> np.ndarray:
    white = rng.standard_normal(n).astype(np.float64)
    # Voss-McCartney / Kellet 1/f pink filter
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1.0, -2.494956002, 2.017265875, -0.522189400]
    p = lfilter(b, a, white)
    mx = np.max(np.abs(p)) + 1e-9
    return p / mx


def warm_reverb(sig: np.ndarray, mix: float = 0.28, decay: float = 0.76) -> np.ndarray:
    if mix <= 0.001:
        return sig
    # Multi-comb + 2 all-pass Schroeder lush hall diffuser
    comb_delays_ms = [29.7, 37.1, 41.1, 43.7]
    wet = np.zeros_like(sig, dtype=np.float64)
    for d_ms in comb_delays_ms:
        d = max(16, int(SR * d_ms * 0.001))
        a = np.zeros(d + 1, dtype=np.float64)
        a[0] = 1.0
        a[d] = -decay * (0.94 ** (d_ms / 30.0))
        b = np.zeros(d + 1, dtype=np.float64)
        b[d] = 1.0
        wet += lfilter(b, a, sig) * 0.25
    # Damp high frequencies in reverb tail for velvet warmth
    wet = lp(wet, 3200.0, order=2)
    for ap_ms, g in [(5.0, 0.65), (1.7, 0.62)]:
        d = max(8, int(SR * ap_ms * 0.001))
        b = np.zeros(d + 1, dtype=np.float64)
        a = np.zeros(d + 1, dtype=np.float64)
        b[0] = -g
        b[d] = 1.0
        a[0] = 1.0
        a[d] = -g
        wet = lfilter(b, a, wet)
    return sig * (1.0 - mix * 0.45) + wet * mix


def soft_sat(sig: np.ndarray, drive: float = 1.35) -> np.ndarray:
    return np.tanh(sig * drive) / math.tanh(drive)


def adsr_env(n: int, atk_s: float, dec_s: float, sus_lvl: float, rel_s: float) -> np.ndarray:
    env = np.ones(n, dtype=np.float64) * sus_lvl
    na = min(n, max(1, int(atk_s * SR)))
    nd = min(max(0, n - na), max(1, int(dec_s * SR)))
    nr = min(n, max(1, int(rel_s * SR)))
    env[:na] = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, na))
    if nd > 0:
        env[na:na + nd] = 1.0 - (1.0 - sus_lvl) * (0.5 - 0.5 * np.cos(np.linspace(0, math.pi, nd)))
    if nr > 0:
        env[-nr:] *= 0.5 + 0.5 * np.cos(np.linspace(0, math.pi, nr))
    return env


def warm_voice(t: np.ndarray, freq: float, detune_cents: float = 7.0, sub_amt: float = 0.25) -> np.ndarray:
    # Detuned unison warm analog pad/pluck voice (fundamental + gentle 2nd/3rd harmonics + sub)
    ratios = [2.0 ** (-detune_cents / 1200.0), 1.0, 2.0 ** (detune_cents / 1200.0)]
    out = np.zeros_like(t, dtype=np.float64)
    for i, r in enumerate(ratios):
        f = freq * r
        ph = i * 1.17
        out += (
            0.70 * np.sin(2.0 * np.pi * f * t + ph)
            + 0.20 * np.sin(4.0 * np.pi * f * t + ph * 1.7)
            + 0.07 * np.sin(6.0 * np.pi * f * t + ph * 2.3)
        ) / len(ratios)
    if sub_amt > 0.0:
        out += sub_amt * np.sin(np.pi * freq * t)
    return out


def make_seamless_loop(sig: np.ndarray, fade_sec: float = 0.65) -> np.ndarray:
    nf = min(len(sig) // 3, int(fade_sec * SR))
    if nf <= 8:
        return sig
    body = sig[:-nf].copy()
    tail = sig[-nf:]
    w = 0.5 - 0.5 * np.cos(np.linspace(0.0, math.pi, nf))
    body[:nf] = body[:nf] * w + tail * (1.0 - w)
    return body


def write_wav(path: Path, samples: np.ndarray, peak: float = 0.72) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    s = np.asarray(samples, dtype=np.float64)
    s = s - np.mean(s)
    s = soft_sat(s, 1.25)
    mx = float(np.max(np.abs(s)))
    if mx > 1e-6:
        s = s * (peak / mx)
    pcm = np.clip(s * 32767.0, -32767, 32767).astype("<i2")
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def generate_branding() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    sz = 512
    yy, xx = np.mgrid[0:sz, 0:sz].astype(np.float32)
    cx, cy = sz * 0.5, sz * 0.5
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (sz * 0.5)
    bg = np.zeros((sz, sz, 4), dtype=np.uint8)
    bg[:, :, 0] = np.clip(22 * (1.0 - dist * 0.7), 6, 36).astype(np.uint8)
    bg[:, :, 1] = np.clip(44 * (1.0 - dist * 0.65), 10, 62).astype(np.uint8)
    bg[:, :, 2] = np.clip(88 * (1.0 - dist * 0.55), 22, 115).astype(np.uint8)
    bg[:, :, 3] = 255

    icon = Image.fromarray(bg, mode="RGBA")
    draw = ImageDraw.Draw(icon)

    def hex_pts(radius: float):
        return [
            (cx + radius * math.cos(math.radians(60 * i - 30)), cy + radius * math.sin(math.radians(60 * i - 30)))
            for i in range(6)
        ]

    mask = Image.new("L", (sz, sz), 0)
    ImageDraw.Draw(mask).polygon(hex_pts(244), fill=255)
    icon.putalpha(mask)

    glow_layer = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.polygon([(256, 76), (344, 185), (308, 305), (204, 305), (168, 185)], fill=(35, 225, 255, 210))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(18))
    icon = Image.alpha_composite(icon, glow_layer)
    draw = ImageDraw.Draw(icon)

    draw.polygon([(256, 86), (332, 182), (300, 294), (212, 294), (180, 182)], fill=(28, 195, 242, 255), outline=(195, 250, 255, 255))
    draw.polygon([(256, 86), (332, 182), (256, 212)], fill=(125, 240, 255, 255))
    draw.polygon([(256, 86), (180, 182), (256, 212)], fill=(18, 145, 208, 255))
    draw.polygon([(256, 212), (332, 182), (300, 294)], fill=(14, 110, 175, 255))
    draw.polygon([(388, 134), (240, 260), (264, 286), (402, 152)], fill=(255, 235, 165, 235))
    draw.polygon([(122, 362), (165, 290), (268, 224), (286, 242), (222, 342), (152, 388)], fill=(215, 226, 242, 255), outline=(55, 95, 140, 255))
    draw.polygon([(168, 304), (226, 262), (238, 274), (180, 316)], fill=(245, 178, 38, 255))
    draw.polygon([(214, 274), (258, 242), (266, 252), (226, 288)], fill=(35, 230, 255, 255), outline=(220, 255, 255, 255))
    draw.polygon(hex_pts(244), outline=(65, 220, 255, 255), width=6)
    draw.polygon(hex_pts(232), outline=(255, 185, 55, 210), width=3)

    icon_256 = icon.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(BRAND_DIR / "icon_256.png")
    icon.save(
        BRAND_DIR / "icon.ico",
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )

    logo = Image.new("RGBA", (1200, 340), (0, 0, 0, 0))
    logo.alpha_composite(icon.resize((260, 260), Image.Resampling.LANCZOS), (30, 40))
    ld = ImageDraw.Draw(logo)

    f_title = load_font("Exo2-ExtraBold.ttf", 84)
    f_sub = load_font("Exo2-Bold.ttf", 40)

    glow = Image.new("RGBA", (1200, 340), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((315, 74), "SPACE MINER", font=f_title, fill=(0, 210, 255, 185))
    gd.text((320, 190), "BUILD  &  CONQUER", font=f_sub, fill=(255, 180, 40, 165))
    logo = Image.alpha_composite(logo, glow.filter(ImageFilter.GaussianBlur(10)))
    ld = ImageDraw.Draw(logo)

    ld.rectangle((318, 176, 1140, 180), fill=(45, 215, 255, 220))
    ld.rectangle((318, 176, 560, 182), fill=(255, 185, 45, 255))
    ld.text((315, 74), "SPACE MINER", font=f_title, fill=(238, 248, 255, 255))
    ld.text((320, 190), "BUILD  &  CONQUER", font=f_sub, fill=(255, 196, 68, 255))
    logo.save(BRAND_DIR / "logo_main.png")

    w, h = 1920, 1080
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx - w * 0.5) / (w * 0.5)
    ny = (yy - h * 0.5) / (h * 0.5)
    rad = np.sqrt(nx * nx + ny * ny)
    r = np.clip(6 + 26 * np.exp(-((nx - 0.28) ** 2 + (ny + 0.15) ** 2) * 3.5) + 38 * np.exp(-((nx + 0.35) ** 2 + (ny - 0.25) ** 2) * 4.0), 0, 255)
    g = np.clip(10 + 58 * np.exp(-((nx - 0.2) ** 2 + (ny + 0.1) ** 2) * 3.2) + 22 * (1.0 - np.clip(rad, 0, 1)), 0, 255)
    b = np.clip(24 + 115 * np.exp(-((nx - 0.18) ** 2 + (ny + 0.12) ** 2) * 2.8) + 70 * np.exp(-((nx + 0.35) ** 2 + (ny - 0.2) ** 2) * 3.5), 0, 255)
    arr = np.stack([r, g, b, np.full_like(r, 255)], axis=-1).astype(np.uint8)
    rng = np.random.default_rng(4201)
    for _ in range(900):
        sx, sy = int(rng.integers(0, w)), int(rng.integers(0, h))
        br = int(rng.integers(130, 255))
        arr[max(0, sy - 1):min(h, sy + 2), max(0, sx - 1):min(w, sx + 2), :3] = np.maximum(
            arr[max(0, sy - 1):min(h, sy + 2), max(0, sx - 1):min(w, sx + 2), :3], br
        )
    splash = Image.fromarray(arr, mode="RGBA")
    sd = ImageDraw.Draw(splash)
    bracket_col = (45, 205, 255, 150)
    for bx, by, sx_dir, sy_dir in [(60, 60, 1, 1), (w - 60, 60, -1, 1), (60, h - 60, 1, -1), (w - 60, h - 60, -1, -1)]:
        sd.line([(bx, by), (bx + sx_dir * 120, by)], fill=bracket_col, width=3)
        sd.line([(bx, by), (bx, by + sy_dir * 80)], fill=bracket_col, width=3)
    splash.alpha_composite(logo, ((w - 1200) // 2, 310))
    f_boot = load_font("JetBrainsMono-SemiBold.ttf", 24)
    sd.rectangle((660, 720, 1260, 726), fill=(25, 55, 85, 220))
    sd.rectangle((660, 720, 1080, 726), fill=(45, 220, 255, 255))
    sd.text((665, 744), "ЗАГРУЗКА ОРБИТАЛЬНОГО АНГАРА • INITIALIZING CORE...", font=f_boot, fill=(155, 215, 245, 230))
    splash.convert("RGB").save(BRAND_DIR / "boot_splash.png", quality=95)

    wiz_large = splash.crop((420, 0, 920, 1080)).resize((164, 314), Image.Resampling.LANCZOS).convert("RGB")
    wiz_large.save(BRAND_DIR / "installer_banner.bmp")
    wiz_small = Image.new("RGB", (55, 55), (10, 16, 32))
    wiz_small.paste(icon.resize((51, 51), Image.Resampling.LANCZOS), (2, 2), icon.resize((51, 51), Image.Resampling.LANCZOS))
    wiz_small.save(BRAND_DIR / "installer_small.bmp")

    licenses_text = """SPACE MINER: BUILD & CONQUER — THIRD-PARTY SOFTWARE & FONT NOTICES
====================================================================

1. GODOT ENGINE (MIT License)
Copyright (c) 2014-present Godot Engine contributors.
Copyright (c) 2007-2014 Juan Linietsky, Ariel Manzur.

2. BUNDLED MULTILINGUAL FONTS (SIL Open Font License 1.1)
- Exo 2 — Copyright (c) Natanael Gama (SIL OFL 1.1)
- JetBrains Mono — Copyright (c) JetBrains s.r.o. (SIL OFL 1.1)
- Noto Sans CJK (SC/KR) — Copyright (c) Google LLC (SIL OFL 1.1)
- M PLUS 1p — Copyright (c) M+ FONTS PROJECT (SIL OFL 1.1)
- DejaVu Sans — Copyright (c) Bitstream Inc. / DejaVu Fonts

3. 3D REFERENCE MODELS USED FOR PRE-RENDERED CARD ILLUSTRATIONS
- DamagedHelmet — Copyright (c) Leonardo Carrion (CC-BY-4.0, via Khronos glTF-Sample-Assets)
- SciFiHelmet & FlightHelmet — Public Domain (CC0-1.0, via Khronos glTF-Sample-Assets)
- Vanguard Soldier Armor — via Google model-viewer shared-assets (Apache-2.0)
"""
    (ROOT / "THIRDPARTY_LICENSES.txt").write_text(licenses_text, encoding="utf-8")


def generate_audio() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(202610)

    # 1. Warm Orbital Hangar Ambient Pad (D9 lush analog pad: D2, A2, E3, F#3, A3)
    t = np.linspace(0.0, 9.6, int(9.6 * SR), endpoint=False)
    pad = (
        0.34 * warm_voice(t, 73.42, 6.0, 0.25)
        + 0.26 * warm_voice(t, 110.00, 8.0, 0.0)
        + 0.20 * warm_voice(t, 164.81, 10.0, 0.0)
        + 0.16 * warm_voice(t, 185.00, 11.0, 0.0)
        + 0.11 * warm_voice(t, 220.00, 9.0, 0.0) * (0.55 + 0.45 * np.sin(2.0 * np.pi * t / 9.6))
    )
    air = bp(pink_noise(rng, len(t)), 70.0, 290.0, order=2) * 0.14
    amb_hangar = warm_reverb(lp(pad + air, 980.0, order=3), mix=0.45, decay=0.82)
    write_wav(AUDIO_DIR / "amb_hangar_loop.wav", make_seamless_loop(amb_hangar, 1.1), peak=0.48)

    # 2. Cosmic Deep-Space Ambient Pad (Cm9 -> Abmaj7 warm evolving synth soundtrack)
    t = np.linspace(0.0, 11.2, int(11.2 * SR), endpoint=False)
    cross = 0.5 - 0.5 * np.cos(2.0 * np.pi * t / 11.2)
    chord_a = (
        0.36 * warm_voice(t, 65.41, 7.0, 0.22)
        + 0.25 * warm_voice(t, 98.00, 9.0, 0.0)
        + 0.20 * warm_voice(t, 155.56, 10.0, 0.0)
        + 0.15 * warm_voice(t, 196.00, 12.0, 0.0)
        + 0.12 * warm_voice(t, 293.66, 8.0, 0.0)
    )
    chord_b = (
        0.36 * warm_voice(t, 51.91, 7.0, 0.22)
        + 0.25 * warm_voice(t, 103.83, 9.0, 0.0)
        + 0.20 * warm_voice(t, 155.56, 10.0, 0.0)
        + 0.16 * warm_voice(t, 196.00, 11.0, 0.0)
        + 0.12 * warm_voice(t, 261.63, 9.0, 0.0)
    )
    space_pad = chord_a * (1.0 - cross) + chord_b * cross
    space_wind = bp(pink_noise(rng, len(t)), 55.0, 240.0, order=2) * 0.09
    amb_space = warm_reverb(lp(space_pad + space_wind, 1150.0, order=3), mix=0.52, decay=0.85)
    write_wav(AUDIO_DIR / "amb_space_loop.wav", make_seamless_loop(amb_space, 1.3), peak=0.46)

    # 3. Velvety Ion Thruster Turbine Loop (deep sculpted pink noise + warm sub hum, zero hiss)
    t = np.linspace(0.0, 2.8, int(2.8 * SR), endpoint=False)
    pn = pink_noise(rng, len(t))
    thruster = (
        bp(pn, 55.0, 190.0, order=3) * 0.72
        + bp(pn, 190.0, 520.0, order=2) * 0.28 * (0.82 + 0.18 * np.sin(2.0 * np.pi * 2.0 * t))
        + 0.22 * np.sin(2.0 * np.pi * 68.0 * t)
        + 0.10 * np.sin(2.0 * np.pi * 136.0 * t)
    )
    write_wav(AUDIO_DIR / "sfx_thruster_loop.wav", make_seamless_loop(lp(thruster, 650.0), 0.45), peak=0.56)

    # 4. Warm Crystalline Mining Beam Loop (gentle harmonic resonance, zero piercing screech)
    t = np.linspace(0.0, 2.4, int(2.4 * SR), endpoint=False)
    lfo = 0.85 + 0.15 * np.sin(2.0 * np.pi * 5.0 * t)
    mining = (
        0.42 * warm_voice(t, 110.0, 6.0, 0.30)
        + 0.26 * warm_voice(t, 220.0, 9.0, 0.0) * lfo
        + 0.14 * np.sin(2.0 * np.pi * 329.63 * t) * lfo
        + 0.18 * bp(pink_noise(rng, len(t)), 180.0, 780.0, order=2)
    )
    write_wav(AUDIO_DIR / "sfx_mining_loop.wav", make_seamless_loop(lp(mining, 950.0), 0.35), peak=0.52)

    # 5. UI Sounds — ultra-pleasant, tactile, soft glass/marimba tones
    # Hover: whisper-soft muted tactile micro-tick (32 ms, lowpassed at 880 Hz, quiet peak)
    t = np.linspace(0.0, 0.042, int(0.042 * SR), endpoint=False)
    hover = (
        np.sin(2.0 * np.pi * (520.0 - 140.0 * (t / 0.042)) * t) * np.exp(-t * 115.0)
        + bp(pink_noise(rng, len(t)), 250.0, 900.0) * np.exp(-t * 180.0) * 0.25
    )
    write_wav(AUDIO_DIR / "sfx_ui_hover.wav", lp(hover, 920.0), peak=0.28)

    # Click: warm, crisp dual-harmonic velvet tap (A3 -> E4 gentle chime)
    t = np.linspace(0.0, 0.14, int(0.14 * SR), endpoint=False)
    click = (
        0.55 * np.sin(2.0 * np.pi * 330.0 * t) * np.exp(-t * 36.0)
        + 0.45 * np.sin(2.0 * np.pi * 493.88 * np.maximum(0.0, t - 0.014)) * (t >= 0.014) * np.exp(-np.maximum(0.0, t - 0.014) * 28.0)
        + 0.20 * np.sin(2.0 * np.pi * 165.0 * t) * np.exp(-t * 60.0)
    )
    write_wav(AUDIO_DIR / "sfx_ui_click.wav", warm_reverb(lp(click, 1450.0), mix=0.22, decay=0.55), peak=0.50)

    # Back: soft descending warm Rhodes two-note interval (E4 -> B3)
    t = np.linspace(0.0, 0.18, int(0.18 * SR), endpoint=False)
    back = (
        0.52 * warm_voice(t, 329.63, 4.0, 0.15) * np.exp(-t * 26.0)
        + 0.52 * warm_voice(np.maximum(0.0, t - 0.045), 246.94, 4.0, 0.20) * (t >= 0.045) * np.exp(-np.maximum(0.0, t - 0.045) * 22.0)
    )
    write_wav(AUDIO_DIR / "sfx_ui_back.wav", warm_reverb(lp(back, 1200.0), mix=0.24, decay=0.58), peak=0.48)

    # Error: gentle muted bass double-thump (ZERO square wave harshness!)
    t = np.linspace(0.0, 0.24, int(0.24 * SR), endpoint=False)
    err1 = warm_voice(t, 164.81, 5.0, 0.35) * np.exp(-t * 28.0)
    t2 = np.maximum(0.0, t - 0.095)
    err2 = warm_voice(t2, 130.81, 5.0, 0.40) * (t >= 0.095) * np.exp(-t2 * 24.0)
    write_wav(AUDIO_DIR / "sfx_ui_error.wav", warm_reverb(lp(err1 + err2, 680.0), mix=0.18, decay=0.45), peak=0.52)

    # 6. Ship Module Construction & Upgrades
    # Module Place: satisfying hydraulic-magnetic dock lock + upward warm chime
    t = np.linspace(0.0, 0.32, int(0.32 * SR), endpoint=False)
    thump = np.sin(2.0 * np.pi * (125.0 * np.exp(-t * 14.0) + 48.0) * t) * np.exp(-t * 18.0) * 0.70
    latch_t = np.maximum(0.0, t - 0.055)
    latch = (
        0.38 * warm_voice(latch_t, 293.66, 5.0, 0.0) * (t >= 0.055) * np.exp(-latch_t * 20.0)
        + 0.34 * warm_voice(np.maximum(0.0, t - 0.10), 440.0, 5.0, 0.0) * (t >= 0.10) * np.exp(-np.maximum(0.0, t - 0.10) * 18.0)
        + 0.25 * bp(pink_noise(rng, len(t)), 220.0, 1200.0) * np.exp(-t * 34.0)
    )
    write_wav(AUDIO_DIR / "sfx_module_place.wav", warm_reverb(lp(thump + latch, 1600.0), mix=0.25, decay=0.60), peak=0.64)

    # Module Remove: soft pneumatic air release + smooth downward servo
    t = np.linspace(0.0, 0.28, int(0.28 * SR), endpoint=False)
    servo = np.sin(2.0 * np.pi * (280.0 - 150.0 * (t / 0.28)) * t) * adsr_env(len(t), 0.01, 0.06, 0.5, 0.14) * 0.55
    pneu = bp(pink_noise(rng, len(t)), 280.0, 1300.0) * np.exp(-t * 14.0) * 0.38
    write_wav(AUDIO_DIR / "sfx_module_remove.wav", warm_reverb(lp(servo + pneu, 1400.0), mix=0.22, decay=0.55), peak=0.54)

    # Buy / Upgrade: lush celestial Rhodes/celesta major-9th arpeggio (C4-E4-G4-B4-D5)
    t = np.linspace(0.0, 0.72, int(0.72 * SR), endpoint=False)
    arp = np.zeros_like(t)
    for idx, freq in enumerate([261.63, 329.63, 392.00, 493.88, 587.33]):
        t0 = idx * 0.065
        dt = np.maximum(0.0, t - t0)
        arp += (t >= t0) * warm_voice(dt, freq, 6.0, 0.15) * np.exp(-dt * 7.5) * 0.34
    write_wav(AUDIO_DIR / "sfx_buy_upgrade.wav", warm_reverb(lp(arp, 2400.0), mix=0.38, decay=0.78), peak=0.62)

    # Resource Pickup: warm kalimba/harp harmonic double-pluck (D4 -> A4)
    t = np.linspace(0.0, 0.26, int(0.26 * SR), endpoint=False)
    p1 = warm_voice(t, 293.66, 5.0, 0.2) * np.exp(-t * 20.0) * 0.55
    dt2 = np.maximum(0.0, t - 0.045)
    p2 = (t >= 0.045) * warm_voice(dt2, 440.00, 5.0, 0.1) * np.exp(-dt2 * 16.0) * 0.50
    write_wav(AUDIO_DIR / "sfx_pickup_resource.wav", warm_reverb(lp(p1 + p2, 1850.0), mix=0.32, decay=0.68), peak=0.50)

    # 7. Weapons & Combat — punchy cinematic low-mid body, silky filtered highs
    # Autocannon: deep punchy kinetic thump (zero tinny crackle)
    t = np.linspace(0.0, 0.15, int(0.15 * SR), endpoint=False)
    mg_body = np.sin(2.0 * np.pi * (145.0 * np.exp(-t * 28.0) + 46.0) * t) * np.exp(-t * 26.0) * 0.80
    mg_mech = bp(pink_noise(rng, len(t)), 140.0, 1100.0) * np.exp(-t * 42.0) * 0.48
    write_wav(AUDIO_DIR / "sfx_mg_shot.wav", warm_reverb(lp(mg_body + mg_mech, 1350.0), mix=0.16, decay=0.45), peak=0.62)

    # Pulse Laser: warm sci-fi blaster (smooth 520 -> 115 Hz sweep + sub thump, never shrill!)
    t = np.linspace(0.0, 0.20, int(0.20 * SR), endpoint=False)
    phase = 2.0 * np.pi * (115.0 * t + (410.0 / 22.0) * (1.0 - np.exp(-22.0 * t)))
    laser = (0.68 * np.sin(phase) + 0.24 * np.sin(phase * 1.5)) * np.exp(-t * 18.0)
    laser += 0.30 * np.sin(2.0 * np.pi * 78.0 * t) * np.exp(-t * 28.0)
    write_wav(AUDIO_DIR / "sfx_laser_shot.wav", warm_reverb(lp(laser, 1500.0), mix=0.22, decay=0.52), peak=0.58)

    # Plasma Cannon: deep magnetic plasma bolt whoomp
    t = np.linspace(0.0, 0.36, int(0.36 * SR), endpoint=False)
    p_ph = 2.0 * np.pi * (68.0 * t + (220.0 / 12.0) * (1.0 - np.exp(-12.0 * t)))
    plasma = (
        0.65 * np.sin(p_ph) * np.exp(-t * 9.5)
        + 0.32 * warm_voice(t, 136.0, 14.0, 0.3) * np.exp(-t * 11.0)
        + 0.30 * bp(pink_noise(rng, len(t)), 90.0, 680.0) * np.exp(-t * 12.0)
    )
    write_wav(AUDIO_DIR / "sfx_plasma_shot.wav", warm_reverb(lp(plasma, 1100.0), mix=0.28, decay=0.65), peak=0.66)

    # Rocket / Seeker Missile Launch: ignition bass thump + velvety propellant whoosh
    t = np.linspace(0.0, 0.52, int(0.52 * SR), endpoint=False)
    ign = np.sin(2.0 * np.pi * (110.0 * np.exp(-t * 16.0) + 42.0) * t) * np.exp(-t * 14.0) * 0.55
    whoosh = bp(pink_noise(rng, len(t)), 130.0, 920.0) * adsr_env(len(t), 0.03, 0.10, 0.55, 0.25) * 0.72
    write_wav(AUDIO_DIR / "sfx_rocket_launch.wav", warm_reverb(lp(ign + whoosh, 1250.0), mix=0.30, decay=0.68), peak=0.64)

    # Hypervelocity Railgun: deep sub drop + harmonic electromagnetic ring + cavern tail
    t = np.linspace(0.0, 0.68, int(0.68 * SR), endpoint=False)
    rail_sub = np.sin(2.0 * np.pi * (240.0 * np.exp(-t * 18.0) + 38.0) * t) * np.exp(-t * 7.5) * 0.78
    rail_ring = warm_voice(t, 220.0, 12.0, 0.0) * np.exp(-t * 9.0) * 0.32
    rail_air = bp(pink_noise(rng, len(t)), 120.0, 1400.0) * np.exp(-t * 16.0) * 0.45
    write_wav(AUDIO_DIR / "sfx_railgun_shot.wav", warm_reverb(lp(rail_sub + rail_ring + rail_air, 1750.0), mix=0.40, decay=0.80), peak=0.74)

    # Shield Hit: liquid phase-modulated energy barrier ripple
    t = np.linspace(0.0, 0.34, int(0.34 * SR), endpoint=False)
    sh = (
        0.55 * warm_voice(t, 196.0, 15.0, 0.35) * (0.7 + 0.3 * np.sin(2.0 * np.pi * 18.0 * t)) * np.exp(-t * 10.5)
        + 0.30 * warm_voice(t, 293.66, 12.0, 0.0) * np.exp(-t * 13.0)
    )
    write_wav(AUDIO_DIR / "sfx_shield_hit.wav", warm_reverb(lp(sh, 1300.0), mix=0.36, decay=0.70), peak=0.60)

    # Asteroid Break: deep rock fracture + warm crystalline chime scatter
    t = np.linspace(0.0, 0.65, int(0.65 * SR), endpoint=False)
    rock_sub = np.sin(2.0 * np.pi * (92.0 * np.exp(-t * 9.0) + 32.0) * t) * np.exp(-t * 6.5) * 0.75
    rock_crumble = bp(pink_noise(rng, len(t)), 65.0, 620.0) * np.exp(-t * 5.8) * 0.65
    sparkle = (
        0.18 * warm_voice(np.maximum(0.0, t - 0.04), 523.25, 6.0, 0.0) * (t >= 0.04) * np.exp(-np.maximum(0.0, t - 0.04) * 12.0)
        + 0.15 * warm_voice(np.maximum(0.0, t - 0.11), 659.25, 6.0, 0.0) * (t >= 0.11) * np.exp(-np.maximum(0.0, t - 0.11) * 11.0)
    )
    write_wav(AUDIO_DIR / "sfx_asteroid_break.wav", warm_reverb(lp(rock_sub + rock_crumble + sparkle, 1650.0), mix=0.35, decay=0.76), peak=0.70)

    # Ship / Enemy Explosion: cinematic sub-bass boom + warm rolling rumble
    t = np.linspace(0.0, 0.95, int(0.95 * SR), endpoint=False)
    boom = np.sin(2.0 * np.pi * (86.0 * np.exp(-t * 7.5) + 26.0) * t) * np.exp(-t * 4.5) * 0.85
    rumble = bp(pink_noise(rng, len(t)), 42.0, 480.0) * np.exp(-t * 3.8) * 0.75
    write_wav(AUDIO_DIR / "sfx_explosion.wav", warm_reverb(lp(boom + rumble, 900.0), mix=0.42, decay=0.84), peak=0.76)

    # 8. Card Pack Ceremony — lush orchestral-synth wonder
    # Pack Open: warm rising harmonic swell into radiant Fmaj9 chord
    t = np.linspace(0.0, 1.35, int(1.35 * SR), endpoint=False)
    swell_f = 130.81 * (2.0 ** (np.minimum(1.0, t / 0.58)))
    ph_sw = 2.0 * np.pi * np.cumsum(swell_f) / SR
    swell = (0.45 * np.sin(ph_sw) + 0.25 * np.sin(ph_sw * 1.5)) * adsr_env(len(t), 0.08, 0.25, 0.5, 0.55) * (t < 0.72)
    burst_t = np.maximum(0.0, t - 0.54)
    burst_mask = (t >= 0.54).astype(np.float64)
    chord_burst = burst_mask * (
        0.34 * warm_voice(burst_t, 174.61, 8.0, 0.25)
        + 0.28 * warm_voice(burst_t, 261.63, 9.0, 0.0)
        + 0.24 * warm_voice(burst_t, 329.63, 10.0, 0.0)
        + 0.20 * warm_voice(burst_t, 392.00, 10.0, 0.0)
        + 0.16 * warm_voice(burst_t, 523.25, 8.0, 0.0)
    ) * np.exp(-burst_t * 3.2)
    write_wav(AUDIO_DIR / "sfx_pack_open.wav", warm_reverb(lp(swell + chord_burst, 2400.0), mix=0.48, decay=0.85), peak=0.68)

    # Card Flip: silky air whoosh + soft celesta bell
    t = np.linspace(0.0, 0.28, int(0.28 * SR), endpoint=False)
    flip_air = bp(pink_noise(rng, len(t)), 240.0, 1450.0) * np.sin(np.pi * np.minimum(1.0, t / 0.16)) * (t < 0.16) * 0.42
    dt_b = np.maximum(0.0, t - 0.05)
    flip_bell = (t >= 0.05) * warm_voice(dt_b, 440.0, 6.0, 0.15) * np.exp(-dt_b * 14.0) * 0.52
    write_wav(AUDIO_DIR / "sfx_card_flip.wav", warm_reverb(lp(flip_air + flip_bell, 2000.0), mix=0.34, decay=0.68), peak=0.54)

    # Legendary / Mythic Fanfare: grand warm Cmaj9 brass-synth chord + sparkling bell cascade
    t = np.linspace(0.0, 1.80, int(1.80 * SR), endpoint=False)
    fanfare = (
        0.32 * warm_voice(t, 130.81, 8.0, 0.30)
        + 0.26 * warm_voice(t, 196.00, 9.0, 0.0)
        + 0.22 * warm_voice(t, 246.94, 10.0, 0.0)
        + 0.20 * warm_voice(t, 293.66, 11.0, 0.0)
        + 0.18 * warm_voice(t, 392.00, 9.0, 0.0)
    ) * adsr_env(len(t), 0.04, 0.30, 0.65, 0.85)
    for i, f_sp in enumerate([523.25, 659.25, 783.99, 987.77]):
        t0 = 0.08 + i * 0.085
        dt = np.maximum(0.0, t - t0)
        fanfare += (t >= t0) * warm_voice(dt, f_sp, 5.0, 0.0) * np.exp(-dt * 4.2) * 0.16
    write_wav(AUDIO_DIR / "sfx_card_legendary.wav", warm_reverb(lp(fanfare, 2600.0), mix=0.50, decay=0.88), peak=0.72)


if __name__ == "__main__":
    generate_branding()
    generate_audio()
    print("Generated studio 44.1 kHz audio & branding assets successfully.")
