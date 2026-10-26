extends Node
## Central game state: progression, story flags, runtime references.

signal xp_gained(amount: int, new_total: int)
signal level_up(level: int)
signal skill_points_changed(remaining: int)
signal story_flag_set(flag: String)
signal phase_changed(phase: String)
signal player_registered(player: Node)

const PHASE_MENU := "menu"
const PHASE_PLAYING := "playing"
const PHASE_PAUSED := "paused"
const PHASE_DEAD := "dead"
const MAX_LEVEL := 50
const SAVE_VERSION := 1

var phase := PHASE_MENU
var world_seed := 20261026
var player: Node = null
var current_region_id := "suburbs"

# Progression
var level := 1
var xp := 0
var skill_points := 0
var attributes := {
	"strength": 5, "endurance": 5, "agility": 5,
	"perception": 5, "technical": 5, "survival": 5,
}
var unlocked_skills: Array[String] = []
var stats := {
	"kills": 0, "bosses": 0, "quests_done": 0, "containers_looted": 0,
	"distance_m": 0.0, "crafts": 0, "deaths": 0, "days_survived": 0,
}
var story_flags: Dictionary = {}

# World interaction bookkeeping (prevents loot respawn exploits)
var looted_containers: Dictionary = {}
var killed_enemies: Dictionary = {}
var discovered_locations: Dictionary = {}
var world_buildings: Array = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func register_player(p: Node) -> void:
	player = p
	player_registered.emit(p)

func set_phase(next: String) -> void:
	if phase == next:
		return
	phase = next
	get_tree().paused = (next == PHASE_PAUSED)
	phase_changed.emit(next)

# ------------------------------------------------------------- progression
func xp_for_level(lv: int) -> int:
	# Smoothly rising requirement curve through level 50.
	return int(180.0 * pow(lv, 1.45))

func gain_xp(amount: int) -> void:
	if level >= MAX_LEVEL or amount <= 0:
		return
	xp += amount
	var leveled := false
	while level < MAX_LEVEL and xp >= xp_for_level(level):
		xp -= xp_for_level(level)
		level += 1
		skill_points += 1
		leveled = true
	xp_gained.emit(amount, xp)
	if leveled:
		level_up.emit(level)
		skill_points_changed.emit(skill_points)

func can_unlock_skill(skill_id: String, cost: int = 1) -> bool:
	return skill_points >= cost and not skill_id in unlocked_skills

func unlock_skill(skill_id: String, cost: int = 1) -> bool:
	if not can_unlock_skill(skill_id, cost):
		return false
	skill_points -= cost
	unlocked_skills.append(skill_id)
	skill_points_changed.emit(skill_points)
	return true

func has_skill(skill_id: String) -> bool:
	return skill_id in unlocked_skills

func set_story_flag(flag: String, value: bool = true) -> void:
	if story_flags.get(flag, false) == value:
		return
	story_flags[flag] = value
	story_flag_set.emit(flag)

func get_story_flag(flag: String) -> bool:
	return story_flags.get(flag, false)

func xp_progress() -> float:
	if level >= MAX_LEVEL:
		return 1.0
	return clampf(float(xp) / float(xp_for_level(level)), 0.0, 1.0)

# ------------------------------------------------------------- save payload
func to_save_dict() -> Dictionary:
	return {
		"save_version": SAVE_VERSION,
		"world_seed": world_seed,
		"current_region_id": current_region_id,
		"level": level, "xp": xp, "skill_points": skill_points,
		"attributes": attributes.duplicate(true),
		"unlocked_skills": unlocked_skills.duplicate(),
		"stats": stats.duplicate(true),
		"story_flags": story_flags.duplicate(true),
		"looted_containers": looted_containers.duplicate(true),
		"killed_enemies": killed_enemies.duplicate(true),
		"discovered_locations": discovered_locations.duplicate(true),
	}

func from_save_dict(d: Dictionary) -> void:
	if int(d.get("save_version", 0)) != SAVE_VERSION:
		push_warning("Save version mismatch; loading best-effort")
	world_seed = int(d.get("world_seed", world_seed))
	current_region_id = d.get("current_region_id", current_region_id)
	level = int(d.get("level", 1))
	xp = int(d.get("xp", 0))
	skill_points = int(d.get("skill_points", 0))
	attributes = d.get("attributes", attributes)
	unlocked_skills.assign(d.get("unlocked_skills", []))
	stats = d.get("stats", stats)
	story_flags = d.get("story_flags", {})
	looted_containers = d.get("looted_containers", {})
	killed_enemies = d.get("killed_enemies", {})
	discovered_locations = d.get("discovered_locations", {})

func reset_run() -> void:
	level = 1
	xp = 0
	skill_points = 0
	attributes = {"strength": 5, "endurance": 5, "agility": 5,
		"perception": 5, "technical": 5, "survival": 5}
	unlocked_skills.clear()
	for k in stats:
		stats[k] = 0 if typeof(stats[k]) != TYPE_FLOAT else 0.0
	story_flags.clear()
	looted_containers.clear()
	killed_enemies.clear()
	discovered_locations.clear()
	current_region_id = "suburbs"
