import { FAMILY_COLORS, type FamilyId } from '../../core/palette';

export interface FamilyInfo {
  id: FamilyId;
  name: string;
  order: string;
  blurb: string;
  keyword: string;
  color: string;
  deep: string;
  bright: string;
  eliteSigil: string;
  pattern: 'flame' | 'crystal' | 'leaf' | 'bolt' | 'eye';
}

export const FAMILIES: FamilyInfo[] = [
  {
    id: 'ember',
    name: 'Ember',
    order: 'The Cinder Choir',
    keyword: 'Burn',
    blurb:
      'Quick, hot, relentless. Ember sigils stack searing burn on anything that walks the path, rewarding a wall of overlapping fire.',
    color: FAMILY_COLORS.ember.base,
    deep: FAMILY_COLORS.ember.deep,
    bright: FAMILY_COLORS.ember.bright,
    eliteSigil: 'pyre_heart',
    pattern: 'flame',
  },
  {
    id: 'frost',
    name: 'Frost',
    order: 'The Winter Glass',
    keyword: 'Chill & Freeze',
    blurb:
      'Colder hands, longer lives. Frost slows the procession to a crawl and rewards patient geometry that funnels the horde.',
    color: FAMILY_COLORS.frost.base,
    deep: FAMILY_COLORS.frost.deep,
    bright: FAMILY_COLORS.frost.bright,
    eliteSigil: 'winter_glass',
    pattern: 'crystal',
  },
  {
    id: 'verdant',
    name: 'Verdant',
    order: 'The Root Procession',
    keyword: 'Poison & Growth',
    blurb:
      'Rot from below. Verdant fields poison the ground and its wardens feed every sigil they touch. Slow, patient, inevitable.',
    color: FAMILY_COLORS.verdant.base,
    deep: FAMILY_COLORS.verdant.deep,
    bright: FAMILY_COLORS.verdant.bright,
    eliteSigil: 'elder_grove',
    pattern: 'leaf',
  },
  {
    id: 'volt',
    name: 'Volt',
    order: 'The Storm Throne',
    keyword: 'Chain & Shock',
    blurb:
      'One spark finds the next. Volt arcs leap between clumped enemies and leave them conductive, taking more from every blow.',
    color: FAMILY_COLORS.volt.base,
    deep: FAMILY_COLORS.volt.deep,
    bright: FAMILY_COLORS.volt.bright,
    eliteSigil: 'storm_throne',
    pattern: 'bolt',
  },
  {
    id: 'umbral',
    name: 'Umbral',
    order: 'The Hollow Choir',
    keyword: 'Mark & Execute',
    blurb:
      'A held breath before the end. Umbral sigils mark the procession and finish the wounded outright — the fewer survivors, the more gold.',
    color: FAMILY_COLORS.umbral.base,
    deep: FAMILY_COLORS.umbral.deep,
    bright: FAMILY_COLORS.umbral.bright,
    eliteSigil: 'hollow_choir',
    pattern: 'eye',
  },
];

export const FAMILY_BY_ID: Record<FamilyId, FamilyInfo> = FAMILIES.reduce(
  (acc, f) => {
    acc[f.id] = f;
    return acc;
  },
  {} as Record<FamilyId, FamilyInfo>,
);

export const FAMILY_UNLOCK_COST: Record<FamilyId, number> = {
  ember: 0,
  frost: 40,
  verdant: 60,
  volt: 90,
  umbral: 130,
};
