// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Procedural audio implementation (waveOut, 44.1 kHz mono).
//
//  Voices are synthesised at runtime, mixed on the main thread into a ring
//  buffer and consumed by a waveOut callback thread.
// ============================================================================
#include "game/audio.h"
#include "core/util.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <thread>
#include <atomic>
#include <mutex>

#ifdef _WIN32
#include <windows.h>
#include <mmsystem.h>
#endif

namespace aoh {

static const int SAMPLE_RATE = 44100;
static const int RING_FRAMES = 8192;

// ---------------------------------------------------------------------------
namespace {
struct NoiseRng {
  u32 s = 12345;
  float next() {
    s = s * 1664525u + 1013904223u;
    return ((float)((s >> 8) & 0xFFFF) / 32768.0f) - 1.0f;
  }
};
} // namespace

// ---------------------------------------------------------------------------
#ifdef _WIN32
namespace {

static const int BUF_FRAMES = 1024;
static const int NUM_BUF = 4;

struct WaveOutImpl {
  HWAVEOUT out = nullptr;
  WAVEHDR hdr[NUM_BUF];
  short* buf[NUM_BUF];
  std::atomic<bool> running{false};
  std::thread thread;
  std::mutex mtx;
  std::vector<short> ring;
  size_t readPos = 0;

  void callback() {
    // Prime every buffer with silence.
    for (int i = 0; i < NUM_BUF; ++i) {
      waveOutPrepareHeader(out, &hdr[i], sizeof(WAVEHDR));
      waveOutWrite(out, &hdr[i], sizeof(WAVEHDR));
    }
    while (running.load()) {
      Sleep(4);
      for (int i = 0; i < NUM_BUF; ++i) {
        if (!(hdr[i].dwFlags & WHDR_DONE)) continue;
        waveOutUnprepareHeader(out, &hdr[i], sizeof(WAVEHDR));
        {
          std::lock_guard<std::mutex> lock(mtx);
          short* dst = buf[i];
          for (int k = 0; k < BUF_FRAMES; ++k) {
            short v = 0;
            if (readPos < ring.size()) v = ring[readPos++];
            dst[k] = v;
          }
        }
        waveOutPrepareHeader(out, &hdr[i], sizeof(WAVEHDR));
        waveOutWrite(out, &hdr[i], sizeof(WAVEHDR));
      }
    }
    for (int i = 0; i < NUM_BUF; ++i) {
      if (hdr[i].dwFlags & WHDR_PREPARED) waveOutUnprepareHeader(out, &hdr[i], sizeof(WAVEHDR));
    }
  }
};

WaveOutImpl* g_impl = nullptr;

} // namespace
#endif

// ---------------------------------------------------------------------------
bool AudioSystem::init() {
  m_samples.clear();
  m_voices.clear();
  synthesise();
  m_voices.resize(24);
#ifdef _WIN32
  WaveOutImpl* wi = new WaveOutImpl();
  wi->ring.assign(RING_FRAMES, 0);
  WAVEFORMATEX wf;
  std::memset(&wf, 0, sizeof(wf));
  wf.wFormatTag = WAVE_FORMAT_PCM;
  wf.nChannels = 1;
  wf.nSamplesPerSec = SAMPLE_RATE;
  wf.wBitsPerSample = 16;
  wf.nBlockAlign = 2;
  wf.nAvgBytesPerSec = SAMPLE_RATE * 2;
  if (waveOutOpen(&wi->out, WAVE_MAPPER, &wf, 0, 0, CALLBACK_NULL) != MMSYSERR_NOERROR) {
    delete wi;
    m_ready = false;
    LOGW("audio: waveOut unavailable, running silent");
    return false;
  }
  for (int i = 0; i < NUM_BUF; ++i) {
    wi->buf[i] = new short[BUF_FRAMES];
    std::memset(wi->buf[i], 0, BUF_FRAMES * 2);
    std::memset(&wi->hdr[i], 0, sizeof(WAVEHDR));
    wi->hdr[i].lpData = (LPSTR)wi->buf[i];
    wi->hdr[i].dwBufferLength = BUF_FRAMES * 2;
  }
  wi->running.store(true);
  wi->thread = std::thread([wi]() { wi->callback(); });
  g_impl = wi;
  m_ready = true;
  LOGI("audio: waveOut ready (%d synthesised sounds)", (int)m_samples.size());
#else
  m_ready = true;
#endif
  return true;
}

void AudioSystem::shutdown() {
  if (!m_ready) return;
#ifdef _WIN32
  if (g_impl) {
    g_impl->running.store(false);
    if (g_impl->thread.joinable()) g_impl->thread.join();
    for (int i = 0; i < NUM_BUF; ++i) {
      if (g_impl->hdr[i].dwFlags & WHDR_PREPARED) waveOutUnprepareHeader(g_impl->out, &g_impl->hdr[i], sizeof(WAVEHDR));
      delete[] g_impl->buf[i];
      g_impl->buf[i] = nullptr;
    }
    waveOutClose(g_impl->out);
    delete g_impl;
    g_impl = nullptr;
  }
#endif
  m_ready = false;
}

// ---------------------------------------------------------------------------
void AudioSystem::setListener(const Vec3& pos, const Vec3& forward) {
  m_listener = pos;
  m_forward = forward;
}

void AudioSystem::play(SoundId id, const Vec3& pos, f32 volume, f32 pitch) {
  if (!m_ready || id < 0 || id >= SND_COUNT) return;
  if (m_voices.empty()) return;
  Voice* chosen = nullptr;
  for (Voice& v : m_voices) {
    if (!v.active) { chosen = &v; break; }
  }
  if (!chosen) {
    chosen = &m_voices[0];
    for (Voice& v : m_voices) if (v.age > chosen->age) chosen = &v;
  }
  chosen->sample = &m_samples[(size_t)id];
  chosen->pos = pos;
  chosen->volume = volume;
  chosen->pitch = pitch;
  chosen->cursor = 0.0f;
  chosen->age = 0.0f;
  chosen->active = true;
}

void AudioSystem::playUI(SoundId id, f32 volume) {
  play(id, m_listener, volume, 1.0f);
}

void AudioSystem::setAmbience(f32 wind, f32 drone, f32 rain) {
  m_wind = wind; m_drone = drone; m_rain = rain;
}

// ---------------------------------------------------------------------------
void AudioSystem::update(f32 dt) {
  // Advance the voices.
  for (Voice& v : m_voices) {
    if (!v.active) continue;
    v.age += dt;
    v.cursor += dt * v.pitch;
    if (!v.sample || v.cursor >= v.sample->duration) v.active = false;
  }
  if (!m_ready) return;
#ifdef _WIN32
  if (!g_impl) return;
  std::lock_guard<std::mutex> lock(g_impl->mtx);
  // Mix voices into the ring buffer.  The worker thread consumes it.
  static size_t writePos = 0;
  int frames = (int)(dt * SAMPLE_RATE);
  if (frames <= 0) return;
  if (frames > 2048) frames = 2048;
  for (int f = 0; f < frames; ++f) {
    float mix = 0.0f;
    for (const Voice& v : m_voices) {
      if (!v.active || !v.sample) continue;
      const Sample& s = *v.sample;
      size_t idx = (size_t)(v.cursor * SAMPLE_RATE) + f;
      if (idx >= s.data.size()) continue;
      float atten = 1.0f;
      float d = dist(v.pos, m_listener);
      if (d > 1.0f) atten = 26.0f / (d * (1.0f + d * 0.12f));
      mix += (float)s.data[idx] / 32768.0f * v.volume * atten;
    }
    // ambience bed
    m_ambPhase += dt * 0.37f;
    float wind = sinf(m_ambPhase * 7.3f) * 0.5f + sinf(m_ambPhase * 13.7f) * 0.25f;
    mix += wind * m_wind * 0.035f;
    mix += sinf(m_ambPhase * 2.1f) * m_drone * 0.03f;
    if (mix > 1.0f) mix = 1.0f;
    if (mix < -1.0f) mix = -1.0f;
    short out = (short)(mix * 30000.0f);
    size_t wp = writePos % g_impl->ring.size();
    g_impl->ring[wp] = out;
    writePos++;
  }
#endif
}

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------
AudioSystem::Sample AudioSystem::makeGunshot(int kind) {
  NoiseRng rng;
  Sample s;
  float dur = (kind == 2) ? 0.55f : (kind == 1 ? 0.40f : 0.28f);
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f, lp2 = 0.0f;
  float crack = (kind == 2) ? 0.55f : (kind == 1 ? 0.85f : 1.0f);
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * (kind == 2 ? 6.0f : 14.0f));
    float noise = rng.next();
    lp += (noise - lp) * (kind == 2 ? 0.18f : 0.55f);
    float body = sinf(2.0f * PI * (kind == 2 ? 55.0f : 90.0f) * t) * expf(-t * 12.0f);
    float v = (lp * crack + body * 0.6f) * env;
    lp2 += (v - lp2) * 0.9f;
    s.data[i] = (short)(std::max(-1.0f, std::min(1.0f, lp2 * 0.85f)) * 30000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeSwing() {
  NoiseRng rng;
  Sample s;
  float dur = 0.26f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = sinf(PI * (t / dur));
    float noise = rng.next();
    lp += (noise - lp) * (0.05f + 0.35f * (t / dur));
    s.data[i] = (short)(lp * env * 9000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeImpact(float low) {
  NoiseRng rng;
  Sample s;
  float dur = 0.22f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * (low > 0.5f ? 18.0f : 30.0f));
    float noise = rng.next();
    lp += (noise - lp) * 0.25f;
    float body = sinf(2.0f * PI * 70.0f * t) * expf(-t * 22.0f);
    s.data[i] = (short)((lp * 0.6f + body * 0.7f) * env * 20000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeClick(float pitch) {
  Sample s;
  float dur = 0.09f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * 45.0f);
    float v = sinf(2.0f * PI * 1400.0f * pitch * t) * env;
    v += sinf(2.0f * PI * 320.0f * pitch * t) * env * 0.4f;
    s.data[i] = (short)(v * 12000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeFootstep() {
  NoiseRng rng;
  Sample s;
  float dur = 0.13f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * 34.0f);
    float noise = rng.next();
    lp += (noise - lp) * 0.45f;
    s.data[i] = (short)(lp * env * 11000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeScream(bool boss) {
  NoiseRng rng;
  Sample s;
  float dur = boss ? 1.7f : 1.0f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float phase = 0.0f, phase2 = 0.0f, lp = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float k = t / dur;
    float env = sinf(PI * k) * (boss ? 1.0f : 0.85f);
    float base = boss ? 105.0f : 320.0f;
    float f = base * (1.0f + 0.5f * sinf(k * 22.0f)) * (1.0f - 0.45f * k);
    phase += 2.0f * PI * f / SAMPLE_RATE;
    phase2 += 2.0f * PI * f * 2.02f / SAMPLE_RATE;
    float tone = sinf(phase) * 0.55f + sinf(phase2) * 0.35f;
    float noise = rng.next();
    lp += (noise - lp) * 0.12f;
    float v = (tone + lp * 0.5f) * env;
    s.data[i] = (short)(std::max(-1.0f, std::min(1.0f, v)) * 26000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeRadio() {
  NoiseRng rng;
  Sample s;
  float dur = 0.6f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f, hp = 0.0f, prev = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * 5.0f) * (0.6f + 0.4f * sinf(2.0f * PI * 7.0f * t));
    float noise = rng.next();
    lp += (noise - lp) * 0.35f;
    hp = 0.92f * (hp + lp - prev);
    prev = lp;
    float whistle = sinf(2.0f * PI * 1800.0f * t) * 0.12f;
    s.data[i] = (short)((hp * 0.6f + whistle) * env * 9000.0f);
  }
  s.duration = dur;
  return s;
}

AudioSystem::Sample AudioSystem::makeExplosion() {
  NoiseRng rng;
  Sample s;
  float dur = 1.4f;
  int n = (int)(SAMPLE_RATE * dur);
  s.data.resize(n);
  float lp = 0.0f;
  for (int i = 0; i < n; ++i) {
    float t = (float)i / SAMPLE_RATE;
    float env = expf(-t * 2.6f);
    float noise = rng.next();
    lp += (noise - lp) * (0.5f - 0.35f * (t / dur));
    float body = sinf(2.0f * PI * 42.0f * t) * expf(-t * 3.2f);
    s.data[i] = (short)((lp * 0.9f + body * 0.8f) * env * 26000.0f);
  }
  s.duration = dur;
  return s;
}

void AudioSystem::synthesise() {
  m_samples.resize(SND_COUNT);
  m_samples[SND_GUNSHOT_PISTOL] = makeGunshot(0);
  m_samples[SND_GUNSHOT_RIFLE] = makeGunshot(1);
  m_samples[SND_GUNSHOT_SHOTGUN] = makeGunshot(2);
  m_samples[SND_MELEE_SWING] = makeSwing();
  m_samples[SND_MELEE_HIT] = makeImpact(0.6f);
  m_samples[SND_RELOAD] = makeClick(0.8f);
  m_samples[SND_FOOTSTEP] = makeFootstep();
  m_samples[SND_JUMP] = makeImpact(0.2f);
  m_samples[SND_LAND] = makeImpact(0.4f);
  m_samples[SND_PICKUP] = makeClick(1.6f);
  m_samples[SND_UI_CLICK] = makeClick(1.0f);
  m_samples[SND_UI_HOVER] = makeClick(1.3f);
  m_samples[SND_PLAYER_HURT] = makeImpact(0.8f);
  m_samples[SND_MUTANT_SCREAM] = makeScream(false);
  m_samples[SND_MUTANT_DEATH] = makeImpact(0.9f);
  m_samples[SND_BOSS_ROAR] = makeScream(true);
  m_samples[SND_EXPLOSION] = makeExplosion();
  m_samples[SND_HEARTBEAT] = makeImpact(0.1f);
  m_samples[SND_BREATH] = makeSwing();
  m_samples[SND_RADIO] = makeRadio();
  m_samples[SND_DOOR] = makeImpact(0.3f);
}

} // namespace aoh
