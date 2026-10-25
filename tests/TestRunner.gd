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

	# 2nd Crosshair (Ballistic Bullet Sight) accuracy test under sideways ship velocity drift
	for old_p in exp_world.projectiles_root.get_children():
		old_p.queue_free()
	await get_tree().process_frame
	var drift_xf := Projectile3D.make_aim_transform(test_ship_origin, Vector3(0, 0, -1))
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_LINEAR_VELOCITY, Vector3(45.0, 0, 0))
	ship.global_transform = drift_xf
	ship.linear_velocity = Vector3(45.0, 0, 0)
	ship.aimed_world_point = test_ship_origin + Vector3(0, 0, -180.0)
	var b_info := ship.get_ballistic_sight_info()
	var sight_dir: Vector3 = b_info["flight_dir"]
	_check(sight_dir.x > 0.12, "2nd Ballistic Crosshair reflects sideways ship velocity drift")
	ship.current_energy = 120.0
	ship._weapon_cooldowns.clear()
	ship.firing_weapons = true
	await get_tree().physics_frame
	await get_tree().physics_frame
	ship.firing_weapons = false
	if exp_world.projectiles_root.get_child_count() >= 1:
		var pr_drift := exp_world.projectiles_root.get_child(0) as Projectile3D
		var p0 := pr_drift.global_position
		await get_tree().physics_frame
		await get_tree().physics_frame
		var actual_bullet_dir := (pr_drift.global_position - p0).normalized()
		_check(actual_bullet_dir.dot(sight_dir) > 0.995, "2nd Ballistic Crosshair vector matches actual bullet trajectory 1:1")

	# Full 360-degree vertical flip (upside-down pitch loop) & barrel roll test
	ship.linear_velocity = Vector3.ZERO
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_TRANSFORM, drift_xf)
	PhysicsServer3D.body_set_state(ship.get_rid(), PhysicsServer3D.BODY_STATE_ANGULAR_VELOCITY, Vector3.ZERO)
	ship.global_transform = drift_xf
	ship.rot_input = Vector3(1.8, 0.0, 0.0) # Pitch loop
	var went_upside_down := false
	for _step in range(95):
		await get_tree().physics_frame
		if ship.global_transform.basis.y.y < -0.5:
			went_upside_down = true
			break
	_check(went_upside_down, "Ship effortlessly pitches past 180 deg upside-down without gimbal lock")
	ship.rot_input = Vector3.ZERO

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
