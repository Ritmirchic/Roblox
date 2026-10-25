extends Control
class_name HangarStationPanels

signal launch_sector_requested(sector_idx: int)
signal select_module_for_editor(mod_id: String)
signal panel_closed

var current_tab: String = ""
var standalone_settings_mode: bool = false

var _modal_box: PanelContainer
var _nav_strip: HBoxContainer
var _title_lbl: Label
var _hdr_credits_lbl: Label
var _hdr_crystals_lbl: Label
var _close_btn: Button
var _body_root: Control
var _pack_modal: PackOpeningModal
var _ach_timer_lbl: Label = null
var _ach_subcat: String = "minute"
var _shop_cat_filter: String = "All"
var _selected_crew_id: String = "crew_01"
var _floating_packs: Array[Control] = []
var _anim_clock: float = 0.0

const NAV_TABS: Array[Array] = [
	["shop", "tab_shop"],
	["crew", "tab_crew"],
	["packs", "tab_packs"],
	["upgrades", "tab_upgrades"],
	["achievements", "tab_achievements"],
	["launch", "tab_launch"],
	["settings", "tab_settings"],
]

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	_build_shell()
	AchievementManager.achievements_updated.connect(_on_live_data_changed)
	ShipGrid.credits_changed.connect(func(_c): _update_header_currencies())
	ShipGrid.crystals_changed.connect(func(_c): _update_header_currencies())
	L.language_changed.connect(func(_lang: String):
		if visible and not current_tab.is_empty():
			open_tab(current_tab)
	)

func _process(delta: float) -> void:
	if not visible:
		return
	_anim_clock += delta
	if current_tab == "achievements" and is_instance_valid(_ach_timer_lbl):
		var rem := AchievementManager.get_seconds_until_reset(_ach_subcat)
		_ach_timer_lbl.text = L.tr_ui("ach_timer", [_format_duration(rem), AchievementManager.collected_album.size()])
	if current_tab == "packs" and not ThemeHelper.reduced_motion:
		for i in range(_floating_packs.size()):
			var fp := _floating_packs[i]
			if is_instance_valid(fp):
				fp.position.y = sin(_anim_clock * 2.3 + float(i) * 1.6) * 5.5

func _format_duration(sec: int) -> String:
	var d := sec / 86400
	var h := (sec % 86400) / 3600
	var m := (sec % 3600) / 60
	var s := sec % 60
	if d > 0:
		return "%dd %02dh %02dm %02ds" % [d, h, m, s]
	elif h > 0:
		return "%02dh %02dm %02ds" % [h, m, s]
	return "%02dm %02ds" % [m, s]

func _build_shell() -> void:
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.008, 0.016, 0.042, 0.84)
	dim.gui_input.connect(func(ev: InputEvent):
		if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed:
			close_panel()
	)
	add_child(dim)

	_modal_box = PanelContainer.new()
	_modal_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	_modal_box.offset_left = 36
	_modal_box.offset_right = -36
	_modal_box.offset_top = 64
	_modal_box.offset_bottom = -18
	_modal_box.mouse_filter = Control.MOUSE_FILTER_STOP
	_modal_box.add_theme_stylebox_override(
		"panel",
		ThemeHelper.make_panel_style(Color(0.024, 0.046, 0.105, 0.97), Color(0.22, 0.78, 1.0, 0.88), 16, 2, 18)
	)
	add_child(_modal_box)

	var main_vb := VBoxContainer.new()
	main_vb.add_theme_constant_override("separation", 10)
	_modal_box.add_child(main_vb)

	# Top Bar: Title + Live Balances + Close [ESC]
	var hdr := HBoxContainer.new()
	hdr.add_theme_constant_override("separation", 14)
	main_vb.add_child(hdr)

	_title_lbl = Label.new()
	_title_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_title_lbl.clip_text = true
	if ThemeHelper.font_display:
		_title_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_title_lbl.add_theme_font_size_override("font_size", 22)
	_title_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	hdr.add_child(_title_lbl)

	var cr_pill := PanelContainer.new()
	cr_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.08, 0.12, 0.22, 0.92), Color(1.0, 0.78, 0.24, 0.65), 8, 10, 4))
	hdr.add_child(cr_pill)
	_hdr_credits_lbl = Label.new()
	if ThemeHelper.font_bold:
		_hdr_credits_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_hdr_credits_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	cr_pill.add_child(_hdr_credits_lbl)

	var cry_pill := PanelContainer.new()
	cry_pill.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.06, 0.14, 0.24, 0.92), Color(0.24, 0.90, 1.0, 0.65), 8, 10, 4))
	hdr.add_child(cry_pill)
	_hdr_crystals_lbl = Label.new()
	if ThemeHelper.font_bold:
		_hdr_crystals_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	_hdr_crystals_lbl.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	cry_pill.add_child(_hdr_crystals_lbl)

	_close_btn = Button.new()
	_close_btn.custom_minimum_size = Vector2(148, 38)
	ThemeHelper.style_accent_button(_close_btn, Color(0.86, 0.26, 0.34))
	_close_btn.pressed.connect(close_panel)
	hdr.add_child(_close_btn)

	# Integrated Quick Station Switcher Strip
	_nav_strip = HBoxContainer.new()
	_nav_strip.add_theme_constant_override("separation", 6)
	main_vb.add_child(_nav_strip)

	var sep := HSeparator.new()
	sep.modulate = Color(0.22, 0.72, 1.0, 0.40)
	main_vb.add_child(sep)

	_body_root = Control.new()
	_body_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_body_root.clip_contents = true
	main_vb.add_child(_body_root)

	_pack_modal = PackOpeningModal.new()
	_pack_modal.ceremony_finished.connect(func():
		if visible and current_tab == "packs":
			open_tab("packs")
	)
	add_child(_pack_modal)

func _update_header_currencies() -> void:
	if is_instance_valid(_hdr_credits_lbl):
		_hdr_credits_lbl.text = "%d CR" % ShipGrid.credits
	if is_instance_valid(_hdr_crystals_lbl):
		_hdr_crystals_lbl.text = "%d CRY" % ShipGrid.crystals

func _rebuild_nav_strip() -> void:
	for c in _nav_strip.get_children():
		c.queue_free()
	_nav_strip.visible = not standalone_settings_mode
	if standalone_settings_mode:
		return
	for pair in NAV_TABS:
		var tid: String = pair[0]
		var lkey: String = pair[1]
		var b := Button.new()
		b.text = L.tr_ui(lkey)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.clip_text = true
		b.custom_minimum_size = Vector2(0, 36)
		if tid == current_tab:
			ThemeHelper.style_accent_button(b, Color(0.18, 0.76, 1.0) if tid != "launch" else Color(0.16, 0.82, 0.52))
		elif tid == "launch":
			ThemeHelper.style_accent_button(b, Color(0.14, 0.62, 0.42))
		else:
			ThemeHelper.wire_button_fx(b)
		b.pressed.connect(func(): open_tab(tid))
		_nav_strip.add_child(b)

func open_tab(tab_name: String) -> void:
	var was_hidden := not visible
	current_tab = tab_name
	visible = true
	_floating_packs.clear()
	_close_btn.text = L.tr_ui("close")
	_update_header_currencies()
	_rebuild_nav_strip()

	for c in _body_root.get_children():
		c.queue_free()

	match tab_name:
		"shop":
			_title_lbl.text = L.tr_ui("tab_shop").to_upper()
			_build_shop_tab()
		"crew":
			_title_lbl.text = L.tr_ui("tab_crew").to_upper()
			_build_crew_tab()
		"packs":
			_title_lbl.text = L.tr_ui("tab_packs").to_upper()
			_build_packs_tab()
		"upgrades":
			_title_lbl.text = L.tr_ui("tab_upgrades").to_upper()
			_build_upgrades_tab()
		"achievements":
			_title_lbl.text = L.tr_ui("tab_achievements").to_upper()
			_build_achievements_tab()
		"launch":
			_title_lbl.text = L.tr_ui("tab_launch").to_upper()
			_build_launch_tab()
		"settings":
			_title_lbl.text = L.tr_ui("tab_settings").to_upper()
			_build_settings_tab()

	if was_hidden:
		ThemeHelper.animate_entry(_modal_box, 0.0, Vector2(0.96, 0.96))
	else:
		ThemeHelper.animate_entry(_body_root, 0.0, Vector2(0.985, 0.985))

func close_panel() -> void:
	if _pack_modal.visible:
		return
	AudioManager.play_sfx("ui_back", 0.02, 0.72)
	visible = false
	current_tab = ""
	panel_closed.emit()

func _on_live_data_changed() -> void:
	if visible and current_tab == "achievements":
		open_tab("achievements")

# ==============================================================================
# 1. EQUIPMENT SHOP & MODULE UPGRADER
# ==============================================================================
func _build_shop_tab() -> void:
	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 16)
	_body_root.add_child(row)

	var left_vb := VBoxContainer.new()
	left_vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_vb.size_flags_stretch_ratio = 2.05
	left_vb.add_theme_constant_override("separation", 10)
	row.add_child(left_vb)

	var filter_flow := HFlowContainer.new()
	filter_flow.add_theme_constant_override("h_separation", 8)
	filter_flow.add_theme_constant_override("v_separation", 6)
	left_vb.add_child(filter_flow)

	for cat in ["All", "Propulsion", "Mining", "Collection", "Weapons", "Defense", "Utility"]:
		var fb := Button.new()
		fb.text = L.cat_name(cat)
		fb.custom_minimum_size = Vector2(96, 34)
		if _shop_cat_filter == cat:
			ThemeHelper.style_accent_button(fb, Color(0.20, 0.76, 1.0))
		else:
			ThemeHelper.wire_button_fx(fb)
		fb.pressed.connect(func():
			_shop_cat_filter = cat
			open_tab("shop")
		)
		filter_flow.add_child(fb)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	left_vb.add_child(sc)

	var grid := GridContainer.new()
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	sc.add_child(grid)

	for mid in GameData.modules.keys():
		if mid in ["cockpit_mk1", "hull_cell"]:
			continue
		var m: Dictionary = GameData.modules[mid]
		if _shop_cat_filter != "All" and m["category"] != _shop_cat_filter:
			continue

		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var card_border := Color(0.24, 0.90, 1.0, 0.85) if m.has("bullet_magnet_range") else Color(0.18, 0.48, 0.78, 0.72)
		card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, card_border, 12, 2, 12))
		grid.add_child(card)

		var cv := VBoxContainer.new()
		cv.add_theme_constant_override("separation", 6)
		card.add_child(cv)

		var top := HBoxContainer.new()
		top.add_theme_constant_override("separation", 10)
		cv.add_child(top)

		var icon_box := PanelContainer.new()
		icon_box.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.03, 0.055, 0.12, 0.95), Color(0.22, 0.62, 0.92, 0.45), 9, 4, 4))
		top.add_child(icon_box)

		var icon := TextureRect.new()
		icon.custom_minimum_size = Vector2(58, 58)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(m["icon_path"]):
			icon.texture = load(m["icon_path"])
		icon_box.add_child(icon)

		var title_vb := VBoxContainer.new()
		title_vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		title_vb.add_theme_constant_override("separation", 2)
		top.add_child(title_vb)

		var nl := Label.new()
		nl.text = L.mod_name(mid)
		nl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		if ThemeHelper.font_bold:
			nl.add_theme_font_override("font", ThemeHelper.font_bold)
		nl.add_theme_font_size_override("font_size", 16)
		title_vb.add_child(nl)

		var owned_cnt := ShipGrid.get_unplaced_count(mid)
		var sub := Label.new()
		sub.text = "%s • %.1ft • HP %.0f • %s" % [L.cat_name(str(m["category"])), float(m["mass"]), float(m["max_hp"]), L.tr_ui("owned_stock", [owned_cnt])]
		sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sub.add_theme_font_size_override("font_size", 12)
		sub.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
		title_vb.add_child(sub)

		var dl := Label.new()
		dl.text = L.mod_desc(mid)
		dl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		dl.size_flags_vertical = Control.SIZE_EXPAND_FILL
		dl.add_theme_font_size_override("font_size", 13)
		dl.add_theme_color_override("font_color", Color(0.82, 0.91, 1.0))
		cv.add_child(dl)

		var buy_btn := Button.new()
		var price: int = int(m["price"])
		buy_btn.text = L.tr_ui("buy_btn", [price])
		buy_btn.disabled = ShipGrid.credits < price
		ThemeHelper.style_accent_button(buy_btn, Color(0.18, 0.78, 0.50))
		buy_btn.pressed.connect(func():
			var res := ShipGrid.buy_equipment(mid)
			if res["ok"]:
				AudioManager.play_sfx("buy_upgrade", 0.03, 0.85)
				SaveManager.save_game()
				select_module_for_editor.emit(mid)
				open_tab("shop")
		)
		cv.add_child(buy_btn)

	ThemeHelper.animate_grid_stagger(grid, 0.018, 12)

	# Right Column: Installed Module Upgrader (Lv 1-5)
	var right_panel := PanelContainer.new()
	right_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_panel.size_flags_stretch_ratio = 1.0
	right_panel.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.032, 0.06, 0.13, 0.95), Color(0.22, 0.65, 0.92, 0.65), 12, 1, 12))
	row.add_child(right_panel)

	var right_vb := VBoxContainer.new()
	right_vb.add_theme_constant_override("separation", 8)
	right_panel.add_child(right_vb)

	var rhdr := Label.new()
	rhdr.text = L.tr_ui("shop_installed_hdr")
	rhdr.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if ThemeHelper.font_bold:
		rhdr.add_theme_font_override("font", ThemeHelper.font_bold)
	rhdr.add_theme_font_size_override("font_size", 15)
	rhdr.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	right_vb.add_child(rhdr)

	var rsc := ScrollContainer.new()
	rsc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rsc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	right_vb.add_child(rsc)

	var rlist := VBoxContainer.new()
	rlist.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rlist.add_theme_constant_override("separation", 8)
	rsc.add_child(rlist)

	for uid in ShipGrid.placed_modules.keys():
		var entry: Dictionary = ShipGrid.placed_modules[uid]
		var mid: String = entry["mod_id"]
		if mid in ["cockpit_mk1", "hull_cell"]:
			continue
		var m: Dictionary = GameData.modules[mid]
		var lvl: int = int(entry["level"])

		var row_card := PanelContainer.new()
		row_card.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.05, 0.095, 0.19, 0.94), Color(0.20, 0.56, 0.85, 0.55), 9, 10, 8))
		rlist.add_child(row_card)

		var rvb := VBoxContainer.new()
		rvb.add_theme_constant_override("separation", 5)
		row_card.add_child(rvb)

		var il := Label.new()
		il.text = "%s  [Lv.%d/5]" % [L.mod_name(mid), lvl]
		il.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		if ThemeHelper.font_bold:
			il.add_theme_font_override("font", ThemeHelper.font_bold)
		il.add_theme_font_size_override("font_size", 14)
		rvb.add_child(il)

		var up_btn := Button.new()
		if lvl >= 5:
			up_btn.text = L.tr_ui("max_level")
			up_btn.disabled = true
		else:
			var ucost := int(round(float(m["price"]) * 0.65 * float(lvl)))
			up_btn.text = L.tr_ui("upgrade_btn", [ucost])
			up_btn.disabled = ShipGrid.credits < ucost
			ThemeHelper.style_accent_button(up_btn, Color(0.22, 0.68, 0.98))
			var uid_cap: int = int(uid)
			up_btn.pressed.connect(func():
				var ures := ShipGrid.upgrade_installed_module(uid_cap)
				if ures["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.04, 0.9)
					SaveManager.save_game()
					open_tab("shop")
			)
		rvb.add_child(up_btn)

# ==============================================================================
# 2. CREW CARDS COLLECTION & BRIDGE HERO DOSSIER (42 CARDS)
# ==============================================================================
func _build_crew_tab() -> void:
	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 16)
	_body_root.add_child(row)

	var left_vb := VBoxContainer.new()
	left_vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_vb.size_flags_stretch_ratio = 2.25
	left_vb.add_theme_constant_override("separation", 8)
	row.add_child(left_vb)

	var slot_info := Label.new()
	var max_slots := ShipGrid.get_unlocked_crew_slots()
	slot_info.text = L.tr_ui("crew_active_bridge", [CrewManager.equipped_crew.size(), max_slots, CrewManager.get_unique_owned_count()])
	if ThemeHelper.font_bold:
		slot_info.add_theme_font_override("font", ThemeHelper.font_bold)
	slot_info.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	left_vb.add_child(slot_info)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	left_vb.add_child(sc)

	var grid := HFlowContainer.new()
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	sc.add_child(grid)

	# Right Hero Showcase Dossier Panel
	var insp := PanelContainer.new()
	insp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	insp.size_flags_stretch_ratio = 1.0
	insp.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.032, 0.058, 0.13, 0.96), Color(0.24, 0.72, 1.0, 0.75), 14, 2, 14))
	row.add_child(insp)

	var ivb := VBoxContainer.new()
	ivb.name = "CrewInspector"
	ivb.alignment = BoxContainer.ALIGNMENT_CENTER
	ivb.add_theme_constant_override("separation", 10)
	insp.add_child(ivb)

	for c in GameData.crew_cards:
		var cid: String = c["id"]
		var owned := CrewManager.is_owned(cid)
		var copies := CrewManager.get_copies(cid)
		var eq := CrewManager.equipped_crew.has(cid)
		var cw := CardWidget.new()
		cw.setup_card(c, owned, copies, eq, true)
		cw.card_clicked.connect(func(clicked_id: String):
			_selected_crew_id = clicked_id
			_populate_crew_inspector(ivb, clicked_id)
		)
		grid.add_child(cw)

	ThemeHelper.animate_grid_stagger(grid, 0.014, 15)
	_populate_crew_inspector(ivb, _selected_crew_id)

func _populate_crew_inspector(ivb: VBoxContainer, cid: String) -> void:
	for ch in ivb.get_children():
		ch.queue_free()
	if not GameData.crew_by_id.has(cid):
		return
	var c: Dictionary = GameData.crew_by_id[cid]
	var owned := CrewManager.is_owned(cid)
	var eq := CrewManager.equipped_crew.has(cid)
	var rarity: String = str(c["rarity"])
	var rcol: Color = GameData.RARITY_COLORS.get(rarity, Color.WHITE)

	# Large Hero Portrait Showcase Window
	var hero_frame := PanelContainer.new()
	hero_frame.custom_minimum_size = Vector2(216, 264)
	hero_frame.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	hero_frame.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
	var hf_sb := StyleBoxFlat.new()
	hf_sb.bg_color = Color(0.02, 0.035, 0.08, 1.0)
	hf_sb.border_color = rcol if owned else Color(0.35, 0.42, 0.52)
	hf_sb.set_border_width_all(3)
	hf_sb.set_corner_radius_all(14)
	hf_sb.shadow_color = rcol * Color(1, 1, 1, 0.35)
	hf_sb.shadow_size = 16
	hero_frame.add_theme_stylebox_override("panel", hf_sb)
	ivb.add_child(hero_frame)

	var p_img := TextureRect.new()
	p_img.set_anchors_preset(Control.PRESET_FULL_RECT)
	p_img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	p_img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	if ResourceLoader.exists(str(c["portrait"])):
		p_img.texture = load(str(c["portrait"]))
	if not owned:
		p_img.modulate = Color(0.28, 0.32, 0.40)
	hero_frame.add_child(p_img)

	var title := Label.new()
	title.text = "#%02d  %s" % [int(c["number"]), str(c["name"])]
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if ThemeHelper.font_display:
		title.add_theme_font_override("font", ThemeHelper.font_display)
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", rcol.lightened(0.22))
	ivb.add_child(title)

	var rtag := Label.new()
	rtag.text = "%s  •  %s" % [L.rarity_name(rarity).to_upper(), L.role_name(str(c["role"]))]
	rtag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rtag.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
	ivb.add_child(rtag)

	var bonus_box := PanelContainer.new()
	bonus_box.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.06, 0.11, 0.22, 0.95), rcol, 9, 12, 8))
	ivb.add_child(bonus_box)
	var btext := Label.new()
	btext.text = L.crew_bonus(c)
	btext.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	btext.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if ThemeHelper.font_bold:
		btext.add_theme_font_override("font", ThemeHelper.font_bold)
	btext.add_theme_font_size_override("font_size", 16)
	btext.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	bonus_box.add_child(btext)

	var bio := Label.new()
	bio.text = L.crew_desc(c)
	bio.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bio.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bio.add_theme_font_size_override("font_size", 14)
	bio.add_theme_color_override("font_color", Color(0.80, 0.90, 1.0))
	ivb.add_child(bio)

	var err_lbl := Label.new()
	err_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	err_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	err_lbl.add_theme_color_override("font_color", ThemeHelper.COL_RED)
	ivb.add_child(err_lbl)

	var act_btn := Button.new()
	act_btn.custom_minimum_size = Vector2(230, 46)
	if not owned:
		act_btn.text = L.tr_ui("locked_crew_hint")
		act_btn.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		act_btn.disabled = true
	elif eq:
		act_btn.text = L.tr_ui("unequip_crew")
		ThemeHelper.style_accent_button(act_btn, Color(0.86, 0.42, 0.24))
		act_btn.pressed.connect(func():
			CrewManager.unequip_card(cid)
			SaveManager.save_game()
			open_tab("crew")
		)
	else:
		act_btn.text = L.tr_ui("equip_crew")
		ThemeHelper.style_accent_button(act_btn, Color(0.18, 0.82, 0.52))
		act_btn.pressed.connect(func():
			var res := CrewManager.equip_card(cid)
			if res["ok"]:
				AudioManager.play_sfx("buy_upgrade", 0.03, 0.8)
				SaveManager.save_game()
				open_tab("crew")
			else:
				AudioManager.play_sfx("ui_error", 0.02, 0.75)
				err_lbl.text = L.localize_reason(str(res["reason"]))
		)
	ivb.add_child(act_btn)
	ThemeHelper.animate_entry(hero_frame, 0.0, Vector2(0.93, 0.93))

# ==============================================================================
# 3. CRYSTAL BOOSTER PACK SHOP (LEVITATING AI PACKS + TRANSPARENT ODDS)
# ==============================================================================
func _build_packs_tab() -> void:
	var sc := ScrollContainer.new()
	sc.set_anchors_preset(Control.PRESET_FULL_RECT)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_body_root.add_child(sc)

	var center_wrap := HBoxContainer.new()
	center_wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center_wrap.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center_wrap.alignment = BoxContainer.ALIGNMENT_CENTER
	center_wrap.add_theme_constant_override("separation", 36)
	sc.add_child(center_wrap)

	var pack_ids: Array[String] = ["standard", "elite"]
	for pid in pack_ids:
		var pinfo: Dictionary = PackManager.PACK_TYPES[pid]
		var probs: Dictionary = PackManager.get_probability_table(pid)
		var is_elite: bool = (pid == "elite")
		var accent := Color(1.0, 0.76, 0.24) if is_elite else Color(0.22, 0.82, 1.0)

		var box := PanelContainer.new()
		box.custom_minimum_size = Vector2(460, 0)
		box.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		box.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.032, 0.058, 0.13, 0.96), accent, 16, 2, 18))
		center_wrap.add_child(box)

		var vb := VBoxContainer.new()
		vb.alignment = BoxContainer.ALIGNMENT_CENTER
		vb.add_theme_constant_override("separation", 8)
		box.add_child(vb)

		var float_stage := Control.new()
		float_stage.custom_minimum_size = Vector2(220, 270)
		vb.add_child(float_stage)

		var pimg := TextureRect.new()
		pimg.custom_minimum_size = Vector2(196, 258)
		pimg.size = Vector2(196, 258)
		pimg.position = Vector2(12, 6)
		pimg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pimg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(pinfo["art"]):
			pimg.texture = load(pinfo["art"])
		float_stage.add_child(pimg)
		_floating_packs.append(pimg)

		var nl := Label.new()
		nl.text = L.pack_name(pid).to_upper()
		nl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		nl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		if ThemeHelper.font_display:
			nl.add_theme_font_override("font", ThemeHelper.font_display)
		nl.add_theme_font_size_override("font_size", 20)
		nl.add_theme_color_override("font_color", accent.lightened(0.2))
		vb.add_child(nl)

		var sub := Label.new()
		sub.text = L.tr_ui("pack_contains_3")
		sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sub.add_theme_font_size_override("font_size", 13)
		sub.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
		vb.add_child(sub)

		var odds_hdr := Label.new()
		odds_hdr.text = L.tr_ui("pack_drop_rates")
		odds_hdr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		odds_hdr.add_theme_font_size_override("font_size", 12)
		odds_hdr.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
		vb.add_child(odds_hdr)

		var odds_flow := HFlowContainer.new()
		odds_flow.alignment = FlowContainer.ALIGNMENT_CENTER
		odds_flow.add_theme_constant_override("h_separation", 6)
		odds_flow.add_theme_constant_override("v_separation", 5)
		vb.add_child(odds_flow)

		for r in GameData.RARITY_ORDER:
			var pct := float(probs[r])
			if pct <= 0.0:
				continue
			var rcol: Color = GameData.RARITY_COLORS[r]
			var chip := PanelContainer.new()
			chip.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(rcol.darkened(0.78), rcol, 6, 8, 3))
			var cl := Label.new()
			cl.text = "%s: %.1f%%" % [L.rarity_name(r), pct]
			cl.add_theme_font_size_override("font_size", 12)
			cl.add_theme_color_override("font_color", rcol.lightened(0.28))
			chip.add_child(cl)
			odds_flow.add_child(chip)

		var slot_bonus := Label.new()
		slot_bonus.text = L.tr_ui("pack_fifth_slot_bonus", [float(probs["fifth_upgrade_slot_any_pct"])])
		slot_bonus.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		slot_bonus.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		slot_bonus.add_theme_font_size_override("font_size", 12)
		slot_bonus.add_theme_color_override("font_color", Color(0.32, 1.0, 0.88))
		vb.add_child(slot_bonus)

		var cost := int(pinfo["crystal_cost"])
		var buy_btn := Button.new()
		buy_btn.custom_minimum_size = Vector2(280, 48)
		buy_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		buy_btn.text = L.tr_ui("open_pack_btn", [cost])
		buy_btn.disabled = ShipGrid.crystals < cost
		ThemeHelper.style_accent_button(buy_btn, accent)
		var pid_cap: String = pid
		buy_btn.pressed.connect(func():
			var res: Dictionary = PackManager.purchase_and_open_pack(pid_cap)
			if bool(res.get("ok", false)):
				ShipGrid.crystals_changed.emit(ShipGrid.crystals)
				var cards_typed: Array[Dictionary] = []
				for item in res["cards"]:
					cards_typed.append(item)
				_pack_modal.play_ceremony(pid_cap, cards_typed, bool(res.get("fifth_slot_unlocked", false)))
		)
		vb.add_child(buy_btn)

	ThemeHelper.animate_grid_stagger(center_wrap, 0.06, 4)

# ==============================================================================
# 4. ACTIVE UPGRADE PROTOCOL CORE (3 DEFAULT + 4TH PURCHASE + 5TH PACK DROP)
# ==============================================================================
func _build_upgrades_tab() -> void:
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 12)
	_body_root.add_child(vb)

	var slots_hb := HBoxContainer.new()
	slots_hb.add_theme_constant_override("separation", 10)
	vb.add_child(slots_hb)

	var unlocked := UpgradeManager.get_unlocked_slots()
	for i in range(5):
		var sbox := PanelContainer.new()
		sbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		sbox.custom_minimum_size = Vector2(0, 92)
		var is_open := (i < 3) or (i == 3 and UpgradeManager.fourth_slot_unlocked) or (i == 4 and UpgradeManager.fifth_slot_unlocked)
		var bcol := Color(0.22, 0.86, 0.58) if is_open else Color(0.36, 0.40, 0.50, 0.65)
		sbox.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, bcol, 10, 2, 10))
		slots_hb.add_child(sbox)

		var sv := VBoxContainer.new()
		sv.alignment = BoxContainer.ALIGNMENT_CENTER
		sv.add_theme_constant_override("separation", 4)
		sbox.add_child(sv)

		var stitle := Label.new()
		stitle.text = L.tr_ui("upg_slot_title", [i + 1])
		stitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		stitle.clip_text = true
		if ThemeHelper.font_bold:
			stitle.add_theme_font_override("font", ThemeHelper.font_bold)
		stitle.add_theme_font_size_override("font_size", 13)
		stitle.add_theme_color_override("font_color", bcol.lightened(0.2))
		sv.add_child(stitle)

		if is_open:
			var eq_id: String = UpgradeManager.active_equipped[i] if i < UpgradeManager.active_equipped.size() else ""
			var sl := Label.new()
			sl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			sl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			sl.add_theme_font_size_override("font_size", 13)
			if eq_id != "" and GameData.upgrades_by_id.has(eq_id):
				sl.text = L.upg_name(GameData.upgrades_by_id[eq_id])
				sl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
			else:
				sl.text = L.tr_ui("empty_slot")
				sl.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
			sv.add_child(sl)
		elif i == 3:
			var ub := Button.new()
			ub.text = L.tr_ui("unlock_4th_slot", [UpgradeManager.FOURTH_SLOT_CREDIT_COST])
			ub.clip_text = true
			ub.disabled = ShipGrid.credits < UpgradeManager.FOURTH_SLOT_CREDIT_COST
			ThemeHelper.style_accent_button(ub, Color(0.95, 0.72, 0.20))
			ub.pressed.connect(func():
				if UpgradeManager.purchase_fourth_slot()["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.03, 0.9)
					SaveManager.save_game()
					open_tab("upgrades")
			)
			sv.add_child(ub)
		else:
			var l5 := Label.new()
			l5.text = L.tr_ui("slot_5_hint")
			l5.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			l5.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			l5.add_theme_font_size_override("font_size", 12)
			l5.add_theme_color_override("font_color", Color(0.24, 0.96, 0.90))
			sv.add_child(l5)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vb.add_child(sc)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	sc.add_child(grid)

	for u in GameData.active_upgrades:
		var uid: String = u["id"]
		var owned := UpgradeManager.is_owned(uid)
		var eq := UpgradeManager.is_equipped(uid)

		var ucard := PanelContainer.new()
		ucard.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var uborder := Color(0.24, 0.94, 0.62) if eq else Color(0.20, 0.56, 0.88, 0.72)
		ucard.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, uborder, 12, 2, 12))
		grid.add_child(ucard)

		var uvb := VBoxContainer.new()
		uvb.add_theme_constant_override("separation", 6)
		ucard.add_child(uvb)

		var top := HBoxContainer.new()
		top.add_theme_constant_override("separation", 10)
		uvb.add_child(top)

		var ic := TextureRect.new()
		ic.custom_minimum_size = Vector2(46, 46)
		ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(u["icon_path"]):
			ic.texture = load(u["icon_path"])
		top.add_child(ic)

		var tv := VBoxContainer.new()
		tv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		top.add_child(tv)

		var un := Label.new()
		un.text = L.upg_name(u)
		un.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		if ThemeHelper.font_bold:
			un.add_theme_font_override("font", ThemeHelper.font_bold)
		tv.add_child(un)

		var ue := Label.new()
		ue.text = L.upg_effect(u)
		ue.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		ue.add_theme_font_size_override("font_size", 13)
		ue.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
		tv.add_child(ue)

		var btn := Button.new()
		if not owned:
			var cost := int(u["price"])
			btn.text = L.tr_ui("buy_btn", [cost])
			btn.disabled = ShipGrid.credits < cost
			ThemeHelper.style_accent_button(btn, Color(0.20, 0.72, 0.96))
			btn.pressed.connect(func():
				if UpgradeManager.buy_upgrade(uid)["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.03, 0.85)
					SaveManager.save_game()
					open_tab("upgrades")
			)
		elif eq:
			btn.text = L.tr_ui("unequip_btn")
			ThemeHelper.style_accent_button(btn, Color(0.85, 0.42, 0.24))
			btn.pressed.connect(func():
				UpgradeManager.toggle_equip_upgrade(uid)
				SaveManager.save_game()
				open_tab("upgrades")
			)
		else:
			btn.text = L.tr_ui("equip_btn")
			btn.disabled = UpgradeManager.active_equipped.size() >= unlocked
			ThemeHelper.style_accent_button(btn, Color(0.18, 0.82, 0.52))
			btn.pressed.connect(func():
				if UpgradeManager.toggle_equip_upgrade(uid)["ok"]:
					SaveManager.save_game()
					open_tab("upgrades")
			)
		uvb.add_child(btn)

	ThemeHelper.animate_grid_stagger(grid, 0.016, 12)

# ==============================================================================
# 5. COLLECTIBLE ACHIEVEMENT CARDS ALBUM (30 TIMED UTC CARDS)
# ==============================================================================
func _build_achievements_tab() -> void:
	AchievementManager.ensure_buckets_current()
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 10)
	_body_root.add_child(vb)

	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	vb.add_child(nav)

	for cat_pair in [["minute", "ach_minute"], ["hourly", "ach_hourly"], ["daily", "ach_daily"], ["weekly", "ach_weekly"]]:
		var cid: String = cat_pair[0]
		var ready_cnt := 0
		for t in AchievementManager.active_tasks.get(cid, []):
			if bool(t["completed"]) and not bool(t["claimed"]):
				ready_cnt += 1
		var b := Button.new()
		b.text = L.tr_ui(cat_pair[1]) + ("  [◆ %d]" % ready_cnt if ready_cnt > 0 else "")
		b.custom_minimum_size = Vector2(165, 38)
		if _ach_subcat == cid:
			ThemeHelper.style_accent_button(b, Color(0.22, 0.78, 1.0))
		elif ready_cnt > 0:
			ThemeHelper.style_accent_button(b, Color(0.18, 0.80, 0.50))
		else:
			ThemeHelper.wire_button_fx(b)
		b.pressed.connect(func():
			_ach_subcat = cid
			open_tab("achievements")
		)
		nav.add_child(b)

	_ach_timer_lbl = Label.new()
	_ach_timer_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_ach_timer_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_ach_timer_lbl.clip_text = true
	if ThemeHelper.font_mono:
		_ach_timer_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_ach_timer_lbl.add_theme_font_size_override("font_size", 14)
	_ach_timer_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	nav.add_child(_ach_timer_lbl)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vb.add_child(sc)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	sc.add_child(grid)

	var tasks: Array = AchievementManager.active_tasks[_ach_subcat]
	for t in tasks:
		var rcol: Color = GameData.RARITY_COLORS.get(t["rarity"], Color(0.3, 0.7, 1.0))
		var acard := PanelContainer.new()
		acard.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		acard.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, rcol, 13, 2, 11))
		grid.add_child(acard)

		var avb := VBoxContainer.new()
		avb.add_theme_constant_override("separation", 6)
		acard.add_child(avb)

		var art_wrap := PanelContainer.new()
		art_wrap.custom_minimum_size = Vector2(0, 128)
		art_wrap.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
		var aw_sb := StyleBoxFlat.new()
		aw_sb.bg_color = Color(0.02, 0.03, 0.07, 1.0)
		aw_sb.set_corner_radius_all(9)
		art_wrap.add_theme_stylebox_override("panel", aw_sb)
		avb.add_child(art_wrap)

		var art := TextureRect.new()
		art.set_anchors_preset(Control.PRESET_FULL_RECT)
		art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		if ResourceLoader.exists(t["art"]):
			art.texture = load(t["art"])
		art_wrap.add_child(art)

		var aname := Label.new()
		aname.text = "%s  •  %s" % [L.ach_name(t), L.rarity_name(str(t["rarity"]))]
		aname.clip_text = true
		if ThemeHelper.font_bold:
			aname.add_theme_font_override("font", ThemeHelper.font_bold)
		aname.add_theme_color_override("font_color", rcol.lightened(0.25))
		avb.add_child(aname)

		var aobj := Label.new()
		aobj.text = L.ach_objective(t)
		aobj.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		aobj.add_theme_font_size_override("font_size", 14)
		avb.add_child(aobj)

		var pbar := ProgressBar.new()
		pbar.max_value = float(t["target"])
		pbar.value = float(t["progress"])
		pbar.show_percentage = false
		pbar.custom_minimum_size = Vector2(0, 16)
		avb.add_child(pbar)

		var plbl := Label.new()
		plbl.text = "%d / %d" % [int(floor(float(t["progress"]))), int(t["target"])]
		plbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		plbl.add_theme_font_size_override("font_size", 12)
		plbl.add_theme_color_override("font_color", ThemeHelper.COL_MUTED)
		avb.add_child(plbl)

		var cbtn := Button.new()
		var reward := int(t["crystal_reward"])
		var tid: String = t["id"]
		if bool(t["claimed"]):
			cbtn.text = L.tr_ui("claimed_check")
			cbtn.disabled = true
		elif bool(t["completed"]):
			cbtn.text = L.tr_ui("claim_crystals", [reward])
			ThemeHelper.style_accent_button(cbtn, Color(0.20, 0.88, 0.56))
			var cat_cap := _ach_subcat
			cbtn.pressed.connect(func():
				if AchievementManager.claim_reward(cat_cap, tid)["ok"]:
					AudioManager.play_sfx("card_legendary", 0.02, 0.85)
					open_tab("achievements")
			)
		else:
			cbtn.text = L.tr_ui("in_progress", [reward])
			cbtn.disabled = true
		avb.add_child(cbtn)

	ThemeHelper.animate_grid_stagger(grid, 0.018, 12)

# ==============================================================================
# 6. SECTOR SELECTOR & MINERAL REFINERY
# ==============================================================================
func _build_launch_tab() -> void:
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 12)
	_body_root.add_child(vb)

	var ref_box := PanelContainer.new()
	ref_box.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.055, 0.105, 0.19, 0.96), ThemeHelper.COL_GOLD, 12, 2, 14))
	vb.add_child(ref_box)

	var ref_vb := VBoxContainer.new()
	ref_vb.add_theme_constant_override("separation", 8)
	ref_box.add_child(ref_vb)

	var ref_hb := HBoxContainer.new()
	ref_hb.add_theme_constant_override("separation", 16)
	ref_vb.add_child(ref_hb)

	var cargo_units := ShipGrid.get_current_cargo_units()
	var stats := ShipGrid.compute_ship_stats()
	var preview_val := 0
	for rk in ShipGrid.cargo.keys():
		preview_val += int(ShipGrid.cargo[rk]) * int(GameData.RESOURCES[rk]["value"])
	preview_val = int(round(float(preview_val) * float(stats["credit_mult"])))

	var clbl := Label.new()
	clbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	clbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	clbl.text = L.tr_ui("cargo_refinery_status", [cargo_units, int(stats["cargo_capacity"]), preview_val])
	if ThemeHelper.font_bold:
		clbl.add_theme_font_override("font", ThemeHelper.font_bold)
	clbl.add_theme_font_size_override("font_size", 16)
	ref_hb.add_child(clbl)

	var sell_btn := Button.new()
	sell_btn.custom_minimum_size = Vector2(280, 44)
	sell_btn.text = L.tr_ui("sell_cargo_btn", [preview_val])
	sell_btn.disabled = cargo_units <= 0
	ThemeHelper.style_accent_button(sell_btn, Color(0.95, 0.72, 0.18))
	sell_btn.pressed.connect(func():
		if ShipGrid.sell_all_cargo() > 0:
			AudioManager.play_sfx("buy_upgrade", 0.03, 0.9)
			SaveManager.save_game()
			open_tab("launch")
	)
	ref_hb.add_child(sell_btn)

	# Mineral Breakdown Chips
	var min_flow := HFlowContainer.new()
	min_flow.add_theme_constant_override("h_separation", 8)
	ref_vb.add_child(min_flow)
	for rk in GameData.RESOURCES.keys():
		var qty := int(ShipGrid.cargo.get(rk, 0))
		var rcol: Color = GameData.RESOURCES[rk]["color"]
		var chip := PanelContainer.new()
		chip.add_theme_stylebox_override("panel", ThemeHelper.make_pill_style(Color(0.03, 0.06, 0.12, 0.9), rcol, 7, 10, 3))
		var rl := Label.new()
		rl.text = "%s: %d" % [L.resource_name(rk), qty]
		rl.add_theme_font_size_override("font_size", 13)
		rl.add_theme_color_override("font_color", rcol.lightened(0.25))
		chip.add_child(rl)
		min_flow.add_child(chip)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vb.add_child(sc)

	var sgrid := GridContainer.new()
	sgrid.columns = 2
	sgrid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sgrid.add_theme_constant_override("h_separation", 14)
	sgrid.add_theme_constant_override("v_separation", 14)
	sc.add_child(sgrid)

	for s in GameData.sectors:
		var sidx: int = int(s["index"])
		var unlocked := ShipGrid.unlocked_sectors.has(sidx)
		var scard := PanelContainer.new()
		scard.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var bcol: Color = s["sun_color"] if unlocked else Color(0.32, 0.38, 0.48)
		scard.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, bcol, 13, 2, 14))
		sgrid.add_child(scard)

		var svb := VBoxContainer.new()
		svb.add_theme_constant_override("separation", 6)
		scard.add_child(svb)

		var sn := Label.new()
		sn.text = L.sector_name(s)
		if ThemeHelper.font_display:
			sn.add_theme_font_override("font", ThemeHelper.font_display)
		sn.add_theme_font_size_override("font_size", 19)
		sn.add_theme_color_override("font_color", bcol.lightened(0.22))
		svb.add_child(sn)

		var ssub := Label.new()
		ssub.text = L.sector_sub(s)
		ssub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		ssub.add_theme_color_override("font_color", ThemeHelper.COL_CYAN)
		ssub.add_theme_font_size_override("font_size", 13)
		svb.add_child(ssub)

		var sdesc := Label.new()
		sdesc.text = L.sector_desc(s)
		sdesc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sdesc.size_flags_vertical = Control.SIZE_EXPAND_FILL
		sdesc.add_theme_font_size_override("font_size", 13)
		sdesc.add_theme_color_override("font_color", Color(0.82, 0.90, 1.0))
		svb.add_child(sdesc)

		var lbtn := Button.new()
		lbtn.custom_minimum_size = Vector2(0, 44)
		if unlocked:
			lbtn.text = L.tr_ui("launch_expedition_btn")
			ThemeHelper.style_accent_button(lbtn, Color(0.18, 0.85, 0.52))
			lbtn.pressed.connect(func():
				close_panel()
				launch_sector_requested.emit(sidx)
			)
		else:
			var ucost := int(s["unlock_cost"])
			var req_c := int(s["required_cells"])
			lbtn.text = L.tr_ui("unlock_sector_btn", [ucost, req_c])
			lbtn.disabled = (ShipGrid.credits < ucost) or (ShipGrid.purchased_expansion_cells < req_c)
			ThemeHelper.style_accent_button(lbtn, Color(0.22, 0.68, 0.95))
			lbtn.pressed.connect(func():
				if ShipGrid.unlock_sector(sidx)["ok"]:
					AudioManager.play_sfx("card_legendary", 0.02, 0.9)
					SaveManager.save_game()
					open_tab("launch")
			)
		svb.add_child(lbtn)

	ThemeHelper.animate_grid_stagger(sgrid, 0.03, 6)

# ==============================================================================
# 7. MULTILINGUAL SETTINGS (LANGUAGE, AUDIO, GRAPHICS, SENSITIVITY)
# ==============================================================================
func _build_settings_tab() -> void:
	var sc := ScrollContainer.new()
	sc.set_anchors_preset(Control.PRESET_FULL_RECT)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_body_root.add_child(sc)

	var center := HBoxContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	sc.add_child(center)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(680, 0)
	card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(ThemeHelper.COL_BG_CARD, Color(0.22, 0.72, 1.0, 0.72), 14, 2, 20))
	center.add_child(card)

	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 14)
	card.add_child(vb)

	# 1. Prominent Language Selector Row
	var lang_hb := HBoxContainer.new()
	lang_hb.add_theme_constant_override("separation", 12)
	vb.add_child(lang_hb)
	var lang_lbl := Label.new()
	lang_lbl.text = L.tr_ui("settings_language")
	lang_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if ThemeHelper.font_bold:
		lang_lbl.add_theme_font_override("font", ThemeHelper.font_bold)
	lang_lbl.add_theme_color_override("font_color", ThemeHelper.COL_GOLD)
	lang_hb.add_child(lang_lbl)
	lang_hb.add_child(ThemeHelper.make_language_dropdown(false))

	var sep1 := HSeparator.new()
	sep1.modulate = Color(0.22, 0.68, 0.96, 0.35)
	vb.add_child(sep1)

	_add_slider_row(vb, L.tr_ui("settings_master_vol"), AudioManager.master_volume, 0.0, 1.0, func(v: float):
		AudioManager.master_volume = v
		AudioManager.apply_volumes()
		SaveManager.save_game()
	)
	_add_slider_row(vb, L.tr_ui("settings_music_vol"), AudioManager.music_volume, 0.0, 1.0, func(v: float):
		AudioManager.music_volume = v
		AudioManager.apply_volumes()
		SaveManager.save_game()
	)
	_add_slider_row(vb, L.tr_ui("settings_sfx_vol"), AudioManager.sfx_volume, 0.0, 1.0, func(v: float):
		AudioManager.sfx_volume = v
		AudioManager.apply_volumes()
		SaveManager.save_game()
	)
	_add_slider_row(vb, L.tr_ui("settings_cam_sens"), ThemeHelper.camera_sensitivity, 0.3, 2.5, func(v: float):
		ThemeHelper.camera_sensitivity = v
		SaveManager.save_game()
	)

	var mute_cb := CheckButton.new()
	mute_cb.text = L.tr_ui("settings_mute")
	mute_cb.button_pressed = AudioManager.muted
	mute_cb.toggled.connect(func(on: bool):
		AudioManager.muted = on
		AudioManager.apply_volumes()
		SaveManager.save_game()
	)
	vb.add_child(mute_cb)

	var gfx_hb := HBoxContainer.new()
	gfx_hb.add_theme_constant_override("separation", 10)
	vb.add_child(gfx_hb)
	var gl := Label.new()
	gl.text = L.tr_ui("settings_gfx")
	gl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	gfx_hb.add_child(gl)
	for preset in ["Low", "Medium", "High"]:
		var pb := Button.new()
		pb.text = preset
		pb.custom_minimum_size = Vector2(96, 36)
		if ThemeHelper.graphics_preset == preset:
			ThemeHelper.style_accent_button(pb, Color(0.20, 0.78, 1.0))
		else:
			ThemeHelper.wire_button_fx(pb)
		pb.pressed.connect(func():
			ThemeHelper.apply_graphics_preset(preset)
			SaveManager.save_game()
			open_tab("settings")
		)
		gfx_hb.add_child(pb)

	var fs_cb := CheckButton.new()
	fs_cb.text = L.tr_ui("settings_fullscreen")
	fs_cb.button_pressed = (DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN)
	fs_cb.toggled.connect(func(on: bool):
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if on else DisplayServer.WINDOW_MODE_WINDOWED)
	)
	vb.add_child(fs_cb)

	var rm_cb := CheckButton.new()
	rm_cb.text = L.tr_ui("settings_reduced_motion")
	rm_cb.button_pressed = ThemeHelper.reduced_motion
	rm_cb.toggled.connect(func(on: bool):
		ThemeHelper.reduced_motion = on
		SaveManager.save_game()
	)
	vb.add_child(rm_cb)

func _add_slider_row(parent: VBoxContainer, label_text: String, cur: float, min_v: float, max_v: float, cb: Callable) -> void:
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 12)
	parent.add_child(hb)
	var l := Label.new()
	l.text = label_text
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hb.add_child(l)
	var sl := HSlider.new()
	sl.custom_minimum_size = Vector2(240, 26)
	sl.min_value = min_v
	sl.max_value = max_v
	sl.step = 0.05
	sl.value = cur
	sl.value_changed.connect(cb)
	hb.add_child(sl)
