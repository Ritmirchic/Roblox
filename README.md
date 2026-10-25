# SPACE MINER: BUILD & CONQUER

A browser-playable 3D space-mining game made with Three.js and Vite. The project uses procedural low-poly models, custom PBR-style materials, SVG card portraits, a 3D hangar, and an arcade-physics expedition mode. Progress saves locally in the browser (`localStorage`).

## Play locally

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Open the Vite URL in a modern WebGL-enabled desktop browser. `npm run build` creates a static web build in `dist/`; serve that folder over HTTP to play the packaged web build.

## Controls

- Hangar: drag in the assembly viewer to orbit; scroll to zoom; rotate/remove installed components with the buttons in the manifest.
- Flight: **W/A/S/D** to thrust and turn, mouse-drag to steer, **Shift** to boost, click a mineral body to target it, hold **Space** to mine (or fire an installed cannon), **Esc** to return to the hangar.
- The Ship Store installs modules; Structural Cells expand the mounting capacity. Crew berths unlock at exactly each tenth purchased expansion cell.

## Project checks

```sh
npm test
npm run build
```

## Scope and limitations

This checkout did not have Unreal Engine or Godot installed, so the deliverable is a Three.js browser game, **not** a Windows-native executable. There is no Windows package or installer. The current game is an early playable vertical slice: the hangar, ship fitting, mining, physical salvage chunks, simple drone combat, sectors, crew packs, objectives, upgrades, and local save are implemented, but it is not a finished commercial-scale game. It does not yet include authored Blender files, voice/music/SFX, a native Windows export, comprehensive enemy classes, module-by-module health/detachment, full save migration tooling, or every feature in the original specification. Browser/WebGL runtime and visual QA should be completed on the target machine.
