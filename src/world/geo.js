// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/geo.js — geometry primitives + static geometry builder
// with world-scaled UVs (consistent texel density everywhere),
// merged draw calls and collider extraction.
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M, mat } from '../core/materials.js';

export const TEX_SCALE = 2.0; // metres per texture tile

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// ---- primitives -----------------------------------------------------------
export function boxGeo(w, h, d, scale = TEX_SCALE, offsetU = 0) {
  const g = new THREE.BoxGeometry(Math.max(0.001, w), Math.max(0.001, h), Math.max(0.001, d));
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = dims[f];
    for (let i = f * 4; i < f * 4 + 4; i++) {
      uv.setXY(i, uv.getX(i) * su / scale + offsetU, uv.getY(i) * sv / scale);
    }
  }
  g.attributes.uv.needsUpdate = true;
  return g;
}

export function planeGeo(w, d, scale = TEX_SCALE, uOff = 0, vOff = 0) {
  const g = new THREE.PlaneGeometry(w, d, 1, 1);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / scale + uOff, uv.getY(i) * d / scale + vOff);
  g.rotateX(-Math.PI / 2);
  return g;
}

export function cylGeo(rTop, rBot, h, seg = 10, scale = TEX_SCALE, open = false) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open);
  const uv = g.attributes.uv;
  const circ = Math.PI * (rTop + rBot) / 2 * 2;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ / scale, uv.getY(i) * h / scale);
  g.attributes.uv.needsUpdate = true;
  return g;
}

export function sphereGeo(r, seg = 12, scale = TEX_SCALE) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1));
  const uv = g.attributes.uv;
  const circ = 2 * Math.PI * r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ / scale, uv.getY(i) * circ / scale);
  g.attributes.uv.needsUpdate = true;
  return g;
}

export function coneGeo(r, h, seg = 8, scale = TEX_SCALE) { return cylGeo(0.001, r, h, seg, scale); }

// ---- Static geometry builder ---------------------------------------------
export class Builder {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.buckets = new Map(); // materialKey -> {mat, geoms:[]}
    this.colliders = [];
    this.group = new THREE.Group();
    this.group.name = opts.name || 'static';
    this.staticOnly = opts.staticOnly || false;
    this.castShadow = opts.castShadow !== false;
    this.receiveShadow = opts.receiveShadow !== false;
    this.triCount = 0;
    if (scene) scene.add(this.group);
  }

  _bucket(material) {
    const key = material.uuid;
    let b = this.buckets.get(key);
    if (!b) { b = { mat: material, geoms: [] }; this.buckets.set(key, b); }
    return b;
  }

  /**
   * Add a geometry with a transform.
   * rot: [x,y,z] radians. scale: number or {x,y,z}
   */
  add(geo, material, x = 0, y = 0, z = 0, rot = [0, 0, 0], scale = 1) {
    if (!geo || !material) return null;
    if (Array.isArray(geo)) { for (const g of geo) this.add(g, material, x, y, z, rot, scale); return null; }
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    // ensure consistent attributes for merging
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
    _p.set(x, y, z);
    _e.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    _q.setFromEuler(_e);
    if (typeof scale === 'number') _s.set(scale, scale, scale);
    else _s.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
    _m.compose(_p, _q, _s);
    g.applyMatrix4(_m);
    this._bucket(material).geoms.push(g);
    this.triCount += g.attributes.position.count / 3;
    return g;
  }

  /** Axis-aligned box (no rotation) with automatic collider. */
  box(x, y, z, w, h, d, material, opts = {}) {
    this.add(boxGeo(w, h, d, opts.texScale || TEX_SCALE, opts.uOff || 0), material, x, y, z, opts.rot || [0, 0, 0]);
    if (opts.collide !== false) this.collideBox(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, opts.tag || 'wall');
    return this;
  }

  addCollider(minX, minY, minZ, maxX, maxY, maxZ, tag = 'wall') {
    this.colliders.push({
      minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX),
      minY: Math.min(minY, maxY), maxY: Math.max(minY, maxY),
      minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ), tag,
    });
  }

  collideBox(minX, minY, minZ, maxX, maxY, maxZ, tag) { this.addCollider(minX, minY, minZ, maxX, maxY, maxZ, tag); }

  // ---- architectural helpers ---------------------------------------------
  /**
   * Wall spanning X at fixed Z. holes: [{x0,x1,y0,y1}] in local wall coords.
   */
  wallX(x0, x1, z, y0, y1, thickness = 0.25, material = M.concrete, holes = [], opts = {}) {
    const segs = this._splitByHoles(x0, x1, y0, y1, holes);
    for (const s of segs) {
      const w = s.x1 - s.x0, h = s.y1 - s.y0;
      if (w <= 0.001 || h <= 0.001) continue;
      this.add(boxGeo(w, h, thickness, opts.texScale || TEX_SCALE), material, (s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, z);
      if (opts.collide !== false) this.collideBox(s.x0, s.y0, z - thickness / 2, s.x1, s.y1, z + thickness / 2, 'wall');
    }
    return this;
  }

  wallZ(z0, z1, x, y0, y1, thickness = 0.25, material = M.concrete, holes = [], opts = {}) {
    const segs = this._splitByHoles(z0, z1, y0, y1, holes);
    for (const s of segs) {
      const w = s.x1 - s.x0, h = s.y1 - s.y0;
      if (w <= 0.001 || h <= 0.001) continue;
      this.add(boxGeo(thickness, h, w, opts.texScale || TEX_SCALE), material, x, (s.y0 + s.y1) / 2, (s.x0 + s.x1) / 2);
      if (opts.collide !== false) this.collideBox(x - thickness / 2, s.y0, s.x0, x + thickness / 2, s.y1, s.x1, 'wall');
    }
    return this;
  }

  _splitByHoles(a0, a1, y0, y1, holes) {
    const out = [];
    const sorted = holes.filter((h) => h.x1 > a0 && h.x0 < a1 && h.y1 > y0 && h.y0 < y1)
      .map((h) => ({ x0: Math.max(a0, h.x0), x1: Math.min(a1, h.x1), y0: Math.max(y0, h.y0), y1: Math.min(y1, h.y1) }))
      .sort((p, q) => p.x0 - q.x0);
    let cur = a0;
    for (const h of sorted) {
      if (h.x0 > cur) out.push({ x0: cur, x1: h.x0, y0, y1 });
      // below opening
      if (h.y0 > y0) out.push({ x0: h.x0, x1: h.x1, y0, y1: h.y0 });
      if (h.y1 < y1) out.push({ x0: h.x0, x1: h.x1, y0: h.y1, y1 });
      cur = Math.max(cur, h.x1);
    }
    if (cur < a1) out.push({ x0: cur, x1: a1, y0, y1 });
    return out;
  }

  slab(x0, z0, x1, z1, y, material = M.floor, thick = 0.2, opts = {}) {
    const w = x1 - x0, d = z1 - z0;
    this.add(boxGeo(w, thick, d, opts.texScale || TEX_SCALE), material, (x0 + x1) / 2, y - thick / 2, (z0 + z1) / 2);
    if (opts.collide !== false) this.collideBox(x0, y - thick, z0, x1, y, z1, 'floor');
    return this;
  }

  ceiling(x0, z0, x1, z1, y, material = M.concrete, thick = 0.25) {
    const w = x1 - x0, d = z1 - z0;
    this.add(boxGeo(w, thick, d), material, (x0 + x1) / 2, y + thick / 2, (z0 + z1) / 2);
    this.collideBox(x0, y, z0, x1, y + thick, z1, 'ceiling');
    return this;
  }

  /** Simple straight staircase along +Z. Steps are solid boxes. */
  stairs(x, z0, z1, y0, y1, width = 1.6, material = M.floor) {
    const steps = Math.max(3, Math.round(Math.abs(y1 - y0) / 0.2));
    const dz = (z1 - z0) / steps, dy = (y1 - y0) / steps;
    for (let i = 0; i < steps; i++) {
      const y = y0 + dy * (i + 1);
      const zz = z0 + dz * (i + 0.5);
      const hh = y - y0;
      this.add(boxGeo(width, 0.22, Math.abs(dz) + 0.02), material, x, y - 0.11, zz);
      // riser fill to avoid seeing gaps
      this.add(boxGeo(width, Math.abs(dy), Math.abs(dz)), material, x, y - Math.abs(dy) / 2, zz);
    }
    return this;
  }

  railing(x0, z0, x1, z1, y, height = 1.05, material = M.steel, spacing = 1.4) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / spacing));
    const dx = (x1 - x0) / n, dz = (z1 - z0) / n;
    this.add(boxGeo(len, 0.06, 0.06), material, (x0 + x1) / 2, y + height, (z0 + z1) / 2,
      [0, Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, 0]);
    for (let i = 0; i <= n; i++) {
      this.add(boxGeo(0.05, height, 0.05), material, x0 + dx * i, y + height / 2, z0 + dz * i);
    }
    return this;
  }

  ladder(x, z, y0, y1, rotY = 0) {
    const h = y1 - y0;
    const g = new THREE.Group();
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    // two rails
    this.add(boxGeo(0.05, h, 0.05), M.steel, x - 0.25 * Math.cos(rotY), y0 + h / 2, z + 0.25 * Math.sin(rotY));
    this.add(boxGeo(0.05, h, 0.05), M.steel, x + 0.25 * Math.cos(rotY), y0 + h / 2, z - 0.25 * Math.sin(rotY));
    for (let y = y0 + 0.3; y < y1; y += 0.35) {
      this.add(boxGeo(0.5, 0.04, 0.05), M.steel, x, y, z);
    }
    return this;
  }

  finalize() {
    let meshes = 0;
    for (const { mat: material, geoms } of this.buckets.values()) {
      if (!geoms.length) continue;
      const merged = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
      if (!merged) { console.warn('merge failed for', material.name); continue; }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = this.castShadow && !material.userData.noShadow;
      mesh.receiveShadow = this.receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      this.group.add(mesh);
      meshes++;
      for (const g of geoms) g.dispose();
    }
    this.buckets.clear();
    return { meshes, tris: this.triCount, colliders: this.colliders };
  }

  dispose() {
    this.group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

// ---- misc helpers --------------------------------------------------------
export function meshFrom(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function tintColor(hex, variance, rng) {
  const c = new THREE.Color(hex);
  const k = 1 + (rng ? (rng.next() - 0.5) * 2 : 0) * variance;
  c.r *= k; c.g *= k; c.b *= k;
  return c;
}

export const Materials = { M, mat };
