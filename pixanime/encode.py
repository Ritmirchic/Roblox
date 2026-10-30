"""Экспорт видео и звука.

ffmpeg в системе нет — но есть пакет imageio-ffmpeg, который его приносит.
Если и его нет, остаётся собственный GIF-энкодер (LZW из спецификации GIF89a)
и покадровый дамп PNG — так «серия» всё равно соберётся.
"""
from __future__ import annotations

import os
import shutil
import struct
import subprocess
import tempfile

import numpy as np


def ffmpeg_path() -> str | None:
    try:
        import imageio_ffmpeg

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    return shutil.which("ffmpeg")


# ---------------------------------------------------------------------------
class MP4Writer:
    """Потоковая запись H.264: кадры уходят в stdin ffmpeg, память не растёт."""

    def __init__(self, path: str, w: int, h: int, fps: float = 12, crf: int = 18, audio: str | None = None):
        exe = ffmpeg_path()
        if exe is None:
            raise RuntimeError("ffmpeg не найден: установите imageio-ffmpeg или системный ffmpeg")
        self.w, self.h, self.fps, self.path = w, h, fps, path
        self._audio = audio
        os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
        cmd = [
            exe, "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo",
            "-s", f"{w}x{h}", "-pix_fmt", "rgb24", "-r", str(fps),
            "-i", "pipe:0",
        ]
        if audio:
            cmd += ["-i", audio, "-c:a", "aac", "-b:a", "128k", "-shortest"]
        cmd += [
            "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-loglevel", "error", path,
        ]
        self.proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    def write(self, frame: np.ndarray) -> None:
        arr = np.ascontiguousarray(frame, dtype=np.uint8)
        if arr.shape[0] != self.h or arr.shape[1] != self.w:
            raise ValueError(f"кадр {arr.shape[:2]} не совпадает с {self.h}x{self.w}")
        self.proc.stdin.write(arr.tobytes())

    def close(self) -> None:
        if self.proc.stdin:
            self.proc.stdin.close()
        self.proc.wait()


def write_png_sequence(frames, outdir: str, prefix: str = "frame") -> int:
    from PIL import Image

    os.makedirs(outdir, exist_ok=True)
    n = 0
    for frame in frames:
        Image.fromarray(frame).save(os.path.join(outdir, f"{prefix}_{n:05d}.png"))
        n += 1
    return n


# ---------------------------------------------------------------------------
class _LZW:
    """LZW-компрессор GIF: всё по спецификации, без внешних зависимостей."""

    def __init__(self, min_code_size: int = 8):
        self.min_code_size = min_code_size
        self.clear_code = 1 << min_code_size
        self.eoi_code = self.clear_code + 1
        self.next_code = self.eoi_code + 1
        self.code_size = min_code_size + 1
        self.dict: dict[tuple[int, int], int] = {}
        self.out = bytearray()
        self.bits = 0
        self.nbits = 0

    def _emit(self, code: int) -> None:
        self.bits |= code << self.nbits
        self.nbits += self.code_size
        while self.nbits >= 8:
            self.out.append(self.bits & 0xFF)
            self.bits >>= 8
            self.nbits -= 8

    def compress(self, data: bytes) -> bytes:
        self._emit(self.clear_code)
        prefix = data[0]
        for c in data[1:]:
            key = (prefix, c)
            if key in self.dict:
                prefix = self.dict[key]
            else:
                self._emit(prefix)
                self.dict[key] = self.next_code
                self.next_code += 1
                if self.next_code > (1 << self.code_size):
                    if self.code_size < 12:
                        self.code_size += 1
                    else:
                        self._emit(self.clear_code)
                        self.dict.clear()
                        self.next_code = self.eoi_code + 1
                        self.code_size = self.min_code_size + 1
                prefix = c
        self._emit(prefix)
        self._emit(self.eoi_code)
        if self.nbits:
            self.out.append(self.bits & 0xFF)
        return bytes(self.out)


class GIFWriter:
    """Собственный GIF89a-энкодер с локальными палитрами (через PIL только квантование)."""

    def __init__(self, path: str, w: int, h: int, fps: float = 12):
        self.path, self.w, self.h = path, w, h
        self.delay = max(1, int(round(100 / fps)))
        os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
        self.f = open(path, "wb")
        self._header_written = False
        self._loop_written = False

    def _palette_bytes(self, pal: np.ndarray) -> bytes:
        p = np.zeros((256, 3), dtype=np.uint8)
        p[: len(pal)] = pal[:256]
        return p.tobytes()

    def write(self, frame: np.ndarray) -> None:
        from PIL import Image

        im = Image.fromarray(frame).convert("RGB")
        q = im.quantize(colors=255, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
        idx = np.array(q, dtype=np.uint8)
        pal = np.array(q.getpalette()[: 256 * 3], dtype=np.uint8).reshape(-1, 3)

        if not self._header_written:
            self.f.write(b"GIF89a")
            self.f.write(struct.pack("<HH", self.w, self.h))
            self.f.write(bytes([0xF7, 0x00, 0x00]))  # флаги: 256 цветов, аспект
            self.f.write(self._palette_bytes(pal))
            self.f.write(b"\x21\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00")  # зацикливание
            self._header_written = True
        # графический блок управления
        self.f.write(b"\x21\xf9\x04\x04" + struct.pack("<H", self.delay) + b"\x00\x00")
        # при необходимости — локальная палитра
        use_local = True
        flags = 0x87 if use_local else 0x04
        self.f.write(b"\x2c" + struct.pack("<HHHH", 0, 0, self.w, self.h) + bytes([flags]))
        if use_local:
            self.f.write(self._palette_bytes(pal))
        self.f.write(bytes([8]))
        data = _LZW(8).compress(idx.tobytes())
        # нарезка на суб-блоки по 255 байт
        for i in range(0, len(data), 255):
            chunk = data[i : i + 255]
            self.f.write(bytes([len(chunk)]))
            self.f.write(chunk)
        self.f.write(b"\x00")

    def close(self) -> None:
        if self.f:
            self.f.write(b"\x3b")
            self.f.close()
            self.f = None


def mux_audio(video: str, audio: str, out: str | None = None) -> str:
    """Пришить звук к готовому видео (без перекодирования картинки)."""
    exe = ffmpeg_path()
    if exe is None:
        raise RuntimeError("ffmpeg не найден")
    out = out or video.replace(".mp4", "_audio.mp4")
    cmd = [exe, "-y", "-i", video, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
           "-shortest", "-loglevel", "error", out]
    subprocess.run(cmd, check=True)
    return out
