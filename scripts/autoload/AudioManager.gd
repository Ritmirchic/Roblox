extends Node

var master_volume: float = 0.85
var music_volume: float = 0.65
var sfx_volume: float = 0.85
var muted: bool = false

var _clips: Dictionary = {}
var _sfx_pool: Array[AudioStreamPlayer] = []
var _amb_player: AudioStreamPlayer
var _thruster_player: AudioStreamPlayer
var _mining_player: AudioStreamPlayer
var _current_amb: String = ""

const CLIP_FILES: Dictionary = {
	"amb_hangar": "res://assets/audio/amb_hangar_loop.wav",
	"amb_space": "res://assets/audio/amb_space_loop.wav",
	"thruster": "res://assets/audio/sfx_thruster_loop.wav",
	"mining": "res://assets/audio/sfx_mining_loop.wav",
	"ui_hover": "res://assets/audio/sfx_ui_hover.wav",
	"ui_click": "res://assets/audio/sfx_ui_click.wav",
	"ui_back": "res://assets/audio/sfx_ui_back.wav",
	"ui_error": "res://assets/audio/sfx_ui_error.wav",
	"module_place": "res://assets/audio/sfx_module_place.wav",
	"module_remove": "res://assets/audio/sfx_module_remove.wav",
	"buy_upgrade": "res://assets/audio/sfx_buy_upgrade.wav",
	"asteroid_break": "res://assets/audio/sfx_asteroid_break.wav",
	"pickup": "res://assets/audio/sfx_pickup_resource.wav",
	"mg_shot": "res://assets/audio/sfx_mg_shot.wav",
	"laser_shot": "res://assets/audio/sfx_laser_shot.wav",
	"plasma_shot": "res://assets/audio/sfx_plasma_shot.wav",
	"rocket_launch": "res://assets/audio/sfx_rocket_launch.wav",
	"railgun_shot": "res://assets/audio/sfx_railgun_shot.wav",
	"shield_hit": "res://assets/audio/sfx_shield_hit.wav",
	"explosion": "res://assets/audio/sfx_explosion.wav",
	"pack_open": "res://assets/audio/sfx_pack_open.wav",
	"card_flip": "res://assets/audio/sfx_card_flip.wav",
	"card_legendary": "res://assets/audio/sfx_card_legendary.wav",
}

func _ready() -> void:
	for key in CLIP_FILES.keys():
		var path: String = CLIP_FILES[key]
		if ResourceLoader.exists(path):
			var stream := load(path)
			if stream is AudioStreamWAV and key in ["amb_hangar", "amb_space", "thruster", "mining"]:
				var wav := stream as AudioStreamWAV
				wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
				wav.loop_begin = 0
				wav.loop_end = int(wav.data.size() / 2)
			_clips[key] = stream

	_amb_player = AudioStreamPlayer.new()
	add_child(_amb_player)

	_thruster_player = AudioStreamPlayer.new()
	if _clips.has("thruster"):
		_thruster_player.stream = _clips["thruster"]
	add_child(_thruster_player)

	_mining_player = AudioStreamPlayer.new()
	if _clips.has("mining"):
		_mining_player.stream = _clips["mining"]
	add_child(_mining_player)

	for _i in range(14):
		var p := AudioStreamPlayer.new()
		add_child(p)
		_sfx_pool.append(p)

	apply_volumes()

func _lin_to_db(v: float) -> float:
	if muted or v <= 0.001:
		return -80.0
	return linear_to_db(clampf(v, 0.001, 1.5))

func apply_volumes() -> void:
	if _amb_player:
		_amb_player.volume_db = _lin_to_db(master_volume * music_volume * 0.65)
	if _thruster_player:
		_thruster_player.volume_db = _lin_to_db(master_volume * sfx_volume * 0.45)
	if _mining_player:
		_mining_player.volume_db = _lin_to_db(master_volume * sfx_volume * 0.50)

func play_ambient(key: String) -> void:
	if _current_amb == key and _amb_player.playing:
		return
	_current_amb = key
	if _clips.has(key):
		_amb_player.stream = _clips[key]
		apply_volumes()
		_amb_player.play()

func play_sfx(key: String, pitch_jitter: float = 0.05, vol_scale: float = 1.0) -> void:
	if muted or not _clips.has(key):
		return
	for p in _sfx_pool:
		if not p.playing:
			p.stream = _clips[key]
			p.pitch_scale = randf_range(1.0 - pitch_jitter, 1.0 + pitch_jitter)
			p.volume_db = _lin_to_db(master_volume * sfx_volume * vol_scale)
			p.play()
			return

func set_thruster_active(active: bool, throttle_ratio: float = 0.5) -> void:
	if muted or not _thruster_player.stream:
		if _thruster_player.playing:
			_thruster_player.stop()
		return
	if active:
		_thruster_player.pitch_scale = lerpf(0.82, 1.32, clampf(throttle_ratio, 0.0, 1.0))
		_thruster_player.volume_db = _lin_to_db(master_volume * sfx_volume * lerpf(0.18, 0.55, clampf(throttle_ratio, 0.0, 1.0)))
		if not _thruster_player.playing:
			_thruster_player.play()
	elif _thruster_player.playing:
		_thruster_player.stop()

func set_mining_active(active: bool) -> void:
	if muted or not _mining_player.stream:
		if _mining_player.playing:
			_mining_player.stop()
		return
	if active:
		apply_volumes()
		if not _mining_player.playing:
			_mining_player.play()
	elif _mining_player.playing:
		_mining_player.stop()

func stop_loops() -> void:
	if _thruster_player and _thruster_player.playing:
		_thruster_player.stop()
	if _mining_player and _mining_player.playing:
		_mining_player.stop()
