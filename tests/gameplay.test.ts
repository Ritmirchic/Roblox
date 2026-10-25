/** Gameplay maths: mining, combat, magnets, economy, content coverage. */
import { test, assert, assertEqual, assertClose } from './harness.ts';
import { MODULES, MODULE_BY_ID, getModule, scaledStat, upgradeCost, UPGRADE_SCALE } from '../src/data/modules.ts';
import { SECTORS, ENEMIES, RESOURCES } from '../src/data/sectors.ts';
import { ShipDesign } from '../src/sim/shipgrid.ts';
import { GameState } from '../src/sim/gamestate.ts';
import { aggregateBonuses, mult } from '../src/sim/crewsim.ts';
import { progressionTier, oreValue } from '../src/sim/economy.ts';
import { RNG, fbm, makeNoise2D } from '../src/core/rng.ts';
import { CREW_BY_ID } from '../src/data/crew.ts';

test('module catalogue covers every required category with complete data', () => {
  const required = ['structure', 'command', 'propulsion', 'mining', 'collection', 'weapon', 'defense', 'utility'];
  for (const cat of required) {
    assert(MODULES.some((m) => m.category === cat), `missing category ${cat}`);
  }
  const requiredIds = [
    'laser_basic', 'laser_advanced', 'drill_plasma', 'extractor_crystal', 'beam_heavy',
    'magnet_basic', 'magnet_advanced', 'collector_vacuum', 'collector_wide',
    'gun_machine', 'gun_laser', 'gun_plasma', 'rocket_launcher', 'missile_battery', 'railgun',
    'shield_gen', 'armor_plate', 'repair_module', 'drone_defense',
    'radar', 'scanner', 'generator', 'cargo_bay', 'booster',
  ];
  for (const id of requiredIds) assert(MODULE_BY_ID.has(id), `missing required module ${id}`);
  for (const m of MODULES) {
    assert(m.mass > 0, `${m.id} needs mass`);
    assert(m.durability > 0, `${m.id} needs durability`);
    assert(m.size.every((s) => s >= 1), `${m.id} needs a valid footprint`);
    assert(m.description.length > 20, `${m.id} needs a description`);
    assert(Object.keys(m.stats).length > 0, `${m.id} must do something`);
    assert(m.maxLevel >= 4, `${m.id} needs upgrade levels`);
  }
});

test('module upgrades scale stats and cost more each level', () => {
  const laser = getModule('laser_basic');
  assertClose(scaledStat(100, 1), 100, 1e-9, 'level 1 is the base value');
  assertClose(scaledStat(100, 2), 100 * (1 + UPGRADE_SCALE), 1e-9);
  let prev = 0;
  for (let lvl = 1; lvl < laser.maxLevel; lvl++) {
    const cost = upgradeCost(laser, lvl);
    assert(cost > prev, 'upgrade costs rise with level');
    prev = cost;
  }
});

test('mining throughput reflects modules, levels, damage and crew buffs', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  const laser = ship.place('laser_basic', [0, 0, 0], 2) as any;
  const base = ship.stats().miningDps;
  assertClose(base, getModule('laser_basic').stats.miningDps!, 1e-6, 'single laser DPS matches its definition');

  laser.level = 3;
  const upgraded = ship.stats().miningDps;
  assertClose(upgraded, scaledStat(getModule('laser_basic').stats.miningDps!, 3), 1e-6, 'levels scale mining DPS');

  const bonuses = aggregateBonuses([CREW_BY_ID.get('e_driller')!.id]); // x1.6 mining
  const withCrew = upgraded * mult(bonuses, 'miningMult');
  assertClose(withCrew, upgraded * 1.6, 1e-6, 'crew multiplies mining output');

  // Time to break a 10m asteroid in the starter belt.
  const radius = 10;
  const hardness = 1 + SECTORS[0].danger * 0.45;
  const health = radius * 26 * hardness;
  const seconds = health / withCrew;
  assert(seconds > 0.5 && seconds < 90, `mining a 10m rock should take a sensible time, got ${seconds.toFixed(1)}s`);
});

test('weapon DPS aggregates damage x fire rate across mounts', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  ship.place('gun_machine', [0, 0, 0], 2);
  const def = getModule('gun_machine');
  const expected = def.stats.damage! * def.stats.fireRate!;
  assertClose(ship.stats().weaponDps, expected, 1e-6);
  ship.buyCell([1, 0, 1]);
  ship.place('gun_laser', [1, 0, 1], 1);
  const laser = getModule('gun_laser');
  assertClose(ship.stats().weaponDps, expected + laser.stats.damage! * laser.stats.fireRate!, 1e-6, 'two turrets stack');
});

test('shield, cargo, energy and magnet aggregation behave as designed', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  ship.place('shield_gen', [0, 0, 0], 0);
  ship.buyCell([1, 0, 0]);
  ship.place('generator', [1, 0, 0], 0);
  ship.buyCell([-1, 0, 0]);
  ship.place('magnet_basic', [-1, 0, 0], 3);
  const s = ship.stats();
  assertClose(s.shield, getModule('shield_gen').stats.shield!, 1e-6);
  assert(s.energyGen > 0 && s.energyDraw > 0, 'energy is produced and consumed');
  assertClose(s.magnetRange, getModule('magnet_basic').stats.magnetRange!, 1e-6);
  assert(s.energyBalance === s.energyGen - s.energyDraw, 'balance is generation minus draw');
});

test('magnet pull strengthens as chunks get closer', () => {
  const range = 100;
  const force = 180;
  const mass = 1200;
  const pullAt = (dist: number) => (force / Math.max(1, mass * 0.02)) * (1 - dist / range);
  assert(pullAt(10) > pullAt(90), 'closer chunks are pulled harder');
  assertClose(pullAt(range), 0, 1e-9, 'pull vanishes at the edge of the field');
});

test('enemy roster is complete and scales with sector danger', () => {
  for (const type of ['scout', 'raider', 'heavy', 'plasma', 'sentinel']) {
    assert(ENEMIES[type], `missing enemy ${type}`);
    const e = ENEMIES[type];
    assert(e.hull > 0 && e.damage > 0 && e.credits > 0, `${type} needs real stats`);
    assert(['orbit', 'strafe', 'charge', 'sniper'].includes(e.behaviour), `${type} needs an AI behaviour`);
  }
  assert(ENEMIES.sentinel.hull > ENEMIES.scout.hull * 10, 'void sentinels are far tougher than scouts');
  for (let i = 1; i < SECTORS.length; i++) {
    assert(SECTORS[i].danger >= SECTORS[i - 1].danger, 'danger rises with depth');
    assert(SECTORS[i].rewardMultiplier > SECTORS[i - 1].rewardMultiplier, 'rewards rise with depth');
    assert(SECTORS[i].unlockCost > SECTORS[i - 1].unlockCost, 'unlock cost rises with depth');
  }
});

test('all five sectors are distinct and reference valid resources', () => {
  assertEqual(SECTORS.length, 5, 'five regions required');
  const names = new Set(SECTORS.map((s) => s.name));
  assertEqual(names.size, 5, 'sector names must be unique');
  const styles = new Set(SECTORS.map((s) => s.rockStyle));
  assertEqual(styles.size, 5, 'each sector needs a unique asteroid style');
  for (const sector of SECTORS) {
    const weights = Object.entries(sector.resourceTable);
    assert(weights.length >= 3, `${sector.name} needs a varied resource table`);
    for (const [id, weight] of weights) {
      assert(RESOURCES[id], `${sector.name} references unknown resource ${id}`);
      assert(weight > 0, 'weights must be positive');
    }
    assert(sector.enemies.length > 0, `${sector.name} needs hostiles`);
    for (const e of sector.enemies) assert(ENEMIES[e.type], `unknown enemy ${e.type}`);
  }
});

test('ore valuation and rare-mineral economics are consistent', () => {
  const haul = { iron: 100, crystal: 10 };
  const prices = Object.fromEntries(Object.values(RESOURCES).map((r) => [r.id, r.value]));
  assertEqual(oreValue(haul, prices), 100 * RESOURCES.iron.value + 10 * RESOURCES.crystal.value);
  for (const r of Object.values(RESOURCES)) {
    if (r.rare) assert(r.value >= 32, `${r.name} is rare and should be valuable`);
    else assert(r.value <= 20, `${r.name} is common and should be cheap`);
  }
});

test('progression tier grows with permanent power', () => {
  assertEqual(progressionTier(0, 1, 5), 1);
  assert(progressionTier(40, 3, 30) > progressionTier(10, 1, 10), 'more progress means a higher tier');
  assertEqual(progressionTier(400, 5, 200), 5, 'tier caps at 5');
});

test('buying and installing a module moves it through inventory correctly', () => {
  const state = new GameState();
  state.addCredits(100000);
  const before = state.credits;
  assertEqual(state.buyModule('engine_basic'), true);
  assertEqual(state.credits, before - getModule('engine_basic').price, 'credits deducted');
  assertEqual(state.inventory.engine_basic, 1, 'module lands in the inventory');
  assertEqual(state.takeFromInventory('engine_basic'), true);
  assertEqual(state.inventory.engine_basic, undefined, 'inventory entry cleared when empty');
  assertEqual(state.takeFromInventory('engine_basic'), false, 'cannot take what you do not own');
  state.returnToInventory('engine_basic');
  assertEqual(state.inventory.engine_basic, 1, 'removed modules return to the inventory');
});

test('module upgrade spends credits, raises level and restores integrity', () => {
  const state = new GameState();
  state.addCredits(50000);
  const mod = state.ship.modules.find((m) => m.defId === 'engine_basic')!;
  mod.health = 1;
  const cost = upgradeCost(getModule('engine_basic'), mod.level);
  const before = state.credits;
  assertEqual(state.upgradeModule(mod.uid), true);
  assertEqual(mod.level, 2, 'level increased');
  assertEqual(state.credits, before - cost, 'credits spent');
  assertClose(mod.health, state.ship.maxHealth(mod), 1e-6, 'module repaired to its new maximum');
});

test('deterministic RNG is reproducible and statistically sane', () => {
  const a = new RNG(12345);
  const b = new RNG(12345);
  for (let i = 0; i < 100; i++) assertEqual(a.next(), b.next(), 'same seed yields the same stream');
  const rng = new RNG(999);
  let sum = 0;
  const n = 100000;
  for (let i = 0; i < n; i++) {
    const v = rng.next();
    assert(v >= 0 && v < 1, 'values stay in [0,1)');
    sum += v;
  }
  assert(Math.abs(sum / n - 0.5) < 0.01, 'mean should approach 0.5');
  const noise = makeNoise2D(7);
  const value = fbm(noise, 1.5, 2.5, 5);
  assert(value >= 0 && value <= 1, 'fbm output stays normalised');
});

test('weighted selection honours its weights', () => {
  const rng = new RNG(555);
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 20000; i++) counts[rng.weighted(['a', 'b'] as const, [3, 1])]++;
  const ratio = counts.a / (counts.a + counts.b);
  assert(Math.abs(ratio - 0.75) < 0.02, `expected ~75% 'a', observed ${(ratio * 100).toFixed(1)}%`);
});
