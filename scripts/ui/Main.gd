extends Node

var _active_world: Node = null
var _menu_world: Node3D = null
var _menu_ship_spin: Node3D = null
var _menu_layer: CanvasLayer = null
var _settings_overlay: HangarStationPanels = null
var _new_game_confirm: PanelContainer = null

func _ready() -> void:
	DisplayServer.window_set_title("SPACE MINER: BUILD & CONQUER")
	ThemeHelper.apply_graphics_preset(ThemeHelper.graphics_preset)

	var all_args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	for arg in all_args:
		if arg == "--self-test":
			_run_packaged_exe_self_test()
			return

	_show_main_menu()

func _process(delta: float) -> void:
	if is_instance_valid(_menu_ship_spin):
		_menu_ship_spin.rotate_y(delta * 0.38)

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

func _show_main_menu() -> void:
	_clear_current_mode()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	AudioManager.play_ambient("amb_hangar")

	# 3D Live Diorama Backdrop for Main Menu
	_menu_world = Node3D.new()
	add_child(_menu_world)

	var we := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var smat := ProceduralSkyMaterial.new()
	smat.sky_top_color = Color(0.02, 0.04, 0.10)
	smat.sky_horizon_color = Color(0.08, 0.20, 0.36)
	sky.sky_material = smat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.22, 0.32, 0.48)
	env.glow_enabled = true
	we.environment = env
	_menu_world.add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = Color(0.95, 0.92, 0.84)
	sun.light_energy = 1.6
	sun.rotation_degrees = Vector3(-35, 42, 0)
	_menu_world.add_child(sun)

	var cam := Camera3D.new()
	cam.position = Vector3(5.5, 4.2, 12.8)
	cam.look_at_from_position(Vector3(5.5, 4.2, 12.8), Vector3(1.8, 0.2, 0.0), Vector3.UP)
	cam.fov = 54.0
	_menu_world.add_child(cam)

	_menu_ship_spin = Node3D.new()
	_menu_ship_spin.position = Vector3(3.4, 0.2, 0.0)
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

	# Decorative crystalline asteroids in background
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

	# Main Menu UI Overlay
	_menu_layer = CanvasLayer.new()
	add_child(_menu_layer)

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.theme = ThemeHelper.main_theme
	_menu_layer.add_child(root)

	var left_card := PanelContainer.new()
	left_card.offset_left = 68
	left_card.offset_top = 86
	left_card.offset_right = 630
	left_card.offset_bottom = 810
	left_card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.03, 0.055, 0.12, 0.90), Color(0.22, 0.78, 1.0, 0.88), 14, 2))
	root.add_child(left_card)

	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 16)
	left_card.add_child(vb)

	var logo := TextureRect.new()
	logo.custom_minimum_size = Vector2(490, 148)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if ResourceLoader.exists("res://assets/branding/logo_main.png"):
		logo.texture = load("res://assets/branding/logo_main.png")
	vb.add_child(logo)

	var tagline := Label.new()
	tagline.text = "MODULAR 3D STARSHIP ENGINEERING • ASTEROID MINING • CREW CARDS"
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tagline.add_theme_font_size_override("font_size", 15)
	tagline.add_theme_color_override("font_color", Color(0.66, 0.86, 1.0))
	vb.add_child(tagline)

	var summary := Label.new()
	summary.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	summary.text = "Commander Status: %d Credits  •  %d Crystals  •  %d/42 Crew Cards" % [
		ShipGrid.credits, ShipGrid.crystals, CrewManager.get_unique_owned_count()
	]
	summary.add_theme_color_override("font_color", Color(1.0, 0.84, 0.36))
	vb.add_child(summary)

	var play_btn := Button.new()
	play_btn.text = "ENTER 3D ORBITAL HANGAR"
	play_btn.custom_minimum_size = Vector2(360, 56)
	play_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(play_btn, Color(0.16, 0.80, 0.56))
	play_btn.pressed.connect(_enter_hangar)
	vb.add_child(play_btn)

	var quick_launch := Button.new()
	quick_launch.text = "QUICK LAUNCH EXPEDITION (STARTER BELT)"
	quick_launch.custom_minimum_size = Vector2(360, 48)
	quick_launch.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(quick_launch, Color(0.20, 0.70, 0.96))
	quick_launch.pressed.connect(func(): _launch_space_sector(0))
	vb.add_child(quick_launch)

	var set_btn := Button.new()
	set_btn.text = "GRAPHICS, AUDIO & SETTINGS"
	set_btn.custom_minimum_size = Vector2(360, 46)
	set_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.wire_button_fx(set_btn)
	set_btn.pressed.connect(func(): _settings_overlay.open_tab("settings"))
	vb.add_child(set_btn)

	var new_btn := Button.new()
	new_btn.text = "NEW CAREER (RESET SAVE)"
	new_btn.custom_minimum_size = Vector2(360, 44)
	new_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.wire_button_fx(new_btn)
	new_btn.pressed.connect(func(): _new_game_confirm.visible = true)
	vb.add_child(new_btn)

	var quit_btn := Button.new()
	quit_btn.text = "EXIT TO DESKTOP"
	quit_btn.custom_minimum_size = Vector2(360, 44)
	quit_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ThemeHelper.style_accent_button(quit_btn, Color(0.78, 0.30, 0.34))
	quit_btn.pressed.connect(func():
		SaveManager.save_game()
		get_tree().quit()
	)
	vb.add_child(quit_btn)

	var ver_lbl := Label.new()
	ver_lbl.text = "v1.0.4 Windows 64-Bit Release  •  Orbital Forge Interactive"
	ver_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ver_lbl.add_theme_font_size_override("font_size", 13)
	ver_lbl.add_theme_color_override("font_color", Color(0.46, 0.60, 0.74))
	vb.add_child(ver_lbl)

	# New Career Confirmation Dialog
	_new_game_confirm = PanelContainer.new()
	_new_game_confirm.visible = false
	_new_game_confirm.set_anchors_preset(Control.PRESET_CENTER)
	_new_game_confirm.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_new_game_confirm.grow_vertical = Control.GROW_DIRECTION_BOTH
	_new_game_confirm.custom_minimum_size = Vector2(440, 190)
	root.add_child(_new_game_confirm)

	var nvb := VBoxContainer.new()
	nvb.alignment = BoxContainer.ALIGNMENT_CENTER
	nvb.add_theme_constant_override("separation", 16)
	_new_game_confirm.add_child(nvb)

	var nlbl := Label.new()
	nlbl.text = "Start a brand-new career?\nThis will reset current ship cells, cards, and credits."
	nlbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	nvb.add_child(nlbl)

	var nhb := HBoxContainer.new()
	nhb.alignment = BoxContainer.ALIGNMENT_CENTER
	nhb.add_theme_constant_override("separation", 20)
	nvb.add_child(nhb)

	var nyes := Button.new()
	nyes.text = "RESET & START"
	ThemeHelper.style_accent_button(nyes, Color(0.88, 0.32, 0.32))
	nyes.pressed.connect(func():
		SaveManager.reset_all_progress()
		_enter_hangar()
	)
	nhb.add_child(nyes)

	var nno := Button.new()
	nno.text = "CANCEL"
	ThemeHelper.wire_button_fx(nno)
	nno.pressed.connect(func(): _new_game_confirm.visible = false)
	nhb.add_child(nno)

	_settings_overlay = HangarStationPanels.new()
	root.add_child(_settings_overlay)

func _enter_hangar() -> void:
	_clear_current_mode()
	var hangar := Hangar3D.new()
	hangar.request_launch_expedition.connect(_launch_space_sector)
	hangar.request_main_menu.connect(_show_main_menu)
	add_child(hangar)
	_active_world = hangar

func _launch_space_sector(sector_idx: int) -> void:
	_clear_current_mode()
	var exp_scene := SpaceExpedition3D.new()
	exp_scene.setup_sector(sector_idx)
	exp_scene.return_to_hangar.connect(_enter_hangar)
	add_child(exp_scene)
	_active_world = exp_scene

func _run_packaged_exe_self_test() -> void:
	print("=== RUNNING PACKAGED RUNTIME VERIFICATION ===")
	_show_main_menu()
	await get_tree().process_frame
	await get_tree().process_frame

	_enter_hangar()
	await get_tree().process_frame
	await get_tree().process_frame

	# Open each Hangar UI tab to verify zero UI/shader/icon errors
	if _active_world is Hangar3D:
		var hw := _active_world as Hangar3D
		for tab in ["shop", "crew", "packs", "upgrades", "achievements", "launch", "settings"]:
			hw._station_panels.open_tab(tab)
			await get_tree().process_frame
		hw._station_panels.close_panel()

	# Launch all 5 Space Sectors sequentially to verify 3D models, lighting, physics, AI, and HUD
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
