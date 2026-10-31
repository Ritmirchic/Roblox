from __future__ import annotations

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


def test_full_pipeline() -> None:
    ckpt = REPO_ROOT / "checkpoints" / "sakuga_v1.bin"
    assert ckpt.exists(), "Trained checkpoint sakuga_v1.bin must exist"

    eng = SakugaEngine(seed=100, checkpoint_path=ckpt)
    st = eng.stats()
    assert st["total_params"] > 2_500_000
    assert st["vae_trained_steps"] >= 500
    assert st["dit_trained_steps"] >= 2000

    # 1. Numerical finite-difference gradient check of C++17 Autograd engine
    grad_err = eng.numerical_grad_check()
    print(f"[TEST] Grad check max relative error: {grad_err:.5f}")
    assert grad_err < 0.02

    # 2. Zero-shot VAE accuracy check
    acc, gt, rec = eng.eval_vae_reconstruction([0, 1, 3, 0, 3, 0, 1, 0, 19])
    print(f"[TEST] Zero-shot VAE pixel accuracy: {acc*100:.2f}%")
    assert acc > 0.78
    assert rec.shape == (16, 256, 256, 3)

    # 3. Single-shot ODE + z_prev continuation + custom codecs check
    spec, toks = parse_prompt_to_spec_and_tokens("Кибер-синоби Рэн на крыше Нео-Токио под ливнем")
    shot1 = eng.generate_shot(spec, toks, ode_steps=10, num_snaps=6)
    assert shot1["frames_rgb"].shape == (16, 256, 256, 3)
    assert shot1["denoising_snaps_rgb"].shape == (6, 256, 256, 3)

    shot2 = eng.generate_shot(spec, toks, z_prev_frame=shot1["last_latent_frame"], ode_steps=10)
    assert shot2["frames_rgb"].shape == (16, 256, 256, 3)

    # 4. Verify custom H.264 MP4, GIF89a LZW, Lossless APNG, and WAV encoders
    with tempfile.TemporaryDirectory() as tmp:
        tdir = Path(tmp)
        director = EpisodeDirector(eng)
        meta = director.generate_episode(
            title="EP.TEST",
            synopsis="Звёздная ведьма Лумина выпускает магический луч на морской станции на закате",
            output_dir=tdir,
            num_shots=3,
            fps=10,
            ode_steps=10,
        )
        assert meta["total_frames"] == 48

        # Verify GIF89a decodes cleanly in Pillow with exact 48 frames at 256x256
        with Image.open(tdir / "episode.gif") as gif_im:
            assert gif_im.size == (256, 256)
            assert getattr(gif_im, "n_frames", 1) == 48

        # Verify APNG decodes cleanly in Pillow with exact 48 frames at 256x256
        with Image.open(tdir / "episode.apng") as apng_im:
            assert apng_im.size == (256, 256)
            assert getattr(apng_im, "n_frames", 1) == 48

        # Verify ISO-BMFF H.264 MP4 box headers (ftyp, mdat, moov -> avc1 -> avcC)
        mp4_bytes = (tdir / "episode.mp4").read_bytes()
        ftyp_len = struct.unpack(">I", mp4_bytes[:4])[0]
        assert mp4_bytes[4:8] == b"ftyp"
        assert mp4_bytes[ftyp_len + 4 : ftyp_len + 8] == b"mdat"
        assert b"moov" in mp4_bytes and b"avc1" in mp4_bytes and b"avcC" in mp4_bytes

        # Verify WAV audio RIFF PCM structure
        with wave.open(str(tdir / "soundtrack.wav"), "rb") as wf:
            assert wf.getnchannels() == 2
            assert wf.getframerate() == 44100
            assert wf.getnframes() > 44100 * 4

    print("[TEST] ALL PIPELINE & CUSTOM CODEC TESTS PASSED!")


if __name__ == "__main__":
    test_full_pipeline()
