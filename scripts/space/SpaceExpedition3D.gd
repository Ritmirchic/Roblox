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
var _shake_trauma: float = 0.0
var _shake_seed: float = 0.0
var _ach_toast: PanelContainer
var _ach_toast_lbl: Label
var _ach_toast_time: float = 0.0
var _alert_lbl: Label
var _alert_time: float = 0.0
var _brownout_hud: bool = false
var _ach_toast_queue: Array[String] = []
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
var _power_bar: ProgressBar
var _threat_bar: ProgressBar
# "Return to hangar" is a portal action, not a teleport: the button paints guidance.
var _return_guidance_t: float = 0.0
# Sector threat: mining and killing pull response wings onto the player.
var _threat: float = 0.0
var _response_cd: float = 16.0
var _wings_called: int = 0
var _threat_hot: bool = false
var _power_lbl: Label
var _power_warn: Label
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
	AchievementManager.achievement_completed.connect(_on_achievement_completed)
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
	player_ship.cargo_spilled.connect(_on_cargo_spilled)
	player_ship.ship_telemetry_updated.connect(_on_ship_telemetry)

	_cam_pivot = Node3D.new()
	add_child(_cam_pivot)
	_cam = Camera3D.new()
	_cam.fov = ThemeHelper.camera_fov
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
		_add_threat(3.2)
		if is_instance_valid(player_ship) and _wp.distance_to(player_ship.global_position) < 120.0:
			add_camera_trauma(0.30)
		if is_inside_tree() and asteroids_root.get_child_count() < int(sector_def.get("asteroid_count", 45)):
			_spawn_single_asteroid(85.0, 260.0)
	)
	asteroids_root.add_child(ast)

func _spawn_sector_enemy(eid_override: String = "", as_elite: bool = false, at: Vector3 = Vector3.ZERO, use_pos: bool = false, guarantee_salvage: bool = false, aggression: float = 1.0) -> void:
	var pool: Array = sector_def.get("enemy_pool", ["scout_drone"])
	if pool.is_empty() or not is_instance_valid(player_ship):
		return
	var eid: String = eid_override if pool.has(eid_override) else str(pool[randi() % pool.size()])
	var spawn_pos: Vector3 = at if use_pos else player_ship.global_position + Vector3(
		cos(randf() * TAU) * 145.0, randf_range(-24.0, 24.0), sin(randf() * TAU) * 145.0)
	var en := EnemyShip3D.new()
	en.setup(eid, spawn_pos, player_ship, projectiles_root, chunks_root, as_elite)
	en.aggression = clampf(aggression, 1.0, 1.6)
	if as_elite:
		en.set_meta("salvage_guaranteed", false)
	en.set_meta("salvage_guaranteed", bool(as_elite) and guarantee_salvage)
	en.defeated.connect(_on_enemy_defeated)
	enemies_root.add_child(en)


func _add_threat(amount: float) -> void:
	_threat = clampf(_threat + amount, 0.0, 100.0)


# Response wings: the sector answers back, escalating into elite formations.
func _spawn_response_wing(tier: int) -> void:
	var pool: Array = sector_def.get("enemy_pool", ["scout_drone"])
	if pool.is_empty() or not is_instance_valid(player_ship):
		return
	var heavy: String = str(pool[pool.size() - 1])
	var light: String = str(pool[0])
	var pressure := clampf(_threat / 100.0, 0.0, 1.0)
	var base_ang := randf() * TAU
	var orbit := 188.0 + 26.0 * float(tier)
	var center := player_ship.global_position + Vector3(cos(base_ang) * orbit, randf_range(-18.0, 26.0), sin(base_ang) * orbit)
	var escorts := 2 if tier == 1 else 3
	for i in range(escorts):
		var off := Vector3(cos(base_ang + TAU * float(i) / float(escorts)) * 42.0, float(i - 1) * 9.0, sin(base_ang + TAU * float(i) / float(escorts)) * 42.0)
		_spawn_sector_enemy(light, false, center + off, true, false, lerpf(1.06, 1.34, pressure))
	_spawn_sector_enemy(heavy, true, center, true, tier >= 2, lerpf(1.10, 1.42, pressure))
	_wings_called += 1
	if tier >= 2:
		_hud_alert(L.tr_ui("threat_heavy_inbound"), Color(1.0, 0.46, 0.24))
		add_camera_trauma(0.72)
		AudioManager.play_sfx("ui_error", 0.03, 0.52)
	else:
		_hud_alert(L.tr_ui("threat_elite_inbound"), Color(1.0, 0.80, 0.32))
		add_camera_trauma(0.42)
		AudioManager.play_sfx("ui_error", 0.05, 0.72)


func _on_enemy_defeated(en: EnemyShip3D, world_pos: Vector3) -> void:
	if en == null:
		return
	_add_threat(15.0 if en.elite else 8.5)
	add_camera_trauma(0.95 if en.elite else 0.18)
	if en.elite:
		_spawn_kill_shockwave(world_pos)
	if not en.elite:
		return
	if bool(en.get_meta("salvage_guaranteed", false)) or randf() < 0.30:
		_grant_salvage_card(world_pos)


# Elite kills get a set-piece read: an expanding command ring over the wreck.
func _spawn_kill_shockwave(at: Vector3) -> void:
	if ThemeHelper.reduced_motion:
		return
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 3.0
	torus.outer_radius = 3.65
	torus.rings = 40
	torus.ring_segments = 8
	ring.mesh = torus
	ring.rotation_degrees = Vector3(90, 0, 0)
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var rmat := StandardMaterial3D.new()
	rmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	rmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	rmat.albedo_color = Color(1.0, 0.86, 0.45, 0.82)
	rmat.emission_enabled = true
	rmat.emission = Color(1.0, 0.78, 0.32)
	rmat.emission_energy_multiplier = 2.4
	ring.material_override = rmat
	ring.global_position = at
	enemies_root.add_child(ring)
	var tw := ring.create_tween()
	tw.tween_property(ring, "scale", Vector3.ONE * 9.5, 0.58).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(rmat, "albedo_color:a", 0.0, 0.62)
	tw.tween_callback(ring.queue_free)


# Elite wing leaders carry collectible prints: combat feeds the card chase.
func _grant_salvage_card(at: Vector3) -> void:
	var pool: Array[Dictionary] = []
	for c in GameData.crew_cards:
		if GameData.RARITY_ORDER.find(str(c["rarity"])) >= 2:
			pool.append(c)
	if pool.is_empty():
		return
	var pick: Dictionary = pool[randi() % pool.size()]
	var fid := _roll_elite_finish()
	var res := CrewManager.grant_card(str(pick["id"]), fid)
	var fcol: Color = GameData.get_finish(fid).get("tint", Color(0.7, 0.95, 1.0))
	AudioManager.play_sfx("card_legendary", 0.03, 0.95)
	VFXFactory.spawn_explosion(enemies_root, at, fcol, 1.1)
	var salvage_msg := L.tr_ui("crew_salvage_card", [str(pick["name"]), L.foil_name(fid)])
	if bool(res.get("upgraded", false)):
		salvage_msg += "  •  " + L.tr_ui("foil_upgraded", [L.foil_name(fid)])
	_hud_alert(salvage_msg, fcol)


func _roll_elite_finish() -> String:
	var total := 0.0
	var ids: Array[String] = []
	for fid in GameData.FINISH_ORDER:
		if GameData.get_finish_rank(str(fid)) >= 2:
			ids.append(str(fid))
			total += float(GameData.CARD_FINISHES[str(fid)]["weight"])
	if ids.is_empty() or total <= 0.0:
		return "holo"
	var roll := randf() * total
	for fid in ids:
		roll -= float(GameData.CARD_FINISHES[fid]["weight"])
		if roll <= 0.0:
			return fid
	return ids[ids.size() - 1]

# ==============================================================================
# REBUILT NON-OVERLAPPING EXPEDITION HUD, SCANNER BRACKETS & TACTICAL RADAR
# ==============================================================================
func _build_expedition_hud() -> void:
	_hud_layer = CanvasLayer.new()
	add_child(_hud_layer)

	_hud_root = Control.new()
	_hud_layer.add_child(_hud_root)
	ThemeHelper.fill_full_rect(_hud_root)
	_hud_root.theme = ThemeHelper.main_theme
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE

	_overlay_canvas = Control.new()
	_hud_root.add_child(_overlay_canvas)
	ThemeHelper.fill_full_rect(_overlay_canvas)
	_overlay_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_canvas.draw.connect(_draw_hud_world_overlays)

	# 1. Top-Left Ship Status Panel (x: 14..362, y: 12..236)
	_status_box = PanelContainer.new()
	_status_box.name = "FlightStatusPanel"
	_status_box.offset_left = 14
	_status_box.offset_top = 12
	_status_box.offset_right = 362
	_status_box.offset_bottom = 236
	_status_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_status_box.visible = ThemeHelper.show_hud_bars
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
	_threat_bar = _make_hud_bar(svb, "hud_threat", Color(1.0, 0.42, 0.26))
	_threat_bar.max_value = 100.0

	# --- Reactor load governor readout (v2.2.0) ---
	var prow := HBoxContainer.new()
	prow.add_theme_constant_override("separation", 6)
	svb.add_child(prow)
	var plbl := Label.new()
	plbl.custom_minimum_size = Vector2(78, 0)
	plbl.clip_text = true
	plbl.add_theme_font_size_override("font_size", 12)
	plbl.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
	plbl.text = L.tr_ui("hud_reactor")
	prow.add_child(plbl)
	_power_bar = ProgressBar.new()
	_power_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_power_bar.custom_minimum_size = Vector2(0, 12)
	_power_bar.max_value = 100.0
	_power_bar.show_percentage = false
	_power_bar.add_theme_stylebox_override("fill", ThemeHelper.make_hud_bar_style(Color(1.0, 0.62, 0.20), true))
	_power_bar.add_theme_stylebox_override("background", ThemeHelper.make_hud_bar_style(Color(1.0, 0.62, 0.20), false))
	prow.add_child(_power_bar)
	_power_lbl = Label.new()
	_power_lbl.custom_minimum_size = Vector2(68, 0)
	_power_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	if ThemeHelper.font_mono:
		_power_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_power_lbl.add_theme_font_size_override("font_size", 11)
	_power_lbl.add_theme_color_override("font_color", Color(1.0, 0.78, 0.35))
	prow.add_child(_power_lbl)
	_power_warn = Label.new()
	_power_warn.clip_text = true
	_power_warn.add_theme_font_size_override("font_size", 11)
	_power_warn.add_theme_color_override("font_color", Color(1.0, 0.36, 0.28))
	_power_warn.visible = false
	prow.add_child(_power_warn)

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
	_min_task_pill.add_theme_stylebox_override("panel", ThemeHelper.make_hud_pill_style(
		Color(0.02, 0.045, 0.105, 0.88), Color(0.22, 0.75, 1.0, 0.58)))
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

	_ach_toast = PanelContainer.new()
	_ach_toast.name = "AchievementToast"
	_ach_toast.anchor_left = 0.0
	_ach_toast.anchor_right = 1.0
	_ach_toast.offset_left = 430
	_ach_toast.offset_right = -430
	_ach_toast.offset_top = 252
	_ach_toast.offset_bottom = 300
	_ach_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ach_toast.visible = false
	_ach_toast.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(
		Color(0.035, 0.075, 0.14, 0.95), Color(1.0, 0.78, 0.25, 0.92), 12, 14, 6))
	_hud_root.add_child(_ach_toast)

	# Transient flight alert (cargo spill, reactor shed, market receipts)
	_alert_lbl = Label.new()
	_alert_lbl.name = "HudAlert"
	_alert_lbl.anchor_left = 0.0
	_alert_lbl.anchor_right = 1.0
	_alert_lbl.offset_left = 340
	_alert_lbl.offset_right = -340
	_alert_lbl.offset_top = 306
	_alert_lbl.custom_minimum_size = Vector2(0, 40)
	_alert_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_alert_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_alert_lbl.clip_text = true
	_alert_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_alert_lbl.visible = false
	if ThemeHelper.font_bold:
		_alert_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_alert_lbl.add_theme_font_size_override("font_size", 16)
	_alert_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	_alert_lbl.add_theme_color_override("font_outline_color", Color(0.012, 0.03, 0.07, 0.92))
	_alert_lbl.add_theme_constant_override("outline_size", 4)
	_hud_root.add_child(_alert_lbl)

	_ach_toast_lbl = Label.new()
	_ach_toast_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_ach_toast_lbl.clip_text = true
	if ThemeHelper.font_bold:
		_ach_toast_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_ach_toast_lbl.add_theme_font_size_override("font_size", 15)
	_ach_toast_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	_ach_toast.add_child(_ach_toast_lbl)

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
	_ret_btn.pressed.connect(func():
		_pause_panel.visible = false
		_set_mouse_flight_mode(true)
		_return_guidance_t = 12.0
		_hud_alert(L.tr_ui("hud_return_guidance"), Color(0.36, 0.98, 0.86))
		AudioManager.play_sfx("ui_click", 0.04, 0.7)
)
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
	_hint_pill.add_theme_stylebox_override("panel", ThemeHelper.make_hud_pill_style(
		Color(0.015, 0.035, 0.085, 0.84), Color(0.20, 0.62, 0.90, 0.45)))
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
	_pause_panel.add_theme_stylebox_override("panel", ThemeHelper.make_modal_style(24, 0.84))
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
	_pause_ext_btn.pressed.connect(func():
		_pause_panel.visible = false
		_set_mouse_flight_mode(true)
)
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
	pb.add_theme_stylebox_override("fill", ThemeHelper.make_hud_bar_style(col, true))
	pb.add_theme_stylebox_override("background", ThemeHelper.make_hud_bar_style(col, false))
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

func _hud_alert(msg: String, col: Color = ThemeHelper.COL_GOLD) -> void:
	if not is_instance_valid(_alert_lbl):
		return
	_alert_lbl.text = msg
	_alert_lbl.add_theme_color_override("font_color", col)
	_alert_lbl.visible = true
	_alert_time = 3.6
	ThemeHelper.animate_entry(_alert_lbl, 0.0, Vector2(0.94, 0.94))


func _tick_hud_alert(delta: float) -> void:
	if _alert_time <= 0.0 or not is_instance_valid(_alert_lbl):
		return
	_alert_time -= delta
	if _alert_time <= 1.0:
		_alert_lbl.modulate.a = clampf(_alert_time, 0.0, 1.0)
	if _alert_time <= 0.0:
		_alert_lbl.visible = false
		_alert_lbl.modulate.a = 1.0


func _on_cargo_spilled(lost: Dictionary, at_pos: Vector3) -> void:
	# Spilled ore is not destroyed: it scatters as real recoverable chunks, so a
	# magnet rig can pull the haul back in while a bare hull loses it outright.
	var units := 0
	for k in lost.keys():
		units += int(lost[k])
	if units <= 0:
		return
	var parent: Node = chunks_root if chunks_root != null else self
	var budget := 4
	for k in lost.keys():
		var qty := int(lost[k])
		if qty <= 0:
			continue
		var per := maxi(1, int(ceil(float(qty) / float(maxi(1, budget)))))
		var made := 0
		while qty > 0 and made < maxi(1, budget):
			var this_qty := mini(per, qty)
			qty -= this_qty
			made += 1
			var chunk := ResourceChunk3D.new()
			var dir := Vector3(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0), randf_range(-1.0, 1.0))
			if dir.length_squared() < 0.01:
				dir = Vector3.UP
			dir = dir.normalized()
			chunk.setup(str(k), this_qty, at_pos + dir * 2.4, dir * randf_range(3.0, 9.0))
			parent.add_child(chunk)
		budget = maxi(1, budget - made)
	AudioManager.play_sfx("pickup_resource", -0.10, 0.58)
	_hud_alert(L.tr_ui("cargo_spill", [units]), Color(1.0, 0.45, 0.32))


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

	var pw: Dictionary = tel.get("power", {})
	if not pw.is_empty() and is_instance_valid(_power_bar):
		var load_pct: float = clampf(float(pw.get("load_pct", 0.0)) * 100.0, 0.0, 199.0)
		_power_bar.value = minf(100.0, load_pct)
		var rows: Array = pw.get("rows", [])
		var tag := ""
		var shed := false
		for r in rows:
			var rr: Dictionary = r
			var pre := "M"
			if str(rr["id"]) == "weapons":
				pre = "G"
			elif str(rr["id"]) == "engines":
				pre = "E"
			elif str(rr["id"]) == "repair":
				pre = "R"
			if bool(rr["shed"]):
				shed = true
				tag += "%s-" % pre
			else:
				tag += "%s%d " % [pre, int(round(float(rr["factor"]) * 100.0))]
		_power_lbl.text = ("%d%%" % int(round(load_pct))) if tag.is_empty() else tag.strip_edges()
		_power_lbl.add_theme_color_override("font_color",
			Color(1.0, 0.40, 0.30) if shed else Color(1.0, 0.78, 0.35))
		var bo: bool = bool(pw.get("brownout", false))
		_power_warn.text = L.tr_ui("hud_brownout")
		_power_warn.visible = bo
		if bo and not _brownout_hud:
			_brownout_hud = true
			AudioManager.play_sfx("ui_error", 0.02, 0.72)
			_hud_alert(L.tr_ui("hud_brownout"), Color(1.0, 0.40, 0.28))
		elif not bo:
			_brownout_hud = false

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

	var xh_a: float = ThemeHelper.crosshair_opacity
	var nose_col := Color(0.55, 0.78, 0.95, 0.34 * xh_a)
	_overlay_canvas.draw_line(center + Vector2(-7, 0), center + Vector2(-2, 0), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(2, 0), center + Vector2(7, 0), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(0, -7), center + Vector2(0, -2), nose_col, 1.4)
	_overlay_canvas.draw_line(center + Vector2(0, 2), center + Vector2(0, 7), nose_col, 1.4)
	if _smoothed_stick.length() > 0.04:
		_overlay_canvas.draw_arc(center, STEER_RING_RADIUS_PX, 0.0, TAU, 48, Color(0.20, 0.62, 0.88, 0.16), 1.2)

	if not is_instance_valid(player_ship) or not is_instance_valid(_cam):
		return

	# CROSSHAIR #1: Primary Steering & Aiming Reticle (Cyan) - the single sight.
	var aim_screen_pos: Vector2 = center + _smoothed_stick * STEER_RING_RADIUS_PX
	if aim_screen_pos.distance_to(center) > 4.0:
		_overlay_canvas.draw_line(center, aim_screen_pos, Color(0.28, 0.86, 1.0, 0.28 * xh_a), 1.5)
	var aim_col := Color(0.28, 0.92, 1.0, 0.88 * xh_a)
	_overlay_canvas.draw_arc(aim_screen_pos, 15.0, 0.0, TAU, 32, aim_col, 1.8)
	_overlay_canvas.draw_arc(aim_screen_pos, 23.0, 0.0, TAU, 40, Color(0.28, 0.92, 1.0, 0.22 * xh_a), 1.2)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(-22, 0), aim_screen_pos + Vector2(-15, 0), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(15, 0), aim_screen_pos + Vector2(22, 0), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(0, -22), aim_screen_pos + Vector2(0, -15), aim_col, 1.8)
	_overlay_canvas.draw_line(aim_screen_pos + Vector2(0, 15), aim_screen_pos + Vector2(0, 22), aim_col, 1.8)
	_overlay_canvas.draw_circle(aim_screen_pos, 2.0, Color(0.75, 0.98, 1.0, 0.95 * xh_a))

	# Firing solution is reported as a readout on reticle #1 - no second marker.
	var ballistics := player_ship.get_ballistic_sight_info()
	var hit_kind := str(ballistics.get("hit_kind", ""))
	var range_label := ""
	var range_col := Color(0.66, 0.86, 0.98, 0.9 * xh_a)
	if hit_kind == "magnetic_enemy":
		range_label = "MAG LOCK %dm" % int(round(float(ballistics.get("distance", 0.0))))
		range_col = Color(0.96, 0.42, 1.0, 0.95 * xh_a)
	elif hit_kind == "enemy":
		range_label = "TARGET %dm" % int(round(float(ballistics.get("distance", 0.0))))
		range_col = Color(0.30, 1.0, 0.58, 0.95 * xh_a)
	elif hit_kind == "asteroid":
		range_label = "ROCK %dm" % int(round(float(ballistics.get("distance", 0.0))))
		range_col = Color(0.58, 0.98, 0.86, 0.92 * xh_a)
	if not range_label.is_empty() and ThemeHelper.font_mono:
		_overlay_canvas.draw_string(ThemeHelper.font_mono, aim_screen_pos + Vector2(28, 20),
			range_label, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, range_col)
		if is_instance_valid(player_ship.locked_enemy):
			_overlay_canvas.draw_string(ThemeHelper.font_mono, aim_screen_pos + Vector2(28, 36),
				"LOCKED", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1.0, 0.78, 0.25, 0.9 * xh_a))

	# Portal guidance: chevrons from the crosshair to the warp gate, with live range.
	if _return_guidance_t > 0.0 and is_instance_valid(_warp_gate):
		var gpos: Vector2 = _cam.unproject_position(_warp_gate.global_position)
		var gdist: float = player_ship.global_position.distance_to(_warp_gate.global_position)
		var gvec: Vector2 = gpos - center
		if gvec.length_squared() > 1.0:
			var gdir: Vector2 = gvec.normalized()
			var gc := Color(0.36, 0.98, 0.86, 0.86)
			for si in range(1, 5):
				var p0: Vector2 = center + gdir * (34.0 + float(si) * 24.0)
				_overlay_canvas.draw_line(p0, p0 + gdir.rotated(2.55) * 10.0, gc, 2.2)
				_overlay_canvas.draw_line(p0, p0 + gdir.rotated(-2.55) * 10.0, gc, 2.2)
			if ThemeHelper.font_mono:
				_overlay_canvas.draw_string(ThemeHelper.font_mono, gpos + Vector2(-46, 36),
					"WARP %dm" % int(round(gdist)), HORIZONTAL_ALIGNMENT_CENTER, 92, 12, gc)

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

	var radar_r := player_ship.get_radar_range()
	for en in enemies_root.get_children():
		if en is EnemyShip3D:
			var en3d := en as EnemyShip3D
			var de: float = en3d.global_position.distance_to(player_ship.global_position)
			if de <= radar_r and not _cam.is_position_behind(en3d.global_position):
				var ep: Vector2 = _cam.unproject_position(en3d.global_position)
				var is_locked := (en3d == player_ship.locked_enemy)
				var hp_pct := clampf(en3d.hp / maxf(1.0, en3d.max_hp), 0.0, 1.0)
				var bracket_half := 26.0
				if is_locked:
					# green lock: every LMB round on this screen converges here
					var gcol := Color(0.34, 1.0, 0.58, 0.96)
					var arm_len := 9.0
					for corner in range(4):
						var sx := -1.0 if (corner == 0 or corner == 2) else 1.0
						var sy := -1.0 if corner < 2 else 1.0
						var hx: float = ep.x + sx * bracket_half
						var hy: float = ep.y + sy * bracket_half
						_overlay_canvas.draw_line(Vector2(hx, hy), Vector2(hx - sx * arm_len, hy), gcol, 2.6)
						_overlay_canvas.draw_line(Vector2(hx, hy), Vector2(hx, hy - sy * arm_len), gcol, 2.6)
					_overlay_canvas.draw_circle(ep, 2.6, Color(0.34, 1.0, 0.58, 0.9))
					_overlay_canvas.draw_rect(Rect2(ep + Vector2(-26, -bracket_half - 12), Vector2(52.0, 4)), Color(0.06, 0.20, 0.12, 0.9), true)
					_overlay_canvas.draw_rect(Rect2(ep + Vector2(-26, -bracket_half - 12), Vector2(52.0 * hp_pct, 4)), Color(0.36, 1.0, 0.60), true)
					if ThemeHelper.font_bold:
						_overlay_canvas.draw_string(ThemeHelper.font_bold, ep + Vector2(-26, -bracket_half - 18),
							str(en3d.display_name).to_upper(), HORIZONTAL_ALIGNMENT_LEFT, 52, 11, Color(0.62, 1.0, 0.78, 0.95))
				else:
					var col := Color(1.0, 0.55, 0.22, 0.78)
					var sz := 15.0
					_overlay_canvas.draw_rect(Rect2(ep - Vector2(sz, sz), Vector2(sz * 2.0, sz * 2.0)), col, false, 1.4)
					_overlay_canvas.draw_rect(Rect2(ep + Vector2(-20, -sz - 8), Vector2(40.0 * hp_pct, 4)), Color(1.0, 0.32, 0.28), true)
				if is_locked and en3d.elite and ThemeHelper.font_mono:
					_overlay_canvas.draw_string(ThemeHelper.font_mono, ep + Vector2(-26, bracket_half + 16),
						"ELITE", HORIZONTAL_ALIGNMENT_LEFT, 52, 11, Color(1.0, 0.82, 0.32, 0.95))

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
	var max_r := maxf(80.0, player_ship.get_radar_range())
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
	_tick_achievement_toast(delta)
	_tick_hud_alert(delta)
	if not is_instance_valid(player_ship) or _extracting:
		return

	if _return_guidance_t > 0.0:
		_return_guidance_t = maxf(0.0, _return_guidance_t - delta)
	_radar_sweep_angle = fmod(_radar_sweep_angle + delta * 2.1, TAU)

	var neb := get_node_or_null("NebulaParticles")
	if neb is Node3D:
		neb.global_position = player_ship.global_position

	_handle_flight_steering(delta)
	_update_third_person_camera(delta)
	_update_aim_ray_and_lock()
	_process_sector_spawns_and_hazards(delta)

	for en in enemies_root.get_children():
		if en is EnemyShip3D:
			en.set_lock_state(en == player_ship.locked_enemy)

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

func add_camera_trauma(amount: float) -> void:
	if ThemeHelper.reduced_motion:
		return
	_shake_trauma = clampf(_shake_trauma + amount * ThemeHelper.screen_shake, 0.0, 1.0)
	_shake_seed = randf() * 100.0


func _shake_offset(delta: float) -> Vector3:
	if _shake_trauma <= 0.001:
		return Vector3.ZERO
	_shake_trauma = maxf(0.0, _shake_trauma - delta * 1.65)
	var amp := pow(_shake_trauma, 1.7) * 0.62
	var ph := _shake_seed + Time.get_ticks_msec() * 0.021
	return Vector3(sin(ph * 1.31) * amp, cos(ph * 1.77) * amp, sin(ph * 2.13) * amp * 0.45)


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
	_cam.fov = lerpf(_cam.fov, maxf(30.0, ThemeHelper.camera_fov - 1.0) + spd_ratio * 11.0, 1.0 - exp(-7.0 * delta))

	var desired_world := _cam_pivot.global_position + _cam_pivot.global_transform.basis.z * desired_dist
	desired_world += _shake_offset(delta)
	var rq := PhysicsRayQueryParameters3D.create(_cam_pivot.global_position, desired_world)
	rq.exclude = [player_ship.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(rq)
	if not hit.is_empty():
		var safe_d := maxf(4.0, _cam_pivot.global_position.distance_to(hit["position"]) - 1.0)
		_cam.position = _cam.position.lerp(Vector3(0, 0, safe_d), 1.0 - exp(-24.0 * delta))
	else:
		_cam.position = _cam.position.lerp(Vector3(0, 0, desired_dist), 1.0 - exp(-15.0 * delta))

func _on_achievement_completed(task: Dictionary) -> void:
	if not ThemeHelper.achievement_toasts:
		return
	_ach_toast_queue.append(L.ach_name(task))


func _tick_achievement_toast(delta: float) -> void:
	if _ach_toast_time > 0.0:
		_ach_toast_time -= delta
		if _ach_toast_time <= 0.0:
			_ach_toast.visible = false
		return
	if not _ach_toast_queue.is_empty():
		var nm: String = _ach_toast_queue.pop_front()
		_ach_toast_lbl.text = "◆ " + nm
		_ach_toast.visible = true
		_ach_toast_time = 4.5
		ThemeHelper.animate_entry(_ach_toast, 0.0, Vector2.ONE)
		AudioManager.play_sfx("card_legendary", 0.0, 0.85)

func _process_sector_spawns_and_hazards(delta: float) -> void:
	# threat economy: cools off when you stop shooting and mining, escalates when you do not
	_threat = maxf(0.0, _threat - delta * (1.55 if enemies_root.get_child_count() == 0 else 0.85))
	var hot := _threat >= 42.0
	if _threat_hot and not hot:
		_threat_hot = false
		_hud_alert(L.tr_ui("threat_standing_down"), Color(0.42, 0.92, 0.66))
	var pressure := clampf(_threat / 100.0, 0.0, 1.0)
	if is_instance_valid(_threat_bar):
		_threat_bar.value = _threat
		if _bar_val_lbls.has("hud_threat"):
			(_bar_val_lbls["hud_threat"] as Label).text = "%d%%" % int(round(_threat))
	_response_cd -= delta
	if _response_cd <= 0.0:
		if _threat >= 78.0:
			_response_cd = 34.0
			_spawn_response_wing(2)
		elif _threat >= 42.0:
			_response_cd = 26.0
			_spawn_response_wing(1)
		else:
			_response_cd = 8.0

	_enemy_spawn_cd -= delta
	if _enemy_spawn_cd <= 0.0:
		_enemy_spawn_cd = lerpf(12.0, 5.4, pressure)
		var cap := int(sector_def.get("enemy_cap", 4)) + (2 if pressure > 0.62 else 0)
		if enemies_root.get_child_count() < cap:
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
				add_camera_trauma(0.55)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and _mouse_captured:
		var rel: Vector2 = event.relative
		if ThemeHelper.invert_y_axis:
			rel.y = -rel.y
		_virtual_stick += rel * (0.0021 * ThemeHelper.camera_sensitivity)
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
