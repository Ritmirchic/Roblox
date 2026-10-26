class_name PlayerShip3D
extends RigidBody3D

signal cockpit_destroyed
signal cargo_spilled(lost: Dictionary, at_position: Vector3)
signal ship_telemetry_updated(telemetry: Dictionary)

var stats: Dictionary = {}
var current_energy: float = 120.0
var current_shield: float = 0.0
var engine_heat: float = 0.0

# --- Reactor load governor (v2.2.0) -----------------------------------------
# Real power management: every subsystem is metered against the share of reactor
# output its profile allows. Sustained over-draw droops that subsystem (mining
# slows, turret cycle time stretches), and when the capacitor collapses the ship
# sheds mining and weapons first while engines keep enough to fly home.
var _sys_load: Dictionary = {"mining": 0.0, "weapons": 0.0, "engines": 0.0, "repair": 0.0}
var _frame_draw: Dictionary = {}
# Sustained draw is what a budget is about, so energy is integrated over a
# window and averaged: one loud shot must not look like a permanent overload.
const POWER_WINDOW: float = 0.5
var _win_draw: Dictionary = {"mining": 0.0, "weapons": 0.0, "engines": 0.0, "repair": 0.0}
var _win_t: float = 0.0
var power_brownout: bool = false
var power_output_load: float = 0.0
var power_throttle_events: int = 0
var _was_brownout: bool = false
var stabilizer_enabled: bool = true
var controls_enabled: bool = true

# External scene containers wired by SpaceExpedition3D
var projectiles_root: Node = null
var chunks_root: Node = null
var beams_root: Node = null

var _visuals_by_uid: Dictionary = {}     # uid -> Node3D
var _turrets_by_uid: Dictionary = {}     # uid -> Node3D
var _radars_by_uid: Dictionary = {}      # uid -> Node3D
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
	_radars_by_uid.clear()
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
		elif mod_id in ["radar", "magnetic_radar"]:
			_radars_by_uid[uid] = pivot

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

	# Nano-repair module active restoration (throttled by its power budget)
	var rep_rate := float(stats.get("repair_rate", 0.0)) * power_factor("repair")
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
			note_power_draw("repair", 3.0 * delta)
			stats = ShipGrid.compute_ship_stats()

	_apply_flight_physics(delta)
	_update_turrets(delta)
	_process_mining_beams(delta)
	_process_weapons(delta)
	_process_magnets_and_collection(delta)
	_process_orbiting_drones(delta)

	_curr_phys_xform = global_transform
	_phys_interp_ready = true
	_update_power_governor(delta)

	ship_telemetry_updated.emit({
		"speed": linear_velocity.length(),
		"power": get_power_report(),
		"energy": current_energy,
		"max_energy": max_e,
		"shield": current_shield,
		"max_shield": float(stats.get("shield_cap", 0.0)),
		"hp": float(stats.get("current_hp", 100.0)),
		"max_hp": maxf(1.0, float(stats.get("total_hp", 100.0))),
		"heat": engine_heat,
		"stabilizer": stabilizer_enabled,
	})

func note_power_draw(sys_id: String, joules: float) -> void:
	## Called by each subsystem with the energy it just spent this physics tick.
	if joules <= 0.0:
		return
	_frame_draw[sys_id] = float(_frame_draw.get(sys_id, 0.0)) + joules


func power_factor(sys_id: String) -> float:
	## 0.0..1.0 throughput multiplier for a subsystem, from its measured draw
	## against the budget the reactor profile allows it (droop governor).
	var budget: float = ShipGrid.power_budget(sys_id, stats)
	var used: float = float(_sys_load.get(sys_id, 0.0))
	var headroom: float = clampf((budget - used) / maxf(1.0, budget * 0.55), 0.0, 1.0)
	var f: float = 0.30 + 0.70 * headroom
	if power_brownout:
		# Capacitor collapse: engines keep the most, mining and guns the least.
		f *= 0.86 if sys_id == "engines" else (0.34 if sys_id == "repair" else 0.18)
	return clampf(f, 0.0, 1.0)


func power_shed(sys_id: String) -> bool:
	## True when a subsystem must be dropped entirely (priority shed order).
	if power_brownout and (sys_id == "mining" or sys_id == "weapons"):
		return true
	return power_factor(sys_id) <= 0.32


func _update_power_governor(delta: float) -> void:
	var cap: float = maxf(20.0, float(stats.get("energy_cap", 120.0)))
	var regen: float = maxf(12.0, float(stats.get("energy_regen", 25.0)))
	for k in _frame_draw.keys():
		_win_draw[k] = float(_win_draw.get(k, 0.0)) + float(_frame_draw[k])
	_frame_draw.clear()
	_win_t += delta
	if _win_t >= POWER_WINDOW:
		var total: float = 0.0
		var inv: float = 1.0 / maxf(0.05, _win_t)
		for k in ShipGrid.POWER_SYSTEMS:
			var sustained: float = float(_win_draw.get(k, 0.0)) * inv
			_sys_load[k] = lerpf(float(_sys_load.get(k, 0.0)), sustained, 0.7)
			total += float(_sys_load[k])
			_win_draw[k] = 0.0
		_win_t = 0.0
		power_output_load = clampf(total / regen, 0.0, 3.0)
	power_brownout = (current_energy / cap) < 0.12
	if power_brownout and not _was_brownout:
		power_throttle_events += 1
	_was_brownout = power_brownout


func get_power_report() -> Dictionary:
	var rows: Array = []
	for k in ShipGrid.POWER_SYSTEMS:
		var b: float = ShipGrid.power_budget(k, stats)
		var l: float = float(_sys_load.get(k, 0.0))
		rows.append({
			"id": k,
			"share": ShipGrid.power_share(k),
			"budget": b,
			"load": l,
			"pct": clampf(l / maxf(1.0, b), 0.0, 1.6),
			"factor": power_factor(k),
			"shed": power_shed(k),
		})
	return {
		"profile": ShipGrid.get_power_profile_id(),
		"rows": rows,
		"brownout": power_brownout,
		"load_pct": power_output_load,
		"events": power_throttle_events,
		"energy": current_energy,
		"max_energy": maxf(20.0, float(stats.get("energy_cap", 120.0))),
	}


func _apply_flight_physics(delta: float) -> void:
	var total_thrust := float(stats.get("total_thrust", 180.0))
	var boost_mult := 1.0
	var eng_pow := power_factor("engines")
	if boost_active and thrust_input.length_squared() > 0.01 and engine_heat < 95.0 \
			and current_energy > 8.0 and not power_shed("engines"):
		boost_mult = 1.65
		engine_heat = minf(100.0, engine_heat + 22.0 * delta)
		current_energy = maxf(0.0, current_energy - 14.0 * delta)
		note_power_draw("engines", 14.0 * delta)
	else:
		engine_heat = maxf(0.0, engine_heat - 18.0 * delta)

	var overheat_penalty := 0.55 if engine_heat >= 96.0 else 1.0
	var fwd := -global_transform.basis.z
	var right := global_transform.basis.x
	var up := global_transform.basis.y

	var world_thrust_dir := (fwd * thrust_input.z + right * (thrust_input.x * 0.82) + up * (thrust_input.y * 0.82))
	if world_thrust_dir.length_squared() > 0.001 and total_thrust > 0.0:
		var force := world_thrust_dir.limit_length(1.0) * total_thrust * boost_mult \
			* overheat_penalty * (0.45 + 0.55 * eng_pow)
		apply_central_force(force)
		# Subtle physical off-center CoM torque effect (mitigated partly when stabilizer is on)
		var com_offset: Vector3 = stats.get("center_of_mass", Vector3.ZERO) - stats.get("thrust_center", Vector3.ZERO)
		var asym_scale := 0.04 if stabilizer_enabled else 0.18
		if com_offset.length_squared() > 0.05:
			apply_torque(global_transform.basis * (com_offset.cross(Vector3(0, 0, -1)) * total_thrust * 0.012 * asym_scale))

	# Smooth, Controlled 6-DOF 360-Degree Rotation (calm speed ~85-105 deg/s max, zero gimbal lock!)
	var ang_acc := float(stats.get("angular_accel", 3.2))
	var agility := clampf(0.88 + (ang_acc - 3.2) * 0.04, 0.85, 1.32)
	var rot_c := Vector3(
		clampf(rot_input.x, -1.0, 1.0),
		clampf(rot_input.y, -1.0, 1.0),
		clampf(rot_input.z, -1.0, 1.0)
	)
	var desired_local_ang := Vector3(
		rot_c.x * 1.45 * agility,
		rot_c.y * 1.55 * agility,
		rot_c.z * 1.85 * agility
	)
	var desired_world_ang := global_transform.basis * desired_local_ang
	if rot_c.length_squared() > 0.0004:
		var rot_blend := 1.0 - exp(-8.5 * delta)
		angular_velocity = angular_velocity.lerp(desired_world_ang, rot_blend)
	elif stabilizer_enabled:
		var damp_blend := 1.0 - exp(-6.8 * delta)
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
	# Spin active Tactical & Magnetic Homing Radar dishes on hull
	for r_uid in _radars_by_uid.keys():
		var rpiv: Node3D = _radars_by_uid[r_uid]
		if is_instance_valid(rpiv) and ShipGrid.placed_modules.has(r_uid):
			var r_entry: Dictionary = ShipGrid.placed_modules[r_uid]
			if ShipGrid.get_module_efficiency(r_entry) > 0.0:
				var spin_spd := 2.8 if str(r_entry["mod_id"]) == "magnetic_radar" else 1.4
				rpiv.rotate_y(spin_spd * delta)

	var max_slew_rad := 2.4 * delta # ~138 deg/sec smooth mechanical turret tracking
	for uid in _turrets_by_uid.keys():
		var tur: Node3D = _turrets_by_uid[uid]
		if not is_instance_valid(tur):
			continue
		var target_pt := _get_reticle_assisted_point(tur.global_position)
		# Compensate for 0.05m vertical muzzle offset above turret pivot so the gun barrel intersects target_pt dead-center!
		var to_t := (target_pt - tur.global_transform.basis.y * 0.05) - tur.global_position
		if to_t.length_squared() > 1.0:
			var aim_xform := Projectile3D.make_aim_transform(tur.global_position, to_t.normalized(), global_transform.basis.y)
			var q_cur := tur.global_transform.basis.orthonormalized().get_rotation_quaternion()
			var q_dst := aim_xform.basis.orthonormalized().get_rotation_quaternion()
			var ang := q_cur.angle_to(q_dst)
			if ang > 0.0005:
				var step_t := clampf(max_slew_rad / ang, 0.0, 1.0)
				tur.global_transform.basis = Basis(q_cur.slerp(q_dst, step_t)).orthonormalized()
			else:
				tur.global_transform.basis = aim_xform.basis.orthonormalized()

func find_magnetic_target(from_pos: Vector3, prefer_dir: Vector3) -> Node3D:
	var mag_turn := float(stats.get("bullet_magnet_turn", 0.0))
	var mag_range := float(stats.get("bullet_magnet_range", 0.0))
	if mag_turn <= 0.0 or mag_range <= 0.0 or not is_inside_tree():
		return null
	if is_instance_valid(locked_enemy) and from_pos.distance_to(locked_enemy.global_position) <= mag_range:
		return locked_enemy
	var aim_dir := (aimed_world_point - from_pos).normalized()
	if aim_dir.length_squared() < 0.1:
		aim_dir = prefer_dir
	var best_en: Node3D = null
	var best_score := 1e9
	for e in get_tree().get_nodes_in_group("enemies"):
		if e is Node3D and is_instance_valid(e):
			var en_n := e as Node3D
			var d := from_pos.distance_to(en_n.global_position)
			if d <= mag_range:
				var dir_e := (en_n.global_position - from_pos).normalized()
				var align := maxf(-0.45, aim_dir.dot(dir_e))
				var score := d / (1.45 + align)
				if score < best_score:
					best_score = score
					best_en = en_n
	return best_en

func get_weapon_fire_solution(uid: int) -> Dictionary:
	var entry: Dictionary = ShipGrid.placed_modules[uid]
	var mod_id: String = entry["mod_id"]
	var def: Dictionary = GameData.modules[mod_id]
	var muzzle: Marker3D = _muzzles_by_uid[uid]
	var m_pos := muzzle.global_position
	var p_spd := float(def.get("proj_speed", 210.0))
	var wtype := str(def.get("weapon_type", "kinetic"))
	var is_mag := float(stats.get("bullet_magnet_turn", 0.0)) > 0.0 and float(stats.get("bullet_magnet_range", 0.0)) > 0.0
	var lifetime_sec := 5.5 if (wtype in ["rocket", "missile"] or is_mag) else 2.8
	var max_travel := p_spd * lifetime_sec

	var barrel_dir: Vector3
	if bool(def.get("is_turret", false)) and _turrets_by_uid.has(uid) and is_instance_valid(_turrets_by_uid[uid]):
		var tur: Node3D = _turrets_by_uid[uid]
		barrel_dir = (-tur.global_transform.basis.z).normalized()
	elif _visuals_by_uid.has(uid) and is_instance_valid(_visuals_by_uid[uid]):
		var vnode: Node3D = _visuals_by_uid[uid]
		barrel_dir = (-vnode.global_transform.basis.z).normalized()
	else:
		barrel_dir = (-global_transform.basis.z).normalized()

	if barrel_dir.length_squared() < 0.1:
		barrel_dir = (-global_transform.basis.z).normalized()

	# Raycast exact straight-line bullet trajectory in world space to find where the bullet WILL arrive/impact!
	var impact_pos: Vector3 = m_pos + barrel_dir * max_travel
	var hit_kind := "none"
	var hit_dist := max_travel
	var space_state := get_world_3d().direct_space_state
	if space_state != null:
		var q := PhysicsRayQueryParameters3D.create(m_pos, impact_pos)
		q.exclude = [get_rid()]
		var hit := space_state.intersect_ray(q)
		if not hit.is_empty():
			impact_pos = hit["position"]
			hit_dist = m_pos.distance_to(impact_pos)
			var col: Object = hit["collider"]
			if col is EnemyShip3D or (col is Node and col.is_in_group("enemies")):
				hit_kind = "enemy"
			elif col is Asteroid3D:
				hit_kind = "asteroid"
			else:
				hit_kind = "prop"

	# When Magnetic Homing Radar is active and an enemy is within magnetic lock range (without immediate muzzle obstruction),
	# the magnetized bullet curves onto the enemy — that impact point is what the
	# reticle readout reports (the ballistic pipper overlay was removed in v2.2.0).
	var mag_tgt: Node3D = find_magnetic_target(m_pos, barrel_dir) if is_mag else null
	if is_instance_valid(mag_tgt):
		var d_mag := m_pos.distance_to(mag_tgt.global_position)
		var blocked_at_muzzle := (hit_kind in ["asteroid", "prop"] and hit_dist < minf(16.0, d_mag * 0.45))
		if not blocked_at_muzzle:
			impact_pos = mag_tgt.global_position
			hit_kind = "magnetic_enemy"

	return {
		"muzzle_pos": m_pos,
		"barrel_dir": barrel_dir,
		"flight_dir": barrel_dir,
		"proj_speed": p_spd,
		"max_travel": max_travel,
		"impact_pos": impact_pos,
		"hit_kind": hit_kind,
		"magnetic_target": mag_tgt,
	}

func get_ballistic_sight_info() -> Dictionary:
	var primary_impact := Vector3.ZERO
	var primary_origin := Vector3.ZERO
	var primary_dir := Vector3.ZERO
	var primary_hit_kind := "none"
	var avg_spd := 210.0
	var secondary_impacts: Array[Vector3] = []
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
		var imp: Vector3 = sol["impact_pos"]
		if count == 0:
			primary_impact = imp
			primary_origin = sol["muzzle_pos"] as Vector3
			primary_dir = sol["barrel_dir"] as Vector3
			primary_hit_kind = str(sol["hit_kind"])
			avg_spd = float(sol["proj_speed"])
		else:
			secondary_impacts.append(imp)
			if primary_hit_kind == "none" and str(sol["hit_kind"]) != "none":
				primary_hit_kind = str(sol["hit_kind"])
				primary_impact = imp
		count += 1

	if count == 0:
		# Fallback sight along ship nose / mining mount when no weapons are installed yet
		var nose_fwd := (-global_transform.basis.z).normalized()
		primary_origin = global_position + nose_fwd * 2.4
		primary_dir = nose_fwd
		var max_d := 300.0
		primary_impact = primary_origin + nose_fwd * max_d
		var space_state := get_world_3d().direct_space_state
		if space_state != null:
			var q := PhysicsRayQueryParameters3D.create(primary_origin, primary_impact)
			q.exclude = [get_rid()]
			var hit := space_state.intersect_ray(q)
			if not hit.is_empty():
				primary_impact = hit["position"]
				var col: Object = hit["collider"]
				if col is EnemyShip3D or (col is Node and col.is_in_group("enemies")):
					primary_hit_kind = "enemy"
				elif col is Asteroid3D:
					primary_hit_kind = "asteroid"
				else:
					primary_hit_kind = "prop"

	# Moving-target intercept lead indicator (accounts for enemy motion during bullet flight time)
	var has_lead := false
	var lead_pos := Vector3.ZERO
	if is_instance_valid(locked_enemy):
		var en_pos := locked_enemy.global_position
		var en_vel := Vector3.ZERO
		if locked_enemy is CharacterBody3D:
			en_vel = (locked_enemy as CharacterBody3D).velocity
		var dist_to_en := primary_origin.distance_to(en_pos)
		var tof := dist_to_en / maxf(40.0, avg_spd)
		lead_pos = en_pos + en_vel * tof
		has_lead = true

	return {
		"origin": primary_origin,
		"flight_dir": primary_dir,
		"world_pos": primary_impact,
		"secondary_impacts": secondary_impacts,
		"distance": primary_origin.distance_to(primary_impact),
		"hit_kind": primary_hit_kind,
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
		var mine_pow := power_factor("mining")
		if eff <= 0.0 or current_energy < edraw or power_shed("mining"):
			bm.visible = false
			continue

		current_energy -= edraw
		note_power_draw("mining", edraw)
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
			var dps := GameData.get_module_scaled_stat(mod_id, "mining_dps", int(entry["level"])) * eff * mine_mult * (0.35 + 0.65 * mine_pow)
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
		var wep_pow := power_factor("weapons")
		if eff <= 0.0 or current_energy < shot_e or power_shed("weapons"):
			continue

		current_energy -= shot_e
		note_power_draw("weapons", shot_e)
		var rate := maxf(0.15, float(def["fire_rate"]) * fr_mult * eff * (0.40 + 0.60 * wep_pow))
		_weapon_cooldowns[uid] = 1.0 / rate

		var sol := get_weapon_fire_solution(uid)
		var m_pos: Vector3 = sol["muzzle_pos"]
		var barrel_dir: Vector3 = sol["barrel_dir"]
		var p_spd: float = float(sol["proj_speed"])
		var wtype: String = def["weapon_type"]

		var dmg := GameData.get_module_scaled_stat(mod_id, "weapon_damage", int(entry["level"])) * eff * dmg_mult
		var mag_turn := float(stats.get("bullet_magnet_turn", 0.0))
		var mag_range := float(stats.get("bullet_magnet_range", 0.0))
		var is_mag := mag_turn > 0.0 and mag_range > 0.0
		var eff_turn := maxf(float(def.get("turn_rate", 0.0)), mag_turn) if is_mag else float(def.get("turn_rate", 0.0))
		var tgt_node: Node3D = (sol["magnetic_target"] as Node3D) if is_mag else (locked_enemy if wtype == "missile" else null)

		var p := Projectile3D.new()
		p.ignore_rid = get_rid()
		projectiles_root.add_child(p)
		var xform := Projectile3D.make_aim_transform(m_pos, barrel_dir, global_transform.basis.y)
		p.setup(
			true,
			wtype,
			dmg,
			p_spd,
			xform,
			float(def.get("splash_radius", 0.0)),
			eff_turn,
			tgt_node,
			Vector3.ZERO,
			is_mag,
			mag_range
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
			var d_mag_turn := float(stats.get("bullet_magnet_turn", 0.0))
			var d_mag_range := float(stats.get("bullet_magnet_range", 0.0))
			var d_is_mag := d_mag_turn > 0.0 and d_mag_range > 0.0
			for dn in _orbit_drones:
				var dir := (nearest.global_position - dn.global_position).normalized()
				var p := Projectile3D.new()
				p.ignore_rid = get_rid()
				projectiles_root.add_child(p)
				p.setup(true, "laser", 20.0 * float(stats.get("damage_mult", 1.0)), 220.0, Projectile3D.make_aim_transform(dn.global_position, dir), 0.0, d_mag_turn if d_is_mag else 0.0, nearest if d_is_mag else null, Vector3.ZERO, d_is_mag, d_mag_range)

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

	# Unsecured cargo shakes loose when a hit gets past shields and armour:
	# the harder the shock relative to the total hull, the more ore spills out
	# of the bays, so a full haul is genuinely riskier to fly through a fight.
	var max_hp_total: float = maxf(40.0, float(stats.get("total_hp", 100.0)))
	var shock: float = clampf((prev_hp - float(entry["hp"])) / max_hp_total, 0.0, 0.30)
	if shock > 0.035:
		var lost: Dictionary = ShipGrid.spill_cargo(shock)
		if not lost.is_empty():
			cargo_spilled.emit(lost, hit_world_pos)
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
