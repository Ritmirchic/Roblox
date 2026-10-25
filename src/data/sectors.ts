/**
 * The five space regions. Each sector drives asteroid types, lighting, hazards,
 * enemy composition and resource tables for the expedition scene.
 */

export interface ResourceDef {
  id: string;
  name: string;
  color: number;
  value: number;      // credits per unit
  rare: boolean;
}

export const RESOURCES: Record<string, ResourceDef> = {
  iron:     { id: 'iron',     name: 'Iron',            color: 0xb0b6c2, value: 3,   rare: false },
  copper:   { id: 'copper',   name: 'Copper',          color: 0xd98b52, value: 5,   rare: false },
  silicate: { id: 'silicate', name: 'Silicate',        color: 0x9fd4c8, value: 7,   rare: false },
  titanium: { id: 'titanium', name: 'Titanium',        color: 0xd7e3f4, value: 14,  rare: false },
  crystal:  { id: 'crystal',  name: 'Lumen Crystal',   color: 0x7be0ff, value: 32,  rare: true  },
  plasmite: { id: 'plasmite', name: 'Plasmite',        color: 0xff8a3c, value: 55,  rare: true  },
  voidium:  { id: 'voidium',  name: 'Voidium',         color: 0xb98cff, value: 120, rare: true  },
  aurum:    { id: 'aurum',    name: 'Aurum Shard',     color: 0xffd166, value: 85,  rare: true  },
};

export interface EnemySpawn {
  type: 'scout' | 'raider' | 'heavy' | 'plasma' | 'sentinel';
  weight: number;
}

export interface SectorDef {
  id: string;
  index: number;
  name: string;
  tagline: string;
  description: string;
  unlockCost: number;
  /** Danger 1..5 used for scaling enemy count and stats. */
  danger: number;
  /** Ambient/fog/star colours. */
  ambient: number;
  fog: number;
  sun: number;
  sun2: number;
  nebula: [number, number];
  /** Asteroid resource table: resource id -> weight. */
  resourceTable: Record<string, number>;
  asteroidCount: number;
  asteroidScale: [number, number];
  /** Rock material style for the procedural asteroid builder. */
  rockStyle: 'basalt' | 'crystal' | 'metal' | 'volcanic' | 'void';
  enemies: EnemySpawn[];
  enemyBudget: number;
  hazard: 'none' | 'debris' | 'lightning' | 'anomaly';
  rewardMultiplier: number;
}

export const SECTORS: SectorDef[] = [
  {
    id: 'starter_belt', index: 0, name: 'STARTER BELT', tagline: 'Common ore. Low danger.',
    description: 'A quiet training belt of iron and copper rubble, patrolled by a handful of scout drones.',
    unlockCost: 0, danger: 1,
    ambient: 0x2a3c66, fog: 0x060a1c, sun: 0xfff2d6, sun2: 0x3a6cff, nebula: [0x24407f, 0x101a3a],
    resourceTable: { iron: 58, copper: 26, silicate: 12, titanium: 3, crystal: 1 },
    asteroidCount: 42, asteroidScale: [5, 13], rockStyle: 'basalt',
    enemies: [{ type: 'scout', weight: 85 }, { type: 'raider', weight: 15 }],
    enemyBudget: 5, hazard: 'none', rewardMultiplier: 1,
  },
  {
    id: 'crystal_nebula', index: 1, name: 'CRYSTAL NEBULA', tagline: 'Rare crystals. Colourful cosmic clouds.',
    description: 'Luminous gas shrouds crystalline asteroids that refract your mining beams into rainbows.',
    unlockCost: 14000, danger: 2,
    ambient: 0x4b2f7a, fog: 0x120626, sun: 0xffd6ff, sun2: 0x00e5ff, nebula: [0x8b3bd8, 0x2b1060],
    resourceTable: { silicate: 30, crystal: 34, iron: 18, titanium: 12, aurum: 6 },
    asteroidCount: 46, asteroidScale: [6, 16], rockStyle: 'crystal',
    enemies: [{ type: 'scout', weight: 45 }, { type: 'raider', weight: 40 }, { type: 'heavy', weight: 15 }],
    enemyBudget: 8, hazard: 'debris', rewardMultiplier: 1.4,
  },
  {
    id: 'iron_graveyard', index: 2, name: 'IRON GRAVEYARD', tagline: 'Abandoned hulls. Hostile drones.',
    description: 'A battlefield frozen in vacuum: shattered capital ships, drifting plate and automated killers.',
    unlockCost: 42000, danger: 3,
    ambient: 0x3a4152, fog: 0x0a0d14, sun: 0xc9d6ff, sun2: 0xff6b4a, nebula: [0x3c4a60, 0x15181f],
    resourceTable: { iron: 40, titanium: 32, copper: 16, crystal: 6, aurum: 6 },
    asteroidCount: 40, asteroidScale: [6, 18], rockStyle: 'metal',
    enemies: [{ type: 'raider', weight: 40 }, { type: 'heavy', weight: 38 }, { type: 'scout', weight: 22 }],
    enemyBudget: 12, hazard: 'debris', rewardMultiplier: 1.9,
  },
  {
    id: 'plasma_storm', index: 3, name: 'PLASMA STORM', tagline: 'Electrical hazards. Rare minerals.',
    description: 'Arc discharges sweep the field. Ride the gaps between strikes to reach the plasmite veins.',
    unlockCost: 96000, danger: 4,
    ambient: 0x7a3a1f, fog: 0x1c0a06, sun: 0xffa64d, sun2: 0x49b6ff, nebula: [0xff7a2f, 0x3a1206],
    resourceTable: { plasmite: 34, titanium: 24, crystal: 18, iron: 14, aurum: 10 },
    asteroidCount: 38, asteroidScale: [7, 20], rockStyle: 'volcanic',
    enemies: [{ type: 'plasma', weight: 46 }, { type: 'heavy', weight: 30 }, { type: 'raider', weight: 24 }],
    enemyBudget: 15, hazard: 'lightning', rewardMultiplier: 2.6,
  },
  {
    id: 'void_frontier', index: 4, name: 'VOID FRONTIER', tagline: 'Extreme resources. Lethal guardians.',
    description: 'Past the last beacon. Voidium drifts here, guarded by sentinels that predate the charts.',
    unlockCost: 220000, danger: 5,
    ambient: 0x1b2e3f, fog: 0x03060c, sun: 0x9fe8ff, sun2: 0xb98cff, nebula: [0x1a4f6e, 0x060c1a],
    resourceTable: { voidium: 34, plasmite: 22, aurum: 20, crystal: 14, titanium: 10 },
    asteroidCount: 34, asteroidScale: [8, 24], rockStyle: 'void',
    enemies: [{ type: 'sentinel', weight: 42 }, { type: 'plasma', weight: 30 }, { type: 'heavy', weight: 28 }],
    enemyBudget: 20, hazard: 'anomaly', rewardMultiplier: 3.6,
  },
];

export const SECTOR_BY_ID = new Map(SECTORS.map((s) => [s.id, s]));

export interface EnemyDef {
  type: 'scout' | 'raider' | 'heavy' | 'plasma' | 'sentinel';
  name: string;
  hull: number;
  shield: number;
  speed: number;
  turn: number;
  damage: number;
  fireRate: number;
  range: number;
  projectileSpeed: number;
  credits: number;
  scale: number;
  color: number;
  accent: number;
  behaviour: 'orbit' | 'strafe' | 'charge' | 'sniper';
}

export const ENEMIES: Record<string, EnemyDef> = {
  scout: {
    type: 'scout', name: 'Scout Drone', hull: 120, shield: 0, speed: 46, turn: 1.9, damage: 7, fireRate: 1.6,
    range: 140, projectileSpeed: 220, credits: 180, scale: 1.0, color: 0x6d7f9c, accent: 0xff6b6b, behaviour: 'orbit',
  },
  raider: {
    type: 'raider', name: 'Raider Ship', hull: 340, shield: 60, speed: 38, turn: 1.4, damage: 15, fireRate: 2.1,
    range: 180, projectileSpeed: 260, credits: 460, scale: 1.5, color: 0x7a5a4a, accent: 0xffa23c, behaviour: 'strafe',
  },
  heavy: {
    type: 'heavy', name: 'Heavy Drone', hull: 820, shield: 160, speed: 24, turn: 0.8, damage: 34, fireRate: 0.9,
    range: 210, projectileSpeed: 190, credits: 1100, scale: 2.1, color: 0x5c6472, accent: 0xff3b6b, behaviour: 'charge',
  },
  plasma: {
    type: 'plasma', name: 'Plasma Hunter', hull: 640, shield: 320, speed: 42, turn: 1.6, damage: 44, fireRate: 1.1,
    range: 250, projectileSpeed: 300, credits: 1850, scale: 1.8, color: 0x7a3f6b, accent: 0x53ffe0, behaviour: 'strafe',
  },
  sentinel: {
    type: 'sentinel', name: 'Void Sentinel', hull: 2400, shield: 900, speed: 30, turn: 1.1, damage: 78, fireRate: 0.75,
    range: 330, projectileSpeed: 420, credits: 5200, scale: 3.0, color: 0x2e3b57, accent: 0xb98cff, behaviour: 'sniper',
  },
};
