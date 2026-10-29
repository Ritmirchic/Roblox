extends Node

const SAVE_PATH := "user://horizon_velocity_save.json"
var credits := 50000
var owned := ["aurora_gt"]
var selected := "aurora_gt"
var upgrades := {"aurora_gt": 0}
var completed_events := []
var best_times := {}
var settings := {"units": "kmh", "quality": "HIGH", "music": 0.7, "sfx": 0.8}
var discoveries := []


func _ready() -> void:
	load_game()


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	credits = int(parsed.get("credits", 50000))
	owned = parsed.get("owned", ["aurora_gt"])
	selected = str(parsed.get("selected", "aurora_gt"))
	upgrades = parsed.get("upgrades", {"aurora_gt": 0})
	completed_events = parsed.get("completed_events", [])
	best_times = parsed.get("best_times", {})
	settings = parsed.get("settings", settings)
	discoveries = parsed.get("discoveries", [])
	if owned.is_empty():
		owned = ["aurora_gt"]
	if not owned.has(selected):
		selected = owned[0]


func save_game() -> void:
	var data := {
		"credits": credits,
		"owned": owned,
		"selected": selected,
		"upgrades": upgrades,
		"completed_events": completed_events,
		"best_times": best_times,
		"settings": settings,
		"discoveries": discoveries
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(data, "\t"))


func add_credits(amount: int) -> void:
	credits += amount
	save_game()


func mark_event(event_id: String, time_seconds: float, reward: int) -> void:
	if not completed_events.has(event_id):
		completed_events.append(event_id)
	var old := float(best_times.get(event_id, 999999.0))
	best_times[event_id] = minf(old, time_seconds)
	add_credits(reward)


func own_car(car_id: String) -> bool:
	if owned.has(car_id):
		return true
	var price := 45000 if car_id == "coast_rally" else 82000
	if credits < price:
		return false
	credits -= price
	owned.append(car_id)
	selected = car_id
	save_game()
	return true
