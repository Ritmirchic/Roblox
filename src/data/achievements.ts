/**
 * Achievement card templates.
 * Active set: 5 minute + 3 hourly + 7 daily + 15 weekly = 30 live achievements at all times.
 * Templates are instantiated per period with targets scaled to the player's progression tier,
 * so objectives are always achievable with the equipment the player actually owns.
 */
import type { Rarity } from './crew.ts';

export type Period = 'minute' | 'hourly' | 'daily' | 'weekly';

/** Counter keys the simulation feeds. */
export type StatKey =
  | 'asteroidsMined'
  | 'oreCollected'
  | 'chunksCollected'
  | 'enemiesKilled'
  | 'dronesKilled'
  | 'creditsEarned'
  | 'crystalsEarned'
  | 'distance'
  | 'expeditions'
  | 'modulesInstalled'
  | 'cellsPurchased'
  | 'packsOpened'
  | 'cardsOwned'
  | 'sectorsUnlocked'
  | 'upgradesInstalled'
  | 'rareFinds'
  | 'damageDealt'
  | 'shieldAbsorbed'
  | 'moduleUpgrades';

export interface AchievementTemplate {
  id: string;
  period: Period;
  name: string;
  description: string;
  stat: StatKey;
  /** Base target at progression tier 1. */
  base: number;
  /** Multiplier applied per progression tier above 1. */
  tierScale: number;
  crystals: number;
  rarity: Rarity;
  motif: 'mining' | 'combat' | 'economy' | 'exploration' | 'engineering' | 'collection';
  artSeed: number;
}

export const MINUTE_TEMPLATES: AchievementTemplate[] = [
  { id: 'm_rocks', period: 'minute', name: 'Quick Cut', description: 'Break apart 5 asteroids before the timer resets.', stat: 'asteroidsMined', base: 5, tierScale: 1.12, crystals: 2, rarity: 'common', motif: 'mining', artSeed: 8101 },
  { id: 'm_iron', period: 'minute', name: 'Iron Pickup', description: 'Collect 20 units of ore.', stat: 'oreCollected', base: 20, tierScale: 1.2, crystals: 2, rarity: 'common', motif: 'collection', artSeed: 8102 },
  { id: 'm_drones', period: 'minute', name: 'Two Down', description: 'Destroy 2 hostile craft.', stat: 'enemiesKilled', base: 2, tierScale: 1.08, crystals: 3, rarity: 'uncommon', motif: 'combat', artSeed: 8103 },
  { id: 'm_chunks', period: 'minute', name: 'Scrap Sweep', description: 'Scoop up 10 floating resource chunks.', stat: 'chunksCollected', base: 10, tierScale: 1.15, crystals: 2, rarity: 'common', motif: 'collection', artSeed: 8104 },
  { id: 'm_distance', period: 'minute', name: 'Burn Run', description: 'Travel 500 distance units under thrust.', stat: 'distance', base: 500, tierScale: 1.1, crystals: 2, rarity: 'common', motif: 'exploration', artSeed: 8105 },
  { id: 'm_damage', period: 'minute', name: 'Opening Volley', description: 'Deal 400 damage with ship weapons.', stat: 'damageDealt', base: 400, tierScale: 1.25, crystals: 3, rarity: 'uncommon', motif: 'combat', artSeed: 8106 },
  { id: 'm_credits', period: 'minute', name: 'Pocket Change', description: 'Earn 600 credits.', stat: 'creditsEarned', base: 600, tierScale: 1.3, crystals: 2, rarity: 'common', motif: 'economy', artSeed: 8107 },
  { id: 'm_rare', period: 'minute', name: 'Lucky Seam', description: 'Find 1 rare mineral deposit.', stat: 'rareFinds', base: 1, tierScale: 1.0, crystals: 4, rarity: 'rare', motif: 'mining', artSeed: 8108 },
];

export const HOURLY_TEMPLATES: AchievementTemplate[] = [
  { id: 'h_rocks', period: 'hourly', name: 'Belt Harvest', description: 'Mine 50 asteroids this hour.', stat: 'asteroidsMined', base: 50, tierScale: 1.15, crystals: 14, rarity: 'uncommon', motif: 'mining', artSeed: 8201 },
  { id: 'h_kills', period: 'hourly', name: 'Hostile Sweep', description: 'Defeat 10 enemy craft.', stat: 'enemiesKilled', base: 10, tierScale: 1.12, crystals: 16, rarity: 'uncommon', motif: 'combat', artSeed: 8202 },
  { id: 'h_ore', period: 'hourly', name: 'Full Hold', description: 'Collect 500 units of ore.', stat: 'oreCollected', base: 500, tierScale: 1.25, crystals: 15, rarity: 'uncommon', motif: 'collection', artSeed: 8203 },
  { id: 'h_credits', period: 'hourly', name: 'Hour of Profit', description: 'Earn 8,000 credits.', stat: 'creditsEarned', base: 8000, tierScale: 1.35, crystals: 18, rarity: 'rare', motif: 'economy', artSeed: 8204 },
  { id: 'h_expe', period: 'hourly', name: 'Two Sorties', description: 'Complete 2 expeditions.', stat: 'expeditions', base: 2, tierScale: 1.0, crystals: 20, rarity: 'rare', motif: 'exploration', artSeed: 8205 },
  { id: 'h_damage', period: 'hourly', name: 'Sustained Fire', description: 'Deal 6,000 weapon damage.', stat: 'damageDealt', base: 6000, tierScale: 1.3, crystals: 16, rarity: 'uncommon', motif: 'combat', artSeed: 8206 },
];

export const DAILY_TEMPLATES: AchievementTemplate[] = [
  { id: 'd_rocks', period: 'daily', name: 'Day Shift', description: 'Mine 100 asteroids today.', stat: 'asteroidsMined', base: 100, tierScale: 1.18, crystals: 45, rarity: 'rare', motif: 'mining', artSeed: 8301 },
  { id: 'd_credits', period: 'daily', name: 'Ten Thousand', description: 'Earn 10,000 credits.', stat: 'creditsEarned', base: 10000, tierScale: 1.4, crystals: 50, rarity: 'rare', motif: 'economy', artSeed: 8302 },
  { id: 'd_expe', period: 'daily', name: 'Five Sorties', description: 'Complete 5 expeditions.', stat: 'expeditions', base: 5, tierScale: 1.05, crystals: 55, rarity: 'rare', motif: 'exploration', artSeed: 8303 },
  { id: 'd_upgrade', period: 'daily', name: 'Shop Floor', description: 'Upgrade equipment 2 times.', stat: 'moduleUpgrades', base: 2, tierScale: 1.0, crystals: 48, rarity: 'rare', motif: 'engineering', artSeed: 8304 },
  { id: 'd_kills', period: 'daily', name: 'Clear The Lanes', description: 'Destroy 40 hostiles.', stat: 'enemiesKilled', base: 40, tierScale: 1.15, crystals: 52, rarity: 'rare', motif: 'combat', artSeed: 8305 },
  { id: 'd_ore', period: 'daily', name: 'Bulk Freight', description: 'Collect 3,000 ore.', stat: 'oreCollected', base: 3000, tierScale: 1.3, crystals: 46, rarity: 'rare', motif: 'collection', artSeed: 8306 },
  { id: 'd_pack', period: 'daily', name: 'Crew Call', description: 'Open 1 crew card pack.', stat: 'packsOpened', base: 1, tierScale: 1.0, crystals: 40, rarity: 'uncommon', motif: 'collection', artSeed: 8307 },
  { id: 'd_rare', period: 'daily', name: 'Deep Veins', description: 'Find 6 rare mineral deposits.', stat: 'rareFinds', base: 6, tierScale: 1.12, crystals: 60, rarity: 'epic', motif: 'mining', artSeed: 8308 },
  { id: 'd_module', period: 'daily', name: 'Refit', description: 'Install 3 modules on your ship.', stat: 'modulesInstalled', base: 3, tierScale: 1.0, crystals: 42, rarity: 'uncommon', motif: 'engineering', artSeed: 8309 },
  { id: 'd_distance', period: 'daily', name: 'Long Haul', description: 'Travel 20,000 distance units.', stat: 'distance', base: 20000, tierScale: 1.2, crystals: 44, rarity: 'rare', motif: 'exploration', artSeed: 8310 },
];

export const WEEKLY_TEMPLATES: AchievementTemplate[] = [
  { id: 'w_rocks', period: 'weekly', name: 'Two Thousand Rocks', description: 'Mine 2,000 asteroids this week.', stat: 'asteroidsMined', base: 2000, tierScale: 1.2, crystals: 220, rarity: 'epic', motif: 'mining', artSeed: 8401 },
  { id: 'w_kills', period: 'weekly', name: 'Three Hundred Hostiles', description: 'Defeat 300 enemy craft.', stat: 'enemiesKilled', base: 300, tierScale: 1.18, crystals: 240, rarity: 'epic', motif: 'combat', artSeed: 8402 },
  { id: 'w_expe', period: 'weekly', name: 'Fifty Expeditions', description: 'Complete 50 expeditions.', stat: 'expeditions', base: 50, tierScale: 1.1, crystals: 260, rarity: 'epic', motif: 'exploration', artSeed: 8403 },
  { id: 'w_sectors', period: 'weekly', name: 'Frontier Charts', description: 'Unlock a new sector.', stat: 'sectorsUnlocked', base: 1, tierScale: 1.0, crystals: 300, rarity: 'legendary', motif: 'exploration', artSeed: 8404 },
  { id: 'w_cells', period: 'weekly', name: 'Expansion Program', description: 'Purchase 10 ship expansion cells.', stat: 'cellsPurchased', base: 10, tierScale: 1.1, crystals: 280, rarity: 'epic', motif: 'engineering', artSeed: 8405 },
  { id: 'w_cards', period: 'weekly', name: 'Crew Roster', description: 'Own 12 distinct crew cards.', stat: 'cardsOwned', base: 12, tierScale: 1.15, crystals: 250, rarity: 'epic', motif: 'collection', artSeed: 8406 },
  { id: 'w_credits', period: 'weekly', name: 'Quarter Million', description: 'Earn 250,000 credits.', stat: 'creditsEarned', base: 250000, tierScale: 1.45, crystals: 320, rarity: 'legendary', motif: 'economy', artSeed: 8407 },
  { id: 'w_ore', period: 'weekly', name: 'Industrial Scale', description: 'Collect 40,000 ore.', stat: 'oreCollected', base: 40000, tierScale: 1.35, crystals: 230, rarity: 'epic', motif: 'collection', artSeed: 8408 },
  { id: 'w_packs', period: 'weekly', name: 'Pack Run', description: 'Open 10 crew packs.', stat: 'packsOpened', base: 10, tierScale: 1.0, crystals: 210, rarity: 'epic', motif: 'collection', artSeed: 8409 },
  { id: 'w_upgrades', period: 'weekly', name: 'Full Refit', description: 'Perform 15 module upgrades.', stat: 'moduleUpgrades', base: 15, tierScale: 1.1, crystals: 245, rarity: 'epic', motif: 'engineering', artSeed: 8410 },
  { id: 'w_rare', period: 'weekly', name: 'Rare Earth', description: 'Find 120 rare mineral deposits.', stat: 'rareFinds', base: 120, tierScale: 1.25, crystals: 290, rarity: 'legendary', motif: 'mining', artSeed: 8411 },
  { id: 'w_damage', period: 'weekly', name: 'Fleet Breaker', description: 'Deal 500,000 weapon damage.', stat: 'damageDealt', base: 500000, tierScale: 1.35, crystals: 270, rarity: 'epic', motif: 'combat', artSeed: 8412 },
  { id: 'w_distance', period: 'weekly', name: 'Deep Range', description: 'Travel 400,000 distance units.', stat: 'distance', base: 400000, tierScale: 1.2, crystals: 225, rarity: 'epic', motif: 'exploration', artSeed: 8413 },
  { id: 'w_shield', period: 'weekly', name: 'Wall Of Light', description: 'Absorb 25,000 damage on shields.', stat: 'shieldAbsorbed', base: 25000, tierScale: 1.3, crystals: 235, rarity: 'epic', motif: 'engineering', artSeed: 8414 },
  { id: 'w_modules', period: 'weekly', name: 'Shipwright', description: 'Install 40 modules.', stat: 'modulesInstalled', base: 40, tierScale: 1.15, crystals: 255, rarity: 'epic', motif: 'engineering', artSeed: 8415 },
  { id: 'w_crystals', period: 'weekly', name: 'Crystal Vault', description: 'Earn 600 crystals from achievements.', stat: 'crystalsEarned', base: 600, tierScale: 1.2, crystals: 310, rarity: 'legendary', motif: 'economy', artSeed: 8416 },
  { id: 'w_chunks', period: 'weekly', name: 'Vacuum Duty', description: 'Collect 6,000 resource chunks.', stat: 'chunksCollected', base: 6000, tierScale: 1.3, crystals: 215, rarity: 'epic', motif: 'collection', artSeed: 8417 },
];

export const PERIOD_MS: Record<Period, number> = {
  minute: 60_000,
  hourly: 3_600_000,
  daily: 86_400_000,
  weekly: 604_800_000,
};

export const PERIOD_COUNT: Record<Period, number> = {
  minute: 5,
  hourly: 3,
  daily: 7,
  weekly: 15,
};

export const PERIOD_LABEL: Record<Period, string> = {
  minute: 'MINUTE', hourly: 'HOURLY', daily: 'DAILY', weekly: 'WEEKLY',
};

export const TEMPLATES_BY_PERIOD: Record<Period, AchievementTemplate[]> = {
  minute: MINUTE_TEMPLATES,
  hourly: HOURLY_TEMPLATES,
  daily: DAILY_TEMPLATES,
  weekly: WEEKLY_TEMPLATES,
};
