import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { installFakeDom } from '../tests/render.harness';

it('dumps the bestiary', async () => {
  installFakeDom();
  const { drawEnemy } = await import('../src/game/render/art');
  const { drawText } = await import('../src/game/render/art');
  const { FONT_DISPLAY } = await import('../src/core/palette');
  const { ENEMIES } = await import('../src/game/data/enemies');

  const c = createCanvas(1400, 760);
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D;
  const grad = ctx.createLinearGradient(0, 0, 0, 760);
  grad.addColorStop(0, '#12181a');
  grad.addColorStop(1, '#0a0f10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1400, 760);
  const status = () => ({ stacks: 0, time: 0, power: 0 });
  const list = Object.values(ENEMIES);
  list.forEach((def, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = 140 + col * 280;
    const cy = 130 + row * 250;
    const scale = def.boss ? 1.1 : 2.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    drawEnemy(
      ctx,
      {
        uid: i,
        typeId: def.id,
        x: 0,
        y: 0,
        size: def.size,
        hp: def.hp! * 0.7,
        hpMax: def.hp!,
        boss: !!def.boss,
        shielded: 0,
        hitFlash: 0,
        seed: i * 31,
        lane: 'ground',
        statuses: { burn: status(), chill: status(), poison: status(), shock: status(), mark: status(), root: status() },
        slow: 0,
      } as never,
      def.shape,
      1.2,
    );
    ctx.restore();
    drawText(ctx, def.name, cx, cy + 92, {
      size: 13,
      font: FONT_DISPLAY,
      color: '#efe3c8',
      align: 'center',
      weight: 'bold',
    });
  });
  mkdirSync('artifacts/preview', { recursive: true });
  writeFileSync('artifacts/preview/bestiary.png', c.toBuffer('image/png'));
});
