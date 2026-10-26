#!/usr/bin/env python3
"""Generate an original synthesized sound-effect/ambience library (WAV).

All sounds are synthesized from scratch with the Python stdlib: filtered
noise, oscillators, envelopes and FM/AM modulation. No third-party audio.
Output: 44.1 kHz mono 16-bit WAVs under assets/audio.
"""
import math
import os
import random
import struct
import wave

SR = 44100
OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..",
                                    "assets", "audio"))
rng = random.Random(20261026)


def save_wav(name, samples, rate=SR):
    samples = [max(-1.0, min(1.0, s)) for s in samples]
    path = os.path.join(OUT, name + ".wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = struct.pack("<%dh" % len(samples),
                             *[int(s * 32767) for s in samples])
        w.writeframes(frames)
    print("wrote", name, f"({len(samples) / rate:.2f}s)")


def white(n):
    return [rng.uniform(-1, 1) for _ in range(n)]


def pink(n):
    b = [0.0] * 7
    out = []
    for _ in range(n):
        w = rng.uniform(-1, 1)
        b[0] = 0.997 * b[0] + 0.029591 * w
        b[1] = 0.985 * b[1] + 0.032534 * w
        b[2] = 0.950 * b[2] + 0.048056 * w
        b[3] = 0.850 * b[3] + 0.090000 * w
        b[4] = 0.620 * b[4] + 0.100000 * w
        b[5] = 0.250 * b[5] + 0.100000 * w
        b[6] = w * 0.12
        out.append(sum(b) * 0.25)
    return out


def lp(data, alpha):
    out, prev = [], 0.0
    for s in data:
        prev = prev + alpha * (s - prev)
        out.append(prev)
    return out


def hp(data, alpha):
    out, prev_in, prev_out = [], 0.0, 0.0
    for s in data:
        prev_out = alpha * (prev_out + s - prev_in)
        prev_in = s
        out.append(prev_out)
    return out


def bp(data, low_a, high_a):
    return hp(lp(data, low_a), high_a)


def env(n, attack=0.01, decay=0.2, sustain=0.6, release=0.3):
    a = int(n * attack)
    d = int(n * decay)
    r = int(n * release)
    s = max(0, n - a - d - r)
    curve = []
    for i in range(a):
        curve.append(i / max(1, a))
    for i in range(d):
        curve.append(1.0 - (1.0 - sustain) * i / max(1, d))
    curve += [sustain] * s
    for i in range(r):
        curve.append(sustain * (1.0 - i / max(1, r)))
    return curve[:n] + [0.0] * max(0, n - len(curve))


def mix(*layers):
    n = max(len(l) for l in layers)
    out = [0.0] * n
    for layer in layers:
        for i, s in enumerate(layer):
            out[i] += s
    return out


def scale(data, g):
    return [s * g for s in data]


def sine(freq, n, phase=0.0):
    return [math.sin(2 * math.pi * freq * (i / SR) + phase) for i in range(n)]


def sweep(f0, f1, n, wave_fn=math.sin):
    out = []
    phase = 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * i / n
        phase += 2 * math.pi * f / SR
        out.append(wave_fn(phase))
    return out


# ---------------------------------------------------------------- ambient
def wind_loop():
    n = SR * 8
    data = lp(pink(n), 0.02)
    gust = [0.55 + 0.45 * math.sin(2 * math.pi * (0.07 + 0.02 * math.sin(i / n * 6))
                                   * i / SR) for i in range(n)]
    data = [d * g for d, g in zip(data, gust)]
    # crossfade tails for seamless looping
    fade = SR // 4
    head, tail = data[:fade], data[-fade:]
    for i in range(fade):
        data[i] = head[i] * (i / fade) + tail[i] * (1 - i / fade)
    save_wav("amb_wind", scale(data, 0.8))


def rain_loop():
    n = SR * 6
    data = hp(white(n), 0.15)
    rumble = lp(pink(n), 0.01)
    data = mix(scale(data, 0.5), scale(rumble, 0.4))
    fade = SR // 4
    head, tail = data[:fade], data[-fade:]
    for i in range(fade):
        data[i] = head[i] * (i / fade) + tail[i] * (1 - i / fade)
    save_wav("amb_rain", scale(data, 0.7))


def thunder():
    n = SR * 3
    crack = scale(lp(white(SR // 3), 0.25), 1.6)
    body = scale(lp(pink(n), 0.03), 1.2)
    e = env(n, attack=0.002, decay=0.25, sustain=0.3, release=0.7)
    out = mix(crack + [0] * (n - len(crack)), [b * x for b, x in zip(body, e)])
    save_wav("thunder", out)


def radio_static():
    n = SR * 4
    data = bp(white(n), 0.4, 0.08)
    gate = [(0.25 if math.sin(0.7 * i / SR) > 0.6 else 1.0) for i in range(n)]
    tone = scale(sweep(720, 380, n), 0.06)
    save_wav("radio_static", mix(scale([d * g for d, g in zip(data, gate)], 0.5), tone))


def campfire():
    n = SR * 4
    base = scale(lp(pink(n), 0.1), 0.35)
    cracks = [0.0] * n
    for _ in range(140):
        t = rng.randrange(n - 2000)
        burst = scale(lp(white(rng.randrange(300, 2500)), 0.6), rng.uniform(0.4, 1.0))
        for j, s in enumerate(burst):
            cracks[t + j] += s
    save_wav("campfire", mix(base, scale(cracks, 0.5)))


def drone_tension():
    n = SR * 6
    a = sine(55, n)
    b = sine(55.4, n)
    c = scale(sine(110.3, n), 0.4)
    e = env(n, attack=0.25, decay=0.1, sustain=0.8, release=0.4)
    save_wav("drone_tension", scale([(x + y + z) * g for x, y, z, g in
                                     zip(a, b, c, e)], 0.35))


# ---------------------------------------------------------------- footsteps
def footstep(surface, seed):
    rng.seed(seed)
    n = int(SR * 0.18)
    if surface == "concrete":
        d = scale(lp(white(n), 0.35), 0.9)
        click = scale(hp(white(n // 3), 0.5), 0.3)
    elif surface == "gravel":
        d = scale(bp(white(n), 0.5, 0.2), 0.95)
        click = scale(bp(white(n // 2), 0.7, 0.3), 0.4)
    elif surface == "wood":
        d = scale(lp(white(n), 0.12), 0.85)
        click = scale(sweep(180, 90, n // 3), 0.25)
    else:  # metal
        d = scale(sweep(320, 120, n), 0.5)
        click = scale(hp(white(n // 2), 0.4), 0.4)
    e = env(n, attack=0.005, decay=0.2, sustain=0.25, release=0.4)
    out = [x * g for x, g in zip(mix(d, click + [0] * (n - len(click))), e)]
    save_wav(f"step_{surface}", out)


# ---------------------------------------------------------------- weapons
def gunshot(kind, seed):
    rng.seed(seed)
    if kind == "pistol":
        n = int(SR * 0.35)
        bang = scale(lp(white(n), 0.5), 1.4)
        thump = scale(sweep(160, 50, n // 2), 0.8)
    elif kind == "shotgun":
        n = int(SR * 0.55)
        bang = scale(lp(white(n), 0.4), 1.7)
        thump = scale(sweep(120, 40, int(n * 0.7)), 1.0)
    else:  # rifle
        n = int(SR * 0.4)
        bang = scale(hp(white(n), 0.25), 1.3)
        thump = scale(sweep(220, 55, n // 2), 0.7)
    e = env(n, attack=0.001, decay=0.12, sustain=0.15, release=0.5)
    crack = scale(hp(white(n // 6), 0.6), 1.2)
    out = mix([b * g for b, g in zip(bang, e)],
              thump + [0] * (n - len(thump)),
              crack + [0] * (n - len(crack)))
    save_wav(f"gun_{kind}", out)


def reload_click():
    n = int(SR * 0.25)
    c1 = scale(hp(white(800), 0.7), 0.8)
    gap = [0.0] * 3000
    c2 = scale(hp(white(1200), 0.6), 0.7)
    out = c1 + gap + c2
    save_wav("reload", out[:n] if len(out) > n else out + [0] * (n - len(out)))


def melee_whoosh():
    n = int(SR * 0.3)
    d = bp(white(n), 0.3, 0.05)
    e = env(n, attack=0.1, decay=0.2, sustain=0.7, release=0.25)
    save_wav("melee_whoosh", [x * g for x, g in zip(d, e)])


def impact_flesh():
    n = int(SR * 0.2)
    d = scale(lp(white(n), 0.3), 1.1)
    thump = scale(sweep(110, 50, n // 2), 0.7)
    e = env(n, attack=0.003, decay=0.15, sustain=0.2, release=0.4)
    save_wav("impact_flesh", [x * g for x, g in zip(mix(d, thump), e)])


def impact_metal():
    n = int(SR * 0.4)
    ring = scale(sweep(900, 300, n, math.sin), 0.5)
    hit = scale(hp(white(n // 4), 0.5), 0.8)
    e = env(n, attack=0.002, decay=0.2, sustain=0.3, release=0.6)
    save_wav("impact_metal", [x * g for x, g in zip(mix(ring, hit + [0] * (n - len(hit))), e)])


# ---------------------------------------------------------------- creatures
def creature_vocal(name, f0, f1, dur, noise_mix, seed):
    rng.seed(seed)
    n = int(SR * dur)
    tone = sweep(f0, f1, n)
    wobble = [0.7 + 0.3 * math.sin(2 * math.pi * 9 * i / SR) for i in range(n)]
    voiced = [t * w for t, w in zip(tone, wobble)]
    breath = scale(bp(white(n), 0.25, 0.08), noise_mix)
    e = env(n, attack=0.08, decay=0.15, sustain=0.75, release=0.25)
    save_wav(name, [x * g for x, g in zip(mix(voiced, breath), e)])


def ui_click():
    n = 2000
    d = scale(hp(white(n), 0.6), 0.35)
    t = scale(sweep(1200, 700, n), 0.2)
    save_wav("ui_click", mix(d, t))


def pickup():
    n = SR // 3
    t1 = scale(sine(660, n), 0.3)
    t2 = scale([0.0] * (n // 2) + sine(990, n // 2), 0.3)
    save_wav("pickup", mix(t1, t2))


def level_up():
    parts = []
    for f in (440, 554, 659, 880):
        parts.append(scale(sine(f, SR // 4), 0.32))
    save_wav("level_up", [s for p in parts for s in p])


def craft_done():
    n = SR // 2
    t = mix(scale(sine(330, n), 0.25), scale(sine(494, n), 0.2))
    e = env(n, attack=0.02, decay=0.2, sustain=0.5, release=0.5)
    save_wav("craft", [x * g for x, g in zip(t, e)])


def door_creak():
    n = SR
    t = sweep(140, 480, n)
    jitter = [1.0 + 0.02 * math.sin(40 * i / SR) for i in range(n)]
    e = env(n, attack=0.05, decay=0.1, sustain=0.8, release=0.3)
    save_wav("door_creak", [x * j * g for x, j, g in zip(t, jitter, e)])


def player_hurt():
    n = int(SR * 0.4)
    g = scale(sweep(220, 90, n), 0.5)
    breath = scale(bp(white(n), 0.3, 0.1), 0.35)
    e = env(n, attack=0.02, decay=0.2, sustain=0.5, release=0.4)
    save_wav("player_hurt", [x * y for x, y in zip(mix(g, breath), e)])


def death_sting():
    n = SR * 3
    a = scale(sweep(196, 49, n), 0.5)
    b = scale(sweep(196.5, 48.7, n), 0.3)
    e = env(n, attack=0.05, decay=0.3, sustain=0.5, release=0.7)
    save_wav("death_sting", [x * g for x, g in zip(mix(a, b), e)])


def main():
    os.makedirs(OUT, exist_ok=True)
    wind_loop()
    rain_loop()
    thunder()
    radio_static()
    campfire()
    drone_tension()
    for i, surf in enumerate(("concrete", "gravel", "wood", "metal")):
        footstep(surf, 100 + i)
    gunshot("pistol", 200)
    gunshot("shotgun", 201)
    gunshot("rifle", 202)
    reload_click()
    melee_whoosh()
    impact_flesh()
    impact_metal()
    creature_vocal("mutant_growl", 70, 45, 1.4, 0.5, 300)
    creature_vocal("mutant_hiss", 300, 900, 0.8, 0.7, 301)
    creature_vocal("mutant_scream", 180, 720, 1.1, 0.6, 302)
    creature_vocal("boss_roar", 48, 38, 2.4, 0.55, 303)
    creature_vocal("boss_roar2", 62, 30, 2.0, 0.5, 304)
    ui_click()
    pickup()
    level_up()
    craft_done()
    door_creak()
    player_hurt()
    death_sting()


if __name__ == "__main__":
    main()
