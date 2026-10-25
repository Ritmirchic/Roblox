# DON'T LOOK BACK

A first-person psychological-horror / anomaly-detection game project for Windows 64-bit, built in Godot 4.x. The repository started empty, so the project, original artwork, generated sound cues, modular apartment set, gameplay scripts, tests, and release configuration were authored here.

## Engine and release status

- Unreal Engine was not installed in this Linux workspace. Godot was not installed either, so a Godot 4 project was selected as the practical fallback; Blender and Windows packaging tools were also unavailable.
- This checkout contains the complete Godot source project and a Windows x86_64 export preset. It does **not** contain a tested `DONT_LOOK_BACK.exe` or compiled `DONT_LOOK_BACK_SETUP.exe`: exporting a Windows game requires Godot 4 with matching export templates, and an installer requires Inno Setup on Windows. Those tools were not available in this workspace, so no untested executable is being presented as a working release.
- The repository's built-in Python contract tests pass. GDScript files pass `gdformat` parsing/format checks. The Godot runtime smoke suite is included but could not be executed here without the engine.

## Run in Godot

Open this folder in Godot 4.3 or newer and press **F6/F5** (or run the project from the editor). The project uses the broadly compatible **GL Compatibility** renderer; it does not require Lumen or a ray-tracing GPU.

### Controls

| Input | Action |
|---|---|
| WASD / arrow keys | Move |
| Mouse | Look |
| Shift | Sprint (uses stamina; footsteps become louder) |
| E | Open/close a door or collect a document in view |
| F | Toggle the working flashlight |
| R | File an anomaly / normal report at the far stair landing |
| 1 / 2 | Confirm “anomaly” / “normal” in the report form |
| Tab | Open/close the evidence and observation journal |
| Escape | Pause / resume |

Walk the corridor, open apartment and service doors, investigate rooms, and reach the landing before filing each report. Correct reports preserve stability; incorrect reports cost a life. Collect the maintenance roster, laundry receipt, and unsent letter to change the archive ending. Ten inspections lead to three reachable exit decisions. Reports and recovered documents autosave to Godot's `user://field_record.json`; audio, sensitivity, and fullscreen settings persist separately.

## Implemented systems

- A connected, code-built apartment complex: central corridor, twelve apartment doors and furnished flats, stairwell, working sliding elevator doors, maintenance room, laundry, storage, records/archive room, boiler basement, sloped basement access, and emergency exit. Doors have collision, locks, handles, and open/close animation.
- Procedural worn-plaster, tile, fabric, and wood materials; authored title/loading artwork and Windows icon; an always-functional flashlight; restrained colored lighting and fog.
- A shuffled anomaly deck with safe observations, ten-round escalation, a report/penalty/reward loop, evidence journal, three ending routes, and local save/continue.
- Three original constructed humanoid silhouettes with distinct roles: the Observer freezes under actual camera-cone and physics-occlusion checks; the Listener investigates player-generated sound events; the Imitator stalks and emits spatial false whispers/knocks. Actors use collision-aware movement rather than teleporting into the player.
- Ten original synthesized spatial sound cues (ambience, footsteps, whispers, knocks, scream, radio, elevator, breath, creak, entity drone).

### Thirty anomaly implementations

Each entry has a runtime activation ID, in-world/gameplay effect, clue in the catalog, report consequence, and reset behavior. A run selects a shuffled subset; replay and the smoke suite cover the full catalog.

1. Painting changes to a blood-dark landscape.
2. Furnishings move into the hall.
3. A familiar candle disappears.
4. A concealed wall opens into a new door.
5. Corridor wallpaper shifts to a damp, bruised pattern.
6. A window becomes an impossible night view.
7. Fluorescent lights change color and stutter.
8. A familiar object appears in the wrong room.
9. A ceiling fixture shifts off its mounting point.
10. The grandfather clock distorts in scale.
11. Footsteps repeat behind the player.
12. Spatial whispering repeats from a closed room.
13. Knocking repeats behind a locked door.
14. The shortwave radio emits interference.
15. A distant scream sounds from below.
16. The elevator strains and chimes without moving.
17. Footsteps sound from the floor above.
18. Close breathing repeats behind the player.
19. An apartment door unexpectedly locks.
20. A traversable corridor extension appears beyond the landing.
21. The two bedroom arrangements shift within their rooms.
22. The elevator readout changes to basement level B1.
23. Stairwell emergency lights activate.
24. A sofa blocks the familiar corridor route.
25. The records-room door unlocks and opens.
26. The Observer waits at the landing and advances only while unseen.
27. A moving human-shaped shadow crosses the wall.
28. The Imitator watches through an impossible window.
29. The Listener appears behind an opened apartment door and tracks sound.
30. The Observer silently follows the player when outside the view cone.

## Tests

From the repository root:

```sh
python3 -m unittest discover -s tests -v
```

With Godot 4 installed, run the integration smoke suite with:

```sh
godot --headless --path . --script res://tests/anomaly_smoke.gd
```

The smoke suite builds the procedural layout, validates the connected-door inventory, and activates/resets anomaly IDs 1–30. It also instantiates the player, audio director, and all three entity actors.

## Windows build

Install Godot 4.x and its matching export templates, then optionally install Inno Setup 6. In PowerShell:

```powershell
.\tools\build_windows.ps1 -Godot "C:\Path\To\Godot_v4.x-stable_win64_console.exe"
```

The script validates/imports the project, runs the anomaly smoke suite, exports a standalone x86_64 `build\DONT_LOOK_BACK.exe` with its PCK embedded, compiles `build\DONT_LOOK_BACK_SETUP.exe` when `ISCC.exe` is present, and creates `DONT_LOOK_BACK_SOURCE.zip`. Installer source is `installer/DONT_LOOK_BACK.iss`; export settings are in `export_presets.cfg`.

## Known limitations

- The game and Windows export have not been launched or packaged in this sandbox because neither Godot nor a Windows runtime/installer was installed. Run the included smoke and release scripts on a machine with the listed tools before distributing.
- The environment, entities, and furnishings are authored procedurally from Godot meshes/materials rather than imported Blender scans or motion-capture assets. Audio is original procedural synthesis, not recorded human dialogue or a licensed commercial sound library.
- A complete story run uses ten observations, so a single run will not necessarily display all thirty anomaly variants; the deck and integration suite make every variant addressable across replays/tests.
