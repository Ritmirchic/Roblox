"""Нейросеть: поза + персонаж -> спрайт 40x120.

Зачем: движок рисует по правилам, и его данные можно использовать как
«разметку» для модели. Модель учится не правилам, а распределению картинок,
поэтому умеет дорисовывать позы, которых в обучении не было (интерполяция
между ключами) — это и есть заявка на «нейросеть вместо художника».

Честная рамка: это регрессия (L1), не диффузия. На CPU за десятки минут
она даёт мягкие, но узнаваемые спрайты. Диффузия того же качества требует
GPU и часов — см. README.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass

import numpy as np

from .char import Look, Pose, render

TW, TH = 40, 120          # целевое разрешение спрайта
CROP_X, CROP_Y = 55, 32   # окно вырезания из кадра 150x160

# признаки позы (порядок важен: он же используется при сэмплинге)
POSE_FIELDS = [
    ("spine", 0.5), ("neck", 0.5), ("head", 0.5),
    ("sh_l", 3.0), ("el_l", 3.0), ("sh_r", 3.0), ("el_r", 3.0),
    ("hip_l", 0.8), ("knee_l", 1.2), ("hip_r", 0.8), ("knee_r", 1.2),
    ("leg_l", 0.5), ("leg_r", 0.5), ("dy", 40.0),
    ("blink", 1.0), ("brow", 1.0), ("mouth", 1.0), ("mouth_curve", 1.0),
    ("look_x", 1.0), ("look_y", 1.0), ("blush", 1.0), ("squash", 1.0),
]
N_POSE = len(POSE_FIELDS)
N_CHAR = 4

CAST = [
    Look(name="Аой", hair="long", outfit="sailor", accessory="hairpin"),
    Look(name="Мика", hair="twin", outfit="hoodie", accessory="ribbon",
         hair_color=(226, 164, 128), hair_light=(255, 226, 190), eye=(120, 196, 172),
         eye_dark=(38, 96, 88), cloth=(246, 232, 224), cloth_shade=(198, 176, 176),
         skirt=(96, 84, 120), skirt_shade=(70, 58, 94)),
    Look(name="Юки", hair="short", outfit="coat", hair_color=(72, 54, 44),
         hair_light=(146, 112, 86), eye=(150, 132, 210), eye_dark=(58, 48, 112),
         cloth=(228, 224, 212), cloth_shade=(178, 174, 164)),
    Look(name="Рен", hair="bob", outfit="sailor", height=1.04, hair_color=(40, 38, 48),
         hair_light=(104, 100, 118), eye=(232, 176, 96), eye_dark=(120, 76, 32)),
]


def pose_vector(p: Pose) -> np.ndarray:
    v = np.array([getattr(p, f) / s for f, s in POSE_FIELDS], dtype=np.float32)
    return np.clip(v, -1.5, 1.5)


def vec_to_pose(v: np.ndarray) -> Pose:
    p = Pose()
    for (f, s), x in zip(POSE_FIELDS, v):
        setattr(p, f, float(x) * s)
    return p


def random_pose(rng) -> Pose:
    """Правдоподобная случайная поза: углы вокруг нейтрали, без выворотов."""
    p = Pose()
    p.spine = rng.normal(0, 0.18)
    p.neck = rng.normal(0, 0.10)
    p.head = rng.normal(0, 0.16)
    for side in ("l", "r"):
        setattr(p, f"sh_{side}", rng.normal(0.15, 0.75))
        setattr(p, f"el_{side}", abs(rng.normal(0.25, 0.45)))
        setattr(p, f"hip_{side}", rng.normal(0, 0.30))
        setattr(p, f"knee_{side}", -abs(rng.normal(0.10, 0.35)))
        setattr(p, f"leg_{side}", 1.0 - abs(rng.normal(0.06, 0.12)))
    p.dy = rng.uniform(-3, 14)
    p.blink = 1.0 if rng.random() < 0.12 else 0.0
    p.brow = rng.normal(0, 0.5)
    p.mouth = float(rng.choice([0, 0, 0, 0.35, 0.7, 0.9]))
    p.mouth_curve = rng.normal(0.3, 0.6)
    p.look_x = rng.normal(0, 0.4)
    p.look_y = rng.normal(0, 0.3)
    p.blush = float(rng.uniform(-0.4, 1.0))
    p.squash = abs(rng.normal(0.05, 0.12))
    p.hair_swing = rng.normal(0, 1.5)
    p.skirt_swing = rng.normal(0, 1.2)
    return p


def sprite_array(look: Look, pose: Pose) -> np.ndarray:
    """RGBA 40x120 из движка: используется и для датасета, и для сравнения."""
    b = render(look, pose)
    crop = np.zeros((TH, TW, 4), dtype=np.uint8)
    ys = slice(CROP_Y, CROP_Y + TH)
    xs = slice(CROP_X, CROP_X + TW)
    crop[..., :3] = b.rgb[ys, xs]
    crop[..., 3] = b.mask.m[ys, xs] * 255
    return crop


def make_dataset(n_per_char: int, seed: int = 0, log=print):
    rng = np.random.default_rng(seed)
    poses, chars, imgs = [], [], []
    t0 = time.time()
    for ci, look in enumerate(CAST):
        for k in range(n_per_char):
            p = random_pose(rng)
            poses.append(pose_vector(p))
            chars.append(ci)
            imgs.append(sprite_array(look, p))
        log(f"  персонаж {look.name}: {n_per_char} кадров  ({time.time() - t0:.0f} с)")
    X = np.stack(poses)
    C = np.array(chars, dtype=np.int64)
    Y = np.stack(imgs).astype(np.float32) / 127.5 - 1.0
    return X, C, Y


# ---------------------------------------------------------------------------
def build_model():
    import torch
    import torch.nn as nn

    class Block(nn.Module):
        def __init__(self, cin: int, cout: int, emb: int):
            super().__init__()
            self.conv = nn.Conv2d(cin, cout, 3, padding=1)
            self.norm = nn.GroupNorm(8, cout)
            self.film = nn.Linear(emb, cout * 2)
            self.act = nn.SiLU()

        def forward(self, x, e):
            h = self.conv(x)
            h = self.norm(h)
            sc, sh = self.film(e)[..., None, None].chunk(2, dim=1)
            h = h * (1 + sc) + sh
            return self.act(h)

    class Gen(nn.Module):
        """Генератор: латент 15x5 -> 120x40 (HxW), обусловлен позой и персонажем."""

        def __init__(self, emb: int = 192):
            super().__init__()
            self.emb = emb
            self.pose_mlp = nn.Sequential(
                nn.Linear(N_POSE, 128), nn.SiLU(),
                nn.Linear(128, emb), nn.SiLU(),
            )
            self.char_emb = nn.Embedding(N_CHAR, emb)
            self.base = nn.Parameter(torch.randn(1, emb, 15, 5) * 0.5)   # H/8, W/8
            self.up1 = nn.Upsample(scale_factor=2, mode="nearest")
            self.b1 = Block(emb, 192, emb)
            self.b2 = Block(192, 128, emb)
            self.b3 = Block(128, 96, emb)
            self.b4 = Block(96, 64, emb)
            self.head = nn.Conv2d(64, 4, 3, padding=1)

        def forward(self, pose, cid):
            e = self.pose_mlp(pose) + self.char_emb(cid)
            x = self.base.expand(pose.shape[0], -1, -1, -1)
            x = self.b1(x, e)                       # 5x15
            x = self.b2(self.up1(x), e)             # 10x30
            x = self.b3(self.up1(x), e)             # 20x60
            x = self.b4(self.up1(x), e)             # 40x120
            return torch.tanh(self.head(x))

    return Gen()


def load(path: str = "ckpt/hi_neural.pt", device: str = "cpu"):
    import torch
    net = build_model().to(device)
    if os.path.exists(path):
        ck = torch.load(path, map_location=device, weights_only=False)
        net.load_state_dict(ck["model"])
        net.eval()
        return net, ck
    net.eval()
    return net, None


def sample(net, pose: Pose, char: int, device: str = "cpu") -> np.ndarray:
    """RGBA 40x120 (uint8) из обученной сети."""
    import torch
    with torch.no_grad():
        v = torch.from_numpy(pose_vector(pose))[None].to(device)
        c = torch.tensor([char], dtype=torch.long, device=device)
        out = net(v, c)[0].permute(1, 2, 0).cpu().numpy()
    rgba = np.clip((out + 1) * 127.5, 0, 255).astype(np.uint8)
    return rgba


def train(n_per_char: int = 420, steps: int = 2200, batch: int = 16, lr: float = 2e-3,
          seed: int = 0, out: str = "ckpt/hi_neural.pt", log=print, resume: str | None = None):
    import torch
    import torch.nn as nn

    torch.manual_seed(seed)
    log("готовлю датасет из движка...")
    X, C, Y = make_dataset(n_per_char, seed, log)
    Xt = torch.from_numpy(X)
    Ct = torch.from_numpy(C)
    Yt = torch.from_numpy(np.ascontiguousarray(Y.transpose(0, 3, 1, 2)))  # N,4,H,W
    log(f"датасет: {X.shape[0]} спрайтов {TW}x{TH}")

    net = build_model()
    if resume and os.path.exists(resume):
        ck = torch.load(resume, map_location="cpu", weights_only=False)
        net.load_state_dict(ck["model"])
        log(f"продолжаю с {resume}")
    ema = build_model()
    ema.load_state_dict(net.state_dict())
    for p in ema.parameters():
        p.requires_grad_(False)

    opt = torch.optim.AdamW(net.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=steps, pct_start=0.05)
    l1 = nn.L1Loss(reduction="none")
    rng = np.random.default_rng(seed + 1)
    n = X.shape[0]
    losses = []
    t0 = time.time()
    for step in range(1, steps + 1):
        idx = rng.integers(0, n, batch)
        xb, cb, yb = Xt[idx], Ct[idx], Yt[idx]
        pred = net(xb, cb)
        rgb = l1(pred[:, :3], yb[:, :3]).mean(1)
        alpha = l1(pred[:, 3:], yb[:, 3:]).mean(1)
        w = (yb[:, 3:4] * 0.5 + 0.5)                    # вес по непрозрачности
        loss = (rgb * w[:, 0]).mean() + 0.8 * alpha.mean()
        opt.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0)
        opt.step()
        sched.step()
        with torch.no_grad():
            for pe, pn in zip(ema.parameters(), net.parameters()):
                pe.mul_(0.996).add_(pn, alpha=0.004)
        losses.append(float(loss))
        if step % 200 == 0 or step == 1:
            log(f"  шаг {step}/{steps}  loss={np.mean(losses[-200:]):.4f}  "
                f"{time.time() - t0:.0f} с")
    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    torch.save({"model": ema.state_dict(), "losses": losses, "steps": steps,
                "pose_fields": POSE_FIELDS}, out)
    log(f"сохранено: {out}")
    return {"losses": losses, "path": out}


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="сеть «поза -> спрайт»")
    ap.add_argument("--train", action="store_true")
    ap.add_argument("--per-char", type=int, default=420)
    ap.add_argument("--steps", type=int, default=2000)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--out", default="ckpt/hi_neural.pt")
    ap.add_argument("--resume", default=None)
    a = ap.parse_args()
    if a.train:
        train(n_per_char=a.per_char, steps=a.steps, batch=a.batch, out=a.out, resume=a.resume)
