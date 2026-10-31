from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

from .engine import REPO_ROOT, SakugaEngine
from .prompt_parser import spec_to_bilingual_tokens

DEFAULT_CKPT = REPO_ROOT / "checkpoints" / "sakuga_v1.bin"
DEFAULT_METRICS = REPO_ROOT / "checkpoints" / "training_metrics.json"


def build_balanced_anime_dataset(num_pairs: int = 144, seed: int = 2026) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[List[int]]]:
    """
    Build a concrete, full-coverage 128x128 anime reference dataset across all 6 heroes x 6 iconic scenes,
    covering ALL 4 framings (Wide, Medium, Close-Up Portrait, Duel) and ALL 6 actions (Calm, Lip-Sync,
    Dash, Crescent Katana Slash, Arcane Beam, Awakening Ki Aura) with framing-consistent z_prev arcs!
    """
    specs_list: List[List[int]] = []
    words_list: List[List[int]] = []
    prev_list: List[int] = []

    held_out_triples = {
        (0, 3, 4),  # Akane in Sky Sanctuary casting Arcane Beam
        (2, 4, 3),  # Lumina on Eclipse Sword Hill doing Katana Slash
        (3, 5, 2),  # Raiden at Kamakura Crossing doing Dash
        (5, 1, 5),  # Midori in Neo-Tokyo Awakening Aura
    }

    canonical_time_for_scene = [0, 3, 1, 2, 0, 0]
    canonical_fx_for_scene = [0, 1, 3, 3, 2, 0]

    # 4 concrete multi-shot anime sequence templates per (hero, scene) world (36 * 4 = 144 pairs = 288 clips)
    world_arcs = []
    for scene in range(6):
        t_id = canonical_time_for_scene[scene]
        s_fx = canonical_fx_for_scene[scene]
        duel_fx = 2 if scene == 4 else s_fx
        for hero in range(6):
            vseed = int((hero * 7 + scene * 13 + 11) % 64)
            # Arc 0: Wide Establish -> Continuous Wide High-Speed Dash
            world_arcs.append((
                [hero, scene, t_id, 0, 0, 0, s_fx, 0, vseed],
                [hero, scene, t_id, 0, 2, 1, s_fx, 1, vseed],
                True,
            ))
            # Arc 1: Close-Up Gaze -> Continuous Close-Up Animated Lip-Sync Dialogue
            world_arcs.append((
                [hero, scene, t_id, 2, 0, 0, s_fx, 0, vseed],
                [hero, scene, t_id, 2, 1, 0, s_fx, 1, vseed],
                True,
            ))
            # Arc 2: Medium Awakening Ki Aura -> Continuous Medium Crescent Katana Slash!
            world_arcs.append((
                [hero, scene, t_id, 1, 5, 0, s_fx, 0, vseed],
                [hero, scene, t_id, 1, 3, 0, 4,    1, vseed],
                True,
            ))
            # Arc 3: Medium Arcane Beam + Clean-Cut Two-Character Duel Clash
            world_arcs.append((
                [hero, scene, t_id, 1, 4, 0, 4,       0, vseed],
                [hero, scene, t_id, 3, 3, 0, duel_fx, 0, vseed],
                False,
            ))

    idx_w = 0
    while len(specs_list) // 2 < num_pairs:
        sp0, sp1, chain_prev = world_arcs[idx_w % len(world_arcs)]
        cycle = idx_w // len(world_arcs)
        idx_w += 1

        if (sp0[0], sp0[1], sp0[4]) in held_out_triples or (sp1[0], sp1[1], sp1[4]) in held_out_triples:
            continue

        s0 = list(sp0)
        s1 = list(sp1)
        if cycle > 0:
            alt_time = (s0[2] + cycle) % 4
            s0[2] = alt_time
            s1[2] = alt_time

        d0 = {
            "hero_id": s0[0], "scene_id": s0[1], "time_id": s0[2],
            "framing_id": s0[3], "action_id": s0[4], "camera_id": s0[5], "fx_id": s0[6],
        }
        d1 = {
            "hero_id": s1[0], "scene_id": s1[1], "time_id": s1[2],
            "framing_id": s1[3], "action_id": s1[4], "camera_id": s1[5], "fx_id": s1[6],
        }
        idx_a = len(specs_list)
        specs_list.append(s0)
        words_list.append(spec_to_bilingual_tokens(d0))
        prev_list.append(-1)

        specs_list.append(s1)
        words_list.append(spec_to_bilingual_tokens(d1))
        prev_list.append(idx_a if chain_prev else -1)

    held_out_specs = [
        [0, 3, 2, 1, 4, 0, 4, 0, 17],
        [2, 4, 0, 1, 3, 0, 4, 0, 29],
        [3, 5, 0, 0, 2, 1, 0, 0, 41],
        [5, 1, 3, 1, 5, 0, 1, 0, 53],
    ]

    return (
        np.array(specs_list, dtype=np.int32),
        np.array(words_list, dtype=np.int32),
        np.array(prev_list, dtype=np.int32),
        held_out_specs,
    )


def downsample_curve(arr: np.ndarray, max_points: int = 80) -> List[float]:
    if arr.size == 0:
        return []
    if arr.size <= max_points:
        return [round(float(x), 5) for x in arr]
    chunks = np.array_split(arr, max_points)
    return [round(float(c.mean()), 5) for c in chunks]


def run_training(
    num_pairs: int = 140,
    vae_steps: int = 450,
    vae_batch: int = 1,
    dit_steps: int = 1800,
    dit_batch: int = 2,
    ckpt_path: Path = DEFAULT_CKPT,
    metrics_path: Path = DEFAULT_METRICS,
    resume: bool = False,
) -> Dict:
    t_start = time.perf_counter()
    engine = SakugaEngine(seed=2026)
    if resume and ckpt_path.exists():
        engine.load_checkpoint(ckpt_path)

    grad_err = engine.numerical_grad_check()
    print(f"[1/5] Finite-difference C++ Autograd check: max_rel_err = {grad_err:.5f}")

    t_ds = time.perf_counter()
    specs, words, prev_idx, held_out_specs = build_balanced_anime_dataset(num_pairs=num_pairs)
    engine.build_dataset(specs, words, prev_idx)
    ds_sec = time.perf_counter() - t_ds
    print(f"[2/5] Synthesized {len(specs)} concrete 16-frame 128x128 anime clips ({len(specs)*16} frames) in {ds_sec:.2f}s")

    # Stage 1: Train 128x128 PixelAnimeVAE
    t_vae = time.perf_counter()
    vae_losses_all = []
    vae_accs_all = []
    if vae_steps > 0:
        chunk = max(1, vae_steps // 6)
        rem = vae_steps
        done = 0
        vae_peak = 1.1e-3 if resume else 3.0e-3
        vae_min = 1.4e-4 if resume else 2.5e-4
        while rem > 0:
            step_now = min(chunk, rem)
            frac0 = done / max(1, vae_steps)
            frac1 = (done + step_now) / max(1, vae_steps)
            lr_hi = vae_min + (vae_peak - vae_min) * (0.5 * (1.0 + np.cos(np.pi * frac0)))
            lr_lo = vae_min + (vae_peak - vae_min) * (0.5 * (1.0 + np.cos(np.pi * frac1)))
            noise_std = (0.012 if resume else 0.024) if frac0 < 0.65 else 0.005
            ls, ac = engine.train_vae(
                num_steps=step_now,
                batch_size=vae_batch,
                lr_max=float(lr_hi),
                lr_min=float(lr_lo),
                latent_noise_std=noise_std,
            )
            vae_losses_all.append(ls)
            vae_accs_all.append(ac)
            done += step_now
            rem -= step_now
            print(
                f"  [VAE {done:4d}/{vae_steps}] CE_loss={ls[-15:].mean():.4f} | "
                f"pixel_acc={ac[-15:].mean()*100:.2f}% ({time.perf_counter()-t_vae:.1f}s)"
            )

    vae_sec = time.perf_counter() - t_vae
    vae_losses = np.concatenate(vae_losses_all) if vae_losses_all else np.zeros(1)
    vae_accs = np.concatenate(vae_accs_all) if vae_accs_all else np.zeros(1)

    zeroshot_accs = []
    for sp9 in held_out_specs:
        acc, _, _ = engine.eval_vae_reconstruction(sp9)
        zeroshot_accs.append(acc)
    mean_zs_acc = float(np.mean(zeroshot_accs))
    print(f"[3/5] Zero-shot unseen combination 128x128 VAE pixel accuracy: {mean_zs_acc*100:.2f}%")

    t_enc = time.perf_counter()
    engine.encode_dataset_latents()
    enc_sec = time.perf_counter() - t_enc
    print(f"[4/5] Pre-encoded {len(specs)} video latents [8x32x32x8] in {enc_sec:.2f}s")

    # Stage 2: Train Full-Rank SakugaDiT v2 (D=288 > PATCH_C=256)
    t_dit = time.perf_counter()
    dit_losses_all = []
    if dit_steps > 0:
        d_chunk = max(1, dit_steps // 8)
        rem = dit_steps
        done = 0
        peak_lr = 4.6e-4 if resume else 9.5e-4
        min_lr = 3.5e-5
        while rem > 0:
            step_now = min(d_chunk, rem)
            frac0 = done / max(1, dit_steps)
            frac1 = (done + step_now) / max(1, dit_steps)
            if not resume and frac0 == 0.0:
                lr_hi = peak_lr * 0.65
                lr_lo = peak_lr
            else:
                lr_hi = min_lr + (peak_lr - min_lr) * (0.5 * (1.0 + np.cos(np.pi * frac0)))
                lr_lo = min_lr + (peak_lr - min_lr) * (0.5 * (1.0 + np.cos(np.pi * frac1)))
            dls = engine.train_dit(
                num_steps=step_now,
                batch_size=dit_batch,
                lr_max=float(lr_hi),
                lr_min=float(lr_lo),
                cfg_drop_prob=0.12,
            )
            dit_losses_all.append(dls)
            done += step_now
            rem -= step_now
            print(
                f"  [DiT {done:4d}/{dit_steps}] FM_MSE_loss={dls[-25:].mean():.5f} "
                f"({time.perf_counter()-t_dit:.1f}s)"
            )
            # Save rolling checkpoint after every chunk so long training is 100% crash-safe!
            engine.save_checkpoint(ckpt_path)

    dit_sec = time.perf_counter() - t_dit
    dit_losses = np.concatenate(dit_losses_all) if dit_losses_all else np.zeros(1)

    prev_curves = {"vae_loss": [], "vae_acc": [], "dit_loss": []}
    prev_dit_init_loss = None
    if resume and metrics_path.exists():
        try:
            old_m = json.loads(metrics_path.read_text(encoding="utf-8"))
            prev_curves = old_m.get("curves", prev_curves)
            prev_dit_init_loss = old_m.get("training_summary", {}).get("dit_initial_loss")
        except Exception:
            pass

    engine.save_checkpoint(ckpt_path)
    st = engine.stats()
    total_sec = time.perf_counter() - t_start

    vae_l_curve = (prev_curves.get("vae_loss", []) + downsample_curve(vae_losses, 50)) if vae_steps > 0 else prev_curves.get("vae_loss", [])
    vae_a_curve = (prev_curves.get("vae_acc", []) + downsample_curve(vae_accs, 50)) if vae_steps > 0 else prev_curves.get("vae_acc", [])
    dit_l_curve = (prev_curves.get("dit_loss", []) + downsample_curve(dit_losses, 70)) if dit_steps > 0 else prev_curves.get("dit_loss", [])

    metrics = {
        "model_architecture": {
            "stage1_vae": "PixelAnimeVAE v2 (Native 128x128 -> [8,32,32,8] + 64x64 Seam-Free Conv + 48-Palette Classifier + Scale2x -> 256x256)",
            "stage2_dit": "SakugaDiT v2 (Full-Rank D=288 > PATCH_C=256, 6 Blocks, 8x8 Spatial Grid, 3D RoPE, Conv3D Post-Refiner, z_prev)",
            "objective": "Clean x1-Prediction Rectified Flow Matching + Classifier-Free Guidance + Heun 2nd-Order ODE",
            "output_resolution": "256x256 RGB (Native 128x128 HD Pixel-Art x Scale2x, 16 frames/shot, multi-shot episodes)",
            "vae_params": st["vae_params"],
            "dit_params": st["dit_params"],
            "total_params": st["total_params"],
        },
        "training_summary": {
            "dataset_clips": int(len(specs)),
            "dataset_frames": int(len(specs) * 16),
            "grad_check_max_rel_err": round(grad_err, 6),
            "vae_steps": st["vae_trained_steps"],
            "dit_steps": st["dit_trained_steps"],
            "vae_final_loss": round(float(vae_losses[-20:].mean()), 5) if vae_steps > 0 else (vae_l_curve[-1] if vae_l_curve else 0.0),
            "vae_final_pixel_acc": round(float(vae_accs[-20:].mean()), 5) if vae_steps > 0 else (vae_a_curve[-1] if vae_a_curve else 0.0),
            "vae_zeroshot_pixel_acc": round(mean_zs_acc, 5),
            "dit_initial_loss": prev_dit_init_loss if prev_dit_init_loss is not None else round(float(dit_losses[:20].mean()), 5),
            "dit_final_loss": round(float(dit_losses[-30:].mean()), 5) if dit_steps > 0 else (dit_l_curve[-1] if dit_l_curve else 0.0),
            "vae_train_sec": round(vae_sec, 2),
            "latent_encode_sec": round(enc_sec, 2),
            "dit_train_sec": round(dit_sec, 2),
            "total_sec": round(total_sec, 2),
        },
        "curves": {
            "vae_loss": vae_l_curve,
            "vae_acc": vae_a_curve,
            "dit_loss": dit_l_curve,
        },
    }
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[5/5] Saved checkpoint ({ckpt_path.stat().st_size / 1e6:.2f} MB) & metrics in {total_sec:.1f}s!")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pairs", type=int, default=140)
    parser.add_argument("--vae-steps", type=int, default=450)
    parser.add_argument("--vae-batch", type=int, default=1)
    parser.add_argument("--dit-steps", type=int, default=1800)
    parser.add_argument("--dit-batch", type=int, default=2)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    run_training(
        num_pairs=args.pairs,
        vae_steps=args.vae_steps,
        vae_batch=args.vae_batch,
        dit_steps=args.dit_steps,
        dit_batch=args.dit_batch,
        resume=args.resume,
    )
