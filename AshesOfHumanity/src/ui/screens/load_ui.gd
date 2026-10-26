extends BaseScreen
class_name LoadUI

func _init() -> void:
	super._init("LoadUI")

func title_text() -> String:
	return "Load Game"

func _build_body() -> void:
	var v := _scroll_column()
	var slots := SaveMan.list_slots()
	if slots.is_empty():
		v.add_child(UiTheme.label("No saved games yet.", 16, UiTheme.TEXT_DIM))
		return
	for entry in slots:
		var row := HBoxContainer.new()
		var dt := Time.get_datetime_string_from_unix_time(
			int(entry.timestamp), false)
		var l := UiTheme.label("Slot %d — Day %d, Level %d — %s" % [
			entry.slot, entry.day, entry.level, dt], 15)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		var load := UiTheme.button("Load")
		load.custom_minimum_size = Vector2(110, 36)
		var slot_id: int = entry.slot
		load.pressed.connect(func():
			SaveMan.load_game(slot_id)
			get_tree().change_scene_to_file("res://scenes/Main.tscn"))
		row.add_child(load)
		var del := UiTheme.button("Delete")
		del.custom_minimum_size = Vector2(110, 36)
		del.pressed.connect(func():
			SaveMan.delete_save(slot_id)
			UIRouter.close("LoadUI")
			UIRouter.open("LoadUI"))
		row.add_child(del)
		v.add_child(row)
