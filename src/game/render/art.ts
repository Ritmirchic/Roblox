/**
 * Procedural art toolkit. Everything the game draws is generated in code —
 * no bitmap assets — using layered gradients, strokes and cached glow sprites.
 */
import { FAMILY_COLORS, COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO, rgba, shade, mixHex } from '../../core/palette';
import { TAU, clamp, clamp01 } from '../../core/math';
import type { Enemy, FamilyId, Tower } from '../types';

export type Ctx2D = CanvasRenderingContext2D;

// ── Surfaces & caches ──────────────────────────────────────────────────────

const spriteCache = new Map<string, HTMLCanvasElement | null>();

const createSurface = (w: number, h: number): HTMLCanvasElement | null => {
  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w));
    canvas.height = Math.max(1, Math.ceil(h));
    return canvas;
  } catch {
    return null;
  }
};

/** Soft radial glow sprite, cached per colour. */
export const glowSprite = (color: string): HTMLCanvasElement | null => {
  const key = `glow:${color}`;
  if (spriteCache.has(key)) return spriteCache.get(key) ?? null;
  const size = 128;
  const canvas = createSurface(size, size);
  if (!canvas) {
    spriteCache.set(key, null);
    return null;
  }
  const g = canvas.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, rgba(color, 0.85));
  grad.addColorStop(0.35, rgba(color, 0.35));
  grad.addColorStop(0.7, rgba(color, 0.08));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, canvas);
  return canvas;
};

export const drawGlow = (
  ctx: Ctx2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
): void => {
  const sprite = glowSprite(color);
  if (sprite) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, rgba(color, 0.8 * alpha));
  grad.addColorStop(0.5, rgba(color, 0.25 * alpha));
  grad.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
};

let noiseCache: HTMLCanvasElement | null | undefined;

/** Grainy canvas texture for panels and the board. */
export const noiseSurface = (): HTMLCanvasElement | null => {
  if (noiseCache !== undefined) return noiseCache;
  const size = 180;
  const canvas = createSurface(size, size);
  if (!canvas) {
    noiseCache = null;
    return null;
  }
  const g = canvas.getContext('2d');
  if (!g) return null;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 4200; i++) {
    const a = rand() * 0.05;
    g.fillStyle = rand() > 0.5 ? `rgba(255,240,210,${a})` : `rgba(0,0,0,${a * 1.6})`;
    const s = rand() > 0.92 ? 2 : 1;
    g.fillRect(rand() * size, rand() * size, s, s);
  }
  noiseCache = canvas;
  return canvas;
};

export const grain = (ctx: Ctx2D, alpha = 0.35): void => {
  const surface = noiseSurface();
  if (!surface) return;
  const pattern = ctx.createPattern(surface, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(-50, -50, 4000, 4000);
  ctx.restore();
};

// ── Shapes & type ──────────────────────────────────────────────────────────

export const roundRectPath = (
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
};

export const fillRoundRect = (
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
): void => {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
};

export const strokeRoundRect = (
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  width = 1,
): void => {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
};

export interface TextOpts {
  size?: number;
  font?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
  shadow?: string;
  shadowBlur?: number;
  letterSpacing?: number;
  maxWidth?: number;
  weight?: string | number;
  style?: string;
}

export const drawText = (
  ctx: Ctx2D,
  text: string,
  x: number,
  y: number,
  opts: TextOpts = {},
): number => {
  const {
    size = 16,
    font = FONT_BODY,
    color = COLORS.parchment,
    align = 'left',
    baseline = 'alphabetic',
    alpha = 1,
    shadow,
    shadowBlur = 6,
    letterSpacing,
    maxWidth,
    weight = 'normal',
    style = 'normal',
  } = opts;
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  if (shadow) {
    ctx.shadowColor = shadow;
    ctx.shadowBlur = shadowBlur;
  }
  if (letterSpacing && 'letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
  }
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
};

export const measureText = (ctx: Ctx2D, text: string, size: number, font = FONT_BODY, weight = 'normal'): number => {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
};

export const wrapText = (
  ctx: Ctx2D,
  text: string,
  maxWidth: number,
  size: number,
  font = FONT_BODY,
): string[] => {
  ctx.save();
  ctx.font = `normal ${size}px ${font}`;
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  ctx.restore();
  return lines;
};

export const drawParagraph = (
  ctx: Ctx2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  opts: TextOpts = {},
): number => {
  const lines = wrapText(ctx, text, maxWidth, size, opts.font ?? FONT_BODY);
  lines.forEach((line, i) => {
    drawText(ctx, line, x, y + i * lineHeight, { size, ...opts });
  });
  return lines.length * lineHeight;
};

// ── Decorative furniture ───────────────────────────────────────────────────

export const drawHairline = (
  ctx: Ctx2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = rgba(COLORS.gold, 0.35),
  width = 1,
): void => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

/** Corner flourish used on panels. */
export const drawCornerFlourish = (ctx: Ctx2D, x: number, y: number, size: number, flip = false, color = rgba(COLORS.gold, 0.55)): void => {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, size * 0.28);
  ctx.quadraticCurveTo(0, 0, size * 0.28, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.32, size * 0.32);
  ctx.quadraticCurveTo(size * 0.12, size * 0.5, size * 0.44, size * 0.62);
  ctx.stroke();
  ctx.restore();
};

export const drawVignette = (ctx: Ctx2D, w: number, h: number, strength = 0.5): void => {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, `rgba(0,0,0,${strength * 0.5})`);
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
};

// ── Glyphs ─────────────────────────────────────────────────────────────────

export type GlyphKind =
  | FamilyId
  | 'spiral'
  | 'triangle'
  | 'diamond'
  | 'fork'
  | 'bell'
  | 'lantern'
  | 'moth'
  | 'crown'
  | 'moon'
  | 'coin'
  | 'vine'
  | 'skull'
  | 'heart'
  | 'book'
  | 'oil'
  | 'rune'
  | 'hand'
  | 'dice'
  | 'cards'
  | 'embers'
  | 'salvage'
  | 'burn'
  | 'heal'
  | 'lock'
  | 'star';

const familyColor = (kind: string): string =>
  (FAMILY_COLORS as Record<string, { base: string }>)[kind]?.base ?? COLORS.gold;

/** Draw a symbolic glyph centred at (x,y) with a radius of `size`. */
export const drawGlyph = (
  ctx: Ctx2D,
  kind: GlyphKind | string,
  x: number,
  y: number,
  size: number,
  color?: string,
  alpha = 1,
): void => {
  const c = color ?? familyColor(kind);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = Math.max(1.2, size * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size;

  switch (kind) {
    case 'ember': {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.85, -s * 0.25, s * 0.6, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.8, -s * 0.2, 0, -s);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = '#fff3c9';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.25);
      ctx.bezierCurveTo(s * 0.4, s * 0.05, s * 0.28, s * 0.62, 0, s * 0.72);
      ctx.bezierCurveTo(-s * 0.25, s * 0.55, -s * 0.35, s * 0.05, 0, -s * 0.25);
      ctx.fill();
      break;
    }
    case 'frost': {
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * TAU) / 6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s);
        ctx.moveTo(0, -s * 0.62);
        ctx.lineTo(s * 0.28, -s * 0.82);
        ctx.moveTo(0, -s * 0.62);
        ctx.lineTo(-s * 0.28, -s * 0.82);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, TAU);
      ctx.fill();
      break;
    }
    case 'verdant': {
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.quadraticCurveTo(-s * 0.15, 0, 0, -s * 0.85);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, s * 0.25);
        ctx.quadraticCurveTo(side * s * 0.85, s * 0.05, side * s * 0.62, -s * 0.45);
        ctx.quadraticCurveTo(side * s * 0.2, -s * 0.35, 0, s * 0.25);
        ctx.fill();
      }
      break;
    }
    case 'volt': {
      ctx.beginPath();
      ctx.moveTo(s * 0.18, -s);
      ctx.lineTo(-s * 0.52, s * 0.1);
      ctx.lineTo(-s * 0.05, s * 0.1);
      ctx.lineTo(-s * 0.24, s);
      ctx.lineTo(s * 0.55, -s * 0.16);
      ctx.lineTo(s * 0.08, -s * 0.16);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'umbral': {
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, -s * 0.82, s, 0);
      ctx.quadraticCurveTo(0, s * 0.82, -s, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0a0710';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.13, s * 0.34, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'spiral': {
      ctx.beginPath();
      for (let a = 0; a < TAU * 2.1; a += 0.15) {
        const r = (a / (TAU * 2.1)) * s;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.9, s * 0.72);
      ctx.lineTo(-s * 0.9, s * 0.72);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, s * 0.12, s * 0.24, 0, TAU);
      ctx.fill();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.72, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'fork': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.9);
      ctx.lineTo(-s * 0.2, 0);
      ctx.lineTo(-s * 0.55, s * 0.9);
      ctx.moveTo(s * 0.55, -s * 0.9);
      ctx.lineTo(s * 0.2, 0);
      ctx.lineTo(s * 0.55, s * 0.9);
      ctx.moveTo(-s * 0.2, 0);
      ctx.lineTo(s * 0.2, 0);
      ctx.stroke();
      break;
    }
    case 'bell': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, s * 0.55);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.2, 0, -s * 0.72);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.2, s * 0.7, s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, s * 0.78, s * 0.2, 0, TAU);
      ctx.fill();
      break;
    }
    case 'lantern': {
      ctx.strokeRect(-s * 0.5, -s * 0.55, s, s * 1.1);
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.55);
      ctx.quadraticCurveTo(0, -s * 1.15, s * 0.5, -s * 0.55);
      ctx.stroke();
      drawGlow(ctx, 0, 0, s * 1.15, COLORS.gold, 0.75);
      ctx.fillStyle = COLORS.goldBright;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.2, s * 0.32, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'moth': {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(side * s * 0.9, -s * 0.9, side * s * 1.05, s * 0.1, 0, s * 0.2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, s * 0.15);
        ctx.bezierCurveTo(side * s * 0.7, s * 0.45, side * s * 0.35, s * 0.95, 0, s * 0.45);
        ctx.fill();
      }
      ctx.fillStyle = '#1a140f';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.1, s * 0.35, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'crown': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.55);
      ctx.lineTo(-s * 0.85, -s * 0.4);
      ctx.lineTo(-s * 0.4, s * 0.05);
      ctx.lineTo(0, -s * 0.75);
      ctx.lineTo(s * 0.4, s * 0.05);
      ctx.lineTo(s * 0.85, -s * 0.4);
      ctx.lineTo(s * 0.85, s * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'moon': {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(s * 0.45, -s * 0.25, s * 0.85, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'coin': {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3a2610';
      ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.66, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.32);
      ctx.lineTo(0, s * 0.32);
      ctx.stroke();
      break;
    }
    case 'vine': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.8);
      ctx.bezierCurveTo(-s * 0.2, s * 0.2, s * 0.3, -s * 0.2, s * 0.8, -s * 0.85);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const t = 0.25 + i * 0.25;
        const px = -s * 0.85 + t * s * 1.65;
        const py = s * 0.8 - t * s * 1.65;
        ctx.beginPath();
        ctx.ellipse(px + s * 0.18, py - s * 0.12, s * 0.28, s * 0.13, -0.7, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'skull': {
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.72, Math.PI, 0);
      ctx.lineTo(s * 0.5, s * 0.4);
      ctx.lineTo(-s * 0.5, s * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0b0d13';
      ctx.beginPath();
      ctx.arc(-s * 0.28, -s * 0.1, s * 0.17, 0, TAU);
      ctx.arc(s * 0.28, -s * 0.1, s * 0.17, 0, TAU);
      ctx.fill();
      ctx.fillRect(-s * 0.12, s * 0.15, s * 0.24, s * 0.3);
      break;
    }
    case 'heart': {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.8);
      ctx.bezierCurveTo(-s * 1.1, s * 0.1, -s * 0.7, -s * 0.85, 0, -s * 0.35);
      ctx.bezierCurveTo(s * 0.7, -s * 0.85, s * 1.1, s * 0.1, 0, s * 0.8);
      ctx.fill();
      break;
    }
    case 'book': {
      ctx.strokeRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(0, s * 0.7);
      ctx.moveTo(-s * 0.55, -s * 0.3);
      ctx.lineTo(-s * 0.2, -s * 0.3);
      ctx.moveTo(-s * 0.55, s * 0.05);
      ctx.lineTo(-s * 0.2, s * 0.05);
      ctx.stroke();
      break;
    }
    case 'oil': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.85);
      ctx.lineTo(s * 0.35, -s * 0.85);
      ctx.lineTo(s * 0.35, -s * 0.45);
      ctx.quadraticCurveTo(s * 0.8, s * 0.1, s * 0.5, s * 0.6);
      ctx.quadraticCurveTo(0, s * 1.05, -s * 0.5, s * 0.6);
      ctx.quadraticCurveTo(-s * 0.8, s * 0.1, -s * 0.35, -s * 0.45);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fill();
      break;
    }
    case 'rune': {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.5);
      ctx.lineTo(s * 0.35, 0);
      ctx.lineTo(-s * 0.4, s * 0.5);
      ctx.stroke();
      break;
    }
    case 'hand': {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const x = -s * 0.6 + i * s * 0.4;
        ctx.moveTo(x, s * 0.35);
        ctx.lineTo(x, -s * 0.55 - (i === 1 || i === 2 ? s * 0.3 : 0));
      }
      ctx.moveTo(-s * 0.75, s * 0.1);
      ctx.quadraticCurveTo(-s * 0.95, s * 0.7, 0, s * 0.85);
      ctx.quadraticCurveTo(s * 0.95, s * 0.7, s * 0.75, s * 0.1);
      ctx.stroke();
      break;
    }
    case 'dice': {
      ctx.strokeRect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5);
      for (const [dx, dy] of [
        [-0.35, -0.35],
        [0.35, -0.35],
        [0, 0],
        [-0.35, 0.35],
        [0.35, 0.35],
      ]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.12, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'cards': {
      ctx.save();
      ctx.rotate(-0.2);
      ctx.strokeRect(-s * 0.75, -s * 0.7, s * 1.1, s * 1.5);
      ctx.restore();
      ctx.save();
      ctx.rotate(0.18);
      ctx.strokeRect(-s * 0.3, -s * 0.8, s * 1.1, s * 1.5);
      ctx.restore();
      break;
    }
    case 'embers': {
      for (const [dx, dy, r] of [
        [0, -0.45, 0.3],
        [-0.5, 0.15, 0.22],
        [0.45, 0.2, 0.26],
        [0.05, 0.6, 0.18],
      ]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, r * s, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'salvage': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.7);
      ctx.lineTo(-s * 0.2, -s * 0.8);
      ctx.lineTo(s * 0.8, -s * 0.1);
      ctx.lineTo(0, s * 0.8);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.8);
      ctx.lineTo(-s * 0.2, s * 0.8);
      ctx.stroke();
      break;
    }
    case 'burn': {
      drawGlyph(ctx, 'ember', 0, 0, s, COLORS.ember);
      ctx.strokeStyle = COLORS.ember;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.2, 0.5, 2.6);
      ctx.stroke();
      break;
    }
    case 'heal': {
      ctx.fillRect(-s * 0.22, -s * 0.85, s * 0.44, s * 1.7);
      ctx.fillRect(-s * 0.85, -s * 0.22, s * 1.7, s * 0.44);
      break;
    }
    case 'lock': {
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s * 0.45, Math.PI, 0);
      ctx.stroke();
      ctx.fillRect(-s * 0.62, -s * 0.15, s * 1.24, s * 0.95);
      break;
    }
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s : s * 0.45;
        const a = (i / 10) * TAU - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
};

// ── Lantern / hearth ───────────────────────────────────────────────────────

export interface LanternOpts {
  scale?: number;
  color?: string;
  time?: number;
  /** 0..1 remaining life, changes flame size and colour */
  life?: number;
  flare?: number;
  glow?: number;
}

export const drawLantern = (
  ctx: Ctx2D,
  x: number,
  y: number,
  opts: LanternOpts = {},
): void => {
  const { scale = 1, color = COLORS.gold, time = 0, life = 1, flare = 0, glow = 1 } = opts;
  const s = scale;
  const flicker = 0.9 + Math.sin(time * 7.3) * 0.05 + Math.sin(time * 3.1) * 0.04 + flare * 0.25;

  ctx.save();
  ctx.translate(x, y);

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(0, s * 44, s * 34, s * 9, 0, 0, TAU);
  ctx.fill();

  drawGlow(ctx, 0, 0, s * 88 * flicker, color, 0.55 * glow);
  drawGlow(ctx, 0, 0, s * 46 * flicker, COLORS.goldBright, 0.45 * glow);

  // stand / claw feet
  ctx.strokeStyle = '#241d1a';
  ctx.lineWidth = s * 4.5;
  ctx.lineCap = 'round';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, s * 10);
    ctx.quadraticCurveTo(dir * s * 22, s * 26, dir * s * 26, s * 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dir * s * 26, s * 38);
    ctx.lineTo(dir * s * 15, s * 41);
    ctx.moveTo(dir * s * 26, s * 38);
    ctx.lineTo(dir * s * 33, s * 43);
    ctx.stroke();
  }

  // glass body
  const glassGrad = ctx.createLinearGradient(0, -s * 34, 0, s * 30);
  glassGrad.addColorStop(0, rgba(shade(color, 0.35), 0.32));
  glassGrad.addColorStop(0.5, rgba(color, 0.22));
  glassGrad.addColorStop(1, rgba(shade(color, -0.4), 0.3));
  ctx.fillStyle = glassGrad;
  roundRectPath(ctx, -s * 22, -s * 30, s * 44, s * 58, s * 12);
  ctx.fill();

  // flame
  const flameH = s * (16 + life * 18) * flicker;
  const flameGrad = ctx.createRadialGradient(0, s * 6, s * 2, 0, s * 6, flameH);
  flameGrad.addColorStop(0, '#fffbe8');
  flameGrad.addColorStop(0.35, color);
  flameGrad.addColorStop(1, rgba(shade(color, -0.35), 0));
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(0, s * 20 - flameH);
  ctx.bezierCurveTo(s * 13, s * 4, s * 10, s * 22, 0, s * 24);
  ctx.bezierCurveTo(-s * 10, s * 22, -s * 12, s * 2, 0, s * 20 - flameH);
  ctx.fill();

  // iron frame
  ctx.strokeStyle = '#2c2520';
  ctx.lineWidth = s * 3.4;
  roundRectPath(ctx, -s * 23, -s * 31, s * 46, s * 60, s * 12);
  ctx.stroke();
  ctx.lineWidth = s * 2.2;
  ctx.beginPath();
  ctx.moveTo(-s * 23, -s * 6);
  ctx.lineTo(s * 23, -s * 6);
  ctx.moveTo(0, -s * 31);
  ctx.lineTo(0, s * 29);
  ctx.stroke();
  ctx.strokeStyle = rgba(COLORS.gold, 0.5);
  ctx.lineWidth = s * 1.1;
  roundRectPath(ctx, -s * 21.5, -s * 29.5, s * 43, s * 57, s * 11);
  ctx.stroke();

  // lid & cap
  ctx.fillStyle = '#241f1c';
  ctx.beginPath();
  ctx.moveTo(-s * 27, -s * 29);
  ctx.quadraticCurveTo(0, -s * 48, s * 27, -s * 29);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(COLORS.gold, 0.55);
  ctx.lineWidth = s * 1.2;
  ctx.stroke();

  // handle
  ctx.strokeStyle = '#2c2520';
  ctx.lineWidth = s * 2.6;
  ctx.beginPath();
  ctx.arc(0, -s * 40, s * 12, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();

  // rivets
  ctx.fillStyle = rgba(COLORS.gold, 0.7);
  for (const [dx, dy] of [
    [-18, -24],
    [18, -24],
    [-18, 20],
    [18, 20],
  ]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 1.7, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
};

// ── Emblems for cards & UI ─────────────────────────────────────────────────

export const drawEmblem = (
  ctx: Ctx2D,
  family: FamilyId,
  x: number,
  y: number,
  radius: number,
  opts: { time?: number; elder?: boolean; tier?: number; dim?: boolean } = {},
): void => {
  const { time = 0, elder = false, tier = 1 } = opts;
  const colors = FAMILY_COLORS[family];
  ctx.save();
  ctx.translate(x, y);
  drawGlow(ctx, 0, 0, radius * 1.5, colors.base, elder ? 0.75 : 0.5);
  if (elder) {
    drawGlow(ctx, 0, 0, radius * 2.1, colors.bright, 0.3 + Math.sin(time * 2) * 0.06);
  }

  // iron ring
  ctx.strokeStyle = elder ? COLORS.gold : '#3a3229';
  ctx.lineWidth = Math.max(1.5, radius * 0.09);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.98, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = rgba(colors.bright, 0.5);
  ctx.lineWidth = Math.max(1, radius * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, 0, TAU);
  ctx.stroke();

  // rotating rune ticks
  const ticks = elder ? 12 : tier + 2;
  ctx.save();
  ctx.rotate(time * (elder ? 0.35 : 0.12));
  for (let i = 0; i < ticks; i++) {
    ctx.rotate(TAU / ticks);
    ctx.strokeStyle = rgba(colors.base, 0.65);
    ctx.lineWidth = Math.max(1, radius * 0.05);
    ctx.beginPath();
    ctx.moveTo(radius * 0.86, 0);
    ctx.lineTo(radius * 0.98, 0);
    ctx.stroke();
  }
  ctx.restore();

  // inner disc
  const disc = ctx.createRadialGradient(0, -radius * 0.3, radius * 0.1, 0, 0, radius * 0.8);
  disc.addColorStop(0, rgba(colors.bright, 0.35));
  disc.addColorStop(0.6, rgba(colors.deep, 0.85));
  disc.addColorStop(1, 'rgba(8,9,14,0.95)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, TAU);
  ctx.fill();

  drawGlyph(ctx, family, 0, radius * 0.02, radius * 0.5, colors.bright, 0.98);

  if (tier >= 2 || elder) {
    ctx.strokeStyle = rgba(COLORS.gold, 0.6);
    ctx.lineWidth = Math.max(1, radius * 0.03);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
};

// ── Sigil towers on the board ──────────────────────────────────────────────

export interface TowerDrawOpts {
  time: number;
  selected: boolean;
  hovered: boolean;
  fuseReady: boolean;
  invalid?: boolean;
}

export const drawTower = (
  ctx: Ctx2D,
  tower: Tower,
  defGlyph: string,
  opts: TowerDrawOpts,
): void => {
  const { time, selected, hovered, fuseReady } = opts;
  const colors = FAMILY_COLORS[tower.family];
  const elder = tower.elder;
  const scale = elder ? 2.0 : tower.tier === 3 ? 1.82 : tower.tier === 2 ? 1.68 : 1.52;
  const pulse = 0.9 + Math.sin(time * 2.2 + tower.uid) * 0.07;

  ctx.save();
  ctx.translate(tower.x, tower.y);

  // shadow + light pools
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 26 * scale * 0.72, 28 * scale, 8.5 * scale, 0, 0, TAU);
  ctx.fill();
  drawGlow(ctx, 0, -8, 72 * scale, colors.base, 0.34 * pulse + (fuseReady ? 0.2 : 0) + (selected ? 0.15 : 0));

  if (selected || fuseReady || hovered) {
    ctx.strokeStyle = fuseReady ? COLORS.volt : selected ? COLORS.goldBright : rgba(COLORS.parchment, 0.5);
    ctx.lineWidth = selected || fuseReady ? 2.4 : 1.4;
    ctx.setLineDash(fuseReady ? [10, 7] : selected ? [] : [4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 46 * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // stone plinth
  ctx.save();
  ctx.scale(scale, scale);
  const plinth = ctx.createLinearGradient(0, 6, 0, 30);
  plinth.addColorStop(0, '#3a3730');
  plinth.addColorStop(1, '#1b1a18');
  ctx.fillStyle = plinth;
  ctx.beginPath();
  ctx.ellipse(0, 20, 25, 10, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(colors.base, 0.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 18, 20, 7, 0, 0, TAU);
  ctx.stroke();

  // stem
  ctx.strokeStyle = '#2a2521';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, 2);
  ctx.stroke();
  ctx.strokeStyle = rgba(COLORS.gold, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, 16);
  ctx.lineTo(-2, 4);
  ctx.stroke();
  ctx.restore();

  // lantern head (recoil pulls it back along the aim direction)
  const recoil = tower.recoil * 3;
  const ox = -Math.cos(tower.angle) * recoil;
  const oy = -Math.sin(tower.angle) * recoil + Math.sin(time * 1.8 + tower.uid) * 1.4;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  // head frame
  ctx.strokeStyle = '#241f1b';
  ctx.lineWidth = 3;
  roundRectPath(ctx, -13, -22, 26, 26, 7);
  ctx.fillStyle = 'rgba(12,13,18,0.92)';
  ctx.fill();
  ctx.stroke();

  // core
  const flash = clamp01(tower.flash * 3.2);
  drawGlow(ctx, 0, -9, 26 + flash * 10, colors.base, 0.75 + flash * 0.2);
  const core = ctx.createRadialGradient(0, -10, 1, 0, -10, 11);
  core.addColorStop(0, '#fffdf3');
  core.addColorStop(0.45, colors.bright);
  core.addColorStop(1, rgba(colors.base, 0.15));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -10, 8.4, 0, TAU);
  ctx.fill();
  if (elder) {
    ctx.save();
    ctx.rotate(time * 0.8);
    ctx.strokeStyle = rgba(COLORS.gold, 0.75);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -10, 13, 6, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // glass dome
  ctx.fillStyle = rgba(colors.bright, 0.1);
  ctx.beginPath();
  ctx.arc(0, -10, 11.5, Math.PI, 0);
  ctx.fill();

  // aiming lens
  ctx.save();
  ctx.rotate(tower.angle);
  ctx.fillStyle = '#2a2521';
  ctx.fillRect(9, -13, 8, 5);
  ctx.restore();

  // tier ornaments
  for (let i = 0; i < Math.min(3, tower.tier); i++) {
    const a = -Math.PI / 2 + (i - (Math.min(3, tower.tier) - 1) / 2) * 0.55;
    const px = Math.cos(a) * 16;
    const py = -10 + Math.sin(a) * 16;
    ctx.fillStyle = tower.elder ? COLORS.goldBright : rgba(colors.bright, 0.9);
    ctx.beginPath();
    ctx.arc(px, py, 1.7, 0, TAU);
    ctx.fill();
  }
  if (tower.kindle > 0) {
    for (let i = 0; i < tower.kindle; i++) {
      ctx.fillStyle = rgba(COLORS.gold, 0.8);
      ctx.beginPath();
      ctx.arc(-6 + i * 6, 7, 1.5, 0, TAU);
      ctx.fill();
    }
  }
  if (elder) {
    // crown of three spires
    ctx.strokeStyle = rgba(COLORS.gold, 0.85);
    ctx.lineWidth = 1.6;
    for (const dx of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(dx, -24);
      ctx.lineTo(dx * 1.35, -34);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -10, 20 + Math.sin(time * 1.6) * 1.5, 0, TAU);
    ctx.strokeStyle = rgba(COLORS.gold, 0.35);
    ctx.stroke();
  }

  // hanging rune tags
  if (tower.runes.length > 0) {
    ctx.strokeStyle = rgba(COLORS.parchment, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, 2);
    ctx.lineTo(16, 12);
    ctx.stroke();
    for (let i = 0; i < tower.runes.length; i++) {
      const ry = 13 + i * 5;
      ctx.fillStyle = rgba(COLORS.parchment, 0.85);
      ctx.beginPath();
      ctx.moveTo(16, ry);
      ctx.lineTo(20, ry + 2.5);
      ctx.lineTo(16, ry + 5);
      ctx.lineTo(12, ry + 2.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // sigil glyph floating above
  drawGlyph(ctx, defGlyph, ox, oy - 44 * scale, 7.5 * scale, colors.bright, 0.82);
  ctx.restore();
};

// ── Enemies ────────────────────────────────────────────────────────────────

const statusTint = (enemy: Enemy): string | null => {
  if (enemy.statuses.burn.time > 0) return COLORS.ember;
  if (enemy.statuses.chill.time > 0) return COLORS.frost;
  if (enemy.statuses.poison.time > 0) return COLORS.verdant;
  return null;
};

/** Melted wax running down a body. */
const waxDrips = (ctx: Ctx2D, s: number, color: string, time: number): void => {
  ctx.fillStyle = rgba(mixHex(color, '#fff6de', 0.35), 0.75);
  for (let i = 0; i < 4; i++) {
    const dx = (-0.55 + i * 0.36) * s;
    const len = s * (0.26 + Math.sin(i * 2.1 + time * 0.6) * 0.06);
    ctx.beginPath();
    ctx.moveTo(dx - s * 0.08, -s * 0.1);
    ctx.quadraticCurveTo(dx + s * 0.02, len * 0.7, dx, len);
    ctx.quadraticCurveTo(dx - s * 0.1, len * 0.6, dx - s * 0.16, -s * 0.1);
    ctx.fill();
  }
};

/** Ragged hem for cloaks and shades. */
const tatteredHem = (ctx: Ctx2D, s: number, y: number, spread: number, count = 5): void => {
  ctx.beginPath();
  ctx.moveTo(-spread, y);
  for (let i = 0; i < count; i++) {
    const x0 = -spread + ((i * 2 + 1) * spread) / count;
    const x1 = -spread + ((i * 2 + 2) * spread) / count;
    ctx.lineTo(x0, y + s * 0.18 + (i % 2) * s * 0.12);
    ctx.lineTo(x1, y - (i % 3 === 0 ? s * 0.06 : 0));
  }
  ctx.closePath();
};

export const drawEnemy = (ctx: Ctx2D, enemy: Enemy, defShape: string, time: number): void => {
  const s = enemy.size;
  const bob = Math.sin(time * 2.6 + enemy.seed * 0.01) * (enemy.lane === 'air' ? 3.5 : 1.8);
  const x = enemy.x;
  const y = enemy.y + bob;
  const base = (enemyColors[defShape] ?? '#9fb0d6');
  const color = mixHex(base, '#ffb08a', enemy.hitFlash * 0.7);
  const tint = statusTint(enemy);
  ctx.save();
  ctx.translate(x, y);
  if (defShape === 'flier') ctx.scale(1, 0.9);

  // ground/flying shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, s * 1.05, s * 0.75, s * 0.24, 0, 0, TAU);
  ctx.fill();

  drawGlow(ctx, 0, 0, s * (enemy.boss ? 3.4 : 2.3), tint ?? base, enemy.boss ? 0.5 : 0.32);

  switch (defShape) {
    case 'wisp': {
      // a guttering candle-ghost: hollow wax hood, inner flame, smoke trail
      drawTail(ctx, s * 1.15, color, time + enemy.seed);
      const hood = ctx.createLinearGradient(0, -s * 1.4, 0, s);
      hood.addColorStop(0, rgba(mixHex(color, '#ffffff', 0.28), 0.95));
      hood.addColorStop(0.62, rgba(color, 0.92));
      hood.addColorStop(1, rgba(shade(color, -0.55), 0.5));
      ctx.fillStyle = hood;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.4);
      ctx.bezierCurveTo(s * 0.78, -s * 0.5, s * 0.72, s * 0.55, s * 0.3, s * 0.95);
      ctx.quadraticCurveTo(0, s * 0.55, -s * 0.3, s * 0.95);
      ctx.bezierCurveTo(-s * 0.72, s * 0.55, -s * 0.78, -s * 0.5, 0, -s * 1.4);
      ctx.fill();
      // melted wax drips down the shroud
      waxDrips(ctx, s, color, time + enemy.seed);
      // hollow of the hood
      ctx.fillStyle = 'rgba(16,18,30,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.34, s * 0.42, s * 0.5, 0, 0, TAU);
      ctx.fill();
      // inner flame where a face would be
      const flame = ctx.createRadialGradient(0, -s * 0.22, 1, 0, -s * 0.22, s * 0.44);
      flame.addColorStop(0, 'rgba(255,252,232,0.95)');
      flame.addColorStop(0.42, 'rgba(255,196,120,0.65)');
      flame.addColorStop(1, 'rgba(255,150,80,0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.24, s * 0.3, s * 0.42, 0, 0, TAU);
      ctx.fill();
      drawEyes(ctx, s, 0.2, -0.32, '#1b2030');
      // candle wick and a spark at the crown
      ctx.strokeStyle = '#2b2620';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.36);
      ctx.lineTo(s * 0.04, -s * 1.6);
      ctx.stroke();
      drawGlow(ctx, s * 0.04, -s * 1.66, s * 0.5, COLORS.gold, 0.55);
      break;
    }
    case 'mite': {
      // a live coal on spindly legs, split by fire
      const legPhase = Math.sin(time * 11 + enemy.seed) * 0.16;
      ctx.strokeStyle = '#2c2018';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const a = (i - 1) * 0.55 + legPhase * (i % 2 ? 1 : -1);
          const kneeX = side * s * 0.86;
          const kneeY = a * s * 0.55 - s * 0.1;
          ctx.beginPath();
          ctx.moveTo(side * s * 0.42, a * s * 0.28 + s * 0.12);
          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(side * s * 1.15, kneeY + s * 0.42);
          ctx.stroke();
        }
      }
      // coal chunk
      const coal = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.8);
      coal.addColorStop(0, '#5a3a22');
      coal.addColorStop(0.45, '#33211a');
      coal.addColorStop(1, '#170f0d');
      ctx.fillStyle = coal;
      ctx.beginPath();
      ctx.moveTo(-s * 0.78, -s * 0.2);
      ctx.lineTo(-s * 0.42, -s * 0.72);
      ctx.lineTo(s * 0.3, -s * 0.8);
      ctx.lineTo(s * 0.78, -s * 0.25);
      ctx.lineTo(s * 0.55, s * 0.55);
      ctx.lineTo(-s * 0.2, s * 0.72);
      ctx.lineTo(-s * 0.72, s * 0.3);
      ctx.closePath();
      ctx.fill();
      // fire-lines through the coal
      ctx.strokeStyle = rgba(COLORS.ember, 0.42 + Math.sin(time * 4 + enemy.seed) * 0.16);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.1);
      ctx.lineTo(-s * 0.2, s * 0.08);
      ctx.lineTo(-s * 0.32, s * 0.42);
      ctx.moveTo(s * 0.1, -s * 0.62);
      ctx.lineTo(s * 0.22, -s * 0.22);
      ctx.lineTo(s * 0.6, -s * 0.12);
      ctx.stroke();
      drawGlow(ctx, -s * 0.2, -s * 0.06, s * 0.55, COLORS.ember, 0.5);
      ctx.fillStyle = '#ffe0a8';
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.06, s * 0.16, s * 0.11, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'husk': {
      // a burnt-down candle that kept walking
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.95, s * 0.78, s * 0.2, 0, 0, TAU);
      ctx.fill();
      // wax pool at the base
      const pool = ctx.createRadialGradient(0, s * 0.9, 2, 0, s * 0.9, s * 0.8);
      pool.addColorStop(0, 'rgba(60,48,34,0.9)');
      pool.addColorStop(1, 'rgba(30,24,18,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.92, s * 0.85, s * 0.26, 0, 0, TAU);
      ctx.fill();
      const grad = ctx.createLinearGradient(-s * 0.6, 0, s * 0.7, 0);
      grad.addColorStop(0, shade(color, -0.45));
      grad.addColorStop(0.24, shade(color, 0.32));
      grad.addColorStop(0.5, shade(color, 0.1));
      grad.addColorStop(1, shade(color, -0.68));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-s * 0.56, s * 0.9);
      ctx.quadraticCurveTo(-s * 0.72, s * 0.1, -s * 0.44, -s * 0.5);
      ctx.quadraticCurveTo(-s * 0.4, -s * 0.78, -s * 0.16, -s * 0.8);
      ctx.quadraticCurveTo(0, -s * 0.72, s * 0.16, -s * 0.82);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.76, s * 0.44, -s * 0.46);
      ctx.quadraticCurveTo(s * 0.72, s * 0.12, s * 0.56, s * 0.9);
      ctx.closePath();
      ctx.fill();
      // rim light down the left shoulder
      ctx.strokeStyle = 'rgba(255,226,170,0.22)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-s * 0.46, s * 0.6);
      ctx.quadraticCurveTo(-s * 0.6, s * 0.05, -s * 0.36, -s * 0.48);
      ctx.stroke();
      // heat cracks in the wax
      ctx.strokeStyle = 'rgba(255,150,80,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.42);
      ctx.lineTo(s * 0.1, -s * 0.1);
      ctx.lineTo(s * 0.26, s * 0.2);
      ctx.stroke();
      // running wax
      ctx.fillStyle = rgba(shade(color, 0.1), 0.5);
      for (let i = -1; i <= 1; i++) {
        const dx = i * s * 0.34;
        const len = s * (0.5 + (1 - Math.abs(i)) * 0.4) + Math.sin(time * 1.6 + i * 2) * s * 0.04;
        ctx.beginPath();
        ctx.moveTo(dx - s * 0.1, -s * 0.55);
        ctx.quadraticCurveTo(dx + s * 0.03, len * 0.2, dx, len);
        ctx.quadraticCurveTo(dx - s * 0.12, len * 0.3, dx - s * 0.16, -s * 0.55);
        ctx.fill();
      }
      // hollow where a face melted through
      ctx.fillStyle = 'rgba(16,11,7,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.28, s * 0.34, s * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,170,90,0.14)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.16, s * 0.22, s * 0.2, 0, 0, TAU);
      ctx.fill();
      drawEyes(ctx, s * 0.78, 0.1, -0.32, '#ffc98a', 'rgba(255,170,90,0.4)');
      // wick
      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.92);
      ctx.lineTo(s * 0.05, -s * 1.12);
      ctx.stroke();
      drawGlow(ctx, s * 0.05, -s * 1.16, s * 0.36, COLORS.ember, 0.5 + Math.sin(time * 5) * 0.12);
      break;
    }
    case 'flier': {
      const flap = Math.sin(time * 9 + enemy.seed) * 0.5;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate(flap * 0.35);
        const wing = ctx.createLinearGradient(0, 0, s * 1.6, -s * 0.6);
        wing.addColorStop(0, rgba(color, 0.9));
        wing.addColorStop(1, rgba(shade(color, -0.25), 0.35));
        ctx.fillStyle = wing;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 0.7, -s * 1.5, s * 1.7, -s * 0.9, s * 1.15, s * 0.25);
        ctx.bezierCurveTo(s * 0.7, s * 0.5, s * 0.3, s * 0.3, 0, 0);
        ctx.fill();
        ctx.strokeStyle = rgba(shade(color, -0.5), 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s * 0.2, -s * 0.1);
        ctx.lineTo(s * 1.0, -s * 0.5);
        ctx.moveTo(s * 0.25, s * 0.05);
        ctx.lineTo(s * 0.95, s * 0.1);
        ctx.stroke();
        // eye-spot and bands
        ctx.fillStyle = rgba('#4b3b26', 0.55);
        ctx.beginPath();
        ctx.ellipse(s * 0.86, -s * 0.46, s * 0.19, s * 0.15, 0.35, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba('#f6ecd2', 0.75);
        ctx.beginPath();
        ctx.ellipse(s * 0.86, -s * 0.46, s * 0.08, s * 0.06, 0.35, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba('#8d7550', 0.4);
        ctx.lineWidth = 1.1;
        for (let k = 1; k <= 2; k++) {
          ctx.beginPath();
          ctx.arc(0, 0, s * (0.55 + k * 0.28), -1.1, 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.fillStyle = rgba('#f4ead2', 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.26, s * 0.72, 0, 0, TAU);
      ctx.fill();
      // banded abdomen
      ctx.strokeStyle = rgba('#7b6039', 0.55);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const yy = -s * 0.15 + i * s * 0.22;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, yy);
        ctx.lineTo(s * 0.2, yy);
        ctx.stroke();
      }
      // fur collar
      ctx.fillStyle = rgba('#e7dcbd', 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.55, s * 0.34, s * 0.22, 0, 0, TAU);
      ctx.fill();
      // antennae
      ctx.strokeStyle = rgba('#c8b489', 0.9);
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.1, -s * 0.72);
        ctx.quadraticCurveTo(side * s * 0.5, -s * 1.1, side * s * 0.75, -s * 0.95);
        ctx.stroke();
      }
      drawEyes(ctx, s * 0.8, 0.28, -0.62, '#241a10');
      break;
    }
    case 'creeper': {
      // a root-knot that walks on briars
      ctx.strokeStyle = rgba(shade(color, -0.5), 0.95);
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + Math.sin(time * 0.6 + i) * 0.14;
        const bx = Math.cos(a) * s * 0.95;
        const by = Math.sin(a) * s * 0.55 + s * 0.42;
        ctx.beginPath();
        ctx.moveTo(bx * 0.5, s * 0.3);
        ctx.quadraticCurveTo(bx * 1.1, s * 0.7, bx * 1.3, by + s * 0.4);
        ctx.stroke();
        for (let k = 0; k < 3; k++) {
          const t = 0.35 + k * 0.22;
          const px = bx * 0.5 + (bx * 1.3 - bx * 0.5) * t;
          const py = s * 0.3 + (by + s * 0.4 - s * 0.3) * t;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(a + 1) * s * 0.18, py - s * 0.2);
          ctx.stroke();
        }
      }
      const body = ctx.createRadialGradient(-s * 0.25, -s * 0.4, s * 0.1, 0, 0, s);
      body.addColorStop(0, mixHex(color, '#c8b078', 0.35));
      body.addColorStop(0.5, shade(color, -0.15));
      body.addColorStop(1, shade(color, -0.6));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.8, s * 0.7, 0, 0, TAU);
      ctx.fill();
      // bark grain
      ctx.strokeStyle = rgba(shade(color, -0.75), 0.7);
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.22, -s * 0.66 + Math.abs(i) * s * 0.1);
        ctx.quadraticCurveTo(i * s * 0.34, 0, i * s * 0.2, s * 0.6 - Math.abs(i) * s * 0.08);
        ctx.stroke();
      }
      // crooked mouth-hole ringed with roots
      ctx.fillStyle = '#151109';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.08, s * 0.34, s * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(shade(color, -0.8), 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.08, s * 0.34, s * 0.3, 0, 0, TAU);
      ctx.stroke();
      drawGlow(ctx, 0, -s * 0.05, s * 0.4, COLORS.verdant, 0.28);
      // thorn spikes ringing the knot
      ctx.strokeStyle = rgba(shade(color, -0.6), 0.9);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + 0.3;
        const px = Math.cos(a) * s * 0.76;
        const py = -s * 0.05 + Math.sin(a) * s * 0.66;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a) * s * 0.24, py + Math.sin(a) * s * 0.24);
        ctx.stroke();
      }
      break;
    }
    case 'brute': {
      // a peat-burrower: mud hump armoured with slabs of bog stone
      const grad = ctx.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, shade(color, 0.18));
      grad.addColorStop(0.6, shade(color, -0.15));
      grad.addColorStop(1, shade(color, -0.6));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-s * 0.95, s * 0.85);
      ctx.quadraticCurveTo(-s * 1.1, -s * 0.2, -s * 0.62, -s * 0.72);
      ctx.quadraticCurveTo(0, -s * 1.24, s * 0.62, -s * 0.72);
      ctx.quadraticCurveTo(s * 1.1, -s * 0.2, s * 0.95, s * 0.85);
      ctx.closePath();
      ctx.fill();
      // stone plates down the back
      for (let i = 0; i < 3; i++) {
        const py = -s * 0.65 + i * s * 0.44;
        const pw = s * (0.7 - i * 0.06);
        ctx.fillStyle = i % 2 ? 'rgba(72,74,58,0.9)' : 'rgba(56,58,46,0.92)';
        ctx.beginPath();
        ctx.moveTo(-pw, py + s * 0.16);
        ctx.quadraticCurveTo(0, py - s * 0.26, pw, py + s * 0.16);
        ctx.quadraticCurveTo(0, py + s * 0.34, -pw, py + s * 0.16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,150,110,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (i < 2) {
          ctx.strokeStyle = 'rgba(50,80,50,0.5)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-pw * 0.7, py + s * 0.24);
          ctx.quadraticCurveTo(0, py + s * 0.4, pw * 0.7, py + s * 0.22);
          ctx.stroke();
        }
      }
      // under-mouth with tusks
      ctx.fillStyle = 'rgba(20,16,12,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.34, s * 0.5, s * 0.26, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e3d7b4';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.34, s * 0.3);
        ctx.quadraticCurveTo(side * s * 0.46, s * 0.02, side * s * 0.22, s * 0.16);
        ctx.fill();
      }
      drawGlow(ctx, 0, s * 0.28, s * 0.5, COLORS.ember, 0.22);
      drawEyes(ctx, s, 0.3, -0.16, '#ffcf8a', 'rgba(255,150,80,0.45)');
      // moss beard
      ctx.strokeStyle = 'rgba(88,116,72,0.7)';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.14, s * 0.02);
        ctx.quadraticCurveTo(i * s * 0.16, s * 0.3, i * s * 0.1, s * 0.46);
        ctx.stroke();
      }
      break;
    }
    case 'shade': {
      // a torn funeral banner that kept walking
      const grad = ctx.createLinearGradient(0, -s * 1.1, 0, s);
      grad.addColorStop(0, rgba(shade(color, 0.28), 0.96));
      grad.addColorStop(0.55, rgba(color, 0.7));
      grad.addColorStop(1, rgba(color, 0.04));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.18);
      ctx.quadraticCurveTo(s * 0.78, -s * 0.55, s * 0.66, s * 0.2);
      tatteredHem(ctx, s, s * 0.2, s * 0.66, 5);
      ctx.quadraticCurveTo(-s * 0.78, -s * 0.55, 0, -s * 1.18);
      ctx.fill();
      // vertical folds, lit from inside
      ctx.strokeStyle = rgba(mixHex(color, '#ffffff', 0.55), 0.3);
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.1, -s * 0.95 + Math.abs(i) * s * 0.16);
        ctx.quadraticCurveTo(i * s * 0.3, -s * 0.1, i * s * 0.24, s * 0.34);
        ctx.stroke();
      }
      // hollow cowl and pale eye-slits
      ctx.fillStyle = 'rgba(10,8,16,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.52, s * 0.32, s * 0.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#efe6ff';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * s * 0.14, -s * 0.52, s * 0.09, s * 0.045, side * 0.2, 0, TAU);
        ctx.fill();
      }
      drawGlow(ctx, 0, -s * 0.5, s * 0.55, '#efe6ff', 0.28);
      // tether to the ground
      ctx.strokeStyle = rgba(color, 0.35);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.quadraticCurveTo(s * 0.14, s * 0.9, 0, s * 1.15);
      ctx.stroke();
      break;
    }
    case 'warder': {
      // a shroud-keeper: heavy robe, hood, lantern staff held high
      const robe = ctx.createLinearGradient(0, -s * 0.8, 0, s);
      robe.addColorStop(0, shade(color, 0.22));
      robe.addColorStop(0.6, shade(color, -0.18));
      robe.addColorStop(1, shade(color, -0.62));
      ctx.fillStyle = robe;
      ctx.beginPath();
      ctx.moveTo(-s * 0.74, s);
      ctx.quadraticCurveTo(-s * 0.56, -s * 0.35, -s * 0.3, -s * 0.72);
      ctx.quadraticCurveTo(0, -s * 1.0, s * 0.3, -s * 0.72);
      ctx.quadraticCurveTo(s * 0.56, -s * 0.35, s * 0.74, s);
      ctx.closePath();
      ctx.fill();
      // robe seams
      ctx.strokeStyle = rgba(shade(color, -0.55), 0.6);
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.22, -s * 0.4);
        ctx.quadraticCurveTo(i * s * 0.34, s * 0.2, i * s * 0.3, s * 0.96);
        ctx.stroke();
      }
      // hood opening
      ctx.fillStyle = 'rgba(14,12,10,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.62, s * 0.28, s * 0.34, 0, 0, TAU);
      ctx.fill();
      drawGlow(ctx, 0, -s * 0.62, s * 0.36, COLORS.heal, 0.28);
      drawEyes(ctx, s * 0.7, 0.13, -0.62, '#d8f0d0');
      ctx.strokeStyle = '#3a2f22';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(s * 0.75, -s * 1.1);
      ctx.lineTo(s * 0.75, s * 0.9);
      ctx.stroke();
      drawGlow(ctx, s * 0.75, -s * 1.2, s * 0.5, COLORS.gold, 0.55);
      ctx.fillStyle = COLORS.goldBright;
      ctx.beginPath();
      ctx.arc(s * 0.75, -s * 1.2, s * 0.16, 0, TAU);
      ctx.fill();
      break;
    }
    case 'shrieker': {
      // a hanging bell of tallow that screams the road awake
      const bell = ctx.createLinearGradient(0, -s * 1.1, 0, s * 0.9);
      bell.addColorStop(0, shade(color, 0.3));
      bell.addColorStop(0.6, color);
      bell.addColorStop(1, shade(color, -0.5));
      ctx.fillStyle = bell;
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, -s * 1.05);
      ctx.quadraticCurveTo(-s * 1.0, -s * 0.5, -s * 0.82, s * 0.45);
      // jagged hem
      for (let i = 0; i < 6; i++) {
        const x0 = -s * 0.82 + (i * 2 * s * 0.82) / 6;
        const x1 = -s * 0.82 + ((i * 2 + 1) * s * 0.82) / 6;
        ctx.lineTo(x0, s * 0.66 + (i % 2) * s * 0.14);
        ctx.lineTo(x1, s * 0.42);
      }
      ctx.quadraticCurveTo(s * 1.0, -s * 0.5, s * 0.16, -s * 1.05);
      ctx.closePath();
      ctx.fill();
      // hanging mouth
      ctx.fillStyle = 'rgba(20,8,22,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.02, s * 0.34, s * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba('#f0d8f4', 0.55);
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.16, -s * 0.26);
        ctx.lineTo(i * s * 0.2, s * 0.3);
        ctx.stroke();
      }
      // ring and eye slits above the mouth
      ctx.strokeStyle = rgba(COLORS.gold, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 1.06, s * 0.2, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#ffd9f4';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * s * 0.2, -s * 0.62, s * 0.1, s * 0.05, side * 0.3, 0, TAU);
        ctx.fill();
      }
      drawGlow(ctx, 0, -s * 0.6, s * 0.5, '#ffd9f4', 0.3);
      // swaying tendrils
      ctx.strokeStyle = rgba(shade(color, -0.4), 0.8);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const base = -s * 0.6 + i * s * 0.34;
        ctx.beginPath();
        ctx.moveTo(s * 0.78, base);
        ctx.quadraticCurveTo(s * 1.2, base + s * 0.2, s * 1.05, base + s * (0.5 + Math.sin(time * 3 + i) * 0.1));
        ctx.stroke();
      }
      break;
    }
    case 'herald': {
      // robed boss with antlers and a stolen lantern
      ctx.fillStyle = '#1a1610';
      ctx.beginPath();
      ctx.moveTo(-s * 0.95, s);
      ctx.quadraticCurveTo(-s * 0.8, -s * 0.2, -s * 0.32, -s * 0.75);
      ctx.quadraticCurveTo(0, -s * 1.05, s * 0.32, -s * 0.75);
      ctx.quadraticCurveTo(s * 0.8, -s * 0.2, s * 0.95, s);
      ctx.closePath();
      ctx.fill();
      // mantle folds + belt with a hanging seal
      ctx.strokeStyle = rgba('#9c7f52', 0.5);
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.13, -s * 0.5);
        ctx.quadraticCurveTo(i * s * 0.3, s * 0.2, i * s * 0.36, s * 0.96);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(COLORS.gold, 0.45);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.34);
      ctx.quadraticCurveTo(0, s * 0.46, s * 0.5, s * 0.34);
      ctx.stroke();
      ctx.fillStyle = rgba(COLORS.gold, 0.75);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.42);
      ctx.lineTo(s * 0.08, s * 0.52);
      ctx.lineTo(0, s * 0.62);
      ctx.lineTo(-s * 0.08, s * 0.52);
      ctx.closePath();
      ctx.fill();
      // face void
      ctx.fillStyle = '#08070a';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.35, s * 0.34, s * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = COLORS.ember;
      for (const dx of [-0.12, 0.12]) {
        ctx.beginPath();
        ctx.ellipse(dx * s, -s * 0.38, s * 0.06, s * 0.1, 0, 0, TAU);
        ctx.fill();
      }
      // antlers
      ctx.strokeStyle = '#c8b08a';
      ctx.lineWidth = 2.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.18, -s * 0.72);
        ctx.quadraticCurveTo(side * s * 0.6, -s * 1.05, side * s * 0.45, -s * 1.35);
        ctx.moveTo(side * s * 0.4, -s * 1.0);
        ctx.lineTo(side * s * 0.7, -s * 1.12);
        ctx.stroke();
      }
      // lantern staff
      ctx.strokeStyle = '#2a231b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s * 0.78, s * 0.95);
      ctx.lineTo(s * 0.78, -s * 0.25);
      ctx.stroke();
      drawGlow(ctx, s * 0.78, -s * 0.42, s * 0.75, COLORS.gold, 0.7);
      ctx.fillStyle = COLORS.goldBright;
      roundRectPath(ctx, s * 0.66, -s * 0.55, s * 0.24, s * 0.3, s * 0.06);
      ctx.fill();
      break;
    }
    case 'choir': {
      // mass of thorn branches wearing masks
      ctx.strokeStyle = '#3d3a26';
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + time * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.2);
        ctx.quadraticCurveTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.5, Math.cos(a) * s * 1.2, Math.sin(a) * s * 0.95);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(color, 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s * 0.9, 0, 0, TAU);
      ctx.fill();
      // a garland of carved thorn masks, each lit from inside
      for (const [dx, dy, r, tilt] of [
        [0, -0.52, 0.3, -0.05],
        [-0.58, 0.06, 0.25, -0.3],
        [0.58, 0.06, 0.25, 0.3],
        [0, 0.44, 0.27, 0.04],
      ]) {
        const mx = dx * s;
        const my = dy * s;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(tilt + Math.sin(time * 1.4 + mx) * 0.05);
        // wooden mask
        const mask = ctx.createLinearGradient(0, -s * r, 0, s * r);
        mask.addColorStop(0, '#d9cba4');
        mask.addColorStop(0.55, '#b8a67f');
        mask.addColorStop(1, '#6d5c42');
        ctx.fillStyle = mask;
        ctx.beginPath();
        ctx.moveTo(0, -s * r * 1.25);
        ctx.quadraticCurveTo(s * r, -s * r * 0.7, s * r * 0.72, s * r * 0.55);
        ctx.quadraticCurveTo(0, s * r * 1.35, -s * r * 0.72, s * r * 0.55);
        ctx.quadraticCurveTo(-s * r, -s * r * 0.7, 0, -s * r * 1.25);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,44,28,0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // carved brow + slit eyes
        ctx.strokeStyle = 'rgba(52,38,24,0.8)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-s * r * 0.62, -s * r * 0.42);
        ctx.quadraticCurveTo(0, -s * r * 0.62, s * r * 0.62, -s * r * 0.42);
        ctx.stroke();
        ctx.fillStyle = '#1b150d';
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * s * r * 0.34, -s * r * 0.08, s * r * 0.2, s * r * 0.1, side * 0.24, 0, TAU);
          ctx.fill();
        }
        // wailing oval mouth
        ctx.fillStyle = 'rgba(24,18,10,0.9)';
        ctx.beginPath();
        ctx.ellipse(0, s * r * 0.48, s * r * 0.16, s * r * 0.3, 0, 0, TAU);
        ctx.fill();
        // thorn pins through the mask
        ctx.strokeStyle = '#5c6b3e';
        ctx.lineWidth = 1.2;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * s * r * 0.9, s * r * 0.1);
          ctx.lineTo(side * s * r * 1.45, s * r * 0.02);
          ctx.stroke();
        }
        ctx.restore();
      }
      // crown of thorns behind the masks
      ctx.strokeStyle = 'rgba(94,116,64,0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 1.15, s * 1.05, 0, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.2;
        const px = Math.cos(a) * s * 1.15;
        const py = -s * 0.05 + Math.sin(a) * s * 1.05;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + 0.9) * s * 0.22, py + Math.sin(a + 0.9) * s * 0.22);
        ctx.stroke();
      }
      drawGlow(ctx, 0, 0, s * 1.6, COLORS.verdant, 0.32);
      break;
    }
    case 'king': {
      // enormous furnace-ribbed king
      ctx.fillStyle = '#17131a';
      ctx.beginPath();
      ctx.moveTo(-s, s);
      ctx.quadraticCurveTo(-s * 0.95, -s * 0.45, -s * 0.4, -s * 0.95);
      ctx.quadraticCurveTo(0, -s * 1.25, s * 0.4, -s * 0.95);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.45, s, s);
      ctx.closePath();
      ctx.fill();
      // ribs with fire inside
      for (let i = 0; i < 5; i++) {
        const yy = -s * 0.55 + i * s * 0.28;
        ctx.strokeStyle = rgba('#e8b06a', 0.8);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, yy);
        ctx.quadraticCurveTo(0, yy + s * 0.16, s * 0.5, yy);
        ctx.stroke();
        drawGlow(ctx, 0, yy + s * 0.06, s * 0.4, COLORS.ember, 0.35);
      }
      // crown
      drawGlyph(ctx, 'crown', 0, -s * 1.05, s * 0.5, COLORS.gold, 0.95);
      // head
      ctx.fillStyle = '#241a12';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.72, s * 0.32, s * 0.36, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = COLORS.ember;
      for (const dx of [-0.13, 0.13]) {
        ctx.beginPath();
        ctx.ellipse(dx * s, -s * 0.74, s * 0.07, s * 0.11, 0, 0, TAU);
        ctx.fill();
      }
      drawGlow(ctx, 0, 0, s * 2.2, COLORS.ember, 0.35);
      break;
    }
    default: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
    }
  }

  // status overlays
  if (enemy.statuses.burn.time > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + i * 2.1;
      const px = Math.sin(a) * s * 0.6;
      const py = -Math.abs(Math.cos(a)) * s * 1.1;
      drawGlow(ctx, px, py, s * 0.55, COLORS.ember, 0.55);
    }
  }
  if (enemy.statuses.chill.time > 0) {
    ctx.strokeStyle = rgba(COLORS.frost, 0.65);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const a = time * 0.7 + i * 2.2;
      const px = Math.cos(a) * s * 0.95;
      const py = Math.sin(a) * s * 0.65;
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + 3, py);
      ctx.moveTo(px, py - 3);
      ctx.lineTo(px, py + 3);
      ctx.stroke();
    }
  }
  if (enemy.statuses.mark.time > 0) {
    ctx.strokeStyle = rgba(COLORS.umbral, 0.85);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.35, time * 1.2, time * 1.2 + TAU * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (enemy.statuses.shock.time > 0 && Math.sin(time * 22) > 0.4) {
    ctx.strokeStyle = rgba(COLORS.volt, 0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.6);
    ctx.lineTo(-s * 0.2, -s * 0.2);
    ctx.lineTo(-s * 0.5, s * 0.2);
    ctx.lineTo(s * 0.1, s * 0.5);
    ctx.stroke();
  }
  if (enemy.shielded > 0) {
    ctx.strokeStyle = rgba(COLORS.gold, 0.5 + Math.sin(time * 4) * 0.15);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.25, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  // health bar
  if (enemy.hp < enemy.hpMax || enemy.boss) {
    const w = enemy.boss ? s * 3 : s * 2.2;
    const h = enemy.boss ? 7 : 4;
    const bx = x - w / 2;
    const by = y - s * (enemy.boss ? 1.75 : 1.6) - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRectPath(ctx, bx, by, w, h, h / 2);
    ctx.fill();
    const frac = clamp01(enemy.hp / enemy.hpMax);
    const grad = ctx.createLinearGradient(bx, 0, bx + w, 0);
    grad.addColorStop(0, enemy.boss ? '#ff8a5c' : '#e8574f');
    grad.addColorStop(1, enemy.boss ? '#ffd166' : '#ffb36b');
    ctx.fillStyle = grad;
    roundRectPath(ctx, bx + 0.5, by + 0.5, Math.max(0, (w - 1) * frac), h - 1, h / 2);
    ctx.fill();
    if (enemy.boss) {
      ctx.strokeStyle = rgba(COLORS.gold, 0.6);
      roundRectPath(ctx, bx, by, w, h, h / 2);
      ctx.stroke();
    }
  }
};

const drawEyes = (ctx: Ctx2D, s: number, spread: number, y: number, color: string, glowColor?: string): void => {
  for (const dx of [-spread, spread]) {
    if (glowColor) drawGlow(ctx, dx * s, y * s, s * 0.35, glowColor, 0.6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(dx * s, y * s, s * 0.11, s * 0.15, 0, 0, TAU);
    ctx.fill();
  }
};

const drawTail = (ctx: Ctx2D, s: number, color: string, seed: number): void => {
  ctx.strokeStyle = rgba(color, 0.6);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.7);
  ctx.bezierCurveTo(s * 0.4, s * 1.2, -s * 0.3, s * 1.5, s * 0.15, s * 2.1 + Math.sin(seed) * 3);
  ctx.stroke();
};

const enemyColors: Record<string, string> = {
  wisp: '#9fb0d6',
  mite: '#e8b27a',
  husk: '#c8b28c',
  flier: '#e6d5a8',
  creeper: '#93c98a',
  brute: '#8a7a5e',
  shade: '#8f86b8',
  warder: '#f0c98a',
  shrieker: '#d59ad0',
  herald: '#e2a05c',
  choir: '#86c492',
  king: '#f0b979',
};

// ── World decoration ───────────────────────────────────────────────────────

export const drawTree = (ctx: Ctx2D, x: number, y: number, scale: number, time: number, seed = 0): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 7, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#201c18';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-3, -26, 2, -44);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -24 * 1);
    ctx.quadraticCurveTo(side * 16, -34, side * 24, -52);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(side * 10, -44, side * 12, -60);
    ctx.stroke();
  }
  const sway = Math.sin(time * 0.6 + seed) * 2;
  const grad = ctx.createLinearGradient(0, -80, 0, -20);
  grad.addColorStop(0, '#1d2a22');
  grad.addColorStop(1, '#101813');
  ctx.fillStyle = grad;
  for (const [dx, dy, r] of [
    [-14, -56, 18],
    [14, -58, 16],
    [0, -70, 20],
    [-4, -46, 15],
  ]) {
    ctx.beginPath();
    ctx.ellipse(dx + sway * 0.4, dy, r, r * 0.8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = rgba('#3f5347', 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(2 + sway * 0.4, -72, 17, 12, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
};

export const drawStone = (ctx: Ctx2D, x: number, y: number, scale: number, hue = 0): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 12, 4, 0, 0, TAU);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, -10, 0, 6);
  grad.addColorStop(0, hue ? '#4a4438' : '#3d4038');
  grad.addColorStop(1, '#23251f');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-12, 3);
  ctx.quadraticCurveTo(-10, -9, -2, -11);
  ctx.quadraticCurveTo(8, -12, 12, -2);
  ctx.quadraticCurveTo(10, 5, 0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba('#8a8b78', 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.quadraticCurveTo(0, -9, 6, -5);
  ctx.stroke();
  ctx.restore();
};

export const drawCandlePost = (ctx: Ctx2D, x: number, y: number, time: number, scale = 1): void => {
  const ctx2 = ctx;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.scale(scale, scale);
  ctx2.strokeStyle = '#2b251f';
  ctx2.lineWidth = 2.4;
  ctx2.beginPath();
  ctx2.moveTo(0, 8);
  ctx2.lineTo(0, -26);
  ctx2.stroke();
  const flick = 0.85 + Math.sin(time * 6 + x) * 0.15;
  drawGlow(ctx2, 0, -32, 42 * flick, COLORS.gold, 0.5);
  ctx2.fillStyle = rgba(COLORS.gold, 0.22);
  roundRectPath(ctx2, -7, -40, 14, 16, 4);
  ctx2.fill();
  ctx2.strokeStyle = rgba(COLORS.gold, 0.7);
  ctx2.lineWidth = 1.2;
  roundRectPath(ctx2, -7, -40, 14, 16, 4);
  ctx2.stroke();
  ctx2.fillStyle = COLORS.goldBright;
  ctx2.beginPath();
  ctx2.ellipse(0, -32, 2.4, 4.4 * flick, 0, 0, TAU);
  ctx2.fill();
  ctx2.restore();
};

