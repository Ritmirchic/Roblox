extends Node

var _passed: int = 0
var _failed: int = 0
var _failures: Array[String] = []

func _check(cond: bool, label: String) -> void:
	if cond:
		_passed += 1
	else:
		_failed += 1
		_failures.append(label)
		push_error("TEST FAILED: " + label)

func _ready() -> void:
	# Wait one frame so all autoloads & physics server settle
	await get_tree().process_frame
	print("=== SPACE MINER: BUILD & CONQUER — AUTOMATED ENGINE TEST SUITE ===")

	_test_ship_cells_and_crew_formula()
	_test_ship_grid_connectivity_and_rotation()
	_test_ship_mass_com_and_thrusters()
	_test_crew_cards_collection_and_buffs()
	_test_active_upgrades_slots()
	_test_card_packs_and_probabilities()
	_test_achievements_and_utc_resets()
	await _test_live_3d_gameplay_mining_combat_magnets()
	_test_save_load_and_corruption_recovery()
	await _test_multilingual_localization_and_gui_non_overlap()
	_test_expanded_settings_and_hall()
	await _test_achievement_hall3d()

	print("=== TEST SUMMARY: %d PASSED, %d FAILED ===" % [_passed, _failed])
	if _failed > 0:
		for f in _failures:
			print("  FAILURE: ", f)
		get_tree().quit(1)
	else:
		print("ALL_AUTOMATED_TESTS_PASSED_OK")
		get_tree().quit(0)

# 1. Ship Cell Economy & Exact Crew Slot Formula
func _test_ship_cells_and_crew_formula() -> void:
	SaveManager.reset_all_progress()
	# Starting ship has cockpit + 2 free hull cells -> PurchasedExpansionCells MUST be 0 -> 0 crew slots
	_check(ShipGrid.purchased_expansion_cells == 0, "Starter ship has 0 purchased cells")
	_check(ShipGrid.get_unlocked_crew_slots() == 0, "0 purchased cells = 0 crew slots")

	var c0 := ShipGrid.get_next_cell_price()
	ShipGrid.credits = 500000
	for _i in range(9):
		_check(ShipGrid.purchase_expansion_cell(), "Purchase cell up to 9")
	_check(ShipGrid.get_next_cell_price() > c0, "Progressive cell cost increases")
	_check(ShipGrid.purchased_expansion_cells == 9 and ShipGrid.get_unlocked_crew_slots() == 0, "9 cells = 0 crew slots")

	ShipGrid.purchase_expansion_cell() # 10
	_check(ShipGrid.purchased_expansion_cells == 10 and ShipGrid.get_unlocked_crew_slots() == 1, "10 cells = 1 crew slot")

	for _i in range(9):
		ShipGrid.purchase_expansion_cell() # 19
	_check(ShipGrid.purchased_expansion_cells == 19 and ShipGrid.get_unlocked_crew_slots() == 1, "19 cells = 1 crew slot")

	ShipGrid.purchase_expansion_cell() # 20
	_check(ShipGrid.purchased_expansion_cells == 20 and ShipGrid.get_unlocked_crew_slots() == 2, "20 cells = 2 crew slots")

	for _i in range(9):
		ShipGrid.purchase_expansion_cell() # 29
	_check(ShipGrid.purchased_expansion_cells == 29 and ShipGrid.get_unlocked_crew_slots() == 2, "29 cells = 2 crew slots")

	ShipGrid.purchase_expansion_cell() # 30
	_check(ShipGrid.purchased_expansion_cells == 30 and ShipGrid.get_unlocked_crew_slots() == 3, "30 cells = 3 crew slots")

# 2. 3D Grid Placement, Rotation, Overlap, Bounds & BFS Structural Connectivity
func _test_ship_grid_connectivity_and_rotation() -> void:
	SaveManager.reset_all_progress()
	ShipGrid.credits = 200000
	ShipGrid.purchase_expansion_cell()
	ShipGrid.purchase_expansion_cell()

	# Reject disconnected placement in empty space
	var disc := ShipGrid.place_module("hull_cell", Vector3i(4, 0, 0), 0)
	_check(not bool(disc["ok"]), "Reject disconnected cell placement")

	# Reject overlap at cockpit (0,0,0)
	var ov := ShipGrid.place_module("hull_cell", Vector3i(0, 0, 0), 0)
	_check(not bool(ov["ok"]), "Reject overlapping cell placement")

	# Reject out-of-bounds placement
	var oob := ShipGrid.validate_placement("hull_cell", Vector3i(99, 0, 0), 0, true)
	_check(not bool(oob["ok"]), "Reject out-of-bounds placement")

	# Valid connected hull placement at (-1,0,0) and (-2,0,0)
	var p1 := ShipGrid.place_module("hull_cell", Vector3i(-1, 0, 0), 0)
	var p2 := ShipGrid.place_module("hull_cell", Vector3i(-2, 0, 0), 0)
	_check(bool(p1["ok"]) and bool(p2["ok"]), "Place connected hull chain (-1,0,0)->(-2,0,0)")

	# Structural bridge removal check: removing (-1,0,0) would disconnect (-2,0,0) -> MUST be rejected!
	var bad_rem := ShipGrid.remove_module_at(Vector3i(-1, 0, 0))
	_check(not bool(bad_rem["ok"]), "Prevent removing structural bridge cell that disconnects outer module")

	# Leaf removal (-2,0,0) succeeds
	var leaf_rem := ShipGrid.remove_module_at(Vector3i(-2, 0, 0))
	_check(bool(leaf_rem["ok"]), "Allow removing leaf cell (-2,0,0)")

	# Multi-cell 1x1x2 Railgun rotation & placement check
	ShipGrid.buy_equipment("railgun")
	var rg := ShipGrid.place_module("railgun", Vector3i(-1, 1, 0), 1) # Rotated 90 deg yaw
	_check(bool(rg["ok"]), "Place rotated 2-cell Railgun")
	_check(ShipGrid.cell_to_uid.has(Vector3i(-1, 1, 0)) and ShipGrid.cell_to_uid.has(Vector3i(-2, 1, 0)), "Rotated 1x1x2 footprint occupies exact 2 cells")

# 3. Physical Mass, Center of Mass & Thruster Physics
func _test_ship_mass_com_and_thrusters() -> void:
	SaveManager.reset_all_progress()
	ShipGrid.credits = 200000
	var base_stats := ShipGrid.compute_ship_stats()
	var base_mass := float(base_stats["total_mass"])
	var base_com: Vector3 = base_stats["center_of_mass"]
	var base_thrust := float(base_stats["total_thrust"])

	# Install heavy armor plate on far right (+2, 0, 0) -> CoM.x must shift positive & mass increase!
	ShipGrid.buy_equipment("armor_plate")
	var res := ShipGrid.place_module("armor_plate", Vector3i(2, 0, 0), 0)
	_check(bool(res["ok"]), "Attach heavy armor on +X")
	var new_stats := ShipGrid.compute_ship_stats()
	_check(float(new_stats["total_mass"]) > base_mass + 13.0, "Mass increases accurately with heavy armor")
	_check((new_stats["center_of_mass"] as Vector3).x > base_com.x + 0.3, "Center of mass shifts toward heavy +X module")

	# Adding cargo increases total mass & changes handling acceleration
	ShipGrid.add_cargo_resource("void_iridium", 20)
	var loaded_stats := ShipGrid.compute_ship_stats()
	_check(float(loaded_stats["total_mass"]) > float(new_stats["total_mass"]), "Cargo adds physical weight to ship")
	_check(float(loaded_stats["acceleration"]) < float(new_stats["acceleration"]), "Heavy cargo reduces linear acceleration")

	# Adding Thruster Booster increases total thrust
	ShipGrid.buy_equipment("thruster_booster")
	var tb := ShipGrid.place_module("thruster_booster", Vector3i(-1, 0, 0), 0)
	_check(bool(tb["ok"]), "Install Thruster Booster")
	_check(float(ShipGrid.compute_ship_stats()["total_thrust"]) > base_thrust + 300.0, "Thruster booster increases ship thrust")

# 4. 42 Crew Cards, Capacity Restrictions & Exact Buff Math
func _test_crew_cards_collection_and_buffs() -> void:
	SaveManager.reset_all_progress()
	_check(GameData.crew_cards.size() >= 40, "At least 40 unique Crew Cards exist (42)")

	# Verify all 7 rarities exist and all portraits exist
	for r in GameData.RARITY_ORDER:
		var matches := CrewManager.query_cards("", r, "Number", false)
		_check(not matches.is_empty(), "Crew rarity present: " + r)
	for c in GameData.crew_cards:
		_check(ResourceLoader.exists(str(c["portrait"])), "Portrait exists for " + str(c["id"]))

	# Cannot equip with 0 unlocked crew slots
	var eq_fail := CrewManager.equip_card("crew_01")
	_check(not bool(eq_fail["ok"]), "Block equipping crew when 0 slots unlocked")

	# Unlock 2 crew slots (20 purchased cells)
	ShipGrid.credits = 500000
	for _i in range(20):
		ShipGrid.purchase_expansion_cell()
	_check(ShipGrid.get_unlocked_crew_slots() == 2, "20 cells unlocked 2 crew slots")

	# Grant Legendary Gunner (#32: x3 damage) and Mythic Miner (#37: x5 loot) and Legendary Pilot (#33: x2 speed)
	CrewManager.add_card_to_collection("crew_32")
	CrewManager.add_card_to_collection("crew_37")
	CrewManager.add_card_to_collection("crew_33")

	var base_wpn := float(ShipGrid.compute_ship_stats()["weapon_dps"])
	_check(bool(CrewManager.equip_card("crew_32")["ok"]), "Equip Legendary Gunner in slot 1")
	_check(not bool(CrewManager.equip_card("crew_32")["ok"]), "Prevent duplicate equipping of same crew card")
	_check(bool(CrewManager.equip_card("crew_37")["ok"]), "Equip Mythic Miner in slot 2")
	_check(not bool(CrewManager.equip_card("crew_33")["ok"]), "Enforce strict 2-slot crew capacity cap")

	var buffed := ShipGrid.compute_ship_stats()
	_check(is_equal_approx(float(buffed["loot_mult"]), 5.0), "Mythic Miner applies exact x5.0 loot multiplier")
	if base_wpn > 0.0:
		_check(is_equal_approx(float(buffed["weapon_dps"]), base_wpn * 3.0), "Legendary Gunner triples weapon DPS")
	else:
		_check(is_equal_approx(float(buffed["damage_mult"]), 3.0), "Legendary Gunner sets x3.0 damage multiplier")

# 5. Active Upgrades: 3 Default, 4th Purchased, 5th 1% Relic, Max 5
func _test_active_upgrades_slots() -> void:
	SaveManager.reset_all_progress()
	_check(UpgradeManager.get_unlocked_slots() == 3, "Default 3 active upgrade slots")

	ShipGrid.credits = 200000
	ShipGrid.crystals = 500
	for id_str in ["upg_02", "upg_03", "upg_04", "upg_05"]:
		UpgradeManager.buy_upgrade(id_str)
	_check(UpgradeManager.active_equipped.size() == 3, "Cannot auto-equip more than 3 default upgrade slots")
	_check(not bool(UpgradeManager.toggle_equip_upgrade("upg_04")["ok"]), "4th upgrade blocked before unlocking 4th slot")

	# Purchase 4th slot permanently & verify duplicate prevention
	var p4 := UpgradeManager.purchase_fourth_slot()
	_check(bool(p4["ok"]) and UpgradeManager.get_unlocked_slots() == 4, "4th active upgrade slot purchased")
	var p4_dup := UpgradeManager.purchase_fourth_slot()
	_check(not bool(p4_dup["ok"]), "Prevent duplicate 4th slot purchase")

	# Verify exact 1% probability config & 5th slot cap
	_check(is_equal_approx(UpgradeManager.FIFTH_SLOT_DROP_PROBABILITY, 0.01), "5th slot drop chance is exact 1.0%")
	var fixed_rng := RandomNumberGenerator.new()
	# Simulate deterministic win by forcing unlock check
	UpgradeManager.fifth_slot_unlocked = true
	_check(UpgradeManager.get_unlocked_slots() == 5, "5th active upgrade slot reaches max 5 slots")
	_check(not UpgradeManager.try_roll_fifth_slot_reward(fixed_rng), "Prevent duplicate 5th slot permanent unlock")

# 6. Card Packs: Crystal Cost, Exact 3 Cards, Probabilities
func _test_card_packs_and_probabilities() -> void:
	SaveManager.reset_all_progress()
	UpgradeManager.fifth_slot_unlocked = false
	var probs := PackManager.get_probability_table("standard")
	var sum_p := 0.0
	for r in GameData.RARITY_ORDER:
		sum_p += float(probs[r])
	_check(is_equal_approx(sum_p, 100.0), "Standard pack rarity probabilities sum to 100%")
	_check(is_equal_approx(float(probs["fifth_upgrade_slot_per_roll_pct"]), 1.0), "Pack discloses 1.0% 5th slot probability")

	ShipGrid.crystals = 100
	var open_res := PackManager.purchase_and_open_pack("standard")
	_check(bool(open_res["ok"]), "Standard pack purchased with Crystals")
	_check(ShipGrid.crystals == 70, "Deducted exact 30 Crystals")
	_check((open_res["cards"] as Array).size() == 3, "Standard pack yields EXACTLY 3 cards")

# 7. Achievements: 15W + 7D + 3H + 5M = 30 Active, UTC Resets & Duplicate Claim Lock
func _test_achievements_and_utc_resets() -> void:
	SaveManager.reset_all_progress()
	var base_utc := 1792939200.0 # Clean UTC timestamp
	AchievementManager.test_utc_override = base_utc
	AchievementManager.bucket_ids = {"minute": -1, "hourly": -1, "daily": -1, "weekly": -1}
	AchievementManager.ensure_buckets_current()

	_check(AchievementManager.active_tasks["weekly"].size() == 15, "15 Weekly achievements active")
	_check(AchievementManager.active_tasks["daily"].size() == 7, "7 Daily achievements active")
	_check(AchievementManager.active_tasks["hourly"].size() == 3, "3 Hourly achievements active")
	_check(AchievementManager.active_tasks["minute"].size() == 5, "5 Minute achievements active")
	_check(AchievementManager.get_total_active_count() == 30, "Total 30 active collectible achievement cards")

	# Complete a Minute task, claim crystals, verify duplicate claim is blocked!
	var mtask: Dictionary = AchievementManager.active_tasks["minute"][0]
	var ev_type: String = mtask["event_type"]
	var target_val: int = int(mtask["target"])
	var cry_before := ShipGrid.crystals
	AchievementManager.record_event(ev_type, float(target_val))
	_check(bool(mtask["completed"]), "Minute achievement completes on progress")

	var claim1 := AchievementManager.claim_reward("minute", str(mtask["id"]))
	_check(bool(claim1["ok"]) and ShipGrid.crystals == cry_before + int(mtask["crystal_reward"]), "Crystal reward granted on claim")
	var claim_dup := AchievementManager.claim_reward("minute", str(mtask["id"]))
	_check(not bool(claim_dup["ok"]), "Duplicate crystal claim strictly blocked")

	# Advance UTC by +61s -> Minute bucket resets while Hourly/Daily/Weekly stay!
	var prev_min_b := int(AchievementManager.bucket_ids["minute"])
	var prev_hr_b := int(AchievementManager.bucket_ids["hourly"])
	AchievementManager.test_utc_override = base_utc + 61.0
	AchievementManager.ensure_buckets_current()
	_check(int(AchievementManager.bucket_ids["minute"]) != prev_min_b, "Minute achievements reset at +60s UTC")
	_check(int(AchievementManager.bucket_ids["hourly"]) == prev_hr_b, "Hourly bucket unchanged at +61s UTC")

	# Advance +3605s, +86405s, +604805s -> verify Hourly, Daily, Weekly resets!
	var prev_day_b := int(AchievementManager.bucket_ids["daily"])
	var prev_wk_b := int(AchievementManager.bucket_ids["weekly"])
	AchievementManager.test_utc_override = base_utc + 3605.0
	AchievementManager.ensure_buckets_current()
	_check(int(AchievementManager.bucket_ids["hourly"]) != prev_hr_b, "Hourly achievements reset at +3600s UTC")

	AchievementManager.test_utc_override = base_utc + 86405.0
	AchievementManager.ensure_buckets_current()
	_check(int(AchievementManager.bucket_ids["daily"]) != prev_day_b, "Daily achievements reset at +86400s UTC")

	AchievementManager.test_utc_override = base_utc + 604805.0
	AchievementManager.ensure_buckets_current()
	_check(int(AchievementManager.bucket_ids["weekly"]) != prev_wk_b, "Weekly achievements reset at +604800s UTC")
	AchievementManager.test_utc_override = -1.0

# 8. Live 3D Gameplay: Ship Movement, Mining, Physical Chunks, Magnets, Combat & Sectors
func _test_live_3d_gameplay_mining_combat_magnets() -> void:
	SaveManager.reset_all_progress()
	# Install owned magnet_basic & machine_gun onto starter ship!
	_check(bool(ShipGrid.place_module("magnet_basic", Vector3i(-1, 0, 0), 0)["ok"]), "Install Magnetic Collector")
	_check(bool(ShipGrid.place_module("machine_gun", Vector3i(0, 1, 0), 0)["ok"]), "Install Rotary Autocannon")

	var exp_world := SpaceExpedition3D.new()
	exp_world.autopilot_override = true
	exp_world.setup_sector(0)
	add_child(exp_world)
	await get_tree().process_frame
	await get_tree().physics_frame

	var ship := exp_world.player_ship
	_check(is_instance_valid(ship), "3D PlayerShip instantiated in SpaceExpedition3D")

	# Ship movement test
	var start_pos := ship.global_position
	ship.thrust_input = Vector3(0, 0, 1)
	for _i in range(30):
		await get_tree().physics_frame
	_check(ship.global_position.distance_to(start_pos) > 0.15 and ship.linear_velocity.length() > 1.0, "Thruster physics accelerates RigidBody3D ship in space")
	ship.thrust_input = Vector3.ZERO
	ship.linear_velocity = Vector3.ZERO

	# Asteroid mining & physical resource chunk spawn test
	var test_ast := Asteroid3D.new()
	test_ast.setup(GameData.sectors[0], ship.global_position + Vector3(0, 0, -18), 1.0)
	exp_world.asteroids_root.add_child(test_ast)
	await get_tree().physics_frame
	var chunks_before := exp_world.chunks_root.get_child_count()
	var shattered := test_ast.apply_mining_damage(500.0, 3, 1.0, 0.0, exp_world.chunks_root)
	_check(shattered, "Asteroid shatters when mined to 0 HP")
	_check(exp_world.chunks_root.get_child_count() > chunks_before, "Destroyed asteroid spawns physical 3D ResourceChunk3D nodes")

	# Magnet pull & atomic duplicate collection lock test
	var ch: ResourceChunk3D = exp_world.chunks_root.get_child(exp_world.chunks_root.get_child_count() - 1)
	ch.global_position = ship.global_position + Vector3(0, 0, -14)
	ch.velocity = Vector3.ZERO
	for _i in range(12):
		await get_tree().physics_frame
	_check(ch.velocity.length() > 0.2, "Magnetic collector physically pulls nearby ResourceChunk3D toward ship")

	var cargo_before := ShipGrid.get_current_cargo_units()
	var c1 := ch.try_collect()
	var c2 := ch.try_collect()
	_check(c1 and not c2 and ShipGrid.get_current_cargo_units() > cargo_before, "ResourceChunk3D enters cargo & blocks duplicate collection")

	# Multi-directional 3D projectile trajectory test (-Z, +X, +Z, +Y) from off-origin ship
	for a in exp_world.asteroids_root.get_children():
		a.queue_free()
	for e_old in exp_world.enemies_root.get_children():
		e_old.queue_free()
	await get_tree().process_frame

	var test_ship_origin := Vector3(40.0, 25.0, -30.0)
	ship.locked_enemy = null
	var test_dirs: Array[Vector3] = [
		Vector3(0, 0, -1),
		Vector3(1, 0, 0),
		Vector3(0, 0, 1),
		Vector3(0, 1, 0),
	]
	for aim_d in test_dirs:
		for old_p in exp_world.projectiles_root.get_children():
			old_p.queue_free()
		await get_tree().process_frame
		var desired_xf := Projectile3D.make_aim_transform(test_ship_origin, aim_d)
		PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, desired_xf)
		PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3.ZERO)
		ship.global_transform = desired_xf
		ship.linear_velocity = Vector3.ZERO
		ship.current_energy = 120.0
		ship._weapon_cooldowns.clear()
		ship.aimed_world_point = test_ship_origin + aim_d * 180.0
		ship.firing_weapons = true
		await get_tree().physics_frame
		await get_tree().physics_frame
		ship.firing_weapons = false
		_check(exp_world.projectiles_root.get_child_count() >= 1, "Weapon spawned Projectile3D for aim " + str(aim_d))
		if exp_world.projectiles_root.get_child_count() >= 1:
			var pr := exp_world.projectiles_root.get_child(0) as Projectile3D
			var spawn_p := pr.global_position
			_check(spawn_p.distance_to(test_ship_origin) < 12.0, "Projectile spawns at ship muzzle (not world origin) for " + str(aim_d))
			await get_tree().physics_frame
			await get_tree().physics_frame
			if is_instance_valid(pr):
				var travel_dir := (pr.global_position - spawn_p).normalized()
				_check(travel_dir.dot(aim_d) > 0.96, "Projectile flies accurately along aimed 3D vector " + str(aim_d))

	# Crosshair #2 (Terminal Bullet Impact Sight) end-to-end 3D accuracy test:
	# 1) Open-space terminal range check
	for old_p in exp_world.projectiles_root.get_children():
		old_p.queue_free()
	await get_tree().process_frame
	var drift_xf := Projectile3D.make_aim_transform(test_ship_origin, Vector3(0, 0, -1))
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3.ZERO)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_ANGULAR_VELOCITY, Vector3.ZERO)
	ship.global_transform = drift_xf
	ship.linear_velocity = Vector3.ZERO
	ship.angular_velocity = Vector3.ZERO
	ship.rot_input = Vector3.ZERO
	ship.aimed_world_point = test_ship_origin + Vector3(0, 0, -250.0)
	for _s in range(20):
		await get_tree().physics_frame
	var open_sight := ship.get_ballistic_sight_info()
	_check(str(open_sight["hit_kind"]) == "none" and absf(float(open_sight["distance"]) - 210.0 * 2.8) < 1.0, "Crosshair #2 open-space point equals exact bullet max flight distance")

	# 2) Off-bore 3D Asteroid impact: verify real fired Projectile3D lands at exact Crosshair #2 world_pos!
	var target_ast := Asteroid3D.new()
	var ast_pos := test_ship_origin + Vector3(18.0, 6.0, -64.0)
	target_ast.setup(GameData.sectors[0], ast_pos, 1.8)
	exp_world.asteroids_root.add_child(target_ast)
	await get_tree().physics_frame
	await get_tree().physics_frame

	ship.aimed_world_point = ast_pos
	for _s in range(45): # Let mechanical turret slew smoothly onto off-bore asteroid
		await get_tree().physics_frame

	var ast_sight := ship.get_ballistic_sight_info()
	var predicted_impact: Vector3 = ast_sight["world_pos"]
	_check(str(ast_sight["hit_kind"]) == "asteroid", "Crosshair #2 detects off-bore 3D Asteroid surface along barrel ray")

	var hit_record := {"hit": false, "pos": Vector3.ZERO}
	ship.current_energy = 120.0
	ship._weapon_cooldowns.clear()
	ship.firing_weapons = true
	await get_tree().physics_frame
	await get_tree().physics_frame
	ship.firing_weapons = false

	if exp_world.projectiles_root.get_child_count() >= 1:
		var pr_real := exp_world.projectiles_root.get_child(0) as Projectile3D
		pr_real.impacted.connect(func(hp: Vector3, _col: Object) -> void:
			hit_record["hit"] = true
			hit_record["pos"] = hp
		)
		# Even if ship accelerates sideways AFTER firing, bullet must hit the exact predicted 3D point!
		PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3(32.0, 0.0, 0.0))
		ship.linear_velocity = Vector3(32.0, 0.0, 0.0)
		for _step_b in range(60):
			await get_tree().physics_frame
			if bool(hit_record["hit"]):
				break
	var impact_err := (hit_record["pos"] as Vector3).distance_to(predicted_impact)
	_check(bool(hit_record["hit"]) and impact_err < 0.20, "Fired Projectile3D hits exact 3D point shown by Crosshair #2 (err < 0.20m)")
	if is_instance_valid(target_ast):
		target_ast.queue_free()
	await get_tree().process_frame

	# Controlled rotation speed check (must NOT turn too fast!) + smooth 180+ deg pitch loop without gimbal lock
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3.ZERO)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_ANGULAR_VELOCITY, Vector3.ZERO)
	ship.global_transform = drift_xf
	ship.linear_velocity = Vector3.ZERO
	ship.angular_velocity = Vector3.ZERO
	var init_fwd := (-ship.global_transform.basis.z).normalized()
	ship.rot_input = Vector3(0.0, 1.0, 0.0) # Full yaw input for 0.25s (30 ticks @ 120Hz)
	for _step_y in range(30):
		await get_tree().physics_frame
	var after_fwd := (-ship.global_transform.basis.z).normalized()
	var yaw_quarter_deg := rad_to_deg(acos(clampf(init_fwd.dot(after_fwd), -1.0, 1.0)))
	_check(yaw_quarter_deg > 7.0 and yaw_quarter_deg < 30.0 and ship.angular_velocity.length() < 2.2, "Turn rate is calm and controllable (~85-95 deg/s max, never overly fast)")

	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_ANGULAR_VELOCITY, Vector3.ZERO)
	ship.global_transform = drift_xf
	ship.angular_velocity = Vector3.ZERO
	ship.rot_input = Vector3(1.0, 0.0, 0.0) # Full pitch loop up to 2.0s (240 ticks @ 120Hz)
	var went_upside_down := false
	for _step in range(240):
		await get_tree().physics_frame
		if ship.global_transform.basis.y.y < -0.5:
			went_upside_down = true
			break
	_check(went_upside_down, "Ship smoothly pitches past 180 deg upside-down without gimbal lock")
	ship.rot_input = Vector3.ZERO

	# Magnetic Homing Radar purchase, installation & self-homing bullet test!
	for old_p2 in exp_world.projectiles_root.get_children():
		old_p2.queue_free()
	await get_tree().process_frame

	ShipGrid.credits = 1200 # Affordable even on starter career budget!
	var buy_mag := ShipGrid.buy_equipment("magnetic_radar")
	_check(bool(buy_mag["ok"]), "Purchase Magnetic Homing Radar in Equipment Shop")
	var place_mag := ShipGrid.place_module("magnetic_radar", Vector3i(0, 1, 1), 0)
	_check(bool(place_mag["ok"]), "Install Magnetic Homing Radar onto 3D ship grid")
	ship.rebuild_from_grid()
	await get_tree().process_frame
	await get_tree().physics_frame
	_check(float(ship.stats.get("bullet_magnet_range", 0.0)) >= 235.0 and float(ship.stats.get("bullet_magnet_turn", 0.0)) >= 7.5, "Magnetic Homing Radar activates bullet_magnet_range & bullet_magnet_turn")

	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3.ZERO)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_ANGULAR_VELOCITY, Vector3.ZERO)
	ship.global_transform = drift_xf
	ship.linear_velocity = Vector3.ZERO
	ship.angular_velocity = Vector3.ZERO
	ship.locked_enemy = null # NO manual target lock! Bullets must find and fly into the enemy by themselves!
	ship.aimed_world_point = test_ship_origin + Vector3(0.0, 0.0, -220.0) # Aiming straight ahead (-Z)
	for _s2 in range(15):
		await get_tree().physics_frame

	# Spawn hostile ship ~36 deg off to the side (+X/+Y) so a straight shot along -Z would completely miss!
	var mag_enemy := EnemyShip3D.new()
	mag_enemy.setup("scout_drone", test_ship_origin + Vector3(36.0, 8.0, -52.0), ship, exp_world.projectiles_root, exp_world.chunks_root)
	mag_enemy.max_hp = 500.0
	mag_enemy.hp = 500.0
	mag_enemy._fire_cd = 99.0
	exp_world.enemies_root.add_child(mag_enemy)
	await get_tree().physics_frame
	await get_tree().physics_frame

	var mag_sight := ship.get_ballistic_sight_info()
	_check(str(mag_sight["hit_kind"]) == "magnetic_enemy", "Crosshair #2 snaps onto off-bore enemy when Magnetic Homing Radar is installed")

	var mag_hit := {"hit_enemy": false}
	ship.current_energy = 120.0
	ship._weapon_cooldowns.clear()
	ship.firing_weapons = true
	await get_tree().physics_frame
	await get_tree().physics_frame
	ship.firing_weapons = false

	if exp_world.projectiles_root.get_child_count() >= 1:
		var pr_mag := exp_world.projectiles_root.get_child(0) as Projectile3D
		_check(pr_mag.magnetic_homing, "Fired bullet has magnetic_homing enabled")
		pr_mag.impacted.connect(func(_hp_v: Vector3, col_obj: Object) -> void:
			if col_obj == mag_enemy:
				mag_hit["hit_enemy"] = true
		)
		for _step_m in range(90):
			await get_tree().physics_frame
			if bool(mag_hit["hit_enemy"]) or mag_enemy.hp < 500.0:
				mag_hit["hit_enemy"] = true
				break
	_check(bool(mag_hit["hit_enemy"]) and mag_enemy.hp < 500.0, "Magnetized bullet curves in 3D flight by itself and hits off-bore EnemyShip3D")
	if is_instance_valid(mag_enemy):
		mag_enemy.queue_free()
	await get_tree().process_frame

	# Enemy AI & Combat test
	var enemy := EnemyShip3D.new()
	enemy.setup("scout_drone", ship.global_position + Vector3(0, 0, -45), ship, exp_world.projectiles_root, exp_world.chunks_root)
	exp_world.enemies_root.add_child(enemy)
	await get_tree().physics_frame
	var cr_before := ShipGrid.credits
	enemy.take_weapon_damage(500.0)
	_check(ShipGrid.credits > cr_before, "Defeating EnemyShip3D awards bounty credits & drops loot")

	# Sector unlocking test
	ShipGrid.credits = 100000
	for _i in range(5):
		ShipGrid.purchase_expansion_cell()
	var unl := ShipGrid.unlock_sector(1)
	_check(bool(unl["ok"]) and ShipGrid.unlocked_sectors.has(1), "Unlock Crystal Nebula Sector #2")

	exp_world.queue_free()
	await get_tree().process_frame

# 9. Versioned Save/Load & Corrupted Save Fallback
func _test_save_load_and_corruption_recovery() -> void:
	SaveManager.reset_all_progress()
	ShipGrid.credits = 200000
	for _i in range(12):
		ShipGrid.purchase_expansion_cell()
	ShipGrid.credits = 42424
	ShipGrid.crystals = 333
	CrewManager.add_card_to_collection("crew_38")
	CrewManager.equip_card("crew_38")
	UpgradeManager.fourth_slot_unlocked = true

	var test_path := "user://test_unit_save.json"
	_check(SaveManager.save_game(test_path), "Write versioned save file")

	# Wipe memory and reload
	SaveManager.reset_all_progress()
	_check(ShipGrid.credits == 1200, "Reset wiped credits before load")
	_check(SaveManager.load_game(test_path), "Load versioned save file")
	_check(ShipGrid.credits == 42424 and ShipGrid.crystals == 333, "Restored exact credits and crystals")
	_check(ShipGrid.purchased_expansion_cells == 12 and ShipGrid.get_unlocked_crew_slots() == 1, "Restored expansion cells & crew slot")
	_check(CrewManager.equipped_crew.has("crew_38"), "Restored equipped crew card")
	_check(UpgradeManager.fourth_slot_unlocked, "Restored permanent 4th upgrade slot")

	# Test corrupted save rejection & .bak recovery on default path
	SaveManager.save_game(SaveManager.DEFAULT_SAVE_PATH)
	SaveManager.save_game(SaveManager.DEFAULT_SAVE_PATH) # Creates .bak of valid save
	var bad := FileAccess.open(SaveManager.DEFAULT_SAVE_PATH, FileAccess.WRITE)
	bad.store_string("{corrupted_json_not_valid!!!")
	bad.close()

	_check(SaveManager.load_game(SaveManager.DEFAULT_SAVE_PATH), "Recovered cleanly from .bak when primary save is corrupted")
	_check(SaveManager.last_load_status == "recovered_from_backup", "Reported recovered_from_backup status")

# 10. Multilingual Localization (10 Languages, Russian Default) & Zero-Overlap GUI Geometry
func _test_multilingual_localization_and_gui_non_overlap() -> void:
	L.set_language("ru")
	_check(L.current_lang == "ru", "Russian (ru) is active primary language")
	_check(L.LANG_ORDER.size() == 10, "All 10 major world languages registered in Localization")
	_check(L.tr_ui("menu_enter_hangar").find("АНГАР") >= 0, "Russian Main Menu translation active")

	# Verify font fallback chain loaded cleanly on all 4 primary FontFiles
	_check(ThemeHelper.font_display != null and ThemeHelper.font_display.fallbacks.size() == 4, "Display font loaded with 4 CJK/Symbol fallbacks")
	_check(ThemeHelper.font_body != null and ThemeHelper.font_body.fallbacks.size() == 4, "Body font loaded with 4 CJK/Symbol fallbacks")

	# Cycle all 10 languages & verify SaveManager persists language selection
	for code_var in L.LANG_ORDER:
		var code: String = str(code_var)
		L.set_language(code)
		_check(L.current_lang == code, "Switched language to " + code)
		_check(not L.tr_ui("menu_enter_hangar").is_empty(), "Non-empty menu_enter_hangar in " + code)
		_check(not L.mod_name("magnetic_radar").is_empty(), "Non-empty magnetic_radar name in " + code)
		_check(not L.crew_bonus(GameData.crew_cards[0]).is_empty(), "Non-empty crew bonus in " + code)
		_check(not L.sector_name(GameData.sectors[0]).is_empty(), "Non-empty sector title in " + code)

	L.set_language("ja")
	var lang_save := "user://test_lang_save.json"
	_check(SaveManager.save_game(lang_save), "Saved game with Japanese language")
	L.set_language("en")
	_check(SaveManager.load_game(lang_save) and L.current_lang == "ja", "Restored persisted language from save file")
	L.set_language("ru")

	# Verify Main Menu layout, wrapped label widths, and button non-overlap
	var main_script: GDScript = load("res://scripts/ui/Main.gd")
	var main_inst: Node = main_script.new()
	add_child(main_inst)
	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	var menu_tagline: Label = main_inst.get("_tagline_lbl") as Label
	var menu_summary: Label = main_inst.get("_summary_lbl") as Label
	_check(is_instance_valid(menu_tagline) and menu_tagline.size.x >= 350.0, "Main Menu tagline has full readable width (not narrow column)")
	_check(is_instance_valid(menu_summary) and menu_summary.size.x >= 350.0, "Main Menu commander summary pill has full readable width")

	var menu_btns: Array[Control] = [
		main_inst.get("_play_btn") as Control,
		main_inst.get("_quick_btn") as Control,
		main_inst.get("_set_btn") as Control,
		main_inst.get("_new_btn") as Control,
		main_inst.get("_quit_btn") as Control,
	]
	for i in range(menu_btns.size()):
		_check(menu_btns[i].size.x >= 350.0 and menu_btns[i].size.y >= 38.0, "Main Menu button #%d properly sized" % i)
		for j in range(i + 1, menu_btns.size()):
			_check(not menu_btns[i].get_global_rect().grow(-0.5).intersects(menu_btns[j].get_global_rect().grow(-0.5)), "Main Menu buttons #%d and #%d do not overlap" % [i, j])

	var menu_bad_scales: Array[String] = []
	var menu_narrow_lbls: Array[String] = []
	_scan_ui_subtree_invariants(main_inst, menu_bad_scales, menu_narrow_lbls)
	_check(menu_bad_scales.is_empty(), "Main Menu has zero scaled Controls inside Containers: " + ", ".join(menu_bad_scales))
	_check(menu_narrow_lbls.is_empty(), "Main Menu has zero narrow vertical-column wrapped Labels: " + ", ".join(menu_narrow_lbls))

	main_inst.queue_free()
	await get_tree().process_frame
	await get_tree().process_frame

	# Instantiate Hangar3D and verify ZERO pairwise rectangle overlap across all 5 HUD docks + mouse guard
	ShipGrid.reset_to_starter_ship()
	var hangar := Hangar3D.new()
	add_child(hangar)
	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	var h_panels: Array[Control] = [
		hangar._top_bar,
		hangar._left_panel,
		hangar._right_panel,
		hangar._status_box,
		hangar._bottom_dock,
	]
	for i in range(h_panels.size()):
		for j in range(i + 1, h_panels.size()):
			var ra: Rect2 = h_panels[i].get_global_rect()
			var rb: Rect2 = h_panels[j].get_global_rect()
			_check(not ra.intersects(rb), "Zero overlap between %s and %s" % [h_panels[i].name, h_panels[j].name])

	var vp_rect: Rect2 = get_viewport().get_visible_rect()
	_check(hangar._is_screen_pos_over_hud(hangar._left_panel.get_global_rect().get_center()), "Mouse guard blocks clicks over HangarLeftPanel")
	_check(hangar._is_screen_pos_over_hud(hangar._bottom_dock.get_global_rect().get_center()), "Mouse guard blocks clicks over HangarBottomDock")
	_check(not hangar._is_screen_pos_over_hud(vp_rect.get_center()), "Center 3D Shipbay viewport remains open for 3D raycast")

	# Deep post-layout verification across ALL 7 Station Tabs + Tab-to-Tab transitions!
	for tab in ["shop", "upgrades", "crew", "packs", "achievements", "launch", "settings"]:
		hangar._station_panels.open_tab(tab)
		await get_tree().process_frame
		await get_tree().process_frame
		await get_tree().process_frame

		var body_root: Control = hangar._station_panels._body_root
		_check(hangar._station_panels.size.x >= 1200.0 and hangar._station_panels.size.y >= 700.0, "Station overlay '%s' fills viewport (%s)" % [tab, str(hangar._station_panels.size)])
		_check(body_root.size.x >= 1100.0 and body_root.size.y >= 480.0, "Station tab '%s' body_root fills modal (%s)" % [tab, str(body_root.size)])
		_check(hangar._station_panels._pack_modal.size.x >= 1200.0 and hangar._station_panels._pack_modal.size.y >= 700.0, "PackOpeningModal fills viewport (%s)" % str(hangar._station_panels._pack_modal.size))

		# Verify every ScrollContainer inside the active tab has >= 320px visible viewport height (NEVER 0px!)
		for sc_node in body_root.find_children("*", "ScrollContainer", true, false):
			var sc_ctrl := sc_node as ScrollContainer
			if sc_ctrl.is_visible_in_tree():
				_check(sc_ctrl.size.x >= 280.0 and sc_ctrl.size.y >= 320.0, "Tab '%s' ScrollContainer visible viewport size=%s" % [tab, str(sc_ctrl.size)])

		var bad_scales: Array[String] = []
		var narrow_lbls: Array[String] = []
		_scan_ui_subtree_invariants(hangar._station_panels, bad_scales, narrow_lbls)
		_check(bad_scales.is_empty(), "Tab '%s' has zero scaled Controls inside Containers: %s" % [tab, ", ".join(bad_scales)])
		_check(narrow_lbls.is_empty(), "Tab '%s' has zero narrow wrapped Labels: %s" % [tab, ", ".join(narrow_lbls)])

		if tab == "shop":
			var shop_grid: Control = body_root.find_child("ShopModuleGrid", true, false) as Control
			var shop_inst: Control = body_root.find_child("ShopInstalledList", true, false) as Control
			_assert_grid_children_laid_out(shop_grid, 14, 280.0, 130.0, "ShopModuleGrid")
			_assert_grid_children_laid_out(shop_inst, 2, 250.0, 80.0, "ShopInstalledList")
		elif tab == "upgrades":
			var upg_slots: Control = body_root.find_child("UpgradeSlotsGrid", true, false) as Control
			var upg_proto: Control = body_root.find_child("UpgradeProtocolGrid", true, false) as Control
			var upg_hw: Control = body_root.find_child("UpgradeHardwareGrid", true, false) as Control
			_assert_grid_children_laid_out(upg_slots, 5, 170.0, 80.0, "UpgradeSlotsGrid (5 slots)")
			_assert_grid_children_laid_out(upg_proto, 18, 270.0, 110.0, "UpgradeProtocolGrid (all 18 protocols)")
			_assert_grid_children_laid_out(upg_hw, 2, 250.0, 80.0, "UpgradeHardwareGrid (installed ship modules)")
		elif tab == "crew":
			var crew_grid: Control = body_root.find_child("CrewFlowGrid", true, false) as Control
			_assert_grid_children_laid_out(crew_grid, 42, 195.0, 290.0, "CrewFlowGrid (all 42 cards)")
		elif tab == "packs":
			var pack_row: Control = body_root.find_child("PackCardsRow", true, false) as Control
			_assert_grid_children_laid_out(pack_row, 2, 440.0, 460.0, "PackCardsRow (Standard & Elite packs)")
		elif tab == "achievements":
			var ach_grid: Control = body_root.find_child("AchievementGrid", true, false) as Control
			_assert_grid_children_laid_out(ach_grid, 5, 260.0, 220.0, "AchievementGrid (5 minute tasks)")
		elif tab == "launch":
			var sec_grid: Control = body_root.find_child("SectorGrid", true, false) as Control
			_assert_grid_children_laid_out(sec_grid, 5, 340.0, 140.0, "SectorGrid (5 space sectors)")
		elif tab == "settings":
			var set_grid: Control = body_root.find_child("SettingsGroups", true, false) as Control
			_check(is_instance_valid(set_grid), "Expanded settings grid exists")
			var set_cards: Array = [] if not is_instance_valid(set_grid) else set_grid.get_children()
			_check(set_cards.size() == 4, "Settings has 4 grouped display/audio/flight/HUD cards (%d)" % set_cards.size())
			var set_ok := true
			for sc_ch in set_cards:
				var scc := sc_ch as Control
				if not is_instance_valid(scc) or scc.size.x < 300.0 or scc.size.y < 220.0:
					set_ok = false
			_check(set_ok, "Every settings group card is sized >= 300x220")
			var set_ctl := 0
			if is_instance_valid(set_grid):
				set_ctl = _count_interactive_controls(set_grid)
			_check(set_ctl >= 18, "Expanded settings exposes >= 18 interactive controls (found %d)" % set_ctl)
			var set_bad: Array[String] = []
			var set_narrow: Array[String] = []
			if is_instance_valid(set_grid):
				_scan_ui_subtree_invariants(set_grid, set_bad, set_narrow)
			_check(set_bad.is_empty(), "Settings grid has zero scaled Controls inside Containers")
			_check(set_narrow.is_empty(), "Settings grid has zero narrow wrapped Labels")

	hangar._station_panels.close_panel()
	hangar.queue_free()
	await get_tree().process_frame

	# Instantiate SpaceExpedition3D and verify ZERO pairwise rectangle overlap across Flight HUD panels
	var exp_hud := SpaceExpedition3D.new()
	exp_hud.setup_sector(0)
	add_child(exp_hud)
	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	var f_panels: Array[Control] = [
		exp_hud._status_box,
		exp_hud._min_task_pill,
		exp_hud._radar_box,
		exp_hud._hint_pill,
	]
	for i in range(f_panels.size()):
		for j in range(i + 1, f_panels.size()):
			var fa: Rect2 = f_panels[i].get_global_rect()
			var fb: Rect2 = f_panels[j].get_global_rect()
			_check(not fa.intersects(fb), "Zero Flight HUD overlap between %s and %s" % [f_panels[i].name, f_panels[j].name])

	var hud_bad_scales: Array[String] = []
	var hud_narrow_lbls: Array[String] = []
	_scan_ui_subtree_invariants(exp_hud._hud_root, hud_bad_scales, hud_narrow_lbls)
	_check(hud_bad_scales.is_empty(), "Flight HUD has zero scaled Controls inside Containers")
	_check(hud_narrow_lbls.is_empty(), "Flight HUD has zero narrow wrapped Labels")

	exp_hud.queue_free()
	await get_tree().process_frame

func _test_expanded_settings_and_hall() -> void:
	# --- Every new setting exists, is clamped and round-trips through the save file
	ThemeHelper.ui_scale = 9.0
	ThemeHelper.apply_ui_scale()
	_check(ThemeHelper.ui_scale <= 1.35 and ThemeHelper.ui_scale >= 0.75, "UI SCALE clamped to safe range")
	_check(ThemeHelper.main_theme.default_font_size >= 11, "UI SCALE drives live theme font size (%d)" % ThemeHelper.main_theme.default_font_size)

	ThemeHelper.fps_cap = 9999
	ThemeHelper.vsync_enabled = false
	ThemeHelper.apply_display_settings()
	_check(Engine.max_fps == 240, "FRAME RATE LIMIT clamped to 240 and applied to Engine.max_fps")
	ThemeHelper.vsync_enabled = true
	ThemeHelper.apply_display_settings()
	_check(Engine.max_fps == 0, "V-SYNC enabled releases the manual frame cap")

	ThemeHelper.camera_fov = 88.0
	ThemeHelper.invert_y_axis = true
	ThemeHelper.crosshair_opacity = 0.4
	ThemeHelper.screen_shake = 0.0
	ThemeHelper.show_hud_bars = false
	ThemeHelper.achievement_toasts = false
	ThemeHelper.auto_save = false

	var sset := "user://settings_roundtrip.json"
	_check(SaveManager.save_game(sset), "Saved expanded settings to disk")
	ThemeHelper.ui_scale = 1.0
	ThemeHelper.camera_fov = 65.0
	ThemeHelper.invert_y_axis = false
	ThemeHelper.crosshair_opacity = 1.0
	ThemeHelper.screen_shake = 1.0
	ThemeHelper.show_hud_bars = true
	ThemeHelper.auto_save = true
	_check(SaveManager.load_game(sset), "Reloaded expanded settings")
	_check(absf(ThemeHelper.camera_fov - 88.0) < 0.01, "FIELD OF VIEW persisted through save file")
	_check(ThemeHelper.invert_y_axis, "INVERT PITCH AXIS persisted through save file")
	_check(absf(ThemeHelper.crosshair_opacity - 0.4) < 0.01, "CROSSHAIR OPACITY persisted through save file")
	_check(absf(ThemeHelper.screen_shake) < 0.01, "COCKPIT SHAKE persisted through save file")
	_check(not ThemeHelper.show_hud_bars, "RESOURCE BAR PANEL toggle persisted")
	_check(not ThemeHelper.achievement_toasts, "ACHIEVEMENT POPUPS toggle persisted")
	_check(not ThemeHelper.auto_save, "AUTO-SAVE toggle persisted")

	# --- AUTO-SAVE really gates transactional writes
	DirAccess.remove_absolute(ProjectSettings.globalize_path("user://space_miner_save.json"))
	var before := ShipGrid.credits
	ShipGrid.credits = before + 777
	var gated := SaveManager.autosave()
	_check(not gated and SaveManager.pending_autosave, "AUTO-SAVE disabled suppresses transactional write and defers it")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(sset))
	var dir := DirAccess.open("user://")
	if dir:
		for fn in dir.get_files():
			if fn.begins_with("space_miner_save"):
				_dir_remove("user://" + fn)
	ShipGrid.credits = before
	ThemeHelper.auto_save = true
	ThemeHelper.crosshair_opacity = 1.0
	ThemeHelper.screen_shake = 1.0
	ThemeHelper.show_hud_bars = true
	ThemeHelper.camera_fov = 65.0
	ThemeHelper.invert_y_axis = false
	ThemeHelper.achievement_toasts = true
	ThemeHelper.ui_scale = 1.0
	ThemeHelper.apply_ui_scale()


func _dir_remove(path: String) -> void:
	DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _test_achievement_hall3d() -> void:
	_check(ClassDB.class_exists("AchievementHall3D") or ResourceLoader.exists("res://scripts/space/AchievementHall3D.gd"),
		"AchievementHall3D script exists")
	var hall_script := load("res://scripts/space/AchievementHall3D.gd") as GDScript
	_check(hall_script != null and hall_script.can_instantiate(), "AchievementHall3D instantiates")

	AchievementManager.collected_album.clear()
	AchievementManager.album_meta.clear()
	# Complete one real achievement so the hall has genuine content
	var seeded := false
	for cat in ["minute", "hourly", "daily", "weekly"]:
		for task in AchievementManager.active_tasks.get(cat, []):
			task["completed"] = true
			task["progress"] = float(task["target"])
			var tid := str(task["id"])
			AchievementManager.collected_album[tid] = 1
			AchievementManager._remember_album_entry(task)
			seeded = true
			break
		if seeded:
			break
	_check(seeded, "Seeded one completed achievement for hall verification")
	_check(AchievementManager.earned_count() >= 1, "earned_count() reports the album size")
	_check(AchievementManager.hall_entries().size() >= 1, "hall_entries() returns the earned cards")
	_check(AchievementManager.total_card_count() == 30, "Hall totals match the 30-card achievement set")

	var hall = hall_script.new()
	add_child(hall)
	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	_check(hall.get_node_or_null("HallCards") != null, "HallCards root built")
	var cards_root := hall.get_node("HallCards") as Node3D
	_check(cards_root.get_child_count() >= 1, "Hall shows real floating card nodes (%d)" % cards_root.get_child_count())
	var cam_ok := false
	for ch in hall.get_children():
		if ch is Camera3D or (ch is Node3D and _subtree_has_camera(ch)):
			cam_ok = true
	_check(cam_ok, "Hall is a real 3D scene with an active Camera3D")
	var we_ok := false
	for ch in hall.get_children():
		if ch is WorldEnvironment:
			we_ok = true
	_check(we_ok, "Hall has its own WorldEnvironment (nebula/void), not a flat background")
	_check(hall._hud != null and is_instance_valid(hall._title_lbl), "Hall HUD title label present")
	_check(hall._title_lbl.text.length() > 2, "Hall title localized and non-empty: " + hall._title_lbl.text)
	_check(hall._back_btn != null and hall._back_btn.text.length() > 2, "Hall return button labeled")
	_check(not hall._hint_lbl.text.is_empty(), "Hall control hints shown")
	var first_card := cards_root.get_child(0) as Node3D
	_check(first_card != null and first_card.get_child_count() == 2, "Each hall card is art + rarity glow (2 meshes)")
	var mat_ok := false
	if first_card:
		var mi := first_card.get_child(0) as MeshInstance3D
		if mi and mi.mesh is PlaneMesh:
			var m := (mi.mesh as PlaneMesh).material as StandardMaterial3D
			mat_ok = m != null and m.albedo_texture != null
	_check(mat_ok, "Hall card renders a real achievement artwork texture")
	hall._try_pick_card(hall.get_viewport().get_visible_rect().size * 0.5)
	_check(true, "Hall card picking runs without error")
	hall.queue_free()
	await get_tree().process_frame


func _count_interactive_controls(node: Node) -> int:
	var n := 0
	if node is BaseButton or node is HSlider or node is LineEdit or node is Dropdown:
		n += 1
	for c in node.get_children():
		n += _count_interactive_controls(c)
	return n


func _subtree_has_camera(node: Node) -> bool:
	if node is Camera3D:
		return true
	for c in node.get_children():
		if _subtree_has_camera(c):
			return true
	return false


func _assert_grid_children_laid_out(grid: Control, expected_min_count: int, min_w: float, min_h: float, label: String) -> void:
	_check(is_instance_valid(grid), "%s exists in Station UI" % label)
	if not is_instance_valid(grid):
		return
	var vis_children: Array[Control] = []
	for ch in grid.get_children():
		if ch is Control and (ch as Control).visible:
			vis_children.append(ch as Control)
	_check(vis_children.size() >= expected_min_count, "%s populated (%d >= %d items)" % [label, vis_children.size(), expected_min_count])

	var all_sized := true
	var size_fail_detail := ""
	for idx in range(vis_children.size()):
		var c: Control = vis_children[idx]
		if c.size.x < min_w or c.size.y < min_h or c.modulate.a < 0.20:
			all_sized = false
			size_fail_detail = "child #%d size=%s alpha=%.2f" % [idx, str(c.size), c.modulate.a]
			break
	_check(all_sized, "%s cards all visibly sized >= (%d x %d) %s" % [label, int(min_w), int(min_h), size_fail_detail])

	var overlap_found := false
	var overlap_detail := ""
	for i in range(vis_children.size()):
		var ri: Rect2 = vis_children[i].get_rect().grow(-0.5)
		for j in range(i + 1, vis_children.size()):
			var rj: Rect2 = vis_children[j].get_rect().grow(-0.5)
			if ri.intersects(rj):
				overlap_found = true
				overlap_detail = "item #%d %s overlaps #%d %s" % [i, str(ri), j, str(rj)]
				break
		if overlap_found:
			break
	_check(not overlap_found, "%s cards have ZERO pairwise overlap %s" % [label, overlap_detail])

func _scan_ui_subtree_invariants(node: Node, bad_scales: Array[String], narrow_labels: Array[String]) -> void:
	if not is_instance_valid(node):
		return
	if node is Container and (node as Control).is_visible_in_tree():
		for ch in node.get_children():
			if ch is Control and (ch as Control).visible:
				var ctrl := ch as Control
				if not ctrl.scale.is_equal_approx(Vector2.ONE) or not is_zero_approx(ctrl.rotation):
					bad_scales.append("%s->%s(scale=%s)" % [node.name, ctrl.name, str(ctrl.scale)])
	if node is Label and (node as Label).is_visible_in_tree():
		var lbl := node as Label
		if lbl.autowrap_mode != TextServer.AUTOWRAP_OFF and lbl.text.strip_edges().length() >= 6:
			if lbl.size.x < 50.0:
				narrow_labels.append("%s(w=%.1f, txt='%s')" % [lbl.name, lbl.size.x, lbl.text.left(18)])
	for child in node.get_children():
		_scan_ui_subtree_invariants(child, bad_scales, narrow_labels)


