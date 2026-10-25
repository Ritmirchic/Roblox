/**
 * Crew card packs.
 * A standard pack contains EXACTLY 3 cards, rolled against published rarity weights,
 * with a pity rule that guarantees at least one rare-or-better every 8 packs.
 * Duplicates convert to crystals instead of being lost.
 */
import { CARDS_BY_RARITY, DUPLICATE_CRYSTALS, RARITY_ORDER, RARITY_WEIGHTS, type CrewCard, type Rarity } from '../data/crew.ts';
import type { RNG } from '../core/rng.ts';

export const PACK_SIZE = 3;

export interface PackDef {
  id: string;
  name: string;
  description: string;
  cost: number;                 // crystals
  /** Rarity weight overrides multiplied onto the base table. */
  weightBoost?: Partial<Record<Rarity, number>>;
  /** Minimum rarity guaranteed on the final card. */
  floor?: Rarity;
  color: number;
}

export const PACKS: PackDef[] = [
  { id: 'standard', name: 'Standard Crew Pack', description: '3 crew cards. Baseline odds across all seven rarities.', cost: 40, color: 0x49b6ff },
  { id: 'veteran', name: 'Veteran Pack', description: '3 cards. Rare or better guaranteed, epic odds tripled.', cost: 130, floor: 'rare', weightBoost: { epic: 3, legendary: 2.2 }, color: 0xc084fc },
  { id: 'legend', name: 'Legend Pack', description: '3 cards. Epic or better guaranteed, mythic odds x6.', cost: 420, floor: 'epic', weightBoost: { legendary: 3.5, mythic: 6, secret: 3 }, color: 0xfbbf24 },
];

export const PACK_BY_ID = new Map(PACKS.map((p) => [p.id, p]));

export interface PackResult {
  cards: CrewCard[];
  newCards: string[];
  duplicates: string[];
  crystalsRefunded: number;
}

export interface PackState {
  /** Packs opened since the last rare-or-better. */
  pity: number;
}

function rollRarity(rng: RNG, pack: PackDef, forceFloor: boolean): Rarity {
  const floorIdx = pack.floor ? RARITY_ORDER.indexOf(pack.floor) : 0;
  const minIdx = forceFloor ? Math.max(floorIdx, RARITY_ORDER.indexOf('rare')) : floorIdx;
  const pool = RARITY_ORDER.slice(minIdx);
  const weights = pool.map((r) => RARITY_WEIGHTS[r] * (pack.weightBoost?.[r] ?? 1));
  return rng.weighted(pool, weights);
}

/** Published probabilities for the UI - computed from the exact same tables used to roll. */
export function packOdds(pack: PackDef): { rarity: Rarity; chance: number }[] {
  const floorIdx = pack.floor ? RARITY_ORDER.indexOf(pack.floor) : 0;
  const pool = RARITY_ORDER.slice(floorIdx);
  const weights = pool.map((r) => RARITY_WEIGHTS[r] * (pack.weightBoost?.[r] ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  return pool.map((r, i) => ({ rarity: r, chance: weights[i] / total }));
}

export function openPack(
  pack: PackDef,
  rng: RNG,
  owned: Set<string>,
  state: PackState,
): PackResult {
  const cards: CrewCard[] = [];
  const newCards: string[] = [];
  const duplicates: string[] = [];
  let crystalsRefunded = 0;
  let gotRare = false;

  for (let i = 0; i < PACK_SIZE; i++) {
    const pityActive = state.pity >= 7 && i === PACK_SIZE - 1 && !gotRare;
    const rarity = rollRarity(rng, pack, pityActive);
    if (RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf('rare')) gotRare = true;
    const pool = CARDS_BY_RARITY[rarity];
    const card = rng.pick(pool);
    cards.push(card);
    if (owned.has(card.id) || newCards.includes(card.id)) {
      duplicates.push(card.id);
      crystalsRefunded += DUPLICATE_CRYSTALS[card.rarity];
    } else {
      newCards.push(card.id);
    }
  }
  state.pity = gotRare ? 0 : state.pity + 1;
  return { cards, newCards, duplicates, crystalsRefunded };
}
