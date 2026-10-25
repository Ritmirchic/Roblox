import type { Rng } from '../../core/rng';
import type { Card, FamilyId, Rarity, Tower } from '../types';
import { SIGILS, SIGIL_BY_ID } from '../data/sigils';
import { RUNES, RUNE_BY_ID } from '../data/runes';
import { RELICS, RELIC_BY_ID } from '../data/relics';

export interface DraftContext {
  rng: Rng;
  wave: number;
  families: FamilyId[];
  hand: Card[];
  towers: Pick<Tower, 'sigilId' | 'tier' | 'elder' | 'family' | 'runes'>[];
  relics: string[];
  offerCount: number;
}

export interface DraftResult {
  cards: Card[];
}

let uidCounter = 1;
export const nextCardUid = (): number => uidCounter++;
export const resetCardUids = (): void => {
  uidCounter = 1;
};

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100,
  uncommon: 55,
  rare: 26,
  mythic: 8,
};

/** Copies of a sigil the player controls (hand + board). */
const copiesOf = (ctx: DraftContext, sigilId: string): number => {
  let n = 0;
  for (const card of ctx.hand) if (card.kind === 'sigil' && card.id === sigilId) n++;
  for (const t of ctx.towers) if (t.sigilId === sigilId) n++;
  return n;
};

const runeCopies = (ctx: DraftContext, runeId: string): number => {
  let n = 0;
  for (const card of ctx.hand) if (card.kind === 'rune' && card.id === runeId) n++;
  for (const t of ctx.towers) for (const r of t.runes) if (r.id === runeId) n++;
  return n;
};

const pickTier = (ctx: DraftContext, rng: Rng): number => {
  if (ctx.wave < 4) return 1;
  if (ctx.wave < 8) return rng.chance(0.3) ? 2 : 1;
  if (ctx.wave < 12) return rng.chance(0.12) ? 3 : rng.chance(0.42) ? 2 : 1;
  return rng.chance(0.2) ? 3 : rng.chance(0.55) ? 2 : 1;
};

export const sigilCardCostGold = (tier: number, sigilCost: number): number =>
  Math.round(sigilCost * (tier === 1 ? 1 : tier === 2 ? 1.9 : 2.9));

export const draftCards = (ctx: DraftContext): DraftResult => {
  const { rng } = ctx;
  const cards: Card[] = [];
  const seen = new Set<string>();
  const offer = Math.max(2, Math.min(6, ctx.offerCount));
  let guard = 0;

  while (cards.length < offer && guard < 300) {
    guard++;
    const roll = rng.next();
    // Relics dry up once owned; runes dry up after a few copies.
    if (roll < 0.2) {
      const pool = RELICS.filter((r) => !ctx.relics.includes(r.id));
      if (pool.length > 0) {
        const relic = rng.weighted(pool, (r) => RARITY_WEIGHT[r.rarity]);
        if (!seen.has(`relic:${relic.id}`)) {
          seen.add(`relic:${relic.id}`);
          cards.push({ uid: nextCardUid(), kind: 'relic', id: relic.id, rarity: relic.rarity });
          continue;
        }
      }
    } else if (roll < 0.45) {
      const pool = RUNES.filter((r) => runeCopies(ctx, r.id) < 3);
      if (pool.length > 0) {
        const rune = rng.weighted(pool, (r) => RARITY_WEIGHT[r.rarity]);
        if (!seen.has(`rune:${rune.id}`)) {
          seen.add(`rune:${rune.id}`);
          cards.push({ uid: nextCardUid(), kind: 'rune', id: rune.id, rarity: rune.rarity });
          continue;
        }
      }
    } else if (roll < 0.94) {
      const pool = SIGILS.filter((s) => ctx.families.includes(s.family) && copiesOf(ctx, s.id) < 4);
      if (pool.length > 0) {
        const sigil = rng.weighted(pool, (s) => {
          const copies = copiesOf(ctx, s.id);
          const familySpread = ctx.towers.some((t) => t.family === s.family) ? 1.25 : 1;
          return RARITY_WEIGHT[s.rarity ?? 'common'] * (copies === 0 ? 1.15 : 1.55) * familySpread;
        });
        const tier = pickTier(ctx, rng);
        const key = `sigil:${sigil.id}:${tier}`;
        if (!seen.has(key)) {
          seen.add(key);
          cards.push({
            uid: nextCardUid(),
            kind: 'sigil',
            id: sigil.id,
            tier,
            rarity: tier === 3 ? 'rare' : tier === 2 ? 'uncommon' : sigil.rarity ?? 'common',
          });
          continue;
        }
      }
    } else {
      const gold = Math.round(rng.range(20, 40) + ctx.wave * 2);
      const key = `cache:${gold}`;
      if (!seen.has(key)) {
        seen.add(key);
        cards.push({ uid: nextCardUid(), kind: 'cache', id: 'cache', rarity: 'uncommon', gold });
        continue;
      }
    }
  }

  // Safety net: never hand back an empty draft (e.g. everything maxed out).
  if (cards.length === 0) {
    cards.push({
      uid: nextCardUid(),
      kind: 'cache',
      id: 'cache',
      rarity: 'common',
      gold: 25 + ctx.wave * 2,
    });
  }
  return { cards };
};

export const cardTitle = (card: Card): string => {
  if (card.kind === 'sigil') {
    const def = SIGIL_BY_ID[card.id];
    return def ? `${def.name}${card.tier && card.tier > 1 ? ` · T${card.tier}` : ''}` : 'Sigil';
  }
  if (card.kind === 'rune') return RUNE_BY_ID[card.id]?.name ?? 'Rune';
  if (card.kind === 'relic') return RELIC_BY_ID[card.id]?.name ?? 'Relic';
  return 'Gold Cache';
};

export const cardBody = (card: Card): string => {
  if (card.kind === 'sigil') return SIGIL_BY_ID[card.id]?.description ?? '';
  if (card.kind === 'rune') return RUNE_BY_ID[card.id]?.description ?? '';
  if (card.kind === 'relic') return RELIC_BY_ID[card.id]?.description ?? '';
  return `Immediately gain ${card.gold ?? 0} gold.`;
};

export const cardKindLabel = (card: Card): string => {
  if (card.kind === 'sigil') return 'SIGIL';
  if (card.kind === 'rune') return 'RUNE';
  if (card.kind === 'relic') return 'RELIC';
  return 'CACHE';
};
