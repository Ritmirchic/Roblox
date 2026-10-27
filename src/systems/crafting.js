/**
 * Crafting: field recipes, workbench recipes, salvage and cooking.
 * Costs are real item ids from the item database; timed crafts can be queued
 * while the player keeps moving, workbench crafts require standing near one.
 */
import { ITEMS } from '../data/items.js';

const R = (id, name, output, cost, { time = 1.2, bench = false, desc = '', requires = null, unlockLevel = 1 } = {}) => ({
  id, name, output, cost, time, bench, desc, requires, unlockLevel,
});

export const RECIPES = [
  // ---- field: basic survival -------------------------------------------
  R('bandage', 'Bandage', ['med_bandage', 1], [['mat_cloth', 2]], { time: 0.9, desc: 'Stops light bleeding. Made from torn cloth.' }),
  R('splint', 'Splint', ['med_splint', 1], [['mat_wood', 2], ['mat_cloth', 1]], { time: 1.4, desc: 'Sets a fracture. Immobilises the limb for a while.' }),
  R('boil_water', 'Boil Water', ['water_purified', 1], [['water_dirty', 1], ['fuel_bottle', 1]], { time: 2.2, bench: true, desc: 'Boiling kills most of it. Most.' }),
  R('cook_meat', 'Cook Mutant Meat', ['food_cooked', 1], [['food_raw', 1], ['mat_wood', 1]], { time: 2.6, bench: true, desc: 'Removes most of the infection risk.' }),
  R('torch', 'Field Torch', ['tool_flashlight', 1], [['mat_wood', 1], ['mat_cloth', 1], ['mat_battery_cell', 1]], { time: 1.0, desc: 'A crude light source. The beam will not last.' }),

  // ---- workbench: meds --------------------------------------------------
  R('medkit', 'Field Medkit', ['med_medkit', 1], [['med_bandage', 2], ['mat_cloth', 2], ['med_painkillers', 1]], { time: 3.0, bench: true, desc: 'Restores a large amount of health and stops heavy bleeding.' }),
  R('stim', 'Combat Stim', ['med_stim', 1], [['med_painkillers', 1], ['mat_chemicals', 1], ['mat_battery_cell', 1]], { time: 3.4, bench: true, desc: 'Suppresses pain and fatigue for a short window. Addictive.' }),
  R('antirad', 'Anti-Rad Tablets', ['med_antirad', 2], [['mat_chemicals', 1], ['mat_cloth', 1], ['med_painkillers', 1]], { time: 2.6, bench: true, desc: 'Flushes radiation. Does nothing for the damage already done.' }),
  R('antidote', 'Antibiotics', ['med_antidote', 1], [['mat_chemicals', 1], ['food_mushroom', 2], ['med_painkillers', 2]], { time: 3.6, bench: true, desc: 'Cures infection over time.' }),
  R('herbs', 'Herbal Salve', ['med_herbs', 2], [['mat_resin', 1], ['mat_cloth', 1]], { time: 1.8, desc: 'Forest medicine. Mild, but it keeps wounds clean.' }),

  // ---- workbench: ammunition -------------------------------------------
  R('ammo_pistol', '9x18mm (24)', ['ammo_pistol', 24], [['mat_gunpowder', 1], ['mat_scrap', 1], ['mat_lead', 2]], { time: 2.8, bench: true, desc: 'Hand-loaded pistol ammunition.' }),
  R('ammo_shell', '12ga Buckshot (12)', ['ammo_shell', 12], [['mat_gunpowder', 2], ['mat_scrap', 1], ['mat_lead', 3]], { time: 3.0, bench: true, desc: 'Reloaded shotgun shells.' }),
  R('ammo_rifle', '7.62x54mmR (12)', ['ammo_rifle', 12], [['mat_gunpowder', 2], ['mat_scrap', 2], ['mat_lead', 4]], { time: 3.4, bench: true, desc: 'Full-power rifle rounds.' }),
  R('ammo_bolt', 'Crossbow Bolts (4)', ['ammo_bolt', 4], [['mat_wood', 3], ['mat_scrap', 1]], { time: 2.0, bench: true, desc: 'Carbon-shaft bolts.' }),
  R('grenade_frag', 'Frag Grenade', ['grenade_frag', 1], [['mat_gunpowder', 2], ['mat_scrap', 3], ['electronics_circuit', 1]], { time: 4.2, bench: true, desc: 'Improvised fragmentation charge.' }),
  R('molotov', 'Molotov', ['grenade_molotov', 1], [['fuel_bottle', 1], ['mat_cloth', 1], ['mat_chemicals', 1]], { time: 1.6, desc: 'Burns an area for several seconds.' }),

  // ---- workbench: attachments ------------------------------------------
  R('scope', 'Hunting Scope', ['attach_scope', 1], [['mat_scrap', 2], ['electronics_circuit', 1]], { time: 3.6, bench: true, requires: 'engineer2', desc: 'Adds magnification and reduces sway.' }),
  R('suppressor', 'Suppressor', ['attach_suppressor', 1], [['mat_scrap', 3], ['mat_rubber', 2], ['mat_tape', 1]], { time: 4.0, bench: true, requires: 'engineer2', desc: 'Quiets gunfire. Costs a little damage.' }),
  R('extended_mag', 'Extended Magazine', ['attach_extmag', 1], [['mat_scrap', 2], ['mat_tape', 1]], { time: 2.4, bench: true, desc: 'More rounds before a reload.' }),
  R('foregrip', 'Foregrip', ['attach_grip', 1], [['mat_scrap', 2], ['mat_rubber', 1]], { time: 2.2, bench: true, desc: 'Reduces recoil.' }),
  R('flashlight', 'Weapon Light', ['attach_flashlight', 1], [['mat_battery_cell', 1], ['electronics_circuit', 1], ['mat_scrap', 1]], { time: 2.0, bench: true, desc: 'Mounted light. Works with the gas mask.' }),

  // ---- equipment -------------------------------------------------------
  R('vest', 'Kevlar Vest', ['equip_vest', 1], [['mat_cloth', 4], ['mat_rubber', 2], ['mat_tape', 2]], { time: 4.4, bench: true, desc: 'Chest protection. Heavy, but keeps you breathing.' }),
  R('helmet', 'Combat Helmet', ['equip_helmet', 1], [['mat_scrap', 4], ['mat_cloth', 2]], { time: 4.0, bench: true, desc: 'Protects the head from fragments and claws.' }),
  R('gasmask', 'Gas Mask', ['equip_gasmask', 1], [['mat_rubber', 3], ['mat_scrap', 2], ['mat_chemicals', 1]], { time: 4.8, bench: true, requires: 'engineer3', desc: 'Filters toxins. Necessary in the Red Wasteland.' }),
  R('backpack', 'Large Backpack', ['equip_backpack', 1], [['mat_cloth', 5], ['mat_tape', 2], ['mat_rubber', 1]], { time: 3.4, bench: true, desc: 'Increases carry capacity by 12 kg.' }),

  // ---- tools / camp ----------------------------------------------------
  R('repair_kit', 'Repair Kit', ['tool_repair', 1], [['mat_scrap', 2], ['electronics_circuit', 1], ['mat_tape', 1]], { time: 2.2, bench: true, desc: 'Restores weapon and armour condition.' }),
  R('lockpick', 'Lockpick Set', ['tool_lockpick', 1], [['mat_scrap', 3], ['mat_tape', 1]], { time: 1.8, bench: true, desc: 'Opens simple locks without noise. Breaks quickly.' }),
  R('fuel_mix', 'Fuel Mixture', ['fuel_bottle', 1], [['mat_chemicals', 2], ['food_canned', 1]], { time: 2.0, bench: true, desc: 'Generator fuel. Also burns well.' }),
  R('electronics_repair', 'Rework Circuit', ['electronics_circuit', 1], [['mat_components', 2], ['mat_tape', 1]], { time: 1.8, bench: true, desc: 'Turns salvaged parts into a usable board.' }),
];

export const SALVAGE = {
  // salvage table: breaking an item down yields materials
  default: [['mat_scrap', 1], ['mat_tape', 1]],
  weapon: [['mat_scrap', 2], ['mat_wood', 1], ['mat_components', 1]],
  ammo: [['mat_lead', 1], ['mat_gunpowder', 1]],
  equipment: [['mat_cloth', 2], ['mat_rubber', 1]],
  electronics: [['electronics_circuit', 1], ['mat_components', 1]],
  tool: [['mat_scrap', 1], ['mat_components', 1]],
  attachment: [['mat_scrap', 1], ['mat_tape', 1]],
};

export class CraftingSystem {
  constructor(game) {
    this.game = game;
    this.known = RECIPES.filter((r) => !r.requires && !r.bench).map((r) => r.id);
    this.queue = [];
    this.progress = 0;
    this.active = null;
    this.nearWorkbench = false;
    this.level = 1;
    this.craftCount = 0;
    // unlock bench recipes by level: all workbench basics available from the start
    for (const r of RECIPES) if (!r.requires) this.known.push(r.id);
  }

  allRecipes() {
    return RECIPES;
  }

  refreshUnlocks() {
    const prog = this.game.progression;
    const skillRank = (id) => prog.rank(id);
    for (const r of RECIPES) {
      if (this.known.includes(r.id)) continue;
      if (r.requires === 'engineer2' && skillRank('eng_toolsmith') >= 1) this.known.push(r.id);
      if (r.requires === 'engineer3' && skillRank('eng_masterwork') >= 1) this.known.push(r.id);
    }
  }

  canCraft(recipe) {
    if (!recipe) return false;
    if (!this.known.includes(recipe.id)) return false;
    if (recipe.bench && !this.nearWorkbench) return false;
    for (const [id, n] of recipe.cost) if (this.game.inventory.count(id) < n) return false;
    return true;
  }

  costWithSkills(recipe) {
    const discount = this.game.progression.effect('craftCost') || 0;
    return recipe.cost.map(([id, n]) => [id, Math.max(1, Math.round(n * (1 - discount)))]);
  }

  craft(id) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r) return false;
    if (!this.known.includes(r.id)) {
      this.game.notify('Recipe not known yet.', 'danger', 'CRAFTING');
      return false;
    }
    if (r.bench && !this.nearWorkbench) {
      this.game.notify('Requires a workbench.', 'danger', 'CRAFTING');
      return false;
    }
    const cost = this.costWithSkills(r);
    for (const [mid, n] of cost) {
      if (this.game.inventory.count(mid) < n) {
        this.game.notify(`Missing ${ITEMS[mid]?.name || mid}.`, 'danger', 'CRAFTING');
        return false;
      }
    }
    for (const [mid, n] of cost) this.game.inventory.removeById(mid, n);
    const [outId, qty] = r.output;
    const leftover = this.game.inventory.add(outId, qty);
    if (leftover > 0) {
      const p = this.game.player.position;
      this.game.world.spawnPickup(outId, leftover, { x: p.x, y: p.y + 0.2, z: p.z });
      this.game.notify('Inventory full - item dropped.', 'danger', 'CRAFTING');
    }
    this.craftCount++;
    this.game.audio?.play('craft');
    this.game.quests?.onCraft(r.id);
    this.game.progression.awardXp(8 + Math.round(r.time * 4), 'crafting');
    this.game.notify(`${r.name} crafted.`, 'item', 'CRAFTED');
    this.refreshUnlocks();
    return true;
  }

  salvage(uid) {
    const it = this.game.inventory.get(uid);
    if (!it) return [];
    const def = ITEMS[it.id];
    if (!def) return [];
    const table = SALVAGE[def.type] || SALVAGE.default;
    const got = [];
    for (const [id, n] of table) {
      this.game.inventory.add(id, n);
      got.push([id, n]);
    }
    this.game.inventory.remove(it.uid, it.qty);
    this.game.audio?.play('salvage');
    this.game.notify(`Salvaged: ${got.map(([id, n]) => `${ITEMS[id]?.name || id} x${n}`).join(', ')}`, 'item', 'SALVAGE');
    return got;
  }

  update(dt) {
    // "near workbench" is detected by proximity to any lootable of type bench
    const p = this.game.player.position;
    let near = false;
    for (const l of this.game.world.lootables) {
      if (l.type !== 'bench' && l.type !== 'workbench') continue;
      if (Math.hypot(l.x - p.x, l.z - p.z) < 3.0 && Math.abs(l.y - p.y) < 2.2) {
        near = true;
        break;
      }
    }
    if (!near && this.game.baseBuilding) {
      for (const piece of this.game.baseBuilding.placed) {
        if (piece.defId === 'workbench' && Math.hypot(piece.x - p.x, piece.z - p.z) < 3.2) near = true;
      }
    }
    this.nearWorkbench = near;
    this.refreshUnlocks();
  }

  serialize() {
    return { known: [...this.known], craftCount: this.craftCount };
  }

  deserialize(d) {
    if (!d) return;
    this.known = d.known || this.known;
    this.craftCount = d.craftCount || 0;
  }
}
