class_name ResourceChunk3D
extends Node3D

var resource_id: String = "iron"
var amount: int = 1
var velocity: Vector3 = Vector3.ZERO
var spin_axis: Vector3 = Vector3.UP
var _collected: bool = false
var _lifetime: float = 75.0
var _magnetized_glow: OmniLight3D
var _glow_check_t: float = 0.0

func setup(res_id: String, qty: int, start_pos: Vector3, impulse: Vector3) -> void:
	resource_id = res_id if GameData.RESOURCES.has(res_id) else "iron"
	amount = maxi(1, qty)
	position = start_pos
	velocity = impulse
	spin_axis = Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
	if spin_axis.length_squared() < 0.01:
		spin_axis = Vector3.UP

	var model_path: String = GameData.RESOURCES[resource_id]["chunk_model"]
	if ResourceLoader.exists(model_path):
		var packed: PackedScene = load(model_path)
		if packed:
			var inst := packed.instantiate()
			inst.scale = Vector3.ONE * randf_range(0.95, 1.35)
			add_child(inst)

	# One omni light per fragment is a real cost in the compatibility renderer, and
	# a shattered rock drops five fragments at once. Only light the scene while the
	# profile allows realtime lights, and keep the range tight.
	# Lights per fragment are the classic VFX perf trap: a shattered rock drops up
	# to five at once. Keep the emitter but only switch it on near the player.
	if ThemeHelper.quality_int("vfx_lights") > 0:
		_magnetized_glow = OmniLight3D.new()
		_magnetized_glow.light_color = GameData.RESOURCES[resource_id]["color"]
		_magnetized_glow.light_energy = 0.85
		_magnetized_glow.omni_range = 4.5
		_magnetized_glow.shadow_enabled = false
		_magnetized_glow.visible = false
		add_child(_magnetized_glow)

func _physics_process(delta: float) -> void:
	if _collected:
		return
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	position += velocity * delta
	velocity = velocity.lerp(Vector3.ZERO, clampf(delta * 1.4, 0.0, 1.0))
	rotate(spin_axis, delta * 2.2)

	if is_instance_valid(_magnetized_glow):
		_glow_check_t -= delta
		if _glow_check_t <= 0.0:
			_glow_check_t = 0.35
			var near := false
			var cam := get_viewport().get_camera_3d() if is_inside_tree() else null
			if cam != null:
				near = global_position.distance_squared_to(cam.global_position) < 900.0
			_magnetized_glow.visible = near

func apply_magnet_pull(target_world_pos: Vector3, pull_strength: float, delta: float) -> void:
	if _collected:
		return
	var to_ship := target_world_pos - global_position
	var dist := maxf(0.5, to_ship.length())
	var dir := to_ship / dist
	velocity += dir * (pull_strength * (1.0 + 10.0 / dist)) * delta
	velocity = velocity.limit_length(85.0)

func try_collect() -> bool:
	# Atomic duplicate collection guard
	if _collected:
		return false
	var stored := ShipGrid.add_cargo_resource(resource_id, amount)
	if stored <= 0:
		# Cargo hold is full: the fragment must stay in space, otherwise a full
		# hold silently destroyed every piece the magnets touched.
		return false
	if stored < amount:
		# Partial pickup: keep the remainder as a smaller fragment instead of
		# deleting it. Before v2.6.0 the leftover units simply vanished.
		amount -= stored
		AudioManager.play_sfx("pickup_resource", 0.06, 0.72)
		return false
	_collected = true
	AudioManager.play_sfx("pickup_resource", 0.08, 0.65)
	queue_free()
	return true
