import type { RuneDef } from '../types';

/** Runes are socketed into sigils and grant flat or multiplicative bonuses. */
export const RUNES: RuneDef[] = [
  {
    id: 'keen_edge',
    name: 'Keen Edge',
    description: '+12% damage.',
    rarity: 'common',
    mods: { damageMult: 0.12 },
    glyph: 'triangle',
  },
  {
    id: 'quick_wick',
    name: 'Quick Wick',
    description: '+10% attack speed.',
    rarity: 'common',
    mods: { speedMult: 0.1 },
    glyph: 'spiral',
  },
  {
    id: 'long_sight',
    name: 'Long Sight',
    description: '+18 range.',
    rarity: 'common',
    mods: { rangeFlat: 18 },
    glyph: 'eye',
  },
  {
    id: 'gilded_leaf',
    name: 'Gilded Leaf',
    description: '+1 gold per kill.',
    rarity: 'common',
    mods: { goldOnKill: 1 },
    glyph: 'diamond',
  },
  {
    id: 'flint_crit',
    name: 'Flint Spark',
    description: '+8% critical chance.',
    rarity: 'uncommon',
    mods: { critChance: 0.08 },
    glyph: 'diamond',
  },
  {
    id: 'bitter_root',
    name: 'Bitter Root',
    description: '+22% status power (burn, poison, chill, shock, mark).',
    rarity: 'uncommon',
    mods: { statusPowerMult: 0.22 },
    glyph: 'spiral',
  },
  {
    id: 'wide_burst',
    name: 'Wide Burst',
    description: '+28% blast radius.',
    rarity: 'uncommon',
    mods: { splashMult: 0.28 },
    glyph: 'diamond',
  },
  {
    id: 'hearth_bell',
    name: 'Hearth Bell',
    description: 'Restores 1 hearth when each wave ends.',
    rarity: 'uncommon',
    mods: { hearthHeal: 1 },
    glyph: 'bell',
  },
  {
    id: 'forked_tongue',
    name: 'Forked Tongue',
    description: '+1 chain jump.',
    rarity: 'rare',
    mods: { chainAdd: 1 },
    glyph: 'fork',
  },
  {
    id: 'cinder_heart',
    name: 'Cinder Heart',
    description: '+24% damage.',
    rarity: 'rare',
    mods: { damageMult: 0.24 },
    glyph: 'triangle',
  },
  {
    id: 'storm_glass',
    name: 'Storm Glass',
    description: '+20% attack speed.',
    rarity: 'rare',
    mods: { speedMult: 0.2 },
    glyph: 'spiral',
  },
  {
    id: 'long_watch',
    name: 'Long Watch',
    description: '+34 range.',
    rarity: 'rare',
    mods: { rangeFlat: 34 },
    glyph: 'eye',
  },
  {
    id: 'avarice_sigil',
    name: 'Avarice Sigil',
    description: '+2 gold per kill.',
    rarity: 'rare',
    mods: { goldOnKill: 2 },
    glyph: 'diamond',
  },
  {
    id: 'elder_seal',
    name: 'Elder Seal',
    description: '+9% damage, +7% attack speed, +14 range.',
    rarity: 'mythic',
    mods: { damageMult: 0.09, speedMult: 0.07, rangeFlat: 14 },
    glyph: 'eye',
  },
];

export const RUNE_BY_ID: Record<string, RuneDef> = RUNES.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, RuneDef>,
);
