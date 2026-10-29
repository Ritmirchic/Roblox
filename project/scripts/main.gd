extends Node3D

const CAR_CATALOG := [
	{
		"id": "aurora_gt",
		"name": "Asterion GT",
		"category": "SPORT COUPE",
		"drive": "RWD",
		"power": 355,
		"mass": 1380,
		"max_speed": 278,
		"handling": 1.00,
		"tone": 1.0,
		"price": 0,
		"paint": Color("#d84839")
	},
	{
		"id": "coast_rally",
		"name": "Vela RX",
		"category": "RALLY HATCH",
		"drive": "AWD",
		"power": 310,
		"mass": 1295,
		"max_speed": 238,
		"handling": 1.13,
		"tone": 0.82,
		"price": 45000,
		"paint": Color("#e0b547")
	},
	{
		"id": "voltage_s",
		"name": "Current S",
		"category": "ELECTRIC GT",
		"drive": "AWD",
		"power": 520,
		"mass": 1910,
		"max_speed": 265,
		"handling": 0.94,
		"tone": 0.55,
		"price": 82000,
		"paint": Color("#40b8b1")
	}
]
const EVENT_ID := "aurora_coast_sprint"
var race_route: Array[Vector3] = [
	Vector3(24, 0, -105),
	Vector3(96, 0, -127),
	Vector3(177, 0, -105),
	Vector3(238, 0, -47),
	Vector3(248, 0, 39),
	Vector3(201, 0, 105),
	Vector3(145, 0, 140),
	Vector3(61, 0, 146),
	Vector3(-18, 0, 119),
	Vector3(-94, 0, 71),
	Vector3(-116, 0, 6),
	Vector3(-82, 0, -75),
	Vector3(-18, 0, -64)
]
var world: AuroraWorld
var player: VelocityCar
var opponents: Array[VelocityCar] = []
var ui: VelocityInterface
var race_active := false
var race_countdown := false
var race_time := 0.0
var checkpoint_index := 0
var free_drive := false
var _quality := "HIGH"
var _weather := "CLEAR"
var _photo_mode := false


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_build_game()


func _build_game() -> void:
	world = AuroraWorld.new()
	world.name = "AuroraCoast"
	add_child(world)
	_quality = str(SaveData.settings.get("quality", "HIGH"))
	world.set_quality(_quality)
	ui = VelocityInterface.new()
	ui.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(ui)
	ui.drive_requested.connect(_enter_free_drive)
	ui.race_requested.connect(_start_race)
	ui.garage_requested.connect(_open_garage)
	ui.settings_requested.connect(_open_settings)
	ui.exit_requested.connect(func(): get_tree().quit())
	ui.continue_requested.connect(_resume_drive)
	ui.garage_pick.connect(_garage_pick)
	ui.upgrade_requested.connect(_install_upgrade)
	ui.quality_changed.connect(_settings_action)
	ui.photo_requested.connect(_toggle_photo)
	_spawn_player(SaveData.selected, Vector3(0, 0.92, 8), 0.0)
	ui.show_title(SaveData.credits, _selected_car_name(), SaveData.completed_events.size())
	_set_vehicles_frozen(true)


func _config_for(car_id: String) -> Dictionary:
	for item in CAR_CATALOG:
		if item.id == car_id:
			var result := item.duplicate()
			var stage := int(SaveData.upgrades.get(car_id, 0))
			result.power = float(result.power) * (1.0 + stage * 0.08)
			result.mass = float(result.mass) * (1.0 - stage * 0.012)
			result.handling = float(result.handling) * (1.0 + stage * 0.015)
			return result
	return CAR_CATALOG[0].duplicate()


func _spawn_player(car_id: String, at: Vector3, yaw: float) -> void:
	if is_instance_valid(player):
		player.queue_free()
	player = VelocityCar.new()
	player.name = "PlayerVehicle"
	player.setup(_config_for(car_id))
	player.position = at
	player.rotation.y = yaw
	add_child(player)
	if ui != null and free_drive:
		ui.show_hud(PackedVector3Array(race_route))


func _selected_car_name() -> String:
	return str(_config_for(SaveData.selected).get("name", "Asterion GT"))


func _enter_free_drive() -> void:
	if race_active:
		return
	free_drive = true
	if is_instance_valid(player):
		player.freeze = false
		player.set_player_enabled(true)
	_spawn_hud()


func _spawn_hud() -> void:
	ui.show_hud(PackedVector3Array(race_route))


func _resume_drive() -> void:
	if free_drive:
		_set_vehicles_frozen(false)
		if is_instance_valid(player):
			player.set_player_enabled(true)
		_spawn_hud()
	else:
		_enter_free_drive()


func _open_garage() -> void:
	_set_vehicles_frozen(true)
	var current_stage := int(SaveData.upgrades.get(SaveData.selected, 0))
	ui.show_garage(CAR_CATALOG, SaveData.owned, SaveData.selected, SaveData.credits, current_stage)


func _garage_pick(car_id: String) -> void:
	var is_owned: bool = SaveData.owned.has(car_id)
	if not is_owned:
		if not SaveData.own_car(car_id):
			_open_garage()
			return
	else:
		SaveData.selected = car_id
		SaveData.save_game()
	if is_instance_valid(player):
		var at := player.global_position + Vector3.UP * 0.12
		var yaw := player.rotation.y
		_spawn_player(car_id, at, yaw)
	_set_vehicles_frozen(true)
	_open_garage()


func _install_upgrade() -> void:
	var stage := int(SaveData.upgrades.get(SaveData.selected, 0))
	if stage >= 5 or SaveData.credits < 12000:
		_open_garage()
		return
	SaveData.credits -= 12000
	SaveData.upgrades[SaveData.selected] = stage + 1
	SaveData.save_game()
	if is_instance_valid(player):
		_spawn_player(SaveData.selected, player.global_position, player.rotation.y)
	_set_vehicles_frozen(true)
	_open_garage()


func _open_settings() -> void:
	_set_vehicles_frozen(true)
	ui.show_settings(_quality, str(SaveData.settings.get("units", "kmh")), _weather)


func _settings_action(value: String) -> void:
	if value == "UNITS":
		SaveData.settings["units"] = (
			"mph" if SaveData.settings.get("units", "kmh") == "kmh" else "kmh"
		)
		SaveData.save_game()
	elif value in ["LOW", "MEDIUM", "HIGH", "ULTRA"]:
		_quality = value
		SaveData.settings["quality"] = value
		SaveData.save_game()
		if world != null:
			world.set_quality(value)
	elif value == "WEATHER":
		_weather = "RAIN" if _weather == "CLEAR" else "CLEAR"
		if world != null:
			world.set_weather(_weather)
		if is_instance_valid(player):
			player.set_weather_state(_weather == "RAIN", world.is_night())
	_open_settings()


func _start_race() -> void:
	if race_active or race_countdown:
		return
	free_drive = true
	_clear_opponents()
	var start := Vector3(-18, 0.96, -65.0)
	var heading := -0.66
	_spawn_player(SaveData.selected, start, heading)
	player.linear_velocity = Vector3.ZERO
	player.angular_velocity = Vector3.ZERO
	player.freeze = true
	var configs: Array[Dictionary] = [
		{
			"id": "coast_rally",
			"name": "Vela RX",
			"drive": "AWD",
			"power": 310,
			"mass": 1295,
			"max_speed": 238,
			"handling": 1.13,
			"tone": 0.82,
			"paint": Color("#e0b547")
		},
		{
			"id": "aurora_gt",
			"name": "Asterion GT",
			"drive": "RWD",
			"power": 320,
			"mass": 1380,
			"max_speed": 278,
			"handling": 0.99,
			"tone": 1.0,
			"paint": Color("#43a9b2")
		}
	]
	for i in range(configs.size()):
		var opponent := VelocityCar.new()
		opponent.name = "FestivalRival%d" % (i + 1)
		opponent.setup(configs[i])
		opponent.position = start + Vector3(-4.2 if i == 0 else 4.2, 0, 3.4)
		opponent.rotation.y = heading
		add_child(opponent)
		opponent.set_ai_route(race_route, 0, 0.82 + 0.05 * i)
		opponent.freeze = true
		opponents.append(opponent)
	player.freeze = true
	race_countdown = true
	race_active = false
	checkpoint_index = 0
	race_time = 0.0
	ui.show_hud(PackedVector3Array(race_route))
	ui.set_race_state("GET READY  ·  AURORA COAST SPRINT", 0.0)
	_begin_countdown()


func _begin_countdown() -> void:
	await get_tree().create_timer(1.0).timeout
	if not race_countdown:
		return
	ui.set_race_state("3", 0.0)
	await get_tree().create_timer(1.0).timeout
	if not race_countdown:
		return
	ui.set_race_state("2", 0.0)
	await get_tree().create_timer(1.0).timeout
	if not race_countdown:
		return
	ui.set_race_state("1", 0.0)
	await get_tree().create_timer(1.0).timeout
	if not race_countdown:
		return
	race_countdown = false
	race_active = true
	player.freeze = false
	player.set_player_enabled(true)
	for opponent in opponents:
		opponent.freeze = false
	ui.set_race_state("GO!  ·  CHECKPOINT  01 / %02d" % race_route.size(), 0.04)


func _process(delta: float) -> void:
	if is_instance_valid(player):
		ui.update_drive(
			player.get_speed_kph(),
			player.rpm,
			0 if player.is_reversing else player.current_gear,
			player.global_position
		)
		player.set_weather_state(_weather == "RAIN", world.is_night())
		world.update_weather_anchor(player.global_position)
	if race_active and is_instance_valid(player):
		race_time += delta
		if (
			checkpoint_index < race_route.size()
			and player.global_position.distance_to(race_route[checkpoint_index]) < 15.0
		):
			checkpoint_index += 1
			if checkpoint_index >= race_route.size():
				_finish_race()
			else:
				ui.set_race_state(
					(
						"CHECKPOINT  %02d / %02d    ·    %02d:%05.2f"
						% [
							checkpoint_index + 1,
							race_route.size(),
							int(race_time / 60),
							fmod(race_time, 60.0)
						]
					),
					float(checkpoint_index) / race_route.size()
				)
		var remaining := (
			race_route[checkpoint_index]
			if checkpoint_index < race_route.size()
			else player.global_position
		)
		ui.set_navigation_target(remaining, player.global_position)
	if (
		free_drive
		and not race_active
		and not race_countdown
		and Input.is_action_just_pressed("pause_game")
	):
		_pause()
	if free_drive and Input.is_action_just_pressed("camera_next") and is_instance_valid(player):
		player.next_camera()


func _finish_race() -> void:
	race_active = false
	var rank := 1
	for rival in opponents:
		if rival.ai_laps > 0:
			rank += 1
	var reward := 12000 if rank == 1 else 7500
	SaveData.mark_event(EVENT_ID, race_time, reward)
	SaveData.save_game()
	_set_vehicles_frozen(true)
	ui.show_results(race_time, reward, rank, SaveData.credits)


func _pause() -> void:
	if _photo_mode:
		_toggle_photo()
	_set_vehicles_frozen(true)
	ui.show_pause()


func _toggle_photo() -> void:
	if not free_drive or race_active or not is_instance_valid(player):
		return
	_photo_mode = not _photo_mode
	player.set_photo_mode(_photo_mode)
	player.freeze = _photo_mode
	player.set_player_enabled(not _photo_mode)
	ui.set_photo_mode(_photo_mode)
	if _photo_mode:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		ui.show_photo_hint()
	else:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_M and free_drive and not race_active and not race_countdown:
			_pause()
		elif event.keycode == KEY_P and free_drive and not race_active:
			_toggle_photo()
		elif event.keycode == KEY_ESCAPE and _photo_mode:
			_toggle_photo()
	if event is InputEventMouseMotion and _photo_mode and is_instance_valid(player):
		player.adjust_photo_camera(event.relative)
	if (
		event is InputEventMouseButton
		and _photo_mode
		and event.pressed
		and is_instance_valid(player)
	):
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			player.zoom_photo(-0.45)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			player.zoom_photo(0.45)


func _set_vehicles_frozen(value: bool) -> void:
	if is_instance_valid(player):
		player.freeze = value
		if value:
			player.set_player_enabled(false)
	for rival in opponents:
		if is_instance_valid(rival):
			rival.freeze = value


func _clear_opponents() -> void:
	for rival in opponents:
		if is_instance_valid(rival):
			rival.queue_free()
	opponents.clear()


func _exit_tree() -> void:
	SaveData.save_game()
