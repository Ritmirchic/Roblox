// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/player.js — player controller, camera rig, flashlight
// ============================================================
import * as THREE from 'three';
import { CFG, ITEMS, WEAPONS } from './data.js';
import { clamp, damp, dampAngle, lerp, saturate, angleDelta } from '../core/util.js';

export class Player {
  constructor(world, opts = {}) {
    this.world = world;
    this.cfg = CFG.player;
    this.pos = new THREE.Vector3().copy(world.startPosition);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.bodyYaw = 0;
    this.height = this.cfg.height;
    this.crouching = false;
    this.sprinting = false;
    this.grounded = true;
    this.aiming = false;
    this.cameraMode = 0; // 0 third person, 1 first person
    this.camDist = 3.6;
    this.camDistTarget = 3.6;
    this.camPos = new THREE.Vector3();
    this.camHeight = 1.55;
    this.bob = 0;
    this.bobPhase = 0;
    this.sens = 1.0;
    this.fov = 72;
    this.shake = 0;
    this.shakeSeed = Math.random() * 100;
    this.stamina = 100;
    this.staminaMax = 100;
    this.stats = {
      health: 100, healthMax: 100, hunger: 100, thirst: 100, temp: 60, radiation: 0,
      infection: 0, bleed: 0, stress: 0, fatigue: 0, stamina: 100, staminaMax: 100,
      fractures: { head: false, torso: false, arms: false, legs: false },
    };
    this.footstepTimer = 0;
    this.lastSurface = 'grass';
    this.noise = 0;
    this.flashlightOn = true;
    this.flashlightBattery = 100;
    this.moving = false;
    this.speed = 0;
    this.landTimer = 0;
    this.notify = () => {};
    this.skills = {};
    this.sprintDrain = 1;
    this.damageMul = 1;
    this.armorValue = 0;
    this.armorRadRes = 0;
    this._tmp = new THREE.Vector3();
    this._colliderHit = [];
    this.dead = false;
  }

  // shorthand used by npcs / events / doors
  get position() { return this.pos; }
  get velocity() { return this.vel; }

  get eyePos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + this.camHeight - (this.crouching ? 0.25 : 0), this.pos.z);
  }
  get forward() {
    return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
  }
  get flatForward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  get flatRight() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }

  input(keys, mouse, game) {
    // mouse look
    if (mouse.dx || mouse.dy) {
      const sens = 0.0022 * this.sens * (this.aiming ? 0.65 : 1);
      this.yaw -= mouse.dx * sens;
      this.pitch -= mouse.dy * sens;
      this.pitch = clamp(this.pitch, -1.45, 1.35);
    }
    const fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const strafe = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    this.wish = new THREE.Vector2(strafe, fwd);
    this.wantSprint = !!keys.ShiftLeft && fwd > 0 && !this.aiming;
    this.wantCrouch = !!keys.KeyC || !!keys.ControlLeft;
  }

  update(dt, keys, game) {
    if (this.dead) return;
    const cfg = this.cfg;
    const terrain = this.world.terrain;

    // ---- stamina ----
    this.sprintDrain = 1 + (this.skills?.sprint || 0);
    if (this.sprinting && this.grounded && this.stamina > 0) {
      this.stamina -= cfg.staminaDrain * dt * this.sprintDrain;
      if (this.stamina <= 0) { this.stamina = 0; this.sprinting = false; }
      this.staminaDelay = 1.0;
    } else {
      this.staminaDelay = Math.max(0, (this.staminaDelay || 0) - dt);
      if (this.staminaDelay <= 0) this.stamina = Math.min(this.staminaMax, this.stamina + cfg.staminaRegen * dt * (this.crouching ? 1.5 : 1));
    }
    this.stats.stamina = this.stamina;

    // ---- crouch ----
    const targetHeight = this.crouching ? cfg.crouchHeight : cfg.height;
    this.height = damp(this.height, targetHeight, 12, dt);
    this.camHeight = damp(this.camHeight, this.crouching ? cfg.eyeHeight - 0.42 : cfg.eyeHeight, 12, dt);

    // ---- desired velocity ----
    const wish = this.wish || new THREE.Vector2();
    const wishLen = wish.length();
    let speed = cfg.walkSpeed;
    if (this.crouching) speed = cfg.crouchSpeed;
    else if (this.sprinting) speed = cfg.sprintSpeed;
    if (this.aiming) speed = cfg.adsSpeed;
    if (this.stats.bleed > 30) speed *= 0.85;
    if (this.stats.fractures.legs) speed *= 0.62;
    if (this.stats.fatigue > 60) speed *= 0.9;
    if (this.stats.health < 25) speed *= 0.88;
    if (this.waterDepth > 0.9) speed *= 0.62;

    const wantSprint = this.wantSprint && wishLen > 0 && this.stamina > 2 && !this.crouching;
    this.sprinting = wantSprint;

    const target = new THREE.Vector3();
    if (wishLen > 0) {
      const f = this.flatForward.multiplyScalar(wish.y);
      const r = this.flatRight.multiplyScalar(wish.x);
      target.copy(f).add(r).normalize().multiplyScalar(speed);
    }

    // accelerate horizontally
    const accel = this.grounded ? cfg.accel : cfg.airAccel;
    this.vel.x = damp(this.vel.x, target.x, accel, dt);
    this.vel.z = damp(this.vel.z, target.z, accel, dt);

    // ---- gravity / swimming ----
    const waterY = this.getWaterLevel();
    this.waterDepth = waterY !== null ? waterY - this.pos.y : 0;
    if (this.waterDepth > 1.2) {
      // floating
      this.vel.y = damp(this.vel.y, (waterY - 1.15 - this.pos.y) * 3.2, 6, dt);
      this.grounded = false;
    } else {
      this.vel.y += cfg.gravity * dt;
      if (this.waterDepth > 0.2) this.vel.y *= 0.86;
    }
    // jump
    if ((keys.Space || keys.KeySpace) && this.grounded && this.stamina > 8) {
      this.vel.y = cfg.jumpVel;
      this.grounded = false;
      this.stamina -= 8;
      this.staminaDelay = 0.8;
      this.jumpPressed = false;
    }

    // ---- integrate with collision ----
    this.moveWithCollision(dt);

    // ---- ground snap ----
    const groundY = this.groundHeightAt(this.pos.x, this.pos.z);
    if (this.pos.y <= groundY + 0.02) {
      if (!this.grounded && this.vel.y < -6) this.landTimer = 0.18;
      this.pos.y = groundY;
      this.vel.y = 0;
      this.grounded = true;
    } else if (this.pos.y < groundY) {
      this.pos.y = groundY; this.grounded = true; this.vel.y = 0;
    } else {
      this.grounded = false;
    }
    // step up small ledges
    this.stepUp();

    // ---- camera ----
    this.updateCamera(dt, game);

    // ---- movement state/audio ----
    const horiz = Math.hypot(this.vel.x, this.vel.z);
    this.speed = horiz;
    this.moving = horiz > 0.4;
    this.noise = this.sprinting ? 1.0 : this.crouching ? 0.12 : this.moving ? 0.45 : 0.05;
    if (this.grounded && this.moving) {
      this.footstepTimer -= dt * (this.sprinting ? 1.55 : this.crouching ? 0.6 : 1.0);
      if (this.footstepTimer <= 0) {
        this.footstepTimer = 0.46;
        this.lastSurface = this.world.surfaceAt(this.pos.x, this.pos.z);
        if (game && game.audio) game.audio.footstep(this.lastSurface, this.sprinting ? 1 : 0.6);
      }
      this.bobPhase += dt * (this.sprinting ? 13 : 8.5);
    }
    this.landTimer = Math.max(0, this.landTimer - dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    if (this.flashlightOn) this.flashlightBattery = Math.max(0, this.flashlightBattery - dt * 0.11);
  }

  getWaterLevel() {
    const t = this.world.terrain;
    if (Math.hypot(this.pos.x - t.lake.x, this.pos.z - t.lake.z) < t.lake.r * 1.05) return t.lake.level;
    if (t.riverDist(this.pos.x, this.pos.z) < 14) return -3.1;
    return null;
  }

  groundHeightAt(x, z) {
    const terrain = this.world.heightAt(x, z);
    // Under the terrain surface (shelter, tunnel, stair shaft) the heightfield
    // must not push the capsule up through the ceiling: stand on floor colliders.
    const underground = this.pos.y < terrain - 0.8;
    const colliders = this.world.colliders.query(x - 0.35, z - 0.35, x + 0.35, z + 0.35, this._floorCols || (this._floorCols = []));
    let bestFloor = null;
    for (const c of colliders) {
      if (c.tag !== 'floor' && c.tag !== 'stairs' && c.tag !== 'ramp') continue;
      if (c.maxY > this.pos.y + 0.45) continue;
      if (bestFloor === null || c.maxY > bestFloor) bestFloor = c.maxY;
    }
    if (underground) return bestFloor !== null ? bestFloor : this.pos.y;
    if (bestFloor !== null && bestFloor > terrain + 0.02 && bestFloor < this.pos.y + 0.45) return bestFloor;
    return terrain;
  }

  // capsule vs box colliders, resolved axis by axis
  moveWithCollision(dt) {
    const r = this.cfg.radius;
    const feetY = this.pos.y;
    const headY = this.pos.y + this.height;
    const colliders = this.world.colliders.query(this.pos.x - r - 2, this.pos.z - r - 2, this.pos.x + r + 2, this.pos.z + r + 2);

    const tryAxis = (dx, dy, dz) => {
      let nx = this.pos.x + dx, ny = this.pos.y + dy, nz = this.pos.z + dz;
      // vertical
      if (dy !== 0) {
        for (const c of colliders) {
          if (nx + r <= c.minX || nx - r >= c.maxX || nz + r <= c.minZ || nz - r >= c.maxZ) continue;
          if (dy > 0) {
            if (headY + dy > c.minY && feetY < c.maxY) { ny = Math.min(ny, c.minY - this.height - 0.001); this.vel.y = 0; }
          } else {
            if (feetY + dy < c.maxY && headY > c.minY) { ny = Math.max(ny, c.maxY + 0.001); this.vel.y = 0; this.grounded = true; }
          }
        }
        this.pos.y = ny;
        return true;
      }
      // horizontal
      let blocked = false;
      for (const c of colliders) {
        if (c.tag === 'floor' || c.tag === 'stairs' || c.tag === 'ramp') continue;
        if (feetY + 0.35 >= c.maxY || headY - 0.15 <= c.minY) continue;
        const cx = clamp(nx, c.minX, c.maxX), cz = clamp(nz, c.minZ, c.maxZ);
        const dx2 = nx - cx, dz2 = nz - cz;
        if (dx2 * dx2 + dz2 * dz2 < r * r) {
          // push out along the shallowest axis
          const ox = (r - Math.abs(dx2)) * (dx2 >= 0 ? 1 : -1);
          const oz = (r - Math.abs(dz2)) * (dz2 >= 0 ? 1 : -1);
          if (Math.abs(ox) < Math.abs(oz)) nx += ox; else nz += oz;
          blocked = true;
        }
      }
      this.pos.x = nx;
      this.pos.z = nz;
      return !blocked;
    };

    // substep for stability at high velocity
    const steps = Math.max(1, Math.ceil((Math.abs(this.vel.x) + Math.abs(this.vel.z) + Math.abs(this.vel.y)) * dt / 0.28));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      tryAxis(0, this.vel.y * sdt, 0);
      tryAxis(this.vel.x * sdt, 0, 0);
      tryAxis(0, 0, this.vel.z * sdt);
    }
    // world bounds
    this.pos.x = clamp(this.pos.x, -690, 690);
    this.pos.z = clamp(this.pos.z, -490, 490);
  }

  stepUp() {
    if (!this.grounded) return;
    const r = this.cfg.radius;
    const colliders = this.world.colliders.query(this.pos.x - r, this.pos.z - r, this.pos.x + r, this.pos.z + r);
    for (const c of colliders) {
      if (!['floor', 'stairs', 'ramp', 'prop', 'debris'].includes(c.tag)) continue;
      if (c.maxY > this.pos.y + 0.02 && c.maxY < this.pos.y + 0.62) {
        const cx = clamp(this.pos.x, c.minX, c.maxX), cz = clamp(this.pos.z, c.minZ, c.maxZ);
        const d = Math.hypot(this.pos.x - cx, this.pos.z - cz);
        if (d < r * 0.95) this.pos.y = c.maxY + 0.01;
      }
    }
  }

  updateCamera(dt, game) {
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + this.camHeight, this.pos.z);
    // bob
    const bobAmt = (this.moving && this.grounded ? (this.sprinting ? 1.3 : 0.8) : 0) * (this.aiming ? 0.25 : 1);
    const bobY = Math.sin(this.bobPhase * 2) * 0.022 * bobAmt;
    const bobX = Math.cos(this.bobPhase) * 0.026 * bobAmt;
    eye.y += bobY + (this.landTimer > 0 ? -0.06 * (this.landTimer / 0.18) : 0);

    this.aiming = !!(game && game.input.mouse.right);
    const targetFov = this.aiming ? this.fov - 14 : (this.sprinting ? this.fov + 5 : this.fov);
    if (game && game.camera) game.camera.fov = damp(game.camera.fov, targetFov, 8, dt);

    const dir = this.forward;
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    if (this.cameraMode === 1) {
      // first person
      const p = eye.clone().addScaledVector(right, bobX);
      this.camPos.copy(p);
      if (game && game.camera) {
        game.camera.position.copy(p);
        game.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobPhase) * 0.004 * bobAmt, 'YXZ');
      }
      this.camDist = 0;
    } else {
      // third person over-the-shoulder
      const shoulder = 0.62;
      const pivot = eye.clone().addScaledVector(right, shoulder * (this.aiming ? 1.0 : 0.8));
      const dist = this.aiming ? 1.5 : 3.4;
      this.camDistTarget = dist;
      this.camDist = damp(this.camDist, this.camDistTarget, 9, dt);
      const desired = pivot.clone().addScaledVector(dir, -this.camDist).addScaledVector(right, bobX * 0.5);
      desired.y += bobY * 0.5;
      // camera collision via raycast against colliders
      const toCam = desired.clone().sub(pivot);
      const len = toCam.length();
      if (len > 0.01) {
        toCam.normalize();
        const hit = this.world.colliders.raycast(pivot.x, pivot.y, pivot.z, toCam.x, toCam.y, toCam.z, len + 0.4);
        if (hit && hit.dist < len) {
          desired.copy(pivot).addScaledVector(toCam, Math.max(0.35, hit.dist - 0.35));
        }
      }
      // ground clamp (skipped underground, where the heightfield is the ceiling)
      const gh = this.world.heightAt(desired.x, desired.z) + 0.4;
      if (desired.y < gh && gh - desired.y < 3) desired.y = gh;
      if (!this._camSmooth) this._camSmooth = desired.clone();
      this._camSmooth.lerp(desired, 1 - Math.exp(-dt * 22));
      if (game && game.camera) {
        game.camera.position.copy(this._camSmooth);
        const lookAt = pivot.clone().addScaledVector(dir, 14);
        game.camera.lookAt(lookAt);
        game.camera.rotateZ(Math.sin(this.bobPhase) * 0.008 * bobAmt);
      }
    }
    // shake
    if (game && game.camera && this.shake > 0.001) {
      const s = this.shake * this.shake;
      game.camera.position.x += (Math.sin(this.shakeSeed + game.time * 61) * 0.06) * s;
      game.camera.position.y += (Math.cos(this.shakeSeed + game.time * 47) * 0.06) * s;
      game.camera.rotateZ(Math.sin(this.shakeSeed + game.time * 39) * 0.02 * s);
    }
  }

  addShake(amount, audio) {
    this.shake = Math.min(1.4, this.shake + amount);
  }

  // ---------------- survival ----------------
  updateSurvival(dt, env) {
    const s = this.stats;
    const S = CFG.survival;
    const skill = this.skills || {};
    const consumeMul = skill.consumeRate || 1;
    const temp = env?.temperature ?? 12;
    const inside = this.world.isIndoor(this.pos.x, this.pos.y + 1, this.pos.z);

    // hunger & thirst
    s.hunger = clamp(s.hunger - S.hungerRate * consumeMul * dt * (this.sprinting ? 1.35 : 1), 0, 100);
    s.thirst = clamp(s.thirst - S.thirstRate * consumeMul * dt * (this.sprinting ? 1.5 : 1), 0, 100);

    // temperature
    const target = inside ? lerp(temp, 18, 0.8) : temp;
    const coldMul = (skill.resistEnv ? (1 - skill.resistEnv) : 1);
    s.temp = damp(s.temp, target, 0.12 * (inside ? 2.5 : 1), dt);
    this.cold = s.temp < 22;

    // radiation (from hazards + region)
    const region = this.world.regionAt(this.pos.x, this.pos.z);
    let radRate = 0;
    for (const h of this.world.hazards) {
      if (h.type !== 'radiation') continue;
      const d = Math.hypot(this.pos.x - h.x, this.pos.z - h.z);
      if (d < h.r) radRate += (1 - d / h.r) * 0.9;
    }
    if (region.id === 'wasteland') radRate += 0.015;
    const radRes = 1 - (this.armorRadRes || 0);
    s.radiation = clamp(s.radiation + radRate * radRes * coldMul * dt, 0, 100);

    // bleeding / infection
    if (s.bleed > 0) {
      s.bleed = clamp(s.bleed - dt * 0.35, 0, 100);
      s.health = clamp(s.health - s.bleed * 0.0016 * dt * (skill.bleedResist ? 1 - skill.bleedResist : 1), 0, s.healthMax);
    }
    s.infection = clamp(s.infection + S.infectRate * (s.bleed > 20 ? 3 : 1) * dt, 0, 100);

    // stress: darkness, being hurt, isolation
    let stressRate = -0.4;
    if (region.danger >= 4) stressRate += 0.25;
    if (!this.flashlightOn && env?.night) stressRate += 0.5;
    if (s.health < 35) stressRate += 0.6;
    if (env?.nearbyEnemies) stressRate += env.nearbyEnemies * 0.35;
    s.stress = clamp(s.stress + stressRate * dt, 0, 100);

    // damage from untreated conditions
    let dmg = 0;
    if (s.hunger <= 0) dmg += S.hungerDmg * dt;
    if (s.thirst <= 0) dmg += S.thirstDmg * dt;
    if (s.temp < 12) dmg += S.coldDmg * dt * (1 - s.temp / 12);
    if (s.radiation > 65) dmg += S.radDmg * dt * ((s.radiation - 65) / 35);
    if (s.infection > 75) dmg += 0.05 * dt;
    if (dmg > 0) s.health = clamp(s.health - dmg, 0, s.healthMax);
    if (s.stress > 92) { s.health = clamp(s.health - 0.02 * dt, 0, s.healthMax); }

    // stamina max: fatigue
    this.staminaMax = s.staminaMax * (1 - s.fatigue / 260);
    if (s.stamina > this.staminaMax) this.stamina = this.staminaMax;
  }

  applyDamage(amount, opts = {}) {
    if (this.dead) return;
    const armor = (this.armorValue || 0) * (1 - (opts.penetration || 0));
    let dmg = Math.max(1, amount - armor * (opts.body === 'torso' ? 1 : 0.6));
    this.stats.health = clamp(this.stats.health - dmg, 0, this.stats.healthMax);
    this.addShake(clamp(dmg / 45, 0.05, 0.9));
    if (opts.bleed) this.stats.bleed = clamp(this.stats.bleed + opts.bleed, 0, 100);
    if (opts.infection) this.stats.infection = clamp(this.stats.infection + opts.infection, 0, 100);
    if (opts.radiation) this.stats.radiation = clamp(this.stats.radiation + opts.radiation, 0, 100);
    if (opts.fracture) this.stats.fractures[opts.body || 'legs'] = true;
    if (this.stats.health <= 0) this.dead = true;
    return dmg;
  }

  heal(amount) {
    this.stats.health = clamp(this.stats.health + amount, 0, this.stats.healthMax);
  }

  respawn(pos) {
    this.dead = false;
    this.stats.health = this.stats.healthMax * 0.6;
    this.stats.bleed = 0;
    this.pos.copy(pos);
    this.vel.set(0, 0, 0);
  }
}
