# SPACE MINER: BUILD & CONQUER — 64-bit Windows (Godot 4.3)

A complete standalone 3D space game: modular ship engineering on a real 3D grid, asteroid mining with
magnetic recovery, orbital combat, a collectible crew-card economy, a live sector market and UTC-rotating
achievements. No external runtimes required.

## v2.3.0 — Hard-Surface Robot Crew Art, Foil Mutations, Lock-Directed Combat

### 1. The crew cards are re-sculpted as detailed robots
All 42 portraits come from a new signed-distance-field **android kernel**: layered armour plating, a recessed
sensor face with emissive optics (twin angled, visor band, cyclops, compound dots), temple fins, per-role
headgear (miner hat, pilot helmet, weld mask, gunner booms, collector claws, navigator ring, officer crown,
monocle), spine fins / mohawk / halo / antenna crests, ribbed neck pistons, a chest reactor core, riveted
pauldrons, articulated arms carrying class tools (auger arm, rivet gun, manipulator claws) and a thruster
backpack. `tools/crew_robot.py` sculpts, `tools/render_crew_portraits.py` shades and grades (8 materials,
GGX specular, clearcoat, contact shadows, AO, rarity palettes, three backdrops, bloom, vignette, film grain);
the v2.2 human kernel is deleted outright — nothing is cropped, mirrored or re-tinted from another card.
Cards are ray-marched at 720x880 with a 2x box filter, then LANCZOS-resampled to the shipped 360x440.
**Five framing archetypes** (tight bust, chest portrait, waist-up, three-quarter body, low hero angle) drive
per-card camera yaw 6-46deg, pitch -11..+4.5deg, crop height, target height and distance, so the set reads as
a squad of individuals instead of one bust re-tinted 42 times. CI keeps asserting 42 unique SHA-256 digests.

### 2. Foil mutations: five collectible finishes that really change the ship
`GameData.CARD_FINISHES` adds a print-quality tier to every pull - **Standard** (58%), **Silvered** (22%),
**Holographic** (11%), **Glitter Foil** (6%) and **Luminous** (3%). A finish is not cosmetic only: it scales
the card's own buff (x1.15 / x1.25 / x1.40 / x1.60) *and* grants ship-wide perks while equipped - silver +4%
ore price, holo +6% radar reach, glitter +5% nano-repair, luminous +8% price / +5% radar / +6% repair -
summed over the equipped bridge and clamped (1.45 / 1.40 / 1.40) so a full foil loadout is a boost, not an
exploit. The hooks are real engine reads: `ShipGrid._cargo_ledger` sells into the `market` perk,
`PlayerShip3D.get_radar_range()` scales the expedition radar, and the repair tick rate runs on `repair`.
The binder keeps your **best** print of each member (a plain copy never downgrades a holo), duplicates pay
x(1 + 0.35 x foil rank) credits, and `SaveManager` persists `crew_finish` behind the SHA-256 envelope, with
pre-2.3 saves loading cleanly as all-standard.
`shaders/card_foil.gdshader` grew five finish uniforms (`finish_sheen/prism/sparkle/glow/metal` + `finish_tint`)
so silver brushed-metal, the moving holo prism that reacts to the pointer, glitter flecks and the luminous
body+edge glow are animated on the live card - no baked overlay textures to ship. `CardWidget` prints the
foil badge over the art, the localized effect line, the multiplied buff number and pulses the frame for
Luminous prints; the pack ceremony reveals the foil and shouts FOIL UPGRADED; the station box discloses the
per-pack foil odds as chips, and the elite pack genuinely pays better (1.9x on rank-2+ foils).

### 3. LMB fights, RMB mines - and every round converges on the green lock
Hull guns no longer carry mining damage at all: `Projectile3D` cannot call `apply_mining_damage` any more, so
**meteoroids only break under the right-button (or F) mining beam** - a pytest and an engine check both fail
the build if that regresses. Lock direction is now the firing rule: while an enemy is marked (auto-lock or T),
`PlayerShip3D.LOCK_HOMING_TURN` gives *every* weapon class - kinetic, laser, plasma, railgun, rocket, missile -
guidance authority onto that hull, and a round that clips a rock throws sparks and keeps hunting instead of
mining it. The marked target is painted unmistakably green: a rotating world-space bracket ring on the hull
plus four HUD corner brackets, name plate and hull bar.

### 4. Sector threat and elite response wings
Mining and kills build sector **threat** (0-100) that decays while you keep quiet. Above 42 the sector answers
with an **elite response wing**: escorts plus a heavy leader with 2.65x hull, 2.2x shields, 1.45x damage, a
3-round spread, a gold command halo and 4x credits; above 78 a second, larger wing arrives and the camera
shakes it in. Base spawn cadence tightens from 12 s to 5.4 s and the enemy cap rises with pressure, and the
flight HUD gains a live THREAT meter. Elite leaders drop **salvage crew prints** with a guaranteed
Holographic-or-better finish, so combat feeds the card chase.

### 5. Verification
`tools/render_crew_portraits.py --montage` regenerates the whole art set deterministically per card index;
31 pytest contracts (script parsing, 42 unique digests, foil table balance, localization coverage in the
bundled font chain, shader-parameter contract, LMB/RMB ownership) plus the Godot runtime suite (all checks
including foil grants, perks, pack odds, save round-trip, guidance convergence and elite wings) run in CI
before the Windows build, Inno installer self-test and release publication.

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
