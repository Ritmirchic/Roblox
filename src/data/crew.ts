/**
 * Crew collectible card database - 44 unique cards.
 * Every card carries a real, aggregated gameplay bonus (see sim/crewsim.ts) and a
 * unique procedurally illustrated portrait (see render/cardart.ts) driven by artSeed + motif.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

export type BonusKey =
  | 'miningMult'      // mining damage multiplier
  | 'damageMult'      // weapon damage multiplier
  | 'lootMult'        // resource quantity multiplier
  | 'speedMult'       // thrust multiplier
  | 'turnMult'        // torque multiplier
  | 'energyRegenMult' // energy regeneration multiplier
  | 'magnetRangeMult' // magnet radius multiplier
  | 'shieldMult'      // shield capacity multiplier
  | 'shieldRegenMult'
  | 'armorMult'       // module durability multiplier
  | 'cargoMult'
  | 'creditMult'
  | 'crystalMult'
  | 'rareChance'      // additive rare mineral chance
  | 'fireRateMult'
  | 'repairMult'
  | 'hazardResist';   // additive damage reduction from environmental hazards

export interface CrewCard {
  id: string;
  number: number;
  name: string;
  role: string;
  rarity: Rarity;
  description: string;
  bonus: { key: BonusKey; value: number };
  /** Secondary smaller bonus for higher rarities. */
  bonus2?: { key: BonusKey; value: number };
  artSeed: number;
  /** Motif drives the generated illustration composition. */
  motif: 'pilot' | 'gunner' | 'miner' | 'engineer' | 'scientist' | 'commander' | 'collector' | 'void';
}

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret'];

export const RARITY_COLOR: Record<Rarity, number> = {
  common: 0xcbd5e1,
  uncommon: 0x4ade80,
  rare: 0x60a5fa,
  epic: 0xc084fc,
  legendary: 0xfbbf24,
  mythic: 0xf472b6,
  secret: 0x00ffd0,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'COMMON', uncommon: 'UNCOMMON', rare: 'RARE', epic: 'EPIC',
  legendary: 'LEGENDARY', mythic: 'MYTHIC', secret: 'SECRET',
};

/** Pack drop weights. Secret is deliberately extremely rare. */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 540,
  uncommon: 270,
  rare: 125,
  epic: 48,
  legendary: 13,
  mythic: 3.4,
  secret: 0.6,
};

export const BONUS_LABEL: Record<BonusKey, string> = {
  miningMult: 'Mining power',
  damageMult: 'Weapon damage',
  lootMult: 'Resource yield',
  speedMult: 'Thrust',
  turnMult: 'Turn rate',
  energyRegenMult: 'Energy regen',
  magnetRangeMult: 'Magnet range',
  shieldMult: 'Shield capacity',
  shieldRegenMult: 'Shield regen',
  armorMult: 'Hull durability',
  cargoMult: 'Cargo capacity',
  creditMult: 'Credits earned',
  crystalMult: 'Crystals earned',
  rareChance: 'Rare mineral chance',
  fireRateMult: 'Fire rate',
  repairMult: 'Repair rate',
  hazardResist: 'Hazard resistance',
};

/** Multiplicative bonuses are stored as multipliers (1.25 = +25%); additive ones as fractions. */
export const ADDITIVE_BONUSES: BonusKey[] = ['rareChance', 'hazardResist'];

export const CREW_CARDS: CrewCard[] = [
  // ----------------------------------------------------------------- COMMON (10)
  { id: 'c_deckhand', number: 1, name: 'Vash Orrin', role: 'Deckhand', rarity: 'common', motif: 'miner', artSeed: 1011,
    description: 'Twelve years hauling ore crates in the Starter Belt. Knows every bolt of a cargo rig.',
    bonus: { key: 'cargoMult', value: 1.08 } },
  { id: 'c_welder', number: 2, name: 'Juno Pell', role: 'Hull Welder', rarity: 'common', motif: 'engineer', artSeed: 1022,
    description: 'Patches plating mid-burn with a plasma torch and a steady hand.',
    bonus: { key: 'armorMult', value: 1.06 } },
  { id: 'c_gunhand', number: 3, name: 'Rell Cado', role: 'Gun Hand', rarity: 'common', motif: 'gunner', artSeed: 1033,
    description: 'Fires first, files the report later. Never misses twice.',
    bonus: { key: 'damageMult', value: 1.07 } },
  { id: 'c_scrapper', number: 4, name: 'Mira Tesk', role: 'Scrapper', rarity: 'common', motif: 'collector', artSeed: 1044,
    description: 'Can smell a profitable wreck three sectors away.',
    bonus: { key: 'lootMult', value: 1.07 } },
  { id: 'c_navigator', number: 5, name: 'Olen Brask', role: 'Junior Navigator', rarity: 'common', motif: 'pilot', artSeed: 1055,
    description: 'Plots clean burns with nothing but a slide rule and stubbornness.',
    bonus: { key: 'speedMult', value: 1.06 } },
  { id: 'c_coiler', number: 6, name: 'Senna Vok', role: 'Coil Technician', rarity: 'common', motif: 'engineer', artSeed: 1066,
    description: 'Keeps magnet coils cold and the intake hungry.',
    bonus: { key: 'magnetRangeMult', value: 1.1 } },
  { id: 'c_driller', number: 7, name: 'Garro Finn', role: 'Drill Operator', rarity: 'common', motif: 'miner', artSeed: 1077,
    description: 'Cuts rock at the exact angle the ore wants to break.',
    bonus: { key: 'miningMult', value: 1.08 } },
  { id: 'c_quartermaster', number: 8, name: 'Lida Sorn', role: 'Quartermaster', rarity: 'common', motif: 'commander', artSeed: 1088,
    description: 'Turns scrap into credits with a ledger and zero mercy.',
    bonus: { key: 'creditMult', value: 1.07 } },
  { id: 'c_sparky', number: 9, name: 'Cob Ivane', role: 'Power Rigger', rarity: 'common', motif: 'engineer', artSeed: 1099,
    description: 'Rewires reactors while they are still warm. Mostly survives.',
    bonus: { key: 'energyRegenMult', value: 1.1 } },
  { id: 'c_spotter', number: 10, name: 'Ryn Dask', role: 'Spotter', rarity: 'common', motif: 'scientist', artSeed: 1110,
    description: 'Reads asteroid density by the way light bends around it.',
    bonus: { key: 'rareChance', value: 0.01 } },

  // -------------------------------------------------------------- UNCOMMON (9)
  { id: 'u_marksman', number: 11, name: 'Kade Vorren', role: 'Marksman', rarity: 'uncommon', motif: 'gunner', artSeed: 2011,
    description: 'Calibrates every turret by ear. The hum tells him when it is true.',
    bonus: { key: 'damageMult', value: 1.14 } },
  { id: 'u_prospector', number: 12, name: 'Ona Delacq', role: 'Prospector', rarity: 'uncommon', motif: 'miner', artSeed: 2022,
    description: 'Maps ore veins in her sleep. Wakes up richer.',
    bonus: { key: 'lootMult', value: 1.15 } },
  { id: 'u_fieldeng', number: 13, name: 'Tam Herrick', role: 'Field Engineer', rarity: 'uncommon', motif: 'engineer', artSeed: 2033,
    description: 'Carries more spare parts than the hangar inventory system admits exist.',
    bonus: { key: 'repairMult', value: 1.3 } },
  { id: 'u_helmsman', number: 14, name: 'Priya Sol', role: 'Helmsman', rarity: 'uncommon', motif: 'pilot', artSeed: 2044,
    description: 'Threads debris fields at full burn without scratching the paint.',
    bonus: { key: 'turnMult', value: 1.22 } },
  { id: 'u_magnetics', number: 15, name: 'Dex Halloran', role: 'Magnetics Officer', rarity: 'uncommon', motif: 'collector', artSeed: 2055,
    description: 'Tunes collector fields until loose ore practically jumps aboard.',
    bonus: { key: 'magnetRangeMult', value: 1.25 } },
  { id: 'u_shieldtech', number: 16, name: 'Ivette Morr', role: 'Shield Technician', rarity: 'uncommon', motif: 'engineer', artSeed: 2066,
    description: 'Folds barrier harmonics so impacts bleed off sideways.',
    bonus: { key: 'shieldMult', value: 1.2 } },
  { id: 'u_assayer', number: 17, name: 'Bram Osei', role: 'Assayer', rarity: 'uncommon', motif: 'scientist', artSeed: 2077,
    description: 'One glance at a core sample and he names its market price.',
    bonus: { key: 'creditMult', value: 1.14 } },
  { id: 'u_loader', number: 18, name: 'Hestia Quon', role: 'Cargo Chief', rarity: 'uncommon', motif: 'collector', artSeed: 2088,
    description: 'Stacks a hold so tightly physics files a complaint.',
    bonus: { key: 'cargoMult', value: 1.22 } },
  { id: 'u_stormwalker', number: 19, name: 'Niko Rask', role: 'Storm Walker', rarity: 'uncommon', motif: 'void', artSeed: 2099,
    description: 'Walked a hull during a plasma storm. Came back grinning.',
    bonus: { key: 'hazardResist', value: 0.12 } },

  // ------------------------------------------------------------------ RARE (8)
  { id: 'r_collector', number: 20, name: 'Sable Ferriq', role: 'Rare Collector', rarity: 'rare', motif: 'collector', artSeed: 3011,
    description: 'Her collector rigs pull ore from distances that should not work.',
    bonus: { key: 'magnetRangeMult', value: 1.4 }, bonus2: { key: 'lootMult', value: 1.1 } },
  { id: 'r_laserist', number: 21, name: 'Toma Reyes', role: 'Beam Specialist', rarity: 'rare', motif: 'miner', artSeed: 3022,
    description: 'Splits a mining beam into harmonics that shatter rock from within.',
    bonus: { key: 'miningMult', value: 1.35 } },
  { id: 'r_tactician', number: 22, name: 'Edda Kwan', role: 'Fire Tactician', rarity: 'rare', motif: 'gunner', artSeed: 3033,
    description: 'Sequences turret volleys so nothing in range gets a second move.',
    bonus: { key: 'fireRateMult', value: 1.3 } },
  { id: 'r_voidscout', number: 23, name: 'Asha Vel', role: 'Void Scout', rarity: 'rare', motif: 'pilot', artSeed: 3044,
    description: 'Flies the gaps between gravity wells where charts simply end.',
    bonus: { key: 'speedMult', value: 1.3 }, bonus2: { key: 'turnMult', value: 1.12 } },
  { id: 'r_reactorist', number: 24, name: 'Quill Baran', role: 'Reactor Savant', rarity: 'rare', motif: 'engineer', artSeed: 3055,
    description: 'Runs the core hotter than spec and somehow keeps it stable.',
    bonus: { key: 'energyRegenMult', value: 1.45 } },
  { id: 'r_geologist', number: 25, name: 'Mei Thornwood', role: 'Exo-Geologist', rarity: 'rare', motif: 'scientist', artSeed: 3066,
    description: 'Finds crystalline seams other crews fly straight past.',
    bonus: { key: 'rareChance', value: 0.06 } },
  { id: 'r_armorer', number: 26, name: 'Bosk Tiller', role: 'Master Armorer', rarity: 'rare', motif: 'engineer', artSeed: 3077,
    description: 'Layers ablative plate so damage sheds off in sheets.',
    bonus: { key: 'armorMult', value: 1.32 } },
  { id: 'r_broker', number: 27, name: 'Cyra Noll', role: 'Ore Broker', rarity: 'rare', motif: 'commander', artSeed: 3088,
    description: 'Sells your haul twice before the hold doors finish closing.',
    bonus: { key: 'creditMult', value: 1.32 } },

  // ------------------------------------------------------------------ EPIC (7)
  { id: 'e_engineer', number: 28, name: 'Dr. Ilse Varga', role: 'Chief Engineer', rarity: 'epic', motif: 'engineer', artSeed: 4011,
    description: 'Rebuilt a fusion drive mid-expedition using salvage and spite.',
    bonus: { key: 'energyRegenMult', value: 1.5 }, bonus2: { key: 'repairMult', value: 1.4 } },
  { id: 'e_gunnery', number: 29, name: 'Captain Roth Vane', role: 'Gunnery Officer', rarity: 'epic', motif: 'gunner', artSeed: 4022,
    description: 'Commands the batteries like an orchestra of very loud instruments.',
    bonus: { key: 'damageMult', value: 1.55 }, bonus2: { key: 'fireRateMult', value: 1.15 } },
  { id: 'e_driller', number: 30, name: 'Vonn Macek', role: 'Deep Driller', rarity: 'epic', motif: 'miner', artSeed: 4033,
    description: 'Takes the plasma drill into cores nobody else will touch.',
    bonus: { key: 'miningMult', value: 1.6 } },
  { id: 'e_shieldwright', number: 31, name: 'Lyra Ashenfeld', role: 'Shieldwright', rarity: 'epic', motif: 'commander', artSeed: 4044,
    description: 'Her barrier geometry turns direct hits into light shows.',
    bonus: { key: 'shieldMult', value: 1.6 }, bonus2: { key: 'shieldRegenMult', value: 1.35 } },
  { id: 'e_navigator', number: 32, name: 'Sol Arcadi', role: 'Master Navigator', rarity: 'epic', motif: 'pilot', artSeed: 4055,
    description: 'Charts burns that arrive before the fuel budget says they should.',
    bonus: { key: 'speedMult', value: 1.5 }, bonus2: { key: 'turnMult', value: 1.3 } },
  { id: 'e_logistician', number: 33, name: 'Hara Dune', role: 'Logistics Master', rarity: 'epic', motif: 'collector', artSeed: 4066,
    description: 'Every cubic metre of your hold now earns its keep.',
    bonus: { key: 'cargoMult', value: 1.7 }, bonus2: { key: 'creditMult', value: 1.2 } },
  { id: 'e_stormrider', number: 34, name: 'Ozan Krieg', role: 'Storm Rider', rarity: 'epic', motif: 'void', artSeed: 4077,
    description: 'Surfs plasma discharges for the fun of it. Comes back with rare ore.',
    bonus: { key: 'hazardResist', value: 0.3 }, bonus2: { key: 'rareChance', value: 0.04 } },

  // ------------------------------------------------------------- LEGENDARY (5)
  { id: 'l_gunner', number: 35, name: 'Zara "Triplecross" Bale', role: 'Legendary Gunner', rarity: 'legendary', motif: 'gunner', artSeed: 5011,
    description: 'Three confirmed kills with one railgun slug. Triples your damage output.',
    bonus: { key: 'damageMult', value: 3.0 } },
  { id: 'l_pilot', number: 36, name: 'Kesh Orlov', role: 'Legendary Pilot', rarity: 'legendary', motif: 'pilot', artSeed: 5022,
    description: 'The only pilot to outrun a Void Sentinel. Doubles your ship speed.',
    bonus: { key: 'speedMult', value: 2.0 }, bonus2: { key: 'turnMult', value: 1.4 } },
  { id: 'l_forge', number: 37, name: 'Magda Iversen', role: 'Legendary Forgewright', rarity: 'legendary', motif: 'engineer', artSeed: 5033,
    description: 'Her plating survived a direct plasma lance. Twice.',
    bonus: { key: 'armorMult', value: 2.0 }, bonus2: { key: 'repairMult', value: 1.6 } },
  { id: 'l_prospector', number: 38, name: 'Idris Falk', role: 'Legendary Prospector', rarity: 'legendary', motif: 'miner', artSeed: 5044,
    description: 'Finds the mother lode on the first core sample. Every time.',
    bonus: { key: 'lootMult', value: 2.2 }, bonus2: { key: 'miningMult', value: 1.3 } },
  { id: 'l_quartermaster', number: 39, name: 'Senator Vane Dulac', role: 'Legendary Financier', rarity: 'legendary', motif: 'commander', artSeed: 5055,
    description: 'Owns the exchange. Your ore sells at frankly unreasonable prices.',
    bonus: { key: 'creditMult', value: 2.1 }, bonus2: { key: 'crystalMult', value: 1.3 } },

  // ---------------------------------------------------------------- MYTHIC (3)
  { id: 'm_miner', number: 40, name: 'The Hollow Prospector', role: 'Mythic Miner', rarity: 'mythic', motif: 'miner', artSeed: 6011,
    description: 'A sealed suit with no occupant on scan. It mines. The hold fills fivefold.',
    bonus: { key: 'lootMult', value: 5.0 } },
  { id: 'm_commander', number: 41, name: 'Admiral Sayen Kol', role: 'Mythic Commander', rarity: 'mythic', motif: 'commander', artSeed: 6022,
    description: 'Lost a fleet, kept the doctrine. Doubles shield capacity outright.',
    bonus: { key: 'shieldMult', value: 2.0 }, bonus2: { key: 'shieldRegenMult', value: 1.8 } },
  { id: 'm_engine', number: 42, name: 'Oracle Unit NERA-9', role: 'Mythic Intelligence', rarity: 'mythic', motif: 'scientist', artSeed: 6033,
    description: 'Predicts the fracture plane of every rock before the beam lands.',
    bonus: { key: 'miningMult', value: 2.4 }, bonus2: { key: 'energyRegenMult', value: 1.9 } },

  // ---------------------------------------------------------------- SECRET (2)
  { id: 's_scientist', number: 43, name: 'Dr. Ophelia Rax', role: 'Secret Scientist', rarity: 'secret', motif: 'scientist', artSeed: 7011,
    description: 'Her resonance theory rewrites what counts as a rare mineral.',
    bonus: { key: 'rareChance', value: 0.25 }, bonus2: { key: 'crystalMult', value: 1.6 } },
  { id: 's_void', number: 44, name: 'THE VOID WALKER', role: 'Secret Anomaly', rarity: 'secret', motif: 'void', artSeed: 7022,
    description: 'Signed on with no name, no record and no reflection. Everything improves.',
    bonus: { key: 'damageMult', value: 1.8 }, bonus2: { key: 'lootMult', value: 1.8 } },
];

export const CREW_BY_ID = new Map(CREW_CARDS.map((c) => [c.id, c]));

export function getCrew(id: string): CrewCard | undefined {
  return CREW_BY_ID.get(id);
}

export const CARDS_BY_RARITY: Record<Rarity, CrewCard[]> = RARITY_ORDER.reduce((acc, r) => {
  acc[r] = CREW_CARDS.filter((c) => c.rarity === r);
  return acc;
}, {} as Record<Rarity, CrewCard[]>);

/** Crystal value awarded when a duplicate card is pulled. */
export const DUPLICATE_CRYSTALS: Record<Rarity, number> = {
  common: 2, uncommon: 4, rare: 9, epic: 22, legendary: 60, mythic: 160, secret: 400,
};

export function formatBonus(key: BonusKey, value: number): string {
  if (ADDITIVE_BONUSES.includes(key)) return `+${Math.round(value * 100)}% ${BONUS_LABEL[key]}`;
  const pct = Math.round((value - 1) * 100);
  if (value >= 2) return `x${value.toFixed(value % 1 === 0 ? 0 : 1)} ${BONUS_LABEL[key]}`;
  return `+${pct}% ${BONUS_LABEL[key]}`;
}
