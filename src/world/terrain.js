/**
 * Chunked heightfield terrain with six region profiles, road carving and
 * building pads. Grounding is analytic (heightAt) so movement never depends on
 * mesh resolution.
 */
import * as THREE from 'three';
import { fbm2, ridgedNoise2, valueNoise2, clamp01, lerp, smoothstep, makeRng, TAU } from '../engine/util.js';

export const WORLD_SIZE = 3000;
export const WORLD_MIN = -WORLD_SIZE / 2;

export const REGIONS = [
  { id: 0, key: 'suburbs', name: 'THE DEAD SUBURBS', center: [-1050, -1050], radius: 620, color: 0x8a8570 },
  { id: 1, key: 'forest', name: 'BLACKWOOD FOREST', center: [-420, -1080], radius: 520, color: 0x465033 },
  { id: 2, key: 'industrial', name: 'THE INDUSTRIAL ZONE', center: [-40, -330], radius: 480, color: 0x6a6255 },
  { id: 3, key: 'city', name: 'THE FORGOTTEN CITY', center: [760, -260], radius: 560, color: 0x6d6b66 },
  { id: 4, key: 'military', name: 'THE MILITARY EXCLUSION ZONE', center: [430, 720], radius: 500, color: 0x5c5f47 },
  { id: 5, key: 'wasteland', name: 'THE RED WASTELAND', center: [1130, 1090], radius: 620, color: 0x7a4530 },
];

export function regionWeightsAt(x, z) {
  const w = new Array(REGIONS.length).fill(0);
  let total = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    const r = REGIONS[i];
    const dx = x - r.center[0];
    const dz = z - r.center[1];
    const d = Math.hypot(dx, dz);
    // noisy boundary so regions interlock organically
    const wobble = (valueNoise2(x * 0.0035, z * 0.0035, 300 + i * 13) - 0.5) * 180;
    const dist = Math.max(1, d + wobble);
    const f = Math.pow(r.radius / dist, 5.5);
    w[i] = f;
    total += f;
  }
  for (let i = 0; i < w.length; i++) w[i] /= total;
  return w;
}

export function dominantRegionAt(x, z) {
  const w = regionWeightsAt(x, z);
  let best = 0;
  for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
  return best;
}

/** Base elevation per region (metres). */
function baseHeight(x, z, weights) {
  // rolling base terrain
  const base = fbm2(x * 0.0016, z * 0.0016, 4, 100) * 26 - 8;
  const hills = fbm2(x * 0.005, z * 0.005, 4, 41) * 9;
  const detail = fbm2(x * 0.03, z * 0.03, 3, 77) * 1.2;

  // Forest: taller, ridge-like hills
  const forest = ridgedNoise2(x * 0.0026, z * 0.0026, 4, 21) * 26 + hills * 1.4;
  // Suburbs: gentle, low
  const suburbs = base * 0.35 + hills * 0.35;
  // Industrial: flat basin with spoil embankments
  const industrial = base * 0.12 + Math.max(0, ridgedNoise2(x * 0.004, z * 0.004, 3, 8) - 0.72) * 42;
  // City: almost flat plateau
  const city = 2 + base * 0.08;
  // Military: terraced ridges
  const military = base * 0.8 + ridgedNoise2(x * 0.003, z * 0.003, 4, 51) * 16;
  // Wasteland: craters and jagged mounds
  const craterField = crater(x, z);
  const wasteland = base * 0.7 + ridgedNoise2(x * 0.0045, z * 0.0045, 5, 88) * 33 + craterField;

  const profiles = [suburbs, forest, industrial, city, military, wasteland];
  let h = 0;
  for (let i = 0; i < profiles.length; i++) h += profiles[i] * weights[i];
  return h + detail;
}

/** Craters for the Red Wasteland, radial+ellipse basins with rims. */
function crater(x, z) {
  let h = 0;
  // deterministic scatter of craters on a jittered grid
  const gx = x / 150;
  const gz = z / 150;
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const cx = (ix + dx + 0.5 + (valueNoise2(ix + dx, iz + dz, 5) - 0.5) * 0.7) * 150;
      const cz = (iz + dz + 0.5 + (valueNoise2(ix + dx, iz + dz, 9) - 0.5) * 0.7) * 150;
      const r = 34 + valueNoise2(ix + dx, iz + dz, 17) * 42;
      const d = Math.hypot(x - cx, z - cz) / r;
      if (d < 1.6) {
        const rim = Math.exp(-Math.pow((d - 0.92) * 6.5, 2)) * 5.5;
        const bowl = -smoothstep(0, 1, d) * 9;
        h += rim + bowl;
      }
    }
  }
  return h;
}

/**
 * Terrain: heights, pads and roads.
 */
export class Terrain {
  constructor() {
    this.pads = [];
    this.roads = [];
    this.chunks = [];
    this.group = new THREE.Group();
    this.group.name = 'terrain';
    this.material = null;
    this._heightCache = new Map();
  }

  /** Smooth flattened pad used under buildings. */
  addPad(x, z, w, d, y, falloff = 6) {
    this.pads.push({ x, z, w: w / 2, d: d / 2, y, falloff });
  }

  addRoad(points, width = 7, shoulder = 2.5) {
    this.roads.push({ points, width, shoulder });
  }

  /** Distance to nearest road centre line, plus the road surface height. */
  roadInfo(x, z) {
    let best = { dist: Infinity, width: 0, y: 0, t: 0, road: null };
    for (const road of this.roads) {
      const pts = road.points;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const vx = bx - ax;
        const vz = bz - az;
        const len2 = vx * vx + vz * vz;
        if (len2 < 1e-6) continue;
        let t = ((x - ax) * vx + (z - az) * vz) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = ax + vx * t;
        const pz = az + vz * t;
        const d = Math.hypot(x - px, z - pz);
        if (d < best.dist) {
          best = { dist: d, width: road.width, y: 0, t, road, ax, az, bx, bz, px, pz };
        }
      }
    }
    return best;
  }

  /** Analytic terrain height including pads and road flattening. */
  heightAt(x, z) {
    const key = `${Math.round(x * 2)}:${Math.round(z * 2)}`;
    const cached = this._heightCache.get(key);
    if (cached !== undefined) return cached;
    const w = regionWeightsAt(x, z);
    let h = baseHeight(x, z, w);

    // road flattening: blend toward the road's average elevation
    const ri = this.roadInfo(x, z);
    if (ri.dist < ri.width + 8) {
      const roadY = this.roadHeightAt(ri.road, ri.px, ri.pz);
      const t = smoothstep(ri.width * 0.9, ri.width + 8, ri.dist);
      h = lerp(roadY, h, t);
    } else if (ri.road) {
      // keep craters away from roads
    }

    for (const p of this.pads) {
      const dx = Math.max(Math.abs(x - p.x) - p.w, 0);
      const dz = Math.max(Math.abs(z - p.z) - p.d, 0);
      const d = Math.hypot(dx, dz);
      if (d < p.falloff) {
        const t = smoothstep(0, p.falloff, d);
        h = lerp(p.y, h, t);
      }
    }
    if (this._heightCache.size > 40000) this._heightCache.clear();
    this._heightCache.set(key, h);
    return h;
  }

  /** Elevation of a road at a sample point (average of neighbouring terrain). */
  roadHeightAt(road, px, pz) {
    if (road._samples) {
      let best = road._samples[0];
      let bd = Infinity;
      for (const s of road._samples) {
        const d = Math.hypot(s[0] - px, s[1] - pz);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      return best[2];
    }
    // fallback: smoothed base height
    let sum = 0;
    for (const [ox, oz] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) {
      const w = regionWeightsAt(px + ox, pz + oz);
      sum += baseHeight(px + ox, pz + oz, w);
    }
    return sum / 5;
  }

  /** Precompute smoothed road elevations before any height query. */
  prepare() {
    for (const road of this.roads) {
      const samples = [];
      for (let i = 0; i < road.points.length - 1; i++) {
        const [ax, az] = road.points[i];
        const [bx, bz] = road.points[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const steps = Math.max(1, Math.ceil(len / 20));
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const px = lerp(ax, bx, t);
          const pz = lerp(az, bz, t);
          // smooth the elevation over a wide kernel
          let sum = 0;
          let n = 0;
          for (let k = -3; k <= 3; k++) {
            for (let j = -3; j <= 3; j++) {
              const w = regionWeightsAt(px + k * 25, pz + j * 25);
              sum += baseHeight(px + k * 25, pz + j * 25, w);
              n++;
            }
          }
          samples.push([px, pz, sum / n]);
        }
      }
      if (road.points.length) {
        const [lx, lz] = road.points[road.points.length - 1];
        samples.push([lx, lz, samples.length ? samples[samples.length - 1][2] : 0]);
      }
      road._samples = samples;
    }
    this._heightCache.clear();
  }

  normalAt(x, z, eps = 1.5) {
    const hL = this.heightAt(x - eps, z);
    const hR = this.heightAt(x + eps, z);
    const hD = this.heightAt(x, z - eps);
    const hU = this.heightAt(x, z + eps);
    return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
  }

  /** Splat weights for the terrain shader: grass, dirt, rock, road. */
  splatAt(x, z, slope, roadDist, region, roadWidth = 7) {
    const n = fbm2(x * 0.012, z * 0.012, 3, 501);
    let grass = 0;
    let dirt = 0;
    let rock = 0;
    let road = 0;
    const isWasteland = region === 5;
    if (isWasteland) {
      dirt = 0.55 + n * 0.3;
      rock = 0.28;
      grass = 0.06;
    } else if (region === 1) {
      grass = 0.72 + n * 0.2;
      dirt = 0.16;
      rock = 0.06;
    } else if (region === 3) {
      // the Forgotten City: mostly broken asphalt and pavement, not bare dirt
      grass = 0.05;
      dirt = 0.14;
      rock = 0.09;
      road = 0.78;
    } else if (region === 2) {
      grass = 0.22;
      dirt = 0.4;
      rock = 0.16;
    } else if (region === 4) {
      grass = 0.42 + n * 0.18;
      dirt = 0.26;
      rock = 0.1;
    } else {
      grass = 0.5 + n * 0.2;
      dirt = 0.28;
      rock = 0.06;
    }
    // slopes are rock
    const slopeRock = smoothstep(0.32, 0.62, slope);
    rock = Math.max(rock, slopeRock * 0.85);
    grass *= 1 - slopeRock;
    dirt *= 1 - slopeRock * 0.6;
    // road carving: crisp asphalt inside the carriageway, gravel shoulder outside
    const shoulder = roadWidth + 3.2;
    if (roadDist < shoulder) {
      const t = 1 - smoothstep(roadWidth * 0.82, shoulder, roadDist);
      road += t * 2.4;
      dirt += (1 - t) * 0.15;
    }
    const total = grass + dirt + rock + road;
    return [grass / total, dirt / total, rock / total, Math.min(1, road / total)];
  }

  /** Builds the visible mesh in chunks. */
  build(textures, { chunk = 100, subdiv = 12 } = {}) {
    const half = WORLD_SIZE / 2;
    const chunksPerAxis = Math.ceil(WORLD_SIZE / chunk);
    const step = chunk / subdiv;
    const geos = [];
    const rng = makeRng(777);

    for (let cz = 0; cz < chunksPerAxis; cz++) {
      for (let cx = 0; cx < chunksPerAxis; cx++) {
        const ox = WORLD_MIN + cx * chunk;
        const oz = WORLD_MIN + cz * chunk;
        const geo = new THREE.PlaneGeometry(chunk, chunk, subdiv, subdiv);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const splat = new Float32Array(pos.count * 4);
        let maxY = -Infinity;
        let minY = Infinity;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i) + ox + chunk / 2;
          const z = pos.getZ(i) + oz + chunk / 2;
          const y = this.heightAt(x, z);
          pos.setXYZ(i, x, y, z);
          pos.setY(i, y);
          if (y > maxY) maxY = y;
          if (y < minY) minY = y;
          const n = this.normalAt(x, z, 2.0);
          const slope = 1 - n.y;
          const ri = this.roadInfo(x, z);
          const region = dominantRegionAt(x, z);
          const w = this.splatAt(x, z, slope, ri.dist, region, ri.width);
          splat[i * 4] = w[0];
          splat[i * 4 + 1] = w[1];
          splat[i * 4 + 2] = w[2];
          splat[i * 4 + 3] = w[3];
          const tint = 0.82 + fbm2(x * 0.02, z * 0.02, 2, 33) * 0.34;
          // tonal variation: wasteland reddish, forest greenish
          const rr = region === 5 ? 1.06 : 1;
          const gg = region === 5 ? 0.92 : region === 1 ? 1.04 : 1;
          colors[i * 3] = tint * rr;
          colors[i * 3 + 1] = tint * gg;
          colors[i * 3 + 2] = tint * (region === 5 ? 0.86 : 1);
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('aSplat', new THREE.BufferAttribute(splat, 4));
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        geo.translate(0, 0, 0);
        geos.push(geo);
        this.chunks.push({ geo, cx, cz, minY, maxY });
      }
    }
    this.geometryList = geos;
    this.material = makeTerrainMaterial(textures);
    const mesh = new THREE.Mesh(mergeAll(geos), this.material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.name = 'terrain';
    this.group.add(mesh);
    return this.group;
  }
}

function mergeAll(geos) {
  // simple manual merge (avoids extra import) - all geometries share layout
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const color = new Float32Array(total * 3);
  const splat = new Float32Array(total * 4);
  let vo = 0;
  const indices = [];
  for (const g of geos) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const c = g.attributes.color;
    const s = g.attributes.aSplat;
    for (let i = 0; i < p.count; i++) {
      position[(vo + i) * 3] = p.getX(i);
      position[(vo + i) * 3 + 1] = p.getY(i);
      position[(vo + i) * 3 + 2] = p.getZ(i);
      normal[(vo + i) * 3] = n.getX(i);
      normal[(vo + i) * 3 + 1] = n.getY(i);
      normal[(vo + i) * 3 + 2] = n.getZ(i);
      color[(vo + i) * 3] = c.getX(i);
      color[(vo + i) * 3 + 1] = c.getY(i);
      color[(vo + i) * 3 + 2] = c.getZ(i);
      splat[(vo + i) * 4] = s.getX(i);
      splat[(vo + i) * 4 + 1] = s.getY(i);
      splat[(vo + i) * 4 + 2] = s.getZ(i);
      splat[(vo + i) * 4 + 3] = s.getW(i);
    }
    const idx = g.index;
    for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + vo);
    vo += p.count;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setAttribute('aSplat', new THREE.BufferAttribute(splat, 4));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/** Terrain material: 4-way splat blend of procedural PBR textures. */
function makeTerrainMaterial(textures) {
  const grass = textures.setFor('grass');
  const dirt = textures.setFor('dirt');
  const rock = textures.setFor('rock');
  const road = textures.setFor('asphalt');

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.0,
    normalMap: grass.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
  });
  mat.userData.isTerrain = true;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tGrass = { value: grass.map };
    shader.uniforms.tDirt = { value: dirt.map };
    shader.uniforms.tRock = { value: rock.map };
    shader.uniforms.tRoad = { value: road.map };
    shader.uniforms.tGrassN = { value: grass.normalMap };
    shader.uniforms.tDirtN = { value: dirt.normalMap };
    shader.uniforms.tRockN = { value: rock.normalMap };
    shader.uniforms.tRoadN = { value: road.normalMap };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec4 aSplat;
        varying vec4 vSplat;
        varying vec3 vWPos;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vSplat = aSplat;
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D tGrass; uniform sampler2D tDirt; uniform sampler2D tRock; uniform sampler2D tRoad;
        uniform sampler2D tGrassN; uniform sampler2D tDirtN; uniform sampler2D tRockN; uniform sampler2D tRoadN;
        varying vec4 vSplat;
        varying vec3 vWPos;
        vec3 sampleSplatAlbedo(vec2 uv) {
          vec3 c = texture2D(tGrass, uv * 0.18).rgb * vSplat.x;
          c += texture2D(tDirt, uv * 0.13).rgb * vSplat.y;
          c += texture2D(tRock, uv * 0.11).rgb * vSplat.z;
          c += texture2D(tRoad, uv * 0.16).rgb * vSplat.w;
          // second octave: breaks up tiling at distance
          vec3 c2 = texture2D(tGrass, uv * 0.047).rgb * vSplat.x;
          c2 += texture2D(tDirt, uv * 0.039).rgb * vSplat.y;
          c2 += texture2D(tRock, uv * 0.033).rgb * vSplat.z;
          c2 += texture2D(tRoad, uv * 0.042).rgb * vSplat.w;
          return mix(c, c2, 0.35);
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `vec2 tuv = vWPos.xz;
        vec3 alb = sampleSplatAlbedo(tuv);
        vec3 macro = texture2D(tDirt, tuv * 0.014).rgb;
        float blotch = texture2D(tGrass, tuv * 0.0016).g;
        alb *= mix(vec3(1.02, 0.99, 0.94), macro * 2.1, 0.4);
        alb *= mix(0.9, 1.28, blotch);
        // fine grit so the surface reads at arm's length
        alb *= 0.88 + 0.3 * texture2D(tDirt, tuv * 0.55).g;
        diffuseColor.rgb = alb * vColor * 2.05;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;`,
      );
  };
  return mat;
}
