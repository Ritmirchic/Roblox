class_name VelocityInterface
extends CanvasLayer

signal drive_requested
signal race_requested
signal garage_requested
signal settings_requested
signal exit_requested
signal continue_requested
signal garage_pick(car_id: String)
signal upgrade_requested
signal photo_requested
signal quality_changed(value: String)

const INK := Color("#101c25")
const PANEL := Color(0.035, 0.075, 0.09, 0.94)
const GOLD := Color("#e8bc70")
const TEAL := Color("#57d2c8")
const WHITE := Color("#f2f1e8")
var root: Control
var hud_root: Control
var speed_label: Label
var speed_unit_label: Label
var gear_label: Label
var rpm_bar: ProgressBar
var race_progress: ProgressBar
var race_label: Label
var navigation_label: Label
var district_label: Label
var credit_label: Label
var radar: CoastRadar
var active_overlay: Control
var _route := PackedVector3Array()


func _ready() -> void:
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)


func _panel(
	parent: Control, position: Vector2, size: Vector2, color := PANEL, radius := 4
) -> PanelContainer:
	var p := PanelContainer.new()
	p.position = position
	p.size = size
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.border_color = Color(0.42, 0.7, 0.69, 0.2)
	style.set_border_width_all(1)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 9
	style.content_margin_bottom = 9
	p.add_theme_stylebox_override("panel", style)
	parent.add_child(p)
	return p


func _label(
	parent: Control,
	text: String,
	size: int = 18,
	color := WHITE,
	position := Vector2.ZERO,
	box := Vector2.ZERO
) -> Label:
	var l := Label.new()
	l.text = text
	l.position = position
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if box != Vector2.ZERO:
		l.size = box
	parent.add_child(l)
	return l


func _button(
	parent: Control, text: String, position: Vector2, size := Vector2(340, 58), accent := false
) -> Button:
	var b := Button.new()
	b.text = text
	b.position = position
	b.custom_minimum_size = size
	b.size = size
	b.add_theme_font_size_override("font_size", 18)
	b.add_theme_color_override("font_color", WHITE if accent else Color("#c4d0ce"))
	b.add_theme_color_override("font_hover_color", WHITE)
	var normal := StyleBoxFlat.new()
	normal.bg_color = Color(0.13, 0.28, 0.31, 0.94) if accent else Color(0.08, 0.14, 0.17, 0.94)
	normal.border_color = TEAL if accent else Color(0.38, 0.53, 0.55, 0.35)
	normal.set_border_width_all(1)
	normal.corner_radius_top_left = 3
	normal.corner_radius_top_right = 3
	normal.corner_radius_bottom_left = 3
	normal.corner_radius_bottom_right = 3
	var hover := normal.duplicate()
	hover.bg_color = Color(0.17, 0.36, 0.38, 1)
	hover.border_color = GOLD
	var pressed := normal.duplicate()
	pressed.bg_color = Color(0.22, 0.34, 0.35, 1)
	b.add_theme_stylebox_override("normal", normal)
	b.add_theme_stylebox_override("hover", hover)
	b.add_theme_stylebox_override("pressed", pressed)
	b.add_theme_stylebox_override("focus", hover)
	parent.add_child(b)
	return b


func _clear_overlay() -> Control:
	if is_instance_valid(active_overlay):
		active_overlay.queue_free()
	active_overlay = Control.new()
	active_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	active_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(active_overlay)
	var shade := ColorRect.new()
	shade.color = Color(0.018, 0.038, 0.05, 0.86)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	active_overlay.add_child(shade)
	return active_overlay


func _header(parent: Control, eyebrow: String, title: String, subtitle: String) -> void:
	_label(parent, eyebrow.to_upper(), 13, TEAL, Vector2(105, 93), Vector2(530, 28))
	_label(parent, title, 50, WHITE, Vector2(101, 120), Vector2(790, 74))
	_label(parent, subtitle, 17, Color("#b5c7c5"), Vector2(105, 202), Vector2(720, 54))


func show_title(credits: int, car_name: String, completed: int) -> void:
	var page := _clear_overlay()
	var wash := ColorRect.new()
	wash.color = Color(0.02, 0.055, 0.075, 0.36)
	wash.size = Vector2(650, 900)
	wash.position = Vector2(950, 0)
	page.add_child(wash)
	_label(page, "HORIZON  /  VELOCITY", 15, GOLD, Vector2(86, 43), Vector2(330, 28))
	_label(
		page,
		"AURORA COAST  ·  OPEN ROAD FESTIVAL",
		12,
		Color("#a7bfbd"),
		Vector2(87, 75),
		Vector2(380, 24)
	)
	_label(page, "HORIZON", 65, WHITE, Vector2(92, 222), Vector2(630, 83))
	_label(page, "VELOCITY", 65, GOLD, Vector2(92, 298), Vector2(630, 83))
	_label(page, "The road is yours.", 24, Color("#d4dfda"), Vector2(98, 400), Vector2(520, 40))
	_label(
		page,
		"COASTAL ROADS  /  FESTIVAL SPRINT  /  FREE ROAM",
		13,
		TEAL,
		Vector2(98, 451),
		Vector2(620, 28)
	)
	var separator := ColorRect.new()
	separator.color = Color(0.45, 0.69, 0.68, 0.35)
	separator.position = Vector2(98, 498)
	separator.size = Vector2(460, 1)
	page.add_child(separator)
	_label(page, "YOUR GARAGE", 11, Color("#9db2b2"), Vector2(98, 526), Vector2(160, 22))
	_label(page, car_name.to_upper(), 20, WHITE, Vector2(98, 550), Vector2(350, 30))
	_label(
		page,
		"CREDITS   %s     ·     EVENTS WON   %d" % ["%08d" % credits, completed],
		14,
		GOLD,
		Vector2(98, 593),
		Vector2(490, 26)
	)
	var right_x := 1075.0
	_label(page, "AURORA VELOCITY FESTIVAL", 12, TEAL, Vector2(right_x, 178), Vector2(390, 24))
	_label(page, "PICK YOUR LINE", 24, WHITE, Vector2(right_x, 205), Vector2(390, 38))
	var drive := _button(page, "FREE DRIVE     ›", Vector2(right_x, 278), Vector2(370, 60), true)
	drive.pressed.connect(func(): drive_requested.emit())
	var race := _button(page, "AURORA COAST SPRINT", Vector2(right_x, 352), Vector2(370, 60))
	race.pressed.connect(func(): race_requested.emit())
	var garage := _button(page, "GARAGE  /  COLLECTION", Vector2(right_x, 426), Vector2(370, 60))
	garage.pressed.connect(func(): garage_requested.emit())
	var settings := _button(page, "SETTINGS", Vector2(right_x, 500), Vector2(370, 60))
	settings.pressed.connect(func(): settings_requested.emit())
	var exit := _button(page, "EXIT FESTIVAL", Vector2(right_x, 574), Vector2(370, 52))
	exit.pressed.connect(func(): exit_requested.emit())
	_label(
		page,
		"W A S D  DRIVE     ·     SPACE  HANDBRAKE     ·     C  CAMERA     ·     R  RESET",
		12,
		Color("#90a8a9"),
		Vector2(98, 833),
		Vector2(890, 26)
	)
	_label(
		page, "v0.1  /  AURORA COAST", 11, Color("#839898"), Vector2(1320, 845), Vector2(250, 20)
	)


func show_hud(route: PackedVector3Array) -> void:
	_route = route
	if is_instance_valid(active_overlay):
		active_overlay.queue_free()
	active_overlay = null
	if is_instance_valid(hud_root):
		hud_root.queue_free()
	hud_root = Control.new()
	hud_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hud_root)
	# Title strip / district identifier.
	var title_strip := _panel(
		hud_root, Vector2(42, 36), Vector2(320, 82), Color(0.025, 0.06, 0.075, 0.78), 3
	)
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 0)
	title_strip.add_child(vbox)
	_label(vbox, "AURORA COAST  /  01", 12, TEAL)
	district_label = _label(vbox, "FESTIVAL GROUNDS", 19, WHITE)
	# Radar.
	radar = CoastRadar.new()
	radar.position = Vector2(1320, 40)
	radar.size = Vector2(220, 220)
	radar.route = route
	hud_root.add_child(radar)
	var map_tag := _label(
		hud_root, "NORTH  ↑", 10, Color("#a5b8b4"), Vector2(1384, 265), Vector2(100, 18)
	)
	# Speed and RPM are a clear, restrained motorsport cluster.
	var cluster := _panel(
		hud_root, Vector2(1254, 708), Vector2(295, 146), Color(0.025, 0.055, 0.07, 0.86), 4
	)
	speed_unit_label = _label(
		cluster, "SPEED  /  KM/H", 11, Color("#9db3b1"), Vector2(18, 11), Vector2(180, 20)
	)
	speed_label = _label(cluster, "000", 56, WHITE, Vector2(16, 33), Vector2(175, 70))
	gear_label = _label(cluster, "1", 38, GOLD, Vector2(209, 45), Vector2(45, 48))
	_label(cluster, "GEAR", 10, Color("#aebeb7"), Vector2(204, 86), Vector2(65, 18))
	rpm_bar = ProgressBar.new()
	rpm_bar.position = Vector2(18, 111)
	rpm_bar.size = Vector2(252, 12)
	rpm_bar.min_value = 0
	rpm_bar.max_value = 7200
	rpm_bar.show_percentage = false
	var bar_bg := StyleBoxFlat.new()
	bar_bg.bg_color = Color(0.13, 0.2, 0.22)
	rpm_bar.add_theme_stylebox_override("background", bar_bg)
	var bar_fill := StyleBoxFlat.new()
	bar_fill.bg_color = TEAL
	rpm_bar.add_theme_stylebox_override("fill", bar_fill)
	cluster.add_child(rpm_bar)
	race_label = _label(
		hud_root,
		"FREE ROAM  ·  FIND THE FESTIVAL SPRINT",
		12,
		WHITE,
		Vector2(43, 132),
		Vector2(600, 24)
	)
	race_progress = ProgressBar.new()
	race_progress.position = Vector2(43, 190)
	race_progress.size = Vector2(360, 5)
	race_progress.min_value = 0
	race_progress.max_value = 100
	race_progress.show_percentage = false
	race_progress.modulate = GOLD
	hud_root.add_child(race_progress)
	navigation_label = _label(hud_root, "", 12, GOLD, Vector2(43, 164), Vector2(520, 24))
	var pill := _panel(
		hud_root, Vector2(40, 788), Vector2(585, 48), Color(0.025, 0.055, 0.07, 0.72), 3
	)
	_label(
		pill,
		"WASD DRIVE     SPACE HANDBRAKE     SHIFT GEAR     C CAMERA     M MENU",
		11,
		Color("#bdceca"),
		Vector2(12, 11),
		Vector2(565, 24)
	)
	var menu_button := _button(hud_root, "MENU  [M]", Vector2(42, 141), Vector2(114, 38))
	menu_button.add_theme_font_size_override("font_size", 12)
	menu_button.pressed.connect(func(): show_pause())
	var photo_button := _button(hud_root, "PHOTO  [P]", Vector2(166, 141), Vector2(124, 38))
	photo_button.add_theme_font_size_override("font_size", 12)
	photo_button.pressed.connect(func(): photo_requested.emit())


func update_drive(speed: float, rpm: float, gear: int, world_pos: Vector3) -> void:
	var mph := str(SaveData.settings.get("units", "kmh")) == "mph"
	if is_instance_valid(speed_label):
		speed_label.text = "%03d" % int(speed * 0.621371 if mph else speed)
	if is_instance_valid(speed_unit_label):
		speed_unit_label.text = "SPEED  /  MPH" if mph else "SPEED  /  KM/H"
	if is_instance_valid(gear_label):
		gear_label.text = "R" if gear <= 0 else str(gear)
	if is_instance_valid(rpm_bar):
		rpm_bar.value = rpm
	if is_instance_valid(radar):
		radar.update_location(world_pos)
	if is_instance_valid(district_label):
		district_label.text = _district(world_pos)


func set_navigation_target(target: Vector3, origin: Vector3) -> void:
	if is_instance_valid(navigation_label):
		var delta := target - origin
		var bearing := rad_to_deg(atan2(delta.x, -delta.z))
		navigation_label.text = (
			"NEXT GATE    %03d°    ·    %.0f M"
			% [int(fposmod(bearing + 360.0, 360.0)), delta.length()]
		)


func _district(p: Vector3) -> String:
	var district := "FESTIVAL GROUNDS"
	if p.x < -160 and p.z > 100:
		district = "REDSTONE DESERT"
	elif p.x < -130 and p.z > -90 and p.z < 155:
		district = "GREENVALE FOREST"
	elif p.z < -160:
		district = "SILVER MOUNTAINS"
	elif p.z > 150:
		district = "GOLDEN FARMLANDS"
	elif p.x > 170:
		district = "THE AZURE COAST"
	elif p.x < -45 and p.z < 10:
		district = "AURORA CITY"
	return district


func set_race_state(text: String, progress: float) -> void:
	if is_instance_valid(race_label):
		race_label.text = text
	if is_instance_valid(race_progress) and progress >= 0:
		race_progress.value = clampf(progress, 0, 1) * 100


func show_pause() -> void:
	var page := _clear_overlay()
	var panel := _panel(
		page, Vector2(525, 165), Vector2(550, 555), Color(0.025, 0.06, 0.075, 0.97), 5
	)
	_label(panel, "FESTIVAL MENU", 13, TEAL, Vector2(33, 24), Vector2(300, 26))
	_label(panel, "Take a breath.", 38, WHITE, Vector2(32, 52), Vector2(400, 56))
	var resume := _button(panel, "RETURN TO ROAD", Vector2(33, 132), Vector2(450, 58), true)
	resume.pressed.connect(func(): continue_requested.emit())
	var garage := _button(panel, "GARAGE / COLLECTION", Vector2(33, 205), Vector2(450, 58))
	garage.pressed.connect(func(): garage_requested.emit())
	var setting := _button(panel, "SETTINGS", Vector2(33, 278), Vector2(450, 58))
	setting.pressed.connect(func(): settings_requested.emit())
	var title := _button(panel, "FESTIVAL HOME", Vector2(33, 351), Vector2(450, 58))
	title.pressed.connect(func(): drive_requested.emit())
	_label(
		panel,
		"ESC / M  RESUME     ·     C  CAMERA     ·     R  RESET",
		11,
		Color("#93a9a8"),
		Vector2(34, 444),
		Vector2(450, 22)
	)


func show_garage(
	vehicles: Array, owned: Array, selected: String, credits: int, current_upgrade: int
) -> void:
	var page := _clear_overlay()
	_header(
		page,
		"AURORA MOTORSPORT · WORKSHOP",
		"The collection",
		"Choose a machine. Each car has a distinct powertrain and handling balance."
	)
	_label(page, "CREDITS   %08d" % credits, 16, GOLD, Vector2(106, 259), Vector2(250, 28))
	var y := 310.0
	for entry in vehicles:
		var id := str(entry.id)
		var is_owned := owned.has(id)
		var is_selected := selected == id
		var color := Color(0.08, 0.17, 0.19, 0.94) if is_selected else Color(0.045, 0.09, 0.11, 0.9)
		var card := _panel(page, Vector2(105, y), Vector2(680, 94), color, 3)
		var swatch := ColorRect.new()
		swatch.color = entry.paint
		swatch.position = Vector2(17, 20)
		swatch.size = Vector2(7, 50)
		card.add_child(swatch)
		_label(card, str(entry.name).to_upper(), 18, WHITE, Vector2(42, 10), Vector2(350, 26))
		_label(
			card,
			(
				"%s  ·  %s  ·  %d HP  ·  %.2f HANDLING"
				% [entry.category, entry.drive, int(entry.power), float(entry.handling)]
			),
			12,
			Color("#abc0bd"),
			Vector2(42, 39),
			Vector2(480, 22)
		)
		var action_text: String = (
			"EQUIPPED"
			if is_selected
			else ("SELECT" if is_owned else "BUY   %s CR" % "%08d" % int(entry.price))
		)
		var pick := _button(
			card, action_text, Vector2(500, 18), Vector2(150, 48), is_selected or is_owned
		)
		pick.pressed.connect(func(): garage_pick.emit(id))
		y += 105
	var tune := _panel(
		page, Vector2(825, 310), Vector2(665, 200), Color(0.045, 0.09, 0.11, 0.91), 4
	)
	_label(tune, "PERFORMANCE WORKSHOP", 12, TEAL, Vector2(23, 18), Vector2(350, 22))
	_label(
		tune,
		"Stage %d  /  Power +%d%%" % [current_upgrade, current_upgrade * 8],
		25,
		WHITE,
		Vector2(23, 50),
		Vector2(400, 40)
	)
	_label(
		tune,
		"Engine · transmission · suspension · tire package",
		13,
		Color("#a9bcb8"),
		Vector2(23, 97),
		Vector2(540, 24)
	)
	var upgrade := _button(
		tune, "INSTALL NEXT STAGE   ·   12,000 CR", Vector2(22, 133), Vector2(610, 49), true
	)
	upgrade.pressed.connect(func(): upgrade_requested.emit())
	var back := _button(page, "BACK TO ROAD", Vector2(105, 790), Vector2(230, 54))
	back.pressed.connect(func(): continue_requested.emit())
	_label(
		page,
		"ESC  CLOSE     ·     OWNED VEHICLES ARE PERMANENT",
		12,
		Color("#93a9a8"),
		Vector2(370, 805),
		Vector2(450, 24)
	)


func show_settings(current_quality: String, units: String, weather: String) -> void:
	var page := _clear_overlay()
	_header(
		page,
		"SYSTEM CONFIGURATION",
		"Settings",
		"Adjust the presentation and driving display for your machine."
	)
	var panel := _panel(page, Vector2(105, 290), Vector2(780, 410), Color(0.04, 0.08, 0.1, 0.95), 4)
	_label(panel, "GRAPHICS PRESET", 13, TEAL, Vector2(28, 24), Vector2(280, 24))
	var qualities: Array[String] = ["LOW", "MEDIUM", "HIGH", "ULTRA"]
	for i in range(qualities.size()):
		var q := qualities[i]
		var b := _button(
			panel, q, Vector2(25 + i * 173, 64), Vector2(160, 50), q == current_quality
		)
		b.pressed.connect(func(): quality_changed.emit(q))
	_label(
		panel,
		"DAYLIGHT · WEATHER · WORLD DETAIL",
		11,
		Color("#95aaa8"),
		Vector2(28, 130),
		Vector2(360, 21)
	)
	_label(panel, "DISPLAY UNITS", 13, TEAL, Vector2(28, 195), Vector2(250, 22))
	var unit_button := _button(
		panel, "KM/H" if units == "kmh" else "MPH", Vector2(28, 227), Vector2(165, 48)
	)
	unit_button.pressed.connect(func(): quality_changed.emit("UNITS"))
	var weather_button := _button(
		panel, "WEATHER  ·  %s" % weather, Vector2(213, 227), Vector2(285, 48)
	)
	weather_button.pressed.connect(func(): quality_changed.emit("WEATHER"))
	_label(
		panel,
		"Keyboard: W A S D · Space · Shift · C · R · M\nController: left stick / triggers / face buttons\nSettings, garage purchases and event results save automatically.",
		14,
		Color("#b0c2bd"),
		Vector2(28, 300),
		Vector2(700, 66)
	)
	var back := _button(page, "BACK", Vector2(106, 738), Vector2(210, 52))
	back.pressed.connect(func(): continue_requested.emit())


func show_results(time_seconds: float, reward: int, position: int, credits: int) -> void:
	var page := _clear_overlay()
	_header(
		page,
		"AURORA COAST SPRINT · FINISH",
		"The coast is yours.",
		"Clean lines, late braking and a little courage. Event result recorded to your festival profile."
	)
	var result := _panel(
		page, Vector2(105, 290), Vector2(675, 315), Color(0.04, 0.09, 0.11, 0.96), 5
	)
	_label(result, "FINISH POSITION", 12, TEAL, Vector2(28, 25), Vector2(250, 22))
	_label(result, "%02d" % position, 66, GOLD, Vector2(27, 51), Vector2(170, 82))
	_label(
		result,
		"TIME   %02d:%05.2f" % [int(time_seconds / 60), fmod(time_seconds, 60.0)],
		21,
		WHITE,
		Vector2(225, 63),
		Vector2(400, 36)
	)
	_label(
		result, "REWARD   +%s CR" % "%05d" % reward, 18, TEAL, Vector2(225, 114), Vector2(400, 32)
	)
	_label(
		result,
		"BALANCE   %08d CR" % credits,
		14,
		Color("#b0c0bb"),
		Vector2(225, 154),
		Vector2(400, 26)
	)
	_label(
		result,
		"EVENT COMPLETE  ·  AURORA COAST SERIES",
		12,
		Color("#9aafac"),
		Vector2(29, 242),
		Vector2(550, 20)
	)
	var resume := _button(page, "CONTINUE DRIVING", Vector2(105, 665), Vector2(275, 58), true)
	resume.pressed.connect(func(): continue_requested.emit())
	var garage := _button(page, "VISIT THE GARAGE", Vector2(400, 665), Vector2(275, 58))
	garage.pressed.connect(func(): garage_requested.emit())


func set_photo_mode(enabled: bool) -> void:
	if is_instance_valid(hud_root):
		hud_root.visible = not enabled


func show_photo_hint() -> void:
	var tip := _panel(root, Vector2(540, 55), Vector2(500, 62), Color(0.025, 0.055, 0.07, 0.94), 3)
	_label(
		tip,
		"PHOTO VIEW  ·  CYCLE CAMERA WITH C  ·  P TO CLOSE",
		12,
		GOLD,
		Vector2(8, 12),
		Vector2(470, 22)
	)
	get_tree().create_timer(2.6).timeout.connect(func(): _remove_tip(tip))


func _remove_tip(tip: Control) -> void:
	if is_instance_valid(tip):
		tip.queue_free()
