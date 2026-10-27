/**
 * Location-aware loot tables. Every container profile defines weighted entries
 * with quantity ranges and a chance of an extra roll on an "extras" table.
 */
const E = (id, weight, qty = [1, 1]) => ({ id, weight, qty });
const R = (id, weight, qty = [1, 1]) => ({ id, weight, qty, rare: true });

export const LOOT_PROFILES = {
  house: {
    label: 'Abandoned House',
    entries: [
      E('food_canned', 12, [1, 2]), E('food_crackers', 12, [1, 3]), E('water_bottle', 12),
      E('mat_cloth', 14, [1, 4]), E('mat_wood', 10, [1, 3]), E('mat_scrap', 10, [1, 3]),
      E('med_bandage', 8), E('val_family_photo', 4), E('val_watch', 2),
      E('food_bar', 5), E('water_dirty', 6), E('mat_wire', 4), E('med_painkillers', 3),
      R('pistol', 2), R('knife', 4), R('equip_jacket', 3), R('val_currency', 6, [2, 12]), R('tool_flashlight', 3),
      R('med_medkit', 2), R('mat_components', 3, [1, 2]), R('axe', 2),
    ],
    extras: [
      E('mat_cloth', 20, [1, 2]), E('mat_scrap', 15, [1, 2]), E('val_currency', 15, [1, 6]),
      E('ammo_pistol', 8, [3, 9]), E('water_bottle', 10),
    ],
    extraChance: 0.45,
  },
  kitchen: {
    label: 'Kitchen Cupboard',
    entries: [
      E('food_canned', 20, [1, 3]), E('water_bottle', 14), E('food_crackers', 12, [1, 2]),
      E('med_herbs', 6), E('water_dirty', 8), E('mat_chemicals', 3), E('food_bar', 6),
      R('food_stew', 3), R('med_painkillers', 3), R('val_currency', 4, [1, 5]),
    ],
    extraChance: 0.2,
  },
  garage: {
    label: 'Garage',
    entries: [
      E('mat_scrap', 20, [2, 5]), E('mat_wire', 14, [1, 3]), E('mat_wood', 12, [1, 4]),
      E('mat_components', 8, [1, 2]), E('mat_chemicals', 6), E('mat_battery_cell', 6),
      E('tool_multitool', 4), E('wrench', 5), E('mat_gunpowder', 4),
      R('sledge', 2), R('axe', 3), R('ammo_shell', 5, [3, 8]), R('equip_boots', 2),
      R('electronics_geiger', 1), R('med_medkit', 1),
    ],
    extraChance: 0.5,
  },
  toolShed: {
    label: 'Tool Shed',
    entries: [
      E('mat_wood', 22, [1, 4]), E('mat_scrap', 16, [1, 3]), E('mat_wire', 10),
      E('wrench', 6), E('mat_resin', 8), E('mat_components', 5), E('mat_cloth', 6, [1, 3]),
      R('sledge', 2), R('axe', 3), R('tool_multitool', 3), R('equip_boots', 2), R('med_bandage', 6, [1, 2]),
    ],
    extraChance: 0.3,
  },
  hospital: {
    label: 'Medical Cabinet',
    entries: [
      E('med_bandage', 24, [1, 3]), E('med_medkit', 10), E('med_painkillers', 12, [1, 2]),
      E('med_antidote', 8), E('med_splint', 8), E('med_antirad', 5), E('mat_cloth', 10, [1, 3]),
      E('med_herbs', 6), E('med_stim', 3), E('water_purified', 4),
      R('quest_sample', 2), R('equip_gasmask', 2), R('equip_cbrn', 1), R('val_currency', 4, [2, 10]),
    ],
    extraChance: 0.35,
  },
  pharmacy: {
    label: 'Pharmacy Shelf',
    entries: [
      E('med_painkillers', 18, [1, 2]), E('med_bandage', 16, [1, 2]), E('med_antidote', 12),
      E('med_antirad', 8), E('med_medkit', 6), E('med_stim', 5), E('food_crackers', 5),
      R('equip_gasmask', 2), R('val_currency', 5, [2, 8]), R('med_medkit', 5),
    ],
    extraChance: 0.3,
  },
  police: {
    label: 'Police Locker',
    entries: [
      E('ammo_pistol', 20, [6, 16]), E('pistol', 12), E('equip_vest', 4), E('mat_gunpowder', 6),
      E('knife', 8), E('med_bandage', 8, [1, 2]), E('quest_dogtags', 4), E('val_currency', 6, [3, 12]),
      R('shotgun', 4), R('ammo_shell', 6, [4, 10]), R('smg', 2), R('equip_gasmask', 3), R('med_medkit', 3),
    ],
    extraChance: 0.4,
  },
  supermarket: {
    label: 'Store Aisle',
    entries: [
      E('food_canned', 22, [1, 3]), E('water_bottle', 18, [1, 2]), E('food_crackers', 16, [1, 3]),
      E('food_bar', 10), E('water_dirty', 8), E('mat_cloth', 8, [1, 2]), E('val_currency', 6, [1, 8]),
      R('food_stew', 4), R('water_purified', 6), R('water_can', 3), R('val_watch', 2),
    ],
    extraChance: 0.35,
  },
  factory: {
    label: 'Industrial Crate',
    entries: [
      E('mat_scrap', 22, [2, 6]), E('mat_wire', 16, [1, 4]), E('mat_components', 10, [1, 3]),
      E('mat_chemicals', 10), E('mat_gunpowder', 8, [1, 2]), E('mat_battery_cell', 8),
      E('electronics_circuit', 6), E('med_bandage', 6), E('wrench', 4), E('med_splint', 4),
      R('sledge', 3), R('axe', 3), R('smg', 2), R('equip_jacket', 3), R('electronics_geiger', 2),
      R('ammo_pistol', 5, [8, 20]), R('equip_backpack', 2),
    ],
    extraChance: 0.55,
  },
  warehouse: {
    label: 'Warehouse Container',
    entries: [
      E('mat_wood', 18, [2, 5]), E('mat_scrap', 18, [2, 5]), E('mat_chemicals', 8),
      E('food_canned', 8, [1, 2]), E('water_bottle', 8), E('mat_cloth', 8, [1, 3]),
      E('electronics_circuit', 5), E('tool_multitool', 4),
      R('rifle', 3), R('ammo_rifle', 5, [4, 10]), R('crossbow', 2), R('equip_backpack', 2),
    ],
    extraChance: 0.4,
  },
  military: {
    label: 'Military Crate',
    entries: [
      E('ammo_intermediate', 18, [15, 40]), E('ammo_rifle', 12, [5, 15]), E('ammo_shell', 8, [4, 12]),
      E('med_medkit', 8), E('med_bandage', 10, [2, 3]), E('equip_vest', 6), E('equip_gasmask', 6),
      E('food_bar', 8, [1, 2]), E('water_purified', 6), E('mat_gunpowder', 4), E('quest_dogtags', 4),
      E('med_stim', 4), E('med_antirad', 6), E('ammo_magnum', 5, [4, 10]),
      R('assaultRifle', 5), R('smg', 5), R('equip_cbrn', 3), R('rifle', 4), R('med_stim', 4, [1, 2]),
      R('quest_docs', 2), R('quest_keycard', 3), R('val_currency', 6, [5, 20]),
    ],
    extraChance: 0.6,
  },
  lab: {
    label: 'Research Cabinet',
    entries: [
      E('electronics_circuit', 18, [1, 2]), E('mat_chemicals', 14, [1, 2]), E('med_antirad', 10),
      E('med_antidote', 10), E('med_stim', 6), E('mat_battery_cell', 8), E('electronics_geiger', 5),
      E('quest_sample', 6), E('med_medkit', 5),
      R('quest_docs', 5), R('quest_radio_part', 3), R('quest_keycard', 4), R('equip_cbrn', 3),
      R('quest_core', 1), R('val_currency', 4, [8, 25]),
    ],
    extraChance: 0.45,
  },
  car: {
    label: 'Wrecked Vehicle',
    entries: [
      E('mat_scrap', 22, [1, 3]), E('mat_wire', 12, [1, 2]), E('mat_battery_cell', 8),
      E('mat_cloth', 10), E('val_currency', 6, [1, 5]), E('med_bandage', 5),
      R('ammo_pistol', 5, [4, 10]), R('tool_multitool', 2), R('pistol', 1), R('water_bottle', 5),
    ],
    extraChance: 0.35,
  },
  crate: {
    label: 'Wooden Crate',
    entries: [
      E('mat_wood', 20, [1, 4]), E('mat_scrap', 14, [1, 3]), E('mat_cloth', 10, [1, 2]),
      E('food_canned', 8), E('water_bottle', 8), E('mat_components', 6),
      R('ammo_shell', 4, [2, 6]), R('equip_jacket', 2), R('val_currency', 5, [1, 8]),
    ],
    extraChance: 0.3,
  },
  locker: {
    label: 'Staff Locker',
    entries: [
      E('med_bandage', 12, [1, 2]), E('mat_cloth', 12, [1, 3]), E('val_currency', 8, [1, 6]),
      E('food_bar', 8), E('equipment_placeholder', 0), E('mat_wood', 6), E('tool_flashlight', 5),
      E('med_painkillers', 6), E('equip_boots', 3),
      R('equip_jacket', 4), R('equip_vest', 2), R('equip_gasmask', 2), R('med_medkit', 3),
    ],
    extraChance: 0.3,
  },
  cave: {
    label: 'Nest Cache',
    entries: [
      E('food_raw', 16, [1, 2]), E('quest_sample', 10), E('mat_cloth', 12, [1, 2]),
      E('mat_battery_cell', 6), E('val_watch', 3), E('med_herbs', 8),
      R('med_medkit', 4), R('ammo_pistol', 4, [4, 8]), R('knife', 4), R('val_currency', 3, [2, 8]),
    ],
    extraChance: 0.35,
  },
  corpse: {
    label: 'Dead Survivor',
    entries: [
      E('mat_cloth', 16, [1, 3]), E('val_currency', 10, [1, 10]), E('med_bandage', 10),
      E('ammo_pistol', 8, [3, 8]), E('food_crackers', 6), E('water_dirty', 6),
      E('quest_dogtags', 5), E('mat_scrap', 8, [1, 2]),
      R('pistol', 4), R('med_medkit', 4), R('rifle', 2), R('equip_vest', 2), R('val_watch', 3), R('quest_note', 1),
    ],
    extraChance: 0.25,
  },
  safe: {
    label: 'Safe',
    entries: [
      E('val_currency', 20, [15, 45]), E('val_watch', 10), E('ammo_magnum', 10, [6, 12]),
      E('med_medkit', 8), E('electronics_circuit', 8),
      R('revolver', 8), R('equip_vest', 6), R('quest_docs', 6), R('assaultRifle', 3), R('quest_keycard', 5),
    ],
    extraChance: 0.5,
  },
  boss: {
    label: 'Trophy Cache',
    entries: [
      E('val_currency', 10, [40, 90]), E('med_medkit', 12, [2, 3]), E('med_stim', 10, [2, 3]),
      E('ammo_intermediate', 14, [30, 60]), E('ammo_rifle', 12, [10, 20]), E('med_antirad', 10, [2, 3]),
      R('assaultRifle', 10), R('rifle', 8), R('equip_cbrn', 8), R('quest_core', 1), R('quest_signal_key', 1),
      R('quest_docs', 10),
    ],
    extraChance: 0.9,
  },
};

/** Region modifiers: the Zone gets deadlier and richer the deeper you go. */
export const REGION_LOOT_MOD = [
  { rare: 0.8, ammo: 1.0, med: 1.0 },
  { rare: 1.0, ammo: 1.1, med: 1.1 },
  { rare: 1.2, ammo: 1.2, med: 1.0 },
  { rare: 1.4, ammo: 1.25, med: 1.3 },
  { rare: 1.8, ammo: 1.6, med: 1.4 },
  { rare: 2.2, ammo: 1.8, med: 1.5 },
];

export function rollLoot(profileKey, rngFn, { luck = 0, region = 0 } = {}) {
  const profile = LOOT_PROFILES[profileKey] || LOOT_PROFILES.house;
  const mod = REGION_LOOT_MOD[region] || REGION_LOOT_MOD[0];
  const results = [];
  const pool = profile.entries.filter((e) => e.id !== 'equipment_placeholder');
  let total = 0;
  for (const e of pool) total += e.weight * (e.rare ? mod.rare * (1 + luck) : 1);
  const rolls = 1 + (rngFn() < 0.35 + luck * 0.2 ? 1 : 0);
  const taken = new Set();
  for (let r = 0; r < rolls; r++) {
    let x = rngFn() * total;
    for (const e of pool) {
      x -= e.weight * (e.rare ? mod.rare * (1 + luck) : 1);
      if (x <= 0) {
        if (taken.has(e.id)) break;
        taken.add(e.id);
        const qty = Math.max(1, Math.round(e.qty[0] + rngFn() * (e.qty[1] - e.qty[0])));
        results.push({ id: e.id, qty });
        break;
      }
    }
  }
  if (rngFn() < (profile.extraChance || 0) + luck * 0.15) {
    const extras = profile.extras || profile.entries;
    let sum = 0;
    for (const e of extras) sum += e.weight;
    let x = rngFn() * sum;
    for (const e of extras) {
      x -= e.weight;
      if (x <= 0) {
        const qty = Math.max(1, Math.round(e.qty[0] + rngFn() * (e.qty[1] - e.qty[0])));
        results.push({ id: e.id, qty });
        break;
      }
    }
  }
  return results;
}
