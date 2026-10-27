/** Capture visual QA screenshots of the generated world from fixed vantage points. */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, openGame, waitFor } from './browser.mjs';

const PORT = process.env.PORT || 8080;
const OUT = path.join(process.cwd(), 'shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await launchBrowser({ width: 1280, height: 720, timeout: 300000 });
const page = await openGame(browser, `http://127.0.0.1:${PORT}/test.html?entry=src/dev/worldview.js`, { logs: false });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await waitFor(page, () => !!window.__ready, { timeout: 240000 });
console.log('ready', await page.evaluate(() => window.__stats));

const views = JSON.parse(process.env.VIEWS || '[]');
for (const v of views) {
  await page.evaluate((v) => {
    window.__time(v.hour ?? 9.5);
    window.__setCam(v.pos[0], v.pos[1], v.pos[2], v.look[0], v.look[1], v.look[2]);
  }, v);
  const info = await page.evaluate(() => window.__frame());
  await new Promise((r) => setTimeout(r, 350));
  await page.screenshot({ path: path.join(OUT, v.name + '.png') });
  console.log(v.name, JSON.stringify(info));
}
await browser.close();
