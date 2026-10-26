extends Node
## Item definitions for the grid inventory, loot tables and crafting.
## Grid cells are 1..N units; weight in kilograms; durability 0..100.

const RARITY := {
	"common": Color(0.72, 0.74, 0.72),
	"uncommon": Color(0.45, 0.78, 0.45),
	"rare": Color(0.4, 0.62, 0.95),
	"epic": Color(0.72, 0.45, 0.92),
	"quest": Color(0.95, 0.75, 0.3),
}

const CATEGORIES := ["food", "water", "medicine", "weapon", "ammo", "armor",
	"tool", "material", "electronics", "quest"]

var items: Dictionary = {}

func _ready() -> void:
	_build()

func _add(id: String, def: Dictionary) -> void:
	def["id"] = id
	for pair in [["w", 1], ["h", 1], ["weight", 0.5], ["max_stack", 1],
			["rarity", "common"], ["category", "material"],
			["description", ""], ["durability", -1]]:
		if not def.has(pair[0]):
			def[pair[0]] = pair[1]
	items[id] = def

func _build() -> void:
	# --- food & water
	_add("canned_food", {"name": "Canned Rations", "category": "food", "w": 1, "h": 1,
		"weight": 0.4, "max_stack": 8, "nutrition": 35, "description": "Dented tin. Still edible, barely."})
	_add("dry_biscuits", {"name": "Dry Biscuits", "category": "food", "w": 1, "h": 1,
		"weight": 0.15, "max_stack": 12, "nutrition": 15})
	_add("mre_pack", {"name": "Military MRE", "category": "food", "w": 2, "h": 1,
		"weight": 0.7, "max_stack": 4, "nutrition": 70, "rarity": "uncommon"})
	_add("mutant_meat", {"name": "Mutant Meat", "category": "food", "w": 1, "h": 1,
		"weight": 0.6, "max_stack": 6, "nutrition": 45, "infection_risk": 12,
		"description": "Cook it. Probably."})
	_add("cooked_meat", {"name": "Cooked Meat", "category": "food", "w": 1, "h": 1,
		"weight": 0.5, "max_stack": 6, "nutrition": 55})
	_add("water_bottle", {"name": "Water Bottle", "category": "water", "w": 1, "h": 2,
		"weight": 0.6, "max_stack": 6, "hydration": 45})
	_add("purified_water", {"name": "Purified Water", "category": "water", "w": 1, "h": 2,
		"weight": 0.6, "max_stack": 6, "hydration": 60, "rarity": "uncommon"})
	_add("dirty_water", {"name": "Murky Water", "category": "water", "w": 1, "h": 2,
		"weight": 0.6, "max_stack": 6, "hydration": 30, "infection_risk": 20})
	# --- medicine
	_add("bandage", {"name": "Bandage", "category": "medicine", "w": 1, "h": 1,
		"weight": 0.05, "max_stack": 10, "heal": 12, "stops_bleed": true})
	_add("medkit", {"name": "Field Medkit", "category": "medicine", "w": 2, "h": 2,
		"weight": 0.8, "max_stack": 3, "heal": 60, "stops_bleed": true,
		"cures_infection": false, "rarity": "uncommon"})
	_add("antibiotics", {"name": "Antibiotics", "category": "medicine", "w": 1, "h": 1,
		"weight": 0.05, "max_stack": 5, "cures_infection": true, "rarity": "rare"})
	_add("painkillers", {"name": "Painkillers", "category": "medicine", "w": 1, "h": 1,
		"weight": 0.03, "max_stack": 8, "pain_relief": true})
	_add("splint", {"name": "Splint", "category": "medicine", "w": 2, "h": 1,
		"weight": 0.3, "max_stack": 4, "cures_fracture": true})
	_add("antirad", {"name": "Anti-Rad Injector", "category": "medicine", "w": 1, "h": 2,
		"weight": 0.12, "max_stack": 4, "rad_cleanse": 45, "rarity": "rare"})
	_add("stimulant", {"name": "Stimulant Shot", "category": "medicine", "w": 1, "h": 1,
		"weight": 0.08, "max_stack": 4, "stamina_restore": 60, "rarity": "uncommon"})
	# --- melee weapons
	_add("w_knife", {"name": "Combat Knife", "category": "weapon", "w": 1, "h": 2,
		"weight": 0.4, "damage": 22, "reach": 1.6, "swing_time": 0.35,
		"durability": 100, "weapon_class": "melee", "rarity": "common"})
	_add("w_pipe", {"name": "Reinforced Pipe", "category": "weapon", "w": 1, "h": 3,
		"weight": 2.2, "damage": 34, "reach": 2.0, "swing_time": 0.55,
		"durability": 90, "weapon_class": "melee"})
	_add("w_axe", {"name": "Fire Axe", "category": "weapon", "w": 1, "h": 3,
		"weight": 2.8, "damage": 52, "reach": 2.1, "swing_time": 0.7,
		"durability": 120, "weapon_class": "melee", "rarity": "uncommon"})
	_add("w_machete", {"name": "Machete", "category": "weapon", "w": 1, "h": 3,
		"weight": 1.1, "damage": 40, "reach": 1.9, "swing_time": 0.42,
		"durability": 110, "weapon_class": "melee", "rarity": "uncommon"})
	# --- firearms
	_add("w_pistol", {"name": "M9 Sidearm", "category": "weapon", "w": 2, "h": 1,
		"weight": 1.0, "damage": 28, "mag_size": 12, "fire_rate": 0.18,
		"reload_time": 1.3, "spread": 0.02, "recoil": 0.03, "range": 60.0,
		"ammo_type": "ammo_9mm", "durability": 140, "weapon_class": "pistol",
		"rarity": "uncommon"})
	_add("w_shotgun", {"name": "Pump Shotgun", "category": "weapon", "w": 3, "h": 1,
		"weight": 3.4, "damage": 18, "pellets": 7, "mag_size": 6,
		"fire_rate": 0.85, "reload_time": 2.4, "spread": 0.09, "recoil": 0.09,
		"range": 22.0, "ammo_type": "ammo_shells", "durability": 120,
		"weapon_class": "shotgun", "rarity": "rare"})
	_add("w_rifle", {"name": "Assault Rifle", "category": "weapon", "w": 3, "h": 1,
		"weight": 3.9, "damage": 34, "mag_size": 30, "fire_rate": 0.1,
		"reload_time": 2.0, "spread": 0.015, "recoil": 0.018, "range": 120.0,
		"ammo_type": "ammo_rifle", "durability": 180, "weapon_class": "rifle",
		"rarity": "epic"})
	_add("w_crossbow", {"name": "Hunting Crossbow", "category": "weapon", "w": 3, "h": 1,
		"weight": 2.6, "damage": 65, "mag_size": 1, "fire_rate": 1.1,
		"reload_time": 1.6, "spread": 0.005, "recoil": 0.01, "range": 70.0,
		"ammo_type": "ammo_bolts", "durability": 130, "weapon_class": "crossbow",
		"silent": true, "rarity": "rare"})
	# --- ammo
	_add("ammo_9mm", {"name": "9mm Rounds", "category": "ammo", "w": 1, "h": 1,
		"weight": 0.02, "max_stack": 60})
	_add("ammo_shells", {"name": "12ga Shells", "category": "ammo", "w": 1, "h": 1,
		"weight": 0.05, "max_stack": 30})
	_add("ammo_rifle", {"name": "Rifle Rounds", "category": "ammo", "w": 1, "h": 1,
		"weight": 0.03, "max_stack": 90})
	_add("ammo_bolts", {"name": "Crossbow Bolts", "category": "ammo", "w": 2, "h": 1,
		"weight": 0.08, "max_stack": 20})
	# --- armor / tools
	_add("armor_vest", {"name": "Reinforced Vest", "category": "armor", "w": 2, "h": 2,
		"weight": 3.2, "armor": 0.25, "durability": 200, "rarity": "uncommon"})
	_add("armor_military", {"name": "Military Plate Carrier", "category": "armor",
		"w": 2, "h": 2, "weight": 5.5, "armor": 0.45, "durability": 300,
		"rarity": "epic"})
	_add("flashlight", {"name": "Damaged Flashlight", "category": "tool", "w": 1, "h": 2,
		"weight": 0.4, "battery": 100.0, "description": "Your first companion in the dark."})
	_add("battery", {"name": "Battery", "category": "tool", "w": 1, "h": 1,
		"weight": 0.1, "max_stack": 6, "charge": 40.0})
	_add("radio", {"name": "Old Radio", "category": "tool", "w": 2, "h": 1,
		"weight": 0.8, "quest_relevant": true})
	_add("backpack", {"name": "Survivor Backpack", "category": "tool", "w": 2, "h": 2,
		"weight": 1.2, "carry_bonus": 12.0, "rarity": "uncommon"})
	_add("lockpick", {"name": "Lockpick Set", "category": "tool", "w": 1, "h": 1,
		"weight": 0.05, "max_stack": 5})
	_add("repair_kit", {"name": "Weapon Repair Kit", "category": "tool", "w": 2, "h": 1,
		"weight": 0.6, "max_stack": 3, "repair": 45.0})
	# --- materials / electronics
	for entry in [
		["scrap_metal", "Scrap Metal", 20], ["wood_planks", "Wood Planks", 20],
		["nails", "Nails", 40], ["duct_tape", "Duct Tape", 10],
		["cloth", "Cloth Scraps", 20], ["gunpowder", "Gunpowder", 20],
		["electronic_parts", "Electronic Parts", 15], ["wire", "Copper Wire", 15],
		["chemicals", "Chemical Compound", 10], ["rare_components", "Rare Components", 5]]:
		_add(entry[0], {"name": entry[1], "category": "material", "weight": 0.2,
			"max_stack": entry[2], "w": 1, "h": 1})
	_add("circuit_board", {"name": "Circuit Board", "category": "electronics",
		"w": 1, "h": 1, "weight": 0.15, "max_stack": 10, "rarity": "uncommon"})
	_add("processor", {"name": "Processor Chip", "category": "electronics", "w": 1, "h": 1,
		"weight": 0.05, "max_stack": 5, "rarity": "rare"})
	# --- quest
	_add("q_note", {"name": "Handwritten Note", "category": "quest", "w": 1, "h": 1,
		"weight": 0.02, "quest_relevant": true,
		"description": "'If anyone reads this — the signal is real. Find the bunker.'"})
	_add("q_bunker_key", {"name": "Bunker Keycard", "category": "quest", "w": 1, "h": 1,
		"weight": 0.05, "quest_relevant": true, "rarity": "rare"})
	_add("q_signal_logs", {"name": "Signal Logs", "category": "quest", "w": 1, "h": 2,
		"weight": 0.3, "quest_relevant": true, "rarity": "rare"})
	_add("q_research_docs", {"name": "Classified Research", "category": "quest",
		"w": 2, "h": 2, "weight": 0.6, "quest_relevant": true, "rarity": "epic"})
	_add("q_relic_core", {"name": "Signal Core", "category": "quest", "w": 1, "h": 1,
		"weight": 1.4, "quest_relevant": true, "rarity": "epic"})

func get_def(id: String) -> Dictionary:
	return items.get(id, {})

func display_name(id: String) -> String:
	return items.get(id, {}).get("name", id)

func rarity_color(id: String) -> Color:
	return RARITY.get(items.get(id, {}).get("rarity", "common"), Color.WHITE)
