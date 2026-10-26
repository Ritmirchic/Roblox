#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/browser_test.js — real-browser smoke test + screenshots
//
// Drives the built game in headless Chromium with SwiftShader.
// The suite is split into short sessions: software WebGL slowly
// leaks memory over hundreds of frames, so each session is capped.
//
// Requires (dev only): @sparticuz/chromium, puppeteer-core.
//   node tools/browser_test.js
// ============================================================
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import net from 'node:net';

const require = createRequire(import.meta.url);
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'qa', 'browser');
await mkdir(outDir, { recursive: true });

const PHASE = process.env.PHASE || 'all';
const only = (name) => PHASE === 'all' || PHASE.split(',').includes(name);
const PORT = Number(process.env.BROWSER_PORT || 8123);
const W = Number(process.env.BROWSER_W || 1024);
const H = Number(process.env.BROWSER_H || 576);

const free = await new Promise((resolve) => {
  const s = net.createServer();
  s.once('error', () => resolve(false));
  s.once('listening', () => s.close(() => resolve(true)));
  s.listen(PORT, '127.0.0.1');
});
if (!free) { console.error(`port ${PORT} is busy`); process.exit(1); }

const server = spawn(process.execPath, [path.join(root, 'tools/serve.js'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const errors = [];
const logs = [];
let failed = 0;
let page = null;
let browser = null;

const assert = (cond, msg) => {
  if (cond) console.log('  ok   ' + msg);
  else { failed++; console.log('  FAIL ' + msg); }
};
const flush = async () => { try { await writeFile(path.join(outDir, 'console.log'), logs.join('\n')); } catch (_) {} };
const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name + '.png') }); console.log('  shot', name); await flush(); };
// headless shell can stall requestAnimationFrame for minutes between
// screenshots, so never wait on it without a deadline; the sim is advanced by
// hand afterwards when a test needs the world to move on.
const frames = (n = 3) => page.evaluate((n) => new Promise((res) => {
  let i = 0, done = false;
  const finish = () => { if (!done) { done = true; res(); } };
  const tick = () => { if (++i >= n) finish(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  setTimeout(finish, 4000);
}), n);
const clearNotes = () => page.evaluate(() => {
  document.querySelectorAll('#notifications .note').forEach((n) => n.remove());
  if (window.game) game.ui.hud.noteTimers = [];
});

async function session(name, fn) {
  console.log(`\n— ${name} —`);
  // @sparticuz/chromium ships --single-process + --in-process-gpu, which turns any
  // SwiftShader hiccup into a dead browser. Run the GPU in its own process instead.
  const dropArgs = new Set(['--single-process', '--in-process-gpu', '--no-zygote']);
  browser = await puppeteer.launch({
    args: [
      ...chromium.args.filter((a) => !dropArgs.has(a)),
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
      `--window-size=${W},${H}`,
    ],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    protocolTimeout: 600000,
  });
  page = await browser.newPage();
  page.setDefaultTimeout(300000);
  page.on('console', (m) => {
    const line = `[${m.type()}] ${m.text()}`;
    logs.push(line);
    if (m.type() === 'error') { errors.push(line); console.log('  console error:', line.slice(0, 220)); }
  });
  page.on('pageerror', (e) => {
    const line = 'pageerror: ' + e.message;
    errors.push(line);
    console.log('  PAGE ERROR', line.slice(0, 300));
  });
  await page.goto(`http://127.0.0.1:${PORT}/?lite=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.game && window.game.mode === 'menu', { timeout: 300000, polling: 500 });
  await page.evaluate(() => {
    game.settings.renderScale = 0.5;
    game.settings.shadows = false;
    game.applySettings();
  });
  try {
    await fn();
  } catch (e) {
    failed++;
    console.log('  FAIL session crashed:', e.message);
    try { await shot('00_crash'); } catch (_) {}
  }
  await flush();
  try { await browser.close(); } catch (_) {}
  browser = null;
  await new Promise((r) => setTimeout(r, 400));
}

console.log('\nASHES OF HUMANITY — real-browser test\n');
const engineCheck = async () => {
  const engine = await page.evaluate(() => ({
    webgl2: game.renderer.capabilities.isWebGL2,
    tris: game.renderer.info.render.triangles,
    calls: game.renderer.info.render.calls,
    pois: game.world.pois.length,
    loot: game.world.lootSpots.length,
    doors: game.world.doorSpecs.length,
    colliders: game.world.colliders.count,
    genMs: Math.round(game.world.genMs),
  }));
  console.log('  engine:', JSON.stringify(engine));
  assert(engine.webgl2, 'WebGL2 context');
  assert(engine.tris > 100000, 'world renders ' + engine.tris + ' triangles');
  assert(engine.pois >= 30 && engine.doors >= 100 && engine.colliders > 8000, 'world content generated');
};

// ---------------------------------------------------------------- 1. title screen
if (only('title')) await session('title screen', async () => {
  await engineCheck();
  await frames(2);
  await shot('01_menu');
});

// ---------------------------------------------------------------- 2. shelter + surface
if (only('world')) await session('shelter, surface, camp', async () => {
  await page.evaluate(() => game.startNewGame());
  await page.waitForFunction(() => game.mode === 'playing', { timeout: 180000, polling: 500 });
  await new Promise((r) => setTimeout(r, 1500));
  assert(await page.evaluate(() => game.mode === 'playing'), 'New Game enters play');
  await frames(2);
  await clearNotes();
  await shot('02_shelter');
  const start = await page.evaluate(() => ({
    underground: game.player.pos.y < game.world.heightAt(game.player.pos.x, game.player.pos.z) - 3,
    hp: game.player.stats.health,
    quest: game.quests.tracked,
    battery: Math.round(game.player.flashlightBattery),
  }));
  console.log('  start:', JSON.stringify(start));
  assert(start.underground, 'starts inside Shelter 12');
  assert(start.quest === 'm01', 'opening objective active');

  // Headless shell throttles requestAnimationFrame to almost nothing while no
  // screenshot is being produced, so drive the fixed-step loop by hand: the key
  // event still goes through the real window listener.
  await page.keyboard.down('KeyW');
  const walk = await page.evaluate(() => {
    const keySeen = !!game.input.keys.KeyW;
    const p0 = game.player.pos.clone();
    for (let i = 0; i < 120; i++) game.step(1 / 60);
    return { keySeen, moved: +p0.distanceTo(game.player.pos).toFixed(2), y: +game.player.pos.y.toFixed(2) };
  });
  await page.keyboard.up('KeyW');
  console.log('  walk:', JSON.stringify(walk));
  assert(walk.keySeen, 'W key reaches the game input');
  assert(walk.moved > 1.5, 'WASD walks the survivor (' + walk.moved + ' m in 2 s)');

  await page.evaluate(() => {
    const x = -300, z = 262;
    game.player.pos.set(x, game.world.heightAt(x, z) + 0.1, z);
    game.player.yaw = Math.PI / 2;
    game.player.pitch = -0.02;
    game.player.flashlightOn = false;
    game.sky.dayTime = 0.34;
    game.sky.setWeather('clear', true);
    game.quests.tracked = null;
  });
  await frames(4);
  await clearNotes();
  await shot('03_suburbs');

  const camp = await page.evaluate(() => {
    const n = game.npcs.list.find((x) => x.id === 'nika');
    game.player.pos.set(n.x + 1.6, n.y + 0.1, n.z + 1.6);
    game.player.yaw = Math.atan2(n.x - game.player.pos.x, n.z - game.player.pos.z);
    game.player.pitch = -0.02;
    return n.def.name;
  });
  await frames(4);
  await clearNotes();
  await shot('04_camp');
  await page.evaluate(() => game.npcs.open(game.npcs.list.find((x) => x.id === 'nika')));
  await new Promise((r) => setTimeout(r, 800));
  assert(await page.evaluate(() => game.ui.dialogueEl.classList.contains('open')), 'dialogue opens on ' + camp);
  await shot('05_dialogue');
  await page.evaluate(() => game.npcs.close());
});

// ---------------------------------------------------------------- 3. combat + night + boss
if (only('combat')) await session('combat, weather, boss', async () => {
  await page.evaluate(() => game.startNewGame());
  await page.waitForFunction(() => game.mode === 'playing', { timeout: 180000, polling: 500 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.evaluate(() => {
    const x = -260, z = 260;
    game.player.pos.set(x, game.world.heightAt(x, z) + 0.1, z);
    game.player.yaw = 0;
    game.player.pitch = -0.03;
    game.player.flashlightOn = false;
    game.sky.dayTime = 0.36;
    game.sky.setWeather('clear', true);
    game.quests.tracked = null;
    game.inventory.add('pistol', 1);
    game.inventory.add('ammo_9mm', 40);
    game.weapons.setWeapon('pistol');
    game.spawnEnemy('hollow', x, z - 8);
  });
  await frames(3);
  await clearNotes();
  await shot('06_combat');
  const res = await page.evaluate(() => {
    const e = game.enemies.filter((x) => !x.dead).sort((a, b) =>
      a.pos.distanceTo(game.player.pos) - b.pos.distanceTo(game.player.pos))[0];
    if (!e) return { missing: true };
    const from = game.player.eyePos.clone();
    const dir = e.center.clone().sub(from).normalize();
    const hp0 = e.hp;
    const r = game.combat.hitscan(from, dir, 45, { crit: 0.1 });
    return { hit: !!r.hit, hp0, hp1: e.hp, head: !!r.head };
  });
  console.log('  combat:', JSON.stringify(res));
  assert(res.hit && res.hp1 < res.hp0, 'hitscan damages a mutant');
  await page.evaluate(() => { game.weapons.state.mag = 8; game.weapons.fire(game.player.forward, game.player.eyePos.clone().addScaledVector(game.player.forward, 20)); });
  await frames(2);
  await shot('07_firefight');

  await page.evaluate(() => {
    game.sky.dayTime = 0.92;
    game.sky.setWeather('storm', true);
    game.player.flashlightOn = true;
  });
  await frames(5);
  await clearNotes();
  await shot('08_night_storm');

  const boss = await page.evaluate(() => {
    const a = game.world.arenas.hollow_church;
    game.player.pos.set(a.x + 6, game.world.heightAt(a.x + 6, a.z) + 0.1, a.z);
    game.player.yaw = Math.atan2(a.x - game.player.pos.x, a.z - game.player.pos.z);
    game.sky.dayTime = 0.95;
    game.sky.setWeather('fog', true);
    game.updateArenas(0.016);
    return { arena: a.id, bosses: game.bosses.length };
  });
  await frames(4);
  await clearNotes();
  await shot('09_boss');
  assert(boss.bosses > 0, 'boss spawns at ' + boss.arena);

  // save + load
  await page.evaluate(() => { game.player.pos.set(-340, game.world.heightAt(-340, 240) + 0.1, 240); game.saveGame(true); });
  assert(await page.evaluate(() => game.hasSave()), 'save written to localStorage');
  await page.evaluate(() => { game.player.pos.set(0, 40, 0); game.loadGame(); });
  const loaded = await page.evaluate(() => ({ x: +game.player.pos.x.toFixed(1), z: +game.player.pos.z.toFixed(1) }));
  assert(Math.abs(loaded.x + 340) < 2, 'load restores position (' + loaded.x + ',' + loaded.z + ')');
});

// ---------------------------------------------------------------- 4. every interface screen
if (only('ui')) await session('interface', async () => {
  await page.evaluate(() => game.startNewGame());
  await page.waitForFunction(() => game.mode === 'playing', { timeout: 180000, polling: 500 });
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => { game.freezeRender = true; game.ui.hud.setVisible(true); });
  await frames(1);
  for (const [screen, file] of [
    ['inventory', '10_inventory'], ['skills', '11_skills'], ['journal', '12_journal'],
    ['map', '13_map'], ['craft', '14_craft'], ['build', '15_build'], ['medical', '16_medical'],
    ['settings', '17_settings'], ['notes', '18_notes'],
  ]) {
    await page.evaluate((s) => game.ui.panels.open(s), screen);
    await new Promise((r) => setTimeout(r, 350));
    const len = await page.evaluate(() => game.ui.panels.root.innerHTML.length);
    assert(len > 800, screen + ' renders (' + len + ' chars)');
    await shot(file);
    await page.evaluate(() => game.ui.panels.close());
    await new Promise((r) => setTimeout(r, 200));
  }
  assert(await page.evaluate(() => game.mode === 'playing'), 'closing screens returns to play');
  await page.evaluate(() => game.ui.openPause());
  await frames(1);
  await shot('19_pause');
  await page.evaluate(() => game.ui.closePause());
  await page.evaluate(() => game.ui.showDeath('KILLED BY A HOLLOW'));
  await frames(1);
  await shot('20_death');
  await page.evaluate(() => { game.ui.hideDeath(); game.toMainMenu(); });
  await frames(1);
  await shot('21_menu');
  await page.evaluate(() => game.ui.panels.open('settings'));
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => game.ui.panels.close());
  await frames(1);
  assert(await page.evaluate(() => game.mode === 'menu' && document.getElementById('mainmenu').classList.contains('open')),
    'settings from the title screen returns to the title screen');
});

await flush();
console.log('\nconsole errors:', errors.length);
for (const e of errors.slice(0, 15)) console.log('  !', e.slice(0, 240));
console.log(failed ? `\n${failed} browser assertion(s) failed\n` : '\nall browser assertions passed\n');
try { server.kill('SIGTERM'); } catch (_) {}
process.exit(failed || errors.length ? 1 : 0);
