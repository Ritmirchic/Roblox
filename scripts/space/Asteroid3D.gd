class_name Asteroid3D
extends StaticBody3D

signal destroyed(asteroid: Asteroid3D, world_pos: Vector3)

var max_hp: float = 100.0
var hp: float = 100.0
var hardness: int = 1
var resource_weights: Dictionary = {"iron": 1.0}
var dominant_resource: String = "iron"
var radius: float = 2.6

var _visual_root: Node3D
var _spin_axis: Vector3 = Vector3.UP
var _spin_speed: float = 0.18
var _damage_stage: int = 0
var _dead: bool = false

func setup(sector_def: Dictionary, spawn_pos: Vector3, scale_factor: float = 1.0) -> void:
	position = spawn_pos
	hardness = int(sector_def.get("asteroid_hardness", 1))
	max_hp = float(sector_def.get("asteroid_hp", 100.0)) * scale_factor
	hp = max_hp
	resource_weights = sector_def.get("resources", {"iron": 1.0}).duplicate()
	dominant_resource = _pick_weighted_resource(0.0)
	radius = 2.35 * scale_factor

	var shape := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = radius
	shape.shape = sph
	add_child(shape)

	_visual_root = Node3D.new()
	_visual_root.scale = Vector3.ONE * scale_factor
	add_child(_visual_root)

	var mpath: String = sector_def.get("asteroid_model", "res://assets/models/asteroids/ast_silicate_iron.glb")
	if ResourceLoader.exists(mpath):
		var ps: PackedScene = load(mpath)
		if ps:
			_visual_root.add_child(ps.instantiate())

	_spin_axis = Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
	if _spin_axis.length_squared() < 0.01:
		_spin_axis = Vector3.UP
	_spin_speed = randf_range(0.06, 0.24)
	add_to_group("asteroids")

func _process(delta: float) -> void:
	if _visual_root and not _dead:
		_visual_root.rotate(_spin_axis, _spin_speed * delta)

func _pick_weighted_resource(rare_bonus: float) -> String:
	var adjusted: Dictionary = {}
	var total := 0.0
	var keys := resource_weights.keys()
	for i in range(keys.size()):
		var k: String = keys[i]
		var w := float(resource_weights[k])
		if i > 0 and rare_bonus > 0.0:
			w *= (1.0 + rare_bonus * float(i + 1))
		adjusted[k] = w
		total += w
	var roll := randf() * maxf(0.001, total)
	var acc := 0.0
	for k in adjusted.keys():
		acc += float(adjusted[k])
		if roll <= acc:
			return k
	return "iron"

func apply_mining_damage(raw_dmg: float, pierce_tier: int, yield_mult: float, rare_chance: float, chunk_parent: Node) -> bool:
	if _dead or raw_dmg <= 0.0:
		return false
	# Hardness mitigation if mining laser tier is lower than sector rock hardness
	var tier_diff := maxi(0, hardness - pierce_tier)
	var effective_dmg := raw_dmg / pow(1.45, float(tier_diff))
	hp -= effective_dmg

	var ratio := clampf(hp / maxf(1.0, max_hp), 0.0, 1.0)
	if ratio < 0.66 and _damage_stage == 0:
		_damage_stage = 1
		_visual_root.scale *= 0.94
		_spawn_chunks(1, yield_mult, rare_chance, chunk_parent)
	elif ratio < 0.33 and _damage_stage == 1:
		_damage_stage = 2
		_visual_root.scale *= 0.92
		_spawn_chunks(1, yield_mult, rare_chance, chunk_parent)

	if hp <= 0.0:
		_shatter(yield_mult, rare_chance, chunk_parent)
		return true
	return false

func _spawn_chunks(base_count: int, yield_mult: float, rare_chance: float, chunk_parent: Node) -> void:
	if not chunk_parent:
		return
	# More visible fragments when asteroid breaks: 3-6 larger glowing chunks
	var count := maxi(3, int(round(float(base_count) * maxf(1.0, minf(yield_mult, 4.0)))))
	var per_chunk_qty := maxi(1, int(round(maxf(1.0, yield_mult / float(count)) * float(base_count))))
	for _i in range(count):
		var res_id := _pick_weighted_resource(rare_chance)
		var chunk := ResourceChunk3D.new()
		var dir := Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
		if dir.length_squared() < 0.01:
			dir = Vector3.UP
		# Larger impulse so fragments scatter visibly
		var impulse := dir * randf_range(6.0, 14.0)
		chunk.setup(res_id, per_chunk_qty, global_position + dir * (radius * 0.7), impulse)
		chunk_parent.add_child(chunk)

func _shatter(yield_mult: float, rare_chance: float, chunk_parent: Node) -> void:
	if _dead:
		return
	_dead = true
	AudioManager.play_sfx("asteroid_break", 0.09, 0.85)
	VFXFactory.spawn_explosion(get_parent(), global_position, GameData.RESOURCES[dominant_resource]["color"], 1.2)
	# Shatter into more visible fragments that player must collect
	_spawn_chunks(5, yield_mult, rare_chance, chunk_parent)
	ShipGrid.stats_history["asteroids_mined"] = int(ShipGrid.stats_history.get("asteroids_mined", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("mine_asteroid", 1)
	destroyed.emit(self, global_position)
	queue_free()
