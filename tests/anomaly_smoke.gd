extends SceneTree

const WorldScript = preload("res://scripts/world_builder.gd")
const PlayerScript = preload("res://scripts/player_controller.gd")
const AudioScript = preload("res://scripts/audio_director.gd")
const EntityScript = preload("res://scripts/entity_ai.gd")
const AnomalyScript = preload("res://scripts/anomaly_director.gd")


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var root := get_root()
	var world = WorldScript.new()
	root.add_child(world)
	world.build()
	var report: Dictionary = world.validate_layout()
	assert(report["valid"], "World validation failed: %s" % str(report["checks"]))
	var audio = AudioScript.new()
	root.add_child(audio)
	var player = PlayerScript.new()
	root.add_child(player)
	var actors: Dictionary = {}
	for kind in ["observer", "listener", "imitator"]:
		var actor = EntityScript.new()
		actor.entity_kind = kind
		root.add_child(actor)
		actors[kind] = actor
	var director = AnomalyScript.new()
	root.add_child(director)
	director.setup(world, player, audio, actors)
	assert(director.catalog().size() == 30, "The catalog must expose exactly 30 anomalies")
	var completed := 0
	for anomaly_id in range(1, 31):
		director.begin(anomaly_id)
		assert(director.is_active, "Anomaly %d did not activate" % anomaly_id)
		assert(
			director.active_id == anomaly_id, "Anomaly %d has an incorrect runtime ID" % anomaly_id
		)
		await process_frame
		director.clear()
		assert(not director.is_active, "Anomaly %d did not reset" % anomaly_id)
		completed += 1
	print("PASS: world connectivity, 30/30 anomaly activations, and 30/30 anomaly resets")
	print("PASS: custom player, audio, three entity actors, and door systems instantiate")
	assert(completed == 30)
	quit(0)
