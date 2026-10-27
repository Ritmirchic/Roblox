#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/qa_shots.js — boots the built single-file game and writes the
// screenshots used in release/screenshots and the README.
//
//   node tools/qa_shots.js [outDir]
//
// Requires the dev-only packages puppeteer-core and @sparticuz/chromium.
// Rendering is frozen after every frame on purpose: SwiftShader renders a
// full 1.3M-triangle frame in seconds and a live loop makes screenshots flaky.
// ============================================================
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'release', 'screenshots'));
// optional filter: node tools/qa_shots.js out title_screen shelter_12 dead_suburbs
const norm = (s) => s.replace(/\.png$/, '').replace(/^\d+[a-z]?_/, '');
const only = new Set(process.argv.slice(3).map(norm));
const want = (name) => !only.size || only.has(norm(name));
await mkdir(outDir, { recursive: true });

// SwiftShader dies if the GPU shares the browser process — run it separately.
const drop = new Set(['--single-process', '--in-process-gpu', '--no-zygote']);
const ARGS = [
  ...chromium.args.filter((a) => !drop.has(a)),
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox', '--allow-file-access-from-files',
];

const VIEWS = [
  { file: '02_dead_suburbs.png', x: -300, z: 262, yaw: Math.PI / 2, pitch: 0.01, day: 0.36, weather: 'clear' },
  { file: '03_hollow_street_camp.png', x: -246, z: 254, yaw: 2.6, pitch: 0.01, day: 0.36, weather: 'clear' },
  { file: '04_overcast_highway.png', x: -300, z: 200, yaw: 0.9, pitch: 0.01, day: 0.42, weather: 'overcast' },
  { file: '05_night_rain.png', x: -330, z: 210, yaw: 2.2, pitch: 0.02, day: 0.86, weather: 'rain_heavy', light: true },
];

const PANELS = [
  ['skills', '06_skills.png'],
  ['map', '07_survey_map.png'],
  ['inventory', '08_inventory.png'],
  ['journal', '09_journal.png'],
  ['craft', '10_crafting.png'],
  ['medical', '11_medical.png'],
];

let errors = 0;
const log = (...a) => console.log(...a);

async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    args: ARGS,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    protocolTimeout: 600000,
  });
  try {
    return await fn(browser);
  } finally {
    try { await browser.close(); } catch (_) { /* ignore */ }
  }
}

async function openGame(browser, url) {
  const page = await browser.newPage();
  page.setDefaultTimeout(300000);
  page.on('pageerror', (e) => { errors++; log('  PAGE ERROR', e.message.slice(0, 200)); });
  page.on('console', (m) => { if (m.type() === 'error') { errors++; log('  console error', m.text().slice(0, 200)); } });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.game && window.game.mode === 'menu', { timeout: 300000, polling: 300 });
  log(`menu ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await page.evaluate(() => {
    game.settings.renderScale = 0.75;
    game.settings.shadows = false;
    game.applySettings();
    game.freezeRender = true;
  });
  return page;
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // ---- phase 1: menu, interior, exterior views -------------------------
  await withBrowser(async (browser) => {
    const page = await openGame(browser, pathToFileURL(path.join(root, 'dist', 'ashes_of_humanity.html')).href + '?lite=1');

    if (want('01_title_screen.png')) {
      await page.evaluate(() => { game.renderer.render(game.scene, game.camera); });
      await pause(400);
      await page.screenshot({ path: path.join(outDir, '01_title_screen.png') });
      log('  shot 01_title_screen');
    }

    await page.evaluate(() => game.startNewGame());
    await page.waitForFunction(() => game.mode === 'playing', { timeout: 120000, polling: 300 });

    if (want('01b_shelter_12.png')) {
    await page.evaluate(() => {
      game.player.pos.copy(game.world.startPosition);
      game.player.yaw = Math.PI;
      game.player.pitch = 0.03;
      game.player.flashlightOn = true;
      game.sky.setWeather('overcast', true);
      document.querySelectorAll('#notifications .note').forEach((n) => n.remove());
      for (let i = 0; i < 20; i++) game.step(1 / 60);
      game.renderer.render(game.scene, game.camera);
    });
    await pause(500);
    await page.screenshot({ path: path.join(outDir, '01b_shelter_12.png') });
    log('  shot 01b_shelter_12');
    }

    for (const v of VIEWS.filter((v) => want(v.file))) {
      await page.evaluate((v) => {
        game.player.pos.set(v.x, game.world.heightAt(v.x, v.z) + 0.1, v.z);
        game.player.yaw = v.yaw;
        game.player.pitch = v.pitch;
        game.player.flashlightOn = !!v.light;
        game.sky.dayTime = v.day;
        game.sky.setWeather(v.weather, true);
        document.querySelectorAll('#notifications .note').forEach((n) => n.remove());
        for (let i = 0; i < 24; i++) game.step(1 / 60);
        game.renderer.render(game.scene, game.camera);
      }, v);
      await pause(500);
      await page.screenshot({ path: path.join(outDir, v.file) });
      log('  shot', v.file);
    }

    // leave the camera somewhere scenic before tearing the page down
    await page.evaluate(() => {
      const v = { x: -246, z: 254 };
      game.player.pos.set(v.x, game.world.heightAt(v.x, v.z) + 0.1, v.z);
      game.player.yaw = 2.6; game.player.pitch = 0.01;
      game.player.flashlightOn = false;
      game.sky.dayTime = 0.36;
      game.sky.setWeather('clear', true);
      document.querySelectorAll('#notifications .note').forEach((n) => n.remove());
      for (let i = 0; i < 24; i++) game.step(1 / 60);
      game.renderer.render(game.scene, game.camera);
    });
    await pause(400);
  });

  // ---- phase 2: interface panels, fresh browser ------------------------
  for (const [screen, file] of PANELS.filter(([, file]) => want(file))) {
    await withBrowser(async (browser) => {
      const page = await openGame(browser, pathToFileURL(path.join(root, 'dist', 'ashes_of_humanity.html')).href + '?lite=1');
      await page.evaluate(() => game.startNewGame());
      await page.waitForFunction(() => game.mode === 'playing', { timeout: 120000, polling: 300 });
      await page.evaluate(() => {
        const v = { x: -246, z: 254 };
        game.player.pos.set(v.x, game.world.heightAt(v.x, v.z) + 0.1, v.z);
        game.player.yaw = 2.6; game.player.pitch = 0.01;
        game.sky.dayTime = 0.36;
        game.sky.setWeather('clear', true);
        document.querySelectorAll('#notifications .note').forEach((n) => n.remove());
        for (let i = 0; i < 24; i++) game.step(1 / 60);
        game.renderer.render(game.scene, game.camera);
      });
      await pause(300);
      // the overlay fades in over .22 s; kill the transition so the capture can
      // never catch a half-transparent screen on a loaded machine
      await page.evaluate((s) => {
        game.ui.panels.open(s);
        // full-screen backdrop blur over a WebGL canvas is brutal on software
        // rasterisers (it crashed SwiftShader) and invisible in a still frame
        const el = document.querySelector('#screens');
        el.style.transition = 'none';
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
      }, screen);
      await pause(900);
      await page.screenshot({ path: path.join(outDir, file) });
      log('  shot', file);
    });
  }
} catch (e) {
  errors++;
  log('CRASH', e.message);
}

log(errors ? `\n${errors} error(s) during capture\n` : '\nall screenshots captured with 0 console errors\n');
process.exit(errors ? 1 : 0);
