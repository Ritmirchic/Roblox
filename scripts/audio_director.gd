class_name AudioDirector
extends Node

var ambient: AudioStreamPlayer
var _ambient_started := false


func _ready() -> void:
	ambient = AudioStreamPlayer.new()
	ambient.name = "ApartmentTone"
	ambient.stream = load("res://assets/audio/ambience.wav")
	ambient.volume_db = -24.0
	add_child(ambient)
	ambient.finished.connect(_restart_ambient)
	ambient.play()
	_ambient_started = true


func _restart_ambient() -> void:
	if _ambient_started and is_instance_valid(ambient):
		ambient.play()


func play_at(
	cue: String, position: Vector3, volume_db: float = -8.0, max_distance: float = 28.0
) -> AudioStreamPlayer3D:
	var path := "res://assets/audio/%s.wav" % cue
	if not ResourceLoader.exists(path):
		push_warning("Missing audio cue: " + cue)
		return null
	var player := AudioStreamPlayer3D.new()
	player.name = "Cue_" + cue
	player.stream = load(path)
	player.position = position
	player.volume_db = volume_db
	player.max_distance = max_distance
	player.attenuation_model = AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
	add_child(player)
	player.finished.connect(player.queue_free)
	player.play()
	return player


func play_ui(cue: String, volume_db: float = -10.0) -> void:
	var path := "res://assets/audio/%s.wav" % cue
	if not ResourceLoader.exists(path):
		return
	var player := AudioStreamPlayer.new()
	player.stream = load(path)
	player.volume_db = volume_db
	add_child(player)
	player.finished.connect(player.queue_free)
	player.play()


func set_suspended(suspended: bool) -> void:
	for child in get_children():
		if child is AudioStreamPlayer:
			child.stream_paused = suspended
		elif child is AudioStreamPlayer3D:
			child.stream_paused = suspended


func set_master(value: float) -> void:
	var db := linear_to_db(maxf(value, 0.001))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), db)
