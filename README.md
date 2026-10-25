# SPACE MINER: BUILD & CONQUER

**SPACE MINER: BUILD & CONQUER** is a complete 64-bit Windows 3D modular spacecraft engineering, asteroid mining, space combat, and collectible card progression game built with **Godot Engine 4.3** (`RigidBody3D` physics, custom GLSL shaders, procedural PBR `.glb` 3D assets, and custom synthesized audio).

---

## Core Features

### 1. Industrial 3D Hangar & Interactive Ship Constructor
- Full 3D sci-fi hangar bay featuring a hydraulic construction platform, animated overhead gantry crane, 4 articulated welding arms, holographic terminals, forcefield launch bay, and dynamic volumetric-style lighting.
- **Grid-Snapped 3D Modular Ship Assembly**: Start with a starter cockpit, basic hull cells, a light thruster, and a basic mining laser, then purchase progressive expansion cells (`hull_cell`) and snap 25 functional 3D equipment modules across all 6 faces with 90° rotation, live green/red ghost previews, and BFS structural connectivity enforcement.
- **Unified Rigid-Body Physics**: Modules combine into a single `RigidBody3D` spacecraft whose mass, moment of inertia, thrust-to-mass acceleration, cargo weight, and live 3D **Center of Mass** update dynamically. Individual modules sustain localized combat damage, emit sparks, lose efficiency, and detach as spinning 3D debris when destroyed.

### 2. Five Distinct 3D Space Expedition Sectors
1. **Starter Belt** — Silicate & Iron-Nickel asteroids, calm lighting, Scout Drones.
2. **Crystal Nebula** — Teal volumetric nebula dust, Prism & Cobalt veins, Raider Ships.
3. **Iron Graveyard** — Derelict hull wreckage fields, Titanium & Cobalt cores, Heavy Drones.
4. **Plasma Storm** — Ionized violet storm clouds, periodic EM lightning discharges that drain shields, Solar Plasma cores, Plasma Hunters.
5. **Void Frontier** — Deep-space crimson abyss, ultra-rich Void Iridium asteroids, Void Sentinels.

### 3. Five Categories of Functional 3D Equipment (27 Total Modules)
- **Mining**: Basic Mining Laser, Advanced Mining Laser, Plasma Drill, Crystal Extractor, Heavy Mining Beam.
- **Collection**: Magnetic Collector, Advanced Magnet, Vacuum Collector, Wide-Range Collector (physically pull floating 3D mineral chunks into your cargo bay).
- **Weapons**: Rotary Autocannon, Pulse Laser Cannon, Heavy Plasma Cannon, Swarm Rocket Pod, Homing Missile Battery, Hypervelocity Railgun (turrets physically track targets and fire from muzzle mounts).
- **Defense**: Deflector Shield Core, Reactive Ferro-Armor, Nanite Hull Repair Bay, Orbital Defense Drone Hub.
- **Utility & Propulsion**: Deep-Space Radar Array, Spectral Ore Scanner, Fusion Micro-Reactor, Pressurized Cargo Pod, Afterburner Booster, plus Ion/Fusion/Antimatter Thrusters.

### 4. Crew Collectible Cards (42 Unique Illustrated Cards, 7 Rarities)
- Rarities: `Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`, `Mythic`, and `Secret`.
- Exact Crew Capacity Formula:
  $$\text{CrewSlots} = \left\lfloor \frac{\text{PurchasedExpansionCells}}{10} \right\rfloor$$
  (Starting cockpit and free starter hull cells do not count toward purchased expansion cells.)
- Powerful passive buffs (including `x3` weapon damage, `x5` mineral yield, `x2` top speed, `+50%` reactor regen, `+40%` magnet radius, `+100%` shield capacity) with search, rarity filter, sorting, and duplicate protection.

### 5. Active Upgrade Core (3 Default + 4th Purchased + 5th Rare 1% Drop)
- Separate from physical ship modules: 3 slots unlocked by default, a permanent 4th slot purchasable in the Upgrade Core, and a permanent 5th slot unlocked via a **1.0% Relic Card drop** inside Card Packs (hard-capped at 5 total slots).

### 6. Crystal Card Packs & 30 UTC-Timed Collectible Achievement Cards
- **Card Packs** cost Crystals, yield **3 Crew Cards** per pack, disclose exact drop probabilities, and play a full 10-stage animated foil reveal sequence (with Skip & Reduced Motion support).
- **30 Active UTC Achievement Cards** with custom artwork and live UTC countdowns:
  - **15 Weekly** (7-day UTC cycle)
  - **7 Daily** (24-hour UTC cycle)
  - **3 Hourly** (60-minute UTC cycle)
  - **5 Minute** (60-second UTC micro-contracts completable in 20–40 seconds)

---

## Building & Testing From Source

### Automated Verification
```bash
# 1. Static GDScript AST parse + 3D GLB PBR & asset verification
pytest -v tests/test_assets_and_spec.py

# 2. Headless Godot 4.3 Engine & Physics Unit Test Suite
godot --headless --import
godot --headless res://tests/TestScene.tscn

# 3. Packaged Runtime Self-Test
SPACE_MINER.exe --headless --self-test
```

### Exporting 64-Bit Windows Standalone & Installer
1. Open `project.godot` in **Godot 4.3** (with standard export templates installed) and run:
   ```bash
   godot --headless --export-release "Windows Desktop" build/windows/SPACE_MINER.exe
   ```
2. Compile `installer/space_miner_setup.iss` with **Inno Setup 6 (`ISCC.exe`)** to produce `SPACE_MINER_SETUP.exe`.
