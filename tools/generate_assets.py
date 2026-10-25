#!/usr/bin/env python3
"""
Space Miner - Procedural Asset Generator
Generates professional 2D assets using Pillow without external dependencies
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
import math, random, os, colorsys

random.seed(42)
OUT = "/home/user/Roblox/src/assets"
os.makedirs(OUT, exist_ok=True)

def hsl(h,s,l):
    r,g,b = colorsys.hls_to_rgb(h/360, l/100, s/100)
    return (int(r*255), int(g*255), int(b*255))

def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print(f"Generated {path} {img.size}")

# ---------- SHIP SPRITES ----------
def gen_ship(name, hull1, hull2, accent, size=128):
    img = Image.new("RGBA", (size, size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = size//2, size//2
    # shadow
    d.ellipse([cx-28, cy-20, cx+28, cy+26], fill=(0,0,0,60))
    # hull base polygon - sleek mining ship
    hull = [
        (cx, cy-46), (cx+16, cy-20), (cx+14, cy+22), (cx+8, cy+34),
        (cx-8, cy+34), (cx-14, cy+22), (cx-16, cy-20)
    ]
    d.polygon(hull, fill=hull1, outline=(255,255,255,40))
    # inner highlight
    inner = [(cx, cy-38), (cx+10, cy-14), (cx+8, cy+16), (cx-8, cy+16), (cx-10, cy-14)]
    d.polygon(inner, fill=hull2)
    # cockpit
    d.ellipse([cx-8, cy-26, cx+8, cy-8], fill=(120,200,255,255), outline=(180,240,255,200), width=1)
    d.ellipse([cx-5, cy-22, cx+2, cy-14], fill=(255,255,255,120))
    # mining arm / laser mount
    d.ellipse([cx-6, cy-38, cx+6, cy-28], fill=accent, outline=(255,255,255,90))
    d.rectangle([cx-2, cy-30, cx+2, cy+2], fill=(200,200,210))
    # engines
    for ox in (-10, 10):
        d.rectangle([cx+ox-6, cy+18, cx+ox+6, cy+34], fill=(40,40,50), outline=(80,80,90), width=1)
        d.rectangle([cx+ox-4, cy+30, cx+ox+4, cy+36], fill=accent)
        # thrust glow will be dynamic in game
    # wings detail
    d.polygon([(cx-16,cy-12),(cx-26,cy+4),(cx-22,cy+10),(cx-14,cy+2)], fill=(50,55,70), outline=(90,90,110))
    d.polygon([(cx+16,cy-12),(cx+26,cy+4),(cx+22,cy+10),(cx+14,cy+2)], fill=(50,55,70), outline=(90,90,110))
    # lights
    for ox, col in [(-12, (255,80,80)), (12, (80,255,120))]:
        d.ellipse([cx+ox-2, cy+6, cx+ox+2, cy+10], fill=col)
        d.ellipse([cx+ox-1, cy+7, cx+ox+1, cy+9], fill=(255,255,255,200))
    # hull panel lines
    d.line([cx-8, cy-10, cx+8, cy-10], fill=(255,255,255,30), width=1)
    d.line([cx-8, cy+0, cx+8, cy+0], fill=(255,255,255,20), width=1)
    img = img.filter(ImageFilter.SMOOTH)
    save(img, name)

gen_ship("ship_scout.png", (62,78,110), (85,110,150), (0,200,255), 128)
gen_ship("ship_miner.png", (110,90,40), (150,125,60), (255,190,0), 128)
gen_ship("ship_vanguard.png", (90,40,50), (130,65,80), (255,70,90), 128)

# Additional larger ship variant for UI
gen_ship("ship_miner_large.png", (110,90,40), (150,125,60), (255,190,0), 256)

# ---------- DRONE ----------
def gen_drone(name, c1, c2, accent):
    img = Image.new("RGBA", (64,64), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = 32, 32
    d.ellipse([cx-14, cy-14, cx+14, cy+14], fill=c1, outline=(255,255,255,60), width=1)
    d.ellipse([cx-10, cy-10, cx+10, cy+10], fill=c2)
    d.ellipse([cx-6, cy-6, cx+6, cy+6], fill=accent, outline=(255,255,255,130))
    d.ellipse([cx-3, cy-3, cx+0, cy+0], fill=(255,255,255,180))
    # arms
    for ang in [0,90,180,270]:
        rad = math.radians(ang)
        x1 = cx + math.cos(rad)*12
        y1 = cy + math.sin(rad)*12
        x2 = cx + math.cos(rad)*18
        y2 = cy + math.sin(rad)*18
        d.line([x1,y1,x2,y2], fill=(70,70,80), width=2)
        d.ellipse([x2-3,y2-3,x2+3,y2+3], fill=(40,40,50))
    # mining beam emitter bottom
    d.rectangle([cx-4, cy+12, cx+4, cy+18], fill=(50,50,60))
    d.rectangle([cx-2, cy+16, cx+2, cy+20], fill=accent)
    save(img, name)

gen_drone("drone_miner.png", (70,85,110), (95,115,145), (0,220,255))
gen_drone("drone_combat.png", (110,60,60), (145,80,80), (255,60,60))
gen_drone("drone_hauler.png", (90,100,60), (120,140,80), (255,200,0))

# ---------- ASTEROIDS (procedural irregular) ----------
def gen_asteroid(name, base, vein, size=96, irregular=0.3, seed=None):
    if seed is not None:
        random.seed(seed)
    img = Image.new("RGBA", (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = size//2, size//2
    r = size*0.42
    pts = []
    steps = 12
    for i in range(steps):
        ang = 2*math.pi*i/steps
        rad = r * (1 + random.uniform(-irregular, irregular)*0.5)
        x = cx + math.cos(ang)*rad
        y = cy + math.sin(ang)*rad
        pts.append((x,y))
    d.polygon(pts, fill=base, outline=(0,0,0,90), width=1)
    # craters
    for _ in range(4):
        x = random.randint(int(cx-r*0.6), int(cx+r*0.6))
        y = random.randint(int(cy-r*0.6), int(cy+r*0.6))
        cr = random.randint(4,9)
        d.ellipse([x-cr,y-cr,x+cr,y+cr], fill=(max(0,base[0]-30),max(0,base[1]-30),max(0,base[2]-30)), outline=(0,0,0,40))
        d.ellipse([x-cr+2,y-cr+2,x+cr-1,y+cr-1], fill=None, outline=(255,255,255,18))
    # mineral veins
    for _ in range(3):
        x = random.randint(int(cx-r*0.5), int(cx+r*0.5))
        y = random.randint(int(cy-r*0.5), int(cy+r*0.5))
        vr = random.randint(3,7)
        d.ellipse([x-vr,y-vr,x+vr,y+vr], fill=vein, outline=(255,255,255,80), width=1)
        # glow
        glow = Image.new("RGBA", (size,size), (0,0,0,0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse([x-vr*2,y-vr*2,x+vr*2,y+vr*2], fill=(*vein, 35))
        img = Image.alpha_composite(img, glow)
        d = ImageDraw.Draw(img)
    # highlight
    d.ellipse([cx-r*0.5, cy-r*0.6, cx-r*0.1, cy-r*0.2], fill=(255,255,255,22))
    # shadow bottom
    d.ellipse([cx-r*0.2, cy-r*0.1, cx+r*0.4, cy+r*0.5], fill=(0,0,0,28))
    save(img, name)

# Sector 1 - common
gen_asteroid("asteroid_common_1.png", (110,105,98), (160,155,145), 96, 0.25, seed=1)
gen_asteroid("asteroid_common_2.png", (95,92,88), (140,135,125), 128, 0.3, seed=2)
gen_asteroid("asteroid_common_3.png", (120,115,108), (175,170,160), 72, 0.2, seed=3)
# Sector 2 - crystal
gen_asteroid("asteroid_crystal_1.png", (95,70,120), (80,220,255), 96, 0.35, seed=10)
gen_asteroid("asteroid_crystal_2.png", (70,90,130), (255,100,200), 110, 0.3, seed=11)
gen_asteroid("asteroid_crystal_3.png", (60,110,120), (120,255,180), 84, 0.28, seed=12)
# Sector 3 - iron graveyard
gen_asteroid("asteroid_iron_1.png", (85,75,70), (180,80,50), 110, 0.32, seed=20)
gen_asteroid("asteroid_iron_2.png", (70,68,65), (200,170,80), 96, 0.3, seed=21)
gen_asteroid("asteroid_iron_3.png", (100,90,85), (160,160,170), 128, 0.25, seed=22)
# Sector 4 - plasma
gen_asteroid("asteroid_plasma_1.png", (90,85,20), (255,220,0), 96, 0.33, seed=30)
gen_asteroid("asteroid_plasma_2.png", (110,60,15), (255,80,0), 108, 0.3, seed=31)
gen_asteroid("asteroid_plasma_3.png", (80,30,90), (200,60,255), 88, 0.3, seed=32)
# Sector 5 - void
gen_asteroid("asteroid_void_1.png", (35,35,50), (120,0,255), 120, 0.35, seed=40)
gen_asteroid("asteroid_void_2.png", (25,30,45), (0,255,180), 96, 0.4, seed=41)
gen_asteroid("asteroid_void_3.png", (45,40,60), (255,20,120), 104, 0.32, seed=42)

# ---------- RESOURCE ICONS (15) ----------
resources = [
    ("iron", (180,180,185), "Fe"),
    ("copper", (200,120,70), "Cu"),
    ("nickel", (170,185,170), "Ni"),
    ("titanium", (200,210,220), "Ti"),
    ("silver", (210,215,225), "Ag"),
    ("gold", (255,215,0), "Au"),
    ("platinum", (220,230,240), "Pt"),
    ("uranium", (100,220,80), "U"),
    ("crystal", (120,220,255), "Cr"),
    ("plasma_ore", (255,120,20), "Pl"),
    ("void_crystal", (180,80,255), "Vc"),
    ("cobalt", (50,120,200), "Co"),
    ("iridium", (180,160,210), "Ir"),
    ("dark_matter", (40,40,60), "Dm"),
    ("quantum_core", (255,50,120), "Qc"),
]

def gen_resource_icon(name, col, symbol):
    size=64
    img = Image.new("RGBA", (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # shadow
    d.ellipse([6, 10, 58, 58], fill=(0,0,0,70))
    # gem shape - hexagon-ish
    cx,cy=32,30
    # base octagon
    pts = []
    for i in range(8):
        ang = math.radians(45*i - 22.5)
        r = 22 if i%2==0 else 18
        # top facet smaller
        pts.append((cx+math.cos(ang)*r, cy+math.sin(ang)*r*0.9))
    d.polygon(pts, fill=col, outline=(255,255,255,80), width=1)
    # inner highlight
    inner = [(cx-8, cy-10),(cx+4, cy-12),(cx+10, cy-4),(cx+6, cy+8),(cx-6, cy+6),(cx-10,cy-2)]
    d.polygon(inner, fill=(min(255,col[0]+45), min(255,col[1]+45), min(255,col[2]+45)), outline=(255,255,255,55))
    # bottom shadow facet
    bottom = [(cx-6, cy+6),(cx+6, cy+8),(cx+4, cy+14),(cx-8, cy+12)]
    d.polygon(bottom, fill=(max(0,col[0]-40),max(0,col[1]-40),max(0,col[2]-40)))
    # sparkle
    d.ellipse([cx+6, cy-8, cx+10, cy-4], fill=(255,255,255,190))
    d.ellipse([cx+7, cy-7, cx+9, cy-5], fill=(255,255,255,255))
    # symbol text simple
    # Use small ellipses to indicate rarity shine border
    # border glow by color intensity
    save(img, name)

for rid, col, sym in resources:
    gen_resource_icon(f"res_{rid}.png", col, sym)

# ---------- ENEMIES ----------
def gen_enemy(name, body, accent, size=96, kind="scout"):
    img = Image.new("RGBA", (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx,cy = size//2, size//2
    if kind=="scout":
        # small diamond drone
        pts = [(cx,cy-24),(cx+16,cy),(cx,cy+18),(cx-16,cy)]
        d.polygon(pts, fill=body, outline=(0,0,0,90), width=1)
        d.ellipse([cx-6,cy-8,cx+6,cy+4], fill=accent, outline=(255,255,255,70))
        d.ellipse([cx-3,cy-5,cx+1,cy-1], fill=(255,255,255,170))
        # wings
        d.polygon([(cx-16,cy),(cx-24,cy-6),(cx-18,cy+2)], fill=(50,50,60))
        d.polygon([(cx+16,cy),(cx+24,cy-6),(cx+18,cy+2)], fill=(50,50,60))
    elif kind=="raider":
        # angular fighter
        pts = [(cx,cy-28),(cx+12,cy-10),(cx+18,cy+16),(cx,cy+22),(cx-18,cy+16),(cx-12,cy-10)]
        d.polygon(pts, fill=body, outline=(255,255,255,30), width=1)
        d.rectangle([cx-7,cy-18,cx+7,cy-6], fill=accent)
        d.rectangle([cx-3,cy+10,cx+3,cy+22], fill=(40,40,50))
        d.ellipse([cx-4,cy-14,cx+0,cy-10], fill=(255,255,255,180))
    elif kind=="heavy":
        pts = [(cx,cy-22),(cx+20,cy-8),(cx+18,cy+18),(cx,cy+24),(cx-18,cy+18),(cx-20,cy-8)]
        d.polygon(pts, fill=body, outline=(0,0,0,80), width=1)
        d.rectangle([cx-12,cy-12,cx+12,cy+6], fill=(60,60,70), outline=(90,90,100))
        d.ellipse([cx-5,cy-6,cx+5,cy+2], fill=accent)
        # cannons
        d.rectangle([cx-14,cy+12,cx-8,cy+24], fill=(40,40,50))
        d.rectangle([cx+8,cy+12,cx+14,cy+24], fill=(40,40,50))
    elif kind=="plasma":
        # spiky
        for i in range(6):
            ang = math.radians(60*i)
            x1 = cx+math.cos(ang)*14
            y1 = cy+math.sin(ang)*14
            x2 = cx+math.cos(ang)*22
            y2 = cy+math.sin(ang)*22
            d.polygon([(cx,cy),(x1+4,y1),(x2,y2),(x1-4,y1)], fill=body, outline=accent)
        d.ellipse([cx-12,cy-12,cx+12,cy+12], fill=body, outline=(255,255,255,40), width=1)
        d.ellipse([cx-7,cy-7,cx+7,cy+7], fill=accent)
        d.ellipse([cx-3,cy-3,cx+0,cy+0], fill=(255,255,255,200))
    elif kind=="sentinel":
        # large ominous
        pts = [(cx,cy-30),(cx+22,cy-12),(cx+16,cy+20),(cx,cy+26),(cx-16,cy+20),(cx-22,cy-12)]
        d.polygon(pts, fill=body, outline=(120,0,255), width=2)
        d.ellipse([cx-10,cy-10,cx+10,cy+6], fill=(20,20,30), outline=accent, width=2)
        d.ellipse([cx-6,cy-6,cx+6,cy+0], fill=accent)
        d.ellipse([cx+6,cy+14,cx+10,cy+18], fill=(255,80,80))
        d.ellipse([cx-10,cy+14,cx-6,cy+18], fill=(255,80,80))
    # shadow
    # glow
    glow = Image.new("RGBA", (size,size), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx-18,cy-8,cx+18,cy+12], fill=(*accent, 18))
    img = Image.alpha_composite(img, glow)
    save(img, name)

gen_enemy("enemy_scout.png", (90,95,110), (255,80,80), 96, "scout")
gen_enemy("enemy_raider.png", (110,85,70), (255,180,40), 96, "raider")
gen_enemy("enemy_heavy.png", (80,85,90), (255,60,60), 108, "heavy")
gen_enemy("enemy_plasma.png", (100,50,120), (120,255,255), 104, "plasma")
gen_enemy("enemy_sentinel.png", (40,35,55), (180,20,255), 128, "sentinel")

# ---------- BACKGROUNDS / NEBULA TILES ----------
def gen_nebula_tile(name, c1, c2, c3, size=512):
    img = Image.new("RGBA", (size,size), (10,12,18,255))
    d = ImageDraw.Draw(img, "RGBA")
    # stars
    for _ in range(300):
        x = random.randint(0,size-1); y=random.randint(0,size-1)
        b = random.randint(140,255)
        r = random.randint(1,2)
        d.ellipse([x-r,y-r,x+r,y+r], fill=(b,b,b,200))
    # nebula clouds via blurred ellipses
    for _ in range(8):
        x = random.randint(-80,size+80); y=random.randint(-80,size+80)
        w = random.randint(120,260); h=random.randint(80,180)
        col = random.choice([c1,c2,c3])
        cloud = Image.new("RGBA", (size,size), (0,0,0,0))
        cd = ImageDraw.Draw(cloud)
        cd.ellipse([x-w//2,y-h//2,x+w//2,y+h//2], fill=(*col, 28))
        cloud = cloud.filter(ImageFilter.GaussianBlur(18))
        img = Image.alpha_composite(img, cloud)
    # secondary smaller clouds
    for _ in range(10):
        x = random.randint(0,size); y=random.randint(0,size)
        w = random.randint(40,90); h=random.randint(30,70)
        col = random.choice([c1,c2,c3])
        cloud = Image.new("RGBA", (size,size), (0,0,0,0))
        cd = ImageDraw.Draw(cloud)
        cd.ellipse([x-w//2,y-h//2,x+w//2,y+h//2], fill=(*col, 20))
        cloud = cloud.filter(ImageFilter.GaussianBlur(10))
        img = Image.alpha_composite(img, cloud)
    save(img, name)

gen_nebula_tile("nebula_starter.png", (60,90,140), (40,60,100), (80,70,110), 512)
gen_nebula_tile("nebula_crystal.png", (90,40,140), (40,120,160), (180,60,120), 512)
gen_nebula_tile("nebula_graveyard.png", (90,70,50), (70,70,80), (120,80,60), 512)
gen_nebula_tile("nebula_plasma.png", (140,100,20), (160,60,20), (80,40,140), 512)
gen_nebula_tile("nebula_void.png", (30,20,60), (80,20,90), (20,40,80), 512)

# ---------- UI ELEMENTS ----------
# Button base
def gen_button(name, w=240, h=56, col=(52,62,88)):
    img = Image.new("RGBA", (w,h), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # shadow
    d.rounded_rectangle([2,4,w-2,h-2], radius=10, fill=(0,0,0,80))
    d.rounded_rectangle([0,0,w-4,h-6], radius=10, fill=col, outline=(255,255,255,35), width=1)
    # highlight top
    d.rounded_rectangle([2,2,w-6,12], radius=8, fill=(255,255,255,18))
    # inner border
    d.rounded_rectangle([6,6,w-10,h-12], radius=7, outline=(255,255,255,14), width=1)
    save(img, name)

gen_button("btn_primary.png", 240,56,(62,88,165))
gen_button("btn_upgrade.png", 300,64,(75,95,70))
gen_button("btn_sector.png", 260,78,(85,75,115))
gen_button("btn_small.png", 140,42,(62,72,98))

# Panel
def gen_panel(name, w=360,h=220):
    img = Image.new("RGBA", (w,h), (0,0,0,0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0,0,w-1,h-1], radius=14, fill=(18,22,36,220), outline=(90,110,160,55), width=1)
    d.rounded_rectangle([2,2,w-3,28], radius=10, fill=(30,40,70,180))
    # top shine
    d.rounded_rectangle([4,4,w-6,12], radius=8, fill=(255,255,255,10))
    save(img, name)

gen_panel("panel_main.png", 420,260)
gen_panel("panel_hud.png", 360,120)
gen_panel("panel_upgrade.png", 340,420)

# Icon: credits, energy, cargo etc
def gen_icon(name, bg, sym_col, shape="circle"):
    img = Image.new("RGBA", (48,48), (0,0,0,0))
    d = ImageDraw.Draw(img)
    d.ellipse([2,2,46,46], fill=bg, outline=(255,255,255,40), width=1)
    d.ellipse([6,6,18,18], fill=(255,255,255,90))
    # symbol simplified as rect/circle
    if shape=="circle":
        d.ellipse([16,16,32,32], fill=sym_col, outline=(255,255,255,120), width=1)
    elif shape=="diamond":
        d.polygon([(24,14),(34,24),(24,34),(14,24)], fill=sym_col, outline=(255,255,255,120))
    elif shape=="shield":
        d.polygon([(24,12),(32,18),(32,28),(24,36),(16,28),(16,18)], fill=sym_col, outline=(255,255,255,70))
    save(img, name)

gen_icon("icon_credits.png", (40,55,120), (255,215,0), "circle")
gen_icon("icon_energy.png", (30,60,110), (80,220,255), "diamond")
gen_icon("icon_cargo.png", (60,55,40), (200,180,120), "circle")
gen_icon("icon_shield.png", (35,55,95), (100,180,255), "shield")

# ---------- PARTICLE TEXTURES ----------
def gen_particle(name, col, size=32, kind="glow"):
    img = Image.new("RGBA", (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx=size//2
    if kind=="glow":
        for r in range(size//2,0,-1):
            a = int(180 * (r/(size//2)) * 0.6)
            d.ellipse([cx-r,cx-r,cx+r,cx+r], fill=(*col, a))
        d.ellipse([cx-3,cx-3,cx+3,cx+3], fill=(255,255,255,230))
    elif kind=="spark":
        d.polygon([(cx,2),(cx+2, cx-6),(cx+6,cx),(cx+2,cx+6),(cx, size-2),(cx-2,cx+6),(cx-6,cx),(cx-2,cx-6)], fill=col, outline=(255,255,255,150))
    elif kind=="fragment":
        pts=[(4,6),(size-6,5),(size-8,size-8),(6,size-6)]
        d.polygon(pts, fill=col, outline=(0,0,0,90))
    save(img,name)

gen_particle("particle_glow_blue.png", (80,160,255), 32, "glow")
gen_particle("particle_glow_orange.png", (255,180,60), 32, "glow")
gen_particle("particle_glow_purple.png", (180,80,255), 32, "glow")
gen_particle("particle_spark.png", (255,240,180), 16, "spark")
gen_particle("particle_fragment.png", (130,125,115), 12, "fragment")

# ---------- APP ICON (256) ----------
def gen_app_icon():
    size=256
    img=Image.new("RGBA",(size,size),(0,0,0,0))
    d=ImageDraw.Draw(img)
    # background gradient approximation
    d.rounded_rectangle([0,0,size-1,size-1], radius=48, fill=(14,18,32), outline=(90,110,170,60), width=2)
    # inner glow nebula
    for i in range(8):
        cloud=Image.new("RGBA",(size,size),(0,0,0,0))
        cd=ImageDraw.Draw(cloud)
        x=random.randint(40,size-40); y=random.randint(40,size-40)
        w=random.randint(80,140);h=random.randint(60,110)
        col=random.choice([(60,90,160),(90,60,140),(140,90,40)])
        cd.ellipse([x-w//2,y-h//2,x+w//2,y+h//2], fill=(*col,22))
        cloud=cloud.filter(ImageFilter.GaussianBlur(12))
        img=Image.alpha_composite(img, cloud)
    # asteroid
    d.ellipse([38,62,128,148], fill=(115,110,105), outline=(0,0,0,70), width=1)
    d.ellipse([54,78,70,92], fill=(85,80,75))
    d.ellipse([88,88,108,108], fill=(190,160,40), outline=(255,255,255,70))
    d.ellipse([66,96,78,108], fill=(90,85,80))
    # ship silhouette top
    hull=[(128,44),(148,78),(142,118),(112,128),(84,118),(92,78)]
    d.polygon(hull, fill=(200,210,230), outline=(255,255,255,90))
    d.ellipse([108,68,132,86], fill=(120,200,255), outline=(255,255,255,120))
    # mining beam
    d.polygon([(120,86),(132,86),(112,148),(108,148)], fill=(80,220,255,55))
    # stars
    for _ in range(20):
        x=random.randint(12,size-12); y=random.randint(12,size-12)
        d.ellipse([x-1,y-1,x+1,y+1], fill=(255,255,255,180))
    # border shine
    d.rounded_rectangle([6,6,size-6,size-6], radius=42, outline=(255,255,255,14), width=1)
    img=img.filter(ImageFilter.SMOOTH)
    save(img,"app_icon.png")
    # also save larger ico style copies
    img.resize((512,512), Image.LANCZOS).save(os.path.join(OUT,"app_icon_512.png"))

gen_app_icon()

# ---------- LOADING SCREEN ----------
def gen_loading():
    img=Image.new("RGB",(1920,1080),(8,12,22))
    d=ImageDraw.Draw(img, "RGBA")
    # stars
    for _ in range(800):
        x=random.randint(0,1920); y=random.randint(0,1080)
        b=random.randint(120,255); s=random.randint(1,2)
        d.ellipse([x-s,y-s,x+s,y+s], fill=(b,b,b,230))
    # nebula glow
    for _ in range(6):
        cloud=Image.new("RGBA",(1920,1080),(0,0,0,0))
        cd=ImageDraw.Draw(cloud)
        x=random.randint(200,1720); y=random.randint(200,880)
        w=random.randint(400,800); h=random.randint(250,500)
        col=random.choice([(50,80,140),(90,50,130),(140,90,40),(60,100,90)])
        cd.ellipse([x-w//2,y-h//2,x+w//2,y+h//2], fill=(*col,18))
        cloud=cloud.filter(ImageFilter.GaussianBlur(30))
        img=Image.alpha_composite(img.convert("RGBA"), cloud).convert("RGB")
    # vignette
    vig=Image.new("RGBA",(1920,1080),(0,0,0,0))
    vd=ImageDraw.Draw(vig)
    vd.rectangle([0,0,1920,1080], fill=(0,0,0,0))
    # add title area will be done in HTML but create placeholder
    save(Image.fromarray(img.convert("RGB").tobytes() and img) if False else img.convert("RGBA"), "loading_bg.png")

gen_loading()

print("All assets generated successfully")
