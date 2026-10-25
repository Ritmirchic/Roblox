# Space Miner: Build & Conquer — design and implementation notes

## Engine selection

| Candidate | Result |
| --- | --- |
| Unreal Engine 5 | Not installed in the build environment; the installer/binaries are not reachable from the sandbox network allow-list. Rejected. |
| Godot 4.x | Not installed; official release archives are served from `objects.githubusercontent.com` / `release-assets.githubusercontent.com`, which the sandbox blocks (verified: TLS connection refused). Rejected. |
| **TypeScript + three.js (WebGL 2), native Win64 shell** | Chosen. Full 3D pipeline, physics, VFX and UI, packaged as a real Windows application with an icon, GUI subsystem launcher and installer. |

Zig 0.13 (from PyPI) provides the C cross-compiler and Windows resource compiler used to
produce the native binaries; `@napi-rs/canvas` provides headless canvas rendering for art
validation. Both were installed from allow-listed registries.

## Simulation architecture

```
GameState ──┬── ShipDesign (grid, modules, mass, COM, derived stats)
            ├── AchievementEngine (UTC period rotation, progress, claims)
            ├── crew bonuses (multiplicative + additive aggregation)
            ├── active upgrades (3 default / 4th purchased / 5th rare, max 5)
            └── versioned save (v3, FNV-1a checksum, validation + recovery)
```

The simulation layer imports nothing from the renderer, which is why the whole progression
model is unit-testable in Node with `--experimental-strip-types`.

### Ship grid

* Cells are integer coordinates; a module occupies a rotated footprint (6 orientations).
* Placement rules: inside owned cells, no overlap, face-adjacent connection to the hull,
  one command module, clear facing cell for surface-mounted hardware (engines/weapons).
* Removal is rejected when it would split the assembly (flood fill from the cockpit).
* Mass, centre of mass, thrust, torque, energy, shields, cargo and DPS are derived from the
  installed modules, their upgrade levels and their current integrity.

### Flight model

One rigid body. Engines contribute thrust along `-facing`, torque authority scales with
installed vector pods and ship mass, and angular damping provides stabilisation assistance
so heavy builds stay controllable. Linear damping keeps dogfights readable while mass still
dominates acceleration: `a = Σthrust · speedBonus / mass`.

### Combat and mining

* Mining lasers raycast from their real muzzle markers; asteroids have health scaled by
  radius and sector hardness, three damage states, destruction FX and chunk spawning.
* Turrets track and lead targets; projectiles above 900 u/s are hitscan beams, everything
  else is a physical projectile with optional homing and splash.
* Damage hits shields first, then a random live module (armour divides the damage).
  Modules below 35% integrity lose efficiency; at 0 they stop working entirely.
* Chunks drift, respond to magnet fields and are collected once (guarded flag) into cargo.

### Achievements

`periodIndex = floor(utcMillis / periodLength)`; the slate for a period index is generated
deterministically from that index, so every client/session agrees. Rotation prunes stale
progress and claims. Rewards are keyed `period:index:template`, making double claims
impossible, and targets scale with a progression tier so minute goals stay 20–40 seconds.

## Windows packaging

`SpaceMiner.exe` (C, 256 KB, GUI subsystem, icon + version resources):

1. resolves `<exe dir>\game` as the web root,
2. binds a loopback-only socket in 51731-51760 and serves the bundle (path sanitising,
   MIME types, SPA fallback, `/__quit` shutdown hook),
3. launches Edge/Chrome/Brave with `--app=` and an isolated `--user-data-dir`, waits for the
   window to close, then shuts the runtime down. Falls back to the default browser.

`SPACE_MINER_SETUP.exe` is the same kind of binary with an **SMPACK** payload appended
(`[u32 pathLen][path][u64 size][bytes]…` + `"SMPACK01"` footer). It extracts to
`%LOCALAPPDATA%\Programs\SpaceMiner`, creates Start Menu/desktop shortcuts through
`IShellLink`, registers in Add/Remove Programs and installs `uninstall.exe`.

The HTTP core and the archive parser are compiled for POSIX during the build and executed
against the real artifacts, so both are functionally tested even though the Windows
binaries themselves cannot be executed in a Linux sandbox.

## Known limitations

* The Windows executables are cross-compiled and verified structurally (PE32+, GUI
  subsystem, imports, embedded icon/version resources) and functionally at the source level
  (HTTP core + installer payload extraction tested natively), but they were not executed on
  Windows in this environment — no Windows host or Wine is available.
* The launcher renders through the Chromium engine that ships with Windows (Edge WebView
  runtime). On a machine with no Chromium-family browser it falls back to the default
  browser.
* The in-engine 3D visuals require a GPU, so they were validated through a software
  rasteriser (geometry) plus the live development preview, not through GPU screenshots.
