class_name ResourceChunk3D
extends Node3D

var resource_id: String = "iron"
var amount: int = 1
var velocity: Vector3 = Vector3.ZERO
var spin_axis: Vector3 = Vector3.UP
var _collected: bool = false
var _lifetime: float = 75.0
var _magnetized_glow: OmniLight3D

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

	_magnetized_glow = OmniLight3D.new()
	_magnetized_glow.light_color = GameData.RESOURCES[resource_id]["color"]
	_magnetized_glow.light_energy = 0.85
	_magnetized_glow.omni_range = 4.5
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
		return false
	_collected = true
	AudioManager.play_sfx("pickup_resource", 0.08, 0.65)
	queue_free()
	return true
