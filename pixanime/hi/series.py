"""Сериал «Весенний свет»: четыре эпизода, каст и сценарий.

Каждый эпизод — 6-8 планов: общий, средний, крупный, склейки на движении.
Свет меняется от эпизода к эпизоду (утро -> закат -> дождь -> ночь), поэтому
сериал читается как одна история, а не как набор картинок.
"""
from __future__ import annotations

import os

from . import bg as BG
from .char import Look, Pose
from .direct import Beat, Episode, render_episode
from .film import Cam

# ---------------------------------------------------------------------------
# каст: у каждого свой цвет волос, глаз, форма и аксессуар
# ---------------------------------------------------------------------------
AOI = Look(name="Аой", hair="long", outfit="sailor", accessory="hairpin",
           hair_color=(78, 52, 84), hair_light=(150, 104, 132), eye=(104, 158, 222),
           eye_dark=(32, 56, 108), accent=(214, 68, 92), accent_dark=(150, 36, 58))

MIKA = Look(name="Мика", hair="twin", outfit="hoodie", accessory="ribbon",
            hair_color=(226, 164, 128), hair_light=(255, 226, 190), eye=(120, 196, 172),
            eye_dark=(38, 96, 88), cloth=(246, 232, 224), cloth_shade=(198, 176, 176),
            skirt=(96, 84, 120), skirt_shade=(70, 58, 94), accent=(240, 148, 172),
            accent_dark=(186, 92, 122), skin=(252, 220, 196), skin_shade=(226, 182, 162))

YUKI = Look(name="Юки", hair="short", outfit="coat", hair_color=(72, 54, 44),
            hair_light=(146, 112, 86), eye=(150, 132, 210), eye_dark=(58, 48, 112),
            cloth=(228, 224, 212), cloth_shade=(178, 174, 164), skirt=(64, 60, 72),
            skirt_shade=(44, 40, 52), accent=(196, 92, 84), accent_dark=(140, 56, 52),
            skin=(244, 208, 182), skin_shade=(214, 168, 146))

REN = Look(name="Рен", hair="bob", outfit="sailor", height=1.04,
           hair_color=(40, 38, 48), hair_light=(104, 100, 118), eye=(232, 176, 96),
           eye_dark=(120, 76, 32), accent=(96, 148, 176), accent_dark=(60, 100, 128),
           cloth=(238, 240, 246), cloth_shade=(186, 190, 208), skirt=(52, 66, 96),
           skirt_shade=(34, 44, 70), skin=(240, 200, 172), skin_shade=(208, 158, 134))

CAST = {"aoi": AOI, "mika": MIKA, "yuki": YUKI, "ren": REN}


# ---------------------------------------------------------------------------
# камера: три «объектива»
# ---------------------------------------------------------------------------
def _frame_cam(x: float, feet: float, top: float, bottom: float) -> Cam:
    """Камера по рамке: top/bottom — насколько выше/ниже стоп она видит."""
    height = max(8.0, top - bottom)
    return Cam(cx=x, cy=feet - (top + bottom) / 2.0, zoom=max(1.0, BG.H / height))


def push(cam: Cam, k: float = 1.08) -> Cam:
    """Медленный наезд: тот же центр, чуть больше зум."""
    return Cam(cx=cam.cx, cy=cam.cy, zoom=cam.zoom * k)


def wide(cx: float = BG.W / 2, cy: float = 74) -> Cam:
    return Cam(cx=cx, cy=cy, zoom=1.0)


def full(x: float, feet: float = 126) -> Cam:
    """Вся фигура в кадре (с воздухом над головой)."""
    return _frame_cam(x, feet, 124, -8)


def medium(x: float, feet: float = 126) -> Cam:
    """До колен — обычный «средний план»."""
    return _frame_cam(x, feet, 116, 40)


def close(x: float, feet: float = 126) -> Cam:
    """Голова и плечи: лицо крупно, видно мимику."""
    return _frame_cam(x, feet, 116, 68)


def two_shot(x1: float, x2: float, feet: float = 126) -> Cam:
    return _frame_cam((x1 + x2) / 2.0, feet, 120, 14)


# ---------------------------------------------------------------------------
# сценарий
# ---------------------------------------------------------------------------
def ep1() -> Episode:
    """Утро: Аой опаздывает, Мика ждёт у ворот."""
    y = 126
    beats = [
        Beat(kind="city_day", light="morning", seconds=2.4, seed=11, overlay="fade_in",
             cam=(wide(128, 72), Cam(cx=128, cy=70, zoom=1.10)),
             title="ЭПИЗОД 1.  УТРО"),
        Beat(kind="city_day", light="morning", seconds=2.2, seed=11, pan=26,
             who=["aoi"], look=["run"], x=[96], y=[y],
             cam=(medium(96, y), push(medium(96, y), 1.10))),
        Beat(kind="school", light="morning", seconds=2.6, seed=12,
             who=["aoi", "mika"], look=["run", "idle"], x=[104, 168], y=[y, y],
             cam=(two_shot(104, 168, y), two_shot(108, 164, y))),
        Beat(kind="school", light="morning", seconds=2.8, seed=12,
             who=["aoi", "mika"], look=["idle", "idle"], x=[118, 150], y=[y, y],
             cam=(medium(118, y), close(118, y)),
             say="Ты снова проспала, Аой.", speaker=1),
        Beat(kind="school", light="morning", seconds=2.6, seed=12,
             who=["aoi"], look=["idle"], x=[132], y=[y],
             cam=(close(132, y), push(close(132, y), 1.10)),
             say="Но я успела! Почти.", speaker=0),
        Beat(kind="park", light="day", seconds=2.4, seed=13, weather="petals",
             who=["aoi", "mika"], look=["walk", "walk"], x=[100, 118], y=[y, y - 2],
             cam=(two_shot(100, 118, y), two_shot(104, 122, y)), overlay="fade_out"),
    ]
    return Episode("ep01_hi", "Утро", beats, seed=101, mood="day", gif_beat=2)


def ep2() -> Episode:
    """Закат на крыше: тихий разговор и прыжок «от счастья»."""
    y = 126
    beats = [
        Beat(kind="rooftop", light="sunset", seconds=2.6, seed=21, overlay="fade_in",
             cam=(wide(128, 66), Cam(cx=136, cy=66, zoom=1.08)),
             title="ЭПИЗОД 2.  КРЫША"),
        Beat(kind="rooftop", light="sunset", seconds=3.0, seed=21,
             who=["aoi", "yuki"], look=["idle", "idle"], x=[104, 152], y=[y, y],
             depth=[0.0, 0.06], flip=[False, True],
             cam=(two_shot(104, 152, y), two_shot(108, 148, y))),
        Beat(kind="rooftop", light="sunset", seconds=2.8, seed=21,
             who=["yuki"], look=["idle"], x=[150], y=[y], flip=[True],
             cam=(close(150, y), push(close(150, y), 1.10)),
             say="Если долго смотреть на закат, кажется, что время стоит.", speaker=0),
        Beat(kind="rooftop", light="sunset", seconds=2.6, seed=21,
             who=["aoi"], look=["idle"], x=[110], y=[y],
             cam=(close(110, y), push(close(110, y), 1.10)),
             say="Тогда давай стоять здесь вечно.", speaker=0),
        Beat(kind="rooftop", light="sunset", seconds=2.6, seed=21, who=["aoi"],
             look=["jump"], x=[124], y=[y], cam=(medium(124, y), full(124, y)),
             weather="petals"),
        Beat(kind="rooftop", light="dusk" if "dusk" in BG.LIGHTS else "dawn", seconds=2.8, seed=22,
             who=["aoi", "yuki"], look=["idle", "idle"], x=[110, 146], y=[y, y], flip=[False, True],
             cam=(wide(128, 68), Cam(cx=128, cy=68, zoom=1.16)), overlay="fade_out"),
    ]
    return Episode("ep02_hi", "Крыша", beats, seed=202, mood="dusk", gif_beat=4)


def ep3() -> Episode:
    """Дождь на станции: Рен ждёт под навесом."""
    y = 128
    beats = [
        Beat(kind="station", light="rain", seconds=2.4, seed=31, overlay="fade_in", weather="rain",
             cam=(wide(128, 72), Cam(cx=128, cy=70, zoom=1.06)),
             title="ЭПИЗОД 3.  ДОЖДЬ"),
        Beat(kind="station", light="rain", seconds=2.8, seed=31, weather="rain",
             who=["ren"], look=["idle"], x=[124], y=[y],
             cam=(medium(124, y), close(128, y))),
        Beat(kind="station", light="rain", seconds=2.6, seed=31, weather="rain",
             who=["ren"], look=["idle"], x=[126], y=[y],
             cam=(close(126, y), push(close(126, y), 1.10)),
             say="Автобус опоздает на десять минут.", speaker=0),
        Beat(kind="station", light="rain", seconds=2.4, seed=32, weather="rain",
             who=["aoi", "ren"], look=["run", "idle"], x=[92, 150], y=[y, y],
             cam=(wide(128, 72), Cam(cx=118, cy=72, zoom=1.18)),
             say="Рен! Я взяла зонт на двоих.", speaker=0),
        Beat(kind="station", light="rain", seconds=2.6, seed=32, weather="rain",
             who=["aoi", "ren"], look=["idle", "idle"], x=[112, 142], y=[y, y],
             cam=(two_shot(112, 142, y), medium(120, y))),
        Beat(kind="city_day", light="night", seconds=2.8, seed=33, weather="rain", overlay="fade_out",
             who=["aoi", "ren"], look=["walk", "walk"], x=[104, 122], y=[y, y - 1],
             cam=(wide(128, 74), Cam(cx=114, cy=74, zoom=1.16))),
    ]
    return Episode("ep03_hi", "Дождь", beats, seed=303, mood="night", gif_beat=1)


def ep4() -> Episode:
    """Ночь: все четверо на крыше, звёзды."""
    y = 126
    beats = [
        Beat(kind="rooftop", light="night", seconds=2.6, seed=41, overlay="fade_in",
             cam=(Cam(cx=128, cy=48, zoom=1.0), Cam(cx=128, cy=62, zoom=1.08)),
             title="ЭПИЗОД 4.  ЗВЁЗДЫ"),
        Beat(kind="rooftop", light="night", seconds=3.0, seed=41,
             who=["aoi", "mika", "yuki", "ren"], look=["idle"] * 4,
             x=[86, 116, 146, 176], y=[y, y, y, y], depth=[0.0, 0.05, 0.05, 0.0],
             flip=[False, False, True, True],
             cam=(wide(128, 80), Cam(cx=128, cy=76, zoom=1.10))),
        Beat(kind="rooftop", light="night", seconds=2.8, seed=41,
             who=["mika"], look=["idle"], x=[116], y=[y],
             cam=(close(116, y), push(close(116, y), 1.10)),
             say="Смотри, падающая звезда!", speaker=0),
        Beat(kind="rooftop", light="night", seconds=2.6, seed=41,
             who=["aoi"], look=["idle"], x=[92], y=[y],
             cam=(close(92, y), push(close(92, y), 1.10)),
             say="Загадай желание. У нас есть целое лето.", speaker=0),
        Beat(kind="rooftop", light="night", seconds=3.0, seed=42, weather="snow",
             who=["aoi", "mika", "yuki", "ren"], look=["wave"] * 4,
             x=[88, 118, 148, 178], y=[y] * 4, flip=[False, False, True, True],
             cam=(wide(128, 78), Cam(cx=128, cy=74, zoom=1.14)), overlay="flash"),
        Beat(kind="city_day", light="night", seconds=3.2, seed=43, pan=18,
             cam=(wide(132, 70), Cam(cx=126, cy=70, zoom=1.12)), overlay="fade_out",
             title="КОНЕЦ ПЕРВОГО СЕЗОНА"),
    ]
    return Episode("ep04_hi", "Звёзды", beats, seed=404, mood="night", gif_beat=4)


EPISODES = {"ep1": ep1, "ep2": ep2, "ep3": ep3, "ep4": ep4}


def render(names: list[str], out_dir: str, scale: int = 2, log=print) -> dict:
    res = {}
    for name in names:
        ep = EPISODES[name]()
        log(f"[{name}] {ep.title}: {len(ep.beats)} планов, "
            f"{sum(b.frames for b in ep.beats)} кадров")
        res[name] = render_episode(ep, CAST, out_dir, scale=scale, log=log)
    return res
