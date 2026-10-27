/**
 * Mutant species: stats, procedural rigs, hit spheres and behaviour profiles.
 */
import * as THREE from 'three';
import { Humanoid, Quadruped, PALETTES } from './humanoid.js';

const eyeMat = () => new THREE.MeshStandardMaterial({ color: 0x1a1a12, emissive: 0x8a7a20, emissiveIntensity: 1.6, roughness: 0.2 });
const glowMat = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: 0x223322, emissive: c, emissiveIntensity: i, roughness: 0.4 });

export const MUTANTS = {
  hollow: {
    id: 'hollow', name: 'The Hollow', rig: 'humanoid', palette: PALETTES.hollow, scale: 1.02,
    health: 95, xp: 28, damage: 16, speed: 1.1, chaseSpeed: 4.0, attackRange: 2.0, attackCooldown: 1.25,
    sight: 26, hearing: 30, fov: 1.9, pack: 0.35, stagger: 0.55, loot: 'corpse', region: [0, 2, 3],
    night: true, sound: 'growl', description: 'Humanoid, blind, and sensitive to every sound you make.',
    bloodColor: 0x5a1010, hitScale: 1,
  },
  crawler: {
    id: 'crawler', name: 'The Crawler', rig: 'quad', scale: 1.05,
    health: 62, xp: 22, damage: 12, speed: 2.2, chaseSpeed: 6.4, attackRange: 1.7, attackCooldown: 0.85,
    sight: 20, hearing: 26, fov: 2.3, pack: 0.5, stagger: 0.4, loot: 'corpse', region: [1, 2, 3, 5],
    night: false, sound: 'crawlerScreech', description: 'Low, fast, and it hunts in numbers.',
    bloodColor: 0x6a1010, hitScale: 0.75,
  },
  watcher: {
    id: 'watcher', name: 'The Watcher', rig: 'watcher', scale: 1.35,
    health: 140, xp: 55, damage: 0, speed: 0.6, chaseSpeed: 0.0, attackRange: 0, attackCooldown: 2.0,
    sight: 60, hearing: 20, fov: 2.8, pack: 0, stagger: 0, loot: 'corpse', region: [1, 4, 5],
    night: true, sound: 'watcherHum', description: 'It does not attack. It watches, and your mind frays.',
    bloodColor: 0x2a2a1a, hitScale: 1.1, passive: true, sanityDrain: 0.42,
  },
  screamer: {
    id: 'screamer', name: 'The Screamer', rig: 'humanoid', palette: { skin: 0xa09080, shirt: 0x3a2a2a, pants: 0x2a2420, boots: 0x1a1614, gear: 0x3a3430, hair: 0x2a1a10 }, scale: 1.12,
    health: 70, xp: 40, damage: 8, speed: 1.0, chaseSpeed: 3.2, attackRange: 1.8, attackCooldown: 1.6,
    sight: 32, hearing: 34, fov: 2.0, pack: 0, stagger: 0.5, loot: 'corpse', region: [1, 2, 5],
    night: false, sound: 'scream', description: 'Its scream drags every mutant in earshot to your position.',
    bloodColor: 0x5a1010, hitScale: 1, screams: true,
  },
  brute: {
    id: 'brute', name: 'The Brute', rig: 'brute', scale: 1.75,
    health: 620, xp: 160, damage: 42, speed: 1.0, chaseSpeed: 3.4, attackRange: 2.9, attackCooldown: 1.9,
    sight: 24, hearing: 24, fov: 1.7, pack: 0, stagger: 0.9, loot: 'boss', region: [2, 3, 4, 5],
    night: false, sound: 'growl', description: 'Bone plates over muscle. Bullets mostly make it angrier.',
    bloodColor: 0x4a0a0a, hitScale: 1.8, armor: 0.3, heavy: true, charge: true,
  },
  mimic: {
    id: 'mimic', name: 'The Mimic', rig: 'humanoid', palette: { skin: 0x8a7a6a, shirt: 0x4a4038, pants: 0x35302a, boots: 0x201c18, gear: 0x4a4234, hair: 0x2a2018 }, scale: 1.0,
    health: 110, xp: 60, damage: 26, speed: 1.2, chaseSpeed: 4.6, attackRange: 2.0, attackCooldown: 1.1,
    sight: 16, hearing: 40, fov: 2.4, pack: 0, stagger: 0.5, loot: 'corpse', region: [0, 1, 3],
    night: true, sound: 'growl', description: 'It copies a human voice. It has never heard one speak kindly.',
    bloodColor: 0x5a1010, hitScale: 1, mimic: true,
  },
  burrower: {
    id: 'burrower', name: 'The Burrower', rig: 'quad', scale: 1.2, health: 150, xp: 70, damage: 24,
    speed: 1.4, chaseSpeed: 5.0, attackRange: 2.0, attackCooldown: 1.4, sight: 14, hearing: 45, fov: 2.6,
    pack: 0, stagger: 0.5, loot: 'cave', region: [1, 2, 5], night: true, sound: 'crawlerScreech',
    description: 'Travels through tunnels under the ground and erupts beneath its prey.',
    bloodColor: 0x501010, hitScale: 1.0, burrow: true,
  },
  stalker: {
    id: 'stalker', name: 'The Stalker', rig: 'quad', scale: 1.25, health: 210, xp: 95, damage: 34,
    speed: 2.4, chaseSpeed: 7.2, attackRange: 2.1, attackCooldown: 1.0, sight: 40, hearing: 30, fov: 2.0,
    pack: 0, stagger: 0.45, loot: 'corpse', region: [4, 5], night: true, sound: 'crawlerScreech',
    description: 'Hunts isolated targets. It avoids groups and gunfire.',
    bloodColor: 0x4a0a0a, hitScale: 1.05, stealth: true, smart: true,
  },
  contaminated: {
    id: 'contaminated', name: 'The Contaminated', rig: 'humanoid', palette: { skin: 0x8a9a5a, shirt: 0x3a4a26, pants: 0x2e3a20, boots: 0x1a2014, gear: 0x4a5a30, hair: 0x2a3a1a }, scale: 1.05,
    health: 130, xp: 65, damage: 20, speed: 1.0, chaseSpeed: 3.6, attackRange: 2.0, attackCooldown: 1.3,
    sight: 20, hearing: 22, fov: 2.0, pack: 0.3, stagger: 0.5, loot: 'lab', region: [2, 4, 5], night: false,
    sound: 'growl', description: 'Swollen with radiation. Proximity alone will poison you.',
    bloodColor: 0x3a5a1a, hitScale: 1.1, radiation: 0.55,
  },
  pale: {
    id: 'pale', name: 'The Pale One', rig: 'humanoid', palette: PALETTES.pale, scale: 1.28,
    health: 320, xp: 180, damage: 38, speed: 1.8, chaseSpeed: 6.0, attackRange: 2.3, attackCooldown: 0.9,
    sight: 44, hearing: 40, fov: 2.1, pack: 0, stagger: 0.6, loot: 'boss', region: [1, 5], night: true,
    sound: 'scream', description: 'Nocturnal apex predator. It only comes out in the dark.',
    bloodColor: 0x6a1010, hitScale: 1.15, smart: true, armor: 0.12,
  },
};

/** Bosses reuse creature rigs but with dedicated scaling, armor and phases. */
export const BOSSES = {
  hollowKing: {
    id: 'hollowKing', name: 'THE HOLLOW KING', mutant: 'hollow', scale: 1.9, health: 2400, xp: 1200,
    damage: 46, speed: 1.3, chaseSpeed: 4.6, attackRange: 3.4, attackCooldown: 1.5, sight: 50, hearing: 60,
    phases: 2, arena: [-1050, -1090], reward: 'hollowKing', description: 'Every sound in the suburbs belongs to him.',
  },
  ironAbomination: {
    id: 'ironAbomination', name: 'THE IRON ABOMINATION', mutant: 'brute', scale: 2.1, health: 3600, xp: 1800,
    damage: 62, speed: 1.1, chaseSpeed: 3.6, attackRange: 3.8, attackCooldown: 2.0, sight: 40, hearing: 50,
    phases: 3, arena: [-40, -300], reward: 'ironAbomination', description: 'Fused with the machinery it once operated.',
  },
  forestMatriarch: {
    id: 'forestMatriarch', name: 'THE FOREST MATRIARCH', mutant: 'stalker', scale: 2.0, health: 3000, xp: 1600,
    damage: 54, speed: 2.2, chaseSpeed: 7.0, attackRange: 3.2, attackCooldown: 1.2, sight: 60, hearing: 60,
    phases: 2, arena: [-420, -1110], reward: 'forestMatriarch', description: 'The forest grew around her. She liked it that way.',
  },
  contaminatedTitan: {
    id: 'contaminatedTitan', name: 'THE CONTAMINATED TITAN', mutant: 'contaminated', scale: 2.4, health: 4200, xp: 2200,
    damage: 70, speed: 1.0, chaseSpeed: 3.4, attackRange: 4.0, attackCooldown: 2.2, sight: 45, hearing: 45,
    phases: 3, arena: [990, 870], reward: 'contaminatedTitan', description: 'A walker in a lake of poison.',
  },
  paleCommander: {
    id: 'paleCommander', name: 'THE PALE COMMANDER', mutant: 'pale', scale: 2.0, health: 4800, xp: 2800,
    damage: 76, speed: 2.0, chaseSpeed: 6.8, attackRange: 3.4, attackCooldown: 1.4, sight: 70, hearing: 70,
    phases: 3, arena: [430, 700], reward: 'paleCommander', description: 'It wears the uniform of the soldiers who made it.',
  },
  lastSignal: {
    id: 'lastSignal', name: 'THE LAST SIGNAL', mutant: null, scale: 4.0, health: 9000, xp: 6000,
    damage: 90, speed: 0.8, chaseSpeed: 3.0, attackRange: 7.5, attackCooldown: 2.4, sight: 90, hearing: 90,
    phases: 3, arena: [1270, 1260], reward: 'lastSignal', description: 'The broadcast has a body. It has been waiting.',
  },
};

const MATERIALS = new Map();
function getMat(key, make) {
  if (!MATERIALS.has(key)) MATERIALS.set(key, make());
  return MATERIALS.get(key);
}

/** Builds the visual rig for a creature and returns {rig, hitSpheres, eye} */
export function buildCreatureRig(mutantId, { boss = null, scale = null, palette = null } = {}) {
  const def = boss || MUTANTS[mutantId];
  const s = scale ?? def.scale ?? 1;
  let rig;
  let eye = null;
  if (def.rig === 'quad') {
    rig = new Quadruped({ scale: s, bodyLen: 1.25 * (def.bossScale || 1), bodyH: 0.5 });
    rig.root.traverse((o) => {
      if (o.isMesh && o.material) o.material = o.material === rig.mats.skin ? getMat('mutSkin', () => new THREE.MeshStandardMaterial({ color: 0x5a4436, roughness: 0.68 })) : o.material;
    });
  } else if (def.rig === 'watcher') {
    rig = new Humanoid({ palette: { skin: 0x9a968a, shirt: 0x24262a, pants: 0x1e2024, boots: 0x14161a, gear: 0x2a2e34, hair: 0x101214 }, scale: s, build: 0.55, detail: 1 });
    // elongated skull, big eye
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), getMat('watcherSkin', () => new THREE.MeshStandardMaterial({ color: 0xa8a498, roughness: 0.55 })));
    skull.position.set(0, 0.14, 0.02);
    skull.scale.set(1, 1.25, 0.9);
    rig.head.add(skull);
    eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), glowMat(0xd8c070, 2.2));
    eye.position.set(0, 0.15, 0.11);
    rig.head.add(eye);
  } else if (def.rig === 'brute') {
    rig = new Humanoid({ palette: { skin: 0x7a6a58, shirt: 0x4a3a2e, pants: 0x3a2e26, boots: 0x24201c, gear: 0x5a4a3a, hair: 0x2a1e16 }, scale: s, build: 2.0, detail: 1 });
    // bone plates
    const plate = getMat('brutePlate', () => new THREE.MeshStandardMaterial({ color: 0xb8ad96, roughness: 0.62 }));
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 5), plate);
      p.position.set(-0.16 + i * 0.1, 0.2, 0.16);
      p.rotation.x = -0.6;
      rig.chest.add(p);
    }
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), plate);
    hump.position.set(0, 0.26, -0.1);
    hump.scale.set(1.4, 0.7, 1);
    rig.chest.add(hump);
  } else {
    rig = new Humanoid({ palette: palette || def.palette || PALETTES.hollow, scale: s, build: def.id === 'contaminated' ? 1.25 : def.id === 'pale' ? 0.85 : 1, detail: 1 });
  }
  rig.root.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  // species decorations
  if (mutantId === 'contaminated' || boss?.mutant === 'contaminated') {
    const glow = getMat('radGlow', () => glowMat(0x7ac04a, 1.4));
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 6), glow);
      g.position.set((Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3);
      rig.chest.add(g);
    }
    const light = new THREE.PointLight(0x8ad050, 2.4, 9, 2);
    light.position.set(0, 1.2, 0);
    rig.root.add(light);
  }
  if (mutantId === 'pale' || boss?.mutant === 'pale') {
    const paleGlow = getMat('paleGlow', () => glowMat(0xaacce0, 0.9));
    for (const side of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), paleGlow);
      e.position.set(side * 0.04, 0.1, 0.095);
      rig.head.add(e);
    }
  }
  if (mutantId === 'screamer') {
    const maw = getMat('maw', () => new THREE.MeshStandardMaterial({ color: 0x2a0c0c, roughness: 0.5 }));
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), maw);
    mouth.scale.set(1, 1.5, 0.6);
    mouth.position.set(0, 0.03, 0.09);
    rig.head.add(mouth);
  }
  if (mutantId === 'hollow' || boss?.mutant === 'hollow') {
    // blind sockets with a faint glow
    const socket = getMat('hollowEye', () => glowMat(0x9a7020, 0.7));
    for (const side of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), socket);
      e.position.set(side * 0.038, 0.1, 0.09);
      rig.head.add(e);
    }
  }
  if (mutantId === 'stalker' || boss?.mutant === 'stalker') {
    const spike = getMat('stalkerSpike', () => new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.5 }));
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.3, 4), spike);
      sp.position.set(0, 0.42, -0.55 + i * 0.28);
      sp.rotation.x = -0.2;
      rig.bones.body?.add(sp);
    }
  }
  // boss aura
  if (boss) {
    rig.root.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive !== undefined) {
        if (boss.id === 'hollowKing' || boss.id === 'ironAbomination') o.material = o.material.clone();
      }
    });
    if (boss.id === 'ironAbomination') {
      const metal = getMat('IronPlate', () => new THREE.MeshStandardMaterial({ color: 0x4a4a46, metalness: 0.8, roughness: 0.45 }));
      for (const b of ['chest', 'upperArmL', 'upperArmR', 'thighL', 'thighR']) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.34), metal);
        plate.position.set(0, 0.05, 0);
        rig.bones[b]?.add(plate);
      }
    }
  }
  // per-creature hit spheres (in local space, scaled by rig scale)
  const spheres = buildHitSpheres(def.rig, mutantId, s, boss);
  return { rig, spheres, eye };
}

function buildHitSpheres(rigType, mutantId, scale, boss) {
  const s = scale;
  const spheres = [];
  if (rigType === 'quad') {
    spheres.push({ part: 'head', x: 0, y: 0.95 * s, z: 0.72 * s, r: 0.24 * s });
    spheres.push({ part: 'torso', x: 0, y: 0.62 * s, z: 0, r: 0.45 * s });
    spheres.push({ part: 'leg', x: 0, y: 0.25 * s, z: -0.2 * s, r: 0.32 * s });
  } else {
    const big = boss ? 1.15 : 1;
    spheres.push({ part: 'head', x: 0, y: 1.72 * s * big, z: 0.03 * s, r: 0.155 * s * big });
    spheres.push({ part: 'torso', x: 0, y: 1.2 * s * big, z: 0, r: 0.33 * s * big });
    spheres.push({ part: 'torso', x: 0, y: 0.95 * s * big, z: 0, r: 0.3 * s * big });
    spheres.push({ part: 'leg', x: 0, y: 0.45 * s * big, z: 0, r: 0.3 * s * big });
    spheres.push({ part: 'arm', x: -0.34 * s, y: 1.35 * s * big, z: 0, r: 0.2 * s });
    spheres.push({ part: 'arm', x: 0.34 * s, y: 1.35 * s * big, z: 0, r: 0.2 * s });
  }
  return spheres;
}

/** Intersect a ray with a creature's hit spheres, returning nearest part. */
export function intersectSpheres(origin, dir, spheres, base, maxDist) {
  let best = null;
  for (const sp of spheres) {
    const cx = base.x + sp.x;
    const cy = base.y + sp.y;
    const cz = base.z + sp.z;
    const ox = origin.x - cx;
    const oy = origin.y - cy;
    const oz = origin.z - cz;
    const b = ox * dir.x + oy * dir.y + oz * dir.z;
    const c = ox * ox + oy * oy + oz * oz - sp.r * sp.r;
    const disc = b * b - c;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t < 0 || t > maxDist) continue;
    if (!best || t < best.distance) {
      best = {
        distance: t,
        part: sp.part,
        point: new THREE.Vector3(origin.x + dir.x * t, origin.y + dir.y * t, origin.z + dir.z * t),
      };
    }
  }
  return best;
}
