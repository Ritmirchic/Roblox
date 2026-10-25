/**
 * Economy rules: expansion cell pricing and the crew slot formula.
 * RULE: CrewSlots = floor(purchasedExpansionCells / 10). Starter cells never count.
 */
export const CELL_BASE_PRICE = 420;
export const CELL_GROWTH = 1.055;
export const CELLS_PER_CREW_SLOT = 10;

/** Price of the (n+1)-th expansion cell when `owned` cells have already been purchased. */
export function cellPrice(owned: number): number {
  return Math.round(CELL_BASE_PRICE * Math.pow(CELL_GROWTH, owned));
}

/** Total cost of buying `count` more cells starting from `owned`. */
export function cellBundlePrice(owned: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += cellPrice(owned + i);
  return total;
}

export function crewSlots(purchasedCells: number): number {
  return Math.floor(Math.max(0, purchasedCells) / CELLS_PER_CREW_SLOT);
}

/** Cells still required before the next crew slot unlocks. */
export function cellsToNextCrewSlot(purchasedCells: number): number {
  const rem = Math.max(0, purchasedCells) % CELLS_PER_CREW_SLOT;
  return CELLS_PER_CREW_SLOT - rem;
}

/** Progress 0..1 toward the next crew slot. */
export function crewSlotProgress(purchasedCells: number): number {
  return (Math.max(0, purchasedCells) % CELLS_PER_CREW_SLOT) / CELLS_PER_CREW_SLOT;
}

/** Sale value of ore in credits, including crew multipliers applied by the caller. */
export function oreValue(amounts: Record<string, number>, prices: Record<string, number>): number {
  let total = 0;
  for (const [id, qty] of Object.entries(amounts)) total += (prices[id] ?? 1) * qty;
  return Math.round(total);
}

/** Progression tier 1..5 derived from permanent power, used to scale achievement targets. */
export function progressionTier(purchasedCells: number, sectorsUnlocked: number, moduleCount: number): number {
  const score = purchasedCells * 0.5 + sectorsUnlocked * 6 + moduleCount * 0.8;
  if (score < 14) return 1;
  if (score < 34) return 2;
  if (score < 70) return 3;
  if (score < 130) return 4;
  return 5;
}
