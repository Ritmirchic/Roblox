from __future__ import annotations

import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .engine import SakugaEngine
from .prompt_parser import (
    ACTIONS,
    CAMERAS,
    FRAMINGS,
    HEROES,
    SCENES,
    TIMES,
    WEATHER_FX,
    parse_prompt_to_spec_and_tokens,
    spec_to_bilingual_tokens,
)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def _load_pixel_font(size: int = 11) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if Path(FONT_PATH).exists():
        return ImageFont.truetype(FONT_PATH, size=size)
    return ImageFont.load_default()


def _detect_russian(text: str) -> bool:
    return bool(re.search(r"[а-яёА-ЯЁ]", text or ""))


HERO_SHORT_RU = ["Аканэ", "Рэн", "Лумина", "Райдэн", "Куро", "Мидори"]
HERO_SHORT_EN = ["Akane", "Ren", "Lumina", "Raiden", "Kuro", "Midori"]

SCENE_SHORT_RU = [
    "Храм Сакуры", "Крыша Нео-Токио", "Бамбуковый лес",
    "Небесная цитадель", "Багровый разлом", "Морская станция",
]
SCENE_SHORT_EN = [
    "Sakura Shrine", "Neo-Tokyo Roof", "Bamboo Forest",
    "Sky Citadel", "Crimson Rift", "Seaside Station",
]


def _default_subtitle(beat_role: str, hero_id: int, rival_id: int, scene_id: int, is_ru: bool) -> str:
    h = (HERO_SHORT_RU if is_ru else HERO_SHORT_EN)[hero_id % 6]
    r = (HERO_SHORT_RU if is_ru else HERO_SHORT_EN)[rival_id % 6]
    sc = (SCENE_SHORT_RU if is_ru else SCENE_SHORT_EN)[scene_id % 6]

    if is_ru:
        table = {
            "establish": f"[{sc}] Ветер перемен уже близко...",
            "hero_talk": f"{h}: «Я не отступлю ни на шаг!»",
            "dash": f"{h} устремляется вперёд сквозь горизонт!",
            "aura_cont": f"Аура {h} разгорается на полную мощь!",
            "rival_talk": f"{r}: «Посмотрим, на что способен твой клинок!»",
            "duel": f"{h} и {r} скрещивают клинки в искрах!",
            "climax": f"{h}: «Рассекающий полумесяц — САКУГА!»",
            "climax_beam": f"{h}: «Звёздный импульс — ПОЛНЫЙ ВЫБРОС!»",
            "epilogue": f"Над локацией «{sc}» воцаряется тишина...",
        }
    else:
        table = {
            "establish": f"[{sc}] The wind of fate begins to stir...",
            "hero_talk": f"{h}: 'I won't take a single step back!'",
            "dash": f"{h} dashes across the horizon!",
            "aura_cont": f"{h}'s aura flares to maximum resonance!",
            "rival_talk": f"{r}: 'Show me the true edge of your blade!'",
            "duel": f"{h} and {r} clash in a storm of sparks!",
            "climax": f"{h}: 'Crescent Severance — SAKUGA!'",
            "climax_beam": f"{h}: 'Astral Surge — FULL RELEASE!'",
            "epilogue": f"Silence returns to {sc}...",
        }
    return table.get(beat_role, "")


def render_pixel_subtitle_on_frames(
    frames_rgb: np.ndarray,
    subtitle: str,
    episode_badge: Optional[str] = None,
) -> np.ndarray:
    """Burn crisp 1-bit pixel-art anime subtitles using palette-exact colors (zero blurry anti-aliasing)."""
    if not subtitle and not episode_badge:
        return frames_rgb

    out = frames_rgb.copy()
    font_sub = _load_pixel_font(10)
    font_badge = _load_pixel_font(10)

    # Wrap subtitle up to 2 short lines (max ~26 chars per line at 256px width)
    lines: List[str] = []
    if subtitle:
        words = subtitle.strip().split()
        cur = ""
        for w in words:
            if len(cur) + len(w) + 1 <= 27:
                cur = f"{cur} {w}".strip()
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        lines = lines[:2]

    for idx in range(out.shape[0]):
        img = Image.fromarray(out[idx], mode="RGB")
        draw = ImageDraw.Draw(img)
        draw.fontmode = "1"  # Strict 1-bit crisp pixel rendering!

        if episode_badge and idx < 12:
            b_box = draw.textbbox((0, 0), episode_badge, font=font_badge)
            bw = b_box[2] - b_box[0]
            draw.rectangle([6, 6, 14 + bw, 20], fill=(18, 16, 28), outline=(62, 212, 255))
            draw.text((10, 7), episode_badge, fill=(250, 252, 255), font=font_badge)

        if lines:
            bar_h = 14 * len(lines) + 6
            y0 = 256 - bar_h - 4
            # Dark indigo anime letterbox bar with subtle pixel border
            draw.rectangle([4, y0, 251, 252], fill=(18, 16, 28), outline=(40, 38, 58))
            for li, line in enumerate(lines):
                bbox = draw.textbbox((0, 0), line, font=font_sub)
                tw = bbox[2] - bbox[0]
                tx = max(8, (256 - tw) // 2)
                ty = y0 + 3 + li * 13
                # 1px crisp pixel shadow + warm anime subtitle yellow (palette slot 49 in GIF!)
                draw.text((tx + 1, ty + 1), line, fill=(6, 6, 10), font=font_sub)
                draw.text((tx, ty), line, fill=(255, 236, 120), font=font_sub)

        out[idx] = np.asarray(img, dtype=np.uint8)

    return out


class EpisodeDirector:
    """Plans and generates multi-shot 256x256 Pixel-Art Anime Episodes using SakugaDiT + z_prev continuation."""

    def __init__(self, engine: SakugaEngine):
        self.engine = engine

    def plan_storyboard(
        self,
        synopsis: str,
        num_shots: int = 6,
        hero_override: Optional[int] = None,
        scene_override: Optional[int] = None,
        time_override: Optional[int] = None,
        seed: int = 2026,
    ) -> List[Dict[str, Any]]:
        num_shots = max(2, min(16, int(num_shots)))
        is_ru = _detect_russian(synopsis)

        overrides = {
            "hero_id": hero_override,
            "scene_id": scene_override,
            "time_id": time_override,
        }
        base_spec, _ = parse_prompt_to_spec_and_tokens(synopsis, overrides=overrides, default_seed=seed)
        hero_id = base_spec["hero_id"]
        rival_id = (hero_id + 3) % 6
        scene_id = base_spec["scene_id"]
        time_id = base_spec["time_id"]
        base_fx = base_spec["fx_id"]

        # Split user clauses if they wrote a beat-by-beat synopsis
        clauses = [
            c.strip()
            for c in re.split(r"[\n.;!]+|->|—>", synopsis or "")
            if len(c.strip()) > 6
        ]

        # Canonical dramatic anime episode arc templates scalable to any num_shots!
        prefer_magic = hero_id in (2, 5) or base_spec["action_id"] == 4
        climax_act = 4 if prefer_magic else 3
        climax_role = "climax_beam" if prefer_magic else "climax"

        canonical_fx_for_scene = [0, 1, 3, 3, 2, 0]
        scene_fx = canonical_fx_for_scene[scene_id % 6]

        arc_templates = [
            # (role, hero, framing, action, camera, fx, use_z_prev)
            ("establish",   hero_id,  0, 0, 0, scene_fx, False),
            ("dash",        hero_id,  0, 2, 1, scene_fx, True),   # Continuous Wide -> Wide z_prev shot!
            ("hero_talk",   hero_id,  2, 1, 0, scene_fx, False),  # Clean cut to Close-Up portrait!
            ("aura_cont",   hero_id,  1, 5, 0, scene_fx, False),  # Clean cut to Medium Awakening Aura!
            (climax_role,   hero_id,  1, climax_act, 0, 4, True), # Continuous Medium -> Medium z_prev climax!
            ("duel",        hero_id,  3, 3, 0, 2 if scene_id == 4 else scene_fx, False),
            ("rival_talk",  rival_id, 2, 1, 0, scene_fx, False),
            ("epilogue",    hero_id,  0, 0, 0, scene_fx, False),
        ]

        shots: List[Dict[str, Any]] = []
        wants_duel = (
            base_spec["action_id"] == 3
            or base_spec["framing_id"] == 3
            or any(k in (synopsis or "").lower() for k in ["дуэл", "сраж", "битв", "против", "скрещ", "duel", "clash", "vs"])
        )
        for idx in range(num_shots):
            # Map idx smoothly onto dramatic arc ensuring opening, rising action, climax, and epilogue
            if num_shots == 6:
                six_arc = [
                    arc_templates[0], # 1. Establish (Wide)
                    arc_templates[2], # 2. Hero Close-Up Dialogue
                    arc_templates[1], # 3. High-Speed Dash (Wide)
                    arc_templates[3], # 4. Awakening Ki Aura (Medium)
                    arc_templates[4], # 5. Climax Slash/Beam (Medium, continuous z_prev from Shot 4!)
                    arc_templates[5] if wants_duel else arc_templates[7], # 6. Duel or Epilogue
                ]
                tpl = six_arc[idx]
            elif num_shots <= len(arc_templates):
                if idx == num_shots - 1 and num_shots >= 4:
                    tpl = arc_templates[-1]
                elif idx == num_shots - 2 and num_shots >= 4:
                    tpl = arc_templates[4]
                else:
                    tpl = arc_templates[idx]
            else:
                tpl = arc_templates[idx % len(arc_templates)]

            role, sh_hero, sh_framing, sh_action, sh_cam, sh_fx, cont_prev = tpl

            # If user explicitly supplied per-beat clauses, adapt action/framing while keeping world continuity
            clause_text = clauses[idx] if idx < len(clauses) else ""
            if len(clauses) >= 3 and clause_text:
                c_spec, _ = parse_prompt_to_spec_and_tokens(clause_text, default_seed=seed + idx)
                sh_action = c_spec["action_id"]
                if any(w in clause_text.lower() for w in ["крупн", "лиц", "глаз", "close", "face", "дуэл", "duel"]):
                    sh_framing = c_spec["framing_id"]

            # Strictly chain z_prev ONLY when camera framing, hero, and scene remain continuous!
            use_prev = bool(
                cont_prev
                and idx > 0
                and shots[-1]["spec"]["framing_id"] == sh_framing
                and shots[-1]["spec"]["hero_id"] == sh_hero
                and shots[-1]["spec"]["scene_id"] == scene_id
            )

            spec = {
                "hero_id": sh_hero,
                "scene_id": scene_id,
                "time_id": time_id,
                "framing_id": sh_framing,
                "action_id": sh_action,
                "camera_id": sh_cam,
                "fx_id": sh_fx,
                "part_idx": (shots[-1]["spec"]["part_idx"] + 1) if use_prev else 0,
                "variant_seed": (seed + idx * 17) & 0xFFFF,
            }
            tokens = spec_to_bilingual_tokens(spec, extra_text=clause_text or synopsis)
            sub_line = clause_text if (len(clauses) >= num_shots and len(clause_text) <= 52) else _default_subtitle(
                role, hero_id, rival_id, scene_id, is_ru
            )

            shots.append({
                "shot_index": idx + 1,
                "role": role,
                "spec": spec,
                "tokens": tokens,
                "use_z_prev": use_prev,
                "subtitle": sub_line,
                "hero_label": HEROES[sh_hero]["name_ru" if is_ru else "name_en"],
                "scene_label": SCENES[scene_id]["name_ru" if is_ru else "name_en"],
                "framing_label": FRAMINGS[sh_framing]["name_ru" if is_ru else "name_en"],
                "action_label": ACTIONS[sh_action]["name_ru" if is_ru else "name_en"],
            })

        return shots

    def generate_episode(
        self,
        title: str,
        synopsis: str,
        output_dir: str | Path,
        num_shots: int = 6,
        fps: int = 10,
        ode_steps: int = 16,
        cfg_scale: float = 1.45,
        solver: str = "heun",
        use_scale2x: bool = True,
        subtitles: bool = True,
        hero_override: Optional[int] = None,
        scene_override: Optional[int] = None,
        time_override: Optional[int] = None,
        seed: int = 2026,
    ) -> Dict[str, Any]:
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        t0 = time.perf_counter()
        storyboard = self.plan_storyboard(
            synopsis=synopsis,
            num_shots=num_shots,
            hero_override=hero_override,
            scene_override=scene_override,
            time_override=time_override,
            seed=seed,
        )

        all_frames: List[np.ndarray] = []
        shot_actions: List[int] = []
        shot_fx: List[int] = []
        shot_mood: List[int] = []
        prev_last_latent: Optional[np.ndarray] = None
        first_shot_snaps: Optional[np.ndarray] = None

        badge = (title.strip()[:24].upper() if title.strip() else "EPISODE 01")

        for i, shot in enumerate(storyboard):
            sh_t0 = time.perf_counter()
            z_prev = prev_last_latent if shot["use_z_prev"] else None
            res = self.engine.generate_shot(
                spec_dict=shot["spec"],
                word_ids5=shot["tokens"],
                z_prev_frame=z_prev,
                ode_steps=ode_steps,
                cfg_scale=cfg_scale,
                solver=solver,
                use_scale2x=use_scale2x,
                seed=seed + i * 101,
                num_snaps=6 if i == 0 else 0,
            )
            sh_ms = (time.perf_counter() - sh_t0) * 1000.0
            shot["gen_ms"] = round(sh_ms, 1)

            prev_last_latent = res["last_latent_frame"]
            if i == 0 and "denoising_snaps_rgb" in res:
                first_shot_snaps = res["denoising_snaps_rgb"]

            frames = res["frames_rgb"]
            if subtitles:
                frames = render_pixel_subtitle_on_frames(
                    frames,
                    shot["subtitle"],
                    episode_badge=badge if i == 0 else None,
                )

            # Save keyframe thumbnail PNG for storyboard UI
            kf_img = Image.fromarray(frames[len(frames) // 2], mode="RGB")
            kf_name = f"shot_{i + 1:02d}.png"
            kf_img.save(out_dir / kf_name)
            shot["keyframe_file"] = kf_name

            all_frames.append(frames)
            shot_actions.append(shot["spec"]["action_id"])
            shot_fx.append(shot["spec"]["fx_id"])
            shot_mood.append(shot["spec"]["time_id"])

        episode_frames = np.concatenate(all_frames, axis=0)  # [num_shots*16, 256, 256, 3]

        mp4_path = out_dir / "episode.mp4"
        gif_path = out_dir / "episode.gif"
        apng_path = out_dir / "episode.apng"
        wav_path = out_dir / "soundtrack.wav"
        strip_path = out_dir / "storyboard_strip.png"

        self.engine.write_mp4(mp4_path, episode_frames, fps=fps)
        self.engine.write_gif(gif_path, episode_frames, fps=fps)
        self.engine.write_apng(apng_path, episode_frames, fps=fps)
        self.engine.write_ost_wav(
            wav_path,
            shot_actions=shot_actions,
            shot_fx=shot_fx,
            shot_mood=shot_mood,
            frames_per_shot=16,
            fps=fps,
        )

        # Save denoising progression strip from Shot 1 (proves neural diffusion from pure noise!)
        snap_files: List[str] = []
        if first_shot_snaps is not None:
            for s_idx in range(first_shot_snaps.shape[0]):
                sname = f"denoise_step_{s_idx}.png"
                Image.fromarray(first_shot_snaps[s_idx], mode="RGB").save(out_dir / sname)
                snap_files.append(sname)

        # Build Storyboard Filmstrip PNG
        cols = min(len(storyboard), 4)
        rows = (len(storyboard) + cols - 1) // cols
        strip = Image.new("RGB", (cols * 264 + 8, rows * 264 + 8), (14, 14, 24))
        for i, shot in enumerate(storyboard):
            r, c = divmod(i, cols)
            kf = Image.open(out_dir / shot["keyframe_file"])
            strip.paste(kf, (8 + c * 264, 8 + r * 264))
        strip.save(strip_path)

        total_sec = time.perf_counter() - t0
        return {
            "title": title or "Pixel Anime Episode 01",
            "synopsis": synopsis,
            "num_shots": len(storyboard),
            "total_frames": int(episode_frames.shape[0]),
            "fps": fps,
            "duration_sec": round(episode_frames.shape[0] / max(1, fps), 2),
            "generation_time_sec": round(total_sec, 2),
            "ode_steps": ode_steps,
            "cfg_scale": cfg_scale,
            "solver": solver,
            "storyboard": storyboard,
            "denoise_snapshots": snap_files,
            "files": {
                "mp4": mp4_path.name,
                "gif": gif_path.name,
                "apng": apng_path.name,
                "wav": wav_path.name,
                "storyboard": strip_path.name,
            },
        }
