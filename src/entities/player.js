/**
 * Player character: movement, camera, view model and procedural animation.
 */
import * as THREE from 'three';
import { Humanoid, PALETTES } from './humanoid.js';
import { clamp, clamp01, damp, dampAngle, lerp, smoothstep, TAU } from '../engine/util.js';

export const PLAYER_RADIUS = 0.36;
export const STAND_HEIGHT = 1.8;
export const CROUCH_HEIGHT = 1.2;

export class Player {
  constructor(game) {
    this.game = game;
    this.collision = game.collision;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.crouching = false;
    this.sprinting = false;
    this.grounded = true;
    this.groundTime = 0;
    this.height = STAND_HEIGHT;
    this.stamina = 100;
    this.staminaMax = 100;
    this.health = 100;
    this.healthMax = 100;
    this.temperature = 36.6;
    this.hunger = 78;
    this.thirst = 74;
    this.fatigue = 12;
    this.radiation = 0;
    this.infection = 0;
    this.stress = 8;
    this.bleeding = 0;
    this.pain = 0;
    this.isDead = false;
    this.faction = 'player';
    this.radius = PLAYER_RADIUS;
    this.alive = true;

    // action state
    this.aiming = false;
    this.aimBlend = 0;
    this.viewMode = 'third';
    this.camShake = 0;
    this.camShakeTime = 0;
    this.camRecoil = 0;
    this.bobTime = 0;
    this.footstepTimer = 0;
    this.lastGroundY = 0;
    this.vaultTime = 0;
    this.vaultFrom = null;
    this.vaultTo = null;
    this.interacting = null;
    this.deathTime = 0;
    this.stepDistance = 0;
    this.surface = 'dirt';
    this.noiseRadius = 0.4;
    this.moveDir = new THREE.Vector3();
    this.actualSpeed = 0;

    // camera rig
    this.camera = game.camera;
    this.cameraTarget = new THREE.Vector3();
    this.cameraPos = new THREE.Vector3();
    this.shoulderSide = 1;

    // model
    this.model = new Humanoid({ palette: PALETTES.player, scale: 1 });
    this.model.root.visible = true;
    game.scene.add(this.model.root);

    // flashlight
    this.flashlightOn = false;
    this.flashlightBattery = 100;
    this.flashlight = new THREE.SpotLight(0xfff0cf, 0, 48, 0.5, 0.6, 1.25);
    this.flashlight.castShadow = false;
    this.flashlightTarget = new THREE.Object3D();
    game.scene.add(this.flashlight);
    game.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.viewModel = null; // set by combat system
    this.footstepCallback = null;
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.model.root.position.copy(this.position);
    // teleports (spawn, load, respawn) must not glide the camera across the map
    this.cameraSnap = true;
  }

  get eyePosition() {
    return new THREE.Vector3(this.position.x, this.position.y + (this.crouching ? 1.02 : 1.56), this.position.z);
  }

  get forward() {
    return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
  }

  get flatForward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  get flatRight() {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }

  addStamina(v) {
    this.stamina = clamp(this.stamina + v, 0, this.staminaMax);
  }

  shake(amount) {
    this.camShake = Math.min(2.5, this.camShake + amount);
    this.camShakeTime = 0.28;
  }

  addRecoil(pitchKick, yawKick) {
    this.pitch = clamp(this.pitch + pitchKick, -1.45, 1.45);
    this.yaw += yawKick;
  }

  toggleView() {
    this.viewMode = this.viewMode === 'third' ? 'first' : 'third';
    this.model.root.visible = this.viewMode === 'third' || this.isDead;
    if (this.viewModel) this.viewModel.visible = this.viewMode === 'first';
    return this.viewMode;
  }

  update(dt) {
    const input = this.game.input;
    const uiBlocked = this.game.ui && this.game.ui.blocking;
    if (this.isDead) {
      this.updateDeath(dt);
      this.updateCamera(dt);
      return;
    }
    if (!uiBlocked && input.locked) {
      const look = input.lookDelta();
      this.yaw -= look.x;
      this.pitch = clamp(this.pitch - look.y, -1.42, 1.42);
      if (this.yaw > Math.PI) this.yaw -= TAU;
      if (this.yaw < -Math.PI) this.yaw += TAU;
    }

    const canMove = !uiBlocked;
    const forwardInput = (canMove && input.down('KeyW') ? 1 : 0) - (canMove && input.down('KeyS') ? 1 : 0);
    const strafeInput = (canMove && input.down('KeyD') ? 1 : 0) - (canMove && input.down('KeyA') ? 1 : 0);
    const wantsSprint = canMove && (input.down('ShiftLeft') || input.down('ShiftRight')) && forwardInput > 0.2 && !this.aiming;
    const wantsCrouch = canMove && (input.down('ControlLeft') || input.down('KeyC'));

    if (input.justPressed('KeyC') && canMove && !input.down('ControlLeft')) {
      this.crouching = !this.crouching;
    } else if (input.down('ControlLeft')) {
      this.crouching = true;
    } else if (!input.down('KeyC') && this.crouching && input.justReleased('ControlLeft')) {
      this.crouching = false;
    }
    if (wantsCrouch && !this.crouching) this.crouching = true;
    if (!wantsCrouch && this.crouching && !input.down('KeyC')) this.crouching = false;

    // stamina
    const staminaCost = wantsSprint ? 17 * dt : 0;
    if (staminaCost > 0 && this.stamina > 1) {
      this.addStamina(-staminaCost);
      this.sprintRegenDelay = 1.1;
    } else {
      this.sprintRegenDelay = Math.max(0, (this.sprintRegenDelay || 0) - dt);
      if (this.sprintRegenDelay <= 0) {
        const regen = this.crouching ? 22 : 13;
        this.addStamina(regen * dt * (this.hunger < 25 || this.thirst < 25 ? 0.55 : 1));
      }
    }
    this.sprinting = wantsSprint && this.stamina > 2;
    const winded = this.stamina < 12;

    // target speed
    const baseSpeed = this.crouching ? 1.35 : this.aiming ? 1.9 : this.sprinting ? 5.6 : 2.6;
    const speedMult = winded ? 0.62 : 1;
    const injuryMult = this.bleeding > 25 ? 0.82 : 1;
    const targetSpeed = baseSpeed * speedMult * injuryMult;

    const dir = new THREE.Vector3()
      .addScaledVector(this.flatForward, forwardInput)
      .addScaledVector(this.flatRight, strafeInput);
    if (dir.lengthSq() > 0) dir.normalize();
    this.moveDir.copy(dir);

    const accel = this.grounded ? (dir.lengthSq() > 0 ? 14 : 16) : 4.5;
    const desired = dir.multiplyScalar(targetSpeed);
    this.velocity.x = damp(this.velocity.x, desired.x, accel, dt);
    this.velocity.z = damp(this.velocity.z, desired.z, accel, dt);

    // jump / vault
    if (canMove && input.justPressed('Space') && this.grounded && !this.crouching) {
      if (!this.tryVault()) {
        this.velocity.y = 6.4;
        this.grounded = false;
        this.game.audio?.play('jump', this.position);
      }
    }
    this.velocity.y -= 22 * dt;

    // integrate
    if (this.vaultTime > 0) {
      this.updateVault(dt);
    } else {
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
      this.collision.resolveHorizontal(this.position, this.radius, this.height, 0);
      this.position.y += this.velocity.y * dt;
      this.resolveVertical(dt);
    }

    // world bounds
    this.position.x = clamp(this.position.x, -1480, 1480);
    this.position.z = clamp(this.position.z, -1480, 1480);

    // crouch height transition
    const targetHeight = this.crouching ? CROUCH_HEIGHT : STAND_HEIGHT;
    this.height = damp(this.height, targetHeight, 10, dt);

    this.actualSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    // footsteps
    if (this.grounded && this.actualSpeed > 0.4) {
      this.stepDistance += this.actualSpeed * dt;
      const stride = this.crouching ? 1.5 : this.sprinting ? 2.4 : 1.85;
      if (this.stepDistance > stride) {
        this.stepDistance = 0;
        this.surface = this.game.world?.surfaceAt(this.position) || 'dirt';
        this.game.audio?.footstep(this.surface, this.sprinting, this.crouching);
        this.noiseRadius = this.crouching ? 1.5 : this.sprinting ? 7 : 3.5;
        this.footstepCallback?.();
      }
    }

    // flashlight (toggled by Game.toggleFlashlight on KeyF)
    if (this.flashlightOn) {
      this.flashlightBattery = Math.max(0, this.flashlightBattery - dt * 0.32);
      if (this.flashlightBattery <= 0) this.flashlightOn = false;
    }
    const batteryFlicker = this.flashlightOn && this.flashlightBattery < 18 ? (Math.sin(performance.now() * 0.02) > 0.7 ? 0.35 : 1) : 1;
    this.flashlight.intensity = this.flashlightOn ? 210 * batteryFlicker : 0;
    const eye = this.eyePosition;
    if (this.viewMode === 'first' || this.aiming) {
      const f = this.forward;
      this.flashlight.position.copy(eye).addScaledVector(this.flatRight, 0.28).add(new THREE.Vector3(0, -0.12, 0)).addScaledVector(f, 0.2);
      this.flashlightTarget.position.copy(this.flashlight.position).addScaledVector(f, 30);
    } else {
      this.flashlight.position.copy(eye).addScaledVector(this.flatRight, 0.3).add(new THREE.Vector3(0, -0.1, 0)).addScaledVector(this.flatForward, 0.4);
      this.flashlightTarget.position.copy(this.flashlight.position).addScaledVector(this.flatForward, 26);
    }

    // view model follows aim
    if (this.viewModel) {
      this.viewModel.position.set(0.2, -0.2, -0.42);
      this.viewModel.visible = this.viewMode === 'first';
    }

    // model sync
    this.model.root.position.copy(this.position);
    this.model.root.rotation.y = this.yaw + Math.PI;
    this.aimBlend = damp(this.aimBlend, this.aiming ? 1 : 0, 12, dt);
    this.model.update(dt, {
      speed: this.actualSpeed,
      aim: this.aimBlend,
      crouch: this.crouching ? 1 : 0,
      look: { x: 0, y: -this.pitch * 0.5 },
    });

    this.updateCamera(dt);
  }

  updateDeath(dt) {
    this.deathTime += dt;
    this.model.setState('dead');
    this.model.update(dt, {});
    this.model.root.position.copy(this.position);
  }

  resolveVertical(dt) {
    const feet = this.position;
    const floor = this.collision.floorAt(feet.x, feet.y, feet.z, this.radius, 0.55, 0.7);
    if (feet.y <= floor + 0.02) {
      if (!this.grounded && this.velocity.y < -6) {
        this.game.audio?.play('land', this.position);
        this.shake(Math.min(0.5, -this.velocity.y * 0.035));
        if (this.velocity.y < -13) this.game.survival?.fallDamage(-this.velocity.y);
      }
      feet.y = floor;
      this.velocity.y = 0;
      this.grounded = true;
      this.groundTime += dt;
    } else {
      this.grounded = false;
      this.groundTime = 0;
      // head bump
      const headY = feet.y + this.height;
      const boxes = this.collision.grid.query(feet.x - this.radius, feet.z - this.radius, feet.x + this.radius, feet.z + this.radius, this.collision._q);
      for (const b of boxes) {
        if (b.minY > feet.y && b.minY < headY && feet.x > b.minX - this.radius && feet.x < b.maxX + this.radius && feet.z > b.minZ - this.radius && feet.z < b.maxZ + this.radius) {
          if (this.velocity.y > 0) this.velocity.y = -0.2;
        }
      }
    }
  }

  tryVault() {
    if (this.crouching) return false;
    const fwd = this.flatForward;
    const origin = new THREE.Vector3(this.position.x, this.position.y + 0.55, this.position.z);
    // find a low obstacle ahead
    const probe = new THREE.Vector3().copy(origin).addScaledVector(fwd, 1.05);
    const boxes = this.collision.grid.query(probe.x - 0.5, probe.z - 0.5, probe.x + 0.5, probe.z + 0.5, this.collision._q);
    let vaultTop = -Infinity;
    for (const b of boxes) {
      if (b.maxY > this.position.y + 1.35) continue;
      if (b.maxY < this.position.y + 0.35) continue;
      if (probe.x < b.minX - 0.35 || probe.x > b.maxX + 0.35) continue;
      if (probe.z < b.minZ - 0.35 || probe.z > b.maxZ + 0.35) continue;
      vaultTop = Math.max(vaultTop, b.maxY);
    }
    if (vaultTop === -Infinity) return false;
    const landing = new THREE.Vector3(this.position.x, vaultTop + 0.02, this.position.z).addScaledVector(fwd, 1.6);
    if (!this.collision.isFree(landing.x, landing.y + 0.1, landing.z, this.radius * 0.9, 1.5)) return false;
    this.vaultFrom = this.position.clone();
    this.vaultTo = landing;
    this.vaultTime = 0.001;
    this.vaultDuration = 0.42;
    this.game.audio?.play('vault', this.position);
    return true;
  }

  updateVault(dt) {
    this.vaultTime = Math.min(this.vaultDuration, this.vaultTime + dt);
    const t = this.vaultTime / this.vaultDuration;
    const ease = t * t * (3 - 2 * t);
    this.position.lerpVectors(this.vaultFrom, this.vaultTo, ease);
    this.position.y = lerp(this.vaultFrom.y, this.vaultTo.y, ease) + Math.sin(t * Math.PI) * 0.42;
    this.velocity.y = 0;
    this.velocity.x = 0;
    this.velocity.z = 0;
    if (t >= 1) {
      this.vaultTime = 0;
      this.grounded = true;
      this.game.audio?.play('land', this.position);
    }
  }

  /** True when there is a ceiling/roof close above the player's head. */
  underRoof() {
    const p = this.position;
    const boxes = this.collision.grid.query(p.x - 0.5, p.z - 0.5, p.x + 0.5, p.z + 0.5, this._roofScratch || (this._roofScratch = []));
    for (const b of boxes) {
      if (b.tag !== 'ceiling' && b.tag !== 'roof') continue;
      if (b.minY > p.y + 1.3 && b.minY < p.y + 4.2) return true;
    }
    return false;
  }

  updateCamera(dt) {
    const cam = this.camera;
    const headY = this.position.y + (this.crouching ? 1.0 : 1.56);
    this.cameraTarget.set(this.position.x, headY, this.position.z);
    const f = this.forward;
    const right = this.flatRight;

    this.camShake = Math.max(0, this.camShake - dt * 3.4);
    this.camShakeTime += dt;
    const shakeAmt = this.camShake * 0.02 * (1 + this.stress / 200);

    // Tight interiors: a roofed space hides the third-person camera behind walls,
    // so the camera drops to the head and the model is hidden automatically.
    const roofed = this.underRoof();
    let desiredPos;
    let fov = this.game.settings?.fov || 78;
    if (this.viewMode === 'first' || roofed) {
      desiredPos = new THREE.Vector3(this.position.x, headY + 0.04, this.position.z);
      this.model.root.visible = false;
      if (this.aiming && roofed) fov = lerp(fov, this.game.combat?.currentAdsFov ?? 55, this.aimBlend);
      fov = this.aiming ? lerp(fov, this.game.combat?.currentAdsFov ?? 55, this.aimBlend) : fov;
    } else {
      if (!this.cameraCramped) this.model.root.visible = true;
      const dist = lerp(3.15, 1.85, this.aimBlend);
      const side = lerp(0.62, 0.78, this.aimBlend) * this.shoulderSide;
      const up = lerp(0.28, 0.1, this.aimBlend);
      // camera collision: cast from head toward desired camera spot
      const dirToCam = new THREE.Vector3()
        .addScaledVector(f, -dist)
        .addScaledVector(right, side)
        .add(new THREE.Vector3(0, up, 0));
      const len = dirToCam.length();
      const dirN = dirToCam.clone().normalize();
      const hit = this.collision.raycast(new THREE.Vector3(this.position.x, headY, this.position.z), dirN, len + 0.35, { step: 0.3 });
      const safeLen = Math.max(0.45, Math.min(len, hit - 0.32));
      // in tight interiors the shoulder camera would end up inside the head,
      // so drop the character model instead of clipping through it
      this.cameraCramped = safeLen < 1.25;
      this.model.root.visible = !this.cameraCramped;
      desiredPos = new THREE.Vector3(this.position.x, headY, this.position.z).addScaledVector(dirN, safeLen);
      fov = this.aiming ? lerp(fov, this.game.combat?.currentAdsFov ?? 55, this.aimBlend) : fov;
      if (this.sprinting) fov += 5;
    }
    // smooth camera position (faster when aiming). After a teleport, or if the
    // camera somehow ends up far from the player, snap instead of flying in.
    const lambda = this.viewMode === 'first' ? 26 : lerp(11, 22, this.aimBlend);
    if (this.cameraSnap || this.cameraPos.distanceTo(desiredPos) > 12) {
      this.cameraPos.copy(desiredPos);
      this.cameraSnap = false;
    } else {
      this.cameraPos.lerp(desiredPos, 1 - Math.exp(-lambda * dt));
    }

    // shake
    const t = performance.now() * 0.001;
    const sx = Math.sin(t * 47.3) * shakeAmt + Math.sin(t * 19.7) * shakeAmt * 0.6;
    const sy = Math.cos(t * 39.1) * shakeAmt + Math.sin(t * 27.3) * shakeAmt * 0.5;

    // head bob in first person
    let bobY = 0;
    let bobRoll = 0;
    if (this.viewMode === 'first' && this.game.settings?.headBob !== false) {
      this.bobTime += dt * (this.actualSpeed * 1.7);
      const amt = clamp01(this.actualSpeed / 5.6) * 0.032;
      bobY = Math.sin(this.bobTime * 2) * amt;
      bobRoll = Math.sin(this.bobTime) * amt * 0.9;
    }

    cam.position.copy(this.cameraPos);
    cam.position.y += bobY;
    cam.rotation.set(0, 0, 0);
    // apply pitch then yaw (YXZ order)
    cam.rotation.order = 'YXZ';
    cam.rotation.y = this.yaw;
    cam.rotation.x = this.pitch + sy * 0.6 + this.camRecoil * 0.06;
    cam.rotation.z = sx * 0.4 + bobRoll;
    this.camRecoil = Math.max(0, this.camRecoil - dt * 8);

    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = damp(cam.fov, fov, 12, dt);
      cam.updateProjectionMatrix();
    }
    if (this.game.postfx) {
      const lowHealth = clamp01((35 - this.health) / 35);
      this.game.postfx.vignetteBoost = lowHealth;
    }
  }

  /** Apply damage with body-part multipliers. */
  hit(amount, part = 'torso', source = null) {
    if (this.isDead) return;
    const mult = { head: 2.4, torso: 1.0, arm: 0.62, leg: 0.75 }[part] || 1;
    const dmg = amount * mult;
    this.health = Math.max(0, this.health - dmg);
    this.pain = Math.min(100, this.pain + dmg * 0.9);
    this.bleeding = Math.min(100, this.bleeding + (part === 'head' || part === 'torso' ? dmg * 0.22 : dmg * 0.12));
    this.shake(clamp(dmg * 0.03, 0.1, 0.9));
    this.game.postfx.damage = Math.min(1, this.game.postfx.damage + dmg * 0.02);
    this.game.audio?.play('hitFlesh', this.position);
    this.game.hud?.flashDamage();
    if (this.health <= 0) this.die();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.alive = false;
    this.deathTime = 0;
    this.model.setState('dead');
    this.game.onPlayerDeath?.();
  }

  heal(amount) {
    this.health = Math.min(this.healthMax, this.health + amount);
  }
}
