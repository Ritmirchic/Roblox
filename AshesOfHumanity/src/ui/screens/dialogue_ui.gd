extends BaseScreen
class_name DialogueUI

var npc_id := ""
var node_id := ""
var text_box: RichTextLabel
var options_box: VBoxContainer
var name_label: Label

func _init() -> void:
	super._init("DialogueUI")

func title_text() -> String:
	return "Dialogue"

func show_close() -> bool:
	return false

func _build_body() -> void:
	npc_id = payload.get("npc", "")
	var tree: Dictionary = DialogueDB.get_tree(npc_id)
	name_label = UiTheme.label(tree.get("name", "Stranger"), 22,
		Color(0.95, 0.85, 0.65))
	content.add_child(name_label)
	text_box = RichTextLabel.new()
	text_box.bbcode_enabled = true
	text_box.fit_content = true
	text_box.custom_minimum_size = Vector2(800, 170)
	text_box.add_theme_stylebox_override("normal",
		UiTheme.style(Color(0.08, 0.09, 0.1, 0.95), 6, 1))
	content.add_child(text_box)
	options_box = VBoxContainer.new()
	options_box.add_theme_constant_override("separation", 6)
	content.add_child(options_box)
	node_id = tree.get("start", "intro")
	_show_node()

func _show_node() -> void:
	var tree: Dictionary = DialogueDB.get_tree(npc_id)
	var node: Dictionary = DialogueDB.node(npc_id, node_id)
	if node.is_empty():
		_close()
		return
	text_box.text = String(node.get("text", "..."))
	for c in options_box.get_children():
		c.free()
	for option in node.get("options", []):
		if option.has("requires_flag") \
				and not GameState.get_story_flag(option.requires_flag):
			continue
		var b := UiTheme.button(String(option.text))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var next_id: String = option.get("next", "")
		var event: Dictionary = option.get("event", {})
		b.pressed.connect(func(): _choose(next_id, event))
		options_box.add_child(b)

func _choose(next_id: String, event: Dictionary) -> void:
	AudioMan.play_2d("ui_click", -10.0)
	if event.has("accept"):
		var qid: String = event.accept
		if QuestMan.can_accept(qid):
			QuestMan.accept(qid)
	if event.has("flag"):
		GameState.set_story_flag(event.flag)
	if event.has("shop"):
		UIRouter.open("ShopUI", {"shop": event.shop})
		return
	if next_id == "":
		_close()
		return
	node_id = next_id
	_show_node()
