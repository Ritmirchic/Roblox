/**
 * Active upgrades: 3 default slots, a purchasable 4th, and a 5th unlocked by a rare
 * 1% card drop at the end of an expedition. Maximum 5 - duplicates are impossible.
 */
import { el, clear, fmt } from '../dom.ts';
import { ACTIVE_UPGRADES, FIFTH_SLOT_DROP_CHANCE, FOURTH_SLOT_PRICE, MAX_UPGRADE_SLOTS } from '../../sim/upgrades.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

export function buildUpgradesPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const body = el('div', { style: { overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' } });

  const render = () => {
    clear(body);
    const slots = state.upgradeSlots;

    const slotRow = el('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } });
    for (let i = 0; i < MAX_UPGRADE_SLOTS; i++) {
      const unlocked = i < slots;
      const id = state.activeUpgrades[i];
      const def = id ? ACTIVE_UPGRADES.find((u) => u.id === id) : null;
      slotRow.appendChild(el('div', {
        style: {
          width: '190px', minHeight: '128px', borderRadius: '14px', padding: '12px',
          border: `1px solid ${unlocked ? (def ? 'rgba(0,255,157,0.45)' : 'rgba(0,229,255,0.3)') : 'rgba(255,255,255,0.08)'}`,
          background: unlocked ? (def ? 'rgba(0,255,157,0.07)' : 'rgba(0,229,255,0.05)') : 'rgba(255,255,255,0.02)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        },
      }, unlocked ? [
        el('div', { class: 'mini' }, [`SLOT ${i + 1}`]),
        def ? el('b', { style: { fontSize: '12px' } }, [def.name]) : el('b', { style: { fontSize: '12px', opacity: '0.6' } }, ['Empty']),
        def ? el('div', { class: 'mini' }, [def.description]) : el('div', { class: 'mini' }, ['Fit an upgrade from the list below.']),
        def ? el('button', {
          class: 'btn ghost small', style: { marginTop: 'auto' },
          onclick: () => { state.setActiveUpgrade(i, null); audio.uiBack(); ctx.save(); ctx.refresh(); render(); },
        }, ['REMOVE']) : null,
      ] : [
        el('div', { class: 'mini' }, [`SLOT ${i + 1}`]),
        el('b', { style: { fontSize: '12px', opacity: '0.6' } }, ['LOCKED']),
        el('div', { class: 'mini' }, [
          i === 3 ? `Permanent unlock: ${fmt(FOURTH_SLOT_PRICE)} CR` : `Rare reward · ${(FIFTH_SLOT_DROP_CHANCE * 100).toFixed(0)}% chance per completed expedition`,
        ]),
        i === 3 ? el('button', {
          class: 'btn small', style: { marginTop: 'auto' },
          onclick: () => {
            if (state.fourthSlotPurchased) return;
            if (!state.spendCredits(FOURTH_SLOT_PRICE)) {
              audio.error();
              ctx.notify('Not enough credits for the fourth upgrade slot.', 'error');
              return;
            }
            state.fourthSlotPurchased = true;
            audio.purchase();
            ctx.notify('Fourth active upgrade slot unlocked permanently.', 'success');
            ctx.save(); ctx.refresh(); render();
          },
        }, ['PURCHASE']) : null,
      ]));
    }

    body.append(
      el('div', { class: 'mini' }, [
        `Active upgrade slots: ${slots}/${MAX_UPGRADE_SLOTS}. Upgrades apply to every expedition until removed.`,
      ]),
      slotRow,
      el('h2', { style: { fontFamily: 'Orbitron', fontSize: '12px', letterSpacing: '0.1em', marginTop: '8px' } }, ['UPGRADE CATALOGUE']),
    );

    const grid = el('div', { class: 'shopGrid', style: { padding: '0' } });
    for (const up of ACTIVE_UPGRADES) {
      const owned = !!state.ownedUpgrades[up.id];
      const equippedIndex = state.activeUpgrades.indexOf(up.id);
      grid.appendChild(el('div', { class: 'kpiCard', style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('b', { style: { fontSize: '12px', fontFamily: 'Orbitron' } }, [up.name]),
          el('span', { class: 'badge' }, [`TIER ${up.tier}`]),
        ]),
        el('div', { class: 'mini', style: { minHeight: '34px' } }, [up.description]),
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' } }, [
          el('b', { style: { color: owned ? '#00ff9d' : '#ffb700', fontFamily: 'JetBrains Mono' } }, [owned ? 'OWNED' : `${fmt(up.price)} CR`]),
          el('button', {
            class: 'btn small', style: { marginLeft: 'auto' },
            onclick: () => {
              if (!owned) {
                if (!state.spendCredits(up.price)) {
                  audio.error();
                  ctx.notify('Not enough credits.', 'error');
                  return;
                }
                state.ownedUpgrades[up.id] = 1;
                audio.purchase();
                ctx.notify(`${up.name} purchased.`, 'success');
              } else if (equippedIndex >= 0) {
                state.setActiveUpgrade(equippedIndex, null);
                audio.uiBack();
              } else {
                const free = state.activeUpgrades.findIndex((v, i) => i < state.upgradeSlots && !v);
                if (free < 0) {
                  audio.error();
                  ctx.notify('All active upgrade slots are full.', 'error');
                  return;
                }
                state.setActiveUpgrade(free, up.id);
                audio.uiClick();
              }
              ctx.save(); ctx.refresh(); render();
            },
          }, [owned ? (equippedIndex >= 0 ? 'UNEQUIP' : 'EQUIP') : 'BUY']),
        ]),
      ]));
    }
    body.appendChild(grid);
  };

  render();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [
      el('h2', {}, ['ACTIVE UPGRADES']),
      el('span', { class: 'mini' }, ['Run modifiers kept separate from the physical ship modules.']),
    ]),
    body,
  ]);
}
