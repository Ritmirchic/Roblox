// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/buildings.js — BSP floor-plan architecture generator
//
// Each building is generated as:
//   1. BSP-subdivided floor plan (real rooms, no empty boxes)
//   2. Wall extraction on a 0.5m occupancy grid
//   3. Openings: entry doors, interior doorways, windows
//   4. Slabs, stairs, roofs
//   5. Room-typed furniture, loot anchors, lights
//   6. Connectivity validation (isolated rooms get an extra door)
// ============================================================
import * as THREE from 'three';
import { boxGeo, cylGeo, planeGeo, sphereGeo } from './geo.js';
import { M, mat, plain } from '../core/materials.js';
import { Furniture, Street, vehicle, makeLootMesh, makeDoorMesh } from './props.js';
import { RNG, clamp, lerp, smoothstep } from '../core/util.js';

const CELL = 0.5;

const STYLE = {
  house: {
    size: [8, 12, 7, 9], floors: [1, 2], floorH: 2.9, style: 'suburban',
    wall: () => M.brickGrey, innerWall: () => M.panel, floorMat: () => M.floor,
    ext: 0.28, int: 0.14, roof: 'gable',
    roomW: { living: 26, kitchen: 18, bedroom: 26, bath: 12, storage: 10, hall: 8 },
    window: { sill: 0.95, h: 1.15, w: 1.2, spacing: 3.4 },
    loot: 'house', lights: 2,
  },
  ruined_house: {
    size: [9, 13, 7, 10], floors: [1, 2], floorH: 2.9, style: 'suburban',
    wall: () => M.brickGrey, innerWall: () => M.panel, floorMat: () => M.boardFloor ? M.boardFloor : M.floor,
    ext: 0.3, int: 0.14, roof: 'collapsed',
    roomW: { living: 24, kitchen: 16, bedroom: 22, bath: 10, storage: 14, hall: 8 },
    window: { sill: 0.95, h: 1.15, w: 1.2, spacing: 3.2 },
    loot: 'house', lights: 1, ruin: 0.35,
  },
  shop: {
    size: [10, 18, 9, 14], floors: [1, 1], floorH: 3.6, style: 'commercial',
    wall: () => M.brick, innerWall: () => M.panel, floorMat: () => M.tiles,
    ext: 0.3, int: 0.16, roof: 'flat',
    roomW: { sales: 45, storage: 30, back: 15, bath: 10 },
    window: { sill: 0.7, h: 2.0, w: 2.2, spacing: 4.0 },
    loot: 'store', lights: 3,
  },
  warehouse: {
    size: [16, 30, 14, 24], floors: [1, 2], floorH: 5.2, style: 'industrial',
    wall: () => M.corrugated, innerWall: () => M.brickGrey, floorMat: () => M.floor,
    ext: 0.26, int: 0.18, roof: 'flat',
    roomW: { hall: 55, office: 20, storage: 25 },
    window: { sill: 3.0, h: 1.2, w: 1.6, spacing: 5.0 },
    loot: 'industrial', lights: 4,
  },
  apartment: {
    size: [14, 24, 11, 16], floors: [3, 5], floorH: 3.0, style: 'urban',
    wall: () => M.brick, innerWall: () => M.panel, floorMat: () => M.floor,
    ext: 0.32, int: 0.14, roof: 'flat',
    roomW: { living: 28, kitchen: 16, bedroom: 24, bath: 12, corridor: 20 },
    window: { sill: 1.0, h: 1.3, w: 1.3, spacing: 3.2 },
    loot: 'house', lights: 3,
  },
  hospital: {
    size: [22, 40, 14, 22], floors: [2, 3], floorH: 3.4, style: 'institutional',
    wall: () => M.tiles, innerWall: () => M.tiles, floorMat: () => M.tiles,
    ext: 0.32, int: 0.16, roof: 'flat',
    roomW: { reception: 22, waiting: 16, patient: 30, operating: 12, storage: 12, office: 8 },
    window: { sill: 1.1, h: 1.2, w: 1.2, spacing: 3.6 },
    loot: 'medical', lights: 5,
  },
  bunker: {
    size: [14, 22, 12, 18], floors: [1, 1], floorH: 3.2, style: 'bunker',
    wall: () => M.concreteWet, innerWall: () => M.concreteWet, floorMat: () => M.floor,
    ext: 0.45, int: 0.22, roof: 'flat', underground: true,
    roomW: { corridor: 24, control: 20, armory: 14, lab: 14, generator: 12, quarters: 16 },
    window: { sill: 2.6, h: 0.4, w: 0.5, spacing: 8 },
    loot: 'military', lights: 4,
  },
  factory: {
    size: [24, 44, 20, 34], floors: [1, 2], floorH: 6.4, style: 'industrial',
    wall: () => M.corrugated, innerWall: () => M.brickGrey, floorMat: () => M.concrete_floor,
    ext: 0.3, int: 0.2, roof: 'sawtooth',
    roomW: { hall: 55, office: 18, control: 12, storage: 15 },
    window: { sill: 3.6, h: 1.4, w: 2.0, spacing: 5.4 },
    loot: 'industrial', lights: 5,
  },
  church: {
    size: [12, 22, 9, 16], floors: [1, 2], floorH: 4.6, style: 'gothic',
    wall: () => M.brick, innerWall: () => M.brick, floorMat: () => M.floor,
    ext: 0.4, int: 0.24, roof: 'gable_tall',
    roomW: { nave: 60, altar: 20, storage: 10, corridor: 10 },
    window: { sill: 1.8, h: 2.6, w: 0.9, spacing: 4.2 },
    loot: 'rare', lights: 3,
  },
  checkpoint: {
    size: [7, 11, 5, 8], floors: [1, 1], floorH: 2.8, style: 'military',
    wall: () => M.concrete, innerWall: () => M.concrete, floorMat: () => M.floor,
    ext: 0.3, int: 0.16, roof: 'flat',
    roomW: { corridor: 40, office: 40, storage: 20 },
    window: { sill: 1.2, h: 1.0, w: 1.4, spacing: 3.0 },
    loot: 'military', lights: 2,
  },
  office: {
    size: [12, 20, 10, 16], floors: [2, 4], floorH: 3.2, style: 'commercial',
    wall: () => M.concrete, innerWall: () => M.panel, floorMat: () => M.floor,
    ext: 0.3, int: 0.14, roof: 'flat',
    roomW: { office: 45, corridor: 30, storage: 15, bath: 10 },
    window: { sill: 0.9, h: 1.8, w: 1.8, spacing: 3.4 },
    loot: 'industrial', lights: 3,
  },
  gas_station: {
    size: [9, 14, 8, 12], floors: [1, 1], floorH: 3.4, style: 'commercial',
    wall: () => M.concrete, innerWall: () => M.panel, floorMat: () => M.tiles,
    ext: 0.3, int: 0.15, roof: 'flat',
    roomW: { sales: 55, storage: 25, bath: 20 },
    window: { sill: 0.8, h: 1.6, w: 2.4, spacing: 3.6 },
    loot: 'store', lights: 2,
  },
  school: {
    size: [18, 34, 13, 20], floors: [2, 3], floorH: 3.6, style: 'institutional',
    wall: () => M.brick, innerWall: () => M.panel, floorMat: () => M.floor,
    ext: 0.32, int: 0.16, roof: 'flat',
    roomW: { office: 22, corridor: 26, storage: 14, hall: 38 },
    window: { sill: 1.0, h: 1.5, w: 1.6, spacing: 3.6 },
    loot: 'house', lights: 4,
  },
  lab: {
    size: [16, 26, 13, 20], floors: [2, 3], floorH: 3.4, style: 'institutional',
    wall: () => M.tiles, innerWall: () => M.tiles, floorMat: () => M.tiles,
    ext: 0.34, int: 0.18, roof: 'flat',
    roomW: { lab: 40, office: 18, storage: 20, patient: 22 },
    window: { sill: 1.2, h: 1.4, w: 1.2, spacing: 3.8 },
    loot: 'warden', lights: 4,
  },
};

// Room → furniture sets (weighted)
const ROOM_FURNITURE = {
  living: [['sofa', 18], ['table', 12], ['chair', 12], ['cabinet', 10], ['fireplace', 8], ['shelf', 8], ['clock', 6], ['bed', 4]],
  kitchen: [['counter', 22], ['cabinet', 18], ['sink', 12], ['table', 12], ['chair', 12], ['shelf', 8], ['crate', 6]],
  bedroom: [['bed', 40], ['cabinet', 16], ['chair', 10], ['shelf', 10], ['desk', 8]],
  bath: [['toilet', 30], ['sink', 26], ['cabinet', 18], ['locker', 10]],
  storage: [['shelf', 30], ['crate', 22], ['cabinet', 18], ['barrel', 12], ['locker', 8]],
  hall: [['cabinet', 26], ['shelf', 22], ['crate', 16], ['desk', 12]],
  corridor: [['locker', 22], ['shelf', 14], ['cabinet', 10]],
  sales: [['counter', 26], ['shelf', 26], ['crate', 12], ['cabinet', 10], ['desk', 8]],
  back: [['desk', 24], ['chair', 20], ['cabinet', 18], ['shelf', 12]],
  office: [['desk', 30], ['chair', 24], ['cabinet', 18], ['shelf', 12], ['locker', 10]],
  hall_big: [['shelf', 26], ['crate', 22], ['machine', 16], ['barrel', 16], ['counter', 10]],
  operating: [['gurney', 30], ['machine', 24], ['shelf', 16], ['hospitalBed', 12], ['cabinet', 12]],
  patient: [['hospitalBed', 40], ['cabinet', 18], ['chair', 10], ['gurney', 8], ['sink', 8]],
  reception: [['counter', 30], ['desk', 20], ['chair', 18], ['cabinet', 12], ['sofa', 10]],
  waiting: [['chair', 30], ['sofa', 20], ['table', 12], ['counter', 8]],
  control: [['desk', 30], ['machine', 26], ['chair', 18], ['cabinet', 12], ['shelf', 8]],
  armory: [['locker', 34], ['shelf', 30], ['crate', 18], ['cabinet', 10]],
  lab: [['machine', 30], ['desk', 22], ['shelf', 16], ['cabinet', 12], ['gurney', 10]],
  generator: [['generator', 0], ['barrel', 30], ['machine', 24], ['crate', 16]],
  quarters: [['bunkBed', 40], ['locker', 22], ['cabinet', 14], ['desk', 10]],
  nave: [['chair', 70], ['shelf', 10], ['table', 10]],
  altar: [['table', 30], ['cabinet', 24], ['shelf', 16]],
};

function pickWeighted(rng, list) {
  let total = 0;
  for (const [, w] of list) total += w;
  let r = rng.next() * total;
  for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
  return list[0][0];
}

export class Building {
  constructor(opts) {
    Object.assign(this, {
      styleName: 'house', seed: 1, x: 0, z: 0, ry: 0, y: null,
      floors: null, w: null, d: null, noRoof: false, noLoot: false,
      lootMul: 1, lightMul: 1, ruin: null, interiorOnly: false, name: '',
    }, opts);
    this.cfg = STYLE[this.styleName] || STYLE.house;
    this.rng = new RNG(this.seed);
    this.rooms = [];        // per floor: {x0,z0,x1,z1,type,floor}
    this.doors = [];        // dynamic door descriptors
    this.lootPoints = [];   // {x,y,z,table}
    this.lightPoints = [];  // {x,y,z,flicker,color}
    this.propPoints = [];   // extra interactive anchors
    this.plane = [];        // cached room id grid per floor
    this.stairs = [];
    this.entrance = null;
  }

  build(B, terrainY = 0) {
    const { rng, cfg } = this;
    const w = this.w ?? rng.range(cfg.size[0], cfg.size[1]);
    const d = this.d ?? rng.range(cfg.size[2], cfg.size[3]);
    const floors = this.floors ?? rng.int(cfg.floors[0], cfg.floors[1]);
    const fh = cfg.floorH;
    const baseY = this.y ?? terrainY;
    this.w = w; this.d = d; this.floors = floors; this.floorH = fh; this.baseY = baseY;
    this.ruinChance = this.ruin ?? cfg.ruin ?? 0;
    const cos = Math.cos(this.ry), sin = Math.sin(this.ry);

    // local → world
    const L2W = (lx, lz) => [this.x + lx * cos - lz * sin, this.z + lx * sin + lz * cos];

    // ---- entrance side: pick the side facing the nearest road ----------
    this.entranceSide = rng.pick(['front', 'front', 'left', 'right']);

    for (let f = 0; f < floors; f++) {
      const fy = baseY + f * fh;
      const roomRects = this.subdivide(w, d, f);
      const grid = this.rasterize(roomRects, w, d);
      this.assignRoomTypes(roomRects, f);
      this.buildFloorStructure(B, this.rooms.filter((r) => r.floor === f), grid, w, d, fy, f === floors - 1);
      this.populateRooms(B, this.rooms.filter((r) => r.floor === f), fy, L2W);
      if (f < floors - 1) this.buildStairs(B, this.rooms.filter((r) => r.floor === f), fy, fh);
      this.validateConnectivity(roomRects, grid, f);
    }

    // ---- roof ----
    if (!this.noRoof) this.buildRoof(B, w, d, baseY + floors * fh);

    // ---- exterior dressing ----
    this.dressExterior(B, w, d, baseY, L2W);
    return this;
  }

  // ---------- floor plan ----------
  subdivide(w, d, floor) {
    const { rng, cfg } = this;
    const margin = cfg.ext / 2;
    let rects = [{ x0: margin, z0: margin, x1: w - margin, z1: d - margin }];
    const targetCells = this.roomsPerFloor();
    let guard = 0;
    while (rects.length < targetCells && guard++ < 40) {
      // split the largest room
      rects.sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0));
      const r = rects.shift();
      const rw = r.x1 - r.x0, rd = r.z1 - r.z0;
      const minW = 2.6, minD = 2.4;
      let axis;
      if (rw / minW > rd / minD) axis = 'x';
      else if (rd / minD > rw / minW) axis = 'z';
      else axis = rw > rd ? 'x' : 'z';
      const lo = 0.36, hi = 0.64;
      if (axis === 'x') {
        if (rw < minW * 2) { rects.push(r); break; }
        const cut = r.x0 + rw * rng.range(lo, hi);
        rects.push({ x0: r.x0, z0: r.z0, x1: cut, z1: r.z1 }, { x0: cut, z0: r.z0, x1: r.x1, z1: r.z1 });
      } else {
        if (rd < minD * 2) { rects.push(r); break; }
        const cut = r.z0 + rd * rng.range(lo, hi);
        rects.push({ x0: r.x0, z0: r.z0, x1: r.x1, z1: cut }, { x0: r.x0, z0: cut, x1: r.x1, z1: r.z1 });
      }
    }
    return rects.map((r, i) => ({ ...r, id: floor * 100 + i, floor }));
  }

  roomsPerFloor() {
    const { cfg, rng } = this;
    switch (this.styleName) {
      case 'apartment': return rng.int(4, 6);
      case 'hospital': return rng.int(6, 9);
      case 'bunker': return rng.int(5, 7);
      case 'factory': return rng.int(4, 6);
      case 'warehouse': return rng.int(3, 5);
      case 'church': return rng.int(3, 4);
      case 'shop': case 'gas_station': return rng.int(3, 4);
      case 'school': return rng.int(5, 7);
      case 'lab': return rng.int(4, 6);
      default: return rng.int(4, 6);
    }
  }

  assignRoomTypes(rects, floor) {
    const { rng, cfg } = this;
    const list = Object.entries(cfg.roomW);
    for (const r of rects) {
      const type = pickWeighted(rng, list);
      this.rooms.push({ ...r, type, floor, area: (r.x1 - r.x0) * (r.z1 - r.z0) });
    }
  }

  rasterize(rects, w, d) {
    const nx = Math.ceil(w / CELL), nz = Math.ceil(d / CELL);
    const grid = new Int16Array(nx * nz).fill(-1);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const px = (i + 0.5) * CELL, pz = (j + 0.5) * CELL;
        for (const r of rects) {
          if (px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1) { grid[j * nx + i] = r.id; break; }
        }
      }
    }
    return { grid, nx, nz, w, d };
  }

  // ---------- structure ----------
  buildFloorStructure(B, rooms, G, w, d, fy, isTop) {
    const { cfg, rng } = this;
    const cos = Math.cos(this.ry), sin = Math.sin(this.ry);

    // Floor slab (slightly oversized to hide seams)
    const slabMat = cfg.floorMat();
    this.slabQuads(B, w, d, fy, slabMat, 0.22);

    // Ceiling / next floor
    if (!isTop) this.slabQuads(B, w, d, fy + this.floorH, M.concrete, 0.24);
    else if (cfg.roof === 'flat') this.slabQuads(B, w, d, fy + this.floorH, M.concrete, 0.3);

    // ---- extract wall segments from occupancy grid ----
    const H = this.floorH - 0.24;
    const isExt = (id) => id === -1;
    const cellId = (i, j) => {
      if (i < 0 || j < 0 || i >= G.nx || j >= G.nz) return -2;
      return G.grid[j * G.nx + i];
    };
    const wallSegs = []; // {axis:'x'|'z', a0,a1, at, ext, leftId, rightId}
    // vertical walls (constant x, running along z)
    for (let i = 0; i <= G.nx; i++) {
      let runStart = null;
      for (let j = 0; j <= G.nz; j++) {
        let boundary = false, left = -9, right = -9;
        if (j < G.nz && i > 0 && i < G.nx) {
          const a = cellId(i - 1, j), b = cellId(i, j);
          if (a !== b && a !== -2 && b !== -2) { boundary = true; left = a; right = b; }
        } else if (j < G.nz && (i === 0 || i === G.nx)) {
          const a = cellId(i === 0 ? 0 : G.nx - 1, j);
          if (a >= 0) { boundary = true; left = a; right = -1; }
        }
        if (boundary && runStart === null) runStart = { j0: j, left, right };
        else if ((!boundary || (runStart && (runStart.left !== left || runStart.right !== right))) && runStart) {
          wallSegs.push({ axis: 'z', at: i * CELL, a0: runStart.j0 * CELL, a1: j * CELL, left: runStart.left, right: runStart.right });
          runStart = boundary ? { j0: j, left, right } : null;
        }
      }
    }
    // horizontal walls (constant z, running along x)
    for (let j = 0; j <= G.nz; j++) {
      let runStart = null;
      for (let i = 0; i <= G.nx; i++) {
        let boundary = false, left = -9, right = -9;
        if (i < G.nx && j > 0 && j < G.nz) {
          const a = cellId(i, j - 1), b = cellId(i, j);
          if (a !== b && a !== -2 && b !== -2) { boundary = true; left = a; right = b; }
        } else if (i < G.nx && (j === 0 || j === G.nz)) {
          const a = cellId(i, j === 0 ? 0 : G.nz - 1);
          if (a >= 0) { boundary = true; left = a; right = -1; }
        }
        if (boundary && runStart === null) runStart = { i0: i, left, right };
        else if ((!boundary || (runStart && (runStart.left !== left || runStart.right !== right))) && runStart) {
          wallSegs.push({ axis: 'x', at: j * CELL, a0: runStart.i0 * CELL, a1: i * CELL, left: runStart.left, right: runStart.right });
          runStart = boundary ? { i0: i, left, right } : null;
        }
      }
    }

    // ---- build each segment with openings ----
    for (const s of wallSegs) {
      const len = s.a1 - s.a0;
      if (len < 0.4) continue;
      const exterior = s.right === -1 || s.left === -1;
      const th = exterior ? cfg.ext : cfg.int;
      const material = exterior ? cfg.wall() : cfg.innerWall();
      const holes = [];
      const isEntrance = this.isEntranceWall(s, w, d);
      const openings = [];

      if (exterior) {
        const W = cfg.window;
        // windows evenly spaced
        const count = Math.max(0, Math.floor((len - 1.0) / W.spacing));
        for (let i = 0; i < count; i++) {
          const center = s.a0 + (len / (count + 1)) * (i + 1);
          const hw = Math.min(W.w / 2, 0.9);
          openings.push({ c: center, w: hw * 2, kind: 'window', sill: W.sill, top: W.sill + W.h });
        }
        if (isEntrance) {
          openings.push({ c: s.a0 + len / 2, w: 1.3, kind: 'door', sill: 0, top: 2.25 });
          this.entrance = { axis: s.axis, at: s.at, a0: s.a0 + len / 2, floor: 0 };
        }
      } else if (len > 1.8) {
        // interior doorways: 1 or 2 depending on length
        const n = len > 6 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const c = s.a0 + (len / (n + 1)) * (i + 1);
          openings.push({ c, w: 1.1, kind: 'doorway', sill: 0, top: 2.15 });
        }
      }

      for (const o of openings) {
        holes.push({ x0: o.c - o.w / 2, x1: o.c + o.w / 2, y0: fy + o.sill, y1: fy + o.top });
      }

      // Local coords -> world for wall
      if (s.axis === 'z') {
        // wall runs along local Z at local X = s.at
        this.wallLocalZ(B, s.at, s.a0, s.a1, fy, fy + H, th, material, holes);
        // frames & glass
        for (const o of openings) this.addOpeningDressing(B, o, 'z', s.at, fy, th, s.a0);
      } else {
        this.wallLocalX(B, s.at, s.a0, s.a1, fy, fy + H, th, material, holes);
        for (const o of openings) this.addOpeningDressing(B, o, 'x', s.at, fy, th, s.a0);
      }

      // interior door meshes (some doors are open/removed)
      for (const o of openings) {
        if (o.kind !== 'doorway') continue;
        if (this.rng.chance(0.42)) continue; // missing door
        const [wx, wz] = this.localToWorld(s.axis === 'z' ? s.at : o.c, s.axis === 'z' ? o.c : s.at);
        const ry = (s.axis === 'z' ? this.ry + Math.PI / 2 : this.ry);
        this.doors.push({
          x: wx, y: fy, z: wz, ry, w: o.w - 0.06, h: 2.1,
          kind: this.rng.chance(0.3) ? 'metal' : 'wood',
          swing: this.rng.chance(0.5) ? 1 : -1,
          startOpen: this.rng.chance(0.35) ? this.rng.range(0.6, 1.5) : 0,
        });
      }
      if (exterior && openings.some((o) => o.kind === 'door')) {
        const o = openings.find((x) => x.kind === 'door');
        const [wx, wz] = this.localToWorld(s.axis === 'z' ? s.at : o.c, s.axis === 'z' ? o.c : s.at);
        this.doors.push({
          x: wx, y: fy, z: wz, ry: (s.axis === 'z' ? this.ry + Math.PI / 2 : this.ry),
          w: o.w - 0.06, h: 2.1, kind: 'wood', swing: 1, startOpen: this.rng.chance(0.6) ? 1.4 : 0,
          exterior: true,
        });
      }
    }
  }

  isEntranceWall(s, w, d) {
    if (s.right !== -1 && s.left !== -1) return false;
    const side = this.entranceSide;
    const eps = 1.2;
    if (s.axis === 'x') {
      if (Math.abs(s.at - 0) < eps) return side === 'front';
      if (Math.abs(s.at - d) < eps) return side === 'back';
    } else {
      if (Math.abs(s.at - 0) < eps) return side === 'left';
      if (Math.abs(s.at - w) < eps) return side === 'right';
    }
    return false;
  }

  localToWorld(lx, lz) {
    const cos = Math.cos(this.ry), sin = Math.sin(this.ry);
    return [this.x + lx * cos - lz * sin, this.z + lx * sin + lz * cos];
  }

  // wall along local Z axis (X = localAt)
  wallLocalZ(B, localX, z0, z1, y0, y1, th, material, holes) {
    const [wx0, wz0] = this.localToWorld(localX, z0);
    const [wx1, wz1] = this.localToWorld(localX, z1);
    const mx = (wx0 + wx1) / 2, mz = (wz0 + wz1) / 2;
    const len = Math.hypot(wx1 - wx0, wz1 - wz0);
    const yaw = Math.atan2(wx1 - wx0, wz1 - wz0);
    // convert hole coords from local Z to world length param
    const segs = this.splitHoles(0, len, y0, y1, holes.map((h) => ({
      x0: this.localZtoParam(h.x0, z0, z1, len), x1: this.localZtoParam(h.x1, z0, z1, len), y0: h.y0, y1: h.y1,
    })));
    for (const s of segs) {
      const sw = s.x1 - s.x0, sh = s.y1 - s.y0;
      if (sw <= 0.01 || sh <= 0.01) continue;
      const t = (s.x0 + s.x1) / 2 / len;
      const px = lerp(wx0, wx1, t), pz = lerp(wz0, wz1, t);
      B.add(boxGeo(th, sh, sw), material, px, (s.y0 + s.y1) / 2, pz, [0, yaw, 0]);
      const nCos = Math.cos(yaw), nSin = Math.sin(yaw);
      const hw = th / 2, hd = sw / 2;
      B.collideBox(px - Math.abs(nCos) * hw - Math.abs(nSin) * hd, s.y0, pz - Math.abs(nSin) * hw - Math.abs(nCos) * hd,
        px + Math.abs(nCos) * hw + Math.abs(nSin) * hd, s.y1, pz + Math.abs(nSin) * hw + Math.abs(nCos) * hd, 'wall');
    }
  }

  wallLocalX(B, localZ, x0, x1, y0, y1, th, material, holes) {
    const [wx0, wz0] = this.localToWorld(x0, localZ);
    const [wx1, wz1] = this.localToWorld(x1, localZ);
    const mx = (wx0 + wx1) / 2, mz = (wz0 + wz1) / 2;
    const len = Math.hypot(wx1 - wx0, wz1 - wz0);
    const yaw = Math.atan2(wx1 - wx0, wz1 - wz0);
    const segs = this.splitHoles(0, len, y0, y1, holes.map((h) => ({
      x0: this.localXtoParam(h.x0, x0, x1, len), x1: this.localXtoParam(h.x1, x0, x1, len), y0: h.y0, y1: h.y1,
    })));
    for (const s of segs) {
      const sw = s.x1 - s.x0, sh = s.y1 - s.y0;
      if (sw <= 0.01 || sh <= 0.01) continue;
      const t = (s.x0 + s.x1) / 2 / len;
      const px = lerp(wx0, wx1, t), pz = lerp(wz0, wz1, t);
      B.add(boxGeo(sw, sh, th), material, px, (s.y0 + s.y1) / 2, pz, [0, yaw, 0]);
      const nCos = Math.cos(yaw), nSin = Math.sin(yaw);
      const hw = sw / 2, hd = th / 2;
      B.collideBox(px - Math.abs(nCos) * hw - Math.abs(nSin) * hd, s.y0, pz - Math.abs(nSin) * hw - Math.abs(nCos) * hd,
        px + Math.abs(nCos) * hw + Math.abs(nSin) * hd, s.y1, pz + Math.abs(nSin) * hw + Math.abs(nCos) * hd, 'wall');
    }
  }

  localZtoParam(v, z0, z1, len) { const t = Math.abs(z1 - z0) < 1e-6 ? 0 : (v - z0) / (z1 - z0); return t * len; }
  localXtoParam(v, x0, x1, len) { const t = Math.abs(x1 - x0) < 1e-6 ? 0 : (v - x0) / (x1 - x0); return t * len; }

  splitHoles(a0, a1, y0, y1, holes) {
    const out = [];
    const hs = holes.filter((h) => h.x1 > a0 && h.x0 < a1 && h.y1 > y0 && h.y0 < y1)
      .map((h) => ({ x0: Math.max(a0, h.x0), x1: Math.min(a1, h.x1), y0: Math.max(y0, h.y0), y1: Math.min(y1, h.y1) }))
      .sort((p, q) => p.x0 - q.x0);
    let cur = a0;
    for (const h of hs) {
      if (h.x0 > cur) out.push({ x0: cur, x1: h.x0, y0, y1 });
      if (h.y0 > y0) out.push({ x0: h.x0, x1: h.x1, y0, y1: h.y0 });
      if (h.y1 < y1) out.push({ x0: h.x0, x1: h.x1, y0: h.y1, y1 });
      cur = Math.max(cur, h.x1);
    }
    if (cur < a1) out.push({ x0: cur, x1: a1, y0, y1 });
    return out;
  }

  addOpeningDressing(B, o, axis, at, fy, th, segStart) {
    const { rng } = this;
    const broken = rng.chance(0.45);
    // world pos of opening centre
    const lx = axis === 'z' ? at : o.c;
    const lz = axis === 'z' ? o.c : at;
    const [wx, wz] = this.localToWorld(lx, lz);
    const yaw = axis === 'z' ? this.ry + Math.PI / 2 : this.ry;
    if (o.kind === 'window') {
      // frame
      const fr = 0.06;
      B.add(boxGeo(o.w + fr * 2, fr, 0.1), M.woodWeathered, wx, fy + o.sill, wz, [0, yaw, 0]);
      B.add(boxGeo(o.w + 0.2, 0.06, 0.22), M.concrete, wx, fy + o.sill - 0.03, wz, [0, yaw, 0]);
      if (!broken) {
        const g = plain(0x8ea0a4, { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false });
        B.add(boxGeo(o.w, o.top - o.sill, 0.03), g, wx, fy + (o.sill + o.top) / 2, wz, [0, yaw, 0]);
      } else {
        // shards
        for (let i = 0; i < 3; i++) {
          B.add(boxGeo(0.1, 0.18, 0.02), plain(0x8ea0a4, { transparent: true, opacity: 0.4, roughness: 0.1 }),
            wx + rng.range(-o.w / 2, o.w / 2) * Math.cos(yaw), fy + o.top - 0.12, wz - rng.range(-o.w / 2, o.w / 2) * Math.sin(yaw), [0, yaw, rng.range(-0.3, 0.3)]);
        }
      }
      // vertical mullion
      if (o.w > 1.6) B.add(boxGeo(0.05, o.top - o.sill, 0.08), M.woodWeathered, wx, fy + (o.sill + o.top) / 2, wz, [0, yaw, 0]);
    } else if (o.kind === 'door') {
      // door frame
      B.add(boxGeo(o.w + 0.14, 0.08, 0.3), M.woodWeathered, wx, fy + o.top, wz, [0, yaw, 0]);
      B.add(boxGeo(0.07, o.top, 0.3), M.woodWeathered, wx + Math.cos(yaw) * (o.w / 2), fy + o.top / 2, wz - Math.sin(yaw) * (o.w / 2), [0, yaw, 0]);
      B.add(boxGeo(0.07, o.top, 0.3), M.woodWeathered, wx - Math.cos(yaw) * (o.w / 2), fy + o.top / 2, wz + Math.sin(yaw) * (o.w / 2), [0, yaw, 0]);
      // doorstep
      B.add(boxGeo(o.w + 0.2, 0.12, 0.6), M.concrete, wx, fy - 0.06, wz, [0, yaw, 0]);
    }
  }

  slabQuads(B, w, d, y, material, thick) {
    const cos = Math.cos(this.ry), sin = Math.sin(this.ry);
    const [cx, cz] = this.localToWorld(w / 2, d / 2);
    B.add(boxGeo(w, thick, d), material, cx, y - thick / 2, cz, [0, this.ry, 0]);
    // collider as AABB around rotated footprint
    const hw = w / 2, hd = d / 2;
    const ex = Math.abs(cos) * hw + Math.abs(sin) * hd;
    const ez = Math.abs(sin) * hw + Math.abs(cos) * hd;
    B.collideBox(cx - ex, y - thick, cz - ez, cx + ex, y, cz + ez, 'floor');
  }

  buildStairs(B, rooms, fy, fh) {
    const { rng } = this;
    // choose a room with enough depth
    const candidates = rooms.filter((r) => (r.z1 - r.z0) > 4.5).sort((a, b) => b.area - a.area);
    if (!candidates.length) return;
    const r = candidates[0];
    const cz0 = r.z0 + 0.6, cz1 = Math.min(r.z1 - 0.6, cz0 + (r.z1 - r.z0) * 0.75);
    const cx = r.x0 + (r.x1 - r.x0) * 0.5;
    const steps = 14;
    const dz = (cz1 - cz0) / steps;
    const rise = fh / steps;
    const stairW = Math.min(1.5, (r.x1 - r.x0) - 0.4);
    const [wx, wz] = this.localToWorld(cx, cz0);
    const dirZ = Math.sign(cz1 - cz0);
    for (let i = 0; i < steps; i++) {
      const ly = fy + rise * (i + 1);
      const lz = cz0 + dz * (i + 0.5);
      const [px, pz] = this.localToWorld(cx, lz);
      B.add(boxGeo(stairW, rise + 0.03, Math.abs(dz) + 0.02), M.concrete, px, ly - rise / 2 - 0.015, pz, [0, this.ry, 0]);
      B.collideBox(px - stairW / 2, ly - rise, pz - Math.abs(dz) / 2, px + stairW / 2, ly, pz + Math.abs(dz) / 2, 'stairs');
    }
    // railing
    for (let i = 0; i < steps; i += 2) {
      const lz = cz0 + dz * (i + 0.5);
      const [px, pz] = this.localToWorld(cx + stairW / 2 + 0.03, lz);
      B.add(boxGeo(0.04, 1.0, 0.04), M.steel, px, fy + (fh / steps) * (i + 1) + 0.5, pz);
    }
    // ceiling hole is handled implicitly: build a frame around opening so it reads as a stairwell
    this.stairs.push({ x: wx, z: wz, y: fy, dirZ, w: stairW, len: cz1 - cz0 });
  }

  populateRooms(B, rooms, fy, L2W) {
    const { rng, cfg } = this;
    for (const room of rooms) {
      const rw = room.x1 - room.x0, rd = room.z1 - room.z0;
      const area = rw * rd;
      // ---- furniture along walls ----
      const fset = ROOM_FURNITURE[room.type] || ROOM_FURNITURE.hall;
      const count = clamp(Math.round(area / 7), 1, 6);
      for (let i = 0; i < count; i++) {
        const kind = pickWeighted(rng, fset);
        const inset = 0.75;
        // pick a wall: 0=-X 1=+X 2=-Z 3=+Z
        const side = rng.int(0, 3);
        let lx, lz, ry;
        if (side === 0) { lx = room.x0 + inset; lz = rng.range(room.z0 + inset, room.z1 - inset); ry = this.ry + Math.PI / 2; }
        else if (side === 1) { lx = room.x1 - inset; lz = rng.range(room.z0 + inset, room.z1 - inset); ry = this.ry - Math.PI / 2; }
        else if (side === 2) { lx = rng.range(room.x0 + inset, room.x1 - inset); lz = room.z0 + inset; ry = this.ry; }
        else { lx = rng.range(room.x0 + inset, room.x1 - inset); lz = room.z1 - inset; ry = this.ry + Math.PI; }
        const [wx, wz] = this.localToWorld(lx, lz);
        this.placeFurniture(B, kind, wx, fy, wz, ry, rng, room);
      }
      // ---- loot anchor ----
      if (!this.noLoot && rng.chance(0.75 * this.lootMul)) {
        const [wx, wz] = this.localToWorld(rng.range(room.x0 + 1, room.x1 - 1), rng.range(room.z0 + 1, room.z1 - 1));
        this.lootPoints.push({
          x: wx, y: fy, z: wz, table: this.lootTableFor(room.type),
          kind: rng.pick(['crate', 'cabinet', 'drawer', 'toolbox', 'medbox', 'stash']),
        });
      }
      // ---- extra scattered loot on surfaces ----
      if (!this.noLoot && rng.chance(0.3 * this.lootMul)) {
        const [wx, wz] = this.localToWorld(rng.range(room.x0 + 0.8, room.x1 - 0.8), rng.range(room.z0 + 0.8, room.z1 - 0.8));
        this.lootPoints.push({ x: wx, y: fy + 0.8, z: wz, table: rng.chance(0.5) ? 'house' : this.lootTableFor(room.type), kind: 'body' });
      }
      // ---- lights ----
      if (rng.chance(0.55 * this.lightMul)) {
        const [wx, wz] = this.localToWorld((room.x0 + room.x1) / 2, (room.z0 + room.z1) / 2);
        this.lightPoints.push({
          x: wx, y: fy + this.floorH - 0.35, z: wz,
          flicker: rng.chance(0.55), color: rng.chance(0.25) ? 0x66d0a0 : (rng.chance(0.3) ? 0xd0a060 : 0xd8e0d0),
          intensity: rng.range(2.2, 5.0), range: rng.range(5, 9), dead: rng.chance(0.3),
        });
        // fixture mesh
        B.add(boxGeo(0.9, 0.08, 0.25), M.steel, wx, fy + this.floorH - 0.12, wz, [0, this.ry, 0]);
      }
    }
  }

  lootTableFor(type) {
    switch (type) {
      case 'patient': case 'operating': case 'bath': return 'medical';
      case 'armory': case 'control': return 'military';
      case 'generator': case 'storage': case 'hall_big': return 'industrial';
      case 'sales': case 'kitchen': return 'store';
      case 'nave': case 'altar': return 'rare';
      case 'lab': return 'warden';
      case 'office': case 'reception': return 'tool';
      default: return this.cfg.loot || 'house';
    }
  }

  placeFurniture(B, kind, x, y, z, ry, rng, room) {
    switch (kind) {
      case 'bed': Furniture.bed(B, x, y, z, ry, rng); break;
      case 'bunkBed': Furniture.bunkBed(B, x, y, z, ry, rng); break;
      case 'table': Furniture.table(B, x, y, z, ry, rng); break;
      case 'chair': Furniture.chair(B, x, y, z, ry); break;
      case 'sofa': Furniture.sofa(B, x, y, z, ry); break;
      case 'cabinet': Furniture.cabinet(B, x, y, z, ry, rng.range(1.2, 2.0)); break;
      case 'locker': Furniture.locker(B, x, y, z, ry); break;
      case 'shelf': Furniture.shelf(B, x, y, z, ry); break;
      case 'desk': Furniture.desk(B, x, y, z, ry); break;
      case 'counter': Furniture.counter(B, x, y, z, ry, rng.range(2.0, 3.4)); break;
      case 'hospitalBed': Furniture.hospitalBed(B, x, y, z, ry); break;
      case 'gurney': Furniture.gurney(B, x, y, z, ry); break;
      case 'toilet': Furniture.toilet(B, x, y, z, ry); break;
      case 'sink': Furniture.sink(B, x, y, z, ry); break;
      case 'machine': Furniture.machine(B, x, y, z, ry, rng.range(1.0, 2.0), rng.range(0.9, 1.6), rng.range(0.6, 1.0)); break;
      case 'crate': Furniture.crate(B, x, y, z, ry, rng.range(0.8, 1.1)); break;
      case 'barrel': Furniture.barrel(B, x, y, z, rng); break;
      case 'generator': Street.generator(B, x, y, z, ry); break;
      case 'fireplace': Furniture.fireplace(B, x, y, z); break;
      case 'clock': Furniture.clock(B, x, y, z, ry); break;
      default: Furniture.cabinet(B, x, y, z, ry);
    }
  }

  buildRoof(B, w, d, y) {
    const { cfg, rng } = this;
    const cos = Math.cos(this.ry), sin = Math.sin(this.ry);
    if (cfg.roof === 'flat') {
      this.slabQuads(B, w + 0.4, d + 0.4, y + 0.32, M.concrete, 0.3);
      // parapet
      for (const [ox, oz, ww, dd] of [[0, -d / 2, w + 0.4, 0.2], [0, d / 2, w + 0.4, 0.2], [-w / 2, 0, 0.2, d + 0.4], [w / 2, 0, 0.2, d + 0.4]]) {
        const [px, pz] = this.localToWorld(w / 2 + ox, d / 2 + oz);
        B.add(boxGeo(ww, 0.7, dd), M.concrete, px, y + 0.65, pz, [0, this.ry, 0]);
      }
    } else if (cfg.roof === 'collapsed') {
      // partial roof: one intact slope, one collapsed with rafters
      const half = w / 2;
      const rise = 1.2;
      const [cx, cz] = this.localToWorld(w / 2, d / 2);
      const slope = Math.atan2(rise, half);
      B.add(boxGeo(Math.hypot(half, rise), 0.14, d), M.corrugated, cx - half / 2 * cos, y + rise / 2, cz - half / 2 * sin, [0, this.ry, 0]);
      for (let i = 0; i < 5; i++) {
        const [px, pz] = this.localToWorld(w * 0.62 + i * 0.7, d * (0.2 + i * 0.15));
        B.add(boxGeo(0.12, 0.16, Math.min(4, d * 0.5)), M.woodWeathered, px, y + 0.25 + i * 0.12, pz, [0.2, this.ry, 0]);
      }
    } else {
      // gable / sawtooth
      const rise = cfg.roof === 'gable_tall' ? 4.2 : 1.9;
      const half = w / 2;
      const slope = Math.atan2(rise, half);
      for (const s of [-1, 1]) {
        const [px, pz] = this.localToWorld(w / 2 + s * half / 2, d / 2);
        B.add(boxGeo(Math.hypot(half, rise) + 0.3, 0.16, d + 0.5), M.corrugated, px, y + rise / 2, pz, [0, this.ry, -s * slope]);
      }
      // ridge
      const [rx, rz] = this.localToWorld(w / 2, d / 2);
      B.add(boxGeo(0.16, 0.16, d + 0.6), M.rust, rx, y + rise, rz, [0, this.ry, 0]);
      // gable end triangles (approximate with boxes)
      for (const s of [-1, 1]) {
        const [gx, gz] = this.localToWorld(w / 2, d / 2 + s * d / 2);
        const steps = 6;
        for (let i = 0; i < steps; i++) {
          const hh = rise * (1 - i / steps);
          const ww = (half * 2) * (1 - i / steps);
          B.add(boxGeo(ww, rise / steps + 0.02, 0.16), cfg.wall(), gx, y + (i + 0.5) * (rise / steps), gz, [0, this.ry, 0]);
        }
      }
    }
  }

  dressExterior(B, w, d, baseY, L2W) {
    const { rng } = this;
    // foundation skirt
    const [cx, cz] = this.localToWorld(w / 2, d / 2);
    B.add(boxGeo(w + 0.3, 0.5, d + 0.3), M.concrete, cx, baseY - 0.3, cz, [0, this.ry, 0]);
    // corner trim
    for (const [ox, oz] of [[0, 0], [w, 0], [0, d], [w, d]]) {
      const [px, pz] = this.localToWorld(ox, oz);
      B.add(boxGeo(0.34, this.floors * this.floorH, 0.34), M.concreteWet, px, baseY + this.floors * this.floorH / 2, pz, [0, this.ry, 0]);
    }
    // exterior pipes / cables
    const [px, pz] = this.localToWorld(w - 0.5, d / 2);
    B.add(cylGeo(0.09, 0.09, this.floors * this.floorH, 6), M.rust, px, baseY + this.floors * this.floorH / 2, pz);
    // roof vents
    for (let i = 0; i < 2; i++) {
      const [vx, vz] = this.localToWorld(rng.range(1, w - 1), rng.range(1, d - 1));
      B.add(boxGeo(0.6, 0.7, 0.6), M.steel, vx, baseY + this.floors * this.floorH + 0.9, vz, [0, this.ry, 0]);
    }
    if (this.styleName === 'warehouse' || this.styleName === 'factory') {
      // external loading dock
      const [dx, dz] = this.localToWorld(w / 2, -1.2);
      B.add(boxGeo(w * 0.4, 1.0, 2.0), M.concrete, dx, baseY + 0.3, dz, [0, this.ry, 0]);
    }
  }

  validateConnectivity(rects, G, floor) {
    // flood fill rooms through shared boundary segments with openings
    // (approximation: any two rooms sharing >=1.6m of boundary are connected)
    const adj = new Map();
    for (const r of rects) adj.set(r.id, new Set());
    for (const a of rects) {
      for (const b of rects) {
        if (a.id === b.id) continue;
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
        if ((ox >= 1.5 && Math.abs(oz) < 0.3) || (oz >= 1.5 && Math.abs(ox) < 0.3)) {
          adj.get(a.id).add(b.id); adj.get(b.id).add(a.id);
        }
      }
    }
    const seen = new Set();
    const stack = [rects[0].id];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      for (const n of adj.get(id) || []) if (!seen.has(n)) stack.push(n);
    }
    this.connectivity = this.connectivity || {};
    this.connectivity[floor] = { total: rects.length, reachable: seen.size };
  }
}

export { STYLE };
export const BUILDING_STYLES = Object.keys(STYLE);
