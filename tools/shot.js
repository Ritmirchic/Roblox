// Offline screenshot tool: loads the world headlessly and renders views to PNG.
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { Raster, collectTriangles } from './raster.js';
import { writePNG } from './png.js';

const args = process.argv.slice(2);
const only = args[0] || 'all';
const W = 1200, H = 675;

console.log('generating world...');
const t0 = Date.now();
const scene = new THREE.Scene();
const world = new World(scene, { seed: 20261026 });
await world.generate();
console.log(`world: ${Date.now() - t0}ms, ${world.staticInfo.meshes} meshes, ${world.staticInfo.tris} tris`);

const t1 = Date.now();
const { tris } = collectTriangles(scene);
console.log(`tri extraction: ${Date.now() - t1}ms, ${tris.length} tris`);

const r = new Raster(W, H);

const VIEWS = {
  shelter_hatch: { pos: [-360, 0, 195], dir: [0, -2, -35], eye: 1.7 },
  suburb_street: { pos: [-430, 0, 250], dir: [1, 0, 0.15], eye: 1.7, yaw: 'road' },
  suburb_house: { pos: [-404, 4, 322], dir: [0, -2, -1], eye: 6, look: [-400, 2, 300] },
  church_arena: { pos: [-520, 4, 150], dir: [0, -1.5, -1], eye: 3, look: [-520, 3, 120] },
  forest_cabin: { pos: [-489, 3, -250], dir: [-1, -1, -1], eye: 2.2, look: [-500, 2, -260] },
  forest_deep: { pos: [-420, 0, -180], dir: [0.2, -0.2, -1], eye: 1.7 },
  industrial_tanks: { pos: [60, 2, 280], dir: [0.5, 0.1, -1], eye: 2 },
  industrial_stack: { pos: [250, 4, 260], dir: [0, 0.2, -1], eye: 2 },
  city_hospital: { pos: [40, 4, -262], dir: [0, 0, -1], eye: 2 },
  city_street: { pos: [-30, 2, -200], dir: [1, 0, -0.4], eye: 1.8 },
  military_gate: { pos: [520, 3, -35], dir: [0, 0, -1], eye: 2 },
  wasteland_crater: { pos: [480, 6, 230], dir: [0.5, -0.1, 0.5], eye: 2 },
  signal_array: { pos: [640, 4, 165], dir: [0, 0.3, -1], eye: 2 },
  foundry: { pos: [230, 4, 445], dir: [0, 0.2, -1], eye: 2.5 },
  interior_house: { pos: null, interior: true },
};

function ground(pos, eye = 1.7) {
  const [x, , z] = pos;
  return [x, world.terrain.heightAt(x, z) + eye, z];
}

function shoot(name, v) {
  r.sunDir = new THREE.Vector3(-0.5, 0.58, 0.42).normalize();
  r.sunPower = 1.35;
  r.skyColor = [0.42, 0.50, 0.62];
  r.fogColor = [0.60, 0.63, 0.64];
  r.fogDensity = 0.0055;
  r.shadows = true;
  const pos = v.pos ? ground(v.pos, v.eye ?? 1.7) : [0, 1.7, 0];
  let target;
  if (v.look) target = v.look;
  else {
    const d = v.dir || [0, 0, -1];
    target = [pos[0] + d[0] * 20, pos[1] + d[1] * 20, pos[2] + d[2] * 20];
  }
  r.prepareShadow(tris, [(pos[0] + target[0]) / 2, 1, (pos[2] + target[2]) / 2], 55);
  const px = r.render(tris, { pos, target, fov: v.fov ?? 62, near: 0.1, far: 700 });
  writePNG(`/home/user/Roblox/qa/${name}.png`, px, W, H);
  console.log('  ->', name, r.stats.drawn, 'tris drawn');
}

// interior shot: inside the shelter (player start)
{
  const sp = world.startPosition;
  r.sunDir = new THREE.Vector3(-0.5, 0.7, 0.3).normalize();
  r.sunPower = 0.15;
  r.skyColor = [0.18, 0.22, 0.24];
  r.fogColor = [0.10, 0.12, 0.13];
  r.fogDensity = 0.03;
  r.prepareShadow(tris, [sp.x, 0, sp.z], 16);
  const px = r.render(tris, { pos: [sp.x - 2, sp.y + 1.65, sp.z + 2], target: [sp.x + 4, sp.y + 1.3, sp.z - 3], fov: 70 });
  writePNG('/home/user/Roblox/qa/interior_shelter.png', px, W, H);
  console.log('  -> interior_shelter');
}

for (const [name, v] of Object.entries(VIEWS)) {
  if (name === 'interior_house') continue;
  if (only !== 'all' && !name.includes(only)) continue;
  shoot(name, v);
}
