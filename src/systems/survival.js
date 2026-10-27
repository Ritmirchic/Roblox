/**
 * Survival simulation: hunger, thirst, stamina, temperature, radiation,
 * infection, bleeding, pain, stress and sleep. Systems feed back into movement,
 * accuracy, health regen and screen effects.
 */
import { clamp, clamp01, lerp, damp } from '../engine/util.js';
import { itemDef } from '../data/items.js';

export const SURVIVAL = {
  hungerDrain: 100 / (60 * 12), // full bar lasts 12 game minutes
  thirstDrain: 100 / (60 * 8),
  staminaMax: 100,
  bleedDamage: 0.55,
  radLimit: 100,
};

export class Survival {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.deathCause = null;
    this.lastDamageSource = null;
    this.poisons = 0;
    this.geigerTimer = 0;
    this.hallucinationTimer = 20 + Math.random() * 30;
    this.stressEffects = 0;
    this.temperature = 36.6;
    this.lastRegion = 0;
    this.warningCooldown = {};
    this.stats = { distance: 0, timeSurvived: 0, foodEaten: 0, waterDrunk: 0, deaths: 0 };
    this._lastPos = { x: 0, y: 0, z: 0, copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } };
  }

  /** Always resolve the live player: subsystems are rebuilt on new game. */
  get player() {
    return this.game.player;
  }

  addStress(v) {
    this.player.stress = clamp(this.player.stress + v, 0, 100);
  }

  addRadiation(v) {
    const p = this.player;
    const resist = this.game.inventory?.hasEquipped('equip_cbrn') ? 0.35 : 1;
    p.radiation = clamp(p.radiation + v * resist, 0, 100);
  }

  fallDamage(velocity) {
    const p = this.player;
    const dmg = Math.max(0, (velocity - 11) * 4.2);
    if (dmg > 1) {
      p.hit(dmg, velocity > 18 ? 'leg' : 'torso');
      if (velocity > 17) this.applyFracture('leg');
      this.game.hud?.notify('Fracture - use a splint', 'danger');
    }
  }

  applyFracture(part) {
    const p = this.player;
    if (!p.fractures) p.fractures = { arm: false, leg: false };
    p.fractures[part] = true;
    p.pain = Math.min(100, p.pain + 35);
  }

  warn(key, msg, type = 'warn', cooldown = 25) {
    const now = this.time;
    if (this.warningCooldown[key] && now - this.warningCooldown[key] < cooldown) return;
    this.warningCooldown[key] = now;
    this.game.hud?.notify(msg, type);
  }

  update(dt, { paused = false, inside = false } = {}) {
    const p = this.player;
    if (p.isDead || paused) return;
    this.time += dt;
    const settings = this.game.settings || {};
    const survivalRate = settings.survivalDifficulty === 'light' ? 0.65 : settings.survivalDifficulty === 'hard' ? 1.35 : 1;
    this.stats.timeSurvived += dt;
    const moved = Math.hypot(p.position.x - this._lastPos.x, p.position.z - this._lastPos.z);
    this.stats.distance += moved;
    this._lastPos.copy(p.position);

    // --- hunger / thirst
    p.hunger = clamp(p.hunger - SURVIVAL.hungerDrain * dt * survivalRate, 0, 100);
    p.thirst = clamp(p.thirst - SURVIVAL.thirstDrain * dt * survivalRate * (p.sprinting ? 1.4 : 1), 0, 100);
    if (p.hunger <= 0) p.hit(1.3 * dt * survivalRate, 'torso');
    if (p.thirst <= 0) p.hit(1.8 * dt * survivalRate, 'torso');
    if (p.hunger < 15) this.warn('hunger', 'STARVING - find food', 'warn');
    if (p.thirst < 15) this.warn('thirst', 'DEHYDRATED - find water', 'warn');

    // --- bleeding
    if (p.bleeding > 0) {
      p.hit(p.bleeding * 0.014 * dt, 'torso');
      p.bleeding = Math.max(0, p.bleeding - dt * 0.6);
      this.warn('bleed', 'BLEEDING - use a bandage', 'danger', 20);
    }

    // --- pain / stress
    p.pain = Math.max(0, p.pain - dt * 0.55);
    const night = this.game.sky?.isNight;
    const region = this.game.world?.regionAt(p.position.x, p.position.z) ?? 0;
    const danger = this.game.enemies ? clamp01(this.game.enemies.countAliveNear(p.position, 26) / 3) : 0;
    const stressTarget = (night ? 22 : 8) + danger * 40 + p.radiation * 0.25 + (inside ? -6 : 0) + (region === 5 ? 12 : 0);
    p.stress = damp(p.stress, clamp(stressTarget, 4, 100), 0.35, dt);
    if (p.stress > 70) this.warn('stress', 'Your hands are shaking', 'warn', 40);

    // --- temperature
    const baseTemp = 36.6;
    const cold = (night ? 5 : 0) + (region === 5 ? 2 : 0) + (this.game.weather?.temperature || 0);
    const warmth = this.game.inventory ? this.game.inventory.equippedItem('armor') ? 0.55 : 0.1 : 0.1;
    const target = baseTemp - cold * (1 - warmth) * 0.18 + (p.sprinting ? 0.25 : 0);
    p.temperature = damp(p.temperature, target, 0.15, dt);
    if (p.temperature < 35.6) {
      this.warn('cold', 'HYPOTHERMIA - get warm', 'danger', 30);
      p.addStamina(-dt * 4);
      if (p.temperature < 34.8) p.hit(0.9 * dt, 'torso');
    }

    // --- radiation
    if (p.radiation > 0) {
      if (p.radiation > 55) p.hit(p.radiation * 0.004 * dt, 'torso');
      if (p.radiation > 35) this.addStress(dt * 0.4);
      this.geigerTimer -= dt;
      if (this.geigerTimer <= 0) {
        this.geigerTimer = lerp(0.9, 0.08, clamp01(p.radiation / 100));
        this.game.audio?.play('geiger');
      }
      p.radiation = Math.max(0, p.radiation - dt * 0.02);
    }

    // --- infection
    if (p.infection > 0) {
      p.infection = clamp(p.infection + dt * 0.05, 0, 100);
      if (p.infection > 45) p.hit(p.infection * 0.0022 * dt, 'torso');
      if (p.infection > 30) this.warn('infection', 'INFECTION - take antibiotics', 'danger', 40);
    }

    // --- health regen when stable
    const stable = p.hunger > 35 && p.thirst > 35 && p.bleeding < 5 && p.infection < 25 && p.radiation < 30 && p.stress < 70;
    if (stable && p.health < p.healthMax && !this.game.combat?.reloading) {
      p.health = Math.min(p.healthMax, p.health + dt * 0.35 * (p.hunger > 60 ? 1.35 : 1));
    }
    if (p.health < 30) this.addStress(dt * 0.6);

    // --- environmental radiation
    const haz = this.game.world?.hazardAt(p.position.x, p.position.z) || 0;
    if (haz > 0) {
      this.addRadiation(haz * dt * 9);
      if (!this.warningCooldown.rad) this.warn('rad', 'RADIATION - leave the area', 'danger', 30);
    }

    // --- hallucinations at high stress
    this.hallucinationTimer -= dt;
    if (this.hallucinationTimer <= 0) {
      this.hallucinationTimer = 25 + Math.random() * 40;
      if (p.stress > 55) {
        // distant footstep behind the player
        const fake = p.position.clone();
        fake.x += Math.sin(Math.random() * 6.28) * 14;
        fake.z += Math.cos(Math.random() * 6.28) * 14;
        this.game.audio?.play('footstep_dirt', fake);
        if (Math.random() < 0.5) this.game.audio?.play('growl', fake);
      }
    }
    // stress visual effects
    if (this.game.postfx) {
      const stressVignette = clamp01((p.stress - 40) / 60);
      this.game.postfx.grade.uniforms.uVignette.value = 0.42 + stressVignette * 0.25 + (p.health < 35 ? 0.12 : 0);
    }
    if (this.game.fx && inside) {
      // inside: still air
    }
  }

  /** Eat or drink an item (called by inventory UI / quick use). */
  consume(item) {
    const def = item?.consumable || itemDef(item?.id)?.consumable;
    if (!def) return false;
    const p = this.player;
    if (def.hunger) p.hunger = clamp(p.hunger + def.hunger, 0, 100);
    if (def.thirst) p.thirst = clamp(p.thirst + def.thirst, 0, 100);
    if (def.health) p.health = clamp(p.health + def.health, 0, p.healthMax);
    if (def.bleeding) p.bleeding = clamp(p.bleeding + def.bleeding, 0, 100);
    if (def.infection) p.infection = clamp(p.infection + def.infection, 0, 100);
    if (def.radiation) p.radiation = clamp(p.radiation + def.radiation, 0, 100);
    if (def.stamina) p.addStamina(def.stamina);
    if (def.pain) p.pain = clamp(p.pain + def.pain, 0, 100);
    if (def.stress) p.stress = clamp(p.stress + def.stress, 0, 100);
    if (def.temp) p.temperature += def.temp;
    if (def.fracture) {
      if (p.fractures?.leg) p.fractures.leg = false;
      if (p.fractures?.arm) p.fractures.arm = false;
      this.game.hud?.notify('Fracture splinted', 'item');
    }
    if (def.hunger > 20) this.stats.foodEaten++;
    if (def.thirst > 20) this.stats.waterDrunk++;
    this.game.audio?.play('pickup', p.position);
    this.game.hud?.notify(`Used ${item.name || itemDef(item.id)?.name || 'supply'}.`, 'item', 'SUPPLIES');
    return true;
  }

  /** Sleep for a number of in-game hours. Used by beds and safe-zone rest. */
  sleep(hours = 7) {
    const p = this.player;
    const h = Math.max(0, Math.min(12, hours));
    p.hunger = clamp(p.hunger - h * 2.1, 0, 100);
    p.thirst = clamp(p.thirst - h * 3.0, 0, 100);
    p.stamina = p.staminaMax;
    p.pain = Math.max(0, p.pain - h * 6);
    p.stress = clamp(p.stress - h * 5.5, 0, 100);
    p.bleeding = Math.max(0, p.bleeding - h * 4);
    p.infection = clamp(p.infection - h * 0.6, 0, 100);
    p.fatigue = 0;
    if (p.hunger > 8 && p.thirst > 8) {
      p.health = Math.min(p.healthMax, p.health + p.healthMax * 0.3 * Math.min(1, h / 7));
    }
    this.deathsSinceRest = 0;
    this.stats.hoursSlept = (this.stats.hoursSlept || 0) + h;
    return { hours: h };
  }

  get statusEffects() {
    const p = this.player;
    const fx = [];
    if (p.bleeding > 0) fx.push({ id: 'bleed', label: 'BLEEDING', severity: clamp01(p.bleeding / 60), color: '#c03a3a' });
    if (p.infection > 20) fx.push({ id: 'infection', label: 'INFECTED', severity: clamp01(p.infection / 100), color: '#9a7a3a' });
    if (p.radiation > 20) fx.push({ id: 'rad', label: 'RADIATED', severity: clamp01(p.radiation / 100), color: '#9ac04a' });
    if (p.temperature < 35.6) fx.push({ id: 'cold', label: 'HYPOTHERMIA', severity: clamp01((35.6 - p.temperature) / 2), color: '#5a90c0' });
    if (p.stress > 60) fx.push({ id: 'stress', label: 'PANIC', severity: clamp01((p.stress - 60) / 40), color: '#8a6ac0' });
    if (p.pain > 45) fx.push({ id: 'pain', label: 'IN PAIN', severity: clamp01(p.pain / 100), color: '#c07a4a' });
    if (p.fractures?.leg) fx.push({ id: 'leg', label: 'LEG FRACTURE', severity: 1, color: '#c0a050' });
    return fx;
  }

  serialize() {
    const p = this.player;
    return {
      hunger: p.hunger, thirst: p.thirst, radiation: p.radiation, infection: p.infection,
      bleeding: p.bleeding, stress: p.stress, temperature: p.temperature,
      fractures: p.fractures, stats: this.stats, time: this.time,
    };
  }

  deserialize(d) {
    if (!d) return;
    const p = this.player;
    p.hunger = d.hunger ?? p.hunger;
    p.thirst = d.thirst ?? p.thirst;
    p.radiation = d.radiation ?? 0;
    p.infection = d.infection ?? 0;
    p.bleeding = d.bleeding ?? 0;
    p.stress = d.stress ?? 0;
    p.temperature = d.temperature ?? 36.6;
    p.fractures = d.fractures || { arm: false, leg: false };
    this.stats = d.stats || this.stats;
    this.time = d.time || 0;
  }
}
