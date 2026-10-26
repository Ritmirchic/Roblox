extends Node3D
## Builds and owns a play session: environment, sky, world, player, weather,
## events and HUD. Used both for new games and loaded saves.

var world: WorldGenerator
var player: Survivor
var sun: DirectionalLight3D
var env: Environment
var sky: ProceduralSkyMaterial
var weather_fx: Node3D
var hud: CanvasLayer
var builder: BaseBuilder
var generation_time := 0.0

func _ready() -> void:
	GameState.set_phase(GameState.PHASE_PLAYING)
	_build_environment()
	_build_world()
	_spawn_player()
	_bind_managers()
	_build_hud()
	# First story quest starts automatically.
	if QuestMan.can_accept("m01_awaken"):
		QuestMan.accept("m01_awaken")
	if QuestMan.can_accept("s01_lost_supplies"):
		QuestMan.accept("s01_lost_supplies")
	QuestMan.marker_added.connect(func(_m): world._refresh_markers())
	QuestMan.quest_completed.connect(func(_q): world._refresh_markers())
	print("[AoH] Session ready in %.1fs" % generation_time)

func _build_environment() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	sky = ProceduralSkyMaterial.new()
	sky.sky_top_color = Color(0.28, 0.42, 0.62)
	sky.sky_horizon_color = Color(0.62, 0.68, 0.72)
	sky.ground_bottom_color = Color(0.08, 0.08, 0.07)
	sky.ground_horizon_color = Color(0.5, 0.52, 0.55)
	var sky_res := Sky.new()
	sky_res.sky_material = sky
	env.sky = sky_res
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.6
	env.fog_enabled = true
	env.fog_density = 0.008
	env.fog_aerial_perspective = 0.6
	env.fog_light_color = Color(0.6, 0.62, 0.65)
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.05
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.08
	env.adjustment_saturation = 0.92
	we.environment = env
	SettingsStore.apply_environment(env)
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 180.0
	sun.light_energy = 1.1
	sun.rotation_degrees = Vector3(-35, -35, 0)
	add_child(sun)
	weather_fx = Node3D.new()
	weather_fx.name = "WeatherFX"
	add_child(weather_fx)

func _build_world() -> void:
	var t0 := Time.get_ticks_msec()
	world = WorldGenerator.new()
	world.name = "World"
	add_child(world)
	world.generate(GameState.world_seed)
	generation_time = (Time.get_ticks_msec() - t0) / 1000.0

func _spawn_player() -> void:
	player = Survivor.new()
	var spawn := _shelter_spawn()
	player.position = spawn + Vector3(0, 0.2, 0)
	add_child(player)
	# Reveal the starting region.
	GameState.discovered_locations["suburbs"] = true
	GameState.current_region_id = "suburbs"
	_spawn_npcs()
	builder = BaseBuilder.new()
	add_child(builder)
	builder.setup(player, world)

func _spawn_npcs() -> void:
	var shelter := [
		["vera", "Vera Marsh", Vector3(-208, 0, 82)],
		["elena", "Dr. Elena Vasquez", Vector3(-212, 0, 88)],
		["boris", "Boris Volkov", Vector3(-204, 0, 86)],
		["mara", "Mara Okafor", Vector3(-218, 0, 84)],
		["kovac", "Sergeant Kovac", Vector3(-206, 0, 76)],
		["petrovich", "Petrovich", Vector3(-214, 0, 72)],
		["dr_lesnik", "Dr. Lesnik", Vector3(-222, 0, 80)],
	]
	for entry in shelter:
		var n := Npc.make(entry[0], entry[1])
		var p: Vector3 = entry[2]
		n.position = Vector3(p.x, world.height_at(p.x, p.z), p.z)
		add_child(n)
	var chen := Npc.make("survivor_watchtower", "Lookout Chen")
	chen.position = Vector3(-120, world.height_at(-120, -200), -200)
	add_child(chen)

func _shelter_spawn() -> Vector3:
	for lm in RegionData.landmarks():
		if lm.id == "shelter_exit":
			return Vector3(lm.pos.x,
				world.height_at(lm.pos.x, lm.pos.z) + 0.2, lm.pos.z + 3.0)
	return Vector3(-210, 0.5, 82)

func _bind_managers() -> void:
	WorldClock.bind(sun, env, sky)
	WorldClock.set_time(8.0)
	Weather.bind(env, weather_fx)
	Weather.set_state(Weather.CLEAR)
	EventMan.bind(world)
	AudioMan.play_ambient("amb_wind")

func _build_hud() -> void:
	var factory := preload("res://src/ui/ui_factory.gd")
	hud = factory.create_hud(player)
	add_child(hud)
	UIRouter.register_hud(hud)
	UIRouter.set_screen_factory(Callable(factory, "create_screen"))
	player.died.connect(func():
		await get_tree().create_timer(1.6).timeout
		UIRouter.open("DeathUI"))
	QuestMan.quest_completed.connect(_on_quest_completed)
	_apply_pending_save()

func _apply_pending_save() -> void:
	var pending := SaveMan.take_pending()
	if pending.is_empty():
		return
	var player_data: Dictionary = pending.get("player", {})
	if not player_data.is_empty():
		player.apply_saved(player_data)
		var p: Array = player_data.get("position", [])
		if p.size() == 3:
			player.global_position = Vector3(p[0], p[1], p[2])
			player.rotation.y = float(player_data.get("rotation_y", 0.0))
	if not GameState.world_buildings.is_empty():
		builder.restore_all(world)
	hud.show_toast("Save loaded")

func _on_quest_completed(quest: Dictionary) -> void:
	if quest.id == "m17_final":
		UIRouter.open("VictoryUI")

func _process(delta: float) -> void:
	if GameState.phase == GameState.PHASE_PLAYING:
		EventMan.tick(delta)
		_update_region()

func _update_region() -> void:
	if player == null:
		return
	var r := RegionData.region_at(player.global_position)
	if not r.is_empty() and r.id != GameState.current_region_id:
		GameState.current_region_id = r.id
		GameState.discovered_locations[r.id] = true
		Weather.region_temp_mod = float(r.get("temp_mod", 0.0))
		if hud and hud.has_method("show_toast"):
			hud.show_toast(r.name)
		AudioMan.play_2d("ui_click", -6.0)

func unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if GameState.phase == GameState.PHASE_PLAYING:
			UIRouter.open("PauseUI")
		elif UIRouter.is_open("PauseUI"):
			UIRouter.close("PauseUI")
	if event.is_action_pressed("inventory"):
		UIRouter.toggle("InventoryUI")
	if event.is_action_pressed("journal"):
		UIRouter.toggle("JournalUI")
	if event.is_action_pressed("map"):
		UIRouter.toggle("MapUI")
	if event.is_action_pressed("character"):
		UIRouter.toggle("CharacterUI")
	if event.is_action_pressed("crafting"):
		UIRouter.toggle("CraftingUI")
	if event.is_action_pressed("build_menu"):
		UIRouter.toggle("BuildUI")
	if event.is_action_pressed("quick_save"):
		SaveMan.save_game(1)
		hud.show_toast("Game saved")
	if event.is_action_pressed("quick_load") and SaveMan.has_save(1):
		SaveMan.load_game(1)
