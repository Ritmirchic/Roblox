class_name VelocityCar
extends RigidBody3D

signal reset_requested

const WHEEL_RADIUS := 0.34
const SUSPENSION_REST := 0.43
const SUSPENSION_STIFFNESS := 30000.0
const SUSPENSION_DAMPING := 3600.0
const MAX_GRIP := 1.18
const ENGINE_FORCE := 7600.0
const BRAKE_FORCE := 12500.0
const GEAR_SPEEDS := [12.0, 20.0, 31.0, 44.0, 58.0, 76.0]

@export var paint_color := Color("20c5c5")
@export var drivetrain := "RWD"
@export var power_multiplier := 1.0
@export var grip_multiplier := 1.0
@export var suspension_multiplier := 1.0
var gear := 1
var is_reversing := false
var rpm := 950.0
var camera_mode := 0
var wheel_steer := 0.0
var throttle_value := 0.0
var brake_value := 0.0
var handbrake_value := 0.0
var ai_enabled := false
var ai_hold := false
var controls_locked := false
var ai_route: Array[Vector3] = []
var ai_target_index := 0
var ai_speed_limit := 27.0
var wheel_nodes: Array[Node3D] = []
var wheel_anchors: Array[Vector3] = [
	Vector3(-0.86, 0.04, -1.32),
	Vector3(0.86, 0.04, -1.32),
	Vector3(-0.86, 0.04, 1.32),
	Vector3(0.86, 0.04, 1.32)
]
var wheel_lengths: Array[float] = [
	SUSPENSION_REST, SUSPENSION_REST, SUSPENSION_REST, SUSPENSION_REST
]
var cameras: Array[Camera3D] = []
var engine_audio: AudioStreamPlayer3D
var body_color_material: StandardMaterial3D


func _ready() -> void:
	mass = 1320.0
	gravity_scale = 1.0
	linear_damp = 0.04
	angular_damp = 1.15
	continuous_cd = true
	can_sleep = false
	max_contacts_reported = 8
	contact_monitor = true
	_build_visuals()
	_build_cameras()
	_build_audio()


func _physics_process(delta: float) -> void:
	if Input.is_action_just_pressed("change_camera") and not ai_enabled:
		cycle_camera()
	if Input.is_action_just_pressed("reset_car") and not ai_enabled:
		reset_requested.emit()
	if ai_enabled:
		_update_ai_controls()
	elif controls_locked:
		throttle_value = 0.0
		brake_value = 1.0
		handbrake_value = 0.0
		is_reversing = false
	else:
		var accelerate_input := Input.get_action_strength("accelerate")
		var brake_input := Input.get_action_strength("brake")
		var forward_speed := linear_velocity.dot(-global_transform.basis.z)
		if brake_input > 0.05 and forward_speed < 1.4:
			throttle_value = -brake_input
			brake_value = 0.0
		else:
			throttle_value = accelerate_input
			brake_value = brake_input
		is_reversing = throttle_value < -0.1
		var left := Input.get_action_strength("steer_left")
		var right := Input.get_action_strength("steer_right")
		var steer_limit := lerpf(0.62, 0.22, clampf(linear_velocity.length() / 42.0, 0.0, 1.0))
		wheel_steer = move_toward(wheel_steer, (left - right) * steer_limit, delta * 2.4)
		handbrake_value = Input.get_action_strength("handbrake")
	_update_drivetrain()
	_update_wheels(delta)
	if Input.is_action_just_pressed("shift_up") and not ai_enabled:
		gear = mini(gear + 1, GEAR_SPEEDS.size())
	if Input.is_action_just_pressed("shift_down") and not ai_enabled:
		gear = maxi(gear - 1, 1)
	_update_audio()


func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	var speed := state.linear_velocity.length()
	var chassis_transform := state.transform
	var up := chassis_transform.basis.y
	var drive_total := ENGINE_FORCE * power_multiplier * throttle_value
	var driven_wheels := 0
	for i in range(4):
		if (
			drivetrain == "AWD"
			or (drivetrain == "FWD" and i < 2)
			or (drivetrain == "RWD" and i >= 2)
		):
			driven_wheels += 1
	var active_wheels := 0
	for i in range(4):
		var local_anchor: Vector3 = wheel_anchors[i]
		var anchor := chassis_transform * local_anchor
		var ray_start := anchor + up * 0.22
		var ray_end := anchor - up * 1.1
		var query := PhysicsRayQueryParameters3D.create(ray_start, ray_end)
		query.exclude = [get_rid()]
		query.collision_mask = 1
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		var wheel_node: Node3D = wheel_nodes[i]
		if hit.is_empty():
			wheel_lengths[i] = move_toward(
				wheel_lengths[i], SUSPENSION_REST + 0.18, 5.0 * get_physics_process_delta_time()
			)
			wheel_node.position = local_anchor - Vector3.UP * wheel_lengths[i]
			continue
		active_wheels += 1
		var hit_point: Vector3 = hit.position
		var suspension_length := clampf(ray_start.distance_to(hit_point) - 0.56, 0.12, 0.66)
		wheel_lengths[i] = suspension_length
		var point_velocity := (
			state.linear_velocity
			+ state.angular_velocity.cross(hit_point - chassis_transform.origin)
		)
		var spring_force := maxf(
			0.0,
			(
				(SUSPENSION_REST - suspension_length) * SUSPENSION_STIFFNESS * suspension_multiplier
				- point_velocity.dot(up) * SUSPENSION_DAMPING * sqrt(suspension_multiplier)
			)
		)
		state.apply_force(up * spring_force, hit_point - chassis_transform.origin)
		var is_front := i < 2
		var steer_angle := wheel_steer if is_front else 0.0
		var wheel_forward := -chassis_transform.basis.z.rotated(up, steer_angle)
		var wheel_right := chassis_transform.basis.x.rotated(up, steer_angle)
		var lateral_speed := point_velocity.dot(wheel_right)
		var longitudinal_speed := point_velocity.dot(wheel_forward)
		var normal_load := maxf(spring_force, mass * 9.8 / 4.0 * 0.45)
		var lateral_force := (
			-lateral_speed * (2400.0 if handbrake_value > 0.05 and i >= 2 else 3350.0)
		)
		var longitudinal_force := 0.0
		var driven := (
			drivetrain == "AWD"
			or (drivetrain == "FWD" and i < 2)
			or (drivetrain == "RWD" and i >= 2)
		)
		if driven and driven_wheels > 0:
			longitudinal_force += drive_total / float(driven_wheels)
		if brake_value > 0.0:
			longitudinal_force -= signf(longitudinal_speed) * brake_value * BRAKE_FORCE * 0.25
		if handbrake_value > 0.0 and i >= 2:
			longitudinal_force -= signf(longitudinal_speed) * handbrake_value * BRAKE_FORCE * 0.5
		var grip := MAX_GRIP * grip_multiplier
		if hit.collider != null and hit.collider.is_in_group("loose_surface"):
			grip = 0.72
		if handbrake_value > 0.1 and i >= 2:
			grip *= 0.62
		var force_limit := normal_load * grip
		var tire_force := Vector2(longitudinal_force, lateral_force)
		if tire_force.length() > force_limit:
			tire_force = tire_force.normalized() * force_limit
		state.apply_force(
			wheel_forward * tire_force.x + wheel_right * tire_force.y,
			hit_point - chassis_transform.origin
		)
		wheel_node.position = local_anchor - Vector3.UP * suspension_length
		wheel_node.rotation.y = steer_angle if is_front else 0.0
		var spin := longitudinal_speed * get_physics_process_delta_time() / WHEEL_RADIUS
		wheel_node.rotate_object_local(Vector3.RIGHT, spin)
	# Mild aerodynamic drag and downforce; all motion still comes from the rigid-body solver.
	state.apply_central_force(-state.linear_velocity * speed * 0.34)
	state.apply_central_force(-up * speed * speed * 0.62)
	if active_wheels == 0 and global_position.y < -8.0:
		state.linear_velocity = Vector3.ZERO


func _update_drivetrain() -> void:
	var forward_speed := absf(linear_velocity.dot(-global_transform.basis.z))
	if not ai_enabled:
		if rpm > 7200.0 and gear < GEAR_SPEEDS.size():
			gear += 1
		elif rpm < 1800.0 and gear > 1 and throttle_value < 0.2:
			gear -= 1
	var ratio_top: float = GEAR_SPEEDS[gear - 1]
	var load := clampf(forward_speed / ratio_top, 0.0, 1.2)
	rpm = lerpf(900.0, 7200.0, clampf(load + throttle_value * 0.14, 0.0, 1.0))


func _update_ai_controls() -> void:
	is_reversing = false
	if ai_hold:
		throttle_value = 0.0
		brake_value = 1.0
		handbrake_value = 0.0
		return
	if ai_route.is_empty():
		throttle_value = 0.0
		return
	var target: Vector3 = ai_route[ai_target_index % ai_route.size()]
	while global_position.distance_to(target) < 9.0:
		ai_target_index = (ai_target_index + 1) % ai_route.size()
		target = ai_route[ai_target_index]
	var local_target := global_transform.basis.inverse() * (target - global_position)
	var steer := clampf(atan2(local_target.x, -local_target.z) * 1.25, -1.0, 1.0)
	wheel_steer = move_toward(wheel_steer, -steer * 0.52, 0.045)
	var corner_factor := clampf(absf(steer) * 1.25, 0.0, 0.72)
	var target_speed := ai_speed_limit * (1.0 - corner_factor)
	var forward_speed := linear_velocity.dot(-global_transform.basis.z)
	throttle_value = 1.0 if forward_speed < target_speed else 0.12
	brake_value = 0.38 if forward_speed > target_speed + 4.0 else 0.0
	handbrake_value = 0.0


func _update_wheels(_delta: float) -> void:
	for i in range(wheel_nodes.size()):
		if wheel_lengths[i] > 0.0:
			wheel_nodes[i].position = wheel_anchors[i] - Vector3.UP * wheel_lengths[i]


func _update_audio() -> void:
	if engine_audio:
		engine_audio.pitch_scale = clampf(0.72 + rpm / 7200.0 * 0.9, 0.72, 1.65)
		engine_audio.volume_db = -8.0 + clampf(throttle_value, 0, 1) * 4.0


func _build_visuals() -> void:
	body_color_material = StandardMaterial3D.new()
	body_color_material.albedo_color = paint_color
	body_color_material.metallic = 0.72
	body_color_material.roughness = 0.23
	body_color_material.clearcoat_enabled = true
	body_color_material.clearcoat = 0.8
	body_color_material.clearcoat_roughness = 0.11
	body_color_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	var chassis := MeshInstance3D.new()
	chassis.name = "SculptedBody"
	chassis.mesh = _make_body_mesh()
	chassis.material_override = body_color_material
	add_child(chassis)
	var collider := CollisionShape3D.new()
	var collision_box := BoxShape3D.new()
	collision_box.size = Vector3(1.82, 0.72, 4.1)
	collider.shape = collision_box
	collider.position = Vector3(0, 0.43, 0.0)
	add_child(collider)
	_add_cabin()
	_add_trim()
	_add_interior()
	for i in range(4):
		var wheel := Node3D.new()
		wheel.name = "Wheel_%d" % i
		wheel.position = wheel_anchors[i] - Vector3.UP * SUSPENSION_REST
		add_child(wheel)
		_add_wheel(wheel, i)
		wheel_nodes.append(wheel)
	var headlight_material := StandardMaterial3D.new()
	headlight_material.albedo_color = Color("d7f4ec")
	headlight_material.emission_enabled = true
	headlight_material.emission = Color("94e6ed")
	headlight_material.emission_energy_multiplier = 1.3
	for x in [-0.58, 0.58]:
		_add_box(
			"LEDHeadlamp", Vector3(0.4, 0.15, 0.08), Vector3(x, 0.68, -2.0), headlight_material
		)
	var tail_material := StandardMaterial3D.new()
	tail_material.albedo_color = Color("ff4037")
	tail_material.emission_enabled = true
	tail_material.emission = Color("ed2119")
	tail_material.emission_energy_multiplier = 0.65
	for x in [-0.61, 0.61]:
		_add_box("TailLamp", Vector3(0.43, 0.12, 0.07), Vector3(x, 0.69, 2.0), tail_material)
	_add_camera_anchor()


func _make_body_mesh() -> ArrayMesh:
	# A shaped multi-section performance-coupe shell, not a box proxy.
	var sections := [
		[-2.14, 0.48, 0.38, 0.74],
		[-1.92, 0.75, 0.30, 0.93],
		[-1.42, 0.83, 0.25, 1.00],
		[-0.72, 0.82, 0.23, 0.95],
		[0.24, 0.80, 0.24, 0.88],
		[1.10, 0.79, 0.28, 0.87],
		[1.82, 0.72, 0.31, 0.96],
		[2.08, 0.53, 0.37, 0.78]
	]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(sections.size() - 1):
		var a: Array = sections[i]
		var b: Array = sections[i + 1]
		var va := [
			Vector3(-a[1], a[2], a[0]),
			Vector3(a[1], a[2], a[0]),
			Vector3(a[1] * 0.94, a[3], a[0]),
			Vector3(-a[1] * 0.94, a[3], a[0])
		]
		var vb := [
			Vector3(-b[1], b[2], b[0]),
			Vector3(b[1], b[2], b[0]),
			Vector3(b[1] * 0.94, b[3], b[0]),
			Vector3(-b[1] * 0.94, b[3], b[0])
		]
		for edge in range(4):
			var next := (edge + 1) % 4
			_add_mesh_triangle(st, va[edge], va[next], vb[edge])
			_add_mesh_triangle(st, va[next], vb[next], vb[edge])
	st.generate_normals()
	return st.commit()


func _add_mesh_triangle(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	st.add_vertex(a)
	st.add_vertex(b)
	st.add_vertex(c)


func _add_cabin() -> void:
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.10, 0.20, 0.25, 0.76)
	glass.metallic = 0.36
	glass.roughness = 0.13
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass.cull_mode = BaseMaterial3D.CULL_DISABLED
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var front_bottom_l := Vector3(-0.69, 0.87, -0.84)
	var front_bottom_r := Vector3(0.69, 0.87, -0.84)
	var front_top_l := Vector3(-0.50, 1.45, -0.20)
	var front_top_r := Vector3(0.50, 1.45, -0.20)
	var rear_bottom_l := Vector3(-0.68, 0.88, 1.19)
	var rear_bottom_r := Vector3(0.68, 0.88, 1.19)
	var rear_top_l := Vector3(-0.49, 1.43, 0.53)
	var rear_top_r := Vector3(0.49, 1.43, 0.53)
	_add_mesh_triangle(st, front_bottom_l, front_top_l, front_bottom_r)
	_add_mesh_triangle(st, front_bottom_r, front_top_l, front_top_r)
	_add_mesh_triangle(st, rear_bottom_l, rear_bottom_r, rear_top_l)
	_add_mesh_triangle(st, rear_bottom_r, rear_top_r, rear_top_l)
	_add_mesh_triangle(st, front_bottom_l, rear_bottom_l, front_top_l)
	_add_mesh_triangle(st, rear_bottom_l, rear_top_l, front_top_l)
	_add_mesh_triangle(st, front_bottom_r, front_top_r, rear_bottom_r)
	_add_mesh_triangle(st, rear_bottom_r, front_top_r, rear_top_r)
	_add_mesh_triangle(st, front_top_l, rear_top_l, front_top_r)
	_add_mesh_triangle(st, front_top_r, rear_top_l, rear_top_r)
	st.generate_normals()
	var shell := MeshInstance3D.new()
	shell.name = "PanoramicGlassCabin"
	shell.mesh = st.commit()
	shell.material_override = glass
	add_child(shell)
	_add_box("FloatingRoof", Vector3(0.96, 0.10, 0.80), Vector3(0, 1.45, 0.16), body_color_material)


func _add_trim() -> void:
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color("171e22")
	dark.metallic = 0.42
	dark.roughness = 0.34
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color("a7b4b8")
	metal.metallic = 0.82
	metal.roughness = 0.24
	for x in [-0.77, 0.77]:
		_add_box("SideSkirt", Vector3(0.12, 0.14, 2.55), Vector3(x, 0.28, 0.03), dark)
		_add_box("MirrorStem", Vector3(0.08, 0.22, 0.18), Vector3(x * 1.03, 1.0, -0.78), dark)
		_add_box(
			"MirrorCap",
			Vector3(0.23, 0.12, 0.30),
			Vector3(x * 1.15, 1.04, -0.78),
			body_color_material
		)
	_add_box("FrontSplitter", Vector3(1.58, 0.08, 0.32), Vector3(0, 0.24, -2.04), dark)
	_add_box("RearDiffuser", Vector3(1.3, 0.12, 0.32), Vector3(0, 0.24, 1.93), dark)
	_add_box("RearWing", Vector3(1.42, 0.09, 0.30), Vector3(0, 1.03, 1.74), dark)
	for x in [-0.35, 0.35]:
		_add_cylinder("Exhaust", 0.11, 0.24, Vector3(x, 0.37, 2.06), metal, Vector3(PI / 2.0, 0, 0))
	# Fine hood louvers and the front grille add visual scale at close range.
	for i in range(5):
		_add_box(
			"HoodLouver", Vector3(0.035, 0.018, 0.32), Vector3(-0.26 + i * 0.13, 0.89, -1.55), dark
		)
	_add_box("FrontGrille", Vector3(0.72, 0.20, 0.055), Vector3(0, 0.46, -2.13), dark)


func _add_interior() -> void:
	var cabin_dark := _material(Color("171e24"), 0.08, 0.75)
	var seat_mat := _material(Color("28363b"), 0.05, 0.86)
	_add_box("Dashboard", Vector3(1.43, 0.20, 0.42), Vector3(0, 0.82, -0.52), cabin_dark)
	_add_box(
		"InstrumentCluster",
		Vector3(0.55, 0.18, 0.08),
		Vector3(-0.34, 0.95, -0.72),
		_emissive(Color("6de3d4"), Color("188f91"))
	)
	_add_box(
		"CenterDisplay",
		Vector3(0.24, 0.22, 0.045),
		Vector3(0.28, 0.94, -0.71),
		_emissive(Color("77a8b4"), Color("246278"))
	)
	_add_box("CenterConsole", Vector3(0.43, 0.18, 0.76), Vector3(0.24, 0.57, 0.04), cabin_dark)
	for x in [-0.43, 0.43]:
		_add_box("SportSeat", Vector3(0.48, 0.66, 0.58), Vector3(x, 0.54, 0.58), seat_mat)
		_add_box("SeatHeadrest", Vector3(0.40, 0.24, 0.22), Vector3(x, 0.96, 0.66), seat_mat)
		_add_box("DoorTrim", Vector3(0.10, 0.35, 1.24), Vector3(x * 1.55, 0.67, 0.18), cabin_dark)
	_add_steering_wheel()
	for x in [-0.28, 0.0, 0.28]:
		_add_box(
			"Pedal",
			Vector3(0.12, 0.05, 0.17),
			Vector3(x, 0.18, -0.5),
			_material(Color("828b8c"), 0.55, 0.42)
		)


func _add_steering_wheel() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var center := Vector3(-0.39, 0.77, -0.47)
	var radius := 0.23
	var tube := 0.027
	for i in range(28):
		var a0 := TAU * float(i) / 28.0
		var a1 := TAU * float(i + 1) / 28.0
		var p0 := center + Vector3(cos(a0) * radius, sin(a0) * radius, 0)
		var p1 := center + Vector3(cos(a1) * radius, sin(a1) * radius, 0)
		var p2 := center + Vector3(cos(a1) * (radius - tube), sin(a1) * (radius - tube), 0)
		var p3 := center + Vector3(cos(a0) * (radius - tube), sin(a0) * (radius - tube), 0)
		_add_mesh_triangle(st, p0, p1, p2)
		_add_mesh_triangle(st, p0, p2, p3)
	st.generate_normals()
	var rim := MeshInstance3D.new()
	rim.name = "SteeringWheel"
	rim.mesh = st.commit()
	rim.material_override = _material(Color("161a1d"), 0.1, 0.82)
	add_child(rim)
	_add_box(
		"SteeringColumn",
		Vector3(0.08, 0.08, 0.3),
		Vector3(-0.39, 0.76, -0.32),
		_material(Color("33393b"), 0.65, 0.48)
	)


func _add_wheel(parent: Node3D, _index: int) -> void:
	var tire := StandardMaterial3D.new()
	tire.albedo_color = Color("161a1c")
	tire.roughness = 0.87
	var rubber := TorusMesh.new()
	rubber.inner_radius = 0.20
	rubber.outer_radius = WHEEL_RADIUS
	rubber.rings = 20
	rubber.ring_segments = 12
	var tire_node := MeshInstance3D.new()
	tire_node.name = "PerformanceTire"
	tire_node.mesh = rubber
	tire_node.rotation.z = PI / 2.0
	tire_node.material_override = tire
	parent.add_child(tire_node)
	var rim_mesh := CylinderMesh.new()
	rim_mesh.top_radius = 0.205
	rim_mesh.bottom_radius = 0.205
	rim_mesh.height = 0.20
	rim_mesh.radial_segments = 24
	var rim_mat := StandardMaterial3D.new()
	rim_mat.albedo_color = Color("aebbc0")
	rim_mat.metallic = 0.86
	rim_mat.roughness = 0.24
	var rim_node := MeshInstance3D.new()
	rim_node.name = "ForgedAlloyRim"
	rim_node.mesh = rim_mesh
	rim_node.rotation.z = PI / 2.0
	rim_node.material_override = rim_mat
	parent.add_child(rim_node)
	var hub := MeshInstance3D.new()
	var hub_mesh := CylinderMesh.new()
	hub_mesh.top_radius = 0.065
	hub_mesh.bottom_radius = 0.065
	hub_mesh.height = 0.23
	hub_mesh.radial_segments = 16
	hub.mesh = hub_mesh
	hub.rotation.z = PI / 2.0
	hub.material_override = _material(Color("edaa5a"), 0.65, 0.3)
	parent.add_child(hub)
	for spoke in range(5):
		var angle := TAU * float(spoke) / 5.0
		var bar := MeshInstance3D.new()
		var spoke_mesh := BoxMesh.new()
		spoke_mesh.size = Vector3(0.035, 0.30, 0.045)
		bar.mesh = spoke_mesh
		bar.position = Vector3(0.115, cos(angle) * 0.11, sin(angle) * 0.11)
		bar.rotation.x = angle
		bar.material_override = rim_mat
		parent.add_child(bar)


func _add_camera_anchor() -> void:
	var chase_anchor := Node3D.new()
	chase_anchor.name = "ChaseCameraAnchor"
	chase_anchor.position = Vector3(0, 1.32, 0.08)
	add_child(chase_anchor)
	var arm := SpringArm3D.new()
	arm.name = "ChaseCameraArm"
	arm.spring_length = 7.0
	arm.margin = 0.25
	arm.collision_mask = 1
	arm.position = Vector3(0, 0.45, 0)
	chase_anchor.add_child(arm)
	var chase := Camera3D.new()
	chase.name = "ChaseCamera"
	chase.fov = 72
	arm.add_child(chase)
	cameras.append(chase)
	var close_arm := SpringArm3D.new()
	close_arm.name = "CloseChaseArm"
	close_arm.spring_length = 4.4
	close_arm.margin = 0.2
	close_arm.position = Vector3(0, 0.45, 0)
	chase_anchor.add_child(close_arm)
	var close_cam := Camera3D.new()
	close_cam.fov = 78
	close_arm.add_child(close_cam)
	cameras.append(close_cam)
	var hood := Camera3D.new()
	hood.name = "HoodCamera"
	hood.position = Vector3(0, 1.14, -1.08)
	hood.fov = 84
	add_child(hood)
	cameras.append(hood)
	var cockpit := Camera3D.new()
	cockpit.name = "CockpitCamera"
	cockpit.position = Vector3(-0.30, 1.10, -0.08)
	cockpit.fov = 76
	add_child(cockpit)
	cameras.append(cockpit)
	set_camera_mode(0)


func _build_cameras() -> void:
	pass


func set_camera_mode(mode: int) -> void:
	camera_mode = posmod(mode, cameras.size())
	for i in range(cameras.size()):
		cameras[i].current = i == camera_mode
	if camera_mode == 0:
		cameras[0].get_parent().spring_length = 7.0


func cycle_camera() -> void:
	set_camera_mode(camera_mode + 1)


func _build_audio() -> void:
	engine_audio = AudioStreamPlayer3D.new()
	engine_audio.name = "EngineAudio"
	engine_audio.max_distance = 90.0
	engine_audio.unit_size = 12.0
	engine_audio.volume_db = -7.0
	var stream := load("res://assets/engine_loop.wav") as AudioStreamWAV
	if stream:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		engine_audio.stream = stream
		engine_audio.play()
	add_child(engine_audio)


func apply_paint(color: Color) -> void:
	paint_color = color
	if body_color_material:
		body_color_material.albedo_color = color


func reset_to(position: Vector3, facing: Vector3 = Vector3.FORWARD) -> void:
	global_position = position
	var direction := Vector3(facing.x, 0.0, facing.z).normalized()
	if direction.length() > 0.01:
		look_at(global_position + direction, Vector3.UP)
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	sleeping = false


func speed_kph() -> float:
	return linear_velocity.length() * 3.6


func _add_box(node_name: String, size: Vector3, pos: Vector3, mat: Material) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var box := BoxMesh.new()
	box.size = size
	instance.mesh = box
	instance.position = pos
	instance.material_override = mat
	add_child(instance)
	return instance


func _add_cylinder(
	node_name: String, radius: float, height: float, pos: Vector3, mat: Material, rot: Vector3
) -> void:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = radius
	cylinder.bottom_radius = radius
	cylinder.height = height
	instance.mesh = cylinder
	instance.position = pos
	instance.rotation = rot
	instance.material_override = mat
	add_child(instance)


func _material(color: Color, metallic: float, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.metallic = metallic
	material.roughness = roughness
	return material


func _emissive(color: Color, glow: Color) -> StandardMaterial3D:
	var material := _material(color, 0.1, 0.42)
	material.emission_enabled = true
	material.emission = glow
	material.emission_energy_multiplier = 1.5
	return material
