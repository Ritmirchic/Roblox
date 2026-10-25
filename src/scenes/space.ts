/**
 * Expedition scene: physics flight, asteroid mining, resource collection and space combat.
 *
 * The ship is simulated as one rigid body whose mass, inertia and centre of mass come from
 * the player's actual construction. Engines apply force at their real mount points (so the
 * layout changes handling), weapons fire from their real muzzles, magnets pull real chunks.
 */
import * as THREE from 'three';
import { buildAsteroid, buildOreChunk, buildWreck } from '../render/asteroids.ts';
import { buildEnemy } from '../render/enemies.ts';
import { CELL_SIZE, buildModuleMesh, placeModuleObject } from '../render/modules3d.ts';
import { FXSystem, ThrusterPlume } from '../render/fx.ts';
import { spaceBackground } from '../render/textures.ts';
import { ENEMIES, RESOURCES, type EnemyDef, type SectorDef } from '../data/sectors.ts';
import { getModule, scaledStat } from '../data/modules.ts';
import type { GameState } from '../sim/gamestate.ts';
import { additive, mult } from '../sim/crewsim.ts';
import { audio } from '../core/audio.ts';
import type { Input } from '../core/input.ts';
import { RNG } from '../core/rng.ts';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Converts the design's kN-per-tonne figure into world acceleration.
 * Tuned so the starter frame (260 kN / ~775 t) accelerates at ~40 u/s^2, which reaches
 * cruising speed in a couple of seconds while heavy builds still feel heavy.
 */
const ACCEL_SCALE = 120;

interface AsteroidEntity {
  mesh: THREE.Mesh;
  radius: number;
  health: number;
  maxHealth: number;
  resource: string;
  amount: number;
  spin: THREE.Vector3;
  velocity: THREE.Vector3;
  rare: boolean;
  damageStage: number;
}

interface ChunkEntity {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  resource: string;
  amount: number;
  life: number;
  collected: boolean;
  spin: THREE.Vector3;
}

interface ProjectileEntity {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  friendly: boolean;
  splash: number;
  homing: number;
  target?: EnemyEntity | null;
  color: number;
  trail: number;
}

interface EnemyEntity {
  def: EnemyDef;
  group: THREE.Group;
  muzzles: THREE.Object3D[];
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  velocity: THREE.Vector3;
  cooldown: number;
  state: 'approach' | 'engage' | 'retreat';
  phase: number;
  plumes: ThrusterPlume[];
  dead: boolean;
}

export interface ExpeditionHUD {
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  cargo: number;
  cargoCap: number;
  speed: number;
  throttle: number;
  sector: string;
  asteroidsMined: number;
  enemiesKilled: number;
  credits: number;
  ore: Record<string, number>;
  targetName: string | null;
  targetHealth: number;
  targetMaxHealth: number;
  radarBlips: { x: number; y: number; type: 'enemy' | 'rock' | 'chunk' }[];
  warnings: string[];
  elapsed: number;
}

/**
 * Segment-vs-sphere test. Projectiles can travel further than a target's radius in a
 * single frame, so collisions are evaluated along the whole swept segment.
 */
function sweptHit(from: THREE.Vector3, to: THREE.Vector3, center: THREE.Vector3, radius: number): boolean {
  const seg = to.clone().sub(from);
  const lenSq = seg.lengthSq();
  if (lenSq < 1e-8) return from.distanceTo(center) <= radius;
  const t = THREE.MathUtils.clamp(center.clone().sub(from).dot(seg) / lenSq, 0, 1);
  const closest = from.clone().addScaledVector(seg, t);
  return closest.distanceTo(center) <= radius;
}

export class SpaceScene {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  fx: FXSystem;
  sector: SectorDef;
  hud: ExpeditionHUD;
  active = false;
  onReturn: ((summary: ExpeditionSummary) => void) | null = null;
  onNotify: ((msg: string, kind?: 'info' | 'error' | 'success') => void) | null = null;

  private state: GameState;
  private input: Input;
  private rng: RNG;
  private shipGroup = new THREE.Group();
  private shipPivot = new THREE.Group();
  private asteroids: AsteroidEntity[] = [];
  private chunks: ChunkEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private enemies: EnemyEntity[] = [];
  private plumes: { plume: ThrusterPlume; dir: THREE.Vector3; offset: THREE.Vector3 }[] = [];
  private miningMuzzles: { obj: THREE.Object3D; dps: number; range: number; uid: string }[] = [];
  private weaponMounts: {
    obj: THREE.Object3D; turret?: THREE.Object3D; uid: string; defId: string;
    cooldown: number; damage: number; rate: number; speed: number; range: number; splash: number; homing: number; color: number;
  }[] = [];
  private magnets: { range: number; force: number }[] = [];
  private droneBays: { cooldown: number; damage: number; rate: number; range: number }[] = [];

  // Physics state
  private velocity = new THREE.Vector3();
  private angularVelocity = new THREE.Vector3();
  private mass = 1000;
  private comOffset = new THREE.Vector3();
  private throttle = 0;
  private boost = 0;

  // Resources / combat state
  private shield = 0;
  private maxShield = 0;
  private energy = 0;
  private maxEnergy = 100;
  private cargo = 0;
  private cargoCap = 100;
  private oreHold: Record<string, number> = {};
  private creditsEarned = 0;
  private elapsed = 0;
  private spawnTimer = 0;
  private hazardTimer = 0;
  private miningTargets = new Set<AsteroidEntity>();
  private cameraShake = 0;
  private cameraDistance = 34;
  private lastDamageTime = -99;
  private statsCache = { asteroidsMined: 0, enemiesKilled: 0, distance: 0, chunks: 0, damageDealt: 0, rareFinds: 0, shieldAbsorbed: 0 };
  private bounds = 1200;
  private targetLock: EnemyEntity | AsteroidEntity | null = null;
  private quality: 'low' | 'medium' | 'high';
  private hazardWarning = '';

  constructor(state: GameState, input: Input, sector: SectorDef, quality: 'low' | 'medium' | 'high') {
    this.state = state;
    this.input = input;
    this.sector = sector;
    this.quality = quality;
    this.rng = new RNG((Date.now() ^ sector.index * 7919) >>> 0);
    this.camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.5, 6000);
    this.fx = new FXSystem(this.scene, quality);
    this.hud = this.freshHud();
    this.buildEnvironment();
    this.buildShip();
    this.spawnField();
  }

  private freshHud(): ExpeditionHUD {
    return {
      hull: 1, maxHull: 1, shield: 0, maxShield: 0, energy: 0, maxEnergy: 1, cargo: 0, cargoCap: 1,
      speed: 0, throttle: 0, sector: this.sector.name, asteroidsMined: 0, enemiesKilled: 0, credits: 0,
      ore: {}, targetName: null, targetHealth: 0, targetMaxHealth: 0, radarBlips: [], warnings: [], elapsed: 0,
    };
  }

  // ------------------------------------------------------------ environment
  private buildEnvironment(): void {
    const bg = spaceBackground(this.sector.nebula[0], this.sector.nebula[1], this.sector.index * 1337 + 7, this.quality === 'low' ? 1024 : 2048);
    this.scene.background = bg;
    this.scene.environment = null;
    this.scene.fog = new THREE.FogExp2(this.sector.fog, this.sector.hazard === 'lightning' ? 0.0016 : 0.0008);

    const ambient = new THREE.HemisphereLight(this.sector.ambient, 0x05060c, 0.9);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(this.sector.sun, 2.1);
    sun.position.set(300, 200, 120);
    sun.castShadow = this.quality === 'high';
    if (sun.castShadow) {
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 20;
      sun.shadow.camera.far = 900;
      const d = 180;
      sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
      sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    }
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(this.sector.sun2, 0.9);
    fill.position.set(-220, -80, -160);
    this.scene.add(fill);

    // Distant nebula sprites for parallax depth.
    const spriteCount = this.quality === 'low' ? 6 : 14;
    for (let i = 0; i < spriteCount; i++) {
      const geo = new THREE.PlaneGeometry(this.rng.range(400, 1100), this.rng.range(300, 800));
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 ? this.sector.nebula[0] : this.sector.nebula[1],
        transparent: true, opacity: this.rng.range(0.05, 0.16), blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const plane = new THREE.Mesh(geo, mat);
      const dir = new THREE.Vector3(this.rng.gauss(), this.rng.gauss() * 0.4, this.rng.gauss()).normalize();
      plane.position.copy(dir.multiplyScalar(this.rng.range(1400, 2400)));
      plane.lookAt(0, 0, 0);
      this.scene.add(plane);
    }
  }

  private spawnField(): void {
    const count = this.quality === 'low' ? Math.floor(this.sector.asteroidCount * 0.6) : this.sector.asteroidCount;
    for (let i = 0; i < count; i++) this.spawnAsteroid(true);

    if (this.sector.id === 'iron_graveyard') {
      for (let i = 0; i < 7; i++) {
        const wreck = buildWreck(i * 991 + 3, this.rng.range(0.9, 2.2));
        wreck.position.set(this.rng.range(-700, 700), this.rng.range(-200, 200), this.rng.range(-700, 700));
        wreck.rotation.set(this.rng.range(0, 6), this.rng.range(0, 6), this.rng.range(0, 6));
        this.scene.add(wreck);
      }
    }
  }

  private spawnAsteroid(initial = false): void {
    const [minS, maxS] = this.sector.asteroidScale;
    const radius = this.rng.range(minS, maxS);
    const seed = this.rng.int(1, 1e6);
    const detail = this.quality === 'low' ? 1 : radius > 14 ? 3 : 2;
    const built = buildAsteroid(this.sector.rockStyle, seed, radius, detail);
    const pos = new THREE.Vector3();
    if (initial) {
      pos.set(this.rng.range(-800, 800), this.rng.range(-260, 260), this.rng.range(-800, 800));
    } else {
      const dir = new THREE.Vector3(this.rng.gauss(), this.rng.gauss() * 0.3, this.rng.gauss()).normalize();
      pos.copy(this.shipPivot.position).add(dir.multiplyScalar(this.rng.range(520, 820)));
    }
    built.mesh.position.copy(pos);
    built.mesh.rotation.set(this.rng.range(0, 6.3), this.rng.range(0, 6.3), this.rng.range(0, 6.3));

    const table = this.sector.resourceTable;
    const ids = Object.keys(table);
    const weights = ids.map((id) => table[id]);
    const resource = this.rng.weighted(ids, weights);
    const hardness = 1 + this.sector.danger * 0.45;
    const maxHealth = radius * 20 * hardness;
    const entity: AsteroidEntity = {
      mesh: built.mesh,
      radius,
      health: maxHealth,
      maxHealth,
      resource,
      amount: Math.round(radius * this.rng.range(2.2, 4.4) * (RESOURCES[resource].rare ? 0.5 : 1)),
      spin: new THREE.Vector3(this.rng.range(-0.25, 0.25), this.rng.range(-0.25, 0.25), this.rng.range(-0.25, 0.25)),
      velocity: new THREE.Vector3(this.rng.range(-2, 2), this.rng.range(-1, 1), this.rng.range(-2, 2)),
      rare: RESOURCES[resource].rare,
      damageStage: 0,
    };
    this.scene.add(built.mesh);
    this.asteroids.push(entity);
  }

  // ------------------------------------------------------------------- ship
  private buildShip(): void {
    this.shipPivot.add(this.shipGroup);
    this.scene.add(this.shipPivot);
    const design = this.state.ship;
    const stats = design.stats();
    const bonuses = this.state.bonuses();

    this.mass = Math.max(200, stats.mass);
    this.comOffset.set(stats.centerOfMass[0] * CELL_SIZE, stats.centerOfMass[1] * CELL_SIZE, stats.centerOfMass[2] * CELL_SIZE);

    for (const mod of design.modules) {
      const built = buildModuleMesh(mod.defId);
      placeModuleObject(built.group, mod.defId, mod.pos, mod.orientation);
      built.group.position.sub(this.comOffset);
      built.group.userData.uid = mod.uid;
      this.shipGroup.add(built.group);
      const def = getModule(mod.defId);

      if (def.stats.thrust) {
        const thrusters = design.thrusters().find((t) => t.uid === mod.uid);
        for (const nozzle of built.nozzles) {
          const plume = new ThrusterPlume(def.accent, 0.9);
          nozzle.add(plume.group);
          const worldDir = thrusters ? new THREE.Vector3(...thrusters.dir) : new THREE.Vector3(0, 0, 1);
          const offset = new THREE.Vector3(
            (mod.pos[0] * CELL_SIZE) - this.comOffset.x,
            (mod.pos[1] * CELL_SIZE) - this.comOffset.y,
            (mod.pos[2] * CELL_SIZE) - this.comOffset.z,
          );
          this.plumes.push({ plume, dir: worldDir, offset });
        }
      }
      if (def.stats.miningDps) {
        for (const muzzle of built.muzzles) {
          this.miningMuzzles.push({
            obj: muzzle,
            dps: scaledStat(def.stats.miningDps, mod.level) * design.efficiency(mod) * mult(bonuses, 'miningMult'),
            range: (def.stats.miningRange ?? 80) * 1.0,
            uid: mod.uid,
          });
        }
      }
      if (def.category === 'weapon' && def.stats.damage) {
        this.weaponMounts.push({
          obj: built.group,
          turret: built.turret,
          uid: mod.uid,
          defId: mod.defId,
          cooldown: 0,
          damage: scaledStat(def.stats.damage, mod.level) * mult(bonuses, 'damageMult'),
          rate: (def.stats.fireRate ?? 1) * mult(bonuses, 'fireRateMult'),
          speed: def.stats.projectileSpeed ?? 400,
          range: def.stats.weaponRange ?? 200,
          splash: def.stats.splash ?? 0,
          homing: def.stats.homing ?? 0,
          color: def.accent,
        });
      }
      if (def.stats.magnetRange) {
        this.magnets.push({
          range: scaledStat(def.stats.magnetRange, mod.level) * mult(bonuses, 'magnetRangeMult'),
          force: scaledStat(def.stats.magnetForce ?? 100, mod.level),
        });
      }
      if (def.category === 'defense' && def.stats.drones) {
        for (let i = 0; i < (def.stats.drones ?? 0); i++) {
          this.droneBays.push({
            cooldown: 0,
            damage: scaledStat(def.stats.damage ?? 10, mod.level) * mult(bonuses, 'damageMult'),
            rate: def.stats.fireRate ?? 1,
            range: def.stats.weaponRange ?? 180,
          });
        }
      }
    }

    this.maxShield = stats.shield * mult(bonuses, 'shieldMult');
    this.shield = this.maxShield;
    this.maxEnergy = Math.max(40, stats.energyCap);
    this.energy = this.maxEnergy;
    this.cargoCap = Math.max(40, stats.cargo * mult(bonuses, 'cargoMult'));
    this.shipPivot.position.set(0, 0, 0);
    this.shipPivot.quaternion.identity();

    // Escort drones orbiting the ship.
    for (let i = 0; i < this.droneBays.length; i++) {
      const drone = buildEnemy(ENEMIES.scout).group;
      drone.scale.setScalar(0.35);
      drone.userData.droneIndex = i;
      drone.name = 'escortDrone';
      this.shipPivot.add(drone);
    }
  }

  // ------------------------------------------------------------------ input
  private handleControls(dt: number): void {
    const bonuses = this.state.bonuses();
    const design = this.state.ship;
    const stats = design.stats();
    const thrustMult = mult(bonuses, 'speedMult');
    const torqueMult = mult(bonuses, 'turnMult');

    // Rotational control from mouse offset (flight-stick style) + roll keys.
    const mx = THREE.MathUtils.clamp(this.input.mouse.x, -1, 1);
    const my = THREE.MathUtils.clamp(this.input.mouse.y, -1, 1) * (this.state.settings.invertY ? -1 : 1);
    const sens = this.state.settings.cameraSensitivity;
    const torqueAuthority = (0.9 + stats.torque * 0.55) * torqueMult * sens;
    const deadzone = 0.08;
    const yawInput = Math.abs(mx) > deadzone ? -(mx - Math.sign(mx) * deadzone) / (1 - deadzone) : 0;
    const pitchInput = Math.abs(my) > deadzone ? (my - Math.sign(my) * deadzone) / (1 - deadzone) : 0;
    const rollInput = this.input.axis('KeyE', 'KeyQ');

    const massFactor = Math.max(0.25, 1600 / Math.max(400, this.mass));
    this.angularVelocity.x += pitchInput * torqueAuthority * dt * 1.5 * massFactor;
    this.angularVelocity.y += yawInput * torqueAuthority * dt * 1.8 * massFactor;
    this.angularVelocity.z += rollInput * torqueAuthority * dt * 2.2 * massFactor;

    // Angular damping (stabilisation assistance keeps the ship controllable).
    const damp = Math.pow(0.02, dt);
    this.angularVelocity.multiplyScalar(damp * 0.65 + 0.35 * Math.pow(0.35, dt));

    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      this.angularVelocity.x * dt, this.angularVelocity.y * dt, this.angularVelocity.z * dt, 'XYZ',
    ));
    this.shipPivot.quaternion.multiply(q).normalize();

    // Linear thrust.
    const forwardInput = this.input.axis('KeyS', 'KeyW');
    const strafeInput = this.input.axis('KeyA', 'KeyD');
    const vertInput = this.input.axis('KeyC', 'Space');
    const boosting = this.input.down('ShiftLeft') || this.input.down('ShiftRight');
    this.boost = THREE.MathUtils.lerp(this.boost, boosting && this.energy > 5 ? 1 : 0, dt * 6);

    const totalThrust = Math.max(60, stats.thrust) * thrustMult * (1 + this.boost * 0.65);
    const accel = (totalThrust / this.mass) * ACCEL_SCALE;
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipPivot.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shipPivot.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipPivot.quaternion);

    this.throttle = THREE.MathUtils.lerp(this.throttle, Math.abs(forwardInput) > 0.1 ? forwardInput : 0, dt * 5);

    if (forwardInput !== 0) this.velocity.addScaledVector(forward, accel * forwardInput * dt * (forwardInput > 0 ? 1 : 0.55));
    if (strafeInput !== 0) this.velocity.addScaledVector(right, accel * strafeInput * dt * 0.42);
    if (vertInput !== 0) this.velocity.addScaledVector(up, accel * vertInput * dt * 0.42);

    // Brake / inertial dampeners.
    if (this.input.down('KeyX')) this.velocity.multiplyScalar(Math.pow(0.12, dt));
    else this.velocity.multiplyScalar(Math.pow(0.86, dt)); // light space drag keeps flight readable

    const maxSpeed = 240 * thrustMult * (1 + this.boost * 0.5);
    if (this.velocity.length() > maxSpeed) this.velocity.setLength(maxSpeed);

    // Energy: installed modules draw continuously, generators refill, boosting costs extra.
    // A negative balance drains the buffer and eventually silences lasers and weapons.
    const energyRegen = stats.energyGen * mult(bonuses, 'energyRegenMult');
    const netEnergy = energyRegen - stats.energyDraw - this.boost * 12;
    this.energy = THREE.MathUtils.clamp(this.energy + netEnergy * dt, 0, this.maxEnergy);

    // Thruster visuals follow the actual inputs.
    for (const p of this.plumes) {
      const align = p.dir.dot(new THREE.Vector3(0, 0, 1));
      let power = 0;
      if (forwardInput > 0 && align > 0.5) power = 0.7 + this.boost * 0.6;
      else if (forwardInput < 0 && align < -0.5) power = 0.5;
      else if (Math.abs(strafeInput) > 0 || Math.abs(vertInput) > 0 || Math.abs(yawInput) > 0.2) power = 0.3;
      else power = 0.12;
      p.plume.setThrottle(power, dt);
      if (power > 0.4 && Math.random() < 0.5) {
        const world = this.shipPivot.localToWorld(p.offset.clone().addScaledVector(p.dir, -2));
        const dirWorld = p.dir.clone().applyQuaternion(this.shipPivot.quaternion).multiplyScalar(-1);
        this.fx.thrusterPuff(world, dirWorld, 0x66ccff, power * 0.7);
      }
    }
  }

  // ----------------------------------------------------------------- mining
  private updateMining(dt: number): void {
    const firing = this.input.mouse.right;
    this.miningTargets.clear();
    if (!firing || this.miningMuzzles.length === 0) return;
    if (this.energy <= 0.5) {
      if (Math.random() < 0.01) this.onNotify?.('Not enough power for the mining array.', 'error');
      return;
    }

    const bonuses = this.state.bonuses();
    const rareBonus = additive(bonuses, 'rareChance') + this.state.ship.stats().rareBonus;
    const aimPoint = this.aimPoint(600);

    for (const muzzle of this.miningMuzzles) {
      const origin = muzzle.obj.getWorldPosition(new THREE.Vector3());
      const dir = aimPoint.clone().sub(origin).normalize();
      let best: { ast: AsteroidEntity; point: THREE.Vector3; dist: number } | null = null;
      for (const ast of this.asteroids) {
        const toAst = ast.mesh.position.clone().sub(origin);
        const dist = toAst.length();
        if (dist > muzzle.range + ast.radius) continue;
        const proj = toAst.dot(dir);
        if (proj <= 0) continue;
        const perp = toAst.clone().addScaledVector(dir, -proj).length();
        if (perp > ast.radius * 1.05) continue;
        if (!best || dist < best.dist) {
          const hit = origin.clone().addScaledVector(dir, Math.max(0, proj - ast.radius * 0.85));
          best = { ast, point: hit, dist };
        }
      }
      if (!best) {
        // Show the beam even when it misses so aiming reads clearly.
        this.fx.beam(origin, origin.clone().addScaledVector(dir, muzzle.range), 0xff5533, 0.12, 0.05);
        continue;
      }
      this.fx.beam(origin, best.point, 0xff6b2d, 0.3, 0.05);
      if (Math.random() < 0.6) this.fx.impact(best.point, 0xff9a3c, 3, 16);
      if (Math.random() < 0.08) audio.mining();

      const damage = muzzle.dps * dt;
      best.ast.health -= damage;
      this.miningTargets.add(best.ast);
      this.statsCache.damageDealt += damage * 0.25;

      // Progressive damage states.
      const frac = best.ast.health / best.ast.maxHealth;
      const stage = frac < 0.33 ? 2 : frac < 0.66 ? 1 : 0;
      if (stage !== best.ast.damageStage) {
        best.ast.damageStage = stage;
        const mat = best.ast.mesh.material as THREE.MeshStandardMaterial;
        best.ast.mesh.material = mat.clone();
        (best.ast.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 + stage * 0.9;
        (best.ast.mesh.material as THREE.MeshStandardMaterial).color.offsetHSL(0, 0, -0.04);
        this.fx.impact(best.point, 0xffd166, 10, 22);
      }
      if (best.ast.health <= 0) this.destroyAsteroid(best.ast, rareBonus);
    }
  }

  private destroyAsteroid(ast: AsteroidEntity, rareBonus: number): void {
    const idx = this.asteroids.indexOf(ast);
    if (idx < 0) return;
    this.asteroids.splice(idx, 1);
    this.scene.remove(ast.mesh);
    ast.mesh.geometry.dispose();

    this.fx.explosion(ast.mesh.position, Math.min(2.4, ast.radius * 0.14), this.sector.rockStyle === 'volcanic' ? 0xff8a3c : 0xa0b4cc);
    audio.explosion(Math.min(1.4, ast.radius * 0.1));
    this.cameraShake = Math.min(1.2, this.cameraShake + ast.radius * 0.02);
    this.statsCache.asteroidsMined += 1;

    const bonuses = this.state.bonuses();
    const lootMult = mult(bonuses, 'lootMult');
    let chunkCount = Math.min(9, 2 + Math.floor(ast.radius / 3));
    const totalAmount = Math.max(1, Math.round(ast.amount * lootMult));
    const per = Math.max(1, Math.round(totalAmount / chunkCount));

    // Rare bonus roll: a rare vein can appear inside an ordinary rock.
    let resource = ast.resource;
    if (!RESOURCES[resource].rare && Math.random() < rareBonus) {
      const rares = Object.keys(this.sector.resourceTable).filter((r) => RESOURCES[r].rare);
      if (rares.length) {
        resource = this.rng.pick(rares);
        this.statsCache.rareFinds += 1;
        this.onNotify?.(`Rare vein uncovered: ${RESOURCES[resource].name}!`, 'success');
      }
    } else if (RESOURCES[resource].rare) {
      this.statsCache.rareFinds += 1;
    }

    for (let i = 0; i < chunkCount; i++) {
      const chunk = buildOreChunk(RESOURCES[resource].color, this.rng.int(1, 1e6), this.rng.range(0.7, 1.5));
      chunk.position.copy(ast.mesh.position).add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(ast.radius * 0.5));
      this.scene.add(chunk);
      this.chunks.push({
        mesh: chunk,
        velocity: new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(this.rng.range(4, 16)).add(ast.velocity),
        resource,
        amount: per,
        life: 70,
        collected: false,
        spin: new THREE.Vector3(this.rng.range(-3, 3), this.rng.range(-3, 3), this.rng.range(-3, 3)),
      });
    }
    // Keep the field populated.
    this.spawnAsteroid(false);
  }

  // ------------------------------------------------------------- collection
  private updateChunks(dt: number): void {
    const shipPos = this.shipPivot.position;
    const magnetRange = this.magnets.reduce((acc, m) => Math.max(acc, m.range), 0);
    const magnetForce = this.magnets.reduce((acc, m) => acc + m.force, 0);
    const pickupRadius = 9;

    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const c = this.chunks[i];
      c.life -= dt;
      const toShip = shipPos.clone().sub(c.mesh.position);
      const dist = toShip.length();

      if (magnetRange > 0 && dist < magnetRange) {
        const pull = (magnetForce / Math.max(1, this.mass * 0.02)) * (1 - dist / magnetRange);
        c.velocity.addScaledVector(toShip.normalize(), pull * dt * 6);
        if (Math.random() < 0.02) this.fx.pickup(c.mesh.position, RESOURCES[c.resource].color);
      }
      c.velocity.multiplyScalar(Math.pow(0.9, dt));
      c.mesh.position.addScaledVector(c.velocity, dt);
      c.mesh.rotation.x += c.spin.x * dt;
      c.mesh.rotation.y += c.spin.y * dt;

      if (!c.collected && dist < pickupRadius) {
        c.collected = true;  // duplicate-collection guard
        const space = this.cargoCap - this.cargo;
        if (space <= 0) {
          if (Math.random() < 0.05) this.onNotify?.('Cargo hold is full - return to the hangar.', 'error');
          c.collected = false;
          c.velocity.addScaledVector(toShip.normalize(), -20);
        } else {
          const taken = Math.min(space, c.amount);
          this.cargo += taken;
          this.oreHold[c.resource] = (this.oreHold[c.resource] ?? 0) + taken;
          this.statsCache.chunks += 1;
          this.fx.pickup(c.mesh.position, RESOURCES[c.resource].color);
          audio.pickup();
          this.removeChunk(i);
          continue;
        }
      }
      if (c.life <= 0) this.removeChunk(i);
    }
  }

  private removeChunk(index: number): void {
    const c = this.chunks[index];
    this.scene.remove(c.mesh);
    c.mesh.geometry.dispose();
    (c.mesh.material as THREE.Material).dispose();
    this.chunks.splice(index, 1);
  }

  // ----------------------------------------------------------------- combat
  private aimPoint(distance: number): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipPivot.quaternion);
    return this.shipPivot.position.clone().addScaledVector(forward, distance);
  }

  private updateWeapons(dt: number): void {
    const firing = this.input.mouse.left;
    const aim = this.aimPoint(500);

    // Turret tracking: rotate toward the nearest enemy within range.
    for (const w of this.weaponMounts) {
      w.cooldown -= dt;
      const origin = w.obj.getWorldPosition(new THREE.Vector3());
      let target: EnemyEntity | null = null;
      let bestDist = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = e.group.position.distanceTo(origin);
        if (d < w.range && d < bestDist) { bestDist = d; target = e; }
      }
      if (w.turret) {
        const aimAt = target ? target.group.position : aim;
        const local = w.obj.worldToLocal(aimAt.clone());
        const desired = Math.atan2(local.x, local.z);
        let delta = desired - w.turret.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        w.turret.rotation.y += THREE.MathUtils.clamp(delta, -3.2 * dt, 3.2 * dt);
      }
      if (!firing || w.cooldown > 0) continue;
      if (this.energy < 2) continue;

      w.cooldown = 1 / Math.max(0.05, w.rate);
      this.energy = Math.max(0, this.energy - 1.2);
      const muzzleWorld = new THREE.Vector3();
      let muzzleObj: THREE.Object3D | null = null;
      (w.turret ?? w.obj).traverse((o) => { if (o.name === 'muzzle' && !muzzleObj) muzzleObj = o; });
      if (muzzleObj) (muzzleObj as THREE.Object3D).getWorldPosition(muzzleWorld);
      else muzzleWorld.copy(origin);

      const targetPoint = target
        ? this.leadTarget(muzzleWorld, target, w.speed)
        : aim;
      const dir = targetPoint.clone().sub(muzzleWorld).normalize();

      if (w.speed >= 900) {
        // Hitscan beam weapons (railgun / laser cannon).
        const hit = this.raycastEnemies(muzzleWorld, dir, w.range);
        this.fx.beam(muzzleWorld, hit ? hit.point : muzzleWorld.clone().addScaledVector(dir, w.range), w.color, 0.28, 0.07);
        if (hit) {
          this.damageEnemy(hit.enemy, w.damage, hit.point);
          this.fx.impact(hit.point, w.color, 12, 26);
        }
        audio.laser();
      } else {
        this.spawnProjectile(muzzleWorld, dir.multiplyScalar(w.speed).add(this.velocity.clone().multiplyScalar(0.4)), w.damage, true, w.splash, w.homing, target, w.color);
        if (w.splash > 20) audio.rocket(); else audio.gun();
      }
      this.fx.flash(muzzleWorld, w.color, 18, 0.08);
      this.cameraShake = Math.min(0.8, this.cameraShake + 0.04);
    }

    // Defensive drones engage automatically.
    for (const bay of this.droneBays) {
      bay.cooldown -= dt;
      if (bay.cooldown > 0) continue;
      const target = this.enemies.find((e) => !e.dead && e.group.position.distanceTo(this.shipPivot.position) < bay.range);
      if (!target) continue;
      bay.cooldown = 1 / Math.max(0.1, bay.rate);
      const origin = this.shipPivot.position.clone().add(new THREE.Vector3(this.rng.range(-8, 8), this.rng.range(-4, 4), this.rng.range(-8, 8)));
      const dir = target.group.position.clone().sub(origin).normalize();
      this.fx.beam(origin, target.group.position, 0xffe08a, 0.14, 0.06);
      this.damageEnemy(target, bay.damage, target.group.position.clone());
      void dir;
    }
  }

  private leadTarget(origin: THREE.Vector3, enemy: EnemyEntity, projectileSpeed: number): THREE.Vector3 {
    const toTarget = enemy.group.position.clone().sub(origin);
    const time = toTarget.length() / Math.max(1, projectileSpeed);
    return enemy.group.position.clone().addScaledVector(enemy.velocity, time);
  }

  private raycastEnemies(origin: THREE.Vector3, dir: THREE.Vector3, range: number): { enemy: EnemyEntity; point: THREE.Vector3 } | null {
    let best: { enemy: EnemyEntity; point: THREE.Vector3; dist: number } | null = null;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const toE = e.group.position.clone().sub(origin);
      const proj = toE.dot(dir);
      if (proj < 0 || proj > range) continue;
      const perp = toE.clone().addScaledVector(dir, -proj).length();
      const radius = e.def.scale * 4;
      if (perp > radius) continue;
      if (!best || proj < best.dist) best = { enemy: e, point: origin.clone().addScaledVector(dir, proj), dist: proj };
    }
    return best ? { enemy: best.enemy, point: best.point } : null;
  }

  private spawnProjectile(
    pos: THREE.Vector3, velocity: THREE.Vector3, damage: number, friendly: boolean,
    splash = 0, homing = 0, target: EnemyEntity | null = null, color = 0xffd166,
  ): void {
    const geo = splash > 20
      ? new THREE.CapsuleGeometry(0.5, 2.4, 4, 8)
      : new THREE.SphereGeometry(0.42, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(splash > 20 ? 1.6 : 1.2);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, velocity, damage, life: 4.5, friendly, splash, homing, target, color, trail: 0 });
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.homing > 0) {
        if (!p.target || p.target.dead) {
          p.target = this.enemies.find((e) => !e.dead) ?? null;
        }
        if (p.target) {
          const desired = p.target.group.position.clone().sub(p.mesh.position).normalize().multiplyScalar(p.velocity.length());
          p.velocity.lerp(desired, Math.min(1, p.homing * dt));
        }
      }
      const prevPos = p.mesh.position.clone();
      p.mesh.position.addScaledVector(p.velocity, dt);
      if (p.velocity.lengthSq() > 0.01) {
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.velocity.clone().normalize());
      }
      p.trail += dt;
      if (p.trail > 0.02) {
        p.trail = 0;
        this.fx.thrusterPuff(p.mesh.position, p.velocity.clone().normalize().multiplyScalar(-1), p.color, 0.35);
      }

      let hit = false;
      if (p.friendly) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (sweptHit(prevPos, p.mesh.position, e.group.position, e.def.scale * 4.6)) {
            this.damageEnemy(e, p.damage, p.mesh.position.clone());
            hit = true;
            break;
          }
        }
        if (!hit) {
          for (const a of this.asteroids) {
            if (sweptHit(prevPos, p.mesh.position, a.mesh.position, a.radius)) {
              a.health -= p.damage * 0.5;
              this.fx.impact(p.mesh.position, 0xffa366, 10, 20);
              if (a.health <= 0) this.destroyAsteroid(a, 0);
              hit = true;
              break;
            }
          }
        }
      } else if (sweptHit(prevPos, p.mesh.position, this.shipPivot.position, 7)) {
        this.damagePlayer(p.damage, p.mesh.position.clone());
        hit = true;
      }

      if (hit || p.life <= 0) {
        if (hit && p.splash > 0) {
          this.fx.explosion(p.mesh.position, p.splash / 24, p.color);
          audio.explosion(0.6);
          for (const e of this.enemies) {
            if (e.dead) continue;
            const d = e.group.position.distanceTo(p.mesh.position);
            if (d < p.splash && p.friendly) this.damageEnemy(e, p.damage * 0.5 * (1 - d / p.splash), e.group.position.clone());
          }
        }
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private damageEnemy(enemy: EnemyEntity, amount: number, point: THREE.Vector3): void {
    if (enemy.dead) return;
    this.statsCache.damageDealt += amount;
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, amount);
      enemy.shield -= absorbed;
      amount -= absorbed;
      this.fx.shieldHit(point, point.clone().sub(enemy.group.position).normalize(), 0x9ad6ff);
      audio.shieldHit();
    }
    if (amount > 0) {
      enemy.hull -= amount;
      this.fx.impact(point, 0xff8a3c, 8, 22);
    }
    if (enemy.hull <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: EnemyEntity): void {
    enemy.dead = true;
    this.fx.explosion(enemy.group.position, enemy.def.scale * 0.9, 0xffb347);
    audio.explosion(enemy.def.scale * 0.6);
    this.cameraShake = Math.min(1.4, this.cameraShake + enemy.def.scale * 0.12);
    this.statsCache.enemiesKilled += 1;

    const bonuses = this.state.bonuses();
    const credits = Math.round(enemy.def.credits * this.sector.rewardMultiplier * mult(bonuses, 'creditMult'));
    this.creditsEarned += credits;

    // Wreck loot: drop salvage chunks.
    const salvage = this.rng.int(2, 5);
    const res = this.rng.pick(Object.keys(this.sector.resourceTable));
    for (let i = 0; i < salvage; i++) {
      const chunk = buildOreChunk(RESOURCES[res].color, this.rng.int(1, 1e6), this.rng.range(0.8, 1.4));
      chunk.position.copy(enemy.group.position).add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(4));
      this.scene.add(chunk);
      this.chunks.push({
        mesh: chunk,
        velocity: new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(12),
        resource: res,
        amount: Math.round(6 * this.sector.rewardMultiplier),
        life: 60, collected: false,
        spin: new THREE.Vector3(this.rng.range(-3, 3), this.rng.range(-3, 3), this.rng.range(-3, 3)),
      });
    }

    this.scene.remove(enemy.group);
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) this.enemies.splice(idx, 1);
    this.onNotify?.(`${enemy.def.name} destroyed  ·  +${credits.toLocaleString()} CR`, 'success');
  }

  private damagePlayer(amount: number, point: THREE.Vector3): void {
    this.lastDamageTime = this.elapsed;
    const bonuses = this.state.bonuses();
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
      this.statsCache.shieldAbsorbed += absorbed;
      this.fx.shieldHit(point, point.clone().sub(this.shipPivot.position).normalize());
      audio.shieldHit();
      this.cameraShake = Math.min(1, this.cameraShake + 0.12);
    }
    if (amount <= 0) return;

    // Distribute hull damage to a random installed module (armour reduces it).
    const design = this.state.ship;
    const armorMult = mult(bonuses, 'armorMult');
    const modules = design.modules.filter((m) => m.health > 0);
    if (modules.length === 0) return;
    const target = modules[Math.floor(Math.random() * modules.length)];
    const reduced = amount / Math.max(1, armorMult);
    target.health = Math.max(0, target.health - reduced);
    this.cameraShake = Math.min(1.5, this.cameraShake + 0.2);
    audio.explosion(0.35);

    const obj = this.shipGroup.children.find((c) => c.userData.uid === target.uid);
    if (obj) {
      const world = obj.getWorldPosition(new THREE.Vector3());
      this.fx.impact(world, 0xff5a3c, 14, 26);
      if (target.health <= 0) {
        this.fx.explosion(world, 0.6, 0xff6b4a);
        this.onNotify?.(`${getModule(target.defId).name} disabled!`, 'error');
      }
    }
    if (design.modules.every((m) => m.health <= 0) || !design.hasCockpit()) this.failExpedition();
  }

  // ------------------------------------------------------------------- AI
  private updateEnemies(dt: number): void {
    const stats = this.state.ship.stats();
    this.spawnTimer -= dt;
    const liveBudget = Math.min(this.sector.enemyBudget, 3 + Math.floor(this.elapsed / 25));
    if (this.spawnTimer <= 0 && this.enemies.length < liveBudget) {
      this.spawnTimer = Math.max(3.5, 11 - this.sector.danger * 1.2);
      this.spawnEnemy();
    }

    for (const e of this.enemies) {
      if (e.dead) continue;
      const toPlayer = this.shipPivot.position.clone().sub(e.group.position);
      const dist = toPlayer.length();
      const dir = toPlayer.clone().normalize();
      e.phase += dt;

      let desired = new THREE.Vector3();
      const preferred = e.def.range * 0.65;
      switch (e.def.behaviour) {
        case 'orbit': {
          const tangent = new THREE.Vector3().crossVectors(dir, UP).normalize();
          desired = dir.clone().multiplyScalar(dist > preferred ? 1 : -0.6).add(tangent.multiplyScalar(0.9));
          break;
        }
        case 'strafe': {
          const tangent = new THREE.Vector3().crossVectors(dir, UP).normalize().multiplyScalar(Math.sin(e.phase * 0.7) * 1.2);
          desired = dir.clone().multiplyScalar(dist > preferred ? 1 : -0.4).add(tangent);
          break;
        }
        case 'charge': {
          desired = dir.clone().multiplyScalar(dist > e.def.range * 0.35 ? 1.2 : -0.3);
          break;
        }
        default: {
          desired = dir.clone().multiplyScalar(dist > e.def.range * 0.9 ? 1 : dist < e.def.range * 0.6 ? -0.8 : 0.05);
          const tangent = new THREE.Vector3().crossVectors(dir, UP).normalize().multiplyScalar(0.4 * Math.sin(e.phase * 0.4));
          desired.add(tangent);
          break;
        }
      }
      desired.normalize().multiplyScalar(e.def.speed);
      e.velocity.lerp(desired, Math.min(1, dt * e.def.turn));
      e.group.position.addScaledVector(e.velocity, dt);

      // Face the player.
      const lookTarget = this.shipPivot.position.clone();
      const m = new THREE.Matrix4().lookAt(e.group.position, lookTarget, UP);
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      e.group.quaternion.slerp(q, Math.min(1, dt * e.def.turn * 1.6));

      for (const plume of e.plumes) plume.setThrottle(0.6 + Math.sin(e.phase * 4) * 0.2, dt);

      // Shield regeneration.
      if (e.maxShield > 0) e.shield = Math.min(e.maxShield, e.shield + e.maxShield * 0.04 * dt);

      // Fire.
      e.cooldown -= dt;
      if (dist < e.def.range && e.cooldown <= 0) {
        e.cooldown = 1 / e.def.fireRate;
        const muzzle = e.muzzles.length ? e.muzzles[Math.floor(Math.random() * e.muzzles.length)] : e.group;
        const origin = muzzle.getWorldPosition(new THREE.Vector3());
        const lead = this.shipPivot.position.clone().addScaledVector(this.velocity, dist / e.def.projectileSpeed * 0.8);
        const shotDir = lead.sub(origin).normalize();
        shotDir.add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(0.03)).normalize();
        this.spawnProjectile(origin, shotDir.multiplyScalar(e.def.projectileSpeed), e.def.damage, false, 0, 0, null, e.def.accent);
        this.fx.flash(origin, e.def.accent, 12, 0.07);
        audio.gun();
      }

      // Collision with the player ship.
      if (dist < e.def.scale * 4 + 6) {
        this.damagePlayer(e.def.damage * 0.5 * dt * 6, e.group.position.clone());
        e.velocity.addScaledVector(dir, -e.def.speed * 0.6);
      }
    }

    // Shield regen for the player.
    const bonuses = this.state.bonuses();
    if (this.maxShield > 0 && this.elapsed - this.lastDamageTime > 3) {
      this.shield = Math.min(this.maxShield, this.shield + stats.shieldRegen * mult(bonuses, 'shieldRegenMult') * dt);
    }
    // Hull repair modules.
    if (stats.repair > 0 && this.elapsed - this.lastDamageTime > 5) {
      const repair = stats.repair * mult(bonuses, 'repairMult') * dt;
      for (const m of this.state.ship.modules) {
        const max = this.state.ship.maxHealth(m);
        if (m.health < max) {
          m.health = Math.min(max, m.health + repair);
          break;
        }
      }
    }
  }

  private spawnEnemy(): void {
    const types = this.sector.enemies;
    const def = ENEMIES[this.rng.weighted(types.map((t) => t.type), types.map((t) => t.weight))];
    const built = buildEnemy(def);
    const dir = new THREE.Vector3(this.rng.gauss(), this.rng.gauss() * 0.3, this.rng.gauss()).normalize();
    built.group.position.copy(this.shipPivot.position).add(dir.multiplyScalar(this.rng.range(280, 420)));
    this.scene.add(built.group);
    const plumes: ThrusterPlume[] = [];
    for (const eng of built.engines) {
      const plume = new ThrusterPlume(def.accent, def.scale * 0.6);
      eng.add(plume.group);
      plumes.push(plume);
    }
    const scaling = 1 + this.state.tier * 0.12;
    this.enemies.push({
      def,
      group: built.group,
      muzzles: built.muzzles,
      hull: def.hull * scaling,
      maxHull: def.hull * scaling,
      shield: def.shield * scaling,
      maxShield: def.shield * scaling,
      velocity: new THREE.Vector3(),
      cooldown: this.rng.range(0.5, 2),
      state: 'approach',
      phase: this.rng.range(0, 10),
      plumes,
      dead: false,
    });
    if (def.type === 'sentinel' || def.type === 'heavy') {
      this.onNotify?.(`${def.name} inbound!`, 'error');
    }
  }

  // --------------------------------------------------------------- hazards
  private updateHazards(dt: number): void {
    this.hazardTimer -= dt;
    this.hazardWarning = '';
    const bonuses = this.state.bonuses();
    const resist = additive(bonuses, 'hazardResist');

    switch (this.sector.hazard) {
      case 'lightning': {
        if (this.hazardTimer <= 0) {
          this.hazardTimer = this.rng.range(2.2, 5.5);
          const from = this.shipPivot.position.clone().add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(260));
          const willHit = this.rng.chance(0.45);
          const to = willHit
            ? this.shipPivot.position.clone()
            : this.shipPivot.position.clone().add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(120));
          this.fx.lightning(from, to, 0x9fe8ff);
          audio.explosion(0.5);
          if (willHit) {
            const dmg = 26 * this.sector.danger * (1 - Math.min(0.85, resist));
            this.damagePlayer(dmg, this.shipPivot.position.clone());
            this.onNotify?.('Plasma arc strike!', 'error');
          }
        }
        if (this.hazardTimer < 0.7) this.hazardWarning = 'ARC DISCHARGE IMMINENT';
        break;
      }
      case 'debris': {
        if (this.hazardTimer <= 0) {
          this.hazardTimer = this.rng.range(1.5, 4);
          const dir = new THREE.Vector3(this.rng.gauss(), this.rng.gauss() * 0.4, this.rng.gauss()).normalize();
          const chunk = buildOreChunk(0x8a93a6, this.rng.int(1, 1e6), this.rng.range(1.4, 3));
          chunk.position.copy(this.shipPivot.position).add(dir.multiplyScalar(420));
          this.scene.add(chunk);
          this.chunks.push({
            mesh: chunk,
            velocity: dir.multiplyScalar(-this.rng.range(40, 90)),
            resource: 'iron', amount: 4, life: 25, collected: false,
            spin: new THREE.Vector3(this.rng.range(-4, 4), this.rng.range(-4, 4), this.rng.range(-4, 4)),
          });
        }
        break;
      }
      case 'anomaly': {
        // Gravity wells tug the ship and bend chunk trajectories.
        const well = new THREE.Vector3(
          Math.sin(this.elapsed * 0.08) * 300,
          Math.cos(this.elapsed * 0.05) * 120,
          Math.cos(this.elapsed * 0.07) * 300,
        );
        const toWell = well.clone().sub(this.shipPivot.position);
        const d = toWell.length();
        if (d < 420) {
          const pull = (1 - d / 420) * 26 * (1 - Math.min(0.8, resist));
          this.velocity.addScaledVector(toWell.normalize(), pull * dt);
          this.hazardWarning = 'GRAVITY ANOMALY';
          if (Math.random() < 0.3) this.fx.ambientDust(this.shipPivot.position, 60, 0xb98cff, 2);
        }
        break;
      }
      default:
        break;
    }
  }

  // ----------------------------------------------------------------- camera
  private updateCamera(dt: number): void {
    const back = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipPivot.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipPivot.quaternion);
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + this.input.mouse.wheel * 0.02, 16, 90);
    const speedPull = Math.min(14, this.velocity.length() * 0.06);
    const desired = this.shipPivot.position.clone()
      .addScaledVector(back, this.cameraDistance + speedPull)
      .addScaledVector(up, this.cameraDistance * 0.32);

    this.camera.position.lerp(desired, Math.min(1, dt * 5.5));
    const lookTarget = this.shipPivot.position.clone().addScaledVector(
      new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipPivot.quaternion), 26,
    );
    this.camera.up.lerp(up, Math.min(1, dt * 4));
    this.camera.lookAt(lookTarget);

    if (this.cameraShake > 0.001) {
      this.camera.position.add(new THREE.Vector3(this.rng.gauss(), this.rng.gauss(), this.rng.gauss()).multiplyScalar(this.cameraShake * 0.9));
      this.cameraShake *= Math.pow(0.02, dt);
    }
    // FOV kick with speed for a sense of velocity.
    const targetFov = 62 + Math.min(18, this.velocity.length() * 0.07) + this.boost * 6;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 3);
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ frame
  update(dt: number): void {
    if (!this.active) return;
    this.elapsed += dt;
    const before = this.shipPivot.position.clone();

    this.handleControls(dt);
    this.shipPivot.position.addScaledVector(this.velocity, dt);
    this.statsCache.distance += before.distanceTo(this.shipPivot.position);

    // Keep the player inside the sector volume.
    const fromCenter = this.shipPivot.position.length();
    if (fromCenter > this.bounds) {
      const inward = this.shipPivot.position.clone().multiplyScalar(-1).normalize();
      this.velocity.addScaledVector(inward, (fromCenter - this.bounds) * 0.6 * dt);
      this.hazardWarning = 'RETURNING TO SECTOR';
    }

    this.updateMining(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateChunks(dt);
    this.updateEnemies(dt);
    this.updateHazards(dt);
    this.updateCamera(dt);
    this.fx.update(dt);

    // Asteroid drift + collision.
    for (const a of this.asteroids) {
      a.mesh.position.addScaledVector(a.velocity, dt);
      a.mesh.rotation.x += a.spin.x * dt;
      a.mesh.rotation.y += a.spin.y * dt;
      a.mesh.rotation.z += a.spin.z * dt;
      const d = a.mesh.position.distanceTo(this.shipPivot.position);
      if (d < a.radius + 6) {
        const push = this.shipPivot.position.clone().sub(a.mesh.position).normalize();
        this.velocity.addScaledVector(push, 60 * dt * 6);
        this.damagePlayer(this.velocity.length() * 0.12, this.shipPivot.position.clone());
        this.cameraShake = Math.min(1.2, this.cameraShake + 0.3);
      }
    }

    // Escort drones orbit the hull.
    this.shipPivot.children.forEach((c) => {
      if (c.name !== 'escortDrone') return;
      const i = (c.userData.droneIndex as number) ?? 0;
      const ang = this.elapsed * 1.1 + i * 2.2;
      c.position.set(Math.cos(ang) * 16, Math.sin(ang * 0.7) * 6 + 4, Math.sin(ang) * 16);
      c.lookAt(this.shipPivot.position.clone().add(new THREE.Vector3(Math.cos(ang + 0.4) * 30, 0, Math.sin(ang + 0.4) * 30)));
    });

    // Ambient sector particles.
    if (Math.random() < 0.6) {
      this.fx.ambientDust(this.shipPivot.position, 180, this.sector.nebula[0], this.quality === 'low' ? 1 : 2);
    }

    this.updateHud();
  }

  private updateHud(): void {
    const design = this.state.ship;
    const stats = design.stats();
    const hullCur = design.modules.reduce((acc, m) => acc + m.health, 0);
    const hullMax = design.modules.reduce((acc, m) => acc + design.maxHealth(m), 0);

    const blips: ExpeditionHUD['radarBlips'] = [];
    const inv = this.shipPivot.quaternion.clone().invert();
    const addBlip = (pos: THREE.Vector3, type: 'enemy' | 'rock' | 'chunk') => {
      const local = pos.clone().sub(this.shipPivot.position).applyQuaternion(inv);
      const range = 600;
      const x = THREE.MathUtils.clamp(local.x / range, -1, 1);
      const y = THREE.MathUtils.clamp(local.z / range, -1, 1);
      blips.push({ x, y, type });
    };
    for (const e of this.enemies) if (!e.dead) addBlip(e.group.position, 'enemy');
    const radarRange = Math.max(260, stats.radarRange);
    for (const a of this.asteroids) {
      if (a.mesh.position.distanceTo(this.shipPivot.position) < radarRange) addBlip(a.mesh.position, 'rock');
    }
    for (const c of this.chunks.slice(0, 40)) addBlip(c.mesh.position, 'chunk');

    const warnings: string[] = [];
    if (this.hazardWarning) warnings.push(this.hazardWarning);
    if (this.cargo >= this.cargoCap) warnings.push('CARGO FULL');
    if (hullCur / Math.max(1, hullMax) < 0.3) warnings.push('HULL CRITICAL');
    if (stats.energyBalance < 0) warnings.push('ENERGY DEFICIT');

    let targetName: string | null = null;
    let targetHealth = 0;
    let targetMax = 0;
    const lockedAsteroid = [...this.miningTargets][0];
    if (lockedAsteroid) {
      targetName = `${RESOURCES[lockedAsteroid.resource].name} Asteroid`;
      targetHealth = lockedAsteroid.health;
      targetMax = lockedAsteroid.maxHealth;
    } else {
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipPivot.quaternion);
      let best: { e: EnemyEntity; dot: number } | null = null;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dir = e.group.position.clone().sub(this.shipPivot.position).normalize();
        const dot = dir.dot(forward);
        if (dot > 0.9 && (!best || dot > best.dot)) best = { e, dot };
      }
      if (best) {
        targetName = best.e.def.name;
        targetHealth = best.e.hull + best.e.shield;
        targetMax = best.e.maxHull + best.e.maxShield;
      }
    }

    this.hud = {
      hull: hullCur, maxHull: hullMax,
      shield: this.shield, maxShield: this.maxShield,
      energy: this.energy, maxEnergy: this.maxEnergy,
      cargo: this.cargo, cargoCap: this.cargoCap,
      speed: this.velocity.length(), throttle: this.throttle,
      sector: this.sector.name,
      asteroidsMined: this.statsCache.asteroidsMined,
      enemiesKilled: this.statsCache.enemiesKilled,
      credits: this.creditsEarned,
      ore: { ...this.oreHold },
      targetName, targetHealth, targetMaxHealth: targetMax,
      radarBlips: blips, warnings, elapsed: this.elapsed,
    };
  }

  // ------------------------------------------------------------ completion
  start(): void {
    this.active = true;
  }

  private failExpedition(): void {
    if (!this.active) return;
    this.onNotify?.('Hull integrity lost - emergency extraction engaged.', 'error');
    this.complete(true);
  }

  complete(failed = false): ExpeditionSummary {
    this.active = false;
    const bonuses = this.state.bonuses();
    const creditMult = mult(bonuses, 'creditMult');
    let oreValue = 0;
    const oreDelivered: Record<string, number> = {};
    const keepFraction = failed ? 0.45 : 1;
    for (const [id, qty] of Object.entries(this.oreHold)) {
      const kept = Math.floor(qty * keepFraction);
      if (kept <= 0) continue;
      oreDelivered[id] = kept;
      oreValue += kept * RESOURCES[id].value;
    }
    const credits = Math.round((this.creditsEarned + oreValue) * (failed ? 0.6 : 1) * creditMult);

    const summary: ExpeditionSummary = {
      sector: this.sector,
      failed,
      credits,
      ore: oreDelivered,
      oreUnits: Object.values(oreDelivered).reduce((a, b) => a + b, 0),
      asteroidsMined: this.statsCache.asteroidsMined,
      enemiesKilled: this.statsCache.enemiesKilled,
      distance: Math.round(this.statsCache.distance),
      chunks: this.statsCache.chunks,
      damageDealt: Math.round(this.statsCache.damageDealt),
      rareFinds: this.statsCache.rareFinds,
      shieldAbsorbed: Math.round(this.statsCache.shieldAbsorbed),
      duration: this.elapsed,
      fifthSlotUnlocked: false,
    };
    this.onReturn?.(summary);
    return summary;
  }

  dispose(): void {
    this.active = false;
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      }
    });
    this.scene.clear();
  }
}

export interface ExpeditionSummary {
  sector: SectorDef;
  failed: boolean;
  credits: number;
  ore: Record<string, number>;
  oreUnits: number;
  asteroidsMined: number;
  enemiesKilled: number;
  distance: number;
  chunks: number;
  damageDealt: number;
  rareFinds: number;
  shieldAbsorbed: number;
  duration: number;
  fifthSlotUnlocked: boolean;
}
