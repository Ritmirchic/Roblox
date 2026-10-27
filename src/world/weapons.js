/**
 * Weapon definitions and procedural weapon models.
 * Every weapon is built from primitives at load time - no external meshes.
 */
import * as THREE from 'three';

const steel = () => new THREE.MeshStandardMaterial({ color: 0x3a3d3f, roughness: 0.42, metalness: 0.85 });
const darkSteel = () => new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5, metalness: 0.8 });
const woodMat = () => new THREE.MeshStandardMaterial({ color: 0x5b4327, roughness: 0.72, metalness: 0.0 });
const polymer = () => new THREE.MeshStandardMaterial({ color: 0x2a2c28, roughness: 0.78, metalness: 0.1 });
const tape = () => new THREE.MeshStandardMaterial({ color: 0x8a8272, roughness: 0.95 });
const rustMat = () => new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.85, metalness: 0.3 });

function boxMesh(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function cylMesh(parent, r1, r2, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/**
 * Weapon model. Weapons point down -Z (three.js forward) and are built so the
 * grip is near the origin (right hand).
 */
export function buildWeaponModel(id) {
  const g = new THREE.Group();
  g.name = `weapon:${id}`;
  const muzzle = new THREE.Object3D();
  const eject = new THREE.Object3D();
  const sight = new THREE.Object3D();
  const S = steel();
  const D = darkSteel();
  const W = woodMat();
  const P = polymer();
  const T = tape();
  const R = rustMat();

  switch (id) {
    case 'knife': {
      boxMesh(g, 0.028, 0.035, 0.12, T, 0, 0, 0.02);
      boxMesh(g, 0.012, 0.05, 0.24, S, 0, 0.005, -0.16).rotation.x = 0.05;
      boxMesh(g, 0.03, 0.012, 0.05, D, 0, -0.03, 0.0);
      muzzle.position.set(0, 0, -0.3);
      sight.position.set(0, 0.03, -0.2);
      break;
    }
    case 'machete': {
      boxMesh(g, 0.03, 0.06, 0.14, T, 0, 0, 0.05);
      boxMesh(g, 0.008, 0.09, 0.52, S, 0.005, 0.01, -0.24, 0.08);
      boxMesh(g, 0.035, 0.02, 0.06, D, 0, -0.05, 0.02);
      muzzle.position.set(0, 0.05, -0.5);
      sight.position.set(0, 0.06, -0.3);
      break;
    }
    case 'axe': {
      cylMesh(g, 0.017, 0.02, 0.8, W, 0, 0, -0.18, Math.PI / 2);
      boxMesh(g, 0.02, 0.16, 0.14, R, 0, 0.09, -0.5);
      boxMesh(g, 0.012, 0.2, 0.12, S, 0, 0.1, -0.56).rotation.x = 0.05;
      muzzle.position.set(0, 0.1, -0.6);
      sight.position.set(0, 0.1, -0.4);
      break;
    }
    case 'wrench': {
      cylMesh(g, 0.016, 0.02, 0.55, R, 0, 0, -0.16, Math.PI / 2);
      boxMesh(g, 0.035, 0.09, 0.05, R, 0, 0.075, -0.44);
      boxMesh(g, 0.03, 0.05, 0.1, R, 0, 0.075, -0.48);
      muzzle.position.set(0, 0.08, -0.5);
      sight.position.set(0, 0.05, -0.3);
      break;
    }
    case 'pistol': {
      boxMesh(g, 0.038, 0.11, 0.24, D, 0, 0.03, -0.06);
      boxMesh(g, 0.032, 0.15, 0.055, P, 0, -0.08, 0.03, 0.22);
      boxMesh(g, 0.03, 0.07, 0.1, S, 0, 0.045, -0.2);
      cylMesh(g, 0.013, 0.013, 0.12, S, 0, 0.05, -0.3, Math.PI / 2);
      boxMesh(g, 0.012, 0.012, 0.03, S, 0, 0.1, -0.26);
      boxMesh(g, 0.008, 0.02, 0.008, S, 0, 0.085, 0.06);
      boxMesh(g, 0.006, 0.014, 0.006, S, 0, 0.085, -0.12);
      boxMesh(g, 0.02, 0.05, 0.06, T, 0, -0.03, -0.12);
      muzzle.position.set(0, 0.05, -0.37);
      eject.position.set(0.03, 0.06, -0.05);
      sight.position.set(0, 0.09, -0.3);
      break;
    }
    case 'revolver': {
      boxMesh(g, 0.036, 0.1, 0.2, D, 0, 0.03, -0.04);
      boxMesh(g, 0.03, 0.14, 0.05, W, 0, -0.06, 0.05, 0.3);
      cylMesh(g, 0.034, 0.034, 0.09, S, 0, 0.045, -0.12, 0, 0, Math.PI / 2);
      cylMesh(g, 0.011, 0.011, 0.2, S, 0, 0.05, -0.28, Math.PI / 2);
      boxMesh(g, 0.01, 0.04, 0.01, S, 0, 0.09, -0.33);
      boxMesh(g, 0.008, 0.02, 0.04, S, 0, 0.09, 0.05);
      muzzle.position.set(0, 0.05, -0.38);
      eject.position.set(0.03, 0.05, -0.1);
      sight.position.set(0, 0.09, -0.3);
      break;
    }
    case 'shotgun': {
      boxMesh(g, 0.045, 0.09, 0.3, D, 0, 0.03, -0.12);
      cylMesh(g, 0.02, 0.02, 0.7, S, 0, 0.06, -0.6, Math.PI / 2);
      cylMesh(g, 0.022, 0.022, 0.5, R, 0, 0.0, -0.5, Math.PI / 2);
      boxMesh(g, 0.05, 0.1, 0.35, W, 0, -0.01, 0.25, 0.12);
      boxMesh(g, 0.05, 0.07, 0.16, W, 0, 0.0, 0.2, -0.25);
      boxMesh(g, 0.03, 0.02, 0.05, S, 0, 0.09, -0.2);
      boxMesh(g, 0.008, 0.018, 0.008, S, 0, 0.085, -0.9);
      boxMesh(g, 0.02, 0.03, 0.04, T, 0, 0.04, -0.35);
      muzzle.position.set(0, 0.06, -0.97);
      eject.position.set(0.03, 0.07, -0.1);
      sight.position.set(0, 0.09, -0.8);
      break;
    }
    case 'rifle': {
      boxMesh(g, 0.042, 0.1, 0.42, D, 0, 0.02, -0.1);
      cylMesh(g, 0.014, 0.017, 0.8, S, 0, 0.055, -0.66, Math.PI / 2);
      boxMesh(g, 0.05, 0.11, 0.4, W, 0, 0.0, 0.34, 0.1);
      boxMesh(g, 0.05, 0.13, 0.18, W, 0, -0.05, 0.22);
      boxMesh(g, 0.06, 0.06, 0.14, W, 0, 0.035, -0.42);
      cylMesh(g, 0.022, 0.022, 0.24, S, 0, 0.11, -0.15, 0, 0, Math.PI / 2);
      cylMesh(g, 0.018, 0.018, 0.02, S, 0, 0.11, -0.03);
      boxMesh(g, 0.008, 0.02, 0.02, S, 0, 0.13, -0.95);
      boxMesh(g, 0.02, 0.03, 0.05, T, 0, 0.04, -0.55);
      // bolt handle
      boxMesh(g, 0.05, 0.012, 0.012, S, 0.05, 0.035, -0.02, 0, 0, 0.4);
      muzzle.position.set(0, 0.055, -1.07);
      eject.position.set(0.04, 0.06, -0.02);
      sight.position.set(0, 0.14, -0.9);
      break;
    }
    case 'assaultRifle': {
      boxMesh(g, 0.046, 0.11, 0.4, D, 0, 0.02, -0.08);
      cylMesh(g, 0.016, 0.016, 0.42, S, 0, 0.055, -0.48, Math.PI / 2);
      boxMesh(g, 0.05, 0.09, 0.2, P, 0, -0.005, -0.32);
      boxMesh(g, 0.03, 0.2, 0.09, P, 0, -0.14, -0.06, 0.16);
      boxMesh(g, 0.04, 0.1, 0.22, P, 0, 0.0, 0.2);
      boxMesh(g, 0.045, 0.06, 0.08, P, 0, -0.08, 0.08);
      boxMesh(g, 0.03, 0.13, 0.05, S, 0, 0.045, 0.28);
      boxMesh(g, 0.03, 0.02, 0.34, S, 0, 0.085, -0.2);
      boxMesh(g, 0.012, 0.03, 0.012, S, 0, 0.11, -0.72);
      boxMesh(g, 0.02, 0.03, 0.05, T, 0, 0.03, -0.4);
      // optic
      cylMesh(g, 0.026, 0.026, 0.13, S, 0, 0.13, -0.12, Math.PI / 2, 0, 0, 12);
      boxMesh(g, 0.03, 0.04, 0.04, D, 0, 0.1, -0.12);
      muzzle.position.set(0, 0.055, -0.71);
      eject.position.set(0.04, 0.06, -0.04);
      sight.position.set(0, 0.12, -0.6);
      break;
    }
    case 'smg': {
      boxMesh(g, 0.045, 0.1, 0.3, D, 0, 0.02, -0.06);
      cylMesh(g, 0.014, 0.014, 0.22, S, 0, 0.045, -0.3, Math.PI / 2);
      boxMesh(g, 0.03, 0.22, 0.06, S, 0, -0.14, -0.12, 0.1);
      boxMesh(g, 0.04, 0.1, 0.05, P, 0, -0.06, 0.06, 0.18);
      boxMesh(g, 0.02, 0.02, 0.3, S, 0, 0.075, 0.12);
      boxMesh(g, 0.05, 0.05, 0.05, P, 0, 0.0, 0.16);
      muzzle.position.set(0, 0.045, -0.46);
      eject.position.set(0.04, 0.05, -0.02);
      sight.position.set(0, 0.09, -0.36);
      break;
    }
    case 'crossbow': {
      boxMesh(g, 0.05, 0.09, 0.5, W, 0, 0, -0.1);
      boxMesh(g, 0.06, 0.05, 0.3, W, 0, -0.05, 0.2);
      boxMesh(g, 0.62, 0.02, 0.05, D, 0, 0.03, -0.3);
      boxMesh(g, 0.02, 0.03, 0.03, S, 0.3, 0.03, -0.3);
      boxMesh(g, 0.02, 0.03, 0.03, S, -0.3, 0.03, -0.3);
      boxMesh(g, 0.012, 0.012, 0.6, S, 0, 0.05, -0.35);
      boxMesh(g, 0.006, 0.03, 0.03, S, 0, 0.05, -0.66);
      boxMesh(g, 0.008, 0.028, 0.008, S, 0, 0.12, -0.1);
      muzzle.position.set(0, 0.05, -0.7);
      sight.position.set(0, 0.1, -0.5);
      break;
    }
    case 'sledge': {
      cylMesh(g, 0.02, 0.024, 0.9, W, 0, 0, -0.2, Math.PI / 2);
      boxMesh(g, 0.09, 0.12, 0.28, R, 0, 0.02, -0.6);
      boxMesh(g, 0.1, 0.14, 0.05, R, 0, 0.02, -0.48);
      boxMesh(g, 0.1, 0.14, 0.05, R, 0, 0.02, -0.72);
      muzzle.position.set(0, 0.02, -0.7);
      sight.position.set(0, 0.02, -0.5);
      break;
    }
    case 'flashlight': {
      cylMesh(g, 0.026, 0.03, 0.2, D, 0, 0, 0, Math.PI / 2);
      cylMesh(g, 0.036, 0.03, 0.05, S, 0, 0, -0.12, Math.PI / 2);
      muzzle.position.set(0, 0, -0.16);
      sight.position.set(0, 0, -0.1);
      break;
    }
    default: {
      boxMesh(g, 0.04, 0.08, 0.25, D, 0, 0, -0.1);
      muzzle.position.set(0, 0, -0.25);
      sight.position.set(0, 0.05, -0.2);
    }
  }
  g.add(muzzle);
  g.add(eject);
  g.add(sight);
  g.userData.muzzle = muzzle;
  g.userData.eject = eject;
  g.userData.sight = sight;
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  return g;
}

export const AMMO = {
  pistol: { name: '9x18mm', max: 180 },
  magnum: { name: '.44 Magnum', max: 90 },
  shell: { name: '12ga Buckshot', max: 80 },
  rifle: { name: '7.62x54mmR', max: 120 },
  intermediate: { name: '5.45x39mm', max: 300 },
  bolt: { name: 'Crossbow Bolt', max: 40 },
};

/**
 * Weapon stat block. damage = per projectile (shotgun uses pellets).
 */
export const WEAPONS = {
  fists: {
    id: 'fists', name: 'Bare Hands', class: 'melee', ammo: null, damage: 8, headMult: 1.4,
    rate: 0.55, spread: 0, mag: 0, reload: 0, range: 1.9, noise: 2, weight: 0, durability: Infinity,
    melee: true, description: 'Not much of a weapon, but better than nothing.',
  },
  knife: {
    id: 'knife', name: 'Combat Knife', class: 'melee', ammo: null, damage: 34, headMult: 2.2,
    rate: 0.42, spread: 0, mag: 0, reload: 0, range: 2.2, noise: 2.5, weight: 0.4, durability: 220,
    melee: true, description: 'Silent, fast, and effective from behind.', critBack: 2.6,
  },
  machete: {
    id: 'machete', name: 'Rusted Machete', class: 'melee', ammo: null, damage: 52, headMult: 1.8,
    rate: 0.62, spread: 0, mag: 0, reload: 0, range: 2.5, noise: 3, weight: 1.2, durability: 260,
    melee: true, description: 'A blade sharpened so many times the edge is wavy.',
  },
  axe: {
    id: 'axe', name: 'Fire Axe', class: 'melee', ammo: null, damage: 74, headMult: 1.7,
    rate: 0.86, spread: 0, mag: 0, reload: 0, range: 2.6, noise: 4, weight: 2.6, durability: 320,
    melee: true, description: 'Heavy, slow, and it never jams.',
  },
  wrench: {
    id: 'wrench', name: 'Pipe Wrench', class: 'melee', ammo: null, damage: 42, headMult: 1.9,
    rate: 0.75, spread: 0, mag: 0, reload: 0, range: 2.3, noise: 3.5, weight: 2.0, durability: 300,
    melee: true, description: 'Improvised, unbalanced, and dented with use.',
  },
  sledge: {
    id: 'sledge', name: 'Sledgehammer', class: 'melee', ammo: null, damage: 96, headMult: 1.5,
    rate: 1.15, spread: 0, mag: 0, reload: 0, range: 2.7, noise: 5, weight: 5.2, durability: 420,
    melee: true, description: 'Breaks bone as easily as it breaks concrete.',
  },
  pistol: {
    id: 'pistol', name: 'PM-9 Pistol', class: 'pistol', ammo: 'pistol', damage: 26, headMult: 2.0,
    rate: 0.22, spread: 0.016, mag: 8, reload: 1.7, range: 90, falloff: [22, 70, 0.55], noise: 60,
    weight: 1.0, durability: 400, recoil: 0.9, auto: false, pellets: 1, adsFov: 55, description: 'Reliable sidearm found in a police locker.',
  },
  revolver: {
    id: 'revolver', name: 'R-44 Revolver', class: 'pistol', ammo: 'magnum', damage: 68, headMult: 2.4,
    rate: 0.55, spread: 0.02, mag: 6, reload: 2.6, range: 110, falloff: [30, 85, 0.6], noise: 78,
    weight: 1.4, durability: 360, recoil: 1.7, auto: false, pellets: 1, adsFov: 52, description: 'Loud, brutal, and it stops anything at close range.',
  },
  smg: {
    id: 'smg', name: 'KS-Submachine Gun', class: 'smg', ammo: 'pistol', damage: 19, headMult: 1.8,
    rate: 0.085, spread: 0.028, mag: 30, reload: 2.1, range: 75, falloff: [18, 55, 0.5], noise: 65,
    weight: 2.6, durability: 420, recoil: 0.55, auto: true, pellets: 1, adsFov: 58, description: 'Folded stock, taped magazine. Supremely effective indoors.',
  },
  shotgun: {
    id: 'shotgun', name: 'Hunting Shotgun', class: 'shotgun', ammo: 'shell', damage: 15, headMult: 1.6,
    rate: 0.82, spread: 0.075, mag: 5, reload: 3.4, range: 40, falloff: [8, 26, 0.25], noise: 88,
    weight: 3.4, durability: 500, recoil: 2.1, auto: false, pellets: 9, pump: true, adsFov: 60,
    description: 'Break-action elegance married to survival pragmatism.',
  },
  rifle: {
    id: 'rifle', name: 'KV-7 Hunting Rifle', class: 'rifle', ammo: 'rifle', damage: 95, headMult: 2.6,
    rate: 1.05, spread: 0.008, mag: 5, reload: 3.0, range: 320, falloff: [80, 220, 0.7], noise: 115,
    weight: 4.2, durability: 460, recoil: 2.2, auto: false, pellets: 1, bolt: true, adsFov: 32,
    description: 'Pre-war bolt action rifle. Scoped shots reward patience.',
  },
  assaultRifle: {
    id: 'assaultRifle', name: 'ARS-4 Rifle', class: 'rifle', ammo: 'intermediate', damage: 31, headMult: 2.2,
    rate: 0.1, spread: 0.017, mag: 30, reload: 2.3, range: 200, falloff: [50, 150, 0.6], noise: 95,
    weight: 3.8, durability: 520, recoil: 1.2, auto: true, pellets: 1, adsFov: 45,
    description: 'Military issue. The Exclusion Zone is littered with them - and their owners.',
  },
  crossbow: {
    id: 'crossbow', name: 'Compound Crossbow', class: 'crossbow', ammo: 'bolt', damage: 110, headMult: 2.2,
    rate: 1.6, spread: 0.004, mag: 1, reload: 2.8, range: 120, falloff: [60, 110, 0.8], noise: 12,
    weight: 3.0, durability: 300, recoil: 0.8, auto: false, pellets: 1, adsFov: 40,
    description: 'Silent, retrievable, and terrifyingly precise.',
  },
};

export const WEAPON_CLASS_LABEL = {
  melee: 'MELEE',
  pistol: 'SIDEARM',
  smg: 'SUBMACHINE GUN',
  shotgun: 'SHOTGUN',
  rifle: 'RIFLE',
  crossbow: 'CROSSBOW',
};

export const ATTACHMENTS = {
  reflexSight: { id: 'reflexSight', name: 'Reflex Sight', slot: 'sight', spread: -0.25, adsFov: -6, description: 'Improves aimed accuracy.' },
  scope4x: { id: 'scope4x', name: '4x Scope', slot: 'sight', spread: -0.4, adsFov: -18, zoom: true, description: 'Long range optic.' },
  suppressor: { id: 'suppressor', name: 'Suppressor', slot: 'muzzle', noise: -0.62, damage: -0.07, description: 'Quieter shots, slightly less stopping power.' },
  compensator: { id: 'compensator', name: 'Compensator', slot: 'muzzle', recoil: -0.32, description: 'Reduces vertical recoil.' },
  extendedMag: { id: 'extendedMag', name: 'Extended Magazine', slot: 'mag', mag: 1.5, reload: 0.15, description: 'More rounds, slower reloads.' },
  foregrip: { id: 'foregrip', name: 'Foregrip', slot: 'grip', recoil: -0.18, spread: -0.12, description: 'Stabilises automatic fire.' },
  flashlight: { id: 'flashlight', name: 'Weapon Light', slot: 'light', light: true, description: 'Weapon-mounted illumination.' },
  reinforced: { id: 'reinforced', name: 'Reinforced Receiver', slot: 'internal', durability: 1.8, description: 'Doubles weapon lifespan.' },
};

export const ATTACHMENT_SLOTS = ['sight', 'muzzle', 'mag', 'grip', 'light', 'internal'];

export function weaponStatWithAttachments(weaponId, attachments = []) {
  const base = WEAPONS[weaponId];
  if (!base) return null;
  const s = { ...base, attachments: [...attachments], magSize: base.mag };
  for (const a of attachments) {
    const att = ATTACHMENTS[a.id || a];
    if (!att) continue;
    if (att.spread) s.spread *= 1 + att.spread;
    if (att.recoil) s.recoil *= 1 + att.recoil;
    if (att.noise) s.noise *= 1 + att.noise;
    if (att.damage) s.damage *= 1 + att.damage;
    if (att.mag) s.magSize = Math.round(base.mag * att.mag);
    if (att.adsFov) s.adsFov = Math.max(20, base.adsFov + att.adsFov);
    if (att.durability) s.durability = base.durability * att.durability;
  }
  return s;
}
