// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/enemies.js — mutant bodies, animation, perception, AI
// ============================================================
import * as THREE from 'three';
import { MUTANTS, BOSSES } from './data.js';
import { mat, plain } from '../core/materials.js';
import { boxGeo, cylGeo, sphereGeo } from '../world/geo.js';
import { clamp, damp, dampAngle, lerp, smoothstep, saturate, angleDelta, RNG, dist2 } from '../core/util.js';

const STATE = { IDLE: 'idle', PATROL: 'patrol', ALERT: 'alert', CHASE: 'chase', ATTACK: 'attack', STAGGER: 'stagger', FLEE: 'flee', DEAD: 'dead', BURROW: 'burrow', EMERGE: 'emerge' };

let PART_CACHE = new Map();
function partGeo(kind, w, h, d) {
  const key = kind + w + '|' + h + '|' + d;
  if (PART_CACHE.has(key)) return PART_CACHE.get(key);
  let g;
  if (kind === 'box') g = boxGeo(w, h, d, 1.4);
  else if (kind === 'cyl') g = cylGeo(w, h, d, 8, 1.4);
  else g = sphereGeo(w, 10, 1.4);
  PART_CACHE.set(key, g);
  return g;
}

// ------------------------------------------------------------
// Body construction — articulated parts for procedural animation
// ------------------------------------------------------------
function makeLimb(parent, x, y, z, len, thick, material, side = 1) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  parent.add(pivot);
  if (len > 0) {
    const mesh = new THREE.Mesh(partGeo('cyl', thick, len, thick), material);
    mesh.position.y = -len / 2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.texName = material.userData.texName;
    pivot.add(mesh);
    // joint knob
    const joint = new THREE.Mesh(partGeo('sph', thick * 1.15, 0, 0), material);
    joint.position.y = -len;
    joint.castShadow = true;
    joint.userData.texName = material.userData.texName;
    pivot.add(joint);
  }
  return pivot;
}

export function buildMutantBody(type, opts = {}) {
  const def = MUTANTS[type] || MUTANTS.hollow;
  const skin = mat(def.skin || 'flesh', { color: opts.tint || 0xffffff });
  const dark = mat('flesh', { color: opts.darkTint || 0xb0a0a0 });
  const bone = mat('paper', { color: 0xc8c0aa });
  const eyeMat = plain(opts.eyeColor || new THREE.Color(def.eyes || '#c9d8a0').getHex(), {
    emissive: new THREE.Color(def.eyes || '#c9d8a0').getHex(), emissiveIntensity: opts.eyeGlow ?? 1.6, roughness: 0.4,
  });
  const root = new THREE.Group();
  const parts = { root, skin, eyeMat };
  const scale = def.scale || 1;
  const bones = {};
  const add = (parent, geo, m, x, y, z, rot) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.texName = m.userData.texName;
    parent.add(mesh);
    return mesh;
  };

  const build = def.build;
  if (build === 'humanoid' || build === 'tall' || build === 'bloated' || build === 'brute') {
    const tall = build === 'tall';
    const bloated = build === 'bloated';
    const brute = build === 'brute';
    const torsoH = brute ? 1.5 : bloated ? 1.4 : tall ? 1.25 : 1.1;
    const torsoW = brute ? 1.5 : bloated ? 1.45 : tall ? 0.75 : 0.72;
    const torsoD = brute ? 0.9 : bloated ? 1.2 : 0.55;
    const hipY = brute ? 1.1 : bloated ? 0.95 : 0.92;
    const legLen = brute ? 1.05 : bloated ? 0.82 : 0.92;
    const armLen = brute ? 1.15 : tall ? 1.35 : 0.85;

    // pelvis
    const pelvis = add(root, partGeo('box', torsoW * 0.85, 0.42, torsoD * 0.85), skin, 0, hipY, 0);
    // torso
    const torso = new THREE.Group();
    torso.position.set(0, hipY + 0.12, 0);
    root.add(torso);
    add(torso, partGeo('box', torsoW, torsoH, torsoD), skin, 0, torsoH / 2, 0);
    // ribcage detail
    for (let i = 0; i < 3; i++) {
      add(torso, partGeo('box', torsoW * 0.96, 0.06, torsoD * 1.02), dark, 0, torsoH * 0.35 + i * torsoH * 0.2, 0);
    }
    bones.torso = torso;
    // shoulders
    const shoulderY = torsoH * 0.88;
    const armSpan = torsoW * 0.52;
    bones.armL = makeLimb(torso, -armSpan, shoulderY, 0, armLen, brute ? 0.24 : tall ? 0.13 : 0.11, skin, -1);
    bones.armR = makeLimb(torso, armSpan, shoulderY, 0, armLen, brute ? 0.24 : tall ? 0.13 : 0.11, skin, 1);
    // hands/claws
    for (const [k, side] of [['armL', -1], ['armR', 1]]) {
      const pivot = bones[k];
      const hand = new THREE.Group();
      hand.position.y = -armLen;
      pivot.add(hand);
      for (let f = 0; f < 3; f++) {
        const claw = add(hand, partGeo('cyl', 0.035, 0.28, 0.035), bone, (f - 1) * 0.07, -0.13, 0.03, [0.2, 0, (f - 1) * 0.22]);
      }
      bones[k + 'Hand'] = hand;
    }
    // head
    const head = new THREE.Group();
    head.position.set(0, torsoH + 0.06, tall ? -0.06 : 0);
    torso.add(head);
    add(head, partGeo('sph', brute ? 0.3 : 0.19, 0, 0), skin, 0, 0.13, 0);
    // jaw
    add(head, partGeo('box', brute ? 0.34 : 0.22, 0.1, 0.22), dark, 0, 0.02, 0.06);
    // eyes (emissive)
    for (const s of [-1, 1]) {
      add(head, partGeo('sph', 0.035, 0, 0), eyeMat, s * 0.075, 0.15, 0.155);
    }
    bones.head = head;
    // legs
    const legSpan = torsoW * 0.26;
    bones.legL = makeLimb(root, -legSpan, hipY, 0, legLen, brute ? 0.2 : 0.12, skin, -1);
    bones.legR = makeLimb(root, legSpan, hipY, 0, legLen, brute ? 0.2 : 0.12, skin, 1);
    // feet
    for (const k of ['legL', 'legR']) {
      add(bones[k], partGeo('box', 0.16, 0.09, 0.3), dark, 0, -legLen, 0.07);
    }
    bones.baseY = -(hipY + legLen);
    if (brute) {
      // back plates / armor
      for (let i = 0; i < 4; i++) {
        add(torso, partGeo('box', torsoW * 0.5, 0.18, torsoD * 0.4), mat('armor'), (i % 2 ? 0.2 : -0.2), torsoH * 0.3 + i * 0.28, -torsoD * 0.45, [0.2, 0, 0]);
      }
    }
    if (bloated) {
      // distended sacs
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        add(torso, partGeo('sph', 0.26, 0, 0), mat('radiation', { emissive: 0x88ff66, emissiveIntensity: 0.8 }), Math.cos(a) * torsoW * 0.5, torsoH * (0.3 + (i % 3) * 0.18), Math.sin(a) * torsoD * 0.5);
      }
    }
    if (tall) {
      // elongated neck + extra ribs
      add(torso, partGeo('cyl', 0.09, 0.6, 0.09), skin, 0, torsoH + 0.05, 0);
      bones.head.position.y += 0.42;
      for (let i = 0; i < 5; i++) {
        add(torso, partGeo('box', 0.04, 0.5, 0.04), bone, (i - 2) * 0.09, 0.2, -torsoD * 0.55, [0.4, 0, 0]);
      }
    }
  } else if (build === 'quadruped') {
    const bodyH = 0.55, bodyL = 1.25;
    const hipY = 0.72;
    add(root, partGeo('box', 0.62, bodyH, bodyL), skin, 0, hipY, 0);
    add(root, partGeo('sph', 0.42, 0, 0), skin, 0, hipY + 0.12, -bodyL * 0.42);
    // spine ridge
    for (let i = 0; i < 5; i++) {
      add(root, partGeo('box', 0.06, 0.22, 0.08), bone, 0, hipY + bodyH * 0.55, -bodyL * 0.35 + i * 0.16, [0.3, 0, 0]);
    }
    const head = new THREE.Group();
    head.position.set(0, hipY + 0.08, bodyL * 0.5);
    root.add(head);
    add(head, partGeo('sph', 0.2, 0, 0), skin, 0, 0, 0.08, [0, 0, 0]);
    add(head, partGeo('box', 0.16, 0.12, 0.26), dark, 0, -0.04, 0.24);
    for (const s of [-1, 1]) add(head, partGeo('sph', 0.04, 0, 0), eyeMat, s * 0.08, 0.06, 0.2);
    bones.head = head;
    const legs = [[-0.28, bodyL * 0.34], [0.28, bodyL * 0.34], [-0.28, -bodyL * 0.34], [0.28, -bodyL * 0.34]];
    bones.legs = [];
    legs.forEach(([lx, lz], i) => {
      const p = new THREE.Group();
      p.position.set(lx, hipY - bodyH * 0.4, lz);
      root.add(p);
      const upper = makeLimb(p, 0, 0, 0, 0.34, 0.09, skin);
      upper.rotation.z = lx > 0 ? -0.35 : 0.35;
      add(upper, partGeo('box', 0.12, 0.08, 0.26), dark, 0, -0.36, 0.06);
      bones.legs.push(p);
    });
    bones.baseY = -(hipY);
    bones.torso = null;
  }

  root.scale.setScalar(scale);
  parts.bones = bones;
  parts.def = def;
  return parts;
}

// ------------------------------------------------------------
export class Enemy {
  constructor(game, type, x, z, opts = {}) {
    this.game = game;
    this.type = type;
    this.def = MUTANTS[type];
    this.isBoss = false;
    this.rng = new RNG(Math.floor((x * 977 + z * 131 + Math.random() * 1e6)) >>> 0);
    const y = game.world.heightAt(x, z);
    this.pos = new THREE.Vector3(x, y, z);
    this.home = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.yaw = this.rng.range(0, 6.28);
    this.hpMax = (opts.hp ?? this.def.hp) * (game.difficulty || 1);
    this.hp = this.hpMax;
    this.state = STATE.IDLE;
    this.stateTime = 0;
    this.attackCooldown = 0;
    this.target = null;
    this.lastKnown = new THREE.Vector3(x, y, z);
    this.alertTime = 0;
    this.searchTime = 0;
    this.animT = this.rng.range(0, 10);
    this.speedMul = opts.speedMul ?? 1;
    this.aggro = 0;
    this.stuckTimer = 0;
    this.lastPos = new THREE.Vector3().copy(this.pos);
    this.perceptionTimer = this.rng.range(0, 0.3);
    this.hitFlash = 0;
    this.groundY = y;
    this.dead = false;
    this.deadTime = 0;
    this.attackAnim = 0;
    this.chargeDir = null;
    this.burrowed = false;
    this.aura = 0;
    this.callTimer = 0;
    this.parts = buildMutantBody(type, opts);
    this.parts.root.position.copy(this.pos);
    game.scene.add(this.parts.root);
    this.radius = 0.42 * (this.def.scale || 1);
    this.height = (this.def.build === 'quadruped' ? 0.9 : 1.85) * (this.def.scale || 1);
    this.noise = 0;
    this.flinch = 0;
  }

  dispose() {
    this.game.scene.remove(this.parts.root);
    this.parts.root.traverse((o) => { if (o.isMesh && o.material && o.material.userData && o.material.userData.__owned) o.material.dispose(); });
  }

  get alive() { return !this.dead; }
  get center() { return new THREE.Vector3(this.pos.x, this.pos.y + this.height * 0.55, this.pos.z); }

  canSee(target, maxDist) {
    const d = this.pos.distanceTo(target.pos);
    if (d > maxDist) return false;
    const to = new THREE.Vector3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize();
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const dot = to.dot(fwd);
    const isNight = this.game.sky.isNight;
    const fovDot = isNight ? 0.4 : (this.def.build === 'quadruped' ? 0.1 : 0.35);
    if (dot < fovDot && d > 4) return false;
    // line of sight
    const from = this.center;
    const toP = new THREE.Vector3(target.pos.x, target.pos.y + 1.3, target.pos.z);
    const dir = toP.clone().sub(from);
    const len = dir.length();
    dir.normalize();
    const hit = this.game.world.colliders.raycast(from.x, from.y, from.z, dir.x, dir.y, dir.z, len);
    if (hit && hit.dist < len - 0.6) return false;
    return true;
  }

  hear(noise, x, z) {
    if (this.dead) return;
    const d = Math.hypot(x - this.pos.x, z - this.pos.z);
    const range = (this.def.hearing || 20) * noise;
    if (d < range) {
      this.lastKnown.set(x, this.pos.y, z);
      if (this.state === STATE.IDLE || this.state === STATE.PATROL) {
        this.setState(STATE.ALERT);
        this.alertTime = 0;
        this.game.audio.enemyAlert(this.type, this.pos);
      }
    }
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.stateTime = 0;
  }

  update(dt) {
    if (this.dead) { this.updateDeath(dt); return; }
    this.stateTime += dt;
    this.animT += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.flinch = Math.max(0, this.flinch - dt * 3);

    const player = this.game.player;
    const distToPlayer = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);

    // ---- perception ----
    this.perceptionTimer -= dt;
    if (this.perceptionTimer <= 0) {
      this.perceptionTimer = 0.22 + this.rng.next() * 0.16;
      const canSee = !player.dead && this.canSee(player, this.def.sight || 25);
      if (canSee) {
        const stealth = player.crouching ? 0.55 : player.sprinting ? 1.35 : 1.0;
        this.aggro += dt + 0.25 * stealth;
        this.lastKnown.copy(player.pos);
        if (this.state === STATE.IDLE || this.state === STATE.PATROL || this.state === STATE.ALERT) {
          if (this.aggro > 0.35) {
            this.setState(STATE.CHASE);
            this.game.audio.enemyAlert(this.type, this.pos);
            this.game.onEnemyAggro(this);
          }
        }
      } else {
        this.aggro = Math.max(0, this.aggro - 0.25 * dt - 0.02);
      }
      // player noise
      if (player.noise > 0.2) this.hear(player.noise, player.pos.x, player.pos.z);
    }

    switch (this.state) {
      case STATE.IDLE: this.idle(dt, distToPlayer); break;
      case STATE.PATROL: this.patrol(dt); break;
      case STATE.ALERT: this.alert(dt); break;
      case STATE.CHASE: this.chase(dt, distToPlayer); break;
      case STATE.ATTACK: this.attack(dt, distToPlayer); break;
      case STATE.STAGGER: this.stagger(dt); break;
      case STATE.FLEE: this.flee(dt); break;
      case STATE.BURROW: this.burrow(dt, distToPlayer); break;
      case STATE.EMERGE: this.emerge(dt); break;
    }

    // ---- physics ----
    this.applyMovement(dt);
    this.animate(dt);
    this.parts.root.position.copy(this.pos);
    this.parts.root.rotation.y = this.yaw;

    // aura (contaminated / boss)
    if (this.def.radioactive) {
      this.aura += dt;
      if (this.aura > 1.0) {
        this.aura = 0;
        const d = distToPlayer;
        if (d < 6) player.stats.radiation = clamp(player.stats.radiation + 3.5, 0, 100);
      }
    }
  }

  idle(dt) {
    this.vel.multiplyScalar(0.9);
    if (this.rng.chance(dt * 0.08)) {
      this.setState(STATE.PATROL);
      const a = this.rng.range(0, 6.28), r = this.rng.range(4, 14);
      this.patrolTarget = new THREE.Vector3(this.home.x + Math.cos(a) * r, this.home.y, this.home.z + Math.sin(a) * r);
    }
    // ambient idle look-around
    this.idleYaw = (this.idleYaw || 0) + dt * 0.2;
    this.yaw = dampAngle(this.yaw, this.idleYaw + Math.sin(this.animT * 0.4) * 0.6, 1.5, dt);
  }

  patrol(dt) {
    if (!this.patrolTarget) { this.setState(STATE.IDLE); return; }
    const d = Math.hypot(this.patrolTarget.x - this.pos.x, this.patrolTarget.z - this.pos.z);
    if (d < 1.2) { this.setState(STATE.IDLE); return; }
    this.moveToward(this.patrolTarget, (this.def.speed || 3) * 0.45, dt);
    if (this.stateTime > 12) this.setState(STATE.IDLE);
  }

  alert(dt) {
    this.vel.multiplyScalar(0.88);
    this.alertTime += dt;
    const to = this.lastKnown.clone().sub(this.pos);
    const targetYaw = Math.atan2(-to.x, -to.z);
    this.yaw = dampAngle(this.yaw, targetYaw, 4, dt);
    if (this.alertTime > 2.2) {
      this.setState(STATE.CHASE);
    }
    // snapshot the alerted pose
    this.lookUp = Math.sin(this.alertTime * 3) * 0.1;
  }

  chase(dt, distToPlayer) {
    const player = this.game.player;
    const sightRange = (this.def.sight || 25) * 1.6;
    // occasionally re-acquire
    if (this.stateTime % 0.5 < dt) {
      if (this.canSee(player, sightRange)) this.lastKnown.copy(player.pos);
    }
    const target = this.lastKnown;
    const attackRange = this.def.atkRange || 2;
    const d = Math.hypot(target.x - this.pos.x, target.z - this.pos.z);

    // burrower behaviour
    if (this.def.burrow && !this.burrowed && d > 6 && d < 22 && this.rng.chance(dt * 0.5)) {
      this.setState(STATE.BURROW);
      return;
    }
    if (this.def.ranged) {
      // keep distance, shoot
      const ideal = 9;
      if (d < ideal - 1.5) this.moveToward(this.pos.clone().add(this.pos.clone().sub(target).setY(this.pos.y)), this.def.speed, dt);
      else if (d > ideal + 2) this.moveToward(target, this.def.speed, dt);
      else { this.vel.multiplyScalar(0.86); this.faceTarget(target, dt); }
      if (this.attackCooldown <= 0 && d < 24 && this.hasLineOfSight(target)) {
        this.startAttack('ranged');
      }
    } else if (this.def.name === 'Brute') {
      if (d < 14 && this.attackCooldown <= 0 && this.rng.chance(dt * 0.7)) this.startAttack('charge');
      else if (d < attackRange) this.startAttack('melee');
      else this.moveToward(target, this.def.speed * this.speedMul, dt);
    } else {
      if (d < attackRange) {
        this.vel.multiplyScalar(0.8);
        this.faceTarget(target, dt);
        if (this.attackCooldown <= 0) this.startAttack('melee');
      } else {
        this.moveToward(target, this.def.speed * this.speedMul * (this.def.stealth ? 1.05 : 1), dt);
      }
    }
    // lose interest
    if (this.stateTime > 24 && d > 30) {
      this.setState(STATE.FLEE);
      this.aggro = 0;
    }
    // stalkers retreat when player looks at them
    if (this.def.stealth && d < 12 && this.game.player.forward.dot(new THREE.Vector3(this.pos.x - player.pos.x, 0, this.pos.z - player.pos.z).normalize()) > 0.85 && this.rng.chance(dt * 0.5)) {
      this.setState(STATE.FLEE);
    }
    // screamers call for help
    if (this.type === 'screamer') {
      this.callTimer -= dt;
      if (this.callTimer <= 0) {
        this.callTimer = 8;
        this.scream();
      }
    }
  }

  hasLineOfSight(target) {
    const from = this.center;
    const to = new THREE.Vector3(target.x, this.pos.y + 1.2, target.z);
    const dir = to.clone().sub(from);
    const len = dir.length();
    dir.normalize();
    const hit = this.game.world.colliders.raycast(from.x, from.y, from.z, dir.x, dir.y, dir.z, len);
    return !hit || hit.dist > len - 1.0;
  }

  scream() {
    this.game.audio.scream(this.pos);
    this.game.spawnShockwave(this.pos, 16, 0x66ffaa);
    for (const e of this.game.enemies) {
      if (e === this || e.dead) continue;
      if (Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 32) {
        e.lastKnown.copy(this.game.player.pos);
        e.setState(STATE.CHASE);
      }
    }
    this.game.onEnemyAggro(this);
  }

  faceTarget(target, dt) {
    const to = target.clone().sub(this.pos);
    const targetYaw = Math.atan2(-to.x, -to.z);
    this.yaw = dampAngle(this.yaw, targetYaw, 7, dt);
  }

  startAttack(kind) {
    this.setState(STATE.ATTACK);
    this.attackKind = kind;
    this.attackCooldown = 1 / (this.def.atkRate || 1) + 0.35;
    this.attackAnim = 0;
    this.attackHit = false;
    if (kind === 'charge') {
      this.chargeDir = this.game.player.pos.clone().sub(this.pos).setY(0).normalize();
      this.game.audio.enemyGrowl(this.type, this.pos);
    } else if (kind === 'ranged') {
      this.game.audio.enemyGrowl(this.type, this.pos);
    }
  }

  attack(dt, distToPlayer) {
    const player = this.game.player;
    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    this.faceTarget(player.pos, dt);
    this.attackAnim += dt;
    const windup = this.attackKind === 'ranged' ? 0.55 : 0.42;
    const reach = (this.def.atkRange || 2) + 0.6;

    if (this.attackKind === 'charge') {
      // fast forward lunge
      if (this.attackAnim > 0.35 && this.chargeDir) {
        this.vel.x = this.chargeDir.x * 11;
        this.vel.z = this.chargeDir.z * 11;
        if (d < reach + 0.6 && !this.attackHit) {
          this.attackHit = true;
          this.hitPlayer(this.def.dmg * 1.6, { fracture: this.rng.chance(0.25), body: 'legs' });
          player.addShake(0.4);
          this.game.audio.impactHard(this.pos);
        }
      }
      if (this.attackAnim > 0.9) { this.chargeDir = null; this.setState(STATE.CHASE); }
      return;
    }
    if (this.attackKind === 'ranged') {
      if (this.attackAnim > windup && !this.attackHit) {
        this.attackHit = true;
        this.game.spawnProjectile(this.center, player.eyePos.clone().add(new THREE.Vector3(0, -0.35, 0)), {
          speed: 26, damage: this.def.dmg, owner: 'enemy', color: 0x9ad8ff, radius: 0.16,
          onHit: () => this.game.audio.impactHard(this.pos),
        });
      }
      if (this.attackAnim > windup + 0.5) this.setState(STATE.CHASE);
      return;
    }
    // melee
    if (this.attackAnim > windup && !this.attackHit) {
      this.attackHit = true;
      if (d < reach) {
        this.hitPlayer(this.def.dmg, { bleed: this.rng.range(3, 12), body: this.rng.pick(['torso', 'arms', 'legs', 'head']) });
        if (this.type === 'contaminated') player.stats.radiation = clamp(player.stats.radiation + 6, 0, 100);
      }
    }
    if (this.attackAnim > windup + 0.55) this.setState(STATE.CHASE);
  }

  hitPlayer(dmg, opts) {
    const dealt = this.game.player.applyDamage(dmg, opts);
    this.game.audio.hitBody(this.pos);
    this.game.vfx.bloodBurst(this.game.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), this.game.player.forward.clone().negate());
    this.game.onPlayerHurt(dealt);
  }

  stagger(dt) {
    this.vel.multiplyScalar(0.82);
    if (this.stateTime > 0.5) this.setState(STATE.CHASE);
  }

  flee(dt) {
    const away = this.pos.clone().sub(this.game.player.pos).setY(0).normalize();
    this.vel.x = damp(this.vel.x, away.x * (this.def.speed || 3) * 1.1, 6, dt);
    this.vel.z = damp(this.vel.z, away.z * (this.def.speed || 3) * 1.1, 6, dt);
    if (this.stateTime > 6) {
      this.aggro = 0;
      this.setState(STATE.IDLE);
    }
  }

  burrow(dt, distToPlayer) {
    this.burrowed = true;
    this.parts.root.visible = false;
    this.vel.multiplyScalar(0.9);
    if (this.stateTime > 1.2) {
      // emerge near the player
      const a = this.rng.range(0, 6.28), r = this.rng.range(2.5, 5);
      this.pos.set(this.game.player.pos.x + Math.cos(a) * r, this.pos.y, this.game.player.pos.z + Math.sin(a) * r);
      this.pos.y = this.game.world.heightAt(this.pos.x, this.pos.z);
      this.setState(STATE.EMERGE);
      this.game.audio.enemyGrowl(this.type, this.pos);
      this.game.vfx.dustBurst(this.pos, 18);
    }
  }

  emerge(dt) {
    this.parts.root.visible = true;
    if (this.stateTime > 0.5) {
      this.burrowed = false;
      this.setState(STATE.CHASE);
    }
  }

  moveToward(target, speed, dt) {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.001) return;
    let dirX = dx / d, dirZ = dz / d;
    // obstacle whiskers
    const probe = 1.8;
    const clear = (ax, az) => {
      const px = this.pos.x + ax, pz = this.pos.z + az;
      const hit = this.game.world.colliders.raycast(this.pos.x, this.pos.y + 0.9, this.pos.z, ax, 0, az, probe);
      return !hit;
    };
    if (!clear(dirX * probe, dirZ * probe)) {
      const left = [dirX * Math.cos(0.9) - dirZ * Math.sin(0.9), dirX * Math.sin(0.9) + dirZ * Math.cos(0.9)];
      const right = [dirX * Math.cos(-0.9) - dirZ * Math.sin(-0.9), dirX * Math.sin(-0.9) + dirZ * Math.cos(-0.9)];
      if (clear(left[0] * probe, left[1] * probe)) { dirX = left[0]; dirZ = left[1]; }
      else if (clear(right[0] * probe, right[1] * probe)) { dirX = right[0]; dirZ = right[1]; }
      else { dirX = -dirX; dirZ = -dirZ; }
    }
    this.vel.x = damp(this.vel.x, dirX * speed, 7, dt);
    this.vel.z = damp(this.vel.z, dirZ * speed, 7, dt);
    const targetYaw = Math.atan2(-dirX, -dirZ);
    this.yaw = dampAngle(this.yaw, targetYaw, 6, dt);
    // stuck detection
    const moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z);
    if (moved < 0.02 * (dt * 60)) this.stuckTimer += dt; else this.stuckTimer = 0;
    if (this.stuckTimer > 1.2) {
      this.yaw += this.rng.range(1.5, 3.6);
      this.stuckTimer = 0;
      if (this.rng.chance(0.3)) this.setState(STATE.CHASE);
    }
    this.lastPos.copy(this.pos);
  }

  applyMovement(dt) {
    // horizontal collision against world
    const nx = this.pos.x + this.vel.x * dt;
    const nz = this.pos.z + this.vel.z * dt;
    const r = this.radius;
    const cols = this.game.world.colliders.query(nx - r, nz - r, nx + r, nz + r);
    let bx = nx, bz = nz;
    for (const c of cols) {
      if (c.tag === 'floor' || c.tag === 'stairs' || c.tag === 'ramp') continue;
      if (this.pos.y + 0.4 >= c.maxY || this.pos.y + this.height <= c.minY) continue;
      const cx = clamp(bx, c.minX, c.maxX), cz = clamp(bz, c.minZ, c.maxZ);
      const dx = bx - cx, dz = bz - cz;
      if (dx * dx + dz * dz < r * r) {
        const ox = (r - Math.abs(dx)) * (dx >= 0 ? 1 : -1);
        const oz = (r - Math.abs(dz)) * (dz >= 0 ? 1 : -1);
        if (Math.abs(ox) < Math.abs(oz)) bx += ox; else bz += oz;
        this.vel.x *= 0.6; this.vel.z *= 0.6;
      }
    }
    this.pos.x = clamp(bx, -690, 690);
    this.pos.z = clamp(bz, -490, 490);
    // ground
    const gy = this.game.world.heightAt(this.pos.x, this.pos.z);
    this.pos.y = gy;
    this.groundY = gy;
  }

  animate(dt) {
    const b = this.parts.bones;
    if (!b) return;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    const moving = speed > 0.35;
    const cycle = this.animT * (moving ? clamp(speed * 2.1, 3.4, 13) : 1.6);
    const amp = clamp(speed / 5, 0.08, 1);
    const isQuad = this.def.build === 'quadruped';
    const breath = Math.sin(this.animT * 1.7) * 0.02;

    if (isQuad) {
      if (b.legs) {
        b.legs.forEach((p, i) => {
          const phase = cycle + (i % 2) * Math.PI + (i > 1 ? Math.PI * 0.5 : 0);
          p.rotation.x = Math.sin(phase) * 0.75 * amp;
        });
      }
      if (b.head) {
        b.head.rotation.x = Math.sin(cycle * 2) * 0.06 * amp - 0.05;
        b.head.position.y = 0.72 + 0.08 + Math.sin(this.animT * 2.2) * 0.02;
      }
      this.parts.root.position.y = this.pos.y + Math.abs(Math.sin(cycle)) * 0.05 * amp;
    } else {
      const legSwing = 0.62 * amp;
      const armSwing = 0.5 * amp;
      if (b.legL) b.legL.rotation.x = Math.sin(cycle) * legSwing;
      if (b.legR) b.legR.rotation.x = Math.sin(cycle + Math.PI) * legSwing;
      if (b.armL) b.armL.rotation.x = Math.sin(cycle + Math.PI) * armSwing - 0.12;
      if (b.armR) b.armR.rotation.x = Math.sin(cycle) * armSwing - 0.12;
      if (b.armL) b.armL.rotation.z = -0.12 - Math.abs(Math.sin(cycle)) * 0.06;
      if (b.armR) b.armR.rotation.z = 0.12 + Math.abs(Math.sin(cycle)) * 0.06;
      if (b.torso) {
        b.torso.rotation.x = (moving ? 0.10 : 0.02) + breath;
        b.torso.rotation.z = Math.sin(cycle) * 0.045 * amp;
      }
      if (b.head) {
        b.head.rotation.x = -0.08 + Math.sin(this.animT * 1.9) * 0.05 + (this.state === STATE.CHASE ? -0.1 : 0);
        b.head.rotation.y = Math.sin(this.animT * 0.7) * 0.16;
      }
      this.parts.root.position.y = this.pos.y + Math.abs(Math.sin(cycle)) * 0.035 * amp;
    }

    // attack animation overrides
    if (this.state === STATE.ATTACK) {
      const t = clamp(this.attackAnim / 0.42, 0, 1);
      const swing = this.attackKind === 'ranged'
        ? Math.sin(t * Math.PI) * 0.25
        : t < 0.55 ? -1.5 * (t / 0.55) : -1.5 + 2.4 * ((t - 0.55) / 0.45);
      if (b.armR) b.armR.rotation.x = swing;
      if (b.armL) b.armL.rotation.x = swing * 0.6;
      if (b.torso) b.torso.rotation.y = Math.sin(t * Math.PI) * 0.35;
      if (this.attackKind === 'charge' && b.torso) b.torso.rotation.x = 0.5;
      if (this.attackKind === 'ranged') {
        if (b.armL) b.armL.rotation.x = -1.4;
        if (b.armR) b.armR.rotation.x = -1.4;
      }
    }
    // hit flinch
    if (this.flinch > 0) {
      const f = this.flinch;
      if (b.torso) b.torso.rotation.x -= f * 0.35;
      if (b.head) b.head.rotation.x -= f * 0.5;
      if (b.armL) b.armL.rotation.z -= f * 0.4;
    }
    // material flash
    if (this.hitFlash > 0) {
      const k = this.hitFlash;
      this.parts.root.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          if (!o.userData._baseEmissive) o.userData._baseEmissive = o.material.emissive.getHex();
          o.material.emissive.setRGB(k * 0.9, k * 0.2, k * 0.15);
        }
      });
    } else if (this._flashReset !== this.hitFlash) {
      // reset once
      if (this._wasFlashing) {
        this.parts.root.traverse((o) => {
          if (o.isMesh && o.material && o.material.emissive && o.userData._baseEmissive !== undefined) {
            o.material.emissive.setHex(o.userData._baseEmissive);
          }
        });
      }
    }
    this._wasFlashing = this.hitFlash > 0;
  }

  hurt(amount, opts = {}) {
    if (this.dead) return 0;
    const armor = (this.def.armor || 0) * (opts.penetration ? 1 - opts.penetration : 1);
    const dmg = Math.max(1, amount * (1 - armor));
    this.hp -= dmg;
    this.hitFlash = 1;
    this.flinch = 1;
    this.aggro = 1;
    this.lastKnown.copy(this.game.player.pos);
    if (this.state === STATE.IDLE || this.state === STATE.PATROL) this.setState(STATE.CHASE);
    // stagger chance
    if (dmg > this.hpMax * 0.14 && !this.isBoss && this.rng.chance(0.35)) {
      this.setState(STATE.STAGGER);
    }
    if (this.hp <= 0) this.die(opts);
    return dmg;
  }

  die(opts = {}) {
    if (this.dead) return;
    this.dead = true;
    this.deadTime = 0;
    this.setState(STATE.DEAD);
    this.game.onEnemyKilled(this, opts);
    this.game.audio.enemyDeath(this.type, this.pos);
    this.game.vfx.bloodBurst(this.center, this.vel.clone().normalize());
    if (this.type === 'screamer') {
      // explodes into corrosive gas
      this.game.spawnGasCloud(this.pos, 4.5, 8, 0x88ff66);
      const d = this.pos.distanceTo(this.game.player.pos);
      if (d < 5) this.game.player.applyDamage(30, { radiation: 15 });
    }
  }

  updateDeath(dt) {
    this.deadTime += dt;
    const t = clamp(this.deadTime / 1.4, 0, 1);
    const root = this.parts.root;
    if (this.def.build === 'quadruped') {
      root.rotation.z = lerp(0, Math.PI * 0.5, smoothstep(t));
      root.position.y = this.pos.y + lerp(0, -0.15, t);
    } else {
      root.rotation.x = lerp(0, -Math.PI * 0.48, smoothstep(t * 1.2));
      root.position.y = this.pos.y + lerp(0, 0.22, t);
    }
    if (this.deadTime > 22) {
      this.parts.root.position.y -= dt * 0.2;
      if (this.deadTime > 26) {
        this.game.removeEnemy(this);
      }
    }
  }
}

// ------------------------------------------------------------
// BOSS — extends Enemy with phases and telegraphed attacks
// ------------------------------------------------------------
export class Boss extends Enemy {
  constructor(game, bossId) {
    const def = BOSSES[bossId];
    const arena = game.world.arenas[def.arena];
    super(game, def.mutant, arena.x, arena.z, { hp: def.hp, eyeGlow: 2.6, tint: def.mutant === 'contaminated' ? 0xa0ff80 : 0xffffff });
    this.bossId = bossId;
    this.bossDef = def;
    this.isBoss = true;
    this.name = def.name;
    this.arena = arena;
    this.phase = 1;
    this.maxPhases = def.phases;
    this.parts.root.scale.setScalar(def.scale);
    this.radius = 0.6 * def.scale;
    this.height = 1.9 * def.scale;
    this.attackTimer = 2;
    this.specialCooldown = 4;
    this.currentAttack = null;
    this.attackPhase = 'idle';
    this.introDone = false;
    this.enraged = false;
    this.home.set(arena.x, arena.y, arena.z);
    this.arenaRadius = arena.radius || 16;
  }

  update(dt) {
    if (this.dead) { this.updateDeath(dt); return; }
    this.stateTime += dt;
    this.animT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.flinch = Math.max(0, this.flinch - dt * 3);
    const player = this.game.player;
    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);

    // intro
    if (!this.introDone) {
      if (this.stateTime > 1.6) {
        this.introDone = true;
        this.setState(STATE.CHASE);
      } else {
        this.faceTarget(player.pos, dt);
        this.vel.multiplyScalar(0.9);
        this.parts.root.position.copy(this.pos);
        this.parts.root.rotation.y = this.yaw;
        this.animate(dt);
        return;
      }
    }

    // phase transitions
    const hpFrac = this.hp / this.hpMax;
    const targetPhase = Math.min(this.maxPhases, 1 + Math.floor((1 - hpFrac) * this.maxPhases + 0.0001));
    if (targetPhase > this.phase) {
      this.phase = targetPhase;
      this.specialCooldown = 1.2;
      this.game.onBossPhase(this);
      this.game.audio.bossRoar(this.pos);
      this.game.spawnShockwave(this.pos, 12 + this.phase * 3, 0xff6030);
      this.game.vfx.dustBurst(this.pos, 40);
      this.enraged = this.phase >= this.maxPhases;
      // phase burst damages nearby
      if (d < 10 + this.phase * 2) {
        player.applyDamage(8 + this.phase * 5, { body: 'torso' });
        player.addShake(0.7);
      }
    }

    this.attackTimer -= dt;
    this.specialCooldown -= dt;

    // choose attacks
    if (this.attackPhase === 'idle') {
      if (this.specialCooldown <= 0 && this.rng.chance(dt * 0.9)) {
        this.beginSpecial();
      } else if (d < (this.def.atkRange || 3) + 1.5 && this.attackTimer <= 0) {
        this.attackKind = 'melee';
        this.attackAnim = 0;
        this.attackHit = false;
        this.attackTimer = 1.1 / (this.enraged ? 1.5 : 1);
        this.attackPhase = 'melee';
        this.game.audio.bossSwing(this.pos);
      } else if (d > 3) {
        this.moveToward(player.pos, (this.def.speed || 3) * (this.enraged ? 1.35 : 1), dt);
        this.game.keepInArena(this);
      } else {
        this.faceTarget(player.pos, dt);
      }
    } else {
      this.runAttack(dt, d);
    }

    this.applyMovement(dt);
    this.parts.root.position.copy(this.pos);
    this.parts.root.rotation.y = this.yaw;
    this.animate(dt);
    this.game.keepInArena(this);
    if (this.def.radioactive) {
      this.aura += dt;
      if (this.aura > 0.9) {
        this.aura = 0;
        if (d < 8) player.stats.radiation = clamp(player.stats.radiation + 4, 0, 100);
      }
    }
  }

  beginSpecial() {
    const list = this.bossDef.attacks;
    this.currentAttack = this.rng.pick(list);
    this.attackPhase = 'special';
    this.attackAnim = 0;
    this.specialCooldown = this.enraged ? 5 : 8 + this.rng.range(0, 3);
    this.telegraph = 0.9;
    this.game.audio.bossRoar(this.pos);
    this.game.vfx.telegraphRing(this.pos, this.arenaRadius * 0.5, 0xff5030);
  }

  runAttack(dt, dToPlayer) {
    const player = this.game.player;
    this.attackAnim += dt;
    this.faceTarget(player.pos, dt * 0.5);
    const a = this.currentAttack;
    const t = this.attackAnim;
    if (this.attackPhase === 'melee') {
      if (t > 0.35 && !this.attackHit) {
        this.attackHit = true;
        if (dToPlayer < (this.def.atkRange || 3) + 1.8) {
          this.hitPlayer((this.def.dmg || 20) * (this.enraged ? 1.4 : 1), { bleed: 12, body: 'torso' });
        }
        this.game.spawnShockwave(this.pos.clone().add(new THREE.Vector3(Math.sin(this.yaw) * -2, 0, Math.cos(this.yaw) * -2)), 3.5, 0xffa060);
      }
      if (t > 0.95) this.attackPhase = 'idle';
      return;
    }
    // special attacks
    if (t < this.telegraph) return;
    if (!this.attackHit) {
      this.attackHit = true;
      switch (a) {
        case 'sweep':
          this.game.bossSweep(this, 7);
          break;
        case 'summon':
          this.game.bossSummon(this);
          break;
        case 'scream_shock':
          this.game.spawnShockwave(this.pos, 18, 0xa0ff90);
          this.game.bossScreamShock(this);
          break;
        case 'charge':
          this.chargeDir = player.pos.clone().sub(this.pos).setY(0).normalize();
          break;
        case 'furnace_blast':
          this.game.bossProjectileFan(this, 6, 0xff6020);
          break;
        case 'debris_throw':
          this.game.bossProjectileFan(this, 3, 0x9a8a70, { speed: 18, damage: 24 });
          break;
        case 'lunge':
          this.chargeDir = player.pos.clone().sub(this.pos).setY(0).normalize();
          break;
        case 'spawn_brood':
          this.game.bossSummon(this, 'crawler', 3);
          break;
        case 'web_bind':
          this.game.bossWebBind(this);
          break;
        case 'rad_burst':
          this.game.spawnShockwave(this.pos, 12, 0x88ff44);
          if (dToPlayer < 12) { player.applyDamage(18, { radiation: 22 }); }
          break;
        case 'stomp':
          this.game.spawnShockwave(this.pos, 9, 0xffaa44);
          if (dToPlayer < 9) { player.applyDamage(22); player.addShake(0.8); }
          break;
        case 'toxic_wave':
          this.game.bossProjectileFan(this, 10, 0x88ff44, { speed: 12, damage: 16, spread: 0.5 });
          break;
        case 'slash_combo':
          this.game.bossSlashCombo(this);
          break;
        case 'phase_shift':
          this.game.bossPhaseShift(this);
          break;
        case 'order_assault':
          this.game.bossSummon(this, 'hollow', 4);
          break;
        case 'resonance_wave':
        case 'askarene':
          this.game.bossProjectileFan(this, 12, 0xa070ff, { speed: 14, damage: 18 });
          break;
        case 'echo_swarm':
          this.game.bossSummon(this, 'crawler', 5);
          break;
        case 'collapse':
          this.game.spawnShockwave(this.pos, 30, 0xff3020);
          this.game.bossCollapse(this);
          break;
      }
    }
    if (this.chargeDir) {
      this.vel.x = this.chargeDir.x * 15;
      this.vel.z = this.chargeDir.z * 15;
      if (dToPlayer < 4) {
        player.applyDamage(28 * (this.enraged ? 1.3 : 1), { fracture: this.rng.chance(0.3) });
        player.addShake(0.9);
        this.chargeDir = null;
      }
      if (t > 1.6) this.chargeDir = null;
    }
    if (t > this.telegraph + 1.2) this.attackPhase = 'idle';
  }

  hurt(amount, opts) {
    const r = super.hurt(amount * (this.isBoss ? 1 : 1), opts);
    return r;
  }
}

export { STATE };
