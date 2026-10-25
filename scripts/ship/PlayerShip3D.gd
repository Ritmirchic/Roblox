class_name PlayerShip3D
extends RigidBody3D

signal cockpit_destroyed
signal ship_telemetry_updated(telemetry: Dictionary)

var stats: Dictionary = {}
var current_energy: float = 120.0
var current_shield: float = 0.0
var engine_heat: float = 0.0
var stabilizer_enabled: bool = true
var controls_enabled: bool = true

# External scene containers wired by SpaceExpedition3D
var projectiles_root: Node = null
var chunks_root: Node = null
var beams_root: Node = null

var _visuals_by_uid: Dictionary = {}     # uid -> Node3D
var _turrets_by_uid: Dictionary = {}     # uid -> Node3D
var _muzzles_by_uid: Dictionary = {}     # uid -> Marker3D
var _plumes_by_uid: Dictionary = {}      # uid -> MeshInstance3D
var _sparks_by_uid: Dictionary = {}      # uid -> CPUParticles3D
var _beams_by_uid: Dictionary = {}       # uid -> MeshInstance3D
var _weapon_cooldowns: Dictionary = {}   # uid -> float
var _shape_idx_to_uid: Dictionary = {}   # shape_index -> uid

var _shield_mesh: MeshInstance3D
var _drones_root: Node3D
var _orbit_drones: Array[Node3D] = []
var _drone_angle: float = 0.0
var _drone_fire_cd: float = 0.0
var _shield_hit_flash: float = 0.0
var _shield_regen_delay: float = 0.0
var _prev_pos: Vector3 = Vector3.ZERO
var _prev_phys_xform: Transform3D = Transform3D.IDENTITY
var _curr_phys_xform: Transform3D = Transform3D.IDENTITY
var _phys_interp_ready: bool = false
var _distance_accum: float = 0.0
var _mining_sec_accum: float = 0.0

# Aimed point in world space updated by SpaceExpedition3D camera ray
var aimed_world_point: Vector3 = Vector3(0, 0, -120)
var locked_enemy: Node3D = null
var firing_weapons: bool = false
var firing_mining: bool = false
var thrust_input: Vector3 = Vector3.ZERO # x=strafe, y=vertical, z=forward(+1)/reverse(-1)
var rot_input: Vector3 = Vector3.ZERO    # x=pitch, y=yaw, z=roll
var boost_active: bool = false

func _ready() -> void:
	add_to_group("player_ship")
	gravity_scale = 0.0
	can_sleep = false
	continuous_cd = true
	contact_monitor = true
	max_contacts_reported = 4
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM

	ShipGrid.cargo_changed.connect(_refresh_mass_and_com)
	rebuild_from_grid()
	reset_interpolation()
	_prev_pos = global_position

func reset_interpolation() -> void:
	_prev_phys_xform = global_transform
	_curr_phys_xform = global_transform
	_phys_interp_ready = true

func get_smoothed_transform() -> Transform3D:
	if not _phys_interp_ready:
		return global_transform
	var f := clampf(Engine.get_physics_interpolation_fraction(), 0.0, 1.0)
	var q0 := _prev_phys_xform.basis.orthonormalized().get_rotation_quaternion()
	var q1 := _curr_phys_xform.basis.orthonormalized().get_rotation_quaternion()
	var interp_basis := Basis(q0.slerp(q1, f)).orthonormalized()
	var interp_origin := _prev_phys_xform.origin.lerp(_curr_phys_xform.origin, f)
	return Transform3D(interp_basis, interp_origin)

func rebuild_from_grid() -> void:
	for ch in get_children():
		ch.queue_free()
	_visuals_by_uid.clear()
	_turrets_by_uid.clear()
	_muzzles_by_uid.clear()
	_plumes_by_uid.clear()
	_sparks_by_uid.clear()
	_weapon_cooldowns.clear()
	_shape_idx_to_uid.clear()
	_orbit_drones.clear()

	for b in _beams_by_uid.values():
		if is_instance_valid(b):
			b.queue_free()
	_beams_by_uid.clear()

	ShipGrid.repair_all_modules()
	stats = ShipGrid.compute_ship_stats()
	mass = maxf(1.0, float(stats["total_mass"]))
	center_of_mass = stats["center_of_mass"]
	current_energy = float(stats["energy_cap"])
	current_shield = float(stats["shield_cap"])
	engine_heat = 0.0

	var shape_counter := 0
	var max_extent := 3.2

	for uid in ShipGrid.placed_modules.keys():
		var entry: Dictionary = ShipGrid.placed_modules[uid]
		var mod_id: String = entry["mod_id"]
		if not GameData.modules.has(mod_id):
			continue
		var def: Dictionary = GameData.modules[mod_id]
		var cells: Array = entry["cells"]
		var yaw: int = int(entry["yaw"])

		# Compute center & bounding box of occupied cells in local space
		var min_v := Vector3(999, 999, 999)
		var max_v := Vector3(-999, -999, -999)
		for c in cells:
			var p := Vector3(c.x, c.y, c.z) * ShipGrid.CELL_SIZE
			min_v = min_v.min(p - Vector3.ONE * (ShipGrid.CELL_SIZE * 0.48))
			max_v = max_v.max(p + Vector3.ONE * (ShipGrid.CELL_SIZE * 0.48))
		var center_local := (min_v + max_v) * 0.5
		var box_size := max_v - min_v
		max_extent = maxf(max_extent, center_local.length() + 1.8)

		# CollisionShape3D per installed module
		var cshape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = box_size
		cshape.shape = box
		cshape.position = center_local
		add_child(cshape)
		_shape_idx_to_uid[shape_counter] = uid
		shape_counter += 1

		# Visual root for module
		var mod_root := Node3D.new()
		mod_root.position = Vector3(entry["anchor"].x, entry["anchor"].y, entry["anchor"].z) * ShipGrid.CELL_SIZE
		mod_root.rotation_degrees = Vector3(0.0, float(yaw) * 90.0, 0.0)
		add_child(mod_root)
		_visuals_by_uid[uid] = mod_root

		var pivot := Node3D.new()
		mod_root.add_child(pivot)
		if bool(def.get("is_turret", false)):
			_turrets_by_uid[uid] = pivot

		var mpath: String = def["model_path"]
		if ResourceLoader.exists(mpath):
			var ps: PackedScene = load(mpath)
			if ps:
				pivot.add_child(ps.instantiate())

		# Muzzle marker at front (-Z) of module/turret
		var muzzle := Marker3D.new()
		var z_len := float(def["grid_size"].z)
		muzzle.position = Vector3(0.0, 0.05, -1.15 * z_len)
		pivot.add_child(muzzle)
		_muzzles_by_uid[uid] = muzzle

		# Engine plume VFX
		if def.has("thrust_force"):
			var plume := VFXFactory.create_thruster_plume(0.45 if mod_id == "engine_basic" else 0.55, 2.5 if mod_id == "engine_basic" else 3.3)
			mod_root.add_child(plume)
			_plumes_by_uid[uid] = plume

		# Damage sparks emitter
		var sp := VFXFactory.create_continuous_sparks()
		mod_root.add_child(sp)
		_sparks_by_uid[uid] = sp

		# Mining laser beam mesh
		if def.has("mining_dps") and beams_root:
			var bcol: Color = def.get("beam_color", Color(0.2, 0.9, 1.0))
			var bm := VFXFactory.create_beam_node(bcol, 0.14 if mod_id == "heavy_mining_beam" else 0.08)
			beams_root.add_child(bm)
			_beams_by_uid[uid] = bm

	# Shield bubble
	_shield_mesh = VFXFactory.create_shield_bubble(max_extent + 0.9)
	_shield_mesh.position = center_of_mass
	_shield_mesh.visible = float(stats["shield_cap"]) > 0.0
	add_child(_shield_mesh)

	# Orbiting defensive drones
	_drones_root = Node3D.new()
	add_child(_drones_root)
	var d_count: int = int(stats["drone_count"])
	var drone_ps: PackedScene = load("res://assets/models/equipment/drone_orbiter.glb") if ResourceLoader.exists("res://assets/models/equipment/drone_orbiter.glb") else null
	for i in range(d_count):
		var dn := Node3D.new()
		if drone_ps:
			dn.add_child(drone_ps.instantiate())
		_drones_root.add_child(dn)
		_orbit_drones.append(dn)

func _refresh_mass_and_com() -> void:
	stats = ShipGrid.compute_ship_stats()
	mass = maxf(1.0, float(stats["total_mass"]))
	center_of_mass = stats["center_of_mass"]
	if _shield_mesh:
		_shield_mesh.position = center_of_mass

func _physics_process(delta: float) -> void:
	_prev_phys_xform = _curr_phys_xform if _phys_interp_ready else global_transform

	# Track distance traveled for achievements
	var step_dist := global_position.distance_to(_prev_pos)
	_prev_pos = global_position
	if step_dist > 0.001 and step_dist < 50.0:
		ShipGrid.stats_history["distance_traveled"] = float(ShipGrid.stats_history.get("distance_traveled", 0.0)) + step_dist
		_distance_accum += step_dist
		if _distance_accum >= 10.0:
			if AchievementManager:
				AchievementManager.record_event("travel_distance", _distance_accum)
			_distance_accum = 0.0

	# Energy & Shield & Repair updates
	var max_e := maxf(20.0, float(stats.get("energy_cap", 120.0)))
	current_energy = minf(max_e, current_energy + float(stats.get("energy_regen", 25.0)) * delta)

	if _shield_regen_delay > 0.0:
		_shield_regen_delay -= delta
	elif current_shield < float(stats.get("shield_cap", 0.0)):
		current_shield = minf(float(stats["shield_cap"]), current_shield + float(stats.get("shield_regen", 0.0)) * delta)

	if _shield_hit_flash > 0.0:
		_shield_hit_flash = maxf(0.0, _shield_hit_flash - delta * 3.2)
	if _shield_mesh and _shield_mesh.material_override is ShaderMaterial:
		var smat: ShaderMaterial = _shield_mesh.material_override
		var max_sh := maxf(1.0, float(stats.get("shield_cap", 0.0)))
		var sh_ratio := clampf(current_shield / max_sh, 0.0, 1.0) if float(stats.get("shield_cap", 0.0)) > 0.0 else 0.0
		_shield_mesh.visible = sh_ratio > 0.01
		smat.set_shader_parameter("shield_ratio", sh_ratio)
		smat.set_shader_parameter("hit_flash", _shield_hit_flash)

	# Nano-repair module active restoration
	var rep_rate := float(stats.get("repair_rate", 0.0))
	if rep_rate > 0.0 and current_energy > 4.0:
		var repaired_any := false
		for uid in ShipGrid.placed_modules.keys():
			var e: Dictionary = ShipGrid.placed_modules[uid]
			if float(e["hp"]) > 0.0 and float(e["hp"]) < float(e["max_hp"]):
				e["hp"] = minf(float(e["max_hp"]), float(e["hp"]) + rep_rate * delta)
				repaired_any = true
				if float(e["hp"]) / maxf(1.0, float(e["max_hp"])) >= 0.5 and _sparks_by_uid.has(uid):
					_sparks_by_uid[uid].emitting = false
		if repaired_any:
			current_energy = maxf(0.0, current_energy - 3.0 * delta)
			stats = ShipGrid.compute_ship_stats()

	_apply_flight_physics(delta)
	_update_turrets(delta)
	_process_mining_beams(delta)
	_process_weapons(delta)
	_process_magnets_and_collection(delta)
	_process_orbiting_drones(delta)

	_curr_phys_xform = global_transform
	_phys_interp_ready = true

	ship_telemetry_updated.emit({
		"speed": linear_velocity.length(),
		"energy": current_energy,
		"max_energy": max_e,
		"shield": current_shield,
		"max_shield": float(stats.get("shield_cap", 0.0)),
		"hp": float(stats.get("current_hp", 100.0)),
		"max_hp": maxf(1.0, float(stats.get("total_hp", 100.0))),
		"heat": engine_heat,
		"stabilizer": stabilizer_enabled,
	})

func _apply_flight_physics(delta: float) -> void:
	var total_thrust := float(stats.get("total_thrust", 180.0))
	var boost_mult := 1.0
	if boost_active and thrust_input.length_squared() > 0.01 and engine_heat < 95.0 and current_energy > 8.0:
		boost_mult = 1.65
		engine_heat = minf(100.0, engine_heat + 22.0 * delta)
		current_energy = maxf(0.0, current_energy - 14.0 * delta)
	else:
		engine_heat = maxf(0.0, engine_heat - 18.0 * delta)

	var overheat_penalty := 0.55 if engine_heat >= 96.0 else 1.0
	var fwd := -global_transform.basis.z
	var right := global_transform.basis.x
	var up := global_transform.basis.y

	var world_thrust_dir := (fwd * thrust_input.z + right * (thrust_input.x * 0.82) + up * (thrust_input.y * 0.82))
	if world_thrust_dir.length_squared() > 0.001 and total_thrust > 0.0:
		var force := world_thrust_dir.limit_length(1.0) * total_thrust * boost_mult * overheat_penalty
		apply_central_force(force)
		# Subtle physical off-center CoM torque effect (mitigated partly when stabilizer is on)
		var com_offset: Vector3 = stats.get("center_of_mass", Vector3.ZERO) - stats.get("thrust_center", Vector3.ZERO)
		var asym_scale := 0.04 if stabilizer_enabled else 0.18
		if com_offset.length_squared() > 0.05:
			apply_torque(global_transform.basis * (com_offset.cross(Vector3(0, 0, -1)) * total_thrust * 0.012 * asym_scale))

	# Smooth 6-DOF Full-360 Rotational Control (Quaternion/Basis local-frame: zero gimbal or horizon lock!)
	var ang_acc := float(stats.get("angular_accel", 3.2))
	var agility := clampf(0.95 + ang_acc * 0.14, 0.95, 2.25)
	var desired_local_ang := Vector3(
		rot_input.x * 3.1 * agility,
		rot_input.y * 3.3 * agility,
		rot_input.z * 4.2 * agility
	)
	var desired_world_ang := global_transform.basis * desired_local_ang
	if rot_input.length_squared() > 0.0008:
		var rot_blend := 1.0 - exp(-15.0 * delta)
		angular_velocity = angular_velocity.lerp(desired_world_ang, rot_blend)
	elif stabilizer_enabled:
		var damp_blend := 1.0 - exp(-7.5 * delta)
		angular_velocity = angular_velocity.lerp(Vector3.ZERO, damp_blend)

	# Smooth linear velocity stabilization when throttle is released
	if stabilizer_enabled and thrust_input.length_squared() < 0.01:
		linear_velocity = linear_velocity.lerp(Vector3.ZERO, 1.0 - exp(-1.9 * delta))

	# Cap max speed cleanly according to acceleration/thrust-to-mass
	var max_spd := clampf(26.0 + float(stats.get("acceleration", 8.0)) * 3.4 * boost_mult, 28.0, 125.0)
	if linear_velocity.length() > max_spd:
		linear_velocity = linear_velocity.normalized() * lerpf(linear_velocity.length(), max_spd, 1.0 - exp(-5.0 * delta))

	# Update thruster plume visuals & audio
	var throttle_vis := clampf(thrust_input.length() * boost_mult, 0.08, 1.4)
	AudioManager.set_thruster_active(controls_enabled and thrust_input.length_squared() > 0.02, throttle_vis)
	for uid in _plumes_by_uid.keys():
		var pl: MeshInstance3D = _plumes_by_uid[uid]
		var eff := 1.0
		if ShipGrid.placed_modules.has(uid):
			eff = ShipGrid.get_module_efficiency(ShipGrid.placed_modules[uid])
		pl.visible = eff > 0.0
		if pl.material_override is ShaderMaterial:
			var sm: ShaderMaterial = pl.material_override
			sm.set_shader_parameter("throttle", throttle_vis * eff)
			sm.set_shader_parameter("heat_ratio", engine_heat / 100.0)

func _get_reticle_assisted_point(from_pos: Vector3) -> Vector3:
	var base_dir := (aimed_world_point - from_pos).normalized()
	if base_dir.length_squared() < 0.1:
		base_dir = (-global_transform.basis.z).normalized()
	if is_instance_valid(locked_enemy):
		var to_lock := (locked_enemy.global_position - from_pos).normalized()
		# Only snap/assist direct-fire guns when the locked enemy is close to the player's crosshair (~12 deg cone)
		if to_lock.length_squared() > 0.1 and base_dir.dot(to_lock) > 0.978:
			return locked_enemy.global_position
	return aimed_world_point if (aimed_world_point - from_pos).length_squared() > 1.0 else (from_pos + base_dir * 160.0)

func _update_turrets(delta: float) -> void:
	var slew_alpha := 1.0 - exp(-18.0 * delta)
	for uid in _turrets_by_uid.keys():
		var tur: Node3D = _turrets_by_uid[uid]
		if not is_instance_valid(tur):
			continue
		var target_pt := _get_reticle_assisted_point(tur.global_position)
		var to_t := target_pt - tur.global_position
		if to_t.length_squared() > 1.0:
			var aim_xform := Projectile3D.make_aim_transform(tur.global_position, to_t.normalized(), global_transform.basis.y)
			var q_cur := tur.global_transform.basis.orthonormalized().get_rotation_quaternion()
			var q_dst := aim_xform.basis.orthonormalized().get_rotation_quaternion()
			tur.global_transform.basis = Basis(q_cur.slerp(q_dst, slew_alpha)).orthonormalized()

func get_weapon_fire_solution(uid: int) -> Dictionary:
	var entry: Dictionary = ShipGrid.placed_modules[uid]
	var mod_id: String = entry["mod_id"]
	var def: Dictionary = GameData.modules[mod_id]
	var muzzle: Marker3D = _muzzles_by_uid[uid]
	var m_pos := muzzle.global_position
	var p_spd := float(def.get("proj_speed", 210.0))
	var w_range := float(def.get("weapon_range", 200.0))

	var barrel_dir: Vector3
	if bool(def.get("is_turret", false)) and _turrets_by_uid.has(uid) and is_instance_valid(_turrets_by_uid[uid]):
		var tur: Node3D = _turrets_by_uid[uid]
		# Snap turret aim if target is already within 2 deg, otherwise use live slewing turret barrel!
		var tgt_point := _get_reticle_assisted_point(m_pos)
		var wish_dir := (tgt_point - m_pos).normalized()
		var cur_tur_fwd := (-tur.global_transform.basis.z).normalized()
		if wish_dir.length_squared() > 0.1 and cur_tur_fwd.dot(wish_dir) > 0.998:
			barrel_dir = wish_dir
		else:
			barrel_dir = cur_tur_fwd
	else:
		var ship_fwd := (-global_transform.basis.z).normalized()
		var tgt_point := _get_reticle_assisted_point(m_pos)
		var wish_dir := (tgt_point - m_pos).normalized()
		if wish_dir.length_squared() < 0.1:
			barrel_dir = ship_fwd
		elif ship_fwd.dot(wish_dir) >= 0.92:
			barrel_dir = wish_dir
		else:
			# Smoothly clamp fixed mounts to a 23-deg forward gimbal cone around ship nose
			barrel_dir = ship_fwd.slerp(wish_dir, 0.25).normalized()

	if barrel_dir.length_squared() < 0.1:
		barrel_dir = (-global_transform.basis.z).normalized()

	var shot_vel: Vector3 = barrel_dir * p_spd + linear_velocity
	var flight_dir: Vector3 = shot_vel.normalized() if shot_vel.length_squared() > 0.1 else barrel_dir
	return {
		"muzzle_pos": m_pos,
		"barrel_dir": barrel_dir,
		"flight_dir": flight_dir,
		"proj_speed": p_spd,
		"shot_vel": shot_vel,
		"range": w_range,
	}

func get_ballistic_sight_info() -> Dictionary:
	var sum_origin := Vector3.ZERO
	var sum_flight_dir := Vector3.ZERO
	var sum_speed := 0.0
	var max_range := 190.0
	var count := 0

	for uid in ShipGrid.placed_modules.keys():
		var entry: Dictionary = ShipGrid.placed_modules[uid]
		var mod_id: String = entry["mod_id"]
		var def: Dictionary = GameData.modules[mod_id]
		if not def.has("weapon_type") or not _muzzles_by_uid.has(uid):
			continue
		if ShipGrid.get_module_efficiency(entry) <= 0.0:
			continue
		var sol := get_weapon_fire_solution(uid)
		sum_origin += sol["muzzle_pos"] as Vector3
		sum_flight_dir += sol["flight_dir"] as Vector3
		sum_speed += float(sol["proj_speed"])
		max_range = maxf(max_range, float(sol["range"]))
		count += 1

	var origin: Vector3
	var flight_dir: Vector3
	var avg_spd: float
	if count > 0:
		origin = sum_origin / float(count)
		flight_dir = (sum_flight_dir / float(count)).normalized()
		avg_spd = sum_speed / float(count)
	else:
		# Fallback ballistic sight along nose + ship drift when only mining gear is equipped
		var s_xf := get_smoothed_transform()
		var nose_fwd := (-s_xf.basis.z).normalized()
		origin = s_xf.origin + nose_fwd * 2.4
		avg_spd = 210.0
		var v := nose_fwd * avg_spd + linear_velocity
		flight_dir = v.normalized() if v.length_squared() > 0.1 else nose_fwd

	if flight_dir.length_squared() < 0.01:
		flight_dir = (-global_transform.basis.z).normalized()

	var ref_dist := 165.0
	if is_instance_valid(locked_enemy):
		ref_dist = clampf(origin.distance_to(locked_enemy.global_position), 25.0, max_range)

	var impact_pos := origin + flight_dir * ref_dist
	var hit_kind := "none"
	var space_state := get_world_3d().direct_space_state
	if space_state != null:
		var q := PhysicsRayQueryParameters3D.create(origin, origin + flight_dir * max_range)
		q.exclude = [get_rid()]
		var hit := space_state.intersect_ray(q)
		if not hit.is_empty():
			impact_pos = hit["position"]
			var col: Object = hit["collider"]
			if col is EnemyShip3D or (col is Node and col.is_in_group("enemies")):
				hit_kind = "enemy"
			elif col is Asteroid3D:
				hit_kind = "asteroid"
			else:
				hit_kind = "prop"

	# Compute moving-target ballistic lead point if an enemy is targeted
	var has_lead := false
	var lead_pos := Vector3.ZERO
	if is_instance_valid(locked_enemy):
		var en_pos := locked_enemy.global_position
		var en_vel := Vector3.ZERO
		if locked_enemy is CharacterBody3D:
			en_vel = (locked_enemy as CharacterBody3D).velocity
		var dist_to_en := origin.distance_to(en_pos)
		var tof := dist_to_en / maxf(40.0, avg_spd)
		lead_pos = en_pos + (en_vel - linear_velocity) * tof
		has_lead = true

	return {
		"origin": origin,
		"flight_dir": flight_dir,
		"world_pos": impact_pos,
		"distance": origin.distance_to(impact_pos),
		"hit_kind": hit_kind,
		"has_weapons": count > 0,
		"has_lead": has_lead,
		"lead_world_pos": lead_pos,
	}

func _process_mining_beams(delta: float) -> void:
	var any_beam_active := false
	var space_state := get_world_3d().direct_space_state
	var mine_mult := float(stats.get("mining_mult", 1.0))
	var loot_mult := float(stats.get("loot_mult", 1.0))
	var rare_ch := float(stats.get("rare_chance", 0.0))

	for uid in _beams_by_uid.keys():
		var bm: MeshInstance3D = _beams_by_uid[uid]
		if not is_instance_valid(bm):
			continue
		if not firing_mining or not ShipGrid.placed_modules.has(uid):
			bm.visible = false
			continue
		var entry: Dictionary = ShipGrid.placed_modules[uid]
		var eff := ShipGrid.get_module_efficiency(entry)
		var mod_id: String = entry["mod_id"]
		var def: Dictionary = GameData.modules[mod_id]
		var edraw := float(def.get("energy_draw", 6.0)) * delta
		if eff <= 0.0 or current_energy < edraw:
			bm.visible = false
			continue

		current_energy -= edraw
		any_beam_active = true
		var muzzle: Marker3D = _muzzles_by_uid[uid]
		var m_pos := muzzle.global_position
		var range_m := GameData.get_module_scaled_stat(mod_id, "mining_range", int(entry["level"]))
		var aim_dir := (aimed_world_point - m_pos).normalized()
		if aim_dir.length_squared() < 0.1:
			aim_dir = -global_transform.basis.z
		var end_pos := m_pos + aim_dir * range_m

		var q := PhysicsRayQueryParameters3D.create(m_pos, end_pos)
		q.exclude = [get_rid()]
		var hit := space_state.intersect_ray(q)
		if not hit.is_empty():
			end_pos = hit["position"]
			var col: Object = hit["collider"]
			var dps := GameData.get_module_scaled_stat(mod_id, "mining_dps", int(entry["level"])) * eff * mine_mult
			if col is Asteroid3D:
				var y_bonus := 1.0 + float(def.get("yield_bonus", 0.0))
				col.apply_mining_damage(dps * delta, int(def.get("hardness_pierce", 1)), loot_mult * y_bonus, rare_ch, chunks_root)
			elif col and col.has_method("take_weapon_damage"):
				col.take_weapon_damage(dps * 0.45 * delta)

		VFXFactory.update_beam_between(bm, m_pos, end_pos)

	AudioManager.set_mining_active(any_beam_active)
	if any_beam_active:
		_mining_sec_accum += delta
		if _mining_sec_accum >= 1.0:
			if AchievementManager:
				AchievementManager.record_event("mining_seconds", _mining_sec_accum)
			_mining_sec_accum = 0.0

func _process_weapons(delta: float) -> void:
	for uid in _weapon_cooldowns.keys():
		_weapon_cooldowns[uid] = maxf(0.0, float(_weapon_cooldowns[uid]) - delta)

	if not firing_weapons or not projectiles_root:
		return

	var dmg_mult := float(stats.get("damage_mult", 1.0))
	var fr_mult := float(stats.get("fire_rate_mult", 1.0))

	for uid in ShipGrid.placed_modules.keys():
		var entry: Dictionary = ShipGrid.placed_modules[uid]
		var mod_id: String = entry["mod_id"]
		var def: Dictionary = GameData.modules[mod_id]
		if not def.has("weapon_type"):
			continue
		if float(_weapon_cooldowns.get(uid, 0.0)) > 0.0:
			continue
		var eff := ShipGrid.get_module_efficiency(entry)
		var shot_e := float(def.get("energy_draw", 5.0)) * 0.35
		if eff <= 0.0 or current_energy < shot_e:
			continue

		current_energy -= shot_e
		var rate := maxf(0.15, float(def["fire_rate"]) * fr_mult * eff)
		_weapon_cooldowns[uid] = 1.0 / rate

		var sol := get_weapon_fire_solution(uid)
		var m_pos: Vector3 = sol["muzzle_pos"]
		var barrel_dir: Vector3 = sol["barrel_dir"]
		var p_spd: float = float(sol["proj_speed"])
		var wtype: String = def["weapon_type"]

		var dmg := GameData.get_module_scaled_stat(mod_id, "weapon_damage", int(entry["level"])) * eff * dmg_mult
		var p := Projectile3D.new()
		projectiles_root.add_child(p)
		var xform := Projectile3D.make_aim_transform(m_pos, barrel_dir, global_transform.basis.y)
		p.setup(
			true,
			wtype,
			dmg,
			p_spd,
			xform,
			float(def.get("splash_radius", 0.0)),
			float(def.get("turn_rate", 0.0)),
			locked_enemy if wtype == "missile" else null,
			linear_velocity
		)

		match wtype:
			"kinetic": AudioManager.play_sfx("mg_shot", 0.08, 0.48)
			"laser": AudioManager.play_sfx("laser_shot", 0.06, 0.55)
			"plasma": AudioManager.play_sfx("plasma_shot", 0.06, 0.65)
			"rocket", "missile": AudioManager.play_sfx("rocket_launch", 0.06, 0.65)
			"railgun": AudioManager.play_sfx("railgun_shot", 0.04, 0.80)

func _process_magnets_and_collection(delta: float) -> void:
	if not chunks_root:
		return
	var mag_mult := float(stats.get("magnet_mult", 1.0))
	var collectors: Array[Dictionary] = []

	for uid in ShipGrid.placed_modules.keys():
		var e: Dictionary = ShipGrid.placed_modules[uid]
		var mid: String = e["mod_id"]
		if GameData.modules[mid].has("magnet_range"):
			var eff := ShipGrid.get_module_efficiency(e)
			if eff > 0.0 and _visuals_by_uid.has(uid):
				collectors.append({
					"pos": _visuals_by_uid[uid].global_position,
					"range": GameData.get_module_scaled_stat(mid, "magnet_range", int(e["level"])) * mag_mult * eff,
					"force": GameData.get_module_scaled_stat(mid, "magnet_force", int(e["level"])) * eff,
				})

	var pickup_radius := 5.2
	for ch in chunks_root.get_children():
		if not (ch is ResourceChunk3D):
			continue
		var chunk := ch as ResourceChunk3D
		var d_ship: float = chunk.global_position.distance_to(global_position)
		if d_ship <= pickup_radius:
			chunk.try_collect()
			continue
		for col in collectors:
			var col_pos: Vector3 = col["pos"]
			var d_col: float = chunk.global_position.distance_to(col_pos)
			if d_col <= pickup_radius:
				chunk.try_collect()
				break
			elif d_col <= float(col["range"]):
				chunk.apply_magnet_pull(col_pos, float(col["force"]), delta)

func _process_orbiting_drones(delta: float) -> void:
	if _orbit_drones.is_empty():
		return
	_drone_angle += delta * 1.9
	for i in range(_orbit_drones.size()):
		var ang := _drone_angle + float(i) * (TAU / float(_orbit_drones.size()))
		_orbit_drones[i].position = center_of_mass + Vector3(cos(ang) * 5.2, 1.4 + sin(ang * 2.0) * 0.6, sin(ang) * 5.2)

	_drone_fire_cd -= delta
	if _drone_fire_cd <= 0.0 and projectiles_root:
		_drone_fire_cd = 0.85
		var nearest: Node3D = null
		var best_d := 95.0
		for e in get_tree().get_nodes_in_group("enemies"):
			if e is Node3D:
				var e_n := e as Node3D
				var d: float = e_n.global_position.distance_to(global_position)
				if d < best_d:
					best_d = d
					nearest = e_n
		if is_instance_valid(nearest):
			for dn in _orbit_drones:
				var dir := (nearest.global_position - dn.global_position).normalized()
				var p := Projectile3D.new()
				projectiles_root.add_child(p)
				p.setup(true, "laser", 20.0 * float(stats.get("damage_mult", 1.0)), 220.0, Projectile3D.make_aim_transform(dn.global_position, dir), 0.0, 0.0, null, linear_velocity)

func receive_enemy_hit(raw_damage: float, hit_world_pos: Vector3, shape_idx: int = 0) -> void:
	if raw_damage <= 0.0:
		return
	_shield_regen_delay = 3.2
	var remaining := raw_damage
	if current_shield > 0.0:
		var absorbed := minf(current_shield, remaining)
		current_shield -= absorbed
		remaining -= absorbed
		_shield_hit_flash = 1.0
		AudioManager.play_sfx("shield_hit", 0.06, 0.65)
	if remaining <= 0.01:
		return

	# Apply global armor mitigation
	var armor_red := float(stats.get("armor_reduction", 0.0))
	remaining *= (1.0 - armor_red)

	# Find closest installed module to hit_world_pos (or mapped shape_idx)
	var hit_uid: int = int(_shape_idx_to_uid.get(shape_idx, -1))
	if not ShipGrid.placed_modules.has(hit_uid):
		var best_d := 99999.0
		for uid in _visuals_by_uid.keys():
			if ShipGrid.placed_modules.has(uid) and float(ShipGrid.placed_modules[uid]["hp"]) > 0.0:
				var d: float = _visuals_by_uid[uid].global_position.distance_to(hit_world_pos)
				if d < best_d:
					best_d = d
					hit_uid = uid

	if not ShipGrid.placed_modules.has(hit_uid):
		return

	var entry: Dictionary = ShipGrid.placed_modules[hit_uid]
	var prev_hp := float(entry["hp"])
	entry["hp"] = maxf(0.0, prev_hp - remaining)
	var ratio := float(entry["hp"]) / maxf(1.0, float(entry["max_hp"]))

	if ratio < 0.5 and ratio > 0.0 and _sparks_by_uid.has(hit_uid):
		_sparks_by_uid[hit_uid].emitting = true

	if prev_hp > 0.0 and float(entry["hp"]) <= 0.0:
		if entry["mod_id"] == "cockpit_mk1":
			VFXFactory.spawn_explosion(get_parent(), global_position, Color(1.0, 0.35, 0.12), 2.2)
			AudioManager.play_sfx("explosion", 0.04, 1.0)
			cockpit_destroyed.emit()
			return
		else:
			# Module knocked out -> detach debris burst & hide visual until Hangar repair!
			if _visuals_by_uid.has(hit_uid):
				var vnode: Node3D = _visuals_by_uid[hit_uid]
				VFXFactory.spawn_explosion(get_parent(), vnode.global_position, Color(1.0, 0.55, 0.18), 0.85)
				vnode.visible = false
			if _sparks_by_uid.has(hit_uid):
				_sparks_by_uid[hit_uid].emitting = false

	stats = ShipGrid.compute_ship_stats()
	mass = maxf(1.0, float(stats["total_mass"]))
	center_of_mass = stats["center_of_mass"]
