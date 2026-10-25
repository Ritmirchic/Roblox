class_name CardWidget
extends PanelContainer

signal card_clicked(card_def: Dictionary)

var card_data: Dictionary = {}
var _foil_shader: Shader

func setup(cdef: Dictionary, is_owned: bool = true, owned_qty: int = 1, is_equipped: bool = false, compact: bool = false) -> void:
	card_data = cdef
	var rar: String = cdef.get("rarity", "Common")
	var rcol: Color = GameData.RARITY_COLORS.get(rar, Color.GRAY)
	var tier_idx := maxi(0, GameData.RARITY_ORDER.find(rar))

	custom_minimum_size = Vector2(186, 276) if compact else Vector2(228, 338)
	mouse_filter = Control.MOUSE_FILTER_STOP

	var bg_col := Color(0.05, 0.08, 0.15, 0.98) if is_owned else Color(0.03, 0.04, 0.08, 0.88)
	var sb := ThemeHelper.make_panel_style(bg_col, rcol if is_owned else rcol.darkened(0.55), 10, 3 if tier_idx >= 3 else 2)
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 7
	sb.content_margin_bottom = 7
	add_theme_stylebox_override("panel", sb)

	for ch in get_children():
		ch.queue_free()

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	add_child(vbox)

	# Top header: #XX + Rarity pill
	var top_hb := HBoxContainer.new()
	vbox.add_child(top_hb)

	var num_lbl := Label.new()
	num_lbl.text = "#%02d" % int(cdef.get("number", 1))
	if ThemeHelper.font_mono:
		num_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	num_lbl.add_theme_font_size_override("font_size", 14)
	num_lbl.add_theme_color_override("font_color", Color(0.68, 0.80, 0.94))
	top_hb.add_child(num_lbl)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_hb.add_child(spacer)

	var rar_lbl := Label.new()
	rar_lbl.text = rar.to_upper()
	if ThemeHelper.font_bold:
		rar_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	rar_lbl.add_theme_font_size_override("font_size", 14)
	rar_lbl.add_theme_color_override("font_color", rcol.lightened(0.22))
	top_hb.add_child(rar_lbl)

	# Portrait frame with holographic foil shader
	var art_holder := PanelContainer.new()
	art_holder.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var art_sb := ThemeHelper.make_panel_style(Color(0.02, 0.03, 0.07), rcol.darkened(0.25), 6, 1)
	art_sb.content_margin_left = 2
	art_sb.content_margin_right = 2
	art_sb.content_margin_top = 2
	art_sb.content_margin_bottom = 2
	art_sb.shadow_size = 0
	art_holder.add_theme_stylebox_override("panel", art_sb)
	vbox.add_child(art_holder)

	var tex_rect := TextureRect.new()
	tex_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	tex_rect.custom_minimum_size = Vector2(160, 128) if compact else Vector2(200, 168)
	var ppath: String = cdef.get("portrait", "")
	if ResourceLoader.exists(ppath):
		tex_rect.texture = load(ppath)
	if not is_owned:
		tex_rect.modulate = Color(0.22, 0.26, 0.34, 0.85)
	elif tier_idx >= 2:
		if not _foil_shader:
			_foil_shader = load("res://shaders/card_foil.gdshader")
		var sm := ShaderMaterial.new()
		sm.shader = _foil_shader
		sm.set_shader_parameter("rarity_tier", tier_idx)
		sm.set_shader_parameter("reduced_motion", 1.0 if ThemeHelper.reduced_motion else 0.0)
		tex_rect.material = sm
	art_holder.add_child(tex_rect)

	# Name & Role
	var name_lbl := Label.new()
	name_lbl.text = str(cdef.get("name", "Crew"))
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.clip_text = true
	if ThemeHelper.font_bold:
		name_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	name_lbl.add_theme_font_size_override("font_size", 17 if compact else 19)
	name_lbl.add_theme_color_override("font_color", Color.WHITE if is_owned else Color(0.55, 0.62, 0.72))
	vbox.add_child(name_lbl)

	var role_lbl := Label.new()
	role_lbl.text = str(cdef.get("role", "Officer")).to_upper() + ("  •  x%d" % owned_qty if (is_owned and owned_qty > 1) else "")
	role_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	role_lbl.add_theme_font_size_override("font_size", 13 if compact else 14)
	role_lbl.add_theme_color_override("font_color", rcol.lightened(0.18))
	vbox.add_child(role_lbl)

	# Bonus passive box
	var bonus_box := PanelContainer.new()
	var b_sb := ThemeHelper.make_panel_style(Color(0.03, 0.06, 0.12, 0.95), rcol.darkened(0.35), 5, 1)
	b_sb.content_margin_left = 6
	b_sb.content_margin_right = 6
	b_sb.content_margin_top = 4
	b_sb.content_margin_bottom = 4
	b_sb.shadow_size = 0
	bonus_box.add_theme_stylebox_override("panel", b_sb)
	vbox.add_child(bonus_box)

	var bonus_lbl := Label.new()
	bonus_lbl.text = str(cdef.get("bonus_text", ""))
	bonus_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bonus_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bonus_lbl.add_theme_font_size_override("font_size", 13 if compact else 15)
	bonus_lbl.add_theme_color_override("font_color", Color(0.95, 0.92, 0.65) if is_owned else Color(0.5, 0.55, 0.62))
	bonus_box.add_child(bonus_lbl)

	if is_equipped:
		var eq_lbl := Label.new()
		eq_lbl.text = "ACTIVE IN CREW"
		eq_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if ThemeHelper.font_bold:
			eq_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
		eq_lbl.add_theme_font_size_override("font_size", 13)
		eq_lbl.add_theme_color_override("font_color", Color(0.28, 1.0, 0.62))
		vbox.add_child(eq_lbl)

	mouse_entered.connect(_on_hover_in)
	mouse_exited.connect(_on_hover_out)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		AudioManager.play_sfx("ui_click", 0.04, 0.75)
		card_clicked.emit(card_data)

func _on_hover_in() -> void:
	AudioManager.play_sfx("ui_hover", 0.05, 0.45)
	if not ThemeHelper.reduced_motion and is_inside_tree():
		pivot_offset = size * 0.5
		var tw := create_tween()
		tw.tween_property(self, "scale", Vector2(1.045, 1.045), 0.11)

func _on_hover_out() -> void:
	if not ThemeHelper.reduced_motion and is_inside_tree():
		pivot_offset = size * 0.5
		var tw := create_tween()
		tw.tween_property(self, "scale", Vector2.ONE, 0.11)
