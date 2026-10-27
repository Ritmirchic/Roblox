/**
 * Save system: versioned JSON snapshot in localStorage with three manual slots
 * plus an autosave slot. Handles every persistent subsystem.
 */
const KEY_PREFIX = 'aoh_save_';
export const SAVE_VERSION = 3;

export class SaveSystem {
  constructor(game) {
    this.game = game;
    this.autosaveTimer = 0;
    this.lastAutosave = 0;
    this.enabled = true;
  }

  slots() {
    const out = [];
    for (const id of ['auto', 'slot1', 'slot2', 'slot3']) {
      out.push({ id, meta: this.meta(id) });
    }
    return out;
  }

  meta(slot) {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + slot);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return { version: d.version, savedAt: d.savedAt, playtime: d.playtime, level: d.progression?.level, region: d.regionName, act: d.quests?.currentAct };
    } catch (e) {
      return null;
    }
  }

  hasSave() {
    return !!this.meta('auto') || !!this.meta('slot1') || !!this.meta('slot2') || !!this.meta('slot3');
  }

  newestSlot() {
    const list = this.slots().filter((s) => s.meta);
    if (!list.length) return null;
    list.sort((a, b) => (b.meta.savedAt || 0) - (a.meta.savedAt || 0));
    return list[0].id;
  }

  snapshot() {
    const g = this.game;
    const p = g.player;
    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      playtime: g.playtime,
      seed: g.worldSeed,
      regionName: g.world.regionName(p.position.x, p.position.z),
      player: {
        x: p.position.x, y: p.position.y, z: p.position.z,
        yaw: p.yaw, pitch: p.pitch,
        health: p.health, healthMax: p.healthMax,
        stamina: p.stamina, staminaMax: p.staminaMax,
        hunger: p.hunger, thirst: p.thirst, radiation: p.radiation, infection: p.infection,
        bleeding: p.bleeding, pain: p.pain, stress: p.stress, temperature: p.temperature,
        fractures: p.fractures,
        flashlightBattery: p.flashlightBattery,
      },
      survival: g.survival.serialize(),
      progression: g.progression.serialize(),
      inventory: g.inventory.serialize(),
      combat: g.combat.serialize(),
      quests: g.quests.serialize(),
      dialogue: g.dialogue.serialize(),
      crafting: g.crafting.serialize(),
      base: g.baseBuilding.serialize(),
      world: g.world.serialize(),
      sky: { timeOfDay: g.sky.timeOfDay, weather: { ...g.sky.weather } },
      stats: g.stats,
      respawn: g.respawnPoint,
    };
  }

  save(slot = 'auto') {
    if (!this.enabled) return false;
    try {
      const data = this.snapshot();
      localStorage.setItem(KEY_PREFIX + slot, JSON.stringify(data));
      this.lastAutosave = performance.now();
      return true;
    } catch (e) {
      console.warn('save failed', e);
      return false;
    }
  }

  load(slot = null) {
    const target = slot || this.newestSlot();
    if (!target) return false;
    try {
      const raw = localStorage.getItem(KEY_PREFIX + target);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return this.apply(data);
    } catch (e) {
      console.warn('load failed', e);
      return false;
    }
  }

  apply(d) {
    if (!d) return false;
    const g = this.game;
    if (d.version !== SAVE_VERSION) {
      // forward-compatible: missing fields simply keep defaults
      console.info(`save version ${d.version} -> ${SAVE_VERSION}`);
    }
    g.playtime = d.playtime || 0;
    const p = g.player;
    p.setPosition(d.player.x, d.player.y, d.player.z);
    p.yaw = d.player.yaw || 0;
    p.pitch = d.player.pitch || 0;
    p.health = d.player.health ?? p.healthMax;
    p.healthMax = d.player.healthMax ?? 100;
    p.stamina = d.player.stamina ?? 100;
    p.staminaMax = d.player.staminaMax ?? 100;
    p.hunger = d.player.hunger ?? 78;
    p.thirst = d.player.thirst ?? 74;
    p.radiation = d.player.radiation ?? 0;
    p.infection = d.player.infection ?? 0;
    p.bleeding = d.player.bleeding ?? 0;
    p.pain = d.player.pain ?? 0;
    p.stress = d.player.stress ?? 8;
    p.temperature = d.player.temperature ?? 36.6;
    p.fractures = d.player.fractures || {};
    p.flashlightBattery = d.player.flashlightBattery ?? 100;
    p.isDead = false;
    g.survival.deserialize(d.survival);
    g.progression.deserialize(d.progression);
    g.inventory.deserialize?.(d.inventory);
    g.combat.deserialize(d.combat);
    g.quests.deserialize(d.quests);
    g.dialogue.deserialize(d.dialogue);
    g.crafting.deserialize(d.crafting);
    g.world.deserialize(d.world);
    g.baseBuilding.deserialize(d.base);
    if (d.sky) {
      g.sky.timeOfDay = d.sky.timeOfDay;
      Object.assign(g.sky.weather, d.sky.weather || {});
    }
    g.stats = Object.assign(g.stats, d.stats || {});
    g.respawnPoint = d.respawn || d.respawnPoint || g.respawnPoint;
    // re-equip whatever was in hand
    const eq = g.inventory.equippedItem('primary') || g.inventory.equippedItem('secondary') || g.inventory.equippedItem('sidearm') || g.inventory.equippedItem('melee');
    if (eq) g.combat.equipWeapon(eq.uid);
    g.enemies.clear();
    g.refreshDerived?.();
    return true;
  }

  autosave(reason = 'timer') {
    const now = performance.now();
    if (now - this.lastAutosave < 25000) return false;
    if (this.game.player.isDead) return false;
    const ok = this.save('auto');
    if (ok) this.game.notify('Autosaved.', 'info', 'SYSTEM');
    return ok;
  }

  update(dt) {
    this.autosaveTimer += dt;
    if (this.autosaveTimer > 60) {
      this.autosaveTimer = 0;
      this.autosave('timer');
    }
  }

  clear(slot) {
    try {
      localStorage.removeItem(KEY_PREFIX + slot);
    } catch (e) { /* ignore */ }
  }
}
