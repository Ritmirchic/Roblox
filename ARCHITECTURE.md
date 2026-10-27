# ARCHITECTURE — ASHES OF HUMANITY: LAST SIGNAL

The game is a single-page WebGL2 application. `src/main.js` owns a `Game` object that
constructs every subsystem, runs the frame loop and exposes itself as `window.__game`
for the automated test harness. The renderer is Three.js (r180) with a custom shader
sky, custom terrain material and a post-processing chain.

## Frame

```
Game.loop(now)
 ├─ dt clamp, playtime, input snapshot
 ├─ player.update(dt)                 movement, stance, stamina, noise, flashlight
 ├─ combat.update(dt, input)          fire, melee, reload, grenades, fire fields, crosshair
 ├─ enemies.update(dt)                perception, packs, pathing, boss phases, projectiles
 ├─ survival.update(dt)               hunger/thirst/temperature/radiation/bleeding/pain/stress
 ├─ quests.update(dt)                 objective polling, markers, act transitions
 ├─ baseBuilding.update(dt)           ghost preview and validation
 ├─ world.update(dt, player)          lights, ambient life, region announcements, hazards
 ├─ directorUpdate(dt)                population director keeps the current region stocked
 ├─ camera + sky.update(dt, camera)   time of day drives lights, fog, sky uniforms
 ├─ postfx + renderer.render
 └─ hud.update(dt) + updateHud(dt)    vitals, weapon, clock, compass, minimap, XP
```

## Engine (`src/engine`)

| Module | Responsibility |
| --- | --- |
| `renderer.js` | WebGL2 renderer, PCF-soft shadows, ACES tone mapping, draw-distance presets |
| `sky.js` | Shader sky dome (zenith/horizon/gradient, sun disc, stars, cloud deck), sun/moon/hemisphere lights, exponential fog, weather-driven colour grading |
| `terrain.js` | Heightfield with region blending, road splines that flatten and tint the mesh, four-way splat albedo/normal material, chunked geometry |
| `textures.js` | Procedural texture library — every surface is painted into a canvas at boot (concrete, brick, wood, rust, metal, asphalt, foliage, …), with a deterministic cache |
| `geom.js` | `MeshBuilder` — accumulates boxes/cylinders/blobs/quads per material, merges into chunk meshes and registers collision boxes as it builds |
| `collision.js` | Uniform-grid broadphase, capsule-vs-box resolution, raycasts, `floorAt`, visibility tests |
| `postfx.js` | Vignette, grain, chromatic aberration, damage flash, fade |
| `input.js` | Keyboard/mouse state, pointer lock, edge detection, mouse wheel |
| `fx.js` | GPU-friendly particle groups: fire, smoke, blood, sparks, dust, rain |

## World (`src/world`)

`world.js` owns generation. It creates the terrain, the master road network between the
six region centres, then runs the region builders in `regions.js`. Each builder is a
hand-authored layout (streets, lots, landmarks, safe zones, boss arena, spawn zones)
rather than a noise scatter — the city, for example, lays out an avenue grid, fixed
landmark lots, then fills a 11×11 lot grid with towers, ruins, row-house strips and
plazas, skipping anything that would overlap a road or an existing building.

Buildings (`buildings.js`, `urban.js`) are generated room by room: floors, walls with
door and window openings, stairs, ceilings tagged for roof detection, furniture, and
loot containers on interior surfaces. Every solid surface registers a collider, so
interiors are walkable and shootable.

`props.js` provides the prop kit (vehicles, barrels, pipes, tents, fences, towers,
cooling towers, containers, corpses, vegetation). `npc.js` builds the humanoid rigs
used by NPCs and humanoid mutants from primitives with a role-specific kit.

## Entities (`src/entities`)

- `player.js` — capsule controller, sprint/crouch/jump, stamina, footsteps that emit
  noise events, flashlight spot light, view model, first/third person camera.
- `mutants.js` — ten species definitions with health, damage, speed, perception,
  palette, scale and rig parameters; six boss definitions with phases and specials.
- `ai.js` — `Enemy` state machine (idle/patrol/investigate/chase/attack/flee/stagger/
  special/dead) with sight cones, hearing from noise events, pack alerting, melee and
  ranged attacks, boss phase transitions and minion summons; `EnemyManager` handles
  spawning, culling, projectiles and serialization.
- `humanoid.js` — shared rig/animation for the player model, NPCs and humanoids.

## Systems (`src/systems`)

- `combat.js` — hitscan weapons with spread, bloom, recoil, falloff, location-based
  damage (head/torso/limb multipliers), attachments, magazines and reload, melee with
  backstab bonus, grenades and molotovs with simulated ballistic flight, persistent
  fire fields, repair and condition.
- `survival.js` — the survival simulation and its status effects.
- `inventory.js` — spatial grid inventory (10×7), rotation, stacking, weight, quick
  slots, equipment slots, serialization.
- `progression.js` — XP curve, levels 1–50, six attributes, four ranked skill trees.
- `quests.js` — 40 authored main quests across six acts and 60 generated side
  contracts; objective types search/reach/talk/kill/collect/craft/boss/build/survive;
  tracking, markers, rewards and act transitions.
- `crafting.js` — 29 recipes and a salvage system, gated by materials and skills.
- `basebuilding.js` — modular pieces with a snapping ghost preview, cost and collision
  validation, per-piece meshes, storage, roof detection for sleeping.
- `dialogue.js` — branching trees for the camp NPCs, with flags, trade, healing and
  repair actions.
- `settings.js` — quality presets (render scale, shadows, bloom, grain, draw distance),
  FOV, sensitivity, subtitles; applied live and persisted.
- `save.js` — versioned JSON snapshots in `localStorage` (autosave + three slots)
  covering player, survival, progression, inventory, combat, quests, dialogue,
  crafting, base, world, sky, stats and respawn point.

## UI (`src/ui`)

`hud.js` draws the in-game HUD (vitals with status chips, weapon panel, clock/weather,
compass, minimap with terrain relief and markers, boss bar, objectives, toasts,
interaction prompts, death screen). `screens.js` renders the menu system (inventory,
skills, journal, crafting, base building, sector map, settings, credits) and the
dialogue overlay, and owns the `menu-mode` body class that dims the 3D layer behind it.
`icons.js` is a hand-drawn SVG icon set — no emoji, no external icon font.

## Testing (`tools`)

`tools/test-runner.mjs` launches the production bundle in headless Chromium with
SwiftShader WebGL2 and drives the live game: 54 assertions covering world content,
movement, every combat path, boss behaviour, survival items, inventory, progression,
quests, crafting, building, dialogue, UI panes, HUD bindings, settings, save/load,
death/respawn and interaction. It runs against `http://127.0.0.1:8080/` during
development and against the packaged single-file build over `file://`.

`tools/build.mjs` bundles with esbuild; `tools/package.mjs` inlines the bundle and
stylesheet into one HTML file, writes the Windows launcher and both archives.

## Design notes

- Determinism: world generation uses seeded RNGs (`makeRng`) per region, so the map is
  identical on every launch and saves only need to store dynamic state.
- Performance: static geometry is merged per 520 m chunk and per material; containers
  and distant mutants are culled by distance; the minimap repaints at 6 Hz; the terrain
  is 240 m chunks so frustum culling can drop whole regions.
- No external assets: the build ships one JS file and one HTML file. Textures, audio
  and geometry are synthesised at boot on the CPU, which keeps the download under 1 MB
  and makes the game fully offline.
