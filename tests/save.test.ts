import { describe, expect, it, beforeEach } from 'vitest';
import { SAVE_KEY, SAVE_VERSION, defaultSave, getStorage, loadSave, sanitizeSave, saveGame } from '../src/core/save';
import { SAVE_SCHEMA } from '../src/game/data/schema';
import { ACHIEVEMENTS } from '../src/game/data/achievements';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  raw(key = SAVE_KEY): string | null {
    return this.map.get(key) ?? null;
  }
  poke(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('save data', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('starts empty when nothing is stored', () => {
    const { data, recovered } = loadSave(storage, SAVE_SCHEMA);
    expect(recovered).toBe(false);
    expect(data.version).toBe(SAVE_VERSION);
    expect(data.meta.embers).toBe(0);
    expect(data.meta.unlockedFamilies).toEqual(['ember']);
  });

  it('round-trips progress', () => {
    const save = defaultSave();
    save.meta.embers = 123;
    save.meta.act1Cleared = true;
    save.meta.unlockedFamilies = ['ember', 'frost'];
    save.stats.deepestWave = 12;
    save.codex['sigil:cinder_lance'] = 5;
    save.settings.music = 0.25;
    expect(saveGame(storage, save)).toBe(true);

    const { data } = loadSave(storage, SAVE_SCHEMA);
    expect(data.meta.embers).toBe(123);
    expect(data.meta.act1Cleared).toBe(true);
    expect(data.meta.unlockedFamilies).toEqual(['ember', 'frost']);
    expect(data.stats.deepestWave).toBe(12);
    expect(data.codex['sigil:cinder_lance']).toBe(5);
    expect(data.settings.music).toBeCloseTo(0.25, 5);
  });

  it('recovers from truncated json and reports the corruption', () => {
    storage.poke(SAVE_KEY, '{"version":1,"meta":{"embers":');
    const { data, recovered } = loadSave(storage, SAVE_SCHEMA);
    expect(recovered).toBe(true);
    expect(data.meta.embers).toBe(0);
  });

  it('recovers from a non-object payload', () => {
    storage.poke(SAVE_KEY, '"just a string"');
    const { data, recovered } = loadSave(storage, SAVE_SCHEMA);
    expect(recovered).toBe(true);
    expect(data.stats.runs).toBe(0);
  });

  it('discards unknown meta nodes and clamps hostile numbers', () => {
    storage.poke(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        meta: { embers: -500, nodes: { not_a_node: 9, wick_trim: 99 }, unlockedFamilies: ['ember', 'bogus'] },
        stats: { runs: 'many', deepestWave: 9e9 },
        settings: { master: 12, music: -4, sfx: 0.4 },
      }),
    );
    const { data } = loadSave(storage, SAVE_SCHEMA);
    expect(data.meta.embers).toBeGreaterThanOrEqual(0);
    expect(data.meta.nodes.not_a_node).toBeUndefined();
    const trimMax = 3;
    expect(data.meta.nodes.wick_trim).toBeLessThanOrEqual(trimMax);
    expect(data.meta.unlockedFamilies).not.toContain('bogus');
    expect(data.stats.runs).toBe(0);
    expect(data.settings.master).toBeLessThanOrEqual(1);
    expect(data.settings.music).toBeGreaterThanOrEqual(0);
    expect(data.settings.sfx).toBeCloseTo(0.4, 5);
    expect(Number.isFinite(data.stats.deepestWave)).toBe(true);
  });

  it('keeps a save from a newer version but flags it', () => {
    storage.poke(
      SAVE_KEY,
      JSON.stringify({ version: SAVE_VERSION + 4, meta: { embers: 42, unlockedFamilies: ['ember'] } }),
    );
    const { data, recovered } = loadSave(storage, SAVE_SCHEMA);
    expect(recovered).toBe(true);
    expect(data.meta.embers).toBe(42);
  });

  it('sanitises achievement and codex noise', () => {
    const clean = sanitizeSave(
      {
        version: 1,
        achievements: { first_light: 111, totally_fake: 1 },
        codex: { 'sigil:cinder_lance': 2, 'sigil:nope': 3, garbage: 1 },
        bestiary: ['wisp', 'not_a_monster'],
      },
      SAVE_SCHEMA,
      defaultSave(),
    );
    expect(clean.achievements.first_light).toBe(111);
    expect(clean.achievements.totally_fake).toBeUndefined();
    expect(clean.codex['sigil:cinder_lance']).toBe(2);
    expect(clean.codex['sigil:nope']).toBeUndefined();
    expect(clean.codex.garbage).toBeUndefined();
    expect(clean.bestiary).toContain('wisp');
    expect(clean.bestiary).not.toContain('not_a_monster');
  });

  it('survives storage that throws', () => {
    const hostile = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    const { data, recovered } = loadSave(hostile, SAVE_SCHEMA);
    expect(recovered).toBe(true);
    expect(data.version).toBe(SAVE_VERSION);
    expect(saveGame(hostile, data)).toBe(false);
  });

  it('exposes achievements with unique ids and reachable rewards', () => {
    const ids = new Set<string>();
    for (const ach of ACHIEVEMENTS) {
      expect(ids.has(ach.id)).toBe(false);
      ids.add(ach.id);
      expect(ach.name.length).toBeGreaterThan(2);
      expect(ach.description.length).toBeGreaterThan(8);
      expect(ach.reward).toBeGreaterThan(0);
    }
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
  });

  it('resolves a storage handle only when writes work', () => {
    const handle = getStorage();
    // jsdom-free environment: either null or a working handle.
    if (handle) {
      handle.setItem('probe-key', '1');
      expect(handle.getItem('probe-key')).toBe('1');
      handle.removeItem('probe-key');
    } else {
      expect(handle).toBeNull();
    }
  });
});
