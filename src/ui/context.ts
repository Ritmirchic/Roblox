/** Shared context handed to every UI panel. */
import type { GameState } from '../sim/gamestate.ts';
import type { Shell } from './shell.ts';
import type { HangarScene } from '../scenes/hangar.ts';
import type { SectorDef } from '../data/sectors.ts';

export interface UIContext {
  state: GameState;
  shell: Shell;
  hangar: HangarScene;
  save: () => void;
  refresh: () => void;
  launch: (sector: SectorDef) => void;
  notify: (msg: string, kind?: 'info' | 'error' | 'success') => void;
}
