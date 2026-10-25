/**
 * Procedural PBR texture synthesis.
 *
 * Every surface in the game is generated here at runtime: albedo, normal, roughness,
 * metalness and emissive maps are painted into canvases from noise fields, panel layouts,
 * rivets, scratches and wear masks - no bitmap assets, no placeholder colours.
 */
import * as THREE from 'three';
import { RNG, fbm, makeNoise2D, clamp } from '../core/rng.ts';

export interface PBRSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap?: THREE.CanvasTexture;
  emissiveMap?: THREE.CanvasTexture;
}

const cache = new Map<string, PBRSet>();

function makeCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function toTexture(canvas: HTMLCanvasElement, repeat = 1, srgb = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Converts a height field (greyscale canvas) into a tangent-space normal map. */
function heightToNormal(height: Float32Array, size: number, strength = 2.4): HTMLCanvasElement {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx, ny = -dy, nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * size + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function greyCanvas(data: Float32Array, size: number): HTMLCanvasElement {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < data.length; i++) {
    const v = clamp(data[i], 0, 1) * 255;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

/**
 * Industrial hull plating: panel seams, rivet rows, weld lines, scratches, grime.
 */
export function hullPlating(baseColor: number, accent: number, seed: number, size = 512): PBRSet {
  const key = `hull:${baseColor}:${accent}:${seed}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rng = new RNG(seed);
  const noise = makeNoise2D(seed);
  const noise2 = makeNoise2D(seed + 77);
  const [br, bg, bb] = hexToRgb(baseColor);
  const [ar, ag, ab] = hexToRgb(accent);

  const albedo = makeCanvas(size);
  const actx = albedo.getContext('2d')!;
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  const metal = new Float32Array(size * size);
  const emissive = makeCanvas(size);
  const ectx = emissive.getContext('2d')!;
  ectx.fillStyle = '#000';
  ectx.fillRect(0, 0, size, size);

  // Base metal with mottled wear.
  const img = actx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const grime = fbm(noise, u * 7, v * 7, 5) * 0.55 + fbm(noise2, u * 23, v * 23, 3) * 0.45;
      const shade = 0.72 + grime * 0.5;
      const i = (y * size + x) * 4;
      img.data[i] = clamp(br * shade, 0, 255);
      img.data[i + 1] = clamp(bg * shade, 0, 255);
      img.data[i + 2] = clamp(bb * shade, 0, 255);
      img.data[i + 3] = 255;
      height[y * size + x] = grime * 0.12;
      rough[y * size + x] = 0.42 + grime * 0.38;
      metal[y * size + x] = 0.82 - grime * 0.2;
    }
  }
  actx.putImageData(img, 0, 0);

  // Panel layout via recursive splits - the signature look of built hardware.
  interface Rect { x: number; y: number; w: number; h: number; d: number }
  const panels: Rect[] = [];
  const split = (r: Rect) => {
    if (r.d > 3 || r.w < size * 0.16 || r.h < size * 0.16) { panels.push(r); return; }
    const horizontal = r.w < r.h ? true : rng.chance(0.5);
    const t = rng.range(0.34, 0.66);
    if (horizontal) {
      const h1 = Math.floor(r.h * t);
      split({ x: r.x, y: r.y, w: r.w, h: h1, d: r.d + 1 });
      split({ x: r.x, y: r.y + h1, w: r.w, h: r.h - h1, d: r.d + 1 });
    } else {
      const w1 = Math.floor(r.w * t);
      split({ x: r.x, y: r.y, w: w1, h: r.h, d: r.d + 1 });
      split({ x: r.x + w1, y: r.y, w: r.w - w1, h: r.h, d: r.d + 1 });
    }
  };
  split({ x: 0, y: 0, w: size, h: size, d: 0 });

  actx.lineWidth = Math.max(1.4, size / 300);
  for (const p of panels) {
    const tint = rng.range(-0.1, 0.12);
    actx.fillStyle = `rgba(${clamp(br * (1 + tint), 0, 255) | 0},${clamp(bg * (1 + tint), 0, 255) | 0},${clamp(bb * (1 + tint), 0, 255) | 0},0.5)`;
    actx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    actx.strokeStyle = 'rgba(8,12,20,0.75)';
    actx.strokeRect(p.x + 2.5, p.y + 2.5, p.w - 5, p.h - 5);
    actx.strokeStyle = 'rgba(255,255,255,0.08)';
    actx.strokeRect(p.x + 4.5, p.y + 4.5, p.w - 9, p.h - 9);

    // Panel seam depth into the height field.
    for (let yy = p.y; yy < p.y + p.h; yy++) {
      for (const xx of [p.x, p.x + p.w - 1]) {
        const idx = ((yy + size) % size) * size + ((xx + size) % size);
        height[idx] -= 0.55;
        rough[idx] = 0.85;
      }
    }
    for (let xx = p.x; xx < p.x + p.w; xx++) {
      for (const yy of [p.y, p.y + p.h - 1]) {
        const idx = ((yy + size) % size) * size + ((xx + size) % size);
        height[idx] -= 0.55;
        rough[idx] = 0.85;
      }
    }

    // Rivets along one edge of larger panels.
    if (p.w > size * 0.2 && p.h > size * 0.2 && rng.chance(0.75)) {
      const count = Math.floor(p.w / (size / 22));
      for (let i = 1; i < count; i++) {
        const rx = p.x + (i * p.w) / count;
        for (const ry of [p.y + 7, p.y + p.h - 7]) {
          actx.fillStyle = 'rgba(230,238,255,0.18)';
          actx.beginPath();
          actx.arc(rx, ry, size / 220, 0, Math.PI * 2);
          actx.fill();
          const idx = (Math.floor(ry) % size) * size + (Math.floor(rx) % size);
          height[idx] += 0.9;
        }
      }
    }

    // Accent stripe / hazard marking on a few panels.
    if (rng.chance(0.18)) {
      actx.fillStyle = `rgba(${ar},${ag},${ab},0.5)`;
      actx.fillRect(p.x + 6, p.y + p.h * 0.5 - size / 200, p.w - 12, size / 100);
    }
    if (rng.chance(0.1)) {
      // Emissive service light strip.
      ectx.fillStyle = `rgba(${ar},${ag},${ab},0.95)`;
      ectx.fillRect(p.x + p.w * 0.25, p.y + p.h * 0.18, p.w * 0.5, Math.max(2, size / 150));
      actx.fillStyle = `rgba(${Math.min(255, ar + 60)},${Math.min(255, ag + 60)},${Math.min(255, ab + 60)},0.85)`;
      actx.fillRect(p.x + p.w * 0.25, p.y + p.h * 0.18, p.w * 0.5, Math.max(2, size / 150));
    }
  }

  // Scratches and impact scuffs.
  for (let i = 0; i < 90; i++) {
    const x = rng.range(0, size), y = rng.range(0, size);
    const len = rng.range(size * 0.02, size * 0.18);
    const ang = rng.range(0, Math.PI * 2);
    actx.strokeStyle = `rgba(${Math.min(255, br + 90)},${Math.min(255, bg + 95)},${Math.min(255, bb + 100)},${rng.range(0.05, 0.22)})`;
    actx.lineWidth = rng.range(0.6, 1.8);
    actx.beginPath();
    actx.moveTo(x, y);
    actx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    actx.stroke();
  }

  const set: PBRSet = {
    map: toTexture(albedo, 1, true),
    normalMap: toTexture(heightToNormal(height, size, 2.0)),
    roughnessMap: toTexture(greyCanvas(rough, size)),
    metalnessMap: toTexture(greyCanvas(metal, size)),
    emissiveMap: toTexture(emissive, 1, true),
  };
  cache.set(key, set);
  return set;
}

/** Rock / asteroid surface with mineral veins. */
export function rockSurface(style: 'basalt' | 'crystal' | 'metal' | 'volcanic' | 'void', seed: number, size = 512): PBRSet {
  const key = `rock:${style}:${seed}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const noise = makeNoise2D(seed);
  const noiseB = makeNoise2D(seed + 311);
  const veinNoise = makeNoise2D(seed + 913);
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  const metal = new Float32Array(size * size);
  const emissive = makeCanvas(size);
  const ectx = emissive.getContext('2d')!;
  ectx.fillStyle = '#000';
  ectx.fillRect(0, 0, size, size);
  const eimg = ectx.getImageData(0, 0, size, size);

  const palettes: Record<string, { base: [number, number, number]; vein: [number, number, number]; glow: number }> = {
    basalt:   { base: [78, 76, 72],  vein: [164, 150, 120], glow: 0.0 },
    crystal:  { base: [70, 92, 126], vein: [140, 228, 255], glow: 0.75 },
    metal:    { base: [96, 101, 112], vein: [206, 216, 232], glow: 0.08 },
    volcanic: { base: [62, 46, 42],  vein: [255, 126, 48],  glow: 0.85 },
    void:     { base: [44, 44, 62],  vein: [171, 124, 255], glow: 0.6 },
  };
  const pal = palettes[style];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const craters = fbm(noise, u * 5, v * 5, 6, 2.1, 0.52);
      const grit = fbm(noiseB, u * 38, v * 38, 3);
      const h = craters * 0.78 + grit * 0.22;
      // Ridged vein mask.
      const vn = Math.abs(fbm(veinNoise, u * 9 + 3.1, v * 9 - 1.7, 4) - 0.5) * 2;
      const vein = clamp(1 - vn * 3.2, 0, 1);
      const shade = 0.55 + h * 0.85;
      const i = (y * size + x) * 4;
      const r = pal.base[0] * shade + pal.vein[0] * vein * 0.9;
      const g = pal.base[1] * shade + pal.vein[1] * vein * 0.9;
      const b = pal.base[2] * shade + pal.vein[2] * vein * 0.9;
      img.data[i] = clamp(r, 0, 255);
      img.data[i + 1] = clamp(g, 0, 255);
      img.data[i + 2] = clamp(b, 0, 255);
      img.data[i + 3] = 255;
      height[y * size + x] = h * 0.9 + vein * 0.25;
      rough[y * size + x] = clamp(0.95 - vein * 0.55 - (style === 'metal' ? 0.25 : 0), 0.08, 1);
      metal[y * size + x] = style === 'metal' ? 0.55 + vein * 0.4 : vein * (style === 'crystal' ? 0.35 : 0.15);
      const glow = vein * pal.glow;
      eimg.data[i] = clamp(pal.vein[0] * glow, 0, 255);
      eimg.data[i + 1] = clamp(pal.vein[1] * glow, 0, 255);
      eimg.data[i + 2] = clamp(pal.vein[2] * glow, 0, 255);
      eimg.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ectx.putImageData(eimg, 0, 0);

  const set: PBRSet = {
    map: toTexture(canvas, 1, true),
    normalMap: toTexture(heightToNormal(height, size, 3.4)),
    roughnessMap: toTexture(greyCanvas(rough, size)),
    metalnessMap: toTexture(greyCanvas(metal, size)),
    emissiveMap: toTexture(emissive, 1, true),
  };
  cache.set(key, set);
  return set;
}

/** Hangar floor: painted deck plates, hazard chevrons, worn tracks. */
export function hangarFloor(seed = 4242, size = 1024): PBRSet {
  const key = `floor:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = new RNG(seed);
  const noise = makeNoise2D(seed);
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size).fill(0.72);
  const metal = new Float32Array(size * size).fill(0.6);

  ctx.fillStyle = '#20252f';
  ctx.fillRect(0, 0, size, size);
  const tile = size / 4;
  for (let gx = 0; gx < 4; gx++) {
    for (let gy = 0; gy < 4; gy++) {
      const shade = 34 + rng.range(-8, 10);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
      ctx.fillRect(gx * tile + 3, gy * tile + 3, tile - 6, tile - 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 4;
      ctx.strokeRect(gx * tile + 3, gy * tile + 3, tile - 6, tile - 6);
      // Diamond tread.
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const off = (i / 10) * tile;
        ctx.beginPath();
        ctx.moveTo(gx * tile + off, gy * tile);
        ctx.lineTo(gx * tile + off + tile * 0.1, gy * tile + tile);
        ctx.stroke();
      }
    }
  }
  // Hazard chevrons around the launch pad.
  ctx.save();
  ctx.translate(size / 2, size / 2);
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,183,0,0.85)' : 'rgba(22,26,34,0.9)';
    ctx.fillRect(size * 0.3, -size * 0.022, size * 0.08, size * 0.044);
  }
  ctx.restore();
  // Worn tracks.
  for (let i = 0; i < 180; i++) {
    const x = rng.range(0, size), y = rng.range(0, size);
    ctx.fillStyle = `rgba(10,12,16,${rng.range(0.04, 0.12)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rng.range(10, 70), rng.range(6, 30), rng.range(0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = fbm(noise, x / size * 12, y / size * 12, 4);
    height[y * size + x] = n * 0.25;
    rough[y * size + x] = 0.55 + n * 0.4;
  }
  const set: PBRSet = {
    map: toTexture(canvas, 1, true),
    normalMap: toTexture(heightToNormal(height, size, 1.4)),
    roughnessMap: toTexture(greyCanvas(rough, size)),
    metalnessMap: toTexture(greyCanvas(metal, size)),
  };
  cache.set(key, set);
  return set;
}

/** Animated holographic screen content (returns the canvas so callers can redraw). */
export function screenTexture(kind: 'telemetry' | 'blueprint' | 'market' | 'radar', seed = 11, size = 512) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const rng = new RNG(seed);
  const tex = toTexture(canvas, 1, true);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const series: number[] = Array.from({ length: 48 }, () => rng.range(0.2, 0.9));

  const draw = (time: number) => {
    ctx.fillStyle = '#05101e';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,229,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const p = (i / 16) * size;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    ctx.fillStyle = '#00e5ff';
    ctx.font = `bold ${size * 0.055}px "Orbitron", sans-serif`;
    const titles = { telemetry: 'SHIP TELEMETRY', blueprint: 'FRAME BLUEPRINT', market: 'ORE EXCHANGE', radar: 'SECTOR RADAR' };
    ctx.fillText(titles[kind], size * 0.06, size * 0.11);

    if (kind === 'telemetry' || kind === 'market') {
      series.push(clamp(series[series.length - 1] + Math.sin(time * 1.7 + series.length) * 0.08 + rng.range(-0.05, 0.05), 0.12, 0.95));
      series.shift();
      ctx.strokeStyle = kind === 'market' ? '#00ff9d' : '#7b61ff';
      ctx.lineWidth = size * 0.008;
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = size * 0.06 + (i / (series.length - 1)) * size * 0.88;
        const y = size * 0.82 - v * size * 0.55;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,229,255,0.12)';
      ctx.lineTo(size * 0.94, size * 0.82); ctx.lineTo(size * 0.06, size * 0.82); ctx.closePath(); ctx.fill();
    } else if (kind === 'blueprint') {
      ctx.strokeStyle = 'rgba(0,229,255,0.85)';
      ctx.lineWidth = size * 0.006;
      const cx = size / 2, cy = size * 0.55, s = size * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s * 0.55, cy + s * 0.2);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.3, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.55, cy + s * 0.2);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = `rgba(123,97,255,${0.4 + Math.sin(time * 3) * 0.3})`;
      ctx.strokeRect(cx - s * 0.75, cy - s * 1.1, s * 1.5, s * 2);
    } else {
      const cx = size / 2, cy = size * 0.56, r = size * 0.33;
      ctx.strokeStyle = 'rgba(0,255,157,0.5)';
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(cx, cy, (r * i) / 3, 0, Math.PI * 2); ctx.stroke();
      }
      const a = time * 1.6;
      const grad = ctx.createConicGradient ? ctx.createConicGradient(a, cx, cy) : null;
      if (grad) {
        grad.addColorStop(0, 'rgba(0,255,157,0.55)');
        grad.addColorStop(0.12, 'rgba(0,255,157,0)');
        grad.addColorStop(1, 'rgba(0,255,157,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 5; i++) {
        const ang = i * 1.9 + time * 0.3;
        const rr = r * (0.3 + ((i * 37) % 70) / 100);
        ctx.fillStyle = '#ff3b6b';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, size * 0.012, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Scanlines.
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 2);
    tex.needsUpdate = true;
  };
  draw(0);
  return { texture: tex, draw };
}

/** Starfield / nebula cube-ish background painted onto an equirect canvas. */
export function spaceBackground(colorA: number, colorB: number, seed: number, size = 2048): THREE.CanvasTexture {
  const canvas = makeCanvas(size);
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width, h = canvas.height;
  const rng = new RNG(seed);
  const noise = makeNoise2D(seed + 5);
  const [ar, ag, ab] = hexToRgb(colorA);
  const [br, bg, bb] = hexToRgb(colorB);

  ctx.fillStyle = '#01030a';
  ctx.fillRect(0, 0, w, h);

  // Nebula clouds from layered fbm, drawn at low resolution and upscaled for softness.
  const low = 256;
  const tmp = makeCanvas(low);
  tmp.height = low / 2;
  const tctx = tmp.getContext('2d')!;
  const img = tctx.createImageData(low, low / 2);
  for (let y = 0; y < low / 2; y++) {
    for (let x = 0; x < low; x++) {
      const u = x / low, v = y / (low / 2);
      const n = fbm(noise, u * 4, v * 4, 6, 2.2, 0.55);
      const n2 = fbm(noise, u * 9 + 11, v * 9 - 4, 4);
      const d = clamp((n * 1.35 - 0.42) * 1.6, 0, 1);
      const d2 = clamp((n2 * 1.2 - 0.5) * 1.4, 0, 1);
      const i = (y * low + x) * 4;
      img.data[i] = clamp(ar * d + br * d2 * 0.7, 0, 255);
      img.data[i + 1] = clamp(ag * d + bg * d2 * 0.7, 0, 255);
      img.data[i + 2] = clamp(ab * d + bb * d2 * 0.7, 0, 255);
      img.data[i + 3] = 255;
    }
  }
  tctx.putImageData(img, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(12px)';
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.filter = 'none';

  // Stars with realistic magnitude distribution.
  for (let i = 0; i < 2600; i++) {
    const x = rng.range(0, w), y = rng.range(0, h);
    const mag = Math.pow(rng.next(), 3.2);
    const r = 0.4 + mag * 2.4;
    const warm = rng.next();
    const col = warm < 0.2 ? [180, 205, 255] : warm < 0.8 ? [255, 255, 255] : [255, 214, 170];
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.25 + mag * 0.75})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (mag > 0.82) {
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.35)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - r * 4, y); ctx.lineTo(x + r * 4, y);
      ctx.moveTo(x, y - r * 4); ctx.lineTo(x, y + r * 4);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial sprite used for particles, glows and engine plumes. */
export function glowSprite(color: number, seed = 1, size = 128): THREE.CanvasTexture {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = hexToRgb(color);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(255,255,255,1)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Hard-edged debris chunk sprite for sparks and fragments. */
export function sparkSprite(color: number, size = 64): THREE.CanvasTexture {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = hexToRgb(color);
  const grad = ctx.createLinearGradient(0, size / 2, size, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.5, `rgba(255,255,255,1)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, size * 0.42, size, size * 0.16);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function clearTextureCache(): void {
  cache.clear();
}
