extends Node
## Data-driven quest catalog. Objective types:
## reach | kill | kill_type | collect | talk | craft | build | investigate | equip

var quests: Dictionary = {}

func _ready() -> void:
	_build_main()
	_build_side()

func _q(id: String, def: Dictionary) -> void:
	def["id"] = id
	for pair in [["act", 0], ["side", false], ["objectives", []],
			["rewards", {"xp": 100}], ["prereq_quests", []],
			["prereq_flags", []], ["start_flags", []],
			["complete_flags", []], ["giver", ""]]:
		if not def.has(pair[0]):
			def[pair[0]] = pair[1]
	quests[id] = def

func _build_main() -> void:
	# ACT 1 — AWAKENING
	_q("m01_awaken", {
		"act": 1, "giver": "note", "title": "Last Breath",
		"description": "Read the handwritten note, find your gear and leave the shelter.",
		"objectives": [
			{"type": "investigate", "target": "shelter_note", "label": "Read the handwritten note"},
			{"type": "collect", "target": "flashlight", "amount": 1, "label": "Take the damaged flashlight"},
			{"type": "reach", "target": "shelter_exit", "label": "Exit into the Dead Suburbs"}],
		"rewards": {"xp": 150, "items": {"bandage": 2}},
		"complete_flags": ["shelter_left"]})
	_q("m02_first_light", {
		"act": 1, "giver": "radio", "title": "Static and Signal",
		"description": "The old radio picked up a repeating frequency. Reach high ground to triangulate it.",
		"prereq_quests": ["m01_awaken"],
		"objectives": [
			{"type": "reach", "target": "suburbs_rooftop", "label": "Climb the supermarket rooftop"},
			{"type": "investigate", "target": "rooftop_antenna", "label": "Tune the rooftop antenna"}],
		"rewards": {"xp": 220, "items": {"battery": 2}},
		"complete_flags": ["signal_triangulated"]})
	# ACT 2 — DEAD SUBURBS
	_q("m03_neighbors", {
		"act": 2, "giver": "vera", "title": "Neighbors in the Dark",
		"description": "Vera's camp needs medicine. Search the abandoned houses.",
		"prereq_quests": ["m02_first_light"],
		"objectives": [
			{"type": "collect", "target": "bandage", "amount": 3, "label": "Gather bandages (0/3)"},
			{"type": "talk", "target": "vera", "label": "Bring the supplies to Vera"}],
		"rewards": {"xp": 260, "items": {"water_bottle": 2}}})
	_q("m04_hollow_nest", {
		"act": 2, "giver": "vera", "title": "Something in the Basement",
		"description": "Hollows have nested under the old house on Oak Street. Clear it.",
		"prereq_quests": ["m03_neighbors"],
		"objectives": [
			{"type": "kill_type", "target": "hollow", "amount": 5, "label": "Eliminate Hollows (0/5)"},
			{"type": "investigate", "target": "basement_chest", "label": "Search the nest"}],
		"rewards": {"xp": 340, "items": {"w_pistol": 1, "ammo_9mm": 24}},
		"complete_flags": ["suburbs_safe"]})
	_q("m05_king_below", {
		"act": 2, "giver": "vera", "title": "The Hollow King",
		"description": "The nest answers to something older. End it.",
		"prereq_quests": ["m04_hollow_nest"],
		"objectives": [
			{"type": "reach", "target": "king_arena", "label": "Enter the sunken cul-de-sac"},
			{"type": "kill", "target": "boss_hollow_king", "amount": 1, "label": "Defeat the Hollow King"}],
		"rewards": {"xp": 900, "items": {"q_bunker_key": 1, "antibiotics": 1}},
		"complete_flags": ["king_dead", "act2_done"]})
	# ACT 3 — BLACKWOOD FOREST
	_q("m06_forest_path", {
		"act": 3, "giver": "petrovich", "title": "The Blackwood Trail",
		"description": "A hunter beyond the forest wall knows the signal's direction.",
		"prereq_quests": ["m05_king_below"],
		"objectives": [
			{"type": "reach", "target": "forest_camp", "label": "Find Petrovich's camp"},
			{"type": "talk", "target": "petrovich", "label": "Speak with Petrovich"}],
		"rewards": {"xp": 320}, "start_flags": ["act3_reached"]})
	_q("m07_crawlers", {
		"act": 3, "giver": "petrovich", "title": "Things That Crawl",
		"description": "Crawlers are using the cave tunnels to flank the trail. Collapse the nests.",
		"prereq_quests": ["m06_forest_path"],
		"objectives": [
			{"type": "kill_type", "target": "crawler", "amount": 6, "label": "Hunt Crawlers (0/6)"},
			{"type": "investigate", "target": "cave_mouth", "label": "Mark the cave mouth"}],
		"rewards": {"xp": 420, "items": {"w_crossbow": 1, "ammo_bolts": 8}}})
	_q("m08_matriarch", {
		"act": 3, "giver": "petrovich", "title": "Roots of the Forest",
		"description": "The forest itself seems to grow around a single creature.",
		"prereq_quests": ["m07_crawlers"],
		"objectives": [
			{"type": "reach", "target": "matriarch_arena", "label": "Enter the foggy valley"},
			{"type": "kill", "target": "boss_forest_matriarch", "amount": 1,
				"label": "Kill the Forest Matriarch"}],
		"rewards": {"xp": 1000, "items": {"processor": 1}},
		"complete_flags": ["matriarch_dead", "act3_done"]})
	# ACT 4 — INDUSTRIAL ZONE
	_q("m09_factory_power", {
		"act": 4, "giver": "petrovich", "title": "Current Affairs",
		"description": "Restore the factory grid to power the gate toward the city.",
		"prereq_quests": ["m08_matriarch"],
		"objectives": [
			{"type": "craft", "target": "electrical_repair", "amount": 1,
				"label": "Craft an electrical repair kit"},
			{"type": "investigate", "target": "factory_generator", "label": "Restart the generator"}],
		"rewards": {"xp": 480}, "start_flags": ["act4_reached"]})
	_q("m10_iron_abomination", {
		"act": 4, "giver": "petrovich", "title": "Iron and Flesh",
		"description": "A war machine fused with something alive guards the cooling towers.",
		"prereq_quests": ["m09_factory_power"],
		"objectives": [
			{"type": "reach", "target": "iron_arena", "label": "Enter the cooling tower yard"},
			{"type": "kill", "target": "boss_iron_abomination", "amount": 1,
				"label": "Destroy the Iron Abomination"}],
		"rewards": {"xp": 1100, "items": {"w_rifle": 1, "ammo_rifle": 45}},
		"complete_flags": ["iron_dead", "act4_done"]})
	# ACT 5 — FORGOTTEN CITY
	_q("m11_city_hospital", {
		"act": 5, "giver": "dr_lesnik", "title": "Ward of Silence",
		"description": "The city hospital still holds antibiotics — and worse.",
		"prereq_quests": ["m10_iron_abomination"],
		"objectives": [
			{"type": "reach", "target": "hospital", "label": "Reach the city hospital"},
			{"type": "collect", "target": "antibiotics", "amount": 2, "label": "Recover antibiotics (0/2)"},
			{"type": "talk", "target": "dr_lesnik", "label": "Deliver them to Dr. Lesnik"}],
		"rewards": {"xp": 600, "items": {"medkit": 2}}, "start_flags": ["act5_reached"]})
	_q("m12_screamers", {
		"act": 5, "giver": "dr_lesnik", "title": "The Alarm",
		"description": "Screamers keep drawing packs to the hospital. Silence them before dusk.",
		"prereq_quests": ["m11_city_hospital"],
		"objectives": [
			{"type": "kill_type", "target": "screamer", "amount": 4, "label": "Silence Screamers (0/4)"},
			{"type": "kill_type", "target": "stalker", "amount": 2, "label": "Kill Stalkers (0/2)"}],
		"rewards": {"xp": 700, "items": {"antirad": 2}}})
	_q("m13_subway_keys", {
		"act": 5, "giver": "dr_lesnik", "title": "The Long Way Down",
		"description": "The exclusion perimeter is sealed. The old subway is the only path.",
		"prereq_quests": ["m12_screamers"],
		"objectives": [
			{"type": "collect", "target": "q_bunker_key", "amount": 1, "label": "Use the keycard"},
			{"type": "reach", "target": "subway_tunnel", "label": "Enter the subway tunnels"}],
		"rewards": {"xp": 750}, "complete_flags": ["act5_done"]})
	# ACT 6 — EXCLUSION ZONE
	_q("m14_bunker_docs", {
		"act": 6, "giver": "terminal", "title": "Black Files",
		"description": "Search the military bunker for Project LAST SIGNAL documents.",
		"prereq_quests": ["m13_subway_keys"],
		"objectives": [
			{"type": "reach", "target": "bunker_lab", "label": "Reach the sealed laboratory"},
			{"type": "collect", "target": "q_research_docs", "amount": 1,
				"label": "Retrieve classified research"},
			{"type": "collect", "target": "q_signal_logs", "amount": 1,
				"label": "Recover the signal logs"}],
		"rewards": {"xp": 900, "items": {"armor_military": 1}},
		"start_flags": ["act6_reached"]})
	_q("m15_contaminated", {
		"act": 6, "giver": "terminal", "title": "Walking Contamination",
		"description": "The lab's failures wander the corridors. Put them down.",
		"prereq_quests": ["m14_bunker_docs"],
		"objectives": [
			{"type": "kill_type", "target": "contaminated", "amount": 6,
				"label": "Eliminate Contaminated (0/6)"},
			{"type": "kill_type", "target": "brute", "amount": 2, "label": "Kill Brutes (0/2)"}],
		"rewards": {"xp": 950, "items": {"antirad": 3}}})
	# ACT 7 — RED WASTELAND
	_q("m16_red_waste", {
		"act": 7, "giver": "terminal", "title": "The Red Horizon",
		"description": "Cross the irradiated wasteland toward the signal's origin.",
		"prereq_quests": ["m15_contaminated"],
		"objectives": [
			{"type": "reach", "target": "wasteland_crater", "label": "Reach the great crater"},
			{"type": "kill_type", "target": "pale_one", "amount": 3,
				"label": "Survive the Pale Ones (0/3)"}],
		"rewards": {"xp": 1100}, "start_flags": ["act7_reached"]})
	# ACT 8 — LAST SIGNAL
	_q("m17_final", {
		"act": 8, "giver": "terminal", "title": "The Last Signal",
		"description": "At the crater's heart stands the source. Decide who hears the final broadcast.",
		"prereq_quests": ["m16_red_waste"],
		"objectives": [
			{"type": "reach", "target": "signal_tower", "label": "Enter the signal tower"},
			{"type": "kill", "target": "boss_last_signal", "amount": 1,
				"label": "Confront the source of the signal"},
			{"type": "investigate", "target": "signal_console", "label": "Make the final broadcast"}],
		"rewards": {"xp": 2000, "items": {"q_relic_core": 1}},
		"complete_flags": ["game_complete", "act8_done"]})

func _build_side(self_: bool = false) -> void:
	_q("s01_lost_supplies", {"side": true, "giver": "vera",
		"title": "Lost Supplies", "description": "Vera's supply crate fell from the overpass.",
		"objectives": [{"type": "reach", "target": "overpass_cache",
			"label": "Find the fallen crate"}],
		"rewards": {"xp": 180, "items": {"mre_pack": 2, "water_bottle": 1}}})
	_q("s02_radio_parts", {"side": true, "giver": "petrovich",
		"title": "Dead Air", "description": "Gather electronics to repair Petrovich's transmitter.",
		"objectives": [{"type": "collect", "target": "electronic_parts", "amount": 5,
			"label": "Electronic parts (0/5)"}],
		"rewards": {"xp": 240, "items": {"battery": 3}}})
	_q("s03_hunter_prey", {"side": true, "giver": "petrovich",
		"title": "Hunter and Prey", "description": "Thin the Watcher population on the ridges.",
		"objectives": [{"type": "kill_type", "target": "watcher", "amount": 4,
			"label": "Kill Watchers (0/4)"}],
		"rewards": {"xp": 300, "items": {"ammo_bolts": 6}}})
	_q("s04_shelter_repair", {"side": true, "giver": "vera",
		"title": "Four Walls", "description": "Build basic defenses for the survivor camp.",
		"objectives": [{"type": "build", "target": "wall", "amount": 4,
			"label": "Build defensive walls (0/4)"},
			{"type": "build", "target": "campfire", "amount": 1, "label": "Build a campfire"}],
		"rewards": {"xp": 320, "items": {"wood_planks": 8}}})
	_q("s05_blacksmith", {"side": true, "giver": "petrovich",
		"title": "Workshop Ethics", "description": "Prove you can keep gear alive in the field.",
		"objectives": [{"type": "craft", "target": "repair_kit", "amount": 2,
			"label": "Craft repair kits (0/2)"}],
		"rewards": {"xp": 260, "items": {"scrap_metal": 6}}})
	_q("s06_mimic_tears", {"side": true, "giver": "dr_lesnik",
		"title": "Familiar Voices", "description": "Mimics repeat the voices of the lost. Find and kill them.",
		"objectives": [{"type": "kill_type", "target": "mimic", "amount": 3,
			"label": "Kill Mimics (0/3)"}],
		"rewards": {"xp": 380, "items": {"painkillers": 3}}})
	_q("s07_burrowed", {"side": true, "giver": "petrovich",
		"title": "Ground Shakes", "description": "Burrowers undermine the forest trails. Clear their tunnels.",
		"objectives": [{"type": "kill_type", "target": "burrower", "amount": 4,
			"label": "Kill Burrowers (0/4)"}],
		"rewards": {"xp": 400, "items": {"ammo_shells": 8}}})
	_q("s08_pharmacy_run", {"side": true, "giver": "dr_lesnik",
		"title": "Pharmacy Run", "description": "The supermarket pharmacy was locked when the city fell.",
		"objectives": [{"type": "reach", "target": "supermarket_pharmacy",
			"label": "Breach the pharmacy"},
			{"type": "collect", "target": "painkillers", "amount": 3,
				"label": "Recover painkillers (0/3)"}],
		"rewards": {"xp": 340, "items": {"medkit": 1}}})
	_q("s09_armory", {"side": true, "giver": "terminal",
		"title": "Quartermaster's Legacy", "description": "A sealed checkpoint armory waits behind a lock.",
		"objectives": [{"type": "collect", "target": "lockpick", "amount": 1,
			"label": "Bring a lockpick"},
			{"type": "investigate", "target": "checkpoint_armory", "label": "Open the armory"}],
		"rewards": {"xp": 420, "items": {"w_shotgun": 1, "ammo_shells": 12}}})
	_q("s10_rad_cook", {"side": true, "giver": "dr_lesnik",
		"title": "Clean Diet", "description": "Cook mutant meat over a campfire to neutralize parasites.",
		"objectives": [{"type": "craft", "target": "cooked_meat", "amount": 3,
			"label": "Cook meat (0/3)"}],
		"rewards": {"xp": 220, "items": {"cooked_meat": 2}}})
	_q("s11_graveyard", {"side": true, "giver": "vera",
		"title": "Names on Stones", "description": "Mark the graves of Vera's old crew in the suburbs.",
		"objectives": [{"type": "reach", "target": "graveyard_memorial",
			"label": "Find the graveyard memorial"}],
		"rewards": {"xp": 200}})
	_q("s12_tower_watch", {"side": true, "giver": "petrovich",
		"title": "Eyes On The Wasteland", "description": "Climb three watchtowers and log what you see.",
		"objectives": [{"type": "investigate", "target": "watchtower_log",
			"amount": 3, "label": "Watchtower logs (0/3)"}],
		"rewards": {"xp": 460, "items": {"ammo_rifle": 20}}})
	_q("s13_data_recovery", {"side": true, "giver": "terminal",
		"title": "Data Recovery", "description": "Recover processor chips from dead terminals in the city.",
		"objectives": [{"type": "collect", "target": "processor", "amount": 2,
			"label": "Processor chips (0/2)"}],
		"rewards": {"xp": 520, "items": {"circuit_board": 2}}})
	_q("s14_pale_hunt", {"side": true, "giver": "terminal",
		"title": "Pale Hunt", "description": "The rare Pale Ones only hunt at night. Bring proof.",
		"objectives": [{"type": "kill_type", "target": "pale_one", "amount": 2,
			"label": "Kill Pale Ones (0/2)"}],
		"rewards": {"xp": 600, "items": {"antirad": 2, "stimulant": 1}}})

func get_quest(id: String) -> Dictionary:
	return quests.get(id, {})
