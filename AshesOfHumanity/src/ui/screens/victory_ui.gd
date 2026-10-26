extends BaseScreen
class_name VictoryUI

func _init() -> void:
	super._init("VictoryUI")
	close_on_pause = false

func title_text() -> String:
	return "THE LAST SIGNAL FADES"

func show_close() -> bool:
	return false

func _build_body() -> void:
	var v := _scroll_column()
	v.add_child(UiTheme.label(
		"The broadcast console goes dark. The Last Signal was humanity's final "
		"automated heartbeat — a warning, a farewell, and a map for anyone "
		"strong enough to reach it. You were. The wasteland still stretches in "
		"every direction, but now it knows your name.", 17, UiTheme.TEXT))
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 14)
	v.add_child(spacer)
	var stats: Dictionary = GameState.stats
	v.add_child(UiTheme.label(
		"Days survived: %d   Kills: %d   Bosses: %d   Quests: %d" % [
			GameState.stats.days_survived, stats.kills, stats.bosses,
			stats.quests_done], 15, UiTheme.GOOD))
	var continue_btn := UiTheme.button("Continue Playing (Free Roam)")
	continue_btn.pressed.connect(_close)
	v.add_child(continue_btn)
	var menu := UiTheme.button("Return to Main Menu")
	menu.pressed.connect(func():
		get_tree().change_scene_to_file("res://scenes/Boot.tscn"))
	v.add_child(menu)
