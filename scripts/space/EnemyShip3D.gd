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

var target_ship: Node3D = null
var projectiles_root: Node = null
var chunks_root: Node = null

var _fire_cd: float = 0.8
var _strafe_phase: float = 0.0
var _strafe_dir: float = 1.0
var _dead: bool = false

func setup(eid: String, spawn_pos: Vector3, player_ref: Node3D, proj_parent: Node, chunk_parent: Node) -> void:
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

	position = spawn_pos
	target_ship = player_ref
	projectiles_root = proj_parent
	chunks_root = chunk_parent
	_strafe_phase = randf() * TAU
	_strafe_dir = -1.0 if randf() < 0.5 else 1.0

	var col := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = 2.0 * float(def.get("scale", 1.15))
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

	add_to_group("enemies")

func _physics_process(delta: float) -> void:
	if _dead or not is_instance_valid(target_ship):
		return

	if shield < max_shield:
		shield = minf(max_shield, shield + max_shield * 0.04 * delta)

	_strafe_phase += delta * 1.35
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
		desired_vel = dir_to_player * move_speed * 0.85
	elif dist > engage_range * 0.58:
		# Strafe orbit around player
		var tangent := dir_to_player.cross(Vector3.UP).normalized() * _strafe_dir
		var vertical := Vector3.UP * sin(_strafe_phase) * 0.35
		desired_vel = (dir_to_player * 0.35 + tangent * 0.85 + vertical).normalized() * move_speed
	else:
		# Break away to prevent ramming lock
		var tangent2 := dir_to_player.cross(Vector3.UP).normalized() * _strafe_dir
		desired_vel = (-dir_to_player * 0.65 + tangent2 * 0.75).normalized() * move_speed

	velocity = velocity.lerp(desired_vel, clampf(delta * 3.0, 0.0, 1.0))
	move_and_slide()

	# Firing logic
	_fire_cd -= delta
	if dist <= engage_range and _fire_cd <= 0.0 and projectiles_root:
		_fire_cd = 1.0 / maxf(0.2, fire_rate)
		_fire_at_player(dir_to_player)

func _fire_at_player(aim_dir: Vector3) -> void:
	var p := Projectile3D.new()
	var muzzle_pos := global_position - global_transform.basis.z * 2.4
	var xform := Transform3D(Basis.looking_at(aim_dir, Vector3.UP), muzzle_pos)
	p.setup(false, "plasma" if enemy_id in ["plasma_hunter", "void_sentinel"] else "laser", attack_damage, 125.0, xform)
	projectiles_root.add_child(p)

func take_weapon_damage(dmg: float) -> void:
	if _dead or dmg <= 0.0:
		return
	var rem := dmg
	if shield > 0.0:
		var absorbed := minf(shield, rem)
		shield -= absorbed
		rem -= absorbed
	hp -= rem
	if hp <= 0.0:
		_die()

func _die() -> void:
	if _dead:
		return
	_dead = true
	AudioManager.play_sfx("explosion", 0.08, 0.9)
	VFXFactory.spawn_explosion(get_parent(), global_position, Color(1.0, 0.45, 0.16), 1.45)

	ShipGrid.add_credits(credit_reward)
	ShipGrid.stats_history["enemies_defeated"] = int(ShipGrid.stats_history.get("enemies_defeated", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("defeat_enemy", 1)

	if chunks_root:
		for _i in range(2):
			var ch := ResourceChunk3D.new()
			var d := Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)).normalized()
			ch.setup(drop_resource, 2, global_position + d * 1.2, d * 8.0)
			chunks_root.add_child(ch)

	defeated.emit(self, global_position)
	queue_free()
