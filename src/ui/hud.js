// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// ui/hud.js — in-world heads-up display
// ============================================================
import { itemIcon, statusIcon, bodySvg, GLYPH } from './icons.js';
import { clamp } from '../core/util.js';

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const METERS = [
  { id: 'hunger', label: 'Food', icon: 'hunger', warn: 22, dir: 'low' },
  { id: 'thirst', label: 'Water', icon: 'thirst', warn: 22, dir: 'low' },
  { id: 'radiation', label: 'Rad', icon: 'radiation', warn: 35, dir: 'high' },
  { id: 'infection', label: 'Inf', icon: 'infection', warn: 30, dir: 'high' },
  { id: 'temp', label: 'Temp', icon: 'temp', warn: 0, dir: 'low', base: true },
  { id: 'fatigue', label: 'Fatigue', icon: 'fatigue', warn: 70, dir: 'high' },
  { id: 'stress', label: 'Stress', icon: 'stress', warn: 55, dir: 'high' },
];

export class HUD {
  constructor(game) {
    this.game = game;
    this.root = el('div', '');
    this.root.id = 'hud';
    this.promptText = null;
    this.boss = null;
    this.objective = null;
    this.noteTimers = [];
    this.lastVitals = {};
    this.build();
  }

  build() {
    const R = this.root;
    R.innerHTML = `
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>

      <div id="hud-top-left">
        <div class="lvl-row">
          <div class="lvl-badge"><b id="hud-level">1</b><span>LEVEL</span></div>
          <div class="lvl-meta">
            <div class="lvl-name" id="hud-name">SURVIVOR</div>
            <div class="xp-track"><i class="xp-fill" id="hud-xp"></i></div>
            <div class="xp-text mono" id="hud-xptext">0 / 120 XP</div>
          </div>
        </div>
        <div id="region-line">DEAD SUBURBS</div>
      </div>

      <div id="compass"><div id="compass-inner"></div><div id="compass-markers"></div><div id="compass-center"></div></div>

      <div id="hud-top-right">
        <div class="clock" id="hud-clock">06:00<small id="hud-day">DAY 1 · CLEAR</small></div>
        <div class="weather" id="hud-weather">OVERCAST<span class="temp" id="hud-temp">+4°C</span></div>
      </div>

      <div id="hud-vitals">
        <div class="health-block">
          <div class="body-mini">${bodySvg((id) => 'ok')}</div>
          <div class="meters">
            <div class="meter">
              <div class="meter-head"><span>Health</span><b class="mono" id="hud-hp">100</b></div>
              <div class="track"><i class="fill health" id="hud-hpbar"></i></div>
            </div>
            <div class="meter">
              <div class="meter-head"><span>Stamina</span><b class="mono" id="hud-st">100</b></div>
              <div class="track"><i class="fill stamina" id="hud-stbar"></i></div>
            </div>
          </div>
        </div>
        <div class="status-strip" id="hud-status"></div>
        <div class="bleed-warn" id="hud-bleed">${statusIcon('bleed', 12)} BLEEDING — USE A BANDAGE (H)</div>
      </div>

      <div id="hud-weapon">
        <div class="w-name" id="hud-wname">UNARMED<span class="w-mode" id="hud-wmode"></span></div>
        <div class="w-ammo"><b class="mono" id="hud-mag">—</b><i>/</i><span id="hud-reserve">—</span></div>
        <div class="w-sub" id="hud-wsub">NO WEAPON EQUIPPED</div>
        <div class="w-durab"><i id="hud-durab" style="width:100%"></i></div>
        <div id="quick-slots"></div>
      </div>

      <div id="crosshair"><i class="ch t"></i><i class="ch b"></i><i class="ch l"></i><i class="ch r"></i><i class="dot"></i></div>
      <div id="hitmark"><span></span><span></span><span></span><span></span></div>

      <div id="vignette"></div><div id="lowhealth"></div><div id="radiation-fx"></div>

      <div id="prompt"></div>
      <div id="objective">
        <div class="obj-head" id="obj-head">CURRENT OBJECTIVE</div>
        <div class="obj-title" id="obj-title"></div>
        <div class="obj-list" id="obj-list"></div>
      </div>
      <div id="notifications"></div>

      <div id="bossbar">
        <div class="boss-name" id="boss-name"></div>
        <div class="boss-phases" id="boss-phases"></div>
        <div class="boss-track"><i id="boss-fill" style="width:100%"></i></div>
        <div class="boss-tag" id="boss-tag"></div>
      </div>
    `;
    this.els = {};
    for (const id of ['hud-level', 'hud-name', 'hud-xp', 'hud-xptext', 'region-line', 'hud-clock', 'hud-day',
      'hud-weather', 'hud-temp', 'hud-hp', 'hud-hpbar', 'hud-st', 'hud-stbar', 'hud-status', 'hud-bleed',
      'hud-wname', 'hud-wmode', 'hud-mag', 'hud-reserve', 'hud-wsub', 'hud-durab', 'quick-slots', 'crosshair',
      'hitmark', 'vignette', 'lowhealth', 'radiation-fx', 'prompt', 'objective', 'obj-head', 'obj-title',
      'obj-list', 'notifications', 'bossbar', 'boss-name', 'boss-phases', 'boss-fill', 'boss-tag',
      'compass', 'compass-inner', 'compass-markers', 'hud-vitals']) {
      this.els[id] = this.root.querySelector('#' + id) || this.root.querySelector('.' + id);
    }
    // status chips
    this.els['hud-status'].innerHTML = METERS.map((m) =>
      `<div class="stat-chip" data-m="${m.id}">${statusIcon(m.icon, 11)}<b data-v="${m.id}">--</b></div>`).join('');
    this.chipEls = {};
    for (const c of this.els['hud-status'].children) this.chipEls[c.dataset.m] = c;
    this.chipVals = {};
    for (const k of Object.keys(this.chipEls)) this.chipVals[k] = this.chipEls[k].querySelector('b');

    this.bodyParts = {};
    for (const g of this.root.querySelectorAll('.body-mini .bp')) this.bodyParts[g.dataset.part] = g;

    // quick slots
    this.els['quick-slots'].innerHTML = [1, 2, 3, 4].map((i) =>
      `<div class="qslot" data-i="${i}"><span class="num">${i}</span><span class="cnt"></span></div>`).join('');
    this.qSlots = [...this.els['quick-slots'].children];

    this.buildCompass();
    this.crosshair = this.els['crosshair'];
    this.marker = this.els['hitmark'];
  }

  buildCompass() {
    // 3 copies of a 720-degree strip so it can scroll continuously
    const dirs = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    let html = '';
    for (let rep = -1; rep <= 1; rep++) {
      for (let deg = 0; deg < 360; deg += 10) {
        const card = dirs[deg];
        html += `<div class="cmp-tick ${card ? 'card ' + card.toLowerCase() : ''}" data-deg="${deg}">${card || (deg % 30 === 0 ? deg : '·')}</div>`;
      }
    }
    this.els['compass-inner'].innerHTML = html;
    this.cmpBase = this.els['compass-inner'].querySelectorAll('.cmp-tick').length / 3;
  }

  attach(parent) { parent.appendChild(this.root); }

  setVisible(v) { this.root.classList.toggle('hidden', !v); }

  // ---------------- frame update ----------------
  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p) return;
    const st = p.stats;

    // level / xp
    const lvl = g.level || 1;
    const xp = g.xp || 0;
    const need = g.xpToNext ? g.xpToNext(lvl) : 120;
    this.els['hud-level'].textContent = lvl;
    this.els['hud-xp'].style.width = clamp((xp / need) * 100, 0, 100) + '%';
    this.els['hud-xptext'].textContent = `${Math.floor(xp)} / ${need} XP`;
    const reg = g.world.regionAt(p.pos.x, p.pos.z);
    this.els['region-line'].textContent = (reg?.name || reg?.id || 'ASHES').toString().toUpperCase();

    // health / stamina
    const hpPct = clamp(st.health / st.healthMax, 0, 1);
    this.els['hud-hp'].textContent = Math.ceil(st.health);
    this.els['hud-hpbar'].style.width = hpPct * 100 + '%';
    this.els['hud-hpbar'].classList.toggle('low', hpPct < 0.3);
    const stPct = clamp(p.stamina / (p.staminaMax || 100), 0, 1);
    this.els['hud-st'].textContent = Math.round(p.stamina);
    this.els['hud-stbar'].style.width = stPct * 100 + '%';
    this.els['hud-stbar'].classList.toggle('low', stPct < 0.2);

    // status chips
    for (const m of METERS) {
      const v = m.base ? st[m.id] : st[m.id];
      const node = this.chipVals[m.id];
      if (!node) continue;
      let txt;
      if (m.id === 'temp') txt = Math.round(v) + '°';
      else if (m.id === 'radiation' || m.id === 'infection') txt = Math.round(v);
      else if (m.id === 'fatigue') txt = Math.round(v);
      else txt = Math.round(v);
      if (this.lastVitals[m.id] !== txt) { node.textContent = txt; this.lastVitals[m.id] = txt; }
      const warn = m.dir === 'high' ? v >= m.warn : v <= m.warn;
      const chip = this.chipEls[m.id];
      chip.classList.toggle('warn', warn && m.warn > 0);
      if (m.id === 'temp') chip.classList.toggle('cold', v < 35);
    }

    // body damage map
    if (g.body) {
      for (const [part, node] of Object.entries(this.bodyParts)) {
        const cond = g.body.partCondition(part);
        node.classList.remove('ok', 'hurt', 'crit');
        node.classList.add(cond > 66 ? 'ok' : cond > 33 ? 'hurt' : 'crit');
      }
    }

    // bleed warning
    this.els['hud-bleed'].classList.toggle('on', st.bleed > 1);

    // screenshot-ish overlays
    const lowHp = hpPct < 0.35;
    this.els['lowhealth'].style.opacity = lowHp ? (0.55 + Math.sin(performance.now() / 340) * 0.2) : 0;
    this.els['radiation-fx'].style.opacity = clamp(st.radiation / 130, 0, 0.9);

    // weapon
    this.updateWeapon();

    // quick slots
    this.updateQuickSlots();

    // clock / weather
    const sky = g.sky;
    if (sky) {
      const hh = Math.floor((sky.hour ?? 6) % 24);
      const mm = Math.floor(((sky.hour ?? 6) % 1) * 60);
      this.els['hud-clock'].firstChild.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
      this.els['hud-day'].textContent = `DAY ${g.day || 1} · ${(sky.weather || 'clear').replace(/_/g, ' ').toUpperCase()}`;
      this.els['hud-weather'].firstChild.textContent = (sky.weather || 'clear').replace(/_/g, ' ').toUpperCase();
      this.els['hud-temp'].textContent = Math.round(st.temp - 20) + '°C';
    }

    // compass
    this.updateCompass(p);

    // objective tracker
    this.updateObjective();
  }

  updateCompass(p) {
    const yaw = p.yaw;
    // heading: 0 = north (-Z)
    let heading = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
    const width = this.els['compass'].clientWidth || 420;
    const pxPerDeg = width / 150; // visible ~150 degrees
    const offset = width / 2 - heading * pxPerDeg;
    this.els['compass-inner'].style.transform = `translateX(${offset - this.cmpBase * 44}px)`;
    // markers for nearby points of interest
    let mh = '';
    const pois = this.game.world.pois || [];
    for (const poi of pois) {
      if (!poi.discovered) continue;
      const dx = poi.x - p.pos.x, dz = poi.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 360) continue;
      let ang = Math.atan2(dx, -dz) * 180 / Math.PI;
      let rel = ((ang - heading + 540) % 360) - 180;
      if (Math.abs(rel) > 62) continue;
      const x = width / 2 + rel * pxPerDeg;
      mh += `<div class="cmp-marker" style="left:${x}px"><div class="dot"></div></div>`;
    }
    this.els['compass-markers'].innerHTML = mh;
  }

  updateWeapon() {
    const g = this.game;
    const w = g.weapons;
    const id = w?.current;
    const def = (id && (g.itemDef(id) || w.def)) || null;
    if (!id || !def) {
      if (this.els['hud-wname'].dataset.k !== 'none') {
        this.els['hud-wname'].firstChild.textContent = 'UNARMED';
        this.els['hud-wmode'].textContent = '';
        this.els['hud-mag'].textContent = '—';
        this.els['hud-reserve'].textContent = '—';
        this.els['hud-wsub'].textContent = 'NO WEAPON EQUIPPED';
        this.els['hud-durab'].style.width = '0%';
        this.els['hud-wname'].dataset.k = 'none';
      }
      return;
    }
    const st = w.state || {};
    const isMelee = def.type === 'melee' || def.type === 'bow';
    const key = id + ':' + (st.mag ?? 0) + ':' + (st.durability ?? 1) + ':' + (st.reserve || 0) + ':' + (st.reloading ? 1 : 0);
    if (this.els['hud-wname'].dataset.k === key) return;
    this.els['hud-wname'].dataset.k = key;
    this.els['hud-wname'].firstChild.textContent = (def.name || id).toUpperCase();
    const mode = isMelee ? (def.type === 'bow' ? 'BOW' : 'MELEE')
      : ((def.auto ? 'AUTO' : 'SEMI')).toUpperCase();
    this.els['hud-wmode'].textContent = st.reloading ? 'RELOADING' : mode;
    if (isMelee) {
      this.els['hud-mag'].textContent = '—';
      this.els['hud-reserve'].textContent = '—';
      this.els['hud-wsub'].textContent = def.type === 'bow'
        ? `${def.dmg} DMG · ${g.inventory.countAmmo(def.reserveType)} BOLTS`
        : `MELEE · ${def.dmg} DMG`;
    } else {
      const mag = st.mag ?? 0;
      this.els['hud-mag'].textContent = mag;
      this.els['hud-mag'].classList.toggle('empty', mag === 0);
      this.els['hud-reserve'].textContent = st.reserve ?? 0;
      this.els['hud-wsub'].textContent = `${def.dmg} DMG · ${def.range}M RANGE`;
    }
    const dur = clamp((st.durability ?? 1) * 100, 0, 100);
    this.els['hud-durab'].style.width = dur + '%';
    this.els['hud-durab'].style.background = dur < 25 ? 'var(--red)' : dur < 55 ? '#c9a05a' : 'var(--green)';
  }

  updateQuickSlots() {
    const g = this.game;
    const slots = g.inventory.quickSlots || [];
    for (let i = 0; i < 4; i++) {
      const node = this.qSlots[i];
      const id = slots[i];
      if (!id) { node.innerHTML = `<span class="num">${i + 1}</span>`; node.classList.remove('active'); continue; }
      const def = g.itemDef(id);
      const count = g.inventory.count(id);
      node.innerHTML = `<span class="num">${i + 1}</span>${itemIcon(id, def, { size: 24 })}${count > 1 ? `<span class="cnt">${count}</span>` : ''}`;
      node.classList.toggle('active', g.weapons?.current?.id === id || g.selectedQuick === i);
    }
  }

  updateObjective() {
    const list = this.game.objectives || [];
    if (!list.length) { this.els['objective'].classList.remove('on'); return; }
    this.els['objective'].classList.add('on');
    const q = this.game.quests.trackedQuest();
    this.els['obj-head'].textContent = q ? (q.act ? `ACT ${q.act} · ${q.name}` : q.name) : 'OBJECTIVES';
    this.els['obj-title'].textContent = q ? (q.objectives[0]?.desc || '') : '';
    this.els['obj-title'].style.display = q ? 'none' : 'block';
    const sig = list.map((o) => o.text + o.done + o.cur).join('|');
    if (sig === this._objSig) return;
    this._objSig = sig;
    this.els['obj-list'].innerHTML = list.map((o) =>
      `<div class="${o.done ? 'done' : ''}">${o.text}${o.max > 1 ? `<span class="obj-count">${o.cur}/${o.max}</span>` : ''}</div>`).join('');
  }

  // ---------------- events ----------------
  notify(title, text = '', color = null, kind = '') {
    // suppress identical back-to-back notes (world discovery can fire twice)
    const sig = title + '|' + text;
    const now = performance.now();
    this._noteSigs = this._noteSigs || new Map();
    const prev = this._noteSigs.get(sig);
    if (prev && now - prev < 1200) return null;
    this._noteSigs.set(sig, now);
    if (this._noteSigs.size > 24) this._noteSigs.clear();
    const n = el('div', 'note ' + kind);
    n.innerHTML = `<div class="n-title" style="${color ? 'color:' + color : ''}">${title}</div>${text ? `<div class="n-text">${text}</div>` : ''}`;
    const col = this.els['notifications'];
    col.appendChild(n);
    // never let the stack cover the weapon panel / dialogue: keep the three
    // newest cards and fade the rest out immediately
    while (col.children.length > 3) {
      const old = col.firstElementChild;
      old.remove();
      this.noteTimers = this.noteTimers.filter((e) => e.node !== old);
      if (!old) break;
    }
    const entry = { node: n, t: 0, life: kind === 'quest' ? 5.2 : 3.6 };
    this.noteTimers.push(entry);
    while (this.noteTimers.length > 4) {
      const old = this.noteTimers.shift();
      old.node.remove();
    }
    return n;
  }

  notifyQuest(title, text) { return this.notify(title, text, null, 'quest'); }

  toast(title, text, kind) { return this.notify(title, text, null, kind); }

  updateNotifications(dt) {
    for (let i = this.noteTimers.length - 1; i >= 0; i--) {
      const e = this.noteTimers[i];
      e.t += dt;
      if (e.t > e.life) e.node.classList.add('fade');
      if (e.t > e.life + 0.5) { e.node.remove(); this.noteTimers.splice(i, 1); }
    }
  }

  setPrompt(text) {
    this.promptText = text;
    if (!text) { this.els['prompt'].classList.remove('on'); return; }
    const m = text.match(/^\[([A-Z])\]\s*(.*)$/);
    this.els['prompt'].innerHTML = m ? `<b>${m[1]}</b> &nbsp;${m[2]}` : text;
    this.els['prompt'].classList.add('on');
  }

  promptVisible() { return this.els['prompt'].classList.contains('on'); }

  hitMarker(kill = false) {
    const n = this.marker;
    n.classList.remove('show', 'kill');
    void n.offsetWidth;
    n.classList.toggle('kill', !!kill);
    n.classList.add('show');
  }

  flashDamage(severity = 1) {
    const v = this.els['vignette'];
    v.style.opacity = clamp(0.35 + severity * 0.4, 0, 1);
    clearTimeout(this._vT);
    this._vT = setTimeout(() => { v.style.opacity = 0; }, 220);
  }

  showBoss(name, phase, totalPhases, tag = '') {
    const b = this.els['bossbar'];
    b.classList.add('on');
    this.els['boss-name'].textContent = name;
    this.els['boss-tag'].textContent = tag;
    let ph = '';
    for (let i = 0; i < totalPhases; i++) ph += `<i class="${i < phase ? 'on' : ''}"></i>`;
    this.els['boss-phases'].innerHTML = ph;
  }

  setBossHP(frac) { this.els['boss-fill'].style.width = clamp(frac, 0, 1) * 100 + '%'; }
  hideBoss() { this.els['bossbar'].classList.remove('on'); }

  setCrosshair(v) { this.crosshair.classList.toggle('hidden', !v); }

  setSpread(px) {
    const ch = this.root.querySelectorAll('#crosshair .ch');
    if (!ch.length) return;
    ch[0].style.top = -px + 'px';
    ch[1].style.bottom = -px + 'px';
    ch[2].style.left = -px + 'px';
    ch[3].style.right = -px + 'px';
  }
}
