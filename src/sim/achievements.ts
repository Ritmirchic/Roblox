/**
 * Achievement engine with UTC-anchored rotating periods.
 *
 * Period index = floor(utcMillis / periodLength). When the index changes the slate is
 * regenerated deterministically from that index, progress resets and unclaimed rewards expire.
 * Claims are recorded per (period index, achievement id) so a reward can never be claimed twice.
 */
import {
  PERIOD_COUNT, PERIOD_MS, TEMPLATES_BY_PERIOD,
  type AchievementTemplate, type Period, type StatKey,
} from '../data/achievements.ts';
import { RNG } from '../core/rng.ts';

export interface ActiveAchievement {
  key: string;             // `${period}:${periodIndex}:${templateId}`
  templateId: string;
  period: Period;
  periodIndex: number;
  name: string;
  description: string;
  stat: StatKey;
  target: number;
  crystals: number;
  rarity: AchievementTemplate['rarity'];
  motif: AchievementTemplate['motif'];
  artSeed: number;
  progress: number;
  claimed: boolean;
  completedAt?: number;
}

export interface AchievementSaveState {
  /** Progress per active key. */
  progress: Record<string, number>;
  /** Claimed keys (永久 record for the current period only - pruned on rotation). */
  claimed: Record<string, boolean>;
  /** Last seen period index per period type. */
  periodIndex: Partial<Record<Period, number>>;
  /** Lifetime counters used by weekly/global objectives. */
  lifetime: Partial<Record<StatKey, number>>;
  /** Total crystals earned from achievements. */
  totalCrystals: number;
  completedCount: number;
}

export function emptyAchievementState(): AchievementSaveState {
  return { progress: {}, claimed: {}, periodIndex: {}, lifetime: {}, totalCrystals: 0, completedCount: 0 };
}

export function periodIndexFor(period: Period, nowMs: number): number {
  return Math.floor(nowMs / PERIOD_MS[period]);
}

export function periodEndsAt(period: Period, nowMs: number): number {
  return (periodIndexFor(period, nowMs) + 1) * PERIOD_MS[period];
}

/** Scale a template target by the player's progression tier, rounded to friendly numbers. */
export function scaleTarget(t: AchievementTemplate, tier: number): number {
  const raw = t.base * Math.pow(t.tierScale, Math.max(0, tier - 1));
  if (raw < 10) return Math.max(1, Math.round(raw));
  if (raw < 100) return Math.round(raw / 5) * 5;
  if (raw < 1000) return Math.round(raw / 10) * 10;
  if (raw < 100000) return Math.round(raw / 100) * 100;
  return Math.round(raw / 1000) * 1000;
}

/** Deterministic slate for a given period index: same index -> same achievements. */
export function slateFor(period: Period, periodIndex: number, tier: number): ActiveAchievement[] {
  const templates = TEMPLATES_BY_PERIOD[period];
  const count = Math.min(PERIOD_COUNT[period], templates.length);
  const rng = new RNG((periodIndex * 2654435761 + period.length * 97 + period.charCodeAt(0) * 7919) >>> 0);
  const pool = rng.shuffle([...templates]);
  const chosen = pool.slice(0, count);
  return chosen.map((t) => ({
    key: `${period}:${periodIndex}:${t.id}`,
    templateId: t.id,
    period,
    periodIndex,
    name: t.name,
    description: t.description,
    stat: t.stat,
    target: scaleTarget(t, tier),
    crystals: t.crystals,
    rarity: t.rarity,
    motif: t.motif,
    artSeed: t.artSeed,
    progress: 0,
    claimed: false,
  }));
}

export class AchievementEngine {
  state: AchievementSaveState;
  active: ActiveAchievement[] = [];
  tier = 1;
  /** Called when a period rotates so the UI can refresh / notify. */
  onRotate?: (period: Period) => void;

  constructor(state: AchievementSaveState = emptyAchievementState()) {
    this.state = state;
  }

  /** Rebuild the active slate, rotating any expired periods. Safe to call every frame. */
  refresh(nowMs: number, tier = this.tier): ActiveAchievement[] {
    this.tier = tier;
    const periods: Period[] = ['minute', 'hourly', 'daily', 'weekly'];
    const next: ActiveAchievement[] = [];
    for (const p of periods) {
      const idx = periodIndexFor(p, nowMs);
      const prev = this.state.periodIndex[p];
      if (prev !== idx) {
        // Rotation: drop stale progress + claims for this period (offline time handled naturally).
        for (const key of Object.keys(this.state.progress)) {
          if (key.startsWith(`${p}:`) && !key.startsWith(`${p}:${idx}:`)) delete this.state.progress[key];
        }
        for (const key of Object.keys(this.state.claimed)) {
          if (key.startsWith(`${p}:`) && !key.startsWith(`${p}:${idx}:`)) delete this.state.claimed[key];
        }
        this.state.periodIndex[p] = idx;
        if (prev !== undefined) this.onRotate?.(p);
      }
      for (const a of slateFor(p, idx, tier)) {
        a.progress = this.state.progress[a.key] ?? 0;
        a.claimed = !!this.state.claimed[a.key];
        next.push(a);
      }
    }
    this.active = next;
    return next;
  }

  /** Feed gameplay counters. Lifetime stats also accumulate for the collection album. */
  track(stat: StatKey, amount: number, nowMs = Date.now()): void {
    if (amount <= 0) return;
    this.state.lifetime[stat] = (this.state.lifetime[stat] ?? 0) + amount;
    this.refresh(nowMs);
    for (const a of this.active) {
      if (a.stat !== stat || a.claimed) continue;
      const cur = this.state.progress[a.key] ?? 0;
      if (cur >= a.target) continue;
      const nextVal = Math.min(a.target, cur + amount);
      this.state.progress[a.key] = nextVal;
      a.progress = nextVal;
      if (nextVal >= a.target) a.completedAt = nowMs;
    }
  }

  /** Absolute-value objectives (e.g. "own 12 cards") set rather than add. */
  setStat(stat: StatKey, value: number, nowMs = Date.now()): void {
    this.state.lifetime[stat] = Math.max(this.state.lifetime[stat] ?? 0, value);
    this.refresh(nowMs);
    for (const a of this.active) {
      if (a.stat !== stat || a.claimed) continue;
      const nextVal = Math.min(a.target, value);
      if (nextVal > (this.state.progress[a.key] ?? 0)) {
        this.state.progress[a.key] = nextVal;
        a.progress = nextVal;
      }
    }
  }

  isComplete(a: ActiveAchievement): boolean {
    return (this.state.progress[a.key] ?? 0) >= a.target;
  }

  /** Claims a reward exactly once. Returns the crystal payout (0 when invalid). */
  claim(key: string, nowMs = Date.now()): number {
    this.refresh(nowMs);
    const a = this.active.find((x) => x.key === key);
    if (!a) return 0;
    if (this.state.claimed[key]) return 0;           // duplicate claim prevention
    if ((this.state.progress[key] ?? 0) < a.target) return 0;
    this.state.claimed[key] = true;
    a.claimed = true;
    this.state.totalCrystals += a.crystals;
    this.state.completedCount += 1;
    return a.crystals;
  }

  claimAllReady(nowMs = Date.now()): number {
    this.refresh(nowMs);
    let total = 0;
    for (const a of [...this.active]) {
      if (!a.claimed && this.isComplete(a)) total += this.claim(a.key, nowMs);
    }
    return total;
  }

  msUntilReset(period: Period, nowMs = Date.now()): number {
    return periodEndsAt(period, nowMs) - nowMs;
  }
}

export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
