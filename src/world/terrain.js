// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/terrain.js — analytic heightfield, roads, splat-shaded mesh
// ============================================================
import * as THREE from 'three';
import { Noise, RNG, clamp, lerp, smoothstep, saturate } from '../core/util.js';
import { getTextureSet } from '../core/textures.js';
import { REGIONS } from '../game/data.js';

// Road network: polylines in world space. Region hubs joined by a highway loop
// plus local streets. Terrain flattens beneath them.
export const ROAD_HUBS = {
  suburbs: [-400, 250], forest: [-400, -250], industrial: [100, 250],
  city: [100, -250], military: [500, -250], wasteland: [500, 250],
};

export const ROADS = [
  // main highway: ring connecting all region hubs
  { pts: [[-400, 250], [-400, -250]], width: 11, main: true },
  { pts: [[-400, -250], [100, -250]], width: 11, main: true },
  { pts: [[100, -250], [500, -250]], width: 11, main: true },
  { pts: [[500, -250], [500, 250]], width: 11, main: true },
  { pts: [[500, 250], [100, 250]], width: 11, main: true },
  { pts: [[100, 250], [-400, 250]], width: 11, main: true },
  // central service road
  { pts: [[-100, 0], [300, 0]], width: 9, main: true },
  { pts: [[-400, 250], [-400, 420]], width: 7 },
  { pts: [[100, -250], [100, -430]], width: 7 },
  { pts: [[-620, 180], [-180, 180]], width: 7 },
  { pts: [[-620, 320], [-180, 320]], width: 7 },
  { pts: [[-300, 60], [-300, 460]], width: 6 },
  { pts: [[-560, 60], [-560, 460]], width: 6 },
  { pts: [[-100, 120], [300, 120]], width: 7 },
  { pts: [[-100, 380], [300, 380]], width: 7 },
  { pts: [[440, 40], [440, 460]], width: 6 },
  { pts: [[580, 40], [580, 460]], width: 6 },
  { pts: [[-100, -120], [300, -120]], width: 8 },
  { pts: [[-100, -380], [300, -380]], width: 8 },
  { pts: [[40, -480], [40, -20]], width: 8 },
  { pts: [[180, -480], [180, -20]], width: 8 },
  { pts: [[300, -60], [680, -60]], width: 7 },
  { pts: [[300, -440], [680, -440]], width: 7 },
  { pts: [[360, -480], [360, -20]], width: 6 },
  { pts: [[620, -480], [620, -20]], width: 6 },
];

function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
  t = clamp(t, 0, 1);
  const cx = ax + dx * t, cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

export class Terrain {
  constructor(seed = 90210) {
    this.seed = seed;
    this.N = new Noise(seed);
    this.N2 = new Noise(seed + 77);
    this.N3 = new Noise(seed + 311);
    this.rng = new RNG(seed);
    this.halfX = 700; this.halfZ = 500;
    this.crater = { x: 560, z: 300, r: 95, depth: 26 };
    this.lake = { x: 470, z: 150, r: 46, level: -2.6 };
    this.river = [[-660, -180], [-520, -120], [-420, -60], [-330, -20], [-250, 40], [-180, 120], [-140, 200]];
    this.roadCache = new Map();
    this.pads = [];
    this.padGrid = new Map();
    this.padCell = 48;
  }

  addPad(x, z, hw, hd, ry, y, blend = 3.0, tag = 'building') {
    const pad = { x, z, hw, hd, ry, y, cos: Math.cos(ry), sin: Math.sin(ry), blend, tag };
    this.pads.push(pad);
    const r = Math.hypot(hw, hd) + blend;
    const ix0 = Math.floor((x - r) / this.padCell), ix1 = Math.floor((x + r) / this.padCell);
    const iz0 = Math.floor((z - r) / this.padCell), iz1 = Math.floor((z + r) / this.padCell);
    for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) {
      const k = ix * 92821 + iz;
      let a = this.padGrid.get(k);
      if (!a) { a = []; this.padGrid.set(k, a); }
      a.push(pad);
    }
    return pad;
  }

  padsAt(x, z) {
    const k = Math.floor(x / this.padCell) * 92821 + Math.floor(z / this.padCell);
    return this.padGrid.get(k) || null;
  }

  // local coords inside a rotated pad rect
  padLocal(pad, x, z) {
    const dx = x - pad.x, dz = z - pad.z;
    return [dx * pad.cos + dz * pad.sin, -dx * pad.sin + dz * pad.cos];
  }

  regionFactor(x, z) {
    // 6 regions, hard borders softened by distance for terrain blending
    const rf = {
      suburbs: x < -100 && z >= 0, forest: x < -100 && z < 0,
      industrial: x >= -100 && x < 300 && z >= 0, city: x >= -100 && x < 300 && z < 0,
      military: x >= 300 && z < 0, wasteland: x >= 300 && z >= 0,
    };
    return rf;
  }

  roadDist(x, z) {
    // coarse cache per 8m cell to keep generation fast
    const key = ((x / 8) | 0) * 100003 + ((z / 8) | 0);
    let v = this.roadCache.get(key);
    if (v !== undefined) return v;
    let best = 1e9;
    for (const r of ROADS) {
      for (let i = 0; i < r.pts.length - 1; i++) {
        const a = r.pts[i], b = r.pts[i + 1];
        if (x < Math.min(a[0], b[0]) - 40 || x > Math.max(a[0], b[0]) + 40) continue;
        if (z < Math.min(a[1], b[1]) - 40 || z > Math.max(a[1], b[1]) + 40) continue;
        const d = distToSegment(x, z, a[0], a[1], b[0], b[1]);
        if (d < best) best = d;
      }
    }
    // cache also the nearest road width
    let w = 9;
    for (const r of ROADS) {
      for (let i = 0; i < r.pts.length - 1; i++) {
        const a = r.pts[i], b = r.pts[i + 1];
        const d = distToSegment(x, z, a[0], a[1], b[0], b[1]);
        if (Math.abs(d - best) < 0.001) { w = r.width; break; }
      }
    }
    const out = { d: best, w };
    this.roadCache.set(key, out);
    return out;
  }

  riverDist(x, z) {
    let best = 1e9;
    for (let i = 0; i < this.river.length - 1; i++) {
      const a = this.river[i], b = this.river[i + 1];
      const d = distToSegment(x, z, a[0], a[1], b[0], b[1]);
      if (d < best) best = d;
    }
    return best;
  }

  // ---- analytic height ------------------------------------------------
  baseHeight(x, z) {
    const N = this.N, N2 = this.N2, N3 = this.N3;
    const u = x / 420 + 5, v = z / 420 + 5;
    let h = 0;
    // forest: rolling hills + fog valleys
    if (x < -100 && z < 0) {
      h = 6 + N.fbm2(u * 1.6, v * 1.6, 5, 64) * 26 + N2.fbm2(u * 5, v * 5, 3, 256) * 5;
      const valley = smoothstep((N3.fbm2(u * 1.1, v * 1.1, 3, 64) - 0.45) * 3.0);
      h -= valley * 7;
      h += N2.ridged(u * 3, v * 3, 3, 128) * 6;
    } else if (x < -100 && z >= 0) {
      // suburbs: gentle, flattened lots
      h = 2.2 + N.fbm2(u * 2.0, v * 2.0, 4, 64) * 6.5 + N2.fbm2(u * 8, v * 8, 2, 256) * 0.9;
      h *= 0.85;
    } else if (x < 300 && z < 0) {
      // city: near flat with river cut
      h = 3.4 + N.fbm2(u * 1.8, v * 1.8, 3, 64) * 3.2;
      h = lerp(h, 2.0, 0.5);
    } else if (x < 300 && z >= 0) {
      // industrial: compacted flat pads with spoil mounds
      h = 1.2 + N.fbm2(u * 2.4, v * 2.4, 3, 64) * 2.4 + N2.ridged(u * 6, v * 6, 2, 128) * 1.6;
    } else if (z < 0) {
      // military: ridgelines and cuttings
      h = 8 + N.fbm2(u * 1.9, v * 1.9, 5, 64) * 22 + N2.ridged(u * 4, v * 4, 4, 128) * 12;
    } else {
      // wasteland: ash dunes, crater, glass flats
      h = 4 + N.fbm2(u * 2.6, v * 2.6, 5, 64) * 12 + N2.fbm2(u * 9, v * 9, 3, 256) * 2.5;
      h += N3.ridged(u * 3.2, v * 3.2, 3, 128) * 7;
    }
    // world-edge mountains to fence the playable area
    const edgeX = Math.max(0, Math.abs(x) - 620) / 80;
    const edgeZ = Math.max(0, Math.abs(z) - 420) / 80;
    const edge = Math.max(edgeX, edgeZ);
    h += smoothstep(edge) * 65;

    // ---- crater ----
    const dc = Math.hypot(x - this.crater.x, z - this.crater.z);
    if (dc < this.crater.r * 2.2) {
      const k = 1 - smoothstep(dc / (this.crater.r * 2.2));
      h -= this.crater.depth * Math.pow(1 - smoothstep(dc / this.crater.r), 2) * 1.1;
      // raised rim
      const rimD = Math.abs(dc - this.crater.r * 1.05) / (this.crater.r * 0.35);
      h += smoothstep(1 - rimD) * 7 * k;
      h += (N2.fbm2(u * 14, v * 14, 2, 256) - 0.5) * 6 * k;
    }
    // ---- river valley ----
    const rd = this.riverDist(x, z);
    if (rd < 40) {
      const k = 1 - smoothstep(rd / 40);
      h = lerp(h, -3.4, k * 0.95);
    }
    // ---- toxic lake ----
    const dl = Math.hypot(x - this.lake.x, z - this.lake.z);
    if (dl < this.lake.r * 1.4) {
      const k = 1 - smoothstep(dl / (this.lake.r * 1.4));
      h = lerp(h, this.lake.level - 1.5, k * 0.95);
    }
    return h;
  }

  heightAt(x, z) {
    let h = this.baseHeight(x, z);
    // flatten under roads with transition shoulders
    const rd = this.roadDist(x, z);
    if (rd.d < 26) {
      const road = this.roadHeight(x, z);
      const k = 1 - smoothstep((rd.d - rd.w * 0.6) / 12);
      h = lerp(h, road, k * 0.92);
    }
    // building / camp pads
    const pads = this.padsAt(x, z);
    if (pads) {
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        const [lx, lz] = this.padLocal(p, x, z);
        const ox = Math.abs(lx) - p.hw, oz = Math.abs(lz) - p.hd;
        const outside = Math.max(ox, oz);
        if (outside <= 0) { h = p.y; }
        else if (outside < p.blend) { h = lerp(p.y, h, smoothstep(outside / p.blend)); }
      }
    }
    return h;
  }

  // Only terrain shape, no pads (used to compute pad heights themselves)
  rawHeightAt(x, z) {
    let h = this.baseHeight(x, z);
    const rd = this.roadDist(x, z);
    if (rd.d < 26) {
      const road = this.roadHeight(x, z);
      const k = 1 - smoothstep((rd.d - rd.w * 0.6) / 12);
      h = lerp(h, road, k * 0.92);
    }
    return h;
  }

  // road follows smoothed terrain: sample base along the segment
  roadHeight(x, z) {
    let best = 1e9, hh = 0;
    for (const r of ROADS) {
      for (let i = 0; i < r.pts.length - 1; i++) {
        const a = r.pts[i], b = r.pts[i + 1];
        const d = distToSegment(x, z, a[0], a[1], b[0], b[1]);
        if (d < best) {
          best = d;
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
          hh = this.baseHeight(mx, mz);
        }
      }
    }
    return hh;
  }

  normalAt(x, z, eps = 0.6) {
    const hl = this.heightAt(x - eps, z), hr = this.heightAt(x + eps, z);
    const hd = this.heightAt(x, z - eps), hu = this.heightAt(x, z + eps);
    const n = new THREE.Vector3(hl - hr, 2 * eps, hd - hu).normalize();
    return n;
  }

  // Material weights: asphalt (roads), gravel (industrial/military), sand (wasteland),
  // rock (steep slopes), dirt (path edges), grass elsewhere.
  weightsAt(x, z) {
    const n = this.normalAt(x, z, 1.2);
    const slope = 1 - n.y;
    const rd = this.roadDist(x, z);
    const reg = this.regionFactor(x, z);
    let asphalt = rd.d < rd.w * 0.62 ? 1 : (rd.d < rd.w * 1.1 ? 1 - smoothstep((rd.d - rd.w * 0.62) / (rd.w * 0.48)) : 0);
    asphalt = Math.min(asphalt, 0.97);
    let rock = smoothstep((slope - 0.18) * 3.2);
    let sand = 0, gravel = 0, dirt = 0, grass = 0;
    if (reg.wasteland) { sand = 0.85; grass = 0.05; dirt = 0.1; }
    else if (reg.military) { gravel = 0.5; dirt = 0.3; grass = 0.2; }
    else if (reg.industrial) { gravel = 0.55; dirt = 0.35; grass = 0.1; }
    else if (reg.city) { gravel = 0.34; dirt = 0.38; grass = 0.28; }
    else if (reg.forest) { grass = 0.70; dirt = 0.22; gravel = 0.08; }
    else { grass = 0.56; dirt = 0.32; gravel = 0.12; }
    // noisy breakup so the ground is not a clean mask
    const nz = this.N3.fbm2(x / 40, z / 40, 3, 64);
    grass *= 0.6 + nz * 0.8;
    dirt *= 0.6 + (1 - nz) * 0.7;
    const riverD = this.riverDist(x, z);
    if (riverD < 20) { dirt = Math.max(dirt, 0.7); grass *= 0.3; }
    const total = grass + dirt + sand + gravel;
    grass /= total; dirt /= total; sand /= total; gravel /= total;
    // blend with asphalt+rock
    const base = 1 - asphalt;
    const rm = rock;
    const out = {
      grass: grass * base * (1 - rm * 0.85),
      dirt: dirt * base * (1 - rm * 0.7),
      sand: sand * base * (1 - rm * 0.6),
      asphalt: asphalt,
      rock: Math.min(1, rm * base + asphalt * 0.02),
    };
    // ground type for gameplay (footsteps, noise)
    let type = 'grass';
    if (asphalt > 0.5) type = 'concrete';
    else if (out.rock > 0.5) type = 'gravel';
    else if (sand > 0.45) type = 'sand';
    else if (gravel > 0.4) type = 'gravel';
    else if (dirt > 0.5) type = 'dirt';
    out.type = type;
    out.road = asphalt > 0.35;
    return out;
  }

  // ---- mesh ------------------------------------------------------------
  build(scene, opts = {}) {
    const step = opts.step || 4;
    const chunk = 64;
    const nx = Math.ceil((this.halfX * 2) / step);
    const nz = Math.ceil((this.halfZ * 2) / step);
    const group = new THREE.Group();
    group.name = 'terrain';

    // splat texture: R grass, G dirt, B sand+gravel, A rock/asphalt
    const SW = Math.floor((this.halfX * 2) / 1.0), SH = Math.floor((this.halfZ * 2) / 1.0);
    const splat = new Uint8Array(SW * SH * 4);
    for (let j = 0; j < SH; j++) {
      for (let i = 0; i < SW; i++) {
        const x = -this.halfX + (i + 0.5) * 1, z = -this.halfZ + (j + 0.5) * 1;
        const w = this.weightsAt(x, z);
        const o = (j * SW + i) * 4;
        splat[o] = Math.round(clamp(w.grass, 0, 1) * 255);
        splat[o + 1] = Math.round(clamp(w.dirt, 0, 1) * 255);
        splat[o + 2] = Math.round(clamp(w.sand + w.rock * 0.15, 0, 1) * 255);
        splat[o + 3] = Math.round(clamp(w.asphalt + w.rock, 0, 1) * 255);
      }
    }
    const splatTex = new THREE.DataTexture(splat, SW, SH, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.splatSize = { w: SW, h: SH };
    splatTex.wrapS = splatTex.wrapT = THREE.ClampToEdgeWrapping;
    splatTex.minFilter = THREE.LinearFilter;
    splatTex.magFilter = THREE.LinearFilter;
    splatTex.colorSpace = THREE.NoColorSpace;
    splatTex.needsUpdate = true;

    this._splatData = splat;
    const material = this.makeMaterial(splatTex);
    this.splatTex = splatTex;
    this.material = material;

    const chunksX = Math.ceil((this.halfX * 2) / chunk);
    const chunksZ = Math.ceil((this.halfZ * 2) / chunk);
    const per = Math.ceil(chunk / step);

    for (let cz = 0; cz < chunksZ; cz++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const ox = -this.halfX + cx * chunk, oz = -this.halfZ + cz * chunk;
        const geo = new THREE.PlaneGeometry(chunk, chunk, per, per);
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        const col = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          const lx = pos.getX(i), ly = pos.getY(i);
          const x = ox + lx + chunk / 2, z = oz - ly + chunk / 2;
          const h = this.heightAt(x, z);
          pos.setZ(i, h);
          // world-space UV for splat lookup (0..1 across map)
          uv.setXY(i, (x + this.halfX) / (this.halfX * 2), (z + this.halfZ) / (this.halfZ * 2));
          // detail UV in metres for tiling textures
          const w = this.weightsAt(x, z);
          const damp = 0.88 + this.N.fbm2(x / 18, z / 18, 3, 32) * 0.24;
          col[i * 3] = damp * (0.84 + w.sand * 0.2);
          col[i * 3 + 1] = damp;
          col[i * 3 + 2] = damp;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.rotateX(-Math.PI / 2);
        geo.translate(ox + chunk / 2, 0, oz + chunk / 2);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        mesh.name = `terrain_${cx}_${cz}`;
        mesh.userData.terrain = true;
        group.add(mesh);
      }
    }
    if (scene) scene.add(group);
    this.group = group;
    return group;
  }

  makeMaterial(splatTex) {
    const names = ['grass', 'dirt', 'sand', 'asphalt', 'rock'];
    const sets = names.map((n) => getTextureSet(n));
    const mk = (data, srgb) => {
      const t = new THREE.DataTexture(data, sets[0].width, sets[0].height, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true; t.anisotropy = 8;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      return t;
    };
    const uniforms = {
      splat: { value: splatTex },
      tGrass: { value: mk(sets[0].albedo, true) }, tDirt: { value: mk(sets[1].albedo, true) },
      tSand: { value: mk(sets[2].albedo, true) }, tAsphalt: { value: mk(sets[3].albedo, true) },
      tRock: { value: mk(sets[4].albedo, true) },
      nRock: { value: mk(sets[4].normal, false) },
      nDirt: { value: mk(sets[1].normal, false) },
      tScale: { value: 0.25 },
      wetness: { value: 0.0 },
    };
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0.0, vertexColors: true });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vNormalW;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vNormalW = normalize(mat3(modelMatrix) * objectNormal);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D splat, tGrass, tDirt, tSand, tAsphalt, tRock, nRock, nDirt;
          uniform float tScale, wetness;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;`)
        .replace('#include <map_fragment>', `
          vec4 sp = texture2D(splat, (vWorldPos.xz - vec2(-700.0, -500.0)) / vec2(1400.0, 1000.0));
          vec2 duv = vWorldPos.xz * tScale;
          vec3 cG = texture2D(tGrass, duv).rgb * 0.62 + texture2D(tGrass, duv * 3.7).rgb * 0.28 + texture2D(tGrass, duv * 11.0).rgb * 0.14;
          vec3 cD = texture2D(tDirt, duv * 0.8).rgb * 0.7 + texture2D(tDirt, duv * 4.3).rgb * 0.3;
          vec3 cS = texture2D(tSand, duv * 1.3).rgb * 0.7 + texture2D(tSand, duv * 5.1).rgb * 0.3;
          vec3 cA = texture2D(tAsphalt, duv).rgb * 0.75 + texture2D(tAsphalt, duv * 4.0).rgb * 0.25;
          vec3 cR = texture2D(tRock, duv * 0.7).rgb * 0.7 + texture2D(tRock, duv * 3.1).rgb * 0.3;
          float sw = sp.r + sp.g + sp.b + sp.a + 0.0001;
          vec3 ground = (cG * sp.r + cD * sp.g + cS * sp.b + cA * sp.a * 0.96 + cR * sp.a * 0.1) / sw;
          float slopeRock = smoothstep(0.35, 0.75, 1.0 - vNormalW.y);
          ground = mix(ground, cR * 0.85, slopeRock * 0.6);
          float macro = texture2D(tDirt, vWorldPos.xz * 0.0125).r;
          float macro2 = texture2D(tSand, vWorldPos.xz * 0.006).g;
          ground *= mix(0.72, 1.12, macro * 0.6 + macro2 * 0.4);
          // dry/wet patchiness
          float patchTex = texture2D(tGrass, vWorldPos.xz * 0.045).r;
          ground = mix(ground, ground * vec3(1.10, 0.98, 0.80), smoothstep(0.45, 0.8, patchTex) * 0.5);
          diffuseColor.rgb *= ground;
        `)
        .replace('#include <roughnessmap_fragment>', `
          float roughnessFactor = clamp(mix(0.95, 0.55, sp.a * 0.7) - wetness * 0.25, 0.18, 1.0);
        `)
        .replace('#include <normal_fragment_maps>', `
          // build the tangent frame from screen-space derivatives: the ground
          // material has no tangent attribute (and no normalMap slot), so the
          // stock tbn matrix is not declared here.
          vec3 mapN1 = texture2D(nRock, vWorldPos.xz * tScale * 0.7).xyz * 2.0 - 1.0;
          vec3 mapN2 = texture2D(nDirt, vWorldPos.xz * tScale).xyz * 2.0 - 1.0;
          vec3 mapN = mix(mapN2, mapN1, slopeRock);
          mapN.xy *= 0.9;
          // screen-space derivatives become degenerate (and produce NaNs that
          // render as a white sheet) on ground seen at grazing angles, so build
          // the tangent frame from the world normal instead.
          vec3 nW = normalize(vNormalW);
          vec3 upRef = abs(nW.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
          vec3 tW = normalize(cross(upRef, nW));
          vec3 bW = normalize(cross(nW, tW));
          normal = normalize(tW * mapN.x + bW * mapN.y + nW * mapN.z);
        `);
    };
    mat.userData.terrain = true;
    mat.userData.splat = this.splatSize ? { width: this.splatSize.w, height: this.splatSize.h, data: this._splatData } : null;
    mat.userData.sets = sets;
    return mat;
  }

  setWetness(v) {
    if (this.material) this.material.userData.wetness = v;
  }

  dispose() {
    if (this.group) {
      this.group.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); }
      });
      if (this.group.parent) this.group.parent.remove(this.group);
    }
  }
}
