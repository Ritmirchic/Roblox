/** Friendly survivor NPC rigs. */
import * as THREE from 'three';
import { Humanoid } from '../entities/humanoid.js';
import { buildWeaponModel } from './weapons.js';

export const HUMAN_NPC_PALETTES = {
  trader: { skin: 0xa8825f, shirt: 0x3f4436, pants: 0x35322c, boots: 0x1e1c19, gear: 0x5a4a34, hair: 0x352a1e },
  guard: { skin: 0x9c7a58, shirt: 0x2f3a30, pants: 0x2a3028, boots: 0x1c1e1a, gear: 0x3a4236, hair: 0x241c14 },
  lore: { skin: 0xb08a68, shirt: 0x4a4038, pants: 0x3a3430, boots: 0x201d1a, gear: 0x4a4234, hair: 0x9a958c },
  medic: { skin: 0xa07c5c, shirt: 0x6a6a5e, pants: 0x33302c, boots: 0x1e1c18, gear: 0x55503f, hair: 0x2c241c },
};

export function buildNpcRig(role, name) {
  const palette = HUMAN_NPC_PALETTES[role] || HUMAN_NPC_PALETTES.trader;
  const rig = new Humanoid({ palette, scale: role === 'lore' ? 0.96 : 1.0, build: 1.0 });
  // role-specific kit
  if (role === 'guard') {
    const rifle = buildWeaponModel('assaultRifle');
    rig.attachWeapon(rifle, { x: 0, y: -0.05, z: -0.1 }, { x: Math.PI / 2, y: 0, z: 0 });
    rig.attachToBone('chest', new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a4234, roughness: 0.8 })), { x: 0, y: 0.04, z: 0.14 }, {});
  } else if (role === 'trader') {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.22), new THREE.MeshStandardMaterial({ color: 0x5a4a32, roughness: 0.95 }));
    pack.position.set(0, 0.06, -0.2);
    rig.chest.add(pack);
  } else if (role === 'lore') {
    // long coat skirt
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x40382c, roughness: 0.95 }));
    coat.position.set(0, 0.62, 0);
    rig.bones.hips.add(coat);
    // walking stick
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 1.1, 5), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9 }));
    stick.position.set(0.24, -0.55, 0.1);
    rig.bones.handL.add(stick);
  } else if (role === 'medic') {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x8a8a7a, roughness: 0.9 }));
    bag.position.set(0.2, -0.1, 0.12);
    rig.bones.hips.add(bag);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: 0xc03a3a }));
    cross.position.set(0, 0.03, 0.055);
    bag.add(cross);
  }
  rig.root.userData.npcName = name;
  return rig;
}
