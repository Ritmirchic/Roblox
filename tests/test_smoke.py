"""Быстрые проверки движка: всё должно рисоваться и не падать.

Запуск:  python tests/test_smoke.py
"""
from __future__ import annotations

import os
import sys
import tempfile

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pixanime import font
from pixanime.canvas import Frame, Raster
from pixanime.effects import dither_dissolve, rain, vignette
from pixanime.palette import DUSK, NIGHT, dithered_ramp
from pixanime.scene import Actor, Line, Renderer, Shot
from pixanime.sprites import CharacterSpec, Pose, render_character


def test_canvas_primitives():
    r = Raster(32, 32)
    r.rect(2, 2, 10, 10, (255, 0, 0))
    assert r.px[2, 2, 3] == 255 and r.px[10, 10, 0] == 255
    r.ellipse(16, 16, 5, 5, (0, 255, 0))
    assert r.px[16, 16, 1] == 255
    r.poly([(20, 20), (28, 20), (24, 28)], (0, 0, 255))
    assert r.px[22, 24, 2] == 255
    m = r.px[..., 3] > 0
    before = int(m.sum())
    r.outline(m, (0, 0, 0))
    assert int((r.px[..., 3] > 0).sum()) > before, "обводка должна расширять силуэт"


def test_cel_shading_edge():
    r = Raster(16, 16)
    r.rect(4, 4, 10, 10, (100, 100, 100))
    m = r.px[..., 3] > 0
    edge = Raster.inner_edge(m, 1, 1)
    assert edge.any() and edge.sum() < m.sum()


def test_font_cyrillic():
    assert font.glyph("Я") and font.glyph("а") and font.glyph("ё")
    w, h = font.text_size("Привет, мир!")
    assert w > 0 and h == 7
    rows = font.wrap_text("Последний август. Крыша, куда не поднимается никто.", 100)
    assert len(rows) >= 2
    r = Raster(128, 32)
    font.draw_text(r, 2, 2, "Привет", (255, 255, 255), outline=(0, 0, 0))
    assert r.px[..., 3].sum() > 0


def test_sprite_variants():
    for hair in ("long", "twin", "short", "bob", "ponytail", "braid"):
        spr = render_character(CharacterSpec(hair=hair), Pose(), DUSK)
        assert spr.px[..., 3].sum() > 0, hair
        ys, xs = np.where(spr.px[..., 3] > 0)
        assert ys.min() >= 0 and ys.max() < spr.h and xs.min() >= 0 and xs.max() < spr.w


def test_sprite_poses_differ():
    a = render_character(CharacterSpec(), Pose(), DUSK).px
    b = render_character(CharacterSpec(), Pose(leg_phase=0.3, arm_r=1.2, mouth=1.0), DUSK).px
    assert not np.array_equal(a, b), "разные позы должны давать разные спрайты"


def test_scene_frame_shape():
    from pixanime.backgrounds import Park, Room, Rooftop, Street

    for scene, pal in ((Rooftop(), DUSK), (Street(), NIGHT), (Room(), NIGHT), (Park(), DUSK)):
        f = Frame(128, 128)
        scene.draw(f, 3, 0, 1.0, pal)
        assert f.px.shape == (128, 128, 3)
        assert f.px.std() > 1.0, f"{scene.name} должен быть не однотонным"


def test_dither_and_fade():
    a = dithered_ramp(64, 64, [(0.0, (0, 0, 0)), (1.0, (255, 255, 255))], levels=4)
    assert a.shape == (64, 64, 3) and a.max() > 200 and a.min() < 40
    from pixanime.scene import _fade_to_frame

    frame = Frame(32, 32, (10, 20, 30))
    _fade_to_frame(frame.px, (0, 0, 0), 1.0)
    assert frame.px.max() == 0


def test_dissolve_endpoints():
    a = np.zeros((16, 16, 3), np.uint8)
    b = np.full((16, 16, 3), 255, np.uint8)
    assert dither_dissolve(a, b, 0.0).max() == 0
    assert dither_dissolve(a, b, 1.0).min() == 255


def test_effects_do_not_crash():
    f = Frame(64, 64, (20, 20, 30))
    rain(f, 1.3, density=20)
    vignette(f, 0.5)
    assert f.px.shape == (64, 64, 3)


def test_shot_render_256():
    r = Renderer(256, 256, 12)
    shot = Shot(scene=__import__("pixanime.backgrounds", fromlist=["Rooftop"]).Rooftop(), pal=DUSK, dur=3,
                actors=[Actor(CharacterSpec(), x=64, ground_y=98)],
                lines=[Line("Аой", "Проверка", 0.0, 2.0, actor=0)])
    img = r.frame(shot, 1.0)
    assert img.shape == (256, 256, 3) and img.dtype == np.uint8
    # в кадре должен быть текст/сцена, а не пустота
    assert img.std() > 5


def test_gif_encoder_roundtrip():
    from pixanime.encode import GIFWriter

    path = os.path.join(tempfile.mkdtemp(), "t.gif")
    gw = GIFWriter(path, 32, 32, fps=10)
    for i in range(3):
        gw.write(np.full((32, 32, 3), i * 60, np.uint8))
    gw.close()
    data = open(path, "rb").read()
    assert data.startswith(b"GIF89a") and data.endswith(b"\x3b") and len(data) > 100


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ok   {t.__name__}")
        except Exception as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
    print(f"\n{len(tests)-failed}/{len(tests)} тестов пройдено")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
