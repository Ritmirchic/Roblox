// ============================================================
// tools/raster.js — software rasterizer used for offline visual QA.
// Renders three.js scene graphs (positions + UVs + textures) to a
// PNG so levels can be visually inspected without a GPU/display.
// ============================================================
import * as THREE from 'three';
import { getTextureSet } from '../src/core/textures.js';
import { clamp, saturate, smoothstep } from '../src/core/util.js';

const M4 = {
  perspective(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf;
    out[11] = -1; out[14] = 2 * far * near * nf;
    return out;
  },
  ortho(out, l, r, b, t, n, f) {
    const lr = 1 / (l - r), bt = 1 / (b - t), nf = 1 / (n - f);
    out.fill(0);
    out[0] = -2 * lr; out[5] = -2 * bt; out[10] = 2 * nf;
    out[12] = (l + r) * lr; out[13] = (t + b) * bt; out[14] = (f + n) * nf; out[15] = 1;
    return out;
  },
};

function mat4Mul(a, b, out) {
  // column-major: out[col*4+row] = sum_k a[k*4+row] * b[col*4+k]
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function transformPoint(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
    m[3] * x + m[7] * y + m[11] * z + m[15],
  ];
}

// ------------------------------------------------------------
// Scene extraction: flatten every Mesh under root into triangles
// with world transform, uv, and a material descriptor.
// ------------------------------------------------------------
function extractMeshGeometry(geo, material, mw, tris) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const nor = geo.attributes.normal;
  const idx = geo.index;
  const mats = Array.isArray(material) ? material : [material];
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(new THREE.Matrix4().fromArray(mw)).elements;
  const groups = (geo.groups && geo.groups.length) ? geo.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
  for (const g of groups) {
    const mi = g.materialIndex || 0;
    const mat = mats[mi] || mats[0];
    if (!mat || mat.visible === false) continue;
    for (let i = g.start; i < g.start + g.count; i += 3) {
      const a = idx ? idx.getX(i) : i;
      const b = idx ? idx.getX(i + 1) : i + 1;
      const c = idx ? idx.getX(i + 2) : i + 2;
      const P = [a, b, c].map((v) => {
        const p = transformPoint(mw, pos.getX(v), pos.getY(v), pos.getZ(v));
        return [p[0], p[1], p[2]];
      });
      const UV = [a, b, c].map((v) => (uv ? [uv.getX(v), uv.getY(v)] : [0, 0]));
      const N = [a, b, c].map((v) => {
        if (!nor) return [0, 1, 0];
        const x = nor.getX(v), y = nor.getY(v), z = nor.getZ(v);
        const nx = normalMatrix[0] * x + normalMatrix[3] * y + normalMatrix[6] * z;
        const ny = normalMatrix[1] * x + normalMatrix[4] * y + normalMatrix[7] * z;
        const nz = normalMatrix[2] * x + normalMatrix[5] * y + normalMatrix[8] * z;
        const l = Math.hypot(nx, ny, nz) || 1;
        return [nx / l, ny / l, nz / l];
      });
      tris.push({ P, UV, N, mat, mi });
    }
  }
}

export function collectTriangles(root, opts = {}) {
  const tris = [];
  const lights = [];
  root.updateMatrixWorld(true);
  root.traverseVisible((obj) => {
    if (obj.isLight) {
      lights.push(obj);
      return;
    }
    if (!obj.isMesh) return;
    const geo = obj.geometry;
    if (!geo || !geo.attributes || !geo.attributes.position) return;
    if (obj.userData && obj.userData.noPreview) return;
    if (obj.isInstancedMesh) {
      // explode instances into triangles with per-instance transforms
      const instMat = new THREE.Matrix4();
      const world = new THREE.Matrix4();
      const sub = new THREE.Object3D();
      for (let k = 0; k < obj.count; k++) {
        obj.getMatrixAt(k, instMat);
        world.multiplyMatrices(obj.matrixWorld, instMat);
        sub.matrix.copy(world);
        sub.matrix.decompose(sub.position, sub.quaternion, sub.scale);
        sub.updateMatrixWorld(true);
        extractMeshGeometry(geo, obj.material, sub.matrixWorld.elements, tris);
      }
      return;
    }
    const geo2 = geo;
    const pos = geo2.attributes.position;
    const uv = geo2.attributes.uv;
    const nor = geo2.attributes.normal;
    const idx = geo2.index;
    const mw = obj.matrixWorld.elements;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const groups = (geo.groups && geo.groups.length) ? geo.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld).elements;

    const pushTri = (a, b, c, mi) => {
      const mat = mats[mi] || mats[0];
      if (!mat) return;
      if (mat.visible === false) return;
      const P = [a, b, c].map((v) => {
        const p = transformPoint(mw, pos.getX(v), pos.getY(v), pos.getZ(v));
        return [p[0], p[1], p[2]];
      });
      const UV = [a, b, c].map((v) => (uv ? [uv.getX(v), uv.getY(v)] : [0, 0]));
      const N = [a, b, c].map((v) => {
        if (!nor) return [0, 1, 0];
        const x = nor.getX(v), y = nor.getY(v), z = nor.getZ(v);
        const nx = normalMatrix[0] * x + normalMatrix[3] * y + normalMatrix[6] * z;
        const ny = normalMatrix[1] * x + normalMatrix[4] * y + normalMatrix[7] * z;
        const nz = normalMatrix[2] * x + normalMatrix[5] * y + normalMatrix[8] * z;
        const l = Math.hypot(nx, ny, nz) || 1;
        return [nx / l, ny / l, nz / l];
      });
      tris.push({ P, UV, N, mat, mi });
    };

    for (const g of groups) {
      const start = idx ? g.start : g.start;
      const end = idx ? g.start + g.count : g.start + g.count;
      const mi = g.materialIndex || 0;
      const mat = mats[mi] || mats[0];
      if (!mat) continue;
      if (mat.visible === false) continue;
      for (let i = start; i < end; i += 3) {
        const a = idx ? idx.getX(i) : i;
        const b = idx ? idx.getX(i + 1) : i + 1;
        const c = idx ? idx.getX(i + 2) : i + 2;
        pushTri(a, b, c, mi);
      }
    }
  });
  return { tris, lights };
}

function materialInfo(mat) {
  if (!mat) return null;
  const ud = mat.userData || {};
  const texName = ud.texName;
  let set = null;
  if (texName) {
    try { set = getTextureSet(texName); } catch { set = null; }
  }
  const col = mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [1, 1, 1];
  if (mat.userData && mat.userData.terrain) {
    return { terrain: true, splat: mat.userData.splat, sets: mat.userData.sets, color: col, name: 'terrain', side: mat.side, repeat: [1,1] };
  }
  const em = mat.emissive ? [mat.emissive.r, mat.emissive.g, mat.emissive.b] : [0, 0, 0];
  return {
    set,
    color: col,
    emissive: em,
    emissiveIntensity: mat.emissiveIntensity ?? 1,
    transparent: !!mat.transparent,
    opacity: mat.opacity ?? 1,
    alphaTest: mat.alphaTest ?? 0,
    side: mat.side,
    repeat: ud.repeat || [1, 1],
    roughness: mat.roughness ?? 1,
    metalness: mat.metalness ?? 0,
    unlit: !!ud.unlit,
    noShadow: !!ud.noShadow,
    name: ud.texName || mat.name || 'plain',
  };
}


// Sutherland–Hodgman clip of a triangle against w >= near (view depth)
function clipNear(verts, near) {
  const out = [];
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + 1) % n];
    const da = a.w - near, db = b.w - near;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push({
        x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t, w: a.w + (b.w - a.w) * t,
        u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t,
        wx: a.wx + (b.wx - a.wx) * t, wy: a.wy + (b.wy - a.wy) * t, wz: a.wz + (b.wz - a.wz) * t,
        nx: a.nx + (b.nx - a.nx) * t, ny: a.ny + (b.ny - a.ny) * t, nz: a.nz + (b.nz - a.nz) * t,
      });
    }
  }
  return out;
}

// ------------------------------------------------------------
// Rasterizer
// ------------------------------------------------------------
export class Raster {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.color = new Float32Array(w * h * 3);   // linear
    this.depth = new Float32Array(w * h);
    this.sunDir = new THREE.Vector3(0.45, 0.7, 0.3).normalize();
    this.sunColor = [1.0, 0.94, 0.84];
    this.sunPower = 1.25;
    this.skyColor = [0.42, 0.50, 0.62];
    this.groundColor = [0.20, 0.17, 0.13];
    this.fogColor = [0.55, 0.58, 0.60];
    this.fogDensity = 0.0035;
    this.exposure = 1.0;
    this.shadows = true;
    this.shadowSize = 1024;
    this.lightMtx = new Float32Array(16);
    this.shadowBuf = null;
    this.stats = { triangles: 0, drawn: 0, pixels: 0 };
  }

  // Build an orthographic shadow map from a sun direction over a focus box.
  prepareShadow(tris, focus, radius = 60) {
    const size = this.shadowSize;
    const buf = new Float32Array(size * size).fill(2);
    const eye = [focus[0] + this.sunDir.x * radius * 3, focus[1] + this.sunDir.y * radius * 3, focus[2] + this.sunDir.z * radius * 3];
    const view = new THREE.Matrix4().lookAt(new THREE.Vector3(...eye), new THREE.Vector3(focus[0], focus[1], focus[2]), new THREE.Vector3(0, 1, 0));
    view.setPosition(eye[0], eye[1], eye[2]);
    const inv = view.clone().invert().elements;
    const proj = new Float32Array(16);
    const D = radius * 4;
    M4.ortho(proj, -radius, radius, -radius, radius, -D, D);
    const vp = new Float32Array(16);
    mat4Mul(proj, inv, vp);
    this.lightMtx = vp;
    this.shadowBias = 0.0009;

    const toLight = (x, y, z) => {
      const q = transformPoint(vp, x, y, z);
      return [(q[0] * 0.5 + 0.5) * size, (q[1] * 0.5 + 0.5) * size, q[2]];
    };
    for (const t of tris) {
      const info = t._info || (t._info = materialInfo(t.mat));
      if (info.transparent || info.alphaTest > 0 || info.noShadow) continue;
      const p0 = toLight(t.P[0][0], t.P[0][1], t.P[0][2]);
      const p1 = toLight(t.P[1][0], t.P[1][1], t.P[1][2]);
      const p2 = toLight(t.P[2][0], t.P[2][1], t.P[2][2]);
      this._rasterDepth(p0, p1, p2, buf, size);
    }
    this.shadowBuf = buf;
    this.shadowSizeUsed = size;
  }

  _rasterDepth(a, b, c, buf, size) {
    const [x0, y0] = a, [x1, y1] = b, [x2, y2] = c;
    if (x0 < 0 && x1 < 0 && x2 < 0) return;
    if (y0 < 0 && y1 < 0 && y2 < 0) return;
    if (x0 > size && x1 > size && x2 > size) return;
    if (y0 > size && y1 > size && y2 > size) return;
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(size - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(size - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (minX > maxX || minY > maxY) return;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-6) return;
    const invArea = 1 / area;
    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * invArea;
        if (w0 < 0) continue;
        const w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * invArea;
        if (w1 < 0) continue;
        const w2 = 1 - w0 - w1;
        if (w2 < 0) continue;
        const d = w0 * a[2] + w1 * b[2] + w2 * c[2];
        const i = y * size + x;
        if (d < buf[i]) buf[i] = d;
      }
    }
  }

  shadowAt(x, y, z) {
    if (!this.shadowBuf) return 1;
    const q = transformPoint(this.lightMtx, x, y, z);
    const size = this.shadowSizeUsed;
    const fx = (q[0] * 0.5 + 0.5) * size, fy = (q[1] * 0.5 + 0.5) * size;
    const sx = Math.floor(fx), sy = Math.floor(fy);
    if (sx < 2 || sy < 2 || sx >= size - 2 || sy >= size - 2) return 1;
    const ref = q[2] - this.shadowBias;
    let lit = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const row = (sy + dy) * size;
      for (let dx = -1; dx <= 1; dx++) {
        if (ref <= this.shadowBuf[row + sx + dx]) lit++;
      }
    }
    return lit / 9;
  }

  render(tris, cam, opts = {}) {
    const { w, h } = this;
    this.depth.fill(Infinity);
    const proj = new Float32Array(16);
    M4.perspective(proj, cam.fov * Math.PI / 180, w / h, cam.near || 0.12, cam.far || 800);
    // camera world matrix: rotation from lookAt, then translated to eye, then inverted
    const view = new THREE.Matrix4().lookAt(
      new THREE.Vector3(...cam.pos), new THREE.Vector3(...cam.target), new THREE.Vector3(0, 1, 0));
    view.setPosition(cam.pos[0], cam.pos[1], cam.pos[2]);
    view.invert();
    const vp = new Float32Array(16);
    mat4Mul(proj, view.elements, vp);
    this.camPos = cam.pos;
    this.camForward = new THREE.Vector3(...cam.target).sub(new THREE.Vector3(...cam.pos)).normalize();

    // sky
    const skyTop = opts.skyTop || this.skyColor;
    const skyHorizon = opts.skyHorizon || this.fogColor;
    this._sky(skyTop, skyHorizon);

    let drawn = 0;
    const near = 0.05;
    for (const t of tris) {
      const info = t._info || (t._info = materialInfo(t.mat));
      const verts = [];
      for (let i = 0; i < 3; i++) {
        const q = transformPoint(vp, t.P[i][0], t.P[i][1], t.P[i][2]);
        verts.push({
          x: q[0], y: q[1], z: q[2], w: q[3],
          u: t.UV[i][0], v: t.UV[i][1],
          wx: t.P[i][0], wy: t.P[i][1], wz: t.P[i][2],
          nx: t.N[i][0], ny: t.N[i][1], nz: t.N[i][2],
        });
      }
      // clip against near plane (w > near)
      const poly = clipNear(verts, near);
      if (poly.length < 3) continue;
      for (let i = 1; i < poly.length - 1; i++) {
        this._drawClippedTri(info, poly[0], poly[i], poly[i + 1]);
        drawn++;
      }
    }
    this.stats.triangles = tris.length;
    this.stats.drawn = drawn;
    return this.resolve();
  }

  _sky(top, horizon) {
    const { w, h } = this;
    const fwd = this.camForward || new THREE.Vector3(0, 0, -1);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
    const camUp = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const tanF = Math.tan((45 * Math.PI / 180) / 1);
    for (let y = 0; y < h; y++) {
      const v = 1 - (y / h) * 2;
      for (let x = 0; x < w; x++) {
        const u = (x / w) * 2 - 1;
        const dir = new THREE.Vector3(
          fwd.x + right.x * u + camUp.x * v,
          fwd.y + right.y * u + camUp.y * v,
          fwd.z + right.z * u + camUp.z * v).normalize();
        let t = clamp(dir.y * 1.4, -1, 1);
        let r, g, b;
        if (t > 0) {
          const k = smoothstep(t);
          r = horizon[0] + (top[0] - horizon[0]) * k;
          g = horizon[1] + (top[1] - horizon[1]) * k;
          b = horizon[2] + (top[2] - horizon[2]) * k;
        } else {
          r = horizon[0] * 0.82; g = horizon[1] * 0.82; b = horizon[2] * 0.82;
        }
        const sunDot = dir.dot(this.sunDir);
        if (sunDot > 0.985) {
          const s = smoothstep((sunDot - 0.985) * 60);
          r += s * 1.2; g += s * 1.0; b += s * 0.8;
        } else if (sunDot > 0.9) {
          const s = smoothstep((sunDot - 0.9) * 2) * 0.35;
          r += s * 0.6; g += s * 0.5; b += s * 0.35;
        }
        const i = (y * w + x) * 3;
        this.color[i] = r; this.color[i + 1] = g; this.color[i + 2] = b;
        this.depth[y * w + x] = 1e9;
      }
    }
  }

  _drawClippedTri(info, A, B, C) {
    const { w, h } = this;
    const pts = [A, B, C];
    const sx = (p) => (p.x / p.w * 0.5 + 0.5) * w;
    const sy = (p) => (1 - (p.y / p.w * 0.5 + 0.5)) * h;
    const x0 = sx(A), y0 = sy(A), x1 = sx(B), y1 = sy(B), x2 = sx(C), y2 = sy(C);
    let minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    let maxX = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
    let minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    let maxY = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (minX > maxX || minY > maxY) return;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-6) return;
    if (area > 0 && info.side !== THREE.DoubleSide) return; // backface: CCW in screen space
    const invArea = 1 / area;
    const iz0 = 1 / A.w, iz1 = 1 / B.w, iz2 = 1 / C.w;
    const set = info.set;
    const tw = set ? set.width : 1, th = set ? set.height : 1;
    const rp = info.repeat;
    const alb = set ? set.albedo : null;
    const nrm = set ? set.normal : null;
    const orm = set ? set.orm : null;
    const emi = set && set.emissiveMap ? set.emissive : null;
    const camPos = this.camPos;
    const sun = this.sunDir;
    const unlit = info.unlit;

    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * invArea;
        if (w0 < 0) continue;
        const w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * invArea;
        if (w1 < 0) continue;
        const w2 = 1 - w0 - w1;
        if (w2 < 0) continue;

        const iz = w0 * iz0 + w1 * iz1 + w2 * iz2;
        if (iz <= 0) continue;
        const depth = 1 / iz;
        const di = y * w + x;
        if (depth >= this.depth[di]) continue;

        // perspective-correct interpolation
        const b0 = w0 * iz0 / iz, b1 = w1 * iz1 / iz, b2 = w2 * iz2 / iz;

        let cr = 1, cg = 1, cb = 1, rough = info.roughness, metal = info.metalness, ao = 1, alpha = 1;
        let emr = 0, emg = 0, emb = 0;
        let u = 0, v = 0;
        if (info.terrain) {
          const wxT = b0 * A.wx + b1 * B.wx + b2 * C.wx;
          const wzT = b0 * A.wz + b1 * B.wz + b2 * C.wz;
          const sp = info.splat, sets = info.sets;
          const tw0 = sp.width, th0 = sp.height;
          const sxT = Math.min(tw0 - 1, Math.max(0, ((wxT + 700) / 1400 * tw0) | 0));
          const szT = Math.min(th0 - 1, Math.max(0, ((wzT + 500) / 1000 * th0) | 0));
          const si = (szT * tw0 + sxT) * 4;
          const wr = sp.data[si] / 255, wg = sp.data[si + 1] / 255, wb = sp.data[si + 2] / 255, wa = sp.data[si + 3] / 255;
          const uvx = ((wxT * 0.25) % 1 + 1) % 1, uvy = ((wzT * 0.25) % 1 + 1) % 1;
          const sampleAt = (set, wx0, wz0, sc) => {
            const ux = ((wx0 * 0.25 * sc) % 1 + 1) % 1, uy = ((wz0 * 0.25 * sc) % 1 + 1) % 1;
            const tx = Math.min(set.width - 1, (ux * set.width) | 0), ty = Math.min(set.height - 1, (uy * set.height) | 0);
            const ti = (ty * set.width + tx) * 4;
            return [set.albedo[ti] / 255, set.albedo[ti + 1] / 255, set.albedo[ti + 2] / 255];
          };
          const mix3 = (a, b, k) => [a[0] * (1 - k) + b[0] * k, a[1] * (1 - k) + b[1] * k, a[2] * (1 - k) + b[2] * k];
          const g1 = mix3(mix3(sampleAt(sets[0], wxT, wzT, 1), sampleAt(sets[0], wxT, wzT, 3.7), 0.35), sampleAt(sets[0], wxT, wzT, 11), 0.15);
          const d1 = mix3(sampleAt(sets[1], wxT, wzT, 0.8), sampleAt(sets[1], wxT, wzT, 4.3), 0.3);
          const s1 = mix3(sampleAt(sets[2], wxT, wzT, 1.3), sampleAt(sets[2], wxT, wzT, 5.1), 0.3);
          const a1 = mix3(sampleAt(sets[3], wxT, wzT, 1), sampleAt(sets[3], wxT, wzT, 4), 0.25);
          const r1 = mix3(sampleAt(sets[4], wxT, wzT, 0.7), sampleAt(sets[4], wxT, wzT, 3.1), 0.3);
          const tot = wr + wg + wb + wa + 0.0001;
          cr = (g1[0] * wr + d1[0] * wg + s1[0] * wb + a1[0] * wa * 0.96 + r1[0] * wa * 0.1) / tot;
          cg = (g1[1] * wr + d1[1] * wg + s1[1] * wb + a1[1] * wa * 0.96 + r1[1] * wa * 0.1) / tot;
          cb = (g1[2] * wr + d1[2] * wg + s1[2] * wb + a1[2] * wa * 0.96 + r1[2] * wa * 0.1) / tot;
          // macro variation (matches ground shader)
          const mSet = sets[1];
          const mx = Math.min(mSet.width - 1, ((((wxT * 0.0125) % 1) + 1) % 1 * mSet.width) | 0);
          const mz = Math.min(mSet.height - 1, ((((wzT * 0.0125) % 1) + 1) % 1 * mSet.height) | 0);
          const macro = mSet.albedo[(mz * mSet.width + mx) * 4] / 255;
          const mac = 0.74 + macro * 0.5;
          cr *= mac; cg *= mac; cb *= mac;
          cr = cr ** 2.2; cg = cg ** 2.2; cb = cb ** 2.2;
          rough = 0.9; metal = 0;
          if (this.debugMode === 'albedo') {
            const ci0 = di * 3;
            this.color[ci0] = cr; this.color[ci0 + 1] = cg; this.color[ci0 + 2] = cb;
            continue;
          }
          // lighting (mirrors the generic path)
          const ndlT = Math.max(0, (b0 * A.nx + b1 * B.nx + b2 * C.nx) * sun.x + (b0 * A.ny + b1 * B.ny + b2 * C.ny) * sun.y + (b0 * A.nz + b1 * B.nz + b2 * C.nz) * sun.z);
          const shT = this.shadows ? this.shadowAt(wxT, (b0 * A.wy + b1 * B.wy + b2 * C.wy), wzT) : 1;
          const upT = (b0 * A.ny + b1 * B.ny + b2 * C.ny);
          const ambT = upT * 0.5 + 0.5;
          const sunIT = this.sunPower * ndlT * shT;
          const arT = (this.skyColor[0] * ambT + this.groundColor[0] * (1 - ambT)) * 0.55;
          const agT = (this.skyColor[1] * ambT + this.groundColor[1] * (1 - ambT)) * 0.55;
          const abT = (this.skyColor[2] * ambT + this.groundColor[2] * (1 - ambT)) * 0.55;
          let lrT = cr * (sunIT * this.sunColor[0] + arT);
          let lgT = cg * (sunIT * this.sunColor[1] + agT);
          let lbT = cb * (sunIT * this.sunColor[2] + abT);
          const fcT = 1 - Math.exp(-this.fogDensity * depth);
          lrT = lrT * (1 - fcT) + this.fogColor[0] * fcT;
          lgT = lgT * (1 - fcT) + this.fogColor[1] * fcT;
          lbT = lbT * (1 - fcT) + this.fogColor[2] * fcT;
          const ciT = di * 3;
          this.color[ciT] = lrT * this.exposure;
          this.color[ciT + 1] = lgT * this.exposure;
          this.color[ciT + 2] = lbT * this.exposure;
          this.depth[di] = depth;
          continue;
        }
        if (alb) {
          u = b0 * A.u + b1 * B.u + b2 * C.u;
          v = b0 * A.v + b1 * B.v + b2 * C.v;
          const tx = ((u * rp[0]) % 1 + 1) % 1, ty = ((v * rp[1]) % 1 + 1) % 1;
          const ix = Math.min(tw - 1, (tx * tw) | 0), iy = Math.min(th - 1, (ty * th) | 0);
          const ti = (iy * tw + ix) * 4;
          cr = (alb[ti] / 255) ** 2.2; cg = (alb[ti + 1] / 255) ** 2.2; cb = (alb[ti + 2] / 255) ** 2.2;
          alpha = alb[ti + 3] / 255;
          cr *= info.color[0]; cg *= info.color[1]; cb *= info.color[2];
          if (alpha <= 0.004) continue;
          if (info.alphaTest > 0 && alpha < info.alphaTest) continue;
          if (orm) {
            ao = 0.62 + orm[ti] / 255 * 0.38;
            rough = Math.min(1, Math.max(0.05, (orm[ti + 1] / 255) * info.roughness));
            metal = Math.min(1, (orm[ti + 2] / 255) * info.metalness);
          }
          if (emi) { emr = emi[ti] / 255; emg = emi[ti + 1] / 255; emb = emi[ti + 2] / 255; }
        } else {
          cr = info.color[0]; cg = info.color[1]; cb = info.color[2];
        }
        if (info.transparent && info.opacity < 0.02) continue;

        const wx = b0 * A.wx + b1 * B.wx + b2 * C.wx;
        const wy = b0 * A.wy + b1 * B.wy + b2 * C.wy;
        const wz = b0 * A.wz + b1 * B.wz + b2 * C.wz;

        let nx = b0 * A.nx + b1 * B.nx + b2 * C.nx;
        let ny = b0 * A.ny + b1 * B.ny + b2 * C.ny;
        let nz = b0 * A.nz + b1 * B.nz + b2 * C.nz;
        let nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        if (nrm) {
          const tx = ((u * rp[0]) % 1 + 1) % 1, ty = ((v * rp[1]) % 1 + 1) % 1;
          const ix = Math.min(tw - 1, (tx * tw) | 0), iy = Math.min(th - 1, (ty * th) | 0);
          const ti = (iy * tw + ix) * 4;
          const mnx = nrm[ti] / 127.5 - 1, mny = nrm[ti + 1] / 127.5 - 1, mnz = nrm[ti + 2] / 127.5 - 1;
          // tangent from UV derivatives is unavailable per-pixel (no tri UV stored here),
          // so build a stable tangent frame from the geometric normal.
          let tx2, ty2, tz2;
          if (Math.abs(ny) < 0.9) { tx2 = nz; ty2 = 0; tz2 = -nx; }
          else { tx2 = 0; ty2 = -nz; tz2 = ny; }
          const tl = Math.hypot(tx2, ty2, tz2) || 1;
          tx2 /= tl; ty2 /= tl; tz2 /= tl;
          const bx = ny * tz2 - nz * ty2, by = nz * tx2 - nx * tz2, bz = nx * ty2 - ny * tx2;
          const k = 0.8;
          nx += (tx2 * mnx + bx * mny) * k;
          ny += (ty2 * mnx + by * mny) * k;
          nz += (tz2 * mnx + bz * mny) * k;
          nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl; ny /= nl; nz /= nl;
        }

        let lr, lg, lb;
        if (this.debugMode === 'albedo') {
          lr = cr; lg = cg; lb = cb;
          const ci0 = di * 3;
          this.color[ci0] = lr; this.color[ci0 + 1] = lg; this.color[ci0 + 2] = lb;
          continue;
        }
        if (this.debugMode === 'normal') {
          const ci0 = di * 3;
          this.color[ci0] = nx * 0.5 + 0.5; this.color[ci0 + 1] = ny * 0.5 + 0.5; this.color[ci0 + 2] = nz * 0.5 + 0.5;
          continue;
        }
        if (this.debugMode === 'ndl') {
          const nd = Math.max(0, nx * sun.x + ny * sun.y + nz * sun.z);
          const ci0 = di * 3;
          this.color[ci0] = nd; this.color[ci0 + 1] = nd; this.color[ci0 + 2] = nd;
          continue;
        }
        if (this.debugMode === 'shadow') {
          const sh = this.shadowAt(wx, wy, wz);
          const ci0 = di * 3;
          this.color[ci0] = sh; this.color[ci0 + 1] = sh; this.color[ci0 + 2] = sh;
          continue;
        }
        if (unlit) {
          lr = cr * 3.0; lg = cg * 3.0; lb = cb * 3.0;
          lr += emr; lg += emg; lb += emb;
        } else {
          const ndl = nx * sun.x + ny * sun.y + nz * sun.z;
          let shadow = 1;
          if (this.shadows && ndl > 0 && !info.noShadow) shadow = this.shadowAt(wx, wy, wz);
          const diff = Math.max(0, ndl) * shadow;
          const upness = ny * 0.5 + 0.5;
          const amb = upness * 0.7 + 0.3;
          const sunI = this.sunPower * diff;
          // hemisphere ambient
          const ar = (this.skyColor[0] * amb + this.groundColor[0] * (1 - amb)) * 0.55 * ao;
          const ag = (this.skyColor[1] * amb + this.groundColor[1] * (1 - amb)) * 0.55 * ao;
          const ab = (this.skyColor[2] * amb + this.groundColor[2] * (1 - amb)) * 0.55 * ao;
          // cheap specular (Blinn-Phong) from sun
          const vx0 = camPos[0] - wx, vy0 = camPos[1] - wy, vz0 = camPos[2] - wz;
          const vlen = Math.hypot(vx0, vy0, vz0) || 1;
          const vx = vx0 / vlen, vy = vy0 / vlen, vz = vz0 / vlen;
          const hx = sun.x + vx, hy = sun.y + vy, hz = sun.z + vz;
          const hl = Math.hypot(hx, hy, hz) || 1;
          const ndh = Math.max(0, (nx * hx + ny * hy + nz * hz) / hl);
          const shin = Math.pow(ndh, 6 + (1 - rough) * 70) * (0.25 + (1 - rough) * 0.9) * (0.3 + metal * 1.1) * shadow;
          const spec = Math.min(sunI * shin * 0.55, 1.6);
          lr = cr * (sunI * this.sunColor[0] + ar) + spec * this.sunColor[0];
          lg = cg * (sunI * this.sunColor[1] + ag) + spec * this.sunColor[1];
          lb = cb * (sunI * this.sunColor[2] + ab) + spec * this.sunColor[2];
          lr += emr * info.emissiveIntensity; lg += emg * info.emissiveIntensity; lb += emb * info.emissiveIntensity;
        }
        const fc = 1 - Math.exp(-this.fogDensity * depth);
        lr = lr * (1 - fc) + this.fogColor[0] * fc;
        lg = lg * (1 - fc) + this.fogColor[1] * fc;
        lb = lb * (1 - fc) + this.fogColor[2] * fc;
        if (info.transparent) {
          const op = info.opacity;
          const ci = di * 3;
          this.color[ci] = this.color[ci] * (1 - op) + lr * op;
          this.color[ci + 1] = this.color[ci + 1] * (1 - op) + lg * op;
          this.color[ci + 2] = this.color[ci + 2] * (1 - op) + lb * op;
          continue; // no depth write for transparent
        }
        const ci = di * 3;
        if (this.debugBuf) {
          this.debugBuf[di] = { mat: info.name, cr, cg, cb, nx, ny, nz, rough, metal, u, v, wx, wy, wz, sh: this.shadowAt(wx, wy, wz) };
        }
        this.color[ci] = lr * this.exposure;
        this.color[ci + 1] = lg * this.exposure;
        this.color[ci + 2] = lb * this.exposure;
        this.depth[di] = depth;
      }
    }
  }

  resolve(opts = {}) {
    const { w, h } = this;
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        // ACES-ish tonemap
        let r = this.color[i], g = this.color[i + 1], b = this.color[i + 2];
        r = (r * (2.51 * r + 0.03)) / (r * (2.43 * r + 0.59) + 0.14);
        g = (g * (2.51 * g + 0.03)) / (g * (2.43 * g + 0.59) + 0.14);
        b = (b * (2.51 * b + 0.03)) / (b * (2.43 * b + 0.59) + 0.14);
        // vignette + grain
        const vx = (x / w - 0.5) * 2, vy = (y / h - 0.5) * 2;
        const vig = 1 - smoothstep((Math.hypot(vx, vy) - 0.55) / 0.9) * 0.55;
        const grain = ((x * 12.9898 + y * 78.233) % 1) * 0.02 - 0.01;
        const o = (y * w + x) * 4;
        out[o] = clamp((r * vig + grain), 0, 1) ** (1 / 2.2) * 255;
        out[o + 1] = clamp((g * vig + grain), 0, 1) ** (1 / 2.2) * 255;
        out[o + 2] = clamp((b * vig + grain), 0, 1) ** (1 / 2.2) * 255;
        out[o + 3] = 255;
      }
    }
    return out;
  }
}
