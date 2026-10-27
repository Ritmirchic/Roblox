/**
 * Full-screen interface: main menu, pause, inventory, skills, journal,
 * crafting, base building, map, settings and dialogue.
 * Keyboard driven, mouse supported, no external assets.
 */
import { uiIcon, itemIcon } from './icons.js';
import { ITEMS, ITEM_TYPES, RARITY } from '../data/items.js';
import { GRID_W, GRID_H, itemSize } from '../systems/inventory.js';
import { clamp, clamp01 } from '../engine/util.js';
import { ATTRIBUTES } from '../systems/progression.js';

const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const MAIN_TABS = [
  { id: 'inventory', label: 'INVENTORY', icon: 'bagGrid', key: 'TAB' },
  { id: 'skills', label: 'SKILLS', icon: 'skill', key: 'K' },
  { id: 'journal', label: 'JOURNAL', icon: 'quest', key: 'J' },
  { id: 'crafting', label: 'CRAFTING', icon: 'craft', key: 'B' },
  { id: 'build', label: 'BASE BUILDING', icon: 'build', key: 'V' },
  { id: 'map', label: 'SECTOR MAP', icon: 'map', key: 'M' },
  { id: 'settings', label: 'SETTINGS', icon: 'settings', key: 'O' },
];

export class UIManager {
  constructor(game) {
    this.game = game;
    this.root = game.uiRoot;
    this.blocking = false;
    this.openPane = null;
    this.tab = 'inventory';
    this.selectedItem = null;
    this.selectedRecipe = null;
    this.selectedBuild = null;
    this.dialogueOpen = false;
    this.settingsDirty = false;
    this.build();
  }

  // --------------------------------------------------------------- structure
  build() {
    // main menu
    this.mainMenu = el('div', 'main-menu');
    this.mainMenu.innerHTML = `
      <div class="backdrop"></div>
      <div class="menu-inner">
        <div class="menu-brand">
          <div class="mb-kicker">A SURVIVAL RECORD</div>
          <div class="mb-title">ASHES<b>OF HUMANITY</b></div>
          <div class="mb-sub">THREE WEEKS AFTER THE LAST TRANSMISSION. THE SIGNAL IS STILL BROADCASTING. SOMEONE HAS TO ANSWER IT.</div>
        </div>
        <div class="menu-list" id="menu-list"></div>
        <div class="menu-foot">
          <b>VERSION 1.0.0</b> - PROCEDURAL SURVIVAL RPG<br>
          MOUSE + KEYBOARD - HEADPHONES RECOMMENDED
        </div>
      </div>
      <div class="menu-side">
        <div class="ms-item"><b>WORLD</b> 3000 x 3000 M - 6 REGIONS</div>
        <div class="ms-line"></div>
        <div class="ms-item"><b>SURVIVORS</b> LAST SHELTER: KETTLE CAMP</div>
        <div class="ms-item"><b>HOSTILES</b> 10 SPECIES / 6 APEX</div>
        <div class="ms-line"></div>
        <div class="ms-item"><b>CONTROLS</b> WASD MOVE - SHIFT SPRINT - C CROUCH</div>
        <div class="ms-item"><b>FIRE</b> LMB / RMB AIM - R RELOAD - 1..4 WEAPONS</div>
        <div class="ms-item"><b>INTERACT</b> E - F FLASHLIGHT - TAB MENU</div>
      </div>`;
    this.root.appendChild(this.mainMenu);
    this.elMenuList = this.mainMenu.querySelector('#menu-list');

    // generic sheet
    this.screen = el('div', 'screen');
    this.screen.innerHTML = `
      <div class="sheet">
        <div class="sheet-head">
          <span class="sh-title" id="sh-title">INVENTORY</span>
          <span class="sh-sub" id="sh-sub"></span>
          <span class="sh-spacer"></span>
          <div class="sheet-close" id="sh-close">${uiIcon('close', 16)}</div>
        </div>
        <div class="sheet-body">
          <div class="tabs" id="sh-tabs"></div>
          <div class="tab-body" id="sh-body"></div>
        </div>
        <div class="sheet-foot" id="sh-foot">
          <span>TAB CLOSE</span><span>MOUSE SELECT</span><span>R ROTATE ITEM</span><span>F EQUIP</span>
        </div>
      </div>`;
    this.root.appendChild(this.screen);
    this.screen.querySelector('#sh-close').addEventListener('click', () => this.close());
    this.elTabs = this.screen.querySelector('#sh-tabs');
    this.elBody = this.screen.querySelector('#sh-body');
    this.elTitle = this.screen.querySelector('#sh-title');
    this.elSub = this.screen.querySelector('#sh-sub');
    this.elFoot = this.screen.querySelector('#sh-foot');

    // dialogue
    this.dlg = el('div', 'dialogue');
    this.dlg.innerHTML = `
      <div class="dlg-box">
        <div class="dlg-head">
          <div class="dlg-portrait" id="dlg-portrait"></div>
          <div><div class="dlg-name" id="dlg-name"></div><div class="dlg-role" id="dlg-role"></div></div>
          <span class="sh-spacer" style="flex:1"></span>
          <div class="sh-sub" id="dlg-topic"></div>
        </div>
        <div class="dlg-text" id="dlg-text"></div>
        <div class="dlg-choices" id="dlg-choices"></div>
      </div>`;
    this.root.appendChild(this.dlg);
    this.elDlgName = this.dlg.querySelector('#dlg-name');
    this.elDlgRole = this.dlg.querySelector('#dlg-role');
    this.elDlgText = this.dlg.querySelector('#dlg-text');
    this.elDlgChoices = this.dlg.querySelector('#dlg-choices');
    this.elDlgPortrait = this.dlg.querySelector('#dlg-portrait');
    this.elDlgTopic = this.dlg.querySelector('#dlg-topic');
    this.dlgChoiceIndex = 0;

    for (const t of MAIN_TABS) {
      const b = el('div', 'tab', `${uiIcon(t.icon, 15)}<span>${t.label}</span><span class="kbd">${t.key}</span>`);
      b.dataset.tab = t.id;
      b.addEventListener('click', () => this.setTab(t.id));
      this.elTabs.appendChild(b);
    }
  }

  // -------------------------------------------------------------- main menu
  showMainMenu() {
    const hasSave = this.game.save?.hasSave?.();
    const items = [
      { id: 'continue', label: hasSave ? 'CONTINUE' : 'CONTINUE (NO SAVE)', disabled: !hasSave },
      { id: 'new', label: 'NEW CAMPAIGN' },
      { id: 'settings', label: 'SETTINGS' },
      { id: 'credits', label: 'CREDITS' },
    ];
    document.body.classList.add('menu-mode');
    this.elMenuList.innerHTML = '';
    this.menuItems = items;
    this.menuIndex = hasSave ? 0 : 1;
    for (const it of items) {
      const b = el('div', `menu-item ${it.disabled ? 'disabled' : ''}`, `${uiIcon('chevron', 12)}<span>${it.label}</span>`);
      b.dataset.id = it.id;
      b.addEventListener('click', () => this.menuAction(it.id));
      b.addEventListener('mouseenter', () => {
        this.menuIndex = this.menuItems.indexOf(it);
        this.refreshMenuSelection();
      });
      this.elMenuList.appendChild(b);
    }
    this.refreshMenuSelection();
    this.mainMenu.classList.add('show');
    this.blocking = true;
  }

  refreshMenuSelection() {
    [...this.elMenuList.children].forEach((c, i) => c.classList.toggle('sel', i === this.menuIndex));
  }

  hideMainMenu() {
    this.mainMenu.classList.remove('show');
    document.body.classList.remove('menu-mode');
    if (!this.openPane) this.blocking = false;
  }

  menuAction(id) {
    this.game.audio?.play('uiClick');
    if (id === 'continue') this.game.loadGame?.();
    else if (id === 'new') this.game.newGame?.();
    else if (id === 'settings') this.open('settings');
    else if (id === 'credits') this.open('credits');
  }

  // ---------------------------------------------------------------- overlays
  open(tab = 'inventory') {
    this.openPane = tab;
    this.screen.classList.add('show');
    this.blocking = true;
    this.game.input?.exitLock();
    this.setTab(tab);
  }

  close() {
    if (!this.openPane) return;
    this.openPane = null;
    this.screen.classList.remove('show');
    this.blocking = !!this.mainMenu.classList.contains('show');
    this.game.refreshUiBlock?.();
    this.game.useItemMenu?.(null);
    if (!this.blocking) this.game.input?.requestLock();
  }

  toggle(tab) {
    if (this.openPane) {
      if (this.openPane === tab) this.close();
      else this.setTab(tab);
    } else this.open(tab);
  }

  setTab(tab) {
    this.tab = tab;
    this.openPane = tab;
    this.screen.classList.add('show');
    this.blocking = true;
    const def = MAIN_TABS.find((t) => t.id === tab);
    this.elTitle.textContent = def ? def.label : tab.toUpperCase();
    [...this.elTabs.children].forEach((c) => c.classList.toggle('active', c.dataset.tab === tab));
    this.elBody.scrollTop = 0;
    const render = {
      inventory: () => this.renderInventory(),
      skills: () => this.renderSkills(),
      journal: () => this.renderJournal(),
      crafting: () => this.renderCrafting(),
      build: () => this.renderBuild(),
      map: () => this.renderMap(),
      settings: () => this.renderSettings(),
      credits: () => this.renderCredits(),
    }[tab];
    this.elSub.textContent = '';
    if (render) render();
  }

  // --------------------------------------------------------------- inventory
  renderInventory() {
    const inv = this.game.inventory;
    const p = this.game.player;
    this.elFoot.innerHTML = '<span>TAB CLOSE</span><span>DRAG TO MOVE</span><span>F EQUIP / USE</span><span>R ROTATE</span>';
    this.elSub.textContent = `${(inv.weight ?? 0).toFixed(1)} / ${(this.game.progression?.carryCapacity ?? 40).toFixed(0)} KG`;

    const cell = 52;
    const gap = 2;
    const gw = GRID_W * (cell + gap);
    const gh = GRID_H * (cell + gap);
    const wrap = el('div', 'inv-wrap');
    const left = el('div');
    const box = el('div', 'grid-box');
    box.style.width = `${gw + 26}px`;
    const grid = el('div', 'grid-lines');
    grid.style.width = `${gw}px`;
    grid.style.height = `${gh}px`;
    grid.style.position = 'relative';
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const c = el('div', 'cell');
        c.style.left = `${x * (cell + gap)}px`;
        c.style.top = `${y * (cell + gap)}px`;
        c.style.width = `${cell}px`;
        c.style.height = `${cell}px`;
        grid.appendChild(c);
      }
    }
    for (const item of inv.items) {
      const def = ITEMS[item.id];
      if (!def) continue;
      const chip = el('div', `item-chip rarity-${def.rarity} ${inv.equipped[item.slot] === item.uid ? 'equipped' : ''}`);
      const size = itemSize(def, item.rotated);
      chip.style.left = `${item.x * (cell + gap)}px`;
      chip.style.top = `${item.y * (cell + gap)}px`;
      chip.style.width = `${size.w * (cell + gap) - gap}px`;
      chip.style.height = `${size.h * (cell + gap) - gap}px`;
      chip.title = def.name;
      chip.innerHTML = itemIcon(def.icon, Math.min(size.w, size.h) > 1 ? 34 : 26);
      if (item.qty > 1) chip.appendChild(el('div', 'qty', String(item.qty)));
      if (def.type === 'weapon' && item.durability != null) {
        const d = el('div', 'dur', `<div style="width:${clamp01(item.durability / (def.durability || 100)) * 100}%"></div>`);
        chip.appendChild(d);
      }
      chip.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectedItem = item;
        this.renderInventory();
      });
      chip.addEventListener('dblclick', () => this.useSelectedItem());
      grid.appendChild(chip);
    }
    box.appendChild(grid);
    left.appendChild(box);
    wrap.appendChild(left);

    const right = el('div');
    const slots = [
      ['primary', 'PRIMARY'], ['secondary', 'SECONDARY'], ['sidearm', 'SIDEARM'], ['melee', 'MELEE'],
      ['head', 'HEAD'], ['body', 'BODY'], ['rig', 'RIG'],
    ];
    const side = el('div', 'side-slots');
    for (const [key, label] of slots) {
      const it = inv.equippedItem(key);
      const def = it ? ITEMS[it.id] : null;
      const s = el('div', 'equip-slot');
      s.innerHTML = `<div class="ico">${def ? itemIcon(def.icon, 30) : uiIcon(key === 'head' ? 'mask' : key === 'body' ? 'armor' : 'ammo', 22, '#3d4644')}</div>
        <div><div class="sl">${label}</div><div class="nm">${def ? def.name : '<span style="color:#4a5352">EMPTY</span>'}</div></div>`;
      s.addEventListener('click', () => {
        if (it) {
          this.selectedItem = it;
          this.renderInventory();
        }
      });
      side.appendChild(s);
    }
    right.appendChild(side);

    const det = el('div', 'item-detail');
    const sel = this.selectedItem;
    if (sel && ITEMS[sel.id]) {
      const d = ITEMS[sel.id];
      const stats = [];
      if (d.type === 'weapon') {
        const s = this.game.combat?.statsFor?.(sel) || {};
        stats.push(['DAMAGE', s.damage?.toFixed(0) ?? '-']);
        stats.push(['FIRE RATE', s.rpm ? `${s.rpm}/MIN` : 'MELEE']);
        stats.push(['RANGE', `${s.range?.toFixed(0) ?? '-'} M`]);
        stats.push(['CONDITION', `${Math.round((sel.durability ?? (d.durability || 100)) / (d.durability || 100) * 100)}%`]);
        if (sel.attachments?.length) stats.push(['ATTACHMENTS', sel.attachments.join(', ')]);
      } else if (d.consumable) {
        for (const [k, v] of Object.entries(d.consumable)) stats.push([k.toUpperCase(), `${v > 0 ? '+' : ''}${v}`]);
      }
      if (d.armor) stats.push(['ARMOR', String(d.armor)]);
      stats.push(['WEIGHT', `${(d.weight || 0).toFixed(2)} KG`]);
      stats.push(['VALUE', `${d.value || 0} SCRIP`]);
      det.innerHTML = `<div class="idt">${d.name}</div>
        <div class="ids" style="color:${RARITY[d.rarity]?.color || '#8b9794'}">${RARITY[d.rarity]?.label || ''} - ${ITEM_TYPES[d.type]?.label || d.type}</div>
        <div class="idd">${d.description || ''}</div>
        <div class="idstats">${stats.map(([a, b]) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`).join('')}</div>
        <div class="btn-row">
          <button class="btn" id="inv-use">${d.type === 'weapon' || d.type === 'equipment' ? 'EQUIP' : d.type === 'attachment' ? 'INSTALL' : d.repair ? 'REPAIR' : 'USE'}</button>
          <button class="btn" id="inv-drop">DROP</button>
        </div>`;
      det.querySelector('#inv-use').addEventListener('click', () => this.useSelectedItem());
      det.querySelector('#inv-drop').addEventListener('click', () => this.dropSelectedItem());
    } else {
      det.innerHTML = '<div class="idt" style="color:#4a5352">NO ITEM SELECTED</div><div class="idd">Select an item to inspect it. Weapons and equipment can be equipped to the active loadout.</div>';
    }
    right.appendChild(det);
    wrap.appendChild(right);
    this.elBody.innerHTML = '';
    this.elBody.appendChild(wrap);
  }

  useSelectedItem() {
    const it = this.selectedItem;
    if (!it) return;
    const def = ITEMS[it.id];
    if (!def) return;
    if (def.type === 'attachment') {
      const res = this.game.combat?.installAttachment(it.uid);
      if (res?.ok) this.game.notify(`${res.name} installed`, 'item', 'ATTACHMENT');
      else this.game.notify(res?.reason || 'Cannot install that.', 'warn', 'ATTACHMENT');
      this.renderInventory();
      return;
    }
    if (def.repair) {
      const res = this.game.combat?.repairCurrentWeapon();
      if (res?.ok) {
        this.game.inventory.remove(it.uid, 1);
        this.game.notify('Weapon restored to full condition.', 'item', 'REPAIR');
      } else {
        this.game.notify(res?.reason || 'Nothing to repair.', 'warn', 'REPAIR');
      }
      this.renderInventory();
      return;
    }
    if (def.type === 'weapon' || def.type === 'equipment' || def.type === 'tool') {
      const slot = this.game.inventory.equip(it.uid);
      this.game.audio?.play('equip');
      if (slot) this.game.notify(`${def.name} equipped`, 'item');
      if (slot && (slot === 'primary' || slot === 'secondary' || slot === 'sidearm' || slot === 'melee')) this.game.combat?.equipWeapon(it.uid);
    } else if (def.consumable) {
      const ok = this.game.survival?.consume(it);
      if (ok) {
        this.game.inventory.remove(it.uid, 1);
        this.game.audio?.play('consume');
      }
    }
    this.renderInventory();
  }

  dropSelectedItem() {
    const it = this.selectedItem;
    if (!it) return;
    const p = this.game.player.position;
    this.game.world.spawnPickup(it.id, it.qty, { x: p.x, y: p.y + 0.2, z: p.z }, { durability: it.durability, attachments: it.attachments, magazine: it.magazine });
    this.game.inventory.remove(it.uid, it.qty);
    this.selectedItem = null;
    this.renderInventory();
  }

  // ------------------------------------------------------------------ skills
  renderSkills() {
    const prog = this.game.progression;
    this.elSub.textContent = `LEVEL ${prog.level}  -  ${prog.skillPoints} SKILL POINT${prog.skillPoints === 1 ? '' : 'S'}  -  ${prog.attributePoints} ATTRIBUTE POINT${prog.attributePoints === 1 ? '' : 'S'}`;
    this.elBody.innerHTML = '';
    const xp = el('div', 'panel');
    xp.innerHTML = `<div class="p-title">PROGRESS</div>
      <div class="kv"><span>LEVEL ${prog.level} / 50</span><b>${prog.xp} XP</b></div>
      <div class="kv"><span>NEXT LEVEL</span><b>${prog.xpToNext} XP</b></div>
      <div class="kv"><span>KILLS / QUESTS</span><b>${this.game.stats?.kills ?? 0} / ${this.game.quests?.completed?.size ?? 0}</b></div>`;
    this.elBody.appendChild(xp);

    const attrHead = el('h2', 'sec', 'ATTRIBUTES');
    attrHead.style.marginTop = '22px';
    this.elBody.appendChild(attrHead);
    const grid = el('div', 'attr-grid');
    for (const [key, meta] of Object.entries(ATTRIBUTES)) {
      const value = prog.attributes[key] ?? 1;
      const d = el('div', 'attr');
      d.innerHTML = `<div class="an">${meta.name}</div><div class="av">${value}</div><div class="ad">${meta.desc}</div>
        <button class="btn abtn" ${prog.attrPoints > 0 && value < 10 ? '' : 'disabled'}>RAISE (1 PT)</button>`;
      d.querySelector('button').addEventListener('click', () => {
        const res = prog.raiseAttribute(key);
        if (res.ok) {
          this.game.audio?.play('levelUp');
          this.renderSkills();
        } else {
          this.game.notify(res.reason === 'MAXED' ? 'Attribute is already maxed.' : 'No attribute points.', 'warn');
        }
      });
      grid.appendChild(d);
    }
    this.elBody.appendChild(grid);

    const treeHead = el('h2', 'sec', 'SKILL TREES');
    treeHead.style.marginTop = '26px';
    this.elBody.appendChild(treeHead);
    const trees = el('div', 'trees');
    for (const [treeId, tree] of Object.entries(prog.trees)) {
      const col = el('div', 'tree-col');
      col.innerHTML = `<div class="tc-head" style="color:${tree.color || '#cfd6d3'}">${tree.name}</div><div class="sd" style="margin:6px 0 10px;font-size:10px;color:#5f6a68">${tree.desc || ''}</div>`;
      for (const skill of tree.skills) {
        const rank = prog.rank(skill.id);
        const maxed = rank >= skill.max;
        const reqMet = !skill.requires || prog.rank(skill.requires) >= (skill.reqLevel || 1);
        const locked = !reqMet;
        const canBuy = !maxed && !locked && prog.skillPoints > 0;
        const s = el('div', `skill ${locked ? 'locked' : ''} ${maxed ? 'maxed' : rank > 0 ? 'owned' : ''}`);
        s.innerHTML = `<div class="sn">${skill.name}<span style="margin-left:auto;font:600 8px/1 monospace;color:#5f6a68">${rank}/${skill.max}</span></div>
          <div class="sd">${skill.desc}</div>
          <div class="sr"><span class="pips">${Array.from({ length: skill.max }, (_, i) => `<span class="pip ${i < rank ? 'on' : ''}"></span>`).join('')}</span><span>${locked ? 'LOCKED' : maxed ? 'MAXED' : '1 PT'}</span></div>`;
        if (canBuy) {
          s.style.cursor = 'pointer';
          s.addEventListener('click', () => {
            const res = prog.unlock(skill.id);
            if (res.ok) {
              this.game.audio?.play('levelUp');
              this.renderSkills();
            } else {
              this.game.notify(res.reason || 'Cannot unlock that.', 'warn');
            }
          });
        }
        col.appendChild(s);
      }
      trees.appendChild(col);
    }
    this.elBody.appendChild(trees);
  }

  // ----------------------------------------------------------------- journal
  renderJournal() {
    const qs = this.game.quests;
    this.elSub.textContent = `${qs.completed.size} / ${qs.totalMain + qs.totalSide} CONTRACTS COMPLETE`;
    this.elBody.innerHTML = '';
    const head = el('h2', 'sec', 'ACTIVE CONTRACTS');
    this.elBody.appendChild(head);
    const list = el('div', 'quest-list');
    const active = [...qs.active.values()];
    if (!active.length) list.appendChild(el('div', 'sec-note', 'No active contracts. Explore to find new work.'));
    for (const q of active) {
      const row = el('div', `quest-row ${qs.tracked === q.def.id ? 'active' : ''}`);
      row.innerHTML = `<div class="qt">${q.def.title}<span>${q.def.side ? 'SIDE' : `ACT ${q.def.act + 1}`}</span></div>
        <div class="qd">${q.def.desc}</div>
        <div class="qo">${q.def.objectives.map((o, i) => `<div class="${q.progress[i]?.done ? 'done' : ''}">- ${o.hint}${o.count ? ` (${q.progress[i]?.count || 0}/${o.count})` : ''}</div>`).join('')}</div>`;
      row.addEventListener('click', () => {
        qs.tracked = q.def.id;
        this.renderJournal();
      });
      list.appendChild(row);
    }
    this.elBody.appendChild(list);

    const doneHead = el('h2', 'sec', 'COMPLETED');
    doneHead.style.marginTop = '22px';
    this.elBody.appendChild(doneHead);
    const doneList = el('div', 'quest-list');
    for (const id of qs.completed) {
      const def = qs.def(id);
      if (!def) continue;
      const row = el('div', 'quest-row done');
      row.innerHTML = `<div class="qt">${def.title}<span>${def.side ? 'SIDE' : `ACT ${def.act + 1}`}</span></div>`;
      doneList.appendChild(row);
    }
    if (!qs.completed.size) doneList.appendChild(el('div', 'sec-note', 'Nothing yet.'));
    this.elBody.appendChild(doneList);
  }

  // ---------------------------------------------------------------- crafting
  renderCrafting() {
    const craft = this.game.crafting;
    this.elSub.textContent = `${craft.known.length} RECIPES KNOWN`;
    this.elBody.innerHTML = '';
    const wrap = el('div', 'grid2');
    const left = el('div', 'recipe-list');
    let shown = 0;
    for (const r of craft.allRecipes()) {
      const row = el('div', `recipe ${craft.known.includes(r.id) ? '' : 'locked'} ${this.selectedRecipe === r.id ? 'selected' : ''}`);
      const mats = r.cost.map(([id, n]) => {
        const have = this.game.inventory.count(id);
        return `<span class="${have >= n ? '' : 'miss'}">${ITEMS[id]?.name || id} ${have}/${n}</span>`;
      }).join('  ');
      row.innerHTML = `<div><div class="rn">${r.name}</div><div class="rc">${mats}</div></div>
        <div class="rt">${r.bench ? 'WORKBENCH' : 'FIELD'}<br>${r.time?.toFixed(1) || 0}S</div>
        <div>${uiIcon('craft', 18, craft.canCraft(r) ? '#c9a227' : '#3d4644')}</div>`;
      row.addEventListener('click', () => {
        this.selectedRecipe = r.id;
        this.renderCrafting();
      });
      left.appendChild(row);
      shown++;
    }
    if (!shown) left.appendChild(el('div', 'sec-note', 'No recipes.'));
    wrap.appendChild(left);

    const right = el('div', 'detail-pane');
    const r = craft.allRecipes().find((x) => x.id === this.selectedRecipe);
    if (r) {
      const out = ITEMS[r.output[0]];
      const can = craft.canCraft(r);
      right.innerHTML = `<div style="display:flex;gap:12px;align-items:center">${out ? itemIcon(out.icon, 40) : ''}<div>
          <div class="idt">${r.name}</div><div class="ids">${r.output[1]} x ${out?.name || r.output[0]}</div></div></div>
        <div class="idd" style="margin-top:12px">${r.desc || ''}</div>
        <h2 class="sec" style="margin-top:18px">MATERIALS</h2>
        ${r.cost.map(([id, n]) => {
          const have = this.game.inventory.count(id);
          return `<div class="mat-row ${have >= n ? 'ok' : 'missing'}"><span>${ITEMS[id]?.name || id}</span><span>${have} / ${n}</span></div>`;
        }).join('')}
        <div class="kv" style="margin-top:14px"><span>TIME</span><b>${r.time?.toFixed(1) || 0}s</b></div>
        <div class="kv"><span>STATION</span><b>${r.bench ? 'Workbench' : 'Field'}</b></div>
        <div class="btn-row"><button class="btn primary" id="craft-go" ${can ? '' : 'disabled'}>${can ? 'CRAFT' : 'MISSING MATERIALS'}</button></div>`;
      right.querySelector('#craft-go').addEventListener('click', () => {
        if (this.game.crafting.craft(r.id)) this.renderCrafting();
      });
    } else {
      right.innerHTML = '<div class="idt" style="color:#4a5352">SELECT A RECIPE</div><div class="idd">Recipes unlock as your engineering skill grows and as you find patterns in the world.</div>';
    }
    wrap.appendChild(right);
    this.elBody.appendChild(wrap);
  }

  // ------------------------------------------------------------------- build
  renderBuild() {
    const bb = this.game.baseBuilding;
    this.elSub.textContent = `PLACED ${bb.placed.length} STRUCTURES`;
    this.elBody.innerHTML = '';
    const wrap = el('div', 'grid2');
    const left = el('div', 'recipe-list');
    for (const b of bb.pieces) {
      const row = el('div', `recipe ${this.selectedBuild === b.id ? 'selected' : ''}`);
      const mats = b.cost.map(([id, n]) => {
        const have = this.game.inventory.count(id);
        return `<span class="${have >= n ? '' : 'miss'}">${ITEMS[id]?.name || id} ${have}/${n}</span>`;
      }).join('  ');
      row.innerHTML = `<div><div class="rn">${b.name}</div><div class="rc">${mats}</div></div><div class="rt">${b.size ? `${b.size[0]}x${b.size[1]}M` : ''}</div><div>${uiIcon('build', 18, '#8b9794')}</div>`;
      row.addEventListener('click', () => {
        this.selectedBuild = b.id;
        this.game.baseBuilding.selectPiece(b.id);
        this.close();
        this.game.notify(`${b.name} - ghost preview active. LMB place, Q cancel.`, 'info', 'BUILD MODE');
      });
      left.appendChild(row);
    }
    wrap.appendChild(left);
    const right = el('div', 'detail-pane');
    const sel = bb.pieces.find((b) => b.id === this.selectedBuild);
    right.innerHTML = sel ? `<div class="idt">${sel.name}</div><div class="idd">${sel.desc}</div>
      <h2 class="sec" style="margin-top:18px">COST</h2>
      ${sel.cost.map(([id, n]) => `<div class="mat-row"><span>${ITEMS[id]?.name || id}</span><span>${n}</span></div>`).join('')}
      <div class="kv" style="margin-top:12px"><span>INTEGRITY</span><b>${sel.hp}</b></div>
      <div class="idd" style="margin-top:14px;color:#5f6a68">Foundations must be placed on flat ground. Walls snap to the grid and to existing pieces. Storage and beds require a roof to be usable as a safe zone.</div>`
      : '<div class="idt" style="color:#4a5352">SELECT A PIECE</div><div class="idd">Build a shelter to store supplies, sleep through the night and restore your vitals.</div>';
    wrap.appendChild(right);
    this.elBody.appendChild(wrap);
  }

  // --------------------------------------------------------------------- map
  renderMap() {
    const world = this.game.world;
    const p = this.game.player;
    this.elSub.textContent = `${world.locations.length} LOCATIONS CHARTED`;
    this.elBody.innerHTML = '';
    const wrap = el('div', 'map-wrap');
    const canvas = el('canvas', 'map-canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    wrap.appendChild(canvas);
    const legend = el('div', 'map-legend');
    const marks = [
      ['#c9a227', 'Survivor camp'], ['#6f8f5e', 'Safe shelter'], ['#8e2b28', 'Boss arena'],
      ['#4d7f9e', 'Building'], ['#7a6aa0', 'Cave / nest'], ['#b05a32', 'Hazard'],
    ];
    legend.innerHTML = marks.map(([c, l]) => `<div><i style="background:${c}"></i>${l}</div>`).join('');
    wrap.appendChild(legend);
    wrap.appendChild(el('div', 'map-hint', 'M CLOSE<br>OBJ MARKED IN AMBER'));
    this.elBody.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const half = 1500;
    const toPx = (x, z) => [(x + half) / 3000 * size, (z + half) / 3000 * size];
    ctx.fillStyle = '#0a0d0d';
    ctx.fillRect(0, 0, size, size);
    // region tints + relief
    const step = 8;
    for (let py = 0; py < size; py += step) {
      for (let px = 0; px < size; px += step) {
        const wx = (px / size) * 3000 - half;
        const wz = (py / size) * 3000 - half;
        const h = world.terrain.heightAt(wx, wz);
        const region = world.regionAt(wx, wz);
        const shade = clamp(58 + h * 3.4, 20, 132);
        let r = shade, g = shade * 0.97, b = shade * 0.9;
        if (region === 1) { r *= 0.6; g *= 0.9; b *= 0.58; }
        else if (region === 5) { r *= 1.25; g *= 0.7; b *= 0.6; }
        else if (region === 3) { r *= 0.9; g *= 0.94; b *= 1.05; }
        else if (region === 4) { r *= 0.78; g *= 0.88; b *= 0.7; }
        const ri = world.terrain.roadInfo(wx, wz);
        if (ri.dist < ri.width) { r = 120; g = 118; b = 108; }
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fillRect(px, py, step, step);
      }
    }
    // locations
    for (const loc of world.locations) {
      const [px, py] = toPx(loc.x, loc.z);
      let c = '#4d7f9e';
      if (loc.type === 'camp') c = '#c9a227';
      else if (loc.type === 'shelter') c = '#6f8f5e';
      else if (loc.type === 'cave' || loc.type === 'nest') c = '#7a6aa0';
      else if (loc.type === 'reactor' || loc.type === 'wasteland') c = '#b05a32';
      ctx.fillStyle = c;
      ctx.fillRect(px - 2, py - 2, 4, 4);
      if (loc.type === 'camp' || loc.type === 'reactor' || loc.type === 'shelter') {
        ctx.font = '600 18px monospace';
        ctx.fillStyle = 'rgba(216, 211, 194, .82)';
        const label = loc.name.toUpperCase();
        const tw = ctx.measureText(label).width;
        const lx = Math.min(Math.max(px + 8, 8), size - tw - 8);
        const ly = Math.min(Math.max(py + 6, 20), size - 8);
        ctx.fillText(label, lx, ly);
      }
    }
    for (const b of world.bossArenas) {
      const [px, py] = toPx(b.x, b.z);
      ctx.strokeStyle = '#8e2b28';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const h of world.hazardPools) {
      const [px, py] = toPx(h.x, h.z);
      ctx.fillStyle = 'rgba(140, 170, 50, .45)';
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, h.radius * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    // objective
    const marker = this.game.quests?.getTrackedMarker?.();
    if (marker) {
      const [px, py] = toPx(marker.x, marker.z);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py - 12);
      ctx.lineTo(px + 9, py);
      ctx.lineTo(px, py + 12);
      ctx.lineTo(px - 9, py);
      ctx.closePath();
      ctx.stroke();
    }
    // player
    const [ppx, ppy] = toPx(p.position.x, p.position.z);
    ctx.save();
    ctx.translate(ppx, ppy);
    ctx.rotate(-p.yaw);
    ctx.fillStyle = '#f0ead6';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(9, 11);
    ctx.lineTo(0, 5);
    ctx.lineTo(-9, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- settings
  renderSettings() {
    const s = this.game.settings;
    this.elSub.textContent = 'CHANGES APPLY IMMEDIATELY';
    this.elBody.innerHTML = '';
    const add = (title) => {
      const h = el('h2', 'sec', title);
      h.style.marginTop = this.elBody.children.length ? '24px' : '0';
      this.elBody.appendChild(h);
    };
    const row = (label, hint, control, valueEl) => {
      const r = el('div', 'setting-row');
      r.innerHTML = `<div><div class="sl-label">${label}</div><div class="sl-hint">${hint}</div></div>`;
      r.appendChild(control);
      r.appendChild(valueEl || el('div', '', ''));
      this.elBody.appendChild(r);
      return r;
    };
    const slider = (key, min, max, step, fmt = (v) => v.toFixed(2)) => {
      const wrapEl = el('div');
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min; input.max = max; input.step = step;
      input.value = s[key];
      const val = el('div', '', fmt(Number(s[key])));
      val.style.cssText = 'font:600 10px monospace;color:#8b9794;text-align:right';
      input.addEventListener('input', () => {
        s[key] = Number(input.value);
        val.textContent = fmt(Number(input.value));
        s.apply?.();
      });
      wrapEl.appendChild(input);
      return [wrapEl, val];
    };

    add('GRAPHICS');
    const q = el('select');
    for (const opt of ['low', 'medium', 'high']) {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt.toUpperCase();
      if (s.quality === opt) o.selected = true;
      q.appendChild(o);
    }
    q.addEventListener('change', () => this.game.setQuality(q.value));
    row('QUALITY PRESET', 'Resolution scale, shadows, bloom and draw distance.', q, el('div', '', ''));
    const [rsWrap, rsVal] = slider('renderScale', 0.6, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    row('RENDER SCALE', 'Lower for higher framerate on older GPUs.', rsWrap, rsVal);
    const shadowToggle = el('div', `toggle ${s.shadows ? 'on' : ''}`);
    shadowToggle.addEventListener('click', () => {
      s.shadows = !s.shadows;
      shadowToggle.classList.toggle('on', s.shadows);
      s.apply?.();
    });
    row('SHADOWS', 'Sun and moonlight shadow maps.', shadowToggle, el('div', '', ''));
    const bloomToggle = el('div', `toggle ${s.bloom ? 'on' : ''}`);
    bloomToggle.addEventListener('click', () => {
      s.bloom = !s.bloom;
      bloomToggle.classList.toggle('on', s.bloom);
      this.game.postfx?.bloom && (this.game.postfx.bloom.enabled = s.bloom);
    });
    row('BLOOM', 'Glow around lamps, fires and the reactor.', bloomToggle, el('div', '', ''));
    const filmToggle = el('div', `toggle ${s.filmGrain ? 'on' : ''}`);
    filmToggle.addEventListener('click', () => {
      s.filmGrain = !s.filmGrain;
      filmToggle.classList.toggle('on', s.filmGrain);
      if (this.game.postfx) this.game.postfx.grade.uniforms.uGrain.value = s.filmGrain ? 0.05 : 0;
    });
    row('FILM GRAIN + VIGNETTE', 'Cinematic grade on the final image.', filmToggle, el('div', '', ''));
    const [fovWrap, fovVal] = slider('fov', 60, 100, 1, (v) => `${Math.round(v)} deg`);
    fovWrap.querySelector('input').addEventListener('input', () => {
      this.game.camera.fov = Number(fovWrap.querySelector('input').value);
      this.game.camera.updateProjectionMatrix();
    });
    row('FIELD OF VIEW', 'Camera field of view.', fovWrap, fovVal);

    add('AUDIO');
    for (const [key, label] of [['master', 'MASTER VOLUME'], ['sfx', 'SOUND EFFECTS'], ['music', 'MUSIC'], ['ambient', 'AMBIENCE']]) {
      const [w, v] = slider(key, 0, 1, 0.01, (x) => `${Math.round(x * 100)}%`);
      w.querySelector('input').addEventListener('input', () => {
        this.game.audio?.setVolumes({ master: s.master, sfx: s.sfx, music: s.music, ambient: s.ambient });
      });
      row(label, ' ', w, v);
    }

    add('GAMEPLAY');
    const diff = el('select');
    for (const opt of ['survivor', 'stalker', 'ash']) {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt.toUpperCase();
      if (s.difficulty === opt) o.selected = true;
      diff.appendChild(o);
    }
    diff.addEventListener('change', () => {
      s.difficulty = diff.value;
      this.game.survival?.applyDifficulty?.(diff.value);
    });
    row('DIFFICULTY', 'SURVIVOR is forgiving. STALKER is intended. ASH has no mercy.', diff, el('div', '', ''));
    const [sensWrap, sensVal] = slider('sensitivity', 0.2, 3, 0.05, (v) => v.toFixed(2));
    sensWrap.querySelector('input').addEventListener('input', () => {
      this.game.input.sensitivity = s.sensitivity;
    });
    row('MOUSE SENSITIVITY', 'Pointer look speed.', sensWrap, sensVal);
    const invToggle = el('div', `toggle ${s.invertY ? 'on' : ''}`);
    invToggle.addEventListener('click', () => {
      s.invertY = !s.invertY;
      invToggle.classList.toggle('on', s.invertY);
      this.game.input.invertY = s.invertY;
    });
    row('INVERT MOUSE Y', 'For pilots and the deeply committed.', invToggle, el('div', '', ''));
    const [volWrap, volVal] = slider('crosshairScale', 0.6, 1.6, 0.05, (v) => `${v.toFixed(2)}x`);
    volWrap.querySelector('input').addEventListener('input', () => {
      this.game.hud.elCross.style.transform = `translate(-50%,-50%) scale(${s.crosshairScale})`;
    });
    row('CROSSHAIR SIZE', 'Scale of the aiming reticle.', volWrap, volVal);

    const btnRow = el('div', 'btn-row');
    const saveBtn = el('button', 'btn', 'SAVE GAME');
    saveBtn.addEventListener('click', () => {
      this.game.save?.save();
      this.game.notify('Progress saved.', 'info', 'SAVE');
    });
    const quitBtn = el('button', 'btn', 'QUIT TO MENU');
    quitBtn.addEventListener('click', () => this.game.toMainMenu?.());
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(quitBtn);
    this.elBody.appendChild(btnRow);
  }

  renderCredits() {
    this.elSub.textContent = 'VERSION 1.0.0';
    this.elBody.innerHTML = `
      <h2 class="sec">ASHES OF HUMANITY: LAST SIGNAL</h2>
      <div class="sec-note" style="font-size:13px;line-height:1.9;color:#8b9794">
        An original post-apocalyptic survival action RPG.<br><br>
        <b style="color:#d8d3c2">DESIGN / CODE / WORLD GENERATION</b><br>Procedural terrain, architecture and creature systems built for this project.<br><br>
        <b style="color:#d8d3c2">ENGINE</b><br>Three.js r180 with a custom renderer, physics, AI and UI stack. WebGL2.<br><br>
        <b style="color:#d8d3c2">AUDIO</b><br>All sound is synthesized at runtime - no recorded samples.<br><br>
        <b style="color:#d8d3c2">CONTENT</b><br>6 regions, 10 mutant species, 6 apex predators, 40 main contracts, 60 side contracts.<br><br>
        <span style="color:#5f6a68">This work is an original creation. No third-party assets, characters or story material are included.</span>
      </div>`;
  }

  // ---------------------------------------------------------------- dialogue
  openDialogue(npc, node) {
    this.dialogueNpc = npc;
    this.dialogueNode = node;
    this.dlg.classList.add('show');
    this.dialogueOpen = true;
    this.blocking = true;
    this.game.input?.exitLock();
    this.renderDialogue();
  }

  renderDialogue() {
    const npc = this.dialogueNpc;
    const node = this.dialogueNode;
    if (!npc || !node) return;
    this.elDlgName.textContent = npc.name;
    this.elDlgRole.textContent = npc.roleLabel || npc.role || 'SURVIVOR';
    this.elDlgText.textContent = node.text;
    this.elDlgPortrait.innerHTML = uiIcon(npc.icon || 'mask', 26, '#c9a227');
    this.elDlgTopic.textContent = node.topic || '';
    this.elDlgChoices.innerHTML = '';
    this.dlgChoiceIndex = 0;
    (node.choices || []).forEach((c, i) => {
      const d = el('div', `dlg-choice ${i === 0 ? 'sel' : ''}`, `<span class="key">${i + 1}</span>${c.label}`);
      d.addEventListener('click', () => this.chooseDialogue(i));
      d.addEventListener('mouseenter', () => {
        this.dlgChoiceIndex = i;
        [...this.elDlgChoices.children].forEach((n, k) => n.classList.toggle('sel', k === i));
      });
      this.elDlgChoices.appendChild(d);
    });
  }

  chooseDialogue(i) {
    const node = this.dialogueNode;
    const c = node?.choices?.[i];
    if (!c) return;
    if (c.action) {
      const next = c.action(this.dialogueNpc);
      if (next === false) {
        this.closeDialogue();
        return;
      }
      if (next) {
        this.dialogueNode = next;
        this.renderDialogue();
        return;
      }
    }
    if (c.next && typeof c.next === 'object') {
      this.dialogueNode = c.next;
      this.renderDialogue();
      return;
    }
    this.closeDialogue();
  }

  closeDialogue() {
    this.dlg.classList.remove('show');
    this.dialogueOpen = false;
    this.blocking = !!this.openPane || this.mainMenu.classList.contains('show');
    this.dialogueNpc?.onDialogueClosed?.();
    this.game.refreshUiBlock?.();
  }

  // ------------------------------------------------------------------ input
  handleKey(code) {
    if (this.dialogueOpen) {
      if (code === 'Escape') {
        this.closeDialogue();
        return true;
      }
      const n = Number(/^Digit([1-9])$/.exec(code)?.[1] || 0);
      if (n) {
        this.chooseDialogue(n - 1);
        return true;
      }
      if (code === 'KeyW' || code === 'ArrowUp') {
        this.dlgChoiceIndex = Math.max(0, this.dlgChoiceIndex - 1);
        [...this.elDlgChoices.children].forEach((c, i) => c.classList.toggle('sel', i === this.dlgChoiceIndex));
        return true;
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        this.dlgChoiceIndex = Math.min(this.elDlgChoices.children.length - 1, this.dlgChoiceIndex + 1);
        [...this.elDlgChoices.children].forEach((c, i) => c.classList.toggle('sel', i === this.dlgChoiceIndex));
        return true;
      }
      if (code === 'KeyE' || code === 'Enter') {
        this.chooseDialogue(this.dlgChoiceIndex);
        return true;
      }
      return true;
    }
    if (this.mainMenu.classList.contains('show')) {
      if (code === 'KeyW' || code === 'ArrowUp') {
        this.menuIndex = (this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.refreshMenuSelection();
        return true;
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
        this.refreshMenuSelection();
        return true;
      }
      if (code === 'Enter' || code === 'Space' || code === 'KeyE') {
        const it = this.menuItems[this.menuIndex];
        if (it && !it.disabled) this.menuAction(it.id);
        return true;
      }
      return this.openPane ? false : true;
    }
    if (this.openPane) {
      if (code === 'Escape' || code === 'Tab') {
        this.close();
        return true;
      }
      const map = { KeyK: 'skills', KeyJ: 'journal', KeyB: 'crafting', KeyV: 'build', KeyM: 'map', KeyO: 'settings' };
      if (map[code]) {
        this.setTab(map[code]);
        return true;
      }
      if (code === 'KeyF') {
        if (this.tab === 'inventory') this.useSelectedItem();
        return true;
      }
      if (code === 'KeyR' && this.tab === 'inventory' && this.selectedItem) {
        this.game.inventory.move(this.selectedItem.uid, this.selectedItem.x, this.selectedItem.y, !this.selectedItem.rotated);
        this.renderInventory();
        return true;
      }
      const n = Number(/^Digit([1-7])$/.exec(code)?.[1] || 0);
      if (n && MAIN_TABS[n - 1]) {
        this.setTab(MAIN_TABS[n - 1].id);
        return true;
      }
      return true;
    }
    return false;
  }
}
