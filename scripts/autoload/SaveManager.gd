extends Node

const SAVE_VERSION: int = 2
const DEFAULT_SAVE_PATH: String = "user://space_miner_save.json"
const BACKUP_SAVE_PATH: String = "user://space_miner_save.bak"
const HASH_SALT: String = "SPACE_MINER_V2_INTEGRITY"

var last_load_status: String = "fresh"
var pending_autosave: bool = false

func _ready() -> void:
	# Skip auto-loading user save when running automated headless test runner
	var args := OS.get_cmdline_args()
	for a in args:
		if a.contains("TestRunner"):
			return
	load_game()

func _compute_checksum(payload_json: String) -> String:
	var ctx := HashingContext.new()
	ctx.start(HashingContext.HASH_SHA256)
	ctx.update((payload_json + HASH_SALT).to_utf8_buffer())
	return ctx.finish().hex_encode()

func build_save_payload() -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"timestamp_utc": int(floor(Time.get_unix_time_from_system())),
		"credits": ShipGrid.credits,
		"crystals": ShipGrid.crystals,
		"purchased_expansion_cells": ShipGrid.purchased_expansion_cells,
		"unplaced_expansion_cells": ShipGrid.unplaced_expansion_cells,
		"free_unplaced_hull_cells": ShipGrid.free_unplaced_hull_cells,
		"owned_equipment": ShipGrid.owned_equipment.duplicate(true),
		"ship_layout": ShipGrid.serialize_ship(),
		"saved_layouts": ShipGrid.saved_layouts.duplicate(true),
		"cargo": ShipGrid.cargo.duplicate(true),
		"unlocked_sectors": ShipGrid.unlocked_sectors.duplicate(true),
		"stats_history": ShipGrid.stats_history.duplicate(true),
		"crew_owned": CrewManager.owned_cards.duplicate(true),
		"crew_equipped": CrewManager.equipped_crew.duplicate(true),
		"upg_fourth": UpgradeManager.fourth_slot_unlocked,
		"upg_fifth": UpgradeManager.fifth_slot_unlocked,
		"upg_owned": UpgradeManager.owned_upgrades.duplicate(true),
		"upg_equipped": UpgradeManager.active_equipped.duplicate(true),
		"achievements": AchievementManager.serialize_state(),
		"settings": _build_settings_block()
	}

func _build_settings_block() -> Dictionary:
	var blk := ThemeHelper.settings_snapshot()
	blk["language"] = L.current_lang
	blk["master_volume"] = AudioManager.master_volume
	blk["music_volume"] = AudioManager.music_volume
	blk["sfx_volume"] = AudioManager.sfx_volume
	blk["muted"] = AudioManager.muted
	return blk

## Transactional save: writes only when the player has AUTO-SAVE enabled.
## Progress-critical saves (expedition end, reset) always use save_game() directly.
func autosave() -> bool:
	if not ThemeHelper.auto_save:
		pending_autosave = true
		return false
	pending_autosave = false
	return save_game()

## Flush a deferred transactional save (used when AUTO-SAVE is re-enabled).
func flush_pending_autosave() -> void:
	if pending_autosave:
		pending_autosave = false
		save_game()

func save_game(path: String = DEFAULT_SAVE_PATH) -> bool:
	var payload := build_save_payload()
	var payload_str := JSON.stringify(payload)
	var envelope := {
		"schema_version": SAVE_VERSION,
		"checksum": _compute_checksum(payload_str),
		"payload": payload_str,
	}
	var out_text := JSON.stringify(envelope, "\t")

	# Rotate previous valid save to .bak if saving default slot
	if path == DEFAULT_SAVE_PATH and FileAccess.file_exists(DEFAULT_SAVE_PATH):
		var prev := FileAccess.get_file_as_string(DEFAULT_SAVE_PATH)
		if not prev.is_empty():
			var bf := FileAccess.open(BACKUP_SAVE_PATH, FileAccess.WRITE)
			if bf:
				bf.store_string(prev)
				bf.close()

	var f := FileAccess.open(path, FileAccess.WRITE)
	if not f:
		return false
	f.store_string(out_text)
	f.close()
	return true

func load_game(path: String = DEFAULT_SAVE_PATH) -> bool:
	if not FileAccess.file_exists(path):
		last_load_status = "fresh"
		return false

	if _try_load_from_file(path):
		last_load_status = "loaded"
		return true

	# Fallback to backup if primary file is corrupted
	if path == DEFAULT_SAVE_PATH and FileAccess.file_exists(BACKUP_SAVE_PATH):
		if _try_load_from_file(BACKUP_SAVE_PATH):
			last_load_status = "recovered_from_backup"
			return true

	last_load_status = "corrupted_reset_safe"
	return false

func _try_load_from_file(path: String) -> bool:
	var raw := FileAccess.get_file_as_string(path)
	if raw.is_empty():
		return false

	var parsed = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_DICTIONARY:
		return false

	var data: Dictionary = {}
	if parsed.has("payload") and parsed.has("checksum"):
		var p_str := str(parsed["payload"])
		if _compute_checksum(p_str) != str(parsed["checksum"]):
			return false
		var inner = JSON.parse_string(p_str)
		if typeof(inner) != TYPE_DICTIONARY:
			return false
		data = inner
	elif parsed.has("version"):
		# Version 1 legacy migration support
		data = parsed
	else:
		return false

	return apply_loaded_payload(data)

func apply_loaded_payload(data: Dictionary) -> bool:
	if typeof(data) != TYPE_DICTIONARY:
		return false
	var ver := int(data.get("version", 0))
	if ver < 1 or ver > SAVE_VERSION:
		return false

	# Validate ship layout BEFORE mutating live state
	if typeof(data.get("ship_layout")) != TYPE_ARRAY:
		return false
	if not ShipGrid.validate_serialized_layout(data["ship_layout"]):
		return false

	ShipGrid.credits = maxi(0, int(data.get("credits", 1200)))
	ShipGrid.crystals = maxi(0, int(data.get("crystals", 60)))
	ShipGrid.purchased_expansion_cells = maxi(0, int(data.get("purchased_expansion_cells", 0)))
	ShipGrid.unplaced_expansion_cells = maxi(0, int(data.get("unplaced_expansion_cells", 0)))
	ShipGrid.free_unplaced_hull_cells = clampi(int(data.get("free_unplaced_hull_cells", 0)), 0, 2)

	if typeof(data.get("owned_equipment")) == TYPE_DICTIONARY:
		var clean_eq: Dictionary = {}
		for k in data["owned_equipment"].keys():
			if GameData.modules.has(k) and typeof(data["owned_equipment"][k]) == TYPE_ARRAY:
				var lvls: Array = []
				for lv in data["owned_equipment"][k]:
					lvls.append(clampi(int(lv), 1, 5))
				clean_eq[k] = lvls
		ShipGrid.owned_equipment = clean_eq

	ShipGrid.load_serialized_ship(data["ship_layout"])

	if typeof(data.get("saved_layouts")) == TYPE_DICTIONARY:
		ShipGrid.saved_layouts.clear()
		for lname in data["saved_layouts"].keys():
			var lay = data["saved_layouts"][lname]
			if typeof(lay) == TYPE_ARRAY and ShipGrid.validate_serialized_layout(lay):
				ShipGrid.saved_layouts[str(lname)] = lay

	if typeof(data.get("cargo")) == TYPE_DICTIONARY:
		for rk in ShipGrid.cargo.keys():
			ShipGrid.cargo[rk] = maxi(0, int(data["cargo"].get(rk, 0)))

	if typeof(data.get("unlocked_sectors")) == TYPE_ARRAY:
		var secs: Array[int] = [0]
		for s in data["unlocked_sectors"]:
			var si := int(s)
			if si >= 0 and si < GameData.sectors.size() and not secs.has(si):
				secs.append(si)
		ShipGrid.unlocked_sectors = secs

	if typeof(data.get("stats_history")) == TYPE_DICTIONARY:
		for sk in ShipGrid.stats_history.keys():
			if data["stats_history"].has(sk):
				ShipGrid.stats_history[sk] = data["stats_history"][sk]

	# Crew
	if typeof(data.get("crew_owned")) == TYPE_DICTIONARY:
		CrewManager.owned_cards.clear()
		for cid in data["crew_owned"].keys():
			if GameData.crew_by_id.has(cid) and int(data["crew_owned"][cid]) > 0:
				CrewManager.owned_cards[cid] = int(data["crew_owned"][cid])
	if typeof(data.get("crew_equipped")) == TYPE_ARRAY:
		CrewManager.equipped_crew.clear()
		for cid in data["crew_equipped"]:
			CrewManager.equipped_crew.append(str(cid))
		CrewManager.enforce_capacity()

	# Active Upgrades
	UpgradeManager.fourth_slot_unlocked = bool(data.get("upg_fourth", false))
	UpgradeManager.fifth_slot_unlocked = bool(data.get("upg_fifth", false))
	if typeof(data.get("upg_owned")) == TYPE_ARRAY:
		UpgradeManager.owned_upgrades.clear()
		for uid in data["upg_owned"]:
			if GameData.upgrades_by_id.has(str(uid)) and not UpgradeManager.owned_upgrades.has(str(uid)):
				UpgradeManager.owned_upgrades.append(str(uid))
	if typeof(data.get("upg_equipped")) == TYPE_ARRAY:
		UpgradeManager.active_equipped.clear()
		for uid in data["upg_equipped"]:
			UpgradeManager.active_equipped.append(str(uid))
		UpgradeManager.enforce_slot_cap()

	# Achievements
	if typeof(data.get("achievements")) == TYPE_DICTIONARY:
		AchievementManager.load_state(data["achievements"])

	# Settings
	if typeof(data.get("settings")) == TYPE_DICTIONARY:
		var st: Dictionary = data["settings"]
		if st.has("language"):
			L.set_language(str(st.get("language", "ru")), false)
		AudioManager.master_volume = clampf(float(st.get("master_volume", 0.85)), 0.0, 1.0)
		AudioManager.music_volume = clampf(float(st.get("music_volume", 0.58)), 0.0, 1.0)
		AudioManager.sfx_volume = clampf(float(st.get("sfx_volume", 0.78)), 0.0, 1.0)
		AudioManager.muted = bool(st.get("muted", false))
		AudioManager.apply_volumes()
		ThemeHelper.load_settings_snapshot(st)

	ShipGrid.ship_changed.emit()
	ShipGrid.credits_changed.emit(ShipGrid.credits)
	CrewManager.crew_changed.emit()
	UpgradeManager.upgrades_changed.emit()
	return true

func reset_all_progress() -> void:
	ShipGrid.credits = 1200
	ShipGrid.crystals = 60
	ShipGrid.purchased_expansion_cells = 0
	ShipGrid.unplaced_expansion_cells = 0
	ShipGrid.unlocked_sectors = [0]
	for k in ShipGrid.cargo.keys():
		ShipGrid.cargo[k] = 0
	ShipGrid.reset_to_starter_ship()
	CrewManager.owned_cards = {"crew_01": 1, "crew_02": 1}
	CrewManager.equipped_crew.clear()
	UpgradeManager.fourth_slot_unlocked = false
	UpgradeManager.fifth_slot_unlocked = false
	UpgradeManager.owned_upgrades = ["upg_01"]
	UpgradeManager.active_equipped = ["upg_01"]
	AchievementManager.bucket_ids = {"minute": -1, "hourly": -1, "daily": -1, "weekly": -1}
	AchievementManager.collected_album.clear()
	AchievementManager.album_meta.clear()
	AchievementManager._claimed_ledger.clear()
	AchievementManager.ensure_buckets_current()
	save_game()
