extends BaseScreen
class_name PauseUI

func _init() -> void:
	super._init("PauseUI")

func title_text() -> String:
	return "Paused"

func show_close() -> bool:
	return false

func _build_body() -> void:
	var v := _scroll_column()
	var center := HBoxContainer.new()
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 12)
	col.custom_minimum_size = Vector2(340, 0)
	center.add_child(col)
	v.add_child(center)
	var resume := UiTheme.button("Resume")
	resume.pressed.connect(_close)
	col.add_child(resume)
	var save := UiTheme.button("Save Game (Slot 1)")
	save.pressed.connect(func():
		if SaveMan.save_game(1):
			QuestMan.toast.emit("Game saved to slot 1"))
	col.add_child(save)
	var settings := UiTheme.button("Settings")
	settings.pressed.connect(func(): UIRouter.open("SettingsUI"))
	col.add_child(settings)
	var help := UiTheme.button("Controls Help")
	help.pressed.connect(func(): UIRouter.open("HelpUI"))
	col.add_child(help)
	var menu := UiTheme.button("Save and Return to Menu")
	menu.pressed.connect(func():
		SaveMan.save_game(1)
		get_tree().change_scene_to_file("res://scenes/Boot.tscn"))
	col.add_child(menu)
	var quit := UiTheme.button("Quit to Desktop")
	quit.pressed.connect(func(): get_tree().quit())
	col.add_child(quit)
