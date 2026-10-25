/**
 * Ship builder HUD overlay: module palette, orientation control, expansion-cell purchasing
 * and live ship statistics (mass, centre of mass, thrust-to-mass, energy balance, crew slots).
 */
import { el, clear, fmt } from '../dom.ts';
import { CATEGORY_LABEL, getModule } from '../../data/modules.ts';
import { cellPrice, cellsToNextCrewSlot, crewSlotProgress, crewSlots } from '../../sim/economy.ts';
import { ORIENTATION_NAME, type Orientation } from '../../sim/shipgrid.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

export function buildBuilderPanel(ctx: UIContext): HTMLElement {
  const { state, hangar } = ctx;
  hangar.setMode('build');

  const paletteWrap = el('div', {
    style: {
      position: 'absolute', left: '14px', top: '14px', width: '268px', maxHeight: 'calc(100% - 28px)',
      overflow: 'auto', background: 'rgba(8,13,30,0.92)', border: '1px solid rgba(0,229,255,0.22)',
      borderRadius: '14px', padding: '12px', pointerEvents: 'auto', backdropFilter: 'blur(10px)',
    },
  });
  const statsWrap = el('div', {
    style: {
      position: 'absolute', right: '14px', top: '14px', width: '280px',
      background: 'rgba(8,13,30,0.92)', border: '1px solid rgba(0,229,255,0.22)', borderRadius: '14px',
      padding: '12px', pointerEvents: 'auto', backdropFilter: 'blur(10px)',
    },
  });
  const hintWrap = el('div', {
    style: {
      position: 'absolute', left: '50%', bottom: '18px', transform: 'translateX(-50%)',
      background: 'rgba(8,13,30,0.92)', border: '1px solid rgba(0,229,255,0.22)', borderRadius: '12px',
      padding: '10px 16px', pointerEvents: 'auto', display: 'flex', gap: '12px', alignItems: 'center',
    },
  });

  const renderPalette = () => {
    clear(paletteWrap);
    paletteWrap.appendChild(el('h2', { style: { fontFamily: 'Orbitron', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '10px' } }, ['MODULE INVENTORY']));

    const entries = Object.entries(state.inventory).filter(([, c]) => c > 0);
    if (!entries.length) {
      paletteWrap.appendChild(el('div', { class: 'mini', style: { lineHeight: '1.5' } }, [
        'Inventory empty. Buy modules in the Equipment Shop, then place them here.',
      ]));
    }
    for (const [defId, count] of entries) {
      const def = getModule(defId);
      const selected = hangar.selectedModule === defId;
      paletteWrap.appendChild(el('button', {
        class: 'navbtn',
        style: {
          marginBottom: '6px',
          borderColor: selected ? 'rgba(0,229,255,0.7)' : 'rgba(255,255,255,0.07)',
          background: selected ? 'rgba(0,229,255,0.16)' : 'rgba(255,255,255,0.04)',
        },
        onclick: () => {
          audio.uiClick();
          hangar.selectModule(selected ? null : defId);
          renderPalette();
        },
      }, [
        el('div', { class: 'navico', style: { background: `#${def.accent.toString(16).padStart(6, '0')}22` } }, [String(count)]),
        el('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' } }, [
          el('span', { style: { fontSize: '11px' } }, [def.name]),
          el('span', { class: 'mini' }, [`${CATEGORY_LABEL[def.category]} · ${def.size.join('x')} · ${def.mass}t`]),
        ]),
      ]));
    }

    paletteWrap.appendChild(el('div', { style: { height: '10px' } }));
    paletteWrap.appendChild(el('h2', { style: { fontFamily: 'Orbitron', fontSize: '12px', letterSpacing: '0.1em', margin: '8px 0' } }, ['EXPANSION CELLS']));
    const price = cellPrice(state.ship.purchasedCount);
    paletteWrap.appendChild(el('div', { class: 'mini', style: { lineHeight: '1.5', marginBottom: '8px' } }, [
      `Next cell: ${fmt(price)} CR. Purchased: ${state.ship.purchasedCount}. `,
      `Every 10 cells unlock 1 crew slot (${cellsToNextCrewSlot(state.ship.purchasedCount)} to go).`,
    ]));
    paletteWrap.appendChild(el('button', {
      class: hangar.cellPurchaseMode ? 'btn' : 'btn ghost',
      style: { width: '100%' },
      onclick: () => {
        audio.uiClick();
        hangar.setCellPurchaseMode(!hangar.cellPurchaseMode);
        renderPalette();
      },
    }, [hangar.cellPurchaseMode ? 'EXIT CELL PURCHASE' : 'BUY EXPANSION CELLS']));
  };

  const renderStats = () => {
    clear(statsWrap);
    const design = state.ship;
    const s = design.stats();
    const slots = crewSlots(design.purchasedCount);
    const progress = crewSlotProgress(design.purchasedCount);
    const row = (label: string, value: string, color = '#e6eaff') =>
      el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' } }, [
        el('span', { style: { opacity: '0.7' } }, [label]),
        el('b', { style: { fontFamily: 'JetBrains Mono', color } }, [value]),
      ]);

    statsWrap.append(
      el('h2', { style: { fontFamily: 'Orbitron', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '10px' } }, ['SHIP ANALYSIS']),
      row('Modules', String(s.moduleCount)),
      row('Total mass', `${fmt(s.mass)} t`),
      row('Centre of mass', s.centerOfMass.map((v) => v.toFixed(2)).join(' / ')),
      row('Thrust', `${fmt(s.thrust)} kN`),
      row('Thrust / mass', s.thrustToMass.toFixed(2), s.thrustToMass > 0.35 ? '#00ff9d' : '#ffb700'),
      row('Torque', s.torque.toFixed(2)),
      row('Energy', `${fmt(s.energyGen)} / ${fmt(s.energyDraw)}`, s.energyBalance >= 0 ? '#00ff9d' : '#ff3b6b'),
      row('Hull integrity', fmt(s.hull)),
      row('Shields', fmt(s.shield)),
      row('Cargo', fmt(s.cargo)),
      row('Mining DPS', fmt(s.miningDps)),
      row('Weapon DPS', fmt(s.weaponDps)),
      row('Magnet range', `${fmt(s.magnetRange)} m`),
      el('div', { style: { height: '10px' } }),
      el('div', { class: 'mini' }, [`Crew slots: ${slots} (${Math.round(progress * 100)}% to next)`]),
      el('div', { class: 'progress', style: { marginTop: '6px' } }, [
        el('i', { style: { width: `${progress * 100}%` } }),
      ]),
      el('div', { style: { height: '10px' } }),
      el('div', { class: 'mini', style: { lineHeight: '1.5' } }, [
        s.energyBalance < 0
          ? 'WARNING: energy deficit - install an Energy Generator or remove draw.'
          : 'Energy balance nominal.',
      ]),
    );
  };

  const renderHint = () => {
    clear(hintWrap);
    const orientationLabel = ORIENTATION_NAME[hangar.selectedOrientation as Orientation];
    hintWrap.append(
      el('span', { class: 'mini' }, [
        hangar.cellPurchaseMode
          ? 'Click a golden cell to purchase it.'
          : hangar.selectedModule
            ? `Placing ${getModule(hangar.selectedModule).name} · facing ${orientationLabel}`
            : 'Select a module from the inventory, or click an installed module to remove it.',
      ]),
      el('button', {
        class: 'btn ghost small',
        onclick: () => { hangar.rotateSelection(1); renderHint(); },
      }, ['ROTATE (R)']),
      el('button', {
        class: 'btn ghost small',
        onclick: () => { hangar.selectModule(null); hangar.setCellPurchaseMode(false); renderPalette(); renderHint(); },
      }, ['CLEAR SELECTION']),
      el('button', {
        class: 'btn',
        onclick: () => { audio.uiClick(); ctx.shell.navigate('sectors'); },
      }, ['LAUNCH EXPEDITION']),
    );
  };

  const keyHandler = (e: KeyboardEvent) => {
    if (e.code === 'KeyR') { hangar.rotateSelection(e.shiftKey ? -1 : 1); renderHint(); }
    if (e.code === 'Escape') { hangar.selectModule(null); hangar.setCellPurchaseMode(false); renderPalette(); renderHint(); }
  };
  window.addEventListener('keydown', keyHandler);

  hangar.onShipChanged = () => {
    renderPalette();
    renderStats();
    ctx.refresh();
  };

  renderPalette();
  renderStats();
  renderHint();

  const root = el('div', { style: { position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' } }, [
    paletteWrap, statsWrap, hintWrap,
  ]);
  (root as any).dispose = () => {
    window.removeEventListener('keydown', keyHandler);
    hangar.onShipChanged = null;
  };
  return root;
}
