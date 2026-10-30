"""Сценарий эпизода: титры, шоты, реплики.

Сценарий — это обычный Python-код: шоты собираются функциями, время реплик
считается само. Поэтому «сериал» можно продолжать сколь угодно долго:
эпизод N отличается только данным списком шотов.
"""
from __future__ import annotations

import numpy as np

from .backgrounds import Park, Room, Rooftop, Scene, Street, sky
from .canvas import Frame, Raster
from .font import draw_text, text_size, wrap_text
from .palette import DAY, DUSK, GREEN, NIGHT, RAIN, Palette, lighten, mix
from .scene import Actor, Line, Shot
from .sprites import CharacterSpec


# ---------------------------------------------------------------------------
class Card(Scene):
    """Титры: тёмный дизерингованный фон + текст по центру."""

    name = "card"
    parallax = 0.0

    def __init__(self, title: str, subtitle: str = "", footer: str = "", title_scale: int = 2):
        self.title = title
        self.subtitle = subtitle
        self.footer = footer
        self.title_scale = title_scale
        self._cache = None

    def _build(self, pal: Palette, w: int, h: int) -> np.ndarray:
        a = sky(pal, w, h).copy()
        # притемнить, чтобы текст читался
        a = (a.astype(np.float32) * 0.55 + np.array(pal.bg, np.float32) * 0.45).astype(np.uint8)
        r = Raster(w, h)
        r.px[..., :3] = a
        r.px[..., 3] = 255
        # рамка
        r.rect(4, 4, w - 5, 4, pal.get("accent"))
        r.rect(4, h - 5, w - 5, h - 5, pal.get("accent"))
        # заголовок
        tw, th = text_size(self.title, scale=self.title_scale)
        draw_text(r, (w - tw) // 2, 40, self.title, pal.get("accent"), outline=pal.get("outline"), scale=self.title_scale)
        y = 40 + th + 8
        if self.subtitle:
            for row in wrap_text(self.subtitle, w - 24):
                rw, _ = text_size(row)
                draw_text(r, (w - rw) // 2, y, row, pal.get("text"), outline=pal.get("outline"))
                y += 10
        if self.footer:
            rows = wrap_text(self.footer, w - 24)
            for i, row in enumerate(rows):
                rw, _ = text_size(row)
                draw_text(r, (w - rw) // 2, h - 18 - (len(rows) - i) * 10, row,
                          mix(pal.get("accent"), pal.get("text"), 0.5), outline=pal.get("outline"))
        return r

    def draw(self, frame: Frame, cam_x=0.0, cam_y=0.0, t=0.0, pal=None):
        pal = pal or NIGHT
        if self._cache is None or getattr(self, "_pal", None) is not pal:
            self._cache = self._build(pal, frame.w, frame.h)
            self._pal = pal
        frame.px[:] = self._cache.to_rgb(pal.bg)


# ---------------------------------------------------------------------------
def _seq(lines):
    """Пронумеровать реплики по времени: (who, text, dur, actor, style)."""
    out = []
    t = 0.0
    for item in lines:
        who, text, dur, actor, style = (item + (None, "box"))[:5] if len(item) < 5 else item
        out.append(Line(who=who, text=text, t0=t, dur=dur, actor=actor, style=style))
        t += dur
    return out


def episode_one(fps: int = 12) -> list[Shot]:
    aoi = CharacterSpec(name="Аой", hair="long", accessory="hairpin", outfit="sailor")
    mika = CharacterSpec(name="Мика", hair="twin", accessory="ribbon", outfit="hoodie")

    shots: list[Shot] = []

    # 1. титры
    shots.append(Shot(scene=Card("PIXANIME", "ГОРОД, ГДЕ КОНЧАЕТСЯ ЛЕТО", "ЭПИЗОД 1"),
                      pal=NIGHT, dur=5.0, trans_in=0.8, trans_out=0.8, letterbox=True))

    # 2. крыша на закате, общий план
    shots.append(Shot(
        scene=Rooftop(seed=7), pal=DUSK, dur=6.5,
        actors=[Actor(aoi, x=88, ground_y=99, seed=1, anim="idle")],
        lines=_seq([("", "Последний август. Крыша, куда не поднимается никто, кроме неё.",
                     4.8, None, "narration")]),
        cam_from=(0, 0), cam_to=(14, 0), seed=1, trans_in=0.5, trans_out=0.5, letterbox=True,
    ))

    # 3. двое на крыше — основной диалог
    shots.append(Shot(
        scene=Rooftop(seed=7), pal=DUSK, dur=14.0,
        actors=[Actor(aoi, x=50, ground_y=98, seed=1, facing=1),
                Actor(mika, x=80, ground_y=99, seed=2, facing=-1, dim=0.5)],
        lines=_seq([
            ("Мика", "Ты снова здесь. Третий вечер подряд.", 3.4, 1),
            ("Аой", "Отсюда видно море. Почти.", 3.2, 0),
            ("Мика", "Ты врёшь. Но я тоже смотрю.", 3.4, 1),
            ("Аой", "Значит, мы обе врём.", 3.0, 0),
        ]),
        cam_from=(4, 0), cam_to=(10, 0), seed=2, trans_in=0.4, trans_out=0.4,
    ))

    # 4. улица под дождём
    shots.append(Shot(
        scene=Street(seed=21), pal=RAIN, dur=6.5,
        actors=[Actor(aoi, x=64, ground_y=104, anim="walk", seed=3, vx=3.0)],
        lines=_seq([("", "До конца лета оставалось четыре дня.", 4.5, None, "subtitle")]),
        cam_from=(0, 0), cam_to=(8, 0), seed=3, fx=("rain",), trans_in=0.6, trans_out=0.6, letterbox=True,
    ))

    # 5. комната ночью
    shots.append(Shot(
        scene=Room(seed=3), pal=NIGHT, dur=8.0,
        actors=[Actor(aoi, x=64, ground_y=104, anim="sad", seed=4, scale=1)],
        lines=_seq([
            ("Аой", "Если не сказать сейчас, то уже никогда.", 4.0, 0),
            ("", "За окном мигал единственный фонарь.", 3.0, None, "subtitle"),
        ]),
        cam_from=(0, 0), cam_to=(4, 0), seed=4, fx=("fireflies",), trans_in=0.5, trans_out=0.5,
    ))

    # 6. парк
    shots.append(Shot(
        scene=Park(seed=11), pal=GREEN, dur=10.5,
        actors=[Actor(aoi, x=48, ground_y=100, seed=5),
                Actor(mika, x=80, ground_y=100, seed=6, facing=-1, dim=0.5)],
        lines=_seq([
            ("Мика", "Ты хотела что-то сказать?", 3.2, 1),
            ("Аой", "Я... забыла.", 2.8, 0),
            ("Мика", "Ну конечно. Забыла.", 3.2, 1),
        ]),
        cam_from=(0, 0), cam_to=(6, 0), seed=5, fx=("petals",), trans_in=0.5, trans_out=0.5,
    ))

    # 7. крыша ночью, финал
    shots.append(Shot(
        scene=Rooftop(seed=7), pal=NIGHT, dur=8.5,
        actors=[Actor(aoi, x=64, ground_y=99, seed=7, anim="sad")],
        lines=_seq([
            ("Аой", "В следующем году здесь будет кто-то другой.", 4.2, 0),
            ("", "И это было почти честно.", 3.2, None, "narration"),
        ]),
        cam_from=(6, 0), cam_to=(0, 0), seed=6, fx=("sparkles",), trans_in=0.6, trans_out=1.2, letterbox=True,
    ))

    # 8. конец
    shots.append(Shot(scene=Card("ПРОДОЛЖЕНИЕ", "СЛЕДУЕТ", "PIXANIME • ЭПИЗОД 1"),
                      pal=NIGHT, dur=4.5, trans_in=0.8, trans_out=0.0, letterbox=True))
    return shots


def episode_two(fps: int = 12) -> list[Shot]:
    aoi = CharacterSpec(name="Аой", hair="long", accessory="hairpin", outfit="sailor")
    mika = CharacterSpec(name="Мика", hair="twin", accessory="ribbon", outfit="hoodie")

    shots: list[Shot] = []
    shots.append(Shot(scene=Card("PIXANIME", "ДОЖДЬ ИДЁТ ТРЕТИЙ ДЕНЬ", "ЭПИЗОД 2"),
                      pal=RAIN, dur=4.5, trans_in=0.8, trans_out=0.8, letterbox=True))

    # улица под дождём, крупный план
    shots.append(Shot(
        scene=Street(seed=21), pal=RAIN, dur=7.0,
        actors=[Actor(aoi, x=64, ground_y=118, seed=11, scale=2, anim="sad")],
        lines=_seq([("", "Дождь шёл третий день, и город казался чужим.", 4.6, None, "subtitle")]),
        cam_from=(0, 0), cam_to=(3, 0), seed=11, fx=("rain",), trans_in=0.5, trans_out=0.5, letterbox=True,
    ))

    # двое под козырьком
    shots.append(Shot(
        scene=Street(seed=21), pal=RAIN, dur=12.0,
        actors=[Actor(aoi, x=52, ground_y=104, seed=12),
                Actor(mika, x=78, ground_y=104, seed=13, facing=-1, dim=0.5)],
        lines=_seq([
            ("Мика", "Ты стоишь здесь уже час.", 3.2, 1),
            ("Аой", "У меня нет зонта.", 2.8, 0),
            ("Мика", "У меня два.", 2.8, 1),
            ("Аой", "...Ты всегда появляешься вовремя.", 3.2, 0),
        ]),
        cam_from=(2, 0), cam_to=(8, 0), seed=12, fx=("rain",), trans_in=0.4, trans_out=0.4,
    ))

    # комната, ночь, разговор по телефону
    shots.append(Shot(
        scene=Room(seed=3), pal=NIGHT, dur=8.0,
        actors=[Actor(aoi, x=60, ground_y=104, seed=14, anim="idle")],
        lines=_seq([
            ("Аой", "Я хотела сказать спасибо. За зонт.", 3.8, 0),
            ("", "В трубке было слышно, как шумит дождь.", 3.4, None, "subtitle"),
        ]),
        cam_from=(0, 0), cam_to=(2, 0), seed=14, fx=("fireflies",), trans_in=0.5, trans_out=0.6,
    ))

    # парк после дождя
    shots.append(Shot(
        scene=Park(seed=11), pal=GREEN, dur=8.5,
        actors=[Actor(mika, x=70, ground_y=100, seed=15)],
        lines=_seq([
            ("Мика", "Если завтра будет солнце — пойдём на крышу.", 3.8, 0),
            ("", "Солнце вышло на следующее утро.", 3.2, None, "narration"),
        ]),
        cam_from=(4, 0), cam_to=(0, 0), seed=15, fx=("petals",), trans_in=0.5, trans_out=0.8,
    ))

    shots.append(Shot(scene=Card("КОНЕЦ ЭПИЗОДА 2", "", "PIXANIME • 2026"),
                      pal=NIGHT, dur=4.0, trans_in=0.8, trans_out=0.0, letterbox=True))
    return shots


def episode_three(fps: int = 12) -> list[Shot]:
    aoi = CharacterSpec(name="Аой", hair="long", accessory="headphones", outfit="coat")
    mika = CharacterSpec(name="Мика", hair="bob", accessory="", outfit="coat")

    shots: list[Shot] = []
    shots.append(Shot(scene=Card("PIXANIME", "ТРИ ГОДА СПУСТЯ", "ЭПИЗОД 3"),
                      pal=NIGHT, dur=4.5, trans_in=0.8, trans_out=0.8, letterbox=True))

    shots.append(Shot(
        scene=Rooftop(seed=7), pal=NIGHT, dur=7.5,
        actors=[Actor(aoi, x=64, ground_y=99, seed=21, anim="idle")],
        lines=_seq([("", "Сентябрь. Ветер уже холодный, но небо — то же.", 4.8, None, "narration")]),
        cam_from=(0, 0), cam_to=(12, 0), seed=21, fx=("sparkles",), trans_in=0.5, trans_out=0.5, letterbox=True,
    ))

    shots.append(Shot(
        scene=Rooftop(seed=7), pal=NIGHT, dur=12.0,
        actors=[Actor(aoi, x=50, ground_y=98, seed=22),
                Actor(mika, x=80, ground_y=99, seed=23, facing=-1, dim=0.5)],
        lines=_seq([
            ("Мика", "Ты всё ещё приходишь сюда.", 3.0, 1),
            ("Аой", "А ты всё ещё ищешь меня.", 3.2, 0),
            ("Мика", "Кто-то же должен.", 2.8, 1),
            ("Аой", "Тогда оставайтесь. Оба.", 2.8, 0),
        ]),
        cam_from=(0, 0), cam_to=(6, 0), seed=22, trans_in=0.4, trans_out=0.5,
    ))

    shots.append(Shot(
        scene=Park(seed=11), pal=DUSK, dur=7.0,
        actors=[Actor(aoi, x=58, ground_y=100, seed=24, anim="wave")],
        lines=_seq([("", "Это была не последняя крыша. Просто одна из них.", 4.4, None, "subtitle")]),
        cam_from=(6, 0), cam_to=(0, 0), seed=24, fx=("petals",), trans_in=0.5, trans_out=0.8,
    ))

    shots.append(Shot(scene=Card("КОНЕЦ", "СПАСИБО, ЧТО СМОТРЕЛИ", "PIXANIME • 2026"),
                      pal=NIGHT, dur=5.0, trans_in=0.8, trans_out=0.0, letterbox=True))
    return shots


EPISODES = {1: episode_one, 2: episode_two, 3: episode_three}
