extends Node3D
class_name Interactable
## Base class for everything the player can target with [E]: doors, loot,
## pickups, quest triggers, workstations, radio consoles.

signal interacted(player: Node)

@export var prompt := "Interact"
@export var interact_id := ""
@export var one_shot := false
var _used := false
var _area: Area3D

func _ready() -> void:
	_build_area()
	add_to_group("interactable")

func _build_area() -> void:
	_area = Area3D.new()
	_area.collision_layer = 0
	_area.collision_mask = 1 << 1  # player layer
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.2, 2.4, 2.2)
	shape.shape = box
	_area.add_child(shape)
	add_child(_area)

func can_interact(player: Node) -> bool:
	return not (one_shot and _used)

func interact(player: Node) -> void:
	_used = true
	interacted.emit(player)
	AudioMan.play_2d("ui_click", -12.0)


class Door extends Node3D:
	@export var is_locked := false
	var open_amount := 0.0
	var target := 0.0
	var hinge: Node3D

	func setup(locked := false) -> void:
		is_locked = locked
		add_to_group("interactable")
		var area := Area3D.new()
		area.collision_layer = 0
		area.collision_mask = 1 << 1
		var cs := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(2.0, 2.6, 2.0)
		cs.shape = box
		area.add_child(cs)
		add_child(area)

	func prompt_text() -> String:
		return "Unlock" if is_locked else ("Close" if target > 0.5 else "Open")

	func can_interact(_player: Node) -> bool:
		return true

	func interact(player: Node) -> void:
		if is_locked:
			if player.inventory_count("q_bunker_key") > 0 or player.inventory_count("lockpick") > 0:
				is_locked = false
				QuestMan.toast.emit("The lock gives way.")
			else:
				QuestMan.toast.emit("Locked. You need a keycard or lockpick.")
				return
		target = 1.0 if target < 0.5 else 0.0
		AudioMan.play_3d("door_creak", global_position, -6.0)

	func _process(delta: float) -> void:
		open_amount = move_toward(open_amount, target, delta * 1.6)
		if hinge:
			hinge.rotation.y = deg_to_rad(-100.0) * open_amount
			var body := hinge.get_node_or_null("DoorBody")
			if body is StaticBody3D:
				# Doors become non-blocking while open so nav/traversal works.
				body.process_mode = Node.PROCESS_MODE_INHERIT
				body.visible = true


class LootContainer extends Interactable:
	var loot_table_id := "house"
	var container_id := ""
	var opened := false
	var lid: Node3D

	func setup(table_id: String, id: String) -> void:
		loot_table_id = table_id
		container_id = id
		prompt = "Search"
		interact_id = "loot:" + id
		if GameState.looted_containers.has(id):
			opened = true

	func can_interact(_player: Node) -> bool:
		return not opened

	func interact(player: Node) -> void:
		if opened:
			return
		opened = true
		GameState.looted_containers[container_id] = true
		GameState.stats.containers_looted += 1
		var drops := LootSystem.roll_table(loot_table_id)
		for drop in drops:
			WorldGenerator.active.spawn_pickup(drop.id, drop.count,
				global_position + Vector3(randf_range(-0.4, 0.4), 0.9,
					randf_range(-0.4, 0.4)))
		if lid:
			var tw := create_tween()
			tw.tween_property(lid, "rotation:x", deg_to_rad(-65.0), 0.4)
		AudioMan.play_2d("pickup", -8.0)
		QuestMan.notify_event("investigate", container_id)
		interacted.emit(player)


class Workstation extends Interactable:
	var station_kind := "workbench"

	func setup(kind: String) -> void:
		station_kind = kind
		prompt = "Use %s" % kind.capitalize()
		interact_id = "station:" + kind

	func interact(player: Node) -> void:
		interacted.emit(player)
		UIRouter.open("CraftingUI", {"station": station_kind})


class QuestTrigger extends Interactable:
	var trigger_target := ""

	func setup(target: String, label: String) -> void:
		trigger_target = target
		prompt = label
		interact_id = "trigger:" + target
		one_shot = false

	func interact(player: Node) -> void:
		QuestMan.notify_event("investigate", trigger_target)
		QuestMan.notify_event("reach", trigger_target)
		interacted.emit(player)
