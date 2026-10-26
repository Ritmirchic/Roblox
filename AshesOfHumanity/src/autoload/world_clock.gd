extends Node
## Full day/night cycle. Drives the sun light, sky colors, star visibility and
## ambient temperature; night changes gameplay (danger, temperature).

signal hour_changed(hour: float)
signal day_changed(day: int)
signal night_state(is_night: bool)

const MINUTES_PER_DAY := 34.0  # one in-game day lasts ~34 real minutes
var time_of_day := 8.0 * 60.0  # minutes since midnight, start 08:00
var day_index := 1
var is_night := false

var sun: DirectionalLight3D = null
var sky_mat: ProceduralSkyMaterial = null
var env: Environment = null
var stars: PointMesh = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func bind(p_sun: DirectionalLight3D, p_env: Environment,
		p_sky: ProceduralSkyMaterial) -> void:
	sun = p_sun
	env = p_env
	sky_mat = p_sky

func _process(delta: float) -> void:
	if GameState.phase != GameState.PHASE_PLAYING:
		return
	var prev_hour: int = int(floor(time_of_day / 60.0))
	time_of_day = fmod(time_of_day + delta * (1440.0 / MINUTES_PER_DAY), 1440.0)
	var hour: int = int(floor(time_of_day / 60.0))
	if hour != prev_hour:
		hour_changed.emit(time_of_day / 60.0)
	if time_of_day / 60.0 < 1.0 and prev_hour >= 23:
		day_index += 1
		GameState.stats.days_survived = day_index - 1
		day_changed.emit(day_index)
	_apply()

func hour_float() -> float:
	return time_of_day / 60.0

func clock_text() -> String:
	var h := int(time_of_day / 60.0)
	var m := int(time_of_day) % 60
	return "%02d:%02d" % [h, m]

func set_time(hours: float) -> void:
	time_of_day = fmod(hours * 60.0, 1440.0)
	_apply()

func _apply() -> void:
	var h: float = hour_float()
	# Sun angle: midnight=-90 (below), noon=90 (above)
	var angle: float = deg_to_rad((h / 24.0) * 360.0 - 90.0)
	var now_night := h < 6.0 or h >= 20.5
	if now_night != is_night:
		is_night = now_night
		night_state.emit(is_night)
	if sun:
		sun.rotation_degrees = Vector3(rad_to_deg(angle) - 90.0, -35.0, 0)
		sun.light_energy = clampf(sin((h - 6.0) / 14.0 * PI), 0.0, 1.0) * 1.1 + 0.02
		if is_night:
			sun.light_color = Color(0.45, 0.55, 0.85)
			sun.light_energy = 0.08
		elif h < 8.0 or h > 18.0:
			sun.light_color = Color(1.0, 0.62, 0.38)
		else:
			sun.light_color = Color(1.0, 0.95, 0.85)
	if sky_mat and env:
		var day_top := Color(0.28, 0.42, 0.62)
		var night_top := Color(0.012, 0.016, 0.035)
		var day_horizon := Color(0.62, 0.68, 0.72)
		var night_horizon := Color(0.05, 0.06, 0.11)
		var t := clampf(sin((h - 6.0) / 14.0 * PI), 0.0, 1.0)
		sky_mat.sky_top_color = night_top.lerp(day_top, t)
		sky_mat.sky_horizon_color = night_horizon.lerp(day_horizon, t)
		sky_mat.ground_bottom_color = Color(0.08, 0.08, 0.07).lerp(
			Color(0.2, 0.19, 0.16), t)
		sky_mat.ground_horizon_color = night_horizon.lerp(day_horizon, t * 0.8)
		env.ambient_light_color = night_horizon.lerp(Color(0.5, 0.52, 0.58), t)
		env.ambient_light_energy = lerp(0.25, 0.7, t)
		env.fog_light_color = night_horizon.lerp(day_horizon, t)

func ambient_temperature() -> float:
	# Degrees Celsius; cold at night, warm around 15:00.
	var h: float = hour_float()
	var warmth: float = sin((h - 7.0) / 14.0 * PI)
	var base := 8.0 + 14.0 * clampf(warmth, -0.3, 1.0)
	if Weather.current == Weather.STORM:
		base -= 4.0
	elif Weather.current == Weather.RAIN:
		base -= 2.0
	return base + Weather.region_temp_mod

func to_save_dict() -> Dictionary:
	return {"time_of_day": time_of_day, "day_index": day_index}

func from_save_dict(d: Dictionary) -> void:
	time_of_day = float(d.get("time_of_day", 480.0))
	day_index = int(d.get("day_index", 1))
	_apply()
