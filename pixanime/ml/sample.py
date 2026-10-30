"""Сэмплирование из обученной видео-диффузии: GIF, PNG-сетка, MP4."""
from __future__ import annotations

import os

import numpy as np
import torch

from ..encode import GIFWriter, MP4Writer
from .data import SCENE_CLASSES
from .model import TinyVideoUNet, from_model_space, sample


def load(path: str = "ckpt/pixvd.pt", device: str = "cpu"):
    ck = torch.load(path, map_location=device, weights_only=False)
    cfg = ck["config"]
    model = TinyVideoUNet(in_ch=3, base=cfg["base"], n_classes=cfg["n_classes"]).to(device)
    model.load_state_dict(ck["state_dict"])
    model.eval()
    return model, cfg


@torch.no_grad()
def generate(
    ckpt: str = "ckpt/pixvd.pt",
    cls: int = 0,
    n: int = 1,
    steps: int = 24,
    seed: int = 0,
    out: str = "out/ai_clip.gif",
    fps: int = 12,
    scale: int = 8,
    device: str = "cpu",
):
    model, cfg = load(ckpt, device)
    T, S = cfg["frames"], cfg["size"]
    labels = torch.full((n,), cls, dtype=torch.long, device=device)
    x = sample(model, labels, (n, T, 3, S, S), steps=steps, device=device, seed=seed)
    clips = from_model_space(x).permute(0, 1, 3, 4, 2).cpu().numpy()  # [n,T,S,S,3]

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    if out.endswith(".gif"):
        gw = GIFWriter(out, S * scale, S * scale, fps=fps)
        for t in range(T):
            frames = [clips[i, t] for i in range(n)]
            grid = np.concatenate([np.concatenate([np.repeat(np.repeat(f, scale, 0), scale, 1) for f in frames], axis=1)], axis=0)
            gw.write(grid)
        gw.close()
    elif out.endswith(".mp4"):
        w = MP4Writer(out, S * scale, S * scale, fps=fps)
        for t in range(T):
            row = np.concatenate([np.repeat(np.repeat(clips[i, t], scale, 0), scale, 1) for i in range(n)], axis=1)
            w.write(row)
        w.close()
    # PNG-сетка кадров
    from PIL import Image

    rows = []
    for i in range(n):
        row = np.concatenate([np.repeat(np.repeat(clips[i, t], scale, 0), scale, 1) for t in range(T)], axis=1)
        rows.append(row)
    grid = np.concatenate(rows, axis=0)
    png = os.path.splitext(out)[0] + ".png"
    Image.fromarray(grid).save(png)
    print(f"сэмплы: {out} и {png}  (класс: {SCENE_CLASSES[cls] if cls < len(SCENE_CLASSES) else cls})")
    return clips


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--ckpt", default="ckpt/pixvd.pt")
    p.add_argument("--cls", type=int, default=0)
    p.add_argument("--n", type=int, default=3)
    p.add_argument("--steps", type=int, default=24)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--out", default="out/ai_clip.gif")
    p.add_argument("--scale", type=int, default=8)
    a = p.parse_args()
    generate(a.ckpt, a.cls, a.n, a.steps, a.seed, a.out, scale=a.scale)


@torch.no_grad()
def denoise_trace(
    ckpt: str = "ckpt/pixvd.pt",
    cls: int = 0,
    seed: int = 0,
    steps: int = 32,
    snaps: int = 8,
    out: str = "showcase/ai_trace.png",
    scale: int = 6,
    device: str = "cpu",
):
    """Полоса «шум -> кадр»: промежуточные состояния потока.

    Лучше любого текста объясняет, что делает диффузия: на каждом шаге
    модель не «рисует», а сдвигает изображение вдоль поля скоростей.
    """
    from PIL import Image

    model, cfg = load(ckpt, device)
    T, S = cfg["frames"], cfg["size"]
    labels = torch.full((1,), cls, dtype=torch.long, device=device)
    g = torch.Generator(device=device).manual_seed(seed)
    x = torch.randn((1, T, 3, S, S), generator=g, device=device)
    dt = 1.0 / steps
    every = max(1, steps // snaps)
    frames = []
    for i in range(steps):
        if i % every == 0:
            frames.append(from_model_space(x)[0, T // 2].permute(1, 2, 0).cpu().numpy())
        t = torch.full((1,), i * dt, device=device)
        x = x + model(x, t, labels) * dt
    frames.append(from_model_space(x)[0, T // 2].permute(1, 2, 0).cpu().numpy())

    strip = np.concatenate([np.repeat(np.repeat(f, scale, 0), scale, 1) for f in frames[:snaps]], axis=1)
    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    Image.fromarray(strip).save(out)
    print(f"траектория денойзинга: {out}")
    return strip
