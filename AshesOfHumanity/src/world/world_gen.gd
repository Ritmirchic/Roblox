extends Node3D
class_name WorldGenerator
## Assembles the full connected open world: heightmap terrain, six curated
## regions, road network, architecture, landmarks, props, loot and navigation.

static var active: WorldGenerator

const CHUNK := 64.0
const RES := 1.6
const BOUNDS := Rect2(-330, -360, 700, 760)

var rng := RandomNumberGenerator.new()
var noise: FastNoiseLite
var terrain_root: Node3D
var structure_root: Node3D
var prop_root: Node3D
var enemy_root: Node3D
var pickup_root: Node3D
var marker_root: Node3D
var nav_root: Node3D
var lights: Array[Light3D] = []
var lots: Array[Rect2] = []
var flatten_rects: Array[Dictionary] = []
var road_points: Array[PackedVector3Array] = []
var region_runtime: Array[Dictionary] = []
var spawn_points: Array[Dictionary] = []
var built_structures: Array[Dictionary] = []
var marker_nodes: Dictionary = {}
var _nav_regions: Array[NavigationRegion3D] = []
var generated := false

func _ready() -> void:
	add_to_group("world")
	active = self

# ------------------------------------------------------------- terrain math
func _make_noise(seed: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = seed
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	n.fractal_octaves = 5
	n.frequency = 0.0042
	return n

func height_at(x: float, z: float) -> float:
	var h := noise.get_noise_2d(x, z) * 3.2
	h += noise.get_noise_2d(x * 3.1, z * 3.1) * 0.45
	# Flatten under roads, lots and landmarks.
	for fr in flatten_rects:
		var r: Rect2 = fr.rect
		if r.has_point(Vector2(x, z)):
			h = lerp(h, fr.y, fr.force)
	# Wasteland crater depression.
	var crater := Vector3(-120, 0, 250)
	var d := Vector2(x - crater.x, z - crater.z).length()
	if d < 26.0:
		h -= (26.0 - d) * 0.09
	return h

func _is_blocked(p: Vector3, margin := 2.5) -> bool:
	var pt := Vector2(p.x, p.z)
	for lot in lots:
		if lot.grow(margin).has_point(pt):
			return true
	for chain in road_points:
		for i in chain.size() - 1:
			if _dist_to_segment(pt, Vector2(chain[i].x, chain[i].z),
					Vector2(chain[i + 1].x, chain[i + 1].z)) < 4.2 + margin:
				return true
	return false

static func _dist_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab := b - a
	var t: float = clamp((p - a).dot(ab) / max(ab.length_squared(), 0.001), 0.0, 1.0)
	return p.distance_to(a + ab * t)

# ---------------------------------------------------------------- generation
func generate(seed: int) -> void:
	rng.seed = seed
	noise = _make_noise(seed)
	for child_name in ["terrain", "structures", "props", "enemies",
			"pickups", "markers", "nav"]:
		var n := Node3D.new()
		n.name = child_name
		add_child(n)
	terrain_root = get_node("terrain")
	structure_root = get_node("structures")
	prop_root = get_node("props")
	enemy_root = get_node("enemies")
	pickup_root = get_node("pickups")
	marker_root = get_node("markers")
	nav_root = get_node("nav")
	road_points = RegionData.roads()
	# Flatten road corridors.
	for chain in road_points:
		for i in chain.size() - 1:
			_register_road_flatten(chain[i], chain[i + 1])
	_build_terrain()
	_build_roads()
	_build_regions()
	_build_landmarks()
	_build_safe_camps()
	_scatter_props()
	_build_spawn_points()
	_spawn_initial_enemies()
	_refresh_markers()
	_bake_navigation()
	generated = true
	print("[AoH] World generated: %d structures, %d props, %d spawn points"
		% [structure_root.get_child_count(), prop_root.get_child_count(),
			spawn_points.size()])

func _register_road_flatten(a: Vector3, b: Vector3) -> void:
	var minx: float = min(a.x, b.x) - 4.5
	var maxx: float = max(a.x, b.x) + 4.5
	var minz: float = min(a.z, b.z) - 4.5
	var maxz: float = max(a.z, b.z) + 4.5
	flatten_rects.append({"rect": Rect2(minx, minz, maxx - minx, maxz - minz),
		"y": 0.0, "force": 0.85})

func _build_terrain() -> void:
	var ground := StaticBody3D.new()
	ground.collision_layer = 1 << 0
	ground.collision_mask = 0
	terrain_root.add_child(ground)
	var x0 := BOUNDS.position.x
	var z0 := BOUNDS.position.y
	var chunks_x := int(BOUNDS.size.x / CHUNK)
	var chunks_z := int(BOUNDS.size.y / CHUNK)
	for cx in chunks_x:
		for cz in chunks_z:
			var mesh := ArrayMesh.new()
			var verts := PackedVector3Array()
			var norms := PackedVector3Array()
			var uvs := PackedVector2Array()
			var cols := PackedColorArray()
			var indices := PackedInt32Array()
			var steps := int(CHUNK / RES)
			for iz in steps + 1:
				for ix in steps + 1:
					var wx := x0 + cx * CHUNK + ix * RES
					var wz := z0 + cz * CHUNK + iz * RES
					var wy := height_at(wx, wz)
					verts.append(Vector3(wx - x0 - cx * CHUNK, wy,
						wz - z0 - cz * CHUNK))
					norms.append(Vector3.UP)
					uvs.append(Vector2(wx / 6.0, wz / 6.0))
					cols.append(_biome_tint(wx, wz))
			for iz in steps:
				for ix in steps:
					var a := iz * (steps + 1) + ix
					indices.append(a)
					indices.append(a + steps + 1)
					indices.append(a + 1)
					indices.append(a + 1)
					indices.append(a + steps + 1)
					indices.append(a + steps + 2)
			var arr := Array()
			arr.resize(Mesh.ARRAY_MAX)
			arr[Mesh.ARRAY_VERTEX] = verts
			arr[Mesh.ARRAY_NORMAL] = norms
			arr[Mesh.ARRAY_TEX_UV] = uvs
			arr[Mesh.ARRAY_COLOR] = cols
			arr[Mesh.ARRAY_INDEX] = indices
			mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
			var region := RegionData.region_at(
				Vector3(x0 + cx * CHUNK, 0, z0 + cz * CHUNK))
			var biome: String = region.get("biome", "suburbs")
			mesh.surface_set_material(0, MaterialLibrary.ground_for(biome))
			var mi := MeshInstance3D.new()
			mi.mesh = mesh
			mi.position = Vector3(x0 + cx * CHUNK, 0, z0 + cz * CHUNK)
			ground.add_child(mi)
	# One broad trimesh collision for the terrain.
	var shape := ConcavePolygonShape3D.new()
	var all_faces := PackedVector3Array()
	for mi in ground.get_children():
		var m: ArrayMesh = mi.mesh
		var faces: PackedVector3Array = m.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
		var idx: PackedInt32Array = m.surface_get_arrays(0)[Mesh.ARRAY_INDEX]
		for i in idx:
			all_faces.append(mi.position + faces[i])
	shape.set_faces(all_faces)
	var cs := CollisionShape3D.new()
	cs.shape = shape
	ground.add_child(cs)

func _biome_tint(x: float, z: float) -> Color:
	var r := RegionData.region_at(Vector3(x, 0, z))
	match r.get("biome", "suburbs"):
		"forest":
			return Color(0.42, 0.5, 0.36)
		"industrial":
			return Color(0.48, 0.46, 0.44)
		"city", "exclusion":
			return Color(0.55, 0.55, 0.57)
		"wasteland":
			return Color(0.55, 0.36, 0.3)
		_:
			return Color(0.45, 0.48, 0.38)

func _build_roads() -> void:
	var asphalt := MaterialLibrary.pbr("asphalt", 1.0)
	for chain in road_points:
		var verts := PackedVector3Array()
		var uvs := PackedVector2Array()
		var idx := PackedInt32Array()
		var width := 5.5
		var dist_acc := 0.0
		for i in chain.size():
			var p: Vector3 = chain[i]
			var tangent := Vector3.ZERO
			if i == 0:
				tangent = chain[1] - chain[0]
			elif i == chain.size() - 1:
				tangent = chain[i] - chain[i - 1]
			else:
				tangent = chain[i + 1] - chain[i - 1]
			tangent.y = 0
			tangent = tangent.normalized()
			var side := tangent.cross(Vector3.UP)
			var y := height_at(p.x, p.z) + 0.08
			var left := Vector3(p.x, y, p.z) + side * width * 0.5
			var right := Vector3(p.x, y, p.z) - side * width * 0.5
			verts.append(left)
			verts.append(right)
			uvs.append(Vector2(0, dist_acc / 4.0))
			uvs.append(Vector2(1, dist_acc / 4.0))
			if i < chain.size() - 1:
				dist_acc += p.distance_to(chain[i + 1])
				var b := i * 2
				idx.append(b)
				idx.append(b + 2)
				idx.append(b + 1)
				idx.append(b + 1)
				idx.append(b + 2)
				idx.append(b + 3)
		var mesh := ArrayMesh.new()
		var arr := Array()
		arr.resize(Mesh.ARRAY_MAX)
		arr[Mesh.ARRAY_VERTEX] = verts
		arr[Mesh.ARRAY_TEX_UV] = uvs
		arr[Mesh.ARRAY_INDEX] = idx
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
		mesh.surface_set_material(0, asphalt)
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		terrain_root.add_child(mi)

func _build_regions() -> void:
	for region in RegionData.regions():
		var entry := {"id": region.id, "data": region, "spawned": 0}
		region_runtime.append(entry)
		var center: Vector3 = region.center
		var size: Vector2 = region.size
		var lots_per_region: int = region.buildings.size() + 2
		var idx := 0
		var grid_n := int(ceil(sqrt(lots_per_region))) + 1
		for gx in grid_n:
			for gz in grid_n:
				if idx >= region.buildings.size():
					break
				var lx := (gx - grid_n / 2.0) * 22.0 + rng.randf_range(-3, 3)
				var lz := (gz - grid_n / 2.0) * 20.0 + rng.randf_range(-3, 3)
				var pos := center + Vector3(lx, 0, lz)
				# Keep lots inside region bounds and off roads/landmarks.
				if absf(lx) > size.x * 0.42 or absf(lz) > size.y * 0.42:
					continue
				if _is_blocked(pos, 5.0) or _near_landmark(pos, 9.0):
					continue
				var btype: String = region.buildings[idx]
				idx += 1
				_place_building(region, btype, pos)
		# Extra filler lots so no region feels empty.
		for filler in 3:
			var pos := center + Vector3(
				rng.randf_range(-size.x * 0.4, size.x * 0.4), 0,
				rng.randf_range(-size.y * 0.4, size.y * 0.4))
			if _is_blocked(pos, 5.0) or _near_landmark(pos, 9.0):
				continue
			_place_building(region, region.buildings.pick_random(), pos)

func _place_building(region: Dictionary, btype: String, pos: Vector3) -> void:
	var preset: Dictionary = BuildingFactory.PRESETS[btype]
	var footprint := Vector2(preset.w + 2.0, preset.d + 2.0)
	var lot := Rect2(pos.x - footprint.x / 2.0, pos.z - footprint.y / 2.0,
		footprint.x, footprint.y)
	lots.append(lot)
	flatten_rects.append({"rect": lot, "y": 0.0, "force": 0.95})
	var rot := rng.randf() * TAU
	var locked := btype in ["bunker", "armory", "lab"]
	var building := BuildingFactory.make_building(
		btype, Vector3(pos.x, height_at(pos.x, pos.z), pos.z),
		rot, rng, "%s_%d" % [region.id, structure_root.get_child_count()], locked)
	structure_root.add_child(building)
	# Note: world buildings are seed-deterministic and regenerate on load;
	# player-built structures are tracked separately in GameState.world_buildings.

func _near_landmark(pos: Vector3, radius: float) -> bool:
	for lm in RegionData.landmarks():
		var lp: Vector3 = lm.pos
		if Vector2(pos.x - lp.x, pos.z - lp.z).length() < radius:
			return true
	return false

func _build_landmarks() -> void:
	for lm in RegionData.landmarks():
		var pos: Vector3 = lm.pos
		flatten_rects.append({"rect": Rect2(pos.x - 6, pos.z - 6, 12, 12),
			"y": 0.0, "force": 0.95})
		match lm.id:
			"shelter_exit", "shelter_note":
				if lm.id == "shelter_exit":
					structure_root.add_child(
						BuildingFactory.make_shelter_entrance(
							Vector3(pos.x, height_at(pos.x, pos.z), pos.z)))
			"king_arena":
				_spawn_boss("boss_hollow_king", pos, lm.label)
			"matriarch_arena":
				_spawn_boss("boss_forest_matriarch", pos, lm.label)
			"iron_arena":
				structure_root.add_child(
					BuildingFactory.make_cooling_tower(
						Vector3(pos.x, height_at(pos.x, pos.z), pos.z)))
				_spawn_boss("boss_iron_abomination", pos + Vector3(6, 0, 4),
					lm.label)
			"wasteland_crater":
				structure_root.add_child(
					BuildingFactory.make_crater(
						Vector3(pos.x, height_at(pos.x, pos.z) - 1.0, pos.z),
						22.0))
				_spawn_boss("boss_last_signal", pos + Vector3(0, 0.5, 0),
					lm.label)
			"watchtower_log":
				structure_root.add_child(
					BuildingFactory.make_watchtower(
						Vector3(pos.x, height_at(pos.x, pos.z), pos.z), rng.randf() * TAU))
			"factory_generator":
				_place_workstation(pos, "generator")
			"signal_console":
				_place_workstation(pos, "radio")
			_:
				pass
		# Every landmark gets an interactable trigger (quest reach/investigate).
		var trigger := Interactable.QuestTrigger.new()
		trigger.setup(lm.id, lm.label)
		trigger.position = Vector3(pos.x, height_at(pos.x, pos.z) + 1.0, pos.z)
		marker_root.add_child(trigger)
		# Quest-specific loot containers.
		if lm.id in ["basement_chest", "checkpoint_armory", "overpass_cache"]:
			var table := "armory" if lm.id == "checkpoint_armory" else "house"
			var lc := Interactable.LootContainer.new()
			lc.setup(table, lm.id)
			lc.position = trigger.position
			marker_root.add_child(lc)

func _place_workstation(pos: Vector3, kind: String) -> void:
	var ws := Interactable.Workstation.new()
	ws.setup(kind)
	ws.position = Vector3(pos.x, height_at(pos.x, pos.z) + 1.0, pos.z)
	marker_root.add_child(ws)
	var model := PropFactory.place(marker_root, "prop_industrial",
		ws.position - Vector3(0, 1.0, 0), 0.9, rng.randf() * TAU,
		Vector3(1.6, 1.4, 1.2), Vector3(0, 0.6, 0))
	model.set_meta("workstation", kind)

func _build_safe_camps() -> void:
	for region in RegionData.regions():
		for camp_pos in region.safe_zones:
			flatten_rects.append({
				"rect": Rect2(camp_pos.x - 6, camp_pos.z - 6, 12, 12),
				"y": 0.0, "force": 0.95})
			PropFactory.place_camp(prop_root,
				Vector3(camp_pos.x, height_at(camp_pos.x, camp_pos.z), camp_pos.z))

func _scatter_props() -> void:
	var blocked_cb := Callable(self, "_is_blocked")
	var height_cb := Callable(self, "height_at")
	for region in RegionData.regions():
		PropFactory.scatter_nature(prop_root, region, rng, blocked_cb, height_cb)
	PropFactory.place_wrecked_cars(prop_root, rng, road_points,
		blocked_cb, height_cb)
	PropFactory.place_streetlights(prop_root, road_points, height_cb)

func _build_spawn_points() -> void:
	for region in RegionData.regions():
		var center: Vector3 = region.center
		var size: Vector2 = region.size
		for i in region.enemy_cap + 3:
			var pos := center + Vector3(
				rng.randf_range(-size.x * 0.42, size.x * 0.42), 0,
				rng.randf_range(-size.y * 0.42, size.y * 0.42))
			if _is_blocked(pos, 1.5):
				continue
			var safe := false
			for sp in region.safe_zones:
				if Vector2(pos.x - sp.x, pos.z - sp.z).length() < 18.0:
					safe = true
			if safe:
				continue
			spawn_points.append({"pos": pos, "region": region.id,
				"day": region.enemy_day, "night": region.enemy_night,
				"danger": region.danger})

func _spawn_initial_enemies() -> void:
	for sp in spawn_points:
		if rng.randf() > 0.55:
			continue
		var table: Array = sp.night if WorldClock.is_night else sp.day
		_spawn_enemy(table.pick_random(), sp.pos)

func _spawn_enemy(type: String, pos: Vector3, is_boss := false) -> Node:
	var enemy := MutantFactory.make(type, is_boss)
	enemy.position = Vector3(pos.x, height_at(pos.x, pos.z), pos.z)
	enemy_root.add_child(enemy)
	return enemy

func _spawn_boss(type: String, pos: Vector3, label: String) -> Node:
	var boss := _spawn_enemy(type, pos, true)
	boss.set_meta("boss_label", label)
	return boss

func spawn_pickup(item_id: String, count: int, pos: Vector3) -> void:
	var p := Pickup.make(item_id, count)
	p.position = Vector3(pos.x, max(pos.y, height_at(pos.x, pos.z) + 0.4), pos.z)
	pickup_root.add_child(p)

func spawn_supply_crate(pos: Vector3) -> void:
	var lc := Interactable.LootContainer.new()
	lc.setup("supply_drop", "supply_%d" % Time.get_ticks_msec())
	lc.position = Vector3(pos.x, height_at(pos.x, pos.z) + 0.5, pos.z)
	marker_root.add_child(lc)
	PropFactory.place(marker_root, "prop_crate",
		lc.position - Vector3(0, 0.3, 0), 1.2, 0.0,
		Vector3(1.2, 1.0, 1.2), Vector3(0, 0.5, 0))
	# Beacon light.
	var light := OmniLight3D.new()
	light.light_color = Color(0.4, 0.8, 1.0)
	light.light_energy = 2.5
	light.omni_range = 14.0
	light.position = lc.position + Vector3(0, 2.2, 0)
	marker_root.add_child(light)
	lights.append(light)

func spawn_migration(count: int) -> void:
	if spawn_points.is_empty():
		return
	for i in count:
		var sp: Dictionary = spawn_points.pick_random()
		var table: Array = sp.night if WorldClock.is_night else sp.day
		var pos: Vector3 = sp.pos + Vector3(randf_range(-6, 6), 0, randf_range(-6, 6))
		_spawn_enemy(table.pick_random(), pos)

func assault_base(count: int) -> void:
	var origin: Vector3 = GameState.player.global_position if GameState.player else Vector3.ZERO
	for i in count:
		var pos := origin + Vector3(randf_range(-25, 25), 0, randf_range(-25, 25))
		_spawn_enemy(["hollow", "stalker", "brute"].pick_random(), pos)

func set_lights_enabled(on: bool) -> void:
	for l in lights:
		if is_instance_valid(l):
			l.visible = on

# ------------------------------------------------------------- quest markers
func _refresh_markers() -> void:
	for child in marker_root.get_children():
		if child.has_meta("marker_beam"):
			child.queue_free()
	for qid in QuestMan.active:
		var q := QuestDB.get_quest(qid)
		for ob in q.objectives:
			if ob.type in ["reach", "investigate"]:
				_spawn_marker_beam(ob.target)

func _spawn_marker_beam(target: String) -> void:
	for lm in RegionData.landmarks():
		if lm.id != target:
			continue
		var beam := MeshInstance3D.new()
		var bm := CylinderMesh.new()
		bm.top_radius = 0.18
		bm.bottom_radius = 0.45
		bm.height = 12.0
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.9, 0.55, 0.2, 0.5)
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.emission_enabled = true
		mat.emission = Color(1.0, 0.5, 0.15)
		mat.emission_energy_multiplier = 1.6
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		bm.material = mat
		beam.mesh = bm
		beam.position = Vector3(lm.pos.x,
			height_at(lm.pos.x, lm.pos.z) + 6.0, lm.pos.z)
		beam.set_meta("marker_beam", true)
		marker_root.add_child(beam)

# ------------------------------------------------------------- navigation
func _bake_navigation() -> void:
	for region in RegionData.regions():
		var nr := NavigationRegion3D.new()
		var navmesh := NavigationMesh.new()
		navmesh.cell_size = 0.3
		navmesh.cell_height = 0.3
		navmesh.agent_radius = 0.45
		navmesh.agent_height = 1.9
		navmesh.agent_max_climb = 0.55
		navmesh.agent_max_slope = 50.0
		navmesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS
		navmesh.geometry_source_geometry_mode = NavigationMesh.SOURCE_GEOMETRY_ROOT_NODE_CHILDREN
		var holder := Node3D.new()
		holder.name = "nav_holder_%s" % region.id
		nav_root.add_child(holder)
		holder.add_child(nr)
		# Reparent region-local colliders under the nav region for baking.
		var center: Vector3 = region.center
		var size: Vector2 = region.size
		for body in structure_root.get_children():
			var bp: Vector3 = body.global_position
			if absf(bp.x - center.x) < size.x * 0.55 and absf(bp.z - center.z) < size.y * 0.55:
				structure_root.remove_child(body)
				nr.add_child(body)
		nr.navmesh = navmesh
		_nav_regions.append(nr)
		nr.bake_navigation_mesh()

# ------------------------------------------------------------- save / load
func to_save_dict() -> Dictionary:
	return {"seed": rng.seed, "generated": generated}

func get_buildings_payload() -> Dictionary:
	return {"built": built_structures.duplicate(true)}

func register_built_structure(entry: Dictionary) -> void:
	built_structures.append(entry)
