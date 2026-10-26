extends Node
## Versioned save system with autosave, validation and corruption handling.

signal save_finished(slot: int, ok: bool)
signal load_finished(slot: int, ok: bool)

const SLOT_PREFIX := "save_slot_"
const EXT := ".sav"
var autosave_interval := 150.0
var _autosave_t := 0.0
var pending: Dictionary = {}

func take_pending() -> Dictionary:
	var p := pending
	pending = {}
	return p

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _process(delta: float) -> void:
	if GameState.phase != GameState.PHASE_PLAYING:
		return
	_autosave_t += delta
	if _autosave_t >= autosave_interval:
		_autosave_t = 0.0
		save_game(0, true)

func slot_path(slot: int) -> String:
	return "user://%s%d%s" % [SLOT_PREFIX, slot, EXT]

func has_save(slot: int) -> bool:
	return FileAccess.file_exists(slot_path(slot))

func save_game(slot: int, autosave: bool = false) -> bool:
	var payload := {
		"save_version": GameState.SAVE_VERSION,
		"timestamp": Time.get_unix_time_from_system(),
		"autosave": autosave,
		"game_state": GameState.to_save_dict(),
		"clock": WorldClock.to_save_dict(),
		"weather": Weather.to_save_dict(),
		"quests": QuestMan.to_save_dict(),
		"player": _player_payload(),
		"world": _world_payload(),
		"buildings": _buildings_payload(),
	}
	var f := FileAccess.open(slot_path(slot), FileAccess.WRITE)
	if f == null:
		push_error("Save failed: cannot open " + slot_path(slot))
		save_finished.emit(slot, false)
		return false
	f.store_string(JSON.stringify(payload, "  "))
	f.close()
	save_finished.emit(slot, true)
	return true

func load_game(slot: int) -> Variant:
	if not has_save(slot):
		load_finished.emit(slot, false)
		return false
	var f := FileAccess.open(slot_path(slot), FileAccess.READ)
	var text := f.get_as_text()
	f.close()
	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Save corrupted: invalid JSON in slot %d" % slot)
		_backup_corrupt(slot)
		load_finished.emit(slot, false)
		return false
	if not parsed.has("save_version"):
		push_error("Save corrupted: missing version")
		_backup_corrupt(slot)
		load_finished.emit(slot, false)
		return false
	# Migration hook for future versions.
	parsed = _migrate(parsed)
	GameState.from_save_dict(parsed.get("game_state", {}))
	WorldClock.from_save_dict(parsed.get("clock", {}))
	Weather.from_save_dict(parsed.get("weather", {}))
	QuestMan.from_save_dict(parsed.get("quests", {}))
	pending = parsed
	load_finished.emit(slot, true)
	return parsed

func _migrate(d: Dictionary) -> Dictionary:
	var v := int(d.get("save_version", 1))
	while v < GameState.SAVE_VERSION:
		match v:
			# Future migrations land here, e.g.:
			# 1: d = _migrate_1_to_2(d)
			_:
				push_warning("Unknown migration step %d; loading best-effort" % v)
		v += 1
	return d

func _backup_corrupt(slot: int) -> void:
	var src := slot_path(slot)
	var dst := src + ".corrupt"
	var f := FileAccess.open(src, FileAccess.READ)
	var data := f.get_buffer(f.get_length())
	f.close()
	var g := FileAccess.open(dst, FileAccess.WRITE)
	g.store_buffer(data)
	g.close()

func list_slots() -> Array:
	var out := []
	for i in range(5):
		if has_save(i):
			var f := FileAccess.open(slot_path(i), FileAccess.READ)
			var d = JSON.parse_string(f.get_as_text())
			f.close()
			if typeof(d) == TYPE_DICTIONARY:
				out.append({"slot": i,
					"timestamp": d.get("timestamp", 0),
					"level": d.get("game_state", {}).get("level", 1),
					"day": d.get("clock", {}).get("day_index", 1)})
	return out

func delete_save(slot: int) -> void:
	DirAccess.remove_absolute(ProjectSettings.globalize_path(slot_path(slot)))

func _player_payload() -> Dictionary:
	var p = GameState.player
	if p == null or not is_instance_valid(p):
		return {}
	return p.to_save_dict()

func _world_payload() -> Dictionary:
	var w := get_tree().get_first_node_in_group("world")
	return w.to_save_dict() if w and w.has_method("to_save_dict") else {}

func _buildings_payload() -> Dictionary:
	var w := get_tree().get_first_node_in_group("world")
	return w.get_buildings_payload() if w and w.has_method("get_buildings_payload") else {}
