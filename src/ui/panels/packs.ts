/**
 * Card pack station: pack shop with published odds, purchase confirmation and the
 * premium reveal sequence (float -> charge -> burst -> three cards rise, spin, flip,
 * rarity effects play, rewards land in the collection).
 */
import { el, clear, fmt } from '../dom.ts';
import { DUPLICATE_CRYSTALS, RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, formatBonus, type CrewCard } from '../../data/crew.ts';
import { PACKS, openPack, packOdds, type PackDef } from '../../sim/packs.ts';
import { gameRng } from '../../core/rng.ts';
import { renderCardFace } from '../../render/cardart.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

const rarityRank = (r: CrewCard['rarity']) => RARITY_ORDER.indexOf(r);

/** Canvas particle burst used behind the revealed cards. */
function burstCanvas(color: number, intensity: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 520;
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none',
  } as CSSStyleDeclaration);
  const ctx = canvas.getContext('2d')!;
  const particles = Array.from({ length: Math.floor(70 * intensity) }, () => ({
    x: canvas.width / 2, y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 14,
    life: 1, size: Math.random() * 5 + 1.5,
  }));
  const col = `#${color.toString(16).padStart(6, '0')}`;
  const step = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.life -= 0.016;
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.985; p.vy *= 0.985;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return canvas;
}

export function playPackOpening(ctx: UIContext, pack: PackDef, cards: CrewCard[], newIds: string[], refunded: number): void {
  const reduced = ctx.state.settings.reducedMotion || ctx.state.settings.skipPackAnimation;
  const best = cards.reduce((acc, c) => (rarityRank(c.rarity) > rarityRank(acc.rarity) ? c : acc), cards[0]);
  const bestColor = RARITY_COLOR[best.rarity];

  const stage = el('div', { class: 'cardPackStage', style: { height: '520px' } });
  const cardRow = el('div', {
    style: { display: 'flex', gap: '18px', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: '2' },
  });
  const packNode = el('div', { class: 'pack' });
  const skipBtn = el('button', {
    class: 'btn ghost small',
    style: { position: 'absolute', right: '14px', top: '14px', zIndex: '5' },
    onclick: () => finish(true),
  }, ['SKIP']);
  const summary = el('div', { style: { padding: '0 18px 18px', display: 'none' } });

  const content = el('div', { class: 'modal' }, [
    el('div', { class: 'panelHead' }, [
      el('h2', {}, [pack.name.toUpperCase()]),
      el('span', { class: 'mini' }, ['3 crew cards · duplicates convert to crystals']),
    ]),
    stage,
    summary,
  ]);
  stage.append(packNode, cardRow, skipBtn);
  const close = ctx.shell.modal(content, { dismissable: false });

  let finished = false;
  const timers: number[] = [];
  const finish = (skipped = false) => {
    if (finished) return;
    finished = true;
    for (const t of timers) window.clearTimeout(t);
    packNode.remove();
    clear(cardRow);
    for (const card of cards) cardRow.appendChild(faceNode(card, true));
    summary.style.display = 'block';
    clear(summary);
    summary.append(
      el('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' } },
        cards.map((c, i) => el('div', {
          style: {
            flex: '1 1 220px', padding: '10px 12px', borderRadius: '12px',
            border: `1px solid ${colorCss(RARITY_COLOR[c.rarity], 0.5)}`,
            background: colorCss(RARITY_COLOR[c.rarity], 0.08),
          },
        }, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            el('b', { style: { fontSize: '12px' } }, [c.name]),
            el('span', { class: `badge ${c.rarity}` }, [RARITY_LABEL[c.rarity]]),
          ]),
          el('div', { class: 'mini' }, [c.role]),
          el('div', { class: 'mini', style: { color: '#9ff' } }, [formatBonus(c.bonus.key, c.bonus.value)]),
          c.bonus2 ? el('div', { class: 'mini', style: { color: '#9ff' } }, [formatBonus(c.bonus2.key, c.bonus2.value)]) : null,
          el('div', { class: 'mini', style: { marginTop: '4px', color: newIds.includes(c.id) ? '#00ff9d' : '#ffb700' } }, [
            newIds.includes(c.id) ? 'NEW CARD' : `DUPLICATE  ·  +${DUPLICATE_CRYSTALS[c.rarity]} crystals`,
          ]),
          el('span', { class: 'mini', style: { display: 'none' } }, [String(i)]),
        ]))),
      ...(refunded > 0 ? [el('div', { class: 'mini', style: { marginBottom: '10px', color: '#ffb700' } }, [
        `Duplicates converted into ${refunded} crystals.`,
      ])] : []),
      el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' } }, [
        el('button', { class: 'btn', onclick: () => { audio.uiClick(); close(); ctx.refresh(); } }, ['COLLECT']),
      ]),
    );
    if (!skipped) audio.achievement();
  };

  const colorCss = (hex: number, alpha: number) => {
    const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const faceNode = (card: CrewCard, revealed: boolean): HTMLElement => {
    const wrap = el('div', {
      class: 'card3d',
      style: {
        width: '182px', height: '256px', flex: '0 0 auto',
        boxShadow: `0 10px 40px ${colorCss(RARITY_COLOR[card.rarity], 0.45)}`,
        border: `1px solid ${colorCss(RARITY_COLOR[card.rarity], 0.8)}`,
      },
    });
    if (revealed) {
      const canvas = document.createElement('canvas');
      renderCardFace(canvas, card, 260, 364);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      wrap.appendChild(canvas);
    } else {
      wrap.appendChild(el('div', {
        style: {
          width: '100%', height: '100%', display: 'grid', placeItems: 'center',
          background: 'linear-gradient(145deg,#141f45,#070c20)',
          fontFamily: 'Orbitron', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(200,220,255,0.7)',
        },
      }, ['SPACE MINER']));
    }
    return wrap;
  };

  if (reduced) {
    finish(true);
    return;
  }

  // ------------------------------------------------------------- sequence
  audio.uiClick();
  packNode.animate(
    [{ transform: 'scale(0.6) rotateY(-30deg)', opacity: 0 }, { transform: 'scale(1) rotateY(0deg)', opacity: 1 }],
    { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1)' },
  );

  timers.push(window.setTimeout(() => {
    // Charge up: particles + shake.
    stage.appendChild(burstCanvas(0x7b61ff, 0.7));
    packNode.animate(
      [
        { transform: 'translateY(0) rotate(0deg)' },
        { transform: 'translateY(-6px) rotate(-3deg)' },
        { transform: 'translateY(4px) rotate(3deg)' },
        { transform: 'translateY(-8px) rotate(-2deg)' },
        { transform: 'translateY(0) rotate(0deg)' },
      ],
      { duration: 900, iterations: 1 },
    );
    audio.tone(220, 0.9, 'sawtooth', 0.12, 880);
  }, 600));

  timers.push(window.setTimeout(() => {
    // Burst open.
    packNode.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 320, easing: 'ease-in' });
    stage.appendChild(burstCanvas(bestColor, 1.6));
    audio.explosion(0.5);
    window.setTimeout(() => packNode.remove(), 320);
  }, 1550));

  // Reveal the three cards one by one.
  cards.forEach((card, i) => {
    timers.push(window.setTimeout(() => {
      const node = faceNode(card, false);
      cardRow.appendChild(node);
      node.animate(
        [
          { transform: 'translateY(90px) rotateY(0deg) scale(0.7)', opacity: 0 },
          { transform: 'translateY(0) rotateY(360deg) scale(1)', opacity: 1 },
        ],
        { duration: 760, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
      audio.tone(520 + i * 90, 0.18, 'triangle', 0.14);

      // Flip to the face after the rise.
      window.setTimeout(() => {
        node.animate(
          [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }],
          { duration: 170, easing: 'ease-in' },
        ).onfinish = () => {
          clear(node);
          const canvas = document.createElement('canvas');
          renderCardFace(canvas, card, 260, 364);
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          node.appendChild(canvas);
          node.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }], { duration: 190, easing: 'ease-out' });

          const rank = rarityRank(card.rarity);
          audio.cardReveal(rank);
          if (rank >= 2) {
            const glow = el('div', {
              style: {
                position: 'absolute', inset: '-12px', borderRadius: '18px', pointerEvents: 'none',
                boxShadow: `0 0 ${18 + rank * 10}px ${colorCss(RARITY_COLOR[card.rarity], 0.85)}`,
              },
            });
            node.appendChild(glow);
          }
          if (rank >= 3) stage.appendChild(burstCanvas(RARITY_COLOR[card.rarity], 0.5 + rank * 0.25));
          if (rank >= 5) {
            // Mythic / secret: animated cosmic backdrop.
            stage.style.background = `radial-gradient(600px 400px at 50% 40%, ${colorCss(RARITY_COLOR[card.rarity], 0.45)}, transparent 70%), #05081a`;
            stage.animate(
              [{ filter: 'brightness(1)' }, { filter: 'brightness(1.5)' }, { filter: 'brightness(1)' }],
              { duration: 1200, iterations: 2 },
            );
          }
        };
      }, 700);
    }, 1900 + i * 820));
  });

  timers.push(window.setTimeout(() => finish(false), 1900 + cards.length * 820 + 1400));
}

export function buildPacksPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const grid = el('div', { class: 'shopGrid' });

  const render = () => {
    clear(grid);
    for (const pack of PACKS) {
      const odds = packOdds(pack);
      grid.appendChild(el('div', { class: 'kpiCard', style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, [
        el('div', {
          style: {
            height: '120px', borderRadius: '12px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(145deg, rgba(${(pack.color >> 16) & 255},${(pack.color >> 8) & 255},${pack.color & 255},0.35), rgba(8,12,30,0.95))`,
            display: 'grid', placeItems: 'center',
          },
        }, [
          el('div', {
            style: {
              width: '72px', height: '100px', borderRadius: '8px',
              background: 'linear-gradient(180deg,#1a2550,#0c1230)',
              border: '1px solid rgba(255,255,255,0.25)', display: 'grid', placeItems: 'center',
              fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.1em', textAlign: 'center',
              boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
            },
          }, ['SPACE', el('br', {}), 'MINER']),
        ]),
        el('b', { style: { fontFamily: 'Orbitron', fontSize: '12px' } }, [pack.name]),
        el('div', { class: 'mini', style: { minHeight: '32px' } }, [pack.description]),
        el('div', { class: 'mini', style: { display: 'grid', gap: '2px' } },
          odds.map((o) => el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
            el('span', { style: { color: `#${RARITY_COLOR[o.rarity].toString(16).padStart(6, '0')}` } }, [RARITY_LABEL[o.rarity]]),
            el('span', {}, [`${(o.chance * 100).toFixed(o.chance < 0.01 ? 3 : 1)}%`]),
          ]))),
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
          el('b', { style: { color: state.crystals >= pack.cost ? '#00e5ff' : '#ff6b8a', fontFamily: 'JetBrains Mono' } }, [`${pack.cost} CRYSTALS`]),
          el('button', {
            class: 'btn', style: { marginLeft: 'auto' },
            onclick: async () => {
              if (state.crystals < pack.cost) {
                audio.error();
                ctx.notify('Not enough crystals - complete achievements to earn more.', 'error');
                return;
              }
              const ok = await ctx.shell.confirm(
                `Open ${pack.name}?`,
                `This will spend ${pack.cost} crystals and award exactly 3 crew cards. You currently hold ${fmt(state.crystals)} crystals.`,
                'OPEN PACK',
              );
              if (!ok) return;
              // Spend first so a duplicate click cannot double-open the same pack.
              if (!state.spendCrystals(pack.cost)) {
                audio.error();
                return;
              }
              const packState = { pity: state.packPity };
              const result = openPack(pack, gameRng, state.crew, packState);
              state.packPity = packState.pity;
              for (const id of result.newCards) state.grantCard(id);
              if (result.crystalsRefunded > 0) state.addCrystals(result.crystalsRefunded);
              state.stats.packsOpened += 1;
              state.trackStat('packsOpened', 1);
              state.achievements.setStat('cardsOwned', state.crew.size);
              ctx.save();
              ctx.refresh();
              render();
              playPackOpening(ctx, pack, result.cards, result.newCards, result.crystalsRefunded);
            },
          }, ['OPEN PACK']),
        ]),
      ]));
    }
  };

  render();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [
      el('h2', {}, ['CARD PACK STATION']),
      el('span', { class: 'mini' }, [`${fmt(state.crystals)} crystals available · every pack contains exactly 3 cards`]),
    ]),
    grid,
  ]);
}
