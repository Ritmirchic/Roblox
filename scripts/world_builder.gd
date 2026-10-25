class_name WorldBuilder
extends Node3D

const DoorScript = preload("res://scripts/door.gd")

var props: Dictionary = {}
var doors: Array[Node3D] = []
var lights: Array[OmniLight3D] = []
var elevator_door: HorrorDoor
var emergency_lights: Array[OmniLight3D] = []
var corridor_floor: MeshInstance3D
var corridor_ceiling: MeshInstance3D
var _materials: Dictionary = {}


func build() -> void:
	_create_materials()
	_build_corridor()
	_build_service_wing()
	_build_stairwell()
	_build_basement()
	_build_elevator()
	_build_landmarks()
	_build_trim_and_lights()


func validate_layout() -> Dictionary:
	var checks := {
		"corridor_floor": is_instance_valid(corridor_floor),
		"elevator_route": is_instance_valid(elevator_door),
		"basement_ramp": props.has("basement_stair_ramp"),
		"emergency_exit": props.has("emergency_exit"),
		"hidden_archive": props.has("previously_locked_room"),
		"apartment_doors": 0,
		"unique_door_ids": true
	}
	var door_ids: Dictionary = {}
	for door_node in doors:
		var door: HorrorDoor = door_node as HorrorDoor
		if str(door.door_id).begins_with("apartment_"):
			checks["apartment_doors"] += 1
		if door.door_id.is_empty() or door_ids.has(door.door_id):
			checks["unique_door_ids"] = false
		door_ids[door.door_id] = true
	checks["apartment_doors"] = checks["apartment_doors"] == 12
	var valid: bool = (
		checks["corridor_floor"]
		and checks["elevator_route"]
		and checks["basement_ramp"]
		and checks["emergency_exit"]
		and checks["hidden_archive"]
		and checks["apartment_doors"]
		and checks["unique_door_ids"]
	)
	return {"valid": valid, "checks": checks}


func _create_materials() -> void:
	_materials["wall"] = _worn(Color(0.47, 0.43, 0.36), Color(0.24, 0.22, 0.20), 8.0, 0.91, 0.8)
	_materials["hall"] = _worn(Color(0.39, 0.38, 0.34), Color(0.19, 0.20, 0.19), 12.0, 0.78, 0.0)
	_materials["ceiling"] = _worn(Color(0.34, 0.35, 0.33), Color(0.20, 0.21, 0.20), 10.0, 0.95, 0.0)
	_materials["wood"] = _worn(Color(0.25, 0.16, 0.10), Color(0.08, 0.07, 0.06), 14.0, 0.58, 0.0)
	_materials["wood_light"] = _worn(
		Color(0.39, 0.28, 0.18), Color(0.14, 0.10, 0.08), 18.0, 0.52, 0.0
	)
	_materials["fabric"] = _worn(Color(0.38, 0.35, 0.30), Color(0.15, 0.14, 0.13), 18.0, 0.97, 0.0)
	_materials["tile"] = _worn(Color(0.30, 0.31, 0.29), Color(0.15, 0.17, 0.16), 18.0, 0.35, 0.0)
	_materials["paint"] = _worn(Color(0.55, 0.51, 0.43), Color(0.25, 0.24, 0.22), 9.0, 0.88, 0.45)
	_materials["metal"] = _standard(Color(0.25, 0.28, 0.27), 0.73, 0.48)
	_materials["rust"] = _worn(Color(0.29, 0.15, 0.09), Color(0.09, 0.08, 0.07), 12.0, 0.91, 0.0)
	_materials["glass"] = _standard(Color(0.10, 0.18, 0.18, 0.42), 0.12, 0.0)
	_materials["lamp"] = _standard(Color(0.91, 0.72, 0.43), 0.52, 0.0, true)
	_materials["paper"] = _standard(Color(0.60, 0.56, 0.46), 0.93, 0.0)
	_materials["red"] = _standard(Color(0.38, 0.045, 0.025), 0.68, 0.0)


func _worn(base: Color, stain: Color, scale: float, rough: float, wear: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/worn_surface.gdshader")
	mat.set_shader_parameter("base_color", base)
	mat.set_shader_parameter("stain_color", stain)
	mat.set_shader_parameter("grain_scale", scale)
	mat.set_shader_parameter("roughness", rough)
	mat.set_shader_parameter("vertical_wear", wear)
	return mat


func _standard(color: Color, rough: float, metal: float, glow: bool = false) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = rough
	mat.metallic = metal
	if color.a < 1.0:
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	if glow:
		mat.emission_enabled = true
		mat.emission = color
		mat.emission_energy_multiplier = 0.45
	return mat


func _box(
	parent: Node3D,
	key: String,
	pos: Vector3,
	size: Vector3,
	material: Material,
	collision: bool = true
) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var item := MeshInstance3D.new()
	item.name = key if not key.is_empty() else "detail"
	item.mesh = mesh
	item.material_override = material
	item.position = pos
	parent.add_child(item)
	if collision:
		var body := StaticBody3D.new()
		body.name = "Collision_" + item.name
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = size
		shape.shape = box
		body.add_child(shape)
		body.position = pos
		parent.add_child(body)
		item.set_meta("collision_body", body)
	return item


func _register(key: String, node: Node3D) -> void:
	props[key] = node


func _build_corridor() -> void:
	corridor_floor = _box(
		self, "corridor_floor", Vector3(0, -0.12, 0), Vector3(6.8, 0.24, 54.0), _materials["hall"]
	)
	_box(self, "underlay", Vector3(0, -0.31, 0), Vector3(8.0, 0.15, 55.0), _materials["tile"])
	corridor_ceiling = _box(
		self,
		"corridor_ceiling",
		Vector3(0, 3.25, 0),
		Vector3(6.8, 0.24, 54.0),
		_materials["ceiling"],
		false
	)
	# Six paired doors have real openings cut through the plaster partitions.
	for side in [-1, 1]:
		var x := float(side) * 3.45
		_box(
			self,
			"skirting_%s" % side,
			Vector3(float(side) * 3.315, 0.12, 0),
			Vector3(0.055, 0.23, 53.7),
			_materials["wood"],
			false
		)
		for segment in range(7):
			var left_edge := -26.8 if segment == 0 else -20.0 + float(segment - 1) * 8.0 + 0.75
			var right_edge := 26.8 if segment == 6 else -20.0 + float(segment) * 8.0 - 0.75
			var segment_len := right_edge - left_edge
			var z0 := (left_edge + right_edge) * 0.5
			if side < 0 and segment == 5:
				_box(
					self,
					"corridor_wall_hidden_left",
					Vector3(x, 1.55, 13.0),
					Vector3(0.22, 3.1, 0.5),
					_materials["wall"],
					true
				)
				_box(
					self,
					"corridor_wall_hidden_right",
					Vector3(x, 1.55, 17.0),
					Vector3(0.22, 3.1, 4.5),
					_materials["wall"],
					true
				)
				var wall_cover := _box(
					self,
					"hidden_door_wall_cover",
					Vector3(x, 1.55, 14.0),
					Vector3(0.22, 3.1, 1.5),
					_materials["wall"],
					true
				)
				_register("new_door_cover", wall_cover)
			else:
				_box(
					self,
					"corridor_wall_%s_%d" % [side, segment],
					Vector3(x, 1.55, z0),
					Vector3(0.22, 3.1, segment_len),
					_materials["wall"],
					true
				)
			if segment < 6:
				var door_z := -20.0 + float(segment) * 8.0
				_box(
					self,
					"corridor_door_header_%s_%d" % [side, segment],
					Vector3(x, 2.72, door_z),
					Vector3(0.22, 0.76, 1.5),
					_materials["wall"],
					true
				)
	# Six apartment doors anchor the rooms to the corridor spine.
	for i in range(6):
		var z := -20.0 + float(i) * 8.0
		for side in [-1, 1]:
			var x := float(side) * 3.42
			var root := _make_door(
				"apartment_%02d_%s" % [i + 1, "L" if side < 0 else "R"],
				Vector3(x, 0, z),
				side < 0,
				i == 4 and side == 1
			)
			doors.append(root)
			# The gap at the threshold opens to a short apartment entry hall beyond the door.
		for side in [-1, 1]:
			var room_x := float(side) * 6.65
			_box(
				self,
				"apartment_floor_%02d_%s" % [i, side],
				Vector3(room_x, -0.13, z),
				Vector3(6.2, 0.26, 7.7),
				_materials["wood" if i % 2 == 0 else "tile"]
			)
			_box(
				self,
				"apartment_ceiling_%02d_%s" % [i, side],
				Vector3(room_x, 3.18, z),
				Vector3(6.2, 0.22, 7.7),
				_materials["ceiling"],
				false
			)
			var exterior_x := float(side) * 9.78
			if i in [3, 4]:
				for edge_sign in [-1, 1]:
					_box(
						self,
						"apartment_exterior_%02d_%s_%d" % [i, side, edge_sign],
						Vector3(exterior_x, 1.52, z + float(edge_sign) * 2.325),
						Vector3(0.24, 3.04, 3.05),
						_materials["wall"]
					)
				_box(
					self,
					"apartment_exterior_header_%d_%s" % [i, side],
					Vector3(exterior_x, 2.68, z),
					Vector3(0.24, 0.72, 1.6),
					_materials["wall"]
				)
				var service_door := _make_door(
					"service_access_%d_%s" % [i, side], Vector3(exterior_x, 0, z), side > 0, false
				)
				doors.append(service_door)
				var link := _box(
					self,
					"service_connector_%d_%s" % [i, side],
					Vector3(float(side) * 10.75, -0.13, z),
					Vector3(2.0, 0.24, 1.8),
					_materials["tile"]
				)
			else:
				_box(
					self,
					"apartment_exterior_%02d_%s" % [i, side],
					Vector3(exterior_x, 1.52, z),
					Vector3(0.24, 3.04, 7.7),
					_materials["wall"]
				)
			for end_sign in [-1, 1]:
				_box(
					self,
					"apartment_divider_%d_%d_%d" % [i, side, end_sign],
					Vector3(float(side) * 6.65, 1.52, z + float(end_sign) * 3.82),
					Vector3(6.2, 3.04, 0.18),
					_materials["wall"]
				)
			_make_room_furnishing(i, side, room_x, z)
	# Hall end walls frame a real passage to the stair lobby.
	# A centered 2.3 m opening connects the hall to the landing without sealing the progression route.
	for side in [-1, 1]:
		_box(
			self,
			"hall_far_wall_%d" % side,
			Vector3(float(side) * 2.0, 1.55, 26.9),
			Vector3(2.8, 3.1, 0.2),
			_materials["wall"]
		)
	_box(
		self, "hall_far_header", Vector3(0, 2.72, 26.9), Vector3(2.3, 0.76, 0.2), _materials["wall"]
	)
	_box(
		self, "hall_entry_wall", Vector3(0, 1.55, -26.9), Vector3(6.8, 3.1, 0.2), _materials["wall"]
	)


func _make_room_furnishing(i: int, side: int, cx: float, z: float) -> void:
	var prefix := "apt_%02d_%s_" % [i, side]
	# Rooms evolve from occupied flats into a maintenance/records wing through varied, modeled set dressing.
	if i % 3 == 0:
		var bed := Node3D.new()
		bed.name = prefix + "bed"
		bed.position = Vector3(cx - float(side) * 1.35, 0, z - 1.0)
		add_child(bed)
		_box(bed, "bed_frame", Vector3(0, 0.28, 0), Vector3(2.0, 0.35, 2.8), _materials["wood"])
		_box(bed, "mattress", Vector3(0, 0.58, 0), Vector3(1.92, 0.34, 2.68), _materials["fabric"])
		_box(
			bed,
			"quilt",
			Vector3(0, 0.79, 0.25),
			Vector3(1.95, 0.13, 1.7),
			_materials["wood_light" if i == 3 else "fabric"],
			false
		)
		_box(
			bed,
			"pillow",
			Vector3(0, 0.83, -0.88),
			Vector3(0.85, 0.15, 0.43),
			_materials["paper"],
			false
		)
		_register("furniture_bed_%02d" % i, bed)
		_register("furniture_bed_%02d_%s" % [i, side], bed)
		var table := _box(
			self,
			"nightstand_%d" % i,
			Vector3(cx, 0.55, z + 1.3),
			Vector3(0.65, 1.1, 0.65),
			_materials["wood"]
		)
		_register("furniture_move", table)
	else:
		var sofa := Node3D.new()
		sofa.name = prefix + "sofa"
		sofa.position = Vector3(cx - float(side) * 1.55, 0, z - 1.4)
		add_child(sofa)
		_box(sofa, "sofa_base", Vector3(0, 0.35, 0), Vector3(2.2, 0.48, 0.92), _materials["wood"])
		_box(
			sofa,
			"sofa_cushion",
			Vector3(0, 0.69, 0.02),
			Vector3(2.05, 0.30, 0.84),
			_materials["fabric"]
		)
		_box(
			sofa,
			"sofa_back",
			Vector3(0, 1.08, -0.34),
			Vector3(2.15, 0.85, 0.28),
			_materials["fabric"]
		)
		for arm in [-1, 1]:
			_box(
				sofa,
				"sofa_arm",
				Vector3(float(arm) * 1.0, 0.75, 0),
				Vector3(0.22, 0.6, 0.94),
				_materials["fabric"]
			)
		_register("furniture_move", sofa)
	# A small dining/kitchen corner, cabinets and a warm task lamp make each apartment read as lived-in.
	var cabinet_x := cx + float(side) * 1.6
	_box(
		self,
		"counter_%d" % i,
		Vector3(cabinet_x, 0.9, z + 1.9),
		Vector3(2.45, 1.75, 0.7),
		_materials["wood"]
	)
	_box(
		self,
		"countertop_%d" % i,
		Vector3(cabinet_x, 1.83, z + 1.9),
		Vector3(2.52, 0.12, 0.76),
		_materials["tile"],
		false
	)
	_box(
		self,
		"cabinet_upper_%d" % i,
		Vector3(cabinet_x, 2.3, z + 2.15),
		Vector3(2.4, 0.72, 0.42),
		_materials["wood_light"]
	)
	for drawer in range(3):
		_box(
			self,
			"drawer_pull_%d_%d" % [i, drawer],
			Vector3(cabinet_x + float(drawer - 1) * 0.65, 1.1, z + 1.52),
			Vector3(0.14, 0.035, 0.035),
			_materials["metal"],
			false
		)
	var painting := _make_painting(
		"painting_%02d" % i, Vector3(cx - float(side) * 2.9, 1.85, z + 0.1), side < 0
	)
	_register("painting_%02d" % i, painting)
	var window_frame := _box(
		self,
		"window_frame_%d_%d" % [i, side],
		Vector3(float(side) * 9.62, 1.82, z - 1.9),
		Vector3(0.10, 1.35, 1.9),
		_materials["wood_light"],
		false
	)
	var window := _box(
		self,
		"window_%d_%d" % [i, side],
		Vector3(float(side) * 9.54, 1.84, z - 1.9),
		Vector3(0.04, 1.12, 1.63),
		_materials["glass"],
		false
	)
	_register("impossible_window", window)
	_box(
		self,
		"exterior_window_sill_%d_%d" % [i, side],
		Vector3(float(side) * 10.38, -0.07, z - 1.9),
		Vector3(1.05, 0.14, 1.95),
		_materials["tile"]
	)
	if i == 1 and side == 1:
		var coat_rack := _make_coat_rack(Vector3(cx + 2.35, 0, z - 2.8))
		_register("object_wrong_room", coat_rack)
	_register("familiar_shape", window_frame)
	var light := OmniLight3D.new()
	light.name = "apartment_warm_light_%d_%d" % [i, side]
	light.position = Vector3(cx, 2.78, z)
	light.light_color = Color(0.83, 0.65, 0.43)
	light.light_energy = 0.32
	light.omni_range = 5.0
	add_child(light)


func _make_coat_rack(pos: Vector3) -> Node3D:
	var rack := Node3D.new()
	rack.name = "FamiliarCoatOnStand"
	rack.position = pos
	add_child(rack)
	var coat_material := _standard(Color(0.105, 0.12, 0.12), 0.97, 0.0)
	_box(rack, "coat_torso", Vector3(0, 1.34, 0), Vector3(0.66, 1.12, 0.18), coat_material, false)
	_box(
		rack, "coat_shoulders", Vector3(0, 1.92, 0), Vector3(0.91, 0.21, 0.20), coat_material, false
	)
	for side in [-1, 1]:
		var sleeve := MeshInstance3D.new()
		var sleeve_mesh := CapsuleMesh.new()
		sleeve_mesh.radius = 0.105
		sleeve_mesh.height = 0.86
		sleeve.mesh = sleeve_mesh
		sleeve.material_override = coat_material
		sleeve.position = Vector3(float(side) * 0.39, 1.53, 0)
		sleeve.rotation.z = float(side) * -0.28
		rack.add_child(sleeve)
		_box(
			rack,
			"cuff",
			Vector3(float(side) * 0.51, 1.16, 0),
			Vector3(0.18, 0.12, 0.18),
			_materials["wood"],
			false
		)
	_box(
		rack,
		"coat_collar",
		Vector3(0, 1.94, 0.02),
		Vector3(0.28, 0.16, 0.2),
		_materials["wood_light"],
		false
	)
	for button_index in range(4):
		_box(
			rack,
			"coat_button_%d" % button_index,
			Vector3(0.0, 1.65 - float(button_index) * 0.22, 0.11),
			Vector3(0.035, 0.035, 0.025),
			_materials["metal"],
			false
		)
	var pole_mesh := CylinderMesh.new()
	pole_mesh.top_radius = 0.025
	pole_mesh.bottom_radius = 0.035
	pole_mesh.height = 2.0
	var pole := MeshInstance3D.new()
	pole.name = "coat_stand_post"
	pole.mesh = pole_mesh
	pole.material_override = _materials["metal"]
	pole.position = Vector3(0, 0.98, 0.23)
	rack.add_child(pole)
	for foot in range(3):
		var angle := float(foot) * TAU / 3.0
		var leg := MeshInstance3D.new()
		var leg_mesh := CylinderMesh.new()
		leg_mesh.top_radius = 0.025
		leg_mesh.bottom_radius = 0.035
		leg_mesh.height = 0.48
		leg.mesh = leg_mesh
		leg.material_override = _materials["metal"]
		leg.position = Vector3(cos(angle) * 0.22, 0.23, 0.23 + sin(angle) * 0.22)
		leg.rotation.z = cos(angle) * 0.55
		leg.rotation.x = sin(angle) * 0.55
		rack.add_child(leg)
	return rack


func _make_painting(key: String, pos: Vector3, face_left: bool) -> MeshInstance3D:
	var group := Node3D.new()
	group.name = key + "_frame"
	group.position = pos
	group.rotation.y = PI * 0.5 if face_left else -PI * 0.5
	add_child(group)
	_box(
		group,
		"gilt_frame",
		Vector3(0, 0, 0),
		Vector3(0.11, 0.92, 1.25),
		_materials["wood_light"],
		false
	)
	var canvas := _box(
		group,
		"canvas",
		Vector3(0.07, 0, 0),
		Vector3(0.045, 0.76, 1.08),
		_standard(Color(0.29, 0.34, 0.31), 0.95, 0.0),
		false
	)
	# An abstract, hand-composed landscape is assembled from brush-like color planes rather than a blank panel.
	_box(
		group,
		"paint_sky",
		Vector3(0.1, 0.18, 0),
		Vector3(0.025, 0.31, 1.0),
		_standard(Color(0.24, 0.32, 0.34), 0.95, 0),
		false
	)
	_box(
		group,
		"paint_hills",
		Vector3(0.115, -0.12, -0.02),
		Vector3(0.03, 0.22, 0.94),
		_standard(Color(0.20, 0.25, 0.20), 0.99, 0),
		false
	)
	_register(key + "_scene", group)
	return canvas


func _build_service_wing() -> void:
	# Maintenance room, laundry, storage and a hidden records chamber branch from a short service corridor.
	var archive_door: HorrorDoor
	for cell in [
		{"name": "maintenance", "x": -15.2, "z": 4.0},
		{"name": "laundry", "x": 15.2, "z": 4.0},
		{"name": "storage", "x": -15.2, "z": 12.0},
		{"name": "records", "x": 15.2, "z": 12.0}
	]:
		var cx: float = cell["x"]
		var cz: float = cell["z"]
		var name: String = cell["name"]
		_box(
			self,
			name + "_floor",
			Vector3(cx, -0.12, cz),
			Vector3(7.0, 0.24, 8.5),
			_materials["tile"]
		)
		_box(
			self,
			name + "_ceiling",
			Vector3(cx, 3.15, cz),
			Vector3(7.0, 0.2, 8.5),
			_materials["ceiling"],
			false
		)
		var entry_side := 1.0 if cx < 0.0 else -1.0
		for sx in [-1, 1]:
			if float(sx) == entry_side:
				for edge_sign in [-1, 1]:
					_box(
						self,
						name + "_sidewall_%d" % edge_sign,
						Vector3(cx + float(sx) * 3.5, 1.5, cz + float(edge_sign) * 2.325),
						Vector3(0.2, 3.0, 3.05),
						_materials["wall"]
					)
				_box(
					self,
					name + "_sidewall_header",
					Vector3(cx + float(sx) * 3.5, 2.68, cz),
					Vector3(0.2, 0.72, 1.6),
					_materials["wall"]
				)
				var interior_door := _make_door(
					name + "_interior_door", Vector3(cx + float(sx) * 3.5, 0, cz), sx < 0, false
				)
				doors.append(interior_door)
			elif name == "records":
				for edge_sign in [-1, 1]:
					_box(
						self,
						"archive_entry_wall_%d" % edge_sign,
						Vector3(cx + float(sx) * 3.5, 1.5, cz + float(edge_sign) * 2.325),
						Vector3(0.2, 3.0, 3.05),
						_materials["wall"]
					)
				_box(
					self,
					"archive_entry_header",
					Vector3(cx + float(sx) * 3.5, 2.68, cz),
					Vector3(0.2, 0.72, 1.6),
					_materials["wall"]
				)
				archive_door = _make_door(
					"hidden_archive_door", Vector3(cx + float(sx) * 3.5, 0, cz), true, true
				)
				doors.append(archive_door)
			else:
				_box(
					self,
					name + "_sidewall",
					Vector3(cx + float(sx) * 3.5, 1.5, cz),
					Vector3(0.2, 3.0, 8.5),
					_materials["wall"]
				)
		for sz in [-1, 1]:
			_box(
				self,
				name + "_endwall",
				Vector3(cx, 1.5, cz + float(sz) * 4.25),
				Vector3(7.0, 3.0, 0.2),
				_materials["wall"]
			)
		var unit := _box(
			self,
			name + "_machine",
			Vector3(cx - 1.3, 1.05, cz),
			Vector3(1.25, 2.1, 1.3),
			_materials["metal"]
		)
		_box(
			self,
			name + "_machine_door",
			Vector3(cx - 1.3, 1.08, cz + 0.68),
			Vector3(0.84, 0.88, 0.07),
			_materials["glass"],
			false
		)
		if name == "laundry":
			var porthole := MeshInstance3D.new()
			var porthole_mesh := TorusMesh.new()
			porthole_mesh.inner_radius = 0.29
			porthole_mesh.outer_radius = 0.39
			porthole.mesh = porthole_mesh
			porthole.material_override = _materials["metal"]
			porthole.position = Vector3(cx - 1.3, 1.08, cz + 0.755)
			porthole.rotation.x = PI * 0.5
			add_child(porthole)
			for machine_index in range(2):
				var extra_x := cx + 0.2 + float(machine_index) * 1.45
				_box(
					self,
					"washer_%d_frame" % machine_index,
					Vector3(extra_x, 1.05, cz),
					Vector3(1.2, 2.1, 1.3),
					_materials["metal"]
				)
				var extra_window := MeshInstance3D.new()
				var extra_window_mesh := TorusMesh.new()
				extra_window_mesh.inner_radius = 0.29
				extra_window_mesh.outer_radius = 0.39
				extra_window.mesh = extra_window_mesh
				extra_window.material_override = _materials["metal"]
				extra_window.position = Vector3(extra_x, 1.08, cz + 0.72)
				extra_window.rotation.x = PI * 0.5
				add_child(extra_window)
		_box(
			self,
			name + "_shelf",
			Vector3(cx + 1.8, 1.35, cz - 2.4),
			Vector3(2.0, 2.7, 0.22),
			_materials["rust"]
		)
		for shelf in range(3):
			_box(
				self,
				name + "_shelf_%d" % shelf,
				Vector3(cx + 1.8, 0.55 + float(shelf) * 0.76, cz - 2.1),
				Vector3(2.0, 0.08, 0.75),
				_materials["wood"],
				false
			)
		if name == "records":
			_register("hidden_archive", unit)
			for stack in range(5):
				_box(
					self,
					"archive_box_%d" % stack,
					Vector3(
						cx - 1.5 + float(stack % 3) * 1.0, 0.5 + float(stack / 3) * 0.52, cz + 1.1
					),
					Vector3(0.82, 0.48, 0.68),
					_materials["paper"]
				)
	# Side links make service rooms reachable; the maintenance/records route is purposefully eerie but valid.
	_box(
		self,
		"maintenance_link_floor",
		Vector3(-10.72, -0.13, 4),
		Vector3(2.0, 0.24, 1.8),
		_materials["tile"]
	)
	_box(
		self,
		"laundry_link_floor",
		Vector3(10.72, -0.13, 4),
		Vector3(2.0, 0.24, 1.8),
		_materials["tile"]
	)
	_box(
		self,
		"storage_link_floor",
		Vector3(-10.72, -0.13, 12),
		Vector3(2.0, 0.24, 1.8),
		_materials["tile"]
	)
	_box(
		self,
		"records_link_floor",
		Vector3(10.72, -0.13, 12),
		Vector3(2.0, 0.24, 1.8),
		_materials["tile"]
	)
	_register("previously_locked_room", archive_door)
	_build_hidden_archive()
	# Pipes, junction boxes and conduit across the maintenance room.
	for pipe in range(4):
		var pipe_mesh := CylinderMesh.new()
		pipe_mesh.top_radius = 0.055
		pipe_mesh.bottom_radius = 0.055
		pipe_mesh.height = 6.4
		var pipe_node := MeshInstance3D.new()
		pipe_node.name = "exposed_pipe_%d" % pipe
		pipe_node.mesh = pipe_mesh
		pipe_node.material_override = _materials["rust"]
		pipe_node.position = Vector3(-17.8 + float(pipe) * 1.05, 2.65, -1.2)
		pipe_node.rotation.z = PI * 0.5
		add_child(pipe_node)
	_box(
		self,
		"electrical_panel",
		Vector3(-12.0, 1.8, 1.3),
		Vector3(0.12, 1.2, 0.85),
		_materials["metal"],
		false
	)
	_make_document("maintenance_roster", "page_roster", Vector3(-14.5, 0.04, 4.0))
	_make_document("laundry_receipt", "page_receipt", Vector3(15.7, 0.04, 5.8))
	_make_document("burned_letter", "page_letter", Vector3(-14.1, 0.04, 12.1))
	_make_document("archive_record", "page_archive", Vector3(22.1, 0.04, 12.5))


func _build_hidden_archive() -> void:
	var archive := Node3D.new()
	archive.name = "HiddenDocumentRoom"
	archive.position = Vector3(22.2, 0, 12.0)
	add_child(archive)
	_box(archive, "archive_floor", Vector3.ZERO, Vector3(7.0, 0.24, 8.5), _materials["wood"])
	_box(
		archive,
		"archive_ceiling",
		Vector3(0, 3.15, 0),
		Vector3(7.0, 0.2, 8.5),
		_materials["ceiling"],
		false
	)
	_box(
		archive,
		"archive_far_wall",
		Vector3(3.5, 1.5, 0),
		Vector3(0.2, 3.0, 8.5),
		_materials["wall"]
	)
	for side in [-1, 1]:
		_box(
			archive,
			"archive_endwall_%d" % side,
			Vector3(0, 1.5, float(side) * 4.25),
			Vector3(7.0, 3.0, 0.2),
			_materials["wall"]
		)
	for shelf in range(3):
		var sx := 1.25 + float(shelf) * 0.75
		_box(
			archive,
			"archive_shelf_%d" % shelf,
			Vector3(sx, 1.42, -2.55),
			Vector3(0.22, 2.7, 3.25),
			_materials["rust"]
		)
		for row in range(4):
			_box(
				archive,
				"archive_ledger_%d_%d" % [shelf, row],
				Vector3(sx - 0.18, 0.48 + float(row) * 0.47, -2.55),
				Vector3(0.16, 0.34, 0.46),
				_materials["paper"],
				false
			)
	_box(
		archive,
		"reading_table",
		Vector3(-1.65, 0.88, 1.45),
		Vector3(2.0, 1.68, 1.25),
		_materials["wood"]
	)
	_box(
		archive,
		"reading_light",
		Vector3(-1.65, 1.78, 1.45),
		Vector3(0.42, 0.09, 0.42),
		_materials["lamp"],
		false
	)
	var archive_light := OmniLight3D.new()
	archive_light.name = "ArchiveTaskLight"
	archive_light.position = Vector3(-1.65, 2.0, 1.45)
	archive_light.light_color = Color(0.86, 0.67, 0.39)
	archive_light.light_energy = 0.42
	archive_light.omni_range = 5.5
	archive.add_child(archive_light)
	_register("hidden_archive", archive)


func _make_document(key: String, document_id: String, pos: Vector3) -> void:
	var paper := MeshInstance3D.new()
	paper.name = key
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.38, 0.035, 0.27)
	paper.mesh = mesh
	paper.material_override = _materials["paper"]
	paper.position = pos
	add_child(paper)
	var body := StaticBody3D.new()
	body.name = "ReadablePage"
	body.set_meta("document_id", document_id)
	var shape := CollisionShape3D.new()
	var collision := BoxShape3D.new()
	collision.size = Vector3(0.56, 0.24, 0.42)
	shape.shape = collision
	body.position = pos
	body.add_child(shape)
	add_child(body)
	_register(document_id, body)


func _build_stairwell() -> void:
	_box(
		self,
		"stairwell_landing",
		Vector3(0, -0.12, 29.3),
		Vector3(7.0, 0.24, 6.0),
		_materials["tile"]
	)
	_box(
		self,
		"stairwell_ceiling",
		Vector3(0, 3.2, 29.3),
		Vector3(7.0, 0.2, 6.0),
		_materials["ceiling"],
		false
	)
	for step in range(10):
		var y := 0.16 + float(step) * 0.27
		var z := 27.0 + float(step) * 0.52
		_box(
			self,
			"stair_tread_%d" % step,
			Vector3(-1.75, y, z),
			Vector3(2.3, 0.18, 0.58),
			_materials["tile"]
		)
		_box(
			self,
			"stair_riser_%d" % step,
			Vector3(-1.75, y - 0.12, z - 0.24),
			Vector3(2.3, 0.3, 0.1),
			_materials["wall"],
			false
		)
	for side in [-1, 1]:
		_box(
			self,
			"stairwell_wall_%d" % side,
			Vector3(float(side) * 3.35, 1.5, 29.4),
			Vector3(0.2, 3.0, 6.0),
			_materials["wall"]
		)
	var emergency := OmniLight3D.new()
	emergency.name = "stair_emergency_light"
	emergency.position = Vector3(0, 2.72, 29.3)
	emergency.light_color = Color(0.58, 0.09, 0.045)
	emergency.light_energy = 0.0
	emergency.omni_range = 9
	add_child(emergency)
	emergency_lights.append(emergency)
	_register("corridor_length", corridor_floor)


func _build_basement() -> void:
	# A sloped service stair begins at the stair landing and descends to the actual boiler basement.
	var ramp_angle := atan(3.05 / 5.7)
	var ramp_visual := BoxMesh.new()
	ramp_visual.size = Vector3(1.45, 0.24, 5.7)
	var ramp := MeshInstance3D.new()
	ramp.name = "basement_access_ramp"
	ramp.mesh = ramp_visual
	ramp.material_override = _materials["tile"]
	ramp.position = Vector3(1.85, -1.40, 35.05)
	ramp.rotation.x = ramp_angle
	add_child(ramp)
	var ramp_body := StaticBody3D.new()
	var ramp_shape := CollisionShape3D.new()
	var ramp_box := BoxShape3D.new()
	ramp_box.size = ramp_visual.size
	ramp_shape.shape = ramp_box
	ramp_body.add_child(ramp_shape)
	ramp_body.position = ramp.position
	ramp_body.rotation = ramp.rotation
	add_child(ramp_body)
	_register("basement_stair_ramp", ramp)
	for side in [-1, 1]:
		var handrail := _box(
			self,
			"stair_handrail_%d" % side,
			Vector3(1.85 + float(side) * 0.78, -1.06, 35.05),
			Vector3(0.08, 0.72, 5.7),
			_materials["metal"],
			false
		)
		handrail.rotation.x = ramp_angle
	# The basement room is a closed boiler/service volume with a lit maintenance aisle and a real emergency exit.
	_box(
		self,
		"basement_floor",
		Vector3(0, -3.36, 42.2),
		Vector3(10.0, 0.24, 12.4),
		_materials["tile"]
	)
	_box(
		self,
		"basement_ceiling_left",
		Vector3(-2.05, -0.13, 42.2),
		Vector3(5.9, 0.18, 12.4),
		_materials["ceiling"],
		false
	)
	_box(
		self,
		"basement_ceiling_right",
		Vector3(3.9, -0.13, 42.2),
		Vector3(2.2, 0.18, 12.4),
		_materials["ceiling"],
		false
	)
	_box(
		self,
		"basement_ceiling_far",
		Vector3(1.85, -0.13, 43.2),
		Vector3(1.9, 0.18, 10.4),
		_materials["ceiling"],
		false
	)
	for side in [-1, 1]:
		_box(
			self,
			"basement_sidewall_%d" % side,
			Vector3(float(side) * 5.0, -1.68, 42.2),
			Vector3(0.22, 3.25, 12.4),
			_materials["wall"]
		)
	_box(
		self,
		"basement_entry_wall_left",
		Vector3(-2.025, -1.68, 36.0),
		Vector3(5.95, 3.25, 0.22),
		_materials["wall"]
	)
	_box(
		self,
		"basement_entry_wall_right",
		Vector3(3.875, -1.68, 36.0),
		Vector3(2.25, 3.25, 0.22),
		_materials["wall"]
	)
	_box(
		self,
		"basement_entry_header",
		Vector3(1.85, -0.33, 36.0),
		Vector3(1.8, 0.55, 0.22),
		_materials["wall"]
	)
	for side in [-1, 1]:
		_box(
			self,
			"emergency_exit_wall_%d" % side,
			Vector3(float(side) * 3.9, -1.68, 48.4),
			Vector3(2.2, 3.25, 0.22),
			_materials["wall"]
		)
	_box(
		self,
		"emergency_exit_header",
		Vector3(0, -0.52, 48.4),
		Vector3(1.6, 0.92, 0.22),
		_materials["wall"]
	)
	var exit_door := _make_door("basement_emergency_exit", Vector3(0, -3.25, 48.4), true, false)
	exit_door.rotation.y = PI * 0.5
	doors.append(exit_door)
	_register("emergency_exit", exit_door)
	_box(self, "exit_apron", Vector3(0, -3.38, 50.4), Vector3(4.4, 0.22, 4.0), _materials["tile"])
	# Boiler, expansion vessel, valved pipework and a live junction panel give the room a distinct industrial silhouette.
	_box(
		self,
		"boiler_plinth",
		Vector3(-2.7, -3.03, 41.1),
		Vector3(2.25, 0.44, 2.5),
		_materials["metal"]
	)
	var boiler_mesh := CylinderMesh.new()
	boiler_mesh.top_radius = 0.7
	boiler_mesh.bottom_radius = 0.78
	boiler_mesh.height = 2.2
	var boiler := MeshInstance3D.new()
	boiler.name = "main_boiler"
	boiler.mesh = boiler_mesh
	boiler.material_override = _materials["rust"]
	boiler.position = Vector3(-2.7, -1.65, 41.1)
	add_child(boiler)
	_register("basement_boiler", boiler)
	for pipe in range(3):
		var pipe_mesh := CylinderMesh.new()
		pipe_mesh.top_radius = 0.09
		pipe_mesh.bottom_radius = 0.09
		pipe_mesh.height = 9.1
		var pipe_node := MeshInstance3D.new()
		pipe_node.name = "basement_return_pipe_%d" % pipe
		pipe_node.mesh = pipe_mesh
		pipe_node.material_override = _materials["rust"]
		pipe_node.position = Vector3(-4.25 + float(pipe) * 0.72, -1.55, 42.2)
		pipe_node.rotation.x = PI * 0.5
		add_child(pipe_node)
	var work_light := OmniLight3D.new()
	work_light.name = "basement_worklight"
	work_light.position = Vector3(1.6, -0.55, 41.8)
	work_light.light_color = Color(0.66, 0.72, 0.63)
	work_light.light_energy = 0.52
	work_light.omni_range = 8.0
	add_child(work_light)


func _build_elevator() -> void:
	_box(
		self,
		"elevator_recess",
		Vector3(0, 1.45, 24.5),
		Vector3(2.35, 2.9, 0.55),
		_materials["metal"],
		false
	)
	_box(
		self,
		"elevator_cabin_floor",
		Vector3(0, -0.08, 26.1),
		Vector3(2.2, 0.18, 2.7),
		_materials["tile"]
	)
	elevator_door = _make_door("elevator_doors", Vector3(0, 0, 24.2), false, false, true)
	elevator_door.rotation.y = PI * 0.5
	doors.append(elevator_door)
	_register("elevator_door", elevator_door)
	var display := _box(
		self,
		"elevator_display",
		Vector3(0, 2.46, 24.12),
		Vector3(0.38, 0.28, 0.07),
		_materials["red"],
		false
	)
	_register("elevator_wrong_floor", display)
	var floor_indicator := Label3D.new()
	floor_indicator.name = "ElevatorFloorReadout"
	floor_indicator.text = "04"
	floor_indicator.position = Vector3(0, 2.46, 24.065)
	floor_indicator.rotation.y = PI
	floor_indicator.font_size = 64
	floor_indicator.pixel_size = 0.0028
	floor_indicator.modulate = Color(1.0, 0.35, 0.18)
	floor_indicator.outline_size = 5
	floor_indicator.outline_modulate = Color(0.12, 0.015, 0.01)
	add_child(floor_indicator)
	_register("elevator_floor_label", floor_indicator)
	for side in [-1, 1]:
		_box(
			self,
			"elevator_trim_%d" % side,
			Vector3(float(side) * 1.32, 1.5, 24.1),
			Vector3(0.18, 3.05, 0.16),
			_materials["metal"],
			false
		)


func _build_landmarks() -> void:
	# A grandfather clock with a pendulum, an analog radio, a telephone and a small lit votive recur across looped corridors.
	var clock := Node3D.new()
	clock.name = "hall_clock"
	clock.position = Vector3(2.65, 0, -7.0)
	add_child(clock)
	_box(
		clock, "clock_case", Vector3(0, 1.25, 0), Vector3(0.5, 2.5, 0.34), _materials["wood_light"]
	)
	_box(
		clock,
		"clock_face",
		Vector3(0, 2.05, 0.19),
		Vector3(0.38, 0.44, 0.04),
		_materials["paper"],
		false
	)
	_box(
		clock,
		"clock_pendulum",
		Vector3(0, 0.9, 0.19),
		Vector3(0.12, 0.48, 0.05),
		_materials["metal"],
		false
	)
	_register("familiar_shape", clock)
	var radio := _box(
		self,
		"shortwave_radio",
		Vector3(2.62, 0.72, 5.5),
		Vector3(0.58, 0.44, 0.34),
		_materials["wood"]
	)
	_register("radio", radio)
	var candle := _box(
		self,
		"hall_candle",
		Vector3(-2.55, 0.45, 15.5),
		Vector3(0.15, 0.42, 0.15),
		_materials["paper"],
		false
	)
	_register("disappearing_object", candle)
	var vent := _box(
		self,
		"ceiling_fixture",
		Vector3(0, 3.02, 3.5),
		Vector3(1.1, 0.12, 0.5),
		_materials["metal"],
		false
	)
	_register("moving_fixture", vent)
	var new_door := _make_door("impossible_door", Vector3(-3.44, 0, 14.0), true, true)
	new_door.set_door_enabled(false)
	new_door.set_meta("anomaly_only", true)
	doors.append(new_door)
	_register("new_door", new_door)
	var locked_knock := _make_door("locked_knock_door", Vector3(3.43, 0, 8.2), false, true)
	doors.append(locked_knock)
	_register("locked_door", locked_knock)
	# Placards and collected fragments are actual in-world meshes with readable material labels supplied by UI journal.
	for i in range(4):
		var sign := _box(
			self,
			"floor_sign_%d" % i,
			Vector3(0, 2.7, -21.0 + float(i) * 14),
			Vector3(0.75, 0.22, 0.045),
			_materials["metal"],
			false
		)
		_register("sign_%d" % i, sign)


func _build_trim_and_lights() -> void:
	for z_index in range(8):
		var z := -21.0 + float(z_index) * 6.0
		var fixture := Node3D.new()
		fixture.name = "ceiling_tube_%02d" % z_index
		fixture.position = Vector3(0, 3.0, z)
		add_child(fixture)
		_box(
			fixture,
			"diffuser",
			Vector3(0, 0, 0),
			Vector3(1.25, 0.075, 0.29),
			_materials["lamp"],
			false
		)
		var light := OmniLight3D.new()
		light.name = "failing_fluorescent_%02d" % z_index
		light.position = Vector3(0, -0.18, 0)
		light.light_color = Color(0.78, 0.83, 0.76)
		light.light_energy = 0.48 if z_index % 3 != 1 else 0.25
		light.omni_range = 7.0
		light.omni_attenuation = 1.55
		fixture.add_child(light)
		lights.append(light)
		if z_index in [1, 4]:
			_register("hallway_light", light)
	# Exposed, aged conduit runs just below the ceiling to anchor the institutional architecture.
	for side in [-1, 1]:
		var pipe := CylinderMesh.new()
		pipe.top_radius = 0.055
		pipe.bottom_radius = 0.055
		pipe.height = 52.0
		var node := MeshInstance3D.new()
		node.name = "corridor_conduit_%d" % side
		node.mesh = pipe
		node.material_override = _materials["rust"]
		node.position = Vector3(float(side) * 2.82, 2.93, 0)
		node.rotation.x = PI * 0.5
		add_child(node)


func _make_door(
	key: String, pos: Vector3, hinge_left: bool, locked: bool, slide: bool = false
) -> HorrorDoor:
	var root := Node3D.new()
	root.name = key
	root.position = pos
	root.set_script(DoorScript)
	root.set("door_id", key)
	root.set("is_locked", locked)
	root.set("is_sliding", slide)
	root.set("hinge_left", hinge_left)
	add_child(root)
	return root as HorrorDoor
