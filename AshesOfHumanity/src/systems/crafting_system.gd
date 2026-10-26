extends RefCounted
class_name CraftingSystem
## Hand-crafted and workbench recipes. Station requirement gates advanced
## gear; all costs, yields and times are real and enforced.

const RECIPES := [
	# Survival basics
	{"id": "r_bandage", "out": "bandage", "qty": 2, "time": 2.0,
		"station": "", "cost": {"cloth": 2}},
	{"id": "r_splint", "out": "splint", "qty": 1, "time": 3.0,
		"station": "", "cost": {"wood_planks": 2, "cloth": 1}},
	{"id": "r_purified_water", "out": "purified_water", "qty": 1, "time": 4.0,
		"station": "campfire", "cost": {"dirty_water": 1, "wood_planks": 1}},
	{"id": "r_cooked_meat", "out": "cooked_meat", "qty": 1, "time": 5.0,
		"station": "campfire", "cost": {"raw_meat": 1, "wood_planks": 1}},
	{"id": "r_antibiotics", "out": "antibiotics", "qty": 1, "time": 8.0,
		"station": "workbench", "cost": {"chemicals": 2, "alcohol": 1}},
	{"id": "r_medkit", "out": "medkit", "qty": 1, "time": 8.0,
		"station": "workbench",
		"cost": {"bandage": 2, "alcohol": 1, "chemicals": 1}},
	# Ammunition
	{"id": "r_ammo_9mm", "out": "ammo_9mm", "qty": 12, "time": 5.0,
		"station": "workbench", "cost": {"gunpowder": 1, "scrap_metal": 2}},
	{"id": "r_ammo_12g", "out": "ammo_shells", "qty": 6, "time": 5.0,
		"station": "workbench", "cost": {"gunpowder": 2, "scrap_metal": 2}},
	{"id": "r_ammo_rifle", "out": "ammo_rifle", "qty": 10, "time": 6.0,
		"station": "workbench", "cost": {"gunpowder": 2, "scrap_metal": 3}},
	{"id": "r_crossbow_bolts", "out": "ammo_bolts", "qty": 8, "time": 4.0,
		"station": "workbench", "cost": {"wood_planks": 2, "scrap_metal": 1}},
	# Weapons
	{"id": "r_w_pipe", "out": "w_pipe", "qty": 1, "time": 6.0,
		"station": "workbench", "cost": {"scrap_metal": 4, "wood_planks": 1}},
	{"id": "r_w_axe", "out": "w_axe", "qty": 1, "time": 8.0,
		"station": "workbench", "cost": {"scrap_metal": 5, "wood_planks": 2}},
	{"id": "r_w_machete", "out": "w_machete", "qty": 1, "time": 10.0,
		"station": "workbench", "cost": {"scrap_metal": 6, "leather": 1}},
	{"id": "r_w_crossbow", "out": "w_crossbow", "qty": 1, "time": 14.0,
		"station": "workbench", "cost": {"wood_planks": 6, "scrap_metal": 4, "cloth": 2}},
	# Armor and utility
	{"id": "r_armor_vest", "out": "armor_vest", "qty": 1, "time": 12.0,
		"station": "workbench", "cost": {"scrap_metal": 6, "leather": 3, "cloth": 4}},
	{"id": "r_armor_military", "out": "armor_military", "qty": 1, "time": 18.0,
		"station": "workbench",
		"cost": {"scrap_metal": 10, "kevlar": 2, "leather": 2}},
	{"id": "r_battery", "out": "battery", "qty": 1, "time": 6.0,
		"station": "workbench", "cost": {"electronic_parts": 2, "scrap_metal": 2}},
	{"id": "r_lockpick", "out": "lockpick", "qty": 2, "time": 4.0,
		"station": "", "cost": {"scrap_metal": 2}},
]

static func recipes_for_station(station: String) -> Array:
	var out := []
	for r in RECIPES:
		if r.station == station:
			out.append(r)
	return out

static func adjusted_cost(recipe: Dictionary) -> Dictionary:
	var cost: Dictionary = {}
	var discount := GameState.has_skill("t1")
	for id in recipe.cost:
		var amount := int(recipe.cost[id])
		if discount:
			amount = maxi(1, amount - 1)
		cost[id] = amount
	return cost

static func can_craft(recipe: Dictionary, player: Node) -> bool:
	return player.inventory.has_items(adjusted_cost(recipe))

static func craft(recipe: Dictionary, player: Node) -> bool:
	var cost := adjusted_cost(recipe)
	if not player.inventory.consume(cost):
		return false
	var qty := int(recipe.qty)
	if ItemDB.get_def(recipe.out).category == "ammo" \
			and GameState.has_skill("t3"):
		qty = int(round(qty * 1.5))
	player.inventory_add(recipe.out, qty)
	GameState.stats.crafts += 1
	GameState.gain_xp(12 + int(recipe.time) * 2)
	QuestMan.notify_event("craft", recipe.out)
	AudioMan.play_2d("craft", -4.0)
	return true
