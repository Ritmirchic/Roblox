class_name HorrorDoor
extends Node3D

@export var door_id: String = "door"
@export var is_locked: bool = false
@export var is_sliding: bool = false
@export var hinge_left: bool = true
var is_open: bool = false
var _moving := false
var _panel: Node3D
var _closed_z := 0.0
var _locked_anomaly := false
var _door_collider: AnimatableBody3D
var _door_tween: Tween


func _ready() -> void:
	build_door()


func build_door() -> void:
	var wood := StandardMaterial3D.new()
	wood.albedo_color = Color(0.20, 0.13, 0.09)
	wood.roughness = 0.58
	var trim := StandardMaterial3D.new()
	trim.albedo_color = Color(0.34, 0.24, 0.14)
	trim.roughness = 0.72
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color(0.37, 0.34, 0.28)
	metal.metallic = 0.62
	metal.roughness = 0.34
	for side in [-1.0, 1.0]:
		_add_box(
			"frame_jamb", Vector3(0, 1.15, side * 0.72), Vector3(0.22, 2.36, 0.16), trim, false
		)
	_add_box("frame_header", Vector3(0, 2.31, 0), Vector3(0.22, 0.18, 1.58), trim, false)
	_panel = Node3D.new()
	_panel.name = "SwingingPanel"
	_panel.position.z = -0.64 if hinge_left else 0.64
	_closed_z = _panel.position.z
	var leaf_center := 0.64 if hinge_left else -0.64
	add_child(_panel)
	var panel_mesh := BoxMesh.new()
	panel_mesh.size = Vector3(0.13, 2.14, 1.28)
	var panel_visual := MeshInstance3D.new()
	panel_visual.name = "PaintedDoorSlab"
	panel_visual.mesh = panel_mesh
	panel_visual.material_override = wood
	panel_visual.position = Vector3(0, 1.09, leaf_center)
	_panel.add_child(panel_visual)
	# Three recessed panels and a lower kick plate give each leaf a proper manufactured profile.
	for tier in range(3):
		var inset := BoxMesh.new()
		inset.size = Vector3(0.025, 0.45 if tier == 1 else 0.30, 0.88 if tier != 1 else 0.98)
		var panel := MeshInstance3D.new()
		panel.name = "RecessedPanel"
		panel.mesh = inset
		panel.material_override = trim
		panel.position = Vector3(0.078, 0.55 + float(tier) * 0.52, leaf_center)
		_panel.add_child(panel)
	var knob := MeshInstance3D.new()
	var knob_mesh := SphereMesh.new()
	knob_mesh.radius = 0.075
	knob_mesh.height = 0.15
	knob.mesh = knob_mesh
	knob.material_override = metal
	knob.position = Vector3(0.11, 1.02, leaf_center + (-0.22 if hinge_left else 0.22))
	_panel.add_child(knob)
	var collider := AnimatableBody3D.new()
	collider.name = "DoorCollision"
	collider.sync_to_physics = true
	collider.set_meta("door_root", self)
	_door_collider = collider
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.26, 2.13, 0.15)
	shape.shape = box
	shape.position = Vector3(0, 1.08, leaf_center)
	collider.add_child(shape)
	_panel.add_child(collider)
	# Hardware is carried by the swinging panel but does not block the player.
	var hinge := _add_box(
		"hinge",
		Vector3(-0.6 if hinge_left else 0.6, 1.08, 0.07),
		Vector3(0.07, 0.34, 0.06),
		metal,
		false
	)
	_panel.add_child(hinge)


func _add_box(
	key: String, pos: Vector3, size: Vector3, material: Material, with_collision: bool
) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var item := MeshInstance3D.new()
	item.name = key
	item.mesh = mesh
	item.material_override = material
	item.position = pos
	add_child(item)
	if with_collision:
		var body := StaticBody3D.new()
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = size
		shape.shape = box
		body.add_child(shape)
		body.position = pos
		add_child(body)
	return item


func interact() -> String:
	if is_locked:
		return "The lock won't turn. Something is moving on the other side."
	if _moving:
		return "The door is still moving."
		return ""
	is_open = not is_open
	_moving = true
	var tween := create_tween()
	_door_tween = tween
	tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	if is_sliding:
		var slide_target := _closed_z + (-1.8 if hinge_left else 1.8) if is_open else _closed_z
		tween.tween_property(_panel, "position:z", slide_target, 0.62)
	else:
		var direction := -1.24
		tween.tween_property(_panel, "rotation:y", direction if is_open else 0.0, 0.72)
	tween.finished.connect(func(): _moving = false)
	return "The door eases open." if is_open else "The door settles shut."


func set_anomaly_lock(enabled: bool) -> void:
	_locked_anomaly = enabled
	is_locked = enabled


func set_door_enabled(enabled: bool) -> void:
	visible = enabled
	if is_instance_valid(_door_collider):
		_door_collider.collision_layer = 1 if enabled else 0
		_door_collider.collision_mask = 1 if enabled else 0


func force_open() -> void:
	if is_instance_valid(_door_tween) and _door_tween.is_running():
		_door_tween.kill()
	_moving = false
	is_locked = false
	is_open = true
	if is_instance_valid(_panel):
		_panel.position.z = _closed_z + (-1.8 if hinge_left else 1.8) if is_sliding else _closed_z
		if not is_sliding:
			_panel.rotation.y = -1.24


func reset_door() -> void:
	if is_instance_valid(_door_tween) and _door_tween.is_running():
		_door_tween.kill()
	is_locked = false
	is_open = false
	_moving = false
	if is_instance_valid(_panel):
		_panel.position.z = _closed_z
		_panel.rotation.y = 0.0
