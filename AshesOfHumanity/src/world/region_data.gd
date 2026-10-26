extends RefCounted
class_name RegionData
## Six hand-laid regions: bounds, biomes, roads, landmarks, spawn rules.
## Placement is curated (roads, lots, quest landmarks) with deterministic
## jitter — never a flat plane with randomly scattered objects.

static func regions() -> Array[Dictionary]:
	return [
		{
			"id": "suburbs", "name": "The Dead Suburbs",
			"center": Vector3(-160, 0, 20), "size": Vector2(170, 150),
			"biome": "suburbs", "fog": Color(0.55, 0.58, 0.6),
			"temp_mod": 0.0, "safe_zones": [Vector3(-205, 0, 70)],
			"buildings": ["house", "house", "shop", "garage", "house",
				"supermarket", "clinic"],
			"enemy_day": ["hollow", "mimic"],
			"enemy_night": ["hollow", "hollow", "stalker", "pale_one"],
			"enemy_cap": 7, "danger": 0.5,
		},
		{
			"id": "forest", "name": "Blackwood Forest",
			"center": Vector3(-180, 0, -210), "size": Vector2(180, 170),
			"biome": "forest", "fog": Color(0.28, 0.34, 0.28),
			"temp_mod": -2.0, "safe_zones": [Vector3(-150, 0, -150)],
			"buildings": ["cabin", "cabin", "outpost", "tower"],
			"enemy_day": ["crawler", "watcher", "burrower"],
			"enemy_night": ["crawler", "stalker", "watcher", "pale_one"],
			"enemy_cap": 8, "danger": 0.8,
		},
		{
			"id": "industrial", "name": "The Industrial Zone",
			"center": Vector3(40, 0, -210), "size": Vector2(160, 150),
			"biome": "industrial", "fog": Color(0.45, 0.42, 0.38),
			"temp_mod": 3.0, "safe_zones": [],
			"buildings": ["factory", "warehouse", "warehouse", "chimney",
				"chemical_plant"],
			"enemy_day": ["hollow", "brute", "contaminated"],
			"enemy_night": ["brute", "contaminated", "screamer"],
			"enemy_cap": 8, "danger": 1.1,
		},
		{
			"id": "city", "name": "The Forgotten City",
			"center": Vector3(230, 0, -10), "size": Vector2(180, 170),
			"biome": "city", "fog": Color(0.4, 0.44, 0.52),
			"temp_mod": 1.0, "safe_zones": [Vector3(180, 0, 60)],
			"buildings": ["apartment", "apartment", "hospital", "policestation",
				"supermarket", "parking", "apartment"],
			"enemy_day": ["mimic", "hollow", "screamer"],
			"enemy_night": ["stalker", "screamer", "hollow", "pale_one"],
			"enemy_cap": 9, "danger": 1.3,
		},
		{
			"id": "exclusion", "name": "Military Exclusion Zone",
			"center": Vector3(150, 0, 210), "size": Vector2(160, 150),
			"biome": "exclusion", "fog": Color(0.42, 0.46, 0.4),
			"temp_mod": 2.0, "safe_zones": [],
			"buildings": ["bunker", "checkpoint", "tower", "armory", "lab"],
			"enemy_day": ["contaminated", "brute", "watcher"],
			"enemy_night": ["contaminated", "brute", "stalker", "pale_one"],
			"enemy_cap": 9, "danger": 1.6,
		},
		{
			"id": "wasteland", "name": "The Red Wasteland",
			"center": Vector3(-120, 0, 250), "size": Vector2(220, 180),
			"biome": "wasteland", "fog": Color(0.5, 0.32, 0.28),
			"temp_mod": 6.0, "safe_zones": [],
			"buildings": ["ruin", "ruin", "tower"],
			"enemy_day": ["contaminated", "brute", "burrower"],
			"enemy_night": ["pale_one", "stalker", "contaminated", "brute"],
			"enemy_cap": 10, "danger": 2.0,
		},
	]

# Curved road network as ordered waypoint chains.
static func roads() -> Array[PackedVector3Array]:
	return [
		PackedVector3Array([
			Vector3(-95, 0, 30), Vector3(-140, 0, -40), Vector3(-160, 0, -120),
			Vector3(-175, 0, -150)]),
		PackedVector3Array([
			Vector3(-95, 0, 20), Vector3(-20, 0, -30), Vector3(20, 0, -110),
			Vector3(40, 0, -160)]),
		PackedVector3Array([
			Vector3(100, 0, -190), Vector3(140, 0, -120), Vector3(160, 0, -50),
			Vector3(165, 0, 10)]),
		PackedVector3Array([
			Vector3(200, 0, 80), Vector3(185, 0, 140), Vector3(165, 0, 170)]),
		PackedVector3Array([
			Vector3(120, 0, 280), Vector3(40, 0, 290), Vector3(-40, 0, 285),
			Vector3(-110, 0, 265)]),
		PackedVector3Array([
			Vector3(-180, 0, -140), Vector3(-210, 0, 40), Vector3(-180, 0, 180)]),
	]

# Quest landmarks: id -> region + local offset + marker label.
static func landmarks() -> Array[Dictionary]:
	return [
		{"id": "shelter_exit", "region": "suburbs",
			"pos": Vector3(-215, 0, 78), "label": "Underground Shelter"},
		{"id": "shelter_note", "region": "suburbs",
			"pos": Vector3(-218, 0, 82), "label": "Handwritten Note"},
		{"id": "supermarket_pharmacy", "region": "suburbs",
			"pos": Vector3(-140, 0, 10), "label": "Supermarket"},
		{"id": "suburbs_rooftop", "region": "suburbs",
			"pos": Vector3(-138, 0, 8), "label": "Supermarket Rooftop"},
		{"id": "rooftop_antenna", "region": "suburbs",
			"pos": Vector3(-136, 0, 6), "label": "Rooftop Antenna"},
		{"id": "basement_chest", "region": "suburbs",
			"pos": Vector3(-185, 0, -20), "label": "Nest Basement"},
		{"id": "king_arena", "region": "suburbs",
			"pos": Vector3(-100, 0, -45), "label": "Sunken Cul-de-sac"},
		{"id": "overpass_cache", "region": "suburbs",
			"pos": Vector3(-92, 0, 45), "label": "Fallen Supply Crate"},
		{"id": "graveyard_memorial", "region": "suburbs",
			"pos": Vector3(-235, 0, -10), "label": "Graveyard Memorial"},
		{"id": "forest_camp", "region": "forest",
			"pos": Vector3(-150, 0, -150), "label": "Petrovich's Camp"},
		{"id": "cave_mouth", "region": "forest",
			"pos": Vector3(-250, 0, -250), "label": "Cave Mouth"},
		{"id": "matriarch_arena", "region": "forest",
			"pos": Vector3(-110, 0, -290), "label": "Foggy Valley"},
		{"id": "watchtower_log", "region": "forest",
			"pos": Vector3(-120, 0, -200), "label": "Watchtower"},
		{"id": "factory_generator", "region": "industrial",
			"pos": Vector3(20, 0, -230), "label": "Factory Generator"},
		{"id": "iron_arena", "region": "industrial",
			"pos": Vector3(95, 0, -240), "label": "Cooling Tower Yard"},
		{"id": "hospital", "region": "city",
			"pos": Vector3(255, 0, 35), "label": "City Hospital"},
		{"id": "subway_tunnel", "region": "city",
			"pos": Vector3(300, 0, -60), "label": "Subway Entrance"},
		{"id": "policestation", "region": "city",
			"pos": Vector3(205, 0, -55), "label": "Police Station"},
		{"id": "bunker_lab", "region": "exclusion",
			"pos": Vector3(150, 0, 235), "label": "Sealed Laboratory"},
		{"id": "checkpoint_armory", "region": "exclusion",
			"pos": Vector3(95, 0, 180), "label": "Checkpoint Armory"},
		{"id": "wasteland_crater", "region": "wasteland",
			"pos": Vector3(-120, 0, 250), "label": "The Great Crater"},
		{"id": "signal_tower", "region": "wasteland",
			"pos": Vector3(-118, 0, 248), "label": "Signal Tower"},
		{"id": "signal_console", "region": "wasteland",
			"pos": Vector3(-116, 0, 246), "label": "Broadcast Console"},
	]

static func by_id(id: String) -> Dictionary:
	for r in regions():
		if r.id == id:
			return r
	return {}

static func region_at(pos: Vector3) -> Dictionary:
	for r in regions():
		var c: Vector3 = r.center
		var s: Vector2 = r.size
		if absf(pos.x - c.x) <= s.x * 0.5 and absf(pos.z - c.z) <= s.y * 0.5:
			return r
	return {}
