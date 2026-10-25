/**
 * Immediate-mode UI toolkit: panels, buttons, cards, sliders and tooltips.
 * Widgets register their rects during render; clicks are resolved against the
 * last rendered frame, which keeps drawing and input perfectly in sync.
 */
import { COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO, RARITY_COLORS, FAMILY_COLORS, rgba, shade } from '../core/palette';
import { TAU, clamp, clamp01, easeOutCubic } from '../core/math';
import {
  drawCornerFlourish,
  drawEmblem,
  drawGlow,
  drawGlyph,
  drawParagraph,
  drawText,
  fillRoundRect,
  measureText,
  roundRectPath,
  strokeRoundRect,
  wrapText,
  type Ctx2D,
} from '../game/render/art';
import { RELIC_BY_ID } from '../game/data/relics';
import { RUNE_BY_ID } from '../game/data/runes';
import { SIGIL_BY_ID, TIER_SCALE } from '../game/data/sigils';
import type { Card, Rarity } from '../game/types';
import type { SfxName } from '../core/audio';
import { cardBody, cardKindLabel, cardTitle } from '../game/sim/draft';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });
export const inset = (r: Rect, amount: number): Rect => ({
  x: r.x + amount,
  y: r.y + amount,
  w: r.w - amount * 2,
  h: r.h - amount * 2,
});
export const contains = (r: Rect, x: number, y: number): boolean =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
export const centerRect = (cx: number, cy: number, w: number, h: number): Rect => ({
  x: cx - w / 2,
  y: cy - h / 2,
  w,
  h,
});

interface TooltipRequest {
  title?: string;
  body: string;
  x: number;
  y: number;
  accent?: string;
}

interface RegionOpts {
  disabled?: boolean;
  cursor?: 'pointer' | 'default';
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tab';

export interface ButtonOpts {
  variant?: ButtonVariant;
  icon?: string;
  size?: number;
  subtitle?: string;
  disabled?: boolean;
  active?: boolean;
  radius?: number;
  accent?: string;
  reason?: string;
  align?: 'center' | 'left';
  hotkey?: string;
  tooltip?: string;
}

export type SfxHook = (name: SfxName) => void;

export class Ui {
  pointer = { x: -999, y: -999 };
  pointerDown = false;
  time = 0;
  private frameRects: { id: string; rect: Rect; disabled: boolean }[] = [];
  private previousRects: { id: string; rect: Rect; disabled: boolean }[] = [];
  private hoveredId: string | null = null;
  private pendingClick: string | null = null;
  private draggingId: string | null = null;
  private tooltips: TooltipRequest[] = [];
  private lastHoverSound = 0;
  sfx: SfxHook = () => undefined;
  wheelDelta = 0;

  beginFrame(dt: number): void {
    this.time += dt;
    this.frameRects = [];
    this.tooltips = [];
    // Hover is recomputed from the previous frame's regions (stable ids).
    let hover: string | null = null;
    for (let i = this.previousRects.length - 1; i >= 0; i--) {
      const entry = this.previousRects[i];
      if (!entry) continue;
      if (contains(entry.rect, this.pointer.x, this.pointer.y)) {
        hover = entry.id;
        break;
      }
    }
    if (hover !== this.hoveredId) {
      this.hoveredId = hover;
      if (hover && this.time - this.lastHoverSound > 0.06) {
        this.lastHoverSound = this.time;
        this.sfx('uiHover');
      }
    }
  }

  endFrame(): void {
    this.previousRects = this.frameRects;
    this.pendingClick = null;
    this.wheelDelta = 0;
  }

  isHovered(id: string): boolean {
    return this.hoveredId === id;
  }

  /** Rect of a region as drawn in the previous frame (used by tests and tooltips). */
  rectOf(id: string): Rect | null {
    for (let i = this.previousRects.length - 1; i >= 0; i--) {
      const entry = this.previousRects[i];
      if (entry?.id === id) return entry.rect;
    }
    return null;
  }

  register(id: string, r: Rect, opts: RegionOpts = {}): { hovered: boolean; clicked: boolean } {
    const disabled = !!opts.disabled;
    this.frameRects.push({ id, rect: r, disabled });
    const hovered = this.isHovered(id);
    let clicked = false;
    if (this.pendingClick === id) {
      clicked = true;
      this.pendingClick = null;
    }
    return { hovered, clicked };
  }

  onPointerMove(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  onPointerDown(x: number, y: number): boolean {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointerDown = true;
    for (let i = this.previousRects.length - 1; i >= 0; i--) {
      const entry = this.previousRects[i];
      if (entry && contains(entry.rect, x, y)) {
        this.draggingId = entry.id;
        break;
      }
    }
    return this.draggingId !== null;
  }

  onPointerUp(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointerDown = false;
    for (let i = this.previousRects.length - 1; i >= 0; i--) {
      const entry = this.previousRects[i];
      if (entry && contains(entry.rect, x, y)) {
        if (entry.disabled) this.sfx('deny');
        else this.pendingClick = entry.id;
        break;
      }
    }
    this.draggingId = null;
  }

  get isDragging(): boolean {
    return this.draggingId !== null;
  }

  get hovering(): boolean {
    return this.hoveredId !== null;
  }

  get isHoveredAnywhere(): boolean {
    return this.hoveredId !== null;
  }

  dragging(id: string): boolean {
    return this.draggingId === id && this.pointerDown;
  }

  // ── primitives ───────────────────────────────────────────────────────────

  panel(
    ctx: Ctx2D,
    r: Rect,
    opts: {
      fill?: string;
      border?: string;
      radius?: number;
      glow?: string;
      corners?: boolean;
      insetLine?: boolean;
      alpha?: number;
    } = {},
  ): void {
    const {
      fill = 'rgba(14,17,24,0.92)',
      border = rgba(COLORS.gold, 0.24),
      radius = 14,
      glow,
      corners = false,
      insetLine = true,
      alpha = 1,
    } = opts;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 26;
    }
    if (typeof fill === 'string') {
      const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      grad.addColorStop(0, shade(fill.includes('rgba') ? '#12161f' : fill, 0.04));
      grad.addColorStop(1, shade(fill.includes('rgba') ? '#0b0e14' : fill, -0.1));
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, radius, fill);
    }
    ctx.shadowBlur = 0;
    strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, radius, border, 1.2);
    if (insetLine) {
      strokeRoundRect(ctx, r.x + 5.5, r.y + 5.5, r.w - 11, r.h - 11, Math.max(2, radius - 4), 'rgba(243,199,107,0.07)', 1);
    }
    if (corners) {
      drawCornerFlourish(ctx, r.x + 3, r.y + 3, 18, false);
      drawCornerFlourish(ctx, r.x + r.w - 3, r.y + 3, 18, true);
      drawCornerFlourish(ctx, r.x + 3, r.y + r.h - 3, 18, true);
      drawCornerFlourish(ctx, r.x + r.w - 3, r.y + r.h - 3, 18, false);
    }
    ctx.restore();
  }

  sectionTitle(ctx: Ctx2D, text: string, x: number, y: number, opts: { align?: CanvasTextAlign; color?: string; size?: number; rule?: boolean } = {}): void {
    const { align = 'left', color = COLORS.gold, size = 13, rule = true } = opts;
    drawText(ctx, text.toUpperCase(), x, y, {
      size,
      font: FONT_DISPLAY,
      color,
      align,
      letterSpacing: 2.4,
      weight: 'bold',
    });
    if (rule) {
      const w = measureText(ctx, text.toUpperCase(), size, FONT_DISPLAY, 'bold') + 14;
      const startX = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      ctx.save();
      const grad = ctx.createLinearGradient(startX, 0, startX + w, 0);
      grad.addColorStop(0, rgba(COLORS.gold, 0.45));
      grad.addColorStop(1, rgba(COLORS.gold, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(startX, y + 6, w, 1);
      ctx.restore();
    }
  }

  button(ctx: Ctx2D, id: string, r: Rect, label: string, opts: ButtonOpts = {}): boolean {
    const {
      variant = 'secondary',
      icon,
      size = 16,
      subtitle,
      disabled = false,
      active = false,
      radius = 10,
      accent = COLORS.gold,
      reason,
      align = 'center',
      hotkey,
    } = opts;
    const hovered = this.isHovered(id);
    const { clicked } = this.register(id, r, { disabled });
    const press = hovered && this.pointerDown ? 1.5 : 0;
    const lift = hovered && !disabled ? -1 : 0;
    const x = r.x;
    const y = r.y + lift + press;
    const glowStrength = hovered && !disabled ? 0.7 : active ? 0.5 : 0.18;

    ctx.save();
    if (disabled) ctx.globalAlpha = 0.45;
    const baseFill =
      variant === 'primary'
        ? ['#3a2a14', '#241a0d']
        : variant === 'danger'
          ? ['#3a1717', '#220d0d']
          : variant === 'ghost'
            ? ['rgba(22,26,36,0.35)', 'rgba(14,17,24,0.35)']
            : variant === 'tab'
              ? ['rgba(28,33,46,0.9)', 'rgba(17,21,30,0.9)']
              : ['#1c2230', '#12161f'];
    const grad = ctx.createLinearGradient(x, y, x, y + r.h);
    grad.addColorStop(0, active ? '#3b3018' : baseFill[0] as string);
    grad.addColorStop(1, active ? '#241c0c' : baseFill[1] as string);
    if (hovered && !disabled && variant !== 'ghost') {
      grad.addColorStop(0, shade(active ? '#3b3018' : baseFill[0] as string, 0.12));
    }
    ctx.shadowColor = rgba(accent, glowStrength * 0.5);
    ctx.shadowBlur = hovered ? 18 : 8;
    fillRoundRect(ctx, x, y, r.w, r.h, radius, grad);
    ctx.shadowBlur = 0;
    const borderColor =
      variant === 'primary'
        ? rgba(COLORS.goldBright, hovered ? 0.95 : 0.7)
        : variant === 'danger'
          ? rgba(COLORS.danger, 0.6)
          : active
            ? rgba(COLORS.goldBright, 0.8)
            : rgba(COLORS.gold, hovered ? 0.55 : 0.24);
    strokeRoundRect(ctx, x + 0.5, y + 0.5, r.w - 1, r.h - 1, radius, borderColor, 1.3);
    if (variant === 'primary') {
      const sheen = ctx.createLinearGradient(x, y, x, y + r.h * 0.6);
      sheen.addColorStop(0, 'rgba(255,235,180,0.14)');
      sheen.addColorStop(1, 'rgba(255,235,180,0)');
      roundRectPath(ctx, x + 1, y + 1, r.w - 2, r.h * 0.6, radius - 1);
      ctx.fillStyle = sheen;
      ctx.fill();
    }

    let contentX = x + 16;
    const cy = y + r.h / 2;
    if (icon) {
      const iconSize = Math.min(r.h * 0.3, 12);
      const labelW = label ? measureText(ctx, label, size, FONT_DISPLAY, 'bold') : 0;
      const iconCx = align === 'center' ? x + r.w / 2 - labelW / 2 - (label ? iconSize * 1.6 : 0) : contentX + iconSize;
      drawGlyph(ctx, icon, iconCx, cy, iconSize, disabled ? COLORS.stoneLight : accent, 0.95);
      if (align === 'center') contentX = iconCx + iconSize * 1.4;
      else contentX += iconSize * 2 + 7;
    }
    const textColor = disabled
      ? COLORS.stoneLight
      : variant === 'primary'
        ? COLORS.goldBright
        : variant === 'danger'
          ? '#ffb4b4'
          : COLORS.parchment;
    if (subtitle) {
      drawText(ctx, label, align === 'center' ? x + r.w / 2 : contentX, cy - 4, {
        size,
        font: FONT_DISPLAY,
        color: textColor,
        align,
        weight: 'bold',
        letterSpacing: 0.6,
      });
      drawText(ctx, subtitle, align === 'center' ? x + r.w / 2 : contentX, cy + 13, {
        size: Math.max(10, size - 5),
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.75),
        align,
      });
    } else {
      drawText(ctx, label, align === 'center' ? x + r.w / 2 : contentX, cy + 1, {
        size,
        font: FONT_DISPLAY,
        color: textColor,
        align,
        baseline: 'middle',
        weight: 'bold',
        letterSpacing: 0.6,
      });
    }
    if (hotkey) {
      drawText(ctx, hotkey, x + r.w - 10, cy + 1, {
        size: 10,
        font: FONT_MONO,
        color: rgba(COLORS.parchmentDim, 0.5),
        align: 'right',
        baseline: 'middle',
      });
    }
    ctx.restore();

    if (hovered && disabled && reason) {
      this.tooltip({ body: reason, x: this.pointer.x, y: this.pointer.y, accent: COLORS.danger });
    } else if (hovered && opts.tooltip) {
      this.tooltip({ body: opts.tooltip, x: this.pointer.x, y: this.pointer.y });
    }
    if (hovered && !disabled) {
      ctx.save();
      ctx.strokeStyle = rgba(accent, 0.22 + Math.sin(this.time * 4) * 0.06);
      ctx.lineWidth = 1;
      strokeRoundRect(ctx, x + 3.5, y + 3.5, r.w - 7, r.h - 7, radius - 2, ctx.strokeStyle as string, 1);
      ctx.restore();
    }
    if (clicked && !disabled) {
      this.sfx('uiClick');
      return true;
    }
    return false;
  }

  iconButton(ctx: Ctx2D, id: string, r: Rect, icon: string, opts: ButtonOpts & { tooltip?: string } = {}): boolean {
    const clicked = this.button(ctx, id, r, '', { ...opts, size: 12 });
    drawGlyph(ctx, icon, r.x + r.w / 2, r.y + r.h / 2 - 1, Math.min(r.w, r.h) * 0.26, opts.accent ?? COLORS.gold, opts.disabled ? 0.5 : 0.9);
    if (this.isHovered(id) && opts.tooltip) {
      this.tooltip({ body: opts.tooltip, x: this.pointer.x, y: this.pointer.y });
    }
    return clicked;
  }

  toggle(
    ctx: Ctx2D,
    id: string,
    r: Rect,
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ): void {
    const { clicked } = this.register(id, r);
    const hovered = this.isHovered(id);
    drawText(ctx, label, r.x, r.y + r.h / 2, {
      size: 14,
      font: FONT_BODY,
      color: COLORS.parchment,
      baseline: 'middle',
    });
    const track = rect(r.x + r.w - 58, r.y + r.h / 2 - 13, 54, 26);
    fillRoundRect(ctx, track.x, track.y, track.w, track.h, 13, value ? rgba(COLORS.gold, 0.22) : 'rgba(30,36,48,0.9)');
    strokeRoundRect(ctx, track.x + 0.5, track.y + 0.5, track.w - 1, track.h - 1, 13, rgba(value ? COLORS.gold : COLORS.stoneLight, hovered ? 0.8 : 0.4), 1.2);
    const knobX = value ? track.x + track.w - 13 : track.x + 13;
    drawGlow(ctx, knobX, track.y + 13, 16, value ? COLORS.gold : COLORS.stone, 0.4);
    ctx.fillStyle = value ? COLORS.goldBright : COLORS.stoneLight;
    ctx.beginPath();
    ctx.arc(knobX, track.y + 13, 9, 0, TAU);
    ctx.fill();
    if (clicked) {
      this.sfx('uiClick');
      onChange(!value);
    }
  }

  slider(
    ctx: Ctx2D,
    id: string,
    r: Rect,
    label: string,
    value: number,
    onChange: (v: number) => void,
  ): void {
    const { clicked } = this.register(id, r);
    const hovered = this.isHovered(id);
    const track = rect(r.x, r.y + r.h - 18, r.w, 8);
    drawText(ctx, label, r.x, r.y + 4, {
      size: 13,
      font: FONT_BODY,
      color: COLORS.parchment,
    });
    drawText(ctx, `${Math.round(value * 100)}%`, r.x + r.w, r.y + 4, {
      size: 13,
      font: FONT_MONO,
      color: COLORS.gold,
      align: 'right',
    });
    fillRoundRect(ctx, track.x, track.y, track.w, track.h, 4, 'rgba(28,33,44,0.95)');
    fillRoundRect(ctx, track.x, track.y, track.w * clamp01(value), track.h, 4, rgba(COLORS.gold, 0.55));
    const knobX = track.x + track.w * clamp01(value);
    drawGlow(ctx, knobX, track.y + 4, 18, COLORS.gold, hovered || this.dragging(id) ? 0.7 : 0.35);
    ctx.fillStyle = COLORS.goldBright;
    ctx.beginPath();
    ctx.arc(knobX, track.y + 4, 7, 0, TAU);
    ctx.fill();
    if ((clicked || this.dragging(id)) && this.pointer.x >= track.x - 10) {
      const v = clamp01((this.pointer.x - track.x) / track.w);
      onChange(Math.round(v * 100) / 100);
    }
  }

  progressBar(
    ctx: Ctx2D,
    r: Rect,
    value: number,
    opts: { color?: string; bg?: string; glow?: boolean; height?: number } = {},
  ): void {
    const { color = COLORS.gold, bg = 'rgba(10,12,17,0.85)', glow = true } = opts;
    const h = opts.height ?? r.h;
    fillRoundRect(ctx, r.x, r.y, r.w, h, h / 2, bg);
    const frac = clamp01(value);
    if (frac > 0) {
      const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y);
      grad.addColorStop(0, shade(color, -0.2));
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, shade(color, 0.25));
      if (glow) {
        ctx.save();
        ctx.shadowColor = rgba(color, 0.6);
        ctx.shadowBlur = 10;
        fillRoundRect(ctx, r.x, r.y, Math.max(h, r.w * frac), h, h / 2, grad);
        ctx.restore();
      } else {
        fillRoundRect(ctx, r.x, r.y, Math.max(h, r.w * frac), h, h / 2, grad);
      }
    }
    strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, h - 1, h / 2, rgba(COLORS.parchment, 0.16), 1);
  }

  pips(ctx: Ctx2D, x: number, y: number, count: number, max: number, color = COLORS.gold, size = 3.2): void {
    for (let i = 0; i < max; i++) {
      ctx.fillStyle = i < count ? color : 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.arc(x + i * size * 3, y, size, 0, TAU);
      ctx.fill();
    }
  }

  tooltip(req: TooltipRequest): void {
    this.tooltips.push(req);
  }

  drawTooltips(ctx: Ctx2D): void {
    const req = this.tooltips[this.tooltips.length - 1];
    if (!req) return;
    ctx.save();
    ctx.font = `normal 13px ${FONT_BODY}`;
    const maxW = 300;
    const lines = wrapText(ctx, req.body, maxW, 13);
    let w = 0;
    for (const line of lines) w = Math.max(w, ctx.measureText(line).width);
    if (req.title) {
      ctx.font = `bold 14px ${FONT_DISPLAY}`;
      w = Math.max(w, ctx.measureText(req.title).width);
    }
    const pad = 12;
    const boxW = Math.min(maxW + pad * 2, Math.max(120, w + pad * 2));
    const boxH = lines.length * 18 + pad * 2 + (req.title ? 22 : 0);
    let x = req.x + 18;
    let y = req.y + 16;
    if (x + boxW > 1600 - 12) x = req.x - boxW - 14;
    if (y + boxH > 900 - 12) y = 900 - boxH - 12;
    if (x < 12) x = 12;
    if (y < 12) y = 12;
    ctx.globalAlpha = 0.98;
    this.panel(ctx, rect(x, y, boxW, boxH), {
      fill: 'rgba(10,12,17,0.97)',
      border: rgba(req.accent ?? COLORS.gold, 0.5),
      radius: 8,
      insetLine: false,
    });
    let ty = y + pad + 10;
    if (req.title) {
      drawText(ctx, req.title, x + pad, ty, {
        size: 14,
        font: FONT_DISPLAY,
        color: req.accent ?? COLORS.goldBright,
        weight: 'bold',
      });
      ty += 20;
    }
    for (const line of lines) {
      drawText(ctx, line, x + pad, ty, { size: 13, font: FONT_BODY, color: COLORS.parchmentDim });
      ty += 18;
    }
    ctx.restore();
  }
}

// ── Cards ──────────────────────────────────────────────────────────────────

export interface CardDrawOpts {
  selected?: boolean;
  affordable?: boolean;
  compact?: boolean;
  disabled?: boolean;
  hoverLift?: number;
  showCost?: boolean;
  accent?: string;
}

const rarityOf = (card: Card): Rarity => card.rarity ?? 'common';

const cardAccent = (card: Card): string => {
  if (card.kind === 'sigil') {
    const def = SIGIL_BY_ID[card.id];
    return def ? FAMILY_COLORS[def.family].base : COLORS.gold;
  }
  if (card.kind === 'rune') return RARITY_COLORS[RUNE_BY_ID[card.id]?.rarity ?? 'common']?.base ?? COLORS.parchment;
  if (card.kind === 'relic') return COLORS.gold;
  return COLORS.gold;
};

export const drawCard = (
  ctx: Ctx2D,
  ui: Ui,
  card: Card,
  r: Rect,
  opts: CardDrawOpts = {},
): boolean => {
  const { selected = false, affordable = true, compact = false, disabled = false } = opts;
  const accent = cardAccent(card);
  const rarity = rarityOf(card);
  const rarityColor = RARITY_COLORS[rarity]?.base ?? COLORS.gold;
  const hoverId = `card:${card.uid}`;
  const hovered = ui.isHovered(hoverId);
  const lift = hovered && !disabled ? -5 : 0;
  const x = r.x;
  const y = r.y + lift;
  const artH = Math.round(r.h * (compact ? 0.46 : 0.5));

  ctx.save();
  if (disabled) ctx.globalAlpha = 0.5;

  // card body
  ctx.shadowColor = rgba(selected ? COLORS.goldBright : accent, selected ? 0.5 : hovered ? 0.3 : 0.14);
  ctx.shadowBlur = selected ? 26 : hovered ? 18 : 10;
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + r.h);
  bodyGrad.addColorStop(0, '#1a2030');
  bodyGrad.addColorStop(1, '#0d1018');
  fillRoundRect(ctx, x, y, r.w, r.h, 12, bodyGrad);
  ctx.shadowBlur = 0;

  // art window
  ctx.save();
  roundRectPath(ctx, x + 3, y + 3, r.w - 6, artH, 10);
  ctx.clip();
  const artGrad = ctx.createLinearGradient(x, y, x, y + artH);
  artGrad.addColorStop(0, rgba(accent, 0.25));
  artGrad.addColorStop(0.6, 'rgba(10,12,18,0.6)');
  artGrad.addColorStop(1, 'rgba(8,10,15,0.95)');
  ctx.fillStyle = artGrad;
  ctx.fillRect(x, y, r.w, artH + 4);
  // faint hatch
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = -artH; i < r.w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + artH);
    ctx.lineTo(x + i + artH, y);
    ctx.stroke();
  }

  const emblemR = Math.min(r.w * 0.27, artH * 0.42);
  const cx = x + r.w / 2;
  const cy = y + artH * 0.52;
  if (card.kind === 'sigil') {
    const def = SIGIL_BY_ID[card.id];
    const family = def?.family ?? 'ember';
    drawEmblem(ctx, family, cx, cy, emblemR, {
      time: ui.time + card.uid * 0.3,
      tier: card.tier ?? 1,
      elder: false,
    });
    const tier = card.tier ?? 1;
    if (tier > 1) {
      ctx.save();
      for (let i = 0; i < tier - 1; i++) {
        drawGlyph(ctx, 'star', x + r.w - 18 - i * 12, y + artH - 14, 4.4, COLORS.goldBright, 0.95);
      }
      ctx.restore();
    }
  } else if (card.kind === 'rune') {
    const rune = RUNE_BY_ID[card.id];
    drawGlow(ctx, cx, cy, emblemR * 1.7, rarityColor, 0.4);
    ctx.strokeStyle = rgba(rarityColor, 0.7);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, emblemR * 0.9, 0, TAU);
    ctx.stroke();
    drawGlyph(ctx, rune?.glyph ?? 'spiral', cx, cy, emblemR * 0.46, COLORS.parchment, 0.95);
  } else if (card.kind === 'relic') {
    const relic = RELIC_BY_ID[card.id];
    drawGlow(ctx, cx, cy, emblemR * 1.9, COLORS.gold, 0.45);
    ctx.strokeStyle = rgba(COLORS.gold, 0.6);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, emblemR * 0.95, 0, TAU);
    ctx.stroke();
    drawGlyph(ctx, relic?.glyph ?? 'lantern', cx, cy, emblemR * 0.52, COLORS.goldBright, 0.95);
  } else {
    drawGlow(ctx, cx, cy, emblemR * 1.8, COLORS.gold, 0.5);
    drawGlyph(ctx, 'coin', cx, cy, emblemR * 0.6, COLORS.goldBright, 1);
    drawText(ctx, `+${card.gold ?? 0}`, cx, cy + emblemR * 0.95, {
      size: Math.round(emblemR * 0.8),
      font: FONT_MONO,
      color: COLORS.goldBright,
      align: 'center',
      weight: 'bold',
    });
  }

  // kind label
  drawText(ctx, cardKindLabel(card), x + 12, y + 18, {
    size: compact ? 8.5 : 9.5,
    font: FONT_DISPLAY,
    color: rgba(COLORS.parchment, 0.72),
    letterSpacing: 1.8,
    weight: 'bold',
  });
  // tier / rarity gem
  const gemColor = card.kind === 'sigil' ? FAMILY_COLORS[SIGIL_BY_ID[card.id]?.family ?? 'ember'].base : rarityColor;
  ctx.fillStyle = gemColor;
  ctx.beginPath();
  ctx.arc(x + r.w - 14, y + 15, 4, 0, TAU);
  ctx.fill();
  ctx.restore();

  // name plate
  const plateY = y + artH - 10;
  const plateGrad = ctx.createLinearGradient(x, plateY, x, plateY + 28);
  plateGrad.addColorStop(0, 'rgba(9,11,16,0.2)');
  plateGrad.addColorStop(1, 'rgba(9,11,16,0.9)');
  ctx.fillStyle = plateGrad;
  ctx.fillRect(x + 3, plateY, r.w - 6, 26);

  const name = cardTitle(card);
  const nameSize = compact ? 13.5 : 15;
  drawText(ctx, name, x + r.w / 2, y + artH + 6, {
    size: nameSize,
    font: FONT_DISPLAY,
    color: COLORS.parchment,
    align: 'center',
    weight: 'bold',
    maxWidth: r.w - 20,
  });

  // description
  const descY = y + artH + 14;
  const bodyText = cardBody(card);
  const lines = wrapText(ctx, bodyText, r.w - 24, compact ? 10.5 : 11.5);
  const maxLines = compact ? 3 : 4;
  lines.slice(0, maxLines).forEach((line, i) => {
    drawText(ctx, line, x + r.w / 2, descY + 14 + i * (compact ? 12 : 14), {
      size: compact ? 10.5 : 11.5,
      font: FONT_BODY,
      color: COLORS.parchmentDim,
      align: 'center',
    });
  });

  // footer
  const footerY = y + r.h - (compact ? 24 : 30);
  ctx.strokeStyle = rgba(COLORS.gold, 0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 12, footerY - 8);
  ctx.lineTo(x + r.w - 12, footerY - 8);
  ctx.stroke();

  if (card.kind === 'sigil') {
    const def = SIGIL_BY_ID[card.id];
    const tier = card.tier ?? 1;
    const cost = def ? Math.round(def.cost * (tier === 1 ? 1 : tier === 2 ? 1.9 : 2.9)) : 0;
    drawGlyph(ctx, 'coin', x + 18, footerY + 6, 5.2, affordable ? COLORS.gold : COLORS.danger, 0.9);
    drawText(ctx, `${cost}`, x + 28, footerY + 10, {
      size: compact ? 12 : 13,
      font: FONT_MONO,
      color: affordable ? COLORS.gold : COLORS.danger,
      weight: 'bold',
    });
    if (def) {
      drawText(ctx, `T${tier} · ${def.role.split('·')[0]?.trim() ?? ''}`, x + r.w - 14, footerY + 10, {
        size: compact ? 8.5 : 9,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.7),
        align: 'right',
        maxWidth: r.w - 70,
      });
    }
  } else if (card.kind === 'rune') {
    drawText(ctx, 'SOCKETABLE', x + r.w / 2, footerY + 10, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.parchmentDim, 0.65),
      align: 'center',
      letterSpacing: 1.4,
    });
  } else if (card.kind === 'relic') {
    drawText(ctx, 'RUN-WIDE RELIC', x + r.w / 2, footerY + 10, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.75),
      align: 'center',
      letterSpacing: 1.4,
    });
  } else {
    drawText(ctx, 'TAKE GOLD', x + r.w / 2, footerY + 10, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.75),
      align: 'center',
      letterSpacing: 1.4,
    });
  }

  // frame
  strokeRoundRect(ctx, x + 0.5, y + 0.5, r.w - 1, r.h - 1, 12, rgba(selected ? COLORS.goldBright : rarityColor, selected ? 0.95 : hovered ? 0.6 : 0.3), selected ? 2 : 1.2);
  if (selected) {
    ctx.save();
    ctx.strokeStyle = rgba(COLORS.goldBright, 0.35);
    ctx.lineWidth = 1;
    strokeRoundRect(ctx, x + 4.5, y + 4.5, r.w - 9, r.h - 9, 9, ctx.strokeStyle as string, 1);
    ctx.restore();
  }
  ctx.restore();

  const { clicked } = ui.register(hoverId, r, { disabled });
  return clicked && !disabled;
};

/** Tooltip content for any card. */
export const cardTooltip = (card: Card): { title: string; body: string; accent: string } => {
  const accent = cardAccent(card);
  if (card.kind === 'sigil') {
    const def = SIGIL_BY_ID[card.id];
    const tier = card.tier ?? 1;
    if (!def) return { title: 'Sigil', body: '', accent };
    const scale = TIER_SCALE.damage[clamp(tier, 1, 3) - 1] as number;
    const dps = ((def.damage * scale) / def.interval).toFixed(1);
    const bits = [def.description];
    if (def.damage > 0) bits.push(`Base damage ${Math.round(def.damage * scale)} · ${dps} dps`);
    if (def.range > 0) bits.push(`Range ${Math.round(def.range * 1.08)}`);
    if (def.radius) bits.push(`Radius ${def.radius}`);
    if (def.status) bits.push(`Applies ${def.status.id}`);
    bits.push(def.flavor);
    return { title: `${def.name}${tier > 1 ? ` · Tier ${tier}` : ''}`, body: bits.join('\n'), accent };
  }
  if (card.kind === 'rune') {
    const def = RUNE_BY_ID[card.id];
    return { title: def?.name ?? 'Rune', body: def?.description ?? '', accent };
  }
  if (card.kind === 'relic') {
    const def = RELIC_BY_ID[card.id];
    return {
      title: def?.name ?? 'Relic',
      body: `${def?.description ?? ''}\n${def?.flavor ?? ''}`,
      accent,
    };
  }
  return { title: 'Gold Cache', body: `Immediately gain ${card.gold ?? 0} gold.`, accent };
};

export const drawStat = (
  ctx: Ctx2D,
  label: string,
  value: string,
  x: number,
  y: number,
  opts: { align?: CanvasTextAlign; color?: string; size?: number } = {},
): void => {
  const { align = 'left', color = COLORS.parchment, size = 14 } = opts;
  drawText(ctx, label, x, y, {
    size: 12,
    font: FONT_BODY,
    color: rgba(COLORS.parchmentDim, 0.7),
    align,
  });
  drawText(ctx, value, align === 'right' ? x : align === 'center' ? x : x, y + 19, {
    size,
    font: FONT_DISPLAY,
    color,
    align,
    weight: 'bold',
  });
};

export const ease = easeOutCubic;
