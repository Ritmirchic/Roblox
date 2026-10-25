/**
 * Procedural audio. Every sound is synthesised with WebAudio — no external
 * files, fully original, and it honours the browser autoplay gesture rule by
 * staying silent until `unlock()` is called from a real input event.
 */

type SfxName =
  | 'uiHover'
  | 'uiClick'
  | 'uiBack'
  | 'deny'
  | 'place'
  | 'fuse'
  | 'getCard'
  | 'draft'
  | 'coin'
  | 'shoot'
  | 'shootFrost'
  | 'shootVerdant'
  | 'shootVolt'
  | 'shootUmbral'
  | 'hit'
  | 'kill'
  | 'leak'
  | 'waveStart'
  | 'waveClear'
  | 'boss'
  | 'victory'
  | 'defeat'
  | 'upgrade'
  | 'heal'
  | 'unlock';

interface Voice {
  freq: number;
  endFreq?: number;
  dur: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
  detune?: number;
}

const SOUNDS: Record<SfxName, Voice[]> = {
  uiHover: [{ freq: 940, dur: 0.045, type: 'sine', gain: 0.035 }],
  uiClick: [
    { freq: 520, endFreq: 700, dur: 0.07, type: 'triangle', gain: 0.09 },
    { freq: 1180, dur: 0.04, type: 'sine', gain: 0.05, delay: 0.03 },
  ],
  uiBack: [{ freq: 420, endFreq: 300, dur: 0.09, type: 'triangle', gain: 0.07 }],
  deny: [
    { freq: 180, endFreq: 120, dur: 0.14, type: 'square', gain: 0.055 },
    { freq: 90, endFreq: 70, dur: 0.18, type: 'sawtooth', gain: 0.04 },
  ],
  place: [
    { freq: 220, endFreq: 150, dur: 0.16, type: 'triangle', gain: 0.12 },
    { freq: 660, endFreq: 880, dur: 0.2, type: 'sine', gain: 0.07, delay: 0.02 },
    { freq: 1320, dur: 0.22, type: 'sine', gain: 0.025, delay: 0.05 },
  ],
  fuse: [
    { freq: 150, endFreq: 420, dur: 0.5, type: 'sawtooth', gain: 0.06, filter: { type: 'lowpass', freq: 900 } },
    { freq: 620, endFreq: 1240, dur: 0.45, type: 'triangle', gain: 0.08, delay: 0.06 },
    { freq: 1860, dur: 0.5, type: 'sine', gain: 0.05, delay: 0.18 },
  ],
  getCard: [
    { freq: 700, endFreq: 1050, dur: 0.12, type: 'triangle', gain: 0.07 },
    { freq: 1400, dur: 0.1, type: 'sine', gain: 0.035, delay: 0.05 },
  ],
  draft: [
    { freq: 330, dur: 0.3, type: 'sine', gain: 0.05 },
    { freq: 495, dur: 0.34, type: 'sine', gain: 0.045, delay: 0.08 },
    { freq: 660, dur: 0.4, type: 'sine', gain: 0.04, delay: 0.16 },
  ],
  coin: [
    { freq: 1180, dur: 0.06, type: 'square', gain: 0.035 },
    { freq: 1560, dur: 0.09, type: 'square', gain: 0.03, delay: 0.05 },
  ],
  shoot: [{ freq: 620, endFreq: 300, dur: 0.08, type: 'triangle', gain: 0.045 }],
  shootFrost: [{ freq: 1500, endFreq: 900, dur: 0.09, type: 'sine', gain: 0.035 }],
  shootVerdant: [{ freq: 420, endFreq: 640, dur: 0.1, type: 'triangle', gain: 0.035 }],
  shootVolt: [{ freq: 1800, endFreq: 2400, dur: 0.05, type: 'square', gain: 0.028 }],
  shootUmbral: [{ freq: 300, endFreq: 170, dur: 0.11, type: 'sawtooth', gain: 0.035 }],
  hit: [{ freq: 240, endFreq: 170, dur: 0.05, type: 'triangle', gain: 0.03 }],
  kill: [
    { freq: 300, endFreq: 120, dur: 0.18, type: 'triangle', gain: 0.05 },
    { freq: 900, endFreq: 600, dur: 0.1, type: 'sine', gain: 0.02, delay: 0.02 },
  ],
  leak: [
    { freq: 140, endFreq: 60, dur: 0.42, type: 'sawtooth', gain: 0.1, filter: { type: 'lowpass', freq: 400 } },
    { freq: 70, dur: 0.35, type: 'square', gain: 0.06, delay: 0.05 },
  ],
  waveStart: [
    { freq: 196, dur: 0.5, type: 'sine', gain: 0.06 },
    { freq: 294, dur: 0.5, type: 'sine', gain: 0.05, delay: 0.12 },
    { freq: 392, dur: 0.6, type: 'sine', gain: 0.045, delay: 0.24 },
  ],
  waveClear: [
    { freq: 523, dur: 0.3, type: 'sine', gain: 0.06 },
    { freq: 659, dur: 0.3, type: 'sine', gain: 0.055, delay: 0.1 },
    { freq: 784, dur: 0.45, type: 'sine', gain: 0.05, delay: 0.2 },
    { freq: 1046, dur: 0.6, type: 'sine', gain: 0.04, delay: 0.32 },
  ],
  boss: [
    { freq: 110, endFreq: 82, dur: 0.9, type: 'sawtooth', gain: 0.09, filter: { type: 'lowpass', freq: 320 } },
    { freq: 55, dur: 1.1, type: 'sine', gain: 0.09 },
    { freq: 220, endFreq: 196, dur: 0.8, type: 'triangle', gain: 0.05, delay: 0.2 },
  ],
  victory: [
    { freq: 523, dur: 0.4, type: 'triangle', gain: 0.06 },
    { freq: 659, dur: 0.4, type: 'triangle', gain: 0.055, delay: 0.14 },
    { freq: 784, dur: 0.4, type: 'triangle', gain: 0.05, delay: 0.28 },
    { freq: 1046, dur: 1.0, type: 'sine', gain: 0.055, delay: 0.42 },
    { freq: 1568, dur: 1.2, type: 'sine', gain: 0.03, delay: 0.58 },
  ],
  defeat: [
    { freq: 330, endFreq: 220, dur: 0.5, type: 'triangle', gain: 0.06 },
    { freq: 247, endFreq: 165, dur: 0.7, type: 'triangle', gain: 0.05, delay: 0.25 },
    { freq: 165, endFreq: 110, dur: 1.1, type: 'sine', gain: 0.06, delay: 0.5 },
  ],
  upgrade: [
    { freq: 660, endFreq: 1320, dur: 0.22, type: 'triangle', gain: 0.06 },
    { freq: 1980, dur: 0.25, type: 'sine', gain: 0.03, delay: 0.08 },
  ],
  heal: [
    { freq: 660, endFreq: 990, dur: 0.3, type: 'sine', gain: 0.05 },
    { freq: 1320, dur: 0.35, type: 'sine', gain: 0.025, delay: 0.1 },
  ],
  unlock: [
    { freq: 392, dur: 0.25, type: 'triangle', gain: 0.05 },
    { freq: 587, dur: 0.25, type: 'triangle', gain: 0.05, delay: 0.1 },
    { freq: 880, dur: 0.6, type: 'sine', gain: 0.05, delay: 0.2 },
  ],
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private unlocked = false;
  private volumes = { master: 0.8, music: 0.55, sfx: 0.8 };
  private noiseBuffer: AudioBuffer | null = null;
  private lastSfxAt = new Map<string, number>();
  private musicTimer: number | null = null;
  private musicIntensity = 0;
  private nextNoteTime = 0;
  private step = 0;
  private droneNodes: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode }[] = [];
  private enabled = true;

  /** Current volume settings (read-only view for UI and tests). */
  get levels(): { master: number; music: number; sfx: number } {
    return { ...this.volumes };
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
          this.enabled = false;
          return;
        }
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volumes.master;
        this.master.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.volumes.sfx;
        this.sfxBus.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = this.volumes.music * 0.6;
        this.musicBus.connect(this.master);
        this.noiseBuffer = this.createNoise();
      }
      void this.ctx.resume();
      this.unlocked = true;
      this.startMusic();
    } catch {
      this.enabled = false;
    }
  }

  setVolumes(v: { master: number; music: number; sfx: number }): void {
    this.volumes = { ...v };
    if (this.master) this.master.gain.value = v.master;
    if (this.sfxBus) this.sfxBus.gain.value = v.sfx;
    if (this.musicBus) this.musicBus.gain.value = v.music * 0.6;
  }

  setMusicIntensity(intensity: number): void {
    this.musicIntensity = Math.max(0, Math.min(1, intensity));
  }

  play(name: SfxName, opts: { volume?: number; pitch?: number } = {}): void {
    if (!this.unlocked || !this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const last = this.lastSfxAt.get(name) ?? -1;
    // Rate limit spammy combat sounds.
    if (now - last < 0.035) return;
    this.lastSfxAt.set(name, now);
    const voices = SOUNDS[name];
    if (!voices) return;
    const pitch = opts.pitch ?? 1;
    const volume = opts.volume ?? 1;
    for (const v of voices) {
      this.voice(v, now, pitch, volume);
    }
  }

  private voice(v: Voice, now: number, pitch: number, volume: number): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;
    const start = now + (v.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = v.type;
    osc.frequency.setValueAtTime(v.freq * pitch, start);
    if (v.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, v.endFreq * pitch),
        start + v.dur,
      );
    }
    if (v.detune) osc.detune.value = v.detune;
    const peak = Math.max(0.0001, v.gain * volume);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, v.dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + v.dur);
    let node: AudioNode = gain;
    if (v.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = v.filter.type;
      filter.frequency.value = v.filter.freq;
      if (v.filter.q) filter.Q.value = v.filter.q;
      gain.connect(filter);
      node = filter;
    }
    osc.connect(gain);
    node.connect(bus);
    osc.start(start);
    osc.stop(start + v.dur + 0.02);
  }

  private createNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    return buffer;
  }

  /** Low, slow procedural score: drone pad + sparse pentatonic bells. */
  private startMusic(): void {
    if (!this.ctx || !this.musicBus || this.musicTimer !== null) return;
    const ctx = this.ctx;
    const bus = this.musicBus;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    droneGain.connect(filter);
    filter.connect(bus);
    const base = 55;
    for (const [i, mult] of [1, 1.5, 2.0].entries()) {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = base * mult;
      osc.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.6 : 0.22;
      osc.connect(g);
      g.connect(droneGain);
      osc.start();
      this.droneNodes.push({ osc, gain: g, filter });
    }
    this.nextNoteTime = ctx.currentTime + 0.5;
    this.step = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 120);
  }

  /** D minor pentatonic + occasional colour tone. */
  private scheduleMusic(): void {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus || !this.unlocked) return;
    const tempo = 0.42 - this.musicIntensity * 0.12;
    let guard = 0;
    while (this.nextNoteTime < ctx.currentTime + 0.6 && guard < 8) {
      guard++;
      const step = this.step++;
      const scale = [293.66, 329.63, 349.23, 392.0, 440.0, 587.33, 659.25];
      const intensity = this.musicIntensity;
      const playBell = intensity > 0.05 ? step % 2 === 0 : step % 4 === 0;
      if (playBell) {
        const freq = scale[(step * 3) % scale.length] as number;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * (step % 5 === 0 ? 2 : 1);
        const t = this.nextNoteTime;
        const dur = 1.6;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.05 + intensity * 0.02, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      }
      // Soft kick pulse when the horde is thick.
      if (intensity > 0.55 && step % 2 === 1) {
        const t = this.nextNoteTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(52, t + 0.18);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.07 * intensity, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(t);
        osc.stop(t + 0.3);
      }
      this.nextNoteTime += tempo;
    }
    const targetCutoff = 380 + this.musicIntensity * 900;
    for (const d of this.droneNodes) {
      d.filter.frequency.setTargetAtTime(targetCutoff, ctx.currentTime, 0.6);
    }
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    for (const d of this.droneNodes) {
      try {
        d.osc.stop();
      } catch {
        /* already stopped */
      }
      d.osc.disconnect();
      d.gain.disconnect();
    }
    this.droneNodes = [];
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    if (this.unlocked) void this.ctx?.resume();
  }

  dispose(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
    this.unlocked = false;
  }
}

export type { SfxName };
