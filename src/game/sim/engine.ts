/**
 * Pure-ish game simulation. No DOM, no canvas, no audio: everything here can
 * be driven headlessly by the test suite at fixed timesteps.
 */
import { Rng } from '../../core/rng';
import { clamp, dist } from '../../core/math';
import type {
  Beam,
  Card,
  ElderDef,
  Enemy,
  FamilyId,
  Projectile,
  RelicEffect,
  RunConfig,
  RunSummary,
  SigilDef,
  SigilFlag,
  SimEvent,
  StatusApply,
  StatusId,
  TargetMode,
  Tower,
} from '../types';
import { SIGIL_BY_ID, TIER_SCALE, FUSE_COST } from '../data/sigils';
import { ELDER_BY_ID, elderForFamily } from '../data/elders';
import { ENEMY_BY_ID, waveDef } from '../data/enemies';
import { RUNE_BY_ID } from '../data/runes';
import { RELIC_BY_ID } from '../data/relics';
import { computeMetaBuffs, embersForRun, type MetaBuffs } from '../data/meta';
import { HEARTH, PATH_LENGTH, PLOTS, SPAWN, samplePath } from './map';
import { draftCards, sigilCardCostGold, type DraftContext } from './draft';
import type { MetaState } from '../../core/save';

export const BASE_HEARTH = 100;
export const BASE_GOLD = 145;
export const BASE_HAND = 4;
export const REROLL_COST = 20;
export const FINAL_WAVE = 15;

export type RunPhase = 'draft' | 'prep' | 'wave' | 'over' | 'victory';

type AnySigil = SigilDef | ElderDef;

export interface RelicTotals {
  damageMult: number;
  speedMult: number;
  rangeFlat: number;
  hearthMax: number;
  goldOnKill: number;
  waveBonusGold: number;
  interest: number;
  critChance: number;
  critMult: number;
  startGold: number;
  handSlot: number;
  socket: number;
  reroll: number;
  healPerWave: number;
  killHealEvery: number;
  bossDamageMult: number;
  statusPowerMult: number;
  offerCount: number;
  emberBonus: number;
  leakShield: number;
  firstLeakFree: boolean;
  cheapFuse: number;
  burnDps: number;
  sigilCostMult: number;
}

export const relicTotals = (ids: string[]): RelicTotals => {
  const totals: RelicTotals = {
    damageMult: 0,
    speedMult: 0,
    rangeFlat: 0,
    hearthMax: 0,
    goldOnKill: 0,
    waveBonusGold: 0,
    interest: 0,
    critChance: 0,
    critMult: 0,
    startGold: 0,
    handSlot: 0,
    socket: 0,
    reroll: 0,
    healPerWave: 0,
    killHealEvery: 0,
    bossDamageMult: 0,
    statusPowerMult: 0,
    offerCount: 0,
    emberBonus: 0,
    leakShield: 0,
    firstLeakFree: false,
    cheapFuse: 0,
    burnDps: 0,
    sigilCostMult: 1,
  };
  for (const id of ids) {
    const relic = RELIC_BY_ID[id];
    if (!relic) continue;
    const e: RelicEffect = relic.effect;
    if (e.damageMult) totals.damageMult += e.damageMult;
    if (e.speedMult) totals.speedMult += e.speedMult;
    if (e.rangeFlat) totals.rangeFlat += e.rangeFlat;
    if (e.hearthMax) totals.hearthMax += e.hearthMax;
    if (e.goldOnKill) totals.goldOnKill += e.goldOnKill;
    if (e.waveBonusGold) totals.waveBonusGold += e.waveBonusGold;
    if (e.interest) totals.interest += e.interest;
    if (e.critChance) totals.critChance += e.critChance;
    if (e.critMult) totals.critMult += e.critMult;
    if (e.startGold) totals.startGold += e.startGold;
    if (e.handSlot) totals.handSlot += e.handSlot;
    if (e.socket) totals.socket += e.socket;
    if (e.reroll) totals.reroll += e.reroll;
    if (e.healPerWave) totals.healPerWave += e.healPerWave;
    if (e.killHealEvery) totals.killHealEvery = Math.max(totals.killHealEvery, e.killHealEvery);
    if (e.bossDamageMult) totals.bossDamageMult += e.bossDamageMult;
    if (e.statusPowerMult) totals.statusPowerMult += e.statusPowerMult;
    if (e.offerCount) totals.offerCount += e.offerCount;
    if (e.emberBonus) totals.emberBonus += e.emberBonus;
    if (e.leakShield) totals.leakShield += e.leakShield;
    if (e.firstLeakFree) totals.firstLeakFree = true;
    if (e.cheapFuse) totals.cheapFuse = Math.max(totals.cheapFuse, e.cheapFuse);
    if (e.burnDps) totals.burnDps += e.burnDps;
    if (e.sigilCostMult) totals.sigilCostMult *= e.sigilCostMult;
  }
  return totals;
};

export interface SpawnEntry {
  type: string;
  at: number;
  hpScale: number;
}

export interface Run {
  config: RunConfig;
  seed: number;
  rng: Rng;
  phase: RunPhase;
  wave: number;
  gold: number;
  hearth: number;
  hearthMax: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  beams: Beam[];
  hand: Card[];
  relics: string[];
  relicFx: RelicTotals;
  draft: Card[];
  draftWave: number;
  freeRerolls: number;
  families: FamilyId[];
  meta: MetaBuffs;
  spawns: SpawnEntry[];
  waveTime: number;
  hpScale: number;
  events: SimEvent[];
  time: number;
  kills: number;
  leaks: number;
  fusions: number;
  elders: number;
  goldEarned: number;
  maxGold: number;
  lostHearth: number;
  bossesKilled: number;
  damageByFamily: Record<FamilyId, number>;
  familiesUsed: FamilyId[];
  firstLeakUsed: boolean;
  leakShieldUsed: boolean;
  killedSinceHeal: number;
  uidSeq: number;
  bossWave: boolean;
  completed: boolean;
  summary?: RunSummary;
  notes: string[];
}

export const towerDef = (tower: Tower): AnySigil =>
  (tower.elder ? ELDER_BY_ID[tower.sigilId] : SIGIL_BY_ID[tower.sigilId]) ?? (SIGIL_BY_ID.cinder_lance as SigilDef);

export const handCapacity = (run: Run): number =>
  BASE_HAND + run.meta.handBonus + run.relicFx.handSlot;

export const isElderTower = (tower: Tower): boolean => tower.elder;

const critBase = (tier: number): number =>
  (TIER_SCALE.crit[clamp(tier, 1, 3) - 1] as number) ?? 0.05;

export const baseTierScale = (tier: number) => {
  const idx = clamp(tier, 1, 3) - 1;
  return {
    damage: TIER_SCALE.damage[idx] as number,
    interval: TIER_SCALE.interval[idx] as number,
    range: TIER_SCALE.range[idx] as number,
    area: TIER_SCALE.area[idx] as number,
    sockets: TIER_SCALE.sockets[idx] as number,
  };
};

export const hpScaleForWave = (wave: number, mode: RunConfig['mode']): number => {
  const w = Math.max(1, wave);
  const base = 1 + 0.105 * (w - 1) + 0.009 * (w - 1) * (w - 1);
  const modeMult = mode === 'nightfall' ? 1.32 : 1;
  const endlessMult = mode === 'endless' ? 1.05 : 1;
  return base * modeMult * endlessMult;
};

const modeStartGold = (mode: RunConfig['mode']): number =>
  mode === 'nightfall' ? BASE_GOLD - 15 : mode === 'endless' ? BASE_GOLD + 10 : BASE_GOLD;

export const makeStatuses = () => ({
  burn: { stacks: 0, time: 0, power: 0 },
  poison: { stacks: 0, time: 0, power: 0 },
  chill: { stacks: 0, time: 0, power: 0 },
  shock: { stacks: 0, time: 0, power: 0 },
  mark: { stacks: 0, time: 0, power: 0 },
  root: { stacks: 0, time: 0, power: 0 },
});

const FLIGHT_LENGTH = dist(SPAWN.x, SPAWN.y, HEARTH.x, HEARTH.y);

export const createRun = (
  config: RunConfig,
  meta: MetaState,
  buffsArg?: MetaBuffs,
): Run => {
  const buffs = buffsArg ?? computeMetaBuffs(meta);
  const rng = new Rng(config.seed);
  const hearthMax = BASE_HEARTH + buffs.hearthMax;
  const run: Run = {
    config,
    seed: config.seed,
    rng,
    phase: 'draft',
    wave: 0,
    gold: modeStartGold(config.mode) + buffs.startGold,
    hearth: hearthMax,
    hearthMax,
    towers: [],
    enemies: [],
    projectiles: [],
    beams: [],
    hand: [],
    relics: [],
    relicFx: relicTotals([]),
    draft: [],
    draftWave: 1,
    freeRerolls: buffs.rerolls,
    families: [...buffs.unlockedFamilies],
    meta: buffs,
    spawns: [],
    waveTime: 0,
    hpScale: 1,
    events: [],
    time: 0,
    kills: 0,
    leaks: 0,
    fusions: 0,
    elders: 0,
    goldEarned: 0,
    maxGold: 0,
    lostHearth: 0,
    bossesKilled: 0,
    damageByFamily: { ember: 0, frost: 0, verdant: 0, volt: 0, umbral: 0 },
    familiesUsed: [],
    firstLeakUsed: false,
    leakShieldUsed: false,
    killedSinceHeal: 0,
    uidSeq: 1,
    bossWave: false,
    completed: false,
    notes: [],
  };
  run.draft = makeDraft(run, 1);
  return run;
};

export const makeDraft = (run: Run, wave: number): Card[] => {
  const ctx: DraftContext = {
    rng: run.rng,
    wave,
    families: run.families,
    hand: run.hand,
    towers: run.towers,
    relics: run.relics,
    offerCount: 3 + run.meta.offerBonus + run.relicFx.offerCount,
  };
  const cards = draftCards(ctx).cards;
  // The very first draft always contains something placeable.
  if (wave <= 1 && run.towers.length === 0 && !cards.some((c) => c.kind === 'sigil')) {
    cards[0] = {
      uid: run.uidSeq++,
      kind: 'sigil',
      id: 'cinder_lance',
      tier: 1,
      rarity: 'common',
    };
  }
  return cards;
};

export const handFull = (run: Run): boolean => run.hand.length >= handCapacity(run);

export type ActionResult = { ok: boolean; reason?: string };

export const consumeEvents = (run: Run): SimEvent[] => {
  const out = run.events;
  run.events = [];
  return out;
};

const emit = (run: Run, ev: SimEvent): void => {
  if (run.events.length < 600) run.events.push(ev);
};

// ── Draft ──────────────────────────────────────────────────────────────────

export const pickDraftCard = (run: Run, uid: number): ActionResult => {
  if (run.phase !== 'draft') return { ok: false, reason: 'Not drafting' };
  const idx = run.draft.findIndex((c) => c.uid === uid);
  if (idx < 0) return { ok: false, reason: 'Card missing' };
  const card = run.draft[idx] as Card;

  if (card.kind === 'cache') {
    const gold = card.gold ?? 0;
    gainGold(run, gold);
    run.draft = [];
    run.phase = 'prep';
    emit(run, { t: 'relic', x: 1220, y: 300, text: `+${gold} gold` });
    return { ok: true };
  }

  if (card.kind === 'relic') {
    if (!run.relics.includes(card.id)) {
      run.relics.push(card.id);
      const before = run.relicFx;
      run.relicFx = relicTotals(run.relics);
      if (run.relicFx.hearthMax > before.hearthMax) {
        const bonus = run.relicFx.hearthMax - before.hearthMax;
        run.hearthMax += bonus;
        run.hearth = Math.min(run.hearthMax, run.hearth + bonus);
      }
      recomputeTowerMods(run);
      emit(run, { t: 'relic', x: 1290, y: 200, text: RELIC_BY_ID[card.id]?.name ?? 'Relic' });
    }
    run.draft = [];
    run.phase = 'prep';
    return { ok: true };
  }

  if (handFull(run)) {
    return { ok: false, reason: 'Your hand is full — place or discard something first.' };
  }

  run.hand.push(card);
  run.draft = [];
  run.phase = 'prep';
  emit(run, { t: 'draft', x: 1290, y: 200, text: card.id });
  return { ok: true };
};

export const rerollDraft = (run: Run): ActionResult => {
  if (run.phase !== 'draft') return { ok: false, reason: 'Not drafting' };
  if (run.freeRerolls > 0) {
    run.freeRerolls--;
  } else if (run.gold >= REROLL_COST) {
    run.gold -= REROLL_COST;
  } else {
    return { ok: false, reason: `Reroll costs ${REROLL_COST} gold` };
  }
  run.draft = makeDraft(run, run.draftWave);
  return { ok: true };
};

export const discardCard = (run: Run, uid: number): ActionResult => {
  const idx = run.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return { ok: false, reason: 'Card missing' };
  run.hand.splice(idx, 1);
  return { ok: true };
};

// ── Placement & economy ────────────────────────────────────────────────────

export const sigilPlacementCost = (run: Run, card: Card): number => {
  const def = SIGIL_BY_ID[card.id];
  if (!def) return 0;
  const base = sigilCardCostGold(card.tier ?? 1, def.cost);
  return Math.max(5, Math.round(base * run.relicFx.sigilCostMult));
};

export const plotTower = (run: Run, plot: number): Tower | undefined =>
  run.towers.find((t) => t.plot === plot);

export const placeTower = (run: Run, cardUid: number, plotIndex: number): ActionResult => {
  if (run.phase !== 'prep' && run.phase !== 'wave') return { ok: false, reason: 'Cannot build now' };
  const card = run.hand.find((c) => c.uid === cardUid);
  if (!card) return { ok: false, reason: 'Card missing' };
  if (card.kind !== 'sigil') return { ok: false, reason: 'That card is not a sigil' };
  const plot = PLOTS[plotIndex];
  if (!plot) return { ok: false, reason: 'No such plot' };
  if (plotTower(run, plotIndex)) return { ok: false, reason: 'That plot is occupied' };
  const cost = sigilPlacementCost(run, card);
  if (run.gold < cost) return { ok: false, reason: `Need ${cost} gold` };
  const def = SIGIL_BY_ID[card.id];
  if (!def) return { ok: false, reason: 'Unknown sigil' };
  const tier = clamp(card.tier ?? 1, 1, 3);
  run.gold -= cost;
  const tower = createTower(run, def.id, tier, plotIndex, def.family, false);
  tower.invested = cost;
  run.towers.push(tower);
  run.hand = run.hand.filter((c) => c.uid !== cardUid);
  addFamilyUsed(run, def.family);
  recomputeTowerMods(run);
  emit(run, { t: 'place', x: plot.x, y: plot.y, tier });
  return { ok: true };
};

const createTower = (
  run: Run,
  sigilId: string,
  tier: number,
  plotIndex: number,
  family: FamilyId,
  elder: boolean,
): Tower => {
  const plot = PLOTS[plotIndex] as (typeof PLOTS)[number];
  const sockets =
    (elder ? 4 : baseTierScale(tier).sockets) + run.meta.socketBonus + run.relicFx.socket;
  return {
    uid: run.uidSeq++,
    sigilId,
    family,
    elder,
    tier,
    plot: plotIndex,
    x: plot.x,
    y: plot.y,
    cooldown: 0.2,
    angle: -Math.PI / 2,
    invested: 0,
    kindle: 0,
    runes: [],
    sockets,
    mods: {
      damage: 0,
      interval: 1,
      range: 0,
      critChance: 0,
      critMult: 1.9,
      statusPower: 1,
      splash: 0,
      chains: 0,
      auraDamage: 0,
      globalAuraDamage: 0,
    },
    kills: 0,
    damageDealt: 0,
    flash: 0,
    recoil: 0,
  };
};

export const addFamilyUsed = (run: Run, family: FamilyId): void => {
  if (!run.familiesUsed.includes(family)) run.familiesUsed.push(family);
};

export const gainGold = (run: Run, amount: number): void => {
  const v = Math.max(0, Math.round(amount));
  run.gold += v;
  run.goldEarned += v;
  run.maxGold = Math.max(run.maxGold, run.gold);
};

export const fusionCost = (run: Run, tier: number): number => {
  const base = FUSE_COST[clamp(tier, 1, 3)] as number;
  return Math.max(5, Math.round(base * (1 - run.relicFx.cheapFuse)));
};

/**
 * Two sigils of the same family and tier can be fused; the survivor keeps one
 * of the two kinds of sigil. Two tier-3 sigils become that family's Elder.
 * Matching the exact sigil is not required — committing to a family is what
 * matters, so the fusion ladder stays reachable inside a 15-wave run.
 */
export const canFuse = (_run: Run, a: Tower, b: Tower): boolean =>
  a.uid !== b.uid &&
  !a.elder &&
  !b.elder &&
  a.tier === b.tier &&
  a.tier <= 3 &&
  a.family === b.family;

export const fuseTowers = (run: Run, aUid: number, bUid: number): ActionResult => {
  if (run.phase !== 'prep') return { ok: false, reason: 'Fusion only during preparation' };
  const a = run.towers.find((t) => t.uid === aUid);
  const b = run.towers.find((t) => t.uid === bUid);
  if (!a || !b) return { ok: false, reason: 'Pick two sigils' };
  if (!canFuse(run, a, b)) return { ok: false, reason: 'Sigils must match in family and tier' };
  const cost = fusionCost(run, a.tier);
  if (run.gold < cost) return { ok: false, reason: `Need ${cost} gold` };
  run.gold -= cost;
  const becomingElder = a.tier === 3;
  a.invested += b.invested + cost;
  // Return the consumed sigil's runes to the player's hand when there is room.
  for (const rune of b.runes) {
    const def = RUNE_BY_ID[rune.id];
    if (!def) continue;
    if (!handFull(run)) {
      run.hand.push({
        uid: run.uidSeq++,
        kind: 'rune',
        id: rune.id,
        rarity: def.rarity,
      });
    }
  }
  run.towers = run.towers.filter((t) => t.uid !== b.uid);
  if (becomingElder) {
    const elder = elderForFamily(a.family);
    if (!elder) return { ok: false, reason: 'No elder for that family' };
    a.elder = true;
    a.sigilId = elder.id;
    a.sockets += 1;
    a.kindle = Math.max(a.kindle, 0);
    run.elders++;
  } else {
    a.tier += 1;
    a.sockets += 1;
  }
  run.fusions++;
  a.flash = 0.6;
  recomputeTowerMods(run);
  emit(run, {
    t: 'fuse',
    x: a.x,
    y: a.y,
    tier: a.tier,
    text: becomingElder ? 'ELDER' : undefined,
  });
  return { ok: true };
};

export const kindleCost = (tower: Tower): number => Math.round(40 * (1 + tower.kindle * 0.7));

export const kindleTower = (run: Run, uid: number): ActionResult => {
  if (run.phase !== 'prep') return { ok: false, reason: 'Kindle only during preparation' };
  const tower = run.towers.find((t) => t.uid === uid);
  if (!tower) return { ok: false, reason: 'Pick a sigil' };
  if (tower.kindle >= 3) return { ok: false, reason: 'Fully kindled' };
  const cost = kindleCost(tower);
  if (run.gold < cost) return { ok: false, reason: `Need ${cost} gold` };
  run.gold -= cost;
  tower.kindle++;
  tower.invested += cost;
  tower.flash = 0.4;
  recomputeTowerMods(run);
  emit(run, { t: 'kindle', x: tower.x, y: tower.y });
  return { ok: true };
};

export const sellValue = (run: Run, tower: Tower): number =>
  Math.round(tower.invested * (0.45 + run.meta.sellRefundBonus));

export const sellTower = (run: Run, uid: number): ActionResult => {
  if (run.phase !== 'prep') return { ok: false, reason: 'Sell only during preparation' };
  const tower = run.towers.find((t) => t.uid === uid);
  if (!tower) return { ok: false, reason: 'Pick a sigil' };
  const value = sellValue(run, tower);
  run.towers = run.towers.filter((t) => t.uid !== uid);
  gainGold(run, value);
  for (const rune of tower.runes) {
    const def = RUNE_BY_ID[rune.id];
    if (!def || handFull(run)) continue;
    run.hand.push({ uid: run.uidSeq++, kind: 'rune', id: rune.id, rarity: def.rarity });
  }
  recomputeTowerMods(run);
  emit(run, { t: 'relic', x: tower.x, y: tower.y, text: `+${value} gold` });
  return { ok: true };
};

export const attachRune = (run: Run, cardUid: number, towerUid: number): ActionResult => {
  const card = run.hand.find((c) => c.uid === cardUid);
  if (!card || card.kind !== 'rune') return { ok: false, reason: 'Pick a rune' };
  const tower = run.towers.find((t) => t.uid === towerUid);
  if (!tower) return { ok: false, reason: 'Pick a sigil' };
  if (tower.runes.length >= tower.sockets) return { ok: false, reason: 'No free socket' };
  const def = RUNE_BY_ID[card.id];
  if (!def) return { ok: false, reason: 'Unknown rune' };
  tower.runes.push({ uid: run.uidSeq++, id: def.id });
  tower.flash = 0.4;
  run.hand = run.hand.filter((c) => c.uid !== cardUid);
  recomputeTowerMods(run);
  emit(run, { t: 'rune', x: tower.x, y: tower.y, text: def.name });
  return { ok: true };
};

// ── Tower maths ────────────────────────────────────────────────────────────

export const recomputeTowerMods = (run: Run): void => {
  const relic = run.relicFx;
  const adjacentCount = new Map<number, number>();
  const towerByPlot = new Map<number, Tower>();
  for (const t of run.towers) towerByPlot.set(t.plot, t);

  for (const tower of run.towers) {
    const def = towerDef(tower);
    const scale = baseTierScale(tower.tier);
    const kindleDamage = 1 + 0.15 * tower.kindle;
    const kindleSpeed = 1 + 0.06 * tower.kindle;

    let damage = def.damage * (tower.elder ? 1 : scale.damage) * kindleDamage;
    let interval =
      (def.interval * (tower.elder ? 1 : scale.interval)) / (kindleSpeed * run.meta.speedMult);
    let range = def.range * (tower.elder ? 1 : scale.range) + 6 * tower.kindle;
    let splash = (def.splash ?? 0) * (tower.elder ? 1 : scale.area);
    let chains = def.chains ?? 0;
    let crit = critBase(tower.elder ? 3 : tower.tier) + relic.critChance;
    let critMult = 1.9 + relic.critMult;
    let statusPower = run.meta.statusPowerMult * (1 + relic.statusPowerMult);
    let damageMult = run.meta.damageMult * (1 + relic.damageMult);

    for (const rune of tower.runes) {
      const r = RUNE_BY_ID[rune.id];
      if (!r) continue;
      if (r.mods.damageMult) damageMult += r.mods.damageMult;
      if (r.mods.speedMult) interval /= 1 + r.mods.speedMult;
      if (r.mods.rangeFlat) range += r.mods.rangeFlat;
      if (r.mods.critChance) crit += r.mods.critChance;
      if (r.mods.statusPowerMult) statusPower += r.mods.statusPowerMult;
      if (r.mods.splashMult) splash *= 1 + r.mods.splashMult;
      if (r.mods.chainAdd) chains += r.mods.chainAdd;
    }

    damage *= damageMult;
    const isAoe = def.attack === 'pulse' || def.attack === 'field';
    range = isAoe
      ? (def.radius ?? 100) * (tower.elder ? 1 : scale.area) + relic.rangeFlat
      : range * 1.08 + relic.rangeFlat;

    tower.mods = {
      damage,
      interval: Math.max(0.08, interval),
      range,
      critChance: clamp(crit, 0, 0.85),
      critMult,
      statusPower,
      splash,
      chains,
      auraDamage: def.auraDamage ?? 0,
      globalAuraDamage: def.globalAuraDamage ?? 0,
    };
  }

  // Resonance: adjacent sigils empower each other; support auras stack.
  const auraGain = new Map<number, number>();
  for (const tower of run.towers) auraGain.set(tower.uid, 0);
  for (const tower of run.towers) {
    const plot = PLOTS[tower.plot];
    if (!plot) continue;
    let neighbors = 0;
    for (const n of plot.neighbors) {
      const other = towerByPlot.get(n);
      if (!other) continue;
      neighbors++;
      const aura = other.mods.auraDamage;
      if (aura > 0) auraGain.set(tower.uid, (auraGain.get(tower.uid) ?? 0) + aura);
    }
    adjacentCount.set(tower.uid, neighbors);
  }
  let globalAura = 0;
  for (const tower of run.towers) globalAura += tower.mods.globalAuraDamage;

  for (const tower of run.towers) {
    const neighbors = adjacentCount.get(tower.uid) ?? 0;
    const aura = auraGain.get(tower.uid) ?? 0;
    tower.mods.damage *= (1 + 0.04 * neighbors) * (1 + aura) * (1 + globalAura);
  }
};

export const towerDps = (tower: Tower): number => {
  const def = towerDef(tower);
  if (def.attack === 'support' || def.damage <= 0) return 0;
  const base = tower.mods.damage / Math.max(0.08, tower.mods.interval);
  if (def.attack === 'volley') return base * (def.shots ?? 1);
  if (def.attack === 'chain') return base * (1 + (tower.mods.chains ?? 0) * 0.7);
  if (def.attack === 'splash' || def.attack === 'pulse' || def.attack === 'field') return base * 1.6;
  return base;
};

export const runeSocketCount = (tower: Tower): number => tower.sockets;

// ── Waves ──────────────────────────────────────────────────────────────────

export const startWave = (run: Run): ActionResult => {
  if (run.phase !== 'prep') return { ok: false, reason: 'Prepare first' };
  if (run.towers.length === 0) return { ok: false, reason: 'Place at least one sigil' };
  const next = run.wave + 1;
  const def = waveDef(next);
  const hpScale = hpScaleForWave(next, run.config.mode);
  run.wave = next;
  run.hpScale = hpScale;
  run.waveTime = 0;
  run.phase = 'wave';
  run.bossWave = def.boss;
  run.spawns = [];
  for (const group of def.groups) {
    for (let i = 0; i < group.count; i++) {
      run.spawns.push({ type: group.type, at: group.delay + i * group.gap, hpScale });
    }
  }
  run.spawns.sort((a, b) => a.at - b.at);
  emit(run, { t: 'waveStart', amount: next, text: def.name });
  if (def.boss) emit(run, { t: 'boss', x: HEARTH.x - 300, y: HEARTH.y - 400, text: def.name });
  return { ok: true };
};

const spawnEnemy = (
  run: Run,
  typeId: string,
  hpScale: number,
  distAlong = 0,
): Enemy | null => {
  const def = ENEMY_BY_ID[typeId];
  if (!def) return null;
  const air = def.kind === 'flier';
  const hp = def.hp * hpScale;
  const e: Enemy = {
    uid: run.uidSeq++,
    typeId,
    x: SPAWN.x,
    y: SPAWN.y,
    hp,
    hpMax: hp,
    speed: def.speed,
    baseSpeed: def.speed,
    armor: def.armor + Math.min(5, Math.floor((run.wave - 1) * 0.12)),
    statuses: makeStatuses(),
    distAlong,
    lane: air ? 'air' : 'ground',
    size: def.size,
    boss: !!def.boss,
    leak: def.leak,
    gold: def.gold,
    abilityTimer: 1.5,
    hitFlash: 0,
    dead: false,
    escaped: false,
    enraged: false,
    shielded: 0,
    shieldTime: 0,
    seed: run.rng.int(0, 10_000),
    age: 0,
  };
  positionEnemy(e);
  run.enemies.push(e);
  emit(run, { t: 'spawn', uid: e.uid, x: e.x, y: e.y, text: typeId });
  return e;
};

/** Test/debug helper: place an enemy on the road at a given distance. */
export const debugSpawnEnemy = (
  run: Run,
  typeId: string,
  distAlong = 0,
  hpScale = run.hpScale || 1,
): Enemy | null => spawnEnemy(run, typeId, hpScale, distAlong);

const positionEnemy = (enemy: Enemy): void => {
  if (enemy.lane === 'air') {
    const t = clamp(enemy.distAlong / FLIGHT_LENGTH, 0, 1);
    enemy.x = SPAWN.x + (HEARTH.x - SPAWN.x) * t;
    enemy.y = SPAWN.y + (HEARTH.y - SPAWN.y) * t;
    return;
  }
  const p = samplePath(enemy.distAlong);
  enemy.x = p.x;
  enemy.y = p.y;
};

// ── Status effects ─────────────────────────────────────────────────────────

const STATUS_ARRAY: StatusId[] = ['burn', 'poison', 'chill', 'shock', 'mark', 'root'];

const applyStatus = (
  run: Run,
  enemy: Enemy,
  apply: StatusApply | undefined,
  tower?: Tower,
  spread = true,
): void => {
  if (!apply || enemy.dead) return;
  const powerScale = tower?.mods.statusPower ?? run.meta.statusPowerMult;
  const power =
    apply.id === 'burn'
      ? apply.power * powerScale + run.relicFx.burnDps
      : apply.power * powerScale;
  const inst = enemy.statuses[apply.id];
  inst.stacks = Math.min(10, (inst.stacks || 0) + (apply.stacks ?? 1));
  inst.time = Math.max(inst.time, apply.duration);
  inst.power = Math.max(inst.power, power);

  if (spread && tower) {
    const def = towerDef(tower);
    const flags = def.flags ?? [];
    if (flags.includes('burnSpread') && apply.id === 'burn') {
      spreadTo(run, enemy, 'burn', apply, 90, 0.55);
    }
    if (flags.includes('markSpread') && apply.id === 'mark') {
      spreadTo(run, enemy, 'mark', apply, 130, 1);
    }
  }
};

const spreadTo = (
  run: Run,
  source: Enemy,
  id: StatusId,
  apply: StatusApply,
  radius: number,
  factor: number,
): void => {
  for (const other of run.enemies) {
    if (other === source || other.dead) continue;
    if (dist(other.x, other.y, source.x, source.y) > radius) continue;
    const inst = other.statuses[id];
    inst.stacks = Math.min(10, inst.stacks + (apply.stacks ?? 1));
    inst.time = Math.max(inst.time, apply.duration);
    inst.power = Math.max(inst.power, apply.power * factor);
  }
};

const statusSpeedMult = (enemy: Enemy): number => {
  const chill = enemy.statuses.chill;
  const slow = chill.time > 0 ? Math.min(0.55, chill.power * Math.max(1, chill.stacks) * 0.6) : 0;
  const root = enemy.statuses.root.time > 0 ? 1 : 0;
  return Math.max(0, 1 - slow - root);
};

// ── Damage ─────────────────────────────────────────────────────────────────

export interface DamageOptions {
  tower?: Tower;
  family?: FamilyId;
  flags?: SigilFlag[];
  canCrit?: boolean;
  ignoreArmor?: boolean;
  applyStatus?: StatusApply;
  isDot?: boolean;
}

export interface DamageResult {
  dealt: number;
  crit: boolean;
  killed: boolean;
}

export const damageEnemy = (
  run: Run,
  enemy: Enemy,
  amount: number,
  opts: DamageOptions = {},
): DamageResult => {
  if (enemy.dead || enemy.escaped) return { dealt: 0, crit: false, killed: false };
  const def = ENEMY_BY_ID[enemy.typeId];
  const flags = opts.flags ?? (opts.tower ? towerDef(opts.tower).flags ?? [] : []);
  let dmg = amount;
  let crit = false;

  if (opts.canCrit && opts.tower) {
    const chance = opts.tower.mods.critChance;
    if (flags.includes('guaranteedCrit') || run.rng.chance(chance)) {
      crit = true;
      dmg *= opts.tower.mods.critMult;
    }
  }

  const mark = enemy.statuses.mark;
  if (mark.time > 0) dmg *= 1 + mark.power * Math.max(1, mark.stacks);
  const shock = enemy.statuses.shock;
  if (shock.time > 0) dmg *= 1 + shock.power * shock.stacks;
  if (flags.includes('bonusVsBurning') && enemy.statuses.burn.time > 0) dmg *= 1.22;
  if (flags.includes('bonusVsMarked') && mark.time > 0) dmg *= 1.25;
  if (flags.includes('executioner') && enemy.hp / enemy.hpMax < 0.3) dmg *= 1.9;

  if (enemy.boss && run.relicFx.bossDamageMult) dmg *= 1 + run.relicFx.bossDamageMult;

  if (def?.resist && opts.family) {
    dmg *= 1 - (def.resist[opts.family] ?? 0);
  }
  if (!opts.ignoreArmor) dmg = Math.max(dmg * 0.15, dmg - enemy.armor);
  if (enemy.shielded > 0) dmg *= 1 - enemy.shielded;
  if (!Number.isFinite(dmg) || dmg < 0) dmg = 0;

  enemy.hp -= dmg;
  enemy.hitFlash = Math.min(1, enemy.hitFlash + 0.35);
  if (opts.tower) {
    opts.tower.damageDealt += dmg;
    if (opts.family) run.damageByFamily[opts.family] += dmg;
  }
  if (!opts.isDot) {
    emit(run, {
      t: 'hit',
      x: enemy.x,
      y: enemy.y - enemy.size,
      amount: Math.round(dmg),
      crit,
      family: opts.family,
      uid: enemy.uid,
    });
  }
  if (opts.applyStatus) applyStatus(run, enemy, opts.applyStatus, opts.tower);
  if (flags.includes('freezeOnHit') && !enemy.boss && enemy.statuses.chill.time > 0) {
    if (run.rng.chance(0.22)) {
      applyStatus(run, enemy, { id: 'root', power: 0, duration: 0.9, stacks: 1 }, undefined, false);
    }
  }
  if (enemy.hp <= 0) {
    killEnemy(run, enemy, opts.tower);
    return { dealt: dmg, crit, killed: true };
  }
  return { dealt: dmg, crit, killed: false };
};

const killEnemy = (run: Run, enemy: Enemy, killer?: Tower): void => {
  if (enemy.dead) return;
  enemy.dead = true;
  const def = ENEMY_BY_ID[enemy.typeId];
  if (!def) return;
  if (killer) killer.kills++;
  let gold = def.gold * (1 + Math.min(1.6, run.wave * 0.035));
  gold += run.relicFx.goldOnKill;
  if (killer) {
    for (const rune of killer.runes) {
      const r = RUNE_BY_ID[rune.id];
      if (r?.mods.goldOnKill) gold += r.mods.goldOnKill;
    }
    const flags = towerDef(killer).flags ?? [];
    if (flags.includes('siphon')) healHearth(run, 1);
  }
  gold = Math.max(1, Math.round(gold));
  gainGold(run, gold);
  run.kills++;
  if (def.boss) {
    run.bossesKilled++;
    emit(run, { t: 'boss', x: enemy.x, y: enemy.y, text: `${def.name} has fallen` });
  }
  run.killedSinceHeal++;
  if (run.relicFx.killHealEvery > 0 && run.killedSinceHeal >= run.relicFx.killHealEvery) {
    run.killedSinceHeal = 0;
    healHearth(run, 1);
  }
  emit(run, {
    t: 'kill',
    x: enemy.x,
    y: enemy.y,
    amount: gold,
    text: enemy.typeId,
    family: killer?.family,
    tier: enemy.boss ? 2 : 1,
  });

  // Split on death.
  for (const ability of def.abilities ?? []) {
    if (ability.kind === 'split') {
      const count = Math.max(1, Math.round(ability.power));
      for (let i = 0; i < count; i++) {
        const childScale = enemy.hpMax / Math.max(1, def.hp);
        const child = spawnEnemy(run, 'splitling', childScale, enemy.distAlong - i * 14);
        if (child) {
          child.x += (i - 0.5) * 18;
          child.hp = child.hpMax;
          child.lane = 'ground';
        }
      }
    }
  }
};

export const healHearth = (run: Run, amount: number): void => {
  if (run.phase === 'over' || run.phase === 'victory') return;
  const before = run.hearth;
  run.hearth = Math.min(run.hearthMax, run.hearth + amount);
  if (run.hearth > before) emit(run, { t: 'heal', amount: Math.round(run.hearth - before) });
};

const leakEnemy = (run: Run, enemy: Enemy): void => {
  enemy.escaped = true;
  let damage = enemy.leak;
  if (run.relicFx.firstLeakFree && !run.firstLeakUsed) {
    run.firstLeakUsed = true;
    damage = 0;
  }
  if (damage >= run.hearth && run.relicFx.leakShield > 0 && !run.leakShieldUsed) {
    run.leakShieldUsed = true;
    run.hearth = 1;
    damage = 0;
    emit(run, { t: 'heal', x: HEARTH.x, y: HEARTH.y, text: 'LAST EMBER' });
  }
  if (damage > 0) {
    run.hearth = Math.max(0, run.hearth - damage);
    run.lostHearth += damage;
    run.leaks++;
  }
  emit(run, { t: 'leak', x: HEARTH.x, y: HEARTH.y, amount: damage, uid: enemy.uid });
  if (run.hearth <= 0) {
    run.hearth = 0;
    run.phase = 'over';
    run.completed = true;
    run.summary = buildSummary(run, false);
    emit(run, { t: 'gameOver' });
  }
};

// ── Update loop ────────────────────────────────────────────────────────────

export const updateRun = (run: Run, dtRaw: number): void => {
  const dt = clamp(dtRaw, 0, 0.1);
  if (run.phase === 'over' || run.phase === 'victory') return;
  run.time += dt;

  if (run.phase === 'wave') {
    run.waveTime += dt;
    // Spawn
    while (run.spawns.length > 0 && (run.spawns[0] as SpawnEntry).at <= run.waveTime) {
      const entry = run.spawns.shift() as SpawnEntry;
      spawnEnemy(run, entry.type, entry.hpScale);
    }
    updateEnemies(run, dt);
    if ((run.phase as RunPhase) === 'over') {
      cleanup(run);
      return;
    }
    updateTowers(run, dt);
    updateProjectiles(run, dt);
    updateBeams(run, dt);
    cleanup(run);
    if (run.phase === 'wave' && run.spawns.length === 0 && run.enemies.length === 0) {
      completeWave(run);
    }
  } else {
    updateBeams(run, dt);
    for (const tower of run.towers) {
      tower.flash = Math.max(0, tower.flash - dt);
      tower.recoil = Math.max(0, tower.recoil - dt * 6);
    }
  }
};

const updateEnemies = (run: Run, dt: number): void => {
  // Haste auras are recomputed once per frame.
  const auras: { x: number; y: number; radius: number; power: number }[] = [];
  for (const e of run.enemies) {
    if (e.dead) continue;
    const def = ENEMY_BY_ID[e.typeId];
    for (const ability of def?.abilities ?? []) {
      if (ability.kind === 'hasteAura') {
        auras.push({
          x: e.x,
          y: e.y,
          radius: ability.radius ?? 120,
          power: ability.power,
        });
      }
    }
  }

  for (const enemy of run.enemies) {
    if (enemy.dead || enemy.escaped) continue;
    enemy.age += dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    if (enemy.shieldTime > 0) {
      enemy.shieldTime -= dt;
      if (enemy.shieldTime <= 0) enemy.shielded = 0;
    }
    const def = ENEMY_BY_ID[enemy.typeId];
    if (!def) continue;

    // Tick statuses.
    for (const id of STATUS_ARRAY) {
      const inst = enemy.statuses[id];
      if (inst.time <= 0) continue;
      inst.time -= dt;
      if (inst.time <= 0) {
        inst.time = 0;
        inst.stacks = 0;
        inst.power = 0;
        continue;
      }
      if (id === 'burn' || id === 'poison') {
        const dot = inst.power * Math.max(1, inst.stacks) * dt;
        if (dot > 0) {
          damageEnemy(run, enemy, dot, {
            ignoreArmor: true,
            isDot: true,
            family: id === 'burn' ? 'ember' : 'verdant',
          });
          if (enemy.dead) break;
        }
      }
    }
    if (enemy.dead) continue;

    // Abilities.
    enemy.abilityTimer -= dt;
    for (const ability of def.abilities ?? []) {
      if (ability.kind === 'hasteAura' || ability.kind === 'split') continue;
      if (ability.kind === 'enrage') {
        if (!enemy.enraged && enemy.hp / enemy.hpMax < 0.45) {
          enemy.enraged = true;
          emit(run, { t: 'boss', x: enemy.x, y: enemy.y, text: 'The King is furious' });
        }
        continue;
      }
      if (ability.kind === 'shield' && enemy.abilityTimer <= 0) {
        enemy.shielded = Math.min(0.6, ability.power);
        enemy.shieldTime = 3;
        emit(run, { t: 'heal', x: enemy.x, y: enemy.y, text: 'SHIELD' });
      }
      if (ability.kind === 'burrow' && enemy.abilityTimer <= 0) {
        enemy.shielded = Math.min(0.6, ability.power);
        enemy.shieldTime = 2;
      }
      if (ability.kind === 'heal' && enemy.abilityTimer <= 0) {
        const radius = ability.radius ?? 110;
        for (const other of run.enemies) {
          if (other.dead || other === enemy) continue;
          if (dist(other.x, other.y, enemy.x, enemy.y) > radius) continue;
          const healed = Math.min(other.hpMax - other.hp, ability.power);
          if (healed > 0) {
            other.hp += healed;
            emit(run, { t: 'heal', x: other.x, y: other.y, amount: Math.round(healed) });
          }
        }
      }
      if (ability.kind === 'summon' && enemy.abilityTimer <= 0) {
        const count = Math.min(8, Math.round(ability.power));
        for (let i = 0; i < count; i++) {
          const child = spawnEnemy(
            run,
            enemy.boss && enemy.typeId === 'king' ? 'shade' : 'wisp',
            run.hpScale,
            Math.max(0, enemy.distAlong - 40 - i * 16),
          );
          if (child) {
            child.lane = 'ground';
            child.x = enemy.x + (i - count / 2) * 10;
            child.y = enemy.y;
          }
        }
        emit(run, { t: 'pulse', x: enemy.x, y: enemy.y, family: 'umbral' });
      }
    }
    if (enemy.abilityTimer <= 0) {
      let minInterval = Infinity;
      for (const ability of def.abilities ?? []) {
        if (ability.interval) minInterval = Math.min(minInterval, ability.interval);
      }
      enemy.abilityTimer = Number.isFinite(minInterval) ? minInterval : 999;
    }

    // Speed.
    let haste = 1;
    for (const aura of auras) {
      if (dist(aura.x, aura.y, enemy.x, enemy.y) <= aura.radius) haste = Math.max(haste, 1 + aura.power);
    }
    if (enemy.enraged) haste *= 1.35;
    const speed = enemy.baseSpeed * statusSpeedMult(enemy) * haste;
    enemy.speed = speed;
    enemy.distAlong += speed * dt;
    positionEnemy(enemy);

    const limit = enemy.lane === 'air' ? FLIGHT_LENGTH : PATH_LENGTH;
    if (enemy.distAlong >= limit) leakEnemy(run, enemy);
  }
};

const pickTarget = (run: Run, tower: Tower, mode: TargetMode): Enemy | null => {
  const range = tower.mods.range;
  let best: Enemy | null = null;
  let bestScore = -Infinity;
  for (const enemy of run.enemies) {
    if (enemy.dead || enemy.escaped) continue;
    const d = dist(tower.x, tower.y, enemy.x, enemy.y);
    if (d > range + enemy.size * 0.5) continue;
    let score: number;
    switch (mode) {
      case 'strongest':
        score = enemy.hp;
        break;
      case 'closest':
        score = -d;
        break;
      case 'weakest':
        score = -enemy.hp;
        break;
      case 'first':
      default:
        score = enemy.distAlong;
        break;
    }
    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  }
  return best;
};

const enemiesInRadius = (run: Run, x: number, y: number, radius: number): Enemy[] => {
  const out: Enemy[] = [];
  for (const enemy of run.enemies) {
    if (enemy.dead || enemy.escaped) continue;
    if (dist(x, y, enemy.x, enemy.y) <= radius + enemy.size * 0.5) out.push(enemy);
  }
  return out;
};

const updateTowers = (run: Run, dt: number): void => {
  for (const tower of run.towers) {
    tower.flash = Math.max(0, tower.flash - dt);
    tower.recoil = Math.max(0, tower.recoil - dt * 7);
    const def = towerDef(tower);
    if (def.attack === 'support') {
      tower.angle = Math.sin(run.time * 0.8 + tower.uid) * 0.2;
      continue;
    }
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;

    const mode = (def.targetMode ?? 'first') as TargetMode;
    if (def.attack === 'pulse' || def.attack === 'field') {
      const radius = tower.mods.range;
      tower.cooldown = tower.mods.interval;
      const hits = enemiesInRadius(run, tower.x, tower.y, radius);
      if (hits.length === 0) continue;
      tower.flash = 0.3;
      for (const enemy of hits) {
        damageEnemy(run, enemy, tower.mods.damage, {
          tower,
          family: tower.family,
          flags: def.flags,
          canCrit: true,
          applyStatus: def.status,
        });
      }
      emit(run, { t: 'pulse', x: tower.x, y: tower.y, family: tower.family, amount: radius });
      continue;
    }

    const target = pickTarget(run, tower, mode);
    if (!target) continue;
    tower.cooldown = tower.mods.interval;
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.flash = 0.25;
    tower.recoil = 1;

    switch (def.attack) {
      case 'bolt':
      case 'splash':
      case 'execute': {
        const projectile: Projectile = {
          uid: run.uidSeq++,
          towerUid: tower.uid,
          x: tower.x,
          y: tower.y,
          vx: Math.cos(tower.angle) * (def.projectileSpeed ?? 600),
          vy: Math.sin(tower.angle) * (def.projectileSpeed ?? 600),
          targetUid: target.uid,
          speed: def.projectileSpeed ?? 600,
          damage: tower.mods.damage,
          family: tower.family,
          splash: tower.mods.splash,
          life: 2.2,
          status: def.status,
          flags: def.flags ?? [],
          color: tower.family,
          crit: false,
        };
        run.projectiles.push(projectile);
        emit(run, {
          t: 'shoot',
          x: tower.x,
          y: tower.y,
          family: tower.family,
          uid: projectilesCount(run),
          towerUid: tower.uid,
        });
        break;
      }
      case 'beam': {
        const crit = run.rng.chance(tower.mods.critChance);
        const dmg = tower.mods.damage * (crit ? tower.mods.critMult : 1);
        damageEnemy(run, target, dmg, {
          tower,
          family: tower.family,
          flags: def.flags,
          canCrit: false,
          applyStatus: def.status,
        });
        run.beams.push({
          uid: run.uidSeq++,
          towerUid: tower.uid,
          targetUid: target.uid,
          x1: tower.x,
          y1: tower.y,
          x2: target.x,
          y2: target.y,
          life: 0.18,
          maxLife: 0.18,
          family: tower.family,
          width: 3,
        });
        break;
      }
      case 'chain': {
        const chains = Math.round(tower.mods.chains);
        const targets: Enemy[] = [target];
        let from = target;
        for (let i = 1; i < chains; i++) {
          let next: Enemy | null = null;
          let bestD = 150;
          for (const enemy of run.enemies) {
            if (enemy.dead || enemy.escaped) continue;
            if (targets.includes(enemy)) continue;
            const d = dist(from.x, from.y, enemy.x, enemy.y);
            if (d < bestD) {
              bestD = d;
              next = enemy;
            }
          }
          if (!next) break;
          targets.push(next);
          from = next;
        }
        let dmg = tower.mods.damage;
        for (const enemy of targets) {
          damageEnemy(run, enemy, dmg, {
            tower,
            family: tower.family,
            flags: def.flags,
            canCrit: true,
            applyStatus: def.status,
          });
          emit(run, {
            t: 'beam',
            x: enemy.x,
            y: enemy.y,
            family: tower.family,
            towerUid: tower.uid,
          });
          dmg *= 0.86;
        }
        emit(run, { t: 'shoot', x: tower.x, y: tower.y, family: tower.family, text: 'chain' });
        break;
      }
      case 'volley': {
        const shots = def.shots ?? 1;
        const targets = run.enemies
          .filter((e) => !e.dead && !e.escaped && dist(tower.x, tower.y, e.x, e.y) <= tower.mods.range)
          .sort((a, b) => b.distAlong - a.distAlong)
          .slice(0, shots);
        for (const enemy of targets) {
          damageEnemy(run, enemy, tower.mods.damage, {
            tower,
            family: tower.family,
            flags: def.flags,
            canCrit: true,
            applyStatus: def.status,
          });
          emit(run, { t: 'beam', x: enemy.x, y: enemy.y, family: tower.family });
        }
        emit(run, { t: 'shoot', x: tower.x, y: tower.y, family: tower.family, text: 'volley' });
        break;
      }
      default:
        break;
    }
  }
};

const projectilesCount = (run: Run): number => run.projectiles.length;

const updateProjectiles = (run: Run, dt: number): void => {
  for (const p of run.projectiles) {
    if (p.life <= 0) continue;
    p.life -= dt;
    const target = run.enemies.find((e) => e.uid === p.targetUid && !e.dead && !e.escaped);
    if (target) {
      const angle = Math.atan2(target.y - p.y, target.x - p.x);
      p.vx = Math.cos(angle) * p.speed;
      p.vy = Math.sin(angle) * p.speed;
      const d = dist(p.x, p.y, target.x, target.y);
      if (d <= 12 + target.size * 0.4) {
        impact(run, p, target);
        p.life = 0;
        continue;
      }
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -80 || p.x > 1400 || p.y < -80 || p.y > 1000) p.life = 0;
  }
};

const impact = (run: Run, p: Projectile, target: Enemy): void => {
  const tower = run.towers.find((t) => t.uid === p.towerUid);
  const def = tower ? towerDef(tower) : undefined;
  if (p.splash > 0) {
    const hits = enemiesInRadius(run, target.x, target.y, p.splash);
    for (const enemy of hits) {
      damageEnemy(run, enemy, p.damage, {
        tower,
        family: p.family,
        flags: p.flags,
        canCrit: true,
        applyStatus: p.status,
      });
    }
    emit(run, {
      t: 'pulse',
      x: target.x,
      y: target.y,
      family: p.family,
      amount: p.splash,
      text: def ? 'splash' : undefined,
    });
  } else {
    damageEnemy(run, target, p.damage, {
      tower,
      family: p.family,
      flags: p.flags,
      canCrit: true,
      applyStatus: p.status,
    });
    emit(run, { t: 'impact', x: target.x, y: target.y, family: p.family });
  }
};

const updateBeams = (run: Run, dt: number): void => {
  for (const beam of run.beams) {
    beam.life -= dt;
    const target = run.enemies.find((e) => e.uid === beam.targetUid);
    if (target) {
      beam.x2 = target.x;
      beam.y2 = target.y;
    }
  }
  run.beams = run.beams.filter((b) => b.life > 0);
};

const cleanup = (run: Run): void => {
  run.enemies = run.enemies.filter((e) => !e.dead && !e.escaped);
  run.projectiles = run.projectiles.filter((p) => p.life > 0);
};

// ── Wave completion & summary ──────────────────────────────────────────────

const completeWave = (run: Run): void => {
  const def = waveDef(run.wave);
  const isFinal = run.wave >= FINAL_WAVE && run.config.mode !== 'endless';
  const modeGold = run.config.mode === 'nightfall' ? 1.25 : 1;
  let reward = (def.reward + 20 + 6 * run.wave) * modeGold * (1 + run.relicFx.waveBonusGold);
  reward = Math.round(reward);
  gainGold(run, reward);

  let heal = run.relicFx.healPerWave;
  for (const tower of run.towers) {
    for (const rune of tower.runes) {
      const r = RUNE_BY_ID[rune.id];
      if (r?.mods.hearthHeal) heal += r.mods.hearthHeal;
    }
    const tdef = towerDef(tower);
    if ('healPerWave' in tdef && tdef.healPerWave) heal += tdef.healPerWave;
  }
  if (def.boss) heal += run.meta.bossHeal;
  if (heal > 0) healHearth(run, heal);

  if (run.relicFx.interest > 0) {
    const interest = Math.min(45, Math.floor(run.gold * run.relicFx.interest));
    if (interest > 0) gainGold(run, interest);
  }

  emit(run, { t: 'waveClear', amount: reward, text: def.name });

  if (isFinal) {
    run.phase = 'victory';
    run.completed = true;
    run.summary = buildSummary(run, true);
    emit(run, { t: 'victory' });
    return;
  }

  run.phase = 'draft';
  run.draftWave = run.wave + 1;
  run.draft = makeDraft(run, run.draftWave);
  emit(run, { t: 'draft' });
};

export const buildSummary = (run: Run, victory: boolean): RunSummary => {
  const embersBase = embersForRun({
    wave: run.wave,
    kills: run.kills,
    bosses: run.bossesKilled,
    victory,
    mode: run.config.mode,
  });
  const embers = Math.round(embersBase * run.meta.emberMult + run.relicFx.emberBonus);
  const runes = new Set<string>();
  for (const tower of run.towers) for (const rune of tower.runes) runes.add(rune.id);
  for (const card of run.hand) if (card.kind === 'rune') runes.add(card.id);
  return {
    mode: run.config.mode,
    seed: run.seed,
    dayKey: run.config.dayKey,
    wave: run.wave,
    kills: run.kills,
    leaks: run.leaks,
    fusions: run.fusions,
    elders: run.elders,
    hearth: run.hearth,
    hearthMax: run.hearthMax,
    gold: run.gold,
    maxGold: run.maxGold,
    goldEarned: run.goldEarned,
    lostHearth: run.lostHearth,
    time: run.time,
    victory,
    embers,
    bossesKilled: run.bossesKilled,
    familiesUsed: [...run.familiesUsed],
    tier3AtOnce: run.towers.filter((t) => t.tier >= 3 || t.elder).length,
    eldersAtOnce: run.towers.filter((t) => t.elder).length,
    towers: run.towers.map((t) => ({
      sigilId: t.sigilId,
      family: t.family,
      tier: t.tier,
      elder: t.elder,
    })),
    relics: [...run.relics],
    runes: [...runes],
    damageByFamily: { ...run.damageByFamily },
  };
};

export const abandonRun = (run: Run): RunSummary => {
  if (!run.summary) {
    run.phase = 'over';
    run.completed = true;
    run.summary = buildSummary(run, false);
  }
  return run.summary;
};

/** Advance the simulation by a fixed number of seconds (test/debug helper). */
export const advance = (run: Run, seconds: number, step = 1 / 60): void => {
  let remaining = seconds;
  let guard = 0;
  while (remaining > 0 && guard < 100000) {
    const dt = Math.min(step, remaining);
    updateRun(run, dt);
    remaining -= dt;
    guard++;
  }
};
