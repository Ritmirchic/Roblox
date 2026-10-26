extends CanvasLayer
## Routes full-screen UI screens and keeps mouse/input focus consistent.

signal screen_opened(screen: String)
signal screen_closed(screen: String)

var open_screens: Array[String] = []
var _hud: CanvasLayer = null
var _factory: Callable

func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS

func register_hud(hud: CanvasLayer) -> void:
	_hud = hud

func set_screen_factory(callable: Callable) -> void:
	_factory = callable

func open(screen: String, payload: Dictionary = {}) -> void:
	if screen in open_screens:
		return
	open_screens.append(screen)
	if not _factory.is_valid():
		push_error("UI factory not configured")
		return
	var node: Control = _factory.call(screen, payload)
	if node:
		add_child(node)
		node.set_meta("screen_id", screen)
		if node.has_method("setup"):
			node.setup(payload)
	screen_opened.emit(screen)
	_apply_focus()

func close(screen: String) -> void:
	for child in get_children():
		if child is Control and child.has_meta("screen_id") \
				and child.get_meta("screen_id") == screen:
			child.queue_free()
	open_screens.erase(screen)
	screen_closed.emit(screen)
	_apply_focus()

func close_all() -> void:
	for s in open_screens.duplicate():
		close(s)

func is_open(screen: String) -> bool:
	return screen in open_screens

func toggle(screen: String) -> void:
	if is_open(screen):
		close(screen)
	else:
		open(screen)

func _apply_focus() -> void:
	var any_fullscreen := open_screens.size() > 0
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if any_fullscreen \
		else Input.MOUSE_MODE_CAPTURED
	if any_fullscreen:
		GameState.set_phase(GameState.PHASE_PAUSED)
	elif GameState.phase == GameState.PHASE_PAUSED:
		GameState.set_phase(GameState.PHASE_PLAYING)
