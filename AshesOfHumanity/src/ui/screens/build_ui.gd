extends BaseScreen
class_name BuildUI

var list_box: VBoxContainer

func _init() -> void:
	super._init("BuildUI")

func title_text() -> String:
	return "Base Building"

func _build_body() -> void:
	content.add_child(UiTheme.label(
		"Select a structure, then place it with [E]. Rotate with [Q], cancel with [G] or [Esc].",
		14, UiTheme.TEXT_DIM))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list_box = VBoxContainer.new()
	list_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(list_box)
	content.add_child(scroll)
	_refresh()

func _refresh() -> void:
	for c in list_box.get_children():
		c.free()
	var p: Survivor = GameState.player
	for type_id in BaseBuilder.CATALOG:
		var spec: Dictionary = BaseBuilder.CATALOG[type_id]
		var row := HBoxContainer.new()
		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.add_child(UiTheme.label(spec.name, 16, UiTheme.TEXT))
		var cost_text := ""
		var affordable := true
		for id in spec.cost:
			var have: int = p.inventory_count(id)
			var need: int = int(spec.cost[id])
			if GameState.has_skill("t5"):
				need = maxi(1, need - 1)
			if have < need:
				affordable = false
			cost_text += "%s %d/%d   " % [ItemDB.display_name(id), have, need]
		info.add_child(UiTheme.label(cost_text, 13,
			UiTheme.GOOD if affordable else UiTheme.DANGER))
		if spec.has("requires_skill") and not GameState.has_skill(
				spec.requires_skill):
			info.add_child(UiTheme.label("Requires Engineer perk", 12,
				UiTheme.DANGER))
		row.add_child(info)
		var place := UiTheme.button("Place")
		place.custom_minimum_size = Vector2(120, 40)
		place.disabled = not affordable
		var tid: String = type_id
		place.pressed.connect(func():
			var main := get_tree().current_scene
			if main and main.has_method("get") and main.builder:
				main.builder.begin(tid)
			_close())
		row.add_child(place)
		list_box.add_child(row)
