class_name HangarStationPanels
extends Control

signal launch_sector_requested(sector_index: int)
signal select_module_for_editor(mod_id: String)
signal panel_closed

var _modal_box: PanelContainer
var _header_lbl: Label
var _body_root: Control
var _toast_lbl: Label
var _pack_ceremony: PackOpeningModal
var _confirm_overlay: PanelContainer
var _confirm_lbl: Label
var _confirm_yes_btn: Button

var current_tab: String = ""
var _shop_cat_filter: String = "All"
var _crew_search: String = ""
var _crew_rarity: String = "All"
var _crew_sort: String = "Number"
var _crew_owned_only: bool = false
var _selected_crew_card: Dictionary = {}
var _ach_cat_filter: String = "minute"
var _pending_pack_id: String = ""
var _timer_refresh_acc: float = 0.0
var _live_timer_lbl: Label = null

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_PASS
	visible = false
	_build_shell()

func _process(delta: float) -> void:
	if visible and current_tab == "achievements" and is_instance_valid(_live_timer_lbl):
		_timer_refresh_acc += delta
		if _timer_refresh_acc >= 0.5:
			_timer_refresh_acc = 0.0
			_update_achievement_timer_text()

func _build_shell() -> void:
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.01, 0.02, 0.05, 0.68)
	dim.gui_input.connect(func(ev: InputEvent):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			close_panel()
	)
	add_child(dim)

	_modal_box = PanelContainer.new()
	_modal_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	_modal_box.offset_left = 72
	_modal_box.offset_right = -72
	_modal_box.offset_top = 74
	_modal_box.offset_bottom = -42
	var sb := ThemeHelper.make_panel_style(Color(0.035, 0.06, 0.125, 0.97), Color(0.22, 0.76, 1.0, 0.92), 12, 2)
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	_modal_box.add_theme_stylebox_override("panel", sb)
	add_child(_modal_box)

	var main_vb := VBoxContainer.new()
	main_vb.add_theme_constant_override("separation", 12)
	_modal_box.add_child(main_vb)

	# Header bar
	var hdr := HBoxContainer.new()
	hdr.add_theme_constant_override("separation", 14)
	main_vb.add_child(hdr)

	_header_lbl = Label.new()
	if ThemeHelper.font_display:
		_header_lbl.add_theme_font_override("font", ThemeHelper.font_display)
	_header_lbl.add_theme_font_size_override("font_size", 26)
	_header_lbl.add_theme_color_override("font_color", Color(0.45, 0.92, 1.0))
	_header_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hdr.add_child(_header_lbl)

	_toast_lbl = Label.new()
	_toast_lbl.add_theme_font_size_override("font_size", 18)
	_toast_lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.35))
	hdr.add_child(_toast_lbl)

	var close_btn := Button.new()
	close_btn.text = "CLOSE [ESC]"
	close_btn.custom_minimum_size = Vector2(138, 38)
	ThemeHelper.style_accent_button(close_btn, Color(0.88, 0.32, 0.36))
	close_btn.pressed.connect(close_panel)
	hdr.add_child(close_btn)

	var sep := ColorRect.new()
	sep.custom_minimum_size = Vector2(0, 2)
	sep.color = Color(0.18, 0.62, 0.88, 0.55)
	main_vb.add_child(sep)

	_body_root = Control.new()
	_body_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	main_vb.add_child(_body_root)

	# Purchase Confirmation Dialog
	_confirm_overlay = PanelContainer.new()
	_confirm_overlay.visible = false
	_confirm_overlay.set_anchors_preset(Control.PRESET_CENTER)
	_confirm_overlay.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_confirm_overlay.grow_vertical = Control.GROW_DIRECTION_BOTH
	_confirm_overlay.custom_minimum_size = Vector2(480, 210)
	_confirm_overlay.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.04, 0.08, 0.17, 0.99), Color(1.0, 0.78, 0.25), 12, 3))
	add_child(_confirm_overlay)

	var cvb := VBoxContainer.new()
	cvb.alignment = BoxContainer.ALIGNMENT_CENTER
	cvb.add_theme_constant_override("separation", 18)
	_confirm_overlay.add_child(cvb)

	_confirm_lbl = Label.new()
	_confirm_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_confirm_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_confirm_lbl.add_theme_font_size_override("font_size", 21)
	cvb.add_child(_confirm_lbl)

	var chb := HBoxContainer.new()
	chb.alignment = BoxContainer.ALIGNMENT_CENTER
	chb.add_theme_constant_override("separation", 24)
	cvb.add_child(chb)

	_confirm_yes_btn = Button.new()
	_confirm_yes_btn.text = "CONFIRM & OPEN PACK"
	_confirm_yes_btn.custom_minimum_size = Vector2(210, 44)
	ThemeHelper.style_accent_button(_confirm_yes_btn, Color(0.18, 0.78, 0.52))
	_confirm_yes_btn.pressed.connect(_on_confirm_pack_purchase)
	chb.add_child(_confirm_yes_btn)

	var cno := Button.new()
	cno.text = "CANCEL"
	cno.custom_minimum_size = Vector2(130, 44)
	ThemeHelper.wire_button_fx(cno)
	cno.pressed.connect(func(): _confirm_overlay.visible = false)
	chb.add_child(cno)

	# Pack Opening Ceremony Overlay
	_pack_ceremony = PackOpeningModal.new()
	_pack_ceremony.ceremony_finished.connect(func():
		if current_tab == "packs":
			open_tab("packs")
	)
	add_child(_pack_ceremony)

func show_toast(msg: String, is_err: bool = false) -> void:
	_toast_lbl.text = msg
	_toast_lbl.add_theme_color_override("font_color", Color(1.0, 0.42, 0.42) if is_err else Color(0.38, 1.0, 0.68))
	if is_err:
		AudioManager.play_sfx("ui_error", 0.03, 0.7)

func close_panel() -> void:
	if _pack_ceremony.visible:
		return
	_confirm_overlay.visible = false
	visible = false
	current_tab = ""
	AudioManager.play_sfx("ui_back", 0.04, 0.65)
	panel_closed.emit()

func open_tab(tab_id: String) -> void:
	current_tab = tab_id
	visible = true
	_toast_lbl.text = ""
	_confirm_overlay.visible = false
	_live_timer_lbl = null

	for ch in _body_root.get_children():
		ch.queue_free()

	if not ThemeHelper.reduced_motion and is_inside_tree():
		_modal_box.pivot_offset = _modal_box.size * 0.5
		_modal_box.scale = Vector2(0.96, 0.96)
		var tw := create_tween()
		tw.tween_property(_modal_box, "scale", Vector2.ONE, 0.14).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

	match tab_id:
		"shop":
			_header_lbl.text = "EQUIPMENT SHOP & MODULE UPGRADER"
			_build_shop_tab()
		"crew":
			_header_lbl.text = "CREW RECRUITMENT & CARD COLLECTION"
			_build_crew_tab()
		"packs":
			_header_lbl.text = "GALACTIC CARD PACK STATION"
			_build_packs_tab()
		"upgrades":
			_header_lbl.text = "ACTIVE UPGRADES MATRIX"
			_build_upgrades_tab()
		"achievements":
			_header_lbl.text = "COLLECTIBLE ACHIEVEMENT ALBUM"
			_build_achievements_tab()
		"launch":
			_header_lbl.text = "SECTOR COMMAND & CARGO REFINERY"
			_build_launch_tab()
		"settings":
			_header_lbl.text = "SYSTEM SETTINGS & SAVE VAULT"
			_build_settings_tab()

# ==============================================================================
# 1. EQUIPMENT SHOP & INSTALLED MODULE UPGRADER
# ==============================================================================
func _build_shop_tab() -> void:
	var split := HSplitContainer.new()
	split.set_anchors_preset(Control.PRESET_FULL_RECT)
	split.split_offset = 860
	_body_root.add_child(split)

	var left_vb := VBoxContainer.new()
	left_vb.add_theme_constant_override("separation", 10)
	split.add_child(left_vb)

	var cat_hb := HBoxContainer.new()
	cat_hb.add_theme_constant_override("separation", 8)
	left_vb.add_child(cat_hb)

	for cat in ["All", "Mining", "Collection", "Weapons", "Defense", "Utility", "Propulsion"]:
		var b := Button.new()
		b.text = cat
		if _shop_cat_filter == cat:
			ThemeHelper.style_accent_button(b, Color(0.20, 0.75, 1.0))
		else:
			ThemeHelper.wire_button_fx(b)
		b.pressed.connect(func():
			_shop_cat_filter = cat
			open_tab("shop")
		)
		cat_hb.add_child(b)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
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
		var def: Dictionary = GameData.modules[mid]
		if _shop_cat_filter != "All" and def["category"] != _shop_cat_filter:
			continue

		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.05, 0.09, 0.17, 0.96), Color(0.18, 0.56, 0.82), 8, 1))
		grid.add_child(card)

		var hb := HBoxContainer.new()
		hb.add_theme_constant_override("separation", 12)
		card.add_child(hb)

		var ic := TextureRect.new()
		ic.custom_minimum_size = Vector2(88, 88)
		ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(str(def["icon_path"])):
			ic.texture = load(str(def["icon_path"]))
		hb.add_child(ic)

		var vb := VBoxContainer.new()
		vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		vb.add_theme_constant_override("separation", 3)
		hb.add_child(vb)

		var t := Label.new()
		t.text = "%s  [%dx%dx%d]" % [def["name"], def["grid_size"].x, def["grid_size"].y, def["grid_size"].z]
		if ThemeHelper.font_bold:
			t.add_theme_font_override("font", ThemeHelper.font_bold)
		t.add_theme_font_size_override("font_size", 19)
		vb.add_child(t)

		var d := Label.new()
		d.text = str(def["description"])
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.add_theme_font_size_override("font_size", 14)
		d.add_theme_color_override("font_color", Color(0.68, 0.80, 0.92))
		vb.add_child(d)

		var st := Label.new()
		var edraw := float(def["energy_draw"])
		var estr := ("+%d MW" % int(absf(edraw))) if edraw < 0 else ("-%d MW" % int(edraw))
		st.text = "Mass %.1ft  •  HP %d  •  Power %s" % [float(def["mass"]), int(def["max_hp"]), estr]
		st.add_theme_font_size_override("font_size", 14)
		st.add_theme_color_override("font_color", Color(0.45, 0.92, 1.0))
		vb.add_child(st)

		var act_hb := HBoxContainer.new()
		act_hb.add_theme_constant_override("separation", 8)
		vb.add_child(act_hb)

		var owned_cnt: int = (ShipGrid.owned_equipment.get(mid, []) as Array).size()
		var buy_btn := Button.new()
		buy_btn.text = "BUY %d CR (Stored: %d)" % [int(def["price"]), owned_cnt]
		ThemeHelper.style_accent_button(buy_btn, Color(0.18, 0.72, 0.48))
		buy_btn.pressed.connect(func():
			var res := ShipGrid.buy_equipment(mid)
			if res["ok"]:
				AudioManager.play_sfx("buy_upgrade", 0.03, 0.8)
				SaveManager.save_game()
				open_tab("shop")
				show_toast(res["reason"])
			else:
				show_toast(res["reason"], true)
		)
		act_hb.add_child(buy_btn)

		if owned_cnt > 0:
			var place_btn := Button.new()
			place_btn.text = "PLACE IN 3D"
			ThemeHelper.wire_button_fx(place_btn)
			place_btn.pressed.connect(func():
				select_module_for_editor.emit(mid)
				close_panel()
			)
			act_hb.add_child(place_btn)

	# Right side: Upgrade Installed Ship Modules (Levels 1 -> 5)
	var right_vb := VBoxContainer.new()
	right_vb.add_theme_constant_override("separation", 8)
	split.add_child(right_vb)

	var r_title := Label.new()
	r_title.text = "INSTALLED SHIP HARDWARE (UPGRADE LVL 1-5)"
	if ThemeHelper.font_bold:
		r_title.add_theme_font_override("font", ThemeHelper.font_bold)
	r_title.add_theme_font_size_override("font_size", 20)
	r_title.add_theme_color_override("font_color", Color(1.0, 0.82, 0.35))
	right_vb.add_child(r_title)

	var r_sc := ScrollContainer.new()
	r_sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right_vb.add_child(r_sc)

	var r_list := VBoxContainer.new()
	r_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	r_list.add_theme_constant_override("separation", 8)
	r_sc.add_child(r_list)

	for uid in ShipGrid.placed_modules.keys():
		var e: Dictionary = ShipGrid.placed_modules[uid]
		var mid2: String = e["mod_id"]
		if mid2 in ["cockpit_mk1", "hull_cell"]:
			continue
		var def2: Dictionary = GameData.modules[mid2]
		var lvl: int = int(e.get("level", 1))
		var row := PanelContainer.new()
		row.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.05, 0.08, 0.15), Color(0.24, 0.52, 0.76), 7, 1))
		r_list.add_child(row)

		var rhb := HBoxContainer.new()
		row.add_child(rhb)

		var rlbl := Label.new()
		rlbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		rlbl.text = "%s  [Lv.%d/5]\nGrid (%d,%d,%d)" % [def2["name"], lvl, e["anchor"].x, e["anchor"].y, e["anchor"].z]
		rlbl.add_theme_font_size_override("font_size", 16)
		rhb.add_child(rlbl)

		var ubtn := Button.new()
		if lvl >= 5:
			ubtn.text = "MAX LV.5"
			ubtn.disabled = true
		else:
			var cost := int(round(float(maxi(200, int(def2["price"]))) * 0.75 * float(lvl)))
			ubtn.text = "UPGRADE (%d CR)" % cost
			ThemeHelper.style_accent_button(ubtn, Color(0.92, 0.65, 0.18))
			ubtn.pressed.connect(func():
				var res := ShipGrid.upgrade_installed_module(uid)
				if res["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.04, 0.85)
					SaveManager.save_game()
					open_tab("shop")
					show_toast("Upgraded to Level %d!" % int(res["new_level"]))
				else:
					show_toast(res["reason"], true)
			)
		rhb.add_child(ubtn)

# ==============================================================================
# 2. CREW COLLECTION & MANAGEMENT (42 UNIQUE CARDS)
# ==============================================================================
func _build_crew_tab() -> void:
	CrewManager.enforce_capacity()
	var split := HSplitContainer.new()
	split.set_anchors_preset(Control.PRESET_FULL_RECT)
	split.split_offset = 1010
	_body_root.add_child(split)

	var left_vb := VBoxContainer.new()
	left_vb.add_theme_constant_override("separation", 10)
	split.add_child(left_vb)

	# Crew Slot Formula Banner (10 Purchased Cells = 1 Crew Slot)
	var unlocked_slots := ShipGrid.get_unlocked_crew_slots()
	var prog_cells := ShipGrid.get_cells_toward_next_crew_slot()
	var banner := PanelContainer.new()
	banner.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.05, 0.10, 0.20), Color(0.28, 0.82, 1.0), 8, 2))
	left_vb.add_child(banner)

	var bhb := HBoxContainer.new()
	bhb.add_theme_constant_override("separation", 18)
	banner.add_child(bhb)

	var slot_info := Label.new()
	slot_info.text = "EQUIPPED CREW: %d / %d SLOTS   •   Purchased Expansion Cells: %d (Next Slot: %d / 10 Cells)" % [
		CrewManager.equipped_crew.size(), unlocked_slots, ShipGrid.purchased_expansion_cells, prog_cells
	]
	if ThemeHelper.font_bold:
		slot_info.add_theme_font_override("font", ThemeHelper.font_bold)
	slot_info.add_theme_font_size_override("font_size", 19)
	slot_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bhb.add_child(slot_info)

	var col_prog := Label.new()
	col_prog.text = "COLLECTION: %d / %d CARDS" % [CrewManager.get_unique_owned_count(), GameData.crew_cards.size()]
	col_prog.add_theme_color_override("font_color", Color(1.0, 0.84, 0.35))
	if ThemeHelper.font_bold:
		col_prog.add_theme_font_override("font", ThemeHelper.font_bold)
	bhb.add_child(col_prog)

	# Filter & Search Toolbar
	var filter_hb := HBoxContainer.new()
	filter_hb.add_theme_constant_override("separation", 10)
	left_vb.add_child(filter_hb)

	var search_le := LineEdit.new()
	search_le.placeholder_text = "Search crew name, role, or bonus..."
	search_le.text = _crew_search
	search_le.custom_minimum_size = Vector2(270, 38)
	search_le.text_changed.connect(func(nt: String):
		_crew_search = nt
		_populate_crew_grid()
	)
	filter_hb.add_child(search_le)

	var rar_opt := OptionButton.new()
	var rar_list := ["All"] + GameData.RARITY_ORDER
	for i in range(rar_list.size()):
		rar_opt.add_item("Rarity: " + rar_list[i])
		if rar_list[i] == _crew_rarity:
			rar_opt.selected = i
	rar_opt.item_selected.connect(func(idx: int):
		_crew_rarity = rar_list[idx]
		_populate_crew_grid()
	)
	filter_hb.add_child(rar_opt)

	var sort_opt := OptionButton.new()
	var sorts := ["Number", "Rarity", "Name", "Role", "Owned"]
	for i in range(sorts.size()):
		sort_opt.add_item("Sort: " + sorts[i])
		if sorts[i] == _crew_sort:
			sort_opt.selected = i
	sort_opt.item_selected.connect(func(idx: int):
		_crew_sort = sorts[idx]
		_populate_crew_grid()
	)
	filter_hb.add_child(sort_opt)

	var owned_chk := CheckBox.new()
	owned_chk.text = "Owned Only"
	owned_chk.button_pressed = _crew_owned_only
	owned_chk.toggled.connect(func(v: bool):
		_crew_owned_only = v
		_populate_crew_grid()
	)
	filter_hb.add_child(owned_chk)

	var sc := ScrollContainer.new()
	sc.name = "CrewScroll"
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left_vb.add_child(sc)

	var grid := GridContainer.new()
	grid.name = "CrewGrid"
	grid.columns = 5
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	sc.add_child(grid)

	# Right Inspector Panel
	var right_panel := PanelContainer.new()
	right_panel.name = "CrewInspector"
	right_panel.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.04, 0.07, 0.14), Color(0.24, 0.65, 0.92), 10, 2))
	split.add_child(right_panel)

	if _selected_crew_card.is_empty() and not GameData.crew_cards.is_empty():
		_selected_crew_card = GameData.crew_cards[0]

	_populate_crew_grid()
	_refresh_crew_inspector()

func _populate_crew_grid() -> void:
	var grid := _body_root.find_child("CrewGrid", true, false)
	if not grid:
		return
	for ch in grid.get_children():
		ch.queue_free()

	var cards := CrewManager.query_cards(_crew_search, _crew_rarity, _crew_sort, _crew_owned_only)
	for cdef in cards:
		var cid: String = cdef["id"]
		var qty := int(CrewManager.owned_cards.get(cid, 0))
		var is_eq := CrewManager.equipped_crew.has(cid)
		var w := CardWidget.new()
		w.setup(cdef, qty > 0, qty, is_eq, true)
		w.card_clicked.connect(func(cd: Dictionary):
			_selected_crew_card = cd
			_refresh_crew_inspector()
		)
		grid.add_child(w)

func _refresh_crew_inspector() -> void:
	var insp := _body_root.find_child("CrewInspector", true, false)
	if not insp or _selected_crew_card.is_empty():
		return
	for ch in insp.get_children():
		ch.queue_free()

	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 10)
	insp.add_child(vb)

	var cid: String = _selected_crew_card["id"]
	var qty := int(CrewManager.owned_cards.get(cid, 0))
	var is_owned := qty > 0
	var is_eq := CrewManager.equipped_crew.has(cid)

	var cw := CardWidget.new()
	cw.setup(_selected_crew_card, is_owned, qty, is_eq, false)
	cw.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	vb.add_child(cw)

	var lore := Label.new()
	lore.text = str(_selected_crew_card.get("description", ""))
	lore.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lore.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lore.add_theme_font_size_override("font_size", 16)
	lore.add_theme_color_override("font_color", Color(0.75, 0.86, 0.96))
	vb.add_child(lore)

	if is_owned:
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(230, 44)
		if is_eq:
			btn.text = "UNEQUIP CREW"
			ThemeHelper.style_accent_button(btn, Color(0.86, 0.36, 0.32))
			btn.pressed.connect(func():
				CrewManager.unequip_card(cid)
				SaveManager.save_game()
				open_tab("crew")
			)
		else:
			btn.text = "EQUIP TO BRIDGE"
			ThemeHelper.style_accent_button(btn, Color(0.18, 0.76, 0.50))
			btn.pressed.connect(func():
				var res := CrewManager.equip_card(cid)
				if res["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.04, 0.8)
					SaveManager.save_game()
					open_tab("crew")
				else:
					show_toast(res["reason"], true)
			)
		vb.add_child(btn)
	else:
		var locked_lbl := Label.new()
		locked_lbl.text = "UNOWNED — Unlock in Card Packs!"
		locked_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		locked_lbl.add_theme_color_override("font_color", Color(1.0, 0.65, 0.35))
		vb.add_child(locked_lbl)

# ==============================================================================
# 3. CARD PACK SHOP & PROBABILITY DISCLOSURE
# ==============================================================================
func _build_packs_tab() -> void:
	var hb := HBoxContainer.new()
	hb.set_anchors_preset(Control.PRESET_FULL_RECT)
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	hb.add_theme_constant_override("separation", 38)
	_body_root.add_child(hb)

	for pid in ["standard", "elite"]:
		var pdef: Dictionary = PackManager.PACK_TYPES[pid]
		var probs := PackManager.get_probability_table(pid)

		var box := PanelContainer.new()
		box.custom_minimum_size = Vector2(460, 620)
		var accent := Color(0.22, 0.78, 1.0) if pid == "standard" else Color(1.0, 0.78, 0.24)
		box.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.04, 0.08, 0.16), accent, 12, 2))
		hb.add_child(box)

		var vb := VBoxContainer.new()
		vb.alignment = BoxContainer.ALIGNMENT_CENTER
		vb.add_theme_constant_override("separation", 10)
		box.add_child(vb)

		var ptitle := Label.new()
		ptitle.text = str(pdef["name"]).to_upper()
		ptitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if ThemeHelper.font_display:
			ptitle.add_theme_font_override("font", ThemeHelper.font_display)
		ptitle.add_theme_font_size_override("font_size", 22)
		ptitle.add_theme_color_override("font_color", accent)
		vb.add_child(ptitle)

		var img := TextureRect.new()
		img.custom_minimum_size = Vector2(210, 290)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(str(pdef["art"])):
			img.texture = load(str(pdef["art"]))
		vb.add_child(img)

		var sub := Label.new()
		sub.text = "CONTAINS EXACTLY 3 CREW CARDS"
		sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if ThemeHelper.font_bold:
			sub.add_theme_font_override("font", ThemeHelper.font_bold)
		vb.add_child(sub)

		var ptxt := ""
		for r in GameData.RARITY_ORDER:
			var pct := float(probs.get(r, 0.0))
			if pct > 0.0:
				ptxt += "%s: %.1f%%   " % [r, pct]
		ptxt += "\n5th Active Upgrade Slot Bonus Relic: %.1f%% per card roll" % float(probs.get("fifth_upgrade_slot_per_roll_pct", 0.0))

		var prob_lbl := Label.new()
		prob_lbl.text = ptxt
		prob_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		prob_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		prob_lbl.add_theme_font_size_override("font_size", 14)
		prob_lbl.add_theme_color_override("font_color", Color(0.72, 0.86, 0.98))
		vb.add_child(prob_lbl)

		var buy_btn := Button.new()
		buy_btn.custom_minimum_size = Vector2(280, 48)
		buy_btn.text = "OPEN PACK  •  %d CRYSTALS" % int(pdef["crystal_cost"])
		ThemeHelper.style_accent_button(buy_btn, accent)
		buy_btn.pressed.connect(func():
			var cost := int(pdef["crystal_cost"])
			if ShipGrid.crystals < cost:
				show_toast("Need %d Crystals! Complete Achievements to earn Crystals." % cost, true)
				return
			_pending_pack_id = pid
			_confirm_lbl.text = "Purchase %s (3 Crew Cards) for %d Crystals?\nYour Balance: %d Crystals" % [pdef["name"], cost, ShipGrid.crystals]
			_confirm_overlay.visible = true
		)
		vb.add_child(buy_btn)

func _on_confirm_pack_purchase() -> void:
	_confirm_overlay.visible = false
	if _pending_pack_id.is_empty():
		return
	var res := PackManager.purchase_and_open_pack(_pending_pack_id)
	if not res["ok"]:
		show_toast(res["reason"], true)
		return
	_pack_ceremony.play_pack_ceremony(_pending_pack_id, res["cards"], bool(res["fifth_slot_unlocked"]))

# ==============================================================================
# 4. ACTIVE UPGRADES TERMINAL (3 DEFAULT + 4TH PURCHASED + 5TH 1% RELIC)
# ==============================================================================
func _build_upgrades_tab() -> void:
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 12)
	_body_root.add_child(vb)

	# 5 Active Slots Header
	var slots_hb := HBoxContainer.new()
	slots_hb.alignment = BoxContainer.ALIGNMENT_CENTER
	slots_hb.add_theme_constant_override("separation", 14)
	vb.add_child(slots_hb)

	var unlocked := UpgradeManager.get_unlocked_slots()
	for i in range(5):
		var sbox := PanelContainer.new()
		sbox.custom_minimum_size = Vector2(245, 108)
		var is_open := (i < 3) or (i == 3 and UpgradeManager.fourth_slot_unlocked) or (i == 4 and UpgradeManager.fifth_slot_unlocked)
		var border := Color(0.24, 0.85, 1.0) if is_open else Color(0.45, 0.42, 0.55)
		sbox.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.04, 0.08, 0.16), border, 8, 2))
		slots_hb.add_child(sbox)

		var svb := VBoxContainer.new()
		svb.alignment = BoxContainer.ALIGNMENT_CENTER
		sbox.add_child(svb)

		var stitle := Label.new()
		stitle.text = "UPGRADE SLOT #%d" % (i + 1)
		stitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if ThemeHelper.font_bold:
			stitle.add_theme_font_override("font", ThemeHelper.font_bold)
		svb.add_child(stitle)

		if is_open:
			var eq_id: String = UpgradeManager.active_equipped[i] if i < UpgradeManager.active_equipped.size() else ""
			var desc := Label.new()
			desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			desc.text = GameData.upgrades_by_id[eq_id]["name"] if GameData.upgrades_by_id.has(eq_id) else "[ EMPTY ACTIVE SLOT ]"
			desc.add_theme_color_override("font_color", Color(0.35, 1.0, 0.68) if not eq_id.is_empty() else Color(0.6, 0.72, 0.85))
			desc.add_theme_font_size_override("font_size", 15)
			svb.add_child(desc)
		elif i == 3:
			var b4 := Button.new()
			b4.text = "UNLOCK: %d CR + %d CRY" % [UpgradeManager.FOURTH_SLOT_CREDIT_COST, UpgradeManager.FOURTH_SLOT_CRYSTAL_COST]
			b4.add_theme_font_size_override("font_size", 14)
			ThemeHelper.style_accent_button(b4, Color(0.95, 0.68, 0.18))
			b4.pressed.connect(func():
				var r := UpgradeManager.purchase_fourth_slot()
				if r["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.03, 0.9)
					SaveManager.save_game()
					open_tab("upgrades")
					show_toast("4th Active Upgrade Slot permanently unlocked!")
				else:
					show_toast(r["reason"], true)
			)
			svb.add_child(b4)
		elif i == 4:
			var l5 := Label.new()
			l5.text = "RARE CARD PACK RELIC\n(1.0% Drop Per Pack Roll)"
			l5.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			l5.add_theme_font_size_override("font_size", 13)
			l5.add_theme_color_override("font_color", Color(1.0, 0.72, 0.35))
			svb.add_child(l5)

	var sub_lbl := Label.new()
	sub_lbl.text = "ACTIVE PROTOCOLS EQUIPPED: %d / %d  (Max 5 Permanent Slots)" % [UpgradeManager.active_equipped.size(), unlocked]
	sub_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(sub_lbl)

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(sc)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	sc.add_child(grid)

	for u in GameData.active_upgrades:
		var uid: String = u["id"]
		var is_owned := UpgradeManager.owned_upgrades.has(uid)
		var is_eq := UpgradeManager.active_equipped.has(uid)

		var p := PanelContainer.new()
		p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var bcol := Color(0.28, 0.95, 0.62) if is_eq else (Color(0.22, 0.65, 0.92) if is_owned else Color(0.22, 0.30, 0.42))
		p.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.05, 0.08, 0.16), bcol, 8, 2 if is_eq else 1))
		grid.add_child(p)

		var uhb := HBoxContainer.new()
		uhb.add_theme_constant_override("separation", 10)
		p.add_child(uhb)

		var uic := TextureRect.new()
		uic.custom_minimum_size = Vector2(64, 64)
		uic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		uic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if ResourceLoader.exists(str(u["icon_path"])):
			uic.texture = load(str(u["icon_path"]))
		uhb.add_child(uic)

		var uvb := VBoxContainer.new()
		uvb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		uhb.add_child(uvb)

		var ut := Label.new()
		ut.text = str(u["name"])
		if ThemeHelper.font_bold:
			ut.add_theme_font_override("font", ThemeHelper.font_bold)
		uvb.add_child(ut)

		var ue := Label.new()
		ue.text = str(u["effect_text"])
		ue.add_theme_font_size_override("font_size", 15)
		ue.add_theme_color_override("font_color", Color(0.55, 0.92, 1.0))
		uvb.add_child(ue)

		var ubtn := Button.new()
		if not is_owned:
			ubtn.text = "RESEARCH  %d CR" % int(u["price"])
			ThemeHelper.style_accent_button(ubtn, Color(0.18, 0.65, 0.88))
			ubtn.pressed.connect(func():
				var r := UpgradeManager.buy_upgrade(uid)
				if r["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.04, 0.85)
					SaveManager.save_game()
					open_tab("upgrades")
				else:
					show_toast(r["reason"], true)
			)
		else:
			ubtn.text = "DEACTIVATE" if is_eq else "ACTIVATE IN SLOT"
			ThemeHelper.style_accent_button(ubtn, Color(0.82, 0.35, 0.35) if is_eq else Color(0.18, 0.78, 0.50))
			ubtn.pressed.connect(func():
				var r := UpgradeManager.toggle_equip_upgrade(uid)
				if r["ok"]:
					SaveManager.save_game()
					open_tab("upgrades")
				else:
					show_toast(r["reason"], true)
			)
		uvb.add_child(ubtn)

# ==============================================================================
# 5. COLLECTIBLE ACHIEVEMENT ALBUM (30 ACTIVE TASKS: 5M / 3H / 7D / 15W)
# ==============================================================================
func _build_achievements_tab() -> void:
	AchievementManager.ensure_buckets_current()
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 10)
	_body_root.add_child(vb)

	var top_hb := HBoxContainer.new()
	top_hb.add_theme_constant_override("separation", 10)
	vb.add_child(top_hb)

	var tabs := [
		["minute", "MINUTE (5)"],
		["hourly", "HOURLY (3)"],
		["daily", "DAILY (7)"],
		["weekly", "WEEKLY (15)"],
	]
	for pair in tabs:
		var cid: String = pair[0]
		var b := Button.new()
		b.text = pair[1]
		if _ach_cat_filter == cid:
			ThemeHelper.style_accent_button(b, Color(0.22, 0.76, 1.0))
		else:
			ThemeHelper.wire_button_fx(b)
		b.pressed.connect(func():
			_ach_cat_filter = cid
			open_tab("achievements")
		)
		top_hb.add_child(b)

	_live_timer_lbl = Label.new()
	_live_timer_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_live_timer_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	if ThemeHelper.font_mono:
		_live_timer_lbl.add_theme_font_override("font", ThemeHelper.font_mono)
	_live_timer_lbl.add_theme_font_size_override("font_size", 17)
	_live_timer_lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.38))
	top_hb.add_child(_live_timer_lbl)
	_update_achievement_timer_text()

	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(sc)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	sc.add_child(grid)

	var list: Array = AchievementManager.active_tasks.get(_ach_cat_filter, [])
	for task in list:
		var rar: String = task["rarity"]
		var rcol: Color = GameData.RARITY_COLORS.get(rar, Color.CYAN)
		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.045, 0.08, 0.16), rcol, 10, 2))
		grid.add_child(card)

		var cvb := VBoxContainer.new()
		cvb.add_theme_constant_override("separation", 6)
		card.add_child(cvb)

		var art := TextureRect.new()
		art.custom_minimum_size = Vector2(260, 130)
		art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		if ResourceLoader.exists(str(task["art"])):
			art.texture = load(str(task["art"]))
		cvb.add_child(art)

		var tname := Label.new()
		tname.text = "%s  [%s]" % [task["name"], rar.to_upper()]
		if ThemeHelper.font_bold:
			tname.add_theme_font_override("font", ThemeHelper.font_bold)
		tname.add_theme_color_override("font_color", rcol.lightened(0.22))
		cvb.add_child(tname)

		var obj := Label.new()
		obj.text = "%s — %s" % [task["objective"], task["description"]]
		obj.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		obj.add_theme_font_size_override("font_size", 15)
		cvb.add_child(obj)

		var pbar := ProgressBar.new()
		pbar.max_value = float(task["target"])
		pbar.value = float(task["progress"])
		pbar.show_percentage = false
		pbar.custom_minimum_size = Vector2(0, 18)
		cvb.add_child(pbar)

		var fhb := HBoxContainer.new()
		cvb.add_child(fhb)

		var ptxt := Label.new()
		ptxt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		ptxt.text = "%d / %d   •   +%d Crystals" % [int(floor(float(task["progress"]))), int(task["target"]), int(task["crystal_reward"])]
		ptxt.add_theme_color_override("font_color", Color(0.42, 0.92, 1.0))
		fhb.add_child(ptxt)

		var cbtn := Button.new()
		if bool(task["claimed"]):
			cbtn.text = "COLLECTED"
			cbtn.disabled = true
		elif bool(task["completed"]):
			cbtn.text = "CLAIM +%d CRY" % int(task["crystal_reward"])
			ThemeHelper.style_accent_button(cbtn, Color(0.20, 0.85, 0.52))
			var tid: String = task["id"]
			var cat_copy := _ach_cat_filter
			cbtn.pressed.connect(func():
				var res := AchievementManager.claim_reward(cat_copy, tid)
				if res["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.04, 0.95)
					open_tab("achievements")
					show_toast("Claimed +%d Crystals & Collectible Achievement Card!" % int(res["crystals"]))
				else:
					show_toast(res["reason"], true)
			)
		else:
			cbtn.text = "IN PROGRESS"
			cbtn.disabled = true
		fhb.add_child(cbtn)

func _update_achievement_timer_text() -> void:
	if not is_instance_valid(_live_timer_lbl):
		return
	if AchievementManager.ensure_buckets_current() and current_tab == "achievements":
		open_tab("achievements")
		return
	var rem := AchievementManager.get_seconds_until_reset(_ach_cat_filter)
	var d := rem / 86400
	var h := (rem % 86400) / 3600
	var m := (rem % 3600) / 60
	var s := rem % 60
	_live_timer_lbl.text = "ACTIVE ALBUM: 30 CARDS  |  UTC RESET (%s): %02dd %02dh %02dm %02ds" % [_ach_cat_filter.to_upper(), d, h, m, s]

# ==============================================================================
# 6. SECTOR COMMAND, CARGO REFINERY & LAUNCH EXPEDITION
# ==============================================================================
func _build_launch_tab() -> void:
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 12)
	_body_root.add_child(vb)

	# Cargo Refinery Strip
	var ref_box := PanelContainer.new()
	ref_box.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(Color(0.05, 0.10, 0.19), Color(1.0, 0.78, 0.25), 8, 2))
	vb.add_child(ref_box)

	var rhb := HBoxContainer.new()
	rhb.add_theme_constant_override("separation", 18)
	ref_box.add_child(rhb)

	var c_str := "CARGO HOLD (%d / %d):  " % [ShipGrid.get_current_cargo_units(), int(ShipGrid.compute_ship_stats()["cargo_capacity"])]
	for rk in ["iron", "titanium", "crystal", "plasma_core", "void_iridium"]:
		c_str += "%s: %d   " % [GameData.RESOURCES[rk]["name"], int(ShipGrid.cargo.get(rk, 0))]
	var clbl := Label.new()
	clbl.text = c_str
	clbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rhb.add_child(clbl)

	var sell_btn := Button.new()
	sell_btn.text = "REFINE & SELL ALL CARGO"
	ThemeHelper.style_accent_button(sell_btn, Color(0.95, 0.68, 0.16))
	sell_btn.pressed.connect(func():
		var earned := ShipGrid.sell_all_cargo()
		if earned > 0:
			AudioManager.play_sfx("buy_upgrade", 0.04, 0.9)
			SaveManager.save_game()
			open_tab("launch")
			show_toast("Refined cargo for +%d Credits!" % earned)
		else:
			show_toast("Cargo bay is empty.", true)
	)
	rhb.add_child(sell_btn)

	# 5 Space Sectors Grid
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(sc)

	var s_list := VBoxContainer.new()
	s_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s_list.add_theme_constant_override("separation", 10)
	sc.add_child(s_list)

	for sdef in GameData.sectors:
		var idx: int = int(sdef["index"])
		var is_unlocked := ShipGrid.unlocked_sectors.has(idx)
		var p := PanelContainer.new()
		p.add_theme_stylebox_override("panel", ThemeHelper.make_panel_style(
			Color(0.045, 0.08, 0.16),
			sdef["sun_color"] if is_unlocked else Color(0.32, 0.38, 0.48),
			10, 2
		))
		s_list.add_child(p)

		var shb := HBoxContainer.new()
		shb.add_theme_constant_override("separation", 18)
		p.add_child(shb)

		var svb := VBoxContainer.new()
		svb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		shb.add_child(svb)

		var st := Label.new()
		st.text = "%s   —   %s" % [sdef["name"], sdef["subtitle"]]
		if ThemeHelper.font_display:
			st.add_theme_font_override("font", ThemeHelper.font_display)
		st.add_theme_font_size_override("font_size", 20)
		st.add_theme_color_override("font_color", sdef["sun_color"])
		svb.add_child(st)

		var sd := Label.new()
		sd.text = str(sdef["description"])
		sd.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sd.add_theme_color_override("font_color", Color(0.76, 0.86, 0.96))
		svb.add_child(sd)

		var lbtn := Button.new()
		lbtn.custom_minimum_size = Vector2(270, 50)
		if is_unlocked:
			lbtn.text = "LAUNCH EXPEDITION"
			ThemeHelper.style_accent_button(lbtn, Color(0.18, 0.78, 0.56))
			lbtn.pressed.connect(func():
				if int(ShipGrid.compute_ship_stats()["engine_count"]) <= 0:
					show_toast("Install at least 1 Thruster Engine before launching!", true)
					return
				SaveManager.save_game()
				close_panel()
				launch_sector_requested.emit(idx)
			)
		else:
			lbtn.text = "UNLOCK (%d CR • %d CELLS)" % [int(sdef["unlock_cost"]), int(sdef["required_cells"])]
			ThemeHelper.style_accent_button(lbtn, Color(0.88, 0.62, 0.18))
			lbtn.pressed.connect(func():
				var r := ShipGrid.unlock_sector(idx)
				if r["ok"]:
					AudioManager.play_sfx("buy_upgrade", 0.03, 0.95)
					SaveManager.save_game()
					open_tab("launch")
					show_toast("Unlocked " + str(sdef["name"]) + "!")
				else:
					show_toast(r["reason"], true)
			)
		shb.add_child(lbtn)

# ==============================================================================
# 7. SETTINGS & SAVE SYSTEM
# ==============================================================================
func _build_settings_tab() -> void:
	var vb := VBoxContainer.new()
	vb.custom_minimum_size = Vector2(680, 0)
	vb.set_anchors_preset(Control.PRESET_CENTER_TOP)
	vb.grow_horizontal = Control.GROW_DIRECTION_BOTH
	vb.offset_top = 18
	vb.add_theme_constant_override("separation", 16)
	_body_root.add_child(vb)

	# Graphics Preset
	var ghb := HBoxContainer.new()
	vb.add_child(ghb)
	var glbl := Label.new()
	glbl.text = "Graphics Quality Preset:"
	glbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ghb.add_child(glbl)
	var gopt := OptionButton.new()
	var presets := ["Low", "Medium", "High", "Ultra"]
	for i in range(presets.size()):
		gopt.add_item(presets[i])
		if presets[i] == ThemeHelper.graphics_preset:
			gopt.selected = i
	gopt.item_selected.connect(func(idx: int):
		ThemeHelper.apply_graphics_preset(presets[idx])
		SaveManager.save_game()
	)
	ghb.add_child(gopt)

	# Sliders: Master, Music, SFX, Camera Sensitivity
	_add_slider_row(vb, "Master Volume", AudioManager.master_volume, 0.0, 1.0, func(v: float):
		AudioManager.master_volume = v
		AudioManager.apply_volumes()
	)
	_add_slider_row(vb, "Music & Ambience Volume", AudioManager.music_volume, 0.0, 1.0, func(v: float):
		AudioManager.music_volume = v
		AudioManager.apply_volumes()
	)
	_add_slider_row(vb, "SFX Volume", AudioManager.sfx_volume, 0.0, 1.0, func(v: float):
		AudioManager.sfx_volume = v
		AudioManager.apply_volumes()
	)
	_add_slider_row(vb, "Camera Orbit & Flight Sensitivity", ThemeHelper.camera_sensitivity, 0.3, 2.5, func(v: float):
		ThemeHelper.camera_sensitivity = v
	)

	var rm_chk := CheckBox.new()
	rm_chk.text = "Reduced Motion (Instant Card Reveals & Minimal UI Motion)"
	rm_chk.button_pressed = ThemeHelper.reduced_motion
	rm_chk.toggled.connect(func(v: bool):
		ThemeHelper.reduced_motion = v
		SaveManager.save_game()
	)
	vb.add_child(rm_chk)

	var mute_chk := CheckBox.new()
	mute_chk.text = "Mute All Audio"
	mute_chk.button_pressed = AudioManager.muted
	mute_chk.toggled.connect(func(v: bool):
		AudioManager.muted = v
		AudioManager.apply_volumes()
		SaveManager.save_game()
	)
	vb.add_child(mute_chk)

	var sv_hb := HBoxContainer.new()
	sv_hb.add_theme_constant_override("separation", 18)
	vb.add_child(sv_hb)

	var save_btn := Button.new()
	save_btn.text = "SAVE PROGRESS NOW"
	save_btn.custom_minimum_size = Vector2(220, 44)
	ThemeHelper.style_accent_button(save_btn, Color(0.18, 0.76, 0.52))
	save_btn.pressed.connect(func():
		if SaveManager.save_game():
			show_toast("Progress saved with SHA-256 integrity verification!")
	)
	sv_hb.add_child(save_btn)

func _add_slider_row(parent: VBoxContainer, label_txt: String, cur: float, mn: float, mx: float, cb: Callable) -> void:
	var hb := HBoxContainer.new()
	parent.add_child(hb)
	var l := Label.new()
	l.text = label_txt
	l.custom_minimum_size = Vector2(310, 0)
	hb.add_child(l)
	var sl := HSlider.new()
	sl.min_value = mn
	sl.max_value = mx
	sl.step = 0.05
	sl.value = cur
	sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sl.value_changed.connect(cb)
	hb.add_child(sl)
