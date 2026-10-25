import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bootHarness, click, frame, move, type Harness } from './render.harness';
import type { App } from '../src/app/app';

const OUT = 'artifacts/screens';

const save = (h: Harness, name: string): void => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.png`, h.png());
};

const playable = (h: Harness): App => h.app as App;

describe('visual harness', () => {
  it('renders every screen', async () => {
    const h = await bootHarness();
    const app = playable(h);
    frame(h);
    save(h, '01-menu');

    // give the save some content
    app.save.meta.embers = 260;
    app.save.meta.embersEarned = 420;
    app.save.meta.unlockedFamilies = ['ember', 'frost', 'verdant'];
    app.save.meta.act1Cleared = true;
    app.save.stats.runs = 7;
    app.save.stats.wins = 2;
    app.save.stats.deepestWave = 18;
    app.save.stats.kills = 4200;
    app.save.stats.fusions = 12;
    app.save.stats.elders = 3;
    app.save.stats.goldEarned = 9400;
    app.save.stats.playSeconds = 5400;
    for (const id of ['wisp','mite','husk','flier','creeper','burrower']) app.save.codex[`enemy:${id}`] = 1;
    for (const id of ['cinder_lance','rime_shard','spark_arc','hex_bolt']) app.save.codex[`sigil:${id}`] = 1;
    for (const id of ['wick_trimmer','moth_charm']) app.save.codex[`relic:${id}`] = 1;
    for (const id of ['keen_edge']) app.save.codex[`rune:${id}`] = 1;
    app.save.achievements['first_light'] = 1;
    app.save.achievements['fusion_first'] = 1;
    app.save.meta.nodes['wick_trim'] = 2;
    app.save.meta.nodes['unlock_frost'] = 1;
    app.save.meta.nodes['unlock_verdant'] = 1;

    frame(h);
    save(h, '02-menu-progress');

    app.go('emberworks');
    frame(h);
    save(h, '03-emberworks');

    app.go('codex');
    frame(h);
    save(h, '04-codex');

    app.go('ledger');
    frame(h);
    save(h, '05-ledger');

    app.go('settings');
    frame(h);
    save(h, '06-settings');

    // start a run
    app.startRun('vigil');
    frame(h);
    save(h, '07-draft');

    // pick first draft card
    const run = app.runScreen!.run;
    app.runScreen!.host.ui.onPointerMove(400, 300);
    // use engine directly for a deterministic setup, then render UI
    const { placeTower, pickDraftCard, startWave } = await import('../src/game/sim/engine');
    while (run.phase === 'draft') {
      const c = run.draft[0];
      if (!c) break;
      if (!pickDraftCard(run, c.uid).ok) {
        run.hand.forEach((x) => app.runScreen && (run.hand = run.hand.filter((y) => y.uid !== x.uid)));
      }
    }
    // place some sigils
    let plot = 0;
    for (const handCard of [...run.hand]) {
      if (handCard.kind !== 'sigil') continue;
      for (let p = plot; p < 17; p++) {
        if (placeTower(run, handCard.uid, p).ok) { plot = p + 1; break; }
      }
    }
    run.gold = 320;
    frame(h);
    save(h, '08-prep');

    // select a tower to show the inspector
    if (run.towers[0]) {
      app.runScreen!.state.selectedTowerUid = run.towers[0].uid;
      app.runScreen!.state.hoverTowerUid = run.towers[0].uid;
    }
    move(h, run.towers[0]?.x ?? 300, run.towers[0]?.y ?? 300);
    frame(h);
    save(h, '09-tower-inspector');

    app.runScreen!.state.selectedTowerUid = null;
    startWave(run);
    // fast-forward into the wave
    const engine = await import('../src/game/sim/engine');
    for (let i = 0; i < 60 * 6; i++) {
      engine.updateRun(run, 1 / 60);
    }
    app.consumeRunEvents();
    frame(h);
    save(h, '10-wave');

    // force a boss + effects
    const { debugSpawnEnemy } = await import('../src/game/sim/engine');
    for (let i = 0; i < 4; i++) debugSpawnEnemy(run, i === 0 ? 'herald' : i === 1 ? 'choir' : i === 2 ? 'king' : 'shrieker', 300 + i * 260, 1);
    for (let i = 0; i < 60; i++) engine.updateRun(run, 1 / 60);
    app.consumeRunEvents();
    frame(h);
    save(h, '11-boss');

    // draft overlay with 5 cards after the wave
    run.phase = 'draft';
    run.draftWave = 6;
    run.draft = (await import('../src/game/sim/draft')).draftCards({
      rng: (await import('../src/core/rng')).Rng ? new (await import('../src/core/rng')).Rng(5) : (undefined as never),
      wave: 6,
      families: ['ember', 'frost', 'verdant'],
      hand: run.hand,
      towers: run.towers,
      relics: run.relics,
      offerCount: 5,
    }).cards;
    app.runScreen!.state.draftOpenedAt = 0;
    frame(h);
    save(h, '12-draft-overlay');

    // pause
    run.phase = 'prep';
    app.runScreen!.state.pauseOpen = true;
    frame(h);
    save(h, '13-pause');

    // results
    app.runScreen!.state.pauseOpen = false;
    const summary = (await import('../src/game/sim/engine')).buildSummary(run, true);
    app.lastResult = { summary, newAchievements: ['first_stand', 'elder_forged'], newCodex: 4, isBestWave: true };
    app.go('results');
    frame(h);
    save(h, '14-results');
  });
});
