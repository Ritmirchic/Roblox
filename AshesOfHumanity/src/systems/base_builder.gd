extends Node3D
class_name BaseBuilder
## Grid-snapped placement of base structures with material costs, rotation,
## collision validation and save-game persistence.

const CATALOG := {
	"foundation": {"name": "Foundation", "cost": {"wood_planks": 4},
		"size": Vector3(3, 0.3, 3), "material": "concrete", "prompt": "Foundation"},
	"wall_wood": {"name": "Wooden Wall", "cost": {"wood_planks": 5},
		"size": Vector3(3, 2.6, 0.25), "material": "wood_dark",
		"prompt": "Wooden wall"},
	"wall_scrap": {"name": "Scrap Wall", "cost": {"scrap_metal": 6},
		"size": Vector3(3, 2.8, 0.3), "material": "metal_rust",
		"prompt": "Scrap wall"},
	"campfire": {"name": "Campfire", "cost": {"wood_planks": 3, "scrap_metal": 2},
		"size": Vector3(0.9, 0.4, 0.9), "material": "metal_rust",
		"prompt": "Cook at campfire"},
	"workbench": {"name": "Workbench", "cost": {"wood_planks": 6, "scrap_metal": 4},
		"size": Vector3(1.8, 0.9, 0.8), "material": "wood_dark",
		"prompt": "Use workbench"},
	"storage_chest": {"name": "Storage Chest", "cost": {"wood_planks": 5, "scrap_metal": 2},
		"size": Vector3(1.2, 0.8, 0.7), "material": "wood_dark",
		"prompt": "Open storage"},
	"bed": {"name": "Bedroll", "cost": {"cloth": 4, "wood_planks": 2},
		"size": Vector3(1.0, 0.35, 2.0), "material": "fabric",
		"prompt": "Sleep"},
	"rain_collector": {"name": "Rain Collector",
		"cost": {"scrap_metal": 4, "cloth": 2},
		"size": Vector3(1.0, 1.4, 1.0), "material": "metal_rust",
		"prompt": "Collect water"},
	"generator": {"name": "Generator",
		"cost": {"scrap_metal": 8, "electronic_parts": 2, "fuel": 2},
		"size": Vector3(1.2, 1.0, 0.9), "material": "metal_dark",
		"prompt": "Generator"},
	"barbed_fence": {"name": "Barbed Fence",
		"cost": {"scrap_metal": 5},
		"size": Vector3(3, 1.8, 0.2), "material": "metal_rust",
		"prompt": "Fence"},
	"turret": {"name": "Auto Turret",
		"cost": {"scrap_metal": 12, "electronic_parts": 4, "gunpowder": 3},
		"size": Vector3(0.8, 1.2, 0.8), "material": "metal_dark",
		"prompt": "Auto turret", "requires_skill": "t6"},
	"radio_tower": {"name": "Radio Tower",
		"cost": {"scrap_metal": 14, "electronic_parts": 6, "wood_planks": 6},
		"size": Vector3(1.2, 9.0, 1.2), "material": "metal_dark",
		"prompt": "Transmit"},
}

var active := false
var ghost: BuildStructure = null
var current_type := ""
var player: Node
var world: Node3D
var rotate_t := 0.0

func setup(p: Node, w: Node3D) -> void:
	player = p
	world = w

func begin(type_id: String) -> void:
	cancel()
	if not CATALOG.has(type_id):
		return
	if CATALOG[type_id].has("requires_skill") \
			and not GameState.has_skill(CATALOG[type_id].requires_skill):
		QuestMan.toast.emit("Requires the Engineer perk")
		return
	current_type = type_id
	ghost = BuildStructure.new()
	world.add_child(ghost)
	ghost.make(type_id, true)
	active = true

func cancel() -> void:
	active = false
	if ghost and is_instance_valid(ghost):
		ghost.queue_free()
	ghost = null
	current_type = ""

func _process(delta: float) -> void:
	if not active or not is_instance_valid(ghost):
		return
	rotate_t += delta
	var cam: Camera3D = player.cam_rig.camera
	var space := get_world_3d().direct_space_state
	var from: Vector3 = cam.global_position
	var to: Vector3 = from + cam.global_transform.basis.z * -6.0
	var q := PhysicsRayQueryParameters3D.create(from, to, 1 << 0)
	var hit := space.intersect_ray(q)
	if hit.is_empty():
		ghost.visible = false
		return
	ghost.visible = true
	var snap := 0.5
	var pos: Vector3 = hit.position
	pos.x = round(pos.x / snap) * snap
	pos.z = round(pos.z / snap) * snap
	ghost.global_position = pos
	if Input.is_action_pressed("rotate_build"):
		ghost.rotation.y = round(rotate_t * 2.0) * (PI * 0.5)
	var valid := _valid_placement()
	var mat_color := Color(0.4, 0.9, 0.4, 0.35) if valid \
		else Color(0.9, 0.3, 0.25, 0.35)
	for mi in ghost.find_children("*", "MeshInstance3D", true, false):
		var mat := StandardMaterial3D.new()
		mat.albedo_color = mat_color
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mi.material_override = mat

func _valid_placement() -> bool:
	var cost: Dictionary = CATALOG[current_type].cost
	if SkillSystem.has("t5"):
		var discounted: Dictionary = {}
		for id in cost:
			discounted[id] = maxi(1, int(cost[id]) - 1)
		cost = discounted
	if not player.inventory.has_items(cost):
		return false
	# Avoid overlapping existing solid bodies.
	var space := get_world_3d().direct_space_state
	var shape := BoxShape3D.new()
	shape.size = CATALOG[current_type].size
	var params := PhysicsShapeQueryParameters3D.new()
	params.shape = shape
	params.transform = ghost.global_transform
	params.transform.origin += Vector3(0, shape.size.y * 0.5, 0)
	params.collision_mask = 1 << 0 | 1 << 2
	var hits := space.intersect_shape(params)
	return hits.is_empty()

func confirm() -> bool:
	if not active or not _valid_placement():
		QuestMan.toast.emit("Cannot build here")
		return false
	var spec: Dictionary = CATALOG[current_type]
	var cost: Dictionary = spec.cost.duplicate()
	if GameState.has_skill("t5"):
		for id in cost:
			cost[id] = maxi(1, int(cost[id]) - 1)
	player.inventory.consume(cost)
	var structure := BuildStructure.new()
	world.add_child(structure)
	structure.make(current_type)
	structure.global_transform = ghost.global_transform
	GameState.world_buildings.append({
		"type": current_type,
		"pos": [structure.global_position.x,
			structure.global_position.y, structure.global_position.z],
		"rot_y": structure.rotation.y,
		"uid": structure.uid,
	})
	GameState.gain_xp(15)
	QuestMan.notify_event("build", current_type)
	AudioMan.play_2d("craft", -4.0)
	cancel()
	return true

func unhandled_input(event: InputEvent) -> void:
	if not active:
		return
	if event.is_action_pressed("interact"):
		confirm()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("pause") or event.is_action_pressed("build_menu"):
		cancel()

func restore_all(world_root: Node3D) -> void:
	for entry in GameState.world_buildings:
		var structure := BuildStructure.new()
		world_root.add_child(structure)
		structure.make(entry.type)
		structure.global_position = Vector3(entry.pos[0], entry.pos[1], entry.pos[2])
		structure.rotation.y = float(entry.rot_y)
		structure.uid = entry.uid
