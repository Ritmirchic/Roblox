// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// ui/ui.js — interface coordinator (HUD, panels, dialogue, shop,
//           menus, tooltips, key routing)
// ============================================================
import { CSS } from './style.js';
import { HUD } from './hud.js';
import { Panels } from './panels.js';
import { itemIcon, GLYPH, catColor } from './icons.js';
import { ITEMS, WEAPONS } from '../game/data.js';
import { clamp } from '../core/util.js';

const h = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor(game) {
    this.game = game;
    this.mode = 'loading';
    this.dialogueState = null;
    this.shopState = null;
    this.tooltipEl = null;
    this.type = null;
    this._buildRoot();
    this.hud = new HUD(game);
    this.panels = new Panels(game, this);
    this.hud.attach(this.root);
    this._buildMenus();
    this.applySettings();
  }

  _buildRoot() {
    if (!document.getElementById('ui-style')) {
      const st = document.createElement('style');
      st.id = 'ui-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    let root = document.getElementById('ui');
    if (!root) { root = h('div'); root.id = 'ui'; document.body.appendChild(root); }
    this.root = root;
  }

  attachHud() { this.hud.attach(this.root); }

  // ---------------------------------------------------------------- state
  isBlockingInput() {
    return !!this.shopState || !!this.dialogueState || this.panels.visible() ||
      this.mode === 'paused' || this.mode === 'menu' || this.mode === 'dead' || this.mode === 'loading';
  }

  onPanelOpen() {
    this._panelReturn = this.game.mode === 'menu' ? 'menu'
      : (this.pauseEl?.classList.contains('open') ? 'paused' : 'playing');
    this.mode = 'panel';
    this.game.locked = true;
    this.hud.setCrosshair(false);
    this.hud.setPrompt(null);
    this.game.audio.uiClick();
  }

  onPanelClose() {
    this.game.audio.uiClick();
    if (this._panelReturn === 'menu') {
      this.mode = 'menu';
      this.game.mode = 'menu';
      this.game.locked = false;
      this.showMainMenu(this.game.hasSave());
      this.hud.setVisible(false);
      return;
    }
    if (this._panelReturn === 'paused') {
      this.mode = 'paused';
      this.game.locked = true;
      this.pauseEl.classList.add('open');
      return;
    }
    this.mode = 'playing';
    this.game.mode = 'playing';
    this.game.locked = false;
    this.hud.setCrosshair(true);
  }

  // ---------------------------------------------------------------- loading
  showLoading() {
    if (!this.loading) {
      this.loading = h('div');
      this.loading.id = 'loading';
      this.loading.innerHTML = `
        <div class="load-title">ASHES OF HUMANITY</div>
        <div class="load-bar"><i id="load-fill"></i></div>
        <div class="load-step" id="load-step">INITIALISING</div>
        <div class="load-tip" id="load-tip"></div>`;
      document.body.appendChild(this.loading);
    }
    this.loading.classList.remove('done');
    this.mode = 'loading';
  }

  setLoading(pct, step) {
    const f = document.getElementById('load-fill');
    const s = document.getElementById('load-step');
    const t = document.getElementById('load-tip');
    if (f) f.style.width = clamp(pct, 0, 100) + '%';
    if (s) s.textContent = (step || '').toUpperCase();
    if (t && !t.textContent) t.textContent = this.randomTip();
  }

  randomTip() {
    const tips = [
      'The Hollow hunt by sound. Crouch and they will walk past you.',
      'Bandages stop bleeding. A medkit repairs a limb, but only a splint fixes a fracture.',
      'Radiation accumulates in the red wasteland. Anti-rad injections bind it before it becomes damage.',
      'Food and water drain faster while sprinting. So does your stamina.',
      'Weapons wear out. Repair them at a workbench before the barrel fails.',
      'Every region has a boss. The arenas are marked on the map once you get close.',
      'Resonance shards sell for a fortune. They also hum at night, which attracts things.',
      'You can build a fire to stay warm. Hypothermia costs stamina and accuracy.',
      'The signal repeats every night at the same hour. It is not random.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  hideLoading() {
    const l = document.getElementById('loading');
    if (l) { l.classList.add('done'); this.mode = 'playing'; }
  }

  // ---------------------------------------------------------------- menus
  _buildMenus() {
    // tooltip
    this.tooltipEl = h('div');
    this.tooltipEl.id = 'tooltip';
    document.body.appendChild(this.tooltipEl);

    // dialogue
    this.dialogueEl = h('div');
    this.dialogueEl.id = 'dialogue';
    this.dialogueEl.innerHTML = `
      <div class="dlg-head">
        <div class="dlg-portrait" id="dlg-portrait"></div>
        <div class="dlg-id"><div class="dlg-name" id="dlg-name"></div><div class="dlg-role" id="dlg-role"></div></div>
        <div class="close-x pe" id="dlg-close">${GLYPH.close}</div>
      </div>
      <div class="dlg-body"><div class="dlg-text" id="dlg-text"></div></div>
      <div class="dlg-choices" id="dlg-choices"></div>`;
    this.root.appendChild(this.dialogueEl);
    this.dialogueEl.querySelector('#dlg-close').onclick = () => this.game.npcs.close();
    this.dialogueEl.querySelector('.dlg-body').onclick = () => this.skipTypewriter();

    // shop
    this.shopEl = h('div');
    this.shopEl.id = 'shop';
    this.shopEl.innerHTML = `
      <div class="scr-head" style="padding:16px 22px 12px">
        <h1 style="font-size:16px;letter-spacing:.3em" id="shop-title">TRADE</h1>
        <div style="display:flex;align-items:center;gap:16px">
          <div class="gold" id="shop-gold"></div>
          <div class="close-x pe" id="shop-close">${GLYPH.close}</div>
        </div>
      </div>
      <div class="shop-body">
        <div class="shop-col"><h3>Their stock</h3><div class="shop-list" id="shop-buy"></div></div>
        <div class="shop-col"><h3>Your pack</h3><div class="shop-list" id="shop-sell"></div></div>
      </div>
      <div class="scr-foot"><span>CLICK TO BUY OR SELL ONE</span><span>SHIFT + CLICK FOR FIVE</span></div>`;
    this.root.appendChild(this.shopEl);
    this.shopEl.querySelector('#shop-close').onclick = () => this.closeShop();
    this.shopEl.addEventListener('click', (e) => this.onShopClick(e));

    // pause
    this.pauseEl = h('div');
    this.pauseEl.id = 'pause';
    this.pauseEl.innerHTML = `
      <div class="pause-box">
        <h2>Paused</h2>
        <div class="p-sub">ASHES OF HUMANITY · LAST SIGNAL</div>
        <button class="btn pe" data-act="resume">Resume</button>
        <button class="btn pe" data-act="save">Save Progress</button>
        <button class="btn pe" data-act="load">Load Last Save</button>
        <button class="btn pe" data-act="settings">Settings</button>
        <button class="btn pe" data-act="medical">Medical</button>
        <button class="btn pe" data-act="menu">Main Menu</button>
        <div class="tiny" style="margin-top:14px" id="pause-info"></div>
      </div>`;
    this.root.appendChild(this.pauseEl);
    this.pauseEl.addEventListener('click', (e) => this.onPauseClick(e));

    // death
    this.deathEl = h('div');
    this.deathEl.id = 'death';
    this.deathEl.innerHTML = `
      <div class="death-title">YOU DIED</div>
      <div class="death-sub" id="death-cause">THE WASTELAND KEEPS WHAT IT TAKES</div>
      <div class="death-stats">
        <div class="death-stat"><b id="death-level">1</b><span>Level</span></div>
        <div class="death-stat"><b id="death-kills">0</b><span>Kills</span></div>
        <div class="death-stat"><b id="death-time">0m</b><span>Survived</span></div>
        <div class="death-stat"><b id="death-quests">0</b><span>Objectives</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn primary pe" data-act="respawn">Respawn at Shelter 12</button>
        <button class="btn pe" data-act="load">Load Last Save</button>
        <button class="btn pe" data-act="menu">Main Menu</button>
      </div>
      <div class="tiny" style="margin-top:26px">YOU WILL LOSE WHAT YOU WERE CARRYING</div>`;
    this.root.appendChild(this.deathEl);
    this.deathEl.addEventListener('click', (e) => this.onDeathClick(e));

    // main menu
    this.menuEl = h('div');
    this.menuEl.id = 'mainmenu';
    this.menuEl.innerHTML = `
      <div class="mm-title"><h1>ASHES OF HUMANITY</h1><h2>LAST SIGNAL</h2></div>
      <div class="mm-sub">A POST-APOCALYPTIC SURVIVAL ROLEPLAYING GAME</div>
      <div class="mm-menu">
        <button class="btn primary pe" data-act="new">New Game</button>
        <button class="btn pe" data-act="continue">Continue</button>
        <button class="btn pe" data-act="settings">Settings</button>
        <button class="btn pe" data-act="controls">Controls</button>
        <button class="btn pe" data-act="credits">Credits</button>
      </div>
      <div class="mm-foot">PROCEDURAL WORLD · ORIGINAL AUDIO · NO TWO DEAD CITIES ALIKE</div>
      <div class="mm-build" id="mm-build"></div>`;
    this.root.appendChild(this.menuEl);
    this.menuEl.addEventListener('click', (e) => this.onMenuClick(e));
  }

  setBuildTag(text) { const n = this.menuEl.querySelector('#mm-build'); if (n) n.innerHTML = text; }

  showMainMenu(hasSave) {
    this.mode = 'menu';
    this.menuEl.classList.add('open');
    this.hud.setVisible(false);
    const cont = this.menuEl.querySelector('[data-act="continue"]');
    if (cont) cont.style.display = hasSave ? '' : 'none';
  }

  hideMainMenu() {
    this.menuEl.classList.remove('open');
    // leaving the title screen must also release the menu input block, otherwise
    // every key stays swallowed by handleKey() and the survivor cannot move
    if (this.game.mode === 'playing' || this.mode === 'menu') this.mode = 'playing';
    this.hud.setCrosshair(true);
  }

  onMenuClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    this.game.audio.uiClick();
    const a = b.dataset.act;
    if (a === 'new') this.game.startNewGame();
    if (a === 'continue') this.game.continueGame();
    if (a === 'settings') { this.hideMainMenu(); this.panels.open('settings'); }
    if (a === 'controls') { this.hideMainMenu(); this.panels.open('settings'); this.panels.render(); }
    if (a === 'credits') {
      this.hideMainMenu();
      this.panels.open('notes');
    }
  }

  openPause() {
    if (this.mode === 'dead' || this.mode === 'menu') return;
    this.mode = 'paused';
    this.pauseEl.classList.add('open');
    this.game.locked = true;
    this.game.audio.uiClick();
    const info = this.pauseEl.querySelector('#pause-info');
    if (info) {
      const g = this.game;
      info.textContent = `LEVEL ${g.level || 1} · ${g.quests.completedCount} OBJECTIVES · ${Math.floor((g.time || 0) / 60)} MIN PLAYED`;
    }
  }

  closePause() {
    this.pauseEl.classList.remove('open');
    this.mode = 'playing';
    this.game.locked = false;
  }

  onPauseClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    this.game.audio.uiClick();
    if (a === 'resume') this.closePause();
    if (a === 'save') { this.game.saveGame(true); this.hud.notify('Progress saved', 'Your journal, pack and position were written to the shelter terminal.', null, 'good'); }
    if (a === 'load') { this.closePause(); this.game.loadGame(); }
    if (a === 'settings') { this.pauseEl.classList.remove('open'); this.mode = 'playing'; this.panels.open('settings'); }
    if (a === 'medical') { this.pauseEl.classList.remove('open'); this.mode = 'playing'; this.panels.open('medical'); }
    if (a === 'menu') { this.game.toMainMenu(); }
  }

  showDeath(cause = '') {
    this.mode = 'dead';
    this.game.locked = true;
    this.deathEl.classList.add('open');
    const g = this.game;
    this.deathEl.querySelector('#death-cause').textContent = cause || 'THE WASTELAND KEEPS WHAT IT TAKES';
    this.deathEl.querySelector('#death-level').textContent = g.level || 1;
    this.deathEl.querySelector('#death-kills').textContent = g.stats?.kills || 0;
    this.deathEl.querySelector('#death-time').textContent = Math.floor((g.time || 0) / 60) + 'm';
    this.deathEl.querySelector('#death-quests').textContent = g.quests.completedCount;
    this.hud.setCrosshair(false);
  }

  hideDeath() { this.deathEl.classList.remove('open'); this.mode = 'playing'; this.game.locked = false; }

  onDeathClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'respawn') { this.hideDeath(); this.game.respawnPlayer(); }
    if (a === 'load') { this.hideDeath(); this.game.loadGame(); }
    if (a === 'menu') { this.hideDeath(); this.game.toMainMenu(); }
  }

  // ---------------------------------------------------------------- hud proxies
  setVisible(v) { this.hud.setVisible(v); }
  notify(t, text, color, kind) { return this.hud.notify(t, text, color, kind); }
  notifyQuest(t, text) { return this.hud.notifyQuest(t, text); }
  notifyObjective(quest, obj, cur, max) {
    this.hud.toast(quest, `${obj}${max > 1 ? `  —  ${cur}/${max}` : ''}`, 'quest');
  }
  setPrompt(t) { this.hud.setPrompt(t); }
  promptVisible() { return this.hud.promptVisible(); }
  hitMarker(k) { this.hud.hitMarker(k); }
  flashDamage(s) { this.hud.flashDamage(s); }
  updateWeapon() { this.hud.updateWeapon(); }
  updateEquipment() { this.hud.updateWeapon(); }
  refreshJournal() { if (this.panels.screen === 'journal') this.panels.render(); }

  update(dt) {
    if (this.mode === 'loading' || this.mode === 'menu') return;
    this.hud.update(dt);
    this.hud.updateNotifications(dt);
    this.tickTypewriter(dt);
  }

  // ---------------------------------------------------------------- dialogue
  openDialogue(name, role) {
    this.dialogueEl.classList.add('open');
    this.dialogueEl.querySelector('#dlg-name').textContent = name.toUpperCase();
    this.dialogueEl.querySelector('#dlg-role').textContent = (role || '').toUpperCase();
    this.dialogueEl.querySelector('#dlg-portrait').textContent = name.split(' ').map((w) => w[0]).slice(0, 2).join('');
    this.mode = 'dialogue';
    this.game.locked = true;
    this.hud.setCrosshair(false);
  }

  showDialogue(state) {
    this.dialogueState = state;
    const t = this.dialogueEl.querySelector('#dlg-text');
    this.type = { full: state.text || '', shown: 0, t: 0, speed: 68, el: t, done: false };
    t.textContent = '';
    const box = this.dialogueEl.querySelector('#dlg-choices');
    box.innerHTML = (state.choices || []).map((c, i) =>
      `<div class="dlg-choice pe" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(c.text)}</span></div>`).join('');
    for (const ch of box.children) {
      ch.onclick = () => {
        if (!this.type.done) { this.skipTypewriter(); return; }
        this.game.npcs.choose(+ch.dataset.i);
      };
      ch.onmouseenter = () => { for (const o of box.children) o.classList.remove('hl'); ch.classList.add('hl'); };
    }
    this.dialogueEl.querySelector('#dlg-portrait').textContent = (state.speaker || '').split(' ').map((w) => w[0]).slice(0, 2).join('');
    this.dialogueEl.querySelector('#dlg-name').textContent = (state.speaker || '').toUpperCase();
    this.dialogueEl.querySelector('#dlg-role').textContent = (state.role || '').toUpperCase();
  }

  tickTypewriter(dt) {
    if (!this.type || this.type.done) return;
    const ty = this.type;
    ty.t += dt;
    const chars = Math.floor(ty.t * ty.speed);
    if (chars > ty.shown) {
      ty.shown = Math.min(chars, ty.full.length);
      ty.el.innerHTML = esc(ty.full.slice(0, ty.shown)) + (ty.shown < ty.full.length ? '<span class="dlg-caret"></span>' : '');
      if (ty.shown >= ty.full.length) ty.done = true;
    }
  }

  skipTypewriter() {
    if (!this.type) return;
    this.type.shown = this.type.full.length;
    this.type.done = true;
    this.type.el.innerHTML = esc(this.type.full);
  }

  closeDialogue() {
    this.dialogueEl.classList.remove('open');
    this.dialogueState = null;
    this.type = null;
    for (const ch of this.dialogueEl.querySelectorAll('.dlg-choice')) ch.onclick = null;
    this.mode = 'playing';
    this.game.locked = false;
    this.hud.setCrosshair(true);
  }

  // ---------------------------------------------------------------- shop
  openShop(npc, shop) {
    this.shopState = { npc, shop };
    this.shopEl.classList.add('open');
    this.mode = 'shop';
    this.game.locked = true;
    this.hud.setCrosshair(false);
    this.shopEl.querySelector('#shop-title').textContent = `TRADE · ${npc.def.name.toUpperCase()}`;
    this.renderShop();
  }

  closeShop() {
    this.shopEl.classList.remove('open');
    this.shopState = null;
    this.mode = 'playing';
    this.game.locked = false;
    this.hud.setCrosshair(true);
    if (this.game.npcs.dialogue) this.game.npcs.close();
  }

  refreshShop() { if (this.shopState) this.renderShop(); }

  renderShop() {
    const { npc, shop } = this.shopState;
    const g = this.game;
    const inv = g.inventory;
    this.shopEl.querySelector('#shop-gold').innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="7"/><path d="M9.5 9.5 H14.5 M9.5 14.5 H14.5 M12 7 V17"/></svg><b>${inv.gold}</b>`;
    const buy = Object.entries(shop.stock).filter(([, s]) => s.qty > 0).map(([id, s]) => {
      const def = ITEMS[id] || WEAPONS[id];
      const price = shop.priceOf(id);
      return `<div class="shop-row pe" data-buy="${id}">
        ${itemIcon(id, def, { size: 28 })}
        <div class="s-main"><div class="s-name">${esc(def?.name || id)}</div>
          <div class="s-qty">${s.qty} in stock · ${esc((def?.cat || 'item').toUpperCase())}</div></div>
        <div class="s-price">${price}</div></div>`;
    }).join('') || '<div class="empty-state">Sold out</div>';
    const sell = inv.items.map((it) => {
      const def = ITEMS[it.id] || WEAPONS[it.id];
      const price = shop.sellPrice(it.id) * it.qty;
      const isQuest = def?.cat === 'quest';
      return `<div class="shop-row pe" data-sell="${it.uid}" style="${isQuest ? 'opacity:.45' : ''}">
        ${itemIcon(it.id, def, { size: 28 })}
        <div class="s-main"><div class="s-name">${esc(def?.name || it.id)}${it.qty > 1 ? ' ×' + it.qty : ''}</div>
          <div class="s-qty">${isQuest ? 'NOT FOR SALE' : esc((def?.cat || 'item').toUpperCase())}</div></div>
        <div class="s-price">${isQuest ? '—' : price}</div></div>`;
    }).join('') || '<div class="empty-state">Your pack is empty</div>';
    this.shopEl.querySelector('#shop-buy').innerHTML = buy;
    this.shopEl.querySelector('#shop-sell').innerHTML = sell;
  }

  onShopClick(e) {
    if (!this.shopState) return;
    const b = e.target.closest('[data-buy]');
    const s = e.target.closest('[data-sell]');
    const qty = e.shiftKey ? 5 : 1;
    if (b) {
      if (this.shopState.shop.buy(b.dataset.buy, qty)) this.hud.toast('Purchased', '', 'good');
      this.renderShop();
    } else if (s) {
      const uid = +s.dataset.sell;
      const it = this.game.inventory.items.find((i) => i.uid === uid);
      const def = it ? (ITEMS[it.id] || WEAPONS[it.id]) : null;
      if (def?.cat === 'quest') { this.hud.notify('Refused', 'They will not buy something the Wardens are looking for.'); return; }
      if (e.shiftKey && it) {
        for (let i = 0; i < 5; i++) if (!this.shopState.shop.sell(uid)) break;
      } else this.shopState.shop.sell(uid);
      this.renderShop();
    }
  }

  // ---------------------------------------------------------------- tooltip
  showTooltip(x, y, html) {
    this.tooltipEl.innerHTML = html;
    this.tooltipEl.classList.add('on');
    this.moveTooltip(x, y);
  }

  moveTooltip(x, y) {
    const w = this.tooltipEl.offsetWidth || 220;
    const hh = this.tooltipEl.offsetHeight || 100;
    let px = x + 16, py = y + 12;
    if (px + w > window.innerWidth - 12) px = x - w - 16;
    if (py + hh > window.innerHeight - 12) py = window.innerHeight - hh - 12;
    this.tooltipEl.style.left = px + 'px';
    this.tooltipEl.style.top = py + 'px';
  }

  hideTooltip() { if (this.tooltipEl) this.tooltipEl.classList.remove('on'); }

  // ---------------------------------------------------------------- key routing
  handleKey(e) {
    const code = e.code;
    if (this.mode === 'loading') return true;
    if (this.mode === 'menu') {
      if (code === 'Escape') { this.hideMainMenu(); this.showMainMenu(this.game.hasSave()); }
      return true;
    }
    if (this.mode === 'dead') {
      if (code === 'Enter') { this.hideDeath(); this.game.respawnPlayer(); }
      return true;
    }
    if (this.dialogueState) {
      if (code === 'Escape') { this.game.npcs.close(); return true; }
      if (code === 'Space' || code === 'Enter') {
        if (this.type && !this.type.done) this.skipTypewriter();
        return true;
      }
      if (/^Digit[1-9]$/.test(code)) {
        const i = +code.slice(5) - 1;
        if (this.dialogueState.choices && this.dialogueState.choices[i]) {
          if (this.type && !this.type.done) this.skipTypewriter();
          else this.game.npcs.choose(i);
        }
        return true;
      }
      return true;
    }
    if (this.shopState) {
      if (code === 'Escape' || code === 'Tab') { this.closeShop(); return true; }
      return true;
    }
    if (this.panels.visible()) {
      if (code === 'Escape' || code === 'Tab') { this.panels.close(); return true; }
      if (code === 'KeyH' && this.panels.screen === 'inventory') { this.panels.swap('medical'); return true; }
      return true;
    }
    if (this.mode === 'paused') {
      if (code === 'Escape') { this.closePause(); return true; }
      return true;
    }
    // playing
    const map = {
      Tab: 'inventory', KeyI: 'inventory', KeyK: 'skills', KeyJ: 'journal', KeyM: 'map',
      KeyC: 'craft', KeyB: 'build', KeyH: 'medical', KeyN: 'notes',
    };
    if (map[code]) { this.panels.open(map[code]); return true; }
    if (code === 'Escape') { this.openPause(); return true; }
    return false;
  }

  applySettings() {
    const s = this.game.settings;
    if (this.game.audio) {
      this.game.audio.setVolume?.(s.master);
      this.game.audio.setMusicVolume?.(s.music);
    }
    this.hud?.root.classList.toggle('no-anim', false);
  }
}
