// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/events.js — dynamic world events, ambient encounters
// ============================================================
import * as THREE from 'three';
import { MUTANTS } from './data.js';
import { makeLootMesh } from '../world/props.js';
import { RNG, clamp } from '../core/util.js';

// Each event fires once the cooldown expires, weighted by region danger.
const DEFS = [
  {
    id: 'supply_drop', name: 'SUPPLY DROP', weight: 3, minAct: 1,
    announce: 'A cargo parachute is drifting down. Warden colours. Something else saw it too.',
    run(g, rng) {
      const px = g.player.pos.x, pz = g.player.pos.z;
      for (let i = 0; i < 20; i++) {
        const a = rng.range(0, Math.PI * 2), r = rng.range(26, 46);
        const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
        if (g.world.heightAt(x, z) === null) continue;
        const spot = g.spawnSupplyCrate(x, z, 'military');
        if (spot) { g.setWaypoint(x, z); break; }
      }
      for (let i = 0; i < 3; i++) g.spawnEnemyNear('hollow', 30, 40);
    },
  },
  {
    id: 'swarm', name: 'SWARM', weight: 4, minAct: 2,
    announce: 'The ground is moving. Something upstream woke the nest.',
    run(g, rng) {
      const n = 4 + Math.floor(rng.range(0, 4));
      for (let i = 0; i < n; i++) g.spawnEnemyNear(rng.pick(['crawler', 'crawler', 'hollow']), 34, 55);
      g.audio.enemyAlert('hollow', g.player.pos);
    },
  },
  {
    id: 'rad_storm', name: 'RADIATION STORM', weight: 2, minAct: 3, regions: ['wasteland', 'industrial', 'military'],
    announce: 'The air turns to static. Geiger counters sound like rain. Get under cover.',
    run(g) {
      g.sky.setWeather('radstorm', false);
      g.eventState.radStorm = 110;
      for (const poi of g.world.pois) if (poi.type === 'shelter') g.setWaypoint(poi.x, poi.z);
    },
    tick(g, dt) {
      const s = g.eventState;
      if (s.radStorm > 0) {
        s.radStorm -= dt;
        const env = g.world.environmentAt ? g.world.environmentAt(g.player.pos.x, g.player.pos.z) : null;
        const sheltered = env?.indoor;
        if (!sheltered) {
          const resist = 1 - (g.player.armorRadRes || 0) * 1.1;
          g.player.stats.radiation = clamp(g.player.stats.radiation + dt * 0.55 * resist, 0, 100);
        }
        if (s.radStorm <= 0) {
          g.sky.setWeather('overcast', false);
          g.notify('The storm passes', 'The static dies down. Your teeth stop buzzing.', null, 'good');
        }
      }
    },
  },
  {
    id: 'night_hunt', name: 'NIGHT HUNT', weight: 3, minAct: 2, night: true,
    announce: 'Something is walking the ridge. It has stopped making noise on purpose.',
    run(g, rng) {
      g.spawnEnemyNear('pale', 40, 60);
      for (let i = 0; i < 2; i++) g.spawnEnemyNear('stalker', 30, 50);
      g.audio.paleHowl?.();
    },
  },
  {
    id: 'signal_pulse', name: 'SIGNAL PULSE', weight: 2, minAct: 3,
    announce: 'Every radio in the district clicks on at once. A voice gives coordinates.',
    run(g) {
      const p = g.world.pois[Math.floor(Math.random() * g.world.pois.length)];
      g.setWaypoint(p.x, p.z);
      g.spawnEnemyNear('watcher', 40, 55);
      g.spawnEnemyNear('watcher', 45, 60);
      g.notify('Coordinates', `${p.name.toUpperCase()} — ${Math.round(p.x)}, ${Math.round(p.z)}`, null, 'quest');
    },
  },
  {
    id: 'stray_trader', name: 'STRAY TRADER', weight: 2, minAct: 1,
    announce: 'A bell in the fog. Somebody is trading out here, which means somebody is desperate.',
    run(g, rng) {
      // a wandering trader drops a small cache and marks it
      const px = g.player.pos.x, pz = g.player.pos.z;
      const a = rng.range(0, Math.PI * 2), r = rng.range(18, 28);
      const spot = g.spawnSupplyCrate(px + Math.cos(a) * r, pz + Math.sin(a) * r, 'store');
      if (spot) g.setWaypoint(spot.x, spot.z);
    },
  },
  {
    id: 'howl', name: 'DISTANT HOWL', weight: 3, minAct: 1,
    announce: 'Something answers from the treeline. Then something closer answers it.',
    run(g, rng) {
      for (let i = 0; i < 2; i++) g.spawnEnemyNear(rng.pick(['hollow', 'crawler']), 45, 70);
      g.audio.enemyAlert('hollow', g.player.pos, 1);
    },
  },
];

export class WorldEvents {
  constructor(game) {
    this.game = game;
    this.rng = new RNG(0x9e3779b9);
    this.cooldown = 95;
    this.active = [];
    this.state = {};
    this.total = 0;
  }

  update(dt) {
    const g = this.game;
    for (const ev of DEFS) if (ev.tick) ev.tick(g, dt);
    if (g.locked || g.player.dead) return;
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    this.cooldown = this.rng.range(110, 210);
    this.fire();
  }

  eligible() {
    const g = this.game;
    const act = g.act || 1;
    const region = g.world.regionAt(g.player.pos.x, g.player.pos.z)?.id;
    const night = g.sky?.isNight;
    return DEFS.filter((d) => {
      if (d.minAct > act) return false;
      if (d.regions && !d.regions.includes(region)) return false;
      if (d.night && !night) return false;
      return true;
    });
  }

  fire(forceId = null) {
    const g = this.game;
    const pool = this.eligible();
    if (!pool.length) return null;
    let def = forceId ? DEFS.find((d) => d.id === forceId) : null;
    if (!def) {
      const total = pool.reduce((a, d) => a + d.weight, 0);
      let t = this.rng.next() * total;
      def = pool[0];
      for (const d of pool) { t -= d.weight; if (t <= 0) { def = d; break; } }
    }
    this.total++;
    g.audio.eventSting?.();
    g.ui.notify(def.name, def.announce, '#c9963f', 'danger');
    try { def.run(g, this.rng); } catch (err) { console.warn('event failed', def.id, err); }
    this.active.push({ id: def.id, t: 0, life: 150 });
    return def;
  }

  serialize() { return { cooldown: this.cooldown, total: this.total }; }
  deserialize(d) { if (d) { this.cooldown = d.cooldown ?? 95; this.total = d.total || 0; } }
}
