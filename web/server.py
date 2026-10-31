from __future__ import annotations

import base64
import io
import json
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel, Field

from sakuga_ai.director import EpisodeDirector
from sakuga_ai.engine import REPO_ROOT, SakugaEngine
from sakuga_ai.prompt_parser import (
    ACTIONS,
    CAMERAS,
    FRAMINGS,
    HEROES,
    SCENES,
    TIMES,
    WEATHER_FX,
    parse_prompt_to_spec_and_tokens,
)
from sakuga_ai.train_pipeline import (
    DEFAULT_CKPT,
    DEFAULT_METRICS,
    build_balanced_anime_dataset,
    downsample_curve,
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
OUTPUTS_DIR = REPO_ROOT / "outputs"
JOBS_DIR = OUTPUTS_DIR / "jobs"
SHOWCASE_DIR = OUTPUTS_DIR / "showcase"

JOBS_DIR.mkdir(parents=True, exist_ok=True)
SHOWCASE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SAKUGA-256 Neural Pixel-Art Anime Video Studio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread lock guarding C++ engine context across requests
_engine_lock = threading.Lock()
_engine = SakugaEngine(seed=2026, checkpoint_path=DEFAULT_CKPT)
_director = EpisodeDirector(_engine)

# In-memory continuation session cache: session_id -> {"frames": ndarray, "last_latent": ndarray, "shots": list}
_lab_sessions: Dict[str, Dict[str, Any]] = {}


class EpisodeRequest(BaseModel):
    title: str = Field(default="EP.01 КЛЯТВА САКУРЫ")
    synopsis: str = Field(
        default="Алая мечница Аканэ встречает теневого ронина Куро у Храма Сакуры на закате и наносит удар полумесяцем"
    )
    num_shots: int = Field(default=6, ge=2, le=12)
    fps: int = Field(default=10, ge=6, le=16)
    ode_steps: int = Field(default=16, ge=6, le=40)
    cfg_scale: float = Field(default=1.45, ge=1.0, le=3.0)
    solver: str = Field(default="heun")
    use_scale2x: bool = Field(default=True)
    subtitles: bool = Field(default=True)
    hero_override: Optional[int] = Field(default=None)
    scene_override: Optional[int] = Field(default=None)
    time_override: Optional[int] = Field(default=None)
    seed: int = Field(default=2026)


class LabShotRequest(BaseModel):
    prompt: str = Field(default="Алая мечница Аканэ наносит сакуга удар катаной у Храма Сакуры на закате")
    session_id: Optional[str] = Field(default=None)
    continue_from_prev: bool = Field(default=False)
    hero_id: Optional[int] = Field(default=None)
    scene_id: Optional[int] = Field(default=None)
    time_id: Optional[int] = Field(default=None)
    framing_id: Optional[int] = Field(default=None)
    action_id: Optional[int] = Field(default=None)
    camera_id: Optional[int] = Field(default=None)
    fx_id: Optional[int] = Field(default=None)
    ode_steps: int = Field(default=16, ge=4, le=40)
    cfg_scale: float = Field(default=1.45, ge=1.0, le=3.0)
    solver: str = Field(default="heun")
    use_scale2x: bool = Field(default=True)
    fps: int = Field(default=10, ge=6, le=16)
    seed: int = Field(default=2026)


class FineTuneRequest(BaseModel):
    dit_steps: int = Field(default=80, ge=10, le=300)
    lr: float = Field(default=4e-4, ge=5e-5, le=2e-3)


def _img_to_data_url(rgb: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(rgb, mode="RGB").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _render_attention_heatmap(attn: np.ndarray) -> str:
    # attn is [128, 144]; downsample/visualize cleanly as vibrant magma-like RGB image
    a = attn.copy()
    a = (a - a.min()) / (a.max() - a.min() + 1e-8)
    a = np.power(a, 0.45)  # boost subtle off-diagonal spacetime correlations
    h, w = a.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    rgb[..., 0] = np.clip(a * 255.0 * 1.25, 18, 255).astype(np.uint8)
    rgb[..., 1] = np.clip(np.power(a, 1.5) * 230.0, 16, 255).astype(np.uint8)
    rgb[..., 2] = np.clip((0.35 + 0.65 * np.sin(a * 3.14)) * 210.0 * (0.25 + 0.75 * a), 28, 255).astype(np.uint8)
    # Highlight vertical boundary at column 16 separating z_prev(t=0) from current clip(t=1..8)
    if w > 16:
        rgb[:, 16, :] = [62, 212, 255]
    return _img_to_data_url(rgb)


def _attach_urls(ep_meta: Dict[str, Any], rel_prefix: str) -> Dict[str, Any]:
    out = dict(ep_meta)
    files = ep_meta.get("files", {})
    out["urls"] = {k: f"/media/{rel_prefix}/{v}" for k, v in files.items()}
    sb = []
    for sh in ep_meta.get("storyboard", []):
        s2 = dict(sh)
        if "keyframe_file" in s2:
            s2["keyframe_url"] = f"/media/{rel_prefix}/{s2['keyframe_file']}"
        sb.append(s2)
    out["storyboard"] = sb
    out["denoise_urls"] = [f"/media/{rel_prefix}/{fn}" for fn in ep_meta.get("denoise_snapshots", [])]
    return out


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    return HTMLResponse((STATIC_DIR / "index.html").read_text(encoding="utf-8"))


@app.get("/api/info")
def api_info() -> Dict[str, Any]:
    with _engine_lock:
        stats = _engine.stats()
        pal = _engine.get_palette_rgb().tolist()

    metrics = {}
    if DEFAULT_METRICS.exists():
        metrics = json.loads(DEFAULT_METRICS.read_text(encoding="utf-8"))

    # Load pre-generated showcase episodes if available
    showcases = []
    for folder in sorted(SHOWCASE_DIR.iterdir()):
        meta_file = folder / "meta.json"
        if folder.is_dir() and meta_file.exists():
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            showcases.append(_attach_urls(meta, f"showcase/{folder.name}"))

    return {
        "stats": stats,
        "palette": [f"rgb({r},{g},{b})" for r, g, b in pal],
        "palette_hex": [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in pal],
        "metrics": metrics,
        "catalog": {
            "heroes": HEROES,
            "scenes": SCENES,
            "times": TIMES,
            "framings": FRAMINGS,
            "actions": ACTIONS,
            "cameras": CAMERAS,
            "fx": WEATHER_FX,
        },
        "showcases": showcases,
    }


@app.post("/api/generate_episode")
def api_generate_episode(req: EpisodeRequest) -> Dict[str, Any]:
    job_id = f"ep_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    job_dir = JOBS_DIR / job_id

    with _engine_lock:
        meta = _director.generate_episode(
            title=req.title,
            synopsis=req.synopsis,
            output_dir=job_dir,
            num_shots=req.num_shots,
            fps=req.fps,
            ode_steps=req.ode_steps,
            cfg_scale=req.cfg_scale,
            solver=req.solver,
            use_scale2x=req.use_scale2x,
            subtitles=req.subtitles,
            hero_override=req.hero_override,
            scene_override=req.scene_override,
            time_override=req.time_override,
            seed=req.seed,
        )

    (job_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return _attach_urls(meta, f"jobs/{job_id}")


@app.post("/api/generate_shot")
def api_generate_shot(req: LabShotRequest) -> Dict[str, Any]:
    overrides = {
        "hero_id": req.hero_id,
        "scene_id": req.scene_id,
        "time_id": req.time_id,
        "framing_id": req.framing_id,
        "action_id": req.action_id,
        "camera_id": req.camera_id,
        "fx_id": req.fx_id,
    }
    spec, tokens = parse_prompt_to_spec_and_tokens(req.prompt, overrides=overrides, default_seed=req.seed)

    sess_id = req.session_id or f"lab_{uuid.uuid4().hex[:8]}"
    z_prev = None
    prev_frames = None
    prev_actions: List[int] = []
    prev_fx: List[int] = []
    prev_mood: List[int] = []

    if req.continue_from_prev and sess_id in _lab_sessions:
        sess = _lab_sessions[sess_id]
        z_prev = sess["last_latent"]
        prev_frames = sess["frames"]
        prev_actions = list(sess["actions"])
        prev_fx = list(sess["fx"])
        prev_mood = list(sess["mood"])
        spec["part_idx"] = len(prev_actions)

    t0 = time.perf_counter()
    with _engine_lock:
        res = _engine.generate_shot(
            spec_dict=spec,
            word_ids5=tokens,
            z_prev_frame=z_prev,
            ode_steps=req.ode_steps,
            cfg_scale=req.cfg_scale,
            solver=req.solver,
            use_scale2x=req.use_scale2x,
            seed=req.seed + len(prev_actions) * 37,
            num_snaps=6,
        )
        attn = _engine.get_last_attention()
    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)

    new_frames = res["frames_rgb"]
    combined_frames = (
        np.concatenate([prev_frames, new_frames], axis=0)
        if prev_frames is not None
        else new_frames
    )
    all_actions = prev_actions + [spec["action_id"]]
    all_fx = prev_fx + [spec["fx_id"]]
    all_mood = prev_mood + [spec["time_id"]]

    _lab_sessions[sess_id] = {
        "frames": combined_frames,
        "last_latent": res["last_latent_frame"],
        "actions": all_actions,
        "fx": all_fx,
        "mood": all_mood,
    }

    job_id = f"{sess_id}_{len(all_actions):02d}"
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    with _engine_lock:
        _engine.write_mp4(job_dir / "clip.mp4", combined_frames, fps=req.fps)
        _engine.write_gif(job_dir / "clip.gif", combined_frames, fps=req.fps)
        _engine.write_apng(job_dir / "clip.apng", combined_frames, fps=req.fps)
        _engine.write_ost_wav(
            job_dir / "clip.wav",
            shot_actions=all_actions,
            shot_fx=all_fx,
            shot_mood=all_mood,
            frames_per_shot=16,
            fps=req.fps,
        )

    snaps = res["denoising_snaps_rgb"]
    denoise_imgs = [_img_to_data_url(snaps[i]) for i in range(snaps.shape[0])]
    attn_img = _render_attention_heatmap(attn)

    return {
        "session_id": sess_id,
        "chunks_count": len(all_actions),
        "total_frames": int(combined_frames.shape[0]),
        "fps": req.fps,
        "gen_ms": elapsed_ms,
        "continued_via_z_prev": z_prev is not None,
        "resolved_spec": spec,
        "tokens": tokens,
        "denoise_DataUrls": denoise_imgs,
        "attention_DataUrl": attn_img,
        "urls": {
            "apng": f"/media/jobs/{job_id}/clip.apng",
            "gif": f"/media/jobs/{job_id}/clip.gif",
            "mp4": f"/media/jobs/{job_id}/clip.mp4",
            "wav": f"/media/jobs/{job_id}/clip.wav",
        },
    }


@app.post("/api/finetune")
def api_finetune(req: FineTuneRequest) -> Dict[str, Any]:
    t0 = time.perf_counter()
    with _engine_lock:
        specs, words, prev, _ = build_balanced_anime_dataset(num_pairs=140)
        _engine.build_dataset(specs, words, prev)
        _engine.encode_dataset_latents()
        dls = _engine.train_dit(
            num_steps=req.dit_steps,
            batch_size=4,
            lr_max=req.lr,
            lr_min=req.lr * 0.25,
            cfg_drop_prob=0.14,
        )
        _engine.save_checkpoint(DEFAULT_CKPT)
        st = _engine.stats()

    elapsed = round(time.perf_counter() - t0, 2)
    if DEFAULT_METRICS.exists():
        m = json.loads(DEFAULT_METRICS.read_text(encoding="utf-8"))
        m["training_summary"]["dit_steps"] = st["dit_trained_steps"]
        m["training_summary"]["dit_final_loss"] = round(float(dls[-10:].mean()), 5)
        m["curves"]["dit_loss"] += downsample_curve(dls, 15)
        DEFAULT_METRICS.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "status": "ok",
        "elapsed_sec": elapsed,
        "stats": st,
        "loss_start": round(float(dls[:5].mean()), 5),
        "loss_end": round(float(dls[-5:].mean()), 5),
        "step_losses": downsample_curve(dls, 20),
    }


@app.get("/media/{subpath:path}")
def serve_media(subpath: str):
    target = (OUTPUTS_DIR / subpath).resolve()
    if not str(target).startswith(str(OUTPUTS_DIR.resolve())) or not target.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    ext = target.suffix.lower()
    media_types = {
        ".mp4": "video/mp4",
        ".gif": "image/gif",
        ".apng": "image/apng",
        ".png": "image/png",
        ".wav": "audio/wav",
    }
    headers = {}
    if ext in (".mp4", ".gif", ".apng", ".wav"):
        headers["Cache-Control"] = "no-cache"
    return FileResponse(target, media_type=media_types.get(ext, "application/octet-stream"), headers=headers)


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
