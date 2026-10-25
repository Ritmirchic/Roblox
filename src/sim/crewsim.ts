/**
 * Crew bonus aggregation.
 * Multiplicative bonuses multiply together, additive bonuses sum.
 * Equipping the same card twice is impossible (collection is a set) which prevents
 * duplicate bonus application, and capacity is clamped to unlocked crew slots.
 */
import { ADDITIVE_BONUSES, CREW_BY_ID, type BonusKey, type CrewCard } from '../data/crew.ts';

export type BonusMap = Partial<Record<BonusKey, number>>;

export const NEUTRAL_MULT = 1;

export function aggregateBonuses(equippedIds: string[]): BonusMap {
  const out: BonusMap = {};
  const seen = new Set<string>();
  for (const id of equippedIds) {
    if (seen.has(id)) continue;           // duplicate guard
    seen.add(id);
    const card: CrewCard | undefined = CREW_BY_ID.get(id);
    if (!card) continue;
    for (const bonus of [card.bonus, card.bonus2]) {
      if (!bonus) continue;
      const key = bonus.key;
      if (ADDITIVE_BONUSES.includes(key)) out[key] = (out[key] ?? 0) + bonus.value;
      else out[key] = (out[key] ?? 1) * bonus.value;
    }
  }
  return out;
}

export function mult(bonuses: BonusMap, key: BonusKey): number {
  return bonuses[key] ?? 1;
}

export function additive(bonuses: BonusMap, key: BonusKey): number {
  return bonuses[key] ?? 0;
}

/** Merge crew bonuses with active-upgrade effects into one lookup. */
export function mergeEffects(base: BonusMap, effects: { key: string; value: number }[]): BonusMap {
  const out: BonusMap = { ...base };
  for (const e of effects) {
    const key = e.key as BonusKey;
    if (ADDITIVE_BONUSES.includes(key)) out[key] = (out[key] ?? 0) + e.value;
    else out[key] = (out[key] ?? 1) * e.value;
  }
  return out;
}

/** Enforces crew capacity: returns the list trimmed to `slots` with duplicates removed. */
export function sanitizeEquipped(equipped: string[], slots: number, owned: Set<string>): string[] {
  const out: string[] = [];
  for (const id of equipped) {
    if (out.length >= slots) break;
    if (!owned.has(id)) continue;
    if (out.includes(id)) continue;
    if (!CREW_BY_ID.has(id)) continue;
    out.push(id);
  }
  return out;
}
