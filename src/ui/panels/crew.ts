/**
 * Crew collection: every card rendered with its procedural illustration, searchable,
 * sortable and filterable, with equip / unequip respecting unlocked crew slots.
 */
import { el, clear, fmt } from '../dom.ts';
import { CREW_CARDS, RARITY_LABEL, RARITY_ORDER, formatBonus, type CrewCard, type Rarity } from '../../data/crew.ts';
import { renderCardFace } from '../../render/cardart.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

const artCache = new Map<string, string>();

/** Renders (and caches) a card face as a data URL so re-opening the panel is instant. */
export function cardImage(card: CrewCard, width = 300): HTMLCanvasElement | HTMLImageElement {
  const cached = artCache.get(`${card.id}:${width}`);
  if (cached) {
    const img = new Image();
    img.src = cached;
    img.style.width = '100%';
    img.style.display = 'block';
    return img;
  }
  const canvas = document.createElement('canvas');
  renderCardFace(canvas, card, width, Math.round(width * 1.4));
  canvas.style.width = '100%';
  canvas.style.display = 'block';
  try {
    artCache.set(`${card.id}:${width}`, canvas.toDataURL('image/png'));
  } catch {
    /* tainted canvas is impossible here, but never break the UI over caching */
  }
  return canvas;
}

export function cardTile(ctx: UIContext, card: CrewCard, owned: boolean, equipped: boolean, onToggle: () => void): HTMLElement {
  const tile = el('div', {
    class: 'card3d',
    style: {
      width: '100%', height: 'auto', borderColor: equipped ? 'rgba(0,255,157,0.8)' : 'rgba(255,255,255,0.12)',
      filter: owned ? 'none' : 'grayscale(1) brightness(0.45)',
      cursor: owned ? 'pointer' : 'default',
      position: 'relative',
    },
    onclick: () => { if (owned) { audio.uiClick(); onToggle(); } },
    onmouseenter: () => owned && audio.uiHover(),
  }, [
    cardImage(card, 300),
    equipped ? el('div', {
      style: {
        position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', borderRadius: '999px',
        background: 'rgba(0,255,157,0.85)', color: '#00231a', fontSize: '9px', fontWeight: '700',
        fontFamily: 'Orbitron', letterSpacing: '0.1em',
      },
    }, ['ACTIVE']) : null,
    !owned ? el('div', {
      style: {
        position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
        background: 'rgba(2,5,15,0.55)', fontFamily: 'Orbitron', fontSize: '10px', letterSpacing: '0.14em',
      },
    }, ['LOCKED']) : null,
  ]);
  return tile;
}

export function buildCrewPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  let search = '';
  let rarityFilter: Rarity | 'all' = 'all';
  let sort: 'number' | 'rarity' | 'name' = 'number';
  let ownedOnly = false;

  const grid = el('div', { class: 'cardGrid' });
  const header = el('div', { class: 'panelHead' });

  const render = () => {
    clear(header);
    const slots = state.crewSlots;
    header.append(
      el('h2', {}, ['CREW COLLECTION']),
      el('span', { class: 'mini' }, [
        `${state.crew.size}/${CREW_CARDS.length} cards collected · ${state.equippedCrew.length}/${slots} crew slots in use`,
      ]),
      el('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' } }, [
        el('input', {
          placeholder: 'Search name or role…',
          value: search,
          style: {
            padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.05)', color: '#e6eaff', fontSize: '12px', width: '180px',
          },
          oninput: (e: Event) => { search = (e.target as HTMLInputElement).value.toLowerCase(); renderGrid(); },
        }),
        el('select', {
          style: { padding: '8px', borderRadius: '10px', background: '#0c1430', color: '#e6eaff', border: '1px solid rgba(255,255,255,0.14)', fontSize: '11px' },
          onchange: (e: Event) => { rarityFilter = (e.target as HTMLSelectElement).value as any; renderGrid(); },
        }, [
          el('option', { value: 'all' }, ['ALL RARITIES']),
          ...RARITY_ORDER.map((r) => el('option', { value: r }, [RARITY_LABEL[r]])),
        ]),
        el('select', {
          style: { padding: '8px', borderRadius: '10px', background: '#0c1430', color: '#e6eaff', border: '1px solid rgba(255,255,255,0.14)', fontSize: '11px' },
          onchange: (e: Event) => { sort = (e.target as HTMLSelectElement).value as any; renderGrid(); },
        }, [
          el('option', { value: 'number' }, ['SORT: NUMBER']),
          el('option', { value: 'rarity' }, ['SORT: RARITY']),
          el('option', { value: 'name' }, ['SORT: NAME']),
        ]),
        el('button', {
          class: 'btn ghost small',
          onclick: (e: Event) => {
            ownedOnly = !ownedOnly;
            (e.currentTarget as HTMLElement).textContent = ownedOnly ? 'OWNED ONLY' : 'SHOW ALL';
            renderGrid();
          },
        }, ['SHOW ALL']),
      ]),
    );
  };

  const renderGrid = () => {
    clear(grid);
    const slots = state.crewSlots;

    // Equipped roster strip.
    const roster = el('div', {
      style: {
        gridColumn: '1 / -1', display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
      },
    }, [
      el('div', { style: { width: '100%', fontFamily: 'Orbitron', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '4px' } }, [
        `ACTIVE CREW  ·  ${state.equippedCrew.length}/${slots} SLOTS`,
      ]),
    ]);
    if (slots === 0) {
      roster.appendChild(el('div', { class: 'mini' }, [
        'No crew slots unlocked yet. Purchase 10 ship expansion cells in the Ship Builder to unlock your first slot.',
      ]));
    }
    for (let i = 0; i < slots; i++) {
      const id = state.equippedCrew[i];
      const card = id ? CREW_CARDS.find((c) => c.id === id) : undefined;
      roster.appendChild(el('div', {
        style: {
          width: '150px', padding: '10px', borderRadius: '12px',
          border: `1px solid ${card ? 'rgba(0,255,157,0.45)' : 'rgba(255,255,255,0.12)'}`,
          background: card ? 'rgba(0,255,157,0.08)' : 'rgba(255,255,255,0.03)',
        },
      }, card ? [
        el('div', { style: { fontSize: '11px', fontWeight: '700' } }, [card.name]),
        el('div', { class: 'mini' }, [card.role]),
        el('div', { class: 'mini', style: { color: '#00ff9d' } }, [formatBonus(card.bonus.key, card.bonus.value)]),
        card.bonus2 ? el('div', { class: 'mini', style: { color: '#00ff9d' } }, [formatBonus(card.bonus2.key, card.bonus2.value)]) : null,
        el('button', {
          class: 'btn ghost small', style: { marginTop: '6px' },
          onclick: () => { state.unequipCrew(card.id); audio.uiBack(); ctx.save(); ctx.refresh(); render(); renderGrid(); },
        }, ['UNEQUIP']),
      ] : [
        el('div', { class: 'mini', style: { opacity: '0.6' } }, [`SLOT ${i + 1}`]),
        el('div', { class: 'mini' }, ['Empty']),
      ]));
    }
    grid.appendChild(roster);

    // Aggregate bonus summary.
    const bonuses = state.bonuses();
    const bonusEntries = Object.entries(bonuses);
    if (bonusEntries.length) {
      grid.appendChild(el('div', {
        style: {
          gridColumn: '1 / -1', padding: '10px 12px', borderRadius: '12px',
          background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.2)',
          display: 'flex', gap: '12px', flexWrap: 'wrap',
        },
      }, [
        el('b', { style: { fontFamily: 'Orbitron', fontSize: '10px', letterSpacing: '0.1em' } }, ['TOTAL ACTIVE BONUSES']),
        ...bonusEntries.map(([key, value]) =>
          el('span', { class: 'mini', style: { color: '#9ff' } }, [formatBonus(key as any, value as number)])),
      ]));
    }

    let list = [...CREW_CARDS];
    if (rarityFilter !== 'all') list = list.filter((c) => c.rarity === rarityFilter);
    if (ownedOnly) list = list.filter((c) => state.crew.has(c.id));
    if (search) list = list.filter((c) => `${c.name} ${c.role} ${c.description}`.toLowerCase().includes(search));
    list.sort((a, b) => {
      if (sort === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.number - b.number;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return a.number - b.number;
    });

    for (const card of list) {
      const owned = state.crew.has(card.id);
      const equipped = state.equippedCrew.includes(card.id);
      grid.appendChild(cardTile(ctx, card, owned, equipped, () => {
        if (equipped) {
          state.unequipCrew(card.id);
        } else if (state.equippedCrew.length >= state.crewSlots) {
          audio.error();
          ctx.notify(`All ${state.crewSlots} crew slots are full. Unequip someone or expand the ship.`, 'error');
          return;
        } else {
          state.equipCrew(card.id);
        }
        ctx.save();
        ctx.refresh();
        render();
        renderGrid();
      }));
    }

    if (!list.length) grid.appendChild(el('div', { class: 'mini' }, ['No cards match the current filter.']));
  };

  render();
  renderGrid();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    header,
    el('div', { class: 'mini', style: { padding: '0 16px 8px' } }, [
      `Collection value: ${fmt(state.crew.size * 100)} prestige · duplicates convert to crystals automatically.`,
    ]),
    grid,
  ]);
}
