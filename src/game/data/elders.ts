import type { ElderDef } from '../types';

/**
 * Elders are forged by fusing two tier-3 sigils of the same family.
 * They are the run's capstone: expensive, loud, and build-defining.
 */
export const ELDERS: ElderDef[] = [
  {
    id: 'pyre_heart',
    family: 'ember',
    name: 'Pyre Heart',
    role: 'Elder · inferno artillery',
    description:
      'Lobs a heart of living coals. The blast spreads fire through entire packs and burns far hotter than any mortal sigil.',
    flavor: 'Two fires argued until only one remained.',
    attack: 'splash',
    range: 250,
    damage: 84,
    interval: 1.4,
    projectileSpeed: 330,
    splash: 108,
    status: { id: 'burn', power: 15, duration: 5, stacks: 3 },
    flags: ['burnSpread', 'bonusVsBurning'],
    fuseCost: 110,
  },
  {
    id: 'winter_glass',
    family: 'frost',
    name: 'Winter Glass',
    role: 'Elder · freezing ring',
    description:
      'A suspended pane of ancient winter. Every pulse chills the whole ring and can lock enemies in place entirely.',
    flavor: 'The season that refused to end.',
    attack: 'pulse',
    range: 0,
    radius: 182,
    damage: 56,
    interval: 1.7,
    status: { id: 'chill', power: 0.5, duration: 3, stacks: 1 },
    flags: ['freezeOnHit'],
    fuseCost: 110,
  },
  {
    id: 'elder_grove',
    family: 'verdant',
    name: 'Elder Grove',
    role: 'Elder · support & rot',
    description:
      'An old tree with opinions. Poisons everything in its shade and feeds every sigil on the board a share of its strength.',
    flavor: 'It was here before the road was.',
    attack: 'field',
    range: 0,
    radius: 162,
    damage: 17,
    interval: 0.8,
    status: { id: 'poison', power: 7, duration: 4, stacks: 3 },
    auraDamage: 0.22,
    globalAuraDamage: 0.16,
    healPerWave: 3,
    fuseCost: 110,
  },
  {
    id: 'storm_throne',
    family: 'volt',
    name: 'Storm Throne',
    role: 'Elder · chain lightning',
    description:
      'A seat of stormcloud that arcs across six enemies at once, leaving the entire horde conductive.',
    flavor: 'The crown was never removed.',
    attack: 'chain',
    range: 238,
    damage: 46,
    interval: 0.86,
    chains: 6,
    status: { id: 'shock', power: 0.24, duration: 2.6, stacks: 1 },
    fuseCost: 110,
  },
  {
    id: 'hollow_choir',
    family: 'umbral',
    name: 'Hollow Choir',
    role: 'Elder · execution',
    description:
      'A ring of masks that sings the wounded out of existence, marking the crowd as it does.',
    flavor: 'Everyone is invited. Few attend twice.',
    attack: 'execute',
    range: 265,
    damage: 62,
    interval: 0.9,
    targetMode: 'weakest',
    status: { id: 'mark', power: 0.3, duration: 4, stacks: 1 },
    flags: ['executioner', 'bonusVsMarked', 'markSpread'],
    fuseCost: 110,
  },
];

export const ELDER_BY_ID: Record<string, ElderDef> = ELDERS.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<string, ElderDef>,
);

export const elderForFamily = (family: string): ElderDef | undefined =>
  ELDERS.find((e) => e.family === family);
