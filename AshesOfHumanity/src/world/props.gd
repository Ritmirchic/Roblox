extends Node3D
class_name PropFactory
## Deterministic prop and foliage scattering with collision proxies.
## Exclusion masks keep props off roads, building footprints and landmarks.

static var _scene_cache: Dictionary = {}

static func _instantiate(model_name: String) -> Node3D:
	if not _scene_cache.has(model_name):
		_scene_cache[model_name] = load("res://assets/models/%s.glb" % model_name)
	return (_scene_cache[model_name] as PackedScene).instantiate()

static func add_box_collision(node: Node3D, size: Vector3,
		center := Vector3.ZERO) -> void:
	var body := StaticBody3D.new()
	body.collision_layer = 1 << 0
	body.collision_mask = 0
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	cs.shape = shape
	cs.position = center
	body.add_child(cs)
	node.add_child(body)

static func place(parent: Node3D, model_name: String, pos: Vector3,
		scale := 1.0, rot_y := 0.0, collision_size := Vector3.ZERO,
		collision_center := Vector3.ZERO) -> Node3D:
	var n := _instantiate(model_name)
	n.position = pos
	n.rotation.y = rot_y
	n.scale = Vector3.ONE * scale
	parent.add_child(n)
	if collision_size != Vector3.ZERO:
		add_box_collision(n, collision_size * scale, collision_center)
	return n

static func scatter_nature(parent: Node3D, region: Dictionary,
		rng: RandomNumberGenerator, blocked: Callable,
		terrain_height: Callable) -> int:
	var count := 0
	var center: Vector3 = region.center
	var size: Vector2 = region.size
	var biome: String = region.biome
	var density: int = {"forest": 130, "suburbs": 45, "wasteland": 55,
		"industrial": 25, "city": 12, "exclusion": 30}.get(biome, 40)
	for i in density:
		var x := center.x + rng.randf_range(-size.x / 2.0, size.x / 2.0)
		var z := center.z + rng.randf_range(-size.y / 2.0, size.y / 2.0)
		if blocked.call(Vector3(x, 0, z)):
			continue
		var y: float = terrain_height.call(x, z)
		var roll := rng.randf()
		var pos := Vector3(x, y, z)
		if biome == "forest":
			if roll < 0.55:
				place(parent, "nature_kit", pos, rng.randf_range(0.9, 1.6),
					rng.randf() * TAU, Vector3(0.6, 4.5, 0.6), Vector3(0, 2.0, 0))
			elif roll < 0.8:
				place(parent, "nature_kit", pos, rng.randf_range(0.7, 1.1),
					rng.randf() * TAU, Vector3(1.2, 1.0, 1.2), Vector3(0, 0.5, 0))
			else:
				place(parent, "nature_kit", pos, rng.randf_range(0.8, 1.3),
					rng.randf() * TAU)  # bush, no collision
		elif biome == "wasteland":
			if roll < 0.4:
				place(parent, "nature_kit", pos, rng.randf_range(0.9, 1.5),
					rng.randf() * TAU, Vector3(0.6, 4.0, 0.6), Vector3(0, 2.0, 0))
			elif roll < 0.75:
				place(parent, "nature_kit", pos, rng.randf_range(0.8, 1.3),
					rng.randf() * TAU, Vector3(1.0, 0.9, 1.0), Vector3(0, 0.4, 0))
			else:
				place(parent, "prop_debris", pos, rng.randf_range(0.8, 1.4),
					rng.randf() * TAU)
		elif biome in ["suburbs", "exclusion"]:
			if roll < 0.5:
				place(parent, "nature_kit", pos, rng.randf_range(0.8, 1.3),
					rng.randf() * TAU, Vector3(0.6, 3.6, 0.6), Vector3(0, 1.8, 0))
			elif roll < 0.8:
				place(parent, "prop_debris", pos, rng.randf_range(0.7, 1.2),
					rng.randf() * TAU)
			else:
				place(parent, "nature_kit", pos, rng.randf_range(0.7, 1.0),
					rng.randf() * TAU)
		else:
			if roll < 0.4:
				place(parent, "prop_barrel", pos, rng.randf_range(0.8, 1.1),
					rng.randf() * TAU, Vector3(0.8, 1.2, 0.8), Vector3(0, 0.6, 0))
			elif roll < 0.7:
				place(parent, "prop_debris", pos, rng.randf_range(0.8, 1.3),
					rng.randf() * TAU)
			else:
				place(parent, "nature_kit", pos, rng.randf_range(0.7, 1.0),
					rng.randf() * TAU)
		count += 1
	return count

static func place_streetlights(parent: Node3D, roads: Array,
		terrain_height: Callable) -> void:
	for chain in roads:
		for i in range(0, chain.size() - 1, 2):
			var a: Vector3 = chain[i]
			var b: Vector3 = chain[i + 1]
			var dir := (b - a)
			dir.y = 0
			if dir.length() < 0.1:
				continue
			dir = dir.normalized()
			var side := dir.cross(Vector3.UP)
			for sign_x in [-1.0, 1.0]:
				var p: Vector3 = (a + b) * 0.5 + side * 4.2 * sign_x
				p.y = terrain_height.call(p.x, p.z)
				place(parent, "prop_streetlight", p, 1.0,
					atan2(side.x * sign_x, side.z * sign_x) + PI,
					Vector3(0.3, 6.0, 0.3), Vector3(0, 3.0, 0))

static func place_wrecked_cars(parent: Node3D, rng: RandomNumberGenerator,
		roads: Array, blocked: Callable, terrain_height: Callable) -> void:
	for chain in roads:
		for i in range(0, chain.size() - 1):
			if rng.randf() > 0.45:
				continue
			var a: Vector3 = chain[i]
			var b: Vector3 = chain[i + 1]
			var t := rng.randf()
			var p: Vector3 = a.lerp(b, t)
			var dir := b - a
			var angle := atan2(dir.x, dir.z) + rng.randf_range(-0.4, 0.4)
			var side := Vector3(cos(angle), 0, -sin(angle)) * rng.randf_range(1.8, 3.4)
			var final_p := p + side
			if blocked.call(final_p):
				continue
			final_p.y = terrain_height.call(final_p.x, final_p.z)
			place(parent, "prop_car_wreck", final_p, 1.0, angle,
				Vector3(4.0, 1.6, 1.9), Vector3(0, 0.7, 0))

static func place_camp(parent: Node3D, pos: Vector3) -> void:
	# Survivor safe camp: campfire, barricades, supply crate.
	PropFactory.place(parent, "prop_debris", pos + Vector3(1.5, 0, 1.2),
		1.0, 0.8)
	var tent_mat := MaterialLibrary.solid(Color(0.25, 0.27, 0.22), 0.9)
	var tent := BuildingFactory.box_mesh(Vector3(2.2, 1.5, 2.2), tent_mat)
	tent.position = pos + Vector3(-2.0, 0.75, 0.5)
	tent.rotation.y = 0.6
	parent.add_child(tent)
	BuildingFactory.add_collision(tent, Vector3(2.2, 1.5, 2.2))
	var lc := Interactable.LootContainer.new()
	lc.setup("bunker", "camp_supplies")
	lc.position = pos + Vector3(1.6, 0.4, -1.4)
	parent.add_child(lc)
