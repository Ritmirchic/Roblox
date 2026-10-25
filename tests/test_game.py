"""Automated tests: anomalies, connectivity, entity AI, endings, simulation."""
import os, sys, math, random
os.environ.setdefault("SDL_VIDEODRIVER","dummy"); os.environ.setdefault("SDL_AUDIODRIVER","dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pygame
from dontlookback.game import Game, World, apply_anomaly, AnomalyState, ANOMALIES, MAP_W, MAP_H, Ent
from collections import deque

def make():
    return Game(headless=True)

def test_thirty_anomalies_apply():
    g=make(); assert len(ANOMALIES)==30
    for aid in range(1,31):
        g.tex_override={}; g.light_mode="normal"
        w=World(g,long_corridor=(aid==20)); info=apply_anomaly(g,w,aid)
        assert info["pos"] is not None and info["radius"]>0, f"anomaly {aid} has no detection target"
    print("PASS 30 anomalies apply with detection targets")

def test_connectivity():
    g=make(); w=g.world
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
    for t in [(48,12),(1,12),(18,5),(24,4),(20,18),(31,18),(41,18),(40,5),(32,5),(20,23)]:
        assert reach(*t), f"unreachable {t}"
    print("PASS map connectivity (all rooms, both exits, Room 0)")

def test_observer_visibility_rules():
    g=make(); g.px,g.py,g.pa=10.0,12.0,0.0
    assert g.is_visible(Ent(16.0,12.0,"observer"))            # ahead, clear LOS
    assert not g.is_visible(Ent(4.0,12.0,"observer"))         # behind player
    assert not g.is_visible(Ent(18.0,5.0,"observer"))         # occluded by walls
    # frozen while watched, moves when player looks away
    g._spawn_observer(); g.observer.x,g.observer.y=17.0,12.0; g.obs_cooldown=0
    x0=g.observer.x; g._update_entities(0.5); assert g.observer.x==x0, "Observer moved while visible!"
    g.pa=math.pi; g._update_entities(0.5); assert g.observer.x<x0, "Observer did not advance unseen"
    print("PASS Observer: FOV + occlusion + move-only-unseen")

def test_listener_noise_tracking():
    g=make(); g._spawn_listener(); e=g.listener; e.x,e.y=30.0,12.0
    g.px,g.py=12.0,12.0; g.make_noise(1.0)
    for _ in range(40): g._update_entities(0.1)
    assert abs(e.x-30.0)>1.0, "Listener ignored loud noise"
    print("PASS Listener investigates noise position")

def test_decisions_and_endings():
    g=make(); g.new_game(); g.floor=1; g.anom.active=[]; g.decide(False); assert g.ending=="escape"
    g.new_game(); g.anom.active=[1]; f=g.floor; g.decide(True); assert g.floor==f-1
    g.new_game(); g.sanity=5; g.decide(True); assert g.ending=="lost"
    g.finish("truth"); assert "truth" in g.endings_unlocked
    print("PASS decision logic + all 3 endings reachable")

def test_full_simulation_no_crash():
    random.seed(7); g=make(); g.new_game(); g.state="play"
    keys=pygame.key.get_pressed()
    for step in range(1500):
        if g.state!="play": g.state="play"
        if step%300==299: g.decide(random.random()<0.5)
        g.pa += random.uniform(-0.2,0.2)
        g.update(1/30, keys)
        if g.ending: g.new_game(); g.state="play"
    print("PASS 1500-step full simulation (entities, anomalies, decisions)")

if __name__=="__main__":
    test_thirty_anomalies_apply(); test_connectivity(); test_observer_visibility_rules()
    test_listener_noise_tracking(); test_decisions_and_endings(); test_full_simulation_no_crash()
    print("\nALL TESTS PASSED")
