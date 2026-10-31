from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

from .director import EpisodeDirector
from .engine import REPO_ROOT, SakugaEngine
from .prompt_parser import spec_to_bilingual_tokens

DEFAULT_CKPT = REPO_ROOT / "checkpoints" / "sakuga_v1.bin"
DEFAULT_METRICS = REPO_ROOT / "checkpoints" / "training_metrics.json"


def build_balanced_anime_dataset(num_pairs: int = 140, seed: int = 2026) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[List[int]]]:
    """
    Create systematic factorial coverage across all 6 heroes x 6 scenes x 4 framings x 6 actions
    (pairs of part_idx=0 and continuous part_idx=1), holding out 4 specific triples for zero-shot eval.
    """
    specs_list: List[List[int]] = []
    words_list: List[List[int]] = []
    prev_list: List[int] = []

    held_out_triples = {
        (0, 1, 3),  # Akane in Neo-Tokyo doing Crescent Katana Slash
        (2, 5, 4),  # Lumina at Seaside Station casting Arcane Beam
        (1, 0, 2),  # Ren at Sakura Shrine doing High-Speed Dash
        (4, 2, 5),  # Kuro in Bamboo Moon Forest Awakening Aura
    }

    canonical_time_for_scene = [0, 3, 1, 2, 0, 0]
    canonical_fx_for_scene = [0, 1, 3, 3, 2, 0]

    # Build full factorial list of (hero, scene, framing) = 6 * 6 * 4 = 144 combinations
    grid = []
    for framing in range(4):
        for scene in range(6):
            for hero in range(6):
                if framing == 2:
                    action = 1 if (hero + scene) % 2 == 0 else 0
                elif framing == 3:
                    action = 3
                elif framing == 0:
                    action = [0, 2, 3, 4][(hero + scene) % 4]
                else:
                    action = [3, 4, 5, 1][(hero + scene) % 4]
                if (hero, scene, action) in held_out_triples:
                    continue
                grid.append((hero, scene, framing, action))

    # Add extra action variety cycles if num_pairs > len(grid)
    idx_g = 0
    while len(specs_list) // 2 < num_pairs:
        hero, scene, framing, base_act = grid[idx_g % len(grid)]
        cycle = idx_g // len(grid)
        action = base_act if cycle == 0 else ((base_act + cycle * 2) % 6)
        if framing == 2 and action == 2:
            action = 1
        idx_g += 1
        if (hero, scene, action) in held_out_triples:
            continue

        time_id = canonical_time_for_scene[scene] if cycle == 0 else ((scene + cycle) % 4)
        camera_id = 1 if action == 2 else (3 if framing == 1 and action >= 3 else 0)
        fx_id = 4 if action >= 3 and framing in (1, 3) else canonical_fx_for_scene[scene]
        var_seed = int((hero * 7 + scene * 13 + framing * 3 + 11) % 64)

        sp0 = [hero, scene, time_id, framing, action, camera_id, fx_id, 0, var_seed]
        d0 = {
            "hero_id": hero, "scene_id": scene, "time_id": time_id,
            "framing_id": framing, "action_id": action, "camera_id": camera_id, "fx_id": fx_id,
        }
        w0 = spec_to_bilingual_tokens(d0)
        idx_a = len(specs_list)
        specs_list.append(sp0)
        words_list.append(w0)
        prev_list.append(-1)

        next_action = action
        if framing != 2:
            if action == 2:
                next_action = 3
            elif action == 0 and framing == 1:
                next_action = 5
        sp1 = [hero, scene, time_id, framing, next_action, camera_id, fx_id, 1, var_seed]
        d1 = dict(d0, action_id=next_action)
        w1 = spec_to_bilingual_tokens(d1)
        specs_list.append(sp1)
        words_list.append(w1)
        prev_list.append(idx_a)

    held_out_specs = [
        [0, 1, 3, 0, 3, 0, 1, 0, 777],
        [2, 5, 0, 1, 4, 3, 3, 0, 888],
        [1, 0, 0, 0, 2, 1, 0, 0, 999],
        [4, 2, 1, 3, 5, 0, 4, 0, 555],
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
    num_pairs: int = 420,
    vae_steps: int = 900,
    vae_batch: int = 2,
    dit_steps: int = 2600,
    dit_batch: int = 4,
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
    print(f"[2/5] Synthesized {len(specs)} 16-frame anime clips ({len(specs)*16} frames) in {ds_sec:.2f}s")

    # Stage 1: Train PixelAnimeVAE
    t_vae = time.perf_counter()
    vae_losses_all = []
    vae_accs_all = []
    chunk = max(1, vae_steps // 5)
    rem = vae_steps
    done = 0
    while rem > 0:
        step_now = min(chunk, rem)
        # Cosine schedule across chunks
        frac0 = done / max(1, vae_steps)
        frac1 = (done + step_now) / max(1, vae_steps)
        lr_hi = 3.2e-3 * (0.5 * (1.0 + np.cos(np.pi * frac0))) + 3e-4
        lr_lo = 3.2e-3 * (0.5 * (1.0 + np.cos(np.pi * frac1))) + 3e-4
        ls, ac = engine.train_vae(
            num_steps=step_now,
            batch_size=vae_batch,
            lr_max=float(lr_hi),
            lr_min=float(lr_lo),
            latent_noise_std=0.022,
        )
        vae_losses_all.append(ls)
        vae_accs_all.append(ac)
        done += step_now
        rem -= step_now
        print(
            f"  [VAE {done:4d}/{vae_steps}] CE_loss={ls[-20:].mean():.4f} | "
            f"pixel_acc={ac[-20:].mean()*100:.2f}% ({time.perf_counter()-t_vae:.1f}s)"
        )

    vae_sec = time.perf_counter() - t_vae
    vae_losses = np.concatenate(vae_losses_all) if vae_losses_all else np.zeros(1)
    vae_accs = np.concatenate(vae_accs_all) if vae_accs_all else np.zeros(1)

    # Evaluate zero-shot unseen combinations on VAE
    zeroshot_accs = []
    for sp9 in held_out_specs:
        acc, _, _ = engine.eval_vae_reconstruction(sp9)
        zeroshot_accs.append(acc)
    mean_zs_acc = float(np.mean(zeroshot_accs))
    print(f"[3/5] Zero-shot unseen combination VAE pixel accuracy: {mean_zs_acc*100:.2f}%")

    # Pre-encode all clips into latent cache
    t_enc = time.perf_counter()
    engine.encode_dataset_latents()
    enc_sec = time.perf_counter() - t_enc
    print(f"[4/5] Pre-encoded {len(specs)} video latents [8x8x8x24] in {enc_sec:.2f}s")

    # Stage 2: Train SakugaDiT via Rectified Flow Matching
    t_dit = time.perf_counter()
    dit_losses_all = []
    d_chunk = max(1, dit_steps // 6)
    rem = dit_steps
    done = 0
    while rem > 0:
        step_now = min(d_chunk, rem)
        frac0 = done / max(1, dit_steps)
        frac1 = (done + step_now) / max(1, dit_steps)
        lr_hi = 1.8e-3 * (0.5 * (1.0 + np.cos(np.pi * frac0))) + 1.8e-4
        lr_lo = 1.8e-3 * (0.5 * (1.0 + np.cos(np.pi * frac1))) + 1.8e-4
        dls = engine.train_dit(
            num_steps=step_now,
            batch_size=dit_batch,
            lr_max=float(lr_hi),
            lr_min=float(lr_lo),
            cfg_drop_prob=0.14,
        )
        dit_losses_all.append(dls)
        done += step_now
        rem -= step_now
        print(
            f"  [DiT {done:4d}/{dit_steps}] FM_MSE_loss={dls[-30:].mean():.4f} "
            f"({time.perf_counter()-t_dit:.1f}s)"
        )

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
    dit_l_curve = (prev_curves.get("dit_loss", []) + downsample_curve(dit_losses, 60)) if dit_steps > 0 else prev_curves.get("dit_loss", [])

    metrics = {
        "model_architecture": {
            "stage1_vae": "PixelAnimeVAE (SpaceToDepth4 + Factorized 3D ResBlocks + 48-Palette Logit Head + Scale2x)",
            "stage2_dit": "SakugaDiT (5-Block Sora-style 3D Spacetime DiT, 3D Axial RoPE, AdaLN-Zero, Cross-Attn, z_prev Continuation)",
            "objective": "Rectified Flow Matching (v = z_1 - z_0) + Classifier-Free Guidance + Heun 2nd-Order ODE",
            "output_resolution": "256x256 RGB (16 frames/shot, unbounded multi-shot autoregressive episodes)",
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
            "vae_final_loss": round(float(vae_losses[-25:].mean()), 5) if vae_steps > 0 else (vae_l_curve[-1] if vae_l_curve else 0.0),
            "vae_final_pixel_acc": round(float(vae_accs[-25:].mean()), 5) if vae_steps > 0 else (vae_a_curve[-1] if vae_a_curve else 0.0),
            "vae_zeroshot_pixel_acc": round(mean_zs_acc, 5),
            "dit_initial_loss": prev_dit_init_loss if prev_dit_init_loss is not None else round(float(dit_losses[:25].mean()), 5),
            "dit_final_loss": round(float(dit_losses[-40:].mean()), 5) if dit_steps > 0 else (dit_l_curve[-1] if dit_l_curve else 0.0),
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
    parser.add_argument("--pairs", type=int, default=420)
    parser.add_argument("--vae-steps", type=int, default=900)
    parser.add_argument("--dit-steps", type=int, default=2600)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    run_training(
        num_pairs=args.pairs,
        vae_steps=args.vae_steps,
        dit_steps=args.dit_steps,
        resume=args.resume,
    )
