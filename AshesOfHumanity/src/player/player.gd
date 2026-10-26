extends CharacterBody3D
class_name Survivor
## Professional third/first-person survivor controller with full survival
## vitals, grid inventory, equipment, combat hooks and procedural animation.

signal prompt_changed(text: String)
signal vitals_changed(vitals: Dictionary)
signal health_changed(fraction: float)
signal died
signal notification(text: String)

const WALK_SPEED := 3.4
const SPRINT_SPEED := 6.2
const CROUCH_SPEED := 1.8
const JUMP_VELOCITY := 4.6
const GRAVITY := 16.0

var inventory := GameInventory.new()
var equipment := {
	"weapon_1": {"id": "", "durability": 100.0},
	"weapon_2": {"id": "", "durability": 100.0},
	"armor": {"id": "", "durability": 100.0},
	"tool": {"id": "flashlight", "durability": 100.0},
}
var vitals := {
	"health": 100.0, "hunger": 100.0, "thirst": 100.0,
	"stamina": 100.0, "temperature": 36.8, "radiation": 0.0,
	"infection": 0.0, "fatigue": 0.0, "bleeding": 0.0,
	"fracture": false, "mental": 100.0,
}
var alive := true
var sprinting := false
var crouched := false
var grounded_time := 0.0
var current_interact: Node = null
var model: Node3D
var animator: PlayerAnimator
var cam_rig: CameraRig
var flashlight: Flashlight
var weapons: WeaponHandler
var _step_t := 0.0
var _vital_tick := 0.0
var _surface := "concrete"
var _injury_flash := 0.0
var _weapon_cycle: Array[String] = []

func _ready() -> void:
	add_to_group("player")
	collision_layer = 1 << 1
	collision_mask = 1 << 0 | 1 << 2 | 1 << 4
	_build_collision()
	_build_visuals()
	GameState.register_player(self)
	_starting_kit()
	_refresh_weapon_cycle()
	vitals_changed.emit(vitals)

func _build_collision() -> void:
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.38
	cap.height = 1.75
	col.shape = cap
	col.position.y = 0.95
	add_child(col)

func _build_visuals() -> void:
	var packed: PackedScene = load("res://assets/models/player_survivor.glb")
	model = packed.instantiate()
	add_child(model)
	animator = PlayerAnimator.new()
	add_child(animator)
	animator.setup(model)
	cam_rig = CameraRig.new()
	add_child(cam_rig)
	flashlight = Flashlight.new()
	cam_rig.camera.add_child(flashlight)
	flashlight.position = Vector3(0.15, -0.15, 0)
	flashlight.rotation.x = deg_to_rad(-4)
	weapons = WeaponHandler.new()
	add_child(weapons)
	weapons.setup(self, model)
	weapons.ammo_changed.connect(func(_m, _r): vitals_changed.emit(vitals))
	weapons.weapon_changed.connect(func(_id): vitals_changed.emit(vitals))

func _starting_kit() -> void:
	inventory.add("flashlight", 1)
	inventory.add("radio", 1)
	inventory.add("q_note", 1)
	inventory.add("bandage", 2)
	inventory.add("water_bottle", 1)
	inventory.add("canned_food", 1)
	equipment.weapon_1.id = "w_knife"
	equipment.weapon_1.durability = 100.0
	weapons.equip("w_knife")

# ---------------------------------------------------------------- movement
func _physics_process(delta: float) -> void:
	if not alive:
		move_and_slide()
		return
	if GameState.phase != GameState.PHASE_PLAYING:
		velocity = velocity.lerp(Vector3.ZERO, delta * 5.0)
		move_and_slide()
		return
	_handle_input(delta)
	_apply_gravity(delta)
	move_and_slide()
	_post_move(delta)
	_scan_interactions()
	_tick_vitals(delta)

func _handle_input(delta: float) -> void:
	sprinting = Input.is_action_pressed("sprint") and vitals.stamina > 1.0 \
		and not crouched and Input.get_vector("move_left", "move_right",
			"move_forward", "move_back").length() > 0.1
	crouched = Input.is_action_pressed("crouch")
	var input_dir := Input.get_vector("move_left", "move_right",
		"move_forward", "move_back")
	var direction := (cam_rig.global_transform.basis * Vector3(
		input_dir.x, 0, input_dir.y)).normalized()
	direction.y = 0
	var speed := WALK_SPEED
	if sprinting:
		speed = SPRINT_SPEED
	elif crouched:
		speed = CROUCH_SPEED
	speed *= _fracture_penalty()
	if is_on_floor():
		velocity.x = lerp(velocity.x, direction.x * speed, delta * 10.0)
		velocity.z = lerp(velocity.z, direction.z * speed, delta * 10.0)
	else:
		velocity.x = lerp(velocity.x, direction.x * speed * 0.7, delta * 3.0)
		velocity.z = lerp(velocity.z, direction.z * speed * 0.7, delta * 3.0)
	if Input.is_action_just_pressed("jump") and is_on_floor() and not crouched:
		velocity.y = JUMP_VELOCITY
		AudioMan.play_2d("step_" + _surface, -14.0, 0.9)
	# Stamina.
	if sprinting and direction.length() > 0.1:
		vitals.stamina = max(0.0, vitals.stamina - delta * 18.0)
	else:
		var regen: float = 14.0 * (1.0 - float(vitals.fatigue) / 200.0)
		vitals.stamina = min(100.0, vitals.stamina + delta * regen)
	# Combat input.
	var aiming := Input.is_action_pressed("aim") and _current_weapon_is_ranged()
	cam_rig.set_aim(aiming)
	if Input.is_action_pressed("fire"):
		weapons.try_fire(cam_rig.camera)
	if Input.is_action_pressed("melee") and not _current_weapon_is_ranged():
		weapons.try_fire(cam_rig.camera)
	if Input.is_action_just_pressed("reload"):
		weapons.reload()
	if Input.is_action_just_pressed("flashlight"):
		flashlight.toggle()
	if Input.is_action_just_pressed("med_use"):
		use_best_medicine()
	if Input.is_action_just_pressed("switch_weapon"):
		cycle_weapon()
	for slot in [["weapon_1", 1], ["weapon_2", 2]]:
		if Input.is_action_just_pressed("weapon_%d" % slot[1]):
			var id: String = equipment[slot[0]].id
			if id:
				weapons.equip(id)
	# Rotate body toward camera yaw.
	var target_yaw := cam_rig.yaw
	rotation.y = lerp_angle(rotation.y, target_yaw, delta * 14.0)

func _apply_gravity(delta: float) -> void:
	if is_on_floor():
		velocity.y = -0.5
		grounded_time += delta
	else:
		velocity.y -= GRAVITY * delta

func _post_move(delta: float) -> void:
	GameState.stats.distance_m += velocity.length() * delta
	var speed_ratio := Vector2(velocity.x, velocity.z).length() / SPRINT_SPEED
	animator.animate(delta, speed_ratio * 2.0, crouched,
		Input.is_action_pressed("aim"), sprinting)
	cam_rig.add_bob(speed_ratio * 2.0, delta)
	# Footsteps.
	if is_on_floor() and Vector2(velocity.x, velocity.z).length() > 0.8:
		_step_t -= delta * (1.7 if sprinting else 1.0)
		if _step_t <= 0.0:
			_detect_surface()
			AudioMan.play_2d("step_" + _surface, -8.0 if sprinting else -11.0,
				randf_range(0.92, 1.08))
			GameState.noise_emitted.emit(global_position,
				12.0 if sprinting else 6.0)
			_step_t = 0.48 if sprinting else 0.62

func _detect_surface() -> void:
	var space := get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(
		global_position + Vector3.UP * 0.2,
		global_position + Vector3.DOWN * 1.2, 1 << 0)
	var hit := space.intersect_ray(q)
	if hit.is_empty():
		_surface = "concrete"
		return
	var collider: Node = hit.collider
	var n: String = collider.get_meta("surface", "concrete") if collider.has_meta("surface") else "concrete"
	_surface = n

func _fracture_penalty() -> float:
	return 0.55 if vitals.fracture else 1.0

func is_sprinting() -> bool:
	return sprinting

func is_alive() -> bool:
	return alive

# ------------------------------------------------------------- interactions
func _scan_interactions() -> void:
	var best: Node = null
	var best_d := 2.8
	for node in get_tree().get_nodes_in_group("interactable"):
		if not is_instance_valid(node) or node.has_method("can_interact") \
				and not node.can_interact(self):
			continue
		var d := global_position.distance_to(node.global_position)
		if d < best_d and _has_line_of_sight(node.global_position):
			best = node
			best_d = d
	# Pickups.
	for node in get_tree().get_nodes_in_group("pickup"):
		if not is_instance_valid(node):
			continue
		var d := global_position.distance_to(node.global_position)
		if d < 2.4 and d < best_d:
			best = node
			best_d = d
	if best != current_interact:
		current_interact = best
		if best:
			var text: String = best.prompt_text() if best.has_method("prompt_text") \
				else (best.prompt if "prompt" in best else "Interact")
			prompt_changed.emit(text)
		else:
			prompt_changed.emit("")

func _has_line_of_sight(pos: Vector3) -> bool:
	var space := get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(
		global_position + Vector3.UP, pos + Vector3.UP * 0.5, 1 << 0)
	q.exclude = [get_rid()]
	var hit := space.intersect_ray(q)
	return hit.is_empty() or hit.collider in [self, current_interact]

func unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") and current_interact \
			and is_instance_valid(current_interact):
		if current_interact.has_method("interact"):
			current_interact.interact(self)

# ------------------------------------------------------------------ weapons
func _current_weapon_is_ranged() -> bool:
	var def := ItemDB.get_def(weapons.current_id)
	return def.get("weapon_class", "melee") in ["pistol", "shotgun",
		"rifle", "crossbow"]

func _refresh_weapon_cycle() -> void:
	_weapon_cycle.clear()
	for s in stacks_of_class("weapon"):
		_weapon_cycle.append(s.id)
	for slot in ["weapon_1", "weapon_2"]:
		var id: String = equipment[slot].id
		if id and not id in _weapon_cycle:
			_weapon_cycle.append(id)

func stacks_of_class(cat: String) -> Array:
	var out := []
	for s in inventory.stacks:
		if ItemDB.get_def(s.id).get("category") == cat:
			out.append(s)
	return out

func cycle_weapon() -> void:
	_refresh_weapon_cycle()
	if _weapon_cycle.is_empty():
		return
	var idx: int = _weapon_cycle.find(weapons.current_id)
	var next_id: String = _weapon_cycle[(idx + 1) % _weapon_cycle.size()]
	weapons.equip(next_id)
	notification.emit("Equipped " + ItemDB.display_name(next_id))

func add_camera_recoil(amount: float) -> void:
	cam_rig.add_recoil(amount)
	cam_rig.shake(0.15, amount * 0.5)

func wear_equipment(item_id: String, amount: float) -> void:
	for slot in equipment:
		if equipment[slot].id == item_id:
			equipment[slot].durability = max(0.0,
				float(equipment[slot].durability) - amount)
			if equipment[slot].durability <= 0.0:
				notification.emit(ItemDB.display_name(item_id) + " broke!")
				if slot.begins_with("weapon"):
					equipment[slot].id = ""

# --------------------------------------------------------------- inventory
func inventory_add(item_id: String, count: int = 1) -> int:
	var def := ItemDB.get_def(item_id)
	var weight := float(def.weight) * count
	if not inventory.can_carry(weight):
		QuestMan.toast.emit("Carrying too much weight")
	var left: int = inventory.add(item_id, count)
	vitals_changed.emit(vitals)
	_refresh_weapon_cycle()
	return left

func inventory_remove(item_id: String, count: int) -> int:
	var removed := inventory.remove(item_id, count)
	vitals_changed.emit(vitals)
	return removed

func inventory_count(item_id: String) -> int:
	return inventory.count_of(item_id)

func consume_item(item_id: String) -> bool:
	if inventory.count_of(item_id) <= 0:
		return false
	inventory.remove(item_id, 1)
	return true

# ------------------------------------------------------------- survival API
func take_damage(amount: float, kind: String = "bite", source_pos := Vector3.ZERO) -> void:
	if not alive:
		return
	var armor_reduction := 0.0
	var armor_id: String = equipment.armor.id
	if armor_id:
		armor_reduction = float(ItemDB.get_def(armor_id).get("armor", 0.0))
		equipment.armor.durability = max(0.0,
			float(equipment.armor.durability) - amount * 0.3)
	var final_damage := amount * (1.0 - armor_reduction)
	vitals.health = max(0.0, vitals.health - final_damage)
	_injury_flash = 1.0
	animator.hit_reaction()
	cam_rig.shake(0.3, 0.4)
	AudioMan.play_2d("player_hurt", -4.0)
	match kind:
		"bite", "claw":
			if randf() < 0.25:
				vitals.bleeding = min(100.0, vitals.bleeding + 25.0)
			if randf() < 0.12:
				vitals.infection = min(100.0, vitals.infection + 10.0)
		"slam", "fall":
			if randf() < 0.35:
				vitals.fracture = true
	health_changed.emit(vitals.health / 100.0)
	vitals_changed.emit(vitals)
	if vitals.health <= 0.0:
		_die()

func apply_radiation(amount: float) -> void:
	vitals.radiation = clampf(vitals.radiation + amount, 0.0, 100.0)

func heal(amount: float) -> void:
	vitals.health = min(100.0, vitals.health + amount)
	health_changed.emit(vitals.health / 100.0)

func use_best_medicine() -> void:
	var order := ["medkit", "bandage", "antibiotics", "splint",
		"antirad", "painkillers", "stimulant"]
	for id in order:
		if inventory_count(id) <= 0:
			continue
		var def := ItemDB.get_def(id)
		consume_item(id)
		heal(float(def.get("heal", 0)))
		if def.get("stops_bleed", false):
			vitals.bleeding = 0.0
		if def.get("cures_infection", false):
			vitals.infection = 0.0
		if def.get("cures_fracture", false):
			vitals.fracture = false
		if def.has("rad_cleanse"):
			vitals.radiation = max(0.0, vitals.radiation - float(def.rad_cleanse))
		if def.has("stamina_restore"):
			vitals.stamina = min(100.0,
				vitals.stamina + float(def.stamina_restore))
		AudioMan.play_2d("craft", -6.0)
		QuestMan.notify_event("craft", id)
		notification.emit("Used " + def.name)
		return
	QuestMan.toast.emit("No medical supplies")

func eat(item_id: String) -> void:
	var def := ItemDB.get_def(item_id)
	if not consume_item(item_id):
		return
	vitals.hunger = min(100.0, vitals.hunger + float(def.get("nutrition", 0)))
	vitals.thirst = min(100.0,
		vitals.thirst + float(def.get("hydration", 0)))
	if int(def.get("infection_risk", 0)) > 0 and randf() * 100.0 < float(def.infection_risk):
		vitals.infection = min(100.0, vitals.infection + 15.0)
	AudioMan.play_2d("pickup", -8.0)
	QuestMan.notify_event("craft", item_id)

func shake(strength: float, magnitude: float) -> void:
	cam_rig.shake(strength, magnitude)

func make_noise(radius: float) -> void:
	GameState.noise_emitted.emit(global_position, radius)

# ------------------------------------------------------------- vitals tick
func _tick_vitals(delta: float) -> void:
	_vital_tick += delta
	if _vital_tick < 1.0:
		return
	var d := _vital_tick
	_vital_tick = 0.0
	var survival_mult := 1.0 - 0.03 * (int(GameState.attributes.survival) - 5)
	vitals.hunger = max(0.0, vitals.hunger - 0.16 * d * survival_mult)
	vitals.thirst = max(0.0, vitals.thirst - 0.24 * d * survival_mult)
	vitals.fatigue = min(100.0, vitals.fatigue + 0.08 * d)
	# Ambient temperature vs body.
	var ambient := WorldClock.ambient_temperature()
	vitals.temperature = lerpf(float(vitals.temperature), ambient + 17.0, d * 0.05)
	# Radiation zone exposure.
	var region := RegionData.region_at(global_position)
	if region.id == "wasteland" and Weather.current == Weather.RADIATION:
		apply_radiation(1.2 * d)
	elif region.id in ["wasteland", "exclusion"]:
		apply_radiation(0.25 * d)
	# Consequences.
	if vitals.hunger <= 0.0 or vitals.thirst <= 0.0:
		take_damage(0.9 * d, "starvation")
	if vitals.bleeding > 0.0:
		take_damage((vitals.bleeding / 100.0) * 2.5 * d, "bleed")
		vitals.bleeding = max(0.0, vitals.bleeding - 1.5 * d)
	if vitals.infection >= 100.0:
		take_damage(1.5 * d, "infection")
	elif vitals.infection > 0.0:
		vitals.infection = min(100.0, vitals.infection + 0.15 * d)
	if vitals.radiation >= 80.0:
		take_damage(2.0 * d, "radiation")
	if absf(float(vitals.temperature) - 37.0) > 3.0:
		take_damage(0.8 * d, "temperature")
	if vitals.radiation > 0.0:
		vitals.radiation = max(0.0, vitals.radiation - 0.05 * d)
	vitals_changed.emit(vitals)
	health_changed.emit(vitals.health / 100.0)

func _die() -> void:
	alive = false
	GameState.stats.deaths += 1
	GameState.set_phase(GameState.PHASE_DEAD)
	AudioMan.play_music("death_sting", -6.0)
	died.emit()

# ------------------------------------------------------------------- save
func to_save_dict() -> Dictionary:
	return {
		"position": [global_position.x, global_position.y, global_position.z],
		"rotation_y": rotation.y,
		"vitals": vitals.duplicate(true),
		"inventory": inventory.to_save_dict(),
		"equipment": equipment.duplicate(true),
		"weapon_id": weapons.current_id,
		"mag": weapons.mag,
		"battery": flashlight.battery,
	}

func apply_saved(data: Dictionary) -> void:
	if data.has("vitals"):
		vitals = data.vitals
	if data.has("inventory"):
		inventory.from_save_dict(data.inventory)
	if data.has("equipment"):
		equipment = data.equipment
	if data.has("battery"):
		flashlight.battery = float(data.battery)
	if data.has("weapon_id") and data.weapon_id != "":
		weapons.equip(data.weapon_id)
		weapons.mag = int(data.get("mag", 0))
	vitals_changed.emit(vitals)
