import type { FamilyId } from '../core/palette';

export type { FamilyId };

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export type StatusId = 'burn' | 'poison' | 'chill' | 'shock' | 'mark' | 'root';

export interface StatusInstance {
  stacks: number;
  time: number;
  power: number;
}

export interface Statuses {
  burn: StatusInstance;
  poison: StatusInstance;
  chill: StatusInstance;
  shock: StatusInstance;
  mark: StatusInstance;
  root: StatusInstance;
}

export type AttackBehavior =
  | 'bolt'
  | 'splash'
  | 'beam'
  | 'pulse'
  | 'chain'
  | 'nova'
  | 'support'
  | 'execute'
  | 'volley'
  | 'field';

export type TargetMode = 'first' | 'strongest' | 'closest' | 'weakest';

export type SigilFlag =
  | 'burnSpread'
  | 'markSpread'
  | 'bonusVsBurning'
  | 'bonusVsMarked'
  | 'executioner'
  | 'siphon'
  | 'armorBreak'
  | 'guaranteedCrit'
  | 'freezeOnHit'
  | 'hearthWard'
  | 'goldOnKill';

export interface StatusApply {
  id: StatusId;
  power: number;
  duration: number;
  stacks?: number;
}

export interface SigilDef {
  id: string;
  name: string;
  family: FamilyId;
  attack: AttackBehavior;
  role: string;
  description: string;
  flavor: string;
  cost: number;
  range: number;
  damage: number;
  interval: number;
  projectileSpeed?: number;
  splash?: number;
  chains?: number;
  shots?: number;
  status?: StatusApply;
  flags?: SigilFlag[];
  targetMode?: TargetMode;
  /** support aura: damage multiplier granted to adjacent sigils */
  auraDamage?: number;
  /** support aura: damage multiplier granted to every sigil */
  globalAuraDamage?: number;
  /** field / pulse radius override */
  radius?: number;
  rarity?: Rarity;
}

export interface ElderDef {
  id: string;
  family: FamilyId;
  name: string;
  role: string;
  description: string;
  flavor: string;
  attack: AttackBehavior;
  range: number;
  damage: number;
  interval: number;
  projectileSpeed?: number;
  splash?: number;
  chains?: number;
  shots?: number;
  status?: StatusApply;
  flags?: SigilFlag[];
  targetMode?: TargetMode;
  radius?: number;
  auraDamage?: number;
  globalAuraDamage?: number;
  healPerWave?: number;
  fuseCost: number;
}

export type RuneStat =
  | 'damageMult'
  | 'speedMult'
  | 'rangeFlat'
  | 'critChance'
  | 'statusPowerMult'
  | 'splashMult'
  | 'chainAdd'
  | 'hearthHeal'
  | 'goldOnKill';

export interface RuneDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  mods: Partial<Record<RuneStat, number>>;
  glyph: 'spiral' | 'triangle' | 'diamond' | 'eye' | 'fork' | 'bell';
}

export interface RelicEffect {
  damageMult?: number;
  speedMult?: number;
  rangeFlat?: number;
  hearthMax?: number;
  goldOnKill?: number;
  waveBonusGold?: number;
  interest?: number;
  critChance?: number;
  critMult?: number;
  startGold?: number;
  handSlot?: number;
  socket?: number;
  reroll?: number;
  healPerWave?: number;
  killHealEvery?: number;
  bossDamageMult?: number;
  statusPowerMult?: number;
  slowOnHit?: number;
  offerCount?: number;
  emberBonus?: number;
  leakShield?: number;
  firstLeakFree?: boolean;
  runeForBoss?: boolean;
  cheapFuse?: number;
  burnDps?: number;
  sigilCostMult?: number;
}

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  flavor: string;
  rarity: Rarity;
  effect: RelicEffect;
  glyph: 'lantern' | 'eye' | 'moth' | 'bell' | 'crown' | 'moon' | 'coin' | 'vine';
}

export interface EnemyAbility {
  kind: 'heal' | 'summon' | 'split' | 'armorAura' | 'hasteAura' | 'burrow' | 'shield' | 'enrage';
  power: number;
  radius?: number;
  interval?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  blurb: string;
  hp: number;
  speed: number;
  armor: number;
  gold: number;
  leak: number;
  kind: 'walker' | 'flier' | 'boss' | 'splitling';
  shape: 'wisp' | 'husk' | 'brute' | 'flier' | 'herald' | 'choir' | 'king' | 'creeper' | 'shade' | 'mite' | 'warder';
  color: string;
  size: number;
  boss?: boolean;
  resist?: Partial<Record<FamilyId, number>>;
  abilities?: EnemyAbility[];
}

export interface WaveGroup {
  type: string;
  count: number;
  gap: number;
  delay: number;
}

export interface WaveDef {
  index: number;
  act: number;
  name: string;
  subtitle: string;
  reward: number;
  groups: WaveGroup[];
  boss: boolean;
}

export interface Card {
  uid: number;
  kind: 'sigil' | 'rune' | 'relic' | 'cache';
  id: string;
  rarity: Rarity;
  /** sigil copies may be drafted pre-levelled */
  tier?: number;
  gold?: number;
}

export interface RuneOnTower {
  uid: number;
  id: string;
}

export interface Tower {
  uid: number;
  sigilId: string;
  family: FamilyId;
  elder: boolean;
  tier: number;
  plot: number;
  x: number;
  y: number;
  cooldown: number;
  angle: number;
  invested: number;
  kindle: number;
  runes: RuneOnTower[];
  sockets: number;
  /** resolved modifiers after auras/relics/meta */
  mods: {
    damage: number;
    interval: number;
    range: number;
    critChance: number;
    critMult: number;
    statusPower: number;
    splash: number;
    chains: number;
    auraDamage: number;
    globalAuraDamage: number;
  };
  kills: number;
  damageDealt: number;
  flash: number;
  recoil: number;
  healPerWave?: number;
}

export interface Enemy {
  uid: number;
  typeId: string;
  x: number;
  y: number;
  hp: number;
  hpMax: number;
  speed: number;
  baseSpeed: number;
  armor: number;
  statuses: Statuses;
  distAlong: number;
  lane: 'ground' | 'air';
  size: number;
  boss: boolean;
  leak: number;
  gold: number;
  abilityTimer: number;
  hitFlash: number;
  dead: boolean;
  escaped: boolean;
  slowUntil?: number;
  enraged: boolean;
  shielded: number;
  shieldTime: number;
  seed: number;
  /** render-only sway timer */
  age: number;
}

export interface Projectile {
  uid: number;
  towerUid: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetUid: number;
  speed: number;
  damage: number;
  family: FamilyId;
  splash: number;
  life: number;
  status?: StatusApply;
  flags: SigilFlag[];
  color: string;
  crit: boolean;
}

export interface Beam {
  uid: number;
  towerUid: number;
  targetUid: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  family: FamilyId;
  width: number;
}

export interface SimEvent {
  t:
    | 'shoot'
    | 'beam'
    | 'impact'
    | 'pulse'
    | 'hit'
    | 'kill'
    | 'leak'
    | 'spawn'
    | 'waveStart'
    | 'waveClear'
    | 'draft'
    | 'gameOver'
    | 'victory'
    | 'place'
    | 'fuse'
    | 'rune'
    | 'relic'
    | 'heal'
    | 'kindle'
    | 'deny'
    | 'boss';
  x?: number;
  y?: number;
  amount?: number;
  family?: FamilyId;
  crit?: boolean;
  text?: string;
  uid?: number;
  towerUid?: number;
  status?: StatusId;
  tier?: number;
}

export interface RunConfig {
  mode: 'vigil' | 'nightfall' | 'daily' | 'endless';
  seed: number;
  dayKey?: string;
}

export interface RunSummary {
  mode: RunConfig['mode'];
  seed: number;
  dayKey?: string;
  wave: number;
  kills: number;
  leaks: number;
  fusions: number;
  elders: number;
  hearth: number;
  hearthMax: number;
  gold: number;
  maxGold: number;
  goldEarned: number;
  lostHearth: number;
  time: number;
  victory: boolean;
  embers: number;
  bossesKilled: number;
  familiesUsed: FamilyId[];
  tier3AtOnce: number;
  eldersAtOnce: number;
  towers: { sigilId: string; family: FamilyId; tier: number; elder: boolean }[];
  relics: string[];
  runes: string[];
  damageByFamily: Record<FamilyId, number>;
}
