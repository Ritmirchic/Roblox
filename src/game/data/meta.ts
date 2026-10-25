import type { FamilyId } from '../types';
import type { MetaState } from '../../core/save';
import { FAMILY_UNLOCK_COST } from './families';

export type MetaIcon =
  | 'flame'
  | 'oil'
  | 'coin'
  | 'heart'
  | 'rune'
  | 'hand'
  | 'dice'
  | 'cards'
  | 'embers'
  | 'salvage'
  | 'burn'
  | 'heal'
  | 'frost'
  | 'leaf'
  | 'bolt'
  | 'eye';

export interface MetaNodeDef {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  costs: number[];
  icon: MetaIcon;
  unlocksFamily?: FamilyId;
}

/** The lantern-keeper's board: permanent progression bought with embers. */
export const META_NODES: MetaNodeDef[] = [
  {
    id: 'wick_trim',
    name: 'Wick Trimming',
    description: '+6% sigil damage per rank.',
    maxRank: 3,
    costs: [20, 35, 55],
    icon: 'flame',
  },
  {
    id: 'lantern_oil',
    name: 'Lantern Oil',
    description: '+6% attack speed per rank.',
    maxRank: 3,
    costs: [25, 40, 65],
    icon: 'oil',
  },
  {
    id: 'deep_pockets',
    name: 'Deep Pockets',
    description: '+15 starting gold per rank.',
    maxRank: 3,
    costs: [15, 30, 50],
    icon: 'coin',
  },
  {
    id: 'warm_hearth',
    name: 'Warm Hearth',
    description: '+15 maximum hearth per rank.',
    maxRank: 3,
    costs: [20, 35, 55],
    icon: 'heart',
  },
  {
    id: 'socket_wax',
    name: 'Socket Wax',
    description: '+1 rune socket on every placed sigil per rank.',
    maxRank: 2,
    costs: [60, 110],
    icon: 'rune',
  },
  {
    id: 'wider_hand',
    name: 'Wider Hand',
    description: '+1 hand slot.',
    maxRank: 1,
    costs: [70],
    icon: 'hand',
  },
  {
    id: 'steady_hands',
    name: 'Steady Hands',
    description: '+1 draft reroll per run per rank.',
    maxRank: 2,
    costs: [30, 60],
    icon: 'dice',
  },
  {
    id: 'curious_choir',
    name: 'Curious Choir',
    description: 'Drafts offer one extra card.',
    maxRank: 1,
    costs: [80],
    icon: 'cards',
  },
  {
    id: 'ember_gain',
    name: 'Ember Gathering',
    description: '+15% embers earned per rank.',
    maxRank: 2,
    costs: [35, 70],
    icon: 'embers',
  },
  {
    id: 'salvage',
    name: 'Salvage Rights',
    description: 'Selling sigils refunds +20% of their cost.',
    maxRank: 1,
    costs: [30],
    icon: 'salvage',
  },
  {
    id: 'slow_burn',
    name: 'Slow Burn',
    description: 'Burn, poison and chill are 10% stronger per rank.',
    maxRank: 2,
    costs: [30, 55],
    icon: 'burn',
  },
  {
    id: 'last_light',
    name: 'Last Light',
    description: 'Heal 4 hearth after every boss wave.',
    maxRank: 1,
    costs: [60],
    icon: 'heal',
  },
  {
    id: 'unlock_frost',
    name: 'Frost Sigils',
    description: 'Unlock the Winter Glass family for drafts.',
    maxRank: 1,
    costs: [FAMILY_UNLOCK_COST.frost],
    icon: 'frost',
    unlocksFamily: 'frost',
  },
  {
    id: 'unlock_verdant',
    name: 'Verdant Sigils',
    description: 'Unlock the Root Procession family for drafts.',
    maxRank: 1,
    costs: [FAMILY_UNLOCK_COST.verdant],
    icon: 'leaf',
    unlocksFamily: 'verdant',
  },
  {
    id: 'unlock_volt',
    name: 'Volt Sigils',
    description: 'Unlock the Storm Throne family for drafts.',
    maxRank: 1,
    costs: [FAMILY_UNLOCK_COST.volt],
    icon: 'bolt',
    unlocksFamily: 'volt',
  },
  {
    id: 'unlock_umbral',
    name: 'Umbral Sigils',
    description: 'Unlock the Hollow Choir family for drafts.',
    maxRank: 1,
    costs: [FAMILY_UNLOCK_COST.umbral],
    icon: 'eye',
  },
];

// The umbral node declares its family via the id suffix; keep the definition
// above tidy while still exposing the mapping.
for (const node of META_NODES) {
  if (node.id === 'unlock_umbral') node.unlocksFamily = 'umbral';
}

export const META_NODE_IDS: Set<string> = new Set(META_NODES.map((n) => n.id));
export const META_BY_ID: Record<string, MetaNodeDef> = META_NODES.reduce(
  (acc, n) => {
    acc[n.id] = n;
    return acc;
  },
  {} as Record<string, MetaNodeDef>,
);

export const nodeRank = (meta: MetaState, id: string): number =>
  Math.max(0, Math.min(META_BY_ID[id]?.maxRank ?? 0, meta.nodes[id] ?? 0));

export const nodeCost = (meta: MetaState, node: MetaNodeDef): number | null => {
  const rank = nodeRank(meta, node.id);
  if (rank >= node.maxRank) return null;
  return node.costs[rank] ?? null;
};

export interface MetaBuffs {
  damageMult: number;
  speedMult: number;
  startGold: number;
  hearthMax: number;
  socketBonus: number;
  handBonus: number;
  rerolls: number;
  offerBonus: number;
  emberMult: number;
  sellRefundBonus: number;
  statusPowerMult: number;
  bossHeal: number;
  unlockedFamilies: FamilyId[];
}

export const computeMetaBuffs = (meta: MetaState): MetaBuffs => {
  const r = (id: string): number => nodeRank(meta, id);
  const unlocked = new Set<FamilyId>(meta.unlockedFamilies);
  for (const node of META_NODES) {
    if (node.unlocksFamily && r(node.id) > 0) unlocked.add(node.unlocksFamily);
  }
  return {
    damageMult: 1 + 0.06 * r('wick_trim'),
    speedMult: 1 + 0.06 * r('lantern_oil'),
    startGold: 15 * r('deep_pockets'),
    hearthMax: 15 * r('warm_hearth'),
    socketBonus: r('socket_wax'),
    handBonus: r('wider_hand'),
    rerolls: r('steady_hands'),
    offerBonus: r('curious_choir'),
    emberMult: 1 + 0.15 * r('ember_gain'),
    sellRefundBonus: r('salvage') * 0.2,
    statusPowerMult: 1 + 0.1 * r('slow_burn'),
    bossHeal: r('last_light') * 4,
    unlockedFamilies: [...unlocked],
  };
};

/** Embers awarded when a run ends. Never zero, so a failed run still pays. */
export const embersForRun = (opts: {
  wave: number;
  kills: number;
  bosses: number;
  victory: boolean;
  mode: 'vigil' | 'nightfall' | 'daily' | 'endless';
}): number => {
  // A run that never fought anything earns nothing, so restarting for embers is not a strategy.
  if (opts.wave < 1 && opts.kills === 0) return 0;
  const base = 4 + opts.wave * 3.5 + opts.kills * 0.14 + opts.bosses * 14;
  const winBonus = opts.victory ? 70 : 0;
  const modeMult = opts.mode === 'nightfall' ? 1.35 : 1;
  return Math.max(4, Math.round((base + winBonus) * modeMult));
};
