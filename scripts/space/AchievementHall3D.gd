class_name AchievementHall3D
extends Node3D

signal return_to_hangar

# =============================================================================
# HALL OF ACHIEVEMENTS - a real empty-space 3D room where every earned
# achievement card physically floats around the pilot. Drag to look around,
# scroll to orbit closer, click a card to focus it and read its dossier.
# =============================================================================

const CARD_RADIUS: float = 26.0
const CARD_PLANE: Vector2 = Vector2(4.6, 2.6)

var _cards_root: Node3D
var _cam_pivot: Node3D
var _cam: Camera3D

var _float_time: float = 0.0
var _minute_tick: float = 0.0
var _floating_cards: Array[Dictionary] = []

var _yaw: float = 0.0
var _pitch: float = -0.06
var _orbit_dist: float = 0.0
var _target_orbit_dist: float = 0.0
var _dragging: bool = false
var _focused: int = -1
var _focus_lerp: float = 0.0

var _hud: CanvasLayer
var _hud_root: Control
var _title_lbl: Label
var _sub_lbl: Label
var _counter_lbl: Label
var _hint_lbl: Label
var _dossier: PanelContainer
var _dossier_title: Label
var _dossier_body: Label
var _back_btn: Button

func _ready() -> void:
	AudioManager.play_ambient("amb_space")
	_build_environment()
	_build_camera()
	_build_hud()
	_rebuild_cards()

	L.language_changed.connect(func(_lang: String): _apply_localization())
	AchievementManager.achievements_updated.connect(func(): _rebuild_cards())
	_apply_localization()


func _build_environment() -> void:
	var we := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var smat := ProceduralSkyMaterial.new()
	smat.sky_top_color = Color(0.008, 0.013, 0.032)
	smat.sky_horizon_color = Color(0.02, 0.04, 0.08)
	smat.ground_bottom_color = Color(0.004, 0.008, 0.018)
	smat.ground_horizon_color = Color(0.015, 0.025, 0.05)
	sky.sky_material = smat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.12, 0.16, 0.24)
	env.ambient_light_energy = 1.0
	env.glow_enabled = true
	env.glow_intensity = 0.6
	env.fog_enabled = true
	env.fog_light_color = Color(0.03, 0.05, 0.10)
	env.fog_density = 0.006
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = Color(0.9, 0.95, 1.0)
	sun.light_energy = 1.15
	sun.rotation_degrees = Vector3(-22, 38, 0)
	add_child(sun)

	var key := OmniLight3D.new()
	key.light_color = Color(0.30, 0.72, 1.0)
	key.light_energy = 2.4
	key.omni_range = 60.0
	key.position = Vector3(0, 10, 6)
	add_child(key)

	var stars := CPUParticles3D.new()
	stars.name = "HallStars"
	stars.amount = 420
	stars.lifetime = 14.0
	stars.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	stars.emission_box_extents = Vector3(220, 130, 220)
	stars.gravity = Vector3.ZERO
	stars.initial_velocity_min = 0.02
	stars.initial_velocity_max = 0.16
	var smesh := BoxMesh.new()
	smesh.size = Vector3.ONE * 0.20
	var smat2 := StandardMaterial3D.new()
	smat2.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	smat2.albedo_color = Color(0.82, 0.90, 1.0)
	smesh.material = smat2
	stars.mesh = smesh
	add_child(stars)

	# Nebula haze slabs (real geometry, not a flat background)
	var neb := VFXFactory.create_holo_panel(Vector2(120, 70), Color(0.10, 0.05, 0.20, 0.16))
	neb.position = Vector3(0, 6, -60)
	neb.rotation_degrees = Vector3(0, 18, 0)
	add_child(neb)
	var neb2 := VFXFactory.create_holo_panel(Vector2(90, 54), Color(0.05, 0.16, 0.22, 0.13))
	neb2.position = Vector3(58, 18, -18)
	neb2.rotation_degrees = Vector3(12, -52, 0)
	add_child(neb2)

	# Marble-like dais the cards orbit above
	var dais := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 15.0
	cyl.bottom_radius = 17.5
	cyl.height = 0.6
	var dmat := StandardMaterial3D.new()
	dmat.albedo_color = Color(0.045, 0.075, 0.135)
	dmat.metallic = 0.65
	dmat.roughness = 0.34
	dmat.emission_enabled = true
	dmat.emission = Color(0.06, 0.24, 0.36)
	dmat.emission_energy_multiplier = 0.7
	cyl.material = dmat
	dais.mesh = cyl
	dais.position = Vector3(0, -6.4, 0)
	add_child(dais)

	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 15.4
	torus.outer_radius = 16.2
	var rmat := StandardMaterial3D.new()
	rmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	rmat.albedo_color = Color(0.28, 0.82, 1.0, 0.55)
	torus.material = rmat
	ring.mesh = torus
	ring.position = Vector3(0, -6.0, 0)
	add_child(ring)


func _build_camera() -> void:
	_cam_pivot = Node3D.new()
	add_child(_cam_pivot)
	_cam = Camera3D.new()
	_cam.fov = ThemeHelper.camera_fov
	_cam.far = 600.0
	_cam_pivot.add_child(_cam)
	_cam.position = Vector3(0, 0.6, 1.0)


func _build_hud() -> void:
	_hud = CanvasLayer.new()
	_hud.layer = 6
	add_child(_hud)

	_hud_root = Control.new()
	_hud.add_child(_hud_root)
	ThemeHelper.fill_full_rect(_hud_root)
	_hud_root.theme = ThemeHelper.main_theme
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE

	_title_lbl = Label.new()
	_title_lbl.anchor_left = 0.0
	_title_lbl.anchor_right = 1.0
	_title_lbl.offset_left = 40
	_title_lbl.offset_right = -40
	_title_lbl.offset_top = 34
	_title_lbl.offset_bottom = 86
	_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_lbl.clip_text = true
	_title_lbl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	if ThemeHelper.font_display:
		_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_title_lbl.add_theme_font_size_override("font_size", 34)
	_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	_hud_root.add_child(_title_lbl)

	_sub_lbl = Label.new()
	_sub_lbl.anchor_left = 0.0
	_sub_lbl.anchor_right = 1.0
	_sub_lbl.offset_left = 40
	_sub_lbl.offset_right = -40
	_sub_lbl.offset_top = 88
	_sub_lbl.offset_bottom = 112
	_sub_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_sub_lbl.clip_text = true
	_sub_lbl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_sub_lbl.add_theme_font_size_override("font_size", 14)
	_sub_lbl.add_theme_color_override("font_color", Color(0.66, 0.82, 0.96))
	_hud_root.add_child(_sub_lbl)

	_counter_lbl = Label.new()
	_counter_lbl.anchor_left = 1.0
	_counter_lbl.anchor_right = 1.0
	_counter_lbl.offset_left = -268
	_counter_lbl.offset_right = -26
	_counter_lbl.offset_top = 26
	_counter_lbl.offset_bottom = 66
	_counter_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_counter_lbl.clip_text = true
	_counter_lbl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_counter_lbl.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_counter_lbl.add_theme_stylebox_override("panel", ThemeHelper.make_hud_pill_style(
		Color(0.03, 0.06, 0.13, 0.9), Color(0.24, 0.78, 1.0, 0.7), 10, 12, 6))
	if ThemeHelper.font_mono:
		_counter_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_counter_lbl.add_theme_font_size_override("font_size", 16)
	_counter_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	_hud_root.add_child(_counter_lbl)

	_back_btn = Button.new()
	_back_btn.anchor_left = 0.0
	_back_btn.anchor_right = 0.0
	_back_btn.offset_left = 26
	_back_btn.offset_right = 226
	_back_btn.offset_top = 26
	_back_btn.offset_bottom = 66
	_back_btn.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_back_btn.custom_minimum_size = Vector2(0, 40)
	_back_btn.add_theme_font_size_override("font_size", 15)
	ThemeHelper.style_accent_button(_back_btn, Color(0.20, 0.70, 0.96))
	_back_btn.pressed.connect(func(): return_to_hangar.emit())
	_hud_root.add_child(_back_btn)

	_dossier = PanelContainer.new()
	_dossier.anchor_left = 0.0
	_dossier.anchor_right = 0.0
	_dossier.anchor_top = 1.0
	_dossier.anchor_bottom = 1.0
	_dossier.offset_left = 26
	_dossier.offset_right = 560
	_dossier.offset_top = -190
	_dossier.offset_bottom = -26
	_dossier.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_dossier.visible = false
	_dossier.add_theme_stylebox_override("panel", ThemeHelper.make_plaque_style("legendary", 0.50, 18))
	_hud_root.add_child(_dossier)

	var dvb := VBoxContainer.new()
	dvb.add_theme_constant_override("separation", 8)
	_dossier.add_child(dvb)
	_dossier_title = Label.new()
	_dossier_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_dossier_title.clip_text = true
	if ThemeHelper.font_bold:
		_dossier_title.add_theme_font_override("font", ThemeHelper.font_bold)
	_dossier_title.add_theme_font_size_override("font_size", 20)
	_dossier_title.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	dvb.add_child(_dossier_title)
	_dossier_body = Label.new()
	_dossier_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_dossier_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_dossier_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_dossier_body.add_theme_font_size_override("font_size", 13)
	_dossier_body.add_theme_color_override("font_color", Color(0.84, 0.92, 1.0))
	dvb.add_child(_dossier_body)

	_hint_lbl = Label.new()
	_hint_lbl.anchor_left = 1.0
	_hint_lbl.anchor_right = 1.0
	_hint_lbl.anchor_top = 1.0
	_hint_lbl.anchor_bottom = 1.0
	_hint_lbl.offset_left = -520
	_hint_lbl.offset_right = -26
	_hint_lbl.offset_top = -54
	_hint_lbl.offset_bottom = -22
	_hint_lbl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_hint_lbl.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_hint_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_hint_lbl.clip_text = true
	_hint_lbl.add_theme_font_size_override("font_size", 13)
	_hint_lbl.add_theme_color_override("font_color", Color(0.62, 0.78, 0.94))
	_hud_root.add_child(_hint_lbl)

	if ThemeHelper.reduced_motion == false:
		ThemeHelper.animate_entry(_title_lbl, 0.0, Vector2.ONE)


func _apply_localization() -> void:
	if not is_instance_valid(_title_lbl):
		return
	_title_lbl.text = L.tr_ui("menu_hall_of_achievements")
	_back_btn.text = "<  " + L.tr_ui("menu_back")
	_hint_lbl.text = L.tr_ui("hall_hint")
	var total: int = AchievementManager.total_card_count()
	var owned: int = AchievementManager.earned_count()
	_counter_lbl.text = "  %d / %d  " % [owned, total]
	_sub_lbl.text = L.tr_ui("hall_subtitle")


func _rebuild_cards() -> void:
	if not _cards_root:
		_cards_root = Node3D.new()
		_cards_root.name = "HallCards"
		add_child(_cards_root)

	for ch in _cards_root.get_children():
		_cards_root.remove_child(ch)
		ch.queue_free()
	_floating_cards.clear()
	_focused = -1
	if is_instance_valid(_dossier):
		_dossier.visible = false

	var collected: Array[Dictionary] = AchievementManager.hall_entries()
	if collected.is_empty():
		return

	var count := collected.size()
	# Even spherical distribution using the golden angle
	var golden := 2.399963229728653
	for i in range(count):
		var t: Dictionary = collected[i]
		var rarity: String = str(t.get("rarity", "Common"))
		var rcol: Color = GameData.RARITY_COLORS.get(rarity, Color(0.6, 0.7, 0.8))
		var art_path: String = str(t.get("art", "res://assets/cards/achievements/ach_01.png"))
		if not ResourceLoader.exists(art_path):
			art_path = "res://assets/cards/achievements/ach_01.png"

		var phi := acos(clampf(1.0 - 2.0 * (float(i) + 0.5) / float(count), -1.0, 1.0))
		var theta := float(i) * golden
		var px := CARD_RADIUS * sin(phi) * cos(theta)
		var py := 1.5 + CARD_RADIUS * cos(phi) * 0.55
		var pz := CARD_RADIUS * sin(phi) * sin(theta)

		var card := _make_achievement_billboard(art_path, rcol, Vector3(px, py, pz))
		card.name = "HallCard_%d" % i
		_cards_root.add_child(card)
		_floating_cards.append({
			"node": card,
			"data": t,
			"base_pos": Vector3(px, py, pz),
			"orbit_speed": randf_range(0.12, 0.34),
			"bob_speed": randf_range(0.9, 1.9),
			"bob_amp": randf_range(0.5, 1.15),
			"spin_axis": Vector3(randf_range(-0.25, 0.25), 1.0, randf_range(-0.2, 0.2)).normalized(),
			"spin_speed": randf_range(0.10, 0.26)
		})


func _make_achievement_billboard(art_path: String, tint: Color, pos: Vector3) -> Node3D:
	var holder := Node3D.new()
	holder.position = pos

	var plane := PlaneMesh.new()
	plane.size = CARD_PLANE
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.billboard_keep_scale = true
	if ResourceLoader.exists(art_path):
		mat.albedo_texture = load(art_path)
	mat.albedo_color = Color(1, 1, 1, 0.97)
	plane.material = mat

	var mi := MeshInstance3D.new()
	mi.mesh = plane
	holder.add_child(mi)

	var gplane := PlaneMesh.new()
	gplane.size = CARD_PLANE * Vector2(1.14, 1.26)
	var gmat := StandardMaterial3D.new()
	gmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	gmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	gmat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	gmat.cull_mode = BaseMaterial3D.CULL_DISABLED
	gmat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	gmat.billboard_keep_scale = true
	gmat.albedo_color = Color(tint.r, tint.g, tint.b, 0.22)
	gplane.material = gmat
	var glow := MeshInstance3D.new()
	glow.mesh = gplane
	glow.position = Vector3(0, 0, -0.05)
	holder.add_child(glow)
	return holder


func _process(delta: float) -> void:
	_float_time += delta
	_minute_tick += delta

	if _cards_root and not ThemeHelper.reduced_motion:
		_cards_root.rotate_y(delta * 0.035)

	for i in range(_floating_cards.size()):
		var c: Dictionary = _floating_cards[i]
		var node: Node3D = c["node"]
		if not is_instance_valid(node):
			continue
		var focused := i == _focused
		var t := _float_time * float(c["orbit_speed"])
		var amp_mult: float = 1.7 if focused else 1.0
		var bob := sin(_float_time * float(c["bob_speed"])) * float(c["bob_amp"]) * amp_mult
		node.position = c["base_pos"] + Vector3(sin(t) * 1.1, bob, cos(t * 0.7) * 0.9)
		if not focused:
			node.rotate(c["spin_axis"], float(c["spin_speed"]) * delta)

	if _minute_tick >= 60.0:
		_minute_tick = 0.0
		_rebuild_cards()
		_apply_localization()

	# Cinematic idle drift + focus easing
	_orbit_dist = lerpf(_orbit_dist, _target_orbit_dist, 1.0 - exp(-6.0 * delta))
	_focus_lerp = lerpf(_focus_lerp, 1.0 if _focused >= 0 else 0.0, 1.0 - exp(-5.0 * delta))
	var idle_y := 1.15 + sin(_float_time * 0.32) * 0.22
	var look_pitch := lerpf(deg_to_rad(_pitch), deg_to_rad(-6.0), _focus_lerp)
	_cam_pivot.rotation = Vector3(look_pitch, deg_to_rad(_yaw), 0.0)
	_cam_pivot.position = Vector3(0, idle_y, 0)
	var dist: float = lerpf(1.0, 0.62, _focus_lerp)
	_cam.position = Vector3(0, 0.4, (CARD_RADIUS * 0.62 + _orbit_dist) * dist)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_ESCAPE, KEY_TAB, KEY_BACKSPACE]:
			return_to_hangar.emit()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_F:
			_focus_next()
		return

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_target_orbit_dist = clampf(_target_orbit_dist - 2.4, -13.0, 16.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_target_orbit_dist = clampf(_target_orbit_dist + 2.4, -13.0, 16.0)
		elif event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			_dragging = true
			if event.button_index == MOUSE_BUTTON_LEFT:
				_try_pick_card(event.position)
		return

	if event is InputEventMouseButton and not event.pressed:
		_dragging = false
		return

	if event is InputEventMouseMotion and _dragging:
		_yaw = clampf(_yaw - event.relative.x * 0.16 * ThemeHelper.camera_sensitivity, -180.0, 180.0)
		_pitch = clampf(_pitch - event.relative.y * 0.11 * ThemeHelper.camera_sensitivity, -38.0, 34.0)


func _try_pick_card(screen_pos: Vector2) -> void:
	if not is_instance_valid(_cam) or _floating_cards.is_empty():
		return
	var best_idx := -1
	var best_d := 90.0
	for i in range(_floating_cards.size()):
		var node: Node3D = _floating_cards[i]["node"]
		if not is_instance_valid(node):
			continue
		var wp: Vector3 = node.global_position
		if _cam.is_position_behind(wp):
			continue
		var sp: Vector2 = _cam.unproject_position(wp)
		var d := sp.distance_to(screen_pos)
		if d < best_d:
			best_d = d
			best_idx = i
	if best_idx < 0:
		_focused = -1
		if is_instance_valid(_dossier):
			_dossier.visible = false
		return
	_focused = best_idx
	_show_dossier(_floating_cards[best_idx]["data"])
	AudioManager.play_sfx("card_flip", 0.0, 1.0)


func _focus_next() -> void:
	if _floating_cards.is_empty():
		return
	_focused = (_focused + 1) % _floating_cards.size()
	_show_dossier(_floating_cards[_focused]["data"])


func _show_dossier(task: Dictionary) -> void:
	if not is_instance_valid(_dossier):
		return
	_dossier_title.text = L.ach_name(task)
	_dossier_body.text = "%s\n%s\n%s: %s" % [
		L.ach_desc(task),
		L.ach_objective(task),
		L.tr_ui("ach_rarity"),
		L.rarity_name(str(task.get("rarity", "Common")))
	]
	_dossier.visible = true
