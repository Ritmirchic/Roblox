import type { SaveData } from '../core/save';
import type { RunConfig, RunSummary } from '../game/types';
import type { Ui } from './ui';

export type ScreenId = 'menu' | 'emberworks' | 'codex' | 'ledger' | 'settings' | 'run' | 'results';

export type RunMode = RunConfig['mode'];

export interface Toast {
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface ResultData {
  summary: RunSummary;
  newAchievements: string[];
  newCodex: number;
  isBestWave: boolean;
}

/** The surface screens are allowed to touch. Keeps screens decoupled from the loop. */
export interface AppLike {
  ui: Ui;
  save: SaveData;
  toasts: Toast[];
  lastResult: ResultData | null;
  runActive: boolean;
  go(screen: ScreenId): void;
  persist(): void;
  buyMetaNode(id: string): void;
  resetProgress(): void;
  startRun(mode: RunMode): void;
  resumeRun(): void;
  abandonRunToMenu(): void;
  setVolume(kind: 'master' | 'music' | 'sfx', value: number): void;
  setToggle(kind: 'damageNumbers' | 'screenShake' | 'reducedMotion', value: boolean): void;
  toast(text: string, color?: string): void;
  refreshAudio(): void;
  isFamilyUnlocked(id: string): boolean;
  dailySeedLabel(): string;
  time: number;
  settingsReturn: ScreenId;
  screen: ScreenId;
}

import type { FxSystem } from '../game/render/fx';
import type { Run } from '../game/sim/engine';

export interface RunHost extends AppLike {
  run: Run;
  fx: FxSystem;
  speed: number;
  setSpeed(value: number): void;
  consumeRunEvents(): void;
  finishRun(abandon?: boolean): void;
  restartRun(): void;
  syncCodex(): void;
  quickSaveSettings(): void;
}
