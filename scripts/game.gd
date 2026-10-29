extends Node3D

const CarScript = preload("res://scripts/car.gd")
const WorldScript = preload("res://scripts/world.gd")
const MiniMapScript = preload("res://scripts/minimap.gd")
const InputSetup = preload("res://scripts/input_setup.gd")
const UISkin = preload("res://scripts/ui_skin.gd")
const SAVE_PATH := "user://horizon_velocity.cfg"
const PAINTS := [
	Color("20c5c5"),
	Color("e9794e"),
	Color("d9dfe1"),
	Color("d9b65f"),
	Color("536bd3"),
	Color("20272d")
]
const EVENT_DATA := [
	{
		"name": "AZURE RUN",
		"type": "ROAD RACING",
		"route": 0,
		"reward": 3200,
		"desc": "A fast festival loop from the marina to the mountain overlook."
	},
	{
		"name": "GREENVALE RALLY",
		"type": "DIRT RALLY",
		"route": 1,
		"reward": 3800,
		"desc": "Loose-surface sprint through the old forest service roads."
	},
	{
		"name": "SILVER PASS",
		"type": "HILL CLIMB",
		"route": 2,
		"reward": 4400,
		"desc": "A technical mountain loop. Keep your momentum above the clouds."
	}
]

var world: AuroraWorld
var player: VelocityCar
var opponents: Array[VelocityCar] = []
var ui_root: Control
var menu_content: Control
var hud_layer: Control
var speed_label: Label
var race_label: Label
var status_label: Label
var map_widget: Control
var race_gate_nodes: Array[Node3D] = []
var race_checkpoints: Array[Vector3] = []
var race_ai_checkpoint: Array[int] = []
var race_ai_finish_times: Array[float] = []
var race_active := false
var race_countdown := 0.0
var race_time := 0.0
var player_checkpoint := 0
var event_index := 0
var event_completions := 0
var credits := 15000
var engine_upgrade := 0
var handling_upgrade := 0
var paint_index := 0
var use_mph := false
var shadow_quality := true
var game_mode := "menu"
var current_screen := "menu"
var modal_panel: PanelContainer
var screen_title: Label


func _ready() -> void:
	InputSetup.configure_gamepad()
	world = WorldScript.new()
	world.name = "AuroraCoast"
	add_child(world)
	_build_player()
	_build_ui()
	_load_save()
	_show_menu()
	set_process(true)
	set_physics_process(true)


func _build_player() -> void:
	player = CarScript.new()
	player.name = "Asterion R7 — Player"
	player.paint_color = PAINTS[paint_index]
	player.power_multiplier = 1.0 + float(engine_upgrade) * 0.14
	world.add_child(player)
	var start: Vector3 = world.routes[0][0]
	player.reset_to(start + Vector3.UP * 0.88, world.routes[0][2] - world.routes[0][0])
	player.reset_requested.connect(_reset_player)


func _build_ui() -> void:
	var canvas := CanvasLayer.new()
	canvas.name = "Interface"
	add_child(canvas)
	ui_root = Control.new()
	ui_root.name = "ScreenRoot"
	ui_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(ui_root)
	hud_layer = Control.new()
	hud_layer.name = "DrivingHUD"
	hud_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud_layer.visible = false
	canvas.add_child(hud_layer)
	_build_hud()


func _build_hud() -> void:
	var top := PanelContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_LEFT)
	top.position = Vector2(32, 26)
	top.custom_minimum_size = Vector2(300, 84)
	top.add_theme_stylebox_override(
		"panel", UISkin.panel_style(Color(0.025, 0.07, 0.09, 0.78), Color(0.30, 0.80, 0.76, 0.45))
	)
	hud_layer.add_child(top)
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	top.add_child(vbox)
	var brand := UISkin.label("AURORA COAST  /  VELOCITY FESTIVAL", 12, Color("72dcd0"))
	vbox.add_child(brand)
	speed_label = UISkin.label("000  KM/H", 34, Color("f5f4ec"))
	speed_label.add_theme_font_size_override("font_size", 32)
	vbox.add_child(speed_label)
	var bottom := PanelContainer.new()
	bottom.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	bottom.position = Vector2(-322, -114)
	bottom.custom_minimum_size = Vector2(290, 78)
	bottom.add_theme_stylebox_override(
		"panel", UISkin.panel_style(Color(0.025, 0.07, 0.09, 0.78), Color(0.30, 0.80, 0.76, 0.38))
	)
	hud_layer.add_child(bottom)
	var bottom_v := VBoxContainer.new()
	bottom.add_child(bottom_v)
	status_label = UISkin.label("GEAR 01   ·   RWD", 15, Color("d8e6e5"))
	bottom_v.add_child(status_label)
	race_label = UISkin.label("FREE ROAM  /  AURORA COAST", 13, Color("e8b86e"))
	bottom_v.add_child(race_label)
	map_widget = MiniMapScript.new()
	map_widget.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	map_widget.position = Vector2(-214, 28)
	map_widget.size = Vector2(184, 184)
	map_widget.map_center = Vector2(0, 0)
	hud_layer.add_child(map_widget)
	var controls := UISkin.label(
		"WASD  DRIVE     SPACE  HANDBRAKE     C  CAMERA     R  RESET     ESC  PAUSE",
		13,
		Color("dce5e1")
	)
	controls.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	controls.position = Vector2(32, -42)
	hud_layer.add_child(controls)


func _process(delta: float) -> void:
	if is_instance_valid(player) and is_instance_valid(world):
		player.weather_grip = world.road_grip
		player.mph_units = use_mph
		player.set_night_mode(world.is_night)
		world.set_weather_anchor(player.global_position)
	if game_mode == "drive" or game_mode == "race":
		_update_hud()
	if race_active and current_screen != "pause" and current_screen != "map":
		if race_countdown > 0.0:
			race_countdown -= delta
			if race_countdown <= 0.0:
				race_countdown = 0.0
				player.controls_locked = false
				for opponent in opponents:
					opponent.ai_hold = false
			elif status_label:
				status_label.text = "STARTS IN  %d" % maxi(1, int(ceil(race_countdown)))
		else:
			race_time += delta
			_update_race_progress()
	if Input.is_action_just_pressed("ui_cancel"):
		if current_screen == "pause" or current_screen == "map":
			_resume_game()
		elif current_screen == "drive" or current_screen == "race":
			_show_pause()
		elif current_screen != "menu":
			_show_menu()
	if Input.is_action_just_pressed("world_map") and (game_mode == "drive" or game_mode == "race"):
		if current_screen == "map":
			_resume_game()
		else:
			_show_map_overlay()


func _update_hud() -> void:
	if not is_instance_valid(player):
		return
	var speed := player.speed_kph()
	if use_mph:
		speed_label.text = "%03d  MPH" % int(speed * 0.621371)
	else:
		speed_label.text = "%03d  KM/H" % int(speed)
	var gear_text := "R" if player.is_reversing else "%02d" % player.gear
	status_label.text = (
		"GEAR %s   ·   %s   ·   %04d RPM" % [gear_text, player.drivetrain, int(player.rpm)]
	)
	if race_active:
		var place := _player_place()
		var total := opponents.size() + 1
		race_label.text = (
			"P%d / %d     CHECKPOINT %02d / %02d     %05.1f s"
			% [place, total, player_checkpoint, race_checkpoints.size(), race_time]
		)
	else:
		race_label.text = "FREE ROAM  /  AURORA COAST"
	map_widget.player_position = player.global_position
	map_widget.route = world.routes[EVENT_DATA[event_index].route] if race_active else []
	map_widget.queue_redraw()


func _show_menu() -> void:
	race_active = false
	_clear_race_props()
	_remove_opponents()
	if is_instance_valid(player):
		player.controls_locked = true
	game_mode = "menu"
	current_screen = "menu"
	hud_layer.visible = false
	_clear_screen()
	var background := ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.color = Color(0.018, 0.045, 0.067, 0.73)
	background.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_root.add_child(background)
	var top_brand := UISkin.label("H V   /   A U R O R A  C O A S T", 17, Color("76ded1"))
	top_brand.position = Vector2(54, 42)
	ui_root.add_child(top_brand)
	var edition := UISkin.label("DRIVING FESTIVAL   •   01 / 03 REGIONS", 13, Color("b5c9c8"))
	edition.position = Vector2(55, 74)
	ui_root.add_child(edition)
	var hero := UISkin.label("HORIZON\nVELOCITY", 60, Color("f5f3ea"))
	hero.position = Vector2(55, 145)
	hero.custom_minimum_size = Vector2(550, 170)
	hero.add_theme_font_size_override("font_size", 64)
	hero.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.45))
	hero.add_theme_constant_override("shadow_offset_x", 2)
	hero.add_theme_constant_override("shadow_offset_y", 3)
	ui_root.add_child(hero)
	var tagline := UISkin.label("FIND YOUR LINE.  OWN THE COAST.", 17, Color("e8b66e"))
	tagline.position = Vector2(60, 313)
	ui_root.add_child(tagline)
	var menu_panel := PanelContainer.new()
	menu_panel.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	menu_panel.position = Vector2(-445, 134)
	menu_panel.custom_minimum_size = Vector2(390, 542)
	menu_panel.add_theme_stylebox_override(
		"panel", UISkin.panel_style(Color(0.035, 0.075, 0.095, 0.90), Color(0.28, 0.79, 0.73, 0.5))
	)
	ui_root.add_child(menu_panel)
	var menu_box := VBoxContainer.new()
	menu_box.add_theme_constant_override("separation", 12)
	menu_panel.add_child(menu_box)
	var season := UISkin.label("YOUR FESTIVAL", 12, Color("78d8cc"))
	menu_box.add_child(season)
	var driver := UISkin.label("DRIVER   /   NEWCOMER", 21, Color("f3f4ed"))
	menu_box.add_child(driver)
	var account := UISkin.label(
		"%s CREDITS     ·     %d EVENTS WON" % [_format_number(credits), event_completions],
		13,
		Color("b3c6c5")
	)
	menu_box.add_child(account)
	menu_box.add_child(UISkin.spacer(8))
	menu_box.add_child(
		UISkin.menu_button("FREE ROAM", "Drive the coast at your pace", _start_free_roam)
	)
	menu_box.add_child(
		UISkin.menu_button(
			"FESTIVAL EVENTS", "Three routes · race the clock and AI", _show_event_menu
		)
	)
	menu_box.add_child(
		UISkin.menu_button("GARAGE", "Tune, repair and personalize your R7", _show_garage)
	)
	menu_box.add_child(
		UISkin.menu_button("SETTINGS", "Display · graphics · speed units", _show_settings)
	)
	menu_box.add_child(UISkin.spacer(5))
	menu_box.add_child(
		UISkin.menu_button("EXIT TO DESKTOP", "Close the game", func(): get_tree().quit(), false)
	)
	var footer := UISkin.label(
		"WASD DRIVE   /   SPACE HANDBRAKE   /   C CAMERA", 12, Color("c0cfcc")
	)
	footer.position = Vector2(56, 841)
	ui_root.add_child(footer)
	var map_note := UISkin.label(
		"AZURE COAST   ·   GREENVALE FOREST   ·   SILVER MOUNTAINS", 12, Color("9bb0b2")
	)
	map_note.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	map_note.position = Vector2(-578, -40)
	ui_root.add_child(map_note)


func _show_event_menu() -> void:
	race_active = false
	_clear_race_props()
	_remove_opponents()
	player.controls_locked = true
	game_mode = "menu"
	current_screen = "events"
	_clear_screen()
	_add_screen_backdrop()
	_add_screen_heading("PICK YOUR LINE", "Festival race calendar   /   Aurora Coast")
	var content := VBoxContainer.new()
	content.set_anchors_preset(Control.PRESET_CENTER)
	content.position = Vector2(-350, -132)
	content.custom_minimum_size = Vector2(700, 465)
	content.add_theme_constant_override("separation", 14)
	ui_root.add_child(content)
	for i in range(EVENT_DATA.size()):
		var event: Dictionary = EVENT_DATA[i]
		var btn := UISkin.menu_button(
			"%02d   %s" % [i + 1, event.name],
			(
				"%s   /   %s    ·    REWARD %s CR"
				% [event.type, event.desc, _format_number(event.reward)]
			),
			func(): _begin_race(i)
		)
		btn.custom_minimum_size = Vector2(690, 116)
		content.add_child(btn)
	var back := UISkin.menu_button("BACK TO FESTIVAL", "Return to the coast", _show_menu, false)
	back.custom_minimum_size = Vector2(690, 76)
	content.add_child(back)


func _begin_race(index: int) -> void:
	event_index = clampi(index, 0, EVENT_DATA.size() - 1)
	_clear_race_props()
	_remove_opponents()
	race_active = true
	race_time = 0.0
	race_countdown = 3.0
	player_checkpoint = 0
	game_mode = "race"
	current_screen = "race"
	hud_layer.visible = true
	var route: Array[Vector3] = world.routes[EVENT_DATA[event_index].route]
	race_checkpoints.clear()
	for i in range(1, 9):
		var idx := int(float(route.size() - 1) * float(i) / 9.0)
		race_checkpoints.append(route[idx])
		var gate_forward := route[mini(idx + 1, route.size() - 1)] - route[maxi(idx - 1, 0)]
		_create_checkpoint_marker(route[idx], i == 8, gate_forward)
	var start := route[0]
	var forward := (route[2] - route[0]).normalized()
	var right := forward.cross(Vector3.UP).normalized()
	player.ai_enabled = false
	player.controls_locked = true
	player.reset_to(start + Vector3.UP * 0.88, forward)
	for i in range(3):
		var rival := CarScript.new()
		rival.name = ["Mara / Sable GT", "Kei / Nami R", "Ivo / Vanta RS"][i]
		rival.paint_color = [Color("e87d54"), Color("ddd5c4"), Color("596bcb")][i]
		rival.drivetrain = ["RWD", "AWD", "FWD"][i]
		rival.power_multiplier = 0.98 + float(i) * 0.06
		world.add_child(rival)
		rival.reset_to(start + right * (float(i) - 1.0) * 2.7 + Vector3.UP * 0.88, forward)
		rival.ai_route = route
		rival.ai_target_index = 2
		rival.ai_enabled = true
		rival.ai_hold = true
		rival.ai_speed_limit = [26.0, 28.0, 30.0][i]
		opponents.append(rival)
		race_ai_checkpoint.append(0)
		race_ai_finish_times.append(-1.0)
	_update_hud()


func _create_checkpoint_marker(position: Vector3, finish: bool, forward: Vector3) -> void:
	var marker := Node3D.new()
	marker.name = "FinishGate" if finish else "CheckpointGate"
	marker.position = position + Vector3.UP * 0.15
	var material := UISkin.glow_material(Color("eab66c") if finish else Color("5de1d2"))
	for x in [-5.5, 5.5]:
		var post := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.22, 4.2, 0.22)
		post.mesh = box
		post.position = Vector3(x, 2.1, 0)
		post.material_override = material
		marker.add_child(post)
	var beam := MeshInstance3D.new()
	var beam_mesh := BoxMesh.new()
	beam_mesh.size = Vector3(11.2, 0.2, 0.22)
	beam.mesh = beam_mesh
	beam.position = Vector3(0, 4.2, 0)
	beam.material_override = material
	marker.add_child(beam)
	world.add_child(marker)
	var gate_direction := Vector3(forward.x, 0.0, forward.z).normalized()
	if gate_direction.length() > 0.01:
		marker.look_at(marker.global_position + gate_direction, Vector3.UP)
	race_gate_nodes.append(marker)


func _update_race_progress() -> void:
	if not race_active or race_checkpoints.is_empty():
		return
	if (
		player_checkpoint < race_checkpoints.size()
		and player.global_position.distance_to(race_checkpoints[player_checkpoint]) < 10.5
	):
		player_checkpoint += 1
		if player_checkpoint >= race_checkpoints.size():
			_finish_race()
	for i in range(opponents.size()):
		if not is_instance_valid(opponents[i]):
			continue
		var cp: int = race_ai_checkpoint[i]
		if (
			cp < race_checkpoints.size()
			and opponents[i].global_position.distance_to(race_checkpoints[cp]) < 11.5
		):
			race_ai_checkpoint[i] += 1
			if race_ai_checkpoint[i] >= race_checkpoints.size():
				race_ai_finish_times[i] = race_time


func _player_place() -> int:
	var ahead := 0
	for i in range(race_ai_checkpoint.size()):
		if race_ai_checkpoint[i] > player_checkpoint:
			ahead += 1
		elif (
			race_ai_checkpoint[i] >= race_checkpoints.size()
			and race_ai_finish_times[i] >= 0.0
			and race_ai_finish_times[i] < race_time
		):
			ahead += 1
	return ahead + 1


func _finish_race() -> void:
	if not race_active:
		return
	race_active = false
	game_mode = "drive"
	player.controls_locked = true
	for rival in opponents:
		rival.ai_hold = true
	var place := _player_place()
	var base_reward: int = EVENT_DATA[event_index].reward
	var reward := int(float(base_reward) * (1.0 if place == 1 else (0.62 if place == 2 else 0.38)))
	credits += reward
	event_completions += 1
	_save_game()
	_show_results(place, reward)


func _show_results(place: int, reward: int) -> void:
	current_screen = "results"
	_clear_screen()
	_add_screen_backdrop()
	var panel := _center_panel(Vector2(660, 530))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 13)
	panel.add_child(column)
	column.add_child(UISkin.label("EVENT COMPLETE   /   AURORA COAST", 13, Color("6fdbcf")))
	column.add_child(UISkin.label(EVENT_DATA[event_index].name, 38, Color("f3f2ea")))
	column.add_child(
		UISkin.label("P%d   /   %d DRIVERS" % [place, opponents.size() + 1], 28, Color("eab66c"))
	)
	column.add_child(UISkin.label("FINISH TIME     %05.2f s" % race_time, 20, Color("dce7e4")))
	column.add_child(
		UISkin.label("REWARD     +%s CR" % _format_number(reward), 20, Color("75dcd0"))
	)
	column.add_child(
		UISkin.label("GARAGE BALANCE     %s CR" % _format_number(credits), 14, Color("a9bdbb"))
	)
	column.add_child(UISkin.spacer(8))
	column.add_child(
		UISkin.menu_button("KEEP DRIVING", "Return to the festival grounds", _resume_game)
	)
	column.add_child(
		UISkin.menu_button("EVENT CALENDAR", "Pick another race", _show_event_menu, false)
	)
	column.add_child(
		UISkin.menu_button("FESTIVAL MENU", "Save is written automatically", _show_menu, false)
	)


func _show_pause() -> void:
	player.controls_locked = true
	for rival in opponents:
		rival.ai_hold = true
	current_screen = "pause"
	_clear_screen()
	_add_screen_backdrop()
	var panel := _center_panel(Vector2(500, 470))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	panel.add_child(column)
	column.add_child(UISkin.label("TAKE A BREATHER", 32, Color("f3f2ea")))
	column.add_child(UISkin.label("AURORA COAST   /   IN-GAME PAUSE", 13, Color("75dcd0")))
	column.add_child(UISkin.menu_button("RESUME DRIVE", "Back to the road", _resume_game))
	column.add_child(
		UISkin.menu_button("GARAGE", "Paint and upgrade your car", _show_garage, false)
	)
	column.add_child(
		UISkin.menu_button("FESTIVAL MENU", "Return to the festival", _show_menu, false)
	)
	column.add_child(
		UISkin.menu_button("SETTINGS", "Display and driving options", _show_settings, false)
	)


func _show_garage() -> void:
	current_screen = "garage"
	_clear_screen()
	_add_screen_backdrop()
	_add_screen_heading("THE WORKSHOP", "ASTERION R7   /   REAR-DRIVE SPORT COUPE")
	var panel := _center_panel(Vector2(760, 555))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 11)
	panel.add_child(column)
	column.add_child(UISkin.label("OWNED   ·   R7 CLUBSPORT", 15, Color("72dcd0")))
	column.add_child(
		UISkin.label(
			"A hand-built coastal grand tourer.\n1320 kg   ·   RWD   ·   6-speed automatic",
			17,
			Color("e1e8e4")
		)
	)
	column.add_child(UISkin.label("PAINT", 12, Color("e8b66e")))
	var paints := HBoxContainer.new()
	paints.add_theme_constant_override("separation", 10)
	for i in range(PAINTS.size()):
		var swatch := Button.new()
		swatch.custom_minimum_size = Vector2(52, 42)
		swatch.text = "✓" if i == paint_index else ""
		swatch.add_theme_color_override("font_color", Color.WHITE)
		var swatch_style := StyleBoxFlat.new()
		swatch_style.bg_color = PAINTS[i]
		swatch_style.set_corner_radius_all(6)
		swatch.add_theme_stylebox_override("normal", swatch_style)
		swatch.add_theme_stylebox_override("hover", swatch_style)
		swatch.pressed.connect(func(): _set_paint(i))
		paints.add_child(swatch)
	column.add_child(paints)
	column.add_child(
		UISkin.menu_button(
			"ENGINE STAGE %d  ·  +%d%% POWER" % [engine_upgrade, engine_upgrade * 14],
			(
				"Install stage %d   /   %s CR"
				% [engine_upgrade + 1, _format_number(3000 + engine_upgrade * 2500)]
			),
			_upgrade_engine
		)
	)
	column.add_child(
		UISkin.menu_button(
			"HANDLING PACKAGE %d" % handling_upgrade,
			"Adjustable suspension and grippier tires   /   2,800 CR",
			_upgrade_handling,
			false
		)
	)
	column.add_child(
		UISkin.menu_button(
			"REPAIR & RESET TUNING",
			"Restore the baseline tune   /   FREE",
			func(): _repair_car(),
			false
		)
	)
	column.add_child(
		UISkin.label("CREDITS     %s CR" % _format_number(credits), 14, Color("a9bdbb"))
	)
	column.add_child(
		UISkin.menu_button("BACK", "Return to previous screen", _back_from_garage, false)
	)


func _set_paint(index: int) -> void:
	paint_index = index
	player.apply_paint(PAINTS[index])
	_save_game()
	_show_garage()


func _upgrade_engine() -> void:
	var cost := 3000 + engine_upgrade * 2500
	if engine_upgrade >= 3:
		_show_notice(
			"ENGINE AT MAXIMUM STAGE", "The R7's naturally aspirated package is fully developed."
		)
		return
	if credits < cost:
		_show_notice(
			"NOT ENOUGH CREDITS",
			"Win another event to add %s credits." % _format_number(cost - credits)
		)
		return
	credits -= cost
	engine_upgrade += 1
	player.power_multiplier = 1.0 + float(engine_upgrade) * 0.14
	_save_game()
	_show_garage()


func _upgrade_handling() -> void:
	if handling_upgrade >= 2:
		_show_notice("HANDLING PACKAGE MAXED", "The suspension and tire package is fully upgraded.")
		return
	if credits < 2800:
		_show_notice("NOT ENOUGH CREDITS", "You need 2,800 credits for this package.")
		return
	credits -= 2800
	handling_upgrade += 1
	player.grip_multiplier = 1.0 + float(handling_upgrade) * 0.12
	player.suspension_multiplier = 1.0 + float(handling_upgrade) * 0.08
	_save_game()
	_show_garage()


func _repair_car() -> void:
	player.linear_velocity = Vector3.ZERO
	player.angular_velocity = Vector3.ZERO
	player.reset_to(world.routes[0][0] + Vector3.UP * 0.88, world.routes[0][2] - world.routes[0][0])
	_show_garage()


func _back_from_garage() -> void:
	if game_mode == "drive" or game_mode == "race":
		_resume_game()
	else:
		_show_menu()


func _show_settings() -> void:
	current_screen = "settings"
	_clear_screen()
	_add_screen_backdrop()
	_add_screen_heading(
		"DRIVING SETTINGS", "Scalable presentation   /   tuned for keyboard and gamepad"
	)
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	panel.position = Vector2(-320, 122)
	panel.custom_minimum_size = Vector2(640, 650)
	panel.add_theme_stylebox_override(
		"panel", UISkin.panel_style(Color(0.035, 0.075, 0.092, 0.96), Color(0.30, 0.80, 0.76, 0.55))
	)
	ui_root.add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 11)
	panel.add_child(column)
	column.add_child(UISkin.label("GRAPHICS", 13, Color("71dacf")))
	column.add_child(
		UISkin.settings_button(
			"SHADOWS   ·   %s" % ("HIGH" if shadow_quality else "LOW"),
			"Toggle real-time directional shadows",
			func(): _toggle_shadows()
		)
	)
	column.add_child(
		UISkin.settings_button(
			(
				"DISPLAY   ·   %s"
				% (
					"FULLSCREEN"
					if (
						DisplayServer.window_get_mode()
						== DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN
					)
					else "WINDOWED"
				)
			),
			"Toggle fullscreen / windowed",
			func(): _toggle_fullscreen(),
			false
		)
	)
	column.add_child(
		UISkin.settings_button(
			"SPEED UNITS   ·   %s" % ("MPH" if use_mph else "KM/H"),
			"Choose dashboard units",
			func(): _toggle_units(),
			false
		)
	)
	column.add_child(
		UISkin.settings_button(
			"WEATHER   ·   %s" % world.weather_names[world.weather_index],
			"Cycle clear / rain / heavy rain / fog; wet weather reduces grip",
			func(): _cycle_weather()
		)
	)
	column.add_child(
		UISkin.settings_button(
			(
				"TIME OF DAY   ·   %02d:%02d"
				% [int(world.time_phase * 24.0), int(fmod(world.time_phase * 1440.0, 60.0))]
			),
			"Advance the coastal sun by six hours; time also cycles automatically",
			func(): _advance_time()
		)
	)
	column.add_child(
		UISkin.settings_button(
			"CAMERA   ·   C KEY",
			"Chase · close chase · hood · cockpit",
			func(): _show_notice("CAMERA MODES", "Press C while driving to cycle four cameras."),
			false
		)
	)
	column.add_child(
		UISkin.settings_button(
			"DRIVING CONTROLS",
			(
				"W / A / S / D · steering and pedals\n"
				+ "SPACE · handbrake     C · camera     R · reset\n"
				+ "M · world map     ESC · pause"
			),
			func():
				_show_notice(
					"KEYBOARD CONTROLS",
					"WASD drive · Space handbrake · C camera · R reset · M map · Esc pause"
				),
			false
		)
	)
	column.add_child(UISkin.settings_button("BACK", "Return to festival", _show_menu, false))


func _toggle_shadows() -> void:
	shadow_quality = not shadow_quality
	for child in world.get_children():
		if child is DirectionalLight3D and child != null:
			child.shadow_enabled = shadow_quality
	_save_game()
	_show_settings()


func _toggle_fullscreen() -> void:
	if DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN)
	_show_settings()


func _toggle_units() -> void:
	use_mph = not use_mph
	_save_game()
	_show_settings()


func _cycle_weather() -> void:
	world.set_weather(world.weather_index + 1)
	_save_game()
	_show_settings()


func _advance_time() -> void:
	world.set_time_phase(world.time_phase + 0.25)
	_save_game()
	_show_settings()


func _show_map_overlay() -> void:
	player.controls_locked = true
	for rival in opponents:
		rival.ai_hold = true
	current_screen = "map"
	_clear_screen()
	_add_screen_backdrop()
	_add_screen_heading(
		"AURORA COAST", "M  /  return to road     ·     Three connected festival routes"
	)
	var map := MiniMapScript.new()
	map.set_anchors_preset(Control.PRESET_CENTER)
	map.position = Vector2(-330, -270)
	map.size = Vector2(660, 540)
	map.map_center = Vector2(0, 0)
	map.map_scale = 1.32
	map.route = world.routes[EVENT_DATA[event_index].route] if race_active else world.routes[0]
	map.player_position = player.global_position
	ui_root.add_child(map)
	var footer := UISkin.label(
		"AZURE RUN   /   GREENVALE RALLY   /   SILVER PASS", 14, Color("e9b66b")
	)
	footer.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	footer.position = Vector2(58, -62)
	ui_root.add_child(footer)


func _show_notice(title: String, message: String) -> void:
	var return_action: Callable = _show_menu
	if current_screen == "settings":
		return_action = _show_settings
	elif current_screen == "garage":
		return_action = _show_garage
	current_screen = "notice"
	_clear_screen()
	_add_screen_backdrop()
	var panel := _center_panel(Vector2(500, 290))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	panel.add_child(column)
	column.add_child(UISkin.label(title, 26, Color("f4f3eb")))
	column.add_child(UISkin.label(message, 16, Color("b7ccca")))
	column.add_child(UISkin.menu_button("GOT IT", "Continue", return_action, false))


func _resume_game() -> void:
	current_screen = "drive"
	player.controls_locked = race_active and race_countdown > 0.0
	if race_active:
		game_mode = "race"
		for rival in opponents:
			rival.ai_hold = race_countdown > 0.0
	else:
		game_mode = "drive"
	_clear_screen()
	hud_layer.visible = true


func _start_free_roam() -> void:
	_clear_race_props()
	_remove_opponents()
	race_active = false
	game_mode = "drive"
	player.controls_locked = false
	player.reset_to(world.routes[0][0] + Vector3.UP * 0.88, world.routes[0][2] - world.routes[0][0])
	current_screen = "drive"
	_clear_screen()
	hud_layer.visible = true


func _reset_player() -> void:
	var route: Array[Vector3] = (
		world.routes[EVENT_DATA[event_index].route] if race_active else world.routes[0]
	)
	var point: Vector3 = route[0]
	var route_index := 0
	if race_active and player_checkpoint > 0:
		var checkpoint_index := mini(player_checkpoint - 1, race_checkpoints.size() - 1)
		point = race_checkpoints[checkpoint_index]
		var closest_distance := INF
		for i in range(route.size()):
			var distance := route[i].distance_to(point)
			if distance < closest_distance:
				closest_distance = distance
				route_index = i
	var forward := route[mini(route_index + 1, route.size() - 1)] - route[maxi(route_index - 1, 0)]
	player.reset_to(point + Vector3.UP * 0.9, forward)


func _clear_race_props() -> void:
	for gate in race_gate_nodes:
		if is_instance_valid(gate):
			gate.queue_free()
	race_gate_nodes.clear()
	race_checkpoints.clear()


func _remove_opponents() -> void:
	for rival in opponents:
		if is_instance_valid(rival):
			rival.queue_free()
	opponents.clear()
	race_ai_checkpoint.clear()
	race_ai_finish_times.clear()


func _add_screen_backdrop() -> void:
	var background := ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.color = Color(0.012, 0.035, 0.055, 0.83)
	background.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_root.add_child(background)


func _add_screen_heading(title: String, subtitle: String) -> void:
	var heading := UISkin.label(title, 36, Color("f3f2e9"))
	heading.set_anchors_preset(Control.PRESET_TOP_LEFT)
	heading.position = Vector2(58, 47)
	ui_root.add_child(heading)
	var sub := UISkin.label(subtitle, 14, Color("7bd9cf"))
	sub.position = Vector2(62, 99)
	ui_root.add_child(sub)


func _center_panel(panel_size: Vector2) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = -panel_size * 0.5
	panel.custom_minimum_size = panel_size
	panel.add_theme_stylebox_override(
		"panel", UISkin.panel_style(Color(0.035, 0.075, 0.092, 0.96), Color(0.30, 0.80, 0.76, 0.55))
	)
	ui_root.add_child(panel)
	return panel


func _format_number(number: int) -> String:
	var s := str(number)
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3, 3) + out
		s = s.substr(0, s.length() - 3)
	return s + out


func _clear_screen() -> void:
	for child in ui_root.get_children():
		child.queue_free()


func _save_game() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("progress", "credits", credits)
	cfg.set_value("progress", "events_completed", event_completions)
	cfg.set_value("garage", "engine_upgrade", engine_upgrade)
	cfg.set_value("garage", "handling_upgrade", handling_upgrade)
	cfg.set_value("garage", "paint_index", paint_index)
	cfg.set_value("settings", "mph", use_mph)
	cfg.set_value("settings", "shadows", shadow_quality)
	cfg.set_value("settings", "weather", world.weather_index)
	cfg.set_value("settings", "time_phase", world.time_phase)
	cfg.save(SAVE_PATH)


func _load_save() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	credits = int(cfg.get_value("progress", "credits", credits))
	event_completions = int(cfg.get_value("progress", "events_completed", 0))
	engine_upgrade = int(cfg.get_value("garage", "engine_upgrade", 0))
	handling_upgrade = int(cfg.get_value("garage", "handling_upgrade", 0))
	paint_index = clampi(int(cfg.get_value("garage", "paint_index", 0)), 0, PAINTS.size() - 1)
	use_mph = bool(cfg.get_value("settings", "mph", false))
	shadow_quality = bool(cfg.get_value("settings", "shadows", true))
	world.set_weather(int(cfg.get_value("settings", "weather", 0)))
	world.set_time_phase(float(cfg.get_value("settings", "time_phase", world.time_phase)))
	for child in world.get_children():
		if child is DirectionalLight3D:
			child.shadow_enabled = shadow_quality
	player.power_multiplier = 1.0 + float(engine_upgrade) * 0.14
	player.grip_multiplier = 1.0 + float(handling_upgrade) * 0.12
	player.suspension_multiplier = 1.0 + float(handling_upgrade) * 0.08
	player.apply_paint(PAINTS[paint_index])


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_game()
		get_tree().quit()
