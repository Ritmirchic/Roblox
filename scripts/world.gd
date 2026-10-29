class_name AuroraWorld
extends Node3D

const MAP_HALF := 190.0
const GRID_STEP := 5.0
var routes: Array[Array] = []
var route_names := ["Azure Run", "Greenvale Rally", "Silver Pass"]
var route_widths := [12.0, 9.0, 10.0]


func _ready() -> void:
	_build_environment()
	_build_land()
	_build_routes()
	_build_vegetation()
	_build_festival()
	_build_landmarks()


func terrain_height(x: float, z: float) -> float:
	var mountain := 24.0 * exp(-pow((x - 105.0) / 62.0, 2.0) - pow((z + 42.0) / 100.0, 2.0))
	var forest_hills := 9.0 * exp(-pow((x + 58.0) / 72.0, 2.0) - pow((z + 100.0) / 58.0, 2.0))
	var farm_roll := 4.2 * exp(-pow((x - 95.0) / 115.0, 2.0) - pow((z - 120.0) / 65.0, 2.0))
	var desert_rise := 5.0 * exp(-pow((x + 112.0) / 64.0, 2.0) - pow((z - 104.0) / 70.0, 2.0))
	var wave := 1.3 * sin(x * 0.045) * cos(z * 0.039) + 0.65 * sin(z * 0.09 + x * 0.023)
	return mountain + forest_hills + farm_roll + desert_rise + wave


func _build_environment() -> void:
	var env := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("17344d")
	sky_mat.sky_horizon_color = Color("f3a76b")
	sky_mat.ground_bottom_color = Color("17232d")
	sky_mat.ground_horizon_color = Color("c78061")
	sky_mat.sun_angle_max = 18.0
	sky.sky_material = sky_mat
	settings.sky = sky
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	settings.ambient_light_sky_contribution = 0.62
	settings.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	settings.tonemap_exposure = 1.0
	settings.glow_enabled = true
	settings.glow_intensity = 0.18
	settings.fog_enabled = true
	settings.fog_light_color = Color("d99872")
	settings.fog_density = 0.0028
	env.environment = settings
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-32.0, -28.0, 0.0)
	sun.light_color = Color("ffe0bb")
	sun.light_energy = 1.45
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 180.0
	add_child(sun)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(22.0, 150.0, 0.0)
	fill.light_color = Color("7aa6cb")
	fill.light_energy = 0.28
	fill.shadow_enabled = false
	add_child(fill)
	var water := MeshInstance3D.new()
	water.name = "AzureSea"
	var plane := PlaneMesh.new()
	plane.size = Vector2(1500, 1500)
	water.mesh = plane
	water.position = Vector3(-80, -2.5, 0)
	var sea_mat := StandardMaterial3D.new()
	sea_mat.albedo_color = Color("0b5872")
	sea_mat.metallic = 0.38
	sea_mat.roughness = 0.19
	sea_mat.emission_enabled = true
	sea_mat.emission = Color("052a3b")
	water.material_override = sea_mat
	add_child(water)


func _build_land() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var steps := int(MAP_HALF * 2.0 / GRID_STEP)
	for iz in range(steps):
		for ix in range(steps):
			var x0 := -MAP_HALF + float(ix) * GRID_STEP
			var z0 := -MAP_HALF + float(iz) * GRID_STEP
			var p00 := Vector3(x0, terrain_height(x0, z0), z0)
			var p10 := Vector3(x0 + GRID_STEP, terrain_height(x0 + GRID_STEP, z0), z0)
			var p01 := Vector3(x0, terrain_height(x0, z0 + GRID_STEP), z0 + GRID_STEP)
			var p11 := Vector3(
				x0 + GRID_STEP, terrain_height(x0 + GRID_STEP, z0 + GRID_STEP), z0 + GRID_STEP
			)
			var center := Vector2(x0 + GRID_STEP * 0.5, z0 + GRID_STEP * 0.5)
			var color := _biome_color(center.x, center.y)
			_add_triangle(st, p00, p01, p10, color)
			_add_triangle(st, p10, p01, p11, color)
	st.generate_normals()
	var mesh := st.commit()
	var land := MeshInstance3D.new()
	land.name = "AuroraCoastTerrain"
	land.mesh = mesh
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.95
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	land.material_override = mat
	add_child(land)
	var ground := StaticBody3D.new()
	ground.name = "TerrainCollision"
	ground.add_to_group("loose_surface")
	var shape := CollisionShape3D.new()
	shape.shape = mesh.create_trimesh_shape()
	ground.add_child(shape)
	add_child(ground)


func _biome_color(x: float, z: float) -> Color:
	if x > 58.0 and z < 40.0:
		return Color("59655d").lerp(Color("81908a"), clampf(terrain_height(x, z) / 32.0, 0.0, 0.7))
	if x < -82.0 and z > 48.0:
		return Color("9a7454")
	if z < -66.0 and x < 28.0:
		return Color("315244")
	if z > 70.0 and x > 20.0:
		return Color("71834d")
	return Color("547052")


func _add_triangle(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, color: Color) -> void:
	st.set_color(color)
	st.add_vertex(a)
	st.set_color(color)
	st.add_vertex(b)
	st.set_color(color)
	st.add_vertex(c)


func _build_routes() -> void:
	var source_paths: Array[Array] = [
		[
			Vector3(0, 0, 10),
			Vector3(-18, 0, 28),
			Vector3(-48, 0, 41),
			Vector3(-78, 0, 32),
			Vector3(-104, 0, 12),
			Vector3(-124, 0, -20),
			Vector3(-113, 0, -52),
			Vector3(-86, 0, -76),
			Vector3(-52, 0, -82),
			Vector3(-22, 0, -66),
			Vector3(7, 0, -47),
			Vector3(29, 0, -20),
			Vector3(48, 0, 14),
			Vector3(62, 0, 52),
			Vector3(72, 0, 91),
			Vector3(96, 0, 124),
			Vector3(128, 0, 130),
			Vector3(151, 0, 105),
			Vector3(154, 0, 70),
			Vector3(137, 0, 35),
			Vector3(116, 0, 3),
			Vector3(112, 0, -34),
			Vector3(132, 0, -72),
			Vector3(127, 0, -108),
			Vector3(102, 0, -132),
			Vector3(70, 0, -126),
			Vector3(42, 0, -101),
			Vector3(21, 0, -69),
			Vector3(0, 0, 10)
		],
		[
			Vector3(0, 0, 10),
			Vector3(22, 0, 31),
			Vector3(26, 0, 65),
			Vector3(14, 0, 93),
			Vector3(-14, 0, 111),
			Vector3(-38, 0, 101),
			Vector3(-51, 0, 72),
			Vector3(-42, 0, 43),
			Vector3(-18, 0, 28),
			Vector3(0, 0, 10)
		],
		[
			Vector3(25, 0, -24),
			Vector3(45, 0, -42),
			Vector3(68, 0, -55),
			Vector3(83, 0, -76),
			Vector3(77, 0, -99),
			Vector3(57, 0, -112),
			Vector3(39, 0, -97),
			Vector3(34, 0, -70),
			Vector3(25, 0, -24)
		]
	]
	var widths := [12.0, 8.5, 9.0]
	var road_mats := [Color("343d43"), Color("665a4b"), Color("4d5152")]
	for r in range(source_paths.size()):
		var points := _sample_path(source_paths[r], 4.0)
		routes.append(points)
		_build_road_surface(points, widths[r], road_mats[r], r == 1)


func _sample_path(control: Array, spacing: float) -> Array[Vector3]:
	var result: Array[Vector3] = []
	for i in range(control.size() - 1):
		var a: Vector3 = control[i]
		var b: Vector3 = control[i + 1]
		var count := maxi(2, int(ceil(Vector2(b.x - a.x, b.z - a.z).length() / spacing)))
		for j in range(count):
			var t := float(j) / float(count)
			var x := lerpf(a.x, b.x, t)
			var z := lerpf(a.z, b.z, t)
			result.append(Vector3(x, terrain_height(x, z) + 0.24, z))
	result.append(
		Vector3(control[-1].x, terrain_height(control[-1].x, control[-1].z) + 0.24, control[-1].z)
	)
	return result


func _build_road_surface(points: Array[Vector3], width: float, color: Color, dirt: bool) -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(points.size() - 1):
		var d := (points[i + 1] - points[i]).normalized()
		var side := Vector3(-d.z, 0.0, d.x)
		var l0 := points[i] - side * width * 0.5
		var r0 := points[i] + side * width * 0.5
		var l1 := points[i + 1] - side * width * 0.5
		var r1 := points[i + 1] + side * width * 0.5
		var road_color := color * (0.94 + 0.06 * sin(float(i) * 0.7))
		_add_triangle(st, l0, r0, l1, road_color)
		_add_triangle(st, r0, r1, l1, road_color)
	st.generate_normals()
	var mesh := st.commit()
	var road := MeshInstance3D.new()
	road.name = "DirtRoad" if dirt else "AsphaltRoad"
	road.mesh = mesh
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color.WHITE
	mat.roughness = 0.88
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	road.material_override = mat
	add_child(road)
	var body := StaticBody3D.new()
	body.name = "RoadCollision"
	if dirt:
		body.add_to_group("loose_surface")
	var collider := CollisionShape3D.new()
	collider.shape = mesh.create_trimesh_shape()
	body.add_child(collider)
	add_child(body)
	if not dirt:
		_build_lane_marks(points)
		_build_roadside(points, width)


func _build_lane_marks(points: Array[Vector3]) -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(0, points.size() - 1, 3):
		var p := points[i]
		var d := (points[i + 1] - p).normalized()
		var side := Vector3(-d.z, 0.0, d.x)
		var a := p + Vector3.UP * 0.035
		var b := points[i + 1] + Vector3.UP * 0.035
		var half := 0.09
		_add_triangle(st, a - side * half, a + side * half, b - side * half, Color("e9d5a3"))
		_add_triangle(st, a + side * half, b + side * half, b - side * half, Color("e9d5a3"))
	st.generate_normals()
	var line := MeshInstance3D.new()
	line.mesh = st.commit()
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("e9d5a3")
	material.roughness = 0.55
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	line.material_override = material
	add_child(line)


func _build_roadside(points: Array[Vector3], width: float) -> void:
	var posts := MultiMesh.new()
	var post_mesh := BoxMesh.new()
	post_mesh.size = Vector3(0.16, 0.72, 0.16)
	posts.mesh = post_mesh
	var transforms: Array[Transform3D] = []
	for i in range(0, points.size(), 15):
		var p := points[i]
		var d := (points[mini(i + 1, points.size() - 1)] - points[maxi(i - 1, 0)]).normalized()
		var side := Vector3(-d.z, 0, d.x)
		for sign in [-1.0, 1.0]:
			var pos := p + side * (width * 0.5 + 1.1) - Vector3.UP * 0.08
			pos.y = terrain_height(pos.x, pos.z) + 0.5
			var basis := Basis().scaled(Vector3.ONE)
			transforms.append(Transform3D(basis, pos))
	posts.instance_count = transforms.size()
	for i in range(transforms.size()):
		posts.set_instance_transform(i, transforms[i])
	var posts_instance := MultiMeshInstance3D.new()
	posts_instance.multimesh = posts
	var post_material := StandardMaterial3D.new()
	post_material.albedo_color = Color("d8cdb4")
	post_material.roughness = 0.74
	posts_instance.material_override = post_material
	add_child(posts_instance)


func _build_vegetation() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 290871
	var trunk_mesh := CylinderMesh.new()
	trunk_mesh.top_radius = 0.18
	trunk_mesh.bottom_radius = 0.3
	trunk_mesh.height = 2.8
	var canopy_mesh := SphereMesh.new()
	canopy_mesh.radius = 1.65
	canopy_mesh.height = 3.4
	var trunk_transforms: Array[Transform3D] = []
	var canopy_transforms: Array[Transform3D] = []
	for i in range(680):
		var x := rng.randf_range(-175, 175)
		var z := rng.randf_range(-175, 175)
		if absf(x) < 17 and absf(z) < 17:
			continue
		var close_to_road := false
		for route in routes:
			for j in range(0, route.size(), 5):
				var p: Vector3 = route[j]
				if Vector2(x - p.x, z - p.z).length() < 11.0:
					close_to_road = true
					break
			if close_to_road:
				break
		if close_to_road:
			continue
		var y := terrain_height(x, z)
		var scale := rng.randf_range(0.72, 1.42)
		var tree_basis := Basis().scaled(Vector3(scale, scale, scale))
		trunk_transforms.append(Transform3D(tree_basis, Vector3(x, y + 1.3 * scale, z)))
		canopy_transforms.append(Transform3D(tree_basis, Vector3(x, y + 3.0 * scale, z)))
	_add_multimesh("TreeTrunks", trunk_mesh, trunk_transforms, Color("574333"), 0.95)
	_add_multimesh("TreeCanopies", canopy_mesh, canopy_transforms, Color("315a47"), 0.96)
	var rock_mesh := SphereMesh.new()
	rock_mesh.radius = 1.0
	rock_mesh.height = 1.3
	var rock_transforms: Array[Transform3D] = []
	for i in range(180):
		var x := rng.randf_range(48, 165)
		var z := rng.randf_range(-146, 55)
		var scale := rng.randf_range(0.7, 3.6)
		rock_transforms.append(
			Transform3D(
				Basis().scaled(Vector3(scale, scale * 0.7, scale * 0.85)),
				Vector3(x, terrain_height(x, z) + scale * 0.25, z)
			)
		)
	_add_multimesh("SilverMountainRocks", rock_mesh, rock_transforms, Color("777d7c"), 0.88)


func _add_multimesh(
	node_name: String, mesh: Mesh, transforms: Array[Transform3D], color: Color, roughness: float
) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = transforms.size()
	for i in range(transforms.size()):
		mm.set_instance_transform(i, transforms[i])
	var inst := MultiMeshInstance3D.new()
	inst.name = node_name
	inst.multimesh = mm
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	inst.material_override = material
	add_child(inst)


func _build_festival() -> void:
	var ground := MeshInstance3D.new()
	var pad := BoxMesh.new()
	pad.size = Vector3(74, 0.8, 48)
	ground.mesh = pad
	ground.position = Vector3(0, terrain_height(0, 0) + 0.08, 1)
	var floor_mat := StandardMaterial3D.new()
	floor_mat.albedo_color = Color("263b46")
	floor_mat.metallic = 0.18
	floor_mat.roughness = 0.54
	ground.material_override = floor_mat
	add_child(ground)
	var pad_body := StaticBody3D.new()
	pad_body.position = ground.position
	var pad_shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = pad.size
	pad_shape.shape = box
	pad_body.add_child(pad_shape)
	add_child(pad_body)
	for side in [-1.0, 1.0]:
		var tower := MeshInstance3D.new()
		var tower_mesh := BoxMesh.new()
		tower_mesh.size = Vector3(0.55, 9.0, 0.55)
		tower.mesh = tower_mesh
		tower.position = Vector3(side * 18.0, terrain_height(0, 0) + 4.5, -21)
		var glow := StandardMaterial3D.new()
		glow.albedo_color = Color("50e5d1")
		glow.emission_enabled = true
		glow.emission = Color("21c9c0")
		tower.material_override = glow
		add_child(tower)
	var beam := MeshInstance3D.new()
	var beam_mesh := BoxMesh.new()
	beam_mesh.size = Vector3(36, 1.0, 1.0)
	beam.mesh = beam_mesh
	beam.position = Vector3(0, terrain_height(0, 0) + 9.0, -21)
	beam.material_override = _emissive_material(Color("f3b65f"), Color("e87838"))
	add_child(beam)
	_add_building(
		Vector3(-23, terrain_height(-23, -3), -2), Vector3(12, 8, 13), Color("b5c1bf"), "Pavilion"
	)
	_add_building(
		Vector3(24, terrain_height(24, 5), 9), Vector3(14, 6, 12), Color("728b99"), "Workshop"
	)
	for i in range(6):
		var banner := MeshInstance3D.new()
		var banner_mesh := BoxMesh.new()
		banner_mesh.size = Vector3(0.11, 6, 0.11)
		banner.mesh = banner_mesh
		banner.position = Vector3(-29 + i * 11.5, terrain_height(-29 + i * 11.5, 20) + 3, 20)
		banner.material_override = _emissive_material(Color("56d9cd"), Color("238f9a"))
		add_child(banner)


func _build_landmarks() -> void:
	# A compact city silhouette at the coast and a ridge-side observatory give the routes scale.
	for i in range(13):
		var x := -112.0 + float(i % 5) * 8.0
		var z := 22.0 + float(i / 5) * 8.0
		var h := 10.0 + float((i * 7) % 17)
		_add_building(
			Vector3(x, terrain_height(x, z) + h * 0.5, z),
			Vector3(6.0, h, 6.0),
			Color("485a67").lerp(Color("83939a"), float(i % 4) / 5.0),
			"CityBlock"
		)
	for i in range(14):
		var x := 68.0 + float(i % 4) * 17.0
		var z := 75.0 + float(i / 4) * 15.0
		_add_building(
			Vector3(x, terrain_height(x, z) + 2.2, z),
			Vector3(8, 4.4, 7),
			Color("9a7957"),
			"Farmhouse"
		)
	var lookout := MeshInstance3D.new()
	var lookout_mesh := CylinderMesh.new()
	lookout_mesh.top_radius = 2.0
	lookout_mesh.bottom_radius = 3.0
	lookout_mesh.height = 6.0
	lookout.mesh = lookout_mesh
	lookout.position = Vector3(129, terrain_height(129, -40) + 3.0, -40)
	lookout.material_override = _emissive_material(Color("c0c4b8"), Color("453a2e"))
	add_child(lookout)


func _add_building(pos: Vector3, size: Vector3, color: Color, node_name: String) -> void:
	var building := MeshInstance3D.new()
	building.name = node_name
	var mesh := BoxMesh.new()
	mesh.size = size
	building.mesh = mesh
	building.position = pos
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.7
	building.material_override = material
	add_child(building)
	var body := StaticBody3D.new()
	body.position = pos
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)


func _emissive_material(color: Color, glow: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = glow
	material.emission_energy_multiplier = 1.2
	return material
