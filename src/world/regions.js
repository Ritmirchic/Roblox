/**
 * Six hand-planned regions. Each region has a layout (roads, blocks, landmarks,
 * safe zones, boss arena, spawn zones) then builds architecture and scatter.
 */
import * as THREE from 'three';
import { makeRng, clamp, TAU } from '../engine/util.js';
import * as P from './props.js';
import { stairs } from '../engine/geom.js';
import {
  house, apartment, supermarket, hospital, policeStation, warehouse, factoryHall,
  bunker, researchOutpost, cabin, subwayStation, labComplex, shop, checkpoint,
} from './buildings.js';
import { tower, rowHouse, ruin, busShelter, kiosk, pylon, overpass, streetProps, facade } from './urban.js';

function hash2(x, z) {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

function safePlace(ctx, x, z, w, d, { margin = 4, roadClear = 10 } = {}) {
  return ctx.areaFree(x, z, w + margin, d + margin) && ctx.roadDistance(x, z) > Math.max(w, d) * 0.34 + roadClear;
}

// ---------------------------------------------------------------------------
// THE DEAD SUBURBS
// ---------------------------------------------------------------------------
export function buildSuburbs(ctx) {
  const r = makeRng(1301);
  const cx = -1050;
  const cz = -1050;
  ctx.region = 0;
  ctx.registerRegion(0, cx, cz, 520);

  // street grid
  const streets = [
    { x: cx, z: cz, len: 520, dir: 0 },
    { x: cx, z: cz + 120, len: 460, dir: 0 },
    { x: cx - 120, z: cz - 60, len: 380, dir: Math.PI / 2 },
    { x: cx + 110, z: cz + 20, len: 420, dir: Math.PI / 2 },
    { x: cx + 220, z: cz - 80, len: 300, dir: Math.PI / 2 },
  ];
  for (const s of streets) {
    const dx = Math.cos(s.dir) * s.len;
    const dz = Math.sin(s.dir) * s.len;
    ctx.terrain.addRoad([[s.x - dx / 2, s.z - dz / 2], [s.x + dx / 2, s.z + dz / 2]], 7.5);
  }
  ctx.terrain.prepare();

  // survivor camp (safe zone) on the high street
  const campX = cx + 40;
  const campZ = cz + 150;
  const campY = ctx.groundY(campX, campZ);
  ctx.occupy(campX, campZ, 26, 20);
  ctx.addPad(campX, campZ, 26, 20, campY);
  P.tent(ctx.builder, campX - 5, campZ - 3, campY, 0.2);
  P.tent(ctx.builder, campX - 2, campZ + 4, campY, -0.4);
  P.campfire(ctx.builder, campX, campZ, campY, { lit: true });
  P.sandbags(ctx.builder, campX + 8, campZ - 6, campY, 0.1, 5, 1.1);
  P.workbench(ctx.builder, campX + 6, campZ + 6, campY, Math.PI / 2);
  P.shelf(ctx.builder, campX - 9, campZ + 1, campY, Math.PI / 2);
  P.crate(ctx.builder, campX + 4, campZ - 8, campY, 0.4);
  P.barrel(ctx.builder, campX - 7, campZ + 8, campY);
  ctx.addLoot({ profile: 'camp', x: campX - 9, y: campY, z: campZ + 1, type: 'shelf' });
  ctx.addLoot({ profile: 'camp', x: campX + 4, y: campY, z: campZ - 8, type: 'crate' });
  ctx.addLight(campX, campY + 1.2, campZ, 0xff9040, 16, 14);
  ctx.addNpc({ x: campX + 2, y: campY, z: campZ + 3, name: 'Sera', role: 'trader', facing: Math.PI });
  ctx.addNpc({ x: campX - 3, y: campY, z: campZ - 1, name: 'Old Vasily', role: 'lore', facing: 0.5 });
  ctx.addNpc({ x: campX + 7, y: campY, z: campZ + 2, name: 'Mara', role: 'guard', facing: -1.2 });
  ctx.addSafeZone(campX, campZ, 16);
  ctx.markLocation({ type: 'camp', x: campX, z: campZ, y: campY, name: 'Survivor Camp "The Kettle"', icon: 'camp' });

  // dense residential blocks laid out along the revived street grid
  const landmarks = [
    { type: 'police', x: cx - 150, z: cz - 170, w: 32, d: 24 },
    { type: 'supermarket', x: cx + 170, z: cz + 60, w: 40, d: 28 },
    { type: 'hospital', x: cx - 250, z: cz + 220, w: 50, d: 34 },
    { type: 'apartment', x: cx + 250, z: cz - 170, w: 24, d: 16 },
    { type: 'apartment', x: cx + 90, z: cz - 240, w: 22, d: 15 },
  ];
  for (const lm of landmarks) {
    if (!ctx.areaFree(lm.x, lm.z, lm.w + 6, lm.d + 6)) continue;
    ctx.occupy(lm.x, lm.z, lm.w + 4, lm.d + 4);
    ctx.addPad(lm.x, lm.z, lm.w + 8, lm.d + 8, ctx.groundY(lm.x, lm.z));
    if (lm.type === 'police') policeStation(ctx, lm.x, lm.z);
    else if (lm.type === 'supermarket') supermarket(ctx, lm.x, lm.z);
    else if (lm.type === 'hospital') hospital(ctx, lm.x, lm.z);
    else apartment(ctx, lm.x, lm.z, { floors: 3 + Math.floor(r() * 3), w: lm.w, d: lm.d, name: 'Housing Block' });
  }
  // houses on a jittered grid: 3-5 per block face
  let placed = 0;
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -3; gz <= 3; gz++) {
      const bx = cx + gx * 76 + (r() - 0.5) * 10;
      const bz = cz + gz * 72 + (r() - 0.5) * 10;
      if (Math.hypot(bx - campX, bz - campZ) < 46) continue;
      if (Math.hypot(bx - cx, bz - cz) > 470) continue;
      if (ctx.roadDistance(bx, bz) < 13) continue;
      const kind = r();
      if (kind < 0.62) {
        if (!ctx.areaFree(bx, bz, 18, 15)) continue;
        ctx.occupy(bx, bz, 17, 14);
        ctx.addPad(bx, bz, 20, 17, ctx.groundY(bx, bz));
        house(ctx, bx, bz, (Math.floor(r() * 4) * Math.PI) / 2, { garage: r() < 0.6, mat: r() < 0.6 ? 'brick' : 'plaster', name: ['Abandoned House', 'Miller House', 'Cul-de-sac Home', 'Two-storey House'][placed % 4] });
      } else if (kind < 0.82) {
        const n = 2 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) {
          const rx = bx + (i - (n - 1) / 2) * 10;
          if (!ctx.areaFree(rx, bz, 10, 12)) continue;
          ctx.occupy(rx, bz, 9, 12);
          rowHouse(ctx, rx, bz, 0, { w: 7, d: 9, shop: ['Corner Shop', 'Bakery', 'Hardware Store'][i % 3], seed: 700 + placed * 3 + i });
        }
      } else {
        ctx.occupy(bx, bz, 14, 14);
        ruin(ctx, bx, bz, { w: 11 + Math.floor(r() * 4), d: 10, floors: 2, seed: 500 + placed, mat: 'brick', name: 'Collapsed House' });
      }
      placed++;
    }
  }
  // driveways, fences and parked cars along the blocks
  for (let i = 0; i < 60; i++) {
    const ang = r() * TAU;
    const rad = 50 + r() * 300;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad * 0.85;
    const y = ctx.groundY(x, z);
    if (!ctx.areaFree(x, z, 4, 4)) continue;
    const pick = r();
    if (pick < 0.35) P.fence(ctx.builder, x, z, y, r() * 3.14, 4);
    else if (pick < 0.6) P.carWreck(ctx.builder, x, z, y, r() * 3.14);
    else if (pick < 0.72) P.streetLamp(ctx.builder, x, z, y, r() * 3.14, { on: r() < 0.12 });
    else if (pick < 0.85) P.rubble(ctx.builder, x, z, y, 1.8, 8);
    else streetProps(ctx, x, z, 1200 + i);
  }

  // street furniture + wrecks
  for (let i = 0; i < 46; i++) {
    const ang = r() * TAU;
    const rad = 50 + r() * 330;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad * 0.85;
    const y = ctx.groundY(x, z);
    if (!ctx.areaFree(x, z, 3, 3)) continue;
    const pick = r();
    if (pick < 0.3) P.carWreck(ctx.builder, x, z, y, r() * 3.14);
    else if (pick < 0.42) P.busWreck(ctx.builder, x, z, y, r() * 3.14);
    else if (pick < 0.6) P.fence(ctx.builder, x, z, y, r() * 3.14, 5);
    else if (pick < 0.72) P.streetLamp(ctx.builder, x, z, y, r() * 3.14, { on: r() < 0.2 });
    else if (pick < 0.84) P.rubble(ctx.builder, x, z, y, 2.5, 9);
    else P.jerseyBarrier(ctx.builder, x, z, y, r() * 3.14);
    if (r() < 0.25) ctx.addLoot({ profile: 'car', x, y, z, type: 'car' });
  }
  // football field / playground landmark
  ctx.markLocation({ type: 'subway', x: cx - 200, z: cz - 180, y: ctx.groundY(cx - 200, cz - 180), name: 'Collapsed Overpass', icon: 'ruin' });
  // The Hollow King's nest, beneath the dead water tower in the west cul-de-sac
  const kingX = cx - 300;
  const kingZ = cz + 60;
  if (ctx.areaFree(kingX, kingZ, 30, 30)) {
    ctx.occupy(kingX, kingZ, 30, 30);
    const ky = ctx.groundY(kingX, kingZ);
    // water tower: four legs, tank, ladder cage
    for (const [ox, oz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      ctx.builder.box(kingX + ox, ky + 5.2, kingZ + oz, 0.45, 10.4, 0.45, 'rust', { tex: 1.2, collideTag: 'wall' });
    }
    ctx.builder.cylinder(kingX, ky + 11.4, kingZ, 4.6, 4.2, 5.4, 'metalPlate', { seg: 16, tex: 3, tint: [0.62, 0.55, 0.46] });
    ctx.builder.cylinder(kingX, ky + 14.4, kingZ, 3.0, 4.0, 1.2, 'rust', { seg: 16, tex: 2, collide: false });
    for (let i = 0; i < 8; i++) {
      ctx.builder.box(kingX + 4.4, ky + 1 + i * 1.25, kingZ, 0.12, 0.1, 0.9, 'rust', { tex: 0.4, collide: false });
    }
    ctx.builder.box(kingX + 4.4, ky + 5.6, kingZ, 0.1, 10.6, 0.1, 'rust', { tex: 0.8, collide: false });
    // nest ring under it
    ctx.addNest({ x: kingX, z: kingZ, name: 'The Hollow King\'s Nest' });
    ctx.addLoot({ profile: 'nest', x: kingX + 2, y: ky, z: kingZ + 2, type: 'nest', locked: true });
    ctx.addLight(kingX, ky + 2.0, kingZ, 0xc05a3a, 9, 14);
    ctx.markLocation({ type: 'watertower', x: kingX, z: kingZ, y: ky, name: 'Dead Water Tower', icon: 'ruin' });
    ctx.addBossArena({ boss: 'hollowKing', x: kingX, z: kingZ, radius: 24 });
  }
  ctx.addSpawnZone({ region: 0, mutant: 'hollow', x: cx - 150, z: cz - 150, radius: 90, count: 5 });
  ctx.addSpawnZone({ region: 0, mutant: 'crawler', x: cx + 120, z: cz - 60, radius: 80, count: 3 });
  ctx.addSpawnZone({ region: 0, mutant: 'mimic', x: cx + 60, z: cz - 200, radius: 70, count: 2 });
  ctx.addSpawnZone({ region: 0, mutant: 'screamer', x: cx - 80, z: cz + 60, radius: 70, count: 1 });
}

// ---------------------------------------------------------------------------
// BLACKWOOD FOREST
// ---------------------------------------------------------------------------
export function buildForest(ctx) {
  const r = makeRng(2202);
  const cx = -420;
  const cz = -1080;
  ctx.region = 1;
  ctx.registerRegion(1, cx, cz, 480);
  // trails
  ctx.terrain.addRoad([[cx - 240, cz + 120], [cx - 100, cz + 40], [cx + 20, cz - 40], [cx + 160, cz - 120]], 4.5);
  ctx.terrain.addRoad([[cx - 60, cz - 200], [cx - 30, cz - 80], [cx + 10, cz + 60]], 3.5);
  ctx.terrain.prepare();

  const cleared = [];
  // dense pine forest
  for (let i = 0; i < 1100; i++) {
    const ang = r() * TAU;
    const rad = Math.sqrt(r()) * 430;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad;
    if (!ctx.areaFree(x, z, 3, 3) || ctx.roadDistance(x, z) < 4) continue;
    const y = ctx.groundY(x, z);
    if (r() < 0.24) P.treeDead(ctx.builder, x, z, y, 0.8 + r() * 0.8);
    else P.treePine(ctx.builder, x, z, y, 0.8 + r() * 0.9);
    cleared.push([x, z]);
    ctx.builder.colliders.addCylinder(x, y + 2, z, 0.35, 4);
  }
  // undergrowth
  for (let i = 0; i < 700; i++) {
    const ang = r() * TAU;
    const rad = Math.sqrt(r()) * 430;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad;
    if (!ctx.areaFree(x, z, 1.5, 1.5)) continue;
    const y = ctx.groundY(x, z);
    P.bush(ctx.builder, x, z, y, 0.6 + r() * 0.9, r() < 0.5 ? 'forestFoliage' : 'grass');
  }
  // rocks
  for (let i = 0; i < 120; i++) {
    const ang = r() * TAU;
    const rad = Math.sqrt(r()) * 430;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad;
    if (!ctx.areaFree(x, z, 3, 3)) continue;
    P.rock(ctx.builder, x, z, ctx.groundY(x, z), 0.6 + r() * 1.6);
  }

  // cabins
  const cabinSpots = [[cx - 120, cz + 60], [cx + 80, cz - 90], [cx - 40, cz - 180], [cx + 190, cz + 80], [cx - 220, cz - 60]];
  for (const [x, z] of cabinSpots) {
    if (!ctx.areaFree(x, z, 14, 12)) continue;
    ctx.occupy(x, z, 14, 12);
    cabin(ctx, x, z, { name: 'Forester Cabin' });
  }
  // research outpost
  if (ctx.areaFree(cx + 20, cz + 20, 30, 26)) {
    ctx.occupy(cx + 20, cz + 20, 30, 26);
    researchOutpost(ctx, cx + 20, cz + 20);
  }
  // caves: rock mound + chamber
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * TAU + 0.7;
    const x = cx + Math.cos(ang) * (180 + i * 70);
    const z = cz + Math.sin(ang) * (180 + i * 60);
    if (!ctx.areaFree(x, z, 26, 26)) continue;
    ctx.occupy(x, z, 26, 26);
    ctx.addCave({ x, z, radius: 9, name: i === 0 ? 'Blackwood Cave' : 'Tunnel Mouth' });
  }
  // swamp / stream
  ctx.addWaterPool(cx - 200, cz - 180, 40, 22);
  ctx.addWaterPool(cx + 120, cz + 180, 55, 30);
  ctx.markLocation({ type: 'forest', x: cx, z: cz, y: ctx.groundY(cx, cz), name: 'Blackwood Forest', icon: 'forest' });
  ctx.addBossArena({ boss: 'forestMatriarch', x: cx - 260, z: cz - 240, radius: 26 });
  ctx.addSpawnZone({ region: 1, mutant: 'crawler', x: cx - 100, z: cz, radius: 140, count: 6, pack: true });
  ctx.addSpawnZone({ region: 1, mutant: 'stalker', x: cx + 160, z: cz + 100, radius: 110, count: 3 });
  ctx.addSpawnZone({ region: 1, mutant: 'watcher', x: cx - 160, z: cz - 180, radius: 100, count: 2 });
  ctx.addSpawnZone({ region: 1, mutant: 'burrower', x: cx + 40, z: cz - 200, radius: 100, count: 2 });
  ctx.addSpawnZone({ region: 1, mutant: 'hollow', x: cx + 200, z: cz - 140, radius: 90, count: 3 });
}

// ---------------------------------------------------------------------------
// INDUSTRIAL ZONE
// ---------------------------------------------------------------------------
export function buildIndustrial(ctx) {
  const r = makeRng(3303);
  const cx = -40;
  const cz = -330;
  ctx.region = 2;
  ctx.registerRegion(2, cx, cz, 440);
  ctx.terrain.addRoad([[cx - 300, cz], [cx + 260, cz]], 9);
  ctx.terrain.addRoad([[cx - 60, cz - 260], [cx - 40, cz + 240]], 8);
  ctx.terrain.prepare();

  // factory halls and warehouses, planned on a grid
  const sites = [
    { kind: 'factory', x: cx - 190, z: cz - 90 },
    { kind: 'factory', x: cx + 120, z: cz - 140 },
    { kind: 'factory', x: cx + 180, z: cz + 120 },
    { kind: 'factory', x: cx - 250, z: cz + 190 },
    { kind: 'warehouse', x: cx - 210, z: cz + 90 },
    { kind: 'warehouse', x: cx - 90, z: cz + 150 },
    { kind: 'warehouse', x: cx + 60, z: cz + 130 },
    { kind: 'warehouse', x: cx - 120, z: cz - 200 },
    { kind: 'warehouse', x: cx + 230, z: cz - 40 },
    { kind: 'warehouse', x: cx - 20, z: cz - 210 },
    { kind: 'warehouse', x: cx + 300, z: cz + 190 },
    { kind: 'warehouse', x: cx - 300, z: cz - 150 },
    { kind: 'bunker', x: cx + 260, z: cz - 210 },
    { kind: 'shed', x: cx - 40, z: cz + 60 },
    { kind: 'shed', x: cx + 90, z: cz - 40 },
    { kind: 'shed', x: cx - 160, z: cz + 20 },
    { kind: 'shed', x: cx + 150, z: cz + 210 },
  ];
  for (const s of sites) {
    const w = s.kind === 'factory' ? 50 : s.kind === 'warehouse' ? 46 : s.kind === 'shed' ? 14 : 32;
    const d = s.kind === 'factory' ? 36 : s.kind === 'warehouse' ? 34 : s.kind === 'shed' ? 11 : 32;
    if (!safePlace(ctx, s.x, s.z, w, d, { roadClear: 10 })) continue;
    ctx.occupy(s.x, s.z, w, d);
    const y = ctx.groundY(s.x, s.z);
    ctx.addPad(s.x, s.z, w + 10, d + 10, y);
    if (s.kind === 'factory') factoryHall(ctx, s.x, s.z, { name: r() < 0.5 ? 'Foundry Hall' : 'Chemical Works' });
    else if (s.kind === 'warehouse') warehouse(ctx, s.x, s.z, { name: `Warehouse ${Math.floor(r() * 9) + 1}` });
    else if (s.kind === 'shed') {
      const rot = r() < 0.5 ? 0 : Math.PI / 2;
      ctx.builder.box(s.x, y + 1.6, s.z, w, 3.2, d, 'metalPlate', { tex: 3, rotY: rot, collideTag: 'wall' });
      ctx.builder.box(s.x, y + 3.3, s.z, w + 1.2, 0.3, d + 1.2, 'rust', { tex: 2, rotY: rot, collide: false, tint: [0.5, 0.36, 0.28] });
      ctx.addDoor({ x: s.x, y, z: s.z - d / 2, rot: 0, w: 1.2, h: 2.3, kind: 'metal' });
      ctx.addLoot({ profile: 'industrial', x: s.x + 2, y, z: s.z, type: 'crate' });
      ctx.addLight(s.x, y + 2.6, s.z, 0xffc070, 6, 10);
    }
    else bunker(ctx, s.x, s.z, { name: 'Service Bunker 12' });
  }
  // container yard: stacked shipping containers, a truck and a crane rail
  for (let i = 0; i < 26; i++) {
    const gx = cx - 330 + (i % 13) * 22;
    const gz = cz + 250 + Math.floor(i / 13) * 16;
    if (!ctx.areaFree(gx, gz, 10, 8)) continue;
    const gy = ctx.groundY(gx, gz);
    const stack = 1 + (i % 3);
    for (let k = 0; k < stack; k++) {
      const col = [[0.55, 0.31, 0.22], [0.28, 0.38, 0.42], [0.44, 0.42, 0.26], [0.36, 0.3, 0.36]][(i + k) % 4];
      ctx.builder.box(gx + (k % 2) * 0.4, gy + 1.3 + k * 2.6, gz, 9.2, 2.55, 3.0, 'metalPlate', { tex: 2.4, collideTag: 'wall', tint: col });
    }
    ctx.occupy(gx, gz, 10, 8);
    ctx.addLoot({ profile: 'industrial', x: gx + 5.4, y: gy, z: gz + 1.6, type: 'crate' });
  }
  for (let i = 0; i < 3; i++) {
    const x = cx - 300 + i * 300;
    const gy = ctx.groundY(x, cz + 260);
    // gantry crane: two legs and a beam over the container rows
    ctx.builder.box(x - 7, gy + 8, cz + 260, 0.8, 16, 0.8, 'metalPlate', { tex: 4, collideTag: 'wall' });
    ctx.builder.box(x + 7, gy + 8, cz + 260, 0.8, 16, 0.8, 'metalPlate', { tex: 4, collideTag: 'wall' });
    ctx.builder.box(x, gy + 16.2, cz + 260, 16, 0.9, 1.2, 'rust', { tex: 3, collide: false, tint: [0.52, 0.4, 0.3] });
    ctx.builder.box(x, gy + 14.4, cz + 260, 2.2, 1.4, 2.0, 'rust', { tex: 2, collide: false, tint: [0.42, 0.34, 0.28] });
  }
  // gravel yard: coarse hard-standing between the halls
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      const px = cx + gx * 46 + 23;
      const pz = cz + gz * 46 + 23;
      if (Math.hypot(px - cx, pz - cz) > 360) continue;
      if (ctx.roadDistance(px, pz) < 6) continue;
      const gy = ctx.groundY(px, pz);
      if (Math.abs(ctx.groundY(px + 6, pz) - gy) + Math.abs(ctx.groundY(px, pz + 6) - gy) > 1.2) continue;
      ctx.builder.box(px, gy - 0.08, pz, 44, 0.18, 44, 'gravel', { tex: 12, collide: false, tint: [0.55, 0.5, 0.42] });
    }
  }
  // cooling towers + tank farm
  for (let i = 0; i < 2; i++) {
    const x = cx - 60 + i * 130;
    const z = cz - 230;
    P.coolingTower(ctx.builder, x, z, ctx.groundY(x, z), 8 + i, 24 + i * 4);
    ctx.occupy(x, z, 20, 20);
  }
  for (let i = 0; i < 5; i++) {
    const x = cx + 40 + (i % 3) * 18;
    const z = cz + 60 + Math.floor(i / 3) * 22;
    if (!ctx.areaFree(x, z, 8, 8)) continue;
    P.tank(ctx.builder, x, z, ctx.groundY(x, z), 3, 5.5);
    ctx.occupy(x, z, 8, 8);
  }
  // pipe runs and machinery between buildings
  for (let i = 0; i < 14; i++) {
    const x = cx - 240 + i * 36;
    const z = cz + 20 + (i % 2) * 9;
    if (!ctx.areaFree(x, z, 12, 2)) continue;
    P.pipeRun(ctx.builder, x, z, ctx.groundY(x, z), 0, 14, 0.2, 2.4);
    if (r() < 0.4) P.valveStation(ctx.builder, x, z, ctx.groundY(x, z), 0);
    if (r() < 0.5) P.barrel(ctx.builder, x + 2, z + 3, ctx.groundY(x, z), 0, r() < 0.5 ? [0.75, 0.6, 0.2] : [0.7, 0.42, 0.24]);
  }
  // contaminated pools (hazards)
  for (let i = 0; i < 4; i++) {
    const ang = r() * TAU;
    const x = cx + Math.cos(ang) * (140 + r() * 120);
    const z = cz + Math.sin(ang) * (120 + r() * 100);
    if (!ctx.areaFree(x, z, 16, 16)) continue;
    ctx.addHazardPool({ x, z, radius: 7 + r() * 4, kind: 'chemical' });
  }
  // fences around the yard
  for (let i = 0; i < 10; i++) {
    const x = cx - 260 + i * 55;
    P.chainlink(ctx.builder, x, cz - 260, ctx.groundY(x, cz - 260), 0, 55, 2.6);
  }
  P.antennaMast(ctx.builder, cx + 30, cz - 20, ctx.groundY(cx + 30, cz - 20), 16);
  ctx.addBossArena({ boss: 'ironAbomination', x: cx - 40, z: cz - 20, radius: 30 });
  ctx.markLocation({ type: 'industrial', x: cx, z: cz, y: ctx.groundY(cx, cz), name: 'The Industrial Zone', icon: 'factory' });
  ctx.addSpawnZone({ region: 2, mutant: 'hollow', x: cx - 100, z: cz, radius: 140, count: 5 });
  ctx.addSpawnZone({ region: 2, mutant: 'crawler', x: cx + 100, z: cz + 50, radius: 120, count: 4, pack: true });
  ctx.addSpawnZone({ region: 2, mutant: 'brute', x: cx + 50, z: cz - 180, radius: 100, count: 2 });
  ctx.addSpawnZone({ region: 2, mutant: 'contaminated', x: cx - 180, z: cz + 60, radius: 100, count: 3 });
  ctx.addSpawnZone({ region: 2, mutant: 'screamer', x: cx - 40, z: cz - 120, radius: 90, count: 1 });
}

// ---------------------------------------------------------------------------
// THE FORGOTTEN CITY
// ---------------------------------------------------------------------------
export function buildCity(ctx) {
  const r = makeRng(4404);
  const cx = 760;
  const cz = -260;
  ctx.region = 3;
  ctx.registerRegion(3, cx, cz, 520);
  // avenue grid
  const avenues = [-200, -60, 80, 220];
  for (const a of avenues) {
    ctx.terrain.addRoad([[cx + a, cz - 340], [cx + a, cz + 330]], 11);
    ctx.terrain.addRoad([[cx - 330, cz + a], [cx + 330, cz + a]], 11);
  }
  ctx.terrain.prepare();

  // central landmark buildings on fixed lots
  const hospitalLot = [cx - 70, cz - 190];
  if (ctx.areaFree(hospitalLot[0], hospitalLot[1], 56, 40)) {
    ctx.occupy(hospitalLot[0], hospitalLot[1], 56, 44);
    hospital(ctx, hospitalLot[0], hospitalLot[1], { name: 'Central Hospital' });
  }
  const marketLot = [cx + 150, cz + 130];
  if (ctx.areaFree(marketLot[0], marketLot[1], 60, 50)) {
    ctx.occupy(marketLot[0], marketLot[1], 60, 50);
    supermarket(ctx, marketLot[0], marketLot[1], { name: 'City Market' });
    shop(ctx, marketLot[0] + 30, marketLot[1] + 22, {});
  }
  const towerLots = [[cx - 190, cz + 90, 24, 20, 12, 'Korolyov Tower', 'Korolyov Tower'],
    [cx + 40, cz - 60, 20, 18, 9, 'Block 12', 'Block 12'],
    [cx - 60, cz + 160, 22, 19, 10, 'Kinoteatr Building', 'Kinoteatr Building'],
    [cx + 210, cz - 120, 18, 17, 8, 'Avenue 9 Offices', 'Avenue 9 Offices']];
  for (const [x, z, w, d, floors, name, nm2] of towerLots) {
    if (!ctx.areaFree(x, z, w + 12, d + 12)) continue;
    ctx.occupy(x, z, w + 10, d + 10);
    ctx.addPad(x, z, w + 12, d + 12, ctx.groundY(x, z));
    tower(ctx, x, z, { w, d, floors, name, seed: Math.floor(x * 3 + z), style: floors > 9 ? 'office' : 'residential' });
  }
  // dense avenue grid: towers, ruins, row-house strips, plazas
  let lots = 0;
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      const px = cx + gx * 74 + (r() - 0.5) * 12;
      const pz = cz + gz * 70 + (r() - 0.5) * 10;
      if (Math.hypot(px - cx, pz - cz) > 470) continue;
      if (!ctx.areaFree(px, pz, 26, 24)) continue;
      if (ctx.roadDistance(px, pz) < 18) continue;
      const t = r();
      if (t < 0.34) {
        const w = 13 + Math.floor(r() * 3) * 2;
        const d = 12 + Math.floor(r() * 3) * 2;
        const floors = 6 + Math.floor(r() * 8);
        ctx.occupy(px, pz, w + 8, d + 8);
        ctx.addPad(px, pz, w + 10, d + 10, ctx.groundY(px, pz));
        tower(ctx, px, pz, { w, d, floors, seed: 100 + lots, style: r() < 0.5 ? 'office' : 'residential', name: ['Meridian House', 'Yantar Block', 'Avenue 4', 'State Insurance', 'Riverside Tower', 'Severny Building'][lots % 6] });
      } else if (t < 0.58) {
        const w = 11 + Math.floor(r() * 3) * 2;
        const d = 10 + Math.floor(r() * 3) * 2;
        ctx.occupy(px, pz, w + 4, d + 4);
        ruin(ctx, px, pz, { w, d, floors: 3 + Math.floor(r() * 3), seed: 200 + lots, mat: r() < 0.5 ? 'brick' : 'concrete' });
      } else if (t < 0.85) {
        const n = 3 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const rx = px + (i - (n - 1) / 2) * 9.4;
          if (!ctx.areaFree(rx, pz, 10, 12)) continue;
          ctx.occupy(rx, pz, 9, 12);
          rowHouse(ctx, rx, pz, 0, { w: 7, d: 9, shop: ['General Store', 'Pharmacy', 'Hardware', 'Book Shop', 'Deli', 'Repair Shop'][(lots + i) % 6], seed: 300 + lots * 4 + i });
        }
      } else {
        // plaza with benches, planters and a kiosk
        ctx.occupy(px, pz, 24, 22);
        ctx.addPad(px, pz, 24, 22, ctx.groundY(px, pz));
        const gy = ctx.groundY(px, pz);
        ctx.builder.box(px, gy + 0.06, pz, 22, 0.12, 20, 'tile', { tex: 4, collideTag: 'floor', tint: [0.8, 0.78, 0.74] });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + 0.4;
          const bx2 = px + Math.cos(a) * 7;
          const bz2 = pz + Math.sin(a) * 7;
          ctx.builder.box(bx2, gy + 0.55, bz2, 3.4, 0.9, 0.9, 'concrete', { tex: 1.2, rotY: -a, collideTag: 'wall' });
          P.bush(ctx.builder, bx2 + Math.cos(a) * 1.2, bz2 + Math.sin(a) * 1.2, gy + 0.5, 0.8, 'forestFoliage');
        }
        kiosk(ctx, px + 5, pz - 4, r() * 3.14);
        ctx.addLight(px, gy + 3.2, pz, 0xffd0a0, 8, 16);
      }
      lots++;
    }
  }
  // street clutter across the city core: wrecks, rubble, lamps, barriers,
  // dead trees and dumpsters, so the blocks read as a ruined city at eye level
  {
    let placed = 0;
    for (let i = 0; i < 420 && placed < 260; i++) {
      const a = r() * TAU;
      const rad = 40 + Math.sqrt(r()) * 430;
      const px = cx + Math.cos(a) * rad;
      const pz = cz + Math.sin(a) * rad;
      if (!ctx.areaFree(px, pz, 5, 5)) continue;
      if (ctx.onBuildingLot && ctx.onBuildingLot(px, pz)) continue;
      const gy = ctx.groundY(px, pz);
      const k = r();
      const rot = r() * TAU;
      if (k < 0.2) P.carWreck(ctx.builder, px, pz, gy, rot, { burned: r() < 0.7 });
      else if (k < 0.32) P.busWreck(ctx.builder, px, pz, gy, rot);
      else if (k < 0.46) P.rubble(ctx.builder, px, pz, gy, 1.2 + r() * 2.4, 6 + Math.floor(r() * 8));
      else if (k < 0.58) P.streetLamp(ctx.builder, px, pz, gy, rot, { on: r() < 0.18 });
      else if (k < 0.68) P.jerseyBarrier(ctx.builder, px, pz, gy, rot);
      else if (k < 0.78) P.treeDead(ctx.builder, px, pz, gy, 0.8 + r() * 0.5);
      else if (k < 0.88) { P.barrel(ctx.builder, px, pz, gy, rot, r() < 0.5 ? [0.72, 0.44, 0.2] : [0.3, 0.36, 0.34]); }
      else {
        ctx.builder.box(px, gy + 0.6, pz, 1.3, 1.2, 0.9, 'rust', { tex: 2, rotY: rot, collideTag: 'container', tint: [0.34, 0.4, 0.36] });
      }
      ctx.occupy(px, pz, 4.4, 4.4);
      placed++;
    }
  }
  // continuous sidewalks + kerbs along every avenue
  for (const a of avenues) {
    for (let i = 0; i < 26; i++) {
      const t = -320 + i * 26;
      const gy1 = ctx.groundY(cx + a + 7.4, cz + t);
      const gy2 = ctx.groundY(cx + a - 7.4, cz + t);
      ctx.builder.box(cx + a + 7.6, gy1 + 0.075, cz + t, 2.6, 0.15, 26, 'concrete', { tex: 5, collideTag: 'floor', tint: [0.78, 0.77, 0.73] });
      ctx.builder.box(cx + a - 7.6, gy2 + 0.075, cz + t, 2.6, 0.15, 26, 'concrete', { tex: 5, collideTag: 'floor', tint: [0.76, 0.75, 0.71] });
      const gy3 = ctx.groundY(cx + t, cz + a + 7.4);
      const gy4 = ctx.groundY(cx + t, cz + a - 7.4);
      ctx.builder.box(cx + t, gy3 + 0.075, cz + a + 7.6, 26, 0.15, 2.6, 'concrete', { tex: 5, collideTag: 'floor', tint: [0.77, 0.76, 0.72] });
      ctx.builder.box(cx + t, gy4 + 0.075, cz + a - 7.6, 26, 0.15, 2.6, 'concrete', { tex: 5, collideTag: 'floor', tint: [0.75, 0.74, 0.7] });
    }
    // kerb lips
    ctx.builder.box(cx + a + 6.2, ctx.groundY(cx + a + 6.2, cz) + 0.09, cz, 0.3, 0.18, 660, 'concrete', { tex: 3, collide: false, tint: [0.6, 0.59, 0.56] });
    ctx.builder.box(cx + a - 6.2, ctx.groundY(cx + a - 6.2, cz) + 0.09, cz, 0.3, 0.18, 660, 'concrete', { tex: 3, collide: false, tint: [0.6, 0.59, 0.56] });
    ctx.builder.box(cx, ctx.groundY(cx, cz + a + 6.2) + 0.09, cz + a + 6.2, 660, 0.18, 0.3, 'concrete', { tex: 3, collide: false, tint: [0.6, 0.59, 0.56] });
    ctx.builder.box(cx, ctx.groundY(cx, cz + a - 6.2) + 0.09, cz + a - 6.2, 660, 0.18, 0.3, 'concrete', { tex: 3, collide: false, tint: [0.6, 0.59, 0.56] });
  }
  // road markings: lane dashes down each avenue
  for (const a of avenues) {
    for (let i = 0; i < 40; i++) {
      const t = -330 + i * 16.5;
      const y1 = ctx.groundY(cx + a, cz + t);
      ctx.builder.box(cx + a, y1 + 0.03, cz + t, 0.22, 0.02, 3.2, 'hazard', { tex: 1.4, collide: false, tint: [0.85, 0.83, 0.78] });
      const y2 = ctx.groundY(cx + t, cz + a);
      ctx.builder.box(cx + t, y2 + 0.03, cz + a, 3.2, 0.02, 0.22, 'hazard', { tex: 1.4, collide: false, tint: [0.85, 0.83, 0.78] });
    }
  }
  // street furniture along every avenue intersection
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -3; gz <= 3; gz++) {
      const px = cx + gx * 108 + 4;
      const pz = cz + gz * 102 + 4;
      if (ctx.roadDistance(px, pz) > 16) continue;
      if (!ctx.areaFree(px, pz, 4, 4)) continue;
      const gy = ctx.groundY(px, pz);
      const pick = r();
      if (pick < 0.35) P.streetLamp(ctx.builder, px, pz, gy, r() * 3.14, { on: pick < 0.1 });
      else if (pick < 0.55) P.trafficLight(ctx.builder, px, pz, gy, r() * 3.14);
      else if (pick < 0.7) P.carWreck(ctx.builder, px, pz, gy, r() * 3.14);
      else if (pick < 0.85) streetProps(ctx, px, pz, 900 + gx * 13 + gz);
      else P.rubble(ctx.builder, px, pz, gy, 2.2, 10);
    }
  }
  // elevated overpass cutting through the west side
  if (ctx.areaFree(cx - 250, cz + 40, 80, 30)) {
    ctx.occupy(cx - 250, cz + 40, 80, 30);
    overpass(ctx, cx - 250, cz + 40, { len: 76, h: 7, rot: Math.PI / 2 });
  }
  // police HQ + subway farther out
  const px1 = cx + 280;
  const pz1 = cz + 300;
  if (ctx.areaFree(px1, pz1, 40, 30)) {
    ctx.occupy(px1, pz1, 40, 30);
    policeStation(ctx, px1, pz1, { name: 'City Police HQ' });
  }
  const sx = cx - 300;
  const sz = cz + 250;
  if (ctx.areaFree(sx, sz, 46, 40)) {
    ctx.occupy(sx, sz, 46, 40);
    subwayStation(ctx, sx, sz);
  }
  // parking garage
  const gx = cx + 320;
  const gz = cz - 320;
  if (ctx.areaFree(gx, gz, 36, 30)) {
    ctx.occupy(gx, gz, 36, 30);
    parkingGarage(ctx, gx, gz);
  }
  // street clutter
  for (let i = 0; i < 80; i++) {
    const ang = r() * TAU;
    const rad = Math.sqrt(r()) * 420;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad;
    if (!ctx.areaFree(x, z, 4, 4)) continue;
    const y = ctx.groundY(x, z);
    const pick = r();
    if (pick < 0.3) P.carWreck(ctx.builder, x, z, y, r() * 3.14);
    else if (pick < 0.4) P.busWreck(ctx.builder, x, z, y, r() * 3.14);
    else if (pick < 0.6) P.rubble(ctx.builder, x, z, y, 3, 12);
    else if (pick < 0.75) P.streetLamp(ctx.builder, x, z, y, r() * 3.14, { on: r() < 0.15 });
    else if (pick < 0.85) P.trafficLight(ctx.builder, x, z, y, r() * 3.14);
    else P.chainlink(ctx.builder, x, z, y, r() * 3.14, 6, 2.4);
    if (r() < 0.2) ctx.addLoot({ profile: r() < 0.5 ? 'car' : 'corpse', x, y, z, type: 'car' });
  }
  ctx.markLocation({ type: 'city', x: cx, z: cz, y: ctx.groundY(cx, cz), name: 'The Forgotten City', icon: 'city' });
  ctx.addSpawnZone({ region: 3, mutant: 'hollow', x: cx - 120, z: cz, radius: 160, count: 6 });
  ctx.addSpawnZone({ region: 3, mutant: 'crawler', x: cx + 160, z: cz - 120, radius: 130, count: 5, pack: true });
  ctx.addSpawnZone({ region: 3, mutant: 'mimic', x: cx, z: cz + 160, radius: 120, count: 3 });
  ctx.addSpawnZone({ region: 3, mutant: 'brute', x: cx + 240, z: cz + 160, radius: 100, count: 2 });
  ctx.addSpawnZone({ region: 3, mutant: 'stalker', x: cx - 240, z: cz - 160, radius: 100, count: 2 });
}

function suburbBlock(ctx, r, px, pz) {
  for (let i = 0; i < 3; i++) {
    const x = px - 30 + i * 30;
    const z = pz + (i % 2) * 20;
    ctx.occupy(x, z, 18, 16);
    house(ctx, x, z, r() * 3.14, { garage: i !== 1 });
  }
}

function parkingGarage(ctx, x, z) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const levels = 3;
  ctx.addPad(x, z, 40, 34, gy);
  for (let l = 0; l < levels; l++) {
    const y = gy + l * 3.2;
    b.box(x, y + 0.1, z, 34, 0.25, 28, 'concreteFloor', { tex: 4, collideTag: 'floor' });
    for (let i = 0; i < 8; i++) {
      b.box(x - 15 + i * 4.3, y + 1.6, z - 13.5, 0.5, 3.2, 0.5, 'concrete', { tex: 1.4 });
      b.box(x - 15 + i * 4.3, y + 1.6, z + 13.5, 0.5, 3.2, 0.5, 'concrete', { tex: 1.4 });
    }
    if (l < levels - 1) {
      stairs(b, { x: x + 14, z: z + 6, y0: y, dir: 'n', width: 2.0, steps: 10, rise: 0.32, run: 0.34, mat: 'concrete' });
    }
    // parked cars (some)
    for (let i = 0; i < 5; i++) {
      if (Math.random() < 0.5) continue;
      const cx = x - 12 + i * 5.5;
      const cz = z - 6 + (i % 2) * 8;
      P.carWreck(b, cx, cz, y + 0.15, Math.PI / 2 + (Math.random() - 0.5), { burned: Math.random() < 0.5 });
      ctx.addLoot({ profile: 'car', x: cx, y: y + 0.15, z: cz, type: 'car' });
    }
    ctx.addLight(x - 10, y + 2.8, z, 0xffd0a0, l === 0 ? 8 : 0.1, 12);
  }
  b.box(x, gy + levels * 3.2 + 0.1, z, 34, 0.3, 28, 'concrete', { tex: 4, collide: false, tint: [0.5, 0.5, 0.48] });
  ctx.addLight(x + 10, gy + 1.0, z + 10, 0xffc070, 6, 10);
  ctx.markLocation({ type: 'garage', x, z, y: gy, name: 'Parking Structure', icon: 'ruin' });
}

// ---------------------------------------------------------------------------
// MILITARY EXCLUSION ZONE
// ---------------------------------------------------------------------------
export function buildMilitary(ctx) {
  const r = makeRng(5505);
  const cx = 430;
  const cz = 720;
  ctx.region = 4;
  ctx.registerRegion(4, cx, cz, 480);
  ctx.terrain.addRoad([[cx - 260, cz - 200], [cx, cz], [cx + 240, cz + 180]], 10);
  ctx.terrain.prepare();

  // the central bunker and lab
  ctx.occupy(cx, cz, 30, 30);
  bunker(ctx, cx, cz, { name: 'Bunker K-9' });
  ctx.occupy(cx + 150, cz + 120, 40, 32);
  labComplex(ctx, cx + 150, cz + 120);
  // barracks
  ctx.occupy(cx - 150, cz + 130, 30, 24);
  apartment(ctx, cx - 150, cz + 130, { floors: 2, w: 18, d: 11, name: 'Barracks C' });
  // armory / supply depot
  ctx.occupy(cx + 150, cz - 140, 40, 30);
  warehouse(ctx, cx + 150, cz - 140, { name: 'Armory Depot' });
  // checkpoints on the approach roads
  checkpoint(ctx, cx - 170, cz - 140, 0);
  checkpoint(ctx, cx + 90, cz + 60, Math.PI / 2);
  // watchtowers & perimeter fences
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    const x = cx + Math.cos(ang) * 210;
    const z = cz + Math.sin(ang) * 200;
    if (!ctx.areaFree(x, z, 6, 6)) continue;
    P.watchtower(ctx.builder, x, z, ctx.groundY(x, z));
    ctx.occupy(x, z, 6, 6);
  }
  for (let i = 0; i < 16; i++) {
    const x = cx - 240 + i * 30;
    P.chainlink(ctx.builder, x, cz - 240, ctx.groundY(x, cz - 240), 0, 30, 3.0);
    P.chainlink(ctx.builder, x, cz + 240, ctx.groundY(x, cz + 240), 0, 30, 3.0);
  }
  // motor pool, tents, crates and a helipad
  for (let i = 0; i < 3; i++) {
    const x = cx - 90 + i * 26;
    const z = cz + 30;
    if (!ctx.areaFree(x, z, 12, 10)) continue;
    ctx.occupy(x, z, 12, 10);
    P.truckWreck(ctx.builder, x, z, ctx.groundY(x, z), i * 1.1);
  }
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * TAU;
    const x = cx + Math.cos(ang) * 70;
    const z = cz + Math.sin(ang) * 64;
    if (!ctx.areaFree(x, z, 8, 8)) continue;
    ctx.occupy(x, z, 8, 8);
    P.tent(ctx.builder, x, z, ctx.groundY(x, z), ang);
    if (i % 3 === 0) ctx.addLoot({ profile: 'military', x: x + 2.4, y: ctx.groundY(x, z), z, type: 'crate' });
  }
  for (let i = 0; i < 16; i++) {
    const x = cx - 120 + (i % 8) * 22;
    const z = cz - 150 + Math.floor(i / 8) * 12;
    if (!ctx.areaFree(x, z, 3, 3)) continue;
    ctx.occupy(x, z, 3, 3);
    const gy = ctx.groundY(x, z);
    for (let k = 0; k < 1 + (i % 3); k++) {
      ctx.builder.box(x, gy + 0.4 + k * 0.75, z, 1.5, 0.75, 1.1, 'wood', { tex: 1.6, collideTag: 'container', tint: [0.45, 0.4, 0.3] });
    }
    if (i % 2 === 0) ctx.addLoot({ profile: 'military', x: x + 1.8, y: ctx.groundY(x, z), z, type: 'crate' });
  }
  // radar dish + antenna
  P.satelliteDish(ctx.builder, cx - 60, cz + 60, ctx.groundY(cx - 60, cz + 60), 1.0);
  P.antennaMast(ctx.builder, cx + 60, cz + 30, ctx.groundY(cx + 60, cz + 30), 18);
  ctx.addBossArena({ boss: 'paleCommander', x: cx, z: cz - 60, radius: 30 });
  ctx.markLocation({ type: 'military', x: cx, z: cz, y: ctx.groundY(cx, cz), name: 'Military Exclusion Zone', icon: 'military' });
  ctx.addSpawnZone({ region: 4, mutant: 'brute', x: cx - 100, z: cz - 100, radius: 130, count: 3 });
  ctx.addSpawnZone({ region: 4, mutant: 'contaminated', x: cx + 100, z: cz + 40, radius: 120, count: 3 });
  ctx.addSpawnZone({ region: 4, mutant: 'stalker', x: cx + 60, z: cz - 160, radius: 110, count: 3 });
  ctx.addSpawnZone({ region: 4, mutant: 'pale', x: cx - 180, z: cz - 60, radius: 90, count: 1 });
  ctx.addSpawnZone({ region: 4, mutant: 'watcher', x: cx + 200, z: cz + 140, radius: 80, count: 2 });
}

// ---------------------------------------------------------------------------
// THE RED WASTELAND
// ---------------------------------------------------------------------------
export function buildWasteland(ctx) {
  const r = makeRng(6606);
  const cx = 1130;
  const cz = 1090;
  ctx.region = 5;
  ctx.registerRegion(5, cx, cz, 560);
  ctx.terrain.addRoad([[cx - 300, cz - 300], [cx - 100, cz - 60], [cx + 160, cz + 180]], 7);
  ctx.terrain.prepare();

  // dead forest
  for (let i = 0; i < 260; i++) {
    const ang = r() * TAU;
    const rad = Math.sqrt(r()) * 480;
    const x = cx + Math.cos(ang) * rad;
    const z = cz + Math.sin(ang) * rad;
    if (!ctx.areaFree(x, z, 4, 4) || ctx.roadDistance(x, z) < 5) continue;
    const y = ctx.groundY(x, z);
    if (r() < 0.7) P.treeDead(ctx.builder, x, z, y, 0.7 + r() * 1.1);
    else P.rock(ctx.builder, x, z, y, 0.8 + r() * 2.4);
    ctx.builder.colliders.addCylinder(x, y + 2, z, 0.3, 4);
  }
  // toxic lakes
  ctx.addHazardPool({ x: cx + 60, z: cz - 200, radius: 26, kind: 'toxic' });
  ctx.addHazardPool({ x: cx - 220, z: cz + 180, radius: 34, kind: 'toxic' });
  ctx.addHazardPool({ x: cx + 300, z: cz + 120, radius: 20, kind: 'chemical' });
  // mutant nests
  for (let i = 0; i < 5; i++) {
    const ang = r() * TAU;
    const x = cx + Math.cos(ang) * (120 + r() * 280);
    const z = cz + Math.sin(ang) * (120 + r() * 280);
    if (!ctx.areaFree(x, z, 12, 12)) continue;
    ctx.occupy(x, z, 12, 12);
    ctx.addNest({ x, z, name: 'Mutant Nest' });
  }
  // reactor ruin: the endgame site
  const rx = cx + 140;
  const rz = cz + 170;
  if (ctx.areaFree(rx, rz, 60, 60)) {
    ctx.occupy(rx, rz, 60, 60);
    reactorRuin(ctx, rx, rz);
  }
  // geological anomalies
  for (let i = 0; i < 18; i++) {
    const ang = r() * TAU;
    const x = cx + Math.cos(ang) * (80 + r() * 400);
    const z = cz + Math.sin(ang) * (80 + r() * 400);
    if (!ctx.areaFree(x, z, 5, 5)) continue;
    const y = ctx.groundY(x, z);
    P.blob(ctx.builder, x, y + 0.4, z, 1.2 + r() * 2.8, 0.8 + r() * 2.4, 1.2 + r() * 2.4, 'rock', { detail: 1, rand: 0.6, seed: i, tint: [1.15, 0.82, 0.7] });
  }
  ctx.addBossArena({ boss: 'contaminatedTitan', x: cx - 40, z: cz - 40, radius: 34 });
  ctx.markLocation({ type: 'wasteland', x: cx, z: cz, y: ctx.groundY(cx, cz), name: 'The Red Wasteland', icon: 'radiation' });
  ctx.addSpawnZone({ region: 5, mutant: 'contaminated', x: cx, z: cz, radius: 180, count: 6 });
  ctx.addSpawnZone({ region: 5, mutant: 'crawler', x: cx - 180, z: cz - 120, radius: 140, count: 5, pack: true });
  ctx.addSpawnZone({ region: 5, mutant: 'stalker', x: cx + 180, z: cz - 160, radius: 130, count: 4 });
  ctx.addSpawnZone({ region: 5, mutant: 'brute', x: cx - 240, z: cz + 200, radius: 110, count: 3 });
  ctx.addSpawnZone({ region: 5, mutant: 'pale', x: cx + 240, z: cz + 240, radius: 120, count: 2 });
}

function reactorRuin(ctx, x, z) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  ctx.addPad(x, z, 60, 60, gy - 1);
  // vast crater basin
  b.cylinder(x, gy - 6, z, 26, 30, 2, 'concreteFloor', { seg: 24, tex: 6, collideTag: 'floor' });
  // ruined reactor building: shell with broken sections
  const w = 34;
  const d = 30;
  b.box(x, gy - 0.2, z, w + 2, 0.5, d + 2, 'concrete', { tex: 6, collideTag: 'floor' });
  // wall segments with gaps
  for (const [side, sx, sz, len, rot] of [['n', 0, -d / 2, w, 0], ['s', 0, d / 2, w, 0], ['w', -w / 2, 0, d, Math.PI / 2], ['e', w / 2, 0, d, Math.PI / 2]]) {
    const segs = 3;
    for (let i = 0; i < segs; i++) {
      if ((side === 'n' && i === 1) || (side === 's' && i === 2) || (side === 'w' && i === 0) || (side === 'e' && i === 2)) continue;
      const off = (i - (segs - 1) / 2) * (len / segs);
      const cx = x + sx + Math.cos(rot + Math.PI / 2) * off;
      const cz = z + sz + Math.sin(rot + Math.PI / 2) * off;
      const h = 9 + (i % 2) * 4;
      b.box(cx, gy + h / 2, cz, len / segs, h, 0.7, 'concrete', { tex: 3, rotY: -rot });
    }
  }
  // reactor core pillar
  b.cylinder(x, gy + 5, z, 4.5, 5.2, 10, 'metalPlate', { seg: 16, tex: 3, tint: [0.3, 0.32, 0.3] });
  b.cylinder(x, gy + 10.4, z, 5.4, 4.6, 1.2, 'rust', { seg: 16, tex: 2 });
  b.cylinder(x, gy + 12, z, 1.2, 2.0, 3.0, 'rust', { seg: 10, tex: 1.6 });
  // glowing core fragments
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * TAU;
    const rr = 2 + Math.random() * 3.4;
    b.glow(x + Math.cos(a) * rr, gy + 2 + Math.random() * 6, z + Math.sin(a) * rr, 0.18, 0.18, 0.18, 0x9aff70, { intensity: 1.6 });
  }
  ctx.addLight(x, gy + 4, z, 0x8aff60, 22, 26);
  ctx.addLight(x + 8, gy + 1.5, z - 6, 0x8aff60, 9, 14);
  // catwalk ring
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const cxw = x + Math.cos(a) * 12;
    const czw = z + Math.sin(a) * 12;
    b.box(cxw, gy + 4.2, czw, 6.5, 0.2, 2.2, 'metalPlate', { tex: 1.4, rotY: -a, tint: [0.4, 0.42, 0.4], collide: false });
  }
  // wrecked containment tanks
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    const px = x + Math.cos(a) * 19;
    const pz = z + Math.sin(a) * 19;
    b.cylinder(px, gy + 2.2, pz, 2.2, 2.2, 4.4, 'rust', { seg: 12, tex: 2.4, tint: [0.6, 0.5, 0.42] });
    b.glow(px, gy + 4.5, pz, 1.8, 0.1, 1.8, 0x8aff60, { intensity: 0.8 });
  }
  ctx.addLoot({ profile: 'boss', x: x + 6, y: gy, z: z + 6, type: 'cache' });
  ctx.addLoot({ profile: 'lab', x: x - 8, y: gy, z: z - 4, type: 'crate' });
  ctx.markLocation({ type: 'reactor', x, z, y: gy, name: 'Reactor Ruin "The Source"', icon: 'radiation' });
  ctx.addBossArena({ boss: 'lastSignal', x, z, radius: 34 });
  ctx.addSafeZone(x - 40, z + 40, 6);
}

export const REGION_BUILDERS = [buildSuburbs, buildForest, buildIndustrial, buildCity, buildMilitary, buildWasteland];
