/** Crew bonuses, packs, upgrades slots, achievements timers and save integrity. */
import { test, assert, assertEqual, assertClose, MemoryStorage } from './harness.ts';
import { CREW_CARDS, CREW_BY_ID, RARITY_ORDER, DUPLICATE_CRYSTALS, formatBonus } from '../src/data/crew.ts';
import { aggregateBonuses, sanitizeEquipped, mergeEffects, mult, additive } from '../src/sim/crewsim.ts';
import { PACKS, PACK_SIZE, openPack, packOdds } from '../src/sim/packs.ts';
import { RNG } from '../src/core/rng.ts';
import { DEFAULT_UPGRADE_SLOTS, MAX_UPGRADE_SLOTS, FIFTH_SLOT_DROP_CHANCE, unlockedSlots, rollFifthSlot, ACTIVE_UPGRADES } from '../src/sim/upgrades.ts';
import { AchievementEngine, emptyAchievementState, periodIndexFor, slateFor, scaleTarget } from '../src/sim/achievements.ts';
import { PERIOD_COUNT, PERIOD_MS, TEMPLATES_BY_PERIOD } from '../src/data/achievements.ts';
import { GameState, SAVE_VERSION } from '../src/sim/gamestate.ts';
import { SECTORS } from '../src/data/sectors.ts';

// ----------------------------------------------------------------- crew data
test('crew database has 40+ unique cards with unique numbers and real bonuses', () => {
  assert(CREW_CARDS.length >= 40, `expected at least 40 cards, found ${CREW_CARDS.length}`);
  const ids = new Set(CREW_CARDS.map((c) => c.id));
  assertEqual(ids.size, CREW_CARDS.length, 'card ids must be unique');
  const numbers = new Set(CREW_CARDS.map((c) => c.number));
  assertEqual(numbers.size, CREW_CARDS.length, 'collection numbers must be unique');
  const seeds = new Set(CREW_CARDS.map((c) => c.artSeed));
  assertEqual(seeds.size, CREW_CARDS.length, 'art seeds must be unique so no two illustrations match');
  for (const card of CREW_CARDS) {
    assert(card.bonus.value !== 1 && card.bonus.value !== 0, `${card.name} must carry a real bonus`);
    assert(card.description.length > 20, `${card.name} needs a written description`);
    assert(formatBonus(card.bonus.key, card.bonus.value).length > 3, 'bonus must be presentable');
  }
  for (const rarity of RARITY_ORDER) {
    assert(CREW_CARDS.some((c) => c.rarity === rarity), `rarity ${rarity} must have at least one card`);
  }
});

test('crew bonuses aggregate multiplicatively and ignore duplicates', () => {
  const gunner = CREW_BY_ID.get('l_gunner')!;       // x3 damage
  const tactician = CREW_BY_ID.get('r_tactician')!; // +30% fire rate
  const single = aggregateBonuses([gunner.id]);
  assertClose(mult(single, 'damageMult'), 3, 1e-9, 'legendary gunner triples damage');

  const doubled = aggregateBonuses([gunner.id, gunner.id]);
  assertClose(mult(doubled, 'damageMult'), 3, 1e-9, 'the same card may not apply twice');

  const combo = aggregateBonuses([gunner.id, tactician.id]);
  assertClose(mult(combo, 'damageMult'), 3, 1e-9);
  assertClose(mult(combo, 'fireRateMult'), 1.3, 1e-9);

  const scientist = CREW_BY_ID.get('s_scientist')!; // +25% rare chance (additive)
  const geologist = CREW_BY_ID.get('r_geologist')!; // +6% rare chance
  const additives = aggregateBonuses([scientist.id, geologist.id]);
  assertClose(additive(additives, 'rareChance'), 0.31, 1e-9, 'additive bonuses sum');
});

test('crew capacity is clamped to unlocked slots', () => {
  const owned = new Set(CREW_CARDS.slice(0, 6).map((c) => c.id));
  const equipped = CREW_CARDS.slice(0, 6).map((c) => c.id);
  assertEqual(sanitizeEquipped(equipped, 2, owned).length, 2, 'only two slots unlocked');
  assertEqual(sanitizeEquipped(equipped, 0, owned).length, 0, 'zero slots means no crew');
  assertEqual(sanitizeEquipped(['not_a_card', equipped[0]], 3, owned).length, 1, 'unknown ids are dropped');
  assertEqual(sanitizeEquipped([equipped[0], equipped[0]], 3, owned).length, 1, 'duplicates are dropped');
});

test('active upgrade effects merge with crew bonuses', () => {
  const base = aggregateBonuses([CREW_BY_ID.get('l_gunner')!.id]);
  const merged = mergeEffects(base, [{ key: 'damageMult', value: 1.5 }, { key: 'rareChance', value: 0.12 }]);
  assertClose(mult(merged, 'damageMult'), 4.5, 1e-9, 'upgrade multiplies on top of crew');
  assertClose(additive(merged, 'rareChance'), 0.12, 1e-9);
});

// --------------------------------------------------------------------- packs
test('every pack yields exactly 3 cards', () => {
  const rng = new RNG(1234);
  for (const pack of PACKS) {
    for (let i = 0; i < 50; i++) {
      const result = openPack(pack, rng, new Set(), { pity: 0 });
      assertEqual(result.cards.length, PACK_SIZE, `${pack.name} must contain exactly 3 cards`);
    }
  }
});

test('pack odds are published accurately and sum to 1', () => {
  for (const pack of PACKS) {
    const odds = packOdds(pack);
    const total = odds.reduce((a, b) => a + b.chance, 0);
    assertClose(total, 1, 1e-9, `${pack.name} odds must sum to 100%`);
    for (const o of odds) assert(o.chance >= 0, 'no negative chances');
  }
});

test('pack rarity floors are respected', () => {
  const rng = new RNG(99);
  const legend = PACKS.find((p) => p.id === 'legend')!;
  for (let i = 0; i < 200; i++) {
    const result = openPack(legend, rng, new Set(), { pity: 0 });
    for (const card of result.cards) {
      assert(RARITY_ORDER.indexOf(card.rarity) >= RARITY_ORDER.indexOf('epic'), 'legend pack guarantees epic or better');
    }
  }
});

test('duplicates convert to crystals instead of vanishing', () => {
  const rng = new RNG(7);
  const owned = new Set(CREW_CARDS.map((c) => c.id)); // own everything -> all pulls are duplicates
  const result = openPack(PACKS[0], rng, owned, { pity: 0 });
  assertEqual(result.newCards.length, 0, 'no new cards when everything is owned');
  assertEqual(result.duplicates.length, PACK_SIZE, 'all three are duplicates');
  const expected = result.cards.reduce((acc, c) => acc + DUPLICATE_CRYSTALS[c.rarity], 0);
  assertEqual(result.crystalsRefunded, expected, 'refund matches the published duplicate values');
});

test('pity timer guarantees rare or better within 8 packs', () => {
  const rng = new RNG(4242);
  const state = { pity: 0 };
  let maxStreak = 0;
  let streak = 0;
  for (let i = 0; i < 500; i++) {
    const result = openPack(PACKS[0], rng, new Set(), state);
    const gotRare = result.cards.some((c) => RARITY_ORDER.indexOf(c.rarity) >= RARITY_ORDER.indexOf('rare'));
    streak = gotRare ? 0 : streak + 1;
    maxStreak = Math.max(maxStreak, streak);
  }
  assert(maxStreak <= 8, `longest drought was ${maxStreak} packs, expected <= 8`);
});

test('observed pack rarity distribution matches the published table', () => {
  const rng = new RNG(20260101);
  const counts: Record<string, number> = {};
  const draws = 30000;
  for (let i = 0; i < draws; i++) {
    const result = openPack(PACKS[0], rng, new Set(), { pity: 0 });
    for (const c of result.cards) counts[c.rarity] = (counts[c.rarity] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  for (const { rarity, chance } of packOdds(PACKS[0])) {
    const observed = (counts[rarity] ?? 0) / total;
    // Pity rules bias results slightly upward for rare+, so allow a generous window.
    assert(Math.abs(observed - chance) < Math.max(0.015, chance * 0.45),
      `${rarity}: observed ${(observed * 100).toFixed(2)}% vs published ${(chance * 100).toFixed(2)}%`);
  }
});

// ------------------------------------------------------------------ upgrades
test('upgrade slots: 3 default, 4 purchased, 5 with the rare card, never more', () => {
  assertEqual(unlockedSlots(false, false), DEFAULT_UPGRADE_SLOTS);
  assertEqual(unlockedSlots(true, false), 4);
  assertEqual(unlockedSlots(false, true), 4);
  assertEqual(unlockedSlots(true, true), MAX_UPGRADE_SLOTS);
  assertEqual(MAX_UPGRADE_SLOTS, 5);
});

test('fifth slot drops at 1% and never unlocks twice', () => {
  assertClose(FIFTH_SLOT_DROP_CHANCE, 0.01, 1e-9);
  assertEqual(rollFifthSlot(false, 0.005), true, 'roll below 1% unlocks');
  assertEqual(rollFifthSlot(false, 0.02), false, 'roll above 1% does not unlock');
  assertEqual(rollFifthSlot(true, 0.001), false, 'already unlocked cannot unlock again');

  const rng = new RNG(31337);
  let hits = 0;
  const trials = 200000;
  for (let i = 0; i < trials; i++) if (rollFifthSlot(false, rng.next())) hits++;
  const rate = hits / trials;
  assert(Math.abs(rate - 0.01) < 0.0015, `observed drop rate ${(rate * 100).toFixed(3)}% should be ~1%`);
});

test('equipping active upgrades respects slots and blocks duplicates', () => {
  const state = new GameState();
  state.ownedUpgrades = { overclock: 1, autoloader: 1 };
  assertEqual(state.setActiveUpgrade(0, 'overclock'), true);
  assertEqual(state.setActiveUpgrade(1, 'overclock'), false, 'the same upgrade cannot fill two slots');
  assertEqual(state.setActiveUpgrade(1, 'autoloader'), true);
  assertEqual(state.setActiveUpgrade(4, 'autoloader'), false, 'slot 5 is locked by default');
  assertEqual(state.setActiveUpgrade(0, 'not_owned'), false, 'cannot equip an unowned upgrade');
  assert(ACTIVE_UPGRADES.length >= 8, 'upgrade catalogue should offer meaningful choice');
});

// -------------------------------------------------------------- achievements
test('exactly 5 minute / 3 hourly / 7 daily / 15 weekly achievements are active', () => {
  const engine = new AchievementEngine(emptyAchievementState());
  const active = engine.refresh(Date.UTC(2026, 0, 1, 12, 0, 0), 1);
  assertEqual(active.filter((a) => a.period === 'minute').length, 5);
  assertEqual(active.filter((a) => a.period === 'hourly').length, 3);
  assertEqual(active.filter((a) => a.period === 'daily').length, 7);
  assertEqual(active.filter((a) => a.period === 'weekly').length, 15);
  assertEqual(active.length, 30, 'total of 30 live achievements');
  for (const period of ['minute', 'hourly', 'daily', 'weekly'] as const) {
    assert(TEMPLATES_BY_PERIOD[period].length >= PERIOD_COUNT[period], `${period} template pool must cover the slate`);
  }
});

test('period indices are UTC anchored and rotate on schedule', () => {
  const t = Date.UTC(2026, 5, 15, 10, 30, 30);
  assertEqual(periodIndexFor('minute', t), Math.floor(t / 60000));
  assertEqual(periodIndexFor('hourly', t), Math.floor(t / 3600000));
  assertEqual(periodIndexFor('daily', t), Math.floor(t / 86400000));
  assertEqual(periodIndexFor('weekly', t), Math.floor(t / 604800000));
  assert(periodIndexFor('minute', t + PERIOD_MS.minute) === periodIndexFor('minute', t) + 1, 'minute index advances');
});

test('minute achievements reset after 60 seconds and clear progress', () => {
  const engine = new AchievementEngine(emptyAchievementState());
  const t0 = Date.UTC(2026, 0, 1, 0, 0, 0);
  engine.refresh(t0, 1);
  const minute = engine.active.find((a) => a.period === 'minute')!;
  engine.track(minute.stat, minute.target, t0);
  assert(engine.isComplete(minute), 'objective completes when the target is met');
  const reward = engine.claim(minute.key, t0);
  assertEqual(reward, minute.crystals, 'claim pays the listed crystals');
  assertEqual(engine.claim(minute.key, t0), 0, 'a reward can never be claimed twice');

  engine.refresh(t0 + 61_000, 1);
  const after = engine.active.find((a) => a.period === 'minute')!;
  assertEqual(engine.state.progress[after.key] ?? 0, 0, 'progress resets after rotation');
  assertEqual(engine.state.claimed[minute.key], undefined, 'stale claims are pruned');
});

test('hourly, daily and weekly rotations behave independently', () => {
  const engine = new AchievementEngine(emptyAchievementState());
  const t0 = Date.UTC(2026, 2, 3, 4, 5, 6);
  engine.refresh(t0, 2);
  const daily = engine.active.find((a) => a.period === 'daily')!;
  engine.track(daily.stat, Math.ceil(daily.target / 2), t0);
  const halfway = engine.state.progress[daily.key];
  assert(halfway > 0, 'daily progress recorded');

  engine.refresh(t0 + PERIOD_MS.hourly, 2); // one hour later
  assertEqual(engine.state.progress[daily.key], halfway, 'daily progress survives an hourly rotation');

  engine.refresh(t0 + PERIOD_MS.daily + 1000, 2);
  const dailyAfter = engine.active.find((a) => a.period === 'daily')!;
  assertEqual(engine.state.progress[dailyAfter.key] ?? 0, 0, 'daily progress resets after 24h');
});

test('claiming requires completion and offline time is handled', () => {
  const engine = new AchievementEngine(emptyAchievementState());
  const t0 = Date.UTC(2026, 0, 10, 0, 0, 0);
  engine.refresh(t0, 1);
  const weekly = engine.active.find((a) => a.period === 'weekly')!;
  assertEqual(engine.claim(weekly.key, t0), 0, 'cannot claim an incomplete objective');
  engine.track(weekly.stat, weekly.target, t0);
  assertEqual(engine.claim(weekly.key, t0), weekly.crystals);
  // Simulate the player being offline for three weeks.
  const later = t0 + PERIOD_MS.weekly * 3;
  const active = engine.refresh(later, 1);
  assertEqual(active.length, 30, 'slate is rebuilt after a long absence');
  assert(active.every((a) => !a.claimed), 'new period starts unclaimed');
});

test('achievement targets scale with progression tier but stay reachable', () => {
  const minute = TEMPLATES_BY_PERIOD.minute[0];
  const t1 = scaleTarget(minute, 1);
  const t5 = scaleTarget(minute, 5);
  assert(t5 >= t1, 'higher tiers ask for more');
  assert(t5 <= t1 * 3, 'minute goals must stay completable in 20-40 seconds');
  const slate = slateFor('minute', 12345, 3);
  assertEqual(slate.length, 5);
  const repeat = slateFor('minute', 12345, 3);
  assertEqual(slate.map((a) => a.templateId).join(','), repeat.map((a) => a.templateId).join(','), 'slates are deterministic per period');
});

// ------------------------------------------------------------------ save/load
test('game state round-trips through the versioned save format', () => {
  const storage = new MemoryStorage();
  const state = new GameState();
  state.addCredits(12345);
  state.addCrystals(678);
  state.grantCard(CREW_CARDS[0].id);
  state.grantCard(CREW_CARDS[1].id);
  state.ship.buyCell([2, 0, 0]);
  for (let i = 0; i < 9; i++) state.ship.buyCell([2 + i, 0, 1]);
  state.ownedUpgrades.overclock = 1;
  state.setActiveUpgrade(0, 'overclock');
  state.equipCrew(CREW_CARDS[0].id);
  state.unlockSector('crystal_nebula');
  assert(state.save(storage), 'save must succeed');

  const loaded = GameState.load(storage);
  assertEqual(loaded.credits, state.credits, 'credits preserved');
  assertEqual(loaded.crystals, state.crystals, 'crystals preserved');
  assertEqual(loaded.crew.size, 2, 'collection preserved');
  assertEqual(loaded.ship.purchasedCount, state.ship.purchasedCount, 'expansion cells preserved');
  assertEqual(loaded.crewSlots, 1, '10 purchased cells unlock exactly one crew slot');
  assertEqual(loaded.equippedCrew.length, 1, 'equipped crew preserved');
  assertEqual(loaded.activeUpgrades[0], 'overclock', 'active upgrade preserved');
  assert(loaded.unlockedSectors.has('crystal_nebula'), 'unlocked sector preserved');
  assertEqual(loaded.serialize().version, SAVE_VERSION);
});

test('corrupt and tampered saves are rejected safely', () => {
  const storage = new MemoryStorage();
  storage.setItem('spaceminer.save.v3', '{not json');
  const recovered = GameState.load(storage);
  assert(recovered.loadWarning !== null, 'a warning is reported');
  assert(recovered.ship.hasCockpit(), 'a playable ship is restored');

  const future = new GameState().serialize();
  (future as any).version = 999;
  const { state: rejected, warning } = GameState.deserialize(future);
  assert(warning !== null, 'future save versions are rejected');
  assertEqual(rejected.credits, 2500, 'falls back to a new campaign');

  const tampered = new GameState().serialize();
  tampered.credits = 999999999;
  const { warning: checksumWarning } = GameState.deserialize(tampered);
  assert(checksumWarning !== null, 'checksum mismatch is detected');
});

test('equipping crew beyond unlocked slots is impossible', () => {
  const state = new GameState();
  state.grantCard(CREW_CARDS[0].id);
  state.grantCard(CREW_CARDS[1].id);
  assertEqual(state.crewSlots, 0, 'no cells purchased yet');
  assertEqual(state.equipCrew(CREW_CARDS[0].id), false, 'cannot equip without a slot');
  for (let i = 0; i < 10; i++) state.ship.buyCell([2 + i, 0, 0]);
  assertEqual(state.crewSlots, 1);
  assertEqual(state.equipCrew(CREW_CARDS[0].id), true);
  assertEqual(state.equipCrew(CREW_CARDS[1].id), false, 'second card needs a second slot');
  assertEqual(state.equipCrew(CREW_CARDS[0].id), false, 'cannot equip the same card twice');
});

test('sector unlocking spends credits exactly once', () => {
  const state = new GameState();
  const nebula = SECTORS[1];
  state.addCredits(nebula.unlockCost);
  const before = state.credits;
  assertEqual(state.unlockSector(nebula.id), true);
  assertEqual(state.credits, before - nebula.unlockCost, 'cost deducted');
  assertEqual(state.unlockSector(nebula.id), false, 'cannot unlock twice');
  assertEqual(state.unlockSector(SECTORS[4].id), false, 'cannot afford the void frontier yet');
});
