import { describe, it } from 'vitest';
import { defaultSave } from '../src/core/save';
import { computeMetaBuffs } from '../src/game/data/meta';
import {
  canFuse, createRun, discardCard, fuseTowers, handCapacity, kindleTower, kindleCost,
  pickDraftCard, placeTower, plotTower, startWave, towerDps, updateRun, attachRune, type Run,
} from '../src/game/sim/engine';
import { PLOTS, nearestPathDistanceAlong } from '../src/game/sim/map';

const SPREAD_ORDER = [...PLOTS].sort((a,b)=>nearestPathDistanceAlong(a.x,a.y)-nearestPathDistanceAlong(b.x,b.y));
const pickPlot = (used: Set<number>, pathPositions: number[]): number => {
  // Choose the free plot furthest (along the road) from plots already used.
  let best = -1; let bestGap = -1;
  for (const plot of SPREAD_ORDER) {
    if (used.has(plot.index)) continue;
    const pos = pathPositions[plot.index]!;
    let gap = Infinity;
    for (const u of used) gap = Math.min(gap, Math.abs(pos - pathPositions[u]!));
    if (used.size === 0) gap = Infinity;
    if (gap > bestGap) { bestGap = gap; best = plot.index; }
  }
  return best;
};
const PATH_POS = PLOTS.map(p => nearestPathDistanceAlong(p.x, p.y));

type Mode = 'vigil' | 'nightfall' | 'endless';

const makeRun = (seed: number, mode: Mode): Run => {
  const save = defaultSave(1);
  save.meta.unlockedFamilies = ['ember', 'frost', 'verdant', 'volt', 'umbral'];
  return createRun({ mode, seed }, save.meta, computeMetaBuffs(save.meta));
};

export const bot = (seed: number, mode: Mode, verbose = false) => {
  const run = makeRun(seed, mode);
  let steps = 0;
  while (run.phase !== 'over' && run.phase !== 'victory' && steps < 60 * 60 * 120) {
    steps++;
    if (run.phase === 'draft') {
      const sigil = run.draft.find((c) => c.kind === 'sigil');
      const other = run.draft.find((c) => c.kind === 'cache') ?? run.draft.find((c) => c.kind === 'relic') ?? run.draft.find((c) => c.kind === 'rune');
      const pick = sigil ?? other ?? run.draft[0];
      if (!pick) break;
      if (sigil && run.hand.length >= handCapacity(run)) {
        const runeCard = run.hand.find((c) => c.kind === 'rune');
        const worstSigil = [...run.hand].filter((c) => c.kind === 'sigil').sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1))[0];
        const victim = runeCard ?? worstSigil;
        if (victim) discardCard(run, victim.uid);
      }
      if (!pickDraftCard(run, pick.uid).ok) break;
      continue;
    }
    if (run.phase === 'prep') {
      for (const card of [...run.hand]) {
        if (card.kind !== 'sigil') continue;
        const used = new Set(run.towers.map(t => t.plot));
        for (let attempt = 0; attempt < PLOTS.length; attempt++) {
          const p = pickPlot(used, PATH_POS);
          if (p < 0) break;
          used.add(p);
          if (placeTower(run, card.uid, p).ok) break;
        }
      }
      let fused = true;
      while (fused) {
        fused = false;
        for (let i = 0; i < run.towers.length && !fused; i++) {
          for (let j = i + 1; j < run.towers.length; j++) {
            const a = run.towers[i]!; const b = run.towers[j]!;
            if (canFuse(run, a, b) && fuseTowers(run, a.uid, b.uid).ok) { fused = true; break; }
          }
        }
      }
      for (const card of [...run.hand]) {
        if (card.kind !== 'rune') continue;
        const tower = run.towers.find((t) => t.runes.length < t.sockets);
        if (!tower) break;
        attachRune(run, card.uid, tower.uid);
      }
      // Kindle: cheapest tower first while rich.
      let budget = run.gold - 120;
      let guard = 0;
      while (budget > 0 && guard++ < 12) {
        const t = [...run.towers].filter(t => t.kindle < 3).sort((a,b) => kindleCost(a)-kindleCost(b))[0];
        if (!t) break;
        const cost = kindleCost(t);
        if (cost > run.gold - 60) break;
        if (!kindleTower(run, t.uid).ok) break;
        budget -= cost;
      }
      const res = startWave(run);
      if (!res.ok) { console.log('cannot start', res.reason, seed); break; }
      if (verbose) {
        const dps = run.towers.reduce((a, t) => a + towerDps(t), 0);
        console.log(`seed ${seed} enter w${run.wave} hp${run.hearth}/${run.hearthMax} gold${run.gold} towers${run.towers.length} dps${Math.round(dps)} hand${run.hand.length} relics${run.relics.length} fusions${run.fusions}`);
      }
      continue;
    }
    updateRun(run, 1 / 30);
  }
  const dps = run.towers.reduce((a, t) => a + towerDps(t), 0);
  if (verbose) console.log(`END seed ${seed} phase=${run.phase} wave=${run.wave} hearth=${run.hearth} towers=${run.towers.length} dps=${Math.round(dps)} kills=${run.kills} leaks=${run.leaks} fusions=${run.fusions} elders=${run.elders} time=${Math.round(run.time)}s`);
  return run;
};

describe('balance probe', () => {
  it('reports progression', () => {
    const waves: number[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const r = bot(seed, 'vigil', true);
      waves.push(r.wave);
    }
    console.log('waves', waves.join(','), 'median', waves.sort((a,b)=>a-b)[5]);
  });
});
