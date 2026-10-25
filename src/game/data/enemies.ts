import type { EnemyDef, WaveDef } from '../types';

export const ENEMIES: EnemyDef[] = [
  {
    id: 'wisp',
    name: 'Guttering Wisp',
    blurb: 'The procession\'s smallest candle. Fragile, endless, and always first.',
    hp: 34,
    speed: 56,
    armor: 0,
    gold: 4,
    leak: 2,
    kind: 'walker',
    shape: 'wisp',
    color: '#9fb0d6',
    size: 15,
  },
  {
    id: 'mite',
    name: 'Cinder Mite',
    blurb: 'Quick little scavengers that stream ahead of the choir.',
    hp: 18,
    speed: 84,
    armor: 0,
    gold: 3,
    leak: 1,
    kind: 'walker',
    shape: 'mite',
    color: '#e8b27a',
    size: 11,
  },
  {
    id: 'husk',
    name: 'Wax Husk',
    blurb: 'A body of half-rendered tallow. Slow, thick, and stubborn.',
    hp: 96,
    speed: 34,
    armor: 2,
    gold: 8,
    leak: 3,
    kind: 'walker',
    shape: 'husk',
    color: '#c8b28c',
    size: 21,
  },
  {
    id: 'flier',
    name: 'Moth Pilgrim',
    blurb: 'Flies straight for the hearth, ignoring every turn of the road.',
    hp: 32,
    speed: 62,
    armor: 0,
    gold: 4,
    leak: 2,
    kind: 'flier',
    shape: 'flier',
    color: '#e6d5a8',
    size: 15,
  },
  {
    id: 'creeper',
    name: 'Split Creeper',
    blurb: 'Bursts into two smaller creepers when killed. Cut carefully.',
    hp: 64,
    speed: 44,
    armor: 1,
    gold: 7,
    leak: 2,
    kind: 'walker',
    shape: 'creeper',
    color: '#93c98a',
    size: 20,
    abilities: [{ kind: 'split', power: 2 }],
  },
  {
    id: 'splitling',
    name: 'Creeper Bit',
    blurb: 'The second half of a bad decision.',
    hp: 22,
    speed: 76,
    armor: 0,
    gold: 1,
    leak: 1,
    kind: 'splitling',
    shape: 'mite',
    color: '#b7e6a8',
    size: 11,
  },
  {
    id: 'burrower',
    name: 'Peat Burrower',
    blurb: 'Armoured in root and mud. Shrugs off fire and slows down anyone who hits it.',
    hp: 132,
    speed: 37,
    armor: 4,
    gold: 10,
    leak: 3,
    kind: 'walker',
    shape: 'brute',
    color: '#8a7a5e',
    size: 24,
    resist: { ember: 0.2, frost: 0.1 },
    abilities: [{ kind: 'burrow', power: 0.35, interval: 4 }],
  },
  {
    id: 'shrieker',
    name: 'Shrieker',
    blurb: 'Its wail quickens the whole procession around it.',
    hp: 72,
    speed: 46,
    armor: 1,
    gold: 8,
    leak: 2,
    kind: 'walker',
    shape: 'shade',
    color: '#d59ad0',
    size: 19,
    abilities: [{ kind: 'hasteAura', power: 0.22, radius: 120, interval: 0.5 }],
  },
  {
    id: 'warder',
    name: 'Tallow Warder',
    blurb: 'Mends nearby walkers with warm wax. Kill it before the crowd.',
    hp: 112,
    speed: 40,
    armor: 2,
    gold: 9,
    leak: 3,
    kind: 'walker',
    shape: 'warder',
    color: '#f0c98a',
    size: 22,
    abilities: [{ kind: 'heal', power: 14, radius: 110, interval: 1.6 }],
  },
  {
    id: 'shade',
    name: 'Wane Shade',
    blurb: 'Half in the dark already. Cold barely clings to it.',
    hp: 86,
    speed: 58,
    armor: 1,
    gold: 8,
    leak: 3,
    kind: 'walker',
    shape: 'shade',
    color: '#8f86b8',
    size: 19,
    resist: { frost: 0.4, umbral: 0.2 },
  },
  {
    id: 'herald',
    name: 'Hollow Herald',
    blurb: 'Boss. Calls the choir forward and rings the road with its passing.',
    hp: 760,
    speed: 30,
    armor: 4,
    gold: 48,
    leak: 6,
    kind: 'boss',
    shape: 'herald',
    color: '#e2a05c',
    size: 44,
    boss: true,
    abilities: [{ kind: 'summon', power: 4, interval: 6 }],
  },
  {
    id: 'choir',
    name: 'Choir of Thorns',
    blurb: 'Boss. Sings its followers back together and grows more terrible as it is wounded.',
    hp: 1800,
    speed: 27,
    armor: 6,
    gold: 70,
    leak: 6,
    kind: 'boss',
    shape: 'choir',
    color: '#86c492',
    size: 48,
    boss: true,
    abilities: [
      { kind: 'heal', power: 26, radius: 170, interval: 3 },
      { kind: 'summon', power: 4, interval: 9 },
    ],
  },
  {
    id: 'king',
    name: 'The Waning King',
    blurb:
      'Boss. What is left of the lantern-thief. Furnace-ribbed, enormous, and entirely unwilling to go out.',
    hp: 3600,
    speed: 25,
    armor: 9,
    gold: 120,
    leak: 12,
    kind: 'boss',
    shape: 'king',
    color: '#f0b979',
    size: 58,
    boss: true,
    abilities: [
      { kind: 'summon', power: 8, interval: 7 },
      { kind: 'enrage', power: 0.5 },
      { kind: 'shield', power: 0.25, interval: 9 },
    ],
  },
];

export const ENEMY_BY_ID: Record<string, EnemyDef> = ENEMIES.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<string, EnemyDef>,
);

export const ACTS = [
  { act: 1, name: 'The Low Choir', blurb: 'They come in a line. Teach them the road.' },
  { act: 2, name: 'Guttering Rows', blurb: 'The road remembers being a river.' },
  { act: 3, name: 'The Waning King', blurb: 'Something enormous is carrying the lantern.' },
];

export const WAVES: WaveDef[] = [
  {
    index: 1,
    act: 1,
    name: 'First Guttering',
    subtitle: 'Wisps drift in from the west.',
    reward: 40,
    boss: false,
    groups: [{ type: 'wisp', count: 8, gap: 1.15, delay: 0 }],
  },
  {
    index: 2,
    act: 1,
    name: 'Quick Embers',
    subtitle: 'Mites run ahead of the lanterns.',
    reward: 46,
    boss: false,
    groups: [
      { type: 'wisp', count: 10, gap: 0.95, delay: 0 },
      { type: 'mite', count: 5, gap: 0.6, delay: 5 },
    ],
  },
  {
    index: 3,
    act: 1,
    name: 'Wax and Woe',
    subtitle: 'Husks join the line. They do not hurry.',
    reward: 52,
    boss: false,
    groups: [
      { type: 'husk', count: 4, gap: 1.7, delay: 1 },
      { type: 'wisp', count: 10, gap: 0.85, delay: 5 },
    ],
  },
  {
    index: 4,
    act: 1,
    name: 'Wings Over the Row',
    subtitle: 'Moth pilgrims cut straight for the hearth.',
    reward: 58,
    boss: false,
    groups: [
      { type: 'flier', count: 8, gap: 0.9, delay: 0 },
      { type: 'mite', count: 8, gap: 0.55, delay: 7 },
    ],
  },
  {
    index: 5,
    act: 1,
    name: 'The Hollow Herald',
    subtitle: 'Boss. It carries a lantern that is not its own.',
    reward: 110,
    boss: true,
    groups: [
      { type: 'herald', count: 1, gap: 1, delay: 0 },
      { type: 'wisp', count: 12, gap: 0.8, delay: 4 },
    ],
  },
  {
    index: 6,
    act: 2,
    name: 'Creeping Things',
    subtitle: 'Creepers split. Burn them whole.',
    reward: 70,
    boss: false,
    groups: [
      { type: 'creeper', count: 6, gap: 1.4, delay: 0 },
      { type: 'husk', count: 4, gap: 1.3, delay: 6 },
    ],
  },
  {
    index: 7,
    act: 2,
    name: 'The Shrieking',
    subtitle: 'Shriekers make everything faster.',
    reward: 76,
    boss: false,
    groups: [
      { type: 'flier', count: 10, gap: 0.85, delay: 0 },
      { type: 'shrieker', count: 2, gap: 2.5, delay: 4 },
      { type: 'wisp', count: 12, gap: 0.6, delay: 6 },
    ],
  },
  {
    index: 8,
    act: 2,
    name: 'Tallow Warders',
    subtitle: 'Warders mend the crowd. Cut the seam.',
    reward: 82,
    boss: false,
    groups: [
      { type: 'warder', count: 3, gap: 2.2, delay: 0 },
      { type: 'husk', count: 6, gap: 1.2, delay: 3 },
      { type: 'mite', count: 14, gap: 0.42, delay: 7 },
    ],
  },
  {
    index: 9,
    act: 2,
    name: 'Root and Mud',
    subtitle: 'Burrowers resist fire and slow those who strike them.',
    reward: 88,
    boss: false,
    groups: [
      { type: 'burrower', count: 5, gap: 1.8, delay: 0 },
      { type: 'creeper', count: 8, gap: 1.1, delay: 4 },
      { type: 'flier', count: 6, gap: 0.8, delay: 9 },
    ],
  },
  {
    index: 10,
    act: 2,
    name: 'Choir of Thorns',
    subtitle: 'Boss. Its song stitches the fallen back together.',
    reward: 150,
    boss: true,
    groups: [
      { type: 'choir', count: 1, gap: 1, delay: 0 },
      { type: 'warder', count: 2, gap: 3, delay: 6 },
      { type: 'wisp', count: 14, gap: 0.7, delay: 3 },
    ],
  },
  {
    index: 11,
    act: 3,
    name: 'Shades in Rows',
    subtitle: 'Wane shades barely feel the cold.',
    reward: 105,
    boss: false,
    groups: [
      { type: 'husk', count: 10, gap: 1.1, delay: 0 },
      { type: 'shade', count: 4, gap: 1.6, delay: 4 },
      { type: 'warder', count: 3, gap: 2.4, delay: 9 },
    ],
  },
  {
    index: 12,
    act: 3,
    name: 'Peat Tide',
    subtitle: 'A wall of burrowers, split by creepers.',
    reward: 112,
    boss: false,
    groups: [
      { type: 'burrower', count: 8, gap: 1.2, delay: 0 },
      { type: 'creeper', count: 10, gap: 0.9, delay: 5 },
      { type: 'shrieker', count: 3, gap: 2, delay: 9 },
    ],
  },
  {
    index: 13,
    act: 3,
    name: 'Wings of the Wane',
    subtitle: 'Everything that flies, all at once.',
    reward: 120,
    boss: false,
    groups: [
      { type: 'flier', count: 16, gap: 0.55, delay: 0 },
      { type: 'shade', count: 6, gap: 1.1, delay: 5 },
      { type: 'warder', count: 3, gap: 2.4, delay: 9 },
    ],
  },
  {
    index: 14,
    act: 3,
    name: 'The Last Procession',
    subtitle: 'Every voice in the choir, at once.',
    reward: 140,
    boss: false,
    groups: [
      { type: 'shrieker', count: 4, gap: 1.8, delay: 0 },
      { type: 'burrower', count: 8, gap: 1.1, delay: 3 },
      { type: 'husk', count: 12, gap: 0.7, delay: 6 },
      { type: 'creeper', count: 8, gap: 0.9, delay: 10 },
    ],
  },
  {
    index: 15,
    act: 3,
    name: 'The Waning King',
    subtitle: 'Boss. Take back what he stole from the lantern.',
    reward: 300,
    boss: true,
    groups: [
      { type: 'king', count: 1, gap: 1, delay: 0 },
      { type: 'shade', count: 6, gap: 1.4, delay: 6 },
      { type: 'warder', count: 2, gap: 3, delay: 10 },
      { type: 'husk', count: 10, gap: 0.9, delay: 14 },
    ],
  },
];

/** Waves past 15 are generated (endless). */
export const endlessWave = (index: number): WaveDef => {
  const pool = ['wisp', 'mite', 'husk', 'flier', 'creeper', 'burrower', 'shrieker', 'warder', 'shade'];
  const bossCycle = ['herald', 'choir'];
  const bossWave = index % 5 === 0;
  const groups = [];
  const seed = index * 2654435761;
  const count = Math.min(30, 6 + Math.floor(index * 0.8));
  const typeA = pool[Math.abs(seed) % pool.length] as string;
  const typeB = pool[Math.abs(seed >> 4) % pool.length] as string;
  groups.push({ type: typeA, count, gap: Math.max(0.35, 1.2 - index * 0.01), delay: 0 });
  if (typeB !== typeA) {
    groups.push({
      type: typeB,
      count: Math.max(3, Math.floor(count * 0.6)),
      gap: 0.8,
      delay: 5,
    });
  }
  let boss = false;
  if (bossWave) {
    boss = true;
    const bossType =
      index % 15 === 0 ? 'king' : (bossCycle[Math.floor(index / 5) % bossCycle.length] as string);
    groups.unshift({ type: bossType, count: 1, gap: 1, delay: 0 });
  }
  return {
    index,
    act: 4,
    name: `Endless Vigil ${index}`,
    subtitle: 'The lantern is holding. The dark is not finished.',
    reward: 120 + index * 8,
    boss,
    groups,
  };
};

export const waveDef = (index: number): WaveDef =>
  (WAVES[index - 1] as WaveDef | undefined) ?? endlessWave(index);
