// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/loot.js — loot rolling, containers, enemy drops
// ============================================================
import * as THREE from 'three';
import { LOOT, ITEMS, WEAPONS, MUTANTS } from './data.js';
import { RNG, clamp } from '../core/util.js';

const NOOP_IDS = new Set(['metal_paint', 'clothes', 'flesh_scrap']);

export class LootSystem {
  constructor(game) {
    this.game = game;
    this.rng = new RNG(0x51a7);
    this.looted = new Set();
    this.spots = [];
    this.index = new Map();
    this.taken = new Set();
    this.containerMeshes = new Map();
    this.spawnMeshes();
    this.timer = 0;
  }

  spawnMeshes() {
    const g = this.game;
    const spots = g.world.lootSpots || [];
    // The world already materialises crates/lockers/debris for these spots.
    // We index them so a nearby interact can resolve them in O(1).
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const rec = { id: i, x: s.x, y: s.y, z: s.z, table: s.table, kind: s.kind || 'crate', looted: false };
      this.spots.push(rec);
      const key = Math.floor(s.x / 8) + ',' + Math.floor(s.z / 8);
      if (!this.index.has(key)) this.index.set(key, []);
      this.index.get(key).push(rec);
    }
  }

  nearby(pos, radius = 2.6) {
    const out = [];
    const r = Math.ceil(radius / 8) + 1;
    const cx = Math.floor(pos.x / 8), cz = Math.floor(pos.z / 8);
    for (let x = cx - r; x <= cx + r; x++) {
      for (let z = cz - r; z <= cz + r; z++) {
        const arr = this.index.get(x + ',' + z);
        if (!arr) continue;
        for (const s of arr) {
          if (s.looted) continue;
          const d = Math.hypot(s.x - pos.x, s.z - pos.z);
          if (d < radius) out.push({ spot: s, dist: d });
        }
      }
    }
    out.sort((a, b) => a.dist - b.dist);
    return out;
  }

  roll(tableId, opts = {}) {
    const table = LOOT[tableId] || LOOT.house;
    const out = [];
    const rolls = opts.rolls ?? (1 + (this.rng.chance(0.35) ? 1 : 0));
    for (let r = 0; r < rolls; r++) {
      const total = table.reduce((a, e) => a + e.w, 0);
      let t = this.rng.next() * total;
      let entry = table[0];
      for (const e of table) { t -= e.w; if (t <= 0) { entry = e; break; } }
      if (!entry || NOOP_IDS.has(entry.id)) continue;
      const qty = this.rng.int(entry.min || 1, entry.max || entry.min || 1);
      const def = ITEMS[entry.id];
      const bonus = (this.game.player?.skills?.lootBonus || 0);
      const finalQty = Math.max(1, Math.round(qty * (1 + (bonus ? this.rng.next() * bonus : 0))));
      if (def && def.cat === 'quest' && this.rng.chance(0.4)) continue;
      out.push({ id: entry.id, qty: finalQty });
    }
    return out;
  }

  // Take everything from a container / corpse.
  open(spot, opts = {}) {
    if (spot.looted) return [];
    spot.looted = true;
    this.taken.add(spot.id);
    const items = this.roll(spot.table, { rolls: spot.kind === 'locker' ? 3 : spot.kind === 'corpse' ? 2 : 1 });
    const inv = this.game.inventory;
    const got = [];
    for (const it of items) {
      const added = inv.add(it.id, it.qty);
      if (added > 0) got.push({ ...it, qty: added });
      else this.game.dropLootBag(it.id, it.qty, spot.x, spot.y, spot.z);
    }
    // ammo is worth calling out
    const summary = got.map((it) => {
      const def = ITEMS[it.id] || WEAPONS[it.id];
      return `${def?.name || it.id} ×${it.qty}`;
    });
    if (summary.length) {
      this.game.notify('Recovered', summary.join('\n'), null, 'good');
      this.game.audio.pickup();
      this.game.quests.onCollect();
    } else {
      this.game.notify('Empty', 'Somebody already took anything worth carrying.');
    }
    if (spot.mesh) { spot.mesh.visible = false; }
    return got;
  }

  enemyDrop(enemy) {
    const def = MUTANTS[enemy.type] || {};
    const table = enemy.type === 'brute' ? 'warden'
      : def.regions?.includes('wasteland') ? 'mutant'
      : enemy.type === 'hollow' && this.rng.chance(0.25) ? 'warden'
      : 'mutant';
    const items = this.roll(table, { rolls: enemy.isBoss ? 5 : 1 });
    const inv = this.game.inventory;
    for (const it of items) {
      if (inv.add(it.id, it.qty) === 0) this.game.dropLootBag(it.id, it.qty, enemy.pos.x, enemy.pos.y, enemy.pos.z);
    }
    if (enemy.isBoss) {
      // boss always pays out a shard and a tape
      inv.add('artifact_shard', 1);
      inv.add('record_tape', 1);
    }
    const summary = items.map((it) => `${ITEMS[it.id]?.name || it.id} ×${it.qty}`);
    if (summary.length) this.game.notify('Salvaged from the body', summary.join('\n'), null, 'good');
    this.game.quests.onCollect();
  }

  // Loot that did not fit is dropped in the world as a bag the player can pick up.
  dropBag(id, qty, x, y, z) {
    this.game.dropLootBag(id, qty, x, y, z);
  }

  update(dt) {
    const g = this.game;
    this.timer += dt;
    if (this.timer > 1.0) {
      this.timer = 0;
      const near = this.nearby(g.player.pos, 2.2);
      if (near.length && !g.locked) {
        g.ui.setPrompt(`[E]  Search ${near[0].spot.kind === 'locker' ? 'locker' : near[0].spot.kind === 'corpse' ? 'body' : 'container'}`);
        this.promptSpot = near[0].spot;
      } else if (this.promptSpot && !g.npcs.nearest) {
        this.promptSpot = null;
      }
    }
  }

  peekTable(tableId) {
    const t = LOOT[tableId] || LOOT.house;
    return t[0]?.id;
  }

  interact() {
    const near = this.nearby(this.game.player.pos, 2.6);
    if (!near.length) return false;
    this.open(near[0].spot);
    return true;
  }

  serialize() {
    return { looted: [...this.taken] };
  }

  deserialize(d) {
    if (!d?.looted) return;
    for (const id of d.looted) {
      const spot = this.spots[id];
      if (spot) { spot.looted = true; this.taken.add(id); }
    }
  }
}
