class_name SpaceExpedition3D
extends Node3D

signal return_to_hangar

var sector_index: int = 0
var sector_def: Dictionary = {}

var player_ship: PlayerShip3D
var asteroids_root: Node3D
var enemies_root: Node3D
var chunks_root: Node3D
var projectiles_root: Node3D
var beams_root: Node3D
var _warp_gate: Node3D
var _gate_lbl_3d: Label3D
var _lightning_beam: MeshInstance3D

# Camera & 360-degree smooth flight rig
var _cam_pivot: Node3D
var _cam: Camera3D
var _cam_dist: float = 17.0
var _target_cam_dist: float = 17.0
var _cam_yaw_off: float = 0.0
var _cam_pitch_off: float = -10.0
var _cam_bank_deg: float = 0.0
var _virtual_stick: Vector2 = Vector2.ZERO
var _smoothed_stick: Vector2 = Vector2.ZERO
var _mouse_idle_time: float = 0.0
var _mouse_captured: bool = true
const STEER_RING_RADIUS_PX: float = 165.0

# Timers
var _enemy_spawn_cd: float = 5.0
var _hazard_cd: float = 9.0
var _hazard_flash_t: float = 0.0
var _radar_sweep_angle: float = 0.0

# HUD elements
var _hud_layer: CanvasLayer
var _hud_root: Control
var _overlay_canvas: Control
var _radar_canvas: Control
var _status_box: PanelContainer
var _radar_box: PanelContainer
var _min_task_pill: PanelContainer
var _hint_pill: PanelContainer

var _hp_bar: ProgressBar
var _shld_bar: ProgressBar
var _eng_bar: ProgressBar
var _heat_bar: ProgressBar
var _cargo_bar: ProgressBar
var _bar_name_lbls: Dictionary = {}
var _bar_val_lbls: Dictionary = {}

var _telemetry_lbl: Label
var _sector_lbl: Label
var _min_ach_lbl: Label
var _hazard_warn_lbl: Label
var _ret_btn: Button
var _hint_lbl: Label
var _pause_panel: PanelContainer
var _pause_title_lbl: Label
var _pause_lang_lbl: Label
var _pause_res_btn: Button
var _pause_ext_btn: Button

var _extracting: bool = false
var autopilot_override: bool = false
var _manual_locked_enemy: Node3D = null

func setup_sector(sec_idx: int) -> void:
	sector_index = clampi(sec_idx, 0, GameData.sectors.size() - 1)
	sector_def = GameData.sectors[sector_index]

func _ready() -> void:
	if sector_def.is_empty():
		setup_sector(0)

	AudioManager.play_ambient("amb_space")
	_build_sector_environment()
	_spawn_player_and_containers()
	_populate_asteroids_and_props()
	_build_expedition_hud()
	L.language_changed.connect(func(_lang: String): _apply_hud_localization())
	_apply_hud_localization()
	_set_mouse_flight_mode(true)

func _exit_tree() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	AudioManager.stop_loops()

func _set_mouse_flight_mode(active: bool) -> void:
	_mouse_captured = active
	if DisplayServer.get_name() == "headless":
		return
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if active else Input.MOUSE_MODE_VISIBLE

func _build_sector_environment() -> void:
	var we := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = sector_def["sky_top"]
	sky_mat.sky_horizon_color = sector_def["sky_horizon"]
	sky_mat.ground_bottom_color = sector_def["sky_top"].darkened(0.4)
	sky_mat.ground_horizon_color = sector_def["sky_horizon"]
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = sector_def["ambient_color"]
	env.ambient_light_energy = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.78
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = sector_def["sun_color"]
	sun.light_energy = 1.65
	sun.shadow_enabled = ThemeHelper.graphics_preset in ["High", "Ultra"]
	sun.rotation_degrees = Vector3(-38, 42, 0)
	add_child(sun)

	var stars := CPUParticles3D.new()
	stars.name = "NebulaParticles"
	stars.amount = maxi(40, int(round(140.0 * VFXFactory.get_particle_scale())))
	stars.lifetime = 6.0
	stars.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	stars.emission_box_extents = Vector3(130, 80, 130)
	stars.gravity = Vector3.ZERO
	stars.initial_velocity_min = 0.2
	stars.initial_velocity_max = 1.2
	var smesh := BoxMesh.new()
	smesh.size = Vector3.ONE * 0.28
	var smat := StandardMaterial3D.new()
	smat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	smat.albedo_color = (sector_def["sun_color"] as Color).lightened(0.35)
	smesh.material = smat
	stars.mesh = smesh
	add_child(stars)

func _spawn_player_and_containers() -> void:
	asteroids_root = Node3D.new()
	asteroids_root.name = "AsteroidsRoot"
	add_child(asteroids_root)

	enemies_root = Node3D.new()
	enemies_root.name = "EnemiesRoot"
	add_child(enemies_root)

	chunks_root = Node3D.new()
	chunks_root.name = "ChunksRoot"
	add_child(chunks_root)

	projectiles_root = Node3D.new()
	projectiles_root.name = "ProjectilesRoot"
	add_child(projectiles_root)

	beams_root = Node3D.new()
	beams_root.name = "BeamsRoot"
	add_child(beams_root)

	_lightning_beam = VFXFactory.create_beam_node(Color(0.78, 0.42, 1.0), 0.32)
	beams_root.add_child(_lightning_beam)

	player_ship = PlayerShip3D.new()
	player_ship.projectiles_root = projectiles_root
	player_ship.chunks_root = chunks_root
	player_ship.beams_root = beams_root
	add_child(player_ship)
	player_ship.rebuild_from_grid()
	player_ship.global_position = Vector3.ZERO
	player_ship.cockpit_destroyed.connect(_on_ship_destroyed)
	player_ship.ship_telemetry_updated.connect(_on_ship_telemetry)

	_cam_pivot = Node3D.new()
	add_child(_cam_pivot)
	_cam = Camera3D.new()
	_cam.fov = 65.0
	_cam.far = 900.0
	_cam_pivot.add_child(_cam)

	_warp_gate = Node3D.new()
	_warp_gate.position = Vector3(0, 0, 52)
	add_child(_warp_gate)
	if ResourceLoader.exists("res://assets/models/hangar/env_space_buoy.glb"):
		var bps: PackedScene = load("res://assets/models/hangar/env_space_buoy.glb")
		if bps:
			_warp_gate.add_child(bps.instantiate())
	var portal := VFXFactory.create_holo_panel(Vector2(11.5, 11.5), Color(0.20, 0.95, 0.68, 0.48))
	_warp_gate.add_child(portal)
	_gate_lbl_3d = Label3D.new()
	if ThemeHelper.font_display:
		_gate_lbl_3d.font = ThemeHelper.font_display
	_gate_lbl_3d.text = L.tr_ui("warp_gate_3d")
	_gate_lbl_3d.font_size = 44
	_gate_lbl_3d.modulate = Color(0.35, 1.0, 0.72)
	_gate_lbl_3d.outline_size = 8
	_gate_lbl_3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_gate_lbl_3d.position = Vector3(0, 9.6, 0)
	_warp_gate.add_child(_gate_lbl_3d)

func _populate_asteroids_and_props() -> void:
	var count: int = int(sector_def.get("asteroid_count", 45))
	for _i in range(count):
		_spawn_single_asteroid(32.0, 250.0)

	if str(sector_def.get("hazard", "")) == "debris_field" and ResourceLoader.exists("res://assets/models/hangar/env_derelict_hull.glb"):
		var dps: PackedScene = load("res://assets/models/hangar/env_derelict_hull.glb")
		if dps:
			for _j in range(6):
				var wreck := StaticBody3D.new()
				wreck.position = Vector3(randf_range(-170, 170), randf_range(-40, 40), randf_range(-210, -35))
				wreck.rotation_degrees = Vector3(randf_range(-25, 25), randf_range(0, 360), randf_range(-25, 25))
				var cs := CollisionShape3D.new()
				var bx := BoxShape3D.new()
				bx.size = Vector3(9.5, 9.5, 18.0)
				cs.shape = bx
				wreck.add_child(cs)
				wreck.add_child(dps.instantiate())
				add_child(wreck)

	var init_enemies := mini(3, int(sector_def.get("enemy_cap", 4)))
	for _k in range(init_enemies):
		_spawn_sector_enemy()

func _spawn_single_asteroid(min_dist: float, max_dist: float) -> void:
	var ang := randf() * TAU
	var dist := randf_range(min_dist, max_dist)
	var pos := Vector3(cos(ang) * dist, randf_range(-38.0, 38.0), sin(ang) * dist - 35.0)
	if pos.distance_to(Vector3(0, 0, 52)) < 20.0:
		pos.z -= 30.0
	var ast := Asteroid3D.new()
	ast.setup(sector_def, pos, randf_range(0.85, 2.15))
	ast.destroyed.connect(func(_a, _wp):
		if is_inside_tree() and asteroids_root.get_child_count() < int(sector_def.get("asteroid_count", 45)):
			_spawn_single_asteroid(85.0, 260.0)
	)
	asteroids_root.add_child(ast)

func _spawn_sector_enemy() -> void:
	var pool: Array = sector_def.get("enemy_pool", ["scout_drone"])
	if pool.is_empty() or not is_instance_valid(player_ship):
		return
	var eid: String = pool[randi() % pool.size()]
	var ang := randf() * TAU
	var spawn_pos := player_ship.global_position + Vector3(cos(ang) * 145.0, randf_range(-24.0, 24.0), sin(ang) * 145.0)
	var en := EnemyShip3D.new()
	en.setup(eid, spawn_pos, player_ship, projectiles_root, chunks_root)
	enemies_root.add_child(en)

# ==============================================================================
# REBUILT NON-OVERLAPPING EXPEDITION HUD, SCANNER BRACKETS & TACTICAL RADAR
# ==============================================================================
func _build_expedition_hud() -> void:
	_hud_layer = CanvasLayer.new()
	add_child(_hud_layer)

	_hud_root = Control.new()
	_hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_hud_root.theme = ThemeHelper.main_theme
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_layer.add_child(_hud_root)

	_overlay_canvas = Control.new()
	_overlay_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_canvas.draw.connect(_draw_hud_world_overlays)
	_hud_root.add_child(_overlay_canvas)

	# 1. Top-Left Ship Status Panel (x: 14..362, y: 12..236)
	_status_box = PanelContainer.new()
	_status_box.name = "FlightStatusPanel"
	_status_box.offset_left = 14
	_status_box.offset_top = 12
	_status_box.offset_right = 362
	_status_box.offset_bottom = 236
	_status_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_root.add_child(_status_box)

	var svb := VBoxContainer.new()
	svb.add_theme_constant_override("separation", 5)
	_status_box.add_child(svb)

	_sector_lbl = Label.new()
	_sector_lbl.clip_text = true
	if ThemeHelper.font_display:
		_sector_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_sector_lbl.add_theme_font_size_override("font_size", 16)
	_sector_lbl.add_theme_color_override("font_color", sector_def["sun_color"])
	svb.add_child(_sector_lbl)

	_hp_bar = _make_hud_bar(svb, "hud_hull", Color(0.24, 0.90, 0.52))
	_shld_bar = _make_hud_bar(svb, "hud_shield", Color(0.20, 0.74, 1.0))
	_eng_bar = _make_hud_bar(svb, "hud_power", Color(1.0, 0.84, 0.25))
	_heat_bar = _make_hud_bar(svb, "hud_heat", Color(1.0, 0.45, 0.18))
	_cargo_bar = _make_hud_bar(svb, "hud_cargo", Color(0.78, 0.52, 1.0))

	_telemetry_lbl = Label.new()
	_telemetry_lbl.clip_text = true
	if ThemeHelper.font_mono:
		_telemetry_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_telemetry_lbl.add_theme_font_size_override("font_size", 12)
	_telemetry_lbl.add_theme_color_override("font_color", Color(0.82, 0.93, 1.0))
	svb.add_child(_telemetry_lbl)

	# 2. Top-Center Minute-Task Pill & Hazard Alert (strictly between x=376 and x=W-224!)
	_min_task_pill = PanelContainer.new()
	_min_task_pill.name = "FlightMinuteTaskPill"
	_min_task_pill.anchor_left = 0.0
	_min_task_pill.anchor_right = 1.0
	_min_task_pill.anchor_top = 0.0
	_min_task_pill.anchor_bottom = 0.0
	_min_task_pill.offset_left = 376
	_min_task_pill.offset_right = -224
	_min_task_pill.offset_top = 12
	_min_task_pill.offset_bottom = 46
	_min_task_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_min_task_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.02, 0.045, 0.105, 0.88), Color(0.22, 0.75, 1.0, 0.58), 10, 12, 5))
	_hud_root.add_child(_min_task_pill)

	_min_ach_lbl = Label.new()
	_min_ach_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_min_ach_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_min_ach_lbl.clip_text = true
	_min_ach_lbl.add_theme_font_size_override("font_size", 13)
	_min_ach_lbl.add_theme_color_override("font_color", Color(0.76, 0.94, 1.0))
	_min_task_pill.add_child(_min_ach_lbl)

	_hazard_warn_lbl = Label.new()
	_hazard_warn_lbl.anchor_left = 0.0
	_hazard_warn_lbl.anchor_right = 1.0
	_hazard_warn_lbl.offset_left = 376
	_hazard_warn_lbl.offset_right = -224
	_hazard_warn_lbl.offset_top = 54
	_hazard_warn_lbl.offset_bottom = 86
	_hazard_warn_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hazard_warn_lbl.clip_text = true
	if ThemeHelper.font_bold:
		_hazard_warn_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_hazard_warn_lbl.add_theme_font_size_override("font_size", 18)
	_hazard_warn_lbl.add_theme_color_override("font_color", Color(1.0, 0.38, 0.42))
	_hud_root.add_child(_hazard_warn_lbl)

	# 3. Top-Right Tactical Radar Minimap + Return Button (x: W-210..W-14, y: 12..246)
	_radar_box = PanelContainer.new()
	_radar_box.name = "FlightRadarPanel"
	_radar_box.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_radar_box.offset_left = -210
	_radar_box.offset_right = -14
	_radar_box.offset_top = 12
	_radar_box.offset_bottom = 248
	_radar_box.mouse_filter = Control.MOUSE_FILTER_STOP
	_hud_root.add_child(_radar_box)

	var rvb := VBoxContainer.new()
	rvb.alignment = BoxContainer.ALIGNMENT_CENTER
	rvb.add_theme_constant_override("separation", 6)
	_radar_box.add_child(rvb)

	_radar_canvas = Control.new()
	_radar_canvas.custom_minimum_size = Vector2(162, 162)
	_radar_canvas.draw.connect(_draw_radar_minimap)
	rvb.add_child(_radar_canvas)

	_ret_btn = Button.new()
	_ret_btn.clip_text = true
	_ret_btn.custom_minimum_size = Vector2(0, 34)
	_ret_btn.add_theme_font_size_override("font_size", 13)
	ThemeHelper.style_accent_button(_ret_btn, Color(0.18, 0.78, 0.56))
	_ret_btn.pressed.connect(_complete_expedition_and_return)
	rvb.add_child(_ret_btn)

	# 4. Bottom Flight Controls Hint Pill
	_hint_pill = PanelContainer.new()
	_hint_pill.name = "FlightHintPill"
	_hint_pill.anchor_left = 0.0
	_hint_pill.anchor_right = 1.0
	_hint_pill.anchor_top = 1.0
	_hint_pill.anchor_bottom = 1.0
	_hint_pill.offset_left = 60
	_hint_pill.offset_right = -60
	_hint_pill.offset_top = -42
	_hint_pill.offset_bottom = -10
	_hint_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hint_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.015, 0.035, 0.085, 0.84), Color(0.20, 0.62, 0.90, 0.45), 9, 14, 4))
	_hud_root.add_child(_hint_pill)

	_hint_lbl = Label.new()
	_hint_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_hint_lbl.clip_text = true
	_hint_lbl.add_theme_font_size_override("font_size", 12)
	_hint_lbl.add_theme_color_override("font_color", Color(0.72, 0.86, 0.98))
	_hint_pill.add_child(_hint_lbl)

	# 5. Pause / Expedition Command Overlay (with 10-Language Selector)
	_pause_panel = PanelContainer.new()
	_pause_panel.visible = false
	_pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	_pause_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_pause_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	_pause_panel.offset_left = -235
	_pause_panel.offset_right = 235
	_pause_panel.offset_top = -150
	_pause_panel.offset_bottom = 150
	_pause_panel.custom_minimum_size = Vector2(470, 300)
	_pause_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_pause_panel.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.025, 0.048, 0.115, 0.97), Color(0.24, 0.80, 1.0, 0.90), 16, 2, 22))
	_hud_root.add_child(_pause_panel)

	var pvb := VBoxContainer.new()
	pvb.alignment = BoxContainer.ALIGNMENT_CENTER
	pvb.add_theme_constant_override("separation", 14)
	_pause_panel.add_child(pvb)

	_pause_title_lbl = Label.new()
	_pause_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_display:
		_pause_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_pause_title_lbl.add_theme_font_size_override("font_size", 21)
	_pause_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	pvb.add_child(_pause_title_lbl)

	var lang_hb := HBoxContainer.new()
	lang_hb.alignment = BoxContainer.ALIGNMENT_CENTER
	lang_hb.add_theme_constant_override("separation", 10)
	pvb.add_child(lang_hb)

	_pause_lang_lbl = Label.new()
	_pause_lang_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	lang_hb.add_child(_pause_lang_lbl)
	lang_hb.add_child(ThemeHelper.make_language_dropdown(true))

	_pause_res_btn = Button.new()
	_pause_res_btn.custom_minimum_size = Vector2(0, 44)
	ThemeHelper.style_accent_button(_pause_res_btn, Color(0.20, 0.75, 1.0))
	_pause_res_btn.pressed.connect(func():
		_pause_panel.visible = false
		_set_mouse_flight_mode(true)
	)
	pvb.add_child(_pause_res_btn)

	_pause_ext_btn = Button.new()
	_pause_ext_btn.custom_minimum_size = Vector2(0, 44)
	ThemeHelper.style_accent_button(_pause_ext_btn, Color(0.18, 0.82, 0.52))
	_pause_ext_btn.pressed.connect(_complete_expedition_and_return)
	pvb.add_child(_pause_ext_btn)

	ThemeHelper.animate_entry(_status_box, 0.0, Vector2(0.96, 0.96))
	ThemeHelper.animate_entry(_radar_box, 0.04, Vector2(0.96, 0.96))
	ThemeHelper.animate_entry(_min_task_pill, 0.06, Vector2(0.97, 0.97))

func _make_hud_bar(parent: VBoxContainer, loc_key: String, col: Color) -> ProgressBar:
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 6)
	parent.add_child(hb)

	var l := Label.new()
	l.custom_minimum_size = Vector2(78, 0)
	l.clip_text = true
	l.add_theme_font_size_override("font_size", 12)
	l.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
	hb.add_child(l)
	_bar_name_lbls[loc_key] = l

	var pb := ProgressBar.new()
	pb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pb.custom_minimum_size = Vector2(0, 13)
	pb.show_percentage = false
	var fill := ThemeHelper.make_panel_style(col, col.lightened(0.3), 4, 1, 0)
	fill.shadow_size = 0
	pb.add_theme_stylebox_override("fill", fill)
	hb.add_child(pb)

	var vl := Label.new()
	vl.custom_minimum_size = Vector2(68, 0)
	vl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	if ThemeHelper.font_mono:
		vl.add_theme_font_override("font", ThemeHelper.font_mono)
	vl.add_theme_font_size_override("font_size", 11)
	vl.add_theme_color_override("font_color", col.lightened(0.28))
	hb.add_child(vl)
	_bar_val_lbls[loc_key] = vl
	return pb

func _apply_hud_localization() -> void:
	if not is_instance_valid(_sector_lbl):
		return
	_sector_lbl.text = L.sector_name(sector_def).to_upper()
	for k in _bar_name_lbls.keys():
		var l: Label = _bar_name_lbls[k]
		if is_instance_valid(l):
			l.text = L.tr_ui(str(k))
	_ret_btn.text = L.tr_ui("hud_return_hangar")
	_hint_lbl.text = L.tr_ui("hud_flight_hint")
	_pause_title_lbl.text = L.tr_ui("pause_title")
	_pause_lang_lbl.text = L.tr_ui("settings_language") + ":"
	_pause_res_btn.text = L.tr_ui("pause_resume")
	_pause_ext_btn.text = L.tr_ui("pause_extract")
	if is_instance_valid(_gate_lbl_3d):
		_gate_lbl_3d.text = L.tr_ui("warp_gate_3d")

func _on_ship_telemetry(tel: Dictionary) -> void:
	if not is_instance_valid(_hp_bar):
		return
	var hp := float(tel["hp"])
	var max_hp := maxf(1.0, float(tel["max_hp"]))
	var sh := float(tel["shield"])
	var max_sh := maxf(1.0, float(tel["max_shield"]))
	var en := float(tel["energy"])
	var max_en := maxf(1.0, float(tel["max_energy"]))
	var ht := float(tel["heat"])

	_hp_bar.max_value = max_hp
	_hp_bar.value = hp
	_shld_bar.max_value = max_sh
	_shld_bar.value = sh
	_eng_bar.max_value = max_en
	_eng_bar.value = en
	_heat_bar.max_value = 100.0
	_heat_bar.value = ht

	var cap := maxi(1, int(player_ship.stats.get("cargo_capacity", 40)))
	var used := ShipGrid.get_current_cargo_units()
	_cargo_bar.max_value = float(cap)
	_cargo_bar.value = float(used)

	(_bar_val_lbls["hud_hull"] as Label).text = "%d/%d" % [int(round(hp)), int(round(max_hp))]
	(_bar_val_lbls["hud_shield"] as Label).text = "%d/%d" % [int(round(sh)), int(round(max_sh))]
	(_bar_val_lbls["hud_power"] as Label).text = "%d/%d" % [int(round(en)), int(round(max_en))]
	(_bar_val_lbls["hud_heat"] as Label).text = "%d%%" % int(round(ht))
	(_bar_val_lbls["hud_cargo"] as Label).text = "%d/%d" % [used, cap]

	var mag_r := int(round(float(player_ship.stats.get("bullet_magnet_range", 0.0))))
	var mag_txt := (" • MAG %dm" % mag_r) if mag_r > 0 else ""
	_telemetry_lbl.text = "%3.0f m/s • %d CR • %d CRY • ASTB:%s%s" % [
		float(tel["speed"]), ShipGrid.credits, ShipGrid.crystals, ("ON" if bool(tel["stabilizer"]) else "OFF"), mag_txt
	]

	var mtasks: Array = AchievementManager.active_tasks.get("minute", [])
	if not mtasks.is_empty():
		var active_sample: Dictionary = mtasks[0]
		for mt in mtasks:
			if not bool(mt["completed"]):
				active_sample = mt
				break
		_min_ach_lbl.text = L.tr_ui("hud_minute_task", [
			AchievementManager.get_seconds_until_reset("minute"),
			L.ach_objective(active_sample),
			int(floor(float(active_sample["progress"]))),
			int(active_sample["target"]),
			int(active_sample["crystal_reward"])
		])

func _draw_hud_world_overlays() -> void:
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var center: Vector2 = vp * 0.5

	var nose_col := Color(0.55, 0.78, 0.95, 0.34)
	_overlay_canvas.draw_line(center + Vector2(-7, 0), center + Vector2(-2, 0), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(2, 0), center + Vector2(7, 0), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(0, -7), center + Vector2(0, -2), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(0, 2), center + Vector2(0, 7), nose_col, 1.4)
	if _smoothed_stick.length() > 0.04:
		_overlay_canvas.draw_arc(center, STEER_RING_RADIUS_PX, 0.0, TAU, 48, Color(0.20, 0.62, 0.88, 0.16), 1.2)

	# CROSSHAIR #1: Primary Steering & Aiming Reticle (Cyan)
	var aim_screen_pos: Vector2 = center + _smoothed_stick * STEER_RING_RADIUS_PX
	if aim_screen_pos.distance_to(center) > 4.0:
		_overlay_canvas.draw_line(center, aim_screen_pos, Color(0.28, 0.86, 1.0, 0.28), 1.5)
	var aim_col := Color(0.28, 0.92, 1.0, 0.88)
	_overlay_canvas.draw_arc(aim_screen_pos, 15.0, 0.0, TAU, 32, aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(-22, 0), aim_screen_pos + Vector2(-15, 0), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(15, 0), aim_screen_pos + Vector2(22, 0), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(0, -22), aim_screen_pos + Vector2(0, -15), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(0, 15), aim_screen_pos + Vector2(0, 22), aim_col, 1.8)
	_overlay_canvas.draw_circle(aim_screen_pos, 2.0, Color(0.75, 0.98, 1.0, 0.95))

	if not is_instance_valid(player_ship) or not is_instance_valid(_cam):
		return

	# CROSSHAIR #2: Exact 3D Terminal Bullet Impact Sight (zero 2D lag — shows the exact point where the bullet lands!)
	var ballistics := player_ship.get_ballistic_sight_info()
	var impact_world: Vector3 = ballistics["world_pos"]
	if not _cam.is_position_behind(impact_world):
		var raw_pipper: Vector2 = _cam.unproject_position(impact_world)
		var on_screen := (
			raw_pipper.x >= 16.0 and raw_pipper.x <= vp.x - 16.0
			and raw_pipper.y >= 16.0 and raw_pipper.y <= vp.y - 16.0
		)
		var pipper_pos := Vector2(
			clampf(raw_pipper.x, 20.0, vp.x - 20.0),
			clampf(raw_pipper.y, 20.0, vp.y - 20.0)
		)

		var hit_kind := str(ballistics["hit_kind"])
		var pip_col := Color(1.0, 0.78, 0.22, 0.96)
		if hit_kind == "magnetic_enemy":
			pip_col = Color(0.96, 0.38, 1.0, 0.98)
		elif hit_kind == "enemy":
			pip_col = Color(0.24, 1.0, 0.54, 0.98)
		elif hit_kind == "asteroid":
			pip_col = Color(0.52, 0.98, 0.82, 0.95)

		if pipper_pos.distance_to(aim_screen_pos) > 5.0:
			_overlay_canvas.draw_line(aim_screen_pos, pipper_pos, Color(pip_col.r, pip_col.g, pip_col.b, 0.36), 1.5)

		var p_rad := 11.5 if hit_kind in ["enemy", "magnetic_enemy"] else 9.0
		var draw_col := pip_col if on_screen else Color(pip_col.r, pip_col.g, pip_col.b, 0.55)
		if hit_kind == "magnetic_enemy":
			_overlay_canvas.draw_arc(pipper_pos, p_rad + 4.8, 0.0, TAU, 32, Color(0.32, 0.95, 1.0, 0.78), 1.6)
		_overlay_canvas.draw_arc(pipper_pos, p_rad, 0.0, TAU, 28, draw_col, 2.2)
		var d_in := p_rad * 0.72
		var d_out := p_rad + 5.5
		for sx in [-1.0, 1.0]:
			for sy in [-1.0, 1.0]:
				var diag := Vector2(sx, sy).normalized()
				_overlay_canvas.draw_line(pipper_pos + diag * d_in, pipper_pos + diag * d_out, draw_col, 2.0)
		_overlay_canvas.draw_circle(pipper_pos, 2.8, draw_col.lightened(0.25))

		if hit_kind in ["enemy", "magnetic_enemy", "asteroid"] and on_screen and ThemeHelper.font_mono:
			var prefix := "MAG " if hit_kind == "magnetic_enemy" else ""
			var dist_txt := "%s%dm" % [prefix, int(round(float(ballistics["distance"])))]
			_overlay_canvas.draw_string(ThemeHelper.font_mono, pipper_pos + Vector2(16, 5), dist_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, draw_col)

		var sec_impacts: Array = ballistics.get("secondary_impacts", [])
		for sec_item in sec_impacts:
			var sec_w: Vector3 = sec_item as Vector3
			if not _cam.is_position_behind(sec_w):
				var sec_sp: Vector2 = _cam.unproject_position(sec_w)
				if sec_sp.distance_to(pipper_pos) > 8.0 and sec_sp.x >= 16.0 and sec_sp.x <= vp.x - 16.0 and sec_sp.y >= 16.0 and sec_sp.y <= vp.y - 16.0:
					var scol := Color(pip_col.r, pip_col.g, pip_col.b, 0.72)
					_overlay_canvas.draw_arc(sec_sp, 5.0, 0.0, TAU, 20, scol, 1.5)
					_overlay_canvas.draw_circle(sec_sp, 1.8, scol.lightened(0.2))

	if bool(ballistics.get("has_lead", false)) and is_instance_valid(player_ship.locked_enemy):
		var lead_w: Vector3 = ballistics["lead_world_pos"]
		var en_w: Vector3 = player_ship.locked_enemy.global_position
		if not _cam.is_position_behind(lead_w) and not _cam.is_position_behind(en_w):
			var lead_sp := _cam.unproject_position(lead_w)
			var en_sp := _cam.unproject_position(en_w)
			if lead_sp.distance_to(en_sp) > 6.0:
				var lcol := Color(1.0, 0.45, 0.24, 0.82)
				_overlay_canvas.draw_line(en_sp, lead_sp, Color(1.0, 0.45, 0.24, 0.40), 1.4)
				var pts := PackedVector2Array([
					lead_sp + Vector2(0, -8),
					lead_sp + Vector2(8, 0),
					lead_sp + Vector2(0, 8),
					lead_sp + Vector2(-8, 0),
					lead_sp + Vector2(0, -8),
				])
				_overlay_canvas.draw_polyline(pts, lcol, 1.8)

	var scan_range := float(player_ship.stats.get("scanner_range", 0.0))
	if scan_range > 1.0:
		for ast in asteroids_root.get_children():
			if ast is Asteroid3D:
				var ast3d := ast as Asteroid3D
				if ast3d.dominant_resource != "iron":
					var d: float = ast3d.global_position.distance_to(player_ship.global_position)
					if d <= scan_range and not _cam.is_position_behind(ast3d.global_position):
						var sp: Vector2 = _cam.unproject_position(ast3d.global_position)
						var rcol: Color = GameData.RESOURCES[ast3d.dominant_resource]["color"]
						_overlay_canvas.draw_rect(Rect2(sp - Vector2(14, 14), Vector2(28, 28)), rcol, false, 1.8)

	var radar_r := float(player_ship.stats.get("radar_range", 140.0))
	for en in enemies_root.get_children():
		if en is EnemyShip3D:
			var en3d := en as EnemyShip3D
			var de: float = en3d.global_position.distance_to(player_ship.global_position)
			if de <= radar_r and not _cam.is_position_behind(en3d.global_position):
				var ep: Vector2 = _cam.unproject_position(en3d.global_position)
				var is_locked := (en3d == player_ship.locked_enemy)
				var col := Color(1.0, 0.25, 0.28, 0.95) if is_locked else Color(1.0, 0.55, 0.22, 0.78)
				var sz := 22.0 if is_locked else 15.0
				_overlay_canvas.draw_rect(Rect2(ep - Vector2(sz, sz), Vector2(sz * 2.0, sz * 2.0)), col, false, 2.2 if is_locked else 1.4)
				var hp_pct := clampf(en3d.hp / maxf(1.0, en3d.max_hp), 0.0, 1.0)
				_overlay_canvas.draw_rect(Rect2(ep + Vector2(-20, -sz - 8), Vector2(40.0 * hp_pct, 4)), Color(1.0, 0.32, 0.28), true)

func _draw_radar_minimap() -> void:
	var c := _radar_canvas.size * 0.5
	var r := minf(c.x, c.y) - 6.0
	_radar_canvas.draw_circle(c, r, Color(0.018, 0.042, 0.098, 0.94))
	_radar_canvas.draw_arc(c, r, 0.0, TAU, 36, Color(0.22, 0.76, 1.0, 0.85), 2.0)
	_radar_canvas.draw_arc(c, r * 0.5, 0.0, TAU, 28, Color(0.18, 0.52, 0.76, 0.42), 1.0)

	# Rotating radar sweep beam
	if not ThemeHelper.reduced_motion:
		var sweep_end := c + Vector2(cos(_radar_sweep_angle), sin(_radar_sweep_angle)) * (r - 2.0)
		_radar_canvas.draw_line(c, sweep_end, Color(0.24, 0.92, 0.78, 0.50), 1.6)

	_radar_canvas.draw_circle(c, 3.5, Color.WHITE)

	if not is_instance_valid(player_ship):
		return
	var max_r := maxf(80.0, float(player_ship.stats.get("radar_range", 140.0)))
	var inv_basis := player_ship.global_transform.basis.inverse()

	if is_instance_valid(_warp_gate):
		var rel_g := inv_basis * (_warp_gate.global_position - player_ship.global_position)
		var g2 := Vector2(rel_g.x, rel_g.z) / max_r * r
		if g2.length() > r - 4.0:
			g2 = g2.normalized() * (r - 4.0)
		_radar_canvas.draw_circle(c + g2, 4.5, Color(0.28, 1.0, 0.65))

	for ast in asteroids_root.get_children():
		if ast is Node3D:
			var ast_n := ast as Node3D
			var rel_a: Vector3 = inv_basis * (ast_n.global_position - player_ship.global_position)
			var a2 := Vector2(rel_a.x, rel_a.z) / max_r * r
			if a2.length() <= r - 3.0:
				_radar_canvas.draw_circle(c + a2, 2.0, Color(0.32, 0.82, 1.0, 0.65))

	for en in enemies_root.get_children():
		if en is Node3D:
			var en_n := en as Node3D
			var rel_e: Vector3 = inv_basis * (en_n.global_position - player_ship.global_position)
			var e2 := Vector2(rel_e.x, rel_e.z) / max_r * r
			if e2.length() > r - 4.0:
				e2 = e2.normalized() * (r - 4.0)
			_radar_canvas.draw_circle(c + e2, 4.0, Color(1.0, 0.25, 0.28))

# ==============================================================================
# FLIGHT LOOP, CAMERA ANTI-CLIPPING, HAZARDS & EXTRACTION
# ==============================================================================
func _process(delta: float) -> void:
	if not is_instance_valid(player_ship) or _extracting:
		return

	_radar_sweep_angle = fmod(_radar_sweep_angle + delta * 2.1, TAU)

	var neb := get_node_or_null("NebulaParticles")
	if neb is Node3D:
		neb.global_position = player_ship.global_position

	_handle_flight_steering(delta)
	_update_third_person_camera(delta)
	_update_aim_ray_and_lock()
	_process_sector_spawns_and_hazards(delta)

	if is_instance_valid(_warp_gate) and player_ship.global_position.distance_to(_warp_gate.global_position) < 9.5:
		_complete_expedition_and_return()
		return

	_overlay_canvas.queue_redraw()
	_radar_canvas.queue_redraw()

func _handle_flight_steering(delta: float) -> void:
	if autopilot_override:
		return
	if _pause_panel.visible:
		player_ship.thrust_input = Vector3.ZERO
		player_ship.rot_input = Vector3.ZERO
		player_ship.firing_weapons = false
		player_ship.firing_mining = false
		_virtual_stick = Vector2.ZERO
		_smoothed_stick = Vector2.ZERO
		return

	var th := Vector3.ZERO
	if Input.is_key_pressed(KEY_W): th.z += 1.0
	if Input.is_key_pressed(KEY_S): th.z -= 0.75
	if Input.is_key_pressed(KEY_D): th.x += 1.0
	if Input.is_key_pressed(KEY_A): th.x -= 1.0
	if Input.is_key_pressed(KEY_SPACE): th.y += 1.0
	if Input.is_key_pressed(KEY_CTRL): th.y -= 1.0
	player_ship.thrust_input = th
	player_ship.boost_active = Input.is_key_pressed(KEY_SHIFT)

	_mouse_idle_time += delta
	if not _mouse_captured:
		_virtual_stick = _virtual_stick.lerp(Vector2.ZERO, 1.0 - exp(-8.0 * delta))
	elif _virtual_stick.length() > 0.72:
		if _mouse_idle_time > 0.55:
			_virtual_stick = _virtual_stick.lerp(Vector2.ZERO, 1.0 - exp(-0.95 * delta))
	elif _mouse_idle_time > 0.16:
		_virtual_stick = _virtual_stick.lerp(Vector2.ZERO, 1.0 - exp(-2.5 * delta))

	_smoothed_stick = _smoothed_stick.lerp(_virtual_stick, 1.0 - exp(-22.0 * delta))

	var stick_mag := _smoothed_stick.length()
	var stick_drive := Vector2.ZERO
	if stick_mag > 0.035:
		var norm_m := clampf((stick_mag - 0.035) / 0.965, 0.0, 1.0)
		stick_drive = _smoothed_stick.normalized() * pow(norm_m, 1.85)

	var rot := Vector3.ZERO
	if _mouse_captured:
		rot.y = clampf(-stick_drive.x, -1.0, 1.0)
		rot.x = clampf(-stick_drive.y, -1.0, 1.0)

	if Input.is_key_pressed(KEY_LEFT): rot.y += 1.0
	if Input.is_key_pressed(KEY_RIGHT): rot.y -= 1.0
	if Input.is_key_pressed(KEY_UP): rot.x += 1.0
	if Input.is_key_pressed(KEY_DOWN): rot.x -= 1.0
	if Input.is_key_pressed(KEY_Q): rot.z += 1.0
	if Input.is_key_pressed(KEY_E): rot.z -= 1.0
	rot.x = clampf(rot.x, -1.0, 1.0)
	rot.y = clampf(rot.y, -1.0, 1.0)
	rot.z = clampf(rot.z, -1.0, 1.0)
	player_ship.rot_input = rot

	player_ship.firing_weapons = _mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	player_ship.firing_mining = (_mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)) or Input.is_key_pressed(KEY_F)

func _update_aim_ray_and_lock() -> void:
	if autopilot_override:
		return
	var vp_size: Vector2 = get_viewport().get_visible_rect().size
	var steer_screen: Vector2 = vp_size * 0.5 + _smoothed_stick * STEER_RING_RADIUS_PX
	var aim_ray_dir := _cam.project_ray_normal(steer_screen).normalized()
	if aim_ray_dir.length_squared() < 0.01:
		aim_ray_dir = (-_cam.global_transform.basis.z).normalized()
	var cam_to_ship_d := _cam.global_position.distance_to(player_ship.global_position)
	var ray_origin := _cam.global_position + aim_ray_dir * (cam_to_ship_d + 2.5)
	player_ship.aimed_world_point = _cam.global_position + aim_ray_dir * 260.0
	var space_q := PhysicsRayQueryParameters3D.create(ray_origin, _cam.global_position + aim_ray_dir * 600.0)
	space_q.exclude = [player_ship.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(space_q)
	if not hit.is_empty():
		player_ship.aimed_world_point = hit["position"]

	if is_instance_valid(_manual_locked_enemy) and _manual_locked_enemy.global_position.distance_to(player_ship.global_position) < 320.0:
		player_ship.locked_enemy = _manual_locked_enemy
	else:
		_manual_locked_enemy = null
		var best_en: Node3D = null
		var best_dot := 0.90
		for en in enemies_root.get_children():
			if en is Node3D:
				var en_n := en as Node3D
				var dir_e: Vector3 = (en_n.global_position - _cam.global_position).normalized()
				var d_dot := aim_ray_dir.dot(dir_e)
				if d_dot > best_dot and en_n.global_position.distance_to(player_ship.global_position) < 250.0:
					best_dot = d_dot
					best_en = en_n
		player_ship.locked_enemy = best_en

func _update_third_person_camera(delta: float) -> void:
	var smooth_xf := player_ship.get_smoothed_transform()
	var target_pos := smooth_xf.origin + smooth_xf.basis * Vector3(0, 1.85, 0)
	var pos_alpha := 1.0 - exp(-22.0 * delta)
	_cam_pivot.global_position = _cam_pivot.global_position.lerp(target_pos, pos_alpha)

	var target_bank := clampf(-player_ship.rot_input.y * 4.5, -7.0, 7.0)
	_cam_bank_deg = lerpf(_cam_bank_deg, target_bank, 1.0 - exp(-8.0 * delta))

	var local_offset_basis := Basis.from_euler(Vector3(deg_to_rad(_cam_pitch_off), deg_to_rad(_cam_yaw_off), deg_to_rad(_cam_bank_deg)))
	var desired_basis := (smooth_xf.basis * local_offset_basis).orthonormalized()
	var q_cur := _cam_pivot.global_transform.basis.orthonormalized().get_rotation_quaternion()
	var q_dst := desired_basis.get_rotation_quaternion()
	var rot_alpha := 1.0 - exp(-14.0 * delta)
	_cam_pivot.global_transform.basis = Basis(q_cur.slerp(q_dst, rot_alpha)).orthonormalized()

	_cam_dist = lerpf(_cam_dist, _target_cam_dist, 1.0 - exp(-14.0 * delta))
	var spd_ratio := clampf(player_ship.linear_velocity.length() / 80.0, 0.0, 1.0)
	var desired_dist := _cam_dist + spd_ratio * 3.4
	_cam.fov = lerpf(_cam.fov, 64.0 + spd_ratio * 11.0, 1.0 - exp(-7.0 * delta))

	var desired_world := _cam_pivot.global_position + _cam_pivot.global_transform.basis.z * desired_dist
	var rq := PhysicsRayQueryParameters3D.create(_cam_pivot.global_position, desired_world)
	rq.exclude = [player_ship.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(rq)
	if not hit.is_empty():
		var safe_d := maxf(4.0, _cam_pivot.global_position.distance_to(hit["position"]) - 1.0)
		_cam.position = _cam.position.lerp(Vector3(0, 0, safe_d), 1.0 - exp(-24.0 * delta))
	else:
		_cam.position = _cam.position.lerp(Vector3(0, 0, desired_dist), 1.0 - exp(-15.0 * delta))

func _process_sector_spawns_and_hazards(delta: float) -> void:
	_enemy_spawn_cd -= delta
	if _enemy_spawn_cd <= 0.0:
		_enemy_spawn_cd = 11.0
		if enemies_root.get_child_count() < int(sector_def.get("enemy_cap", 4)):
			_spawn_sector_enemy()

	if _hazard_flash_t > 0.0:
		_hazard_flash_t -= delta
		if _hazard_flash_t <= 0.0:
			_lightning_beam.visible = false
			_hazard_warn_lbl.text = ""

	var haz: String = str(sector_def.get("hazard", "none"))
	if haz == "plasma_lightning":
		_hazard_cd -= delta
		if _hazard_cd <= 2.0 and _hazard_cd > 0.0:
			_hazard_warn_lbl.text = L.tr_ui("hud_plasma_warn")
		elif _hazard_cd <= 0.0:
			_hazard_cd = randf_range(8.5, 14.0)
			_hazard_flash_t = 0.55
			var bolt_origin := player_ship.global_position + Vector3(randf_range(-28, 28), 32.0, randf_range(-28, 28))
			var bolt_end := player_ship.global_position + Vector3(randf_range(-8, 8), 0, randf_range(-8, 8))
			VFXFactory.update_beam_between(_lightning_beam, bolt_origin, bolt_end)
			AudioManager.play_sfx("plasma_shot", 0.08, 0.85)
			if bolt_end.distance_to(player_ship.global_position) < 9.0:
				player_ship.receive_enemy_hit(34.0, player_ship.global_position, 0)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and _mouse_captured:
		_virtual_stick += event.relative * (0.0021 * ThemeHelper.camera_sensitivity)
		if _virtual_stick.length() > 1.0:
			_virtual_stick = _virtual_stick.normalized()
		_mouse_idle_time = 0.0

	elif event is InputEventMouseButton and event.pressed:
		if not _pause_panel.visible and not _mouse_captured and event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			_set_mouse_flight_mode(true)
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_target_cam_dist = clampf(_target_cam_dist - 1.8, 8.5, 36.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_target_cam_dist = clampf(_target_cam_dist + 1.8, 8.5, 36.0)

	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_ESCAPE, KEY_TAB]:
			_pause_panel.visible = not _pause_panel.visible
			_set_mouse_flight_mode(not _pause_panel.visible)
			if _pause_panel.visible:
				ThemeHelper.animate_entry(_pause_panel, 0.0, Vector2(0.92, 0.92))
		elif event.keycode == KEY_C:
			_virtual_stick = Vector2.ZERO
			_smoothed_stick = Vector2.ZERO
		elif event.keycode == KEY_T and is_instance_valid(player_ship):
			_toggle_manual_target_lock()
		elif event.keycode == KEY_Z and is_instance_valid(player_ship):
			player_ship.stabilizer_enabled = not player_ship.stabilizer_enabled
			AudioManager.play_sfx("ui_click", 0.05, 0.6)
		elif event.keycode == KEY_H:
			_complete_expedition_and_return()

func _toggle_manual_target_lock() -> void:
	if is_instance_valid(_manual_locked_enemy):
		_manual_locked_enemy = null
		player_ship.locked_enemy = null
		AudioManager.play_sfx("ui_back", 0.04, 0.5)
		return
	var cam_fwd := (-_cam.global_transform.basis.z).normalized()
	var best: Node3D = null
	var best_score := -2.0
	for en in enemies_root.get_children():
		if en is Node3D:
			var en_n := en as Node3D
			var d := en_n.global_position.distance_to(player_ship.global_position)
			if d < 280.0:
				var dot_v := cam_fwd.dot((en_n.global_position - _cam.global_position).normalized())
				if dot_v > best_score:
					best_score = dot_v
					best = en_n
	_manual_locked_enemy = best
	player_ship.locked_enemy = best
	AudioManager.play_sfx("ui_click", 0.04, 0.6)

func _complete_expedition_and_return() -> void:
	if _extracting:
		return
	_extracting = true
	ShipGrid.stats_history["expeditions_completed"] = int(ShipGrid.stats_history.get("expeditions_completed", 0)) + 1
	if AchievementManager:
		AchievementManager.record_event("complete_expedition", 1)
	ShipGrid.repair_all_modules()
	SaveManager.save_game()
	return_to_hangar.emit()

func _on_ship_destroyed() -> void:
	if _extracting:
		return
	_extracting = true
	for k in ShipGrid.cargo.keys():
		ShipGrid.cargo[k] = int(floor(float(int(ShipGrid.cargo[k])) * 0.75))
	ShipGrid.repair_all_modules()
	SaveManager.save_game()
	return_to_hangar.emit()
