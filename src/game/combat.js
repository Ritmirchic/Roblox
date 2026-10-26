// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/combat.js — hitscan, melee, projectiles, damage model
// ============================================================
import * as THREE from 'three';
import { clamp, RNG } from '../core/util.js';

export class Combat {
  constructor(game) {
    this.game = game;
    this.rng = new RNG(1717);
    this.projectiles = [];
    this.hitMarkers = [];
    this.projGeo = new THREE.SphereGeometry(0.09, 8, 6);
    this.hitMarkerEl = null;
  }

  // ---- ray vs capsule (enemy) ----
  raySphere(origin, dir, center, radius) {
    const oc = center.clone().sub(origin);
    const t = oc.dot(dir);
    if (t < 0) return null;
    const d2 = oc.lengthSq() - t * t;
    if (d2 > radius * radius) return null;
    const thc = Math.sqrt(radius * radius - d2);
    return t - thc;
  }

  aimRaycast(origin, dir, maxDist = 120) {
    let best = null, bestD = maxDist;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const c = e.center;
      const d = this.raySphere(origin, dir, c, e.radius + (e.isBoss ? 1.6 : 0.55));
      if (d !== null && d < bestD) { bestD = d; best = { enemy: e, dist: d, point: origin.clone().addScaledVector(dir, d) }; }
    }
    return best;
  }

  hitscan(origin, dir, damage, opts = {}) {
    const world = this.game.world;
    const worldHit = world.colliders.raycast(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, opts.range || 120);
    const maxD = worldHit ? worldHit.dist : (opts.range || 120);
    let enemyHit = null, enemyD = maxD;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      // two spheres per body for better hit fidelity (head + chest)
      const head = e.center.clone().add(new THREE.Vector3(0, e.height * 0.38, 0));
      const chest = e.center.clone();
      const rHead = (e.isBoss ? 0.85 : 0.3) * (e.def.scale || 1);
      const rChest = (e.isBoss ? 1.5 : 0.55) * (e.def.scale || 1);
      const dh = this.raySphere(origin, dir, head, rHead);
      const dc = this.raySphere(origin, dir, chest, rChest);
      const d = dh !== null && dc !== null ? Math.min(dh, dc) : dh !== null ? dh : dc;
      if (d !== null && d > 0.2 && d < enemyD) {
        enemyD = d;
        enemyHit = { enemy: e, head: dh !== null && dh <= (dc ?? 1e9), point: origin.clone().addScaledVector(dir, d) };
      }
    }
    const endPoint = origin.clone().addScaledVector(dir, enemyHit ? enemyD : maxD);
    // tracer
    if (!opts.noTracer) {
      this.game.vfx.tracer(origin, endPoint, opts.silent ? 0x9ac8ff : 0xffd090);
    }
    if (enemyHit) {
      const e = enemyHit.enemy;
      let dmg = damage * (enemyHit.head ? (opts.crit ? 2.4 + opts.crit : 2.4) : 1);
      const dealt = e.hurt(dmg, { penetration: opts.penetration || 0, head: enemyHit.head });
      this.game.vfx.bloodBurst(enemyHit.point, dir, enemyHit.head ? 22 : 12, enemyHit.head ? 1.3 : 1);
      this.game.vfx.addDecal('blood', enemyHit.point, dir.clone().negate());
      this.game.audio.hitBody(e.pos);
      this.game.onHitEnemy(e, dealt, enemyHit.head);
      this.showHitMarker(enemyHit.head);
      return { hit: true, enemy: e, point: enemyHit.point, damage: dealt, head: enemyHit.head };
    }
    if (worldHit) {
      const c = worldHit.collider;
      const kind = c.tag === 'metal' || c.tag === 'pipe' || c.tag === 'tank' || c.tag === 'chimney' ? 'metal'
        : c.tag === 'tree' || c.tag === 'log' ? 'wood' : c.tag === 'vehicle' || c.tag === 'wagon' ? 'metal' : 'concrete';
      const n = dir.clone().negate();
      this.game.vfx.impact(worldHit.point, n, kind);
      this.game.audio.playNoise({ freq: kind === 'metal' ? 2600 : 1000, q: 2, dur: 0.12, volume: 0.18, pos: worldHit.point, maxDist: 40 });
      this.game.alertEnemiesToNoise(worldHit.point.x, worldHit.point.z, 0.4, 25);
      return { hit: true, world: true, point: worldHit.point, damage: 0 };
    }
    return { hit: false };
  }

  showHitMarker(head) {
    if (this.game.ui) this.game.ui.hitMarker(head);
  }

  meleeSwing(damage, range, critChance) {
    const p = this.game.player;
    const origin = p.eyePos;
    const fwd = p.flatForward;
    this.game.vfx.meleeArc(p.pos, p.yaw, range);
    let hitAny = false;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const to = new THREE.Vector3(e.pos.x - p.pos.x, 0, e.pos.z - p.pos.z);
      const d = to.length();
      if (d > range + e.radius + 0.4) continue;
      to.normalize();
      if (to.dot(fwd) < 0.35) continue;
      const isCrit = this.rng.chance(critChance);
      const dmg = damage * (isCrit ? 2.2 : 1);
      const dealt = e.hurt(dmg, { head: isCrit });
      const hitPoint = e.center.clone();
      this.game.vfx.bloodBurst(hitPoint, fwd, 16, 1.1);
      this.game.audio.meleeHit(e.pos, damage > 40);
      this.game.onHitEnemy(e, dealt, isCrit);
      this.showHitMarker(isCrit);
      hitAny = true;
    }
    // world feedback
    const wHit = this.game.world.colliders.raycast(origin.x, origin.y, origin.z, fwd.x, 0, fwd.z, range);
    if (wHit && !hitAny) {
      this.game.vfx.impact(wHit.point, new THREE.Vector3(-fwd.x, 0.2, -fwd.z), 'concrete');
      this.game.audio.meleeHit(wHit.point, false);
    } else if (!hitAny) {
      this.game.audio.swing();
    }
    if (hitAny) { p.addShake(0.12); this.game.hitStop = 0.045; }
    return hitAny;
  }

  spawnProjectile(from, to, opts = {}) {
    const dir = to.clone().sub(from).normalize();
    const speed = opts.speed || 25;
    const mesh = new THREE.Mesh(this.projGeo, new THREE.MeshBasicMaterial({
      color: opts.color || 0x9ad8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    mesh.scale.setScalar((opts.radius || 0.12) / 0.09);
    mesh.position.copy(from);
    this.game.scene.add(mesh);
    const light = new THREE.PointLight(opts.color || 0x9ad8ff, 2.2, 6, 2);
    light.position.copy(from);
    this.game.scene.add(light);
    this.projectiles.push({
      mesh, light, pos: from.clone(), dir, speed, life: opts.life || 4,
      damage: opts.damage || 15, owner: opts.owner || 'enemy', radius: opts.radius || 0.16,
      gravity: opts.gravity || 0, onHit: opts.onHit, trail: opts.trail !== false,
    });
    return mesh;
  }

  update(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.dir.y += p.gravity * dt;
      const step = p.speed * dt;
      const next = p.pos.clone().addScaledVector(p.dir.normalize(), step);
      let hitSomething = false;
      // world
      const wHit = this.game.world.colliders.raycast(p.pos.x, p.pos.y, p.pos.z, p.dir.x, p.dir.y, p.dir.z, step + 0.1);
      if (wHit) {
        hitSomething = { point: wHit.point, tag: wHit.collider.tag };
      }
      // player
      if (!hitSomething && p.owner === 'enemy') {
        const pl = this.game.player;
        const body = new THREE.Vector3(pl.pos.x, pl.pos.y + 1.0, pl.pos.z);
        if (next.distanceTo(body) < 0.75 || (p.pos.distanceTo(body) < 1.0)) {
          hitSomething = { point: body, player: true };
        }
      }
      // enemies (player projectiles)
      if (!hitSomething && p.owner === 'player') {
        for (const e of this.game.enemies) {
          if (e.dead) continue;
          if (next.distanceTo(e.center) < e.radius + 0.5) { hitSomething = { point: e.center.clone(), enemy: e }; break; }
        }
      }
      if (hitSomething) {
        if (hitSomething.player) {
          this.game.player.applyDamage(p.damage, { body: 'torso', bleed: 6 });
          this.game.vfx.bloodBurst(hitSomething.point, p.dir.clone().negate(), 12);
          this.game.audio.hitBody(hitSomething.point);
        } else if (hitSomething.enemy) {
          const dealt = hitSomething.enemy.hurt(p.damage, {});
          this.game.vfx.bloodBurst(hitSomething.point, p.dir, 14);
          this.game.audio.hitBody(hitSomething.point);
          this.game.onHitEnemy(hitSomething.enemy, dealt, false);
        } else {
          this.game.vfx.impact(hitSomething.point, p.dir.clone().negate(), hitSomething.tag === 'metal' ? 'metal' : 'concrete');
          this.game.vfx.spawn(hitSomething.point.clone(), {
            mat: this.game.vfx.mats.flash, geo: this.game.vfx.spriteGeo,
            vel: new THREE.Vector3(), life: 0.15, size: 0.6, gravity: 0, drag: 4,
          });
        }
        this.removeProjectile(i);
        continue;
      }
      p.pos.copy(next);
      p.mesh.position.copy(p.pos);
      p.light.position.copy(p.pos);
      // smoke trail
      if (p.trail && Math.random() < 0.55) {
        this.game.vfx.spawn(p.pos.clone(), {
          mat: this.game.vfx.mats.glow, geo: this.game.vfx.spriteGeo,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2),
          life: 0.3, size: 0.1, gravity: 0, drag: 2, grow: 0.6,
        });
      }
      if (p.life <= 0) this.removeProjectile(i);
    }
  }

  removeProjectile(i) {
    const p = this.projectiles[i];
    this.game.scene.remove(p.mesh);
    this.game.scene.remove(p.light);
    p.mesh.material.dispose();
    this.projectiles.splice(i, 1);
  }

  clear() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) this.removeProjectile(i);
  }
}
