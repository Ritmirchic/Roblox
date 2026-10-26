# ASHES OF HUMANITY: LAST SIGNAL

**Version 1.0.0** — a 3D post-apocalyptic survival action RPG for Windows 64-bit.

A last radio tower still transmits somewhere beyond the Red Wasteland. You are
the only operator still walking, hunting, scavenging and building who still
answers the call. Six regions of a dead world, one continuous campaign, and a
signal that must be found before the last of them stops breathing.

---

## Engine (honest disclosure)

This game is **not** built with Unreal Engine 5 or Godot. Neither engine could
be obtained in the build environment (no Epic/GitHub release-asset access for
the UE binaries, and the Godot editor + export templates could not be
downloaded). Instead the game runs on an **original engine written from
scratch in C++17 against the OpenGL 3.3 core profile**, cross-compiled to
Windows x86-64 with the **Zig 0.13.0** toolchain (`zig c++ -target
x86_64-windows-gnu -O2 -static`).

All art was authored offline in **Blender 4.5 LTS** (Python / bpy) and exported
through a custom container format written for this project.

| Piece | Choice |
|---|---|
| Engine | Original C++17 / OpenGL 3.3 renderer, physics, AI, UI, audio |
| Toolchain | Zig 0.13.0 (cross-compiler + linker, static CRT) |
| DCC | Blender 4.5.15 LTS, headless, procedural modelling / rigging / baking |
| Assets | Custom `.afm` (mesh), `.aft` (texture), `.afa` (animation) containers |
| Target | Windows 64-bit (`x86_64-windows-gnu`), also builds headless on Linux |

---

## Building

```bash
# Windows 64-bit executable
FORCE_REBUILD=1 TARGET=x86_64-windows-gnu ./build.sh

# Headless Linux build used for the automated test suite
FORCE_REBUILD=1 TARGET=x86_64-linux-gnu ./build.sh
```

`MODE=debug` keeps symbols. The script needs `zig` on `PATH` (or set `ZIG`).

Regenerating the art (requires Blender 4.5 LTS through `bpy`):

```bash
cd tools/assetgen
source /home/user/tools/blender_env.sh     # or your own bpy environment
$PY build_assets.py                       # 79 meshes, 17 animation sets
```

Branding textures are packed separately with `python3 tools/assetgen/branding.py`
(they live in `assets/ui/` on purpose — the material texture indices in
`assets/textures/` must stay stable).

---

## Command line

```
AshesOfHumanity.exe                normal game
AshesOfHumanity.exe --test         runs the automated system test suite
AshesOfHumanity.exe --sim 60       60 seconds of headless gameplay simulation
AshesOfHumanity.exe --headless      no window
AshesOfHumanity.exe --seed 1234    deterministic world seed
AshesOfHumanity.exe --width 1600 --height 900 --fullscreen
```

---

## Controls

| Key | Action |
|---|---|
| W A S D | Move |
| SHIFT | Sprint |
| CTRL | Crouch |
| Z (while crouched) | Crawl |
| SPACE | Jump / vault |
| E | Interact, search containers, talk |
| F | Bandage bleeding |
| R | Reload |
| Left mouse | Fire / swing |
| Right mouse | Aim down sights |
| V | First / third person |
| TAB | Inventory — GEAR / MEDICAL / WEAPON bays |
| J | Journal and quests |
| K | Skill trees |
| M | World map |
| SHIFT + C | Crafting |
| B | Base building |
| F3 | Performance overlay (FPS, frame time, draw calls, triangles) |
| ESC | Pause |

---

## Layout

```
ashes_of_humanity/
  engine/src/
    core/       math, logging, file IO, RNG and noise
    platform/   Win32 window, OpenGL 3.3 context, input
    gfx/        renderer, shaders (GLSL 330), bone atlas, particles, UI batches
    assets/     container format, asset manager
    game/       world, player, items, combat, AI, quests, UI, audio, save, screens
  tools/
    assetgen/   Blender asset factory (structures, props, weapons, characters, buildings)
    installer/  self-extracting Windows installer with its own DEFLATE decoder
  assets/       generated meshes / textures / animations / branding
  branding/     icon, title art, Win32 resource script
  build.sh      cross-compilation script
```

---

## License

Original work. See `LICENSE.txt`.
