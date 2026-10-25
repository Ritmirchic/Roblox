extends Node

signal ship_changed
signal credits_changed(new_credits: int)
signal cargo_changed

const CELL_SIZE: float = 2.0
const GRID_MIN := Vector3i(-6, -3, -7)
const GRID_MAX := Vector3i(6, 3, 7)
const NEIGHBORS_6: Array[Vector3i] = [
	Vector3i(1, 0, 0), Vector3i(-1, 0, 0),
	Vector3i(0, 1, 0), Vector3i(0, -1, 0),
	Vector3i(0, 0, 1), Vector3i(0, 0, -1),
]

var credits: int = 1200
var crystals: int = 60

# Permanent cell progression
var purchased_expansion_cells: int = 0
var unplaced_expansion_cells: int = 0
var free_unplaced_hull_cells: int = 0

# Owned unequipped modules in hangar storage: mod_id -> Array[int level]
var owned_equipment: Dictionary = {}

# Placed modules on the 3D ship grid: instance_uid (int) -> Dictionary
# { uid, mod_id, anchor: Vector3i, yaw: int (0..3), cells: Array[Vector3i],
#   level: int, hp: float, max_hp: float, is_free_starting: bool }
var placed_modules: Dictionary = {}
var cell_to_uid: Dictionary = {} # Vector3i -> int uid
var _next_uid: int = 1

# Saved ship blueprints: layout_name -> Array of serialized module dicts
var saved_layouts: Dictionary = {}

# Current cargo resources: resource_id -> int count
var cargo: Dictionary = {
	"iron": 0, "titanium": 0, "crystal": 0, "plasma_core": 0, "void_iridium": 0
}

# Unlocked space sectors (0..4)
var unlocked_sectors: Array[int] = [0]

# Lifetime statistics
var stats_history: Dictionary = {
	"asteroids_mined": 0,
	"enemies_defeated": 0,
	"resources_collected": 0,
	"credits_earned": 0,
	"expeditions_completed": 0,
	"packs_opened": 0,
	"modules_upgraded": 0,
	"distance_traveled": 0.0,
}

func _ready() -> void:
	reset_to_starter_ship()

func reset_to_starter_ship() -> void:
	placed_modules.clear()
	cell_to_uid.clear()
	_next_uid = 1
	free_unplaced_hull_cells = 0
	owned_equipment = {
		"magnet_basic": [1],
		"machine_gun": [1],
	}
	# Starting ship: Basic cockpit + 2 free starting hull cells + Basic engine + Basic mining laser
	_force_place("cockpit_mk1", Vector3i(0, 0, 0), 0, 1, true)
	_force_place("hull_cell", Vector3i(0, 0, 1), 0, 1, true)
	_force_place("hull_cell", Vector3i(1, 0, 0), 0, 1, true)
	_force_place("engine_basic", Vector3i(0, 0, 2), 0, 1, true)
	_force_place("mining_basic", Vector3i(1, 0, -1), 0, 1, true)
	ship_changed.emit()

func get_unlocked_crew_slots() -> int:
	# EXACT RULE: Every 10 purchased expansion cells unlock 1 crew slot.
	# Starting cockpit and free starting hull cells DO NOT count.
	return int(floor(float(maxi(0, purchased_expansion_cells)) / 10.0))

func get_cells_toward_next_crew_slot() -> int:
	return maxi(0, purchased_expansion_cells) % 10

func get_next_cell_price() -> int:
	return GameData.get_cell_purchase_cost(purchased_expansion_cells)

func purchase_expansion_cell() -> bool:
	var cost := get_next_cell_price()
	if credits < cost:
		return false
	credits -= cost
	purchased_expansion_cells += 1
	unplaced_expansion_cells += 1
	credits_changed.emit(credits)
	if AchievementManager:
		AchievementManager.record_event("expand_ship", 1)
	ship_changed.emit()
	return true

func add_credits(amount: int) -> void:
	if amount == 0:
		return
	credits = maxi(0, credits + amount)
	if amount > 0:
		stats_history["credits_earned"] = int(stats_history.get("credits_earned", 0)) + amount
		if AchievementManager:
			AchievementManager.record_event("earn_credits", amount)
	credits_changed.emit(credits)

func add_crystals(amount: int) -> void:
	crystals = maxi(0, crystals + amount)
	credits_changed.emit(credits)

func get_footprint_cells(mod_id: String, anchor: Vector3i, yaw: int) -> Array[Vector3i]:
	var out: Array[Vector3i] = []
	if not GameData.modules.has(mod_id):
		return out
	var sz: Vector3i = GameData.modules[mod_id]["grid_size"]
	var norm_yaw := posmod(yaw, 4)
	for ix in range(sz.x):
		for iy in range(sz.y):
			for iz in range(sz.z):
				# Extend multi-Z modules forward (-Z at yaw=0)
				var local := Vector3i(ix, iy, -iz)
				var rot := _rotate_cell_offset(local, norm_yaw)
				out.append(anchor + rot)
	return out

func _rotate_cell_offset(v: Vector3i, yaw: int) -> Vector3i:
	# Right-handed rotation around +Y matching rotation_degrees.y = yaw * 90.0:
	# yaw=1 (+90 deg): (0,0,-1) -> (-1,0,0) => (v.z, v.y, -v.x)
	match posmod(yaw, 4):
		0: return v
		1: return Vector3i(v.z, v.y, -v.x)
		2: return Vector3i(-v.x, v.y, -v.z)
		3: return Vector3i(-v.z, v.y, v.x)
	return v

func get_yaw_forward_vector(yaw: int) -> Vector3:
	match posmod(yaw, 4):
		0: return Vector3(0, 0, -1)
		1: return Vector3(-1, 0, 0)
		2: return Vector3(0, 0, 1)
		3: return Vector3(1, 0, 0)
	return Vector3(0, 0, -1)

func is_in_bounds(c: Vector3i) -> bool:
	return (
		c.x >= GRID_MIN.x and c.x <= GRID_MAX.x
		and c.y >= GRID_MIN.y and c.y <= GRID_MAX.y
		and c.z >= GRID_MIN.z and c.z <= GRID_MAX.z
	)

func validate_placement(mod_id: String, anchor: Vector3i, yaw: int, ignore_inventory: bool = false) -> Dictionary:
	if not GameData.modules.has(mod_id):
		return {"ok": false, "reason": "Unknown module."}
	if mod_id == "cockpit_mk1":
		return {"ok": false, "reason": "Only one Command Cockpit allowed."}
	if yaw < 0 or yaw > 3:
		return {"ok": false, "reason": "Invalid module orientation."}

	if not ignore_inventory:
		if mod_id == "hull_cell":
			if unplaced_expansion_cells <= 0 and free_unplaced_hull_cells <= 0:
				return {"ok": false, "reason": "No unplaced Expansion Cells owned. Purchase a cell first."}
		else:
			var arr: Array = owned_equipment.get(mod_id, [])
			if arr.is_empty():
				return {"ok": false, "reason": "Module not in Hangar storage. Buy it in the Equipment Shop."}

	var cells := get_footprint_cells(mod_id, anchor, yaw)
	if cells.is_empty():
		return {"ok": false, "reason": "Empty footprint."}

	for c in cells:
		if not is_in_bounds(c):
			return {"ok": false, "reason": "Outside construction grid bounds."}
		if cell_to_uid.has(c):
			return {"ok": false, "reason": "Overlaps an existing module."}

	# Structural connectivity check: must touch at least one existing cell connected to Cockpit (0,0,0)
	var touches_ship := false
	for c in cells:
		for n in NEIGHBORS_6:
			if cell_to_uid.has(c + n):
				touches_ship = true
				break
		if touches_ship:
			break

	if not touches_ship:
		return {"ok": false, "reason": "Must connect directly to existing ship structure."}

	# Engine exhaust clearance check: nozzle (+Z in local, i.e., -forward) shouldn't fire straight into an adjacent block
	if mod_id in ["engine_basic", "thruster_booster"]:
		var exhaust_dir := -get_yaw_forward_vector(yaw)
		var exhaust_cell := anchor + Vector3i(int(round(exhaust_dir.x)), int(round(exhaust_dir.y)), int(round(exhaust_dir.z)))
		if cell_to_uid.has(exhaust_cell):
			return {"ok": false, "reason": "Engine exhaust nozzle is blocked by another module."}

	return {"ok": true, "reason": "Valid placement.", "cells": cells}

func _force_place(mod_id: String, anchor: Vector3i, yaw: int, level: int, free_starting: bool) -> int:
	var cells := get_footprint_cells(mod_id, anchor, posmod(yaw, 4))
	var uid := _next_uid
	_next_uid += 1
	var max_hp := GameData.get_module_scaled_stat(mod_id, "max_hp", level)
	var entry: Dictionary = {
		"uid": uid,
		"mod_id": mod_id,
		"anchor": anchor,
		"yaw": posmod(yaw, 4),
		"cells": cells,
		"level": maxi(1, level),
		"hp": max_hp,
		"max_hp": max_hp,
		"is_free_starting": free_starting,
	}
	placed_modules[uid] = entry
	for c in cells:
		cell_to_uid[c] = uid
	return uid

func place_module(mod_id: String, anchor: Vector3i, yaw: int) -> Dictionary:
	var check := validate_placement(mod_id, anchor, yaw, false)
	if not check["ok"]:
		return check

	var level := 1
	var used_free_cell := false
	if mod_id == "hull_cell":
		if free_unplaced_hull_cells > 0:
			free_unplaced_hull_cells -= 1
			used_free_cell = true
		else:
			unplaced_expansion_cells -= 1
	else:
		var arr: Array = owned_equipment.get(mod_id, [])
		level = int(arr.pop_back())
		owned_equipment[mod_id] = arr

	var uid := _force_place(mod_id, anchor, yaw, level, used_free_cell)
	ship_changed.emit()
	return {"ok": true, "uid": uid, "reason": "Module installed."}

func can_remove_at(cell: Vector3i) -> Dictionary:
	if not cell_to_uid.has(cell):
		return {"ok": false, "reason": "No module at this grid cell."}
	var uid: int = cell_to_uid[cell]
	var entry: Dictionary = placed_modules[uid]
	if entry["mod_id"] == "cockpit_mk1" or entry["anchor"] == Vector3i.ZERO:
		return {"ok": false, "reason": "Command Cockpit cannot be removed."}

	# Simulate removing all cells belonging to uid and verify remaining cells stay connected to (0,0,0)
	var removed_set: Dictionary = {}
	for c in entry["cells"]:
		removed_set[c] = true

	var remaining_count := cell_to_uid.size() - removed_set.size()
	if remaining_count <= 0:
		return {"ok": false, "reason": "Cannot remove core."}

	var visited: Dictionary = {}
	var queue: Array[Vector3i] = [Vector3i.ZERO]
	visited[Vector3i.ZERO] = true
	var head := 0
	while head < queue.size():
		var cur := queue[head]
		head += 1
		for n in NEIGHBORS_6:
			var nb := cur + n
			if cell_to_uid.has(nb) and not removed_set.has(nb) and not visited.has(nb):
				visited[nb] = true
				queue.append(nb)

	if visited.size() != remaining_count:
		return {"ok": false, "reason": "Cannot remove: other modules depend on this structural link!"}

	return {"ok": true, "uid": uid}

func remove_module_at(cell: Vector3i) -> Dictionary:
	var check := can_remove_at(cell)
	if not check["ok"]:
		return check
	var uid: int = check["uid"]
	var entry: Dictionary = placed_modules[uid]
	for c in entry["cells"]:
		cell_to_uid.erase(c)
	placed_modules.erase(uid)

	var mod_id: String = entry["mod_id"]
	if mod_id == "hull_cell":
		if not entry.get("is_free_starting", false):
			unplaced_expansion_cells += 1
		else:
			free_unplaced_hull_cells += 1
	else:
		if not owned_equipment.has(mod_id):
			owned_equipment[mod_id] = []
		owned_equipment[mod_id].append(int(entry.get("level", 1)))

	ship_changed.emit()
	return {"ok": true, "mod_id": mod_id}

func buy_equipment(mod_id: String) -> Dictionary:
	if not GameData.modules.has(mod_id) or mod_id in ["cockpit_mk1", "hull_cell"]:
		return {"ok": false, "reason": "Invalid shop item."}
	var price: int = int(GameData.modules[mod_id]["price"])
	if credits < price:
		return {"ok": false, "reason": "Insufficient Credits."}
	credits -= price
	if not owned_equipment.has(mod_id):
		owned_equipment[mod_id] = []
	owned_equipment[mod_id].append(1)
	credits_changed.emit(credits)
	ship_changed.emit()
	return {"ok": true, "reason": "Purchased " + str(GameData.modules[mod_id]["name"])}

func upgrade_installed_module(uid: int) -> Dictionary:
	if not placed_modules.has(uid):
		return {"ok": false, "reason": "Module not found."}
	var entry: Dictionary = placed_modules[uid]
	var mod_id: String = entry["mod_id"]
	if mod_id in ["cockpit_mk1", "hull_cell"]:
		return {"ok": false, "reason": "Structural module does not take tier upgrades."}
	var cur_lvl: int = int(entry.get("level", 1))
	var max_lvl: int = int(GameData.modules[mod_id].get("max_level", 5))
	if cur_lvl >= max_lvl:
		return {"ok": false, "reason": "Already at maximum level."}
	var base_price: int = maxi(200, int(GameData.modules[mod_id]["price"]))
	var upg_cost := int(round(float(base_price) * 0.75 * float(cur_lvl)))
	if credits < upg_cost:
		return {"ok": false, "reason": "Need %d Credits to upgrade." % upg_cost}

	credits -= upg_cost
	entry["level"] = cur_lvl + 1
	entry["max_hp"] = GameData.get_module_scaled_stat(mod_id, "max_hp", cur_lvl + 1)
	entry["hp"] = entry["max_hp"]
	stats_history["modules_upgraded"] = int(stats_history.get("modules_upgraded", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("upgrade_equipment", 1)
	credits_changed.emit(credits)
	ship_changed.emit()
	return {"ok": true, "new_level": cur_lvl + 1, "cost": upg_cost}

func repair_all_modules() -> void:
	var buffs := _collect_buffs()
	var hull_mult: float = 1.0 + float(buffs.get("hull_mult", 0.0)) + float(buffs.get("all_stats_mult", 0.0))
	for uid in placed_modules.keys():
		var e: Dictionary = placed_modules[uid]
		var base_hp := GameData.get_module_scaled_stat(e["mod_id"], "max_hp", int(e.get("level", 1)))
		e["max_hp"] = base_hp * hull_mult
		e["hp"] = e["max_hp"]

func get_module_efficiency(entry: Dictionary) -> float:
	var mhp := maxf(1.0, float(entry.get("max_hp", 100.0)))
	var chp := clampf(float(entry.get("hp", mhp)), 0.0, mhp)
	if chp <= 0.01:
		return 0.0
	var ratio := chp / mhp
	if ratio >= 0.5:
		return 1.0
	return lerpf(0.40, 1.0, ratio / 0.5)

func get_current_cargo_units() -> int:
	var total := 0
	for k in cargo.keys():
		total += maxi(0, int(cargo[k]))
	return total

func get_current_cargo_mass() -> float:
	var w := 0.0
	for k in cargo.keys():
		if GameData.RESOURCES.has(k):
			w += float(maxi(0, int(cargo[k]))) * float(GameData.RESOURCES[k]["unit_mass"])
	return w

func add_cargo_resource(res_id: String, amount: int) -> int:
	if amount <= 0 or not GameData.RESOURCES.has(res_id):
		return 0
	var stats := compute_ship_stats()
	var cap: int = int(stats["cargo_capacity"])
	var used := get_current_cargo_units()
	var space_left := maxi(0, cap - used)
	var added := mini(amount, space_left)
	if added > 0:
		cargo[res_id] = int(cargo.get(res_id, 0)) + added
		stats_history["resources_collected"] = int(stats_history.get("resources_collected", 0)) + added
		if AchievementManager:
			AchievementManager.record_event("collect_resources", added)
			if res_id == "iron":
				AchievementManager.record_event("collect_iron", added)
		cargo_changed.emit()
	return added

func sell_all_cargo() -> int:
	var buffs := _collect_buffs()
	var val_mult := 1.0 + float(buffs.get("credit_mult", 0.0)) + float(buffs.get("all_stats_mult", 0.0))
	var total_cr := 0
	var total_units := 0
	for k in cargo.keys():
		var cnt := maxi(0, int(cargo[k]))
		if cnt > 0 and GameData.RESOURCES.has(k):
			total_cr += int(round(float(cnt * int(GameData.RESOURCES[k]["value"])) * val_mult))
			total_units += cnt
			cargo[k] = 0
	if total_cr > 0:
		add_credits(total_cr)
		if AchievementManager and total_units > 0:
			AchievementManager.record_event("sell_minerals", total_units)
		cargo_changed.emit()
	return total_cr

func _collect_buffs() -> Dictionary:
	var combined: Dictionary = {}
	if CrewManager:
		var cb := CrewManager.get_combined_buffs()
		for k in cb.keys():
			combined[k] = float(combined.get(k, 0.0)) + float(cb[k])
	if UpgradeManager:
		var ub := UpgradeManager.get_combined_buffs()
		for k in ub.keys():
			if k in ["damage_total_mult", "speed_total_mult", "loot_total_mult"]:
				combined[k] = maxf(1.0, float(combined.get(k, 1.0))) * float(ub[k])
			else:
				combined[k] = float(combined.get(k, 0.0)) + float(ub[k])
	return combined

func compute_ship_stats(extra_cargo_mass: float = -1.0) -> Dictionary:
	var buffs := _collect_buffs()
	var all_mult := 1.0 + float(buffs.get("all_stats_mult", 0.0))

	var dry_mass := 0.0
	var weighted_pos := Vector3.ZERO
	var cargo_centroids: Array[Vector3] = []

	var total_thrust := 0.0
	var thrust_origin_accum := Vector3.ZERO
	var engine_count := 0
	var turn_bonus := 0.0

	var energy_cap := 0.0
	var energy_regen := 0.0
	var energy_draw := 0.0
	var shield_cap := 0.0
	var shield_regen := 0.0
	var armor_red := 0.0
	var repair_rate := float(buffs.get("repair_add", 0.0))
	var cargo_cap := 0
	var mining_dps := 0.0
	var weapon_dps := 0.0
	var best_magnet_range := 0.0
	var radar_range := 140.0
	var scanner_range := 0.0
	var rare_chance := float(buffs.get("rare_chance_add", 0.0))
	var drone_count := 0
	var total_hp := 0.0
	var current_hp := 0.0

	var hull_mult := (1.0 + float(buffs.get("hull_mult", 0.0))) * all_mult

	for uid in placed_modules.keys():
		var e: Dictionary = placed_modules[uid]
		var mid: String = e["mod_id"]
		if not GameData.modules.has(mid):
			continue
		var def: Dictionary = GameData.modules[mid]
		var lvl: int = int(e.get("level", 1))
		var eff := get_module_efficiency(e)

		# Center of occupied cells in local 3D meters
		var cells: Array = e["cells"]
		var local_center := Vector3.ZERO
		for c in cells:
			local_center += Vector3(c.x, c.y, c.z) * CELL_SIZE
		local_center /= float(maxi(1, cells.size()))

		var m_mass := float(def["mass"])
		dry_mass += m_mass
		weighted_pos += local_center * m_mass

		if int(def.get("cargo_cap", 0)) > 0:
			cargo_centroids.append(local_center)
			cargo_cap += int(round(GameData.get_module_scaled_stat(mid, "cargo_cap", lvl)))

		var m_max_hp := GameData.get_module_scaled_stat(mid, "max_hp", lvl) * hull_mult
		e["max_hp"] = m_max_hp
		e["hp"] = clampf(float(e.get("hp", m_max_hp)), 0.0, m_max_hp)
		total_hp += m_max_hp
		current_hp += float(e["hp"])

		var edraw := float(def.get("energy_draw", 0.0))
		if edraw > 0.0:
			energy_draw += edraw
		energy_cap += GameData.get_module_scaled_stat(mid, "energy_cap", lvl)
		energy_regen += GameData.get_module_scaled_stat(mid, "energy_regen", lvl) * eff

		if def.has("thrust_force"):
			var tf := GameData.get_module_scaled_stat(mid, "thrust_force", lvl) * eff
			total_thrust += tf
			thrust_origin_accum += local_center * tf
			engine_count += 1
			turn_bonus += float(def.get("turn_bonus", 0.0)) * eff

		shield_cap += GameData.get_module_scaled_stat(mid, "shield_cap", lvl) * eff
		shield_regen += GameData.get_module_scaled_stat(mid, "shield_regen", lvl) * eff
		armor_red += float(def.get("armor_reduction", 0.0)) * eff
		repair_rate += GameData.get_module_scaled_stat(mid, "repair_rate", lvl) * eff

		if def.has("mining_dps"):
			mining_dps += GameData.get_module_scaled_stat(mid, "mining_dps", lvl) * eff
		if def.has("weapon_damage"):
			var wd := GameData.get_module_scaled_stat(mid, "weapon_damage", lvl)
			var fr := float(def.get("fire_rate", 1.0)) * (1.0 + float(buffs.get("fire_rate_mult", 0.0)))
			weapon_dps += wd * fr * eff
		if def.has("magnet_range"):
			best_magnet_range = maxf(best_magnet_range, GameData.get_module_scaled_stat(mid, "magnet_range", lvl) * eff)
		if def.has("radar_range"):
			radar_range = maxf(radar_range, GameData.get_module_scaled_stat(mid, "radar_range", lvl) * eff)
		if def.has("scanner_range"):
			scanner_range = maxf(scanner_range, GameData.get_module_scaled_stat(mid, "scanner_range", lvl) * eff)
			rare_chance += float(def.get("rare_mineral_chance", 0.0)) * eff
		if def.has("drone_count") and eff > 0.0:
			drone_count += int(def["drone_count"])

	var c_mass := get_current_cargo_mass() if extra_cargo_mass < 0.0 else extra_cargo_mass
	var cargo_center := Vector3.ZERO
	if not cargo_centroids.is_empty():
		for cp in cargo_centroids:
			cargo_center += cp
		cargo_center /= float(cargo_centroids.size())

	var total_mass := maxf(1.0, dry_mass + c_mass)
	var com := (weighted_pos + cargo_center * c_mass) / total_mass

	# Apply crew & active upgrade multipliers
	var speed_mult := (1.0 + float(buffs.get("speed_mult", 0.0))) * maxf(1.0, float(buffs.get("speed_total_mult", 1.0))) * all_mult
	var dmg_mult := (1.0 + float(buffs.get("damage_mult", 0.0))) * maxf(1.0, float(buffs.get("damage_total_mult", 1.0))) * all_mult
	var mine_mult := (1.0 + float(buffs.get("mining_mult", 0.0))) * all_mult
	var loot_mult := (1.0 + float(buffs.get("loot_mult", 0.0))) * maxf(1.0, float(buffs.get("loot_total_mult", 1.0)))
	var shld_mult := (1.0 + float(buffs.get("shield_mult", 0.0))) * all_mult
	var er_mult := (1.0 + float(buffs.get("energy_regen_mult", 0.0))) * all_mult
	var mag_mult := (1.0 + float(buffs.get("magnet_range_mult", 0.0))) * all_mult
	var cargo_mult := 1.0 + float(buffs.get("cargo_mult", 0.0))
	var turn_mult := (1.0 + float(buffs.get("turn_mult", 0.0)) + turn_bonus) * all_mult

	total_thrust *= speed_mult
	var thrust_center := (thrust_origin_accum / maxf(0.01, (total_thrust / maxf(0.01, speed_mult)))) if engine_count > 0 else Vector3.ZERO
	var lateral_imbalance := Vector2(com.x - thrust_center.x, com.y - thrust_center.y).length()
	var balance_score := clampf(100.0 - lateral_imbalance * 18.0, 15.0, 100.0)

	# Moment of inertia approximation from spatial distribution around CoM
	var inertia := 0.0
	for uid in placed_modules.keys():
		var e2: Dictionary = placed_modules[uid]
		var m2 := float(GameData.modules[e2["mod_id"]]["mass"])
		var p2 := Vector3(e2["anchor"].x, e2["anchor"].y, e2["anchor"].z) * CELL_SIZE
		inertia += m2 * maxf(1.5, p2.distance_squared_to(com))

	var accel := total_thrust / total_mass
	var angular_accel := ((160.0 + float(engine_count) * 95.0) * turn_mult) / maxf(25.0, inertia * 0.35)

	return {
		"dry_mass": dry_mass,
		"cargo_mass": c_mass,
		"total_mass": total_mass,
		"center_of_mass": com,
		"thrust_center": thrust_center,
		"balance_score": balance_score,
		"total_thrust": total_thrust,
		"engine_count": engine_count,
		"acceleration": accel,
		"angular_accel": angular_accel,
		"inertia": inertia,
		"energy_cap": energy_cap + float(buffs.get("energy_cap_add", 0.0)),
		"energy_regen": energy_regen * er_mult,
		"energy_draw": energy_draw,
		"shield_cap": shield_cap * shld_mult,
		"shield_regen": shield_regen * shld_mult,
		"armor_reduction": clampf(armor_red, 0.0, 0.65),
		"repair_rate": repair_rate,
		"cargo_capacity": int(round(float(cargo_cap) * cargo_mult)),
		"mining_dps": mining_dps * mine_mult,
		"mining_mult": mine_mult,
		"weapon_dps": weapon_dps * dmg_mult,
		"damage_mult": dmg_mult,
		"fire_rate_mult": 1.0 + float(buffs.get("fire_rate_mult", 0.0)),
		"loot_mult": loot_mult,
		"magnet_range": best_magnet_range * mag_mult,
		"magnet_mult": mag_mult,
		"radar_range": radar_range,
		"scanner_range": scanner_range,
		"rare_chance": clampf(rare_chance, 0.0, 0.85),
		"drone_count": drone_count,
		"total_hp": total_hp,
		"current_hp": current_hp,
		"module_count": placed_modules.size(),
	}

func unlock_sector(sector_idx: int) -> Dictionary:
	if sector_idx < 0 or sector_idx >= GameData.sectors.size():
		return {"ok": false, "reason": "Invalid sector."}
	if unlocked_sectors.has(sector_idx):
		return {"ok": false, "reason": "Sector already unlocked."}
	var sdef: Dictionary = GameData.sectors[sector_idx]
	var req_cells: int = int(sdef["required_cells"])
	var cost: int = int(sdef["unlock_cost"])
	if purchased_expansion_cells < req_cells:
		return {"ok": false, "reason": "Requires %d Purchased Expansion Cells (you have %d)." % [req_cells, purchased_expansion_cells]}
	if credits < cost:
		return {"ok": false, "reason": "Requires %d Credits." % cost}

	credits -= cost
	unlocked_sectors.append(sector_idx)
	credits_changed.emit(credits)
	if AchievementManager:
		AchievementManager.record_event("unlock_sector", 1)
	return {"ok": true}

func serialize_ship() -> Array:
	var arr: Array = []
	for uid in placed_modules.keys():
		var e: Dictionary = placed_modules[uid]
		var a: Vector3i = e["anchor"]
		arr.append({
			"mod_id": e["mod_id"],
			"ax": a.x, "ay": a.y, "az": a.z,
			"yaw": int(e["yaw"]),
			"level": int(e.get("level", 1)),
			"is_free_starting": bool(e.get("is_free_starting", false)),
		})
	return arr

func validate_serialized_layout(arr: Array) -> bool:
	if arr.is_empty():
		return false
	var occ: Dictionary = {}
	var has_cockpit := false
	for item in arr:
		if typeof(item) != TYPE_DICTIONARY:
			return false
		var mid := str(item.get("mod_id", ""))
		if not GameData.modules.has(mid):
			return false
		var anc := Vector3i(int(item.get("ax", 0)), int(item.get("ay", 0)), int(item.get("az", 0)))
		var yaw := int(item.get("yaw", 0))
		if yaw < 0 or yaw > 3:
			return false
		if mid == "cockpit_mk1":
			if has_cockpit or anc != Vector3i.ZERO:
				return false
			has_cockpit = true
		var cells := get_footprint_cells(mid, anc, yaw)
		for c in cells:
			if not is_in_bounds(c) or occ.has(c):
				return false
			occ[c] = true
	if not has_cockpit or not occ.has(Vector3i.ZERO):
		return false
	# BFS connectivity check from (0,0,0)
	var visited: Dictionary = {Vector3i.ZERO: true}
	var q: Array[Vector3i] = [Vector3i.ZERO]
	var head := 0
	while head < q.size():
		var cur := q[head]
		head += 1
		for n in NEIGHBORS_6:
			var nb := cur + n
			if occ.has(nb) and not visited.has(nb):
				visited[nb] = true
				q.append(nb)
	return visited.size() == occ.size()

func load_serialized_ship(arr: Array) -> bool:
	if not validate_serialized_layout(arr):
		return false
	placed_modules.clear()
	cell_to_uid.clear()
	_next_uid = 1
	for item in arr:
		var anc := Vector3i(int(item["ax"]), int(item["ay"]), int(item["az"]))
		_force_place(
			str(item["mod_id"]),
			anc,
			int(item["yaw"]),
			maxi(1, int(item.get("level", 1))),
			bool(item.get("is_free_starting", false))
		)
	repair_all_modules()
	ship_changed.emit()
	return true

func save_named_layout(layout_name: String) -> bool:
	var clean := layout_name.strip_edges()
	if clean.is_empty():
		return false
	saved_layouts[clean] = serialize_ship()
	return true
