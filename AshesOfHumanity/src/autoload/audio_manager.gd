extends Node
## Audio routing: pooled 2D/3D players, ambient loops, volume buses.
## All sounds are original synthesized WAVs under res://assets/audio.

const AUDIO_DIR := "res://assets/audio"
const POOL_SIZE := 24

var _streams: Dictionary = {}
var _pool3d: Array[AudioStreamPlayer3D] = []
var _pool2d: Array[AudioStreamPlayer] = []
var _ambient: AudioStreamPlayer = null
var _music: AudioStreamPlayer = null
var _radio: AudioStreamPlayer = null
var _loaded := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_buses()
	_load_streams()
	_build_pools()

func _load_buses() -> void:
	# Bus layout is created in code so a fresh project works without a
	# hand-authored default_bus_layout.tres.
	for bus in ["Master", "SFX", "Music", "Ambient"]:
		if AudioServer.get_bus_index(bus) == -1:
			AudioServer.add_bus()
			AudioServer.set_bus_name(AudioServer.bus_count - 1, bus)
	AudioServer.set_bus_send(AudioServer.get_bus_index("SFX"), "Master")
	AudioServer.set_bus_send(AudioServer.get_bus_index("Music"), "Master")
	AudioServer.set_bus_send(AudioServer.get_bus_index("Ambient"), "Master")
	_apply_volumes()
	SettingsStore.settings_changed.connect(_apply_volumes)

func _apply_volumes() -> void:
	AudioServer.set_bus_volume_db(0, linear_to_db(SettingsStore.data.master_volume))
	_set_bus("SFX", SettingsStore.data.sfx_volume)
	_set_bus("Music", SettingsStore.data.music_volume)
	_set_bus("Ambient", clampf(SettingsStore.data.sfx_volume * 0.9, 0.0, 1.0))

func _set_bus(name: String, lin: float) -> void:
	var idx := AudioServer.get_bus_index(name)
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, linear_to_db(max(lin, 0.001)))

func _load_streams() -> void:
	var dir := DirAccess.open(AUDIO_DIR)
	if dir == null:
		push_warning("Audio directory missing: " + AUDIO_DIR)
		return
	dir.list_dir_begin()
	var fn := dir.get_next()
	while fn != "":
		if fn.ends_with(".wav"):
			var res := load("%s/%s" % [AUDIO_DIR, fn])
			if res:
				_streams[fn.get_basename()] = res
		fn = dir.get_next()
	_loaded = true

func _build_pools() -> void:
	for i in POOL_SIZE:
		var p3 := AudioStreamPlayer3D.new()
		p3.bus = "SFX"
		p3.max_distance = 70.0
		p3.unit_size = 4.0
		add_child(p3)
		_pool3d.append(p3)
	for i in 12:
		var p2 := AudioStreamPlayer.new()
		p2.bus = "SFX"
		add_child(p2)
		_pool2d.append(p2)
	_ambient = AudioStreamPlayer.new()
	_ambient.bus = "Ambient"
	add_child(_ambient)
	_music = AudioStreamPlayer.new()
	_music.bus = "Music"
	add_child(_music)
	_radio = AudioStreamPlayer.new()
	_radio.bus = "Ambient"
	_radio.volume_db = -8.0
	add_child(_radio)

func play_2d(sound: String, volume_db: float = 0.0, pitch: float = 1.0) -> void:
	if not _streams.has(sound):
		return
	for p in _pool2d:
		if not p.playing:
			p.stream = _streams[sound]
			p.volume_db = volume_db
			p.pitch_scale = pitch
			p.play()
			return

func play_3d(sound: String, pos: Vector3, volume_db: float = 0.0,
		pitch: float = 1.0) -> Node:
	if not _streams.has(sound):
		return null
	for p in _pool3d:
		if not p.playing:
			p.stream = _streams[sound]
			p.global_position = pos
			p.volume_db = volume_db
			p.pitch_scale = pitch
			p.play()
			return p
	return null

func play_ambient(sound: String, fade: float = 1.2) -> void:
	if not _streams.has(sound):
		return
	if _ambient.stream == _streams[sound] and _ambient.playing:
		return
	var tw := create_tween()
	if _ambient.playing:
		tw.tween_property(_ambient, "volume_db", -40.0, fade)
		tw.tween_callback(func(): _ambient.stop())
	_ambient.stream = _streams[sound]
	_ambient.volume_db = -40.0
	_ambient.play()
	tw.tween_property(_ambient, "volume_db", -6.0, fade)

func play_music(sound: String, volume_db: float = -10.0) -> void:
	if not _streams.has(sound) or (_music.stream == _streams[sound] and _music.playing):
		return
	_music.stop()
	_music.stream = _streams[sound]
	_music.volume_db = volume_db
	_music.play()

func stop_music(fade: float = 0.8) -> void:
	var tw := create_tween()
	tw.tween_property(_music, "volume_db", -40.0, fade)
	tw.tween_callback(_music.stop)

func play_radio(active: bool) -> void:
	if active and _streams.has("radio_static"):
		_radio.stream = _streams["radio_static"]
		_radio.play()
	else:
		_radio.stop()

func on_weather(state: String) -> void:
	match state:
		Weather.RAIN, Weather.STORM:
			play_ambient("amb_rain")
		Weather.FOG, Weather.CLEAR, Weather.RADIATION:
			play_ambient("amb_wind")
