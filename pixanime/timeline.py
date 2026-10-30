"""Монтаж: последовательность шотов -> поток кадров."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .effects import dither_dissolve
from .scene import Renderer, Shot


@dataclass
class Cue:
    """Шот + его место на общей шкале времени."""

    shot: Shot
    t_start: float

    @property
    def t_end(self) -> float:
        return self.t_start + self.shot.dur


class Timeline:
    def __init__(self, shots: list[Shot], fps: int = 12, out_w: int = 256, out_h: int = 256):
        self.fps = fps
        self.renderer = Renderer(out_w, out_h, fps)
        self.cues: list[Cue] = []
        t = 0.0
        for s in shots:
            self.cues.append(Cue(s, t))
            t += s.dur
        self.duration = t

    @property
    def n_frames(self) -> int:
        return int(round(self.duration * self.fps))

    def cue_at(self, t: float) -> tuple[Cue, float]:
        for c in self.cues:
            if c.t_start <= t < c.t_end:
                return c, t - c.t_start
        return self.cues[-1], min(self.cues[-1].shot.dur - 1e-3, self.cues[-1].shot.dur * 0.999)

    def frame(self, index: int) -> np.ndarray:
        t = index / self.fps
        cue, local = self.cue_at(t)
        img = self.renderer.frame(cue.shot, local)
        # «растворение» дизерингом на стыке шотов (12 кадров)
        nxt = self.cues[self.cues.index(cue) + 1] if cue in self.cues[:-1] else None
        if nxt is not None and cue.t_end - t < 0.25:
            amount = 1.0 - (cue.t_end - t) / 0.25
            nxt_img = self.renderer.frame(nxt.shot, t - nxt.t_start)
            img = dither_dissolve(img, nxt_img, amount)
        return img

    def frames(self):
        for i in range(self.n_frames):
            yield self.frame(i)

    def summary(self) -> str:
        rows = [f"длительность: {self.duration:.1f} c, кадров: {self.n_frames} @ {self.fps} fps"]
        for c in self.cues:
            rows.append(f"  [{c.t_start:6.1f} — {c.t_end:6.1f}] {c.shot.scene.name:<8} zoom={c.shot.zoom} fx={','.join(c.shot.fx) or '-'}")
        return "\n".join(rows)
