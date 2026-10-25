class_name Hangar3D
extends Node3D

signal request_launch_expedition(sector_index: int)
signal request_main_menu

var _env_root: Node3D
var _ship_preview_root: Node3D
var _ghost_root: Node3D
var _com_gizmo: Node3D
var _gantry_node: Node3D
var _robot_arms: Array[Node3D] = []
var _station_labels_3d: Array[Dictionary] = []

var _cam_pivot: Node3D
var _cam: Camera3D
var _cam_yaw: float = -32.0
var _cam_pitch: float = -22.0
var _cam_dist: float = 16.5
var _cam_target: Vector3 = Vector3(0, 0.5, 0)
var _goal_yaw: float = -32.0
var _goal_pitch: float = -22.0
var _goal_dist: float = 16.5
var _goal_target: Vector3 = Vector3(0, 0.5, 0)
var _orbit_dragging: bool = false
var _pan_dragging: bool = false

# Editor state
var editor_mode: String = "place" # "place" or "remove"
var selected_mod_id: String = "hull_cell"
var current_yaw: int = 0
var hovered_anchor: Vector3i = Vector3i(0, 0, -1)
var hover_valid: bool = false
var hover_reason: String = ""
var _ghost_cached_mod: String = ""
var _side_panels_collapsed: bool = false

# UI references
var _hud_layer: CanvasLayer
var _ui_root: Control
var _top_bar: PanelContainer
var _left_panel: PanelContainer
var _right_panel: PanelContainer
var _status_box: PanelContainer
var _bottom_dock: PanelContainer

var _menu_btn: Button
var _collapse_btn: Button
var _top_settings_btn: Button
var _top_launch_btn: Button
var _credits_lbl: Label
var _crystals_lbl: Label

var _ed_title_lbl: Label
var _buy_cell_btn: Button
var _crew_prog_lbl: Label
var _crew_prog_bar: ProgressBar
var _btn_place: Button
var _btn_rem: Button
var _btn_rot: Button
var _pal_lbl: Label
var _palette_list: VBoxContainer
var _blueprint_le: LineEdit
var _bp_save_btn: Button
var _blueprint_opt: OptionButton
var _bp_load_btn: Button

var _rt_title_lbl: Label
var _telemetry_rows_vb: VBoxContainer
var _cam_help_lbl: Label
var _status_banner: Label
var _dock_buttons: Dictionary = {}
var _station_panels: HangarStationPanels

var _anim_time: float = 0.0

func _ready() -> void:
	AudioManager.play_ambient("amb_hangar")
	AudioManager.stop_loops()
	_build_3d_hangar_environment()
	_build_camera_rig()
	_build_ship_and_gizmos()
	_build_hangar_ui()

	ShipGrid.ship_changed.connect(_on_ship_changed)
	ShipGrid.credits_changed.connect(func(_c): _refresh_ui())
	ShipGrid.crystals_changed.connect(func(_c): _refresh_ui())
	CrewManager.crew_changed.connect(_refresh_ui)
	UpgradeManager.upgrades_changed.connect(_refresh_ui)
	AchievementManager.achievements_updated.connect(_refresh_ui)
	L.language_changed.connect(func(_lang: String): _apply_localization_and_refresh())

	_apply_localization_and_refresh()
	_on_ship_changed()

func _build_3d_hangar_environment() -> void:
	_env_root = Node3D.new()
	add_child(_env_root)

	var we := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.02, 0.035, 0.075)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.24, 0.32, 0.46)
	env.ambient_light_energy = 0.95
	env.glow_enabled = true
	env.glow_intensity = 0.65
	we.environment = env
	_env_root.add_child(we)

	var key_light := DirectionalLight3D.new()
	key_light.light_color = Color(0.95, 0.96, 1.0)
	key_light.light_energy = 1.45
	key_light.shadow_enabled = ThemeHelper.graphics_preset != "Low"
	key_light.rotation_degrees = Vector3(-48, 36, 0)
	_env_root.add_child(key_light)

	for lp in [
		[Vector3(-12, 9, -10), Color(0.25, 0.82, 1.0), 2.2],
		[Vector3(12, 9, -10), Color(1.0, 0.72, 0.30), 2.0],
		[Vector3(0, 10, 12), Color(0.35, 0.78, 1.0), 2.0],
	]:
		var ol := OmniLight3D.new()
		ol.position = lp[0]
		ol.light_color = lp[1]
		ol.light_energy = lp[2]
		ol.omni_range = 32.0
		_env_root.add_child(ol)

	var floor_mi := MeshInstance3D.new()
	var fbox := BoxMesh.new()
	fbox.size = Vector3(58.0, 0.6, 58.0)
	floor_mi.mesh = fbox
	floor_mi.position = Vector3(0, -1.18, 0)
	var fmat := StandardMaterial3D.new()
	if ResourceLoader.exists("res://assets/textures/hangar_floor_albedo.png"):
		fmat.albedo_texture = load("res://assets/textures/hangar_floor_albedo.png")
		fmat.normal_enabled = true
		fmat.normal_texture = load("res://assets/textures/hangar_floor_normal.png")
		fmat.uv1_scale = Vector3(14, 14, 14)
	fmat.metallic = 0.72
	fmat.roughness = 0.38
	floor_mi.material_override = fmat
	_env_root.add_child(floor_mi)

	var wall_mat := StandardMaterial3D.new()
	wall_mat.albedo_color = Color(0.11, 0.14, 0.20)
	wall_mat.metallic = 0.75
	wall_mat.roughness = 0.45
	for wspec in [
		[Vector3(-26, 8, 0), Vector3(1.5, 19, 56)],
		[Vector3(26, 8, 0), Vector3(1.5, 19, 56)],
		[Vector3(0, 8, 25), Vector3(54, 19, 1.5)],
	]:
		var wmi := MeshInstance3D.new()
		var wb := BoxMesh.new()
		wb.size = wspec[1]
		wmi.mesh = wb
		wmi.position = wspec[0]
		wmi.material_override = wall_mat
		_env_root.add_child(wmi)

	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_platform.glb", Vector3(0, -0.95, 0), Vector3.ZERO)
	_gantry_node = _spawn_glb(_env_root, "res://assets/models/hangar/hangar_gantry_crane.glb", Vector3(0, -0.8, -2.0), Vector3.ZERO)

	for rspec in [
		[Vector3(-11.5, -0.9, -7.5), 135.0],
		[Vector3(11.5, -0.9, -7.5), -135.0],
		[Vector3(-11.5, -0.9, 7.5), 45.0],
		[Vector3(11.5, -0.9, 7.5), -45.0],
	]:
		var arm := _spawn_glb(_env_root, "res://assets/models/hangar/hangar_robotic_arm.glb", rspec[0], Vector3(0, rspec[1], 0))
		if arm:
			_robot_arms.append(arm)

	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_cargo_containers.glb", Vector3(-18.5, -0.9, 14.0), Vector3(0, 25, 0))
	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_cargo_containers.glb", Vector3(18.5, -0.9, 14.0), Vector3(0, -30, 0))

	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_launch_gate.glb", Vector3(0, -0.9, -24.5), Vector3.ZERO)
	var gate_field := VFXFactory.create_holo_panel(Vector2(27.5, 13.8), Color(0.14, 0.72, 1.0, 0.36))
	gate_field.position = Vector3(0, 6.8, -24.5)
	_env_root.add_child(gate_field)

	var stations := [
		["shop", "tab_shop", Vector3(-15.5, -0.9, -3.5), 75.0, Color(0.22, 0.85, 1.0, 0.75)],
		["crew", "tab_crew", Vector3(-15.5, -0.9, 4.5), 105.0, Color(0.35, 1.0, 0.68, 0.75)],
		["packs", "tab_packs", Vector3(15.5, -0.9, -3.5), -75.0, Color(0.85, 0.42, 1.0, 0.75)],
		["upgrades", "tab_upgrades", Vector3(15.5, -0.9, 4.5), -105.0, Color(1.0, 0.78, 0.25, 0.75)],
		["achievements", "tab_achievements", Vector3(-8.5, -0.9, 15.5), 160.0, Color(1.0, 0.86, 0.32, 0.75)],
		["launch", "tab_launch", Vector3(8.5, -0.9, -15.5), -20.0, Color(0.25, 1.0, 0.75, 0.85)],
	]
	for st in stations:
		_create_interactive_station(st[0], st[1], st[2], st[3], st[4])

func _create_interactive_station(tab_id: String, loc_key: String, pos: Vector3, yaw_deg: float, holo_col: Color) -> void:
	var sb := StaticBody3D.new()
	sb.position = pos
	sb.rotation_degrees = Vector3(0, yaw_deg, 0)
	sb.set_meta("station_tab", tab_id)
	sb.set_meta("station_loc_key", loc_key)
	_env_root.add_child(sb)

	var cshape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.8, 3.2, 2.2)
	cshape.shape = box
	cshape.position = Vector3(0, 1.6, 0)
	sb.add_child(cshape)

	_spawn_glb(sb, "res://assets/models/hangar/hangar_terminal_station.glb", Vector3.ZERO, Vector3.ZERO)

	var holo := VFXFactory.create_holo_panel(Vector2(2.3, 1.15), holo_col)
	holo.position = Vector3(0, 2.85, 0)
	sb.add_child(holo)

	var lbl3d := Label3D.new()
	lbl3d.text = L.tr_ui(loc_key).to_upper()
	if ThemeHelper.font_display:
		lbl3d.font = ThemeHelper.font_display
	lbl3d.font_size = 36
	lbl3d.modulate = holo_col.lightened(0.35)
	lbl3d.outline_size = 8
	lbl3d.position = Vector3(0, 2.88, 0.06)
	lbl3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sb.add_child(lbl3d)
	_station_labels_3d.append({"label": lbl3d, "key": loc_key})

func _spawn_glb(parent: Node, path: String, pos: Vector3, rot_deg: Vector3) -> Node3D:
	if not ResourceLoader.exists(path):
		return null
	var ps: PackedScene = load(path)
	if not ps:
		return null
	var n: Node3D = ps.instantiate()
	n.position = pos
	n.rotation_degrees = rot_deg
	parent.add_child(n)
	return n

func _build_camera_rig() -> void:
	_cam_pivot = Node3D.new()
	add_child(_cam_pivot)
	_cam = Camera3D.new()
	_cam.fov = 58.0
	_cam.far = 350.0
	_cam_pivot.add_child(_cam)
	_apply_camera_transform()

func _apply_camera_transform() -> void:
	_goal_pitch = clampf(_goal_pitch, -85.0, 28.0)
	_goal_dist = clampf(_goal_dist, 5.5, 36.0)
	_goal_target.x = clampf(_goal_target.x, -12.0, 12.0)
	_goal_target.y = clampf(_goal_target.y, -0.5, 6.0)
	_goal_target.z = clampf(_goal_target.z, -12.0, 12.0)

	_cam_pivot.position = _cam_target
	_cam_pivot.rotation_degrees = Vector3(_cam_pitch, _cam_yaw, 0.0)
	_cam.position = Vector3(0, 0, _cam_dist)
	if _cam.global_position.y < 0.45:
		_cam.global_position.y = 0.45

func _build_ship_and_gizmos() -> void:
	_ship_preview_root = Node3D.new()
	_ship_preview_root.position = Vector3(0, 1.05, 0)
	add_child(_ship_preview_root)

	_ghost_root = Node3D.new()
	_ship_preview_root.add_child(_ghost_root)

	_com_gizmo = Node3D.new()
	_ship_preview_root.add_child(_com_gizmo)

	var com_mat := StandardMaterial3D.new()
	com_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	com_mat.albedo_color = Color(1.0, 0.78, 0.15, 0.92)
	com_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	com_mat.no_depth_test = true

	var sph_mi := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 0.28
	sph.height = 0.56
	sph_mi.mesh = sph
	sph_mi.material_override = com_mat
	_com_gizmo.add_child(sph_mi)

	for ax in [Vector3(1.5, 0.05, 0.05), Vector3(0.05, 1.5, 0.05), Vector3(0.05, 0.05, 1.5)]:
		var bar := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = ax
		bar.mesh = bm
		bar.material_override = com_mat
		_com_gizmo.add_child(bar)

	var com_lbl := Label3D.new()
	com_lbl.text = "CoM"
	com_lbl.font_size = 28
	com_lbl.modulate = Color(1.0, 0.85, 0.25)
	com_lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	com_lbl.no_depth_test = true
	com_lbl.position = Vector3(0, 0.52, 0)
	_com_gizmo.add_child(com_lbl)

func _rebuild_ship_3d_preview(animate_last_uid: int = -1) -> void:
	for ch in _ship_preview_root.get_children():
		if ch != _ghost_root and ch != _com_gizmo:
			ch.queue_free()

	for uid in ShipGrid.placed_modules.keys():
		var e: Dictionary = ShipGrid.placed_modules[uid]
		var mid: String = e["mod_id"]
		if not GameData.modules.has(mid):
			continue
		var def: Dictionary = GameData.modules[mid]
		var anchor: Vector3i = e["anchor"]
		var yaw: int = int(e["yaw"])

		var holder := StaticBody3D.new()
		holder.position = Vector3(anchor.x, anchor.y, anchor.z) * ShipGrid.CELL_SIZE
		holder.rotation_degrees = Vector3(0, float(yaw) * 90.0, 0)
		holder.set_meta("grid_uid", uid)
		holder.set_meta("anchor_cell", anchor)
		_ship_preview_root.add_child(holder)

		var cells: Array = e["cells"]
		for c in cells:
			var cs := CollisionShape3D.new()
			var bx := BoxShape3D.new()
			bx.size = Vector3.ONE * (ShipGrid.CELL_SIZE * 0.98)
			cs.shape = bx
			var world_off := Vector3(c.x - anchor.x, c.y - anchor.y, c.z - anchor.z) * ShipGrid.CELL_SIZE
			cs.position = holder.transform.basis.inverse() * world_off
			holder.add_child(cs)

		var vis := _spawn_glb(holder, def["model_path"], Vector3.ZERO, Vector3.ZERO)
		if vis and uid == animate_last_uid and not ThemeHelper.reduced_motion:
			vis.scale = Vector3(0.2, 0.2, 0.2)
			var tw := create_tween()
			tw.tween_property(vis, "scale", Vector3.ONE, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	var st := ShipGrid.compute_ship_stats()
	_com_gizmo.position = st["center_of_mass"]

func _refresh_ghost_visual() -> void:
	if _ghost_cached_mod != selected_mod_id:
		_ghost_cached_mod = selected_mod_id
		for ch in _ghost_root.get_children():
			ch.queue_free()
		if GameData.modules.has(selected_mod_id):
			_spawn_glb(_ghost_root, GameData.modules[selected_mod_id]["model_path"], Vector3.ZERO, Vector3.ZERO)

	_ghost_root.visible = (editor_mode == "place") and (not _station_panels.visible)
	_ghost_root.position = Vector3(hovered_anchor.x, hovered_anchor.y, hovered_anchor.z) * ShipGrid.CELL_SIZE
	_ghost_root.rotation_degrees = Vector3(0, float(current_yaw) * 90.0, 0)

	var tint := Color(0.20, 1.0, 0.55, 0.58) if hover_valid else Color(1.0, 0.24, 0.28, 0.58)
	_apply_ghost_material_recursive(_ghost_root, tint)

func _apply_ghost_material_recursive(n: Node, col: Color) -> void:
	if n is MeshInstance3D:
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.albedo_color = col
		n.material_override = m
	for c in n.get_children():
		_apply_ghost_material_recursive(c, col)

# ==============================================================================
# REBUILT HANGAR & 3D SHIPBAY UI (ZERO OVERLAP, STRICT MOUSE ISOLATION)
# ==============================================================================
func _build_hangar_ui() -> void:
	_hud_layer = CanvasLayer.new()
	add_child(_hud_layer)

	_ui_root = Control.new()
	_ui_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_ui_root.theme = ThemeHelper.main_theme
	_ui_root.mouse_filter = Control.MOUSE_FILTER_PASS
	_hud_layer.add_child(_ui_root)

	# 1. TOP COMMAND HEADER BAR (y: 0..56)
	_top_bar = PanelContainer.new()
	_top_bar.name = "HangarTopBar"
	_top_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_top_bar.offset_bottom = 56
	_top_bar.mouse_filter = Control.MOUSE_FILTER_STOP
	_top_bar.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.022, 0.042, 0.095, 0.95), Color(0.20, 0.72, 1.0, 0.80), 0, 2, 10))
	_ui_root.add_child(_top_bar)

	var thb := HBoxContainer.new()
	thb.add_theme_constant_override("separation", 10)
	_top_bar.add_child(thb)

	_menu_btn = Button.new()
	_menu_btn.custom_minimum_size = Vector2(142, 36)
	ThemeHelper.wire_button_fx(_menu_btn)
	_menu_btn.pressed.connect(func():
		SaveManager.save_game()
		request_main_menu.emit()
	)
	thb.add_child(_menu_btn)

	_credits_lbl = _create_icon_stat(thb, "res://assets/icons/ui/icon_credits.png", ThemeHelper.COL_GOLD)
	_crystals_lbl = _create_icon_stat(thb, "res://assets/icons/ui/icon_crystals.png", ThemeHelper.COL_CYAN)

	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thb.add_child(sp)

	_collapse_btn = Button.new()
	_collapse_btn.custom_minimum_size = Vector2(40, 36)
	_collapse_btn.text = "◀▶"
	ThemeHelper.wire_button_fx(_collapse_btn)
	_collapse_btn.pressed.connect(func():
		_side_panels_collapsed = not _side_panels_collapsed
		_left_panel.visible = not _side_panels_collapsed
		_right_panel.visible = not _side_panels_collapsed
		if not _side_panels_collapsed:
			ThemeHelper.animate_entry(_left_panel, 0.0)
			ThemeHelper.animate_entry(_right_panel, 0.0)
	)
	thb.add_child(_collapse_btn)

	thb.add_child(ThemeHelper.make_language_dropdown(true))

	_top_settings_btn = Button.new()
	_top_settings_btn.custom_minimum_size = Vector2(128, 36)
	ThemeHelper.wire_button_fx(_top_settings_btn)
	_top_settings_btn.pressed.connect(func():
		_station_panels.standalone_settings_mode = false
		_station_panels.open_tab("settings")
	)
	thb.add_child(_top_settings_btn)

	_top_launch_btn = Button.new()
	_top_launch_btn.custom_minimum_size = Vector2(160, 36)
	ThemeHelper.style_accent_button(_top_launch_btn, Color(0.16, 0.85, 0.54))
	_top_launch_btn.pressed.connect(func():
		_station_panels.standalone_settings_mode = false
		_station_panels.open_tab("launch")
	)
	thb.add_child(_top_launch_btn)

	# 2. LEFT 3D SHIP CONSTRUCTOR DOCK (x: 12..336, y: 66..H-80)
	_left_panel = PanelContainer.new()
	_left_panel.name = "HangarLeftPanel"
	_left_panel.anchor_left = 0.0
	_left_panel.anchor_right = 0.0
	_left_panel.anchor_top = 0.0
	_left_panel.anchor_bottom = 1.0
	_left_panel.offset_left = 12
	_left_panel.offset_right = 336
	_left_panel.offset_top = 66
	_left_panel.offset_bottom = -80
	_left_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_ui_root.add_child(_left_panel)

	var lvb := VBoxContainer.new()
	lvb.add_theme_constant_override("separation", 7)
	_left_panel.add_child(lvb)

	_ed_title_lbl = Label.new()
	_ed_title_lbl.clip_text = true
	if ThemeHelper.font_display:
		_ed_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_ed_title_lbl.add_theme_font_size_override("font_size", 16)
	_ed_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	lvb.add_child(_ed_title_lbl)

	_buy_cell_btn = Button.new()
	_buy_cell_btn.custom_minimum_size = Vector2(0, 40)
	_buy_cell_btn.clip_text = true
	ThemeHelper.style_accent_button(_buy_cell_btn, Color(0.95, 0.68, 0.16))
	_buy_cell_btn.pressed.connect(func():
		if ShipGrid.purchase_expansion_cell():
			AudioManager.play_sfx("buy_upgrade", 0.04, 0.85)
			selected_mod_id = "hull_cell"
			editor_mode = "place"
			SaveManager.save_game()
			_refresh_ui()
		else:
			_status_banner.text = L.tr_ui("not_enough_credits")
			AudioManager.play_sfx("ui_error", 0.04, 0.7)
	)
	lvb.add_child(_buy_cell_btn)

	_crew_prog_lbl = Label.new()
	_crew_prog_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_crew_prog_lbl.add_theme_font_size_override("font_size", 12)
	_crew_prog_lbl.add_theme_color_override("font_color", Color(0.82, 0.92, 1.0))
	lvb.add_child(_crew_prog_lbl)

	_crew_prog_bar = ProgressBar.new()
	_crew_prog_bar.max_value = 10.0
	_crew_prog_bar.show_percentage = false
	_crew_prog_bar.custom_minimum_size = Vector2(0, 10)
	lvb.add_child(_crew_prog_bar)

	var tool_hb := HBoxContainer.new()
	tool_hb.add_theme_constant_override("separation", 5)
	lvb.add_child(tool_hb)

	_btn_place = Button.new()
	_btn_place.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_btn_place.clip_text = true
	_btn_place.pressed.connect(func():
		editor_mode = "place"
		_refresh_ghost_visual()
		_refresh_ui()
	)
	tool_hb.add_child(_btn_place)

	_btn_rem = Button.new()
	_btn_rem.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_btn_rem.clip_text = true
	_btn_rem.pressed.connect(func():
		editor_mode = "remove" if editor_mode != "remove" else "place"
		_refresh_ghost_visual()
		_refresh_ui()
	)
	tool_hb.add_child(_btn_rem)

	_btn_rot = Button.new()
	_btn_rot.custom_minimum_size = Vector2(78, 0)
	_btn_rot.clip_text = true
	ThemeHelper.wire_button_fx(_btn_rot)
	_btn_rot.pressed.connect(func():
		current_yaw = (current_yaw + 1) % 4
		_update_hover_validation()
		_refresh_ghost_visual()
	)
	tool_hb.add_child(_btn_rot)

	_pal_lbl = Label.new()
	_pal_lbl.clip_text = true
	_pal_lbl.add_theme_font_size_override("font_size", 12)
	_pal_lbl.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
	lvb.add_child(_pal_lbl)

	var p_sc := ScrollContainer.new()
	p_sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	p_sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	lvb.add_child(p_sc)

	_palette_list = VBoxContainer.new()
	_palette_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_palette_list.add_theme_constant_override("separation", 5)
	p_sc.add_child(_palette_list)

	# Blueprint Save Row
	var bp_save_hb := HBoxContainer.new()
	bp_save_hb.add_theme_constant_override("separation", 5)
	lvb.add_child(bp_save_hb)

	_blueprint_le = LineEdit.new()
	_blueprint_le.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bp_save_hb.add_child(_blueprint_le)

	_bp_save_btn = Button.new()
	_bp_save_btn.custom_minimum_size = Vector2(96, 32)
	_bp_save_btn.clip_text = true
	ThemeHelper.wire_button_fx(_bp_save_btn)
	_bp_save_btn.pressed.connect(func():
		var nm := _blueprint_le.text.strip_edges()
		if nm.is_empty():
			nm = "Ship_%d" % (ShipGrid.saved_layouts.size() + 1)
		if ShipGrid.save_named_layout(nm):
			_blueprint_le.release_focus()
			SaveManager.save_game()
			_status_banner.text = L.tr_ui("saved_layout_msg", [nm])
			_refresh_ui()
	)
	bp_save_hb.add_child(_bp_save_btn)

	# Blueprint Load Row
	var bp_load_hb := HBoxContainer.new()
	bp_load_hb.add_theme_constant_override("separation", 5)
	lvb.add_child(bp_load_hb)

	_blueprint_opt = OptionButton.new()
	_blueprint_opt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_blueprint_opt.clip_text = true
	bp_load_hb.add_child(_blueprint_opt)

	_bp_load_btn = Button.new()
	_bp_load_btn.custom_minimum_size = Vector2(96, 32)
	_bp_load_btn.clip_text = true
	ThemeHelper.wire_button_fx(_bp_load_btn)
	_bp_load_btn.pressed.connect(func():
		if _blueprint_opt.item_count > 0 and _blueprint_opt.selected >= 0:
			var sel_name := _blueprint_opt.get_item_text(_blueprint_opt.selected)
			if ShipGrid.load_named_layout(sel_name):
				AudioManager.play_sfx("module_place", 0.03, 0.85)
				SaveManager.save_game()
				_status_banner.text = L.tr_ui("loaded_layout_msg", [sel_name])
				_on_ship_changed()
	)
	bp_load_hb.add_child(_bp_load_btn)

	# 3. RIGHT PHYSICAL TELEMETRY DOCK (x: W-336..W-12, y: 66..H-80)
	_right_panel = PanelContainer.new()
	_right_panel.name = "HangarRightPanel"
	_right_panel.anchor_left = 1.0
	_right_panel.anchor_right = 1.0
	_right_panel.anchor_top = 0.0
	_right_panel.anchor_bottom = 1.0
	_right_panel.offset_left = -336
	_right_panel.offset_right = -12
	_right_panel.offset_top = 66
	_right_panel.offset_bottom = -80
	_right_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_ui_root.add_child(_right_panel)

	var rvb := VBoxContainer.new()
	rvb.add_theme_constant_override("separation", 8)
	_right_panel.add_child(rvb)

	_rt_title_lbl = Label.new()
	_rt_title_lbl.clip_text = true
	if ThemeHelper.font_display:
		_rt_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_rt_title_lbl.add_theme_font_size_override("font_size", 16)
	_rt_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	rvb.add_child(_rt_title_lbl)

	var tel_sc := ScrollContainer.new()
	tel_sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tel_sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	rvb.add_child(tel_sc)

	_telemetry_rows_vb = VBoxContainer.new()
	_telemetry_rows_vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_telemetry_rows_vb.add_theme_constant_override("separation", 5)
	tel_sc.add_child(_telemetry_rows_vb)

	var sep_help := HSeparator.new()
	sep_help.modulate = Color(0.20, 0.62, 0.90, 0.35)
	rvb.add_child(sep_help)

	_cam_help_lbl = Label.new()
	_cam_help_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_cam_help_lbl.add_theme_font_size_override("font_size", 12)
	_cam_help_lbl.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
	rvb.add_child(_cam_help_lbl)

	# 4. FLOATING STATUS PILL (strictly between Left & Right panels and above Bottom Dock)
	_status_box = PanelContainer.new()
	_status_box.name = "HangarStatusToast"
	_status_box.anchor_left = 0.0
	_status_box.anchor_right = 1.0
	_status_box.anchor_top = 1.0
	_status_box.anchor_bottom = 1.0
	_status_box.offset_left = 348
	_status_box.offset_right = -348
	_status_box.offset_top = -120
	_status_box.offset_bottom = -80
	_status_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_status_box.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.02, 0.045, 0.105, 0.90), Color(0.22, 0.72, 1.0, 0.65), 10, 12, 6))
	_ui_root.add_child(_status_box)

	_status_banner = Label.new()
	_status_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_banner.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_status_banner.clip_text = true
	_status_banner.add_theme_font_size_override("font_size", 13)
	_status_box.add_child(_status_banner)

	# 5. RELOCATED BOTTOM STATION DOCK (y: H-70..H-10)
	_bottom_dock = PanelContainer.new()
	_bottom_dock.name = "HangarBottomDock"
	_bottom_dock.anchor_left = 0.0
	_bottom_dock.anchor_right = 1.0
	_bottom_dock.anchor_top = 1.0
	_bottom_dock.anchor_bottom = 1.0
	_bottom_dock.offset_left = 12
	_bottom_dock.offset_right = -12
	_bottom_dock.offset_top = -70
	_bottom_dock.offset_bottom = -10
	_bottom_dock.mouse_filter = Control.MOUSE_FILTER_STOP
	_bottom_dock.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.022, 0.044, 0.10, 0.95), Color(0.22, 0.72, 1.0, 0.82), 13, 2, 8))
	_ui_root.add_child(_bottom_dock)

	var dock_hb := HBoxContainer.new()
	dock_hb.add_theme_constant_override("separation", 8)
	_bottom_dock.add_child(dock_hb)

	var dock_specs := [
		["shop", "tab_shop", Color(0.18, 0.68, 0.95)],
		["crew", "tab_crew", Color(0.22, 0.80, 0.56)],
		["packs", "tab_packs", Color(0.75, 0.36, 0.98)],
		["upgrades", "tab_upgrades", Color(0.95, 0.68, 0.18)],
		["achievements", "tab_achievements", Color(0.95, 0.78, 0.24)],
		["launch", "tab_launch", Color(0.16, 0.85, 0.54)],
	]
	for spec in dock_specs:
		var tid: String = spec[0]
		var db := Button.new()
		db.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		db.custom_minimum_size = Vector2(0, 42)
		db.clip_text = true
		ThemeHelper.style_accent_button(db, spec[2])
		db.pressed.connect(func():
			_station_panels.standalone_settings_mode = false
			_station_panels.open_tab(tid)
		)
		dock_hb.add_child(db)
		_dock_buttons[tid] = {"btn": db, "key": spec[1]}

	# 6. FULL-SCREEN STATION MODAL OVERLAY
	_station_panels = HangarStationPanels.new()
	_station_panels.launch_sector_requested.connect(func(sec_idx: int):
		request_launch_expedition.emit(sec_idx)
	)
	_station_panels.select_module_for_editor.connect(func(mid: String):
		selected_mod_id = mid
		editor_mode = "place"
		_refresh_ghost_visual()
		_refresh_ui()
	)
	_station_panels.panel_closed.connect(func():
		_refresh_ghost_visual()
		_refresh_ui()
	)
	_ui_root.add_child(_station_panels)

	# Entrance animations
	ThemeHelper.animate_entry(_top_bar, 0.0, Vector2(0.99, 0.99))
	ThemeHelper.animate_entry(_left_panel, 0.04, Vector2(0.97, 0.97))
	ThemeHelper.animate_entry(_right_panel, 0.07, Vector2(0.97, 0.97))
	ThemeHelper.animate_entry(_bottom_dock, 0.10, Vector2(0.98, 0.98))

func _create_icon_stat(parent: HBoxContainer, icon_path: String, col: Color) -> Label:
	var pill := PanelContainer.new()
	pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.05, 0.09, 0.18, 0.92), col * Color(1, 1, 1, 0.55), 8, 9, 4))
	parent.add_child(pill)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 6)
	pill.add_child(hb)
	var ic := TextureRect.new()
	ic.custom_minimum_size = Vector2(22, 22)
	ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if ResourceLoader.exists(icon_path):
		ic.texture = load(icon_path)
	hb.add_child(ic)
	var l := Label.new()
	if ThemeHelper.font_bold:
		l.add_theme_font_override("font", ThemeHelper.font_bold)
	l.add_theme_font_size_override("font_size", 16)
	l.add_theme_color_override("font_color", col)
	hb.add_child(l)
	return l

func _apply_localization_and_refresh() -> void:
	if not is_instance_valid(_menu_btn):
		return
	_menu_btn.text = "◄ " + L.tr_ui("nav_menu")
	_top_settings_btn.text = "◈ " + L.tr_ui("tab_settings")
	_top_launch_btn.text = "▶ " + L.tr_ui("tab_launch")
	_ed_title_lbl.text = L.tr_ui("hangar_constructor")
	_btn_place.text = L.tr_ui("mode_place")
	_btn_rem.text = L.tr_ui("mode_remove")
	_btn_rot.text = L.tr_ui("rotate_btn")
	_pal_lbl.text = L.tr_ui("owned_modules_hdr")
	_blueprint_le.placeholder_text = L.tr_ui("layout_placeholder")
	_bp_save_btn.text = L.tr_ui("save_layout")
	_bp_load_btn.text = L.tr_ui("load_layout")
	_rt_title_lbl.text = L.tr_ui("hangar_telemetry")
	_cam_help_lbl.text = L.tr_ui("hangar_cam_help")
	_status_banner.text = L.tr_ui("hangar_status_default")

	for item in _station_labels_3d:
		var lbl3d: Label3D = item["label"]
		if is_instance_valid(lbl3d):
			lbl3d.text = L.tr_ui(str(item["key"])).to_upper()

	_refresh_ui()

func _on_ship_changed() -> void:
	_rebuild_ship_3d_preview()
	_update_hover_validation()
	_refresh_ghost_visual()
	_refresh_ui()

func _refresh_ui() -> void:
	if not is_instance_valid(_credits_lbl):
		return
	_credits_lbl.text = "%d CR" % ShipGrid.credits
	_crystals_lbl.text = "%d CRY" % ShipGrid.crystals

	_buy_cell_btn.text = L.tr_ui("buy_cell_btn", [ShipGrid.get_next_cell_price()])
	var c_slots := ShipGrid.get_unlocked_crew_slots()
	var c_prog := ShipGrid.get_cells_toward_next_crew_slot()
	_crew_prog_lbl.text = L.tr_ui("crew_slots_info", [c_slots, ShipGrid.purchased_expansion_cells, c_prog])
	_crew_prog_bar.value = float(c_prog)

	ThemeHelper.style_accent_button(_btn_place, Color(0.18, 0.80, 0.54) if editor_mode == "place" else Color(0.24, 0.36, 0.52))
	ThemeHelper.style_accent_button(_btn_rem, Color(0.90, 0.32, 0.36) if editor_mode == "remove" else Color(0.38, 0.24, 0.30))

	# Update Bottom Station Dock labels & live achievement badge
	var ready_ach := AchievementManager.get_claimable_count()
	for tid in _dock_buttons.keys():
		var info: Dictionary = _dock_buttons[tid]
		var db: Button = info["btn"]
		var txt := L.tr_ui(str(info["key"]))
		if tid == "achievements" and ready_ach > 0:
			txt += " [◆%d]" % ready_ach
		db.text = txt

	# Populate Owned Module Palette
	for ch in _palette_list.get_children():
		ch.queue_free()

	var total_hull_avail := ShipGrid.unplaced_expansion_cells + ShipGrid.free_unplaced_hull_cells
	_add_palette_entry("hull_cell", L.mod_name("hull_cell"), total_hull_avail)

	for mid in GameData.modules.keys():
		if mid in ["cockpit_mk1", "hull_cell"]:
			continue
		var arr: Array = ShipGrid.owned_equipment.get(mid, [])
		if not arr.is_empty():
			_add_palette_entry(mid, L.mod_name(mid), arr.size())

	# Populate Blueprint Load Dropdown
	_blueprint_opt.clear()
	for lname in ShipGrid.saved_layouts.keys():
		_blueprint_opt.add_item(str(lname))
	_bp_load_btn.disabled = (_blueprint_opt.item_count == 0)

	# Populate Structured Telemetry Stat Rows
	for ch in _telemetry_rows_vb.get_children():
		ch.queue_free()
	var st := ShipGrid.compute_ship_stats()
	var com: Vector3 = st["center_of_mass"]
	_add_telemetry_row(L.tr_ui("stat_modules"), "%d" % int(st["module_count"]), ThemeHelper.COL_CYAN)
	_add_telemetry_row(L.tr_ui("stat_balance"), "%.0f%%" % float(st["balance_score"]), ThemeHelper.COL_GOLD)
	_add_telemetry_row(L.tr_ui("stat_mass"), "%.1ft (+%.1ft)" % [float(st["total_mass"]), float(st["cargo_mass"])], Color(0.75, 0.90, 1.0))
	_add_telemetry_row(L.tr_ui("stat_com"), "(%.1f, %.1f, %.1f)m" % [com.x, com.y, com.z], ThemeHelper.COL_GOLD)
	_add_telemetry_row(L.tr_ui("stat_thrust"), "%.0f kN (%d)" % [float(st["total_thrust"]), int(st["engine_count"])], Color(1.0, 0.64, 0.34))
	_add_telemetry_row(L.tr_ui("stat_accel"), "%.1f m/s² • %.1f rad/s²" % [float(st["acceleration"]), float(st["angular_accel"])], Color(1.0, 0.72, 0.38))
	_add_telemetry_row(L.tr_ui("stat_hull_shield"), "%.0f / %.0f" % [float(st["total_hp"]), float(st["shield_cap"])], ThemeHelper.COL_EMERALD)
	_add_telemetry_row(L.tr_ui("stat_power"), "+%.0f / -%.0f MW" % [float(st["energy_regen"]), float(st["energy_draw"])], Color(1.0, 0.88, 0.35))
	_add_telemetry_row(L.tr_ui("stat_dps"), "%.0f / %.0f" % [float(st["mining_dps"]), float(st["weapon_dps"])], ThemeHelper.COL_CYAN)
	_add_telemetry_row(L.tr_ui("stat_magnet_cargo"), "%.0fm • %d/%d" % [float(st["magnet_range"]), ShipGrid.get_current_cargo_units(), int(st["cargo_capacity"])], Color(0.82, 0.58, 1.0))
	var bmag := float(st.get("bullet_magnet_range", 0.0))
	if bmag > 0.0:
		_add_telemetry_row(L.mod_name("magnetic_radar"), "%.0fm" % bmag, Color(0.98, 0.44, 1.0))

func _add_telemetry_row(lbl_txt: String, val_txt: String, val_col: Color) -> void:
	var box := PanelContainer.new()
	box.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.04, 0.075, 0.155, 0.88), Color(0.16, 0.42, 0.70, 0.42), 7, 9, 4))
	_telemetry_rows_vb.add_child(box)

	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 6)
	box.add_child(hb)

	var k := Label.new()
	k.text = lbl_txt
	k.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	k.clip_text = true
	k.add_theme_font_size_override("font_size", 12)
	k.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
	hb.add_child(k)

	var v := Label.new()
	v.text = val_txt
	if ThemeHelper.font_mono:
		v.add_theme_font_override("font", ThemeHelper.font_mono)
	v.add_theme_font_size_override("font_size", 13)
	v.add_theme_color_override("font_color", val_col)
	hb.add_child(v)

func _add_palette_entry(mid: String, label_str: String, qty: int) -> void:
	var btn := Button.new()
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.clip_text = true
	btn.custom_minimum_size = Vector2(0, 34)
	btn.text = "%s  (x%d)" % [label_str, qty]
	if selected_mod_id == mid and editor_mode == "place":
		ThemeHelper.style_accent_button(btn, Color(0.20, 0.78, 1.0))
	else:
		ThemeHelper.wire_button_fx(btn)
	btn.pressed.connect(func():
		selected_mod_id = mid
		editor_mode = "place"
		_update_hover_validation()
		_refresh_ghost_visual()
		_refresh_ui()
	)
	_palette_list.add_child(btn)

func _is_screen_pos_over_hud(screen_pos: Vector2) -> bool:
	if _station_panels.visible:
		return true
	for pnl in [_top_bar, _left_panel, _right_panel, _bottom_dock]:
		if is_instance_valid(pnl) and pnl.visible and pnl.get_global_rect().has_point(screen_pos):
			return true
	var hovered_ctrl := get_viewport().gui_get_hovered_control()
	if is_instance_valid(hovered_ctrl) and hovered_ctrl != _ui_root:
		return true
	return false

# ==============================================================================
# 3D RAYCAST INTERACTION, CAMERA ORBIT/PAN/ZOOM & ANIMATION LOOP
# ==============================================================================
func _process(delta: float) -> void:
	_anim_time += delta
	if is_instance_valid(_gantry_node):
		_gantry_node.position.z = -2.0 + sin(_anim_time * 0.45) * 6.5
	for i in range(_robot_arms.size()):
		if is_instance_valid(_robot_arms[i]):
			_robot_arms[i].rotation_degrees.y += sin(_anim_time * 1.1 + float(i) * 1.5) * delta * 6.0

	if _station_panels.visible:
		return

	var typing_text := is_instance_valid(_blueprint_le) and _blueprint_le.has_focus()
	if not typing_text:
		var pan := Vector3.ZERO
		if Input.is_key_pressed(KEY_W): pan.z -= 1.0
		if Input.is_key_pressed(KEY_S): pan.z += 1.0
		if Input.is_key_pressed(KEY_A): pan.x -= 1.0
		if Input.is_key_pressed(KEY_D): pan.x += 1.0
		if pan.length_squared() > 0.01:
			var yaw_basis := Basis(Vector3.UP, deg_to_rad(_goal_yaw))
			_goal_target += (yaw_basis * pan.normalized()) * delta * 11.0

		if Input.is_key_pressed(KEY_Q):
			_goal_yaw -= 75.0 * delta
		if Input.is_key_pressed(KEY_E):
			_goal_yaw += 75.0 * delta

	var cam_alpha := 1.0 - exp(-18.0 * delta)
	_cam_yaw = lerpf(_cam_yaw, _goal_yaw, cam_alpha)
	_cam_pitch = lerpf(_cam_pitch, _goal_pitch, cam_alpha)
	_cam_dist = lerpf(_cam_dist, _goal_dist, cam_alpha)
	_cam_target = _cam_target.lerp(_goal_target, cam_alpha)
	_apply_camera_transform()

func _unhandled_input(event: InputEvent) -> void:
	var typing_text := is_instance_valid(_blueprint_le) and _blueprint_le.has_focus()
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE and _station_panels.visible:
			_station_panels.close_panel()
			return
		if _station_panels.visible or typing_text:
			return
		if event.keycode == KEY_R:
			current_yaw = (current_yaw + 1) % 4
			AudioManager.play_sfx("ui_hover", 0.05, 0.45)
			_update_hover_validation()
			_refresh_ghost_visual()
		elif event.keycode == KEY_X:
			editor_mode = "remove" if editor_mode != "remove" else "place"
			_refresh_ghost_visual()
			_refresh_ui()
			_status_banner.text = L.tr_ui("status_remove_hint") if editor_mode == "remove" else L.tr_ui("status_place_hint")

	if _station_panels.visible:
		return

	if event is InputEventMouseButton:
		if not event.pressed:
			if event.button_index == MOUSE_BUTTON_RIGHT:
				_orbit_dragging = false
			elif event.button_index == MOUSE_BUTTON_MIDDLE:
				_pan_dragging = false
			return

		if _is_screen_pos_over_hud(event.position):
			return

		if typing_text:
			_blueprint_le.release_focus()

		if event.button_index == MOUSE_BUTTON_RIGHT:
			_orbit_dragging = true
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			_pan_dragging = true
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_goal_dist = clampf(_goal_dist - 1.6, 5.5, 36.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_goal_dist = clampf(_goal_dist + 1.6, 5.5, 36.0)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			_handle_left_click(event.position)

	elif event is InputEventMouseMotion:
		if _orbit_dragging:
			_goal_yaw -= event.relative.x * 0.36 * ThemeHelper.camera_sensitivity
			_goal_pitch = clampf(_goal_pitch - event.relative.y * 0.32 * ThemeHelper.camera_sensitivity, -85.0, 28.0)
		elif _pan_dragging:
			var right := _cam.global_transform.basis.x
			var up := _cam.global_transform.basis.y
			_goal_target -= (right * event.relative.x - up * event.relative.y) * 0.025
		elif not _is_screen_pos_over_hud(event.position):
			_update_mouse_ray(event.position)

func _update_mouse_ray(screen_pos: Vector2) -> void:
	var origin := _cam.project_ray_origin(screen_pos)
	var dir := _cam.project_ray_normal(screen_pos)
	var q := PhysicsRayQueryParameters3D.create(origin, origin + dir * 90.0)
	var hit := get_world_3d().direct_space_state.intersect_ray(q)

	if not hit.is_empty():
		var col: Object = hit["collider"]
		if col is Node and col.has_meta("station_tab"):
			var lkey := str(col.get_meta("station_loc_key"))
			_status_banner.text = L.tr_ui("status_click_station", [L.tr_ui(lkey)])
			return
		elif col is Node and col.has_meta("grid_uid"):
			var nrm: Vector3 = hit["normal"]
			var snap_n := Vector3i.ZERO
			if absf(nrm.x) >= absf(nrm.y) and absf(nrm.x) >= absf(nrm.z):
				snap_n = Vector3i(1 if nrm.x > 0 else -1, 0, 0)
			elif absf(nrm.y) >= absf(nrm.x) and absf(nrm.y) >= absf(nrm.z):
				snap_n = Vector3i(0, 1 if nrm.y > 0 else -1, 0)
			else:
				snap_n = Vector3i(0, 0, 1 if nrm.z > 0 else -1)

			var hit_pos: Vector3 = hit["position"]
			var local_hit: Vector3 = (hit_pos - _ship_preview_root.global_position) / ShipGrid.CELL_SIZE
			var hit_cell := Vector3i(
				int(round(local_hit.x - nrm.x * 0.25)),
				int(round(local_hit.y - nrm.y * 0.25)),
				int(round(local_hit.z - nrm.z * 0.25))
			)
			hovered_anchor = hit_cell if editor_mode == "remove" else (hit_cell + snap_n)
			_update_hover_validation()
			_refresh_ghost_visual()

func _update_hover_validation() -> void:
	if editor_mode == "remove":
		var rchk := ShipGrid.can_remove_at(hovered_anchor)
		hover_valid = bool(rchk["ok"])
		hover_reason = L.localize_reason(str(rchk.get("reason", "")))
		_status_banner.text = "%s (%d,%d,%d): %s" % [
			L.tr_ui("mode_remove"),
			hovered_anchor.x, hovered_anchor.y, hovered_anchor.z,
			(L.tr_ui("status_remove_hint") if hover_valid else hover_reason)
		]
	else:
		var chk := ShipGrid.validate_placement(selected_mod_id, hovered_anchor, current_yaw, false)
		hover_valid = bool(chk["ok"])
		hover_reason = L.localize_reason(str(chk["reason"]))
		_status_banner.text = "[%s] (%d,%d,%d): %s" % [
			L.mod_name(selected_mod_id),
			hovered_anchor.x, hovered_anchor.y, hovered_anchor.z,
			hover_reason
		]

func _handle_left_click(screen_pos: Vector2) -> void:
	var origin := _cam.project_ray_origin(screen_pos)
	var dir := _cam.project_ray_normal(screen_pos)
	var q := PhysicsRayQueryParameters3D.create(origin, origin + dir * 90.0)
	var hit := get_world_3d().direct_space_state.intersect_ray(q)
	if hit.is_empty():
		return
	var col: Object = hit["collider"]
	if col is Node and col.has_meta("station_tab"):
		var tab := str(col.get_meta("station_tab"))
		AudioManager.play_sfx("ui_click", 0.03, 0.78)
		_station_panels.standalone_settings_mode = false
		_station_panels.open_tab(tab)
		return

	_update_mouse_ray(screen_pos)
	if editor_mode == "remove":
		var res := ShipGrid.remove_module_at(hovered_anchor)
		if res["ok"]:
			AudioManager.play_sfx("module_remove", 0.04, 0.85)
			SaveManager.save_game()
		else:
			AudioManager.play_sfx("ui_error", 0.03, 0.7)
			_status_banner.text = L.localize_reason(str(res["reason"]))
	else:
		var res := ShipGrid.place_module(selected_mod_id, hovered_anchor, current_yaw)
		if res["ok"]:
			AudioManager.play_sfx("module_place", 0.04, 0.9)
			_rebuild_ship_3d_preview(int(res["uid"]))
			SaveManager.save_game()
			_refresh_ui()
		else:
			AudioManager.play_sfx("ui_error", 0.03, 0.7)
			_status_banner.text = L.localize_reason(str(res["reason"]))
