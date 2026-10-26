// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/doors.js — instanced, physically blocking, openable doors
// ============================================================
import * as THREE from 'three';
import { boxGeo, cylGeo } from '../world/geo.js';
import { M } from '../core/materials.js';
import { clamp } from '../core/util.js';

const CELL = 12;

export class Doors {
  constructor(game) {
    this.game = game;
    this.doors = [];
    this.grid = new Map();
    this.index = new Map();
    this.dirty = true;
    this.build();
  }

  build() {
    const specs = this.game.world.doorSpecs || [];
    if (!specs.length) return;
    const byKind = { wood: [], metal: [] };
    for (const s of specs) (byKind[s.kind === 'metal' ? 'metal' : 'wood']).push(s);

    // door leaf geometry: origin at the hinge, extends +X, hinge at mid-height
    const leaf = boxGeo(1, 2.1, 0.06, 1.0);
    leaf.translate(0.5, 0, 0);
    const knob = sphereHandle();
    const geoWood = mergeLeaf(leaf, knob, 0.86, 0.0);
    const geoMetal = mergeLeaf(leaf, knob, 0.88, 0.0);

    this.meshes = {};
    for (const kind of ['wood', 'metal']) {
      const list = byKind[kind];
      if (!list.length) continue;
      const geo = kind === 'wood' ? geoWood : geoMetal;
      const mat = kind === 'wood' ? M.woodWeathered : M.metalPaint;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.name = 'doors_' + kind;
      this.game.scene.add(mesh);
      this.meshes[kind] = mesh;
      list.forEach((spec, i) => this.addDoor(spec, mesh, kind, i));
    }
    this.updateMatrices(true);
  }

  addDoor(spec, mesh, kind, instanceIndex) {
    const w = Math.max(0.7, spec.w || 1);
    const angle = spec.startOpen || 0;
    const d = {
      spec, kind, mesh, w, angle, target: angle,
      x: spec.x, y: spec.y + spec.h / 2, z: spec.z, ry: spec.ry, swing: spec.swing || 1,
      collider: null, instance: instanceIndex, moving: false,
    };
    d.baseAngle = spec.ry + angle * d.swing;
    if (angle < 0.35) this.addCollider(d);
    this.doors.push(d);
    const cx = Math.floor(spec.x / CELL), cz = Math.floor(spec.z / CELL);
    const key = cx + ',' + cz;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(d);
  }

  addCollider(d) {
    if (d.collider) return;
    // AABB of the closed leaf (rotated around Y by d.ry)
    const hw = d.w / 2;
    const cos = Math.cos(d.ry), sin = Math.sin(d.ry);
    const ex = Math.abs(cos) * hw + Math.abs(sin) * 0.1;
    const ez = Math.abs(sin) * hw + Math.abs(cos) * 0.1;
    d.collider = this.game.world.colliders.addBox(
      d.x - ex, d.y - 1.05, d.z - ez,
      d.x + ex, d.y + 1.05, d.z + ez, 'door');
  }

  removeCollider(d) {
    if (!d.collider) return;
    const grid = this.game.world.colliders;
    const c = d.collider;
    for (const arr of grid.map.values()) {
      const i = arr.indexOf(c);
      if (i >= 0) arr.splice(i, 1);
    }
    grid.count = Math.max(0, grid.count - 1);
    d.collider = null;
  }

  nearest(pos, radius = 2.4) {
    let best = null, bestD = radius;
    const cx = Math.floor(pos.x / CELL), cz = Math.floor(pos.z / CELL);
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let z = cz - 1; z <= cz + 1; z++) {
        const arr = this.grid.get(x + ',' + z);
        if (!arr) continue;
        for (const d of arr) {
          const dist = Math.hypot(d.x - pos.x, d.z - pos.z);
          const dy = Math.abs(d.y - (pos.y + 1.1));
          if (dist < bestD && dy < 2.4) { best = d; bestD = dist; }
        }
      }
    }
    return best;
  }

  toggle(d) {
    d.target = d.target > 0.5 ? 0 : Math.PI * 0.62;
    d.moving = true;
    if (d.target > 0.5) this.removeCollider(d);
    else this.addCollider(d);
    this.game.audio.door && this.game.audio.door(d.target > 0.5);
    this.game.audio.playNoise({ freq: 320, q: 1.2, dur: 0.35, volume: 0.10, pos: new THREE.Vector3(d.x, d.y, d.z), maxDist: 18 });
  }

  update(dt) {
    let any = false;
    for (const d of this.doors) {
      if (Math.abs(d.angle - d.target) < 0.001) { d.moving = false; continue; }
      const prev = d.angle;
      const speed = 3.4;
      d.angle += clamp(d.target - d.angle, -speed * dt, speed * dt);
      if (Math.abs(d.angle - prev) > 1e-5) any = true;
      this.updateInstance(d);
    }
    if (any) for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true;
  }

  updateInstance(d) {
    const mesh = d.mesh;
    if (!mesh) return;
    const angle = d.ry + d.angle * d.swing;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // hinge sits at one edge of the opening
    const hingeX = d.x - (d.w / 2) * Math.cos(d.ry);
    const hingeZ = d.z + (d.w / 2) * Math.sin(d.ry);
    _m.makeRotationY(angle);
    _m.scale(_v.set(d.w, 1, 1));
    _m.setPosition(hingeX, d.y, hingeZ);
    mesh.setMatrixAt(d.instance, _m);
  }

  updateMatrices(all = false) {
    for (const d of this.doors) this.updateInstance(d);
    for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true;
  }

  serialize() {
    return this.doors.map((d) => Math.round(d.angle * 100) / 100);
  }

  deserialize(list) {
    if (!list) return;
    list.forEach((angle, i) => {
      const d = this.doors[i];
      if (!d) return;
      d.angle = d.target = angle;
      if (angle > 0.5) this.removeCollider(d); else this.addCollider(d);
      this.updateInstance(d);
    });
    for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true;
  }
}

const _m = new THREE.Matrix4();
const _v = new THREE.Vector3();

function sphereHandle() {
  const g = cylGeo(0.028, 0.028, 0.10, 6, 1.0);
  g.rotateZ(Math.PI / 2);
  g.translate(0.82, 0, 0.06);
  return g;
}

function mergeLeaf(leaf, knob, knobX, knobY) {
  // The knob geometry is already positioned; just concatenate.
  const geos = [leaf, knob];
  let vc = 0, ic = 0;
  for (const g of geos) { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3), uv = new Float32Array(vc * 2);
  const idx = new Uint32Array(ic);
  let vo = 0, io = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array.subarray(0, p.count * 3), vo * 3);
    if (n) nrm.set(n.array.subarray(0, n.count * 3), vo * 3);
    if (u) uv.set(u.array.subarray(0, u.count * 2), vo * 2);
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo; }
    else for (let i = 0; i < p.count; i++) idx[io++] = i + vo;
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}
