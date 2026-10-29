class_name VFXFactory
extends RefCounted

static var _beam_shader: Shader
static var _plume_shader: Shader
static var _shield_shader: Shader
static var _holo_shader: Shader

static func _ensure_shaders() -> void:
	if not _beam_shader:
		_beam_shader = load("res://shaders/energy_beam.gdshader")
	if not _plume_shader:
		_plume_shader = load("res://shaders/thruster_plume.gdshader")
	if not _shield_shader:
		_shield_shader = load("res://shaders/shield_bubble.gdshader")
	if not _holo_shader:
		_holo_shader = load("res://shaders/holo_screen.gdshader")

static func get_particle_scale() -> float:
	# Профиль качества живёт в ThemeHelper: раньше здесь был собственный match
	# с несуществующим пресетом «Ultra», из-за чего «High» получал базовую
	# плотность частиц вместо максимальной.
	return ThemeHelper.quality_float("particles")


static func glow_material(color: Color, alpha: float = 1.0, additive: bool = true) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	# Значения выше 1.0 попадают в HDR-порог свечения, и трассеры/вспышки
	# начинают светиться по-настоящему, а не оставаться плоскими пятнами.
	m.albedo_color = Color(color.r, color.g, color.b, alpha) * 2.4
	if additive:
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func emissive_hdr(color: Color, energy: float = 2.2) -> StandardMaterial3D:
	## Lit surface that still blooms: engine bells, beacons, portal rims.
	var m := StandardMaterial3D.new()
	m.albedo_color = color.darkened(0.35)
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	m.metallic = 0.4
	m.roughness = 0.35
	return m


static func collect_mesh_instances(root: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	var stack: Array[Node] = [root]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		if n is MeshInstance3D:
			out.append(n as MeshInstance3D)
		for c in n.get_children():
			stack.append(c)
	return out


static func tune_glb_materials(root: Node, metallic_boost: float = 0.0,
		roughness_target: float = -1.0, glow: bool = false) -> void:
	## Imported GLB materials carry whatever the exporter wrote. One pass over the
	## instance gives every module the same specular language, which is what makes
	## a grid-built ship read as a single hull instead of a pile of blocks.
	if root == null:
		return
	for mi in collect_mesh_instances(root):
		var mat := mi.get_active_material(0) as StandardMaterial3D
		if mat == null:
			continue
		if metallic_boost != 0.0:
			mat.metallic = clampf(mat.metallic + metallic_boost, 0.0, 1.0)
		if roughness_target >= 0.0:
			mat.roughness = clampf(roughness_target, 0.05, 1.0)
		if glow:
			mat.emission_enabled = true
			if mat.emission.r + mat.emission.g + mat.emission.b < 0.02:
				mat.emission = mat.albedo_color
				mat.emission_energy_multiplier = 0.4
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON


static func make_hull_seam_mesh(size: Vector3, color: Color = Color(0.24, 0.74, 1.0),
		intensity: float = 1.15) -> MeshInstance3D:
	## One additive box per hull cell paints glowing panel seams on every face,
	## which is what stops a grid-built hull from reading as bare cubes.
	if not ResourceLoader.exists("res://shaders/hull_seam.gdshader"):
		return null
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size * 1.02
	mi.mesh = box
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/hull_seam.gdshader")
	mat.set_shader_parameter("seam_color", Vector3(color.r, color.g, color.b))
	mat.set_shader_parameter("intensity", intensity)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi


static func spawn_impact_ring(parent: Node, world_pos: Vector3, color: Color, radius: float = 2.2, life: float = 0.34) -> void:
	## Ударная волна: расходящееся кольцо с затуханием — главный читаемый отклик
	## на попадание (без него бой выглядит как «красные точки»).
	if parent == null or not parent.is_inside_tree():
		return
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.86
	torus.outer_radius = 1.0
	torus.rings = 20
	torus.ring_segments = 6
	ring.mesh = torus
	var mat := glow_material(color, 0.85)
	ring.material_override = mat
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# TorusMesh уже лежит в плоскости XZ — кольцо ударной волны не нужно
	# поворачивать, и никакой look_at с вырожденным up-вектором не требуется.
	ring.scale = Vector3.ONE * maxf(0.15, radius * 0.35)
	parent.add_child(ring)
	ring.global_position = world_pos
	var tw := ring.create_tween()
	tw.set_parallel(true)
	tw.tween_property(ring, "scale", Vector3.ONE * radius * 2.6, life).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_method(func(a: float): mat.albedo_color = Color(color.r, color.g, color.b, a) * 2.15, 0.85, 0.0, life)
	tw.chain().tween_callback(ring.queue_free)


static func spawn_debris_burst(parent: Node, world_pos: Vector3, color: Color, amount: int, speed: float) -> void:
	## Короткий россыпной залп осколков: одна CPUParticles3D вместо N узлов,
	## чтобы россыпь не стоила сцене ни одного лишнего узла в дереве.
	if parent == null or not parent.is_inside_tree() or amount <= 0:
		return
	var p := CPUParticles3D.new()
	p.amount = amount
	p.lifetime = 1.35
	p.one_shot = true
	p.explosiveness = 1.0
	p.spread = 180.0
	p.initial_velocity_min = speed * 0.55
	p.initial_velocity_max = speed
	p.damping_min = 1.4
	p.damping_max = 2.6
	p.gravity = Vector3.ZERO
	var shard := BoxMesh.new()
	shard.size = Vector3(0.16, 0.16, 0.5)
	shard.material = glow_material(color.darkened(0.15), 1.0, false)
	p.mesh = shard
	p.emitting = true
	var root := Node3D.new()
	root.name = "DebrisBurst"
	parent.add_child(root)
	root.global_position = world_pos
	root.add_child(p)
	var tw := root.create_tween()
	tw.tween_interval(1.6)
	tw.tween_callback(root.queue_free)

static func create_beam_node(color: Color, radius: float = 0.09) -> MeshInstance3D:
	_ensure_shaders()
	var mi := MeshInstance3D.new()
	var cyl_mesh := CylinderMesh.new()
	cyl_mesh.top_radius = radius * 0.85
	cyl_mesh.bottom_radius = radius
	cyl_mesh.height = 1.0
	cyl_mesh.radial_segments = 10
	mi.mesh = cyl_mesh
	var mat := ShaderMaterial.new()
	mat.shader = _beam_shader
	mat.set_shader_parameter("beam_color", color)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.visible = false
	return mi

static func update_beam_between(beam_mesh: MeshInstance3D, from_world: Vector3, to_world: Vector3) -> void:
	var diff := to_world - from_world
	var dist := diff.length()
	if dist < 0.05:
		beam_mesh.visible = false
		return
	beam_mesh.visible = true
	var mid := (from_world + to_world) * 0.5
	var up_dir := diff / dist
	var ref := Vector3.UP if absf(up_dir.dot(Vector3.UP)) < 0.95 else Vector3.RIGHT
	var x_axis := up_dir.cross(ref).normalized()
	var z_axis := x_axis.cross(up_dir).normalized()
	beam_mesh.global_transform = Transform3D(
		Basis(x_axis, up_dir * dist, z_axis),
		mid
	)

static func create_thruster_plume(radius: float = 0.42, length: float = 2.4) -> MeshInstance3D:
	_ensure_shaders()
	var mi := MeshInstance3D.new()
	var cone := CylinderMesh.new()
	cone.top_radius = radius
	cone.bottom_radius = 0.03
	cone.height = length
	cone.radial_segments = 12
	mi.mesh = cone
	var mat := ShaderMaterial.new()
	mat.shader = _plume_shader
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# Orient along +Z exhaust
	mi.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	mi.position = Vector3(0.0, 0.0, 0.85 + length * 0.45)
	return mi

static func create_shield_bubble(radius: float = 3.8) -> MeshInstance3D:
	_ensure_shaders()
	var mi := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = radius
	sph.height = radius * 2.0
	sph.radial_segments = 24
	sph.rings = 14
	mi.mesh = sph
	var mat := ShaderMaterial.new()
	mat.shader = _shield_shader
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi

static func create_holo_panel(size: Vector2, color: Color) -> MeshInstance3D:
	_ensure_shaders()
	var mi := MeshInstance3D.new()
	var qm := QuadMesh.new()
	qm.size = size
	mi.mesh = qm
	var mat := ShaderMaterial.new()
	mat.shader = _holo_shader
	mat.set_shader_parameter("holo_color", color)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi

static func create_continuous_sparks(color: Color = Color(1.0, 0.65, 0.18)) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = maxi(4, int(round(12.0 * get_particle_scale())))
	p.lifetime = 0.45
	p.explosiveness = 0.25
	p.spread = 140.0
	p.initial_velocity_min = 2.0
	p.initial_velocity_max = 6.5
	p.gravity = Vector3.ZERO
	var box := BoxMesh.new()
	box.size = Vector3(0.08, 0.08, 0.22)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	box.material = mat
	p.mesh = box
	p.emitting = false
	return p

static func spawn_explosion(parent: Node, world_pos: Vector3, color: Color = Color(1.0, 0.52, 0.15), scale_mult: float = 1.0) -> void:
	if parent == null or not parent.is_inside_tree():
		return
	var with_lights := ThemeHelper.quality_bool("lights")
	var debris_mult := ThemeHelper.quality_float("debris")
	var root := Node3D.new()
	root.name = "Explosion"
	parent.add_child(root)
	root.global_position = world_pos

	spawn_impact_ring(root, world_pos, color.lightened(0.35), 5.4 * scale_mult, 0.42)
	spawn_debris_burst(root, world_pos, color, maxi(4, int(round(14.0 * scale_mult * debris_mult))), 26.0 * scale_mult)

	var p := CPUParticles3D.new()
	p.amount = maxi(8, int(round(26.0 * get_particle_scale() * scale_mult)))
	p.lifetime = 0.75
	p.one_shot = true
	p.explosiveness = 0.95
	p.spread = 180.0
	p.initial_velocity_min = 6.0 * scale_mult
	p.initial_velocity_max = 22.0 * scale_mult
	p.damping_min = 8.0
	p.damping_max = 14.0
	p.gravity = Vector3.ZERO

	var m := BoxMesh.new()
	m.size = Vector3.ONE * (0.28 * scale_mult)
	# Вспышка должна попадать в HDR-порог, иначе glow-проход её игнорирует.
	m.material = glow_material(color, 1.0, false)
	p.mesh = m
	root.add_child(p)
	p.emitting = true

	if with_lights and ThemeHelper.quality_int("vfx_lights") > 0:
		var light := OmniLight3D.new()
		light.light_color = color
		light.light_energy = 5.2 * scale_mult
		light.omni_range = 19.0 * scale_mult
		light.shadow_enabled = false
		root.add_child(light)
		var lt := light.create_tween()
		lt.tween_property(light, "light_energy", 0.0, 0.5).set_ease(Tween.EASE_OUT)

	var tw := root.create_tween()
	tw.tween_interval(0.95)
	tw.tween_callback(root.queue_free)
