extends BaseScreen
class_name JournalUI

var list_box: VBoxContainer
var detail: VBoxContainer

func _init() -> void:
	super._init("JournalUI")

func title_text() -> String:
	return "Journal"

func _build_body() -> void:
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 16)
	content.add_child(body)
	var left_scroll := ScrollContainer.new()
	left_scroll.custom_minimum_size = Vector2(300, 480)
	list_box = VBoxContainer.new()
	list_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_scroll.add_child(list_box)
	body.add_child(left_scroll)
	var right_scroll := ScrollContainer.new()
	right_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail = VBoxContainer.new()
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_scroll.add_child(detail)
	body.add_child(right_scroll)
	_refresh_list()

func _refresh_list() -> void:
	for c in list_box.get_children():
		c.free()
	list_box.add_child(UiTheme.label("ACTIVE", 15, UiTheme.ACCENT))
	for qid in QuestMan.active_quests():
		var q := QuestDB.get_quest(qid)
		_add_quest_button(qid, q.title, UiTheme.TEXT)
	list_box.add_child(UiTheme.label("COMPLETED", 15, UiTheme.GOOD))
	for qid in QuestMan.completed:
		var q := QuestDB.get_quest(qid)
		_add_quest_button(qid, q.title, UiTheme.TEXT_DIM)

func _add_quest_button(qid: String, title: String, color: Color) -> void:
	var b := UiTheme.button(title)
	b.custom_minimum_size = Vector2(280, 38)
	b.add_theme_color_override("font_color", color)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.pressed.connect(func(): _show_quest(qid))
	list_box.add_child(b)

func _show_quest(qid: String) -> void:
	for c in detail.get_children():
		c.free()
	var q := QuestDB.get_quest(qid)
	var is_active := qid in QuestMan.active_quests()
	detail.add_child(UiTheme.label(q.title, 22,
		Color(0.95, 0.85, 0.65)))
	detail.add_child(UiTheme.label(
		"%s quest — giver: %s" % [
			"Side" if q.get("side", false) else "Main",
			str(q.giver).capitalize()], 13, UiTheme.TEXT_DIM))
	detail.add_child(UiTheme.label(q.description, 15, UiTheme.TEXT))
	detail.add_child(UiTheme.label("OBJECTIVES", 15, UiTheme.ACCENT))
	if is_active:
		for line in QuestMan.objective_labels(qid):
			detail.add_child(UiTheme.label(line, 14, UiTheme.TEXT))
	else:
		for ob in q.objectives:
			detail.add_child(UiTheme.label("[X] " + ob.label, 14,
				UiTheme.GOOD))
	var rewards: Dictionary = q.get("rewards", {})
	if not rewards.is_empty():
		detail.add_child(UiTheme.label("REWARDS", 15, UiTheme.ACCENT))
		detail.add_child(UiTheme.label("%d XP" % int(rewards.get("xp", 0)),
			14, UiTheme.TEXT))
		for item in rewards.get("items", {}):
			detail.add_child(UiTheme.label("%s x%d" % [
				ItemDB.display_name(item), rewards.items[item]], 14,
				UiTheme.TEXT))
