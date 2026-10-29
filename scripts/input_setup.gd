extends RefCounted


static func configure_gamepad() -> void:
	_add_axis("accelerate", JOY_AXIS_TRIGGER_RIGHT, 1.0)
	_add_axis("brake", JOY_AXIS_TRIGGER_LEFT, 1.0)
	_add_axis("steer_left", JOY_AXIS_LEFT_X, -1.0)
	_add_axis("steer_right", JOY_AXIS_LEFT_X, 1.0)
	_add_button("handbrake", JOY_BUTTON_A)
	_add_button("change_camera", JOY_BUTTON_Y)
	_add_button("reset_car", JOY_BUTTON_B)
	_add_button("world_map", JOY_BUTTON_BACK)
	_add_button("ui_cancel", JOY_BUTTON_START)
	_add_button("shift_up", JOY_BUTTON_RIGHT_SHOULDER)
	_add_button("shift_down", JOY_BUTTON_LEFT_SHOULDER)


static func _add_axis(action: StringName, axis_id: int, direction: float) -> void:
	var event := InputEventJoypadMotion.new()
	event.axis = axis_id
	event.axis_value = direction
	InputMap.action_add_event(action, event)


static func _add_button(action: StringName, button_id: int) -> void:
	var event := InputEventJoypadButton.new()
	event.button_index = button_id
	InputMap.action_add_event(action, event)
