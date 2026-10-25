/**
 * Procedural crew card illustration.
 *
 * Each card is painted as an original vector-style portrait: a nebula backdrop lit by the
 * rarity palette, environment silhouettes specific to the crew member's role, a helmeted
 * figure with visor reflections and role props, then grading, foil streaks and vignetting.
 * The art seed makes every card unique and reproducible.
 */
import { RNG, clamp } from '../core/rng.ts';
import type { CrewCard, Rarity } from '../data/crew.ts';

export interface Palette {
  deep: string;
  mid: string;
  light: string;
  accent: string;
  rim: string;
  suit: string;
  suitDark: string;
  visor: string;
}

const RARITY_PALETTES: Record<Rarity, Palette> = {
  common:    { deep: '#0a1020', mid: '#17233d', light: '#31507a', accent: '#8fa5c8', rim: '#cbd5e1', suit: '#5d6a80', suitDark: '#333c4d', visor: '#9fd0ff' },
  uncommon:  { deep: '#06160f', mid: '#0f2e21', light: '#1d5c3f', accent: '#4ade80', rim: '#a7f3c7', suit: '#4c6a5a', suitDark: '#283b31', visor: '#9bffd0' },
  rare:      { deep: '#050d20', mid: '#0d2347', light: '#17417e', accent: '#60a5fa', rim: '#bfdbfe', suit: '#44587e', suitDark: '#222e45', visor: '#9fd8ff' },
  epic:      { deep: '#140725', mid: '#2a1050', light: '#4c1d95', accent: '#c084fc', rim: '#e9d5ff', suit: '#5b4580', suitDark: '#2e2246', visor: '#e0b9ff' },
  legendary: { deep: '#241405', mid: '#4a2c08', light: '#92600f', accent: '#fbbf24', rim: '#fde68a', suit: '#7a5a2a', suitDark: '#3d2d16', visor: '#ffdf9b' },
  mythic:    { deep: '#250716', mid: '#511036', light: '#9d1f63', accent: '#f472b6', rim: '#fbcfe8', suit: '#7c3f63', suitDark: '#3f1f33', visor: '#ffc7e6' },
  secret:    { deep: '#02100f', mid: '#06302c', light: '#0a6b61', accent: '#00ffd0', rim: '#99fff0', suit: '#17524c', suitDark: '#0b2b28', visor: '#b7fff4' },
};

export function paletteFor(rarity: Rarity): Palette {
  return RARITY_PALETTES[rarity];
}

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Paints the illustration (no frame/text) onto a canvas context.
 */
export function paintCardArt(ctx: CanvasRenderingContext2D, card: CrewCard, w: number, h: number): void {
  const rng = new RNG(card.artSeed);
  const pal = paletteFor(card.rarity);

  // ------------------------------------------------------------- backdrop
  const sky = ctx.createLinearGradient(0, 0, w * 0.35, h);
  sky.addColorStop(0, pal.deep);
  sky.addColorStop(0.55, pal.mid);
  sky.addColorStop(1, pal.deep);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Nebula blobs.
  for (let i = 0; i < 7; i++) {
    const cx = rng.range(-0.1, 1.1) * w;
    const cy = rng.range(-0.1, 0.9) * h;
    const r = rng.range(0.18, 0.6) * w;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const col = i % 2 === 0 ? pal.light : pal.accent;
    g.addColorStop(0, withAlpha(col, rng.range(0.12, 0.3)));
    g.addColorStop(1, withAlpha(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Stars.
  for (let i = 0; i < 160; i++) {
    const x = rng.range(0, w), y = rng.range(0, h * 0.85);
    const s = Math.pow(rng.next(), 3) * 2.6 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${rng.range(0.2, 0.95)})`;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant planet / sun for depth.
  if (rng.chance(0.75)) {
    const px = rng.range(0.1, 0.9) * w;
    const py = rng.range(0.1, 0.4) * h;
    const pr = rng.range(0.08, 0.2) * w;
    const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
    pg.addColorStop(0, withAlpha(pal.rim, 0.9));
    pg.addColorStop(0.6, withAlpha(pal.light, 0.6));
    pg.addColorStop(1, withAlpha(pal.deep, 0.9));
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    // Ring.
    if (rng.chance(0.4)) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rng.range(-0.5, 0.5));
      ctx.strokeStyle = withAlpha(pal.accent, 0.45);
      ctx.lineWidth = pr * 0.1;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 1.7, pr * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ------------------------------------------- environment by role motif
  drawEnvironment(ctx, card, rng, w, h, pal);

  // ------------------------------------------------------------- figure
  drawFigure(ctx, card, rng, w, h, pal);

  // -------------------------------------------------------------- grading
  // Rim light sweep.
  const sweep = ctx.createLinearGradient(0, h, w, 0);
  sweep.addColorStop(0, withAlpha(pal.accent, 0.0));
  sweep.addColorStop(0.6, withAlpha(pal.accent, 0.08));
  sweep.addColorStop(1, withAlpha(pal.rim, 0.16));
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, w, h);

  // Foil streaks for high rarities.
  const rarityRank = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret'].indexOf(card.rarity);
  if (rarityRank >= 3) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4 + rarityRank; i++) {
      const x = rng.range(-w * 0.2, w);
      ctx.strokeStyle = withAlpha(pal.rim, rng.range(0.05, 0.16));
      ctx.lineWidth = rng.range(2, 16);
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + w * 0.45, h + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Vignette.
  const vig = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.25, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawEnvironment(ctx: CanvasRenderingContext2D, card: CrewCard, rng: RNG, w: number, h: number, pal: Palette): void {
  ctx.save();
  switch (card.motif) {
    case 'miner': {
      // Asteroid field silhouettes with a mining beam.
      for (let i = 0; i < 5; i++) {
        const cx = rng.range(0, w), cy = rng.range(h * 0.25, h * 0.8);
        const r = rng.range(w * 0.05, w * 0.2);
        ctx.fillStyle = withAlpha(pal.deep, 0.92);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
          const rr = r * rng.range(0.75, 1.25);
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.85;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.accent, 0.3);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      const bx = rng.range(w * 0.1, w * 0.3), by = rng.range(h * 0.2, h * 0.45);
      const grad = ctx.createLinearGradient(w * 0.75, h * 0.62, bx, by);
      grad.addColorStop(0, withAlpha('#ff6b4a', 0.0));
      grad.addColorStop(1, withAlpha('#ff9a3c', 0.65));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.62);
      ctx.lineTo(bx, by);
      ctx.stroke();
      break;
    }
    case 'gunner': {
      // Tracer fire and a distant hostile.
      for (let i = 0; i < 9; i++) {
        const y = rng.range(h * 0.15, h * 0.6);
        ctx.strokeStyle = withAlpha('#ffd166', rng.range(0.15, 0.5));
        ctx.lineWidth = rng.range(1.5, 4);
        ctx.beginPath();
        ctx.moveTo(rng.range(0, w * 0.4), y);
        ctx.lineTo(rng.range(w * 0.6, w), y + rng.range(-20, 20));
        ctx.stroke();
      }
      ctx.fillStyle = withAlpha(pal.deep, 0.95);
      ctx.beginPath();
      const ex = w * rng.range(0.6, 0.85), ey = h * rng.range(0.2, 0.35), es = w * 0.09;
      ctx.moveTo(ex - es, ey);
      ctx.lineTo(ex, ey - es * 0.5);
      ctx.lineTo(ex + es, ey);
      ctx.lineTo(ex, ey + es * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = withAlpha('#ff3b6b', 0.85);
      ctx.beginPath();
      ctx.arc(ex, ey, es * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pilot': {
      // Cockpit HUD arcs and motion streaks.
      ctx.strokeStyle = withAlpha(pal.accent, 0.4);
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.52, w * (0.3 + i * 0.1), Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const y = rng.range(0, h);
        ctx.strokeStyle = withAlpha(pal.rim, rng.range(0.08, 0.28));
        ctx.lineWidth = rng.range(1, 3);
        ctx.beginPath();
        ctx.moveTo(rng.range(0, w), y);
        ctx.lineTo(rng.range(0, w) + rng.range(40, 160), y);
        ctx.stroke();
      }
      break;
    }
    case 'engineer': {
      // Machinery bay: pipes, gauges, sparks.
      ctx.strokeStyle = withAlpha(pal.light, 0.75);
      ctx.lineWidth = w * 0.035;
      for (let i = 0; i < 4; i++) {
        const y = h * (0.25 + i * 0.16);
        ctx.beginPath();
        ctx.moveTo(-10, y);
        ctx.lineTo(w * rng.range(0.3, 0.7), y);
        ctx.lineTo(w * rng.range(0.75, 1.1), y + rng.range(-h * 0.1, h * 0.1));
        ctx.stroke();
      }
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = withAlpha('#ffd166', rng.range(0.25, 0.8));
        const sx = rng.range(w * 0.55, w), sy = rng.range(h * 0.35, h * 0.75);
        ctx.fillRect(sx, sy, rng.range(2, 7), rng.range(1, 3));
      }
      break;
    }
    case 'scientist': {
      // Data lattice and specimen hologram.
      ctx.strokeStyle = withAlpha(pal.accent, 0.3);
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 14; i++) {
        ctx.beginPath();
        ctx.moveTo((i / 14) * w, 0);
        ctx.lineTo((i / 14) * w, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, (i / 14) * h);
        ctx.lineTo(w, (i / 14) * h);
        ctx.stroke();
      }
      const cx = w * 0.7, cy = h * 0.3, r = w * 0.14;
      ctx.strokeStyle = withAlpha(pal.rim, 0.65);
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = withAlpha(pal.accent, 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'commander': {
      // Fleet formation and command banner.
      for (let i = 0; i < 6; i++) {
        const sx = w * (0.15 + i * 0.14) + rng.range(-10, 10);
        const sy = h * (0.18 + (i % 3) * 0.08);
        const s = w * rng.range(0.03, 0.06);
        ctx.fillStyle = withAlpha(pal.deep, 0.9);
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.8, sy + s * 0.7);
        ctx.lineTo(sx - s * 0.8, sy + s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.accent, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fillStyle = withAlpha(pal.accent, 0.12);
      ctx.fillRect(0, h * 0.42, w, h * 0.06);
      break;
    }
    case 'collector': {
      // Magnet field rings pulling ore chunks.
      const cx = w * 0.3, cy = h * 0.42;
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = withAlpha(pal.accent, 0.35 / i + 0.08);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.12 * i, w * 0.09 * i, 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = rng.range(0, Math.PI * 2), r = rng.range(w * 0.12, w * 0.5);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
        ctx.fillStyle = withAlpha(pal.rim, rng.range(0.4, 0.95));
        ctx.beginPath();
        const s = rng.range(3, 11);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s * 0.8);
        ctx.lineTo(x - s * 0.9, y);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default: {
      // Void anomaly: event horizon rings and distortion.
      const cx = w * 0.52, cy = h * 0.36;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
      g.addColorStop(0, 'rgba(0,0,0,0.95)');
      g.addColorStop(0.35, withAlpha(pal.accent, 0.45));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.rim, 0.5);
      for (let i = 0; i < 5; i++) {
        ctx.lineWidth = rng.range(1, 3.5);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * (0.16 + i * 0.07), w * (0.05 + i * 0.03), rng.range(-0.5, 0.5), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

type Archetype = 'dome' | 'angular' | 'tvisor' | 'dual' | 'crest' | 'hooded';

/**
 * Draws the crew portrait. Every card varies: framing, helmet archetype, visor geometry,
 * suit panelling, emblem, headgear and props are all derived from the card's art seed,
 * so no two illustrations repeat.
 */
function drawFigure(ctx: CanvasRenderingContext2D, card: CrewCard, rng: RNG, w: number, h: number, pal: Palette): void {
  const archetypes: Archetype[] = ['dome', 'angular', 'tvisor', 'dual', 'crest', 'hooded'];
  const archetype = archetypes[(card.artSeed + card.number * 7) % archetypes.length];

  // Framing varies between tight portrait, medium bust and wide shot. Sizes are driven by the
  // art window height so the whole bust always fits inside the frame.
  const framing = rng.range(0, 1);
  const unit = Math.min(w * 0.5, h * 0.62);
  const headR = unit * (framing < 0.33 ? rng.range(0.38, 0.44) : framing < 0.7 ? rng.range(0.3, 0.36) : rng.range(0.24, 0.29));
  const cx = w * 0.5 + rng.range(-0.11, 0.11) * w;
  const headY = h * (framing < 0.33 ? rng.range(0.34, 0.4) : rng.range(0.3, 0.37));
  const tilt = rng.range(-0.08, 0.08);

  ctx.save();
  // Backlight halo.
  const halo = ctx.createRadialGradient(cx, headY, headR * 0.3, cx, headY, headR * 3.6);
  halo.addColorStop(0, withAlpha(pal.accent, 0.38));
  halo.addColorStop(1, withAlpha(pal.accent, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  ctx.translate(cx, headY);
  ctx.rotate(tilt);
  ctx.translate(-cx, -headY);

  const shoulderY = headY + headR * 1.42;
  const bodyW = headR * 2.3;

  // ------------------------------------------------------------- torso
  const bodyGrad = ctx.createLinearGradient(cx - bodyW, shoulderY, cx + bodyW, h);
  bodyGrad.addColorStop(0, pal.suitDark);
  bodyGrad.addColorStop(0.45, pal.suit);
  bodyGrad.addColorStop(1, pal.suitDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - bodyW * 1.25, h);
  ctx.quadraticCurveTo(cx - bodyW * 1.1, shoulderY + headR * 0.5, cx - bodyW * 0.56, shoulderY - headR * 0.08);
  ctx.lineTo(cx + bodyW * 0.56, shoulderY - headR * 0.08);
  ctx.quadraticCurveTo(cx + bodyW * 1.1, shoulderY + headR * 0.5, cx + bodyW * 1.25, h);
  ctx.closePath();
  ctx.fill();

  // Suit panelling - three different schemes.
  const scheme = (card.artSeed >> 3) % 3;
  ctx.save();
  ctx.clip();
  if (scheme === 0) {
    ctx.fillStyle = withAlpha(pal.accent, 0.16);
    ctx.fillRect(cx - bodyW * 0.18, shoulderY - headR, bodyW * 0.36, h);
  } else if (scheme === 1) {
    ctx.strokeStyle = withAlpha(pal.rim, 0.22);
    ctx.lineWidth = headR * 0.1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - bodyW * 1.4, shoulderY + headR * (0.4 + i * 0.55));
      ctx.lineTo(cx + bodyW * 1.4, shoulderY + headR * (0.25 + i * 0.55));
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = withAlpha(pal.deep, 0.45);
    ctx.beginPath();
    ctx.moveTo(cx - bodyW, h);
    ctx.lineTo(cx, shoulderY);
    ctx.lineTo(cx + bodyW, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Chest unit with status lights and a per-card emblem.
  const chestY = shoulderY + headR * 0.5;
  ctx.fillStyle = withAlpha(pal.deep, 0.78);
  ctx.beginPath();
  ctx.roundRect(cx - headR * 0.78, chestY, headR * 1.56, headR * 0.86, headR * 0.16);
  ctx.fill();
  ctx.strokeStyle = withAlpha(pal.accent, 0.85);
  ctx.lineWidth = headR * 0.06;
  ctx.stroke();
  drawEmblem(ctx, card, cx, chestY + headR * 0.43, headR * 0.3, pal);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === (card.number % 3) ? withAlpha(pal.accent, 0.95) : withAlpha(pal.rim, 0.45);
    ctx.beginPath();
    ctx.arc(cx + headR * (0.45 + i * 0.16), chestY + headR * 0.2, headR * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pauldrons with rank marks (count tied to rarity).
  const rank = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret'].indexOf(card.rarity);
  for (const side of [-1, 1]) {
    ctx.fillStyle = pal.suitDark;
    ctx.beginPath();
    ctx.ellipse(cx + side * bodyW * 0.82, shoulderY + headR * 0.18, headR * 0.56, headR * 0.34, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha(pal.rim, 0.45);
    ctx.lineWidth = headR * 0.05;
    ctx.stroke();
    ctx.strokeStyle = withAlpha(pal.accent, 0.8);
    ctx.lineWidth = headR * 0.07;
    for (let i = 0; i < Math.min(3, Math.floor(rank / 2) + 1); i++) {
      ctx.beginPath();
      ctx.moveTo(cx + side * bodyW * 1.0, shoulderY + headR * (0.04 + i * 0.2));
      ctx.lineTo(cx + side * bodyW * 0.72, shoulderY + headR * (0.18 + i * 0.2));
      ctx.stroke();
    }
  }

  // Neck seal + life-support hoses.
  ctx.fillStyle = pal.suitDark;
  ctx.beginPath();
  ctx.roundRect(cx - headR * 0.52, headY + headR * 0.6, headR * 1.04, headR * 0.6, headR * 0.12);
  ctx.fill();
  if ((card.artSeed >> 5) % 2 === 0) {
    ctx.strokeStyle = withAlpha(pal.suitDark, 0.95);
    ctx.lineWidth = headR * 0.13;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * headR * 0.5, headY + headR * 0.78);
      ctx.quadraticCurveTo(cx + side * headR * 1.25, headY + headR * 1.2, cx + side * headR * 0.95, shoulderY + headR * 0.9);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------ helmet
  const helmetGrad = ctx.createLinearGradient(cx - headR, headY - headR, cx + headR * 0.8, headY + headR);
  helmetGrad.addColorStop(0, pal.rim);
  helmetGrad.addColorStop(0.3, pal.suit);
  helmetGrad.addColorStop(1, pal.suitDark);
  ctx.fillStyle = helmetGrad;
  ctx.beginPath();
  switch (archetype) {
    case 'angular':
      ctx.moveTo(cx - headR * 0.95, headY + headR * 0.75);
      ctx.lineTo(cx - headR * 1.0, headY - headR * 0.35);
      ctx.lineTo(cx - headR * 0.5, headY - headR * 1.12);
      ctx.lineTo(cx + headR * 0.5, headY - headR * 1.12);
      ctx.lineTo(cx + headR * 1.0, headY - headR * 0.35);
      ctx.lineTo(cx + headR * 0.95, headY + headR * 0.75);
      ctx.quadraticCurveTo(cx, headY + headR * 1.2, cx - headR * 0.95, headY + headR * 0.75);
      break;
    case 'crest':
      ctx.ellipse(cx, headY, headR * 0.98, headR * 1.14, 0, 0, Math.PI * 2);
      break;
    case 'hooded':
      ctx.moveTo(cx - headR * 1.15, headY + headR * 0.9);
      ctx.quadraticCurveTo(cx - headR * 1.3, headY - headR * 0.9, cx, headY - headR * 1.25);
      ctx.quadraticCurveTo(cx + headR * 1.3, headY - headR * 0.9, cx + headR * 1.15, headY + headR * 0.9);
      ctx.closePath();
      break;
    default:
      ctx.ellipse(cx, headY, headR * 1.0, headR * 1.15, 0, 0, Math.PI * 2);
      break;
  }
  ctx.fill();
  ctx.strokeStyle = withAlpha(pal.rim, 0.55);
  ctx.lineWidth = headR * 0.07;
  ctx.stroke();

  if (archetype === 'crest') {
    // Dorsal crest fin.
    ctx.fillStyle = pal.suitDark;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.1, headY - headR * 1.08);
    ctx.quadraticCurveTo(cx, headY - headR * 1.75, cx + headR * 0.28, headY - headR * 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = withAlpha(pal.accent, 0.8);
    ctx.lineWidth = headR * 0.05;
    ctx.stroke();
  }

  // -------------------------------------------------------------- visor
  ctx.save();
  const visorGrad = ctx.createLinearGradient(cx - headR * 0.8, headY - headR * 0.6, cx + headR * 0.75, headY + headR * 0.4);
  visorGrad.addColorStop(0, withAlpha(pal.visor, 0.95));
  visorGrad.addColorStop(0.5, withAlpha(pal.deep, 0.96));
  visorGrad.addColorStop(1, withAlpha(pal.accent, 0.75));
  ctx.fillStyle = visorGrad;
  ctx.beginPath();
  switch (archetype) {
    case 'tvisor': {
      const topW = headR * 0.78, topH = headR * 0.3;
      ctx.moveTo(cx - topW, headY - headR * 0.42);
      ctx.lineTo(cx + topW, headY - headR * 0.42);
      ctx.lineTo(cx + topW, headY - headR * 0.42 + topH);
      ctx.lineTo(cx + headR * 0.17, headY - headR * 0.42 + topH);
      ctx.lineTo(cx + headR * 0.17, headY + headR * 0.6);
      ctx.lineTo(cx - headR * 0.17, headY + headR * 0.6);
      ctx.lineTo(cx - headR * 0.17, headY - headR * 0.42 + topH);
      ctx.lineTo(cx - topW, headY - headR * 0.42 + topH);
      ctx.closePath();
      break;
    }
    case 'dual': {
      ctx.ellipse(cx - headR * 0.38, headY - headR * 0.05, headR * 0.32, headR * 0.26, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + headR * 0.38, headY - headR * 0.05, headR * 0.32, headR * 0.26, 0.2, 0, Math.PI * 2);
      break;
    }
    case 'angular': {
      ctx.moveTo(cx - headR * 0.78, headY - headR * 0.3);
      ctx.lineTo(cx + headR * 0.78, headY - headR * 0.3);
      ctx.lineTo(cx + headR * 0.6, headY + headR * 0.34);
      ctx.lineTo(cx - headR * 0.6, headY + headR * 0.34);
      ctx.closePath();
      break;
    }
    case 'hooded': {
      ctx.ellipse(cx, headY + headR * 0.02, headR * 0.72, headR * 0.44, 0, 0, Math.PI * 2);
      break;
    }
    default: {
      ctx.ellipse(cx, headY - headR * 0.05, headR * 0.76, headR * 0.56, 0, 0, Math.PI * 2);
      break;
    }
  }
  ctx.fill();
  ctx.clip();

  // Visor reflections: a planet horizon or streak, varied per card so no two match.
  const reflection = (card.artSeed >> 9) % 3;
  if (reflection === 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = headR * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.8, headY + headR * 0.26);
    ctx.lineTo(cx + headR * 0.1, headY - headR * 0.52);
    ctx.stroke();
  } else if (reflection === 1) {
    ctx.fillStyle = withAlpha(pal.rim, 0.22);
    ctx.beginPath();
    ctx.arc(cx - headR * 0.3, headY + headR * 0.45, headR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha(pal.rim, 0.3);
    ctx.lineWidth = headR * 0.035;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.9, headY + headR * 0.08);
    ctx.lineTo(cx + headR * 0.9, headY - headR * 0.04);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.85, headY + headR * 0.5);
    ctx.lineTo(cx - headR * 0.1, headY - headR * 0.6);
    ctx.lineTo(cx + headR * 0.12, headY - headR * 0.6);
    ctx.lineTo(cx - headR * 0.55, headY + headR * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = withAlpha(pal.rim, 0.5);
  ctx.lineWidth = headR * 0.03;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.7, headY - headR * 0.3 + i * headR * 0.2);
    ctx.lineTo(cx - headR * 0.45, headY - headR * 0.3 + i * headR * 0.2);
    ctx.stroke();
  }
  // Eyes / optics glow through the visor.
  if (card.motif === 'void') {
    ctx.fillStyle = withAlpha('#00ffd0', 0.95);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + side * headR * 0.26, headY - headR * 0.02, headR * 0.075, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (archetype !== 'tvisor') {
    ctx.fillStyle = withAlpha(pal.rim, 0.42);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * headR * 0.25, headY + headR * 0.02, headR * 0.1, headR * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Helmet hardware: lamp, antenna, vents - pattern varies per card.
  const hardware = (card.artSeed >> 7) % 3;
  ctx.strokeStyle = pal.suitDark;
  ctx.lineWidth = headR * 0.09;
  if (hardware === 0) {
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.8, headY - headR * 0.55);
    ctx.lineTo(cx + headR * 1.2, headY - headR * 1.2);
    ctx.stroke();
    ctx.fillStyle = withAlpha(pal.accent, 0.95);
    ctx.beginPath();
    ctx.arc(cx + headR * 1.2, headY - headR * 1.22, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (hardware === 1) {
    ctx.fillStyle = withAlpha(pal.rim, 0.9);
    ctx.beginPath();
    ctx.roundRect(cx - headR * 1.12, headY - headR * 0.3, headR * 0.2, headR * 0.6, headR * 0.06);
    ctx.fill();
    ctx.fillStyle = withAlpha(pal.accent, 0.8);
    ctx.beginPath();
    ctx.arc(cx - headR * 1.02, headY + headR * 0.42, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = withAlpha(pal.rim, 0.6);
    ctx.lineWidth = headR * 0.05;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + headR * (0.55 + i * 0.1), headY + headR * 0.55);
      ctx.lineTo(cx + headR * (0.75 + i * 0.1), headY + headR * 0.78);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------ role prop
  drawProp(ctx, card, rng, w, h, pal, cx, shoulderY, headR, headY);
  ctx.restore();
}

/** Small unique insignia stamped on the chest plate of every crew member. */
function drawEmblem(ctx: CanvasRenderingContext2D, card: CrewCard, x: number, y: number, r: number, pal: Palette): void {
  const kind = (card.artSeed + card.number) % 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = withAlpha(pal.rim, 0.9);
  ctx.fillStyle = withAlpha(pal.accent, 0.5);
  ctx.lineWidth = Math.max(1.2, r * 0.18);
  ctx.beginPath();
  if (kind === 0) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (kind === 1) {
    ctx.moveTo(0, -r);
    ctx.lineTo(r, r * 0.8);
    ctx.lineTo(-r, r * 0.8);
    ctx.closePath();
  } else if (kind === 2) {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (kind === 3) {
    ctx.moveTo(-r, -r * 0.5);
    ctx.lineTo(r, -r * 0.5);
    ctx.lineTo(0, r);
    ctx.closePath();
  } else {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawProp(
  ctx: CanvasRenderingContext2D, card: CrewCard, rng: RNG, w: number, h: number, pal: Palette,
  cx: number, shoulderY: number, headR: number, headY: number,
): void {
  ctx.save();
  switch (card.motif) {
    case 'miner': {
      ctx.fillStyle = pal.suitDark;
      ctx.beginPath();
      ctx.roundRect(cx + headR * 1.0, shoulderY - headR * 0.1, headR * 0.7, headR * 0.44, headR * 0.1);
      ctx.fill();
      ctx.strokeStyle = withAlpha('#ff8a3c', 0.9);
      ctx.lineWidth = headR * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx + headR * 1.7, shoulderY + headR * 0.1);
      ctx.lineTo(cx + headR * 2.6, shoulderY - headR * 0.5);
      ctx.stroke();
      ctx.fillStyle = withAlpha('#ffd166', 0.95);
      ctx.beginPath();
      ctx.arc(cx + headR * 2.6, shoulderY - headR * 0.5, headR * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'gunner': {
      ctx.save();
      ctx.translate(cx - headR * 0.1, shoulderY + headR * 0.75);
      ctx.rotate(-0.45);
      ctx.fillStyle = '#1b1f27';
      ctx.fillRect(-headR * 1.5, -headR * 0.14, headR * 3, headR * 0.28);
      ctx.fillStyle = pal.suitDark;
      ctx.fillRect(-headR * 0.3, -headR * 0.32, headR * 0.7, headR * 0.62);
      ctx.fillStyle = withAlpha(pal.accent, 0.9);
      ctx.fillRect(headR * 1.0, -headR * 0.08, headR * 0.5, headR * 0.16);
      ctx.restore();
      break;
    }
    case 'engineer': {
      ctx.strokeStyle = withAlpha(pal.rim, 0.65);
      ctx.lineWidth = headR * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - headR * 2.0, h);
      ctx.quadraticCurveTo(cx - headR * 0.6, shoulderY + headR * 1.0, cx + headR * 0.9, h * 0.96);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx + headR * 1.4, shoulderY + headR * 0.75);
      ctx.rotate(0.5);
      ctx.fillStyle = '#20252f';
      ctx.fillRect(-headR * 0.55, -headR * 0.15, headR * 1.1, headR * 0.3);
      ctx.fillStyle = withAlpha('#53ffe0', 0.95);
      ctx.fillRect(headR * 0.4, -headR * 0.09, headR * 0.34, headR * 0.18);
      ctx.restore();
      break;
    }
    case 'scientist': {
      const hx = cx + headR * 1.6, hy = shoulderY - headR * 0.05;
      ctx.strokeStyle = withAlpha(pal.accent, 0.9);
      ctx.lineWidth = headR * 0.07;
      ctx.beginPath();
      ctx.arc(hx, hy, headR * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = withAlpha(pal.accent, 0.28);
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.rim, 0.8);
      ctx.lineWidth = headR * 0.045;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, headR * 0.44, headR * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'commander': {
      ctx.fillStyle = withAlpha(pal.accent, 0.2);
      ctx.beginPath();
      ctx.moveTo(cx - headR * 1.6, h);
      ctx.quadraticCurveTo(cx - headR * 2.4, shoulderY + headR * 0.6, cx - headR * 1.1, shoulderY - headR * 0.1);
      ctx.lineTo(cx - headR * 0.6, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.rim, 0.8);
      ctx.lineWidth = headR * 0.06;
      ctx.stroke();
      break;
    }
    case 'collector': {
      ctx.fillStyle = pal.suitDark;
      ctx.beginPath();
      ctx.roundRect(cx + headR * 0.95, shoulderY + headR * 0.1, headR * 0.85, headR * 0.42, headR * 0.12);
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.accent, 0.9);
      ctx.lineWidth = headR * 0.08;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx + headR * 1.8, shoulderY + headR * 0.3, i * headR * 0.28, -0.9, 0.9);
        ctx.stroke();
      }
      break;
    }
    case 'pilot': {
      ctx.strokeStyle = pal.suitDark;
      ctx.lineWidth = headR * 0.24;
      ctx.beginPath();
      ctx.moveTo(cx + headR * 0.95, h);
      ctx.lineTo(cx + headR * 1.15, shoulderY + headR * 0.85);
      ctx.stroke();
      ctx.fillStyle = withAlpha('#ff3b6b', 0.92);
      ctx.beginPath();
      ctx.arc(cx + headR * 1.15, shoulderY + headR * 0.8, headR * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      for (let i = 0; i < 12; i++) {
        const a = rng.range(0, Math.PI * 2);
        const r = rng.range(headR * 1.3, headR * 3);
        const x = cx + Math.cos(a) * r, y = headY + Math.sin(a) * r * 0.85;
        ctx.fillStyle = withAlpha('#00ffd0', rng.range(0.25, 0.85));
        ctx.beginPath();
        ctx.ellipse(x, y, rng.range(2, 8), rng.range(2, 5), a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

/** Renders a complete card face (art + frame + type plate) at the requested size. */
export function renderCardFace(canvas: HTMLCanvasElement, card: CrewCard, width = 420, height = 588): void {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const pal = paletteFor(card.rarity);
  ctx.clearRect(0, 0, width, height);

  // Card body background.
  const bodyGrad = ctx.createLinearGradient(0, 0, 0, height);
  bodyGrad.addColorStop(0, '#0b1126');
  bodyGrad.addColorStop(1, '#060a18');
  ctx.fillStyle = bodyGrad;
  roundRectPath(ctx, 0, 0, width, height, 18);
  ctx.fill();

  // Art window.
  const pad = width * 0.045;
  const artH = height * 0.56;
  ctx.save();
  roundRectPath(ctx, pad, pad, width - pad * 2, artH, 14);
  ctx.clip();
  ctx.translate(pad, pad);
  paintCardArt(ctx, card, width - pad * 2, artH);
  ctx.restore();

  // Separator glow under the art.
  const sep = ctx.createLinearGradient(pad, artH + pad, width - pad, artH + pad);
  sep.addColorStop(0, withAlpha(pal.accent, 0));
  sep.addColorStop(0.5, withAlpha(pal.accent, 0.9));
  sep.addColorStop(1, withAlpha(pal.accent, 0));
  ctx.fillStyle = sep;
  ctx.fillRect(pad, artH + pad, width - pad * 2, Math.max(1.5, width * 0.005));

  // ------------------------------------------------------------ text block
  const left = pad * 1.6;
  const textWidth = width - pad * 3.2;
  let y = artH + pad * 2.5;

  // Name: shrink to fit, wrap to at most two lines.
  let nameSize = Math.round(width * 0.062);
  const name = card.name.toUpperCase();
  let lines: string[] = [];
  for (; nameSize > width * 0.034; nameSize -= 1) {
    ctx.font = `700 ${nameSize}px Orbitron, Arial, sans-serif`;
    lines = wrapLines(ctx, name, textWidth);
    if (lines.length <= 2) break;
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  for (const line of lines.slice(0, 2)) {
    ctx.fillText(line, left, y);
    y += nameSize * 1.1;
  }

  // Role + rarity pill on the same row.
  y += width * 0.012;
  ctx.font = `600 ${Math.round(width * 0.036)}px "Exo 2", Arial, sans-serif`;
  ctx.fillStyle = pal.accent;
  ctx.fillText(card.role.toUpperCase(), left, y);
  const pillLabel = card.rarity.toUpperCase();
  ctx.font = `700 ${Math.round(width * 0.028)}px Orbitron, Arial, sans-serif`;
  const pillW = ctx.measureText(pillLabel).width + width * 0.055;
  const pillH = width * 0.055;
  ctx.fillStyle = withAlpha(pal.accent, 0.16);
  roundRectPath(ctx, width - pad * 1.6 - pillW, y - pillH * 0.75, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha(pal.accent, 0.8);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = pal.rim;
  ctx.textAlign = 'center';
  ctx.fillText(pillLabel, width - pad * 1.6 - pillW / 2, y + pillH * 0.02);
  ctx.textAlign = 'left';

  // Description.
  y += width * 0.062;
  ctx.font = `400 ${Math.round(width * 0.033)}px "Exo 2", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(214,228,255,0.78)';
  const descLines = wrapLines(ctx, card.description, textWidth).slice(0, 3);
  for (const line of descLines) {
    ctx.fillText(line, left, y);
    y += width * 0.045;
  }

  // Bonus strip.
  const bonusY = height - pad * 3.4;
  ctx.fillStyle = withAlpha(pal.accent, 0.1);
  roundRectPath(ctx, left - width * 0.012, bonusY - width * 0.045, textWidth + width * 0.024, width * 0.062, 8);
  ctx.fill();
  ctx.fillStyle = pal.rim;
  ctx.font = `700 ${Math.round(width * 0.032)}px "Exo 2", Arial, sans-serif`;
  const bonusText = card.bonus2
    ? `${formatBonusShort(card.bonus)}   ·   ${formatBonusShort(card.bonus2)}`
    : formatBonusShort(card.bonus);
  ctx.fillText(bonusText, left, bonusY);

  // Footer: collection number.
  ctx.font = `700 ${Math.round(width * 0.03)}px Orbitron, Arial, sans-serif`;
  ctx.fillStyle = withAlpha(pal.accent, 0.95);
  ctx.fillText(`No. ${String(card.number).padStart(3, '0')} / 044`, left, height - pad * 1.4);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(190,206,236,0.55)';
  ctx.fillText('SPACE MINER', width - left, height - pad * 1.4);
  ctx.textAlign = 'left';

  // Frame.
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 3;
  roundRectPath(ctx, 1.5, 1.5, width - 3, height - 3, 18);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(pal.rim, 0.3);
  ctx.lineWidth = 1.2;
  roundRectPath(ctx, pad * 0.6, pad * 0.6, width - pad * 1.2, height - pad * 1.2, 14);
  ctx.stroke();
  // Corner accents.
  ctx.strokeStyle = withAlpha(pal.accent, 0.9);
  ctx.lineWidth = 2.5;
  const c = width * 0.07;
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
    const ox = sx > 0 ? pad * 0.6 : width - pad * 0.6;
    const oy = sy > 0 ? pad * 0.6 : height - pad * 0.6;
    ctx.beginPath();
    ctx.moveTo(ox + sx * c, oy);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox, oy + sy * c);
    ctx.stroke();
  }
}

function formatBonusShort(bonus: { key: string; value: number }): string {
  const labels: Record<string, string> = {
    miningMult: 'MINING', damageMult: 'DAMAGE', lootMult: 'LOOT', speedMult: 'SPEED',
    turnMult: 'TURN', energyRegenMult: 'ENERGY', magnetRangeMult: 'MAGNET', shieldMult: 'SHIELD',
    shieldRegenMult: 'SHIELD REG', armorMult: 'HULL', cargoMult: 'CARGO', creditMult: 'CREDITS',
    crystalMult: 'CRYSTALS', rareChance: 'RARE FIND', fireRateMult: 'FIRE RATE', repairMult: 'REPAIR',
    hazardResist: 'HAZARD RES',
  };
  const label = labels[bonus.key] ?? bonus.key.toUpperCase();
  if (bonus.key === 'rareChance' || bonus.key === 'hazardResist') return `+${Math.round(bonus.value * 100)}% ${label}`;
  if (bonus.value >= 2) return `x${bonus.value % 1 === 0 ? bonus.value : bonus.value.toFixed(1)} ${label}`;
  return `+${Math.round((bonus.value - 1) * 100)}% ${label}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
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
  return lines;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Achievement card art - uses the same painting pipeline with industrial motifs. */
export function paintAchievementArt(
  ctx: CanvasRenderingContext2D,
  motif: 'mining' | 'combat' | 'economy' | 'exploration' | 'engineering' | 'collection',
  rarity: Rarity,
  seed: number,
  w: number,
  h: number,
): void {
  const rng = new RNG(seed);
  const pal = paletteFor(rarity);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, pal.deep);
  g.addColorStop(1, pal.mid);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rng.range(0.1, 0.7)})`;
    ctx.beginPath();
    ctx.arc(rng.range(0, w), rng.range(0, h), rng.range(0.4, 1.6), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(w / 2, h / 2);
  const s = Math.min(w, h) * 0.3;
  ctx.strokeStyle = pal.accent;
  ctx.fillStyle = withAlpha(pal.accent, 0.22);
  ctx.lineWidth = Math.max(2, s * 0.09);
  switch (motif) {
    case 'mining': {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
        const r = s * (0.7 + Math.sin(a * 3 + seed) * 0.16);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ff8a3c';
      ctx.beginPath();
      ctx.moveTo(-s * 1.4, s * 1.1);
      ctx.lineTo(-s * 0.2, s * 0.15);
      ctx.stroke();
      break;
    }
    case 'combat': {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.75, s * 0.7);
      ctx.lineTo(0, s * 0.35);
      ctx.lineTo(-s * 0.75, s * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'economy': {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.rim;
      ctx.font = `700 ${Math.round(s * 0.9)}px Orbitron, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', 0, s * 0.04);
      break;
    }
    case 'exploration': {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(s * 0.22, 0);
      ctx.lineTo(0, s * 0.85);
      ctx.lineTo(-s * 0.22, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'engineering': {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r1 = s * 0.85, r2 = s * 0.6;
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a + 0.3) * r2, Math.sin(a + 0.3) * r2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    default: {
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.3 * i, s * 0.22 * i, 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();

  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  void clamp;
}
