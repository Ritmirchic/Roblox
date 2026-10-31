from __future__ import annotations

import io
import struct
import sys
import tempfile
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image

from sakuga_ai.director import EpisodeDirector
from sakuga_ai.engine import REPO_ROOT, SakugaEngine
from sakuga_ai.prompt_parser import parse_prompt_to_spec_and_tokens
from sakuga_ai.reference_importer import train_on_concrete_reference


def test_full_pipeline() -> None:
    ckpt = REPO_ROOT / "checkpoints" / "sakuga_v1.bin"
    assert ckpt.exists(), "Trained checkpoint sakuga_v1.bin must exist"

    eng = SakugaEngine(seed=100, checkpoint_path=ckpt)
    st = eng.stats()
    assert st["total_params"] > 10_000_000
    assert st["vae_trained_steps"] >= 2000
    assert st["dit_trained_steps"] >= 3500

    # 1. Numerical finite-difference gradient check of C++17 Autograd engine
    grad_err = eng.numerical_grad_check()
    print(f"[TEST] Grad check max relative error: {grad_err:.5f}")
    assert grad_err < 0.02

    # 2. Zero-shot 128x128 -> 256x256 VAE accuracy check
    acc, rec, gt = eng.eval_vae_reconstruction([0, 1, 3, 0, 3, 0, 1, 0, 19])
    print(f"[TEST] Zero-shot VAE pixel accuracy: {acc*100:.2f}%")
    assert acc > 0.78
    assert rec.shape == (16, 256, 256, 3)

    # 3. Single-shot ODE + z_prev continuation + [256, 320] 3D attention check
    spec, toks = parse_prompt_to_spec_and_tokens("Кибер-синоби Рэн на крыше Нео-Токио под ливнем")
    shot1 = eng.generate_shot(spec, toks, ode_steps=8, cfg_scale=1.28, num_snaps=6)
    assert shot1["frames_rgb"].shape == (16, 256, 256, 3)
    assert shot1["denoising_snaps_rgb"].shape == (6, 256, 256, 3)
    attn = eng.get_last_attention()
    assert attn.shape == (256, 320)

    shot2 = eng.generate_shot(spec, toks, z_prev_frame=shot1["last_latent_frame"], ode_steps=8, cfg_scale=1.28)
    assert shot2["frames_rgb"].shape == (16, 256, 256, 3)

    # 4. Concrete anime reference importer & live C++ fine-tuning test (without overwriting production ckpt)
    eng_ref = SakugaEngine(seed=202, checkpoint_path=ckpt)
    buf = io.BytesIO()
    Image.fromarray(gt[4], mode="RGB").save(buf, format="PNG")
    ref_out = train_on_concrete_reference(
        engine=eng_ref,
        raw_bytes=buf.getvalue(),
        prompt="Алая мечница Аканэ на крыше Нео-Токио",
        vae_steps=2,
        dit_steps=3,
        ckpt_path=None,
    )
    assert ref_out["imported_clips"] == 1
    assert ref_out["imported_frames"] == 16
    assert ref_out["quantized_preview_DataUrl"].startswith("data:image/png;base64,")

    # 5. Verify EpisodeDirector framing-cut z_prev guard & custom H.264 MP4, GIF89a, APNG, WAV codecs
    with tempfile.TemporaryDirectory() as tmp:
        tdir = Path(tmp)
        director = EpisodeDirector(eng)
        plan6 = director.plan_storyboard("Аканэ у Храма Сакуры на закате наносит удар катаной", num_shots=6)
        # Shot 4 (Medium Aura) after Shot 3 (Wide Dash) MUST NOT chain z_prev across framing cut!
        assert plan6[3]["use_z_prev"] is False
        # Shot 5 (Medium Climax) after Shot 4 (Medium Aura) MUST chain z_prev smoothly!
        assert plan6[4]["use_z_prev"] is True

        meta = director.generate_episode(
            title="EP.TEST",
            synopsis="Звёздная ведьма Лумина выпускает магический луч на морской станции на закате",
            output_dir=tdir,
            num_shots=3,
            fps=10,
            ode_steps=8,
            cfg_scale=1.28,
        )
        assert meta["total_frames"] == 48

        with Image.open(tdir / "episode.gif") as gif_im:
            assert gif_im.size == (256, 256)
            assert getattr(gif_im, "n_frames", 1) == 48

        with Image.open(tdir / "episode.apng") as apng_im:
            assert apng_im.size == (256, 256)
            assert getattr(apng_im, "n_frames", 1) == 48

        mp4_bytes = (tdir / "episode.mp4").read_bytes()
        ftyp_len = struct.unpack(">I", mp4_bytes[:4])[0]
        assert mp4_bytes[4:8] == b"ftyp"
        assert mp4_bytes[ftyp_len + 4 : ftyp_len + 8] == b"mdat"
        assert b"moov" in mp4_bytes and b"avc1" in mp4_bytes and b"avcC" in mp4_bytes

        with wave.open(str(tdir / "soundtrack.wav"), "rb") as wf:
            assert wf.getnchannels() == 2
            assert wf.getframerate() == 44100
            assert wf.getnframes() > 44100 * 4

    print("[TEST] ALL v2 PIPELINE, REFERENCE IMPORTER & CUSTOM CODEC TESTS PASSED!")


if __name__ == "__main__":
    test_full_pipeline()
