// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/inventory.js — grid inventory, equipment, ammo, weight
// ============================================================
import { ITEMS, AMMO, WEAPONS, ATTACHMENTS, itemGrid, itemWeight, itemDef, itemName } from './data.js';
import { clamp } from '../core/util.js';

export const GRID_W = 10;
export const GRID_H = 7;

let UID = 1;

export class Inventory {
  constructor(game) {
    this.game = game;
    this.cols = GRID_W;
    this.rows = GRID_H;
    this.items = [];
    this.equipment = {
      head: null, body: null, back: null, light: null, utility: null,
      weapon1: null, weapon2: null, melee: null,
    };
    this.attachments = {}; // weaponId -> {slot: attachmentId}
    this.baseCarry = 45;
    this.gold = 0;
    this.quickSlots = [null, null, null, null];
  }

  get carryCapacity() {
    let cap = this.baseCarry + (this.game.player?.skills?.carry || 0);
    for (const slot of Object.values(this.equipment)) {
      if (!slot) continue;
      const def = itemDef(slot.id);
      if (def?.carry) cap += def.carry;
    }
    return cap;
  }

  get weight() {
    let w = 0;
    for (const it of this.items) w += itemWeight(it.id) * it.qty;
    for (const slot of Object.values(this.equipment)) {
      if (slot) w += itemWeight(slot.id) + (slot.attachments ? Object.keys(slot.attachments).length * 0.3 : 0);
    }
    return w;
  }

  get overloaded() { return this.weight > this.carryCapacity; }

  // ---------------- grid helpers ----------------
  occupancy(exclude = null) {
    const grid = new Array(this.cols * this.rows).fill(null);
    for (const it of this.items) {
      if (it === exclude) continue;
      const [w, h] = this.dims(it);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const gx = it.x + x, gy = it.y + y;
        if (gx >= 0 && gy >= 0 && gx < this.cols && gy < this.rows) grid[gy * this.cols + gx] = it;
      }
    }
    return grid;
  }

  dims(item) {
    const [w, h] = itemGrid(item.id);
    return item.rot ? [h, w] : [w, h];
  }

  canPlace(item, x, y, rot = false) {
    const [w0, h0] = itemGrid(item.id);
    const w = rot ? h0 : w0, h = rot ? w0 : h0;
    if (x < 0 || y < 0 || x + w > this.cols || y + h > this.rows) return false;
    const grid = this.occupancy(item);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (grid[(y + yy) * this.cols + (x + xx)]) return false;
    }
    return true;
  }

  findSpot(item) {
    const [w0, h0] = itemGrid(item.id);
    for (const rot of [false, true]) {
      const w = rot ? h0 : w0, h = rot ? w0 : h0;
      for (let y = 0; y <= this.rows - h; y++) {
        for (let x = 0; x <= this.cols - w; x++) {
          if (this.canPlace(item, x, y, rot)) return { x, y, rot };
        }
      }
    }
    return null;
  }

  // ---------------- add / remove ----------------
  add(id, qty = 1, opts = {}) {
    const def = itemDef(id) || WEAPONS[id];
    if (!def) return 0;
    const isWeapon = !!WEAPONS[id];
    const stackMax = isWeapon ? 1 : (def.stack || 1);
    let added = 0;
    // stack into existing
    if (stackMax > 1) {
      for (const it of this.items) {
        if (it.id !== id) continue;
        const space = stackMax - it.qty;
        if (space <= 0) continue;
        const take = Math.min(space, qty - added);
        it.qty += take;
        added += take;
        if (added >= qty) break;
      }
    }
    let guard = 0;
    while (added < qty && guard++ < 200) {
      const item = {
        uid: UID++, id, qty: Math.min(stackMax, qty - added),
        durability: isWeapon ? 1 : undefined,
        attachments: isWeapon ? {} : undefined,
        x: 0, y: 0, rot: false,
      };
      const spot = this.findSpot(item);
      if (!spot) break;
      item.x = spot.x; item.y = spot.y; item.rot = spot.rot;
      this.items.push(item);
      added += item.qty;
    }
    if (added > 0 && this.game?.audio) this.game.audio.pickup();
    return added;
  }

  removeUid(uid, qty = 999) {
    const idx = this.items.findIndex((i) => i.uid === uid);
    if (idx < 0) return 0;
    const it = this.items[idx];
    const take = Math.min(qty, it.qty);
    it.qty -= take;
    if (it.qty <= 0) this.items.splice(idx, 1);
    return take;
  }

  count(id) {
    let n = 0;
    for (const it of this.items) if (it.id === id) n += it.qty;
    return n;
  }

  countAmmo(type) {
    if (!type) return 0;
    let n = 0;
    for (const it of this.items) if (it.id === type) n += it.qty;
    // arrow/bolt quivers detail
    return n;
  }

  removeAmmo(type, qty) {
    let need = qty;
    for (let i = this.items.length - 1; i >= 0 && need > 0; i--) {
      const it = this.items[i];
      if (it.id !== type) continue;
      const take = Math.min(it.qty, need);
      it.qty -= take;
      need -= take;
      if (it.qty <= 0) this.items.splice(i, 1);
    }
    return qty - need;
  }

  useItem(uid) {
    const idx = this.items.findIndex((i) => i.uid === uid);
    if (idx < 0) return false;
    const it = this.items[idx];
    const def = itemDef(it.id);
    if (!def) return false;
    if (!def.use) return false;
    const used = this.game.applyConsumable(def);
    if (used) {
      it.qty--;
      if (it.qty <= 0) this.items.splice(idx, 1);
      if (this.game.audio) this.game.audio.pickup();
    }
    return used;
  }

  // ---------------- equipment ----------------
  equip(uid) {
    const idx = this.items.findIndex((i) => i.uid === uid);
    if (idx < 0) return false;
    const it = this.items[idx];
    const def = itemDef(it.id);
    const wdef = WEAPONS[it.id];
    if (wdef) {
      // weapon slots
      let slot = 'weapon1';
      if (wdef.type === 'melee') slot = 'melee';
      else if (!this.equipment.weapon1) slot = 'weapon1';
      else if (!this.equipment.weapon2) slot = 'weapon2';
      else slot = 'weapon1';
      const prev = this.equipment[slot];
      this.items.splice(idx, 1);
      this.items.push(it); // keep in bag; equipment references it
      this.equipment[slot] = { ...it, slot, equipped: true };
      // remove the bag copy
      this.removeUid(it.uid);
      if (prev) this.addBackFromSlot(prev);
      if (this.game.weapons) this.game.weapons.setWeapon(it.id);
      return true;
    }
    if (def && def.slot) {
      const slot = def.slot;
      const prev = this.equipment[slot];
      this.removeUid(it.uid);
      if (prev) this.addBackFromSlot(prev);
      this.equipment[slot] = { ...it, equipped: true };
      if (this.game.audio) this.game.audio.uiClick();
      this.recalcEquipment();
      return true;
    }
    return false;
  }

  addBackFromSlot(slotItem) {
    const item = { uid: UID++, id: slotItem.id, qty: slotItem.qty || 1, x: 0, y: 0, rot: false, durability: slotItem.durability, attachments: slotItem.attachments };
    const spot = this.findSpot(item);
    if (spot) { item.x = spot.x; item.y = spot.y; item.rot = spot.rot; this.items.push(item); }
    return !!spot;
  }

  unequip(slot) {
    const item = this.equipment[slot];
    if (!item) return false;
    this.equipment[slot] = null;
    this.addBackFromSlot(item);
    this.recalcEquipment();
    return true;
  }

  recalcEquipment() {
    const p = this.game.player;
    let armor = 0, radRes = 0;
    for (const [slot, it] of Object.entries(this.equipment)) {
      if (!it) continue;
      const def = itemDef(it.id);
      if (!def) continue;
      if (def.armor) armor += def.armor * (1 + (p.skills?.armor || 0));
      if (def.radResist) radRes = Math.max(radRes, def.radResist);
    }
    p.armorValue = armor;
    p.armorRadRes = radRes;
    if (this.game.ui) this.game.ui.updateEquipment();
  }

  moveItem(uid, x, y, rot) {
    const it = this.items.find((i) => i.uid === uid);
    if (!it) return false;
    const old = { x: it.x, y: it.y, rot: it.rot };
    it.x = x; it.y = y;
    if (rot !== undefined) it.rot = rot;
    if (!this.canPlace(it, x, y, it.rot)) {
      it.x = old.x; it.y = old.y; it.rot = old.rot;
      return false;
    }
    return true;
  }

  sortItems() {
    const order = { weapons: 0, ammo: 1, food: 2, water: 3, medicine: 4, armor: 5, equipment: 6, materials: 7, electronics: 8, quest: 9 };
    const cat = (id) => {
      const d = itemDef(id);
      if (WEAPONS[id]) return 0;
      return order[d?.cat] ?? 8;
    };
    this.items.sort((a, b) => cat(a.id) - cat(b.id) || a.id.localeCompare(b.id));
    // repack
    for (const it of this.items) { it.x = 0; it.y = 0; it.rot = false; }
    const placed = [];
    for (const it of this.items) {
      this.items = this.items.filter((x) => x !== it);
      const spot = this.findSpot(it);
      if (spot) { it.x = spot.x; it.y = spot.y; it.rot = spot.rot; }
      placed.push(it);
      this.items = [...placed, ...this.items.filter((x) => x !== it)];
    }
    this.items = placed;
  }

  dropItem(uid) {
    const it = this.items.find((i) => i.uid === uid);
    if (!it) return null;
    this.removeUid(uid, 9999);
    return it;
  }

  totalValue() {
    let v = 0;
    for (const it of this.items) {
      const d = itemDef(it.id);
      v += (d?.value || 0) * it.qty;
    }
    return v;
  }

  serialize() {
    return {
      items: this.items.map((i) => ({ ...i })),
      equipment: Object.fromEntries(Object.entries(this.equipment).map(([k, v]) => [k, v ? { ...v } : null])),
      attachments: JSON.parse(JSON.stringify(this.attachments)),
      gold: this.gold,
      quickSlots: [...this.quickSlots],
    };
  }

  deserialize(d) {
    if (!d) return;
    this.items = (d.items || []).map((i) => ({ ...i, uid: UID++ }));
    this.equipment = d.equipment || this.equipment;
    this.attachments = d.attachments || {};
    this.gold = d.gold || 0;
    this.quickSlots = d.quickSlots || [null, null, null, null];
    this.recalcEquipment();
  }
}
