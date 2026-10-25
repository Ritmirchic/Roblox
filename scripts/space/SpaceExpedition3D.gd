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
var _lightning_beam: MeshInstance3D

# Camera rig
var _cam_pivot: Node3D
var _cam: Camera3D
var _cam_dist: float = 17.0
var _cam_yaw_off: float = 0.0
var _cam_pitch_off: float = -12.0
var _mouse_steer: Vector2 = Vector2.ZERO
var _mouse_captured: bool = true

# Timers
var _enemy_spawn_cd: float = 5.0
var _hazard_cd: float = 9.0
var _hazard_flash_t: float = 0.0

# HUD elements
var _hud_layer: CanvasLayer
var _hud_root: Control
var _overlay_canvas: Control
var _radar_canvas: Control
var _hp_bar: ProgressBar
var _shld_bar: ProgressBar
var _eng_bar: ProgressBar
var _heat_bar: ProgressBar
var _cargo_bar: ProgressBar
var _telemetry_lbl: Label
var _sector_lbl: Label
var _min_ach_lbl: Label
var _hazard_warn_lbl: Label
var _pause_panel: PanelContainer
var _extracting: bool = false

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
	_set_mouse_flight_mode(true)

func _exit_tree() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	AudioManager.stop_loops()

func _set_mouse_flight_mode(active: bool) -> void:
	_mouse_captured = active
	# Avoid capturing mouse during headless automated tests
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

	# 3D Starfield & Nebula Dust Particles around ship
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

	# Smooth Third-Person Camera Rig
	_cam_pivot = Node3D.new()
	add_child(_cam_pivot)
	_cam = Camera3D.new()
	_cam.fov = 65.0
	_cam.far = 900.0
	_cam_pivot.add_child(_cam)

	# Extraction Return Buoy Gate behind spawn at (0, 0, 52)
	_warp_gate = Node3D.new()
	_warp_gate.position = Vector3(0, 0, 52)
	add_child(_warp_gate)
	if ResourceLoader.exists("res://assets/models/hangar/env_space_buoy.glb"):
		var bps: PackedScene = load("res://assets/models/hangar/env_space_buoy.glb")
		if bps:
			_warp_gate.add_child(bps.instantiate())
	var portal := VFXFactory.create_holo_panel(Vector2(11.5, 11.5), Color(0.20, 0.95, 0.68, 0.48))
	_warp_gate.add_child(portal)
	var gate_lbl := Label3D.new()
	gate_lbl.text = "HANGAR WARP GATE"
	gate_lbl.font_size = 48
	gate_lbl.modulate = Color(0.35, 1.0, 0.72)
	gate_lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	gate_lbl.position = Vector3(0, 9.6, 0)
	_warp_gate.add_child(gate_lbl)

func _populate_asteroids_and_props() -> void:
	var count: int = int(sector_def.get("asteroid_count", 45))
	for _i in range(count):
		_spawn_single_asteroid(32.0, 250.0)

	# Iron Graveyard abandoned freighter hulks
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

	# Initial enemy patrol wave
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
		# Maintain rich belt population
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
# EXPEDITION HUD, SCANNER BRACKETS & TACTICAL RADAR
# ==============================================================================
func _build_expedition_hud() -> void:
	_hud_layer = CanvasLayer.new()
	add_child(_hud_layer)

	_hud_root = Control.new()
	_hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_hud_root.theme = ThemeHelper.main_theme
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_layer.add_child(_hud_root)

	# 2D World-Projected Scanner & Reticle Canvas
	_overlay_canvas = Control.new()
	_overlay_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_canvas.draw.connect(_draw_hud_world_overlays)
	_hud_root.add_child(_overlay_canvas)

	# Top-Left Ship Status Panel
	var status_box := PanelContainer.new()
	status_box.offset_left = 16
	status_box.offset_top = 14
	status_box.offset_right = 370
	status_box.offset_bottom = 232
	_hud_root.add_child(status_box)

	var svb := VBoxContainer.new()
	svb.add_theme_constant_override("separation", 5)
	status_box.add_child(svb)

	_sector_lbl = Label.new()
	_sector_lbl.text = str(sector_def["name"]).to_upper()
	if ThemeHelper.font_display:
		_sector_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_sector_lbl.add_theme_font_size_override("font_size", 17)
	_sector_lbl.add_theme_color_override("font_color", sector_def["sun_color"])
	svb.add_child(_sector_lbl)

	_hp_bar = _make_hud_bar(svb, "HULL", Color(0.24, 0.90, 0.52))
	_shld_bar = _make_hud_bar(svb, "SHIELD", Color(0.20, 0.74, 1.0))
	_eng_bar = _make_hud_bar(svb, "POWER", Color(1.0, 0.84, 0.25))
	_heat_bar = _make_hud_bar(svb, "HEAT", Color(1.0, 0.45, 0.18))
	_cargo_bar = _make_hud_bar(svb, "CARGO", Color(0.78, 0.52, 1.0))

	_telemetry_lbl = Label.new()
	if ThemeHelper.font_mono:
		_telemetry_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_telemetry_lbl.add_theme_font_size_override("font_size", 14)
	svb.add_child(_telemetry_lbl)

	# Top-Center Hazard & Minute-Task Banner
	_min_ach_lbl = Label.new()
	_min_ach_lbl.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_min_ach_lbl.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_min_ach_lbl.offset_left = -320
	_min_ach_lbl.offset_right = 320
	_min_ach_lbl.offset_top = 14
	_min_ach_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_min_ach_lbl.add_theme_color_override("font_color", Color(0.68, 0.92, 1.0))
	_hud_root.add_child(_min_ach_lbl)

	_hazard_warn_lbl = Label.new()
	_hazard_warn_lbl.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_hazard_warn_lbl.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_hazard_warn_lbl.offset_left = -280
	_hazard_warn_lbl.offset_right = 280
	_hazard_warn_lbl.offset_top = 44
	_hazard_warn_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_bold:
		_hazard_warn_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_hazard_warn_lbl.add_theme_font_size_override("font_size", 21)
	_hazard_warn_lbl.add_theme_color_override("font_color", Color(1.0, 0.38, 0.42))
	_hud_root.add_child(_hazard_warn_lbl)

	# Top-Right Tactical Radar Minimap + Return Button
	var radar_box := PanelContainer.new()
	radar_box.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	radar_box.offset_left = -214
	radar_box.offset_right = -16
	radar_box.offset_top = 14
	radar_box.offset_bottom = 258
	radar_box.mouse_filter = Control.MOUSE_FILTER_STOP
	_hud_root.add_child(radar_box)

	var rvb := VBoxContainer.new()
	rvb.alignment = BoxContainer.ALIGNMENT_CENTER
	radar_box.add_child(rvb)

	_radar_canvas = Control.new()
	_radar_canvas.custom_minimum_size = Vector2(170, 170)
	_radar_canvas.draw.connect(_draw_radar_minimap)
	rvb.add_child(_radar_canvas)

	var ret_btn := Button.new()
	ret_btn.text = "RETURN HANGAR [H]"
	ret_btn.add_theme_font_size_override("font_size", 15)
	ThemeHelper.style_accent_button(ret_btn, Color(0.18, 0.78, 0.56))
	ret_btn.pressed.connect(_complete_expedition_and_return)
	rvb.add_child(ret_btn)

	# Bottom Flight Controls Hint
	var hint := Label.new()
	hint.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint.grow_horizontal = Control.GROW_DIRECTION_BOTH
	hint.offset_left = -520
	hint.offset_right = 520
	hint.offset_top = -36
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.text = "W/S: Thrust • A/D: Strafe • Space/Ctrl: Up/Down • Mouse: Steer • LMB: Weapons • RMB/F: Mining Laser • Shift: Boost • Z: Assist • TAB/ESC: Cursor"
	hint.add_theme_font_size_override("font_size", 14)
	hint.add_theme_color_override("font_color", Color(0.66, 0.82, 0.96))
	_hud_root.add_child(hint)

	# Pause / Cursor Menu
	_pause_panel = PanelContainer.new()
	_pause_panel.visible = false
	_pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	_pause_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_pause_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	_pause_panel.custom_minimum_size = Vector2(400, 240)
	_pause_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_hud_root.add_child(_pause_panel)

	var pvb := VBoxContainer.new()
	pvb.alignment = BoxContainer.ALIGNMENT_CENTER
	pvb.add_theme_constant_override("separation", 14)
	_pause_panel.add_child(pvb)

	var ptitle := Label.new()
	ptitle.text = "EXPEDITION COMMAND"
	ptitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_display:
		ptitle.add_theme_font_override("font", ThemeHelper.font_display)
	pvb.add_child(ptitle)

	var b_res := Button.new()
	b_res.text = "RESUME FLIGHT"
	ThemeHelper.style_accent_button(b_res, Color(0.20, 0.75, 1.0))
	b_res.pressed.connect(func():
		_pause_panel.visible = false
		_set_mouse_flight_mode(true)
	)
	pvb.add_child(b_res)

	var b_ext := Button.new()
	b_ext.text = "EXTRACT TO HANGAR (KEEP CARGO)"
	ThemeHelper.style_accent_button(b_ext, Color(0.18, 0.80, 0.52))
	b_ext.pressed.connect(_complete_expedition_and_return)
	pvb.add_child(b_ext)

func _make_hud_bar(parent: VBoxContainer, label_txt: String, col: Color) -> ProgressBar:
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 8)
	parent.add_child(hb)
	var l := Label.new()
	l.text = label_txt
	l.custom_minimum_size = Vector2(62, 0)
	l.add_theme_font_size_override("font_size", 14)
	hb.add_child(l)
	var pb := ProgressBar.new()
	pb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pb.custom_minimum_size = Vector2(0, 14)
	pb.show_percentage = false
	var fill := ThemeHelper.make_panel_style(col, col.lightened(0.3), 3, 1)
	fill.shadow_size = 0
	pb.add_theme_stylebox_override("fill", fill)
	hb.add_child(pb)
	return pb

func _on_ship_telemetry(tel: Dictionary) -> void:
	if not is_instance_valid(_hp_bar):
		return
	_hp_bar.max_value = maxf(1.0, float(tel["max_hp"]))
	_hp_bar.value = float(tel["hp"])
	_shld_bar.max_value = maxf(1.0, float(tel["max_shield"]))
	_shld_bar.value = float(tel["shield"])
	_eng_bar.max_value = maxf(1.0, float(tel["max_energy"]))
	_eng_bar.value = float(tel["energy"])
	_heat_bar.max_value = 100.0
	_heat_bar.value = float(tel["heat"])

	var cap := maxi(1, int(player_ship.stats.get("cargo_capacity", 40)))
	var used := ShipGrid.get_current_cargo_units()
	_cargo_bar.max_value = float(cap)
	_cargo_bar.value = float(used)

	_telemetry_lbl.text = "SPD %3.0f m/s  •  CR %d  •  CRY %d  •  ASTB %s" % [
		float(tel["speed"]), ShipGrid.credits, ShipGrid.crystals, ("ON" if bool(tel["stabilizer"]) else "OFF")
	]

	# Live Minute Achievement ticker
	var mtasks: Array = AchievementManager.active_tasks.get("minute", [])
	if not mtasks.is_empty():
		var active_sample: Dictionary = mtasks[0]
		for mt in mtasks:
			if not bool(mt["completed"]):
				active_sample = mt
				break
		_min_ach_lbl.text = "MINUTE TASK (%ds): %s (%d/%d)  •  +%d CRY" % [
			AchievementManager.get_seconds_until_reset("minute"),
			active_sample["objective"],
			int(floor(float(active_sample["progress"]))),
			int(active_sample["target"]),
			int(active_sample["crystal_reward"])
		]

func _draw_hud_world_overlays() -> void:
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var center: Vector2 = vp * 0.5
	# Center Flight & Mining Crosshair
	_overlay_canvas.draw_arc(center, 16.0, 0.0, TAU, 28, Color(0.32, 0.90, 1.0, 0.78), 1.8)
	_overlay_canvas.draw_circle(center, 2.5, Color(1.0, 0.88, 0.35, 0.95))

	if not is_instance_valid(player_ship) or not is_instance_valid(_cam):
		return

	# Resource Scanner 3D HUD Brackets (if Resource Scanner installed!)
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

	# Enemy HUD Target Boxes
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
				# Enemy mini HP bar
				var hp_pct := clampf(en3d.hp / maxf(1.0, en3d.max_hp), 0.0, 1.0)
				_overlay_canvas.draw_rect(Rect2(ep + Vector2(-20, -sz - 8), Vector2(40.0 * hp_pct, 4)), Color(1.0, 0.32, 0.28), true)

func _draw_radar_minimap() -> void:
	var c := _radar_canvas.size * 0.5
	var r := minf(c.x, c.y) - 6.0
	_radar_canvas.draw_circle(c, r, Color(0.02, 0.05, 0.11, 0.92))
	_radar_canvas.draw_arc(c, r, 0.0, TAU, 36, Color(0.22, 0.76, 1.0, 0.85), 2.0)
	_radar_canvas.draw_arc(c, r * 0.5, 0.0, TAU, 28, Color(0.18, 0.52, 0.76, 0.45), 1.0)
	_radar_canvas.draw_circle(c, 3.5, Color.WHITE)

	if not is_instance_valid(player_ship):
		return
	var max_r := maxf(80.0, float(player_ship.stats.get("radar_range", 140.0)))
	var inv_basis := player_ship.global_transform.basis.inverse()

	# Warp Gate blip (Green)
	if is_instance_valid(_warp_gate):
		var rel_g := inv_basis * (_warp_gate.global_position - player_ship.global_position)
		var g2 := Vector2(rel_g.x, rel_g.z) / max_r * r
		if g2.length() > r - 4.0:
			g2 = g2.normalized() * (r - 4.0)
		_radar_canvas.draw_circle(c + g2, 4.5, Color(0.28, 1.0, 0.65))

	# Asteroids (Cyan dots)
	for ast in asteroids_root.get_children():
		if ast is Node3D:
			var ast_n := ast as Node3D
			var rel_a: Vector3 = inv_basis * (ast_n.global_position - player_ship.global_position)
			var a2 := Vector2(rel_a.x, rel_a.z) / max_r * r
			if a2.length() <= r - 3.0:
				_radar_canvas.draw_circle(c + a2, 2.0, Color(0.32, 0.82, 1.0, 0.65))

	# Enemies (Red blips)
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

	# Keep nebula particles centered near ship
	var neb := get_node_or_null("NebulaParticles")
	if neb is Node3D:
		neb.global_position = player_ship.global_position

	_handle_flight_inputs(delta)
	_update_third_person_camera(delta)
	_process_sector_spawns_and_hazards(delta)

	# Check Extraction Warp Gate proximity
	if is_instance_valid(_warp_gate) and player_ship.global_position.distance_to(_warp_gate.global_position) < 9.5:
		_complete_expedition_and_return()
		return

	_overlay_canvas.queue_redraw()
	_radar_canvas.queue_redraw()

func _handle_flight_inputs(_delta: float) -> void:
	if _pause_panel.visible:
		player_ship.thrust_input = Vector3.ZERO
		player_ship.rot_input = Vector3.ZERO
		player_ship.firing_weapons = false
		player_ship.firing_mining = false
		return

	var th := Vector3.ZERO
	if Input.is_key_pressed(KEY_W): th.z += 1.0
	if Input.is_key_pressed(KEY_S): th.z -= 0.65
	if Input.is_key_pressed(KEY_D): th.x += 1.0
	if Input.is_key_pressed(KEY_A): th.x -= 1.0
	if Input.is_key_pressed(KEY_SPACE): th.y += 1.0
	if Input.is_key_pressed(KEY_CTRL): th.y -= 1.0
	player_ship.thrust_input = th
	player_ship.boost_active = Input.is_key_pressed(KEY_SHIFT)

	var rot := Vector3.ZERO
	if _mouse_captured:
		rot.y = clampf(-_mouse_steer.x * 0.14 * ThemeHelper.camera_sensitivity, -2.2, 2.2)
		rot.x = clampf(-_mouse_steer.y * 0.14 * ThemeHelper.camera_sensitivity, -2.0, 2.0)
	_mouse_steer = _mouse_steer.lerp(Vector2.ZERO, 0.45)

	if Input.is_key_pressed(KEY_LEFT): rot.y += 1.2
	if Input.is_key_pressed(KEY_RIGHT): rot.y -= 1.2
	if Input.is_key_pressed(KEY_UP): rot.x += 1.0
	if Input.is_key_pressed(KEY_DOWN): rot.x -= 1.0
	if Input.is_key_pressed(KEY_Q): rot.z += 1.4
	if Input.is_key_pressed(KEY_E): rot.z -= 1.4
	player_ship.rot_input = rot

	player_ship.firing_weapons = _mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	player_ship.firing_mining = (_mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)) or Input.is_key_pressed(KEY_F)

	# Auto-acquire nearest target near reticle for turrets & seeker missiles
	var cam_fwd := -_cam.global_transform.basis.z
	player_ship.aimed_world_point = _cam.global_position + cam_fwd * 150.0
	var space_q := PhysicsRayQueryParameters3D.create(_cam.global_position, _cam.global_position + cam_fwd * 240.0)
	space_q.exclude = [player_ship.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(space_q)
	if not hit.is_empty():
		player_ship.aimed_world_point = hit["position"]

	var best_en: Node3D = null
	var best_dot := 0.88
	for en in enemies_root.get_children():
		if en is Node3D:
			var en_n := en as Node3D
			var dir_e: Vector3 = (en_n.global_position - _cam.global_position).normalized()
			var d_dot := cam_fwd.dot(dir_e)
			if d_dot > best_dot and en_n.global_position.distance_to(player_ship.global_position) < 250.0:
				best_dot = d_dot
				best_en = en_n
	if is_instance_valid(best_en):
		player_ship.locked_enemy = best_en

func _update_third_person_camera(delta: float) -> void:
	var target_pos := player_ship.global_position + player_ship.global_transform.basis * Vector3(0, 1.8, 0)
	_cam_pivot.global_position = _cam_pivot.global_position.lerp(target_pos, clampf(delta * 14.0, 0.0, 1.0))

	var desired_basis := player_ship.global_transform.basis * Basis.from_euler(Vector3(deg_to_rad(_cam_pitch_off), deg_to_rad(_cam_yaw_off), 0.0))
	_cam_pivot.global_transform.basis = _cam_pivot.global_transform.basis.slerp(desired_basis, clampf(delta * 9.0, 0.0, 1.0)).orthonormalized()

	var spd_ratio := clampf(player_ship.linear_velocity.length() / 75.0, 0.0, 1.0)
	var desired_dist := _cam_dist + spd_ratio * 3.2
	_cam.fov = lerpf(_cam.fov, 64.0 + spd_ratio * 11.0, clampf(delta * 5.0, 0.0, 1.0))

	# Anti-clipping raycast from pivot to desired camera position
	var desired_world := _cam_pivot.global_position + _cam_pivot.global_transform.basis.z * desired_dist
	var rq := PhysicsRayQueryParameters3D.create(_cam_pivot.global_position, desired_world)
	rq.exclude = [player_ship.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(rq)
	if not hit.is_empty():
		var safe_d := maxf(4.0, _cam_pivot.global_position.distance_to(hit["position"]) - 1.0)
		_cam.position = Vector3(0, 0, safe_d)
	else:
		_cam.position = _cam.position.lerp(Vector3(0, 0, desired_dist), clampf(delta * 12.0, 0.0, 1.0))

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
			_hazard_warn_lbl.text = "WARNING: PLASMA STORM DISCHARGE IMMINENT!"
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
		_mouse_steer += event.relative

	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_cam_dist = clampf(_cam_dist - 1.5, 8.5, 34.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_cam_dist = clampf(_cam_dist + 1.5, 8.5, 34.0)

	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_ESCAPE, KEY_TAB]:
			_pause_panel.visible = not _pause_panel.visible
			_set_mouse_flight_mode(not _pause_panel.visible)
		elif event.keycode == KEY_Z and is_instance_valid(player_ship):
			player_ship.stabilizer_enabled = not player_ship.stabilizer_enabled
			AudioManager.play_sfx("ui_click", 0.05, 0.6)
		elif event.keycode == KEY_H:
			_complete_expedition_and_return()

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
	# Emergency tug recovery back to Hangar (repairs cockpit; 25% loose ore lost)
	for k in ShipGrid.cargo.keys():
		ShipGrid.cargo[k] = int(floor(float(int(ShipGrid.cargo[k])) * 0.75))
	ShipGrid.repair_all_modules()
	SaveManager.save_game()
	return_to_hangar.emit()
