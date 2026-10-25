/** The set of content ids a save file is allowed to mention. */
import { ACHIEVEMENTS } from './achievements';
import { ENEMY_BY_ID } from './enemies';
import { META_NODES } from './meta';
import { RELIC_BY_ID } from './relics';
import { RUNE_BY_ID } from './runes';
import { SIGIL_BY_ID } from './sigils';
import type { SaveSchema } from '../../core/save';

const nodeMaxRanks = new Map<string, number>(META_NODES.map((node) => [node.id, node.maxRank]));
const achievementIds = new Set(ACHIEVEMENTS.map((a) => a.id));

const CODEX_PREFIXES = new Set(['sigil', 'elder', 'relic', 'rune', 'enemy']);

const isCodexKey = (key: string): boolean => {
  const [prefix, ...rest] = key.split(':');
  const id = rest.join(':');
  if (!prefix || !id || !CODEX_PREFIXES.has(prefix)) return false;
  switch (prefix) {
    case 'sigil':
    case 'elder':
      return Boolean(SIGIL_BY_ID[id]);
    case 'relic':
      return Boolean(RELIC_BY_ID[id]);
    case 'rune':
      return Boolean(RUNE_BY_ID[id]);
    case 'enemy':
      return Boolean(ENEMY_BY_ID[id]);
    default:
      return false;
  }
};

export const SAVE_SCHEMA: SaveSchema = {
  nodeMaxRanks,
  achievementIds,
  isCodexKey,
  isEnemyId: (id: string) => Boolean(ENEMY_BY_ID[id]),
};
