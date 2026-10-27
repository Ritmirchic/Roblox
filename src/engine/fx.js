/**
 * VFX: pooled particle sprites, tracers, decals, muzzle flashes, explosions and
 * weather precipitation. Everything is pooled to keep frame times stable.
 */
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

function makeSpriteTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  if (kind === 'smoke' || kind === 'dust') {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  } else if (kind === 'spark') {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 20);
    g.addColorStop(0, 'rgba(255,255,230,1)');
    g.addColorStop(0.3, 'rgba(255,200,120,0.9)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  } else if (kind === 'blood') {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 24);
    g.addColorStop(0, 'rgba(150,18,18,0.95)');
    g.addColorStop(0.6, 'rgba(90,8,8,0.7)');
    g.addColorStop(1, 'rgba(50,4,4,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 24, 16, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class ParticlePool {
  constructor(scene, { max = 256, texture = null, blending = THREE.NormalBlending, size = 0.3, gravity = -4, color = 0xffffff } = {}) {
    this.max = max;
    this.particles = [];
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.sizes = new Float32Array(max);
    this.alphas = new Float32Array(max);
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: texture } , uPixelRatio: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 320.0 / max(0.5, -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vColor, tex.a * vAlpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending,
      vertexColors: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.gravity = gravity;
    this.defaultColor = new THREE.Color(color);
    this.geo = geo;
    this.cursor = 0;
    for (let i = 0; i < max; i++) {
      this.alphas[i] = 0;
      this.particles.push({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: size, drag: 0, gravity: gravity });
    }
    geo.attributes.position.needsUpdate = true;
  }

  spawn({ x, y, z, vx = 0, vy = 0, vz = 0, life = 1, size = 0.3, color = null, drag = 0.1, gravity = this.gravity, spread = 0 }) {
    const p = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % this.max;
    p.alive = true;
    p.x = x + (Math.random() - 0.5) * spread;
    p.y = y + (Math.random() - 0.5) * spread;
    p.z = z + (Math.random() - 0.5) * spread;
    p.vx = vx + (Math.random() - 0.5) * spread * 2;
    p.vy = vy + (Math.random() - 0.5) * spread * 2;
    p.vz = vz + (Math.random() - 0.5) * spread * 2;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.drag = drag;
    p.gravity = gravity;
    const c = color ? new THREE.Color(color) : this.defaultColor.clone();
    c.multiplyScalar(0.85 + Math.random() * 0.3);
    p.r = c.r;
    p.g = c.g;
    p.b = c.b;
    return p;
  }

  update(dt) {
    const pos = this.positions;
    const col = this.colors;
    const sizes = this.sizes;
    const alphas = this.alphas;
    for (let i = 0; i < this.max; i++) {
      const p = this.particles[i];
      if (!p.alive) {
        alphas[i] = 0;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        alphas[i] = 0;
        continue;
      }
      const dragF = 1 - Math.min(0.95, p.drag * dt);
      p.vx *= dragF;
      p.vz *= dragF;
      p.vy = p.vy * dragF + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const t = p.life / p.maxLife;
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      col[i * 3] = p.r;
      col[i * 3 + 1] = p.g;
      col[i * 3 + 2] = p.b;
      sizes[i] = p.size * (1 + (1 - t) * 0.6);
      alphas[i] = Math.min(1, t * 1.6);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }
}

export class FX {
  constructor(scene, textures, quality = 'high') {
    this.scene = scene;
    this.textures = textures;
    this.quality = quality;
    const smokeTex = makeSpriteTexture('smoke');
    const sparkTex = makeSpriteTexture('spark');
    const bloodTex = makeSpriteTexture('blood');
    this.groups = {
      smoke: new ParticlePool(scene, { max: 260, texture: smokeTex, size: 0.7, gravity: 0.6, color: 0x8f8b82 }),
      dust: new ParticlePool(scene, { max: 220, texture: smokeTex, size: 0.45, gravity: -0.4, color: 0x9a8b74 }),
      sparks: new ParticlePool(scene, { max: 200, texture: sparkTex, blending: THREE.AdditiveBlending, size: 0.12, gravity: -9, color: 0xffc070 }),
      blood: new ParticlePool(scene, { max: 220, texture: bloodTex, size: 0.18, gravity: -9, color: 0x8a1010 }),
      fire: new ParticlePool(scene, { max: 160, texture: sparkTex, blending: THREE.AdditiveBlending, size: 0.5, gravity: 2.4, color: 0xff7a30 }),
    };

    // tracers
    this.tracerGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 4, 1, true);
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tracers = [];
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(this.tracerGeo, this.tracerMat.clone());
      m.visible = false;
      m.frustumCulled = false;
      scene.add(m);
      this.tracers.push({ mesh: m, life: 0 });
    }

    // muzzle flash sprite
    this.flashTex = sparkTex;
    this.flashes = [];
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, color: 0xffd090, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      s.visible = false;
      s.scale.setScalar(0.55);
      scene.add(s);
      const light = new THREE.PointLight(0xffb060, 0, 9, 2);
      scene.add(light);
      this.flashes.push({ sprite: s, light, life: 0 });
    }

    // decals
    const decals = textures.decalSet();
    this.decalMats = {
      blood: new THREE.MeshBasicMaterial({ map: decals.blood, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
      hole: new THREE.MeshBasicMaterial({ map: decals.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
      scorch: new THREE.MeshBasicMaterial({ map: decals.scorch, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
    };
    this.decalGeo = new THREE.PlaneGeometry(1, 1);
    this.decals = [];
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(this.decalGeo, this.decalMats.hole);
      m.visible = false;
      m.renderOrder = 2;
      scene.add(m);
      this.decals.push({ mesh: m, life: 0 });
    }
    this.decalCursor = 0;

    // temporary explosion lights
    this.lights = [];
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffa050, 0, 24, 2);
      scene.add(l);
      this.lights.push({ light: l, life: 0, max: 0.4, power: 0 });
    }

    // rain: instanced streaks around camera
    const rainCount = quality === 'low' ? 700 : quality === 'medium' ? 1400 : 2200;
    const rainGeo = new THREE.BufferGeometry();
    const rpos = new Float32Array(rainCount * 3);
    this.rainCount = rainCount;
    for (let i = 0; i < rainCount; i++) {
      rpos[i * 3] = (Math.random() - 0.5) * 60;
      rpos[i * 3 + 1] = Math.random() * 26;
      rpos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
    this.rain = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({ color: 0xaab6c0, size: 0.055, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }),
    );
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    scene.add(this.rain);
    this.rainPositions = rpos;

    // snow / ash drift
    const ashGeo = new THREE.BufferGeometry();
    const apos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      apos[i * 3] = (Math.random() - 0.5) * 40;
      apos[i * 3 + 1] = Math.random() * 18;
      apos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    ashGeo.setAttribute('position', new THREE.BufferAttribute(apos, 3));
    this.ash = new THREE.Points(ashGeo, new THREE.PointsMaterial({ color: 0xb0a89a, size: 0.05, transparent: true, opacity: 0.35, depthWrite: false }));
    this.ash.frustumCulled = false;
    this.ash.visible = false;
    scene.add(this.ash);
    this.ashPositions = apos;
    this.t = 0;
  }

  setQuality(q) {
    this.quality = q;
    const scale = q === 'low' ? 0.4 : q === 'medium' ? 0.7 : 1;
    for (const g of Object.values(this.groups)) g.points.visible = q !== 'low';
    this.rain.visible = this.rain.visible && q !== 'low';
    this._pScale = scale;
  }

  muzzleFlash(pos, dir) {
    const f = this.flashes.find((x) => x.life <= 0) || this.flashes[0];
    f.life = 0.055;
    f.sprite.visible = true;
    f.sprite.position.copy(pos);
    f.sprite.position.addScaledVector(dir, 0.08);
    f.sprite.material.rotation = Math.random() * 6.28;
    f.sprite.scale.setScalar(0.34 + Math.random() * 0.22);
    f.light.position.copy(pos);
    f.light.intensity = 14;
    f.light.distance = 11;
    f.light.color.setHex(0xffbe78);
    // sparks + smoke at muzzle
    for (let i = 0; i < 3; i++) {
      this.groups.sparks.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: dir.x * 6 + (Math.random() - 0.5) * 2, vy: dir.y * 6 + Math.random(), vz: dir.z * 6 + (Math.random() - 0.5) * 2, life: 0.1 + Math.random() * 0.1, size: 0.07 });
    }
    this.groups.smoke.spawn({ x: pos.x + dir.x * 0.2, y: pos.y + dir.y * 0.2, z: pos.z + dir.z * 0.2, vx: dir.x * 1.2, vy: 0.35, vz: dir.z * 1.2, life: 0.7, size: 0.22, color: 0x6a6a66, drag: 1.4 });
  }

  tracer(from, to, color = 0xffd9a0) {
    const t = this.tracers.find((x) => x.life <= 0) || this.tracers[0];
    const dir = _v.subVectors(to, from);
    const len = dir.length();
    if (len < 0.05) return;
    t.mesh.visible = true;
    t.mesh.position.copy(from).addScaledVector(dir, 0.5);
    t.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    t.mesh.scale.set(1, len, 1);
    t.mesh.material.color.setHex(color);
    t.mesh.material.opacity = 0.9;
    t.life = 0.07;
  }

  impact(pos, normal, surface = 'concrete', strength = 1) {
    const n = normal || new THREE.Vector3(0, 1, 0);
    if (surface === 'flesh' || surface === 'blood') {
      for (let i = 0; i < 10; i++) {
        this.groups.blood.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 2 + (Math.random() - 0.5) * 2.4, vy: Math.random() * 2, vz: n.z * 2 + (Math.random() - 0.5) * 2.4, life: 0.4 + Math.random() * 0.5, size: 0.07 + Math.random() * 0.1 });
      }
      this.groups.smoke.spawn({ x: pos.x, y: pos.y, z: pos.z, life: 0.5, size: 0.24, color: 0x4a0c0c, drag: 2 });
      this.decal(pos, n, 'blood', 0.7 + Math.random() * 0.6);
      return;
    }
    if (surface === 'metal') {
      for (let i = 0; i < 7; i++) this.groups.sparks.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 3 + (Math.random() - 0.5) * 5, vy: n.y * 3 + Math.random() * 4, vz: n.z * 3 + (Math.random() - 0.5) * 5, life: 0.12 + Math.random() * 0.2, size: 0.06 + Math.random() * 0.06 });
      this.decal(pos, n, 'hole', 0.22);
      return;
    }
    if (surface === 'wood') {
      for (let i = 0; i < 5; i++) this.groups.dust.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 1.5, vy: n.y * 1.5 + 0.6, vz: n.z * 1.5, life: 0.4, size: 0.16, color: 0x7a5f40 });
      this.decal(pos, n, 'hole', 0.2);
      return;
    }
    if (surface === 'dirt' || surface === 'grass') {
      for (let i = 0; i < 6; i++) this.groups.dust.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 1.6 + (Math.random() - 0.5), vy: 1 + Math.random(), vz: n.z * 1.6 + (Math.random() - 0.5), life: 0.5, size: 0.2, color: 0x8a7860 });
      return;
    }
    for (let i = 0; i < 6; i++) this.groups.dust.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 1.8 + (Math.random() - 0.5) * 1.2, vy: n.y * 1.8 + 0.4, vz: n.z * 1.8 + (Math.random() - 0.5) * 1.2, life: 0.45, size: 0.14, color: 0x9a948a });
    for (let i = 0; i < 3; i++) this.groups.sparks.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: n.x * 3 + (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: n.z * 3 + (Math.random() - 0.5) * 3, life: 0.1, size: 0.05 });
    this.decal(pos, n, 'hole', 0.26);
  }

  decal(pos, normal, type = 'hole', size = 0.25, life = 30) {
    const d = this.decals[this.decalCursor];
    this.decalCursor = (this.decalCursor + 1) % this.decals.length;
    d.mesh.material = this.decalMats[type] || this.decalMats.hole;
    d.mesh.visible = true;
    d.mesh.position.copy(pos).addScaledVector(normal, 0.015);
    d.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    d.mesh.rotateZ(Math.random() * 6.28);
    d.mesh.scale.setScalar(size * (0.8 + Math.random() * 0.4));
    d.life = life;
  }

  bloodSpray(pos, dir, amount = 1) {
    for (let i = 0; i < 8 * amount; i++) {
      const spread = 0.5 + Math.random();
      this.groups.blood.spawn({
        x: pos.x, y: pos.y, z: pos.z,
        vx: dir.x * 2 + (Math.random() - 0.5) * spread * 3,
        vy: Math.random() * 2.6,
        vz: dir.z * 2 + (Math.random() - 0.5) * spread * 3,
        life: 0.4 + Math.random() * 0.6,
        size: 0.06 + Math.random() * 0.1,
      });
    }
  }

  explosion(pos, power = 1) {
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const el = Math.random() * 0.8;
      this.groups.fire.spawn({
        x: pos.x, y: pos.y + 0.2, z: pos.z,
        vx: Math.cos(a) * 3 * power * Math.random() + 0,
        vy: 2 + Math.random() * 4 * power,
        vz: Math.sin(a) * 3 * power * Math.random(),
        life: 0.35 + Math.random() * 0.5,
        size: (0.4 + Math.random() * 0.7) * power,
      });
    }
    for (let i = 0; i < 18; i++) {
      this.groups.smoke.spawn({ x: pos.x + (Math.random() - 0.5) * 1.5, y: pos.y + Math.random(), z: pos.z + (Math.random() - 0.5) * 1.5, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 1.2 + Math.random(), size: 0.9 * power, color: 0x3a3a36, drag: 0.7 });
    }
    this.decal(new THREE.Vector3(pos.x, pos.y + 0.02, pos.z), new THREE.Vector3(0, 1, 0), 'scorch', 2.2 * power, 90);
    const l = this.lights.find((x) => x.life <= 0) || this.lights[0];
    l.life = 0.45;
    l.max = 0.45;
    l.power = power;
    l.light.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
    l.light.intensity = 60 * power;
    l.light.distance = 26 * power;
  }

  breathPuff(pos, dir) {
    this.groups.smoke.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: dir.x * 0.6, vy: 0.25, vz: dir.z * 0.6, life: 1.1, size: 0.12, color: 0xb8b4ac, drag: 1.6 });
  }

  update(dt, camera, weather) {
    this.t += dt;
    for (const g of Object.values(this.groups)) g.update(dt);
    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.mesh.material.opacity = Math.max(0, t.life / 0.07) * 0.9;
        if (t.life <= 0) t.mesh.visible = false;
      }
    }
    for (const f of this.flashes) {
      if (f.life > 0) {
        f.life -= dt;
        if (f.life <= 0) {
          f.sprite.visible = false;
          f.light.intensity = 0;
        } else f.light.intensity = 14 * (f.life / 0.055);
      }
    }
    for (const d of this.decals) {
      if (d.life > 0) {
        d.life -= dt;
        if (d.life <= 0) d.mesh.visible = false;
      }
    }
    for (const l of this.lights) {
      if (l.life > 0) {
        l.life -= dt;
        l.light.intensity = Math.max(0, l.life / l.max) * 60 * l.power;
      }
    }
    // rain follows the camera
    if (weather && weather.rain > 0.02) {
      this.rain.visible = true;
      const p = this.rainPositions;
      const speed = 22 + (weather.storm || 0) * 12;
      const cam = camera.position;
      for (let i = 0; i < this.rainCount; i++) {
        p[i * 3 + 1] -= speed * dt;
        p[i * 3] += (weather.wind || 0.2) * 6 * dt;
        if (p[i * 3 + 1] < -2) {
          p[i * 3] = cam.x + (Math.random() - 0.5) * 60;
          p[i * 3 + 1] = cam.y + 12 + Math.random() * 14;
          p[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 60;
        }
        // keep the field around the camera
        if (Math.abs(p[i * 3] - cam.x) > 32) p[i * 3] = cam.x + (Math.random() - 0.5) * 60;
        if (Math.abs(p[i * 3 + 2] - cam.z) > 32) p[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 60;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      this.rain.material.opacity = 0.25 + weather.rain * 0.45;
    } else this.rain.visible = false;

    if (weather && weather.radStorm > 0.15) {
      this.ash.visible = true;
      const p = this.ashPositions;
      const cam = camera.position;
      for (let i = 0; i < 400; i++) {
        p[i * 3 + 1] -= dt * 2.2;
        p[i * 3] += Math.sin(this.t + i) * 0.4 * dt;
        if (p[i * 3 + 1] < -2) {
          p[i * 3] = cam.x + (Math.random() - 0.5) * 40;
          p[i * 3 + 1] = cam.y + 8;
          p[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 40;
        }
      }
      this.ash.geometry.attributes.position.needsUpdate = true;
    } else this.ash.visible = false;
  }
}
