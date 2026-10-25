extends Node

var _active_world: Node = null
var _menu_world: Node3D = null
var _menu_ship_spin: Node3D = null
var _menu_asteroids: Array[Node3D] = []
var _menu_layer: CanvasLayer = null
var _settings_overlay: HangarStationPanels = null
var _new_game_confirm: PanelContainer = null
var _fade_layer: CanvasLayer = null
var _fade_rect: ColorRect = null
var _menu_clock: float = 0.0

# Live-localized Main Menu label/button refs
var _tagline_lbl: Label = null
var _summary_lbl: Label = null
var _play_btn: Button = null
var _quick_btn: Button = null
var _set_btn: Button = null
var _new_btn: Button = null
var _quit_btn: Button = null
var _ver_lbl: Label = null
var _confirm_lbl: Label = null
var _confirm_yes: Button = null
var _confirm_no: Button = null

func _ready() -> void:
	DisplayServer.window_set_title("SPACE MINER: BUILD & CONQUER")
	ThemeHelper.apply_graphics_preset(ThemeHelper.graphics_preset)
	_build_transition_curtain()
	L.language_changed.connect(func(_lang: String): _refresh_menu_texts())

	var all_args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	for arg in all_args:
		if arg == "--self-test":
			_run_packaged_exe_self_test()
			return

	_show_main_menu()

func _build_transition_curtain() -> void:
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 90
	add_child(_fade_layer)
	_fade_rect = ColorRect.new()
	_fade_layer.add_child(_fade_rect)
	ThemeHelper.fill_full_rect(_fade_rect)
	_fade_rect.color = Color(0.01, 0.02, 0.05, 0.0)
	_fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

func _pulse_scene_curtain() -> void:
	if ThemeHelper.reduced_motion or not is_instance_valid(_fade_rect):
		return
	_fade_rect.color.a = 0.65
	var tw := create_tween()
	tw.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.tween_property(_fade_rect, "color:a", 0.0, 0.34)

func _process(delta: float) -> void:
	_menu_clock += delta
	if is_instance_valid(_menu_ship_spin):
		_menu_ship_spin.rotate_y(delta * 0.34)
		_menu_ship_spin.position.y = 0.25 + sin(_menu_clock * 1.35) * 0.22
	for i in range(_menu_asteroids.size()):
		var a := _menu_asteroids[i]
		if is_instance_valid(a):
			a.rotate_y(delta * (0.12 + float(i) * 0.05))
			a.rotate_x(delta * 0.06)

func _clear_current_mode() -> void:
	if is_instance_valid(_active_world):
		_active_world.queue_free()
		_active_world = null
	if is_instance_valid(_menu_world):
		_menu_world.queue_free()
		_menu_world = null
	if is_instance_valid(_menu_layer):
		_menu_layer.queue_free()
		_menu_layer = null
	_menu_ship_spin = null
	_menu_asteroids.clear()

func _show_main_menu() -> void:
	_clear_current_mode()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	AudioManager.play_ambient("amb_hangar")
	_pulse_scene_curtain()

	# 3D Live Diorama Backdrop for Main Menu
	_menu_world = Node3D.new()
	add_child(_menu_world)

	var we := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var smat := ProceduralSkyMaterial.new()
	smat.sky_top_color = Color(0.015, 0.032, 0.085)
	smat.sky_horizon_color = Color(0.065, 0.19, 0.36)
	smat.ground_bottom_color = Color(0.01, 0.02, 0.05)
	smat.ground_horizon_color = Color(0.05, 0.14, 0.28)
	sky.sky_material = smat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.24, 0.35, 0.52)
	env.glow_enabled = true
	env.glow_intensity = 0.72
	we.environment = env
	_menu_world.add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = Color(0.96, 0.93, 0.86)
	sun.light_energy = 1.65
	sun.rotation_degrees = Vector3(-34, 42, 0)
	_menu_world.add_child(sun)

	var rim := OmniLight3D.new()
	rim.position = Vector3(7.5, 3.0, -4.0)
	rim.light_color = Color(0.24, 0.85, 1.0)
	rim.light_energy = 2.4
	rim.omni_range = 24.0
	_menu_world.add_child(rim)

	var cam := Camera3D.new()
	cam.look_at_from_position(Vector3(5.6, 3.9, 12.6), Vector3(1.9, 0.3, 0.0), Vector3.UP)
	cam.fov = 53.0
	_menu_world.add_child(cam)

	_menu_ship_spin = Node3D.new()
	_menu_ship_spin.position = Vector3(3.6, 0.25, 0.0)
	_menu_world.add_child(_menu_ship_spin)

	for uid in ShipGrid.placed_modules.keys():
		var e: Dictionary = ShipGrid.placed_modules[uid]
		var mid: String = e["mod_id"]
		if GameData.modules.has(mid) and ResourceLoader.exists(GameData.modules[mid]["model_path"]):
			var ps: PackedScene = load(GameData.modules[mid]["model_path"])
			if ps:
				var inst: Node3D = ps.instantiate()
				inst.position = Vector3(e["anchor"].x, e["anchor"].y, e["anchor"].z) * ShipGrid.CELL_SIZE
				inst.rotation_degrees = Vector3(0, float(e["yaw"]) * 90.0, 0)
				_menu_ship_spin.add_child(inst)

	if ResourceLoader.exists("res://assets/models/asteroids/ast_crystal_geode.glb"):
		var aps: PackedScene = load("res://assets/models/asteroids/ast_crystal_geode.glb")
		for pos_sc in [
			[Vector3(-8, 3, -14), 1.8],
			[Vector3(14, -3, -18), 2.4],
			[Vector3(9, 6, -24), 1.6],
		]:
			var a: Node3D = aps.instantiate()
			a.position = pos_sc[0]
			a.scale = Vector3.ONE * float(pos_sc[1])
			_menu_world.add_child(a)
			_menu_asteroids.append(a)

	# Main Menu UI Overlay (100% responsive from 1280x720 to 4K)
	_menu_layer = CanvasLayer.new()
	add_child(_menu_layer)

	var root := Control.new()
	_menu_layer.add_child(root)
	ThemeHelper.fill_full_rect(root)
	root.theme = ThemeHelper.main_theme

	# Top-Right Floating Language Pill
	var lang_bar := PanelContainer.new()
	lang_bar.anchor_left = 1.0
	lang_bar.anchor_right = 1.0
	lang_bar.anchor_top = 0.0
	lang_bar.anchor_bottom = 0.0
	lang_bar.offset_left = -316
	lang_bar.offset_right = -28
	lang_bar.offset_top = 22
	lang_bar.offset_bottom = 72
	lang_bar.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.025, 0.05, 0.115, 0.94), Color(0.24, 0.78, 1.0, 0.80), 12, 12, 7))
	root.add_child(lang_bar)

	var lhb := HBoxContainer.new()
	lhb.alignment = BoxContainer.ALIGNMENT_CENTER
	lhb.add_theme_constant_override("separation", 8)
	lang_bar.add_child(lhb)

	var globe := Label.new()
	globe.text = "◈"
	globe.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	globe.add_theme_font_size_override("font_size", 18)
	lhb.add_child(globe)
	lhb.add_child(ThemeHelper.make_language_dropdown(false))

	# Left Command Card — Anchored Top-to-Bottom so it NEVER clips at 720p or 1080p!
	var left_card := PanelContainer.new()
	left_card.anchor_left = 0.0
	left_card.anchor_right = 0.0
	left_card.anchor_top = 0.0
	left_card.anchor_bottom = 1.0
	left_card.offset_left = 44
	left_card.offset_right = 564
	left_card.offset_top = 24
	left_card.offset_bottom = -24
	left_card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.024, 0.046, 0.108, 0.93), Color(0.22, 0.78, 1.0, 0.88), 16, 2, 18))
	root.add_child(left_card)

	var sc := ScrollContainer.new()
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left_card.add_child(sc)

	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 11)
	sc.add_child(vb)

	var logo := TextureRect.new()
	logo.custom_minimum_size = Vector2(440, 124)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if ResourceLoader.exists("res://assets/branding/logo_main.png"):
		logo.texture = load("res://assets/branding/logo_main.png")
	vb.add_child(logo)

	_tagline_lbl = Label.new()
	_tagline_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_tagline_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_tagline_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_tagline_lbl.custom_minimum_size = Vector2(400, 0)
	_tagline_lbl.add_theme_font_size_override("font_size", 13)
	_tagline_lbl.add_theme_color_override("font_color", Color(0.66, 0.86, 1.0))
	vb.add_child(_tagline_lbl)

	var stat_pill := PanelContainer.new()
	stat_pill.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stat_pill.custom_minimum_size = Vector2(400, 0)
	stat_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.05, 0.095, 0.19, 0.92), Color(1.0, 0.78, 0.25, 0.55), 10, 14, 6))
	vb.add_child(stat_pill)

	_summary_lbl = Label.new()
	_summary_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_summary_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_summary_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_summary_lbl.custom_minimum_size = Vector2(372, 0)
	if ThemeHelper.font_bold:
		_summary_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_summary_lbl.add_theme_font_size_override("font_size", 14)
	_summary_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	stat_pill.add_child(_summary_lbl)

	_play_btn = Button.new()
	_play_btn.custom_minimum_size = Vector2(390, 50)
	_play_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(_play_btn, Color(0.16, 0.82, 0.54))
	_play_btn.pressed.connect(_enter_hangar)
	vb.add_child(_play_btn)

	_quick_btn = Button.new()
	_quick_btn.custom_minimum_size = Vector2(390, 44)
	_quick_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(_quick_btn, Color(0.20, 0.70, 0.96))
	_quick_btn.pressed.connect(func(): _launch_space_sector(0))
	vb.add_child(_quick_btn)

	_set_btn = Button.new()
	_set_btn.custom_minimum_size = Vector2(390, 42)
	_set_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.wire_button_fx(_set_btn)
	_set_btn.pressed.connect(func():
		_settings_overlay.standalone_settings_mode = true
		_settings_overlay.open_tab("settings")
	)
	vb.add_child(_set_btn)

	_new_btn = Button.new()
	_new_btn.custom_minimum_size = Vector2(390, 40)
	_new_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.wire_button_fx(_new_btn)
	_new_btn.pressed.connect(func():
		_new_game_confirm.visible = true
		ThemeHelper.animate_entry(_new_game_confirm, 0.0, Vector2(0.92, 0.92))
	)
	vb.add_child(_new_btn)

	_quit_btn = Button.new()
	_quit_btn.custom_minimum_size = Vector2(390, 40)
	_quit_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(_quit_btn, Color(0.78, 0.30, 0.34))
	_quit_btn.pressed.connect(func():
		SaveManager.save_game()
		get_tree().quit()
	)
	vb.add_child(_quit_btn)

	_ver_lbl = Label.new()
	_ver_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_ver_lbl.add_theme_font_size_override("font_size", 12)
	_ver_lbl.add_theme_color_override("font_color", Color(0.48, 0.64, 0.80))
	vb.add_child(_ver_lbl)

	# New Career Confirmation Dialog
	_new_game_confirm = PanelContainer.new()
	_new_game_confirm.visible = false
	_new_game_confirm.set_anchors_preset(Control.PRESET_CENTER)
	_new_game_confirm.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_new_game_confirm.grow_vertical = Control.GROW_DIRECTION_BOTH
	_new_game_confirm.offset_left = -240
	_new_game_confirm.offset_right = 240
	_new_game_confirm.offset_top = -110
	_new_game_confirm.offset_bottom = 110
	_new_game_confirm.custom_minimum_size = Vector2(480, 220)
	_new_game_confirm.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.03, 0.055, 0.125, 0.98), ThemeHelper.COL_RED, 16, 2, 20))
	root.add_child(_new_game_confirm)

	var nvb := VBoxContainer.new()
	nvb.alignment = BoxContainer.ALIGNMENT_CENTER
	nvb.add_theme_constant_override("separation", 18)
	_new_game_confirm.add_child(nvb)

	_confirm_lbl = Label.new()
	_confirm_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_confirm_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_confirm_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_confirm_lbl.custom_minimum_size = Vector2(420, 0)
	nvb.add_child(_confirm_lbl)

	var nhb := HBoxContainer.new()
	nhb.alignment = BoxContainer.ALIGNMENT_CENTER
	nhb.add_theme_constant_override("separation", 18)
	nvb.add_child(nhb)

	_confirm_yes = Button.new()
	_confirm_yes.custom_minimum_size = Vector2(180, 42)
	ThemeHelper.style_accent_button(_confirm_yes, Color(0.88, 0.30, 0.32))
	_confirm_yes.pressed.connect(func():
		SaveManager.reset_all_progress()
		_enter_hangar()
	)
	nhb.add_child(_confirm_yes)

	_confirm_no = Button.new()
	_confirm_no.custom_minimum_size = Vector2(150, 42)
	ThemeHelper.wire_button_fx(_confirm_no)
	_confirm_no.pressed.connect(func(): _new_game_confirm.visible = false)
	nhb.add_child(_confirm_no)

	_settings_overlay = HangarStationPanels.new()
	_settings_overlay.standalone_settings_mode = true
	root.add_child(_settings_overlay)

	_refresh_menu_texts()
	ThemeHelper.animate_entry(left_card, 0.02, Vector2(0.95, 0.95))
	ThemeHelper.animate_entry(lang_bar, 0.08, Vector2(0.94, 0.94))

func _refresh_menu_texts() -> void:
	if not is_instance_valid(_tagline_lbl):
		return
	_tagline_lbl.text = L.tr_ui("menu_tagline")
	_summary_lbl.text = L.tr_ui("menu_commander_status", [
		ShipGrid.credits, ShipGrid.crystals, CrewManager.get_unique_owned_count()
	])
	_play_btn.text = L.tr_ui("menu_enter_hangar")
	_quick_btn.text = L.tr_ui("menu_quick_launch")
	_set_btn.text = L.tr_ui("menu_settings")
	_new_btn.text = L.tr_ui("menu_new_career")
	_quit_btn.text = L.tr_ui("menu_exit")
	_ver_lbl.text = L.tr_ui("menu_version")
	_confirm_lbl.text = L.tr_ui("menu_reset_confirm")
	_confirm_yes.text = L.tr_ui("menu_reset_yes")
	_confirm_no.text = L.tr_ui("cancel")

func _enter_hangar() -> void:
	_clear_current_mode()
	_pulse_scene_curtain()
	var hangar := Hangar3D.new()
	hangar.request_launch_expedition.connect(_launch_space_sector)
	hangar.request_main_menu.connect(_show_main_menu)
	add_child(hangar)
	_active_world = hangar

func _launch_space_sector(sector_idx: int) -> void:
	_clear_current_mode()
	_pulse_scene_curtain()
	var exp_scene := SpaceExpedition3D.new()
	exp_scene.setup_sector(sector_idx)
	exp_scene.return_to_hangar.connect(_enter_hangar)
	add_child(exp_scene)
	_active_world = exp_scene

func _run_packaged_exe_self_test() -> void:
	print("=== RUNNING PACKAGED RUNTIME VERIFICATION (v2.0.1) ===")
	_show_main_menu()
	await get_tree().process_frame
	await get_tree().process_frame

	# Verify live 10-language switching in Main Menu
	for code in L.LANG_ORDER:
		L.set_language(code)
	L.set_language("ru")
	await get_tree().process_frame

	_enter_hangar()
	await get_tree().process_frame
	await get_tree().process_frame

	if _active_world is Hangar3D:
		var hw := _active_world as Hangar3D
		for tab in ["shop", "crew", "packs", "upgrades", "achievements", "launch", "settings"]:
			hw._station_panels.open_tab(tab)
			await get_tree().process_frame
			await get_tree().process_frame
			if hw._station_panels._body_root.size.x < 600.0 or hw._station_panels._body_root.size.y < 300.0:
				push_error("Station tab body_root collapsed on tab: " + tab)
				get_tree().quit(1)
				return
		hw._station_panels.close_panel()

	var sectors_verified := 0
	for sec_i in range(GameData.sectors.size()):
		_launch_space_sector(sec_i)
		await get_tree().process_frame
		await get_tree().physics_frame
		if _active_world is SpaceExpedition3D:
			var sw := _active_world as SpaceExpedition3D
			sw.autopilot_override = true
			if is_instance_valid(sw.player_ship):
				sw.player_ship.thrust_input = Vector3(0, 0, 1)
				sw.player_ship.firing_mining = true
				sw.player_ship.firing_weapons = true
				await get_tree().physics_frame
				await get_tree().physics_frame
				sectors_verified += 1

	var save_ok := SaveManager.save_game("user://runtime_verify_save.json")
	var load_ok := SaveManager.load_game("user://runtime_verify_save.json")
	var all_ok := (sectors_verified == GameData.sectors.size()) and save_ok and load_ok

	var report_path := OS.get_environment("SPACE_MINER_SELFTEST_OUT")
	if not report_path.is_empty():
		var rf := FileAccess.open(report_path, FileAccess.WRITE)
		if rf != null:
			rf.store_line("status=" + ("SPACE_MINER_SELF_TEST_OK" if all_ok else "FAILED"))
			rf.store_line("sectors_verified=%d" % sectors_verified)
			rf.store_line("save_ok=%s" % str(save_ok))
			rf.store_line("load_ok=%s" % str(load_ok))
			rf.close()

	if not all_ok:
		push_error("Packaged save/load or sector check failed!")
		get_tree().quit(1)
		return

	print("SPACE_MINER_SELF_TEST_OK")
	get_tree().quit(0)
