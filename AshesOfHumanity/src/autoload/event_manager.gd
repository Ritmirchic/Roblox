extends Node
## Random world events that run on understandable rules and feed the HUD/map.

signal event_started(ev: Dictionary)
signal event_ended(ev: Dictionary)
signal broadcast(text: String)

const EVENT_TYPES := ["supply_drop", "migration", "broadcast", "power_failure",
	"shelter_attack", "distorted_signal"]

var active_events: Array[Dictionary] = []
var _cooldown := 180.0
var _world: Node = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func bind(world: Node) -> void:
	_world = world

func _process(delta: float) -> void:
	if GameState.phase != GameState.PHASE_PLAYING:
		return
	_cooldown -= delta
	if _cooldown <= 0.0:
		_cooldown = randf_range(150.0, 320.0)
		_start_random()

func _start_random() -> void:
	var kind: String = EVENT_TYPES.pick_random()
	match kind:
		"supply_drop":
			_start_supply_drop()
		"migration":
			_start_migration()
		"broadcast":
			broadcast.emit(_random_broadcast())
		"power_failure":
			_start_power_failure()
		"shelter_attack":
			if GameState.get_story_flag("base_built"):
				_start_shelter_attack()
			else:
				_start_supply_drop()
		"distorted_signal":
			broadcast.emit("[STATIC] ...the frequency bends beneath the noise... "
				+ "something repeats your name. [/STATIC]")

func _start_supply_drop() -> void:
	if _world == null or GameState.player == null:
		return
	var origin: Vector3 = GameState.player.global_position
	var pos: Vector3 = origin + Vector3(randf_range(-60, 60), 0, randf_range(-60, 60))
	var ev := {"type": "supply_drop", "pos": pos, "t": 90.0,
		"label": "Supply drop beacon"}
	active_events.append(ev)
	event_started.emit(ev)
	_world.spawn_supply_crate(pos)
	broadcast.emit("Military supply drop detected on your map.")

func _start_migration() -> void:
	if _world == null:
		return
	var ev := {"type": "migration", "t": 75.0, "label": "Mutant migration"}
	active_events.append(ev)
	event_started.emit(ev)
	_world.spawn_migration(4 + randi() % 4)
	broadcast.emit("Seismic tremors... a pack is moving nearby.")

func _start_power_failure() -> void:
	var ev := {"type": "power_failure", "t": 60.0, "label": "Grid fluctuation"}
	active_events.append(ev)
	event_started.emit(ev)
	if _world:
		_world.set_lights_enabled(false)
	var tw := get_tree().create_timer(ev.t)
	await tw.timeout
	if _world:
		_world.set_lights_enabled(true)
	event_ended.emit(ev)

func _start_shelter_attack() -> void:
	var ev := {"type": "shelter_attack", "t": 80.0, "label": "Shelter under attack"}
	active_events.append(ev)
	event_started.emit(ev)
	if _world:
		_world.assault_base(5 + randi() % 4)
	broadcast.emit("Hostiles are converging on your shelter!")

func tick(delta: float) -> void:
	for ev in active_events.duplicate():
		ev.t -= delta
		if ev.t <= 0.0:
			active_events.erase(ev)
			event_ended.emit(ev)

func _random_broadcast() -> String:
	var lines := [
		"Unknown transmission: '...do not trust the quiet hours...'",
		"Automated beacon: 'Shelter 7 filtration cycle failed.'",
		"Distress call repeats every 40 seconds. No one answers.",
		"Pre-war weather service warns of an ionized front.",
		"'...if you can hear this, the Last Signal is still broadcasting.'",
	]
	return lines.pick_random()
