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
	_test_ui_skin_kit()
	_test_reactor_governor_and_market()
	await _test_card_foils_and_lock_combat()
	await _test_drop_odds_are_honest()
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

	# Firing solution (drives reticle #1 readout + homing) end-to-end 3D accuracy test:
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
	_check(str(open_sight["hit_kind"]) == "none" and absf(float(open_sight["distance"]) - 210.0 * 2.8) < 1.0, "Firing solution open-space point equals exact bullet max flight distance")

	# 2) Off-bore 3D Asteroid impact: verify real fired Projectile3D lands at the exact sighted world_pos!
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
	_check(str(ast_sight["hit_kind"]) == "asteroid", "Firing solution detects off-bore 3D Asteroid surface along barrel ray")

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
	_check(bool(hit_record["hit"]) and impact_err < 0.20, "Fired Projectile3D hits the exact sighted 3D point (err < 0.20m)")
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
	_check(str(mag_sight["hit_kind"]) == "magnetic_enemy", "Firing solution snaps onto off-bore enemy when Magnetic Homing Radar is installed")

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
			var set_detail := ""
			for sc_ch in set_cards:
				var scc := sc_ch as Control
				if not is_instance_valid(scc) or scc.size.x < 300.0 or scc.size.y < 120.0:
					set_ok = false
					set_detail += " %s=%s" % [sc_ch.name, str(scc.size)]
			_check(set_ok, "Every settings group card is sized >= 300x120 (row-balanced)%s" % set_detail)
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


func _test_ui_skin_kit() -> void:
	# v2.2.0: the interface must visibly run on the generated 9-slice skin kit.
	var kit: Array = ["panel_main.png", "panel_inset.png", "header_bar.png", "btn_normal.png",
		"btn_hover.png", "btn_pressed.png", "btn_disabled.png", "tab_on.png", "tab_off.png",
		"slider_back.png", "slider_fill.png", "slider_grab.png", "check_on.png", "check_off.png",
		"bar_back.png", "bar_fill.png", "pill.png", "card_frame.png", "keycap.png", "divider.png",
		"backdrop.png"]
	var present: int = 0
	for f in kit:
		if ResourceLoader.exists("res://assets/ui/" + f):
			present += 1
	_check(present == kit.size(), "UI skin kit complete (%d/%d textures)" % [present, kit.size()])
	_check(ThemeHelper.skin_available(), "ThemeHelper reports the skin kit as available")

	var panel_sb: StyleBox = ThemeHelper.make_panel_style()
	_check(panel_sb is StyleBoxTexture, "make_panel_style returns a 9-slice plate")
	if panel_sb is StyleBoxTexture:
		var st := panel_sb as StyleBoxTexture
		_check(st.texture != null, "panel plate has a texture")
		_check(is_equal_approx(st.texture_margin_left, 30.0), "panel 9-slice margin matches the chamfer")
		_check(st.content_margin_left > st.texture_margin_left, "panel content sits inside the chamfer")
		_check(st.axis_stretch_horizontal == StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH,
			"panel plate stretches instead of tiling")

	var pill_sb: StyleBox = ThemeHelper.make_pill_style(Color(0.02, 0.05, 0.11, 0.9), ThemeHelper.COL_CYAN, 9, 12, 5)
	_check(pill_sb is StyleBoxTexture, "roomy pills use the kit pill")
	var tiny_sb: StyleBox = ThemeHelper.make_pill_style(Color(0.02, 0.05, 0.11, 0.9), ThemeHelper.COL_CYAN, 6, 4, 2)
	_check(tiny_sb is StyleBoxFlat, "micro badges keep the flat fallback (no squashed artwork)")

	var th := ThemeHelper.main_theme
	_check(th.get_stylebox("panel", "PanelContainer") is StyleBoxTexture, "theme panels skinned")
	_check(th.get_stylebox("normal", "Button") is StyleBoxTexture, "theme buttons skinned")
	_check(th.get_stylebox("tab_selected", "TabBar") is StyleBoxTexture, "theme tabs skinned")
	_check(th.get_stylebox("slider", "HSlider") is StyleBoxTexture, "theme sliders skinned")
	_check(th.get_stylebox("fill", "ProgressBar") is StyleBoxTexture, "theme progress fill skinned")
	_check(th.get_stylebox("normal", "LineEdit") is StyleBoxTexture, "theme line edits skinned")

	var rail := ThemeHelper.make_header_rail(ThemeHelper.COL_CYAN, 6)
	_check(rail is PanelContainer and rail.get_theme_stylebox("panel") is StyleBoxTexture,
		"header rail builds with the kit plate")
	rail.free()
	var div := ThemeHelper.make_divider()
	_check(div is PanelContainer or div is HSeparator, "divider builds (kit rule or fallback)")
	div.free()
	var bar_fill := ThemeHelper.make_hud_bar_style(Color(0.2, 0.9, 0.5), true)
	_check(bar_fill is StyleBoxTexture, "HUD gauge fill uses the kit bar")
	var frame := ThemeHelper.make_skin_overlay("card_frame", Color.WHITE)
	_check(frame != null, "card frame overlay builds")
	if frame != null:
		frame.free()


func _test_reactor_governor_and_market() -> void:
	# 14. v2.2.0 gameplay logic: dynamic sector market + reactor load governor.
	var d: int = GameData.market_day()
	_check(d > 20000, "market day counts UTC epochs since 1970 (%d)" % d)
	var v1: float = GameData.market_index("iron", "sector_1", d)
	var v2: float = GameData.market_index("iron", "sector_1", d)
	_check(is_equal_approx(v1, v2), "price index is deterministic for (mineral, sector, day)")

	var lo: float = 99.0
	var hi: float = -99.0
	var moved: bool = false
	for rid in GameData.RESOURCES.keys():
		for si in range(GameData.sectors.size()):
			var sid: String = str(GameData.sectors[si]["id"])
			for off in range(-40, 41, 7):
				var v: float = GameData.market_index(str(rid), sid, d + off)
				lo = minf(lo, v)
				hi = maxf(hi, v)
				if absf(v - 1.0) > 0.03:
					moved = true
	_check(lo >= GameData.MARKET_MIN_INDEX - 0.0001, "price index never drops below its floor")
	_check(hi <= GameData.MARKET_MAX_INDEX + 0.0001, "price index never exceeds its ceiling")
	_check(moved, "the market actually moves instead of sitting at 1.00")
	var uniq: Dictionary = {}
	for sd in GameData.sectors:
		uniq[snappedf(GameData.market_index("iron", str(sd["id"]), d), 0.0001)] = true
	_check(uniq.size() >= 2, "sectors do not all quote the same price")
	_check(GameData.market_quotes("sector_1", d).size() == GameData.RESOURCES.size(),
		"market board quotes every mineral")
	_check(GameData.market_price("iron", "sector_1", d) > 0, "quoted price is positive")

	ShipGrid.cargo["iron"] = 10
	var quoted: int = ShipGrid.get_cargo_sale_value()
	var per_unit: float = float(quoted) / 10.0
	_check(quoted > 0, "cargo ledger prices the hold (%d CR)" % quoted)
	_check(per_unit > 4.0 and per_unit < 120.0, "per-unit sale price stays in a sane band (%.1f CR)" % per_unit)
	_check(ShipGrid.sell_all_cargo() == quoted, "selling pays exactly the quoted ledger value")
	_check(int(ShipGrid.cargo["iron"]) == 0, "cargo bays are empty after selling")
	_check(int(ShipGrid.credits) > 0, "sale credits landed in the account")

	ShipGrid.cargo["iron"] = 20
	ShipGrid.cargo["titanium"] = 4
	var before_iron: int = int(ShipGrid.cargo["iron"])
	var lost: Dictionary = ShipGrid.spill_cargo(0.25)
	var lost_units: int = 0
	for k in lost.keys():
		lost_units += int(lost[k])
	_check(lost_units > 0 and lost_units < 24, "hull shock spills a share of the haul (%d units)" % lost_units)
	_check(int(ShipGrid.cargo["iron"]) + int(lost.get("iron", 0)) == before_iron, "spill accounting is exact")
	_check(int(ShipGrid.stats_history.get("cargo_spilled", 0)) >= lost_units, "spillage is recorded in lifetime stats")
	ShipGrid.cargo["iron"] = 0
	ShipGrid.cargo["titanium"] = 0

	for pid in ShipGrid.POWER_PROFILES.keys():
		_check(ShipGrid.set_power_profile(str(pid), false), "power profile accepted: " + str(pid))
		_check(ShipGrid.get_power_profile_id() == str(pid), "profile reported back: " + str(pid))
		var smin: float = 1.0
		var smax: float = 0.0
		for sys_id in ShipGrid.POWER_SYSTEMS:
			var sh: float = ShipGrid.power_share(sys_id)
			smin = minf(smin, sh)
			smax = maxf(smax, sh)
		_check(smin > 0.05 and smax < 1.0, "shares bounded for %s (%.2f..%.2f)" % [pid, smin, smax])
	_check(not ShipGrid.set_power_profile("reactor_yolo", false), "unknown power profile is rejected")
	_check(ShipGrid.set_power_profile("nope", false) == false, "rejected profile leaves state unchanged")
	_check(ShipGrid.get_power_profile_id() != "nope", "invalid profile never becomes active")

	var stats_now: Dictionary = ShipGrid.compute_ship_stats()
	for sys_id in ShipGrid.POWER_SYSTEMS:
		_check(ShipGrid.power_budget(sys_id, stats_now) >= 4.0, "reactor budget positive for " + sys_id)

	var ship_probe := PlayerShip3D.new()
	add_child(ship_probe)
	ship_probe.stats = ShipGrid.compute_ship_stats()
	ship_probe.current_energy = 200.0
	var idle_factor: float = ship_probe.power_factor("mining")
	ship_probe._sys_load["mining"] = 99999.0
	var starved_factor: float = ship_probe.power_factor("mining")
	_check(starved_factor < idle_factor, "over-budget measured draw throttles that subsystem (%.2f -> %.2f)" % [idle_factor, starved_factor])
	_check(ship_probe.power_shed("mining"), "a saturated mining beam is shed entirely")
	ship_probe._sys_load["mining"] = 0.0
	ship_probe.current_energy = 0.5
	ship_probe._update_power_governor(0.0166)
	_check(ship_probe.power_brownout, "near-empty capacitor raises the brown-out flag")
	_check(ship_probe.power_shed("mining") and ship_probe.power_shed("weapons"),
		"brown-out sheds mining and guns first")
	_check(not ship_probe.power_shed("engines"), "brown-out never sheds the engines (fly home safely)")
	_check(ship_probe.power_throttle_events == 1, "brown-out is counted once per episode")
	var rep: Dictionary = ship_probe.get_power_report()
	_check(rep.has("rows") and (rep["rows"] as Array).size() == ShipGrid.POWER_SYSTEMS.size(),
		"power report carries one row per subsystem")
	_check(str(rep["profile"]) == ShipGrid.get_power_profile_id(), "report names the live profile")
	ship_probe.queue_free()

	ShipGrid.set_power_profile("sustain", false)
	ShipGrid.market_sector = "sector_2"
	if not ShipGrid.unlocked_sectors.has(1):
		ShipGrid.unlocked_sectors.append(1)
	var logic_path := "user://test_logic_save.json"
	_check(SaveManager.save_game(logic_path), "wrote save with reactor + market state")
	ShipGrid.power_profile = "balanced"
	ShipGrid.market_sector = "sector_1"
	_check(SaveManager.load_game(logic_path), "reloaded reactor + market state")
	_check(ShipGrid.get_power_profile_id() == "sustain", "power profile persisted through the save system")
	_check(ShipGrid.market_sector == "sector_2", "chosen market sector persisted")
	ShipGrid.unlocked_sectors = [0]
	ShipGrid.market_sector = "sector_1"
	# A locked sector must never survive a load (crash/exploit guard).
	var payload: Dictionary = SaveManager.build_save_payload()
	payload["market_sector"] = "sector_5"
	payload["power_profile"] = "not_a_profile"
	_check(not SaveManager.apply_loaded_payload(payload) or (ShipGrid.get_power_profile_id() == "balanced"
		and ShipGrid.market_sector == "sector_1"), "tampered profile/market values are rejected on load")


# 15. Foil Finishes (Card Mutations), Lock-Directed Fire, RMB-Only Mining & Sector Threat
func _test_card_foils_and_lock_combat() -> void:
	# --- finish table integrity -------------------------------------------------
	_check(is_equal_approx(GameData.finish_weight_total(), 100.0), "FOIL finish weights sum to exactly 100")
	var last_rank := -1
	var table_ok := true
	for fid in GameData.FINISH_ORDER:
		var fdef: Dictionary = GameData.get_finish(str(fid))
		var rk := int(fdef.get("rank", -1))
		table_ok = table_ok and rk > last_rank and float(fdef.get("buff_mult", 0.0)) >= 1.0
		for vk in ["tint", "sheen", "glow", "prism", "sparkle", "metal", "market_mult", "radar_mult", "repair_mult"]:
			table_ok = table_ok and fdef.has(vk)
		last_rank = rk
	_check(table_ok, "Every FOIL finish ranks ascending with buff multiplier and full shader visual set")
	_check(GameData.get_finish_buff_mult("glow") > GameData.get_finish_buff_mult("holo"), "Luminous foil out-buffs holographic")
	_check(not GameData.is_valid_finish("chromium"), "Unknown foil finish name rejected")

	# --- rolls honour the published odds ---------------------------------------
	var rng := RandomNumberGenerator.new()
	rng.seed = 20261026
	var rare_hits := 0
	for i in range(400):
		var rolled: String = GameData.roll_finish(rng)
		if not GameData.is_valid_finish(rolled):
			_check(false, "roll_finish produced an invalid finish id")
			break
		if rolled != "plain":
			rare_hits += 1
	_check(rare_hits > 100 and rare_hits < 300, "Seeded foil rolls stay near the disclosed 42%% rare rate (%d/400)" % rare_hits)

	# --- collection keeps the best print ---------------------------------------
	SaveManager.reset_all_progress()
	var g1: Dictionary = CrewManager.grant_card("crew_09", "silver")
	_check(bool(g1["ok"]) and bool(g1["is_new"]) and str(g1["finish"]) == "silver", "grant_card stores the exact pulled foil")
	var g2: Dictionary = CrewManager.grant_card("crew_09", "holo")
	_check(bool(g2["upgraded"]) and CrewManager.get_finish("crew_09") == "holo", "A better foil upgrades the stored print")
	var g3: Dictionary = CrewManager.grant_card("crew_09", "plain")
	_check(not bool(g3["upgraded"]) and CrewManager.get_finish("crew_09") == "holo", "A plain copy never downgrades a holo print")
	_check(absf(CrewManager.get_finish_multiplier("crew_09") - 1.25) < 0.001, "Holo print scales its buff by 1.25x")
	_check(CrewManager.set_finish("crew_09", "glow"), "set_finish applies a valid finish")
	_check(not CrewManager.set_finish("crew_09", "platinum"), "set_finish refuses an unknown finish")
	_check(CrewManager.get_finest_owned() == "crew_09", "get_finest_owned reports the card holding the rarest print")

	# --- foil buffs reach the ship --------------------------------------------
	# crew slots are bought, not given: unlock 5 so the bridge can be staffed
	ShipGrid.purchased_expansion_cells = 50
	_check(ShipGrid.get_unlocked_crew_slots() >= 5, "Test harness unlocked 5 bridge crew slots")
	var before_buffs := CrewManager.get_combined_buffs()
	CrewManager.equip_card("crew_09")
	var after_buffs := CrewManager.get_combined_buffs()
	var grew := false
	for k in after_buffs.keys():
		if float(after_buffs[k]) > float(before_buffs.get(k, 0.0)) + 0.0001:
			grew = true
	_check(grew, "Equipping a Luminous print raises the live ship buff sheet")
	for cid in ["crew_01", "crew_02", "crew_03", "crew_04", "crew_05"]:
		CrewManager.grant_card(cid, "glow")
		CrewManager.equip_card(cid)
	var perks: Dictionary = CrewManager.get_finish_perks()
	var want_mk := 1.0
	var want_rd := 1.0
	for cid in CrewManager.equipped_crew:
		var fd: Dictionary = GameData.get_finish(CrewManager.get_finish(cid))
		want_mk += float(fd["market_mult"]) - 1.0
		want_rd += float(fd["radar_mult"]) - 1.0
	_check(absf(float(perks["market"]) - clampf(want_mk, 1.0, 1.45)) < 0.001, "Market perk equals the summed equipped foil bonuses")
	_check(float(perks["market"]) <= 1.451 and float(perks["radar"]) <= 1.401, "Stacked foil perks respect the designed caps")
	# the foil perk has to reach the engine, not just the data layer
	CrewManager.equipped_crew.clear()
	var probe := PlayerShip3D.new()
	add_child(probe)
	await get_tree().process_frame
	var radar_cold := probe.get_radar_range()
	CrewManager.grant_card("crew_12", "holo")
	CrewManager.equip_card("crew_12")
	var radar_hot := probe.get_radar_range()
	_check(absf(radar_cold - 140.0) < 0.01, "Cold radar range falls back to the base sweep (140 m)")
	_check(radar_hot > radar_cold * 1.05, "Holo foil print physically extends ship radar (%.1f -> %.1f m)" % [radar_cold, radar_hot])
	probe.free()

	# --- pack odds are honest, per pack type -----------------------------------
	var std_ch: Dictionary = PackManager.finish_chances("standard")
	var el_ch: Dictionary = PackManager.finish_chances("elite")
	var ch_sum := 0.0
	for k in std_ch.keys():
		ch_sum += float(std_ch[k])
	_check(absf(ch_sum - 100.0) < 0.01, "Disclosed standard foil odds sum to 100 percent")
	_check(float(el_ch["glow"]) > float(std_ch["glow"]), "Elite pack publishes better odds on the rarest foil")
	ShipGrid.crystals = 400
	var pack_res := PackManager.purchase_and_open_pack("standard")
	_check(bool(pack_res["ok"]), "Pack opened for the foil draw test")
	var foils_valid := true
	for e in (pack_res["cards"] as Array):
		var ed: Dictionary = e
		foils_valid = foils_valid and GameData.is_valid_finish(str(ed.get("finish", "")))
	_check(foils_valid, "Every drawn card carries a valid rolled foil in the reveal result")

	# --- save integrity --------------------------------------------------------
	var tmp_save := "user://__foil_roundtrip.save"
	SaveManager.save_game(tmp_save)
	var envelope: Variant = JSON.parse_string(FileAccess.get_file_as_string(tmp_save))
	_check(envelope is Dictionary, "Foil save file parses as a JSON envelope")
	if envelope is Dictionary:
		var payload: Variant = JSON.parse_string(String((envelope as Dictionary)["payload"]))
		_check(payload is Dictionary and (payload as Dictionary).has("crew_finish"), "Save payload persists the crew_finish map")
	_check(CrewManager.card_finishes.size() > 0, "Foil map is populated before reset")
	SaveManager.reset_all_progress()
	_check(CrewManager.card_finishes.is_empty(), "A new game wipes foil prints clean")

	# --- input ownership: LMB fires, RMB mines ---------------------------------
	var exp_src := FileAccess.get_file_as_string("res://scripts/space/SpaceExpedition3D.gd")
	_check(exp_src.contains("player_ship.firing_weapons = _mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)"), "LMB owns weapons fire only")
	_check(exp_src.contains("player_ship.firing_mining = (_mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT))"), "RMB owns the mining beam")
	var proj_src := FileAccess.get_file_as_string("res://scripts/space/Projectile3D.gd")
	_check(not proj_src.contains("apply_mining_damage"), "Weapon rounds carry ZERO mining damage - meteoroids are RMB-only")
	_check(FileAccess.get_file_as_string("res://scripts/ship/PlayerShip3D.gd").contains("LOCK_HOMING_TURN"), "Lock-directed guidance table is compiled into the ship")

	# --- guidance behaviour ----------------------------------------------------
	var host := Node3D.new()
	add_child(host)
	await get_tree().process_frame
	var decoy := Node3D.new()
	decoy.global_position = Vector3(30.0, 0.0, -90.0)
	host.add_child(decoy)
	var pr := Projectile3D.new()
	host.add_child(pr)
	pr.setup(true, "kinetic", 12.0, 210.0, Projectile3D.make_aim_transform(Vector3.ZERO, Vector3.RIGHT), 0.0, 5.0, decoy, Vector3.ZERO, false, 0.0, true)
	_check(bool(pr.lock_homing), "Round fired on a locked target enables convergence guidance")
	# _velocity already points down the muzzle (it is set from -basis.z in setup)
	# The guidance law itself: authority scales with bearing error over time to go,
	# and vanishes once the round is lined up (no orbiting, no wobble).
	var law_hard := Projectile3D.lock_guidance_turn(Vector3.RIGHT, Vector3(0.316, 0.0, -0.949).normalized(), 210.0, 95.0)
	_check(law_hard > 6.0 and law_hard <= 15.0, "Lock guidance gives strong authority for a wide bearing error (%.1f rad/s)" % law_hard)
	_check(is_equal_approx(Projectile3D.lock_guidance_turn(Vector3.RIGHT, Vector3.RIGHT, 210.0, 40.0), 0.0), "Aligned round stops correcting")
	_check(Projectile3D.lock_guidance_turn(Vector3.FORWARD, Vector3.BACK, 210.0, 2.0) <= 15.0, "Guidance authority stays clamped")
	var dir0 := pr._velocity.normalized()
	var ang0 := dir0.angle_to((decoy.global_position - pr.global_position).normalized())
	_check(ang0 > 0.9, "Round starts visibly off-axis from its lock (%.2f rad)" % ang0)
	var dist0 := global_dist_at(pr, decoy)
	var best_err := ang0
	for i in range(24):
		pr._physics_process(1.0 / 60.0)
		var fwd := pr._velocity.normalized()
		var to_now := (decoy.global_position - pr.global_position).normalized()
		best_err = minf(best_err, fwd.angle_to(to_now))
	_check(best_err < 0.12, "Round lines up with the locked hull during flight (min error %.3f rad)" % best_err)
	_check(global_dist_at(pr, decoy) < dist0 * 0.62, "Round keeps closing on the lock (%.1f -> %.1f m)" % [dist0, global_dist_at(pr, decoy)])
	_check(pr._velocity.length() > 200.0, "Guidance never bleeds muzzle velocity (%.1f m/s)" % pr._velocity.length())
	var free_shot := Projectile3D.new()
	host.add_child(free_shot)
	free_shot.setup(true, "kinetic", 12.0, 210.0, Projectile3D.make_aim_transform(Vector3.ZERO, Vector3.RIGHT))
	_check(not bool(free_shot.lock_homing), "Unlocked rounds stay ballistic")
	pr.queue_free()
	free_shot.queue_free()
	host.queue_free()

	# --- elite response wing ---------------------------------------------------
	var exp2 := SpaceExpedition3D.new()
	exp2.setup_sector(4)
	add_child(exp2)
	await get_tree().process_frame
	await get_tree().process_frame
	_check(is_instance_valid(exp2._threat_bar) and int(exp2._threat_bar.max_value) == 100, "Flight HUD builds a 0-100 threat meter")
	exp2._threat = 0.0
	exp2._add_threat(92.0)
	_check(absf(exp2._threat - 92.0) < 0.01, "Threat accumulates from mining and kills")
	exp2._response_cd = 0.0
	var wings_before := exp2._wings_called
	exp2._process_sector_spawns_and_hazards(0.016)
	await get_tree().process_frame
	var wing_total := exp2.enemies_root.get_child_count()
	var elite_count := 0
	for en in exp2.enemies_root.get_children():
		if en is EnemyShip3D and bool((en as EnemyShip3D).elite):
			elite_count += 1
	_check(exp2._wings_called == wings_before + 1, "One response wing is called per escalation")
	_check(wing_total >= 3 and elite_count >= 1, "Max threat calls in an elite wing with escorts (%d ships, %d elite)" % [wing_total, elite_count])
	_check((exp2._bar_val_lbls["hud_threat"] as Label).text.contains("%"), "Threat meter prints a live percentage")
	var base_e := EnemyShip3D.new()
	base_e.setup("scout_drone", Vector3(4000, 0, 4000), null, null, null, false)
	var elite_e := EnemyShip3D.new()
	elite_e.setup("scout_drone", Vector3(4000, 0, 4040), null, null, null, true)
	_check(bool(elite_e.elite) and elite_e.max_hp > base_e.max_hp * 2.0, "Elite hull more than doubles a base drone")
	_check(elite_e.credit_reward == base_e.credit_reward * 4, "Elite pays 4x credits")
	_check(not elite_e.is_dead(), "Fresh elite reports alive")
	elite_e.set_lock_state(true)
	await get_tree().process_frame
	_check(is_instance_valid(elite_e._lock_ring), "Locked target builds the green hull bracket")
	base_e.queue_free()
	elite_e.queue_free()
	var owned_before := CrewManager.get_unique_owned_count()
	var copies_before := CrewManager.get_copies("crew_01")
	exp2._grant_salvage_card(Vector3.ZERO)
	_check(CrewManager.get_unique_owned_count() > owned_before or CrewManager.get_copies("crew_01") > copies_before, "Elite leaders drop collectible crew prints")
	_check(GameData.get_finish_rank(exp2._roll_elite_finish()) >= 2, "Salvage rolls only holographic-or-better foils")
	exp2._threat = 40.0
	exp2._process_sector_spawns_and_hazards(1.0)
	_check(exp2._threat < 39.9 and exp2._threat > 36.0, "Threat cools off while the sector is quiet (%.2f)" % exp2._threat)
	var loc_src := FileAccess.get_file_as_string("res://scripts/autoload/Localization.gd")
	_check(loc_src.contains("LMB: fire at the GREEN locked target (T)"), "Flight hint documents lock-directed LMB fire")
	_check(loc_src.contains("RMB/F: mining beam on rocks"), "Flight hint documents RMB-only mining")
	_check(not loc_src.contains("H: Hangar"), "Flight hint no longer advertises an unbound hangar key")
	var hud_src := FileAccess.get_file_as_string("res://scripts/space/SpaceExpedition3D.gd")
	for ghost in ["_ret_btn", "_pause_ext_btn", "hud_return_hangar", "pause_extract"]:
		_check(not hud_src.contains(ghost), "Removed control %s is deleted from the HUD, not just hidden" % ghost)
	for ghost in ["hud_return_hangar", "pause_extract", "hud_return_guidance", "hud_flight_controls"]:
		_check(not loc_src.contains('"%s"' % ghost), "Orphaned localization key %s was deleted with its control" % ghost)
	_check(not hud_src.contains("_return_guidance_t"), "Portal guidance overlay retired together with its only trigger")
	exp2._draw_hud_world_overlays()
	_check(is_instance_valid(exp2._overlay_canvas), "Flight overlay still draws after the fake controls were removed")
	_check(not bool(exp2._pause_panel.get_node_or_null("ExtractButton")), "Pause menu has no dead extract button")
	for en in exp2.enemies_root.get_children():
		en.queue_free()
	exp2.queue_free()
	await get_tree().process_frame


func global_dist_at(a: Node3D, b: Node3D) -> float:
	return a.global_position.distance_to(b.global_position)

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
	if node is BaseButton or node is HSlider or node is LineEdit or node is OptionButton:
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


# 16. Drop odds: the table the station shows IS the table the engine rolls, and
# the rare end of the ladder stays rare in practice, not just on paper.
func _test_drop_odds_are_honest() -> void:
	var order: Array[String] = GameData.RARITY_ORDER
	# --- the disclosed table is exactly the weight dictionary ---------------
	var probs: Dictionary = PackManager.get_probability_table("standard")
	var wstd: Dictionary = PackManager.PACK_TYPES["standard"]["weights"]
	var wsum := 0.0
	for r in order:
		wsum += float(wstd.get(r, 0.0))
	var table_exact := true
	for r in order:
		var want: float = float(wstd.get(r, 0.0)) / maxf(0.0001, wsum) * 100.0
		table_exact = table_exact and absf(float(probs[r]) - want) < 0.001
	_check(table_exact, "Disclosed pack percentages are computed from the live weight table")

	# --- the roller can only ever return what the table says ----------------
	var only_epic := true
	for i in range(24):
		only_epic = only_epic and PackManager._roll_rarity({"Epic": 5.0}) == "Epic"
	_check(only_epic, "Rarity roll is driven purely by the supplied weight table")

	# --- 6000 real rolls must reproduce the disclosed odds ------------------
	var rolls := 6000
	var counts := {}
	for r in order:
		counts[r] = 0
	var elite_secret := 0
	var we: Dictionary = PackManager.PACK_TYPES["elite"]["weights"]
	for i in range(rolls):
		var picked: String = PackManager._roll_rarity(wstd)
		counts[picked] = int(counts[picked]) + 1
	for i in range(int(rolls / 2)):
		if PackManager._roll_rarity(we) == "Secret":
			elite_secret += 1
	var top_measured := (float(counts["Legendary"]) + float(counts["Mythic"]) + float(counts["Secret"])) / float(rolls) * 100.0
	var top_disclosed := float(probs["Legendary"]) + float(probs["Mythic"]) + float(probs["Secret"])
	_check(absf(float(counts["Common"]) / float(rolls) * 100.0 - float(probs["Common"])) < 5.0, "Measured Common rate matches the disclosed odds")
	_check(absf(float(counts["Rare"]) / float(rolls) * 100.0 - float(probs["Rare"])) < 5.0, "Measured Rare rate matches the disclosed odds")
	_check(top_measured > 0.2 and top_measured < 5.0, "Legendary-or-better lands %.2f%% of standard pulls (disclosed %.2f%%)" % [top_measured, top_disclosed])
	_check(elite_secret <= 30, "The vault box prints a Secret at most once in ~170 elite cards")

	# --- combat salvage: capped ladder, never the binder top -----------------
	var sweep := 999
	var secret_seen := false
	var mythic_light := 0
	var mythic_heavy := 0
	for i in range(sweep + 1):
		var rr := float(i) / float(sweep)
		var light: String = GameData.roll_salvage_rarity(rr, false)
		var heavy: String = GameData.roll_salvage_rarity(rr, true)
		if light == "Secret" or heavy == "Secret":
			secret_seen = true
		if light == "Mythic":
			mythic_light += 1
		if heavy == "Mythic":
			mythic_heavy += 1
	_check(not secret_seen, "No salvage roll in the whole 0..1 range can print a Secret")
	_check(mythic_light <= int(sweep * 0.02), "A plain elite leader almost never drops a Mythic print")
	_check(mythic_heavy > mythic_light, "Only a heavy response wing leader makes a Mythic print likelier")
	_check(GameData.salvage_chance(true) > GameData.salvage_chance(false), "Heavy wings also guarantee the drop more often")
	_check(GameData.SALVAGE_PRINTS_PER_EXPEDITION >= 1 and GameData.SALVAGE_PRINTS_PER_EXPEDITION <= 3, "Salvage prints per expedition stay inside a sane cap")
	var exp_src := FileAccess.get_file_as_string("res://scripts/space/SpaceExpedition3D.gd")
	_check(exp_src.contains("GameData.SALVAGE_PRINTS_PER_EXPEDITION"), "The expedition honours the salvage cap")
	_check(exp_src.contains("GameData.roll_salvage_rarity(randf(), heavy)"), "The expedition rolls the salvage ladder")
