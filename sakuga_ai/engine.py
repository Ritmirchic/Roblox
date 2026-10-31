from __future__ import annotations

import ctypes
import os
import struct
import subprocess
import zlib
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
LIB_PATH = REPO_ROOT / "bin" / "libsakuga.so"

CLIP_FRAMES = 16
OUT_H = 256
OUT_W = 256
LATENT_T = 8
LATENT_H = 32
LATENT_W = 32
LATENT_C = 8
LATENT_FRAME_DIM = LATENT_H * LATENT_W * LATENT_C  # 8192
LATENT_DIM = LATENT_T * LATENT_FRAME_DIM           # 65536
NUM_COND_TOKENS = 12


def _ensure_shared_lib() -> ctypes.CDLL:
    if not LIB_PATH.exists():
        subprocess.run(["make"], cwd=str(REPO_ROOT), check=True)
    lib = ctypes.CDLL(str(LIB_PATH))

    c_int_p = ctypes.POINTER(ctypes.c_int)
    c_float_p = ctypes.POINTER(ctypes.c_float)
    c_u8_p = ctypes.POINTER(ctypes.c_uint8)

    lib.sakuga_create.argtypes = [ctypes.c_uint32]
    lib.sakuga_create.restype = ctypes.c_void_p

    lib.sakuga_destroy.argtypes = [ctypes.c_void_p]
    lib.sakuga_destroy.restype = None

    lib.sakuga_model_stats.argtypes = [ctypes.c_void_p, c_int_p, c_int_p, c_int_p, c_int_p]
    lib.sakuga_model_stats.restype = None

    lib.sakuga_get_palette.argtypes = []
    lib.sakuga_get_palette.restype = c_u8_p

    lib.sakuga_numerical_grad_check.argtypes = []
    lib.sakuga_numerical_grad_check.restype = ctypes.c_float

    lib.sakuga_build_dataset.argtypes = [
        ctypes.c_void_p, ctypes.c_int, c_int_p, c_int_p, c_int_p
    ]
    lib.sakuga_build_dataset.restype = None

    lib.sakuga_train_vae.argtypes = [
        ctypes.c_void_p, ctypes.c_int, ctypes.c_int,
        ctypes.c_float, ctypes.c_float, ctypes.c_float,
        c_float_p, c_float_p
    ]
    lib.sakuga_train_vae.restype = None

    lib.sakuga_encode_dataset_latents.argtypes = [ctypes.c_void_p]
    lib.sakuga_encode_dataset_latents.restype = None

    lib.sakuga_train_dit.argtypes = [
        ctypes.c_void_p, ctypes.c_int, ctypes.c_int,
        ctypes.c_float, ctypes.c_float, ctypes.c_float,
        c_float_p
    ]
    lib.sakuga_train_dit.restype = None

    lib.sakuga_generate_shot.argtypes = [
        ctypes.c_void_p,
        c_int_p,
        c_float_p,
        ctypes.c_int,
        ctypes.c_int,
        ctypes.c_float,
        ctypes.c_int,
        ctypes.c_int,
        ctypes.c_uint32,
        c_u8_p,
        c_float_p,
        c_float_p,
        ctypes.c_int,
        c_u8_p,
    ]
    lib.sakuga_generate_shot.restype = None

    lib.sakuga_get_last_attention.argtypes = [ctypes.c_void_p, c_float_p, ctypes.c_int]
    lib.sakuga_get_last_attention.restype = ctypes.c_int

    lib.sakuga_eval_vae_reconstruction.argtypes = [
        ctypes.c_void_p, c_int_p, c_u8_p, c_u8_p
    ]
    lib.sakuga_eval_vae_reconstruction.restype = ctypes.c_float

    lib.sakuga_save_checkpoint.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    lib.sakuga_save_checkpoint.restype = ctypes.c_int

    lib.sakuga_load_checkpoint.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    lib.sakuga_load_checkpoint.restype = ctypes.c_int

    lib.sakuga_write_mp4.argtypes = [
        ctypes.c_char_p, c_u8_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int
    ]
    lib.sakuga_write_mp4.restype = ctypes.c_int

    lib.sakuga_write_gif.argtypes = [
        ctypes.c_char_p, c_u8_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int
    ]
    lib.sakuga_write_gif.restype = ctypes.c_int

    lib.sakuga_write_ost_wav.argtypes = [
        ctypes.c_char_p, c_int_p, c_int_p, c_int_p,
        ctypes.c_int, ctypes.c_int, ctypes.c_int
    ]
    lib.sakuga_write_ost_wav.restype = ctypes.c_int

    return lib


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(chunk_type)
    crc = zlib.crc32(data, crc) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + chunk_type + data + struct.pack(">I", crc)


def encode_apng_bytes(rgb_frames: np.ndarray, fps: int = 10) -> bytes:
    """From-scratch lossless 24-bit RGB Animated PNG (APNG) encoder using raw PNG chunks + zlib."""
    frames = np.ascontiguousarray(rgb_frames, dtype=np.uint8)
    num_frames, h, w, ch = frames.shape
    assert ch == 3, "Expected RGB frames [T, H, W, 3]"

    out = bytearray(b"\x89PNG\r\n\x1a\n")
    # IHDR: width, height, bit_depth=8, color_type=2 (RGB), comp=0, filter=0, interlace=0
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    out.extend(_png_chunk(b"IHDR", ihdr))

    # acTL: num_frames, num_plays=0 (infinite loop)
    actl = struct.pack(">II", num_frames, 0)
    out.extend(_png_chunk(b"acTL", actl))

    seq_num = 0
    delay_num = 1
    delay_den = max(1, int(fps))

    for i in range(num_frames):
        # fcTL chunk
        fctl = struct.pack(
            ">IIIIIHHBB",
            seq_num, w, h, 0, 0, delay_num, delay_den, 0, 0
        )
        out.extend(_png_chunk(b"fcTL", fctl))
        seq_num += 1

        # Filter byte 0 (None) prepended to each scanline
        frame_2d = frames[i].reshape(h, w * 3)
        raw_scanlines = np.hstack([np.zeros((h, 1), dtype=np.uint8), frame_2d]).tobytes()
        compressed = zlib.compress(raw_scanlines, level=6)

        if i == 0:
            out.extend(_png_chunk(b"IDAT", compressed))
        else:
            fdat_payload = struct.pack(">I", seq_num) + compressed
            out.extend(_png_chunk(b"fdAT", fdat_payload))
            seq_num += 1

    out.extend(_png_chunk(b"IEND", b""))
    return bytes(out)


def build_cond12_array(spec_dict: Dict[str, int], word_ids5: list[int]) -> np.ndarray:
    c = np.zeros(NUM_COND_TOKENS, dtype=np.int32)
    c[0] = 0 + (int(spec_dict.get("hero_id", 0)) % 6)
    c[1] = 8 + (int(spec_dict.get("scene_id", 0)) % 6)
    c[2] = 16 + (int(spec_dict.get("time_id", 0)) % 4)
    c[3] = 22 + (int(spec_dict.get("framing_id", 0)) % 4)
    c[4] = 28 + (int(spec_dict.get("action_id", 0)) % 6)
    c[5] = 36 + (int(spec_dict.get("camera_id", 0)) % 4)
    c[6] = 42 + (int(spec_dict.get("fx_id", 0)) % 5)
    for j in range(5):
        w_id = word_ids5[j] if j < len(word_ids5) else 0
        c[7 + j] = max(0, min(255, int(w_id)))
    return c


class SakugaEngine:
    """High-level Python interface to our custom C++17 AVX-512/OpenMP Neural Video Engine."""

    def __init__(self, seed: int = 42, checkpoint_path: Optional[str | Path] = None):
        self.lib = _ensure_shared_lib()
        self.ctx = self.lib.sakuga_create(ctypes.c_uint32(seed))
        if checkpoint_path and Path(checkpoint_path).exists():
            self.load_checkpoint(checkpoint_path)

    def __del__(self):
        if getattr(self, "ctx", None) and getattr(self, "lib", None):
            self.lib.sakuga_destroy(self.ctx)
            self.ctx = None

    def stats(self) -> Dict[str, int]:
        vp, dp, vs, ds = ctypes.c_int(), ctypes.c_int(), ctypes.c_int(), ctypes.c_int()
        self.lib.sakuga_model_stats(
            self.ctx, ctypes.byref(vp), ctypes.byref(dp), ctypes.byref(vs), ctypes.byref(ds)
        )
        return {
            "vae_params": vp.value,
            "dit_params": dp.value,
            "total_params": vp.value + dp.value,
            "vae_trained_steps": vs.value,
            "dit_trained_steps": ds.value,
        }

    def get_palette_rgb(self) -> np.ndarray:
        ptr = self.lib.sakuga_get_palette()
        buf = np.ctypeslib.as_array(ptr, shape=(48, 3)).copy()
        return buf

    def numerical_grad_check(self) -> float:
        return float(self.lib.sakuga_numerical_grad_check())

    def build_dataset(self, specs: np.ndarray, words: np.ndarray, prev_idx: np.ndarray) -> None:
        specs_c = np.ascontiguousarray(specs, dtype=np.int32)
        words_c = np.ascontiguousarray(words, dtype=np.int32)
        prev_c = np.ascontiguousarray(prev_idx, dtype=np.int32)
        n = specs_c.shape[0]
        assert specs_c.shape == (n, 9)
        assert words_c.shape == (n, 5)
        assert prev_c.shape == (n,)
        self.lib.sakuga_build_dataset(
            self.ctx,
            n,
            specs_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            words_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            prev_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
        )

    def train_vae(
        self,
        num_steps: int,
        batch_size: int = 2,
        lr_max: float = 3e-3,
        lr_min: float = 4e-4,
        latent_noise_std: float = 0.05,
    ) -> Tuple[np.ndarray, np.ndarray]:
        losses = np.zeros(num_steps, dtype=np.float32)
        accs = np.zeros(num_steps, dtype=np.float32)
        self.lib.sakuga_train_vae(
            self.ctx,
            int(num_steps),
            int(batch_size),
            float(lr_max),
            float(lr_min),
            float(latent_noise_std),
            losses.ctypes.data_as(ctypes.POINTER(ctypes.c_float)),
            accs.ctypes.data_as(ctypes.POINTER(ctypes.c_float)),
        )
        return losses, accs

    def encode_dataset_latents(self) -> None:
        self.lib.sakuga_encode_dataset_latents(self.ctx)

    def train_dit(
        self,
        num_steps: int,
        batch_size: int = 4,
        lr_max: float = 1.6e-3,
        lr_min: float = 2e-4,
        cfg_drop_prob: float = 0.15,
    ) -> np.ndarray:
        losses = np.zeros(num_steps, dtype=np.float32)
        self.lib.sakuga_train_dit(
            self.ctx,
            int(num_steps),
            int(batch_size),
            float(lr_max),
            float(lr_min),
            float(cfg_drop_prob),
            losses.ctypes.data_as(ctypes.POINTER(ctypes.c_float)),
        )
        return losses

    def generate_shot(
        self,
        spec_dict: Dict[str, int],
        word_ids5: list[int],
        z_prev_frame: Optional[np.ndarray] = None,
        ode_steps: int = 16,
        cfg_scale: float = 1.45,
        solver: str = "heun",
        use_scale2x: bool = True,
        seed: int = 1234,
        num_snaps: int = 0,
    ) -> Dict[str, np.ndarray]:
        cond12 = build_cond12_array(spec_dict, word_ids5)
        has_prev = 1 if z_prev_frame is not None else 0
        z_prev_ptr = None
        if z_prev_frame is not None:
            zp_c = np.ascontiguousarray(z_prev_frame, dtype=np.float32)
            assert zp_c.size == LATENT_FRAME_DIM
            z_prev_ptr = zp_c.ctypes.data_as(ctypes.POINTER(ctypes.c_float))

        out_rgb = np.zeros((CLIP_FRAMES, OUT_H, OUT_W, 3), dtype=np.uint8)
        out_last_lat = np.zeros((LATENT_H, LATENT_W, LATENT_C), dtype=np.float32)
        out_full_lat = np.zeros((LATENT_T, LATENT_H, LATENT_W, LATENT_C), dtype=np.float32)

        snap_rgb = None
        snap_ptr = None
        if num_snaps > 0:
            snap_rgb = np.zeros((num_snaps, OUT_H, OUT_W, 3), dtype=np.uint8)
            snap_ptr = snap_rgb.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8))

        solver_id = 1 if solver.lower() == "heun" else 0
        self.lib.sakuga_generate_shot(
            self.ctx,
            cond12.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            z_prev_ptr,
            has_prev,
            int(ode_steps),
            float(cfg_scale),
            solver_id,
            1 if use_scale2x else 0,
            ctypes.c_uint32(seed & 0xFFFFFFFF),
            out_rgb.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),
            out_last_lat.ctypes.data_as(ctypes.POINTER(ctypes.c_float)),
            out_full_lat.ctypes.data_as(ctypes.POINTER(ctypes.c_float)),
            int(num_snaps),
            snap_ptr,
        )

        res = {
            "frames_rgb": out_rgb,
            "last_latent_frame": out_last_lat,
            "full_latent": out_full_lat,
        }
        if snap_rgb is not None:
            res["denoising_snaps_rgb"] = snap_rgb
        return res

    def get_last_attention(self) -> np.ndarray:
        buf = np.zeros(128 * 144, dtype=np.float32)
        n = self.lib.sakuga_get_last_attention(
            self.ctx, buf.ctypes.data_as(ctypes.POINTER(ctypes.c_float)), buf.size
        )
        if n == 128 * 144:
            return buf.reshape(128, 144)
        return np.zeros((128, 144), dtype=np.float32)

    def eval_vae_reconstruction(self, spec9: list[int]) -> Tuple[float, np.ndarray, np.ndarray]:
        sp_c = np.ascontiguousarray(spec9, dtype=np.int32)
        gt = np.zeros((CLIP_FRAMES, OUT_H, OUT_W, 3), dtype=np.uint8)
        rec = np.zeros((CLIP_FRAMES, OUT_H, OUT_W, 3), dtype=np.uint8)
        acc = self.lib.sakuga_eval_vae_reconstruction(
            self.ctx,
            sp_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            gt.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),
            rec.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),
        )
        return float(acc), gt, rec

    def save_checkpoint(self, path: str | Path) -> bool:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        ok = self.lib.sakuga_save_checkpoint(self.ctx, str(path).encode("utf-8"))
        return bool(ok)

    def load_checkpoint(self, path: str | Path) -> bool:
        ok = self.lib.sakuga_load_checkpoint(self.ctx, str(path).encode("utf-8"))
        return bool(ok)

    def write_mp4(self, path: str | Path, frames_rgb: np.ndarray, fps: int = 10) -> bool:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        arr = np.ascontiguousarray(frames_rgb, dtype=np.uint8)
        t, h, w, _ = arr.shape
        ok = self.lib.sakuga_write_mp4(
            str(path).encode("utf-8"),
            arr.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),
            t, w, h, int(fps)
        )
        return bool(ok)

    def write_gif(self, path: str | Path, frames_rgb: np.ndarray, fps: int = 10) -> bool:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        arr = np.ascontiguousarray(frames_rgb, dtype=np.uint8)
        t, h, w, _ = arr.shape
        ok = self.lib.sakuga_write_gif(
            str(path).encode("utf-8"),
            arr.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),
            t, w, h, int(fps)
        )
        return bool(ok)

    def write_apng(self, path: str | Path, frames_rgb: np.ndarray, fps: int = 10) -> bool:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        data = encode_apng_bytes(frames_rgb, fps=fps)
        Path(path).write_bytes(data)
        return True

    def write_ost_wav(
        self,
        path: str | Path,
        shot_actions: list[int],
        shot_fx: list[int],
        shot_mood: list[int],
        frames_per_shot: int = 16,
        fps: int = 10,
    ) -> bool:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        act_c = np.ascontiguousarray(shot_actions, dtype=np.int32)
        fx_c = np.ascontiguousarray(shot_fx, dtype=np.int32)
        md_c = np.ascontiguousarray(shot_mood, dtype=np.int32)
        ok = self.lib.sakuga_write_ost_wav(
            str(path).encode("utf-8"),
            act_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            fx_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            md_c.ctypes.data_as(ctypes.POINTER(ctypes.c_int)),
            len(shot_actions),
            int(frames_per_shot),
            int(fps),
        )
        return bool(ok)
