"""Крошечная видео-диффузия: flow matching + пространственно-временной UNet.

Архитектура нарочно «как у больших», но в масштабе игрушки:

    [B,T,3,H,W] -> patch-embed (conv2d, общий вес по времени)
               -> вниз (stride 2) x2
               -> блок с temporal attention (внимание между кадрами)
               -> вверх со skip-соединениями
               -> [B,T,3,H,W] (поле скоростей потока)

Обучение — rectified flow: шум и данные соединяются прямой, модель предсказывает
скорость переноса. На инференсе 16-32 шага Эйлера вместо 1000 шагов DDPM.
"""
from __future__ import annotations

import math

import torch
import torch.nn as nn
import torch.nn.functional as F


def timestep_embedding(t: torch.Tensor, dim: int, max_period: float = 10000.0) -> torch.Tensor:
    half = dim // 2
    freqs = torch.exp(-math.log(max_period) * torch.arange(half, device=t.device, dtype=torch.float32) / half)
    args = t.float()[:, None] * freqs[None]
    return torch.cat([torch.cos(args), torch.sin(args)], dim=-1)


class TemporalAttention(nn.Module):
    """Внимание только по оси времени: каждая точка кадра смотрит на ту же точку
    в других кадрах. Это дёшево и как раз отвечает за согласованность движения."""

    def __init__(self, dim: int, heads: int = 4):
        super().__init__()
        self.heads = heads
        self.norm = nn.GroupNorm(8, dim)
        self.qkv = nn.Conv2d(dim, dim * 3, 1)
        self.proj = nn.Conv2d(dim, dim, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, t, c, h, w = x.shape
        y = self.norm(x.reshape(b * t, c, h, w))
        q, k, v = self.qkv(y).chunk(3, dim=1)
        # [B*T, C, H*W] -> [B, T, HW, C]
        q = q.view(b, t, c, h * w).permute(0, 3, 1, 2)
        k = k.view(b, t, c, h * w).permute(0, 3, 1, 2)
        v = v.view(b, t, c, h * w).permute(0, 3, 1, 2)
        out = F.scaled_dot_product_attention(q, k, v)  # внимание по T
        out = out.permute(0, 2, 3, 1).reshape(b * t, c, h, w)
        return x + self.proj(out).view(b, t, c, h, w)


class ResBlock(nn.Module):
    def __init__(self, cin: int, cout: int, cond: int, temb: int):
        super().__init__()
        self.norm1 = nn.GroupNorm(8, cin)
        self.conv1 = nn.Conv2d(cin, cout, 3, padding=1)
        self.emb = nn.Linear(temb, cout)
        self.cls = nn.Linear(cond, cout)
        self.norm2 = nn.GroupNorm(8, cout)
        self.conv2 = nn.Conv2d(cout, cout, 3, padding=1)
        self.skip = nn.Conv2d(cin, cout, 1) if cin != cout else nn.Identity()

    def forward(self, x, temb, cemb):
        h = self.conv1(F.silu(self.norm1(x)))
        h = h + self.emb(temb)[:, :, None, None] + self.cls(cemb)[:, :, None, None]
        h = self.conv2(F.silu(self.norm2(h)))
        return h + self.skip(x)


class TinyVideoUNet(nn.Module):
    def __init__(self, in_ch: int = 3, base: int = 48, n_blocks: int = 2, n_classes: int = 8, temb: int = 96):
        super().__init__()
        self.temb_dim = temb
        self.n_classes = n_classes
        self.conv_in = nn.Conv2d(in_ch, base, 3, padding=1)
        self.temb_mlp = nn.Sequential(nn.Linear(temb, temb * 2), nn.SiLU(), nn.Linear(temb * 2, temb))
        self.cemb = nn.Embedding(n_classes, temb)

        d1 = base * 2
        d2 = base * 3
        self.down1 = nn.ModuleList([ResBlock(base if i == 0 else d1, d1, temb, temb) for i in range(n_blocks)])
        self.downsample1 = nn.Conv2d(d1, d1, 3, stride=2, padding=1)
        self.down2 = nn.ModuleList([ResBlock(d1 if i == 0 else d2, d2, temb, temb) for i in range(n_blocks)])
        self.downsample2 = nn.Conv2d(d2, d2, 3, stride=2, padding=1)

        self.mid1 = ResBlock(d2, d2, temb, temb)
        self.mid_attn = TemporalAttention(d2, heads=4)
        self.mid2 = ResBlock(d2, d2, temb, temb)

        self.up1 = nn.ConvTranspose2d(d2, d1, 4, stride=2, padding=1)
        self.up1_blocks = nn.ModuleList([ResBlock(d1 + d2 if i == 0 else d1, d1, temb, temb) for i in range(n_blocks)])
        self.up2 = nn.ConvTranspose2d(d1, base, 4, stride=2, padding=1)
        self.up2_blocks = nn.ModuleList([ResBlock(base + d1 if i == 0 else base, base, temb, temb) for i in range(n_blocks)])

        self.norm_out = nn.GroupNorm(8, base)
        self.conv_out = nn.Conv2d(base, in_ch, 3, padding=1)

    def _run_blocks(self, blocks, x, temb, cemb):
        for blk in blocks:
            x = blk(x, temb, cemb)
        return x

    def forward(self, x: torch.Tensor, t: torch.Tensor, cls: torch.Tensor) -> torch.Tensor:
        """x: [B,T,3,H,W], t: [B] в [0,1], cls: [B]."""
        b, T, C, H, W = x.shape
        flat = x.reshape(b * T, C, H, W)
        temb = self.temb_mlp(timestep_embedding(t, self.temb_dim))
        cemb = self.cemb(cls)
        # дублируем кондиционирование на все кадры
        temb = temb.repeat_interleave(T, dim=0)
        cemb = cemb.repeat_interleave(T, dim=0)

        h0 = self.conv_in(flat)
        h1 = self._run_blocks(self.down1, h0, temb, cemb)
        h2 = self.downsample1(h1)
        h3 = self._run_blocks(self.down2, h2, temb, cemb)
        h4 = self.downsample2(h3)

        def to_bt(z):
            return z.view(b, T, z.shape[1], z.shape[2], z.shape[3])

        def to_flat(z):
            return z.reshape(b * T, z.shape[2], z.shape[3], z.shape[4])

        m = self.mid1(h4, temb, cemb)
        m = self.mid_attn(to_bt(m))
        m = self.mid2(to_flat(m), temb, cemb)

        u1 = self.up1(m)
        u1 = torch.cat([u1, h3], dim=1)
        u1 = self._run_blocks(self.up1_blocks, u1, temb, cemb)
        u2 = self.up2(u1)
        u2 = torch.cat([u2, h1], dim=1)
        u2 = self._run_blocks(self.up2_blocks, u2, temb, cemb)
        out = self.conv_out(F.silu(self.norm_out(u2)))
        return out.view(b, T, C, H, W)


# ---------------------------------------------------------------------------
# flow matching
# ---------------------------------------------------------------------------
def to_model_space(clip: torch.Tensor) -> torch.Tensor:
    """[..,3,H,W] uint8/float 0..255 -> [-1,1]"""
    return clip / 127.5 - 1.0


def from_model_space(x: torch.Tensor) -> torch.Tensor:
    return ((x.clamp(-1, 1) + 1) * 127.5).clamp(0, 255).to(torch.uint8)


@torch.no_grad()
def sample(model: TinyVideoUNet, cls: torch.Tensor, shape, steps: int = 24, device="cpu", seed: int = 0):
    """Эйлерово интегрирование потока: шум -> данные."""
    g = torch.Generator(device=device).manual_seed(seed)
    x = torch.randn(shape, generator=g, device=device)
    dt = 1.0 / steps
    for i in range(steps):
        t = torch.full((shape[0],), i * dt, device=device)
        v = model(x, t, cls)
        x = x + v * dt
    return x
