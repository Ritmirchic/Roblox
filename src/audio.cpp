// audio.cpp - procedural sound synthesis + 3D mixer (no external assets)
#include "frac.h"

Audio g_audio;
static const int SR = 22050;

// ---------------------------------------------------------------- toolbox
struct Synth {
    RNG r;
    float lp = 0, hp = 0, bp = 0;
    float noise() { return r.range(-1.0f, 1.0f); }
    float lowpass(float in, float a) {
        lp += (in - lp) * a;
        return lp;
    }
    float highpass(float in, float a) {
        hp += (in - hp) * a;
        return in - hp;
    }
    float sine(float phase) { return sinf(phase * 2 * PI); }
};

static void normalize(std::vector<short>& s, float target = 0.85f) {
    float mx = 0;
    for (short v : s) mx = fmaxf(mx, fabsf(float(v)) / 32767.0f);
    if (mx < 1e-5f) return;
    float k = target / mx;
    for (short& v : s) {
        float f = float(v) * k;
        v = short(clampf(f, -32767.0f, 32767.0f));
    }
}
static void fadeEdges(std::vector<short>& s, int ms = 4) {
    int n = int(SR * ms / 1000.0f);
    for (int i = 0; i < n && i < int(s.size()); i++) {
        float k = float(i) / n;
        s[i] = short(s[i] * k);
        s[s.size() - 1 - i] = short(s[s.size() - 1 - i] * k);
    }
}

// generic impact: noise burst with a filter sweep + tonal body
static std::vector<short> makeImpact(float dur, float toneFreq, float noiseAmt, float decay,
                                     float brightness) {
    Synth s;
    s.r.seed(7);
    std::vector<short> out(int(SR * dur));
    float phase = 0;
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float env = expf(-t / decay);
        float n = s.lowpass(s.noise(), brightness) * noiseAmt;
        phase += toneFreq * (1.0f + 0.5f * expf(-t * 40)) / SR;
        float tone = s.sine(phase) * (1.0f - noiseAmt) * expf(-t / (decay * 1.6f));
        float v = (n + tone) * env;
        out[i] = short(clampf(v * 32000, -32000, 32000));
    }
    normalize(out);
    fadeEdges(out);
    return out;
}

static std::vector<short> makeExplosion(float dur, float size) {
    Synth s;
    s.r.seed(11);
    std::vector<short> out(int(SR * dur));
    float lp = 0;
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float env = expf(-t / (dur * 0.32f));
        float n = s.noise();
        lp += (n - lp) * (0.02f + 0.5f * expf(-t * 9.0f));
        float rumble = lp * 2.2f;
        float crack = s.highpass(s.noise(), 0.55f) * expf(-t * 30.0f) * 0.6f;
        float sub = sinf(t * 2 * PI * (52.0f - 18.0f * t)) * expf(-t / (dur * 0.4f)) * size;
        float v = (rumble + crack + sub * 0.8f) * env;
        out[i] = short(clampf(v * 30000, -30000, 30000));
    }
    normalize(out);
    fadeEdges(out, 8);
    return out;
}

static std::vector<short> makeGlass() {
    Synth s;
    s.r.seed(23);
    std::vector<short> out(int(SR * 0.9f));
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float v = 0;
        // a handful of high pings
        for (int k = 0; k < 6; k++) {
            float f = 2200 + k * 900 + s.r.f() * 400;
            float st = k * 0.02f;
            if (t > st) v += sinf((t - st) * 2 * PI * f) * expf(-(t - st) * (12 + k * 4)) * 0.22f;
        }
        v += s.highpass(s.noise(), 0.7f) * expf(-t * 22.0f) * 0.5f;
        out[i] = short(clampf(v * 30000, -30000, 30000));
    }
    normalize(out, 0.7f);
    fadeEdges(out);
    return out;
}

static std::vector<short> makeNoiseLoop(float dur, float freq, float amp, int seed,
                                        bool crackle = false) {
    Synth s;
    s.r.seed(seed);
    std::vector<short> out(int(SR * dur));
    float lp2 = 0;
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float n = s.noise();
        lp2 += (n - lp2) * freq;
        float v = lp2 * amp;
        if (crackle) {
            float c = (s.r.f() < 0.0015f) ? s.noise() * 0.8f : 0;
            v += c;
        }
        // loop-safe crossfade at both ends
        float k = 1.0f;
        float fade = 0.15f;
        if (t < fade) k = t / fade;
        if (t > dur - fade) k = (dur - t) / fade;
        out[i] = short(clampf(v * k * 30000, -30000, 30000));
    }
    normalize(out, 0.6f);
    return out;
}

static std::vector<short> makeEngine(float dur, float baseFreq, int seed, float roughness) {
    Synth s;
    s.r.seed(seed);
    std::vector<short> out(int(SR * dur));
    float ph = 0;
    float lp = 0;
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float f = baseFreq * (1.0f + 0.06f * sinf(t * 2 * PI * 3.1f));
        ph += f / SR;
        float saw = (ph - floorf(ph)) * 2.0f - 1.0f;
        float sub = sinf(ph * 2 * PI * 0.5f);
        float n = s.noise() * roughness;
        lp += (n - lp) * 0.25f;
        float v = saw * 0.5f + sub * 0.35f + lp * 0.5f;
        float k = 1.0f;
        float fade = 0.05f;
        if (t < fade) k = t / fade;
        if (t > dur - fade) k = (dur - t) / fade;
        out[i] = short(clampf(v * k * 24000, -24000, 24000));
    }
    normalize(out, 0.55f);
    return out;
}

static std::vector<short> makeBeep(float freq, float dur, float amp = 1.0f) {
    std::vector<short> out(int(SR * dur));
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float env = expf(-t * 9.0f);
        float v = sinf(t * 2 * PI * freq) * env * amp;
        out[i] = short(clampf(v * 26000, -26000, 26000));
    }
    fadeEdges(out, 2);
    return out;
}

static std::vector<short> makeMusicLoop() {
    // dark industrial ambient pad: layered detuned sines + slow filtered noise
    float dur = 12.0f;
    std::vector<short> out(int(SR * dur));
    Synth s;
    s.r.seed(99);
    float lp = 0;
    const float notes[6] = {55.0f, 82.5f, 110.0f, 130.8f, 164.8f, 220.0f};
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float v = 0;
        for (int k = 0; k < 6; k++) {
            float lfo = 0.55f + 0.45f * sinf(t * 0.21f + k * 1.7f);
            v += sinf(t * 2 * PI * notes[k] * (1.0f + 0.002f * k)) * 0.11f * lfo;
        }
        float n = s.noise();
        lp += (n - lp) * 0.02f;
        v += lp * (0.35f + 0.25f * sinf(t * 0.13f));
        // slow swell
        v *= 0.55f + 0.45f * (0.5f + 0.5f * sinf(t * 0.4f));
        float k2 = 1.0f;
        if (t < 0.6f) k2 = t / 0.6f;
        if (t > dur - 0.6f) k2 = (dur - t) / 0.6f;
        out[i] = short(clampf(v * k2 * 26000, -26000, 26000));
    }
    normalize(out, 0.45f);
    return out;
}

static std::vector<short> makeCutter() {
    Synth s;
    s.r.seed(41);
    std::vector<short> out(int(SR * 0.6f));
    for (size_t i = 0; i < out.size(); i++) {
        float t = float(i) / SR;
        float v = s.highpass(s.noise(), 0.6f) * 0.5f +
                  sinf(t * 2 * PI * 160.0f) * 0.25f;
        float env = fminf(1.0f, t * 20.0f) * expf(-t * 2.5f);
        out[i] = short(clampf(v * env * 28000, -28000, 28000));
    }
    normalize(out, 0.6f);
    return out;
}

// ---------------------------------------------------------------- init
void Audio::init() {
    for (int i = 0; i < SND_COUNT; i++) activeLoops[i] = -1;
    generateSounds();
    voices.reserve(64);
}

void Audio::generateSounds() {
    auto set = [&](int id, std::vector<short>&& v) { samples[id] = std::move(v); };
    set(SND_HAMMER, makeImpact(0.42f, 90.0f, 0.72f, 0.11f, 0.35f));
    set(SND_HAMMER_METAL, makeImpact(0.55f, 320.0f, 0.45f, 0.2f, 0.7f));
    set(SND_GLASS_BREAK, makeGlass());
    set(SND_CONCRETE_BREAK, makeImpact(0.6f, 70.0f, 0.85f, 0.18f, 0.25f));
    set(SND_WOOD_BREAK, makeImpact(0.45f, 130.0f, 0.7f, 0.13f, 0.45f));
    set(SND_METAL_BREAK, makeImpact(0.7f, 240.0f, 0.5f, 0.28f, 0.85f));
    set(SND_EXPLOSION, makeExplosion(1.6f, 0.6f));
    set(SND_EXPLOSION_BIG, makeExplosion(3.0f, 1.0f));
    set(SND_RUBBLE, makeImpact(0.9f, 45.0f, 0.95f, 0.35f, 0.2f));
    set(SND_GUNSHOT, makeImpact(0.34f, 60.0f, 0.95f, 0.09f, 0.55f));
    set(SND_RELOAD, makeImpact(0.22f, 700.0f, 0.6f, 0.05f, 0.9f));
    set(SND_ROCKET_FIRE, makeNoiseLoop(0.9f, 0.15f, 0.9f, 5));
    set(SND_BLOWTORCH, makeNoiseLoop(0.6f, 0.35f, 0.7f, 6));
    set(SND_DRILL, makeEngine(0.7f, 70.0f, 8, 0.35f));
    set(SND_FOOTSTEP, makeImpact(0.14f, 110.0f, 0.9f, 0.03f, 0.25f));
    set(SND_FOOTSTEP_HARD, makeImpact(0.16f, 320.0f, 0.85f, 0.035f, 0.6f));
    set(SND_JUMP, makeImpact(0.12f, 180.0f, 0.8f, 0.03f, 0.35f));
    set(SND_LAND, makeImpact(0.3f, 90.0f, 0.9f, 0.07f, 0.3f));
    set(SND_ENGINE, makeEngine(1.5f, 62.0f, 3, 0.18f));
    set(SND_ENGINE_IDLE, makeEngine(1.5f, 42.0f, 4, 0.12f));
    set(SND_BEEP, makeBeep(880, 0.1f));
    set(SND_CHARGE_BEEP, makeBeep(1400, 0.07f, 0.8f));
    set(SND_ALARM_BEEP, makeBeep(620, 0.4f, 0.7f));
    set(SND_UI_CLICK, makeBeep(1200, 0.06f, 0.6f));
    set(SND_UI_HOVER, makeBeep(1500, 0.035f, 0.35f));
    set(SND_COLLAPSE, makeImpact(2.4f, 42.0f, 0.98f, 0.75f, 0.12f));
    set(SND_CREAK, makeImpact(0.9f, 220.0f, 0.7f, 0.35f, 0.5f));
    set(SND_FIRE, makeNoiseLoop(1.5f, 0.08f, 0.9f, 12, true));
    set(SND_PLACE, makeImpact(0.2f, 400.0f, 0.7f, 0.05f, 0.7f));
    set(SND_GRAPPLE, makeImpact(0.3f, 900.0f, 0.6f, 0.06f, 0.9f));
    set(SND_HOOK_HIT, makeImpact(0.25f, 650.0f, 0.6f, 0.05f, 0.85f));
    set(SND_CABLE, makeImpact(0.5f, 300.0f, 0.5f, 0.2f, 0.6f));
    set(SND_EXTINGUISH, makeNoiseLoop(0.8f, 0.45f, 0.85f, 14));
    set(SND_AIRSTRIKE, makeNoiseLoop(2.5f, 0.06f, 0.8f, 15));
    set(SND_ALARM, makeBeep(720, 0.7f, 0.8f));
    set(SND_PICKUP, makeImpact(0.2f, 520.0f, 0.4f, 0.05f, 0.8f));
    set(SND_THROW, makeNoiseLoop(0.35f, 0.2f, 0.7f, 16));
    set(SND_WIND, makeNoiseLoop(3.0f, 0.02f, 0.9f, 17));
    set(SND_RAIN, makeNoiseLoop(3.0f, 0.35f, 0.55f, 18));
    set(SND_GLASS_HIT, makeGlass());
    set(SND_DIRT, makeImpact(0.35f, 65.0f, 0.95f, 0.1f, 0.18f));
    set(SND_CRASH_SOFT, makeImpact(0.55f, 80.0f, 0.9f, 0.16f, 0.35f));
    set(SND_CUTTER, makeCutter());
    set(SND_DETONATE, makeBeep(1000, 0.12f, 0.9f));
    set(SND_FIRE_CRACKLE, makeNoiseLoop(1.2f, 0.1f, 0.8f, 19, true));
    set(SND_WOOD_HIT, makeImpact(0.3f, 150.0f, 0.7f, 0.08f, 0.5f));
    set(SND_METAL_HIT, makeImpact(0.4f, 420.0f, 0.4f, 0.14f, 0.8f));
    set(SND_STONE_HIT, makeImpact(0.35f, 95.0f, 0.85f, 0.1f, 0.3f));
    set(SND_ROCKET_LOOP, makeNoiseLoop(0.8f, 0.12f, 0.8f, 20));
    set(SND_AMB_CITY, makeNoiseLoop(4.0f, 0.03f, 0.5f, 21));
    set(SND_AMB_INDUSTRIAL, makeNoiseLoop(4.0f, 0.05f, 0.5f, 22));
    set(SND_AMB_WIND, makeNoiseLoop(4.0f, 0.02f, 0.5f, 23));
    set(SND_MUSIC_LOOP, makeMusicLoop());
    set(SND_PLANK, makeImpact(0.25f, 240.0f, 0.7f, 0.06f, 0.55f));
}

// ---------------------------------------------------------------- playback
void Audio::play(int snd, const Vec3& p, float vol, float pitch, bool spatial) {
    if (!enabled || snd < 0 || snd >= SND_COUNT) return;
    if (samples[snd].empty()) return;
    if (int(voices.size()) > 40) return;
    AudioVoice v;
    v.snd = snd;
    v.pos3d[0] = p.x;
    v.pos3d[1] = p.y;
    v.pos3d[2] = p.z;
    v.vol = vol * (spatial ? 1.0f : 1.0f);
    v.pitch = pitch;
    v.pan = 0;
    v.loop = false;
    v.loopId = -1;
    v.alive = true;
    v.startTime = platformTime();
    voices.push_back(v);
    (void)spatial;
}

void Audio::play2d(int snd, float vol, float pitch) {
    if (!enabled || snd < 0 || snd >= SND_COUNT) return;
    if (samples[snd].empty()) return;
    if (int(voices.size()) > 40) return;
    AudioVoice v;
    v.snd = snd;
    v.pos3d[0] = v.pos3d[1] = v.pos3d[2] = 0;
    v.vol = vol;
    v.pitch = pitch;
    v.pan = 0;
    v.loop = false;
    v.loopId = -1;
    v.alive = true;
    v.startTime = platformTime();
    v.snd |= 0x1000;   // flag: 2d
    voices.push_back(v);
}

int Audio::playLoop(int snd, const Vec3& p, float vol) {
    if (!enabled || snd < 0 || snd >= SND_COUNT) return -1;
    if (samples[snd].empty()) return -1;
    AudioVoice v;
    v.snd = snd;
    v.pos3d[0] = p.x;
    v.pos3d[1] = p.y;
    v.pos3d[2] = p.z;
    v.vol = vol;
    v.pitch = 1;
    v.pan = 0;
    v.loop = true;
    v.loopId = int(voices.size());
    v.alive = true;
    v.startTime = platformTime();
    voices.push_back(v);
    return int(voices.size()) - 1;
}

void Audio::stopLoop(int id) {
    for (auto& v : voices)
        if (v.loop && v.loopId == id) v.alive = false;
}

void Audio::update(const Vec3& listener, const Vec3& right) {
    (void)listener;
    (void)right;
    for (int i = int(voices.size()) - 1; i >= 0; i--) {
        AudioVoice& v = voices[i];
        double now = platformTime();
        bool is2d = (v.snd & 0x1000) != 0;
        int snd = v.snd & 0xFFF;
        if (!v.loop && !is2d) {
            double dur = double(samples[snd].size()) / SR;
            if (now - v.startTime > dur) v.alive = false;
        }
        if (!v.alive) voices.erase(voices.begin() + i);
    }
}

// positional mixing
static float voiceSample(const std::vector<short>& buf, double posFraction) {
    if (buf.empty()) return 0;
    double idx = posFraction * double(buf.size());
    int i0 = int(idx) % int(buf.size());
    int i1 = (i0 + 1) % int(buf.size());
    float f = float(idx - floor(idx));
    return (buf[i0] * (1 - f) + buf[i1] * f) * (1.0f / 32768.0f);
}

void Audio::mix(float* out, int frames, int channels, const Vec3& listener, const Vec3& right) {
    memset(out, 0, sizeof(float) * frames * channels);
    if (!enabled) return;
    double now = platformTime();
    for (auto& v : voices) {
        bool is2d = (v.snd & 0x1000) != 0;
        int snd = v.snd & 0xFFF;
        if (snd < 0 || snd >= SND_COUNT) continue;
        const std::vector<short>& buf = samples[snd];
        if (buf.empty()) continue;
        double dur = double(buf.size()) / SR;
        double t = now - v.startTime;
        float atten = 1.0f;
        float pan = 0;
        if (!is2d) {
            Vec3 p(v.pos3d[0], v.pos3d[1], v.pos3d[2]);
            Vec3 d = p - listener;
            float dist = length(d);
            atten = clampf(1.0f - dist / 60.0f, 0.0f, 1.0f);
            atten *= atten;
            if (dist > 1.0f) {
                Vec3 dirN = d / dist;
                pan = clampf(dot(dirN, right), -1.0f, 1.0f) * 0.75f;
            }
        }
        atten *= 1.0f / (1.0f + 0.7f * (1.0f - atten));
        float vol = v.vol * sfxVol * master * atten;
        if (vol < 0.002f) continue;
        if (!v.loop && t > dur) continue;
        double start = v.loop ? fmod(t, dur) : 0.0;
        float lGain = sqrtf(0.5f * (1.0f - pan));
        float rGain = sqrtf(0.5f * (1.0f + pan));
        for (int i = 0; i < frames; i++) {
            double tt = (t + double(i) / SR) * v.pitch;
            double frac;
            if (v.loop) {
                frac = fmod(tt, dur) / dur;
            } else {
                if (tt > dur) break;
                frac = tt / dur;
            }
            float s = voiceSample(buf, frac) * vol;
            if (channels >= 2) {
                out[i * channels + 0] += s * lGain * 1.41f;
                out[i * channels + 1] += s * rGain * 1.41f;
            } else {
                out[i * channels] += s;
            }
        }
        (void)start;
    }
    // soft limiter
    for (int i = 0; i < frames * channels; i++) {
        float x = out[i];
        out[i] = clampf(x - x * x * x * 0.25f, -1.0f, 1.0f);
    }
}
