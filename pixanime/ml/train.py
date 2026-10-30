"""Обучение видео-диффузии (rectified flow) на клипах движка.

Запуск:  python -m pixanime.ml.train --steps 1200 --size 32
Всё считается на CPU за десятки минут — модель крошечная, но настоящая:
шум -> скорость потока -> Эйлер -> клип.
"""
from __future__ import annotations

import argparse
import os
import time

import numpy as np
import torch

from .data import build_dataset
from .model import TinyVideoUNet, to_model_space


class EMA:
    """Экспоненциальное усреднение весов: сэмплы становятся заметно чище,
    особенно когда шагов обучения мало."""

    def __init__(self, model, decay: float = 0.995):
        self.decay = decay
        self.shadow = {k: v.detach().clone().float() for k, v in model.state_dict().items()}

    @torch.no_grad()
    def update(self, model):
        for k, v in model.state_dict().items():
            self.shadow[k].mul_(self.decay).add_(v.detach().float(), alpha=1 - self.decay)

    def state_dict(self):
        return self.shadow


def save_loss_curve(losses: list[float], path: str) -> None:
    from PIL import Image, ImageDraw

    w, h = 480, 220
    img = Image.new("RGB", (w, h), (16, 14, 28))
    d = ImageDraw.Draw(img)
    if len(losses) > 1:
        mx, mn = max(losses), min(losses)
        span = max(1e-6, mx - mn)
        pts = [(int(i / (len(losses) - 1) * (w - 20)) + 10,
                int(h - 20 - (v - mn) / span * (h - 50))) for i, v in enumerate(losses)]
        d.line(pts, fill=(255, 208, 138), width=2)
        d.text((10, 6), f"loss {losses[-1]:.4f} (min {mn:.4f}, max {mx:.4f})", fill=(230, 240, 255))
    d.text((10, h - 16), f"steps: {len(losses)}", fill=(150, 160, 190))
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    img.save(path)


def train(
    steps: int = 1200,
    batch: int = 4,
    size: int = 32,
    frames: int = 8,
    base: int = 32,
    lr: float = 2e-4,
    out: str = "ckpt/pixvd.pt",
    seed: int = 0,
    log_every: int = 50,
    n_per_class: int = 110,
    save_every: int = 300,
    ema_decay: float = 0.995,
    resume: str | None = None,
) -> dict:
    torch.manual_seed(seed)
    np.random.seed(seed)
    torch.set_num_threads(max(1, os.cpu_count() or 1))

    print(f"[data] генерация клипов {size}x{size}x{frames} ...")
    t0 = time.time()
    clips, labels = build_dataset(n_per_class=n_per_class, frames=frames, size=size, seed=seed)
    print(f"[data] {len(clips)} клипов за {time.time()-t0:.1f} c")

    x_data = to_model_space(torch.from_numpy(clips).float().permute(0, 1, 4, 2, 3).contiguous())
    y_data = torch.from_numpy(labels)
    n_classes = int(y_data.max().item()) + 1

    model = TinyVideoUNet(in_ch=3, base=base, n_classes=n_classes)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"[model] параметров: {n_params/1e6:.2f} M")
    if resume and os.path.exists(resume):
        ck = torch.load(resume, map_location="cpu", weights_only=False)
        model.load_state_dict(ck["state_dict"])
        print(f"[resume] продолжили с {resume}")
    ema = EMA(model, ema_decay) if ema_decay > 0 else None

    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4, betas=(0.9, 0.99))
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda s: min(1.0, (s + 1) / 50) * (0.5 * (1 + np.cos(np.pi * min(1.0, s / max(1, steps)))))
    )

    losses: list[float] = []
    t_start = time.time()
    for step in range(1, steps + 1):
        idx = torch.randint(0, len(x_data), (batch,))
        x1 = x_data[idx]
        x0 = torch.randn_like(x1)
        t = torch.rand(batch)
        tt = t.view(batch, 1, 1, 1, 1)
        xt = (1 - tt) * x0 + tt * x1
        target = x1 - x0

        v = model(xt, t, y_data[idx])
        loss = torch.nn.functional.mse_loss(v, target)

        opt.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        sched.step()
        if ema is not None:
            ema.update(model)
        losses.append(float(loss.item()))

        if step % save_every == 0 and step < steps:
            torch.save({
                "state_dict": ema.state_dict() if ema is not None else model.state_dict(),
                "config": {"base": base, "n_classes": n_classes, "size": size, "frames": frames},
                "losses": losses,
            }, out)

        if step % log_every == 0 or step == 1:
            avg = float(np.mean(losses[-log_every:]))
            el = time.time() - t_start
            eta = el / step * (steps - step)
            print(f"  step {step:5d}/{steps}  loss {avg:.4f}  lr {sched.get_last_lr()[0]:.2e}  "
                  f"{el/step:.2f} с/шаг  осталось ~{eta/60:.1f} мин", flush=True)

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    torch.save({
        "state_dict": ema.state_dict() if ema is not None else model.state_dict(),
        "config": {"base": base, "n_classes": n_classes, "size": size, "frames": frames},
        "losses": losses,
    }, out)
    save_loss_curve(losses, os.path.splitext(out)[0] + "_loss.png")
    print(f"[done] {out} за {(time.time()-t_start)/60:.1f} мин")
    return {"model": model, "losses": losses, "config": {"base": base, "n_classes": n_classes}}


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="обучение видео-диффузии на клипах движка")
    p.add_argument("--steps", type=int, default=1200)
    p.add_argument("--batch", type=int, default=4)
    p.add_argument("--size", type=int, default=32)
    p.add_argument("--frames", type=int, default=8)
    p.add_argument("--base", type=int, default=32)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--out", default="ckpt/pixvd.pt")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--npk", type=int, default=110, help="клипов на класс")
    p.add_argument("--save-every", type=int, default=300)
    p.add_argument("--ema", type=float, default=0.995)
    p.add_argument("--resume", default=None)
    a = p.parse_args(argv)
    train(steps=a.steps, batch=a.batch, size=a.size, frames=a.frames, base=a.base,
          lr=a.lr, out=a.out, seed=a.seed, n_per_class=a.npk, save_every=a.save_every,
          ema_decay=a.ema, resume=a.resume)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
