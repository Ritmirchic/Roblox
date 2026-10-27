# ASHES OF HUMANITY: LAST SIGNAL

**Original post-apocalyptic open-world survival action RPG for Windows (64-bit).**
Version 1.0.0 · WebGL2 / Three.js engine · fully offline · single self-contained build.

> No third-party art, audio, fonts or code assets. Every texture, model, sound and
> line of dialogue is generated procedurally by this repository.

---

## What this is

Six hand-planned regions on one continuous 3 km × 3 km world map, ten mutant species,
six boss encounters, forty main story quests and sixty side contracts, four skill trees,
grid inventory, weapon attachments, crafting, base building, day/night cycle, weather,
radiation, dialogue trees and a versioned save system — all running in a native window
on Windows 10/11 without a server, an internet connection, or an installer.

## Download

| Build | File | Notes |
| --- | --- | --- |
| Windows (64-bit) | `ASHES_OF_HUMANITY_WINDOWS.zip` | Extract, double-click `ASHES_OF_HUMANITY.bat` |
| Source | `ASHES_OF_HUMANITY_SOURCE.zip` | Full engine, world generators and test suite |

Get them from the [releases page](https://github.com/Ritmirchic/Roblox/releases).

**Requirements:** Windows 10/11 64-bit, Microsoft Edge (preinstalled) or Google Chrome,
a GPU with WebGL2 (any DirectX 11 class card), 4 GB RAM. No internet needed.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| `Shift` | Sprint (drains stamina) |
| `C` / `Ctrl` | Crouch (quieter, smaller silhouette) |
| `Space` | Jump / vault |
| Mouse | Look, aim down sights |
| `LMB` / `RMB` | Fire / heavy melee |
| `R` | Reload |
| `1`–`4`, `Q`, wheel | Weapon slots and cycling |
| `G` | Throw grenade / molotov |
| `E` | Interact |
| `F` | Flashlight |
| `X` | Toggle first / third person |
| `Tab` `J` `K` `B` `V` `M` `O` | Inventory · Journal · Skills · Crafting · Build · Map · Settings |
| `Z` | Sleep (needs a roof) |
| `Esc` | Pause |
| `F11` | Fullscreen (browser window) |

## Content

**Regions** — The Dead Suburbs · Blackwood Forest · The Industrial Zone ·
The Forgotten City · The Military Exclusion Zone · The Red Wasteland.

**Mutants** — The Hollow, Crawler, Watcher, Screamer, Brute, Mimic, Burrower,
Stalker, Contaminated, Pale.

**Bosses** — The Hollow King, The Forest Matriarch, The Iron Abomination,
The Pale Commander, The Contaminated Titan, The Last Signal.

**Survival** — hunger, thirst, stamina, body temperature, radiation, infection,
bleeding, pain, stress, fractures, fatigue; food, water, medicine and sleep feed back
into health regeneration, aim sway and movement speed.

**Progression** — level 1–50, six attributes (Strength, Endurance, Agility, Perception,
Technical Skill, Survival Knowledge), four skill trees with ranked perks, XP from kills,
quests, crafting, building and exploration.

**Items** — 81 item definitions across weapons, ammunition, medical supplies, food,
water, tools, materials, attachments, throwables and valuables; a 10×7 spatial grid
with rotation, stacking, weight and carry capacity.

**World systems** — day/night cycle with a shader sky, star field and moon; dynamic
weather with storms, rain, fog and rad storms; radioactive hazard pools; safe zones;
loot containers with lockpicking; doors; NPC dialogue trees; quest markers and a
sector map.

## Building from source

```bash
npm install
npm run start      # dev server on http://127.0.0.1:8080
npm run build      # bundles release/web/game.js
npm test           # 54-check automated gameplay suite (headless Chromium)
npm run release    # produces the Windows and source archives
```

`npm test` boots the real production bundle, starts a campaign and drives the live
game objects — movement, shooting, melee, grenades, fire, boss phases, survival items,
inventory, quests, crafting, building, dialogue, every UI pane, settings, save/load,
death and respawn. It is not a mocked suite.

## Layout

```
src/engine      renderer, sky, terrain, textures, geometry builder, collision, postfx, input, fx
src/world       world generation, six region builders, buildings, props, urban set, NPC rigs
src/entities    player, humanoids, mutant AI and bosses, projectiles
src/systems     combat, survival, inventory, progression, quests, crafting, base building,
                dialogue, settings, save
src/ui          HUD, menu screens, icon set
src/data        item definitions and loot tables
tools           build, dev server, packaging, headless browser harness, test runner
web             HTML shell and stylesheet
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the subsystem map and design notes.
