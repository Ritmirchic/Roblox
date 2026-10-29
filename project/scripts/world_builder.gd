class_name AuroraWorld
extends Node3D

const ROAD_COLOR := Color("#20282c")
var road_material: StandardMaterial3D
var dirt_material: StandardMaterial3D
var _environment: Environment
var _sun: DirectionalLight3D
var _sky: ProceduralSkyMaterial
var _rain: GPUParticles3D
var _clock := 0.42
var _weather := "CLEAR"
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	_rng.seed = 447103
	_build_environment()
	_build_terrain()
	_build_roads()
	_build_city()
	_build_biomes()
	_build_festival()
	_build_landmarks()


func _mat(color: Color, roughness := 0.8, metallic := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	m.metallic = metallic
	return m


func _build_environment() -> void:
	_environment = Environment.new()
	_environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	_sky = ProceduralSkyMaterial.new()
	_sky.sky_top_color = Color("#315f81")
	_sky.sky_horizon_color = Color("#f2b388")
	_sky.ground_bottom_color = Color("#1b292e")
	_sky.ground_horizon_color = Color("#cf9c7c")
	sky.sky_material = _sky
	_environment.sky = sky
	_environment.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	_environment.ambient_light_energy = 0.8
	_environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	_environment.tonemap_exposure = 1.05
	_environment.fog_enabled = true
	_environment.fog_light_color = Color("#b4c8d0")
	_environment.fog_density = 0.0012
	_environment.fog_sky_affect = 0.35
	var env := WorldEnvironment.new()
	env.environment = _environment
	add_child(env)
	_sun = DirectionalLight3D.new()
	_sun.rotation_degrees = Vector3(-35, -32, 0)
	_sun.light_color = Color("#ffe1bb")
	_sun.light_energy = 1.2
	_sun.shadow_enabled = true
	_sun.directional_shadow_max_distance = 250
	add_child(_sun)


func _build_terrain() -> void:
	var ground := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(1200, 1200)
	ground.mesh = plane
	ground.position.y = -1.65
	ground.material_override = _mat(Color("#52665b"), 1.0)
	add_child(ground)
	var floor_body := StaticBody3D.new()
	floor_body.position.y = -1.8
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(1200, 1, 1200)
	col.shape = shape
	floor_body.add_child(col)
	add_child(floor_body)
	var water := MeshInstance3D.new()
	var sea := PlaneMesh.new()
	sea.size = Vector2(800, 1100)
	water.mesh = sea
	water.position = Vector3(760, -1.35, 0)
	water.material_override = _mat(Color("#216c83"), 0.19, 0.28)
	add_child(water)
	for i in range(14):
		var cliff := _box(
			Vector3(18, _rng.randf_range(12, 28), _rng.randf_range(22, 39)),
			Vector3(340 + _rng.randf_range(-10, 8), 1, -240 + i * 34),
			_mat(Color("#88745e"), 0.95)
		)
		cliff.rotation.y = _rng.randf_range(-0.12, 0.12)
		add_child(cliff)


func _build_roads() -> void:
	road_material = _mat(ROAD_COLOR, 0.91)
	dirt_material = _mat(Color("#886b48"), 0.97)
	var loop: Array = [
		Vector3(-18, 0, 10),
		Vector3(-18, 0, -64),
		Vector3(20, 0, -107),
		Vector3(94, 0, -130),
		Vector3(171, 0, -112),
		Vector3(236, 0, -56),
		Vector3(257, 0, 26),
		Vector3(224, 0, 98),
		Vector3(148, 0, 144),
		Vector3(62, 0, 150),
		Vector3(-20, 0, 121),
		Vector3(-94, 0, 78),
		Vector3(-125, 0, 12),
		Vector3(-104, 0, -57),
		Vector3(-64, 0, -94),
		Vector3(-18, 0, -64)
	]
	_add_road(loop, 14, road_material, 4.0, true)
	_add_road(
		[
			Vector3(70, 0, -122),
			Vector3(24, 4, -170),
			Vector3(-20, 11, -220),
			Vector3(-77, 18, -266),
			Vector3(-145, 28, -284),
			Vector3(-213, 36, -252),
			Vector3(-254, 42, -194),
			Vector3(-226, 34, -135),
			Vector3(-167, 21, -103)
		],
		10,
		road_material,
		2.8,
		true
	)
	_add_road(
		[
			Vector3(-110, 0, 61),
			Vector3(-161, 1, 102),
			Vector3(-221, 3, 125),
			Vector3(-278, 2, 96),
			Vector3(-307, 1, 36),
			Vector3(-286, 1, -26),
			Vector3(-231, 1, -60),
			Vector3(-166, 1, -42),
			Vector3(-125, 0, 12)
		],
		9,
		dirt_material,
		0,
		true
	)
	_add_road(
		[
			Vector3(-97, 0, 79),
			Vector3(-140, 0, 133),
			Vector3(-160, 0, 203),
			Vector3(-213, 0, 250),
			Vector3(-286, 0, 255),
			Vector3(-340, 0, 213),
			Vector3(-321, 0, 158),
			Vector3(-270, 0, 122)
		],
		9,
		dirt_material,
		0,
		true
	)
	_add_road(
		[Vector3(220, 0, 98), Vector3(265, 0, 145), Vector3(299, 0, 205), Vector3(316, 0, 264)],
		8,
		road_material,
		2.8,
		false
	)
	_add_road(
		[
			Vector3(-38, 0, 29),
			Vector3(-18, 0, 37),
			Vector3(3, 0, 36),
			Vector3(12, 0, 21),
			Vector3(2, 0, 7),
			Vector3(-20, 0, 8),
			Vector3(-38, 0, 19),
			Vector3(-38, 0, 29)
		],
		8,
		road_material,
		2.7,
		true
	)


func _smooth(points: Array, steps := 5) -> PackedVector3Array:
	var out := PackedVector3Array()
	for i in range(points.size() - 1):
		var a: Vector3 = points[maxi(i - 1, 0)]
		var b: Vector3 = points[i]
		var c: Vector3 = points[i + 1]
		var d: Vector3 = points[mini(i + 2, points.size() - 1)]
		for j in range(steps):
			var t := float(j) / steps
			var t2 := t * t
			var t3 := t2 * t
			out.append(
				(
					0.5
					* (
						(2 * b)
						+ (-a + c) * t
						+ (2 * a - 5 * b + 4 * c - d) * t2
						+ (-a + 3 * b - 3 * c + d) * t3
					)
				)
			)
	out.append(points[-1])
	return out


func _add_road(
	points: Array, width: float, material: Material, lane_width: float, closed: bool
) -> void:
	var path := _smooth(points, 5)
	if closed:
		path.append(path[0])
	var v := PackedVector3Array()
	var n := PackedVector3Array()
	var uv := PackedVector2Array()
	var ix := PackedInt32Array()
	for i in range(path.size()):
		var side: Vector3 = (
			(path[mini(i + 1, path.size() - 1)] - path[maxi(i - 1, 0)])
			. cross(Vector3.UP)
			. normalized()
		)
		if side.length_squared() < 0.1:
			side = Vector3.RIGHT
		v.append(path[i] + side * width * 0.5 + Vector3.UP * 0.08)
		v.append(path[i] - side * width * 0.5 + Vector3.UP * 0.08)
		n.append(Vector3.UP)
		n.append(Vector3.UP)
		uv.append(Vector2(0, i * 0.6))
		uv.append(Vector2(1, i * 0.6))
		if i < path.size() - 1:
			var a := i * 2
			ix.append_array(PackedInt32Array([a, a + 2, a + 1, a + 1, a + 2, a + 3]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = v
	arrays[Mesh.ARRAY_NORMAL] = n
	arrays[Mesh.ARRAY_TEX_UV] = uv
	arrays[Mesh.ARRAY_INDEX] = ix
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(0, material)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	var body := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	cs.shape = mesh.create_trimesh_shape()
	body.add_child(cs)
	add_child(body)
	# Dashed center markings are sparse, grouped visually along the continuous drivable mesh.
	if lane_width > 0:
		for i in range(3, path.size() - 2, 10):
			var direction: Vector3 = (path[i + 1] - path[i]).normalized()
			var dash := _box(
				Vector3(0.12, 0.035, 3.0),
				(path[i] + path[i + 1]) * 0.5 + Vector3.UP * 0.13,
				_mat(Color("#ded7c2"), 0.7)
			)
			dash.rotation.y = atan2(-direction.x, -direction.z)
			add_child(dash)
		for i in range(5, path.size() - 1, 14):
			if path[i].x > 190 or path[i].z < -185:
				var rail := _box(
					Vector3(0.16, 0.65, 13),
					path[i] + Vector3(0, 0.48, width * 0.62),
					_mat(Color("#aab3b3"), 0.35, 0.7)
				)
				add_child(rail)


func _box(size: Vector3, at: Vector3, material: Material) -> MeshInstance3D:
	var n := MeshInstance3D.new()
	var b := BoxMesh.new()
	b.size = size
	n.mesh = b
	n.position = at
	n.material_override = material
	return n


func _build_city() -> void:
	var glass := _mat(Color("#72b3be"), 0.25, 0.42)
	var dark := _mat(Color("#243c4d"), 0.21, 0.48)
	for i in range(21):
		var x: float = -75 + (i % 6) * 18 + _rng.randf_range(-2, 2)
		var z: float = -38 + floor(float(i) / 6) * 20
		var h: float = _rng.randf_range(16, 54) if i % 4 else _rng.randf_range(56, 82)
		var w: float = _rng.randf_range(9, 14)
		var b := _box(
			Vector3(w, h, _rng.randf_range(9, 15)),
			Vector3(x, h * 0.5 - 1.4, z),
			_mat(Color("#4f5f68") if i % 3 else Color("#b38f73"), 0.68, 0.14)
		)
		add_child(b)
		for band in range(3):
			add_child(
				_box(
					Vector3(0.48, h * 0.76, 0.14),
					Vector3(x - w * 0.28 + band * w * 0.28, h * 0.5 - 1.3, z - 7.58),
					glass if i % 2 else dark
				)
			)
	for i in range(7):
		add_child(
			_box(
				Vector3(4.5, 0.7, 11),
				Vector3(273, -0.6, 195 + i * 11),
				_mat(Color("#f4eee1"), 0.24, 0.2)
			)
		)


func _build_biomes() -> void:
	# Broad collision-backed ridges lift the mountain pass out of the low coastal plain.
	var mountain_route: Array = [
		Vector3(70, 0, -122),
		Vector3(24, 4, -170),
		Vector3(-20, 11, -220),
		Vector3(-77, 18, -266),
		Vector3(-145, 28, -284),
		Vector3(-213, 36, -252),
		Vector3(-254, 42, -194),
		Vector3(-226, 34, -135),
		Vector3(-167, 21, -103)
	]
	for point in mountain_route:
		var rise: float = 23.0 + point.y * 0.18
		var terrain_mesh := MeshInstance3D.new()
		var mound := SphereMesh.new()
		mound.radius = 1.0
		mound.height = 2.0
		terrain_mesh.mesh = mound
		terrain_mesh.scale = Vector3(48.0, rise, 48.0)
		terrain_mesh.position = Vector3(point.x, point.y - rise - 0.9, point.z)
		terrain_mesh.material_override = _mat(Color("#66756e"), 0.98)
		add_child(terrain_mesh)
		var terrain_body := StaticBody3D.new()
		var terrain_collision := CollisionShape3D.new()
		var terrain_shape := SphereShape3D.new()
		terrain_shape.radius = 1.0
		terrain_collision.shape = terrain_shape
		terrain_collision.scale = Vector3(48.0, rise, 48.0)
		terrain_body.add_child(terrain_collision)
		terrain_body.position = terrain_mesh.position
		add_child(terrain_body)
	# Alpine silhouettes.
	for i in range(25):
		var h := _rng.randf_range(30, 95)
		var m := MeshInstance3D.new()
		var cone := CylinderMesh.new()
		cone.top_radius = 2
		cone.bottom_radius = _rng.randf_range(24, 50)
		cone.height = h
		cone.radial_segments = 7
		m.mesh = cone
		m.position = Vector3(
			-100 - _rng.randf_range(0, 190), h * 0.5 - 1, -190 - _rng.randf_range(0, 150)
		)
		m.material_override = _mat(Color("#687a73") if i % 3 else Color("#d0d5d1"), 0.97)
		add_child(m)
	# Forest clusters; road-clearing corridor remains open.
	for i in range(48):
		var x := _rng.randf_range(-344, -136)
		var z := _rng.randf_range(-88, 155)
		if absf(x + 220) < 25 and absf(z - 40) < 95:
			continue
		_add_tree(Vector3(x, 0, z), _rng.randf_range(0.75, 1.4), true)
	for row in range(12):
		add_child(
			_box(
				Vector3(108, 0.04, 0.5),
				Vector3(-76, -0.94, 155 + row * 9),
				_mat(Color("#9d9b5a") if row % 2 else Color("#bdab66"), 1)
			)
		)
	for i in range(15):
		_add_tree(
			Vector3(_rng.randf_range(-130, 60), 0, _rng.randf_range(165, 250)),
			_rng.randf_range(0.8, 1.2),
			false
		)
	for i in range(12):
		_add_palm(Vector3(185 + (i % 4) * 15, 0, -42 + floor(float(i) / 4) * 26))
	for i in range(24):
		var rock := MeshInstance3D.new()
		var s := SphereMesh.new()
		s.radius = 1
		s.height = 1.8
		rock.mesh = s
		rock.scale = Vector3(
			_rng.randf_range(3, 11), _rng.randf_range(2, 9), _rng.randf_range(4, 13)
		)
		rock.position = Vector3(_rng.randf_range(-350, -160), -0.5, _rng.randf_range(120, 300))
		rock.material_override = _mat(Color("#bd8d5c") if i % 2 else Color("#d3a86b"), 0.95)
		add_child(rock)
	var barn := _box(Vector3(17, 7, 12), Vector3(-61, 2, 210), _mat(Color("#9b553d"), 0.9))
	add_child(barn)
	add_child(_box(Vector3(19, 1.3, 14), Vector3(-61, 6.1, 210), _mat(Color("#4e4d48"), 0.85)))


func _add_tree(at: Vector3, s: float, pine: bool) -> void:
	var trunk := MeshInstance3D.new()
	var t := CylinderMesh.new()
	t.top_radius = 0.18 * s
	t.bottom_radius = 0.36 * s
	t.height = 4 * s
	trunk.mesh = t
	trunk.position = at + Vector3.UP * 2 * s
	trunk.material_override = _mat(Color("#604733"), 0.96)
	add_child(trunk)
	for layer in range(3 if pine else 1):
		var crown := MeshInstance3D.new()
		if pine:
			var c := CylinderMesh.new()
			c.top_radius = 0.05
			c.bottom_radius = (2.1 - layer * 0.3) * s
			c.height = 3.0 * s
			c.radial_segments = 7
			crown.mesh = c
			crown.position = at + Vector3.UP * (3.3 + layer * 1.4) * s
			crown.material_override = _mat(
				Color("#294b3d") if layer % 2 == 0 else Color("#355b45"), 0.96
			)
		else:
			var sp := SphereMesh.new()
			sp.radius = 2.2 * s
			sp.height = 4.0 * s
			crown.mesh = sp
			crown.position = at + Vector3.UP * 5 * s
			crown.material_override = _mat(Color("#54724a"), 0.98)
		add_child(crown)


func _add_palm(at: Vector3) -> void:
	var trunk := MeshInstance3D.new()
	var c := CylinderMesh.new()
	c.top_radius = 0.16
	c.bottom_radius = 0.36
	c.height = 7
	c.radial_segments = 7
	trunk.mesh = c
	trunk.position = at + Vector3.UP * 3.5
	trunk.material_override = _mat(Color("#947657"), 0.92)
	add_child(trunk)
	for i in range(7):
		var leaf := _box(
			Vector3(0.34, 0.18, 4.5), at + Vector3.UP * 7, _mat(Color("#416d50"), 0.92)
		)
		leaf.rotation.y = TAU * i / 7.0
		leaf.rotation.x = -0.2
		add_child(leaf)


func _build_festival() -> void:
	add_child(_box(Vector3(72, 0.28, 54), Vector3(-3, -0.7, 1), _mat(Color("#424c51"), 0.68)))
	var gold := _mat(Color("#e8b75b"), 0.33, 0.38)
	for x in [-14.0, 14.0]:
		add_child(_box(Vector3(1.1, 10, 1.1), Vector3(x, 4.6, -5), gold))
	add_child(_box(Vector3(29, 1.2, 1.2), Vector3(0, 9.1, -5), gold))
	var title := Label3D.new()
	title.text = "AURORA  /  VELOCITY FESTIVAL"
	title.font_size = 56
	title.pixel_size = 0.012
	title.position = Vector3(0, 7.3, -4.25)
	title.modulate = Color("#fff1d4")
	add_child(title)
	add_child(_box(Vector3(18, 2.2, 5), Vector3(39, 0.25, -31), _mat(Color("#202d38"), 0.38, 0.25)))
	for i in range(5):
		add_child(
			_box(
				Vector3(2.4, 5.5, 0.38),
				Vector3(32 + i * 3.5, 4, -33.1),
				_mat([Color("#ff6848"), Color("#f5bd62"), Color("#52d9d1")][i % 3], 0.28, 0.15)
			)
		)
	for i in range(9):
		add_child(
			_box(
				Vector3(10, 0.25, 8),
				Vector3(-42 + (i % 3) * 13, 4.4, 20 + floor(float(i) / 3) * 11),
				_mat(Color("#d7e3dc") if i % 2 else Color("#e3ad61"), 0.42, 0.12)
			)
		)
	for i in range(4):
		add_child(
			_box(
				Vector3(6, 0.5, 10),
				Vector3(-43 + i * 12, 0, -25),
				_mat(Color("#707b7d"), 0.35, 0.3)
			)
		)
	add_child(_box(Vector3(7, 12, 6), Vector3(34, 5, -7), _mat(Color("#344956"), 0.5, 0.24)))
	var sign := Label3D.new()
	sign.text = "AURORA\nMOTORSPORT PARK"
	sign.font_size = 38
	sign.pixel_size = 0.012
	sign.position = Vector3(34, 7.2, -3.8)
	sign.modulate = Color("#e7c57e")
	add_child(sign)


func _build_landmarks() -> void:
	for p in [
		Vector3(141, 0, 143),
		Vector3(239, 0, 64),
		Vector3(241, 0, -85),
		Vector3(117, 0, -125),
		Vector3(-31, 0, 114),
		Vector3(-119, 0, 11)
	]:
		var marker := Node3D.new()
		marker.position = p
		add_child(marker)
		for side in [-1.0, 1.0]:
			marker.add_child(
				_box(
					Vector3(0.38, 3.6, 0.38),
					Vector3(side * 4, 1.8, 0),
					_mat(Color("#55d6cb"), 0.26, 0.18)
				)
			)
		marker.add_child(
			_box(Vector3(8.4, 0.32, 0.38), Vector3(0, 3.6, 0), _mat(Color("#f0bb65"), 0.25, 0.2))
		)


func _process(delta: float) -> void:
	_clock = fposmod(_clock + delta / 720.0, 1.0)
	var sun_height := sin(_clock * TAU)
	var daylight := clampf((sun_height + 0.15) / 0.8, 0.0, 1.0)
	_sun.rotation_degrees = Vector3(22.0 - 74.0 * daylight, -32, 0)
	_sun.light_energy = 0.16 + 1.15 * daylight
	_sun.light_color = Color("#b7c8ff").lerp(Color("#ffe0bd"), daylight)
	_environment.ambient_light_energy = 0.28 + 0.52 * daylight
	_sky.sky_top_color = Color("#142b47").lerp(Color("#315f81"), daylight)
	_sky.sky_horizon_color = Color("#38445a").lerp(Color("#f2b388"), daylight)


func is_night() -> bool:
	return sin(_clock * TAU) < 0.05


func set_weather(weather: String) -> void:
	_weather = weather
	if road_material == null:
		return
	if _weather == "RAIN":
		road_material.albedo_color = Color("#252c32")
		road_material.roughness = 0.34
		road_material.metallic = 0.17
		_environment.fog_density = 0.0023
		if _rain == null:
			_rain = GPUParticles3D.new()
			_rain.amount = 540
			_rain.lifetime = 1.2
			_rain.emitting = true
			var process := ParticleProcessMaterial.new()
			process.direction = Vector3(0, -1, 0)
			process.gravity = Vector3(0, -2, 0)
			process.initial_velocity_min = 24
			process.initial_velocity_max = 33
			process.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
			process.emission_box_extents = Vector3(36, 18, 36)
			_rain.process_material = process
			var drop := CylinderMesh.new()
			drop.top_radius = 0.018
			drop.bottom_radius = 0.012
			drop.height = 0.34
			var mat := _mat(Color(0.72, 0.86, 1, 0.65), 0.18)
			mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			drop.material = mat
			_rain.draw_pass_1 = drop
			add_child(_rain)
		_rain.emitting = true
	else:
		road_material.albedo_color = ROAD_COLOR
		road_material.roughness = 0.91
		road_material.metallic = 0
		_environment.fog_density = 0.0012
		if _rain != null:
			_rain.emitting = false


func update_weather_anchor(point: Vector3) -> void:
	if _rain != null:
		_rain.global_position = point + Vector3.UP * 14


func set_quality(value: String) -> void:
	if not is_inside_tree():
		return
	var viewport := get_viewport()
	viewport.msaa_3d = Viewport.MSAA_DISABLED
	if value == "MEDIUM":
		viewport.msaa_3d = Viewport.MSAA_2X
	elif value in ["HIGH", "ULTRA"]:
		viewport.msaa_3d = Viewport.MSAA_4X
	if value == "LOW":
		_environment.fog_enabled = false
	else:
		_environment.fog_enabled = true
