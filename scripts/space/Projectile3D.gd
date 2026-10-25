class_name Projectile3D
extends Node3D

var from_player: bool = true
var weapon_type: String = "kinetic"
var damage: float = 20.0
var speed: float = 160.0
var splash_radius: float = 0.0
var turn_rate: float = 0.0
var target_node: Node3D = null
var _lifetime: float = 4.0
var _velocity: Vector3 = Vector3.FORWARD
var _start_xform: Transform3D = Transform3D.IDENTITY
var _has_start_xform: bool = false

static func make_aim_transform(origin: Vector3, dir: Vector3, preferred_up: Vector3 = Vector3.UP) -> Transform3D:
	var fwd := dir.normalized()
	if fwd.length_squared() < 0.001:
		fwd = Vector3.FORWARD
	var up_ref := preferred_up.normalized()
	if up_ref.length_squared() < 0.001 or absf(fwd.dot(up_ref)) > 0.96:
		up_ref = Vector3.UP if absf(fwd.dot(Vector3.UP)) <= 0.96 else Vector3.RIGHT
	return Transform3D(Basis.looking_at(fwd, up_ref), origin)

func setup(
	is_player: bool,
	wtype: String,
	dmg: float,
	spd: float,
	start_xform: Transform3D,
	splash: float = 0.0,
	homing_turn: float = 0.0,
	tgt: Node3D = null,
	inherited_velocity: Vector3 = Vector3.ZERO
) -> void:
	from_player = is_player
	weapon_type = wtype
	damage = dmg
	speed = spd
	splash_radius = splash
	turn_rate = homing_turn
	target_node = tgt
	_start_xform = start_xform
	_has_start_xform = true

	# Compute direction directly from start_xform (safe even before entering SceneTree!)
	var fwd_dir := (-start_xform.basis.z).normalized()
	if fwd_dir.length_squared() < 0.001:
		fwd_dir = Vector3.FORWARD

	transform = start_xform
	if is_inside_tree():
		global_transform = start_xform

	_velocity = fwd_dir * speed + inherited_velocity
	_lifetime = 5.5 if wtype in ["rocket", "missile"] else 2.8

	_build_visual(wtype, is_player)

func _ready() -> void:
	if _has_start_xform:
		global_transform = _start_xform

func _build_visual(wtype: String, is_player: bool) -> void:
	if wtype in ["rocket", "missile"]:
		var mpath := "res://assets/models/projectiles/proj_missile.glb" if wtype == "missile" else "res://assets/models/projectiles/proj_rocket.glb"
		if ResourceLoader.exists(mpath):
			var ps: PackedScene = load(mpath)
			if ps:
				var inst := ps.instantiate()
				inst.scale = Vector3.ONE * 1.35
				add_child(inst)
		var trail := VFXFactory.create_continuous_sparks(Color(1.0, 0.58, 0.16) if wtype == "rocket" else Color(0.35, 0.88, 1.0))
		trail.emitting = true
		trail.position = Vector3(0, 0, 0.6)
		add_child(trail)
	else:
		var mi := MeshInstance3D.new()
		var cap := CapsuleMesh.new()
		cap.radius = 0.11 if wtype != "plasma" else 0.24
		cap.height = 1.35 if wtype != "plasma" else 0.75
		mi.mesh = cap
		mi.rotation_degrees = Vector3(90, 0, 0)
		var mat := StandardMaterial3D.new()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		if not is_player:
			mat.albedo_color = Color(1.0, 0.28, 0.24)
		elif wtype == "laser":
			mat.albedo_color = Color(0.25, 0.95, 1.0)
		elif wtype == "plasma":
			mat.albedo_color = Color(0.78, 0.35, 1.0)
		elif wtype == "railgun":
			mat.albedo_color = Color(1.0, 0.90, 0.42)
		else:
			mat.albedo_color = Color(1.0, 0.78, 0.28)
		mi.material_override = mat
		add_child(mi)

func _physics_process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	# Homing missile guidance
	if turn_rate > 0.0 and is_instance_valid(target_node):
		var desired := (target_node.global_position - global_position).normalized()
		var cur_dir := _velocity.normalized()
		if desired.length_squared() > 0.5 and cur_dir.length_squared() > 0.5:
			var new_dir := cur_dir.slerp(desired, clampf(turn_rate * delta, 0.0, 1.0)).normalized()
			_velocity = new_dir * speed
			global_transform = Projectile3D.make_aim_transform(global_position, new_dir, global_transform.basis.y)

	var prev_pos := global_position
	var next_pos := prev_pos + _velocity * delta

	var space_state := get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(prev_pos, next_pos)
	var hit := space_state.intersect_ray(query)
	if not hit.is_empty():
		var col: Object = hit["collider"]
		if from_player and col is RigidBody3D and col.is_in_group("player_ship"):
			global_position = next_pos
			return
		if not from_player and col is Node and col.is_in_group("enemies"):
			global_position = next_pos
			return
		_on_impact(hit["position"], col)
		return

	global_position = next_pos

func _on_impact(hit_pos: Vector3, collider: Object) -> void:
	var parent_scene := get_parent()
	if splash_radius > 0.1 and from_player and parent_scene:
		VFXFactory.spawn_explosion(parent_scene, hit_pos, Color(1.0, 0.55, 0.18), 1.35)
		AudioManager.play_sfx("explosion", 0.08, 0.7)
		for e in get_tree().get_nodes_in_group("enemies"):
			if e is Node3D:
				var e_n := e as Node3D
				var dist_e: float = e_n.global_position.distance_to(hit_pos)
				if dist_e <= splash_radius:
					var falloff: float = 1.0 - 0.5 * (dist_e / splash_radius)
					if e_n.has_method("take_weapon_damage"):
						e_n.take_weapon_damage(damage * falloff)
	else:
		if from_player:
			if collider and collider.has_method("take_weapon_damage"):
				collider.take_weapon_damage(damage)
			elif collider is Asteroid3D:
				collider.apply_mining_damage(damage * 0.45, 2, 1.0, 0.0, parent_scene.get_node_or_null("ChunksRoot") if parent_scene else null)
		else:
			if collider and collider.has_method("receive_enemy_hit"):
				var shape_idx: int = 0
				collider.receive_enemy_hit(damage, hit_pos, shape_idx)
		VFXFactory.spawn_explosion(parent_scene, hit_pos, Color(0.35, 0.9, 1.0) if from_player else Color(1.0, 0.3, 0.25), 0.45)

	queue_free()
