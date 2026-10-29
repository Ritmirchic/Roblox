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
# ── v2.6.0 visual damage state ───────────────────────────────────────────────
# Bura contact and hull damage used to be invisible on the rock itself: it only
# shrank. These fields drive the glowing fracture shell and the molten hot spot.
var _crack_mat: ShaderMaterial
var _crack_color: Color = Color(1.0, 0.46, 0.12)
var _heat: float = 0.0
var _pulse_t: float = 0.0
var _hot_spot: MeshInstance3D
var _hot_mat: StandardMaterial3D
var _heat_light: OmniLight3D
var _spark_cd: float = 0.0

func setup(sector_def: Dictionary, spawn_pos: Vector3, scale_factor: float = 1.0) -> void:
	position = spawn_pos
	hardness = int(sector_def.get("asteroid_hardness", 1))
	max_hp = float(sector_def.get("asteroid_hp", 100.0)) * scale_factor
	hp = max_hp
	resource_weights = sector_def.get("resources", {"iron": 1.0}).duplicate()
	dominant_resource = _pick_weighted_resource(0.0)
	if not GameData.RESOURCES.has(dominant_resource):
		# Sector data is authored by hand; an unknown mineral id would crash the
		# shatter VFX lookup. Fall back to the guaranteed starter ore.
		dominant_resource = "iron"
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
			var rock := ps.instantiate()
			_visual_root.add_child(rock)
			# Every rock is the same mesh, so the only cheap variety is material:
			# a little albedo/tint jitter kills the "cloned boulder" look.
			VFXFactory.tune_glb_materials(rock, 0.05, 0.86)
			var tint := randf_range(0.86, 1.14)
			_apply_rock_tint(rock, Color(tint, tint * randf_range(0.97, 1.03), tint * randf_range(0.94, 1.02)))

	var res_def: Dictionary = GameData.RESOURCES.get(dominant_resource, {})
	if res_def.has("color"):
		_crack_color = (res_def["color"] as Color).lightened(0.12)
	_build_crack_shell()

	_spin_axis = Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
	if _spin_axis.length_squared() < 0.01:
		_spin_axis = Vector3.UP
	_spin_speed = randf_range(0.06, 0.24)
	add_to_group("asteroids")

func _apply_rock_tint(root: Node, tint: Color) -> void:
	for mi in VFXFactory.collect_mesh_instances(root):
		var mat := mi.get_active_material(0) as StandardMaterial3D
		if mat == null:
			continue
		mat.albedo_color = Color(
			mat.albedo_color.r * tint.r,
			mat.albedo_color.g * tint.g,
			mat.albedo_color.b * tint.b,
			mat.albedo_color.a
		)


func _build_crack_shell() -> void:
	## Addivite fracture shell sitting just above the rock surface. Its mask is built
	## in object space, so it spins with the asteroid and never slides.
	var sh_path := "res://shaders/asteroid_crack.gdshader"
	if not ResourceLoader.exists(sh_path):
		return
	_crack_mat = ShaderMaterial.new()
	_crack_mat.shader = load(sh_path)
	_crack_mat.set_shader_parameter("damage", 0.0)
	_crack_mat.set_shader_parameter("heat", 0.0)
	_crack_mat.set_shader_parameter("crack_color", Vector3(_crack_color.r, _crack_color.g, _crack_color.b))
	_crack_mat.set_shader_parameter("crack_scale", 3.1 + randf() * 1.4)
	var shell := MeshInstance3D.new()
	var sph := SphereMesh.new()
	var local_r := radius / maxf(0.05, _visual_root.scale.x)
	sph.radius = local_r * 1.012
	sph.height = local_r * 2.024
	sph.radial_segments = 20
	sph.rings = 12
	shell.mesh = sph
	shell.material_override = _crack_mat
	shell.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_visual_root.add_child(shell)
	shell.visible = true


func register_beam_hit(world_pos: Vector3, delta: float) -> void:
	## Called every physics frame by the mining beam that is actually cutting this
	## rock. Drives the molten hot spot, the heat glow and the spark spray.
	if _dead:
		return
	_heat = minf(1.0, _heat + delta * 3.4)
	_spark_cd -= delta
	if _spark_cd <= 0.0:
		_spark_cd = 0.075
		VFXFactory.spawn_debris_burst(
			get_parent(), world_pos, _crack_color.lightened(0.25),
			maxi(2, int(round(5.0 * ThemeHelper.quality_float("particles")))), 7.5
		)
	if _hot_spot == null:
		_hot_spot = MeshInstance3D.new()
		var gs := SphereMesh.new()
		gs.radius = 0.3
		gs.height = 0.6
		gs.radial_segments = 10
		gs.rings = 6
		_hot_spot.mesh = gs
		_hot_mat = StandardMaterial3D.new()
		_hot_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		_hot_mat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		_hot_mat.no_depth_test = false
		_hot_mat.albedo_color = _crack_color.lightened(0.45) * 2.4
		_hot_spot.material_override = _hot_mat
		_hot_spot.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(_hot_spot)
		if ThemeHelper.quality_bool("lights"):
			_heat_light = OmniLight3D.new()
			_heat_light.light_color = _crack_color.lightened(0.3)
			_heat_light.light_energy = 0.0
			_heat_light.omni_range = 7.5
			_heat_light.shadow_enabled = false
			add_child(_heat_light)
	_hot_spot.global_position = world_pos
	_hot_spot.scale = Vector3.ONE * (0.55 + _heat * 0.85)
	if is_instance_valid(_heat_light):
		_heat_light.global_position = world_pos
		_heat_light.light_energy = 0.4 + _heat * 2.6


func _process(delta: float) -> void:
	if _visual_root and not _dead:
		_visual_root.rotate(_spin_axis, _spin_speed * delta)
	_pulse_t += delta
	if _heat > 0.0:
		_heat = maxf(0.0, _heat - delta * 0.85)
	if _crack_mat != null:
		var dmg_ratio := clampf(1.0 - hp / maxf(1.0, max_hp), 0.0, 1.0)
		_crack_mat.set_shader_parameter("damage", dmg_ratio)
		_crack_mat.set_shader_parameter("heat", clampf(_heat, 0.0, 1.0))
		_crack_mat.set_shader_parameter("shell_pulse", 0.5 + 0.5 * sin(_pulse_t * 6.5))
	if is_instance_valid(_hot_mat):
		var fade := clampf(_heat, 0.0, 1.0)
		_hot_mat.albedo_color = Color(_crack_color.r, _crack_color.g, _crack_color.b, 1.0) * (0.6 + fade * 2.0)
		if is_instance_valid(_hot_spot):
			_hot_spot.scale = Vector3.ONE * (0.4 + fade * 1.05)

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

	# maxf(1.0, ...) distorted every rock with less than one hit point of health;
	# the ratio must follow the real maximum.
	var ratio := clampf(hp / maxf(0.001, max_hp), 0.0, 1.0)
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
	var shard_color: Color = GameData.RESOURCES[dominant_resource]["color"]
	# A rock that blows apart should read as a burst, not a puff: core flash,
	# expanding shock ring and a wide shrapnel spray.
	VFXFactory.spawn_explosion(get_parent(), global_position, shard_color, 1.25)
	VFXFactory.spawn_impact_ring(get_parent(), global_position, shard_color.lightened(0.3), 8.0, 0.5)
	VFXFactory.spawn_debris_burst(
		get_parent(), global_position, shard_color,
		maxi(8, int(round(22.0 * ThemeHelper.quality_float("debris")))), 21.0
	)
	if radius > 3.4:
		VFXFactory.spawn_explosion(get_parent(), global_position + Vector3(0, radius * 0.4, 0), shard_color.lightened(0.2), 0.8)
	# Shatter into more visible fragments that player must collect
	_spawn_chunks(5, yield_mult, rare_chance, chunk_parent)
	ShipGrid.stats_history["asteroids_mined"] = int(ShipGrid.stats_history.get("asteroids_mined", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("mine_asteroid", 1)
	destroyed.emit(self, global_position)
	queue_free()
