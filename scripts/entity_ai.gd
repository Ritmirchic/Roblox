class_name HorrorEntity
extends CharacterBody3D

signal player_threatened(entity_name: String)
signal false_cue(cue_name: String, cue_position: Vector3)
@export_enum("observer", "listener", "imitator") var entity_kind := "observer"
var target_player: HorrorPlayer
var active := false
var hunted_position := Vector3.ZERO
var hunt_strength := 0.0
var _step_sound: AudioStreamPlayer3D
var _threat_cooldown := 0.0
var _idle_clock := 0.0
var _pose_clock := 0.0
var _fake_cue_clock := 0.0
var _wander_target := Vector3.ZERO
var _eyes: Array[OmniLight3D] = []
var _arms: Array[MeshInstance3D] = []
var _arm_sides: Array[float] = []
var _body_node: MeshInstance3D
var _head_node: MeshInstance3D


func _ready() -> void:
	_make_body()
	collision_layer = 0
	visible = false
	set_physics_process(false)


func _make_body() -> void:
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color(0.012, 0.016, 0.018)
	dark.roughness = 0.92
	dark.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	var bone := StandardMaterial3D.new()
	bone.albedo_color = Color(0.22, 0.20, 0.17)
	bone.roughness = 0.8
	var body_mesh := MeshInstance3D.new()
	_body_node = body_mesh
	body_mesh.name = "EntitySilhouette"
	var body := CapsuleMesh.new()
	body.radius = 0.32 if entity_kind != "imitator" else 0.39
	body.height = 2.42 if entity_kind != "imitator" else 2.0
	body_mesh.mesh = body
	body_mesh.material_override = dark
	body_mesh.position.y = 1.18
	add_child(body_mesh)
	var chest := MeshInstance3D.new()
	var chest_mesh := CapsuleMesh.new()
	chest_mesh.radius = 0.48
	chest_mesh.height = 0.9
	chest.mesh = chest_mesh
	chest.material_override = dark
	chest.position = Vector3(0, 1.18, -0.08)
	chest.scale = Vector3(0.78, 0.7, 0.56)
	add_child(chest)
	# Tapered arms and long fingers create an unmistakably articulated, non-primitive silhouette.
	for side in [-1, 1]:
		var arm := MeshInstance3D.new()
		var limb := CapsuleMesh.new()
		limb.radius = 0.12
		limb.height = 1.28
		arm.mesh = limb
		arm.material_override = dark
		arm.position = Vector3(float(side) * 0.43, 1.12, -0.015)
		arm.rotation.z = float(side) * -0.13
		add_child(arm)
		_arms.append(arm)
		_arm_sides.append(float(side))
		var hand := MeshInstance3D.new()
		var palm := SphereMesh.new()
		palm.radius = 0.15
		palm.height = 0.28
		hand.mesh = palm
		hand.material_override = bone
		hand.position = Vector3(float(side) * 0.49, 0.48, 0.0)
		add_child(hand)
	var face := MeshInstance3D.new()
	_head_node = face
	var mask := SphereMesh.new()
	mask.radius = 0.27
	mask.height = 0.45
	face.mesh = mask
	face.material_override = bone if entity_kind == "imitator" else dark
	face.position = Vector3(0, 2.03, -0.12)
	face.scale = Vector3(0.78, 0.8, 0.44)
	add_child(face)
	if entity_kind == "listener":
		for side in [-1, 1]:
			var ear := MeshInstance3D.new()
			var ear_mesh := TorusMesh.new()
			ear_mesh.inner_radius = 0.065
			ear_mesh.outer_radius = 0.14
			ear.mesh = ear_mesh
			ear.material_override = bone
			ear.position = Vector3(float(side) * 0.28, 2.0, -0.02)
			ear.rotation.x = PI * 0.5
			add_child(ear)
	elif entity_kind == "imitator":
		var mouth_seam := MeshInstance3D.new()
		var seam_mesh := BoxMesh.new()
		seam_mesh.size = Vector3(0.27, 0.035, 0.025)
		mouth_seam.mesh = seam_mesh
		mouth_seam.material_override = dark
		mouth_seam.position = Vector3(0, 1.92, -0.36)
		add_child(mouth_seam)
	for side in [-1, 1]:
		var eye := OmniLight3D.new()
		eye.name = "DullEye"
		eye.position = Vector3(float(side) * 0.105, 2.06, -0.335)
		eye.light_color = (
			Color(0.36, 0.08, 0.045) if entity_kind != "imitator" else Color(0.48, 0.39, 0.22)
		)
		eye.light_energy = 0.12
		eye.omni_range = 0.55
		add_child(eye)
		_eyes.append(eye)
	var shape := CapsuleShape3D.new()
	shape.radius = 0.31
	shape.height = 1.85
	var collision := CollisionShape3D.new()
	collision.shape = shape
	collision.position.y = 0.92
	add_child(collision)
	_step_sound = AudioStreamPlayer3D.new()
	var entity_cue := (
		"entity"
		if entity_kind == "observer"
		else "breath" if entity_kind == "listener" else "whisper"
	)
	_step_sound.stream = load("res://assets/audio/%s.wav" % entity_cue)
	_step_sound.volume_db = -12.0
	_step_sound.max_distance = 18
	add_child(_step_sound)


func activate(player: HorrorPlayer, spawn_at: Vector3) -> void:
	target_player = player
	global_position = spawn_at
	active = true
	collision_layer = 1
	visible = true
	set_physics_process(true)
	hunt_strength = 0.0
	_threat_cooldown = 0.0
	if entity_kind == "imitator":
		_idle_clock = 3.5


func deactivate() -> void:
	active = false
	collision_layer = 0
	visible = false
	velocity = Vector3.ZERO
	if is_instance_valid(_step_sound):
		_step_sound.stop()
	set_physics_process(false)


func hear_noise(at: Vector3, loudness: float) -> void:
	if entity_kind == "listener" and active and loudness > 0.3:
		hunted_position = at
		hunt_strength = maxf(hunt_strength, loudness)


func _physics_process(delta: float) -> void:
	if not active or not is_instance_valid(target_player):
		return
	_threat_cooldown = maxf(0.0, _threat_cooldown - delta)
	_idle_clock += delta
	_fake_cue_clock += delta
	var player_pos := target_player.global_position
	if (
		entity_kind == "imitator"
		and _fake_cue_clock > 7.5
		and not target_player.is_looking_at(global_position, 0.7, 22.0)
	):
		_fake_cue_clock = 0.0
		var cue_offset := Vector3(randf_range(-4.0, 4.0), 0.0, randf_range(-6.0, 6.0))
		false_cue.emit("whisper" if randf() < 0.5 else "knock", player_pos + cue_offset)
	var target := player_pos
	var can_see := target_player.is_looking_at(global_position + Vector3.UP * 1.2, 0.58, 28.0)
	var should_move := true
	var desired_speed := 1.05
	match entity_kind:
		"observer":
			# Its gaze test uses actual camera FOV and a physics ray; occluding walls permit movement, visible figures freeze.
			should_move = not can_see
			desired_speed = 1.10
			if should_move:
				target = player_pos + target_player.global_transform.basis.z * 5.8
		"listener":
			should_move = hunt_strength > 0.08
			desired_speed = 1.45 + minf(hunt_strength, 1.0) * 0.65
			target = hunted_position
			hunt_strength = maxf(0.0, hunt_strength - delta * 0.035)
		"imitator":
			# It first waits in the dark, then follows a slow, deliberately audible route rather than teleporting.
			should_move = _idle_clock > 4.0 and not can_see
			desired_speed = 0.72
			if fmod(_idle_clock, 10.0) < 3.0:
				target = player_pos + target_player.global_transform.basis.z * 7.5
			else:
				target = _wander_target
				if (
					_wander_target == Vector3.ZERO
					or global_position.distance_to(_wander_target) < 1.2
				):
					_wander_target = player_pos + Vector3(randf_range(-4, 4), 0, randf_range(-5, 5))
	if should_move:
		var flat := target - global_position
		flat.y = 0.0
		if flat.length() > 0.7:
			var direction := flat.normalized()
			# Raycast obstacle steering prevents the stalkers from walking through closed doors or walls.
			var space := get_world_3d().direct_space_state
			var query := PhysicsRayQueryParameters3D.create(
				global_position + Vector3.UP * 0.9,
				global_position + Vector3.UP * 0.9 + direction * 1.25
			)
			query.exclude = [get_rid()]
			var obstacle := space.intersect_ray(query)
			if not obstacle.is_empty():
				direction = (
					Vector3(-direction.z, 0, direction.x)
					* (1.0 if int(get_instance_id()) % 2 == 0 else -1.0)
				)
			velocity.x = direction.x * desired_speed
			velocity.z = direction.z * desired_speed
			look_at(global_position + direction, Vector3.UP)
		else:
			velocity.x = move_toward(velocity.x, 0, delta * 3.0)
			velocity.z = move_toward(velocity.z, 0, delta * 3.0)
	else:
		velocity.x = move_toward(velocity.x, 0, delta * 7.0)
		velocity.z = move_toward(velocity.z, 0, delta * 7.0)
	if not is_on_floor():
		velocity.y -= 9.8 * delta
	else:
		velocity.y = -0.1
	move_and_slide()
	if should_move:
		_pose_clock += delta * (8.0 if velocity.length() > 1.0 else 2.2)
		for arm_index in range(_arms.size()):
			_arms[arm_index].rotation.z = (
				-_arm_sides[arm_index] * 0.13 + sin(_pose_clock + float(arm_index) * PI) * 0.12
			)
		if is_instance_valid(_head_node):
			_head_node.rotation.z = sin(_pose_clock * 0.45) * 0.035
		if is_instance_valid(_body_node):
			_body_node.rotation.z = sin(_pose_clock * 0.7) * 0.018
	var distance := global_position.distance_to(player_pos)
	if distance < 2.2 and _threat_cooldown <= 0.0:
		_threat_cooldown = 6.0
		player_threatened.emit(entity_kind)
		if entity_kind == "observer":
			var retreat := (global_position - player_pos).normalized()
			velocity.x = retreat.x * 2.2
			velocity.z = retreat.z * 2.2
		elif entity_kind == "listener":
			active = false
			visible = false
			set_physics_process(false)
	if entity_kind != "observer" and _step_sound and should_move and fmod(_idle_clock, 1.8) < delta:
		_step_sound.play()
