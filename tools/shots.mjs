/**
 * Captures gameplay screenshots from a running game instance.
 * Usage: node tools/shots.mjs [--url http://localhost:8080] [--out shots] [--shots name1,name2]
 */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, openGame, waitFor } from './browser.mjs';

const args = process.argv.slice(2);
const getArg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const url = getArg('url', 'http://localhost:8080/');
const outDir = path.resolve(getArg('out', 'shots'));
const width = Number(getArg('width', 1280));
const height = Number(getArg('height', 720));
fs.mkdirSync(outDir, { recursive: true });

const browser = await launchBrowser({ width, height });
try {
  const page = await openGame(browser, url);
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('[page error]', m.text());
  });
  await waitFor(page, () => window.__gameReady === true, { timeout: 240000 });
  console.log('game ready');
  await new Promise((r) => setTimeout(r, 1500));
  const list = getArg('shots', '');
  const shots = list
    ? list.split(',')
    : await page.evaluate(() => (window.__shotList ? window.__shotList() : ['start']));
  for (const shot of shots) {
    if (shot !== 'start') {
      await page.evaluate((s) => window.__prepareShot && window.__prepareShot(s), shot);
      await new Promise((r) => setTimeout(r, 900));
    }
    const file = path.join(outDir, `shot_${shot}.png`);
    await page.screenshot({ path: file });
    console.log('saved', file);
  }
  const perf = await page.evaluate(() => (window.__perf ? window.__perf() : null));
  if (perf) console.log('PERF', JSON.stringify(perf));
} finally {
  await browser.close();
}
