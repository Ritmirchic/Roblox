/**
 * Achievement album: 30 live achievements across minute / hourly / daily / weekly periods,
 * each rendered as a collectible card with its own illustration, progress and crystal reward.
 */
import { el, clear, fmt } from '../dom.ts';
import { PERIOD_LABEL, type Period } from '../../data/achievements.ts';
import { formatCountdown, type ActiveAchievement } from '../../sim/achievements.ts';
import { paintAchievementArt } from '../../render/cardart.ts';
import { RARITY_COLOR, RARITY_LABEL } from '../../data/crew.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

const artCache = new Map<string, string>();

function achievementArt(a: ActiveAchievement): HTMLElement {
  const key = `${a.templateId}:${a.rarity}`;
  const cached = artCache.get(key);
  if (cached) {
    const img = new Image();
    img.src = cached;
    Object.assign(img.style, { width: '78px', height: '78px', borderRadius: '10px', display: 'block' });
    return img;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  paintAchievementArt(ctx, a.motif, a.rarity, a.artSeed, 256, 256);
  Object.assign(canvas.style, { width: '78px', height: '78px', borderRadius: '10px', display: 'block' });
  try { artCache.set(key, canvas.toDataURL('image/png')); } catch { /* ignore */ }
  return canvas;
}

export function buildAchievementsPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const body = el('div', { style: { overflow: 'auto', flex: '1' } });
  const header = el('div', { class: 'panelHead' });
  let timer = 0;

  const render = () => {
    const now = Date.now();
    const active = state.achievements.refresh(now, state.tier);
    const ready = active.filter((a) => !a.claimed && state.achievements.isComplete(a)).length;

    clear(header);
    header.append(
      el('h2', {}, ['ACHIEVEMENT ALBUM']),
      el('span', { class: 'mini' }, [
        `${active.length} active · ${state.achievements.state.completedCount} completed all-time · ${fmt(state.achievements.state.totalCrystals)} crystals earned`,
      ]),
      el('button', {
        class: ready ? 'btn' : 'btn ghost',
        style: { marginLeft: 'auto' },
        onclick: () => {
          const gained = state.achievements.claimAllReady(Date.now());
          if (gained > 0) {
            state.addCrystals(gained);
            audio.achievement();
            ctx.notify(`Claimed ${gained} crystals from completed achievements.`, 'success');
            ctx.save();
            ctx.refresh();
            render();
          } else {
            audio.error();
            ctx.notify('No completed achievements ready to claim.', 'error');
          }
        },
      }, [ready ? `CLAIM ALL (${ready})` : 'NOTHING TO CLAIM']),
    );

    clear(body);
    const periods: Period[] = ['minute', 'hourly', 'daily', 'weekly'];
    for (const period of periods) {
      const group = active.filter((a) => a.period === period);
      const resetIn = state.achievements.msUntilReset(period, now);
      body.appendChild(el('div', { class: 'panelHead', style: { borderTop: '1px solid rgba(255,255,255,0.06)' } }, [
        el('h2', { style: { fontSize: '12px' } }, [`${PERIOD_LABEL[period]} OBJECTIVES`]),
        el('span', { class: 'mini' }, [`${group.length} active · resets in ${formatCountdown(resetIn)}`]),
      ]));
      const grid = el('div', { class: 'achGrid' });
      for (const a of group) {
        const progress = state.achievements.state.progress[a.key] ?? 0;
        const complete = progress >= a.target;
        const color = RARITY_COLOR[a.rarity];
        grid.appendChild(el('div', {
          class: 'achCard',
          style: {
            borderColor: a.claimed ? 'rgba(255,255,255,0.08)' : complete ? 'rgba(0,255,157,0.5)' : `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},0.3)`,
            opacity: a.claimed ? '0.55' : '1',
          },
        }, [
          achievementArt(a),
          el('div', { style: { flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' } }, [
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' } }, [
              el('b', { style: { fontSize: '12px' } }, [a.name]),
              el('span', { class: `badge ${a.rarity}` }, [RARITY_LABEL[a.rarity]]),
            ]),
            el('div', { class: 'mini' }, [a.description]),
            el('div', { class: 'progress' }, [
              el('i', { style: { width: `${Math.min(100, (progress / a.target) * 100)}%`, background: complete ? 'linear-gradient(90deg,#00ff9d,#00e5ff)' : undefined } }),
            ]),
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              el('span', { class: 'mini' }, [`${fmt(Math.min(progress, a.target))} / ${fmt(a.target)}`]),
              el('span', { class: 'mini', style: { color: '#00e5ff' } }, [`+${a.crystals} crystals`]),
              a.claimed
                ? el('span', { class: 'mini', style: { color: '#00ff9d' } }, ['CLAIMED'])
                : el('button', {
                    class: complete ? 'btn small' : 'btn ghost small',
                    onclick: () => {
                      const gained = state.achievements.claim(a.key, Date.now());
                      if (gained > 0) {
                        state.addCrystals(gained);
                        audio.achievement();
                        ctx.notify(`${a.name} complete · +${gained} crystals`, 'success');
                        ctx.save();
                        ctx.refresh();
                        render();
                      } else {
                        audio.error();
                      }
                    },
                  }, [complete ? 'CLAIM' : 'IN PROGRESS']),
            ]),
          ]),
        ]));
      }
      body.appendChild(grid);
    }
  };

  render();
  timer = window.setInterval(render, 1000);
  const root = el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [header, body]);
  (root as any).dispose = () => window.clearInterval(timer);
  return root;
}
