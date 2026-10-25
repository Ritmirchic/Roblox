/** Menu, Emberworks, Codex, Ledger, Settings and Results screens. */
import { COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO, FAMILY_COLORS, RARITY_COLORS, rgba, shade } from '../core/palette';
import { TAU, clamp, clamp01, formatNumber, formatTime } from '../core/math';
import { ACHIEVEMENTS } from '../game/data/achievements';
import { ELDERS } from '../game/data/elders';
import { ENEMIES, ENEMY_BY_ID } from '../game/data/enemies';
import { FAMILIES, FAMILY_BY_ID } from '../game/data/families';
import { META_BY_ID, META_NODES, computeMetaBuffs, nodeCost, nodeRank } from '../game/data/meta';
import { RELICS } from '../game/data/relics';
import { RUNES } from '../game/data/runes';
import { SIGILS } from '../game/data/sigils';
import { SIGNATURE_ABILITY_TEXT } from '../game/data/lore';
import {
  drawCandlePost,
  drawEmblem,
  drawEnemy,
  drawGlow,
  drawGlyph,
  drawLantern,
  drawParagraph,
  drawText,
  drawTree,
  drawVignette,
  fillRoundRect,
  grain,
  measureText,
  roundRectPath,
  strokeRoundRect,
  wrapText,
  type Ctx2D,
} from '../game/render/art';
import { makeStatuses } from '../game/sim/engine';
import type { Enemy, EnemyDef, RunSummary } from '../game/types';
import type { AppLike, RunMode, ScreenId } from './appTypes';
import { drawCard, inset, rect, type Rect } from './ui';

const W = 1600;
const H = 900;

// ── shared scenery ─────────────────────────────────────────────────────────

let backdrop: HTMLCanvasElement | null | undefined;

const getBackdrop = (): HTMLCanvasElement | null => {
  if (backdrop !== undefined) return backdrop;
  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
    grad.addColorStop(0, '#0a0f14');
    grad.addColorStop(0.45, '#0b0f12');
    grad.addColorStop(1, '#06080a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // moon
    ctx.save();
    const moon = ctx.createRadialGradient(1230, 200, 10, 1230, 200, 300);
    moon.addColorStop(0, 'rgba(170,205,220,0.22)');
    moon.addColorStop(1, 'rgba(170,205,220,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(206,226,226,0.5)';
    ctx.beginPath();
    ctx.arc(1230, 200, 54, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(1248, 186, 50, 0, TAU);
    ctx.fill();
    ctx.restore();

    // distant hills
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      ctx.moveTo(0, 620 + layer * 40);
      for (let x = 0; x <= W; x += 40) {
        const y =
          590 +
          layer * 46 +
          Math.sin(x * 0.0035 + layer * 1.7) * (46 - layer * 8) +
          Math.sin(x * 0.011 + layer) * 14;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = `rgba(${10 - layer * 2},${16 - layer * 2},${18 - layer * 2},${0.55 + layer * 0.18})`;
      ctx.fill();
    }

    // pine silhouettes
    const rngSeed = [0.13, 0.31, 0.57, 0.72, 0.88, 0.42, 0.66, 0.95, 0.22, 0.48];
    rngSeed.forEach((s, i) => {
      const x = 60 + s * (W - 120) + (i % 3) * 20;
      const baseY = 640 + (i % 4) * 48;
      const h = 190 + (i % 5) * 46;
      ctx.fillStyle = `rgba(8,13,13,${0.75 + (i % 3) * 0.06})`;
      for (let k = 0; k < 4; k++) {
        const w = (h * 0.28) * (1 - k * 0.18);
        const yy = baseY - (h / 4) * k;
        ctx.beginPath();
        ctx.moveTo(x - w, yy);
        ctx.lineTo(x, yy - h * 0.34);
        ctx.lineTo(x + w, yy);
        ctx.closePath();
        ctx.fill();
      }
    });

    // ground haze
    const haze = ctx.createLinearGradient(0, 620, 0, H);
    haze.addColorStop(0, 'rgba(14,20,22,0)');
    haze.addColorStop(0.55, 'rgba(10,14,15,0.65)');
    haze.addColorStop(1, 'rgba(6,8,9,0.95)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 560, W, H - 560);

    // stone path toward the lantern
    ctx.save();
    ctx.strokeStyle = 'rgba(44,46,40,0.6)';
    ctx.lineWidth = 92;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(760, H + 40);
    ctx.quadraticCurveTo(1080, 760, 1240, 590);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(29,31,27,0.9)';
    ctx.lineWidth = 78;
    ctx.stroke();
    ctx.restore();

    // foreground grass
    ctx.strokeStyle = 'rgba(24,34,28,0.8)';
    for (let i = 0; i < 1600; i++) {
      const x = Math.random() * W;
      const y = 700 + Math.random() * 200;
      ctx.lineWidth = 0.6 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y - 4 - Math.random() * 12);
      ctx.stroke();
    }
    drawVignette(ctx, W, H, 0.62);
    grain(ctx, 0.6);
    backdrop = canvas;
    return canvas;
  } catch {
    backdrop = null;
    return null;
  }
};

/** Screens whose layout fills the right side; the backdrop lantern would sit under it. */
const RESERVED_SRIGHT = new Set<ScreenId>(['codex', 'ledger', 'emberworks']);

const drawBackdrop = (ctx: Ctx2D, app: AppLike): void => {
  const bg = getBackdrop();
  if (bg) ctx.drawImage(bg, 0, 0);
  else {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(0, 0, W, H);
  }
  // fireflies
  for (let i = 0; i < 22; i++) {
    const seed = i * 71.3;
    const x = (seed * 11.7 + app.time * (7 + (i % 4) * 3)) % (W + 120) - 60;
    const y = 240 + ((i * 0.137) % 0.62) * H + Math.sin(app.time * 0.6 + seed) * 30;
    drawGlow(ctx, x, y, 16, i % 5 === 0 ? COLORS.frost : COLORS.gold, 0.12 + Math.sin(app.time * 1.4 + i) * 0.06);
  }
  // the lantern only lights screens that leave room for it
  if (!RESERVED_SRIGHT.has(app.screen)) return;
  drawLantern(ctx, 1210, 560, {
    scale: 2.5,
    color: COLORS.gold,
    time: app.time,
    life: 1,
    flare: Math.sin(app.time * 0.7) * 0.15,
  });
  // moths
  for (let i = 0; i < 4; i++) {
    const a = app.time * (0.5 + i * 0.14) + i * 2.1;
    const r = 110 + i * 22;
    const x = 1210 + Math.cos(a) * r;
    const y = 540 + Math.sin(a * 0.8) * r * 0.55;
    drawGlow(ctx, x, y, 10, '#f3e4bd', 0.28);
    ctx.fillStyle = 'rgba(240,228,196,0.7)';
    ctx.beginPath();
    ctx.ellipse(x, y, 3.4, 1.8, a, 0, TAU);
    ctx.fill();
  }
};

const drawTitle = (ctx: Ctx2D, text: string, x: number, y: number, size: number): number => {
  ctx.save();
  ctx.font = `bold ${size}px ${FONT_DISPLAY}`;
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${size * 0.06}px`;
  }
  const w = ctx.measureText(text).width;
  const grad = ctx.createLinearGradient(x, y - size, x, y + size * 0.2);
  grad.addColorStop(0, '#fff6d8');
  grad.addColorStop(0.42, COLORS.gold);
  grad.addColorStop(1, '#8a5a1f');
  ctx.shadowColor = 'rgba(243,199,107,0.35)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = grad;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,240,200,0.25)';
  ctx.strokeText(text, x, y);
  ctx.restore();
  return w;
};

const header = (
  ctx: Ctx2D,
  app: AppLike,
  title: string,
  subtitle: string,
  backTo: ScreenId | null = 'menu',
): void => {
  if (backTo) {
    if (app.ui.button(ctx, 'back', rect(36, 30, 118, 40), 'Back', { variant: 'ghost', icon: 'triangle', size: 13 })) {
      app.go(backTo);
    }
  }
  drawText(ctx, title.toUpperCase(), 176, 60, {
    size: 34,
    font: FONT_DISPLAY,
    color: COLORS.parchment,
    weight: 'bold',
    letterSpacing: 5,
    shadow: 'rgba(243,199,107,0.25)',
  });
  drawText(ctx, subtitle, 178, 88, {
    size: 13.5,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.7),
  });
  ctx.save();
  const line = ctx.createLinearGradient(40, 0, W - 40, 0);
  line.addColorStop(0, 'rgba(243,199,107,0.3)');
  line.addColorStop(0.4, 'rgba(243,199,107,0.12)');
  line.addColorStop(1, 'rgba(243,199,107,0)');
  ctx.fillStyle = line;
  ctx.fillRect(40, 116, W - 80, 1);
  ctx.restore();
};

const emberPill = (ctx: Ctx2D, app: AppLike, x: number, y: number): void => {
  const r = rect(x, y, 186, 46);
  app.ui.panel(ctx, r, { fill: 'rgba(16,14,10,0.9)', border: rgba(COLORS.gold, 0.3), radius: 23 });
  drawGlyph(ctx, 'embers', r.x + 26, r.y + 23, 11, COLORS.gold, 0.95);
  drawText(ctx, formatNumber(app.save.meta.embers), r.x + 46, r.y + 28, {
    size: 20,
    font: FONT_DISPLAY,
    color: COLORS.goldBright,
    weight: 'bold',
  });
  drawText(ctx, 'EMBERS', r.x + r.w - 18, r.y + 28, {
    size: 8.5,
    font: FONT_DISPLAY,
    color: rgba(COLORS.parchmentDim, 0.6),
    letterSpacing: 1.6,
    align: 'right',
  });
};

// ── Menu ───────────────────────────────────────────────────────────────────

export const renderMenu = (ctx: Ctx2D, app: AppLike): void => {
  drawBackdrop(ctx, app);
  const { ui, save } = app;

  // left veil for legibility
  const veil = ctx.createLinearGradient(0, 0, 900, 0);
  veil.addColorStop(0, 'rgba(5,7,9,0.88)');
  veil.addColorStop(0.55, 'rgba(5,7,9,0.55)');
  veil.addColorStop(1, 'rgba(5,7,9,0)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, 980, H);

  const titleY = 224;
  drawText(ctx, 'A CANDLELIT ROGUELITE OF SIGILS & GUESTS', 136, 128, {
    size: 12.5,
    font: FONT_DISPLAY,
    color: rgba(COLORS.gold, 0.75),
    letterSpacing: 4,
  });
  drawTitle(ctx, 'WICK & WANE', 130, titleY, 92);
  drawText(ctx, 'Hold the lantern road until dawn. Fuse sigils, feed the fire,', 138, 268, {
    size: 16,
    font: FONT_BODY,
    color: rgba(COLORS.parchment, 0.82),
  });
  drawText(ctx, 'and do not let the procession reach the wick.', 138, 292, {
    size: 16,
    font: FONT_BODY,
    color: rgba(COLORS.parchment, 0.82),
  });

  const x = 138;
  let y = 344;
  const btnW = 330;
  const btnH = 58;

  const unlocked = save.meta.act1Cleared;
  if (ui.button(ctx, 'menu-vigil', rect(x, y, btnW, btnH), 'Begin Vigil', {
    variant: 'primary',
    icon: 'lantern',
    size: 21,
    subtitle: '15 waves · the standard run',
    align: 'left',
  })) {
    app.startRun('vigil');
  }
  y += btnH + 12;

  const nightfallLocked = !unlocked;
  if (
    ui.button(ctx, 'menu-nightfall', rect(x, y, btnW, 52), 'Nightfall', {
      variant: 'secondary',
      icon: 'moon',
      size: 17,
      subtitle: nightfallLocked ? 'Clear the Vigil to unlock' : 'Harder procession · more embers',
      align: 'left',
      disabled: nightfallLocked,
      reason: 'Win a Vigil first to unlock Nightfall.',
    })
  ) {
    app.startRun('nightfall');
  }
  if (
    ui.button(ctx, 'menu-endless', rect(x + btnW + 14, y, 228, 52), 'Endless', {
      variant: 'secondary',
      icon: 'spiral',
      size: 16,
      subtitle: nightfallLocked ? 'Locked' : 'No dawn',
      disabled: nightfallLocked,
      reason: 'Win a Vigil first to unlock Endless.',
    })
  ) {
    app.startRun('endless');
  }
  y += 64;
  if (
    ui.button(ctx, 'menu-daily', rect(x, y, btnW, 52), 'Daily Vigil', {
      variant: 'ghost',
      icon: 'star',
      size: 16,
      subtitle: app.dailySeedLabel(),
      align: 'left',
    })
  ) {
    app.startRun('daily');
  }
  y += 74;

  const smallW = (btnW + 228 - 3 * 12) / 4;
  const smalls: { id: string; label: string; icon: string; action: () => void }[] = [
    { id: 'menu-ember', label: 'Emberworks', icon: 'embers', action: () => app.go('emberworks') },
    { id: 'menu-codex', label: 'Codex', icon: 'book', action: () => app.go('codex') },
    { id: 'menu-ledger', label: 'Ledger', icon: 'crown', action: () => app.go('ledger') },
    { id: 'menu-settings', label: 'Settings', icon: 'oil', action: () => app.go('settings') },
  ];
  smalls.forEach((s, i) => {
    const sr = rect(x + i * (smallW + 12), y, smallW, 74);
    ui.panel(ctx, sr, { fill: 'rgba(14,17,24,0.8)', border: rgba(COLORS.gold, 0.16), radius: 10 });
    drawGlyph(ctx, s.icon, sr.x + sr.w / 2, sr.y + 28, 13, COLORS.gold, 0.85);
    drawText(ctx, s.label, sr.x + sr.w / 2, sr.y + 56, {
      size: 12,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      align: 'center',
      letterSpacing: 0.6,
    });
    if (ui.button(ctx, s.id, sr, '', { variant: 'ghost', size: 10 })) s.action();
  });

  // Lantern-keeper's record
  const recordY = 676;
  ui.panel(ctx, rect(x, recordY, btnW + 242, 132), {
    fill: 'rgba(9,12,15,0.78)',
    border: rgba(COLORS.gold, 0.16),
    radius: 12,
    corners: true,
  });
  const stats: [string, string][] = [
    ['RUNS', String(save.stats.runs)],
    ['WINS', String(save.stats.wins)],
    ['BEST WAVE', String(save.stats.deepestWave)],
    ['EMBERS', formatNumber(save.meta.embers)],
  ];
  stats.forEach(([label, value], i) => {
    const sx = x + 30 + i * 140;
    drawText(ctx, label, sx, recordY + 40, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: rgba(COLORS.parchmentDim, 0.6),
      letterSpacing: 1.6,
    });
    drawText(ctx, value, sx, recordY + 76, {
      size: 30,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      weight: 'bold',
    });
  });
  const families = FAMILIES.filter((f) => save.meta.unlockedFamilies.includes(f.id));
  drawText(ctx, 'SIGIL FAMILIES', x + 30, recordY + 108, {
    size: 9.5,
    font: FONT_DISPLAY,
    color: rgba(COLORS.parchmentDim, 0.6),
    letterSpacing: 1.6,
  });
  families.forEach((f, i) => {
    const cx = x + 166 + i * 42;
    const unlocked = app.isFamilyUnlocked(f.id);
    drawGlow(ctx, cx, recordY + 104, 18, f.color, unlocked ? 0.55 : 0.16);
    drawGlyph(ctx, f.id, cx, recordY + 104, 9, unlocked ? f.bright : COLORS.stone, unlocked ? 0.95 : 0.5);
    if (!unlocked) {
      drawText(ctx, '·', cx, recordY + 124, { size: 10, color: rgba(COLORS.parchmentDim, 0.5), align: 'center' });
    }
  });

  // version + controls
  drawText(ctx, 'v1.0.0 · original code, art and audio', 42, H - 26, {
    size: 11,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.4),
  });
  drawText(ctx, 'SPACE begin wave  ·  ESC pause  ·  M mute  ·  1-6 pick card', W - 42, H - 26, {
    size: 11,
    font: FONT_MONO,
    color: rgba(COLORS.parchmentDim, 0.42),
    align: 'right',
  });

  // a soft first-run hint
  if (save.stats.runs === 0) {
    const hint = rect(940, 760, 520, 96);
    ui.panel(ctx, hint, { fill: 'rgba(12,14,18,0.72)', border: rgba(COLORS.frost, 0.2), radius: 10 });
    drawText(ctx, 'FIRST VIGIL', hint.x + 20, hint.y + 30, {
      size: 10,
      font: FONT_DISPLAY,
      color: COLORS.frost,
      letterSpacing: 2,
    });
    drawParagraph(
      ctx,
      'Draft sigils, set them on stone plots beside the road, then begin the wave. Two sigils of the same family fuse into something far worse for the procession.',
      hint.x + 20,
      hint.y + 52,
      hint.w - 40,
      12.5,
      17,
      { color: rgba(COLORS.parchment, 0.8) },
    );
  }
};

// ── Emberworks ─────────────────────────────────────────────────────────────

export const renderEmberworks = (ctx: Ctx2D, app: AppLike): void => {
  drawBackdrop(ctx, app);
  ctx.fillStyle = 'rgba(6,8,10,0.72)';
  ctx.fillRect(0, 0, W, H);
  header(ctx, app, 'Emberworks', 'Permanent work, paid for with what the lantern leaves behind.', 'menu');
  emberPill(ctx, app, W - 226, 30);
  const ui = app.ui;

  const cols = 4;
  const cellW = 356;
  const cellH = 152;
  const gapX = 18;
  const gapY = 14;
  const startX = (W - (cols * cellW + (cols - 1) * gapX)) / 2;
  const startY = 138;

  META_NODES.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const r = rect(startX + col * (cellW + gapX), startY + row * (cellH + gapY), cellW, cellH);
    const rank = nodeRank(app.save.meta, node.id);
    const maxed = rank >= node.maxRank;
    const cost = nodeCost(app.save.meta, node);
    const affordable = cost !== null && app.save.meta.embers >= cost;
    const owned = node.unlocksFamily ? app.isFamilyUnlocked(node.unlocksFamily) : rank > 0;

    const hovered = ui.isHovered(`meta-${node.id}`);
    ui.panel(ctx, r, {
      fill: owned ? 'rgba(20,24,20,0.94)' : 'rgba(14,17,24,0.94)',
      border: maxed ? rgba(COLORS.gold, 0.5) : affordable ? rgba(COLORS.gold, 0.3) : rgba(COLORS.stone, 0.35),
      radius: 12,
      glow: affordable && !maxed ? 'rgba(243,199,107,0.18)' : undefined,
    });
    // icon plinth
    const iconR = rect(r.x + 16, r.y + 16, 56, 56);
    fillRoundRect(ctx, iconR.x, iconR.y, iconR.w, iconR.h, 28, 'rgba(10,12,16,0.9)');
    strokeRoundRect(ctx, iconR.x + 0.5, iconR.y + 0.5, iconR.w - 1, iconR.h - 1, 28, rgba(COLORS.gold, 0.25), 1);
    drawGlyph(ctx, node.icon, iconR.x + 28, iconR.y + 28, 17, owned ? COLORS.goldBright : COLORS.stoneLight, 0.95);
    if (node.unlocksFamily) {
      const fam = FAMILY_BY_ID[node.unlocksFamily];
      drawGlow(ctx, iconR.x + 28, iconR.y + 28, 40, fam.color, 0.25);
    }

    drawText(ctx, node.name, r.x + 86, r.y + 35, {
      size: 16,
      font: FONT_DISPLAY,
      color: owned ? COLORS.parchment : rgba(COLORS.parchment, 0.85),
      weight: 'bold',
    });
    const descLines = wrapText(ctx, node.description, r.w - 104, 11.5);
    descLines.slice(0, 3).forEach((line, k) => {
      drawText(ctx, line, r.x + 86, r.y + 56 + k * 15, {
        size: 11.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.75),
      });
    });

    // rank pips
    if (!node.unlocksFamily) {
      for (let k = 0; k < node.maxRank; k++) {
        drawGlyph(ctx, 'diamond', r.x + 90 + k * 17, r.y + 94, 5, k < rank ? COLORS.gold : 'rgba(255,255,255,0.22)');
      }
      drawText(ctx, `RANK ${rank} / ${node.maxRank}`, r.x + 90 + node.maxRank * 17 + 6, r.y + 97, {
        size: 8.5,
        font: FONT_MONO,
        color: rgba(COLORS.parchmentDim, rank > 0 ? 0.6 : 0.38),
        letterSpacing: 1.1,
      });
    } else {
      drawText(ctx, owned ? 'FAMILY UNLOCKED' : 'FAMILY LOCKED', r.x + 88, r.y + 96, {
        size: 9,
        font: FONT_DISPLAY,
        color: owned ? COLORS.heal : rgba(COLORS.parchmentDim, 0.6),
        letterSpacing: 1.6,
      });
    }

    // buy button
    const buy = rect(r.x + r.w - 132, r.y + r.h - 52, 116, 38);
    if (maxed) {
      drawText(ctx, 'MASTERED', buy.x + buy.w / 2, buy.y + 24, {
        size: 11,
        font: FONT_DISPLAY,
        color: COLORS.gold,
        align: 'center',
        letterSpacing: 1.8,
      });
    } else {
      const label = cost !== null ? `${cost}` : '—';
      const clicked = app.ui.button(ctx, `buy-${node.id}`, buy, label, {
        variant: affordable ? 'primary' : 'secondary',
        icon: 'embers',
        size: 15,
        disabled: !affordable,
        reason: `Needs ${cost ?? 0} embers.`,
      });
      if (clicked) app.buyMetaNode(node.id);
    }

    if (hovered) {
      app.ui.tooltip({
        title: node.name,
        body: `${node.description}\nRank ${rank}/${node.maxRank}${node.unlocksFamily ? ' · adds sigils to every draft' : ''}`,
        x: app.ui.pointer.x,
        y: app.ui.pointer.y,
        accent: COLORS.gold,
      });
    }
  });

  drawText(ctx, 'Embers are earned from every run — even the ones that end badly.', W / 2, H - 34, {
    size: 12,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.5),
    align: 'center',
  });
};

// ── Codex ──────────────────────────────────────────────────────────────────

type CodexTab = 'sigils' | 'elders' | 'relics' | 'runes' | 'bestiary';

const codexState = {
  tab: 'sigils' as CodexTab,
  page: 0,
  selected: null as string | null,
};

interface CodexEntry {
  key: string;
  name: string;
  subtitle: string;
  accent: string;
  body: string;
  stats: [string, string][];
  flavor: string;
  draw: (ctx: Ctx2D, cx: number, cy: number, radius: number, time: number) => void;
}

const sigilEntries = (): CodexEntry[] =>
  SIGILS.map((def) => {
    const fam = FAMILY_BY_ID[def.family];
    const stats: [string, string][] = [];
    if (def.damage > 0) stats.push(['Damage', `${def.damage}`]);
    if (def.damage > 0) stats.push(['Interval', `${def.interval}s`]);
    if (def.range > 0) stats.push(['Range', `${Math.round(def.range * 1.08)}`]);
    if (def.radius) stats.push(['Radius', `${def.radius}`]);
    if (def.splash) stats.push(['Blast', `${def.splash}`]);
    if (def.chains) stats.push(['Chains', `${def.chains}`]);
    if (def.shots) stats.push(['Shots', `${def.shots}`]);
    if (def.status) stats.push(['Status', def.status.id]);
    stats.push(['Cost', `${def.cost} gold`]);
    return {
      key: `sigil:${def.id}`,
      name: def.name,
      subtitle: `${fam.name} · ${def.role}`,
      accent: fam.color,
      body: def.description,
      stats,
      flavor: def.flavor,
      draw: (c, cx, cy, radius, time) =>
        drawEmblem(c, def.family, cx, cy, radius, { time, tier: 3 }),
    };
  });

const elderEntries = (): CodexEntry[] =>
  ELDERS.map((def) => {
    const fam = FAMILY_BY_ID[def.family];
    const stats: [string, string][] = [['Damage', `${def.damage}`], ['Interval', `${def.interval}s`]];
    if (def.range > 0) stats.push(['Range', `${def.range}`]);
    if (def.radius) stats.push(['Radius', `${def.radius}`]);
    if (def.auraDamage) stats.push(['Adjacent buff', `+${Math.round(def.auraDamage * 100)}%`]);
    if (def.globalAuraDamage) stats.push(['Global buff', `+${Math.round(def.globalAuraDamage * 100)}%`]);
    stats.push(['Fusion', `${def.fuseCost} gold`]);
    return {
      key: `elder:${def.id}`,
      name: def.name,
      subtitle: `${fam.name} ELDER`,
      accent: COLORS.gold,
      body: def.description,
      stats,
      flavor: def.flavor,
      draw: (c, cx, cy, radius, time) =>
        drawEmblem(c, def.family, cx, cy, radius, { time, tier: 3, elder: true }),
    };
  });

const relicEntries = (): CodexEntry[] =>
  RELICS.map((def) => ({
    key: `relic:${def.id}`,
    name: def.name,
    subtitle: `${def.rarity.toUpperCase()} RELIC`,
    accent: RARITY_COLORS[def.rarity]?.base ?? COLORS.gold,
    body: def.description,
    stats: [['Rarity', def.rarity]],
    flavor: def.flavor,
    draw: (c, cx, cy, radius, time) => {
      drawGlow(c, cx, cy, radius * 1.6, COLORS.gold, 0.4);
      c.strokeStyle = rgba(COLORS.gold, 0.5);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(cx, cy, radius * 0.9, 0, TAU);
      c.stroke();
      drawGlyph(c, def.glyph, cx, cy, radius * 0.5, COLORS.goldBright, 0.95 + Math.sin(time) * 0.03);
    },
  }));

const runeEntries = (): CodexEntry[] =>
  RUNES.map((def) => ({
    key: `rune:${def.id}`,
    name: def.name,
    subtitle: `${def.rarity.toUpperCase()} RUNE`,
    accent: RARITY_COLORS[def.rarity]?.base ?? COLORS.parchment,
    body: def.description,
    stats: [['Rarity', def.rarity], ['Socket', 'sigil rune slot']],
    flavor: 'Runes are socketed into a placed sigil and can be moved by fusing.',
    draw: (c, cx, cy, radius, time) => {
      drawGlow(c, cx, cy, radius * 1.4, RARITY_COLORS[def.rarity]?.base ?? COLORS.gold, 0.35);
      c.strokeStyle = rgba(RARITY_COLORS[def.rarity]?.base ?? COLORS.gold, 0.65);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(cx, cy, radius * 0.92, 0, TAU);
      c.stroke();
      drawGlyph(c, def.glyph, cx, cy, radius * 0.48, COLORS.parchment, 0.95);
      c.save();
      c.rotate(time * 0.4);
      for (let i = 0; i < 6; i++) {
        c.rotate(TAU / 6);
        c.strokeStyle = rgba(COLORS.parchment, 0.3);
        c.beginPath();
        c.moveTo(radius * 0.78, 0);
        c.lineTo(radius * 0.92, 0);
        c.stroke();
      }
      c.restore();
    },
  }));

const enemyEntries = (): CodexEntry[] =>
  ENEMIES.map((def) => ({
    key: `enemy:${def.id}`,
    name: def.name,
    subtitle: `${def.kind.toUpperCase()}${def.boss ? ' · BOSS' : ''}`,
    accent: def.color,
    body: def.blurb,
    stats: [
      ['Health', `${def.hp}`],
      ['Speed', `${def.speed}`],
      ['Armour', `${def.armor}`],
      ['Gold', `${def.gold}`],
      ['Hearth', `-${def.leak}`],
    ],
    flavor: def.abilities?.map((a: { kind: string; power: number }) => SIGNATURE_ABILITY_TEXT[a.kind] ?? a.kind).join(' · ') ?? 'No special ability.',
    draw: (c, cx, cy, radius, time) => {
      const synthetic = makePortraitEnemy(def, cx, cy, radius, time);
      drawEnemy(c, synthetic, def.shape, time);
    },
  }));

const makePortraitEnemy = (def: EnemyDef, cx: number, cy: number, radius: number, time: number): Enemy => {
  const scale = radius / Math.max(8, def.size);
  const size = def.size * scale * (def.boss ? 0.62 : 0.9);
  return {
    uid: 9000,
    typeId: def.id,
    x: cx,
    y: cy + (def.kind === 'flier' ? 0 : size * 0.2),
    hp: def.hp,
    hpMax: def.hp,
    speed: def.speed,
    baseSpeed: def.speed,
    armor: def.armor,
    statuses: makeStatuses(),
    distAlong: 0,
    lane: def.kind === 'flier' ? 'air' : 'ground',
    size,
    boss: false,
    leak: def.leak,
    gold: def.gold,
    abilityTimer: 0,
    hitFlash: 0,
    dead: false,
    escaped: false,
    enraged: false,
    shielded: 0,
    shieldTime: 0,
    seed: Math.floor(time * 3) % 1000,
    age: time,
  };
};

const entriesFor = (tab: CodexTab): CodexEntry[] => {
  switch (tab) {
    case 'sigils':
      return sigilEntries();
    case 'elders':
      return elderEntries();
    case 'relics':
      return relicEntries();
    case 'runes':
      return runeEntries();
    case 'bestiary':
      return enemyEntries();
  }
};

export const renderCodex = (ctx: Ctx2D, app: AppLike): void => {
  drawBackdrop(ctx, app);
  ctx.fillStyle = 'rgba(6,8,10,0.78)';
  ctx.fillRect(0, 0, W, H);
  header(ctx, app, 'Codex', 'Everything the lantern has shown you so far.', 'menu');

  const discovered = (key: string): boolean => (app.save.codex[key] ?? 0) > 0;
  const tabs: { id: CodexTab; label: string; icon: string }[] = [
    { id: 'sigils', label: 'Sigils', icon: 'rune' },
    { id: 'elders', label: 'Elders', icon: 'crown' },
    { id: 'relics', label: 'Relics', icon: 'lantern' },
    { id: 'runes', label: 'Runes', icon: 'diamond' },
    { id: 'bestiary', label: 'Bestiary', icon: 'skull' },
  ];
  tabs.forEach((tab, i) => {
    const r = rect(46 + i * 150, 124, 140, 38);
    if (app.ui.button(ctx, `codex-tab-${tab.id}`, r, tab.label, {
      variant: 'tab',
      icon: tab.icon,
      size: 13,
      active: codexState.tab === tab.id,
    })) {
      codexState.tab = tab.id;
      codexState.page = 0;
      codexState.selected = null;
    }
  });

  const entries = entriesFor(codexState.tab);
  const perPage = 8;
  const pages = Math.max(1, Math.ceil(entries.length / perPage));
  codexState.page = clamp(codexState.page, 0, pages - 1);
  const pageEntries = entries.slice(codexState.page * perPage, codexState.page * perPage + perPage);
  const seenCount = entries.filter((e) => discovered(e.key)).length;
  drawText(ctx, `${seenCount} / ${entries.length} discovered`, W - 48, 148, {
    size: 12,
    font: FONT_MONO,
    color: rgba(COLORS.parchmentDim, 0.65),
    align: 'right',
  });

  const gridX = 46;
  const gridY = 182;
  const tileW = 256;
  const tileH = 198;
  const gapX = 14;
  const gapY = 14;

  pageEntries.forEach((entry, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const r = rect(gridX + col * (tileW + gapX), gridY + row * (tileH + gapY), tileW, tileH);
    const known = discovered(entry.key);
    const selected = codexState.selected === entry.key;
    const hovered = app.ui.isHovered(`codex-${entry.key}`);
    app.ui.panel(ctx, r, {
      fill: known ? 'rgba(15,19,26,0.94)' : 'rgba(11,13,17,0.94)',
      border: selected ? rgba(COLORS.goldBright, 0.8) : hovered ? rgba(entry.accent, 0.5) : rgba(COLORS.stone, 0.3),
      radius: 10,
      glow: selected ? rgba(COLORS.gold, 0.2) : undefined,
    });
    ctx.save();
    roundRectPath(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 9);
    ctx.clip();
    if (known) {
      entry.draw(ctx, r.x + r.w / 2, r.y + 74, 40, app.time + i);
    } else {
      drawGlow(ctx, r.x + r.w / 2, r.y + 74, 46, COLORS.stone, 0.18);
      drawGlyph(ctx, 'lock', r.x + r.w / 2, r.y + 74, 16, rgba(COLORS.stoneLight, 0.55), 0.9);
    }
    ctx.restore();
    drawText(ctx, known ? entry.name : 'Undiscovered', r.x + r.w / 2, r.y + 136, {
      size: 14.5,
      font: FONT_DISPLAY,
      color: known ? COLORS.parchment : rgba(COLORS.parchmentDim, 0.5),
      align: 'center',
      weight: 'bold',
      maxWidth: r.w - 20,
    });
    drawText(ctx, known ? entry.subtitle : 'Draft or defeat it to reveal', r.x + r.w / 2, r.y + 158, {
      size: 10,
      font: FONT_BODY,
      color: known ? rgba(entry.accent, 0.85) : rgba(COLORS.parchmentDim, 0.4),
      align: 'center',
      maxWidth: r.w - 24,
    });
    if (app.ui.button(ctx, `codex-${entry.key}`, r, '', { variant: 'ghost' })) {
      codexState.selected = entry.key;
      app.ui.sfx('uiClick');
    }
  });

  // pagination
  if (pages > 1) {
    const py = gridY + 2 * (tileH + gapY) + 6;
    if (app.ui.button(ctx, 'codex-prev', rect(gridX, py, 88, 34), 'Prev', { variant: 'ghost', size: 12, disabled: codexState.page === 0 })) {
      codexState.page--;
      codexState.selected = null;
    }
    drawText(ctx, `${codexState.page + 1} / ${pages}`, gridX + 110, py + 22, {
      size: 12,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
    });
    if (app.ui.button(ctx, 'codex-next', rect(gridX + 176, py, 88, 34), 'Next', { variant: 'ghost', size: 12, disabled: codexState.page >= pages - 1 })) {
      codexState.page++;
      codexState.selected = null;
    }
  }

  // detail panel
  const detail = rect(1120, 182, 434, 676);
  app.ui.panel(ctx, detail, { fill: 'rgba(11,14,19,0.94)', border: rgba(COLORS.gold, 0.24), radius: 14, corners: true });
  const selected = entries.find((e) => e.key === codexState.selected);
  if (!selected) {
    drawText(ctx, 'Choose an entry', detail.x + detail.w / 2, detail.y + 70, {
      size: 16,
      font: FONT_DISPLAY,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'center',
    });
    drawText(ctx, 'The codex remembers what you draft,', detail.x + detail.w / 2, detail.y + 102, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.4),
      align: 'center',
    });
    drawText(ctx, 'place, fuse and defeat.', detail.x + detail.w / 2, detail.y + 120, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.4),
      align: 'center',
    });
    return;
  }
  const known = discovered(selected.key);
  const artR = rect(detail.x + 17, detail.y + 17, detail.w - 34, 210);
  ctx.save();
  roundRectPath(ctx, artR.x, artR.y, artR.w, artR.h, 10);
  ctx.clip();
  const artGrad = ctx.createLinearGradient(artR.x, artR.y, artR.x, artR.y + artR.h);
  artGrad.addColorStop(0, rgba(selected.accent, 0.2));
  artGrad.addColorStop(1, 'rgba(8,10,14,0.6)');
  ctx.fillStyle = artGrad;
  ctx.fillRect(artR.x, artR.y, artR.w, artR.h);
  if (known) {
    selected.draw(ctx, artR.x + artR.w / 2, artR.y + artR.h / 2, 66, app.time);
  } else {
    drawGlyph(ctx, 'lock', artR.x + artR.w / 2, artR.y + artR.h / 2, 26, rgba(COLORS.stoneLight, 0.5));
  }
  ctx.restore();
  drawText(ctx, known ? selected.name : 'Undiscovered', detail.x + 24, detail.y + 272, {
    size: 24,
    font: FONT_DISPLAY,
    color: known ? COLORS.parchment : rgba(COLORS.parchmentDim, 0.5),
    weight: 'bold',
  });
  drawText(ctx, known ? selected.subtitle : '???', detail.x + 24, detail.y + 296, {
    size: 11,
    font: FONT_DISPLAY,
    color: rgba(selected.accent, 0.85),
    letterSpacing: 1.6,
  });
  let bodyY = detail.y + 330;
  if (known) {
    bodyY += drawParagraph(ctx, selected.body, detail.x + 24, bodyY, detail.w - 48, 13.5, 19, {
      color: rgba(COLORS.parchment, 0.85),
    });
    bodyY += 16;
    const statCols = 2;
    selected.stats.forEach(([label, value], i) => {
      const col = i % statCols;
      const row = Math.floor(i / statCols);
      const sx = detail.x + 24 + col * 200;
      const sy = bodyY + row * 40;
      drawText(ctx, label.toUpperCase(), sx, sy, {
        size: 9,
        font: FONT_DISPLAY,
        color: rgba(COLORS.parchmentDim, 0.55),
        letterSpacing: 1.4,
      });
      drawText(ctx, value, sx, sy + 17, {
        size: 14,
        font: FONT_MONO,
        color: COLORS.parchment,
      });
    });
    bodyY += Math.ceil(selected.stats.length / statCols) * 40 + 10;
    ctx.save();
    ctx.strokeStyle = rgba(COLORS.gold, 0.16);
    ctx.beginPath();
    ctx.moveTo(detail.x + 24, bodyY);
    ctx.lineTo(detail.x + detail.w - 24, bodyY);
    ctx.stroke();
    ctx.restore();
    bodyY += 22;
    drawParagraph(ctx, selected.flavor, detail.x + 24, bodyY, detail.w - 48, 12.5, 18, {
      color: rgba(COLORS.parchmentDim, 0.6),
      style: 'italic',
    });
  } else {
    drawParagraph(
      ctx,
      'This page is still blank. Draft it, place it, or kill it — then the lantern will remember.',
      detail.x + 24,
      bodyY,
      detail.w - 48,
      13.5,
      19,
      { color: rgba(COLORS.parchmentDim, 0.6) },
    );
  }
};

// ── Ledger ─────────────────────────────────────────────────────────────────

const ledgerState = { page: 0 };

export const renderLedger = (ctx: Ctx2D, app: AppLike): void => {
  drawBackdrop(ctx, app);
  ctx.fillStyle = 'rgba(6,8,10,0.8)';
  ctx.fillRect(0, 0, W, H);
  header(ctx, app, 'Ledger', 'A tally kept by whoever survives to keep it.', 'menu');
  const { stats } = app.save;

  const left = rect(46, 138, 590, 714);
  app.ui.panel(ctx, left, { fill: 'rgba(12,15,20,0.94)', border: rgba(COLORS.gold, 0.2), radius: 14, corners: true });
  app.ui.sectionTitle(ctx, 'Records', left.x + 26, left.y + 40);
  const rows: [string, string][] = [
    ['Runs begun', `${stats.runs}`],
    ['Vigils won', `${stats.wins}`],
    ['Deepest wave', `${stats.deepestWave}`],
    ['Enemies felled', formatNumber(stats.kills)],
    ['Hearth leaks', formatNumber(stats.leaks)],
    ['Sigil fusions', `${stats.fusions}`],
    ['Elders forged', `${stats.elders}`],
    ['Gold earned', formatNumber(stats.goldEarned)],
    ['Time in vigil', formatTime(stats.playSeconds)],
    ['Embers earned', formatNumber(app.save.meta.embersEarned)],
    ['Best daily wave', `${stats.bestDailyWave}`],
    ['Codex entries', `${Object.keys(app.save.codex).length}`],
  ];
  rows.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = left.x + 30 + col * 280;
    const y = left.y + 88 + row * 52;
    drawText(ctx, label, x, y, {
      size: 11,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.62),
    });
    drawText(ctx, value, x, y + 22, {
      size: 18,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      weight: 'bold',
    });
    ctx.fillStyle = 'rgba(243,199,107,0.08)';
    ctx.fillRect(x, y + 30, 250, 1);
  });

  app.ui.sectionTitle(ctx, 'Sigil families', left.x + 26, left.y + 470);
  FAMILIES.forEach((fam, i) => {
    const y = left.y + 508 + i * 38;
    const unlocked = app.save.meta.unlockedFamilies.includes(fam.id);
    drawGlow(ctx, left.x + 44, y - 4, 18, fam.color, unlocked ? 0.4 : 0.1);
    drawGlyph(ctx, fam.id, left.x + 44, y - 4, 8, unlocked ? fam.bright : COLORS.stoneLight, unlocked ? 0.95 : 0.4);
    drawText(ctx, fam.name, left.x + 68, y, {
      size: 14,
      font: FONT_DISPLAY,
      color: unlocked ? COLORS.parchment : rgba(COLORS.parchmentDim, 0.45),
      weight: 'bold',
    });
    drawText(ctx, unlocked ? `${stats.familyRuns[fam.id] ?? 0} runs · ${stats.familyWins[fam.id] ?? 0} wins` : 'Locked in the Emberworks', left.x + 240, y, {
      size: 11,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.5),
    });
  });

  // achievements
  const right = rect(672, 138, 882, 714);
  app.ui.panel(ctx, right, { fill: 'rgba(12,15,20,0.94)', border: rgba(COLORS.gold, 0.2), radius: 14, corners: true });
  const unlockedCount = ACHIEVEMENTS.filter((a) => (app.save.achievements[a.id] ?? 0) > 0).length;
  app.ui.sectionTitle(ctx, 'Oaths & Labours', right.x + 26, right.y + 40);
  drawText(ctx, `${unlockedCount} / ${ACHIEVEMENTS.length}`, right.x + right.w - 26, right.y + 40, {
    size: 13,
    font: FONT_MONO,
    color: COLORS.gold,
    align: 'right',
  });

  const perPage = 6;
  const pages = Math.max(1, Math.ceil(ACHIEVEMENTS.length / perPage));
  ledgerState.page = clamp(ledgerState.page, 0, pages - 1);
  const start = ledgerState.page * perPage;
  ACHIEVEMENTS.slice(start, start + perPage).forEach((ach, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const r = rect(right.x + 24 + col * 418, right.y + 66 + row * 202, 400, 186);
    const done = (app.save.achievements[ach.id] ?? 0) > 0;
    app.ui.panel(ctx, r, {
      fill: done ? 'rgba(24,26,18,0.92)' : 'rgba(13,16,22,0.92)',
      border: done ? rgba(COLORS.gold, 0.45) : rgba(COLORS.stone, 0.28),
      radius: 10,
    });
    drawGlow(ctx, r.x + 48, r.y + 48, 34, done ? COLORS.gold : COLORS.stone, done ? 0.35 : 0.12);
    drawGlyph(ctx, ach.icon, r.x + 48, r.y + 48, 15, done ? COLORS.goldBright : COLORS.stoneLight, done ? 0.95 : 0.5);
    drawText(ctx, ach.name, r.x + 82, r.y + 38, {
      size: 15,
      font: FONT_DISPLAY,
      color: done ? COLORS.parchment : rgba(COLORS.parchmentDim, 0.65),
      weight: 'bold',
      maxWidth: r.w - 100,
    });
    const descLines = wrapText(ctx, ach.description, r.w - 100, 11.5);
    descLines.slice(0, 3).forEach((line, k) => {
      drawText(ctx, line, r.x + 82, r.y + 62 + k * 15, {
        size: 11.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.62),
      });
    });
    drawGlyph(ctx, 'embers', r.x + 90, r.y + r.h - 28, 6, COLORS.gold, 0.7);
    drawText(ctx, `+${ach.reward} embers`, r.x + 102, r.y + r.h - 23, {
      size: 11,
      font: FONT_BODY,
      color: rgba(COLORS.gold, 0.8),
    });
    if (done) {
      drawText(ctx, 'SWORN', r.x + r.w - 18, r.y + 34, {
        size: 9,
        font: FONT_DISPLAY,
        color: COLORS.heal,
        align: 'right',
        letterSpacing: 1.8,
      });
    }
  });

  if (pages > 1) {
    const py = right.y + right.h - 50;
    if (app.ui.button(ctx, 'ledger-prev', rect(right.x + 24, py, 84, 32), 'Prev', { variant: 'ghost', size: 12, disabled: ledgerState.page === 0 })) {
      ledgerState.page--;
    }
    drawText(ctx, `${ledgerState.page + 1} / ${pages}`, right.x + 208, py + 21, {
      size: 12,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
    });
    if (app.ui.button(ctx, 'ledger-next', rect(right.x + 140, py, 84, 32), 'Next', { variant: 'ghost', size: 12, disabled: ledgerState.page >= pages - 1 })) {
      ledgerState.page++;
    }
  }
};

// ── Settings ───────────────────────────────────────────────────────────────

const settingsState = { confirmReset: false, resetArmedAt: 0 };

export const renderSettings = (ctx: Ctx2D, app: AppLike): void => {
  drawBackdrop(ctx, app);
  ctx.fillStyle = 'rgba(6,8,10,0.82)';
  ctx.fillRect(0, 0, W, H);
  header(ctx, app, 'Settings', 'The lantern burns at whatever volume you prefer.', app.settingsReturn);

  const panel = rect(W / 2 - 340, 160, 680, 600);
  app.ui.panel(ctx, panel, { fill: 'rgba(12,15,20,0.96)', border: rgba(COLORS.gold, 0.25), radius: 16, corners: true });
  app.ui.sectionTitle(ctx, 'Audio', panel.x + 34, panel.y + 50);
  const sliderW = 420;
  app.ui.slider(ctx, 'vol-master', rect(panel.x + 34, panel.y + 78, sliderW, 46), 'Master volume', app.save.settings.master, (v) => app.setVolume('master', v));
  app.ui.slider(ctx, 'vol-music', rect(panel.x + 34, panel.y + 138, sliderW, 46), 'Music', app.save.settings.music, (v) => app.setVolume('music', v));
  app.ui.slider(ctx, 'vol-sfx', rect(panel.x + 34, panel.y + 198, sliderW, 46), 'Effects', app.save.settings.sfx, (v) => app.setVolume('sfx', v));
  drawText(ctx, 'Audio begins after your first click, as browsers require.', panel.x + 34, panel.y + 264, {
    size: 11,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.5),
  });

  app.ui.sectionTitle(ctx, 'Presentation', panel.x + 34, panel.y + 300);
  app.ui.toggle(ctx, 'set-damage', rect(panel.x + 34, panel.y + 322, sliderW, 34), 'Show damage numbers', app.save.settings.damageNumbers, (v) => app.setToggle('damageNumbers', v));
  app.ui.toggle(ctx, 'set-shake', rect(panel.x + 34, panel.y + 366, sliderW, 34), 'Screen shake', app.save.settings.screenShake, (v) => app.setToggle('screenShake', v));
  app.ui.toggle(ctx, 'set-motion', rect(panel.x + 34, panel.y + 410, sliderW, 34), 'Reduce motion', app.save.settings.reducedMotion, (v) => app.setToggle('reducedMotion', v));
  drawText(ctx, 'Reduce motion halves particles and removes shake.', panel.x + 34, panel.y + 452, {
    size: 11,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.5),
  });

  app.ui.sectionTitle(ctx, 'Progress', panel.x + 34, panel.y + 492);
  const resetLabel = settingsState.confirmReset ? 'Tap again to erase everything' : 'Erase all progress';
  if (app.ui.button(ctx, 'reset', rect(panel.x + 34, panel.y + 512, 300, 40), resetLabel, {
    variant: settingsState.confirmReset ? 'danger' : 'ghost',
    icon: 'salvage',
    size: 13,
  })) {
    if (settingsState.confirmReset) {
      settingsState.confirmReset = false;
      app.resetProgress();
    } else {
      settingsState.confirmReset = true;
      settingsState.resetArmedAt = performance.now();
    }
  }
  if (settingsState.confirmReset && performance.now() - settingsState.resetArmedAt > 6000) {
    settingsState.confirmReset = false;
  }
  drawText(ctx, 'Deletes embers, unlocks, codex and records.', panel.x + 34, panel.y + 576, {
    size: 11,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.5),
  });

  drawText(ctx, 'WICK & WANE · v1.0.0', panel.x + panel.w - 34, panel.y + 576, {
    size: 11,
    font: FONT_MONO,
    color: rgba(COLORS.parchmentDim, 0.4),
    align: 'right',
  });
};

// ── Results ────────────────────────────────────────────────────────────────

export const renderResults = (ctx: Ctx2D, app: AppLike): void => {
  const result = app.lastResult;
  ctx.fillStyle = 'rgba(4,5,8,0.85)';
  ctx.fillRect(0, 0, W, H);
  if (!result) return;
  const { summary } = result;

  // victory light
  if (summary.victory) {
    const g = ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 700);
    g.addColorStop(0, 'rgba(243,199,107,0.18)');
    g.addColorStop(1, 'rgba(243,199,107,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const panel = rect(W / 2 - 520, 64, 1040, 772);
  app.ui.panel(ctx, panel, {
    fill: 'rgba(11,14,19,0.97)',
    border: summary.victory ? rgba(COLORS.gold, 0.55) : rgba(COLORS.danger, 0.4),
    radius: 18,
    glow: summary.victory ? 'rgba(243,199,107,0.25)' : 'rgba(255,80,80,0.12)',
    corners: true,
  });

  drawText(ctx, summary.victory ? 'DAWN HOLDS' : 'THE LANTERN IS OUT', W / 2, 152, {
    size: 46,
    font: FONT_DISPLAY,
    color: summary.victory ? COLORS.goldBright : '#ff9a94',
    align: 'center',
    weight: 'bold',
    letterSpacing: 6,
    shadow: summary.victory ? 'rgba(243,199,107,0.4)' : 'rgba(255,60,60,0.3)',
  });
  drawText(
    ctx,
    summary.victory
      ? `The Waning King is ash. You held the road for ${summary.wave} waves in ${modeLabel(summary.mode)}.`
      : `The procession reached the wick on wave ${summary.wave} of ${modeLabel(summary.mode)}.`,
    W / 2,
    188,
    {
      size: 14,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.8),
      align: 'center',
    },
  );

  const statBox = rect(panel.x + 34, 218, panel.w - 68, 116);
  app.ui.panel(ctx, statBox, { fill: 'rgba(15,19,26,0.9)', border: rgba(COLORS.gold, 0.14), radius: 10, insetLine: false });
  const stats: [string, string][] = [
    ['WAVE', `${summary.wave}`],
    ['KILLS', formatNumber(summary.kills)],
    ['LEAKS', `${summary.leaks}`],
    ['FUSIONS', `${summary.fusions}`],
    ['ELDERS', `${summary.elders}`],
    ['TIME', formatTime(summary.time)],
    ['GOLD', formatNumber(summary.goldEarned)],
  ];
  stats.forEach(([label, value], i) => {
    const sx = statBox.x + 26 + i * ((statBox.w - 52) / stats.length);
    drawText(ctx, label, sx, statBox.y + 34, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.parchmentDim, 0.55),
      letterSpacing: 1.6,
    });
    drawText(ctx, value, sx, statBox.y + 66, {
      size: 24,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      weight: 'bold',
    });
  });
  drawText(ctx, `Seed ${summary.seed.toString(16)}${summary.dayKey ? ` · ${summary.dayKey}` : ''}`, statBox.x + 26, statBox.y + 96, {
    size: 10,
    font: FONT_MONO,
    color: rgba(COLORS.parchmentDim, 0.4),
  });

  // build summary
  const buildBox = rect(panel.x + 34, 352, 468, 208);
  app.ui.panel(ctx, buildBox, { fill: 'rgba(15,19,26,0.9)', border: rgba(COLORS.gold, 0.14), radius: 10, insetLine: false });
  app.ui.sectionTitle(ctx, 'Final build', buildBox.x + 20, buildBox.y + 32);
  if (summary.towers.length === 0) {
    drawText(ctx, 'No sigils remained.', buildBox.x + 20, buildBox.y + 62, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.5),
    });
  }
  summary.towers.slice(0, 8).forEach((tower, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = buildBox.x + 20 + col * 220;
    const y = buildBox.y + 62 + row * 34;
    const fam = FAMILY_BY_ID[tower.family];
    drawGlyph(ctx, tower.family, x + 8, y - 4, 7, fam.bright, 0.9);
    const def = ELDERS.find((e) => e.id === tower.sigilId) ?? SIGILS.find((s) => s.id === tower.sigilId);
    drawText(ctx, def?.name ?? tower.sigilId, x + 24, y, {
      size: 12,
      font: FONT_DISPLAY,
      color: tower.elder ? COLORS.goldBright : COLORS.parchment,
      maxWidth: 180,
    });
    drawText(ctx, tower.elder ? 'ELDER' : `T${tower.tier}`, x + 198, y, {
      size: 9.5,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.55),
      align: 'right',
    });
  });

  // relics
  const relicBox = rect(panel.x + 518, 352, 488, 208);
  app.ui.panel(ctx, relicBox, { fill: 'rgba(15,19,26,0.9)', border: rgba(COLORS.gold, 0.14), radius: 10, insetLine: false });
  app.ui.sectionTitle(ctx, 'Relics carried', relicBox.x + 20, relicBox.y + 32);
  if (summary.relics.length === 0) {
    drawText(ctx, 'None. The road was unkind.', relicBox.x + 20, relicBox.y + 64, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.5),
    });
  }
  summary.relics.slice(0, 10).forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = relicBox.x + 24 + col * 228;
    const y = relicBox.y + 66 + row * 26;
    drawGlyph(ctx, 'lantern', x + 6, y - 4, 6, COLORS.gold, 0.8);
    drawText(ctx, RELICS.find((r) => r.id === id)?.name ?? id, x + 20, y, {
      size: 11.5,
      font: FONT_BODY,
      color: COLORS.parchment,
      maxWidth: 200,
    });
  });

  // rewards
  const rewardBox = rect(panel.x + 34, 576, 468, 108);
  app.ui.panel(ctx, rewardBox, { fill: 'rgba(24,20,12,0.92)', border: rgba(COLORS.gold, 0.35), radius: 10 });
  drawGlow(ctx, rewardBox.x + 54, rewardBox.y + 54, 44, COLORS.gold, 0.3);
  drawGlyph(ctx, 'embers', rewardBox.x + 54, rewardBox.y + 54, 18, COLORS.goldBright, 1);
  drawText(ctx, `+${summary.embers}`, rewardBox.x + 92, rewardBox.y + 54, {
    size: 30,
    font: FONT_DISPLAY,
    color: COLORS.goldBright,
    weight: 'bold',
  });
  drawText(ctx, 'EMBERS EARNED', rewardBox.x + 92, rewardBox.y + 78, {
    size: 9.5,
    font: FONT_DISPLAY,
    color: rgba(COLORS.parchmentDim, 0.6),
    letterSpacing: 1.8,
  });
  if (result.isBestWave) {
    drawText(ctx, 'NEW BEST WAVE', rewardBox.x + rewardBox.w - 20, rewardBox.y + 40, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: COLORS.heal,
      align: 'right',
      letterSpacing: 1.6,
    });
  }
  drawText(ctx, `${result.newCodex} new codex entries`, rewardBox.x + rewardBox.w - 20, rewardBox.y + 80, {
    size: 11,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.6),
    align: 'right',
  });

  // achievements earned
  const achBox = rect(panel.x + 518, 576, 488, 108);
  app.ui.panel(ctx, achBox, { fill: 'rgba(15,19,26,0.9)', border: rgba(COLORS.gold, 0.14), radius: 10 });
  app.ui.sectionTitle(ctx, 'Oaths sworn', achBox.x + 20, achBox.y + 30);
  if (result.newAchievements.length === 0) {
    drawText(ctx, 'No new oaths this vigil.', achBox.x + 20, achBox.y + 60, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.5),
    });
  } else {
    result.newAchievements.slice(0, 3).forEach((id, i) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (!ach) return;
      const y = achBox.y + 56 + i * 20;
      drawGlyph(ctx, ach.icon, achBox.x + 26, y - 4, 6, COLORS.gold, 0.9);
      drawText(ctx, ach.name, achBox.x + 40, y, {
        size: 12,
        font: FONT_BODY,
        color: COLORS.parchment,
      });
      drawText(ctx, `+${ach.reward}`, achBox.x + achBox.w - 20, y, {
        size: 11,
        font: FONT_MONO,
        color: COLORS.gold,
        align: 'right',
      });
    });
  }

  // buttons
  const by = panel.y + panel.h - 66;
  if (app.ui.button(ctx, 'res-play', rect(panel.x + 34, by, 220, 46), 'Play again', {
    variant: 'primary',
    icon: 'flame',
    size: 16,
  })) {
    app.startRun(summary.mode as RunMode);
  }
  if (app.ui.button(ctx, 'res-ember', rect(panel.x + 266, by, 200, 46), 'Emberworks', {
    variant: 'secondary',
    icon: 'embers',
    size: 15,
  })) {
    app.go('emberworks');
  }
  if (app.ui.button(ctx, 'res-menu', rect(panel.x + panel.w - 234, by, 200, 46), 'Main menu', {
    variant: 'ghost',
    icon: 'lantern',
    size: 15,
  })) {
    app.go('menu');
  }
};

export const modeLabel = (mode: RunMode): string => {
  switch (mode) {
    case 'nightfall':
      return 'Nightfall';
    case 'daily':
      return 'Daily Vigil';
    case 'endless':
      return 'Endless Vigil';
    default:
      return 'Vigil';
  }
};

export const summaryShareText = (summary: RunSummary): string =>
  `Wick & Wane — ${summary.victory ? 'dawn held' : `fell on wave ${summary.wave}`} · ${summary.kills} kills · ${summary.fusions} fusions`;
