# Ashes of Humanity: Last Signal

Original 3D post-apocalyptic open-world survival action RPG for Windows 64-bit.
Built with **Godot 4.7.2-stable** and **Blender (bpy)** — every asset, sound and
script in this repository is original and produced procedurally.

## Features

- **Six curated regions**: Dead Suburbs, Blackwood Forest, Industrial Belt,
  Ruined City, Exclusion Zone, Red Wasteland — 700x760 m streamed terrain with
  baked navigation, roads, landmarks, buildings, props and safe camps.
- **10 mutant species + 4 bosses**, each with distinct stats, perception,
  FOV/hearing, behavior AI (sound hunters, swarmers, watchers, screamers that
  summon, chargers, ambushers, burrowers, flankers, radiation auras, predators)
  and multi-phase boss encounters with weak points.
- **Survival vitals**: health, hunger, thirst, stamina, temperature, radiation,
  infection, fatigue, bleeding and fractures — every effect has a real
  consequence and a craftable treatment.
- **Grid inventory** (10x16) with item dimensions, weight, stacking and
  rectangle packing; equipment slots with durability.
- **Combat**: 4 melee weapons, 4 ranged weapons with ADS, recoil, spread,
  falloff, reloads, ammo types, headshot multipliers and noise propagation.
- **18 crafting recipes** (field, campfire, workbench), **12 base structures**
  including functional turret, storage, sleep, rain collector and radio tower.
- **18 perks across 3 skill trees** with real numeric gameplay effects.
- **17 main + 14 side quests**, branching dialogue with 8 NPCs, a trader,
  dynamic world events (supply drops, migrations, storms, shelter assaults).
- Day/night cycle (34 min days), 5 weather states affecting visibility,
  temperature and enemy aggression.
- Full save/load with 5 slots, autosave, corruption backup and migration path.

## Running from source

1. Install Godot 4.7.2-stable.
2. Open this folder in the editor (main scene `scenes/Boot.tscn`) or run:
   `Godot_v4.7.2-stable --path .`
3. Headless smoke test (44 integration checks):
   `Godot_v4.7.2-stable --headless --path . res://scenes/SmokeTest.tscn`

## Asset pipeline

- `src/tools/blender_kit.py` — all GLB models (run with the project's bpy 5.x
  virtualenv; see `docs/` for environment notes).
- `src/tools/gen_textures.py`, `gen_audio.py`, `gen_branding.py` — textures,
  audio and branding generation.

## License

Game code and original content: see `LICENSE`.
Godot Engine: MIT, https://godotengine.org/license.
