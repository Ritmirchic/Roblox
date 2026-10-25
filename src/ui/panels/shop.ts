/**
 * Equipment shop: browse the module catalogue by category, inspect full statistics,
 * buy modules into inventory and upgrade modules already installed on the ship.
 */
import { el, clear, fmt } from '../dom.ts';
import { CATEGORY_LABEL, MODULES, getModule, scaledStat, upgradeCost, type ModuleCategory, type ModuleDef } from '../../data/modules.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

const CATEGORIES: (ModuleCategory | 'all' | 'installed')[] = [
  'all', 'structure', 'propulsion', 'mining', 'collection', 'weapon', 'defense', 'utility', 'command', 'installed',
];

function statLines(def: ModuleDef, level = 1): string[] {
  const out: string[] = [];
  const s = def.stats;
  const add = (label: string, value: number | undefined, unit = '', scale = true) => {
    if (!value) return;
    const v = scale ? scaledStat(value, level) : value;
    out.push(`${label}: ${v % 1 === 0 ? v : v.toFixed(1)}${unit}`);
  };
  add('Mining DPS', s.miningDps);
  add('Mining range', s.miningRange, 'm', false);
  add('Magnet range', s.magnetRange, 'm');
  add('Magnet force', s.magnetForce);
  add('Damage', s.damage);
  if (s.fireRate) out.push(`Fire rate: ${s.fireRate}/s`);
  add('Weapon range', s.weaponRange, 'm', false);
  add('Splash', s.splash, 'm', false);
  add('Thrust', s.thrust, ' kN');
  add('Torque', s.torque);
  add('Shield', s.shield);
  add('Shield regen', s.shieldRegen, '/s');
  add('Armor', s.armor);
  add('Repair', s.repair, '/s');
  add('Cargo', s.cargo);
  add('Energy gen', s.energyGen, '/s');
  add('Energy buffer', s.energyCap);
  add('Scan range', s.scanRange, 'm', false);
  add('Radar range', s.radarRange, 'm', false);
  if (s.rareBonus) out.push(`Rare chance: +${Math.round(s.rareBonus * 100)}%`);
  if (s.drones) out.push(`Drones: ${s.drones}`);
  return out;
}

export function moduleCard(ctx: UIContext, def: ModuleDef, onBuy: () => void): HTMLElement {
  const owned = ctx.state.inventory[def.id] ?? 0;
  const installed = ctx.state.ship.modules.filter((m) => m.defId === def.id).length;
  const affordable = ctx.state.credits >= def.price;
  return el('div', {
    class: 'kpiCard',
    style: { display: 'flex', flexDirection: 'column', gap: '8px', borderColor: affordable ? 'rgba(0,229,255,0.22)' : 'rgba(255,255,255,0.06)' },
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } }, [
      el('b', { style: { fontSize: '12px', letterSpacing: '0.04em', color: '#fff', fontFamily: 'Orbitron' } }, [def.name]),
      el('span', { class: 'badge' }, [CATEGORY_LABEL[def.category]]),
    ]),
    el('div', { class: 'mini', style: { lineHeight: '1.45', minHeight: '34px' } }, [def.description]),
    el('div', { class: 'mini', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' } },
      statLines(def).map((line) => el('div', {}, [line]))),
    el('div', { class: 'mini', style: { display: 'flex', gap: '10px', flexWrap: 'wrap', opacity: '0.75' } }, [
      el('span', {}, [`Mass ${def.mass}t`]),
      el('span', {}, [`HP ${def.durability}`]),
      el('span', {}, [`Energy ${def.energy}/s`]),
      el('span', {}, [`Size ${def.size.join('x')}`]),
    ]),
    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' } }, [
      el('b', { style: { color: affordable ? '#ffb700' : '#ff6b8a', fontFamily: 'JetBrains Mono' } }, [`${fmt(def.price)} CR`]),
      el('span', { class: 'mini' }, [`stock ${owned} · installed ${installed}`]),
      el('button', {
        class: affordable ? 'btn small' : 'btn ghost small',
        style: { marginLeft: 'auto' },
        onclick: onBuy,
        onmouseenter: () => audio.uiHover(),
      }, ['BUY']),
    ]),
  ]);
}

export function buildShopPanel(ctx: UIContext): HTMLElement {
  let activeCategory: (ModuleCategory | 'all' | 'installed') = 'all';
  const grid = el('div', { class: 'shopGrid' });

  const render = () => {
    clear(grid);
    if (activeCategory === 'installed') {
      const mods = ctx.state.ship.modules;
      if (!mods.length) {
        grid.appendChild(el('div', { class: 'mini' }, ['No modules installed yet.']));
        return;
      }
      for (const mod of mods) {
        const def = getModule(mod.defId);
        const maxed = mod.level >= def.maxLevel;
        const cost = upgradeCost(def, mod.level);
        const hp = Math.round(mod.health);
        const maxHp = Math.round(ctx.state.ship.maxHealth(mod));
        grid.appendChild(el('div', { class: 'kpiCard', style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
            el('b', { style: { fontFamily: 'Orbitron', fontSize: '12px' } }, [def.name]),
            el('span', { class: 'badge' }, [`LV ${mod.level}/${def.maxLevel}`]),
          ]),
          el('div', { class: 'mini' }, [`Cell ${mod.pos.join(',')} · ${CATEGORY_LABEL[def.category]}`]),
          el('div', { class: 'mini' }, [`Integrity ${hp}/${maxHp} (${Math.round((hp / maxHp) * 100)}%)`]),
          el('div', { class: 'mini', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' } },
            statLines(def, mod.level).map((line) => el('div', {}, [line]))),
          el('div', { style: { display: 'flex', gap: '8px', marginTop: 'auto', alignItems: 'center' } }, [
            el('b', { style: { color: '#ffb700', fontFamily: 'JetBrains Mono' } }, [maxed ? 'MAX LEVEL' : `${fmt(cost)} CR`]),
            el('button', {
              class: maxed ? 'btn ghost small' : 'btn small',
              style: { marginLeft: 'auto' },
              onclick: () => {
                if (maxed) return;
                if (ctx.state.upgradeModule(mod.uid)) {
                  audio.purchase();
                  ctx.notify(`${def.name} upgraded to level ${mod.level}.`, 'success');
                  ctx.hangar.rebuildShip();
                  ctx.save();
                  ctx.refresh();
                  render();
                } else {
                  audio.error();
                  ctx.notify('Not enough credits for this upgrade.', 'error');
                }
              },
            }, [maxed ? 'MAXED' : 'UPGRADE']),
          ]),
        ]));
      }
      return;
    }
    const list = MODULES.filter((m) => (activeCategory === 'all' ? true : m.category === activeCategory))
      .filter((m) => m.price > 0 || m.category === 'command')
      .sort((a, b) => a.tier - b.tier || a.price - b.price);
    for (const def of list) {
      grid.appendChild(moduleCard(ctx, def, () => {
        if (ctx.state.buyModule(def.id)) {
          audio.purchase();
          ctx.notify(`${def.name} purchased - install it in the Ship Builder.`, 'success');
          ctx.save();
          ctx.refresh();
          render();
        } else {
          audio.error();
          ctx.notify('Not enough credits.', 'error');
        }
      }));
    }
  };

  const tabs = el('div', { class: 'builderBar' },
    CATEGORIES.map((cat) => el('button', {
      class: 'btn ghost small',
      onclick: (e: Event) => {
        activeCategory = cat;
        for (const b of Array.from(tabs.children)) (b as HTMLElement).classList.add('ghost');
        (e.currentTarget as HTMLElement).classList.remove('ghost');
        audio.uiClick();
        render();
      },
    }, [cat === 'all' ? 'ALL' : cat === 'installed' ? 'INSTALLED' : CATEGORY_LABEL[cat as ModuleCategory].toUpperCase()])));
  (tabs.firstChild as HTMLElement).classList.remove('ghost');

  render();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [
      el('h2', {}, ['EQUIPMENT SHOP']),
      el('span', { class: 'mini' }, ['Purchased modules go to your inventory - install them in the Ship Builder.']),
    ]),
    tabs,
    grid,
  ]);
}
