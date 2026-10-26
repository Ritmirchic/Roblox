// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// core/util.js — math, deterministic RNG, noise, small helpers
// ============================================================

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const saturate = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (t) => { t = saturate(t); return t * t * (3 - 2 * t); };
export const smootherstep = (t) => { t = saturate(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// Frame-rate independent exponential smoothing.
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const dampAngle = (a, b, lambda, dt) => {
  let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + d * (1 - Math.exp(-lambda * dt));
};
export const approach = (a, b, maxDelta) => {
  const d = b - a;
  return Math.abs(d) <= maxDelta ? b : a + Math.sign(d) * maxDelta;
};

export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const dist2sq = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
export const angleDelta = (a, b) => ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;

// ------------------------------------------------------------
// Deterministic RNG (mulberry32). Every world system is seeded so
// the world is identical between runs while still feeling organic.
// ------------------------------------------------------------
export class RNG {
  constructor(seed = 1337) { this.s = (seed >>> 0) || 1; }
  next() {
    let t = (this.s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  pickWeighted(arr, weightFn) {
    let total = 0;
    for (const it of arr) total += weightFn(it);
    let r = this.next() * total;
    for (const it of arr) { r -= weightFn(it); if (r <= 0) return it; }
    return arr[arr.length - 1];
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  // gaussian-ish
  bell() { return (this.next() + this.next() + this.next()) / 3; }
  fork(tag = 0) { return new RNG((this.s ^ (tag * 2654435761)) >>> 0 || 7); }
}

export const hash2 = (x, y, seed = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ------------------------------------------------------------
// Value noise + fbm, tileable so textures repeat seamlessly.
// ------------------------------------------------------------
export class Noise {
  constructor(seed = 1) {
    const rng = new RNG(seed);
    this.perm = new Uint8Array(512);
    const p = Array.from({ length: 256 }, (_, i) => i);
    rng.shuffle(p);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  // Tileable value noise over [0,1) with integer period `per`
  value2(x, y, per = 256) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = smootherstep(xf), v = smootherstep(yf);
    const wrap = (n) => ((n % per) + per) % per;
    const h = (a, b) => {
      const A = this.perm[(this.perm[wrap(a) & 255] + wrap(b)) & 511];
      return A / 255;
    };
    const x0 = wrap(xi), x1 = wrap(xi + 1), y0 = wrap(yi), y1 = wrap(yi + 1);
    const a = h(x0, y0), b = h(x1, y0), c = h(x0, y1), d = h(x1, y1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  fbm2(x, y, octaves = 4, per = 256, gain = 0.5, lac = 2) {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.value2(x * f, y * f, per * f);
      norm += amp; amp *= gain; f *= lac;
    }
    return sum / norm;
  }
  ridged(x, y, octaves = 4, per = 256) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(this.value2(x * f, y * f, per * f) * 2 - 1);
      sum += n * n * amp; norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }
  // Voronoi F1 (cracked / cellular patterns) — cheap version using jittered grid.
  cells(x, y, per = 8, seedMul = 1) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let best = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx, cy = yi + dy;
      const r = hash2(cx, cy, per * 977 + seedMul);
      const r2 = hash2(cx, cy, per * 613 + 91 * seedMul);
      const px = cx + r, py = cy + r2;
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
}

// Cheap deterministic 1D wobble used by animation code.
export const wobble = (t, f = 1, phase = 0) => Math.sin(t * f + phase);

// Seeded pick from a list of strings/objects, stable across sessions.
export const stablePick = (arr, seed) => arr[Math.floor(hash2(seed, arr.length * 31, 17) * arr.length) % arr.length];

export const fmt = {
  time(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },
  num(n) { return Math.round(n).toLocaleString('en-US'); },
  pct(n) { return `${Math.round(n * 100)}%`; },
};

export const roman = (n) => ['I','II','III','IV','V','VI','VII','VIII','IX','X'][n - 1] || String(n);
