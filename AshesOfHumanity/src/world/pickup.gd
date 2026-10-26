extends RigidBody3D
class_name Pickup
## Physical world pickup: a small labeled box tinted by rarity. Interacting
## transfers the item to the player's grid inventory.

static var _mesh_cache: Dictionary = {}

var item_id := ""
var count := 1
var _life := 0.0
var label: Label3D

static func make(id: String, amount: int = 1) -> Pickup:
	var p := Pickup.new()
	p.item_id = id
	p.count = amount
	return p

func _ready() -> void:
	freeze = true
	collision_layer = 1 << 3
	collision_mask = 1 << 0
	mass = 0.5
	var def := ItemDB.get_def(item_id)
	var size: Vector2 = Vector2(def.get("w", 1), def.get("h", 1))
	var scale_m := clampf(0.18 + 0.06 * size.length(), 0.2, 0.42)
	var mesh_key := item_id
	var mat := StandardMaterial3D.new()
	mat.albedo_color = ItemDB.rarity_color(item_id)
	mat.emission_enabled = true
	mat.emission = ItemDB.rarity_color(item_id) * 0.4
	mat.emission_energy_multiplier = 0.5
	mat.roughness = 0.5
	var bm := BoxMesh.new()
	bm.size = Vector3(scale_m, scale_m, scale_m)
	bm.material = mat
	var mi := MeshInstance3D.new()
	mi.mesh = bm
	add_child(mi)
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = bm.size
	cs.shape = shape
	add_child(cs)
	label = Label3D.new()
	label.text = "%s%s" % [ItemDB.display_name(item_id),
		(" x%d" % count) if count > 1 else ""]
	label.font_size = 28
	label.pixel_size = 0.008
	label.modulate = ItemDB.rarity_color(item_id)
	label.outline_size = 8
	label.position = Vector3(0, scale_m + 0.25, 0)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = false
	add_child(label)
	add_to_group("pickup")
	# Interaction proxy
	var area := Area3D.new()
	area.collision_layer = 0
	area.collision_mask = 1 << 1
	var acs := CollisionShape3D.new()
	var ashape := BoxShape3D.new()
	ashape.size = Vector3(1.8, 1.8, 1.8)
	acs.shape = ashape
	area.add_child(acs)
	area.add_to_group("pickup_area")
	area.set_meta("pickup", self)
	add_child(area)

func _process(delta: float) -> void:
	_life += delta
	rotation.y += delta * 1.4
	if label:
		label.visible = true

func can_interact(_player: Node) -> bool:
	return true

func prompt_text() -> String:
	return "Take %s" % ItemDB.display_name(item_id)

func interact(player: Node) -> void:
	var left: int = player.inventory_add(item_id, count)
	if left <= 0:
		AudioMan.play_2d("pickup", -6.0)
		QuestMan.notify_event("collect", item_id, count)
		queue_free()
	else:
		count = left
		QuestMan.toast.emit("Inventory full")
