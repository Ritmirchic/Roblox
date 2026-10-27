// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// core/textures.js — procedural PBR texture synthesis
//
// Every material in the game is generated at runtime from compact
// recipes: albedo, height->normal, roughness + metalness (ORM).
// No external art dependencies, fully deterministic, tileable.
// ============================================================
import { Noise, RNG, clamp, lerp, saturate, smoothstep } from './util.js';

// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------
// Generator working values are authored perceptually (sRGB-ish); store directly.
const srgb = (v) => Math.round(saturate(v) * 255);

class Tex {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.C = new Float32Array(w * h * 3);   // albedo (linear-ish working values)
    this.H = new Float32Array(w * h);       // height 0..1
    this.R = new Float32Array(w * h);       // roughness 0..1
    this.M = new Float32Array(w * h);       // metalness 0..1
    this.E = new Float32Array(w * h * 3);   // emissive 0..1
  }
  idx(x, y) {
    const w = this.w, h = this.h;
    x = ((x % w) + w) % w; y = ((y % h) + h) % h;
    return y * w + x;
  }
  col(x, y) {
    const i = this.idx(x, y) * 3;
    return [this.C[i], this.C[i + 1], this.C[i + 2]];
  }
  setC(x, y, r, g, b) {
    const i = this.idx(x, y) * 3;
    this.C[i] = r; this.C[i + 1] = g; this.C[i + 2] = b;
  }
  addC(x, y, r, g, b, a = 1) {
    const i = this.idx(x, y) * 3;
    this.C[i] += r * a; this.C[i + 1] += g * a; this.C[i + 2] += b * a;
  }
  mulC(x, y, m) {
    const i = this.idx(x, y) * 3;
    this.C[i] *= m; this.C[i + 1] *= m; this.C[i + 2] *= m;
  }
  setAll(cb) {
    const { w, h } = this;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cb(this, x, y, x / w, y / h);
  }
}

// Tileable fbm helper bound to a Noise instance.
const makeFbm = (N) => (u, v, freq, oct = 4, gain = 0.5) => N.fbm2(u * freq, v * freq, oct, freq, gain);

function tileNoise(N, u, v, freq, seedOff = 0) {
  return N.value2(u * freq + seedOff, v * freq + seedOff, freq);
}

// Sobel-derived normal map from height, with wrap.
function normalFromHeight(T, strength = 2.0) {
  const { w, h } = T;
  const out = new Uint8ClampedArray(w * h * 4);
  const H = T.H;
  for (let y = 0; y < h; y++) {
    const ym = ((y - 1 + h) % h) * w, yp = ((y + 1) % h) * w;
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w, xp = (x + 1) % w;
      const l = H[ym + xm], r = H[ym + xp], d = H[yp + xm], u = H[yp + xp];
      const dx = (H[ym + xp] + 2 * H[y * w + xp] + u) - (l + 2 * H[y * w + xm] + d);
      const dy = (u + 2 * H[yp + x] + r) - (l + 2 * H[ym + x] + d);
      let nx = -dx * strength, ny = -dy * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      out[i] = (nx * 0.5 + 0.5) * 255;
      out[i + 1] = (ny * 0.5 + 0.5) * 255;
      out[i + 2] = (nz * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  }
  return out;
}

// Box blur of height (separable, wrap) for cheap cavity AO.
function blurH(H, w, h, radius = 6) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  const inv = 1 / (radius * 2 + 1);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -radius; x <= radius; x++) acc += H[y * w + ((x + w * 2) % w)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc * inv;
      acc += H[y * w + ((x + radius + 1) % w)] - H[y * w + ((x - radius + w) % w)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -radius; y <= radius; y++) acc += tmp[((y + h * 2) % h) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * inv;
      acc += tmp[((y + radius + 1) % h) * w + x] - tmp[((y - radius + h) % h) * w + x];
    }
  }
  return out;
}

function finish(T, opts = {}) {
  const { w, h } = T;
  const albedo = new Uint8ClampedArray(w * h * 4);
  const orm = new Uint8ClampedArray(w * h * 4);
  const emissive = new Uint8ClampedArray(w * h * 4);
  const hb = blurH(T.H, w, h, opts.aoRadius || 7);
  const aoStrength = opts.ao !== undefined ? opts.ao : 0.55;
  for (let i = 0; i < w * h; i++) {
    const cav = clamp(0.5 + (T.H[i] - hb[i]) * aoStrength * 8, 0.25, 1);
    albedo[i * 4] = srgb(T.C[i * 3]);
    albedo[i * 4 + 1] = srgb(T.C[i * 3 + 1]);
    albedo[i * 4 + 2] = srgb(T.C[i * 3 + 2]);
    albedo[i * 4 + 3] = 255;
    orm[i * 4] = Math.round(cav * 255);
    orm[i * 4 + 1] = Math.round(saturate(T.R[i]) * 255);
    orm[i * 4 + 2] = Math.round(saturate(T.M[i]) * 255);
    orm[i * 4 + 3] = 255;
    emissive[i * 4] = Math.round(saturate(T.E[i * 3]) * 255);
    emissive[i * 4 + 1] = Math.round(saturate(T.E[i * 3 + 1]) * 255);
    emissive[i * 4 + 2] = Math.round(saturate(T.E[i * 3 + 2]) * 255);
    emissive[i * 4 + 3] = 255;
  }
  return {
    width: w, height: h,
    albedo, normal: normalFromHeight(T, opts.normalStrength ?? 2.2),
    orm, emissive: T.E.some((v) => v > 0) ? emissive : null,
  };
}

// ------------------------------------------------------------
// MATERIAL RECIPES
// ------------------------------------------------------------
const GENS = {};

// --- Concrete: dirty cast slabs, form seams, cracks, pitting ------
GENS.concrete = (w, h, seed = 11) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 71);
  const fbm = makeFbm(N), fbm2 = makeFbm(N2);
  const R = new RNG(seed + 5);
  const pits = [];
  for (let i = 0; i < Math.round(w * h * 0.0011); i++) pits.push([R.int(0, w - 1), R.int(0, h - 1), R.range(1.2, 3.4), R.range(0.16, 0.5)]);
  const stains = [];
  for (let i = 0; i < 7; i++) stains.push([R.range(0, 1), R.range(0, 1), R.range(0.04, 0.22), R.range(0.35, 0.9)]);
  // Stamp the pits into a map once: testing every pixel against every pit was
  // 170 M distance checks and made this single texture take five seconds.
  const pitMap = new Float32Array(w * h);
  for (const [px, py, pr, pa] of pits) {
    const r = Math.ceil(pr);
    for (let yy = -r; yy <= r; yy++) {
      const y2 = ((py + yy) % h + h) % h;
      for (let xx = -r; xx <= r; xx++) {
        const d2 = xx * xx + yy * yy;
        if (d2 > pr * pr) continue;
        const x2 = ((px + xx) % w + w) % w;
        const v = pa * (1 - Math.sqrt(d2) / pr);
        const i = y2 * w + x2;
        if (v > pitMap[i]) pitMap[i] = v;
      }
    }
  }
  T.setAll((T, x, y, u, v) => {
    const mott = fbm(u, v, 6, 5);
    const fine = fbm2(u, v, 32, 3);
    const streak = fbm(u * 0.15, v, 12, 3);
    let base = 0.40 + mott * 0.20 + fine * 0.07;
    // form-work seams every 1/2 texture
    const seamX = Math.min(Math.abs(((u * 2) % 1) - 0), Math.abs(((u * 2) % 1) - 1));
    const seamY = Math.min(Math.abs(((v * 2) % 1) - 0), Math.abs(((v * 2) % 1) - 1));
    const seam = Math.min(seamX, seamY);
    let hgt = 0.55 + mott * 0.06;
    if (seam < 0.004) { base *= 0.62; hgt -= 0.18; }
    // cracks from cellular edges
    const c1 = N.cells(u * 5, v * 5, 5, 3), c2 = N.cells(u * 9 + 0.3, v * 9, 9, 8);
    const crack = Math.min(c1, c2);
    if (crack < 0.028) { base *= 0.55; hgt -= 0.12 * (1 - crack / 0.028); }
    // water stains
    let stain = 0;
    for (const [su, sv, sr, sa] of stains) {
      const d = Math.hypot((((u - su) + 1.5) % 1) - 0.5, (((v - sv) + 1.5) % 1) - 0.5);
      stain = Math.max(stain, smoothstep(1 - d / sr) * sa * 0.5);
    }
    base *= 1 - stain;
    // pitting (pre-stamped map, see above)
    const pit = pitMap[y * w + x];
    // shallow, soft pits: deep ones turned the concrete into a starfield under
    // a low light because the normal map amplified every speck
    hgt -= pit * 0.10; base -= pit * 0.10;
    // slight warm/cool variation
    T.setC(x, y, base * 1.0, base * 0.99 + streak * 0.02, base * 0.96 + 0.01);
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = 0.86 + fine * 0.1 - stain * 0.18 + pit * 0.05;
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 2.6, ao: 0.5 });
};

// --- Concrete floor: bigger slabs, expansion joints, oil ------
GENS.concrete_floor = (w, h, seed = 23) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 31);
  const R = new RNG(seed + 9);
  const oil = Array.from({ length: 5 }, () => [R.range(0, 1), R.range(0, 1), R.range(0.05, 0.16)]);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 8, v * 8, 4, 8);
    const g = N2.fbm2(u * 40, v * 40, 3, 40);
    let base = 0.34 + n * 0.16 + g * 0.06;
    const jx = Math.min((u * 2) % 1, 1 - (u * 2) % 1);
    const jy = Math.min((v * 2) % 1, 1 - (v * 2) % 1);
    const joint = Math.min(jx, jy);
    let hgt = 0.6 + n * 0.04;
    if (joint < 0.006) { base *= 0.5; hgt -= 0.25; }
    let oilMask = 0;
    for (const [ou, ov, orr] of oil) {
      const d = Math.hypot((((u - ou) + 1.5) % 1) - 0.5, (((v - ov) + 1.5) % 1) - 0.5);
      oilMask = Math.max(oilMask, smoothstep(1 - d / orr) * 0.75);
    }
    base *= 1 - oilMask * 0.55;
    T.setC(x, y, base, base * 0.985, base * 0.95);
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = 0.72 - oilMask * 0.45 + g * 0.06;
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 2.2 });
};

// --- Brick: red, chipped, mortar, soot --------------------------
GENS.brick = (w, h, seed = 41) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 13);
  const cols = 8, rows = 16;
  const bw = w / cols, bh = h / rows;
  const R = new RNG(seed + 3);
  const bricks = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    bricks.push({ r, c, tone: R.range(-0.09, 0.09), hue: R.range(-0.03, 0.03), chip: R.next() < 0.22 ? R.range(0.3, 1) : 0, soot: R.range(0, 1) });
  }
  T.setAll((T, x, y, u, v) => {
    const fy = v * rows, rx = (u * cols + (Math.floor(fy) % 2) * 0.5) % cols;
    const c = Math.floor(rx), r = Math.floor(fy);
    const b = bricks[(r % rows) * cols + (c % cols)];
    const lx = (rx % 1) * bw, ly = (fy % 1) * bh;
    const mortar = Math.min(lx, bw - lx, ly, bh - ly);
    const n = N.fbm2(u * 24, v * 24, 4, 24), fine = N2.fbm2(u * 90, v * 90, 2, 90);
    let hgt = 0.7 + n * 0.08;
    let base;
    if (mortar < 1.6) {
      base = 0.42 + n * 0.12;
      hgt = 0.32 + n * 0.04;
      T.setC(x, y, base, base * 0.97, base * 0.9);
      T.H[y * w + x] = hgt; T.R[y * w + x] = 0.95; T.M[y * w + x] = 0;
      return;
    }
    base = 0.31 + b.tone + n * 0.09;
    const rC = base * 1.25 + b.hue, gC = base * 0.62, bC = base * 0.5;
    // chipped corners reveal pale inner clay
    if (b.chip > 0) {
      const corner = Math.min(
        Math.hypot(lx, ly), Math.hypot(bw - lx, ly),
        Math.hypot(lx, bh - ly), Math.hypot(bw - lx, bh - ly));
      const chipR = 2.4 * b.chip;
      if (corner < chipR) { base = 0.5 + n * 0.1; hgt -= 0.16; }
    }
    const soot = b.soot * 0.12 + N2.fbm2(u * 5, v * 5, 3, 5) * 0.12;
    T.setC(x, y, rC * (1 - soot) + fine * 0.03, gC * (1 - soot) + fine * 0.02, bC * (1 - soot) + fine * 0.02);
    T.H[y * w + x] = hgt + fine * 0.03;
    T.R[y * w + x] = 0.93 - soot * 0.2;
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 3.4 });
};

// --- Grey concrete block / cinder block -----------------------
GENS.brick_grey = (w, h, seed = 47) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 3);
  const cols = 6, rows = 10, R = new RNG(seed);
  const tones = Array.from({ length: cols * rows }, () => R.range(-0.05, 0.05));
  T.setAll((T, x, y, u, v) => {
    const fy = v * rows, rx = (u * cols + (Math.floor(fy) % 2) * 0.5) % cols;
    const lx = (rx % 1) * (w / cols), ly = (fy % 1) * (h / rows);
    const mortar = Math.min(lx, w / cols - lx, ly, h / rows - ly);
    const n = N.fbm2(u * 16, v * 16, 4, 16), g = N2.fbm2(u * 64, v * 64, 3, 64);
    const tone = tones[(Math.floor(fy) % rows) * cols + (Math.floor(rx) % cols)];
    if (mortar < 1.3) {
      const b = 0.36 + n * 0.08;
      T.setC(x, y, b, b, b * 0.98); T.H[y * w + x] = 0.3; T.R[y * w + x] = 0.95; return;
    }
    let b = 0.45 + n * 0.14 + g * 0.05 + tone;
    if (mortar < 3) b *= 0.9;
    T.setC(x, y, b, b * 0.99, b * 0.95);
    T.H[y * w + x] = 0.65 + n * 0.1 - (mortar < 3 ? 0.06 : 0);
    T.R[y * w + x] = 0.9;
  });
  return finish(T, { normalStrength: 3.0 });
};

// --- Asphalt road ---------------------------------------------
GENS.asphalt = (w, h, seed = 61) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 9);
  const fbm = makeFbm(N), fbm2 = makeFbm(N2);
  T.setAll((T, x, y, u, v) => {
    const base = 0.115 + fbm(u, v, 10, 4) * 0.075;
    const agg = N2.cells(u * 46, v * 46, 46, 4);
    const grain = N2.value2(u * 190, v * 190, 190);
    let c = base + (agg < 0.35 ? 0.11 : 0) + grain * 0.035;
    let hgt = 0.5 + (agg < 0.35 ? 0.16 : 0) + grain * 0.12;
    // cracks
    const ck = Math.min(N.cells(u * 4.2, v * 4.2, 4, 17), N.cells(u * 7.3, v * 7.3, 7, 29));
    if (ck < 0.02) { c *= 0.35; hgt -= 0.3 * (1 - ck / 0.02); }
    // tar patch
    const patch = fbm2(u, v, 3, 3);
    if (patch > 0.66) { c *= 0.8; }
    T.setC(x, y, c, c * 0.99, c * 0.97);
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = 0.8 + grain * 0.12 + (patch > 0.66 ? -0.22 : 0);
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 1.8 });
};

// --- Dirt / soil ----------------------------------------------
GENS.dirt = (w, h, seed = 71) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 5);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 7, v * 7, 5, 7), f = N2.fbm2(u * 44, v * 44, 3, 44);
    const pebble = N2.cells(u * 22, v * 22, 22, 3);
    let b = 0.19 + n * 0.11 + f * 0.05;
    let hgt = 0.45 + n * 0.2 + f * 0.12;
    if (pebble < 0.14) { b += 0.13; hgt += 0.25; }
    T.setC(x, y, b * 1.10, b * 0.94, b * 0.74);
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = 0.92 - f * 0.08;
  });
  return finish(T, { normalStrength: 2.0 });
};

// --- Grass / dead lawn ---------------------------------------
GENS.grass = (w, h, seed = 83) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 17);
  const R = new RNG(seed + 2);
  const blades = [];
  for (let i = 0; i < Math.round(w * h * 0.035); i++) {
    blades.push([R.int(0, w - 1), R.int(0, h - 1), R.range(1.5, 4.0), R.range(0, 1), R.next() < 0.35]);
  }
  T.setAll((T, x, y, u, v) => {
    const patch = N.fbm2(u * 5, v * 5, 4, 5);
    const patch2 = N2.fbm2(u * 17, v * 17, 3, 17);
    const fine = N2.value2(u * 120, v * 120, 120);
    // desaturated olive / dead-grass palette
    const dry = smoothstep((patch - 0.28) * 2.0);
    const b = 0.19 + patch2 * 0.09 + fine * 0.05;
    const r = lerp(b * 0.92, b * 1.30, dry);
    const g = lerp(b * 1.06, b * 1.00, dry);
    const bl = lerp(b * 0.66, b * 0.62, dry);
    T.setC(x, y, r, g, bl);
    T.H[y * w + x] = 0.45 + patch2 * 0.18 + fine * 0.1;
    T.R[y * w + x] = 0.93;
  });
  for (const [bx, by, len, tone, dry] of blades) {
    for (let i = 0; i < len; i++) {
      const yy = by - i;
      const i2 = T.idx(bx + Math.floor(i * 0.18), yy);
      T.C[i2 * 3] += 0.03 * (1 - tone) + (dry ? 0.05 : 0);
      T.C[i2 * 3 + 1] += 0.045 * (1 - tone * 0.5);
      T.C[i2 * 3 + 2] += 0.012;
      T.H[i2] += 0.1;
    }
  }
  return finish(T, { normalStrength: 1.3, ao: 0.3 });
};

// --- Gravel / rubble ------------------------------------------
GENS.gravel = (w, h, seed = 97) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 4);
  T.setAll((T, x, y, u, v) => {
    const c1 = N.cells(u * 18, v * 18, 18, 1), c2 = N2.cells(u * 34, v * 34, 34, 7);
    const d = Math.min(c1, c2);
    const stone = d < 0.36 ? 1 : 0;
    const n = N2.fbm2(u * 30, v * 30, 3, 30);
    let b = 0.26 + n * 0.12 - d * 0.12;
    if (stone) b += 0.1;
    T.setC(x, y, b * 1.05, b, b * 0.9);
    T.H[y * w + x] = 0.4 + (stone ? 0.35 - d * 0.5 : 0.05);
    T.R[y * w + x] = 0.9;
  });
  return finish(T, { normalStrength: 3.2 });
};

// --- Rust -----------------------------------------------------
GENS.rust = (w, h, seed = 101) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 8);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 7, v * 7, 5, 7), f = N2.fbm2(u * 30, v * 30, 3, 30);
    const flake = N2.cells(u * 12, v * 12, 12, 5);
    const b = 0.16 + n * 0.2 + f * 0.06;
    const orange = smoothstep((n - 0.35) * 2.2);
    T.setC(x, y, lerp(0.13, 0.42, orange) + f * 0.05, lerp(0.09, 0.19, orange) + f * 0.02, lerp(0.07, 0.06, orange));
    T.H[y * w + x] = 0.45 + f * 0.2 - (flake < 0.2 ? 0.12 : 0) + b * 0.1;
    T.R[y * w + x] = 0.88 - n * 0.15;
    T.M[y * w + x] = 0.35 + n * 0.2;
  });
  return finish(T, { normalStrength: 2.6 });
};

// --- Riveted steel plate -------------------------------------
GENS.steel = (w, h, seed = 113) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 6);
  const plates = 2;
  T.setAll((T, x, y, u, v) => {
    const px = (u * plates) % 1, py = (v * plates) % 1;
    const edge = Math.min(px, 1 - px, py, 1 - py);
    const n = N.fbm2(u * 12, v * 12, 4, 12), f = N2.fbm2(u * 55, v * 55, 2, 55);
    let b = 0.26 + n * 0.08 + f * 0.03;
    let hgt = 0.55 + n * 0.04;
    let rough = 0.55 + n * 0.18;
    // seams
    if (edge < 0.008) { b *= 0.55; hgt -= 0.15; }
    // rivets along edges
    const rivetBand = (edge < 0.045 && edge > 0.012);
    const rivetU = (px * 10) % 1, rivetV = (py * 10) % 1;
    const rd = Math.hypot(rivetU - 0.5, rivetV - 0.5) * 0.1;
    if (rivetBand && rd < 0.018) {
      const rr = 1 - rd / 0.018;
      b += rr * 0.1; hgt += rr * 0.22; rough -= rr * 0.1;
    }
    // rust creeping from seams
    const rustAmt = smoothstep((n - 0.55) * 3) * (1 - smoothstep(edge * 6));
    b = lerp(b, 0.24, rustAmt * 0.5);
    const rr2 = n * 0.6 + 0.2;
    T.setC(x, y, b * (1 + rustAmt * 0.35), b * (1 - rustAmt * 0.05), b * (1 - rustAmt * 0.25));
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = clamp(rough + rustAmt * 0.3, 0.15, 1);
    T.M[y * w + x] = lerp(0.85, 0.25, rustAmt);
  });
  return finish(T, { normalStrength: 3.2 });
};

// --- Painted military metal ----------------------------------
GENS.metal_paint = (w, h, seed = 127) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 12);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 9, v * 9, 4, 9), f = N2.fbm2(u * 60, v * 60, 2, 60);
    const chip = N2.cells(u * 14, v * 14, 14, 3);
    const paint = 0.20 + n * 0.06;
    let r = paint * 0.85, g = paint * 1.02, b = paint * 0.72;
    let hgt = 0.6 + f * 0.03, rough = 0.55 + n * 0.12, met = 0.25;
    if (chip < 0.12 || n > 0.72) {
      const wear = chip < 0.06 ? 1 : 0.45;
      r = lerp(r, 0.30, wear); g = lerp(g, 0.16, wear); b = lerp(b, 0.10, wear);
      hgt -= 0.1 * wear; rough = lerp(rough, 0.85, wear); met = lerp(met, 0.55, wear);
    }
    T.setC(x, y, r, g, b);
    T.H[y * w + x] = hgt; T.R[y * w + x] = rough; T.M[y * w + x] = met;
  });
  return finish(T, { normalStrength: 2.0 });
};

// --- Weathered wood planks -----------------------------------
GENS.wood = (w, h, seed = 131) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 21);
  const planks = 5, R = new RNG(seed + 1);
  const tones = Array.from({ length: planks }, () => R.range(-0.05, 0.05));
  const knots = Array.from({ length: 4 }, () => [R.range(0, 1), R.range(0, 1), R.range(0.01, 0.03)]);
  T.setAll((T, x, y, u, v) => {
    const pi = Math.floor(u * planks);
    const lu = (u * planks) % 1;
    const grain = N.fbm2(u * 3 + pi * 7.3, v * 40, 4, 8);
    const fine = N2.fbm2(u * 90, v * 240, 2, 90);
    const b = 0.235 + grain * 0.1 + fine * 0.04 + tones[pi % planks];
    let hgt = 0.6 + grain * 0.08 + fine * 0.05;
    let rough = 0.82 + fine * 0.1;
    if (lu < 0.02 || lu > 0.98) { hgt -= 0.25; }
    // plank gaps
    const gap = Math.min(lu, 1 - lu);
    if (gap < 0.006) { hgt -= 0.3; }
    // knots
    for (const [ku, kv, kr] of knots) {
      const d = Math.hypot((((u - ku) + 1.5) % 1) - 0.5, (((v - kv) + 1.5) % 1) - 0.5);
      if (d < kr) { hgt += 0.08 * (1 - d / kr); }
    }
    // water rot at ends
    const rot = smoothstep((0.5 - Math.abs(lu - 0.5)) * 0) * 0;
    const grime = N2.fbm2(u * 6, v * 6, 3, 6);
    T.setC(x, y, b * 1.15 * (1 - grime * 0.25), b * 0.95 * (1 - grime * 0.2), b * 0.72 * (1 - grime * 0.15));
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = rough;
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 3.0 });
};

// --- Weathered grey wood (exterior) ---------------------------
GENS.wood_weathered = (w, h, seed = 137) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 2);
  const planks = 6;
  T.setAll((T, x, y, u, v) => {
    const lu = (u * planks) % 1;
    const grain = N.fbm2(u * 4, v * 50, 4, 6);
    const f = N2.fbm2(u * 70, v * 200, 2, 70);
    const b = 0.30 + grain * 0.12 + f * 0.05;
    let hgt = 0.6 + grain * 0.1 + f * 0.05;
    if (Math.min(lu, 1 - lu) < 0.012) hgt -= 0.3;
    T.setC(x, y, b * 1.0, b * 0.98, b * 0.92);
    T.H[y * w + x] = hgt; T.R[y * w + x] = 0.9;
  });
  return finish(T, { normalStrength: 2.8 });
};

// --- White bathroom tiles ------------------------------------
GENS.tiles = (w, h, seed = 149) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 3);
  const cols = 8, rows = 8, R = new RNG(seed);
  const tones = Array.from({ length: cols * rows }, () => R.range(-0.04, 0.02));
  T.setAll((T, x, y, u, v) => {
    const li = Math.floor(u * cols), ri = Math.floor(v * rows);
    const lx = (u * cols) % 1, ly = (v * rows) % 1;
    const gap = Math.min(lx, 1 - lx, ly, 1 - ly) * (w / cols);
    const n = N.fbm2(u * 20, v * 20, 3, 20), f = N2.fbm2(u * 90, v * 90, 2, 90);
    let b = 0.66 + n * 0.06 + tones[(ri % rows) * cols + (li % cols)];
    let hgt = 0.7 - n * 0.03;
    let rough = 0.28 + n * 0.12;
    let met = 0;
    if (gap < 1.4) { b = 0.28 + n * 0.08; hgt = 0.3; rough = 0.9; }
    // grime creeping from grout
    const grime = smoothstep((6 - gap) / 6) * (0.4 + n * 0.6);
    b *= 1 - grime * 0.35;
    // cracked tile
    const ck = N2.cells(u * 3, v * 3, 3, 9);
    if (ck < 0.012) { b *= 0.4; hgt -= 0.2; }
    T.setC(x, y, b, b * 0.99, b * 0.95);
    T.H[y * w + x] = hgt; T.R[y * w + x] = rough; T.M[y * w + x] = met;
  });
  return finish(T, { normalStrength: 2.4 });
};

// --- Interior wall panel / peeling paint ---------------------
GENS.panel = (w, h, seed = 151) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 4);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 8, v * 8, 4, 8), f = N2.fbm2(u * 45, v * 45, 3, 45);
    const peel = N2.cells(u * 7, v * 7, 7, 2);
    let b = 0.44 + n * 0.1 + f * 0.03;
    let hgt = 0.55 + f * 0.04;
    let rough = 0.8;
    if (peel < 0.18) {
      const w = 1 - peel / 0.18;
      b = lerp(b, 0.30, w * 0.8); hgt -= w * 0.12; rough = lerp(rough, 0.92, w);
    }
    // water damage running down
    const streak = N.fbm2(u * 22, v * 2, 3, 22);
    b *= 1 - smoothstep((streak - 0.55) * 4) * 0.35;
    T.setC(x, y, b * 0.98, b * 0.95, b * 0.86);
    T.H[y * w + x] = hgt; T.R[y * w + x] = rough;
  });
  return finish(T, { normalStrength: 2.0 });
};

// --- Fabric / canvas -----------------------------------------
GENS.fabric = (w, h, seed = 157) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 5);
  T.setAll((T, x, y, u, v) => {
    const weave = (Math.sin(u * w * 0.9) * 0.5 + 0.5) * (Math.cos(v * h * 0.9) * 0.5 + 0.5);
    const n = N.fbm2(u * 10, v * 10, 4, 10), f = N2.fbm2(u * 30, v * 30, 2, 30);
    const stain = smoothstep((N2.fbm2(u * 4, v * 4, 3, 4) - 0.52) * 3);
    const b = 0.47 + weave * 0.09 + n * 0.07;
    T.setC(x, y, b * 1.0 * (1 - stain * 0.38), b * 0.93 * (1 - stain * 0.34), b * 0.82 * (1 - stain * 0.26));
    T.H[y * w + x] = 0.5 + weave * 0.15 + f * 0.05;
    T.R[y * w + x] = 0.94;
  });
  return finish(T, { normalStrength: 1.6, ao: 0.3 });
};

// --- Skin (NPC faces / hands) ---------------------------------
GENS.skin = (w, h, seed = 161) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 3);
  T.setAll((T, x, y, u, v) => {
    const pore = N2.value2(u * 130, v * 130, 130);
    const mott = N.fbm2(u * 6, v * 6, 4, 6);
    const flush = smoothstep((N2.fbm2(u * 2.5, v * 2.5, 3, 2.5) - 0.5) * 2.4);
    const b = 0.70 + mott * 0.10 - pore * 0.045;
    T.setC(x, y, b * (1.0 + flush * 0.09), b * 0.86, b * (0.78 - flush * 0.04));
    T.H[y * w + x] = 0.5 + pore * 0.18 + mott * 0.06;
    T.R[y * w + x] = 0.72;   // skin is not glossy but not cloth-flat either
  });
  return finish(T, { normalStrength: 0.7, ao: 0.16 });
};

// --- Denim (twill) --------------------------------------------
GENS.denim = (w, h, seed = 167) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 4);
  T.setAll((T, x, y, u, v) => {
    const twill = Math.sin((u * w + v * h) * 0.55) * 0.5 + 0.5;
    const weave = (Math.sin(u * w * 2.4) * 0.5 + 0.5) * 0.4 + 0.6;
    const wear = smoothstep((N2.fbm2(u * 7, v * 7, 3, 7) - 0.55) * 2.6);
    const fade = smoothstep((N.fbm2(u * 3, v * 3, 3, 3) - 0.42) * 1.8);
    const b = 0.31 + twill * 0.06 + fade * 0.10 + wear * 0.11;
    T.setC(x, y, b * 0.80, b * 0.94, b * 1.30);
    T.H[y * w + x] = 0.5 + twill * 0.2 + weave * 0.05;
    T.R[y * w + x] = 0.92;
  });
  return finish(T, { normalStrength: 1.2, ao: 0.24 });
};

// --- Leather (belts, boots, coats) ----------------------------
GENS.leather = (w, h, seed = 173) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 8);
  T.setAll((T, x, y, u, v) => {
    const grain = N2.value2(u * 90, v * 90, 90);
    const crease = Math.abs(N.fbm2(u * 8, v * 8, 4, 8) - 0.5) * 2;
    const scuff = smoothstep((N2.fbm2(u * 4, v * 4, 3, 4) - 0.62) * 3);
    const b = 0.29 + grain * 0.05 + (1 - crease) * 0.05 + scuff * 0.13;
    T.setC(x, y, b * 1.06, b * 0.82, b * 0.62);
    T.H[y * w + x] = 0.5 + grain * 0.25 - crease * 0.14;
    T.R[y * w + x] = 0.55 + grain * 0.18;
  });
  return finish(T, { normalStrength: 1.4, ao: 0.3 });
};

// --- Sand / ash ----------------------------------------------
GENS.sand = (w, h, seed = 163) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 6);
  T.setAll((T, x, y, u, v) => {
    const ripple = Math.sin(v * 40 + N.value2(u * 6, v * 6, 6) * 9) * 0.5 + 0.5;
    const n = N.fbm2(u * 12, v * 12, 4, 12), f = N2.value2(u * 140, v * 140, 140);
    const b = 0.36 + n * 0.1 + f * 0.08 + ripple * 0.03;
    T.setC(x, y, b * 1.02, b * 0.96, b * 0.86);
    T.H[y * w + x] = 0.45 + ripple * 0.12 + f * 0.12;
    T.R[y * w + x] = 0.95;
  });
  return finish(T, { normalStrength: 2.2 });
};

// --- Rock / cliff --------------------------------------------
GENS.rock = (w, h, seed = 167) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 8);
  T.setAll((T, x, y, u, v) => {
    const r = N.ridged(u * 6, v * 6, 5, 6);
    const n = N2.fbm2(u * 10, v * 10, 4, 10);
    const crack = N2.cells(u * 5, v * 5, 5, 13);
    const b = 0.20 + r * 0.20 + n * 0.09;
    let hgt = r * 0.9 + n * 0.15;
    let c = b;
    if (crack < 0.03) { c *= 0.5; hgt -= 0.25 * (1 - crack / 0.03); }
    const moss = smoothstep((n - 0.52) * 4);
    T.setC(x, y, c * (1 - moss * 0.55), c * (1 + moss * 0.18), c * (1 - moss * 0.5));
    T.H[y * w + x] = hgt;
    T.R[y * w + x] = 0.9 - moss * 0.15;
  });
  return finish(T, { normalStrength: 3.0 });
};

// --- Tree bark ------------------------------------------------
GENS.bark = (w, h, seed = 173) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 5);
  T.setAll((T, x, y, u, v) => {
    const ridge = N.ridged(u * 12, v * 4, 4, 12);
    const n = N2.fbm2(u * 30, v * 8, 3, 30);
    const b = 0.13 + ridge * 0.14 + n * 0.04;
    const moss = smoothstep((N2.fbm2(u * 5, v * 5, 3, 5) - 0.55) * 3);
    T.setC(x, y, b * 1.1 * (1 - moss * 0.4), b * 0.95 * (1 + moss * 0.4), b * 0.78 * (1 - moss * 0.2));
    T.H[y * w + x] = ridge * 0.9 + n * 0.2;
    T.R[y * w + x] = 0.92;
  });
  return finish(T, { normalStrength: 3.4 });
};

// --- Leaf cluster (alpha cards) -------------------------------
GENS.leaves = (w, h, seed = 179) => {
  const T = new Tex(w, h), N = new Noise(seed);
  const R = new RNG(seed);
  const leaves = [];
  for (let i = 0; i < 46; i++) {
    leaves.push({ x: R.range(0.06, 0.94), y: R.range(0.06, 0.94), a: R.range(0, Math.PI * 2), len: R.range(0.06, 0.16), wd: R.range(0.03, 0.07), tone: R.range(-0.5, 0.5), rot: R.range(0, 1) });
  }
  const alpha = new Uint8ClampedArray(w * h);
  T.setAll((T, x, y, u, v) => {
    T.setC(x, y, 0, 0, 0); T.H[y * w + x] = 0; T.R[y * w + x] = 0.8;
  });
  for (const L of leaves) {
    const cx = L.x * w, cy = L.y * h, len = L.len * w, wd = L.wd * w;
    const ca = Math.cos(L.a), sa = Math.sin(L.a);
    for (let i = 0; i < Math.ceil(len * 2); i++) {
      for (let j = -Math.ceil(wd); j <= Math.ceil(wd); j++) {
        const t = i / (len * 2), ww = Math.sin(t * Math.PI) * wd;
        if (Math.abs(j) > ww) continue;
        const px = Math.round(cx + ca * (i - len) + -sa * j);
        const py = Math.round(cy + sa * (i - len) + ca * j);
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const ii = py * w + px;
        const n = N.value2(px / w * 30, py / h * 30, 30);
        const dead = L.tone > 0.2;
        const g = dead ? 0.30 + n * 0.2 + L.tone * 0.1 : 0.16 + n * 0.18;
        T.C[ii * 3] = dead ? 0.30 + L.tone * 0.2 : g * 0.8;
        T.C[ii * 3 + 1] = g;
        T.C[ii * 3 + 2] = dead ? 0.10 : g * 0.55;
        T.H[ii] = 0.5;
        alpha[ii] = 255;
      }
    }
  }
  const res = finish(T, { normalStrength: 1.0, ao: 0.2 });
  const alb = res.albedo;
  for (let i = 0; i < w * h; i++) alb[i * 4 + 3] = alpha[i];
  return res;
};

// --- Blood splatter decal ------------------------------------
GENS.blood = (w, h, seed = 181) => {
  const T = new Tex(w, h), N = new Noise(seed);
  const alpha = new Uint8ClampedArray(w * h);
  const cx = w / 2, cy = h / 2;
  T.setAll((T, x, y, u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5);
    const n = N.fbm2(u * 8, v * 8, 4, 8);
    const n2 = N.fbm2(u * 26, v * 26, 3, 26);
    let a = smoothstep((0.34 + n * 0.16 - d) * 6);
    // droplets
    const dr = N.value2(u * 26, v * 26, 26);
    if (dr > 0.78) a = Math.max(a, smoothstep((dr - 0.78) * 8) * 0.9);
    a *= 0.55 + n2 * 0.7;
    const dark = 0.16 + n * 0.14;
    T.setC(x, y, dark * 1.5, dark * 0.16, dark * 0.14);
    T.H[y * w + x] = 0.5;
    T.R[y * w + x] = 0.22 + n * 0.2;
    alpha[y * w + x] = clamp(a, 0, 1) * 255;
  });
  const res = finish(T, { normalStrength: 0.6 });
  for (let i = 0; i < w * h; i++) res.albedo[i * 4 + 3] = alpha[i];
  return res;
};

// --- Bullet hole decal ---------------------------------------
GENS.bullet = (w, h, seed = 191) => {
  const T = new Tex(w, h), N = new Noise(seed);
  const alpha = new Uint8ClampedArray(w * h);
  T.setAll((T, x, y, u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5);
    const n = N.fbm2(u * 18, v * 18, 4, 18);
    const rim = smoothstep((0.18 + n * 0.08 - d) * 10);
    const core = smoothstep((0.10 + n * 0.05 - d) * 14);
    let c = lerp(0.34, 0.05, core);
    c += smoothstep((d - 0.22) * 12) * 0.1 * (n > 0.5 ? 1 : 0.4);
    T.setC(x, y, c, c * 0.95, c * 0.9);
    T.H[y * w + x] = 1 - core * 0.8 + rim * 0.1;
    T.R[y * w + x] = 0.7;
    alpha[y * w + x] = clamp(rim, 0, 1) * 255;
  });
  const res = finish(T, { normalStrength: 2.2 });
  for (let i = 0; i < w * h; i++) res.albedo[i * 4 + 3] = alpha[i];
  return res;
};

// --- Hazard stripes (yellow / black, chipped) ----------------
GENS.hazard = (w, h, seed = 193) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 3);
  T.setAll((T, x, y, u, v) => {
    const s = Math.floor((u + v) * 12) % 2;
    const n = N2.fbm2(u * 30, v * 30, 3, 30);
    const chip = N2.cells(u * 20, v * 20, 20, 7);
    let c;
    if (s) { c = [0.62 + n * 0.1, 0.48 + n * 0.06, 0.06]; }
    else { c = [0.10 + n * 0.05, 0.10 + n * 0.05, 0.09 + n * 0.04]; }
    if (chip < 0.1) c = [0.22 + n * 0.1, 0.15, 0.12];
    T.setC(x, y, c[0], c[1], c[2]);
    T.H[y * w + x] = 0.6 + n * 0.1 - (chip < 0.1 ? 0.2 : 0);
    T.R[y * w + x] = 0.7 + n * 0.2;
    T.M[y * w + x] = 0.2;
  });
  return finish(T, { normalStrength: 1.8 });
};

// --- Mutant flesh --------------------------------------------
GENS.flesh = (w, h, seed = 197) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 4);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 6, v * 6, 5, 6), f = N2.fbm2(u * 24, v * 24, 3, 24);
    const vein = N2.ridged(u * 4, v * 4, 3, 4);
    const b = 0.30 + n * 0.22 + f * 0.06;
    const veins = smoothstep((vein - 0.62) * 6);
    const bruise = smoothstep((N.fbm2(u * 3, v * 3, 2, 3) - 0.55) * 4);
    T.setC(x, y,
      lerp(b * 1.0, 0.36, veins) * (1 - bruise * 0.35),
      lerp(b * 0.86, 0.12, veins) * (1 - bruise * 0.5),
      lerp(b * 0.80, 0.22, veins) * (1 - bruise * 0.1));
    T.H[y * w + x] = 0.5 + n * 0.2 + f * 0.1 + veins * 0.1;
    T.R[y * w + x] = 0.42 - veins * 0.2 + f * 0.1;
    T.M[y * w + x] = 0;
  });
  return finish(T, { normalStrength: 2.6 });
};

// --- Organic armor (fused metal + chitin) --------------------
GENS.armor = (w, h, seed = 211) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 9);
  T.setAll((T, x, y, u, v) => {
    const plate = N.cells(u * 6, v * 6, 6, 2);
    const rim = smoothstep((0.12 - plate) * 8);
    const n = N2.fbm2(u * 16, v * 16, 4, 16);
    const rust = smoothstep((n - 0.5) * 4);
    let b = 0.20 + n * 0.12 - rim * 0.06;
    const rr = lerp(b * 0.9, 0.34, rust), gg = lerp(b * 0.92, 0.15, rust), bb = lerp(b * 0.95, 0.09, rust);
    T.setC(x, y, rr, gg, bb);
    T.H[y * w + x] = 0.7 - rim * 0.3 + n * 0.05;
    T.R[y * w + x] = 0.55 + rust * 0.3;
    T.M[y * w + x] = lerp(0.6, 0.25, rust);
  });
  return finish(T, { normalStrength: 3.0 });
};

// --- Nest / organic growth -----------------------------------
GENS.nest = (w, h, seed = 223) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 1);
  T.setAll((T, x, y, u, v) => {
    const web = N.ridged(u * 8, v * 8, 4, 8);
    const flesh = N2.fbm2(u * 5, v * 5, 4, 5);
    const b = 0.22 + web * 0.18 + flesh * 0.12;
    T.setC(x, y, b * 0.75, b * 0.5, b * 0.46);
    T.H[y * w + x] = web * 0.8 + flesh * 0.3;
    T.R[y * w + x] = 0.45 + flesh * 0.25;
  });
  return finish(T, { normalStrength: 3.2 });
};

// --- Radioactive sludge (emissive) ---------------------------
GENS.radiation = (w, h, seed = 227) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 7);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 7, v * 7, 5, 7), f = N2.fbm2(u * 30, v * 30, 3, 30);
    const glow = smoothstep((n - 0.42) * 2.5);
    const b = 0.10 + n * 0.1;
    T.setC(x, y, b * 0.7 + glow * 0.12, b * 0.9 + glow * 0.55, b * 0.6 + glow * 0.1);
    T.H[y * w + x] = 0.5 + f * 0.2;
    T.R[y * w + x] = 0.35 + f * 0.4;
    T.E[y * w * 3] = glow * 0.25;
    T.E[y * w * 3 + 1] = glow * 0.85;
    T.E[y * w * 3 + 2] = glow * 0.2;
  });
  return finish(T, { normalStrength: 1.6 });
};

// --- CRT screen (emissive) -----------------------------------
GENS.screen = (w, h, seed = 229) => {
  const T = new Tex(w, h), N = new Noise(seed);
  T.setAll((T, x, y, u, v) => {
    const scan = (Math.sin(v * h * 0.8) * 0.5 + 0.5) * 0.25 + 0.6;
    const noise = N.value2(u * 60, v * 60, 60);
    const vign = 1 - Math.hypot(u - 0.5, v - 0.5) * 0.6;
    const line = (Math.floor(v * 26) % 3 === 0) ? smoothstep((0.5 - Math.abs(u - 0.5)) * 2) * 0.5 : 0;
    const c = (0.06 + noise * 0.05 + line * 0.4) * vign;
    T.setC(x, y, c * 0.5, c * 0.9, c * 0.65);
    T.H[y * w + x] = 0.5;
    T.R[y * w + x] = 0.25;
    T.E[y * w * 3] = c * 0.6;
    T.E[y * w * 3 + 1] = c * 1.0;
    T.E[y * w * 3 + 2] = c * 0.8;
  });
  return finish(T, { normalStrength: 0.4 });
};

// --- Rusted corrugated roof ---------------------------------
GENS.corrugated = (w, h, seed = 233) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 3);
  T.setAll((T, x, y, u, v) => {
    const wave = Math.sin(u * Math.PI * 2 * 12) * 0.5 + 0.5;
    const n = N.fbm2(u * 8, v * 8, 4, 8), f = N2.fbm2(u * 40, v * 40, 3, 40);
    const rust = smoothstep((f - 0.35) * 2.2);
    const b = 0.20 + wave * 0.08 + n * 0.06;
    T.setC(x, y, lerp(b, 0.38, rust * 0.8), lerp(b * 0.95, 0.18, rust * 0.8), lerp(b * 0.9, 0.12, rust * 0.8));
    T.H[y * w + x] = 0.4 + wave * 0.5;
    T.R[y * w + x] = 0.6 + rust * 0.3;
    T.M[y * w + x] = 0.7 - rust * 0.5;
  });
  return finish(T, { normalStrength: 3.6 });
};

// --- Old postcard / paper (for notes & documents) ------------
GENS.paper = (w, h, seed = 239) => {
  const T = new Tex(w, h), N = new Noise(seed), N2 = new Noise(seed + 2);
  T.setAll((T, x, y, u, v) => {
    const n = N.fbm2(u * 10, v * 10, 4, 10);
    const stain = smoothstep((N2.fbm2(u * 3.5, v * 3.5, 3, 4) - 0.5) * 3);
    const b = 0.72 + n * 0.07;
    T.setC(x, y, b, b * 0.94 * (1 - stain * 0.25), b * 0.80);
    T.H[y * w + x] = 0.5 + n * 0.15;
    T.R[y * w + x] = 0.9;
  });
  return finish(T, { normalStrength: 1.0, ao: 0.2 });
};

// --- Grass card / undergrowth (alpha) -----------------------
GENS.grasscard = (w, h, seed = 241) => {
  const T = new Tex(w, h), N = new Noise(seed);
  const R = new RNG(seed + 3);
  const alpha = new Uint8ClampedArray(w * h);
  const blades = [];
  for (let i = 0; i < 90; i++) {
    blades.push({ x: R.range(0.02, 0.98), len: R.range(0.25, 0.95), lean: R.range(-0.28, 0.28), w: R.range(0.004, 0.011), tone: R.range(0, 1), dry: R.next() < 0.3 });
  }
  T.setAll((T, x, y, u, v) => { T.setC(x, y, 0, 0, 0); T.H[y * w + x] = 0; T.R[y * w + x] = 0.9; });
  for (const b of blades) {
    const steps = Math.ceil(b.len * h);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = Math.round(b.x * w + b.lean * t * t * w);
      const py = Math.round((1 - t * b.len) * h);
      const halfW = Math.max(1, Math.round(b.w * w * (1 - t * 0.7)));
      for (let o = -halfW; o <= halfW; o++) {
        const xx = px + o;
        if (xx < 0 || xx >= w || py < 0 || py >= h) continue;
        const ii = py * w + xx;
        const n = N.value2(xx / w * 20, py / h * 20, 20);
        const g = 0.20 + n * 0.16 + b.tone * 0.12;
        const dry = b.dry ? 0.55 : 0.0;
        T.C[ii * 3] = g * (0.85 + dry * 1.6);
        T.C[ii * 3 + 1] = g * (1.0 + dry * 0.55);
        T.C[ii * 3 + 2] = g * (0.55 + dry * 0.25);
        T.H[ii] = 0.5 + t * 0.2;
        alpha[ii] = 255;
      }
    }
  }
  const res = finish(T, { normalStrength: 0.8, ao: 0.2 });
  for (let i = 0; i < w * h; i++) res.albedo[i * 4 + 3] = alpha[i];
  return res;
};

export const MATERIAL_RECIPES = {
  concrete: { gen: GENS.concrete, size: 512, normalScale: 1.0, rough: 1 },
  concrete_floor: { gen: GENS.concrete_floor, size: 512, normalScale: 1.0 },
  brick: { gen: GENS.brick, size: 512, normalScale: 1.0 },
  brick_grey: { gen: GENS.brick_grey, size: 256, normalScale: 1.0 },
  asphalt: { gen: GENS.asphalt, size: 512, normalScale: 1.0 },
  dirt: { gen: GENS.dirt, size: 512, normalScale: 1.0 },
  grass: { gen: GENS.grass, size: 512, normalScale: 1.0 },
  gravel: { gen: GENS.gravel, size: 256, normalScale: 1.0 },
  rust: { gen: GENS.rust, size: 256, normalScale: 1.0 },
  steel: { gen: GENS.steel, size: 512, normalScale: 1.0 },
  metal_paint: { gen: GENS.metal_paint, size: 256, normalScale: 1.0 },
  wood: { gen: GENS.wood, size: 512, normalScale: 1.0 },
  wood_weathered: { gen: GENS.wood_weathered, size: 256, normalScale: 1.0 },
  tiles: { gen: GENS.tiles, size: 512, normalScale: 1.0 },
  panel: { gen: GENS.panel, size: 256, normalScale: 1.0 },
  fabric: { gen: GENS.fabric, size: 256, normalScale: 1.0 },
  skin: { gen: GENS.skin, size: 256, normalScale: 1.0 },
  denim: { gen: GENS.denim, size: 256, normalScale: 1.0 },
  leather: { gen: GENS.leather, size: 256, normalScale: 1.0 },
  sand: { gen: GENS.sand, size: 256, normalScale: 1.0 },
  rock: { gen: GENS.rock, size: 384, normalScale: 1.0 },
  bark: { gen: GENS.bark, size: 256, normalScale: 1.0 },
  leaves: { gen: GENS.leaves, size: 256, normalScale: 1.0, alpha: true },
  blood: { gen: GENS.blood, size: 256, normalScale: 1.0, alpha: true, decal: true },
  bullet: { gen: GENS.bullet, size: 128, normalScale: 1.0, alpha: true, decal: true },
  hazard: { gen: GENS.hazard, size: 256, normalScale: 1.0 },
  flesh: { gen: GENS.flesh, size: 256, normalScale: 1.0 },
  armor: { gen: GENS.armor, size: 256, normalScale: 1.0 },
  nest: { gen: GENS.nest, size: 256, normalScale: 1.0 },
  radiation: { gen: GENS.radiation, size: 256, normalScale: 1.0, emissive: true },
  screen: { gen: GENS.screen, size: 256, normalScale: 1.0, emissive: true },
  corrugated: { gen: GENS.corrugated, size: 256, normalScale: 1.0 },
  paper: { gen: GENS.paper, size: 256, normalScale: 1.0 },
  grasscard: { gen: GENS.grasscard, size: 256, normalScale: 1.0, alpha: true },
};

const CACHE = new Map();

export function getTextureSet(name, sizeOverride) {
  const recipe = MATERIAL_RECIPES[name];
  if (!recipe) throw new Error('Unknown material: ' + name);
  const size = sizeOverride || recipe.size;
  const key = name + ':' + size;
  if (CACHE.has(key)) return CACHE.get(key);
  const set = recipe.gen(size, size, 1000 + Object.keys(MATERIAL_RECIPES).indexOf(name) * 37);
  set.name = name;
  set.alpha = !!recipe.alpha;
  set.emissiveMap = !!recipe.emissive;
  CACHE.set(key, set);
  return set;
}

export function listMaterials() { return Object.keys(MATERIAL_RECIPES); }
export function clearTextureCache() { CACHE.clear(); }

// Small helper: average colour of a material (used by foliage tinting, UI icons...)
export function averageColor(name) {
  const set = getTextureSet(name);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < set.albedo.length; i += 16) {
    r += set.albedo[i]; g += set.albedo[i + 1]; b += set.albedo[i + 2]; n++;
  }
  return [r / n / 255, g / n / 255, b / n / 255];
}
