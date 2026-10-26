// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/world.js — the six regions
//
// Pipeline:
//   plan()        decide every placement, register terrain pads
//   buildTerrain() generate the splat-shaded heightfield
//   materialize()  emit merged static geometry, vegetation, props
// ============================================================
import * as THREE from 'three';
import { Terrain, ROADS, ROAD_HUBS } from './terrain.js';
import { Builder, boxGeo, cylGeo, sphereGeo, planeGeo } from './geo.js';
import { Building } from './buildings.js';
import { Furniture, Street, vehicle, buildTreeGeometries, rockGeo } from './props.js';
import { M, mat, plain } from '../core/materials.js';
import { REGIONS, BOSSES, LOOT, MUTANTS, regionAt } from '../game/data.js';
import { RNG, clamp, lerp, smoothstep, dist2, hash2 } from '../core/util.js';

// ------------------------------------------------------------
// Collider grid (spatial hash)
// ------------------------------------------------------------
export class ColliderGrid {
  constructor(cell = 20) { this.cell = cell; this.map = new Map(); this.count = 0; }
  key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
  addBox(minX, minY, minZ, maxX, maxY, maxZ, tag = 'wall') {
    const c = {
      minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX),
      minY: Math.min(minY, maxY), maxY: Math.max(minY, maxY),
      minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ), tag,
    };
    const ix0 = Math.floor(c.minX / this.cell), ix1 = Math.floor(c.maxX / this.cell);
    const iz0 = Math.floor(c.minZ / this.cell), iz1 = Math.floor(c.maxZ / this.cell);
    for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) {
      const k = this.key(ix, iz);
      let arr = this.map.get(k);
      if (!arr) { arr = []; this.map.set(k, arr); }
      arr.push(c);
    }
    this.count++;
    return c;
  }
  query(minX, minZ, maxX, maxZ, out = []) {
    out.length = 0;
    const ix0 = Math.floor(minX / this.cell), ix1 = Math.floor(maxX / this.cell);
    const iz0 = Math.floor(minZ / this.cell), iz1 = Math.floor(maxZ / this.cell);
    const seen = new Set();
    for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) {
      const arr = this.map.get(this.key(ix, iz));
      if (!arr) continue;
      for (const c of arr) { if (seen.has(c)) continue; seen.add(c); out.push(c); }
    }
    return out;
  }
  raycast(ox, oy, oz, dx, dy, dz, maxDist = 100, ignoreTag = null) {
    let best = null, bestT = maxDist;
    const visited = new Set();
    const tmp = [];
    const steps = Math.ceil(maxDist / 6);
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * maxDist;
      const px = ox + dx * t, pz = oz + dz * t;
      const arr = this.query(px - 6, pz - 6, px + 6, pz + 6, tmp);
      for (const c of arr) {
        if (visited.has(c)) continue;
        visited.add(c);
        if (ignoreTag && c.tag === ignoreTag) continue;
        const hit = rayBox(ox, oy, oz, dx, dy, dz, c);
        if (hit !== null && hit < bestT) { bestT = hit; best = c; }
      }
    }
    return best ? { collider: best, dist: bestT, point: new THREE.Vector3(ox + dx * bestT, oy + dy * bestT, oz + dz * bestT) } : null;
  }
}

function rayBox(ox, oy, oz, dx, dy, dz, c) {
  let tmin = 0, tmax = 1e9;
  const axes = [[ox, dx, c.minX, c.maxX], [oy, dy, c.minY, c.maxY], [oz, dz, c.minZ, c.maxZ]];
  for (const [o, d, mn, mx] of axes) {
    if (Math.abs(d) < 1e-8) { if (o < mn || o > mx) return null; }
    else {
      let t1 = (mn - o) / d, t2 = (mx - o) / d;
      if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

// ------------------------------------------------------------
export class World {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.seed = opts.seed || 20261026;
    this.terrain = new Terrain(this.seed);
    this.colliders = new ColliderGrid(20);
    this.builder = new Builder(scene, { name: 'world_static' });
    this.lootSpots = [];
    this.doorSpecs = [];
    this.lightPoints = [];
    this.pois = [];
    this.arenas = {};
    this.statics = [];
    this.hazards = [];
    this.trees = [];
    this.triggers = [];
    this.startPosition = new THREE.Vector3(-360, 0, 151);
    this.layout = {
      buildings: [], camps: [], trees: [], deadTrees: [], grass: [], rocks: [], debris: [],
      fences: [], props: [], lights: [], loot: [], vehicles: [], caches: [], enemies: [],
      haze: [], nests: [],
    };
    this.time = 0;
  }

  // ==================================================================
  // PHASE 1 — PLAN
  // ==================================================================
  plan() {
    const t0 = Date.now();
    this.planSuburbs();
    this.planForest();
    this.planIndustrial();
    this.planCity();
    this.planMilitary();
    this.planWasteland();
    this.planArenas();
    this.planRoadside();
    this.planMs = Date.now() - t0;
  }

  addPadAt(x, z, hw, hd, ry, blend = 3.5, tag = 'building') {
    const y = this.terrain.rawHeightAt(x, z);
    // average over footprint corners for a stable base
    let sum = y, n = 1;
    const cos = Math.cos(ry), sin = Math.sin(ry);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) {
      const lx = sx * hw * 0.8, lz = sz * hd * 0.8;
      const px = x + lx * cos - lz * sin, pz = z + lx * sin + lz * cos;
      sum += this.terrain.rawHeightAt(px, pz); n++;
    }
    const base = sum / n;
    this.terrain.addPad(x, z, hw, hd, ry, base, blend, tag);
    return base;
  }

  planBuilding(style, x, z, opts = {}) {
    const rng = new RNG(Math.floor(x * 13.7 + z * 7.3 + this.seed + (style.length * 91)));
    const ry = opts.ry ?? rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
    const seed = rng.int(1, 1e9);
    // estimate footprint from style for the pad, then refine once built
    const probe = new Building({ styleName: style, x, z, ry, seed, floors: opts.floors, w: opts.w, d: opts.d });
    const cfg = probe.cfg;
    const w = opts.w ?? (cfg.size[0] + cfg.size[1]) / 2;
    const d = opts.d ?? (cfg.size[2] + cfg.size[3]) / 2;
    const y = this.addPadAt(x, z, w / 2 + 1.5, d / 2 + 1.5, ry, 4.0, 'building');
    const spec = { style, x, z, ry, seed, y, w: opts.w, d: opts.d, floors: opts.floors, ...opts };
    this.layout.buildings.push(spec);
    return spec;
  }

  planCamp(x, z, size = 3) {
    const y = this.addPadAt(x, z, size * 1.9, size * 1.9, 0, 5, 'camp');
    this.layout.camps.push({ x, z, y, size });
    return y;
  }

  placeLots(region, count, opts = {}) {
    const rng = new RNG(this.seed + regionName(region) + (opts.seed || 0));
    const lots = [];
    const margin = opts.margin ?? 20;
    const minDist = opts.minDist ?? 26;
    let guard = 0;
    while (lots.length < count && guard++ < count * 80) {
      const x = rng.range(region.x0 + margin, region.x1 - margin);
      const z = rng.range(region.z0 + margin, region.z1 - margin);
      const rd = this.terrain.roadDist(x, z);
      if (rd.d < rd.w * 0.5 + (opts.roadClear ?? 12)) continue;
      if (Math.hypot(x - this.terrain.crater.x, z - this.terrain.crater.z) < this.terrain.crater.r * 1.5) continue;
      if (Math.hypot(x - this.terrain.lake.x, z - this.terrain.lake.z) < this.terrain.lake.r * 1.4) continue;
      if (this.terrain.riverDist(x, z) < 12) continue;
      const n = this.terrain.normalAt(x, z, 4);
      if (n.y < (opts.minFlat || 0.93)) continue;
      let ok = true;
      for (const l of lots) if (dist2(x, z, l.x, l.z) < minDist * (l.scale || 1)) { ok = false; break; }
      if (!ok) continue;
      if (!this.isFreeOfPads(x, z, minDist * 0.6)) continue;
      lots.push({ x, z, scale: 1 });
    }
    return lots;
  }

  isFreeOfPads(x, z, r) {
    for (const p of this.terrain.pads) {
      if (dist2(x, z, p.x, p.z) < r + Math.hypot(p.hw, p.hd)) return false;
    }
    return true;
  }

  addPOI(id, name, x, z, type, extra = {}) {
    const y = this.terrain.heightAt(x, z);
    const poi = { id, name, x, z, y, type, region: regionAt(x, z).id, ...extra };
    this.pois.push(poi);
    return poi;
  }

  addLoot(x, y, z, table, kind = 'crate', extra = {}) {
    this.layout.loot.push({ x, y, z, table, kind, ...extra });
  }

  addLight(x, y, z, color, intensity, range, opts = {}) {
    this.layout.lights.push({ x, y, z, color, intensity, range, flicker: !!opts.flicker, dead: !!opts.dead, fire: !!opts.fire, spot: opts.spot || null });
  }

  // ---- SHELTER -------------------------------------------------------
  planShelter() {
    const x = -360, z = 150;
    const gy = this.terrain.rawHeightAt(x, z);
    const floorY = gy - 7.4;
    const W = 18, D = 12;
    this.startPosition.set(x, floorY + 0.05, z + 2.0);
    this.shelter = { x, y: floorY, z, w: W, d: D, surfaceY: gy };
    // keep the surface above the shelter flat
    this.terrain.addPad(x, z + 6, 16, 24, 0, gy, 8, 'shelter');
    this.addPOI('shelter12', 'Shelter 12', x, z, 'shelter');
  }

  buildShelter(B) {
    const { x, y: floorY, z, w: W, d: D } = this.shelter;
    const wallH = 3.2;
    B.add(boxGeo(W, 0.4, D), M.floor, x, floorY - 0.2, z);
    B.collideBox(x - W / 2, floorY - 0.4, z - D / 2, x + W / 2, floorY, z + D / 2, 'floor');
    B.add(boxGeo(W, 0.4, D), M.concrete, x, floorY + wallH + 0.2, z);
    B.collideBox(x - W / 2, floorY + wallH, z - D / 2, x + W / 2, floorY + wallH + 0.4, z + D / 2, 'ceiling');
    const t = 0.35;
    // -Z wall
    B.add(boxGeo(W, wallH, t), M.concreteWet, x, floorY + wallH / 2, z - D / 2);
    B.collideBox(x - W / 2, floorY, z - D / 2 - t / 2, x + W / 2, floorY + wallH, z - D / 2 + t / 2, 'wall');
    // -X and +X walls
    for (const s of [-1, 1]) {
      B.add(boxGeo(t, wallH, D), M.concreteWet, x + s * W / 2, floorY + wallH / 2, z);
      B.collideBox(x + s * W / 2 - t / 2, floorY, z - D / 2, x + s * W / 2 + t / 2, floorY + wallH, z + D / 2, 'wall');
    }
    // +Z wall with stair opening
    const gap = 1.7;
    for (const s of [-1, 1]) {
      const segW = (W / 2 - gap / 2);
      B.add(boxGeo(segW, wallH, t), M.concreteWet, x + s * (gap / 2 + segW / 2), floorY + wallH / 2, z + D / 2);
      B.collideBox(x + s * gap / 2, floorY, z + D / 2 - t / 2, x + s * (gap / 2 + segW), floorY + wallH, z + D / 2 + t / 2, 'wall');
    }
    B.add(boxGeo(gap + 0.4, 0.8, t), M.concreteWet, x, floorY + wallH - 0.4, z + D / 2);
    // interior partitions
    B.add(boxGeo(0.28, wallH, 4.4), M.panel, x - 3.2, floorY + wallH / 2, z - 3.6);
    B.collideBox(x - 3.34, floorY, z - 5.8, x - 3.06, floorY + wallH, z - 1.4, 'wall');
    B.add(boxGeo(0.28, wallH, 4.2), M.panel, x + 4.4, floorY + wallH / 2, z + 3.8);
    B.collideBox(x + 4.26, floorY, z + 1.7, x + 4.54, floorY + wallH, z + 5.9, 'wall');
    // furniture
    const rng = new RNG(31);
    Furniture.bunkBed(B, x - 6.6, floorY, z - 3.4, Math.PI / 2, rng);
    Furniture.bunkBed(B, x - 6.6, floorY, z - 0.9, Math.PI / 2, rng);
    Furniture.locker(B, x + 7.9, floorY, z + 4.2, -Math.PI / 2);
    Furniture.locker(B, x + 7.9, floorY, z + 5.1, -Math.PI / 2);
    Furniture.table(B, x + 1.4, floorY, z + 0.6, 0, rng);
    Furniture.chair(B, x + 1.4, floorY, z + 1.6, Math.PI);
    Furniture.cabinet(B, x - 7.9, floorY, z + 4.2, Math.PI / 2);
    Furniture.shelf(B, x - 0.4, floorY, z - 4.6, 0, 1.8, 1.6, 0.4);
    // radio console
    B.add(boxGeo(2.6, 1.0, 0.9), M.metalPaint, x + 6.6, floorY + 0.5, z - 3.2, [0, -Math.PI / 2, 0]);
    B.add(boxGeo(0.06, 0.62, 1.05), mat('screen', { emissive: 0x55ff9a, emissiveIntensity: 2.0 }), x + 6.12, floorY + 1.22, z - 3.2, [0, -Math.PI / 2, 0]);
    B.add(cylGeo(0.05, 0.05, 1.7, 5), M.steel, x + 7.1, floorY + 1.85, z - 2.6);
    B.add(boxGeo(0.5, 0.3, 0.3), M.rust, x + 6.6, floorY + 1.15, z - 2.2);
    // beds sheet / blood decal via mat
    B.add(planeGeo(2.4, 2.4), mat('blood', { transparent: true, depthWrite: false, polygonOffset: true, alphaTest: 0.15 }),
      x - 5.2, floorY + 0.012, z - 2.2, [0, rng.range(0, 6), 0]);
    // lights
    this.addLight(x + 5.0, floorY + 2.72, z + 2.0, 0xd8e8dc, 5.5, 11, { flicker: true });
    this.addLight(x - 5.5, floorY + 2.72, z - 2.0, 0x9ec8b4, 3.2, 9);
    this.addLight(x + 6.2, floorY + 1.4, z - 3.2, 0x55ff9a, 2.2, 5);
    // stairwell up to surface
    const shaftZ = z + D / 2 + 1.4;
    for (let i = 0; i < 20; i++) {
      const sy = floorY + i * 0.37;
      const sz = shaftZ + i * 1.05;
      B.add(boxGeo(3.0, 0.37, 1.05), M.concrete, x, sy + 0.185, sz);
      B.collideBox(x - 1.5, sy, sz - 0.52, x + 1.5, sy + 0.37, sz + 0.52, 'stairs');
      for (const s of [-1, 1]) {
        B.add(boxGeo(0.3, 3.3, 1.05), M.concreteWet, x + s * 1.72, sy + 1.65, sz);
        B.collideBox(x + s * 1.72 - 0.15, sy, sz - 0.52, x + s * 1.72 + 0.15, sy + 3.3, sz + 0.52, 'wall');
      }
      if (i % 5 === 0) this.addLight(x, sy + 2.9, sz, 0xffb877, 3.2, 7, { flicker: i % 10 === 0 });
    }
    const topY = floorY + 20 * 0.37;
    // hatch housing on the surface
    const hy = this.shelter.surfaceY;
    const hz = shaftZ + 20 * 1.05;
    B.add(boxGeo(5.4, 2.4, 5.4), M.concrete, x, hy + 0.9, hz);
    B.collideBox(x - 2.7, hy - 0.3, hz - 2.7, x + 2.7, hy + 2.2, hz + 2.7, 'wall');
    B.add(boxGeo(3.0, 0.35, 3.0), M.steel, x, hy + 2.42, hz);
    B.add(boxGeo(2.4, 0.22, 2.6), M.hazard, x, hy + 2.6, hz);
    this.addLight(x, hy + 2.4, hz, 0xffa050, 4, 10, { flicker: true });
    this.shelter.hatch = { x, y: hy + 2.6, z: hz };
    // starting supplies
    this.addLoot(x + 1.2, floorY + 0.92, z + 0.6, 'start', 'medbox');
    this.addLoot(x - 6.6, floorY + 0.62, z - 3.4, 'start2', 'crate');
    this.addLoot(x + 7.9, floorY, z + 4.2, 'military', 'toolbox');
    this.addLoot(x - 0.4, floorY + 1.0, z - 4.6, 'house', 'drawer');
    // surface dressing around the hatch
    const rng2 = new RNG(77);
    for (let i = 0; i < 6; i++) {
      const a = rng2.range(0, 6.28), r = rng2.range(5, 14);
      const px = x + Math.cos(a) * r, pz = hz + Math.sin(a) * r;
      this.layout.debris.push({ x: px, z: pz, kind: rng2.pick(['tire', 'plank', 'crate', 'barrel']), ry: rng2.range(0, 6.28) });
    }
  }

  // ---- SUBURBS -------------------------------------------------------
  planSuburbs() {
    const region = REGIONS[0];
    const rng = new RNG(this.seed + 101);
    this.planShelter();
    // street grid: houses face the streets
    const streets = [140, 200, 260, 320, 380, 440];
    const crossStreets = [-620, -560, -500, -440, -380, -320, -260, -200];
    // house rows along each street
    for (const sz of streets) {
      for (let x = -640; x < -160; x += 34) {
        const jitter = rng.range(-4, 4);
        const px = x + jitter, pz = sz + rng.range(-3, 3);
        if (this.terrain.roadDist(px, pz).d < 17) continue;
        if (this.terrain.normalAt(px, pz, 4).y < 0.9) continue;
        if (!this.isFreeOfPads(px, pz, 14)) continue;
        if (rng.chance(0.28)) continue;
        const style = rng.pick(['house', 'house', 'ruined_house', 'house', 'ruined_house']);
        // face the street
        const ry = pz > sz ? Math.PI : 0;
        this.planBuilding(style, px, pz, { ry, lootMul: rng.range(0.7, 1.2), lightMul: 0.45 });
      }
    }
    for (const sx of crossStreets) {
      for (let z = 60; z < 470; z += 36) {
        const px = sx + rng.range(-4, 4), pz = z;
        if (this.terrain.roadDist(px, pz).d < 16) continue;
        if (this.terrain.normalAt(px, pz, 4).y < 0.9) continue;
        if (!this.isFreeOfPads(px, pz, 14)) continue;
        if (rng.chance(0.45)) continue;
        const ry = px > sx ? -Math.PI / 2 : Math.PI / 2;
        this.planBuilding(rng.pick(['house', 'ruined_house']), px, pz, { ry, lootMul: rng.range(0.7, 1.1), lightMul: 0.4 });
      }
    }
    // civic buildings
    this.planBuilding('school', -400, 300, { ry: Math.PI / 2, lootMul: 1.2, lightMul: 0.6 });
    this.planBuilding('gas_station', -300, 236, { ry: 0, lootMul: 1.1 });
    this.planBuilding('shop', -230, 250, { ry: -Math.PI / 2, lootMul: 1.0 });
    this.planBuilding('shop', -560, 250, { ry: Math.PI / 2, lootMul: 1.0 });
    this.addPOI('sub_school', 'Ravenwood Elementary', -400, 300, 'landmark');
    this.addPOI('sub_gas', 'Hollis Fuel & Go', -300, 236, 'landmark');
    this.addPOI('sub_church', 'St. Agnes Church', -520, 120, 'boss');
    this.addPOI('sub_camp', 'Hollow Street Camp', -252, 250, 'camp');
    this.planCamp(-252, 268, 3.4);
    this.addPOI('sub_shelter', 'Shelter 12 Access', -360, 172, 'shelter');
    // yards, sheds, fences, gardens
    for (let i = 0; i < 60; i++) {
      const x = rng.range(-660, -140), z = rng.range(40, 480);
      if (this.terrain.roadDist(x, z).d < 12) continue;
      if (!this.isFreeOfPads(x, z, 4)) continue;
      const r = rng.next();
      const y = this.terrain.rawHeightAt(x, z);
      if (r < 0.22) this.layout.fences.push({ x0: x, z0: z, x1: x + rng.range(4, 10), z1: z + rng.range(-2, 2), kind: 'wood', h: 1.4 });
      else if (r < 0.34) this.layout.props.push({ kind: 'shed', x, y, z, ry: rng.range(0, 6.28) });
      else if (r < 0.46) this.layout.debris.push({ x, z, kind: rng.pick(['rubble', 'rubble', 'tire', 'plank']), ry: rng.range(0, 6.28) });
      else if (r < 0.56) this.layout.vehicles.push({ x, z, ry: rng.range(0, 6.28), type: rng.pick(['sedan', 'van', 'pickup']) });
      else if (r < 0.66) this.layout.props.push({ kind: 'garden', x, y, z, ry: rng.range(0, 6.28) });
      else if (r < 0.74) this.layout.props.push({ kind: 'playset', x, y, z, ry: rng.range(0, 6.28) });
      else if (r < 0.82) this.layout.props.push({ kind: 'mailbox', x, y, z, ry: rng.range(0, 6.28) });
      else this.layout.trees.push({ x, y, z, kind: rng.pick([3, 4, 3]), s: rng.range(0.6, 1.0), ry: rng.range(0, 6.28) });
    }
    // scattered bodies
    for (let i = 0; i < 14; i++) {
      const x = rng.range(-650, -150), z = rng.range(50, 470);
      if (this.terrain.roadDist(x, z).d < 8) continue;
      this.addLoot(x, this.terrain.rawHeightAt(x, z), z, 'house', 'body');
    }
  }

  // ---- FOREST --------------------------------------------------------
  planForest() {
    const region = REGIONS[1];
    const rng = new RNG(this.seed + 202);
    this.forestClearings = [];
    for (let i = 0; i < 16; i++) {
      this.forestClearings.push({ x: rng.range(-660, -140), z: rng.range(-480, -30), r: rng.range(16, 40) });
    }
    const treeRng = new RNG(this.seed + 900);
    const N = 4200;
    for (let i = 0; i < N; i++) {
      const x = treeRng.range(-690, -110), z = treeRng.range(-495, -5);
      const rd = this.terrain.roadDist(x, z);
      if (rd.d < 11) continue;
      let inClear = false;
      for (const c of this.forestClearings) if (dist2(x, z, c.x, c.z) < c.r) { inClear = true; break; }
      if (inClear && treeRng.chance(0.9)) continue;
      const p = this.terrain.padsAt(x, z);
      if (p && p.length) continue;
      const slope = this.terrain.normalAt(x, z, 2).y;
      if (slope < 0.6) continue;
      const y = this.terrain.rawHeightAt(x, z);
      const kind = treeRng.pickWeighted([0, 1, 2, 3, 4, 5, 6], (k) => (k < 3 ? 34 : k < 5 ? 20 : 8));
      const s = treeRng.range(0.75, 1.45);
      this.layout.trees.push({ x, y, z, kind, s, ry: treeRng.range(0, 6.28) });
      if (!treeRng.chance(0.35)) this.layout.grass.push({ x: x + treeRng.range(-2, 2), z: z + treeRng.range(-2, 2), s: treeRng.range(0.7, 1.3) });
    }
    // undergrowth
    for (let i = 0; i < 5000; i++) {
      const x = treeRng.range(-690, -110), z = treeRng.range(-495, -5);
      if (this.terrain.roadDist(x, z).d < 8) continue;
      const p = this.terrain.padsAt(x, z);
      if (p && p.length) continue;
      if (treeRng.chance(0.5)) continue;
      this.layout.grass.push({ x, z, s: treeRng.range(0.6, 1.5), bush: treeRng.chance(0.25) });
    }
    // rocks & logs
    for (let i = 0; i < 260; i++) {
      const x = treeRng.range(-690, -110), z = treeRng.range(-495, -5);
      if (this.terrain.roadDist(x, z).d < 9) continue;
      const p = this.terrain.padsAt(x, z);
      if (p && p.length) continue;
      const y = this.terrain.rawHeightAt(x, z);
      if (treeRng.chance(0.35)) this.layout.rocks.push({ x, y, z, s: treeRng.range(0.4, 2.2), seed: treeRng.int(1, 9999) });
      else this.layout.debris.push({ x, z, kind: 'log', ry: treeRng.range(0, 6.28), s: treeRng.range(0.7, 1.4) });
    }
    // cabins
    const cabinSpots = [[-500, -260], [-250, -420], [-620, -120], [-340, -80], [-580, -350]];
    for (const [x, z] of cabinSpots) this.planBuilding('ruined_house', x, z, { lootMul: 1.2, lightMul: 0.4, ry: 0, ruin: 0.25 });
    this.addPOI('for_cabin', "The Hunter's Cabin", -500, -260, 'landmark');
    this.planBuilding('lab', -300, -300, { ry: 0.2, lootMul: 1.5, lightMul: 0.8 });
    this.addPOI('for_outpost', 'Blackwood Research Post', -300, -300, 'landmark');
    // cave / mine adit
    this.cave = { x: -560, z: -400, depth: 26 };
    this.addPadAt(-560, -400, 12, 8, 0, 6, 'cave');
    this.addPOI('for_tunnel', 'Mine Adit 4', -560, -400, 'cave');
    // nest
    this.addPOI('for_nest', "The Matriarch's Nest", -180, -180, 'boss');
    this.planCamp(-420, -120, 3);
    this.addPOI('for_camp', "Woodcutter's Rest", -420, -120, 'camp');
    this.hazeVolumes = [{ x: -420, z: -180, r: 150, y: 1, density: 0.055, color: 0x9aa89e }];
  }

  // ---- INDUSTRIAL ----------------------------------------------------
  planIndustrial() {
    const region = REGIONS[2];
    const rng = new RNG(this.seed + 303);
    const lots = this.placeLots(region, 14, { margin: 30, minDist: 44, roadClear: 13, seed: 11 });
    lots.forEach((lot) => {
      const style = rng.pick(['warehouse', 'factory', 'warehouse', 'office', 'checkpoint']);
      this.planBuilding(style, lot.x, lot.z, { lootMul: 1.1, lightMul: 0.5 });
    });
    // tank farm
    this.tankFarm = { x: 60, z: 300 };
    this.addPadAt(60, 300, 44, 16, 0, 4, 'tanks');
    for (let i = 0; i < 5; i++) this.layout.props.push({ kind: 'tank', x: 20 + i * 17, y: this.terrain.rawHeightAt(20 + i * 17, 300), z: 300 });
    // chimney + cooling towers
    this.addPadAt(230, 220, 8, 8, 0, 4, 'chimney');
    this.layout.props.push({ kind: 'chimney', x: 230, y: this.terrain.rawHeightAt(230, 220), z: 220 });
    for (let i = 0; i < 2; i++) {
      const tx = 150 + i * 62, tz = 400;
      this.addPadAt(tx, tz, 20, 20, 0, 5, 'cooling');
      this.layout.props.push({ kind: 'cooling', x: tx, y: this.terrain.rawHeightAt(tx, tz), z: tz });
    }
    // pipes
    for (let i = 0; i < 30; i++) {
      const x = rng.range(-80, 280), z = rng.range(30, 470);
      if (this.terrain.roadDist(x, z).d < 10) continue;
      if (!this.isFreeOfPads(x, z, 3)) continue;
      const y = this.terrain.rawHeightAt(x, z);
      this.layout.props.push({ kind: rng.chance(0.5) ? 'pipes' : 'pipes_v', x, y, z, ry: rng.pick([0, Math.PI / 2]), len: rng.range(5, 12) });
    }
    // hazard barrels / puddles
    for (let i = 0; i < 40; i++) {
      const x = rng.range(-90, 290), z = rng.range(20, 480);
      if (this.terrain.roadDist(x, z).d < 8) continue;
      const y = this.terrain.rawHeightAt(x, z);
      if (rng.chance(0.35)) {
        this.layout.props.push({ kind: 'puddle', x, y, z, r: rng.range(1.2, 3.4) });
      } else {
        this.layout.props.push({ kind: 'barrels', x, y, z, n: rng.int(1, 4) });
      }
    }
    this.planBuilding('warehouse', 260, 80, { ry: 0, lootMul: 1.3 });
    this.planCamp(20, 60, 3);
    this.addPOI('ind_power', 'Kolmogor Power Plant', 100, 250, 'landmark');
    this.addPOI('ind_depot', 'Rail Depot', -60, 140, 'landmark');
    this.addPOI('ind_camp', 'Scrapper Camp', 20, 60, 'camp');
    this.addPOI('ind_warehouse', 'Warehouse 12', 260, 80, 'landmark');
    this.addPOI('ind_foundry', 'Foundry 6', 230, 420, 'boss');
    // rail yard
    for (let i = 0; i < 3; i++) this.layout.props.push({ kind: 'rails', x: -60, z: 100 + i * 4, len: 120, ry: 0 });
    for (let i = 0; i < 4; i++) this.layout.props.push({ kind: 'wagon', x: -100 + i * 26, y: this.terrain.rawHeightAt(-100 + i * 26, 102), z: 102, ry: Math.PI / 2 });
  }

  // ---- CITY ----------------------------------------------------------
  planCity() {
    const region = REGIONS[3];
    const rng = new RNG(this.seed + 404);
    const blocks = [];
    for (let bx = 0; bx < 5; bx++) for (let bz = 0; bz < 5; bz++) blocks.push({ x: -80 + bx * 88, z: -440 + bz * 96 });
    for (const blk of blocks) {
      const n = rng.int(1, 2);
      for (let i = 0; i < n; i++) {
        const x = blk.x + rng.range(-20, 20), z = blk.z + rng.range(-22, 22);
        if (this.terrain.roadDist(x, z).d < 15) continue;
        if (!this.isFreeOfPads(x, z, 22)) continue;
        if (this.terrain.riverDist(x, z) < 14) continue;
        if (this.terrain.normalAt(x, z, 4).y < 0.9) continue;
        this.planBuilding(rng.pick(['apartment', 'apartment', 'office', 'shop', 'ruined_house']), x, z, { lootMul: rng.range(0.9, 1.3), lightMul: 0.65 });
      }
    }
    this.hospital = this.planBuilding('hospital', 40, -300, { ry: 0, lootMul: 1.6, lightMul: 0.9, floors: 3, w: 34, d: 24 });
    this.planBuilding('office', 210, -140, { ry: Math.PI / 2, lootMul: 1.2, floors: 3 });
    this.planBuilding('shop', -46, -84, { ry: 0, w: 20, d: 15, lootMul: 1.4 });
    this.planBuilding('school', 170, -420, { ry: Math.PI, lootMul: 1.2 });
    this.addPOI('city_hospital', 'St. Agnes General Hospital', 40, -300, 'landmark');
    this.addPOI('city_police', 'Precinct 9', 210, -140, 'landmark');
    this.addPOI('city_market', 'Vostok Supermarket', -46, -84, 'landmark');
    this.addPOI('city_school', 'Kirov Secondary', 170, -420, 'landmark');
    this.addPOI('city_subway', 'Metro — Line 2', 130, -400, 'cave');
    this.subway = { x: 130, z: -400 };
    this.addPadAt(130, -400, 5, 6, 0, 4, 'subway');
    this.overpass = { x: -40, z: -240, len: 64 };
    this.addPadAt(-40, -240, 7, 34, 0, 4, 'overpass');
    this.planCamp(150, -300, 4);
    this.addPOI('city_camp', 'Roof Garden Survivors', 150, -300, 'camp');
    // street furniture
    for (let i = 0; i < 120; i++) {
      const x = rng.range(-95, 295), z = rng.range(-490, -10);
      const rd = this.terrain.roadDist(x, z);
      if (Math.abs(rd.d - (rd.w * 0.5 + 2.2)) > 3) continue;
      const y = this.terrain.rawHeightAt(x, z);
      this.layout.props.push({ kind: rng.chance(0.55) ? 'lamp' : 'trash', x, y, z, broken: rng.chance(0.4) });
    }
    // abandoned cars in the streets
    for (let i = 0; i < 40; i++) {
      const x = rng.range(-98, 298), z = rng.range(-495, -5);
      if (this.terrain.roadDist(x, z).d > 7) continue;
      this.layout.vehicles.push({ x, z, ry: rng.range(0, 6.28), type: rng.pick(['sedan', 'van', 'sedan', 'bus']) });
    }
    // rooftop caches handled after build
    for (let i = 0; i < 10; i++) {
      const spec = this.layout.buildings.filter((b) => b.region === 'city');
      if (!spec.length) break;
      const s = rng.pick(spec);
      this.layout.caches.push({ x: s.x + rng.range(-4, 4), z: s.z + rng.range(-4, 4), floors: 2, building: s });
    }
  }

  // ---- MILITARY ------------------------------------------------------
  planMilitary() {
    const region = REGIONS[4];
    const rng = new RNG(this.seed + 505);
    this.planBuilding('bunker', 520, -140, { ry: 0, lootMul: 1.7, lightMul: 1.0, floors: 1 });
    this.planBuilding('lab', 400, -380, { ry: 0, lootMul: 1.5, lightMul: 0.8 });
    this.planBuilding('office', 610, -300, { ry: Math.PI / 2, lootMul: 1.2 });
    this.planBuilding('checkpoint', 460, -60, { ry: 0, lootMul: 1.4 });
    this.planBuilding('warehouse', 560, -420, { ry: 0, lootMul: 1.4 });
    this.addPOI('mil_bunker', 'Installation 7', 520, -140, 'boss');
    this.addPOI('mil_lab', 'Biolab K-9', 400, -380, 'landmark');
    this.addPOI('mil_barracks', 'Barracks C', 610, -300, 'landmark');
    this.addPOI('mil_armory', 'Armory 4', 460, -60, 'landmark');
    this.addPOI('mil_depot', 'Supply Depot 3', 560, -420, 'landmark');
    this.planCamp(360, -80, 3);
    this.addPOI('mil_camp', 'Forward Post Delta', 360, -80, 'camp');
    // perimeter + checkpoints + towers
    const fx0 = 330, fx1 = 680, fz0 = -470, fz1 = -30;
    this.layout.fences.push({ x0: fx0, z0: fz1, x1: fx1, z1: fz1, kind: 'chain', h: 2.6 });
    this.layout.fences.push({ x0: fx0, z0: fz0, x1: fx0, z1: fz1, kind: 'chain', h: 2.6 });
    const towerSpots = [[350, -250], [430, -250], [520, -250], [350, -120], [620, -400], [380, -430]];
    for (const [x, z] of towerSpots) {
      this.addPadAt(x, z, 2.2, 2.2, 0, 2, 'tower');
      this.layout.props.push({ kind: 'watchtower', x, y: this.terrain.rawHeightAt(x, z), z, h: 6.5 });
    }
    for (let i = 0; i < 3; i++) this.layout.props.push({ kind: 'radiotower', x: 360 + i * 44, y: this.terrain.rawHeightAt(360 + i * 44, -180), z: -180, h: 14 + i * 4 });
    for (let i = 0; i < 16; i++) {
      const x = rng.range(340, 670), z = rng.range(-455, -40);
      if (this.terrain.roadDist(x, z).d < 8) continue;
      this.layout.vehicles.push({ x, z, ry: rng.range(0, 6.28), type: rng.pick(['military', 'truck', 'military']) });
    }
    for (let i = 0; i < 20; i++) {
      const x = rng.range(335, 675), z = rng.range(-460, -35);
      if (this.terrain.roadDist(x, z).d < 8) continue;
      this.layout.props.push({ kind: 'sandbags', x, y: this.terrain.rawHeightAt(x, z), z, ry: rng.pick([0, Math.PI / 2]), len: rng.range(3, 6) });
    }
    this.hazards.push({ type: 'radiation', x: 450, z: -250, r: 22, dps: 2.4 });
    // barbed wire
    for (let i = 0; i < 10; i++) {
      const x = fx0 + rng.range(10, fx1 - fx0 - 20), z = fz0 + rng.range(10, fz1 - fz0 - 10);
      this.layout.debris.push({ x, z, kind: 'wire', ry: rng.chance(0.5) ? 0 : Math.PI / 2 });
    }
  }

  // ---- WASTELAND -----------------------------------------------------
  planWasteland() {
    const region = REGIONS[5];
    const rng = new RNG(this.seed + 606);
    for (let i = 0; i < 700; i++) {
      const x = rng.range(320, 690), z = rng.range(20, 480);
      const d = Math.hypot(x - this.terrain.crater.x, z - this.terrain.crater.z);
      if (d < this.terrain.crater.r * 1.15) continue;
      if (this.terrain.roadDist(x, z).d < 9) continue;
      const p = this.terrain.padsAt(x, z);
      if (p && p.length) continue;
      this.layout.deadTrees.push({ x, z, y: this.terrain.rawHeightAt(x, z), kind: rng.pick([5, 6]), s: rng.range(0.6, 1.5), ry: rng.range(0, 6.28) });
    }
    for (let i = 0; i < 14; i++) {
      const x = rng.range(330, 680), z = rng.range(30, 480);
      if (Math.hypot(x - this.terrain.crater.x, z - this.terrain.crater.z) < this.terrain.crater.r * 1.15) continue;
      this.layout.props.push({ kind: 'crater', x, y: this.terrain.rawHeightAt(x, z), z, r: rng.range(2.5, 8) });
    }
    for (let i = 0; i < 11; i++) {
      const x = rng.range(340, 680), z = rng.range(30, 480);
      if (Math.hypot(x - this.terrain.crater.x, z - this.terrain.crater.z) < this.terrain.crater.r * 1.2) continue;
      if (!this.isFreeOfPads(x, z, 6)) continue;
      this.layout.props.push({ kind: 'monolith', x, y: this.terrain.rawHeightAt(x, z), z, h: rng.range(6, 17), ry: rng.range(0, 6.28) });
    }
    for (let i = 0; i < 260; i++) {
      const x = rng.range(320, 690), z = rng.range(20, 480);
      this.layout.rocks.push({ x, y: this.terrain.rawHeightAt(x, z), z, s: rng.range(0.3, 1.6), seed: rng.int(1, 9999) });
    }
    for (let i = 0; i < 8; i++) {
      const a = rng.range(0, 6.28);
      const x = this.terrain.lake.x + Math.cos(a) * (this.terrain.lake.r + 5);
      const z = this.terrain.lake.z + Math.sin(a) * (this.terrain.lake.r + 5);
      this.layout.nests.push({ x, y: this.terrain.rawHeightAt(x, z), z, r: rng.range(2.2, 4.2) });
    }
    this.signalArray = { x: 640, z: 120 };
    this.addPadAt(640, 120, 32, 32, 0, 6, 'array');
    this.addPOI('was_array', 'The Signal Array', 640, 120, 'boss');
    this.addPOI('was_crater', 'Impact Crater', this.terrain.crater.x, this.terrain.crater.z, 'boss');
    this.addPOI('was_lake', 'Mirror Lake', this.terrain.lake.x, this.terrain.lake.z, 'landmark');
    this.addPOI('was_dig', 'Excavation Site 9', 600, 430, 'landmark');
    this.planCamp(380, 400, 3);
    this.addPOI('was_camp', 'Ash Nomads', 380, 400, 'camp');
    // dig site
    this.addPadAt(600, 430, 12, 12, 0, 5, 'dig');
    this.layout.props.push({ kind: 'dig', x: 600, y: this.terrain.rawHeightAt(600, 430), z: 430 });
    this.layout.props.push({ kind: 'array', x: 640, y: this.terrain.rawHeightAt(640, 120), z: 120 });
  }

  // ---- ARENAS --------------------------------------------------------
  planArenas() {
    // church
    this.addPadAt(-520, 120, 9, 13, 0, 5, 'arena');
    this.arenas.hollow_church = { x: -520, y: this.terrain.rawHeightAt(-520, 120), z: 120, radius: 10, boss: 'hollow_king' };
    // foundry pit
    this.addPadAt(230, 420, 20, 20, 0, 6, 'arena');
    this.arenas.foundry_pit = { x: 230, y: this.terrain.rawHeightAt(230, 420), z: 420, radius: 17, boss: 'iron_abomination' };
    // nest clearing
    this.addPadAt(-180, -180, 18, 18, 0, 8, 'arena');
    this.arenas.nest_clearing = { x: -180, y: this.terrain.rawHeightAt(-180, -180), z: -180, radius: 15, boss: 'forest_matriarch' };
    // crater rim
    const c = this.terrain.crater;
    const ax = c.x - c.r * 0.5, az = c.z + c.r * 0.55;
    this.addPadAt(ax, az, 20, 20, 0, 8, 'arena');
    this.arenas.crater_rim = { x: ax, y: this.terrain.rawHeightAt(ax, az), z: az, radius: 16, boss: 'contaminated_titan' };
    // bunker gate
    this.addPadAt(520, -60, 16, 16, 0, 6, 'arena');
    this.arenas.bunker_gate = { x: 520, y: this.terrain.rawHeightAt(520, -60), z: -60, radius: 13, boss: 'pale_commander' };
    // signal array arena
    this.arenas.signal_array = { x: 640, y: this.terrain.rawHeightAt(640, 120), z: 120, radius: 26, boss: 'last_signal' };
    this.hazards.push({ type: 'radiation', x: ax, z: az, r: 18, dps: 1.2 });
  }

  // ---- ROADSIDE ------------------------------------------------------
  planRoadside() {
    const rng = new RNG(this.seed + 909);
    for (const road of ROADS) {
      for (let i = 0; i < road.pts.length - 1; i++) {
        const [ax, az] = road.pts[i], [bx, bz] = road.pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const dx = (bx - ax) / len, dz = (bz - az) / len;
        const yaw = Math.atan2(dx, dz);
        for (let s = 0; s < len; s += 10) {
          const px = ax + dx * s, pz = az + dz * s;
          const side = rng.chance(0.5) ? 1 : -1;
          const off = road.width * 0.5 + rng.range(1.5, 5);
          const ox = px + dz * side * off, oz = pz - dx * side * off;
          if (Math.abs(ox) > 690 || Math.abs(oz) > 490) continue;
          if (!this.isFreeOfPads(ox, oz, 2) && rng.chance(0.8)) continue;
          const y = this.terrain.rawHeightAt(ox, oz);
          const r = rng.next();
          if (r < 0.26) this.layout.vehicles.push({ x: ox, z: oz, ry: rng.range(0, 6.28) + yaw, type: null, wrecked: rng.chance(0.5) });
          else if (r < 0.38) this.layout.props.push({ kind: 'lamp', x: ox, y, z: oz, broken: rng.chance(0.45) });
          else if (r < 0.46) this.layout.props.push({ kind: 'jersey', x: ox, y, z: oz, ry: yaw, len: rng.range(2, 4) });
          else if (r < 0.54) this.layout.debris.push({ x: ox, z: oz, kind: rng.pick(['rubble', 'tire', 'plank']), ry: rng.range(0, 6.28) });
          else if (r < 0.6) this.layout.props.push({ kind: 'cone', x: ox, y, z: oz });
          if (rng.chance(0.05)) this.addLoot(ox, y, oz, rng.chance(0.5) ? 'car' : 'house', rng.pick(['crate', 'toolbox', 'body']));
        }
        if (road.main) {
          for (let s = 0; s < len; s += 4.2) {
            const px = ax + dx * s, pz = az + dz * s;
            if (rng.chance(0.25)) continue;
            this.layout.debris.push({ x: px, z: pz, kind: 'line', ry: yaw, y: this.terrain.rawHeightAt(px, pz) + 0.03 });
          }
        }
      }
    }
    // street lamps & power lines through suburbs
    for (let x = -640; x < -140; x += 32) {
      const z = 214 + Math.sin(x * 0.02) * 18;
      this.layout.props.push({ kind: 'powerpole', x, y: this.terrain.rawHeightAt(x, z), z, ry: 0.1 });
    }
  }

  // ==================================================================
  // PHASE 2/3
  // ==================================================================
  async generate(onProgress = () => {}) {
    const t0 = Date.now();
    const step = async (name, fn, p) => {
      onProgress(name, p);
      await new Promise((r) => setTimeout(r, 0));
      fn();
    };
    await step('planning', () => this.plan(), 0.02);
    await step('terrain', () => this.buildTerrain(), 0.10);
    await step('shelter', () => this.buildShelter(this.builder), 0.18);
    await step('buildings', () => this.materializeBuildings(this.layout.buildings, null), 0.30);
    await step('props', () => this.materializeProps(), 0.50);
    await step('vegetation', () => this.materializeVegetation(), 0.66);
    await step('camps', () => this.materializeCamps(), 0.74);
    await step('arenas', () => this.materializeArenas(), 0.84);
    await step('lighting', () => this.materializeLights(), 0.92);
    await step('finalize', () => this.finalize(), 0.98);
    onProgress('ready', 1);
    this.genMs = Date.now() - t0;
    return this;
  }

  buildTerrain() {
    this.terrain.build(this.scene);
    this.water = [];
    this.water.push(this.makeWater(0.62, -3.1, 'river'));
    this.water.push(this.makeWater(0.5, this.terrain.lake.level, 'lake'));
  }

  makeWater(opacity, level, kind) {
    const geo = new THREE.PlaneGeometry(1400, 1000, 1, 1);
    // murky, slow water: a full-map mirror at grazing angles turned the whole
    // horizon into a white sheet, so keep it rough and mostly diffuse
    const material = new THREE.MeshStandardMaterial({
      color: kind === 'lake' ? 0x24322b : 0x26333a,
      roughness: 0.34, metalness: 0.12, transparent: true, opacity: Math.min(0.92, opacity + 0.2),
      envMapIntensity: 0.25,
    });
    material.userData.texName = 'water';
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, level, 0);
    mesh.userData.water = { kind, level };
    mesh.renderOrder = 2;
    this.scene.add(mesh);
    return mesh;
  }

  materializeBuildings(list, regionHint) {
    for (const spec of list) {
      if (spec._built) continue;
      spec._built = true;
      const reg = regionAt(spec.x, spec.z);
      const b = new Building({
        styleName: spec.style, x: spec.x, z: spec.z, ry: spec.ry, seed: spec.seed,
        y: spec.y, w: spec.w, d: spec.d, floors: spec.floors, lootMul: spec.lootMul,
        lightMul: spec.lightMul, ruin: spec.ruin, noRoof: spec.noRoof,
      });
      b.build(this.builder, spec.y);
      spec.builtRooms = b.rooms;
      spec.entrance = b.entrance;
      spec.wFinal = b.w; spec.dFinal = b.d; spec.floorsFinal = b.floors;
      for (const lp of b.lootPoints) this.addLoot(lp.x, lp.y + 0.02, lp.z, lp.table, lp.kind);
      for (const d of b.doors) this.doorSpecs.push(d);
      for (const l of b.lightPoints) if (!l.dead) this.addLight(l.x, l.y, l.z, l.color, l.intensity, l.range, { flicker: l.flicker });
      this.statics.push({
        type: 'building', style: spec.style, x: spec.x, z: spec.z, y: spec.y,
        w: b.w, d: b.d, ry: b.ry, floors: b.floors, rooms: b.rooms.length,
        entrance: b.entrance, region: reg.id, name: spec.name || '',
      });
    }
  }

  materializeProps() {
    const B = this.builder;
    const rng = new RNG(this.seed + 1234);
    for (const v of this.layout.vehicles) {
      const y = this.terrain.heightAt(v.x, v.z);
      vehicle(B, v.x, y, v.z, v.ry, rng, v.type, { wrecked: !!v.wrecked });
    }
    for (const f of this.layout.fences) {
      const y = this.terrain.heightAt(f.x0, f.z0);
      Street.fence(B, f.x0, f.z0, f.x1, f.z1, y, f.h ?? 2.0, f.kind ?? 'chain');
    }
    for (const p of this.layout.props) {
      const y = p.y ?? this.terrain.heightAt(p.x, p.z);
      switch (p.kind) {
        case 'shed': {
          B.add(boxGeo(3.2, 2.3, 2.6), M.woodWeathered, p.x, y + 1.15, p.z, [0, p.ry, 0]);
          B.add(boxGeo(3.6, 0.16, 3.0), M.corrugated, p.x, y + 2.36, p.z, [0, p.ry, 0]);
          B.collideBox(p.x - 1.7, y, p.z - 1.4, p.x + 1.7, y + 2.4, p.z + 1.4, 'shed');
          this.addLoot(p.x + 1.2, y, p.z - 1.9, 'tool', 'toolbox');
          break;
        }
        case 'garden':
          for (let k = 0; k < 5; k++) B.add(boxGeo(0.55, 0.26, 3.4), M.dirt, p.x + k * 0.85, y + 0.13, p.z, [0, p.ry, 0]);
          break;
        case 'playset':
          B.add(boxGeo(0.12, 2.4, 0.12), M.rust, p.x - 1.2, y + 1.2, p.z);
          B.add(boxGeo(0.12, 2.4, 0.12), M.rust, p.x + 1.2, y + 1.2, p.z);
          B.add(boxGeo(2.6, 0.1, 0.1), M.rust, p.x, y + 2.35, p.z);
          B.add(boxGeo(0.7, 0.1, 0.3), M.rust, p.x, y + 1.0, p.z);
          break;
        case 'mailbox':
          B.add(cylGeo(0.05, 0.05, 1.1, 5), M.rust, p.x, y + 0.55, p.z);
          B.add(boxGeo(0.3, 0.25, 0.5), M.metalPaint, p.x, y + 1.2, p.z);
          break;
        case 'lamp': Street.lampPost(B, p.x, y, p.z, p.broken); break;
        case 'powerpole': Street.powerPole(B, p.x, y, p.z, p.ry); break;
        case 'jersey': Street.jersey(B, p.x, y, p.z, p.ry, p.len); break;
        case 'cone': Street.trafficCone(B, p.x, y, p.z); break;
        case 'pipes': Street.pipes(B, p.x, y, p.z, p.ry, p.len); break;
        case 'pipes_v': Street.pipesVertical(B, p.x, y, p.z, p.len); break;
        case 'watchtower': Street.watchtower(B, p.x, y, p.z, p.h); break;
        case 'radiotower': Street.radioTower(B, p.x, y, p.z, p.h, rng); break;
        case 'sandbags': Furniture.sandbagWall(B, p.x, y, p.z, p.ry, p.len); break;
        case 'trash':
          B.add(cylGeo(0.3, 0.26, 0.9, 10), M.rust, p.x, y + 0.45, p.z);
          B.add(cylGeo(0.33, 0.33, 0.05, 10), M.steel, p.x, y + 0.92, p.z);
          B.collideBox(p.x - 0.32, y, p.z - 0.32, p.x + 0.32, y + 0.9, p.z + 0.32, 'prop');
          break;
        case 'barrels':
          for (let k = 0; k < p.n; k++) Furniture.barrel(B, p.x + rng.range(-1.4, 1.4), y, p.z + rng.range(-1.4, 1.4), rng);
          break;
        case 'puddle': {
          const m = new THREE.Mesh(new THREE.CircleGeometry(p.r, 14),
            mat('radiation', { emissive: 0x66ff44, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }));
          m.rotation.x = -Math.PI / 2;
          m.position.set(p.x, y + 0.05, p.z);
          this.scene.add(m);
          this.hazards.push({ type: 'radiation', x: p.x, z: p.z, r: p.r, dps: 1.4 });
          break;
        }
        case 'tank':
          B.add(cylGeo(5, 5, 12, 18), M.steel, p.x, y + 6, p.z);
          B.add(cylGeo(5.2, 5.2, 0.4, 18), M.rust, p.x, y + 12, p.z);
          B.collideBox(p.x - 5, y, p.z - 5, p.x + 5, y + 12, p.z + 5, 'tank');
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2;
            B.add(cylGeo(0.3, 0.3, 3, 6), M.rust, p.x + Math.cos(a) * 4, y + 1.5, p.z + Math.sin(a) * 4);
          }
          break;
        case 'chimney':
          B.add(cylGeo(3.2, 5.0, 44, 16), M.brick, p.x, y + 22, p.z);
          B.add(cylGeo(3.6, 3.4, 2, 16), M.rust, p.x, y + 44, p.z);
          B.collideBox(p.x - 5, y, p.z - 5, p.x + 5, y + 44, p.z + 5, 'chimney');
          break;
        case 'cooling':
          B.add(cylGeo(14, 18, 34, 20, 4, true), M.concrete, p.x, y + 17, p.z);
          B.add(cylGeo(16, 18.6, 2.4, 20), M.concrete, p.x, y + 34, p.z);
          B.collideBox(p.x - 18, y, p.z - 18, p.x + 18, y + 34, p.z + 18, 'tower');
          this.addLoot(p.x + 20, y, p.z + 20, 'industrial', 'crate');
          break;
        case 'rails':
          for (let k = 0; k < 2; k++) B.add(boxGeo(0.12, 0.14, p.len), M.steel, p.x + k * 1.5, y + 0.1, p.z);
          for (let s = 0; s < p.len; s += 1.4) B.add(boxGeo(2.0, 0.1, 0.24), M.woodWeathered, p.x + 0.75, y + 0.02, p.z - p.len / 2 + s);
          break;
        case 'wagon':
          B.add(boxGeo(3.0, 2.6, 12), M.rust, p.x, y + 1.6, p.z, [0, p.ry, 0]);
          for (const s of [-1, 1]) for (const t of [-1, 1]) {
            B.add(cylGeo(0.5, 0.5, 0.3, 10), M.steel, p.x + t * 1.6, y + 0.5, p.z + s * 4, [0, 0, Math.PI / 2]);
          }
          B.collideBox(p.x - 1.6, y, p.z - 6, p.x + 1.6, y + 3, p.z + 6, 'wagon');
          break;
        case 'crater': {
          const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat('sand', { color: 0x9a8878 }));
          m.scale.y = 0.4;
          m.position.set(p.x, y - p.r * 0.4 + 0.05, p.z);
          m.receiveShadow = true;
          this.scene.add(m);
          break;
        }
        case 'monolith':
          B.add(boxGeo(rng.range(1.6, 3.6), p.h, rng.range(1.2, 2.8)), M.rock, p.x, y + p.h / 2, p.z,
            [rng.range(-0.06, 0.06), p.ry, rng.range(-0.06, 0.06)]);
          B.collideBox(p.x - 2, y, p.z - 2, p.x + 2, y + p.h, p.z + 2, 'monolith');
          break;
        case 'dig':
          for (let k = 0; k < 12; k++) {
            const a = rng.range(0, 6.28), r = rng.range(2, 11);
            B.add(boxGeo(1.2, 0.8, 1.0), M.rust, p.x + Math.cos(a) * r, y + 0.4, p.z + Math.sin(a) * r, [0, a, 0]);
          }
          B.add(boxGeo(9, 0.3, 9), M.gravel, p.x, y + 0.05, p.z, [0, 0, 0]);
          B.add(boxGeo(8, 0.6, 8), M.dirt, p.x, y - 0.1, p.z);
          this.addLoot(p.x + 4, y, p.z + 4, 'rare', 'stash');
          this.addLoot(p.x - 3, y, p.z - 3, 'warden', 'toolbox');
          break;
        case 'array': this.buildSignalArray(p.x, p.z); break;
      }
    }
    for (const d of this.layout.debris) {
      const y = d.y ?? this.terrain.heightAt(d.x, d.z);
      switch (d.kind) {
        case 'rubble': Street.rubblePile(B, d.x, y, d.z, rng, rng.range(0.8, 2.4)); break;
        case 'tire':
          B.add(cylGeo(0.34, 0.34, 0.2, 12), plain(0x1c1c1a, { roughness: 0.95 }), d.x, y + 0.1, d.z, [Math.PI / 2, 0, d.ry]);
          break;
        case 'plank':
          B.add(boxGeo(0.22, 0.05, 1.8), M.woodWeathered, d.x, y + 0.03, d.z, [0, d.ry, 0]);
          B.collideBox(d.x - 0.4, y, d.z - 0.9, d.x + 0.4, y + 0.06, d.z + 0.9, 'debris');
          break;
        case 'log':
          B.add(cylGeo(0.26 * (d.s || 1), 0.3 * (d.s || 1), 2.6 * (d.s || 1), 8), M.bark, d.x, y + 0.28, d.z, [0, d.ry, Math.PI / 2]);
          B.collideBox(d.x - 1.3 * (d.s || 1), y, d.z - 0.3, d.x + 1.3 * (d.s || 1), y + 0.55, d.z + 0.3, 'log');
          break;
        case 'wire': Street.barbedWire(B, d.x, d.z, d.x + 12 * (d.ry ? 1 : 0), d.z + 12 * (d.ry ? 0 : 1), y); break;
        case 'line': B.add(boxGeo(0.16, 0.02, 2.1), plain(0xb8b090, { roughness: 0.9 }), d.x, y, d.z, [0, d.ry, 0]); break;
      }
    }
    for (const n of this.layout.nests) this.buildNest(n);
    for (const c of this.layout.caches) {
      const b = c.building;
      const top = b.y + (b.floorsFinal || 3) * 3.0 + 0.6;
      this.addLoot(c.x, top, c.z, 'rare', 'stash');
    }
  }

  materializeVegetation() {
    if (!this.treeGeos) this.treeGeos = buildTreeGeometries();
    const groups = this.treeGeos.map(() => []);
    for (const t of this.layout.trees) {
      groups[clamp(t.kind, 0, groups.length - 1)].push(t);
      if (!t.noCollide) this.trees.push({ x: t.x, y: t.y, z: t.z, r: 0.42 * t.s, h: this.treeGeos[t.kind].height * t.s });
    }
    for (let i = 0; i < this.treeGeos.length; i++) {
      const inst = groups[i];
      if (!inst.length) continue;
      const geo = this.treeGeos[i];
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const sc = new THREE.Vector3();
      const pv = new THREE.Vector3();
      const trunk = new THREE.InstancedMesh(geo.trunk, M.bark, inst.length);
      trunk.castShadow = true; trunk.receiveShadow = true;
      for (let k = 0; k < inst.length; k++) {
        const it = inst[k];
        pv.set(it.x, it.y, it.z);
        q.setFromEuler(new THREE.Euler(0, it.ry, 0));
        sc.set(it.s, it.s * (0.9 + ((k * 37) % 13) / 40), it.s);
        m.compose(pv, q, sc);
        trunk.setMatrixAt(k, m);
      }
      trunk.instanceMatrix.needsUpdate = true;
      trunk.frustumCulled = false;
      this.scene.add(trunk);
      if (geo.foliage) {
        const fol = new THREE.InstancedMesh(geo.foliage, M.leaves, inst.length);
        fol.castShadow = false; fol.receiveShadow = false;
        const col = new THREE.Color();
        for (let k = 0; k < inst.length; k++) {
          const it = inst[k];
          pv.set(it.x, it.y, it.z);
          q.setFromEuler(new THREE.Euler(0, it.ry, 0));
          sc.set(it.s, it.s * (0.9 + ((k * 53) % 17) / 50), it.s);
          m.compose(pv, q, sc);
          fol.setMatrixAt(k, m);
          const tint = 0.72 + ((k * 29) % 31) / 62;
          col.setRGB(tint * 0.95, tint * 1.02, tint * 0.78);
          fol.setColorAt(k, col);
        }
        fol.instanceMatrix.needsUpdate = true;
        if (fol.instanceColor) fol.instanceColor.needsUpdate = true;
        fol.frustumCulled = false;
        this.scene.add(fol);
      }
    }
    // dead trees
    if (this.layout.deadTrees.length) {
      const geo = this.treeGeos[5];
      const inst = this.layout.deadTrees;
      const mesh = new THREE.InstancedMesh(geo.trunk, M.bark, inst.length);
      mesh.castShadow = true;
      const m = new THREE.Matrix4();
      inst.forEach((it, k) => {
        m.compose(new THREE.Vector3(it.x, it.y, it.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, it.ry, 0)), new THREE.Vector3(it.s, it.s, it.s));
        mesh.setMatrixAt(k, m);
        this.trees.push({ x: it.x, y: it.y, z: it.z, r: 0.3 * it.s, h: 6 * it.s });
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
    // grass & undergrowth
    if (this.layout.grass.length) {
      const clump = buildGrassClumpGeometry();
      const mesh = new THREE.InstancedMesh(clump, M.grassCard, this.layout.grass.length);
      mesh.castShadow = false; mesh.receiveShadow = true;
      const m = new THREE.Matrix4();
      const col = new THREE.Color();
      this.layout.grass.forEach((g, k) => {
        const y = this.terrain.heightAt(g.x, g.z);
        const s = g.s;
        m.compose(new THREE.Vector3(g.x, y, g.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (k * 2.399) % 6.283, 0)), new THREE.Vector3(s * (g.bush ? 1.6 : 1), s * (g.bush ? 1.4 : 0.9), s * (g.bush ? 1.6 : 1)));
        mesh.setMatrixAt(k, m);
        const t = 0.62 + ((k * 17) % 37) / 60;
        col.setRGB(t * 0.85, t * 0.92, t * 0.62);
        mesh.setColorAt(k, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.grassMesh = mesh;
    }
    // rocks
    if (this.layout.rocks.length) {
      const geos = [rockGeo(11, 1), rockGeo(22, 0), rockGeo(33, 1)];
      const buckets = [[], [], []];
      this.layout.rocks.forEach((r, i) => buckets[i % 3].push(r));
      buckets.forEach((bucket, bi) => {
        if (!bucket.length) return;
        const mesh = new THREE.InstancedMesh(geos[bi], M.rock, bucket.length);
        mesh.castShadow = true; mesh.receiveShadow = true;
        const m = new THREE.Matrix4();
        bucket.forEach((r, k) => {
          m.compose(new THREE.Vector3(r.x, r.y + r.s * 0.25, r.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r.seed % 6.28, 0)),
            new THREE.Vector3(r.s, r.s * 0.75, r.s * 1.1));
          mesh.setMatrixAt(k, m);
          if (r.s > 0.9) this.colliders.addBox(r.x - r.s * 0.8, r.y, r.z - r.s * 0.9, r.x + r.s * 0.8, r.y + r.s * 0.8, r.z + r.s * 0.9, 'rock');
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        this.scene.add(mesh);
      });
    }
  }

  materializeCamps() {
    const rng = new RNG(this.seed + 55);
    for (const c of this.layout.camps) {
      const B = this.builder;
      const { x, z, y, size } = c;
      // perimeter of jersey barriers with a gap for the approach
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        if (i === 3) continue;
        Street.jersey(B, x + Math.cos(a) * size * 1.9, y, z + Math.sin(a) * size * 1.9, -a, 1.5);
      }
      Furniture.fireplace(B, x, y, z);
      // firewood, cooking tripod, pot
      for (let i = 0; i < 4; i++) {
        const a = rng.range(0, 6.28), r = rng.range(0.9, 1.5);
        B.add(cylGeo(0.09, 0.08, 0.7, 6), M.woodWeathered,
          x + Math.cos(a) * r, y + 0.1, z + Math.sin(a) * r, [Math.PI / 2, a, 0]);
      }
      for (const s of [-1, 1]) {
        B.add(cylGeo(0.02, 0.02, 1.6, 5), M.rust, x + s * 0.34, y + 0.8, z, [0.18 * s, 0, 0.18 * s]);
      }
      B.add(cylGeo(0.22, 0.17, 0.28, 10), M.steel, x, y + 0.72, z);
      // two ridge tents with sloped roof panels, open flaps and bedrolls
      for (let i = 0; i < 2; i++) {
        const a = (i / 2) * Math.PI + rng.range(-0.35, 0.35);
        const tx = x + Math.cos(a + 1.57) * size * 1.15;
        const tz = z + Math.sin(a + 1.57) * size * 1.15;
        const ty = this.terrain.heightAt(tx, tz);
        const ry = a;
        // groundsheet
        B.add(boxGeo(3.1, 0.05, 2.5), M.fabric, tx, ty + 0.03, tz, [0, ry, 0]);
        // two roof panels
        for (const s of [-1, 1]) {
          B.add(boxGeo(3.2, 0.07, 1.42), M.fabric,
            tx + Math.cos(ry) * s * 0.62, ty + 1.05, tz - Math.sin(ry) * s * 0.62,
            [0, ry, s * 0.62]);
        }
        // back wall and ridge pole
        B.add(boxGeo(0.1, 1.55, 2.1), M.fabric, tx + Math.cos(ry) * 1.52, ty + 0.8, tz - Math.sin(ry) * 1.52, [0, ry, 0]);
        B.add(cylGeo(0.035, 0.035, 3.3, 6), M.woodWeathered, tx, ty + 1.5, tz, [0, ry, Math.PI / 2]);
        // rolled entrance flap
        B.add(cylGeo(0.14, 0.14, 2.1, 8), M.fabric,
          tx - Math.cos(ry) * 1.5, ty + 1.35, tz + Math.sin(ry) * 1.5, [Math.PI / 2, ry, 0]);
        B.collideBox(tx - 1.6, ty, tz - 1.3, tx + 1.6, ty + 1.55, tz + 1.3, 'tent');
        // bedroll inside
        B.add(boxGeo(0.8, 0.12, 1.8), M.fabric, tx, ty + 0.12, tz, [0, ry + 1.57, 0]);
      }
      // crates, barrels and a table under a lean-to tarp
      Furniture.crate(B, x + size * 1.45, y, z - size * 0.5, rng.range(0, 3));
      Furniture.crate(B, x + size * 1.5, y + 0.62, z - size * 0.4, rng.range(0, 3), 0.75);
      Furniture.crate(B, x - size * 1.1, y, z + size * 1.2, rng.range(0, 3), 0.9);
      Furniture.barrel(B, x + size * 0.2, y, z - size * 1.5, rng);
      Furniture.barrel(B, x - size * 1.6, y, z - size * 1.2, rng);
      Furniture.table(B, x - size * 0.6, y, z - size * 1.15, 0.4, rng);
      Furniture.chair(B, x - size * 0.15, y, z - size * 0.85, -1.0);
      Furniture.chair(B, x - size * 1.2, y, z - size * 1.5, 2.2);
      // lean-to: four poles and a sagging tarp
      const lx = x - size * 1.7, lz = z - size * 1.0, ly = this.terrain.heightAt(lx, lz);
      for (const [ox, oz, h] of [[-1.2, -1.1, 2.5], [1.2, -1.1, 2.5], [-1.2, 1.1, 1.7], [1.2, 1.1, 1.7]]) {
        B.add(cylGeo(0.05, 0.05, h, 6), M.woodWeathered, lx + ox, ly + h / 2, lz + oz);
      }
      B.add(boxGeo(2.8, 0.06, 2.6), M.fabric, lx, ly + 2.05, lz, [0.3, 0.15, 0]);
      // sandbags facing the road
      Furniture.sandbagWall(B, x + size * 2.3, y, z + size * 0.4, Math.PI / 2, 2.6);
      Furniture.sandbagWall(B, x + size * 2.3, y, z - size * 1.2, Math.PI / 2, 1.8);
      // a generator and a radio on the crate
      Furniture.machine(B, x + size * 1.35, y, z + size * 0.3, 0.2, 1.2, 0.9, 0.7);
      B.add(boxGeo(0.34, 0.24, 0.22), M.metalPaint, x + size * 1.35, y + 1.0, z - size * 0.55, [0, 0.5, 0]);
      B.add(cylGeo(0.01, 0.01, 0.6, 4), M.steel, x + size * 1.35, y + 1.4, z - size * 0.55);
      // cans, rags and a lantern
      for (let i = 0; i < 5; i++) {
        B.add(cylGeo(0.035, 0.035, 0.11, 6), M.steel,
          x - size * 0.6 + rng.range(-0.5, 0.5), y + 0.66, z - size * 1.15 + rng.range(-0.3, 0.3));
      }
      B.add(boxGeo(0.5, 0.03, 0.4), M.fabric, x - size * 0.05, y + 0.66, z - size * 1.3, [0, rng.range(0, 3), 0]);
      this.addLoot(x + size * 1.4, y, z + size * 0.4, 'house', 'stash');
      this.addLoot(x - size * 0.6, y + 0.66, z - size * 1.1, 'store', 'crate');
      this.addLoot(x - size * 1.5, y, z + size * 1.1, 'tool', 'bag');
      this.addLight(x, y + 0.8, z, 0xff8a3a, 9, 14, { fire: true, flicker: true });
      this.addLight(x + size * 1.3, y + 1.4, z - size * 0.5, 0xffc070, 2.2, 7, { flicker: false });
    }
  }

  materializeArenas() {
    const B = this.builder;
    const rng = new RNG(this.seed + 707);
    // 1. church
    {
      const { x, y, z } = this.arenas.hollow_church;
      B.add(boxGeo(14, 1.0, 22), M.floor, x, y - 0.5, z);
      B.collideBox(x - 7, y - 1, z - 11, x + 7, y, z + 11, 'floor');
      for (const s of [-1, 1]) {
        B.add(boxGeo(0.8, 8, 22), M.brick, x + s * 7, y + 4, z);
        B.collideBox(x + s * 7 - 0.4, y, z - 11, x + s * 7 + 0.4, y + 8, z + 11, 'wall');
        // window openings
        for (let k = 0; k < 4; k++) B.add(boxGeo(0.9, 2.4, 1.0), plain(0x30281f, { roughness: 0.4 }), x + s * 7, y + 4.6, z - 7 + k * 4.6);
      }
      B.add(boxGeo(14, 8, 0.8), M.brick, x, y + 4, z - 11);
      B.collideBox(x - 7, y, z - 11.4, x + 7, y + 8, z - 10.6, 'wall');
      B.add(boxGeo(14, 1.2, 14), M.brick, x, y + 8.4, z);
      B.add(boxGeo(10, 0.6, 4), M.concrete, x, y + 0.3, z - 8);
      B.add(boxGeo(1.2, 3.2, 1.2), M.wood, x, y + 1.9, z - 9.5);
      for (let i = 0; i < 9; i++) {
        const pz = z - 4 + i * 1.9;
        for (const s of [-1, 1]) {
          if (rng.chance(0.25)) continue;
          B.add(boxGeo(2.6, 0.12, 0.5), M.wood, x + s * 3.4, y + 0.55, pz);
          B.add(boxGeo(2.6, 0.7, 0.1), M.wood, x + s * 3.4, y + 0.9, pz - 0.22);
        }
      }
      for (let i = 0; i < 30; i++) {
        const a = rng.range(0, 6.28), r = rng.range(0, 8);
        B.add(sphereGeo(rng.range(0.1, 0.2), 5), M.paper, x + Math.cos(a) * r, y + 0.14, z - 6 + Math.sin(a) * r * 0.6);
      }
      this.addLight(x, y + 6, z, 0xff7040, 13, 24, { flicker: true });
      this.addLoot(x + 4, y, z - 9, 'rare', 'stash');
    }
    // 2. foundry pit
    {
      const { x, y, z } = this.arenas.foundry_pit;
      B.add(cylGeo(18, 18, 1.2, 24), M.concrete_floor, x, y - 0.6, z);
      B.collideBox(x - 18, y - 1.2, z - 18, x + 18, y, z + 18, 'floor');
      for (let i = 0; i < 18; i++) {
        if (i % 6 === 0) continue;
        const a = (i / 18) * 6.28;
        B.add(boxGeo(6.4, 6, 1.2), M.corrugated, x + Math.cos(a) * 18.5, y + 3, z + Math.sin(a) * 18.5, [0, -a, 0]);
        B.collideBox(x + Math.cos(a) * 18.5 - 3.4, y, z + Math.sin(a) * 18.5 - 3.4, x + Math.cos(a) * 18.5 + 3.4, y + 6, z + Math.sin(a) * 18.5 + 3.4, 'wall');
      }
      B.add(boxGeo(6, 5, 3), M.steel, x, y + 2.5, z - 16);
      B.add(boxGeo(4, 3, 0.4), mat('radiation', { emissive: 0xff5510, emissiveIntensity: 1.6 }), x, y + 2.2, z - 14.6);
      for (let i = 0; i < 3; i++) B.add(boxGeo(30, 0.3, 2), M.steel, x, y + 4.5 + i * 1.2, z + 8 + i * 2.4);
      for (let i = 0; i < 8; i++) {
        const a = rng.range(0, 6.28), r = rng.range(4, 15);
        B.add(boxGeo(1.2, 0.8, 1.0), M.rust, x + Math.cos(a) * r, y + 0.4, z + Math.sin(a) * r, [0, a, 0]);
      }
      this.addLight(x, y + 5, z - 10, 0xff6a20, 18, 30, { flicker: true });
    }
    // 3. nest clearing
    {
      const { x, y, z } = this.arenas.nest_clearing;
      B.add(cylGeo(16, 16, 0.4, 20), M.dirt, x, y, z);
      B.add(sphereGeo(6, 10), M.nest, x, y + 0.8, z, [0, 0, 0], { x: 1.6, y: 0.5, z: 1.4 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.28;
        B.add(boxGeo(0.3, rng.range(3, 9), 0.3), M.nest, x + Math.cos(a) * 13, y + 4, z + Math.sin(a) * 13, [rng.range(-0.2, 0.2), a, rng.range(-0.2, 0.2)]);
      }
      for (let i = 0; i < 10; i++) {
        const a = rng.range(0, 6.28), r = rng.range(6, 16);
        B.add(new THREE.PlaneGeometry(rng.range(3, 7), rng.range(3, 6)),
          mat('nest', { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
          x + Math.cos(a) * r, y + rng.range(2, 8), z + Math.sin(a) * r, [rng.range(-0.4, 0.4), a, rng.range(-0.4, 0.4)]);
      }
      this.addLight(x, y + 6, z, 0x88aa66, 8, 20);
    }
    // 4. crater rim
    {
      const { x, y, z } = this.arenas.crater_rim;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.28;
        B.add(boxGeo(4, rng.range(2, 6), 1.6), M.rock, x + Math.cos(a) * 16, y + 1.5, z + Math.sin(a) * 16, [rng.range(-0.3, 0.3), a, rng.range(-0.3, 0.3)]);
      }
      this.addLight(x, y + 3, z, 0xff4020, 10, 26);
    }
    // 5. bunker gate
    {
      const { x, y, z } = this.arenas.bunker_gate;
      B.add(boxGeo(26, 1, 26), M.concrete, x, y - 0.5, z);
      B.collideBox(x - 13, y - 1, z - 13, x + 13, y, z + 13, 'pad');
      B.add(boxGeo(8, 6, 1.2), M.steel, x, y + 3, z - 12);
      B.add(boxGeo(8.4, 0.4, 1.5), M.hazard, x, y + 6.2, z - 12);
      for (let i = 0; i < 4; i++) B.add(boxGeo(0.2, 6, 1.2), M.rust, x - 3 + i * 2, y + 3, z - 12);
      B.add(boxGeo(8, 6, 1.2), M.steel, x, y + 3, z + 12);
      Furniture.sandbagWall(B, x - 8, y, z + 4, 0, 6);
      Furniture.sandbagWall(B, x + 8, y, z + 4, 0, 6);
      B.collideBox(x - 12, y, z - 12.6, x - 8, y + 6, z - 11.4, 'wall');
      B.collideBox(x + 8, y, z - 12.6, x + 12, y + 6, z - 11.4, 'wall');
      this.addLight(x, y + 6, z - 8, 0xff3020, 11, 22, { flicker: true });
    }
    // 6. signal array (props built in materializeProps)
    this.cave && this.buildCave(this.cave);
    this.subway && this.buildSubway(this.subway);
    this.overpass && this.buildOverpass(this.overpass);
  }

  buildSignalArray(x, z) {
    const y = this.terrain.heightAt(x, z);
    const B = this.builder;
    B.add(boxGeo(60, 0.6, 60), M.concrete, x, y - 0.2, z);
    B.collideBox(x - 30, y - 0.6, z - 30, x + 30, y, z + 30, 'pad');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = x + Math.cos(a) * 22, pz = z + Math.sin(a) * 22;
      B.add(cylGeo(0.4, 0.75, 22, 8), M.steel, px, y + 11, pz);
      B.add(boxGeo(3.4, 0.28, 0.28), M.steel, px, y + 22, pz, [0, a, 0]);
      B.add(boxGeo(2.4, 0.28, 0.28), M.steel, px, y + 19, pz, [0, a, 0]);
      B.collideBox(px - 0.8, y, pz - 0.8, px + 0.8, y + 22, pz + 0.8, 'pylon');
    }
    B.add(cylGeo(4, 5, 6, 12), M.concreteWet, x, y + 3, z);
    B.add(cylGeo(4.2, 4.2, 0.4, 12), M.steel, x, y + 6, z);
    B.add(cylGeo(1.2, 1.8, 8, 10), M.armor, x, y + 10, z);
    B.add(cylGeo(0.2, 0.5, 3, 8), mat('radiation', { emissive: 0x9a70ff, emissiveIntensity: 2.2 }), x, y + 15.5, z);
    B.collideBox(x - 5, y, z - 5, x + 5, y + 6, z + 5, 'core');
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.28 + 0.4;
      B.add(boxGeo(2.2, 1.0, 0.8), M.metalPaint, x + Math.cos(a) * 12, y + 0.5, z + Math.sin(a) * 12, [0, -a, 0]);
      B.add(boxGeo(1.2, 0.6, 0.06), mat('screen', { emissive: 0x88ffcc, emissiveIntensity: 1.4 }), x + Math.cos(a) * 11.7, y + 1.1, z + Math.sin(a) * 11.7, [0, -a, 0.3]);
    }
    this.addLight(x, y + 7, z, 0x9a70ff, 20, 40);
    this.addLoot(x + 6, y, z + 6, 'warden', 'stash');
  }

  buildCave(cave) {
    const { x, z, depth } = cave;
    const y = this.terrain.heightAt(x, z);
    const B = this.builder;
    B.add(rockGeo(77, 2), M.rock, x, y + 2.0, z - 2, [0, 0, 0], { x: 11, y: 6.5, z: 8 });
    for (let i = 0; i < depth; i += 3) {
      const cz = z + i;
      const cy = y - i * 0.17;
      for (const s of [-1, 1]) {
        B.add(boxGeo(0.7, 4.4, 3.1), M.rock, x + s * 3.1, cy + 2.2, cz);
        B.collideBox(x + s * 3.1 - 0.35, cy, cz - 1.55, x + s * 3.1 + 0.35, cy + 4.4, cz + 1.55, 'cave');
      }
      B.add(boxGeo(6.9, 0.5, 3.1), M.rock, x, cy - 0.25, cz);
      B.add(boxGeo(6.9, 0.5, 3.1), M.rock, x, cy + 4.4, cz);
      B.collideBox(x - 3.45, cy - 0.5, cz - 1.55, x + 3.45, cy, cz + 1.55, 'cave');
    }
    const cz = z + depth, cy = y - depth * 0.17;
    B.add(boxGeo(24, 0.6, 22), M.rock, x, cy - 0.3, cz);
    B.add(boxGeo(24, 0.6, 22), M.rock, x, cy + 7.2, cz);
    B.collideBox(x - 12, cy - 0.6, cz - 11, x + 12, cy, cz + 11, 'cave');
    for (const [ox, oz, w, d] of [[-12, 0, 0.8, 22], [12, 0, 0.8, 22], [0, -11, 24, 0.8], [0, 11, 24, 0.8]]) {
      B.add(boxGeo(w, 7.2, d), M.rock, x + ox, cy + 3.6, cz + oz);
      B.collideBox(x + ox - w / 2, cy, cz + oz - d / 2, x + ox + w / 2, cy + 7.2, cz + oz + d / 2, 'cave');
    }
    const rng = new RNG(Math.floor(x + z));
    for (let i = 0; i < 26; i++) {
      const mx = x + rng.range(-10, 10), mz = cz + rng.range(-9, 9);
      B.add(sphereGeo(rng.range(0.1, 0.32), 6), mat('radiation', { emissive: 0x66ff88, emissiveIntensity: 1.5 }), mx, cy + rng.range(0, 0.4), mz);
    }
    this.addLoot(x + 6, cy, cz + 6, 'rare', 'stash');
    this.addLoot(x - 6, cy, cz - 6, 'mutant', 'body');
    this.addLight(x, cy + 6, cz, 0x66ff99, 10, 20);
    this.addLight(x, cy + 3, cz + 6, 0x66ff99, 4, 9);
  }

  buildSubway(sub) {
    const { x, z } = sub;
    const y = this.terrain.heightAt(x, z);
    const B = this.builder;
    for (let i = 0; i < 12; i++) {
      const sy = y - i * 0.35;
      B.add(boxGeo(6, 0.36, 1.35), M.concrete, x, sy - 0.18, z + i * 1.3);
      B.collideBox(x - 3, sy - 0.36, z + i * 1.3 - 0.67, x + 3, sy, z + i * 1.3 + 0.67, 'stairs');
    }
    const py = y - 12 * 0.35;
    for (let i = 0; i < 4; i++) {
      const hz = z + 17 + i * 12;
      for (const sx of [-1, 1]) {
        B.add(boxGeo(1, 5, 12), M.tiles, x + sx * 7, py + 0.5, hz);
        B.collideBox(x + sx * 7 - 0.5, py - 2, hz - 6, x + sx * 7 + 0.5, py + 3, hz + 6, 'wall');
      }
      B.add(boxGeo(15, 0.5, 12), M.concrete, x, py - 2.2, hz);
      B.add(boxGeo(15, 0.5, 12), M.concrete, x, py + 3.4, hz);
      this.addLight(x + (i % 2 ? 3 : -3), py + 2.7, hz, 0x9ad0c0, 4.5, 10, { flicker: i % 2 === 0 });
      for (let k = 0; k < 3; k++) {
        B.add(cylGeo(0.08, 0.08, 0.5, 6), M.steel, x + (i % 2 ? 4 : -4), py + 2.9, hz - 3 + k * 3);
      }
    }
    B.add(boxGeo(1.2, 0.2, 48), M.steel, x + 5.5, py - 1.9, z + 36);
    this.addLoot(x - 4, py - 1.9, z + 20, 'military', 'body');
    this.addLoot(x + 3, py - 1.9, z + 40, 'house', 'crate');
    this.hazards.push({ type: 'dark', x, z: z + 36, r: 24 });
  }

  buildOverpass(ov) {
    const { x, z, len } = ov;
    const y = this.terrain.heightAt(x, z);
    const B = this.builder;
    B.add(boxGeo(len, 1.2, 11), M.concrete, x, y + 7.5, z);
    B.collideBox(x - len / 2, y + 7, z - 5.5, x + len / 2, y + 8.7, z + 5.5, 'bridge');
    for (let i = 0; i < 4; i++) {
      const px = x - len / 2 + 6 + i * (len / 3.2);
      for (const s of [-1, 1]) {
        B.add(boxGeo(2.2, 7, 2.2), M.concrete, px, y + 3.5, z + s * 3.6);
        B.collideBox(px - 1.1, y, z + s * 3.6 - 1.1, px + 1.1, y + 7, z + s * 3.6 + 1.1, 'pillar');
      }
    }
    for (const s of [-1, 1]) B.add(boxGeo(len, 1.0, 0.2), M.steel, x, y + 8.5, z + s * 5.4);
    const rng = new RNG(Math.floor(x + z));
    for (let i = 0; i < 8; i++) Street.rubblePile(B, x + rng.range(-len / 2, len / 2), y, z + rng.range(-7, 7), rng, rng.range(1, 3));
    // ramp up to the deck for traversal
    for (let i = 0; i < 14; i++) {
      const px = x + len / 2 + i * 1.3;
      const sy = y + 7.0 * (1 - i / 14);
      B.add(boxGeo(1.35, 0.4, 8), M.concrete, px, sy - 0.2, z);
      B.collideBox(px - 0.67, sy - 0.4, z - 4, px + 0.67, sy, z + 4, 'ramp');
    }
  }

  buildNest(n) {
    const B = this.builder;
    const { x, y, z, r } = n;
    B.add(sphereGeo(r, 8), M.nest, x, y + 0.6, z, [0, 0, 0], { x: 1.3, y: 0.6, z: 1.3 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28;
      B.add(boxGeo(0.22, r * 0.7, 0.22), M.nest, x + Math.cos(a) * r * 0.8, y + r * 0.3, z + Math.sin(a) * r * 0.8, [0.2, a, 0.2]);
    }
    this.addLoot(x, y + 0.6, z, 'mutant', 'body');
    this.hazards.push({ type: 'mutant', x, z, r: r + 2, dps: 0.5 });
  }

  materializeLights() {
    this.lights = [];
    for (const l of this.layout.lights) {
      const light = new THREE.PointLight(l.color, l.intensity, l.range, 2.0);
      light.position.set(l.x, l.y, l.z);
      light.userData.base = l.intensity;
      light.userData.flicker = l.flicker;
      light.userData.fire = l.fire;
      light.userData.phase = Math.random() * 10;
      this.scene.add(light);
      this.lights.push(light);
      this.lightPoints.push(l);
      if (l.fire) {
        // fire visual: emissive cards + cone
        const g = new THREE.Group();
        for (let i = 0; i < 5; i++) {
          const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9),
            mat('radiation', { emissive: 0xff7a22, emissiveIntensity: 2.6, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
          p.position.set(l.x + (Math.random() - 0.5) * 0.4, l.y + 0.3 + i * 0.08, l.z + (Math.random() - 0.5) * 0.4);
          p.rotation.y = i * 1.2;
          p.userData.fire = true;
          g.add(p);
        }
        this.scene.add(g);
        this.fireGroups = this.fireGroups || [];
        this.fireGroups.push(g);
      }
    }
  }

  finalize() {
    const info = this.builder.finalize();
    this.staticInfo = info;
    for (const c of this.builder.colliders) this.colliders.addBox(c.minX, c.minY, c.minZ, c.maxX, c.maxY, c.maxZ, c.tag);
    this.builder.colliders.length = 0;
    for (const t of this.trees) this.colliders.addBox(t.x - t.r, t.y, t.z - t.r, t.x + t.r, t.y + 3, t.z + t.r, 'tree');
    this.layout.loot.forEach((l) => this.lootSpots.push(l));
    // connect built loot to colliders
    for (const p of this.pois) p.discovered = false;
    // survey map: bake a real terrain/pavement/ruin bitmap once so the map
    // screen opens instantly and looks like a chart instead of an empty grid
    try { this.mapBitmap = this.buildMapBitmap(); } catch (e) { console.warn('map bitmap failed', e); this.mapBitmap = null; }
  }

  // ------------------------------------------------------------------
  // survey map bitmap (RGBA, drawn by ui/panels.js)
  buildMapBitmap() {
    const x0 = -700, x1 = 700, z0 = -545, z1 = 545;
    const W = 352, H = 272;
    const data = new Uint8ClampedArray(W * H * 4);
    const heights = new Float32Array(W * H);
    const t = this.terrain;
    for (let j = 0; j < H; j++) {
      const z = z0 + ((j + 0.5) / H) * (z1 - z0);
      for (let i = 0; i < W; i++) {
        const x = x0 + ((i + 0.5) / W) * (x1 - x0);
        heights[j * W + i] = t.heightAt(x, z);
      }
    }
    const regionTint = {
      suburbs: [70, 73, 56], forest: [48, 60, 44], industrial: [80, 73, 56],
      city: [66, 69, 67], military: [70, 73, 64], wasteland: [96, 71, 55],
    };
    const hash = (i, j) => {
      let h = (i * 374761393 + j * 668265263) ^ 0x5bf03635;
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) & 1023) / 1023 - 0.5;
    };
    for (let j = 0; j < H; j++) {
      const z = z0 + ((j + 0.5) / H) * (z1 - z0);
      for (let i = 0; i < W; i++) {
        const x = x0 + ((i + 0.5) / W) * (x1 - x0);
        const o = (j * W + i) * 4;
        const idx = j * W + i;
        const h = heights[idx];
        const hx = heights[idx + (i < W - 1 ? 1 : 0)] - heights[idx - (i > 0 ? 1 : 0)];
        const hz = heights[idx + (j < H - 1 ? W : 0)] - heights[idx - (j > 0 ? W : 0)];
        const slope = Math.hypot(hx, hz) / 8; // metres per metre
        const reg = regionAt(x, z);
        const tint = regionTint[reg.id] || [70, 74, 62];
        // rocky at steep gradients, paler on ridges
        const rock = Math.min(1, Math.max(0, (slope - 0.34) / 0.5));
        let r = tint[0] * (1 - rock) + 92 * rock;
        let g = tint[1] * (1 - rock) + 89 * rock;
        let b = tint[2] * (1 - rock) + 82 * rock;
        // hill shading: light from the north-west
        const shade = Math.max(0.55, Math.min(1.42, 1 - (hx * 0.85 + hz * 0.55) * 0.16));
        r *= shade; g *= shade; b *= shade;
        // contour lines every 8 m
        const c0 = Math.floor(h / 8), c1 = Math.floor((h + Math.abs(hx) + Math.abs(hz) * 0.5 + 0.001) / 8);
        if (c0 !== c1) { r *= 0.86; g *= 0.86; b *= 0.86; }
        // water: the river valley and the toxic lake sit below -2.5 m
        if (h < -2.45) {
          const depth = Math.min(1, (-2.45 - h) / 6);
          r = 62 - depth * 16; g = 92 - depth * 18; b = 98 - depth * 14;
        }
        // asphalt / gravel roads
        const rd = t.roadDist(x, z).d;
        if (rd < 13) {
          const k = rd < 7 ? 1 : (13 - rd) / 6;
          const tr = rd < 2.2 ? 122 : 100, tg = rd < 2.2 ? 118 : 97, tb = rd < 2.2 ? 104 : 88;
          r = r * (1 - k) + tr * k; g = g * (1 - k) + tg * k; b = b * (1 - k) + tb * k;
        }
        const n = hash(i, j) * 7;
        data[o] = r + n; data[o + 1] = g + n; data[o + 2] = b + n; data[o + 3] = 255;
      }
    }
    const px = (v, a0, a1, lo, hi) => ((v - a0) / (a1 - a0)) * (hi - lo) + lo;
    const fillRotRect = (cx, cz, w, d, ry, col, alpha) => {
      const ca = Math.cos(ry), sa = Math.sin(ry);
      const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [
        px(cx + lx * ca + lz * sa, x0, x1, 0, W), px(cz - lx * sa + lz * ca, z0, z1, 0, H),
      ]);
      const minX = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[0]))));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(...corners.map((c) => c[0]))));
      const minZ = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[1]))));
      const maxZ = Math.min(H - 1, Math.ceil(Math.max(...corners.map((c) => c[1]))));
      for (let j = minZ; j <= maxZ; j++) {
        for (let i = minX; i <= maxX; i++) {
          // point in rotated rect
          const dx = i + 0.5 - px(cx, x0, x1, 0, W), dz = j + 0.5 - px(cz, z0, z1, 0, H);
          const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
          if (Math.abs(lx) > w / 2 / ((x1 - x0) / W) || Math.abs(lz) > d / 2 / ((z1 - z0) / H)) continue;
          const o = (j * W + i) * 4;
          data[o] = data[o] * (1 - alpha) + col[0] * alpha;
          data[o + 1] = data[o + 1] * (1 - alpha) + col[1] * alpha;
          data[o + 2] = data[o + 2] * (1 - alpha) + col[2] * alpha;
        }
      }
    };
    // ruins / buildings as solid survey blocks
    for (const s of this.statics) {
      if (s.type !== 'building') continue;
      fillRotRect(s.x, s.z, s.w + 1.2, s.d + 1.2, s.ry, [38, 36, 32], 0.55);
      fillRotRect(s.x, s.z, s.w, s.d, s.ry, [146, 138, 118], 0.5);
    }
    // camps as cleared rings
    for (const c of this.layout.camps) {
      const cx = px(c.x, x0, x1, 0, W), cz = px(c.z, z0, z1, 0, H);
      const rr = Math.max(3, (c.size * 2.4) / ((x1 - x0) / W));
      for (let j = Math.floor(cz - rr); j <= Math.ceil(cz + rr); j++) {
        for (let i = Math.floor(cx - rr); i <= Math.ceil(cx + rr); i++) {
          if (i < 0 || j < 0 || i >= W || j >= H) continue;
          const d = Math.hypot(i - cx, j - cz);
          if (d > rr || d < rr - 1.1) continue;
          const o = (j * W + i) * 4;
          data[o] = data[o] * 0.55 + 176 * 0.45;
          data[o + 1] = data[o + 1] * 0.55 + 148 * 0.45;
          data[o + 2] = data[o + 2] * 0.55 + 84 * 0.45;
        }
      }
    }
    return { w: W, h: H, data, x0, x1, z0, z1 };
  }

  // ------------------------------------------------------------------
  update(dt, playerPos) {
    this.time += dt;
    const t = this.time;
    if (this.lights) {
      for (const l of this.lights) {
        const base = l.userData.base;
        if (l.userData.fire) {
          l.intensity = base * (0.72 + Math.sin(t * 11 + l.userData.phase) * 0.12 + Math.sin(t * 23.3 + l.userData.phase * 2) * 0.09 + Math.random() * 0.06);
        } else if (l.userData.flicker) {
          const n = Math.sin(t * 7.3 + l.userData.phase) * Math.sin(t * 3.1 + l.userData.phase * 1.7);
          l.intensity = base * (n > 0.35 ? 0.25 : 1.0) * (0.9 + Math.random() * 0.1);
        }
      }
    }
    if (this.water) {
      for (const w of this.water) {
        if (w.material) {
          w.material.roughness = 0.32 + Math.sin(t * 0.7) * 0.03;
        }
      }
    }
  }

  heightAt(x, z) { return this.terrain.heightAt(x, z); }
  normalAt(x, z) { return this.terrain.normalAt(x, z); }
  surfaceAt(x, z) { return this.terrain.weightsAt(x, z).type; }
  regionAt(x, z) { return regionAt(x, z); }
  isIndoor(x, y, z) {
    for (const s of this.statics) {
      if (s.type !== 'building') continue;
      if (Math.abs(x - s.x) > s.w * 0.6 + 2 || Math.abs(z - s.z) > s.d * 0.6 + 2) continue;
      if (y > s.y && y < s.y + s.floors * 3.4 + 0.4) return true;
    }
    return false;
  }
}

function regionName(region) {
  let h = 7;
  for (const ch of region.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Grass clump: 3 crossed alpha cards
function buildGrassClumpGeometry() {
  const geos = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.PlaneGeometry(1.0, 0.62);
    p.rotateY((i / 3) * Math.PI);
    p.translate(0, 0.31, 0);
    geos.push(p);
  }
  const { mergeGeometries } = { mergeGeometries: mergeGeometriesImport };
  const merged = mergeGeometriesImport(geos.map((g) => g.toNonIndexed()), false);
  return merged;
}
import { mergeGeometries as mergeGeometriesImport } from 'three/addons/utils/BufferGeometryUtils.js';
