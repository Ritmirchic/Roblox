/**
 * Procedural audio: all sound effects and the ambient score are synthesised with the
 * WebAudio API - no external audio files, no licensing issues, tiny download.
 */
export class AudioSystem {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  musicVolume = 0.45;
  sfxVolume = 0.75;
  private started = false;
  private noiseBuffer: AudioBuffer | null = null;

  /** Must be called from a user gesture (browser autoplay policy). */
  init(): void {
    if (this.started) return;
    try {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume * 0.5;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.started = true;
      this.startAmbient();
    } catch {
      this.ctx = null;
    }
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicGain) this.musicGain.gain.value = music * 0.5;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
  }

  private env(gain: GainNode, attack: number, decay: number, peak = 1): void {
    const t = this.ctx!.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  tone(freq: number, dur = 0.2, type: OscillatorType = 'sine', peak = 0.3, slideTo?: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    this.env(gain, 0.008, dur, peak);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.05);
  }

  noise(dur = 0.3, filterFreq = 1200, peak = 0.3, q = 1): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    this.env(gain, 0.005, dur, peak);
    src.start();
    src.stop(this.ctx.currentTime + dur + 0.05);
  }

  // ----------------------------------------------------------- game sounds
  uiClick(): void { this.tone(880, 0.06, 'triangle', 0.18, 1320); }
  uiHover(): void { this.tone(1200, 0.03, 'sine', 0.06); }
  uiBack(): void { this.tone(420, 0.09, 'triangle', 0.14, 260); }
  purchase(): void { this.tone(523, 0.1, 'triangle', 0.22); setTimeout(() => this.tone(784, 0.16, 'triangle', 0.2), 70); }
  error(): void { this.tone(180, 0.18, 'sawtooth', 0.16, 120); }
  place(): void { this.noise(0.14, 420, 0.25, 2); this.tone(320, 0.1, 'square', 0.1, 220); }
  laser(): void { this.tone(1400, 0.12, 'sawtooth', 0.12, 420); }
  mining(): void { this.noise(0.12, 780, 0.06, 6); }
  gun(): void { this.noise(0.09, 1500, 0.16, 1.4); this.tone(140, 0.07, 'square', 0.1, 70); }
  rocket(): void { this.noise(0.5, 420, 0.2, 0.8); this.tone(90, 0.4, 'sawtooth', 0.12, 40); }
  explosion(size = 1): void {
    this.noise(0.7 * size, 220, 0.35, 0.6);
    this.tone(70, 0.5 * size, 'sine', 0.3, 32);
  }
  shieldHit(): void { this.tone(640, 0.2, 'sine', 0.2, 940); this.noise(0.12, 2400, 0.1, 3); }
  pickup(): void { this.tone(1046, 0.07, 'sine', 0.12, 1568); }
  cardReveal(rank: number): void {
    const base = 440 + rank * 110;
    this.tone(base, 0.25, 'triangle', 0.2, base * 1.5);
    setTimeout(() => this.tone(base * 1.5, 0.35, 'sine', 0.18, base * 2), 110);
    if (rank >= 4) setTimeout(() => this.tone(base * 2, 0.6, 'sine', 0.16, base * 2.6), 240);
  }
  launch(): void {
    this.tone(60, 1.6, 'sawtooth', 0.32, 220);
    this.noise(1.8, 300, 0.26, 0.5);
  }
  achievement(): void {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.16), i * 85));
  }

  /** Slow evolving ambient pad with occasional sonar pings. */
  private startAmbient(): void {
    if (!this.ctx || !this.musicGain) return;
    const scale = [110, 146.83, 164.81, 196, 220, 246.94, 293.66];
    const playPad = () => {
      if (!this.ctx || !this.musicGain) return;
      const root = scale[Math.floor(Math.random() * scale.length)];
      const voices = [root, root * 1.5, root * 2.01];
      voices.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900 + Math.random() * 600;
        osc.type = i === 2 ? 'triangle' : 'sawtooth';
        osc.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        const now = this.ctx!.currentTime;
        const dur = 6 + Math.random() * 4;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.06 / (i + 1), now + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.start(now);
        osc.stop(now + dur + 0.2);
      });
      if (Math.random() < 0.4) {
        setTimeout(() => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.value = 1200 + Math.random() * 900;
          osc.connect(gain);
          gain.connect(this.musicGain!);
          const now = this.ctx!.currentTime;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
          osc.start(now);
          osc.stop(now + 1.8);
        }, Math.random() * 3000);
      }
    };
    playPad();
    this.musicTimer = window.setInterval(playPad, 7000);
  }

  dispose(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.ctx?.close();
  }
}

export const audio = new AudioSystem();
