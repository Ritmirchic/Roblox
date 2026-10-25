#!/usr/bin/env python3
"""Procedural asset factory for DON'T LOOK BACK.
Generates detailed textures, furniture/entity sprites, UI art, icon and
fully synthesized spatial audio (no external/copyrighted assets)."""
import math, os, random, wave, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

random.seed(1987); np.random.seed(1987)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, "assets/textures"); S = os.path.join(ROOT, "assets/sprites")
A = os.path.join(ROOT, "assets/sounds"); U = os.path.join(ROOT, "assets/ui")
for d in (T,S,A,U): os.makedirs(d, exist_ok=True)
def font(sz):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
    return ImageFont.load_default()
def grain(img, amt=10):
    a = np.array(img).astype(np.int16)
    a += np.random.randint(-amt, amt+1, a.shape[:2])[...,None] if a.ndim==3 else np.random.randint(-amt,amt+1,a.shape)
    return Image.fromarray(np.clip(a,0,255).astype("uint8"), img.mode)
def stains(d, n, box, col, rmax=26):
    for _ in range(n):
        x,y = random.randint(box[0],box[2]), random.randint(box[1],box[3]); r=random.randint(3,rmax)
        d.ellipse([x-r,y-r//2,x+r,y+r//2], fill=col)
def save(img, folder, name): img.save(os.path.join(folder,name)); print(" ", name)

# ---------------- WALL TEXTURES 256x256 ----------------
def wallpaper(name, base, stripe, damask, dirty=0.4, faces=False):
    im = Image.new("RGB",(256,256),base); d=ImageDraw.Draw(im,"RGBA")
    for x in range(0,256,32): d.rectangle([x,0,x+15,256], fill=stripe)
    for y in range(16,256,42):
        for x in range(8,256,32):
            d.polygon([(x+8,y-9),(x+16,y),(x+8,y+9),(x,y)], outline=damask); d.ellipse([x+5,y-3,x+11,y+3], outline=damask)
    d.rectangle([0,218,256,256], fill=(58,46,36)); d.rectangle([0,214,256,219], fill=(92,74,54))  # skirting
    d.rectangle([0,0,256,10], fill=(70,60,48))
    stains(d, int(30*dirty), (0,0,256,256), (40,34,24,40))
    for _ in range(int(8*dirty)):  # water streaks
        x=random.randint(0,250); d.rectangle([x,0,x+random.randint(2,6),random.randint(40,200)], fill=(50,44,30,45))
    if faces:  # anomaly wallpaper: faint faces pressing through
        for (x,y) in [(60,80),(175,60),(120,165),(210,150)]:
            d.ellipse([x-20,y-26,x+20,y+26], fill=(150,140,120,55))
            d.ellipse([x-11,y-8,x-4,y-1], fill=(30,26,20,90)); d.ellipse([x+4,y-8,x+11,y-1], fill=(30,26,20,90))
            d.ellipse([x-6,y+10,x+6,y+20], fill=(30,26,20,80))
    save(grain(im,7), T, name)

def concrete(name, base=(96,94,88), dark=False):
    im=Image.new("RGB",(256,256),base); d=ImageDraw.Draw(im,"RGBA")
    stains(d,90,(0,0,256,256),(60,58,50,35),40); stains(d,40,(0,0,256,256),(130,128,118,30),22)
    for _ in range(14):  # cracks
        x,y=random.randint(0,256),random.randint(0,256)
        for i in range(random.randint(3,8)):
            x2,y2=x+random.randint(-18,18),y+random.randint(4,20); d.line([x,y,x2,y2],fill=(40,38,34,160),width=1); x,y=x2,y2
    d.rectangle([0,226,256,256], fill=(52,50,46))
    if dark: stains(d,60,(0,120,256,256),(20,20,18,50),36)
    save(grain(im,9),T,name)

def tiles(name, base, grout, broken=3):
    im=Image.new("RGB",(256,256),grout); d=ImageDraw.Draw(im,"RGBA")
    for y in range(0,256,42):
        for x in range(0,256,42):
            c=tuple(max(0,min(255,v+random.randint(-14,14))) for v in base)
            d.rectangle([x+2,y+2,x+40,y+40],fill=c); d.rectangle([x+2,y+2,x+40,y+9],fill=(255,255,255,28))
    for _ in range(broken):
        x,y=random.randrange(0,256,42),random.randrange(0,256,42); d.rectangle([x+2,y+2,x+40,y+40],fill=(70,66,58))
        d.line([x+4,y+4,x+38,y+38],fill=(30,28,24),width=2); d.line([x+38,y+4,x+4,y+38],fill=(30,28,24),width=1)
    stains(d,36,(0,0,256,256),(46,52,44,40))
    save(grain(im,6),T,name)

def door(name, base, num="", metal=False, ajar_eye=False):
    im=Image.new("RGB",(256,256),(44,38,32)); d=ImageDraw.Draw(im,"RGBA")
    d.rectangle([28,4,228,256], fill=base)
    if metal:
        for i in range(40): d.line([30,random.randint(0,256),226,random.randint(0,256)],fill=(255,255,255,10))
        d.rectangle([70,36,186,110], outline=(30,30,32), width=4); d.rectangle([80,46,176,100], fill=(26,30,34))
        d.rectangle([70,140,186,230], outline=(30,30,32), width=4)
        for (x,y) in [(40,20),(216,20),(40,236),(216,236)]: d.ellipse([x-4,y-4,x+4,y+4],fill=(20,20,20))
    else:
        for (x0,y0,x1,y1) in [(52,26,204,104),(52,122,204,196)]:
            d.rectangle([x0,y0,x1,y1],outline=(30,20,12),width=5)
            d.rectangle([x0+10,y0+10,x1-10,y1-10],outline=(120,86,50),width=2)
        for i in range(60):  # wood grain
            x=random.randint(32,224); d.line([x,4,x+random.randint(-4,4),256],fill=(60,38,18,40))
    d.ellipse([196,128,214,146], fill=(176,150,84)); d.ellipse([201,133,209,141], fill=(90,70,34))  # knob
    d.rectangle([198,112,210,128], fill=(120,100,56))
    if num:
        d.rectangle([104,14,152,42],fill=(150,126,70)); d.text((128,28),num,font=font(19),fill=(30,24,14),anchor="mm")
    stains(d,18,(28,180,228,256),(20,16,10,60))
    if ajar_eye:
        d.rectangle([120,0,150,256],fill=(4,3,3)); d.ellipse([128,92,144,104],fill=(210,200,180)); d.ellipse([133,96,140,102],fill=(10,8,8))
    save(grain(im,6),T,name)

def painting(name, kind):
    im=Image.new("RGB",(256,256),(52,40,26)); d=ImageDraw.Draw(im,"RGBA")
    d.rectangle([10,10,246,246],fill=(120,92,44)); d.rectangle([24,24,232,232],fill=(24,26,30))
    if kind=="portrait":
        d.rectangle([24,24,232,232],fill=(62,58,52))
        d.ellipse([88,52,168,146],fill=(196,164,130)); d.polygon([(70,232),(96,140),(160,140),(190,232)],fill=(38,36,44))
        d.ellipse([106,88,118,97],fill=(30,24,20)); d.ellipse([140,88,152,97],fill=(30,24,20))
        d.arc([110,104,148,130],10,170,fill=(90,50,44),width=3); d.rectangle([84,44,172,66],fill=(70,56,40))
    elif kind=="portrait_bad":  # eyes follow / mouth open (anomaly #1)
        d.rectangle([24,24,232,232],fill=(40,36,38))
        d.ellipse([84,46,172,156],fill=(206,196,182)); d.polygon([(64,232),(92,148),(164,148),(196,232)],fill=(16,14,18))
        d.ellipse([102,84,120,100],fill=(8,6,6)); d.ellipse([138,84,156,100],fill=(8,6,6))
        d.ellipse([112,116,146,150],fill=(10,4,4)); d.rectangle([80,38,176,58],fill=(24,20,18))
        for x in (110,146): d.rectangle([x,98,x+4,124],fill=(90,16,16,180))
    elif kind=="landscape":
        d.rectangle([24,24,232,140],fill=(96,120,140)); d.rectangle([24,140,232,232],fill=(66,84,52))
        d.ellipse([176,40,214,78],fill=(226,206,140)); d.polygon([(24,140),(90,84),(140,140)],fill=(70,76,88))
        d.polygon([(100,140),(168,92),(232,140)],fill=(56,62,74)); d.rectangle([52,168,96,202],fill=(110,84,56)); d.polygon([(46,168),(74,148),(102,168)],fill=(70,44,34))
    else:  # landscape_bad: figure in field, red sky
        d.rectangle([24,24,232,140],fill=(128,44,36)); d.rectangle([24,140,232,232],fill=(40,40,30))
        d.ellipse([176,40,214,78],fill=(20,16,16)); d.polygon([(24,140),(90,84),(140,140)],fill=(40,38,44))
        d.polygon([(100,140),(168,92),(232,140)],fill=(30,30,36))
        d.rectangle([120,150,134,204],fill=(8,8,8)); d.ellipse([118,138,136,156],fill=(8,8,8))
        d.ellipse([122,145,126,149],fill=(230,230,220)); d.ellipse([129,145,133,149],fill=(230,230,220))
    save(grain(im.filter(ImageFilter.GaussianBlur(0.4)),5),T,name)

def window(name, kind):
    im=Image.new("RGB",(256,256),(58,52,46)); d=ImageDraw.Draw(im,"RGBA")
    views={"night":(16,22,38),"eye":(90,20,18),"face":(20,20,24),"void":(4,4,8)}
    d.rectangle([34,20,222,236],fill=views[kind])
    if kind=="night":
        for _ in range(50): d.point((random.randint(38,218),random.randint(24,140)),fill=(200,210,230))
        d.ellipse([168,36,204,72],fill=(216,220,224)); d.ellipse([180,32,208,68],fill=(16,22,38))
        d.rectangle([34,170,222,236],fill=(10,12,18))
        for x in range(44,220,18):
            for y in range(176,230,14):
                if random.random()<0.4: d.rectangle([x,y,x+7,y+8],fill=(226,188,96))
    elif kind=="eye":  # impossible view (anomaly #6): giant eye filling sky
        d.ellipse([40,60,216,196],fill=(216,204,186)); d.ellipse([92,84,164,172],fill=(70,40,30)); d.ellipse([112,104,144,152],fill=(6,4,4))
        d.ellipse([120,112,132,124],fill=(240,240,230))
        for _ in range(16): d.line([128,128,random.randint(44,212),random.randint(64,192)],fill=(150,40,34,120))
    elif kind=="face":  # anomaly #28 watcher
        d.ellipse([78,50,178,176],fill=(186,178,164)); d.ellipse([98,94,114,108],fill=(8,6,6)); d.ellipse([142,94,158,108],fill=(8,6,6))
        d.ellipse([116,138,140,158],fill=(12,8,8)); d.rectangle([70,40,186,62],fill=(14,12,12))
        for x in (52,196): 
            for i in range(4): d.rectangle([x-4,120+i*16,x+16,128+i*16],fill=(170,162,148))
    d.rectangle([122,20,134,236],fill=(70,62,52)); d.rectangle([34,120,222,130],fill=(70,62,52))
    d.rectangle([28,14,228,242],outline=(84,74,62),width=7)
    for _ in range(24):  # rain / grime
        x=random.randint(36,220); d.line([x,random.randint(22,120),x-3,random.randint(140,234)],fill=(200,210,220,36))
    save(grain(im,5),T,name)

def elevator(name, open_dark=False, brick=False):
    im=Image.new("RGB",(256,256),(70,68,66)); d=ImageDraw.Draw(im,"RGBA")
    if brick:  # anomaly #22: lift opens onto brick wall
        d.rectangle([40,10,216,256],fill=(110,62,48))
        for y in range(10,256,26):
            off=22 if (y//26)%2 else 0
            for x in range(18+off,216,46): d.rectangle([x,y,x+42,y+22],outline=(70,44,36),width=3)
    elif open_dark:
        d.rectangle([48,8,208,256],fill=(6,6,8)); d.rectangle([48,8,208,30],fill=(60,54,40))
        d.ellipse([116,60,140,76],fill=(200,180,120,60))
    else:
        d.rectangle([48,8,128,256],fill=(128,126,120)); d.rectangle([128,8,208,256],fill=(116,114,108))
        for i in range(70): d.line([random.randint(50,206),8,random.randint(50,206),256],fill=(255,255,255,9))
        d.rectangle([126,8,130,256],fill=(30,30,30))
    d.rectangle([104,0,152,20],fill=(24,24,26)); d.polygon([(128,4),(118,16),(138,16)],fill=(216,170,70))
    d.rectangle([222,108,240,150],fill=(36,36,38)); d.ellipse([226,114,236,124],fill=(190,60,44)); d.ellipse([226,130,236,140],fill=(90,160,90))
    save(grain(im,6),T,name)

def sign(name, text, bg, fg, sub=""):
    im=Image.new("RGB",(256,256),(88,84,78)); d=ImageDraw.Draw(im,"RGBA")
    stains(d,40,(0,0,256,256),(60,58,50,35),30)
    d.rounded_rectangle([28,84,228,172],8,fill=bg,outline=(230,230,220),width=3)
    d.text((128,120),text,font=font(34),fill=fg,anchor="mm")
    if sub: d.text((128,152),sub,font=font(15),fill=fg,anchor="mm")
    save(grain(im,6),T,name)

def board(name):  # notice board with tenant notices (story texture)
    im=Image.new("RGB",(256,256),(86,70,48)); d=ImageDraw.Draw(im,"RGBA")
    d.rectangle([16,30,240,226],fill=(104,82,54),outline=(50,38,22),width=5)
    notes=[("MISSING",(214,206,186)),("APT 4B",(226,214,170)),("NOISE?",(220,220,214)),("4B 4B 4B",(200,190,170)),("DO NOT",(214,198,180)),("LOOK BACK",(226,220,200))]
    pos=[(30,44),(104,40),(178,46),(36,126),(112,130),(176,124)]
    for (txt,c),(x,y) in zip(notes,pos):
        d.rectangle([x,y,x+62,y+72],fill=c); d.ellipse([x+27,y+3,x+35,y+11],fill=(170,40,34))
        d.text((x+31,y+24),txt,font=font(11),fill=(40,36,30),anchor="mm")
        for i in range(3): d.line([x+8,y+38+i*9,x+54,y+38+i*9],fill=(110,104,92),width=2)
    save(grain(im,6),T,name)

print("Textures:")
wallpaper("wall_corridor.png",(104,96,74),(92,84,62),(150,138,102),0.5)
wallpaper("wall_corridor_alt.png",(96,58,52),(84,48,44),(140,92,80),0.9,faces=True)
wallpaper("wall_apt.png",(110,104,86),(100,94,76),(156,148,116),0.3)
concrete("wall_concrete.png"); concrete("wall_basement.png",(74,72,66),dark=True)
tiles("wall_bath.png",(148,164,158),(92,96,90)); tiles("wall_laundry.png",(140,148,138),(86,90,84),6)
door("door_apt.png",(104,72,42),"4B"); door("door_apt2.png",(96,66,40),"4A"); door("door_apt3.png",(96,66,40),"4C")
door("door_metal.png",(96,100,104),metal=True); door("door_new.png",(40,34,36),"0"); door("door_ajar.png",(96,66,40),"4C",ajar_eye=True)
door("door_exit.png",(70,84,70),metal=True)
painting("painting_portrait.png","portrait"); painting("painting_portrait_bad.png","portrait_bad")
painting("painting_land.png","landscape"); painting("painting_land_bad.png","landscape_bad")
window("window_night.png","night"); window("window_eye.png","eye"); window("window_face.png","face"); window("window_void.png","void")
elevator("elevator.png"); elevator("elevator_dark.png",open_dark=True); elevator("elevator_brick.png",brick=True)
sign("sign_exit.png","EXIT",(24,90,48),(230,240,230),"STAIRS")
sign("sign_laundry.png","LAUNDRY",(40,52,74),(220,228,238))
sign("sign_maint.png","MAINT.",(120,84,24),(240,230,200),"STAFF ONLY")
sign("sign_storage.png","STORAGE",(70,64,52),(228,224,206))
sign("sign_floor.png","FLOOR 4",(28,28,32),(206,200,180),"MERIDIAN HOUSE")
board("notice_board.png")
# brick (basement / blocked)
im=Image.new("RGB",(256,256),(96,58,46)); d=ImageDraw.Draw(im,"RGBA")
for y in range(0,256,32):
    off=32 if (y//32)%2 else 0
    for x in range(-32+off,256,64): d.rectangle([x+2,y+2,x+62,y+30],fill=tuple(96+random.randint(-16,16) for _ in range(1))*0+(random.randint(84,116),random.randint(48,66),random.randint(38,52)))
stains(d,40,(0,0,256,256),(40,30,24,45),30); save(grain(im,8),T,"wall_brick.png")
# floor / ceiling reference (used for palette)
im=Image.new("RGB",(256,256),(74,56,40)); d=ImageDraw.Draw(im,"RGBA")
for y in range(0,256,36):
    d.rectangle([0,y,256,y+34],fill=(random.randint(64,84),random.randint(48,62),32))
    for i in range(12): d.line([0,y+random.randint(2,32),256,y+random.randint(2,32)],fill=(50,38,24,60))
save(grain(im,7),T,"floor_wood.png")

# ---------------- SPRITES (transparent) ----------------
def spr(name, draw, size=(256,256)):
    im=Image.new("RGBA",size,(0,0,0,0)); d=ImageDraw.Draw(im); draw(d)
    save(im,S,name)
def shade_poly(d,pts,base):
    d.polygon(pts,fill=base)
def sofa(d,bad=False):
    c=(86,44,40,255) if not bad else (52,30,44,255)
    d.rounded_rectangle([18,110,238,196],14,fill=c); d.rounded_rectangle([30,76,226,140],12,fill=tuple(min(255,v+16) for v in c[:3])+(255,))
    d.rounded_rectangle([8,96,44,200],10,fill=c); d.rounded_rectangle([212,96,248,200],10,fill=c)
    d.line([128,82,128,190],fill=(30,18,16,255),width=4)
    for x in (66,128,190): d.ellipse([x-5,104,x+5,114],fill=(40,22,20,255))
    d.rectangle([30,198,46,218],fill=(40,30,20,255)); d.rectangle([210,198,226,218],fill=(40,30,20,255))
    if bad:
        for x in range(40,220,18): d.polygon([(x,140),(x+8,158),(x+16,140)],fill=(220,214,196,255))  # teeth cushions
def chair(d,tall=False):
    top=20 if tall else 74
    d.rectangle([78,top,178,140],fill=(96,64,36,255)); d.rectangle([90,top+12,166,128],fill=(70,44,24,255))
    d.rectangle([64,138,192,156],fill=(110,74,40,255))
    for x in (72,176): d.rectangle([x,156,x+10,226],fill=(70,46,24,255))
    for x in (92,154): d.rectangle([x,156,x+8,214],fill=(56,36,18,255))
def table(d):
    d.rectangle([26,120,230,138],fill=(104,70,38,255)); d.rectangle([26,112,230,122],fill=(128,88,48,255))
    for x in (38,206): d.rectangle([x,138,x+12,228],fill=(72,48,24,255))
    d.rectangle([96,84,150,112],fill=(170,162,140,255)); d.rectangle([100,88,146,108],fill=(200,196,178,255))  # papers/box
    d.ellipse([168,92,196,112],fill=(150,60,44,255))
def lamp(d,on=True):
    d.rectangle([120,120,136,226],fill=(52,48,44,255)); d.rectangle([96,224,160,234],fill=(40,36,32,255))
    d.polygon([(92,124),(164,124),(148,66),(108,66)],fill=(224,196,132,255) if on else (130,118,96,255))
    if on: d.ellipse([112,78,144,110],fill=(255,236,170,200))
def plant(d,dead=False):
    d.polygon([(88,236),(168,236),(158,182),(98,182)],fill=(140,74,44,255)); d.rectangle([92,172,164,186],fill=(160,88,52,255))
    col=(90,76,40,255) if dead else (52,106,52,255)
    for a in range(14):
        ang=-2.6+a*0.36; x2=128+int(math.cos(ang)*random.randint(38,74)); y2=176-int(abs(math.sin(ang))*random.randint(60,120))-30
        d.line([128,178,x2,y2],fill=col,width=5); d.ellipse([x2-10,y2-6,x2+10,y2+6],fill=col)
def tv(d,static=False):
    d.rounded_rectangle([36,58,220,176],8,fill=(26,26,30,255))
    if static:
        for _ in range(700): d.point((random.randint(48,208),random.randint(70,164)),fill=(random.randint(120,255),)*3+(255,))
        d.text((128,116),"4B",font=font(30),fill=(255,60,50,255),anchor="mm")
    else:
        d.rectangle([48,70,208,164],fill=(18,26,34,255)); d.polygon([(48,164),(120,70),(160,70),(90,164)],fill=(70,90,110,90))
    d.rectangle([112,176,144,196],fill=(30,30,34,255)); d.rectangle([76,196,180,206],fill=(24,24,28,255))
def radio(d):
    d.rounded_rectangle([52,110,204,196],10,fill=(92,58,34,255)); d.ellipse([64,124,118,178],fill=(40,30,20,255)); d.ellipse([76,136,106,166],outline=(150,120,70,255),width=3)
    d.rectangle([128,124,194,150],fill=(214,190,130,255)); d.line([150,124,150,150],fill=(170,40,30,255),width=3)
    for x in (140,168): d.ellipse([x,160,x+20,182],fill=(52,38,22,255))
    d.line([190,110,236,40],fill=(160,160,160,255),width=3)
def fridge(d):
    d.rounded_rectangle([66,20,190,238],8,fill=(176,180,178,255)); d.line([66,92,190,92],fill=(90,94,92,255),width=4)
    d.rectangle([172,40,180,80],fill=(90,94,92,255)); d.rectangle([172,104,180,150],fill=(90,94,92,255))
    d.rectangle([86,40,122,76],fill=(226,214,150,255)); d.text((104,57),"MILK?",font=font(11),fill=(60,54,40,255),anchor="mm")
    d.rectangle([90,120,116,146],fill=(200,120,110,255))
def bed(d):
    d.rectangle([16,120,240,186],fill=(96,100,116,255)); d.rectangle([16,104,70,190],fill=(70,52,34,255))
    d.rounded_rectangle([26,118,104,150],8,fill=(216,212,200,255)); d.rectangle([96,124,240,180],fill=(74,84,104,255))
    for i in range(5): d.line([104+i*26,128,100+i*26,176],fill=(56,64,84,255),width=4)
    d.rectangle([30,186,44,214],fill=(50,38,24,255)); d.rectangle([214,186,228,214],fill=(50,38,24,255))
def washer(d):
    d.rounded_rectangle([58,58,198,238],8,fill=(168,172,170,255)); d.ellipse([82,104,174,196],fill=(40,48,54,255)); d.ellipse([94,116,162,184],fill=(70,86,96,255))
    d.rectangle([66,66,130,88],fill=(120,126,124,255)); d.ellipse([150,66,176,92],fill=(80,84,82,255)); d.ellipse([158,74,168,84],fill=(190,60,44,255))
def boxes(d):
    d.rectangle([30,140,140,236],fill=(140,108,66,255)); d.rectangle([120,158,232,236],fill=(124,96,58,255)); d.rectangle([76,66,186,146],fill=(152,120,74,255))
    for (x,y,w) in [(30,140,110),(120,158,112),(76,66,110)]: d.rectangle([x,y,x+w,y+12],fill=(110,84,48,255)); d.line([x+w//2,y,x+w//2,y+60],fill=(100,76,42,255),width=4)
    d.text((131,112),"4B - Mara",font=font(15),fill=(52,40,24,255),anchor="mm")
def wardrobe(d):
    d.rectangle([48,14,208,240],fill=(84,56,32,255)); d.rectangle([60,28,124,226],outline=(48,30,16,255),width=4); d.rectangle([132,28,196,226],outline=(48,30,16,255),width=4)
    d.ellipse([112,120,124,134],fill=(170,140,80,255)); d.ellipse([132,120,144,134],fill=(170,140,80,255))
def note(d):
    d.rectangle([78,54,178,196],fill=(224,216,194,255)); d.rectangle([78,54,178,196],outline=(120,110,88,255),width=3)
    for i in range(7): d.line([90,78+i*15,166-random.randint(0,24),78+i*15],fill=(90,84,70,255),width=3)
    d.text((128,66),"NOTE",font=font(13),fill=(60,50,36,255),anchor="mm")
def keyitem(d):
    d.ellipse([86,86,140,140],outline=(206,170,84,255),width=9); d.line([130,130,196,196],fill=(206,170,84,255),width=10)
    d.line([176,176,196,160],fill=(206,170,84,255),width=8); d.line([190,190,212,176],fill=(206,170,84,255),width=8)
def battery(d):
    d.rounded_rectangle([84,76,172,190],6,fill=(44,52,60,255)); d.rectangle([112,62,144,78],fill=(120,126,130,255))
    d.rectangle([84,76,172,116],fill=(196,58,44,255)); d.text((128,148),"+",font=font(34),fill=(230,230,220,255),anchor="mm")
def ceilinglamp(d):
    d.rectangle([122,0,134,44],fill=(50,48,44,255)); d.polygon([(84,86),(172,86),(146,42),(110,42)],fill=(210,200,170,255)); d.ellipse([112,74,144,94],fill=(255,240,180,255))
def pipes(d):
    for i,x in enumerate((78,112,150)):
        d.rectangle([x,0,x+22,256],fill=(104- i*8,100,92,255)); d.rectangle([x+4,0,x+8,256],fill=(160,154,140,255))
        for y in (52,140,214): d.rectangle([x-4,y,x+26,y+12],fill=(70,66,60,255))
    d.ellipse([140,120,184,164],outline=(150,54,40,255),width=7); d.line([162,120,162,164],fill=(150,54,40,255),width=5); d.line([140,142,184,142],fill=(150,54,40,255),width=5)
def panel(d):  # electrical panel
    d.rectangle([58,30,198,226],fill=(92,98,100,255)); d.rectangle([70,44,186,212],fill=(66,72,74,255))
    for r in range(4):
        for ccol in range(3):
            x,y=82+ccol*36,58+r*32; d.rectangle([x,y,x+24,y+18],fill=(34,36,38,255)); d.ellipse([x+17,y+3,x+22,y+8],fill=(200,70,44,255) if random.random()<.5 else (80,180,90,255))
    d.polygon([(128,178),(112,204),(124,204),(118,222),(140,194),(128,194)],fill=(236,196,60,255))
def figure(d, kind):
    if kind=="observer":  # tall, pale, elongated — original design
        d.polygon([(104,86),(152,86),(168,250),(88,250)],fill=(18,17,20,255))
        d.ellipse([102,8,154,88],fill=(208,200,186,255))
        d.ellipse([112,34,124,52],fill=(6,5,6,255)); d.ellipse([132,34,144,52],fill=(6,5,6,255))
        d.rectangle([124,62,132,76],fill=(14,10,10,255))
        d.line([104,96,74,196],fill=(18,17,20,255),width=13); d.line([152,96,182,196],fill=(18,17,20,255),width=13)
        for i in range(4): d.line([74,196,64+i*6,224],fill=(208,200,186,255),width=3); d.line([182,196,172+i*6,224],fill=(208,200,186,255),width=3)
    elif kind=="listener":  # hunched, huge ears, no eyes
        d.polygon([(86,104),(170,104),(188,250),(68,250)],fill=(34,32,30,255))
        d.ellipse([92,26,164,112],fill=(176,162,144,255))
        d.ellipse([58,42,98,110],fill=(186,170,150,255)); d.ellipse([158,42,198,110],fill=(186,170,150,255))
        d.ellipse([68,56,90,96],fill=(110,84,72,255)); d.ellipse([166,56,188,96],fill=(110,84,72,255))
        d.arc([108,66,148,104],0,180,fill=(40,30,26,255),width=4)
        d.line([92,120,58,208],fill=(34,32,30,255),width=15); d.line([164,120,198,208],fill=(34,32,30,255),width=15)
    elif kind=="imitator":  # player-like silhouette, wrong proportions, mirrored face
        d.polygon([(98,84),(158,84),(172,250),(84,250)],fill=(44,52,64,255))
        d.rectangle([104,150,152,166],fill=(150,58,44,255))  # similar jacket stripe but wrong colour side
        d.ellipse([100,10,156,84],fill=(192,170,146,255))
        d.ellipse([111,36,121,46],fill=(240,240,240,255)); d.ellipse([135,36,145,46],fill=(240,240,240,255))
        d.arc([112,48,144,72],180,360,fill=(30,22,20,255),width=3)  # upside-down smile
        d.line([100,94,84,188],fill=(44,52,64,255),width=12); d.line([156,94,184,168],fill=(44,52,64,255),width=12)
    else:  # shadow (anomaly #27)
        d.polygon([(104,80),(152,80),(166,250),(90,250)],fill=(8,8,10,225)); d.ellipse([102,10,154,84],fill=(8,8,10,225))
print("Sprites:")
spr("sofa.png", lambda d: sofa(d)); spr("sofa_bad.png", lambda d: sofa(d,True))
spr("chair.png", lambda d: chair(d)); spr("chair_tall.png", lambda d: chair(d,True))
spr("table.png", table); spr("lamp.png", lambda d: lamp(d)); spr("lamp_off.png", lambda d: lamp(d,False))
spr("plant.png", lambda d: plant(d)); spr("plant_dead.png", lambda d: plant(d,True))
spr("tv.png", lambda d: tv(d)); spr("tv_static.png", lambda d: tv(d,True))
spr("radio.png", radio); spr("fridge.png", fridge); spr("bed.png", bed); spr("washer.png", washer)
spr("boxes.png", boxes); spr("wardrobe.png", wardrobe); spr("note.png", note); spr("key.png", keyitem)
spr("battery.png", battery); spr("ceiling_lamp.png", ceilinglamp); spr("pipes.png", pipes); spr("panel.png", panel)
spr("observer.png", lambda d: figure(d,"observer")); spr("listener.png", lambda d: figure(d,"listener"))
spr("imitator.png", lambda d: figure(d,"imitator")); spr("shadow.png", lambda d: figure(d,"shadow"))
# scratches / footprint decals
spr("footprints.png", lambda d: [d.ellipse([70+i*34,60+(i%2)*70,96+i*34,104+(i%2)*70],fill=(22,20,18,170)) for i in range(4)])

# ---------------- UI ART / ICON ----------------
print("UI:")
bg=Image.new("RGB",(1280,720),(10,10,12)); d=ImageDraw.Draw(bg,"RGBA")
for i in range(6):  # perspective corridor
    x,y,w,h=80*i,50*i,1280-160*i,720-100*i
    d.rectangle([x,y,x+w,y+h],outline=(52+i*4,48+i*3,40),width=10)
d.rectangle([600,290,680,470],fill=(22,20,20)); d.ellipse([624,250,656,298],fill=(190,182,168))
d.ellipse([632,266,638,276],fill=(8,6,6)); d.ellipse([643,266,649,276],fill=(8,6,6))
for _ in range(2600): d.point((random.randint(0,1279),random.randint(0,719)),fill=(255,255,255,10))
bg=grain(bg.filter(ImageFilter.GaussianBlur(0.6)),6); save(bg,U,"menu_bg.png")
icon=Image.new("RGBA",(256,256),(12,12,14,255)); d=ImageDraw.Draw(icon)
d.rectangle([88,30,168,226],fill=(86,60,34)); d.rectangle([120,30,136,226],fill=(5,4,4))
d.ellipse([121,84,135,96],fill=(226,220,204)); d.ellipse([125,88,131,94],fill=(8,6,6)); d.ellipse([150,116,162,128],fill=(186,156,88))
icon.save(os.path.join(U,"icon.png")); icon.save(os.path.join(ROOT,"icon.ico"), sizes=[(256,256),(64,64),(32,32),(16,16)]); print(" icon.png / icon.ico")

# ---------------- SYNTHESIZED AUDIO (44.1kHz mono WAV) ----------------
SR=44100
def wav(name, samples):
    s=np.clip(np.asarray(samples,dtype=np.float64),-1,1)
    with wave.open(os.path.join(A,name),"wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(struct.pack("<%dh"%len(s), *(int(v*32767) for v in s)))
    print(" ",name)
def tone(f,dur,vol=0.4,slide=0.0,shape="sine"):
    t=np.arange(int(SR*dur))/SR; fr=f*(1+slide*t/max(dur,0.01))
    ph=np.cumsum(fr)/SR*2*np.pi; x=np.sin(ph) if shape=="sine" else np.sign(np.sin(ph))*0.6
    return x*vol*np.exp(-t*1.6)
def noise(dur,vol=0.3,lp=0.2):
    x=np.random.randn(int(SR*dur)); y=np.convolve(x,np.ones(9)/9,mode="same") if lp else x
    return y/max(1e-6,np.max(np.abs(y)))*vol
def env(x,a=0.05,r=0.3):
    n=len(x); e=np.ones(n); na=int(SR*a); nr=int(SR*r)
    e[:na]=np.linspace(0,1,na); e[-nr:]=np.linspace(1,0,nr); return x*e
def seq(parts,gap=0.12):
    out=[]
    for p in parts: out += [p, np.zeros(int(SR*gap))]
    return np.concatenate(out) if out else np.zeros(10)
print("Audio:")
thump=lambda v=0.7: env(tone(72,0.16,v,-0.4)+noise(0.16,0.12),0.005,0.12)
wav("footstep.wav", thump(0.5)); wav("footsteps_behind.wav", seq([thump(0.65)]*6,0.34))
wav("footsteps_above.wav", seq([env(tone(55,0.22,0.8,-0.2),0.01,0.18)]*5,0.42))
wav("knock.wav", seq([env(tone(160,0.09,0.7,-0.3)+noise(0.09,0.1),0.003,0.07)]*3,0.22))
wav("door_open.wav", env(noise(0.7,0.16)*np.linspace(0.2,1,int(SR*0.7))+tone(340,0.7,0.05,0.35),0.05,0.2))
wav("door_locked.wav", seq([env(tone(210,0.07,0.5,-0.2,"square"),0.003,0.05)]*2,0.09))
wav("door_slam.wav", env(tone(58,0.4,0.9,-0.4)+noise(0.4,0.3),0.004,0.35))
wav("creak.wav", env(tone(480,0.8,0.14,0.5)* (0.6+0.4*np.sin(np.arange(int(SR*0.8))/SR*22)),0.1,0.25))
t=np.arange(int(SR*6))/SR
wav("whisper.wav", env(noise(6,0.34)*(0.25+0.75*np.abs(np.sin(t*2.7))*np.abs(np.sin(t*0.9+1))),0.6,1.2))
wav("breathing.wav", env(noise(5,0.4)*(0.5+0.5*np.sin(np.arange(int(SR*5))/SR*2*np.pi*0.45))**2,0.4,0.6))
wav("scream.wav", env(tone(700,1.5,0.5,0.9)+tone(1050,1.5,0.3,0.7)+noise(1.5,0.12,0),0.15,0.7))
wav("radio_static.wav", env(noise(4,0.4,0)*(0.7+0.3*np.sin(np.arange(int(SR*4))/SR*17)),0.2,0.5))
t2=np.arange(int(SR*8))/SR
wav("ambient.wav", env(0.16*np.sin(2*np.pi*55*t2)+0.10*np.sin(2*np.pi*82.5*t2+1)+0.05*noise(8,0.5),1.5,1.5))
wav("hum.wav", env(tone(120,4,0.16)+tone(240,4,0.07),0.3,0.3))
wav("elevator_ding.wav", env(tone(880,1.2,0.4)+tone(1318,1.2,0.18),0.01,1.0))
wav("elevator_rumble.wav", env(tone(48,3,0.6)+noise(3,0.14),0.3,0.6))
wav("heartbeat.wav", seq([thump(0.8),thump(0.55)],0.18))
wav("sting.wav", env(tone(1200,0.9,0.4,-0.7)+tone(90,0.9,0.6,-0.2)+noise(0.9,0.2,0),0.005,0.7))
wav("pickup.wav", seq([tone(660,0.12,0.3),tone(990,0.18,0.3)],0.05))
wav("correct.wav", seq([tone(523,0.16,0.3),tone(784,0.3,0.3)],0.06))
wav("wrong.wav", env(tone(140,0.8,0.55,-0.4,"square"),0.01,0.6))
wav("alarm.wav", env(np.concatenate([tone(620,0.35,0.3),tone(460,0.35,0.3)]*3),0.05,0.3))
wav("flicker.wav", seq([noise(0.05,0.3,0)]*5,0.06))
wav("ui.wav", tone(520,0.07,0.22))
print("DONE assets in", ROOT+"/assets")
