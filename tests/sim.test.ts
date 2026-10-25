import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  defaultSave,
  loadSave,
  saveGame,
  sanitizeSave,
  SAVE_KEY,
  type StorageLike,
} from '../src/core/save';
import { computeMetaBuffs } from '../src/game/data/meta';
import { SAVE_SCHEMA } from '../src/game/data/schema';
import { draftCards, nextCardUid } from '../src/game/sim/draft';
import { SIGIL_BY_ID } from '../src/game/data/sigils';
import { PATH_LENGTH, PLOTS, HEARTH, samplePath } from '../src/game/sim/map';
import {
  BASE_HEARTH,
  abandonRun,
  advance,
  attachRune,
  buildSummary,
  canFuse,
  createRun,
  damageEnemy,
  fuseTowers,
  handCapacity,
  makeDraft,
  pickDraftCard,
  placeTower,
  plotTower,
  rerollDraft,
  startWave,
  updateRun,
  type Run,
} from '../src/game/sim/engine';

const memoryStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
};

const freshRun = (seed = 1234, mode: 'vigil' | 'nightfall' | 'daily' | 'endless' = 'vigil'): Run => {
  const save = defaultSave(1000);
  save.meta.unlockedFamilies = ['ember', 'frost', 'verdant', 'volt', 'umbral'];
  return createRun({ mode, seed }, save.meta, computeMetaBuffs(save.meta));
};

describe('seed rng', () => {
  it('is deterministic and reproducible', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 8 }, () => a.next());
    const seqB = Array.from({ length: 8 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('weights and shuffles without losing items', () => {
    const rng = new Rng(7);
    const items = ['a', 'b', 'c', 'd'];
    const shuffled = rng.shuffle(items);
    expect([...shuffled].sort()).toEqual([...items].sort());
    const picked = rng.weighted(
      [
        { id: 'common', w: 100 },
        { id: 'rare', w: 1 },
      ],
      (i) => i.w,
    );
    expect(['common', 'rare']).toContain(picked.id);
  });
});

describe('save system', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const save = defaultSave(1);
    save.meta.embers = 42;
    save.meta.unlockedFamilies = ['ember', 'frost'];
    save.stats.runs = 3;
    save.settings.music = 0.25;
    expect(saveGame(storage, save)).toBe(true);
    const loaded = loadSave(storage, SAVE_SCHEMA);
    expect(loaded.recovered).toBe(false);
    expect(loaded.data.meta.embers).toBe(42);
    expect(loaded.data.settings.music).toBeCloseTo(0.25);
    expect(loaded.data.stats.runs).toBe(3);
  });

  it('recovers from corrupted json without throwing', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{not json,,,');
    const loaded = loadSave(storage, SAVE_SCHEMA);
    expect(loaded.recovered).toBe(true);
    expect(loaded.data.meta.unlockedFamilies).toEqual(['ember']);
    expect(loaded.data.settings.master).toBeGreaterThan(0);
  });

  it('clamps hostile values and drops unknown nodes', () => {
    const raw = {
      version: 1,
      settings: { master: 99, music: -5, damageNumbers: 'yes' },
      meta: {
        embers: -200,
        nodes: { wick_trim: 999, hacked_node: 4 },
        unlockedFamilies: ['ember', 'nope', 'volt'],
      },
      stats: { runs: -3, kills: 12.7 },
      bestiary: ['wisp', 42, 'wisp'],
      achievements: { first_light: 123, bogus: -1 },
    };
    const data = sanitizeSave(raw, SAVE_SCHEMA);
    expect(data.settings.master).toBe(1);
    expect(data.settings.music).toBe(0);
    expect(data.settings.damageNumbers).toBe(true);
    expect(data.meta.embers).toBe(0);
    expect(data.meta.nodes.wick_trim).toBe(3);
    expect(data.meta.nodes.hacked_node).toBeUndefined();
    expect(data.meta.unlockedFamilies).toEqual(['ember', 'volt']);
    expect(data.stats.runs).toBe(0);
    expect(data.stats.kills).toBe(12);
    expect(data.bestiary).toEqual(['wisp']);
    expect(data.achievements.first_light).toBe(123);
    expect(data.achievements.bogus).toBeUndefined();
  });
});

describe('map', () => {
  it('has a walkable road between entrance and hearth', () => {
    expect(PATH_LENGTH).toBeGreaterThan(1500);
    const start = samplePath(0);
    const end = samplePath(PATH_LENGTH);
    expect(start.x).toBeLessThan(0);
    expect(end.x).toBeCloseTo(HEARTH.x, 0);
    expect(end.y).toBeCloseTo(HEARTH.y, 0);
    const plots = new Set(PLOTS.map((p) => `${p.col},${p.row}`));
    expect(plots.size).toBe(PLOTS.length);
  });

  it('links orthogonal neighbouring plots only', () => {
    for (const plot of PLOTS) {
      for (const n of plot.neighbors) {
        const other = PLOTS[n] as (typeof PLOTS)[number];
        const d = Math.abs(other.col - plot.col) + Math.abs(other.row - plot.row);
        expect(d).toBe(1);
      }
    }
  });
});

describe('draft', () => {
  it('offers valid, distinct cards', () => {
    const rng = new Rng(99);
    const result = draftCards({
      rng,
      wave: 7,
      families: ['ember', 'frost'],
      hand: [],
      towers: [],
      relics: [],
      offerCount: 3,
    });
    expect(result.cards).toHaveLength(3);
    const keys = result.cards.map((c) => `${c.kind}:${c.id}:${c.tier ?? ''}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const card of result.cards) {
      if (card.kind === 'sigil') {
        const def = SIGIL_BY_ID[card.id];
        expect(def).toBeDefined();
        expect(['ember', 'frost']).toContain(def?.family);
        expect(card.tier).toBeGreaterThanOrEqual(1);
        expect(card.tier).toBeLessThanOrEqual(3);
      }
    }
  });

  it('is deterministic for a given seed and context', () => {
    const ctx = {
      wave: 5,
      families: ['ember', 'volt'] as const,
      hand: [],
      towers: [],
      relics: [],
      offerCount: 4,
    };
    const a = draftCards({ ...ctx, families: [...ctx.families], rng: new Rng(5) });
    const b = draftCards({ ...ctx, families: [...ctx.families], rng: new Rng(5) });
    expect(a.cards.map((c) => `${c.id}:${c.tier}`)).toEqual(b.cards.map((c) => `${c.id}:${c.tier}`));
  });

  it('always offers something even when everything is maxed', () => {
    const result = draftCards({
      rng: new Rng(3),
      wave: 20,
      families: ['ember'],
      hand: [],
      towers: Array.from({ length: 20 }, () => ({
        sigilId: 'cinder_lance',
        tier: 3,
        elder: false,
        family: 'ember' as const,
        runes: [],
      })),
      relics: [],
      offerCount: 3,
    });
    expect(result.cards.length).toBeGreaterThan(0);
  });
});

describe('run economy', () => {
  it('starts with a draft and starting gold', () => {
    const run = freshRun();
    expect(run.phase).toBe('draft');
    expect(run.draft.length).toBeGreaterThanOrEqual(3);
    expect(run.gold).toBe(145);
    expect(run.hearth).toBe(BASE_HEARTH);
  });

  it('places a tower only with enough gold and an empty plot', () => {
    const run = freshRun();
    const card = makeDraft(run, 1).find((c) => c.kind === 'sigil');
    if (!card) throw new Error('expected a sigil');
    run.hand.push(card);
    run.phase = 'prep';
    run.gold = 1000;
    const goldBefore = run.gold;
    const result = placeTower(run, card.uid, 0);
    expect(result.ok).toBe(true);
    expect(plotTower(run, 0)).toBeDefined();
    expect(run.gold).toBeLessThan(goldBefore);
    const second = placeTower(run, card.uid, 1);
    expect(second.ok).toBe(false); // card consumed
  });

  it('refuses placement when broke', () => {
    const run = freshRun();
    const card = makeDraft(run, 1).find((c) => c.kind === 'sigil');
    if (!card) throw new Error('expected a sigil');
    run.hand.push(card);
    run.phase = 'prep';
    run.gold = 1;
    const res = placeTower(run, card.uid, 0);
    expect(res.ok).toBe(false);
    expect(run.hand).toHaveLength(1);
  });

  it('fuses same-family sigils of equal tier', () => {
    const run = freshRun();
    run.phase = 'prep';
    run.gold = 5000;
    const cardA = makeDraft(run, 1).find((c) => c.kind === 'sigil');
    const cardB = makeDraft(run, 1).find((c) => c.kind === 'sigil');
    if (!cardA || !cardB) throw new Error('need sigils');
    cardB.id = cardA.id;
    cardB.tier = 1;
    run.hand.push(cardA, cardB);
    expect(placeTower(run, cardA.uid, 0).ok).toBe(true);
    expect(placeTower(run, cardB.uid, 1).ok).toBe(true);
    const a = plotTower(run, 0);
    const b = plotTower(run, 1);
    if (!a || !b) throw new Error('missing towers');
    expect(canFuse(run, a, b)).toBe(true);
    const res = fuseTowers(run, a.uid, b.uid);
    expect(res.ok).toBe(true);
    expect(run.towers).toHaveLength(1);
    expect(plotTower(run, 0)?.tier).toBe(2);
    expect(run.fusions).toBe(1);
  });

  it('refuses to fuse sigils from different families', () => {
    const run = freshRun();
    run.phase = 'prep';
    run.gold = 5000;
    const cardA = { uid: nextCardUid(), kind: 'sigil' as const, id: 'cinder_lance', tier: 1, rarity: 'common' as const };
    const cardB = { uid: nextCardUid(), kind: 'sigil' as const, id: 'rime_shard', tier: 1, rarity: 'common' as const };
    run.hand.push(cardA, cardB);
    expect(placeTower(run, cardA.uid, 0).ok).toBe(true);
    expect(placeTower(run, cardB.uid, 1).ok).toBe(true);
    const a = plotTower(run, 0);
    const b = plotTower(run, 1);
    if (!a || !b) throw new Error('missing towers');
    expect(canFuse(run, a, b)).toBe(false);
    expect(fuseTowers(run, a.uid, b.uid).ok).toBe(false);
    expect(run.towers).toHaveLength(2);
  });

  it('forges an Elder from two tier-3 sigils of the same family', () => {
    const run = freshRun();
    run.phase = 'prep';
    run.gold = 9000;
    const card = { uid: nextCardUid(), kind: 'sigil' as const, id: 'rime_shard', tier: 3, rarity: 'rare' as const };
    run.hand.push({ ...card, uid: nextCardUid() }, { ...card, uid: nextCardUid() });
    const c1 = run.hand[0];
    const c2 = run.hand[1];
    if (!c1 || !c2) throw new Error('missing');
    expect(placeTower(run, c1.uid, 0).ok).toBe(true);
    expect(placeTower(run, c2.uid, 1).ok).toBe(true);
    const a = plotTower(run, 0);
    const b = plotTower(run, 1);
    if (!a || !b) throw new Error('missing towers');
    const res = fuseTowers(run, a.uid, b.uid);
    expect(res.ok).toBe(true);
    const elder = plotTower(run, 0);
    expect(elder?.elder).toBe(true);
    expect(elder?.sigilId).toBe('winter_glass');
    expect(run.elders).toBe(1);
  });

  it('attaches runes up to the socket count', () => {
    const run = freshRun();
    run.phase = 'prep';
    run.gold = 1000;
    const sigil = makeDraft(run, 1).find((c) => c.kind === 'sigil');
    if (!sigil) throw new Error('need sigil');
    run.hand.push(sigil);
    expect(placeTower(run, sigil.uid, 4).ok).toBe(true);
    const tower = plotTower(run, 4);
    if (!tower) throw new Error('missing tower');
    const runeA = { uid: nextCardUid(), kind: 'rune' as const, id: 'keen_edge', rarity: 'common' as const };
    const runeB = { uid: nextCardUid(), kind: 'rune' as const, id: 'quick_wick', rarity: 'common' as const };
    run.hand.push(runeA, runeB);
    const r1 = attachRune(run, runeA.uid, tower.uid);
    expect(r1.ok).toBe(true);
    // tier-1 sigil has no sockets by default, so the second must fail.
    const r2 = attachRune(run, runeB.uid, tower.uid);
    expect(r2.ok).toBe(false);
    expect(tower.runes).toHaveLength(1);
  });
});

describe('combat rules', () => {
  it('damage respects armour, marks and resistances', () => {
    const run = freshRun();
    run.phase = 'wave';
    run.gold = 0;
    // Spawn one husk manually through the wave system.
    run.spawns = [{ type: 'husk', at: 0, hpScale: 1 }];
    updateRun(run, 0.016);
    const husk = run.enemies[0];
    if (!husk) throw new Error('no enemy');
    const before = husk.hp;
    const res = damageEnemy(run, husk, 30, { family: 'ember' });
    const armorSaved = before - husk.hp;
    expect(armorSaved).toBeLessThan(30);
    expect(res.dealt).toBeGreaterThan(0);

    husk.statuses.mark = { stacks: 1, time: 5, power: 0.5 };
    const hp2 = husk.hp;
    damageEnemy(run, husk, 30, { family: 'ember' });
    const markedDamage = hp2 - husk.hp;
    expect(markedDamage).toBeGreaterThan(armorSaved);
  });

  it('applies burn damage over time and eventually kills', () => {
    const run = freshRun();
    run.phase = 'wave';
    run.spawns = [{ type: 'mite', at: 0, hpScale: 1 }];
    updateRun(run, 0.016);
    const mite = run.enemies[0];
    if (!mite) throw new Error('no enemy');
    damageEnemy(run, mite, 1, {
      family: 'ember',
      applyStatus: { id: 'burn', power: 12, duration: 3, stacks: 3 },
    });
    const hpAfterHit = mite.hp;
    advance(run, 1.2);
    expect(mite.dead || mite.hp < hpAfterHit).toBe(true);
  });
});

describe('run loop', () => {
  it('spawns a wave and finishes it when the board is clear', () => {
    const run = freshRun();
    run.phase = 'prep';
    run.gold = 5000;
    // A very strong tower so the wave is guaranteed to clear.
    run.hand.push({ uid: nextCardUid(), kind: 'sigil', id: 'ashfall', tier: 3, rarity: 'rare' });
    const card = run.hand[0];
    if (!card) throw new Error('missing');
    expect(placeTower(run, card.uid, 4).ok).toBe(true);
    const tower = plotTower(run, 4);
    if (tower) tower.kindle = 3;
    const res = startWave(run);
    expect(res.ok).toBe(true);
    expect(run.wave).toBe(1);
    expect(run.phase).toBe('wave');
    for (let i = 0; i < 60 * 90 && (run.phase as string) === 'wave'; i++) updateRun(run, 1 / 60);
    expect(run.phase).not.toBe('wave');
    expect(run.kills).toBeGreaterThan(0);
    expect(run.goldEarned).toBeGreaterThan(0);
  });

  it('loses hearth and ends the run when overwhelmed', () => {
    const run = freshRun();
    run.phase = 'wave';
    run.hearth = 4;
    run.spawns = [
      { type: 'wisp', at: 0, hpScale: 1 },
      { type: 'wisp', at: 0.2, hpScale: 1 },
      { type: 'wisp', at: 0.4, hpScale: 1 },
    ];
    // No towers: everything leaks.
    for (let i = 0; i < 60 * 120 && (run.phase as string) === 'wave'; i++) updateRun(run, 1 / 60);
    expect(run.phase).toBe('over');
    expect(run.leaks).toBeGreaterThan(0);
    // No kills, so this run banks no embers.
    expect(run.kills).toBe(0);
    expect(run.summary?.victory).toBe(false);
    expect(run.summary?.embers).toBe(0);
  });

  it('summarises an abandoned run', () => {
    const run = freshRun();
    run.phase = 'prep';
    const summary = abandonRun(run);
    expect(summary.wave).toBe(0);
    expect(summary.victory).toBe(false);
    // Abandoning before fighting earns nothing — no ember farming by restarting.
    expect(summary.embers).toBe(0);
    expect(buildSummary(run, false).towers).toEqual([]);
  });

  it('reroll costs gold once free rerolls are spent', () => {
    const run = freshRun();
    expect(run.phase).toBe('draft');
    run.gold = 100;
    run.freeRerolls = 0;
    const first = run.draft.map((c) => c.uid);
    const res = rerollDraft(run);
    expect(res.ok).toBe(true);
    expect(run.gold).toBe(80);
    expect(run.draft.map((c) => c.uid)).not.toEqual(first);
  });

  it('denies drafting when the hand is full', () => {
    const run = freshRun();
    const cap = handCapacity(run);
    for (let i = 0; i < cap; i++) {
      run.hand.push({ uid: nextCardUid(), kind: 'rune', id: 'keen_edge', rarity: 'common' });
    }
    const card = run.draft.find((c) => c.kind !== 'relic' && c.kind !== 'cache');
    if (!card) return;
    const res = pickDraftCard(run, card.uid);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/hand/i);
  });
});

/**
 * A greedy bot: plays drafts, builds, fuses and starts waves. Used both as a
 * regression test for the whole loop and as a coarse balance probe.
 */
const playBot = (seed: number, mode: 'vigil' | 'nightfall' | 'endless' = 'vigil', maxWaves = 15) => {
  const run = freshRun(seed, mode);
  let guardSteps = 0;
  while (run.phase !== 'over' && run.phase !== 'victory' && guardSteps < 60 * 60 * 60) {
    guardSteps++;
    if (run.phase === 'draft') {
      // Prefer sigils, then relics, then runes.
      const sigil = run.draft.find((c) => c.kind === 'sigil');
      const relic = run.draft.find((c) => c.kind === 'relic');
      const rune = run.draft.find((c) => c.kind === 'rune');
      const cache = run.draft.find((c) => c.kind === 'cache');
      const pick = !sigil && (relic || rune || cache) ? (relic ?? rune ?? cache) : sigil ?? relic ?? rune ?? cache;
      if (!pick) break;
      const res = pickDraftCard(run, pick.uid);
      if (!res.ok) break;
      continue;
    }
    if (run.phase === 'prep') {
      // Place whatever sigils we can.
      for (const card of [...run.hand]) {
        if (card.kind !== 'sigil') continue;
        for (let plot = 0; plot < PLOTS.length; plot++) {
          if (plotTower(run, plot)) continue;
          const res = placeTower(run, card.uid, plot);
          if (res.ok) break;
        }
      }
      // Fuse duplicates when affordable, but keep enough coverage on the road.
      let fused = run.towers.length > 6;
      while (fused) {
        fused = false;
        for (let i = 0; i < run.towers.length && !fused; i++) {
          for (let j = i + 1; j < run.towers.length; j++) {
            const a = run.towers[i];
            const b = run.towers[j];
            if (!a || !b) continue;
            if (run.towers.length > 6 && canFuse(run, a, b)) {
              const res = fuseTowers(run, a.uid, b.uid);
              if (res.ok) {
                fused = true;
                break;
              }
            }
          }
        }
      }
      // Attach runes.
      for (const card of [...run.hand]) {
        if (card.kind !== 'rune') continue;
        const tower = run.towers.find((t) => t.runes.length < t.sockets);
        if (!tower) break;
        attachRune(run, card.uid, tower.uid);
      }
      const res = startWave(run);
      if (!res.ok) break;
      continue;
    }
    updateRun(run, 1 / 30);
  }
  return run;
};

describe('full run regression', () => {
  it('completes a 15-wave run without crashing (seeds 1..5)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const run = playBot(seed);
      expect(['over', 'victory']).toContain(run.phase);
      expect(run.wave).toBeGreaterThan(0);
      expect(run.summary).toBeDefined();
      expect(Number.isFinite(run.hearth)).toBe(true);
      expect(run.hearth).toBeGreaterThanOrEqual(0);
      expect(run.summary?.embers).toBeGreaterThan(0);
      // No runaway entity counts.
      expect(run.enemies.length).toBeLessThan(300);
    }
  });

  it('reaches at least wave 6 with the greedy bot', () => {
    const results = [11, 22, 33].map((seed) => playBot(seed).wave);
    const best = Math.max(...results);
    expect(best).toBeGreaterThanOrEqual(6);
  });

  it('continues into endless waves', () => {
    const run = playBot(9, 'endless', 18);
    // Endless keeps going past the act-1 finale unless the road is lost.
    expect(run.wave).toBeGreaterThanOrEqual(15);
    if (run.phase !== 'over') expect(run.wave).toBeGreaterThan(15);
    expect(run.phase === 'over' || run.phase === 'prep' || run.phase === 'draft').toBe(true);
  });
});
