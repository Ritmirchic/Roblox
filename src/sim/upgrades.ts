/**
 * Active upgrades: consumable-style run modifiers kept separate from physical modules.
 * 3 slots by default, a 4th purchasable permanently, a 5th from a 1% rare card drop. Max 5.
 */
export interface ActiveUpgradeDef {
  id: string;
  name: string;
  description: string;
  effect: { key: string; value: number };
  price: number;
  tier: number;
  color: number;
}

export const DEFAULT_UPGRADE_SLOTS = 3;
export const MAX_UPGRADE_SLOTS = 5;
export const FOURTH_SLOT_PRICE = 185_000;
/** Probability per eligible roll (one roll per completed expedition) of the 5th slot card. */
export const FIFTH_SLOT_DROP_CHANCE = 0.01;

export const ACTIVE_UPGRADES: ActiveUpgradeDef[] = [
  { id: 'overclock', name: 'Beam Overclock', description: '+35% mining damage for the whole expedition.', effect: { key: 'miningMult', value: 1.35 }, price: 6500, tier: 1, color: 0xff6b4a },
  { id: 'autoloader', name: 'Autoloader', description: '+30% weapon fire rate.', effect: { key: 'fireRateMult', value: 1.3 }, price: 8200, tier: 1, color: 0xffd166 },
  { id: 'coil_boost', name: 'Coil Supercharge', description: '+60% magnet range.', effect: { key: 'magnetRangeMult', value: 1.6 }, price: 5400, tier: 1, color: 0x44e0ff },
  { id: 'reinforce', name: 'Field Reinforcement', description: '+45% hull durability.', effect: { key: 'armorMult', value: 1.45 }, price: 9100, tier: 2, color: 0xced9ea },
  { id: 'cargo_fold', name: 'Folded Hold', description: '+80% cargo capacity.', effect: { key: 'cargoMult', value: 1.8 }, price: 11800, tier: 2, color: 0x9fb3d1 },
  { id: 'battle_tune', name: 'Battle Tuning', description: '+50% weapon damage.', effect: { key: 'damageMult', value: 1.5 }, price: 14500, tier: 2, color: 0xff3b6b },
  { id: 'prospect', name: 'Prospector Protocol', description: '+12% rare mineral chance.', effect: { key: 'rareChance', value: 0.12 }, price: 19500, tier: 3, color: 0xbf7bff },
  { id: 'afterburn', name: 'Afterburner Mix', description: '+45% thrust.', effect: { key: 'speedMult', value: 1.45 }, price: 16200, tier: 3, color: 0x53ffe0 },
  { id: 'barrier', name: 'Harmonic Barrier', description: '+70% shield capacity and regen.', effect: { key: 'shieldMult', value: 1.7 }, price: 21800, tier: 3, color: 0x49b6ff },
  { id: 'market_link', name: 'Market Uplink', description: '+40% credits earned.', effect: { key: 'creditMult', value: 1.4 }, price: 26500, tier: 4, color: 0xffb700 },
];

export const UPGRADE_BY_ID = new Map(ACTIVE_UPGRADES.map((u) => [u.id, u]));

export function unlockedSlots(fourthPurchased: boolean, fifthUnlocked: boolean): number {
  let slots = DEFAULT_UPGRADE_SLOTS;
  if (fourthPurchased) slots++;
  if (fifthUnlocked) slots++;
  return Math.min(MAX_UPGRADE_SLOTS, slots);
}

/** Rolls for the rare fifth-slot card. Returns true only on a brand new unlock. */
export function rollFifthSlot(alreadyUnlocked: boolean, roll: number): boolean {
  if (alreadyUnlocked) return false;         // prevents duplicate permanent unlocks
  return roll < FIFTH_SLOT_DROP_CHANCE;
}
