extends SpotLight3D
class_name Flashlight
## The player's damaged flashlight: toggleable, battery drain, flicker when
## critically low. Parent to the camera so the cone follows the view.

var battery := 100.0
var on := true
var _flicker_t := 0.0

func _ready() -> void:
	light_energy = 3.2
	spot_range = 42.0
	spot_angle = 38.0
	spot_angle_attenuation = 1.2
	light_color = Color(1.0, 0.92, 0.78)
	shadow_enabled = true
	visible = on

func toggle() -> void:
	if battery <= 0.0:
		return
	on = not on
	visible = on
	AudioMan.play_2d("ui_click", -10.0)

func charge(amount: float) -> void:
	battery = clampf(battery + amount, 0.0, 100.0)

func _process(delta: float) -> void:
	if not on or GameState.phase != GameState.PHASE_PLAYING:
		return
	battery = max(0.0, battery - delta * 0.18)  # ~9 minutes of light
	if battery < 15.0:
		_flicker_t -= delta
		if _flicker_t <= 0.0:
			_flicker_t = randf_range(0.05, 0.25)
			visible = not visible
		light_energy = 2.4
	else:
		visible = true
		light_energy = 3.2
	if battery <= 0.0:
		on = false
		visible = false
