"""Демонстрация нейросети: сравнение с движком, твины поз и кривая обучения."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image

from ..font import draw_text, text_size
from . import neural
from .char import Pose, render
from .rig import walk, run
from .neural import CAST, TH, TW, sample, sprite_array


class _R:
    def __init__(self, rgb):
        self.rgb = rgb

    def put(self, x, y, c):
        if 0 <= y < self.rgb.shape[0] and 0 <= x < self.rgb.shape[1]:
            self.rgb[y, x] = c


def _text(rgb, x, y, text, color=(246, 246, 250), outline=(18, 14, 26), scale=1):
    draw_text(_R(rgb), x, y, text, color, outline=outline, scale=scale)


def comparison(path: str = "showcase/s_neural.png", scale: int = 3) -> str:
    """Сверху — движок, снизу — сеть, слева направо разные позы и персонажи."""
    net, ck = neural.load("ckpt/hi_neural.pt")
    poses = [
        Pose(mouth_curve=0.4, blush=0.2),
        Pose(sh_r=1.9, el_r=0.6, mouth=0.7, mouth_curve=0.8, blush=0.5),
        Pose(hip_l=0.30, hip_r=-0.28, knee_l=-0.2, dy=4),
        Pose(blink=1, brow=0.6, mouth=0.5),
        Pose(spine=0.22, sh_l=-0.4, sh_r=-0.4, dy=8),
        Pose(hip_l=0.55, knee_l=-0.9, dy=12, spine=0.1),
    ]
    chars = [0, 1, 2, 3, 0, 2]
    pad = 6
    cell_w, cell_h = TW + pad, TH + pad + 14
    W = cell_w * len(poses) + pad
    H = (cell_h * 2) + 26
    canvas = np.zeros((H, W, 3), np.uint8)
    canvas[:] = (26, 22, 38)
    _text(canvas, 8, 6, "ДВИЖОК (правила)", (250, 226, 190), scale=2)
    _text(canvas, 8, cell_h + 18, "НЕЙРОСЕТЬ (поза -> спрайт)", (190, 226, 250), scale=2)
    for i, (p, ci) in enumerate(zip(poses, chars)):
        x = pad + i * cell_w
        eng = sprite_array(CAST[ci], p)
        _blit_rgba(canvas, eng, x, 22)
        out = sample(net, p, ci)
        _blit_rgba(canvas, out, x, cell_h + 34)
    img = np.repeat(np.repeat(canvas, scale, axis=0), scale, axis=1)
    Image.fromarray(img).save(path)
    return path


def _blit_rgba(canvas: np.ndarray, rgba: np.ndarray, x: int, y: int) -> None:
    h, w = rgba.shape[:2]
    y1, x1 = min(canvas.shape[0], y + h), min(canvas.shape[1], x + w)
    sub = rgba[: y1 - y, : x1 - x]
    m = sub[..., 3] > 100
    dst = canvas[y:y1, x:x1]
    dst[m] = sub[..., :3][m]


def tween_gif(path: str = "showcase/s_neural_tween.gif", n: int = 20, scale: int = 3,
              fps: int = 12) -> str:
    """Твин позы: сеть рисует промежуточные кадры между двумя ключами.

    Движку для этого нужны ключи и интерполяция углов; сеть делает это
    «своими руками» — и на промежуточных позах видно, что она обобщила.
    """
    net, _ = neural.load("ckpt/hi_neural.pt")
    a = neural.pose_vector(Pose(sh_r=0.15, el_r=0.2, mouth_curve=0.3))
    b = neural.pose_vector(Pose(sh_r=2.15, el_r=0.55, mouth=0.6, mouth_curve=0.8,
                                spine=0.05, head=0.08, blush=0.6))
    frames = []
    for k in range(n):
        t = k / (n - 1)
        v = a * (1 - t) + b * t
        pose = neural.vec_to_pose(v)
        rgba = sample(net, pose, 0)
        cell = np.zeros((TH + 8, TW + 8, 3), np.uint8)
        cell[:] = (26, 22, 38)
        _blit_rgba(cell, rgba, 4, 4)
        img = np.repeat(np.repeat(cell, scale, axis=0), scale, axis=1)
        frames.append(Image.fromarray(img))
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=int(1000 / fps),
                   loop=0, optimize=False)
    return path


def loss_plot(path: str = "showcase/s_neural_loss.png") -> str:
    ck = neural.load("ckpt/hi_neural.pt")[1]
    losses = np.array(ck["losses"], dtype=np.float32)
    # скользящее среднее
    k = 25
    smooth = np.convolve(losses, np.ones(k) / k, mode="valid")
    W, H = 640, 320
    img = np.zeros((H, W, 3), np.uint8)
    img[:] = (22, 20, 32)
    for gx in range(0, W, 64):
        img[:, gx:gx + 1] = (38, 34, 50)
    for gy in range(0, H, 32):
        img[gy:gy + 1, :] = (38, 34, 50)
    lo, hi = float(smooth.min()), float(smooth.max())
    pts = []
    for i, v in enumerate(smooth):
        x = int(i / max(1, len(smooth) - 1) * (W - 40)) + 20
        y = int(H - 30 - (v - lo) / max(1e-6, hi - lo) * (H - 70))
        pts.append((x, y))
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for s in range(n + 1):
            x = int(x0 + (x1 - x0) * s / n)
            y = int(y0 + (y1 - y0) * s / n)
            if 0 <= y < H - 1 and 0 <= x < W:
                img[y:y + 2, x:x + 2] = (250, 200, 120)
    _text(img, 20, 12, f"LOSSL1  {lo:.3f} -> {hi:.3f}", (240, 236, 250), scale=2)
    _text(img, 20, H - 22, f"{ck['steps']} STEPS  CPU", (180, 178, 200))
    Image.fromarray(img).save(path)
    return path


def build_all(log=print) -> dict:
    os.makedirs("showcase", exist_ok=True)
    out = {}
    log("сравнение с движком...")
    out["compare"] = comparison()
    log("кривая обучения...")
    out["loss"] = loss_plot()
    log("твин позы через сеть...")
    out["tween"] = tween_gif()
    return out


if __name__ == "__main__":
    print(build_all())
