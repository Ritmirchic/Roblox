/** Item database: every pickup, consumable, material and quest item in the game. */
export const ITEM_TYPES = {
  weapon: { label: 'WEAPONS', color: '#b05a32', order: 0 },
  ammo: { label: 'AMMUNITION', color: '#c2a33a', order: 1 },
  food: { label: 'FOOD', color: '#8c8a4a', order: 2 },
  water: { label: 'WATER', color: '#4d7f9e', order: 2 },
  medical: { label: 'MEDICAL', color: '#a23c3c', order: 3 },
  material: { label: 'MATERIALS', color: '#7a7a70', order: 5 },
  tool: { label: 'TOOLS', color: '#6f7a5e', order: 4 },
  equipment: { label: 'EQUIPMENT', color: '#5a6a5a', order: 4 },
  electronics: { label: 'ELECTRONICS', color: '#4a7a6a', order: 5 },
  attachment: { label: 'ATTACHMENTS', color: '#6a7a8a', order: 4 },
  quest: { label: 'QUEST ITEMS', color: '#a08840', order: 6 },
  valuable: { label: 'VALUABLES', color: '#9a8a62', order: 6 },
};

export const RARITY = {
  common: { label: 'COMMON', color: '#b9b9ae', weight: 1 },
  uncommon: { label: 'UNCOMMON', color: '#7fb069', weight: 2 },
  rare: { label: 'RARE', color: '#5f9fd0', weight: 3 },
  epic: { label: 'EPIC', color: '#a07fd0', weight: 4 },
  legendary: { label: 'LEGENDARY', color: '#d0a050', weight: 5 },
};

/**
 * icon: procedural vector descriptor consumed by ui/icons.js
 *  shape: 'pistol','rifle','knife','axe','can','bottle','pill','bandage','bolt',
 *         'gear','circuit','bag','battery','mask','keepsake','grenade','scope','key','paper'
 */
export const ITEMS = {
  // ---- weapons -----------------------------------------------------------
  knife: { id: 'knife', name: 'Combat Knife', type: 'weapon', weapon: 'knife', weight: 0.4, rarity: 'common', value: 40, icon: { shape: 'knife', color: '#8d949a' }, description: 'A battered bayonet with a taped grip. Quiet and dependable.' },
  machete: { id: 'machete', name: 'Rusted Machete', type: 'weapon', weapon: 'machete', weight: 1.2, rarity: 'uncommon', value: 70, icon: { shape: 'knife', color: '#7a5a42' }, description: 'Clearance blade with a wavy edge. Heavy enough to break bone.' },
  axe: { id: 'axe', name: 'Fire Axe', type: 'weapon', weapon: 'axe', weight: 2.6, rarity: 'uncommon', value: 90, icon: { shape: 'axe', color: '#b04030' }, description: 'Salvaged from a fire station. Still sharp.' },
  wrench: { id: 'wrench', name: 'Pipe Wrench', type: 'weapon', weapon: 'wrench', weight: 2.0, rarity: 'common', value: 35, icon: { shape: 'wrench', color: '#6b5a4a' }, description: 'Heavy, unbalanced, dented from use.' },
  sledge: { id: 'sledge', name: 'Sledgehammer', type: 'weapon', weapon: 'sledge', weight: 5.2, rarity: 'rare', value: 120, icon: { shape: 'axe', color: '#5a5a5a' }, description: 'Industrial demolition tool. Not subtle, but final.' },
  pistol: { id: 'pistol', name: 'PM-9 Pistol', type: 'weapon', weapon: 'pistol', weight: 1.0, rarity: 'common', value: 180, icon: { shape: 'pistol', color: '#4a4d52' }, description: '8-round sidearm. Found in a police supply locker.' },
  revolver: { id: 'revolver', name: 'R-44 Revolver', type: 'weapon', weapon: 'revolver', weight: 1.4, rarity: 'uncommon', value: 240, icon: { shape: 'pistol', color: '#6a4a2a' }, description: 'Six rounds of .44. The kind of gun that ends arguments.' },
  smg: { id: 'smg', name: 'KS Submachine Gun', type: 'weapon', weapon: 'smg', weight: 2.6, rarity: 'rare', value: 340, icon: { shape: 'smg', color: '#3a3d38' }, description: 'Compact and brutal. Best indoors.' },
  shotgun: { id: 'shotgun', name: 'Hunting Shotgun', type: 'weapon', weapon: 'shotgun', weight: 3.4, rarity: 'uncommon', value: 300, icon: { shape: 'shotgun', color: '#6a4a2a' }, description: 'Pump action 12 gauge. Devastating within 15 metres.' },
  rifle: { id: 'rifle', name: 'KV-7 Hunting Rifle', type: 'weapon', weapon: 'rifle', weight: 4.2, rarity: 'rare', value: 520, icon: { shape: 'rifle', color: '#5a4028' }, description: 'Bolt action 7.62. Scoped shots reward patience.' },
  assaultRifle: { id: 'assaultRifle', name: 'ARS-4 Rifle', type: 'weapon', weapon: 'assaultRifle', weight: 3.8, rarity: 'epic', value: 760, icon: { shape: 'rifle', color: '#2e332c' }, description: 'Military issue automatic rifle. Rare outside the Exclusion Zone.' },
  crossbow: { id: 'crossbow', name: 'Compound Crossbow', type: 'weapon', weapon: 'crossbow', weight: 3.0, rarity: 'rare', value: 400, icon: { shape: 'crossbow', color: '#4a3a28' }, description: 'Silent hunting weapon. Bolts can be retrieved from corpses.' },

  // ---- ammo --------------------------------------------------------------
  ammo_pistol: { id: 'ammo_pistol', name: '9x18mm Rounds', type: 'ammo', ammo: 'pistol', stack: 120, weight: 0.012, rarity: 'common', value: 2, icon: { shape: 'bullet', color: '#c2a33a' }, description: 'Standard pistol ammunition.' },
  ammo_magnum: { id: 'ammo_magnum', name: '.44 Magnum Rounds', type: 'ammo', ammo: 'magnum', stack: 60, weight: 0.02, rarity: 'uncommon', value: 4, icon: { shape: 'bullet', color: '#b87830' }, description: 'Heavy revolver ammunition.' },
  ammo_shell: { id: 'ammo_shell', name: '12ga Buckshot', type: 'ammo', ammo: 'shell', stack: 60, weight: 0.04, rarity: 'common', value: 5, icon: { shape: 'shell', color: '#a03a30' }, description: 'Buckshot shells, red hulls bleached by time.' },
  ammo_rifle: { id: 'ammo_rifle', name: '7.62x54mmR', type: 'ammo', ammo: 'rifle', stack: 90, weight: 0.03, rarity: 'uncommon', value: 6, icon: { shape: 'bullet', color: '#a8b0a0' }, description: 'Full-power rifle ammunition.' },
  ammo_intermediate: { id: 'ammo_intermediate', name: '5.45x39mm', type: 'ammo', ammo: 'intermediate', stack: 240, weight: 0.015, rarity: 'uncommon', value: 3, icon: { shape: 'bullet', color: '#9aa66a' }, description: 'Military intermediate cartridge.' },
  ammo_bolt: { id: 'ammo_bolt', name: 'Crossbow Bolt', type: 'ammo', ammo: 'bolt', stack: 40, weight: 0.05, rarity: 'common', value: 8, icon: { shape: 'bolt', color: '#8a7a5a' }, description: 'Carbon shaft, aluminium head. Reusable if you can find them.' },

  // ---- food --------------------------------------------------------------
  food_canned: { id: 'food_canned', name: 'Canned Meat', type: 'food', weight: 0.4, stack: 12, rarity: 'common', value: 18, icon: { shape: 'can', color: '#7a6a4a' }, consumable: { hunger: 34, health: 3 }, description: 'Decades past expiry. Still edible. Barely.' },
  food_stew: { id: 'food_stew', name: 'Field Stew', type: 'food', weight: 0.55, stack: 8, rarity: 'uncommon', value: 26, icon: { shape: 'can', color: '#8a6a3a' }, consumable: { hunger: 52, health: 9, temp: 1.5 }, description: 'Survivor food. Heavy, warm, filling.' },
  food_crackers: { id: 'food_crackers', name: 'Army Crackers', type: 'food', weight: 0.2, stack: 16, rarity: 'common', value: 9, icon: { shape: 'bag', color: '#a09060' }, consumable: { hunger: 16, thirst: -3 }, description: 'Dry ration crackers in a wax paper sleeve.' },
  food_mushroom: { id: 'food_mushroom', name: 'Cave Mushrooms', type: 'food', weight: 0.12, stack: 20, rarity: 'common', value: 5, icon: { shape: 'pill', color: '#b0a080' }, consumable: { hunger: 12, radiation: 0.8 }, description: 'Grown in darkness. Bitter, irradiated, better than starving.' },
  food_bar: { id: 'food_bar', name: 'Ration Bar', type: 'food', weight: 0.18, stack: 16, rarity: 'uncommon', value: 14, icon: { shape: 'bag', color: '#8a7a4a' }, consumable: { hunger: 26, stamina: 12 }, description: 'Compressed calories. Tastes like sawdust and survival.' },
  food_raw: { id: 'food_raw', name: 'Raw Mutant Meat', type: 'food', weight: 0.5, stack: 8, rarity: 'common', value: 6, icon: { shape: 'bag', color: '#7a3a34' }, consumable: { hunger: 22, health: -9, infection: 6 }, description: 'Do not eat raw. You will regret it.' },
  food_cooked: { id: 'food_cooked', name: 'Cooked Mutant Meat', type: 'food', weight: 0.45, stack: 8, rarity: 'uncommon', value: 20, icon: { shape: 'bag', color: '#6a4a2a' }, consumable: { hunger: 44, health: 5, temp: 1 }, description: 'Charted outside, safe inside. Best eaten warm.' },

  // ---- water -------------------------------------------------------------
  water_bottle: { id: 'water_bottle', name: 'Water Bottle', type: 'water', weight: 0.5, stack: 8, rarity: 'common', value: 15, icon: { shape: 'bottle', color: '#5a8aa0' }, consumable: { thirst: 38 }, description: 'Plastic bottle of clean water.' },
  water_can: { id: 'water_can', name: 'Water Canister', type: 'water', weight: 1.6, stack: 3, rarity: 'uncommon', value: 32, icon: { shape: 'bottle', color: '#4a7a8a' }, consumable: { thirst: 72 }, description: 'Military canister. Bulky but precious.' },
  water_dirty: { id: 'water_dirty', name: 'Murky Water', type: 'water', weight: 0.5, stack: 8, rarity: 'common', value: 4, icon: { shape: 'bottle', color: '#5a6a4a' }, consumable: { thirst: 30, health: -5, infection: 5, radiation: 0.4 }, description: 'Standing water. Boil it before drinking.' },
  water_purified: { id: 'water_purified', name: 'Purified Water', type: 'water', weight: 0.5, stack: 8, rarity: 'uncommon', value: 24, icon: { shape: 'bottle', color: '#6aa0b8' }, consumable: { thirst: 44, health: 2 }, description: 'Filtered and boiled. Safe.' },

  // ---- medical -----------------------------------------------------------
  med_bandage: { id: 'med_bandage', name: 'Bandage', type: 'medical', weight: 0.08, stack: 20, rarity: 'common', value: 21, icon: { shape: 'bandage', color: '#c8c0b0' }, consumable: { bleeding: -60, health: 9 }, description: 'Stops bleeding. Does not heal much.' },
  med_medkit: { id: 'med_medkit', name: 'Field Medkit', type: 'medical', weight: 0.7, stack: 5, rarity: 'uncommon', value: 85, icon: { shape: 'medkit', color: '#b03a3a' }, consumable: { health: 55, bleeding: -100 }, description: 'Gauze, antiseptic, sutures, painkillers. Full trauma kit.' },
  med_antidote: { id: 'med_antidote', name: 'Antibiotics', type: 'medical', weight: 0.1, stack: 10, rarity: 'uncommon', value: 70, icon: { shape: 'pill', color: '#c07a3a' }, consumable: { infection: -55, health: 8 }, description: 'Broad spectrum. Expensive everywhere.' },
  med_painkillers: { id: 'med_painkillers', name: 'Painkillers', type: 'medical', weight: 0.06, stack: 16, rarity: 'common', value: 26, icon: { shape: 'pill', color: '#d0d0c0' }, consumable: { pain: -70, stress: -8 }, description: 'Dulls pain for a while. Your body keeps a receipt.' },
  med_antirad: { id: 'med_antirad', name: 'Anti-Rad Tablets', type: 'medical', weight: 0.06, stack: 16, rarity: 'rare', value: 60, icon: { shape: 'pill', color: '#7aa07a' }, consumable: { radiation: -35 }, description: 'Binds isotopes in the body. Causes nausea.' },
  med_splint: { id: 'med_splint', name: 'Splint', type: 'medical', weight: 0.35, stack: 6, rarity: 'common', value: 30, icon: { shape: 'bandage', color: '#9a8a6a' }, consumable: { fracture: -1, health: 5 }, description: 'Two boards and tape. Fixes a broken limb well enough.' },
  med_stim: { id: 'med_stim', name: 'Combat Stimulant', type: 'medical', weight: 0.1, stack: 8, rarity: 'rare', value: 95, icon: { shape: 'syringe', color: '#a0c0a0' }, consumable: { stamina: 100, health: 18, stress: 6, temp: 0.4 }, description: 'Military stim. Instant stamina, instant regret later.' },
  med_herbs: { id: 'med_herbs', name: 'Blackwood Herbs', type: 'medical', weight: 0.1, stack: 12, rarity: 'common', value: 12, icon: { shape: 'pill', color: '#6a7a3a' }, consumable: { health: 6, infection: -6 }, description: 'Bitter roots used by forest survivors. Mild antiseptic.' },

  // ---- materials ---------------------------------------------------------
  mat_scrap: { id: 'mat_scrap', name: 'Scrap Metal', type: 'material', weight: 0.35, stack: 60, rarity: 'common', value: 6, icon: { shape: 'gear', color: '#7a7a72' }, description: 'Bent plates, brackets, bolts. Everything a workbench needs.' },
  mat_wire: { id: 'mat_wire', name: 'Copper Wire', type: 'material', weight: 0.08, stack: 40, rarity: 'common', value: 10, icon: { shape: 'coil', color: '#a06a3a' }, description: 'Stripped wire, still conductive.' },
  mat_cloth: { id: 'mat_cloth', name: 'Cloth Scraps', type: 'material', weight: 0.12, stack: 50, rarity: 'common', value: 5, icon: { shape: 'bandage', color: '#8a8474' }, description: 'Ripped clothing and curtains.' },
  mat_wood: { id: 'mat_wood', name: 'Timber', type: 'material', weight: 0.9, stack: 40, rarity: 'common', value: 5, icon: { shape: 'plank', color: '#7a5a36' }, description: 'Splintered lumber, usable for braced walls.' },
  mat_chemicals: { id: 'mat_chemicals', name: 'Chemicals', type: 'material', weight: 0.6, stack: 30, rarity: 'uncommon', value: 18, icon: { shape: 'bottle', color: '#8a9a3a' }, description: 'Industrial solvent and reagents.' },
  mat_gunpowder: { id: 'mat_gunpowder', name: 'Gunpowder', type: 'material', weight: 0.15, stack: 40, rarity: 'uncommon', value: 16, icon: { shape: 'bag', color: '#3a3a34' }, description: 'Coarse black powder. Store away from heat.' },
  mat_components: { id: 'mat_components', name: 'Weapon Parts', type: 'material', weight: 0.2, stack: 40, rarity: 'uncommon', value: 22, icon: { shape: 'gear', color: '#8a8070' }, description: 'Firing pins, springs, sights. Salvaged from broken guns.' },
  mat_resin: { id: 'mat_resin', name: 'Tree Resin', type: 'material', weight: 0.15, stack: 30, rarity: 'common', value: 9, icon: { shape: 'bottle', color: '#a08030' }, description: 'Sticky sap. Seals wounds and waterproofs fabric.' },
  mat_battery_cell: { id: 'mat_battery_cell', name: 'Battery Cells', type: 'electronics', weight: 0.1, stack: 30, rarity: 'uncommon', value: 20, icon: { shape: 'battery', color: '#4a6a4a' }, description: 'Rechargeable lithium cells.' },
  electronics_circuit: { id: 'electronics_circuit', name: 'Circuit Board', type: 'electronics', weight: 0.12, stack: 30, rarity: 'uncommon', value: 28, icon: { shape: 'circuit', color: '#3a6a4a' }, description: 'Intact board. Salvageable for relays and capacitors.' },
  electronics_geiger: { id: 'electronics_geiger', name: 'Geiger Counter', type: 'electronics', weight: 0.4, stack: 1, rarity: 'rare', value: 130, icon: { shape: 'geiger', color: '#7a8a6a' }, description: 'Cracked housing, still clicking.', equip: { slot: 'tool', radiationDetection: true } },

  // ---- tools / equipment -------------------------------------------------
  tool_flashlight: { id: 'tool_flashlight', name: 'Flashlight', type: 'tool', weight: 0.25, stack: 1, rarity: 'common', value: 40, icon: { shape: 'flashlight', color: '#4a4a44' }, description: 'Housing dented, lens scratched, beam still works.', equip: { slot: 'tool', light: true } },
  tool_multitool: { id: 'tool_multitool', name: 'Multitool', type: 'tool', weight: 0.3, stack: 1, rarity: 'uncommon', value: 65, icon: { shape: 'wrench', color: '#8a8a7a' }, description: 'Pliers, files, a blade. Repair and dismantle faster.', equip: { slot: 'tool', repairBonus: 0.35 } },
  equip_jacket: { id: 'equip_jacket', name: 'Padded Jacket', type: 'equipment', weight: 1.8, stack: 1, rarity: 'common', value: 70, icon: { shape: 'armor', color: '#4a4a3a' }, description: 'Keeps the cold out, takes the edge off bites.', equip: { slot: 'armor', armor: 0.10, warmth: 0.55 } },
  equip_vest: { id: 'equip_vest', name: 'Ballistic Vest', type: 'equipment', weight: 3.2, stack: 1, rarity: 'rare', value: 240, icon: { shape: 'armor', color: '#3a4036' }, description: 'Ceramic plates. Heavy, and worth every kilo.', equip: { slot: 'armor', armor: 0.28, warmth: 0.2 } },
  equip_cbrn: { id: 'equip_cbrn', name: 'CBRN Suit', type: 'equipment', weight: 3.6, stack: 1, rarity: 'epic', value: 340, icon: { shape: 'armor', color: '#6a6a4a' }, description: 'Sealed hazmat suit. Blocks radiation and most of what bites.', equip: { slot: 'armor', armor: 0.16, warmth: 0.35, radiationResist: 0.7 } },
  equip_gasmask: { id: 'equip_gasmask', name: 'Gas Mask', type: 'equipment', weight: 1.1, stack: 1, rarity: 'uncommon', value: 120, icon: { shape: 'mask', color: '#3a3a34' }, description: 'Filters smoke and spores. Vision is not great.', equip: { slot: 'head', filters: true } },
  equip_backpack: { id: 'equip_backpack', name: 'Hiker Backpack', type: 'equipment', weight: 1.2, stack: 1, rarity: 'uncommon', value: 110, icon: { shape: 'backpack', color: '#4a4436' }, description: 'Adds 12 kg of carrying capacity.', equip: { slot: 'backpack', capacity: 12 } },
  equip_boots: { id: 'equip_boots', name: 'Climbing Boots', type: 'equipment', weight: 1.0, stack: 1, rarity: 'uncommon', value: 90, icon: { shape: 'boot', color: '#3a3028' }, description: 'Better traction, less noise. Vault higher.', equip: { slot: 'boots', noise: 0.75, vault: 0.25 } },

  // ---- field materials ----------------------------------------------------
  mat_tape: { id: 'mat_tape', name: 'Duct Tape', type: 'material', weight: 0.06, stack: 40, rarity: 'common', value: 7, icon: { shape: 'cloth', color: '#6a6a5a' }, description: 'Half a roll. Fixes everything except the world.' },
  mat_rubber: { id: 'mat_rubber', name: 'Rubber Strips', type: 'material', weight: 0.1, stack: 40, rarity: 'common', value: 8, icon: { shape: 'cloth', color: '#3a3a34' }, description: 'Cut from tyres and hoses. Seals, dampens, grips.' },
  mat_lead: { id: 'mat_lead', name: 'Lead Ingots', type: 'material', weight: 0.4, stack: 30, rarity: 'uncommon', value: 14, icon: { shape: 'gear', color: '#8a8a92' }, description: 'Melted down from plumbing and batteries. Bullet stock.' },
  fuel_bottle: { id: 'fuel_bottle', name: 'Fuel Can', type: 'material', weight: 1.1, stack: 6, rarity: 'uncommon', value: 25, icon: { shape: 'fuel', color: '#a04a2a' }, description: 'Siphoned petrol. Runs generators, burns well.' },

  // ---- weapon attachments ------------------------------------------------
  attach_scope: { id: 'attach_scope', name: '4x Hunting Scope', type: 'attachment', attachment: 'scope4x', weight: 0.5, stack: 1, rarity: 'rare', value: 140, icon: { shape: 'scope', color: '#4a4a42' }, description: 'Fits any railed weapon. Turns distant silhouettes into targets.' },
  attach_suppressor: { id: 'attach_suppressor', name: 'Improvised Suppressor', type: 'attachment', attachment: 'suppressor', weight: 0.7, stack: 1, rarity: 'rare', value: 160, icon: { shape: 'bottle', color: '#3a3a34' }, description: 'Oil filter and steel wool. Quiet, at the cost of stopping power.' },
  attach_extmag: { id: 'attach_extmag', name: 'Extended Magazine', type: 'attachment', attachment: 'extendedMag', weight: 0.35, stack: 1, rarity: 'uncommon', value: 110, icon: { shape: 'bullet', color: '#5a5a4a' }, description: 'Longer body, extra rounds, slower reload.' },
  attach_grip: { id: 'attach_grip', name: 'Foregrip', type: 'attachment', attachment: 'foregrip', weight: 0.3, stack: 1, rarity: 'uncommon', value: 95, icon: { shape: 'wrench', color: '#4a4a42' }, description: 'Taped handle under the barrel. Keeps the muzzle down.' },
  attach_flashlight: { id: 'attach_flashlight', name: 'Weapon Light', type: 'attachment', attachment: 'flashlight', weight: 0.35, stack: 1, rarity: 'uncommon', value: 85, icon: { shape: 'flashlight', color: '#4a4a44' }, description: 'Railed lamp. Lights up whatever is about to bite you.' },

  // ---- throwables --------------------------------------------------------
  grenade_frag: { id: 'grenade_frag', name: 'Frag Grenade', type: 'equipment', grenade: 'frag', weight: 0.45, stack: 4, rarity: 'uncommon', value: 120, icon: { shape: 'grenade', color: '#5a6a4a' }, description: 'Improvised fragmentation charge. Shrapnel, noise, regret.' },
  grenade_molotov: { id: 'grenade_molotov', name: 'Molotov Cocktail', type: 'equipment', grenade: 'fire', weight: 0.7, stack: 4, rarity: 'common', value: 45, icon: { shape: 'bottle', color: '#a0602a' }, description: 'Fuel in glass, rag in the neck. Burns for several seconds.' },

  // ---- heavy equipment / tools ------------------------------------------
  equip_helmet: { id: 'equip_helmet', name: 'Combat Helmet', type: 'equipment', weight: 1.4, stack: 1, rarity: 'uncommon', value: 130, icon: { shape: 'armor', color: '#3a4036' }, description: 'Dented steel shell. Stops fragments and claw strikes.', equip: { slot: 'head', armor: 0.12 } },
  tool_repair: { id: 'tool_repair', name: 'Repair Kit', type: 'tool', weight: 0.8, stack: 3, rarity: 'uncommon', value: 90, icon: { shape: 'wrench', color: '#6a6a5a' }, repair: true, description: 'Files, pins and oil. USE to restore the equipped weapon.' },
  tool_lockpick: { id: 'tool_lockpick', name: 'Lockpick Set', type: 'tool', weight: 0.2, stack: 1, rarity: 'uncommon', value: 85, icon: { shape: 'key', color: '#8a8a7a' }, lockpick: true, description: 'Slim picks that open crates without breaking the lock.' },

  // ---- valuables / quest --------------------------------------------------
  val_watch: { id: 'val_watch', name: 'Gold Watch', type: 'valuable', weight: 0.15, stack: 3, rarity: 'rare', value: 90, icon: { shape: 'watch', color: '#c0a050' }, description: 'Stopped at 04:19. Whoever wore it did not survive the night.' },
  val_family_photo: { id: 'val_family_photo', name: 'Family Photograph', type: 'valuable', weight: 0.02, stack: 5, rarity: 'uncommon', value: 40, icon: { shape: 'photo', color: '#b0a890' }, description: 'Two children, a dog, a summer afternoon. Somebody still looks at it.' },
  val_currency: { id: 'val_currency', name: 'Zone Scrip', type: 'valuable', weight: 0.01, stack: 200, rarity: 'common', value: 1, icon: { shape: 'paper', color: '#8a9a6a' }, description: 'Hand-stamped currency accepted by traders in the Zone.' },
  quest_note: { id: 'quest_note', name: 'Handwritten Note', type: 'quest', weight: 0.02, stack: 1, rarity: 'uncommon', value: 0, icon: { shape: 'paper', color: '#c0b89a' }, quest: true, description: 'You have been asleep for a long time. Do not trust the broadcast. - M.' },
  quest_keycard: { id: 'quest_keycard', name: 'Access Keycard', type: 'quest', weight: 0.05, stack: 1, rarity: 'rare', value: 0, icon: { shape: 'keycard', color: '#6a8a9a' }, quest: true, description: 'Level 3 clearance. The photograph is worn away.' },
  quest_radio_part: { id: 'quest_radio_part', name: 'Signal Amplifier', type: 'quest', weight: 0.6, stack: 1, rarity: 'rare', value: 0, icon: { shape: 'circuit', color: '#7a6a3a' }, quest: true, description: 'The core of a long-range transmitter.' },
  quest_docs: { id: 'quest_docs', name: 'Classified Documents', type: 'quest', weight: 0.1, stack: 1, rarity: 'epic', value: 0, icon: { shape: 'paper', color: '#a8a080' }, quest: true, description: 'PROJECT LAST SIGNAL. Population reduction authorised.' },
  quest_sample: { id: 'quest_sample', name: 'Mutant Tissue Sample', type: 'quest', weight: 0.3, stack: 5, rarity: 'uncommon', value: 0, icon: { shape: 'bottle', color: '#7a5a5a' }, quest: true, description: 'Sealed in a specimen jar. It is still warm.' },
  quest_core: { id: 'quest_core', name: 'Reactor Core Fragment', type: 'quest', weight: 2.0, stack: 1, rarity: 'legendary', value: 0, icon: { shape: 'battery', color: '#7ac07a' }, quest: true, description: 'A palm-sized piece of the thing that ended the world. It hums.' },
  quest_dogtags: { id: 'quest_dogtags', name: 'Dog Tags', type: 'quest', weight: 0.05, stack: 5, rarity: 'common', value: 0, icon: { shape: 'paper', color: '#a0a090' }, quest: true, description: 'Names of soldiers who never came home.' },
  quest_signal_key: { id: 'quest_signal_key', name: 'Signal Handshake Key', type: 'quest', weight: 0.1, stack: 1, rarity: 'legendary', value: 0, icon: { shape: 'circuit', color: '#d0a050' }, quest: true, description: 'The sequence that will let you answer the Last Signal.' },
};

export function itemDef(id) {
  return ITEMS[id] || null;
}

export const AMMO_ITEM_FOR = {
  pistol: 'ammo_pistol',
  magnum: 'ammo_magnum',
  shell: 'ammo_shell',
  rifle: 'ammo_rifle',
  intermediate: 'ammo_intermediate',
  bolt: 'ammo_bolt',
};

export function isStackable(def) {
  return (def.stack ?? 1) > 1;
}

export function itemWeight(id, qty = 1) {
  const d = ITEMS[id];
  return d ? d.weight * qty : 0;
}

export function itemValue(id, qty = 1) {
  const d = ITEMS[id];
  return d ? d.value * qty : 0;
}
