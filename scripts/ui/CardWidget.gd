extends PanelContainer
class_name CardWidget

signal card_clicked(card_id: String)

var card_data: Dictionary = {}
var is_owned: bool = true
var copies_count: int = 1
var is_equipped: bool = false

var _foil_mat: ShaderMaterial = null
var _hover_tween: Tween = null
var _pulse_time: float = 0.0
var _rarity_tier: int = 0
var _base_border_col: Color = Color.WHITE
var _outer_sb: StyleBoxFlat = null
var _is_hovered: bool = false

func setup_card(data: Dictionary, owned: bool, copies: int = 1, equipped: bool = false, compact: bool = false) -> void:
	card_data = data
	is_owned = owned
	copies_count = copies
	is_equipped = equipped

	custom_minimum_size = Vector2(198, 296) if compact else Vector2(216, 326)
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

	for c in get_children():
		c.queue_free()

	var rarity: String = str(data.get("rarity", "Common"))
	var rcol: Color = GameData.RARITY_COLORS.get(rarity, Color(0.6, 0.68, 0.78))
	_rarity_tier = maxi(0, GameData.RARITY_ORDER.find(rarity))
	_base_border_col = rcol if owned else Color(0.28, 0.34, 0.44, 0.72)

	var bg_col := Color(0.035, 0.062, 0.125, 0.97)
	if rarity in ["Legendary", "Mythic", "Secret"] and owned:
		bg_col = rcol.darkened(0.84)
		bg_col.a = 0.98

	_outer_sb = StyleBoxFlat.new()
	_outer_sb.bg_color = bg_col
	_outer_sb.border_color = Color(0.25, 0.96, 0.62) if equipped else _base_border_col
	_outer_sb.set_border_width_all(3 if (equipped or _rarity_tier >= 4) else 2)
	_outer_sb.set_corner_radius_all(13)
	_outer_sb.content_margin_left = 8
	_outer_sb.content_margin_right = 8
	_outer_sb.content_margin_top = 8
	_outer_sb.content_margin_bottom = 8
	_outer_sb.shadow_color = (rcol * Color(1, 1, 1, 0.38)) if (owned and _rarity_tier >= 3) else Color(0, 0, 0, 0.52)
	_outer_sb.shadow_size = 12 if _rarity_tier >= 3 else 7
	_outer_sb.anti_aliasing = true
	add_theme_stylebox_override("panel", _outer_sb)

	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 5)
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(vb)

	# 1. Sleek Top Collector Header Bar (#ID • Role • Rarity)
	var top_pill := PanelContainer.new()
	top_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(
		rcol.darkened(0.74) if owned else Color(0.08, 0.11, 0.16, 0.9),
		rcol.lightened(0.15) if owned else Color(0.25, 0.30, 0.38, 0.5),
		7, 8, 3
	))
	vb.add_child(top_pill)

	var top_hb := HBoxContainer.new()
	top_hb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_pill.add_child(top_hb)

	var role_lbl := Label.new()
	role_lbl.text = "#%02d • %s" % [int(data.get("number", 1)), L.role_name(str(data.get("role", "Miner")))]
	role_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	role_lbl.clip_text = true
	role_lbl.add_theme_font_size_override("font_size", 11 if compact else 12)
	role_lbl.add_theme_color_override("font_color", Color(0.88, 0.95, 1.0))
	top_hb.add_child(role_lbl)

	var rar_lbl := Label.new()
	rar_lbl.text = L.rarity_name(rarity).to_upper()
	if ThemeHelper.font_bold:
		rar_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	rar_lbl.add_theme_font_size_override("font_size", 11 if compact else 12)
	rar_lbl.add_theme_color_override("font_color", rcol.lightened(0.25))
	top_hb.add_child(rar_lbl)

	# 2. Rounded Full-Bleed Portrait Viewport (takes center stage!)
	var port_frame := PanelContainer.new()
	port_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
	port_frame.custom_minimum_size = Vector2(0, 154 if compact else 174)
	port_frame.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
	port_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var pf_sb := StyleBoxFlat.new()
	pf_sb.bg_color = Color(0.02, 0.03, 0.07, 1.0)
	pf_sb.set_corner_radius_all(9)
	port_frame.add_theme_stylebox_override("panel", pf_sb)
	vb.add_child(port_frame)

	var tex_rect := TextureRect.new()
	tex_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	tex_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	tex_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var p_path: String = str(data.get("portrait", ""))
	if ResourceLoader.exists(p_path):
		tex_rect.texture = load(p_path)
	if not owned:
		tex_rect.modulate = Color(0.24, 0.28, 0.36, 0.88)
	elif ResourceLoader.exists("res://shaders/card_foil.gdshader"):
		_foil_mat = ShaderMaterial.new()
		_foil_mat.shader = load("res://shaders/card_foil.gdshader")
		_foil_mat.set_shader_parameter("rarity_tier", _rarity_tier)
		_foil_mat.set_shader_parameter("reduced_motion", 1.0 if ThemeHelper.reduced_motion else 0.0)
		_foil_mat.set_shader_parameter("hover_amount", 0.0)
		tex_rect.material = _foil_mat
	port_frame.add_child(tex_rect)

	# Floating Badges inside Portrait Corners (Copies / Equipped / Locked)
	var badge_layer := Control.new()
	badge_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	badge_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	port_frame.add_child(badge_layer)

	if owned and copies > 1:
		var cp_pill := PanelContainer.new()
		cp_pill.set_anchors_preset(Control.PRESET_TOP_RIGHT)
		cp_pill.grow_horizontal = Control.GROW_DIRECTION_BEGIN
		cp_pill.offset_right = -6
		cp_pill.offset_top = 6
		cp_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
		cp_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.03, 0.06, 0.14, 0.88), rcol, 6, 6, 2))
		var cp_lbl := Label.new()
		cp_lbl.text = "×%d" % copies
		cp_lbl.add_theme_font_size_override("font_size", 11)
		cp_lbl.add_theme_color_override("font_color", Color(1.0, 0.90, 0.45))
		cp_pill.add_child(cp_lbl)
		badge_layer.add_child(cp_pill)

	if equipped or not owned:
		var st_pill := PanelContainer.new()
		st_pill.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
		st_pill.offset_left = 6
		st_pill.offset_right = -6
		st_pill.offset_top = -26
		st_pill.offset_bottom = -5
		st_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var scol := Color(0.08, 0.42, 0.26, 0.92) if equipped else Color(0.05, 0.07, 0.12, 0.88)
		var sbord := Color(0.28, 0.98, 0.66) if equipped else Color(0.42, 0.48, 0.58, 0.65)
		st_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(scol, sbord, 6, 6, 1))
		var st_lbl := Label.new()
		st_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		st_lbl.text = L.tr_ui("equipped_badge") if equipped else L.tr_ui("locked_badge")
		st_lbl.add_theme_font_size_override("font_size", 11)
		st_lbl.add_theme_color_override("font_color", Color(0.55, 1.0, 0.78) if equipped else Color(0.68, 0.74, 0.84))
		st_pill.add_child(st_lbl)
		badge_layer.add_child(st_pill)

	# 3. Fighter Name & Passive Bonus Footer
	var name_lbl := Label.new()
	name_lbl.text = str(data.get("name", "Specialist"))
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.clip_text = true
	name_lbl.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	if ThemeHelper.font_bold:
		name_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	name_lbl.add_theme_font_size_override("font_size", 15 if compact else 16)
	name_lbl.add_theme_color_override("font_color", Color.WHITE if owned else Color(0.62, 0.68, 0.78))
	vb.add_child(name_lbl)

	var bonus_pill := PanelContainer.new()
	bonus_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bonus_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(
		Color(0.05, 0.095, 0.19, 0.92),
		Color(rcol.r, rcol.g, rcol.b, 0.42) if owned else Color(0.22, 0.28, 0.36, 0.35),
		7, 7, 4
	))
	vb.add_child(bonus_pill)

	var bonus_lbl := Label.new()
	bonus_lbl.text = L.crew_bonus(data)
	bonus_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bonus_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bonus_lbl.custom_minimum_size = Vector2(0, 32)
	bonus_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bonus_lbl.add_theme_font_size_override("font_size", 12 if compact else 13)
	bonus_lbl.add_theme_color_override("font_color", Color(1.0, 0.86, 0.36) if owned else Color(0.55, 0.62, 0.72))
	bonus_pill.add_child(bonus_lbl)

	if not has_meta("card_signals_wired"):
		set_meta("card_signals_wired", true)
		mouse_entered.connect(_on_hover_enter)
		mouse_exited.connect(_on_hover_exit)

func _process(delta: float) -> void:
	if ThemeHelper.reduced_motion or _outer_sb == null:
		return
	if is_owned and (_rarity_tier >= 4 or _is_hovered):
		_pulse_time += delta * 2.8
		var glow_pulse := 0.5 + 0.5 * sin(_pulse_time)
		if not is_equipped:
			_outer_sb.border_color = _base_border_col.lightened(0.10 + 0.24 * glow_pulse)

func _on_hover_enter() -> void:
	_is_hovered = true
	z_index = 12
	AudioManager.play_sfx("ui_hover", 0.03, 0.42)
	if not ThemeHelper.reduced_motion:
		pivot_offset = size * 0.5
		if _hover_tween and _hover_tween.is_running():
			_hover_tween.kill()
		_hover_tween = create_tween().set_parallel(true)
		_hover_tween.tween_property(self, "scale", Vector2(1.055, 1.055), 0.15).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		if _foil_mat != null:
			_hover_tween.tween_method(func(v: float): _foil_mat.set_shader_parameter("hover_amount", v), 0.0, 1.0, 0.16)

func _on_hover_exit() -> void:
	_is_hovered = false
	z_index = 0
	if not ThemeHelper.reduced_motion:
		pivot_offset = size * 0.5
		if _hover_tween and _hover_tween.is_running():
			_hover_tween.kill()
		_hover_tween = create_tween().set_parallel(true)
		_hover_tween.tween_property(self, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		if _foil_mat != null:
			_hover_tween.tween_method(func(v: float): _foil_mat.set_shader_parameter("hover_amount", v), 1.0, 0.0, 0.18)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and _foil_mat != null and size.x > 1.0 and size.y > 1.0:
		var uv := Vector2(clampf(event.position.x / size.x, 0.0, 1.0), clampf(event.position.y / size.y, 0.0, 1.0))
		_foil_mat.set_shader_parameter("hover_uv", uv)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		AudioManager.play_sfx("ui_click", 0.03, 0.78)
		if not ThemeHelper.reduced_motion:
			pivot_offset = size * 0.5
			var tw := create_tween()
			tw.tween_property(self, "scale", Vector2(0.96, 0.96), 0.05)
			tw.tween_property(self, "scale", Vector2(1.04, 1.04), 0.11).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		card_clicked.emit(str(card_data.get("id", "")))
		accept_event()
