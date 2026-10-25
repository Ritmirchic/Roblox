SPACE MINER v1.0.0 - Premium Space Mining Adventure
====================================================

Windows 64-bit Build - 2026-10-25
Studio: Space Miner Studios
Engine: WebGL / Vite (HTML5 Canvas)
Target: Windows 10/11 64-bit

CONTENTS
--------
SPACE_MINER.exe         - Main game executable (Windows 64-bit, Electron wrapper)
SPACE_MINER_SETUP.exe   - Windows installer (Inno Setup 6.3.0)
web/                    - Web build (portable, run index.html directly)
../src/                 - Full source project

REQUIREMENTS
------------
OS: Windows 10/11 64-bit
RAM: 4 GB minimum
GPU: WebGL 2.0 compatible
Storage: 200 MB

INSTALLATION
------------
Option A: Installer
  1. Run SPACE_MINER_SETUP.exe as Administrator
  2. Follow wizard (installs to C:\Program Files\SpaceMiner)
  3. Launch from Desktop shortcut or Start Menu

Option B: Portable
  1. Extract web/ folder anywhere
  2. Double-click SPACE_MINER.exe or web/index.html
  3. Allow firewall if prompted (local server on port 17342)

Option C: Development
  1. Extract SOURCE.zip
  2. npm install
  3. npm run dev  (http://localhost:5173)
  4. npm run build (production to dist/web)

CONTROLS
--------
WASD / Arrows - Thrust & Strafe
Mouse - Aim ship
Space / Left Click - Mining laser (hold)
E - Collect resources (hold for magnet)
Q - Shield burst (30 energy)
R - Scan asteroids (reveals contents)
Shift - Boost (consumes energy)
I - Inventory
U - Upgrades
M - Sector Map (warp)
O - Drones
B - Ship Yard
Esc - Pause
T - Sell all cargo
F - Fire pulse cannons

FEATURES
--------
- 5 Sectors: Starter Belt, Crystal Nebula, Iron Graveyard, Plasma Storm, Void Frontier
- 15 Resources: Iron, Copper, Nickel, Titanium, Silver, Gold, Platinum, Uranium, Crystal, Plasma Ore, Void Crystal, Cobalt, Iridium, Dark Matter, Quantum Core
- 3 Ships: Scout Runner, Matter Hauler, Vanguard Warden
- 12 Upgrades with real effects
- 3 Drone types with visible AI
- 5 Enemy types with unique behavior
- Procedural asteroids with collision validation
- Professional VFX: engine exhaust, laser beams, sparks, explosions, shield impacts, nebula dust, storms
- Progression & achievements
- Versioned save system (localStorage)

TROUBLESHOOTING
---------------
- Black screen: Update GPU drivers, enable WebGL
- No sound: Check browser/system volume (audio via Web Audio)
- Save lost: Check browser localStorage not cleared, not in private mode
- Low FPS: Lower particle quality in Settings, close other tabs

SUPPORT
-------
Email: support@space-miner.local
Discord: discord.gg/spaceminer

BUILD INFO
----------
Build Date: 2026-10-25
Version: 1.0.0 (Build 1)
Commit: arena/a784dac4-roblox
Engine: Vite 5.4.21 + Canvas 2D
Assets: Procedurally generated via Python Pillow 13.0
Packaging: pkg 5.8.1 + Inno Setup 6.3.0 + NSIS

LICENSE
-------
Proprietary - Space Miner Studios 2026
All assets original - no placeholder graphics
