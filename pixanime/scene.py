"""Композиция кадра: фон + персонажи + эффекты + интерфейс.

Кадр собирается в два прохода:
  1. «мир» — рисуется в разрешении 128/zoom и апскейлится целым множителем;
  2. «интерфейс» — диалоговое окно, субтитры, письма — рисуется отдельным
     слоем 128x128 и накладывается после апскейла, чтобы текст всегда был
     одного размера, независимо от крупности плана.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from . import effects
from .anim import pose_for
from .backgrounds import Scene
from .canvas import Frame, Raster
from .font import draw_text, text_size, wrap_text
from .palette import Palette, lighten, mix, shade
from .sprites import CharacterSpec, GROUND_Y, SPR_H, render_character

BASE_W, BASE_H = 128, 128
OUT_W, OUT_H = 256, 256


@dataclass
class Actor:
    spec: CharacterSpec
    x: float = 64.0
    ground_y: int = 100
    anim: str = "idle"
    facing: int = 1
    scale: int = 1
    seed: int = 0
    t_offset: float = 0.0
    vx: float = 0.0           # движение по x, px/сек
    appear: float = 0.0       # время появления (сек от начала шота)
    dim: float = 0.0          # 0 — обычный, 1 — затемнён (не говорит)


@dataclass
class Line:
    """Реплика или субтитр."""

    who: str = ""
    text: str = ""
    t0: float = 0.0
    dur: float = 3.0
    actor: int | None = None
    style: str = "box"        # box | subtitle | narration | shout
    color: str = "text"


@dataclass
class Shot:
    scene: Scene
    pal: Palette
    dur: float = 5.0
    actors: list[Actor] = field(default_factory=list)
    lines: list[Line] = field(default_factory=list)
    cam_from: tuple[float, float] = (0.0, 0.0)
    cam_to: tuple[float, float] = (0.0, 0.0)
    zoom: int = 1
    fx: tuple[str, ...] = ()
    trans_in: float = 0.4
    trans_out: float = 0.4
    letterbox: bool = False
    shake: float = 0.0
    seed: int = 0

    def cam_at(self, t: float) -> tuple[float, float]:
        k = 0.0 if self.dur <= 0 else min(1.0, max(0.0, t / self.dur))
        # плавное ускорение/замедление — «дыхание» камеры
        e = k * k * (3 - 2 * k)
        return (
            self.cam_from[0] + (self.cam_to[0] - self.cam_from[0]) * e,
            self.cam_from[1] + (self.cam_to[1] - self.cam_from[1]) * e,
        )

    def active_line(self, t: float) -> Line | None:
        for ln in self.lines:
            if ln.t0 <= t < ln.t0 + ln.dur:
                return ln
        return None


# ---------------------------------------------------------------------------
class Renderer:
    def __init__(self, out_w: int = OUT_W, out_h: int = OUT_H, fps: int = 12):
        self.out_w, self.out_h = out_w, out_h
        self.fps = fps
        self._sprite_cache: dict = {}

    # --- вспомогательное ---------------------------------------------------
    def _sprite(self, spec: CharacterSpec, pose, pal: Palette):
        return render_character(spec, pose, pal)

    @staticmethod
    def _upscale(a: np.ndarray, k: int) -> np.ndarray:
        return np.repeat(np.repeat(a, k, axis=0), k, axis=1)

    # --- «мир» -------------------------------------------------------------
    def render_world(self, shot: Shot, t: float) -> np.ndarray:
        z = max(1, int(shot.zoom))
        w, h = BASE_W // z, BASE_H // z
        frame = Frame(w, h, shot.pal.bg)
        cam_x, cam_y = shot.cam_at(t)
        cam_x *= z  # на крупном плане камера двигается так же в пикселях кадра
        cam_y *= z
        if shot.shake:
            cam_x += math.sin(t * 39.0) * shot.shake
            cam_y += math.cos(t * 33.0) * shot.shake * 0.6
        shot.scene.draw(frame, cam_x, cam_y, t, shot.pal)

        # персонажи — от дальнего к ближнему
        line = shot.active_line(t)
        order = sorted(range(len(shot.actors)), key=lambda i: shot.actors[i].ground_y)
        for idx in order:
            a = shot.actors[idx]
            if t < a.appear:
                continue
            anim = a.anim
            if line is not None and line.actor == idx and anim in ("idle", "talk", "sad", "sit"):
                anim = "talk"
            pose = pose_for(anim, t + a.t_offset, a.seed)
            spr = render_character(a.spec, pose, shot.pal)
            if a.scale > 1:
                spr = self._scale_sprite(spr, a.scale)
            x = (a.x + a.vx * t - cam_x) / z
            gy = (a.ground_y - cam_y) / z
            # ступни спрайта нарисованы на y=GROUND_Y, поэтому поднимаем спрайт на эту величину
            y = int(round(gy)) - int(round(GROUND_Y * a.scale / z))
            frame.blit(spr, int(round(x)) - spr.w // 2, y, flip=(a.facing < 0))
            if a.dim > 0:
                # затемнение «неговорящего» — дизерингом, чтобы не мылить пиксели
                mask = spr.px[:, :, 3] > 0
                if a.facing < 0:
                    mask = mask[:, ::-1]
                mh, mw = mask.shape
                ys, xs = int(round(y)), int(round(x)) - spr.w // 2
                for yy in range(max(0, ys), min(h, ys + mh)):
                    for xx in range(max(0, xs), min(w, xs + mw)):
                        if mask[yy - ys, xx - xs] and ((xx + yy) % 2 == 0):
                            frame.px[yy, xx] = (frame.px[yy, xx] * 0.7).astype(np.uint8)

        # эффекты
        for name in shot.fx:
            self._apply_fx(frame, name, t, shot)

        effects.vignette(frame, 0.5 if shot.zoom == 1 else 0.35)
        return self._upscale(frame.px, 2 * z)

    def _apply_fx(self, frame: Frame, name: str, t: float, shot: Shot) -> None:
        if name == "rain":
            effects.rain(frame, t, shot.seed + 1, density=46, pal=shot.pal)
        elif name == "heavy_rain":
            effects.rain(frame, t, shot.seed + 2, density=70, pal=shot.pal, heavy=True)
        elif name == "snow":
            effects.snow(frame, t, shot.seed + 3, density=40)
        elif name == "petals":
            effects.petals(frame, t, shot.seed + 4, density=22, color=mix(shot.pal.get("scarf"), (255, 255, 255), 0.45))
        elif name == "fireflies":
            effects.fireflies(frame, t, shot.seed + 5)
        elif name == "sparkles":
            effects.sparkles(frame, t, shot.seed + 6)
        elif name == "rays":
            effects.light_rays(frame, t, shot.seed + 7, color=shot.pal.get("accent"), strength=0.20)
        elif name == "crt":
            effects.crt(frame, t)

    @staticmethod
    def _scale_sprite(spr: Raster, k: int) -> Raster:
        out = Raster(spr.w * k, spr.h * k)
        out.px = np.repeat(np.repeat(spr.px, k, axis=0), k, axis=1)
        return out

    # --- интерфейс ---------------------------------------------------------
    def render_ui(self, shot: Shot, t: float) -> Raster:
        ui = Raster(BASE_W, BASE_H)
        pal = shot.pal
        line = shot.active_line(t)
        if shot.letterbox:
            ui.rect(0, 0, BASE_W - 1, 9, pal.get("outline"))
            ui.rect(0, BASE_H - 10, BASE_W - 1, BASE_H - 1, pal.get("outline"))
        if line is None:
            return ui

        elapsed = t - line.t0
        box_col = pal.get("box", (16, 12, 24))
        border = pal.get("accent", (255, 208, 138))
        text_col = pal.get("text", (255, 245, 230))

        def band(x0, y0, x1, y1, dark=0.55):
            """Полупрозрачная подложка шахматкой: сохраняет пиксельность и читаемость."""
            for yy in range(max(0, y0), min(BASE_H, y1)):
                for xx in range(max(0, x0), min(BASE_W, x1)):
                    if (xx + yy) % 2 == 0:
                        ui.put(xx, yy, pal.get("outline"))

        if line.style == "subtitle":
            text = line.text
            maxw = BASE_W - 16
            rows = wrap_text(text, maxw)
            # печатная машинка
            shown = self._typewriter(rows, elapsed, cps=42)
            th = len(shown) * 9
            y = BASE_H - 14 - th
            widest = max((text_size(r)[0] for r in rows), default=0)
            if line.style == "subtitle":
                band((BASE_W - widest) // 2 - 4, y - 2, (BASE_W + widest) // 2 + 4, y + th + 2)
            for i, row in enumerate(shown):
                wrow, _ = text_size(row)
                draw_text(ui, (BASE_W - wrow) // 2, y + i * 9, row, text_col, outline=pal.get("outline"))
            return ui

        if line.style == "narration":
            rows = wrap_text(line.text, BASE_W - 24)
            shown = self._typewriter(rows, elapsed, cps=38)
            y0 = 22
            widest = max((text_size(r)[0] for r in rows), default=0)
            band((BASE_W - widest) // 2 - 4, y0 - 2, (BASE_W + widest) // 2 + 4, y0 + len(rows) * 10 + 2)
            for i, row in enumerate(shown):
                wrow, _ = text_size(row)
                draw_text(ui, (BASE_W - wrow) // 2, y0 + i * 10, row, pal.get("text"), outline=pal.get("outline"))
            return ui

        if line.style == "shout":
            rows = wrap_text(line.text, BASE_W - 20)
            shown = self._typewriter(rows, elapsed, cps=30)
            for i, row in enumerate(shown):
                wrow, _ = text_size(row, scale=1)
                draw_text(ui, (BASE_W - wrow) // 2, 20 + i * 12, row, pal.get("accent"),
                          outline=pal.get("outline"), scale=1)
            return ui

        # --- обычное диалоговое окно --------------------------------------
        bx0, bx1 = 5, BASE_W - 6
        by0, by1 = BASE_H - 36, BASE_H - 4
        ui.rect(bx0 + 1, by0 + 1, bx1 + 1, by1 + 1, pal.get("outline"))   # тень
        ui.rect(bx0, by0, bx1, by1, box_col)
        ui.rect(bx0, by0, bx1, by0, border)                               # верхняя кромка
        ui.rect(bx0, by1, bx1, by1, shade(border, 0.55))
        ui.rect(bx0, by0, bx0, by1, shade(border, 0.75))
        ui.rect(bx1, by0, bx1, by1, shade(border, 0.75))
        ui.put(bx0 + 1, by0 + 1, lighten(border, 1.2))

        # имя говорящего
        if line.who:
            nw, nh = text_size(line.who)
            tag_w = nw + 6
            tx = bx0 + 5
            ui.rect(tx, by0 - 9, tx + tag_w, by0 - 1, box_col)
            ui.rect(tx, by0 - 9, tx + tag_w, by0 - 9, border)
            ui.rect(tx, by0 - 1, tx + tag_w, by0 - 1, shade(border, 0.6))
            draw_text(ui, tx + 3, by0 - 8, line.who, border)

        rows = wrap_text(line.text, bx1 - bx0 - 10)[:3]
        shown = self._typewriter(rows, elapsed, cps=34)
        for i, row in enumerate(shown):
            draw_text(ui, bx0 + 5, by0 + 5 + i * 8, row, text_col)

        # индикатор «дальше»
        if (t * 2.4) % 1.0 < 0.6:
            ax = bx1 - 6
            ay = by1 - 5
            ui.rect(ax, ay, ax + 2, ay, border)
            ui.rect(ax + 1, ay + 1, ax + 1, ay + 1, border)
        return ui

    @staticmethod
    def _typewriter(rows: list[str], elapsed: float, cps: int = 36) -> list[str]:
        if elapsed < 0:
            return ["" for _ in rows]
        budget = int(max(0.0, elapsed) * cps)
        out = []
        for row in rows:
            if budget <= 0:
                out.append("")
                continue
            out.append(row[:budget])
            budget -= len(row)
        return out

    # --- финальный кадр ----------------------------------------------------
    def frame(self, shot: Shot, t: float) -> np.ndarray:
        world = self.render_world(shot, t)
        ui = self.render_ui(shot, t)
        if ui.mask.any():
            k = world.shape[0] // BASE_W
            ui_big = self._upscale(ui.px, k)
            m = ui_big[..., 3] > 0
            world[m] = ui_big[..., :3][m]
        # переходы
        if shot.trans_in > 0 and t < shot.trans_in:
            effects.fade_to_frame(world, shot.pal.bg, 1.0 - t / shot.trans_in)
        if shot.trans_out > 0 and t > shot.dur - shot.trans_out:
            effects.fade_to_frame(world, shot.pal.bg, (t - (shot.dur - shot.trans_out)) / shot.trans_out)
        return world


def _fade_to_frame(arr: np.ndarray, color, amount: float) -> None:
    amount = max(0.0, min(1.0, amount))
    if amount <= 0:
        return
    lum = np.array(color[:3], dtype=np.float32)
    arr[...] = (arr.astype(np.float32) * (1 - amount) + lum * amount).astype(np.uint8)


effects.fade_to_frame = _fade_to_frame
