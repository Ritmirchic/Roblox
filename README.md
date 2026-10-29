# HORIZON VELOCITY — Aurora Coast

**An original, single-player 3D driving-game project built for Godot 4.**

Horizon Velocity is an in-progress playable vertical slice: procedural coastal roads, a festival paddock, three original car configurations, force-based wheel/suspension simulation, a checkpoint sprint with two waypoint-following rivals, a garage/economy loop, save data, changing daylight, rain, cockpit/chase cameras, and an original in-game UI/audio identity.

> **Build-status honesty:** a Windows x64 **alpha build** is available below. A user's startup log revealed the blank-screen cause: Godot could not infer the type of a duplicated car-catalog entry in `main.gd`. After fixing that, stricter CI checks exposed the same inference issue for values read from the car loft arrays in `vehicle.gd`; both are now explicitly typed, and CI rejects engine script errors even if Godot exits with status zero. Download the complete bundle and keep the `.exe` and companion `.pck` together. Interactive desktop gameplay and rendered frames still have not been inspected, and the original AAA targets are not complete.
>
> **[Download the complete Windows bundle](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY_WINDOWS.zip)** · [Direct EXE](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY.exe) · [PCK data](https://github.com/Ritmirchic/Roblox/releases/download/horizon-velocity-v0.1.2-alpha/HORIZON_VELOCITY.pck) · [Release notes](https://github.com/Ritmirchic/Roblox/releases/tag/horizon-velocity-v0.1.2-alpha)

The engine fallback is **Godot 4.x**. Unreal Engine 5 was not present. No external AI model or delegation tool was available in this execution environment; work was performed by the currently assigned Arena.ai Agent Mode model.

## Play / build

1. Install Godot 4.3 or newer (Godot 4.7.x recommended) and the matching export templates.
2. Open `project/project.godot` in the Godot editor and run the main scene.
3. To create a Windows 64-bit release from a machine with Godot and the Windows export template installed, run:

   ```sh
   ./tools/export_windows.sh
   ```

   The intended output is `build/HORIZON_VELOCITY.exe` plus its companion `.pck`. This script intentionally refuses to fabricate an output if Godot is not installed.

## Controls

- **W / S** — throttle / brake, then reverse at a stop
- **A / D** — steering
- **Space** — handbrake
- **Shift / Ctrl** — up / down gear
- **C** — cycle chase, close chase, hood and cockpit cameras
- **R** — reset vehicle
- **M / Esc** — festival menu / pause
- **P** — orbit photo camera; mouse to orbit, wheel to zoom, Esc/P to leave
- **Gamepad** — left stick and triggers, face button handbrake, shoulder buttons shift

## Current playable slice

- Aurora Coast is authored as a connected road loop with coastal, forest, alpine and desert/rural spurs; the festival paddock and a small Aurora City skyline sit around the circuit.
- The player car is an original, procedural Asterion GT coupe shell with a visible cabin/interior, PBR clear-coat paint, wheel assemblies and a synthesized RPM-responsive engine tone. Two purchasable car configurations have distinct AWD/RWD power, mass, grip, color and audio parameters, but currently reuse the featured coupe body mesh.
- Vehicle motion uses a `RigidBody3D`, four suspension/tire raycasts, spring/damper forces, wheel-contact friction limits, drivetrain-dependent wheel forces, braking, aerodynamic drag and a low-speed reverse. It is not moved by per-frame position teleportation.
- The Aurora Coast Sprint has a countdown, a fixed sequence of 13 world-space checkpoints, race timing, two simple waypoint-driven rivals, a result screen, credits and a persistent best-time/event record.
- The garage supports car selection/purchase and up to five performance stages. Save data is stored under Godot's per-user `user://` directory.
- The map uses procedural meshes and materials; day/night lighting and clear/rain states are interactive. Graphics presets currently adjust MSAA and fog rather than implementing the full requested PC graphics-options suite.

## Validation available in this environment

```sh
python3 -m unittest discover -s tests -v
```

GDScript grammar/format validation was performed using `gdtoolkit` (`gdformat --check project/scripts/*.gd`), and Windows CI passed Godot import, a 120-frame headless startup check and x64 export. These are **not** a substitute for interactive playtesting, rendered-frame inspection, manual Windows smoke testing, or performance profiling.

See [`docs/STATUS.md`](docs/STATUS.md) for verified scope, limitations and next engineering steps. Original source is MIT-licensed; third-party engine/runtime notices remain applicable to exported builds.
