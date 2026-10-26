extends Node3D
class_name Npc
## A named settlement NPC with a dialogue tree, a readable label and a
## simple idle stance. Interacting opens the DialogueUI.

var npc_id := ""
var display_name := ""
var label: Label3D
var _t := 0.0

static func make(p_id: String, p_name: String) -> Npc:
	var n := Npc.new()
	n.npc_id = p_id
	n.display_name = p_name
	return n

func _ready() -> void:
	add_to_group("interactable")
	_build_body()
	_build_interaction()
	label = Label3D.new()
	label.text = display_name
	label.font_size = 32
	label.pixel_size = 0.009
	label.modulate = Color(0.9, 0.85, 0.7)
	label.outline_size = 10
	label.position = Vector3(0, 2.3, 0)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(label)

func _build_body() -> void:
	var static_body := StaticBody3D.new()
	static_body.collision_layer = 1 << 0
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.4
	cap.height = 1.8
	col.shape = cap
	col.position.y = 0.95
	static_body.add_child(col)
	add_child(static_body)
	# Reuse the survivor model with a tinted material so NPCs read as people.
	if ResourceLoader.exists("res://assets/models/player_survivor.glb"):
		var packed: PackedScene = load("res://assets/models/player_survivor.glb")
		var model := packed.instantiate()
		var tint := StandardMaterial3D.new()
		tint.albedo_color = Color(0.35, 0.4, 0.32)
		tint.roughness = 0.9
		for mi in model.find_children("*", "MeshInstance3D", true, false):
			mi.material_override = tint
		add_child(model)

func _build_interaction() -> void:
	var area := Area3D.new()
	area.collision_layer = 0
	area.collision_mask = 1 << 1
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.4, 2.6, 2.4)
	cs.shape = box
	area.add_child(cs)
	add_child(area)

func can_interact(_player) -> bool:
	return true

func prompt_text() -> String:
	return "Talk to " + display_name

func interact(_player) -> void:
	UIRouter.open("DialogueUI", {"npc": npc_id})
	AudioMan.play_2d("ui_click", -8.0)

func _process(delta: float) -> void:
	_t += delta
	rotation.y += sin(_t * 0.4) * delta * 0.15
