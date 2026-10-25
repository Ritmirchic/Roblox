/**
 * Visual effects system: GPU-friendly particle pools, beams, explosions, shield impacts,
 * engine plumes and environmental particles. Everything is pooled so sustained combat and
 * mining never allocate during the frame.
 */
import * as THREE from 'three';
import { glowSprite, sparkSprite } from './textures.ts';
import { RNG } from '../core/rng.ts';

interface Particle {
  life: number;
  maxLife: number;
  vel: THREE.Vector3;
  drag: number;
  size: number;
  startSize: number;
  color: THREE.Color;
  gravityTo?: THREE.Vector3;
}

/** A pooled additive particle system backed by a single THREE.Points object. */
export class ParticlePool {
  points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private particles: Particle[] = [];
  private cursor = 0;
  readonly capacity: number;

  constructor(capacity: number, texture: THREE.Texture, blending: THREE.Blending = THREE.AdditiveBlending) {
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 1,
      map: texture,
      transparent: true,
      blending,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    });
    // Per-particle size via onBeforeCompile (PointsMaterial has a single uniform size).
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = 'attribute float size;\n' + shader.vertexShader.replace(
        'gl_PointSize = size;',
        'gl_PointSize = size;',
      ).replace('uniform float size;', 'uniform float sizeUnused;');
      shader.vertexShader = shader.vertexShader.replace('gl_PointSize = sizeUnused;', 'gl_PointSize = size;');
    };
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < capacity; i++) {
      this.particles.push({ life: 0, maxLife: 1, vel: new THREE.Vector3(), drag: 0.98, size: 0, startSize: 0, color: new THREE.Color() });
      this.sizes[i] = 0;
    }
  }

  spawn(pos: THREE.Vector3, vel: THREE.Vector3, color: THREE.Color | number, size: number, life: number, drag = 0.96): void {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.capacity;
    const p = this.particles[i];
    p.life = life;
    p.maxLife = life;
    p.vel.copy(vel);
    p.drag = drag;
    p.size = size;
    p.startSize = size;
    p.color.set(color as any);
    this.positions[i * 3] = pos.x;
    this.positions[i * 3 + 1] = pos.y;
    this.positions[i * 3 + 2] = pos.z;
    this.colors[i * 3] = p.color.r;
    this.colors[i * 3 + 1] = p.color.g;
    this.colors[i * 3 + 2] = p.color.b;
    this.sizes[i] = size;
  }

  update(dt: number): void {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i];
      if (p.life <= 0) {
        if (this.sizes[i] !== 0) this.sizes[i] = 0;
        continue;
      }
      p.life -= dt;
      const t = Math.max(0, p.life / p.maxLife);
      p.vel.multiplyScalar(Math.pow(p.drag, dt * 60));
      this.positions[i * 3] += p.vel.x * dt;
      this.positions[i * 3 + 1] += p.vel.y * dt;
      this.positions[i * 3 + 2] += p.vel.z * dt;
      this.sizes[i] = p.startSize * (0.25 + t * 0.75);
      const fade = t * t;
      this.colors[i * 3] = p.color.r * fade;
      this.colors[i * 3 + 1] = p.color.g * fade;
      this.colors[i * 3 + 2] = p.color.b * fade;
      if (p.life <= 0) this.sizes[i] = 0;
    }
    const geo = this.points.geometry;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }
}

export class FXSystem {
  scene: THREE.Scene;
  sparks: ParticlePool;
  smoke: ParticlePool;
  embers: ParticlePool;
  dust: ParticlePool;
  private beams: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
  private flashes: { light: THREE.PointLight; life: number; maxLife: number; intensity: number }[] = [];
  private shockwaves: { mesh: THREE.Mesh; life: number; maxLife: number; scale: number }[] = [];
  private rng = new RNG(99);

  constructor(scene: THREE.Scene, quality: 'low' | 'medium' | 'high' = 'high') {
    this.scene = scene;
    const scale = quality === 'low' ? 0.4 : quality === 'medium' ? 0.7 : 1;
    this.sparks = new ParticlePool(Math.floor(2200 * scale), sparkSprite(0xffd166));
    this.smoke = new ParticlePool(Math.floor(900 * scale), glowSprite(0x8899aa), THREE.NormalBlending);
    this.embers = new ParticlePool(Math.floor(1600 * scale), glowSprite(0xff8a3c));
    this.dust = new ParticlePool(Math.floor(1200 * scale), glowSprite(0x9fd4ff));
    scene.add(this.sparks.points, this.smoke.points, this.embers.points, this.dust.points);
  }

  update(dt: number): void {
    this.sparks.update(dt);
    this.smoke.update(dt);
    this.embers.update(dt);
    this.dust.update(dt);

    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      const t = Math.max(0, b.life / b.maxLife);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = t;
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        (b.mesh.material as THREE.Material).dispose();
        this.beams.splice(i, 1);
      }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= dt;
      const t = Math.max(0, f.life / f.maxLife);
      f.light.intensity = f.intensity * t * t;
      if (f.life <= 0) {
        this.scene.remove(f.light);
        this.flashes.splice(i, 1);
      }
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      const t = 1 - Math.max(0, s.life / s.maxLife);
      s.mesh.scale.setScalar(1 + t * s.scale);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.75;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  /** Mining / laser beam rendered as a stretched additive cylinder. */
  beam(from: THREE.Vector3, to: THREE.Vector3, color: number, radius = 0.35, life = 0.08): void {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    if (len < 0.01) return;
    const geo = new THREE.CylinderGeometry(radius * 0.5, radius, len, 8, 1, true);
    geo.translate(0, -len / 2, 0);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
    this.scene.add(mesh);
    this.beams.push({ mesh, life, maxLife: life });
  }

  impact(pos: THREE.Vector3, color: number, amount = 14, speed = 24): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < amount; i++) {
      const v = new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).normalize().multiplyScalar(speed * this.rng.range(0.3, 1.2));
      this.sparks.spawn(pos, v, c, this.rng.range(0.9, 2.1), this.rng.range(0.25, 0.65), 0.9);
    }
    this.flash(pos, color, 24, 0.14);
  }

  explosion(pos: THREE.Vector3, size = 1, color = 0xff8a3c): void {
    const c = new THREE.Color(color);
    const n = Math.floor(28 * size);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).normalize().multiplyScalar(this.rng.range(6, 40) * size);
      this.embers.spawn(pos, v, c, this.rng.range(1.5, 4.5) * size, this.rng.range(0.4, 1.3), 0.93);
    }
    for (let i = 0; i < Math.floor(14 * size); i++) {
      const v = new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).normalize().multiplyScalar(this.rng.range(2, 12) * size);
      this.smoke.spawn(pos, v, new THREE.Color(0x3a3f4a), this.rng.range(4, 9) * size, this.rng.range(0.9, 2.0), 0.9);
    }
    this.flash(pos, color, 120 * size, 0.5);
    this.shockwave(pos, color, 10 * size);
  }

  shockwave(pos: THREE.Vector3, color: number, scale = 10): void {
    const geo = new THREE.SphereGeometry(1, 20, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, wireframe: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, life: 0.5, maxLife: 0.5, scale });
  }

  flash(pos: THREE.Vector3, color: number, intensity = 40, life = 0.2): void {
    const light = new THREE.PointLight(color, intensity, 160, 2);
    light.position.copy(pos);
    this.scene.add(light);
    this.flashes.push({ light, life, maxLife: life, intensity });
  }

  shieldHit(pos: THREE.Vector3, normal: THREE.Vector3, color = 0x49b6ff): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < 16; i++) {
      const v = normal.clone().multiplyScalar(this.rng.range(4, 18))
        .add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(6));
      this.sparks.spawn(pos, v, c, this.rng.range(0.8, 1.8), this.rng.range(0.2, 0.5), 0.88);
    }
    this.flash(pos, color, 30, 0.18);
  }

  /** Ore pickup sparkle. */
  pickup(pos: THREE.Vector3, color: number): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < 10; i++) {
      const v = new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(6);
      this.dust.spawn(pos, v, c, this.rng.range(0.6, 1.4), this.rng.range(0.3, 0.7), 0.9);
    }
  }

  thrusterPuff(pos: THREE.Vector3, dir: THREE.Vector3, color: number, power: number): void {
    if (power <= 0.02) return;
    const c = new THREE.Color(color);
    const v = dir.clone().multiplyScalar(26 * power).add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(1.6));
    this.embers.spawn(pos, v, c, this.rng.range(0.8, 2.0) * (0.5 + power), this.rng.range(0.12, 0.3), 0.9);
  }

  ambientDust(center: THREE.Vector3, radius: number, color: number, count = 2): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const p = new THREE.Vector3(
        center.x + this.rng.range(-radius, radius),
        center.y + this.rng.range(-radius, radius),
        center.z + this.rng.range(-radius, radius),
      );
      this.dust.spawn(p, new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(0.6), c, this.rng.range(0.4, 1.6), this.rng.range(2, 5), 0.995);
    }
  }

  /** Electrical arc used by the Plasma Storm hazard. */
  lightning(from: THREE.Vector3, to: THREE.Vector3, color = 0x9fe8ff): void {
    const segments = 8;
    let prev = from.clone();
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const point = from.clone().lerp(to, t);
      if (i < segments) {
        point.add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(from.distanceTo(to) * 0.06));
      }
      this.beam(prev, point, color, 0.22, 0.14);
      prev = point;
    }
    this.flash(to, color, 60, 0.25);
  }
}

/** Engine plume attached to a thruster nozzle: cone mesh + light, scaled by throttle. */
export class ThrusterPlume {
  group = new THREE.Group();
  private cone: THREE.Mesh;
  private inner: THREE.Mesh;
  private light: THREE.PointLight;
  private baseLength: number;

  constructor(color: number, size = 1) {
    this.baseLength = 5 * size;
    const geo = new THREE.ConeGeometry(0.7 * size, this.baseLength, 12, 1, true);
    geo.translate(0, -this.baseLength / 2, 0);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.cone = new THREE.Mesh(geo, mat);
    const innerGeo = new THREE.ConeGeometry(0.34 * size, this.baseLength * 0.65, 10, 1, true);
    innerGeo.translate(0, -this.baseLength * 0.325, 0);
    innerGeo.rotateX(Math.PI / 2);
    this.inner = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.light = new THREE.PointLight(color, 0, 40, 2);
    this.group.add(this.cone, this.inner, this.light);
  }

  setThrottle(t: number, dt: number): void {
    const target = Math.max(0, Math.min(1.4, t));
    const flicker = 0.88 + Math.sin(performance.now() * 0.03) * 0.12;
    const s = target * flicker;
    this.cone.scale.set(0.6 + s * 0.6, 0.6 + s * 0.6, Math.max(0.001, s * 1.3));
    this.inner.scale.set(0.6 + s * 0.4, 0.6 + s * 0.4, Math.max(0.001, s * 1.1));
    (this.cone.material as THREE.MeshBasicMaterial).opacity = 0.5 * Math.min(1, target);
    (this.inner.material as THREE.MeshBasicMaterial).opacity = 0.85 * Math.min(1, target);
    this.light.intensity = target * 18;
    void dt;
  }
}
