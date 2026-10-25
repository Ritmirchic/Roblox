/**
 * Enemy spacecraft models - five distinct silhouettes built from merged primitives,
 * each with its own proportions, armour layout, engine glow and weapon hardpoints.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hullMaterial, emissiveMaterial } from './modules3d.ts';
import type { EnemyDef } from '../data/sectors.ts';
import { RNG } from '../core/rng.ts';

export interface EnemyBuild {
  group: THREE.Group;
  muzzles: THREE.Object3D[];
  engines: THREE.Object3D[];
}

const cache = new Map<string, THREE.Group>();

export function buildEnemy(def: EnemyDef): EnemyBuild {
  let proto = cache.get(def.type);
  if (!proto) {
    proto = createEnemy(def);
    cache.set(def.type, proto);
  }
  const group = proto.clone(true);
  const muzzles: THREE.Object3D[] = [];
  const engines: THREE.Object3D[] = [];
  group.traverse((o) => {
    if (o.name === 'muzzle') muzzles.push(o);
    if (o.name === 'engine') engines.push(o);
  });
  return { group, muzzles, engines };
}

function marker(name: string, x: number, y: number, z: number): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  return o;
}

function createEnemy(def: EnemyDef): THREE.Group {
  const g = new THREE.Group();
  const s = def.scale * 3.2;
  const rng = new RNG(def.name.length * 7919 + def.hull);
  const mat = hullMaterial(def.color, def.accent, def.hull | 0, 0.4);
  const glow = emissiveMaterial(def.accent, 2.8);
  const dark = new THREE.MeshStandardMaterial({ color: 0x15181f, metalness: 0.9, roughness: 0.4 });
  const parts: THREE.BufferGeometry[] = [];

  switch (def.type) {
    case 'scout': {
      // Fast dart: tapered body, swept wings, single engine.
      const body = new THREE.ConeGeometry(s * 0.35, s * 1.6, 7);
      body.rotateX(Math.PI / 2);
      parts.push(body);
      for (const side of [-1, 1]) {
        const wing = new THREE.BoxGeometry(s * 0.7, s * 0.07, s * 0.44);
        wing.translate(side * s * 0.45, 0, -s * 0.2);
        wing.rotateY(side * 0.22);
        parts.push(wing);
        const tipPod = new THREE.CylinderGeometry(s * 0.07, s * 0.07, s * 0.4, 8);
        tipPod.rotateX(Math.PI / 2);
        tipPod.translate(side * s * 0.78, 0, -s * 0.1);
        parts.push(tipPod);
        g.add(marker('muzzle', side * s * 0.78, 0, s * 0.12));
      }
      const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.14, 12, 10), glow);
      eye.position.set(0, s * 0.1, s * 0.55);
      g.add(eye);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.17, s * 0.22, s * 0.25, 12, 1, true), glow);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.z = -s * 0.78;
      g.add(nozzle);
      g.add(marker('engine', 0, 0, -s * 0.9));
      break;
    }
    case 'raider': {
      // Aggressive hammerhead with side pods.
      const hull = new THREE.BoxGeometry(s * 0.6, s * 0.4, s * 1.5);
      parts.push(hull);
      const head = new THREE.BoxGeometry(s * 1.25, s * 0.3, s * 0.42);
      head.translate(0, 0, s * 0.72);
      parts.push(head);
      for (const side of [-1, 1]) {
        const pod = new THREE.CylinderGeometry(s * 0.17, s * 0.2, s * 1.1, 10);
        pod.rotateX(Math.PI / 2);
        pod.translate(side * s * 0.52, -s * 0.1, -s * 0.15);
        parts.push(pod);
        g.add(marker('muzzle', side * s * 0.58, 0, s * 0.85));
        const noz = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.14, s * 0.18, s * 0.22, 10, 1, true), glow);
        noz.rotation.x = Math.PI / 2;
        noz.position.set(side * s * 0.52, -s * 0.1, -s * 0.74);
        g.add(noz);
        g.add(marker('engine', side * s * 0.52, -s * 0.1, -s * 0.85));
      }
      const fin = new THREE.BoxGeometry(s * 0.06, s * 0.6, s * 0.5);
      fin.translate(0, s * 0.42, -s * 0.5);
      parts.push(fin);
      const sensor = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 0.08, s * 0.08), glow);
      sensor.position.set(0, s * 0.06, s * 0.9);
      g.add(sensor);
      break;
    }
    case 'heavy': {
      // Slab-sided gun platform with layered armour.
      const core = new THREE.BoxGeometry(s * 0.9, s * 0.75, s * 1.3);
      parts.push(core);
      for (let i = 0; i < 5; i++) {
        const plate = new THREE.BoxGeometry(s * (1.05 - i * 0.07), s * 0.1, s * (0.32 + i * 0.05));
        plate.translate(0, s * (0.42 - i * 0.2), s * (0.3 - i * 0.18));
        parts.push(plate);
      }
      for (const side of [-1, 1]) {
        const arm = new THREE.BoxGeometry(s * 0.22, s * 0.3, s * 0.95);
        arm.translate(side * s * 0.62, 0, s * 0.1);
        parts.push(arm);
        const barrel = new THREE.CylinderGeometry(s * 0.09, s * 0.09, s * 0.75, 10);
        barrel.rotateX(Math.PI / 2);
        barrel.translate(side * s * 0.62, 0, s * 0.7);
        parts.push(barrel);
        g.add(marker('muzzle', side * s * 0.62, 0, s * 1.05));
      }
      for (const side of [-1, 1]) {
        const noz = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.2, s * 0.26, s * 0.3, 12, 1, true), glow);
        noz.rotation.x = Math.PI / 2;
        noz.position.set(side * s * 0.34, 0, -s * 0.78);
        g.add(noz);
        g.add(marker('engine', side * s * 0.34, 0, -s * 0.95));
      }
      break;
    }
    case 'plasma': {
      // Organic-ish hunter with a glowing plasma spine.
      const body = new THREE.SphereGeometry(s * 0.46, 16, 12);
      body.scale(1, 0.7, 1.7);
      parts.push(body);
      for (const side of [-1, 1]) {
        const blade = new THREE.ConeGeometry(s * 0.2, s * 1.25, 4);
        blade.rotateZ(side * Math.PI / 2.2);
        blade.rotateX(-Math.PI / 2.4);
        blade.translate(side * s * 0.6, s * 0.1, -s * 0.15);
        parts.push(blade);
        g.add(marker('muzzle', side * s * 0.42, 0, s * 0.72));
      }
      const spine = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.09, s * 0.9, 6, 12), glow);
      spine.rotation.x = Math.PI / 2;
      spine.position.set(0, s * 0.26, -s * 0.05);
      g.add(spine);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.17, 14, 12), glow);
      eye.position.set(0, 0, s * 0.72);
      g.add(eye);
      const noz = new THREE.Mesh(new THREE.TorusGeometry(s * 0.24, s * 0.07, 8, 18), glow);
      noz.position.z = -s * 0.82;
      g.add(noz);
      g.add(marker('engine', 0, 0, -s * 0.95));
      break;
    }
    default: {
      // Void Sentinel: monolithic ring guardian.
      const core = new THREE.OctahedronGeometry(s * 0.5, 1);
      core.scale(1, 1.25, 1);
      parts.push(core);
      const ring = new THREE.TorusGeometry(s * 0.95, s * 0.1, 10, 28);
      ring.rotateX(Math.PI / 2);
      parts.push(ring);
      const ring2 = new THREE.TorusGeometry(s * 0.72, s * 0.07, 8, 24);
      ring2.rotateY(Math.PI / 2);
      parts.push(ring2);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const pylon = new THREE.BoxGeometry(s * 0.12, s * 0.12, s * 0.8);
        pylon.translate(Math.cos(a) * s * 0.62, 0, Math.sin(a) * s * 0.62);
        pylon.rotateY(-a);
        parts.push(pylon);
        g.add(marker('muzzle', Math.cos(a) * s * 0.95, 0, Math.sin(a) * s * 0.95));
      }
      const core2 = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.28, 1), glow);
      g.add(core2);
      for (const side of [-1, 1]) g.add(marker('engine', side * s * 0.3, -s * 0.3, -s * 0.6));
      break;
    }
  }

  // Random hull greebles for silhouette interest.
  for (let i = 0; i < 8; i++) {
    const b = new THREE.BoxGeometry(s * rng.range(0.05, 0.16), s * rng.range(0.04, 0.1), s * rng.range(0.08, 0.26));
    b.translate(rng.range(-s * 0.4, s * 0.4), rng.range(-s * 0.25, s * 0.3), rng.range(-s * 0.6, s * 0.5));
    parts.push(b);
  }

  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  if (merged) {
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  // Running lights.
  for (let i = 0; i < 3; i++) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 8, 6), glow);
    led.position.set(rng.range(-s * 0.5, s * 0.5), rng.range(-s * 0.2, s * 0.3), rng.range(-s * 0.5, s * 0.5));
    g.add(led);
  }
  const unused = dark;
  void unused;
  return g;
}
