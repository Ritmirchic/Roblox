extends Node

const RARITY_ORDER: Array[String] = [
	"Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Secret"
]

const RARITY_COLORS: Dictionary = {
	"Common": Color(0.58, 0.65, 0.74),
	"Uncommon": Color(0.22, 0.86, 0.54),
	"Rare": Color(0.20, 0.70, 1.00),
	"Epic": Color(0.74, 0.34, 1.00),
	"Legendary": Color(1.00, 0.75, 0.16),
	"Mythic": Color(0.24, 0.96, 0.92),
	"Secret": Color(1.00, 0.22, 0.46),
}

const RESOURCES: Dictionary = {
	"iron": {
		"id": "iron",
		"name": "Ferrite Iron",
		"value": 18,
		"unit_mass": 0.35,
		"chunk_model": "res://assets/models/asteroids/chunk_iron.glb",
		"color": Color(0.84, 0.65, 0.42),
	},
	"titanium": {
		"id": "titanium",
		"name": "Star Titanium",
		"value": 45,
		"unit_mass": 0.45,
		"chunk_model": "res://assets/models/asteroids/chunk_titanium.glb",
		"color": Color(0.82, 0.90, 1.00),
	},
	"crystal": {
		"id": "crystal",
		"name": "Nebula Crystal",
		"value": 110,
		"unit_mass": 0.50,
		"chunk_model": "res://assets/models/asteroids/chunk_crystal.glb",
		"color": Color(0.25, 0.94, 1.00),
	},
	"plasma_core": {
		"id": "plasma_core",
		"name": "condensed Plasma",
		"value": 260,
		"unit_mass": 0.65,
		"chunk_model": "res://assets/models/asteroids/chunk_plasma_core.glb",
		"color": Color(0.76, 0.42, 1.00),
	},
	"void_iridium": {
		"id": "void_iridium",
		"name": "Void Iridium",
		"value": 620,
		"unit_mass": 0.85,
		"chunk_model": "res://assets/models/asteroids/chunk_void_iridium.glb",
		"color": Color(1.00, 0.26, 0.62),
	},
}

var modules: Dictionary = {}
var crew_cards: Array[Dictionary] = []
var crew_by_id: Dictionary = {}
var active_upgrades: Array[Dictionary] = []
var upgrades_by_id: Dictionary = {}
var sectors: Array[Dictionary] = []
var enemies: Dictionary = {}

func _ready() -> void:
	_init_modules()
	_init_crew_cards()
	_init_active_upgrades()
	_init_sectors()
	_init_enemies()

func _add_mod(id: String, name_str: String, category: String, model_sub: String, price: int, mass: float, hp: float, energy_draw: float, size: Vector3i, desc: String, extra: Dictionary) -> void:
	var stem := model_sub.get_file().get_basename()
	var d: Dictionary = {
		"id": id,
		"name": name_str,
		"category": category,
		"model_path": "res://assets/models/" + model_sub,
		"icon_path": "res://assets/icons/equip/" + stem + ".png",
		"price": price,
		"mass": mass,
		"max_hp": hp,
		"energy_draw": energy_draw,
		"grid_size": size,
		"max_level": 5,
		"description": desc,
	}
	for k in extra.keys():
		d[k] = extra[k]
	modules[id] = d

func _init_modules() -> void:
	modules.clear()
	# Core & Propulsion
	_add_mod("cockpit_mk1", "Command Cockpit Mk1", "Core", "ship/mod_cockpit_mk1.glb", 0, 12.0, 260.0, -28.0, Vector3i(1, 1, 1),
		"Armored command bridge with integrated life-support, starter fusion cell, and 40u cargo hold.",
		{"energy_cap": 120.0, "energy_regen": 28.0, "cargo_cap": 40, "radar_range": 140.0})
	_add_mod("hull_cell", "Structural Hull Cell", "Structure", "ship/mod_hull_cell.glb", 120, 6.5, 180.0, 0.0, Vector3i(1, 1, 1),
		"Reinforced titanium spaceframe block with 6-axis modular equipment hardpoints.",
		{"cargo_cap": 6})
	_add_mod("engine_basic", "Ion Thruster Mk1", "Propulsion", "ship/mod_engine_basic.glb", 260, 8.0, 130.0, 6.0, Vector3i(1, 1, 1),
		"Reliable ion propulsion unit providing steady forward & RCS stabilization thrust.",
		{"thrust_force": 580.0, "heat_rate": 10.0, "max_heat": 100.0})

	# Mining (5)
	_add_mod("mining_basic", "Basic Mining Laser", "Mining", "equipment/eq_mining_basic.glb", 220, 4.5, 95.0, 7.0, Vector3i(1, 1, 1),
		"Twin-emitter industrial thermal beam for fracturing common silicate and iron asteroids.",
		{"mining_dps": 34.0, "mining_range": 62.0, "hardness_pierce": 1, "beam_color": Color(0.20, 0.90, 1.0)})
	_add_mod("mining_advanced", "Advanced Mining Laser", "Mining", "equipment/eq_mining_advanced.glb", 950, 6.0, 125.0, 12.0, Vector3i(1, 1, 1),
		"Articulated dual-barrel optical excavator with coolant manifolds and extended focal range.",
		{"mining_dps": 68.0, "mining_range": 78.0, "hardness_pierce": 2, "is_turret": true, "beam_color": Color(0.35, 1.0, 0.82)})
	_add_mod("plasma_drill", "Plasma Bore Drill", "Mining", "equipment/eq_plasma_drill.glb", 2600, 9.0, 165.0, 19.0, Vector3i(1, 1, 1),
		"Superheated magnetic induction bore capable of melting dense metallic slag and crystal shells.",
		{"mining_dps": 135.0, "mining_range": 68.0, "hardness_pierce": 3, "yield_bonus": 0.20, "beam_color": Color(0.75, 0.38, 1.0)})
	_add_mod("crystal_extractor", "Harmonic Crystal Extractor", "Mining", "equipment/eq_crystal_extractor.glb", 5800, 7.5, 150.0, 22.0, Vector3i(1, 1, 1),
		"Resonance-tuned prismatic beam that preserves delicate crystal structures (+40% mineral yield).",
		{"mining_dps": 175.0, "mining_range": 86.0, "hardness_pierce": 4, "yield_bonus": 0.40, "beam_color": Color(0.25, 0.96, 1.0)})
	_add_mod("heavy_mining_beam", "Heavy Siege Excavator", "Mining", "equipment/eq_heavy_mining_beam.glb", 14500, 18.5, 290.0, 38.0, Vector3i(1, 1, 2),
		"2-cell spinal siege mining array capable of cracking Void Frontier monoliths in seconds.",
		{"mining_dps": 360.0, "mining_range": 108.0, "hardness_pierce": 5, "yield_bonus": 0.55, "beam_color": Color(1.0, 0.76, 0.22)})

	# Collection (4)
	_add_mod("magnet_basic", "Magnetic Collector", "Collection", "equipment/eq_magnet_basic.glb", 320, 4.0, 90.0, 4.0, Vector3i(1, 1, 1),
		"Dual-coil electromagnetic tractor ring that pulls nearby floating ore chunks into cargo.",
		{"magnet_range": 28.0, "magnet_force": 36.0})
	_add_mod("magnet_advanced", "Gravimetric Dish", "Collection", "equipment/eq_magnet_advanced.glb", 1250, 5.5, 115.0, 7.5, Vector3i(1, 1, 1),
		"Focused tri-pole gravimetric dish offering rapid mid-range mineral extraction.",
		{"magnet_range": 46.0, "magnet_force": 58.0})
	_add_mod("vacuum_collector", "Vortex Vacuum Array", "Collection", "equipment/eq_vacuum_collector.glb", 3400, 7.0, 145.0, 11.0, Vector3i(1, 1, 1),
		"High-throughput subspace funnel accelerating multiple ore clusters simultaneously.",
		{"magnet_range": 68.0, "magnet_force": 85.0})
	_add_mod("wide_collector", "Wide-Range Tractor Pylon", "Collection", "equipment/eq_wide_collector.glb", 9200, 13.0, 220.0, 18.0, Vector3i(1, 1, 2),
		"2-cell dorsal tractor array sweeping entire asteroid clusters clean of valuable minerals.",
		{"magnet_range": 105.0, "magnet_force": 125.0})

	# Weapons (6)
	_add_mod("machine_gun", "Rotary Autocannon", "Weapons", "equipment/eq_machine_gun.glb", 480, 5.5, 115.0, 5.0, Vector3i(1, 1, 1),
		"6-barrel turret gatling cannon firing high-velocity kinetic tungsten rounds.",
		{"weapon_type": "kinetic", "weapon_damage": 14.0, "fire_rate": 7.5, "proj_speed": 210.0, "weapon_range": 155.0, "is_turret": true})
	_add_mod("laser_cannon", "Pulse Laser Turret", "Weapons", "equipment/eq_laser_cannon.glb", 1350, 6.2, 130.0, 11.0, Vector3i(1, 1, 1),
		"Precision tracking turret firing instantaneous twin coherent laser pulses.",
		{"weapon_type": "laser", "weapon_damage": 28.0, "fire_rate": 3.4, "proj_speed": 400.0, "weapon_range": 175.0, "is_turret": true})
	_add_mod("plasma_cannon", "Heavy Plasma Accelerator", "Weapons", "equipment/eq_plasma_cannon.glb", 3200, 8.5, 160.0, 16.0, Vector3i(1, 1, 1),
		"Launches volatile superheated plasma bolts that melt shields and heavy drone armor.",
		{"weapon_type": "plasma", "weapon_damage": 68.0, "fire_rate": 1.65, "proj_speed": 145.0, "weapon_range": 180.0, "is_turret": true})
	_add_mod("rocket_launcher", "Salvo Rocket Pod", "Weapons", "equipment/eq_rocket_launcher.glb", 4400, 9.5, 175.0, 12.0, Vector3i(1, 1, 1),
		"6-tube armored launcher firing physical high-explosive unguided rockets with splash damage.",
		{"weapon_type": "rocket", "weapon_damage": 105.0, "fire_rate": 1.15, "proj_speed": 118.0, "splash_radius": 9.0, "weapon_range": 200.0})
	_add_mod("missile_battery", "Seeker Missile Battery", "Weapons", "equipment/eq_missile_battery.glb", 7800, 10.5, 185.0, 17.0, Vector3i(1, 1, 1),
		"Vertical-launch smart missile cell firing agile target-seeking guided interceptors.",
		{"weapon_type": "missile", "weapon_damage": 135.0, "fire_rate": 0.90, "proj_speed": 105.0, "turn_rate": 3.8, "weapon_range": 240.0})
	_add_mod("railgun", "Hypervelocity Railgun", "Weapons", "equipment/eq_railgun.glb", 16500, 19.0, 260.0, 32.0, Vector3i(1, 1, 2),
		"2-cell electromagnetic spinal cannon firing devastating armor-piercing slugs across space.",
		{"weapon_type": "railgun", "weapon_damage": 310.0, "fire_rate": 0.55, "proj_speed": 480.0, "weapon_range": 290.0})

	# Defense (4)
	_add_mod("shield_gen", "Aegis Shield Projector", "Defense", "equipment/eq_shield_gen.glb", 1100, 6.8, 130.0, 10.0, Vector3i(1, 1, 1),
		"Projects a regenerative hexagonal energy barrier that absorbs incoming enemy fire and storm arcs.",
		{"shield_cap": 150.0, "shield_regen": 16.0})
	_add_mod("armor_plate", "Reactive Composite Armor", "Defense", "equipment/eq_armor_plate.glb", 650, 14.0, 420.0, 0.0, Vector3i(1, 1, 1),
		"Ultra-dense sloped ERA armor block with massive local HP and +8% global hull damage reduction.",
		{"armor_reduction": 0.08})
	_add_mod("repair_module", "Nano-Welder Repair Bay", "Defense", "equipment/eq_repair_module.glb", 2800, 7.2, 145.0, 9.0, Vector3i(1, 1, 1),
		"Deploys maintenance nanites that continuously restore damaged ship modules during flight.",
		{"repair_rate": 11.0})
	_add_mod("defense_drone_bay", "Autonomous Drone Bay", "Defense", "equipment/eq_defense_drone_bay.glb", 6400, 9.0, 165.0, 14.0, Vector3i(1, 1, 1),
		"Launches an orbiting 3D point-defense combat & mining support drone around your spacecraft.",
		{"drone_count": 1, "drone_dps": 32.0})

	# Utility (5)
	_add_mod("radar", "Deep-Space Tactical Radar", "Utility", "equipment/eq_radar.glb", 540, 3.8, 95.0, 4.0, Vector3i(1, 1, 1),
		"Rotating parabolic sensor dish extending threat tracking range and target lead telemetry.",
		{"radar_range": 220.0, "crit_chance": 0.06})
	_add_mod("resource_scanner", "Spectrographic Ore Scanner", "Utility", "equipment/eq_resource_scanner.glb", 1200, 4.2, 100.0, 5.0, Vector3i(1, 1, 1),
		"Highlights high-value mineral veins in 3D space with HUD brackets and +12% rare ore discovery.",
		{"scanner_range": 190.0, "rare_mineral_chance": 0.12})
	_add_mod("energy_generator", "Tokamak Fusion Reactor", "Utility", "equipment/eq_energy_generator.glb", 1500, 10.5, 160.0, -52.0, Vector3i(1, 1, 1),
		"Compact toroidal fusion core generating +52 MW continuous power and +90 MJ capacitor storage.",
		{"energy_cap": 90.0, "energy_regen": 52.0})
	_add_mod("cargo_pod", "Pressurized Cargo Pod", "Utility", "equipment/eq_cargo_pod.glb", 720, 7.5, 165.0, 0.0, Vector3i(1, 1, 1),
		"Modular heavy-duty mineral containment pod adding +85 cargo capacity.",
		{"cargo_cap": 85})
	_add_mod("thruster_booster", "Vector Afterburner Booster", "Utility", "equipment/eq_thruster_booster.glb", 2400, 11.0, 175.0, 13.0, Vector3i(1, 1, 1),
		"Twin high-output vector nozzles delivering massive linear thrust and crisp rotational agility.",
		{"thrust_force": 720.0, "turn_bonus": 0.30, "heat_rate": 14.0, "max_heat": 130.0})

func get_module_scaled_stat(mod_id: String, stat_key: String, level: int = 1) -> float:
	if not modules.has(mod_id):
		return 0.0
	var base_val := float(modules[mod_id].get(stat_key, 0.0))
	var mult := 1.0 + 0.22 * float(maxi(1, level) - 1)
	return base_val * mult

func get_cell_purchase_cost(already_purchased: int) -> int:
	return int(round(120.0 * pow(1.14, float(maxi(0, already_purchased)))))

func _init_crew_cards() -> void:
	crew_cards.clear()
	crew_by_id.clear()
	var roster: Array = [
		# 10 Common (#01 - #10)
		[1, "Jax Holloway", "Miner", "Common", "mining_mult", 0.08, "+8% Mining Beam Power", "Belt-born rock cutter with ten thousand logged EVA hours."],
		[2, "Lina Vance", "Pilot", "Common", "speed_mult", 0.08, "+8% Thruster Speed", "Former orbital shuttle courier known for smooth docking burns."],
		[3, "Bram Korovin", "Engineer", "Common", "energy_regen_mult", 0.10, "+10% Energy Regeneration", "Keeps aging ion manifolds humming past factory tolerances."],
		[4, "Rook Mercer", "Gunner", "Common", "damage_mult", 0.09, "+9% Weapon Damage", "Point-defense specialist trained on convoy escort frigates."],
		[5, "Mira Solis", "Collector", "Common", "magnet_range_mult", 0.12, "+12% Magnet Range", "Calibrates tractor harmonics to snag stray ferrite shards."],
		[6, "Theo Kade", "Navigator", "Common", "cargo_mult", 0.12, "+12% Cargo Capacity", "Masters high-density ore stowage across cramped hull bays."],
		[7, "Dax Grimsby", "Miner", "Common", "loot_mult", 0.10, "+10% Mining Loot Yield", "Spots rich Chondrite seams before firing a single watt."],
		[8, "Sora Lin", "Engineer", "Common", "hull_mult", 0.12, "+12% Module Durability", "Welds micro-fractures with industrial carbon-boron patches."],
		[9, "Kip Renard", "Pilot", "Common", "turn_mult", 0.12, "+12% Turn Agility", "Thrives in tight asteroid slaloms with manual vernier trims."],
		[10, "Talia Beck", "Collector", "Common", "credit_mult", 0.10, "+10% Mineral Sell Value", "Negotiates premium smelter rates at orbital refineries."],
		# 8 Uncommon (#11 - #18)
		[11, "Garrick Stone", "Miner", "Uncommon", "mining_mult", 0.18, "+18% Mining Beam Power", "Deep-core plasma bore foreman from Ceres Station."],
		[12, "Vesper Kael", "Gunner", "Uncommon", "damage_mult", 0.20, "+20% Weapon Damage", "Tunes rotary autocannons for zero-recoil burst groupings."],
		[13, "Nyx Sato", "Pilot", "Uncommon", "speed_mult", 0.18, "+18% Thruster Speed", "Test pilot for experimental twin-bell vector boosters."],
		[14, "Unit E-74", "Engineer", "Uncommon", "energy_regen_mult", 0.22, "+22% Energy Regeneration", "Autonomous maintenance synth wired straight into reactor telemetry."],
		[15, "Orin Vale", "Collector", "Uncommon", "magnet_range_mult", 0.24, "+24% Magnet Range", "Runs dual-phase electromagnetic sweeps through dense debris."],
		[16, "Dr. Elara Voss", "Scientist", "Uncommon", "rare_chance_add", 0.08, "+8% Rare Mineral Chance", "Spectroscopy researcher mapping trans-iron crystal isotopes."],
		[17, "Capt. Halden", "Commander", "Uncommon", "shield_mult", 0.22, "+22% Shield Capacity", "Steady bridge officer who drilled shield phalanx tactics."],
		[18, "Zane Quill", "Navigator", "Uncommon", "cargo_mult", 0.25, "+25% Cargo Capacity", "Routes optimal delta-v trajectories even with overloaded holds."],
		# 7 Rare (#19 - #25)
		[19, "Kaia Flux", "Collector", "Rare", "magnet_range_mult", 0.40, "+40% Magnet Range", "Rare Collector prodigy whose grav-coils bend local inertia."],
		[20, "Rex Valorian", "Gunner", "Rare", "damage_mult", 0.38, "+38% Weapon Damage", "Decorated raider-hunter with pinpoint turret tracking."],
		[21, "Torsten Forge", "Miner", "Rare", "loot_mult", 0.40, "+40% Mining Loot Yield", "Splits crystal geodes along natural harmonic cleavage planes."],
		[22, "Aria Zephyr", "Pilot", "Rare", "speed_mult", 0.35, "+35% Thruster Speed", "Rode plasma storm updrafts across the Outer Belt unbeaten."],
		[23, "Chief Mako", "Engineer", "Rare", "repair_add", 8.0, "+8 HP/s Auto-Repair", "Commands micro-welder swarms that rebuild armor under fire."],
		[24, "Lyra Prism", "Scientist", "Rare", "rare_chance_add", 0.15, "+15% Rare Mineral Chance", "Crystalline exo-geologist attuned to resonant nebula veins."],
		[25, "Cmdr. Vance", "Commander", "Rare", "shield_mult", 0.45, "+45% Shield Capacity", "Veteran flotilla tactician hardening deflector harmonics."],
		# 6 Epic (#26 - #31)
		[26, "volkoff Prime", "Engineer", "Epic", "energy_regen_mult", 0.50, "+50% Energy Regeneration", "Epic Chief Engineer pushing Tokamak containment to peak output."],
		[27, "Seraphina Blaze", "Gunner", "Epic", "damage_mult", 0.75, "+75% Weapon Damage", "Overcharges plasma accelerators with devastating precision."],
		[28, "Krag Crystalbane", "Miner", "Epic", "mining_mult", 0.70, "+70% Mining Beam Power", "His modified siege beams vaporize slag armor in heartbeats."],
		[29, "Jet Nova", "Pilot", "Epic", "speed_mult", 0.60, "+60% Thruster Speed", "Cyber-reflex ace capable of outflying seeker missiles."],
		[30, "Vortex-9", "Collector", "Epic", "loot_mult", 0.85, "+85% Mining Loot Yield", "Industrial AI core sorting every gram of precious ore."],
		[31, "Prof. Solenne", "Scientist", "Epic", "rare_chance_add", 0.22, "+22% Rare Mineral Chance", "Pioneered quantum resonance scanning in the Plasma Storm."],
		# 5 Legendary (#32 - #36)
		[32, "Valkyrie Orion", "Gunner", "Legendary", "damage_total_mult", 3.0, "x3.0 Weapon Damage", "Legendary Gunner whose neural fire-control triples lethality."],
		[33, "Astra Mach", "Pilot", "Legendary", "speed_total_mult", 2.0, "x2.0 Ship Flight Speed", "Legendary Pilot who bends ion plumes into relativistic sprints."],
		[34, "Titan Brom", "Miner", "Legendary", "mining_mult", 1.50, "+150% Mining Beam Power", "Living legend of the Deep Belt; monoliths crumble before him."],
		[35, "Admiral Solaris", "Commander", "Legendary", "shield_mult", 0.80, "+80% Shield & Hull Integrity", "Supreme fleet strategist inspiring unbreakable ship resilience."],
		[36, "Archmagos Tesla", "Engineer", "Legendary", "energy_regen_mult", 1.10, "+110% Energy Regeneration", "Master of zero-point plasma taps and lossless conduits."],
		# 4 Mythic (#37 - #40)
		[37, "Aurelius Deepcore", "Miner", "Mythic", "loot_total_mult", 5.0, "x5.0 Mining Resource Loot", "Mythic Miner whose harmonic extraction multiplies every vein fivefold."],
		[38, "Imperator Zenith", "Commander", "Mythic", "shield_mult", 1.00, "+100% Shield Capacity", "Mythic Commander projecting an impenetrable fortress barrier."],
		[39, "Hyperion Sovereign", "Gunner", "Mythic", "damage_mult", 2.20, "+220% Weapon Damage", "Wields twin singularity targeting cores forged beyond the rim."],
		[40, "Celestia Starweaver", "Pilot", "Mythic", "speed_mult", 1.35, "+135% Speed & Turn Agility", "Navigates subspace slipstreams invisible to mortal sensors."],
		# 2 Secret (#41 - #42)
		[41, "Dr. Nyx Singularity", "Scientist", "Secret", "rare_chance_add", 0.38, "+38% Bonus Rare Minerals", "Secret Void Scientist decoding dark-matter transmutation."],
		[42, "The Architect", "Commander", "Secret", "all_stats_mult", 0.65, "+65% All Ship Systems", "Mysterious progenitor consciousness awakening ancient ship cores."],
	]

	for row in roster:
		var idx: int = row[0]
		var cid := "crew_%02d" % idx
		var card: Dictionary = {
			"id": cid,
			"number": idx,
			"name": row[1],
			"role": row[2],
			"rarity": row[3],
			"buff_type": row[4],
			"buff_value": float(row[5]),
			"bonus_text": row[6],
			"description": row[7],
			"portrait": "res://assets/cards/crew/crew_%02d.png" % idx,
		}
		crew_cards.append(card)
		crew_by_id[cid] = card

func _init_active_upgrades() -> void:
	active_upgrades.clear()
	upgrades_by_id.clear()
	var list: Array = [
		["upg_01", "Overclocked Beam Lens", 650, "mining_mult", 0.25, "+25% Mining Laser Damage"],
		["upg_02", "Subspace Ore Compressor", 800, "cargo_mult", 0.35, "+35% Total Cargo Capacity"],
		["upg_03", "Superconducting Coils", 950, "energy_regen_mult", 0.30, "+30% Reactor Energy Regen"],
		["upg_04", "Flux Magnet Amplifier", 900, "magnet_range_mult", 0.35, "+35% Collector Magnet Range"],
		["upg_05", "Tungsten Sabot Feeds", 1200, "damage_mult", 0.28, "+28% Weapon Damage"],
		["upg_06", "Harmonic Shield Relay", 1400, "shield_mult", 0.35, "+35% Shield Capacity"],
		["upg_07", "Afterburner Cryo-Vents", 1500, "speed_mult", 0.24, "+24% Ship Flight Speed"],
		["upg_08", "Refinery Smelter Protocol", 2100, "credit_mult", 0.30, "+30% Mineral Sell Value"],
		["upg_09", "Spectrographic Deep-Scan", 2600, "rare_chance_add", 0.14, "+14% Rare Mineral Drop Chance"],
		["upg_10", "Nanite Hull Stitcher", 3200, "repair_add", 9.0, "+9 HP/s Passive Hull Repair"],
		["upg_11", "Gyro-Torque Stabilizers", 2800, "turn_mult", 0.38, "+38% Rotational Agility"],
		["upg_12", "Prismatic Vein Splitter", 4500, "loot_mult", 0.40, "+40% Asteroid Mineral Yield"],
		["upg_13", "Capacitor Surge Bank", 5200, "energy_cap_add", 140.0, "+140 MJ Max Energy Reserve"],
		["upg_14", "Point-Defense Overdrive", 6400, "fire_rate_mult", 0.28, "+28% Weapon Fire Rate"],
		["upg_15", "Reactive Bulkhead Matrix", 7500, "hull_mult", 0.45, "+45% Module Health"],
		["upg_16", "Quantum Tractor Singularity", 11000, "magnet_range_mult", 0.65, "+65% Collector Magnet Range"],
		["upg_17", "Siege Breaker Firmware", 15500, "mining_mult", 0.60, "+60% Mining Laser Damage"],
		["upg_18", "Apex Conqueror Core", 24000, "all_stats_mult", 0.30, "+30% All Combat, Mining & Shield Stats"],
	]
	for i in range(list.size()):
		var row: Array = list[i]
		var u: Dictionary = {
			"id": row[0],
			"name": row[1],
			"price": int(row[2]),
			"stat": row[3],
			"value": float(row[4]),
			"effect_text": row[5],
			"icon_path": "res://assets/icons/upgrades/upg_%02d.png" % (i + 1),
		}
		active_upgrades.append(u)
		upgrades_by_id[u["id"]] = u

func _init_sectors() -> void:
	sectors = [
		{
			"id": "sector_1",
			"index": 0,
			"name": "1. Starter Belt",
			"subtitle": "Common Chondrite Asteroids • Low Hostility",
			"description": "Sunlit orbital quarry rich in Ferrite Iron and Star Titanium. Patrolled only by light rogue Scout Drones.",
			"unlock_cost": 0,
			"required_cells": 0,
			"asteroid_model": "res://assets/models/asteroids/ast_silicate_iron.glb",
			"asteroid_hp": 95.0,
			"asteroid_hardness": 1,
			"asteroid_count": 44,
			"enemy_cap": 4,
			"enemy_pool": ["scout_drone"],
			"resources": {"iron": 0.72, "titanium": 0.25, "crystal": 0.03},
			"ambient_color": Color(0.24, 0.26, 0.34),
			"sun_color": Color(1.0, 0.93, 0.80),
			"sky_top": Color(0.03, 0.05, 0.11),
			"sky_horizon": Color(0.09, 0.14, 0.25),
			"hazard": "none",
		},
		{
			"id": "sector_2",
			"index": 1,
			"name": "2. Crystal Nebula",
			"subtitle": "Luminous Geode Clusters • Pirate Raiders",
			"description": "Prismatic ionized gas cloud housing high-purity Nebula Crystals guarded by Scout Drones and Raider Ships.",
			"unlock_cost": 2500,
			"required_cells": 5,
			"asteroid_model": "res://assets/models/asteroids/ast_crystal_geode.glb",
			"asteroid_hp": 210.0,
			"asteroid_hardness": 2,
			"asteroid_count": 48,
			"enemy_cap": 6,
			"enemy_pool": ["scout_drone", "raider_ship"],
			"resources": {"iron": 0.25, "titanium": 0.35, "crystal": 0.40},
			"ambient_color": Color(0.14, 0.32, 0.42),
			"sun_color": Color(0.62, 0.95, 1.0),
			"sky_top": Color(0.03, 0.10, 0.20),
			"sky_horizon": Color(0.12, 0.36, 0.48),
			"hazard": "nebula_drag",
		},
		{
			"id": "sector_3",
			"index": 2,
			"name": "3. Iron Graveyard",
			"subtitle": "Derelict Fleet Hulks • Armored Heavy Drones",
			"description": "Shattered battlefield of abandoned freighters, metallic debris fields, and aggressive automated Heavy Drones.",
			"unlock_cost": 8500,
			"required_cells": 10,
			"asteroid_model": "res://assets/models/asteroids/ast_slag_wreck_rock.glb",
			"asteroid_hp": 420.0,
			"asteroid_hardness": 3,
			"asteroid_count": 50,
			"enemy_cap": 8,
			"enemy_pool": ["raider_ship", "heavy_drone"],
			"resources": {"iron": 0.20, "titanium": 0.45, "crystal": 0.25, "plasma_core": 0.10},
			"ambient_color": Color(0.22, 0.24, 0.28),
			"sun_color": Color(0.95, 0.72, 0.52),
			"sky_top": Color(0.05, 0.06, 0.09),
			"sky_horizon": Color(0.18, 0.14, 0.13),
			"hazard": "debris_field",
		},
		{
			"id": "sector_4",
			"index": 3,
			"name": "4. Plasma Storm",
			"subtitle": "Arcing Electrical Hazards • Condensed Plasma",
			"description": "Supercharged maelstrom where lightning discharges arc across fulgurite spires and stealth Plasma Hunters prowl.",
			"unlock_cost": 25000,
			"required_cells": 15,
			"asteroid_model": "res://assets/models/asteroids/ast_fulgurite_spire.glb",
			"asteroid_hp": 780.0,
			"asteroid_hardness": 4,
			"asteroid_count": 52,
			"enemy_cap": 9,
			"enemy_pool": ["heavy_drone", "plasma_hunter"],
			"resources": {"titanium": 0.20, "crystal": 0.32, "plasma_core": 0.42, "void_iridium": 0.06},
			"ambient_color": Color(0.28, 0.16, 0.44),
			"sun_color": Color(0.84, 0.62, 1.0),
			"sky_top": Color(0.08, 0.03, 0.18),
			"sky_horizon": Color(0.28, 0.11, 0.45),
			"hazard": "plasma_lightning",
		},
		{
			"id": "sector_5",
			"index": 4,
			"name": "5. Void Frontier",
			"subtitle": "Obsidian Monoliths • Capital Void Sentinels",
			"description": "Edge of charted space holding priceless Void Iridium monoliths defended by dreadnought Void Sentinels.",
			"unlock_cost": 65000,
			"required_cells": 20,
			"asteroid_model": "res://assets/models/asteroids/ast_void_monolith.glb",
			"asteroid_hp": 1450.0,
			"asteroid_hardness": 5,
			"asteroid_count": 55,
			"enemy_cap": 10,
			"enemy_pool": ["plasma_hunter", "void_sentinel"],
			"resources": {"crystal": 0.20, "plasma_core": 0.35, "void_iridium": 0.45},
			"ambient_color": Color(0.26, 0.10, 0.24),
			"sun_color": Color(1.0, 0.45, 0.68),
			"sky_top": Color(0.03, 0.01, 0.06),
			"sky_horizon": Color(0.22, 0.04, 0.16),
			"hazard": "void_shear",
		},
	]

func _init_enemies() -> void:
	enemies = {
		"scout_drone": {
			"id": "scout_drone",
			"name": "Scout Drone",
			"model": "res://assets/models/enemies/enemy_scout_drone.glb",
			"hp": 75.0,
			"shield": 0.0,
			"speed": 26.0,
			"damage": 8.0,
			"fire_rate": 1.3,
			"range": 95.0,
			"credits": 85,
			"drop_resource": "iron",
			"scale": 1.15,
		},
		"raider_ship": {
			"id": "raider_ship",
			"name": "Raider Ship",
			"model": "res://assets/models/enemies/enemy_raider_ship.glb",
			"hp": 185.0,
			"shield": 45.0,
			"speed": 24.0,
			"damage": 15.0,
			"fire_rate": 1.7,
			"range": 115.0,
			"credits": 220,
			"drop_resource": "titanium",
			"scale": 1.25,
		},
		"heavy_drone": {
			"id": "heavy_drone",
			"name": "Heavy Drone",
			"model": "res://assets/models/enemies/enemy_heavy_drone.glb",
			"hp": 390.0,
			"shield": 110.0,
			"speed": 17.0,
			"damage": 26.0,
			"fire_rate": 1.4,
			"range": 130.0,
			"credits": 480,
			"drop_resource": "crystal",
			"scale": 1.35,
		},
		"plasma_hunter": {
			"id": "plasma_hunter",
			"name": "Plasma Hunter",
			"model": "res://assets/models/enemies/enemy_plasma_hunter.glb",
			"hp": 640.0,
			"shield": 220.0,
			"speed": 29.0,
			"damage": 42.0,
			"fire_rate": 1.6,
			"range": 145.0,
			"credits": 950,
			"drop_resource": "plasma_core",
			"scale": 1.35,
		},
		"void_sentinel": {
			"id": "void_sentinel",
			"name": "Void Sentinel",
			"model": "res://assets/models/enemies/enemy_void_sentinel.glb",
			"hp": 1650.0,
			"shield": 600.0,
			"speed": 15.0,
			"damage": 72.0,
			"fire_rate": 1.25,
			"range": 175.0,
			"credits": 2600,
			"drop_resource": "void_iridium",
			"scale": 1.55,
		},
	}
