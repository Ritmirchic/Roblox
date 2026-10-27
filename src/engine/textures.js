/**
 * Procedural PBR texture factory.
 * Every surface in the game (concrete, rust, brick, asphalt, wood, blood...) is
 * generated at load time from deterministic noise + hand authored stamping
 * routines. Nothing is downloaded: the game ships zero third-party art.
 */
import * as THREE from 'three';
import { makeRng, clamp01, lerp, valueNoise2, fbm2, smoothstep } from './util.js';

const rand = makeRng(424242);

function canvasOf(size) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size, size) : Object.assign(document.createElement('canvas'), { width: size, height: size });
  return c;
}

/** Periodic value noise so tiled textures are seamless. */
function pnoise(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = (i, j) => {
    const ii = ((i % period) + period) % period;
    const jj = ((j % period) + period) % period;
    let h = ii * 374761393 + jj * 668265263 + seed * 1442695041;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return lerp(lerp(w(xi, yi), w(xi + 1, yi), u), lerp(w(xi, yi + 1), w(xi + 1, yi + 1), u), v);
}

function pfbm(x, y, period, octaves, seed) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * pnoise(x * freq, y * freq, period * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function ctxOf(c) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  return ctx;
}

function cloneCanvas(src) {
  const c = canvasOf(src.width);
  ctxOf(c).drawImage(src, 0, 0);
  return c;
}

/** Draw a stamp wrapped across tile borders. */
function wrapStamp(size, x, y, margin, draw) {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      const px = x + dx;
      const py = y + dy;
      if (px < -margin || px > size + margin || py < -margin || py > size + margin) continue;
      draw(px, py);
    }
  }
}

function stains(ctx, size, rng, color, count, maxR, alpha = 0.5) {
  for (let i = 0; i < count; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = rng.range ? rng.range(maxR * 0.2, maxR) : maxR * (0.2 + rng() * 0.8);
    wrapStamp(size, x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function crackLines(ctx, size, rng, count, color, width = 1, len = 0.25) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    let x = rng() * size;
    let y = rng() * size;
    let a = rng() * Math.PI * 2;
    const steps = Math.floor(size * len * (0.4 + rng()));
    ctx.lineWidth = width * (0.5 + rng());
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++) {
      a += (rng() - 0.5) * 0.9;
      x += Math.cos(a) * 3;
      y += Math.sin(a) * 3;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function speckle(ctx, size, rng, count, colors, minR = 0.5, maxR = 2.2) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    const r = minR + rng() * (maxR - minR);
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function normalFromHeight(heightCanvas, strength = 2.2) {
  const size = heightCanvas.width;
  const src = ctxOf(heightCanvas).getImageData(0, 0, size, size).data;
  const out = canvasOf(size);
  const octx = ctxOf(out);
  const img = octx.createImageData(size, size);
  const d = img.data;
  const h = (x, y) => {
    const xx = (x + size) % size;
    const yy = (y + size) % size;
    return src[(yy * size + xx) * 4] / 255;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      d[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

function fillBase(ctx, size, colFn) {
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const c = colFn(x / size, y / size, x, y);
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Builds an albedo / roughness / normal triplet. */
function makeSet(name, size, painter, { normalStrength = 2.0, roughness = 0.85 } = {}) {
  const albedo = canvasOf(size);
  const actx = ctxOf(albedo);
  const height = canvasOf(size);
  const hctx = ctxOf(height);
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, size, size);
  const rough = canvasOf(size);
  const rctx = ctxOf(rough);
  rctx.fillStyle = `rgb(${Math.round(roughness * 255)},${Math.round(roughness * 255)},${Math.round(roughness * 255)})`;
  rctx.fillRect(0, 0, size, size);
  const rng = makeRng(1000 + name.length * 977 + size);
  painter({ size, actx, hctx, rctx, rng, stains, crackLines, speckle, fillBase, normalStrength, pnoise, pfbm, name });
  return { albedo, height, rough, normalStrength, name };
}

// ---------------------------------------------------------------------------
// Material painters
// ---------------------------------------------------------------------------
const PAINTERS = {
  concrete({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, speckle, pfbm }) {
    const base = rgb(0x8b8a83);
    const dark = rgb(0x5d5c56);
    const pale = rgb(0xa9a69c);
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 6, v * 6, 6, 4, 11);
      const m = pfbm(u * 24, v * 24, 24, 3, 31);
      let c = mixc(base, dark, smoothstep(0.35, 0.75, n) * 0.75);
      c = mixc(c, pale, smoothstep(0.55, 0.95, m) * 0.25);
      const g = (rng() - 0.5) * 10;
      return [c[0] + g, c[1] + g, c[2] + g];
    });
    stains(actx, size, rng, '#4a463d', 12, size * 0.22, 0.25);
    stains(actx, size, rng, '#2c2a25', 6, size * 0.35, 0.18);
    crackLines(actx, size, rng, 9, 'rgba(38,36,32,0.65)', 1.1, 0.16);
    speckle(actx, size, rng, 900, ['rgba(60,58,52,0.5)', 'rgba(190,186,175,0.4)'], 0.4, 1.6);
    // vertical weathering streaks
    for (let i = 0; i < 40; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const h = size * (0.1 + rng() * 0.4);
      const g = actx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(50,48,42,0.32)');
      g.addColorStop(1, 'rgba(50,48,42,0)');
      actx.fillStyle = g;
      actx.fillRect(x, y, 1 + rng() * 2.5, h);
    }
    // height: noise + cracks darker
    fillBase(hctx, size, (u, v) => {
      const n = pfbm(u * 8, v * 8, 8, 4, 77) * 0.8 + pfbm(u * 40, v * 40, 40, 3, 3) * 0.2;
      const g = 110 + n * 70;
      return [g, g, g];
    });
    crackLines(hctx, size, rng, 9, 'rgba(40,40,40,0.9)', 1.6, 0.16);
    fillBase(rctx, size, (u, v) => {
      const n = pfbm(u * 7, v * 7, 7, 4, 91);
      const g = 190 + n * 45;
      return [g, g, g];
    });
    stains(rctx, size, rng, '#ffffff', 8, size * 0.25, 0.25);
  },

  concreteFloor({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 5, v * 5, 5, 5, 5);
      const m = pfbm(u * 30, v * 30, 30, 2, 8);
      let c = mixc(rgb(0x7a7770), rgb(0x53514b), smoothstep(0.3, 0.8, n));
      c = mixc(c, rgb(0x8d897f), m * 0.2);
      return c;
    });
    stains(actx, size, rng, '#3c3a33', 10, size * 0.3, 0.28);
    stains(actx, size, rng, '#6b5744', 5, size * 0.14, 0.35); // oil
    crackLines(actx, size, rng, 12, 'rgba(30,29,26,0.7)', 1.4, 0.22);
    speckle(actx, size, rng, 1300, ['rgba(45,44,40,0.45)', 'rgba(170,165,152,0.35)'], 0.3, 1.4);
    fillBase(hctx, size, (u, v) => {
      const n = pfbm(u * 9, v * 9, 9, 4, 15);
      return [100 + n * 80, 100 + n * 80, 100 + n * 80];
    });
    crackLines(hctx, size, rng, 12, 'rgba(20,20,20,0.9)', 2.0, 0.22);
    fillBase(rctx, size, (u, v) => {
      const n = pfbm(u * 6, v * 6, 6, 3, 61);
      const g = 170 + n * 60;
      return [g, g, g];
    });
    stains(rctx, size, rng, '#000000', 6, size * 0.2, 0.4);
  },

  brick({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, speckle, pfbm }) {
    const mortar = rgb(0x8d8778);
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 12, v * 12, 12, 3, 23);
      return mixc(mortar, rgb(0x6f6a5e), n * 0.6);
    });
    const rows = 12;
    const h = size / rows;
    const bw = size / 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw * 0.5;
      for (let b = -1; b < 5; b++) {
        const x = b * bw + off + 2;
        const y = r * h + 2;
        const tone = 0.55 + rng() * 0.45;
        const c = mixc(rgb(0x6d3a2c), rgb(0x8f5138), tone);
        const cc = mixc(c, rgb(0x5a4a40), rng() * 0.5);
        actx.fillStyle = `rgb(${cc[0] | 0},${cc[1] | 0},${cc[2] | 0})`;
        actx.fillRect(x, y, bw - 4, h - 4);
        // brick face noise
        for (let k = 0; k < 14; k++) {
          actx.fillStyle = `rgba(${cc[0] + (rng() - 0.5) * 18 | 0},${cc[1] + (rng() - 0.5) * 14 | 0},${cc[2] + (rng() - 0.5) * 12 | 0},0.5)`;
          actx.fillRect(x + rng() * (bw - 6), y + rng() * (h - 6), 2, 2);
        }
        hctx.fillStyle = `rgb(${190 + rng() * 25},${190 + rng() * 25},${190 + rng() * 25})`;
        hctx.fillRect(x, y, bw - 4, h - 4);
        const rg = 170 + rng() * 55;
        rctx.fillStyle = `rgb(${rg},${rg},${rg})`;
        rctx.fillRect(x, y, bw - 4, h - 4);
      }
    }
    stains(actx, size, rng, '#2f2a22', 8, size * 0.25, 0.3);
    stains(actx, size, rng, '#7d8a6a', 5, size * 0.12, 0.22); // moss
    crackLines(actx, size, rng, 5, 'rgba(25,22,18,0.6)', 1.0, 0.2);
  },

  asphalt({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 18, v * 18, 18, 4, 43);
      const m = pfbm(u * 60, v * 60, 60, 2, 9);
      let c = mixc(rgb(0x3b3b3b), rgb(0x565656), smoothstep(0.35, 0.8, n));
      c = mixc(c, rgb(0x2a2a2a), m * 0.25);
      return c;
    });
    speckle(actx, size, rng, 2600, ['rgba(20,20,20,0.6)', 'rgba(120,118,112,0.45)', 'rgba(80,78,74,0.5)'], 0.3, 1.3);
    crackLines(actx, size, rng, 8, 'rgba(16,16,16,0.8)', 1.5, 0.3);
    stains(actx, size, rng, '#1d1d1d', 6, size * 0.28, 0.25);
    fillBase(hctx, size, (u, v) => {
      const n = pfbm(u * 25, v * 25, 25, 3, 55);
      return [110 + n * 60, 110 + n * 60, 110 + n * 60];
    });
    speckle(hctx, size, rng, 2000, ['rgba(60,60,60,0.7)', 'rgba(210,210,210,0.5)'], 0.3, 1.2);
    fillBase(rctx, size, (u, v) => {
      const g = 200 + pfbm(u * 10, v * 10, 10, 3, 33) * 45;
      return [g, g, g];
    });
  },

  dirt({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 4, v * 4, 4, 5, 71);
      const m = pfbm(u * 20, v * 20, 20, 3, 12);
      let c = mixc(rgb(0x5b4c39), rgb(0x7d6a4f), smoothstep(0.3, 0.9, n));
      c = mixc(c, rgb(0x41382b), m * 0.35);
      return c;
    });
    speckle(actx, size, rng, 1200, ['rgba(40,34,26,0.5)', 'rgba(140,125,98,0.4)', 'rgba(90,80,64,0.4)'], 0.4, 1.6);
    stains(actx, size, rng, '#3a3126', 6, size * 0.25, 0.3);
    fillBase(hctx, size, (u, v) => {
      const n = pfbm(u * 12, v * 12, 12, 4, 5);
      return [100 + n * 100, 100 + n * 100, 100 + n * 100];
    });
  },

  grass({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 5, v * 5, 5, 5, 22);
      const m = pfbm(u * 22, v * 22, 22, 3, 48);
      let c = mixc(rgb(0x3d4526), rgb(0x5c6435), smoothstep(0.25, 0.85, n));
      c = mixc(c, rgb(0x4a4a26), m * 0.4);
      return c;
    });
    // grass blade strokes
    for (let i = 0; i < 4000; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const h = 2 + rng() * 5;
      const shade = 60 + rng() * 70;
      actx.strokeStyle = `rgba(${shade * 0.65},${shade},${shade * 0.42},${0.25 + rng() * 0.45})`;
      actx.beginPath();
      actx.moveTo(x, y);
      actx.lineTo(x + (rng() - 0.5) * 2, y - h);
      actx.stroke();
    }
    speckle(actx, size, rng, 600, ['rgba(40,35,20,0.4)', 'rgba(110,105,60,0.35)'], 0.4, 2.0);
    fillBase(hctx, size, (u, v) => {
      const g = 120 + pfbm(u * 20, v * 20, 20, 3, 4) * 100;
      return [g, g, g];
    });
    fillBase(rctx, size, (u, v) => {
      const g = 225 + pfbm(u * 8, v * 8, 8, 3, 6) * 30;
      return [g, g, g];
    });
  },

  gravel({ size, actx, hctx, rctx, rng, fillBase, speckle, stains, pfbm }) {
    fillBase(actx, size, (u, v) => mixc(rgb(0x59544b), rgb(0x7d766a), pfbm(u * 8, v * 8, 8, 4, 19)));
    for (let i = 0; i < 1800; i++) {
      const r = 1 + rng() * 3.2;
      const g = 70 + rng() * 110;
      actx.fillStyle = `rgba(${g},${g - 6},${g - 14},${0.5 + rng() * 0.5})`;
      actx.beginPath();
      actx.ellipse(rng() * size, rng() * size, r, r * (0.6 + rng() * 0.6), rng() * 3, 0, Math.PI * 2);
      actx.fill();
    }
    stains(actx, size, rng, '#2f2b24', 5, size * 0.2, 0.25);
    fillBase(hctx, size, (u, v) => {
      const g = 150 + pfbm(u * 30, v * 30, 30, 3, 7) * 90;
      return [g, g, g];
    });
  },

  metalPlate({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, crackLines, pfbm }) {
    const paint = rgb(0x5d665c);
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 10, v * 10, 10, 3, 2);
      return mixc(paint, rgb(0x49514a), n * 0.7);
    });
    // panel seams
    actx.strokeStyle = 'rgba(28,30,28,0.8)';
    actx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      actx.beginPath();
      actx.moveTo(0, (size / 4) * i);
      actx.lineTo(size, (size / 4) * i);
      actx.stroke();
    }
    // rivets
    for (let i = 0; i < 60; i++) {
      const x = 6 + rng() * (size - 12);
      const y = 6 + rng() * (size - 12);
      actx.fillStyle = 'rgba(150,150,145,0.55)';
      actx.beginPath();
      actx.arc(x, y, 1.6, 0, Math.PI * 2);
      actx.fill();
      actx.fillStyle = 'rgba(25,25,25,0.4)';
      actx.beginPath();
      actx.arc(x + 0.8, y + 0.8, 1.6, 0, Math.PI * 2);
      actx.fill();
    }
    // rust bleed
    for (let i = 0; i < 18; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 6 + rng() * 30;
      wrapStamp(size, x, y, r, (px, py) => {
        const g = actx.createRadialGradient(px, py, 1, px, py, r);
        g.addColorStop(0, 'rgba(104,54,30,0.65)');
        g.addColorStop(0.5, 'rgba(84,46,28,0.35)');
        g.addColorStop(1, 'rgba(84,46,28,0)');
        actx.fillStyle = g;
        actx.beginPath();
        actx.arc(px, py, r, 0, Math.PI * 2);
        actx.fill();
      });
    }
    speckle(actx, size, rng, 500, ['rgba(150,78,40,0.5)', 'rgba(40,44,40,0.5)'], 0.4, 1.8);
    crackLines(actx, size, rng, 4, 'rgba(30,30,28,0.5)', 0.8, 0.14);
    fillBase(hctx, size, (u, v) => {
      const g = 130 + pfbm(u * 30, v * 30, 30, 3, 21) * 60;
      return [g, g, g];
    });
    fillBase(rctx, size, (u, v) => {
      const n = pfbm(u * 8, v * 8, 8, 4, 5);
      const g = 120 + n * 90;
      return [g, g, g];
    });
    stains(rctx, size, rng, '#ffffff', 14, size * 0.14, 0.5);
  },

  rust({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 6, v * 6, 6, 5, 66);
      const m = pfbm(u * 26, v * 26, 26, 3, 13);
      let c = mixc(rgb(0x5a3421), rgb(0x8a4d28), smoothstep(0.2, 0.85, n));
      c = mixc(c, rgb(0x3a2a20), m * 0.4);
      return c;
    });
    speckle(actx, size, rng, 1600, ['rgba(40,26,18,0.55)', 'rgba(160,96,48,0.5)', 'rgba(96,60,34,0.5)'], 0.4, 2.4);
    stains(actx, size, rng, '#2a1c14', 12, size * 0.2, 0.4);
    fillBase(hctx, size, (u, v) => {
      const g = 90 + pfbm(u * 18, v * 18, 18, 4, 3) * 110;
      return [g, g, g];
    });
    fillBase(rctx, size, (u, v) => {
      const g = 160 + pfbm(u * 14, v * 14, 14, 4, 3) * 80;
      return [g, g, g];
    });
  },

  wood({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => mixc(rgb(0x5c4630), rgb(0x7b6244), pfbm(u * 8, v * 8, 8, 3, 44)));
    const planks = 6;
    const ph = size / planks;
    for (let p = 0; p < planks; p++) {
      const tone = 0.75 + rng() * 0.5;
      const c = mixc(rgb(0x5a4229), rgb(0x86684a), rng());
      const y = p * ph;
      actx.fillStyle = `rgb(${(c[0] * tone) | 0},${(c[1] * tone) | 0},${(c[2] * tone) | 0})`;
      actx.fillRect(0, y + 1, size, ph - 2);
      // grain
      for (let g = 0; g < 26; g++) {
        const gy = y + 3 + rng() * (ph - 6);
        actx.strokeStyle = `rgba(${30 + rng() * 40},${20 + rng() * 30},${10 + rng() * 20},${0.15 + rng() * 0.25})`;
        actx.lineWidth = 0.6 + rng();
        actx.beginPath();
        actx.moveTo(0, gy);
        for (let x = 0; x <= size; x += size / 8) actx.lineTo(x, gy + Math.sin((x / size) * 7 + p) * 2 + (rng() - 0.5) * 1.5);
        actx.stroke();
      }
      // gap
      actx.fillStyle = 'rgba(18,12,8,0.85)';
      actx.fillRect(0, y, size, 2);
      const hg = 200 + rng() * 30;
      hctx.fillStyle = `rgb(${hg},${hg},${hg})`;
      hctx.fillRect(0, y + 1, size, ph - 3);
      hctx.fillStyle = 'rgb(30,30,30)';
      hctx.fillRect(0, y, size, 2);
    }
    stains(actx, size, rng, '#2b1f14', 7, size * 0.2, 0.3);
    speckle(actx, size, rng, 700, ['rgba(30,22,14,0.5)', 'rgba(150,120,88,0.35)'], 0.3, 1.5);
    rctx.fillStyle = 'rgba(255,255,255,0.15)';
    rctx.fillRect(0, 0, size, size);
  },

  woodFloor({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, () => rgb(0x6b5236));
    const planks = 8;
    const ph = size / planks;
    for (let p = 0; p < planks; p++) {
      const offset = (p % 2) * size * 0.5;
      for (let s = -1; s < 3; s++) {
        const x = s * (size / 2) + offset;
        const c = mixc(rgb(0x593f26), rgb(0x8a6c48), rng());
        actx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        actx.fillRect(x + 1, p * ph + 1, size / 2 - 2, ph - 2);
        for (let g = 0; g < 20; g++) {
          actx.strokeStyle = `rgba(40,26,14,${0.1 + rng() * 0.2})`;
          const gy = p * ph + 2 + rng() * (ph - 4);
          actx.beginPath();
          actx.moveTo(x, gy);
          actx.lineTo(x + size / 2, gy + (rng() - 0.5) * 3);
          actx.stroke();
        }
      }
      actx.fillStyle = 'rgba(20,14,9,0.8)';
      actx.fillRect(0, p * ph, size, 1.5);
    }
    stains(actx, size, rng, '#22180f', 9, size * 0.22, 0.35);
    speckle(actx, size, rng, 500, ['rgba(30,20,12,0.4)'], 0.4, 1.4);
    fillBase(hctx, size, () => [190, 190, 190]);
  },

  plaster({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, crackLines, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 7, v * 7, 7, 4, 33);
      return mixc(rgb(0x9a958a), rgb(0x7e7a70), n);
    });
    // peeling paint revealing concrete
    for (let i = 0; i < 7; i++) {
      const cx = rng() * size;
      const cy = rng() * size;
      const r = size * (0.06 + rng() * 0.16);
      const pts = [];
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const rad = r * (0.55 + rng() * 0.7);
        pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
      }
      actx.fillStyle = `rgb(${110 + rng() * 30},${108 + rng() * 30},${100 + rng() * 25})`;
      actx.beginPath();
      pts.forEach(([x, y], i2) => (i2 ? actx.lineTo(x, y) : actx.moveTo(x, y)));
      actx.closePath();
      actx.fill();
      actx.strokeStyle = 'rgba(50,45,38,0.5)';
      actx.stroke();
    }
    stains(actx, size, rng, '#4a4033', 8, size * 0.3, 0.3);
    crackLines(actx, size, rng, 6, 'rgba(40,36,30,0.55)', 1, 0.22);
    speckle(actx, size, rng, 700, ['rgba(60,55,46,0.4)', 'rgba(200,195,180,0.3)'], 0.3, 1.4);
    fillBase(hctx, size, (u, v) => {
      const g = 130 + pfbm(u * 10, v * 10, 10, 4, 8) * 80;
      return [g, g, g];
    });
  },

  tile({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, crackLines, pfbm }) {
    fillBase(actx, size, () => rgb(0x6d6f68));
    const n = 8;
    const s = size / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const c = mixc(rgb(0xaaa89f), rgb(0x8f8e84), rng());
        actx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        actx.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3);
        const hg = 210 + rng() * 30;
        hctx.fillStyle = `rgb(${hg},${hg},${hg})`;
        hctx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
        hctx.fillStyle = 'rgb(60,60,60)';
        hctx.fillRect(x * s, y * s, s, 2);
        hctx.fillRect(x * s, y * s, 2, s);
        for (let k = 0; k < 6; k++) {
          actx.fillStyle = `rgba(60,58,52,${rng() * 0.2})`;
          actx.fillRect(x * s + 3 + rng() * (s - 6), y * s + 3 + rng() * (s - 6), 2, 2);
        }
      }
    stains(actx, size, rng, '#4a463c', 10, size * 0.16, 0.35);
    stains(actx, size, rng, '#6b5a3a', 4, size * 0.1, 0.3);
    crackLines(actx, size, rng, 4, 'rgba(40,38,34,0.5)', 1, 0.3);
    rctx.fillStyle = 'rgba(255,255,255,0.25)';
    rctx.fillRect(0, 0, size, size);
  },

  roof({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, () => rgb(0x3c3a37));
    const rows = 10;
    const cols = 7;
    const h = size / rows;
    const w = size / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c < cols + 1; c++) {
        const x = c * w + (r % 2) * w * 0.5;
        const y = r * h;
        const tone = 0.6 + rng() * 0.5;
        const col = mixc(rgb(0x4a4238), rgb(0x6a5140), rng());
        actx.fillStyle = `rgb(${(col[0] * tone) | 0},${(col[1] * tone) | 0},${(col[2] * tone) | 0})`;
        actx.fillRect(x + 1, y + 1, w - 2, h * 1.9);
        actx.fillStyle = 'rgba(20,18,16,0.55)';
        actx.fillRect(x, y, w, 2);
      }
    }
    stains(actx, size, rng, '#2b2a24', 8, size * 0.2, 0.4);
    stains(actx, size, rng, '#5a6b4a', 6, size * 0.14, 0.3); // moss
  },

  fabric({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const weave = (Math.sin(u * size * 1.6) + Math.sin(v * size * 1.6)) * 0.5;
      const n = pfbm(u * 10, v * 10, 10, 3, 51);
      const g = 70 + weave * 14 + n * 24;
      return [g * 0.82, g * 0.85, g * 0.72];
    });
    stains(actx, size, rng, '#2c2a20', 8, size * 0.2, 0.3);
    speckle(actx, size, rng, 600, ['rgba(30,30,22,0.4)'], 0.3, 1.2);
    fillBase(hctx, size, (u, v) => {
      const g = 128 + Math.sin(u * size * 1.6) * 20 + Math.sin(v * size * 1.6) * 20;
      return [g, g, g];
    });
  },

  sand({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 9, v * 9, 9, 4, 10);
      return mixc(rgb(0x6d6046), rgb(0x9a8867), n);
    });
    speckle(actx, size, rng, 2400, ['rgba(45,40,30,0.35)', 'rgba(190,175,140,0.45)'], 0.3, 1.2);
    fillBase(hctx, size, (u, v) => {
      const g = 140 + pfbm(u * 40, v * 40, 40, 3, 2) * 60;
      return [g, g, g];
    });
  },

  rock({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 5, v * 5, 5, 5, 4);
      return mixc(rgb(0x55524b), rgb(0x7a756a), n);
    });
    crackLines(actx, size, rng, 16, 'rgba(24,23,20,0.7)', 1.8, 0.3);
    stains(actx, size, rng, '#3a382f', 10, size * 0.2, 0.35);
    speckle(actx, size, rng, 1200, ['rgba(30,28,25,0.4)', 'rgba(150,145,132,0.4)'], 0.4, 1.8);
    fillBase(hctx, size, (u, v) => {
      const g = 110 + pfbm(u * 9, v * 9, 9, 5, 2) * 110;
      return [g, g, g];
    });
    crackLines(hctx, size, rng, 16, 'rgba(20,20,20,0.9)', 2.2, 0.3);
  },

  bark({ size, actx, hctx, rctx, rng, fillBase, stains, crackLines, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 14, v * 5, 14, 4, 30);
      return mixc(rgb(0x33291f), rgb(0x5a4a36), n);
    });
    for (let i = 0; i < 60; i++) {
      const x = rng() * size;
      actx.strokeStyle = `rgba(${20 + rng() * 30},${16 + rng() * 22},${10 + rng() * 16},${0.3 + rng() * 0.4})`;
      actx.lineWidth = 1 + rng() * 3;
      actx.beginPath();
      actx.moveTo(x, 0);
      let cx = x;
      for (let y = 0; y < size; y += 8) {
        cx += (rng() - 0.5) * 4;
        actx.lineTo(cx, y);
      }
      actx.stroke();
    }
    stains(actx, size, rng, '#61704a', 6, size * 0.18, 0.3);
    fillBase(hctx, size, (u, v) => {
      const g = 120 + pfbm(u * 20, v * 8, 20, 4, 6) * 110;
      return [g, g, g];
    });
  },

  militaryMetal({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 8, v * 8, 8, 3, 15);
      return mixc(rgb(0x3b4231), rgb(0x555c42), n);
    });
    actx.strokeStyle = 'rgba(20,22,16,0.7)';
    actx.lineWidth = 3;
    actx.strokeRect(4, 4, size - 8, size - 8);
    for (let i = 0; i < 28; i++) {
      const x = 10 + rng() * (size - 20);
      const y = 10 + rng() * (size - 20);
      actx.fillStyle = 'rgba(160,160,150,0.4)';
      actx.beginPath();
      actx.arc(x, y, 1.8, 0, Math.PI * 2);
      actx.fill();
    }
    stains(actx, size, rng, '#7a4222', 10, size * 0.16, 0.4);
    speckle(actx, size, rng, 600, ['rgba(90,50,28,0.5)', 'rgba(30,32,24,0.5)'], 0.4, 1.6);
  },

  labTile({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, () => rgb(0x8f938d));
    const n = 10;
    const s = size / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const c = mixc(rgb(0xc3c6bd), rgb(0xa9ada4), rng());
        actx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        actx.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3);
        hctx.fillStyle = 'rgb(215,215,215)';
        hctx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
        hctx.fillStyle = 'rgb(90,90,90)';
        hctx.fillRect(x * s, y * s, s, 1.5);
        hctx.fillRect(x * s, y * s, 1.5, s);
      }
    stains(actx, size, rng, '#5a584e', 12, size * 0.2, 0.28);
    stains(actx, size, rng, '#7a6a40', 4, size * 0.1, 0.3);
    crackLines(actx, size, rng, 3, 'rgba(40,40,36,0.5)', 1, 0.3);
  },

  hazard({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, () => rgb(0x1d1d1a));
    actx.save();
    actx.translate(size / 2, size / 2);
    actx.rotate(-Math.PI / 4);
    for (let i = -size; i < size; i += size / 4) {
      actx.fillStyle = '#c2a327';
      actx.fillRect(i, -size, size / 8, size * 2);
    }
    actx.restore();
    stains(actx, size, rng, '#4a3a20', 10, size * 0.2, 0.4);
    speckle(actx, size, rng, 700, ['rgba(30,30,26,0.5)', 'rgba(120,100,50,0.4)'], 0.4, 2);
  },

  radiation({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 6, v * 6, 6, 4, 99);
      return mixc(rgb(0x3a4a2a), rgb(0x6b7a3a), smoothstep(0.4, 0.9, n));
    });
    speckle(actx, size, rng, 1600, ['rgba(120,200,90,0.25)', 'rgba(40,50,30,0.5)'], 0.5, 2.6);
    stains(actx, size, rng, '#2a3a1a', 8, size * 0.3, 0.4);
    stains(actx, size, rng, '#7a8a30', 6, size * 0.14, 0.3);
  },
  forestFoliage({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 6, v * 6, 6, 4, 61);
      const m = pfbm(u * 26, v * 26, 26, 3, 17);
      let c = mixc(rgb(0x22301c), rgb(0x3f5230), smoothstep(0.2, 0.85, n));
      c = mixc(c, rgb(0x54603a), m * 0.35);
      return c;
    });
    // needle clusters
    for (let i = 0; i < 3200; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.1;
      const l = 3 + rng() * 7;
      const shade = 40 + rng() * 60;
      actx.strokeStyle = `rgba(${shade * 0.7},${shade + 10},${shade * 0.55},${0.3 + rng() * 0.5})`;
      actx.lineWidth = 1;
      actx.beginPath();
      actx.moveTo(x, y);
      actx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      actx.stroke();
    }
    speckle(actx, size, rng, 900, ['rgba(20,26,16,0.45)', 'rgba(90,100,60,0.3)'], 0.4, 2.2);
    fillBase(hctx, size, (u, v) => {
      const g = 110 + pfbm(u * 30, v * 30, 30, 3, 8) * 120;
      return [g, g, g];
    });
    fillBase(rctx, size, (u, v) => {
      const g = 235 + pfbm(u * 10, v * 10, 10, 3, 9) * 20;
      return [g, g, g];
    });
  },
  glass({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 4, v * 4, 4, 4, 33);
      return mixc(rgb(0x36474a), rgb(0x5b6d6c), smoothstep(0.3, 0.9, n) * 0.6);
    });
    // grime running down
    for (let i = 0; i < 90; i++) {
      const x = rng() * size;
      const w = 1 + rng() * 6;
      const h = size * (0.2 + rng() * 0.8);
      actx.fillStyle = `rgba(30,34,30,${0.05 + rng() * 0.18})`;
      actx.fillRect(x, 0, w, h);
    }
    // cracked pane
    actx.strokeStyle = 'rgba(210,220,215,0.35)';
    actx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      let x = rng() * size;
      let y = rng() * size;
      actx.beginPath();
      actx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (rng() - 0.5) * size * 0.25;
        y += (rng() - 0.5) * size * 0.25;
        actx.lineTo(x, y);
      }
      actx.stroke();
    }
    speckle(actx, size, rng, 700, ['rgba(20,26,24,0.35)', 'rgba(180,190,180,0.2)'], 0.3, 1.6);
    fillBase(rctx, size, (u, v) => {
      const g = 40 + pfbm(u * 12, v * 12, 12, 3, 5) * 30;
      return [g, g, g];
    });
  },
  toxic({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 5, v * 5, 5, 4, 71);
      return mixc(rgb(0x2c3a14), rgb(0x7c8f28), smoothstep(0.25, 0.9, n));
    });
    stains(actx, size, rng, '#1c2610', 10, size * 0.28, 0.5);
    // bright sludge bubbles
    for (let i = 0; i < 60; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 2 + rng() * 12;
      const g = actx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(190,230,80,0.55)');
      g.addColorStop(1, 'rgba(90,130,40,0)');
      actx.fillStyle = g;
      actx.beginPath();
      actx.arc(x, y, r, 0, Math.PI * 2);
      actx.fill();
    }
    speckle(actx, size, rng, 1200, ['rgba(30,40,14,0.5)', 'rgba(170,210,70,0.25)'], 0.5, 2.2);
  },
  water({ size, actx, hctx, rctx, rng, fillBase, stains, speckle, pfbm }) {
    fillBase(actx, size, (u, v) => {
      const n = pfbm(u * 7, v * 7, 7, 4, 45);
      return mixc(rgb(0x1b2a2a), rgb(0x34494a), smoothstep(0.3, 0.9, n) * 0.8);
    });
    // ripple bands
    for (let i = 0; i < 70; i++) {
      const y = rng() * size;
      actx.strokeStyle = `rgba(150,175,170,${0.03 + rng() * 0.08})`;
      actx.lineWidth = 1 + rng() * 2;
      actx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const yy = y + Math.sin((x / size) * Math.PI * 2 * (1 + i % 3)) * 3;
        if (x === 0) actx.moveTo(x, yy);
        else actx.lineTo(x, yy);
      }
      actx.stroke();
    }
    speckle(actx, size, rng, 500, ['rgba(10,18,18,0.4)', 'rgba(120,150,145,0.15)'], 0.4, 2.0);
    fillBase(rctx, size, (u, v) => {
      const g = 25 + pfbm(u * 6, v * 6, 6, 3, 3) * 20;
      return [g, g, g];
    });
  },
};

const SETS = {};

function buildSet(name, size) {
  const key = `${name}@${size}`;
  if (SETS[key]) return SETS[key];
  const ALIASES = { road: 'asphalt', tarmac: 'asphalt', foliage: 'forestFoliage', leaves: 'forestFoliage', stone: 'rock', concreteWall: 'concrete', snow: 'sand', toxicSludge: 'toxic' };
  const resolved = PAINTERS[name] ? name : ALIASES[name];
  const painter = PAINTERS[resolved];
  if (!painter) {
    console.warn(`[textures] unknown texture "${name}", using concrete`);
    return buildSet('concrete', size);
  }
  name = resolved;
  const raw = makeSet(name, size, painter);
  SETS[key] = raw;
  return raw;
}

function toTexture(canvas, { srgb = false, repeat = 1, aniso = 8 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = aniso;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class TextureLib {
  constructor(renderer, { size = 512 } = {}) {
    this.renderer = renderer;
    this.size = size;
    this.aniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);
    this.cache = new Map();
    this.materialCache = new Map();
    this.decals = null;
  }

  setFor(name, size = this.size) {
    const key = `${name}@${size}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const raw = buildSet(name, size);
    const set = {
      map: toTexture(raw.albedo, { srgb: true, aniso: this.aniso }),
      normalMap: toTexture(normalFromHeight(raw.height, raw.normalStrength), { aniso: this.aniso }),
      roughnessMap: toTexture(raw.rough, { aniso: this.aniso }),
    };
    this.cache.set(key, set);
    return set;
  }

  /** Shared standard material for a surface name. */
  material(name, opts = {}, size) {
    const key = name + JSON.stringify(opts);
    if (this.materialCache.has(key)) return this.materialCache.get(key);
    const set = this.setFor(name, size);
    const mat = new THREE.MeshStandardMaterial({
      map: set.map,
      normalMap: set.normalMap,
      roughnessMap: set.roughnessMap,
      roughness: opts.roughness ?? 1.0,
      metalness: opts.metalness ?? 0.0,
      color: opts.color ?? 0xffffff,
      normalScale: new THREE.Vector2(opts.normalScale ?? 1, opts.normalScale ?? 1),
      side: opts.side ?? THREE.FrontSide,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      envMapIntensity: opts.envMapIntensity ?? 0.55,
      alphaTest: opts.alphaTest ?? 0,
      depthWrite: opts.depthWrite ?? true,
      vertexColors: opts.vertexColors ?? false,
    });
    if (opts.repeat) {
      for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
      }
    }
    mat.userData.baseColor = mat.color.clone();
    this.materialCache.set(key, mat);
    return mat;
  }

  /** Decal textures are single (non repeating) stamps. */
  decalSet() {
    if (this.decals) return this.decals;
    const mk = (draw) => {
      const c = canvasOf(128);
      const ctx = ctxOf(c);
      draw(ctx, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const blood = mk((ctx, s) => {
      const r = makeRng(11);
      for (let i = 0; i < 22; i++) {
        const x = s / 2 + (r() - 0.5) * s * 0.5;
        const y = s / 2 + (r() - 0.5) * s * 0.5;
        const rad = 2 + r() * 18;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(96,10,10,0.9)');
        g.addColorStop(0.6, 'rgba(72,8,8,0.55)');
        g.addColorStop(1, 'rgba(50,4,4,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(90,10,10,${0.4 + r() * 0.5})`;
        ctx.beginPath();
        ctx.arc(s / 2 + (r() - 0.5) * s * 0.9, s / 2 + (r() - 0.5) * s * 0.9, 1 + r() * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const hole = mk((ctx, s) => {
      const r = makeRng(22);
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.3);
      g.addColorStop(0, 'rgba(8,8,8,0.95)');
      g.addColorStop(0.35, 'rgba(20,20,20,0.85)');
      g.addColorStop(0.6, 'rgba(60,58,54,0.5)');
      g.addColorStop(1, 'rgba(80,78,74,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,30,30,0.5)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        let x = s / 2;
        let y = s / 2;
        let a = r() * Math.PI * 2;
        ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          a += (r() - 0.5) * 0.7;
          x += Math.cos(a) * 6;
          y += Math.sin(a) * 6;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    const scorch = mk((ctx, s) => {
      const r = makeRng(33);
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.48);
      g.addColorStop(0, 'rgba(10,9,8,0.9)');
      g.addColorStop(0.5, 'rgba(24,20,16,0.6)');
      g.addColorStop(1, 'rgba(30,26,22,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI * 2;
        const d = s * (0.2 + r() * 0.3);
        ctx.fillStyle = `rgba(14,12,10,${0.3 + r() * 0.4})`;
        ctx.beginPath();
        ctx.arc(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, 1 + r() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.decals = { blood, hole, scorch };
    return this.decals;
  }

  /** Small self-lit sign / poster texture. */
  signTexture(text, { bg = '#2a2f26', fg = '#c9d1c2', accent = '#b5432c', sub = '' } = {}) {
    const cacheKey = `${text}|${bg}|${fg}|${accent}|${sub}`;
    if (!this._signCache) this._signCache = new Map();
    if (this._signCache.has(cacheKey)) return this._signCache.get(cacheKey);
    const tex = this._signTextureUncached(text, { bg, fg, accent, sub });
    this._signCache.set(cacheKey, tex);
    return tex;
  }

  _signTextureUncached(text, { bg = '#2a2f26', fg = '#c9d1c2', accent = '#b5432c', sub = '' } = {}) {
    const key = `sign:${text}:${bg}:${fg}:${sub}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const w = 512;
    const h = 256;
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = ctxOf(c);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // grunge
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rand() * 0.16})`;
      ctx.fillRect(rand() * w, rand() * h, 2 + rand() * 8, 1 + rand() * 4);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = fg;
    ctx.font = 'bold 64px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 - (sub ? 22 : 0), w - 60);
    if (sub) {
      ctx.fillStyle = accent;
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText(sub, w / 2, h / 2 + 46, w - 60);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.aniso;
    this.cache.set(key, tex);
    return tex;
  }

  dispose() {
    for (const set of this.cache.values()) {
      if (set?.dispose) {
        set.dispose();
        continue;
      }
      for (const t of Object.values(set)) if (t?.isTexture) t.dispose();
    }
    this.cache.clear();
    for (const m of this.materialCache.values()) m.dispose();
    this.materialCache.clear();
  }
}
