import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { installFakeDom } from '../tests/render.harness';

it('dumps cards', async () => {
  installFakeDom();
  const { Ui, drawCard } = await import('../src/app/ui');
  const { createRun } = await import('../src/game/sim/engine');
  const { draftCards } = await import('../src/game/sim/draft');
  const { Rng } = await import('../src/core/rng');
  const c = createCanvas(1600, 900);
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D;
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(0, 0, 1600, 900);
  const ui = new Ui();
  ui.beginFrame(1 / 60);
  const { defaultSave } = await import('../src/core/save');
  const { computeMetaBuffs } = await import('../src/game/data/meta');
  const save = defaultSave();
  const run = createRun({ mode: 'vigil', seed: 99 }, save.meta, computeMetaBuffs(save.meta));
  const res = draftCards({
    rng: new Rng(21),
    wave: 5,
    families: ['ember', 'frost', 'verdant', 'volt', 'umbral'],
    hand: run.hand,
    towers: run.towers,
    relics: run.relics,
    offerCount: 5,
  } as never);
  const cards = res.cards as unknown as import('../src/game/types').Card[];
  cards.forEach((card, i) => {
    drawCard(ctx, ui, card, { x: 40 + i * 300, y: 100, w: 280, h: 520 });
  });
  ui.endFrame();
  mkdirSync('artifacts/preview', { recursive: true });
  writeFileSync('artifacts/preview/cards.png', c.toBuffer('image/png'));
  console.log(cards.map((x) => `${x.kind}:${x.id}`).join(','));
});
