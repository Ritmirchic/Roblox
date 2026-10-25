/** The gameplay screen: board, HUD, hand, draft, pause and end-of-run flow. */
import { COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO, FAMILY_COLORS, RARITY_COLORS, rgba, shade } from '../core/palette';
import { TAU, clamp, clamp01, formatNumber, formatTime } from '../core/math';
import { SIGIL_BY_ID } from '../game/data/sigils';
import { ELDER_BY_ID } from '../game/data/elders';
import { ENEMY_BY_ID, waveDef } from '../game/data/enemies';
import { FAMILY_BY_ID } from '../game/data/families';
import { RELIC_BY_ID } from '../game/data/relics';
import { RUNE_BY_ID } from '../game/data/runes';
import { TIPS } from '../game/data/lore';
import {
  drawEmblem,
  drawGlow,
  drawGlyph,
  drawParagraph,
  drawText,
  drawVignette,
  fillRoundRect,
  grain,
  measureText,
  roundRectPath,
  strokeRoundRect,
  wrapText,
  type Ctx2D,
} from '../game/render/art';
import { renderWorld } from '../game/render/board';
import { FxSystem } from '../game/render/fx';
import {
  FINAL_WAVE,
  attachRune,
  canFuse,
  discardCard,
  fuseTowers,
  fusionCost,
  handCapacity,
  kindleCost,
  kindleTower,
  pickDraftCard,
  placeTower,
  plotTower,
  rerollDraft,
  sellTower,
  sellValue,
  sigilPlacementCost,
  startWave,
  towerDef,
  towerDps,
  updateRun,
  type Run,
} from '../game/sim/engine';
import { PLOTS, SIDEBAR, TOP_BAR, VIEW } from '../game/sim/map';
import type { Card, Tower } from '../game/types';
import type { RunHost } from './appTypes';
import { cardTooltip, drawCard, inset, rect, type ButtonOpts, type Rect } from './ui';
import { modeLabel } from './screens';

const W = VIEW.width;
const H = VIEW.height;

interface Banner {
  title: string;
  subtitle: string;
  life: number;
  maxLife: number;
  boss: boolean;
}

interface RunUiState {
  selectedCardUid: number | null;
  selectedTowerUid: number | null;
  fuseSourceUid: number | null;
  hoverPlot: number | null;
  hoverTowerUid: number | null;
  pauseOpen: boolean;
  banner: Banner | null;
  message: string;
  messageLife: number;
  denialLife: number;
  draftOpenedAt: number;
  endTimer: number;
  finishing: boolean;
  discardHint: boolean;
  lowHearthFlash: number;
  lastTowerSignature: string;
  tipIndex: number;
}

export class RunScreen {
  run: Run;
  host: RunHost;
  fx: FxSystem;
  state: RunUiState;
  private clock = 0;
  private pendingFusionHint = false;

  constructor(host: RunHost, run: Run) {
    this.host = host;
    this.run = run;
    this.fx = new FxSystem();
    this.state = {
      selectedCardUid: null,
      selectedTowerUid: null,
      fuseSourceUid: null,
      hoverPlot: null,
      hoverTowerUid: null,
      pauseOpen: false,
      banner: null,
      message: '',
      messageLife: 0,
      denialLife: 0,
      draftOpenedAt: 0,
      endTimer: 0,
      finishing: false,
      discardHint: false,
      lowHearthFlash: 0,
      lastTowerSignature: '',
      tipIndex: Math.floor(Math.random() * TIPS.length),
    };
    this.state.draftOpenedAt = this.clock;
  }

  get paused(): boolean {
    return this.state.pauseOpen;
  }

  update(dt: number): void {
    this.clock += dt;
    const run = this.run;
    const state = this.state;
    if (state.messageLife > 0) state.messageLife -= dt;
    if (state.denialLife > 0) state.denialLife -= dt;
    if (state.banner) {
      state.banner.life -= dt;
      if (state.banner.life <= 0) state.banner = null;
    }
    if (state.lowHearthFlash > 0) state.lowHearthFlash -= dt * 2;

    if (state.pauseOpen) return;

    if (run.phase === 'prep' || run.phase === 'wave') {
      if (run.phase === 'wave') {
        updateRun(run, dt * this.host.speed);
        this.host.consumeRunEvents();
        if (run.hearth / run.hearthMax < 0.35) state.lowHearthFlash = 1;
      }
      this.syncSelection();
    }

    if ((run.phase === 'over' || run.phase === 'victory') && !state.finishing) {
      state.endTimer += dt;
      if (run.phase === 'victory' && state.endTimer < 0.05) {
        this.fx.addShake(6);
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * TAU;
          const d = 120 + Math.random() * 260;
          this.fx.burst(1090 + Math.cos(a) * d, 540 + Math.sin(a) * d, COLORS.gold, 10, {
            kind: 'ember',
            speed: 120,
            size: 2.4,
            life: 1.4,
            gravity: -20,
          });
        }
      }
      this.fx.update(dt);
      if (state.endTimer > 1.7) {
        state.finishing = true;
        this.host.finishRun();
      }
    } else {
      this.fx.update(dt);
    }

    if (state.selectedTowerUid !== null) {
      const tower = run.towers.find((t) => t.uid === state.selectedTowerUid);
      if (!tower) state.selectedTowerUid = null;
    }
    if (state.selectedCardUid !== null) {
      const card = run.hand.find((c) => c.uid === state.selectedCardUid);
      if (!card) state.selectedCardUid = null;
    }
    if (state.fuseSourceUid !== null && !run.towers.some((t) => t.uid === state.fuseSourceUid)) {
      state.fuseSourceUid = null;
    }
  }

  private syncSelection(): void {
    const run = this.run;
    const state = this.state;
    if (state.selectedTowerUid !== null) {
      const tower = run.towers.find((t) => t.uid === state.selectedTowerUid);
      if (tower) state.selectedTowerUid = tower.uid;
    }
    const signature = `${run.phase}-${run.wave}-${run.draft.length}`;
    if (signature !== state.lastTowerSignature) {
      state.lastTowerSignature = signature;
      if (run.phase === 'draft') {
        state.draftOpenedAt = this.clock;
        state.discardHint = run.hand.length >= handCapacity(run);
      }
    }
  }

  flashMessage(text: string, denial = false): void {
    const state = this.state;
    state.message = text;
    state.messageLife = denial ? 1.8 : 2.2;
    state.denialLife = denial ? 1 : 0;
  }

  private banner(title: string, subtitle: string, boss = false, life = 3.2): void {
    this.state.banner = { title, subtitle, life, maxLife: life, boss };
  }

  private selectedCard(): Card | null {
    const uid = this.state.selectedCardUid;
    if (uid === null) return null;
    return this.run.hand.find((c) => c.uid === uid) ?? null;
  }

  private selectedTower(): Tower | null {
    const uid = this.state.selectedTowerUid;
    if (uid === null) return null;
    return this.run.towers.find((t) => t.uid === uid) ?? null;
  }

  onKey(code: string): boolean {
    const state = this.state;
    if (code === 'Escape') {
      if (this.run.phase === 'draft') return false;
      if (state.fuseSourceUid !== null) {
        state.fuseSourceUid = null;
        return true;
      }
      if (state.selectedCardUid !== null || state.selectedTowerUid !== null) {
        state.selectedCardUid = null;
        state.selectedTowerUid = null;
        return true;
      }
      state.pauseOpen = !state.pauseOpen;
      this.host.ui.sfx('uiBack');
      return true;
    }
    if (code === 'Space') {
      if (this.run.phase === 'prep' && !state.pauseOpen) {
        this.tryStartWave();
        return true;
      }
    }
    if (/^Digit[1-9]$/.test(code)) {
      const index = Number(code.slice(5)) - 1;
      if (this.run.phase === 'draft') {
        const card = this.run.draft[index];
        if (card) {
          const result = pickDraftCard(this.run, card.uid);
          if (result.ok) {
            this.host.ui.sfx('getCard');
            this.host.syncCodex();
            this.state.selectedCardUid = null;
            this.state.selectedTowerUid = null;
          } else {
            this.flashMessage(result.reason ?? 'Cannot take that card', true);
            this.host.ui.sfx('deny');
          }
          return true;
        }
        return false;
      }
      const card = this.run.hand[index];
      if (!card) return false;
      state.selectedTowerUid = null;
      state.fuseSourceUid = null;
      state.selectedCardUid = state.selectedCardUid === card.uid ? null : card.uid;
      this.host.ui.sfx('uiClick');
      return true;
    }
    if (code === 'KeyF' && state.selectedTowerUid !== null) {
      this.beginFusion();
      return true;
    }
    if (code === 'KeyK' && state.selectedTowerUid !== null) {
      this.doKindle(state.selectedTowerUid);
      return true;
    }
    if (code === 'KeyS' && state.selectedTowerUid !== null) {
      this.doSell(state.selectedTowerUid);
      return true;
    }
    return false;
  }

  private tryStartWave(): void {
    const run = this.run;
    if (run.towers.length === 0) {
      this.flashMessage('Place at least one sigil first.', true);
      this.host.ui.sfx('deny');
      return;
    }
    const result = startWave(run);
    if (!result.ok) {
      this.flashMessage(result.reason ?? 'Cannot begin', true);
      return;
    }
    const def = waveDef(run.wave);
    this.banner(`Wave ${run.wave}`, def.name, def.boss, def.boss ? 4 : 3);
    this.host.ui.sfx(def.boss ? 'boss' : 'waveStart');
    this.host.syncCodex();
    this.state.selectedCardUid = null;
    this.state.selectedTowerUid = null;
    this.state.fuseSourceUid = null;
  }

  private handlePlotClick(index: number): void {
    const run = this.run;
    const state = this.state;
    const tower = plotTower(run, index);

    if (state.fuseSourceUid !== null) {
      if (!tower) {
        state.fuseSourceUid = null;
        this.flashMessage('Fusion cancelled.');
        return;
      }
      const result = fuseTowers(run, state.fuseSourceUid, tower.uid);
      if (result.ok) {
        this.host.ui.sfx('fuse');
        this.fx.addShake(4);
        this.fx.burst(tower.x, tower.y, COLORS.gold, 26, { kind: 'ember', speed: 130, size: 2.6, life: 0.9, gravity: -30 });
        this.fx.burst(tower.x, tower.y, COLORS.goldBright, 12, { kind: 'star', speed: 80, size: 3, life: 0.7 });
        const fused = plotTower(run, index);
        if (fused?.elder) this.flashMessage('An Elder is forged.');
        this.state.selectedTowerUid = state.fuseSourceUid;
        this.host.syncCodex();
      } else {
        this.flashMessage(result.reason ?? 'Cannot fuse', true);
        this.host.ui.sfx('deny');
      }
      state.fuseSourceUid = null;
      return;
    }

    const card = this.selectedCard();
    if (card) {
      if (card.kind === 'rune') {
        if (!tower) {
          this.flashMessage('Runes socket into a placed sigil.', true);
          return;
        }
        const result = attachRune(run, card.uid, tower.uid);
        if (result.ok) {
          this.host.ui.sfx('getCard');
          this.fx.burst(tower.x, tower.y, RARITY_COLORS[RUNE_BY_ID[card.id]?.rarity ?? 'common']?.base ?? COLORS.gold, 14, { kind: 'rune', speed: 60, size: 5, life: 0.6 });
          state.selectedCardUid = null;
          state.selectedTowerUid = tower.uid;
        } else {
          this.flashMessage(result.reason ?? 'No socket', true);
          this.host.ui.sfx('deny');
        }
        return;
      }
      if (card.kind === 'sigil') {
        if (tower) {
          state.selectedTowerUid = tower.uid;
          state.selectedCardUid = null;
          return;
        }
        const result = placeTower(run, card.uid, index);
        if (result.ok) {
          this.host.ui.sfx('place');
          const placed = plotTower(run, index);
          if (placed) {
            this.fx.burst(placed.x, placed.y, FAMILY_COLORS[placed.family].base, 18, { kind: 'shard', speed: 70, size: 3, life: 0.5 });
            this.fx.burst(placed.x, placed.y, COLORS.gold, 8, { kind: 'ember', speed: 40, size: 2, life: 0.9, gravity: -20 });
          }
          state.selectedCardUid = null;
          this.host.syncCodex();
        } else {
          this.flashMessage(result.reason ?? 'Cannot place', true);
          this.host.ui.sfx('deny');
        }
        return;
      }
    }

    if (tower) {
      state.selectedTowerUid = tower.uid;
      state.selectedCardUid = null;
      this.host.ui.sfx('uiClick');
    } else {
      state.selectedTowerUid = null;
    }
  }

  private beginFusion(): void {
    const tower = this.selectedTower();
    if (!tower) return;
    if (tower.elder) {
      this.flashMessage('Elders cannot fuse further.', true);
      return;
    }
    const candidates = this.run.towers.filter((t) => canFuse(this.run, tower, t));
    if (candidates.length === 0) {
      this.flashMessage('No other sigil of that family and tier.', true);
      this.host.ui.sfx('deny');
      return;
    }
    this.state.fuseSourceUid = tower.uid;
    this.flashMessage('Choose another sigil of the same family and tier.');
    this.host.ui.sfx('uiClick');
  }

  private doKindle(uid: number): void {
    const result = kindleTower(this.run, uid);
    if (result.ok) {
      this.host.ui.sfx('upgrade');
      const tower = this.run.towers.find((t) => t.uid === uid);
      if (tower) this.fx.burst(tower.x, tower.y, COLORS.gold, 12, { kind: 'ember', speed: 50, size: 2, life: 0.8, gravity: -25 });
    } else {
      this.flashMessage(result.reason ?? 'Cannot kindle', true);
      this.host.ui.sfx('deny');
    }
  }

  private doSell(uid: number): void {
    const result = sellTower(this.run, uid);
    if (result.ok) {
      this.host.ui.sfx('coin');
      this.state.selectedTowerUid = null;
    } else {
      this.flashMessage(result.reason ?? 'Cannot sell', true);
      this.host.ui.sfx('deny');
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  render(ctx: Ctx2D): void {
    const run = this.run;
    const state = this.state;
    const ui = this.host.ui;

    // camera shake applied to the world layer
    const shakeX = this.fx.shake * (Math.random() - 0.5);
    const shakeY = this.fx.shake * (Math.random() - 0.5);
    ctx.save();
    ctx.translate(shakeX * 0.4, shakeY * 0.4);
    renderWorld(ctx, {
      run,
      fx: this.fx,
      time: this.clock,
      hoverPlot: state.hoverPlot,
      selectedTowerUid: state.selectedTowerUid,
      fuseSourceUid: state.fuseSourceUid,
      fuseCandidates: state.fuseSourceUid !== null ? this.fuseCandidates() : [],
      placingCard: this.selectedCard(),
      hoverTowerUid: state.hoverTowerUid,
    });
    ctx.restore();

    this.renderTopBar(ctx);
    this.renderSidebar(ctx);
    this.renderWorldOverlays(ctx);
    if (state.pauseOpen) this.renderPause(ctx);
    if (run.phase === 'draft') this.renderDraft(ctx);
    if ((run.phase === 'over' || run.phase === 'victory') && !state.finishing) this.renderEndBanner(ctx);
  }

  private fuseCandidates(): number[] {
    const sourceUid = this.state.fuseSourceUid;
    if (sourceUid === null) return [];
    const source = this.run.towers.find((t) => t.uid === sourceUid);
    if (!source) return [];
    return this.run.towers.filter((t) => canFuse(this.run, source, t)).map((t) => t.uid);
  }

  private renderTopBar(ctx: Ctx2D): void {
    const run = this.run;
    const ui = this.host.ui;
    const bar = rect(0, 0, W, TOP_BAR);
    const grad = ctx.createLinearGradient(0, 0, 0, TOP_BAR);
    grad.addColorStop(0, '#11151d');
    grad.addColorStop(1, '#0a0d13');
    ctx.fillStyle = grad;
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = rgba(COLORS.gold, 0.14);
    ctx.fillRect(0, TOP_BAR - 1, W, 1);
    grain(ctx, 0.25);
    ui.panel(ctx, rect(14, 10, 292, 54), { fill: 'rgba(20,25,34,0.9)', border: rgba(COLORS.gold, 0.18), radius: 10, insetLine: false });
    const def = waveDef(run.wave + (run.phase === 'prep' || run.phase === 'draft' ? 1 : 0));
    const shownWave = run.wave === 0 ? 1 : run.phase === 'prep' || run.phase === 'draft' ? run.wave + 1 : run.wave;
    const finalLabel = run.config.mode === 'endless' ? 'ENDLESS' : `${shownWave} / ${FINAL_WAVE}`;
    drawText(ctx, run.phase === 'wave' ? `WAVE ${run.wave}` : `NEXT WAVE ${shownWave}`, 30, 32, {
      size: 10,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.8),
      letterSpacing: 2,
    });
    drawText(ctx, def.name, 30, 53, {
      size: 15,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      weight: 'bold',
      maxWidth: 196,
    });
    drawText(ctx, finalLabel, 292, 32, {
      size: 10,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.55),
      align: 'right',
    });
    drawText(ctx, def.boss ? 'BOSS WAVE' : `ACT ${def.act}`, 292, 52, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: def.boss ? '#ff9a7a' : rgba(COLORS.parchmentDim, 0.5),
      align: 'right',
      letterSpacing: 1.6,
    });

    // hearth
    const hp = rect(322, 12, 316, 50);
    ui.panel(ctx, hp, { fill: 'rgba(20,17,12,0.9)', border: rgba(COLORS.gold, 0.16), radius: 10, insetLine: false });
    const ratio = clamp01(run.hearth / run.hearthMax);
    drawGlow(ctx, hp.x + 28, hp.y + 25, 26, ratio > 0.35 ? COLORS.gold : COLORS.danger, 0.5);
    drawGlyph(ctx, 'lantern', hp.x + 28, hp.y + 24, 12, ratio > 0.35 ? COLORS.goldBright : '#ff9a8a', 0.95);
    ui.progressBar(ctx, rect(hp.x + 52, hp.y + 21, 194, 12), ratio, {
      color: ratio > 0.55 ? '#e9b25c' : ratio > 0.3 ? '#e08a45' : '#d94a45',
      bg: 'rgba(8,9,12,0.9)',
      height: 12,
    });
    drawText(ctx, `${Math.ceil(run.hearth)}`, hp.x + 52, hp.y + 14, {
      size: 11,
      font: FONT_MONO,
      color: COLORS.parchment,
    });
    drawText(ctx, `/ ${Math.round(run.hearthMax)}`, hp.x + 246, hp.y + 14, {
      size: 11,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'right',
    });

    // gold
    const gold = rect(652, 12, 156, 50);
    ui.panel(ctx, gold, { fill: 'rgba(22,19,11,0.9)', border: rgba(COLORS.gold, 0.2), radius: 10, insetLine: false });
    drawGlyph(ctx, 'coin', gold.x + 26, gold.y + 25, 11, COLORS.gold, 0.95);
    drawText(ctx, formatNumber(run.gold), gold.x + 46, gold.y + 33, {
      size: 22,
      font: FONT_DISPLAY,
      color: COLORS.goldBright,
      weight: 'bold',
    });

    // run info
    const info = rect(822, 12, 246, 50);
    ui.panel(ctx, info, { fill: 'rgba(15,19,26,0.85)', border: rgba(COLORS.gold, 0.12), radius: 10, insetLine: false });
    drawText(ctx, modeLabel(run.config.mode).toUpperCase(), info.x + 16, info.y + 20, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.parchmentDim, 0.55),
      letterSpacing: 1.8,
    });
    drawText(ctx, `${run.kills} kills · ${run.leaks} leaks`, info.x + 16, info.y + 39, {
      size: 12,
      font: FONT_BODY,
      color: COLORS.parchment,
    });
    drawText(ctx, run.phase === 'wave' ? `Wave ${formatTime(run.waveTime)}` : 'Preparation', info.x + 230, info.y + 39, {
      size: 11,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'right',
    });

    // speed / pause / mute
    const speedLabel = this.host.speed === 1 ? '1×' : '2×';
    if (ui.button(ctx, 'hud-speed', rect(1120, 12, 58, 50), speedLabel, {
      variant: 'secondary',
      size: 16,
      tooltip: 'Toggle game speed',
    } as never)) {
      this.host.setSpeed(this.host.speed === 1 ? 2 : 1);
      this.host.ui.sfx('uiClick');
    }
    if (ui.button(ctx, 'hud-pause', rect(1186, 12, 58, 50), 'II', { variant: 'secondary', size: 17 })) {
      this.state.pauseOpen = true;
      this.host.ui.sfx('uiBack');
    }
    if (ui.button(ctx, 'hud-mute', rect(1252, 12, 58, 50), '', { variant: 'secondary', icon: 'bell' })) {
      const muted = this.host.save.settings.master > 0.01;
      this.host.setVolume('master', muted ? 0 : 0.8);
      this.flashMessage(muted ? 'Muted.' : 'Sound on.');
    }
    if (ui.button(ctx, 'hud-help', rect(1318, 12, 58, 50), '', { variant: 'secondary', icon: 'book' })) {
      this.state.pauseOpen = true;
    }

    if (this.state.selectedTowerUid !== null) {
      drawText(ctx, 'INSPECTING', W - 24, 34, {
        size: 9,
        font: FONT_DISPLAY,
        color: rgba(COLORS.frost, 0.7),
        letterSpacing: 1.6,
        align: 'right',
      });
    }
  }

  private renderSidebar(ctx: Ctx2D): void {
    const run = this.run;
    const state = this.state;
    const ui = this.host.ui;
    const side = rect(SIDEBAR.x, TOP_BAR, SIDEBAR.w, SIDEBAR.h);
    const grad = ctx.createLinearGradient(side.x, side.y, side.x + side.w, side.y + side.h);
    grad.addColorStop(0, '#10141b');
    grad.addColorStop(1, '#0a0d12');
    ctx.fillStyle = grad;
    ctx.fillRect(side.x, side.y, side.w, side.h);
    grain(ctx, 0.3);
    ctx.fillStyle = rgba(COLORS.gold, 0.16);
    ctx.fillRect(side.x, side.y, 1, side.h);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(side.x + 1, side.y, 8, side.h);

    // relics row
    drawText(ctx, 'RELICS', side.x + 22, side.y + 26, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.7),
      letterSpacing: 2,
    });
    drawText(ctx, `${run.relics.length}`, side.x + side.w - 24, side.y + 26, {
      size: 10,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.5),
      align: 'right',
    });
    if (run.relics.length === 0) {
      drawText(ctx, 'None yet — draft one', side.x + 90, side.y + 26, {
        size: 10.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.4),
      });
    }
    run.relics.slice(0, 9).forEach((id, i) => {
      const relic = RELIC_BY_ID[id];
      const rx = side.x + 24 + i * 38;
      const ry = side.y + 40;
      const r = rect(rx, ry, 32, 32);
      const hover = ui.isHovered(`relic-${id}`);
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 8, hover ? 'rgba(46,40,24,0.95)' : 'rgba(22,26,34,0.95)');
      strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 8, rgba(COLORS.gold, hover ? 0.6 : 0.25), 1);
      drawGlyph(ctx, relic?.glyph ?? 'lantern', r.x + 16, r.y + 16, 9, COLORS.gold, 0.9);
      ui.register(`relic-${id}`, r);
      if (hover && relic) {
        ui.tooltip({ title: relic.name, body: relic.description, x: ui.pointer.x, y: ui.pointer.y, accent: COLORS.gold });
      }
    });

    const selectedTower = this.selectedTower();
    const panelY = side.y + 90;
    if (selectedTower) {
      this.renderTowerInspector(ctx, selectedTower, rect(side.x + 16, panelY, side.w - 32, side.h - 106));
    } else {
      this.renderHand(ctx, rect(side.x + 16, panelY, side.w - 32, side.h - 190));
      this.renderBeginArea(ctx, rect(side.x + 16, side.y + side.h - 92, side.w - 32, 76));
    }
  }

  private renderHand(ctx: Ctx2D, area: Rect): void {
    const run = this.run;
    const state = this.state;
    const ui = this.host.ui;
    const cap = handCapacity(run);
    drawText(ctx, 'HAND', area.x + 6, area.y + 14, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.7),
      letterSpacing: 2,
    });
    drawText(ctx, `${run.hand.length} / ${cap}`, area.x + area.w - 6, area.y + 14, {
      size: 10,
      font: FONT_MONO,
      color: run.hand.length >= cap ? COLORS.danger : rgba(COLORS.parchmentDim, 0.55),
      align: 'right',
    });

    const cols = 2;
    const gap = 10;
    const cardW = (area.w - 12 - gap) / cols;
    const cardH = 206;
    const startY = area.y + 26;
    const slots = Math.max(cap, run.hand.length);

    for (let i = 0; i < Math.min(slots, 6); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const r = rect(area.x + 6 + col * (cardW + gap), startY + row * (cardH + gap), cardW, cardH);
      const card = run.hand[i];
      if (!card) {
        ctx.save();
        ctx.strokeStyle = 'rgba(243,199,107,0.1)';
        ctx.setLineDash([5, 6]);
        strokeRoundRect(ctx, r.x, r.y, r.w, r.h, 10, ctx.strokeStyle as string, 1);
        ctx.restore();
        drawText(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2, {
          size: 10,
          font: FONT_BODY,
          color: 'rgba(243,199,107,0.16)',
          align: 'center',
        });
        continue;
      }
      const affordable = card.kind !== 'sigil' || run.gold >= sigilPlacementCost(run, card);
      const cardClicked = drawCard(ctx, ui, card, r, {
        compact: true,
        selected: state.selectedCardUid === card.uid,
        affordable,
        showCost: card.kind === 'sigil',
      });
      if (ui.isHovered(`card:${card.uid}`)) {
        const tip = cardTooltip(card);
        ui.tooltip({
          title: tip.title,
          body: tip.body,
          x: ui.pointer.x,
          y: ui.pointer.y,
          accent: tip.accent,
        });
      }
      if (cardClicked) {
        if (state.fuseSourceUid !== null) state.fuseSourceUid = null;
        if (state.selectedCardUid === card.uid) {
          state.selectedCardUid = null;
        } else {
          state.selectedCardUid = card.uid;
          state.selectedTowerUid = null;
          if (card.kind === 'sigil') {
            const cost = sigilPlacementCost(run, card);
            if (run.gold < cost) this.flashMessage(`Need ${cost} gold to place this.`, true);
          }
          this.host.ui.sfx('uiClick');
        }
      }
    }

    // selected card hint
    const card = this.selectedCard();
    const hintY = startY + 3 * (cardH + gap) + 2;
    if (card) {
      const tip = cardTooltip(card);
      ctx.save();
      ctx.fillStyle = 'rgba(20,26,34,0.9)';
      roundRectPath(ctx, area.x + 6, hintY, area.w - 12, 66, 8);
      ctx.fill();
      ctx.strokeStyle = rgba(tip.accent, 0.4);
      ctx.lineWidth = 1;
      strokeRoundRect(ctx, area.x + 6, hintY, area.w - 12, 66, 8, ctx.strokeStyle as string, 1);
      ctx.restore();
      drawText(ctx, tip.title, area.x + 18, hintY + 20, {
        size: 12,
        font: FONT_DISPLAY,
        color: tip.accent,
        weight: 'bold',
        maxWidth: area.w - 46,
      });
      const guidance =
        card.kind === 'rune'
          ? 'Click a placed sigil to socket this rune.'
          : run.phase === 'wave'
            ? 'Click a free stone plot to place.'
            : 'Click a free stone plot to place it.';
      drawText(ctx, guidance, area.x + 18, hintY + 40, {
        size: 10.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.7),
        maxWidth: area.w - 36,
      });
      if (ui.button(ctx, `discard-${card.uid}`, rect(area.x + area.w - 92, hintY + 44, 76, 18), 'Discard', { variant: 'ghost', size: 9.5, accent: COLORS.danger })) {
        discardCard(run, card.uid);
        state.selectedCardUid = null;
        this.host.ui.sfx('uiBack');
      }
    } else {
      drawText(ctx, run.phase === 'wave' ? 'Sigils fire on their own.' : 'Select a card, then click a stone plot.', area.x + area.w / 2, hintY + 16, {
        size: 11,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.5),
        align: 'center',
      });
      drawText(ctx, 'Runes socket into placed sigils.', area.x + area.w / 2, hintY + 34, {
        size: 10.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.35),
        align: 'center',
      });
    }
  }

  private renderBeginArea(ctx: Ctx2D, area: Rect): void {
    const run = this.run;
    const ui = this.host.ui;
    const nextWave = waveDef(run.wave + 1);
    if (run.phase === 'prep' || run.phase === 'draft') {
      drawText(ctx, nextWave.boss ? 'A BOSS IS COMING' : 'NEXT: ' + nextWave.name.toUpperCase(), area.x + 4, area.y + 16, {
        size: 9.5,
        font: FONT_DISPLAY,
        color: nextWave.boss ? '#ff9a7a' : rgba(COLORS.parchmentDim, 0.6),
        letterSpacing: 1.4,
      });
      // enemy preview icons
      const types = [...new Set(nextWave.groups.map((g) => g.type))];
      types.slice(0, 4).forEach((type, i) => {
        const def = ENEMY_BY_ID[type];
        if (!def) return;
        drawGlow(ctx, area.x + 12 + i * 22, area.y + 34, 10, def.color, 0.3);
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(area.x + 12 + i * 22, area.y + 34, def.boss ? 6 : 4, 0, TAU);
        ctx.fill();
      });
      if (types.length > 4) {
        drawText(ctx, `+${types.length - 4}`, area.x + 100, area.y + 37, {
          size: 10,
          font: FONT_MONO,
          color: rgba(COLORS.parchmentDim, 0.5),
        });
      }
      if (ui.button(ctx, 'begin-wave', rect(area.x, area.y + 46, area.w, 30), 'Begin Wave', {
        variant: 'primary',
        icon: 'flame',
        size: 15,
        disabled: run.towers.length === 0,
        reason: 'Place at least one sigil first.',
        hotkey: 'SPC',
      })) {
        this.tryStartWave();
      }
    } else if (run.phase === 'wave') {
      const remaining = run.spawns.length + run.enemies.length;
      drawText(ctx, `WAVE ${run.wave} IN PROGRESS`, area.x + area.w / 2, area.y + 18, {
        size: 10,
        font: FONT_DISPLAY,
        color: rgba(COLORS.gold, 0.8),
        align: 'center',
        letterSpacing: 2,
      });
      ui.progressBar(ctx, rect(area.x, area.y + 30, area.w, 8), 1 - clamp01(remaining / Math.max(1, this.waveTotal())), {
        color: '#c9863f',
        height: 8,
      });
      drawText(ctx, `${remaining} remaining · ${this.host.speed}× speed`, area.x + area.w / 2, area.y + 58, {
        size: 11,
        font: FONT_BODY,
        color: rgba(COLORS.parchmentDim, 0.6),
        align: 'center',
      });
    }
  }

  private waveTotal(): number {
    const def = waveDef(this.run.wave);
    return def.groups.reduce((acc, g) => acc + g.count, 0) + 1;
  }

  private renderTowerInspector(ctx: Ctx2D, tower: Tower, area: Rect): void {
    const ui = this.host.ui;
    const run = this.run;
    const def = towerDef(tower);
    const fam = FAMILY_BY_ID[tower.family];
    ui.panel(ctx, area, { fill: 'rgba(14,18,24,0.94)', border: rgba(fam.color, 0.4), radius: 12 });
    drawGlow(ctx, area.x + 46, area.y + 46, 42, fam.color, 0.35);
    drawEmblem(ctx, tower.family, area.x + 46, area.y + 46, 26, {
      time: this.clock,
      tier: tower.tier,
      elder: tower.elder,
    });
    drawText(ctx, def.name, area.x + 86, area.y + 34, {
      size: 17,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      weight: 'bold',
      maxWidth: area.w - 100,
    });
    drawText(ctx, tower.elder ? 'ELDER SIGIL' : `TIER ${tower.tier} · ${fam.name.toUpperCase()}`, area.x + 86, area.y + 54, {
      size: 9.5,
      font: FONT_DISPLAY,
      color: tower.elder ? COLORS.goldBright : rgba(fam.bright, 0.85),
      letterSpacing: 1.6,
    });
    drawText(ctx, `${Math.round(towerDps(tower))} dps`, area.x + 86, area.y + 74, {
      size: 12,
      font: FONT_MONO,
      color: COLORS.gold,
    });
    drawText(ctx, `${tower.kills} kills`, area.x + area.w - 20, area.y + 74, {
      size: 11,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'right',
    });

    const statLine = [
      `DMG ${Math.round(tower.mods.damage)}`,
      `RNG ${Math.round(tower.mods.range)}`,
      `SPD ${tower.mods.interval.toFixed(2)}s`,
      `CRIT ${Math.round(tower.mods.critChance * 100)}%`,
    ];
    statLine.forEach((line, i) => {
      drawText(ctx, line, area.x + 18 + i * 92, area.y + 104, {
        size: 10,
        font: FONT_MONO,
        color: rgba(COLORS.parchment, 0.72),
      });
    });

    // sockets
    drawText(ctx, 'RUNES', area.x + 18, area.y + 132, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.7),
      letterSpacing: 1.8,
    });
    drawText(ctx, `${tower.runes.length}/${tower.sockets}`, area.x + area.w - 20, area.y + 132, {
      size: 9.5,
      font: FONT_MONO,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'right',
    });
    for (let i = 0; i < tower.sockets; i++) {
      const r = rect(area.x + 18 + (i % 4) * 90, area.y + 142 + Math.floor(i / 4) * 48, 82, 42);
      const rune = tower.runes[i];
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 8, rune ? 'rgba(30,34,26,0.95)' : 'rgba(18,22,28,0.9)');
      strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 8, rgba(COLORS.gold, rune ? 0.4 : 0.12), 1);
      if (rune) {
        const runeDef = RUNE_BY_ID[rune.id];
        drawGlyph(ctx, runeDef?.glyph ?? 'spiral', r.x + 16, r.y + 21, 7, COLORS.parchment, 0.9);
        drawText(ctx, runeDef?.name ?? rune.id, r.x + 28, r.y + 19, {
          size: 9.5,
          font: FONT_BODY,
          color: COLORS.parchment,
          maxWidth: 50,
        });
        drawText(ctx, 'socketed', r.x + 28, r.y + 31, {
          size: 8,
          font: FONT_MONO,
          color: rgba(COLORS.parchmentDim, 0.45),
        });
      } else {
        drawText(ctx, 'empty', r.x + r.w / 2, r.y + 25, {
          size: 9.5,
          font: FONT_BODY,
          color: 'rgba(255,255,255,0.16)',
          align: 'center',
        });
      }
    }

    const runeCard = run.hand.find((c) => c.kind === 'rune');
    const btnY = area.y + 290;
    const btnW = (area.w - 44) / 2;
    const kindlePrice = kindleCost(tower);
    if (uib(ctx, ui, 'insp-kindle', rect(area.x + 16, btnY, btnW, 44), tower.kindle >= 3 ? 'Fully kindled' : `Kindle · ${kindlePrice}`, {
      variant: 'primary',
      icon: 'flame',
      size: 13,
      disabled: tower.kindle >= 3 || run.gold < kindlePrice,
      reason: tower.kindle >= 3 ? 'This sigil is fully kindled.' : `Needs ${kindlePrice} gold.`,
    })) {
      this.doKindle(tower.uid);
    }
    const fusePrice = fusionCost(run, tower.tier);
    const fusePartners = run.towers.filter((t) => canFuse(run, tower, t)).length;
    if (uib(ctx, ui, 'insp-fuse', rect(area.x + 16 + btnW + 12, btnY, btnW, 44), tower.tier >= 3 ? `Forge Elder · ${fusePrice}` : `Fuse · ${fusePrice}`, {
      variant: 'secondary',
      icon: 'fork',
      size: 13,
      disabled: tower.elder || fusePartners === 0 || run.gold < fusePrice,
      reason: tower.elder ? 'Elders are already the highest form.' : fusePartners === 0 ? 'Needs another sigil of the same family and tier.' : `Needs ${fusePrice} gold.`,
    })) {
      this.beginFusion();
    }
    if (uib(ctx, ui, 'insp-sell', rect(area.x + 16, btnY + 54, btnW, 38), `Sell · ${sellValue(run, tower)}`, {
      variant: 'danger',
      icon: 'coin',
      size: 12,
    })) {
      this.doSell(tower.uid);
    }
    if (uib(ctx, ui, 'insp-rune', rect(area.x + 16 + btnW + 12, btnY + 54, btnW, 38),
      runeCard ? `Socket ${RUNE_BY_ID[runeCard.id]?.name ?? 'rune'}` : 'No rune in hand',
      {
        variant: 'ghost',
        icon: 'rune',
        size: 11,
        disabled: !runeCard || tower.runes.length >= tower.sockets,
        reason: !runeCard ? 'Draft a rune first.' : 'No free socket.',
      })) {
      if (runeCard) {
        const result = attachRune(run, runeCard.uid, tower.uid);
        if (result.ok) this.host.ui.sfx('getCard');
        else this.flashMessage(result.reason ?? 'No socket', true);
      }
    }
    drawText(ctx, `Kindled ${tower.kindle}/3 · damage +${tower.kindle * 15}%`, area.x + 18, btnY - 18, {
      size: 10,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.5),
    });
    drawText(ctx, 'Adjacent sigils gain +4% damage each.', area.x + 18, btnY + 116, {
      size: 10,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.4),
    });
    if (uib(ctx, ui, 'insp-back', rect(area.x + 16, area.y + area.h - 50, area.w - 32, 34), 'Back to hand', { variant: 'ghost', size: 12 })) {
      this.state.selectedTowerUid = null;
    }
  }

  private renderWorldOverlays(ctx: Ctx2D): void {
    const run = this.run;
    const state = this.state;
    // Hover/click regions for plots and towers (invisible, keyboard-friendly)
    const ui = this.host.ui;
    for (const plot of PLOTS) {
      const tower = plotTower(run, plot.index);
      const r = rect(plot.x - 44, plot.y - 44, 88, 88);
      const hovered = Math.hypot(ui.pointer.x - plot.x, ui.pointer.y - plot.y) < 46;
      if (hovered) {
        state.hoverPlot = plot.index;
        state.hoverTowerUid = tower ? tower.uid : null;
      }
      if (ui.button(ctx, `plot-${plot.index}`, r, '', { variant: 'ghost' })) {
        this.handlePlotClick(plot.index);
      }
    }
    if (!PLOTS.some((p) => Math.hypot(ui.pointer.x - p.x, ui.pointer.y - p.y) < 46)) {
      state.hoverPlot = null;
      state.hoverTowerUid = null;
    }

    // hover label for towers
    const hoverTower = run.towers.find((t) => t.uid === state.hoverTowerUid);
    if (hoverTower && !state.pauseOpen && run.phase !== 'draft') {
      const def = towerDef(hoverTower);
      const tipY = hoverTower.y - 74;
      const label = `${def.name}${hoverTower.elder ? ' · ELDER' : ` · T${hoverTower.tier}`}  ·  ${Math.round(towerDps(hoverTower))} dps`;
      const width = measureText(ctx, label, 11, FONT_BODY) + 24;
      const r = rect(clamp(hoverTower.x - width / 2, 12, 1140 - width), clamp(tipY, 84, 840), width, 26);
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 6, 'rgba(8,10,14,0.92)');
      strokeRoundRect(ctx, r.x, r.y, r.w, r.h, 6, rgba(COLORS.gold, 0.3), 1);
      drawText(ctx, label, r.x + r.w / 2, r.y + 17, {
        size: 11,
        font: FONT_BODY,
        color: COLORS.parchment,
        align: 'center',
      });
    }

    // in-world instruction strip
    const strip = rect(20, H - 52, 1140, 36);
    const message = state.messageLife > 0 ? state.message : this.contextHint();
    const danger = state.denialLife > 0;
    ctx.save();
    ctx.globalAlpha = 0.94;
    fillRoundRect(ctx, strip.x, strip.y, strip.w, strip.h, 18, 'rgba(8,10,14,0.72)');
    ctx.restore();
    const stripColor = danger ? COLORS.danger : state.messageLife > 0 ? COLORS.goldBright : rgba(COLORS.parchmentDim, 0.65);
    drawText(ctx, message, strip.x + strip.w / 2, strip.y + 23, {
      size: 12,
      font: FONT_BODY,
      color: stripColor,
      align: 'center',
      maxWidth: strip.w - 40,
    });
    if (state.fuseSourceUid !== null) {
      drawText(ctx, 'FUSION MODE', strip.x + 20, strip.y + 23, {
        size: 9.5,
        font: FONT_DISPLAY,
        color: COLORS.volt,
        letterSpacing: 2,
      });
    }

    // banner
    const banner = state.banner;
    if (banner) {
      const t = 1 - clamp01(banner.life / banner.maxLife);
      const alpha = clamp01(Math.min(1, banner.life / 0.5));
      const slide = (1 - Math.min(1, t * 6)) * 30;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(0, slide);
      const boxW = 560;
      const boxH = 84;
      const bx = 590 - boxW / 2;
      const by = 118;
      ctx.shadowColor = banner.boss ? 'rgba(255,90,60,0.4)' : 'rgba(243,199,107,0.35)';
      ctx.shadowBlur = 30;
      fillRoundRect(ctx, bx, by, boxW, boxH, 10, 'rgba(8,10,14,0.88)');
      ctx.shadowBlur = 0;
      strokeRoundRect(ctx, bx, by, boxW, boxH, 10, rgba(banner.boss ? COLORS.danger : COLORS.gold, 0.5), 1.4);
      drawText(ctx, banner.title.toUpperCase(), 590, by + 34, {
        size: 24,
        font: FONT_DISPLAY,
        color: banner.boss ? '#ff9a7a' : COLORS.goldBright,
        align: 'center',
        weight: 'bold',
        letterSpacing: 4,
      });
      drawText(ctx, banner.subtitle, 590, by + 60, {
        size: 12.5,
        font: FONT_BODY,
        color: rgba(COLORS.parchment, 0.8),
        align: 'center',
      });
      ctx.restore();
    }
    // low hearth warning
    if (run.hearth / run.hearthMax < 0.3 && run.phase === 'wave') {
      const pulse = 0.4 + Math.sin(this.clock * 5) * 0.25;
      const g = ctx.createRadialGradient(590, 450, 300, 590, 450, 700);
      g.addColorStop(0, 'rgba(120,10,10,0)');
      g.addColorStop(1, `rgba(160,20,20,${0.18 * pulse})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, TOP_BAR, 1180, H - TOP_BAR);
      drawText(ctx, 'THE LANTERN IS FAILING', 590, 120, {
        size: 14,
        font: FONT_DISPLAY,
        color: rgba('#ff9a8a', 0.75 + Math.sin(this.clock * 5) * 0.2),
        align: 'center',
        letterSpacing: 4,
      });
    }
  }

  private contextHint(): string {
    const state = this.state;
    if (state.fuseSourceUid !== null) return 'Choose a same-family sigil of equal tier to fuse — Esc cancels.';
    if (this.selectedCard()) {
      const card = this.selectedCard();
      if (card?.kind === 'rune') return 'Click a placed sigil to socket the rune.';
      return 'Click a free stone plot to place the sigil. Esc cancels.';
    }
    if (state.selectedTowerUid !== null) return 'F fuse · K kindle · S sell · ESC close';
    if (this.run.phase === 'wave') return 'The procession advances. Sigils fire on their own.';
    if (this.run.phase === 'prep') return 'Place sigils from your hand, then begin the wave. SPACE to start.';
    return '';
  }

  private renderDraft(ctx: Ctx2D): void {
    const run = this.run;
    const ui = this.host.ui;
    const cards = run.draft;
    const elapsed = this.clock - this.state.draftOpenedAt;

    ctx.save();
    ctx.fillStyle = 'rgba(4,6,9,0.82)';
    ctx.fillRect(0, 0, W, H);
    // lantern light behind the panel
    drawGlow(ctx, W / 2, 330, 520, COLORS.gold, 0.1 + Math.sin(this.clock * 0.8) * 0.02);

    const panelW = Math.min(1420, 120 + cards.length * 272);
    const panelH = 676;
    const panel = rect((W - panelW) / 2, 62, panelW, panelH);
    ui.panel(ctx, panel, { fill: 'rgba(10,13,18,0.97)', border: rgba(COLORS.gold, 0.35), radius: 18, corners: true, glow: 'rgba(243,199,107,0.15)' });

    drawText(ctx, run.hand.length === 0 && run.towers.length === 0 ? 'THE LANTERN OFFERS' : 'THE LANTERN OFFERS', W / 2, 114, {
      size: 27,
      font: FONT_DISPLAY,
      color: COLORS.goldBright,
      align: 'center',
      weight: 'bold',
      letterSpacing: 5,
      shadow: 'rgba(243,199,107,0.35)',
    });
    drawText(ctx, `Choose one for wave ${run.draftWave}`, W / 2, 140, {
      size: 12.5,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.7),
      align: 'center',
    });
    drawText(ctx, `Hand ${run.hand.length}/${handCapacity(run)}`, panel.x + 26, 114, {
      size: 11,
      font: FONT_MONO,
      color: run.hand.length >= handCapacity(run) ? COLORS.danger : rgba(COLORS.parchmentDim, 0.6),
    });
    drawText(ctx, `Gold ${run.gold}`, panel.x + panel.w - 26, 114, {
      size: 11,
      font: FONT_MONO,
      color: COLORS.gold,
      align: 'right',
    });

    const gap = 18;
    const cardW = Math.min(252, (panel.w - 80 - (cards.length - 1) * gap) / Math.max(1, cards.length));
    const cardH = 392;
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = panel.x + (panel.w - totalW) / 2;
    const cardY = 172;

    cards.forEach((card, i) => {
      const r = rect(startX + i * (cardW + gap), cardY, cardW, cardH);
      const appear = clamp01((elapsed - i * 0.08) * 3.2);
      const slide = (1 - appear) * 26;
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate(0, slide);
      const pickedCard = drawCard(ctx, ui, card, r, { selected: false });
      const tip = cardTooltip(card);
      if (ui.isHovered(`card:${card.uid}`)) {
        ui.tooltip({ title: tip.title, body: tip.body, x: ui.pointer.x, y: ui.pointer.y, accent: tip.accent });
      }
      if (pickedCard) {
        const result = pickDraftCard(run, card.uid);
        if (result.ok) {
          this.host.ui.sfx('getCard');
          this.host.syncCodex();
          this.state.selectedCardUid = null;
          this.state.selectedTowerUid = null;
          this.state.fuseSourceUid = null;
          const picked = card.kind;
          if (picked === 'relic') this.flashMessage('Relic bound to this vigil.');
        } else {
          this.flashMessage(result.reason ?? 'Cannot take that card', true);
          this.host.ui.sfx('deny');
          this.state.discardHint = true;
        }
      }
      ctx.restore();
    });

    // reroll + hand management
    const footerY = cardY + cardH + 16;
    const freeReroll = run.freeRerolls > 0;
    if (ui.button(ctx, 'draft-reroll', rect(panel.x + 26, footerY, 250, 42), freeReroll ? `Reroll · free (${run.freeRerolls})` : 'Reroll · 20 gold', {
      variant: 'secondary',
      icon: 'dice',
      size: 13,
      disabled: !freeReroll && run.gold < 20,
      reason: 'Not enough gold to reroll.',
    })) {
      const result = rerollDraft(run);
      if (result.ok) {
        this.state.draftOpenedAt = this.clock;
        this.host.ui.sfx('uiClick');
      } else {
        this.flashMessage(result.reason ?? 'Cannot reroll', true);
        this.host.ui.sfx('deny');
      }
    }
    drawText(ctx, 'Cards are free. Gold is for placing and fusing.', panel.x + 300, footerY + 26, {
      size: 11.5,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.55),
    });

    // hand strip (discard to make room)
    const handY = footerY + 56;
    drawText(ctx, 'YOUR HAND', panel.x + 26, handY + 12, {
      size: 9,
      font: FONT_DISPLAY,
      color: rgba(COLORS.gold, 0.7),
      letterSpacing: 1.8,
    });
    if (run.hand.length >= handCapacity(run)) {
      drawText(ctx, 'hand full — discard below', panel.x + 120, handY + 12, {
        size: 10,
        font: FONT_BODY,
        color: COLORS.danger,
      });
    }
    run.hand.slice(0, 8).forEach((card, i) => {
      const r = rect(panel.x + 26 + i * 150, handY + 22, 138, 38);
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 7, 'rgba(20,24,32,0.95)');
      strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 7, rgba(COLORS.gold, 0.2), 1);
      const fam = card.kind === 'sigil' ? FAMILY_BY_ID[SIGIL_BY_ID[card.id]?.family ?? 'ember'] : null;
      drawGlyph(ctx, fam ? fam.id : card.kind === 'rune' ? 'spiral' : 'lantern', r.x + 16, r.y + 19, 7, fam?.bright ?? COLORS.parchment, 0.9);
      drawText(ctx, cardTitleShort(card), r.x + 30, r.y + 23, {
        size: 10,
        font: FONT_BODY,
        color: COLORS.parchment,
        maxWidth: 76,
      });
      if (ui.button(ctx, `draft-discard-${card.uid}`, rect(r.x + r.w - 24, r.y + 8, 18, 22), '×', { variant: 'ghost', size: 12, accent: COLORS.danger })) {
        discardCard(run, card.uid);
        this.host.ui.sfx('uiBack');
      }
    });
    ctx.restore();
  }

  private renderPause(ctx: Ctx2D): void {
    const ui = this.host.ui;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,9,0.78)';
    ctx.fillRect(0, 0, W, H);
    const panel = rect(W / 2 - 320, 140, 640, 600);
    ui.panel(ctx, panel, { fill: 'rgba(10,13,18,0.98)', border: rgba(COLORS.gold, 0.35), radius: 16, corners: true });
    drawText(ctx, 'PAUSED', W / 2, 208, {
      size: 34,
      font: FONT_DISPLAY,
      color: COLORS.parchment,
      align: 'center',
      weight: 'bold',
      letterSpacing: 8,
    });
    drawText(ctx, `${modeLabel(this.run.config.mode)} · Wave ${this.run.wave} · ${this.run.kills} kills`, W / 2, 234, {
      size: 12,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.6),
      align: 'center',
    });

    const bx = panel.x + 40;
    const bw = panel.w - 80;
    if (ui.button(ctx, 'pause-resume', rect(bx, 268, bw, 48), 'Resume', { variant: 'primary', icon: 'flame', size: 16 })) {
      this.state.pauseOpen = false;
      this.host.ui.sfx('uiClick');
    }
    if (ui.button(ctx, 'pause-restart', rect(bx, 326, bw, 42), 'Restart run', { variant: 'secondary', icon: 'spiral', size: 14 })) {
      this.host.restartRun();
    }
    if (ui.button(ctx, 'pause-settings', rect(bx, 378, bw, 42), 'Audio & presentation', { variant: 'ghost', icon: 'oil', size: 13 })) {
      this.state.pauseOpen = false;
      this.host.go('settings');
    }

    // quick sliders
    ui.slider(ctx, 'pause-master', rect(bx, 442, bw, 42), 'Master', this.host.save.settings.master, (v) => this.host.setVolume('master', v));
    ui.slider(ctx, 'pause-music', rect(bx, 490, bw, 42), 'Music', this.host.save.settings.music, (v) => this.host.setVolume('music', v));
    ui.slider(ctx, 'pause-sfx', rect(bx, 538, bw, 42), 'Effects', this.host.save.settings.sfx, (v) => this.host.setVolume('sfx', v));

    if (ui.button(ctx, 'pause-abandon', rect(bx, 600, bw, 40), 'Abandon run', { variant: 'danger', icon: 'skull', size: 13 })) {
      this.state.pauseOpen = false;
      this.host.finishRun(true);
    }
    drawText(ctx, 'Abandoning still keeps the embers earned.', W / 2, 674, {
      size: 10.5,
      font: FONT_BODY,
      color: rgba(COLORS.parchmentDim, 0.45),
      align: 'center',
    });
    ctx.restore();
  }

  private renderEndBanner(ctx: Ctx2D): void {
    const run = this.run;
    ctx.save();
    const alpha = clamp01(this.state.endTimer * 2);
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(590, 450, 80, 590, 450, 700);
    if (run.phase === 'victory') {
      g.addColorStop(0, 'rgba(243,199,107,0.28)');
      g.addColorStop(1, 'rgba(4,6,9,0.9)');
    } else {
      g.addColorStop(0, 'rgba(120,20,20,0.3)');
      g.addColorStop(1, 'rgba(4,3,5,0.94)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, run.phase === 'victory' ? 'DAWN HOLDS' : 'THE LANTERN GOES OUT', W / 2, 440, {
      size: 54,
      font: FONT_DISPLAY,
      color: run.phase === 'victory' ? COLORS.goldBright : '#ff9a8a',
      align: 'center',
      weight: 'bold',
      letterSpacing: 10,
      shadow: run.phase === 'victory' ? 'rgba(243,199,107,0.5)' : 'rgba(255,60,60,0.4)',
    });
    drawText(ctx, `Wave ${run.wave} · ${run.kills} kills · ${formatNumber(run.goldEarned)} gold earned`, W / 2, 486, {
      size: 14,
      font: FONT_BODY,
      color: rgba(COLORS.parchment, 0.75),
      align: 'center',
    });
    ctx.restore();
  }
}

// helpers that keep long button calls readable
const uib = (
  ctx: Ctx2D,
  ui: RunHost['ui'],
  id: string,
  r: Rect,
  label: string,
  opts: ButtonOpts,
): boolean => ui.button(ctx, id, r, label, opts);

const cardTitleShort = (card: Card): string => {
  if (card.kind === 'sigil') return SIGIL_BY_ID[card.id]?.name ?? 'Sigil';
  if (card.kind === 'rune') return RUNE_BY_ID[card.id]?.name ?? 'Rune';
  if (card.kind === 'relic') return RELIC_BY_ID[card.id]?.name ?? 'Relic';
  return 'Gold';
};
