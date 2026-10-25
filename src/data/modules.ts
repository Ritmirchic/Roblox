/**
 * Ship module catalog.
 * Every entry is a physically meaningful part: it has mass, grid footprint, durability,
 * energy draw and a functional gameplay behaviour implemented by the simulation layer.
 */

export type ModuleCategory =
  | 'structure'
  | 'command'
  | 'propulsion'
  | 'mining'
  | 'collection'
  | 'weapon'
  | 'defense'
  | 'utility';

export interface ModuleStats {
  /** Mining damage per second applied to asteroid surfaces. */
  miningDps?: number;
  /** Effective mining beam range in world units. */
  miningRange?: number;
  /** Magnet pull radius. */
  magnetRange?: number;
  /** Magnet pull acceleration. */
  magnetForce?: number;
  /** Weapon damage per projectile / per tick for beams. */
  damage?: number;
  /** Shots per second. */
  fireRate?: number;
  /** Projectile speed (0 for hitscan beams). */
  projectileSpeed?: number;
  /** Weapon range. */
  weaponRange?: number;
  /** Homing strength for missiles (0 = unguided). */
  homing?: number;
  /** Splash radius of explosive ordnance. */
  splash?: number;
  /** Shield capacity contribution. */
  shield?: number;
  /** Shield recharge per second. */
  shieldRegen?: number;
  /** Flat hull armour added to every module's effective durability. */
  armor?: number;
  /** Hull repair per second while out of combat. */
  repair?: number;
  /** Thrust force in kN. */
  thrust?: number;
  /** Torque authority multiplier. */
  torque?: number;
  /** Cargo capacity in units. */
  cargo?: number;
  /** Energy produced per second. */
  energyGen?: number;
  /** Energy buffer added. */
  energyCap?: number;
  /** Scanner radius for resource highlighting. */
  scanRange?: number;
  /** Radar radius for enemy detection. */
  radarRange?: number;
  /** Extra rare-mineral chance (additive fraction). */
  rareBonus?: number;
  /** Drone count for defensive drones. */
  drones?: number;
}

export interface ModuleDef {
  id: string;
  name: string;
  category: ModuleCategory;
  /** Grid footprint in cells (x,y,z) before rotation. */
  size: [number, number, number];
  mass: number;
  /** Structural hit points of a single module instance. */
  durability: number;
  /** Continuous energy draw per second when active. */
  energy: number;
  price: number;
  tier: number;
  description: string;
  stats: ModuleStats;
  /** Visual accent colour used by the procedural mesh builder. */
  color: number;
  accent: number;
  /** Maximum upgrade level (stats scale 18% per level). */
  maxLevel: number;
  /** Must be mounted on the ship surface facing outward (weapons, engines...). */
  surfaceMount?: boolean;
}

export const UPGRADE_SCALE = 0.18;

export const MODULES: ModuleDef[] = [
  // ---------------------------------------------------------------- structure
  {
    id: 'hull_basic', name: 'Structural Hull', category: 'structure', size: [1, 1, 1],
    mass: 120, durability: 260, energy: 0, price: 350, tier: 1, maxLevel: 5,
    description: 'Load bearing frame segment. Connects modules and carries structural loads.',
    stats: { armor: 4, cargo: 6 }, color: 0x6b7a95, accent: 0x9fb3d1,
  },
  {
    id: 'hull_reinforced', name: 'Reinforced Hull', category: 'structure', size: [1, 1, 1],
    mass: 210, durability: 540, energy: 0, price: 1400, tier: 2, maxLevel: 5,
    description: 'Dense alloy lattice. Heavier, but survives far deeper into hostile sectors.',
    stats: { armor: 14, cargo: 8 }, color: 0x5a6882, accent: 0xc2d2ea,
  },
  {
    id: 'hull_composite', name: 'Composite Spine', category: 'structure', size: [2, 1, 1],
    mass: 300, durability: 820, energy: 0, price: 4200, tier: 3, maxLevel: 5,
    description: 'Long carbon-ceramic spine used to extend large frames with low mass penalty.',
    stats: { armor: 20, cargo: 18 }, color: 0x4a5670, accent: 0x8fe8ff,
  },
  // ---------------------------------------------------------------- command
  {
    id: 'cockpit_basic', name: 'Command Cockpit', category: 'command', size: [1, 1, 1],
    mass: 180, durability: 420, energy: 2, price: 0, tier: 1, maxLevel: 4,
    description: 'Pressurised command module. Every ship requires exactly one cockpit.',
    stats: { energyCap: 90, energyGen: 16, torque: 1 }, color: 0x2e3a5c, accent: 0x00e5ff,
  },
  {
    id: 'cockpit_tactical', name: 'Tactical Bridge', category: 'command', size: [2, 1, 1],
    mass: 320, durability: 700, energy: 4, price: 9800, tier: 3, maxLevel: 4,
    description: 'Fleet-grade bridge with targeting computer. Improves turret tracking and torque.',
    stats: { energyCap: 140, energyGen: 14, torque: 1.5, radarRange: 180 }, color: 0x27314f, accent: 0x7b61ff,
  },
  // ---------------------------------------------------------------- propulsion
  {
    id: 'engine_basic', name: 'Ion Thruster', category: 'propulsion', size: [1, 1, 1],
    mass: 140, durability: 220, energy: 4, price: 600, tier: 1, maxLevel: 6, surfaceMount: true,
    description: 'Reliable ion drive. Thrust is applied from its real mounting point on the hull.',
    stats: { thrust: 260, torque: 0.9 }, color: 0x3a4766, accent: 0x33ccff,
  },
  {
    id: 'engine_fusion', name: 'Fusion Drive', category: 'propulsion', size: [1, 1, 2],
    mass: 310, durability: 380, energy: 16, price: 3800, tier: 2, maxLevel: 6, surfaceMount: true,
    description: 'High output fusion drive. Large thrust, significant energy and heat footprint.',
    stats: { thrust: 760, torque: 1.2 }, color: 0x34405e, accent: 0xff8a3c,
  },
  {
    id: 'engine_vector', name: 'Vector Manoeuvre Pod', category: 'propulsion', size: [1, 1, 1],
    mass: 90, durability: 180, energy: 5, price: 2100, tier: 2, maxLevel: 6, surfaceMount: true,
    description: 'Gimballed RCS cluster dedicated to rotation authority and stabilisation.',
    stats: { thrust: 120, torque: 3.2 }, color: 0x3d4a69, accent: 0x9affff,
  },
  {
    id: 'engine_warp', name: 'Warp Core Thruster', category: 'propulsion', size: [2, 1, 2],
    mass: 520, durability: 640, energy: 30, price: 15200, tier: 4, maxLevel: 6, surfaceMount: true,
    description: 'Experimental drive that folds local space for extreme burst acceleration.',
    stats: { thrust: 1850, torque: 1.6 }, color: 0x2b3457, accent: 0xb98cff,
  },
  // ---------------------------------------------------------------- mining
  {
    id: 'laser_basic', name: 'Basic Mining Laser', category: 'mining', size: [1, 1, 1],
    mass: 95, durability: 180, energy: 5, price: 0, tier: 1, maxLevel: 6, surfaceMount: true,
    description: 'Entry level cutting laser. Carves ore from asteroid surfaces at short range.',
    stats: { miningDps: 34, miningRange: 95 }, color: 0x3b4a63, accent: 0xff4d4d,
  },
  {
    id: 'laser_advanced', name: 'Advanced Mining Laser', category: 'mining', size: [1, 1, 1],
    mass: 130, durability: 230, energy: 14, price: 2600, tier: 2, maxLevel: 6, surfaceMount: true,
    description: 'Focused twin-emitter laser with improved beam coherence and range.',
    stats: { miningDps: 58, miningRange: 130 }, color: 0x37465f, accent: 0xff7a1a,
  },
  {
    id: 'drill_plasma', name: 'Plasma Drill', category: 'mining', size: [1, 1, 2],
    mass: 260, durability: 420, energy: 22, price: 6400, tier: 3, maxLevel: 6, surfaceMount: true,
    description: 'Contact plasma drill. Enormous damage, short reach - fly in close.',
    stats: { miningDps: 155, miningRange: 72 }, color: 0x303d55, accent: 0x53ffe0,
  },
  {
    id: 'extractor_crystal', name: 'Crystal Extractor', category: 'mining', size: [1, 1, 1],
    mass: 170, durability: 260, energy: 18, price: 8800, tier: 3, maxLevel: 6, surfaceMount: true,
    description: 'Resonance extractor tuned to crystalline lattices. Boosts rare mineral yield.',
    stats: { miningDps: 74, miningRange: 120, rareBonus: 0.18 }, color: 0x33405c, accent: 0xbf7bff,
  },
  {
    id: 'beam_heavy', name: 'Heavy Mining Beam', category: 'mining', size: [2, 1, 1],
    mass: 390, durability: 520, energy: 34, price: 18600, tier: 4, maxLevel: 6, surfaceMount: true,
    description: 'Capital grade beam array. Shreds the largest rocks in the Void Frontier.',
    stats: { miningDps: 290, miningRange: 165 }, color: 0x2d3750, accent: 0xffd166,
  },
  // ---------------------------------------------------------------- collection
  {
    id: 'magnet_basic', name: 'Magnetic Collector', category: 'collection', size: [1, 1, 1],
    mass: 85, durability: 160, energy: 5, price: 900, tier: 1, maxLevel: 6, surfaceMount: true,
    description: 'Electromagnetic coil that drags loose ore chunks toward the cargo intake.',
    stats: { magnetRange: 60, magnetForce: 95 }, color: 0x3a4664, accent: 0x44e0ff,
  },
  {
    id: 'magnet_advanced', name: 'Advanced Magnet', category: 'collection', size: [1, 1, 1],
    mass: 120, durability: 200, energy: 9, price: 3400, tier: 2, maxLevel: 6, surfaceMount: true,
    description: 'Superconducting magnet with a far stronger and wider attraction field.',
    stats: { magnetRange: 110, magnetForce: 180 }, color: 0x36425f, accent: 0x7bffea,
  },
  {
    id: 'collector_vacuum', name: 'Vacuum Collector', category: 'collection', size: [1, 1, 1],
    mass: 150, durability: 240, energy: 12, price: 6100, tier: 3, maxLevel: 6, surfaceMount: true,
    description: 'Funnel intake that sucks debris into the hold, including non-ferrous matter.',
    stats: { magnetRange: 95, magnetForce: 240, cargo: 40 }, color: 0x333e59, accent: 0x9df4ff,
  },
  {
    id: 'collector_wide', name: 'Wide-Range Collector', category: 'collection', size: [2, 1, 1],
    mass: 230, durability: 320, energy: 18, price: 12400, tier: 4, maxLevel: 6, surfaceMount: true,
    description: 'Dual-ring field projector covering a huge radius around the ship.',
    stats: { magnetRange: 210, magnetForce: 215 }, color: 0x2f3a55, accent: 0x6fffd2,
  },
  // ---------------------------------------------------------------- weapons
  {
    id: 'gun_machine', name: 'Machine Gun', category: 'weapon', size: [1, 1, 1],
    mass: 110, durability: 200, energy: 3, price: 1200, tier: 1, maxLevel: 6, surfaceMount: true,
    description: 'Rapid fire kinetic turret. Tracks targets and leads its shots automatically.',
    stats: { damage: 9, fireRate: 7.5, projectileSpeed: 420, weaponRange: 190 }, color: 0x3c4760, accent: 0xffd166,
  },
  {
    id: 'gun_laser', name: 'Laser Cannon', category: 'weapon', size: [1, 1, 1],
    mass: 140, durability: 230, energy: 11, price: 3600, tier: 2, maxLevel: 6, surfaceMount: true,
    description: 'Pulse laser turret with instant travel time and excellent accuracy.',
    stats: { damage: 34, fireRate: 2.2, projectileSpeed: 900, weaponRange: 240 }, color: 0x38445f, accent: 0xff3b6b,
  },
  {
    id: 'gun_plasma', name: 'Plasma Cannon', category: 'weapon', size: [1, 1, 2],
    mass: 260, durability: 340, energy: 19, price: 8200, tier: 3, maxLevel: 6, surfaceMount: true,
    description: 'Launches superheated plasma bolts that splash damage across a small radius.',
    stats: { damage: 76, fireRate: 1.3, projectileSpeed: 300, weaponRange: 260, splash: 18 }, color: 0x33405b, accent: 0x53ffe0,
  },
  {
    id: 'rocket_launcher', name: 'Rocket Launcher', category: 'weapon', size: [1, 1, 2],
    mass: 300, durability: 300, energy: 9, price: 9400, tier: 3, maxLevel: 6, surfaceMount: true,
    description: 'Fires physical rockets with real flight dynamics and explosive payloads.',
    stats: { damage: 120, fireRate: 0.75, projectileSpeed: 210, weaponRange: 320, splash: 34 }, color: 0x3a4259, accent: 0xff8a3c,
  },
  {
    id: 'missile_battery', name: 'Missile Battery', category: 'weapon', size: [2, 1, 1],
    mass: 340, durability: 330, energy: 14, price: 16800, tier: 4, maxLevel: 6, surfaceMount: true,
    description: 'Six-tube guided battery. Missiles steer onto their target after launch.',
    stats: { damage: 85, fireRate: 1.6, projectileSpeed: 180, weaponRange: 360, splash: 26, homing: 2.6 }, color: 0x36405a, accent: 0xff6ba8,
  },
  {
    id: 'railgun', name: 'Railgun', category: 'weapon', size: [1, 1, 3],
    mass: 480, durability: 420, energy: 28, price: 24500, tier: 5, maxLevel: 6, surfaceMount: true,
    description: 'Magnetically accelerated slug that punches straight through heavy armour.',
    stats: { damage: 340, fireRate: 0.42, projectileSpeed: 1400, weaponRange: 520 }, color: 0x2c3650, accent: 0xa0e9ff,
  },
  // ---------------------------------------------------------------- defense
  {
    id: 'shield_gen', name: 'Shield Generator', category: 'defense', size: [1, 1, 1],
    mass: 190, durability: 240, energy: 15, price: 4800, tier: 2, maxLevel: 6,
    description: 'Projects an energy barrier that absorbs incoming damage before the hull.',
    stats: { shield: 220, shieldRegen: 11, energyCap: 40 }, color: 0x334059, accent: 0x49b6ff,
  },
  {
    id: 'armor_plate', name: 'Reinforced Armor', category: 'defense', size: [1, 1, 1],
    mass: 280, durability: 760, energy: 0, price: 2200, tier: 2, maxLevel: 6,
    description: 'Ablative plating. Adds large flat durability to the whole assembly.',
    stats: { armor: 42 }, color: 0x59637a, accent: 0xced9ea,
  },
  {
    id: 'repair_module', name: 'Repair Module', category: 'defense', size: [1, 1, 1],
    mass: 165, durability: 260, energy: 10, price: 7200, tier: 3, maxLevel: 6,
    description: 'Nanite swarm bay that slowly rebuilds damaged modules during flight.',
    stats: { repair: 6.5 }, color: 0x34425c, accent: 0x5dffa6,
  },
  {
    id: 'drone_defense', name: 'Defensive Drone Bay', category: 'defense', size: [1, 1, 1],
    mass: 210, durability: 280, energy: 13, price: 13400, tier: 4, maxLevel: 6,
    description: 'Deploys autonomous escort drones that orbit the ship and engage hostiles.',
    stats: { drones: 1, damage: 16, fireRate: 1.6, weaponRange: 200 }, color: 0x313c57, accent: 0xffe08a,
  },
  // ---------------------------------------------------------------- utility
  {
    id: 'radar', name: 'Radar Array', category: 'utility', size: [1, 1, 1],
    mass: 95, durability: 150, energy: 6, price: 1800, tier: 1, maxLevel: 5, surfaceMount: true,
    description: 'Sweeps for hostile contacts and paints them on the expedition HUD.',
    stats: { radarRange: 420 }, color: 0x374459, accent: 0x76ffb0,
  },
  {
    id: 'scanner', name: 'Resource Scanner', category: 'utility', size: [1, 1, 1],
    mass: 110, durability: 170, energy: 8, price: 3200, tier: 2, maxLevel: 5, surfaceMount: true,
    description: 'Spectral analyser that reveals ore content and rare veins inside asteroids.',
    stats: { scanRange: 380, rareBonus: 0.08 }, color: 0x354158, accent: 0xb6ff6e,
  },
  {
    id: 'generator', name: 'Energy Generator', category: 'utility', size: [1, 1, 1],
    mass: 240, durability: 300, energy: 0, price: 2900, tier: 2, maxLevel: 6,
    description: 'Compact reactor. Required to run heavy lasers, shields and weapons.',
    stats: { energyGen: 26, energyCap: 90 }, color: 0x3a4359, accent: 0xffd166,
  },
  {
    id: 'cargo_bay', name: 'Cargo Expansion', category: 'utility', size: [1, 1, 2],
    mass: 180, durability: 340, energy: 1, price: 2400, tier: 1, maxLevel: 6,
    description: 'Pressurised hold that increases how much ore you can haul home.',
    stats: { cargo: 160 }, color: 0x414b63, accent: 0x9fb3d1,
  },
  {
    id: 'booster', name: 'Thruster Booster', category: 'utility', size: [1, 1, 1],
    mass: 130, durability: 210, energy: 12, price: 5600, tier: 3, maxLevel: 6,
    description: 'Overcharges every installed engine with a flat thrust multiplier.',
    stats: { thrust: 180, torque: 0.6 }, color: 0x343f58, accent: 0xff9ede,
  },
];

export const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): ModuleDef {
  const m = MODULE_BY_ID.get(id);
  if (!m) throw new Error(`Unknown module id: ${id}`);
  return m;
}

/** Scales a stat value for an upgrade level (level 1 = base). */
export function scaledStat(base: number, level: number): number {
  return base * (1 + UPGRADE_SCALE * (level - 1));
}

/** Price of upgrading a module from `level` to `level+1`. */
export function upgradeCost(def: ModuleDef, level: number): number {
  return Math.round(Math.max(250, def.price * 0.55) * Math.pow(1.72, level - 1));
}

export const CATEGORY_LABEL: Record<ModuleCategory, string> = {
  structure: 'Structure',
  command: 'Command',
  propulsion: 'Propulsion',
  mining: 'Mining',
  collection: 'Collection',
  weapon: 'Weapons',
  defense: 'Defense',
  utility: 'Utility',
};
