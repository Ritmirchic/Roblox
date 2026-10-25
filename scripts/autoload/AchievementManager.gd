extends Node

signal achievements_updated
signal achievement_completed(task: Dictionary)

const INTERVAL_MINUTE: int = 60
const INTERVAL_HOURLY: int = 3600
const INTERVAL_DAILY: int = 86400
const INTERVAL_WEEKLY: int = 604800

const COUNT_MINUTE: int = 5
const COUNT_HOURLY: int = 3
const COUNT_DAILY: int = 7
const COUNT_WEEKLY: int = 15
const TOTAL_ACTIVE_ACHIEVEMENTS: int = 30

# Optional override for deterministic unit testing of UTC boundary rollovers
var test_utc_override: float = -1.0

var bucket_ids: Dictionary = {
	"minute": -1,
	"hourly": -1,
	"daily": -1,
	"weekly": -1,
}

# category -> Array[Dictionary]
var active_tasks: Dictionary = {
	"minute": [],
	"hourly": [],
	"daily": [],
	"weekly": [],
}

# Permanent Collectible Achievement Card Album: card_key -> int times completed
var collected_album: Dictionary = {}
var _claimed_ledger: Dictionary = {}
var _accum_tick: float = 0.0

func _ready() -> void:
	ensure_buckets_current()

func _process(delta: float) -> void:
	_accum_tick += delta
	if _accum_tick >= 1.0:
		_accum_tick = 0.0
		ensure_buckets_current()

func get_utc_unix() -> int:
	if test_utc_override >= 0.0:
		return int(floor(test_utc_override))
	return int(floor(Time.get_unix_time_from_system()))

func get_seconds_until_reset(category: String) -> int:
	var now := get_utc_unix()
	var interval := _get_interval(category)
	return maxi(0, interval - (now % interval))

func get_claimable_count() -> int:
	var n := 0
	for cat in ["minute", "hourly", "daily", "weekly"]:
		var arr: Array = active_tasks.get(cat, [])
		for t in arr:
			if bool(t.get("completed", false)) and not bool(t.get("claimed", false)):
				n += 1
	return n

func _get_interval(category: String) -> int:
	match category:
		"minute": return INTERVAL_MINUTE
		"hourly": return INTERVAL_HOURLY
		"daily": return INTERVAL_DAILY
		"weekly": return INTERVAL_WEEKLY
	return INTERVAL_DAILY

func ensure_buckets_current() -> bool:
	var now := get_utc_unix()
	var changed := false
	for cat in ["minute", "hourly", "daily", "weekly"]:
		var interval := _get_interval(cat)
		var cur_bucket := int(floor(float(now) / float(interval)))
		if int(bucket_ids.get(cat, -1)) != cur_bucket or active_tasks[cat].is_empty():
			bucket_ids[cat] = cur_bucket
			active_tasks[cat] = _generate_tasks_for_category(cat, cur_bucket)
			changed = true
	if changed:
		achievements_updated.emit()
	return changed

func _player_has_weapon() -> bool:
	for uid in ShipGrid.placed_modules.keys():
		var mid: String = ShipGrid.placed_modules[uid]["mod_id"]
		if GameData.modules.has(mid) and GameData.modules[mid]["category"] == "Weapons":
			return true
	return false

func _generate_tasks_for_category(category: String, bucket_seed: int) -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	var has_weapon := _player_has_weapon()

	if category == "minute":
		# Easy 20-40 second tasks tailored to current player progression (never impossible!)
		var pool: Array = [
			["min_ast", "Quick Fracture", "Shatter nearby belt rocks.", "Mine 3 Asteroids", "mine_asteroid", 3, 4, "Common", "res://assets/cards/achievements/ach_01.png"],
			["min_chunk", "Magnetic Sweep", "Scoop loose mineral fragments.", "Collect 8 Resource Chunks", "collect_resources", 8, 5, "Common", "res://assets/cards/achievements/ach_03.png"],
			["min_iron", "Ferrite Rush", "Gather raw Ferrite Iron.", "Collect 10 Iron", "collect_iron", 10, 5, "Common", "res://assets/cards/achievements/ach_09.png"],
			["min_dist", "Thruster Burn", "Cruise across orbital space.", "Travel 320m in Space", "travel_distance", 320, 4, "Common", "res://assets/cards/achievements/ach_04.png"],
			["min_beam", "Thermal Drill", "Keep mining emitters active.", "Operate Mining Beam for 6s", "mining_seconds", 6, 4, "Common", "res://assets/cards/achievements/ach_07.png"],
			["min_cred", "Quick Payday", "Earn credits from ore or bounties.", "Earn 150 Credits", "earn_credits", 150, 6, "Uncommon", "res://assets/cards/achievements/ach_05.png"],
		]
		if has_weapon:
			pool.append(["min_drone", "Perimeter Clear", "Neutralize hostile scouts.", "Destroy 2 Hostile Drones", "defeat_enemy", 2, 6, "Uncommon", "res://assets/cards/achievements/ach_02.png"])

		# Deterministic rotation per UTC minute bucket so all 5 active minute tasks feel fresh
		var start_idx := posmod(bucket_seed, pool.size())
		for i in range(COUNT_MINUTE):
			var row: Array = pool[(start_idx + i) % pool.size()]
			out.append(_make_task_dict(category, bucket_seed, i, row))

	elif category == "hourly":
		var h_list: Array = [
			["hr_mine", "Belt Excavator", "Clear a rich asteroid pocket.", "Mine 35 Asteroids", "mine_asteroid", 35, 18, "Rare", "res://assets/cards/achievements/ach_13.png"],
			["hr_enemy", "Sector Patrol", "Eliminate hostile spacecraft.", "Defeat 8 Enemies", "defeat_enemy", 8, 22, "Rare", "res://assets/cards/achievements/ach_08.png"],
			["hr_res", "Bulk Hauler", "Fill your cargo bays with minerals.", "Collect 250 Resources", "collect_resources", 250, 20, "Rare", "res://assets/cards/achievements/ach_15.png"],
		]
		for i in range(COUNT_HOURLY):
			out.append(_make_task_dict(category, bucket_seed, i, h_list[i]))

	elif category == "daily":
		var d_list: Array = [
			["day_mine", "Deep Strip-Miner", "Fracture a hundred space rocks.", "Mine 100 Asteroids", "mine_asteroid", 100, 40, "Epic", "res://assets/cards/achievements/ach_19.png"],
			["day_cred", "Orbital Tycoon", "Build serious capital from expeditions.", "Earn 10,000 Credits", "earn_credits", 10000, 50, "Epic", "res://assets/cards/achievements/ach_11.png"],
			["day_exp", "Sortie Veteran", "Launch and return safely to Hangar.", "Complete 3 Expeditions", "complete_expedition", 3, 38, "Rare", "res://assets/cards/achievements/ach_10.png"],
			["day_upg", "Chief Retrofitter", "Enhance installed ship hardware.", "Upgrade Equipment 2 Times", "upgrade_equipment", 2, 42, "Epic", "res://assets/cards/achievements/ach_17.png"],
			["day_enemy", "Corsair Hunter", "Keep mining lanes clear of raiders.", "Defeat 25 Enemies", "defeat_enemy", 25, 45, "Epic", "res://assets/cards/achievements/ach_14.png"],
			["day_pack", "Recruitment Drive", "Expand your crew card roster.", "Open 2 Card Packs", "open_pack", 2, 35, "Rare", "res://assets/cards/achievements/ach_12.png"],
			["day_sell", "Smelter Contract", "Refine hauled minerals into credits.", "Sell 400 Minerals", "sell_minerals", 400, 40, "Rare", "res://assets/cards/achievements/ach_21.png"],
		]
		for i in range(COUNT_DAILY):
			out.append(_make_task_dict(category, bucket_seed, i, d_list[i]))

	elif category == "weekly":
		var w_list: Array = [
			["wk_01", "Belt Titan", "Industrial-scale asteroid demolition.", "Mine 1,000 Asteroids", "mine_asteroid", 1000, 140, "Legendary", "res://assets/cards/achievements/ach_25.png"],
			["wk_02", "Grand Annihilator", "Shatter entire asteroid fields.", "Mine 2,000 Asteroids", "mine_asteroid", 2000, 240, "Mythic", "res://assets/cards/achievements/ach_06.png"],
			["wk_03", "Ace Squadron", "Dominate hostile fighters in space.", "Defeat 100 Enemies", "defeat_enemy", 100, 130, "Legendary", "res://assets/cards/achievements/ach_20.png"],
			["wk_04", "Fleet Conqueror", "Crush pirate armadas & sentinels.", "Defeat 300 Enemies", "defeat_enemy", 300, 250, "Mythic", "res://assets/cards/achievements/ach_26.png"],
			["wk_05", "Void Pathfinder", "Complete deep-space mining sorties.", "Complete 20 Expeditions", "complete_expedition", 20, 120, "Epic", "res://assets/cards/achievements/ach_16.png"],
			["wk_06", "Galactic Odyssey", "Master fifty orbital expeditions.", "Complete 50 Expeditions", "complete_expedition", 50, 220, "Legendary", "res://assets/cards/achievements/ach_22.png"],
			["wk_07", "Frontier Charter", "Push deeper into dangerous space.", "Unlock 1 New Sector", "unlock_sector", 1, 150, "Legendary", "res://assets/cards/achievements/ach_28.png"],
			["wk_08", "Hull Architect", "Expand modular ship construction cells.", "Purchase 5 Expansion Cells", "expand_ship", 5, 110, "Epic", "res://assets/cards/achievements/ach_23.png"],
			["wk_09", "Dreadnought Builder", "Construct a massive capital hull.", "Purchase 15 Expansion Cells", "expand_ship", 15, 210, "Legendary", "res://assets/cards/achievements/ach_29.png"],
			["wk_10", "Crew Collector", "Discover unique officers for your bridge.", "Collect 6 New Crew Cards", "collect_crew_card", 6, 135, "Legendary", "res://assets/cards/achievements/ach_18.png"],
			["wk_11", "Pack Connoisseur", "Unseal galactic booster vaults.", "Open 10 Card Packs", "open_pack", 10, 145, "Epic", "res://assets/cards/achievements/ach_24.png"],
			["wk_12", "Master Engineer", "Upgrade ship modules to peak output.", "Upgrade Equipment 8 Times", "upgrade_equipment", 8, 130, "Epic", "res://assets/cards/achievements/ach_27.png"],
			["wk_13", "Mega Hauler", "Extract thousands of mineral chunks.", "Collect 2,500 Resources", "collect_resources", 2500, 160, "Legendary", "res://assets/cards/achievements/ach_21.png"],
			["wk_14", "Star Magnate", "Amass a fortune across the sectors.", "Earn 100,000 Credits", "earn_credits", 100000, 200, "Mythic", "res://assets/cards/achievements/ach_30.png"],
			["wk_15", "Interstellar Voyager", "Log long-range flight telemetry.", "Travel 25,000m in Space", "travel_distance", 25000, 125, "Epic", "res://assets/cards/achievements/ach_10.png"],
		]
		for i in range(COUNT_WEEKLY):
			out.append(_make_task_dict(category, bucket_seed, i, w_list[i]))

	return out

func _make_task_dict(category: String, bucket_seed: int, slot_idx: int, row: Array) -> Dictionary:
	return {
		"id": str(row[0]),
		"slot_idx": slot_idx,
		"category": category,
		"bucket": bucket_seed,
		"name": str(row[1]),
		"description": str(row[2]),
		"objective": str(row[3]),
		"event_type": str(row[4]),
		"target": int(row[5]),
		"progress": 0.0,
		"crystal_reward": int(row[6]),
		"rarity": str(row[7]),
		"art": str(row[8]),
		"completed": false,
		"claimed": false,
	}

func record_event(event_type: String, amount: float) -> void:
	if amount <= 0.0:
		return
	ensure_buckets_current()
	var any_changed := false
	for cat in ["minute", "hourly", "daily", "weekly"]:
		for task in active_tasks[cat]:
			if task["event_type"] == event_type and not bool(task["completed"]):
				task["progress"] = minf(float(task["target"]), float(task["progress"]) + amount)
				any_changed = true
				if float(task["progress"]) >= float(task["target"]):
					task["completed"] = true
					collected_album[task["id"]] = int(collected_album.get(task["id"], 0)) + 1
					achievement_completed.emit(task)
	if any_changed:
		achievements_updated.emit()

func claim_reward(category: String, task_id: String) -> Dictionary:
	ensure_buckets_current()
	if not active_tasks.has(category):
		return {"ok": false, "reason": "Invalid category."}
	for task in active_tasks[category]:
		if task["id"] == task_id:
			if not bool(task["completed"]):
				return {"ok": false, "reason": "Achievement not yet completed."}
			var ledger_key := "%s:%d:%s" % [category, int(task["bucket"]), task_id]
			if bool(task["claimed"]) or _claimed_ledger.has(ledger_key):
				return {"ok": false, "reason": "Reward already claimed for this period."}

			task["claimed"] = true
			_claimed_ledger[ledger_key] = true
			var reward := int(task["crystal_reward"])
			ShipGrid.add_crystals(reward)
			collected_album[task_id] = maxi(1, int(collected_album.get(task_id, 0)))
			achievements_updated.emit()
			SaveManager.save_game()
			return {"ok": true, "crystals": reward}
	return {"ok": false, "reason": "Achievement not found."}

func get_total_active_count() -> int:
	return (
		active_tasks["minute"].size()
		+ active_tasks["hourly"].size()
		+ active_tasks["daily"].size()
		+ active_tasks["weekly"].size()
	)

func serialize_state() -> Dictionary:
	return {
		"bucket_ids": bucket_ids.duplicate(true),
		"active_tasks": active_tasks.duplicate(true),
		"collected_album": collected_album.duplicate(true),
		"claimed_ledger": _claimed_ledger.duplicate(true),
	}

func load_state(data: Dictionary) -> void:
	if typeof(data) != TYPE_DICTIONARY:
		ensure_buckets_current()
		return
	if typeof(data.get("collected_album")) == TYPE_DICTIONARY:
		collected_album = data["collected_album"].duplicate(true)
	if typeof(data.get("claimed_ledger")) == TYPE_DICTIONARY:
		_claimed_ledger = data["claimed_ledger"].duplicate(true)
	if typeof(data.get("bucket_ids")) == TYPE_DICTIONARY and typeof(data.get("active_tasks")) == TYPE_DICTIONARY:
		for cat in ["minute", "hourly", "daily", "weekly"]:
			if data["bucket_ids"].has(cat) and data["active_tasks"].has(cat) and typeof(data["active_tasks"][cat]) == TYPE_ARRAY:
				bucket_ids[cat] = int(data["bucket_ids"][cat])
				active_tasks[cat].clear()
				for item in data["active_tasks"][cat]:
					if typeof(item) == TYPE_DICTIONARY:
						active_tasks[cat].append(item.duplicate(true))
	# Roll forward any buckets that expired while offline!
	ensure_buckets_current()
