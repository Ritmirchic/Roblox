# SPACE MINER: BUILD & CONQUER — 64-bit Windows (Godot 4.3)

A complete standalone 3D space game: modular ship engineering on a real 3D grid, asteroid mining with
magnetic recovery, orbital combat, a collectible crew-card economy, a live sector market and UTC-rotating
achievements. No external runtimes required.

## v2.2.0 — Visible Interface Rebuild, Full Crew Portraits, Ship Systems Logic

### 1. The GUI was rebuilt on its own machined skin kit
A new 21-texture 9-slice kit (`tools/render_ui_skin.py` → `assets/ui/`) is generated, not drawn by hand:
chamfered armour plates with bevel highlights, micro-hatching, bolt heads, edge glow, plus matching button,
tab, slider, checkbox, progress-bar, pill, keycap, divider, card-frame and backdrop artwork.
`ThemeHelper._apply_skin_kit()` wires it into the shared Theme, so **every** PanelContainer, Panel, Button,
MenuButton, OptionButton, CheckButton, TabBar/TabContainer, HSlider/VSlider, ProgressBar, LineEdit, PopupMenu
and TooltipPanel changes at once — main menu, station modal, upgrade core, crew collection, settings,
pack ceremony, hangar chrome and the in-flight HUD. Cards paint the rarity-tinted kit frame; the station
shell sits on the kit backdrop plate under a machined command rail with tab-shaped nav buttons.
Skinning never changes layout size: fixed HUD chrome uses tight-margin copies of the same plates.

### 2. 42 crew members that are actually different people
The card pipeline was replaced with a self-contained signed-distance-field humanoid renderer
(`tools/crew_sdf.py`) — no mesh cropping, no mirrored twins. Each of the 42 portraits is a complete bust
(skull, jaw, eyes with glints, brows, mouth, hair/beard, neck, shoulders, chest rig, arms, rank bars,
role sigil, chest plaque) with its own build, pose (twist ±32°, lean, per-arm swing), camera (yaw, pitch,
bust framing), key-light azimuth, backdrop (nebula / station window / starfield) and exposure. Eight helmet
families and rarity-driven trim colours. Verified in CI: 42 unique SHA-256 digests, minimum normalised
pairwise difference 0.155, zero mirrored twins, torso present on every card.

### 3. One reticle — the steering one (order reversed from v2.1.0)
Reticle **#1** is restored as the only centre marker: arc, outer ring, four steering ticks and a 2 px dot,
offset by the smoothed stick input and scaled by the HUD opacity setting. The ballistic pipper **#2** and its
secondary-impact markers are deleted; the firing solution survives as a compact text readout
(`MAG LOCK` / `TARGET` / `ROCK` / `LOCKED`) beside the reticle.

### 4. More real game logic (all of it simulated, saved and tested — no cosmetic switches)
- **Reactor load governor.** Energy is metered per subsystem against a budget derived from real reactor
  output. Sustained over-draw droops that subsystem — mining throughput and turret cycle time both fall off;
  when the capacitor collapses the ship *sheds mining and guns first* while the engines keep enough to fly
  home. Five persisted profiles (Balanced, Mining Focus, Combat Focus, Sustain, Burst Drive) selectable in
  the station; a new HUD reactor-load gauge, per-system status and brown-out alert report it live.
- **Dynamic sector market.** Every mineral carries a live price index per sector — a bounded superposition of
  three cycles plus a per-sector bias, deterministic in (mineral, sector, UTC day). The hangar ledger, the
  market board and a reloaded save can never disagree, and you choose which unlocked sector's market to sell
  into. Trend arrows and 24 h deltas are computed, not faked.
- **Cargo spillage.** A hit that gets past shields and armour shakes a share of unsecured ore out of the bays,
  proportional to the shock against total hull HP. The spill scatters as *real, magnetically recoverable*
  resource chunks — a full haul is genuinely riskier to fly through a firefight, and it is tracked in the
  lifetime stats.

### 5. Full rebuild and bug hunt
The engine test suite grew from 373 to **443 runtime checks** and the static suite to 28 tests, now including
cross-file symbol resolution, an 839-call-site **argument-count audit**, a `play_sfx` name registry check,
a Godot-4 identifier ban-list and a skin-key↔texture check. Found and fixed real shipped bugs:
ore pickups had been **silent** (sfx key `pickup` never existed in `AudioManager`), `ResourceChunk3D`/HUD
label used removed Godot-3 properties (`height_for_width`) that nulled every later HUD node, and every
interactive control class requested a skin texture family (`"btn"`, `"tab"`, `"slider"`, `"bar"`) that has no
file — so buttons, tabs, sliders and progress bars had been silently falling back to flat chrome.
Every build is exported headless, run through MainMenu + Hangar + all 5 sectors + save/load, packed with
Inno Setup and **installed** before the packaged `--self-test` gate passes.

## Older builds still published
v2.1.0 (GUI skin pass, hangar 3D polish, warp-portal-only exit) and v1.1.0 (10-language GUI rebuild,
44.1 kHz audio overhaul, card art) remain available in the Releases list.

## Downloads
- **`SPACE_MINER_WINDOWS.zip`** — portable standalone: extract and run `SPACE_MINER.exe`.
- **`SPACE_MINER_SETUP.exe`** — bilingual (RU/EN) Inno Setup 64-bit installer, Start Menu + optional
  desktop shortcut, uninstaller included.
- **`SPACE_MINER_SOURCE.zip`** — full Godot 4.3 project: 54 PBR `.glb` models, 75 card/pack illustrations,
  UI skin kit, procedural renderers, 23 studio-audio WAVs, 10-language localization, tests and installer script.
- **`SHA256SUMS.txt`** — checksums of all three archives (also reproduced in the release body below).

## Controls
`W A S D` thrust · `Shift` boost · `Space` fire · `E` mining beam · `Q`/`R` roll · mouse look ·
`T` stabiliser · `Tab` target lock · `Esc` pause/station · `F` hall-of-achievements step-through.
