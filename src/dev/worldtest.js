// Headless generation smoke test: builds the full world with stubbed systems
// and reports real generation statistics and runtime errors to the test runner.
import * as THREE from 'three';
import { TextureLib } from '../engine/textures.js';
import { CollisionWorld } from '../engine/collision.js';
import { SkySystem } from '../engine/sky.js';
import { PostFX } from '../engine/postfx.js';
import { World } from '../world/world.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1400);
const textures = new TextureLib(renderer, { size: 512 });
const collision = new CollisionWorld();

const log = [];
const stub = (name) => new Proxy({}, {
  get: (t, k) => {
    if (k === 'then') return undefined;
    if (!(k in t)) t[k] = (...args) => { log.push(`${name}.${String(k)}(${args.map((a) => typeof a === 'object' ? 'obj' : String(a)).join(',')})`); return undefined; };
    return t[k];
  },
});

const game = {
  scene,
  renderer,
  camera,
  textures,
  collision,
  player: { position: new THREE.Vector3(0, 0, 0), health: 100, healthMax: 100 },
  inventory: null,
  hud: stub('hud'),
  audio: stub('audio'),
  fx: stub('fx'),
  ui: stub('ui'),
  input: stub('input'),
  settings: { shadows: false },
  rng: Math.random,
  radioPlaylist: [],
  radio: null,
};

const sky = new SkySystem(scene, renderer);
sky.timeOfDay = 11;
const postfx = new PostFX(renderer, scene, camera);
game.sky = sky;
game.postfx = postfx;

const results = [];
function test(name, fn) {
  const t0 = performance.now();
  try {
    const value = fn();
    results.push({ name, ok: true, ms: Math.round(performance.now() - t0), value });
  } catch (err) {
    results.push({ name, ok: false, ms: Math.round(performance.now() - t0), error: err.message + '\n' + (err.stack || '') });
  }
}

const world = new World(game);
game.world = world;

test('world.generate', () => {
  const t0 = performance.now();
  world.generate();
  return { ...world.generationStats, totalMs: Math.round(performance.now() - t0) };
});

test('counts', () => ({
  doors: world.doors.length,
  lootables: world.lootables.length,
  npcs: world.npcs.length,
  lights: world.lights.length,
  locations: world.locations.length,
  spawnZones: world.spawnZones.length,
  bossArenas: world.bossArenas.length,
  caves: world.locations.filter((l) => l.type === 'cave').length,
  safeZones: world.safeZones.length,
}));

test('distinct mutants in spawn zones', () => {
  const set = new Set(world.spawnZones.map((z) => z.mutant));
  return { list: [...set].sort(), count: set.size };
});

test('bosses placed', () => ({ list: world.bossArenas.map((b) => b.boss) }));

test('region names', () => {
  const pts = [[-1050, -1050], [-420, -1080], [-40, -330], [760, -260], [430, 720], [1130, 1090]];
  return pts.map(([x, z]) => world.regionAt(x, z));
});

test('surfaces', () => {
  const pts = [[0, 0], [-900, -900], [300, 300], [760, -260]];
  return pts.map(([x, z]) => world.surfaceAt(new THREE.Vector3(x, world.groundY(x, z) + 0.05, z)));
});

test('collision floor at shelter', () => {
  const gx = -700;
  const gz = -640;
  const y = world.groundY(gx, gz);
  return { groundY: +y.toFixed(2), floor: collision.floorAt(gx + 1, y + 1.2, gz + 1) };
});

test('loot search produces items', () => {
  const target = world.lootables[0];
  target.searched = false;
  const items = target.search();
  const second = target.search();
  return { type: target.type, profile: target.profile, stacks: items.length, firstSearchEmpty: second.length === 0, items: items.slice(0, 6).map((i) => `${i.id} x${i.qty}`) };
});

test('render 90 frames', () => {
  const t0 = performance.now();
  let frames = 0;
  camera.position.set(-700, world.groundY(-700, -640) + 8, -600);
  camera.lookAt(-700, 0, -660);
  for (let i = 0; i < 90; i++) {
    sky.update(1 / 60, camera, camera.position);
    postfx.render(1 / 60);
    frames++;
  }
  const ms = performance.now() - t0;
  return { frames, ms: Math.round(ms), avgFrameMs: +(ms / frames).toFixed(1) };
});

const failed = results.filter((r) => !r.ok);
window.__result = { ok: failed.length === 0, results, log: log.slice(0, 40) };
window.__done = true;
console.log('WORLDTEST ' + JSON.stringify(window.__result));
