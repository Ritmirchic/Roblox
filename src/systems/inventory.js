/**
 * Grid inventory: items occupy cells in a 10x7 grid, have weight, durability,
 * attachments and can be moved/rotated. Weight limit interacts with survival
 * (stamina/ speed).
 */
import { ITEMS, itemDef, AMMO_ITEM_FOR } from '../data/items.js';
import { clamp } from '../engine/util.js';

export const GRID_W = 10;
export const GRID_H = 7;

/** Footprint per item from its size class. */
export function itemSize(def) {
  if (!def) return [1, 1];
  if (def.grid) return def.grid;
  switch (def.type) {
    case 'weapon':
      return def.weapon === 'pistol' || def.weapon === 'revolver' || def.weapon === 'knife' || def.weapon === 'machete' ? [2, 1] : [3, 1];
    case 'equipment':
      return def.equip?.slot === 'armor' ? [2, 2] : def.equip?.slot === 'head' ? [2, 1] : [1, 2];
    case 'material':
      return def.weight > 0.5 ? [1, 2] : [1, 1];
    case 'medical':
      return def.id === 'med_medkit' ? [2, 1] : [1, 1];
    case 'food':
    case 'water':
      return [1, 2];
    case 'electronics':
      return def.id === 'electronics_geiger' ? [1, 2] : [1, 1];
    default:
      return [1, 1];
  }
}

let uidCounter = 1;
export function newUid() {
  return uidCounter++;
}

export class Inventory {
  constructor({ onChanged = null } = {}) {
    this.w = GRID_W;
    this.h = GRID_H;
    this.cells = new Array(GRID_W * GRID_H).fill(null);
    this.items = []; // {uid, id, qty, x, y, w, h, dur, attachments, magazine}
    this.equipped = { primary: null, secondary: null, melee: null, armor: null, head: null, tool: null, backpack: null, boots: null };
    this.baseCapacity = 22;
    this.onChanged = onChanged;
    this.quickSlots = [null, null, null, null, null]; // uids
  }

  get capacity() {
    let c = this.baseCapacity;
    for (const slot of Object.values(this.equipped)) {
      const it = slot ? this.get(slot) : null;
      if (!it) continue;
      const def = itemDef(it.id);
      if (def?.equip?.capacity) c += def.equip.capacity;
    }
    return c;
  }

  get weight() {
    let w = 0;
    for (const it of this.items) w += (itemDef(it.id)?.weight || 0) * it.qty;
    for (const slot of Object.values(this.equipped)) {
      const it = slot ? this.get(slot) : null;
      if (it) w += itemWeightOf(it);
    }
    // loaded magazines count
    return Math.round(w * 100) / 100;
  }

  get overloaded() {
    return this.weight > this.capacity;
  }

  get(slotOrUid) {
    return this.items.find((i) => i.uid === slotOrUid) || null;
  }

  _changed() {
    this.onChanged?.();
  }

  _fits(x, y, w, h, skipUid = null) {
    if (x < 0 || y < 0 || x + w > this.w || y + h > this.h) return false;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const occ = this.cells[(y + j) * this.w + (x + i)];
        if (occ && occ !== skipUid) return false;
      }
    }
    return true;
  }

  _occupy(item) {
    for (let j = 0; j < item.h; j++) for (let i = 0; i < item.w; i++) this.cells[(item.y + j) * this.w + (item.x + i)] = item.uid;
  }

  _vacate(item) {
    for (let j = 0; j < item.h; j++) {
      for (let i = 0; i < item.w; i++) {
        const idx = (item.y + j) * this.w + (item.x + i);
        if (this.cells[idx] === item.uid) this.cells[idx] = null;
      }
    }
  }

  findSpot(w, h) {
    for (let y = 0; y <= this.h - h; y++) {
      for (let x = 0; x <= this.w - w; x++) {
        if (this._fits(x, y, w, h)) return { x, y };
      }
    }
    return null;
  }

  /** Adds an item stack. Returns true if it fit. */
  add(id, qty = 1, opts = {}) {
    const def = itemDef(id);
    if (!def) return false;
    let remaining = qty;
    // merge into existing stacks
    if ((def.stack ?? 1) > 1) {
      for (const it of this.items) {
        if (it.id !== id || it.qty >= def.stack) continue;
        const take = Math.min(def.stack - it.qty, remaining);
        it.qty += take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
    while (remaining > 0) {
      const stackSize = Math.min(def.stack ?? 1, remaining);
      const [w, h] = itemSize(def);
      const spot =
        opts.x !== undefined && this._fits(opts.x, opts.y, w, h) ? { x: opts.x, y: opts.y } : this.findSpot(w, h);
      if (!spot) {
        this._changed();
        return false;
      }
      const item = {
        uid: newUid(),
        id,
        qty: stackSize,
        x: spot.x,
        y: spot.y,
        w,
        h,
        dur: def.durability ?? null,
        attachments: [],
        magazine: def.type === 'weapon' ? weaponMagDefault(def) : null,
      };
      this.items.push(item);
      this._occupy(item);
      remaining -= stackSize;
    }
    this._changed();
    return true;
  }

  addDirect(item) {
    const def = itemDef(item.id);
    const [w, h] = itemSize(def);
    const spot = this.findSpot(w, h);
    if (!spot) return false;
    const it = { attachments: [], magazine: null, ...item, w, h, x: spot.x, y: spot.y, uid: newUid() };
    this.items.push(it);
    this._occupy(it);
    this._changed();
    return true;
  }

  remove(uid, qty = Infinity) {
    const it = this.get(uid);
    if (!it) return false;
    if (qty >= it.qty) {
      this._vacate(it);
      this.items = this.items.filter((i) => i.uid !== uid);
      for (let i = 0; i < this.quickSlots.length; i++) if (this.quickSlots[i] === uid) this.quickSlots[i] = null;
      for (const [slot, id] of Object.entries(this.equipped)) if (id === uid) this.equipped[slot] = null;
      this._changed();
      return true;
    }
    it.qty -= qty;
    this._changed();
    return true;
  }

  /** Removes N of an item id from anywhere (including equipped). */
  removeById(id, qty = 1) {
    let need = qty;
    for (const it of [...this.items]) {
      if (it.id !== id || need <= 0) continue;
      const take = Math.min(it.qty, need);
      need -= take;
      this.remove(it.uid, take);
    }
    return need <= 0;
  }

  count(id) {
    let n = 0;
    for (const it of this.items) if (it.id === id) n += it.qty;
    return n;
  }

  countAmmo(ammoType) {
    const id = AMMO_ITEM_FOR[ammoType];
    return id ? this.count(id) : 0;
  }

  consumeAmmo(ammoType, n = 1) {
    const id = AMMO_ITEM_FOR[ammoType];
    if (!id) return false;
    if (this.count(id) < n) return false;
    return this.removeById(id, n);
  }

  move(uid, x, y, rotate = false) {
    const it = this.get(uid);
    if (!it) return false;
    let w = it.w;
    let h = it.h;
    if (rotate) [w, h] = [h, w];
    if (!this._fits(x, y, w, h, it.uid)) return false;
    this._vacate(it);
    it.x = x;
    it.y = y;
    it.w = w;
    it.h = h;
    this._occupy(it);
    this._changed();
    return true;
  }

  sort() {
    const sorted = [...this.items].sort((a, b) => {
      const da = itemDef(a.id);
      const db = itemDef(b.id);
      return (da.type + da.name).localeCompare(db.type + db.name);
    });
    this.cells.fill(null);
    const kept = [];
    for (const it of sorted) {
      const spot = this.findSpot(it.w, it.h);
      if (!spot) {
        kept.push(it);
        continue;
      }
      it.x = spot.x;
      it.y = spot.y;
      this._occupy(it);
      kept.push(it);
    }
    this.items = kept;
    this._changed();
  }

  equip(uid) {
    const it = this.get(uid);
    if (!it) return false;
    const def = itemDef(it.id);
    let slot = null;
    if (def.type === 'weapon') {
      const cls = def.weapon;
      if (['pistol', 'revolver'].includes(cls)) slot = 'secondary';
      else if (['knife', 'machete', 'axe', 'wrench', 'sledge'].includes(cls)) slot = 'melee';
      else slot = 'primary';
    } else if (def.equip?.slot) {
      slot = def.equip.slot;
    }
    if (!slot) return false;
    const prev = this.equipped[slot];
    // move currently equipped item back into the bag
    if (prev && prev !== uid) {
      const prevItem = this.get(prev);
      if (prevItem) {
        this._vacate(it);
        const spot = this.findSpot(prevItem.w, prevItem.h);
        if (!spot) {
          this._occupy(it);
          return false;
        }
        prevItem.x = spot.x;
        prevItem.y = spot.y;
        this._occupy(prevItem);
        this.equipped[slot] = uid;
        this._vacate(it);
        this._changed();
        return slot;
      }
    }
    this._vacate(it);
    this.equipped[slot] = uid;
    this._changed();
    return slot;
  }

  unequip(slot) {
    const uid = this.equipped[slot];
    if (!uid) return false;
    const it = this.get(uid);
    // weapons keep [w,h]; equipment slots may hold 1x2 etc
    const [w, h] = itemSize(itemDef(it.id));
    const spot = this.findSpot(w, h);
    if (!spot) return false;
    it.x = spot.x;
    it.y = spot.y;
    it.w = w;
    it.h = h;
    this.equipped[slot] = null;
    this._occupy(it);
    this._changed();
    return true;
  }

  /** Equips the best available weapon of a kind for quick slots. */
  equippedItem(slot) {
    const uid = this.equipped[slot];
    return uid ? this.get(uid) : null;
  }

  allWeapons() {
    const out = [];
    for (const [slot, uid] of Object.entries(this.equipped)) {
      if (!uid) continue;
      const it = this.get(uid);
      const def = it && itemDef(it.id);
      if (def?.type === 'weapon') out.push({ slot, it, def });
    }
    return out;
  }

  totalArmor() {
    let a = 0;
    for (const slot of ['armor', 'head', 'boots']) {
      const uid = this.equipped[slot];
      const it = uid ? this.get(uid) : null;
      const def = it && itemDef(it.id);
      if (def?.equip?.armor) a += def.equip.armor;
    }
    return clamp(a, 0, 0.6);
  }

  hasEquipped(idOrUid) {
    for (const uid of Object.values(this.equipped)) {
      if (!uid) continue;
      const it = this.get(uid);
      if (it && (it.id === idOrUid || it.uid === idOrUid)) return true;
    }
    return false;
  }

  serialize() {
    return {
      items: this.items.map((i) => ({ ...i })),
      equipped: { ...this.equipped },
      quickSlots: [...this.quickSlots],
    };
  }

  /** Replace this inventory's contents in place (save game restore). */
  deserialize(data) {
    const inv = Inventory.deserialize(data);
    this.items = inv.items;
    this.cells = inv.cells;
    this.equipped = inv.equipped;
    this.quickSlots = inv.quickSlots;
    this._changed();
    return this;
  }

  static deserialize(data) {
    const inv = new Inventory();
    if (!data) return inv;
    inv.items = (data.items || []).map((i) => ({ ...i }));
    inv.cells.fill(null);
    for (const it of inv.items) {
      it.w = it.w ?? 1;
      it.h = it.h ?? 1;
      inv._occupy(it);
      uidCounter = Math.max(uidCounter, it.uid + 1);
    }
    inv.equipped = { ...inv.equipped, ...(data.equipped || {}) };
    inv.quickSlots = data.quickSlots || [null, null, null, null, null];
    return inv;
  }
}

function itemWeightOf(it) {
  return (itemDef(it.id)?.weight || 0) * it.qty;
}

function weaponMagDefault(def) {
  // start loaded if ammo is plentiful; the combat system reconciles this
  return null;
}
