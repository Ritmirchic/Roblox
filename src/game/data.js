// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/data.js — items, weapons, mutants, perks, recipes
// All gameplay content is data-driven so systems stay generic.
// ============================================================

export const CFG = {
  version: '1.0.0',
  title: 'ASHES OF HUMANITY: LAST SIGNAL',
  world: { sizeX: 1400, sizeZ: 1000, cell: 400 },
  player: {
    walkSpeed: 3.5, sprintSpeed: 6.6, crouchSpeed: 1.9, adsSpeed: 2.2,
    jumpVel: 5.0, gravity: -18.0, accel: 18, airAccel: 4,
    height: 1.78, crouchHeight: 1.15, radius: 0.34, eyeHeight: 1.62,
    staminaDrain: 12, staminaRegen: 16, staminaRegenDelay: 0.8,
    interactRange: 2.6, maxCarry: 45,
  },
  survival: {
    hungerRate: 0.028, thirstRate: 0.042, tempRate: 0.06,
    radRate: 0.15, bleedRate: 0.35, infectRate: 0.02, stressRate: 0.03,
    hungerDmg: 0.02, thirstDmg: 0.03, coldDmg: 0.05, radDmg: 0.25,
  },
  xp: { base: 120, factor: 1.115, max: 50 },
  loot: { respawn: 900 },
};

// ------------------------------------------------------------------
// ITEMS — 'grid' = [w,h] inventory footprint
// ------------------------------------------------------------------
export const ITEMS = {
  // --- consumables ---
  water_bottle: { name: 'Bottled Water', cat: 'water', grid: [1, 2], weight: 0.6, stack: 5, value: 12, desc: 'Cloudy but drinkable. Restores hydration.', use: { thirst: 42, stress: -3 }, color: '#8fb6c9' },
  water_dirty: { name: 'Dirty Water', cat: 'water', grid: [1, 2], weight: 0.6, stack: 5, value: 4, desc: 'Brown, metallic. Hydrates but risks infection.', use: { thirst: 34, infection: 6 }, color: '#7d7a56' },
  water_purified: { name: 'Purified Water', cat: 'water', grid: [1, 2], weight: 0.6, stack: 5, value: 24, desc: 'Filtered and boiled. Clean.', use: { thirst: 55, stress: -4 }, color: '#a9d3e4' },
  canned_food: { name: 'Canned Meat', cat: 'food', grid: [1, 1], weight: 0.4, stack: 8, value: 16, desc: 'Decades past expiry. Still sealed.', use: { hunger: 38 }, color: '#b5765a' },
  crackers: { name: 'Army Crackers', cat: 'food', grid: [1, 1], weight: 0.25, stack: 10, value: 9, desc: 'Dry ration bricks. Taste like cardboard.', use: { hunger: 20, thirst: -5 }, color: '#c9b48a' },
  jerky: { name: 'Dried Meat', cat: 'food', grid: [1, 1], weight: 0.3, stack: 8, value: 20, desc: 'Unclear origin. Smoked thoroughly.', use: { hunger: 30, stress: -2 }, color: '#8b5a44' },
  mushrooms: { name: 'Glow Mushrooms', cat: 'food', grid: [1, 1], weight: 0.15, stack: 12, value: 6, desc: 'From the tunnels. Mildly toxic, strangely filling.', use: { hunger: 14, radiation: 4 }, color: '#9dbf7a' },
  energy_bar: { name: 'Energy Bar', cat: 'food', grid: [1, 1], weight: 0.2, stack: 8, value: 18, desc: 'Raises stamina ceiling briefly.', use: { hunger: 18, stamina: 40 }, color: '#c5a35a' },

  bandage: { name: 'Bandage', cat: 'medicine', grid: [1, 1], weight: 0.1, stack: 10, value: 10, desc: 'Stops bleeding. Stops infection from spreading.', use: { bleed: -40, health: 8 }, color: '#d8d2c4' },
  medkit: { name: 'Field Medkit', cat: 'medicine', grid: [2, 1], weight: 0.9, stack: 4, value: 48, desc: 'Sutures, antiseptic, morphine ampoule.', use: { health: 65, bleed: -100 }, color: '#c9d6cf' },
  painkillers: { name: 'Painkillers', cat: 'medicine', grid: [1, 1], weight: 0.1, stack: 10, value: 22, desc: 'Masks pain. Clears stress.', use: { health: 12, stress: -30 }, color: '#e0d8cc' },
  antibiotics: { name: 'Antibiotics', cat: 'medicine', grid: [1, 1], weight: 0.1, stack: 6, value: 55, desc: 'Treats infection outright.', use: { infection: -80, health: 6 }, color: '#cfd8e0' },
  antirad: { name: 'Anti-Rad Injection', cat: 'medicine', grid: [1, 1], weight: 0.15, stack: 5, value: 60, desc: 'Binds isotopes in the blood.', use: { radiation: -70 }, color: '#c3b1d8' },
  splint: { name: 'Splint', cat: 'medicine', grid: [2, 1], weight: 0.5, stack: 3, value: 34, desc: 'Fixes fractured limbs.', use: { fracture: -100 }, color: '#b8a483' },
  stim_combat: { name: 'Combat Stim', cat: 'medicine', grid: [1, 1], weight: 0.05, stack: 6, value: 70, desc: 'Combat stim. Slows bleeding, sharpens aim.', use: { health: 25, stamina: 100, stress: -20 }, color: '#c96a5a' },

  battery: { name: 'Battery Cell', cat: 'electronics', grid: [1, 1], weight: 0.2, stack: 12, value: 14, desc: 'Powers the flashlight. Barely holds charge.', color: '#5f7d6a' },
  scrap: { name: 'Scrap Metal', cat: 'materials', grid: [1, 1], weight: 0.5, stack: 40, value: 6, desc: 'Twisted steel. Base of most recipes.', color: '#8d8d8d' },
  wood_plank: { name: 'Wood Plank', cat: 'materials', grid: [1, 2], weight: 1.2, stack: 30, value: 5, desc: 'Splintered but usable.', color: '#a08055' },
  cloth: { name: 'Cloth Scraps', cat: 'materials', grid: [1, 1], weight: 0.2, stack: 40, value: 4, desc: 'Torn fabric. Dressings, straps, patching.', color: '#a09a88' },
  duct_tape: { name: 'Duct Tape', cat: 'materials', grid: [1, 1], weight: 0.3, stack: 15, value: 10, desc: 'Holds the world together.', color: '#9d9880' },
  wire: { name: 'Copper Wire', cat: 'materials', grid: [1, 1], weight: 0.2, stack: 20, value: 8, desc: 'Salvaged from walls and engines.', color: '#b0713c' },
  chemicals: { name: 'Chemicals', cat: 'materials', grid: [1, 1], weight: 0.6, stack: 16, value: 12, desc: 'Unlabelled industrial solvent.', color: '#8fa07a' },
  gunpowder: { name: 'Gunpowder', cat: 'materials', grid: [1, 1], weight: 0.3, stack: 30, value: 15, desc: 'Ground from propellant.', color: '#585551' },
  fuel: { name: 'Diesel Canister', cat: 'materials', grid: [2, 2], weight: 3.0, stack: 3, value: 40, desc: 'Fuel for generators and fire.', color: '#c0a34a' },
  electronics: { name: 'Circuit Board', cat: 'electronics', grid: [1, 1], weight: 0.2, stack: 10, value: 32, desc: 'Scavenged control board. Why is it warm?', color: '#4a7a5a' },
  lens: { name: 'Optical Lens', cat: 'electronics', grid: [1, 1], weight: 0.1, stack: 8, value: 28, desc: 'Ground glass from a dead camera.', color: '#7fa4b0' },
  filter: { name: 'Gas Mask Filter', cat: 'electronics', grid: [1, 1], weight: 0.3, stack: 6, value: 36, desc: 'Filters fallout particulates.', color: '#77776a' },
  keycard: { name: 'ZONE Keycard', cat: 'quest', grid: [1, 1], weight: 0.05, stack: 1, value: 0, desc: 'Level-3 clearance. Red stripe worn away.', color: '#a34b4b' },
  dogtag: { name: 'Dog Tags', cat: 'quest', grid: [1, 1], weight: 0.02, stack: 20, value: 15, desc: 'Names of people nobody came back for.', color: '#b9b2a0' },
  green_badge: { name: 'Green Badge', cat: 'quest', grid: [1, 1], weight: 0.05, stack: 3, value: 0, desc: 'Marks the bearer as a Warden. Others will notice.', color: '#7fae72' },
  signal_core: { name: 'Signal Core', cat: 'quest', grid: [2, 2], weight: 2.0, stack: 1, value: 0, desc: 'A fist of black crystal that hums at 14.7 kilohertz.', color: '#7a5fa8' },
  record_tape: { name: 'Magnetic Tape', cat: 'quest', grid: [1, 1], weight: 0.1, stack: 6, value: 5, desc: 'A recording. Somebody is still speaking on it.', color: '#6a5f4a' },
  artifact_shard: { name: 'Resonance Shard', cat: 'quest', grid: [1, 1], weight: 0.3, stack: 10, value: 120, desc: 'Crystallised sound. Worth a fortune to the right collector.', color: '#8fa8c8' },

  // --- armor / equipment ---
  gasmask: { name: 'Gas Mask', cat: 'armor', slot: 'head', grid: [2, 1], weight: 1.1, value: 60, armor: 6, radResist: 0.45, desc: 'Filters air. Radiation resistance.', color: '#6f7a6a' },
  kevlar_vest: { name: 'Kevlar Vest', cat: 'armor', slot: 'body', grid: [2, 2], weight: 4.0, value: 140, armor: 42, desc: 'Stops pistol rounds. Barely.', color: '#5f6550' },
  warden_coat: { name: 'Warden Coat', cat: 'armor', slot: 'body', grid: [2, 2], weight: 3.2, value: 240, armor: 38, radResist: 0.2, desc: 'Rubberised coat of a signal warden.', color: '#4a5240' },
  hazmat_suit: { name: 'Hazmat Suit', cat: 'armor', slot: 'body', grid: [2, 2], weight: 5.0, value: 320, armor: 12, radResist: 0.85, desc: 'Sealed against the red waste.', color: '#c4b158' },
  backpack_small: { name: 'Canvas Pack', cat: 'equipment', slot: 'back', grid: [2, 2], weight: 1.0, value: 20, carry: 12, desc: 'Adds 12 kg of carry capacity.', color: '#7a6a4f' },
  backpack_military: { name: 'Military Rucksack', cat: 'equipment', slot: 'back', grid: [2, 3], weight: 1.6, value: 90, carry: 26, desc: 'Adds 26 kg of carry capacity.', color: '#4d5443' },
  flashlight: { name: 'Damaged Flashlight', cat: 'equipment', slot: 'light', grid: [1, 2], weight: 0.4, value: 15, desc: 'Flickers. Powerful enough to find a door.', color: '#8f8f7a' },
  flashlight_hd: { name: 'Rail Flashlight', cat: 'equipment', slot: 'light', grid: [1, 1], weight: 0.3, value: 55, desc: 'Steady beam. Mounts on a weapon rail.', color: '#8fa4b0' },
  radio: { name: 'Old Radio', cat: 'equipment', slot: 'utility', grid: [2, 1], weight: 1.2, value: 40, desc: 'A relic from your brother. Sometimes it speaks.', color: '#6e5a3f' },
  geiger: { name: 'Geiger Counter', cat: 'equipment', slot: 'utility', grid: [1, 1], weight: 0.5, value: 65, desc: 'Clicks faster near the hot zones.', color: '#6b7d5a' },
};

// ------------------------------------------------------------------
// WEAPONS
// ------------------------------------------------------------------
export const WEAPONS = {
  knife: {
    name: 'Hunting Knife', type: 'melee', dmg: 26, rate: 2.6, range: 1.9, stam: 6, weight: 0.4, grid: [1, 2],
    durability: 220, crit: 0.18, desc: 'A blade worn down by years of work.', color: '#8a8f96',
  },
  pipe: {
    name: 'Rebar Club', type: 'melee', dmg: 34, rate: 1.7, range: 2.3, stam: 10, weight: 2.2, grid: [1, 3],
    durability: 340, crit: 0.1, desc: 'Heavy, unbalanced, and always in reach.', color: '#7d6a58',
  },
  fireaxe: {
    name: 'Fire Axe', type: 'melee', dmg: 58, rate: 1.15, range: 2.5, stam: 18, weight: 3.4, grid: [2, 3],
    durability: 420, crit: 0.16, desc: 'Stamped PROPERTY OF CITY FIRE DEPT. swings like guilt.', color: '#8b3a2f',
  },
  machete: {
    name: 'Machete', type: 'melee', dmg: 44, rate: 2.0, range: 2.2, stam: 11, weight: 1.2, grid: [1, 3],
    durability: 300, crit: 0.15, desc: 'Farming tool, repurposed.', color: '#7f8a70',
  },
  pistol: {
    name: 'Makarov SM', type: 'pistol', dmg: 24, rate: 5.2, mag: 8, reserveType: 'ammo_9mm', spread: 0.9,
    recoil: 1.5, range: 90, weight: 0.9, grid: [2, 1], durability: 260, reload: 1.55,
    attachments: ['suppressor', 'laser'], desc: 'Sidearm of the old militia. Reliable, underpowered.', color: '#6d7278',
  },
  revolver: {
    name: 'Model 64 Revolver', type: 'pistol', dmg: 46, rate: 2.4, mag: 6, reserveType: 'ammo_38', spread: 0.7,
    recoil: 2.6, range: 110, weight: 1.2, grid: [2, 1], durability: 320, reload: 2.4, crit: 0.12,
    attachments: ['scope_small'], desc: 'A hunting revolver. Few rounds, loud consequences.', color: '#8a8272',
  },
  shotgun: {
    name: 'Double-Barrel', type: 'shotgun', dmg: 22, pellets: 9, rate: 1.4, mag: 2, reserveType: 'ammo_12g',
    spread: 5.5, recoil: 5.5, range: 28, weight: 3.6, grid: [3, 2], durability: 300, reload: 2.1,
    attachments: [], desc: 'Break-action. Two chances, then you swing it.', color: '#7a5c40',
  },
  pump_shotgun: {
    name: 'Pump Shotgun', type: 'shotgun', dmg: 20, pellets: 9, rate: 1.9, mag: 6, reserveType: 'ammo_12g',
    spread: 4.8, recoil: 4.2, range: 34, weight: 4.1, grid: [3, 2], durability: 420, reload: 3.2,
    attachments: ['flashlight', 'receiver'], desc: 'Police issue. Every pump cycle is a promise.', color: '#4f5448',
  },
  hunting_rifle: {
    name: 'Hunting Rifle', type: 'rifle', dmg: 82, rate: 0.85, mag: 5, reserveType: 'ammo_762',
    spread: 0.18, recoil: 3.4, range: 260, weight: 4.4, grid: [4, 2], durability: 340, reload: 2.8,
    attachments: ['scope_medium', 'suppressor'], crit: 0.22, desc: 'Bolt-action. A single breath, a single shot.', color: '#6a5a44',
  },
  assault_rifle: {
    name: 'AK-Pattern Rifle', type: 'rifle', dmg: 38, rate: 8.6, mag: 30, reserveType: 'ammo_762',
    spread: 1.15, recoil: 2.2, range: 220, weight: 4.9, grid: [4, 2], durability: 520, reload: 2.5,
    attachments: ['scope_small', 'suppressor', 'flashlight', 'receiver'], auto: true, desc: 'Standard of the exclusion zone garrison.', color: '#6b5334',
  },
  smg: {
    name: 'Scav SMG', type: 'smg', dmg: 19, rate: 12.0, mag: 25, reserveType: 'ammo_9mm',
    spread: 1.9, recoil: 1.1, range: 70, weight: 3.0, grid: [3, 2], durability: 380, reload: 2.0,
    attachments: ['suppressor', 'laser'], auto: true, desc: 'Welded from three dead guns and hope.', color: '#59605a',
  },
  crossbow: {
    name: 'Compound Crossbow', type: 'bow', dmg: 68, rate: 0.6, mag: 1, reserveType: 'ammo_bolt',
    spread: 0.09, recoil: 0.6, range: 140, weight: 5.2, grid: [4, 2], durability: 260, reload: 3.4,
    attachments: ['scope_small'], silent: true, crit: 0.3, desc: 'Silent. Retrievable. Slower than fear.', color: '#3f4a3c',
  },
  improvised_shotgun: {
    name: 'Pipe Shotgun', type: 'shotgun', dmg: 17, pellets: 6, rate: 0.7, mag: 1, reserveType: 'ammo_12g',
    spread: 7.5, recoil: 7.0, range: 16, weight: 2.8, grid: [3, 1], durability: 90, reload: 2.8,
    attachments: [], desc: 'One pipe, one nail, one bad decision. May burst.', color: '#6a6355',
  },
};

export const AMMO = {
  ammo_9mm: { name: '9x18mm Rounds', grid: [1, 1], weight: 0.012, stack: 60, value: 2, color: '#b3a06a' },
  ammo_38: { name: '.38 Special', grid: [1, 1], weight: 0.016, stack: 40, value: 3, color: '#c0a878' },
  ammo_12g: { name: '12ga Shells', grid: [1, 1], weight: 0.05, stack: 24, value: 5, color: '#b0442f' },
  ammo_762: { name: '7.62x39mm Rounds', grid: [1, 1], weight: 0.022, stack: 45, value: 4, color: '#c09a58' },
  ammo_bolt: { name: 'Crossbow Bolts', grid: [1, 2], weight: 0.06, stack: 12, value: 8, color: '#8a7a5c' },
};

export const ATTACHMENTS = {
  scope_small: { name: 'Reflex Sight', desc: 'Tighter hip spread, faster ADS.', spread: -0.25, adsMul: 0.85 },
  scope_medium: { name: 'Hunting Scope', desc: 'Long-range clarity.', spread: -0.45, adsMul: 0.7, zoom: 1.6 },
  suppressor: { name: 'Suppressor', desc: 'Quieter shots, less recoil, less damage.', spread: -0.1, recoil: -0.35, dmgMul: 0.9, quiet: true },
  flashlight: { name: 'Rail Flashlight', desc: 'See in the dark without putting the gun away.', light: true },
  laser: { name: 'Laser Sight', desc: 'Greatly reduced hip-fire spread.', spread: -0.4 },
  receiver: { name: 'Match Receiver', desc: 'Higher rate of fire, better durability.', rateMul: 1.12, durabilityMul: 1.25 },
};

// ------------------------------------------------------------------
// MUTANTS
// ------------------------------------------------------------------
export const MUTANTS = {
  hollow: {
    name: 'The Hollow', hp: 90, speed: 3.9, dmg: 14, atkRange: 1.9, atkRate: 1.3, sight: 26, hearing: 34,
    scale: 1.05, xp: 45, threat: 1, regions: ['suburbs', 'city', 'industrial'],
    build: 'humanoid', skin: 'flesh', eyes: '#c9d8a0',
    desc: 'A person whose face has been sanded away by something that feeds on sound.',
    tactics: 'Hunts noise. Staggers at close range, screams when it loses you.',
  },
  crawler: {
    name: 'Crawler', hp: 55, speed: 6.4, dmg: 11, atkRange: 1.6, atkRate: 2.2, sight: 18, hearing: 26,
    scale: 0.62, xp: 30, threat: 1, regions: ['suburbs', 'forest', 'industrial', 'city'],
    build: 'quadruped', skin: 'flesh', eyes: '#e0e0c0',
    desc: 'Low, fast, jointed wrong. It runs on four limbs and does not slow for corners.',
    tactics: 'Circles, feints, attacks from behind. Retreats when shot.',
  },
  watcher: {
    name: 'Watcher', hp: 130, speed: 2.2, dmg: 22, atkRange: 12, atkRate: 0.5, sight: 55, hearing: 20,
    scale: 1.9, xp: 90, threat: 2, regions: ['forest', 'city', 'military', 'wasteland'],
    build: 'tall', skin: 'flesh', eyes: '#a8d0ff', ranged: true,
    desc: 'It stands at the treeline and looks. When it stops looking, it opens.',
    tactics: 'Keeps distance, fires resonance pulses, calls others when you hide.',
  },
  screamer: {
    name: 'Screamer', hp: 160, speed: 3.2, dmg: 9, atkRange: 2.4, atkRate: 0.8, sight: 30, hearing: 40,
    scale: 1.3, xp: 80, threat: 2, regions: ['industrial', 'city', 'military'],
    build: 'bloated', skin: 'flesh', eyes: '#ff9a7a',
    desc: 'Bloated with a sound it cannot stop making. It brings the others.',
    tactics: 'Screams to summon. Explodes into corrosive gas when killed.',
  },
  brute: {
    name: 'Brute', hp: 520, speed: 2.9, dmg: 38, atkRange: 2.8, atkRate: 0.9, sight: 24, hearing: 22,
    scale: 1.7, xp: 220, threat: 3, regions: ['industrial', 'military', 'wasteland'],
    build: 'brute', skin: 'armor', eyes: '#ffb060', armor: 0.35,
    desc: 'A wall of fused muscle and rusted plating. Slow until it is not.',
    tactics: 'Charges, staggers hard, grabs. Weak at the exposed spine.',
  },
  mimic: {
    name: 'Mimic', hp: 140, speed: 4.4, dmg: 26, atkRange: 2.2, atkRate: 1.1, sight: 20, hearing: 30,
    scale: 1.2, xp: 110, threat: 2, regions: ['suburbs', 'forest', 'city'],
    build: 'humanoid', skin: 'flesh', eyes: '#c0a0e0',
    desc: 'It copies the sound of a child calling for help. It has been practising.',
    tactics: 'Mimics distress sounds to lure you, then ambushes. Flees at low health.',
  },
  burrower: {
    name: 'Burrower', hp: 110, speed: 5.0, dmg: 20, atkRange: 2.0, atkRate: 1.5, sight: 12, hearing: 45,
    scale: 0.9, xp: 100, threat: 2, regions: ['forest', 'wasteland', 'industrial'],
    build: 'quadruped', skin: 'armor', eyes: '#a0ffd0', burrow: true,
    desc: 'It travels under the ground. You hear the soil shift before you see it.',
    tactics: 'Burrows, surfaces behind the player, drags you down.',
  },
  stalker: {
    name: 'Stalker', hp: 190, speed: 5.4, dmg: 30, atkRange: 2.2, atkRate: 1.4, sight: 40, hearing: 16,
    scale: 1.35, xp: 160, threat: 3, regions: ['forest', 'city', 'military'],
    build: 'tall', skin: 'flesh', eyes: '#ff6040', stealth: true,
    desc: 'It waits until you are alone and your light is off. Then it is closer than it was.',
    tactics: 'Stalks invisibly, attacks isolated players, retreats from groups.',
  },
  contaminated: {
    name: 'The Contaminated', hp: 240, speed: 3.4, dmg: 24, atkRange: 2.4, atkRate: 1.0, sight: 28, hearing: 26,
    scale: 1.25, xp: 170, threat: 3, regions: ['wasteland', 'industrial'],
    build: 'humanoid', skin: 'radiation', eyes: '#a0ff60', radioactive: true,
    desc: 'A body that kept moving after the isotope did its work.',
    tactics: 'Irradiates the area around it. Attacks leave radiation.',
  },
  pale: {
    name: 'The Pale One', hp: 300, speed: 6.0, dmg: 34, atkRange: 2.4, atkRate: 1.8, sight: 50, hearing: 30,
    scale: 1.5, xp: 300, threat: 4, regions: ['forest', 'wasteland', 'military'], nocturnal: true,
    build: 'tall', skin: 'flesh', eyes: '#ffffff', albino: true,
    desc: 'Rare. Nocturnal. It does not chase — it arrives.',
    tactics: 'Ambushes at night, disappears in light, extremely fast.',
  },
};

// ------------------------------------------------------------------
// BOSSES — multi-phase arena encounters
// ------------------------------------------------------------------
export const BOSSES = {
  hollow_king: {
    name: 'THE HOLLOW KING', mutant: 'hollow', hp: 2600, scale: 2.3, phases: 3, xp: 1800,
    region: 'suburbs', arena: 'hollow_church',
    desc: 'The first thing that learned to command the others. It wears a crown of jawbones.',
    attacks: ['sweep', 'summon', 'scream_shock'],
    phaseText: ['IT HEARS EVERY STEP', 'THE CHOIR ANSWERS', 'NO MORE SOUND'],
  },
  iron_abomination: {
    name: 'THE IRON ABOMINATION', mutant: 'brute', hp: 4200, scale: 2.6, phases: 3, xp: 2600,
    region: 'industrial', arena: 'foundry_pit',
    desc: 'A forging machine that grew hungry, and then grew arms.',
    attacks: ['charge', 'furnace_blast', 'debris_throw'],
    phaseText: ['THE FORGE WAKES', 'MOLTEN FURY', 'SCRAP AND BONE'],
  },
  forest_matriarch: {
    name: 'THE FOREST MATRIARCH', mutant: 'stalker', hp: 3600, scale: 2.4, phases: 3, xp: 2400,
    region: 'forest', arena: 'nest_clearing',
    desc: 'Older than the forest. The nest is hers; everything in it is hers.',
    attacks: ['lunge', 'spawn_brood', 'web_bind'],
    phaseText: ['SHE WAS ALWAYS HERE', 'THE BROOD STIRS', 'ROOT AND BONE'],
  },
  contaminated_titan: {
    name: 'THE CONTAMINATED TITAN', mutant: 'contaminated', hp: 5200, scale: 3.0, phases: 3, xp: 3200,
    region: 'wasteland', arena: 'crater_rim',
    desc: 'A cooling tower that stood in the wrong place on the wrong day.',
    attacks: ['rad_burst', 'stomp', 'toxic_wave'],
    phaseText: ['THE AIR BURNS', 'HOT ZONE', 'ISOTOPE FURY'],
  },
  pale_commander: {
    name: 'THE PALE COMMANDER', mutant: 'pale', hp: 4800, scale: 2.2, phases: 3, xp: 3400,
    region: 'military', arena: 'bunker_gate',
    desc: 'Someone signed orders here, once. Then kept signing them after.',
    attacks: ['slash_combo', 'phase_shift', 'order_assault'],
    phaseText: ['ORDERS ARE ORDERS', 'YOU WERE NOT ON THE LIST', 'DISMISSED'],
  },
  last_signal: {
    name: 'THE LAST SIGNAL', mutant: 'watcher', hp: 7000, scale: 4.2, phases: 4, xp: 5000,
    region: 'wasteland', arena: 'signal_array',
    desc: 'It is not a creature. It is the broadcast that kept everyone listening.',
    attacks: ['resonance_wave', 'askarene', 'echo_swarm', 'collapse'],
    phaseText: ['DO YOU HEAR IT', 'IT KNOWS YOUR NAME', 'STOP LISTENING', '...'],
  },
};

// ------------------------------------------------------------------
// SKILL TREES
// ------------------------------------------------------------------
export const SKILLS = {
  combat: {
    name: 'COMBAT', icon: 'crosshair', color: '#c05a4a',
    nodes: [
      { id: 'c1', name: 'Steady Hands', max: 5, desc: '+6% weapon accuracy per rank.', effect: 'accuracy', per: 0.06, req: [] },
      { id: 'c2', name: 'Trigger Discipline', max: 5, desc: '-8% recoil per rank.', effect: 'recoil', per: -0.08, req: ['c1'] },
      { id: 'c3', name: 'Brutal Cuts', max: 4, desc: '+15% melee damage per rank.', effect: 'meleeDmg', per: 0.15, req: [] },
      { id: 'c4', name: 'Quick Reload', max: 3, desc: '-12% reload time per rank.', effect: 'reload', per: -0.12, req: ['c2'] },
      { id: 'c5', name: 'Weak Point Insight', max: 3, desc: '+20% critical damage per rank.', effect: 'critDmg', per: 0.2, req: ['c1'] },
      { id: 'c6', name: 'Adrenaline', max: 3, desc: '+8 speed and +10% damage below 30% health.', effect: 'adrenaline', per: 1, req: ['c2'] },
      { id: 'c7', name: 'Killing Floor', max: 3, desc: 'Kills restore 8% stamina.', effect: 'killStamina', per: 0.08, req: ['c3'] },
    ],
  },
  survival: {
    name: 'SURVIVAL', icon: 'heart', color: '#8fae6a',
    nodes: [
      { id: 's1', name: 'Iron Stomach', max: 4, desc: '-15% hunger and thirst drain.', effect: 'consumeRate', per: -0.15, req: [] },
      { id: 's2', name: 'Second Wind', max: 5, desc: '+12 max stamina per rank.', effect: 'staminaMax', per: 12, req: [] },
      { id: 's3', name: 'Thick Skin', max: 5, desc: '+8 max health per rank.', effect: 'healthMax', per: 8, req: [] },
      { id: 's4', name: 'Field Medicine', max: 4, desc: '+20% healing effectiveness.', effect: 'healing', per: 0.2, req: ['s3'] },
      { id: 's5', name: 'Cold Blooded', max: 3, desc: 'Halves temperature and radiation accumulation.', effect: 'resistEnv', per: 0.33, req: ['s1'] },
      { id: 's6', name: 'Pain Tolerance', max: 3, desc: 'Bleeding and fracture penalties reduced.', effect: 'bleedResist', per: 0.3, req: ['s3'] },
      { id: 's7', name: 'Pack Rat', max: 3, desc: '+5kg carry capacity per rank.', effect: 'carry', per: 5, req: [] },
    ],
  },
  engineering: {
    name: 'ENGINEERING', icon: 'wrench', color: '#6a9ab0',
    nodes: [
      { id: 'e1', name: 'Scrapper', max: 5, desc: '+20% materials from disassembly.', effect: 'salvage', per: 0.2, req: [] },
      { id: 'e2', name: 'Gunsmith', max: 5, desc: 'Craft weapons and ammo at 1 rank cheaper materials.', effect: 'craftCheap', per: 1, req: ['e1'] },
      { id: 'e3', name: 'Field Repair', max: 4, desc: '+25% weapon durability restored.', effect: 'repair', per: 0.25, req: [] },
      { id: 'e4', name: 'Armorer', max: 3, desc: '+10% armor effectiveness.', effect: 'armor', per: 0.1, req: ['e3'] },
      { id: 'e5', name: 'Builder', max: 4, desc: 'Structures have +30% health.', effect: 'buildHp', per: 0.3, req: ['e1'] },
      { id: 'e6', name: 'Electronics', max: 3, desc: 'Craft advanced components and blueprints.', effect: 'electronics', per: 1, req: ['e2'] },
    ],
  },
  exploration: {
    name: 'EXPLORATION', icon: 'compass', color: '#c9a86a',
    nodes: [
      { id: 'x1', name: 'Keen Eye', max: 5, desc: 'Highlight loot 6m further per rank.', effect: 'lootSense', per: 6, req: [] },
      { id: 'x2', name: 'Quiet Step', max: 4, desc: '-15% noise generated.', effect: 'noise', per: -0.15, req: [] },
      { id: 'x3', name: 'Marathoner', max: 4, desc: '-12% sprint stamina drain.', effect: 'sprint', per: -0.12, req: ['x2'] },
      { id: 'x4', name: 'Scavenger', max: 5, desc: '+15% chance of extra loot.', effect: 'lootBonus', per: 0.15, req: ['x1'] },
      { id: 'x5', name: 'Sixth Sense', max: 3, desc: 'Enemies within 20m are marked briefly.', effect: 'sense', per: 1, req: ['x1'] },
      { id: 'x6', name: 'Climber', max: 2, desc: 'Vault faster and higher.', effect: 'climb', per: 1, req: ['x3'] },
    ],
  },
};

// ------------------------------------------------------------------
// CRAFTING
// ------------------------------------------------------------------
export const RECIPES = [
  { id: 'r_bandage', out: ['bandage', 2], in: { cloth: 2 }, time: 1.0, bench: 0, cat: 'Medical' },
  { id: 'r_medkit', out: ['medkit', 1], in: { bandage: 2, chemicals: 1, cloth: 1 }, time: 3.0, bench: 1, cat: 'Medical' },
  { id: 'r_purified', out: ['water_purified', 1], in: { water_dirty: 1, cloth: 1 }, time: 4.0, bench: 0, cat: 'Survival' },
  { id: 'r_antirad', out: ['antirad', 1], in: { chemicals: 1, mushrooms: 2, water_purified: 1 }, time: 4.0, bench: 1, cat: 'Medical' },
  { id: 'r_antibiotics', out: ['antibiotics', 1], in: { chemicals: 1, mushrooms: 3 }, time: 5.0, bench: 1, cat: 'Medical' },
  { id: 'r_splint', out: ['splint', 1], in: { wood_plank: 1, cloth: 2 }, time: 2.0, bench: 0, cat: 'Medical' },
  { id: 'r_stim', out: ['stim_combat', 1], in: { chemicals: 1, electronics: 1, water_purified: 1 }, time: 6.0, bench: 1, cat: 'Medical' },
  { id: 'r_ammo_9mm', out: ['ammo_9mm', 12], in: { gunpowder: 2, scrap: 1 }, time: 2.0, bench: 1, cat: 'Ammunition' },
  { id: 'r_ammo_762', out: ['ammo_762', 10], in: { gunpowder: 3, scrap: 2 }, time: 2.5, bench: 1, cat: 'Ammunition' },
  { id: 'r_ammo_12g', out: ['ammo_12g', 6], in: { gunpowder: 2, scrap: 1, chemicals: 1 }, time: 2.5, bench: 1, cat: 'Ammunition' },
  { id: 'r_ammo_bolt', out: ['ammo_bolt', 3], in: { wood_plank: 1, scrap: 1, cloth: 1 }, time: 2.0, bench: 1, cat: 'Ammunition' },
  { id: 'r_pipe', out: ['pipe', 1], in: { scrap: 3, duct_tape: 1 }, time: 3.0, bench: 1, cat: 'Weapons' },
  { id: 'r_improvised', out: ['improvised_shotgun', 1], in: { scrap: 6, duct_tape: 2, gunpowder: 1 }, time: 6.0, bench: 1, cat: 'Weapons' },
  { id: 'r_knife', out: ['knife', 1], in: { scrap: 2, wood_plank: 1, duct_tape: 1 }, time: 3.0, bench: 1, cat: 'Weapons' },
  { id: 'r_repair', out: ['scrap', 1], in: {}, time: 0.2, bench: 0, cat: 'Hidden' },
  { id: 'r_battery', out: ['battery', 1], in: { chemicals: 1, wire: 1, electronics: 1 }, time: 3.0, bench: 1, cat: 'Tools' },
  { id: 'r_filter', out: ['filter', 1], in: { cloth: 2, chemicals: 1, scrap: 1 }, time: 4.0, bench: 1, cat: 'Tools' },
  { id: 'r_gasmask', out: ['gasmask', 1], in: { filter: 1, cloth: 3, duct_tape: 2 }, time: 8.0, bench: 2, cat: 'Equipment' },
  { id: 'r_kevlar', out: ['kevlar_vest', 1], in: { cloth: 6, scrap: 4, duct_tape: 3 }, time: 12.0, bench: 2, cat: 'Equipment' },
  { id: 'r_backpack', out: ['backpack_small', 1], in: { cloth: 5, duct_tape: 2 }, time: 6.0, bench: 1, cat: 'Equipment' },
  { id: 'r_backpack_mil', out: ['backpack_military', 1], in: { cloth: 8, scrap: 3, duct_tape: 3 }, time: 10.0, bench: 2, cat: 'Equipment' },
  { id: 'r_trap', out: ['trap_spike', 1], in: { wood_plank: 3, scrap: 3 }, time: 5.0, bench: 1, cat: 'Building' },
  { id: 'r_torch', out: ['torch', 1], in: { wood_plank: 1, cloth: 2, fuel: 0 }, time: 1.0, bench: 0, cat: 'Survival' },
];

// Buildable structures
export const BUILDABLES = [
  { id: 'b_wall_wood', name: 'Wooden Wall', size: [2.4, 2.8, 0.18], cost: { wood_plank: 3 }, hp: 260, cat: 'Structure' },
  { id: 'b_wall_metal', name: 'Sheet Metal Wall', size: [2.4, 2.8, 0.12], cost: { scrap: 4 }, hp: 420, cat: 'Structure' },
  { id: 'b_floor', name: 'Floor Section', size: [2.4, 0.16, 2.4], cost: { wood_plank: 2 }, hp: 200, cat: 'Structure' },
  { id: 'b_door', name: 'Door Frame', size: [1.4, 2.2, 0.2], cost: { wood_plank: 2, scrap: 1 }, hp: 220, cat: 'Structure', door: true },
  { id: 'b_barricade', name: 'Barricade', size: [2.2, 1.3, 0.4], cost: { wood_plank: 2, scrap: 2 }, hp: 180, cat: 'Defense' },
  { id: 'b_storage', name: 'Storage Crate', size: [1.2, 1.0, 0.9], cost: { wood_plank: 2 }, hp: 150, cat: 'Utility', storage: 24 },
  { id: 'b_workbench', name: 'Workbench', size: [1.8, 0.95, 0.9], cost: { wood_plank: 4, scrap: 3 }, hp: 200, cat: 'Utility', bench: true },
  { id: 'b_lamp', name: 'Hanging Lamp', size: [0.4, 0.5, 0.4], cost: { scrap: 1, wire: 2, battery: 1 }, hp: 60, cat: 'Utility', light: true },
  { id: 'b_fire', name: 'Campfire', size: [1.0, 0.5, 1.0], cost: { wood_plank: 3, cloth: 1 }, hp: 80, cat: 'Utility', light: true, warmth: true },
  { id: 'b_trap', name: 'Spike Trap', size: [1.2, 0.3, 1.2], cost: { wood_plank: 2, scrap: 2 }, hp: 90, cat: 'Defense', damage: 45 },
];

// ------------------------------------------------------------------
// LOOT TABLES by container type
// ------------------------------------------------------------------
const L = (id, w, min = 1, max = 1) => ({ id, w, min, max });
export const LOOT = {
  house: [
    L('cloth', 22, 1, 4), L('canned_food', 16), L('water_dirty', 14), L('scrap', 12, 1, 3),
    L('bandage', 10), L('battery', 8), L('crackers', 10), L('water_bottle', 8), L('duct_tape', 6),
    L('pistol', 2), L('ammo_9mm', 6, 4, 12), L('knife', 3), L('jerky', 7), L('painkillers', 4),
    L('radio', 1), L('backpack_small', 2), L('wood_plank', 8, 1, 2),
  ],
  kitchen: [
    L('canned_food', 26), L('crackers', 20), L('water_dirty', 20), L('jerky', 12), L('energy_bar', 10),
    L('knife', 8), L('cloth', 8, 1, 2), L('mushrooms', 4),
  ],
  medical: [
    L('bandage', 26, 1, 3), L('painkillers', 18), L('medkit', 12), L('antibiotics', 10), L('splint', 8),
    L('antirad', 8), L('stim_combat', 5), L('filter', 6), L('chemicals', 12, 1, 2), L('cloth', 10, 1, 3),
  ],
  military: [
    L('ammo_762', 22, 15, 40), L('ammo_9mm', 18, 12, 30), L('ammo_12g', 12, 4, 12), L('kevlar_vest', 6),
    L('assault_rifle', 5), L('pump_shotgun', 5), L('gasmask', 8), L('dogtag', 14), L('wire', 8),
    L('gunpowder', 12, 1, 4), L('keycard', 3), L('stim_combat', 6), L('backpack_military', 4),
  ],
  industrial: [
    L('scrap', 30, 2, 6), L('wire', 20, 1, 3), L('electronics', 12), L('chemicals', 16, 1, 3),
    L('fuel', 10), L('duct_tape', 12), L('gunpowder', 10, 1, 3), L('battery', 12), L('lens', 8),
    L('metal_paint', 0), L('pipe', 6), L('improvised_shotgun', 4),
  ],
  store: [
    L('canned_food', 24), L('water_bottle', 22), L('crackers', 18), L('energy_bar', 12), L('clothes', 0),
    L('battery', 10), L('cloth', 12, 1, 3), L('jerky', 10), L('duct_tape', 8), L('fuel', 6),
  ],
  tool: [
    L('scrap', 26, 1, 4), L('duct_tape', 18), L('wire', 14, 1, 2), L('wood_plank', 14, 1, 2),
    L('battery', 12), L('lens', 6), L('machete', 6), L('fireaxe', 5), L('gunpowder', 8, 1, 2),
  ],
  car: [
    L('scrap', 24, 1, 3), L('fuel', 16), L('wire', 12), L('battery', 14), L('cloth', 10),
    L('ammo_9mm', 6, 2, 8), L('duct_tape', 8), L('pistol', 2),
  ],
  mutant: [
    L('flesh_scrap', 0), L('artifact_shard', 18), L('chemicals', 22, 1, 2), L('mushrooms', 20, 1, 3),
    L('gunpowder', 10, 1, 2), L('cloth', 12, 1, 2), L('record_tape', 8),
  ],
  warden: [
    L('record_tape', 20), L('artifact_shard', 16), L('electronics', 18), L('stim_combat', 10),
    L('green_badge', 6), L('ammo_bolt', 8, 2, 6), L('antirad', 10), L('signal_core', 2),
  ],
  rare: [
    L('crossbow', 8), L('hunting_rifle', 8), L('revolver', 10), L('hazmat_suit', 6), L('warden_coat', 6),
    L('ammo_bolt', 10, 3, 8), L('record_tape', 12), L('artifact_shard', 12), L('electronics', 10),
  ],
};

export const RARITY = {
  common: { name: 'Common', color: '#a8a8a0', mult: 1 },
  uncommon: { name: 'Uncommon', color: '#8fbf7a', mult: 1.3 },
  rare: { name: 'Rare', color: '#6a9ad0', mult: 1.7 },
  epic: { name: 'Epic', color: '#a86ad0', mult: 2.3 },
  legendary: { name: 'Legendary', color: '#d0a24a', mult: 3.2 },
};

export const ITEM_CATEGORIES = {
  food: 'Food', water: 'Water', medicine: 'Medicine', weapons: 'Weapons', ammo: 'Ammunition',
  armor: 'Armor', equipment: 'Equipment', materials: 'Materials', electronics: 'Electronics',
  quest: 'Quest Items',
};

export function itemDef(id) {
  return ITEMS[id] || AMMO[id] || null;
}
export function itemName(id) {
  const d = itemDef(id);
  if (d) return d.name;
  if (WEAPONS[id]) return WEAPONS[id].name;
  if (BUILDABLES.find((b) => b.id === id)) return BUILDABLES.find((b) => b.id === id).name;
  return id;
}
export function itemGrid(id) {
  const d = itemDef(id);
  if (d) return d.grid || [1, 1];
  if (WEAPONS[id]) return WEAPONS[id].grid || [2, 2];
  return [1, 1];
}
export function itemWeight(id) {
  const d = itemDef(id);
  if (d) return d.weight || 0.1;
  if (WEAPONS[id]) return WEAPONS[id].weight || 1;
  return 0.1;
}
export function itemColor(id) {
  const d = itemDef(id);
  if (d && d.color) return d.color;
  if (WEAPONS[id] && WEAPONS[id].color) return WEAPONS[id].color;
  return '#8a8a80';
}
export function itemCategory(id) {
  const d = itemDef(id);
  if (d) return d.cat;
  if (WEAPONS[id]) return 'weapons';
  return 'materials';
}

// ------------------------------------------------------------------
// REGIONS
// ------------------------------------------------------------------
export const REGIONS = [
  {
    id: 'suburbs', name: 'THE DEAD SUBURBS', act: 2,
    x0: -700, x1: -100, z0: 0, z1: 500, danger: 1,
    sky: [0.52, 0.56, 0.60], fog: 0.004, ground: 'grass',
    desc: 'Rows of identical houses, a school, a church. Everything at right angles. Nothing alive.',
    ambience: ['wind', 'creaking', 'birds_far'],
  },
  {
    id: 'forest', name: 'BLACKWOOD FOREST', act: 3,
    x0: -700, x1: -100, z0: -500, z1: 0, danger: 2,
    sky: [0.36, 0.42, 0.40], fog: 0.011, ground: 'grass',
    desc: 'Pine so dense the maps gave up. Fog settles in the low ground and does not leave.',
    ambience: ['wind', 'branches', 'crows'],
  },
  {
    id: 'industrial', name: 'THE INDUSTRIAL ZONE', act: 4,
    x0: -100, x1: 300, z0: 0, z1: 500, danger: 3,
    sky: [0.48, 0.48, 0.46], fog: 0.008, ground: 'gravel',
    desc: 'Foundries, chimneys, settling tanks. Something here still runs at night.',
    ambience: ['metal', 'steam', 'hum'],
  },
  {
    id: 'city', name: 'THE FORGOTTEN CITY', act: 5,
    x0: -100, x1: 300, z0: -500, z1: 0, danger: 4,
    sky: [0.44, 0.47, 0.52], fog: 0.007, ground: 'asphalt',
    desc: 'Six floors of apartments with nobody in them. The hospital lights still work.',
    ambience: ['wind_gap', 'drips', 'distant_siren'],
  },
  {
    id: 'military', name: 'THE MILITARY EXCLUSION ZONE', act: 6,
    x0: 300, x1: 700, z0: -500, z1: 0, danger: 5,
    sky: [0.40, 0.44, 0.48], fog: 0.009, ground: 'gravel',
    desc: 'Checkpoints facing inward. Whatever they were keeping out, they failed.',
    ambience: ['radio_static', 'wind', 'machinery'],
  },
  {
    id: 'wasteland', name: 'THE RED WASTELAND', act: 7,
    x0: 300, x1: 700, z0: 0, z1: 500, danger: 6,
    sky: [0.52, 0.34, 0.28], fog: 0.013, ground: 'sand',
    desc: 'The crater is still warm. Ash falls upward here on the bad nights.',
    ambience: ['radiation_storm', 'wind', 'geiger'],
  },
];

export function regionAt(x, z) {
  for (const r of REGIONS) {
    if (x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r;
  }
  return REGIONS[0];
}
