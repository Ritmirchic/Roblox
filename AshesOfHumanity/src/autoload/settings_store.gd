extends Node
## Global settings: graphics quality, controls, audio, accessibility.
## Persisted to user://settings.cfg. Also registers input actions at runtime
## so the project stays portable across machines without hand-edited maps.

const SAVE_PATH := "user://settings.cfg"
const QUALITY_PRESETS := {
	"Low": {"msaa": Viewport.MSAA_DISABLED, "shadow_dir": 1024, "shadow_pos": 1024,
		"fog": false, "particles": 0.5, "view_dist": 0.55, "ssao": false,
		"glow": false, "aniso": 0},
	"Medium": {"msaa": Viewport.MSAA_2X, "shadow_dir": 2048, "shadow_pos": 2048,
		"fog": true, "particles": 0.75, "view_dist": 0.75, "ssao": false,
		"glow": true, "aniso": 1},
	"High": {"msaa": Viewport.MSAA_4X, "shadow_dir": 4096, "shadow_pos": 4096,
		"fog": true, "particles": 1.0, "view_dist": 0.9, "ssao": true,
		"glow": true, "aniso": 2},
	"Ultra": {"msaa": Viewport.MSAA_8X, "shadow_dir": 4096, "shadow_pos": 4096,
		"fog": true, "particles": 1.0, "view_dist": 1.0, "ssao": true,
		"glow": true, "aniso": 4},
}

var data := {
	"quality": "High",
	"fullscreen": true,
	"vsync": true,
	"fps_limit": 0,
	"fov": 75.0,
	"mouse_sensitivity": 0.32,
	"invert_y": false,
	"master_volume": 0.9,
	"sfx_volume": 0.9,
	"music_volume": 0.75,
	"motion_blur": false,
	"head_bob": true,
	"camera_shake": true,
	"stress_effects": true,
	"language": "en",
}

signal settings_changed

func _ready() -> void:
	load_settings()
	_register_input()
	apply_all()

func _register_input() -> void:
	var actions := {
		"move_forward": [KEY_W, KEY_UP],
		"move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"sprint": [KEY_SHIFT],
		"crouch": [KEY_C, KEY_CTRL],
		"jump": [KEY_SPACE],
		"interact": [KEY_E],
		"flashlight": [KEY_F],
		"reload": [KEY_R],
		"switch_weapon": [KEY_TAB],
		"weapon_1": [KEY_1],
		"weapon_2": [KEY_2],
		"weapon_3": [KEY_3],
		"weapon_4": [KEY_4],
		"med_use": [KEY_H],
		"toggle_view": [KEY_V],
		"inventory": [KEY_I, KEY_TAB],
		"journal": [KEY_J],
		"map": [KEY_M],
		"character": [KEY_K],
		"crafting": [KEY_B],
		"build_menu": [KEY_G],
		"pause": [KEY_ESCAPE],
		"quick_save": [KEY_F5],
		"quick_load": [KEY_F9],
	}
	for action_name in actions:
		if not InputMap.has_action(action_name):
			InputMap.add_action(action_name)
		for keycode in actions[action_name]:
			var ev := InputEventKey.new()
			ev.physical_keycode = keycode
			InputMap.action_add_event(action_name, ev)
	# Mouse buttons
	for pair in [["fire", MOUSE_BUTTON_LEFT], ["aim", MOUSE_BUTTON_RIGHT],
			["melee", MOUSE_BUTTON_MIDDLE]]:
		if not InputMap.has_action(pair[0]):
			InputMap.add_action(pair[0])
		var mb := InputEventMouseButton.new()
		mb.button_index = pair[1]
		InputMap.action_add_event(pair[0], mb)

func apply_all() -> void:
	var q: Dictionary = QUALITY_PRESETS[data.quality]
	var root := get_tree().root
	root.mesh_lod_threshold = int(lerp(4.0, 1.0, q.view_dist))
	if data.fullscreen:
		root.mode = Window.MODE_FULLSCREEN
	else:
		root.mode = Window.MODE_WINDOWED
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if data.vsync else DisplayServer.VSYNC_DISABLED)
	Engine.max_fps = int(data.fps_limit)
	settings_changed.emit()

func apply_environment(env: Environment) -> void:
	if env == null:
		return
	var q: Dictionary = QUALITY_PRESETS[data.quality]
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.05
	env.ssao_enabled = q.ssao
	env.glow_enabled = q.glow
	env.glow_intensity = 0.5
	env.volumetric_fog_enabled = q.fog
	env.volumetric_fog_density = 0.015
	env.adjustment_enabled = true
	env.adjustment_brightness = 1.02
	env.adjustment_contrast = 1.08
	env.adjustment_saturation = 0.92

func set_value(key: String, value) -> void:
	data[key] = value
	apply_all()
	save_settings()

func quality_params() -> Dictionary:
	return QUALITY_PRESETS[data.quality]

func save_settings() -> void:
	var f := ConfigFile.new()
	for k in data:
		f.set_value("settings", k, data[k])
	f.save(SAVE_PATH)

func load_settings() -> void:
	var f := ConfigFile.new()
	if f.load(SAVE_PATH) != OK:
		return
	for k in data:
		if f.has_section_key("settings", k):
			data[k] = f.get_value("settings", k)
