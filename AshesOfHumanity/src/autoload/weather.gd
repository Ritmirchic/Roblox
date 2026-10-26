extends Node
## Dynamic weather system with clear/rain/storm/fog/radiation states.
## Affects visibility (fog), temperature, audio and enemy aggression.

signal weather_changed(state: String, intensity: float)

const CLEAR := "clear"
const RAIN := "rain"
const FOG := "fog"
const STORM := "storm"
const RADIATION := "radiation"
const STATES := [CLEAR, RAIN, FOG, STORM, RADIATION]

var current := CLEAR
var intensity := 0.0
var region_temp_mod := 0.0
var _time_left := 120.0
var _fx: Node3D = null
var _rain: GPUParticles3D = null
var _strike_cooldown := 6.0
var _env: Environment = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func bind(env: Environment, fx_root: Node3D) -> void:
	_env = env
	_fx = fx_root
	_build_particles()
	_apply_state()

func _build_particles() -> void:
	if _rain != null:
		return
	_rain = GPUParticles3D.new()
	_rain.amount = 2400
	_rain.lifetime = 1.2
	_rain.local_coords = false
	_rain.visible = false
	var mat := ParticleProcessMaterial.new()
	mat.direction = Vector3(0.15, -1, 0)
	mat.gravity = Vector3(0, -18, 0)
	mat.initial_velocity_min = 14.0
	mat.initial_velocity_max = 22.0
	mat.spread = 6.0
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	mat.emission_box_extents = Vector3(30, 20, 30)
	var box := BoxMesh.new()
	box.size = Vector3(0.015, 0.35, 0.015)
	var sm := StandardMaterial3D.new()
	sm.albedo_color = Color(0.6, 0.7, 0.85, 0.5)
	sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	box.material = sm
	_rain.draw_pass_1 = box
	_rain.process_material = mat
	_rain.visibility_aabb = AABB(Vector3(-30, -20, -30), Vector3(60, 40, 60))
	_fx.add_child(_rain)

func _process(delta: float) -> void:
	if GameState.phase != GameState.PHASE_PLAYING:
		return
	_time_left -= delta
	if _time_left <= 0.0:
		_pick_next()
	if current == STORM:
		_strike_cooldown -= delta
		if _strike_cooldown <= 0.0:
			_lightning()
	if _rain and GameState.player:
		_rain.global_position = GameState.player.global_position + Vector3(0, 18, 0)

func _pick_next() -> void:
	var weights := {
		CLEAR: 40, RAIN: 22, FOG: 16, STORM: 10, RADIATION: 12,
	}
	# Radiation storms only after the industrial act begins.
	if not GameState.get_story_flag("act4_reached"):
		weights[RADIATION] = 0
	var roll := randi() % 100
	var acc := 0
	var next := CLEAR
	for s in weights:
		acc += weights[s]
		if roll < acc:
			next = s
			break
	set_state(next, randf_range(0.55, 1.0))
	_time_left = randf_range(90.0, 240.0)

func set_state(state: String, force_intensity: float = -1.0) -> void:
	current = state
	intensity = force_intensity if force_intensity > 0.0 else 0.8
	_apply_state()
	weather_changed.emit(current, intensity)
	AudioMan.on_weather(current)

func _apply_state() -> void:
	if _env:
		match current:
			CLEAR:
				_env.fog_density = 0.006
			FOG:
				_env.fog_density = 0.06 * intensity
			RAIN:
				_env.fog_density = 0.02 * intensity
			STORM:
				_env.fog_density = 0.035 * intensity
			RADIATION:
				_env.fog_density = 0.028 * intensity
				_env.fog_light_color = Color(0.45, 0.6, 0.35)
	if _rain:
		_rain.visible = current == RAIN or current == STORM
		_rain.amount = int(1600 + 1800 * intensity) if _rain.visible else 0

func _lightning() -> void:
	_strike_cooldown = randf_range(5.0, 14.0)
	if GameState.player == null:
		return
	var light := OmniLight3D.new()
	light.light_color = Color(0.75, 0.82, 1.0)
	light.light_energy = 6.0
	light.omni_range = 90.0
	light.global_position = GameState.player.global_position + Vector3(
		randf_range(-35, 35), 45, randf_range(-35, 35))
	_fx.add_child(light)
	var tw := create_tween()
	tw.tween_property(light, "light_energy", 0.0, 0.9)
	tw.tween_callback(light.queue_free)
	AudioMan.play_3d("thunder", light.global_position, 1.6)
	if SettingsStore.data.camera_shake and GameState.player:
		GameState.player.shake(0.35, 0.4)

func enemy_aggression_mod() -> float:
	match current:
		STORM: return 1.35
		RADIATION: return 1.2
		RAIN: return 1.1
		FOG: return 1.15
		_: return 1.0

func player_visibility_mod() -> float:
	# Lower = player harder to see.
	match current:
		FOG: return 0.55
		RAIN: return 0.8
		STORM: return 0.65
		_: return 1.0

func to_save_dict() -> Dictionary:
	return {"current": current, "intensity": intensity,
		"time_left": _time_left, "region_temp_mod": region_temp_mod}

func from_save_dict(d: Dictionary) -> void:
	current = d.get("current", CLEAR)
	intensity = float(d.get("intensity", 0.8))
	_time_left = float(d.get("time_left", 120.0))
	region_temp_mod = float(d.get("region_temp_mod", 0.0))
	_apply_state()
