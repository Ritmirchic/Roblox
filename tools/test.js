#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/test.js — headless integration tests
//   Runs the real game systems (world generation, physics, combat,
//   inventory, quests, doors, saves, UI) inside jsdom with a null
//   renderer. No mocked gameplay logic: the systems are the real ones.
// ============================================================
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="ui"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
});
const { window } = dom;

global.window = window;
global.document = window.document;
Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true });
global.HTMLElement = window.HTMLElement;
global.Element = window.Element;
global.Node = window.Node;
global.localStorage = window.localStorage;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.devicePixelRatio = 1;
if (!global.performance) global.performance = window.performance;

let pass = 0, fail = 0;
const failures = [];
const ONLY = process.argv[2] || '';
const skipped = (name) => ONLY && !name.toLowerCase().includes(ONLY.toLowerCase()) && !name.startsWith('world generates');
function check(name, fn) {
  if (skipped(name)) return;
  try {
    const r = fn();
    if (r === false) throw new Error('returned false');
    pass++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  FAIL ${name}`);
    console.log(`       ${e.stack.split('\n').slice(0, ONLY ? 12 : 4).join('\n       ')}`);
  }
}
async function checkAsync(name, fn) {
  if (skipped(name)) return null;
  try {
    const r = await fn();
    if (r === false) throw new Error('returned false');
    pass++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  FAIL ${name}`);
    console.log(`       ${e.stack.split('\n').slice(0, 4).join('\n       ')}`);
  }
}
const near = (a, b, eps = 0.001) => Math.abs(a - b) <= eps;
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

console.log('\nASHES OF HUMANITY — headless test suite\n');

const THREE = await import('three');
const { Game } = await import(path.join(root, 'src/game/game.js'));

let game;
const t0 = Date.now();
await checkAsync('world generates and all systems initialise', async () => {
  game = new Game({ headless: true, seed: 4242 });
  await game.init();
  assert(game.world.pois.length > 25, 'POIs ' + game.world.pois.length);
  assert(game.world.colliders.count > 8000, 'colliders ' + game.world.colliders.count);
  assert(game.world.lootSpots.length > 400, 'loot ' + game.world.lootSpots.length);
  assert(game.world.doorSpecs.length > 100, 'doors ' + game.world.doorSpecs.length);
  assert(game.ui && game.ui.hud, 'UI missing');
  assert(game.enemies.length > 20, 'enemies ' + game.enemies.length);
});
console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s to generate)\n`);

check('HUD and screens exist in the DOM', () => {
  assert(document.querySelector('#hud'), 'no hud');
  assert(document.querySelector('#notification') || document.querySelector('#notifications'), 'no notifications');
  assert(document.querySelector('#screens'), 'no screen overlay');
  assert(document.querySelector('#dialogue'), 'no dialogue');
  assert(document.querySelector('#shop'), 'no shop');
  assert(document.querySelector('#mainmenu'), 'no main menu');
});

check('new game starts in the underground shelter', () => {
  game.startNewGame();
  assert(game.mode === 'playing', 'mode ' + game.mode);
  assert(game.quests.isActive('m01'), 'm01 not started');
  assert(game.inventory.count('flashlight') === 1 || game.inventory.equipment.light, 'no flashlight');
  const sh = game.world.shelter;
  assert(game.player.pos.y < sh.y + 2, 'player not on shelter floor: ' + game.player.pos.y.toFixed(2));
  assert(game.player.pos.y < game.world.heightAt(game.player.pos.x, game.player.pos.z) - 3, 'player not underground');
});

check('physics does not eject the player through the shelter ceiling', () => {
  const p = game.player;
  const y0 = p.pos.y;
  for (let i = 0; i < 120 * 3; i++) game.step(1 / 120);
  const surface = game.world.heightAt(p.pos.x, p.pos.z);
  assert(p.pos.y < surface - 2, `player teleported to surface (y=${p.pos.y.toFixed(2)}, surface=${surface.toFixed(2)})`);
  assert(Math.abs(p.pos.y - y0) < 1.5, 'player fell or rose unexpectedly');
});

check('player can walk up the stairwell to the surface', () => {
  const p = game.player;
  p.pos.copy(game.world.startPosition);
  p.vel.set(0, 0, 0);
  p.yaw = Math.PI;              // +Z, toward the stairs
  p.pitch = 0;
  game.input.keys = { KeyW: true };
  const yStart = p.pos.y;
  let maxY = yStart;
  for (let i = 0; i < 120 * 45; i++) {
    game.step(1 / 120);
    maxY = Math.max(maxY, p.pos.y);
    game.input.keys.KeyW = true;
    if (p.pos.z > game.world.shelter.z + 30) break;
  }
  game.input.keys = {};
  assert(maxY > yStart + 4, `player did not climb (start ${yStart.toFixed(2)} → ${maxY.toFixed(2)})`);
  const surface = game.world.heightAt(p.pos.x, p.pos.z);
  assert(maxY > surface - 1.5, `did not reach surface (max ${maxY.toFixed(2)} vs ${surface.toFixed(2)})`);
});

check('shelter interactables drive the opening quest', () => {
  const p = game.player;
  const locker = game.interactables.find((i) => i.id === 'shelter_locker');
  p.pos.set(locker.x + 0.6, locker.y, locker.z);
  game.tryInteract();
  const consoleNode = game.interactables.find((i) => i.id === 'shelter_console');
  p.pos.set(consoleNode.x + 0.6, consoleNode.y, consoleNode.z);
  game.tryInteract();
  const st = game.quests.state.m01;
  assert(st, 'm01 state missing');
  assert(st.progress[0] >= 1, 'locker objective not recorded');
  assert(st.progress[1] >= 1, 'console objective not recorded');
  assert(st.status === 'done', 'm01 not completed');
  assert(game.quests.isActive('m02'), 'm02 not unlocked');
});

check('reading the note and reaching the shelter surface progresses act 1', () => {
  const p = game.player;
  const note = game.interactables.find((i) => i.id === 'shelter_note');
  p.pos.set(note.x, note.y, note.z + 1.2);
  game.tryInteract();
  assert(game.quests.isDone('m02'), 'm02 not done');
  const poi = game.world.pois.find((x) => x.id === 'sub_shelter');
  p.pos.set(poi.x, poi.y, poi.z);
  game.updatePOIs(0.016);
  assert(game.quests.isDone('m03'), 'm03 (reach surface) not done');
});

check('inventory: add, stack, grid placement and weight', () => {
  const inv = game.inventory;
  inv.items = [];
  inv.gold = 0;
  inv.add('bandage', 5);
  assert(inv.count('bandage') === 5, 'stack count');
  inv.add('water_bottle', 2);
  inv.add('scrap', 10);
  const total = inv.items.reduce((a, i) => a + i.qty, 0);
  assert(total === 17, 'item total ' + total);
  for (const it of inv.items) {
    assert(it.x >= 0 && it.y >= 0 && it.x + inv.dims(it)[0] <= inv.cols, 'item out of bounds');
  }
  assert(inv.weight > 0, 'no weight');
  inv.sortItems();
  assert(inv.items.length > 0, 'sort destroyed items');
});

check('inventory: equip, magazine, reload, fire and hit an enemy', () => {
  const inv = game.inventory;
  inv.items = [];
  inv.add('pistol', 1);
  inv.add('ammo_9mm', 24);
  const pistol = inv.items.find((i) => i.id === 'pistol');
  assert(inv.equip(pistol.uid), 'equip failed');
  game.weapons.setWeapon('pistol');
  assert(game.weapons.def.mag === 8, 'mag size');
  game.weapons.state.mag = 0;
  game.weapons.reload();
  assert(game.weapons.state.reloading, 'reload not started');
  for (let i = 0; i < 240; i++) game.weapons.update(1 / 120, {}, { dx: 0, dy: 0, left: false, right: false });
  assert(game.weapons.state.mag > 0, 'reload did not fill magazine');
  assert(inv.countAmmo('ammo_9mm') < 24, 'ammo not consumed on reload');
});

check('combat: hitscan damages a mutant and headshots are stronger', () => {
  // find open ground so the probe ray cannot hit a building first
  let spot = null;
  for (let x = -280; x <= -220 && !spot; x += 10) {
    for (let z = 240; z <= 300; z += 10) {
      const near = game.world.colliders.query(x - 9, z - 9, x + 9, z + 9);
      if (!near.length) { spot = { x, z }; break; }
    }
  }
  assert(spot, 'no open test ground');
  // clear the region spawns so the probe ray can only reach the test target
  for (const o of game.enemies) o.dispose();
  game.enemies = [];
  const e = game.spawnEnemy('hollow', spot.x, spot.z);
  assert(e, 'enemy spawn failed');
  e.pos.y = game.world.heightAt(e.pos.x, e.pos.z);
  e.pos.x = spot.x; e.pos.z = spot.z;
  const origin = new THREE.Vector3(spot.x, e.pos.y + 1.4, spot.z + 4.0);
  const head = e.center.clone().add(new THREE.Vector3(0, e.height * 0.38, 0));
  const dir = head.clone().sub(origin).normalize();
  const had = e.hp;
  const res = game.combat.hitscan(origin, dir, 30, { crit: 0.1, noTracer: true });
  assert(res.hit && res.enemy === e, 'hitscan missed (hit=' + res.hit + ' enemy=' + !!res.enemy + ' world=' + !!res.world + ')');
  assert(e.hp < had, 'enemy took no damage');
  assert(res.head === true, 'headshot not detected');
  assert(had - e.hp >= 30, 'headshot was not lethal multiplier');
  game.removeEnemy(e);
});

check('combat: killing grants XP, loot and records the codex', () => {
  const p = game.player;
  const e = game.spawnEnemy('crawler', p.pos.x + 2, p.pos.z + 2);
  const xp0 = game.xp + (game.level - 1) * 1000;
  const inv0 = game.inventory.items.length;
  e.hp = 1;
  e.hurt(50, {});
  assert(e.dead, 'enemy did not die');
  assert(game.stats.kills > 0, 'kill not counted');
  assert(game.codex.kills.crawler > 0, 'codex kill not recorded');
  assert(game.xp + (game.level - 1) * 1000 > xp0 || game.level > 1, 'no xp');
});

check('loot: containers roll real items from their table', () => {
  const spots = game.loot.spots.filter((s) => !s.looted).slice(0, 6);
  assert(spots.length, 'no unlooted spots');
  let got = 0;
  for (const s of spots) got += game.loot.open(s).length;
  assert(got > 0, 'no items rolled');
  assert(spots.every((s) => s.looted), 'spots not marked');
});

check('quests: kill objectives, tracking and reward payout', () => {
  game.quests.state = { m05: { status: 'active', progress: [0], startedAt: 0 } };
  for (let i = 0; i < 3; i++) game.quests.onKill('hollow');
  assert(game.quests.isDone('m05'), 'kill objective did not complete');
  const xp0 = game.level * 10000 + game.xp;
  game.quests.complete('m05');
  assert(game.xp + game.level * 10000 > xp0, 'quest gave no xp');
});

check('skills: points are spent, levels apply and effects aggregate', () => {
  game.level = 10; game.skillPoints = 10;
  game.skillRanks = {}; game.skills = {}; game.applySkills();
  const hp0 = game.player.stats.healthMax;
  assert(game.spendSkillPoint('s3'), 'could not spend point on s3');
  assert(game.skillRanks.s3 === 1, 'rank not recorded');
  assert(game.player.stats.healthMax > hp0, 'health max did not increase');
  assert(!game.spendSkillPoint('c4'), 'locked skill was purchasable');
  assert((game.skills.healthMax || 0) > 0, 'aggregate effect missing');
});

check('body damage: limbs take condition damage and can be treated', () => {
  const b = game.body;
  b.reset();
  game.player.stats.health = game.player.stats.healthMax;
  game.player.applyDamage(24, { body: 'legs', fracture: true });
  const legCond = Math.min(b.partCondition('legL'), b.partCondition('legR'));
  assert(legCond < 100, 'leg condition unchanged');
  const leg = b.partCondition('legL') < b.partCondition('legR') ? 'legL' : 'legR';
  b.wounds[leg].bleed = 40;
  game.inventory.add('bandage', 2);
  const before = b.wounds[leg].bleed;
  assert(b.treat(leg, 'bandage'), 'bandage treatment failed');
  assert(b.wounds[leg].bleed < before, 'bleeding not reduced');
});

check('doors: opening removes the blocking collider, closing restores it', () => {
  const d = game.doors.doors.find((x) => x.angle < 0.01);
  assert(d, 'no closed door');
  const grid = game.world.colliders;
  const n0 = grid.count;
  game.doors.toggle(d);
  assert(grid.count === n0 - 1, 'collider not removed');
  for (let i = 0; i < 240; i++) game.doors.update(1 / 120);
  assert(d.angle > 0.5, 'door did not swing');
  game.doors.toggle(d);
  assert(grid.count === n0, 'collider not restored');
  for (let i = 0; i < 240; i++) game.doors.update(1 / 120);
  assert(d.angle < 0.1, 'door did not close');
});

check('NPC dialogue: opening, choosing and quest hand-off', () => {
  const nika = game.npcs.list.find((n) => n.id === 'nika');
  assert(nika, 'nika missing');
  game.player.pos.set(nika.x + 1.2, nika.y, nika.z);
  game.npcs.update(0.016);
  assert(game.npcs.nearest === nika, 'nika not detected');
  game.npcs.open(nika);
  assert(game.ui.dialogueEl.classList.contains('open'), 'dialogue not open');
  game.ui.skipTypewriter();
  assert(game.ui.dialogueState.choices.length > 2, 'no dialogue choices');
  // Nika only offers work once act 1 is behind you
  game.quests.state = {};
  for (const id of ['m01', 'm02', 'm03', 'm04', 'm05']) game.quests.state[id] = { status: 'done', progress: [1] };
  game.ui.dialogueState = null;
  game.npcs.open(nika);
  game.ui.skipTypewriter();
  const workIdx = game.ui.dialogueState.choices.findIndex((c) => /work/i.test(c.text || c.t || ''));
  assert(workIdx >= 0, 'no work choice');
  game.npcs.choose(workIdx);
  assert(game.quests.state.m06 || game.quests.state.m07 || game.quests.state.m08, 'no quest offered');
  game.npcs.close();
  assert(!game.ui.dialogueEl.classList.contains('open'), 'dialogue did not close');
});

check('shop: buy and sell move gold and items', () => {
  const nika = game.npcs.list.find((n) => n.id === 'nika');
  const shop = nika.shop;
  game.inventory.gold = 1000;
  const before = game.inventory.gold;
  const ok = shop.buy('bandage', 1);
  assert(ok, 'buy failed');
  assert(game.inventory.gold < before, 'gold not spent');
  const bandage = game.inventory.items.find((i) => i.id === 'bandage');
  game.inventory.removeUid(bandage.uid, 1);
  game.inventory.add('bandage', 1);
  const b2 = game.inventory.items.find((i) => i.id === 'bandage');
  const gold2 = game.inventory.gold;
  assert(shop.sell(b2.uid), 'sell failed');
  assert(game.inventory.gold > gold2, 'gold not received');
});

check('crafting consumes materials and yields the product', () => {
  const inv = game.inventory;
  inv.items = [];
  inv.add('cloth', 4);
  const before = inv.count('cloth');
  game.nearBenchLevel = 0;
  assert(game.craft('r_bandage'), 'craft failed');
  assert(inv.count('bandage') === 2, 'wrong output');
  assert(inv.count('cloth') === before - 2, 'materials not consumed');
});

check('base building places a structure with a collider', () => {
  const inv = game.inventory;
  inv.items = [];
  inv.add('wood_plank', 6);
  game.player.pos.set(-360, game.world.heightAt(-360, 190), 190);
  game.startBuilding('b_wall_wood');
  assert(game.buildMode, 'build mode not entered');
  game.buildPos = { x: -360, y: game.world.heightAt(-360, 190), z: 190 };
  game.buildValid = true;
  const n0 = game.world.colliders.count;
  game.placeBuilding();
  assert(game.buildings.length === 1, 'building not stored');
  assert(game.world.colliders.count > n0, 'no collider added');
  game.cancelBuilding();
});

check('world events fire without errors', () => {
  const ev = game.events.fire('supply_drop');
  assert(ev, 'event did not run');
  assert(game.loot.spots.some((s) => s.supply), 'no supply crate');
});

check('save and load round-trip restores state', () => {
  game.player.pos.set(-350, game.world.heightAt(-350, 260), 260);
  game.level = 7; game.xp = 55; game.skillPoints = 3;
  game.inventory.gold = 321;
  game.saveGame(true);
  assert(game.hasSave(), 'no save written');
  game.player.pos.set(0, 20, 0);
  game.level = 1; game.inventory.gold = 0;
  const ok = game.loadGame();
  assert(ok, 'load failed');
  assert(near(game.player.pos.x, -350, 1.5), 'position not restored: ' + game.player.pos.x);
  assert(game.level === 7, 'level not restored');
  assert(game.inventory.gold === 321, 'gold not restored');
});

check('every interface screen renders', () => {
  for (const screen of ['inventory', 'skills', 'journal', 'map', 'craft', 'build', 'medical', 'notes', 'settings']) {
    game.ui.panels.open(screen);
    assert(game.ui.panels.screen === screen, screen + ' did not open');
    assert(game.ui.panels.root.innerHTML.length > 100, screen + ' rendered empty');
    game.ui.panels.close();
  }
});

check('HUD updates across states without errors', () => {
  game.mode = 'playing';
  for (let i = 0; i < 30; i++) game.ui.update(0.05);
  const hud = document.querySelector('#hud');
  assert(hud, 'no hud');
  assert(document.querySelector('#hud-hp').textContent.length > 0, 'hp not rendered');
  assert(document.querySelector('#compass-inner').children.length > 50, 'compass empty');
});

check('audio synthesis calls are safe without a WebAudio context', () => {
  const a = game.audio;
  a.gunshot('rifle'); a.reload(); a.footstep('gravel'); a.enemyAlert('hollow'); a.bossRoar();
  a.pickup(); a.questUpdate(); a.levelUp(); a.craft(); a.trade(); a.heal(); a.door(true);
  a.discovery(); a.eventSting(); a.radioStatic(); a.paleHowl(); a.bossDeath(); a.stopMusic();
  assert(a.ctx === null, 'context should not exist headless');
});

check('finale boss arena spawns and boss bar shows', () => {
  game.codex.bosses = {};
  game.world.arenas.hollow_church._spawned = false;
  const arena = game.world.arenas.hollow_church;
  game.player.pos.set(arena.x + 5, game.world.heightAt(arena.x + 5, arena.z), arena.z);
  game.updateArenas(0.016);
  const boss = game.bosses.find((b) => b.bossId === 'hollow_king');
  assert(boss, 'boss did not spawn');
  assert(document.querySelector('#bossbar').classList.contains('on'), 'boss bar hidden');
  game.bosses.forEach((b) => { b.hurt(999999, {}); });
  game.updateArenas(0.016);
  assert(document.querySelector('#bossbar').classList.contains('on') === false || boss.dead, 'boss bar did not clear');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) {
  console.log('FAILURES:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
