extends RefCounted
class_name LootSystem
## Location-based loot tables with rarity weighting. Duplication exploits are
## prevented by GameState.looted_containers; every container rolls once.

const TABLES := {
	"house": [
		{"id": "canned_food", "w": 10, "min": 1, "max": 2},
		{"id": "dry_biscuits", "w": 9, "min": 1, "max": 2},
		{"id": "water_bottle", "w": 9, "min": 1, "max": 1},
		{"id": "bandage", "w": 8, "min": 1, "max": 2},
		{"id": "battery", "w": 5, "min": 1, "max": 1},
		{"id": "cloth", "w": 7, "min": 1, "max": 3},
		{"id": "w_pipe", "w": 3, "min": 1, "max": 1},
		{"id": "lockpick", "w": 2, "min": 1, "max": 1},
	],
	"supermarket": [
		{"id": "canned_food", "w": 12, "min": 1, "max": 3},
		{"id": "dry_biscuits", "w": 12, "min": 1, "max": 3},
		{"id": "mre_pack", "w": 4, "min": 1, "max": 1},
		{"id": "water_bottle", "w": 11, "min": 1, "max": 2},
		{"id": "dirty_water", "w": 6, "min": 1, "max": 2},
		{"id": "painkillers", "w": 5, "min": 1, "max": 2},
		{"id": "duct_tape", "w": 5, "min": 1, "max": 1},
	],
	"pharmacy": [
		{"id": "bandage", "w": 12, "min": 1, "max": 3},
		{"id": "medkit", "w": 5, "min": 1, "max": 1},
		{"id": "antibiotics", "w": 3, "min": 1, "max": 1},
		{"id": "painkillers", "w": 10, "min": 1, "max": 3},
		{"id": "splint", "w": 6, "min": 1, "max": 2},
	],
	"hospital": [
		{"id": "medkit", "w": 9, "min": 1, "max": 2},
		{"id": "antibiotics", "w": 7, "min": 1, "max": 2},
		{"id": "bandage", "w": 12, "min": 2, "max": 4},
		{"id": "splint", "w": 7, "min": 1, "max": 2},
		{"id": "stimulant", "w": 4, "min": 1, "max": 1},
		{"id": "antirad", "w": 3, "min": 1, "max": 1},
	],
	"factory": [
		{"id": "scrap_metal", "w": 13, "min": 2, "max": 5},
		{"id": "nails", "w": 10, "min": 2, "max": 6},
		{"id": "wire", "w": 8, "min": 1, "max": 3},
		{"id": "chemicals", "w": 6, "min": 1, "max": 2},
		{"id": "electronic_parts", "w": 6, "min": 1, "max": 2},
		{"id": "repair_kit", "w": 4, "min": 1, "max": 1},
		{"id": "w_axe", "w": 3, "min": 1, "max": 1},
	],
	"armory": [
		{"id": "ammo_9mm", "w": 12, "min": 8, "max": 24},
		{"id": "ammo_rifle", "w": 9, "min": 10, "max": 30},
		{"id": "ammo_shells", "w": 7, "min": 4, "max": 10},
		{"id": "w_shotgun", "w": 4, "min": 1, "max": 1},
		{"id": "w_rifle", "w": 2, "min": 1, "max": 1},
		{"id": "armor_military", "w": 2, "min": 1, "max": 1},
		{"id": "kevlar", "w": 3, "min": 1, "max": 2},
	],
	"lab": [
		{"id": "circuit_board", "w": 9, "min": 1, "max": 2},
		{"id": "processor", "w": 4, "min": 1, "max": 1},
		{"id": "electronic_parts", "w": 10, "min": 2, "max": 4},
		{"id": "antirad", "w": 7, "min": 1, "max": 2},
		{"id": "q_research_docs", "w": 2, "min": 1, "max": 1},
		{"id": "q_signal_logs", "w": 2, "min": 1, "max": 1},
	],
	"cabin": [
		{"id": "wood_planks", "w": 10, "min": 2, "max": 5},
		{"id": "canned_food", "w": 7, "min": 1, "max": 2},
		{"id": "ammo_bolts", "w": 6, "min": 2, "max": 6},
		{"id": "w_machete", "w": 3, "min": 1, "max": 1},
		{"id": "cloth", "w": 8, "min": 1, "max": 3},
	],
	"bunker": [
		{"id": "ammo_rifle", "w": 10, "min": 10, "max": 25},
		{"id": "mre_pack", "w": 8, "min": 1, "max": 3},
		{"id": "purified_water", "w": 8, "min": 1, "max": 2},
		{"id": "armor_vest", "w": 4, "min": 1, "max": 1},
		{"id": "stimulant", "w": 5, "min": 1, "max": 2},
	],
	"wasteland": [
		{"id": "rare_components", "w": 8, "min": 1, "max": 2},
		{"id": "antirad", "w": 8, "min": 1, "max": 2},
		{"id": "chemicals", "w": 7, "min": 1, "max": 3},
		{"id": "ammo_rifle", "w": 6, "min": 5, "max": 15},
		{"id": "q_relic_core", "w": 1, "min": 1, "max": 1},
	],
	"supply_drop": [
		{"id": "mre_pack", "w": 10, "min": 2, "max": 4},
		{"id": "purified_water", "w": 10, "min": 2, "max": 4},
		{"id": "ammo_rifle", "w": 8, "min": 15, "max": 30},
		{"id": "medkit", "w": 7, "min": 1, "max": 2},
		{"id": "armor_vest", "w": 4, "min": 1, "max": 1},
		{"id": "processor", "w": 3, "min": 1, "max": 1},
	],
}

static func roll_table(table_id: String) -> Array:
	var entries: Array = TABLES.get(table_id, [])
	var out: Array = []
	if entries.is_empty():
		return out
	var total := 0
	for e in entries:
		total += int(e.w)
	# Each container yields 2-4 items; duplicate entries stack.
	var rolls := 2 + randi() % 3
	for _r in rolls:
		var pick: int = randi() % max(1, total)
		var acc := 0
		for e in entries:
			acc += int(e.w)
			if pick < acc:
				var count: int = int(e.min) + randi() % max(1, int(e.max) - int(e.min) + 1)
				var merged := false
				for d in out:
					if d.id == e.id:
						d.count += count
						merged = true
						break
				if not merged:
					out.append({"id": e.id, "count": count})
				break
	return out
