extends Node3D
class_name WeaponHandler
## Hitscan firearms and melee: ADS, recoil, spread, falloff, durability,
## reload, ammo drawn from the grid inventory, tracer and impact FX.

signal ammo_changed(mag: int, reserve: int)
signal weapon_changed(item_id: String)

var player: CharacterBody3D
var rig: Node3D
var view_model: Node3D
var current_id := ""
var mag := 0
var cooldown := 0.0
var reloading := false
var recoil_kick := 0.0
var muzzle_flash: OmniLight3D
var _model_cache: Dictionary = {}

const MELEE_RANGE := 2.4

func setup(p: CharacterBody3D, model_root: Node3D) -> void:
	player = p
	rig = model_root
	muzzle_flash = OmniLight3D.new()
	muzzle_flash.light_energy = 0.0
	muzzle_flash.omni_range = 8.0
	muzzle_flash.light_color = Color(1.0, 0.75, 0.45)
	add_child(muzzle_flash)

func _process(delta: float) -> void:
	cooldown = max(0.0, cooldown - delta)
	recoil_kick = lerpf(recoil_kick, 0.0, delta * 8.0)
	if view_model:
		view_model.rotation.x = recoil_kick * 0.6
		view_model.position.y = sin(Time.get_ticks_msec() * 0.004) * 0.005

func equip(item_id: String) -> void:
	if current_id == item_id:
		return
	current_id = item_id
	mag = 0
	reloading = false
	if view_model and is_instance_valid(view_model):
		view_model.queue_free()
	var def := ItemDB.get_def(item_id)
	if def.is_empty():
		weapon_changed.emit("")
		return
	if def.weapon_class in ["pistol", "shotgun", "rifle", "crossbow"]:
		var model_name := "wpn_" + _model_suffix(item_id)
		var packed: PackedScene = load("res://assets/models/%s.glb" % model_name)
		view_model = packed.instantiate()
		view_model.scale = Vector3.ONE * 0.65
		add_child(view_model)
		# Third-person hold position.
		position = Vector3(0.4, 1.15, -0.45)
		rotation = Vector3(deg_to_rad(-8), deg_to_rad(175), 0)
		_start_reload(true)
	else:
		var model_name := "wpn_" + _model_suffix(item_id)
		if ResourceLoader.exists("res://assets/models/%s.glb" % model_name):
			var packed2: PackedScene = load("res://assets/models/%s.glb" % model_name)
			view_model = packed2.instantiate()
			view_model.scale = Vector3.ONE * 0.8
			add_child(view_model)
		position = Vector3(0.42, 1.0, -0.35)
		rotation = Vector3(deg_to_rad(-35), deg_to_rad(160), 0)
	weapon_changed.emit(item_id)

func _model_suffix(item_id: String) -> String:
	return item_id.trim_prefix("w_")

func _ready() -> void:
	pass

func try_fire(camera: Camera3D) -> void:
	if cooldown > 0.0 or reloading or current_id == "":
		return
	var def := ItemDB.get_def(current_id)
	if def.weapon_class == "melee":
		_melee()
		return
	if mag <= 0:
		AudioMan.play_2d("ui_click", -8.0)
		_start_reload()
		return
	cooldown = float(def.fire_rate)
	mag -= 1
	ammo_changed.emit(mag, _reserve())
	GameState.noise_emitted.emit(player.global_position,
		18.0 if def.weapon_class != "crossbow" else 5.0)
	AudioMan.play_2d("gun_" + ("rifle" if def.weapon_class == "rifle" else (
		"shotgun" if def.weapon_class == "shotgun" else "pistol")),
		-3.0, randf_range(0.95, 1.05))
	muzzle_flash.light_energy = 5.0
	var tw := create_tween()
	tw.tween_property(muzzle_flash, "light_energy", 0.0, 0.08)
	recoil_kick += float(def.recoil)
	if player.has_method("add_camera_recoil"):
		player.add_camera_recoil(float(def.recoil))
	var pellets: int = int(def.get("pellets", 1))
	for i in pellets:
		_fire_ray(camera, def)
	_wear(0.8)

func _fire_ray(camera: Camera3D, def: Dictionary) -> void:
	var spread := float(def.spread) * (1.4 if player.is_sprinting() else 1.0)
	var dir := camera.global_transform.basis.z * -1.0
	dir += camera.global_transform.basis.x * randf_range(-spread, spread)
	dir += camera.global_transform.basis.y * randf_range(-spread, spread)
	dir = dir.normalized()
	var from := camera.global_position
	var to := from + dir * float(def.range)
	var space := get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(from, to,
		1 << 0 | 1 << 2 | 1 << 4)
	q.exclude = [player.get_rid()]
	var hit := space.intersect_ray(q)
	var end := to
	if not hit.is_empty():
		end = hit.position
		_apply_damage(hit, def, from)
	_spawn_tracer(from + dir * 0.8, end)
	_spawn_impact(end, hit)

func _apply_damage(hit: Dictionary, def: Dictionary, from: Vector3) -> void:
	var body: Node = hit.collider
	var distance: float = from.distance_to(hit.position)
	var falloff := clampf(1.0 - distance / float(def.range) * 0.45, 0.4, 1.0)
	var damage := float(def.damage) * falloff
	# Attribute scaling.
	damage *= 1.0 + 0.04 * (int(GameState.attributes.strength) - 5)
	if body is Enemy:
		body.take_hit(damage, hit.position, hit.normal.y > 0.6)
		AudioMan.play_3d("impact_flesh", hit.position, -6.0)
	elif body is StaticBody3D:
		AudioMan.play_3d("impact_metal", hit.position, -10.0, randf_range(0.9, 1.1))

func _melee() -> void:
	cooldown = float(ItemDB.get_def(current_id).swing_time)
	AudioMan.play_2d("melee_whoosh", -4.0)
	GameState.noise_emitted.emit(player.global_position, 7.0)
	var def := ItemDB.get_def(current_id)
	var damage := float(def.damage) * (1.0 + 0.05 * (
		int(GameState.attributes.strength) - 5))
	var forward := -player.global_transform.basis.z
	for e in get_tree().get_nodes_in_group("enemy"):
		if not e.alive:
			continue
		var to_e: Vector3 = e.global_position - player.global_position
		if to_e.length() <= float(def.reach) \
				and forward.dot(to_e.normalized()) > 0.35:
			e.take_hit(damage, e.global_position + Vector3(0, 1.2, 0))
			AudioMan.play_3d("impact_flesh", e.global_position, -4.0)
	_wear(1.5)

func _wear(amount: float) -> void:
	if player and player.has_method("wear_equipment"):
		player.wear_equipment(current_id, amount)

func _reserve() -> int:
	var def := ItemDB.get_def(current_id)
	if not def.has("ammo_type"):
		return 0
	return player.inventory_count(def.ammo_type)

func _start_reload(silent := false) -> void:
	var def := ItemDB.get_def(current_id)
	if not def.has("ammo_type") or reloading:
		return
	if mag >= int(def.mag_size) or _reserve() <= 0:
		return
	reloading = true
	if not silent:
		AudioMan.play_2d("reload", -4.0)
	var timer := get_tree().create_timer(float(def.reload_time))
	await timer.timeout
	_perform_reload()

func _perform_reload() -> void:
	var def := ItemDB.get_def(current_id)
	if not def.has("ammo_type"):
		reloading = false
		return
	var need: int = int(def.mag_size) - mag
	var take: int = mini(need, _reserve())
	if take <= 0:
		reloading = false
		return
	player.inventory_remove(def.ammo_type, take)
	mag += take
	reloading = false
	ammo_changed.emit(mag, _reserve())

func reload() -> void:
	_start_reload()

func _spawn_tracer(a: Vector3, b: Vector3) -> void:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(1.0, 0.85, 0.5, 0.55)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.7, 0.3)
	mat.emission_energy_multiplier = 2.0
	var imediate := MeshInstance3D.new()
	var tube := ImmediateMesh.new()
	imediate.mesh = tube
	tube.surface_begin(Mesh.PRIMITIVE_LINES, mat)
	tube.surface_add_vertex(a)
	tube.surface_add_vertex(b)
	tube.surface_end()
	get_tree().current_scene.add_child(imediate)
	var tw := create_tween()
	tw.tween_property(imediate, "transparency", 1.0, 0.08)
	tw.tween_callback(imediate.queue_free)

func _spawn_impact(pos: Vector3, hit: Dictionary) -> void:
	if hit.is_empty():
		return
	var spark := OmniLight3D.new()
	spark.light_color = Color(1.0, 0.7, 0.4)
	spark.light_energy = 2.5
	spark.omni_range = 4.0
	spark.global_position = pos
	get_tree().current_scene.add_child(spark)
	var tw := create_tween()
	tw.tween_property(spark, "light_energy", 0.0, 0.15)
	tw.tween_callback(spark.queue_free)
