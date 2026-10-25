#!/usr/bin/env python3
"""
Generates all original 2D illustrations and UI iconography for
SPACE MINER: BUILD & CONQUER:
- 42 unique Crew Card portrait illustrations (assets/cards/crew/crew_01..42.png)
- Card back + Standard & Elite Booster Pack art + 7 Rarity frame overlays
- 30 unique Collectible Achievement Card illustrations (assets/cards/achievements/ach_01..30.png)
- 18 Active Upgrade tech icons (assets/icons/upgrades/upg_01..18.png)
- 28 Custom sci-fi vector UI icons (assets/icons/ui/*.png)
- 27 Isometric 3D-rendered Equipment thumbnails directly from the .glb models (assets/icons/equip/*.png)
"""
import io
import math
from pathlib import Path
from typing import Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import pygltflib

ROOT = Path(__file__).resolve().parent.parent
CARDS_DIR = ROOT / "assets" / "cards"
ICONS_DIR = ROOT / "assets" / "icons"
MODELS_DIR = ROOT / "assets" / "models"
FONT_DIR = ROOT / "assets" / "fonts"
PREVIEW_DIR = ROOT / "preview_renders"

RARITY_PALETTES = {
    "Common": ((135, 152, 172), (32, 42, 58), (190, 208, 225)),
    "Uncommon": ((52, 215, 132), (16, 48, 36), (140, 255, 195)),
    "Rare": ((48, 175, 255), (14, 38, 76), (145, 225, 255)),
    "Epic": ((185, 82, 255), (42, 16, 74), (228, 165, 255)),
    "Legendary": ((255, 188, 38), (68, 42, 10), (255, 238, 145)),
    "Mythic": ((55, 245, 235), (46, 14, 68), (255, 120, 245)),
    "Secret": ((255, 52, 112), (24, 8, 28), (255, 215, 95)),
}

CREW_SPECS = [
    # (idx 1..42, role, rarity, visor_style, head_style, prop_style, accent_hue_shift)
    (1, "Miner", "Common", "cage", "round", "drill", 0),
    (2, "Pilot", "Common", "visor_wide", "sleek", "wings", 1),
    (3, "Engineer", "Common", "goggles", "industrial", "wrench_servo", 2),
    (4, "Gunner", "Common", "slit", "heavy", "cannon", 3),
    (5, "Collector", "Common", "dome", "round", "magnet", 4),
    (6, "Navigator", "Common", "astrolabe", "sleek", "starmap", 5),
    (7, "Miner", "Common", "dual_lamp", "industrial", "pick_laser", 6),
    (8, "Engineer", "Common", "monocle", "heavy", "reactor", 7),
    (9, "Pilot", "Common", "visor_v", "sleek", "thruster", 8),
    (10, "Collector", "Common", "visor_wide", "industrial", "drone", 9),
    (11, "Miner", "Uncommon", "cage", "heavy", "drill", 10),
    (12, "Gunner", "Uncommon", "monocle", "sleek", "cannon", 11),
    (13, "Pilot", "Uncommon", "visor_v", "crest", "wings", 12),
    (14, "Engineer", "Uncommon", "goggles", "synth", "wrench_servo", 13),
    (15, "Collector", "Uncommon", "dome", "round", "magnet", 14),
    (16, "Scientist", "Uncommon", "astrolabe", "synth", "orbs", 15),
    (17, "Commander", "Uncommon", "slit", "crest", "cape", 16),
    (18, "Navigator", "Uncommon", "visor_wide", "sleek", "starmap", 17),
    (19, "Collector", "Rare", "dome", "synth", "magnet", 18),
    (20, "Gunner", "Rare", "slit", "heavy", "cannon", 19),
    (21, "Miner", "Rare", "dual_lamp", "industrial", "drill", 20),
    (22, "Pilot", "Rare", "visor_v", "crest", "wings", 21),
    (23, "Engineer", "Rare", "goggles", "heavy", "reactor", 22),
    (24, "Scientist", "Rare", "monocle", "crystal", "orbs", 23),
    (25, "Commander", "Rare", "visor_wide", "crest", "cape", 24),
    (26, "Engineer", "Epic", "goggles", "synth", "reactor", 25),
    (27, "Gunner", "Epic", "monocle", "heavy", "cannon", 26),
    (28, "Miner", "Epic", "cage", "crystal", "drill", 27),
    (29, "Pilot", "Epic", "visor_v", "sleek", "thruster", 28),
    (30, "Collector", "Epic", "dome", "industrial", "drone", 29),
    (31, "Scientist", "Epic", "astrolabe", "synth", "orbs", 30),
    (32, "Gunner", "Legendary", "slit", "crest", "cannon", 31),
    (33, "Pilot", "Legendary", "visor_v", "crest", "wings", 32),
    (34, "Miner", "Legendary", "dual_lamp", "heavy", "drill", 33),
    (35, "Commander", "Legendary", "visor_wide", "crest", "cape", 34),
    (36, "Engineer", "Legendary", "monocle", "synth", "reactor", 35),
    (37, "Miner", "Mythic", "cage", "crystal", "drill", 36),
    (38, "Commander", "Mythic", "visor_v", "crest", "cape", 37),
    (39, "Gunner", "Mythic", "slit", "synth", "cannon", 38),
    (40, "Pilot", "Mythic", "astrolabe", "crystal", "wings", 39),
    (41, "Scientist", "Secret", "astrolabe", "void_crown", "orbs", 40),
    (42, "Commander", "Secret", "visor_v", "void_crown", "cape", 41),
]


def load_font(name: str, size: int, bold_var: bool = False) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT_DIR / name), size)
    if bold_var:
        try:
            f.set_variation_by_axes([800])
        except Exception:
            pass
    return f


def generate_crew_portrait(idx: int, role: str, rarity: str, visor: str, head: str, prop: str, seed_shift: int) -> Image.Image:
    w, h = 360, 440
    rng = np.random.default_rng(1000 + idx * 37 + seed_shift)
    rim_col, bg_dark, hi_col = RARITY_PALETTES[rarity]

    # 1. Rich atmospheric cosmic portrait background
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx - w * 0.5) / (w * 0.5)
    ny = (yy - h * 0.42) / (h * 0.5)
    radial = np.exp(-(nx * nx * 1.6 + ny * ny * 1.4))

    swirl = 0.5 + 0.5 * np.sin(nx * 4.5 + seed_shift * 0.7 + np.cos(ny * 3.8))
    bg = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        bg[:, :, c] = bg_dark[c] * (0.45 + 0.55 * swirl) + rim_col[c] * radial * (0.48 if rarity not in ("Mythic", "Secret") else 0.72)

    if rarity in ("Mythic", "Secret"):
        # Cosmic secondary nebula band
        band = np.exp(-((nx * math.cos(seed_shift) + ny * math.sin(seed_shift)) ** 2) * 5.0)
        sec = (210, 65, 255) if rarity == "Mythic" else (255, 195, 55)
        for c in range(3):
            bg[:, :, c] += sec[c] * band * 0.42

    # Crisp starfield specks
    for _ in range(55):
        sx, sy = int(rng.integers(6, w - 6)), int(rng.integers(6, h - 6))
        bg[sy:sy + 2, sx:sx + 2] = np.clip(bg[sy:sy + 2, sx:sx + 2] + rng.integers(110, 220), 0, 255)

    img = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")
    draw = ImageDraw.Draw(img)

    cx, cy = w // 2 + int(rng.integers(-8, 9)), int(h * 0.43)

    # 2. Rarity Halo / Sunburst behind character for high rarities
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    if rarity in ("Rare", "Epic", "Legendary", "Mythic", "Secret"):
        r_ring = 112 + (idx % 3) * 8
        hd.ellipse((cx - r_ring, cy - r_ring, cx + r_ring, cy + r_ring), outline=(*rim_col, 175), width=4)
        if rarity in ("Legendary", "Mythic", "Secret"):
            for i in range(12):
                ang = math.radians(i * 30 + idx * 7)
                hd.line(
                    [(cx + 75 * math.cos(ang), cy + 75 * math.sin(ang)), (cx + 155 * math.cos(ang), cy + 155 * math.sin(ang))],
                    fill=(*hi_col, 130),
                    width=3,
                )
    img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(1)))
    draw = ImageDraw.Draw(img)

    # Suit primary & secondary colors varied per character
    armor_palettes = [
        ((58, 76, 104), (175, 196, 218)),
        ((78, 66, 96), (215, 178, 95)),
        ((46, 86, 84), (165, 220, 210)),
        ((92, 58, 56), (228, 165, 78)),
        ((64, 72, 82), (215, 225, 238)),
        ((42, 62, 102), (95, 208, 250)),
    ]
    suit_dark, suit_light = armor_palettes[idx % len(armor_palettes)]

    # 3. Role-specific back rig / shoulder equipment
    if prop == "wings":
        for sx in (-1, 1):
            draw.polygon([(cx + sx * 55, cy + 75), (cx + sx * 158, cy - 18), (cx + sx * 138, cy + 52), (cx + sx * 75, cy + 125)], fill=(*suit_dark, 255), outline=(*rim_col, 230))
    elif prop == "cannon":
        draw.polygon([(cx + 55, cy + 55), (cx + 132, cy - 48), (cx + 154, cy - 34), (cx + 82, cy + 78)], fill=(45, 52, 66, 255), outline=(*suit_light, 255))
        draw.ellipse((cx + 126, cy - 52, cx + 152, cy - 28), fill=(*rim_col, 255))
    elif prop in ("drill", "pick_laser"):
        draw.polygon([(cx - 135, cy - 35), (cx - 98, cy - 62), (cx - 58, cy + 55), (cx - 88, cy + 72)], fill=(195, 145, 42, 255), outline=(*hi_col, 255))
        draw.polygon([(cx - 148, cy - 68), (cx - 128, cy - 42), (cx - 104, cy - 58)], fill=(*rim_col, 255))
    elif prop == "wrench_servo":
        draw.line([(cx + 68, cy + 68), (cx + 128, cy + 4), (cx + 108, cy - 44)], fill=(190, 148, 52, 255), width=12)
        draw.ellipse((cx + 94, cy - 60, cx + 124, cy - 30), outline=(*rim_col, 255), width=5)
    elif prop == "magnet":
        draw.arc((cx - 138, cy - 45, cx - 54, cy + 45), start=120, end=330, fill=(*rim_col, 255), width=10)
    elif prop == "reactor":
        draw.ellipse((cx + 76, cy - 20, cx + 144, cy + 48), fill=(26, 36, 52, 255), outline=(*suit_light, 255), width=4)
        draw.ellipse((cx + 92, cy - 4, cx + 128, cy + 32), fill=(*rim_col, 245))
    elif prop in ("orbs", "starmap", "drone"):
        for ox, oy, r_o in [(cx - 108, cy - 25, 18), (cx + 112, cy - 32, 22), (cx + 98, cy + 38, 13)]:
            draw.ellipse((ox - r_o, oy - r_o, ox + r_o, oy + r_o), fill=(*rim_col, 210), outline=(*hi_col, 255), width=2)
    elif prop == "cape":
        draw.polygon([(cx - 95, cy + 68), (cx + 95, cy + 68), (cx + 148, h), (cx - 148, h)], fill=(max(15, rim_col[0] // 3), max(12, rim_col[1] // 3), max(22, rim_col[2] // 3), 255))

    # 4. Armored Shoulders, Chestplate & Collar
    draw.polygon(
        [(cx - 138, h), (cx - 118, cy + 88), (cx - 56, cy + 56), (cx + 56, cy + 56), (cx + 118, cy + 88), (cx + 138, h)],
        fill=(*suit_dark, 255),
        outline=(*suit_light, 255),
    )
    # Pauldrons
    for sx in (-1, 1):
        draw.polygon(
            [(cx + sx * 54, cy + 58), (cx + sx * 128, cy + 78), (cx + sx * 136, cy + 134), (cx + sx * 68, cy + 122)],
            fill=(*suit_light, 255),
            outline=(*rim_col, 235),
        )
    # Glowing chest core emblem
    draw.polygon([(cx, cy + 94), (cx + 28, cy + 122), (cx, cy + 156), (cx - 28, cy + 122)], fill=(*rim_col, 255), outline=(245, 252, 255, 255))
    draw.line([(cx - 48, cy + 76), (cx - 24, cy + 185)], fill=(*suit_light, 190), width=4)
    draw.line([(cx + 48, cy + 76), (cx + 24, cy + 185)], fill=(*suit_light, 190), width=4)

    # Neck seal
    draw.rectangle((cx - 32, cy + 34, cx + 32, cy + 70), fill=(32, 38, 48, 255), outline=(95, 112, 136, 255))

    # 5. Helmet / Head Silhouette (distinct by head style)
    hw = 58 + (idx % 4) * 3
    hh = 68 + ((idx // 2) % 3) * 3
    if head == "round":
        draw.ellipse((cx - hw, cy - hh, cx + hw, cy + hh - 10), fill=(*suit_light, 255), outline=(*rim_col, 240), width=3)
    elif head == "sleek":
        draw.polygon(
            [(cx, cy - hh - 8), (cx + hw, cy - 22), (cx + hw - 8, cy + 42), (cx, cy + 58), (cx - hw + 8, cy + 42), (cx - hw, cy - 22)],
            fill=(*suit_light, 255),
            outline=(*rim_col, 240),
        )
    elif head == "heavy":
        draw.rounded_rectangle((cx - hw - 6, cy - hh + 4, cx + hw + 6, cy + 54), radius=18, fill=(*suit_dark, 255), outline=(*suit_light, 255), width=4)
    elif head == "industrial":
        draw.polygon(
            [(cx - hw + 10, cy - hh), (cx + hw - 10, cy - hh), (cx + hw + 6, cy - 10), (cx + hw - 4, cy + 52), (cx - hw + 4, cy + 52), (cx - hw - 6, cy - 10)],
            fill=(198, 152, 52, 255),
            outline=(*suit_light, 255),
        )
    elif head == "synth":
        draw.polygon(
            [(cx, cy - hh - 6), (cx + hw - 4, cy - 34), (cx + hw - 12, cy + 36), (cx, cy + 58), (cx - hw + 12, cy + 36), (cx - hw + 4, cy - 34)],
            fill=(44, 54, 72, 255),
            outline=(*rim_col, 255),
        )
    elif head == "crest":
        draw.ellipse((cx - hw, cy - hh + 4, cx + hw, cy + 54), fill=(*suit_light, 255), outline=(*rim_col, 255), width=3)
        draw.polygon([(cx, cy - hh - 34), (cx + 18, cy - 18), (cx - 18, cy - 18)], fill=(*rim_col, 255), outline=(255, 255, 255, 220))
    elif head == "crystal":
        draw.polygon(
            [(cx, cy - hh - 22), (cx + hw, cy - 18), (cx + hw - 14, cy + 50), (cx, cy + 62), (cx - hw + 14, cy + 50), (cx - hw, cy - 18)],
            fill=(*suit_dark, 255),
            outline=(*hi_col, 255),
        )
        for sx in (-1, 1):
            draw.polygon([(cx + sx * 36, cy - hh + 4), (cx + sx * 68, cy - hh - 28), (cx + sx * 54, cy - 22)], fill=(*rim_col, 235))
    elif head == "void_crown":
        draw.polygon(
            [(cx, cy - hh - 10), (cx + hw, cy - 20), (cx + hw - 10, cy + 48), (cx, cy + 60), (cx - hw + 10, cy + 48), (cx - hw, cy - 20)],
            fill=(24, 18, 38, 255),
            outline=(*hi_col, 255),
        )
        for sx in (-48, -22, 0, 22, 48):
            draw.polygon([(cx + sx - 7, cy - hh - 8), (cx + sx, cy - hh - 42 - (12 if sx == 0 else 0)), (cx + sx + 7, cy - hh - 8)], fill=(*hi_col, 255))

    # Comms antennas on select helmets
    if idx % 2 == 1:
        draw.line([(cx - hw + 2, cy - 10), (cx - hw - 10, cy - hh - 26)], fill=(*suit_light, 255), width=4)
        draw.ellipse((cx - hw - 15, cy - hh - 31, cx - hw - 5, cy - hh - 21), fill=(*rim_col, 255))

    # 6. Visor / Optics with luminous glow
    visor_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(visor_layer)
    vcol = (*hi_col, 255)
    if visor == "visor_wide":
        vd.rounded_rectangle((cx - 42, cy - 22, cx + 42, cy + 12), radius=10, fill=(*rim_col, 245), outline=vcol, width=2)
    elif visor == "visor_v":
        vd.polygon([(cx - 44, cy - 20), (cx, cy - 6), (cx + 44, cy - 20), (cx + 36, cy + 10), (cx, cy + 22), (cx - 36, cy + 10)], fill=(*rim_col, 250), outline=vcol)
    elif visor == "slit":
        vd.rectangle((cx - 44, cy - 12, cx + 44, cy + 2), fill=(*rim_col, 255), outline=vcol, width=2)
        vd.rectangle((cx - 8, cy - 26, cx + 8, cy + 24), fill=(*rim_col, 220))
    elif visor == "goggles":
        for gx in (-22, 22):
            vd.ellipse((cx + gx - 17, cy - 20, cx + gx + 17, cy + 14), fill=(20, 30, 42, 255), outline=vcol, width=3)
            vd.ellipse((cx + gx - 11, cy - 14, cx + gx + 11, cy + 8), fill=(*rim_col, 255))
    elif visor == "monocle":
        vd.rounded_rectangle((cx - 40, cy - 14, cx + 40, cy + 8), radius=6, fill=(22, 32, 48, 255), outline=(*suit_light, 220), width=2)
        vd.ellipse((cx + 4, cy - 24, cx + 40, cy + 12), fill=(*rim_col, 255), outline=vcol, width=3)
        vd.ellipse((cx - 28, cy - 8, cx - 14, cy + 4), fill=vcol)
    elif visor == "cage":
        vd.rounded_rectangle((cx - 40, cy - 22, cx + 40, cy + 16), radius=8, fill=(*rim_col, 235), outline=vcol, width=2)
        for bx in (-20, 0, 20):
            vd.line([(cx + bx, cy - 24), (cx + bx, cy + 18)], fill=(38, 44, 56, 255), width=4)
    elif visor == "dual_lamp":
        vd.rounded_rectangle((cx - 38, cy - 16, cx + 38, cy + 12), radius=8, fill=(*rim_col, 235), outline=vcol, width=2)
        for lx in (-28, 28):
            vd.ellipse((cx + lx - 10, cy - 46, cx + lx + 10, cy - 26), fill=(255, 245, 190, 255), outline=vcol, width=2)
    elif visor == "dome":
        vd.ellipse((cx - 44, cy - 36, cx + 44, cy + 22), fill=(*rim_col, 215), outline=vcol, width=2)
        vd.arc((cx - 34, cy - 28, cx + 20, cy + 10), start=200, end=290, fill=(255, 255, 255, 230), width=4)
    elif visor == "astrolabe":
        vd.ellipse((cx - 36, cy - 24, cx + 36, cy + 16), fill=(*rim_col, 235), outline=vcol, width=2)
        vd.ellipse((cx - 50, cy - 14, cx + 50, cy + 6), outline=vcol, width=2)

    img = Image.alpha_composite(img, visor_layer.filter(ImageFilter.GaussianBlur(4)))
    img = Image.alpha_composite(img, visor_layer)

    # Bottom vignette & rarity inner border
    vign = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vgd = ImageDraw.Draw(vign)
    for y in range(h - 90, h):
        alpha = int(205 * ((y - (h - 90)) / 90.0))
        vgd.line([(0, y), (w, y)], fill=(6, 10, 20, alpha))
    vgd.rectangle((2, 2, w - 3, h - 3), outline=(*rim_col, 220), width=4)
    img = Image.alpha_composite(img, vign)
    return img.convert("RGB")


def generate_card_backs_and_packs() -> None:
    (CARDS_DIR / "frames").mkdir(parents=True, exist_ok=True)

    # 1. Custom Card Back (360 x 520)
    w, h = 360, 520
    back = Image.new("RGBA", (w, h), (10, 16, 32, 255))
    d = ImageDraw.Draw(back)
    d.rounded_rectangle((6, 6, w - 7, h - 7), radius=18, fill=(14, 22, 44, 255), outline=(55, 215, 255, 255), width=5)
    d.rounded_rectangle((18, 18, w - 19, h - 19), radius=12, fill=(9, 14, 28, 255), outline=(245, 182, 48, 220), width=3)

    cx, cy = w // 2, h // 2
    for r, col in [(135, (32, 85, 130, 190)), (102, (245, 182, 48, 210)), (72, (48, 218, 255, 240))]:
        pts = [(cx + r * math.cos(math.radians(30 + 60 * i)), cy + r * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
        d.polygon(pts, outline=col, width=3)
    # Circuit traces (cleanly stopping before top/bottom text banners)
    for sy in (-1, 1):
        d.line([(cx, cy + sy * 72), (cx, cy + sy * 172)], fill=(48, 218, 255, 190), width=3)
        d.line([(cx - 55, cy + sy * 135), (cx + 55, cy + sy * 135)], fill=(245, 182, 48, 180), width=2)

    icon = Image.open(ROOT / "assets" / "branding" / "icon_256.png").resize((136, 136), Image.Resampling.LANCZOS)
    back.alpha_composite(icon, (cx - 68, cy - 68))
    f_lbl = load_font("Orbitron-Bold.ttf", 20, bold_var=True)
    tb_top = d.textbbox((0, 0), "SPACE MINER", font=f_lbl)
    tb_bot = d.textbbox((0, 0), "CREW CORPS", font=f_lbl)
    d.text(((w - (tb_top[2] - tb_top[0])) // 2, 44), "SPACE MINER", font=f_lbl, fill=(180, 235, 255, 230))
    d.text(((w - (tb_bot[2] - tb_bot[0])) // 2, h - 68), "CREW CORPS", font=f_lbl, fill=(255, 198, 68, 230))
    back.save(CARDS_DIR / "card_back.png")

    # 2. Standard & Elite Booster Packs (380 x 540)
    for fname, title, sub, main_col, trim_col in [
        ("pack_standard.png", "GALACTIC PACK", "3 CREW CARDS", (22, 88, 158), (55, 225, 255)),
        ("pack_elite.png", "MYTHIC VAULT", "3 HIGH-TIER CARDS", (92, 28, 148), (255, 196, 52)),
    ]:
        pk = Image.new("RGBA", (380, 540), (0, 0, 0, 0))
        pd = ImageDraw.Draw(pk)
        # Foil crimp top & bottom + armored body
        pd.rounded_rectangle((16, 36, 364, 504), radius=20, fill=(*main_col, 255), outline=(*trim_col, 255), width=5)
        pd.rectangle((22, 14, 358, 46), fill=(38, 48, 68, 255), outline=(*trim_col, 255), width=3)
        pd.rectangle((22, 494, 358, 526), fill=(38, 48, 68, 255), outline=(*trim_col, 255), width=3)
        for x in range(32, 352, 12):
            pd.line([(x, 16), (x, 44)], fill=(90, 115, 148, 200), width=2)
            pd.line([(x, 496), (x, 524)], fill=(90, 115, 148, 200), width=2)

        # Glowing emblem center
        glow = Image.new("RGBA", (380, 540), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((70, 130, 310, 370), fill=(*trim_col, 140))
        pk = Image.alpha_composite(pk, glow.filter(ImageFilter.GaussianBlur(24)))
        pk.alpha_composite(icon.resize((176, 176), Image.Resampling.LANCZOS), (102, 152))

        pd = ImageDraw.Draw(pk)
        ft1 = load_font("Orbitron-Bold.ttf", 28, bold_var=True)
        ft2 = load_font("Rajdhani-Bold.ttf", 24)
        tb1 = pd.textbbox((0, 0), title, font=ft1)
        tb2 = pd.textbbox((0, 0), sub, font=ft2)
        pd.text(((380 - (tb1[2] - tb1[0])) // 2, 368), title, font=ft1, fill=(245, 252, 255, 255))
        pd.text(((380 - (tb2[2] - tb2[0])) // 2, 412), sub, font=ft2, fill=(*trim_col, 255))
        pk.save(CARDS_DIR / fname)


def generate_achievement_illustrations() -> None:
    out_dir = CARDS_DIR / "achievements"
    out_dir.mkdir(parents=True, exist_ok=True)
    themes = [
        ("mine", (45, 215, 255), (215, 155, 45)),
        ("combat", (255, 88, 62), (255, 195, 58)),
        ("collect", (68, 235, 168), (58, 175, 255)),
        ("travel", (135, 110, 255), (65, 235, 255)),
        ("ship", (255, 185, 48), (85, 195, 255)),
        ("cards", (215, 85, 255), (255, 215, 85)),
    ]
    for i in range(1, 31):
        kind, c1, c2 = themes[(i - 1) % len(themes)]
        w, h = 280, 180
        rng = np.random.default_rng(5000 + i * 19)
        img = Image.new("RGBA", (w, h), (10, 16, 30, 255))
        d = ImageDraw.Draw(img)

        # Gradient bands & stars
        for y in range(h):
            t = y / h
            col = (
                int(10 + c1[0] * 0.22 * (1 - t) + c2[0] * 0.16 * t),
                int(16 + c1[1] * 0.22 * (1 - t) + c2[1] * 0.16 * t),
                int(32 + c1[2] * 0.26 * (1 - t) + c2[2] * 0.16 * t),
                255,
            )
            d.line([(0, y), (w, y)], fill=col)
        for _ in range(32):
            sx, sy = int(rng.integers(4, w - 4)), int(rng.integers(4, h - 4))
            d.rectangle((sx, sy, sx + 1, sy + 1), fill=(220, 240, 255, 200))

        cx, cy = w // 2, h // 2
        if kind == "mine":
            pts = [(cx + 20 + 48 * math.cos(a), cy + 42 * math.sin(a)) for a in np.linspace(0, 6.28, 8, endpoint=False)]
            d.polygon(pts, fill=(68, 76, 94, 255), outline=(*c1, 255))
            d.line([(20, h - 22), (cx + 12, cy + 4)], fill=(*c1, 235), width=9)
            d.line([(20, h - 22), (cx + 12, cy + 4)], fill=(255, 255, 255, 255), width=3)
            d.polygon([(cx + 15, cy - 38), (cx + 42, cy - 58), (cx + 38, cy - 18)], fill=(*c2, 255))
        elif kind == "combat":
            d.polygon([(36, cy + 28), (112, cy - 6), (86, cy + 36)], fill=(195, 212, 232, 255), outline=(*c2, 255))
            d.ellipse((cx + 18, cy - 42, cx + 98, cy + 38), fill=(*c1, 190), outline=(255, 240, 180, 255), width=3)
            d.line([(98, cy + 6), (cx + 56, cy - 4)], fill=(*c2, 255), width=5)
        elif kind == "collect":
            for ox, oy, r in [(cx - 42, cy + 8, 20), (cx + 6, cy - 16, 26), (cx + 52, cy + 14, 18)]:
                pts = [(ox, oy - r), (ox + r * 0.8, oy), (ox, oy + r), (ox - r * 0.8, oy)]
                d.polygon(pts, fill=(*c1, 235), outline=(255, 255, 255, 230))
            d.arc((cx - 88, cy - 55, cx + 88, cy + 55), 195, 345, fill=(*c2, 220), width=4)
        elif kind == "travel":
            for r in (22, 44, 68):
                d.ellipse((cx - r * 1.4, cy - r * 0.7, cx + r * 1.4, cy + r * 0.7), outline=(*c1, 210), width=3)
            d.polygon([(cx - 28, cy + 16), (cx + 38, cy - 18), (cx + 6, cy + 24)], fill=(235, 245, 255, 255), outline=(*c2, 255))
        elif kind == "ship":
            for gx in (-44, 0, 44):
                for gy in (-22, 22):
                    d.rounded_rectangle((cx + gx - 18, cy + gy - 18, cx + gx + 18, cy + gy + 18), radius=4, fill=(42, 62, 88, 240), outline=(*c1, 240), width=2)
            d.rounded_rectangle((cx - 18, cy - 18, cx + 18, cy + 18), radius=5, fill=(*c2, 255), outline=(255, 255, 255, 255), width=2)
        elif kind == "cards":
            for dx, rot_off, col in [(-34, -8, c2), (0, -16, c1), (34, -8, (255, 255, 255))]:
                d.rounded_rectangle((cx + dx - 26, cy + rot_off - 38, cx + dx + 26, cy + rot_off + 38), radius=6, fill=(22, 32, 58, 255), outline=(*col, 255), width=3)

        d.rectangle((2, 2, w - 3, h - 3), outline=(*c1, 210), width=3)
        img.convert("RGB").save(out_dir / f"ach_{i:02d}.png")


def generate_ui_and_upgrade_icons() -> None:
    ui_dir = ICONS_DIR / "ui"
    upg_dir = ICONS_DIR / "upgrades"
    eq_dir = ICONS_DIR / "equip"
    ui_dir.mkdir(parents=True, exist_ok=True)
    upg_dir.mkdir(parents=True, exist_ok=True)
    eq_dir.mkdir(parents=True, exist_ok=True)

    # 1. 28 Crisp Vector Sci-Fi UI Icons (64x64 RGBA, ZERO emojis)
    def new_ic():
        im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        return im, ImageDraw.Draw(im)

    icons = {}

    im, d = new_ic()  # credits
    pts = [(32 + 24 * math.cos(math.radians(60 * i)), 32 + 24 * math.sin(math.radians(60 * i))) for i in range(6)]
    d.polygon(pts, fill=(245, 182, 42, 255), outline=(255, 238, 155, 255), width=3)
    d.arc((20, 18, 44, 46), 55, 305, fill=(45, 32, 8, 255), width=5)
    icons["credits"] = im

    im, d = new_ic()  # crystals
    d.polygon([(32, 6), (52, 26), (42, 56), (22, 56), (12, 26)], fill=(48, 225, 255, 255), outline=(225, 252, 255, 255), width=3)
    d.line([(32, 6), (32, 56)], fill=(195, 248, 255, 220), width=2)
    icons["crystals"] = im

    im, d = new_ic()  # hull / hp
    d.polygon([(32, 8), (54, 18), (48, 44), (32, 58), (16, 44), (10, 18)], fill=(58, 215, 128, 255), outline=(215, 255, 230, 255), width=3)
    d.rectangle((28, 20, 36, 44), fill=(255, 255, 255, 240))
    d.rectangle((20, 28, 44, 36), fill=(255, 255, 255, 240))
    icons["hull"] = im

    im, d = new_ic()  # shield
    d.polygon([(32, 6), (54, 16), (50, 42), (32, 58), (14, 42), (10, 16)], fill=(45, 175, 255, 235), outline=(195, 242, 255, 255), width=3)
    icons["shield"] = im

    im, d = new_ic()  # energy
    d.polygon([(36, 6), (14, 34), (30, 34), (26, 58), (50, 28), (34, 28)], fill=(255, 208, 48, 255), outline=(255, 248, 195, 255), width=2)
    icons["energy"] = im

    im, d = new_ic()  # mass
    d.polygon([(18, 22), (46, 22), (54, 54), (10, 54)], fill=(148, 168, 192, 255), outline=(225, 238, 250, 255), width=3)
    d.arc((24, 10, 40, 26), 180, 360, fill=(225, 238, 250, 255), width=4)
    icons["mass"] = im

    im, d = new_ic()  # thrust
    d.polygon([(32, 8), (50, 34), (40, 34), (44, 56), (32, 46), (20, 56), (24, 34), (14, 34)], fill=(255, 138, 42, 255), outline=(255, 232, 168, 255), width=2)
    icons["thrust"] = im

    im, d = new_ic()  # cargo
    d.rounded_rectangle((10, 14, 54, 52), radius=6, fill=(215, 152, 42, 255), outline=(255, 228, 150, 255), width=3)
    d.line([(10, 32), (54, 32)], fill=(45, 32, 12, 255), width=4)
    d.rectangle((26, 26, 38, 38), fill=(255, 238, 180, 255))
    icons["cargo"] = im

    im, d = new_ic()  # crew
    d.ellipse((20, 10, 44, 34), fill=(72, 212, 255, 255), outline=(225, 250, 255, 255), width=2)
    d.pieslice((10, 34, 54, 74), 180, 360, fill=(72, 212, 255, 255), outline=(225, 250, 255, 255), width=2)
    icons["crew"] = im

    im, d = new_ic()  # cards
    d.rounded_rectangle((12, 10, 42, 52), radius=5, fill=(138, 72, 235, 255), outline=(228, 195, 255, 255), width=2)
    d.rounded_rectangle((22, 14, 52, 56), radius=5, fill=(48, 195, 255, 255), outline=(235, 252, 255, 255), width=2)
    icons["cards"] = im

    im, d = new_ic()  # upgrade
    d.polygon([(32, 8), (52, 28), (40, 28), (40, 54), (24, 54), (24, 28), (12, 28)], fill=(65, 238, 165, 255), outline=(220, 255, 238, 255), width=2)
    icons["upgrade"] = im

    im, d = new_ic()  # achievement
    d.polygon([(32, 6), (39, 22), (56, 24), (43, 36), (47, 54), (32, 44), (17, 54), (21, 36), (8, 24), (25, 22)], fill=(255, 198, 45, 255), outline=(255, 245, 185, 255), width=2)
    icons["achievement"] = im

    im, d = new_ic()  # launch
    d.polygon([(32, 6), (46, 30), (42, 48), (22, 48), (18, 30)], fill=(235, 245, 255, 255), outline=(55, 215, 255, 255), width=3)
    d.polygon([(24, 48), (32, 60), (40, 48)], fill=(255, 140, 35, 255))
    icons["launch"] = im

    im, d = new_ic()  # lock
    d.arc((20, 8, 44, 34), 180, 360, fill=(185, 198, 218, 255), width=5)
    d.rounded_rectangle((14, 26, 50, 56), radius=6, fill=(115, 130, 152, 255), outline=(215, 228, 245, 255), width=2)
    icons["lock"] = im

    im, d = new_ic()  # check
    d.line([(12, 34), (26, 48), (52, 16)], fill=(65, 242, 148, 255), width=7)
    icons["check"] = im

    im, d = new_ic()  # settings
    d.ellipse((14, 14, 50, 50), fill=(118, 148, 178, 255), outline=(220, 238, 255, 255), width=4)
    d.ellipse((24, 24, 40, 40), fill=(14, 22, 38, 255))
    icons["settings"] = im

    im, d = new_ic()  # com (Center of Mass reticle)
    d.ellipse((12, 12, 52, 52), outline=(255, 196, 42, 255), width=4)
    d.pieslice((18, 18, 46, 46), 0, 90, fill=(255, 196, 42, 255))
    d.pieslice((18, 18, 46, 46), 180, 270, fill=(255, 196, 42, 255))
    icons["com"] = im

    for k, v in icons.items():
        v.save(ui_dir / f"icon_{k}.png")

    # 2. 18 Active Upgrade Tech Chip Icons (96x96)
    upg_colors = [
        (48, 220, 255), (255, 185, 45), (185, 88, 255),
        (58, 235, 148), (255, 88, 72), (95, 165, 255),
    ]
    for i in range(1, 19):
        col = upg_colors[(i - 1) % len(upg_colors)]
        im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        # Circuit pins
        for p in (22, 48, 74):
            d.rectangle((p - 4, 4, p + 4, 16), fill=(195, 212, 230, 255))
            d.rectangle((p - 4, 80, p + 4, 92), fill=(195, 212, 230, 255))
            d.rectangle((4, p - 4, 16, p + 4), fill=(195, 212, 230, 255))
            d.rectangle((80, p - 4, 92, p + 4), fill=(195, 212, 230, 255))
        d.rounded_rectangle((14, 14, 82, 82), radius=12, fill=(16, 24, 42, 255), outline=(*col, 255), width=4)
        # Distinct inner glyph per upgrade
        r_in = 18 + (i % 3) * 4
        pts = [
            (48 + r_in * math.cos(math.radians(i * 20 + 360 * k / (3 + (i % 4)))),
             48 + r_in * math.sin(math.radians(i * 20 + 360 * k / (3 + (i % 4)))))
            for k in range(3 + (i % 4))
        ]
        d.polygon(pts, fill=(*col, 215), outline=(255, 255, 255, 240), width=2)
        im.save(upg_dir / f"upg_{i:02d}.png")

    # 3. Render 160x160 Isometric 3D Equipment Icons directly from all .glb models!
    glb_list = sorted(list((MODELS_DIR / "ship").glob("*.glb")) + list((MODELS_DIR / "equipment").glob("*.glb")))
    for glb_path in glb_list:
        g = pygltflib.GLTF2().load_binary(str(glb_path))
        blob = g.binary_blob()

        def read_acc(acc_idx: int, dtype, cols: int):
            acc = g.accessors[acc_idx]
            bv = g.bufferViews[acc.bufferView]
            off = (bv.byteOffset or 0) + (acc.byteOffset or 0)
            arr = np.frombuffer(blob, dtype=dtype, count=acc.count * cols, offset=off)
            return arr.reshape((acc.count, cols)) if cols > 1 else arr

        prim = g.meshes[0].primitives[0]
        verts = read_acc(prim.attributes.POSITION, np.float32, 3)
        uvs = read_acc(prim.attributes.TEXCOORD_0, np.float32, 2)
        faces = read_acc(prim.indices, np.uint32, 1).reshape((-1, 3))

        bv_alb = g.bufferViews[g.images[0].bufferView]
        bv_emi = g.bufferViews[g.images[3].bufferView]
        alb = np.asarray(Image.open(io.BytesIO(blob[bv_alb.byteOffset:bv_alb.byteOffset + bv_alb.byteLength])).convert("RGB"), dtype=np.float32)
        emi = np.asarray(Image.open(io.BytesIO(blob[bv_emi.byteOffset:bv_emi.byteOffset + bv_emi.byteLength])).convert("RGB"), dtype=np.float32)
        th, tw = alb.shape[:2]

        center = 0.5 * (verts.min(axis=0) + verts.max(axis=0))
        v = verts - center
        span = max(1e-4, np.linalg.norm(verts.max(axis=0) - verts.min(axis=0)))
        v = v / span * 2.15

        ry, rx = math.radians(145.0), math.radians(26.0)
        rot = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]]) @ np.array(
            [[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]]
        )
        vr = v @ rot.T
        tri_v = vr[faces]
        fn = np.cross(tri_v[:, 1] - tri_v[:, 0], tri_v[:, 2] - tri_v[:, 0])
        fn_len = np.linalg.norm(fn, axis=1, keepdims=True)
        valid = (fn_len[:, 0] > 1e-8) & (fn[:, 2] > -0.05)
        fn = fn / (fn_len + 1e-9)

        tri_uv = uvs[faces].mean(axis=1)
        tx = np.clip((tri_uv[:, 0] * (tw - 1)).astype(int), 0, tw - 1)
        ty = np.clip((tri_uv[:, 1] * (th - 1)).astype(int), 0, th - 1)
        key_dir = np.array([0.52, 0.68, 0.52]) / np.linalg.norm([0.52, 0.68, 0.52])
        ndotl = np.clip(fn @ key_dir, 0.0, 1.0)[:, None]
        lit = np.clip(alb[ty, tx] * (0.32 + 0.88 * ndotl) + emi[ty, tx] * 0.95, 0, 255).astype(np.uint8)

        order = np.argsort(tri_v.mean(axis=1)[:, 2])
        sz = 160
        ic = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
        idraw = ImageDraw.Draw(ic)
        for idx_f in order:
            if not valid[idx_f]:
                continue
            pts = []
            for k in range(3):
                px, py, pz = tri_v[idx_f, k]
                persp = 1.0 / max(0.6, 3.2 - pz)
                pts.append((sz * 0.5 + px * sz * 0.82 * persp, sz * 0.52 - py * sz * 0.82 * persp))
            c = lit[idx_f]
            idraw.polygon(pts, fill=(int(c[0]), int(c[1]), int(c[2]), 255))
        ic.save(eq_dir / f"{glb_path.stem}.png")


if __name__ == "__main__":
    crew_dir = CARDS_DIR / "crew"
    crew_dir.mkdir(parents=True, exist_ok=True)
    samples = []
    for spec in CREW_SPECS:
        im = generate_crew_portrait(*spec)
        im.save(crew_dir / f"crew_{spec[0]:02d}.png", quality=95)
        if spec[0] in (1, 12, 19, 26, 32, 37, 41, 42):
            samples.append((f"#{spec[0]:02d} {spec[2]} {spec[1]}", im))

    generate_card_backs_and_packs()
    generate_achievement_illustrations()
    generate_ui_and_upgrade_icons()

    # Build preview sheet of Crew Card Art across all 7 rarities + Packs
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGB", (4 * 240, 2 * 310), (8, 12, 22))
    fnt = load_font("Rajdhani-Bold.ttf", 20)
    for i, (lbl, im) in enumerate(samples):
        thumb = im.resize((224, 272), Image.Resampling.LANCZOS)
        x0, y0 = (i % 4) * 240 + 8, (i // 4) * 310 + 8
        sheet.paste(thumb, (x0, y0))
        ImageDraw.Draw(sheet).text((x0 + 4, y0 + 276), lbl, font=fnt, fill=(210, 238, 255))
    sheet.save(PREVIEW_DIR / "crew_cards_preview.png")
    print("Generated 42 Crew Portraits, 30 Achievement Cards, Packs, Card Back, 18 Upgrade Icons, 17 UI Icons, and 28 3D Equipment Icons!")
