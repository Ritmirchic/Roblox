/**
 * Hangar overlay: quick status, station shortcuts and the launch control.
 */
import { el, fmt } from '../dom.ts';
import { cellsToNextCrewSlot, crewSlotProgress } from '../../sim/economy.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

export function buildHangarPanel(ctx: UIContext): HTMLElement {
  const { state, hangar } = ctx;
  hangar.setMode('view');
  const s = state.ship.stats();

  const card = (title: string, value: string, sub?: string) => el('div', {
    style: {
      background: 'rgba(8,13,30,0.9)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '12px',
      padding: '10px 12px', minWidth: '140px',
    },
  }, [
    el('div', { class: 'mini' }, [title]),
    el('b', { style: { fontSize: '16px', fontFamily: 'JetBrains Mono' } }, [value]),
    sub ? el('div', { class: 'mini', style: { opacity: '0.7' } }, [sub]) : null,
  ]);

  const quick = (label: string, panel: Parameters<typeof ctx.shell.navigate>[0]) => el('button', {
    class: 'btn ghost small',
    onclick: () => { audio.uiClick(); ctx.shell.navigate(panel); },
  }, [label]);

  return el('div', { style: { position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' } }, [
    el('div', {
      style: {
        position: 'absolute', left: '14px', bottom: '14px', display: 'flex', gap: '10px',
        flexWrap: 'wrap', pointerEvents: 'auto', maxWidth: 'calc(100% - 28px)',
      },
    }, [
      card('SHIP MASS', `${fmt(s.mass)} t`, `${s.moduleCount} modules`),
      card('THRUST / MASS', s.thrustToMass.toFixed(2), s.thrustToMass > 0.3 ? 'Responsive' : 'Sluggish - add engines'),
      card('ENERGY', `${fmt(s.energyGen)}/${fmt(s.energyDraw)}`, s.energyBalance >= 0 ? 'Stable' : 'Deficit!'),
      card('MINING DPS', fmt(s.miningDps)),
      card('WEAPON DPS', fmt(s.weaponDps)),
      card('CREW SLOTS', `${state.equippedCrew.length}/${state.crewSlots}`, `${cellsToNextCrewSlot(state.ship.purchasedCount)} cells to next (${Math.round(crewSlotProgress(state.ship.purchasedCount) * 100)}%)`),
    ]),
    el('div', {
      style: {
        position: 'absolute', right: '14px', bottom: '14px', display: 'flex', gap: '8px',
        pointerEvents: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '420px',
      },
    }, [
      quick('SHIP BUILDER', 'builder'),
      quick('EQUIPMENT', 'shop'),
      quick('CREW', 'crew'),
      quick('PACKS', 'packs'),
      quick('ACHIEVEMENTS', 'achievements'),
      el('button', {
        class: 'btn gold',
        onclick: () => { audio.uiClick(); ctx.shell.navigate('sectors'); },
      }, ['LAUNCH EXPEDITION']),
    ]),
    el('div', {
      style: {
        position: 'absolute', left: '50%', top: '14px', transform: 'translateX(-50%)',
        pointerEvents: 'none', textAlign: 'center',
      },
    }, [
      el('div', { class: 'mini', style: { letterSpacing: '0.18em', fontFamily: 'Orbitron' } }, ['DOCK ALPHA · ORBITAL FOUNDRY']),
      el('div', { class: 'mini', style: { opacity: '0.6' } }, ['Click a station terminal in the hangar, or use the menu on the left']),
    ]),
  ]);
}
