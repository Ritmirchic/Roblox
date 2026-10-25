/** Application shell: canvas sizing, input, save data, audio and screens. */
import { AudioEngine } from '../core/audio';
import { COLORS, FAMILY_COLORS, FONT_BODY, FONT_DISPLAY, rgba } from '../core/palette';
import { clamp, dailySeedFor, formatNumber, todayKey } from '../core/math';
import { META_BY_ID, computeMetaBuffs, embersForRun, nodeCost, nodeRank } from '../game/data/meta';
import { ACHIEVEMENTS } from '../game/data/achievements';
import { ENEMY_BY_ID } from '../game/data/enemies';
import { FAMILY_BY_ID } from '../game/data/families';
import { SIGIL_BY_ID } from '../game/data/sigils';
import { ELDER_BY_ID } from '../game/data/elders';
import { SAVE_SCHEMA } from '../game/data/schema';
import {
  clearSave,
  defaultSave,
  getStorage,
  loadSave,
  saveGame,
  type SaveData,
} from '../core/save';
import { drawText, fillRoundRect, strokeRoundRect, type Ctx2D } from '../game/render/art';
import {
  abandonRun,
  consumeEvents,
  createRun,
  towerDef,
  type Run,
} from '../game/sim/engine';
import type { RunSummary } from '../game/types';
import { RunScreen } from './runScreen';
import {
  renderCodex,
  renderEmberworks,
  renderLedger,
  renderMenu,
  renderResults,
  renderSettings,
} from './screens';
import { Ui } from './ui';
import type { AppLike, ResultData, RunHost, RunMode, ScreenId, Toast } from './appTypes';

const W = 1600;
const H = 900;

export class App implements RunHost {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ui = new Ui();
  audio = new AudioEngine();
  save: SaveData;
  screen: ScreenId = 'menu';
  runScreen: RunScreen | null = null;
  speed = 1;
  toasts: Toast[] = [];
  lastResult: ResultData | null = null;
  runActive = false;
  time = 0;
  settingsReturn: ScreenId = 'menu';

  private storage = getStorage();
  private dpr = 1;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private lastFrame = 0;
  private running = false;
  private rewardsApplied = true;
  private codexAtRunStart = 0;
  private lastCodexPersist = 0;
  private recoveredSave = false;
  private lastMusicIntensity = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
    this.ctx = ctx;
    const loaded = loadSave(this.storage, SAVE_SCHEMA);
    this.save = loaded.data;
    this.recoveredSave = loaded.recovered;
    this.ui.sfx = (name) => this.audio.play(name);
    this.audio.setVolumes({
      master: this.save.settings.master,
      music: this.save.settings.music,
      sfx: this.save.settings.sfx,
    });
    this.bindEvents();
    this.resize();
    this.persist();
    if (this.recoveredSave) {
      this.toast('Your save was corrupted — a fresh ledger was started.', COLORS.danger);
    }
    if (typeof document !== 'undefined') {
      const boot = document.getElementById('boot');
      if (boot) {
        boot.classList.add('boot-out');
        window.setTimeout(() => boot.remove(), 420);
      }
    }
  }

  // ── RunHost surface ──────────────────────────────────────────────────────

  get run(): Run {
    if (!this.runScreen) throw new Error('No active run');
    return this.runScreen.run;
  }

  get fx() {
    if (!this.runScreen) throw new Error('No active run');
    return this.runScreen.fx;
  }

  setSpeed(value: number): void {
    this.speed = clamp(value, 1, 2);
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = clamp((now - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = now;
    this.time += dt;

    if (this.screen === 'run' && this.runScreen) {
      this.runScreen.update(dt);
    }
    for (const toast of this.toasts) toast.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);

    this.ui.beginFrame(dt);
    this.render(dt);
    this.ui.drawTooltips(this.ctx);
    this.ui.endFrame();
    this.updateCursor();
    this.updateMusic();

    requestAnimationFrame(this.tick);
  };

  private updateCursor(): void {
    const pointer = this.ui.hovering ? 'pointer' : 'default';
    if (this.canvas.style.cursor !== pointer) this.canvas.style.cursor = pointer;
  }

  private updateMusic(): void {
    let intensity = 0.12;
    if (this.screen === 'run' && this.runScreen) {
      const run = this.runScreen.run;
      if (run.phase === 'wave') {
        const threat = clamp(run.enemies.length / 22, 0, 1);
        intensity = 0.5 + threat * 0.45;
      } else if (run.phase === 'draft') {
        intensity = 0.32;
      } else {
        intensity = 0.2;
      }
      if (run.hearth / run.hearthMax < 0.3) intensity = Math.min(1, intensity + 0.15);
    } else if (this.screen === 'results') {
      intensity = 0.2;
    }
    if (Math.abs(intensity - this.lastMusicIntensity) > 0.02) {
      this.lastMusicIntensity = intensity;
      this.audio.setMusicIntensity(intensity);
    }
  }

  // ── input ────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const toDesign = (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - this.offsetX) / this.scale,
        y: (clientY - rect.top - this.offsetY) / this.scale,
      };
    };

    this.canvas.addEventListener('pointermove', (e) => {
      const p = toDesign(e.clientX, e.clientY);
      this.ui.onPointerMove(p.x, p.y);
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      this.unlockAudio();
      const p = toDesign(e.clientX, e.clientY);
      this.ui.onPointerDown(p.x, p.y);
      if (!this.ui.isHoveredAnywhere) {
        // clicking empty space dismisses nothing; keep focus on the canvas
      }
      this.canvas.setPointerCapture?.(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', (e) => {
      const p = toDesign(e.clientX, e.clientY);
      this.ui.onPointerUp(p.x, p.y);
      try {
        this.canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.ui.onPointerMove(-999, -999);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      this.unlockAudio();
      if (e.repeat) return;
      const code = e.code;
      if (this.screen === 'run' && this.runScreen) {
        if (this.runScreen.onKey(code)) {
          e.preventDefault();
          return;
        }
      }
      if (code === 'KeyM') {
        const muted = this.save.settings.master > 0.01;
        this.setVolume('master', muted ? 0 : 0.8);
        this.toast(muted ? 'Muted' : 'Sound on');
        return;
      }
      if (code === 'Escape') {
        if (this.screen === 'settings') this.go(this.settingsReturn);
        else if (this.screen === 'emberworks' || this.screen === 'codex' || this.screen === 'ledger') this.go('menu');
        else if (this.screen === 'results') this.go('menu');
      }
      if ((code === 'Space' || code === 'Enter') && this.screen === 'menu') {
        this.startRun('vigil');
        e.preventDefault();
      }
    });

    window.addEventListener('resize', () => this.resize());
    const persist = () => this.persist();
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.persist();
        this.audio.suspend();
      } else {
        this.audio.resume();
      }
    });
    window.addEventListener('error', (event) => {
      // Keep the game playable and surface the problem instead of dying silently.
      console.error('Runtime error', event.error ?? event.message);
      this.toast('A hitch in the lantern — details in the console.', COLORS.danger);
    });
  }

  private unlockAudio(): void {
    if (!this.audio.isUnlocked) {
      this.audio.unlock();
      this.audio.setVolumes({
        master: this.save.settings.master,
        music: this.save.settings.music,
        sfx: this.save.settings.sfx,
      });
    }
  }

  private resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.scale = Math.min(width / W, height / H);
    this.offsetX = (width - W * this.scale) / 2;
    this.offsetY = (height - H * this.scale) / 2;
  }

  // ── navigation ───────────────────────────────────────────────────────────

  go(screen: ScreenId): void {
    if (screen === 'run' && !this.runScreen) {
      this.screen = 'menu';
      return;
    }
    if (screen === 'results' && !this.lastResult) {
      this.screen = 'menu';
      return;
    }
    if (this.screen === 'settings' || screen === 'settings') {
      // remember where settings was opened from
      if (screen === 'settings') {
        this.settingsReturn = this.screen === 'run' ? 'run' : this.screen === 'results' ? 'results' : 'menu';
        if (this.screen === 'run' && this.runScreen) this.runScreen.state.pauseOpen = true;
      }
    }
    this.screen = screen;
    this.persist();
  }

  resumeRun(): void {
    if (this.runScreen) {
      this.screen = 'run';
    }
  }

  abandonRunToMenu(): void {
    if (this.runScreen) {
      this.finishRun(true);
    } else {
      this.go('menu');
    }
  }

  // ── run lifecycle ────────────────────────────────────────────────────────

  startRun(mode: RunMode): void {
    const seed = mode === 'daily' ? dailySeedFor(new Date()) : (Math.random() * 0xffffffff) >>> 0;
    const config = {
      mode,
      seed,
      dayKey: mode === 'daily' ? todayKey(new Date()) : undefined,
    };
    const buffs = computeMetaBuffs(this.save.meta);
    const run = createRun(config, this.save.meta, buffs);
    this.runScreen = new RunScreen(this, run);
    this.speed = 1;
    this.screen = 'run';
    this.runActive = true;
    this.rewardsApplied = false;
    this.codexAtRunStart = Object.keys(this.save.codex).length;
    this.save.stats.runs++;
    this.lastResult = null;
    this.ui.sfx('draft');
    this.audio.unlock();
    this.audio.setVolumes({
      master: this.save.settings.master,
      music: this.save.settings.music,
      sfx: this.save.settings.sfx,
    });
    this.syncFxPreferences();
    this.persist();
    this.toast(`${modeName(mode)} begins · seed ${seed.toString(16).slice(0, 6)}`);
  }

  restartRun(): void {
    if (!this.runScreen) return;
    const mode = this.runScreen.run.config.mode;
    // A restart banks the abandoned run (embers, codex) and opens a fresh one.
    this.finishRun(true);
    this.startRun(mode);
  }

  finishRun(abandon = false): void {
    if (!this.runScreen || this.rewardsApplied) {
      if (!this.runScreen) this.go('menu');
      return;
    }
    this.rewardsApplied = true;
    const screen = this.runScreen;
    const run = screen.run;
    let summary: RunSummary;
    if (run.summary) {
      summary = run.summary;
    } else {
      summary = abandonRun(run);
    }
    if (abandon) summary.victory = false;
    if (!summary.embers) {
      summary.embers = embersForRun({
        wave: summary.wave,
        kills: summary.kills,
        bosses: summary.bossesKilled,
        victory: summary.victory,
        mode: this.runScreen.run.config.mode,
      });
    }

    this.syncCodex();
    const codexAfter = Object.keys(this.save.codex).length;
    const bestBefore = this.save.stats.deepestWave;
    const isBestWave = summary.wave > bestBefore;

    // Stats first, so achievements can see this run's totals.
    const stats = this.save.stats;
    stats.kills += summary.kills;
    stats.leaks += summary.leaks;
    stats.fusions += summary.fusions;
    stats.elders += summary.elders;
    stats.goldEarned += summary.goldEarned;
    stats.playSeconds += summary.time;
    stats.deepestWave = Math.max(stats.deepestWave, summary.wave);
    if (summary.mode === 'daily') stats.bestDailyWave = Math.max(stats.bestDailyWave, summary.wave);
    if (summary.victory) {
      stats.wins++;
      this.save.meta.act1Cleared = true;
    }
    const dominant = dominantFamily(summary);
    if (dominant) {
      stats.familyRuns[dominant] = (stats.familyRuns[dominant] ?? 0) + 1;
      if (summary.victory) stats.familyWins[dominant] = (stats.familyWins[dominant] ?? 0) + 1;
    }
    this.save.meta.embers += summary.embers;
    this.save.meta.embersEarned += summary.embers;

    const newAchievements: string[] = [];
    let bonusEmbers = 0;
    for (const ach of ACHIEVEMENTS) {
      if ((this.save.achievements[ach.id] ?? 0) > 0) continue;
      if (ach.check({ save: this.save, summary })) {
        this.save.achievements[ach.id] = Date.now();
        newAchievements.push(ach.id);
        bonusEmbers += ach.reward;
      }
    }
    if (bonusEmbers > 0) {
      this.save.meta.embers += bonusEmbers;
      this.save.meta.embersEarned += bonusEmbers;
    }

    this.lastResult = {
      summary,
      newAchievements,
      newCodex: Math.max(0, codexAfter - this.codexAtRunStart),
      isBestWave,
    };
    this.runActive = false;
    this.screen = 'results';
    this.speed = 1;
    this.ui.sfx(summary.victory ? 'victory' : 'defeat');
    this.persist();
    if (newAchievements.length > 0) {
      this.audio.play('unlock');
      this.toast(`${newAchievements.length} new oath${newAchievements.length > 1 ? 's' : ''} sworn.`, COLORS.gold);
    }
  }

  private syncFxPreferences(): void {
    if (!this.runScreen) return;
    this.runScreen.fx.reducedMotion = this.save.settings.reducedMotion;
  }

  consumeRunEvents(): void {
    if (!this.runScreen) return;
    const run = this.runScreen.run;
    const fx = this.runScreen.fx;
    const events = consumeEvents(run);
    let damageBudget = 14;
    const showDamage = this.save.settings.damageNumbers;
    for (const ev of events) {
      switch (ev.t) {
        case 'shoot': {
          if (ev.towerUid !== undefined) {
            const tower = run.towers.find((t) => t.uid === ev.towerUid);
            if (tower) {
              this.audio.play(
                tower.family === 'ember'
                  ? 'shoot'
                  : tower.family === 'frost'
                    ? 'shootFrost'
                    : tower.family === 'verdant'
                      ? 'shootVerdant'
                      : tower.family === 'volt'
                        ? 'shootVolt'
                        : 'shootUmbral',
                { volume: 0.7 },
              );
            }
          }
          break;
        }
        case 'beam': {
          if (ev.towerUid !== undefined && ev.x !== undefined && ev.y !== undefined) {
            const tower = run.towers.find((t) => t.uid === ev.towerUid);
            if (tower) {
              run.beams.push({
                uid: 900000 + Math.floor(Math.random() * 90000),
                towerUid: tower.uid,
                targetUid: ev.uid ?? 0,
                x1: tower.x,
                y1: tower.y,
                x2: ev.x,
                y2: ev.y,
                life: 0.14,
                maxLife: 0.14,
                family: tower.family,
                width: 2,
              });
              fx.burst(ev.x, ev.y, FAMILY_COLORS[tower.family].bright, 4, {
                kind: 'spark',
                speed: 70,
                size: 2,
                life: 0.3,
              });
            }
          }
          break;
        }
        case 'hit': {
          if (ev.x === undefined || ev.y === undefined || ev.amount === undefined) break;
          if (showDamage && damageBudget > 0 && ev.amount >= 1) {
            damageBudget--;
            const color = ev.family ? FAMILY_COLORS[ev.family].bright : COLORS.parchment;
            fx.text(
              ev.x,
              ev.y,
              ev.crit ? `${ev.amount}!` : `${ev.amount}`,
              ev.crit ? COLORS.goldBright : color,
              ev.crit ? 17 : 12,
              ev.crit,
            );
          }
          break;
        }
        case 'kill': {
          if (ev.x === undefined || ev.y === undefined) break;
          const def = ev.text ? ENEMY_BY_ID[ev.text] : undefined;
          const color = def?.color ?? COLORS.parchment;
          fx.burst(ev.x, ev.y, color, def?.boss ? 40 : 9, {
            kind: 'wax',
            speed: def?.boss ? 160 : 80,
            size: def?.boss ? 3.4 : 2,
            life: 0.6,
            gravity: 40,
          });
          if (def?.boss) {
            fx.addShake(9);
            fx.ring(ev.x, ev.y, COLORS.gold, 120);
          }
          if ((ev.amount ?? 0) >= 12) fx.gold(ev.x, ev.y, ev.amount ?? 0);
          this.audio.play('kill', { volume: 0.6 });
          if (ev.text) this.recordEnemy(ev.text);
          break;
        }
        case 'leak': {
          fx.addShake(11);
          fx.burst(1090, 730, COLORS.danger, 26, { kind: 'ember', speed: 120, size: 2.6, life: 0.8 });
          if ((ev.amount ?? 0) > 0) {
            fx.text(1090, 690, `-${ev.amount} hearth`, '#ff8f8a', 17);
          }
          this.audio.play('leak');
          break;
        }
        case 'heal': {
          if (ev.x === undefined || ev.y === undefined) break;
          fx.burst(ev.x, ev.y, COLORS.heal, 8, { kind: 'star', speed: 44, size: 2.2, life: 0.7, gravity: -20 });
          if (ev.amount) fx.text(ev.x, ev.y - 10, `+${ev.amount}`, COLORS.heal, 13);
          if (ev.text) fx.text(ev.x, ev.y - 20, ev.text, COLORS.heal, 12);
          this.audio.play('heal', { volume: 0.5 });
          break;
        }
        case 'pulse': {
          if (ev.x !== undefined && ev.y !== undefined) {
            const radius = ev.amount && ev.amount > 20 ? Math.min(180, ev.amount) : 60;
            fx.burst(ev.x, ev.y, ev.family ? FAMILY_COLORS[ev.family].base : COLORS.gold, 10, {
              kind: 'spark',
              speed: radius * 3.6,
              size: 2.4,
              life: 0.32,
            });
          }
          break;
        }
        case 'waveClear': {
          this.audio.play('waveClear');
          if (ev.amount) this.toast(`Wave cleared · +${formatNumber(ev.amount)} gold`, COLORS.gold);
          break;
        }
        case 'waveStart': {
          fx.addShake(2);
          break;
        }
        case 'boss': {
          if (ev.text) this.toast(ev.text, '#ffb08a');
          break;
        }
        case 'draft': {
          this.audio.play('draft', { volume: 0.6 });
          break;
        }
        case 'victory': {
          this.audio.play('victory');
          break;
        }
        case 'gameOver': {
          this.audio.play('defeat');
          fx.addShake(14);
          break;
        }
        default:
          break;
      }
    }
  }

  // ── codex & persistence ──────────────────────────────────────────────────

  syncCodex(): void {
    if (!this.runScreen) return;
    const run = this.runScreen.run;
    let changed = false;
    const mark = (key: string): void => {
      if (!this.save.codex[key]) {
        this.save.codex[key] = Date.now();
        changed = true;
      }
    };
    for (const tower of run.towers) {
      if (tower.elder) mark(`elder:${tower.sigilId}`);
      else mark(`sigil:${tower.sigilId}`);
    }
    for (const card of run.hand) {
      if (card.kind === 'sigil') mark(`sigil:${card.id}`);
      else if (card.kind === 'rune') mark(`rune:${card.id}`);
      else if (card.kind === 'relic') mark(`relic:${card.id}`);
    }
    for (const relic of run.relics) mark(`relic:${relic}`);
    if (changed || this.time - this.lastCodexPersist > 2) {
      this.lastCodexPersist = this.time;
      this.persist();
    }
  }

  private recordEnemy(typeId: string): void {
    const key = `enemy:${typeId}`;
    let changed = false;
    if (!this.save.codex[key]) {
      this.save.codex[key] = Date.now();
      changed = true;
    }
    if (!this.save.bestiary.includes(typeId)) {
      this.save.bestiary.push(typeId);
      changed = true;
    }
    if (changed) this.persist();
  }

  persist(): void {
    saveGame(this.storage, this.save);
  }

  get storageAvailable(): boolean {
    return this.storage !== null;
  }

  // ── settings & meta ──────────────────────────────────────────────────────

  setVolume(kind: 'master' | 'music' | 'sfx', value: number): void {
    this.save.settings[kind] = clamp(value, 0, 1);
    this.audio.setVolumes({
      master: this.save.settings.master,
      music: this.save.settings.music,
      sfx: this.save.settings.sfx,
    });
    this.persist();
  }

  setToggle(kind: 'damageNumbers' | 'screenShake' | 'reducedMotion', value: boolean): void {
    this.save.settings[kind] = value;
    if (kind === 'reducedMotion' && this.runScreen) {
      this.runScreen.fx.reducedMotion = value;
    }
    this.persist();
  }

  quickSaveSettings(): void {
    this.persist();
  }

  buyMetaNode(id: string): void {
    const node = META_BY_ID[id];
    if (!node) return;
    const cost = nodeCost(this.save.meta, node);
    if (cost === null) {
      this.toast('Already mastered.', COLORS.stoneLight);
      return;
    }
    if (this.save.meta.embers < cost) {
      this.toast(`Needs ${cost} embers.`, COLORS.danger);
      this.audio.play('deny');
      return;
    }
    this.save.meta.embers -= cost;
    this.save.meta.nodes[id] = nodeRank(this.save.meta, id) + 1;
    if (node.unlocksFamily && !this.save.meta.unlockedFamilies.includes(node.unlocksFamily)) {
      this.save.meta.unlockedFamilies.push(node.unlocksFamily);
      const fam = FAMILY_BY_ID[node.unlocksFamily];
      this.toast(`${fam.name} sigils join every future draft.`, fam.color);
      this.audio.play('unlock');
    } else {
      this.toast(`${node.name} improved.`, COLORS.gold);
      this.audio.play('upgrade');
    }
    this.persist();
  }

  isFamilyUnlocked(id: string): boolean {
    return computeMetaBuffs(this.save.meta).unlockedFamilies.includes(id as never);
  }

  resetProgress(): void {
    clearSave(this.storage);
    this.save = defaultSave();
    this.runScreen = null;
    this.lastResult = null;
    this.runActive = false;
    this.screen = 'menu';
    this.audio.setVolumes({
      master: this.save.settings.master,
      music: this.save.settings.music,
      sfx: this.save.settings.sfx,
    });
    this.persist();
    this.toast('The ledger is blank again.', COLORS.parchment);
    this.audio.play('uiBack');
  }

  refreshAudio(): void {
    this.audio.setVolumes({
      master: this.save.settings.master,
      music: this.save.settings.music,
      sfx: this.save.settings.sfx,
    });
  }

  toast(text: string, color: string = COLORS.parchment): void {
    this.toasts.push({ text, color, life: 3.4, maxLife: 3.4 });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  dailySeedLabel(): string {
    const key = todayKey(new Date());
    return `${key} UTC · fixed seed`;
  }

  // ── rendering ────────────────────────────────────────────────────────────

  private render(dt: number): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, this.offsetX * this.dpr, this.offsetY * this.dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.fillStyle = '#070a0d';
    ctx.fillRect(0, 0, W, H);

    switch (this.screen) {
      case 'menu':
        renderMenu(ctx, this);
        break;
      case 'emberworks':
        renderEmberworks(ctx, this);
        break;
      case 'codex':
        renderCodex(ctx, this);
        break;
      case 'ledger':
        renderLedger(ctx, this);
        break;
      case 'settings':
        renderSettings(ctx, this);
        break;
      case 'results':
        renderResults(ctx, this);
        break;
      case 'run':
        if (this.runScreen) {
          this.runScreen.render(ctx);
        } else {
          this.screen = 'menu';
        }
        break;
      default:
        break;
    }

    if (this.screen !== 'results') this.renderToasts(ctx);
    ctx.restore();
  }

  private renderToasts(ctx: Ctx2D): void {
    if (this.toasts.length === 0) return;
    let y = H - 74;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const toast = this.toasts[i];
      if (!toast) continue;
      const alpha = clamp(toast.life / 0.5, 0, 1) * clamp((toast.maxLife - toast.life) / 0.2, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `normal 13px ${FONT_BODY}`;
      const width = Math.min(680, ctx.measureText(toast.text).width + 40);
      const x = W / 2 - width / 2;
      fillRoundRect(ctx, x, y - 20, width, 32, 8, 'rgba(8,10,14,0.9)');
      strokeRoundRect(ctx, x, y - 20, width, 32, 8, rgba(COLORS.gold, 0.25), 1);
      drawText(ctx, toast.text, W / 2, y + 1, {
        size: 13,
        font: FONT_BODY,
        color: toast.color,
        align: 'center',
        maxWidth: width - 24,
      });
      ctx.restore();
      y -= 38;
    }
  }
}

const modeName = (mode: RunMode): string => {
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

const dominantFamily = (summary: RunSummary): keyof typeof FAMILY_COLORS | null => {
  const counts: Record<string, number> = {};
  for (const tower of summary.towers) counts[tower.family] = (counts[tower.family] ?? 0) + 1;
  let best: string | null = null;
  let bestCount = 0;
  for (const [family, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = family;
      bestCount = count;
    }
  }
  return best as keyof typeof FAMILY_COLORS | null;
};

/** Exposed for debugging in the browser console. */
export const appInfo = {
  towerDef,
  SIGIL_BY_ID,
  ELDER_BY_ID,
};
