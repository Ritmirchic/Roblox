/**
 * Versioned save data. Everything is validated on load: a corrupted or
 * hand-edited localStorage value must never break the game.
 */
import type { FamilyId } from './palette';

export const SAVE_KEY = 'wick-and-wane.save.v1';
export const SAVE_VERSION = 1;

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  reducedMotion: boolean;
  damageNumbers: boolean;
  screenShake: boolean;
}

export interface MetaState {
  /** Unspent currency. */
  embers: number;
  /** Lifetime earned, used for stats + never decreases. */
  embersEarned: number;
  /** nodeId -> purchased rank */
  nodes: Record<string, number>;
  unlockedFamilies: FamilyId[];
  /** Set once the player completes act 1, opens endless + daily bonuses. */
  act1Cleared: boolean;
}

export interface StatsState {
  runs: number;
  wins: number;
  deepestWave: number;
  bestDailyWave: number;
  kills: number;
  leaks: number;
  fusions: number;
  elders: number;
  goldEarned: number;
  playSeconds: number;
  familyRuns: Record<string, number>;
  familyWins: Record<string, number>;
}

export interface SaveData {
  version: number;
  createdAt: number;
  updatedAt: number;
  settings: Settings;
  meta: MetaState;
  /** achievementId -> unlock timestamp (0 = locked) */
  achievements: Record<string, number>;
  /** codexId -> discovered timestamp */
  codex: Record<string, number>;
  /** enemy ids that have been killed at least once */
  bestiary: string[];
  stats: StatsState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const FAMILIES: FamilyId[] = ['ember', 'frost', 'verdant', 'volt', 'umbral'];

export const defaultSettings = (): Settings => ({
  master: 0.8,
  music: 0.55,
  sfx: 0.8,
  reducedMotion: false,
  damageNumbers: true,
  screenShake: true,
});

export const defaultSave = (now = Date.now()): SaveData => ({
  version: SAVE_VERSION,
  createdAt: now,
  updatedAt: now,
  settings: defaultSettings(),
  meta: {
    embers: 0,
    embersEarned: 0,
    nodes: {},
    unlockedFamilies: ['ember'],
    act1Cleared: false,
  },
  achievements: {},
  codex: {},
  bestiary: [],
  stats: {
    runs: 0,
    wins: 0,
    deepestWave: 0,
    bestDailyWave: 0,
    kills: 0,
    leaks: 0,
    fusions: 0,
    elders: 0,
    goldEarned: 0,
    playSeconds: 0,
    familyRuns: {},
    familyWins: {},
  },
});

const num = (value: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const stampRecord = (value: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  const raw = obj(value);
  for (const [key, v] of Object.entries(raw)) {
    const t = num(v, 0, 0);
    if (t > 0) out[key] = t;
  }
  return out;
};

const filterRecord = (
  record: Record<string, number>,
  keep: (key: string) => boolean,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) if (keep(key)) out[key] = value;
  return out;
};

/** What the game considers valid content, so old or hostile saves cannot smuggle in junk. */
export interface SaveSchema {
  nodeMaxRanks: Map<string, number>;
  achievementIds: Set<string>;
  isCodexKey: (key: string) => boolean;
  isEnemyId: (id: string) => boolean;
}

/**
 * Coerce arbitrary parsed JSON into a valid SaveData. Unknown fields are
 * dropped, out-of-range numbers clamped, wrong types replaced.
 */
export const sanitizeSave = (
  raw: unknown,
  schema: SaveSchema,
  defaults: SaveData = defaultSave(),
): SaveData => {
  const root = obj(raw);
  const settingsRaw = obj(root.settings);
  const metaRaw = obj(root.meta);
  const statsRaw = obj(root.stats);

  const settings: Settings = {
    master: num(settingsRaw.master, defaults.settings.master, 0, 1),
    music: num(settingsRaw.music, defaults.settings.music, 0, 1),
    sfx: num(settingsRaw.sfx, defaults.settings.sfx, 0, 1),
    reducedMotion: bool(settingsRaw.reducedMotion, defaults.settings.reducedMotion),
    damageNumbers: bool(settingsRaw.damageNumbers, defaults.settings.damageNumbers),
    screenShake: bool(settingsRaw.screenShake, defaults.settings.screenShake),
  };

  const nodes: Record<string, number> = {};
  const rawNodes = obj(metaRaw.nodes);
  for (const [id, rank] of Object.entries(rawNodes)) {
    const max = schema.nodeMaxRanks.get(id);
    if (max === undefined) continue;
    const r = Math.floor(num(rank, 0, 0, max));
    if (r > 0) nodes[id] = r;
  }

  const unlockedRaw = Array.isArray(metaRaw.unlockedFamilies)
    ? metaRaw.unlockedFamilies
    : defaults.meta.unlockedFamilies;
  const unlockedFamilies: FamilyId[] = FAMILIES.filter((f) =>
    (unlockedRaw as unknown[]).includes(f),
  );
  if (!unlockedFamilies.includes('ember')) unlockedFamilies.unshift('ember');

  const bestiaryRaw = Array.isArray(root.bestiary) ? root.bestiary : [];
  const bestiary = Array.from(
    new Set(bestiaryRaw.filter((v): v is string => typeof v === 'string' && schema.isEnemyId(v))),
  ).slice(0, 500);

  const familyRuns: Record<string, number> = {};
  const familyWins: Record<string, number> = {};
  for (const f of FAMILIES) {
    familyRuns[f] = Math.floor(num(obj(statsRaw.familyRuns)[f], 0, 0));
    familyWins[f] = Math.floor(num(obj(statsRaw.familyWins)[f], 0, 0));
  }

  return {
    version: SAVE_VERSION,
    createdAt: num(root.createdAt, defaults.createdAt, 0),
    updatedAt: Date.now(),
    settings,
    meta: {
      embers: Math.floor(num(metaRaw.embers, 0, 0, 1e9)),
      embersEarned: Math.floor(num(metaRaw.embersEarned, 0, 0, 1e9)),
      nodes,
      unlockedFamilies,
      act1Cleared: bool(metaRaw.act1Cleared, false),
    },
    achievements: filterRecord(stampRecord(root.achievements), (k) => schema.achievementIds.has(k)),
    codex: filterRecord(stampRecord(root.codex), schema.isCodexKey),
    bestiary,
    stats: {
      runs: Math.floor(num(statsRaw.runs, 0, 0)),
      wins: Math.floor(num(statsRaw.wins, 0, 0)),
      deepestWave: Math.floor(num(statsRaw.deepestWave, 0, 0, 9999)),
      bestDailyWave: Math.floor(num(statsRaw.bestDailyWave, 0, 0, 9999)),
      kills: Math.floor(num(statsRaw.kills, 0, 0, 1e9)),
      leaks: Math.floor(num(statsRaw.leaks, 0, 0, 1e9)),
      fusions: Math.floor(num(statsRaw.fusions, 0, 0, 1e9)),
      elders: Math.floor(num(statsRaw.elders, 0, 0, 1e9)),
      goldEarned: Math.floor(num(statsRaw.goldEarned, 0, 0, 1e9)),
      playSeconds: Math.floor(num(statsRaw.playSeconds, 0, 0, 1e9)),
      familyRuns,
      familyWins,
    },
  };
};

export const loadSave = (
  storage: StorageLike | null,
  schema: SaveSchema,
  now = Date.now(),
): { data: SaveData; recovered: boolean } => {
  const defaults = defaultSave(now);
  if (!storage) return { data: defaults, recovered: false };
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return { data: defaults, recovered: true };
  }
  if (!raw) return { data: defaults, recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { data: defaults, recovered: true };
    const version = num(obj(parsed).version, 0, 0);
    // Only v1 exists today; a future migration step would branch here.
    if (version > SAVE_VERSION) {
      return { data: sanitizeSave(parsed, schema, defaults), recovered: true };
    }
    return { data: sanitizeSave(parsed, schema, defaults), recovered: false };
  } catch {
    return { data: defaults, recovered: true };
  }
};

export const saveGame = (storage: StorageLike | null, data: SaveData): boolean => {
  if (!storage) return false;
  try {
    data.updatedAt = Date.now();
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

export const clearSave = (storage: StorageLike | null): void => {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
};

/** Resolve a safe localStorage handle (private mode / SSR safe). */
export const getStorage = (): StorageLike | null => {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const probe = '__ww_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
};
