/**
 * In-game HUD: vitals, weapon readout, compass, minimap, objective tracker,
 * notifications, boss bar, region cards, interaction prompts and death screen.
 * Pure DOM/CSS so it stays crisp and costs no draw calls.
 */
import { uiIcon, itemIcon } from './icons.js';
import { clamp, clamp01 } from '../engine/util.js';

const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const COMPASS_POINTS = [
  { a: 0, l: 'N' }, { a: 45, l: 'NE' }, { a: 90, l: 'E' }, { a: 135, l: 'SE' },
  { a: 180, l: 'S' }, { a: 225, l: 'SW' }, { a: 270, l: 'W' }, { a: 315, l: 'NW' },
];

export class HUD {
  constructor(game, root) {
    this.game = game;
    this.root = root;
    this.visible = true;
    this.notices = [];
    this.boss = null;
    this.bossTimer = 0;
    this.regionTimer = 0;
    this.damageTimer = 0;
    this.hitTimer = 0;
    this.build();
  }

  build() {
    const hud = el('div', 'hud');
    this.el = hud;
    this.root.appendChild(hud);

    // ---- top left: region, clock, objective
    const tl = el('div', 'top-left');
    tl.innerHTML = `
      <div class="region-line"><span class="region-name" id="hud-region">ROADSIDE</span><span class="region-sub" id="hud-act">ACT I</span></div>
      <div class="clock-line"><span id="hud-clock">09:24</span><span id="hud-weather">OVERCAST</span><span id="hud-temp">6 C</span></div>
      <div class="objective" id="hud-objective" style="display:none">
        <div class="otitle" id="hud-obj-title"></div>
        <div class="odesc" id="hud-obj-desc"></div>
        <div class="ocount" id="hud-obj-count"></div>
      </div>`;
    hud.appendChild(tl);
    this.elRegion = tl.querySelector('#hud-region');
    this.elAct = tl.querySelector('#hud-act');
    this.elClock = tl.querySelector('#hud-clock');
    this.elWeather = tl.querySelector('#hud-weather');
    this.elTemp = tl.querySelector('#hud-temp');
    this.elObjective = tl.querySelector('#hud-objective');
    this.elObjTitle = tl.querySelector('#hud-obj-title');
    this.elObjDesc = tl.querySelector('#hud-obj-desc');
    this.elObjCount = tl.querySelector('#hud-obj-count');

    // ---- top right: compass + minimap
    const tr = el('div', 'top-right');
    const compass = el('div', 'compass');
    compass.innerHTML = '<div class="tape"></div><div class="center"></div>';
    tr.appendChild(compass);
    const mm = el('div', 'minimap');
    const mmCanvas = el('canvas');
    mmCanvas.width = 356;
    mmCanvas.height = 356;
    mm.appendChild(mmCanvas);
    mm.appendChild(el('div', 'mm-label', 'SECTOR MAP'));
    mm.appendChild(el('div', 'mm-n', 'N'));
    tr.appendChild(mm);
    hud.appendChild(tr);
    this.elCompass = compass;
    this.elTape = compass.querySelector('.tape');
    this.mmCanvas = mmCanvas;
    this.mmCtx = mmCanvas.getContext('2d');
    this.mmData = null;
    this._compassCache = '';

    // ---- vitals
    const vitals = el('div', 'vitals');
    const bar = (cls, icon, id) => `
      <div class="vital ${cls}">
        <span class="ic" title="">${uiIcon(icon, 15)}</span>
        <span class="track"><span class="fill" id="${id}-fill"></span></span>
        <span class="num" id="${id}-num">100</span>
      </div>`;
    vitals.innerHTML = bar('hp', 'heart', 'hp') + bar('st', 'boltEnergy', 'st') + bar('hu', 'food', 'hu') + bar('th', 'drop', 'th') + bar('rad', 'radiation', 'rad') +
      '<div class="status-row" id="hud-status"></div>';
    hud.appendChild(vitals);
    this.elHpFill = vitals.querySelector('#hp-fill');
    this.elHpNum = vitals.querySelector('#hp-num');
    this.elStFill = vitals.querySelector('#st-fill');
    this.elStNum = vitals.querySelector('#st-num');
    this.elHuFill = vitals.querySelector('#hu-fill');
    this.elHuNum = vitals.querySelector('#hu-num');
    this.elThFill = vitals.querySelector('#th-fill');
    this.elThNum = vitals.querySelector('#th-num');
    this.elRadFill = vitals.querySelector('#rad-fill');
    this.elRadNum = vitals.querySelector('#rad-num');
    this.elStatus = vitals.querySelector('#hud-status');
    this.vitalsEl = vitals;

    // ---- weapon
    const wp = el('div', 'weapon-panel');
    wp.innerHTML = `
      <div class="wname" id="hud-wname">UNARMED</div>
      <div class="wclass" id="hud-wclass">MELEE</div>
      <div class="ammo" id="hud-ammo">-</div>
      <div class="reload-bar"><div id="hud-reload"></div></div>
      <div class="attachments" id="hud-attach"></div>`;
    hud.appendChild(wp);
    this.elWName = wp.querySelector('#hud-wname');
    this.elWClass = wp.querySelector('#hud-wclass');
    this.elAmmo = wp.querySelector('#hud-ammo');
    this.elReload = wp.querySelector('#hud-reload');
    this.elAttach = wp.querySelector('#hud-attach');

    // ---- crosshair, hitmark, interact
    const ch = el('div', 'crosshair');
    ch.innerHTML = '<div class="ch-line h" style="left:2px"></div><div class="ch-line h" style="right:2px"></div><div class="ch-line v" style="top:2px"></div><div class="ch-line v" style="bottom:2px"></div><div class="dot"></div>';
    hud.appendChild(ch);
    this.elCross = ch;
    const hit = el('div', 'hitmark');
    hud.appendChild(hit);
    this.elHit = hit;
    const inter = el('div', 'interact');
    hud.appendChild(inter);
    this.elInteract = inter;

    // ---- notices
    const notices = el('div', 'notices');
    hud.appendChild(notices);
    this.elNotices = notices;

    // ---- boss bar
    const boss = el('div', 'boss-bar');
    boss.innerHTML = '<div class="bname"></div><div class="benv"></div><div class="btrack"><div class="bfill"></div></div>';
    hud.appendChild(boss);
    this.elBoss = boss;
    this.elBossName = boss.querySelector('.bname');
    this.elBossEnv = boss.querySelector('.benv');
    this.elBossFill = boss.querySelector('.bfill');
    this.elBossTrack = boss.querySelector('.btrack');

    // ---- region card
    const rc = el('div', 'region-card');
    rc.innerHTML = '<div class="rc-kicker">ENTERING</div><div class="rc-name"></div><div class="rc-line"></div><div class="rc-sub"></div>';
    hud.appendChild(rc);
    this.elRegionCard = rc;

    // ---- xp + toast stack + damage + build hint
    this.elXp = el('div', 'xp-toast');
    hud.appendChild(this.elXp);
    const xpbar = el('div', 'xp-bar');
    xpbar.innerHTML = '<div></div>';
    hud.appendChild(xpbar);
    this.elXpFill = xpbar.firstChild;
    this.toastStack = el('div', 'toast-stack');
    hud.appendChild(this.toastStack);
    this.elDamage = el('div', 'damage-fx');
    hud.appendChild(this.elDamage);
    this.elBuildHint = el('div', 'build-hint');
    this.elBuildHint.innerHTML = '<div class="bh-name"></div><div class="bh-cost"></div><div class="bh-err"></div>';
    hud.appendChild(this.elBuildHint);

    // ---- death screen (outside hud dimming)
    const death = el('div', 'death-screen');
    death.innerHTML = `
      <div>
        <div class="ds-title">YOU DIED</div>
        <div class="ds-sub">The signal continues without you.</div>
        <div class="ds-stats" id="death-stats"></div>
        <div class="btn-row" style="justify-content:center;margin-top:26px">
          <button class="btn primary" id="death-respawn">RESPAWN AT LAST SHELTER</button>
          <button class="btn" id="death-menu">MAIN MENU</button>
        </div>
      </div>`;
    this.root.appendChild(death);
    this.elDeath = death;
    this.elDeathStats = death.querySelector('#death-stats');
    death.querySelector('#death-respawn').addEventListener('click', () => this.game.respawnPlayer?.());
    death.querySelector('#death-menu').addEventListener('click', () => this.game.toMainMenu?.());
  }

  setVisible(v) {
    this.visible = v;
    this.el.classList.toggle('hidden', !v);
  }

  // ------------------------------------------------------------------ vitals
  updateVitals(p) {
    const set = (fill, num, val, max) => {
      const f = clamp01(val / (max || 1));
      fill.style.width = `${(f * 100).toFixed(1)}%`;
      num.textContent = `${Math.ceil(val)}`;
    };
    set(this.elHpFill, this.elHpNum, p.health, p.healthMax);
    set(this.elStFill, this.elStNum, p.stamina, p.staminaMax);
    set(this.elHuFill, this.elHuNum, p.hunger, 100);
    set(this.elThFill, this.elThNum, p.thirst, 100);
    set(this.elRadFill, this.elRadNum, p.radiation || 0, 100);
    this.elHpFill.parentElement.parentElement.classList.toggle('warn', p.health < p.healthMax * 0.3);
    this.elThFill.parentElement.parentElement.classList.toggle('warn', p.thirst < 18);
    this.elHuFill.parentElement.parentElement.classList.toggle('warn', p.hunger < 18);

    const effects = this.game.survival?.statusEffects || [];
    const sig = effects.map((e) => `${e.label}:${e.severity}`).join('|');
    if (sig !== this._statusSig) {
      this._statusSig = sig;
      this.elStatus.innerHTML = effects.map((e) =>
        `<span class="status-chip ${e.severity > 1 ? 'bad' : ''}">${uiIcon(e.icon || 'wound', 10)} ${e.label}</span>`).join('');
    }
  }

  /** Compatibility entry points used by systems written against the HUD contract. */
  setWeapon(nameOrStats, item) {
    // Systems call this either with (statsObject, itemDef) or with plain strings.
    if (nameOrStats && typeof nameOrStats === 'object') {
      const stats = nameOrStats;
      const def = item || stats.def || {};
      const c = this.game.combat;
      this.elWName.textContent = String(def.name || stats.name || 'WEAPON').toUpperCase();
      this.elWClass.textContent = String(
        (def.weapon || stats.weapon || c?.weaponClassLabel || 'weapon')
      ).toUpperCase();
      const reserve = def.ammo ? this.game.inventory.countAmmo(def.ammo) : null;
      if (reserve !== null) {
        this.elAmmo.innerHTML = `${c?.magazine ?? 0}<span class="reserve">/ ${reserve}</span>`;
      } else {
        this.elAmmo.textContent = 'MELEE';
      }
      return;
    }
    if (nameOrStats !== undefined) this.elWName.textContent = String(nameOrStats).toUpperCase();
    if (item !== undefined) this.elWClass.textContent = String(item).toUpperCase();
  }

  crosshairKick(amount = 1) {
    this.elCross.style.transform = `translate(-50%, -50%) scale(${1 + Math.min(0.35, amount * 0.12)})`;
    clearTimeout(this._kickTimer);
    this._kickTimer = setTimeout(() => {
      const s = this.game.settings?.crosshairScale ?? 1;
      this.elCross.style.transform = `translate(-50%, -50%) scale(${s})`;
    }, 90);
  }

  notifySlot(text) {
    this.notify(text, 'info', 'HOTBAR');
  }

  updateWeapon() {
    const c = this.game.combat;
    const inv = this.game.inventory;
    const item = c?.currentItem;
    const stats = c?.currentStats;
    if (!item || !stats || !stats.name) {
      this.elWName.textContent = 'UNARMED';
      this.elWClass.textContent = 'MELEE';
      this.elAmmo.textContent = '-';
      this.elAttach.textContent = '';
      return;
    }
    this.elWName.textContent = String(stats.name).toUpperCase();
    this.elWClass.textContent = String(stats.class || 'melee').toUpperCase();
    const ammoType = stats.melee ? null : stats.ammo;
    if (ammoType) {
      const reserve = inv.countAmmo(ammoType);
      this.elAmmo.innerHTML = `${item.magazine ?? 0}<span class="reserve">/ ${reserve}</span>`;
      this.elAmmo.classList.toggle('empty', (item.magazine ?? 0) === 0);
    } else {
      this.elAmmo.textContent = 'MELEE';
      this.elAmmo.classList.remove('empty');
    }
    const at = (item.attachments || []).map((a) => String(a.id || a).toUpperCase());
    this.elAttach.textContent = at.length ? at.join(' / ') : '';
    this.elReload.style.width = `${(c.reloadProgress || 0) * 100}%`;
  }


  // ---------------------------------------------------------------- compass
  updateCompass(player, markers) {
    const yaw = player.yaw;
    const heading = ((-yaw * 180) / Math.PI + 360) % 360;
    let html = '';
    for (const p of COMPASS_POINTS) {
      let d = p.a - heading;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) > 78) continue;
      const x = 50 + (d / 78) * 50;
      html += `<div class="lbl" style="left:${x}%">${p.l}</div>`;
    }
    for (let a = 0; a < 360; a += 15) {
      let d = a - heading;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) > 78) continue;
      const x = 50 + (d / 78) * 50;
      html += `<div class="tick" style="left:${x}%"></div>`;
    }
    for (const m of markers || []) {
      let d = m.bearing - heading;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) > 78) continue;
      const x = 50 + (d / 78) * 50;
      html += `<div class="marker" style="left:${x}%"></div>`;
    }
    if (html !== this._compassCache) {
      this._compassCache = html;
      this.elTape.innerHTML = html;
    }
  }

  // ---------------------------------------------------------------- minimap
  setMinimapBitmap(canvas) {
    this.mmData = canvas;
    this.mmBitmap = canvas.getContext ? canvas : null;
  }

  drawMinimap(player, world, markers) {
    const ctx = this.mmCtx;
    const size = this.mmCanvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0a0e0f';
    ctx.fillRect(0, 0, size, size);
    const span = 340; // metres across
    const cx = size / 2;
    const cy = size / 2;
    // terrain relief
    if (world && world.terrain) {
      const step = 8;
      for (let py = 0; py < size; py += step) {
        for (let px = 0; px < size; px += step) {
          const wx = player.position.x + ((px - cx) / size) * span;
          const wz = player.position.z + ((py - cy) / size) * span;
          const h = world.terrain.heightAt(wx, wz);
          const region = world.regionAt(wx, wz);
          const shade = clamp(90 + h * 4, 26, 150);
          let r = shade, g = shade * 0.97, b = shade * 0.9;
          if (region === 1) { r *= 0.62; g *= 0.86; b *= 0.6; }
          else if (region === 5) { r *= 1.18; g *= 0.72; b *= 0.62; }
          else if (region === 3) { r *= 0.9; g *= 0.94; b *= 1.02; }
          const ri = world.terrain.roadInfo(wx, wz);
          if (ri.dist < ri.width) { r = g = b = 150; }
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
          ctx.fillRect(px, py, step, step);
        }
      }
      // structures
      ctx.globalAlpha = 0.9;
      for (const loc of world.locations) {
        const d = Math.hypot(loc.x - player.position.x, loc.z - player.position.z);
        if (d > span * 0.7) continue;
        const px = cx + ((loc.x - player.position.x) / span) * size;
        const py = cy + ((loc.z - player.position.z) / span) * size;
        ctx.fillStyle = '#9aa8a2';
        const s = loc.type === 'camp' || loc.type === 'shelter' ? 3 : 2;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    // player arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-player.yaw);
    ctx.fillStyle = '#e8e2ce';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // markers
    for (const m of markers || []) {
      const d = m.distance;
      let px = cx + ((m.x - player.position.x) / span) * size;
      let py = cy + ((m.z - player.position.z) / span) * size;
      let edge = false;
      if (d > span * 0.5) {
        const a = Math.atan2(m.z - player.position.z, m.x - player.position.x);
        const r = size * 0.46;
        px = cx + Math.cos(a) * r;
        py = cy + Math.sin(a) * r;
        edge = true;
      }
      ctx.fillStyle = m.color || '#c9a227';
      if (edge) {
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px + 4, py);
        ctx.lineTo(px, py + 5);
        ctx.lineTo(px - 4, py);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ------------------------------------------------------------- objectives
  setObjective(title, desc, count) {
    if (!title) {
      this.elObjective.style.display = 'none';
      return;
    }
    this.elObjective.style.display = 'block';
    this.elObjTitle.textContent = title;
    this.elObjDesc.textContent = desc || '';
    this.elObjCount.textContent = count || '';
  }

  setRegion(name, act, weather, tempC) {
    if (name) this.elRegion.textContent = name.toUpperCase();
    if (act !== undefined) this.elAct.textContent = act;
    if (weather) this.elWeather.textContent = weather.toUpperCase();
    if (tempC !== undefined) this.elTemp.textContent = `${Math.round(tempC)} C`;
  }

  setClock(hours) {
    const h = Math.floor(hours) % 24;
    const m = Math.floor((hours % 1) * 60);
    this.elClock.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  showInteract(label, sub) {
    this.elInteract.innerHTML = `<span class="key">E</span><span class="lbl">${label}</span>${sub ? `<span class="sub">${sub}</span>` : ''}`;
    this.elInteract.classList.add('show');
  }

  hideInteract() {
    this.elInteract.classList.remove('show');
  }

  setCrosshairVisible(v) {
    this.elCross.classList.toggle('hidden', !v);
  }

  // ----------------------------------------------------------- notifications
  notify(text, kind = 'info', title = null) {
    const n = el('div', `notice ${kind}`);
    const head = title || (kind === 'quest' ? 'OBJECTIVE' : kind === 'item' ? 'ACQUIRED' : kind === 'danger' ? 'WARNING' : 'LOG');
    n.innerHTML = `<span class="ntitle">${head}</span><span class="nmeta">${text}</span>`;
    this.elNotices.appendChild(n);
    this.notices.push({ node: n, t: 5.5 });
    while (this.notices.length > 6) {
      const old = this.notices.shift();
      old.node.remove();
    }
  }

  questToast(text, title) {
    this.notify(text, 'quest', title);
  }

  questProgress(qid, index, count, total) {
    const q = this.game.quests?.active.get(qid);
    if (!q) return;
    const hint = q.def.objectives[index]?.hint || '';
    this.notify(`${hint} (${count}/${total})`, 'quest', 'OBJECTIVE');
  }

  questComplete(title, xp) {
    const t = el('div', 'big-toast', `CONTRACT COMPLETE - ${title}${xp ? `  +${xp} XP` : ''}`);
    this.toastStack.appendChild(t);
    setTimeout(() => t.remove(), 3600);
    this.notify(title, 'quest', 'COMPLETED');
  }

  addXp(amount, level) {
    this.elXp.textContent = `+${amount} XP${level ? `   LEVEL ${level}` : ''}`;
    this.elXp.classList.add('show');
    clearTimeout(this._xpTimer);
    this._xpTimer = setTimeout(() => this.elXp.classList.remove('show'), 2200);
  }

  setXpProgress(p) {
    this.elXpFill.style.width = `${clamp01(p) * 100}%`;
  }

  showBoss(name, env = '') {
    if (name && typeof name === 'object') {
      const b = name;
      name = b.name || b.id || 'APEX PREDATOR';
      env = b.enemyDef?.name && b.enemyDef.name !== name ? b.enemyDef.name : (b.def?.description || '');
      this.bossRef = b;
    }
    this.boss = { name, env };
    this.elBossName.textContent = name.toUpperCase();
    this.elBossEnv.textContent = env.toUpperCase();
    this.elBoss.classList.add('show');
    this.bossTimer = 0;
  }

  updateBossHealth(fraction, phases = []) {
    if (!this.boss) return;
    this.elBossFill.style.width = `${clamp01(fraction) * 100}%`;
    const marks = this.elBossTrack.querySelectorAll('.bphase');
    if (marks.length !== phases.length) {
      marks.forEach((m) => m.remove());
      for (const p of phases) {
        const d = el('div', 'bphase');
        d.style.left = `${p * 100}%`;
        this.elBossTrack.appendChild(d);
      }
    }
  }

  hideBoss() {
    this.boss = null;
    setTimeout(() => this.elBoss.classList.remove('show'), 400);
  }

  hitmarker(kill = false) {
    this.elHit.classList.remove('show');
    void this.elHit.offsetWidth;
    this.elHit.style.filter = kill ? 'brightness(1.6) sepia(1) saturate(6)' : '';
    this.elHit.classList.add('show');
  }

  flashDamage(amount = 1) {
    this.elDamage.classList.add('flash');
    this.damageTimer = 0.12 + Math.min(0.3, amount * 0.02);
  }

  regionCard(name, kicker = 'ENTERING', sub = '') {
    this.elRegionCard.querySelector('.rc-kicker').textContent = kicker;
    this.elRegionCard.querySelector('.rc-name').textContent = name;
    this.elRegionCard.querySelector('.rc-sub').textContent = sub;
    this.elRegionCard.classList.add('show');
    this.regionTimer = 4.5;
  }

  showBuildHint(name, costText, errorText) {
    this.elBuildHint.classList.add('show');
    this.elBuildHint.querySelector('.bh-name').textContent = name || '';
    this.elBuildHint.querySelector('.bh-cost').textContent = costText || '';
    this.elBuildHint.querySelector('.bh-err').textContent = errorText || '';
  }

  hideBuildHint() {
    this.elBuildHint.classList.remove('show');
  }

  showDeath(stats) {
    this.elDeathStats.innerHTML = stats.map((s) => `<div><b>${s.value}</b><span>${s.label}</span></div>`).join('');
    this.elDeath.classList.add('show');
    this.setVisible(false);
  }

  hideDeath() {
    this.elDeath.classList.remove('show');
    this.setVisible(true);
  }

  // ------------------------------------------------------------------ frame
  update(dt) {
    if (this.damageTimer > 0) {
      this.damageTimer -= dt;
      if (this.damageTimer <= 0) this.elDamage.classList.remove('flash');
    }
    if (this.regionTimer > 0) {
      this.regionTimer -= dt;
      if (this.regionTimer <= 0) this.elRegionCard.classList.remove('show');
    }
    for (let i = this.notices.length - 1; i >= 0; i--) {
      const n = this.notices[i];
      n.t -= dt;
      if (n.t <= 0) {
        n.node.remove();
        this.notices.splice(i, 1);
      } else if (n.t < 0.6) {
        n.node.style.opacity = String(n.t / 0.6);
      }
    }
  }
}
