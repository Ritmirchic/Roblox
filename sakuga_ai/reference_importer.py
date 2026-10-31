from __future__ import annotations

import base64
import io
import json
import re
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from .engine import BASE_H, BASE_W, CLIP_FRAMES, REPO_ROOT, SakugaEngine
from .prompt_parser import parse_prompt_to_spec_and_tokens, spec_to_bilingual_tokens


def fetch_github_bytes(url: str) -> bytes:
    """
    Fetch binary anime reference file (GIF/APNG/PNG/JPG) from github.com / api.github.com.
    Automatically converts github.com/<owner>/<repo>/blob/<ref>/<path> via api.github.com contents API!
    """
    u = url.strip()
    m = re.match(r"^https?://github\.com/([^/]+)/([^/]+)/(?:blob|raw)/(?:refs/heads/)?([^/]+)/(.+)$", u)
    if m:
        owner, repo, ref, fpath = m.group(1), m.group(2), m.group(3), m.group(4)
        fpath = fpath.split("?")[0]
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{fpath}?ref={ref}"
        req = urllib.request.Request(
            api_url,
            headers={"Accept": "application/vnd.github.v3.raw", "User-Agent": "SAKUGA-256-Importer"},
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read()

    if any(h in u for h in ("github.com/", "api.github.com/", "codeload.github.com/")):
        req = urllib.request.Request(u, headers={"User-Agent": "SAKUGA-256-Importer"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read()

    raise ValueError(
        "Прямой сетевой доступ песочницы открыт только к github.com. "
        "Пожалуйста, загрузите файл (GIF / PNG / JPG / WebP) напрямую через кнопку выбора файла или прикрепите в чат, либо укажите ссылку на GitHub!"
    )


def _crop_and_pixelize_128(img: Image.Image) -> np.ndarray:
    """Center-crop RGB image to square, enhance crisp anime ink edges & saturation, resize to 128x128."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    sq = rgb.crop((left, top, left + side, top + side))

    # Boost anime color vibrancy & ink edge contrast slightly before downsampling to 128x128
    sq = ImageEnhance.Color(sq).enhance(1.18)
    sq = ImageEnhance.Contrast(sq).enhance(1.12)
    resized = sq.resize((BASE_W, BASE_H), Image.Resampling.BILINEAR)
    resized = resized.filter(ImageFilter.UnsharpMask(radius=0.9, percent=110, threshold=3))
    return np.asarray(resized, dtype=np.uint8)


def extract_16frame_clips_from_bytes(raw_bytes: bytes, max_clips: int = 8) -> List[np.ndarray]:
    """
    Decode animated GIF / APNG / WebP, horizontal sprite strip, or static anime keyframe
    into one or more [16, 128, 128, 3] RGB888 clips!
    """
    im = Image.open(io.BytesIO(raw_bytes))
    n_frames = getattr(im, "n_frames", 1)

    frames_128: List[np.ndarray] = []
    if n_frames > 1:
        for fi in range(min(n_frames, max_clips * CLIP_FRAMES)):
            im.seek(fi)
            frames_128.append(_crop_and_pixelize_128(im.copy()))
    else:
        rgb = im.convert("RGB")
        w, h = rgb.size
        # Check if horizontal sprite strip (e.g. 4..16 frames side by side)
        if w >= h * 2 and (w // h) >= 2:
            num_tiles = min(32, w // h)
            tile_w = w // num_tiles
            for ti in range(num_tiles):
                tile = rgb.crop((ti * tile_w, 0, (ti + 1) * tile_w, h))
                frames_128.append(_crop_and_pixelize_128(tile))
        else:
            # Single static anime keyframe -> synthesize subtle 16-frame anime camera pan / breathe!
            side = min(w, h)
            pad = max(0, int(side * 0.06))
            crop_s = max(16, side - 2 * pad)
            cx0 = (w - side) // 2 + pad
            cy0 = (h - side) // 2 + pad
            for f in range(CLIP_FRAMES):
                shift_x = int(round(np.sin(f * 2 * np.pi / CLIP_FRAMES) * pad * 0.7))
                shift_y = int(round(np.cos(f * 2 * np.pi / CLIP_FRAMES) * pad * 0.35))
                x0 = max(0, min(w - crop_s, cx0 + shift_x))
                y0 = max(0, min(h - crop_s, cy0 + shift_y))
                sub = rgb.crop((x0, y0, x0 + crop_s, y0 + crop_s))
                frames_128.append(_crop_and_pixelize_128(sub))

    if not frames_128:
        raise ValueError("Не удалось извлечь кадры из изображения/анимации.")

    # Resample or chunk into exact 16-frame clips
    clips: List[np.ndarray] = []
    if len(frames_128) < CLIP_FRAMES:
        idxs = np.linspace(0, len(frames_128) - 1, CLIP_FRAMES).round().astype(int)
        clips.append(np.stack([frames_128[i] for i in idxs], axis=0))
    else:
        num_full = min(max_clips, len(frames_128) // CLIP_FRAMES)
        for ci in range(num_full):
            chunk = frames_128[ci * CLIP_FRAMES : (ci + 1) * CLIP_FRAMES]
            clips.append(np.stack(chunk, axis=0))

    return clips


def train_on_concrete_reference(
    engine: SakugaEngine,
    raw_bytes: bytes,
    prompt: str,
    vae_steps: int = 45,
    dit_steps: int = 120,
    lr_dit: float = 4.5e-4,
    ckpt_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Quantize concrete anime reference clips into 128x128 48-palette indices, inject into C++ engine,
    and run live VAE + SakugaDiT gradient descent steps on them!
    """
    t0 = time.perf_counter()
    clips_rgb128 = extract_16frame_clips_from_bytes(raw_bytes, max_clips=6)
    m = len(clips_rgb128)

    spec_base, _ = parse_prompt_to_spec_and_tokens(prompt)
    indices_list = []
    specs_list = []
    words_list = []
    prev_rel = []

    for ci, clip_rgb in enumerate(clips_rgb128):
        idx128 = engine.quantize_rgb128(clip_rgb)
        indices_list.append(idx128)
        sp9 = [
            spec_base["hero_id"],
            spec_base["scene_id"],
            spec_base["time_id"],
            spec_base["framing_id"],
            spec_base["action_id"],
            spec_base["camera_id"],
            spec_base["fx_id"],
            ci,
            100 + ci,
        ]
        specs_list.append(sp9)
        words_list.append(spec_to_bilingual_tokens(spec_base))
        prev_rel.append(ci - 1 if ci > 0 else -1)

    clips_idx_arr = np.stack(indices_list, axis=0)
    total_ds = engine.append_custom_clips(
        clips_idx_arr,
        np.array(specs_list, dtype=np.int32),
        np.array(words_list, dtype=np.int32),
        np.array(prev_rel, dtype=np.int32),
        clear_existing=False,
        repeat_weight=8,
    )

    vae_acc_end = None
    if vae_steps > 0:
        _, vac = engine.train_vae(
            num_steps=vae_steps,
            batch_size=1,
            lr_max=8e-4,
            lr_min=1.5e-4,
            latent_noise_std=0.01,
        )
        vae_acc_end = round(float(vac[-min(10, len(vac)):].mean()) * 100.0, 2)

    engine.encode_dataset_latents()
    dls = engine.train_dit(
        num_steps=dit_steps,
        batch_size=2,
        lr_max=lr_dit,
        lr_min=lr_dit * 0.25,
        cfg_drop_prob=0.10,
    )

    if ckpt_path is not None:
        engine.save_checkpoint(ckpt_path)

    # Render preview of quantized concrete example frame so user sees how AI perceived it!
    pal = engine.get_palette_rgb()
    sample_idx = indices_list[0][8]
    q_rgb128 = pal[sample_idx]
    q_img256 = Image.fromarray(q_rgb128, mode="RGB").resize((256, 256), Image.Resampling.NEAREST)
    buf = io.BytesIO()
    q_img256.save(buf, format="PNG")
    preview_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    return {
        "imported_clips": m,
        "imported_frames": m * CLIP_FRAMES,
        "dataset_total_clips": total_ds,
        "vae_acc_pct": vae_acc_end,
        "dit_loss_start": round(float(dls[:min(10, len(dls))].mean()), 5),
        "dit_loss_end": round(float(dls[-min(10, len(dls)):].mean()), 5),
        "elapsed_sec": round(time.perf_counter() - t0, 2),
        "quantized_preview_DataUrl": preview_b64,
        "parsed_spec": spec_base,
        "stats": engine.stats(),
    }
