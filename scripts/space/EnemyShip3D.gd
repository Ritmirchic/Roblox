class_name EnemyShip3D
extends CharacterBody3D

signal defeated(enemy: EnemyShip3D, world_pos: Vector3)

var enemy_id: String = "scout_drone"
var display_name: String = "Scout Drone"
var max_hp: float = 80.0
var hp: float = 80.0
var max_shield: float = 0.0
var shield: float = 0.0
var move_speed: float = 24.0
var attack_damage: float = 10.0
var fire_rate: float = 1.2
var engage_range: float = 110.0
var credit_reward: int = 100
var drop_resource: String = "iron"
# Elite response wings (threat system): tougher, louder, better salvage.
var elite: bool = false
# Threat escalation multiplier: hot sectors fight meaner (speed + tempo).
var aggression: float = 1.0
var _lock_ring: MeshInstance3D = null
var _halo: MeshInstance3D = null
# Hull-punch scale pulse after a confirmed hit (v2.6.0 hit feedback).
var _hit_punch: float = 0.0

var target_ship: Node3D = null
var projectiles_root: Node = null
var chunks_root: Node = null

var _fire_cd: float = 0.8
var _strafe_phase: float = 0.0
var _strafe_dir: float = 1.0
var _dead: bool = false

func setup(
	eid: String,
	spawn_pos: Vector3,
	player_ref: Node3D,
	proj_parent: Node,
	chunk_parent: Node,
	as_elite: bool = false
) -> void:
	enemy_id = eid if GameData.enemies.has(eid) else "scout_drone"
	var def: Dictionary = GameData.enemies[enemy_id]
	display_name = str(def["name"])
	max_hp = float(def["hp"])
	hp = max_hp
	max_shield = float(def["shield"])
	shield = max_shield
	move_speed = float(def["speed"])
	attack_damage = float(def["damage"])
	fire_rate = float(def["fire_rate"])
	engage_range = float(def["range"])
	credit_reward = int(def["credits"])
	drop_resource = str(def["drop_resource"])
	elite = as_elite
	if elite:
		max_hp *= 2.65
		hp = max_hp
		max_shield *= 2.2
		shield = max_shield
		attack_damage *= 1.45
		fire_rate *= 1.28
		move_speed *= 1.08
		engage_range *= 1.22
		credit_reward = int(round(credit_reward * 4.0))

	position = spawn_pos
	target_ship = player_ref
	projectiles_root = proj_parent
	chunks_root = chunk_parent
	_strafe_phase = randf() * TAU
	_strafe_dir = -1.0 if randf() < 0.5 else 1.0

	# Elites are drawn 1.26x larger; the sphere used to stay at the base radius, so
	# shots aimed at the wings flew straight through the hull.
	var visual_scale := 1.26 if elite else 1.0
	var body_radius := 2.0 * float(def.get("scale", 1.15)) * visual_scale
	var col := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = body_radius
	col.shape = sph
	add_child(col)

	var mpath: String = def["model"]
	if ResourceLoader.exists(mpath):
		var ps: PackedScene = load(mpath)
		if ps:
			var inst := ps.instantiate()
			inst.scale = Vector3.ONE * float(def.get("scale", 1.15))
			add_child(inst)

	var plume := VFXFactory.create_thruster_plume(0.35, 1.8)
	plume.position = Vector3(0, 0, 1.8 * float(def.get("scale", 1.15)))
	add_child(plume)

	var body_scale := body_radius
	if elite:
		scale = Vector3.ONE * visual_scale

	# green soft-lock bracket drawn around the hull so the marked target is unmistakable
	_lock_ring = MeshInstance3D.new()
	var ring := TorusMesh.new()
	ring.inner_radius = body_scale * 1.24
	ring.outer_radius = body_scale * 1.40
	ring.rings = 24
	ring.ring_segments = 8
	_lock_ring.mesh = ring
	_lock_ring.rotation_degrees = Vector3(90, 0, 0)
	var rmat := StandardMaterial3D.new()
	rmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	rmat.albedo_color = Color(0.30, 1.0, 0.60, 0.85)
	rmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_lock_ring.material_override = rmat
	_lock_ring.visible = false
	_lock_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_lock_ring)

	if elite:
		# gold command halo so an elite reads as an elite at 300 m
		_halo = MeshInstance3D.new()
		var halo := TorusMesh.new()
		halo.inner_radius = body_scale * 1.55
		halo.outer_radius = body_scale * 1.66
		halo.rings = 20
		halo.ring_segments = 6
		_halo.mesh = halo
		_halo.rotation_degrees = Vector3(74, 0, 0)
		_halo.position = Vector3(0, body_scale * 0.55, 0)
		var hmat := StandardMaterial3D.new()
		hmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		hmat.albedo_color = Color(1.0, 0.80, 0.28, 0.92)
		hmat.emission_enabled = true
		hmat.emission = Color(1.0, 0.72, 0.20)
		hmat.emission_energy_multiplier = 1.8
		hmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_halo.material_override = hmat
		_halo.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(_halo)

	add_to_group("enemies")


func is_dead() -> bool:
	return _dead


func set_lock_state(on: bool) -> void:
	if not is_instance_valid(_lock_ring) or _lock_ring.visible == on:
		return
	_lock_ring.visible = on
	if on and not ThemeHelper.reduced_motion and is_inside_tree():
		_lock_ring.scale = Vector3.ONE * 1.30
		var tw := create_tween()
		tw.tween_property(_lock_ring, "scale", Vector3.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _physics_process(delta: float) -> void:
	_pulse_hit_punch(delta)
	if _dead or not is_instance_valid(target_ship):
		return

	if shield < max_shield:
		shield = minf(max_shield, shield + max_shield * (0.04 if aggression <= 1.0 else 0.085) * delta)
	var spd := move_speed * aggression

	if is_instance_valid(_halo):
		_halo.rotate_z(delta * 1.15)
	if is_instance_valid(_lock_ring):
		_lock_ring.rotate_z(-delta * 0.85)
	_strafe_phase += delta * (1.35 if not elite else 1.75)
	var to_player := target_ship.global_position - global_position
	var dist := to_player.length()
	var dir_to_player := to_player / maxf(0.01, dist)

	# Smooth orientation toward player
	if dir_to_player.length_squared() > 0.2 and absf(dir_to_player.dot(Vector3.UP)) < 0.98:
		var target_basis := Basis.looking_at(dir_to_player, Vector3.UP)
		global_transform.basis = global_transform.basis.slerp(target_basis, clampf(delta * 3.5, 0.0, 1.0)).orthonormalized()

	var desired_vel := Vector3.ZERO
	if dist > engage_range * 1.45:
		# Patrol / close distance
		desired_vel = dir_to_player * spd * 0.85
	elif dist > engage_range * 0.58:
		# Strafe orbit around player
		var tangent := dir_to_player.cross(Vector3.UP).normalized() * _strafe_dir
		var vertical := Vector3.UP * sin(_strafe_phase) * 0.35
		desired_vel = (dir_to_player * 0.35 + tangent * 0.85 + vertical).normalized() * spd
	else:
		# Break away to prevent ramming lock
		var tangent2 := dir_to_player.cross(Vector3.UP).normalized() * _strafe_dir
		desired_vel = (-dir_to_player * 0.65 + tangent2 * 0.75).normalized() * spd

	velocity = velocity.lerp(desired_vel, clampf(delta * 3.0, 0.0, 1.0))
	move_and_slide()

	# Firing logic
	_fire_cd -= delta
	if dist <= engage_range and _fire_cd <= 0.0 and projectiles_root:
		_fire_cd = 1.0 / maxf(0.2, fire_rate * aggression)
		_fire_at_player(dir_to_player)

func _fire_at_player(aim_dir: Vector3) -> void:
	# Enemy fire used to be completely silent, so incoming shots were invisible
	# until they landed. One quiet report per volley with a little pitch spread.
	AudioManager.play_sfx("laser_shot", 0.09, 0.42)
	var wtype := "plasma" if enemy_id in ["plasma_hunter", "void_sentinel"] else "laser"
	var shots := 3 if elite else 1
	for i in range(shots):
		var p := Projectile3D.new()
		projectiles_root.add_child(p)
		var muzzle_pos := global_position - global_transform.basis.z * 2.4
		if shots > 1:
			# elite wings walk a short spread across the target
			muzzle_pos += global_transform.basis.x * float(i - 1) * 1.15
		var spread := aim_dir.rotated(Vector3.UP, float(i - 1) * 0.055)
		var xform := Projectile3D.make_aim_transform(muzzle_pos, spread)
		p.setup(false, wtype, attack_damage * (0.82 if elite else 1.0), 142.0 if elite else 125.0, xform)

func take_weapon_damage(dmg: float, hit_pos: Vector3 = Vector3.ZERO) -> void:
	if _dead or dmg <= 0.0:
		return
	var rem := dmg
	if shield > 0.0:
		var absorbed := minf(shield, rem)
		shield -= absorbed
		rem -= absorbed
		if absorbed > 0.0:
			_shield_flash(hit_pos if hit_pos != Vector3.ZERO else global_position)
	hp -= rem
	if rem > 0.0:
		_hull_impact(hit_pos if hit_pos != Vector3.ZERO else global_position)
	if hp <= 0.0:
		_die()


func _shield_flash(at: Vector3) -> void:
	## Shield hits read differently from hull hits: a dielectric bubble flash that
	## collapses, so the player can tell "shields up" from "taking real damage".
	var mi := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 2.6
	sph.height = 5.2
	sph.radial_segments = 14
	sph.rings = 8
	mi.mesh = sph
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = Color(0.35, 0.82, 1.0, 0.85) * 2.0
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	get_parent().add_child(mi)
	mi.global_position = global_position
	mi.scale = Vector3.ONE * 0.55
	var tw := mi.create_tween()
	tw.set_parallel(true)
	tw.tween_property(mi, "scale", Vector3.ONE * 1.15, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_method(func(a: float): mat.albedo_color = Color(0.35, 0.82, 1.0, a) * 2.0, 0.85, 0.0, 0.22)
	tw.chain().tween_callback(mi.queue_free)
	VFXFactory.spawn_impact_ring(get_parent(), at, Color(0.42, 0.86, 1.0), 1.9, 0.26)


func _hull_impact(at: Vector3) -> void:
	VFXFactory.spawn_impact_ring(get_parent(), at, Color(1.0, 0.62, 0.28), 1.6, 0.24)
	VFXFactory.spawn_debris_burst(
		get_parent(), at, Color(1.0, 0.72, 0.35),
		maxi(2, int(round(5.0 * ThemeHelper.quality_float("particles")))), 9.0
	)
	# A short hull punch makes every connected round feel like it landed.
	_hit_punch = 1.0
	scale = Vector3.ONE * (1.26 if elite else 1.0) * 1.045


func _pulse_hit_punch(delta: float) -> void:
	if _hit_punch <= 0.0:
		return
	_hit_punch = maxf(0.0, _hit_punch - delta * 6.0)
	var base := 1.26 if elite else 1.0
	scale = Vector3.ONE * (base * (1.0 + 0.045 * _hit_punch))

func _die() -> void:
	if _dead:
		return
	_dead = true
	AudioManager.play_sfx("explosion", 0.08, 0.9)
	VFXFactory.spawn_explosion(get_parent(), global_position, Color(1.0, 0.45, 0.16), 1.45)

	if elite:
		AudioManager.play_sfx("explosion", 0.06, 0.62)
		VFXFactory.spawn_explosion(get_parent(), global_position, Color(1.0, 0.78, 0.30), 2.35)
	ShipGrid.add_credits(credit_reward)
	ShipGrid.stats_history["enemies_defeated"] = int(ShipGrid.stats_history.get("enemies_defeated", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("defeat_enemy", 1)

	if chunks_root:
		for _i in range(4 if elite else 2):
			var ch := ResourceChunk3D.new()
			var d := Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
			ch.setup(drop_resource, 3 if elite else 2, global_position + d * 1.2, d * 8.0)
			chunks_root.add_child(ch)

	defeated.emit(self, global_position)
	queue_free()
