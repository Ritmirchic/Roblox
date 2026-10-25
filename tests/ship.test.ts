/** Ship construction: cells, placement, rotation, removal, connectivity, mass, COM, thrust. */
import { test, assert, assertEqual, assertClose } from './harness.ts';
import { ShipDesign, moduleCells, rotatedSize, cellKey, ORIENTATION_DIR } from '../src/sim/shipgrid.ts';
import { cellPrice, cellBundlePrice, crewSlots, cellsToNextCrewSlot, crewSlotProgress } from '../src/sim/economy.ts';
import { getModule } from '../src/data/modules.ts';

test('starter ship has a cockpit, engine, laser and is structurally connected', () => {
  const ship = ShipDesign.starterShip();
  assert(ship.hasCockpit(), 'starter ship must include a cockpit');
  assert(ship.isConnected(), 'starter ship must be connected');
  assert(ship.modules.some((m) => m.defId === 'engine_basic'), 'starter ship needs an engine');
  assert(ship.modules.some((m) => m.defId === 'laser_basic'), 'starter ship needs a mining laser');
  assertEqual(ship.purchasedCount, 0, 'starter cells are free and must not count as purchased');
});

test('rotated footprint swaps axes correctly', () => {
  const def = getModule('cargo_bay'); // 1x1x2
  assertEqual(rotatedSize(def, 0).join(','), '1,1,2', 'orientation 0 keeps size');
  assertEqual(rotatedSize(def, 1).join(','), '2,1,1', 'orientation 1 rotates to +X');
  assertEqual(rotatedSize(def, 4).join(','), '1,2,1', 'orientation 4 rotates to +Y');
  const cells = moduleCells(def, [0, 0, 0], 1);
  assertEqual(cells.length, 2, 'two cells occupied');
  assertEqual(cells.map((c) => c.join('')).sort().join('|'), '000|100', 'cells extend along X');
});

test('orientation direction vectors are unit axis vectors', () => {
  for (const [key, dir] of Object.entries(ORIENTATION_DIR)) {
    const len = Math.hypot(dir[0], dir[1], dir[2]);
    assertClose(len, 1, 1e-9, `orientation ${key} direction must be unit length`);
  }
});

test('placement is rejected outside owned cells', () => {
  const ship = ShipDesign.starterShip();
  const issue = ship.checkPlacement('hull_basic', [9, 9, 9], 0);
  assert(issue !== null, 'placement outside the grid must fail');
  assertEqual(issue!.code, 'out_of_grid');
});

test('overlapping placement is rejected', () => {
  const ship = ShipDesign.starterShip();
  const issue = ship.checkPlacement('hull_basic', [0, 0, 0], 0);
  assert(issue !== null, 'overlap must be rejected');
  assertEqual(issue!.code, 'overlap');
});

test('a second cockpit is rejected', () => {
  const ship = ShipDesign.starterShip();
  ship.buyCell([-1, 0, 1]);
  const issue = ship.checkPlacement('cockpit_basic', [-1, 0, 1], 0);
  assert(issue !== null, 'duplicate cockpit must be rejected');
  assertEqual(issue!.code, 'duplicate_cockpit');
});

test('surface-mounted modules need a clear facing cell', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 0], 0);
  ship.place('hull_basic', [0, 0, 1], 0);
  const issue = ship.checkPlacement('engine_basic', [1, 0, 0], 1); // faces +X into open space
  assertEqual(issue, null, 'engine facing open space is legal');
  const intoHull = ship.checkPlacement('engine_basic', [1, 0, 0], 3); // faces -X into the cockpit
  assert(intoHull !== null && intoHull.code === 'blocked_mount', 'engine firing into the hull is rejected');
  const blocked = ship.checkPlacement('laser_basic', [-1, 0, 0], 1); // faces +X into the cockpit
  assert(blocked !== null && blocked.code === 'blocked_mount', 'blocked muzzle must be rejected');
});

test('disconnected placement is rejected', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 0], 0);
  const issue = ship.checkPlacement('hull_basic', [1, 0, 1], 0);
  assert(issue !== null, 'diagonal-only contact is not a connection');
  assertEqual(issue!.code, 'disconnected');
});

test('removal that would split the hull is refused, legal removal succeeds', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  const middle = ship.place('hull_basic', [0, 0, 0], 0) as any;
  const tail = ship.place('hull_basic', [0, 0, -1], 0) as any;
  assert(!('code' in middle) && !('code' in tail), 'setup placements must succeed');
  assertEqual(ship.remove(middle.uid), false, 'removing the middle would orphan the tail');
  assertEqual(ship.modules.length, 3, 'nothing removed on a refused operation');
  assertEqual(ship.remove(tail.uid), true, 'removing the tail is legal');
  assertEqual(ship.modules.length, 2);
  assert(ship.isConnected(), 'ship stays connected');
});

test('expansion cells must touch the frame and are tracked separately', () => {
  const ship = ShipDesign.starterShip();
  assertEqual(ship.canBuyCell([50, 0, 0]), false, 'floating cells are not purchasable');
  assertEqual(ship.buyCell([2, 0, 0]), true, 'adjacent cell is purchasable');
  assertEqual(ship.purchasedCount, 1);
  assertEqual(ship.buyCell([2, 0, 0]), false, 'cannot buy the same cell twice');
  assertEqual(ship.purchasedCount, 1);
});

test('crew slot formula: floor(purchasedCells / 10)', () => {
  const cases: [number, number][] = [[0, 0], [9, 0], [10, 1], [19, 1], [20, 2], [29, 2], [30, 3], [99, 9], [100, 10]];
  for (const [cells, expected] of cases) {
    assertEqual(crewSlots(cells), expected, `${cells} cells`);
  }
  assertEqual(cellsToNextCrewSlot(0), 10);
  assertEqual(cellsToNextCrewSlot(7), 3);
  assertEqual(cellsToNextCrewSlot(10), 10);
  assertClose(crewSlotProgress(5), 0.5);
});

test('cell prices increase progressively', () => {
  let prev = 0;
  for (let i = 0; i < 40; i++) {
    const price = cellPrice(i);
    assert(price >= prev, `price must not decrease at cell ${i}`);
    prev = price;
  }
  assert(cellPrice(30) > cellPrice(0) * 3, 'prices should scale meaningfully');
  assertEqual(cellBundlePrice(0, 3), cellPrice(0) + cellPrice(1) + cellPrice(2));
});

test('mass and centre of mass react to module layout', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 0], 0);
  const base = ship.stats();
  assertClose(base.centerOfMass[0], 0, 1e-6, 'single module centre of mass sits at its own centre');

  ship.buyCell([1, 0, 0]);
  ship.place('armor_plate', [1, 0, 0], 0);
  const shifted = ship.stats();
  assert(shifted.mass > base.mass, 'adding armour increases mass');
  assert(shifted.centerOfMass[0] > base.centerOfMass[0], 'heavy module pulls the centre of mass toward it');
  const cockpit = getModule('cockpit_basic');
  const armor = getModule('armor_plate');
  const expectedX = (0 * cockpit.mass + 1 * armor.mass) / (cockpit.mass + armor.mass);
  assertClose(shifted.centerOfMass[0], expectedX, 1e-6, 'centre of mass is the mass-weighted average');
});

test('thrusters report their mount point and push opposite to their facing', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  ship.place('engine_basic', [0, 0, 0], 2); // faces -Z (aft)
  const thrusters = ship.thrusters();
  assertEqual(thrusters.length, 1, 'one engine installed');
  assertClose(thrusters[0].dir[2], 1, 1e-9, 'aft-facing engine pushes forward (+Z)');
  assertClose(thrusters[0].dir[0], 0, 1e-9, 'no sideways component');
  assertClose(thrusters[0].dir[1], 0, 1e-9, 'no vertical component');
  assertClose(thrusters[0].center[2], 0, 1e-9, 'mount point matches the installed cell');
  assert(thrusters[0].thrust > 0, 'thrust must be positive');
});

test('damaged modules lose efficiency and reduce aggregated stats', () => {
  const ship = new ShipDesign();
  ship.place('cockpit_basic', [0, 0, 1], 0);
  const laser = ship.place('laser_basic', [0, 0, 0], 2) as any;
  const healthy = ship.stats().miningDps;
  laser.health = ship.maxHealth(laser) * 0.1;
  const damaged = ship.stats().miningDps;
  assert(damaged < healthy, 'damaged mining laser produces less DPS');
  laser.health = 0;
  assertEqual(ship.stats().miningDps, 0, 'destroyed module produces nothing');
});

test('ship serialises and deserialises losslessly', () => {
  const ship = ShipDesign.starterShip();
  ship.buyCell([2, 0, 0]);
  ship.place('hull_basic', [2, 0, 0], 0);
  const data = JSON.parse(JSON.stringify(ship.serialize()));
  const restored = ShipDesign.deserialize(data);
  assertEqual(restored.modules.length, ship.modules.length, 'module count preserved');
  assertEqual(restored.purchasedCount, ship.purchasedCount, 'purchased cells preserved');
  assertClose(restored.stats().mass, ship.stats().mass, 1e-6, 'mass preserved');
  assert(restored.cells.has(cellKey(2, 0, 0)), 'purchased cell present after load');
});

test('corrupt ship data falls back to a working starter frame', () => {
  const restored = ShipDesign.deserialize({ cells: ['0,0,0'], modules: [{ defId: 'nonexistent_module', pos: [0, 0, 0] }] });
  assert(restored.hasCockpit(), 'fallback ship must still fly');
  assert(restored.isConnected(), 'fallback ship must be connected');
});
