import test from 'node:test';
import assert from 'node:assert/strict';
import {crewBerths,expansionCost,hullCapacity,rollRarity,totalCrewBonuses,standardPackCards,standardPackPrice,upgradeSlotLimit,fifthUpgradeSlotChance,utcPeriodEnd,isShipLayoutConnected} from '../src/core.js';

test('crew berths unlock exactly one per ten purchased expansion cells',()=>{
  for(const [cells,expected] of [[0,0],[9,0],[10,1],[19,1],[20,2],[29,2],[30,3]])assert.equal(crewBerths(cells),expected);
});
test('hull capacity and expansion pricing grow with purchases',()=>{
  assert.equal(hullCapacity(0),5);assert.equal(hullCapacity(10),15);assert.equal(expansionCost(0),150);assert.ok(expansionCost(5)>expansionCost(4));
});
test('pack economy has exactly three reveals and five crystal price',()=>{assert.equal(standardPackCards,3);assert.equal(standardPackPrice,5)});
test('upgrade system preserves slot cap and rare fifth slot odds',()=>{assert.equal(upgradeSlotLimit,5);assert.equal(fifthUpgradeSlotChance,.01)});
test('rarity roll selects all intended bands at defined boundaries',()=>{
 const cases=[[0,'Common'],[.479,'Common'],[.48,'Uncommon'],[.75,'Rare'],[.91,'Epic'],[.98,'Legendary'],[.997,'Mythic'],[.999,'Secret']];
 for(const [n,r] of cases)assert.equal(rollRarity(()=>n),r);
});
test('equipped crew bonuses apply once per unique crew member',()=>{
 const cards=[{id:1,role:'Gunner',bonus:'+20% damage'},{id:2,role:'Miner',bonus:'+50% output'}];
 assert.deepEqual(totalCrewBonuses(cards,[1,1,2]),{mining:1.5,damage:1.2,speed:1,energy:1,magnet:1,shield:1,rare:1});
});
test('ship construction validates adjacency, rejects overlaps and disconnections',()=>{
 const fixed=[{pos:[0,0,0]},{pos:[0,0,1.6]},{pos:[1.55,0,0]}];
 assert.equal(isShipLayoutConnected(fixed,[{pos:[0,1.55,0]},{pos:[0,3.1,0]}]),true);
 assert.equal(isShipLayoutConnected(fixed,[{pos:[8,0,8]}]),false);
 assert.equal(isShipLayoutConnected(fixed,[{pos:[1.55,0,0]}]),false);
});
test('achievement reset durations use reliable UTC millisecond intervals',()=>{
 const now=Date.UTC(2026,9,25,12);assert.equal(utcPeriodEnd(now,'minute')-now,60_000);assert.equal(utcPeriodEnd(now,'hourly')-now,3_600_000);assert.equal(utcPeriodEnd(now,'daily')-now,86_400_000);assert.equal(utcPeriodEnd(now,'weekly')-now,604_800_000);
});
