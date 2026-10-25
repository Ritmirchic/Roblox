/**
 * Deterministic random number generation (xorshift128+ style, seedable).
 * Used for loot rolls, pack opening, procedural geometry and texture synthesis so
 * that the same seed always produces the same asset - critical for reproducible art.
 */
export class RNG {
  private s0: number;
  private s1: number;

  constructor(seed = 0x2f6e2b1) {
    // SplitMix32 expansion to avoid weak initial states.
    let x = (seed >>> 0) || 0x9e3779b9;
    const next = () => {
      x = (x + 0x9e3779b9) >>> 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
      z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
      return (z ^ (z >>> 15)) >>> 0;
    };
    this.s0 = next();
    this.s1 = next();
  }

  /** Uniform float in [0,1). */
  next(): number {
    let s1 = this.s0 >>> 0;
    const s0 = this.s1 >>> 0;
    this.s0 = s0;
    s1 ^= (s1 << 23) >>> 0;
    s1 = (s1 ^ (s1 >>> 17) ^ s0 ^ (s0 >>> 26)) >>> 0;
    this.s1 = s1;
    return (((this.s0 + this.s1) >>> 0) % 0x100000000) / 0x100000000;
  }

  /** Uniform float in [min,max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer in [min,max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.min(arr.length - 1, Math.floor(this.next() * arr.length))];
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Weighted pick. weights must be positive numbers aligned to items. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    let total = 0;
    for (const w of weights) total += w;
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Gaussian-ish value via central limit, mean 0, sigma 1. */
  gauss(): number {
    return (this.next() + this.next() + this.next() + this.next() + this.next() + this.next() - 3) / 1.2247;
  }
}

/** Global non-deterministic RNG for gameplay rolls. */
export const gameRng = new RNG((Date.now() ^ 0x5f3759df) >>> 0);

/** 2D value noise used for procedural textures. */
export function makeNoise2D(seed: number) {
  const rng = new RNG(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  rng.shuffle(Array.from(p)).forEach((v, i) => (p[i] = v));
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (hash: number, x: number, y: number) => {
    switch (hash & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  };

  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return (lerp(x1, x2, v) + 1) * 0.5;
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Fractal brownian motion over value noise - the backbone of our texture synthesis. */
export function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves = 5, lacunarity = 2, gain = 0.5): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
