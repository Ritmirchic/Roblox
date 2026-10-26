extends Control
class_name MainMenuUI
## Title screen: new game, continue, load slot, settings, quit.

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	process_mode = Node.PROCESS_MODE_ALWAYS
	GameState.set_phase(GameState.PHASE_MENU)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	var bg := TextureRect.new()
	if ResourceLoader.exists("res://assets/branding/loading.png"):
		bg.texture = load("res://assets/branding/loading.png")
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var dim := ColorRect.new()
	dim.color = Color(0.03, 0.03, 0.04, 0.62)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	center.add_child(box)
	var title := UiTheme.label("ASHES OF HUMANITY", 56,
		Color(0.92, 0.78, 0.55), HORIZONTAL_ALIGNMENT_CENTER)
	box.add_child(title)
	var sub := UiTheme.label("L A S T   S I G N A L", 24,
		UiTheme.ACCENT, HORIZONTAL_ALIGNMENT_CENTER)
	box.add_child(sub)
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 26)
	box.add_child(spacer)
	var buttons := [
		["New Game", _new_game],
		["Continue", _continue],
		["Load Game", _load],
		["Settings", _settings],
		["Quit to Desktop", _quit],
	]
	for pair in buttons:
		var b := UiTheme.button(pair[0])
		b.custom_minimum_size = Vector2(320, 48)
		b.pressed.connect(pair[1])
		box.add_child(b)
	var ver := UiTheme.label("v1.0.0 — Godot 4.7 — single survivor build", 13,
		UiTheme.TEXT_DIM, HORIZONTAL_ALIGNMENT_CENTER)
	ver.position = Vector2(0, 20)
	box.add_child(ver)
	AudioMan.play_music("drone_tension", -14.0)

func _new_game() -> void:
	GameState.reset_run()
	QuestMan.reset_state()
	SaveMan.pending = {}
	get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _continue() -> void:
	for slot in [1, 0, 2, 3, 4]:
		if SaveMan.has_save(slot):
			SaveMan.load_game(slot)
			get_tree().change_scene_to_file("res://scenes/Main.tscn")
			return
	QuestMan.toast.emit("No save game found")

func _load() -> void:
	UIRouter.open("LoadUI")

func _settings() -> void:
	UIRouter.open("SettingsUI")

func _quit() -> void:
	get_tree().quit()
