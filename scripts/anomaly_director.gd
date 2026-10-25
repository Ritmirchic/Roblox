class_name AnomalyDirector
extends Node

signal anomaly_started(index: int, title: String)
signal anomaly_cleared

const CATALOG := [
	{
		"title": "The Quiet Landscape",
		"clue": "The landscape's ridge line has a second, impossible horizon.",
		"kind": "visual"
	},
	{
		"title": "Furniture Out of Place",
		"clue": "The sitting-room sofa is not where it was left.",
		"kind": "visual"
	},
	{
		"title": "A Missing Candle",
		"clue": "The wax stub has vanished, but its soot ring remains.",
		"kind": "visual"
	},
	{
		"title": "A Door That Wasn't There",
		"clue": "A fresh door has appeared where the plaster was unbroken.",
		"kind": "visual"
	},
	{
		"title": "Wallpaper Bloom",
		"clue": "A damp pattern is spreading against the paper's direction.",
		"kind": "visual"
	},
	{
		"title": "The Wrong Night",
		"clue": "The windows show a sky with no moon and no recognizable stars.",
		"kind": "visual"
	},
	{
		"title": "Fluorescent Stutter",
		"clue": "One lamp is pulsing against the rhythm of the others.",
		"kind": "visual"
	},
	{
		"title": "The Coat in the Hall",
		"clue": "A familiar coat has been left on the corridor's center line.",
		"kind": "visual"
	},
	{
		"title": "Fixture Drift",
		"clue": "The ceiling fixture is no longer aligned with its mounting marks.",
		"kind": "visual"
	},
	{
		"title": "The Clock's Face",
		"clue": "The hall clock has grown taller since your last pass.",
		"kind": "visual"
	},
	{
		"title": "Steps Behind You",
		"clue": "A second set of footsteps keeps exactly half a pace behind.",
		"kind": "audio"
	},
	{
		"title": "The Room Is Whispering",
		"clue": "A breathy voice comes from the closed room to your left.",
		"kind": "audio"
	},
	{
		"title": "Three Knocks",
		"clue": "Three measured knocks answer from a door that is locked.",
		"kind": "audio"
	},
	{
		"title": "The Radio Finds a Voice",
		"clue": "Static on the shortwave rises and falls like a sentence.",
		"kind": "audio"
	},
	{
		"title": "A Scream Below",
		"clue": "A single distant scream rises from below the building.",
		"kind": "audio"
	},
	{
		"title": "The Empty Elevator",
		"clue": "The lift chimes and strains, though its doors never move.",
		"kind": "audio"
	},
	{
		"title": "The Floor Above",
		"clue": "Slow footsteps cross the floor above, then stop overhead.",
		"kind": "audio"
	},
	{
		"title": "Someone Breathing",
		"clue": "A slow, close breath pauses whenever you turn around.",
		"kind": "audio"
	},
	{
		"title": "Latch from the Other Side",
		"clue": "A door you left ajar has locked itself from within.",
		"kind": "environment"
	},
	{
		"title": "The Long Hall",
		"clue": "The stair landing has receded and the light spacing no longer adds up.",
		"kind": "environment"
	},
	{
		"title": "A Changed Arrangement",
		"clue": "The bed and cabinet have exchanged their places in the apartment.",
		"kind": "environment"
	},
	{
		"title": "Basement, Not Floor Four",
		"clue": "The elevator display names a floor below the building's foundations.",
		"kind": "environment"
	},
	{
		"title": "Emergency Current",
		"clue": "The red emergency fittings are lit, but the power is still out.",
		"kind": "environment"
	},
	{
		"title": "Blocked Passage",
		"clue": "The settee is directly across your usual route.",
		"kind": "environment"
	},
	{
		"title": "The Archive Stands Open",
		"clue": "The records-room lock has turned without a key.",
		"kind": "environment"
	},
	{
		"title": "The Figure at the Landing",
		"clue": "A tall figure waits at the end of the corridor and moves only unseen.",
		"kind": "entity"
	},
	{
		"title": "A Passing Shadow",
		"clue": "A human-shaped shadow crosses the wall against the light.",
		"kind": "entity"
	},
	{
		"title": "The Watcher in the Window",
		"clue": "A face is looking in from the wrong side of the fourth-floor glass.",
		"kind": "entity"
	},
	{
		"title": "Behind the Door",
		"clue": "A narrow figure waits behind the half-open maintenance door.",
		"kind": "entity"
	},
	{
		"title": "The Long Pursuit",
		"clue": "Something is keeping pace behind you without making a sound.",
		"kind": "entity"
	}
]

var world: WorldBuilder
var player: HorrorPlayer
var audio: AudioDirector
var entities: Dictionary = {}
var active_id := -1
var is_active := false
var _time := 0.0
var _effect_clock := 0.0
var _saved: Dictionary = {}
var _temporary: Array[Node] = []
var _active_audio: Array[AudioStreamPlayer3D] = []
var _door_baseline: Array[Dictionary] = []
var _initialised := false


func setup(
	new_world: WorldBuilder,
	new_player: HorrorPlayer,
	new_audio: AudioDirector,
	new_entities: Dictionary
) -> void:
	world = new_world
	player = new_player
	audio = new_audio
	entities = new_entities
	if not _initialised:
		for door_node in world.doors:
			var door: HorrorDoor = door_node as HorrorDoor
			_door_baseline.append({"open": door.is_open, "locked": door.is_locked})
		_initialised = true


func catalog() -> Array:
	return CATALOG.duplicate(true)


func play_entity_cue(cue_name: String, cue_position: Vector3) -> void:
	_play_cue(cue_name, cue_position, -12.0, 22.0)


func begin(index: int) -> void:
	clear()
	if index < 1 or index > CATALOG.size():
		push_error("Anomaly ID out of catalog bounds: %d" % index)
		return
	active_id = index
	is_active = true
	_time = 0.0
	_effect_clock = 0.0
	_apply(index)
	anomaly_started.emit(index, CATALOG[index - 1]["title"])


func clear() -> void:
	for node in _saved.values():
		if not is_instance_valid(node["node"]):
			continue
		var target: Node3D = node["node"]
		target.position = node["position"]
		target.rotation = node["rotation"]
		target.scale = node["scale"]
		target.visible = node["visible"]
		if target is MeshInstance3D and node.has("material"):
			target.material_override = node["material"]
		if target is Label3D and node.has("text"):
			target.text = node["text"]
		if target is Light3D and node.has("light_energy"):
			target.light_energy = node["light_energy"]
			target.light_color = node["light_color"]
		if node.has("layer") and target.has_meta("collision_body"):
			var body: StaticBody3D = target.get_meta("collision_body")
			if is_instance_valid(body):
				body.collision_layer = node["layer"]
	for item in _temporary:
		if is_instance_valid(item):
			item.queue_free()
	_temporary.clear()
	for emitter in _active_audio:
		if is_instance_valid(emitter):
			emitter.stop()
			emitter.queue_free()
	_active_audio.clear()
	for actor in entities.values():
		if is_instance_valid(actor):
			actor.deactivate()
	for door_index in range(mini(world.doors.size(), _door_baseline.size())):
		var door: HorrorDoor = world.doors[door_index] as HorrorDoor
		var baseline: Dictionary = _door_baseline[door_index]
		door.reset_door()
		door.is_locked = baseline["locked"]
		if baseline["open"]:
			door.force_open()
		if door.has_meta("anomaly_only"):
			door.set_door_enabled(false)
	_saved.clear()
	active_id = -1
	is_active = false
	anomaly_cleared.emit()


func _remember(node: Node) -> void:
	if not is_instance_valid(node):
		return
	var key := str(node.get_instance_id())
	if _saved.has(key):
		return
	if not node is Node3D:
		return
	var state := {
		"node": node,
		"position": node.position,
		"rotation": node.rotation,
		"scale": node.scale,
		"visible": node.visible
	}
	if node is MeshInstance3D:
		state["material"] = node.material_override
	if node is Label3D:
		state["text"] = node.text
	if node is Light3D:
		state["light_energy"] = node.light_energy
		state["light_color"] = node.light_color
	if node.has_meta("collision_body"):
		var body: StaticBody3D = node.get_meta("collision_body")
		state["layer"] = body.collision_layer
	_saved[key] = state


func _prop(key: String) -> Variant:
	return world.props.get(key, null) if world != null else null


func _apply(index: int) -> void:
	var node: Variant
	match index:
		1:
			node = _prop("painting_02")
			if node is MeshInstance3D:
				_remember(node)
				var changed := StandardMaterial3D.new()
				changed.albedo_color = Color(0.31, 0.07, 0.06)
				changed.roughness = 0.96
				node.material_override = changed
				var scene: Node3D = _prop("painting_02_scene")
				if scene:
					for child in scene.get_children():
						if child is MeshInstance3D and child.name.begins_with("paint_"):
							_remember(child)
							child.material_override = _blood_material()
		2:
			node = _prop("furniture_move")
			if node is Node3D:
				_remember(node)
				node.position = Vector3(0.0, node.position.y, 17.3)
				node.rotation.y += 0.6
		3:
			node = _prop("disappearing_object")
			if node is Node3D:
				_remember(node)
				node.visible = false
		4:
			node = _prop("new_door")
			if node is HorrorDoor:
				node.set_door_enabled(true)
				node.is_locked = false
			var cover: Node3D = _prop("new_door_cover")
			if cover:
				_remember(cover)
				cover.visible = false
				if cover.has_meta("collision_body"):
					var body: StaticBody3D = cover.get_meta("collision_body")
					body.collision_layer = 0
		5:
			for wall_node in world.find_children("corridor_wall*", "MeshInstance3D", true, false):
				if wall_node is MeshInstance3D:
					_remember(wall_node)
					wall_node.material_override = _wallpaper_material()
		6:
			node = _prop("impossible_window")
			if node is MeshInstance3D:
				_remember(node)
				node.material_override = _night_material()
				var window_frame: Node3D = _prop("familiar_shape")
				if window_frame:
					_remember(window_frame)
					window_frame.scale = Vector3(1.15, 0.82, 1.2)
		7:
			for lamp in world.lights:
				_remember(lamp)
				lamp.light_color = Color(0.28, 0.48, 0.56)
				lamp.light_energy = 0.02
		8:
			node = _prop("object_wrong_room")
			if node is Node3D:
				_remember(node)
				node.position = Vector3(0.7, 0.52, -2.4)
				node.scale = Vector3(1.0, 1.5, 0.58)
		9:
			node = _prop("moving_fixture")
			if node is Node3D:
				_remember(node)
				node.position.z += 3.2
				node.rotation.z = 0.28
		10:
			node = _prop("familiar_shape")
			if node is Node3D:
				_remember(node)
				node.scale = Vector3(1.0, 1.72, 1.0)
		11:
			_play_behind("footstep", -7.5)
		12:
			_play_cue("whisper", Vector3(-6.0, 1.25, 4.0), -9.0)
		13:
			node = _prop("locked_door")
			if node is HorrorDoor:
				node.is_locked = true
			_play_cue("knock", Vector3(3.4, 1.25, 8.2), -6.0)
		14:
			_play_cue("radio", Vector3(2.6, 0.75, 5.5), -7.0)
		15:
			_play_cue("scream", Vector3(0, 0.5, 30), -9.0, 42)
		16:
			_play_cue("elevator", Vector3(0, 1.1, 24.7), -8.0)
		17:
			_play_cue("footstep", Vector3(2.0, 3.6, 8.0), -9.0, 20)
		18:
			_play_behind("breath", -12.0)
		19:
			var door: HorrorDoor = world.doors[3] as HorrorDoor
			door.is_locked = true
		20:
			_build_extension()
		21:
			for bed_key in ["furniture_bed_03_-1", "furniture_bed_03_1"]:
				var bed: Node3D = _prop(bed_key)
				if bed:
					_remember(bed)
					var direction := -1.0 if bed_key.ends_with("-1") else 1.0
					bed.position += Vector3(direction * 1.05, 0, 1.45)
					bed.rotation.y += PI * 0.5
		22:
			node = _prop("elevator_wrong_floor")
			if node is MeshInstance3D:
				_remember(node)
				node.material_override = _blood_material()
				node.scale = Vector3(1.3, 1.0, 1.0)
			var floor_label: Label3D = _prop("elevator_floor_label")
			if floor_label:
				_remember(floor_label)
				floor_label.text = "B1"
			_play_cue("elevator", Vector3(0, 1.3, 24.5), -10.0)
		23:
			for emergency in world.emergency_lights:
				_remember(emergency)
				emergency.light_energy = 1.5
		24:
			node = _prop("furniture_move")
			if node is Node3D:
				_remember(node)
				node.position = Vector3(0.0, node.position.y, 22.5)
		25:
			node = _prop("previously_locked_room")
			if node is HorrorDoor:
				node.force_open()
		26:
			_activate_entity("observer", Vector3(0, 0, 21.5))
		27:
			_make_shadow()
		28:
			_activate_entity("imitator", Vector3(10.45, 0, 10.1))
		29:
			var door: HorrorDoor = _door_for_id("apartment_05_L")
			if door and not door.is_open:
				door.interact()
			_activate_entity("listener", Vector3(-5.2, 0, 12.0))
		30:
			_activate_entity("observer", Vector3(0, 0, 21.5))


func _process(delta: float) -> void:
	if not is_active:
		return
	_time += delta
	_effect_clock += delta
	if active_id == 7 and _effect_clock > 0.24:
		_effect_clock = 0.0
		for light in world.lights:
			light.light_energy = randf_range(0.05, 0.62)
	if active_id == 11 and _effect_clock > 1.9:
		_effect_clock = 0.0
		_play_behind("footstep", -9.0)
	if active_id == 12 and _effect_clock > 4.2:
		_effect_clock = 0.0
		_play_cue("whisper", Vector3(-7, 1.1, 5), -10)
	if active_id == 13 and _effect_clock > 3.1:
		_effect_clock = 0.0
		_play_cue("knock", Vector3(3.4, 1.25, 8.2), -7)
	if active_id == 18 and _effect_clock > 5.0:
		_effect_clock = 0.0
		_play_behind("breath", -12.0)


func _play_cue(cue: String, at: Vector3, volume_db: float, max_distance: float = 28.0) -> void:
	if audio == null or not is_instance_valid(audio):
		return
	var emitter: AudioStreamPlayer3D = audio.play_at(cue, at, volume_db, max_distance)
	if emitter != null:
		_active_audio.append(emitter)


func _play_behind(cue: String, volume: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	var behind := player.global_position + player.global_transform.basis.z * 3.2
	_play_cue(cue, behind + Vector3.UP * 0.1, volume, 24)


func _door_for_id(key: String) -> HorrorDoor:
	for door_node in world.doors:
		var door: HorrorDoor = door_node as HorrorDoor
		if door.door_id == key:
			return door
	return null


func _activate_entity(kind: String, spawn: Vector3) -> void:
	var actor: HorrorEntity = entities.get(kind, null)
	if actor != null and is_instance_valid(actor):
		actor.activate(player, spawn)


func _blood_material() -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.26, 0.035, 0.028)
	material.roughness = 0.96
	return material


func _wallpaper_material() -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = load("res://shaders/worn_surface.gdshader")
	material.set_shader_parameter("base_color", Color(0.30, 0.12, 0.15))
	material.set_shader_parameter("stain_color", Color(0.09, 0.055, 0.08))
	material.set_shader_parameter("grain_scale", 19.0)
	material.set_shader_parameter("roughness", 0.93)
	material.set_shader_parameter("vertical_wear", 0.55)
	return material


func _night_material() -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = load("res://shaders/impossible_window.gdshader")
	return material


func _build_extension() -> void:
	var extension := Node3D.new()
	extension.name = "ImpossibleCorridorExtension"
	world.add_child(extension)
	_temporary.append(extension)
	var wall_material := _wallpaper_material()
	var floor_material := StandardMaterial3D.new()
	floor_material.albedo_color = Color(0.13, 0.15, 0.15)
	floor_material.roughness = 0.62
	_add_box(
		extension,
		"EndlessFloor",
		Vector3(0, -0.12, 41),
		Vector3(6.8, 0.24, 28),
		floor_material,
		true
	)
	_add_box(
		extension,
		"EndlessCeiling",
		Vector3(0, 3.2, 41),
		Vector3(6.8, 0.2, 28),
		wall_material,
		false
	)
	for side in [-1, 1]:
		_add_box(
			extension,
			"EndlessWall",
			Vector3(float(side) * 3.45, 1.5, 41),
			Vector3(0.22, 3.0, 28),
			wall_material,
			true
		)
	_add_box(
		extension, "EndlessEnd", Vector3(0, 1.5, 55), Vector3(6.8, 3.0, 0.2), wall_material, true
	)
	for i in range(5):
		var light := OmniLight3D.new()
		light.position = Vector3(0, 2.85, 30 + float(i) * 5.2)
		light.light_color = Color(0.72, 0.79, 0.78)
		light.light_energy = 0.33
		light.omni_range = 6.0
		extension.add_child(light)
		_add_box(
			extension,
			"Tube",
			Vector3(0, 3.0, 30 + float(i) * 5.2),
			Vector3(1.2, 0.07, 0.3),
			_night_material(),
			false
		)


func _add_box(
	parent: Node3D, key: String, pos: Vector3, size: Vector3, material: Material, collidable: bool
) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var visual := MeshInstance3D.new()
	visual.name = key
	visual.mesh = mesh
	visual.material_override = material
	visual.position = pos
	parent.add_child(visual)
	if collidable:
		var body := StaticBody3D.new()
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = size
		shape.shape = box
		body.add_child(shape)
		body.position = pos
		parent.add_child(body)
	return visual


func _make_shadow() -> void:
	var shadow := Node3D.new()
	shadow.name = "PassingShadow"
	shadow.position = Vector3(3.31, 1.3, 6.0)
	world.add_child(shadow)
	_temporary.append(shadow)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.006, 0.008, 0.009, 0.87)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var torso := MeshInstance3D.new()
	var torso_mesh := CapsuleMesh.new()
	torso_mesh.radius = 0.30
	torso_mesh.height = 1.65
	torso.mesh = torso_mesh
	torso.material_override = material
	torso.scale = Vector3(0.85, 1.0, 0.45)
	torso.position.y = 0.15
	shadow.add_child(torso)
	for side in [-1, 1]:
		var arm := MeshInstance3D.new()
		var mesh := CapsuleMesh.new()
		mesh.radius = 0.10
		mesh.height = 1.15
		arm.mesh = mesh
		arm.material_override = material
		arm.position = Vector3(float(side) * 0.38, 0.1, 0)
		arm.rotation.z = float(side) * 0.18
		shadow.add_child(arm)
	var tween := shadow.create_tween()
	tween.tween_property(shadow, "position:z", -1.0, 1.35).set_trans(Tween.TRANS_CUBIC).set_ease(
		Tween.EASE_IN
	)
	tween.tween_callback(shadow.queue_free)
	_play_cue("creak", Vector3(3.2, 1.0, 6.0), -15.0)
