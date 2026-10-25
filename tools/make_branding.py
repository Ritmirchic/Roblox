"""Create the project's original, dependency-free loading artwork and Windows icon."""
from pathlib import Path
import math, random, struct, zlib

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
RNG = random.Random(404)

def png(path, w, h, pixels):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            c = pixels[y*w+x]
            raw.extend((max(0,min(255,int(c[0]))), max(0,min(255,int(c[1]))), max(0,min(255,int(c[2]))), 255))
    def chunk(tag, data):
        return struct.pack(">I",len(data))+tag+data+struct.pack(">I",zlib.crc32(tag+data)&0xffffffff)
    data=b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">2I5B",w,h,8,6,0,0,0))+chunk(b"IDAT",zlib.compress(bytes(raw),9))+chunk(b"IEND",b"")
    Path(path).write_bytes(data)

def line(p,w,h,x0,y0,x1,y1,color,width=1):
    dx=abs(x1-x0); sx=1 if x0<x1 else -1; dy=-abs(y1-y0); sy=1 if y0<y1 else -1; err=dx+dy
    while True:
        for oy in range(-width//2,width//2+1):
            for ox in range(-width//2,width//2+1):
                x,y=x0+ox,y0+oy
                if 0<=x<w and 0<=y<h:p[y*w+x]=color
        if x0==x1 and y0==y1:break
        e=2*err
        if e>=dy:err+=dy;x0+=sx
        if e<=dx:err+=dx;y0+=sy

def poly(p,w,h,pts,color):
    miny=max(0,min(y for x,y in pts)); maxy=min(h-1,max(y for x,y in pts))
    for y in range(miny,maxy+1):
        xs=[]
        for i,(x1,y1) in enumerate(pts):
            x2,y2=pts[(i+1)%len(pts)]
            if (y1<=y<y2) or (y2<=y<y1):xs.append(int(x1+(y-y1)*(x2-x1)/(y2-y1)))
        xs.sort()
        for a,b in zip(xs[::2],xs[1::2]):
            for x in range(max(0,a),min(w,b+1)):p[y*w+x]=color

def splash():
    w,h=1600,900; p=[]
    for y in range(h):
        for x in range(w):
            dx=(x-w*.5)/(w*.5); dy=(y-h*.47)/(h*.65)
            distance=math.sqrt(dx*dx+dy*dy)
            n=RNG.uniform(-2.8,2.8)
            if y<410:
                base=(17,22,24); glow=max(0,1-distance)*7
                c=(base[0]+glow+n,base[1]+glow+n,base[2]+glow+n)
            else:
                c=(10+n,12+n,12+n)
            p.append(c)
    # The narrowing plaster corridor, seen from its center line.
    poly(p,w,h,[(0,0),(1600,0),(1035,385),(565,385)],(22,27,27))
    poly(p,w,h,[(0,0),(565,385),(565,520),(0,900)],(39,39,34))
    poly(p,w,h,[(1600,0),(1035,385),(1035,520),(1600,900)],(30,32,30))
    poly(p,w,h,[(0,900),(565,520),(1035,520),(1600,900)],(21,24,24))
    # Faded tiles converge toward the vanishing point.
    for x in range(-400,2001,220): line(p,w,h,800+(x-800)//6,520,x,899,(39,40,37),1)
    for t in [0.06,.12,.20,.31,.45,.62,.82]:
        y=int(520+(t*t)*360); half=int((y-480)*1.55)
        line(p,w,h,800-half,y,800+half,y,(31+int(t*9),33+int(t*8),31),1)
    # Door frames and apartment thresholds recede along both walls.
    for side in [-1,1]:
        for i,t in enumerate([.14,.27,.43,.64,.88]):
            y=int(385+t*340); cx=int(800+side*(570-t*360)); ww=int(72+t*180); hh=int(105+t*205)
            x0=cx-ww//2; x1=cx+ww//2; y0=y-hh
            col=(67,61,49) if i%2==0 else (47,51,49)
            line(p,w,h,x0,y0,x0,y,col,3); line(p,w,h,x1,y0,x1,y,col,3); line(p,w,h,x0,y0,x1,y0,col,3)
            line(p,w,h,x0,y,x1,y,(59,54,46),2)
            if i==1:
                line(p,w,h,x0+ww//3,y0+8,x0+ww//3,y-3,(81,71,55),2)
    # Fluorescent lamps: dim, uneven, and not quite centered on their mounts.
    for i,t in enumerate([.04,.14,.28,.48,.75]):
        y=int(392+t*115); width=int(14+t*76); x=800+int(math.sin(i*3)*6)
        for spread in range(4,0,-1):
            line(p,w,h,x-width//2-spread,y-spread,x+width//2+spread,y-spread,(22+spread*3,25+spread*3,22+spread*2),1)
        line(p,w,h,x-width//2,y,x+width//2,y,(139,130,102) if i!=2 else (92,105,105),3)
        line(p,w,h,x-width//2+3,y+3,x+width//2-2,y+3,(72,73,65),1)
    # A distant doorway is subtly brighter than the space around it.
    for r in range(10,0,-1):
        line(p,w,h,800-r*2,384-r*2,800+r*2,384-r*2,(24+r,27+r,26+r),1)
    # Fine grain, edge falloff, and a narrow red mark on a half-open door.
    for y in range(h):
        for x in range(w):
            i=y*w+x; vignette=max(.48,1-.34*((x-w/2)/(w/2))**2-.28*((y-h/2)/(h/2))**2)
            if i%997==0:
                c=p[i]; p[i]=(c[0]*vignette,c[1]*vignette,c[2]*vignette)
    line(p,w,h,1189,483,1189,575,(104,35,25),2)
    png(ASSETS/"loading_splash.png",w,h,p)

def icon():
    w=h=256; p=[]
    for y in range(h):
        for x in range(w):
            grain=RNG.random()*4
            p.append((int(13+grain),int(17+grain),int(18+grain)))
    poly(p,w,h,[(40,226),(91,40),(165,40),(216,226)],(40,43,39))
    poly(p,w,h,[(70,213),(108,67),(148,67),(186,213)],(13,19,21))
    line(p,w,h,89,217,108,68,(108,94,72),5); line(p,w,h,167,217,148,68,(108,94,72),5)
    line(p,w,h,107,68,149,68,(117,99,70),5)
    # A single pale aperture resembles a watching eye without using a stock icon.
    for r in range(14,0,-1):
        for y in range(115-r,116+r):
            for x in range(128-r*2,129+r*2):
                if 0<=x<w and 0<=y<h and ((x-128)/(r*2))**2+((y-116)/r)**2<=1:
                    p[y*w+x]=(int(96+r*2),int(88+r),int(71+r))
    for y in range(109,123):
        for x in range(124,133):
            if (x-128)**2+(y-116)**2<20:p[y*w+x]=(9,12,13)
    line(p,w,h,105,229,151,229,(107,85,57),2)
    png(ASSETS/"icon.png",w,h,p)
    # A 32-bit, 256x256 Windows ICO directory containing the authored PNG image.
    data=(ASSETS/"icon.png").read_bytes()
    header=struct.pack("<HHH",0,1,1)+struct.pack("<BBBBHHII",0,0,0,0,1,32,len(data),22)
    (ASSETS/"icon.ico").write_bytes(header+data)

splash(); icon()
print("Created original title-screen loading art and icon.")
