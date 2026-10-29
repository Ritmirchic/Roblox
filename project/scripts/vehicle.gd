extends RigidBody3D
class_name VelocityCar

const WHEEL_RADIUS := 0.39
const SUSPENSION_REST := 0.68
const MAX_RAY := 1.03
const WHEEL_ANCHORS := [
	Vector3(-0.78, -0.40, -1.25),
	Vector3(0.78, -0.40, -1.25),
	Vector3(-0.78, -0.40, 1.22),
	Vector3(0.78, -0.40, 1.22)
]
const GEAR_RATIOS := [3.1, 2.18, 1.56, 1.2, 0.96, 0.78]
const FINAL_DRIVE := 3.65

var car_id := "aurora_gt"
var car_name := "Asterion GT"
var paint := Color("#d84839")
var drivetrain := "RWD"
var mass_kg := 1380.0
var max_power := 355.0
var max_speed_kph := 278.0
var handling := 1.0
var engine_tone := 1.0
var current_gear := 1
var rpm := 900.0
var throttle_input := 0.0
var brake_input := 0.0
var steer_input := 0.0
var handbrake_input := false
var ai_enabled := false
var ai_waypoints: Array[Vector3] = []
var ai_index := 0
var ai_laps := 0
var ai_skill := 0.8
var camera_mode := 0
var _steer_angle := 0.0
var _wheel_spin := [0.0, 0.0, 0.0, 0.0]
var _paint_material: StandardMaterial3D
var _speed_meter := 0.0
var is_reversing := false
var wet_road := false
var night_mode := false
var photo_mode := false
var _photo_yaw := 0.0
var _photo_pitch := 0.12
var _photo_distance := 5.2
var _engine_player: AudioStreamPlayer
var _engine_playback: AudioStreamGeneratorPlayback
var _audio_phase := 0.0
var _audio_sample_rate := 22050.0
var _audio_gain := 0.0
var _camera: Camera3D
var _body_visual: Node3D
var _wheel_visuals: Array[Node3D] = []
var _headlights: Array[OmniLight3D] = []
var _steering_wheel: MeshInstance3D
var _cluster_needle: MeshInstance3D


func setup(config: Dictionary) -> void:
	car_id = str(config.get("id", "aurora_gt"))
	car_name = str(config.get("name", "Asterion GT"))
	paint = config.get("paint", Color("#d84839"))
	drivetrain = str(config.get("drive", "RWD"))
	mass_kg = float(config.get("mass", 1380.0))
	max_power = float(config.get("power", 355.0))
	max_speed_kph = float(config.get("max_speed", 278.0))
	handling = float(config.get("handling", 1.0))
	engine_tone = float(config.get("tone", 1.0))
	mass = mass_kg


func _ready() -> void:
	can_sleep = false
	continuous_cd = true
	contact_monitor = true
	max_contacts_reported = 8
	linear_damp = 0.04
	angular_damp = 1.2
	_build_physics()
	_build_car_model()
	_build_camera()
	_build_audio()


func _build_physics() -> void:
	var body_shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.72, 0.68, 3.72)
	body_shape.shape = box
	body_shape.position = Vector3(0, 0.08, 0)
	add_child(body_shape)


func _mat(color: Color, roughness: float, metallic: float = 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	m.metallic = metallic
	return m


func _build_car_model() -> void:
	_body_visual = Node3D.new()
	_body_visual.position.y = 0.0
	add_child(_body_visual)
	_paint_material = StandardMaterial3D.new()
	_paint_material.albedo_color = paint
	_paint_material.metallic = 0.72
	_paint_material.roughness = 0.23
	_paint_material.clearcoat_enabled = true
	_paint_material.clearcoat = 0.92
	_paint_material.clearcoat_roughness = 0.12
	_paint_material.ior = 1.48
	# Sculpted continuous lower shell; tapered cross-sections make the whole body original and non-boxy.
	var stations := [
		[-2.03, 0.67, -0.14, 0.18],
		[-1.78, 0.83, -0.29, 0.45],
		[-1.27, 0.91, -0.34, 0.54],
		[-0.58, 0.96, -0.37, 0.54],
		[0.46, 0.96, -0.37, 0.53],
		[1.17, 0.87, -0.29, 0.43],
		[1.78, 0.73, -0.12, 0.25],
		[2.00, 0.60, -0.06, 0.12]
	]
	var body_mesh := _loft(stations)
	var body := MeshInstance3D.new()
	body.mesh = body_mesh
	body.material_override = _paint_material
	_body_visual.add_child(body)
	# Upper cabin glasshouse, angular but softly rounded by a 12-sided loft.
	var cabin_stations := [
		[-1.13, 0.75, 0.46, 0.57],
		[-0.63, 0.68, 0.55, 1.10],
		[0.33, 0.67, 0.55, 1.14],
		[0.97, 0.78, 0.43, 0.61]
	]
	var cabin := MeshInstance3D.new()
	cabin.mesh = _loft(cabin_stations)
	var cabin_glass := _mat(Color(0.24, 0.38, 0.45, 0.34), 0.19, 0.38)
	cabin_glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	cabin.material_override = cabin_glass
	_body_visual.add_child(cabin)
	# Windshield and rear glass; glossy cyan-black glazing is kept separated from paint.
	var glass := _mat(Color(0.28, 0.46, 0.53, 0.38), 0.12, 0.46)
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var front_glass := _panel(Vector3(1.22, 0.035, 0.82), Vector3(0, 0.85, -0.82), glass)
	front_glass.rotation.x = -0.56
	_body_visual.add_child(front_glass)
	var rear_glass := _panel(Vector3(1.18, 0.035, 0.72), Vector3(0, 0.85, 0.64), glass)
	rear_glass.rotation.x = 0.56
	_body_visual.add_child(rear_glass)
	# Hood power creases, sculpted side sills, wing mirrors, handles and bumpers.
	var accent := _mat(Color("#9caab0"), 0.29, 0.72)
	var black := _mat(Color("#11191d"), 0.32, 0.22)
	for side in [-1.0, 1.0]:
		var sill := _panel(Vector3(0.12, 0.16, 2.22), Vector3(side * 0.88, -0.17, 0.04), black)
		sill.rotation.x = 0.02
		_body_visual.add_child(sill)
		var crease := _panel(
			Vector3(0.035, 0.035, 1.72), Vector3(side * 0.915, 0.14, -0.02), accent
		)
		_body_visual.add_child(crease)
		var mirror_stem := _panel(
			Vector3(0.075, 0.07, 0.25), Vector3(side * 0.79, 0.50, -0.78), black
		)
		mirror_stem.rotation.x = 0.15
		_body_visual.add_child(mirror_stem)
		var mirror := _panel(
			Vector3(0.22, 0.13, 0.32),
			Vector3(side * 0.91, 0.56, -0.72),
			_mat(paint.lightened(0.12), 0.22, 0.55)
		)
		mirror.rotation.y = side * 0.12
		_body_visual.add_child(mirror)
		var door_handle := _panel(
			Vector3(0.21, 0.045, 0.06), Vector3(side * 0.968, 0.26, 0.22), accent
		)
		_body_visual.add_child(door_handle)
	for side in [-1.0, 1.0]:
		var crease_line := _panel(
			Vector3(0.055, 0.045, 0.76),
			Vector3(side * 0.34, 0.405, -1.35),
			_mat(paint.lightened(0.18), 0.3, 0.68)
		)
		_body_visual.add_child(crease_line)
	# Front splitter, rear diffuser and a restrained performance wing.
	var splitter := _panel(Vector3(1.55, 0.08, 0.28), Vector3(0, -0.28, -1.91), black)
	_body_visual.add_child(splitter)
	var diffuser := _panel(Vector3(1.42, 0.16, 0.3), Vector3(0, -0.27, 1.79), black)
	_body_visual.add_child(diffuser)
	for side in [-1.0, 1.0]:
		var wing_support := _panel(
			Vector3(0.08, 0.28, 0.08), Vector3(side * 0.51, 0.40, 1.51), black
		)
		_body_visual.add_child(wing_support)
	var wing := _panel(
		Vector3(1.4, 0.1, 0.25), Vector3(0, 0.55, 1.52), _mat(paint.darkened(0.08), 0.22, 0.6)
	)
	_body_visual.add_child(wing)
	# LED headlamp signatures, tail lamps, exhaust tips, emblems and lower grille.
	for side in [-1.0, 1.0]:
		var lamp := _panel(
			Vector3(0.43, 0.11, 0.17),
			Vector3(side * 0.54, 0.22, -1.92),
			_mat(Color("#d9f4ee"), 0.16, 0.12)
		)
		lamp.rotation.y = side * 0.1
		_body_visual.add_child(lamp)
		var tail := _panel(
			Vector3(0.63, 0.12, 0.13),
			Vector3(side * 0.48, 0.24, 1.86),
			_mat(Color("#ff493f"), 0.16, 0.12)
		)
		_body_visual.add_child(tail)
		var exhaust := _cylinder(0.1, 0.12, Vector3(side * 0.48, -0.2, 1.91), accent)
		exhaust.rotation.x = PI / 2
		_body_visual.add_child(exhaust)
	var grille := _panel(Vector3(0.72, 0.23, 0.06), Vector3(0, -0.03, -1.98), black)
	_body_visual.add_child(grille)
	var emblem := _panel(Vector3(0.15, 0.045, 0.035), Vector3(0, 0.27, -1.93), accent)
	_body_visual.add_child(emblem)
	# The race, rally and electric trims share the carefully built base shell but receive distinct hardware.
	if car_id == "coast_rally":
		_body_visual.scale = Vector3(1.04, 1.09, 1.02)
		for side in [-1.0, 1.0]:
			var roof_bar := _panel(
				Vector3(0.07, 0.06, 1.25), Vector3(side * 0.51, 1.17, -0.15), black
			)
			_body_visual.add_child(roof_bar)
		for i in range(5):
			var rally_lamp := _panel(
				Vector3(0.17, 0.16, 0.16),
				Vector3(-0.38 + i * 0.19, 1.2, -1.04),
				_mat(Color("#f6edc8"), 0.18, 0.1)
			)
			_body_visual.add_child(rally_lamp)
	elif car_id == "voltage_s":
		_body_visual.scale = Vector3(1.02, 0.96, 1.02)
		var battery_skid := _panel(
			Vector3(1.24, 0.12, 1.35), Vector3(0, -0.36, 0.18), _mat(Color("#25383a"), 0.52, 0.42)
		)
		_body_visual.add_child(battery_skid)
		var lightbar := _panel(
			Vector3(1.2, 0.07, 0.12), Vector3(0, 0.26, -1.96), _mat(Color("#a6edf0"), 0.15, 0.1)
		)
		_body_visual.add_child(lightbar)
	# Detailed seat and cockpit are visible through the roof opening when the cockpit camera is selected.
	_build_interior(black, accent)
	_build_wheels(accent)
	# Active lamps are subtle in daylight but turn on for evening / tunnel visibility.
	for side in [-1.0, 1.0]:
		var light := OmniLight3D.new()
		light.position = Vector3(side * 0.5, 0.08, -2.0)
		light.light_color = Color("#b8e7ff")
		light.light_energy = 1.2
		light.omni_range = 24.0
		light.visible = false
		_body_visual.add_child(light)
		_headlights.append(light)
	var rear_light := OmniLight3D.new()
	rear_light.position = Vector3(0, 0.12, 1.9)
	rear_light.light_color = Color("#ff3a2d")
	rear_light.light_energy = 0.8
	rear_light.omni_range = 7.0
	rear_light.visible = false
	_body_visual.add_child(rear_light)


func _loft(stations: Array) -> ArrayMesh:
	# Each station: longitudinal Z, half-width, lower side Y, upper side Y.
	var vertices := PackedVector3Array()
	var uvs := PackedVector2Array()
	var indices := PackedInt32Array()
	const SIDES := 12
	for s in range(stations.size()):
		var row: Array = stations[s]
		for j in range(SIDES):
			var angle := TAU * float(j) / SIDES
			var taper := cos(angle)
			var y: float = (
				(float(row[2]) + float(row[3])) * 0.5
				+ sin(angle) * (float(row[3]) - float(row[2])) * 0.5
			)
			var x: float = taper * float(row[1])
			vertices.append(Vector3(x, y, float(row[0])))
			uvs.append(Vector2(float(j) / SIDES, float(s) / maxf(stations.size() - 1, 1)))
	for s in range(stations.size() - 1):
		for j in range(SIDES):
			var a := s * SIDES + j
			var b := s * SIDES + (j + 1) % SIDES
			var c := (s + 1) * SIDES + j
			var d := (s + 1) * SIDES + (j + 1) % SIDES
			indices.append_array(PackedInt32Array([a, b, c, b, d, c]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var st := SurfaceTool.new()
	st.create_from(mesh, 0)
	st.generate_normals()
	return st.commit()


func _panel(size: Vector3, at: Vector3, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var m := BoxMesh.new()
	m.size = size
	node.mesh = m
	node.position = at
	node.material_override = material
	return node


func _cylinder(top: float, bottom: float, at: Vector3, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var m := CylinderMesh.new()
	m.top_radius = top
	m.bottom_radius = bottom
	m.height = 0.24
	m.radial_segments = 16
	node.mesh = m
	node.position = at
	node.material_override = material
	return node


func _build_interior(black: Material, trim: Material) -> void:
	var interior := Node3D.new()
	interior.position.y = 0.47
	_body_visual.add_child(interior)
	for side in [-1.0, 1.0]:
		var seat := _panel(
			Vector3(0.52, 0.82, 0.48),
			Vector3(side * 0.34, 0.05, 0.35),
			_mat(Color("#323b40"), 0.76)
		)
		interior.add_child(seat)
		var headrest := _panel(
			Vector3(0.39, 0.3, 0.19), Vector3(side * 0.34, 0.52, 0.38), _mat(Color("#41484b"), 0.68)
		)
		interior.add_child(headrest)
	var dash := _panel(Vector3(1.36, 0.23, 0.42), Vector3(0, 0.20, -0.68), black)
	interior.add_child(dash)
	var cluster_face := _panel(
		Vector3(0.50, 0.18, 0.035), Vector3(-0.36, 0.37, -0.91), _mat(Color("#14242a"), 0.18, 0.32)
	)
	interior.add_child(cluster_face)
	_cluster_needle = _panel(
		Vector3(0.025, 0.12, 0.025), Vector3(-0.36, 0.37, -0.94), _mat(Color("#ff674e"), 0.24, 0.18)
	)
	interior.add_child(_cluster_needle)
	var screen := _panel(
		Vector3(0.38, 0.23, 0.035), Vector3(0, 0.29, -0.75), _mat(Color("#38c9c8"), 0.21, 0.05)
	)
	interior.add_child(screen)
	var console := _panel(Vector3(0.38, 0.17, 0.8), Vector3(0, 0.03, -0.05), black)
	interior.add_child(console)
	_steering_wheel = _cylinder(0.22, 0.22, Vector3(-0.35, 0.21, -0.51), trim)
	var steering := _steering_wheel
	steering.rotation.x = PI / 2
	steering.rotation.z = 0.06
	steering.scale = Vector3(1, 1, 0.07)
	interior.add_child(steering)
	var wheel_hub := _panel(Vector3(0.16, 0.15, 0.12), Vector3(-0.35, 0.21, -0.51), black)
	interior.add_child(wheel_hub)
	for x in [-0.48, -0.2]:
		var pedal := _panel(Vector3(0.08, 0.13, 0.08), Vector3(x, -0.19, -0.49), trim)
		pedal.rotation.x = -0.22
		interior.add_child(pedal)
	# Door tops and rear bulkhead are deliberately distinct materials from the body shell.
	for side in [-1.0, 1.0]:
		var door := _panel(Vector3(0.12, 0.37, 1.34), Vector3(side * 0.68, 0.02, 0.1), black)
		interior.add_child(door)


func _build_wheels(accent: Material) -> void:
	var rubber := _mat(Color("#171a1b"), 0.84)
	var alloy := _mat(Color("#c5cdd0"), 0.26, 0.86)
	var brake := _mat(Color("#555f64"), 0.36, 0.72)
	for i in range(4):
		var wheel := Node3D.new()
		wheel.position = WHEEL_ANCHORS[i]
		add_child(wheel)
		_wheel_visuals.append(wheel)
		var tire := MeshInstance3D.new()
		var torus := TorusMesh.new()
		torus.inner_radius = 0.25
		torus.outer_radius = 0.39
		torus.rings = 12
		torus.ring_segments = 18
		tire.mesh = torus
		tire.rotation.y = PI / 2
		tire.material_override = rubber
		wheel.add_child(tire)
		var sidewall := MeshInstance3D.new()
		var disc := CylinderMesh.new()
		disc.top_radius = 0.28
		disc.bottom_radius = 0.28
		disc.height = 0.19
		disc.radial_segments = 32
		sidewall.mesh = disc
		sidewall.rotation.z = PI / 2
		sidewall.material_override = brake
		wheel.add_child(sidewall)
		var rim := MeshInstance3D.new()
		var rim_mesh := CylinderMesh.new()
		rim_mesh.top_radius = 0.225
		rim_mesh.bottom_radius = 0.225
		rim_mesh.height = 0.205
		rim_mesh.radial_segments = 10
		rim.mesh = rim_mesh
		rim.rotation.z = PI / 2
		rim.material_override = alloy
		wheel.add_child(rim)
		var center := MeshInstance3D.new()
		var hub := CylinderMesh.new()
		hub.top_radius = 0.085
		hub.bottom_radius = 0.085
		hub.height = 0.22
		hub.radial_segments = 16
		center.mesh = hub
		center.rotation.z = PI / 2
		center.material_override = accent
		wheel.add_child(center)
		for spoke in range(5):
			var bar := _panel(Vector3(0.045, 0.3, 0.07), Vector3(0, 0, 0), alloy)
			bar.position = Vector3(0, 0, 0)
			bar.rotation.x = TAU * float(spoke) / 5.0
			rim.add_child(bar)


func _build_camera() -> void:
	_camera = Camera3D.new()
	_camera.fov = 76.0
	add_child(_camera)
	_camera.make_current()
	_camera.global_position = global_position + Vector3(0, 4, 8)
	_camera.look_at(global_position + Vector3(0, 1, -4), Vector3.UP)


func _build_audio() -> void:
	var stream := AudioStreamGenerator.new()
	stream.mix_rate = _audio_sample_rate
	stream.buffer_length = 0.18
	_engine_player = AudioStreamPlayer.new()
	_engine_player.stream = stream
	_engine_player.volume_db = -8.0
	add_child(_engine_player)
	_engine_player.play()
	_engine_playback = _engine_player.get_stream_playback() as AudioStreamGeneratorPlayback


func set_ai_route(points: Array[Vector3], index := 0, skill := 0.8) -> void:
	ai_waypoints = points
	ai_index = index
	ai_laps = 0
	ai_skill = skill
	ai_enabled = true


func _get_controls() -> void:
	if ai_enabled and ai_waypoints.size() > 1:
		var target := ai_waypoints[ai_index % ai_waypoints.size()]
		var delta := target - global_position
		var local_target := global_transform.basis.inverse() * delta
		steer_input = clampf(local_target.x / maxf(absf(local_target.z), 3.0) * 1.9, -1.0, 1.0)
		var dist := delta.length()
		if dist < 12.0:
			if ai_index == ai_waypoints.size() - 1:
				ai_laps += 1
				ai_index = 0
			else:
				ai_index += 1
		var turn := absf(steer_input)
		var target_speed := lerpf(34.0, 18.0, turn) * ai_skill
		throttle_input = 1.0 if linear_velocity.length() < target_speed else 0.18
		brake_input = 0.18 if linear_velocity.length() > target_speed + 6.0 else 0.0
		handbrake_input = false
	else:
		var keyboard_steer := (
			Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
		)
		var axis := (
			Input.get_joy_axis(0, JOY_AXIS_LEFT_X)
			if Input.get_connected_joypads().size() > 0
			else 0.0
		)
		steer_input = keyboard_steer if absf(keyboard_steer) > 0.01 else axis
		var pad_throttle := (
			(Input.get_joy_axis(0, JOY_AXIS_TRIGGER_RIGHT) + 1.0) * 0.5
			if Input.get_connected_joypads().size() > 0
			else 0.0
		)
		var pad_brake := (
			(Input.get_joy_axis(0, JOY_AXIS_TRIGGER_LEFT) + 1.0) * 0.5
			if Input.get_connected_joypads().size() > 0
			else 0.0
		)
		throttle_input = maxf(Input.get_action_strength("accelerate"), pad_throttle)
		brake_input = maxf(Input.get_action_strength("brake"), pad_brake)
		handbrake_input = Input.is_action_pressed("handbrake")
		if Input.is_action_just_pressed("shift_up"):
			current_gear = mini(current_gear + 1, GEAR_RATIOS.size())
		if Input.is_action_just_pressed("shift_down"):
			current_gear = maxi(current_gear - 1, 1)
		# Paddle-shift auto assist prevents stalled starts while preserving explicit gear control.
		if current_gear == 1 and _speed_meter > 12.0:
			current_gear = 2
		if _speed_meter < 7.0:
			current_gear = 1


func _physics_process(delta: float) -> void:
	_get_controls()
	_steer_angle = move_toward(_steer_angle, -steer_input * 0.48, delta * 1.85)
	if is_instance_valid(_steering_wheel):
		_steering_wheel.rotation.z = 0.06 - _steer_angle * 0.9
	if is_instance_valid(_cluster_needle):
		_cluster_needle.rotation.z = -1.15 + clampf(rpm / 7200.0, 0.0, 1.0) * 2.3
	var speed := linear_velocity.length()
	is_reversing = not ai_enabled and brake_input > 0.08 and speed < 1.8
	if is_reversing:
		throttle_input = brake_input
		brake_input = 0.0
	var gear_ratio: float = GEAR_RATIOS[clampi(current_gear - 1, 0, GEAR_RATIOS.size() - 1)]
	var rpm_target := clampf(900.0 + speed * gear_ratio * FINAL_DRIVE * 195.0, 900.0, 7200.0)
	if throttle_input > 0.05:
		rpm_target = maxf(rpm_target, 1500.0 + throttle_input * 1400.0)
	rpm = move_toward(rpm, rpm_target, delta * 4300.0)
	var torque_curve := 0.72 + 0.28 * sin(clampf(rpm / 7200.0, 0.0, 1.0) * PI)
	var wheel_force := (
		max_power * 7355.0 / rpm * torque_curve * gear_ratio * FINAL_DRIVE / WHEEL_RADIUS
	)
	wheel_force = clampf(wheel_force, 0.0, 11200.0)
	var total_contacts := 0
	for i in range(4):
		var anchor: Vector3 = WHEEL_ANCHORS[i]
		var origin := global_transform * anchor
		var down := -global_transform.basis.y
		var query := PhysicsRayQueryParameters3D.create(origin, origin + down * MAX_RAY, 1)
		query.exclude = [get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		var visual: Node3D = _wheel_visuals[i]
		var steering_angle := _steer_angle if i < 2 else 0.0
		visual.rotation.y = steering_angle
		if not hit.is_empty():
			total_contacts += 1
			var contact: Vector3 = hit.position
			var dist: float = origin.distance_to(contact)
			var normal: Vector3 = hit.normal.normalized()
			var point_velocity := (
				linear_velocity + angular_velocity.cross(contact - global_position)
			)
			var spring_velocity := point_velocity.dot(normal)
			var compression := maxf(SUSPENSION_REST - dist, 0.0)
			var spring_force := maxf(compression * 24500.0 - spring_velocity * 3650.0, 0.0)
			apply_force(normal * spring_force, contact - global_position)
			var wheel_forward := -global_transform.basis.z.rotated(
				global_transform.basis.y, steering_angle
			)
			wheel_forward = (wheel_forward - normal * wheel_forward.dot(normal)).normalized()
			var wheel_right := wheel_forward.cross(normal).normalized()
			var v_long := point_velocity.dot(wheel_forward)
			var v_lat := point_velocity.dot(wheel_right)
			var driven := (
				drivetrain == "AWD"
				or (drivetrain == "RWD" and i >= 2)
				or (drivetrain == "FWD" and i < 2)
			)
			var surface_grip := _surface_grip(contact)
			var normal_load := maxf(spring_force, mass_kg * 9.8 / 4.0)
			var longitudinal := 0.0
			if driven:
				longitudinal += (
					throttle_input
					* wheel_force
					* (0.5 if drivetrain == "AWD" else 1.0)
					* (-1.0 if is_reversing else 1.0)
				)
			longitudinal -= signf(v_long) * brake_input * 3800.0
			if handbrake_input and i >= 2:
				longitudinal -= signf(v_long) * 3200.0
			var lateral_force := -v_lat * mass_kg * 1.85 * handling
			if handbrake_input and i >= 2:
				lateral_force *= 0.22
			var limit := normal_load * surface_grip
			var tire_force := Vector2(longitudinal, lateral_force)
			if tire_force.length() > limit:
				tire_force = tire_force.normalized() * limit
			apply_force(
				wheel_forward * tire_force.x + wheel_right * tire_force.y, contact - global_position
			)
			# Ground-following wheel pose: wheel mesh stays on the contact patch and reflects suspension travel.
			var target := to_local(contact) + Vector3.UP * WHEEL_RADIUS
			visual.position = Vector3(anchor.x, target.y, anchor.z)
			_wheel_spin[i] += v_long / WHEEL_RADIUS * delta
			visual.rotation.x = _wheel_spin[i]
		else:
			visual.position = anchor + Vector3.DOWN * (SUSPENSION_REST - WHEEL_RADIUS)
	# Aerodynamic drag and body-stabilizing differential grip: forces remain physical, never position-driven.
	var aero := -linear_velocity * speed * 0.38
	apply_central_force(aero)
	if total_contacts > 0:
		apply_torque(
			(
				-global_transform.basis.y
				* angular_velocity.dot(global_transform.basis.y)
				* mass_kg
				* 0.35
			)
		)
	if Input.is_action_just_pressed("reset_car") and not ai_enabled:
		global_position += Vector3.UP * 1.5
		rotation = Vector3(0, rotation.y, 0)
		linear_velocity = Vector3.ZERO
		angular_velocity = Vector3.ZERO
	_speed_meter = speed
	if throttle_input > 0.01:
		_audio_gain = move_toward(_audio_gain, 0.23, delta * 0.65)
	else:
		_audio_gain = move_toward(_audio_gain, 0.10, delta * 0.35)


func _surface_grip(point: Vector3) -> float:
	var grip := 1.0
	if point.x < -168.0 and point.z > 92.0:
		grip = 0.58  # Redstone sand / rally soil
	elif point.x < -135.0 and point.z > -95.0 and point.z < 155.0:
		grip = 0.75  # Greenvale forest earth
	elif point.z < -185.0:
		grip = 0.88  # cold alpine asphalt
	if wet_road and grip > 0.8:
		grip *= 0.72
	return grip


func _process(delta: float) -> void:
	_update_camera(delta)
	_update_lights()
	_feed_engine_audio()


func _update_camera(delta: float) -> void:
	if not is_instance_valid(_camera):
		return
	if photo_mode:
		var focus := global_position + Vector3.UP * 0.85
		var orbit := Vector3(
			sin(_photo_yaw) * cos(_photo_pitch),
			sin(_photo_pitch),
			cos(_photo_yaw) * cos(_photo_pitch)
		)
		_camera.global_position = focus + orbit * _photo_distance
		_camera.look_at(focus, Vector3.UP)
		_camera.fov = 48.0
		return
	var forward := -global_transform.basis.z
	var up := global_transform.basis.y
	var desired: Vector3
	match camera_mode:
		0:
			desired = global_position - forward * 7.7 + up * 3.25
		1:
			desired = global_position - forward * 4.2 + up * 1.95
		2:
			desired = global_position + up * 0.92 - forward * 0.25
		3:
			desired = global_position + up * 0.69 - forward * 0.18 + global_transform.basis.x * 0.0
		_:
			desired = global_position - forward * 7.7 + up * 3.25
	var look_at_point := (
		global_position
		+ up * (1.1 if camera_mode < 2 else 0.78)
		+ forward * (6.0 if camera_mode == 0 else 8.0)
	)
	if camera_mode == 3:
		look_at_point = global_position + forward * 10.0 + up * 0.65
	var smoothing := 5.2 if camera_mode < 2 else 10.0
	_camera.global_position = _camera.global_position.lerp(desired, 1.0 - exp(-smoothing * delta))
	_camera.look_at(look_at_point, up)
	_camera.fov = lerpf(
		_camera.fov, 76.0 + clampf(linear_velocity.length() * 0.16, 0, 12), delta * 2.2
	)


func _update_lights() -> void:
	for lamp in _headlights:
		lamp.visible = night_mode


func _feed_engine_audio() -> void:
	if _engine_playback == null:
		return
	var frames := _engine_playback.get_frames_available()
	for i in range(frames):
		var frequency := lerpf(38.0, 168.0, clampf(rpm / 7200.0, 0, 1)) * engine_tone
		_audio_phase = fposmod(_audio_phase + frequency / _audio_sample_rate, 1.0)
		var saw := _audio_phase * 2.0 - 1.0
		var pulse := (
			sin(_audio_phase * TAU)
			+ 0.34 * sin(_audio_phase * TAU * 2.0)
			+ 0.16 * sin(_audio_phase * TAU * 3.0)
		)
		var tone := (pulse * 0.7 + saw * 0.3) * _audio_gain
		_engine_playback.push_frame(Vector2(tone, tone * 0.96))


func set_photo_mode(enabled: bool) -> void:
	photo_mode = enabled
	if enabled:
		_photo_yaw = 0.0
		_photo_pitch = 0.12
		_photo_distance = 5.2


func adjust_photo_camera(motion: Vector2) -> void:
	_photo_yaw -= motion.x * 0.004
	_photo_pitch = clampf(_photo_pitch - motion.y * 0.003, -0.15, 0.9)


func zoom_photo(amount: float) -> void:
	_photo_distance = clampf(_photo_distance + amount, 2.8, 11.0)


func next_camera() -> int:
	camera_mode = (camera_mode + 1) % 4
	return camera_mode


func set_weather_state(raining: bool, is_night: bool) -> void:
	wet_road = raining
	night_mode = is_night


func set_player_enabled(value: bool) -> void:
	ai_enabled = not value
	if not value:
		throttle_input = 0
		brake_input = 0
		steer_input = 0


func get_speed_kph() -> float:
	return linear_velocity.length() * 3.6
