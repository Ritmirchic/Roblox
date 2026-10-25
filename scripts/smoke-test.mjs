#!/usr/bin/env node
/**
 * Headless gameplay smoke test.
 *
 * Boots the real scene code outside the browser (canvas polyfilled by @napi-rs/canvas,
 * no WebGL context needed because nothing is rasterised) and simulates an actual
 * expedition: thrusting, mining asteroids, collecting chunks, fighting spawned enemies.
 * Verifies that the systems move real state, not just that they are wired up.
 *
 * Usage: node --experimental-strip-types scripts/smoke-test.mjs
 */
import { createCanvas } from '@napi-rs/canvas';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// --------------------------------------------------------------- environment
const listeners = {};
const makeElement = () => ({
  style: {},
  addEventListener() {},
  removeEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }),
  appendChild() {},
  getContext: () => null,
});
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') {
      const c = createCanvas(1, 1);
      c.style = {};
      c.addEventListener = () => {};
      return c;
    }
    return makeElement();
  },
  getElementById: () => makeElement(),
  body: makeElement(),
};
globalThis.window = {
  innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
  addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
  removeEventListener() {},
  setInterval: () => 0, clearInterval() {}, setTimeout: () => 0,
  requestAnimationFrame: () => 0,
};
globalThis.performance = globalThis.performance ?? { now: () => Date.now() };
globalThis.localStorage = {
  store: new Map(),
  getItem(k) { return this.store.get(k) ?? null; },
  setItem(k, v) { this.store.set(k, v); },
  removeItem(k) { this.store.delete(k); },
};

const imp = (rel) => import(pathToFileURL(join(root, rel)).href);

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
};

console.log('\n============================================');
console.log(' SPACE MINER - HEADLESS GAMEPLAY SMOKE TEST');
console.log('============================================\n');

// ------------------------------------------------------------------- modules
console.log('[scene construction]');
const { GameState } = await imp('src/sim/gamestate.ts');
const { SpaceScene } = await imp('src/scenes/space.ts');
const { Input } = await imp('src/core/input.ts');
const { SECTORS } = await imp('src/data/sectors.ts');
const { buildHangar } = await imp('src/render/hangar3d.ts');
const { buildModuleMesh } = await imp('src/render/modules3d.ts');
const { MODULES } = await imp('src/data/modules.ts');
const { CREW_CARDS } = await imp('src/data/crew.ts');
const { renderCardFace } = await imp('src/render/cardart.ts');

const hangar = buildHangar('low');
let hangarMeshes = 0;
hangar.group.traverse((o) => { if (o.isMesh) hangarMeshes++; });
check('hangar environment builds', hangarMeshes > 30, `${hangarMeshes} meshes, ${hangar.stations.length} stations`);
hangar.update(1.5, 0.016);
check('hangar animation tick runs', true);

let moduleMeshFailures = 0;
let totalTriangles = 0;
for (const def of MODULES) {
  try {
    const built = buildModuleMesh(def.id);
    let tris = 0;
    built.group.traverse((o) => {
      if (o.isMesh && o.geometry?.attributes?.position) tris += o.geometry.attributes.position.count / 3;
    });
    totalTriangles += tris;
    if (tris < 20) { console.log(`        ${def.id} only has ${tris} triangles`); moduleMeshFailures++; }
  } catch (err) {
    console.log(`        ${def.id}: ${err.message}`);
    moduleMeshFailures++;
  }
}
check('every module builds real geometry', moduleMeshFailures === 0,
  `${MODULES.length} modules, ${Math.round(totalTriangles).toLocaleString()} triangles total`);

let cardFailures = 0;
for (const card of CREW_CARDS) {
  try {
    const canvas = createCanvas(1, 1);
    renderCardFace(canvas, card, 220, 308);
    const buf = canvas.toBuffer('image/png');
    if (buf.length < 8000) cardFailures++;
  } catch (err) {
    console.log(`        ${card.id}: ${err.message}`);
    cardFailures++;
  }
}
check('all 44 crew cards render original art', cardFailures === 0, `${CREW_CARDS.length} cards`);

// ---------------------------------------------------------------- expedition
console.log('\n[expedition simulation]');
const state = new GameState();
state.addCredits(500000);
// Build a capable ship so weapons, magnets and shields are exercised.
const layout = [
  ['magnet_advanced', [-2, 0, 0], 3],
  ['gun_machine', [2, 0, 0], 1],
  ['shield_gen', [0, 0, -2], 2],
  ['generator', [-2, 0, -1], 0],
];
for (const [defId, pos] of layout) state.ship.buyCell(pos);
state.ship.buyCell([1, 0, -1]);
for (const [defId, pos, orientation] of layout) {
  state.buyModule(defId);
  state.takeFromInventory(defId);
  const result = state.ship.place(defId, pos, orientation ?? 0);
  if (result && 'code' in result) console.log(`        placement rejected: ${defId} (${result.code})`);
}
const stats = state.ship.stats();
check('test ship assembled', state.ship.modules.length >= 7,
  `${state.ship.modules.length} modules, ${Math.round(stats.mass)}t, thrust ${Math.round(stats.thrust)}kN`);

const input = new Input(makeElement());
const scene = new SpaceScene(state, input, SECTORS[0], 'low');
scene.start();

const asteroidsAtStart = scene.asteroids.length;
check('sector field populated', asteroidsAtStart > 10, `${asteroidsAtStart} asteroids`);

// Fly forward for a second.
input.keys.add('KeyW');
for (let i = 0; i < 60; i++) scene.update(1 / 60);
const movedDistance = scene.shipPivot.position.length();
check('thrust moves the ship', movedDistance > 1, `${movedDistance.toFixed(1)} units travelled`);
check('velocity is finite and sane', Number.isFinite(scene.velocity.length()) && scene.velocity.length() < 400,
  `${scene.velocity.length().toFixed(1)} m/s`);

// Park next to an asteroid and mine it with the right mouse button.
const target = scene.asteroids[0];
scene.shipPivot.position.copy(target.mesh.position.clone().add({ x: 0, y: 0, z: -(target.radius + 30) }));
scene.velocity.set(0, 0, 0);
scene.shipPivot.quaternion.identity();
input.keys.delete('KeyW');
input.mouse.right = true;
const healthBefore = target.health;
let destroyed = 0;
for (let i = 0; i < 600; i++) {
  scene.update(1 / 60);
  if (!scene.asteroids.includes(target)) { destroyed = 1; break; }
}
check('mining lasers damage asteroids', destroyed === 1 || target.health < healthBefore,
  destroyed ? 'asteroid destroyed' : `${Math.round(healthBefore - target.health)} damage dealt`);
check('mining spawns collectible chunks', scene.chunks.length > 0 || scene.hud.cargo > 0,
  `${scene.chunks.length} chunks in flight, ${Math.round(scene.hud.cargo)} units in cargo`);

// Let magnets pull the ore in.
input.mouse.right = false;
for (let i = 0; i < 400; i++) scene.update(1 / 60);
check('magnets collect ore into cargo', scene.hud.cargo > 0,
  `${Math.round(scene.hud.cargo)} / ${Math.round(scene.hud.cargoCap)} cargo`);
check('ore manifest tracks resource types', Object.keys(scene.hud.ore).length > 0,
  Object.entries(scene.hud.ore).map(([k, v]) => `${k}:${Math.round(v)}`).join(' '));

// Combat: fast-forward until enemies spawn, then open fire.
input.mouse.left = true;
let framesWaited = 0;
while (scene.enemies.length === 0 && framesWaited < 3000) { scene.update(1 / 60); framesWaited++; }
check('enemies spawn during the expedition', scene.enemies.length > 0,
  `${scene.enemies.length} hostiles after ${(framesWaited / 60).toFixed(1)}s`);

if (scene.enemies.length > 0) {
  const enemy = scene.enemies[0];
  const hullBefore = enemy.hull + enemy.shield;
  const enemyStart = enemy.group.position.clone();
  // Point the ship at the target so turrets and projectiles engage.
  for (let i = 0; i < 1800 && scene.enemies.includes(enemy); i++) {
    const dir = enemy.group.position.clone().sub(scene.shipPivot.position).normalize();
    scene.shipPivot.lookAt(scene.shipPivot.position.clone().add(dir));
    scene.update(1 / 60);
  }
  const killed = !scene.enemies.includes(enemy);
  check('weapons damage enemy craft', killed || enemy.hull + enemy.shield < hullBefore,
    killed ? 'enemy destroyed' : `${Math.round(hullBefore - enemy.hull - enemy.shield)} damage`);
  check('enemy AI moves the craft', killed || enemy.group.position.distanceTo(enemyStart) > 1,
    killed ? 'target eliminated' : `${enemy.group.position.distanceTo(enemyStart).toFixed(1)} units manoeuvred`);
}

check('HUD reports live telemetry', Number.isFinite(scene.hud.hull) && scene.hud.maxHull > 0 && scene.hud.radarBlips.length >= 0,
  `hull ${Math.round(scene.hud.hull)}/${Math.round(scene.hud.maxHull)}, ${scene.hud.radarBlips.length} radar contacts`);

// Complete the run and bank the rewards.
const summary = scene.complete(false);
check('expedition summary pays out', summary.credits > 0 || summary.oreUnits > 0,
  `${summary.credits} CR, ${summary.oreUnits} ore, ${summary.asteroidsMined} rocks, ${summary.enemiesKilled} kills`);

const creditsBefore = state.credits;
state.addCredits(summary.credits);
check('credits bank correctly', state.credits === creditsBefore + summary.credits);

// --------------------------------------------------------------- persistence
console.log('\n[persistence]');
state.grantCard(CREW_CARDS[5].id);
const saved = state.save(globalThis.localStorage);
check('save writes to storage', saved === true);
const reloaded = GameState.load(globalThis.localStorage);
check('save round-trips the ship', reloaded.ship.modules.length === state.ship.modules.length,
  `${reloaded.ship.modules.length} modules restored`);
check('save round-trips the collection', reloaded.crew.size === state.crew.size,
  `${reloaded.crew.size} cards restored`);
check('save round-trips currencies', Math.round(reloaded.credits) === Math.round(state.credits));

console.log('\n--------------------------------------------');
console.log(failures === 0 ? ' SMOKE TEST PASSED' : ` SMOKE TEST FAILED (${failures} problems)`);
console.log('--------------------------------------------\n');
process.exit(failures === 0 ? 0 : 1);
