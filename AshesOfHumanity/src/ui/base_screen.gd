extends Control
class_name BaseScreen
## Shared full-screen menu scaffolding: dimmed background, centered panel,
## title and a close button. Screens populate `content_row`.

var screen_id := ""
var panel_box: PanelContainer
var content: VBoxContainer
var payload: Dictionary = {}
var close_on_pause := true

func _init(p_screen_id: String = "") -> void:
	screen_id = p_screen_id
	set_anchors_preset(Control.PRESET_FULL_RECT)
	process_mode = Node.PROCESS_MODE_ALWAYS
	mouse_filter = Control.MOUSE_FILTER_STOP

func _ready() -> void:
	var dim := ColorRect.new()
	dim.color = Color(0.02, 0.02, 0.025, 0.82)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel_box = UiTheme.panel()
	panel_box.custom_minimum_size = Vector2(860, 620)
	center.add_child(panel_box)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_bottom", 18)
	panel_box.add_child(margin)
	content = VBoxContainer.new()
	content.add_theme_constant_override("separation", 10)
	margin.add_child(content)
	_build_header()
	_build_body()

func setup(p: Dictionary) -> void:
	payload = p

func _build_header() -> void:
	var head := HBoxContainer.new()
	var title := UiTheme.header(title_text())
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title)
	if show_close():
		var close := UiTheme.button("Close [Esc]")
		close.custom_minimum_size = Vector2(150, 36)
		close.pressed.connect(_close)
		head.add_child(close)
	content.add_child(head)
	var sep := HSeparator.new()
	content.add_child(sep)

func title_text() -> String:
	return screen_id

func show_close() -> bool:
	return true

func _close() -> void:
	UIRouter.close(screen_id)

func unhandled_input(event: InputEvent) -> void:
	if close_on_pause and event.is_action_pressed("pause"):
		_close()
		get_viewport().set_input_as_handled()

func _scroll_column() -> ScrollContainer:
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var v := VBoxContainer.new()
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_theme_constant_override("separation", 8)
	sc.add_child(v)
	content.add_child(sc)
	return v
