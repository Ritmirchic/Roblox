#!/usr/bin/env python3
"""
Generates original branding artwork (Windows .ico, PNG icon, 1920x1080 boot splash,
main menu logo, Inno Setup wizard bitmaps, third-party license notice) and
22 synthesized 16-bit PCM sci-fi WAV sound effects & seamless ambient loops.
"""
import math
import struct
import wave
from pathlib import Path
import numpy as np
from scipy import signal
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BRAND_DIR = ROOT / "assets" / "branding"
AUDIO_DIR = ROOT / "assets" / "audio"
FONT_DIR = ROOT / "assets" / "fonts"


def load_font(name: str, size: int, bold_var: bool = False) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT_DIR / name), size)
    if bold_var:
        try:
            f.set_variation_by_axes([800])
        except Exception:
            pass
    return f


def generate_branding() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Custom 512x512 -> 256x256 Icon + Multi-size Windows .ico
    # ------------------------------------------------------------------
    sz = 512
    icon = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)

    cx, cy = sz // 2, sz // 2
    # Outer beveled hexagon badge
    def hex_pts(radius: float, rot_deg: float = -30.0):
        return [
            (
                cx + radius * math.cos(math.radians(rot_deg + 60 * i)),
                cy + radius * math.sin(math.radians(rot_deg + 60 * i)),
            )
            for i in range(6)
        ]

    draw.polygon(hex_pts(244), fill=(12, 20, 38, 255), outline=(45, 210, 255, 255))
    draw.polygon(hex_pts(230), fill=(8, 13, 28, 255), outline=(255, 185, 50, 220))
    draw.polygon(hex_pts(216), fill=(6, 10, 24, 255))

    # Cosmic nebula glow inside icon
    neb = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    nd = ImageDraw.Draw(neb)
    nd.ellipse((90, 110, 420, 410), fill=(18, 95, 165, 110))
    nd.ellipse((210, 80, 430, 300), fill=(140, 45, 210, 95))
    nd.ellipse((110, 250, 310, 430), fill=(255, 145, 30, 80))
    neb = neb.filter(ImageFilter.GaussianBlur(28))
    # Mask nebula to inner hex
    mask = Image.new("L", (sz, sz), 0)
    ImageDraw.Draw(mask).polygon(hex_pts(214), fill=255)
    icon = Image.composite(Image.alpha_composite(icon, neb), icon, mask)
    draw = ImageDraw.Draw(icon)

    # Crystalline asteroid in upper-right quadrant
    ast_pts = [(305, 105), (382, 118), (418, 178), (392, 242), (326, 254), (278, 205), (274, 142)]
    draw.polygon(ast_pts, fill=(48, 54, 72, 255), outline=(110, 130, 165, 255))
    # Glowing cyan/gold crystal shards jutting out
    crystals = [
        ([(330, 130), (368, 86), (376, 142)], (50, 235, 255, 255)),
        ([(368, 156), (430, 145), (394, 192)], (0, 200, 255, 255)),
        ([(305, 170), (344, 148), (336, 202)], (255, 195, 55, 255)),
    ]
    for pts, col in crystals:
        draw.polygon(pts, fill=col, outline=(230, 250, 255, 255))

    # Mining laser beam from ship to asteroid
    beam_layer = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    bd = ImageDraw.Draw(beam_layer)
    bd.line([(235, 255), (338, 176)], fill=(0, 225, 255, 160), width=26)
    bd.line([(235, 255), (338, 176)], fill=(215, 252, 255, 255), width=9)
    bd.ellipse((312, 150, 364, 202), fill=(180, 250, 255, 230))
    icon = Image.alpha_composite(icon, beam_layer.filter(ImageFilter.GaussianBlur(3)))
    draw = ImageDraw.Draw(icon)
    draw.line([(235, 255), (338, 176)], fill=(240, 255, 255, 255), width=5)

    # Modular Mining Corvette silhouette in lower-left flying toward upper-right
    # Thruster flare
    flare = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flare)
    fd.polygon([(125, 365), (72, 415), (156, 392)], fill=(255, 140, 25, 235))
    fd.polygon([(132, 368), (96, 398), (150, 384)], fill=(255, 240, 180, 255))
    icon = Image.alpha_composite(icon, flare.filter(ImageFilter.GaussianBlur(2)))
    draw = ImageDraw.Draw(icon)

    # Ship wings / modular pods
    draw.polygon([(115, 315), (195, 245), (218, 272), (142, 345)], fill=(52, 74, 108, 255), outline=(140, 190, 240, 255))
    draw.polygon([(170, 372), (250, 302), (225, 278), (144, 348)], fill=(42, 60, 92, 255), outline=(120, 175, 230, 255))
    # Main central fuselage & armored nose
    draw.polygon(
        [(122, 362), (165, 290), (268, 224), (286, 242), (222, 342), (152, 388)],
        fill=(215, 226, 242, 255),
        outline=(55, 95, 140, 255),
    )
    # Gold industrial hazard trim
    draw.polygon([(168, 304), (226, 262), (238, 274), (180, 316)], fill=(245, 178, 38, 255))
    # Glowing cyan cockpit canopy
    draw.polygon([(214, 274), (258, 242), (266, 252), (226, 288)], fill=(35, 230, 255, 255), outline=(220, 255, 255, 255))

    # Crisp outer hex border highlight
    draw.polygon(hex_pts(244), outline=(65, 220, 255, 255), width=6)
    draw.polygon(hex_pts(232), outline=(255, 185, 55, 210), width=3)

    icon_256 = icon.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(BRAND_DIR / "icon_256.png")
    icon.save(
        BRAND_DIR / "icon.ico",
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )

    # ------------------------------------------------------------------
    # 2. Main Logo (1200 x 340 transparent PNG)
    # ------------------------------------------------------------------
    logo = Image.new("RGBA", (1200, 340), (0, 0, 0, 0))
    logo.alpha_composite(icon.resize((260, 260), Image.Resampling.LANCZOS), (30, 40))
    ld = ImageDraw.Draw(logo)

    f_title = load_font("Orbitron-Bold.ttf", 84, bold_var=True)
    f_sub = load_font("Rajdhani-Bold.ttf", 44)

    # Glow behind title
    glow = Image.new("RGBA", (1200, 340), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((315, 78), "SPACE MINER", font=f_title, fill=(0, 210, 255, 180))
    gd.text((320, 188), "BUILD  &  CONQUER", font=f_sub, fill=(255, 180, 40, 160))
    logo = Image.alpha_composite(logo, glow.filter(ImageFilter.GaussianBlur(10)))
    ld = ImageDraw.Draw(logo)

    # Accent tech bar
    ld.rectangle((318, 174, 1140, 178), fill=(45, 215, 255, 220))
    ld.rectangle((318, 174, 560, 180), fill=(255, 185, 45, 255))

    ld.text((315, 78), "SPACE MINER", font=f_title, fill=(238, 248, 255, 255))
    ld.text((320, 190), "BUILD  &  CONQUER", font=f_sub, fill=(255, 196, 68, 255))
    logo.save(BRAND_DIR / "logo_main.png")

    # ------------------------------------------------------------------
    # 3. 1920x1080 Custom Boot Splash Screen
    # ------------------------------------------------------------------
    w, h = 1920, 1080
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx - w * 0.5) / (w * 0.5)
    ny = (yy - h * 0.5) / (h * 0.5)
    rad = np.sqrt(nx * nx + ny * ny)

    # Deep space procedural nebula backdrop
    r = np.clip(6 + 26 * np.exp(-((nx - 0.28) ** 2 + (ny + 0.15) ** 2) * 3.5) + 38 * np.exp(-((nx + 0.35) ** 2 + (ny - 0.25) ** 2) * 4.0), 0, 255)
    g = np.clip(10 + 58 * np.exp(-((nx - 0.2) ** 2 + (ny + 0.1) ** 2) * 3.2) + 22 * (1.0 - np.clip(rad, 0, 1)), 0, 255)
    b = np.clip(24 + 115 * np.exp(-((nx - 0.18) ** 2 + (ny + 0.12) ** 2) * 2.8) + 70 * np.exp(-((nx + 0.35) ** 2 + (ny - 0.2) ** 2) * 3.5), 0, 255)
    arr = np.stack([r, g, b, np.full_like(r, 255)], axis=-1).astype(np.uint8)

    rng = np.random.default_rng(4201)
    for _ in range(900):
        sx = int(rng.integers(0, w))
        sy = int(rng.integers(0, h))
        br = int(rng.integers(130, 255))
        arr[max(0, sy - 1):min(h, sy + 2), max(0, sx - 1):min(w, sx + 2), :3] = np.maximum(
            arr[max(0, sy - 1):min(h, sy + 2), max(0, sx - 1):min(w, sx + 2), :3],
            br if rng.random() > 0.3 else int(br * 0.7),
        )

    splash = Image.fromarray(arr, mode="RGBA")
    sd = ImageDraw.Draw(splash)

    # Subtle sci-fi HUD corner brackets
    bracket_col = (45, 205, 255, 150)
    for bx, by, sx_dir, sy_dir in [(60, 60, 1, 1), (w - 60, 60, -1, 1), (60, h - 60, 1, -1), (w - 60, h - 60, -1, -1)]:
        sd.line([(bx, by), (bx + sx_dir * 120, by)], fill=bracket_col, width=3)
        sd.line([(bx, by), (bx, by + sy_dir * 80)], fill=bracket_col, width=3)

    # Center logo + initializing telemetry bar
    splash.alpha_composite(logo, ((w - 1200) // 2, 310))
    f_boot = load_font("ShareTechMono-Regular.ttf", 26)
    sd.rectangle((660, 720, 1260, 726), fill=(25, 55, 85, 220))
    sd.rectangle((660, 720, 1080, 726), fill=(45, 220, 255, 255))
    sd.text((712, 744), "INITIALIZING ORBITAL HANGAR & SHIP CORE...", font=f_boot, fill=(155, 215, 245, 230))
    splash.convert("RGB").save(BRAND_DIR / "boot_splash.png", quality=95)

    # ------------------------------------------------------------------
    # 4. Inno Setup Wizard Bitmaps (.bmp)
    # ------------------------------------------------------------------
    wiz_large = splash.crop((420, 0, 920, 1080)).resize((164, 314), Image.Resampling.LANCZOS).convert("RGB")
    wiz_large.save(BRAND_DIR / "installer_banner.bmp")
    wiz_small = Image.new("RGB", (55, 55), (10, 16, 32))
    wiz_small.paste(icon.resize((51, 51), Image.Resampling.LANCZOS), (2, 2), icon.resize((51, 51), Image.Resampling.LANCZOS))
    wiz_small.save(BRAND_DIR / "installer_small.bmp")

    # ------------------------------------------------------------------
    # 5. Legal Third-Party License Notice
    # ------------------------------------------------------------------
    licenses_text = """SPACE MINER: BUILD & CONQUER — THIRD-PARTY SOFTWARE & FONT NOTICES
====================================================================

1. GODOT ENGINE
This game uses Godot Engine, available under the following license:

Copyright (c) 2014-present Godot Engine contributors.
Copyright (c) 2007-2014 Juan Linietsky, Ariel Manzur.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

2. FREETYPE
Portions of this software are copyright (c) 1996-2024 The FreeType Project
(www.freetype.org). All rights reserved.

3. MBED TLS
Copyright The Mbed TLS Contributors. Licensed under the Apache License 2.0.

4. FONTS (SIL OPEN FONT LICENSE 1.1)
- Orbitron: Copyright (c) Matt McInerney, licensed under SIL Open Font License 1.1.
- Rajdhani: Copyright (c) Indian Type Foundry, licensed under SIL Open Font License 1.1.
- Share Tech Mono: Copyright (c) Carrois Corporate & Edenspiekermann AG, SIL OFL 1.1.
"""
    (ROOT / "THIRDPARTY_LICENSES.txt").write_text(licenses_text, encoding="utf-8")


def save_wav(path: Path, samples: np.ndarray, sr: int = 22050) -> None:
    peak = np.max(np.abs(samples))
    if peak > 1e-6:
        samples = samples / max(1.0, peak)
    pcm = np.clip(samples * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def env_adsr(n: int, sr: int, a: float, d: float, s_lvl: float, r: float) -> np.ndarray:
    na = max(1, int(a * sr))
    nd = max(1, int(d * sr))
    nr = max(1, int(r * sr))
    ns = max(0, n - na - nd - nr)
    parts = [
        np.linspace(0.0, 1.0, na, endpoint=False),
        np.linspace(1.0, s_lvl, nd, endpoint=False),
        np.full(ns, s_lvl),
        np.linspace(s_lvl, 0.0, max(1, n - na - nd - ns)),
    ]
    out = np.concatenate(parts)
    return out[:n]


def lowpass(sig: np.ndarray, cutoff: float, sr: int = 22050) -> np.ndarray:
    wn = min(0.95, max(0.01, cutoff / (sr * 0.5)))
    b, a = signal.butter(2, wn, btype="low")
    return signal.lfilter(b, a, sig)


def generate_audio() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    sr = 22050
    rng = np.random.default_rng(9001)

    # 1. Seamless Hangar Industrial Loop (6.0s) — integer harmonics for exact loop
    dur = 6.0
    n = int(dur * sr)
    t = np.arange(n) / sr
    hangar = (
        0.22 * np.sin(2 * np.pi * 55.0 * t)
        + 0.14 * np.sin(2 * np.pi * 110.0 * t + 0.4 * np.sin(2 * np.pi * (1.0 / dur) * t))
        + 0.08 * np.sin(2 * np.pi * 165.0 * t)
        + 0.04 * np.sin(2 * np.pi * 220.0 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (2.0 / dur) * t))
    )
    save_wav(AUDIO_DIR / "amb_hangar_loop.wav", hangar * 0.55, sr)

    # 2. Seamless Deep Space Ambient Pad Loop (8.0s)
    dur = 8.0
    n = int(dur * sr)
    t = np.arange(n) / sr
    space = np.zeros(n)
    for freq, amp, mod_k in [(110.0, 0.22, 1), (165.0, 0.18, 2), (220.0, 0.14, 1), (261.625, 0.11, 3), (329.625, 0.09, 2)]:
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (mod_k / dur) * t)
        space += amp * lfo * np.sin(2 * np.pi * freq * t + 0.25 * np.sin(2 * np.pi * (1.0 / dur) * t))
    # Crossfade loop seam
    fade = int(0.25 * sr)
    space[:fade] = space[:fade] * np.linspace(0, 1, fade) + space[-fade:] * np.linspace(1, 0, fade)
    save_wav(AUDIO_DIR / "amb_space_loop.wav", space * 0.6, sr)

    # 3. Thruster Loop (2.0s)
    dur = 2.0
    n = int(dur * sr)
    t = np.arange(n) / sr
    noise = lowpass(rng.standard_normal(n), 260.0, sr)
    fade = int(0.15 * sr)
    noise[:fade] = noise[:fade] * np.linspace(0, 1, fade) + noise[-fade:] * np.linspace(1, 0, fade)
    thruster = 0.55 * noise + 0.25 * np.sin(2 * np.pi * 68.0 * t) + 0.14 * np.sin(2 * np.pi * 136.0 * t)
    save_wav(AUDIO_DIR / "sfx_thruster_loop.wav", thruster * 0.65, sr)

    # 4. Mining Beam Loop (1.5s)
    dur = 1.5
    n = int(dur * sr)
    t = np.arange(n) / sr
    mining = (
        0.30 * np.sin(2 * np.pi * 180.0 * t + 1.8 * np.sin(2 * np.pi * 36.0 * t))
        + 0.20 * np.sin(2 * np.pi * 420.0 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 18.0 * t))
        + 0.15 * lowpass(rng.standard_normal(n), 1400.0, sr)
    )
    fade = int(0.08 * sr)
    mining[:fade] = mining[:fade] * np.linspace(0, 1, fade) + mining[-fade:] * np.linspace(1, 0, fade)
    save_wav(AUDIO_DIR / "sfx_mining_loop.wav", mining * 0.65, sr)

    # 5. UI Hover, Click, Back, Error
    t = np.arange(int(0.055 * sr)) / sr
    save_wav(AUDIO_DIR / "sfx_ui_hover.wav", 0.35 * np.sin(2 * np.pi * 1280 * t) * np.exp(-t * 55), sr)

    t = np.arange(int(0.11 * sr)) / sr
    click = (0.45 * np.sin(2 * np.pi * 880 * t) + 0.35 * np.sin(2 * np.pi * 1760 * t)) * np.exp(-t * 32)
    save_wav(AUDIO_DIR / "sfx_ui_click.wav", click, sr)

    t = np.arange(int(0.13 * sr)) / sr
    back = 0.45 * np.sin(2 * np.pi * (720 - 2400 * t) * t) * np.exp(-t * 24)
    save_wav(AUDIO_DIR / "sfx_ui_back.wav", back, sr)

    t = np.arange(int(0.22 * sr)) / sr
    err = 0.5 * (np.sign(np.sin(2 * np.pi * 165 * t)) * 0.4 + np.sin(2 * np.pi * 155 * t) * 0.6) * env_adsr(len(t), sr, 0.005, 0.05, 0.6, 0.12)
    save_wav(AUDIO_DIR / "sfx_ui_error.wav", lowpass(err, 900, sr), sr)

    # 6. Module Place & Remove & Upgrade Chime
    t = np.arange(int(0.24 * sr)) / sr
    place = (
        0.6 * lowpass(rng.standard_normal(len(t)), 500, sr) * np.exp(-t * 28)
        + 0.45 * np.sin(2 * np.pi * 520 * t) * np.exp(-t * 18)
        + 0.35 * np.sin(2 * np.pi * 1040 * np.maximum(0, t - 0.06)) * (t > 0.06) * np.exp(-np.maximum(0, t - 0.06) * 22)
    )
    save_wav(AUDIO_DIR / "sfx_module_place.wav", place, sr)

    t = np.arange(int(0.20 * sr)) / sr
    rem = (0.4 * lowpass(rng.standard_normal(len(t)), 1800, sr) + 0.4 * np.sin(2 * np.pi * (480 - 1100 * t) * t)) * np.exp(-t * 16)
    save_wav(AUDIO_DIR / "sfx_module_remove.wav", rem, sr)

    t = np.arange(int(0.45 * sr)) / sr
    upg = np.zeros_like(t)
    for delay, freq in [(0.0, 523.25), (0.08, 659.25), (0.16, 783.99), (0.24, 1046.50)]:
        dt = np.maximum(0.0, t - delay)
        upg += 0.35 * (t >= delay) * np.sin(2 * np.pi * freq * dt) * np.exp(-dt * 9.0)
    save_wav(AUDIO_DIR / "sfx_buy_upgrade.wav", upg, sr)

    # 7. Asteroid Break & Resource Pickup
    t = np.arange(int(0.55 * sr)) / sr
    brk = (
        0.75 * lowpass(rng.standard_normal(len(t)), 420, sr) * np.exp(-t * 6.5)
        + 0.45 * np.sin(2 * np.pi * (120 * np.exp(-t * 4)) * t) * np.exp(-t * 7.0)
        + 0.25 * np.sin(2 * np.pi * 1480 * t) * np.exp(-t * 16.0)
    )
    save_wav(AUDIO_DIR / "sfx_asteroid_break.wav", brk, sr)

    t = np.arange(int(0.22 * sr)) / sr
    pick = (
        0.45 * np.sin(2 * np.pi * 1174.66 * t) * np.exp(-t * 18)
        + 0.40 * np.sin(2 * np.pi * 1567.98 * np.maximum(0, t - 0.05)) * (t >= 0.05) * np.exp(-np.maximum(0, t - 0.05) * 16)
    )
    save_wav(AUDIO_DIR / "sfx_pickup_resource.wav", pick, sr)

    # 8. Weapons: MG, Laser, Plasma, Rocket, Railgun, Shield Hit, Explosion
    t = np.arange(int(0.11 * sr)) / sr
    mg = (0.7 * lowpass(rng.standard_normal(len(t)), 1600, sr) + 0.5 * np.sin(2 * np.pi * (240 * np.exp(-t * 18)) * t)) * np.exp(-t * 28)
    save_wav(AUDIO_DIR / "sfx_mg_shot.wav", mg, sr)

    t = np.arange(int(0.18 * sr)) / sr
    freq_sweep = 1650.0 * np.exp(-t * 14.0) + 180.0
    laser = 0.65 * np.sin(2 * np.pi * np.cumsum(freq_sweep) / sr) * np.exp(-t * 14.0)
    save_wav(AUDIO_DIR / "sfx_laser_shot.wav", laser, sr)

    t = np.arange(int(0.28 * sr)) / sr
    f_pl = 680.0 * np.exp(-t * 8.0) + 110.0
    plasma = (0.55 * np.sin(2 * np.pi * np.cumsum(f_pl) / sr + 2.0 * np.sin(2 * np.pi * 55 * t)) + 0.25 * lowpass(rng.standard_normal(len(t)), 900, sr)) * np.exp(-t * 9.5)
    save_wav(AUDIO_DIR / "sfx_plasma_shot.wav", plasma, sr)

    t = np.arange(int(0.45 * sr)) / sr
    rocket = (0.65 * lowpass(rng.standard_normal(len(t)), 1200, sr) + 0.3 * np.sin(2 * np.pi * (190 + 260 * t) * t)) * env_adsr(len(t), sr, 0.02, 0.08, 0.55, 0.25)
    save_wav(AUDIO_DIR / "sfx_rocket_launch.wav", rocket, sr)

    t = np.arange(int(0.50 * sr)) / sr
    rail = (
        0.75 * np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-t * 12) + 65) / sr) * np.exp(-t * 7.5)
        + 0.65 * lowpass(rng.standard_normal(len(t)), 2400, sr) * np.exp(-t * 11.0)
    )
    save_wav(AUDIO_DIR / "sfx_railgun_shot.wav", rail, sr)

    t = np.arange(int(0.24 * sr)) / sr
    shld = (0.5 * np.sin(2 * np.pi * 920 * t + 3.0 * np.sin(2 * np.pi * 110 * t)) + 0.3 * np.sin(2 * np.pi * 1840 * t)) * np.exp(-t * 13.0)
    save_wav(AUDIO_DIR / "sfx_shield_hit.wav", shld, sr)

    t = np.arange(int(0.85 * sr)) / sr
    expl = (
        0.85 * lowpass(rng.standard_normal(len(t)), 340, sr) * np.exp(-t * 4.2)
        + 0.55 * np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 3.5) + 28) / sr) * np.exp(-t * 4.5)
    )
    save_wav(AUDIO_DIR / "sfx_explosion.wav", expl, sr)

    # 9. Card Pack Open, Card Flip, Legendary/Mythic Reveal Stinger
    t = np.arange(int(0.95 * sr)) / sr
    swell = 0.5 * np.sin(2 * np.pi * np.cumsum(220 + 680 * (t ** 1.6)) / sr) * env_adsr(len(t), sr, 0.45, 0.1, 0.7, 0.35)
    burst = (t > 0.48) * 0.65 * lowpass(rng.standard_normal(len(t)), 2800, sr) * np.exp(-np.maximum(0, t - 0.48) * 9.0)
    save_wav(AUDIO_DIR / "sfx_pack_open.wav", swell + burst, sr)

    t = np.arange(int(0.18 * sr)) / sr
    flip = (0.45 * lowpass(rng.standard_normal(len(t)), 3200, sr) + 0.35 * np.sin(2 * np.pi * (600 + 1800 * t) * t)) * env_adsr(len(t), sr, 0.02, 0.05, 0.4, 0.09)
    save_wav(AUDIO_DIR / "sfx_card_flip.wav", flip, sr)

    t = np.arange(int(1.35 * sr)) / sr
    fanfare = np.zeros_like(t)
    for delay, freq, amp in [
        (0.00, 523.25, 0.30),
        (0.09, 659.25, 0.30),
        (0.18, 783.99, 0.32),
        (0.28, 1046.50, 0.42),
        (0.28, 1318.51, 0.28),
        (0.28, 1567.98, 0.25),
    ]:
        dt = np.maximum(0.0, t - delay)
        fanfare += amp * (t >= delay) * (np.sin(2 * np.pi * freq * dt) + 0.3 * np.sin(4 * np.pi * freq * dt)) * np.exp(-dt * 2.8)
    save_wav(AUDIO_DIR / "sfx_card_legendary.wav", fanfare, sr)


if __name__ == "__main__":
    generate_branding()
    generate_audio()
    print("Branding and 22 WAV audio files generated successfully.")
