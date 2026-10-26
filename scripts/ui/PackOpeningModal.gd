extends Control
class_name PackOpeningModal

signal ceremony_finished

enum Stage {
	IDLE,
	PACK_APPEAR,
	PACK_CHARGE,
	PACK_BURST,
	CARDS_DEALT,
	REVEALING,
	SUMMARY
}

var stage: Stage = Stage.IDLE
var _results: Array[Dictionary] = []
var _unlocked_fifth: bool = false
var _revealed_flags: Array[bool] = [false, false, false]

var _dim_bg: ColorRect
var _center_pack: TextureRect
var _pack_aura: Panel
var _burst_flash: ColorRect
var _title_lbl: Label
var _cards_row: HBoxContainer
var _card_slots: Array[Control] = []
var _action_row: HBoxContainer
var _reveal_all_btn: Button
var _done_btn: Button
var _fifth_banner: Label
var _anim_t: float = 0.0

func _ready() -> void:
	ThemeHelper.fill_full_rect(self)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	_build_ui()

func _process(delta: float) -> void:
	if not visible or ThemeHelper.reduced_motion:
		return
	_anim_t += delta
	if _center_pack.visible and stage in [Stage.PACK_APPEAR, Stage.PACK_CHARGE]:
		_center_pack.rotation = sin(_anim_t * 3.2) * 0.025
		if is_instance_valid(_pack_aura):
			var s := 1.0 + 0.08 * sin(_anim_t * 4.5)
			_pack_aura.scale = Vector2(s, s)

func _build_ui() -> void:
	_dim_bg = ColorRect.new()
	add_child(_dim_bg)
	ThemeHelper.fill_full_rect(_dim_bg)
	_dim_bg.color = Color(0.012, 0.022, 0.055, 0.94)

	var main_vb := VBoxContainer.new()
	add_child(main_vb)
	ThemeHelper.fill_full_rect(main_vb, 40.0, 36.0, 40.0, 36.0)
	main_vb.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vb.add_theme_constant_override("separation", 18)

	# Machined header rail in the kit's plate language. The ceremony stage below
	# stays frameless so the pack silhouette keeps its transparent edges.
	var title_rail := ThemeHelper.make_header_rail(ThemeHelper.COL_CYAN, 8)
	title_rail.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	main_vb.add_child(title_rail)
	var title_vb := VBoxContainer.new()
	title_vb.add_theme_constant_override("separation", 3)
	title_rail.add_child(title_vb)

	_title_lbl = Label.new()
	_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_display:
		_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_title_lbl.add_theme_font_size_override("font_size", 28)
	_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	title_vb.add_child(_title_lbl)

	_fifth_banner = Label.new()
	_fifth_banner.visible = false
	_fifth_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_display:
		_fifth_banner.add_theme_font_override("font", ThemeHelper.font_display)
	_fifth_banner.add_theme_font_size_override("font_size", 22)
	_fifth_banner.add_theme_color_override("font_color", Color(0.24, 1.0, 0.92))
	title_vb.add_child(_fifth_banner)

	var stage_area := Control.new()
	stage_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	stage_area.custom_minimum_size = Vector2(920, 420)
	main_vb.add_child(stage_area)

	_pack_aura = Panel.new()
	_pack_aura.custom_minimum_size = Vector2(360, 480)
	_pack_aura.size = Vector2(360, 480)
	_pack_aura.set_anchors_preset(Control.PRESET_CENTER)
	_pack_aura.offset_left = -180
	_pack_aura.offset_top = -240
	_pack_aura.offset_right = 180
	_pack_aura.offset_bottom = 240
	_pack_aura.pivot_offset = Vector2(180, 240)
	_pack_aura.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var aura_sb := StyleBoxFlat.new()
	aura_sb.bg_color = Color(0.18, 0.72, 1.0, 0.16)
	aura_sb.border_color = Color(0.32, 0.88, 1.0, 0.45)
	aura_sb.set_border_width_all(2)
	aura_sb.set_corner_radius_all(180)
	aura_sb.shadow_color = Color(0.20, 0.82, 1.0, 0.45)
	aura_sb.shadow_size = 36
	_pack_aura.add_theme_stylebox_override("panel", aura_sb)
	stage_area.add_child(_pack_aura)

	_center_pack = TextureRect.new()
	_center_pack.custom_minimum_size = Vector2(280, 398)
	_center_pack.size = Vector2(280, 398)
	_center_pack.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_center_pack.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_center_pack.set_anchors_preset(Control.PRESET_CENTER)
	_center_pack.offset_left = -140
	_center_pack.offset_top = -199
	_center_pack.offset_right = 140
	_center_pack.offset_bottom = 199
	_center_pack.pivot_offset = Vector2(140, 199)
	stage_area.add_child(_center_pack)

	_cards_row = HBoxContainer.new()
	stage_area.add_child(_cards_row)
	ThemeHelper.fill_full_rect(_cards_row)
	_cards_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_cards_row.add_theme_constant_override("separation", 44)
	_cards_row.visible = false

	_action_row = HBoxContainer.new()
	_action_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_action_row.add_theme_constant_override("separation", 22)
	main_vb.add_child(_action_row)

	_reveal_all_btn = Button.new()
	_reveal_all_btn.custom_minimum_size = Vector2(240, 50)
	ThemeHelper.style_accent_button(_reveal_all_btn, Color(0.22, 0.72, 1.0))
	_reveal_all_btn.pressed.connect(reveal_all_remaining)
	_action_row.add_child(_reveal_all_btn)

	_done_btn = Button.new()
	_done_btn.custom_minimum_size = Vector2(270, 50)
	ThemeHelper.style_accent_button(_done_btn, Color(0.20, 0.85, 0.52))
	_done_btn.pressed.connect(_close_ceremony)
	_action_row.add_child(_done_btn)

	_burst_flash = ColorRect.new()
	add_child(_burst_flash)
	ThemeHelper.fill_full_rect(_burst_flash)
	_burst_flash.color = Color(0.85, 0.96, 1.0, 0.0)
	_burst_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE

func play_ceremony(pack_id: String, results: Array[Dictionary], unlocked_fifth: bool) -> void:
	_results = results
	_unlocked_fifth = unlocked_fifth
	_revealed_flags = [false, false, false]
	visible = true
	_fifth_banner.visible = false
	_reveal_all_btn.text = L.tr_ui("reveal_all")
	_done_btn.text = L.tr_ui("collect_continue")
	_reveal_all_btn.visible = false
	_done_btn.visible = false
	_cards_row.visible = false
	_center_pack.visible = true
	_pack_aura.visible = true

	var art_path: String = PackManager.PACK_TYPES[pack_id]["art"]
	if ResourceLoader.exists(art_path):
		_center_pack.texture = load(art_path)

	ThemeHelper.clear_children(_cards_row)
	_card_slots.clear()

	stage = Stage.PACK_APPEAR
	_title_lbl.text = L.tr_ui("pack_ceremony_opening")
	AudioManager.play_sfx("pack_open", 0.02, 0.92)

	var fast := 0.25 if ThemeHelper.reduced_motion else 1.0
	_center_pack.set_anchors_preset(Control.PRESET_CENTER)
	_center_pack.offset_left = -140
	_center_pack.offset_top = -199
	_center_pack.offset_right = 140
	_center_pack.offset_bottom = 199
	_center_pack.rotation = 0.0
	_center_pack.scale = Vector2(0.25, 0.25)
	_center_pack.modulate = Color(1, 1, 1, 1)
	_pack_aura.scale = Vector2(0.3, 0.3)

	var base_pack_x := _center_pack.position.x
	var tw := create_tween()
	tw.tween_property(_center_pack, "scale", Vector2(1.06, 1.06), 0.36 * fast).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(_pack_aura, "scale", Vector2(1.05, 1.05), 0.40 * fast).set_trans(Tween.TRANS_CUBIC)
	tw.tween_callback(func(): stage = Stage.PACK_CHARGE)

	for i in range(6):
		var off := 10.0 * (1.0 if i % 2 == 0 else -1.0)
		tw.tween_property(_center_pack, "position:x", base_pack_x + off, 0.045 * fast)
	tw.tween_property(_center_pack, "position:x", base_pack_x, 0.03 * fast)
	tw.tween_property(_center_pack, "scale", Vector2(1.32, 1.32), 0.16 * fast)

	tw.tween_callback(func(): stage = Stage.PACK_BURST)
	tw.tween_property(_burst_flash, "color:a", 0.80 if not ThemeHelper.reduced_motion else 0.25, 0.08)
	tw.tween_callback(func():
		_center_pack.visible = false
		_pack_aura.visible = false
		_spawn_three_facedown_cards()
	)
	tw.tween_property(_burst_flash, "color:a", 0.0, 0.36 * fast)
	tw.tween_callback(func():
		stage = Stage.REVEALING
		_title_lbl.text = L.tr_ui("pack_ceremony_click")
		_reveal_all_btn.visible = true
		if _unlocked_fifth:
			_fifth_banner.text = "◆ " + L.tr_ui("pack_fifth_slot_bonus", [1.0])
			_fifth_banner.visible = true
			AudioManager.play_sfx("card_legendary", 0.0, 0.95)
	)

func _spawn_three_facedown_cards() -> void:
	stage = Stage.CARDS_DEALT
	_cards_row.visible = true
	var back_tex: Texture2D = null
	if ResourceLoader.exists("res://assets/cards/card_back.png"):
		back_tex = load("res://assets/cards/card_back.png")

	for i in range(mini(3, _results.size())):
		var holder := VBoxContainer.new()
		holder.alignment = BoxContainer.ALIGNMENT_CENTER
		holder.add_theme_constant_override("separation", 10)
		holder.custom_minimum_size = Vector2(236, 390)
		_cards_row.add_child(holder)

		var slot_root := Control.new()
		slot_root.custom_minimum_size = Vector2(226, 336)
		slot_root.size = Vector2(226, 336)
		holder.add_child(slot_root)

		var back_panel := PanelContainer.new()
		back_panel.name = "BackBtn"
		back_panel.position = Vector2.ZERO
		back_panel.custom_minimum_size = Vector2(226, 336)
		back_panel.size = Vector2(226, 336)
		back_panel.pivot_offset = Vector2(113, 168)
		back_panel.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		back_panel.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
		var bp_sb := StyleBoxFlat.new()
		bp_sb.bg_color = Color(0.03, 0.06, 0.14, 1.0)
		bp_sb.border_color = Color(0.28, 0.84, 1.0, 0.9)
		bp_sb.set_border_width_all(2)
		bp_sb.set_corner_radius_all(14)
		bp_sb.shadow_color = Color(0.15, 0.65, 1.0, 0.35)
		bp_sb.shadow_size = 14
		back_panel.add_theme_stylebox_override("panel", bp_sb)
		var bp_frame := ThemeHelper.make_skin_overlay("card_frame", Color(0.52, 0.80, 1.0, 0.95))
		if bp_frame != null:
			back_panel.add_child(bp_frame)
			ThemeHelper.fill_full_rect(bp_frame, -4.0, -4.0, -4.0, -4.0)

		var back_img := TextureRect.new()
		back_img.custom_minimum_size = Vector2(222, 332)
		back_img.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		back_img.size_flags_vertical = Control.SIZE_EXPAND_FILL
		back_img.texture = back_tex
		back_img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		back_img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		back_img.mouse_filter = Control.MOUSE_FILTER_IGNORE
		back_panel.add_child(back_img)

		var idx_capture := i
		back_panel.gui_input.connect(func(ev: InputEvent):
			if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed:
				reveal_card(idx_capture)
		)
		back_panel.mouse_entered.connect(func():
			AudioManager.play_sfx("ui_hover", 0.03, 0.42)
			if not ThemeHelper.reduced_motion:
				var tw_h := back_panel.create_tween()
				tw_h.tween_property(back_panel, "scale", Vector2(1.045, 1.045), 0.12).set_trans(Tween.TRANS_BACK)
		)
		back_panel.mouse_exited.connect(func():
			if not ThemeHelper.reduced_motion:
				var tw_h := back_panel.create_tween()
				tw_h.tween_property(back_panel, "scale", Vector2.ONE, 0.12)
		)
		slot_root.add_child(back_panel)

		var cw := CardWidget.new()
		cw.name = "FaceCard"
		cw.visible = false
		cw.position = Vector2(5, 5)
		var cdata: Dictionary = _results[i]["card"]
		var rolled_foil := str(_results[i].get("finish", "plain"))
		# a foiled print carries one extra footer line, so the slot grows with it
		var card_h := 326 + (17 if GameData.get_finish_rank(rolled_foil) > 0 else 0)
		cw.size = Vector2(216, card_h)
		cw.pivot_offset = Vector2(108, card_h * 0.5)
		cw.setup_card(cdata, true, CrewManager.get_copies(cdata["id"]), false, false, rolled_foil)
		slot_root.add_child(cw)

		var tag_lbl := Label.new()
		tag_lbl.name = "TagLbl"
		tag_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if ThemeHelper.font_bold:
			tag_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
		tag_lbl.add_theme_font_size_override("font_size", 15)
		tag_lbl.text = " "
		holder.add_child(tag_lbl)

		if not ThemeHelper.reduced_motion:
			holder.modulate.a = 0.0
			back_panel.scale = Vector2(0.76, 0.76)
			var tw_in := holder.create_tween()
			if i > 0:
				tw_in.tween_interval(0.08 * float(i))
			tw_in.tween_property(holder, "modulate:a", 1.0, 0.20)
			tw_in.parallel().tween_property(back_panel, "scale", Vector2.ONE, 0.24).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

		_card_slots.append(holder)

func reveal_card(idx: int) -> void:
	if idx < 0 or idx >= _card_slots.size() or _revealed_flags[idx]:
		return
	_revealed_flags[idx] = true

	var holder: Control = _card_slots[idx]
	var slot_root: Control = holder.get_child(0)
	var back_btn: Control = slot_root.get_node("BackBtn")
	var face_card: CardWidget = slot_root.get_node("FaceCard")
	var tag_lbl: Label = holder.get_node("TagLbl")

	var entry: Dictionary = _results[idx]
	var rarity: String = entry["card"]["rarity"]
	var r_tier := GameData.RARITY_ORDER.find(rarity)

	if r_tier >= 4:
		AudioManager.play_sfx("card_legendary", 0.02, 0.92)
	else:
		AudioManager.play_sfx("card_flip", 0.03, 0.85)

	var fast := 0.3 if ThemeHelper.reduced_motion else 1.0
	var tw := create_tween()
	tw.tween_property(back_btn, "scale:x", 0.0, 0.14 * fast).set_trans(Tween.TRANS_SINE)
	tw.tween_callback(func():
		back_btn.visible = false
		face_card.visible = true
		face_card.scale = Vector2(0.05, 1.10)
		var frak := GameData.get_finish_rank(str(entry.get("finish", "plain")))
		if bool(entry.get("finish_upgraded", false)):
			# the rarest moment of a pack: the print itself got better
			AudioManager.play_sfx("card_legendary", 0.02, 1.05)
			tag_lbl.text = L.tr_ui("foil_upgraded", [L.foil_name(str(entry["finish"]))])
			tag_lbl.add_theme_color_override("font_color", Color(0.62, 1.0, 0.90))
		elif bool(entry["is_new"]):
			tag_lbl.text = L.tr_ui("new_card_tag")
			tag_lbl.add_theme_color_override("font_color", Color(0.32, 1.0, 0.66))
		else:
			tag_lbl.text = L.tr_ui("dup_card_tag", [int(entry["duplicate_credits"])])
			tag_lbl.add_theme_color_override("font_color", Color(1.0, 0.84, 0.32))
		if frak >= 3 and not bool(entry.get("finish_upgraded", false)):
			tag_lbl.text += "  •  " + L.foil_name(str(entry["finish"])).to_upper()
	)
	var peak := 1.15 if r_tier >= 4 else 1.06
	tw.tween_property(face_card, "scale", Vector2(peak, peak), 0.18 * fast).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(face_card, "scale", Vector2.ONE, 0.14 * fast)
	tw.tween_callback(_check_all_revealed)

func reveal_all_remaining() -> void:
	for i in range(_card_slots.size()):
		if not _revealed_flags[i]:
			reveal_card(i)

func _check_all_revealed() -> void:
	for fl in _revealed_flags:
		if not fl:
			return
	stage = Stage.SUMMARY
	_title_lbl.text = L.tr_ui("pack_ceremony_done")
	_reveal_all_btn.visible = false
	_done_btn.visible = true
	ThemeHelper.animate_entry(_done_btn, 0.05)

func _close_ceremony() -> void:
	AudioManager.play_sfx("ui_back", 0.02, 0.72)
	visible = false
	stage = Stage.IDLE
	ceremony_finished.emit()
