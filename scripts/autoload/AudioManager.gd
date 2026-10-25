extends Node

const BUS_MUSIC: String = "Music"
const BUS_SFX: String = "SFX"

var master_volume: float = 0.85
var music_volume: float = 0.58
var sfx_volume: float = 0.78
var muted: bool = false

var _streams: Dictionary = {}
var _sfx_pool: Array[AudioStreamPlayer] = []
var _pool_cursor: int = 0
var _ambient_player: AudioStreamPlayer
var _thruster_player: AudioStreamPlayer
var _mining_player: AudioStreamPlayer
var _current_ambient_key: String = ""
var _last_play_ms: Dictionary = {}
var _amb_tween: Tween = null

const AUDIO_FILES: Dictionary = {
	"amb_hangar": "res://assets/audio/amb_hangar_loop.wav",
	"amb_space": "res://assets/audio/amb_space_loop.wav",
	"thruster": "res://assets/audio/sfx_thruster_loop.wav",
	"mining_beam": "res://assets/audio/sfx_mining_loop.wav",
	"ui_hover": "res://assets/audio/sfx_ui_hover.wav",
	"ui_click": "res://assets/audio/sfx_ui_click.wav",
	"ui_back": "res://assets/audio/sfx_ui_back.wav",
	"ui_error": "res://assets/audio/sfx_ui_error.wav",
	"module_place": "res://assets/audio/sfx_module_place.wav",
	"module_remove": "res://assets/audio/sfx_module_remove.wav",
	"buy_upgrade": "res://assets/audio/sfx_buy_upgrade.wav",
	"pickup_resource": "res://assets/audio/sfx_pickup_resource.wav",
	"mg_shot": "res://assets/audio/sfx_mg_shot.wav",
	"laser_shot": "res://assets/audio/sfx_laser_shot.wav",
	"plasma_shot": "res://assets/audio/sfx_plasma_shot.wav",
	"rocket_launch": "res://assets/audio/sfx_rocket_launch.wav",
	"railgun_shot": "res://assets/audio/sfx_railgun_shot.wav",
	"shield_hit": "res://assets/audio/sfx_shield_hit.wav",
	"asteroid_break": "res://assets/audio/sfx_asteroid_break.wav",
	"explosion": "res://assets/audio/sfx_explosion.wav",
	"pack_open": "res://assets/audio/sfx_pack_open.wav",
	"card_flip": "res://assets/audio/sfx_card_flip.wav",
	"card_legendary": "res://assets/audio/sfx_card_legendary.wav",
}

const MIN_INTERVAL_MS: Dictionary = {
	"ui_hover": 75,
	"ui_click": 35,
	"pickup_resource": 55,
	"mg_shot": 45,
	"laser_shot": 55,
	"shield_hit": 65,
}

func _ready() -> void:
	_ensure_buses()
	_preload_streams()

	_ambient_player = AudioStreamPlayer.new()
	_ambient_player.bus = BUS_MUSIC
	add_child(_ambient_player)

	_thruster_player = AudioStreamPlayer.new()
	_thruster_player.bus = BUS_SFX
	_thruster_player.volume_db = -80.0
	add_child(_thruster_player)
	if _streams.has("thruster"):
		_thruster_player.stream = _streams["thruster"]

	_mining_player = AudioStreamPlayer.new()
	_mining_player.bus = BUS_SFX
	_mining_player.volume_db = -80.0
	add_child(_mining_player)
	if _streams.has("mining_beam"):
		_mining_player.stream = _streams["mining_beam"]

	for i in range(18):
		var p := AudioStreamPlayer.new()
		p.bus = BUS_SFX
		add_child(p)
		_sfx_pool.append(p)

	apply_volumes()

func _ensure_buses() -> void:
	if AudioServer.get_bus_index(BUS_MUSIC) == -1:
		var idx := AudioServer.bus_count
		AudioServer.add_bus(idx)
		AudioServer.set_bus_name(idx, BUS_MUSIC)
		AudioServer.set_bus_send(idx, "Master")
	if AudioServer.get_bus_index(BUS_SFX) == -1:
		var idx := AudioServer.bus_count
		AudioServer.add_bus(idx)
		AudioServer.set_bus_name(idx, BUS_SFX)
		AudioServer.set_bus_send(idx, "Master")

func _preload_streams() -> void:
	for k in AUDIO_FILES.keys():
		var path: String = AUDIO_FILES[k]
		if ResourceLoader.exists(path):
			var st := load(path)
			if st is AudioStreamWAV:
				if k in ["amb_hangar", "amb_space", "thruster", "mining_beam"]:
					st.loop_mode = AudioStreamWAV.LOOP_FORWARD
					st.loop_begin = 0
					st.loop_end = int(st.data.size() / 2)
			_streams[k] = st

func apply_volumes() -> void:
	AudioServer.set_bus_mute(0, muted)
	AudioServer.set_bus_volume_db(0, linear_to_db(maxf(0.0001, master_volume)))
	var m_idx := AudioServer.get_bus_index(BUS_MUSIC)
	if m_idx >= 0:
		AudioServer.set_bus_volume_db(m_idx, linear_to_db(maxf(0.0001, music_volume)))
	var s_idx := AudioServer.get_bus_index(BUS_SFX)
	if s_idx >= 0:
		AudioServer.set_bus_volume_db(s_idx, linear_to_db(maxf(0.0001, sfx_volume)))

func play_ambient(key: String) -> void:
	if _current_ambient_key == key and _ambient_player.playing:
		return
	if not _streams.has(key):
		return
	_current_ambient_key = key
	if _amb_tween and _amb_tween.is_running():
		_amb_tween.kill()
	_ambient_player.stream = _streams[key]
	_ambient_player.volume_db = -26.0
	_ambient_player.play()
	_amb_tween = create_tween()
	_amb_tween.tween_property(_ambient_player, "volume_db", -5.5, 0.75).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func play_sfx(key: String, pitch_jitter: float = 0.03, volume_linear: float = 0.85) -> void:
	if muted or not _streams.has(key) or _sfx_pool.is_empty():
		return
	var now_ms := Time.get_ticks_msec()
	var min_gap: int = int(MIN_INTERVAL_MS.get(key, 18))
	var prev_ms: int = int(_last_play_ms.get(key, -9999))
	if now_ms - prev_ms < min_gap:
		return
	_last_play_ms[key] = now_ms

	var p := _sfx_pool[_pool_cursor]
	_pool_cursor = (_pool_cursor + 1) % _sfx_pool.size()
	p.stream = _streams[key]
	var clamped_jitter := minf(0.05, pitch_jitter)
	p.pitch_scale = 1.0 + randf_range(-clamped_jitter, clamped_jitter)
	var base_gain := 0.55 if key == "ui_hover" else 0.88
	p.volume_db = linear_to_db(clampf(volume_linear * base_gain, 0.02, 1.15))
	p.play()

func set_thruster_intensity(intensity: float) -> void:
	var clamped := clampf(intensity, 0.0, 1.0)
	if clamped <= 0.02 or muted:
		if _thruster_player.playing:
			_thruster_player.stop()
		return
	if not _thruster_player.playing and _thruster_player.stream != null:
		_thruster_player.play()
	_thruster_player.volume_db = lerpf(-22.0, -5.0, clamped)
	_thruster_player.pitch_scale = lerpf(0.84, 1.16, clamped)

func set_thruster_active(active: bool, intensity: float = 1.0) -> void:
	set_thruster_intensity(intensity if active else 0.0)

func set_mining_beam_active(active: bool) -> void:
	if not active or muted:
		if _mining_player.playing:
			_mining_player.stop()
		return
	if not _mining_player.playing and _mining_player.stream != null:
		_mining_player.play()
	_mining_player.volume_db = -7.0

func set_mining_active(active: bool) -> void:
	set_mining_beam_active(active)

func stop_loops() -> void:
	if _thruster_player and _thruster_player.playing:
		_thruster_player.stop()
	if _mining_player and _mining_player.playing:
		_mining_player.stop()
