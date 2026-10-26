// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/body.js — per-limb condition, bleeding, fractures,
//                infection and the medical treatment model
// ============================================================
import { clamp, lerp } from '../core/util.js';

export const PARTS = ['head', 'torso', 'armL', 'armR', 'legL', 'legR'];

export const PART_LABEL = {
  head: 'Head', torso: 'Torso', armL: 'Left Arm', armR: 'Right Arm', legL: 'Left Leg', legR: 'Right Leg',
};

const GROUP_TO_PART = (group, rng) => {
  if (!group) return 'torso';
  if (group === 'arms') return rng() < 0.5 ? 'armL' : 'armR';
  if (group === 'legs') return rng() < 0.5 ? 'legL' : 'legR';
  if (PARTS.includes(group)) return group;
  return 'torso';
};

export class Body {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.condition = { head: 100, torso: 100, armL: 100, armR: 100, legL: 100, legR: 100 };
    this.wounds = {
      head: { bleed: 0, fracture: false, infection: 0 },
      torso: { bleed: 0, fracture: false, infection: 0 },
      armL: { bleed: 0, fracture: false, infection: 0 },
      armR: { bleed: 0, fracture: false, infection: 0 },
      legL: { bleed: 0, fracture: false, infection: 0 },
      legR: { bleed: 0, fracture: false, infection: 0 },
    };
    this.visionBlur = 0;
    this.limp = 0;
  }

  partCondition(id) { return this.condition[id] ?? 100; }

  // Called before the raw player damage is applied so armour/limb multipliers
  // are part of the incoming number.
  incoming(amount, group) {
    const part = GROUP_TO_PART(group, Math.random);
    const cond = this.condition[part];
    let mul = part === 'head' ? 1.35 : part === 'torso' ? 1.0 : 0.85;
    if (cond < 25) mul *= 1.2; // wounded tissue takes damage faster
    return { part, amount: amount * mul };
  }

  // Called after damage lands.
  hit(part, dealt, opts = {}) {
    if (!this.condition[part] && this.condition[part] !== 0) part = 'torso';
    const w = this.wounds[part];
    this.condition[part] = clamp(this.condition[part] - dealt * 0.95, 0, 100);
    if (dealt > 5) w.bleed = clamp(w.bleed + dealt * 0.22, 0, 100);
    if (opts.bleed) w.bleed = clamp(w.bleed + opts.bleed * 0.5, 0, 100);
    if (opts.infection) w.infection = clamp(w.infection + opts.infection * 0.6, 0, 100);
    if (opts.fracture && (part.startsWith('leg') || part.startsWith('arm')) && this.condition[part] < 65) {
      w.fracture = true;
    } else if (opts.fracture && dealt > 22 && this.condition[part] < 40) {
      w.fracture = true;
    }
    if (w.bleed > 45 && Math.random() < 0.18) w.infection = clamp(w.infection + 3, 0, 100);
    // head trauma blurs vision
    if (part === 'head' && this.condition.head < 55) this.visionBlur = Math.max(this.visionBlur, 0.35);
    this.syncPlayerBleed();
  }

  syncPlayerBleed() {
    const p = this.game.player;
    if (!p) return;
    let total = 0, infection = 0;
    for (const id of PARTS) { total += this.wounds[id].bleed; infection += this.wounds[id].infection; }
    p.stats.bleed = clamp(total, 0, 100);
    // the player's own infection stat tracks the worst wound
    p.stats.infection = clamp(Math.max(p.stats.infection, infection), 0, 100);
    p.stats.fractures = {
      head: this.wounds.head.fracture,
      torso: this.wounds.torso.fracture,
      arms: this.wounds.armL.fracture || this.wounds.armR.fracture,
      legs: this.wounds.legL.fracture || this.wounds.legR.fracture,
    };
  }

  // ---- penalties applied by the game loop / weapon system ----
  moveMultiplier() {
    const l = Math.min(this.condition.legL, this.condition.legR);
    const legFrac = (this.wounds.legL.fracture ? 0.55 : 0) + (this.wounds.legR.fracture ? 0.55 : 0);
    let m = l > 70 ? 1 : lerp(0.55, 1, l / 70);
    m *= 1 - legFrac * 0.5;
    return clamp(m, 0.35, 1);
  }

  aimMultiplier() {
    const a = Math.min(this.condition.armL, this.condition.armR);
    let m = a > 60 ? 1 : lerp(1.9, 1, a / 60);
    if (this.wounds.armL.fracture || this.wounds.armR.fracture) m *= 1.35;
    return m;
  }

  staminaMultiplier() {
    const t = this.condition.torso;
    return t > 60 ? 1 : lerp(0.45, 1, t / 60);
  }

  isCrippled() {
    return this.condition.legL < 20 || this.condition.legR < 20;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || p.dead) return;
    const skills = p.skills || {};
    const bleedResist = 1 - (skills.bleedResist || 0);

    let totalBleed = 0;
    for (const id of PARTS) {
      const w = this.wounds[id];
      if (w.bleed > 0) {
        // bleeding drains health and slowly stops on its own
        const rate = w.bleed * 0.016 * bleedResist;
        p.stats.health = clamp(p.stats.health - rate * dt, 0, p.stats.healthMax);
        w.bleed = Math.max(0, w.bleed - dt * 0.22);
        totalBleed += w.bleed;
      }
      if (w.infection > 0) {
        w.infection = clamp(w.infection + dt * 0.012, 0, 100);
        p.stats.health = clamp(p.stats.health - w.infection * 0.0028 * dt, 0, p.stats.healthMax);
        if (w.infection > 60 && p.stats.stress < 100) p.stats.stress = clamp(p.stats.stress + dt * 0.05, 0, 100);
      }
      // natural recovery when well fed and hydrated
      if (p.stats.hunger > 45 && p.stats.thirst > 45 && w.bleed < 2) {
        this.condition[id] = clamp(this.condition[id] + dt * 0.35, 0, 100);
        if (this.condition[id] > 70 && w.infection < 5) w.infection = Math.max(0, w.infection - dt * 0.12);
        if (this.condition[id] > 90) w.fracture = false;
      }
    }
    p.stats.bleed = clamp(totalBleed, 0, 100);
    this.syncPlayerBleed();
    this.visionBlur = Math.max(0, this.visionBlur - dt * 0.12);
    // slow blood loss kills
    if (p.stats.health <= 0) p.dead = true;
  }

  treat(part, itemId) {
    const g = this.game;
    const inv = g.inventory;
    const p = g.player;
    const has = inv.count(itemId) > 0;
    if (!has) { g.notify('No ' + this.itemName(itemId) + ' left.'); return false; }
    const healing = 1 + (p.skills?.healing || 0);
    const ok = () => inv.removeUid(inv.items.find((i) => i.id === itemId).uid, 1);
    const w = this.wounds[part] || this.wounds.torso;

    if (itemId === 'bandage') {
      if (w.bleed < 1 && this.condition[part] > 92) { g.notify('Nothing to bandage there.'); return false; }
      ok();
      w.bleed = Math.max(0, w.bleed - 55);
      this.condition[part] = clamp(this.condition[part] + 9 * healing, 0, 100);
      this.syncPlayerBleed();
      g.audio.heal?.();
      g.notify('Bandage applied', PART_LABEL[part] + ' bleeding reduced.', null, 'good');
    } else if (itemId === 'splint') {
      if (!w.fracture) { g.notify('No fracture to set there.'); return false; }
      ok();
      w.fracture = false;
      this.condition[part] = clamp(this.condition[part] + 14, 0, 100);
      this.syncPlayerBleed();
      g.audio.heal?.();
      g.notify('Splint fitted', PART_LABEL[part] + ' stabilised. It will still hurt.', null, 'good');
    } else if (itemId === 'medkit') {
      ok();
      w.bleed = 0;
      this.condition[part] = clamp(this.condition[part] + 58 * healing, 0, 100);
      p.heal(30 * healing);
      this.syncPlayerBleed();
      g.audio.heal?.();
      g.notify('Medkit used', PART_LABEL[part] + ' repaired, bleeding stopped.', null, 'good');
    } else if (itemId === 'antibiotics') {
      ok();
      for (const id of PARTS) {
        this.wounds[id].infection = Math.max(0, this.wounds[id].infection - 80);
        this.condition[id] = clamp(this.condition[id] + 12, 0, 100);
      }
      p.stats.infection = Math.max(0, p.stats.infection - 80);
      this.syncPlayerBleed();
      g.notify('Antibiotics taken', 'Infection receding.', null, 'good');
    } else if (itemId === 'antirad') {
      ok();
      p.stats.radiation = Math.max(0, p.stats.radiation - 70);
      g.notify('Anti-rad injected', 'Isotopes bound. Radiation -70.', null, 'good');
    } else if (itemId === 'painkillers') {
      ok();
      p.stats.stress = Math.max(0, p.stats.stress - 30);
      p.heal(12);
      g.notify('Painkillers taken', 'Stress reduced.', null, 'good');
    } else if (itemId === 'stim_combat') {
      if (p.stamina > 92) { g.notify('You are already wired.'); return false; }
      ok();
      p.stamina = p.staminaMax;
      p.heal(25 * healing);
      p.stats.stress = Math.max(0, p.stats.stress - 20);
      for (const id of PARTS) this.wounds[id].bleed = Math.max(0, this.wounds[id].bleed - 18);
      this.syncPlayerBleed();
      g.audio.heal?.();
      g.notify('Combat stim', 'Stamina restored, bleeding slowed.', null, 'good');
    } else {
      g.notify('That will not help here.');
      return false;
    }
    if (g.ui) g.ui.hud.updateWeapon();
    return true;
  }

  itemName(id) {
    const def = this.game.itemDef(id);
    return def ? def.name : id;
  }

  serialize() { return { condition: this.condition, wounds: this.wounds }; }
  deserialize(d) {
    if (!d) return;
    if (d.condition) Object.assign(this.condition, d.condition);
    if (d.wounds) for (const k of PARTS) Object.assign(this.wounds[k], d.wounds[k] || {});
    this.syncPlayerBleed();
  }
}
