class_name HorrorPlayer
extends CharacterBody3D

signal noise_made(position: Vector3, loudness: float)
signal interaction_message(text: String)

@export var walk_speed := 3.7
@export var sprint_speed := 5.8
@export var mouse_sensitivity := 0.0018
var control_enabled := false
var flashlight_on := true
var stamina := 100.0
var _camera: Camera3D
var _ray: RayCast3D
var _step_clock := 0.0
var _footstep_player: AudioStreamPlayer3D
var _lamp: SpotLight3D
var _headbob := 0.0


func _ready() -> void:
	_build_body()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _build_body() -> void:
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.72
	var collision := CollisionShape3D.new()
	collision.shape = capsule
	collision.position.y = 0.88
	add_child(collision)
	_camera = Camera3D.new()
	_camera.name = "FirstPersonCamera"
	_camera.position = Vector3(0, 1.55, 0)
	_camera.fov = 76
	_camera.current = true
	add_child(_camera)
	_lamp = SpotLight3D.new()
	_lamp.name = "ReliableFlashlight"
	_lamp.position = Vector3(0.12, -0.14, -0.18)
	_lamp.rotation.x = deg_to_rad(-3.0)
	_lamp.light_color = Color(0.89, 0.91, 0.86)
	_lamp.light_energy = 2.2
	_lamp.spot_range = 18.0
	_lamp.spot_angle = 31.0
	_lamp.spot_angle_attenuation = 0.92
	_lamp.shadow_enabled = true
	_camera.add_child(_lamp)
	_ray = RayCast3D.new()
	_ray.name = "InteractionRay"
	_ray.target_position = Vector3(0, 0, -3.15)
	_ray.collide_with_areas = true
	_ray.collide_with_bodies = true
	_camera.add_child(_ray)
	_footstep_player = AudioStreamPlayer3D.new()
	_footstep_player.name = "Footsteps"
	_footstep_player.max_distance = 18
	add_child(_footstep_player)
	_footstep_player.stream = load("res://assets/audio/footstep.wav")
	_footstep_player.volume_db = -6.0


func _unhandled_input(event: InputEvent) -> void:
	if not control_enabled:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		_camera.rotate_x(-event.relative.y * mouse_sensitivity)
		_camera.rotation.x = clamp(_camera.rotation.x, deg_to_rad(-83), deg_to_rad(83))


func _physics_process(delta: float) -> void:
	if not control_enabled:
		velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)
		if not is_on_floor():
			velocity.y -= 9.8 * delta
		move_and_slide()
		return
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (global_transform.basis * Vector3(input.x, 0, input.y)).normalized()
	var sprinting := Input.is_action_pressed("sprint") and stamina > 0.0 and input.length() > 0.1
	var speed := sprint_speed if sprinting else walk_speed
	if sprinting:
		stamina = maxf(0.0, stamina - delta * 18.0)
	else:
		stamina = minf(100.0, stamina + delta * 12.0)
	var horizontal := Vector3(velocity.x, 0, velocity.z)
	var target := direction * speed
	horizontal = horizontal.move_toward(
		target, (17.0 if direction.length() > 0.0 else 20.0) * delta
	)
	velocity.x = horizontal.x
	velocity.z = horizontal.z
	if not is_on_floor():
		velocity.y -= 9.8 * delta
	else:
		velocity.y = -0.12
	move_and_slide()
	var moving := Vector2(velocity.x, velocity.z).length() > 0.55 and is_on_floor()
	if moving:
		_headbob += delta * (12.0 if sprinting else 8.5)
		_camera.position.y = 1.55 + sin(_headbob) * (0.034 if sprinting else 0.019)
		_step_clock -= delta
		if _step_clock <= 0.0:
			_step_clock = 0.34 if sprinting else 0.47
			_footstep_player.pitch_scale = randf_range(0.91, 1.08)
			_footstep_player.volume_db = -4.0 if sprinting else -8.0
			_footstep_player.play()
			noise_made.emit(global_position, 1.0 if sprinting else 0.46)
	else:
		_camera.position.y = move_toward(_camera.position.y, 1.55, delta * 0.12)


func camera() -> Camera3D:
	return _camera


func look_ray() -> RayCast3D:
	_ray.force_raycast_update()
	return _ray


func toggle_flashlight() -> void:
	flashlight_on = not flashlight_on
	_lamp.visible = flashlight_on


func set_flashlight(enabled: bool) -> void:
	flashlight_on = enabled
	_lamp.visible = enabled


func interaction_target() -> Object:
	_ray.force_raycast_update()
	return _ray.get_collider() if _ray.is_colliding() else null


func interact() -> String:
	var hit := interaction_target()
	if hit == null:
		return "Nothing close enough to reach."
	if hit.has_meta("door_root"):
		var door: HorrorDoor = hit.get_meta("door_root") as HorrorDoor
		if is_instance_valid(door):
			return door.interact()
	if hit.has_meta("document_id"):
		interaction_message.emit(str(hit.get_meta("document_id")))
		return "You carefully remove the brittle page."
	if hit.has_meta("archive_terminal"):
		interaction_message.emit("archive")
		return "The archive mechanism clicks awake."
	return "There is nothing useful to disturb."


func is_looking_at(
	world_point: Vector3, cone_cosine: float = 0.62, max_distance: float = 32.0
) -> bool:
	var offset := world_point - _camera.global_position
	if offset.length() > max_distance or offset.length() < 0.01:
		return false
	if _camera.global_basis.z.dot(offset.normalized()) > -cone_cosine:
		return false
	var query := PhysicsRayQueryParameters3D.create(_camera.global_position, world_point)
	query.exclude = [get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	return hit.is_empty() or hit.position.distance_to(world_point) < 0.75
