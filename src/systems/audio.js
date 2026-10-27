/**
 * Procedural audio engine. All sound is synthesised at runtime with the Web
 * Audio API (noise bursts, filtered oscillators, convolution-less reverb send),
 * so the game ships without any third party audio files.
 */
import { clamp, lerp } from '../engine/util.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.volume = 0.8;
    this.musicVolume = 0.45;
    this.sfxVolume = 0.85;
    this.ambientVolume = 0.6;
    this.muted = false;
    this.listener = { x: 0, y: 0, z: 0 };
    this.listenerYaw = 0;
    this.nodes = {};
    this.started = false;
    this.musicState = 'none';
    this.musicTimer = 0;
    this.heartTimer = 0;
    this.lastType = {};
    this.voices = 0;
  }

  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(ctx.destination);

    // reverb-ish send (feedback delay network, cheap)
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._makeImpulse(2.2, 0.55);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.32;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);
    this.dry = ctx.createGain();
    this.dry.gain.value = 1;
    this.dry.connect(this.master);

    // buses
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVolume;
    this.sfxBus.connect(this.dry);
    this.sfxBus.connect(this.reverb);
    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = this.ambientVolume;
    this.ambientBus.connect(this.dry);
    this.ambientBus.connect(this.reverb);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVolume;
    this.musicBus.connect(this.master);

    this.noiseBuf = this._makeNoise(2.0, 'white');
    this.brownBuf = this._makeNoise(4.0, 'brown');
    this.pinkBuf = this._makeNoise(2.0, 'pink');
    this.ready = true;
    this.started = true;
    this._startAmbience();
  }

  _makeNoise(seconds, type = 'white') {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w;
      else if (type === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
    }
    return buf;
  }

  _makeImpulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay * 3);
      }
    }
    return buf;
  }

  _startAmbience() {
    const ctx = this.ctx;
    // wind bed
    const wind = ctx.createBufferSource();
    wind.buffer = this.brownBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.22;
    wind.connect(windFilter).connect(windGain).connect(this.ambientBus);
    wind.start();
    // gust LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(windGain.gain);
    lfo.start();
    this.nodes.windGain = windGain;
    this.nodes.windFilter = windFilter;

    // low drone of the zone
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 41.5;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    drone.connect(droneGain).connect(this.ambientBus);
    drone.start();
    const drone2 = ctx.createOscillator();
    drone2.type = 'triangle';
    drone2.frequency.value = 62.3;
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.018;
    drone2.connect(drone2Gain).connect(this.ambientBus);
    drone2.start();
    this.nodes.droneGain = droneGain;

    // distant radio static
    const stat = ctx.createBufferSource();
    stat.buffer = this.pinkBuf;
    stat.loop = true;
    const statFilter = ctx.createBiquadFilter();
    statFilter.type = 'bandpass';
    statFilter.frequency.value = 1800;
    statFilter.Q.value = 0.8;
    const statGain = ctx.createGain();
    statGain.gain.value = 0.012;
    stat.connect(statFilter).connect(statGain).connect(this.ambientBus);
    stat.start();
    this.nodes.staticGain = statGain;

    // rain bed (gated by weather)
    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuf;
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1200;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rain.connect(rainFilter).connect(rainGain).connect(this.ambientBus);
    rain.start();
    this.nodes.rainGain = rainGain;
  }

  setVolumes({ master, sfx, music, ambient }) {
    if (master !== undefined) this.volume = master;
    if (sfx !== undefined) this.sfxVolume = sfx;
    if (music !== undefined) this.musicVolume = music;
    if (ambient !== undefined) this.ambientVolume = ambient;
    if (!this.ready) return;
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.sfxBus.gain.value = this.sfxVolume;
    this.musicBus.gain.value = this.musicVolume;
    this.ambientBus.gain.value = this.ambientVolume;
  }

  setMuted(m) {
    this.muted = m;
    if (this.ready) this.master.gain.value = m ? 0 : this.volume;
  }

  setListener(pos, yaw) {
    this.listener.x = pos.x;
    this.listener.y = pos.y;
    this.listener.z = pos.z;
    this.listenerYaw = yaw;
  }

  _spatial(pos) {
    if (!pos) return { gain: 1, pan: 0, delay: 0 };
    const dx = pos.x - this.listener.x;
    const dy = (pos.y ?? this.listener.y) - this.listener.y;
    const dz = pos.z - this.listener.z;
    const dist = Math.hypot(dx, dy, dz);
    const gain = 1 / (1 + dist * 0.09 + dist * dist * 0.0016);
    // pan relative to facing direction
    const fx = -Math.sin(this.listenerYaw);
    const fz = -Math.cos(this.listenerYaw);
    const rx = Math.cos(this.listenerYaw);
    const rz = -Math.sin(this.listenerYaw);
    const pan = dist > 0.4 ? clamp((dx * rx + dz * rz) / dist, -1, 1) * 0.75 : 0;
    const delay = Math.min(0.4, dist / 340);
    return { gain, pan, delay, dist };
  }

  _out(gainNode, spatial) {
    const ctx = this.ctx;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = spatial.pan;
      gainNode.connect(panner);
      if (spatial.delay > 0.005) {
        const d = ctx.createDelay(0.5);
        d.delayTime.value = spatial.delay;
        panner.connect(d);
        d.connect(this.sfxBus);
        panner.connect(this.sfxBus);
      } else panner.connect(this.sfxBus);
    } else gainNode.connect(this.sfxBus);
  }

  // ---- one-shot primitives ------------------------------------------------
  noiseBurst({ dur = 0.2, type = 'lowpass', freq = 900, q = 1, gain = 0.5, pan = 0, delay = 0, slideTo = null, buffer = null, playbackRate = 1 }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = buffer || this.noiseBuf;
    src.playbackRate.value = playbackRate;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, now);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f).connect(g);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p).connect(this.sfxBus);
    } else g.connect(this.sfxBus);
    src.start(now);
    src.stop(now + dur + 0.02);
    this.voices++;
    src.onended = () => this.voices--;
  }

  tone({ freq = 220, dur = 0.3, type = 'sine', gain = 0.2, delay = 0, pan = 0, slideTo = null, attack = 0.005, bus = null }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(bus || this.sfxBus);
    } else g.connect(bus || this.sfxBus);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  // ---- game sounds -------------------------------------------------------
  play(name, pos = null, opts = {}) {
    if (!this.ready || this.muted) return;
    const sp = this._spatial(pos);
    if (sp.gain < 0.02) return;
    const pitch = 0.9 + Math.random() * 0.2;
    // alias table for feedback names that share a synthesised cue
    const ALIAS = {
      bossDeath: 'mutantDeath', campaignEnd: 'levelUp', consume: 'pickup', death: 'scream',
      deny: 'uiDeny', equip: 'click', heal: 'pickup', meleeHeavy: 'meleeSwing',
      repair: 'click', salvage: 'loot', throw: 'vault', trade: 'uiClick',
      switch: 'click', fireLoop: 'breath', reload: 'reloadIn', lockpick: 'click',
    };
    name = ALIAS[name] || name;
    switch (name) {
      case 'gunshot': {
        const cal = opts.caliber || 'rifle';
        const conf = {
          pistol: { g: 0.5, f: 1500, d: 0.22, boom: 90 },
          magnum: { g: 0.7, f: 1100, d: 0.3, boom: 70 },
          shell: { g: 0.8, f: 900, d: 0.4, boom: 55 },
          rifle: { g: 0.75, f: 1300, d: 0.34, boom: 60 },
          intermediate: { g: 0.6, f: 1600, d: 0.26, boom: 72 },
          bolt: { g: 0.18, f: 2600, d: 0.1, boom: 0 },
        }[cal] || { g: 0.6, f: 1400, d: 0.26, boom: 70 };
        this.noiseBurst({ dur: conf.d * pitch, freq: conf.f, gain: sp.gain * conf.g, pan: sp.pan, slideTo: 160, q: 0.7 });
        if (conf.boom) this.tone({ freq: conf.boom, slideTo: 32, dur: conf.d * 1.6, type: 'sine', gain: sp.gain * conf.g * 0.55, pan: sp.pan });
        // mechanical click
        this.noiseBurst({ dur: 0.05, type: 'bandpass', freq: 3200, q: 2, gain: sp.gain * 0.12, pan: sp.pan });
        break;
      }
      case 'dryFire':
        this.noiseBurst({ dur: 0.05, type: 'bandpass', freq: 2400, q: 4, gain: sp.gain * 0.3, pan: sp.pan });
        break;
      case 'reloadIn':
        this.noiseBurst({ dur: 0.08, type: 'bandpass', freq: 1700, q: 3, gain: sp.gain * 0.3, pan: sp.pan });
        this.noiseBurst({ dur: 0.1, type: 'bandpass', freq: 900, q: 2, gain: sp.gain * 0.28, pan: sp.pan, delay: 0.18 });
        break;
      case 'reloadOut':
        this.noiseBurst({ dur: 0.1, type: 'bandpass', freq: 2200, q: 3, gain: sp.gain * 0.34, pan: sp.pan });
        this.noiseBurst({ dur: 0.09, type: 'bandpass', freq: 1200, q: 2, gain: sp.gain * 0.3, pan: sp.pan, delay: 0.22 });
        break;
      case 'impactFlesh':
        this.noiseBurst({ dur: 0.13, type: 'lowpass', freq: 500, gain: sp.gain * 0.55, pan: sp.pan, slideTo: 120 });
        this.tone({ freq: 90, slideTo: 45, dur: 0.1, gain: sp.gain * 0.25 });
        break;
      case 'impactConcrete':
        this.noiseBurst({ dur: 0.09, type: 'bandpass', freq: 2600, q: 1.5, gain: sp.gain * 0.4, pan: sp.pan });
        this.noiseBurst({ dur: 0.14, type: 'highpass', freq: 4200, gain: sp.gain * 0.18, pan: sp.pan, delay: 0.01 });
        break;
      case 'impactMetal':
        this.tone({ freq: 2100 * pitch, dur: 0.28, type: 'triangle', gain: sp.gain * 0.18, pan: sp.pan, slideTo: 1400 });
        this.noiseBurst({ dur: 0.08, type: 'bandpass', freq: 4200, q: 3, gain: sp.gain * 0.3, pan: sp.pan });
        break;
      case 'impactWood':
        this.noiseBurst({ dur: 0.08, type: 'bandpass', freq: 1100, q: 2.5, gain: sp.gain * 0.42, pan: sp.pan });
        break;
      case 'impactDirt':
        this.noiseBurst({ dur: 0.12, type: 'lowpass', freq: 780, gain: sp.gain * 0.34, pan: sp.pan, slideTo: 200 });
        break;
      case 'meleeSwing':
        this.noiseBurst({ dur: 0.16, type: 'bandpass', freq: 900, q: 0.8, gain: sp.gain * 0.28, pan: sp.pan, slideTo: 2400 });
        break;
      case 'meleeHit':
        this.noiseBurst({ dur: 0.14, type: 'lowpass', freq: 700, gain: sp.gain * 0.6, pan: sp.pan, slideTo: 100 });
        this.tone({ freq: 120, slideTo: 48, dur: 0.16, gain: sp.gain * 0.4 });
        break;
      case 'hitFlesh':
        this.noiseBurst({ dur: 0.12, type: 'lowpass', freq: 420, gain: sp.gain * 0.5, pan: sp.pan });
        break;
      case 'footstep_dirt':
      case 'footstep_dirt_sprint':
        this.noiseBurst({ dur: 0.1, type: 'lowpass', freq: 700, gain: 0.20 * (name.includes('sprint') ? 1.35 : 1), pan: 0, slideTo: 260 });
        this.noiseBurst({ dur: 0.06, type: 'bandpass', freq: 1800, q: 1, gain: 0.05 });
        break;
      case 'footstep_concrete':
      case 'footstep_concrete_sprint':
        this.noiseBurst({ dur: 0.07, type: 'bandpass', freq: 1500, q: 1.2, gain: 0.16 * (name.includes('sprint') ? 1.3 : 1) });
        this.noiseBurst({ dur: 0.05, type: 'bandpass', freq: 900, q: 2, gain: 0.08 });
        break;
      case 'footstep_wood':
      case 'footstep_wood_sprint':
        this.tone({ freq: 320 * pitch, dur: 0.1, type: 'triangle', gain: 0.1, slideTo: 180 });
        this.noiseBurst({ dur: 0.06, type: 'bandpass', freq: 700, q: 2, gain: 0.14 });
        break;
      case 'footstep_metal':
      case 'footstep_metal_sprint':
        this.tone({ freq: 1400 * pitch, dur: 0.12, type: 'triangle', gain: 0.08, slideTo: 900 });
        this.noiseBurst({ dur: 0.05, type: 'bandpass', freq: 2200, gain: 0.14 });
        break;
      case 'footstep_grass':
      case 'footstep_grass_sprint':
        this.noiseBurst({ dur: 0.09, type: 'highpass', freq: 1300, gain: 0.12 * (name.includes('sprint') ? 1.35 : 1), slideTo: 900 });
        break;
      case 'footstep_water':
        this.noiseBurst({ dur: 0.18, type: 'bandpass', freq: 2200, q: 0.8, gain: 0.25, slideTo: 700 });
        break;
      case 'jump':
        this.noiseBurst({ dur: 0.1, type: 'lowpass', freq: 600, gain: 0.14 });
        break;
      case 'land':
        this.noiseBurst({ dur: 0.16, type: 'lowpass', freq: 500, gain: 0.3, slideTo: 150 });
        break;
      case 'vault':
        this.noiseBurst({ dur: 0.2, type: 'bandpass', freq: 900, q: 0.9, gain: 0.18, slideTo: 1600 });
        break;
      case 'click':
        this.noiseBurst({ dur: 0.03, type: 'bandpass', freq: 3000, q: 6, gain: 0.16 });
        break;
      case 'pickup':
        this.tone({ freq: 620, dur: 0.07, type: 'sine', gain: 0.12, slideTo: 900 });
        this.tone({ freq: 930, dur: 0.1, type: 'sine', gain: 0.08, slideTo: 1300, delay: 0.05 });
        break;
      case 'loot':
        this.noiseBurst({ dur: 0.12, type: 'bandpass', freq: 1400, q: 1.4, gain: 0.2 });
        this.tone({ freq: 480, dur: 0.14, type: 'sine', gain: 0.1, slideTo: 320, delay: 0.06 });
        break;
      case 'doorOpen':
        this.noiseBurst({ dur: 0.5, type: 'bandpass', freq: 380, q: 4, gain: 0.22, slideTo: 620, pan: sp.pan });
        break;
      case 'doorClose':
        this.noiseBurst({ dur: 0.18, type: 'lowpass', freq: 420, gain: 0.28 });
        this.tone({ freq: 120, slideTo: 60, dur: 0.2, gain: 0.16 });
        break;
      case 'growl':
        this.tone({ freq: 78 * pitch, slideTo: 52 * pitch, dur: 0.8, type: 'sawtooth', gain: sp.gain * 0.16, pan: sp.pan });
        this.noiseBurst({ dur: 0.7, type: 'bandpass', freq: 300, q: 3, gain: sp.gain * 0.12, pan: sp.pan, buffer: this.brownBuf });
        break;
      case 'scream':
        this.tone({ freq: 620 * pitch, slideTo: 240, dur: 0.9, type: 'sawtooth', gain: sp.gain * 0.22, pan: sp.pan });
        this.tone({ freq: 940 * pitch, slideTo: 380, dur: 0.7, type: 'square', gain: sp.gain * 0.07, pan: sp.pan, delay: 0.06 });
        break;
      case 'crawlerScreech':
        this.noiseBurst({ dur: 0.4, type: 'bandpass', freq: 2400, q: 6, gain: sp.gain * 0.3, pan: sp.pan, slideTo: 700 });
        this.tone({ freq: 1400, slideTo: 320, dur: 0.34, type: 'sawtooth', gain: sp.gain * 0.1, pan: sp.pan });
        break;
      case 'watcherHum':
        this.tone({ freq: 96, dur: 1.6, type: 'sine', gain: sp.gain * 0.14, pan: sp.pan });
        this.tone({ freq: 146, dur: 1.4, type: 'sine', gain: sp.gain * 0.08, pan: sp.pan, delay: 0.3 });
        break;
      case 'mutantDeath':
        this.tone({ freq: 180 * pitch, slideTo: 48, dur: 1.1, type: 'sawtooth', gain: sp.gain * 0.2, pan: sp.pan });
        this.noiseBurst({ dur: 0.8, type: 'lowpass', freq: 600, gain: sp.gain * 0.22, pan: sp.pan, slideTo: 90 });
        break;
      case 'heartbeat':
        this.tone({ freq: 62, dur: 0.14, type: 'sine', gain: 0.4 });
        this.tone({ freq: 54, dur: 0.18, type: 'sine', gain: 0.28, delay: 0.22 });
        break;
      case 'breath':
        this.noiseBurst({ dur: 0.5, type: 'bandpass', freq: 700, q: 0.9, gain: 0.1, slideTo: 380 });
        break;
      case 'radioStatic':
        this.noiseBurst({ dur: 1.2, type: 'bandpass', freq: 2200, q: 0.6, gain: 0.18, slideTo: 1400 });
        break;
      case 'radioBeep':
        this.tone({ freq: 880, dur: 0.1, type: 'sine', gain: 0.1 });
        this.tone({ freq: 1320, dur: 0.12, type: 'sine', gain: 0.08, delay: 0.12 });
        break;
      case 'thunder':
        this.noiseBurst({ dur: 2.4, type: 'lowpass', freq: 320, gain: 0.5, slideTo: 60, buffer: this.brownBuf });
        this.noiseBurst({ dur: 1.2, type: 'lowpass', freq: 200, gain: 0.3, delay: 0.2, buffer: this.brownBuf });
        break;
      case 'uiHover':
        this.tone({ freq: 1400, dur: 0.03, type: 'sine', gain: 0.04 });
        break;
      case 'uiClick':
        this.tone({ freq: 900, dur: 0.05, type: 'sine', gain: 0.08, slideTo: 1200 });
        break;
      case 'uiDeny':
        this.tone({ freq: 220, dur: 0.12, type: 'square', gain: 0.07, slideTo: 160 });
        break;
      case 'levelUp':
        [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.1, delay: i * 0.1 }));
        break;
      case 'questComplete':
        [392, 523, 659].forEach((f, i) => this.tone({ freq: f, dur: 0.9, type: 'triangle', gain: 0.08, delay: i * 0.16 }));
        break;
      case 'craft':
        this.noiseBurst({ dur: 0.12, type: 'bandpass', freq: 1800, q: 2, gain: 0.2 });
        this.tone({ freq: 700, dur: 0.16, type: 'triangle', gain: 0.09, slideTo: 400, delay: 0.1 });
        break;
      case 'build':
        this.tone({ freq: 140, slideTo: 90, dur: 0.2, type: 'square', gain: 0.12 });
        this.noiseBurst({ dur: 0.12, type: 'bandpass', freq: 1200, q: 1.5, gain: 0.2 });
        break;
      case 'geiger':
        this.noiseBurst({ dur: 0.012, type: 'bandpass', freq: 4200, q: 8, gain: 0.12 });
        break;
      case 'explosion':
        this.noiseBurst({ dur: 1.1, type: 'lowpass', freq: 700, gain: 0.7, slideTo: 60, buffer: this.brownBuf });
        this.tone({ freq: 70, slideTo: 28, dur: 0.9, type: 'sine', gain: 0.5 });
        this.noiseBurst({ dur: 0.4, type: 'highpass', freq: 2400, gain: 0.25, delay: 0.02 });
        break;
      case 'bossRoar':
        this.tone({ freq: 46, slideTo: 34, dur: 2.4, type: 'sawtooth', gain: 0.4 });
        this.tone({ freq: 69, slideTo: 41, dur: 2.6, type: 'square', gain: 0.14 });
        this.noiseBurst({ dur: 2.2, type: 'lowpass', freq: 400, gain: 0.4, buffer: this.brownBuf, slideTo: 80 });
        break;
      case 'waterSplash':
        this.noiseBurst({ dur: 0.5, type: 'bandpass', freq: 1400, q: 0.7, gain: 0.3, slideTo: 400 });
        break;
      default:
        break;
    }
  }

  footstep(surface, sprinting, crouching) {
    if (!this.ready) return;
    const name =
      surface === 'concrete' ? 'footstep_concrete' : surface === 'wood' ? 'footstep_wood' : surface === 'metal' ? 'footstep_metal' : surface === 'grass' ? 'footstep_grass' : surface === 'water' ? 'footstep_water' : 'footstep_dirt';
    this.play(sprinting ? `${name}_sprint` : name, null);
  }

  /** Ambient weather + intensity update. */
  update(dt, { rain = 0, wind = 0.3, inside = false, health = 1, enemiesNear = 0, state = 'explore' } = {}) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const targetRain = rain * (inside ? 0.25 : 1);
    this.nodes.rainGain.gain.setTargetAtTime(targetRain * 0.28, t, 0.6);
    this.nodes.windGain.gain.setTargetAtTime(0.16 + wind * 0.32, t, 1.2);
    this.nodes.windFilter.frequency.setTargetAtTime(260 + wind * 900, t, 1.0);
    this.nodes.staticGain.gain.setTargetAtTime(0.008 + (state === 'radio' ? 0.06 : 0), t, 0.4);

    // heartbeat when badly hurt
    if (health < 0.45 || enemiesNear > 0) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        const rate = health < 0.25 ? 0.62 : 0.95;
        this.heartTimer = rate;
        this.play('heartbeat');
      }
    }
    this._musicDirector(dt, { state, enemiesNear, health });
  }

  _musicDirector(dt, { state, enemiesNear, health }) {
    this.musicTimer -= dt;
    const want = enemiesNear > 0 ? 'combat' : health < 0.3 ? 'tension' : state === 'menu' ? 'menu' : 'explore';
    if (want !== this.musicState) {
      this.musicState = want;
      this.musicTimer = want === 'combat' ? 6 + Math.random() * 6 : 12 + Math.random() * 14;
      this._playMusicPhrase(want);
    } else if (this.musicTimer <= 0) {
      this.musicTimer = want === 'combat' ? 5 + Math.random() * 7 : 14 + Math.random() * 18;
      this._playMusicPhrase(want);
    }
  }

  _playMusicPhrase(kind) {
    if (!this.ready) return;
    const bus = this.musicBus;
    if (kind === 'combat') {
      // pulsing low drone + percussion hits
      const base = 55;
      for (let i = 0; i < 6; i++) {
        this.tone({ freq: base, dur: 1.6, type: 'sawtooth', gain: 0.11, delay: i * 0.34, slideTo: base * 0.995, bus });
        this.noiseBurst({ dur: 0.12, type: 'lowpass', freq: 260, gain: 0.16, delay: i * 0.34, buffer: this.brownBuf });
      }
      this.tone({ freq: 110, dur: 2.2, type: 'triangle', gain: 0.06, bus, delay: 0.1 });
    } else if (kind === 'tension') {
      this.tone({ freq: 73.4, dur: 6.0, type: 'sine', gain: 0.13, bus });
      this.tone({ freq: 77.8, dur: 6.0, type: 'sine', gain: 0.09, bus, delay: 0.3 });
      this.tone({ freq: 155.6, dur: 4.0, type: 'triangle', gain: 0.03, bus, delay: 1.4 });
      this.play('heartbeat');
    } else if (kind === 'menu') {
      const notes = [220, 261.6, 329.6, 392];
      notes.forEach((f, i) => this.tone({ freq: f, dur: 5.0, type: 'sine', gain: 0.05, bus, delay: i * 0.8 }));
      this.tone({ freq: 110, dur: 8.0, type: 'triangle', gain: 0.04, bus });
    } else {
      // sparse ambient motif: distant, unresolved notes
      const scale = [196, 220, 261.6, 293.7, 349.2];
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const f = scale[Math.floor(Math.random() * scale.length)];
        this.tone({ freq: f, dur: 3.5 + Math.random() * 2, type: 'sine', gain: 0.035 + Math.random() * 0.02, bus, delay: i * (1.4 + Math.random()) });
      }
      this.noiseBurst({ dur: 3.0, type: 'bandpass', freq: 900, q: 1.2, gain: 0.02, buffer: this.pinkBuf });
    }
  }

  suspend() {
    this.ctx?.suspend?.();
  }

  resume() {
    this.ctx?.resume?.();
  }
}

/** Small helper for distance-attenuated game sounds. */
export function sfxAt(audio, name, pos, playerPos, opts) {
  if (!audio) return;
  audio.play(name, pos, opts);
}
