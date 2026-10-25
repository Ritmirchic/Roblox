#!/usr/bin/env python3
"""
DON'T LOOK BACK — premium psychological horror / anomaly-detection game.
Custom textured raycasting engine (pygame + numpy). Original code & assets.

Core loop (observation gameplay): each "passage" through Floor 4 of Meridian
House may contain an anomaly. Explore, compare against your memory of the
normal floor, optionally Document suspected anomalies, then commit:
  EAST stairs  = "this floor is NORMAL"      (proceed down)
  WEST stairs  = "something is WRONG"        (go back / report)
Correct calls descend 8 -> 0. Wrong calls cost sanity and send you up.
Three entities (Observer / Listener / Imitator), 30 functional anomalies,
8 story documents, a hidden Room 0 and three reachable endings.
"""
import json, math, os, random, sys, time
from collections import deque

os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
import numpy as np
import pygame

# ---------------------------------------------------------------- constants
TITLE = "DON'T LOOK BACK"
W, H = 1280, 720
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if not getattr(sys, "frozen", False) \
    else os.path.dirname(sys.executable)
ASSET = os.path.join(getattr(sys, "_MEIPASS", BASE_DIR), "assets")
SAVE_PATH = os.path.join(BASE_DIR, "savegame.json")
SET_PATH = os.path.join(BASE_DIR, "settings.json")
TAU = math.tau

def clamp(v, a, b): return a if v < a else b if v > b else v
def ang_diff(a, b):
    d = (a - b) % TAU
    return d - TAU if d > math.pi else d
def dist2(ax, ay, bx, by): return (ax-bx)**2 + (ay-by)**2

# ---------------------------------------------------------------- documents
DOCS = [
 ("Note by the door — 4B", "If you are reading this, you woke up in my flat.\nSorry about the mess. I stopped tidying when I\nrealised the corridor was tidying itself.\n\nWalk the floor. MEMORISE it. If anything is\ndifferent — anything at all — go BACK to the\nwest stairs. If it is exactly as it should be,\ngo down the EAST stairs.\n\nEight floors. That's all. Just notice.\n— M."),
 ("Tenant notice (1979)", "MERIDIAN HOUSE MANAGEMENT\n\nResidents are reminded that Floor 4 is under\nobservation as part of a building-safety study.\nPlease report any irregularities in writing.\nDo not discuss irregularities with other tenants.\nDo not discuss other tenants.\n\n— E. Vane, Building Manager"),
 ("Mara's journal, p.1", "Day 9. The painting changed again. Not moved —\nchanged. He has too many eyes now, or not\nenough. I wrote it in the journal like the\ninstructions say.\n\nDocumenting helps. When I write a change down,\nit feels less able to change ME."),
 ("Mara's journal, p.2", "There are three of them. I have names now.\n\nTHE OBSERVER only walks when unwatched. Keep\nhim in view and he is furniture.\n\nTHE LISTENER has no eyes and all ears. Run and\nhe will find the sound of you.\n\nTHE IMITATOR is the cruel one. He knocks on\ndoors that nobody touched. Not every sound\nis a sign. He wants you to cry wolf."),
 ("Maintenance log", "Lift serviced. Lift serviced. Lift serviced.\nLift arrives at floors that are not requested.\nLift arrives at floors that do not exist.\n\nRecommend: do not service the lift.\nRecommend: do not ride the lift.\n\nKey to maintenance is in 4B bedroom. I am not\ngoing back in there. — R. Okafor"),
 ("Mara's journal, p.3", "Under maintenance there is a door with a 0 on it.\nIt is only there when you've read enough to\nunderstand what you're looking at. Five pieces\nof the truth. That's the lock. Understanding\nis the key — very funny, Vane.\n\nWhatever is recorded in Room 0, it is the\nreason for all of this."),
 ("Observation report 114", "SUBJECT: Tenant, 4B (M. Mara)\nSTATUS: Still noticing.\n\nSubjects who stop noticing do not leave.\nThey are reclassified as residents.\nResidents are part of the floor.\nThe floor must appear normal.\n\nIf you are reading this: keep noticing."),
 ("Final page", "I got to Floor 1 twice. Twice I was sure, and\ntwice I was wrong, and the building forgave me\nthe way a throat forgives.\n\nIf my sanity goes, I stay. A figure at the end\nof a corridor. A face in a window. Furniture.\n\nDon't let it wear you down.\nAnd whatever you hear behind you —\n\nDON'T LOOK BACK. Decide. Walk. — M."),
]

# ------------------------------------------------------------ anomaly defs
ANOMALIES = [
 (1,"The portrait has changed","Visual"),(2,"Furniture has moved","Visual"),
 (3,"Something is missing","Visual"),(4,"A door that was not there","Visual"),
 (5,"The wallpaper is wrong","Visual"),(6,"An impossible view","Visual"),
 (7,"The lights are wrong","Visual"),(8,"An object in the wrong room","Visual"),
 (9,"The ceiling lamp has fallen","Visual"),(10,"A familiar shape, stretched","Visual"),
 (11,"Footsteps behind you","Audio"),(12,"Whispering in 4A","Audio"),
 (13,"Knocking from inside 4C","Audio"),(14,"The radio is receiving","Audio"),
 (15,"A distant scream","Audio"),(16,"The lift that never arrives","Audio"),
 (17,"Footsteps on the floor above","Audio"),(18,"Breathing, close by","Audio"),
 (19,"4B has locked itself","Environmental"),(20,"The corridor is longer","Environmental"),
 (21,"4B has rearranged itself","Environmental"),(22,"The lift opens onto brick","Environmental"),
 (23,"Emergency lighting","Environmental"),(24,"The passage is blocked","Environmental"),
 (25,"Storage stands open","Environmental"),(26,"A figure at the corridor's end","Entity"),
 (27,"A shadow crosses 4B","Entity"),(28,"A watcher at the window","Entity"),
 (29,"Something behind the ajar door","Entity"),(30,"It follows, silently","Entity"),
]
ANOM_NAME = {i:(n,c) for i,n,c in ANOMALIES}

# ------------------------------------------------------------------- world
# Tile chars -> texture keys. ' ' (as TLS handshake EOF error), 'D' door.
TEXMAP = {'#':"wall_corridor",'A':"wall_apt",'C':"wall_concrete",'B':"wall_brick",
          'T':"wall_bath",'L':"wall_laundry",'P':"painting_portrait",'p':"painting_land",
          'W':"window_night",'E':"elevator",'N':"notice_board",'F':"sign_floor",
          'x':"sign_exit",'l':"sign_laundry",'m':"sign_maint",'s':"sign_storage"}
MAP_W, MAP_H = 50, 26

class Door:
    def __init__(self,x,y,tex,locked=False,name="",kind="door"):
        self.x,self.y,self.tex,self.locked,self.name,self.kind=x,y,tex,locked,name,kind
        self.open=0.0; self.target=0.0; self.shake=0.0
    @property
    def solid(self): return self.open < 0.72

class Ent:
    """A billboarded world object / furniture / pickup / entity visual."""
    def __init__(self,x,y,sprite,scale=1.0,name="",solid=0.0,kind="decor",data=None,vy=0.0):
        self.x,self.y,self.sprite,self.scale,self.name=x,y,sprite,scale,name
        self.solid,self.kind,self.data,self.vy=solid,kind,data,vy
        self.alive=True; self.t=random.random()*10

class World:
    def __init__(self, game, long_corridor=False):
        self.g=game; self.long=long_corridor
        self.grid=[['#']*MAP_W for _ in range(MAP_H)]
        self.doors={}; self.ents=[]; self.zones={}
        self._build()
    # -- construction helpers
    def carve(self,x0,y0,x1,y1,zone=""):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                self.grid[y][x]=' '
                if zone: self.zones[(x,y)]=zone
    def wall_rect(self,x0,y0,x1,y1,ch):
        for x in range(x0,x1+1): self.grid[y0][x]=ch; self.grid[y1][x]=ch
        for y in range(y0,y1+1): self.grid[y][x0]=ch; self.grid[y][x1]=ch
    def set(self,x,y,ch): self.grid[y][x]=ch
    def door(self,x,y,tex,locked=False,name="",kind="door"):
        self.grid[y][x]='D'; self.doors[(x,y)]=Door(x,y,tex,locked,name,kind)
    def add(self,*a,**k):
        e=Ent(*a,**k); self.ents.append(e); return e
    def _build(self):
        ext = 6 if self.long else 0           # anomaly #20 stretches corridor
        # corridor (3 tall) + west/east stair rooms
        self.carve(2,11,41+ext//2,13,"Corridor")
        self.carve(1,9,4,15,"West stairwell"); self.carve(44,9,48,15,"East stairwell")
        self.carve(42,11,43,13,"Corridor")
        if self.long: self.carve(30,11,47,13,"Corridor (too long)")
        # north rooms: 4A | 4B living/bed/bath | laundry | storage
        self.carve(6,3,12,9,"Apartment 4A"); self.wall_rect(5,2,13,10,'A')
        self.carve(6,3,12,9,"Apartment 4A")
        self.carve(15,3,26,9,"Apartment 4B — living"); self.wall_rect(14,2,27,10,'A')
        self.carve(15,3,26,9,"Apartment 4B — living")
        for y in range(3,10): self.set(21,y,'A')          # 4B internal wall
        self.set(21,6,' '); self.zones[(22,5)]="Apartment 4B — bedroom"; self.zones[(24,8)]="Apartment 4B — bedroom"
        for x in range(22,27): self.set(x,7,'T')          # bath partition
        self.set(24,7,' '); self.zones[(25,8)]="Apartment 4B — bathroom"
        self.carve(29,3,35,9,"Laundry room"); self.wall_rect(28,2,36,10,'L'); self.carve(29,3,35,9,"Laundry room")
        self.carve(38,3,43,9,"Storage"); self.wall_rect(37,2,44,10,'C'); self.carve(38,3,43,9,"Storage")
        # south rooms: 4C | maintenance | lift lobby | hidden room 0
        self.carve(7,16,14,22,"Apartment 4C"); self.wall_rect(6,15,15,23,'A'); self.carve(7,16,14,22,"Apartment 4C")
        self.carve(17,16,24,21,"Maintenance"); self.wall_rect(16,15,25,22,'C'); self.carve(17,16,24,21,"Maintenance")
        self.carve(18,23,23,24,"Room 0")
        self.carve(28,16,34,21,"Lift lobby"); self.wall_rect(27,15,35,22,'C'); self.carve(28,16,34,21,"Lift lobby")
        self.carve(38,16,45,22,"Basement stairs"); self.wall_rect(37,15,46,23,'B'); self.carve(38,16,45,22,"Basement stairs")
        # re-carve corridor through room walls
        self.carve(2,11,47,13,"Corridor")
        # doors: corridor y=11 north wall is y=10, south wall y=14 (carve made 11..13)
        self.door(9,10,"door_apt2",locked=True,name="Apartment 4A")
        self.door(18,10,"door_apt",locked=False,name="Apartment 4B")
        self.door(32,10,"door_metal",locked=False,name="Laundry")
        self.door(40,10,"door_metal",locked=True,name="Storage")
        self.door(10,14,"door_apt3",locked=True,name="Apartment 4C")
        self.door(20,14,"door_metal",locked=True,name="Maintenance")
        self.door(31,14,"door_metal",locked=False,name="Lift lobby")
        self.door(41,14,"door_metal",locked=False,name="Basement")
        for dx in (10,20,31,41): self.set(dx,15,' ')   # doorway through south rooms' wall row
        self.door(20,22,"wall_concrete",locked=True,name="Room 0",kind="hidden")
        # decision doors
        self.door(1,12,"door_exit",name="West stairs — GO BACK (something is wrong)",kind="exit_west")
        self.door(48,12,"door_exit",name="East stairs — GO DOWN (floor is normal)",kind="exit_east")
        # decorative / informative walls
        for x,ch in [(14,'P'),(27,'p'),(36,'P')]: self.set(x,10,ch) if self.grid[10][x]!='"' else None
        self.set(14,10,'P'); self.set(27,10,'p'); self.set(36,10,'P')
        self.set(24,14,'N'); self.set(5,10,'F'); self.set(33,10,'l'); self.set(39,10,'s')
        self.set(19,14,'m'); self.set(2,9,'x'); self.set(47,9,'x')
        self.set(31,22,'E'); self.set(30,22,'C'); self.set(32,22,'C')   # lift in lobby south wall
        self.set(16,2,'W'); self.set(25,2,'W'); self.set(8,23,'W'); self.set(34,2,'W')  # windows
        self.window_tiles=[(16,2),(25,2),(8,23),(34,2)]
        self.painting_tiles=[(14,10),(27,10),(36,10)]
        self._furnish()
    def _furnish(self):
        A=self.add
        # --- 4B living (baseline layout A) ---
        A(16.5,4.2,"sofa",1.15,"Sofa",0.55); A(19.5,5.5,"table",1.0,"Coffee table",0.5)
        A(16.4,8.4,"tv",1.0,"Television",0.4,kind="tv"); A(19.6,8.6,"radio",0.62,"Radio",0.3,kind="radio")
        A(15.6,5.8,"lamp",0.8,"Floor lamp",0.25); A(20.3,3.8,"plant",0.85,"Rubber plant",0.3)
        A(18.5,6.8,"chair",0.8,"Armchair",0.35)
        A(19.0,4.6,"note",0.5,"Note by the door",0,kind="doc",data=0)
        # --- 4B bedroom / bath ---
        A(25.2,4.0,"bed",1.15,"Bed",0.6); A(22.6,3.8,"wardrobe",1.05,"Wardrobe",0.5)
        A(23.5,5.6,"note",0.5,"Mara's journal",0,kind="doc",data=2)
        A(25.4,5.8,"key",0.45,"Maintenance key",0,kind="key")
        A(25.3,8.6,"washer",0.9,"Bathroom unit",0.45); A(22.8,8.6,"plant_dead",0.7,"Dead plant",0.25)
        # --- 4A (locked; whisper source) ---
        A(9.0,5.0,"sofa",1.1,"Covered sofa",0.55); A(11.4,7.5,"boxes",0.95,"Packed boxes",0.5)
        A(7.2,7.8,"note",0.5,"Tenant notice",0,kind="doc",data=1)
        # --- 4C (locked; knocking source) ---
        A(10.5,19.0,"table",1.0,"Table",0.5); A(12.8,17.2,"chair",0.8,"Chair",0.35)
        A(8.4,20.8,"note",0.5,"Mara's journal",0,kind="doc",data=3)
        # --- laundry ---
        for i in range(3): A(30.0+i*2.1,4.0,"washer",0.95,"Washing machine",0.5)
        A(33.8,7.6,"boxes",0.9,"Detergent boxes",0.45); A(30.4,7.8,"note",0.5,"Maintenance log",0,kind="doc",data=4)
        A(34.2,4.2,"battery",0.42,"Battery",0,kind="battery")
        # --- storage ---
        A(39.2,4.4,"boxes",1.0,"Mara's boxes",0.5); A(42.2,4.6,"wardrobe",1.0,"Cabinet",0.5)
        A(40.6,7.6,"note",0.5,"Mara's journal",0,kind="doc",data=5); A(42.4,8.0,"battery",0.42,"Battery",0,kind="battery")
        # --- maintenance ---
        A(18.0,17.2,"pipes",1.1,"Pipe stack",0.45); A(23.2,17.4,"panel",1.0,"Electrical panel",0.4,kind="panel")
        A(20.4,20.2,"note",0.5,"Observation report",0,kind="doc",data=6); A(17.8,20.4,"boxes",0.9,"Tools",0.45)
        # --- room 0 ---
        A(20.5,23.5,"radio",0.7,"Recorder",0.3,kind="recorder"); A(22.4,23.5,"chair",0.8,"A single chair",0.3)
        # --- lift lobby / basement / corridor dressing ---
        A(29.2,17.4,"plant",0.85,"Lobby plant",0.3); A(33.6,20.4,"chair",0.8,"Waiting chair",0.35)
        A(39.4,17.6,"pipes",1.1,"Basement pipes",0.45); A(43.8,20.6,"boxes",0.95,"Archive boxes",0.5)
        A(41.5,18.6,"note",0.5,"Final page",0,kind="doc",data=7)
        A(24.5,12.5,"plant",0.8,"Corridor plant",0.28); A(6.5,12.4,"ceiling_lamp",0.75,"Ceiling lamp",0,vy=-0.62)
        A(24.0,11.6,"ceiling_lamp",0.75,"Ceiling lamp",0,vy=-0.62); A(40.0,12.4,"ceiling_lamp",0.75,"Ceiling lamp",0,vy=-0.62)
        A(3.0,10.5,"boxes",0.85,"Stairwell boxes",0.45); A(46.5,14.0,"plant",0.8,"Stairwell plant",0.28)
    # -- queries
    def tile(self,x,y):
        if 0<=x<MAP_W and 0<=y<MAP_H: return self.grid[int(y)][int(x)]
        return '#'
    def solid_at(self,x,y,for_entity=False):
        t=self.tile(x,y)
        if t==' ': 
            pass
        elif t=='D':
            d=self.doors.get((int(x),int(y)))
            if d and not d.solid: pass
            else: return True
        else: return True
        if not for_entity:  # furniture collision for player
            for e in self.ents:
                if e.alive and e.solid>0 and dist2(x,y,e.x,e.y) < (e.solid+0.18)**2: return True
        return False
    def ent_by_name(self,name):
        for e in self.ents:
            if e.alive and e.name==name: return e
        return None
    def bfs_next(self,sx,sy,tx,ty):
        """Next waypoint from s to t over passable tiles (doors passable)."""
        s=(int(sx),int(sy)); t=(int(tx),int(ty))
        if s==t: return (tx,ty)
        prev={s:None}; q=deque([s])
        while q:
            c=q.popleft()
            if c==t: break
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                n=(c[0]+dx,c[1]+dy)
                if n in prev or not (0<=n[0]<MAP_W and 0<=n[1]<MAP_H): continue
                ch=self.grid[n[1]][n[0]]
                if ch==' ' or ch=='D': prev[n]=c; q.append(n)
        if t not in prev: return (tx,ty)
        c=t
        while prev[c] and prev[c]!=s: c=prev[c]
        return (c[0]+0.5,c[1]+0.5)

# ------------------------------------------------------------- anomaly logic
class AnomalyState:
    def __init__(self): self.active=[]; self.targets={}  # id -> dict(pos,radius,label)
    @property
    def present(self): return len(self.active)>0

def apply_anomaly(game, world, aid):
    """Mutate a freshly-built baseline world. Returns target info for
    documentation + a scheduler tag for timed/audio anomalies."""
    g,w = game,world; info={"pos":None,"radius":2.6,"label":ANOM_NAME[aid][0],"timed":None}
    def tgt(x,y,r=2.6): info["pos"]=(x,y); info["radius"]=r
    if aid==1:
        w.set(14,10,'P'); g.tex_override[(14,10)]="painting_portrait_bad"; tgt(14.5,11.5)
    elif aid==2:
        e=w.ent_by_name("Sofa"); e.x,e.y=18.6,7.8; e2=w.ent_by_name("Armchair"); e2.x,e2.y=16.2,4.0; tgt(18.6,7.8,3)
    elif aid==3:
        e=w.ent_by_name("Rubber plant"); e.alive=False; e2=w.ent_by_name("Corridor plant"); e2.alive=False; tgt(20.3,4.6,3)
    elif aid==4:
        w.door(34,14,"door_new",locked=False,name="Door 0 (new)"); w.carve(33,15,35,15,"Impossible closet")
        # tiny closet south of corridor between lobby/maint walls row15 is wall row; carve into lobby wall zone safely:
        w.set(34,15,' '); w.add(34.5,15.5,"chair",0.8,"A chair, facing the wall",0.3); tgt(34.5,13.4)
    elif aid==5:
        for x in range(2,48):
            if w.grid[10][x]=='#': g.tex_override[(x,10)]="wall_corridor_alt"
            if w.grid[14][x]=='#': g.tex_override[(x,14)]="wall_corridor_alt"
        tgt(16.5,12.0,3.4)
    elif aid==6:
        g.tex_override[(16,2)]="window_eye"; tgt(16.5,4.4,3.2)
    elif aid==7:
        g.light_mode="flicker"; tgt(24.0,12.0,3.4)
    elif aid==8:
        w.add(22.5,12.2,"fridge",1.0,"Refrigerator (in the corridor?)",0.5); tgt(22.5,12.2,3)
    elif aid==9:
        e=[x for x in w.ents if x.name=="Ceiling lamp"][1]; e.vy=0.18; e.sprite="ceiling_lamp"; e.y=12.6; tgt(e.x,12.2,3)
    elif aid==10:
        e=w.ent_by_name("Armchair"); e.sprite="chair_tall"; e.scale=1.55; tgt(e.x,e.y,3)
    elif aid==11: info["timed"]="steps_behind"; tgt(20,12,4)
    elif aid==12: info["timed"]="whisper"; tgt(9.5,11.2,3)
    elif aid==13: info["timed"]="knock"; tgt(10.5,13.2,3)
    elif aid==14:
        e=w.ent_by_name("Radio"); info["timed"]="radio"; tgt(e.x,e.y,3)
        t=w.ent_by_name("Television"); t.sprite="tv_static"
    elif aid==15: info["timed"]="scream"; tgt(24,12,5)
    elif aid==16: info["timed"]="lift_sound"; tgt(31.5,20.5,3.4)
    elif aid==17: info["timed"]="steps_above"; tgt(20,12,4)
    elif aid==18: info["timed"]="breathing"; tgt(18,12,4)
    elif aid==19:
        w.doors[(18,10)].locked=True; tgt(18.5,11.2,2.6)
    elif aid==20: tgt(38,12,4)  # world built long; handled by World flag
    elif aid==21:
        w.ent_by_name("Sofa").x=19.8; w.ent_by_name("Sofa").y=8.4
        w.ent_by_name("Television").x=19.9; w.ent_by_name("Television").y=3.8
        w.ent_by_name("Coffee table").x=16.2; w.ent_by_name("Coffee table").y=7.6
        w.ent_by_name("Bed").x=23.0; w.ent_by_name("Wardrobe").x=25.6; tgt(18,6,3.6)
    elif aid==22:
        g.tex_override[(31,22)]="elevator_brick"; tgt(31.5,20.6,3.2)
    elif aid==23: g.light_mode="emergency"; info["timed"]="alarm"; tgt(24,12,4)
    elif aid==24:
        w.add(28.5,12.0,"wardrobe",1.25,"Wardrobe blocking the corridor",0.85); tgt(28.5,12,3.2)
    elif aid==25:
        d=w.doors[(40,10)]; d.locked=False; d.target=1.0; tgt(40.5,11.2,3)
    elif aid==26:
        e=w.add(45.5,12.0,"observer",1.5,"Figure",0,kind="figure_end"); tgt(43,12,4.5)
    elif aid==27: info["timed"]="shadow_cross"; tgt(18.5,8,4)
    elif aid==28:
        g.tex_override[(25,2)]="window_face"; tgt(25.5,4.2,3.4)
    elif aid==29:
        d=w.doors[(10,14)]; d.tex="door_ajar"; d.locked=True; info["timed"]="ajar"; tgt(10.5,13.2,3)
    elif aid==30: info["timed"]="follower"; tgt(12,12,4.5)
    # anomaly #10 extra flavour: sofa becomes wrong in #10? chair covered. #14 handled timed.
    if aid==10:
        s=w.ent_by_name("Sofa"); s.sprite="sofa_bad"
    return info

# -------------------------------------------------------------------- audio
class Audio:
    def __init__(self, volume=0.8):
        self.ok=True; self.snd={}; self.vol=volume
        try:
            pygame.mixer.init(44100,-16,1,512); pygame.mixer.set_num_channels(24)
            snd_dir=os.path.join(ASSET,"sounds")
            for f in os.listdir(snd_dir):
                if f.endswith(".wav"): self.snd[f[:-4]]=pygame.mixer.Sound(os.path.join(snd_dir,f))
        except Exception as e:
            self.ok=False; print("Audio disabled:",e)
        self.amb=None
    def play(self,name,vol=1.0,pan=0.0,loop=0):
        if not self.ok or name not in self.snd: return None
        ch=pygame.mixer.find_channel(True); s=self.snd[name]
        l=clamp(vol*(1-pan*0.7),0,1)*self.vol; r=clamp(vol*(1+pan*0.7),0,1)*self.vol
        try: ch.set_volume(l,r)
        except Exception: ch.set_volume(vol*self.vol)
        ch.play(s,loops=loop); return ch
    def spatial(self,name,px,py,pa,sx,sy,maxd=16.0,vol=1.0,loop=0):
        d=math.hypot(sx-px,sy-py); v=clamp(1-d/maxd,0,1)*vol
        if v<=0.02: return None
        pan=clamp(math.sin(ang_diff(math.atan2(sy-py,sx-px),pa)),-1,1)
        return self.play(name,v,pan,loop)
    def start_ambient(self):
        if self.ok and "ambient" in self.snd and not self.amb:
            self.amb=self.play("ambient",0.5,0,loop=-1)

# --------------------------------------------------------------------- game
class Game:
    def __init__(self, headless=False):
        pygame.init()
        self.settings={"volume":0.8,"sensitivity":1.0,"quality":320,"fullscreen":False,"subtitles":True}
        if os.path.exists(SET_PATH):
            try: self.settings.update(json.load(open(SET_PATH)))
            except Exception: pass
        flags=pygame.FULLSCREEN if (self.settings["fullscreen"] and not headless) else 0
        self.screen=pygame.display.set_mode((W,H),flags)
        pygame.display.set_caption(TITLE)
        try:
            ic=pygame.image.load(os.path.join(ASSET,"ui/icon.png")); pygame.display.set_icon(ic)
        except Exception: pass
        self.clock=pygame.time.Clock(); self.audio=Audio(self.settings["volume"])
        self._load_assets()
        self.state="menu"; self.menu_i=0; self.set_i=0; self.running=True
        self.mouse_captured=False; self.subtitle=""; self.sub_t=0; self.message=""; self.msg_t=0
        self.endings_unlocked=[]
        if os.path.exists(SAVE_PATH):
            try: self.endings_unlocked=json.load(open(SAVE_PATH)).get("endings",[])
            except Exception: pass
        self.new_game()
    # assets
    def _load_assets(self):
        self.tex={}; self.tex_arr={}
        td=os.path.join(ASSET,"textures")
        for f in os.listdir(td):
            if f.endswith(".png"):
                im=pygame.image.load(os.path.join(td,f)).convert()
                if im.get_size()!=(256,256): im=pygame.transform.scale(im,(256,256))
                self.tex[f[:-4]]=im; self.tex_arr[f[:-4]]=pygame.surfarray.array3d(im).transpose(1,0,2)  # [y,x]
        self.spr={}
        sd=os.path.join(ASSET,"sprites")
        for f in os.listdir(sd):
            if f.endswith(".png"): self.spr[f[:-4]]=pygame.image.load(os.path.join(sd,f)).convert_alpha()
        try: self.menu_bg=pygame.image.load(os.path.join(ASSET,"ui/menu_bg.png")).convert()
        except Exception: self.menu_bg=None
        self.fonts={s:pygame.font.SysFont("Georgia,serif",s) for s in (15,17,19,22,28)}
        self.fonts["title"]=pygame.font.SysFont("Georgia,serif",64,bold=True)
        self.fonts["big"]=pygame.font.SysFont("Georgia,serif",40,bold=True)
    # lifecycle
    def new_game(self):
        self.floor=8; self.sanity=100.0; self.battery=100.0; self.flashlight=True
        self.docs_found=set(); self.journal=set(); self.has_key=False; self.caught=0
        self.score=0; self.loop_no=0; self.correct_streak=0; self.aggression=0.0
        self.ending=None; self.start_loop(first=True)
    def start_loop(self, first=False):
        self.tex_override={}; self.light_mode="normal"; self.light_flick=1.0
        self.loop_no+=1; self.marks_left=3; self.documented_this=set(); self.timed_fired=set()
        self.loop_time=0.0; self.noise_pos=None; self.noise_level=0.0; self.shadow_ent=None
        # choose anomalies
        self.anom=AnomalyState()
        if first or self.loop_no==1:
            chosen=[]
        else:
            has = random.random() < 0.68
            chosen=[]
            if has:
                pool=list(range(1,31)); aid=random.choice(pool); chosen=[aid]
                if self.floor<=3 and random.random()<0.30:
                    aid2=random.choice([a for a in pool if a!=aid and a!=20]); chosen.append(aid2)
        self.world=World(self, long_corridor=(20 in chosen))
        if 20 in chosen: chosen=[20]+[c for c in chosen if c!=20]
        for aid in chosen:
            self.anom.active.append(aid); self.anom.targets[aid]=apply_anomaly(self,self.world,aid)
        # persistent pickups already collected stay collected across loops
        for e in self.world.ents:
            if e.kind=="doc" and e.data in self.docs_found: e.alive=False
            if e.kind=="key" and self.has_key: e.alive=False
        if self.has_key: self.world.doors[(20,14)].locked=False  # maintenance stays unlocked w/ key
        # player
        self.px,self.py,self.pa=3.0,12.0,0.0; self.pitch=0.0; self.bob=0.0; self.step_t=0
        self.stamina=100.0; self.crouch=False
        # entities
        self.observer=None; self.listener=None; self.imitator=None
        self.obs_cooldown=0.0; self.imit_t=random.uniform(14,26); self.listen_t=0
        danger = (30 in chosen) or (self.loop_no>=4 and random.random()<0.35+self.aggression) or self.sanity<45
        if danger: self._spawn_observer(follower=(30 in chosen))
        if self.loop_no>=5 and random.random()<0.4: self._spawn_listener()
        if self.loop_no>=3: self._spawn_imitator()
        if self.loop_no==1:
            self.show_message("Memorise this floor. Then take the EAST stairs down.",7)
    def _far_spawn(self):
        spots=[(45.5,12.0),(40.5,6.0),(31.5,18.5),(10.5,19.0),(20.5,5.0)]
        random.shuffle(spots)
        for x,y in spots:
            if dist2(x,y,self.px,self.py)>100: return x,y
        return spots[0]
    def _spawn_observer(self,follower=False):
        x,y=self._far_spawn()
        self.observer=self.world.add(x,y,"observer",1.5,"THE OBSERVER",0,kind="observer",data={"follower":follower,"speed":1.15 if follower else 0.95})
    def _spawn_listener(self):
        x,y=self._far_spawn()
        self.listener=self.world.add(x,y,"listener",1.35,"THE LISTENER",0,kind="listener",data={"tx":x,"ty":y,"alert":0.0})
    def _spawn_imitator(self):
        x,y=self._far_spawn()
        self.imitator=self.world.add(x,y,"imitator",1.3,"THE IMITATOR",0,kind="imitator",data={"visible_t":0})
        self.imitator.alive=False  # appears in flashes
    def save_meta(self):
        try: json.dump({"endings":self.endings_unlocked,"journal":sorted(self.journal)},open(SAVE_PATH,"w"),indent=1)
        except Exception: pass
    def show_message(self,txt,t=4): self.message=txt; self.msg_t=t
    def subtitle_show(self,txt,t=3.5):
        if self.settings["subtitles"]: self.subtitle=txt; self.sub_t=t
    # ------------------------------------------------------------ visibility
    def los(self,x0,y0,x1,y1):
        """Grid DDA line-of-sight (occlusion by walls & closed doors)."""
        dx,dy=x1-x0,y1-y0; d=math.hypot(dx,dy)
        if d<0.01: return True
        steps=int(d*4)+1
        for i in range(1,steps):
            t=i/steps; x,y=x0+dx*t,y0+dy*t
            ch=self.world.tile(x,y)
            if ch=='D':
                dr=self.world.doors.get((int(x),int(y)))
                if dr and dr.open>0.5: continue
                return False
            if ch!=' ': return False
        return True
    def is_visible(self,e,maxd=15.0,fov=0.75):
        d=math.hypot(e.x-self.px,e.y-self.py)
        if d>maxd: return False
        ang=math.atan2(e.y-self.py,e.x-self.px)
        if abs(ang_diff(ang,self.pa))>fov: return False
        return self.los(self.px,self.py,e.x,e.y)
    # --------------------------------------------------------------- movement
    def try_move(self,nx,ny,r=0.22):
        w=self.world
        if not w.solid_at(nx+ (r if nx>self.px else -r), self.py) and not w.solid_at(nx,self.py): self.px=nx
        if not w.solid_at(self.px, ny+(r if ny>self.py else -r)) and not w.solid_at(self.px,ny): self.py=ny
    def entity_move(self,e,tx,ty,speed,dt):
        wx,wy=self.world.bfs_next(e.x,e.y,tx,ty)
        dx,dy=wx-e.x,wy-e.y; d=math.hypot(dx,dy)
        if d<0.05: return
        nx=e.x+dx/d*speed*dt; ny=e.y+dy/d*speed*dt
        if not self.world.solid_at(nx,ny,for_entity=True): e.x,e.y=nx,ny
        elif not self.world.solid_at(nx,e.y,for_entity=True): e.x=nx
        elif not self.world.solid_at(e.x,ny,for_entity=True): e.y=ny
    # --------------------------------------------------------------- decision
    def decide(self,claimed_anomaly):
        correct = claimed_anomaly == self.anom.present
        if correct:
            self.audio.play("correct"); self.floor-=1; self.correct_streak+=1
            self.sanity=clamp(self.sanity+6,0,100); self.score+=100+25*self.correct_streak
            for aid in self.documented_this & set(self.anom.active): self.score+=50
            if self.floor<=0: return self.finish("escape")
            self.show_message(f"Correct. Floor {self.floor}. Keep noticing.",5)
        else:
            self.audio.play("wrong"); self.audio.play("sting",0.7)
            self.correct_streak=0; self.sanity-=18; self.aggression=min(0.45,self.aggression+0.12)
            self.floor=min(8,self.floor+2)
            why = ("There WAS something wrong. You walked past it." if self.anom.present
                   else "The floor was normal. Fear is also a wrong answer.")
            self.show_message(why+f"  Back up to Floor {self.floor}.",6)
            if self.sanity<=0: return self.finish("lost")
        self.save_meta(); self.start_loop()
    def finish(self,kind):
        self.ending=kind; self.state="ending"; pygame.mouse.set_visible(True); self.mouse_captured=False
        if kind not in self.endings_unlocked: self.endings_unlocked.append(kind)
        self.save_meta()
        self.audio.play("sting" if kind=="lost" else "correct",0.9)
    # -------------------------------------------------------------- interact
    def look_target(self):
        """Nearest interactable in front: (kind, object, prompt) or None."""
        w=self.world; best=None; bestd=2.4
        # doors (tile ahead)
        for (dx,dy),d in w.doors.items():
            cx,cy=dx+0.5,dy+0.5; dd=math.hypot(cx-self.px,cy-self.py)
            if dd<bestd and abs(ang_diff(math.atan2(cy-self.py,cx-self.px),self.pa))<0.9:
                if d.kind=="hidden":
                    if len(self.docs_found)>=5 and self.has_key: prompt="E — Open Room 0"
                    else: continue
                elif d.kind.startswith("exit"): prompt=f"E — {d.name}"
                elif d.locked: prompt=f"{d.name} (locked)"
                else: prompt=f"E — {'Close' if d.target>0.5 else 'Open'} {d.name or 'door'}"
                best=("door",d,prompt); bestd=dd
        for e in w.ents:
            if not e.alive: continue
            dd=math.hypot(e.x-self.px,e.y-self.py)
            if dd<bestd and abs(ang_diff(math.atan2(e.y-self.py,e.x-self.px),self.pa))<0.9:
                if e.kind=="doc": best=("doc",e,f"E — Read: {DOCS[e.data][0]}"); bestd=dd
                elif e.kind=="key": best=("key",e,"E — Take maintenance key"); bestd=dd
                elif e.kind=="battery": best=("battery",e,"E — Take battery"); bestd=dd
                elif e.kind=="recorder": best=("recorder",e,"E — Play the recording"); bestd=dd
                elif e.kind=="panel": best=("panel",e,"E — Inspect electrical panel"); bestd=dd
                elif e.kind in ("radio","tv"): best=("device",e,f"E — Inspect {e.name}   ·   Q — Document anomaly"); bestd=dd
                elif e.kind=="decor": best=("decor",e,f"{e.name}   ·   Q — Document as anomaly ({self.marks_left})"); bestd=dd
        # anomaly zone targets (walls/audio): allow documentation near target pos
        if not best:
            for aid,info in self.anom.targets.items():
                if info["pos"] and math.hypot(info["pos"][0]-self.px,info["pos"][1]-self.py)<info["radius"]:
                    return ("anomzone",aid,f"Something feels wrong here   ·   Q — Document anomaly ({self.marks_left})")
            # lift use
            if abs(self.px-31.5)<1.6 and self.py>19.5: return ("lift",None,"E — Call the lift")
        return best
    def document_at(self,x,y):
        if self.marks_left<=0: self.show_message("No journal pages left this passage. Decide with your feet.",3); return
        self.marks_left-=1
        for aid,info in self.anom.targets.items():
            if info["pos"] and math.hypot(info["pos"][0]-x,info["pos"][1]-y)<=info["radius"]+0.8:
                if aid not in self.documented_this:
                    self.documented_this.add(aid); self.journal.add(aid); self.sanity=clamp(self.sanity+5,0,100)
                    self.audio.play("pickup"); self.save_meta()
                    self.show_message(f"Documented: {ANOM_NAME[aid][0]}. Now GO BACK (west stairs).",5)
                else: self.show_message("Already documented. Go back — west stairs.",3)
                return
        self.sanity-=4; self.audio.play("wrong",0.5)
        self.show_message("You document... nothing. Doubt creeps in. (-4 sanity)",3.5)
        if self.sanity<=0: self.finish("lost")
    def interact(self):
        t=self.look_target()
        if not t: return
        kind,obj,_=t; w=self.world
        if kind=="door":
            d=obj
            if d.kind=="exit_west": return self.decide(True)
            if d.kind=="exit_east": return self.decide(False)
            if d.kind=="hidden":
                d.locked=False; d.target=1.0; d.tex="door_new"; self.audio.play("door_open"); self.audio.play("sting",0.6)
                self.show_message("Room 0. It was always here. You just understand it now.",5); return
            if d.locked:
                if d.name=="Maintenance" and self.has_key: d.locked=False
                else:
                    self.audio.spatial("door_locked",self.px,self.py,self.pa,d.x,d.y); self.make_noise(0.3)
                    extra="  (maintenance key needed)" if d.name=="Maintenance" else ""
                    self.show_message(f"{d.name} is locked.{extra}",2.5); return
            d.target=0.0 if d.target>0.5 else 1.0
            self.audio.spatial("door_open" if d.target else "door_slam",self.px,self.py,self.pa,d.x,d.y)
            self.make_noise(0.45)
        elif kind=="doc":
            self.docs_found.add(obj.data); obj.alive=False; self.state="doc"; self.open_doc=obj.data
            pygame.mouse.set_visible(True); self.mouse_captured=False; self.audio.play("pickup"); self.save_meta()
        elif kind=="key":
            self.has_key=True; obj.alive=False; self.world.doors[(20,14)].locked=False
            self.audio.play("pickup"); self.show_message("Maintenance key taken. (Maintenance is south of the corridor.)",4)
        elif kind=="battery":
            obj.alive=False; self.battery=100.0; self.audio.play("pickup"); self.show_message("Flashlight battery replaced.",3)
        elif kind=="recorder":
            self.audio.play("radio_static"); self.audio.play("whisper",0.8); return self.finish("truth")
        elif kind=="panel":
            self.audio.play("hum"); self.audio.play("flicker"); self.light_flick=0.4
            self.show_message("Breakers labelled by flat. 4B's breaker is warm. It hums your name, almost.",4)
        elif kind=="device":
            self.audio.spatial("radio_static" if obj.kind=="radio" else "hum",self.px,self.py,self.pa,obj.x,obj.y)
            self.make_noise(0.6); self.subtitle_show("[static — a voice counting floors, backwards]")
        elif kind=="lift":
            if 22 in self.anom.active:
                self.audio.play("elevator_ding"); self.subtitle_show("[lift arrives — onto brick]")
                self.show_message("The doors open onto a brick wall. That is not a floor.",4)
            elif 16 in self.anom.active:
                self.audio.play("elevator_rumble"); self.subtitle_show("[lift moving — the indicator never changes]")
            else:
                self.audio.play("elevator_ding"); self.show_message("The lift is dead. The building wants you to walk.",3)
            self.make_noise(0.8)
    def make_noise(self,level):
        self.noise_level=max(self.noise_level,level); self.noise_pos=(self.px,self.py)
    # ---------------------------------------------------------------- update
    def update(self,dt,keys):
        if self.state!="play": return
        self.loop_time+=dt; w=self.world
        if self.sub_t>0: self.sub_t-=dt
        if self.msg_t>0: self.msg_t-=dt
        # doors animate
        for d in w.doors.values():
            d.open += clamp(d.target-d.open,-dt*1.8,dt*1.8)
            if d.shake>0: d.shake-=dt
        # --- player movement
        sens=0.0026*self.settings["sensitivity"]
        if self.mouse_captured:
            mx,my=pygame.mouse.get_rel(); self.pa+=mx*sens; self.pitch=clamp(self.pitch-my*1.4,-90,90)
        turn=2.4*dt
        if keys[pygame.K_LEFT]: self.pa-=turn
        if keys[pygame.K_RIGHT]: self.pa+=turn
        sprint = (keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]) and self.stamina>1 and not self.crouch
        speed = 4.6 if sprint else (1.7 if self.crouch else 2.9)
        fx,fy=math.cos(self.pa),math.sin(self.pa); rx,ry=-fy,fx
        mx=my=0.0
        if keys[pygame.K_w] or keys[pygame.K_UP]: mx+=fx; my+=fy
        if keys[pygame.K_s] or keys[pygame.K_DOWN]: mx-=fx; my-=fy
        if keys[pygame.K_a]: mx-=rx; my-=ry
        if keys[pygame.K_d]: mx+=rx; my+=ry
        moving = abs(mx)+abs(my)>0.01
        if moving:
            n=math.hypot(mx,my); self.try_move(self.px+mx/n*speed*dt, self.py+my/n*speed*dt)
            self.bob+=dt*(9 if sprint else 6); self.step_t-=dt
            if self.step_t<=0:
                self.audio.play("footstep",0.5 if not self.crouch else 0.18)
                self.step_t=0.34 if sprint else 0.46
                if random.random()<0.12: self.audio.play("creak",0.25)
            self.make_noise(1.0 if sprint else (0.08 if self.crouch else 0.45))
            self.stamina=clamp(self.stamina-(16*dt if sprint else -9*dt),0,100)
        else:
            self.stamina=clamp(self.stamina+11*dt,0,100); self.noise_level=max(0,self.noise_level-dt*0.7)
        # flashlight battery
        if self.flashlight and self.battery>0: self.battery-=dt*0.55
        if self.battery<=0: self.flashlight=False; self.battery=0
        # darkness / proximity sanity
        near_ent=False
        for e in (self.observer,self.listener):
            if e and e.alive and dist2(e.x,e.y,self.px,self.py)<30: near_ent=True
        drain = (0.55 if not self.flashlight else 0.06) + (1.5 if near_ent else 0)
        self.sanity-=drain*dt
        if near_ent and random.random()<dt*0.8: self.audio.play("heartbeat",0.6)
        if self.sanity<=0: self.sanity=0; return self.finish("lost")
        # lighting modes
        if self.light_mode=="flicker":
            self.light_flick = 0.35 if random.random()<0.12 else (1.0 if random.random()<0.7 else 0.7)
            if random.random()<dt*1.2: self.audio.play("flicker",0.4)
        elif self.light_mode=="emergency":
            self.light_flick = 0.65+0.35*math.sin(time.time()*3.2)
        else: self.light_flick=min(1.0,self.light_flick+dt*2)
        self._timed_anomalies(dt)
        self._update_entities(dt)
        # hidden door reveal hint
        if self.has_key and len(self.docs_found)>=5:
            hd=w.doors.get((20,22))
            if hd and hd.tex=="wall_concrete" and dist2(20.5,22,self.px,self.py)<9:
                hd.tex="door_new"; self.subtitle_show("[a seam in the concrete — a door with a 0]"); self.audio.play("creak")
    def _timed_anomalies(self,dt):
        w=self.world
        for aid in self.anom.active:
            tag=self.anom.targets[aid].get("timed")
            if not tag: continue
            if tag=="steps_behind" and self.loop_time>10 and random.random()<dt*0.25:
                bx,by=self.px-math.cos(self.pa)*2.5,self.py-math.sin(self.pa)*2.5
                self.audio.spatial("footsteps_behind",self.px,self.py,self.pa,bx,by,20,1.0)
                self.subtitle_show("[footsteps — directly behind you]"); self.sanity-=1.2
            elif tag=="whisper" and random.random()<dt*0.3:
                self.audio.spatial("whisper",self.px,self.py,self.pa,9.5,8.0,18,1.0); self.subtitle_show("[whispering — inside 4A]")
            elif tag=="knock" and random.random()<dt*0.3:
                self.audio.spatial("knock",self.px,self.py,self.pa,10.5,15.0,18,1.0); self.subtitle_show("[knocking — from inside locked 4C]")
                w.doors[(10,14)].shake=0.5
            elif tag=="radio" and random.random()<dt*0.35:
                e=w.ent_by_name("Radio"); self.audio.spatial("radio_static",self.px,self.py,self.pa,e.x,e.y,20,1.0)
                self.subtitle_show("[radio static — counting: eight… eight… eight…]"); self.light_flick=0.5
            elif tag=="scream" and aid not in self.timed_fired and self.loop_time>random.uniform(8,20):
                self.timed_fired.add(aid); self.audio.play("scream",0.85); self.light_flick=0.15; self.sanity-=3
                self.subtitle_show("[a scream — floors away, abruptly cut off]")
            elif tag=="lift_sound" and random.random()<dt*0.25:
                self.audio.spatial(random.choice(["elevator_ding","elevator_rumble"]),self.px,self.py,self.pa,31.5,21,20)
                self.subtitle_show("[the lift arrives — but it never moves]")
            elif tag=="steps_above" and random.random()<dt*0.3:
                self.audio.play("footsteps_above",0.8); self.subtitle_show("[footsteps above — there is no floor above]")
            elif tag=="breathing" and random.random()<dt*0.3:
                self.audio.play("breathing",0.85); self.subtitle_show("[breathing — close, and not yours]"); self.sanity-=0.8
            elif tag=="alarm" and random.random()<dt*0.2:
                self.audio.play("alarm",0.4); self.subtitle_show("[emergency alarm — no fire, no smoke]")
            elif tag=="shadow_cross":
                if aid not in self.timed_fired and self.world.zones.get((int(self.px),int(self.py)),"").startswith("Apartment 4B"):
                    self.timed_fired.add(aid)
                    self.shadow_ent=w.add(15.6,6.0,"shadow",1.45,"Shadow",0,kind="shadow")
                    self.audio.play("sting",0.5); self.subtitle_show("[something crossed the room]")
                if self.shadow_ent and self.shadow_ent.alive:
                    self.shadow_ent.x+=dt*3.4
                    if self.shadow_ent.x>26: self.shadow_ent.alive=False
            elif tag=="ajar" and dist2(10.5,14,self.px,self.py)<2.2 and aid not in self.timed_fired:
                self.timed_fired.add(aid); w.doors[(10,14)].tex="door_apt3"
                self.audio.play("door_slam"); self.sanity-=4; self.subtitle_show("[the door slams — whatever watched is gone]")
        # anomaly #26 figure vanishes when approached / stared at
        for e in list(w.ents):
            if e.kind=="figure_end" and e.alive:
                if dist2(e.x,e.y,self.px,self.py)<12 or (self.is_visible(e,20) and random.random()<dt*0.4):
                    e.alive=False; self.audio.play("sting",0.55); self.subtitle_show("[gone — but it was there]")
    def _update_entities(self,dt):
        # OBSERVER: moves only while unobserved (real FOV + occlusion check)
        e=self.observer
        if e and e.alive:
            self.obs_cooldown-=dt
            if not self.is_visible(e) and self.obs_cooldown<=0:
                sp=e.data["speed"]+self.aggression
                self.entity_move(e,self.px,self.py,sp,dt)
            if dist2(e.x,e.y,self.px,self.py)<0.95 and self.obs_cooldown<=0:
                self.caught+=1; self.sanity-=28; self.audio.play("sting",1.0); self.audio.play("scream",0.5)
                self.show_message("IT WAS BEHIND YOU. (-28 sanity)",4)
                e.x,e.y=self._far_spawn(); self.obs_cooldown=14
                if self.caught>=3 or self.sanity<=0: return self.finish("lost")
        # LISTENER: investigates noise; nearly blind
        e=self.listener
        if e and e.alive:
            if self.noise_level>0.25 and self.noise_pos:
                e.data["tx"],e.data["ty"]=self.noise_pos; e.data["alert"]=min(1,e.data["alert"]+dt*self.noise_level)
            else: e.data["alert"]=max(0.12,e.data["alert"]-dt*0.08)
            d=math.hypot(e.data["tx"]-e.x,e.data["ty"]-e.y)
            if d>0.7: self.entity_move(e,e.data["tx"],e.data["ty"],0.8+1.5*e.data["alert"],dt)
            if dist2(e.x,e.y,self.px,self.py)<0.95:
                self.caught+=1; self.sanity-=24; self.audio.play("sting",1.0)
                self.show_message("THE LISTENER FOUND THE SOUND OF YOU. (-24 sanity)",4)
                e.x,e.y=self._far_spawn(); e.data["tx"],e.data["ty"]=e.x,e.y
                if self.caught>=3 or self.sanity<=0: return self.finish("lost")
        # IMITATOR: false cues + brief false figure. Its cues are NOT anomalies.
        e=self.imitator
        if e is not None:
            self.imit_t-=dt
            if self.imit_t<=0:
                self.imit_t=random.uniform(16,30)
                cue=random.choice(["knock","steps","door","appear"])
                if cue=="knock":
                    self.audio.spatial("knock",self.px,self.py,self.pa,self.px+random.uniform(-6,6),self.py+random.uniform(-4,4),20)
                    self.subtitle_show("[knocking — somewhere…?]")
                elif cue=="steps":
                    self.audio.spatial("footsteps_behind",self.px,self.py,self.pa,self.px-math.cos(self.pa)*3,self.py-math.sin(self.pa)*3,20,0.8)
                    self.subtitle_show("[footsteps…?]")
                elif cue=="door":
                    self.audio.spatial("creak",self.px,self.py,self.pa,self.px+5,self.py,20); self.subtitle_show("[a door creaks…?]")
                else:
                    e.alive=True; e.data["visible_t"]=2.6
                    e.x=self.px+math.cos(self.pa)*9; e.y=self.py+math.sin(self.pa)*9
                    if self.world.solid_at(e.x,e.y,for_entity=True): e.x,e.y=self._far_spawn()
                    self.subtitle_show("[someone who looks like you…?]")
            if e.alive:
                e.data["visible_t"]-=dt
                if e.data["visible_t"]<=0: e.alive=False
    # -------------------------------------------------------------- rendering
    def cast_frame(self):
        cols=int(self.settings["quality"]); hh=360
        frame=np.zeros((hh,cols,3),dtype=np.float32)
        horizon=hh//2+int(self.pitch)
        # ceiling / floor gradients
        for y in range(horizon):
            t=y/max(1,horizon); frame[y,:]=(46+26*t,42+24*t,36+18*t)
        for y in range(max(horizon,0),hh):
            t=(y-horizon)/max(1,hh-horizon); frame[y,:]=(86-30*t,68-24*t,48-16*t)
        zbuf=np.full(cols,1e9,dtype=np.float32)
        fov=math.radians(66); w=self.world; bob=int(math.sin(self.bob)*3)
        crouch_off=14 if self.crouch else 0
        for c in range(cols):
            cam=2*c/cols-1; ra=self.pa+math.atan(cam*math.tan(fov/2))
            dx,dy=math.cos(ra),math.sin(ra)
            mapx,mapy=int(self.px),int(self.py)
            ddx=abs(1/dx) if dx else 1e30; ddy=abs(1/dy) if dy else 1e30
            if dx<0: stepx=-1; sdx=(self.px-mapx)*ddx
            else: stepx=1; sdx=(mapx+1-self.px)*ddx
            if dy<0: stepy=-1; sdy=(self.py-mapy)*ddy
            else: stepy=1; sdy=(mapy+1-self.py)*ddy
            side=0; ch='#'; door=None
            for _ in range(64):
                if sdx<sdy: sdx+=ddx; mapx+=stepx; side=0
                else: sdy+=ddy; mapy+=stepy; side=1
                ch=w.tile(mapx,mapy)
                if ch=='D':
                    door=w.doors.get((mapx,mapy))
                    if door and door.open>0.85: continue
                    break
                if ch!=' ': break
            perp=(sdx-ddx) if side==0 else (sdy-ddy); perp=max(perp,0.05)
            zbuf[c]=perp
            wallx=(self.py+perp*dy) if side==0 else (self.px+perp*dx); wallx-=math.floor(wallx)
            if side==0 and dx>0: wallx=1-wallx
            if side==1 and dy<0: wallx=1-wallx
            if ch=='D' and door:
                wallx=clamp(wallx+door.open*0.85*(1 if side==0 else 1),0,0.999)
                tkey=door.tex
                if door.shake>0: wallx=clamp(wallx+random.uniform(-0.02,0.02),0,0.999)
            else:
                tkey=self.tex_override.get((mapx,mapy), TEXMAP.get(ch,"wall_concrete"))
            tex=self.tex_arr.get(tkey,self.tex_arr["wall_concrete"])
            tx=int(wallx*255)
            line_h=int(hh*1.55/perp); y0=horizon-line_h//2+bob+crouch_off; y1=y0+line_h
            # lighting: distance fog + side shade + flashlight cone + flicker
            bright=1.25/(1.0+perp*0.13); bright*= (0.72 if side else 1.0)
            if self.flashlight:
                bright*= 1.0+1.5*max(0,1-abs(cam)*1.15)/(1+perp*0.10)
            bright*=self.light_flick
            col=tex[:,tx].astype(np.float32)*bright
            yy0,yy1=max(y0,0),min(y1,hh)
            if yy1>yy0:
                rows=np.linspace(0,255,line_h).astype(int)
                frame[yy0:yy1,c]=col[rows[yy0-y0:yy1-y0]]
        if self.light_mode=="emergency":
            frame[:,:,0]*=1.35; frame[:,:,1]*=0.55; frame[:,:,2]*=0.5
        surf=pygame.surfarray.make_surface(np.clip(frame,0,255).astype(np.uint8).transpose(1,0,2))
        surf=pygame.transform.scale(surf,(W,H))
        self.screen.blit(surf,(0,0))
        self._draw_sprites(zbuf,cols,hh,bob,crouch_off)
        # vignette + sanity pulse
        if not hasattr(self,"_vig"):
            v=pygame.Surface((W,H),pygame.SRCALPHA)
            for i in range(26):
                pygame.draw.rect(v,(0,0,0,int(6)),(i*9,i*5,W-i*18,H-i*10),9)
            self._vig=v
        self.screen.blit(self._vig,(0,0))
        if self.sanity<35:
            s=pygame.Surface((W,H),pygame.SRCALPHA); a=int((35-self.sanity)*2.2*(0.6+0.4*math.sin(time.time()*4)))
            pygame.draw.rect(s,(120,10,10,clamp(a,0,90)),(0,0,W,H),60); self.screen.blit(s,(0,0))
    def _draw_sprites(self,zbuf,cols,hh,bob,crouch_off):
        fov=math.radians(66); horizon_px=H//2+int(self.pitch*2)+bob*2+crouch_off*2
        items=[]
        for e in self.world.ents:
            if not e.alive: continue
            dx,dy=e.x-self.px,e.y-self.py; d=math.hypot(dx,dy)
            if d<0.25 or d>26: continue
            ang=ang_diff(math.atan2(dy,dx),self.pa)
            if abs(ang)>1.0: continue
            items.append((d,e,ang))
        items.sort(key=lambda t:-t[0])
        for d,e,ang in items:
            cam=math.tan(ang)/math.tan(fov/2); sx=int((cam*0.5+0.5)*W)
            wall_scr=H*1.55/d; size=int(wall_scr*e.scale*0.80); tex=self.spr.get(e.sprite)
            if not tex or size<4: continue
            col_c=int((cam*0.5+0.5)*cols)
            if 0<=col_c<cols and zbuf[col_c]<d-0.35:  # mostly occluded at centre; strips still may show edges
                pass
            img=pygame.transform.scale(tex,(size,size))
            # distance shading
            bright=clamp(1.15/(1+d*0.13)*self.light_flick,0.06,1.0)
            if self.flashlight: bright=clamp(bright*(1.3-max(0,abs(cam))*0.6),0.06,1.0)
            if bright<0.98:
                dark=pygame.Surface(img.get_size(),pygame.SRCALPHA); dark.fill((int(255*bright),)*3+(255,))
                img.blit(dark,(0,0),special_flags=pygame.BLEND_RGBA_MULT)
            yb=horizon_px+int(wall_scr*0.5)+int(e.vy*wall_scr)
            x0=sx-size//2; y0=yb-size
            # column-strip occlusion
            strip=max(6,size//14)
            for ox in range(0,size,strip):
                cc=int(((x0+ox)/W)*cols)
                if 0<=cc<cols and zbuf[cc]>=d-0.3:
                    self.screen.blit(img,(x0+ox,y0),area=pygame.Rect(ox,0,min(strip,size-ox),size))
    # ------------------------------------------------------------------- HUD
    def txt(self,s,x,y,font=19,col=(222,216,200),anchor="topleft",shadow=True):
        f=self.fonts.get(font) if isinstance(font,str) else self.fonts[font]
        if shadow:
            sh=f.render(s,True,(0,0,0)); r=sh.get_rect(**{anchor:(x+2,y+2)}); self.screen.blit(sh,r)
        im=f.render(s,True,col); r=im.get_rect(**{anchor:(x,y)}); self.screen.blit(im,r); return r
    def bar(self,x,y,w,h,frac,col,label):
        pygame.draw.rect(self.screen,(16,16,18),(x,y,w,h)); pygame.draw.rect(self.screen,col,(x+2,y+2,int((w-4)*clamp(frac,0,1)),h-4))
        pygame.draw.rect(self.screen,(120,112,96),(x,y,w,h),1); self.txt(label,x,y-19,15,(190,182,164))
    def draw_hud(self):
        # crosshair
        pygame.draw.circle(self.screen,(220,214,198),(W//2,H//2),3,1)
        zone=self.world.zones.get((int(self.px),int(self.py)),"Corridor")
        self.txt(f"FLOOR {self.floor}  ·  {zone}",24,18,22,(236,228,204))
        self.txt(f"Passage {self.loop_no}   Score {self.score}   Documents {len(self.docs_found)}/8   Journal {len(self.journal)}/30",24,46,15,(178,170,152))
        self.bar(24,H-64,190,14,self.sanity/100,(150,44,40) if self.sanity<35 else (110,140,110),"SANITY")
        self.bar(232,H-64,140,14,self.battery/100,(196,168,80),"FLASHLIGHT [F]")
        self.bar(390,H-64,110,14,self.stamina/100,(96,120,150),"STAMINA")
        obj="Something wrong: WEST stairs  ·  All normal: EAST stairs"
        self.txt(obj,W-24,18,15,(196,188,168),anchor="topright")
        if self.has_key: self.txt("Key: Maintenance",W-24,42,15,(206,180,110),anchor="topright")
        t=self.look_target()
        if t: self.txt(t[2],W//2,H//2+44,19,(240,232,210),anchor="midtop")
        if self.msg_t>0:
            self.txt(self.message,W//2,84,19,(244,238,220),anchor="midtop")
        if self.sub_t>0:
            self.txt(self.subtitle,W//2,H-104,17,(190,206,220),anchor="midtop")
        if self.observer and self.observer.alive and self.is_visible(self.observer):
            self.txt("DON'T LOOK AWAY.",W//2,120,22,(230,90,80),anchor="midtop")
    # ------------------------------------------------------------------ menus
    def draw_menu(self):
        if self.menu_bg: self.screen.blit(pygame.transform.scale(self.menu_bg,(W,H)),(0,0))
        else: self.screen.fill((10,10,12))
        ov=pygame.Surface((W,H),pygame.SRCALPHA); ov.fill((0,0,0,90)); self.screen.blit(ov,(0,0))
        self.txt("DON'T LOOK BACK",W//2,120,"title",(238,230,212),anchor="midtop")
        self.txt("A psychological horror of noticing  ·  Meridian House, Floor 4",W//2,206,17,(184,176,158),anchor="midtop")
        items=["New Game","How to Play","Settings","Anomaly Journal",f"Endings unlocked: {len(self.endings_unlocked)}/3","Quit"]
        for i,it in enumerate(items):
            col=(244,232,200) if i==self.menu_i else (168,160,144)
            pre="> " if i==self.menu_i else "  "
            self.txt(pre+it,W//2-170,286+i*48,22,col)
        self.txt("Headphones recommended. Contains flashing lights and sudden sounds.",W//2,H-44,15,(150,144,130),anchor="midtop")
    def draw_panel(self,title,lines,footer="ESC / Enter — back"):
        self.screen.fill((12,12,14))
        pygame.draw.rect(self.screen,(24,23,22),(150,60,W-300,H-120)); pygame.draw.rect(self.screen,(110,96,66),(150,60,W-300,H-120),2)
        self.txt(title,W//2,86,"big",(238,230,212),anchor="midtop")
        y=160
        for ln in lines:
            self.txt(ln,196,y,17,(214,206,188)); y+=26
        self.txt(footer,W//2,H-104,15,(160,152,136),anchor="midtop")
    def draw_state(self):
        if self.state=="menu": self.draw_menu()
        elif self.state=="play" or self.state=="pause":
            self.cast_frame(); self.draw_hud()
            if self.state=="pause":
                ov=pygame.Surface((W,H),pygame.SRCALPHA); ov.fill((0,0,0,150)); self.screen.blit(ov,(0,0))
                self.txt("PAUSED",W//2,220,"big",(240,234,216),anchor="midtop")
                self.txt("ESC resume   ·   J journal   ·   O settings   ·   M main menu",W//2,300,19,(200,192,172),anchor="midtop")
        elif self.state=="help":
            self.draw_panel("HOW TO PLAY",[
            "You wake in Apartment 4B, Meridian House. Eight floors down is freedom.",
            "","EACH PASSAGE: explore Floor 4 and compare it to how it SHOULD be.",
            "  • Something is WRONG  →  use the WEST stairs (go back / report it).",
            "  • Everything is NORMAL →  use the EAST stairs (go down).",
            "Correct: descend one floor.  Wrong: +2 floors, −18 sanity.",
            "","CONTROLS","  WASD move · Mouse/arrows look · E interact · Q document anomaly",
            "  F flashlight · SHIFT sprint (loud!) · C crouch (quiet) · J journal · ESC pause",
            "","Documenting (Q) a real anomaly: +sanity, +score, journal entry (3 per passage).",
            "Beware the IMITATOR: it fakes knocks and footsteps that are NOT anomalies.",
            "The OBSERVER moves only when unseen. The LISTENER hunts sound.",
            "Find 8 documents. Five truths + the maintenance key open Room 0…"])
        elif self.state=="settings":
            s=self.settings; q="Performance" if s["quality"]<=240 else ("Balanced" if s["quality"]<=320 else "Quality")
            rows=[f"Volume: {int(s['volume']*100)}%",f"Mouse sensitivity: {s['sensitivity']:.1f}",
                  f"Render quality: {q}",f"Subtitles: {'On' if s['subtitles'] else 'Off'}",
                  f"Fullscreen: {'On' if s['fullscreen'] else 'Off'} (applies on restart)"]
            lines=["Use ↑/↓ and ←/→ to change.","",""]
            self.draw_panel("SETTINGS",lines)
            for i,r in enumerate(rows):
                col=(244,232,200) if i==self.set_i else (186,178,160)
                self.txt(("> " if i==self.set_i else "  ")+r,300,268+i*44,19,col)
        elif self.state=="journal":
            lines=[]
            for i,n,c in ANOMALIES:
                mark="DOCUMENTED" if i in self.journal else "— — —"
                lines.append(f"{i:02d}. [{c}] {n if i in self.journal else 'Undocumented anomaly'}   {mark}")
            self.screen.fill((12,12,14)); pygame.draw.rect(self.screen,(24,23,22),(90,36,W-180,H-72))
            pygame.draw.rect(self.screen,(110,96,66),(90,36,W-180,H-72),2)
            self.txt(f"ANOMALY JOURNAL  ({len(self.journal)}/30)",W//2,54,28,(238,230,212),anchor="midtop")
            for i,ln in enumerate(lines):
                colx=140 if i<15 else 680; row=i%15
                self.txt(ln,colx,108+row*34,15,(214,206,188) if (i+1) in self.journal else (130,124,112))
            self.txt("ESC / J — back",W//2,H-58,15,(160,152,136),anchor="midtop")
        elif self.state=="doc":
            title,body=DOCS[self.open_doc]
            self.draw_panel(title.upper(),body.split("\n"),footer=f"Document {len(self.docs_found)}/8 found   ·   ESC / E — put it down")
        elif self.state=="ending":
            data={
             "escape":("ENDING I — THE GROUND FLOOR",["Eight correct judgements. Eight floors of noticing.","The lobby is dusty, ordinary, and the most beautiful","room you have ever seen. The front door opens onto","morning. Behind you, very faintly, a lift arrives —","","You do not look back. You will never know if","Floor 4 is still up there. You will check every","room you enter, forever, twice.","","That is the price. It is worth it."]),
             "truth":("ENDING II — ROOM 0",["The recorder plays a voice counting floors backwards.","Then E. Vane, Building Manager, explains the study:","a building that feeds on being *assumed*. Every tenant","who stopped noticing became part of the floor —","a figure, a face, a sound. Mara's voice joins the tape.","","You take the tape. Evidence. Understanding.","The corridor behind you is suddenly, honestly, empty.","","Some houses are haunted. This one was staffed."]),
             "lost":("ENDING III — RESIDENT",["Your sanity gives out somewhere past the notice board.","It doesn't hurt. That's the worst part. It's restful,","like furniture. The corridor arranges you gently","","at the far end, where the light is thin.","","Someday a new tenant will walk this floor, notice a","figure standing where no figure should be —","","— and, if they are wise, they will go back."]),
            }[self.ending]
            self.draw_panel(data[0],data[1]+["",f"Score {self.score} · Documents {len(self.docs_found)}/8 · Journal {len(self.journal)}/30 · Endings {len(self.endings_unlocked)}/3"],
                            footer="ENTER — main menu")
    # --------------------------------------------------------------- events
    def handle_event(self,ev):
        if ev.type==pygame.QUIT: self.running=False
        if ev.type==pygame.MOUSEBUTTONDOWN and self.state=="play" and not self.mouse_captured:
            pygame.mouse.set_visible(False); pygame.event.set_grab(True); self.mouse_captured=True
            pygame.mouse.get_rel()
        if ev.type!=pygame.KEYDOWN: return
        k=ev.key
        if self.state=="menu":
            if k in (pygame.K_UP,pygame.K_w): self.menu_i=(self.menu_i-1)%6; self.audio.play("ui",0.5)
            elif k in (pygame.K_DOWN,pygame.K_s): self.menu_i=(self.menu_i+1)%6; self.audio.play("ui",0.5)
            elif k in (pygame.K_RETURN,pygame.K_e):
                self.audio.play("ui")
                if self.menu_i==0: self.new_game(); self.state="play"; self.audio.start_ambient()
                elif self.menu_i==1: self.state="help"
                elif self.menu_i==2: self.state="settings"
                elif self.menu_i==3: self.state="journal"
                elif self.menu_i==5: self.running=False
        elif self.state in ("help","journal"):
            if k in (pygame.K_ESCAPE,pygame.K_RETURN,pygame.K_j): self.state="play" if self.loop_no and pygame.mouse.get_pressed else "menu"; self.state="menu" if not self._in_game else "play"
        elif self.state=="settings":
            s=self.settings
            if k==pygame.K_UP: self.set_i=(self.set_i-1)%5
            elif k==pygame.K_DOWN: self.set_i=(self.set_i+1)%5
            elif k in (pygame.K_LEFT,pygame.K_RIGHT):
                d=1 if k==pygame.K_RIGHT else -1
                if self.set_i==0: s["volume"]=clamp(s["volume"]+0.1*d,0,1); self.audio.vol=s["volume"]
                elif self.set_i==1: s["sensitivity"]=clamp(s["sensitivity"]+0.1*d,0.3,2.5)
                elif self.set_i==2: s["quality"]=[240,320,420][clamp([240,320,420].index(s["quality"])+d,0,2)]
                elif self.set_i==3: s["subtitles"]=not s["subtitles"]
                elif self.set_i==4: s["fullscreen"]=not s["fullscreen"]
                self.audio.play("ui",0.6)
            elif k in (pygame.K_ESCAPE,pygame.K_RETURN):
                try: json.dump(s,open(SET_PATH,"w"),indent=1)
                except Exception: pass
                self.state="play" if self._in_game else "menu"
        elif self.state=="doc":
            if k in (pygame.K_ESCAPE,pygame.K_e,pygame.K_RETURN): self.state="play"
        elif self.state=="ending":
            if k in (pygame.K_RETURN,pygame.K_ESCAPE): self.state="menu"; self._in_game=False
        elif self.state=="pause":
            if k==pygame.K_ESCAPE: self.state="play"
            elif k==pygame.K_j: self.state="journal"
            elif k==pygame.K_o: self.state="settings"
            elif k==pygame.K_m: self.state="menu"; self._in_game=False; pygame.mouse.set_visible(True); self.mouse_captured=False
        elif self.state=="play":
            self._in_game=True
            if k==pygame.K_ESCAPE:
                self.state="pause"; pygame.mouse.set_visible(True); pygame.event.set_grab(False); self.mouse_captured=False
            elif k==pygame.K_e: self.interact()
            elif k==pygame.K_q:
                t=self.look_target()
                if t and t[0] in ("decor","device"): self.document_at(t[1].x,t[1].y)
                elif t and t[0]=="anomzone": self.document_at(self.px,self.py)
                else: self.document_at(self.px+math.cos(self.pa)*1.5,self.py+math.sin(self.pa)*1.5)
            elif k==pygame.K_f:
                if self.battery>2: self.flashlight=not self.flashlight; self.audio.play("ui",0.5)
                else: self.show_message("The flashlight battery is dead. Find a battery.",3)
            elif k==pygame.K_c: self.crouch=not self.crouch
            elif k==pygame.K_j: self.state="journal"
    _in_game=False
    # ------------------------------------------------------------------- run
    def run(self, max_frames=None, auto=False, screenshot=None):
        frames=0; self.audio.start_ambient() if self.state=="play" else None
        while self.running:
            dt=min(self.clock.tick(60)/1000.0,0.05)
            for ev in pygame.event.get(): self.handle_event(ev)
            keys=pygame.key.get_pressed()
            if auto and self.state=="play":
                # simple autopilot for headless verification: walk east, look around
                self.pa=0.15*math.sin(frames*0.02)
                nx=self.px+math.cos(self.pa)*2.2*dt; ny=self.py+math.sin(self.pa)*2.2*dt
                self.try_move(nx,ny); self.bob+=dt*6
                if frames%240==239: self.interact()
            else:
                self.update(dt,keys)
            self.draw_state(); pygame.display.flip()
            frames+=1
            if screenshot and frames==max(2,(max_frames or 30)-1):
                pygame.image.save(self.screen,screenshot); print("saved",screenshot)
            if max_frames and frames>=max_frames: break
        try: json.dump(self.settings,open(SET_PATH,"w"),indent=1)
        except Exception: pass
        pygame.quit()

def selftest():
    os.environ.setdefault("SDL_VIDEODRIVER","dummy"); os.environ.setdefault("SDL_AUDIODRIVER","dummy")
    g=Game(headless=True); results=[]
    assert len(ANOMALIES)==30
    # all 30 anomalies apply cleanly & create targets
    for aid in range(1,31):
        g.tex_override={}; g.light_mode="normal"
        w=World(g,long_corridor=(aid==20)); info=apply_anomaly(g,w,aid)
        assert info["pos"] is not None, aid
        results.append(aid)
    # map connectivity: BFS spawn -> both exits, 4B, maintenance, room0 tile
    w=g.world
    def reach(tx,ty):
        seen={(3,12)}; q=deque([(3,12)])
        while q:
            c=q.popleft()
            if c==(tx,ty): return True
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                n=(c[0]+dx,c[1]+dy)
                if n not in seen and 0<=n[0]<MAP_W and 0<=n[1]<MAP_H and w.grid[n[1]][n[0]] in " D":
                    seen.add(n); q.append(n)
        return False
    for t in [(48,12),(1,12),(18,5),(20,16),(31,18),(41,18),(20,23)]:
        assert reach(*t), f"unreachable {t}"
    # Observer visibility: in front clear corridor = visible; behind = not
    g.px,g.py,g.pa=10.0,12.0,0.0
    e=Ent(16.0,12.0,"observer"); assert g.is_visible(e)
    e2=Ent(4.0,12.0,"observer"); assert not g.is_visible(e2)
    e3=Ent(18.0,5.0,"observer"); assert not g.is_visible(e3)  # occluded by wall/door line
    # decision logic + endings reachable
    g.new_game(); g.floor=1; g.anom.active=[]; g.decide(False); assert g.ending=="escape"
    g.new_game(); g.sanity=1; g.decide(True); assert g.ending=="lost" or g.sanity<=0
    g.new_game(); g.finish("truth"); assert "truth" in g.endings_unlocked
    print(f"SELFTEST PASSED: 30/30 anomalies, connectivity, Observer visibility/occlusion, decisions, 3 endings")
    return True

def main(argv=None):
    argv=argv or sys.argv[1:]
    if "--selftest" in argv: return 0 if selftest() else 1
    auto="--auto" in argv; shot=None; frames=None
    if "--screenshot" in argv:
        i=argv.index("--screenshot"); shot=argv[i+1]; frames=int(argv[i+2]) if len(argv)>i+2 else 40
        os.environ.setdefault("SDL_VIDEODRIVER","dummy"); os.environ.setdefault("SDL_AUDIODRIVER","dummy")
    g=Game(headless=bool(shot))
    if shot or auto: g.state="play"; g._in_game=True
    g.run(max_frames=frames,auto=auto,screenshot=shot)
    return 0

if __name__=="__main__":
    raise SystemExit(main())
