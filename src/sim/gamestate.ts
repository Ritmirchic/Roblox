/**
 * Central player profile: currencies, ship, inventory, crew, upgrades, sectors, statistics.
 * Owns the versioned save format and all validation / corruption handling.
 */
import { ShipDesign } from './shipgrid.ts';
import { AchievementEngine, emptyAchievementState, type AchievementSaveState } from './achievements.ts';
import { aggregateBonuses, mergeEffects, sanitizeEquipped, type BonusMap } from './crewsim.ts';
import { crewSlots, progressionTier } from './economy.ts';
import { DEFAULT_UPGRADE_SLOTS, MAX_UPGRADE_SLOTS, UPGRADE_BY_ID, unlockedSlots } from './upgrades.ts';
import { CREW_BY_ID } from '../data/crew.ts';
import { MODULE_BY_ID, getModule, scaledStat, upgradeCost } from '../data/modules.ts';
import { SECTORS } from '../data/sectors.ts';
import type { StatKey } from '../data/achievements.ts';

export const SAVE_VERSION = 3;
export const SAVE_KEY = 'spaceminer.save.v3';

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  cameraSensitivity: number;
  quality: 'low' | 'medium' | 'high';
  invertY: boolean;
  skipPackAnimation: boolean;
}

export interface Statistics {
  asteroidsMined: number;
  enemiesKilled: number;
  oreCollected: number;
  creditsEarned: number;
  crystalsEarned: number;
  expeditions: number;
  distance: number;
  packsOpened: number;
  deepestSector: number;
  playTimeMs: number;
  rareFinds: number;
  damageDealt: number;
}

export function defaultSettings(): Settings {
  return {
    musicVolume: 0.45, sfxVolume: 0.75, reducedMotion: false,
    cameraSensitivity: 1, quality: 'high', invertY: false, skipPackAnimation: false,
  };
}

export function defaultStatistics(): Statistics {
  return {
    asteroidsMined: 0, enemiesKilled: 0, oreCollected: 0, creditsEarned: 0, crystalsEarned: 0,
    expeditions: 0, distance: 0, packsOpened: 0, deepestSector: 0, playTimeMs: 0, rareFinds: 0, damageDealt: 0,
  };
}

export interface SaveData {
  version: number;
  savedAt: number;
  credits: number;
  crystals: number;
  ship: ReturnType<ShipDesign['serialize']>;
  inventory: Record<string, number>;
  ore: Record<string, number>;
  crew: string[];
  equippedCrew: string[];
  activeUpgrades: (string | null)[];
  ownedUpgrades: Record<string, number>;
  fourthSlotPurchased: boolean;
  fifthSlotUnlocked: boolean;
  unlockedSectors: string[];
  achievements: AchievementSaveState;
  settings: Settings;
  stats: Statistics;
  packPity: number;
  checksum?: number;
}

/** Lightweight checksum so obviously corrupted saves can be detected. */
export function checksum(obj: unknown): number {
  const str = JSON.stringify(obj);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class GameState {
  credits = 2500;
  crystals = 120;
  ship: ShipDesign = ShipDesign.starterShip();
  /** Unplaced modules the player owns. */
  inventory: Record<string, number> = { hull_basic: 2 };
  /** Ore in the hangar silo, sellable for credits. */
  ore: Record<string, number> = {};
  crew = new Set<string>();
  equippedCrew: string[] = [];
  activeUpgrades: (string | null)[] = [null, null, null, null, null];
  ownedUpgrades: Record<string, number> = {};
  fourthSlotPurchased = false;
  fifthSlotUnlocked = false;
  unlockedSectors = new Set<string>(['starter_belt']);
  achievements = new AchievementEngine(emptyAchievementState());
  settings: Settings = defaultSettings();
  stats: Statistics = defaultStatistics();
  packPity = 0;
  /** Runtime-only flag set when the last save was rejected. */
  loadWarning: string | null = null;

  get crewSlots(): number {
    return crewSlots(this.ship.purchasedCount);
  }

  get upgradeSlots(): number {
    return unlockedSlots(this.fourthSlotPurchased, this.fifthSlotUnlocked);
  }

  get tier(): number {
    return progressionTier(this.ship.purchasedCount, this.unlockedSectors.size, this.ship.modules.length);
  }

  /** Crew + active upgrade bonuses merged into a single lookup table. */
  bonuses(): BonusMap {
    const crewBonuses = aggregateBonuses(this.equippedCrew);
    const effects = this.activeUpgrades
      .slice(0, this.upgradeSlots)
      .filter((id): id is string => !!id)
      .map((id) => UPGRADE_BY_ID.get(id)?.effect)
      .filter((e): e is { key: string; value: number } => !!e);
    return mergeEffects(crewBonuses, effects);
  }

  addCredits(amount: number): void {
    if (amount <= 0) return;
    this.credits += amount;
    this.stats.creditsEarned += amount;
    this.achievements.track('creditsEarned', amount);
  }

  spendCredits(amount: number): boolean {
    if (amount > this.credits) return false;
    this.credits -= amount;
    return true;
  }

  addCrystals(amount: number): void {
    if (amount <= 0) return;
    this.crystals += amount;
    this.stats.crystalsEarned += amount;
    this.achievements.track('crystalsEarned', amount);
  }

  spendCrystals(amount: number): boolean {
    if (amount > this.crystals) return false;
    this.crystals -= amount;
    return true;
  }

  trackStat(stat: StatKey, amount: number): void {
    this.achievements.track(stat, amount);
  }

  /** Buys a module into the inventory. */
  buyModule(defId: string): boolean {
    const def = MODULE_BY_ID.get(defId);
    if (!def) return false;
    if (!this.spendCredits(def.price)) return false;
    this.inventory[defId] = (this.inventory[defId] ?? 0) + 1;
    return true;
  }

  takeFromInventory(defId: string): boolean {
    if ((this.inventory[defId] ?? 0) <= 0) return false;
    this.inventory[defId] -= 1;
    if (this.inventory[defId] <= 0) delete this.inventory[defId];
    return true;
  }

  returnToInventory(defId: string): void {
    this.inventory[defId] = (this.inventory[defId] ?? 0) + 1;
  }

  upgradeModule(uid: string): boolean {
    const mod = this.ship.modules.find((m) => m.uid === uid);
    if (!mod) return false;
    const def = getModule(mod.defId);
    if (mod.level >= def.maxLevel) return false;
    const cost = upgradeCost(def, mod.level);
    if (!this.spendCredits(cost)) return false;
    mod.level += 1;
    mod.health = scaledStat(def.durability, mod.level);
    this.achievements.track('moduleUpgrades', 1);
    return true;
  }

  equipCrew(id: string): boolean {
    if (!this.crew.has(id)) return false;
    if (this.equippedCrew.includes(id)) return false;
    if (this.equippedCrew.length >= this.crewSlots) return false;
    this.equippedCrew.push(id);
    return true;
  }

  unequipCrew(id: string): boolean {
    const i = this.equippedCrew.indexOf(id);
    if (i < 0) return false;
    this.equippedCrew.splice(i, 1);
    return true;
  }

  grantCard(id: string): boolean {
    if (!CREW_BY_ID.has(id)) return false;
    if (this.crew.has(id)) return false;
    this.crew.add(id);
    this.achievements.setStat('cardsOwned', this.crew.size);
    return true;
  }

  setActiveUpgrade(slot: number, id: string | null): boolean {
    if (slot < 0 || slot >= this.upgradeSlots) return false;
    if (id && !this.ownedUpgrades[id]) return false;
    if (id && this.activeUpgrades.indexOf(id) >= 0 && this.activeUpgrades.indexOf(id) !== slot) return false;
    this.activeUpgrades[slot] = id;
    this.achievements.setStat('upgradesInstalled', this.activeUpgrades.filter(Boolean).length);
    return true;
  }

  unlockSector(id: string): boolean {
    const sector = SECTORS.find((s) => s.id === id);
    if (!sector || this.unlockedSectors.has(id)) return false;
    if (!this.spendCredits(sector.unlockCost)) return false;
    this.unlockedSectors.add(id);
    this.stats.deepestSector = Math.max(this.stats.deepestSector, sector.index);
    this.achievements.track('sectorsUnlocked', 1);
    this.achievements.setStat('cardsOwned', this.crew.size);
    return true;
  }

  // -------------------------------------------------------------- persistence
  serialize(): SaveData {
    const data: SaveData = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      credits: Math.round(this.credits),
      crystals: Math.round(this.crystals),
      ship: this.ship.serialize(),
      inventory: { ...this.inventory },
      ore: { ...this.ore },
      crew: [...this.crew],
      equippedCrew: [...this.equippedCrew],
      activeUpgrades: [...this.activeUpgrades],
      ownedUpgrades: { ...this.ownedUpgrades },
      fourthSlotPurchased: this.fourthSlotPurchased,
      fifthSlotUnlocked: this.fifthSlotUnlocked,
      unlockedSectors: [...this.unlockedSectors],
      achievements: this.achievements.state,
      settings: { ...this.settings },
      stats: { ...this.stats },
      packPity: this.packPity,
    };
    data.checksum = checksum({ ...data, checksum: undefined });
    return data;
  }

  static deserialize(raw: unknown): { state: GameState; warning: string | null } {
    const state = new GameState();
    let warning: string | null = null;
    if (!raw || typeof raw !== 'object') return { state, warning: 'No save data found - starting a new campaign.' };
    const data = raw as Partial<SaveData>;

    if (typeof data.version !== 'number' || data.version > SAVE_VERSION) {
      return { state, warning: 'Save was written by a newer version - starting fresh to avoid corruption.' };
    }
    if (data.checksum !== undefined) {
      const expect = checksum({ ...data, checksum: undefined });
      if (expect !== data.checksum) warning = 'Save checksum mismatch - recovered what could be validated.';
    }

    const num = (v: unknown, fallback: number) => (Number.isFinite(v as number) && (v as number) >= 0 ? (v as number) : fallback);
    state.credits = num(data.credits, 2500);
    state.crystals = num(data.crystals, 120);
    state.packPity = num(data.packPity, 0);

    try {
      state.ship = ShipDesign.deserialize(data.ship);
    } catch {
      warning = 'Ship layout could not be restored - rebuilt the starter frame.';
      state.ship = ShipDesign.starterShip();
    }

    state.inventory = {};
    if (data.inventory && typeof data.inventory === 'object') {
      for (const [id, count] of Object.entries(data.inventory)) {
        if (MODULE_BY_ID.has(id) && Number.isFinite(count) && (count as number) > 0) {
          state.inventory[id] = Math.floor(count as number);
        }
      }
    }
    state.ore = {};
    if (data.ore && typeof data.ore === 'object') {
      for (const [id, qty] of Object.entries(data.ore)) {
        if (Number.isFinite(qty) && (qty as number) > 0) state.ore[id] = qty as number;
      }
    }

    state.crew = new Set((data.crew ?? []).filter((id) => CREW_BY_ID.has(id)));
    state.fourthSlotPurchased = !!data.fourthSlotPurchased;
    state.fifthSlotUnlocked = !!data.fifthSlotUnlocked;
    state.equippedCrew = sanitizeEquipped(data.equippedCrew ?? [], crewSlots(state.ship.purchasedCount), state.crew);

    state.ownedUpgrades = {};
    if (data.ownedUpgrades && typeof data.ownedUpgrades === 'object') {
      for (const [id, lvl] of Object.entries(data.ownedUpgrades)) {
        if (UPGRADE_BY_ID.has(id) && Number.isFinite(lvl)) state.ownedUpgrades[id] = Math.max(1, Math.floor(lvl as number));
      }
    }
    const slots = unlockedSlots(state.fourthSlotPurchased, state.fifthSlotUnlocked);
    const seenUpg = new Set<string>();
    state.activeUpgrades = [null, null, null, null, null];
    (data.activeUpgrades ?? []).slice(0, MAX_UPGRADE_SLOTS).forEach((id, i) => {
      if (i >= slots || !id) return;
      if (!state.ownedUpgrades[id] || seenUpg.has(id)) return;
      seenUpg.add(id);
      state.activeUpgrades[i] = id;
    });

    state.unlockedSectors = new Set(['starter_belt']);
    for (const id of data.unlockedSectors ?? []) {
      if (SECTORS.some((s) => s.id === id)) state.unlockedSectors.add(id);
    }

    const achState = data.achievements && typeof data.achievements === 'object'
      ? { ...emptyAchievementState(), ...data.achievements }
      : emptyAchievementState();
    state.achievements = new AchievementEngine(achState);

    state.settings = { ...defaultSettings(), ...(data.settings ?? {}) };
    state.stats = { ...defaultStatistics(), ...(data.stats ?? {}) };
    return { state, warning };
  }

  save(storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null): boolean {
    if (!storage) return false;
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(this.serialize()));
      return true;
    } catch {
      return false;
    }
  }

  static load(storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null): GameState {
    if (!storage) return new GameState();
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) return new GameState();
      const parsed = JSON.parse(raw);
      const { state, warning } = GameState.deserialize(parsed);
      state.loadWarning = warning;
      return state;
    } catch {
      const fresh = new GameState();
      fresh.loadWarning = 'Save file was unreadable - a new campaign was created.';
      return fresh;
    }
  }
}

export { DEFAULT_UPGRADE_SLOTS, MAX_UPGRADE_SLOTS };
