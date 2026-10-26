extends RefCounted
class_name SkillSystem
## Three grounded skill trees (Combat, Survival, Crafting). Every perk has a
## real numeric effect consumed by combat, vitals, crafting or building.

const TREES := {
	"Combat": [
		{"id": "c1", "name": "Steady Hands", "desc": "-20% firearm spread",
			"req": ""},
		{"id": "c2", "name": "Heavy Strikes", "desc": "+20% melee damage",
			"req": "c1"},
		{"id": "c3", "name": "Fast Reload", "desc": "-30% reload time",
			"req": "c1"},
		{"id": "c4", "name": "Head Hunter", "desc": "+15% weak-point damage",
			"req": "c2"},
		{"id": "c5", "name": "Combat Reflexes", "desc": "Sprint costs 25% less stamina",
			"req": "c3"},
		{"id": "c6", "name": "Executioner", "desc": "+25% damage below 30% target HP",
			"req": "c4"},
	],
	"Survival": [
		{"id": "v1", "name": "Forager", "desc": "Hunger drains 20% slower",
			"req": ""},
		{"id": "v2", "name": "Water Finder", "desc": "Thirst drains 20% slower",
			"req": ""},
		{"id": "v3", "name": "Hardened Body", "desc": "-15% damage taken",
			"req": "v1"},
		{"id": "v4", "name": "Iron Stomach", "desc": "Infection risk halved",
			"req": "v2"},
		{"id": "v5", "name": "Night Eyes", "desc": "+40% night vision brightness",
			"req": "v1"},
		{"id": "v6", "name": "Lead Lungs", "desc": "Radiation accumulates 40% slower",
			"req": "v3"},
	],
	"Crafting": [
		{"id": "t1", "name": "Scrap Saver", "desc": "-1 ingredient on recipes (min 1)",
			"req": ""},
		{"id": "t2", "name": "Field Mechanic", "desc": "Craft 35% faster",
			"req": "t1"},
		{"id": "t3", "name": "Hand Loader", "desc": "Ammo yields +50%",
			"req": "t1"},
		{"id": "t4", "name": "Master Smith", "desc": "Crafted weapons start at 100% durability",
			"req": "t2"},
		{"id": "t5", "name": "Fortify", "desc": "Buildings cost 20% fewer materials",
			"req": "t2"},
		{"id": "t6", "name": "Engineer", "desc": "Unlocks turret and radio tower builds",
			"req": "t5"},
	],
}

static func has(id: String) -> bool:
	return GameState.has_skill(id)

static func damage_mult(kind: String) -> float:
	var m := 1.0
	if kind == "melee" and has("c2"):
		m *= 1.2
	return m

static func spread_mult() -> float:
	return 0.8 if has("c1") else 1.0

static func reload_mult() -> float:
	return 0.7 if has("c3") else 1.0

static func damage_taken_mult() -> float:
	return 0.85 if has("v3") else 1.0

static func hunger_mult() -> float:
	return 0.8 if has("v1") else 1.0

static func thirst_mult() -> float:
	return 0.8 if has("v2") else 1.0

static func infection_mult() -> float:
	return 0.5 if has("v4") else 1.0

static func radiation_mult() -> float:
	return 0.6 if has("v6") else 1.0

static func stamina_cost_mult() -> float:
	return 0.75 if has("c5") else 1.0

static func build_cost_mult() -> float:
	return 0.8 if has("t5") else 1.0

static func craft_time_mult() -> float:
	return 0.65 if has("t2") else 1.0

static func can_build_advanced() -> bool:
	return has("t6")

static func unlock(skill_id: String) -> bool:
	return GameState.unlock_skill(skill_id, 1)

static func tree_list() -> Array:
	return TREES.keys()
