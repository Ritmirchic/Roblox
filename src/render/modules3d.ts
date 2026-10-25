/**
 * Procedural 3D models for every ship module.
 *
 * Each builder returns a THREE.Group containing real geometry (bevelled hull plates,
 * nozzles, turret rings, barrels, coils, dishes, reactor cores...) built from merged
 * primitives, textured with the procedural PBR sets from textures.ts.
 * Named child objects (`turret`, `barrel`, `nozzle`, `emitter`, `dish`) are used by the
 * gameplay layer for aiming, exhaust placement and beam origins.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getModule, type ModuleDef } from '../data/modules.ts';
import { hullPlating } from './textures.ts';
import { RNG } from '../core/rng.ts';
import { rotatedSize, type Orientation, ORIENTATION_DIR } from '../sim/shipgrid.ts';

/** World units per construction cell. */
export const CELL_SIZE = 4;

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function hullMaterial(color: number, accent: number, seed: number, emissiveStrength = 0.9): THREE.MeshStandardMaterial {
  const key = `${color}:${accent}:${seed}:${emissiveStrength}`;
  const hit = materialCache.get(key);
  if (hit) return hit;
  const pbr = hullPlating(color, accent, seed, 512);
  const mat = new THREE.MeshStandardMaterial({
    map: pbr.map,
    normalMap: pbr.normalMap,
    roughnessMap: pbr.roughnessMap,
    metalnessMap: pbr.metalnessMap,
    emissiveMap: pbr.emissiveMap,
    emissive: new THREE.Color(accent).multiplyScalar(emissiveStrength),
    metalness: 1,
    roughness: 1,
    normalScale: new THREE.Vector2(1.1, 1.1),
  });
  materialCache.set(key, mat);
  return mat;
}

export function emissiveMaterial(color: number, intensity = 2.2): THREE.MeshStandardMaterial {
  const key = `emissive:${color}:${intensity}`;
  const hit = materialCache.get(key);
  if (hit) return hit;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111318,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.2,
  });
  materialCache.set(key, mat);
  return mat;
}

export function glassMaterial(tint = 0x6fd8ff): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0.1,
    roughness: 0.06,
    transmission: 0.82,
    thickness: 0.6,
    ior: 1.4,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color(tint).multiplyScalar(0.12),
  });
}

/** Rounded box used everywhere for machined hardware. */
function bevelBox(w: number, h: number, d: number, bevel = 0.08): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const r = Math.min(bevel, w * 0.3, h * 0.3);
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true, bevelThickness: bevel * 0.6, bevelSize: bevel * 0.6, bevelSegments: 2, steps: 1,
  });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return geo;
}

function translated(geo: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry {
  geo.translate(x, y, z);
  return geo;
}

function rotatedGeo(geo: THREE.BufferGeometry, rx: number, ry: number, rz: number): THREE.BufferGeometry {
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  return geo;
}

/** Small surface detail blocks ("greebles") that sell the industrial look. */
function greebles(rng: RNG, w: number, h: number, d: number, count: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const gw = rng.range(0.06, 0.2) * w;
    const gh = rng.range(0.04, 0.12) * h;
    const gd = rng.range(0.06, 0.22) * d;
    const face = rng.int(0, 3);
    const g = new THREE.BoxGeometry(gw, gh, gd);
    const x = rng.range(-w / 2 + gw, w / 2 - gw);
    const z = rng.range(-d / 2 + gd, d / 2 - gd);
    if (face === 0) g.translate(x, h / 2, z);
    else if (face === 1) g.translate(x, -h / 2, z);
    else if (face === 2) g.translate(w / 2, rng.range(-h / 3, h / 3), z);
    else g.translate(-w / 2, rng.range(-h / 3, h / 3), z);
    out.push(g);
  }
  return out;
}

export interface BuiltModule {
  group: THREE.Group;
  /** Local-space points used for VFX and weapon fire. */
  muzzles: THREE.Object3D[];
  nozzles: THREE.Object3D[];
  turret?: THREE.Object3D;
  spin?: THREE.Object3D;
}

const buildCache = new Map<string, THREE.Group>();

/** Builds (and caches) the mesh for a module definition; returns a fresh clone. */
export function buildModuleMesh(defId: string): BuiltModule {
  const def = getModule(defId);
  const cacheKey = defId;
  let proto = buildCache.get(cacheKey);
  if (!proto) {
    proto = createModuleGroup(def);
    buildCache.set(cacheKey, proto);
  }
  const group = proto.clone(true);
  const muzzles: THREE.Object3D[] = [];
  const nozzles: THREE.Object3D[] = [];
  let turret: THREE.Object3D | undefined;
  let spin: THREE.Object3D | undefined;
  group.traverse((o) => {
    if (o.name === 'muzzle') muzzles.push(o);
    else if (o.name === 'nozzle') nozzles.push(o);
    else if (o.name === 'turret') turret = o;
    else if (o.name === 'spin') spin = o;
  });
  return { group, muzzles, nozzles, turret, spin };
}

function marker(name: string, x: number, y: number, z: number): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  return o;
}

function createModuleGroup(def: ModuleDef): THREE.Group {
  const group = new THREE.Group();
  const [sx, sy, sz] = def.size;
  const W = sx * CELL_SIZE, H = sy * CELL_SIZE, D = sz * CELL_SIZE;
  const rng = new RNG(hashId(def.id));
  const mat = hullMaterial(def.color, def.accent, hashId(def.id), 0.55);
  const glow = emissiveMaterial(def.accent, 2.6);
  const dark = new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.9, roughness: 0.45 });

  const body: THREE.BufferGeometry[] = [];
  const accents: THREE.BufferGeometry[] = [];

  switch (def.category) {
    case 'structure': {
      const inset = def.id === 'hull_composite' ? 0.76 : 0.88;
      body.push(bevelBox(W * inset, H * inset, D * inset, 0.3));
      // Corner struts.
      const sr = 0.16 * CELL_SIZE;
      for (const ox of [-1, 1]) for (const oz of [-1, 1]) {
        body.push(translated(new THREE.CylinderGeometry(sr, sr, H * 0.98, 8), ox * (W * inset) / 2, 0, oz * (D * inset) / 2));
      }
      // Rib bands.
      const ribs = Math.max(1, Math.round(sz));
      for (let i = 0; i < ribs; i++) {
        const z = -D / 2 + D * ((i + 0.5) / ribs);
        accents.push(translated(new THREE.BoxGeometry(W * 0.94, H * 0.1, D * 0.06), 0, H * 0.46, z));
      }
      body.push(...greebles(rng, W * inset, H * inset, D * inset, def.id === 'hull_basic' ? 6 : 10));
      break;
    }
    case 'command': {
      // Tapered fuselage base.
      const base = bevelBox(W * 0.86, H * 0.62, D * 0.9, 0.34);
      body.push(translated(base, 0, -H * 0.14, 0));
      // Canopy: half-dome scaled into a teardrop.
      const canopyGeo = new THREE.SphereGeometry(Math.min(W, D) * 0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      canopyGeo.scale(1.15, 0.95, 1.5);
      canopyGeo.translate(0, H * 0.14, D * 0.08);
      const canopy = new THREE.Mesh(canopyGeo, glassMaterial(0x7fe3ff));
      canopy.castShadow = true;
      group.add(canopy);
      // Canopy frame ribs.
      for (let i = -1; i <= 1; i++) {
        const rib = new THREE.TorusGeometry(Math.min(W, D) * 0.345, 0.06 * CELL_SIZE, 6, 20, Math.PI);
        rib.rotateY(Math.PI / 2 + i * 0.5);
        rib.translate(0, H * 0.14, D * 0.08);
        accents.push(rib);
      }
      // Sensor fin + antenna.
      accents.push(translated(new THREE.BoxGeometry(W * 0.08, H * 0.42, D * 0.3), 0, H * 0.4, -D * 0.3));
      body.push(...greebles(rng, W * 0.8, H * 0.5, D * 0.8, 8));
      if (def.id === 'cockpit_tactical') {
        const dish = new THREE.Group();
        dish.name = 'spin';
        const d1 = new THREE.Mesh(new THREE.SphereGeometry(CELL_SIZE * 0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), mat);
        d1.rotation.x = Math.PI;
        dish.add(d1);
        dish.position.set(W * 0.3, H * 0.42, -D * 0.2);
        group.add(dish);
      }
      break;
    }
    case 'propulsion': {
      const housingLen = D * 0.55;
      body.push(translated(bevelBox(W * 0.72, H * 0.72, housingLen, 0.28), 0, 0, -D * 0.5 + housingLen / 2 + D * 0.08));
      const nozzleCount = def.id === 'engine_fusion' ? 2 : def.id === 'engine_vector' ? 4 : def.id === 'engine_warp' ? 2 : 1;
      const radius = (def.id === 'engine_vector' ? 0.16 : def.id === 'engine_warp' ? 0.42 : 0.3) * CELL_SIZE * Math.min(sx, sy) ;
      for (let i = 0; i < nozzleCount; i++) {
        const angle = (i / nozzleCount) * Math.PI * 2;
        const offX = nozzleCount > 1 ? Math.cos(angle) * W * 0.22 : 0;
        const offY = nozzleCount > 1 ? Math.sin(angle) * H * 0.22 : 0;
        const bell = new THREE.CylinderGeometry(radius * 1.35, radius * 0.75, D * 0.42, 18, 1, true);
        bell.rotateX(Math.PI / 2);
        body.push(translated(bell, offX, offY, D * 0.22));
        const ring = new THREE.TorusGeometry(radius * 1.32, radius * 0.12, 8, 20);
        accents.push(translated(ring, offX, offY, D * 0.42));
        // Hot inner cone.
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.95, radius * 0.5, D * 0.3, 16, 1, true), glow);
        inner.rotation.x = Math.PI / 2;
        inner.position.set(offX, offY, D * 0.26);
        group.add(inner);
        group.add(marker('nozzle', offX, offY, D * 0.46));
      }
      if (def.id === 'engine_warp') {
        const ringGeo = new THREE.TorusGeometry(Math.min(W, H) * 0.42, 0.1 * CELL_SIZE, 10, 32);
        const ringMesh = new THREE.Mesh(ringGeo, glow);
        ringMesh.name = 'spin';
        ringMesh.position.z = -D * 0.1;
        group.add(ringMesh);
      }
      // Cooling fins.
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.BoxGeometry(W * 0.06, H * 0.5, D * 0.3);
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        accents.push(rotatedGeo(translated(fin, Math.cos(a) * W * 0.36, Math.sin(a) * H * 0.3, -D * 0.2), 0, 0, a));
      }
      break;
    }
    case 'mining': {
      body.push(translated(bevelBox(W * 0.66, H * 0.66, D * 0.6, 0.26), 0, 0, -D * 0.16));
      const barrels = def.id === 'laser_advanced' ? 2 : def.id === 'beam_heavy' ? 3 : 1;
      const br = (def.id === 'drill_plasma' ? 0.3 : 0.14) * CELL_SIZE;
      for (let i = 0; i < barrels; i++) {
        const off = barrels === 1 ? 0 : (i - (barrels - 1) / 2) * W * 0.25;
        const barrel = new THREE.CylinderGeometry(br, br * 0.82, D * 0.72, 14);
        barrel.rotateX(Math.PI / 2);
        body.push(translated(barrel, off, 0, D * 0.25));
        const lens = new THREE.Mesh(new THREE.SphereGeometry(br * 0.9, 12, 10), glow);
        lens.position.set(off, 0, D * 0.6);
        group.add(lens);
        group.add(marker('muzzle', off, 0, D * 0.62));
        for (let r = 0; r < 3; r++) {
          const ring = new THREE.TorusGeometry(br * 1.25, br * 0.18, 6, 14);
          ring.rotateY(0);
          accents.push(translated(ring, off, 0, D * (0.05 + r * 0.16)));
        }
      }
      if (def.id === 'drill_plasma') {
        const drill = new THREE.ConeGeometry(CELL_SIZE * 0.28, D * 0.5, 10);
        drill.rotateX(Math.PI / 2);
        accents.push(translated(drill, 0, 0, D * 0.5));
      }
      body.push(...greebles(rng, W * 0.6, H * 0.6, D * 0.5, 5));
      break;
    }
    case 'collection': {
      body.push(translated(bevelBox(W * 0.6, H * 0.6, D * 0.52, 0.24), 0, 0, -D * 0.2));
      const coils = def.id === 'collector_wide' ? 2 : 1;
      for (let c = 0; c < coils; c++) {
        const off = coils === 1 ? 0 : (c - 0.5) * W * 0.45;
        const ringR = Math.min(W, H) * (coils === 1 ? 0.38 : 0.3);
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.TorusGeometry(ringR * (1 - i * 0.14), 0.09 * CELL_SIZE, 8, 26);
          accents.push(translated(ring, off, 0, D * (0.12 + i * 0.14)));
        }
        const core = new THREE.Mesh(new THREE.TorusGeometry(ringR * 0.72, 0.05 * CELL_SIZE, 8, 24), glow);
        core.position.set(off, 0, D * 0.3);
        group.add(core);
        group.add(marker('muzzle', off, 0, D * 0.36));
      }
      if (def.id === 'collector_vacuum') {
        const funnel = new THREE.CylinderGeometry(Math.min(W, H) * 0.42, Math.min(W, H) * 0.2, D * 0.4, 16, 1, true);
        funnel.rotateX(-Math.PI / 2);
        body.push(translated(funnel, 0, 0, D * 0.3));
      }
      break;
    }
    case 'weapon': {
      // Turret base ring stays fixed; the `turret` group rotates toward targets.
      body.push(translated(new THREE.CylinderGeometry(Math.min(W, D) * 0.34, Math.min(W, D) * 0.4, H * 0.22, 18), 0, -H * 0.3, 0));
      const turret = new THREE.Group();
      turret.name = 'turret';
      turret.position.y = -H * 0.14;
      const headGeo = bevelBox(W * 0.5, H * 0.42, D * 0.45, 0.2);
      const head = new THREE.Mesh(headGeo, mat);
      head.castShadow = true;
      turret.add(head);

      const barrelCount = def.id === 'missile_battery' ? 6 : def.id === 'gun_machine' ? 2 : def.id === 'railgun' ? 2 : 1;
      const barrelR = def.id === 'railgun' ? 0.09 * CELL_SIZE : def.id === 'rocket_launcher' ? 0.2 * CELL_SIZE : 0.12 * CELL_SIZE;
      const barrelLen = D * (def.id === 'railgun' ? 0.95 : 0.6);
      for (let i = 0; i < barrelCount; i++) {
        let ox = 0, oy = 0;
        if (def.id === 'missile_battery') {
          ox = ((i % 3) - 1) * W * 0.17;
          oy = (Math.floor(i / 3) - 0.5) * H * 0.2;
        } else if (barrelCount === 2) {
          ox = (i - 0.5) * W * 0.2;
        }
        const g = new THREE.CylinderGeometry(barrelR, barrelR * 0.9, barrelLen, 12);
        g.rotateX(Math.PI / 2);
        g.translate(ox, oy, barrelLen / 2 + D * 0.1);
        const bm = new THREE.Mesh(g, dark);
        bm.castShadow = true;
        turret.add(bm);
        const flash = marker('muzzle', ox, oy, barrelLen + D * 0.12);
        turret.add(flash);
        if (def.id === 'gun_plasma' || def.id === 'gun_laser') {
          const tip = new THREE.Mesh(new THREE.SphereGeometry(barrelR * 1.2, 10, 8), glow);
          tip.position.set(ox, oy, barrelLen + D * 0.08);
          turret.add(tip);
        }
      }
      if (def.id === 'railgun') {
        const rail = new THREE.BoxGeometry(W * 0.05, H * 0.06, barrelLen * 1.05);
        for (const ox of [-W * 0.14, W * 0.14]) {
          const m = new THREE.Mesh(rail.clone(), emissiveMaterial(def.accent, 1.8));
          m.position.set(ox, H * 0.12, barrelLen / 2 + D * 0.1);
          turret.add(m);
        }
      }
      // Ammo drum / power pack.
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.2, H * 0.2, W * 0.5, 14), mat);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -H * 0.02, -D * 0.22);
      turret.add(drum);
      group.add(turret);
      break;
    }
    case 'defense': {
      if (def.id === 'shield_gen') {
        body.push(translated(bevelBox(W * 0.62, H * 0.5, D * 0.62, 0.22), 0, -H * 0.18, 0));
        const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.min(W, H) * 0.3, 1), emissiveMaterial(def.accent, 1.6));
        dome.position.y = H * 0.18;
        dome.name = 'spin';
        group.add(dome);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const pylon = new THREE.CylinderGeometry(0.05 * CELL_SIZE, 0.07 * CELL_SIZE, H * 0.5, 8);
          accents.push(translated(pylon, Math.cos(a) * W * 0.26, 0, Math.sin(a) * D * 0.26));
        }
      } else if (def.id === 'armor_plate') {
        body.push(bevelBox(W * 0.95, H * 0.95, D * 0.95, 0.4));
        for (let i = 0; i < 8; i++) {
          const bolt = new THREE.CylinderGeometry(0.07 * CELL_SIZE, 0.07 * CELL_SIZE, 0.06 * CELL_SIZE, 8);
          bolt.rotateX(Math.PI / 2);
          accents.push(translated(bolt, ((i % 4) - 1.5) * W * 0.26, (Math.floor(i / 4) - 0.5) * H * 0.5, D * 0.48));
        }
      } else if (def.id === 'repair_module') {
        body.push(translated(bevelBox(W * 0.7, H * 0.55, D * 0.7, 0.25), 0, -H * 0.1, 0));
        const armBase = new THREE.Group();
        armBase.name = 'spin';
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * CELL_SIZE, 0.04 * CELL_SIZE, H * 0.55, 8), mat);
          arm.position.set(Math.cos(a) * W * 0.2, H * 0.22, Math.sin(a) * D * 0.2);
          arm.rotation.z = Math.cos(a) * 0.5;
          arm.rotation.x = -Math.sin(a) * 0.5;
          armBase.add(arm);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07 * CELL_SIZE, 8, 8), glow);
          tip.position.set(Math.cos(a) * W * 0.3, H * 0.45, Math.sin(a) * D * 0.3);
          armBase.add(tip);
        }
        group.add(armBase);
      } else {
        // Drone bay with a visible docked drone.
        body.push(translated(bevelBox(W * 0.8, H * 0.5, D * 0.8, 0.22), 0, -H * 0.2, 0));
        const drone = new THREE.Group();
        drone.name = 'spin';
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 * CELL_SIZE, 0), mat);
        drone.add(core);
        for (const ox of [-1, 1]) {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.3 * CELL_SIZE, 0.04 * CELL_SIZE, 0.12 * CELL_SIZE), dark);
          wing.position.x = ox * 0.26 * CELL_SIZE;
          drone.add(wing);
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.05 * CELL_SIZE, 8, 8), glow);
          led.position.set(ox * 0.4 * CELL_SIZE, 0, 0);
          drone.add(led);
        }
        drone.position.y = H * 0.25;
        group.add(drone);
      }
      break;
    }
    case 'utility': {
      if (def.id === 'radar') {
        body.push(translated(new THREE.CylinderGeometry(W * 0.22, W * 0.3, H * 0.3, 14), 0, -H * 0.3, 0));
        const spin = new THREE.Group();
        spin.name = 'spin';
        const dishGeo = new THREE.SphereGeometry(Math.min(W, D) * 0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.6);
        const dish = new THREE.Mesh(dishGeo, mat);
        dish.rotation.x = -Math.PI * 0.35;
        dish.position.y = H * 0.1;
        spin.add(dish);
        const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * CELL_SIZE, 0.03 * CELL_SIZE, H * 0.3, 6), dark);
        feed.position.set(0, H * 0.25, D * 0.12);
        feed.rotation.x = -Math.PI * 0.35;
        spin.add(feed);
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.06 * CELL_SIZE, 8, 8), glow);
        led.position.set(0, H * 0.38, D * 0.2);
        spin.add(led);
        group.add(spin);
      } else if (def.id === 'scanner') {
        body.push(translated(bevelBox(W * 0.6, H * 0.45, D * 0.6, 0.2), 0, -H * 0.2, 0));
        for (let i = 0; i < 5; i++) {
          const bar = new THREE.BoxGeometry(W * 0.07, H * (0.2 + i * 0.09), D * 0.07);
          accents.push(translated(bar, (i - 2) * W * 0.14, H * (0.05 + i * 0.045), 0));
        }
        const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.1 * CELL_SIZE, 10, 8), glow);
        emitter.position.set(0, H * 0.42, D * 0.2);
        group.add(emitter);
      } else if (def.id === 'generator') {
        body.push(bevelBox(W * 0.8, H * 0.8, D * 0.8, 0.3));
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.min(W, H) * 0.22, 1), emissiveMaterial(def.accent, 3.2));
        core.name = 'spin';
        group.add(core);
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.TorusGeometry(Math.min(W, H) * (0.3 + i * 0.04), 0.045 * CELL_SIZE, 8, 24);
          accents.push(rotatedGeo(ring, (i * Math.PI) / 3, i * 0.4, 0));
        }
      } else if (def.id === 'cargo_bay') {
        body.push(bevelBox(W * 0.92, H * 0.92, D * 0.94, 0.16));
        for (let i = 0; i < Math.max(2, sz * 2); i++) {
          const band = new THREE.BoxGeometry(W * 0.96, H * 0.08, D * 0.04);
          accents.push(translated(band, 0, 0, -D * 0.45 + (i + 0.5) * (D * 0.9) / Math.max(2, sz * 2)));
        }
        const hatch = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, H * 0.32, D * 0.04), emissiveMaterial(def.accent, 0.8));
        hatch.position.set(0, 0, D * 0.48);
        group.add(hatch);
      } else {
        // Thruster booster pod.
        body.push(translated(new THREE.CapsuleGeometry(Math.min(W, H) * 0.28, D * 0.4, 6, 14), 0, 0, 0));
        rotatedGeo(body[body.length - 1], Math.PI / 2, 0, 0);
        for (let i = 0; i < 3; i++) {
          const fin = new THREE.BoxGeometry(W * 0.05, H * 0.34, D * 0.3);
          const a = (i / 3) * Math.PI * 2;
          accents.push(rotatedGeo(translated(fin, Math.cos(a) * W * 0.26, Math.sin(a) * H * 0.26, -D * 0.1), 0, 0, a));
        }
        const vent = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(W, H) * 0.2, Math.min(W, H) * 0.26, D * 0.12, 14), glow);
        vent.rotation.x = Math.PI / 2;
        vent.position.z = D * 0.42;
        group.add(vent);
        group.add(marker('nozzle', 0, 0, D * 0.48));
      }
      break;
    }
  }

  if (body.length) {
    const merged = mergeGeometries(body.map((g) => g.toNonIndexed()), false);
    if (merged) {
      merged.computeVertexNormals();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  if (accents.length) {
    const merged = mergeGeometries(accents.map((g) => g.toNonIndexed()), false);
    if (merged) {
      merged.computeVertexNormals();
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x2a3142, metalness: 0.95, roughness: 0.3 });
      const mesh = new THREE.Mesh(merged, accentMat);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }
  return group;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Converts a grid cell coordinate + orientation into a world transform. */
export function placeModuleObject(obj: THREE.Object3D, defId: string, pos: [number, number, number], orientation: Orientation): void {
  const def = getModule(defId);
  const [rsx, rsy, rsz] = rotatedSize(def, orientation);
  const cx = (pos[0] + (rsx - 1) / 2) * CELL_SIZE;
  const cy = (pos[1] + (rsy - 1) / 2) * CELL_SIZE;
  const cz = (pos[2] + (rsz - 1) / 2) * CELL_SIZE;
  obj.position.set(cx, cy, cz);
  obj.rotation.set(0, 0, 0);
  const dir = ORIENTATION_DIR[orientation];
  // Model space points +Z; rotate so +Z aligns with the facing direction.
  if (dir[1] === 1) obj.rotation.x = -Math.PI / 2;
  else if (dir[1] === -1) obj.rotation.x = Math.PI / 2;
  else obj.rotation.y = Math.atan2(dir[0], dir[2]);
}
