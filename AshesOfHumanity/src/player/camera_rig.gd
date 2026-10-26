extends Node3D
class_name CameraRig
## Cinematic third-person over-the-shoulder rig with first-person toggle,
## camera collision, ADS zoom, configurable FOV/sensitivity and camera shake.

var spring: SpringArm3D
var camera: Camera3D
var first_person := false
var aiming := false
var base_fov := 75.0
var _shake := 0.0
var _shake_mag := 0.0
var _bob_t := 0.0
var yaw := 0.0
var pitch := -0.12
var recoil_offset := 0.0

func _ready() -> void:
	spring = SpringArm3D.new()
	spring.spring_length = 3.6
	spring.collision_mask = 1 << 0
	spring.position = Vector3(0, 1.65, 0)
	add_child(spring)
	camera = Camera3D.new()
	camera.fov = base_fov
	camera.near = 0.08
	camera.far = 600.0
	camera.position = Vector3(0.55, 0.15, 0)
	camera.current = true
	spring.add_child(camera)
	base_fov = SettingsStore.data.fov

func unhandled_input(event: InputEvent) -> void:
	if GameState.phase != GameState.PHASE_PLAYING:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var sens: float = SettingsStore.data.mouse_sensitivity * 0.0022
		yaw -= event.relative.x * sens
		pitch -= event.relative.y * sens * (-1.0 if SettingsStore.data.invert_y else 1.0)
		pitch = clampf(pitch, -1.35, 1.25)
	if event.is_action_pressed("toggle_view"):
		first_person = not first_person
		spring.spring_length = 0.2 if first_person else 3.6
		camera.position = Vector3.ZERO if first_person else Vector3(0.55, 0.15, 0)

func _process(delta: float) -> void:
	rotation.y = yaw
	spring.rotation.x = pitch
	var target_fov := base_fov * (0.72 if aiming else 1.0)
	camera.fov = lerpf(camera.fov, target_fov, delta * 10.0)
	# Camera shake with decay.
	if _shake > 0.0:
		_shake = max(0.0, _shake - delta * 2.2)
		var s := _shake_mag * _shake
		camera.h_offset = randf_range(-s, s)
		camera.v_offset = randf_range(-s, s)
	else:
		camera.h_offset = lerpf(camera.h_offset, 0.0, delta * 8.0)
		camera.v_offset = lerpf(camera.v_offset, 0.0, delta * 8.0)
	camera.h_offset += recoil_offset * 0.4
	recoil_offset = lerpf(recoil_offset, 0.0, delta * 9.0)

func add_bob(amount: float, delta: float) -> void:
	if not SettingsStore.data.head_bob or first_person:
		camera.v_offset = lerpf(camera.v_offset, 0.0, delta * 6.0)
		return
	_bob_t += delta * amount
	camera.v_offset = sin(_bob_t * 9.0) * 0.035 * clampf(amount, 0.0, 1.4)
	camera.h_offset += sin(_bob_t * 4.5) * 0.02 * clampf(amount, 0.0, 1.4)

func shake(strength: float, magnitude: float) -> void:
	if not SettingsStore.data.camera_shake:
		return
	_shake = max(_shake, strength)
	_shake_mag = max(_shake_mag, magnitude)

func add_recoil(amount: float) -> void:
	recoil_offset += amount
	spring.rotation.x = clampf(spring.rotation.x + amount * 0.5, -1.3, 1.2)

func aim_direction() -> Vector3:
	return camera.global_transform.basis.z * -1.0

func set_aim(v: bool) -> void:
	aiming = v
