// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// ui/panels.js — inventory, skills, journal, map, craft, build,
//                medical, field notes, settings
// ============================================================
import { itemIcon, bodySvg, BODY_PARTS, catColor, GLYPH, STATUS_ICON } from './icons.js';
import { ITEMS, WEAPONS, SKILLS, RECIPES, BUILDABLES, REGIONS, MUTANTS, BOSSES } from '../game/data.js';
import { ALL_QUESTS, ACTS, MAIN_QUESTS } from '../game/quests.js';
import { clamp } from '../core/util.js';

const h = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (v) => `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="7"/><path d="M9.5 9.5 H14.5 M9.5 14.5 H14.5 M12 7 V17"/></svg>`;

const TABS = [
  ['inventory', 'Inventory'], ['skills', 'Skills'], ['journal', 'Journal'],
  ['map', 'Map'], ['craft', 'Craft'], ['build', 'Build'], ['medical', 'Medical'], ['notes', 'Field Notes'],
];

export class Panels {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.screen = null;
    this.tab = null;
    this.craftCat = 'All';
    this.selected = null;
    this.hoverItem = null;
    this.drag = null;
    this.waypoint = null;
    this.build();
  }

  build() {
    this.overlay = h('div', 'overlay');
    this.overlay.id = 'screens';
    this.overlay.innerHTML = '<div class="scr" id="scr-root"></div>';
    document.getElementById('ui').appendChild(this.overlay);
    this.root = this.overlay.querySelector('#scr-root');

    this.overlay.addEventListener('click', (e) => this.onClick(e));
    this.overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const item = e.target.closest('.item');
      if (item) this.rotateItem(+item.dataset.uid);
    });
    this.overlay.addEventListener('mousedown', (e) => this.onDown(e));
    window.addEventListener('mousemove', (e) => this.onMove(e));
    window.addEventListener('mouseup', (e) => this.onUp(e));
    this.overlay.addEventListener('mousemove', (e) => this.onHover(e));
    this.overlay.addEventListener('mouseleave', () => this.ui.hideTooltip());
    window.addEventListener('keydown', (e) => {
      if (!this.screen) return;
      if (e.code === 'Escape' || e.code === 'Tab') { e.preventDefault(); this.close(); }
      if (e.code === 'KeyR' && this.drag) this.drag.rot = !this.drag.rot;
    });
  }

  visible() { return !!this.screen; }

  open(screen, tab = null) {
    this.screen = screen;
    this.tab = tab || screen;
    this.selected = null;
    this.overlay.classList.add('open');
    this.ui.onPanelOpen();
    this.render();
  }

  close() {
    this.screen = null;
    this.overlay.classList.remove('open');
    this.ui.hideTooltip();
    this.ui.onPanelClose();
  }

  swap(screen) { this.screen = screen; this.tab = screen; this.selected = null; this.render(); }

  // ---------------------------------------------------------------- shell
  shell(title, body, foot = '', extraTabs = '') {
    return `
      <div class="scr-head">
        <h1>${title}</h1>
        <div class="tabs">
          ${TABS.map(([id, label]) => `<div class="tab ${this.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${label}</div>`).join('')}
          ${extraTabs}
        </div>
        <div class="close-x pe" data-act="close">${GLYPH.close}</div>
      </div>
      <div class="scr-body">${body}</div>
      <div class="scr-foot">${foot || '<span>ESC — CLOSE</span><span>[R] ROTATE ITEM · DRAG TO ARRANGE</span>'}</div>
    `;
  }

  tabBar() { return TABS.map(([id, l]) => `<div class="tab ${this.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${l}</div>`).join(''); }

  render() {
    if (!this.screen) return;
    let html = '';
    switch (this.screen) {
      case 'inventory': html = this.renderInventory(); break;
      case 'skills': html = this.renderSkills(); break;
      case 'journal': html = this.renderJournal(); break;
      case 'map': html = this.renderMap(); break;
      case 'craft': html = this.renderCraft(); break;
      case 'build': html = this.renderBuild(); break;
      case 'medical': html = this.renderMedical(); break;
      case 'notes': html = this.renderNotes(); break;
      case 'settings': html = this.renderSettings(); break;
      default: html = this.renderInventory();
    }
    const scroll = this.root.querySelector('.scr-body')?.scrollTop || 0;
    this.root.innerHTML = html;
    this.root.classList.add('fade-in');
    setTimeout(() => this.root.classList.remove('fade-in'), 300);
    const body = this.root.querySelector('.scr-body');
    if (body && scroll) body.scrollTop = scroll;
    if (this.screen === 'map') this.drawMap();
    if (this.screen === 'inventory') this.renderDetail();
  }

  // ---------------------------------------------------------------- INVENTORY
  renderInventory() {
    const inv = this.game.inventory;
    const p = this.game.player;
    const g = this.game;
    const w = inv.weight.toFixed(1), cap = inv.carryCapacity.toFixed(0);
    const slots = ['head', 'body', 'back', 'light', 'utility', 'weapon1', 'weapon2', 'melee'];
    const slotLabels = { head: 'Head', body: 'Body', back: 'Pack', light: 'Light', utility: 'Utility', weapon1: 'Primary', weapon2: 'Secondary', melee: 'Melee' };

    const eq = slots.map((s) => {
      const it = inv.equipment[s];
      const def = it ? (ITEMS[it.id] || WEAPONS[it.id]) : null;
      return `<div class="eq-slot ${it ? 'filled' : ''}" data-slot="${s}" data-act="eq" data-id="${s}" title="${it ? esc(def?.name || it.id) : slotLabels[s]}">
        ${it ? itemIcon(it.id, def, { size: 30 }) : ''}
        <span class="lbl">${slotLabels[s]}</span>
      </div>`;
    }).join('');

    const parts = BODY_PARTS.map((bp) => {
      const cond = g.body ? g.body.partCondition(bp.id) : 100;
      return { ...bp, cond };
    });
    const bodyCls = (id) => {
      const pt = parts.find((x) => x.id === id);
      return !pt ? '' : pt.cond > 66 ? 'ok' : pt.cond > 33 ? 'hurt' : 'crit';
    };

    const cells = [];
    for (let i = 0; i < inv.cols * inv.rows; i++) cells.push('<div class="inv-cell"></div>');

    const items = inv.items.map((it) => {
      const def = ITEMS[it.id] || WEAPONS[it.id];
      const [w2, h2] = inv.dims(it);
      const dur = it.durability !== undefined ? Math.round(it.durability * 100) : null;
      const rare = (def?.value || 0) >= 100;
      return `<div class="item pe ${rare ? 'rare' : ''} ${def?.cat === 'quest' ? 'quest' : ''} ${this.selected === it.uid ? 'sel' : ''}"
        data-uid="${it.uid}" data-act="item"
        style="left:${it.x * 10}%;top:${it.y * (100 / inv.rows)}%;width:${w2 * 10}%;height:${h2 * (100 / inv.rows)}%">
        ${itemIcon(it.id, def, { size: 40 })}
        ${it.qty > 1 ? `<span class="qty">${it.qty}</span>` : ''}
        ${dur !== null && def?.type ? `<span class="dur"><i class="${dur < 30 ? 'low' : ''}" style="width:${dur}%"></i></span>` : ''}
      </div>`;
    }).join('');

    const armor = Math.round(p.armorValue || 0);
    const rad = Math.round((p.armorRadRes || 0) * 100);
    const vit = p.stats;

    const body = `
      <div class="inv-wrap">
        <div class="equip-col">
          <div class="char-doll panel">
            ${bodySvg(bodyCls)}
            <div class="eq-slots">${eq}</div>
          </div>
          <div class="panel panel-pad">
            <div class="panel-title">Condition</div>
            <div class="stat-lines">
              <div class="stat-line"><span>Armor</span><b>${armor}</b></div>
              <div class="stat-line"><span>Rad resist</span><b>${rad}%</b></div>
              <div class="stat-line"><span>Health</span><b class="${vit.health < 35 ? 'warn' : ''}">${Math.round(vit.health)} / ${vit.healthMax}</b></div>
              <div class="stat-line"><span>Bleeding</span><b class="${vit.bleed > 1 ? 'warn' : ''}">${Math.round(vit.bleed)}%</b></div>
              <div class="stat-line"><span>Infection</span><b class="${vit.infection > 20 ? 'warn' : ''}">${Math.round(vit.infection)}%</b></div>
              <div class="stat-line"><span>Radiation</span><b class="${vit.radiation > 20 ? 'warn' : ''}">${Math.round(vit.radiation)}</b></div>
            </div>
          </div>
        </div>
        <div class="grid-col">
          <div class="grid-head">
            <div class="panel-title" style="margin:0">Field Pack · ${inv.cols}×${inv.rows}</div>
            <div class="carry ${inv.overloaded ? 'over' : ''}">CARRY <b>${w}</b> / ${cap} kg</div>
          </div>
          <div class="inv-grid ${inv.overloaded ? 'over' : ''}" id="inv-grid">${cells.join('')}${items}</div>
          <div class="inv-foot">
            <div style="display:flex;gap:6px">
              <button class="btn sm pe" data-act="sort">${GLYPH.sort} Sort</button>
              <button class="btn sm pe" data-act="drop-sel">${GLYPH.drop} Drop</button>
            </div>
            <div class="gold">${money}<b>${inv.gold}</b></div>
          </div>
        </div>
        <div class="detail-col panel panel-pad" id="inv-detail"></div>
      </div>
    `;
    return this.shell('Inventory', body);
  }

  itemDef(id) { return ITEMS[id] || WEAPONS[id]; }

  renderDetail() {
    const pane = this.root.querySelector('#inv-detail');
    if (!pane) return;
    const inv = this.game.inventory;
    const it = this.selected ? inv.items.find((i) => i.uid === this.selected) : null;
    if (!it) {
      pane.innerHTML = `<div class="panel-title">Item</div><div class="detail-empty">Select an item<br>in the pack</div>
        <div class="hr"></div><div class="d-hint">Drag items to rearrange.<br>Right click to rotate.<br>Double click to use or equip.</div>`;
      return;
    }
    const def = this.itemDef(it.id);
    const isWeapon = !!WEAPONS[it.id];
    const stats = [];
    if (def.dmg) stats.push(['Damage', def.dmg + (def.pellets ? ` ×${def.pellets}` : '')]);
    if (def.rate) stats.push(['Cycle', def.rate.toFixed(1) + ' /s']);
    if (def.mag) stats.push(['Magazine', def.mag]);
    if (def.range) stats.push(['Range', def.range + ' m']);
    if (def.armor) stats.push(['Armor', def.armor]);
    if (def.radResist) stats.push(['Rad resist', Math.round(def.radResist * 100) + '%']);
    if (def.carry) stats.push(['Carry bonus', '+' + def.carry + ' kg']);
    if (def.use) for (const [k, v] of Object.entries(def.use)) stats.push([k, (v > 0 ? '+' : '') + v]);
    stats.push(['Weight', (def.weight || 0).toFixed(2) + ' kg']);
    stats.push(['Value', def.value || 0]);

    const acts = [];
    if (isWeapon) acts.push(`<button class="btn sm pe" data-act="equip-sel">${GLYPH.equip} Equip</button>`);
    else if (def.slot) acts.push(`<button class="btn sm pe" data-act="equip-sel">${GLYPH.equip} Equip</button>`);
    if (def.use || def.cat === 'food' || def.cat === 'water' || def.cat === 'medicine') acts.push(`<button class="btn sm pe" data-act="use-sel">${GLYPH.use} Use</button>`);
    acts.push(`<button class="btn sm pe" data-act="drop-sel">${GLYPH.drop} Drop</button>`);

    // attachments
    let attHtml = '';
    if (isWeapon && def.attachments) {
      const installed = it.attachments || {};
      attHtml = `<div class="panel-title" style="margin-top:16px">Attachments</div>`;
      for (const slotId of def.attachments) {
        const have = installed[slotId];
        attHtml += `<div class="att-row"><span>${esc(slotId.replace(/_/g, ' '))}</span><b>${have ? esc(ITEMS[have?.id]?.name || 'Fitted') : '—'}</b></div>`;
      }
    }
    pane.innerHTML = `
      <div class="panel-title">Item Detail</div>
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div class="r-icon" style="width:56px;height:56px">${itemIcon(it.id, def, { size: 42 })}</div>
        <div style="flex:1">
          <div class="d-title">${esc(def?.name || it.id)}</div>
          <div class="d-cat">${esc((def?.cat || def?.type || 'item').toUpperCase())}${it.qty > 1 ? ' · ×' + it.qty : ''}</div>
        </div>
      </div>
      <div class="d-desc">${esc(def?.desc || 'No description on file.')}</div>
      <div class="d-stats">
        ${stats.map(([k, v]) => `<div class="d-stat"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
        ${it.durability !== undefined && isWeapon ? `<div class="d-stat"><span>Condition</span><b>${Math.round(it.durability * 100)}%</b></div>` : ''}
      </div>
      ${attHtml}
      <div class="d-actions">${acts.join('')}</div>
      <div class="d-hint">${isWeapon ? 'Weapons lose condition as they fire. Repair at a workbench.' : 'Drag to arrange. Right click rotates.'}</div>
    `;
  }

  rotateItem(uid) {
    const inv = this.game.inventory;
    const it = inv.items.find((i) => i.uid === uid);
    if (!it) return;
    const [w, hh] = inv.dims(it);
    if (w === hh) return;
    if (inv.moveItem(uid, it.x, it.y, !it.rot)) { this.game.audio.uiClick(); this.render(); }
  }

  // ---------------------------------------------------------------- SKILLS
  renderSkills() {
    const g = this.game;
    const pts = g.skillPoints || 0;
    const cols = Object.entries(SKILLS).map(([treeId, tree]) => {
      const spent = tree.nodes.reduce((a, n) => a + (g.skillRanks[n.id] || 0), 0);
      const nodes = tree.nodes.map((node) => {
        const rank = g.skillRanks[node.id] || 0;
        const maxed = rank >= node.max;
        const reqOk = node.req.every((r) => (g.skillRanks[r] || 0) > 0);
        const can = !maxed && reqOk && pts > 0;
        const cls = maxed ? 'maxed' : !reqOk ? 'locked' : can ? 'can' : '';
        const pips = Array.from({ length: node.max }, (_, i) => `<i class="${i < rank ? 'on' : ''}"></i>`).join('');
        return `<div class="sk ${cls} pe" data-act="skill" data-id="${node.id}" title="${esc(node.desc)}">
          <div class="sk-icon">${rank}/${node.max}</div>
          <div class="sk-main">
            <div class="sk-name">${esc(node.name)}</div>
            <div class="sk-desc">${esc(node.desc)}</div>
            <div class="sk-meta"><span>${maxed ? 'MASTERED' : reqOk ? '1 POINT' : 'REQUIRES ' + node.req.join(', ').toUpperCase()}</span>
              <span class="sk-pips">${pips}</span></div>
          </div>
        </div>`;
      }).join('');
      return `<div class="tree">
        <div class="tree-head">
          <h3 style="color:${tree.color}">${esc(tree.name)}</h3>
          <div class="t-desc">${this.treeDesc(treeId)}</div>
          <div class="t-count">${spent}</div>
        </div>
        <div class="tree-body">${nodes}</div>
      </div>`;
    }).join('');
    const body = `<div style="flex:1;display:flex;flex-direction:column;min-height:0;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="panel-title" style="margin:0">Four disciplines · 50 levels · 1 point per level</div>
        <div class="skill-points">Available points <b>${pts}</b></div>
      </div>
      <div class="skill-trees">${cols}</div>
    </div>`;
    return this.shell('Skills', body, '<span>CLICK A NODE TO SPEND A POINT</span><span>LEVEL 50 CAP</span>');
  }

  treeDesc(id) {
    return {
      combat: 'Weapon handling, recoil control, melee. Built to end fights.',
      survival: 'Endurance, medicine, tolerance for hunger, cold and pain.',
      engineering: 'Salvage, repair, ammunition, construction.',
      exploration: 'Awareness, silence, endurance running, finding what others missed.',
    }[id] || '';
  }

  // ---------------------------------------------------------------- JOURNAL
  renderJournal() {
    const q = this.game.quests;
    const activeIds = new Set(Object.entries(q.state).filter(([, s]) => s.status === 'active').map(([id]) => id));
    const doneIds = new Set(Object.entries(q.state).filter(([, s]) => s.status === 'done').map(([id]) => id));
    const byAct = ACTS.map((act) => {
      const quests = MAIN_QUESTS.filter((x) => x.act === act.n);
      const done = quests.filter((x) => doneIds.has(x.id)).length;
      return `<div class="act ${this.actSel === act.n ? 'on' : ''}" data-act="act" data-id="${act.n}">
        <div class="a-num">ACT ${act.n}</div>
        <div class="a-name">${esc(act.name)}</div>
        <div class="a-sub">${done} / ${quests.length} complete</div>
      </div>`;
    }).join('') + `<div class="act ${this.actSel === 'side' ? 'on' : ''}" data-act="act" data-id="side">
        <div class="a-num">OPTIONAL</div><div class="a-name">Side Work</div>
        <div class="a-sub">${q.quests.filter((x) => !x.act).length} tasks</div></div>`;

    let list = [];
    if (this.actSel === 'side') list = q.quests.filter((x) => !x.act);
    else if (this.actSel) list = MAIN_QUESTS.filter((x) => x.act === this.actSel);
    else {
      list = q.quests.filter((x) => activeIds.has(x.id) || q.canStart(x.id)).slice(0, 20);
      if (!list.length) list = MAIN_QUESTS.slice(0, 3);
    }
    const cards = list.map((quest) => {
      const st = q.state[quest.id];
      const status = st?.status || (q.canStart(quest.id) ? 'available' : 'locked');
      const objs = quest.objectives.map((o, i) => {
        const cur = st?.progress?.[i] || 0;
        const max = o.count || 1;
        const done = cur >= max;
        return `<div class="${done ? 'done' : ''}">${esc(o.desc || o.type)}${max > 1 ? ` <span class="obj-count">${cur}/${max}</span>` : ''}</div>`;
      }).join('');
      const rw = quest.rewards || {};
      const reward = [rw.xp ? rw.xp + ' XP' : '', rw.money ? rw.money + ' trade' : '',
        ...Object.entries(rw.items || {}).map(([k, v]) => `${this.itemDef(k)?.name || k} ×${v}`)].filter(Boolean).join(' · ');
      const tag = quest.act ? `<span class="q-tag main">MAIN</span>` : `<span class="q-tag">SIDE</span>`;
      const doneTag = status === 'done' ? '<span class="q-tag done">COMPLETE</span>' : '';
      return `<div class="q-card ${this.selected === quest.id ? 'on' : ''} ${status === 'done' ? 'done' : ''}" data-act="quest" data-id="${quest.id}">
        <div class="q-num">${quest.act ? 'ACT ' + quest.act : 'SIDE TASK'}${tag}${doneTag}</div>
        <div class="q-name">${esc(quest.name)}</div>
        <div class="q-short">${esc(quest.desc)}</div>
        <div class="q-obj">${objs}</div>
        ${reward ? `<div class="q-reward">REWARD <b>${esc(reward)}</b></div>` : ''}
        ${status === 'active' && q.tracked !== quest.id ? `<div style="margin-top:8px"><button class="btn sm pe" data-act="track" data-id="${quest.id}">Track</button></div>` : ''}
        ${status === 'active' && q.tracked === quest.id ? `<div style="margin-top:8px" class="tiny">TRACKED</div>` : ''}
      </div>`;
    }).join('');

    const body = `<div class="journal-wrap">
      <div class="act-list">${byAct}</div>
      <div class="quest-list">${list.length ? cards : '<div class="empty-state">No tasks recorded</div>'}</div>
    </div>`;
    const foot = `<span>${q.completedCount} OBJECTIVES COMPLETED</span><span>${activeIds.size} ACTIVE</span>`;
    return this.shell('Journal', body, foot);
  }

  // ---------------------------------------------------------------- FIELD NOTES
  renderNotes() {
    const g = this.game;
    const seen = g.codex?.mutants || {};
    const killed = g.codex?.kills || {};
    const mutants = Object.entries(MUTANTS).map(([id, m]) => {
      const known = !!seen[id];
      return `<div class="q-card">
        <div class="q-num">${known ? 'LOGGED' : 'UNCONFIRMED'}</div>
        <div class="q-name">${known ? esc(m.name) : 'UNKNOWN ORGANISM'}</div>
        <div class="q-short">${known ? esc(m.desc) : 'No observation recorded. Something is out there.'}</div>
        ${known ? `<div class="q-obj"><div>THREAT ${m.threat} · ${esc(m.tactics)}</div>
          <div>KILLED ${killed[id] || 0}</div></div>` : ''}
      </div>`;
    }).join('');
    const bosses = Object.entries(BOSSES).map(([id, b]) => {
      const dead = g.codex?.bosses?.[id];
      return `<div class="q-card ${dead ? 'done' : ''}">
        <div class="q-num">${dead ? 'TERMINATED' : 'HOSTILE · UNENGAGED'}</div>
        <div class="q-name">${dead || g.codex?.bossSeen?.[id] ? esc(b.name) : 'REDACTED'}</div>
        <div class="q-short">${dead || g.codex?.bossSeen?.[id] ? esc(b.desc) : 'Warden records sealed.'}</div>
      </div>`;
    }).join('');
    const regions = REGIONS.map((r) => {
      const disc = g.codex?.regions?.[r.id];
      return `<div class="q-card ${disc ? '' : 'done'}">
        <div class="q-num">${disc ? 'SURVEYED' : 'UNEXPLORED'} · DANGER ${r.danger}</div>
        <div class="q-name">${esc(r.name)}</div>
        <div class="q-short">${disc ? esc(r.desc) : 'No survey data. The map ends here.'}</div>
      </div>`;
    }).join('');
    const body = `<div style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0">
      <div class="tabs" style="gap:2px">
        <div class="tab ${this.notesTab !== 'mutants' ? '' : 'on'}" data-act="notes-tab" data-id="mutants">Organisms</div>
        <div class="tab ${this.notesTab === 'bosses' ? 'on' : ''}" data-act="notes-tab" data-id="bosses">Warden Assets</div>
        <div class="tab ${this.notesTab === 'regions' ? 'on' : ''}" data-act="notes-tab" data-id="regions">Regions</div>
      </div>
      <div class="craft-wrap">${this.notesTab === 'bosses' ? bosses : this.notesTab === 'regions' ? regions : mutants}</div>
    </div>`;
    return this.shell('Field Notes', body, `<span>${Object.keys(seen).length} ORGANISMS LOGGED</span><span>AUTO-RECORDED</span>`);
  }

  // ---------------------------------------------------------------- MAP
  renderMap() {
    const g = this.game;
    const pois = g.world.pois.filter((p) => p.discovered);
    const p = g.player;
    const rows = pois.map((poi) => {
      const d = Math.hypot(poi.x - p.pos.x, poi.z - p.pos.z);
      return `<div class="poi-row" data-act="poi" data-id="${poi.id}">
        <span class="p-name">${esc(poi.name)}</span><span class="p-dist">${Math.round(d)}m</span></div>`;
    }).join('');
    const body = `<div class="map-wrap">
      <div id="map-canvas-wrap"><canvas id="map-canvas"></canvas>
        <div class="map-legend">
          <div><i style="background:#8fa36a"></i>Discovered site</div>
          <div><i style="background:#b04632"></i>Warden asset</div>
          <div><i style="background:#c9963f"></i>Camp / safe</div>
          <div><i style="background:#79a0b4"></i>Water</div>
          <div class="mono" style="opacity:.55;margin-top:2px">Contours every 8 m</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;min-height:0">
        <div class="panel-title" style="margin:0">Located Sites · ${pois.length}/${g.world.pois.length}</div>
        <div class="poi-list" style="flex:1">${rows || '<div class="empty-state">No sites surveyed</div>'}</div>
        <div class="panel panel-pad" style="font-size:10.5px;color:var(--dim);line-height:1.6">
          <div>CLICK THE MAP TO SET A WAYPOINT</div>
          <div class="mono" style="margin-top:6px;color:var(--paper-2)" id="map-coords">—</div>
        </div>
      </div>
    </div>`;
    return this.shell('Map', body, '<span>CLICK TO MARK · WAYPOINT SHOWS ON COMPASS</span><span>ESC — CLOSE</span>');
  }

  drawMap() {
    const canvas = this.root.querySelector('#map-canvas');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (W < 10 || H < 10) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const g = this.game;
    const bx0 = -720, bx1 = 720, bz0 = -540, bz1 = 560;
    const sx = (x) => ((x - bx0) / (bx1 - bx0)) * W;
    const sz = (z) => ((z - bz0) / (bz1 - bz0)) * H;
    this.mapTransform = { sx, sz, W, H };

    ctx.fillStyle = '#0d100c';
    ctx.fillRect(0, 0, W, H);
    // baked terrain survey: ground, roads, ruins, water
    const bm = g.world.mapBitmap;
    if (bm) {
      if (!this._mapChart || this._mapChart.bm !== bm) {
        const off = document.createElement('canvas');
        off.width = bm.w; off.height = bm.h;
        const octx = off.getContext('2d');
        const img = octx.createImageData(bm.w, bm.h);
        img.data.set(bm.data);
        octx.putImageData(img, 0, 0);
        this._mapChart = { bm, canvas: off };
      }
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this._mapChart.canvas, 0, 0, W, H);
      ctx.restore();
      // chart grid over the terrain
      ctx.strokeStyle = 'rgba(12,16,12,.30)';
      for (let x = bx0; x <= bx1; x += 100) { ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), H); ctx.stroke(); }
      for (let z = bz0; z <= bz1; z += 100) { ctx.beginPath(); ctx.moveTo(0, sz(z)); ctx.lineTo(W, sz(z)); ctx.stroke(); }
      // soft vignette so labels stay readable at the edges
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.25, W * 0.5, H * 0.5, H * 0.95);
      vg.addColorStop(0, 'rgba(8,10,8,0)');
      vg.addColorStop(1, 'rgba(8,10,8,.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
    // region boundaries and names
    for (const r of REGIONS) {
      const x0 = sx(Math.max(r.x0, bx0)), x1 = sx(Math.min(r.x1, bx1));
      const z0 = sz(Math.max(r.z0, bz0)), z1 = sz(Math.min(r.z1, bz1));
      ctx.strokeStyle = 'rgba(170,176,150,.14)';
      ctx.strokeRect(x0, z0, x1 - x0, z1 - z0);
      ctx.fillStyle = 'rgba(190,196,168,.44)';
      ctx.font = '9px "SFMono-Regular",Consolas,monospace';
      ctx.fillText(r.name, x0 + 8, z0 + 14);
    }
    // crater + lake
    const wd = g.world;
    const crater = wd.terrain?.crater;
    if (crater) {
      ctx.beginPath();
      ctx.arc(sx(crater.x), sz(crater.z), Math.max(4, (crater.r / (bx1 - bx0)) * W), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,80,60,.5)'; ctx.stroke();
      ctx.fillStyle = 'rgba(120,50,40,.12)'; ctx.fill();
    }
    const lake = wd.terrain?.lake;
    if (lake) {
      ctx.beginPath();
      ctx.arc(sx(lake.x), sz(lake.z), Math.max(3, (lake.r / (bx1 - bx0)) * W), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(110,150,170,.18)'; ctx.fill();
    }
    // roads (from terrain road network if present)
    ctx.strokeStyle = 'rgba(120,120,100,.18)';
    ctx.lineWidth = 1;
    if (wd.terrain?.roadSegments) {
      for (const seg of wd.terrain.roadSegments) {
        ctx.beginPath();
        ctx.moveTo(sx(seg.a[0]), sz(seg.a[1]));
        ctx.lineTo(sx(seg.b[0]), sz(seg.b[1]));
        ctx.stroke();
      }
    }
    // POIs
    for (const poi of wd.pois) {
      const x = sx(poi.x), z = sz(poi.z);
      const disc = poi.discovered;
      const isBoss = poi.type === 'boss';
      const isCamp = poi.type === 'camp' || poi.type === 'shelter';
      if (isBoss && !disc) {
        ctx.fillStyle = 'rgba(176,70,50,.35)';
        ctx.beginPath(); ctx.arc(x, z, 3, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (!disc) continue;
      ctx.fillStyle = isBoss ? '#b04632' : isCamp ? '#c9963f' : '#8fa36a';
      ctx.save();
      ctx.translate(x, z);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      ctx.fillStyle = 'rgba(200,195,178,.55)';
      ctx.font = '9px "Barlow Condensed",Arial';
      ctx.fillText(poi.name, x + 7, z + 3);
    }
    // waypoint
    if (this.waypoint) {
      const x = sx(this.waypoint.x), z = sz(this.waypoint.z);
      ctx.strokeStyle = '#e0b463'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, z, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 10, z); ctx.lineTo(x + 10, z); ctx.moveTo(x, z - 10); ctx.lineTo(x, z + 10); ctx.stroke();
    }
    // player arrow
    const px = sx(g.player.pos.x), pz = sz(g.player.pos.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-g.player.yaw);
    ctx.fillStyle = '#f0e6cc';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,230,204,.35)';
    ctx.beginPath(); ctx.arc(px, pz, 16, 0, Math.PI * 2); ctx.stroke();

    // interaction: click to waypoint
    canvas.onmousedown = (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const wx = bx0 + (mx / W) * (bx1 - bx0);
      const wz = bz0 + (my / H) * (bz1 - bz0);
      this.waypoint = { x: wx, z: wz };
      this.game.setWaypoint(wx, wz);
      const coords = this.root.querySelector('#map-coords');
      if (coords) coords.textContent = `WAYPOINT  X ${Math.round(wx)}  Z ${Math.round(wz)}`;
      this.drawMap();
    };
  }

  // ---------------------------------------------------------------- CRAFT
  renderCraft() {
    const g = this.game;
    const cats = ['All', ...new Set(RECIPES.map((r) => r.cat))];
    const bench = g.nearBenchLevel ?? 0;
    const list = RECIPES.filter((r) => this.craftCat === 'All' || r.cat === this.craftCat);
    const cards = list.map((r) => {
      const [outId, outQty] = r.out;
      const def = this.itemDef(outId);
      const cheap = g.skills?.craftCheap || 0;
      const ing = Object.entries(r.in).map(([id, qty]) => {
        const need = Math.max(1, qty - (def2 => 0)(0));
        const have = g.inventory.count(id);
        const req = Math.max(1, qty - (cheap > 0 && (r.cat === 'Weapons' || r.cat === 'Ammunition') ? 1 : 0));
        const ok = have >= req;
        return `<span class="ing ${ok ? '' : 'miss'}">${esc(this.itemDef(id)?.name || id)} ${have}/${req}</span>`;
      }).join('');
      const benchOk = bench >= r.bench;
      const can = benchOk && Object.entries(r.in).every(([id, qty]) => {
        const req = Math.max(1, qty - (cheap > 0 && (r.cat === 'Weapons' || r.cat === 'Ammunition') ? 1 : 0));
        return g.inventory.count(id) >= req;
      });
      return `<div class="recipe ${can ? '' : 'cant'}">
        <div class="r-head">
          <div class="r-icon">${itemIcon(outId, def, { size: 26 })}</div>
          <div style="flex:1">
            <div class="r-name">${esc(def?.name || outId)}${outQty > 1 ? ` ×${outQty}` : ''}</div>
            <div class="r-sub">${esc(r.cat)} · ${r.bench === 0 ? 'HAND TOOLS' : r.bench === 1 ? 'WORKBENCH' : 'MACHINE SHOP'}</div>
          </div>
        </div>
        <div class="r-desc">${esc(def?.desc || '')}</div>
        <div class="r-ing">${ing}</div>
        <div class="r-foot">
          <span class="r-time">${r.time}s</span>
          <button class="btn sm pe" data-act="craft" data-id="${r.id}" ${can ? '' : 'disabled'}>${can ? 'Craft' : benchOk ? 'Missing materials' : 'Bench required'}</button>
        </div>
      </div>`;
    }).join('');
    const body = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="tab-bar">${cats.map((c) => `<div class="tab ${this.craftCat === c ? 'on' : ''}" data-act="craft-cat" data-id="${c}">${esc(c)}</div>`).join('')}</div>
        <div class="tiny">BENCH LEVEL ${bench} ${bench ? '' : ' · NONE NEARBY'}</div>
      </div>
      <div class="craft-wrap">${cards}</div>
    </div>`;
    return this.shell('Crafting', body, `<span>${RECIPES.length} RECIPES KNOWN</span><span>MATERIALS PULLED FROM PACK</span>`);
  }

  // ---------------------------------------------------------------- BUILD
  renderBuild() {
    const g = this.game;
    const cards = BUILDABLES.map((b) => {
      const cost = Object.entries(b.cost).map(([id, qty]) => {
        const have = g.inventory.count(id);
        return `<span class="ing ${have >= qty ? '' : 'miss'}">${esc(this.itemDef(id)?.name || id)} ${have}/${qty}</span>`;
      }).join('');
      const can = Object.entries(b.cost).every(([id, qty]) => g.inventory.count(id) >= qty);
      return `<div class="recipe ${can ? '' : 'cant'}">
        <div class="r-head">
          <div class="r-icon">${itemIcon('wood_plank', ITEMS.wood_plank, { size: 26, color: '#a08a5a' })}</div>
          <div style="flex:1">
            <div class="r-name">${esc(b.name)}</div>
            <div class="r-sub">${esc(b.cat)} · ${b.size[0]}×${b.size[1]}×${b.size[2]} m</div>
          </div>
        </div>
        <div class="r-desc">${b.storage ? `Storage capacity ${b.storage} slots.` : b.bench ? 'Enables advanced crafting recipes.' : b.light ? 'Provides light and warmth.' : b.damage ? `Deals ${b.damage} damage when stepped on.` : 'Structural piece for a forward base.'}</div>
        <div class="r-ing">${cost}</div>
        <div class="r-foot">
          <span class="r-time">HP ${b.hp}</span>
          <button class="btn sm pe" data-act="place" data-id="${b.id}" ${can ? '' : 'disabled'}>${can ? 'Place' : 'Missing materials'}</button>
        </div>
      </div>`;
    }).join('');
    const body = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-title" style="margin:0">Forward Construction · ${g.buildCount || 0} structures standing</div>
        <div class="tiny">CLICK PLACE, THEN LEFT CLICK IN THE WORLD</div>
      </div>
      <div class="craft-wrap">${cards}</div>
    </div>`;
    return this.shell('Base Building', body, '<span>SNAP TO GROUND</span><span>STORAGE SHARED WITH PACK</span>');
  }

  // ---------------------------------------------------------------- MEDICAL
  renderMedical() {
    const g = this.game;
    const body = g.body;
    const inv = g.inventory;
    const parts = BODY_PARTS.map((bp) => {
      const cond = body ? body.partCondition(bp.id) : 100;
      const w = body?.wounds[bp.id] || { bleed: 0, fracture: false, infection: 0 };
      const cls = cond > 66 ? '' : cond > 33 ? 'mid' : 'bad';
      const tags = [];
      if (w.bleed > 1) tags.push(`<span class="med-tag">Bleeding ${Math.round(w.bleed)}</span>`);
      if (w.fracture) tags.push('<span class="med-tag">Fractured</span>');
      if (w.infection > 1) tags.push(`<span class="med-tag">Infected ${Math.round(w.infection)}</span>`);
      if (!tags.length) tags.push('<span class="med-tag ok">Stable</span>');
      return `<div class="med-part ${cond < 34 ? 'crit' : ''}">
        <div class="med-part-head"><span class="med-part-name">${bp.label}</span><span class="med-part-val">${Math.round(cond)}%</span></div>
        <div class="med-bar"><i class="${cls}" style="width:${cond}%"></i></div>
        <div class="med-tags">${tags.join('')}</div>
        <div class="med-actions">
          <button class="btn sm pe" data-act="treat" data-id="${bp.id}" data-item="bandage" ${inv.count('bandage') ? '' : 'disabled'}>Bandage</button>
          <button class="btn sm pe" data-act="treat" data-id="${bp.id}" data-item="splint" ${inv.count('splint') ? '' : 'disabled'}>Splint</button>
          <button class="btn sm pe" data-act="treat" data-id="${bp.id}" data-item="medkit" ${inv.count('medkit') ? '' : 'disabled'}>Medkit</button>
        </div>
      </div>`;
    }).join('');
    const st = g.player.stats;
    const bodyCls = (id) => {
      const cond = body ? body.partCondition(id) : 100;
      return cond > 66 ? 'ok' : cond > 33 ? 'hurt' : 'crit';
    };
    const html = `<div class="scr-body" style="gap:24px">
      <div class="med-doll panel" style="min-width:300px">${bodySvg(bodyCls)}</div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0">
        <div class="panel panel-pad">
          <div class="panel-title" style="margin:0">Systemic condition</div>
          <div class="status-strip" style="margin-top:10px">
            <div class="stat-chip ${st.bleed > 1 ? 'warn' : ''}">${STATUS_ICON.bleed}<b>Bleed ${Math.round(st.bleed)}</b></div>
            <div class="stat-chip ${st.infection > 20 ? 'warn' : ''}">${STATUS_ICON.infection}<b>Infection ${Math.round(st.infection)}</b></div>
            <div class="stat-chip ${st.radiation > 25 ? 'warn' : ''}">${STATUS_ICON.radiation}<b>Radiation ${Math.round(st.radiation)}</b></div>
            <div class="stat-chip">${STATUS_ICON.health}<b>${Math.round(st.health)} / ${st.healthMax} HP</b></div>
          </div>
          <div class="med-actions" style="margin-top:12px">
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="antibiotics" ${inv.count('antibiotics') ? '' : 'disabled'}>Antibiotics</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="antirad" ${inv.count('antirad') ? '' : 'disabled'}>Anti-rad</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="painkillers" ${inv.count('painkillers') ? '' : 'disabled'}>Painkillers</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="stim_combat" ${inv.count('stim_combat') ? '' : 'disabled'}>Combat stim</button>
          </div>
        </div>
        <div class="med-parts" style="flex:1">${parts}</div>
      </div>
    </div>`;
    return `<div class="scr-head"><h1>Medical</h1><div class="tabs">${this.tabBar()}</div>
      <div class="close-x pe" data-act="close">${GLYPH.close}</div></div>
      ${html}
      <div class="scr-foot"><span>TREATMENTS CONSUME SUPPLIES</span><span>CRIPPLED LIMBS AFFECT MOVEMENT AND AIM</span></div>`;
  }

  // ---------------------------------------------------------------- SETTINGS
  renderSettings() {
    const s = this.game.settings;
    const slider = (key, label, min, max, step, val, fmt = (v) => v) => `
      <div class="set-row"><div class="set-label">${label}</div>
        <div class="set-ctl"><input type="range" class="pe" data-act="set" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${val}">
        <span class="set-val">${fmt(val)}</span></div></div>`;
    const seg = (key, label, opts, val) => `
      <div class="set-row"><div class="set-label">${label}</div>
        <div class="set-ctl"><div class="seg">${opts.map((o) => `<button class="pe ${String(val) === String(o[0]) ? 'on' : ''}" data-act="setseg" data-key="${key}" data-val="${o[0]}">${o[1]}</button>`).join('')}</div></div></div>`;
    const body = `<div class="settings-wrap">
      <div class="set-group">
        <div class="panel-title">Audio</div>
        ${slider('master', 'Master volume', 0, 1, 0.05, s.master, (v) => Math.round(v * 100) + '%')}
        ${slider('music', 'Music', 0, 1, 0.05, s.music, (v) => Math.round(v * 100) + '%')}
        ${slider('sfx', 'Effects', 0, 1, 0.05, s.sfx, (v) => Math.round(v * 100) + '%')}
        <div class="hr"></div>
        <div class="panel-title">Video</div>
        ${slider('fov', 'Field of view', 60, 100, 1, s.fov, (v) => v + '°')}
        ${slider('renderScale', 'Render scale', 0.5, 1, 0.05, s.renderScale, (v) => Math.round(v * 100) + '%')}
        ${slider('brightness', 'Brightness', 0.6, 1.6, 0.05, s.brightness, (v) => v.toFixed(2))}
        ${slider('viewDistance', 'View distance', 0.5, 1.4, 0.1, s.viewDistance, (v) => Math.round(v * 100) + '%')}
        ${seg('shadows', 'Shadows', [[1, 'On'], [0, 'Off']], s.shadows ? 1 : 0)}
        ${seg('quality', 'Quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], s.quality)}
        ${seg('motionBlur', 'Motion blur', [[1, 'On'], [0, 'Off']], s.motionBlur ? 1 : 0)}
      </div>
      <div class="set-group">
        <div class="panel-title">Gameplay</div>
        ${slider('sensitivity', 'Mouse sensitivity', 0.2, 3, 0.05, s.sensitivity, (v) => v.toFixed(2))}
        ${slider('gamepadSens', 'Gamepad sensitivity', 0.2, 3, 0.05, s.gamepadSens, (v) => v.toFixed(2))}
        ${seg('invertY', 'Invert Y', [[0, 'Off'], [1, 'On']], s.invertY ? 1 : 0)}
        ${seg('difficulty', 'Difficulty', [['story', 'Story'], ['survivor', 'Survivor'], ['ashes', 'Ashes']], s.difficulty)}
        ${seg('cameraMode', 'Default view', [[0, 'Third'], [1, 'First']], s.cameraMode)}
        ${seg('autoPickup', 'Auto pickup ammo', [[1, 'On'], [0, 'Off']], s.autoPickup ? 1 : 0)}
        ${seg('showDamage', 'Damage numbers', [[1, 'On'], [0, 'Off']], s.showDamage ? 1 : 0)}
        <div class="hr"></div>
        <div class="panel-title">Controls</div>
        <div class="keys-grid">
          <div class="key-row"><span>Move</span><kbd>W A S D</kbd></div>
          <div class="key-row"><span>Sprint</span><kbd>SHIFT</kbd></div>
          <div class="key-row"><span>Crouch</span><kbd>C</kbd></div>
          <div class="key-row"><span>Jump / Vault</span><kbd>SPACE</kbd></div>
          <div class="key-row"><span>Fire</span><kbd>LMB</kbd></div>
          <div class="key-row"><span>Aim</span><kbd>RMB</kbd></div>
          <div class="key-row"><span>Reload</span><kbd>R</kbd></div>
          <div class="key-row"><span>Interact</span><kbd>E</kbd></div>
          <div class="key-row"><span>Flashlight</span><kbd>F</kbd></div>
          <div class="key-row"><span>Medical</span><kbd>H</kbd></div>
          <div class="key-row"><span>Inventory</span><kbd>TAB</kbd></div>
          <div class="key-row"><span>Journal</span><kbd>J</kbd></div>
          <div class="key-row"><span>Map</span><kbd>M</kbd></div>
          <div class="key-row"><span>Skills</span><kbd>K</kbd></div>
          <div class="key-row"><span>Crafting</span><kbd>C</kbd></div>
          <div class="key-row"><span>Camera</span><kbd>V</kbd></div>
          <div class="key-row"><span>Quick slot</span><kbd>1 2 3 4</kbd></div>
          <div class="key-row"><span>Pause</span><kbd>ESC</kbd></div>
        </div>
      </div>
    </div>`;
    return `<div class="scr-head"><h1>Settings</h1>
      <div class="tabs">${this.tabBar()}</div>
      <div class="close-x pe" data-act="close">${GLYPH.close}</div></div>
      <div class="scr-body">${body}</div>
      <div class="scr-foot"><span>CHANGES APPLY IMMEDIATELY</span><span>ESC — BACK</span></div>`;
  }

  // ---------------------------------------------------------------- events
  onClick(e) {
    const a = e.target.closest('[data-act]');
    const g = this.game;
    if (!a) {
      const item = e.target.closest('.item');
      if (!item) return;
      return;
    }
    const act = a.dataset.act;
    const id = a.dataset.id;
    if (act === 'close') return this.close();
    if (act === 'tab') {
      const screen = id === 'notes' && this.screen === 'notes' ? 'notes' : id;
      if (screen === 'settings' || screen === 'medical') { this.screen = screen; this.tab = screen; }
      else { this.screen = screen; this.tab = screen; }
      this.selected = null;
      this.render();
      return;
    }
    if (act === 'act') { this.actSel = id === 'side' ? 'side' : +id; this.render(); return; }
    if (act === 'quest') { this.selected = id; this.render(); return; }
    if (act === 'track') { g.quests.tracked = id; g.audio.uiClick(); this.render(); return; }
    if (act === 'notes-tab') { this.notesTab = id; this.render(); return; }
    if (act === 'craft-cat') { this.craftCat = id; this.render(); return; }
    if (act === 'sort') { g.inventory.sortItems(); g.audio.uiClick(); this.render(); return; }
    if (act === 'craft') { g.craft(id); this.render(); return; }
    if (act === 'place') { g.startBuilding(id); this.close(); return; }
    if (act === 'item') {
      const uid = +a.dataset.uid;
      this.selected = uid;
      g.audio.uiClick();
      this.refreshAll();
      return;
    }
    if (act === 'eq') {
      const slot = id;
      const inv = g.inventory;
      if (inv.equipment[slot]) { inv.unequip(slot); g.audio.uiClick(); this.refreshAll(); }
      return;
    }
    if (act === 'use-sel') { if (this.selected) { g.inventory.useItem(this.selected); this.selected = null; this.refreshAll(); } return; }
    if (act === 'equip-sel') {
      if (this.selected) {
        const ok = g.inventory.equip(this.selected);
        if (ok) { this.selected = null; g.audio.equip && g.audio.equip(); }
        this.refreshAll();
      }
      return;
    }
    if (act === 'drop-sel') {
      if (this.selected) { g.dropItem(this.selected); this.selected = null; this.refreshAll(); }
      return;
    }
    if (act === 'skill') { g.spendSkillPoint(id); this.render(); return; }
    if (act === 'treat') {
      const part = id, item = a.dataset.item;
      if (g.body) g.body.treat(part, item);
      this.render();
      return;
    }
    if (act === 'poi') {
      const poi = g.world.pois.find((p) => p.id === id);
      if (poi) { this.waypoint = { x: poi.x, z: poi.z }; g.setWaypoint(poi.x, poi.z); this.drawMap(); }
      return;
    }
    if (act === 'set' || act === 'setseg') {
      const key = a.dataset.key;
      let val = act === 'set' ? parseFloat(a.value) : a.dataset.val;
      if (['shadows', 'invertY', 'motionBlur', 'autoPickup', 'showDamage'].includes(key)) val = +val;
      if (key === 'quality' || key === 'difficulty') val = String(val);
      if (key === 'cameraMode') val = +val;
      g.settings[key] = val;
      g.applySettings();
      if (act === 'set') {
        const span = a.parentElement.querySelector('.set-val');
        if (span) {
          const fmt = { fov: (v) => v + '°', renderScale: (v) => Math.round(v * 100) + '%', brightness: (v) => (+v).toFixed(2),
            viewDistance: (v) => Math.round(v * 100) + '%', master: (v) => Math.round(v * 100) + '%', music: (v) => Math.round(v * 100) + '%',
            sfx: (v) => Math.round(v * 100) + '%', sensitivity: (v) => (+v).toFixed(2), gamepadSens: (v) => (+v).toFixed(2) }[key] || ((v) => v);
          span.textContent = fmt(val);
        }
      } else this.render();
      return;
    }
  }

  refreshAll() {
    if (!this.screen) return;
    if (this.screen === 'inventory') {
      const grid = this.root.querySelector('#inv-grid');
      if (grid) {
        // lightweight: rebuild only items and the detail pane
        const inv = this.game.inventory;
        for (const n of grid.querySelectorAll('.item')) n.remove();
        grid.insertAdjacentHTML('beforeend', inv.items.map((it) => {
          const def = this.itemDef(it.id);
          const [w2, h2] = inv.dims(it);
          const dur = it.durability !== undefined ? Math.round(it.durability * 100) : null;
          return `<div class="item pe ${(def?.value || 0) >= 100 ? 'rare' : ''} ${def?.cat === 'quest' ? 'quest' : ''} ${this.selected === it.uid ? 'sel' : ''}"
            data-uid="${it.uid}" data-act="item"
            style="left:${it.x * 10}%;top:${it.y * (100 / inv.rows)}%;width:${w2 * 10}%;height:${h2 * (100 / inv.rows)}%">
            ${itemIcon(it.id, def, { size: 40 })}
            ${it.qty > 1 ? `<span class="qty">${it.qty}</span>` : ''}
            ${dur !== null && def?.type ? `<span class="dur"><i class="${dur < 30 ? 'low' : ''}" style="width:${dur}%"></i></span>` : ''}
          </div>`;
        }).join(''));
        const carry = this.root.querySelector('.carry');
        if (carry) carry.innerHTML = `CARRY <b>${inv.weight.toFixed(1)}</b> / ${inv.carryCapacity.toFixed(0)} kg`;
        const eqNodes = this.root.querySelectorAll('.eq-slot');
        for (const node of eqNodes) {
          const slot = node.dataset.slot;
          const it = inv.equipment[slot];
          const def = it ? this.itemDef(it.id) : null;
          node.classList.toggle('filled', !!it);
          node.innerHTML = `${it ? itemIcon(it.id, def, { size: 30 }) : ''}<span class="lbl">${slot === 'weapon1' ? 'Primary' : slot === 'weapon2' ? 'Secondary' : slot[0].toUpperCase() + slot.slice(1)}</span>`;
        }
      }
      this.renderDetail();
      return;
    }
    this.render();
  }

  // ---------------------------------------------------------------- drag & drop
  onDown(e) {
    if (!this.screen) return;
    const itemEl = e.target.closest('.item');
    if (!itemEl || e.button !== 0) return;
    const uid = +itemEl.dataset.uid;
    const inv = this.game.inventory;
    const it = inv.items.find((i) => i.uid === uid);
    if (!it) return;
    const r = itemEl.getBoundingClientRect();
    this.drag = {
      uid, item: it, offX: e.clientX - r.left, offY: e.clientY - r.top,
      ghostW: r.width, ghostH: r.height, rot: it.rot, moved: false, startX: e.clientX, startY: e.clientY,
    };
    this.selected = uid;
    itemEl.classList.add('dragging');
    e.preventDefault();
  }

  onMove(e) {
    if (!this.drag) return;
    this.drag.moved = this.drag.moved || Math.abs(e.clientX - this.drag.startX) + Math.abs(e.clientY - this.drag.startY) > 4;
    const grid = this.root.querySelector('#inv-grid');
    if (!grid) return;
    // highlight
    const gx = this.gridCoord(e.clientX, e.clientY);
    for (const c of grid.querySelectorAll('.inv-cell.hover, .inv-cell.bad')) c.classList.remove('hover', 'bad');
    if (gx) {
      const inv = this.game.inventory;
      const it = this.drag.item;
      const [w0, h0] = inv.dims({ ...it, rot: this.drag.rot });
      const ok = inv.canPlace(it, gx.x, gx.y, this.drag.rot);
      const cells = grid.querySelectorAll('.inv-cell');
      for (let yy = 0; yy < h0; yy++) for (let xx = 0; xx < w0; xx++) {
        const idx = (gx.y + yy) * inv.cols + (gx.x + xx);
        if (cells[idx]) cells[idx].classList.add(ok ? 'hover' : 'bad');
      }
    }
    if (this.ui.tooltip) this.ui.hideTooltip();
  }

  gridCoord(cx, cy) {
    const grid = this.root.querySelector('#inv-grid');
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    const pad = 8;
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    const cellW = (r.width - pad * 2) / this.game.inventory.cols;
    const cellH = (r.height - pad * 2) / this.game.inventory.rows;
    const x = Math.floor((cx - r.left - pad) / cellW - (this.drag ? this.drag.offX / cellW - 0.5 : 0.5));
    const y = Math.floor((cy - r.top - pad) / cellH - (this.drag ? this.drag.offY / cellH - 0.5 : 0.5));
    return { x: clamp(x, 0, this.game.inventory.cols - 1), y: clamp(y, 0, this.game.inventory.rows - 1) };
  }

  onUp(e) {
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    if (d.moved) {
      const gx = this.gridCoord(e.clientX, e.clientY);
      if (gx) {
        const inv = this.game.inventory;
        if (inv.moveItem(d.uid, gx.x, gx.y, d.rot)) this.game.audio.uiClick();
        else this.game.notify('No room there.');
      }
    }
    this.refreshAll();
  }

  onHover(e) {
    if (this.drag) return;
    const itemEl = e.target.closest('.item');
    if (!itemEl) { this.ui.hideTooltip(); return; }
    const uid = +itemEl.dataset.uid;
    if (this.hoverItem === uid) { this.ui.moveTooltip(e.clientX, e.clientY); return; }
    this.hoverItem = uid;
    const it = this.game.inventory.items.find((i) => i.uid === uid);
    if (!it) return;
    const def = this.itemDef(it.id);
    this.ui.showTooltip(e.clientX, e.clientY, `
      <div class="tt-name">${esc(def?.name || it.id)}${it.qty > 1 ? ` ×${it.qty}` : ''}</div>
      <div class="tt-cat">${esc((def?.cat || def?.type || 'item').toUpperCase())}</div>
      <div class="tt-desc">${esc(def?.desc || '')}</div>
      ${def?.dmg ? `<div class="tt-extra">DMG ${def.dmg} · ${def.rate?.toFixed(1)}/s${def.mag ? ` · MAG ${def.mag}` : ''}</div>` : ''}
      ${def?.armor ? `<div class="tt-extra">ARMOR ${def.armor}${def.radResist ? ` · RAD ${Math.round(def.radResist * 100)}%` : ''}</div>` : ''}
      ${it.durability !== undefined && def?.type ? `<div class="tt-extra">CONDITION ${Math.round(it.durability * 100)}%</div>` : ''}
    `);
  }
}
