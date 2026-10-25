/**
 * Procedural asteroid meshes.
 * An icosphere is displaced by layered 3D noise, then crater-punched and, depending on the
 * sector style, grown crystal shards / metal plating / lava fissures. Three damage states
 * progressively deform and darken the rock as it is mined.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RNG, clamp } from '../core/rng.ts';
import { rockSurface } from './textures.ts';
import type { SectorDef } from '../data/sectors.ts';

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function rockMaterial(style: SectorDef['rockStyle'], seed: number): THREE.MeshStandardMaterial {
  const key = `${style}:${seed}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const pbr = rockSurface(style, seed, 512);
  const emissiveColor = style === 'volcanic' ? 0xff7a2f : style === 'crystal' ? 0x7be0ff : style === 'void' ? 0xb98cff : 0x000000;
  const mat = new THREE.MeshStandardMaterial({
    map: pbr.map,
    normalMap: pbr.normalMap,
    roughnessMap: pbr.roughnessMap,
    metalnessMap: pbr.metalnessMap,
    emissiveMap: pbr.emissiveMap,
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: style === 'basalt' ? 0 : 1.1,
    metalness: 1,
    roughness: 1,
    normalScale: new THREE.Vector2(1.6, 1.6),
  });
  matCache.set(key, mat);
  return mat;
}

/** 3D value noise (cheap, deterministic) for vertex displacement. */
function noise3(rng: RNG) {
  const grad: number[][] = [];
  for (let i = 0; i < 256; i++) {
    const v = [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)];
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    grad.push([v[0] / len, v[1] / len, v[2] / len]);
  }
  const perm = new Uint8Array(512);
  const p = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (g: number[], x: number, y: number, z: number) => g[0] * x + g[1] * y + g[2] * z;
  return (x: number, y: number, z: number): number => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y), zf = z - Math.floor(z);
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const idx = (a: number, b: number, c: number) => perm[(perm[(perm[a] + b) & 255] + c) & 255];
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const g = (a: number, b: number, c: number, dx: number, dy: number, dz: number) => dot(grad[idx(a, b, c)], dx, dy, dz);
    const x1 = lerp(g(X, Y, Z, xf, yf, zf), g(X + 1, Y, Z, xf - 1, yf, zf), u);
    const x2 = lerp(g(X, Y + 1, Z, xf, yf - 1, zf), g(X + 1, Y + 1, Z, xf - 1, yf - 1, zf), u);
    const y1 = lerp(x1, x2, v);
    const x3 = lerp(g(X, Y, Z + 1, xf, yf, zf - 1), g(X + 1, Y, Z + 1, xf - 1, yf, zf - 1), u);
    const x4 = lerp(g(X, Y + 1, Z + 1, xf, yf - 1, zf - 1), g(X + 1, Y + 1, Z + 1, xf - 1, yf - 1, zf - 1), u);
    const y2 = lerp(x3, x4, v);
    return (lerp(y1, y2, w) + 1) * 0.5;
  };
}

export interface AsteroidBuild {
  mesh: THREE.Mesh;
  radius: number;
}

/**
 * @param damage 0 = pristine, 1 = nearly destroyed. Higher damage carves the silhouette.
 */
export function buildAsteroid(style: SectorDef['rockStyle'], seed: number, radius: number, detail = 2, damage = 0): AsteroidBuild {
  const rng = new RNG(seed);
  const n3 = noise3(new RNG(seed + 17));
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  // Craters: random surface points that pull vertices inward.
  const craters: { dir: THREE.Vector3; r: number; depth: number }[] = [];
  const craterCount = 3 + Math.floor(rng.next() * 5) + Math.round(damage * 5);
  for (let i = 0; i < craterCount; i++) {
    craters.push({
      dir: new THREE.Vector3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize(),
      r: rng.range(0.18, 0.55),
      depth: rng.range(0.1, 0.3) * (1 + damage),
    });
  }

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const f1 = n3(dir.x * 1.6 + 10, dir.y * 1.6, dir.z * 1.6) - 0.5;
    const f2 = n3(dir.x * 4.2, dir.y * 4.2 + 5, dir.z * 4.2) - 0.5;
    const f3 = n3(dir.x * 9.5, dir.y * 9.5, dir.z * 9.5 + 3) - 0.5;
    let disp = 1 + f1 * 0.42 + f2 * 0.2 + f3 * 0.09;
    for (const c of craters) {
      const d = dir.dot(c.dir);
      const t = clamp((d - (1 - c.r)) / c.r, 0, 1);
      disp -= t * t * c.depth;
    }
    disp *= 1 - damage * 0.18;
    v.copy(dir).multiplyScalar(radius * disp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const parts: THREE.BufferGeometry[] = [geo];
  // Style-specific growths.
  if (style === 'crystal' || style === 'void') {
    const shardCount = 4 + rng.int(0, 5);
    for (let i = 0; i < shardCount; i++) {
      const dir = new THREE.Vector3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize();
      const len = radius * rng.range(0.4, 0.95);
      const shard = new THREE.ConeGeometry(radius * rng.range(0.08, 0.17), len, rng.int(4, 6));
      shard.translate(0, len * 0.45, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      shard.applyQuaternion(q);
      shard.translate(dir.x * radius * 0.72, dir.y * radius * 0.72, dir.z * radius * 0.72);
      parts.push(shard);
    }
  } else if (style === 'metal') {
    const plateCount = 3 + rng.int(0, 4);
    for (let i = 0; i < plateCount; i++) {
      const dir = new THREE.Vector3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize();
      const plate = new THREE.BoxGeometry(radius * rng.range(0.35, 0.8), radius * rng.range(0.06, 0.14), radius * rng.range(0.3, 0.7));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      plate.applyQuaternion(q);
      plate.translate(dir.x * radius * 0.85, dir.y * radius * 0.85, dir.z * radius * 0.85);
      parts.push(plate);
    }
  } else if (style === 'volcanic') {
    const ventCount = 3 + rng.int(0, 3);
    for (let i = 0; i < ventCount; i++) {
      const dir = new THREE.Vector3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize();
      const vent = new THREE.TorusGeometry(radius * rng.range(0.12, 0.26), radius * 0.05, 6, 12);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      vent.applyQuaternion(q);
      vent.translate(dir.x * radius * 0.92, dir.y * radius * 0.92, dir.z * radius * 0.92);
      parts.push(vent);
    }
  }

  const merged = parts.length > 1 ? mergeGeometries(parts.map((g) => g.toNonIndexed()), false) ?? geo : geo;
  merged.computeVertexNormals();
  if (!merged.attributes.uv) {
    // Spherical UVs for the merged result.
    const p = merged.attributes.position as THREE.BufferAttribute;
    const uv = new Float32Array(p.count * 2);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      tmp.fromBufferAttribute(p, i).normalize();
      uv[i * 2] = 0.5 + Math.atan2(tmp.z, tmp.x) / (Math.PI * 2);
      uv[i * 2 + 1] = 0.5 - Math.asin(clamp(tmp.y, -1, 1)) / Math.PI;
    }
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }

  const mat = rockMaterial(style, (seed % 4) + 1);
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, radius };
}

/** Small ore chunk model spawned by mining. */
export function buildOreChunk(color: number, seed: number, size = 1): THREE.Mesh {
  const rng = new RNG(seed);
  const geo = new THREE.IcosahedronGeometry(size, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(rng.range(0.72, 1.3));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(0.45),
    metalness: 0.75,
    roughness: 0.35,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Derelict hull wreckage used to dress the Iron Graveyard. */
export function buildWreck(seed: number, scale = 1): THREE.Group {
  const rng = new RNG(seed);
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4d5464, metalness: 0.95, roughness: 0.55, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24282f, metalness: 0.8, roughness: 0.7 });
  const spineLen = rng.range(18, 46) * scale;
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(2.2 * scale, 3.1 * scale, spineLen, 8, 1, true), mat);
  spine.rotation.z = Math.PI / 2;
  group.add(spine);
  const ribs = rng.int(4, 9);
  for (let i = 0; i < ribs; i++) {
    const t = (i / (ribs - 1) - 0.5) * spineLen;
    const r = new THREE.Mesh(new THREE.TorusGeometry(rng.range(3, 6.5) * scale, 0.45 * scale, 6, 12, Math.PI * rng.range(0.6, 1.8)), mat);
    r.position.x = t;
    r.rotation.y = Math.PI / 2;
    r.rotation.x = rng.range(0, Math.PI);
    group.add(r);
  }
  for (let i = 0; i < rng.int(3, 7); i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(rng.range(2, 7) * scale, rng.range(0.3, 0.8) * scale, rng.range(2, 6) * scale), dark);
    p.position.set(rng.range(-spineLen / 2, spineLen / 2), rng.range(-4, 4) * scale, rng.range(-4, 4) * scale);
    p.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
    group.add(p);
  }
  return group;
}
