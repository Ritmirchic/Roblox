/**
 * Parametric mesh builder.
 * Composes architecture and props out of primitive parts and merges them into
 * one draw call per material. UVs are projected from world space so tiled PBR
 * textures keep a constant texel density and never seam between parts.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from './util.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _n = new THREE.Vector3();

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);

/** Rewrites box UVs from world-space position along each face's tangent plane. */
function worldUvBox(geo, matrix, texScale, offset = 0) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    n.fromBufferAttribute(nor, i).transformDirection(matrix);
    let u;
    let v;
    if (Math.abs(n.x) > 0.5) {
      u = p.z;
      v = p.y;
    } else if (Math.abs(n.y) > 0.5) {
      u = p.x;
      v = p.z;
    } else {
      u = p.x;
      v = p.y;
    }
    uv.setXY(i, u / texScale + offset, v / texScale + offset);
  }
  uv.needsUpdate = true;
}

/** Rewrites plane UVs from world space (matches PlaneGeometry orientation). */
function worldUvPlane(geo, matrix, texScale, axis = 'y') {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    if (axis === 'y') uv.setXY(i, p.x / texScale, p.z / texScale);
    else if (axis === 'x') uv.setXY(i, p.z / texScale, p.y / texScale);
    else uv.setXY(i, p.x / texScale, p.y / texScale);
  }
  uv.needsUpdate = true;
}

function ensureColor(geo, r, g, b) {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = r;
    arr[i * 3 + 1] = g;
    arr[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/**
 * Deterministic grime: darkens vertices near the ground and adds tint variation.
 * Gives merged boxes readable wear without extra geometry.
 */
function applyGrime(geo, matrix, grime = null) {
  if (!grime) return;
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    const heightFade = THREE.MathUtils.clamp((p.y + 0.2) / 2.4, 0, 1);
    const dark = 1 - (1 - heightFade) * (grime.ground ?? 0);
    const per = grime.variation ?? 0;
    const n = 1 + (Math.sin(p.x * 12.9898 + p.z * 78.233 + p.y * 3.7) * 43758.5453 % 1) * per;
    col.setXYZ(
      i,
      col.getX(i) * dark * n,
      col.getY(i) * dark * n,
      col.getZ(i) * dark * n,
    );
  }
  col.needsUpdate = true;
}

export class MeshBuilder {
  /** @param {import('./textures.js').TextureLib} textures */
  constructor(textures, colliders, { seed = 1 } = {}) {
    this.textures = textures;
    this.buckets = new Map(); // matKey -> { geos: [], mat: material }
    this.colliders = colliders;
    this.rng = makeRng(seed);
    this.group = new THREE.Group();
    this.group.name = 'static';
  }

  _bucket(matKey, mat) {
    let b = this.buckets.get(matKey);
    if (!b) {
      b = { geos: [], mat };
      this.buckets.set(matKey, b);
    }
    return b;
  }

  materialFor(name, opts) {
    return this.textures.material(name, opts);
  }

  /** Box by center. opts: rotY, tex (meters per tile), tint [r,g,b], grime. */
  box(cx, cy, cz, w, h, d, mat, opts = {}) {
    const matKey = typeof mat === 'string' ? mat + JSON.stringify(opts.mat ?? {}) : mat.key;
    const material = typeof mat === 'string' ? this.materialFor(mat, opts.mat) : mat;
    const geo = UNIT_BOX.clone();
    if (opts.rotX || opts.rotZ) _q.setFromEuler(new THREE.Euler(opts.rotX || 0, opts.rotY || 0, opts.rotZ || 0, 'YXZ'));
    else _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), opts.rotY || 0);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(w, h, d));
    geo.applyMatrix4(_m);
    // recompute normals for non-uniform scale safety
    if (Math.abs(w - h) > 1e-6 || Math.abs(h - d) > 1e-6) geo.computeVertexNormals();
    worldUvBox(geo, new THREE.Matrix4(), opts.tex ?? 2.0, opts.uvOffset || 0);
    const t = opts.tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    const m2 = new THREE.Matrix4();
    applyGrime(geo, m2, opts.grime);
    if (opts.noBottom) geo.groups = [];
    this._bucket(matKey, material).geos.push(geo);
    if (opts.collide !== false) this.colliders.addBox(cx, cy, cz, w, h, d, opts.rotY || 0, opts.collideTag);
    return this;
  }

  /** Box by min/max corners. */
  boxMM(x0, y0, z0, x1, y1, z1, mat, opts = {}) {
    return this.box(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      (z0 + z1) / 2,
      Math.abs(x1 - x0),
      Math.abs(y1 - y0),
      Math.abs(z1 - z0),
      mat,
      opts,
    );
  }

  /** Horizontal or vertical plane. axis = 'y' | 'x' | 'z'. */
  plane(cx, cy, cz, w, h, mat, { axis = 'y', rotY = 0, tex = 2.0, tint, grime, collide = false, doubleSide = false } = {}) {
    const matKey = (typeof mat === 'string' ? mat : mat.key) + (doubleSide ? ':ds' : '');
    const material = typeof mat === 'string' ? this.materialFor(mat, { side: doubleSide ? THREE.DoubleSide : THREE.FrontSide }) : mat;
    const geo = UNIT_PLANE.clone();
    if (axis === 'y') geo.rotateX(-Math.PI / 2);
    else if (axis === 'x') geo.rotateY(Math.PI / 2);
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(w, h, 1));
    geo.applyMatrix4(_m);
    worldUvPlane(geo, new THREE.Matrix4(), tex, axis === 'x' ? 'x' : axis === 'z' ? 'z' : 'y');
    const t = tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    applyGrime(geo, new THREE.Matrix4(), grime);
    this._bucket(matKey, material).geos.push(geo);
    if (collide) this.colliders.addBox(cx, cy, cz, axis === 'x' ? 0.1 : w, axis === 'y' ? 0.1 : h, axis === 'z' ? 0.1 : w, rotY);
    return this;
  }

  cylinder(cx, cy, cz, rTop, rBot, h, mat, { seg = 10, rotY = 0, tex = 1.5, tint, openEnded = false, collide = true, collideTag } = {}) {
    const matKey = (typeof mat === 'string' ? mat : mat.key) + ':cyl' + seg;
    const material = typeof mat === 'string' ? this.materialFor(mat) : mat;
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, openEnded);
    // cylindrical UVs with world scale
    const uv = geo.attributes.uv;
    const circ = Math.PI * (rTop + rBot);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (circ / tex), (uv.getY(i) * h) / tex);
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(1, 1, 1));
    geo.applyMatrix4(_m);
    const t = tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    this._bucket(matKey, material).geos.push(geo);
    if (collide) this.colliders.addCylinder(cx, cy, cz, Math.max(rTop, rBot), h, collideTag);
    return this;
  }

  /** Pipes between two points (good for industrial clutter). */
  pipe(a, b, r, mat, opts = {}) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-4) return this;
    const matKey = (typeof mat === 'string' ? mat : mat.key) + ':pipe';
    const material = typeof mat === 'string' ? this.materialFor(mat) : mat;
    const geo = new THREE.CylinderGeometry(r, r, len, opts.seg ?? 8, 1, false);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    _m.compose(mid, q, _s.set(1, 1, 1));
    geo.applyMatrix4(_m);
    const t = opts.tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    this._bucket(matKey, material).geos.push(geo);
    return this;
  }

  /** Low-poly deformed sphere for rocks, debris mounds, organic blobs. */
  blob(cx, cy, cz, rx, ry, rz, mat, { detail = 1, rand = 0.25, tint, tex = 2.0, collide = true, seed = 7, rotY = 0 } = {}) {
    const matKey = (typeof mat === 'string' ? mat : mat.key) + ':blob';
    const material = typeof mat === 'string' ? this.materialFor(mat) : mat;
    const geo = new THREE.IcosahedronGeometry(1, detail);
    const rng = makeRng(seed);
    const pos = geo.attributes.position;
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const f = 1 + (rng() - 0.5) * rand;
      p.multiplyScalar(f);
      // squash vertically for grounded look
      pos.setXYZ(i, p.x, p.y * 0.85, p.z);
    }
    geo.computeVertexNormals();
    // triplanar-ish uv by dominant normal
    const nor = geo.attributes.normal;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const n = _n.fromBufferAttribute(nor, i);
      let u;
      let v;
      if (Math.abs(n.y) > 0.6) {
        u = p.x;
        v = p.z;
      } else if (Math.abs(n.x) > Math.abs(n.z)) {
        u = p.z;
        v = p.y;
      } else {
        u = p.x;
        v = p.y;
      }
      uv[i * 2] = (u * rx) / tex;
      uv[i * 2 + 1] = (v * ry) / tex;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(rx, ry, rz));
    geo.applyMatrix4(_m);
    const t = tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    this._bucket(matKey, material).geos.push(geo);
    if (collide) this.colliders.addBox(cx, cy, cz, rx * 1.6, ry * 1.7, rz * 1.6, 0, 'rock');
    return this;
  }

  /** Push an arbitrary pre-built geometry (local space) with a transform. */
  raw(geo, matrix, mat, { tex = 2.0, tint, collide = false, axis = 'auto' } = {}) {
    let matKey;
    let material;
    if (mat && mat.isTexture) {
      // Decal/sign surface: lit but unlit-friendly painted board.
      matKey = `tex:${mat.uuid}:raw`;
      if (!this._texMaterials) this._texMaterials = new Map();
      material = this._texMaterials.get(mat);
      if (!material) {
        material = new THREE.MeshStandardMaterial({ map: mat, roughness: 0.85, metalness: 0.05, transparent: false });
        this._texMaterials.set(mat, material);
      }
    } else if (mat && mat.isMaterial) {
      matKey = `mat:${mat.uuid}:raw`;
      material = mat;
    } else {
      matKey = (typeof mat === 'string' ? mat : (mat?.key ?? 'concrete')) + ':raw';
      material = typeof mat === 'string' ? this.materialFor(mat) : (mat || this.materialFor('concrete'));
    }
    const g = geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(matrix);
    if (axis === 'auto') worldUvBox(g, new THREE.Matrix4(), tex);
    const t = tint || [1, 1, 1];
    ensureColor(g, t[0], t[1], t[2]);
    this._bucket(matKey, material).geos.push(g);
    return this;
  }

  /**
   * Arbitrary four-corner quad (world space, CCW). Used for road ribbons,
   * decals and painted markings that must follow terrain height.
   */
  quad(p0, p1, p2, p3, mat, { tex = 2.0, tint, collide = false, uvScale = null, additive = false } = {}) {
    const matKey = (typeof mat === 'string' ? mat : (mat.key || 'mat')) + ':quad';
    const material = typeof mat === 'string' ? this.materialFor(mat) : mat;
    const positions = new Float32Array([
      p0[0], p0[1], p0[2],
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
      p3[0], p3[1], p3[2],
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const n = new THREE.Vector3();
    const a = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    const b2 = new THREE.Vector3(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]);
    n.crossVectors(a, b2).normalize();
    if (n.y < 0) n.negate();
    const normals = new Float32Array(12);
    for (let i = 0; i < 4; i++) {
      normals[i * 3] = n.x;
      normals[i * 3 + 1] = n.y;
      normals[i * 3 + 2] = n.z;
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    const scale = uvScale ?? tex;
    const uv = new Float32Array(8);
    const pts = [p0, p1, p2, p3];
    for (let i = 0; i < 4; i++) {
      uv[i * 2] = pts[i][0] / scale;
      uv[i * 2 + 1] = pts[i][2] / scale;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const t = tint || [1, 1, 1];
    ensureColor(geo, t[0], t[1], t[2]);
    this._bucket(matKey, material).geos.push(geo);
    return this;
  }

  /** Emissive/self-lit geometry (lamp bulbs, screens, fire glows). */
  glow(cx, cy, cz, w, h, d, color = 0xffc070, { rotY = 0, collide = false, intensity = 1 } = {}) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
    const key = `glow:${color}:${intensity}`;
    const b = this._bucket(key, mat);
    const geo = UNIT_BOX.clone();
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(w, h, d));
    geo.applyMatrix4(_m);
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    ensureColor(geo, 1, 1, 1);
    b.geos.push(geo);
    return this;
  }

  billboardPlane(cx, cy, cz, w, h, texture, { rotY = 0, doubleSide = true } = {}) {
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: doubleSide ? THREE.DoubleSide : THREE.FrontSide, toneMapped: false });
    const key = `bb:${texture.uuid}`;
    const b = this._bucket(key, mat);
    const geo = UNIT_PLANE.clone();
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    _m.compose(_v.set(cx, cy, cz), _q, _s.set(w, h, 1));
    geo.applyMatrix4(_m);
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    ensureColor(geo, 1, 1, 1);
    b.geos.push(geo);
    return this;
  }

  /** Merge every bucket into a handful of meshes attached to the builder group. */
  build({ frustumCulled = true, castShadow = true, receiveShadow = true } = {}) {
    const meshes = [];
    for (const [key, bucket] of this.buckets) {
      if (!bucket.geos.length) continue;
      const merged = mergeGeometries(bucket.geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      const mesh = new THREE.Mesh(merged, bucket.mat);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.frustumCulled = frustumCulled;
      mesh.matrixAutoUpdate = false;
      mesh.name = `merged:${key}`;
      this.group.add(mesh);
      meshes.push(mesh);
      for (const g of bucket.geos) g.dispose();
    }
    this.buckets.clear();
    return { group: this.group, meshes };
  }

  /** Splits merged output into spatial chunks (better culling in the open world). */
  buildChunked(chunkSize = 64) {
    const chunks = new Map();
    for (const [key, bucket] of this.buckets) {
      for (const geo of bucket.geos) {
        geo.computeBoundingSphere();
        const c = geo.boundingSphere.center;
        const cx = Math.floor(c.x / chunkSize);
        const cz = Math.floor(c.z / chunkSize);
        const ck = `${cx}:${cz}`;
        if (!chunks.has(ck)) chunks.set(ck, new Map());
        const cm = chunks.get(ck);
        if (!cm.has(key)) cm.set(key, { geos: [], mat: bucket.mat });
        cm.get(key).geos.push(geo);
      }
    }
    this.buckets.clear();
    const meshes = [];
    for (const [ck, mats] of chunks) {
      for (const [key, bucket] of mats) {
        const merged = mergeGeometries(bucket.geos, false);
        if (!merged) continue;
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, bucket.mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        mesh.name = `chunk:${ck}:${key}`;
        this.group.add(mesh);
        meshes.push(mesh);
        for (const g of bucket.geos) g.dispose();
      }
    }
    return { group: this.group, meshes };
  }
}

// ---------------------------------------------------------------------------
// Architecture helpers built on top of MeshBuilder
// ---------------------------------------------------------------------------

/**
 * Wall with a rectangular opening (door / window). Wall extends along local X,
 * is centered at x0..x1 on the given z line, from y0 (floor) to y1 (ceiling).
 */
export function wallWithOpening(b, { x0, x1, z, y0, y1, thickness = 0.25, mat, open, tex = 2, tint, grime }) {
  const ox0 = open.x0 ?? open.x - open.w / 2;
  const ox1 = open.x1 ?? open.x + open.w / 2;
  const oy0 = open.y0 ?? y0;
  const oy1 = open.y1 ?? y1;
  if (ox0 > x0 + 0.001) b.boxMM(x0, y0, z - thickness / 2, ox0, y1, z + thickness / 2, mat, { tex, tint, grime });
  if (ox1 < x1 - 0.001) b.boxMM(ox1, y0, z - thickness / 2, x1, y1, z + thickness / 2, mat, { tex, tint, grime });
  if (oy0 > y0 + 0.001) b.boxMM(Math.max(ox0, x0), y0, z - thickness / 2, Math.min(ox1, x1), oy0, z + thickness / 2, mat, { tex, tint, grime });
  if (oy1 < y1 - 0.001) b.boxMM(Math.max(ox0, x0), oy1, z - thickness / 2, Math.min(ox1, x1), y1, z + thickness / 2, mat, { tex, tint, grime });
}

/** Wall along Z axis with an opening. */
export function wallWithOpeningZ(b, { z0, z1, x, y0, y1, thickness = 0.25, mat, open, tex = 2, tint, grime }) {
  const oz0 = open.z0 ?? open.z - open.w / 2;
  const oz1 = open.z1 ?? open.z + open.w / 2;
  const oy0 = open.y0 ?? y0;
  const oy1 = open.y1 ?? y1;
  if (oz0 > z0 + 0.001) b.boxMM(x - thickness / 2, y0, z0, x + thickness / 2, y1, oz0, mat, { tex, tint, grime });
  if (oz1 < z1 - 0.001) b.boxMM(x - thickness / 2, y0, oz1, x + thickness / 2, y1, z1, mat, { tex, tint, grime });
  if (oy0 > y0 + 0.001) b.boxMM(x - thickness / 2, y0, Math.max(oz0, z0), x + thickness / 2, oy0, Math.min(oz1, z1), mat, { tex, tint, grime });
  if (oy1 < y1 - 0.001) b.boxMM(x - thickness / 2, oy1, Math.max(oz0, z0), x + thickness / 2, y1, Math.min(oz1, z1), mat, { tex, tint, grime });
}

/** Four walls of a rectangular room with door openings. */
export function roomShell(b, { x, z, w, d, y0, h, mat, thickness = 0.25, doors = [], windows = [], tex = 2, tint, grime }) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const y1 = y0 + h;
  const sides = { north: [], south: [], east: [], west: [] };
  for (const door of doors) sides[door.side].push({ ...door, y0: y0, y1: Math.min(y1, y0 + (door.h ?? 2.2)) });
  const build = (side, spans, fixed) => {
    if (!spans.length) return [{ x0: fixed.a, x1: fixed.b, y0, y1 }];
    const list = spans;
    let cursor = fixed.a;
    const out = [];
    for (const o of list.slice().sort((p, q) => p.x - q.x)) {
      const ox0 = o.x - o.w / 2;
      const ox1 = o.x + o.w / 2;
      if (ox0 > cursor) out.push({ x0: cursor, x1: ox0, y0, y1 });
      if (o.y0 > y0) out.push({ x0: ox0, x1: ox1, y0, y1: o.y0 });
      if (o.y1 < y1) out.push({ x0: ox0, x1: ox1, y0: o.y1, y1 });
      cursor = Math.max(cursor, ox1);
    }
    if (cursor < fixed.b) out.push({ x0: cursor, x1: fixed.b, y0, y1 });
    return out;
  };
  // north (z0) / south (z1) run along X
  for (const [side, zz] of [['north', z0], ['south', z1]]) {
    for (const seg of build(side, sides[side], { a: x0, b: x1 })) {
      b.boxMM(seg.x0, seg.y0, zz - thickness / 2, seg.x1, seg.y1, zz + thickness / 2, mat, { tex, tint, grime });
    }
  }
  for (const [side, xx] of [['west', x0], ['east', x1]]) {
    for (const seg of build(side, sides[side], { a: z0, b: z1 })) {
      b.boxMM(xx - thickness / 2, seg.y0, seg.x0, xx + thickness / 2, seg.y1, seg.x1, mat, { tex, tint, grime });
    }
  }
  for (const wdw of windows) {
    // window sill and frame accent
    const { side, x, y, w: ww, h: hh } = wdw;
    if (side === 'north' || side === 'south') {
      const zz = side === 'north' ? z0 : z1;
      b.boxMM(x - ww / 2 - 0.1, y - 0.08, zz - thickness / 2 - 0.1, x + ww / 2 + 0.1, y, zz + thickness / 2 + 0.1, 'concrete', { tex: 1.5 });
    } else {
      const xx = side === 'west' ? x0 : x1;
      b.boxMM(xx - thickness / 2 - 0.1, y - 0.08, x - ww / 2 - 0.1, xx + thickness / 2 + 0.1, y, x + ww / 2 + 0.1, 'concrete', { tex: 1.5 });
    }
  }
}

/** Gabled / flat roof slab with parapet. */
export function flatRoof(b, { x, z, w, d, y, mat = 'concrete', thickness = 0.3, tex = 3 }) {
  b.boxMM(x - w / 2, y, z - d / 2, x + w / 2, y + thickness, z + d / 2, mat, { tex, collideTag: 'floor' });
  const ph = 0.7;
  b.boxMM(x - w / 2, y + thickness, z - d / 2, x + w / 2, y + thickness + ph, z - d / 2 + 0.25, mat, { tex });
  b.boxMM(x - w / 2, y + thickness, z + d / 2 - 0.25, x + w / 2, y + thickness + ph, z + d / 2, mat, { tex });
  b.boxMM(x - w / 2, y + thickness, z - d / 2, x - w / 2 + 0.25, y + thickness + ph, z + d / 2, mat, { tex });
  b.boxMM(x + w / 2 - 0.25, y + thickness, z - d / 2, x + w / 2, y + thickness + ph, z + d / 2, mat, { tex });
}

/** Simple gable roof from two slanted slabs (uses rotated boxes). */
export function gableRoof(b, { x, z, w, d, y, rise = 1.2, mat = 'roof', overhang = 0.4, tex = 2 }) {
  const half = d / 2 + overhang;
  const slope = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  // rotated slabs via raw matrices
  const mkSlab = (sign) => {
    const geo = new THREE.BoxGeometry(w + overhang * 2, 0.18, slope);
    const m = new THREE.Matrix4()
      .makeTranslation(x, y + rise / 2, z + (sign * half) / 2)
      .multiply(new THREE.Matrix4().makeRotationX(sign * ang));
    b.raw(geo, m, mat, { tex });
  };
  // remove the first flat slab placeholder effect by rebuilding cleanly:
  mkSlab(-1);
  mkSlab(1);
}

export function stairs(b, { x, z, y0, dir = 'n', width = 1.6, steps = 10, rise = 0.22, run = 0.32, mat = 'concrete', tex = 1.5 }) {
  for (let i = 0; i < steps; i++) {
    const h = rise * (i + 1);
    const off = run * i + run / 2;
    let cx = x;
    let cz = z;
    let w = width;
    let d = run;
    if (dir === 'n') cz = z - off;
    if (dir === 's') cz = z + off;
    if (dir === 'e') {
      cx = x + off;
      w = run;
      d = width;
    }
    if (dir === 'w') {
      cx = x - off;
      w = run;
      d = width;
    }
    b.box(cx, y0 + h / 2, cz, w, h, d, mat, { tex });
  }
}

export function railing(b, { x0, z0, x1, z1, y, height = 1.05, mat = 'metalPlate', postEvery = 1.6, tex = 1 }) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const posts = Math.max(2, Math.round(len / postEvery));
  const dx = (x1 - x0) / posts;
  const dz = (z1 - z0) / posts;
  for (let i = 0; i <= posts; i++) {
    b.box(x0 + dx * i, y + height / 2, z0 + dz * i, 0.07, height, 0.07, mat, { tex, collide: false });
  }
  const ang = Math.atan2(dz, dx);
  const midX = (x0 + x1) / 2;
  const midZ = (z0 + z1) / 2;
  for (const hh of [height, height * 0.55]) {
    b.box(midX, y + hh, midZ, len, 0.06, 0.06, mat, { tex, rotY: -ang, collide: false });
  }
}

export function catwalk(b, { x0, z0, x1, z1, y, width = 1.4, mat = 'metalPlate', rails = true, tex = 1 }) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ang = Math.atan2(z1 - z0, x1 - x0);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  b.box(cx, y - 0.06, cz, len, 0.12, width, mat, { tex, rotY: -ang, collideTag: 'floor' });
  if (rails) {
    for (const side of [-1, 1]) {
      const ox = Math.sin(ang) * side * width * 0.5;
      const oz = -Math.cos(ang) * side * width * 0.5;
      railing(b, { x0: x0 + ox, z0: z0 + oz, x1: x1 + ox, z1: z1 + oz, y, mat, tex });
    }
  }
}

export function powerLines(b, { points, height = 8, mat = 'metalPlate' }) {
  for (const [x, z] of points) {
    b.box(x, height / 2, z, 0.22, height, 0.22, 'wood', { tex: 1.5, collide: true });
    b.box(x, height - 0.4, z, 2.4, 0.12, 0.12, 'wood', { tex: 1.5, collide: false });
  }
}

/**
 * Axis-aligned exterior wall with real window openings, built floor by floor.
 * Unlike roomShell (solid perimeter + applied frames) this leaves actual holes
 * so interiors are visible from the street and light spills out at night.
 */
export function windowedWall(b, {
  x0, z0, x1, z1, y0, y1,
  mat = 'concrete', tex = 2.5, thickness = 0.3,
  bays = 4, sill = 0.95, head = 2.05, floors = 1,
  tint, glassRatio = 0.72, brokenness = 0.3, seed = 5, collideTag = 'wall',
  door = null, collar = true,
}) {
  const horizontal = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const a0 = horizontal ? Math.min(x0, x1) : Math.min(z0, z1);
  const a1 = horizontal ? Math.max(x0, x1) : Math.max(z0, z1);
  const fixed = horizontal ? z0 : x0;
  const len = a1 - a0;
  if (len <= 0.01 || y1 <= y0) return;
  const r = makeRng(seed * 7919 + Math.round(a0 * 3 + fixed * 5));
  const floorH = (y1 - y0) / floors;
  const t = thickness;

  const put = (u0, u1, v0, v1, material, opts = {}) => {
    if (u1 - u0 < 0.02 || v1 - v0 < 0.02) return;
    if (horizontal) b.boxMM(u0, v0, fixed - t / 2, u1, v1, fixed + t / 2, material, opts);
    else b.boxMM(fixed - t / 2, v0, u0, fixed + t / 2, v1, u1, material, opts);
  };
  const glass = (u0, u1, v0, v1) => {
    const gm = 'glass';
    const opts = { tex: 1.1, collide: false, tint: [0.2, 0.25, 0.26] };
    if (horizontal) b.boxMM(u0, v0, fixed - 0.015, u1, v1, fixed + 0.015, gm, opts);
    else b.boxMM(fixed - 0.015, v0, u0, fixed + 0.015, v1, u1, gm, opts);
  };

  const bayW = len / bays;
  for (let f = 0; f < floors; f++) {
    const fy = y0 + f * floorH;
    const sy = fy + sill;
    const hy = fy + Math.min(head, floorH - 0.15);
    // spandrel bands (below and above the window strip)
    put(a0, a1, fy, sy, mat, { tex, tint, grime: 0.5 });
    put(a0, a1, hy, fy + floorH, mat, { tex, tint, grime: 0.6 });
    // piers between bays
    for (let i = 0; i <= bays; i++) {
      const c = a0 + i * bayW;
      const half = Math.min(0.34, bayW * 0.16);
      put(Math.max(a0, c - half), Math.min(a1, c + half), sy, hy, mat, { tex, tint, grime: 0.4 });
    }
    // windows
    for (let i = 0; i < bays; i++) {
      const wu0 = a0 + i * bayW + Math.min(0.34, bayW * 0.16) + 0.06;
      const wu1 = a0 + (i + 1) * bayW - Math.min(0.34, bayW * 0.16) - 0.06;
      if (wu1 - wu0 < 0.3) continue;
      // ground-floor door opening
      if (door && f === 0 && door.bay === i) {
        put(wu0 - 0.02, wu1 + 0.02, fy, sy, mat, { tex, tint });
        // cut the spandrel where the door sits
        if (horizontal) {
          // remove overlap by drawing door frame instead (door mesh already placed)
        }
        continue;
      }
      const roll = r();
      if (roll > glassRatio) {
        // boarded up / dark opening
        put(wu0, wu1, sy, hy, 'wood', { tex: 1.2, collide: false, tint: [0.34, 0.3, 0.24], grime: 0.6 });
      } else if (roll > glassRatio - brokenness) {
        // blown out: keep the hole
      } else {
        glass(wu0, wu1, sy, hy);
      }
      // sill + lintel trim protruding slightly
      if (collar) {
        if (horizontal) {
          b.boxMM(wu0 - 0.12, sy - 0.07, fixed - t / 2 - 0.07, wu1 + 0.12, sy + 0.02, fixed + t / 2 + 0.07, 'concrete', { tex: 0.9, collide: false, tint: [0.74, 0.72, 0.68] });
          b.boxMM(wu0 - 0.1, hy - 0.02, fixed - t / 2 - 0.05, wu1 + 0.1, hy + 0.07, fixed + t / 2 + 0.05, 'concrete', { tex: 0.9, collide: false, tint: [0.7, 0.68, 0.64] });
        } else {
          b.boxMM(fixed - t / 2 - 0.07, sy - 0.07, wu0 - 0.12, fixed + t / 2 + 0.07, sy + 0.02, wu1 + 0.12, 'concrete', { tex: 0.9, collide: false, tint: [0.74, 0.72, 0.68] });
          b.boxMM(fixed - t / 2 - 0.05, hy - 0.02, wu0 - 0.1, fixed + t / 2 + 0.05, hy + 0.07, wu1 + 0.1, 'concrete', { tex: 0.9, collide: false, tint: [0.7, 0.68, 0.64] });
        }
      }
    }
    // floor band
    if (floors > 1 && f < floors - 1) {
      put(a0, a1, fy + floorH - 0.14, fy + floorH, 'concrete', { tex: 1.2, collide: false, tint: [0.76, 0.74, 0.7] });
    }
  }
  // solid collision slab for the whole wall (thin) so player cannot walk through
  if (horizontal) b.colliders.addRawBox(a0, y0, fixed - t / 2, a1, y1, fixed + t / 2, collideTag);
  else b.colliders.addRawBox(fixed - t / 2, y0, a0, fixed + t / 2, y1, a1, collideTag);
}
