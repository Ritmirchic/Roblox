extends BaseScreen
class_name DeathUI

func _init() -> void:
	super._init("DeathUI")
	close_on_pause = false

func title_text() -> String:
	return "YOU DIED"

func show_close() -> bool:
	return false

func _build_body() -> void:
	var v := _scroll_column()
	var stats: Dictionary = GameState.stats
	v.add_child(UiTheme.label(
		"The ashes claim another survivor. Day %d, Level %d." % [
			WorldClock.day_index, GameState.level], 17, UiTheme.TEXT_DIM))
	v.add_child(UiTheme.label(
		"Kills: %d   Bosses: %d   Quests: %d   Distance: %dm   Crafts: %d" % [
			stats.kills, stats.bosses, stats.quests_done,
			int(stats.distance_m), stats.crafts], 15, UiTheme.TEXT))
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 18)
	v.add_child(spacer)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 12)
	col.custom_minimum_size = Vector2(320, 0)
	row.add_child(col)
	v.add_child(row)
	if SaveMan.has_save(1) or SaveMan.has_save(0):
		var reload := UiTheme.button("Reload Last Save")
		reload.pressed.connect(func():
			var slot := 1 if SaveMan.has_save(1) else 0
			SaveMan.load_game(slot)
			get_tree().change_scene_to_file("res://scenes/Main.tscn"))
		col.add_child(reload)
	var menu := UiTheme.button("Return to Main Menu")
	menu.pressed.connect(func():
		get_tree().change_scene_to_file("res://scenes/Boot.tscn"))
	col.add_child(menu)
