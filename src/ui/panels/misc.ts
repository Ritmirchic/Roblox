/**
 * Logbook (statistics + ore silo) and Settings panels.
 */
import { el, clear, fmt } from '../dom.ts';
import { RESOURCES } from '../../data/sectors.ts';
import { CREW_CARDS } from '../../data/crew.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

export function buildStatsPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const body = el('div', { style: { overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' } });

  const render = () => {
    clear(body);
    const s = state.stats;
    const stat = (label: string, value: string) => el('div', { class: 'kpiCard' }, [
      el('div', { class: 'mini' }, [label]),
      el('b', { style: { fontSize: '18px' } }, [value]),
    ]);
    body.appendChild(el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' } }, [
      stat('ASTEROIDS MINED', fmt(s.asteroidsMined)),
      stat('ENEMIES DESTROYED', fmt(s.enemiesKilled)),
      stat('ORE COLLECTED', fmt(s.oreCollected)),
      stat('CREDITS EARNED', fmt(s.creditsEarned)),
      stat('CRYSTALS EARNED', fmt(s.crystalsEarned)),
      stat('EXPEDITIONS', fmt(s.expeditions)),
      stat('DISTANCE FLOWN', fmt(s.distance)),
      stat('PACKS OPENED', fmt(s.packsOpened)),
      stat('RARE FINDS', fmt(s.rareFinds)),
      stat('DAMAGE DEALT', fmt(s.damageDealt)),
      stat('CREW COLLECTED', `${state.crew.size}/${CREW_CARDS.length}`),
      stat('SHIP MODULES', fmt(state.ship.modules.length)),
      stat('EXPANSION CELLS', fmt(state.ship.purchasedCount)),
      stat('SECTORS UNLOCKED', `${state.unlockedSectors.size}/5`),
    ]));

    const silo = Object.entries(state.ore).filter(([, q]) => q > 0);
    const siloValue = silo.reduce((acc, [id, qty]) => acc + qty * RESOURCES[id].value, 0);
    body.appendChild(el('div', { class: 'kpiCard' }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } }, [
        el('b', { style: { fontFamily: 'Orbitron', fontSize: '12px' } }, ['ORE SILO']),
        el('span', { class: 'mini' }, [`Market value ${fmt(siloValue)} CR`]),
        el('button', {
          class: 'btn small', style: { marginLeft: 'auto' },
          onclick: () => {
            if (siloValue <= 0) { audio.error(); return; }
            state.addCredits(siloValue);
            state.ore = {};
            audio.purchase();
            ctx.notify(`Sold the entire silo for ${fmt(siloValue)} credits.`, 'success');
            ctx.save(); ctx.refresh(); render();
          },
        }, ['SELL ALL']),
      ]),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '8px' } },
        silo.length ? silo.map(([id, qty]) => el('div', {
          style: { padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' },
        }, [
          el('div', { style: { fontSize: '11px', color: `#${RESOURCES[id].color.toString(16).padStart(6, '0')}` } }, [RESOURCES[id].name]),
          el('div', { class: 'mini' }, [`${fmt(qty)} units · ${fmt(qty * RESOURCES[id].value)} CR`]),
        ])) : [el('div', { class: 'mini' }, ['Silo empty - fly an expedition and bring ore home.'])]),
    ]));
  };

  render();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [el('h2', {}, ['LOGBOOK']), el('span', { class: 'mini' }, ['Career statistics and hangar storage.'])]),
    body,
  ]);
}

export function buildSettingsPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const body = el('div', { style: { overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '620px' } });

  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void) => {
    const out = el('b', { style: { fontFamily: 'JetBrains Mono', minWidth: '48px', textAlign: 'right' } }, [value.toFixed(2)]);
    return el('div', { class: 'kpiCard' }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        el('span', { style: { fontSize: '12px', flex: '1' } }, [label]),
        out,
      ]),
      el('input', {
        type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
        style: { width: '100%', marginTop: '8px' },
        oninput: (e: Event) => {
          const v = Number((e.target as HTMLInputElement).value);
          out.textContent = v.toFixed(2);
          onChange(v);
        },
      }),
    ]);
  };

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => {
    const btn = el('button', { class: value ? 'btn small' : 'btn ghost small' }, [value ? 'ON' : 'OFF']);
    btn.addEventListener('click', () => {
      const next = btn.textContent === 'OFF';
      btn.textContent = next ? 'ON' : 'OFF';
      btn.className = next ? 'btn small' : 'btn ghost small';
      onChange(next);
      audio.uiClick();
    });
    return el('div', { class: 'kpiCard', style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
      el('span', { style: { fontSize: '12px', flex: '1' } }, [label]),
      btn,
    ]);
  };

  body.append(
    slider('Music volume', state.settings.musicVolume, 0, 1, 0.05, (v) => {
      state.settings.musicVolume = v;
      audio.setVolumes(v, state.settings.sfxVolume);
      ctx.save();
    }),
    slider('Effects volume', state.settings.sfxVolume, 0, 1, 0.05, (v) => {
      state.settings.sfxVolume = v;
      audio.setVolumes(state.settings.musicVolume, v);
      ctx.save();
    }),
    slider('Camera sensitivity', state.settings.cameraSensitivity, 0.3, 2.5, 0.1, (v) => {
      state.settings.cameraSensitivity = v;
      ctx.save();
    }),
    toggle('Invert vertical axis', state.settings.invertY, (v) => { state.settings.invertY = v; ctx.save(); }),
    toggle('Reduced motion (shorter animations)', state.settings.reducedMotion, (v) => { state.settings.reducedMotion = v; ctx.save(); }),
    toggle('Skip pack opening animation', state.settings.skipPackAnimation, (v) => { state.settings.skipPackAnimation = v; ctx.save(); }),
    el('div', { class: 'kpiCard' }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        el('span', { style: { fontSize: '12px', flex: '1' } }, ['Graphics preset']),
        ...(['low', 'medium', 'high'] as const).map((q) => el('button', {
          class: state.settings.quality === q ? 'btn small' : 'btn ghost small',
          onclick: () => {
            state.settings.quality = q;
            ctx.save();
            ctx.notify('Graphics preset applied - reload the hangar for full effect.', 'info');
            ctx.refresh();
          },
        }, [q.toUpperCase()])),
      ]),
    ]),
    el('div', { class: 'kpiCard' }, [
      el('div', { class: 'mini', style: { marginBottom: '8px' } }, ['Save data']),
      el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
        el('button', { class: 'btn small', onclick: () => { ctx.save(); ctx.notify('Progress saved.', 'success'); } }, ['SAVE NOW']),
        el('button', {
          class: 'btn ghost small',
          onclick: async () => {
            const ok = await ctx.shell.confirm('Reset campaign?', 'This permanently deletes your ship, crew, cards and progress.', 'DELETE SAVE');
            if (!ok) return;
            localStorage.removeItem('spaceminer.save.v3');
            location.reload();
          },
        }, ['RESET CAMPAIGN']),
      ]),
    ]),
    el('div', { class: 'mini', style: { lineHeight: '1.6', opacity: '0.7' } }, [
      'Controls — Hangar: drag to orbit, wheel to zoom, click stations to open terminals. ',
      'Builder: select a module, R to rotate, click a cell to place, click an installed module to remove. ',
      'Flight: W/S thrust, A/D strafe, Space/C vertical, Q/E roll, X brake, Shift boost, mouse to steer, ',
      'left mouse to fire weapons, right mouse to fire mining lasers, Escape to return to the hangar.',
    ]),
  );

  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [el('h2', {}, ['SETTINGS'])]),
    body,
  ]);
}
