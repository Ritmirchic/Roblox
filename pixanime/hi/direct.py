"""Режиссёр: монтаж, диалоги с липсинком, звук и запись эпизода.

Эпизод — это список планов (`Beat`). Каждый план знает: фон, свет, кто в кадре,
как едет камера, что говорят и сколько это длится. Дальше всё детерминировано:
один и тот же эпизод рендерится в один и тот же файл.
"""
from __future__ import annotations

import math
import os
from dataclasses import dataclass, field

import numpy as np

from ..audio import Track, make_soundtrack, make_stinger
from ..encode import GIFWriter, MP4Writer, mux_audio
from . import bg as BG
from .char import Look, Pose
from .film import Actor, Cam, Shot, annotate, render_shot
from .rig import Clip, blinks, idle, lipsync
from .rig import run as run_cycle
from .rig import walk as walk_cycle

FPS = 12


@dataclass
class Beat:
    """Один план эпизода."""

    kind: str
    light: str
    seconds: float = 3.0
    who: list = field(default_factory=list)     # индексы персонажей каста
    look: list = field(default_factory=list)    # позы: idle/walk/run/sit/wave/jump
    x: list = field(default_factory=list)       # позиции по x (в пикселях сцены)
    y: list = field(default_factory=list)       # линия пола
    depth: list = field(default_factory=list)
    flip: list = field(default_factory=list)
    cam: tuple = (Cam(), Cam())                 # от/до
    say: str = ""
    speaker: int = 0
    title: str = ""
    overlay: str = ""
    weather: str = ""
    seed: int = 0
    pan: float = 0.0

    @property
    def frames(self) -> int:
        return max(1, int(round(self.seconds * FPS)))


def _clip_for(style: str, frames: int, pose: Pose | None = None) -> Clip:
    if style == "walk":
        poses = [walk_cycle(i / 10) for i in range(10)]
        poses = Clip(poses).poses
    elif style == "run":
        poses = [run_cycle(i / 8) for i in range(8)]
    elif style == "sit":
        poses = [pose or Pose()]
    elif style == "wave":
        from .rig import wave
        poses = [wave(i / 8) for i in range(8)]
    elif style == "jump":
        from .rig import jump, head_lag, secondary
        poses = head_lag(secondary([jump(i / frames) for i in range(frames)]))
    else:
        poses = [idle((i / FPS) * 0.9 + len(style) * 0.3) for i in range(max(frames, 24))]
    bl = blinks(len(poses), FPS, seed=abs(hash(style)) % 1000)
    for p, b in zip(poses, bl):
        p.blink = max(p.blink, b)
    return Clip(poses, FPS, style)


def build_shot(beat: Beat, cast: dict, base_pose: dict | None = None) -> Shot:
    actors = []
    frames = beat.frames
    for idx, bid in enumerate(beat.who):
        look = cast[bid]
        style = beat.look[idx] if idx < len(beat.look) else "idle"
        pose = (base_pose or {}).get(bid)
        clip = _clip_for(style, frames, pose)
        if beat.say and idx == beat.speaker:
            mouth = lipsync(beat.say, frames, FPS)
            for p, m in zip(clip.poses, mouth):
                p.mouth = max(p.mouth, m)
                p.mouth_curve = 0.35
        actors.append(Actor(
            look=look, clip=clip,
            x=beat.x[idx] if idx < len(beat.x) else BG.W / 2,
            y=beat.y[idx] if idx < len(beat.y) else 118,
            depth=beat.depth[idx] if idx < len(beat.depth) else 0.0,
            flip=beat.flip[idx] if idx < len(beat.flip) else False,
        ))
    return Shot(kind=beat.kind, light=beat.light, frames=frames,
                cam_from=beat.cam[0], cam_to=beat.cam[1], actors=actors,
                say=beat.say, title=beat.title, overlay=beat.overlay,
                seed=beat.seed, pan=beat.pan, weather=beat.weather,
                grain=0.045)


# ---------------------------------------------------------------------------
# звук
# ---------------------------------------------------------------------------
def build_audio(ep, total: float, path: str, mood: str = "dusk") -> str:
    """Чиптюн-подложка + стингеры на склейках."""
    tr = make_soundtrack(total, seed=ep.seed, mood=mood, tempo=84.0)
    t = 0.0
    for b in ep.beats:
        if b.overlay in ("flash", "fade_in") and t > 0.4:
            sting = make_stinger("reveal", seed=b.seed)
            tr.add(sting * 0.45, t)
            break
        t += b.seconds
    tr.write(path)
    return path


# ---------------------------------------------------------------------------
def render_episode(ep, cast: dict, out_dir: str, scale: int = 2, gif_seconds: float | None = 2.0,
                   audio: bool = True, log=print) -> dict:
    """Отрендерить эпизод целиком: mp4 (+ GIF-выдержка)."""
    os.makedirs(out_dir, exist_ok=True)
    total_frames = sum(b.frames for b in ep.beats)
    video_path = os.path.join(out_dir, f"{ep.slug}.mp4")
    w, h = BG.W * scale, BG.H * scale
    writer = MP4Writer(video_path, w, h, fps=FPS, crf=18)
    gif = GIFWriter(os.path.join(out_dir, f"{ep.slug}_excerpt.gif"), w, h, fps=FPS) if gif_seconds else None
    gif_left = int(gif_seconds * FPS) if gif else 0

    done = 0
    for bi, beat in enumerate(ep.beats):
        shot = build_shot(beat, cast, ep.poses)
        for frame in render_shot(shot, text=False):
            big = np.repeat(np.repeat(frame.rgb, scale, axis=0), scale, axis=1)
            big = annotate(big, beat.say, beat.title, scale=max(2, scale // 2 + 1))
            writer.write(big)
            if gif and gif_left > 0 and bi == ep.gif_beat:
                gif.write(big)
                gif_left -= 1
            done += 1
        log(f"  план {bi + 1}/{len(ep.beats)}: {beat.kind}/{beat.light}  {done}/{total_frames}")
    writer.close()
    if gif:
        gif.close()

    res = {"video": video_path, "frames": total_frames, "seconds": total_frames / FPS}
    if audio:
        wav = os.path.join(out_dir, f"{ep.slug}.wav")
        try:
            build_audio(ep, res["seconds"], wav, ep.mood)
            final = os.path.join(out_dir, f"{ep.slug}_sound.mp4")
            mux_audio(video_path, wav, final)
            res["with_audio"] = final
        except Exception as exc:            # звук не должен ронять картинку
            log(f"  звук пропущен: {exc}")
    return res


@dataclass
class Episode:
    slug: str
    title: str
    beats: list
    seed: int = 1
    mood: str = "dusk"
    gif_beat: int = 1
    poses: dict = field(default_factory=dict)
