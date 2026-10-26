// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/audio.js — fully procedural audio (WebAudio synthesis)
// No external sound files: every effect is generated from noise
// and oscillators, then spatialised in 3D.
// ============================================================
import * as THREE from 'three';
import { clamp, RNG } from '../core/util.js';

export class Audio {
  constructor(camera) {
    this.camera = camera;
    this.ctx = null;
    this.master = null;
    this.ready = false;
    this.volume = 0.75;
    this.musicVolume = 0.4;
    this.rng = new RNG(9371);
    this.buffers = {};
    this.listener = null;
    this.activeMusic = null;
    this.musicTimer = 0;
    this.mood = 'explore';
    this.combatIntensity = 0;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    // simple convolution reverb for interiors / tunnels
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.4, 2.2);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.22;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);
    // music bus
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.0;
    this.musicBus.connect(this.master);
    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 2400;
    this.musicFilter.connect(this.musicBus);
    this.ambience = this.ctx.createGain();
    this.ambience.gain.value = 0.0;
    this.ambience.connect(this.master);

    this.buildBuffers();
    this.startAmbience();
    this.ready = true;
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  noiseBuffer(seconds = 1, color = 'white') {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (color === 'pink') { last = last * 0.94 + w * 0.06; d[i] = last * 2.2; }
      else d[i] = w;
    }
    return buf;
  }

  buildBuffers() {
    this.buffers.white = this.noiseBuffer(1.0, 'white');
    this.buffers.brown = this.noiseBuffer(2.0, 'brown');
    this.buffers.pink = this.noiseBuffer(2.0, 'pink');
    // wind loop
    const wind = this.noiseBuffer(6, 'brown');
    this.buffers.wind = wind;
    // radio static
    const rs = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
    const rsd = rs.getChannelData(0);
    for (let i = 0; i < rsd.length; i++) {
      rsd[i] = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.7) * (Math.random() < 0.02 ? 1 : 0.25);
    }
    this.buffers.static = rs;
  }

  // ---- helpers ----
  now() { return this.ctx ? this.ctx.currentTime : 0; }

  gainNode(v = 1) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  spatial(pos, maxDist = 40) {
    if (!this.ctx || !this.camera) return { node: this.master, dist: 0, gain: 1, pan: 0 };
    const cam = this.camera.position;
    const dx = pos.x - cam.x, dy = pos.y - cam.y, dz = pos.z - cam.z;
    const d = Math.hypot(dx, dy, dz);
    const g = clamp(1 - d / maxDist, 0, 1) ** 2;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 4;
    panner.maxDistance = maxDist;
    panner.rolloffFactor = 1.2;
    panner.positionX.value = dx; panner.positionY.value = dy; panner.positionZ.value = dz;
    panner.connect(this.master);
    return { node: panner, dist: d, gain: g, pan: 0 };
  }

  playNoise(opts = {}) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[opts.color || 'white'];
    src.loop = true;
    src.playbackRate.value = opts.rate || 1;
    const filter = this.ctx.createBiquadFilter();
    filter.type = opts.filterType || 'bandpass';
    filter.frequency.value = opts.freq || 1200;
    filter.Q.value = opts.q || 1.2;
    const env = this.ctx.createGain();
    const t = this.now();
    const dur = opts.dur || 0.2;
    const vol = opts.volume ?? 0.4;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (opts.attack || 0.004));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, opts.freqEnd || opts.freq || 1200), t + dur);
    src.connect(filter); filter.connect(env);
    let out = env;
    if (opts.pos) out.connect(this.spatial(opts.pos, opts.maxDist || 50).node);
    else out.connect(this.master);
    if (opts.reverb) { const send = this.ctx.createGain(); send.gain.value = 0.4; env.connect(send); send.connect(this.reverb); }
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  playTone(opts = {}) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = opts.type || 'sine';
    const t = this.now();
    const dur = opts.dur || 0.3;
    osc.frequency.setValueAtTime(opts.freq || 220, t);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), t + dur);
    const env = this.ctx.createGain();
    const vol = opts.volume ?? 0.3;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (opts.attack || 0.008));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = env;
    if (opts.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = opts.filter;
      env.connect(f); node = f;
    }
    osc.connect(env);
    node.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // ---------------- game sounds ----------------
  gunshot(type = 'pistol', pos = null, suppressed = false) {
    if (!this.ctx) return;
    const cfg = {
      pistol: { vol: 0.5, freq: 1800, dur: 0.16, tone: 120, tail: 0.28 },
      rifle: { vol: 0.68, freq: 1300, dur: 0.22, tone: 90, tail: 0.5 },
      shotgun: { vol: 0.85, freq: 900, dur: 0.28, tone: 70, tail: 0.6 },
      smg: { vol: 0.4, freq: 2000, dur: 0.12, tone: 150, tail: 0.2 },
      bow: { vol: 0.25, freq: 3200, dur: 0.1, tone: 220, tail: 0.12 },
    }[type] || { vol: 0.5, freq: 1500, dur: 0.15, tone: 120, tail: 0.3 };
    const mul = suppressed ? 0.28 : 1;
    this.playNoise({ color: 'white', freq: cfg.freq * (suppressed ? 0.5 : 1), q: 0.8, dur: cfg.dur, volume: cfg.vol * mul, pos, maxDist: 120, attack: 0.001, freqEnd: 400 });
    this.playTone({ type: 'square', freq: cfg.tone, freqEnd: cfg.tone * 0.35, dur: cfg.dur * 0.8, volume: cfg.vol * 0.5 * mul, filter: 800 });
    // tail (reverb of the valley)
    if (!suppressed) this.playNoise({ color: 'brown', freq: 600, q: 0.6, dur: cfg.tail, volume: cfg.vol * 0.22, pos, maxDist: 200, attack: 0.05, freqEnd: 150 });
  }

  dryFire() { this.playNoise({ freq: 3200, q: 4, dur: 0.05, volume: 0.18 }); }
  reload(stage = 0) {
    this.playNoise({ freq: 2200 + stage * 600, q: 6, dur: 0.07, volume: 0.25 });
    this.playTone({ type: 'square', freq: 420, freqEnd: 300, dur: 0.05, volume: 0.12 });
  }
  shellDrop() { this.playTone({ type: 'triangle', freq: 1800, freqEnd: 900, dur: 0.08, volume: 0.09 }); }

  meleeHit(pos, heavy = false) {
    this.playNoise({ freq: heavy ? 500 : 900, q: 1.4, dur: heavy ? 0.16 : 0.1, volume: 0.35, pos });
    this.playTone({ type: 'sine', freq: heavy ? 90 : 160, freqEnd: 40, dur: 0.2, volume: 0.3 });
  }
  swing() { this.playNoise({ color: 'pink', freq: 1400, q: 1.8, dur: 0.16, volume: 0.16, attack: 0.03, freqEnd: 400 }); }
  hitBody(pos) {
    this.playNoise({ freq: 260, q: 1.0, dur: 0.12, volume: 0.4, pos });
    this.playTone({ type: 'sine', freq: 120, freqEnd: 50, dur: 0.16, volume: 0.25 });
  }
  impactHard(pos) {
    this.playNoise({ freq: 700, q: 0.8, dur: 0.26, volume: 0.45, pos, freqEnd: 120 });
    this.playTone({ type: 'sine', freq: 70, freqEnd: 35, dur: 0.4, volume: 0.3 });
  }

  footstep(surface = 'grass', vol = 0.5) {
    if (!this.ctx) return;
    const cfg = {
      grass: { freq: 900, q: 0.7, dur: 0.09, color: 'pink' },
      dirt: { freq: 600, q: 0.9, dur: 0.1, color: 'pink' },
      gravel: { freq: 2400, q: 1.1, dur: 0.11, color: 'white' },
      concrete: { freq: 1600, q: 1.4, dur: 0.07, color: 'white' },
      sand: { freq: 1100, q: 0.6, dur: 0.12, color: 'pink' },
      metal: { freq: 2800, q: 3.0, dur: 0.14, color: 'white' },
      water: { freq: 800, q: 0.5, dur: 0.18, color: 'white' },
    }[surface] || { freq: 900, q: 0.8, dur: 0.09, color: 'pink' };
    this.playNoise({ color: cfg.color, freq: cfg.freq * (0.9 + Math.random() * 0.2), q: cfg.q, dur: cfg.dur, volume: 0.10 * vol, attack: 0.002 });
  }

  breathHard() { this.playNoise({ color: 'pink', freq: 700, q: 0.8, dur: 0.5, volume: 0.08, attack: 0.1, freqEnd: 400 }); }

  enemyAlert(type, pos) {
    const def = {
      hollow: { freq: 320, end: 180, dur: 0.7, type: 'sawtooth' },
      crawler: { freq: 900, end: 400, dur: 0.35, type: 'square' },
      watcher: { freq: 140, end: 90, dur: 1.2, type: 'sine' },
      screamer: { freq: 1100, end: 700, dur: 1.4, type: 'sawtooth' },
      brute: { freq: 90, end: 55, dur: 1.0, type: 'sawtooth' },
      mimic: { freq: 600, end: 500, dur: 0.6, type: 'triangle' },
      burrower: { freq: 220, end: 140, dur: 0.5, type: 'square' },
      stalker: { freq: 260, end: 120, dur: 0.9, type: 'sawtooth' },
      contaminated: { freq: 160, end: 80, dur: 1.1, type: 'sawtooth' },
      pale: { freq: 1200, end: 300, dur: 1.0, type: 'sine' },
    }[type] || { freq: 300, end: 160, dur: 0.6, type: 'sawtooth' };
    this.playTone({ type: def.type, freq: def.freq, freqEnd: def.end, dur: def.dur, volume: 0.16, filter: 1800 });
    this.playNoise({ color: 'pink', freq: def.freq * 2, q: 3, dur: def.dur * 0.8, volume: 0.1, pos, maxDist: 60, attack: 0.05, freqEnd: def.end });
  }
  enemyGrowl(type, pos) {
    this.playNoise({ color: 'brown', freq: 320, q: 1.6, dur: 0.5, volume: 0.18, pos, maxDist: 40, attack: 0.06, freqEnd: 180 });
  }
  enemyDeath(type, pos) {
    this.playNoise({ color: 'brown', freq: 420, q: 0.8, dur: 0.9, volume: 0.28, pos, freqEnd: 120 });
    this.playTone({ type: 'sawtooth', freq: 180, freqEnd: 60, dur: 0.8, volume: 0.14, filter: 700 });
  }
  scream(pos) {
    this.playTone({ type: 'sawtooth', freq: 1400, freqEnd: 600, dur: 1.1, volume: 0.3, filter: 3200 });
    this.playNoise({ color: 'pink', freq: 2200, q: 2, dur: 1.2, volume: 0.18, pos, maxDist: 80 });
  }
  bossRoar(pos) {
    this.playTone({ type: 'sawtooth', freq: 70, freqEnd: 40, dur: 2.0, volume: 0.4, filter: 500 });
    this.playNoise({ color: 'brown', freq: 260, q: 0.8, dur: 2.2, volume: 0.3, pos, maxDist: 160, attack: 0.2, freqEnd: 90 });
  }
  bossSwing(pos) {
    this.playNoise({ color: 'brown', freq: 500, q: 1.1, dur: 0.5, volume: 0.3, pos, maxDist: 90, attack: 0.1, freqEnd: 130 });
  }

  pickup() {
    this.playTone({ type: 'sine', freq: 880, dur: 0.09, volume: 0.1 });
    this.playTone({ type: 'sine', freq: 1320, dur: 0.12, volume: 0.07 });
  }
  uiClick() { this.playTone({ type: 'square', freq: 1400, dur: 0.03, volume: 0.06 }); }
  uiHover() { this.playTone({ type: 'sine', freq: 1800, dur: 0.02, volume: 0.03 }); }
  uiOpen() { this.playTone({ type: 'triangle', freq: 400, freqEnd: 700, dur: 0.14, volume: 0.08 }); }
  uiClose() { this.playTone({ type: 'triangle', freq: 700, freqEnd: 380, dur: 0.12, volume: 0.07 }); }
  questUpdate() {
    this.playTone({ type: 'sine', freq: 620, dur: 0.18, volume: 0.12 });
    setTimeout(() => this.playTone({ type: 'sine', freq: 930, dur: 0.3, volume: 0.1 }), 120);
  }
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone({ type: 'triangle', freq: f, dur: 0.5, volume: 0.14 }), i * 110));
  }
  craft() { this.playNoise({ freq: 700, q: 2, dur: 0.3, volume: 0.2 }); }
  doorOpen(pos) {
    this.playNoise({ color: 'brown', freq: 380, q: 2.4, dur: 0.7, volume: 0.2, pos, maxDist: 30, attack: 0.1, freqEnd: 260 });
  }
  hurt() { this.playNoise({ color: 'pink', freq: 420, q: 1.2, dur: 0.22, volume: 0.28 }); }

  startAmbience() {
    if (!this.ctx) return;
    // wind bed
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.wind;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.value = 0.14;
    src.connect(f); f.connect(g); g.connect(this.ambience);
    src.start();
    this.windGain = g;
    this.windFilter = f;
    // low drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 46;
    const og = this.ctx.createGain();
    og.gain.value = 0.035;
    osc.connect(og); og.connect(this.ambience);
    osc.start();
    this.drone = og;
    this.ambience.gain.value = 0.9;
  }

  startMusic() {
    if (!this.ctx || this.musicStarted) return;
    this.musicStarted = true;
    this.musicBus.gain.cancelScheduledValues(this.now());
    this.musicBus.gain.setValueAtTime(0.0001, this.now());
    this.musicBus.gain.linearRampToValueAtTime(this.musicVolume * 0.6, this.now() + 4);
    // evolving ambient pad: two detuned oscillators through a lowpass
    this.pad = [];
    const notes = [55, 82.4, 110, 164.8];
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.02 / (i + 1);
      o.connect(g); g.connect(this.musicFilter);
      o.start();
      this.pad.push({ o, g, base: f });
    });
    // slow pulse
    this.pulseTimer = 0;
  }

  setMood(mood, intensity = 0) {
    this.mood = mood;
    this.combatIntensity = intensity;
    if (!this.musicFilter) return;
    const target = mood === 'combat' ? 3800 : mood === 'horror' ? 900 : 2200;
    this.musicFilter.frequency.setTargetAtTime(target, this.now(), 1.2);
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(this.musicVolume * (mood === 'combat' ? 0.9 : 0.5), this.now(), 1.0);
  }

  update(dt, opts = {}) {
    if (!this.ctx) return;
    // wind follows weather and region
    if (this.windGain) {
      const w = opts.wind ?? 0.3;
      this.windGain.gain.setTargetAtTime(0.05 + w * 0.22, this.now(), 0.6);
      this.windFilter.frequency.setTargetAtTime(260 + w * 700, this.now(), 0.8);
    }
    if (this.pad) {
      this.pulseTimer += dt;
      // slow chord evolution
      const t = opts.time ?? 0;
      this.pad.forEach((p, i) => {
        const drift = Math.sin(t * 0.07 + i * 1.7) * 2.2;
        p.o.frequency.setTargetAtTime(p.base + drift, this.now(), 1.4);
      });
      if (this.mood === 'combat') {
        // percussive heartbeat
        if (this.pulseTimer > Math.max(0.34, 0.9 - this.combatIntensity * 0.5)) {
          this.pulseTimer = 0;
          this.playTone({ type: 'sine', freq: 62, freqEnd: 40, dur: 0.28, volume: 0.09 });
          if (this.combatIntensity > 0.6) setTimeout(() => this.playNoise({ freq: 180, q: 1.2, dur: 0.12, volume: 0.05 }), 160);
        }
      }
    }
    // random ambient one-shots
    this.ambTimer = (this.ambTimer || 0) - dt;
    if (this.ambTimer <= 0) {
      this.ambTimer = 6 + Math.random() * 16;
      const amb = opts.ambience || [];
      if (amb.length) {
        const kind = amb[Math.floor(Math.random() * amb.length)];
        this.playAmbientOneShot(kind);
      }
    }
  }

  playAmbientOneShot(kind) {
    switch (kind) {
      case 'creaking':
        this.playNoise({ color: 'brown', freq: 300 + Math.random() * 200, q: 5, dur: 1.2, volume: 0.06, attack: 0.2, freqEnd: 200 });
        break;
      case 'metal':
        this.playTone({ type: 'triangle', freq: 220 + Math.random() * 300, freqEnd: 180, dur: 1.4, volume: 0.04 });
        break;
      case 'drips':
        this.playTone({ type: 'sine', freq: 1200 + Math.random() * 600, freqEnd: 700, dur: 0.12, volume: 0.05 });
        break;
      case 'crows':
        for (let i = 0; i < 3; i++) setTimeout(() => this.playNoise({ freq: 1600, q: 6, dur: 0.09, volume: 0.05 }), i * 130);
        break;
      case 'hum':
        this.playTone({ type: 'sine', freq: 60, dur: 2.4, volume: 0.05, attack: 0.5 });
        break;
      case 'radio_static':
        this.playNoise({ color: 'white', freq: 2400, q: 0.7, dur: 1.6, volume: 0.05, attack: 0.2 });
        break;
      case 'geiger':
        for (let i = 0; i < 9; i++) setTimeout(() => this.playNoise({ freq: 4200, q: 8, dur: 0.012, volume: 0.06 }), i * (90 + Math.random() * 120));
        break;
      case 'steam':
        this.playNoise({ color: 'white', freq: 3000, q: 0.9, dur: 1.8, volume: 0.07, attack: 0.15, freqEnd: 1200 });
        break;
      case 'wind_gap':
        this.playNoise({ color: 'brown', freq: 700, q: 2, dur: 2.6, volume: 0.08, attack: 0.6, freqEnd: 300 });
        break;
      case 'distant_siren':
        this.playTone({ type: 'sine', freq: 420, freqEnd: 380, dur: 3.2, volume: 0.035, attack: 0.8 });
        break;
      case 'branches':
        this.playNoise({ color: 'pink', freq: 1100, q: 3, dur: 0.5, volume: 0.05 });
        break;
      case 'machinery':
        this.playNoise({ color: 'brown', freq: 220, q: 3, dur: 2.0, volume: 0.06, attack: 0.3 });
        break;
      case 'radiation_storm':
        this.playNoise({ color: 'brown', freq: 380, q: 0.8, dur: 4.0, volume: 0.1, attack: 1.0, freqEnd: 160 });
        break;
      case 'birds_far':
        this.playNoise({ freq: 2600, q: 9, dur: 0.14, volume: 0.03 });
        break;
      case 'wind':
      default:
        break;
    }
  }

  // ---------------- interface / progression cues ----------------
  trade() {
    this.playTone({ type: 'triangle', freq: 880, dur: 0.08, volume: 0.12 });
    setTimeout(() => this.playTone({ type: 'triangle', freq: 1320, dur: 0.1, volume: 0.1 }), 60);
  }
  equip() { this.playNoise({ freq: 1800, q: 3, dur: 0.09, volume: 0.16, freqEnd: 900 }); }
  heal() { this.playTone({ type: 'sine', freq: 420, freqEnd: 620, dur: 0.4, volume: 0.1 }); }
  door(open = true) {
    this.playNoise({ color: 'brown', freq: open ? 420 : 320, q: 0.9, dur: 0.5, volume: 0.13, attack: 0.03, freqEnd: open ? 180 : 520 });
    if (!open) this.playTone({ type: 'square', freq: 90, dur: 0.12, volume: 0.12, filter: 300 });
  }
  discovery() {
    this.playTone({ type: 'sine', freq: 220, freqEnd: 330, dur: 0.9, volume: 0.12 });
    this.playNoise({ color: 'pink', freq: 900, q: 0.7, dur: 1.2, volume: 0.05, attack: 0.3, reverb: true });
  }
  eventSting() {
    this.playTone({ type: 'sawtooth', freq: 70, freqEnd: 48, dur: 1.6, volume: 0.16, filter: 380 });
    this.playNoise({ color: 'brown', freq: 240, q: 0.6, dur: 2.0, volume: 0.09, attack: 0.4 });
  }
  radioStatic() { this.playNoise({ color: 'white', freq: 2400, q: 1.4, dur: 1.8, volume: 0.06, attack: 0.2 }); }
  paleHowl() {
    this.playTone({ type: 'sine', freq: 300, freqEnd: 180, dur: 2.2, volume: 0.09, attack: 0.5 });
    this.playNoise({ color: 'pink', freq: 800, q: 0.8, dur: 2.4, volume: 0.05, attack: 0.6, reverb: true });
  }
  bossDeath() {
    this.playNoise({ color: 'brown', freq: 400, q: 0.5, dur: 3.0, volume: 0.22, attack: 0.2, freqEnd: 80 });
    this.playTone({ type: 'sawtooth', freq: 110, freqEnd: 32, dur: 2.6, volume: 0.16, filter: 420 });
  }
  stopMusic() {
    this.musicActive = false;
    if (this.musicBus) this.musicBus.gain.value = 0;
  }
  setListener(camera) { this.camera = camera; }

  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setMusicVolume(v) { this.musicVolume = v; if (this.musicBus) this.musicBus.gain.value = v * 0.6; }
}
