import type { RunSummary } from '../types';
import type { SaveData } from '../../core/save';

export interface AchievementContext {
  save: SaveData;
  summary?: RunSummary;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  reward: number;
  icon: 'flame' | 'crown' | 'coin' | 'skull' | 'rune' | 'heart' | 'moon' | 'book';
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_light',
    name: 'First Light',
    description: 'Complete your first wave.',
    reward: 10,
    icon: 'flame',
    check: ({ summary }) => !!summary && summary.wave >= 1,
  },
  {
    id: 'first_stand',
    name: 'A Real Vigil',
    description: 'Reach wave 5.',
    reward: 12,
    icon: 'flame',
    check: ({ summary, save }) => (summary?.wave ?? save.stats.deepestWave) >= 5,
  },
  {
    id: 'herald_slain',
    name: 'Herald Fallen',
    description: 'Defeat the Hollow Herald.',
    reward: 18,
    icon: 'skull',
    check: ({ summary }) => (summary?.bossesKilled ?? 0) >= 1,
  },
  {
    id: 'king_slain',
    name: 'Wane No More',
    description: 'Defeat the Waning King in any mode.',
    reward: 45,
    icon: 'crown',
    check: ({ summary }) => !!summary?.victory,
  },
  {
    id: 'nightfall_win',
    name: 'Nightfall Survivor',
    description: 'Win a Nightfall run.',
    reward: 50,
    icon: 'moon',
    check: ({ summary }) => !!summary?.victory && summary.mode === 'nightfall',
  },
  {
    id: 'fusion_first',
    name: 'Two Flames, One Wick',
    description: 'Fuse two sigils for the first time.',
    reward: 12,
    icon: 'rune',
    check: ({ summary, save }) => (summary?.fusions ?? save.stats.fusions) >= 1,
  },
  {
    id: 'elder_forged',
    name: 'Elder Forged',
    description: 'Forge your first Elder sigil.',
    reward: 30,
    icon: 'crown',
    check: ({ summary, save }) => (summary?.elders ?? save.stats.elders) >= 1,
  },
  {
    id: 'three_elders',
    name: 'The Long Choir',
    description: 'Control three Elder sigils at once.',
    reward: 40,
    icon: 'crown',
    check: ({ summary }) => (summary?.eldersAtOnce ?? 0) >= 3,
  },
  {
    id: 'five_families',
    name: 'Full Spectrum',
    description: 'Place at least one sigil of every family in a single run.',
    reward: 35,
    icon: 'book',
    check: ({ summary }) => (summary?.familiesUsed.length ?? 0) >= 5,
  },
  {
    id: 'tier_three',
    name: 'Third Degree',
    description: 'Hold three tier-3 sigils at once.',
    reward: 25,
    icon: 'rune',
    check: ({ summary }) => (summary?.tier3AtOnce ?? 0) >= 3,
  },
  {
    id: 'hoarder',
    name: 'Deep Coffers',
    description: 'Hold 350 gold at once.',
    reward: 20,
    icon: 'coin',
    check: ({ summary }) => (summary?.maxGold ?? 0) >= 350,
  },
  {
    id: 'untouched',
    name: 'Untouched',
    description: 'Win a run without losing a single hearth.',
    reward: 60,
    icon: 'heart',
    check: ({ summary }) => !!summary?.victory && summary.lostHearth === 0,
  },
  {
    id: 'swift_vigil',
    name: 'Short Vigil',
    description: 'Win a run in under 12 minutes.',
    reward: 40,
    icon: 'moon',
    check: ({ summary }) => !!summary?.victory && summary.time < 720,
  },
  {
    id: 'deep_20',
    name: 'Endless Appetite',
    description: 'Reach wave 20 in endless mode.',
    reward: 30,
    icon: 'skull',
    check: ({ summary, save }) => (summary?.wave ?? save.stats.deepestWave) >= 20,
  },
  {
    id: 'deep_30',
    name: 'The Long Dark',
    description: 'Reach wave 30.',
    reward: 55,
    icon: 'skull',
    check: ({ summary, save }) => (summary?.wave ?? save.stats.deepestWave) >= 30,
  },
  {
    id: 'daily_done',
    name: 'Daily Devotion',
    description: 'Reach wave 10 in a Daily Vigil.',
    reward: 25,
    icon: 'moon',
    check: ({ summary }) => summary?.mode === 'daily' && summary.wave >= 10,
  },
  {
    id: 'thousand_kills',
    name: 'Thousand Wicks',
    description: 'Defeat 1,000 enemies in total.',
    reward: 30,
    icon: 'skull',
    check: ({ save }) => save.stats.kills >= 1000,
  },
  {
    id: 'kindler',
    name: 'Kindler',
    description: 'Earn 300 embers in total.',
    reward: 25,
    icon: 'flame',
    check: ({ save }) => save.meta.embersEarned >= 300,
  },
  {
    id: 'veteran',
    name: 'Veteran of the Road',
    description: 'Begin 10 runs.',
    reward: 20,
    icon: 'book',
    check: ({ save }) => save.stats.runs >= 10,
  },
  {
    id: 'collector',
    name: 'Codex Keeper',
    description: 'Discover 30 codex entries.',
    reward: 30,
    icon: 'book',
    check: ({ save }) => Object.keys(save.codex).length >= 30,
  },
  {
    id: 'naturalist',
    name: 'Naturalist',
    description: 'Defeat every ordinary enemy type at least once.',
    reward: 35,
    icon: 'book',
    check: ({ save }) => save.bestiary.length >= 13,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, AchievementDef>,
);
