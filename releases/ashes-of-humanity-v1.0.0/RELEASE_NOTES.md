# ASHES OF HUMANITY: LAST SIGNAL — v1.0.0

**A last radio tower still transmits somewhere beyond the Red Wasteland.**
Six connected regions of a dead world, one continuous campaign, a signal that
has to be found before the last of them stops breathing.

Original 3D post-apocalyptic survival action RPG for **Windows 64-bit**.

---

## Downloads

| File | Size | What it is |
|---|---|---|
| `ASHES_OF_HUMANITY_SETUP.exe` | ~27 MB | Self-extracting installer (icon, version info, desktop + Start Menu shortcuts, optional auto-launch) |
| `ASHES_OF_HUMANITY_WINDOWS.zip` | ~27 MB | Portable build — unzip anywhere and run `AshesOfHumanity.exe` |
| `ASHES_OF_HUMANITY_SOURCE.zip` | ~35 MB | Complete project source, engine, asset pipeline and generated assets |

> The engine resolves `assets/` next to the executable, so keep the folder
> structure produced by the installer or the zip.

---

## Engine (honest disclosure)

**This game is not made with Unreal Engine 5 or Godot.** Neither engine could be
obtained in the build environment — the Unreal binaries were not reachable and
the Godot editor plus its Windows export templates could not be downloaded
(the release CDN is blocked in this environment).

The game therefore runs on an **original engine written from scratch in C++17
against the OpenGL 3.3 core profile**, cross-compiled to Windows x86-64 with
the **Zig 0.13.0** toolchain (`zig c++ -target x86_64-windows-gnu -O2 -static`).
All art was authored offline in **Blender 4.5 LTS** and exported through a
custom container format written for this project (`.afm` meshes, `.aft`
textures, `.afa` animations).

| | |
|---|---|
| Engine | Original C++17 / OpenGL 3.3 renderer, physics, AI, UI, audio mixer |
| Toolchain | Zig 0.13.0, static CRT, no runtime dependencies |
| DCC | Blender 4.5.15 LTS (headless, procedural modelling, rigging, baking) |
| Target | Windows 64-bit (`x86_64-windows-gnu`) |

---

## Controls

| Key | Action | Key | Action |
|---|---|---|---|
| W A S D | Move | TAB | Inventory (GEAR / MEDICAL / WEAPON) |
| SHIFT | Sprint | J | Journal and quests |
| CTRL | Crouch | K | Skill trees |
| Z | Crawl (while crouched) | M | World map |
| SPACE | Jump / vault | SHIFT + C | Crafting |
| E | Interact / search / talk | B | Base building |
| F | Bandage bleeding | F3 | Performance overlay |
| R | Reload | ESC | Pause |
| LMB | Fire / swing | V | First / third person |
| RMB | Aim down sights | | |

---

## What is in the game

**World** — six hand-designed, continuous regions: Dead Suburbs, Blackwood
Forest, Industrial Zone, Forgotten City, Military Exclusion Zone and Red
Wasteland, with 87 sites (shops, shelters, bunkers, laboratories, watchtowers,
camp sites), a road network, landmarks, and interiors you can walk into.
Fractal terrain, mesh-derived collision, day/night cycle and dynamic weather
(clear, overcast, rain, fog, storm) with wind and visibility changes.

**Survival** — health, hunger, thirst, stamina, core body temperature,
radiation, infection, fatigue, bleeding and mental stress all interact. Body
damage is per body part (head, torso, arms, legs) with bleeding, fractures and
infection; the MEDICAL bay of the inventory shows the report and you bandage
yourself in the field.

**Combat** — 13 weapons from improvised pipe bats and spears through pistols,
shotguns, SMGs, assault rifles and a crossbow. Each has its own damage,
rate of fire, magazine, spread, recoil, falloff curve, durability and weight.
Aim down sights, attach optics, a suppressor, a grip or an extended magazine
and the numbers really change. Melee swings arc horizontally, projectiles
travel, hitboxes are vertical capsules, and the AI attacks with a token system
so you are never buried by a pack.

**Enemies** — ten mutant species with distinct silhouettes and behaviour
(sight, hearing, investigate, search, patrol, pursue, attack, retreat, group
alerting) plus six bosses with phases, telegraphed attacks, weak points and
their own arenas. Walking into an arena wakes its boss.

**Progression** — 50 levels, six attributes and four skill trees (Combat,
Survival, Engineering, Exploration) with 14 crafting recipes, blueprints and
workstations.

**Story** — 40 main quests across 8 acts, 60 side quests, a flag and
prerequisite system, branching dialogue, cinematic cutscenes and a journal.
Base building with snapping, collision and durability. Dynamic world events.

**Presentation** — dark industrial UI set (menu, settings, inventory, skills,
crafting, equipment, map, journal, dialogue, building, HUD, boss bars, death
and victory screens), Low/Medium/High/Ultra quality options, custom icon,
title art, loading screen and Win32 version information.

---

## Testing (actually executed in this environment)

```
$ ./build/AshesOfHumanity.exe --test
 RESULT: 81 passed, 0 failed

$ ./build/AshesOfHumanity.exe --sim 60
 sim: finished - hp=96.6 hunger=75.3 thirst=78.0 mutants=51 level=1
```

* 81 automated checks covering world generation, collision, item and weapon
  databases, inventory, crafting, combat, AI, quests, save/load and
  migration, audio, UI and the animator.
* A 60 second headless gameplay simulation that cycles through every
  gameplay state (inventory, map, skills, crafting, journal, building,
  dialogue, cutscene) without a crash.
* The Windows payload was verified by extracting the shipped installer and the
  shipped zip and comparing all 195 files byte for byte against the originals.

**Not verified:** the game has never been displayed in a real window — the
build machine has no GPU, no display server and no software OpenGL
implementation, so rendering could only be validated at the code level.

---

## Known limitations

* No multiplayer. Co-op was explicitly left out rather than shipping an
  unnetworked stub.
* No ragdoll physics; mutant and human bodies use authored animation.
* Doors are architectural openings rather than hinged physics objects.
* No voice acting; dialogue is text with typewriter presentation.
* The full render path (shadows, bloom, FXAA, particles) has not been
  inspected on real hardware.

---

All models, textures, animation, audio, story, UI and code in this project are
original work created for this release.
