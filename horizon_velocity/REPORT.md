# HORIZON VELOCITY - vertical slice status

Every line below is measured in this checkout, not planned. Sections are marked
**[WORKS]**, **[PARTIAL]** or **[PLANNED]**.

## What this build actually is

A custom C++17 engine (no UE5, no Godot: neither could be installed in the
authoring sandbox - no GPU, no display, no Epic auth). It compiles with Zig's
bundled clang and renders with its own software rasterizer.

    make all        # -> build/hv_linux
    make test       # -> 31/31 physics checks
    make shots      # -> out_shots/*.png  (9 verification frames)
    make replay     # -> out_replay.csv   (45 s of scripted driving telemetry)

## [WORKS] Vehicle physics (`src/sim/vehicle.cpp`, 31/31 tests)

Raycast suspension + anti-roll bars, combined-slip tire model, engine torque
curve with turbo and rev limiter, slipping clutch, 6-8 speed auto/manual box
with torque-based shift decisions, limited-slip diff, ABS/TCS/stability assist,
aero drag + downforce, surface rolling resistance, substepped at <= 2.5 ms.

Measured (`build/hv_test`): 0-100 km/h 7.30 s RWD / 7.39 s FWD / 4.34 s AWD,
top speed 238.9 km/h, 100-0 in 3.42 s / 48.7 m, 0.87 g steady cornering,
static load 14 225 N = vehicle weight. No NaN in any run.

## [WORKS] Renderer (`src/render/gfx_soft.cpp`)

CPU rasterizer: HDR buffer, procedural sky, 1024^2 sun shadow map with 3x3 PCF,
perspective-correct texturing, per-material shading paths (PBR-lit, car paint
with Schlick clearcoat, glass, emissive, asphalt with marking mask, terrain with
slope-aware rock blending, water), ACES tonemap chain, 2D overlay, PNG writer.

Measured: 1280x720, ~36 k triangles, 0.4-0.65 s/frame (**1.5-2.0 fps**) on this
2-vCPU sandbox, single-threaded. That is far below playable; see Known gaps.

## [WORKS] World (`src/world/`)

6 km x 6 km height field (481^2 samples) with 8 authored regions, 25 roads /
47.6 km of network (coastal highway, city grid, mountain pass, desert loop,
farm roads, dirt trails, a circuit), carved road corridors, 17 298 props
(8 476 trees, 277 buildings, lamps, barriers, grandstands, a festival stage),
chunked terrain with 3 LODs and distance culling, spatial prop buckets.

## [WORKS] Cars (`src/game/`)

16 procedurally modelled cars (lofted superelliptic shells with baked wheel
arches, glazed cabins with A/B/C pillars, interior with dash/seats/steering
wheel, lights, mirrors, exhausts, wheels). Bounding boxes match the authored
lengths to within a few cm.

## [PARTIAL] Game loop (`src/game/game.cpp`)

Game class with the world, player vehicle, 8 camera modes (chase, chase far,
hood, bumper, cockpit, cinematic, orbit, photo), HUD (speedo/tacho gauges, gear,
minimap, region, credits, event timer), 50 events in 5 chapters (10 per chapter),
traffic that follows the road graph kinematically, AI racers with the full
vehicle sim on the circuit, JSON save/load, day-night environment.

**Known bug (blocking gameplay):** in the world the car does not accelerate.
Throttle reaches the sim and the engine revs (rpm climbs to ~4100 at gear 1)
but road speed stays ~0.3 km/h, i.e. drive torque does not reach the wheels -
most likely the auto-box is stuck in a shift state or the tires have no load in
this world adapter. The same sim accelerates correctly in the unit tests, so the
defect is in the `WorldQueryImpl` integration, not the solver. This is the first
thing to fix next session; `out_replay.csv` is the reproduction.

## [PARTIAL] UI / audio

Bitmap 5x7 font + immediate-mode overlay [WORKS]. **Audio is [PLANNED]**: there
is no synth and no mixer in this build.

## [PLANNED] not implemented

Audio, menus/garage/dealership/upgrade screens, photo mode rendering controls,
weather beyond the day-night cycle, prop collision, GPU backend, controller and
wheel bindings beyond the keyboard set in `platform_win.cpp`, the Windows
executable.

## Windows build

`make win` cross-compiles with `-target x86_64-windows-gnu` and links a
prebuilt `build/libraylib.a` (5.5, Win64) plus `platform_win.cpp` (Win32 window,
keyboard + gamepad input, RGBA blit). **This was not compiled or run here** - the
sandbox has no Windows runtime, no display and the raylib archive was not kept in
the repo. No `.exe` is shipped with this commit; claiming otherwise would be
false.

## Performance table (reproducible)

| scene | res | triangles | frame time | fps |
|---|---|---|---|---|
| city chase, 09:30 | 1280x720 | 53 777 | 477 ms | 2.1 |
| cockpit, sunset | 1280x720 | ~29 000 | 601 ms | 1.7 |
| city oblique | 1280x720 | 36 496 | 226 ms draws | - |

Machine: 2 vCPU container, no GPU. Renderer is single-threaded; the obvious next
step is scanline-band threading (the shadow pass also rasterises every mesh a
second time, which is ~40% of the cost).
