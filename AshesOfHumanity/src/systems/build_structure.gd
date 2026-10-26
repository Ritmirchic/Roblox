extends StaticBody3D
class_name BuildStructure
## A player-built structure: collision, visuals and real function
## (stations, storage, sleep, defense, quest tower).

var type_id := ""
var uid := ""
var prompt := "Use"
var ghost := false
var _fire_light: OmniLight3D

func make(t: String, is_ghost := false) -> void:
	type_id = t
	ghost = is_ghost
	uid = "build_" + str(Time.get_ticks_msec()) + "_" + str(randi() % 100000)
	prompt = BaseBuilder.CATALOG[type_id].prompt
	add_to_group("interactable")
	collision_layer = 1 << 0
	collision_mask = 0
	_build_visual()
	if is_ghost:
		_set_ghost(true)
		collision_layer = 0

func _set_ghost(v: bool) -> void:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.5, 0.85, 0.5, 0.35) if v \
		else MaterialLibrary.named("metal_rust")
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA if v \
		else BaseMaterial3D.TRANSPARENCY_DISABLED
	for mi in find_children("*", "MeshInstance3D", true, false):
		mi.material_override = mat

func _build_visual() -> void:
	var spec: Dictionary = BaseBuilder.CATALOG[type_id]
	var size: Vector3 = spec.size
	var block := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	block.mesh = box
	block.position = Vector3(0, size.y * 0.5, 0)
	block.material_override = MaterialLibrary.named(spec.material)
	add_child(block)
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	col.shape = shape
	col.position = block.position
	add_child(col)
	match type_id:
		"campfire":
			_fire_light = OmniLight3D.new()
			_fire_light.light_color = Color(1.0, 0.55, 0.2)
			_fire_light.light_energy = 2.2
			_fire_light.omni_range = 9.0
			_fire_light.position = Vector3(0, 0.6, 0)
			add_child(_fire_light)
		"storage_chest":
			var lid := MeshInstance3D.new()
			var lm := BoxMesh.new()
			lm.size = Vector3(size.x * 1.02, 0.1, size.z * 1.02)
			lid.mesh = lm
			lid.position = Vector3(0, size.y + 0.05, 0)
			lid.material_override = MaterialLibrary.named("wood_dark")
			add_child(lid)
		"turret":
			var barrel := MeshInstance3D.new()
			var bm := CylinderMesh.new()
			bm.top_radius = 0.06
			bm.bottom_radius = 0.08
			bm.height = 1.1
			barrel.mesh = bm
			barrel.rotation.z = deg_to_rad(90)
			barrel.position = Vector3(0, size.y + 0.25, -0.4)
			barrel.material_override = MaterialLibrary.named("metal_dark")
			add_child(barrel)
			var area := Area3D.new()
			var acol := CollisionShape3D.new()
			var ashape := CylinderShape3D.new()
			ashape.radius = 18.0
			ashape.height = 6.0
			acol.shape = ashape
			acol.position.y = 1.5
			area.add_child(acol)
			area.collision_mask = 1 << 2
			add_child(area)
			area.body_entered.connect(func(b):
				if b is Enemy and b.alive:
					_fire_turret(b))
		"radio_tower":
			var mast := MeshInstance3D.new()
			var mm := CylinderMesh.new()
			mm.top_radius = 0.08
			mm.bottom_radius = 0.18
			mm.height = 8.0
			mast.mesh = mm
			mast.position = Vector3(0, 4.0, 0)
			mast.material_override = MaterialLibrary.named("metal_dark")
			add_child(mast)
			var blink := OmniLight3D.new()
			blink.light_color = Color(1, 0.2, 0.15)
			blink.omni_range = 6.0
			blink.position = Vector3(0, 8.2, 0)
			add_child(blink)

func can_interact(_player) -> bool:
	return not ghost

func prompt_text() -> String:
	return prompt

func interact(p: Node) -> void:
	match type_id:
		"campfire":
			UIRouter.open("CraftingUI", {"station": "campfire"})
		"workbench":
			UIRouter.open("CraftingUI", {"station": "workbench"})
		"storage_chest":
			UIRouter.open("InventoryUI", {"container": uid})
		"bed":
			_sleep(p)
		"rain_collector":
			_collect_water(p)
		"radio_tower":
			if not GameState.get_story_flag("radio_tower_built"):
				GameState.set_story_flag("radio_tower_built")
				QuestMan.notify_event("build", "radio_tower")
				QuestMan.toast.emit("Radio tower online — Mara can triangulate now")
		_:
			QuestMan.toast.emit(prompt)

func _sleep(p: Node) -> void:
	WorldClock.advance_hours(6.0)
	p.vitals.fatigue = max(0.0, float(p.vitals.fatigue) - 60.0)
	p.heal(15.0)
	AudioMan.play_2d("craft", -8.0)
	QuestMan.toast.emit("You rest until %s" % WorldClock.clock_text())

func _collect_water(p: Node) -> void:
	var give := 2
	var left: int = p.inventory_add("dirty_water", give)
	if left < give:
		QuestMan.toast.emit("Collected %d dirty water" % (give - left))
	else:
		QuestMan.toast.emit("Inventory full")

var _turret_cd := 0.0

func _fire_turret(target: Node) -> void:
	if _turret_cd > Time.get_ticks_msec() / 1000.0:
		return
	_turret_cd = Time.get_ticks_msec() / 1000.0 + 1.4
	if target and is_instance_valid(target) and target.alive:
		target.take_hit(14.0, target.global_position + Vector3.UP, true)
		AudioMan.play_3d("gun_rifle", global_position, -6.0)

func _process(_delta: float) -> void:
	if type_id == "turret" and not ghost:
		# Sustained area defense: acquire nearest enemy in range.
		for e in get_tree().get_nodes_in_group("enemy"):
			if e is Enemy and e.alive \
					and global_position.distance_to(e.global_position) <= 18.0:
				_fire_turret(e)
				break
