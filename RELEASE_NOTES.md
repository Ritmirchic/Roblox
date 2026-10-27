# SPACE MINER: BUILD & CONQUER — 64-bit Windows (Godot 4.3)

A complete standalone 3D space game: modular ship engineering on a real 3D grid, asteroid mining with
magnetic recovery, orbital combat, a collectible crew-card economy, a live sector market and UTC-rotating
achievements. No external runtimes required.

## v2.5.2 — Owning a Card Now Shows on the Card, Not Only on Its Frame

Reported from the crew-tab frames: an owned specialist looked exactly as dark as a locked one, only the border
lit up. The dimming was not the culprit this time - the paintings are moody by design, and the grid viewport is
small, so "full brightness" and "crushed to 44%" read nearly the same.

- **Owned art is now lifted above the source image** (`modulate 1.14-1.22`), so the portrait gains its own
  light instead of merely losing a dim. The rarity colour also tints the backdrop behind the portrait.
- **Locked art is desaturated, not just darkened**: it runs through the same foil shader with `rarity_tier = 0`,
  `finish_metal = 0.94` and a cold tint, so a not-yours card reads as frosted glass. No fake rarity sweeps or
  hover glints are added to locked cards, and the no-shader fallback path is kept honest.
- The contrast ratio owned:locked is now enforced by a test, together with the rule that locked cards never
  receive the foil material that owns hover tracking.
- **The etched band of the skin frame was burying the footer**: the "+8% к мощности бура" line on an owned
  Common card was barely legible in the capture. Card content is raised above the decorative overlay, so the
  name row and the bonus row sit on top of the frame art instead of under it.
- Bonus text contrast raised (gold `1.0, 0.9, 0.5` when owned, `0.66, 0.74, 0.86` when locked).

Verified: 42 pytest checks green locally, CI re-runs the full engine suite (524 checks), the packaged exe
self-test and the asset/parse suites before publishing.

## v2.5.1 — Twenty-Two Screenshots, One Pass Over Everything They Exposed

Every frame of the play-through review went in. Below is what actually changed, and what is knowingly left open.

### Hall of Fame (3D)
- The plaques were scattered over a whole sphere on the golden angle, so half the hall sat behind the camera and
  the room read as a black void with two lit cards. The layout is now an **amphitheater**: rows fan out in front of
  the entrance, each tier higher and deeper, so the collected set reads from one spot and stays in frame.
- The bottom hint lived in a fixed 520 px box clipped at the right edge, so its first words were cut at every
  resolution ("...йте - осмотреться..."). It now spans the window and centers.
- Ambient and sky floor lifted slightly so pillars and floor read as a room instead of darkness.

### Flight
- Losing window focus now **pauses the flight**, and the pause panel gained a red EXIT TO DESKTOP control, so a run
  is never a trap. It deliberately saves nothing and banks nothing: the warp portal stays the only payout, and a
  test pins that rule.
- The pause panel states the extraction rule using the game's own localized copy plus the live cargo readout.
- The target plaque over the locked enemy was 52 px wide and truncated real names ("SCOUT DR..."). It is 118 px,
  centered, with the health bar widened to match.
- Ship readability: module models get a 1.16 scale margin and a small random yaw, so a turret reads as a turret
  instead of another white hull cell; the chase camera default moved from 17 m to 14.5 m.
- Sectors no longer float in a flat gradient with a hard horizon band: a **2048x1024 nebula panorama** (authored
  for this build: equirectangular dust in two colours plus three star layers) is the sky now, rotated per sector
  so each sector still reads differently, with the procedural sky kept as fallback.

### Crew cards and the pack ceremony
- Locked and duplicate cards were crushed to `Color(0.24, 0.28, 0.36)`, which turned the crew grid and the pack
  result row into black rectangles. The silhouette stays readable now while still clearly marked "not yours".
- The name row got its own 22 px height and the portrait gave up 10 px, so localized names are no longer clipped
  by the bottom of the card.
- The burst flash peaked at alpha 0.80 over the whole modal - a grey wash. It peaks at 0.34 (0.14 under reduced
  motion), and the pack aura got a 44 px soft shadow instead of a hard-edged ellipse outline.
- Odds chips have a minimum width, so "Secret: 0.060%" stops folding mid-token.

### Hangar panels
- Settings groups no longer stretch vertically - that stretch was the empty framed panel above ПИЛОТИРОВАНИЕ.
- Launch panel: an odd sector count left half the grid empty; that cell now carries the live cargo/refinery
  summary and the market rule, both from existing localized copy.
- Affordance order fixed: "fly to sector" keeps the green accent, an unaffordable "unlock sector" drops to a
  secondary wire button and is visibly dimmed; the same dimming was missing on "smelt & sell" with an empty hold.

### Menu
- The main menu printed "v2.1.0" on a 2.5.0 build. Version strings are single-sourced now, and a test fails the
  build if any localized menu version drifts from `config/version`.

### Known, not fixed in this pass
- Shop pack cards still sit narrow at 1920 (dead side margins) - presentation only, nothing is hidden behind it.
- Still open on the Steam-readiness list: no rebind screen / no `[input]` map, a single save slot with the backup
  file unexposed, no music tracks, machine translation for TR/PT/ZH/JA/KO waiting on human QA, no colourblind
  lock target, no photosensitivity note.

## v2.5.0 — Crew Cards Are Painted Now: Kind Machines to Murder Machines

### The procedural rig is gone; the set is authored art
The crew portraits were the last part of this game still produced by maths. All 42 are now
**separately authored paintings** - one image per card, each directed from that card's own identity:
its name, its role, its biography and its **signature tool** (resonance cleaver-hammer, twin plasma
accelerators, a monolith splitter, a phalanx deflector, a prism-tipped analysis spear, micro-welder
swarms, magnet grab-claws, a zero-point tap lance, a reality-anchor gauntlet). Nothing is mirrored,
tinted or re-framed from a neighbour.

### The ladder is the art direction
- **Common** - rounded, plain-spoken utility machines with big soft optic eyes: honest dents, canvas
  harness, tools built for work.
- **Uncommon** - the same friendly frame in olive military plating, first war scars, heavier tooling.
- **Rare** - professional soldiers: faceted edges, kill notches, repaired visors, cold blue discipline.
- **Epic** - killing machines: black-violet laminate armour, spikes, exposed cores, a tokamak burning in
  the chest, arms replaced by siege hardware.
- **Legendary** - executioners in scorched gold and obsidian: war horns, cracked visors, capes of welded
  metal, entire forearms as weapons.
- **Mythic** - monstrous but still humanoid: faceless helms with a single vertical wound of light,
  radiator maws, singularity cores on the shoulders, ribcage cages holding a bound black hole.
- **Secret** - the two worst things in the belt: a void scientist whose face is an event horizon with
  one dead-white eye, and a progenitor war god waking a dead dreadnought behind it.
Every stage keeps a two-arms/legs/head humanoid silhouette, so the cards still read as a crew and not
as abstract shapes.

### Assembly, not generation
`tools/assemble_crew_cards.py` is now the only thing that writes `assets/cards/crew/`. It frames each
painting with a subject-aware crop (the silhouette is located against its own border, and the window
is biased to keep the helmet off the top edge - a cropped head is the worst thing a crew card can do),
then unifies the set with a light key-art vignette and one deterministic PNG per card. The 42 master
paintings are committed under `assets/cards/crew_src/` so the set can be re-framed without touching the
art, and `export_presets.cfg` excludes them from the shipped build so the game stays the same size.
The three superseded procedural portrait generators (`crew_robot.py`, `render_crew_portraits.py`,
`render_crew_unique.py`) were deleted, because leaving them behind only invites someone to render the
authored set away again.

### Test truth
The full-bust contract in `tests/test_assets_and_spec.py` was updated for painted art: a torso band now
passes either by separating from its background *or* by being structurally busy across the width, since
elite key art is deliberately dark armour in dark smoke and luminance alone cannot see that. A head
floating over nothing still fails, as do mirrored twins and duplicate digests.

## v2.4.1 — Two Fake Controls Deleted

### The pause menu no longer lies
"EXTRACT TO HANGAR (KEEP CARGO)" only hid the pause panel — it never extracted anything, which is
exactly the kind of dead button this project refuses to ship. It is gone: `SpaceExpedition3D` lost
`_pause_ext_btn` entirely (no hidden node, no orphaned code path), and the pause menu keeps the two
controls it can actually honour — *resume flight* and *language*.

### The HUD under the radar no longer advertises a key that does nothing
"HANGAR [H]" was promising a hotkey that is not bound anywhere: `SpaceExpedition3D._unhandled_input`
handles Esc/Tab, C, T and Z, never H. The button and its portal-guidance chevron overlay (its only
trigger) were removed together, so no half-dead feature is left behind. Extraction stays what it has
always been in this build — fly into the warp portal, which is labelled in-world and tracked on the
radar, and the flight hint already says exactly that.

### No dead strings
`pause_extract`, `hud_return_hangar`, `hud_return_guidance` and the stale `hud_flight_controls` block
(which still documented `[Tab] Cursor` and `[H] Hangar`) were deleted from all ten languages instead of
being left as unreferenced text. `TestRunner` now asserts the reverse: that those identifiers are absent
from the HUD source and that the localization file no longer carries those keys, so a future edit cannot
quietly re-introduce a button with no binding.

### Verified
`pytest` static/spec suite plus the Godot engine suite run in CI against the exported Windows build and
the installed `SPACE_MINER.exe` self-test.

## v2.4.0 — Real Pilots, a Brutality Ladder, and Honest Drop Odds

### 1. Every crew member is now a *pilot*, not a mannequin in a paint job
The portrait kernel was rebuilt around flight gear: a smooth enclosed pressure helmet with a
wide visor ground into the shell (tinted glass, matte bezel, slanted optic slits burning behind
it), a corrugated neck seal, twin life-support hoses into the chest, a harness with a chest band
and buckles, thigh holsters and a cargo pouch under the belt, and pauldrons seated on the
deltoid instead of floating beside the head as bowls. The torso is a rounded suit chassis with
armour cut as thin shells that hug it, so nothing reads as a slab or a scrap-heap. The v2.3
"pilot shell for pilots only" pass is gone: the shell is the base and role gear is bolted on top.

### 2. The rarity ladder is now a visible brutality ladder
One scalar (`brut`, 0..1) drives geometry and lighting together, so rarer genuinely means meaner:
helmet brow rakes down and thickens, jaw fins sweep back, vents multiply and start to burn,
war horns appear (two, then three, longer each tier), kill notches are sawn into the chin guard,
the pauldron grows laminate layers and rim spikes, an armour skirt hangs off the shoulder,
laminated chest plating and a spiked gorget stack up, and from Legendary up command wings and
burning nozzle embers spread behind the pack. Shading follows: elites are painted darker with a
hotter trim, get battle scoring scratched across the plate and elite war stripes on the helm, are
lit with a stronger rim, sit lower to the camera, bloom harder and grade with more contrast. Common
crew stay plain, useful and slightly scuffed - the difference is readable at a glance.

### 3. Secret and Legendary cards were far too easy - fixed in both income streams
- **Packs** (per card, and these are exactly the percentages the station discloses): standard box
  Common 53.5 / Uncommon 28 / Rare 12.5 / Epic 4.5 / Legendary 1.2 / Mythic 0.24 / **Secret 0.06**;
  the vault box Uncommon 20 / Rare 44 / Epic 26.3 / Legendary 7.5 / Mythic 1.8 / **Secret 0.4** and
  never a Common. Legendary-or-better used to be a ~20% per-pack event in the standard box (48% in
  the vault) with a Secret every 5th vault pack; it is now a ~4.4% per-pack event (26%) with a
  Secret at 1 in 556 standard packs and 1 in 84 vault packs.
- **Sector salvage**: elite wing leaders previously picked *uniformly from every card Rare and
  above*, which made Mythics common and handed out a Secret once every twelve prints. Combat now
  rolls its own ladder (Rare 62 / Epic 30 / Legendary 7 / Mythic 1, heavy-wing leaders on a
  46/34/16/4 table), **can never print a Secret**, and an expedition caps at 2 prints total, so a
  hot sector is worth hunting but not farming. Foil finishes are untouched: the chase for silver,
  holo, glitter and luminous prints still runs through packs.

### 4. Verification
32 pytest contracts now pin the whole economy (descending ladders with hard caps on the rare tail,
the salvage ladder excluding Secret, the expedition honouring the cap) and the new engine test
`_test_drop_odds_are_honest` recomputes the disclosed table from the live weights, proves the roller
only obeys that table, samples 6,000 real standard-box rolls and 3,000 vault rolls against the
published percentages, and sweeps the entire 0..1 salvage range to prove a Secret cannot come out of
a kill. The art set is re-rendered through the same pipeline with 42 unique SHA-256 digests asserted
in CI, then exported, installed and run through the packaged self-test.


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
`W A S D` 6-DOF translation · `Space`/`Ctrl` up-down · `Shift` boost · mouse steer (click to capture, `C` recenter) ·
`Q`/`E` roll · `LMB` fire at the GREEN locked target (`T` re-locks manually) · `RMB`/`F` mining beam (the only way
to break a meteoroid) · `Z` stabiliser · `Esc`/`Tab` pause and station · extraction is portal-only: the hangar
`Return` button paints chevrons to the warp gate with live range, it does not teleport the ship.
