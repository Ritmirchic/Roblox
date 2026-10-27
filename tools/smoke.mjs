/** Boot the real game, start a new campaign, and report runtime status. */
import { launchBrowser, openGame, waitFor } from './browser.mjs';
const browser = await launchBrowser({ width: 960, height: 540, timeout: 300000 });
const page = await openGame(browser, 'http://127.0.0.1:8080/');
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await waitFor(page, () => !!window.__game, { timeout: 120000 });
console.log('game created');
await new Promise((r) => setTimeout(r, 2500));
const menuState = await page.evaluate(() => ({ state: window.__game.state, menuBuilt: !!window.__game.menuBuilt, world: !!window.__game.world }));
console.log('menu', JSON.stringify(menuState));
await page.screenshot({ path: '/home/user/Roblox/shots/menu.png' });
// click NEW CAMPAIGN
await page.evaluate(() => window.__game.newGame());
await waitFor(page, () => window.__game.state === 'playing', { timeout: 240000 }).catch((e) => console.log('WAIT FAIL', e.message));
await new Promise((r) => setTimeout(r, 3000));
const st = await page.evaluate(() => {
  const g = window.__game;
  return {
    state: g.state, fps: Math.round(g.fps), health: g.player?.health, pos: g.player?.position.toArray().map((v) => +v.toFixed(1)),
    enemies: g.enemies?.activeCount, locs: g.world?.locations?.length, doors: g.world?.doors?.length,
    quest: g.quests?.tracked, invItems: g.inventory?.items?.length,
    gen: g.world?.generationStats,
  };
});
console.log('state', JSON.stringify(st, null, 1));
await page.screenshot({ path: '/home/user/Roblox/shots/ingame.png' });
console.log('errors:', errors.slice(0, 10));
await browser.close();
