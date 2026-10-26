extends RefCounted
class_name MutantFactory
## Creates configured mutant / boss enemies. Distinct stats, silhouettes and
## AI behaviors per species; weak points and spawn conditions included.

const TYPES := {
	"hollow": {
		"hp": 70.0, "speed": 2.7, "damage": 14.0, "sight": 15.0,
		"fov": 75.0, "hearing": 24.0, "range": 2.0, "attack_cd": 1.1,
		"xp": 45, "behavior": "sound", "model": "mutant_hollow",
		"scale": 1.0, "weak_head": 2.2, "night_boost": 1.25,
		"vocal": "mutant_growl",
	},
	"crawler": {
		"hp": 45.0, "speed": 4.3, "damage": 10.0, "sight": 13.0,
		"fov": 110.0, "hearing": 18.0, "range": 1.7, "attack_cd": 0.8,
		"xp": 35, "behavior": "swarm", "model": "mutant_crawler",
		"scale": 1.05, "weak_head": 2.0, "night_boost": 1.15,
		"vocal": "mutant_hiss",
	},
	"watcher": {
		"hp": 55.0, "speed": 2.3, "damage": 9.0, "sight": 32.0,
		"fov": 130.0, "hearing": 14.0, "range": 1.9, "attack_cd": 1.3,
		"xp": 40, "behavior": "watcher", "model": "mutant_watcher",
		"scale": 1.0, "weak_head": 2.5, "night_boost": 1.1,
		"vocal": "mutant_hiss",
	},
	"screamer": {
		"hp": 40.0, "speed": 3.0, "damage": 6.0, "sight": 20.0,
		"fov": 100.0, "hearing": 20.0, "range": 1.6, "attack_cd": 1.0,
		"xp": 50, "behavior": "screamer", "model": "mutant_screamer",
		"scale": 1.0, "weak_head": 2.0, "night_boost": 1.2,
		"vocal": "mutant_scream",
	},
	"brute": {
		"hp": 230.0, "speed": 1.7, "damage": 34.0, "sight": 16.0,
		"fov": 80.0, "hearing": 16.0, "range": 2.4, "attack_cd": 1.9,
		"xp": 110, "behavior": "charge", "model": "mutant_brute",
		"scale": 1.0, "weak_head": 1.8, "night_boost": 1.05,
		"vocal": "boss_roar",
	},
	"mimic": {
		"hp": 65.0, "speed": 3.2, "damage": 18.0, "sight": 12.0,
		"fov": 90.0, "hearing": 26.0, "range": 1.9, "attack_cd": 1.0,
		"xp": 60, "behavior": "ambush", "model": "mutant_mimic",
		"scale": 1.0, "weak_head": 2.0, "night_boost": 1.3,
		"vocal": "mutant_growl",
	},
	"burrower": {
		"hp": 85.0, "speed": 3.5, "damage": 20.0, "sight": 11.0,
		"fov": 90.0, "hearing": 22.0, "range": 1.9, "attack_cd": 1.2,
		"xp": 70, "behavior": "burrow", "model": "mutant_burrower",
		"scale": 1.0, "weak_head": 1.8, "night_boost": 1.1,
		"vocal": "mutant_hiss",
	},
	"stalker": {
		"hp": 100.0, "speed": 3.7, "damage": 22.0, "sight": 22.0,
		"fov": 100.0, "hearing": 18.0, "range": 2.0, "attack_cd": 0.95,
		"xp": 85, "behavior": "flanker", "model": "mutant_stalker",
		"scale": 1.0, "weak_head": 2.1, "night_boost": 1.4,
		"vocal": "mutant_growl",
	},
	"contaminated": {
		"hp": 95.0, "speed": 2.5, "damage": 16.0, "sight": 15.0,
		"fov": 85.0, "hearing": 15.0, "range": 2.1, "attack_cd": 1.3,
		"xp": 80, "behavior": "aura", "model": "mutant_contaminated",
		"scale": 1.0, "weak_head": 1.9, "night_boost": 1.05,
		"vocal": "mutant_growl",
	},
	"pale_one": {
		"hp": 140.0, "speed": 4.1, "damage": 26.0, "sight": 24.0,
		"fov": 110.0, "hearing": 20.0, "range": 2.1, "attack_cd": 0.9,
		"xp": 140, "behavior": "predator", "model": "mutant_pale_one",
		"scale": 1.0, "weak_head": 2.3, "night_boost": 1.6,
		"vocal": "boss_roar2",
	},
	# Bosses reuse the enemy controller with boss tables.
	"boss_hollow_king": {
		"hp": 900.0, "speed": 2.6, "damage": 38.0, "sight": 40.0,
		"fov": 180.0, "hearing": 60.0, "range": 2.8, "attack_cd": 1.6,
		"xp": 900, "behavior": "boss_king", "model": "boss_hollow_king",
		"scale": 1.0, "weak_head": 1.6, "night_boost": 1.0, "boss": true,
		"vocal": "boss_roar",
	},
	"boss_iron_abomination": {
		"hp": 1400.0, "speed": 2.0, "damage": 46.0, "sight": 40.0,
		"fov": 180.0, "hearing": 50.0, "range": 3.2, "attack_cd": 2.0,
		"xp": 1100, "behavior": "boss_iron", "model": "boss_iron_abomination",
		"scale": 1.0, "weak_head": 1.5, "night_boost": 1.0, "boss": true,
		"vocal": "boss_roar",
	},
	"boss_forest_matriarch": {
		"hp": 1150.0, "speed": 2.4, "damage": 30.0, "sight": 40.0,
		"fov": 180.0, "hearing": 50.0, "range": 2.7, "attack_cd": 1.5,
		"xp": 1000, "behavior": "boss_matriarch", "model": "boss_forest_matriarch",
		"scale": 1.0, "weak_head": 1.7, "night_boost": 1.0, "boss": true,
		"vocal": "boss_roar2",
	},
	"boss_last_signal": {
		"hp": 1800.0, "speed": 2.8, "damage": 34.0, "sight": 60.0,
		"fov": 360.0, "hearing": 80.0, "range": 14.0, "attack_cd": 1.2,
		"xp": 2000, "behavior": "boss_signal", "model": "boss_last_signal",
		"scale": 1.15, "weak_head": 1.4, "night_boost": 1.0, "boss": true,
		"vocal": "boss_roar",
	},
}

static func make(type: String, is_boss := false) -> Node:
	var enemy: Enemy = Enemy.new()
	enemy.configure(type, TYPES[type], is_boss or TYPES[type].get("boss", false))
	return enemy
