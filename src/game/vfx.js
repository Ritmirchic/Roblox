// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/vfx.js — particles, decals, tracers, shockwaves, screens
// ============================================================
import * as THREE from 'three';
import { mat, plain } from '../core/materials.js';
import { clamp, RNG } from '../core/util.js';

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.rng = new RNG(4242);
    this.pools = {};
    this.particles = [];
    this.decals = [];
    this.rings = [];
    this.tracers = [];
    this.lights = [];
    this.maxParticles = 900;

    this.spriteGeo = new THREE.PlaneGeometry(1, 1);
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.sphereGeo = new THREE.SphereGeometry(1, 8, 6);

    // materials
    this.mats = {
      blood: new THREE.MeshBasicMaterial({ color: 0x8a1010, transparent: true, opacity: 0.95, depthWrite: false }),
      bloodDark: new THREE.MeshBasicMaterial({ color: 0x4a0808, transparent: true, opacity: 0.9, depthWrite: false }),
      spark: new THREE.MeshBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
      smoke: new THREE.MeshBasicMaterial({ color: 0x6a6a66, transparent: true, opacity: 0.4, depthWrite: false }),
      dust: new THREE.MeshBasicMaterial({ color: 0x9a8f7c, transparent: true, opacity: 0.5, depthWrite: false }),
      flash: new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
      glow: new THREE.MeshBasicMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
      tracers: new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
      ring: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    };
    this.decalMats = {
      blood: mat('blood', { transparent: true, depthWrite: false, polygonOffset: true, alphaTest: 0.1 }),
      bullet: mat('bullet', { transparent: true, depthWrite: false, polygonOffset: true, alphaTest: 0.1 }),
    };
    this.decalQueue = [];
  }

  spawn(pos, opts) {
    if (this.particles.length > this.maxParticles) {
      // recycle oldest
      const p = this.particles.shift();
      this.scene.remove(p.mesh);
    }
    const mesh = new THREE.Mesh(opts.geo || this.boxGeo, opts.mat || this.mats.dust);
    mesh.position.copy(pos);
    mesh.scale.setScalar(opts.size || 0.1);
    if (opts.geo === this.spriteGeo) mesh.lookAt(pos.clone().add(new THREE.Vector3(0, 1, 1)));
    this.scene.add(mesh);
    const p = {
      mesh,
      vel: opts.vel ? opts.vel.clone() : new THREE.Vector3(),
      life: opts.life || 0.6,
      maxLife: opts.life || 0.6,
      gravity: opts.gravity ?? -9.8,
      drag: opts.drag ?? 1.5,
      grow: opts.grow ?? 0,
      fade: opts.fade !== false,
      spin: opts.spin || 0,
      baseOpacity: opts.mat ? opts.mat.opacity : 1,
      additive: !!opts.additive,
    };
    // clone material so we can fade per-particle
    p.mesh.material = p.mesh.material.clone();
    p.mesh.material.transparent = true;
    this.particles.push(p);
    return p;
  }

  bloodBurst(pos, dir, count = 14, scale = 1) {
    const d = dir ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const v = d.clone().multiplyScalar(this.rng.range(1.2, 4.5) * scale)
        .add(new THREE.Vector3(this.rng.range(-1, 1), this.rng.range(-0.3, 1.4), this.rng.range(-1, 1)).multiplyScalar(2.2 * scale));
      this.spawn(pos.clone().add(new THREE.Vector3(this.rng.range(-0.1, 0.1), this.rng.range(-0.1, 0.1), this.rng.range(-0.1, 0.1))), {
        mat: this.rng.chance(0.5) ? this.mats.blood : this.mats.bloodDark,
        vel: v, life: this.rng.range(0.35, 0.9), size: this.rng.range(0.035, 0.11) * scale, gravity: -11, drag: 1.2,
      });
    }
    // mist
    for (let i = 0; i < 4; i++) {
      this.spawn(pos.clone(), {
        mat: this.mats.bloodDark, geo: this.spriteGeo,
        vel: d.clone().multiplyScalar(this.rng.range(0.4, 1.6)).add(new THREE.Vector3(this.rng.range(-0.4, 0.4), this.rng.range(-0.2, 0.4), this.rng.range(-0.4, 0.4))),
        life: 0.5, size: this.rng.range(0.25, 0.5) * scale, gravity: -1.5, grow: 1.4,
      });
    }
  }

  dustBurst(pos, count = 16, scale = 1) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, 6.28), r = this.rng.range(0.5, 3);
      this.spawn(pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.1, Math.sin(a) * 0.3)), {
        mat: this.mats.dust, geo: this.spriteGeo,
        vel: new THREE.Vector3(Math.cos(a) * r, this.rng.range(0.4, 2.2), Math.sin(a) * r),
        life: this.rng.range(0.7, 1.6), size: this.rng.range(0.3, 0.9) * scale, gravity: -0.6, drag: 2.2, grow: 1.8,
      });
    }
  }

  impact(pos, normal, kind = 'concrete') {
    const n = normal || new THREE.Vector3(0, 1, 0);
    const colors = { concrete: 0xb0a89a, metal: 0xffd48a, wood: 0x9a7a50, dirt: 0x8a7a60, flesh: 0x8a1010 };
    for (let i = 0; i < 7; i++) {
      const v = n.clone().multiplyScalar(this.rng.range(1, 4))
        .add(new THREE.Vector3(this.rng.range(-1, 1), this.rng.range(-1, 1), this.rng.range(-1, 1)));
      this.spawn(pos.clone(), {
        mat: kind === 'metal' ? this.mats.spark : this.mats.dust,
        geo: kind === 'metal' ? this.boxGeo : this.spriteGeo,
        vel: v, life: this.rng.range(0.2, 0.6), size: this.rng.range(0.03, 0.09), gravity: -8, drag: 1.0,
      });
    }
    // dust puff
    for (let i = 0; i < 3; i++) {
      this.spawn(pos.clone().addScaledVector(n, 0.05), {
        mat: this.mats.dust, geo: this.spriteGeo,
        vel: n.clone().multiplyScalar(this.rng.range(0.3, 1.0)).add(new THREE.Vector3(this.rng.range(-0.4, 0.4), 0.2, this.rng.range(-0.4, 0.4))),
        life: 0.7, size: this.rng.range(0.15, 0.4), gravity: 0.2, drag: 2.4, grow: 1.5,
      });
    }
    if (kind !== 'flesh' && this.rng.chance(0.6)) this.addDecal('bullet', pos, n);
  }

  muzzleFlash(pos, dir) {
    const light = new THREE.PointLight(0xffc070, 5, 9, 2);
    light.position.copy(pos);
    this.scene.add(light);
    this.lights.push({ light, life: 0.06, maxLife: 0.06 });
    for (let i = 0; i < 5; i++) {
      this.spawn(pos.clone(), {
        mat: this.mats.flash, geo: this.spriteGeo,
        vel: dir.clone().multiplyScalar(this.rng.range(4, 12)).add(new THREE.Vector3(this.rng.range(-0.6, 0.6), this.rng.range(-0.6, 0.6), this.rng.range(-0.6, 0.6))),
        life: 0.07, size: this.rng.range(0.1, 0.3), gravity: 0, drag: 6,
      });
    }
    for (let i = 0; i < 2; i++) {
      this.spawn(pos.clone(), {
        mat: this.mats.smoke, geo: this.spriteGeo,
        vel: dir.clone().multiplyScalar(this.rng.range(0.6, 1.6)), life: 0.6, size: 0.12, gravity: 0.4, drag: 2.5, grow: 1.6,
      });
    }
  }

  tracer(from, to, color = 0xffe0a0) {
    const geo = new THREE.CylinderGeometry(0.012, 0.012, 1, 3, 1, true);
    const mesh = new THREE.Mesh(geo, this.mats.tracers.clone());
    mesh.material.color.setHex(color);
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < 0.01) return;
    mesh.position.copy(from.clone().addScaledVector(dir, 0.5));
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.material.opacity = 0.8;
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: 0.055, maxLife: 0.055 });
  }

  meleeArc(pos, yaw, reach, color = 0xff8060) {
    const geo = new THREE.RingGeometry(reach * 0.35, reach, 12, 1, -0.6, 1.2);
    const mesh = new THREE.Mesh(geo, this.mats.ring.clone());
    mesh.material.color.setHex(color);
    mesh.material.opacity = 0.5;
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = yaw;
    mesh.position.set(pos.x, pos.y + 1.0, pos.z);
    this.scene.add(mesh);
    this.rings.push({ mesh, life: 0.18, maxLife: 0.18, grow: 2.0 });
  }

  spawnShockwave(pos, radius, color = 0xffffff) {
    const geo = new THREE.RingGeometry(radius * 0.15, radius * 0.22, 32);
    const mesh = new THREE.Mesh(geo, this.mats.ring.clone());
    mesh.material.color.setHex(color);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.12, pos.z);
    this.scene.add(mesh);
    this.rings.push({ mesh, life: 0.55, maxLife: 0.55, grow: 5.0 });
    this.dustBurst(pos, 10, 1.4);
  }

  telegraphRing(pos, radius, color = 0xff5030) {
    const geo = new THREE.RingGeometry(radius * 0.92, radius, 40);
    const mesh = new THREE.Mesh(geo, this.mats.ring.clone());
    mesh.material.color.setHex(color);
    mesh.material.opacity = 0.45;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.08, pos.z);
    this.scene.add(mesh);
    this.rings.push({ mesh, life: 0.9, maxLife: 0.9, grow: 0.4, pulse: true });
  }

  gasCloud(pos, radius, life = 6, color = 0x88ff66) {
    for (let i = 0; i < 22; i++) {
      const a = this.rng.range(0, 6.28), r = this.rng.range(0, radius);
      this.spawn(pos.clone().add(new THREE.Vector3(Math.cos(a) * r, this.rng.range(0, 1.2), Math.sin(a) * r)), {
        mat: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false }),
        geo: this.spriteGeo,
        vel: new THREE.Vector3(this.rng.range(-0.2, 0.2), this.rng.range(0.05, 0.3), this.rng.range(-0.2, 0.2)),
        life: life * this.rng.range(0.6, 1.1), size: this.rng.range(0.6, 1.6), gravity: 0.02, drag: 0.4, grow: 1.1,
      });
    }
  }

  addDecal(kind, pos, normal) {
    if (this.decals.length > 160) {
      const d = this.decals.shift();
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
    }
    const geo = new THREE.PlaneGeometry(0.16, 0.16);
    const mesh = new THREE.Mesh(geo, this.decalMats[kind]);
    const n = normal.clone().normalize();
    mesh.position.copy(pos).addScaledVector(n, 0.012);
    mesh.lookAt(pos.clone().add(n));
    mesh.rotateZ(this.rng.range(0, 6.28));
    if (kind === 'blood') mesh.scale.setScalar(this.rng.range(0.8, 2.2));
    mesh.renderOrder = 1;
    this.scene.add(mesh);
    this.decals.push({ mesh, life: 60 });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity * dt;
      const drag = Math.max(0, 1 - p.drag * dt);
      p.vel.multiplyScalar(drag);
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.spin) p.mesh.rotation.z += p.spin * dt;
      const t = p.life / p.maxLife;
      if (p.grow) p.mesh.scale.multiplyScalar(1 + p.grow * dt);
      if (p.fade) p.mesh.material.opacity = t * p.baseOpacity;
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      t.mesh.material.opacity = Math.max(0, t.life / t.maxLife) * 0.85;
      if (t.life <= 0) { this.scene.remove(t.mesh); t.mesh.geometry.dispose(); this.tracers.splice(i, 1); }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const k = 1 - r.life / r.maxLife;
      r.mesh.scale.setScalar(1 + k * r.grow);
      r.mesh.material.opacity = (1 - k) * (r.pulse ? 0.6 + Math.sin(k * 30) * 0.3 : 0.7);
      if (r.life <= 0) { this.scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); this.rings.splice(i, 1); }
    }
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.life -= dt;
      l.light.intensity = Math.max(0, l.life / l.maxLife) * 5;
      if (l.life <= 0) { this.scene.remove(l.light); this.lights.splice(i, 1); }
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life -= dt;
      if (d.life < 4) d.mesh.material.opacity = 0.7;
      if (d.life <= 0) { this.scene.remove(d.mesh); d.mesh.geometry.dispose(); this.decals.splice(i, 1); }
    }
  }
}
