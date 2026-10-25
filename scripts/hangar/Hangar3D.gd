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

var _cam_pivot: Node3D
var _cam: Camera3D
var _cam_yaw: float = -32.0
var _cam_pitch: float = -22.0
var _cam_dist: float = 16.5
var _cam_target: Vector3 = Vector3(0, 0.5, 0)
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

# UI references
var _hud_layer: CanvasLayer
var _ui_root: Control
var _credits_lbl: Label
var _crystals_lbl: Label
var _crew_prog_lbl: Label
var _crew_prog_bar: ProgressBar
var _buy_cell_btn: Button
var _stats_rtl: RichTextLabel
var _palette_list: VBoxContainer
var _status_banner: Label
var _blueprint_le: LineEdit
var _blueprint_opt: OptionButton
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
	CrewManager.crew_changed.connect(_refresh_ui)
	UpgradeManager.upgrades_changed.connect(_refresh_ui)
	_on_ship_changed()

func _build_3d_hangar_environment() -> void:
	_env_root = Node3D.new()
	add_child(_env_root)

	# WorldEnvironment & Atmospheric Lighting
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

	# Textured PBR Hangar Deck Floor
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

	# Side & Rear Industrial Bulkhead Walls + Ceiling Ribs
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

	# Hydraulic Construction Platform at (0, -0.85, 0) so ship cells at y=0 sit right above deck
	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_platform.glb", Vector3(0, -0.95, 0), Vector3.ZERO)

	# Overhead Animated Gantry Crane
	_gantry_node = _spawn_glb(_env_root, "res://assets/models/hangar/hangar_gantry_crane.glb", Vector3(0, -0.8, -2.0), Vector3.ZERO)

	# 4 Articulated Robotic Arms around construction bay
	for rspec in [
		[Vector3(-11.5, -0.9, -7.5), 135.0],
		[Vector3(11.5, -0.9, -7.5), -135.0],
		[Vector3(-11.5, -0.9, 7.5), 45.0],
		[Vector3(11.5, -0.9, 7.5), -45.0],
	]:
		var arm := _spawn_glb(_env_root, "res://assets/models/hangar/hangar_robotic_arm.glb", rspec[0], Vector3(0, rspec[1], 0))
		if arm:
			_robot_arms.append(arm)

	# Industrial Cargo Container Stacks
	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_cargo_containers.glb", Vector3(-18.5, -0.9, 14.0), Vector3(0, 25, 0))
	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_cargo_containers.glb", Vector3(18.5, -0.9, 14.0), Vector3(0, -30, 0))

	# Orbital Launch Gate at -Z looking out into space starfield!
	_spawn_glb(_env_root, "res://assets/models/hangar/hangar_launch_gate.glb", Vector3(0, -0.9, -24.5), Vector3.ZERO)
	var gate_field := VFXFactory.create_holo_panel(Vector2(27.5, 13.8), Color(0.14, 0.72, 1.0, 0.36))
	gate_field.position = Vector3(0, 6.8, -24.5)
	_env_root.add_child(gate_field)

	# 6 Interactive 3D Hangar Stations around the platform!
	var stations := [
		["shop", "EQUIPMENT SHOP", Vector3(-15.5, -0.9, -3.5), 75.0, Color(0.22, 0.85, 1.0, 0.75)],
		["crew", "CREW TERMINAL", Vector3(-15.5, -0.9, 4.5), 105.0, Color(0.35, 1.0, 0.68, 0.75)],
		["packs", "CARD PACK STATION", Vector3(15.5, -0.9, -3.5), -75.0, Color(0.85, 0.42, 1.0, 0.75)],
		["upgrades", "UPGRADE MATRIX", Vector3(15.5, -0.9, 4.5), -105.0, Color(1.0, 0.78, 0.25, 0.75)],
		["achievements", "ACHIEVEMENT BOARD", Vector3(-8.5, -0.9, 15.5), 160.0, Color(1.0, 0.86, 0.32, 0.75)],
		["launch", "LAUNCH CONTROL", Vector3(8.5, -0.9, -15.5), -20.0, Color(0.25, 1.0, 0.75, 0.85)],
	]
	for st in stations:
		_create_interactive_station(st[0], st[1], st[2], st[3], st[4])

func _create_interactive_station(tab_id: String, title: String, pos: Vector3, yaw_deg: float, holo_col: Color) -> void:
	var sb := StaticBody3D.new()
	sb.position = pos
	sb.rotation_degrees = Vector3(0, yaw_deg, 0)
	sb.set_meta("station_tab", tab_id)
	_env_root.add_child(sb)

	var cshape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.8, 3.2, 2.2)
	cshape.shape = box
	cshape.position = Vector3(0, 1.6, 0)
	sb.add_child(cshape)

	_spawn_glb(sb, "res://assets/models/hangar/hangar_terminal_station.glb", Vector3.ZERO, Vector3.ZERO)

	var holo := VFXFactory.create_holo_panel(Vector2(2.1, 1.15), holo_col)
	holo.position = Vector3(0, 2.85, 0)
	sb.add_child(holo)

	var lbl3d := Label3D.new()
	lbl3d.text = title
	if ThemeHelper.font_display:
		lbl3d.font = ThemeHelper.font_display
	lbl3d.font_size = 40
	lbl3d.modulate = holo_col.lightened(0.35)
	lbl3d.outline_size = 8
	lbl3d.position = Vector3(0, 2.88, 0.06)
	lbl3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sb.add_child(lbl3d)

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
	_cam_pitch = clampf(_cam_pitch, -78.0, -6.0)
	_cam_dist = clampf(_cam_dist, 6.0, 34.0)
	_cam_target.x = clampf(_cam_target.x, -12.0, 12.0)
	_cam_target.y = clampf(_cam_target.y, -0.5, 6.0)
	_cam_target.z = clampf(_cam_target.z, -12.0, 12.0)

	_cam_pivot.position = _cam_target
	_cam_pivot.rotation_degrees = Vector3(_cam_pitch, _cam_yaw, 0.0)
	_cam.position = Vector3(0, 0, _cam_dist)
	# Prevent floor clipping
	if _cam.global_position.y < 0.6:
		_cam.global_position.y = 0.6

func _build_ship_and_gizmos() -> void:
	_ship_preview_root = Node3D.new()
	_ship_preview_root.position = Vector3(0, 1.05, 0)
	add_child(_ship_preview_root)

	_ghost_root = Node3D.new()
	_ship_preview_root.add_child(_ghost_root)

	# 3D Center-of-Mass Visualization Gizmo (Amber Core + XYZ Crosshairs)
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

		# Click/raycast collision shape per occupied cell in local space of holder
		var cells: Array = e["cells"]
		for c in cells:
			var cs := CollisionShape3D.new()
			var bx := BoxShape3D.new()
			bx.size = Vector3.ONE * (ShipGrid.CELL_SIZE * 0.98)
			cs.shape = bx
			# Transform world cell diff back into holder's rotated local coordinates
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
# HANGAR & 3D SHIP EDITOR UI
# ==============================================================================
func _build_hangar_ui() -> void:
	_hud_layer = CanvasLayer.new()
	add_child(_hud_layer)

	_ui_root = Control.new()
	_ui_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_ui_root.theme = ThemeHelper.main_theme
	_ui_root.mouse_filter = Control.MOUSE_FILTER_PASS
	_hud_layer.add_child(_ui_root)

	# 1. Top Navigation & Currency Dock Bar
	var top_bar := PanelContainer.new()
	top_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top_bar.offset_bottom = 62
	top_bar.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.03, 0.055, 0.115, 0.95), Color(0.18, 0.68, 0.95), 0, 2))
	_ui_root.add_child(top_bar)

	var thb := HBoxContainer.new()
	thb.add_theme_constant_override("separation", 10)
	top_bar.add_child(thb)

	var menu_btn := Button.new()
	menu_btn.text = "MAIN MENU"
	ThemeHelper.wire_button_fx(menu_btn)
	menu_btn.pressed.connect(func():
		SaveManager.save_game()
		request_main_menu.emit()
	)
	thb.add_child(menu_btn)

	# Currency badges with custom icons
	_credits_lbl = _create_icon_stat(thb, "res://assets/icons/ui/icon_credits.png", Color(1.0, 0.82, 0.28))
	_crystals_lbl = _create_icon_stat(thb, "res://assets/icons/ui/icon_crystals.png", Color(0.32, 0.92, 1.0))

	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	thb.add_child(sp)

	var nav_items := [
		["shop", "EQUIPMENT SHOP", Color(0.18, 0.68, 0.95)],
		["crew", "CREW CARDS", Color(0.22, 0.80, 0.56)],
		["packs", "CARD PACKS", Color(0.75, 0.36, 0.98)],
		["upgrades", "UPGRADES", Color(0.95, 0.68, 0.18)],
		["achievements", "ACHIEVEMENTS", Color(0.95, 0.78, 0.24)],
		["settings", "SETTINGS", Color(0.45, 0.58, 0.74)],
		["launch", "LAUNCH EXPEDITION", Color(0.16, 0.85, 0.54)],
	]
	for item in nav_items:
		var nb := Button.new()
		nb.text = item[1]
		ThemeHelper.style_accent_button(nb, item[2])
		var tid: String = item[0]
		nb.pressed.connect(func(): _station_panels.open_tab(tid))
		thb.add_child(nb)

	# 2. Left Panel: Ship Expansion Economy, Module Palette & Blueprints
	var left_panel := PanelContainer.new()
	left_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	left_panel.offset_left = 14
	left_panel.offset_right = 344
	left_panel.offset_top = 74
	left_panel.offset_bottom = 886
	_ui_root.add_child(left_panel)

	var lvb := VBoxContainer.new()
	lvb.add_theme_constant_override("separation", 8)
	left_panel.add_child(lvb)

	var ed_title := Label.new()
	ed_title.text = "3D SHIP CONSTRUCTOR"
	if ThemeHelper.font_display:
		ed_title.add_theme_font_override("font", ThemeHelper.font_display)
	ed_title.add_theme_font_size_override("font_size", 19)
	ed_title.add_theme_color_override("font_color", Color(0.42, 0.92, 1.0))
	lvb.add_child(ed_title)

	_buy_cell_btn = Button.new()
	_buy_cell_btn.custom_minimum_size = Vector2(0, 42)
	ThemeHelper.style_accent_button(_buy_cell_btn, Color(0.95, 0.68, 0.16))
	_buy_cell_btn.pressed.connect(func():
		if ShipGrid.purchase_expansion_cell():
			AudioManager.play_sfx("buy_upgrade", 0.04, 0.85)
			selected_mod_id = "hull_cell"
			editor_mode = "place"
			SaveManager.save_game()
			_refresh_ui()
		else:
			_status_banner.text = "Insufficient Credits to purchase Expansion Cell!"
			AudioManager.play_sfx("ui_error", 0.04, 0.7)
	)
	lvb.add_child(_buy_cell_btn)

	_crew_prog_lbl = Label.new()
	_crew_prog_lbl.add_theme_font_size_override("font_size", 15)
	lvb.add_child(_crew_prog_lbl)

	_crew_prog_bar = ProgressBar.new()
	_crew_prog_bar.max_value = 10.0
	_crew_prog_bar.show_percentage = false
	_crew_prog_bar.custom_minimum_size = Vector2(0, 14)
	lvb.add_child(_crew_prog_bar)

	# Place / Remove / Rotate toolbar
	var tool_hb := HBoxContainer.new()
	tool_hb.add_theme_constant_override("separation", 6)
	lvb.add_child(tool_hb)

	var btn_place := Button.new()
	btn_place.text = "PLACE"
	btn_place.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ThemeHelper.style_accent_button(btn_place, Color(0.18, 0.74, 0.52))
	btn_place.pressed.connect(func():
		editor_mode = "place"
		_refresh_ghost_visual()
		_refresh_ui()
	)
	tool_hb.add_child(btn_place)

	var btn_rem := Button.new()
	btn_rem.text = "REMOVE [X]"
	btn_rem.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ThemeHelper.style_accent_button(btn_rem, Color(0.86, 0.34, 0.34))
	btn_rem.pressed.connect(func():
		editor_mode = "remove" if editor_mode != "remove" else "place"
		_refresh_ghost_visual()
		_refresh_ui()
	)
	tool_hb.add_child(btn_rem)

	var btn_rot := Button.new()
	btn_rot.text = "ROT [R]"
	ThemeHelper.wire_button_fx(btn_rot)
	btn_rot.pressed.connect(func():
		current_yaw = (current_yaw + 1) % 4
		_update_hover_validation()
		_refresh_ghost_visual()
	)
	tool_hb.add_child(btn_rot)

	var pal_lbl := Label.new()
	pal_lbl.text = "OWNED MODULES (CLICK TO INSTALL):"
	pal_lbl.add_theme_font_size_override("font_size", 15)
	pal_lbl.add_theme_color_override("font_color", Color(0.68, 0.84, 0.98))
	lvb.add_child(pal_lbl)

	var p_sc := ScrollContainer.new()
	p_sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lvb.add_child(p_sc)

	_palette_list = VBoxContainer.new()
	_palette_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_palette_list.add_theme_constant_override("separation", 6)
	p_sc.add_child(_palette_list)

	# Blueprint Save/Load Footer
	var bp_hb := HBoxContainer.new()
	bp_hb.add_theme_constant_override("separation", 6)
	lvb.add_child(bp_hb)

	_blueprint_le = LineEdit.new()
	_blueprint_le.placeholder_text = "Layout Name..."
	_blueprint_le.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bp_hb.add_child(_blueprint_le)

	var bp_save := Button.new()
	bp_save.text = "SAVE"
	ThemeHelper.wire_button_fx(bp_save)
	bp_save.pressed.connect(func():
		var nm := _blueprint_le.text.strip_edges()
		if nm.is_empty():
			nm = "Layout_%d" % (ShipGrid.saved_layouts.size() + 1)
		if ShipGrid.save_named_layout(nm):
			SaveManager.save_game()
			_status_banner.text = "Saved ship layout '%s'." % nm
			_refresh_ui()
	)
	bp_hb.add_child(bp_save)

	# 3. Right Panel: Real-Time Physical Ship Telemetry & Center of Mass
	var right_panel := PanelContainer.new()
	right_panel.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	right_panel.offset_left = -336
	right_panel.offset_right = -14
	right_panel.offset_top = 74
	right_panel.offset_bottom = 560
	_ui_root.add_child(right_panel)

	var rvb := VBoxContainer.new()
	rvb.add_theme_constant_override("separation", 8)
	right_panel.add_child(rvb)

	var rt := Label.new()
	rt.text = "SHIP TELEMETRY & PHYSICS"
	if ThemeHelper.font_display:
		rt.add_theme_font_override("font", ThemeHelper.font_display)
	rt.add_theme_font_size_override("font_size", 18)
	rt.add_theme_color_override("font_color", Color(1.0, 0.82, 0.34))
	rvb.add_child(rt)

	_stats_rtl = RichTextLabel.new()
	_stats_rtl.bbcode_enabled = true
	_stats_rtl.fit_content = false
	_stats_rtl.size_flags_vertical = Control.SIZE_EXPAND_FILL
	if ThemeHelper.font_mono:
		_stats_rtl.add_theme_font_override("normal_font", ThemeHelper.font_mono)
	_stats_rtl.add_theme_font_size_override("normal_font_size", 15)
	rvb.add_child(_stats_rtl)

	var cam_help := Label.new()
	cam_help.text = "RMB Drag: Orbit • MMB/WASD: Pan • Scroll: Zoom\nLMB: Snap Module / Open 3D Terminal • R: Rotate"
	cam_help.add_theme_font_size_override("font_size", 13)
	cam_help.add_theme_color_override("font_color", Color(0.62, 0.78, 0.92))
	rvb.add_child(cam_help)

	# 4. Bottom Center Placement Status Banner
	var bot_bar := PanelContainer.new()
	bot_bar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	bot_bar.grow_horizontal = Control.GROW_DIRECTION_BOTH
	bot_bar.offset_left = -310
	bot_bar.offset_right = 310
	bot_bar.offset_top = -58
	bot_bar.offset_bottom = -12
	_ui_root.add_child(bot_bar)

	_status_banner = Label.new()
	_status_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_banner.text = "Hover any ship module face to attach hardware, or click a 3D Hangar Terminal."
	bot_bar.add_child(_status_banner)

	# 5. Station Modal Panels
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

func _create_icon_stat(parent: HBoxContainer, icon_path: String, col: Color) -> Label:
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 6)
	parent.add_child(hb)
	var ic := TextureRect.new()
	ic.custom_minimum_size = Vector2(28, 28)
	ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if ResourceLoader.exists(icon_path):
		ic.texture = load(icon_path)
	hb.add_child(ic)
	var l := Label.new()
	if ThemeHelper.font_bold:
		l.add_theme_font_override("font", ThemeHelper.font_bold)
	l.add_theme_font_size_override("font_size", 21)
	l.add_theme_color_override("font_color", col)
	hb.add_child(l)
	return l

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

	_buy_cell_btn.text = "BUY EXPANSION CELL (%d CR)" % ShipGrid.get_next_cell_price()
	var c_slots := ShipGrid.get_unlocked_crew_slots()
	var c_prog := ShipGrid.get_cells_toward_next_crew_slot()
	_crew_prog_lbl.text = "Crew Slots: %d  (Purchased Cells: %d • Next Slot: %d/10)" % [c_slots, ShipGrid.purchased_expansion_cells, c_prog]
	_crew_prog_bar.value = float(c_prog)

	# Populate Owned Module Palette
	for ch in _palette_list.get_children():
		ch.queue_free()

	var total_hull_avail := ShipGrid.unplaced_expansion_cells + ShipGrid.free_unplaced_hull_cells
	_add_palette_entry("hull_cell", "Structural Hull Cell", total_hull_avail)

	for mid in GameData.modules.keys():
		if mid in ["cockpit_mk1", "hull_cell"]:
			continue
		var arr: Array = ShipGrid.owned_equipment.get(mid, [])
		if not arr.is_empty():
			_add_palette_entry(mid, str(GameData.modules[mid]["name"]), arr.size())

	# Update Telemetry Readout
	var st := ShipGrid.compute_ship_stats()
	var com: Vector3 = st["center_of_mass"]
	_stats_rtl.text = (
		"[color=#7be8ff]MODULES:[/color] %d   [color=#ffd666]BALANCE:[/color] %.0f%%\n" % [int(st["module_count"]), float(st["balance_score"])]
		+ "[color=#7be8ff]MASS:[/color] %.1f t (Cargo %.1f t)\n" % [float(st["total_mass"]), float(st["cargo_mass"])]
		+ "[color=#ffd666]CENTER OF MASS:[/color] (%.1f, %.1f, %.1f)m\n" % [com.x, com.y, com.z]
		+ "[color=#ff9d5c]THRUST:[/color] %.0f kN (%d Engines)\n" % [float(st["total_thrust"]), int(st["engine_count"])]
		+ "[color=#ff9d5c]ACCEL / TURN:[/color] %.1f m/s² / %.1f rad/s²\n" % [float(st["acceleration"]), float(st["angular_accel"])]
		+ "[color=#6aff9d]HULL / SHIELD:[/color] %.0f / %.0f\n" % [float(st["total_hp"]), float(st["shield_cap"])]
		+ "[color=#ffe45e]POWER GEN / DRAW:[/color] +%.0f / -%.0f MW\n" % [float(st["energy_regen"]), float(st["energy_draw"])]
		+ "[color=#5ceeff]MINING / WEAPON DPS:[/color] %.0f / %.0f\n" % [float(st["mining_dps"]), float(st["weapon_dps"])]
		+ "[color=#c98bff]MAGNET / CARGO:[/color] %.0fm / %d/%d u" % [float(st["magnet_range"]), ShipGrid.get_current_cargo_units(), int(st["cargo_capacity"])]
	)

func _add_palette_entry(mid: String, label_str: String, qty: int) -> void:
	var btn := Button.new()
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
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

# ==============================================================================
# 3D RAYCAST INTERACTION, CAMERA ORBIT/PAN/ZOOM & ANIMATION LOOP
# ==============================================================================
func _process(delta: float) -> void:
	_anim_time += delta
	# Animate overhead gantry crane & robotic maintenance arms
	if is_instance_valid(_gantry_node):
		_gantry_node.position.z = -2.0 + sin(_anim_time * 0.45) * 6.5
	for i in range(_robot_arms.size()):
		if is_instance_valid(_robot_arms[i]):
			_robot_arms[i].rotation_degrees.y += sin(_anim_time * 1.1 + float(i) * 1.5) * delta * 6.0

	if _station_panels.visible:
		return

	# Smooth WASD / Q-E Hangar Editor Camera Pan & Orbit
	var pan := Vector3.ZERO
	if Input.is_key_pressed(KEY_W): pan.z -= 1.0
	if Input.is_key_pressed(KEY_S): pan.z += 1.0
	if Input.is_key_pressed(KEY_A): pan.x -= 1.0
	if Input.is_key_pressed(KEY_D): pan.x += 1.0
	if pan.length_squared() > 0.01:
		var yaw_basis := Basis(Vector3.UP, deg_to_rad(_cam_yaw))
		_cam_target += (yaw_basis * pan.normalized()) * delta * 10.0
		_apply_camera_transform()

	if Input.is_key_pressed(KEY_Q):
		_cam_yaw -= 55.0 * delta
		_apply_camera_transform()
	if Input.is_key_pressed(KEY_E):
		_cam_yaw += 55.0 * delta
		_apply_camera_transform()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE and _station_panels.visible:
			_station_panels.close_panel()
			return
		if _station_panels.visible:
			return
		if event.keycode == KEY_R:
			current_yaw = (current_yaw + 1) % 4
			AudioManager.play_sfx("ui_hover", 0.06, 0.6)
			_update_hover_validation()
			_refresh_ghost_visual()
		elif event.keycode == KEY_X:
			editor_mode = "remove" if editor_mode != "remove" else "place"
			_refresh_ghost_visual()
			_status_banner.text = "REMOVE MODE: Click an installed module to detach it." if editor_mode == "remove" else "PLACE MODE: Hover a module face to attach."

	if _station_panels.visible:
		return

	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			_orbit_dragging = event.pressed
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			_pan_dragging = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			_cam_dist -= 1.4
			_apply_camera_transform()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			_cam_dist += 1.4
			_apply_camera_transform()
		elif event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_handle_left_click(event.position)

	elif event is InputEventMouseMotion:
		if _orbit_dragging:
			_cam_yaw -= event.relative.x * 0.32 * ThemeHelper.camera_sensitivity
			_cam_pitch -= event.relative.y * 0.28 * ThemeHelper.camera_sensitivity
			_apply_camera_transform()
		elif _pan_dragging:
			var right := _cam.global_transform.basis.x
			var up := _cam.global_transform.basis.y
			_cam_target -= (right * event.relative.x - up * event.relative.y) * 0.025
			_apply_camera_transform()
		else:
			_update_mouse_ray(event.position)

func _update_mouse_ray(screen_pos: Vector2) -> void:
	var origin := _cam.project_ray_origin(screen_pos)
	var dir := _cam.project_ray_normal(screen_pos)
	var q := PhysicsRayQueryParameters3D.create(origin, origin + dir * 90.0)
	var hit := get_world_3d().direct_space_state.intersect_ray(q)

	if not hit.is_empty():
		var col: Object = hit["collider"]
		if col is Node and col.has_meta("station_tab"):
			var st_tab := str(col.get_meta("station_tab"))
			_status_banner.text = "Click 3D Terminal to open %s" % st_tab.to_upper()
			return
		elif col is Node and col.has_meta("grid_uid"):
			var nrm: Vector3 = hit["normal"]
			# Snap normal to nearest cardinal grid face
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
		hover_reason = str(rchk.get("reason", "Click to remove module."))
		_status_banner.text = "REMOVE (%d,%d,%d): %s" % [hovered_anchor.x, hovered_anchor.y, hovered_anchor.z, ("Ready to detach" if hover_valid else hover_reason)]
	else:
		var chk := ShipGrid.validate_placement(selected_mod_id, hovered_anchor, current_yaw, false)
		hover_valid = bool(chk["ok"])
		hover_reason = str(chk["reason"])
		_status_banner.text = "BUILD [%s] at (%d,%d,%d): %s" % [selected_mod_id, hovered_anchor.x, hovered_anchor.y, hovered_anchor.z, hover_reason]

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
		AudioManager.play_sfx("ui_click", 0.03, 0.8)
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
			_status_banner.text = str(res["reason"])
	else:
		var res := ShipGrid.place_module(selected_mod_id, hovered_anchor, current_yaw)
		if res["ok"]:
			AudioManager.play_sfx("module_place", 0.04, 0.9)
			_rebuild_ship_3d_preview(int(res["uid"]))
			SaveManager.save_game()
			_refresh_ui()
		else:
			AudioManager.play_sfx("ui_error", 0.03, 0.7)
			_status_banner.text = str(res["reason"])
