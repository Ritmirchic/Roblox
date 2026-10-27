/**
 * Base building: modular shelters placed by the player. Ghost preview follows
 * the terrain, snaps to a 1 m grid and to existing pieces, validates against
 * collision and cost, then registers real geometry plus a collider.
 */
import * as THREE from 'three';
import { clamp } from '../engine/util.js';
import { MeshBuilder } from '../engine/geom.js';

const PIECES = [
  {
    id: 'foundation', name: 'Foundation', icon: 'build', size: [4, 4], hp: 400,
    cost: [['mat_wood', 6], ['mat_scrap', 2]],
    desc: 'Level base for any structure. Walls and floors snap to it.',
    build: (b, x, y, z, rot) => {
      b.box(x, y + 0.12, z, 4, 0.24, 4, 'woodFloor', { tex: 2, collideTag: 'floor' });
      b.box(x, y + 0.02, z, 4.2, 0.06, 4.2, 'concrete', { tex: 1.5, collide: false, tint: [0.6, 0.58, 0.54] });
    },
  },
  {
    id: 'floor', name: 'Floor Panel', icon: 'build', size: [4, 4], hp: 250,
    cost: [['mat_wood', 4]],
    desc: 'Raised floor panel for a second level.',
    build: (b, x, y, z) => b.box(x, y + 0.1, z, 4, 0.2, 4, 'woodFloor', { tex: 2, collideTag: 'floor' }),
  },
  {
    id: 'wall', name: 'Wall', icon: 'build', size: [4, 3], hp: 300,
    cost: [['mat_wood', 3], ['mat_scrap', 1]],
    desc: 'Solid wall. Stops mutants and bullets.',
    build: (b, x, y, z, rot) => {
      // wall spans X locally, rotated by rot
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const hx = 2 * c;
      const hz = 2 * s;
      b.box(x, y + 1.5, z, 4, 3, 0.2, 'wood', { tex: 2, rotY: rot, collideTag: 'wall' });
      // studs
      for (let i = -1; i <= 1; i++) {
        b.box(x + (hx / 2) * i, y + 1.5, z + (hz / 2) * i, 0.14, 3, 0.28, 'wood', { tex: 0.8, rotY: rot, collide: false, tint: [0.72, 0.64, 0.54] });
      }
      b.box(x, y + 2.98, z, 4.1, 0.16, 0.34, 'wood', { tex: 1, rotY: rot, collide: false, tint: [0.66, 0.6, 0.5] });
    },
  },
  {
    id: 'wall_window', name: 'Window Wall', icon: 'build', size: [4, 3], hp: 240,
    cost: [['mat_wood', 3], ['mat_scrap', 1], ['mat_cloth', 1]],
    desc: 'Wall with a window opening for sightlines.',
    build: (b, x, y, z, rot) => {
      b.box(x, y + 1.5, z, 4, 3, 0.2, 'wood', { tex: 2, rotY: rot, collideTag: 'wall' });
      // window "cut" visual: dark recessed panel
      b.box(x, y + 1.85, z, 1.5, 1.0, 0.06, 'glass', { tex: 1, rotY: rot, collide: false, tint: [0.24, 0.3, 0.3] });
      b.box(x, y + 1.3, z, 1.7, 0.1, 0.24, 'wood', { tex: 0.6, rotY: rot, collide: false });
    },
  },
  {
    id: 'doorway', name: 'Doorway', icon: 'build', size: [4, 3], hp: 260,
    cost: [['mat_wood', 3], ['mat_scrap', 1]],
    desc: 'Wall with a door opening. Add a door to lock it.',
    build: (b, x, y, z, rot) => {
      b.box(x - Math.cos(rot) * 1.6, y + 1.5, z - Math.sin(rot) * 1.6, 0.8, 3, 0.2, 'wood', { tex: 1.6, rotY: rot, collideTag: 'wall' });
      b.box(x + Math.cos(rot) * 1.6, y + 1.5, z + Math.sin(rot) * 1.6, 0.8, 3, 0.2, 'wood', { tex: 1.6, rotY: rot, collideTag: 'wall' });
      b.box(x, y + 2.6, z, 2.4, 0.8, 0.2, 'wood', { tex: 1.2, rotY: rot, collideTag: 'wall' });
      b.box(x, y + 1.5, z, 2.6, 0.14, 0.4, 'wood', { tex: 0.7, rotY: rot, collide: false, tint: [0.66, 0.6, 0.5] });
    },
  },
  {
    id: 'roof', name: 'Roof Panel', icon: 'build', size: [4, 4], hp: 260,
    cost: [['mat_wood', 5], ['mat_scrap', 1]],
    desc: 'Keeps the rain off and completes a shelter.',
    build: (b, x, y, z) => {
      b.box(x, y + 0.14, z, 4.2, 0.22, 4.2, 'roof', { tex: 2, collideTag: 'ceiling' });
      b.box(x, y + 0.3, z, 4.3, 0.06, 4.3, 'metalPlate', { tex: 1.5, collide: false, tint: [0.42, 0.44, 0.42] });
    },
  },
  {
    id: 'door', name: 'Door', icon: 'lock', size: [1, 2], hp: 180,
    cost: [['mat_wood', 2], ['mat_scrap', 1]],
    desc: 'A hinged door that can be locked from the inside.',
    build: () => {},
  },
  {
    id: 'workbench', name: 'Workbench', icon: 'craft', size: [3, 2], hp: 200,
    cost: [['mat_wood', 6], ['mat_scrap', 2]],
    desc: 'Enables advanced crafting recipes.',
    build: (b, x, y, z) => {
      b.box(x, y + 0.9, z, 2.6, 0.14, 1.0, 'wood', { tex: 1.4, tint: [0.88, 0.8, 0.68] });
      for (const dx of [-1.1, 1.1]) for (const dz of [-0.38, 0.38]) b.box(x + dx, y + 0.45, z + dz, 0.12, 0.9, 0.12, 'wood', { tex: 0.6, collide: false });
      b.box(x + 0.7, y + 1.0, z, 0.3, 0.18, 0.3, 'rust', { tex: 0.4, collide: false });
      b.box(x - 0.8, y + 1.02, z - 0.1, 0.5, 0.06, 0.24, 'metalPlate', { tex: 0.4, collide: false });
    },
  },
  {
    id: 'storage', name: 'Storage Crate', icon: 'bagGrid', size: [2, 2], hp: 220,
    cost: [['mat_wood', 5], ['mat_scrap', 1]],
    desc: 'Stores up to 40 item stacks. Survives death.',
    build: (b, x, y, z) => {
      b.box(x, y + 0.55, z, 1.6, 1.1, 1.1, 'wood', { tex: 1.2, collideTag: 'container' });
      b.box(x, y + 1.12, z, 1.7, 0.1, 1.2, 'wood', { tex: 0.9, collide: false, tint: [0.6, 0.52, 0.42] });
      b.box(x, y + 0.7, z + 0.56, 0.5, 0.1, 0.06, 'metalPlate', { tex: 0.4, collide: false, tint: [0.5, 0.52, 0.5] });
    },
  },
  {
    id: 'bed', name: 'Bedroll', icon: 'shelter', size: [1, 2], hp: 120,
    cost: [['mat_cloth', 4], ['mat_wood', 2]],
    desc: 'Sleep to skip the night. Requires a roof.',
    build: (b, x, y, z) => {
      b.box(x, y + 0.18, z, 0.9, 0.16, 2.0, 'fabric', { tex: 1, collide: false, tint: [0.45, 0.42, 0.36] });
      b.box(x, y + 0.3, z - 0.75, 0.8, 0.18, 0.5, 'fabric', { tex: 0.8, collide: false, tint: [0.6, 0.58, 0.5] });
    },
  },
  {
    id: 'campfire', name: 'Campfire', icon: 'flame', size: [2, 2], hp: 100,
    cost: [['mat_wood', 4], ['mat_cloth', 1]],
    desc: 'Warmth, light, and cooking. Attracts attention.',
    build: (b, x, y, z, rot, world) => {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        b.box(x + Math.cos(a) * 0.62, y + 0.12, z + Math.sin(a) * 0.62, 0.22, 0.22, 0.22, 'rock', { tex: 0.5, collide: false });
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        b.box(x, y + 0.16, z, 0.9, 0.16, 0.16, 'wood', { tex: 0.6, rotY: a, collide: false, tint: [0.4, 0.32, 0.24] });
      }
      b.glow(x, y + 0.35, z, 0.4, 0.5, 0.4, 0xff9040, { intensity: 0.9 });
      world?.addLight(x, y + 0.9, z, 0xff8a40, 9, 10);
    },
  },
  {
    id: 'lamp', name: 'Hanging Lamp', icon: 'flame', size: [1, 1], hp: 80,
    cost: [['mat_scrap', 1], ['mat_battery_cell', 1]],
    desc: 'Electric light. Lasts until the battery dies.',
    build: (b, x, y, z, rot, world) => {
      b.box(x, y + 2.2, z, 0.12, 0.3, 0.12, 'metalPlate', { tex: 0.4, collide: false });
      b.glow(x, y + 2.0, z, 0.22, 0.16, 0.22, 0xffd8a0, { intensity: 1.1 });
      world?.addLight(x, y + 1.95, z, 0xffd0a0, 7, 9);
    },
  },
  {
    id: 'barricade', name: 'Barricade', icon: 'build', size: [4, 2], hp: 380,
    cost: [['mat_wood', 4], ['mat_scrap', 2], ['mat_tape', 1]],
    desc: 'Reinforced barrier. Slows anything that gets through.',
    build: (b, x, y, z, rot) => {
      b.box(x, y + 0.7, z, 4, 1.4, 0.4, 'wood', { tex: 2, rotY: rot, collideTag: 'wall', tint: [0.66, 0.58, 0.48] });
      b.box(x, y + 1.05, z, 4.1, 0.2, 0.5, 'rust', { tex: 1, rotY: rot, collide: false });
      for (const dx of [-1.6, 1.6]) b.box(x + Math.cos(rot) * dx, y + 0.35, z + Math.sin(rot) * dx, 0.4, 0.7, 0.7, 'concrete', { tex: 0.8, rotY: rot, collide: false, tint: [0.66, 0.64, 0.6] });
    },
  },
  {
    id: 'water_collector', name: 'Rain Collector', icon: 'water', size: [2, 2], hp: 140,
    cost: [['mat_scrap', 3], ['mat_cloth', 2], ['mat_wood', 2]],
    desc: 'Collects dirty water. Slow, but reliable.',
    build: (b, x, y, z) => {
      b.box(x, y + 0.5, z, 0.9, 1.0, 0.9, 'metalPlate', { tex: 1, tint: [0.5, 0.52, 0.5] });
      b.box(x, y + 1.25, z, 1.6, 0.08, 1.2, 'fabric', { tex: 1, rotX: 0.18, collide: false, tint: [0.4, 0.44, 0.4] });
      for (const dx of [-0.6, 0.6]) for (const dz of [-0.4, 0.4]) b.box(x + dx, y + 0.85, z + dz, 0.08, 0.9, 0.08, 'metalPlate', { tex: 0.4, collide: false });
    },
  },
];

export class BaseBuilding {
  constructor(game) {
    this.game = game;
    this.pieces = PIECES;
    this.placed = [];
    this.selected = null;
    this.ghost = null;
    this.ghostValid = false;
    this.rot = 0;
    this.group = new THREE.Group();
    this.group.name = 'player_base';
    game.scene.add(this.group);
    this.pieceMeshes = new Map();
    this.storage = new Map(); // pieceId -> array of item stacks
    this.grid = 1;
    this.snapRange = 4.2;
    this.range = 6.5;
    this.containers = [];
  }

  pieceDef(id) {
    return PIECES.find((p) => p.id === id);
  }

  selectPiece(id) {
    const def = this.pieceDef(id);
    if (!def) return;
    this.selected = def.id;
    if (this.ghost) {
      this.group.remove(this.ghost);
      this.disposeGhost();
    }
    const g = new THREE.Group();
    // ghost marker: wireframe box sized to the piece + translucent fill
    const w = def.size[0];
    const h = def.size[1];
    const geo = new THREE.BoxGeometry(w, h, w);
    const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x6fd07a, transparent: true, opacity: 0.22, depthWrite: false }));
    fill.position.y = h / 2;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x9cf0a8 }));
    edges.position.y = h / 2;
    g.add(fill);
    g.add(edges);
    g.fill = fill;
    g.edges = edges;
    this.ghost = g;
    this.group.add(g);
    this.game.audio?.play('uiClick');
  }

  disposeGhost() {
    if (!this.ghost) return;
    this.ghost.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.ghost = null;
  }

  cancel() {
    if (this.ghost) this.group.remove(this.ghost);
    this.disposeGhost();
    this.selected = null;
    this.game.hud?.hideBuildHint();
  }

  rotate(delta) {
    this.rot += delta;
  }

  canAfford(def) {
    return def.cost.every(([id, n]) => this.game.inventory.count(id) >= n);
  }

  /** Snap target position in front of the player. */
  targetPosition() {
    const p = this.game.player;
    const dir = p.flatForward;
    const d = Math.max(2.2, this.range * 0.62);
    let x = p.position.x + dir.x * d;
    let z = p.position.z + dir.z * d;
    // snap to grid
    x = Math.round(x / this.grid) * this.grid;
    z = Math.round(z / this.grid) * this.grid;
    // snap to same-y placed pieces to allow building upwards
    let y = this.game.world.groundY(x, z);
    for (const piece of this.placed) {
      const dist = Math.hypot(piece.x - x, piece.z - z);
      if (dist < this.snapRange) {
        if (piece.defId === 'foundation' || piece.defId === 'floor') y = Math.max(y, piece.y + 0.24);
        else if (piece.defId === 'wall') y = Math.max(y, piece.y);
      }
    }
    return { x, y, z };
  }

  validate(def, x, y, z) {
    if (!this.canAfford(def)) return 'MISSING MATERIALS';
    const world = this.game.world;
    // keep off steep slopes
    const h = world.terrain.heightAt(x, z);
    const slope = Math.abs(world.terrain.heightAt(x + 1, z) - h) + Math.abs(world.terrain.heightAt(x, z + 1) - h);
    if (def.id !== 'lamp' && slope > 1.6) return 'GROUND TOO STEEP';
    // must be near the player
    const p = this.game.player.position;
    if (Math.hypot(p.x - x, p.z - z) > this.range) return 'TOO FAR';
    // overlap check against existing pieces and world colliders
    const w = def.size[0] / 2;
    for (const piece of this.placed) {
      if (Math.abs(piece.x - x) < w + piece.w / 2 - 0.35 && Math.abs(piece.z - z) < w + piece.w / 2 - 0.35 && Math.abs(piece.y - y) < 1.6) {
        return 'BLOCKED BY STRUCTURE';
      }
    }
    if (def.id === 'foundation' || def.id === 'wall' || def.id === 'barricade') {
      const boxes = this.game.collision.grid.query(x - w, z - w, x + w, z + w, []);
      for (const b of boxes) {
        if (b.tag === 'floor' || b.tag === 'ceiling' || b.tag === 'door' || b.tag === 'container') continue;
        const overlapX = Math.min(x + w, b.maxX) - Math.max(x - w, b.minX);
        const overlapZ = Math.min(z + w, b.maxZ) - Math.max(z - w, b.minZ);
        if (overlapX > 0.4 && overlapZ > 0.4 && b.maxY > y + 0.3 && b.minY < y + def.size[1]) return 'BLOCKED BY GEOMETRY';
      }
    }
    return null;
  }

  updateGhost() {
    if (!this.selected || !this.ghost) return;
    const def = this.pieceDef(this.selected);
    const t = this.targetPosition();
    this.ghost.position.set(t.x, t.y, t.z);
    this.ghost.rotation.y = this.rot;
    this.ghostFillTarget = t;
    const err = this.validate(def, t.x, t.y, t.z);
    this.ghostValid = !err;
    const color = err ? 0xc0503a : 0x6fd07a;
    this.ghost.fill.material.color.setHex(color);
    this.ghost.edges.material.color.setHex(err ? 0xe07a60 : 0x9cf0a8);
    const costText = def.cost.map(([id, n]) => `${id.replace(/^mat_/, '').toUpperCase()} ${this.game.inventory.count(id)}/${n}`).join('   ');
    this.game.hud?.showBuildHint(def.name, costText, err || 'LEFT CLICK TO PLACE   -   R ROTATE   -   Q CANCEL');
  }

  /** Build one placed piece into its own small mesh group so it is drawn immediately. */
  buildPieceMesh(piece) {
    const def = this.pieceDef(piece.defId);
    if (!def || def.id === 'door') return null;
    const prev = this.pieceMeshes.get(piece.id);
    if (prev) { this.group.remove(prev); prev.traverse((o) => { o.geometry?.dispose(); }); }
    const b = new MeshBuilder(this.game.textures, this.game.collision, { seed: 7 });
    def.build(b, piece.x, piece.y, piece.z, piece.rot, this.game.world);
    const { group } = b.buildChunked(1e6);
    group.userData.pieceId = piece.id;
    this.group.add(group);
    this.pieceMeshes.set(piece.id, group);
    return group;
  }

  place() {
    if (!this.selected) return false;
    const def = this.pieceDef(this.selected);
    const t = this.targetPosition();
    const err = this.validate(def, t.x, t.y, t.z);
    if (err) {
      this.game.audio?.play('deny');
      this.game.notify(err, 'danger', 'BASE BUILDING');
      return false;
    }
    if (def.id === 'door') {
      // doors are built through the doorway piece: spawn a Door interactable
      const rot = this.rot;
      this.game.world.addDoor({ x: t.x, y: t.y, z: t.z, rot, w: 1.1, h: 2.2, kind: 'wood', open: false });
    }
    for (const [id, n] of def.cost) this.game.inventory.removeById(id, n);
    const piece = { id: this.placed.length, defId: def.id, x: t.x, y: t.y, z: t.z, rot: this.rot, w: def.size[0], h: def.size[1], hp: def.hp, name: def.name };
    this.placed.push(piece);
    if (def.id !== 'door') this.buildPieceMesh(piece);
    this.game.audio?.play('build');
    this.game.quests?.onBuild?.();
    this.game.progression.awardXp(18, 'building');
    this.game.notify(`${def.name} placed.`, 'item', 'CONSTRUCTION');
    if (def.id === 'storage') this.storage.set(piece.id, []);
    return true;
  }

  /** True when a roof exists above the given point (allows sleeping). */
  hasRoof(x, z, y) {
    const boxes = this.game.collision.grid.query(x - 1, z - 1, x + 1, z + 1, []);
    for (const b of boxes) {
      if (b.tag !== 'ceiling' && b.tag !== 'roof') continue;
      if (b.minY > y + 1.2 && b.minY < y + 6) return true;
    }
    return false;
  }

  sleep() {
    const p = this.game.player;
    const box = this.game.collision.grid.query(p.position.x - 2, p.position.z - 2, p.position.x + 2, p.position.z + 2, []);
    const roofed = box.some((b) => (b.tag === 'ceiling' || b.tag === 'roof') && b.minY > p.position.y + 1.0 && b.minY < p.position.y + 6);
    if (!roofed) {
      this.game.notify('You need a roof over your head to sleep.', 'danger', 'REST');
      return false;
    }
    if (this.game.enemies.countAliveNear(p.position, 30) > 0) {
      this.game.notify('Not while something is hunting you.', 'danger', 'REST');
      return false;
    }
    this.game.sleepUntilMorning?.();
    return true;
  }

  nearestWorkbench() {
    const p = this.game.player.position;
    let best = null;
    for (const piece of this.placed) {
      if (piece.defId !== 'workbench') continue;
      const d = Math.hypot(piece.x - p.x, piece.z - p.z);
      if (d < 3.0 && (!best || d < best.d)) best = { piece, d };
    }
    return best;
  }

  nearestStorage() {
    const p = this.game.player.position;
    let best = null;
    for (const piece of this.placed) {
      if (piece.defId !== 'storage') continue;
      const d = Math.hypot(piece.x - p.x, piece.z - p.z);
      if (d < 2.6 && (!best || d < best.d)) best = { piece, d };
    }
    return best;
  }

  update(dt) {
    if (this.selected) this.updateGhost();
  }

  serialize() {
    return {
      placed: this.placed,
      storage: [...this.storage.entries()].map(([k, v]) => [k, v.map((s) => ({ id: s.id, qty: s.qty }))]),
    };
  }

  deserialize(d) {
    if (!d) return;
    this.placed = d.placed || [];
    this.storage = new Map((d.storage || []).map(([k, v]) => [k, v]));
    // rebuild geometry for loaded pieces
    for (const mesh of this.pieceMeshes.values()) {
      this.group.remove(mesh);
      mesh.traverse((o) => { o.geometry?.dispose(); });
    }
    this.pieceMeshes.clear();
    for (const piece of this.placed) this.buildPieceMesh(piece);
  }
}
