/**
 * Modular ship construction grid.
 *
 * Pure simulation - no rendering imports - so it can be unit tested in Node.
 * The grid stores:
 *   - owned construction cells (free starter cells + purchased expansion cells)
 *   - placed modules with position + orientation
 * and derives mass, centre of mass, energy balance, thrust, torque and combat stats.
 */
import { getModule, scaledStat, type ModuleDef, type ModuleStats } from '../data/modules.ts';

export type Vec3 = [number, number, number];
export type Orientation = 0 | 1 | 2 | 3 | 4 | 5;

/** Facing direction for each orientation index. */
export const ORIENTATION_DIR: Record<Orientation, Vec3> = {
  0: [0, 0, 1],
  1: [1, 0, 0],
  2: [0, 0, -1],
  3: [-1, 0, 0],
  4: [0, 1, 0],
  5: [0, -1, 0],
};

export const ORIENTATION_NAME: Record<Orientation, string> = {
  0: 'FORE', 1: 'STARBOARD', 2: 'AFT', 3: 'PORT', 4: 'DORSAL', 5: 'VENTRAL',
};

export interface PlacedModule {
  uid: string;
  defId: string;
  pos: Vec3;             // grid coordinate of the module origin cell
  orientation: Orientation;
  level: number;         // upgrade level, 1-based
  health: number;        // current durability (runtime, persisted between expeditions)
}

export interface ShipStats {
  moduleCount: number;
  mass: number;
  centerOfMass: Vec3;
  thrust: number;
  torque: number;
  cargo: number;
  energyGen: number;
  energyCap: number;
  energyDraw: number;
  energyBalance: number;
  shield: number;
  shieldRegen: number;
  hull: number;
  armor: number;
  repair: number;
  miningDps: number;
  miningRange: number;
  magnetRange: number;
  magnetForce: number;
  weaponDps: number;
  weaponRange: number;
  scanRange: number;
  radarRange: number;
  rareBonus: number;
  drones: number;
  thrustToMass: number;
}

export interface ValidationIssue {
  code: 'out_of_grid' | 'overlap' | 'disconnected' | 'blocked_mount' | 'no_cockpit' | 'duplicate_cockpit';
  message: string;
  cells?: Vec3[];
}

export const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
export const parseKey = (k: string): Vec3 => k.split(',').map(Number) as Vec3;

/** Rotated footprint size for a module definition. */
export function rotatedSize(def: ModuleDef, o: Orientation): Vec3 {
  const [sx, sy, sz] = def.size;
  switch (o) {
    case 0: case 2: return [sx, sy, sz];
    case 1: case 3: return [sz, sy, sx];
    default: return [sx, sz, sy];
  }
}

/** All grid cells occupied by a module placed at `pos` with orientation `o`. */
export function moduleCells(def: ModuleDef, pos: Vec3, o: Orientation): Vec3[] {
  const [sx, sy, sz] = rotatedSize(def, o);
  const out: Vec3[] = [];
  for (let x = 0; x < sx; x++)
    for (let y = 0; y < sy; y++)
      for (let z = 0; z < sz; z++)
        out.push([pos[0] + x, pos[1] + y, pos[2] + z]);
  return out;
}

/** Geometric centre (in cell units) of a placed module. */
export function moduleCenter(def: ModuleDef, pos: Vec3, o: Orientation): Vec3 {
  const [sx, sy, sz] = rotatedSize(def, o);
  return [pos[0] + (sx - 1) / 2, pos[1] + (sy - 1) / 2, pos[2] + (sz - 1) / 2];
}

export const STARTER_CELLS: Vec3[] = (() => {
  const cells: Vec3[] = [];
  // Free starting hull platform: 3 x 1 x 3 plus a nose cell. Never counts toward crew slots.
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) cells.push([x, 0, z]);
  cells.push([0, 0, 2]);
  return cells;
})();

export class ShipDesign {
  /** Owned buildable cells (starter + purchased). */
  cells = new Set<string>();
  /** Cells that were paid for (used for the crew slot formula). */
  purchasedCells = new Set<string>();
  modules: PlacedModule[] = [];
  private uidCounter = 1;

  constructor(seedStarter = true) {
    if (seedStarter) for (const c of STARTER_CELLS) this.cells.add(cellKey(...c));
  }

  static starterShip(): ShipDesign {
    const d = new ShipDesign();
    d.place('cockpit_basic', [0, 0, 1], 0);
    d.place('hull_basic', [0, 0, 0], 0);
    d.place('hull_basic', [-1, 0, 0], 0);
    d.place('hull_basic', [1, 0, 0], 0);
    d.place('engine_basic', [0, 0, -1], 2);
    d.place('laser_basic', [1, 0, 1], 1);
    return d;
  }

  nextUid(): string {
    return `m${this.uidCounter++}`;
  }

  hasCell(c: Vec3): boolean {
    return this.cells.has(cellKey(...c));
  }

  /** Number of purchased expansion cells (drives crew slots and pricing). */
  get purchasedCount(): number {
    return this.purchasedCells.size;
  }

  /** Occupancy map: cell key -> module uid. */
  occupancy(): Map<string, string> {
    const map = new Map<string, string>();
    for (const m of this.modules) {
      const def = getModule(m.defId);
      for (const c of moduleCells(def, m.pos, m.orientation)) map.set(cellKey(...c), m.uid);
    }
    return map;
  }

  /** A new expansion cell must touch an existing owned cell (no floating islands). */
  canBuyCell(c: Vec3): boolean {
    if (this.hasCell(c)) return false;
    const [x, y, z] = c;
    const neighbours: Vec3[] = [
      [x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1],
    ];
    return neighbours.some((n) => this.hasCell(n));
  }

  buyCell(c: Vec3): boolean {
    if (!this.canBuyCell(c)) return false;
    const k = cellKey(...c);
    this.cells.add(k);
    this.purchasedCells.add(k);
    return true;
  }

  /** Full validation of a hypothetical placement. Returns null when the placement is legal. */
  checkPlacement(defId: string, pos: Vec3, o: Orientation, ignoreUid?: string): ValidationIssue | null {
    const def = getModule(defId);
    const cells = moduleCells(def, pos, o);
    for (const c of cells) {
      if (!this.hasCell(c)) {
        return { code: 'out_of_grid', message: 'Module extends outside your construction cells.', cells: [c] };
      }
    }
    const occ = this.occupancy();
    for (const c of cells) {
      const uid = occ.get(cellKey(...c));
      if (uid && uid !== ignoreUid) {
        return { code: 'overlap', message: 'Another module already occupies this volume.', cells: [c] };
      }
    }
    if (def.category === 'command') {
      const existing = this.modules.find((m) => getModule(m.defId).category === 'command' && m.uid !== ignoreUid);
      if (existing) return { code: 'duplicate_cockpit', message: 'A ship may only carry one command module.' };
    }
    if (def.surfaceMount) {
      // The facing cell directly in front of the mount must be clear of other modules.
      const dir = ORIENTATION_DIR[o];
      const [sx, sy, sz] = rotatedSize(def, o);
      const front: Vec3[] = [];
      for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) {
        const cx = pos[0] + x + dir[0], cy = pos[1] + y + dir[1], cz = pos[2] + z + dir[2];
        const inSelf = x + dir[0] >= 0 && x + dir[0] < sx && y + dir[1] >= 0 && y + dir[1] < sy && z + dir[2] >= 0 && z + dir[2] < sz;
        if (!inSelf) front.push([cx, cy, cz]);
      }
      const blocked = front.some((c) => {
        const uid = occ.get(cellKey(...c));
        return !!uid && uid !== ignoreUid;
      });
      if (blocked) {
        return { code: 'blocked_mount', message: `${def.name} needs a clear line of fire: its ${ORIENTATION_NAME[o]} face is blocked.` };
      }
    }
    // Structural connectivity: must touch another module (unless it is the first).
    const others = this.modules.filter((m) => m.uid !== ignoreUid);
    if (others.length > 0) {
      const occOthers = new Map<string, string>();
      for (const m of others) {
        const d = getModule(m.defId);
        for (const c of moduleCells(d, m.pos, m.orientation)) occOthers.set(cellKey(...c), m.uid);
      }
      const touching = cells.some(([x, y, z]) =>
        occOthers.has(cellKey(x + 1, y, z)) || occOthers.has(cellKey(x - 1, y, z)) ||
        occOthers.has(cellKey(x, y + 1, z)) || occOthers.has(cellKey(x, y - 1, z)) ||
        occOthers.has(cellKey(x, y, z + 1)) || occOthers.has(cellKey(x, y, z - 1)));
      if (!touching) {
        return { code: 'disconnected', message: 'Modules must physically connect to the rest of the ship.' };
      }
    }
    return null;
  }

  place(defId: string, pos: Vec3, o: Orientation = 0, level = 1): PlacedModule | ValidationIssue {
    const issue = this.checkPlacement(defId, pos, o);
    if (issue) return issue;
    const def = getModule(defId);
    const mod: PlacedModule = {
      uid: this.nextUid(), defId, pos, orientation: o, level,
      health: scaledStat(def.durability, level),
    };
    this.modules.push(mod);
    return mod;
  }

  remove(uid: string): boolean {
    const idx = this.modules.findIndex((m) => m.uid === uid);
    if (idx < 0) return false;
    const [removed] = this.modules.splice(idx, 1);
    // Removing a module may orphan others - validate and roll back if the hull would split.
    if (!this.isConnected()) {
      this.modules.splice(idx, 0, removed);
      return false;
    }
    return true;
  }

  /** Force removal even if it splits the hull (used by the editor's "clear" action). */
  forceRemove(uid: string): boolean {
    const idx = this.modules.findIndex((m) => m.uid === uid);
    if (idx < 0) return false;
    this.modules.splice(idx, 1);
    return true;
  }

  moduleAt(c: Vec3): PlacedModule | undefined {
    const uid = this.occupancy().get(cellKey(...c));
    return this.modules.find((m) => m.uid === uid);
  }

  /** Flood fill across module adjacency - every module must be reachable from the cockpit. */
  isConnected(): boolean {
    if (this.modules.length <= 1) return true;
    const occ = this.occupancy();
    const start = this.modules.find((m) => getModule(m.defId).category === 'command') ?? this.modules[0];
    const seen = new Set<string>([start.uid]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      const def = getModule(cur.defId);
      for (const [x, y, z] of moduleCells(def, cur.pos, cur.orientation)) {
        const nbs = [cellKey(x + 1, y, z), cellKey(x - 1, y, z), cellKey(x, y + 1, z), cellKey(x, y - 1, z), cellKey(x, y, z + 1), cellKey(x, y, z - 1)];
        for (const nb of nbs) {
          const uid = occ.get(nb);
          if (uid && !seen.has(uid)) {
            seen.add(uid);
            const m = this.modules.find((mm) => mm.uid === uid);
            if (m) queue.push(m);
          }
        }
      }
    }
    return seen.size === this.modules.length;
  }

  hasCockpit(): boolean {
    return this.modules.some((m) => getModule(m.defId).category === 'command');
  }

  /** Aggregate a scaled stat across all installed modules. */
  sumStat(key: keyof ModuleStats, healthWeighted = true): number {
    let total = 0;
    for (const m of this.modules) {
      const def = getModule(m.defId);
      const base = def.stats[key];
      if (!base) continue;
      const eff = healthWeighted ? this.efficiency(m) : 1;
      total += scaledStat(base, m.level) * eff;
    }
    return total;
  }

  /** Damaged modules lose efficiency: below 35% health they work at reduced output. */
  efficiency(m: PlacedModule): number {
    const def = getModule(m.defId);
    const max = scaledStat(def.durability, m.level);
    const frac = Math.max(0, Math.min(1, m.health / max));
    if (frac <= 0) return 0;
    if (frac >= 0.35) return 1;
    return 0.25 + (frac / 0.35) * 0.75;
  }

  maxHealth(m: PlacedModule): number {
    return scaledStat(getModule(m.defId).durability, m.level);
  }

  stats(): ShipStats {
    let mass = 0;
    let cx = 0, cy = 0, cz = 0;
    for (const m of this.modules) {
      const def = getModule(m.defId);
      const mMass = def.mass * (1 + 0.06 * (m.level - 1));
      const c = moduleCenter(def, m.pos, m.orientation);
      mass += mMass;
      cx += c[0] * mMass; cy += c[1] * mMass; cz += c[2] * mMass;
    }
    const com: Vec3 = mass > 0 ? [cx / mass, cy / mass, cz / mass] : [0, 0, 0];

    const energyGen = this.sumStat('energyGen');
    const energyDraw = this.modules.reduce((acc, m) => acc + getModule(m.defId).energy, 0);
    const armor = this.sumStat('armor', false);
    const hull = this.modules.reduce((acc, m) => acc + this.maxHealth(m), 0) + armor * 4;

    let weaponDps = 0;
    let weaponRange = 0;
    for (const m of this.modules) {
      const def = getModule(m.defId);
      if (def.category !== 'weapon' && !(def.category === 'defense' && def.stats.drones)) continue;
      const dmg = scaledStat(def.stats.damage ?? 0, m.level);
      const rate = def.stats.fireRate ?? 0;
      weaponDps += dmg * rate * this.efficiency(m) * (def.stats.drones ?? 1);
      weaponRange = Math.max(weaponRange, def.stats.weaponRange ?? 0);
    }

    const thrust = this.sumStat('thrust');
    return {
      moduleCount: this.modules.length,
      mass,
      centerOfMass: com,
      thrust,
      torque: this.sumStat('torque'),
      cargo: this.sumStat('cargo', false),
      energyGen,
      energyCap: this.sumStat('energyCap', false),
      energyDraw,
      energyBalance: energyGen - energyDraw,
      shield: this.sumStat('shield'),
      shieldRegen: this.sumStat('shieldRegen'),
      hull,
      armor,
      repair: this.sumStat('repair'),
      miningDps: this.sumStat('miningDps'),
      miningRange: this.modules.reduce((acc, m) => Math.max(acc, getModule(m.defId).stats.miningRange ?? 0), 0),
      magnetRange: this.modules.reduce((acc, m) => Math.max(acc, scaledStat(getModule(m.defId).stats.magnetRange ?? 0, m.level)), 0),
      magnetForce: this.sumStat('magnetForce'),
      weaponDps,
      weaponRange,
      scanRange: this.modules.reduce((acc, m) => Math.max(acc, getModule(m.defId).stats.scanRange ?? 0), 0),
      radarRange: this.modules.reduce((acc, m) => Math.max(acc, getModule(m.defId).stats.radarRange ?? 0), 0),
      rareBonus: this.sumStat('rareBonus', false),
      drones: Math.floor(this.sumStat('drones', false)),
      thrustToMass: mass > 0 ? thrust / mass : 0,
    };
  }

  /** Engines with their world-space mount offset and thrust direction. */
  thrusters(): { uid: string; center: Vec3; dir: Vec3; thrust: number; level: number }[] {
    return this.modules
      .filter((m) => getModule(m.defId).stats.thrust)
      .map((m) => {
        const def = getModule(m.defId);
        const dir = ORIENTATION_DIR[m.orientation];
        return {
          uid: m.uid,
          center: moduleCenter(def, m.pos, m.orientation),
          // Exhaust points along the facing direction, so thrust pushes the opposite way.
          dir: [-dir[0], -dir[1], -dir[2]] as Vec3,
          thrust: scaledStat(def.stats.thrust ?? 0, m.level) * this.efficiency(m),
          level: m.level,
        };
      });
  }

  serialize() {
    return {
      cells: [...this.cells],
      purchased: [...this.purchasedCells],
      modules: this.modules.map((m) => ({ ...m })),
      uidCounter: this.uidCounter,
    };
  }

  static deserialize(data: any): ShipDesign {
    const d = new ShipDesign(false);
    if (!data || !Array.isArray(data.cells)) return ShipDesign.starterShip();
    for (const c of data.cells) if (typeof c === 'string') d.cells.add(c);
    for (const c of data.purchased ?? []) if (typeof c === 'string') d.purchasedCells.add(c);
    for (const sc of STARTER_CELLS) d.cells.add(cellKey(...sc));
    if (Array.isArray(data.modules)) {
      for (const m of data.modules) {
        try {
          const def = getModule(m.defId);
          const level = Math.max(1, Math.min(def.maxLevel, Number(m.level) || 1));
          d.modules.push({
            uid: String(m.uid ?? d.nextUid()),
            defId: m.defId,
            pos: [Number(m.pos[0]) || 0, Number(m.pos[1]) || 0, Number(m.pos[2]) || 0],
            orientation: (Number(m.orientation) || 0) as Orientation,
            level,
            health: Number.isFinite(m.health) ? Math.max(0, Number(m.health)) : scaledStat(def.durability, level),
          });
        } catch {
          // Unknown module id (older save / tampered data) - skip it rather than crash.
        }
      }
    }
    d.uidCounter = Math.max(Number(data.uidCounter) || 1, d.modules.length + 1);
    if (!d.hasCockpit()) {
      const issue = d.place('cockpit_basic', [0, 0, 1], 0);
      if ('code' in (issue as any)) {
        // Grid is occupied where the cockpit belongs - rebuild from the starter design.
        return ShipDesign.starterShip();
      }
    }
    return d;
  }

  /** Bounding box of owned cells, used to frame the editor camera. */
  bounds(): { min: Vec3; max: Vec3 } {
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const k of this.cells) {
      const [x, y, z] = parseKey(k);
      min[0] = Math.min(min[0], x); min[1] = Math.min(min[1], y); min[2] = Math.min(min[2], z);
      max[0] = Math.max(max[0], x); max[1] = Math.max(max[1], y); max[2] = Math.max(max[2], z);
    }
    if (!Number.isFinite(min[0])) return { min: [0, 0, 0], max: [0, 0, 0] };
    return { min, max };
  }
}
