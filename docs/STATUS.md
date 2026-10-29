# Development status — 2026-10-29

## Engine / tooling check

- The repository was an empty starter checkout (README only) on the required `arena/b3b7737d-roblox` branch.
- This host is Linux x86_64, 2 logical CPUs, about 3.8 GiB RAM, and about 20 GiB free disk at inspection. No GPU was exposed by `nvidia-smi`.
- Unreal Engine/Editor, Godot, Blender, a Windows runtime/exporter, CMake, and MinGW were not installed.
- Godot 4.7.2 was selected as the fallback because it is a viable cross-platform 3D game engine. An attempt to fetch the official Linux editor from GitHub failed at the redirected release asset host, which is outside the environment's allowed outbound hosts. Therefore no editor import, runtime launch, actual Windows export, or rendered gameplay capture was possible.
- The active Arena.ai agent was used. The execution interface exposes no model switch or delegation controls, so no stronger model selection or delegation is claimed.

## Implemented project files

- `project/`: Godot 4 project, custom icon, Windows Desktop export preset.
- `project/scripts/main.gd`: menu/drive flow, garage, purchases/upgrades, race start/countdown/checkpoints/results, pause, photo-mode orchestration and save integration.
- `project/scripts/vehicle.gd`: original procedural coupe, wheel/interior details, RPM-responsive generated engine audio, 4-point raycast suspension and tire forces, RWD/FWD/AWD force distribution, weather grip, reverse, camera views and photo orbit.
- `project/scripts/world_builder.gd`: connected procedural road meshes/colliders, paddock, city skyline, water, mountain/forest/farmland/desert landmarks, day/night and clear/rain presentation.
- `project/scripts/interface.gd` and `radar.gd`: custom title, driving HUD/map, garage, shop, settings and results UI.
- `project/scripts/save_data.gd`: JSON profile stored under `user://`.

## Current scope (source-inspected, not engine-verified)

- 1 reusable detailed procedural coupe body mesh and 3 selectable original car configurations (Asterion GT, Vela RX, Current S). The other two configurations currently reuse the featured body geometry; this is not three completed vehicle models.
- 1 authored connected Aurora Coast play area with a paved loop plus alpine, forest/dirt, desert and coast spurs; not eight fully finished regions or world streaming.
- 1 race event, 13 checkpoint positions, countdown/timer/results/reward, and 2 simple waypoint-following rival cars; AI race behavior has not been tested.
- 4 camera views (chase, close chase, hood, cockpit) and a basic orbit/zoom photo camera.
- Rigid-body force simulation with four suspension rays, spring/damper support, grip-limited contact forces, basic aerodynamic drag and drivetrain-dependent drive allocation. The model needs engine tuning, stability testing, surface-contact testing and steering-wheel calibration.
- Day/night progression and a rain toggle with particle precipitation, wet-look road material and reduced dry-asphalt grip. No storm/snow system, puddle simulation or dynamic weather schedule.
- Garage ownership, three vehicle choices, up to five performance stages, credits and JSON saving. There are no custom tuning sliders, paint editor, damage system, traffic, dealership world asset, installer or online features.
- Keyboard/gamepad input is authored. Steering-wheel hardware support is not implemented or verified.

## Validation performed

- `gdtoolkit` was installed temporarily outside the repository. All GDScript files passed `gdformat --check`, which confirms parsing/formatting only.
- Standard-library static tests verify project structure, configured scene/autoload/export preset, and presence of the primary gameplay systems.
- No runtime/test claims beyond those checks. There are no measured FPS numbers, actual rendered frames, Windows executable, `HORIZON_VELOCITY_SETUP.exe`, published GitHub release, or verified download URL.

## Highest priority before a public release

1. Open/import with Godot 4.7.x; resolve any API/type errors and confirm the project starts.
2. Play the sprint end-to-end and tune suspension/steering, checkpoint placements and opponent navigation; add an automated in-engine smoke test.
3. Inspect actual chase/cockpit/garage/rain/night frames; improve clear-glass cockpit visibility, reflections, road/terrain joins and vegetation batching.
4. Replace shared-shell vehicle variants with separate high-quality meshes and add traffic, fuller event types, configurable tuning, deeper progression and world streaming.
5. Profile on target Windows hardware, build/export with the exact matching Windows templates, then launch and smoke-test the packaged executable on Windows.
6. Only then consider installers, source/binary release assets and a release tag. Do not publish this source slice as v1.0.0.
