/**
 * Broadphase + capsule collision for the open world.
 * Static geometry is registered as axis aligned boxes / cylinders in a uniform
 * grid, dynamic bodies as spheres. The player and every AI agent move through
 * the same sweepCapsule() routine, so movement never differs between them.
 */
import * as THREE from 'three';

export class SpatialGrid {
  constructor(cell = 8) {
    this.cell = cell;
    this.cells = new Map();
  }

  key(cx, cz) {
    return cx * 73856093 ^ cz * 19349663;
  }

  insert(box) {
    const c = this.cell;
    const x0 = Math.floor((box.minX - 0.001) / c);
    const x1 = Math.floor((box.maxX + 0.001) / c);
    const z0 = Math.floor((box.minZ - 0.001) / c);
    const z1 = Math.floor((box.maxZ + 0.001) / c);
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const k = this.key(x, z);
        let arr = this.cells.get(k);
        if (!arr) {
          arr = [];
          this.cells.set(k, arr);
        }
        arr.push(box);
      }
    }
  }

  query(minX, minZ, maxX, maxZ, out = []) {
    out.length = 0;
    const c = this.cell;
    const seen = new Set();
    const x0 = Math.floor(minX / c);
    const x1 = Math.floor(maxX / c);
    const z0 = Math.floor(minZ / c);
    const z1 = Math.floor(maxZ / c);
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const arr = this.cells.get(this.key(x, z));
        if (!arr) continue;
        for (const b of arr) {
          if (seen.has(b)) continue;
          seen.add(b);
          if (b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ) continue;
          out.push(b);
        }
      }
    }
    return out;
  }
}

export class CollisionWorld {
  constructor(terrain = null) {
    this.grid = new SpatialGrid(8);
    this.boxes = [];
    this.terrain = terrain;
    this.dynamic = [];
    this.tagCounts = {};
    this._q = [];
    this._q2 = [];
  }

  // --- registration --------------------------------------------------------
  addBox(cx, cy, cz, w, h, d, rotY = 0, tag = 'world') {
    // rotated boxes: use enclosing AABB (rotY is nearly always 0 or 90deg in this world)
    let hw = w / 2;
    let hd = d / 2;
    if (Math.abs(rotY) > 0.01) {
      const c = Math.abs(Math.cos(rotY));
      const s = Math.abs(Math.sin(rotY));
      const ew = hw * c + hd * s;
      const ed = hw * s + hd * c;
      hw = ew;
      hd = ed;
    }
    const box = {
      id: this.boxes.length,
      minX: cx - hw,
      maxX: cx + hw,
      minY: cy - h / 2,
      maxY: cy + h / 2,
      minZ: cz - hd,
      maxZ: cz + hd,
      cx,
      cy,
      cz,
      tag,
      // vertical surfaces: characters stand on tops, walk into sides
      solid: true,
    };
    this.boxes.push(box);
    this.grid.insert(box);
    this.tagCounts[tag] = (this.tagCounts[tag] || 0) + 1;
    return box;
  }

  addCylinder(cx, cy, cz, r, h, tag = 'world') {
    return this.addBox(cx, cy, cz, r * 1.8, h, r * 1.8, 0, tag);
  }

  addDynamicSphere(obj) {
    this.dynamic.push(obj);
  }

  removeDynamicSphere(obj) {
    const i = this.dynamic.indexOf(obj);
    if (i >= 0) this.dynamic.splice(i, 1);
  }

  addRawBox(minX, minY, minZ, maxX, maxY, maxZ, tag = 'world') {
    return this.addBox((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2, maxX - minX, maxY - minY, maxZ - minZ, 0, tag);
  }

  /** Ground height of terrain (or 0 when no terrain system). */
  groundHeight(x, z) {
    return this.terrain ? this.terrain.heightAt(x, z) : 0;
  }

  queryNear(x, z, radius) {
    return this.grid.query(x - radius, z - radius, x + radius, z + radius, this._q);
  }

  // --- capsule resolution -------------------------------------------------
  /**
   * Resolve capsule penetration against static boxes.
   * @param {{x:number,y:number,z:number}} pos capsule bottom-center (feet)
   */
  resolveHorizontal(pos, radius, height, extra = 0) {
    const feet = pos.y;
    const head = pos.y + height;
    let hit = false;
    for (let pass = 0; pass < 3; pass++) {
      const boxes = this.grid.query(pos.x - radius - 1, pos.z - radius - 1, pos.x + radius + 1, pos.z + radius + 1, this._q2);
      let moved = false;
      for (const b of boxes) {
        if (b.maxY <= feet + 0.28 || b.minY >= head - 0.05) continue; // step over / pass under
        const r = radius + extra;
        const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq >= r * r) continue;
        const dist = Math.sqrt(distSq);
        if (dist > 1e-5) {
          const push = r - dist;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        } else {
          // center inside the box: push out along the nearest face
          const toMinX = pos.x - b.minX;
          const toMaxX = b.maxX - pos.x;
          const toMinZ = pos.z - b.minZ;
          const toMaxZ = b.maxZ - pos.z;
          const m = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);
          if (m === toMinX) pos.x = b.minX - r;
          else if (m === toMaxX) pos.x = b.maxX + r;
          else if (m === toMinZ) pos.z = b.minZ - r;
          else pos.z = b.maxZ + r;
        }
        moved = true;
        hit = true;
      }
      if (!moved) break;
    }
    // dynamic spheres (other characters)
    for (const d of this.dynamic) {
      if (d === extra?.self || !d.alive) continue;
      const dy = Math.abs((d.y ?? pos.y) - feet);
      if (dy > height) continue;
      const dx = pos.x - d.x;
      const dz = pos.z - d.z;
      const min = radius + (d.radius || 0.4);
      const dsq = dx * dx + dz * dz;
      if (dsq < min * min && dsq > 1e-6) {
        const dist = Math.sqrt(dsq);
        pos.x += (dx / dist) * (min - dist);
        pos.z += (dz / dist) * (min - dist);
        hit = true;
      }
    }
    return hit;
  }

  /** Highest walkable surface below the capsule within [y - stepUp, y + stepUp]. */
  floorAt(x, y, z, radius, stepUp = 0.5, down = 0.6) {
    // when the capsule is below the terrain surface, the player is inside a
    // basement / bunker: terrain must not be treated as a floor.
    const terrainY = this.groundHeight(x, z);
    let best = y >= terrainY - 0.35 ? terrainY : -Infinity;
    const boxes = this.grid.query(x - radius, z - radius, x + radius, z + radius, this._q2);
    for (const b of boxes) {
      if (b.maxY > y + stepUp) continue;
      if (b.maxY < y - down - stepUp) continue;
      // require the capsule center to be over the box (not just touching its side)
      if (x < b.minX - radius * 0.35 || x > b.maxX + radius * 0.35) continue;
      if (z < b.minZ - radius * 0.35 || z > b.maxZ + radius * 0.35) continue;
      if (b.maxY > best) best = b.maxY;
    }
    return best;
  }

  /** True when a capsule can stand at this position without intersecting geometry. */
  isFree(x, y, z, radius = 0.36, height = 1.8) {
    const boxes = this.grid.query(x - radius, z - radius, x + radius, z + radius, this._q2);
    for (const b of boxes) {
      if (b.maxY <= y + 0.3) continue;
      if (b.minY >= y + height) continue;
      const closestX = Math.max(b.minX, Math.min(x, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(z, b.maxZ));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) return false;
    }
    return true;
  }

  /** Ray vs statics + terrain. Returns distance or Infinity. */
  raycast(origin, dir, maxDist, { ignoreTerrain = false, step = 0.35 } = {}) {
    let best = maxDist;
    // terrain march
    if (this.terrain && !ignoreTerrain) {
      let t = 0;
      let prevAbove = origin.y - this.groundHeight(origin.x, origin.z);
      for (t = step; t < Math.min(maxDist, best); t += step) {
        const x = origin.x + dir.x * t;
        const y = origin.y + dir.y * t;
        const z = origin.z + dir.z * t;
        const above = y - this.groundHeight(x, z);
        if (above <= 0 && prevAbove > 0) {
          const f = prevAbove / (prevAbove - above);
          best = t - step + step * f;
          break;
        }
        prevAbove = above;
      }
    }
    const boxes = this.grid.query(
      Math.min(origin.x, origin.x + dir.x * maxDist) - 1,
      Math.min(origin.z, origin.z + dir.z * maxDist) - 1,
      Math.max(origin.x, origin.x + dir.x * maxDist) + 1,
      Math.max(origin.z, origin.z + dir.z * maxDist) + 1,
      this._q2,
    );
    for (const b of boxes) {
      const t = rayBox(origin, dir, b, best);
      if (t < best) best = t;
    }
    return best;
  }

  /** Standard-lambert visibility between two points. */
  visible(a, b, { ignoreTerrain = false } = {}) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const dist = dir.length();
    if (dist < 0.0001) return true;
    dir.multiplyScalar(1 / dist);
    const hit = this.raycast(a, dir, dist, { ignoreTerrain, step: 0.5 });
    return hit >= dist - 0.05;
  }

  stats() {
    return { boxes: this.boxes.length, cells: this.grid.cells.size, tags: this.tagCounts };
  }
}

/** Slab method; returns hit distance along dir or Infinity. */
export function rayBox(origin, dir, b, maxDist = Infinity) {
  let tmin = 0;
  let tmax = maxDist;
  const axes = [
    [origin.x, dir.x, b.minX, b.maxX],
    [origin.y, dir.y, b.minY, b.maxY],
    [origin.z, dir.z, b.minZ, b.maxZ],
  ];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-7) {
      if (o < lo || o > hi) return Infinity;
      continue;
    }
    const inv = 1 / d;
    let t1 = (lo - o) * inv;
    let t2 = (hi - o) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}
