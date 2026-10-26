extends Node3D
class_name BuildingFactory
## Parametric, believable architecture: rooms, openings, furniture, damage,
## working doors and precise box collision. Every building is navigable and
## carries location-appropriate loot.

const MODEL_DIR := "res://assets/models"
static var _model_cache: Dictionary = {}

# ------------------------------------------------------------ shared helpers
static func _mat(surface: String, uv: float = 1.0,
		tint: Color = Color.WHITE) -> StandardMaterial3D:
	return MaterialLibrary.pbr(surface, uv, tint)

static func _solid(color: Color, rough := 0.7, metal := 0.0,
		emission := Color(0, 0, 0), energy := 0.0) -> StandardMaterial3D:
	return MaterialLibrary.solid(color, rough, metal, emission, energy)

static func box_mesh(size: Vector3, mat: Material,
		pos: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	bm.material = mat
	mi.mesh = bm
	mi.position = pos
	return mi

static func add_collision(parent: Node3D, size: Vector3,
		pos: Vector3 = Vector3.ZERO) -> void:
	var body := StaticBody3D.new()
	body.collision_layer = 1 << 0
	body.collision_mask = 0
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	cs.shape = shape
	cs.position = pos
	body.add_child(cs)
	parent.add_child(body)

static func model(name: String) -> Node3D:
	if not _model_cache.has(name):
		var packed: PackedScene = load("%s/%s.glb" % [MODEL_DIR, name])
		_model_cache[name] = packed
	var inst: Node3D = (_model_cache[name] as PackedScene).instantiate()
	return inst

# A solid wall with an optional rectangular opening (door or window).
static func wall_segment(parent: Node3D, length: float, height: float,
		thick: float, mat: Material, opening: Dictionary = {}) -> void:
	var has_open := not opening.is_empty()
	if not has_open:
		parent.add_child(box_mesh(Vector3(length, height, thick), mat,
			Vector3(0, height / 2.0, 0)))
		add_collision(parent, Vector3(length, height, thick),
			Vector3(0, height / 2.0, 0))
		return
	var ow: float = opening.get("width", 1.0)
	var oh: float = opening.get("height", 2.1)
	var bottom: float = opening.get("bottom", 0.0)
	var side_w := (length - ow) / 2.0
	for sign_x in [-1.0, 1.0]:
		var sx: float = sign_x * (ow / 2.0 + side_w / 2.0)
		parent.add_child(box_mesh(Vector3(side_w, height, thick), mat,
			Vector3(sx, height / 2.0, 0)))
		add_collision(parent, Vector3(side_w, height, thick),
			Vector3(sx, height / 2.0, 0))
	if bottom > 0.0:
		parent.add_child(box_mesh(Vector3(ow, bottom, thick + 0.04), mat,
			Vector3(0, bottom / 2.0, 0)))
		add_collision(parent, Vector3(ow, bottom, thick + 0.04),
			Vector3(0, bottom / 2.0, 0))
	var top_h := height - (bottom + oh)
	if top_h > 0.05:
		parent.add_child(box_mesh(Vector3(ow, top_h, thick), mat,
			Vector3(0, bottom + oh + top_h / 2.0, 0)))
		add_collision(parent, Vector3(ow, top_h, thick),
			Vector3(0, bottom + oh + top_h / 2.0, 0))

static func make_door(width := 1.1, height := 2.2, locked := false,
		wood := true) -> Interactable.Door:
	var door := Interactable.Door.new()
	door.setup(locked)
	var hinge := Node3D.new()
	hinge.name = "Hinge"
	hinge.position = Vector3(-width / 2.0, 0, 0)
	door.add_child(hinge)
	var body := StaticBody3D.new()
	body.name = "DoorBody"
	body.collision_layer = 1 << 0
	body.collision_mask = 0
	var panel_mat := _mat("wood", 1.0) if wood else _mat("metal_panel", 1.0)
	var panel := box_mesh(Vector3(width, height, 0.08), panel_mat,
		Vector3(width / 2.0, height / 2.0, 0))
	body.add_child(panel)
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(width, height, 0.1)
	cs.shape = shape
	cs.position = Vector3(width / 2.0, height / 2.0, 0)
	body.add_child(cs)
	hinge.add_child(body)
	door.hinge = hinge
	# Frame
	var frame_mat := _mat("rust_metal", 1.0)
	var f1 := box_mesh(Vector3(0.12, height + 0.2, 0.18), frame_mat,
		Vector3(-width / 2.0 - 0.06, (height + 0.2) / 2.0, 0))
	var f2 := box_mesh(Vector3(0.12, height + 0.2, 0.18), frame_mat,
		Vector3(width / 2.0 + 0.06, (height + 0.2) / 2.0, 0))
	var f3 := box_mesh(Vector3(width + 0.24, 0.14, 0.18), frame_mat,
		Vector3(0, height + 0.07, 0))
	door.add_child(f1)
	door.add_child(f2)
	door.add_child(f3)
	add_collision(door, Vector3(0.12, height + 0.2, 0.18),
		Vector3(-width / 2.0 - 0.06, (height + 0.2) / 2.0, 0))
	add_collision(door, Vector3(0.12, height + 0.2, 0.18),
		Vector3(width / 2.0 + 0.06, (height + 0.2) / 2.0, 0))
	return door

static func add_ceiling_light(parent: Node3D, pos: Vector3,
		powered: bool) -> void:
	var lamp_energy := 2.2 if powered else 0.0
	var lamp_mat := _solid(Color(0.9, 0.88, 0.75), 0.3, 0.0,
		Color(1.0, 0.85, 0.6), lamp_energy)
	var lamp := box_mesh(Vector3(0.7, 0.12, 0.25), lamp_mat, pos)
	parent.add_child(lamp)
	if powered:
		var light := OmniLight3D.new()
		light.light_energy = 1.1
		light.omni_range = 9.0
		light.light_color = Color(1.0, 0.86, 0.65)
		light.shadow_enabled = false
		light.position = pos + Vector3(0, -0.2, 0)
		parent.add_child(light)

static func _prop(parent: Node3D, prop_name: String, pos: Vector3,
		scale := 1.0, rot_y := 0.0) -> Node3D:
	var p := model(prop_name)
	p.position = pos
	p.rotation.y = rot_y
	p.scale = Vector3.ONE * scale
	parent.add_child(p)
	return p

static func add_loot_container(parent: Node3D, table: String,
		container_id: String, pos: Vector3, style := "crate") -> void:
	var node: Node3D
	match style:
		"locker":
			node = _prop(parent, "prop_furniture", pos, 0.55)
		"industrial":
			node = _prop(parent, "prop_industrial", pos, 0.5)
		_:
			node = _prop(parent, "prop_crate", pos, 0.9)
	var lc := Interactable.LootContainer.new()
	lc.setup(table, container_id)
	lc.position = pos
	lc.prompt = "Search " + style.capitalize()
	parent.add_child(lc)
	if node:
		node.set_meta("loot_visual", true)

# ------------------------------------------------------------- presets
const PRESETS := {
	"house": {"w": 9.0, "d": 7.5, "h": 3.1, "floors": 1, "wall": "brick",
		"roof": "pitched", "rooms": 2, "loot": "house", "damage": 0.35,
		"props": 4, "light_chance": 0.4},
	"shop": {"w": 10.0, "d": 8.0, "h": 3.4, "floors": 1, "wall": "concrete",
		"roof": "flat", "rooms": 1, "loot": "house", "damage": 0.4,
		"props": 5, "light_chance": 0.3},
	"garage": {"w": 7.5, "d": 6.5, "h": 3.0, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 1, "loot": "factory",
		"damage": 0.45, "props": 3, "light_chance": 0.2},
	"clinic": {"w": 11.0, "d": 8.0, "h": 3.4, "floors": 1,
		"wall": "concrete", "roof": "flat", "rooms": 4, "loot": "pharmacy",
		"damage": 0.3, "props": 5, "light_chance": 0.5},
	"cabin": {"w": 6.5, "d": 5.5, "h": 2.8, "floors": 1, "wall": "wood",
		"roof": "pitched", "rooms": 1, "loot": "cabin", "damage": 0.3,
		"props": 3, "light_chance": 0.2},
	"outpost": {"w": 8.0, "d": 6.0, "h": 3.0, "floors": 1,
		"wall": "wood", "roof": "flat", "rooms": 2, "loot": "cabin",
		"damage": 0.25, "props": 4, "light_chance": 0.4},
	"warehouse": {"w": 16.0, "d": 11.0, "h": 5.0, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 1,
		"loot": "factory", "damage": 0.4, "props": 7, "light_chance": 0.3},
	"factory": {"w": 18.0, "d": 13.0, "h": 6.5, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 2,
		"loot": "factory", "damage": 0.45, "props": 8, "light_chance": 0.35},
	"chemical_plant": {"w": 15.0, "d": 11.0, "h": 5.5, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 1,
		"loot": "factory", "damage": 0.5, "props": 8, "light_chance": 0.3},
	"apartment": {"w": 13.0, "d": 10.0, "h": 8.5, "floors": 2,
		"wall": "concrete", "roof": "flat", "rooms": 4, "loot": "house",
		"damage": 0.5, "props": 8, "light_chance": 0.35},
	"hospital": {"w": 20.0, "d": 12.0, "h": 6.0, "floors": 2,
		"wall": "concrete", "roof": "flat", "rooms": 6,
		"loot": "hospital", "damage": 0.35, "props": 10,
		"light_chance": 0.55},
	"policestation": {"w": 14.0, "d": 10.0, "h": 5.0, "floors": 2,
		"wall": "brick", "roof": "flat", "rooms": 4, "loot": "armory",
		"damage": 0.35, "props": 6, "light_chance": 0.45},
	"supermarket": {"w": 19.0, "d": 13.0, "h": 4.6, "floors": 1,
		"wall": "concrete", "roof": "flat", "rooms": 1,
		"loot": "supermarket", "damage": 0.4, "props": 10,
		"light_chance": 0.5},
	"bunker": {"w": 14.0, "d": 10.0, "h": 3.6, "floors": 1,
		"wall": "concrete", "roof": "flat", "rooms": 5, "loot": "bunker",
		"damage": 0.15, "props": 7, "light_chance": 0.7},
	"checkpoint": {"w": 9.0, "d": 6.0, "h": 3.2, "floors": 1,
		"wall": "concrete", "roof": "flat", "rooms": 1, "loot": "armory",
		"damage": 0.2, "props": 4, "light_chance": 0.6},
	"armory": {"w": 8.0, "d": 6.0, "h": 3.2, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 1,
		"loot": "armory", "damage": 0.2, "props": 3, "light_chance": 0.6},
	"lab": {"w": 13.0, "d": 9.0, "h": 3.6, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 4, "loot": "lab",
		"damage": 0.2, "props": 7, "light_chance": 0.7},
	"parking": {"w": 18.0, "d": 14.0, "h": 4.2, "floors": 1,
		"wall": "concrete", "roof": "flat", "rooms": 0, "loot": "house",
		"damage": 0.5, "props": 6, "light_chance": 0.3},
	"ruin": {"w": 10.0, "d": 8.0, "h": 4.0, "floors": 1,
		"wall": "concrete", "roof": "ruined", "rooms": 1,
		"loot": "wasteland", "damage": 0.75, "props": 3,
		"light_chance": 0.1},
	"tower": {"w": 5.0, "d": 5.0, "h": 7.0, "floors": 2,
		"wall": "wood", "roof": "flat", "rooms": 1, "loot": "cabin",
		"damage": 0.35, "props": 2, "light_chance": 0.3},
	"chimney": {"w": 7.0, "d": 7.0, "h": 9.0, "floors": 1,
		"wall": "metal_panel", "roof": "flat", "rooms": 1,
		"loot": "factory", "damage": 0.5, "props": 4,
		"light_chance": 0.2},
}

static func make_building(btype: String, pos: Vector3, rot_y: float,
		rng: RandomNumberGenerator, id_prefix: String,
		locked: bool = false) -> Node3D:
	var root := Node3D.new()
	root.name = "building_" + btype
	root.set_meta("building_type", btype)
	root.set_meta("loot_table", PRESETS[btype].loot)
	root.position = pos
	root.rotation.y = rot_y
	var p: Dictionary = PRESETS[btype]
	var w: float = p.w
	var d: float = p.d
	var h: float = p.h
	var wall_mat := _mat(p.wall, 3.0)
	var floor_mat := _mat("concrete", 4.0)
	var thick := 0.25
	# Floor slab
	root.add_child(box_mesh(Vector3(w + 0.4, 0.2, d + 0.4), floor_mat,
		Vector3(0, -0.1, 0)))
	add_collision(root, Vector3(w + 0.4, 0.2, d + 0.4), Vector3(0, -0.1, 0))
	# Exterior walls with a door on the south face and windows.
	var door_open := {"width": 1.2, "height": 2.25, "bottom": 0.0}
	var window_open := {"width": 1.6, "height": 1.3, "bottom": 1.05}
	var south := Node3D.new()
	south.position = Vector3(0, 0, -d / 2.0)
	root.add_child(south)
	wall_segment(south, w, h, thick, wall_mat, door_open)
	var north := Node3D.new()
	north.position = Vector3(0, 0, d / 2.0)
	north.rotation.y = PI
	root.add_child(north)
	wall_segment(north, w, h, thick, wall_mat,
		window_open if rng.randf() > p.damage else {})
	var east := Node3D.new()
	east.position = Vector3(w / 2.0, 0, 0)
	east.rotation.y = PI / 2.0
	root.add_child(east)
	wall_segment(east, d, h, thick, wall_mat,
		window_open if rng.randf() > p.damage else {})
	var west := Node3D.new()
	west.position = Vector3(-w / 2.0, 0, 0)
	west.rotation.y = -PI / 2.0
	root.add_child(west)
	wall_segment(west, d, h, thick, wall_mat, {})
	# Door leaf on the south opening.
	var door := make_door(1.15, 2.2, locked, btype in ["cabin", "house"])
	door.position = Vector3(0, 0, -d / 2.0)
	root.add_child(door)
	# Interior partition walls with interior door openings.
	var rooms: int = p.rooms
	if rooms >= 2:
		var part := Node3D.new()
		part.position = Vector3(0, 0, 0.4)
		root.add_child(part)
		wall_segment(part, d - 1.0, h - 0.3, 0.14, wall_mat,
			{"width": 1.0, "height": 2.1, "bottom": 0.0})
		part.rotation.y = PI / 2.0
	if rooms >= 4:
		var part2 := Node3D.new()
		part2.position = Vector3(0.4, 0, 0)
		root.add_child(part2)
		wall_segment(part2, w - 1.0, h - 0.3, 0.14, wall_mat,
			{"width": 1.0, "height": 2.1, "bottom": 0.0})
	# Roof
	_add_roof(root, p, w, d, h, rng)
	# Second floor shell for multi-floor presets.
	if int(p.floors) >= 2:
		root.add_child(box_mesh(Vector3(w + 0.2, 0.2, d + 0.2), floor_mat,
			Vector3(0, h - 0.1, 0)))
		add_collision(root, Vector3(w + 0.2, 0.2, d + 0.2),
			Vector3(0, h - 0.1, 0))
	# Damage: knock a hole and scatter rubble.
	if rng.randf() < p.damage:
		_apply_damage(root, w, d, h, rng)
	# Furniture and props.
	_furnish(root, btype, p, w, d, rng, id_prefix)
	# Ceiling lights.
	if rng.randf() < p.light_chance:
		add_ceiling_light(root, Vector3(0, h - 0.25, 0), true)
	if rng.randf() < p.light_chance * 0.6:
		add_ceiling_light(root, Vector3(w * 0.3, h - 0.25, -d * 0.25), true)
	# Loot containers (at least one, up to three for big sites).
	var containers := 1 + (1 if w > 13.0 else 0) + (1 if rooms >= 4 else 0)
	for i in containers:
		var lx := rng.randf_range(-w * 0.32, w * 0.32)
		var lz := rng.randf_range(-d * 0.32, d * 0.32)
		var style := "locker" if btype in ["hospital", "lab", "bunker"] \
			else ("industrial" if btype in ["factory", "warehouse"] else "crate")
		add_loot_container(root, p.loot, "%s_loot_%d" % [id_prefix, i],
			Vector3(lx, 0.35, lz), style)
	root.add_to_group("structure")
	return root

static func _add_roof(root: Node3D, p: Dictionary, w: float, d: float,
		h: float, rng: RandomNumberGenerator) -> void:
	var roof_mat := _mat("rust_metal", 2.0) if p.wall in ["metal_panel",
		"wood"] else _mat("concrete", 2.0)
	match p.roof:
		"flat":
			root.add_child(box_mesh(Vector3(w + 0.5, 0.22, d + 0.5), roof_mat,
				Vector3(0, h + 0.05, 0)))
			add_collision(root, Vector3(w + 0.5, 0.22, d + 0.5),
				Vector3(0, h + 0.05, 0))
		"pitched":
			var ang := deg_to_rad(28.0)
			var half := box_mesh(Vector3(w + 0.5, 0.16, d * 0.72), roof_mat)
			half.rotation.x = ang
			half.position = Vector3(0, h + 0.5, d * 0.28)
			root.add_child(half)
			var half2 := box_mesh(Vector3(w + 0.5, 0.16, d * 0.72), roof_mat)
			half2.rotation.x = -ang
			half2.position = Vector3(0, h + 0.5, -d * 0.28)
			root.add_child(half2)
		"ruined":
			# Partial slab plus exposed rebar-like beams.
			var slab := box_mesh(Vector3(w * 0.55, 0.2, d * 0.5), roof_mat,
				Vector3(-w * 0.18, h + 0.05, d * 0.2))
			root.add_child(slab)
			for i in 3:
				var beam := box_mesh(Vector3(0.08, 0.08, d * 0.8),
					_mat("rust_metal", 1.0),
					Vector3(-w * 0.4 + i * w * 0.35, h + 0.4, 0))
				root.add_child(beam)

static func _apply_damage(root: Node3D, w: float, d: float, h: float,
		rng: RandomNumberGenerator) -> void:
	var rubble := model("prop_debris")
	rubble.position = Vector3(rng.randf_range(-w * 0.35, w * 0.35),
		0.1, rng.randf_range(-d * 0.35, d * 0.35))
	rubble.scale = Vector3.ONE * rng.randf_range(0.8, 1.4)
	rubble.rotation.y = rng.randf() * TAU
	root.add_child(rubble)
	# Scorch decal as a dark thin box on one wall.
	var scorch := box_mesh(Vector3(rng.randf_range(1.0, 2.2),
		rng.randf_range(1.0, 2.0), 0.05),
		_solid(Color(0.06, 0.05, 0.05), 0.95),
		Vector3(rng.randf_range(-w * 0.3, w * 0.3),
			rng.randf_range(0.8, h * 0.7), -d / 2.0 - 0.14))
	root.add_child(scorch)

static func _furnish(root: Node3D, btype: String, p: Dictionary,
		w: float, d: float, rng: RandomNumberGenerator, id_prefix: String) -> void:
	var count: int = p.props
	var placements := [
		Vector3(-w * 0.3, 0, -d * 0.3), Vector3(w * 0.3, 0, -d * 0.3),
		Vector3(-w * 0.3, 0, d * 0.3), Vector3(w * 0.25, 0, d * 0.3),
		Vector3(0, 0, 0), Vector3(-w * 0.15, 0, -d * 0.1),
		Vector3(w * 0.1, 0, d * 0.15), Vector3(-w * 0.35, 0, d * 0.1),
		Vector3(w * 0.35, 0, d * 0.05), Vector3(0.2, 0, -d * 0.35)]
	var prop_pool := ["prop_furniture", "prop_barrel", "prop_shelf",
		"prop_debris", "prop_industrial"]
	for i in mini(count, placements.size()):
		var pick: String
		match btype:
			"factory", "warehouse", "chemical_plant":
				pick = ["prop_industrial", "prop_barrel", "prop_shelf"].pick_random()
			"hospital", "lab", "bunker":
				pick = ["prop_shelf", "prop_furniture", "prop_industrial"].pick_random()
			"supermarket":
				pick = "prop_shelf"
			_:
				pick = prop_pool.pick_random()
		var pos: Vector3 = placements[i] + Vector3(
			rng.randf_range(-0.4, 0.4), 0, rng.randf_range(-0.4, 0.4))
		_prop(root, pick, pos, rng.randf_range(0.7, 1.0),
			rng.randf() * TAU)

# --------------------------------------------------------- bespoke landmarks
static func make_watchtower(pos: Vector3, rot_y: float) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	root.rotation.y = rot_y
	root.set_meta("building_type", "tower")
	var metal := _mat("rust_metal", 1.5)
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			var leg := box_mesh(Vector3(0.18, 6.0, 0.18), metal,
				Vector3(sx * 1.1, 3.0, sz * 1.1))
			root.add_child(leg)
			add_collision(root, Vector3(0.18, 6.0, 0.18),
				Vector3(sx * 1.1, 3.0, sz * 1.1))
	var platform := box_mesh(Vector3(2.8, 0.2, 2.8), _mat("wood", 2.0),
		Vector3(0, 6.0, 0))
	root.add_child(platform)
	add_collision(root, Vector3(2.8, 0.2, 2.8), Vector3(0, 6.0, 0))
	# Ladder
	for i in 12:
		var rung := box_mesh(Vector3(0.5, 0.05, 0.05), metal,
			Vector3(1.15, 0.4 + i * 0.45, -1.1))
		root.add_child(rung)
	# Roof cage
	for sx in [-1.25, 1.25]:
		root.add_child(box_mesh(Vector3(0.1, 1.4, 0.1), metal,
			Vector3(sx, 6.8, -1.25)))
		root.add_child(box_mesh(Vector3(0.1, 1.4, 0.1), metal,
			Vector3(sx, 6.8, 1.25)))
	root.add_child(box_mesh(Vector3(2.7, 0.12, 2.7), metal, Vector3(0, 7.5, 0)))
	add_ceiling_light(root, Vector3(0, 7.2, 0), true)
	root.add_to_group("structure")
	return root

static func make_cooling_tower(pos: Vector3) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	root.set_meta("building_type", "chimney")
	var mat := _mat("concrete", 3.0)
	var cyl := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 3.2
	cm.bottom_radius = 4.2
	cm.height = 13.0
	cm.material = mat
	cm.radial_segments = 18
	cyl.mesh = cm
	cyl.position.y = 6.5
	root.add_child(cyl)
	var body := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var cyl_shape := CylinderShape3D.new()
	cyl_shape.radius = 4.0
	cyl_shape.height = 13.0
	cs.shape = cyl_shape
	cs.position.y = 6.5
	body.add_child(cs)
	root.add_child(body)
	var ring := box_mesh(Vector3(0.4, 0.6, 0.4),
		_solid(Color(0.35, 0.1, 0.08), 0.8, 0.0, Color(0.8, 0.2, 0.05), 1.5),
		Vector3(0, 13.2, 0))
	root.add_child(ring)
	root.add_to_group("structure")
	return root

static func make_shelter_entrance(pos: Vector3) -> Node3D:
	# Underground shelter portal: concrete frame, stairwell going below.
	var root := Node3D.new()
	root.position = pos
	root.set_meta("building_type", "shelter")
	var concrete := _mat("concrete", 2.5)
	root.add_child(box_mesh(Vector3(4.2, 3.2, 0.4), concrete, Vector3(0, 1.6, 0)))
	add_collision(root, Vector3(4.2, 3.2, 0.4), Vector3(0, 1.6, 0))
	root.add_child(box_mesh(Vector3(0.4, 3.2, 2.6), concrete,
		Vector3(-1.9, 1.6, 1.3)))
	root.add_child(box_mesh(Vector3(0.4, 3.2, 2.6), concrete,
		Vector3(1.9, 1.6, 1.3)))
	add_collision(root, Vector3(0.4, 3.2, 2.6), Vector3(-1.9, 1.6, 1.3))
	add_collision(root, Vector3(0.4, 3.2, 2.6), Vector3(1.9, 1.6, 1.3))
	for i in 8:
		root.add_child(box_mesh(Vector3(2.6, 0.12, 0.5), concrete,
			Vector3(0, -0.05 - i * 0.28, 0.5 + i * 0.32)))
	var door := make_door(1.4, 2.4, false, false)
	door.position = Vector3(0, 0, 2.4)
	root.add_child(door)
	add_ceiling_light(root, Vector3(0, 2.7, 1.2), true)
	root.add_to_group("structure")
	return root

static func make_crater(pos: Vector3, radius: float) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	root.set_meta("building_type", "crater")
	var rim := MeshInstance3D.new()
	var tm := TorusMesh.new()
	tm.inner_radius = radius * 0.78
	tm.outer_radius = radius
	tm.material = _mat("scorched", 12.0)
	rim.mesh = tm
	rim.rotation.x = PI / 2.0
	rim.position.y = 0.15
	root.add_child(rim)
	# Toxic pool in the middle.
	var pool := MeshInstance3D.new()
	var dm := CylinderMesh.new()
	dm.top_radius = radius * 0.6
	dm.bottom_radius = radius * 0.6
	dm.height = 0.1
	dm.material = MaterialLibrary.toxic_water()
	pool.mesh = dm
	pool.position.y = -1.2
	root.add_child(pool)
	root.add_to_group("structure")
	return root
