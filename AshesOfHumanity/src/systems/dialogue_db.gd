extends RefCounted
class_name DialogueDB
## Branching dialogue trees for the settlement NPCs. Nodes reference options,
## quest events and shop ids; no choices are cosmetic — every branch sets a
## story flag, starts/completes a quest or opens a service.

const TREES := {
	"elena": {
		"name": "Dr. Elena Vasquez",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "You're awake. Good. Three days unconscious and I was starting to ration your bed. The world ended while you slept — radiation, famine, then the Things. I keep this shelter's people breathing. You look like you can help.",
				"options": [
					{"text": "What do you need?", "next": "need"},
					{"text": "Who are the people here?", "next": "people"},
					{"text": "What can you tell me about the signal?", "next": "signal",
						"requires_flag": "signal_triangulated"},
					{"text": "I need medical supplies.", "next": "heal"},
				],
			},
			"need": {
				"text": "Our supply cache near the old suburb was overrun. Recover what you can — bandages, antiseptic, anything sealed. And watch the hollows: they hear gunfire for blocks.",
				"options": [
					{"text": "I'll find the cache.", "next": "intro",
						"event": {"accept": "s01_lost_supplies"}},
					{"text": "Hollows?", "next": "mutants"},
					{"text": "[Leave]", "next": ""},
				],
			},
			"people": {
				"text": "Boris trades scavenged gear and remembers every price since before the bombs. Mara runs our radio — she's the one who dragged you in. Kovac thinks walls solve everything. He's not wrong.",
				"options": [
					{"text": "Thanks.", "next": "intro"}],
			},
			"signal": {
				"text": "A repeating military transmission on old emergency bands. Coordinates in the exclusion zone. It started three weeks ago — nothing human should be broadcasting from there. Mara has the frequencies.",
				"options": [
					{"text": "I'll look into it.", "next": "intro"},
					{"text": "[Leave]", "next": ""}],
			},
			"heal": {
				"text": "I can clean wounds and set bones, but antibiotics are for people who earn them. Bring medical supplies back and we'll both be healthier.",
				"options": [
					{"text": "[Leave]", "next": ""},
					{"text": "I'll find the cache first.", "next": "need",
						"event": {"accept": "s01_lost_supplies"}}],
			},
			"mutants": {
				"text": "Hollows were people once — radiation hollowed them out. They hunt by sound mostly. The pale ones are worse. Aim for the head, and don't let the screamers call their pack.",
				"options": [
					{"text": "Understood.", "next": "intro"}],
			},
		},
	},
	"boris": {
		"name": "Boris 'The Bear' Volkov",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "Hah. Fresh face. In my grandfather's day a man with nothing to trade got nothing. These days? Same. But I like survivors who bring salvage. Look at my wares.",
				"options": [
					{"text": "Open trade.", "next": "intro",
						"event": {"shop": "boris"}},
					{"text": "Any work for me?", "next": "work"},
					{"text": "Where do you get this stuff?", "next": "origin"},
					{"text": "[Leave]", "next": ""}],
			},
			"work": {
				"text": "The factory district still holds sealed crates — electronics, gunpowder, the good scrap. Bring me factory parts and I pay in ammunition. Real bullets, not wishes.",
				"options": [
					{"text": "I'll check the factory.", "next": "intro",
						"event": {"accept": "s13_data_recovery"}},
					{"text": "[Leave]", "next": ""}],
			},
			"origin": {
				"text": "I walk where others run. Every ruin is a shop with no shopkeeper. Rules of trade still apply: don't get bitten, don't get cheated, always count the bullets twice.",
				"options": [
					{"text": "Wise words.", "next": "intro"}],
			},
		},
	},
	"mara": {
		"name": "Mara Okafor, Radio Operator",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "Static, mostly. Then — listen — that pattern. Every ninety minutes, on the old NATO emergency band. A location pulse, then a voice saying 'last signal'. I've triangulated it to the heart of the exclusion zone.",
				"options": [
					{"text": "What's out there?", "next": "where"},
					{"text": "Can you boost the signal?", "next": "boost"},
					{"text": "[Leave]", "next": ""}],
			},
			"where": {
				"text": "The old military bunker complex, ground zero of the first containment failure. The Matriarch nests in the forest before it, and the Iron Abomination owns the factory road. You'll need a plan, not just courage.",
				"options": [
					{"text": "Then I'll make one.", "next": "intro",
						"event": {"accept": "m02_first_light"}},
					{"text": "[Leave]", "next": ""}],
			},
			"boost": {
				"text": "I need a radio tower built high enough to clear the ruins, and electronics to repair the transmitter. Do that and I can pull full coordinates — maybe even identify the source.",
				"options": [
					{"text": "I'll build the tower.", "next": "intro",
						"event": {"accept": "s02_radio_parts"}},
					{"text": "[Leave]", "next": ""}],
			},
		},
	},
	"kovac": {
		"name": "Sergeant Kovac (Ret.)",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "Civilian. Good — we need hands. This shelter's walls won't hold a determined assault. I've marked fortification plans. Wood, scrap, sweat. Bring the materials and I'll show you how a real perimeter works.",
				"options": [
					{"text": "Teach me to build.", "next": "build",
						"event": {"flag": "met_kovac"}},
					{"text": "What's threatening the shelter?", "next": "threat"},
					{"text": "[Leave]", "next": ""}],
			},
			"build": {
				"text": "Foundations first, walls after. A campfire keeps people fed, a workbench keeps them armed, storage keeps them honest. Your build menu has everything. Place it flat, brace it right, and it'll still be standing when you're not.",
				"options": [
					{"text": "Understood, Sergeant.", "next": "intro"},
					{"text": "[Leave]", "next": ""}],
			},
			"threat": {
				"text": "Hollows probe the fence every night. But the Hollow King — that's what Boris calls the big one in the ruins — he's different. Organized. When he comes, we need real fortifications and real guns. Both.",
				"options": [
					{"text": "I'll be ready.", "next": "intro",
						"event": {"accept": "s04_shelter_repair"}},
					{"text": "[Leave]", "next": ""}],
			},
		},
	},
	"vera": {
		"name": "Vera Marsh, Camp Leader",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "New blood. I run this camp by the oldest rule there is: everyone contributes. We've lost supply runs, good people, and most of our medicine. You look capable — prove me right.",
				"options": [
					{"text": "I can recover the lost supplies.", "next": "supplies",
						"event": {"accept": "s01_lost_supplies"}},
					{"text": "What do you need most?", "next": "need"},
					{"text": "[Leave]", "next": ""}],
			},
			"need": {
				"text": "Walls that hold, bandages that don't run out, and a night without something scratching at the gate. In that order. Kovac handles the walls — talk to him once you've got scrap in your pack.",
				"options": [
					{"text": "I'll see what I can do.", "next": "intro",
						"event": {"accept": "s04_shelter_repair"}},
					{"text": "[Leave]", "next": ""}],
			},
			"supplies": {
				"text": "Our crate went off the overpass north of camp. The hollows don't loot — it'll still be there if you're quick. Good hunting.",
				"options": [
					{"text": "[Leave]", "next": ""}],
			},
		},
	},
	"petrovich": {
		"name": "Petrovich, Forest Hunter",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "The forest keeps its own laws. I hunted these ridges before the bombs; now something hunts back. Watchers, burrowers, mimics that wear dead voices like coats. You want work? I've got work.",
				"options": [
					{"text": "I need transmitter parts.", "next": "radio",
						"event": {"accept": "s02_radio_parts"}},
					{"text": "What's hunting out there?", "next": "hunt",
						"event": {"accept": "s03_hunter_prey"}},
					{"text": "Can you teach me to maintain weapons?", "next": "smith",
						"event": {"accept": "s05_blacksmith"}},
					{"text": "[Leave]", "next": ""}],
			},
			"radio": {
				"text": "Electronic parts. Five, at least — the dead factories still have them, sealed in housings the rot can't reach. Bring them and Mara's transmitter sings again.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
			"hunt": {
				"text": "Watchers perch and mark you for the pack. Four of them on the ridges and the trails quiet down for a week. Aim for the head — their chests are mostly scar tissue.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
			"smith": {
				"text": "A weapon that jams is a shovel with opinions. Craft two repair kits from scrap and tape. Do that and I'll know you can keep yourself alive past the first week.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
		},
	},
	"dr_lesnik": {
		"name": "Dr. Lesnik, Field Medic",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "I treated radiation sickness when it was a textbook chapter. Now it's house calls. My supplies are nearly gone and the supermarket pharmacy is still locked down. Help me, and I'll keep you breathing.",
				"options": [
					{"text": "I'll breach the pharmacy.", "next": "pharmacy",
						"event": {"accept": "s08_pharmacy_run"}},
					{"text": "Tell me about the mimics.", "next": "mimic",
						"event": {"accept": "s06_mimic_tears"}},
					{"text": "How do I eat safely out here?", "next": "food",
						"event": {"accept": "s10_rad_cook"}},
					{"text": "[Leave]", "next": ""}],
			},
			"pharmacy": {
				"text": "Painkillers, three boxes minimum, and anything else sealed. The back room had a reinforced door — a lockpick set should do it. Wash your hands after.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
			"mimic": {
				"text": "They repeat the last words of people they've taken, which makes them easy to mistake for survivors until it's too late. Kill three. I need samples — and I need them stopped.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
			"food": {
				"text": "Mutant meat carries parasites; fire kills what radiation leaves behind. Cook three portions over a campfire before you eat them. Your stomach will thank you, quietly.",
				"options": [{"text": "[Leave]", "next": ""}],
			},
		},
	},
	"survivor_watchtower": {
		"name": "Lookout Chen",
		"start": "intro",
		"nodes": {
			"intro": {
				"text": "I saw lights moving in the dead city — not mutants, people. Armed people, organized. And deeper, something big dragging itself between the buildings. Don't travel alone out there.",
				"options": [
					{"text": "Thanks for the warning.", "next": "intro",
						"event": {"accept": "s12_tower_watch"}},
					{"text": "[Leave]", "next": ""}],
			},
		},
	},
}

const SHOPS := {
	"boris": {
		"title": "Boris's Trade Post",
		"currency": "scrap_metal",
		"buy": [
			{"id": "ammo_9mm", "qty": 12, "price": 4},
			{"id": "ammo_shells", "qty": 6, "price": 5},
			{"id": "ammo_rifle", "qty": 10, "price": 7},
			{"id": "bandage", "qty": 2, "price": 3},
			{"id": "lockpick", "qty": 2, "price": 3},
			{"id": "w_axe", "qty": 1, "price": 14},
			{"id": "armor_vest", "qty": 1, "price": 22},
			{"id": "battery", "qty": 1, "price": 6},
		],
		"sell_rate": 0.4,
	},
}

static func get_tree(npc_id: String) -> Dictionary:
	return TREES.get(npc_id, {})

static func node(npc_id: String, node_id: String) -> Dictionary:
	var t: Dictionary = TREES.get(npc_id, {})
	return t.get("nodes", {}).get(node_id, {})

static func shop(shop_id: String) -> Dictionary:
	return SHOPS.get(shop_id, {})
