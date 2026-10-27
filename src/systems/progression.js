/**
 * Character progression: attributes, four skill trees, XP curve to level 50 and
 * the derived gameplay bonuses other systems query.
 */
import { clamp } from '../engine/util.js';

export const MAX_LEVEL = 50;

export function xpForLevel(level) {
  // smooth curve, ~1k for early levels, ~26k for the last ones
  return Math.round(220 * Math.pow(level, 1.62) + 90 * level);
}

export const ATTRIBUTES = {
  strength: { name: 'STRENGTH', desc: 'Melee damage, carry weight, breaking barricades.', icon: 'str' },
  endurance: { name: 'ENDURANCE', desc: 'Max health, stamina and cold resistance.', icon: 'end' },
  agility: { name: 'AGILITY', desc: 'Movement speed, vault height, reload speed.', icon: 'agi' },
  perception: { name: 'PERCEPTION', desc: 'Loot quality, aim steadiness, spotting enemies.', icon: 'per' },
  technical: { name: 'TECHNICAL SKILL', desc: 'Crafting, repairs, electronics, modifications.', icon: 'tec' },
  survival: { name: 'SURVIVAL KNOWLEDGE', desc: 'Food and radiation efficiency, tracking.', icon: 'sur' },
};

/** Four trees, 3 tiers each. */
export const SKILL_TREES = {
  combat: {
    name: 'COMBAT',
    desc: 'Marksmanship, recoil discipline and melee violence.',
    color: '#b05a32',
    skills: [
      { id: 'weaponHandling', name: 'Weapon Handling', max: 5, tier: 1, desc: '+4% weapon damage per point.', effect: { damage: 0.04 } },
      { id: 'recoilControl', name: 'Recoil Control', max: 5, tier: 1, desc: '-6% recoil per point.', effect: { recoil: -0.06 } },
      { id: 'criticalEye', name: 'Critical Eye', max: 4, tier: 2, desc: '+12% headshot damage per point.', requires: 'weaponHandling', reqLevel: 1, effect: { headshot: 0.12 } },
      { id: 'fastHands', name: 'Fast Hands', max: 4, tier: 2, desc: '-8% reload time per point.', requires: 'recoilControl', reqLevel: 1, effect: { reload: -0.08 } },
      { id: 'meleeMastery', name: 'Melee Mastery', max: 5, tier: 2, desc: '+10% melee damage, +8% swing speed.', requires: 'weaponHandling', reqLevel: 2, effect: { melee: 0.1, meleeSpeed: 0.08 } },
      { id: 'adrenaline', name: 'Adrenaline', max: 3, tier: 3, desc: 'Below 30% health: +15% damage and stamina regen.', requires: 'meleeMastery', reqLevel: 4, effect: { adrenaline: 0.15 } },
      { id: 'executioner', name: 'Executioner', max: 3, tier: 3, desc: '+25% damage to staggered or unaware enemies.', requires: 'criticalEye', reqLevel: 5, effect: { execution: 0.25 } },
    ],
  },
  survival: {
    name: 'SURVIVAL',
    desc: 'Food, wounds, radiation and the will to keep breathing.',
    color: '#7a8a4a',
    skills: [
      { id: 'ironStomach', name: 'Iron Stomach', max: 5, tier: 1, desc: '-8% hunger and thirst drain per point.', effect: { food: -0.08 } },
      { id: 'thickSkin', name: 'Thick Skin', max: 5, tier: 1, desc: '+4% damage resistance per point.', effect: { armor: 0.04 } },
      { id: 'fieldMedicine', name: 'Field Medicine', max: 4, tier: 2, desc: '+15% healing from medical items.', requires: 'ironStomach', reqLevel: 1, effect: { healing: 0.15 } },
      { id: 'radiationHardened', name: 'Radiation Hardened', max: 4, tier: 2, desc: '-12% radiation gain per point.', requires: 'thickSkin', reqLevel: 1, effect: { radiation: -0.12 } },
      { id: 'secondWind', name: 'Second Wind', max: 3, tier: 3, desc: 'Stamina regenerates 20% faster; survives one lethal hit per shelter rest.', requires: 'fieldMedicine', reqLevel: 3, effect: { staminaRegen: 0.2, revive: 1 } },
      { id: 'scavenger', name: 'Scavenger', max: 5, tier: 2, desc: '+8% chance of extra loot per point.', requires: 'ironStomach', reqLevel: 2, effect: { loot: 0.08 } },
    ],
  },
  engineering: {
    name: 'ENGINEERING',
    desc: 'Crafting, repairs, electronics and fortifications.',
    color: '#5a7a8a',
    skills: [
      { id: 'tinkerer', name: 'Tinkerer', max: 5, tier: 1, desc: '-6% crafting material cost per point.', effect: { craftCost: -0.06 } },
      { id: 'gunsmith', name: 'Gunsmith', max: 4, tier: 2, desc: '+15% weapon durability, unlock advanced mods.', requires: 'tinkerer', reqLevel: 1, effect: { durability: 0.15 } },
      { id: 'electronics', name: 'Electronics', max: 4, tier: 2, desc: 'Better gear from circuits; unlock electronics recipes.', requires: 'tinkerer', reqLevel: 1, effect: { electronics: 1 } },
      { id: 'builder', name: 'Builder', max: 4, tier: 2, desc: '-10% build material cost, faster building.', requires: 'tinkerer', reqLevel: 2, effect: { buildCost: -0.1 } },
      { id: 'trapper', name: 'Trapper', max: 3, tier: 3, desc: 'Craft improvised mines and cheap traps.', requires: 'gunsmith', reqLevel: 3, effect: { traps: 1 } },
      { id: 'armorer', name: 'Armorer', max: 3, tier: 3, desc: 'Repair armour at benches without parts.', requires: 'builder', reqLevel: 4, effect: { armorRepair: 1 } },
    ],
  },
  exploration: {
    name: 'EXPLORATION',
    desc: 'Stealth, stamina, carry weight and finding the way.',
    color: '#8a7a5a',
    skills: [
      { id: 'keenEye', name: 'Keen Eye', max: 5, tier: 1, desc: 'Enemies are spotted 15% sooner; better loot rolls.', effect: { perception: 0.15 } },
      { id: 'lightFooted', name: 'Light Footed', max: 5, tier: 1, desc: '-12% footstep noise per point.', effect: { noise: -0.12 } },
      { id: 'sprinter', name: 'Sprinter', max: 4, tier: 2, desc: '+6% sprint speed, -10% stamina cost.', requires: 'lightFooted', reqLevel: 1, effect: { sprint: 0.06, sprintCost: -0.1 } },
      { id: 'packMule', name: 'Pack Mule', max: 4, tier: 2, desc: '+6 kg carry capacity per point.', requires: 'keenEye', reqLevel: 1, effect: { capacity: 6 } },
      { id: 'navigator', name: 'Navigator', max: 3, tier: 3, desc: 'Reveals more of the map when entering a region.', requires: 'sprinter', reqLevel: 3, effect: { map: 1 } },
      { id: 'sixthSense', name: 'Sixth Sense', max: 2, tier: 3, desc: 'A warning whisper when a stalker is nearby.', requires: 'packMule', reqLevel: 4, effect: { sense: 1 } },
    ],
  },
};

export class Progression {
  constructor(game) {
    this.game = game;
    this.level = 1;
    this.xp = 0;
    this.skillPoints = 1;
    this.attrPoints = 1;
    this.skills = {}; // id -> rank
    this.attributes = { strength: 1, endurance: 1, agility: 1, perception: 1, technical: 1, survival: 1 };
    this.trees = SKILL_TREES;
    this.killsByType = {};
    this.onLevelUp = null;
    this.unspentWarned = false;
  }

  /** Alias used by the UI and by save data written before the rename. */
  get attributePoints() {
    return this.attrPoints;
  }

  set attributePoints(v) {
    this.attrPoints = v;
  }

  get xpToNext() {
    return xpForLevel(this.level);
  }

  get xpProgress() {
    return clamp(this.xp / this.xpToNext, 0, 1);
  }

  rank(skillId) {
    return this.skills[skillId] || 0;
  }

  /** Aggregated effect value from all skills (rank * per-rank effect). */
  effect(key) {
    let v = 0;
    for (const tree of Object.values(SKILL_TREES)) {
      for (const s of tree.skills) {
        const r = this.rank(s.id);
        if (!r) continue;
        if (s.effect[key]) v += s.effect[key] * r;
      }
    }
    return v;
  }

  awardXp(amount, source = '') {
    if (amount <= 0) return;
    this.xp += Math.round(amount);
    let leveled = false;
    while (this.level < MAX_LEVEL && this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.skillPoints += 1;
      if (this.level % 2 === 0) this.attrPoints += 1;
      leveled = true;
      this.game.hud?.notify(`LEVEL ${this.level} - skill point earned`, 'level');
      this.game.audio?.play('levelUp');
      this.game.player.healthMax = this.maxHealth;
      this.game.player.health = Math.min(this.game.player.healthMax, this.game.player.health + this.maxHealth * 0.25);
      this.game.player.staminaMax = this.maxStamina;
      this.onLevelUp?.(this.level);
      this.game.quests?.onLevelUp?.(this.level);
    }
    if (!leveled) this.game.hud?.addXp(amount);
    else this.game.hud?.addXp(0);
  }

  canUnlock(skillId) {
    for (const tree of Object.values(SKILL_TREES)) {
      const skill = tree.skills.find((s) => s.id === skillId);
      if (!skill) continue;
      if (this.rank(skillId) >= skill.max) return { ok: false, reason: 'MAXED' };
      if (this.skillPoints < 1) return { ok: false, reason: 'NO POINTS' };
      if (skill.requires && this.rank(skill.requires) < (skill.reqLevel || 1)) {
        return { ok: false, reason: `Requires ${skill.requires}` };
      }
      return { ok: true, skill };
    }
    return { ok: false, reason: 'UNKNOWN' };
  }

  unlock(skillId) {
    const chk = this.canUnlock(skillId);
    if (!chk.ok) return chk;
    this.skills[skillId] = this.rank(skillId) + 1;
    this.skillPoints--;
    this.game.audio?.play('uiClick');
    return { ok: true };
  }

  canRaiseAttribute(attr) {
    if (this.attrPoints < 1) return { ok: false, reason: 'NO POINTS' };
    if ((this.attributes[attr] || 1) >= 10) return { ok: false, reason: 'MAXED' };
    return { ok: true };
  }

  raiseAttribute(attr) {
    const chk = this.canRaiseAttribute(attr);
    if (!chk.ok) return chk;
    this.attributes[attr]++;
    this.attrPoints--;
    if (attr === 'endurance') {
      this.game.player.healthMax = this.maxHealth;
      this.game.player.staminaMax = this.maxStamina;
    }
    this.game.audio?.play('uiClick');
    return { ok: true };
  }

  // ---- derived stats -----------------------------------------------------
  get maxHealth() {
    const p = this.game.player;
    return Math.max(1, Math.round(100 + (this.attributes.endurance - 1) * 14 + (this.level - 1) * 4.5 + (p.healthMaxBonus || 0)));
  }

  get maxStamina() {
    return Math.round(100 + (this.attributes.endurance - 1) * 9 + (this.level - 1) * 1.4);
  }

  get damageBonus() {
    return this.effect('damage') + this.attributes.strength * 0.02;
  }

  get meleeBonus() {
    return this.effect('melee') + (this.attributes.strength - 1) * 0.05;
  }

  get headshotBonus() {
    return this.effect('headshot');
  }

  get recoilControl() {
    return clamp(1 + this.effect('recoil'), 0.35, 1);
  }

  get reloadSpeed() {
    return clamp(1 + this.effect('reload') - (this.attributes.agility - 1) * 0.03, 0.45, 1.5);
  }

  get moveSpeed() {
    return 1 + this.effect('sprint') + (this.attributes.agility - 1) * 0.012;
  }

  get armorBonus() {
    return this.effect('armor');
  }

  get radiationResist() {
    return clamp(-this.effect('radiation') + (this.attributes.survival - 1) * 0.03, 0, 0.85);
  }

  get carryCapacity() {
    return clamp(this.effect('capacity') + (this.attributes.strength - 1) * 1.6, 0, 60);
  }

  get luckBonus() {
    return (this.attributes.perception - 1) * 0.02 + this.effect('loot') + this.effect('perception') * 0.1;
  }

  get healingBonus() {
    return this.effect('healing') + (this.attributes.survival - 1) * 0.03;
  }

  get craftingDiscount() {
    return clamp(this.effect('craftCost') + (this.attributes.technical - 1) * 0.02, -0.7, 0);
  }

  get noiseReduction() {
    return clamp(1 + this.effect('noise'), 0.25, 1);
  }

  get staminaRegenBonus() {
    return this.effect('staminaRegen');
  }

  serialize() {
    return {
      level: this.level, xp: this.xp, skillPoints: this.skillPoints, attrPoints: this.attrPoints,
      skills: { ...this.skills }, attributes: { ...this.attributes }, killsByType: { ...this.killsByType },
    };
  }

  deserialize(d) {
    if (!d) return;
    this.level = d.level || 1;
    this.xp = d.xp || 0;
    this.skillPoints = d.skillPoints ?? 0;
    this.attrPoints = d.attrPoints ?? 0;
    this.skills = d.skills || {};
    this.attributes = { ...this.attributes, ...(d.attributes || {}) };
    this.killsByType = d.killsByType || {};
    this.game.player.healthMax = this.maxHealth;
    this.game.player.staminaMax = this.maxStamina;
    this.game.player.health = this.game.player.healthMax;
  }
}
