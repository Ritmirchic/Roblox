export const crewBerths = purchasedCells => Math.floor(Math.max(0, Number(purchasedCells) || 0) / 10);
export const expansionCost = purchasedCells => Math.floor(150 * Math.pow(1.24, Math.max(0, purchasedCells)));
export const hullCapacity = purchasedCells => 5 + Math.max(0, Number(purchasedCells) || 0);
export const standardPackPrice = 5;
export const standardPackCards = 3;
export const fifthUpgradeSlotChance = 0.01;
export const upgradeSlotLimit = 5;
export function rollRarity(random = Math.random) {
  const r = random();
  return r < .48 ? 'Common' : r < .75 ? 'Uncommon' : r < .91 ? 'Rare' : r < .98 ? 'Epic' : r < .997 ? 'Legendary' : r < .999 ? 'Mythic' : 'Secret';
}
export function utcPeriodEnd(now, period) {
  const spans = {minute: 60_000, hourly: 3_600_000, daily: 86_400_000, weekly: 604_800_000};
  if (!Object.hasOwn(spans, period)) throw new RangeError(`Unknown achievement period: ${period}`);
  return now + spans[period];
}
export function totalCrewBonuses(cards, equipped) {
  const out = {mining:1,damage:1,speed:1,energy:1,magnet:1,shield:1,rare:1};
  for (const id of new Set(equipped)) {
    const card = cards.find(c => c.id === id);
    if (!card) continue;
    const amount = Number(card.bonus.match(/\+?(\d+)%/)?.[1] || 0) / 100;
    const category = {Miner:'mining',Gunner:'damage',Pilot:'speed',Engineer:'energy',Collector:'magnet',Commander:'shield',Scientist:'rare'}[card.role];
    if (category) out[category] += amount;
  }
  return out;
}
const cellKey = p => p.map(n => Math.round(Number(n)*100)/100).join(',');
export function isShipLayoutConnected(fixed, mounted) {
  const nodes=[...fixed,...mounted];
  if(new Set(nodes.map(n=>cellKey(n.pos))).size!==nodes.length)return false;
  if(!mounted.length)return true;
  const reached=new Set(fixed.map(n=>cellKey(n.pos))),queue=[...reached];
  while(queue.length){const key=queue.shift(),point=key.split(',').map(Number);for(const node of nodes){const next=cellKey(node.pos);if(reached.has(next))continue;const delta=node.pos.reduce((sum,x,i)=>sum+Math.abs(Number(x)-point[i]),0);if(delta<=1.71){reached.add(next);queue.push(next)}}}
  return mounted.every(node=>reached.has(cellKey(node.pos)));
}
