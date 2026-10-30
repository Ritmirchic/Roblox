"""Процедурный чиптюн-саундтрек (numpy -> WAV).

Никаких сэмплов: только квадрат, треугольник и шум. Этого достаточно, чтобы
эпизод перестал быть немым и получил «ту самую» 8-битную интонацию.
"""
from __future__ import annotations

import math
import os
import struct
import wave

import numpy as np

SR = 22050

# минорная пентатоника — беспроигрышная основа для меланхоличной темы
SCALE = [0, 3, 5, 7, 10]
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str) -> float:
    """'A4' -> 440."""
    octave = int(name[-1])
    pitch = NOTE[name[:-1]]
    return 440.0 * 2 ** ((octave - 4) + (pitch - 9) / 12.0)


def _env(n: int, attack: float = 0.01, decay: float = 0.25, sustain: float = 0.6, release: float = 0.1) -> np.ndarray:
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    s = max(0, n - a - d - r)
    return np.concatenate([
        np.linspace(0, 1, a, endpoint=False),
        np.linspace(1, sustain, d, endpoint=False),
        np.full(s, sustain),
        np.linspace(sustain, 0, r),
    ])[:n]


def square(freq: float, dur: float, duty: float = 0.5, vol: float = 0.22, detune: float = 0.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + detune * np.sin(2 * np.pi * 5.2 * t))
    ph = (t * f) % 1.0
    wave_ = np.where(ph < duty, 1.0, -1.0)
    return wave_ * _env(n, 0.008, dur * 0.35, 0.55, min(0.12, dur * 0.4)) * vol


def triangle(freq: float, dur: float, vol: float = 0.20) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = (t * freq) % 1.0
    w = 4 * np.abs(ph - 0.5) - 1
    return w * _env(n, 0.01, dur * 0.3, 0.7, min(0.15, dur * 0.5)) * vol


def noise_hit(dur: float, vol: float = 0.10, seed: int = 0, bright: float = 1.0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    w = rng.normal(0, 1, n)
    # простой «хай-пасс» через разности — шум становится шипящим
    w = np.diff(np.concatenate([[0.0], w])) * bright
    return w * _env(n, 0.001, dur * 0.5, 0.0, dur * 0.5) * vol


def kick(dur: float = 0.18, vol: float = 0.35) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 22) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * vol


class Track:
    def __init__(self, dur: float):
        self.buf = np.zeros(int(dur * SR) + SR, dtype=np.float32)

    def add(self, sig: np.ndarray, at: float) -> None:
        i = int(at * SR)
        j = min(len(self.buf), i + len(sig))
        if i < len(self.buf):
            self.buf[i:j] += sig[: j - i]

    def fade(self, fade_in: float = 1.0, fade_out: float = 2.0) -> None:
        n = len(self.buf)
        a = max(1, int(fade_in * SR))
        b = max(1, int(fade_out * SR))
        self.buf[:a] *= np.linspace(0, 1, a)
        self.buf[-b:] *= np.linspace(1, 0, b)

    def write(self, path: str, gain: float = 0.9) -> str:
        os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
        x = np.clip(self.buf * gain, -1, 1)
        # мягкая сатурация «как у 8-битных консолей»
        x = np.tanh(x * 1.6) * 0.85
        pcm = (x * 32767).astype(np.int16)
        with wave.open(path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        return path


def make_soundtrack(dur: float, seed: int = 7, mood: str = "dusk", tempo: float = 88.0) -> Track:
    """Собрать трек на dur секунд: арпеджио, бас, барабаны, редкая мелодия."""
    rng = np.random.default_rng(seed)
    tr = Track(dur)
    beat = 60.0 / tempo
    bar = beat * 4

    # прогрессия: Am — F — C — G (в разных тональностях для разных настроений)
    progressions = {
        "dusk": [("A3", ["A3", "C4", "E4"]), ("F3", ["F3", "A3", "C4"]), ("C4", ["C4", "E4", "G4"]), ("G3", ["G3", "B3", "D4"])],
        "night": [("D3", ["D3", "F3", "A3"]), ("A#2", ["A#2", "D3", "F3"]), ("F3", ["F3", "A3", "C4"]), ("C3", ["C3", "E3", "G3"])],
        "day": [("C4", ["C4", "E4", "G4"]), ("A3", ["A3", "C4", "E4"]), ("F3", ["F3", "A3", "C4"]), ("G3", ["G3", "B3", "D4"])],
    }
    prog = progressions.get(mood, progressions["dusk"])
    # бас: половинные ноты
    t = 0.0
    idx = 0
    while t < dur:
        root, chord = prog[idx % len(prog)]
        tr.add(triangle(hz(root) / 2, beat * 2 * 0.95, vol=0.22), t)
        tr.add(triangle(hz(root) / 2, beat * 2 * 0.95, vol=0.10), t + beat * 2)
        # арпеджио восьмыми
        for k in range(8):
            note = chord[k % len(chord)]
            oct_up = 1 if (k // 3) % 2 else 2
            tr.add(square(hz(note) * oct_up, beat * 0.42,
                          duty=0.25 if k % 2 else 0.5, vol=0.085), t + k * beat * 0.5)
        # барабаны
        for k in range(4):
            if k % 2 == 0:
                tr.add(kick(0.14, 0.22), t + k * beat)
            tr.add(noise_hit(0.06, 0.045, seed=int(seed + idx * 7 + k)), t + k * beat + beat * 0.5)
        idx += 1
        t += bar

    # мелодия: длинные ноты пентатоники, редкие, «поющие»
    t = bar
    while t < dur - 2:
        if rng.random() < 0.55:
            deg = SCALE[int(rng.integers(0, len(SCALE)))]
            octave = 5 if rng.random() < 0.6 else 6
            freq = hz("A4") * 2 ** (deg / 12.0) * (2 ** (octave - 5))
            ln = beat * (1.0 if rng.random() < 0.6 else 1.5)
            tr.add(square(freq, ln * 0.9, duty=0.35, vol=0.09, detune=0.004), t)
            tr.add(square(freq * 1.005, ln * 0.9, duty=0.5, vol=0.045), t + 0.01)
        t += beat * (1.0 if rng.random() < 0.5 else 2.0)
    tr.fade(1.2, min(3.0, dur * 0.2))
    return tr


def make_stinger(kind: str = "reveal", seed: int = 3) -> np.ndarray:
    """Короткий акцент: 'reveal' (звон), 'thud' (удар), 'chime'."""
    if kind == "reveal":
        a = square(hz("E5"), 0.5, 0.5, 0.16) + square(hz("B5"), 0.5, 0.25, 0.10)
        return np.concatenate([a, a[::-1] * 0.35])
    if kind == "thud":
        return kick(0.4, 0.5)
    a = square(hz("A5"), 0.35, 0.2, 0.12) + square(hz("E6"), 0.35, 0.1, 0.06)
    return a
