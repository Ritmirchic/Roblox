extends CanvasLayer
class_name Hud
## In-game heads-up display: vitals, clock/region, quest tracker, prompts,
## boss bar, crosshair, toasts and damage feedback.

var player: Survivor
var bars: Dictionary = {}
var clock_label: Label
var region_label: Label
var prompt_label: Label
var tracker: VBoxContainer
var boss_bar: ProgressBar
var boss_name: Label
var crosshair: Label
var toasts: VBoxContainer
var vignette: ColorRect
var weapon_label: Label
var bearing: Label
var _toast_timers: Array = []

func setup(p: Survivor) -> void:
	layer = 5
	player = p
	_build()
	_connect()

func _build() -> void:
	# Crosshair.
	crosshair = UiTheme.label("+", 26, Color(1, 0.95, 0.85), HORIZONTAL_ALIGNMENT_CENTER)
	crosshair.set_anchors_preset(Control.PRESET_CENTER)
	crosshair.grow_horizontal = Control.GROW_DIRECTION_BOTH
	crosshair.grow_vertical = Control.GROW_DIRECTION_BOTH
	add_child(crosshair)
	# Vignette / damage flash.
	vignette = ColorRect.new()
	vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette.color = Color(0.7, 0.05, 0.02, 0.0)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(vignette)
	# Top bar: clock + region.
	var top := UiTheme.panel()
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	top.grow_horizontal = Control.GROW_DIRECTION_BOTH
	top.position = Vector2(-140, 12)
	top.custom_minimum_size = Vector2(280, 56)
	add_child(top)
	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	top.add_child(vbox)
	clock_label = UiTheme.label("08:00 — Day 1", 18, Color(0.95, 0.9, 0.75),
		HORIZONTAL_ALIGNMENT_CENTER)
	region_label = UiTheme.label("The Dead Suburbs", 15, UiTheme.ACCENT_COLD,
		HORIZONTAL_ALIGNMENT_CENTER)
	bearing = UiTheme.label("N", 14, UiTheme.TEXT_DIM, HORIZONTAL_ALIGNMENT_CENTER)
	vbox.add_child(clock_label)
	vbox.add_child(region_label)
	vbox.add_child(bearing)
	# Vitals bottom-left.
	var vitals := UiTheme.panel()
	vitals.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	vitals.position = Vector2(16, -178)
	vitals.custom_minimum_size = Vector2(230, 168)
	add_child(vitals)
	var grid := VBoxContainer.new()
	vitals.add_child(grid)
	for pair in [["health", "Health", Color(0.75, 0.22, 0.18)],
			["stamina", "Stamina", Color(0.5, 0.65, 0.35)],
			["hunger", "Hunger", Color(0.8, 0.6, 0.3)],
			["thirst", "Thirst", Color(0.35, 0.55, 0.8)],
			["radiation", "Radiation", Color(0.55, 0.8, 0.3)]]:
		var row := HBoxContainer.new()
		var name_l := UiTheme.label(pair[1], 13, UiTheme.TEXT_DIM)
		name_l.custom_minimum_size.x = 72
		var bar := UiTheme.bar(1.0, pair[2])
		bar.custom_minimum_size = Vector2(130, 12)
		row.add_child(name_l)
		row.add_child(bar)
		grid.add_child(row)
		bars[pair[0]] = bar
	# Interaction prompt.
	prompt_label = UiTheme.label("", 20, Color(1, 0.92, 0.7),
		HORIZONTAL_ALIGNMENT_CENTER)
	prompt_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	prompt_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	prompt_label.position = Vector2(-200, -130)
	prompt_label.custom_minimum_size = Vector2(400, 30)
	add_child(prompt_label)
	# Quest tracker.
	var quest_panel := UiTheme.panel()
	quest_panel.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	quest_panel.position = Vector2(-312, 80)
	quest_panel.custom_minimum_size = Vector2(300, 150)
	add_child(quest_panel)
	tracker = VBoxContainer.new()
	quest_panel.add_child(tracker)
	# Boss bar.
	var boss_box := VBoxContainer.new()
	boss_box.set_anchors_preset(Control.PRESET_CENTER_TOP)
	boss_box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	boss_box.position = Vector2(-300, 82)
	boss_box.custom_minimum_size = Vector2(600, 48)
	add_child(boss_box)
	boss_name = UiTheme.label("", 18, Color(0.9, 0.3, 0.25),
		HORIZONTAL_ALIGNMENT_CENTER)
	boss_bar = UiTheme.bar(1.0, Color(0.75, 0.15, 0.12))
	boss_bar.custom_minimum_size = Vector2(600, 16)
	boss_box.add_child(boss_name)
	boss_box.add_child(boss_bar)
	boss_box.visible = false
	# Weapon readout.
	weapon_label = UiTheme.label("", 15, UiTheme.TEXT,
		HORIZONTAL_ALIGNMENT_RIGHT)
	weapon_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	weapon_label.position = Vector2(-220, -46)
	weapon_label.custom_minimum_size = Vector2(204, 34)
	add_child(weapon_label)
	# Toasts.
	toasts = VBoxContainer.new()
	toasts.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	toasts.grow_horizontal = Control.GROW_DIRECTION_BOTH
	toasts.position = Vector2(-260, -210)
	toasts.custom_minimum_size = Vector2(520, 0)
	add_child(toasts)

func _connect() -> void:
	player.prompt_changed.connect(_on_prompt)
	player.vitals_changed.connect(_on_vitals)
	player.health_changed.connect(func(_f): _flash(0.35))
	player.notification.connect(show_toast)
	QuestMan.toast.connect(show_toast)
	GameState.boss_spawned.connect(_on_boss_spawned)
	GameState.boss_health_changed.connect(_on_boss_health)
	GameState.boss_died.connect(_on_boss_died)
	GameState.enemy_killed.connect(func(_e): _refresh_tracker())
	QuestMan.quest_accepted.connect(func(_q): _refresh_tracker())
	QuestMan.quest_completed.connect(func(_q): _refresh_tracker())
	QuestMan.quest_updated.connect(func(_q): _refresh_tracker())

func _process(_delta: float) -> void:
	clock_label.text = "%s — Day %d" % [WorldClock.clock_text(),
		WorldClock.day_index]
	var region := RegionData.by_id(GameState.current_region_id)
	region_label.text = region.get("name", "Unknown")
	if player:
		var angle := fmod(-player.cam_rig.yaw, TAU)
		var dirs := ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
		bearing.text = dirs[wrapi(int(round(angle / (TAU / 8.0))), 0, 7)]
		_update_weapon_readout()
	# Vignette decay.
	vignette.color.a = max(0.0, vignette.color.a - _delta * 1.5)
	if player and player.vitals.health < 30.0:
		vignette.color = Color(0.6, 0.04, 0.02,
			0.22 + sin(Time.get_ticks_msec() * 0.005) * 0.08)

func _update_weapon_readout() -> void:
	var wh := player.weapons
	var def := ItemDB.get_def(wh.current_id)
	if def.is_empty():
		weapon_label.text = ""
		return
	if def.has("ammo_type"):
		weapon_label.text = "%s   %d / %d" % [def.name, wh.mag,
			player.inventory_count(def.ammo_type)]
	else:
		var dur := 100.0
		for slot in player.equipment:
			if player.equipment[slot].id == wh.current_id:
				dur = float(player.equipment[slot].durability)
		weapon_label.text = "%s   %d%%" % [def.name, int(dur)]

func _on_prompt(text: String) -> void:
	prompt_label.text = "[E] " + text if text else ""

func _on_vitals(v: Dictionary) -> void:
	UiTheme.refresh_bar(bars.health, float(v.health) / 100.0)
	UiTheme.refresh_bar(bars.stamina, float(v.stamina) / 100.0)
	UiTheme.refresh_bar(bars.hunger, float(v.hunger) / 100.0)
	UiTheme.refresh_bar(bars.thirst, float(v.thirst) / 100.0)
	UiTheme.refresh_bar(bars.radiation, float(v.radiation) / 100.0)

func _flash(alpha: float) -> void:
	vignette.color = Color(0.7, 0.05, 0.02, alpha)

func show_toast(text: String) -> void:
	var l := UiTheme.label(text, 16, Color(1, 0.9, 0.7),
		HORIZONTAL_ALIGNMENT_CENTER)
	var p := UiTheme.panel()
	p.custom_minimum_size = Vector2(520, 34)
	p.add_child(l)
	toasts.add_child(p)
	var timer := get_tree().create_timer(3.2)
	_toast_timers.append(timer)
	await timer.timeout
	p.queue_free()

func _refresh_tracker() -> void:
	for c in tracker.get_children():
		c.queue_free()
	var title := UiTheme.label("ACTIVE OBJECTIVES", 14, UiTheme.ACCENT)
	tracker.add_child(title)
	var shown := 0
	for qid in QuestMan.active_quests():
		if shown >= 3:
			break
		var q := QuestDB.get_quest(qid)
		var qname := UiTheme.label(q.title, 15, UiTheme.TEXT)
		tracker.add_child(qname)
		for line in QuestMan.objective_labels(qid):
			tracker.add_child(UiTheme.label("  " + line, 13,
				UiTheme.TEXT_DIM))
		shown += 1
	if shown == 0:
		tracker.add_child(UiTheme.label("No active objectives", 13,
			UiTheme.TEXT_DIM))

func _on_boss_spawned(boss: Node) -> void:
	boss_box_show(boss)

func boss_box_show(boss: Node) -> void:
	var label: String = boss.get_meta("boss_label", "Mutant Horror")
	boss_name.text = label.to_upper()
	boss_bar.value = 100.0
	boss_box_visible(true)

func _on_boss_health(fraction: float, _boss: Node) -> void:
	boss_bar.value = clampf(fraction * 100.0, 0.0, 100.0)

func _on_boss_died(_boss: Node) -> void:
	show_toast("Boss defeated")
	boss_box_visible(false)

func boss_box_visible(v: bool) -> void:
	boss_name.get_parent().visible = v
