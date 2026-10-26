extends BaseScreen
class_name SettingsUI

func _init() -> void:
	super._init("SettingsUI")

func title_text() -> String:
	return "Settings"

func _build_body() -> void:
	var v := _scroll_column()
	var d: Dictionary = SettingsStore.data
	for pair in [["master_volume", "Master Volume", 0.0, 1.0, 0.01],
			["sfx_volume", "Effects Volume", 0.0, 1.0, 0.01],
			["music_volume", "Music Volume", 0.0, 1.0, 0.01],
			["mouse_sensitivity", "Mouse Sensitivity", 0.05, 1.0, 0.01],
			["fov", "Field of View", 60.0, 100.0, 1.0]]:
		v.add_child(_slider_row(pair[0], pair[1], pair[2], pair[3], pair[4], d))
	for pair in [["invert_y", "Invert Vertical Look"],
			["head_bob", "Head Bob"],
			["camera_shake", "Camera Shake"],
			["vsync", "V-Sync"]]:
		v.add_child(_check_row(pair[0], pair[1], d))
	var quality_row := HBoxContainer.new()
	quality_row.add_child(UiTheme.label("Quality Preset", 16, UiTheme.TEXT,
		HORIZONTAL_ALIGNMENT_LEFT))
	var opt := OptionButton.new()
	for preset in SettingsStore.QUALITY_PRESETS.keys():
		opt.add_item(preset)
	opt.select(opt.get_item_index(SettingsStore.data.quality) \
		if opt.has_item(SettingsStore.data.quality) else 0)
	opt.item_selected.connect(func(i):
		SettingsStore.set_value("quality", opt.get_item_text(i))
		SettingsStore.apply_all())
	quality_row.add_child(opt)
	v.add_child(quality_row)
	var save := UiTheme.button("Save and Apply")
	save.pressed.connect(func():
		SettingsStore.save_settings()
		SettingsStore.apply_all()
		QuestMan.toast.emit("Settings saved"))
	v.add_child(save)

func _slider_row(key: String, label_text: String, lo: float, hi: float,
		step: float, d: Dictionary) -> Control:
	var row := VBoxContainer.new()
	var head := HBoxContainer.new()
	var l := UiTheme.label(label_text, 15)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var val := UiTheme.label(str(d.get(key, 0.5)), 14, UiTheme.ACCENT_COLD)
	head.add_child(l)
	head.add_child(val)
	row.add_child(head)
	var slider := HSlider.new()
	slider.min_value = lo
	slider.max_value = hi
	slider.step = step
	slider.value = float(d.get(key, 0.5))
	slider.value_changed.connect(func(vv):
		SettingsStore.set_value(key, vv)
		val.text = "%.2f" % vv
		if key == "fov" and GameState.player:
			GameState.player.cam_rig.base_fov = vv
		SettingsStore.apply_all())
	row.add_child(slider)
	return row

func _check_row(key: String, label_text: String, d: Dictionary) -> Control:
	var row := HBoxContainer.new()
	var l := UiTheme.label(label_text, 15)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var check := CheckBox.new()
	check.button_pressed = bool(d.get(key, false))
	check.toggled.connect(func(vv): SettingsStore.set_value(key, vv))
	row.add_child(l)
	row.add_child(check)
	return row
