class_name Projectile3D
extends Node3D

signal impacted(hit_pos: Vector3, collider: Object)

var from_player: bool = true
var weapon_type: String = "kinetic"
var damage: float = 20.0
var speed: float = 160.0
var splash_radius: float = 0.0
var turn_rate: float = 0.0
var target_node: Node3D = null
var magnetic_homing: bool = false
var magnetic_range: float = 0.0
var lock_homing: bool = false
var _ricochet_grace: float = 0.0
var ignore_rid: RID = RID()
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
	inherited_velocity: Vector3 = Vector3.ZERO,
	is_magnetic: bool = false,
	mag_range: float = 0.0,
	seeks_lock_target: bool = false
) -> void:
	from_player = is_player
	weapon_type = wtype
	damage = dmg
	speed = spd
	splash_radius = splash
	turn_rate = homing_turn
	target_node = tgt
	magnetic_homing = is_magnetic
	magnetic_range = mag_range
	# Fire-and-forget lock guidance: every LMB round converges on the marked target.
	lock_homing = seeks_lock_target and is_player and tgt != null
	if lock_homing and turn_rate <= 0.0:
		turn_rate = 4.0
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
	_lifetime = 5.5 if (wtype in ["rocket", "missile"] or is_magnetic) else 2.8

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

	# Glowing electromagnetic induction ring & trail on magnetized bullets
	if magnetic_homing and is_player:
		var ring_mi := MeshInstance3D.new()
		var torus := TorusMesh.new()
		torus.inner_radius = 0.20
		torus.outer_radius = 0.31
		torus.rings = 14
		torus.ring_segments = 8
		ring_mi.mesh = torus
		ring_mi.rotation_degrees = Vector3(90, 0, 0)
		var rmat := StandardMaterial3D.new()
		rmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		rmat.albedo_color = Color(0.95, 0.36, 1.0, 0.92)
		rmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		ring_mi.material_override = rmat
		add_child(ring_mi)

func _acquire_magnetic_enemy() -> Node3D:
	if not is_inside_tree():
		return null
	var cur_dir := _velocity.normalized()
	if cur_dir.length_squared() < 0.01:
		cur_dir = (-global_transform.basis.z).normalized()
	var best: Node3D = null
	var best_score := 1e9
	for e in get_tree().get_nodes_in_group("enemies"):
		if e is Node3D and is_instance_valid(e):
			var en_n := e as Node3D
			var d := global_position.distance_to(en_n.global_position)
			if d <= magnetic_range:
				var dir_e := (en_n.global_position - global_position).normalized()
				var align := maxf(-0.45, cur_dir.dot(dir_e))
				var score := d / (1.45 + align)
				if score < best_score:
					best_score = score
					best = en_n
	return best

func _physics_process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	if _ricochet_grace > 0.0:
		_ricochet_grace -= delta
		global_position += _velocity * delta
		return

	# Dynamic enemy acquisition for Magnetic Homing Radar bullets (even if fired without manual lock!)
	if magnetic_homing and not lock_homing and from_player and magnetic_range > 0.0:
		if not is_instance_valid(target_node) or global_position.distance_to(target_node.global_position) > magnetic_range * 1.35:
			target_node = _acquire_magnetic_enemy()

	# Homing missile & Magnetic Bullet guidance
	if turn_rate > 0.0 and is_instance_valid(target_node):
		var tgt_pos := target_node.global_position
		var dist_t := global_position.distance_to(tgt_pos)
		if magnetic_homing and target_node is CharacterBody3D:
			var tof := clampf(dist_t / maxf(40.0, speed), 0.0, 0.65)
			tgt_pos += (target_node as CharacterBody3D).velocity * (tof * 0.65)
		var to_tgt := tgt_pos - global_position
		var rem_d := to_tgt.length()
		var cur_dir := _velocity.normalized()
		if rem_d > 0.05 and cur_dir.length_squared() > 0.5:
			var desired := to_tgt / rem_d
			var eff_turn := turn_rate
			if lock_homing:
				# Proportional navigation onto the marked hull: authority scales with bearing
				# error over remaining time of flight, so rounds converge instead of orbiting
				# and stop correcting once they are lined up.
				var lock_err := cur_dir.angle_to(desired)
				eff_turn = clampf((speed / maxf(6.0, rem_d)) * lock_err * 1.9 + 2.2, 2.2, 15.0)
				if lock_err < 0.05:
					eff_turn = 0.0
			elif magnetic_homing:
				# Speed-matched magnetic curvature + strong inverse-distance terminal attraction near hull
				eff_turn = maxf(turn_rate, (speed / 20.0) * (turn_rate / 7.8))
				eff_turn *= lerpf(2.6, 1.0, clampf(rem_d / 36.0, 0.0, 1.0))
			var ang := cur_dir.angle_to(desired)
			if ang > 0.0001:
				var max_step := eff_turn * delta
				var new_dir: Vector3
				if ang <= max_step:
					new_dir = desired
				else:
					var axis := cur_dir.cross(desired)
					if axis.length_squared() < 0.0001:
						var fallback_up := Vector3.UP if absf(cur_dir.dot(Vector3.UP)) < 0.9 else Vector3.RIGHT
						axis = cur_dir.cross(fallback_up)
					new_dir = cur_dir.rotated(axis.normalized(), max_step).normalized()
				_velocity = new_dir * speed
				global_transform = Projectile3D.make_aim_transform(global_position, new_dir, global_transform.basis.y)

	var prev_pos := global_position
	var next_pos := prev_pos + _velocity * delta

	var space_state := get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(prev_pos, next_pos)
	if ignore_rid.is_valid():
		query.exclude = [ignore_rid]
	var hit := space_state.intersect_ray(query)
	if not hit.is_empty():
		var col: Object = hit["collider"]
		if from_player and lock_homing and col is Asteroid3D:
			# A locked round is not a mining tool: rock throws sparks and the round skips off,
			# still hunting its target. Only the RMB beam can break meteoroids.
			VFXFactory.spawn_explosion(get_parent(), hit["position"], Color(0.62, 0.94, 1.0), 0.28)
			AudioManager.play_sfx("shield_hit", 0.04, 1.38)
			_ricochet_grace = 0.16
			global_position = hit["position"] + _velocity.normalized() * 1.1
			return
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
	impacted.emit(hit_pos, collider)
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
				# hull guns cannot mine: meteoroids are RMB / mining-beam only
				AudioManager.play_sfx("shield_hit", 0.03, 1.32)
		else:
			if collider and collider.has_method("receive_enemy_hit"):
				var shape_idx: int = 0
				collider.receive_enemy_hit(damage, hit_pos, shape_idx)
		VFXFactory.spawn_explosion(parent_scene, hit_pos, Color(0.35, 0.9, 1.0) if from_player else Color(1.0, 0.3, 0.25), 0.45)

	queue_free()
