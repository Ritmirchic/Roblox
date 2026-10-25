class_name PackOpeningModal
extends Control

signal ceremony_finished

var _backdrop: ColorRect
var _stage_area: Control
var _pack_tex: TextureRect
var _flash_rect: ColorRect
var _particle_layer: Control
var _cards_row: HBoxContainer
var _title_lbl: Label
var _summary_lbl: Label
var _skip_btn: Button
var _collect_btn: Button

var _results: Array[Dictionary] = []
var _fifth_unlocked: bool = false
var _skipped: bool = false
var _revealed_done: bool = false
var _float_time: float = 0.0
var _floating_pack: bool = false
var _sparks_2d: Array[ColorRect] = []

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	_build_ui()

func _build_ui() -> void:
	_backdrop = ColorRect.new()
	_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	_backdrop.color = Color(0.015, 0.025, 0.06, 0.96)
	add_child(_backdrop)

	_particle_layer = Control.new()
	_particle_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_particle_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_particle_layer)

	_stage_area = Control.new()
	_stage_area.set_anchors_preset(Control.PRESET_FULL_RECT)
	_stage_area.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_stage_area)

	_title_lbl = Label.new()
	_title_lbl.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_title_lbl.offset_top = 34
	_title_lbl.offset_bottom = 86
	_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_display:
		_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_title_lbl.add_theme_font_size_override("font_size", 34)
	_title_lbl.add_theme_color_override("font_color", Color(0.42, 0.90, 1.0))
	add_child(_title_lbl)

	_pack_tex = TextureRect.new()
	_pack_tex.custom_minimum_size = Vector2(270, 384)
	_pack_tex.size = Vector2(270, 384)
	_pack_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_pack_tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_stage_area.add_child(_pack_tex)

	_cards_row = HBoxContainer.new()
	_cards_row.set_anchors_preset(Control.PRESET_CENTER)
	_cards_row.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_cards_row.grow_vertical = Control.GROW_DIRECTION_BOTH
	_cards_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_cards_row.add_theme_constant_override("separation", 42)
	add_child(_cards_row)

	_summary_lbl = Label.new()
	_summary_lbl.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_summary_lbl.offset_top = -158
	_summary_lbl.offset_bottom = -96
	_summary_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if ThemeHelper.font_bold:
		_summary_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_summary_lbl.add_theme_font_size_override("font_size", 24)
	add_child(_summary_lbl)

	_skip_btn = Button.new()
	_skip_btn.text = "SKIP ANIMATION"
	_skip_btn.custom_minimum_size = Vector2(190, 44)
	_skip_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_skip_btn.offset_left = -220
	_skip_btn.offset_right = -30
	_skip_btn.offset_top = 28
	_skip_btn.offset_bottom = 72
	ThemeHelper.wire_button_fx(_skip_btn)
	_skip_btn.pressed.connect(_on_skip_pressed)
	add_child(_skip_btn)

	_collect_btn = Button.new()
	_collect_btn.text = "COLLECT CARDS TO VAULT"
	_collect_btn.custom_minimum_size = Vector2(310, 52)
	_collect_btn.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_collect_btn.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_collect_btn.offset_left = -155
	_collect_btn.offset_right = 155
	_collect_btn.offset_top = -84
	_collect_btn.offset_bottom = -32
	ThemeHelper.style_accent_button(_collect_btn, Color(0.18, 0.72, 0.96))
	_collect_btn.pressed.connect(_on_collect_pressed)
	add_child(_collect_btn)

	_flash_rect = ColorRect.new()
	_flash_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	_flash_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_flash_rect.color = Color(1, 1, 1, 0)
	add_child(_flash_rect)

func _process(delta: float) -> void:
	if not visible:
		return
	if _floating_pack and is_instance_valid(_pack_tex) and not ThemeHelper.reduced_motion:
		_float_time += delta
		var center := get_viewport_rect().size * 0.5 - _pack_tex.size * 0.5
		_pack_tex.position = center + Vector2(0.0, sin(_float_time * 4.2) * 14.0)
		_pack_tex.rotation = sin(_float_time * 2.8) * 0.045

func play_pack_ceremony(pack_id: String, results: Array[Dictionary], fifth_slot_won: bool) -> void:
	_results = results
	_fifth_unlocked = fifth_slot_won
	_skipped = ThemeHelper.reduced_motion
	_revealed_done = false
	visible = true
	_collect_btn.visible = false
	_skip_btn.visible = not ThemeHelper.reduced_motion
	_summary_lbl.text = ""
	_backdrop.color = Color(0.015, 0.025, 0.06, 0.96)

	for ch in _cards_row.get_children():
		ch.queue_free()
	for sp in _sparks_2d:
		if is_instance_valid(sp):
			sp.queue_free()
	_sparks_2d.clear()

	var pdef: Dictionary = PackManager.PACK_TYPES.get(pack_id, PackManager.PACK_TYPES["standard"])
	_title_lbl.text = str(pdef["name"]).to_upper()
	if ResourceLoader.exists(str(pdef["art"])):
		_pack_tex.texture = load(str(pdef["art"]))

	var vp_size := get_viewport_rect().size
	if vp_size.x < 100:
		vp_size = Vector2(1600, 900)
	_pack_tex.pivot_offset = _pack_tex.size * 0.5
	_pack_tex.position = vp_size * 0.5 - _pack_tex.size * 0.5
	_pack_tex.scale = Vector2(0.2, 0.2)
	_pack_tex.rotation = 0.0
	_pack_tex.visible = true
	_pack_tex.modulate = Color(1, 1, 1, 1)

	if _skipped:
		_show_instant_reveal()
		return

	# Stage 1 & 2: Pack appears & floats
	_floating_pack = true
	AudioManager.play_sfx("pack_open", 0.02, 0.9)
	var tw := create_tween()
	tw.tween_property(_pack_tex, "scale", Vector2.ONE, 0.38).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await tw.finished
	if _skipped:
		return

	# Stage 3: Particles gather around pack
	_spawn_pack_particles(vp_size * 0.5, Color(0.28, 0.88, 1.0), 28, true)
	await get_tree().create_timer(0.52).timeout
	if _skipped:
		return

	# Stage 4: Pack opens in radiant burst
	_floating_pack = false
	var tw2 := create_tween()
	tw2.tween_property(_pack_tex, "scale", Vector2(1.26, 1.26), 0.20)
	tw2.parallel().tween_property(_flash_rect, "color", Color(0.85, 0.96, 1.0, 0.85), 0.18)
	await tw2.finished
	if _skipped:
		return

	_pack_tex.visible = false
	_spawn_pack_particles(vp_size * 0.5, Color(1.0, 0.85, 0.35), 34, false)
	var tw_flash := create_tween()
	tw_flash.tween_property(_flash_rect, "color", Color(1, 1, 1, 0.0), 0.34)

	# Stage 5 & 6: Three cards emerge face-down & rotate into place
	var back_tex: Texture2D = load("res://assets/cards/card_back.png")
	var slots: Array[Control] = []
	for i in range(_results.size()):
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(244, 360)
		holder.pivot_offset = Vector2(122, 180)
		holder.scale = Vector2(0.15, 0.15)
		holder.rotation_degrees = -18.0 + float(i) * 18.0
		_cards_row.add_child(holder)

		var back_rect := TextureRect.new()
		back_rect.name = "CardBack"
		back_rect.texture = back_tex
		back_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		back_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		back_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
		holder.add_child(back_rect)
		slots.append(holder)

	for i in range(slots.size()):
		var stw := create_tween()
		stw.tween_property(slots[i], "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		stw.parallel().tween_property(slots[i], "rotation_degrees", 0.0, 0.28)
		await get_tree().create_timer(0.10).timeout
		if _skipped:
			return

	await get_tree().create_timer(0.24).timeout
	if _skipped:
		return

	# Stage 7 & 8: Cards flip sequentially with per-rarity effects!
	for i in range(_results.size()):
		if _skipped:
			return
		var res_item: Dictionary = _results[i]
		var cdef: Dictionary = res_item["card"]
		var rar: String = cdef["rarity"]
		var slot_ctrl := slots[i]

		# Secret rarity eclipse dramatic pause
		if rar == "Secret":
			var etw := create_tween()
			etw.tween_property(_backdrop, "color", Color(0.08, 0.01, 0.04, 0.99), 0.25)
			await etw.finished
			if _skipped:
				return

		AudioManager.play_sfx("card_flip", 0.04, 0.85)
		var ftw1 := create_tween()
		ftw1.tween_property(slot_ctrl, "scale:x", 0.02, 0.16)
		await ftw1.finished
		if _skipped:
			return

		var back_node := slot_ctrl.get_node_or_null("CardBack")
		if back_node:
			back_node.visible = false
		var cw := _build_result_card_panel(res_item)
		cw.set_anchors_preset(Control.PRESET_FULL_RECT)
		slot_ctrl.add_child(cw)

		_play_rarity_reveal_vfx(slot_ctrl.global_position + slot_ctrl.size * 0.5, rar)

		var ftw2 := create_tween()
		ftw2.tween_property(slot_ctrl, "scale:x", 1.0, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		await ftw2.finished
		await get_tree().create_timer(0.22).timeout

	# Stage 9: Rewards summary
	_finalize_summary()

func _play_rarity_reveal_vfx(center_pos: Vector2, rarity: String) -> void:
	var rcol: Color = GameData.RARITY_COLORS.get(rarity, Color.WHITE)
	match rarity:
		"Common":
			_spawn_pack_particles(center_pos, Color(0.82, 0.88, 0.96), 8, false)
		"Uncommon":
			_spawn_pack_particles(center_pos, rcol, 14, false)
		"Rare":
			_spawn_pack_particles(center_pos, Color(0.20, 0.72, 1.0), 22, false)
		"Epic":
			_spawn_pack_particles(center_pos, Color(0.78, 0.32, 1.0), 30, false)
		"Legendary":
			AudioManager.play_sfx("card_legendary", 0.02, 0.95)
			_spawn_pack_particles(center_pos, Color(1.0, 0.82, 0.20), 42, false)
			_pulse_screen_flash(Color(1.0, 0.84, 0.28, 0.38))
		"Mythic":
			AudioManager.play_sfx("card_legendary", 0.05, 1.0)
			_backdrop.color = Color(0.05, 0.02, 0.14, 0.97)
			_spawn_pack_particles(center_pos, Color(0.25, 0.98, 0.94), 52, false)
			_pulse_screen_flash(Color(0.35, 0.95, 1.0, 0.45))
		"Secret":
			AudioManager.play_sfx("card_legendary", -0.06, 1.0)
			_spawn_pack_particles(center_pos, Color(1.0, 0.22, 0.48), 60, false)
			_pulse_screen_flash(Color(1.0, 0.24, 0.52, 0.55))

func _pulse_screen_flash(col: Color) -> void:
	_flash_rect.color = col
	var tw := create_tween()
	tw.tween_property(_flash_rect, "color", Color(col.r, col.g, col.b, 0.0), 0.42)

func _spawn_pack_particles(origin: Vector2, col: Color, count: int, inward: bool) -> void:
	if ThemeHelper.reduced_motion:
		return
	for _i in range(count):
		var dot := ColorRect.new()
		var sz := randf_range(5.0, 12.0)
		dot.size = Vector2(sz, sz)
		dot.color = col.lightened(randf_range(0.0, 0.35))
		dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_particle_layer.add_child(dot)
		_sparks_2d.append(dot)

		var ang := randf() * TAU
		var dist := randf_range(90.0, 260.0)
		var outer := origin + Vector2(cos(ang), sin(ang)) * dist
		dot.position = outer if inward else origin
		var target := origin if inward else outer

		var ptw := create_tween()
		ptw.tween_property(dot, "position", target, randf_range(0.35, 0.65)).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		ptw.parallel().tween_property(dot, "modulate:a", 0.0, 0.65)
		ptw.tween_callback(dot.queue_free)

func _build_result_card_panel(res_item: Dictionary) -> VBoxContainer:
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 6)

	var cdef: Dictionary = res_item["card"]
	var cw := CardWidget.new()
	cw.setup(cdef, true, 1, false, false)
	cw.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(cw)

	var tag := Label.new()
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if bool(res_item["is_new"]):
		tag.text = "NEW CREW RECRUITED!"
		tag.add_theme_color_override("font_color", Color(0.32, 1.0, 0.64))
	else:
		tag.text = "DUPLICATE  +%d CREDITS" % int(res_item["duplicate_credits"])
		tag.add_theme_color_override("font_color", Color(1.0, 0.82, 0.36))
	if ThemeHelper.font_bold:
		tag.add_theme_font_override("font", ThemeHelper.font_bold)
	tag.add_theme_font_size_override("font_size", 17)
	vb.add_child(tag)
	return vb

func _show_instant_reveal() -> void:
	_floating_pack = false
	_pack_tex.visible = false
	_flash_rect.color = Color(1, 1, 1, 0)
	for ch in _cards_row.get_children():
		ch.queue_free()
	for res_item in _results:
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(244, 360)
		_cards_row.add_child(holder)
		var cw := _build_result_card_panel(res_item)
		cw.set_anchors_preset(Control.PRESET_FULL_RECT)
		holder.add_child(cw)
	_finalize_summary()

func _finalize_summary() -> void:
	_revealed_done = true
	_skip_btn.visible = false
	_collect_btn.visible = true
	var new_cnt := 0
	var dup_cr := 0
	for r in _results:
		if bool(r["is_new"]):
			new_cnt += 1
		dup_cr += int(r["duplicate_credits"])

	var msg := "Pack Complete: %d New Crew" % new_cnt
	if dup_cr > 0:
		msg += "  •  +%d Bonus Credits" % dup_cr
	if _fifth_unlocked:
		msg = "1% JACKPOT! PERMANENT 5TH ACTIVE UPGRADE SLOT UNLOCKED!  •  " + msg
		_summary_lbl.add_theme_color_override("font_color", Color(1.0, 0.86, 0.25))
	else:
		_summary_lbl.add_theme_color_override("font_color", Color(0.84, 0.94, 1.0))
	_summary_lbl.text = msg

func _on_skip_pressed() -> void:
	if _revealed_done:
		return
	_skipped = true
	_show_instant_reveal()

func _on_collect_pressed() -> void:
	# Stage 10: Cards enter collection cleanly
	if not ThemeHelper.reduced_motion:
		var tw := create_tween()
		tw.tween_property(_cards_row, "scale", Vector2(0.25, 0.25), 0.20)
		tw.parallel().tween_property(self, "modulate:a", 0.0, 0.20)
		await tw.finished
		_cards_row.scale = Vector2.ONE
		modulate.a = 1.0
	visible = false
	ceremony_finished.emit()
