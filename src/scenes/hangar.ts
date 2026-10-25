/**
 * Hangar scene: the 3D home base and the ship construction editor.
 *
 * The same scene serves two modes:
 *  - VIEW: the finished ship sits on the launch pad, stations are clickable.
 *  - BUILD: the construction grid appears, modules can be previewed, rotated, placed,
 *    removed and expansion cells purchased, with live mass / centre-of-mass feedback.
 */
import * as THREE from 'three';
import { buildHangar, makeLabelPlane, type HangarStation } from '../render/hangar3d.ts';
import { CELL_SIZE, buildModuleMesh, placeModuleObject, emissiveMaterial } from '../render/modules3d.ts';
import { FXSystem, ThrusterPlume } from '../render/fx.ts';
import { ShipDesign, cellKey, moduleCells, parseKey, type Orientation, type Vec3 } from '../sim/shipgrid.ts';
import { getModule } from '../data/modules.ts';
import { cellPrice } from '../sim/economy.ts';
import type { GameState } from '../sim/gamestate.ts';
import { audio } from '../core/audio.ts';
import type { Input } from '../core/input.ts';

export type HangarMode = 'view' | 'build';

interface PlacementAnim {
  obj: THREE.Object3D;
  t: number;
  duration: number;
}

export class HangarScene {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  fx: FXSystem;
  stations: HangarStation[] = [];
  shipGroup = new THREE.Group();
  gridGroup = new THREE.Group();
  ghostGroup = new THREE.Group();
  mode: HangarMode = 'view';

  /** Currently selected module definition for placement (build mode). */
  selectedModule: string | null = null;
  selectedOrientation: Orientation = 0;
  hoveredCell: Vec3 | null = null;
  hoveredModuleUid: string | null = null;
  placementValid = false;
  placementMessage = '';
  /** Set when the player is in "buy cell" mode. */
  cellPurchaseMode = false;

  onStationClick: ((id: HangarStation['id']) => void) | null = null;
  onShipChanged: (() => void) | null = null;
  onNotify: ((msg: string, kind?: 'info' | 'error' | 'success') => void) | null = null;

  private state: GameState;
  private input: Input;
  private hangarUpdate: (t: number, dt: number) => void;
  private raycaster = new THREE.Raycaster();
  private orbit = { theta: Math.PI * 0.22, phi: Math.PI * 0.34, radius: 78, target: new THREE.Vector3(0, 10, 0) };
  private dragging: 'none' | 'orbit' | 'pan' = 'none';
  private lastPointer = { x: 0, y: 0 };
  private moduleObjects = new Map<string, THREE.Object3D>();
  private plumes: { plume: ThrusterPlume; uid: string }[] = [];
  private placementAnims: PlacementAnim[] = [];
  private comMarker: THREE.Object3D;
  private cellMaterialOwned: THREE.Material;
  private cellMaterialBuy: THREE.Material;
  private ghostMesh: THREE.Object3D | null = null;
  private stationLabels = new Map<string, THREE.Object3D>();
  private pointerDownAt = { x: 0, y: 0, time: 0 };
  private canvas: HTMLCanvasElement;
  private time = 0;

  constructor(state: GameState, input: Input, canvas: HTMLCanvasElement, quality: 'low' | 'medium' | 'high') {
    this.state = state;
    this.input = input;
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.4, 2600);
    this.scene.fog = new THREE.FogExp2(0x070b16, 0.0032);
    this.scene.background = new THREE.Color(0x05070f);

    const hangar = buildHangar(quality);
    this.scene.add(hangar.group);
    this.stations = hangar.stations;
    this.hangarUpdate = hangar.update;
    for (const st of this.stations) this.stationLabels.set(st.id, st.object);

    this.scene.add(this.shipGroup, this.gridGroup, this.ghostGroup);
    this.shipGroup.position.set(0, 14, 0);
    this.gridGroup.position.copy(this.shipGroup.position);
    this.ghostGroup.position.copy(this.shipGroup.position);

    this.fx = new FXSystem(this.scene, quality);

    this.cellMaterialOwned = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.16 });
    this.cellMaterialBuy = new THREE.MeshBasicMaterial({ color: 0xffb700, wireframe: true, transparent: true, opacity: 0.3 });

    // Centre-of-mass indicator: a gyroscopic marker.
    const com = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), emissiveMaterial(0xff3b6b, 3));
    com.add(core);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 28), emissiveMaterial(0xff3b6b, 1.6));
      ring.rotation.set(i === 0 ? Math.PI / 2 : 0, i === 1 ? Math.PI / 2 : 0, 0);
      com.add(ring);
    }
    com.visible = false;
    this.comMarker = com;
    this.shipGroup.add(com);

    this.bindPointer();
    this.rebuildShip();
  }

  // ------------------------------------------------------------ interaction
  private bindPointer(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownAt = { x: e.clientX, y: e.clientY, time: performance.now() };
      this.lastPointer = { x: e.clientX, y: e.clientY };
      if (e.button === 2 || (e.button === 0 && e.shiftKey)) this.dragging = 'pan';
      else if (e.button === 0) this.dragging = 'orbit';
      else if (e.button === 1) this.dragging = 'pan';
    });
    window.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - this.pointerDownAt.x, e.clientY - this.pointerDownAt.y);
      const quick = performance.now() - this.pointerDownAt.time < 400;
      if (this.dragging !== 'none' && moved < 5 && quick && e.button === 0) this.handleClick();
      this.dragging = 'none';
    });
    window.addEventListener('pointermove', (e) => {
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      const sens = this.state.settings.cameraSensitivity;
      if (this.dragging === 'orbit') {
        this.orbit.theta -= dx * 0.005 * sens;
        this.orbit.phi = THREE.MathUtils.clamp(this.orbit.phi - dy * 0.004 * sens * (this.state.settings.invertY ? -1 : 1), 0.08, Math.PI * 0.49);
      } else if (this.dragging === 'pan') {
        const panScale = this.orbit.radius * 0.0016;
        const right = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2, this.orbit.theta + Math.PI / 2);
        this.orbit.target.addScaledVector(right, -dx * panScale);
        this.orbit.target.y = THREE.MathUtils.clamp(this.orbit.target.y + dy * panScale, 0, 60);
      }
    });
    this.canvas.addEventListener('wheel', (e) => {
      this.orbit.radius = THREE.MathUtils.clamp(this.orbit.radius + e.deltaY * 0.05, 18, 190);
    }, { passive: true });
  }

  private handleClick(): void {
    if (this.mode === 'build') {
      if (this.cellPurchaseMode && this.hoveredCell) {
        this.tryBuyCell(this.hoveredCell);
        return;
      }
      if (this.selectedModule && this.hoveredCell) {
        this.tryPlace();
        return;
      }
      if (this.hoveredModuleUid) {
        this.tryRemove(this.hoveredModuleUid);
        return;
      }
      return;
    }
    // View mode: station picking.
    const hit = this.pickStation();
    if (hit) {
      audio.uiClick();
      this.onStationClick?.(hit.id);
    }
  }

  private pickStation(): HangarStation | null {
    this.raycaster.setFromCamera(new THREE.Vector2(this.input.mouse.x, this.input.mouse.y), this.camera);
    let best: { st: HangarStation; dist: number } | null = null;
    for (const st of this.stations) {
      const sphere = new THREE.Sphere(st.position.clone(), 12);
      const point = new THREE.Vector3();
      if (this.raycaster.ray.intersectSphere(sphere, point)) {
        const dist = point.distanceTo(this.camera.position);
        if (!best || dist < best.dist) best = { st, dist };
      }
    }
    return best?.st ?? null;
  }

  setMode(mode: HangarMode): void {
    this.mode = mode;
    this.gridGroup.visible = mode === 'build';
    this.ghostGroup.visible = mode === 'build';
    this.comMarker.visible = mode === 'build';
    if (mode === 'build') {
      this.orbit.radius = 58;
      this.orbit.target.set(0, 14, 0);
      this.rebuildGrid();
    } else {
      this.orbit.radius = 82;
      this.orbit.target.set(0, 10, 0);
      this.selectedModule = null;
      this.cellPurchaseMode = false;
      this.clearGhost();
    }
  }

  selectModule(defId: string | null): void {
    this.selectedModule = defId;
    this.cellPurchaseMode = false;
    this.clearGhost();
    if (defId) {
      const built = buildModuleMesh(defId);
      built.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.material = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.42, wireframe: false });
          mesh.castShadow = false;
        }
      });
      this.ghostMesh = built.group;
      this.ghostGroup.add(built.group);
    }
  }

  setCellPurchaseMode(on: boolean): void {
    this.cellPurchaseMode = on;
    if (on) {
      this.selectedModule = null;
      this.clearGhost();
    }
    this.rebuildGrid();
  }

  rotateSelection(dir = 1): void {
    const order: Orientation[] = [0, 1, 2, 3, 4, 5];
    const idx = order.indexOf(this.selectedOrientation);
    this.selectedOrientation = order[(idx + dir + order.length) % order.length];
    audio.uiClick();
  }

  private clearGhost(): void {
    if (this.ghostMesh) {
      this.ghostGroup.remove(this.ghostMesh);
      this.ghostMesh.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose?.();
          (m.material as THREE.Material)?.dispose?.();
        }
      });
      this.ghostMesh = null;
    }
  }

  // ------------------------------------------------------------ ship visuals
  rebuildShip(): void {
    for (const obj of this.moduleObjects.values()) {
      this.shipGroup.remove(obj);
    }
    this.moduleObjects.clear();
    this.plumes = [];

    const design = this.state.ship;
    for (const mod of design.modules) {
      const built = buildModuleMesh(mod.defId);
      placeModuleObject(built.group, mod.defId, mod.pos, mod.orientation);
      built.group.userData.uid = mod.uid;
      this.shipGroup.add(built.group);
      this.moduleObjects.set(mod.uid, built.group);
      const def = getModule(mod.defId);
      if (def.stats.thrust) {
        for (const nozzle of built.nozzles) {
          const plume = new ThrusterPlume(def.accent, 0.8);
          nozzle.add(plume.group);
          this.plumes.push({ plume, uid: mod.uid });
        }
      }
    }
    this.centerShip();
    this.updateCOM();
    this.rebuildGrid();
  }

  /** Keeps the assembly centred over the launch pad as it grows. */
  private centerShip(): void {
    const b = this.state.ship.bounds();
    const cx = ((b.min[0] + b.max[0]) / 2) * CELL_SIZE;
    const cz = ((b.min[2] + b.max[2]) / 2) * CELL_SIZE;
    const cy = b.min[1] * CELL_SIZE;
    this.shipGroup.position.set(-cx, 14 - cy + 2, -cz);
    this.gridGroup.position.copy(this.shipGroup.position);
    this.ghostGroup.position.copy(this.shipGroup.position);
  }

  private updateCOM(): void {
    const stats = this.state.ship.stats();
    this.comMarker.position.set(
      stats.centerOfMass[0] * CELL_SIZE,
      stats.centerOfMass[1] * CELL_SIZE,
      stats.centerOfMass[2] * CELL_SIZE,
    );
  }

  rebuildGrid(): void {
    this.gridGroup.clear();
    if (this.mode !== 'build') return;
    const design = this.state.ship;
    const boxGeo = new THREE.BoxGeometry(CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98);
    const occ = design.occupancy();

    for (const key of design.cells) {
      const [x, y, z] = parseKey(key);
      if (occ.has(key)) continue;
      const mesh = new THREE.Mesh(boxGeo, this.cellMaterialOwned);
      mesh.position.set(x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE);
      mesh.userData.cell = [x, y, z];
      this.gridGroup.add(mesh);
    }

    if (this.cellPurchaseMode) {
      // Candidate expansion cells adjacent to owned ones.
      const candidates = new Set<string>();
      for (const key of design.cells) {
        const [x, y, z] = parseKey(key);
        const nbs: Vec3[] = [[x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]];
        for (const n of nbs) {
          const nk = cellKey(...n);
          if (!design.cells.has(nk)) candidates.add(nk);
        }
      }
      for (const key of candidates) {
        const [x, y, z] = parseKey(key);
        const mesh = new THREE.Mesh(boxGeo, this.cellMaterialBuy);
        mesh.position.set(x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE);
        mesh.userData.cell = [x, y, z];
        mesh.userData.buyable = true;
        this.gridGroup.add(mesh);
      }
    }
  }

  // ---------------------------------------------------------------- actions
  private tryPlace(): void {
    if (!this.selectedModule || !this.hoveredCell) return;
    const defId = this.selectedModule;
    if ((this.state.inventory[defId] ?? 0) <= 0) {
      this.onNotify?.('You do not own that module - buy it in the Equipment Shop.', 'error');
      audio.error();
      return;
    }
    const issue = this.state.ship.checkPlacement(defId, this.hoveredCell, this.selectedOrientation);
    if (issue) {
      this.onNotify?.(issue.message, 'error');
      audio.error();
      return;
    }
    this.state.takeFromInventory(defId);
    const mod = this.state.ship.place(defId, this.hoveredCell, this.selectedOrientation);
    if ('code' in (mod as any)) {
      this.state.returnToInventory(defId);
      return;
    }
    audio.place();
    this.state.trackStat('modulesInstalled', 1);
    this.rebuildShip();
    const obj = this.moduleObjects.get((mod as any).uid);
    if (obj) {
      obj.scale.setScalar(0.01);
      this.placementAnims.push({ obj, t: 0, duration: 0.42 });
      const world = obj.getWorldPosition(new THREE.Vector3());
      this.fx.impact(world, getModule(defId).accent, 18, 14);
    }
    if ((this.state.inventory[defId] ?? 0) <= 0) this.selectModule(null);
    this.onShipChanged?.();
  }

  private tryRemove(uid: string): void {
    const mod = this.state.ship.modules.find((m) => m.uid === uid);
    if (!mod) return;
    const def = getModule(mod.defId);
    if (def.category === 'command') {
      this.onNotify?.('The command cockpit cannot be removed.', 'error');
      audio.error();
      return;
    }
    const obj = this.moduleObjects.get(uid);
    const worldPos = obj ? obj.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
    if (!this.state.ship.remove(uid)) {
      this.onNotify?.('Removing that module would split the hull into disconnected pieces.', 'error');
      audio.error();
      return;
    }
    this.state.returnToInventory(mod.defId);
    this.fx.impact(worldPos, 0xff8a3c, 14, 12);
    audio.uiBack();
    this.rebuildShip();
    this.onShipChanged?.();
  }

  private tryBuyCell(cell: Vec3): void {
    const design = this.state.ship;
    if (!design.canBuyCell(cell)) {
      this.onNotify?.('Expansion cells must touch the existing frame.', 'error');
      audio.error();
      return;
    }
    const price = cellPrice(design.purchasedCount);
    if (this.state.credits < price) {
      this.onNotify?.(`Not enough credits - this cell costs ${price.toLocaleString()} CR.`, 'error');
      audio.error();
      return;
    }
    this.state.spendCredits(price);
    design.buyCell(cell);
    this.state.trackStat('cellsPurchased', 1);
    audio.purchase();
    this.onNotify?.(`Expansion cell installed for ${price.toLocaleString()} CR.`, 'success');
    this.rebuildGrid();
    this.centerShip();
    const world = new THREE.Vector3(cell[0] * CELL_SIZE, cell[1] * CELL_SIZE, cell[2] * CELL_SIZE).add(this.gridGroup.position);
    this.fx.impact(world, 0xffb700, 20, 16);
    this.onShipChanged?.();
  }

  // ------------------------------------------------------------------ frame
  update(dt: number): void {
    this.time += dt;
    this.hangarUpdate(this.time, dt);
    this.fx.update(dt);

    // Camera orbit.
    const pos = new THREE.Vector3().setFromSphericalCoords(this.orbit.radius, this.orbit.phi, this.orbit.theta);
    this.camera.position.copy(this.orbit.target).add(pos);
    this.camera.lookAt(this.orbit.target);

    // Idle ship animation: slow breathing hover + spinning sub-assemblies.
    this.shipGroup.rotation.y = this.mode === 'view' ? Math.sin(this.time * 0.12) * 0.12 : 0;
    this.shipGroup.children.forEach((child) => {
      child.traverse?.((o) => {
        if (o.name === 'spin') o.rotation.y += dt * 1.2;
      });
    });

    // Hover thrusters idle at low power.
    for (const { plume } of this.plumes) plume.setThrottle(this.mode === 'view' ? 0.22 + Math.sin(this.time * 2) * 0.05 : 0.08, dt);

    // Placement animations.
    for (let i = this.placementAnims.length - 1; i >= 0; i--) {
      const anim = this.placementAnims[i];
      anim.t += dt;
      const p = Math.min(1, anim.t / anim.duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const overshoot = 1 + Math.sin(p * Math.PI) * 0.18;
      anim.obj.scale.setScalar(eased * overshoot);
      if (p >= 1) {
        anim.obj.scale.setScalar(1);
        this.placementAnims.splice(i, 1);
      }
    }

    if (this.mode === 'build') this.updateBuildCursor();
    else this.updateStationHover();

    // Hangar ambience: dust motes drifting through the light shafts.
    if (Math.random() < 0.25) {
      this.fx.ambientDust(new THREE.Vector3(0, 20, 0), 70, 0xaac8ff, 1);
    }
  }

  private updateStationHover(): void {
    const hit = this.pickStation();
    for (const st of this.stations) {
      const isHit = hit?.id === st.id;
      const target = isHit ? 1.08 : 1;
      st.object.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    }
    this.canvas.style.cursor = hit ? 'pointer' : 'grab';
  }

  private updateBuildCursor(): void {
    this.raycaster.setFromCamera(new THREE.Vector2(this.input.mouse.x, this.input.mouse.y), this.camera);
    this.hoveredCell = null;
    this.hoveredModuleUid = null;

    // 1) Grid cell pick (empty owned cells / buyable candidates).
    const gridHits = this.raycaster.intersectObjects(this.gridGroup.children, false);
    if (gridHits.length > 0) {
      const cell = gridHits[0].object.userData.cell as Vec3 | undefined;
      if (cell) this.hoveredCell = [...cell] as Vec3;
    }

    // 2) Module pick for removal / info.
    if (!this.hoveredCell || !this.cellPurchaseMode) {
      const shipHits = this.raycaster.intersectObjects(this.shipGroup.children, true);
      if (shipHits.length > 0) {
        let o: THREE.Object3D | null = shipHits[0].object;
        while (o && !o.userData.uid) o = o.parent;
        if (o?.userData.uid) this.hoveredModuleUid = o.userData.uid as string;
      }
    }

    // Ghost preview.
    if (this.ghostMesh && this.selectedModule) {
      if (this.hoveredCell) {
        this.ghostMesh.visible = true;
        placeModuleObject(this.ghostMesh, this.selectedModule, this.hoveredCell, this.selectedOrientation);
        const issue = this.state.ship.checkPlacement(this.selectedModule, this.hoveredCell, this.selectedOrientation);
        this.placementValid = !issue;
        this.placementMessage = issue?.message ?? 'Valid placement';
        const color = issue ? 0xff3b6b : 0x00ff9d;
        this.ghostMesh.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) (m.material as THREE.MeshBasicMaterial).color.setHex(color);
        });
        // Cell footprint highlight.
        const cells = moduleCells(getModule(this.selectedModule), this.hoveredCell, this.selectedOrientation);
        void cells;
      } else {
        this.ghostMesh.visible = false;
        this.placementMessage = '';
      }
    }

    this.canvas.style.cursor = this.hoveredCell || this.hoveredModuleUid ? 'crosshair' : 'grab';
  }

  /** Short cinematic used when launching an expedition. */
  playLaunchSequence(onDone: () => void): void {
    audio.launch();
    const startY = this.shipGroup.position.y;
    const start = performance.now();
    const duration = 2100;
    for (const { plume } of this.plumes) plume.setThrottle(1.4, 0.016);
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t * t * t;
      this.shipGroup.position.y = startY + eased * 160;
      this.orbit.radius = 78 + eased * 60;
      this.orbit.phi = Math.max(0.1, 0.34 - eased * 0.2);
      if (Math.random() < 0.8) {
        this.fx.explosion(new THREE.Vector3((Math.random() - 0.5) * 20, 6, (Math.random() - 0.5) * 20), 0.35, 0xff8a3c);
      }
      if (t < 1) requestAnimationFrame(step);
      else {
        this.shipGroup.position.y = startY;
        onDone();
      }
    };
    requestAnimationFrame(step);
  }

  /** Highlights a station with a floating callout (used by the tutorial hints). */
  addCallout(stationId: HangarStation['id'], text: string): void {
    const st = this.stations.find((s) => s.id === stationId);
    if (!st) return;
    const label = makeLabelPlane(text, st.color, 10, 2.6);
    label.position.copy(st.position).add(new THREE.Vector3(0, 8, 0));
    this.scene.add(label);
  }
}

export { ShipDesign };
