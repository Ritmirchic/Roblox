/** The board: a baked night field, a lantern road, and the living things on it. */
import { Rng } from '../../core/rng';
import { TAU, clamp, clamp01, dist } from '../../core/math';
import { COLORS, FONT_BODY, FAMILY_COLORS, rgba } from '../../core/palette';
import { ENEMY_BY_ID } from '../data/enemies';
import { SIGIL_BY_ID } from '../data/sigils';
import { ELDER_BY_ID } from '../data/elders';
import { BOARD, HEARTH, PATH_CELLS, PATH_POINTS, PLOTS, SIDEBAR, TOP_BAR, VIEW, type Cell } from '../sim/map';
import type { Card, Enemy, Tower } from '../types';
import type { Run } from '../sim/engine';
import {
  drawCandlePost,
  drawEnemy,
  drawGlow,
  drawGlyph,
  drawLantern,
  drawStone,
  drawTower,
  drawTree,
  fillRoundRect,
  grain,
  roundRectPath,
  drawVignette,
  strokeRoundRect,
  type Ctx2D,
} from './art';
import type { FxSystem } from './fx';

export const BOARD_W = 1180;
export const BOARD_H = 900;

let boardSurface: HTMLCanvasElement | null | undefined;

const strokePath = (ctx: Ctx2D, offsetX = 0, offsetY = 0): void => {
  ctx.beginPath();
  const first = PATH_POINTS[0];
  if (!first) return;
  ctx.moveTo(first.x + offsetX, first.y + offsetY);
  for (let i = 1; i < PATH_POINTS.length; i++) {
    const p = PATH_POINTS[i];
    if (!p) continue;
    ctx.lineTo(p.x + offsetX, p.y + offsetY);
  }
};

const pathAngleAt = (index: number): number => {
  const a = PATH_POINTS[Math.max(0, index - 1)];
  const b = PATH_POINTS[Math.min(PATH_POINTS.length - 1, index + 1)];
  if (!a || !b) return 0;
  return Math.atan2(b.y - a.y, b.x - a.x);
};

/** Bake the static board once: grass, stones, cobbles, plots, scenery. */
export const getBoardSurface = (): HTMLCanvasElement | null => {
  if (boardSurface !== undefined) return boardSurface;
  let canvas: HTMLCanvasElement | null = null;
  try {
    if (typeof document === 'undefined') return null;
    canvas = document.createElement('canvas');
    canvas.width = BOARD_W;
    canvas.height = BOARD_H;
  } catch {
    boardSurface = null;
    return null;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    boardSurface = null;
    return null;
  }
  const rng = new Rng(0x5eed1a);

  // Base night field
  const bg = ctx.createLinearGradient(0, 0, 300, BOARD_H);
  bg.addColorStop(0, '#141a18');
  bg.addColorStop(0.5, '#111715');
  bg.addColorStop(1, '#0c110f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  // Warm hearth light and cool moonlight
  const warm = ctx.createRadialGradient(HEARTH.x, HEARTH.y, 20, HEARTH.x, HEARTH.y, 620);
  warm.addColorStop(0, 'rgba(243,179,92,0.24)');
  warm.addColorStop(0.45, 'rgba(190,120,60,0.09)');
  warm.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  const cool = ctx.createRadialGradient(220, 180, 30, 220, 180, 700);
  cool.addColorStop(0, 'rgba(96,146,186,0.16)');
  cool.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  // Distant mist bands
  for (let i = 0; i < 5; i++) {
    const y = 120 + i * 150;
    const band = ctx.createLinearGradient(0, y, 0, y + 80);
    band.addColorStop(0, 'rgba(70,90,96,0)');
    band.addColorStop(0.5, `rgba(70,90,96,${0.035 + i * 0.006})`);
    band.addColorStop(1, 'rgba(70,90,96,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y, BOARD_W, 80);
  }

  // Painterly tonal blooms keep the field from reading as flat noise
  for (let i = 0; i < 34; i++) {
    const x = rng.range(-40, BOARD_W + 40);
    const y = rng.range(TOP_BAR - 40, BOARD_H + 20);
    const r = rng.range(120, 320);
    const tone = rng.next();
    const color =
      tone > 0.66 ? '86,108,84' : tone > 0.36 ? '38,54,44' : tone > 0.16 ? '70,74,50' : '26,36,34';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${rng.range(0.05, 0.13)})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * rng.range(0.45, 0.8), rng.range(0, TAU), 0, TAU);
    ctx.fill();
  }

  // Grass texture
  for (let i = 0; i < 6800; i++) {
    const x = rng.range(-10, BOARD_W + 10);
    const y = rng.range(TOP_BAR - 60, BOARD_H);
    const len = rng.range(2, 7);
    const shadeIdx = rng.next();
    ctx.strokeStyle =
      shadeIdx > 0.82
        ? `rgba(122,148,116,${rng.range(0.14, 0.32)})`
        : shadeIdx > 0.5
          ? `rgba(64,88,68,${rng.range(0.2, 0.44)})`
          : `rgba(34,48,40,${rng.range(0.22, 0.55)})`;
    ctx.lineWidth = rng.range(0.6, 1.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.range(-2, 2), y - len);
    ctx.stroke();
  }

  // Moss patches
  for (let i = 0; i < 90; i++) {
    const x = rng.range(0, BOARD_W);
    const y = rng.range(TOP_BAR, BOARD_H);
    const r = rng.range(14, 62);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(54,84,56,${rng.range(0.08, 0.2)})`);
    g.addColorStop(1, 'rgba(40,66,44,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, rng.range(0, TAU), 0, TAU);
    ctx.fill();
  }

  // ── the road ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  strokePath(ctx, 0, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 96;
  ctx.stroke();
  strokePath(ctx);
  ctx.strokeStyle = '#2b2a21';
  ctx.lineWidth = 92;
  ctx.stroke();
  ctx.strokeStyle = '#494838';
  ctx.lineWidth = 78;
  ctx.stroke();
  ctx.strokeStyle = '#38372c';
  ctx.lineWidth = 66;
  ctx.stroke();
  ctx.restore();

  // Cobbles along the road
  const step = 21;
  let travelled = 0;
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const a = PATH_POINTS[i];
    const b = PATH_POINTS[i + 1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    for (let d = 0; d < length; d += step) {
      travelled += step;
      const t = d / length;
      const cx = a.x + dx * t + nx * rng.range(-18, 18);
      const cy = a.y + dy * t + ny * rng.range(-18, 18);
      const w = rng.range(6, 12);
      const h = rng.range(4, 8);
      const tone = rng.next();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + rng.range(-0.4, 0.4));
      ctx.fillStyle =
        tone > 0.72 ? '#5d5f4a' : tone > 0.4 ? '#4c4f3f' : tone > 0.18 ? '#3e4134' : '#33362b';
      ctx.beginPath();
      ctx.ellipse(0, 0, w, h, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(184,184,146,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -1, w * 0.8, h * 0.6, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Lantern light pooling along the road — the procession walks inside this glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const a = PATH_POINTS[i];
    const b = PATH_POINTS[i + 1];
    if (!a || !b) continue;
    const steps = Math.max(1, Math.round(dist(a.x, a.y, b.x, b.y) / 46));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const g = ctx.createRadialGradient(x, y, 4, x, y, 108);
      g.addColorStop(0, 'rgba(255,196,118,0.05)');
      g.addColorStop(0.5, 'rgba(230,160,90,0.022)');
      g.addColorStop(1, 'rgba(210,140,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 108, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  // Worn pale track down the middle of the road
  strokePath(ctx);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(196,178,132,0.055)';
  ctx.lineWidth = 34;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,20,16,0.12)';
  ctx.lineWidth = 60;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.stroke();
  ctx.restore();

  // Moss and grass creeping over the road edges
  for (let i = 0; i < 260; i++) {
    const seg = Math.floor(rng.range(0, PATH_POINTS.length - 1));
    const a = PATH_POINTS[seg];
    const b = PATH_POINTS[seg + 1];
    if (!a || !b) continue;
    const t = rng.next();
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const side = rng.chance(0.5) ? 1 : -1;
    const off = side * rng.range(30, 44);
    const x = a.x + (b.x - a.x) * t + Math.cos(angle + Math.PI / 2) * off;
    const y = a.y + (b.y - a.y) * t + Math.sin(angle + Math.PI / 2) * off;
    ctx.strokeStyle = `rgba(52,78,54,${rng.range(0.2, 0.5)})`;
    ctx.lineWidth = rng.range(0.8, 1.8);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 2, y);
      ctx.lineTo(x + rng.range(-3, 3) + k * 2, y - rng.range(3, 7));
      ctx.stroke();
    }
  }

  // Direction chevrons (worn into the stone)
  for (let i = 1; i < PATH_POINTS.length - 1; i++) {
    const p = PATH_POINTS[i];
    if (!p) continue;
    const angle = pathAngleAt(i);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(210,200,166,0.1)';
    ctx.lineWidth = 2.4;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(-6 + k * 14, -7);
      ctx.lineTo(2 + k * 14, 0);
      ctx.lineTo(-6 + k * 14, 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── build plots ─────────────────────────────────────────────────────────
  for (const plot of PLOTS) {
    ctx.save();
    ctx.translate(plot.x, plot.y);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(2, 8, 44, 35, 0, 0, TAU);
    ctx.fill();
    const moss = ctx.createRadialGradient(0, -4, 4, 0, 0, 42);
    moss.addColorStop(0, '#333d2d');
    moss.addColorStop(0.7, '#262e24');
    moss.addColorStop(1, '#1b221b');
    ctx.fillStyle = moss;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, TAU);
    ctx.fill();
    // faint brazier warmth waiting to be lit
    const ember = ctx.createRadialGradient(0, 2, 2, 0, 2, 30);
    ember.addColorStop(0, 'rgba(243,199,107,0.14)');
    ember.addColorStop(1, 'rgba(243,199,107,0)');
    ctx.fillStyle = ember;
    ctx.beginPath();
    ctx.arc(0, 2, 30, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#5b5c4b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 37, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(168,166,128,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -1, 32, 0, TAU);
    ctx.stroke();
    // rune ticks
    ctx.strokeStyle = 'rgba(214,196,140,0.38)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * TAU + Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -33);
      ctx.lineTo(0, -27);
      ctx.stroke();
      ctx.restore();
    }
    // rim stones
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.3;
      const sx = Math.cos(a) * 39;
      const sy = Math.sin(a) * 39;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? '#575943' : '#454736';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ── scenery, avoiding the road and the plots ──────────────────────────
  const safe = (x: number, y: number, margin = 52): boolean => {
    for (const p of PATH_POINTS) if (dist(x, y, p.x, p.y) < margin + 38) return false;
    for (const plot of PLOTS) if (dist(x, y, plot.x, plot.y) < margin + 18) return false;
    if (x < 24 || x > BOARD_W - 24 || y < TOP_BAR + 12 || y > BOARD_H - 12) return false;
    return true;
  };

  for (let i = 0; i < 1500; i++) {
    const x = rng.range(30, BOARD_W - 30);
    const y = rng.range(TOP_BAR + 20, BOARD_H - 20);
    if (!safe(x, y, 26)) continue;
    const kind = rng.next();
    if (kind > 0.75) {
      // mushroom cluster
      for (let k = 0; k < 3; k++) {
        const mx = x + rng.range(-9, 9);
        const my = y + rng.range(-5, 5);
        ctx.strokeStyle = '#d8d2b6';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, my - 4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(168,180,140,0.5)';
        ctx.beginPath();
        ctx.arc(mx, my - 5, 2.4, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (kind > 0.35) {
      drawStone(ctx, x, y, rng.range(0.35, 0.9), rng.next() > 0.7 ? 1 : 0);
    } else {
      ctx.strokeStyle = `rgba(58,82,58,${rng.range(0.2, 0.45)})`;
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 2, y);
        ctx.lineTo(x + k * 2 + rng.range(-2, 2), y - rng.range(4, 10));
        ctx.stroke();
      }
    }
  }

  // Trees at the edges
  const trees: [number, number, number][] = [
    [42, 190, 1.15],
    [176, 82, 0.95],
    [700, 88, 0.9],
    [1108, 168, 1.05],
    [1148, 620, 1.1],
    [846, 876, 0.95],
    [612, 852, 0.85],
    [238, 872, 1.0],
    [470, 92, 0.8],
    [1010, 96, 0.75],
  ];
  for (const [tx, ty, ts] of trees) {
    if (tx > SIDEBAR.x - 30) continue;
    drawTree(ctx, tx, ty, ts, 0, tx);
  }

  // Stones & candle posts along the road
  const candles: [number, number, number][] = [
    [320, 352, 1],
    [432, 592, 0.9],
    [716, 590, 1],
    [930, 340, 1.05],
    [1008, 690, 0.9],
    [64, 440, 0.85],
    [560, 260, 0.8],
  ];
  for (const [cx, cy, cs] of candles) {
    // baked post (flame animated later)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(cs, cs);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2b251f';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -24);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(243,199,107,0.22)';
    ctx.lineWidth = 1.4;
    roundRectPath(ctx, -7, -38, 14, 15, 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(243,199,107,0.07)';
    roundRectPath(ctx, -7, -38, 14, 15, 4);
    ctx.fill();
    ctx.restore();
  }

  // warm pools under the road candles
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, cs] of candles) {
    const g = ctx.createRadialGradient(cx, cy - 30, 2, cx, cy - 30, 110 * cs);
    g.addColorStop(0, 'rgba(255,206,140,0.16)');
    g.addColorStop(0.45, 'rgba(255,170,90,0.05)');
    g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 110 * cs, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // ── the gate the procession comes through ───────────────────────────────
  const gateY = (PATH_CELLS[0] as Cell).row * BOARD.cell + BOARD.oy + BOARD.cell / 2;
  ctx.save();
  ctx.translate(0, gateY);
  // shadowed threshold
  const doorG = ctx.createLinearGradient(0, 0, 120, 0);
  doorG.addColorStop(0, 'rgba(4,6,8,0.92)');
  doorG.addColorStop(1, 'rgba(4,6,8,0)');
  ctx.fillStyle = doorG;
  ctx.fillRect(0, -46, 130, 92);
  // pillars
  for (const px of [16, 84]) {
    const pg = ctx.createLinearGradient(px - 11, 0, px + 11, 0);
    pg.addColorStop(0, '#20241f');
    pg.addColorStop(0.45, '#454a3c');
    pg.addColorStop(1, '#1b1f1a');
    ctx.fillStyle = pg;
    ctx.fillRect(px - 11, -44, 22, 88);
    ctx.fillStyle = '#565b48';
    ctx.fillRect(px - 14, -50, 28, 9);
    ctx.fillRect(px - 14, 40, 28, 9);
    ctx.strokeStyle = 'rgba(12,14,12,0.6)';
    ctx.lineWidth = 1;
    for (let k = -30; k <= 30; k += 15) {
      ctx.beginPath();
      ctx.moveTo(px - 10, k);
      ctx.lineTo(px + 10, k + 2);
      ctx.stroke();
    }
  }
  // lintel
  ctx.fillStyle = '#3d4136';
  ctx.fillRect(2, -60, 96, 12);
  ctx.fillStyle = '#4e5344';
  ctx.fillRect(4, -58, 92, 4);
  // iron portcullis (half raised)
  ctx.strokeStyle = 'rgba(28,26,22,0.85)';
  ctx.lineWidth = 2.6;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(34 + k * 11, -48);
    ctx.lineTo(34 + k * 11, -6 + k * 3);
    ctx.stroke();
  }
  // warning lanterns on the pillars
  for (const px of [16, 84]) {
    drawGlow(ctx, px, -62, 26, '#ff9d5c', 0.4);
    ctx.fillStyle = 'rgba(255,170,110,0.85)';
    ctx.beginPath();
    ctx.arc(px, -62, 3.4, 0, TAU);
    ctx.fill();
  }
  // faded ward chalk on the threshold
  ctx.strokeStyle = 'rgba(230,214,170,0.14)';
  ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(50, 0, 16 + k * 11, -0.9, 0.9);
    ctx.stroke();
  }
  ctx.restore();

  // hearth platform
  ctx.save();
  ctx.translate(HEARTH.x, HEARTH.y);
  const ring = ctx.createRadialGradient(0, 0, 10, 0, 0, 90);
  ring.addColorStop(0, 'rgba(243,199,107,0.15)');
  ring.addColorStop(1, 'rgba(243,199,107,0)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,106,86,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,68,54,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.save();
    ctx.translate(Math.cos(a) * 56, Math.sin(a) * 56);
    ctx.rotate(a);
    ctx.fillStyle = i % 2 ? '#3c3d33' : '#2f3029';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // ── border frame ───────────────────────────────────────────────────────
  const frame = ctx.createLinearGradient(0, 0, 0, BOARD_H);
  frame.addColorStop(0, 'rgba(0,0,0,0.5)');
  frame.addColorStop(0.15, 'rgba(0,0,0,0)');
  frame.addColorStop(0.85, 'rgba(0,0,0,0)');
  frame.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  drawVignette(ctx, BOARD_W, BOARD_H, 0.4);
  ctx.strokeStyle = 'rgba(243,199,107,0.14)';
  ctx.lineWidth = 1.4;
  strokeRoundRect(ctx, 8, TOP_BAR + 8, BOARD_W - 16, BOARD_H - TOP_BAR - 16, 18, 'rgba(243,199,107,0.14)', 1.4);
  for (const [cx, cy] of [
    [18, TOP_BAR + 18],
    [BOARD_W - 18, TOP_BAR + 18],
    [18, BOARD_H - 18],
    [BOARD_W - 18, BOARD_H - 18],
  ]) {
    ctx.fillStyle = 'rgba(243,199,107,0.22)';
    ctx.beginPath();
    ctx.arc(cx as number, cy as number, 3.4, 0, TAU);
    ctx.fill();
  }
  grain(ctx, 0.5);

  boardSurface = canvas;
  return canvas;
};

export interface WorldView {
  run: Run;
  fx: FxSystem;
  time: number;
  hoverPlot: number | null;
  selectedTowerUid: number | null;
  fuseSourceUid: number | null;
  fuseCandidates: number[];
  placingCard: Card | null;
  hoverTowerUid: number | null;
  emptyPlotPulse?: boolean;
}

const towerRange = (tower: Tower): number => {
  const def = tower.elder ? ELDER_BY_ID[tower.sigilId] : SIGIL_BY_ID[tower.sigilId];
  return tower.mods.range || def?.range || 0;
};

const drawRangePreview = (ctx: Ctx2D, x: number, y: number, radius: number, color: string, time: number): void => {
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.5);
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = -time * 18;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  const fill = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
  fill.addColorStop(0, rgba(color, 0.09));
  fill.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
};

export const renderWorld = (ctx: Ctx2D, view: WorldView): void => {
  const { run, fx, time } = view;
  const board = getBoardSurface();
  if (board) ctx.drawImage(board, 0, 0);

  // Ambient floating motes
  const moteCount = 14;
  for (let i = 0; i < moteCount; i++) {
    const t = (time * 0.06 + i / moteCount) % 1;
    const x = ((i * 137.5 + Math.sin(time * 0.3 + i) * 40) % 1100) + 40;
    const y = BOARD_H - t * (BOARD_H - TOP_BAR - 40);
    drawGlow(ctx, x, y, 8, i % 3 === 0 ? COLORS.gold : COLORS.frost, 0.14 * (1 - t));
  }

  // Empty plot affordance
  if (run.phase === 'prep' || run.phase === 'wave') {
    for (const plot of PLOTS) {
      const occupant = run.towers.find((t) => t.plot === plot.index);
      if (occupant) continue;
      const pulse = 0.35 + Math.sin(time * 1.6 + plot.index) * 0.12;
      ctx.save();
      ctx.strokeStyle = rgba(COLORS.gold, view.placingCard ? pulse * 0.6 : pulse * 0.22);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 9]);
      ctx.beginPath();
      ctx.arc(plot.x, plot.y, 38 + Math.sin(time * 1.6 + plot.index) * 1.6, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Selected / hovered tower ranges
  const selected = run.towers.find((t) => t.uid === view.selectedTowerUid);
  if (selected) {
    drawRangePreview(ctx, selected.x, selected.y, towerRange(selected), FAMILY_COLORS[selected.family].base, time);
  }
  const hoverTower = run.towers.find((t) => t.uid === view.hoverTowerUid);
  if (hoverTower && hoverTower.uid !== view.selectedTowerUid) {
    drawRangePreview(ctx, hoverTower.x, hoverTower.y, towerRange(hoverTower), FAMILY_COLORS[hoverTower.family].base, time);
  }

  // Placement preview
  if (view.placingCard && view.placingCard.kind === 'sigil' && view.hoverPlot !== null) {
    const plot = PLOTS[view.hoverPlot];
    const def = SIGIL_BY_ID[view.placingCard.id];
    const occupied = run.towers.some((t) => t.plot === view.hoverPlot);
    if (plot && def && !occupied) {
      const isAoe = def.attack === 'pulse' || def.attack === 'field';
      const radius = isAoe ? (def.radius ?? 100) : def.range;
      drawRangePreview(ctx, plot.x, plot.y, radius, FAMILY_COLORS[def.family].base, time);
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(time * 6) * 0.2;
      drawGlow(ctx, plot.x, plot.y, 60, FAMILY_COLORS[def.family].base, 0.5);
      ctx.restore();
    }
  }

  // Fusion links
  const fuseSource = run.towers.find((t) => t.uid === view.fuseSourceUid);
  if (fuseSource) {
    for (const uid of view.fuseCandidates) {
      const candidate = run.towers.find((t) => t.uid === uid);
      if (!candidate) continue;
      ctx.save();
      ctx.strokeStyle = rgba(COLORS.volt, 0.6 + Math.sin(time * 5) * 0.2);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = time * 30;
      ctx.beginPath();
      ctx.moveTo(fuseSource.x, fuseSource.y);
      ctx.lineTo(candidate.x, candidate.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Hearth (behind entities so wisps fly over it)
  const hearthPulse = 0.92 + Math.sin(time * 2.3) * 0.05;
  const lifeRatio = clamp01(run.hearth / Math.max(1, run.hearthMax));
  const hearthColor = lifeRatio > 0.55 ? COLORS.gold : lifeRatio > 0.25 ? '#ffb066' : '#ff6a52';
  ctx.save();
  ctx.translate(HEARTH.x, HEARTH.y);
  // shrine arch
  ctx.strokeStyle = 'rgba(58,56,46,0.9)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 6, 44, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96,92,74,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 6, 40, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.restore();
  drawLantern(ctx, HEARTH.x, HEARTH.y - 6, {
    scale: 1.15,
    color: hearthColor,
    time,
    life: lifeRatio,
    glow: 1,
  });
  // warding circle on the ground
  ctx.save();
  ctx.strokeStyle = rgba(hearthColor, 0.3 + Math.sin(time * 2) * 0.08);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(HEARTH.x, HEARTH.y + 40, 64, 20, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();

  // draw entities sorted by depth
  type Drawable = { y: number; draw: () => void };
  const drawables: Drawable[] = [];

  for (const tower of run.towers) {
    const def = tower.elder ? ELDER_BY_ID[tower.sigilId] : SIGIL_BY_ID[tower.sigilId];
    const glyph = def?.family ?? tower.family;
    drawables.push({
      y: tower.y + 26,
      draw: () =>
        drawTower(ctx, tower, glyph, {
          time,
          selected: tower.uid === view.selectedTowerUid,
          hovered: tower.uid === view.hoverTowerUid,
          fuseReady: view.fuseCandidates.includes(tower.uid),
        }),
    });
  }

  for (const enemy of run.enemies) {
    const def = ENEMY_BY_ID[enemy.typeId];
    drawables.push({
      y: enemy.y + enemy.size * 0.6,
      draw: () => {
        if (enemy.boss) {
          drawGlow(ctx, enemy.x, enemy.y, enemy.size * 3.2, '#ff9a5c', 0.22 + Math.sin(time * 2) * 0.05);
        }
        drawEnemy(ctx, enemy, def?.shape ?? 'wisp', time);
      },
    });
  }

  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // projectiles
  for (const p of run.projectiles) {
    const colors = FAMILY_COLORS[p.family];
    drawGlow(ctx, p.x, p.y, 26, colors.base, 0.5);
    ctx.save();
    ctx.strokeStyle = rgba(colors.bright, 0.55);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
    ctx.stroke();
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(colors.base, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // beams
  for (const beam of run.beams) {
    const colors = FAMILY_COLORS[beam.family];
    const t = clamp01(beam.life / beam.maxLife);
    ctx.save();
    ctx.strokeStyle = rgba(colors.base, 0.25 * t);
    ctx.lineWidth = 10 * t + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.strokeStyle = rgba(colors.bright, 0.9 * t);
    ctx.lineWidth = 2.4 * t + 0.6;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.restore();
  }

  fx.render(ctx);

  // Damage vignette at low hearth
  if (lifeRatio < 0.35) {
    const urgency = (0.35 - lifeRatio) / 0.35;
    const g = ctx.createRadialGradient(BOARD_W / 2, BOARD_H / 2, 260, BOARD_W / 2, BOARD_H / 2, 620);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(160,20,20,${0.12 + urgency * 0.2 + Math.sin(time * 4) * 0.03})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  }
};

/** Small helper for UI cards that need the sigil glyph kind. */
export const familyGlyphFor = (sigilId: string): string =>
  SIGIL_BY_ID[sigilId]?.family ?? ELDER_BY_ID[sigilId]?.family ?? 'ember';

/** Ambient fireflies for menus. */
export const renderAmbient = (ctx: Ctx2D, time: number, w: number, h: number, count = 26): void => {
  for (let i = 0; i < count; i++) {
    const seed = i * 97.13;
    const x = ((seed * 13.7 + time * (6 + (i % 5) * 2)) % (w + 120)) - 60;
    const y = h * (0.25 + ((i * 0.137) % 0.7)) + Math.sin(time * 0.5 + seed) * 26;
    const alpha = 0.16 + Math.sin(time * 1.6 + i) * 0.1;
    drawGlow(ctx, x, y, 12 + (i % 3) * 4, i % 4 === 0 ? COLORS.frost : COLORS.gold, Math.max(0.04, alpha));
  }
};

export const worldTop = TOP_BAR;
export const boardWidth = BOARD.cols * BOARD.cell;
export const boardHeight = BOARD.rows * BOARD.cell;
export const boardCell = BOARD.cell;
export const sidebarX = SIDEBAR.x;
export const viewHeight = VIEW.height;
export const fontUi = FONT_BODY;

/** Unused import guard for tree/candle helpers used above in other builds. */
export const decorHelpers = { drawCandlePost, fillRoundRect, drawGlyph, drawStone, drawTree };
