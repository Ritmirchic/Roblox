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
	match ThemeHelper.graphics_preset:
		"Low": return 0.45
		"Medium": return 0.75
		"Ultra": return 1.25
	return 1.0

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
	if not parent or not parent.is_inside_tree():
		return
	var root := Node3D.new()
	parent.add_child(root)
	root.global_position = world_pos

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
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	m.material = mat
	p.mesh = m
	root.add_child(p)
	p.emitting = true

	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = 4.5 * scale_mult
	light.omni_range = 18.0 * scale_mult
	root.add_child(light)

	var tw := root.create_tween()
	tw.tween_property(light, "light_energy", 0.0, 0.55)
	tw.tween_interval(0.35)
	tw.tween_callback(root.queue_free)
