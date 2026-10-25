import os, sys, math
os.environ.setdefault("SDL_VIDEODRIVER","dummy"); os.environ.setdefault("SDL_AUDIODRIVER","dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pygame
from dontlookback.game import Game, World, apply_anomaly, AnomalyState
g=Game(headless=True); os.makedirs("screenshots",exist_ok=True)
def shot(name):
    g.draw_state(); pygame.display.flip(); pygame.image.save(g.screen,f"screenshots/{name}"); print(name)
g.state="menu"; shot("menu.png")
g.state="play"; g._in_game=True
g.px,g.py,g.pa=18.5,9.0,-1.2; shot("apartment_4b.png")          # inside 4B looking at sofa/tv
g.px,g.py,g.pa=10.0,12.0,0.0; g._spawn_observer(); g.observer.x,g.observer.y=17.0,12.0; shot("observer.png")
# emergency anomaly
g.new_game(); g.tex_override={}; g.world=World(g); g.anom=AnomalyState(); g.anom.active=[23]; g.anom.targets[23]=apply_anomaly(g,g.world,23)
g.px,g.py,g.pa=8.0,12.0,0.0; g.state="play"; shot("anomaly_emergency.png")
# portrait anomaly close-up
g.new_game(); g.tex_override={}; g.world=World(g); g.anom=AnomalyState(); g.anom.active=[1]; g.anom.targets[1]=apply_anomaly(g,g.world,1)
g.px,g.py,g.pa=14.5,12.4,-math.pi/2; g.state="play"; shot("anomaly_painting.png")
g.state="journal"; shot("journal.png")
g.state="help"; shot("howtoplay.png")
pygame.quit()
