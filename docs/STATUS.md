# Development status — 2026-10-29

## Engine / tooling check

- The repository was an empty starter checkout (README only) on the required `arena/b3b7737d-roblox` branch.
- The local host is Linux x86_64, 2 logical CPUs, about 3.8 GiB RAM, and about 20 GiB free disk at inspection. No GPU was exposed by `nvidia-smi`.
- Unreal Engine/Editor, Godot, Blender, a Windows runtime/exporter, CMake, and MinGW were not installed locally. Direct downloading of the Godot editor to this host was blocked at the redirected GitHub release-asset host.
- A Windows GitHub Actions runner previously downloaded Godot 4.7.2, imported the project, and exported it. The smoke test missed a GDScript parse failure because the engine logged the error but returned a successful process exit code. The attached Windows log identified the issue: `main.gd:106` could not infer the type of a duplicated catalog entry. Explicitly declaring `result` as a `Dictionary` fixed that error; stricter CI then exposed and fixed type-inference and indentation issues in `vehicle.gd` as well. CI now fails on engine script errors, even if Godot returns exit code zero.
- The corrected v0.1.2-alpha build passed direct vehicle-script parsing, project import, a headless startup smoke test, and Windows x64 export in [CI run 40945590047](https://github.com/Ritmirchic/Roblox/actions/runs/40945590047). This is still not an interactive or rendered-frame test.
- The active Arena.ai agent was used. The execution interface exposes no model switch or delegation controls, so no model switch or delegation is claimed.

## Delivered build

- Prerelease: [Horizon Velocity 0.1.2-alpha](https://github.com/Ritmirchic/Roblox/releases/tag/horizon-velocity-v0.1.2-alpha)
- Recommended download: [HORIZON_VELOCITY_WINDOWS.zip](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY_WINDOWS.zip). Extract both files into one folder and run the EXE.
- Direct executable: [HORIZON_VELOCITY.exe](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY.exe)
- Companion data: [HORIZON_VELOCITY.pck](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY.pck). The `.pck` must be beside the executable; launching only the EXE can leave the game with a black screen because the project scene/resources are absent.
- The release API confirmed all three assets were uploaded: EXE (109,154,304 bytes), PCK (140,884 bytes), and ZIP (39,353,319 bytes).
- This is an **experimental Windows alpha**, not the complete AAA game requested. The CI smoke test did not validate input, event completion, save/load persistence, rendered image quality, FPS or crashes during extended play.

## Implemented project files

- `project/`: Godot 4 project, original icon, Windows Desktop export preset.
- `project/scripts/main.gd`: menu/drive flow, garage, purchases/upgrades, race start/countdown/checkpoints/results, pause, photo-mode orchestration and save integration.
- `project/scripts/vehicle.gd`: original procedural coupe, wheel/interior details, RPM-responsive generated engine audio, four-point raycast suspension and tire forces, RWD/FWD/AWD force distribution, weather grip, reverse, cameras and photo orbit.
- `project/scripts/world_builder.gd`: connected procedural road meshes/colliders, paddock, city skyline, water, mountain/forest/farmland/desert landmarks, day/night and clear/rain presentation.
- `project/scripts/interface.gd` and `radar.gd`: custom title, driving HUD/map, garage, shop, settings and results UI.
- `project/scripts/save_data.gd`: JSON profile stored under `user://`.
- `.github/workflows/windows-build.yml`: Windows runner import, smoke test, export and marker-triggered alpha publication.

## Current scope

- 1 featured procedural coupe body mesh and 3 original car configurations (Asterion GT, Vela RX, Current S). The latter two reuse the featured mesh with trim changes; they are not separate completed vehicle models.
- 1 connected Aurora Coast play area with a paved loop plus alpine, forest/dirt, desert and coast spurs; not eight finished regions or streamed open-world production.
- 1 sprint event, 13 checkpoint positions, countdown/timer/results/reward, and 2 simple waypoint-following rivals. Race logic was compiled and the scene passed the headless startup smoke test, but a full interactive race was not played through.
- 4 camera views (chase, close chase, hood, cockpit) and a basic orbit/zoom photo camera.
- Rigid-body force simulation with four suspension rays, spring/damper support, grip-limited contact forces, basic drag and drivetrain-dependent drive allocation. Needs handling, surface-contact, stability and control calibration.
- Day/night progression and a rain toggle with particle precipitation, wet-look road material and reduced dry-asphalt grip. No storm/snow system, puddle simulation or dynamic weather schedule.
- Garage ownership, three vehicle choices, up to five performance stages, credits and JSON saving. No custom tuning sliders, paint editor, damage system, traffic, dealership world asset, installer or online features.
- Keyboard/gamepad input is authored. Steering-wheel hardware support is not implemented or verified.

## Validation performed

- `gdtoolkit` GDScript grammar/format check passed locally; standard-library static tests passed.
- On Windows CI, Godot project import/GDScript compilation passed; 120-frame headless startup passed; Windows x64 export passed; release asset metadata confirmed both files uploaded.
- There was no desktop GUI playthrough, rendered-frame inspection, visual quality assessment, long-session stability test, or performance benchmark. The executable has not been manually launched by a person on Windows in this session.

## Highest priority before a full public release

1. Launch the prerelease on Windows and test menus, driving, input, checkpoints, finish/results, garage and save/load interactively.
2. Inspect chase/cockpit/garage/rain/night frames; improve reflections, cockpit visibility, road/terrain joins and vegetation batching.
3. Tune suspension/steering and opponent route-following from measured playtests; verify wheel/road contacts and checkpoint layouts.
4. Replace shared-shell variants with distinct high-quality models, then add traffic, fuller event types, configurable tuning, deeper progression and world streaming.
5. Profile on target hardware, test the packaged build across Windows 10/11 systems, and build a real installer only after QA.
6. Continue labeling releases as alpha until the missing production and testing scope is completed. Do not represent this build as v1.0.0.
