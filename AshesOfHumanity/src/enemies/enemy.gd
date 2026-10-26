extends CharacterBody3D
class_name Enemy
## State-machine mutant AI: vision + hearing perception, navigation, patrol,
## investigation, pursuit, tactical attacks and boss phase mechanics.
## Enemies never attack through walls: sight requires an unoccluded ray.

enum State { IDLE, PATROL, INVESTIGATE, CHASE, ATTACK, FLEE, DEAD }

const MODEL_DIR := "res://assets/models"

var type := "hollow"
var table: Dictionary = {}
var is_boss := false
var state: int = State.IDLE
var hp := 50.0
var max_hp := 50.0
var alive := true
var uid := ""
var model_root: Node3D
var agent: NavigationAgent3D
var agent_ready := false
var _pivots: Dictionary = {}
var _anim_time := 0.0
var _perception_t := 0.0
var _attack_cd := 0.0
var _vocal_cd := 3.0
var _state_t := 0.0
var _patrol_target := Vector3.ZERO
var _last_known := Vector3.ZERO
var _home := Vector3.ZERO
var _bar_bg: MeshInstance3D
var _bar_fill: MeshInstance3D
var _special_cd := 6.0
var _phase := 1
var _burrow_t := 0.0
var _summon_cd := 10.0
var _flash_t := 0.0
var _mesh_mats: Array[StandardMaterial3D] = []

func configure(p_type: String, p_table: Dictionary, boss := false) -> void:
	type = p_type
	table = p_table
	is_boss = boss
	uid = "%s_%d" % [type, get_instance_id()]
	max_hp = table.hp
	hp = max_hp
	collision_layer = 1 << 2
	collision_mask = 1 << 0
	# Radius/capsule tuned per creature bulk.
	var radius := 0.45 * float(table.get("scale", 1.0))
	var height := 1.8 * float(table.get("scale", 1.0))
	if type in ["brute", "boss_iron_abomination"]:
		radius = 0.95
		height = 2.6
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = radius
	cap.height = height
	col.shape = cap
	col.position.y = height * 0.5
	add_child(col)
	# Model
	var packed: PackedScene = load("%s/%s.glb" % [MODEL_DIR, table.model])
	model_root = packed.instantiate()
	model_root.scale = Vector3.ONE * float(table.get("scale", 1.0))
	if type == "crawler":
		model_root.rotation.x = deg_to_rad(35.0)
		model_root.position.y = -0.25
	add_child(model_root)
	_build_rig()
	# Navigation
	agent = NavigationAgent3D.new()
	agent.path_desired_distance = 0.8
	agent.target_desired_distance = 1.3
	agent.radius = radius
	agent.height = height
	agent.avoidance_enabled = true
	agent.path_max_distance = 600.0
	add_child(agent)
	agent.navigation_finished.connect(_on_nav_finished)
	# Health bar
	_build_health_bar(height)
	add_to_group("enemy")
	if is_boss:
		add_to_group("boss")
	GameState.noise_emitted.connect(_on_noise)
	if GameState.killed_enemies.has(uid):
		queue_free()

func _build_rig() -> void:
	for mi in model_root.find_children("*", "MeshInstance3D", true, false):
		var n: String = mi.name
		for key in ["arm_l", "arm_r", "leg_l", "leg_r", "head"]:
			if n.ends_with(key) or n.find("_" + key) >= 0:
				var pivot := Node3D.new()
				pivot.name = "pivot_" + key
				var parent := mi.get_parent()
				var local_t: Transform3D = mi.transform
				parent.add_child(pivot)
				pivot.transform = local_t
				parent.move_child(pivot, mi.get_index())
				mi.reparent(pivot, false)
				mi.transform = Transform3D.IDENTITY
				_pivots[key] = pivot
				break
		# Flash-ready material copies.
		if mi.mesh:
			for surf in mi.mesh.get_surface_count():
				var mat: Material = mi.mesh.surface_get_material(surf)
				if mat is StandardMaterial3D:
					var copy: StandardMaterial3D = mat.duplicate()
					mi.mesh.surface_set_material(surf, copy)
					_mesh_mats.append(copy)

func _build_health_bar(h: float) -> void:
	_bar_bg = MeshInstance3D.new()
	var bg := BoxMesh.new()
	bg.size = Vector3(1.1, 0.12, 0.05)
	bg.material = MaterialLibrary.solid(Color(0.08, 0.05, 0.05), 0.8)
	_bar_bg.mesh = bg
	_bar_bg.position = Vector3(0, h + 0.5, 0)
	_bar_bg.visible = false
	add_child(_bar_bg)
	_bar_fill = MeshInstance3D.new()
	var fill := BoxMesh.new()
	fill.size = Vector3(1.05, 0.08, 0.06)
	fill.material = MaterialLibrary.solid(Color(0.8, 0.2, 0.15), 0.6, 0.0,
		Color(0.6, 0.08, 0.05), 1.2)
	_bar_fill.mesh = fill
	_bar_fill.position = Vector3(0, h + 0.5, 0.03)
	_bar_fill.visible = false
	add_child(_bar_fill)

func _ready() -> void:
	_home = global_position
	_patrol_target = _home
	# Nav map sync happens after world bake; retry until usable.
	await get_tree().physics_frame
	agent_ready = true
	if is_boss:
		GameState.boss_spawned.emit(self)
		AudioMan.play_3d(table.vocal, global_position, 2.0, 0.8)

# ------------------------------------------------------------- perception
func _on_noise(pos: Vector3, radius: float) -> void:
	if not alive:
		return
	if global_position.distance_to(pos) <= radius:
		_last_known = pos
		if state in [State.IDLE, State.PATROL]:
			_switch(State.INVESTIGATE)

func _can_see_player() -> bool:
	var p = GameState.player
	if p == null or not is_instance_valid(p) or not p.is_alive():
		return false
	var eye := global_position + Vector3(0, 1.6, 0)
	var target: Vector3 = p.global_position + Vector3(0, 1.2, 0)
	var to_player: Vector3 = target - eye
	var dist: float = to_player.length()
	if dist > float(table.sight) * Weather.player_visibility_mod():
		return false
	# Field of view check (bosses see all around).
	if float(table.fov) < 350.0:
		var facing := -global_transform.basis.z
		if facing.dot(to_player.normalized()) < cos(deg_to_rad(float(table.fov) * 0.5)):
			return false
	var space := get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(eye, target,
		1 << 0 | 1 << 5)
	q.exclude = [self.get_rid()]
	var hit := space.intersect_ray(q)
	return hit.is_empty() or hit.collider == p

func _perception() -> void:
	var p = GameState.player
	if p and is_instance_valid(p) and p.is_alive():
		if _can_see_player():
			_last_known = p.global_position
			if state != State.ATTACK:
				_switch(State.CHASE)
		elif state == State.CHASE and not _can_see_player():
			_switch(State.INVESTIGATE)

func _switch(new_state: int) -> void:
	if state == new_state:
		return
	state = new_state
	_state_t = 0.0
	match new_state:
		State.INVESTIGATE:
			_vocalize(0.5)
		State.CHASE:
			_vocalize(1.0)
			if type in ["screamer", "watcher"]:
				_alert_pack()
		State.FLEE:
			_vocalize(0.8)

func _vocalize(volume: float) -> void:
	_vocal_cd -= 1.0
	if _vocal_cd <= 0.0:
		AudioMan.play_3d(table.vocal, global_position, -2.0 + volume * 4.0,
			randf_range(0.85, 1.15))
		_vocal_cd = randf_range(4.0, 9.0)

func _alert_pack() -> void:
	for e in get_tree().get_nodes_in_group("enemy"):
		if e != self and is_instance_valid(e) and e.alive \
				and e.global_position.distance_to(global_position) < 30.0:
			e._last_known = global_position
			if e.state in [State.IDLE, State.PATROL, State.INVESTIGATE]:
				e._switch(State.CHASE)

# ----------------------------------------------------------------- updates
func _physics_process(delta: float) -> void:
	if not alive:
		return
	_flash_t = max(0.0, _flash_t - delta)
	if _flash_t <= 0.0:
		for m in _mesh_mats:
			m.albedo_color = m.albedo_color.lerp(Color(1, 1, 1), 0.0)
	_attack_cd = max(0.0, _attack_cd - delta)
	_special_cd = max(0.0, _special_cd - delta)
	_state_t += delta
	_perception_t -= delta
	if _perception_t <= 0.0:
		_perception_t = 0.25
		_perception()
	var p = GameState.player
	var speed_mult := float(table.night_boost) if WorldClock.is_night else 1.0
	speed_mult *= Weather.enemy_aggression_mod()
	match state:
		State.IDLE:
			velocity = velocity.lerp(Vector3.ZERO, delta * 4.0)
			if _state_t > randf_range(2.5, 5.0):
				_pick_patrol()
		State.PATROL:
			_move_toward(_patrol_target, float(table.speed) * 0.35 * speed_mult, delta)
			if global_position.distance_to(_patrol_target) < 2.0:
				_switch(State.IDLE)
		State.INVESTIGATE:
			_move_toward(_last_known, float(table.speed) * 0.7 * speed_mult, delta)
			if global_position.distance_to(_last_known) < 2.0 or _state_t > 9.0:
				_switch(State.IDLE)
		State.CHASE:
			_run_behavior(delta, speed_mult)
		State.ATTACK:
			_face_player(delta)
			if global_position.distance_to(_player_pos()) > float(table.range) + 0.6:
				_switch(State.CHASE)
		State.FLEE:
			if p:
				var away: Vector3 = global_position - p.global_position
				away.y = 0
				_move_toward(global_position + away.normalized() * 12.0,
					float(table.speed) * 1.1, delta)
	move_and_slide()
	_animate(delta)

func _run_behavior(delta: float, speed_mult: float) -> void:
	var p = GameState.player
	if p == null:
		_switch(State.IDLE)
		return
	var dist: float = global_position.distance_to(p.global_position)
	# Ranged / special boss attacks.
	if is_boss:
		_run_boss_behavior(delta, dist)
		return
	match table.behavior:
		"watcher", "screamer":
			# Keep distance; screamers summon help instead of trading hits.
			if dist < 8.0:
				_switch(State.FLEE)
			else:
				_move_toward(_last_known, float(table.speed) * speed_mult, delta)
			if type == "screamer" and _special_cd <= 0.0 and dist < 22.0:
				_special_cd = 12.0
				_scream_summon()
		"aura":
			_move_toward(_last_known, float(table.speed) * speed_mult, delta)
			if dist < 4.5:
				p.apply_radiation(6.0 * delta)
		"burrow":
			_burrow_t -= delta
			if _burrow_t <= 0.0 and dist > 4.0:
				_burrow_reposition()
				_burrow_t = 6.0
			_move_toward(_last_known, float(table.speed) * speed_mult, delta)
		"charge":
			if dist > float(table.range):
				_move_toward(_last_known, float(table.speed) * speed_mult * 1.3, delta)
		_:
			if dist > float(table.range):
				_move_toward(_last_known, float(table.speed) * speed_mult, delta)
	if dist <= float(table.range) + 0.5 and _attack_cd <= 0.0:
		_melee_attack()

func _melee_attack() -> void:
	_switch(State.ATTACK)
	_attack_cd = float(table.attack_cd)
	var p = GameState.player
	# Lunge telegraph.
	var dir: Vector3 = (p.global_position - global_position)
	dir.y = 0
	velocity = dir.normalized() * 5.0
	var timer := get_tree().create_timer(0.28)
	await timer.timeout
	if not alive or not is_instance_valid(p):
		_switch(State.CHASE)
		return
	if global_position.distance_to(p.global_position) <= float(table.range) + 1.0:
		p.take_damage(float(table.damage), "bite", global_position)
		AudioMan.play_3d("impact_flesh", global_position, -2.0)
	_switch(State.CHASE)

func _scream_summon() -> void:
	AudioMan.play_3d("mutant_scream", global_position, 1.5)
	for i in 2:
		var pos := global_position + Vector3(randf_range(-5, 5), 0, randf_range(-5, 5))
		var e: Enemy = MutantFactory.make(["hollow", "crawler"].pick_random())
		get_parent().add_child(e)
		e.global_position = pos
		e._switch(State.CHASE)
		e._last_known = _player_pos()

func _burrow_reposition() -> void:
	var p := _player_pos()
	var angle := randf() * TAU
	var target: Vector3 = p + Vector3(cos(angle), 0, sin(angle)) * 3.5
	model_root.visible = false
	var t := get_tree().create_timer(0.7)
	await t.timeout
	if not alive:
		return
	global_position = Vector3(target.x, WorldGenerator.active.height_at(target.x, target.z),
		target.z)
	model_root.visible = true
	AudioMan.play_3d("mutant_hiss", global_position, -4.0)

# -------------------------------------------------------------------- bosses
func _run_boss_behavior(delta: float, dist: float) -> void:
	var frac := hp / max_hp
	var new_phase := 1 if frac > 0.66 else (2 if frac > 0.33 else 3)
	if new_phase != _phase:
		_phase = new_phase
		_phase_change()
	match table.behavior:
		"boss_signal":
			# Floating caster: orbits and fires projectiles.
			var orbit := _player_pos() + Vector3(
				cos(_anim_time * 0.5) * 10.0, 0, sin(_anim_time * 0.5) * 10.0)
			_move_toward(orbit, float(table.speed), delta)
			if _special_cd <= 0.0 and dist < 40.0:
				_special_cd = lerp(5.0, 2.2, _phase / 3.0)
				_fire_projectile(3 + _phase, Color(0.4, 0.85, 1.0))
		"boss_iron":
			if _special_cd <= 0.0 and dist < 25.0:
				_special_cd = 8.0
				_charge_attack()
			elif dist > float(table.range):
				_move_toward(_last_known, float(table.speed) * 1.2, delta)
		"boss_matriarch":
			if _summon_cd <= 0.0:
				_summon_cd = 14.0 - _phase * 2.0
				_scream_summon()
			if _special_cd <= 0.0 and dist < 20.0:
				_special_cd = 6.0
				_fire_projectile(2, Color(0.5, 0.9, 0.3))
			if dist > float(table.range):
				_move_toward(_last_known, float(table.speed), delta)
		"boss_king":
			if _summon_cd <= 0.0 and _phase >= 2:
				_summon_cd = 16.0
				_scream_summon()
			if dist > float(table.range):
				_move_toward(_last_known,
					float(table.speed) * (1.0 + _phase * 0.12), delta)
	if dist <= float(table.range) and _attack_cd <= 0.0:
		_melee_attack()

func _phase_change() -> void:
	AudioMan.play_3d("boss_roar", global_position, 2.5)
	if GameState.player and SettingsStore.data.camera_shake:
		GameState.player.shake(0.6, 0.5)
	# Partial heal does not happen; speed and aggression rise via phase cd.
	_special_cd = min(_special_cd, 2.0)

func _charge_attack() -> void:
	var p := _player_pos()
	var dir: Vector3 = p - global_position
	dir.y = 0
	velocity = dir.normalized() * 11.0
	AudioMan.play_3d("boss_roar2", global_position, 1.0)
	await get_tree().create_timer(0.8).timeout
	if alive and is_instance_valid(GameState.player) \
			and global_position.distance_to(GameState.player.global_position) < 2.6:
		GameState.player.take_damage(float(table.damage) * 1.2, "slam",
			global_position)
	velocity = Vector3.ZERO

func _fire_projectile(count: int, color: Color) -> void:
	var origin := global_position + Vector3(0, 1.5, 0)
	for i in count:
		var proj := Area3D.new()
		proj.collision_layer = 0
		proj.collision_mask = 1 << 1
		var cs := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = 0.28
		cs.shape = sphere
		proj.add_child(cs)
		var mi := MeshInstance3D.new()
		var bm := SphereMesh.new()
		bm.radius = 0.25
		bm.height = 0.5
		bm.material = MaterialLibrary.solid(color, 0.3, 0.0, color, 2.5)
		mi.mesh = bm
		proj.add_child(mi)
		get_parent().add_child(proj)
		proj.global_position = origin
		var target: Vector3 = _player_pos() + Vector3(randf_range(-1.5, 1.5), 1.0,
			randf_range(-1.5, 1.5))
		var dir: Vector3 = (target - origin).normalized()
		proj.set_meta("velocity", dir * 16.0)
		proj.set_meta("damage", float(table.damage) * 0.6)
		proj.set_meta("ttl", 4.0)
		proj.body_entered.connect(_on_projectile_hit.bind(proj))
		# Travel driver on the enemy node via a small companion script.
		_run_projectile(proj)
	AudioMan.play_3d("mutant_scream", origin, -3.0, 0.7)

func _run_projectile(proj: Area3D) -> void:
	while is_instance_valid(proj):
		var v: Vector3 = proj.get_meta("velocity", Vector3.ZERO)
		proj.global_position += v * get_physics_process_delta_time()
		proj.set_meta("ttl", float(proj.get_meta("ttl", 4.0)) - get_physics_process_delta_time())
		if float(proj.get_meta("ttl", 0.0)) <= 0.0:
			proj.queue_free()
		await get_tree().physics_frame

func _on_projectile_hit(body: Node, proj: Area3D) -> void:
	if body == GameState.player and body.has_method("take_damage"):
		body.take_damage(float(proj.get_meta("damage", 10.0)), "projectile",
			proj.global_position)
		AudioMan.play_3d("impact_flesh", proj.global_position, -4.0)
	proj.queue_free()

# ---------------------------------------------------------------- locomotion
func _pick_patrol() -> void:
	var angle := randf() * TAU
	var radius := randf_range(6.0, 22.0)
	_patrol_target = _home + Vector3(cos(angle), 0, sin(angle)) * radius
	_patrol_target.y = WorldGenerator.active.height_at(_patrol_target.x,
		_patrol_target.z)
	_switch(State.PATROL)

func _move_toward(target: Vector3, speed: float, delta: float) -> void:
	if not agent_ready:
		return
	agent.target_position = target
	var next := agent.get_next_path_position()
	var dir: Vector3 = next - global_position
	dir.y = 0
	if dir.length() > 0.15:
		var normalised := dir.normalized()
		velocity = velocity.lerp(normalised * speed, delta * 6.0)
		_face(normalised, delta)
	else:
		velocity = velocity.lerp(Vector3.ZERO, delta * 6.0)

func _face_player(delta: float) -> void:
	var p = GameState.player
	if p:
		var dir: Vector3 = p.global_position - global_position
		_face(dir, delta)

func _face(dir: Vector3, delta: float) -> void:
	if dir.length() < 0.01:
		return
	var target_y := atan2(dir.x, dir.z)
	rotation.y = lerp_angle(rotation.y, target_y, delta * 8.0)

func _on_nav_finished() -> void:
	if state == State.PATROL:
		_switch(State.IDLE)

func _player_pos() -> Vector3:
	if GameState.player and is_instance_valid(GameState.player):
		return GameState.player.global_position
	return global_position

# ------------------------------------------------------------------- damage
func take_hit(amount: float, hit_point: Vector3, crit := false) -> void:
	if not alive:
		return
	# Head weak point: shots landing in the upper third.
	var head_zone := global_position.y + 1.55 * float(table.get("scale", 1.0))
	if hit_point.y >= head_zone:
		amount *= float(table.weak_head)
		crit = true
	hp -= amount
	_flash_t = 0.12
	for m in _mesh_mats:
		m.albedo_color = Color(2.2, 1.4, 1.2)
	_bar_bg.visible = true
	_bar_fill.visible = true
	_update_bar()
	if is_boss:
		GameState.boss_health_changed.emit(hp / max_hp, self)
	if hp <= 0.0:
		_die(crit)

func _update_bar() -> void:
	var frac: float = clampf(hp / max_hp, 0.0, 1.0)
	_bar_fill.scale.x = frac
	_bar_fill.position.x = -(1.05 * (1.0 - frac)) * 0.5

func _die(crit: bool) -> void:
	alive = false
	state = State.DEAD
	GameState.killed_enemies[uid] = true
	GameState.stats.kills += 1
	if is_boss:
		GameState.stats.bosses += 1
		GameState.boss_died.emit(self)
		QuestMan.notify_event("kill", type)
	else:
		QuestMan.notify_event("kill_type", type)
	GameState.enemy_killed.emit(self)
	GameState.gain_xp(int(table.xp))
	AudioMan.play_3d("impact_flesh", global_position, -2.0, 0.8)
	# Collapse animation then sink.
	collision_layer = 0
	collision_mask = 0
	var tw := create_tween()
	tw.tween_property(model_root, "rotation:x", deg_to_rad(82.0), 0.7)
	tw.parallel().tween_property(self, "position:y",
		global_position.y - 0.6, 0.7)
	tw.tween_interval(4.0)
	tw.tween_property(self, "position:y", global_position.y - 2.2, 2.0)
	tw.tween_callback(queue_free)
	# Loot chance.
	if randf() < (0.85 if is_boss else 0.28):
		var table_id: String = ["house", "factory", "bunker"].pick_random()
		for drop in LootSystem.roll_table(table_id):
			WorldGenerator.active.spawn_pickup(drop.id, drop.count,
				global_position + Vector3(randf_range(-0.6, 0.6), 0.6,
					randf_range(-0.6, 0.6)))
	if is_boss:
		for i in 4:
			var drop: Dictionary = LootSystem.roll_table("supply_drop").pick_random()
			WorldGenerator.active.spawn_pickup(drop.id, drop.count,
				global_position + Vector3(randf_range(-1.2, 1.2), 0.8,
					randf_range(-1.2, 1.2)))

# --------------------------------------------------------------- procedural
func _animate(delta: float) -> void:
	_anim_time += delta
	var speed_ratio := clampf(velocity.length() / max(float(table.speed), 0.1),
		0.0, 1.5)
	var swing := sin(_anim_time * 8.5) * 0.7 * speed_ratio
	if _pivots.has("leg_l"):
		_pivots.leg_l.rotation.x = swing
	if _pivots.has("leg_r"):
		_pivots.leg_r.rotation.x = -swing
	if _pivots.has("arm_l"):
		_pivots.arm_l.rotation.x = -swing * 0.8
	if _pivots.has("arm_r"):
		_pivots.arm_r.rotation.x = swing * 0.8
	if _pivots.has("head"):
		_pivots.head.rotation.y = sin(_anim_time * 1.4) * 0.15
	# Floating boss: hover and spin ring parts.
	if table.behavior == "boss_signal":
		model_root.position.y = 1.2 + sin(_anim_time * 1.6) * 0.25
		for part in model_root.find_children("*ring*", "MeshInstance3D", true, false):
			part.rotation.y += delta * 1.4
			part.rotation.x += delta * 0.5
	if _bar_bg.visible:
		var cam := get_viewport().get_camera_3d()
		if cam:
			_bar_bg.look_at(cam.global_position, Vector3.UP)
			_bar_fill.look_at(cam.global_position, Vector3.UP)
