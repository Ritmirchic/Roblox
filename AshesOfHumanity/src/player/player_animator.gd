extends Node3D
class_name PlayerAnimator
## Procedural humanoid animation: gait cycles, crouch pose, weapon arms and
## hit reactions — driven entirely by movement state, no imported clips.

var rig: Node3D
var pivots: Dictionary = {}
var t := 0.0
var swing := 0.0
var reaction := 0.0
var crouch_blend := 0.0
var model_scale := 1.0

func setup(model_root: Node3D) -> void:
	rig = model_root
	for mi in rig.find_children("*", "MeshInstance3D", true, false):
		var n: String = mi.name
		for key in ["arm_l", "arm_r", "leg_l", "leg_r", "head", "torso"]:
			if n.ends_with(key) or n.find("_" + key) >= 0:
				var pivot := Node3D.new()
				pivot.name = "pivot_" + key
				var wt: Transform3D = mi.global_transform
				mi.get_parent().add_child(pivot)
				pivot.global_transform = wt
				mi.reparent(pivot)
				mi.position = Vector3.ZERO
				pivots[key] = pivot
				break

func animate(delta: float, speed_ratio: float, is_crouch: bool,
		is_aiming: bool, is_sprinting: bool) -> void:
	t += delta
	reaction = max(0.0, reaction - delta * 2.5)
	crouch_blend = lerpf(crouch_blend, 1.0 if is_crouch else 0.0, delta * 8.0)
	var freq := 11.0 if is_sprinting else 7.5
	var target_swing := sin(t * freq) * 0.85 * clampf(speed_ratio, 0.0, 1.5)
	swing = lerpf(swing, target_swing, delta * 10.0)
	var bob_y := absf(sin(t * freq)) * 0.06 * clampf(speed_ratio, 0.0, 1.4)
	rig.position.y = -crouch_blend * 0.55 + bob_y
	if pivots.has("leg_l"):
		pivots.leg_l.rotation.x = swing
	if pivots.has("leg_r"):
		pivots.leg_r.rotation.x = -swing
	var arm_pose := -0.55 if is_aiming else (-swing * 0.7)
	if pivots.has("arm_r"):
		pivots.arm_r.rotation.x = lerp(pivots.arm_r.rotation.x,
			arm_pose + (0.25 if is_aiming else 0.0), delta * 12.0)
	if pivots.has("arm_l"):
		pivots.arm_l.rotation.x = lerp(pivots.arm_l.rotation.x,
			(arm_pose * 0.8) if is_aiming else swing * 0.7, delta * 12.0)
	if pivots.has("torso"):
		pivots.torso.rotation.x = crouch_blend * 0.25 + reaction * 0.2
	if pivots.has("head"):
		pivots.head.rotation.y = sin(t * 0.8) * 0.08

func hit_reaction() -> void:
	reaction = 1.0
