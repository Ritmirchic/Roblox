extends Node3D

const WorldScript = preload("res://scripts/world_builder.gd")
const PlayerScript = preload("res://scripts/player_controller.gd")
const AudioScript = preload("res://scripts/audio_director.gd")
const EntityScript = preload("res://scripts/entity_ai.gd")
const AnomalyScript = preload("res://scripts/anomaly_director.gd")
const ReticleScript = preload("res://scripts/reticle.gd")
const MAX_ROUNDS := 10
const STORY := {
	"page_roster":
	{
		"title": "MAINTENANCE ROSTER — 18 OCTOBER",
		"text":
		"The fourth-floor inspection route must be walked in one direction only. If a door appears where there was plaster, do not open it. The plaster behind it is load-bearing.\n\nCaretaker's note: I wrote this twice. The handwriting on the first copy is not mine."
	},
	"page_receipt":
	{
		"title": "LAUNDRY RECEIPT — 02:14 A.M.",
		"text":
		"ONE SHEET / HOT CYCLE / NO RETURN ADDRESS.\n\nA note has been pressed into the thermal paper: 'If the lift opens below the basement, do not count the floors on the way back up.'"
	},
	"page_letter":
	{
		"title": "LETTER, UNSENT",
		"text":
		"Mara,\n\nI hear your steps in the corridor every night, but the building has been empty since the fire. The voice on the radio says you are waiting in the sealed records room. I know your voice. I know what it sounds like when it is pretending.\n\nI am going to open the door.\n— Ilya"
	},
	"page_archive":
	{
		"title": "INCIDENT 04 / RESIDENT M. VORONINA",
		"text":
		"The witness reported a second apartment building through the window: identical rooms, lights moving in the same sequence, and a figure standing in the corresponding fourth-floor kitchen. The witness was alone in the room.\n\nFinal margin entry: 'It is not a copy. It is the side that is looking back.'"
	}
}

var world
var player
var audio
var anomaly_director
var entities: Dictionary = {}
var current_round := 1
var lives := 3
var correct_reports := 0
var total_reports := 0
var collected_documents: Array[String] = []
var observations: Array[String] = []
var anomaly_deck: Array[int] = []
var active_anomaly := -1
var mode := "menu"
var settings_return := "menu"
var _toast_time := 0.0
var _threat_flash := 0.0
var _page: Control
var _overlay: CanvasLayer
var _ui_root: Control
var _hud: Control
var _round_label: Label
var _objective_label: Label
var _prompt_label: Label
var _toast_label: Label
var _life_label: Label
var _stamina_bar: ProgressBar
var _reticle: Control
var _report_card: PanelContainer
var _continue_available := false
var _settings := {"master": 0.8, "sensitivity": 0.0018, "fullscreen": false}
var _run_seed := 0


func _ready() -> void:
	randomize()
	_build_environment()
	_build_world()
	_build_overlay()
	_load_settings()
	_load_save_summary()
	_show_main_menu()
	set_process(true)
	set_process_unhandled_input(true)


func _build_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color(0.018, 0.024, 0.031)
	sky_material.sky_horizon_color = Color(0.07, 0.08, 0.08)
	sky_material.ground_bottom_color = Color(0.012, 0.013, 0.014)
	sky_material.ground_horizon_color = Color(0.08, 0.075, 0.068)
	sky_material.sun_angle_max = 0.4
	sky.sky_material = sky_material
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.43, 0.46, 0.49)
	environment.ambient_light_energy = 0.26
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.tonemap_exposure = 1.0
	environment.glow_enabled = true
	environment.glow_intensity = 0.32
	environment.fog_enabled = true
	environment.fog_light_color = Color(0.13, 0.15, 0.16)
	environment.fog_density = 0.006
	var world_environment := WorldEnvironment.new()
	world_environment.name = "AtmosphericLighting"
	world_environment.environment = environment
	add_child(world_environment)
	var moon_fill := DirectionalLight3D.new()
	moon_fill.name = "ColdWindowFill"
	moon_fill.rotation = Vector3(deg_to_rad(-38), deg_to_rad(27), 0)
	moon_fill.light_color = Color(0.52, 0.62, 0.72)
	moon_fill.light_energy = 0.28
	moon_fill.shadow_enabled = true
	moon_fill.directional_shadow_max_distance = 38
	add_child(moon_fill)


func _build_world() -> void:
	world = WorldScript.new()
	world.name = "ApartmentComplex"
	add_child(world)
	world.build()
	var layout_report: Dictionary = world.validate_layout()
	if not layout_report["valid"]:
		push_error("Apartment connectivity validation failed: %s" % str(layout_report["checks"]))
	audio = AudioScript.new()
	audio.name = "Soundscape"
	add_child(audio)
	player = PlayerScript.new()
	player.name = "Player"
	player.position = Vector3(0, 0.04, -23.6)
	player.rotation.y = PI
	add_child(player)
	for kind in ["observer", "listener", "imitator"]:
		var actor = EntityScript.new()
		actor.name = kind.capitalize()
		actor.entity_kind = kind
		actor.position = Vector3(0, 0, 48 + entities.size() * 3.0)
		add_child(actor)
		entities[kind] = actor
		actor.player_threatened.connect(_on_entity_threatened)
		actor.false_cue.connect(_on_imitator_false_cue)
		player.noise_made.connect(actor.hear_noise)
	anomaly_director = AnomalyScript.new()
	anomaly_director.name = "AnomalyDirector"
	add_child(anomaly_director)
	anomaly_director.setup(world, player, audio, entities)
	player.interaction_message.connect(_on_document_interaction)


func _build_overlay() -> void:
	_overlay = CanvasLayer.new()
	_overlay.name = "Interface"
	_overlay.layer = 10
	add_child(_overlay)
	_ui_root = Control.new()
	_ui_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay.add_child(_ui_root)
	_build_hud()


func _build_hud() -> void:
	_hud = Control.new()
	_hud.name = "InspectionHUD"
	_hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ui_root.add_child(_hud)
	var top_line := ColorRect.new()
	top_line.color = Color(0.74, 0.70, 0.57, 0.62)
	top_line.position = Vector2(48, 48)
	top_line.size = Vector2(58, 2)
	_hud.add_child(top_line)
	_round_label = _label(
		_hud, "OBSERVATION 01   /   10", 48, 59, 420, 32, 18, Color(0.83, 0.81, 0.75)
	)
	_round_label.add_theme_constant_override("outline_size", 2)
	_objective_label = _label(
		_hud,
		"WALK THE HALL. NOTICE WHAT DOES NOT BELONG.",
		48,
		94,
		610,
		27,
		12,
		Color(0.66, 0.68, 0.65)
	)
	_life_label = _label(_hud, "STABILITY   ■  ■  ■", 48, 131, 300, 24, 11, Color(0.72, 0.68, 0.60))
	_prompt_label = _label(_hud, "", 0, 0, 610, 30, 14, Color(0.90, 0.87, 0.78))
	_prompt_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_prompt_label.position = Vector2(-305, -106)
	_prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast_label = _label(_hud, "", 0, 0, 760, 50, 16, Color(0.88, 0.79, 0.63))
	_toast_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_toast_label.position = Vector2(-380, -154)
	_toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_reticle = Control.new()
	_reticle.set_script(ReticleScript)
	_reticle.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_reticle.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(_reticle)
	var controls := _label(
		_hud,
		"WASD MOVE     SHIFT WALK FASTER     E INTERACT     F LIGHT     TAB JOURNAL     ESC PAUSE",
		0,
		0,
		840,
		20,
		10,
		Color(0.57, 0.59, 0.57)
	)
	controls.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	controls.position = Vector2(-420, -36)
	controls.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_stamina_bar = ProgressBar.new()
	_stamina_bar.position = Vector2(48, 166)
	_stamina_bar.size = Vector2(156, 4)
	_stamina_bar.min_value = 0
	_stamina_bar.max_value = 100
	_stamina_bar.value = 100
	_stamina_bar.show_percentage = false
	var bar_style := StyleBoxFlat.new()
	bar_style.bg_color = Color(0.77, 0.70, 0.54, 0.62)
	_stamina_bar.add_theme_stylebox_override("fill", bar_style)
	_stamina_bar.add_theme_stylebox_override(
		"background", _panel_style(Color(0.12, 0.13, 0.12, 0.75), 1)
	)
	_hud.add_child(_stamina_bar)
	_hud.visible = false


func _label(
	parent: Control,
	text: String,
	x: float,
	y: float,
	width: float,
	height: float,
	font_size: int,
	color: Color
) -> Label:
	var label := Label.new()
	label.text = text
	label.position = Vector2(x, y)
	label.size = Vector2(width, height)
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_outline_color", Color(0.015, 0.018, 0.02, 0.9))
	label.add_theme_constant_override("outline_size", 2)
	parent.add_child(label)
	return label


func _panel_style(color: Color, border_width: int = 1) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(0.54, 0.48, 0.37, 0.58)
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(2)
	style.content_margin_left = 28
	style.content_margin_right = 28
	style.content_margin_top = 24
	style.content_margin_bottom = 24
	return style


func _button(parent: Control, text: String, callback: Callable, width: float = 360.0) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(width, 52)
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.add_theme_font_size_override("font_size", 15)
	button.add_theme_color_override("font_color", Color(0.82, 0.81, 0.75))
	button.add_theme_color_override("font_hover_color", Color(0.97, 0.91, 0.76))
	button.add_theme_color_override("font_pressed_color", Color(0.74, 0.58, 0.39))
	var normal := _panel_style(Color(0.075, 0.083, 0.085, 0.92), 1)
	normal.content_margin_left = 18
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("hover", _panel_style(Color(0.14, 0.15, 0.145, 0.97), 1))
	button.add_theme_stylebox_override("pressed", _panel_style(Color(0.19, 0.14, 0.11, 0.97), 1))
	button.add_theme_stylebox_override("focus", _panel_style(Color(0.12, 0.12, 0.115, 0.95), 1))
	button.pressed.connect(callback)
	parent.add_child(button)
	return button


func _new_page() -> Control:
	if is_instance_valid(_page):
		_page.queue_free()
	_page = Control.new()
	_page.name = "MenuPage"
	_page.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_page.mouse_filter = Control.MOUSE_FILTER_STOP
	_ui_root.add_child(_page)
	var shade := ColorRect.new()
	shade.color = Color(0.012, 0.016, 0.018, 0.84)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_page.add_child(shade)
	var left_rule := ColorRect.new()
	left_rule.color = Color(0.68, 0.53, 0.37, 0.78)
	left_rule.position = Vector2(0, 0)
	left_rule.size = Vector2(3, 900)
	left_rule.set_anchors_and_offsets_preset(Control.PRESET_LEFT_WIDE)
	_page.add_child(left_rule)
	return _page


func _card(
	parent: Control, width: float, height: float, vertical_offset: float = 0.0
) -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(width, height)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -width * 0.5
	panel.offset_top = -height * 0.5 + vertical_offset
	panel.offset_right = width * 0.5
	panel.offset_bottom = height * 0.5 + vertical_offset
	panel.add_theme_stylebox_override("panel", _panel_style(Color(0.035, 0.043, 0.046, 0.96), 1))
	parent.add_child(panel)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 12)
	panel.add_child(content)
	return content


func _show_main_menu() -> void:
	mode = "menu"
	_hud.visible = false
	_freeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_page = _new_page()
	var title := _label(_page, "DON'T LOOK BACK", 94, 153, 780, 88, 44, Color(0.88, 0.85, 0.77))
	title.add_theme_constant_override("outline_size", 4)
	_label(
		_page,
		"A RESIDENTIAL HORROR / FIELD RECORD 04",
		98,
		238,
		610,
		26,
		12,
		Color(0.70, 0.64, 0.53)
	)
	var rule := ColorRect.new()
	rule.color = Color(0.64, 0.50, 0.36, 0.72)
	rule.position = Vector2(98, 281)
	rule.size = Vector2(112, 2)
	_page.add_child(rule)
	var description := _label(
		_page,
		"The fourth-floor corridor changes when you pass through it.\nObserve the rooms. Record what is wrong. Do not follow\na voice that knows your name.",
		98,
		304,
		545,
		94,
		16,
		Color(0.69, 0.71, 0.68)
	)
	description.add_theme_constant_override("line_spacing", 5)
	var buttons := VBoxContainer.new()
	buttons.position = Vector2(98, 448)
	buttons.add_theme_constant_override("separation", 9)
	_page.add_child(buttons)
	_button(buttons, "BEGIN INSPECTION", Callable(self, "_new_run"), 380)
	if _continue_available:
		_button(buttons, "CONTINUE FIELD RECORD", Callable(self, "_continue_run"), 380)
	_button(buttons, "SETTINGS", Callable(self, "_open_settings"), 380)
	_button(buttons, "LEAVE BUILDING", Callable(self, "_quit_game"), 380)
	_label(
		_page,
		"WASD MOVE     E INTERACT     R REPORT AT THE STAIR LANDING     F FLASHLIGHT     TAB JOURNAL",
		98,
		824,
		880,
		24,
		10,
		Color(0.52, 0.55, 0.54)
	)
	_label(
		_page,
		"A PLACE THAT REMEMBERS WHAT YOU FORGOT.",
		1120,
		826,
		380,
		20,
		10,
		Color(0.46, 0.48, 0.47)
	)


func _new_run() -> void:
	current_round = 1
	lives = 3
	correct_reports = 0
	total_reports = 0
	collected_documents.clear()
	observations.clear()
	anomaly_deck.clear()
	_run_seed = randi()
	var previous_save := ProjectSettings.globalize_path("user://field_record.json")
	if FileAccess.file_exists("user://field_record.json"):
		DirAccess.remove_absolute(previous_save)
	_start_inspection()


func _continue_run() -> void:
	var file := FileAccess.open("user://field_record.json", FileAccess.READ)
	if file == null:
		_new_run()
		return
	var saved: Variant = JSON.parse_string(file.get_as_text())
	if not saved is Dictionary:
		_new_run()
		return
	current_round = int(saved.get("round", 1))
	lives = int(saved.get("lives", 3))
	correct_reports = int(saved.get("correct", 0))
	total_reports = int(saved.get("total", 0))
	collected_documents.clear()
	for page in saved.get("documents", []):
		collected_documents.append(str(page))
	observations.clear()
	for record in saved.get("observations", []):
		observations.append(str(record))
	anomaly_deck.clear()
	_start_inspection()


func _start_inspection() -> void:
	if current_round > MAX_ROUNDS:
		_show_endings()
		return
	_page.visible = false
	_hud.visible = true
	mode = "playing"
	player.set_physics_process(true)
	anomaly_director.set_process(true)
	audio.set_suspended(false)
	player.control_enabled = true
	player.position = Vector3(0, 0.04, -23.6)
	player.velocity = Vector3.ZERO
	player.rotation = Vector3(0, PI, 0)
	player.camera().rotation = Vector3.ZERO
	player.set_flashlight(true)
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	anomaly_director.clear()
	if anomaly_deck.is_empty():
		anomaly_deck = []
		for index in range(1, 31):
			anomaly_deck.append(index)
		anomaly_deck.shuffle()
	active_anomaly = -1
	var chance := 0.70 + minf(float(current_round - 1) * 0.025, 0.20)
	if randf() < chance:
		active_anomaly = anomaly_deck.pop_front()
		anomaly_director.begin(active_anomaly)
	_update_hud()
	_show_toast("A faint relay clicks somewhere above you.", 3.0)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if mode == "report":
			if event.keycode == KEY_1:
				_resolve_report(true)
			elif event.keycode == KEY_2:
				_resolve_report(false)
			return
		if mode == "journal":
			if event.keycode == KEY_TAB or event.keycode == KEY_ESCAPE:
				_close_journal()
			return
		if mode == "playing":
			if event.is_action_pressed("pause"):
				_open_pause()
			elif event.is_action_pressed("flashlight"):
				player.toggle_flashlight()
			elif event.is_action_pressed("interact"):
				var target: Object = player.interaction_target()
				var is_document := target != null and target.has_meta("document_id")
				var message := player.interact()
				if not is_document:
					_show_toast(message, 2.8)
			elif event.is_action_pressed("report"):
				_open_report()
			elif event.is_action_pressed("journal"):
				_open_journal()
		elif mode == "pause" and event.keycode == KEY_ESCAPE:
			_resume_game()
		elif mode == "menu" and event.keycode == KEY_ESCAPE:
			_quit_game()


func _process(delta: float) -> void:
	if mode == "playing":
		var near_end := player.global_position.z >= 21.4
		_objective_label.text = (
			"REACH THE STAIR LANDING TO FILE YOUR OBSERVATION."
			if not near_end
			else "THE LANDING IS AHEAD. FILE YOUR OBSERVATION."
		)
		var hit: Object = player.interaction_target()
		var prompt := ""
		_reticle.call("set_engaged", hit != null)
		if hit != null and hit.has_meta("door_root"):
			var door: HorrorDoor = hit.get_meta("door_root") as HorrorDoor
			prompt = "E  %s" % ("OPEN DOOR" if not door.is_open else "CLOSE DOOR")
		elif hit != null and hit.has_meta("document_id"):
			var doc_id := str(hit.get_meta("document_id"))
			prompt = "E  READ %s" % str(STORY.get(doc_id, {}).get("title", "PAGE"))
		elif near_end:
			prompt = "R  FILE AN OBSERVATION"
		_prompt_label.text = prompt
		_stamina_bar.value = player.stamina
		var stability: Array[String] = []
		for index in range(3):
			stability.append("■" if index < lives else "□")
		_life_label.text = "STABILITY   " + "  ".join(stability)
		if _toast_time > 0:
			_toast_time -= delta
			_toast_label.modulate.a = clampf(_toast_time * 1.5, 0.0, 1.0)
		else:
			_toast_label.text = ""
		if _threat_flash > 0:
			_threat_flash -= delta
	elif mode == "menu":
		# A restrained idle camera drift gives the title screen a living, cinematic background.
		player.rotation.y = PI + sin(Time.get_ticks_msec() * 0.00018) * 0.06


func _open_report() -> void:
	if player.global_position.z < 21.4:
		_show_toast("Not yet. Walk the corridor and examine what has changed.", 3.0)
		return
	mode = "report"
	_freeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_page = _new_page()
	var content := _card(_page, 690, 376, 0)
	_label(
		content,
		"FIELD REPORT     /     ENTRY %02d" % current_round,
		0,
		0,
		590,
		24,
		11,
		Color(0.69, 0.56, 0.40)
	)
	var title := Label.new()
	title.text = "Did the corridor change?"
	title.add_theme_font_size_override("font_size", 29)
	title.add_theme_color_override("font_color", Color(0.88, 0.85, 0.77))
	content.add_child(title)
	var copy := Label.new()
	copy.text = "Record what you observed. A false report weakens your stability.\nYou can review your collected evidence with the journal."
	copy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_theme_font_size_override("font_size", 14)
	copy.add_theme_color_override("font_color", Color(0.63, 0.66, 0.64))
	content.add_child(copy)
	var yes := _button(
		content, "1   YES — I SAW OR HEARD A CHANGE", Callable(self, "_report_yes"), 560
	)
	var no := _button(
		content, "2   NO — THE CORRIDOR SEEMED NORMAL", Callable(self, "_report_no"), 560
	)
	_button(content, "RETURN TO THE LANDING", Callable(self, "_cancel_report"), 560)
	yes.grab_focus()
	_report_card = content.get_parent()


func _report_yes() -> void:
	_resolve_report(true)


func _report_no() -> void:
	_resolve_report(false)


func _cancel_report() -> void:
	_page.queue_free()
	mode = "playing"
	_unfreeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _resolve_report(player_says_anomaly: bool) -> void:
	var was_anomaly := anomaly_director.is_active
	var correct := player_says_anomaly == was_anomaly
	total_reports += 1
	if correct:
		correct_reports += 1
		if was_anomaly:
			var record := (
				"ENTRY %02d — VERIFIED: %s"
				% [current_round, AnomalyScript.CATALOG[active_anomaly - 1]["title"]]
			)
			observations.append(record)
			_show_toast(
				"Your report is consistent with the evidence. The corridor releases you.", 3.0
			)
			audio.play_at("creak", player.global_position + Vector3(0, 0, -2), -14.0)
		else:
			observations.append("ENTRY %02d — VERIFIED: no change detected." % current_round)
			_show_toast("No change detected. You trust the quiet.", 2.8)
	else:
		lives -= 1
		observations.append("ENTRY %02d — DISPUTED: the observation was incorrect." % current_round)
		_show_toast("The building rejects your report. Stability lost.", 3.2)
		audio.play_at("scream", player.global_position + Vector3(0, 0.2, -2), -10.0)
	if was_anomaly:
		anomaly_director.clear()
	active_anomaly = -1
	if is_instance_valid(_page):
		_page.queue_free()
	if lives <= 0:
		_write_save()
		_show_lost_ending()
		return
	current_round += 1
	_write_save()
	if current_round > MAX_ROUNDS:
		_show_endings()
	else:
		_start_inspection()


func _open_journal() -> void:
	mode = "journal"
	_freeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_page = _new_page()
	var content := _card(_page, 820, 690, 0)
	_label(
		content,
		"RESIDENTIAL FIELD NOTES     /     FLOOR FOUR",
		0,
		0,
		720,
		20,
		11,
		Color(0.67, 0.54, 0.39)
	)
	var heading := Label.new()
	heading.text = "The anomaly journal"
	heading.add_theme_font_size_override("font_size", 30)
	heading.add_theme_color_override("font_color", Color(0.87, 0.84, 0.76))
	content.add_child(heading)
	var pages := Label.new()
	pages.add_theme_font_size_override("font_size", 13)
	pages.add_theme_color_override("font_color", Color(0.73, 0.73, 0.68))
	pages.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var journal_text := (
		"DOCUMENTS RECOVERED  %d / 3 REQUIRED\n" % mini(collected_documents.size(), 3)
	)
	for doc_id in collected_documents:
		var page: Dictionary = STORY.get(doc_id, {})
		journal_text += "\n%s\n%s\n" % [page.get("title", doc_id), page.get("text", "")]
	journal_text += "\nOBSERVATION RECORD\n"
	if observations.is_empty():
		journal_text += "No entries have been filed."
	else:
		for record in observations.slice(maxi(0, observations.size() - 8), observations.size()):
			journal_text += "•  %s\n" % record
	pages.text = journal_text
	content.add_child(pages)
	var close := _button(content, "CLOSE JOURNAL  [TAB]", Callable(self, "_close_journal"), 400)
	close.grab_focus()


func _close_journal() -> void:
	if is_instance_valid(_page):
		_page.queue_free()
	mode = "playing"
	_unfreeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _open_pause() -> void:
	mode = "pause"
	_freeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_page = _new_page()
	var content := _card(_page, 480, 350, 0)
	_label(content, "FIELD RECORD HELD", 0, 0, 390, 24, 11, Color(0.69, 0.56, 0.40))
	var title := Label.new()
	title.text = "Pause"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color(0.88, 0.85, 0.77))
	content.add_child(title)
	_button(content, "RESUME INSPECTION", Callable(self, "_resume_game"), 380)
	_button(content, "SETTINGS", Callable(self, "_open_settings"), 380)
	_button(content, "SAVE AND RETURN TO TITLE", Callable(self, "_return_title"), 380)


func _resume_game() -> void:
	if is_instance_valid(_page):
		_page.queue_free()
	mode = "playing"
	_unfreeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _return_title() -> void:
	_write_save()
	_show_main_menu()


func _open_settings() -> void:
	settings_return = mode
	mode = "settings"
	_page = _new_page()
	var content := _card(_page, 570, 480, 0)
	_label(content, "PREFERENCES", 0, 0, 470, 24, 11, Color(0.69, 0.56, 0.40))
	var title := Label.new()
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.88, 0.85, 0.77))
	content.add_child(title)
	var volume_label := Label.new()
	volume_label.text = "MASTER LEVEL"
	volume_label.add_theme_font_size_override("font_size", 11)
	volume_label.add_theme_color_override("font_color", Color(0.72, 0.70, 0.63))
	content.add_child(volume_label)
	var volume := HSlider.new()
	volume.min_value = 0.0
	volume.max_value = 1.0
	volume.step = 0.01
	volume.value = _settings["master"]
	volume.custom_minimum_size.x = 420
	volume.value_changed.connect(_on_master_changed)
	content.add_child(volume)
	var sensitivity_label := Label.new()
	sensitivity_label.text = "MOUSE LOOK SENSITIVITY"
	sensitivity_label.add_theme_font_size_override("font_size", 11)
	sensitivity_label.add_theme_color_override("font_color", Color(0.72, 0.70, 0.63))
	content.add_child(sensitivity_label)
	var sensitivity := HSlider.new()
	sensitivity.min_value = 0.0008
	sensitivity.max_value = 0.0035
	sensitivity.step = 0.0001
	sensitivity.value = _settings["sensitivity"]
	sensitivity.custom_minimum_size.x = 420
	sensitivity.value_changed.connect(_on_sensitivity_changed)
	content.add_child(sensitivity)
	var fullscreen := CheckButton.new()
	fullscreen.text = "FULLSCREEN DISPLAY"
	fullscreen.button_pressed = _settings["fullscreen"]
	fullscreen.toggled.connect(_on_fullscreen_changed)
	fullscreen.add_theme_color_override("font_color", Color(0.76, 0.75, 0.69))
	content.add_child(fullscreen)
	_button(content, "BACK", Callable(self, "_close_settings"), 420)


func _close_settings() -> void:
	_save_settings()
	if settings_return == "playing":
		_resume_game()
	elif settings_return == "pause":
		mode = "pause"
		_open_pause()
	else:
		_show_main_menu()


func _on_master_changed(value: float) -> void:
	_settings["master"] = value
	audio.set_master(value)


func _on_sensitivity_changed(value: float) -> void:
	_settings["sensitivity"] = value
	player.mouse_sensitivity = value


func _on_fullscreen_changed(value: bool) -> void:
	_settings["fullscreen"] = value
	get_window().mode = Window.MODE_FULLSCREEN if value else Window.MODE_WINDOWED


func _show_endings() -> void:
	mode = "ending"
	_freeze_world()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_page = _new_page()
	var content := _card(_page, 790, 480, 0)
	_label(
		content, "FINAL ENTRY     /     THREE WAYS OUT", 0, 0, 680, 24, 11, Color(0.68, 0.54, 0.39)
	)
	var title := Label.new()
	title.text = "Choose what you believe."
	title.add_theme_font_size_override("font_size", 29)
	title.add_theme_color_override("font_color", Color(0.88, 0.85, 0.77))
	content.add_child(title)
	var detail := Label.new()
	detail.text = (
		"Reports confirmed: %d / %d     Evidence pages: %d / 4"
		% [correct_reports, total_reports, collected_documents.size()]
	)
	detail.add_theme_font_size_override("font_size", 13)
	detail.add_theme_color_override("font_color", Color(0.67, 0.68, 0.63))
	content.add_child(detail)
	_button(content, "TAKE THE STAIRWELL  —  THE NIGHT AIR", Callable(self, "_ending_stairs"), 680)
	_button(
		content, "ENTER THE ELEVATOR  —  TRUST THE DISPLAY", Callable(self, "_ending_elevator"), 680
	)
	_button(
		content,
		"OPEN THE HIDDEN ARCHIVE  —  READ THE LAST PAGE",
		Callable(self, "_ending_archive"),
		680
	)


func _show_ending(title_text: String, body_text: String) -> void:
	anomaly_director.clear()
	mode = "ending"
	_freeze_world()
	if is_instance_valid(_page):
		_page.queue_free()
	_page = _new_page()
	var content := _card(_page, 850, 500, 0)
	_label(
		content, "DON'T LOOK BACK     /     AN ENDING", 0, 0, 740, 24, 11, Color(0.68, 0.54, 0.39)
	)
	var title := Label.new()
	title.text = title_text
	title.add_theme_font_size_override("font_size", 33)
	title.add_theme_color_override("font_color", Color(0.89, 0.85, 0.77))
	content.add_child(title)
	var body := Label.new()
	body.text = body_text
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_theme_font_size_override("font_size", 16)
	body.add_theme_color_override("font_color", Color(0.72, 0.73, 0.68))
	body.custom_minimum_size = Vector2(720, 150)
	content.add_child(body)
	_button(content, "BEGIN A NEW INSPECTION", Callable(self, "_new_run"), 680)
	_button(content, "RETURN TO TITLE", Callable(self, "_return_title"), 680)
	var previous_save := ProjectSettings.globalize_path("user://field_record.json")
	if FileAccess.file_exists("user://field_record.json"):
		DirAccess.remove_absolute(previous_save)
	_continue_available = false


func _ending_stairs() -> void:
	if correct_reports >= 7:
		_show_ending(
			"The street remembers you.",
			"The stairwell door opens onto rain and the blue hour before dawn. The apartment block stands behind you with every light on.\n\nAt the curb, you find your own handwriting on a maintenance notice: 'Do not go back for the other copy.' You walk until the building is no longer visible."
		)
	else:
		_show_ending(
			"The fourth-floor landing.",
			"You choose the stairs, but the emergency door opens back onto the same landing. On the wall, the inspection roster has one new name. The ink is still wet.\n\nThe report is filed. The building is not finished with you."
		)


func _ending_elevator() -> void:
	if collected_documents.size() >= 2:
		_show_ending(
			"A floor not on the plan.",
			"The lift passes the basement, then the foundations. When the doors part, you see the opposite window: a second corridor, a second you, and a stack of unread reports.\n\nYou step into the dark before the doors can close. The elevator never reaches the lobby."
		)
	else:
		_show_ending(
			"The empty lift.",
			"The elevator descends in silence. Its brass display counts down past zero. The doors open onto your apartment, where a fresh inspection form waits on the floor.\n\nThe doors close. Somewhere above, your footsteps start again."
		)


func _ending_archive() -> void:
	if collected_documents.size() >= 3:
		_show_ending(
			"The other side of the glass.",
			"The archive contains a fourth-floor plan with one extra room, drawn in the same hand as the letter. Inside the hidden room, the mirror looks out onto a normal apartment building in daylight.\n\nYou leave the documents on the sill. A figure on the far side picks them up. For the first time, it is not wearing your face."
		)
	else:
		_show_ending(
			"The sealed records room.",
			"You find the archive, but the file is incomplete. The last page has been torn away. Behind the shelving, something breathes with a patient, familiar rhythm.\n\nYou close the door. It locks from the other side."
		)


func _show_lost_ending() -> void:
	_show_ending(
		"The building keeps the record.",
		"Your stability gives way before the tenth inspection. The corridor becomes quiet, the lights settle into their usual rhythm, and a second name appears beneath yours on the resident roster.\n\nYour field record remains open on the landing."
	)


func _on_document_interaction(document_id: String) -> void:
	if not STORY.has(document_id):
		return
	if not collected_documents.has(document_id):
		collected_documents.append(document_id)
		var entry: Dictionary = STORY[document_id]
		_show_toast("Evidence recorded: " + str(entry["title"]), 4.0)
		_write_save()
	else:
		_show_toast("You have already recorded this page. Check the journal with TAB.", 3.0)


func _on_imitator_false_cue(cue_name: String, cue_position: Vector3) -> void:
	if mode == "playing" and anomaly_director != null:
		anomaly_director.play_entity_cue(cue_name, cue_position)


func _on_entity_threatened(entity_name: String) -> void:
	if mode != "playing":
		return
	lives -= 1
	_threat_flash = 0.48
	_show_toast("%s found you. Stability lost." % entity_name.capitalize(), 3.5)
	audio.play_at("scream", player.global_position, -5.0, 32)
	_update_hud()
	if lives <= 0:
		_show_lost_ending()


func _freeze_world() -> void:
	if is_instance_valid(player):
		player.control_enabled = false
		player.set_physics_process(false)
	if is_instance_valid(anomaly_director):
		anomaly_director.set_process(false)
	for actor in entities.values():
		if is_instance_valid(actor):
			actor.set_physics_process(false)
	if is_instance_valid(audio):
		audio.set_suspended(true)


func _unfreeze_world() -> void:
	if is_instance_valid(player):
		player.set_physics_process(true)
		player.control_enabled = true
	if is_instance_valid(anomaly_director):
		anomaly_director.set_process(true)
	for actor in entities.values():
		if is_instance_valid(actor) and actor.active:
			actor.set_physics_process(true)
	if is_instance_valid(audio):
		audio.set_suspended(false)


func _update_hud() -> void:
	if is_instance_valid(_round_label):
		_round_label.text = (
			"OBSERVATION %02d   /   %02d" % [mini(current_round, MAX_ROUNDS), MAX_ROUNDS]
		)


func _show_toast(text: String, duration: float) -> void:
	if not is_instance_valid(_toast_label):
		return
	_toast_label.text = text
	_toast_label.modulate.a = 1.0
	_toast_time = duration


func _write_save() -> void:
	var data := {
		"round": current_round,
		"lives": lives,
		"correct": correct_reports,
		"total": total_reports,
		"documents": collected_documents,
		"observations": observations
	}
	var file := FileAccess.open("user://field_record.json", FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(data, "\t"))
		_continue_available = true


func _load_save_summary() -> void:
	if not FileAccess.file_exists("user://field_record.json"):
		return
	var file := FileAccess.open("user://field_record.json", FileAccess.READ)
	if file == null:
		return
	var data: Variant = JSON.parse_string(file.get_as_text())
	_continue_available = data is Dictionary and int(data.get("round", 1)) <= MAX_ROUNDS


func _load_settings() -> void:
	var config := ConfigFile.new()
	if config.load("user://settings.cfg") == OK:
		_settings["master"] = config.get_value("audio", "master", 0.8)
		_settings["sensitivity"] = config.get_value("controls", "sensitivity", 0.0018)
		_settings["fullscreen"] = config.get_value("display", "fullscreen", false)
	audio.set_master(float(_settings["master"]))
	player.mouse_sensitivity = float(_settings["sensitivity"])
	get_window().mode = Window.MODE_FULLSCREEN if _settings["fullscreen"] else Window.MODE_WINDOWED


func _save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master", _settings["master"])
	config.set_value("controls", "sensitivity", _settings["sensitivity"])
	config.set_value("display", "fullscreen", _settings["fullscreen"])
	config.save("user://settings.cfg")


func _quit_game() -> void:
	get_tree().quit()
