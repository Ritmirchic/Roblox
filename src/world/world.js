/**
 * World assembly: generation context, interactive entities (doors, loot,
 * pickups, NPCs), hazards, lighting budget, spawn director and surface queries.
 */
import * as THREE from 'three';
import { MeshBuilder, roomShell, flatRoof } from '../engine/geom.js';
import { Terrain, REGIONS as TERRAIN_REGIONS, regionWeightsAt, dominantRegionAt, WORLD_SIZE } from './terrain.js';
import { CollisionWorld } from '../engine/collision.js';
import { MeshBuilder as MB } from '../engine/geom.js';
import { makeRng, clamp, clamp01, TAU, lerp, rectDistance } from '../engine/util.js';
import { HUMAN_NPC_PALETTES, buildNpcRig } from './npc.js';
import { rollLoot } from '../data/loot.js';
import { itemDef } from '../data/items.js';
import { buildWeaponModel } from './weapons.js';
import { REGION_BUILDERS } from './regions.js';
import * as P from './props.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();

export class World {
  constructor(game) {
    this.game = game;
    this.textures = game.textures;
    this.terrain = new Terrain();
    this.collision = game.collision;
    this.collision.terrain = this.terrain;
    this.builder = new MeshBuilder(this.textures, this.collision, { seed: 2024 });
    this.rng = makeRng(2024);
    this.doors = [];
    this.lootables = [];
    this.pickups = [];
    this.npcs = [];
    this.lights = [];
    this.waterPools = [];
    this.hazardPools = [];
    this.nests = [];
    this.spawnZones = [];
    this.safeZones = [];
    this.bossArenas = [];
    this.locations = [];
    this.regions = [];
    this.occupied = [];
    this.lightPool = [];
    this.lightIndex = 0;
    this.lightUpdateTimer = 0;
    this.generationStats = { boxes: 0, buildings: 0, doors: 0, containers: 0, tris: 0 };
    this.interactRadius = 2.6;
    this.regionCache = new Map();
    this.props = P;
  }

  // ---- generation context API -------------------------------------------
  get groundY() {
    return (x, z) => this.terrain.heightAt(x, z);
  }

  addPad(x, z, w, d, y) {
    this.terrain.addPad(x, z, w, d, y);
    this.terrain._heightCache.clear();
  }

  roadDistance(x, z) {
    return this.terrain.roadInfo(x, z).dist;
  }

  occupy(x, z, w, d) {
    this.occupied.push({ x, z, w, d });
  }

  areaFree(x, z, w, d) {
    const rw = w / 2;
    const rd = d / 2;
    for (const o of this.occupied) {
      if (Math.abs(x - o.x) < rw + o.w / 2 && Math.abs(z - o.z) < rd + o.d / 2) return false;
    }
    return true;
  }

  addLight(x, y, z, color = 0xffc070, intensity = 10, distance = 12) {
    this.lights.push({ x, y, z, color, intensity, distance });
    if (this.builder) this.builder.glow(x, y + 0.02, z, 0.12, 0.06, 0.12, color, { intensity: 0.55 });
  }

  addDoor(spec) {
    this.doors.push(new Door(this, spec));
  }

  addLoot({ profile, x, y, z, type = 'crate', rot = 0, locked = false }) {
    // keep the population bounded, but never drop authored shelter/camp containers
    const essential = profile === 'camp' || type === 'bench' || type === 'locker' || type === 'safe' || locked;
    if (this.lootables.length > 420 && !essential) return;
    this.lootables.push(new Lootable(this, { profile, x, y, z, type, rot, locked }));
    this.generationStats.containers++;
  }

  addNpc({ x, y, z, name, role, facing }) {
    this.npcs.push(new Npc(this, { x, y, z, name, role, facing }));
  }

  addSafeZone(x, z, radius) {
    this.safeZones.push({ x, z, radius });
  }

  addSpawnZone(zone) {
    this.spawnZones.push(zone);
  }

  addBossArena({ boss, x, z, radius }) {
    this.bossArenas.push({ boss, x, z, radius });
  }

  registerRegion(id, x, z, radius) {
    this.regions[id] = { id, x, z, radius, name: TERRAIN_REGIONS[id]?.name || `Region ${id}` };
  }

  markLocation(info) {
    this.locations.push(info);
  }

  addWaterPool(x, z, rx, rz) {
    const y = this.terrain.heightAt(x, z) + 0.12;
    const geo = new THREE.CircleGeometry(1, 24);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3a36, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.82 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(rx, rz, 1);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.game.scene.add(mesh);
    this.waterPools.push({ x, z, rx, rz, y, mesh });
  }

  addHazardPool({ x, z, radius, kind }) {
    const y = this.terrain.heightAt(x, z) + 0.1;
    const color = kind === 'toxic' ? 0x5a7a20 : 0x6a7a10;
    const geo = new THREE.CircleGeometry(1, 20);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.25, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.setScalar(radius);
    mesh.position.set(x, y, z);
    this.game.scene.add(mesh);
    this.hazardPools.push({ x, z, radius, y, kind, mesh });
    this.addLight(x, y + 1.2, z, 0x8ac040, 8, 10);
    // rim rocks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      P.rock(this.builder, x + Math.cos(a) * radius * 1.05, z + Math.sin(a) * radius * 1.05, y - 0.2, 0.6);
    }
  }

  addCave({ x, z, radius, name }) {
    const b = this.builder;
    const gy = this.terrain.heightAt(x, z);
    this.terrain.addPad(x, z, radius * 3, radius * 3, gy);
    this.terrain._heightCache.clear();
    const rng = makeRng(Math.floor(x * 7 + z));
    // rock dome shell
    const ringR = radius;
    for (let ring = 0; ring < 4; ring++) {
      const rr = ringR * (1 - ring * 0.22);
      const yy = gy + 1.2 + ring * 1.6;
      const count = 16 - ring * 2;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + ring * 0.2;
        // skip the entrance gap (facing south)
        if (ring === 0 && Math.abs(((a + Math.PI / 2 + TAU) % TAU) - Math.PI) < 0.35) continue;
        const bx = x + Math.cos(a) * rr;
        const bz = z + Math.sin(a) * rr;
        b.blob(bx, yy, bz, 2.2 + rng() * 0.8, 1.9 + rng() * 0.8, 2.2 + rng() * 0.8, 'rock', { detail: 1, rand: 0.4, seed: ring * 31 + i, collide: ring === 0 });
      }
    }
    b.blob(x, gy + 6.8, z, ringR * 0.65, 1.6, ringR * 0.65, 'rock', { detail: 1, rand: 0.3, seed: 77 });
    // interior floor and light
    b.cylinder(x, gy + 0.2, z, ringR * 0.92, ringR * 0.92, 0.4, 'dirt', { seg: 20, tex: 3, collideTag: 'floor' });
    this.builder.glow(x, gy + 1.2, z, 0.1, 0.1, 0.1, 0x8ac080, { intensity: 0.5 });
    this.addLight(x, gy + 2.0, z, 0x6aa070, 6, 12);
    // bones and nest
    for (let i = 0; i < 6; i++) {
      const a = rng() * TAU;
      const rr = rng() * ringR * 0.6;
      P.corpse(b, x + Math.cos(a) * rr, z + Math.sin(a) * rr, gy, rng() * TAU);
    }
    this.addLoot({ profile: 'cave', x: x + 2, y: gy, z: z - 2, type: 'nest' });
    this.addLoot({ profile: 'cave', x: x - 3, y: gy, z: z + 1, type: 'nest' });
    this.markLocation({ type: 'cave', x, z, y: gy, name, icon: 'cave' });
  }

  addNest({ x, z, name }) {
    const b = this.builder;
    const gy = this.terrain.heightAt(x, z);
    const rng = makeRng(Math.floor(x + z));
    for (let i = 0; i < 7; i++) {
      const a = rng() * TAU;
      const rr = 1 + rng() * 3;
      b.blob(x + Math.cos(a) * rr, gy + 0.3, z + Math.sin(a) * rr, 0.8 + rng(), 0.5 + rng() * 0.6, 0.8 + rng(), 'radiation', { detail: 1, rand: 0.5, seed: i, tint: [0.7, 0.8, 0.5] });
    }
    for (let i = 0; i < 5; i++) {
      const a = rng() * TAU;
      const rr = 2 + rng() * 3;
      P.corpse(b, x + Math.cos(a) * rr, z + Math.sin(a) * rr, gy, rng() * TAU);
    }
    this.addLoot({ profile: 'cave', x, y: gy, z, type: 'nest' });
    this.addLight(x, gy + 1.0, z, 0x8ac050, 5, 8);
    this.nests.push({ x, z, y: gy, name });
    this.markLocation({ type: 'nest', x, z, y: gy, name: name || 'Mutant Nest', icon: 'nest' });
  }

  // ---- generation --------------------------------------------------------
  generate() {
    const t0 = performance.now();
    const ctx = this.makeContext();
    // master road network between regions
    this.terrain.roads = [];
    const C = TERRAIN_REGIONS.map((r) => r.center);
    this.terrain.addRoad([[-1400, -1400], C[0], [-700, -1050], C[1], [-240, -760], C[2], [280, -520], C[3], [520, 120], C[4], [900, 820], C[5], [1330, 1330]], 9);
    this.terrain.addRoad([C[0], [-900, -700], [-520, -360], C[3].map((v, i) => v + (i === 0 ? -260 : 260))], 7);
    this.terrain.prepare();
    for (const builderFn of REGION_BUILDERS) {
      const before = this.builder.buckets.size;
      builderFn(ctx);
    }
    // real asphalt road surfaces with markings along every road
    this.buildRoadSurfaces();
    // highway wrecks & checkpoints between regions
    this.buildHighwayClutter(ctx);
    const tGen = performance.now();
    this.generationStats.bucketCount = this.builder.buckets.size;
    this.generationStats.bucketKeys = [...this.builder.buckets.entries()].sort((a, b) => b[1].geos.length - a[1].geos.length).slice(0, 30).map(([k, v]) => `${k}:${v.geos.length}`);
    // merge geometry in chunks
    const { group, meshes } = this.builder.buildChunked(520);
    this.staticGroup = group;
    this.game.scene.add(group);
    for (const m of meshes) this.generationStats.tris += m.geometry.attributes.position.count / 3;
    this.generationStats.boxes = this.collision.boxes.length;
    this.generationStats.buildings = this.locations.filter((l) => ['house', 'apartment', 'hospital', 'police', 'supermarket', 'warehouse', 'factory', 'bunker', 'lab', 'subway', 'shop', 'outpost', 'cabin'].includes(l.type)).length;
    this.generationStats.doors = this.doors.length;
    this.generationStats.ms = Math.round(performance.now() - t0);
    this.generationStats.mergeMs = Math.round(performance.now() - tGen);
    // light pool
    this.lightPool = [];
    for (let i = 0; i < 12; i++) {
      const l = new THREE.PointLight(0xffc070, 0, 12, 2);
      l.visible = false;
      this.game.scene.add(l);
      this.lightPool.push(l);
    }
    // terrain mesh (last, once all pads are registered)
    this.terrain._heightCache.clear();
    this.game.scene.add(this.terrain.build(this.textures, { chunk: 240, subdiv: 16 }));
    return this;
  }

  makeContext() {
    return {
      builder: this.builder,
      textures: this.textures,
      terrain: this.terrain,
      collision: this.collision,
      groundY: (x, z) => this.terrain.heightAt(x, z),
      addPad: (x, z, w, d, y) => this.addPad(x, z, w, d, y),
      roadDistance: (x, z) => this.roadDistance(x, z),
      occupy: (x, z, w, d) => this.occupy(x, z, w, d),
      areaFree: (x, z, w, d) => this.areaFree(x, z, w, d),
      addLight: (...a) => this.addLight(...a),
      addDoor: (s) => this.addDoor(s),
      addLoot: (s) => this.addLoot(s),
      addNpc: (s) => this.addNpc(s),
      addSafeZone: (x, z, r) => this.addSafeZone(x, z, r),
      addSpawnZone: (z) => this.addSpawnZone(z),
      addBossArena: (z) => this.addBossArena(z),
      registerRegion: (id, x, z, r) => this.registerRegion(id, x, z, r),
      markLocation: (i) => this.markLocation(i),
      addWaterPool: (...a) => this.addWaterPool(...a),
      addHazardPool: (s) => this.addHazardPool(s),
      addCave: (s) => this.addCave(s),
      addNest: (s) => this.addNest(s),
      region: 0,
    };
  }

  /**
   * Lays asphalt, gravel shoulders and painted markings along every road
   * spline, following the flattened terrain height so roads read from the air
   * and underfoot instead of relying on the splat blend alone.
   */
  buildRoadSurfaces() {
    const b = this.builder;
    const terr = this.terrain;
    const rng = makeRng(4242);
    let quads = 0;
    for (const road of terr.roads) {
      const pts = road.points;
      const width = road.width;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const steps = Math.max(1, Math.ceil(len / 9));
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          const x0 = lerp(ax, bx, t0);
          const z0 = lerp(az, bz, t0);
          const x1 = lerp(ax, bx, t1);
          const z1 = lerp(az, bz, t1);
          const dx = x1 - x0;
          const dz = z1 - z0;
          const l = Math.hypot(dx, dz) || 1;
          const nx = -dz / l;
          const nz = dx / l;
          const hw = width / 2;
          const y = (x, z) => terr.heightAt(x, z) + 0.045;
          // asphalt
          b.quad(
            [x0 + nx * hw, y(x0 + nx * hw, z0 + nz * hw), z0 + nz * hw],
            [x1 + nx * hw, y(x1 + nx * hw, z1 + nz * hw), z1 + nz * hw],
            [x1 - nx * hw, y(x1 - nx * hw, z1 - nz * hw), z1 - nz * hw],
            [x0 - nx * hw, y(x0 - nx * hw, z0 - nz * hw), z0 - nz * hw],
            'asphalt', { uvScale: 6, tint: [0.92, 0.92, 0.94] },
          );
          // gravel shoulders
          for (const sign of [-1, 1]) {
            const o0 = sign * hw;
            const o1 = sign * (hw + 1.4);
            b.quad(
              [x0 + nx * o0, y(x0 + nx * o0, z0 + nz * o0), z0 + nz * o0],
              [x1 + nx * o0, y(x1 + nx * o0, z1 + nz * o0), z1 + nz * o0],
              [x1 + nx * o1, y(x1 + nx * o1, z1 + nz * o1), z1 + nz * o1],
              [x0 + nx * o1, y(x0 + nx * o1, z0 + nz * o1), z0 + nz * o1],
              'gravel', { uvScale: 3, tint: [0.86, 0.84, 0.8] },
            );
          }
          // painted markings every other segment
          if (s % 2 === 0) {
            const mw = 0.13;
            const fade = 0.55 + 0.45 * rng();
            for (const off of [-0.055, 0.055]) {
              const c0 = (off - mw / 2) * width;
              const c1 = (off + mw / 2) * width;
              b.quad(
                [x0 + nx * c0, y(x0 + nx * c0, z0 + nz * c0) + 0.012, z0 + nz * c0],
                [x1 + nx * c0, y(x1 + nx * c0, z1 + nz * c0) + 0.012, z1 + nz * c0],
                [x1 + nx * c1, y(x1 + nx * c1, z1 + nz * c1) + 0.012, z1 + nz * c1],
                [x0 + nx * c1, y(x0 + nx * c1, z0 + nz * c1) + 0.012, z0 + nz * c1],
                'hazard', { uvScale: 1.6, tint: [fade, fade * 0.98, fade * 0.9] },
              );
            }
          }
          quads++;
        }
      }
    }
    this.generationStats.roadQuads = quads;
    this.generationStats.roads = terr.roads.length;
  }

  buildHighwayClutter(ctx) {
    const rng = makeRng(777);
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      // sample the main highway
      const pts = this.terrain.roads[0].points;
      const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      const a = pts[seg];
      const b = pts[seg + 1];
      const f = (t * (pts.length - 1)) % 1;
      const x = lerp(a[0], b[0], f) + (rng() - 0.5) * 22;
      const z = lerp(a[1], b[1], f) + (rng() - 0.5) * 22;
      if (!this.areaFree(x, z, 7, 7)) continue;
      const y = this.terrain.heightAt(x, z);
      if (rng() < 0.35) P.truckWreck(this.builder, x, z, y, rng() * TAU);
      else if (rng() < 0.7) P.carWreck(this.builder, x, z, y, rng() * TAU);
      else P.jerseyBarrier(this.builder, x, z, y, rng() * TAU);
      if (rng() < 0.4) this.addLoot({ profile: 'car', x, y, z, type: 'car' });
    }
    // roadside emergency shelter
    const sx = -700;
    const sz = -640;
    if (this.areaFree(sx, sz, 16, 14)) {
      this.occupy(sx, sz, 16, 14);
      this.shelter(sx, sz);
    }
  }

  /** Reinforced safehouse/shelter used as a mid-game safe point. */
  shelter(x, z) {
    const b = this.builder;
    const gy = this.terrain.heightAt(x, z);
    this.addPad(x, z, 18, 16, gy);
    b.box(x, gy, z, 12, 0.35, 10, 'concrete', { tex: 3, collideTag: 'floor' });
    roomShell(b, { x, z, w: 12, d: 10, y0: gy + 0.35, h: 3.4, mat: 'concrete', thickness: 0.45, tex: 2.6, doors: [{ side: 'south', x: x - 3, w: 1.6, y0: gy + 0.35, y1: gy + 2.6 }] });
    b.box(x, gy + 3.85, z, 12.8, 0.4, 10.8, 'concrete', { tex: 3, collideTag: 'ceiling' });
    // interior: cot, workbench, stove, radio
    P.bed(b, x + 3, z - 2.4, gy + 0.35, Math.PI, 'fabric');
    P.workbench(b, x - 3, z - 3.4, gy + 0.35, 0);
    P.stove(b, x + 4, z + 2.4, gy + 0.35, Math.PI);
    P.table(b, x - 1, z + 1.8, gy + 0.35, 0, 1.8, 0.9);
    this.addLoot({ profile: 'camp', x: -3 + x, y: gy + 0.35, z: z - 3.4, type: 'bench' });
    this.addLoot({ profile: 'camp', x: x + 1, y: gy + 0.35, z: z - 3.6, type: 'locker' });
    // two ceiling lamps so the bunker reads as a lit room, not a black box
    this.addLight(x - 3.2, gy + 2.9, z + 0.6, 0xffc087, 26, 13);
    this.addLight(x + 3.2, gy + 2.9, z + 0.6, 0xffc087, 26, 13);
    b.glow(x - 3.2, gy + 3.0, z + 0.6, 0.34, 0.06, 0.34, 0xffc087, { intensity: 0.75 });
    b.glow(x + 3.2, gy + 3.0, z + 0.6, 0.34, 0.06, 0.34, 0xffc087, { intensity: 0.75 });
    this.addSafeZone(x, z, 12);
    this.markLocation({ type: 'shelter', x, z, y: gy, name: 'Roadside Shelter', icon: 'shelter' });
    this.game.radioPlaylist = (this.game.radioPlaylist || []).concat([{ x, y: gy + 1.0, z: z + 1.8, id: 'auto' }]);
  }

  // ---- queries -----------------------------------------------------------
  regionAt(x, z) {
    const key = `${Math.round(x / 20)}:${Math.round(z / 20)}`;
    let r = this.regionCache.get(key);
    if (r === undefined) {
      r = dominantRegionAt(x, z);
      this.regionCache.set(key, r);
      if (this.regionCache.size > 20000) this.regionCache.clear();
    }
    return r;
  }

  regionName(x, z) {
    return TERRAIN_REGIONS[this.regionAt(x, z)].name;
  }

  surfaceAt(point) {
    if (typeof point === 'number') return 'dirt';
    for (const wp of this.waterPools) {
      if (Math.abs(point.x - wp.x) < wp.rx && Math.abs(point.z - wp.z) < wp.rz && Math.abs(point.y - wp.y) < 1.2) return 'water';
    }
    const boxes = this.collision.grid.query(point.x - 0.2, point.z - 0.2, point.x + 0.2, point.z + 0.2, []);
    let best = null;
    for (const b of boxes) {
      if (point.y >= b.minY - 0.4 && point.y <= b.maxY + 0.4) {
        if (point.x >= b.minX - 0.3 && point.x <= b.maxX + 0.3 && point.z >= b.minZ - 0.3 && point.z <= b.maxZ + 0.3) {
          if (!best || b.maxY > best.maxY) best = b;
        }
      }
    }
    if (best) {
      const t = best.tag;
      if (t === 'floor' || t === 'ceiling' || t === 'world' || t === 'wall' || t === 'door') return 'concrete';
      return t || 'concrete';
    }
    const terr = this.terrain.heightAt(point.x, point.z);
    if (Math.abs(point.y - terr) < 0.6) {
      const region = this.regionAt(point.x, point.z);
      const slope = 1 - this.terrain.normalAt(point.x, point.z).y;
      const road = this.terrain.roadInfo(point.x, point.z);
      if (road.dist < road.width * 0.8) return 'concrete';
      if (region === 1) return slope > 0.5 ? 'dirt' : 'grass';
      if (region === 5) return slope > 0.5 ? 'dirt' : 'dirt';
      if (region === 3 || region === 2) return 'concrete';
      return slope > 0.55 ? 'dirt' : 'grass';
    }
    return 'dirt';
  }

  isSafeZone(x, z) {
    for (const s of this.safeZones) if (Math.hypot(x - s.x, z - s.z) < s.radius) return true;
    return false;
  }

  hazardAt(x, z) {
    let rad = 0;
    for (const h of this.hazardPools) {
      const d = Math.hypot(x - h.x, z - h.z);
      if (d < h.radius) rad = Math.max(rad, (1 - d / h.radius) * 1.2);
    }
    return rad;
  }

  // ---- interaction -------------------------------------------------------
  findInteractable(player) {
    const pos = player.position;
    const eye = player.eyePosition;
    const fwd = player.flatForward;
    let best = null;
    let bestScore = Infinity;
    const consider = (obj, ix, iy, iz, label, kind) => {
      const dx = ix - pos.x;
      const dz = iz - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > this.interactRadius + 0.7) return;
      if (Math.abs(iy - pos.y) > 2.4) return;
      const dot = dist > 0.001 ? (dx * fwd.x + dz * fwd.z) / dist : 1;
      if (dot < 0.2 && dist > 1.0) return;
      const score = dist - dot * 0.8;
      if (score < bestScore) {
        bestScore = score;
        best = { obj, kind, label, x: ix, y: iy, z: iz, distance: dist };
      }
    };
    for (const d of this.doors) {
      if (Math.abs(d.position.x - pos.x) > 4 || Math.abs(d.position.z - pos.z) > 4) continue;
      consider(d, d.position.x, d.position.y + 1.2, d.position.z, d.locked ? 'Locked door' : d.open ? 'Close door' : 'Open door', 'door');
    }
    for (const l of this.lootables) {
      if (l.searched) continue;
      if (Math.abs(l.x - pos.x) > 4 || Math.abs(l.z - pos.z) > 4) continue;
      consider(l, l.x, l.y + 0.7, l.z, l.label, 'loot');
    }
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (Math.abs(p.position.x - pos.x) > 4 || Math.abs(p.position.z - pos.z) > 4) continue;
      consider(p, p.position.x, p.position.y, p.position.z, p.label, 'pickup');
    }
    for (const n of this.npcs) {
      if (Math.abs(n.position.x - pos.x) > 4 || Math.abs(n.position.z - pos.z) > 4) continue;
      consider(n, n.position.x, n.position.y + 1.0, n.position.z, `Talk to ${n.name}`, 'npc');
    }
    for (const r of this.game.radioPlaylist || []) {
      if (Math.abs(r.x - pos.x) > 4 || Math.abs(r.z - pos.z) > 4) continue;
      consider(r, r.x, r.y, r.z, 'Listen to radio', 'radio');
    }
    return best;
  }

  interact(target) {
    if (!target) return false;
    if (target.kind === 'door') {
      target.obj.toggle();
      this.game.audio?.play(target.obj.open ? 'doorClose' : 'doorOpen', target.obj.position);
      return true;
    }
    if (target.kind === 'loot') {
      const l = target.obj;
      if (l.locked) {
        if ((this.game.inventory?.count('tool_lockpick') || 0) > 0) {
          l.locked = false;
          this.game.audio?.play('lockpick', new THREE.Vector3(l.x, l.y + 0.6, l.z));
          this.game.hud?.notify('Lock picked. The latch gives way.', 'item', 'LOCKPICK');
          this.game.hud?.showInteract('SEARCH', '');
        } else {
          this.game.hud?.notify('Locked. A lockpick set would open it.', 'warn', 'LOCKED');
          this.game.audio?.play('uiDeny');
          return false;
        }
      }
      l.search();
      return true;
    }
    if (target.kind === 'pickup') {
      target.obj.pickup();
      return true;
    }
    if (target.kind === 'npc') {
      this.game.startDialogue?.(target.obj);
      return true;
    }
    if (target.kind === 'radio') {
      this.game.radioInteract?.(target.obj);
      return true;
    }
    return false;
  }

  spawnPickup(itemId, qty, position, { durability = null, attachments = [], magazine = null } = {}) {
    const def = itemDef(itemId);
    if (!def) return null;
    const p = new Pickup(this, { id: itemId, qty, position, durability, attachments, magazine });
    this.pickups.push(p);
    return p;
  }

  // ---- update ------------------------------------------------------------
  update(dt) {
    const player = this.game.player;
    // doors
    for (const d of this.doors) d.update(dt);
    // loot highlight
    for (const l of this.lootables) l.update(dt, player);
    for (const p of this.pickups) p.update(dt);
    for (const n of this.npcs) n.update(dt, player);
    // water animation
    const t = performance.now() * 0.001;
    for (const w of this.waterPools) {
      w.mesh.material.opacity = 0.78 + Math.sin(t * 0.8 + w.x) * 0.05;
      w.mesh.position.y = w.y + Math.sin(t * 0.9 + w.z) * 0.02;
    }
    for (const h of this.hazardPools) {
      h.mesh.material.emissiveIntensity = 0.5 + Math.sin(t * 1.7 + h.x) * 0.15;
    }
    // light budget: assign the nearest light sources to the pool
    this.lightUpdateTimer -= dt;
    if (this.lightUpdateTimer <= 0) {
      this.lightUpdateTimer = 0.5;
      const px = player.position.x;
      const pz = player.position.z;
      const py = player.position.y;
      const sorted = this.lights
        .map((l) => ({ l, d: (l.x - px) ** 2 + (l.z - pz) ** 2 + (l.y - py) ** 2 * 0.3 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, this.lightPool.length);
      for (let i = 0; i < this.lightPool.length; i++) {
        const pl = this.lightPool[i];
        const s = sorted[i];
        if (!s || s.d > 60 * 60) {
          pl.visible = false;
          pl.intensity = 0;
          continue;
        }
        pl.visible = true;
        pl.position.set(s.l.x, s.l.y, s.l.z);
        pl.color.setHex(s.l.color);
        pl.distance = s.l.distance;
        pl.intensity = s.l.intensity * clamp(1.25 - Math.sqrt(s.d) / 55, 0.05, 1);
      }
    }
    // campfire embers near the player
    if (Math.random() < dt * 8) {
      for (const l of this.lights) {
        if (l.color === 0xff9040) {
          const d2 = (l.x - player.position.x) ** 2 + (l.z - player.position.z) ** 2;
          if (d2 < 500) {
            this.game.fx.groups.fire.spawn({ x: l.x + (Math.random() - 0.5) * 0.3, y: l.y - 0.5, z: l.z + (Math.random() - 0.5) * 0.3, vy: 1.2, life: 0.5, size: 0.14 });
            break;
          }
        }
      }
    }
    // region entry announcements + hazard radiation
    const region = this.regionAt(player.position.x, player.position.z);
    if (region !== this.lastRegion) {
      this.lastRegion = region;
      this.game.hud?.regionCard(TERRAIN_REGIONS[region].name);
    }
    const haz = this.hazardAt(player.position.x, player.position.z);
    if (haz > 0) this.game.survival?.addRadiation(haz * dt);
  }

  serialize() {
    return {
      doors: this.doors.map((d) => ({ id: d.id, open: d.open, locked: d.locked })),
      loot: this.lootables.filter((l) => l.serializable).map((l) => ({ id: l.id, searched: l.searched, items: l.items })),
      pickups: this.pickups.filter((p) => !p.taken).map((p) => ({ id: p.id, qty: p.qty, x: p.position.x, y: p.position.y, z: p.position.z })),
      safeZones: this.safeZones,
    };
  }

  deserialize(data) {
    if (!data) return;
    for (const d of data.doors || []) {
      const door = this.doors[d.id];
      if (door) {
        door.open = d.open;
        door.locked = d.locked;
        door.angle = d.open ? door.maxAngle : 0;
        door.panel.rotation.y = door.angle;
      }
    }
    for (const l of data.loot || []) {
      const obj = this.lootables[l.id];
      if (obj) {
        obj.searched = l.searched;
        obj.items = l.items || [];
        if (obj.searched) obj.setSearchedVisual();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Door
// ---------------------------------------------------------------------------
const DOOR_MATERIALS = {
  wood: { mat: 'wood', color: 0x6a533a },
  metal: { mat: 'metalPlate', color: 0x555a54 },
  glass: { mat: 'glass', color: 0x8aa2a8 },
};

export class Door {
  constructor(world, spec) {
    this.world = world;
    this.id = world.doors.length;
    this.position = new THREE.Vector3(spec.x, spec.y, spec.z);
    this.rot = spec.rot || 0;
    this.w = spec.w || 1.6;
    this.h = spec.h || 2.2;
    this.kind = spec.kind || 'wood';
    this.open = !!spec.open;
    this.locked = !!spec.locked;
    this.angle = this.open ? 1.5 : 0;
    this.maxAngle = 1.45;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rot;
    this.panel = new THREE.Group();
    this.group.add(this.panel);
    const cfg = DOOR_MATERIALS[this.kind] || DOOR_MATERIALS.wood;
    const panelW = this.w - 0.08;
    const mat = this.kind === 'glass'
      ? new THREE.MeshStandardMaterial({ color: 0x6a8288, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 })
      : new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8, metalness: this.kind === 'metal' ? 0.5 : 0.05 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(panelW, this.h - 0.05, 0.08), mat);
    mesh.position.set(panelW / 2, this.h / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.panel.add(mesh);
    // handle
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshStandardMaterial({ color: 0x9a8a60, metalness: 0.9, roughness: 0.3 }));
    handle.position.set(panelW - 0.12, 1.05, 0.07);
    this.panel.add(handle);
    this.panel.rotation.y = this.angle;
    world.game.scene.add(this.group);
    world.game.collision.addBox(
      this.position.x + Math.cos(this.rot) * (this.w / 2),
      this.position.y + this.h / 2,
      this.position.z - Math.sin(this.rot) * (this.w / 2),
      this.w, this.h, 0.16, this.rot, 'door',
    );
  }

  toggle() {
    if (this.locked) return false;
    this.open = !this.open;
    return true;
  }

  update(dt) {
    const target = this.open ? this.maxAngle : 0;
    this.angle += (target - this.angle) * Math.min(1, dt * 9);
    this.panel.rotation.y = this.angle;
  }
}

// ---------------------------------------------------------------------------
// Loot container
// ---------------------------------------------------------------------------
const LOOT_VISUALS = {
  crate: { w: 0.8, h: 0.7, d: 0.6, mat: 'wood', label: 'Search crate' },
  shelf: { w: 1.6, h: 1.8, d: 0.5, mat: 'metalPlate', label: 'Search shelf' },
  cabinet: { w: 1.0, h: 1.7, d: 0.55, mat: 'metalPlate', label: 'Search cabinet' },
  cupboard: { w: 1.0, h: 1.7, d: 0.55, mat: 'wood', label: 'Search cupboard' },
  locker: { w: 0.55, h: 1.85, d: 0.5, mat: 'metalPlate', label: 'Search locker' },
  drawer: { w: 0.7, h: 0.9, d: 0.5, mat: 'wood', label: 'Search drawer' },
  wardrobe: { w: 1.4, h: 2.0, d: 0.6, mat: 'wood', label: 'Search wardrobe' },
  safe: { w: 0.8, h: 0.8, d: 0.8, mat: 'metalPlate', label: 'Crack the safe' },
  ammo: { w: 0.6, h: 0.35, d: 0.35, mat: 'militaryMetal', label: 'Search ammo box' },
  toolbox: { w: 0.7, h: 0.4, d: 0.4, mat: 'metalPlate', label: 'Search toolbox' },
  nest: { w: 1.2, h: 0.6, d: 1.0, mat: 'radiation', label: 'Search nest' },
  corpse: { w: 0.6, h: 0.4, d: 1.4, mat: 'fabric', label: 'Search body' },
  car: { w: 1.6, h: 1.0, d: 3.5, mat: 'rust', label: 'Search vehicle' },
  bench: { w: 1.4, h: 0.9, d: 0.7, mat: 'wood', label: 'Search workbench' },
  kiosk: { w: 1.6, h: 1.0, d: 0.8, mat: 'wood', label: 'Search kiosk' },
  freezer: { w: 2.0, h: 1.4, d: 1.0, mat: 'metalPlate', label: 'Search freezer' },
  tray: { w: 0.8, h: 0.2, d: 0.5, mat: 'metalPlate', label: 'Search tray' },
  cache: { w: 1.0, h: 0.8, d: 0.8, mat: 'militaryMetal', label: 'Open cache' },
  lab: { w: 1.0, h: 0.4, d: 0.7, mat: 'labTile', label: 'Search lab table' },
};

export class Lootable {
  constructor(world, { profile, x, y, z, type = 'crate', rot = 0, locked = false }) {
    this.world = world;
    this.id = world.lootables.length;
    this.profile = profile;
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.rot = rot;
    this.searched = false;
    this.items = null;
    this.locked = locked;
    this.serializable = true;
    this.label = LOOT_VISUALS[type]?.label || 'Search';
    this.highlight = null;
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    this.group.rotation.y = rot;
    world.game.scene.add(this.group);
    this.buildVisual();
    this.region = world.regionAt(x, z);
    this.cooldown = 0;
  }

  buildVisual() {
    const cfg = LOOT_VISUALS[this.type] || LOOT_VISUALS.crate;
    const g = this.group;
    if (this.type === 'car') {
      // no extra visual (the wreck is already there)
      return;
    }
    const mat = world_material(this.world, cfg.mat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), mat);
    mesh.position.y = cfg.h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    this.lid = null;
    if (['crate', 'locker', 'cabinet', 'safe', 'ammo', 'toolbox', 'cache', 'cupboard', 'wardrobe'].includes(this.type)) {
      const lidMat = new THREE.MeshStandardMaterial({ color: this.type === 'safe' || this.type === 'ammo' || this.type === 'cache' ? 0x4a5248 : 0x5a4a34, roughness: 0.7, metalness: 0.2 });
      this.lid = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.94, 0.08, cfg.d * 0.94), lidMat);
      this.lid.position.set(0, cfg.h + 0.02, 0);
      this.lid.castShadow = true;
      g.add(this.lid);
    }
    // highlight ring
    const ringGeo = new THREE.RingGeometry(0.28, 0.34, 18);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd8c070, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false });
    this.highlight = new THREE.Mesh(ringGeo, ringMat);
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 0.06;
    g.add(this.highlight);
  }

  update(dt, player) {
    const dist = Math.hypot(player.position.x - this.x, player.position.z - this.z);
    // visibility budget: only nearby containers are drawn
    if (this.group) this.group.visible = dist < 60 && !(this.type === 'corpse' && this.searched);
    if (!this.highlight) return;
    const near = dist < 4 && !this.searched;
    const target = near ? 0.55 : 0;
    this.highlight.material.opacity += (target - this.highlight.material.opacity) * Math.min(1, dt * 8);
    if (this.lid && this.searched) {
      this.lid.rotation.x = Math.max(this.lid.rotation.x - dt * 2.4, -0.9);
      this.lid.position.y += (0.3 - this.lid.position.y) * dt * 0.5;
    }
  }

  search() {
    if (this.searched) return [];
    this.searched = true;
    const gameRng = this.world.game?.rng;
    const rng = typeof gameRng === 'function' ? gameRng : Math.random;
    const luck = this.world.game.progression?.luckBonus || 0;
    this.items = rollLoot(this.profile, () => rng(), { luck, region: this.region });
    this.setSearchedVisual();
    this.world.game.audio?.play('loot', new THREE.Vector3(this.x, this.y + 0.5, this.z));
    this.world.game.loot?.openContainer(this);
    this.world.game.quests?.onLoot?.(this.profile);
    return this.items;
  }

  setSearchedVisual() {
    if (this.lid) {
      this.lid.rotation.x = -0.9;
      this.lid.position.y = 0.3;
    }
    if (this.highlight) this.highlight.material.opacity = 0;
    if (this.group) {
      const g = this.group;
      if (this.type === 'corpse') g.visible = false;
    }
  }
}

function world_material(world, matName) {
  try {
    return world.textures.material(matName);
  } catch (e) {
    return new THREE.MeshStandardMaterial({ color: 0x6a6258 });
  }
}

// ---------------------------------------------------------------------------
// Pickup (dropped items)
// ---------------------------------------------------------------------------
export class Pickup {
  constructor(world, { id, qty, position, durability, attachments, magazine }) {
    this.world = world;
    this.id = id;
    this.qty = qty;
    this.durability = durability;
    this.attachments = attachments || [];
    this.magazine = magazine;
    this.position = position?.isVector3
      ? position.clone()
      : new THREE.Vector3(position?.x || 0, position?.y || 0, position?.z || 0);
    this.taken = false;
    this.itemId = id;
    this.label = `${itemDef(id)?.name || id} x${qty}`;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    world.game.scene.add(this.group);
    const def = itemDef(id);
    if (def?.type === 'weapon' && def.weapon) {
      const model = buildWeaponModel(def.weapon);
      model.scale.setScalar(0.8);
      model.rotation.z = Math.PI / 2;
      model.position.y = 0.16;
      this.group.add(model);
    } else {
      const color = def?.icon?.color || '#b8a060';
      const geo = new THREE.BoxGeometry(0.24, 0.16, 0.2);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.7, metalness: 0.2, emissive: new THREE.Color(color).multiplyScalar(0.25) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.12;
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 16), new THREE.MeshBasicMaterial({ color: 0xd8c070, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    this.group.add(ring);
    this.ring = ring;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.group.position.y = this.position.y + Math.sin(this.time * 2) * 0.04;
    this.group.rotation.y += dt * 0.8;
    if (this.ring) this.ring.material.opacity = 0.35 + Math.sin(this.time * 3) * 0.15;
  }

  pickup() {
    if (this.taken) return false;
    const inv = this.world.game.inventory;
    const ok = inv.add(this.id, this.qty);
    if (!ok) {
      this.world.game.hud?.notify('INVENTORY FULL', 'warn');
      return false;
    }
    // preserve durability/attachments for weapons
    if (this.durability !== null || (this.attachments && this.attachments.length)) {
      const added = inv.items.filter((i) => i.id === this.id).sort((a, b) => b.uid - a.uid)[0];
      if (added) {
        added.dur = this.durability;
        added.attachments = this.attachments;
        added.magazine = this.magazine;
      }
    }
    this.taken = true;
    this.world.game.scene.remove(this.group);
    this.world.game.audio?.play('pickup', this.position);
    this.world.game.hud?.notify(`Picked up ${itemDef(this.id)?.name || this.id}${this.qty > 1 ? ` x${this.qty}` : ''}`, 'item');
    this.world.game.quests?.onPickup?.(this.id);
    return true;
  }
}

// ---------------------------------------------------------------------------
// NPC (friendly survivor)
// ---------------------------------------------------------------------------
export class Npc {
  constructor(world, { x, y, z, name, role, facing }) {
    this.world = world;
    this.name = name;
    this.role = role;
    this.position = new THREE.Vector3(x, y, z);
    this.facing = facing ?? 0;
    this.state = 'idle';
    this.rig = buildNpcRig(role, name);
    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.facing;
    world.game.scene.add(this.rig.root);
    world.game.collision.addDynamicSphere({ x, y, z, radius: 0.35, alive: true, isNpc: true });
    this.talkedTo = false;
    this.dialogueIndex = 0;
  }

  update(dt, player) {
    const dist = this.position.distanceTo(player.position);
    if (dist < 14) {
      const ang = Math.atan2(-(player.position.x - this.position.x), -(player.position.z - this.position.z));
      let diff = ang - this.facing;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      this.facing += diff * Math.min(1, dt * 3);
      this.rig.root.rotation.y = this.facing;
    }
    this.rig.update?.(dt, { speed: 0, aim: 0, look: { x: 0, y: 0 } });
  }
}
