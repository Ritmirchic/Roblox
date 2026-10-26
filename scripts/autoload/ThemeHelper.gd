extends Node

var main_theme: Theme
var font_display: FontFile
var font_bold: FontFile
var font_body: FontFile
var font_mono: FontFile

const COL_BG_DARK := Color(0.028, 0.052, 0.115, 0.94)
const COL_BG_CARD := Color(0.050, 0.088, 0.175, 0.95)
const COL_BORDER := Color(0.18, 0.68, 0.96, 0.68)
const COL_CYAN := Color(0.20, 0.88, 1.00, 1.0)
const COL_GOLD := Color(1.00, 0.78, 0.24, 1.0)
const COL_GREEN := Color(0.22, 0.92, 0.58, 1.0)
const COL_EMERALD := Color(0.22, 0.92, 0.58, 1.0)
const COL_RED := Color(1.00, 0.32, 0.40, 1.0)
const COL_TEXT := Color(0.93, 0.97, 1.00, 1.0)
const COL_MUTED := Color(0.60, 0.74, 0.88, 1.0)

var graphics_preset: String = "High"
var reduced_motion: bool = false
var camera_sensitivity: float = 1.0

func _ready() -> void:
	_load_multilingual_fonts()
	_build_theme()
	apply_all_settings()

func _load_multilingual_fonts() -> void:
	var fallbacks: Array[Font] = []
	for fb_path in [
		"res://assets/fonts/SciFiSymbols.ttf",
		"res://assets/fonts/CJK-SC.ttf",
		"res://assets/fonts/CJK-JP.ttf",
		"res://assets/fonts/CJK-KR.ttf",
	]:
		if ResourceLoader.exists(fb_path):
			var fb := load(fb_path) as FontFile
			if fb:
				fallbacks.append(fb)

	if ResourceLoader.exists("res://assets/fonts/Exo2-ExtraBold.ttf"):
		font_display = load("res://assets/fonts/Exo2-ExtraBold.ttf")
	if ResourceLoader.exists("res://assets/fonts/Exo2-Bold.ttf"):
		font_bold = load("res://assets/fonts/Exo2-Bold.ttf")
	if ResourceLoader.exists("res://assets/fonts/Exo2-Medium.ttf"):
		font_body = load("res://assets/fonts/Exo2-Medium.ttf")
	if ResourceLoader.exists("res://assets/fonts/JetBrainsMono-SemiBold.ttf"):
		font_mono = load("res://assets/fonts/JetBrainsMono-SemiBold.ttf")

	for f in [font_display, font_bold, font_body, font_mono]:
		if f != null:
			f.fallbacks = fallbacks

func make_panel_style(bg: Color = COL_BG_DARK, border: Color = COL_BORDER, corner: int = 12, border_w: int = 2, pad: int = 12) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(border_w)
	sb.set_corner_radius_all(corner)
	sb.content_margin_left = pad
	sb.content_margin_right = pad
	sb.content_margin_top = maxi(8, pad - 2)
	sb.content_margin_bottom = maxi(8, pad - 2)
	sb.shadow_color = Color(0.0, 0.0, 0.0, 0.48)
	sb.shadow_size = 10
	sb.anti_aliasing = true
	return sb

func make_pill_style(bg: Color, border: Color, corner: int = 9, pad_x: int = 12, pad_y: int = 6) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(corner)
	sb.content_margin_left = pad_x
	sb.content_margin_right = pad_x
	sb.content_margin_top = pad_y
	sb.content_margin_bottom = pad_y
	sb.anti_aliasing = true
	return sb

func _build_theme() -> void:
	main_theme = Theme.new()
	if font_body:
		main_theme.default_font = font_body
	main_theme.default_font_size = 16

	main_theme.set_color("font_color", "Label", COL_TEXT)
	main_theme.set_stylebox("panel", "PanelContainer", make_panel_style())

	var btn_normal := make_panel_style(Color(0.065, 0.125, 0.24, 0.95), Color(0.20, 0.65, 0.94, 0.68), 9, 1, 12)
	var btn_hover := make_panel_style(Color(0.11, 0.24, 0.42, 0.98), COL_CYAN, 9, 2, 12)
	var btn_pressed := make_panel_style(Color(0.16, 0.36, 0.58, 1.0), COL_GOLD, 9, 2, 12)
	var btn_disabled := make_panel_style(Color(0.05, 0.07, 0.11, 0.72), Color(0.24, 0.28, 0.36, 0.42), 9, 1, 12)

	for cls in ["Button", "OptionButton", "CheckButton"]:
		main_theme.set_stylebox("normal", cls, btn_normal)
		main_theme.set_stylebox("hover", cls, btn_hover)
		main_theme.set_stylebox("pressed", cls, btn_pressed)
		main_theme.set_stylebox("focus", cls, btn_hover)
		main_theme.set_stylebox("disabled", cls, btn_disabled)
		main_theme.set_color("font_color", cls, COL_TEXT)
		main_theme.set_color("font_hover_color", cls, Color(1, 1, 1))
		main_theme.set_color("font_pressed_color", cls, COL_GOLD)
		main_theme.set_color("font_disabled_color", cls, Color(0.46, 0.52, 0.60))
		if font_bold:
			main_theme.set_font("font", cls, font_bold)
		main_theme.set_font_size("font_size", cls, 16)

	# Crisp LineEdit & PopupMenu dark sci-fi styling
	var le_sb := make_pill_style(Color(0.035, 0.068, 0.14, 0.96), Color(0.22, 0.68, 0.95, 0.65), 8, 10, 6)
	main_theme.set_stylebox("normal", "LineEdit", le_sb)
	main_theme.set_stylebox("focus", "LineEdit", make_pill_style(Color(0.05, 0.10, 0.20, 0.98), COL_CYAN, 8, 10, 6))
	main_theme.set_color("font_color", "LineEdit", COL_TEXT)
	main_theme.set_color("font_placeholder_color", "LineEdit", COL_MUTED)

	var pop_sb := make_panel_style(Color(0.035, 0.068, 0.145, 0.98), COL_CYAN, 10, 2, 10)
	main_theme.set_stylebox("panel", "PopupMenu", pop_sb)
	main_theme.set_stylebox("hover", "PopupMenu", make_pill_style(Color(0.14, 0.30, 0.52, 0.95), COL_CYAN, 6, 8, 4))
	main_theme.set_color("font_color", "PopupMenu", COL_TEXT)
	main_theme.set_color("font_hover_color", "PopupMenu", Color.WHITE)

	# Sleek slim scrollbars
	var sb_track := StyleBoxFlat.new()
	sb_track.bg_color = Color(0.03, 0.055, 0.11, 0.65)
	sb_track.set_corner_radius_all(4)
	sb_track.content_margin_left = 4
	sb_track.content_margin_right = 4
	var sb_grab := StyleBoxFlat.new()
	sb_grab.bg_color = Color(0.20, 0.68, 0.95, 0.65)
	sb_grab.set_corner_radius_all(4)
	var sb_grab_hi := StyleBoxFlat.new()
	sb_grab_hi.bg_color = COL_CYAN
	sb_grab_hi.set_corner_radius_all(4)
	for scls in ["VScrollBar", "HScrollBar"]:
		main_theme.set_stylebox("scroll", scls, sb_track)
		main_theme.set_stylebox("grabber", scls, sb_grab)
		main_theme.set_stylebox("grabber_highlight", scls, sb_grab_hi)
		main_theme.set_stylebox("grabber_pressed", scls, sb_grab_hi)

	var pb_bg := make_panel_style(Color(0.035, 0.06, 0.12, 0.92), Color(0.16, 0.38, 0.58, 0.65), 6, 1, 2)
	var pb_fg := StyleBoxFlat.new()
	pb_fg.bg_color = Color(0.18, 0.82, 0.98, 0.95)
	pb_fg.set_corner_radius_all(5)
	main_theme.set_stylebox("background", "ProgressBar", pb_bg)
	main_theme.set_stylebox("fill", "ProgressBar", pb_fg)

var _plaque_cache: Dictionary = {}

## A panel style painted with the game's own procedural rarity-plaque artwork so
## menus, modals and cards share one visual language instead of generic UI chrome.
## `dark` dims the plate for text legibility; `pad` is the inner content padding.
func make_plaque_style(rarity: String = "rare", dark: float = 0.55, pad: int = 16) -> StyleBox:
	var key := "%s|%f|%d" % [rarity, dark, pad]
	if _plaque_cache.has(key):
		return _plaque_cache[key]
	var tex_path := "res://assets/cards/achievements/bg_%s.png" % rarity.to_lower()
	var out: StyleBox
	if ResourceLoader.exists(tex_path):
		var sb := StyleBoxTexture.new()
		sb.texture = load(tex_path)
		sb.modulate_color = Color(dark, dark * 1.02, dark * 1.10, 1.0)
		# STRETCH (default) paints the whole plate across the panel: no tiling.
		sb.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
		sb.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
		sb.content_margin_left = float(pad)
		sb.content_margin_top = float(pad)
		sb.content_margin_right = float(pad)
		sb.content_margin_bottom = float(pad)
		out = sb
	else:
		out = make_panel_style(Color(0.04, 0.06, 0.11, 0.96), COL_BORDER, 13, 2, pad)
	_plaque_cache[key] = out
	return out


func clear_children(parent: Node) -> void:
	if not is_instance_valid(parent):
		return
	for ch in parent.get_children():
		parent.remove_child(ch)
		ch.queue_free()

func fill_full_rect(ctrl: Control, margin_l: float = 0.0, margin_t: float = 0.0, margin_r: float = 0.0, margin_b: float = 0.0) -> void:
	if not is_instance_valid(ctrl):
		return
	ctrl.anchor_left = 0.0
	ctrl.anchor_top = 0.0
	ctrl.anchor_right = 1.0
	ctrl.anchor_bottom = 1.0
	ctrl.offset_left = margin_l
	ctrl.offset_top = margin_t
	ctrl.offset_right = -margin_r
	ctrl.offset_bottom = -margin_b

func style_accent_button(btn: Button, accent: Color) -> void:
	var n := make_panel_style(accent.darkened(0.64), accent.lightened(0.12), 9, 2, 12)
	var h := make_panel_style(accent.darkened(0.42), accent.lightened(0.36), 9, 2, 12)
	var p := make_panel_style(accent.darkened(0.22), Color.WHITE, 9, 2, 12)
	btn.add_theme_stylebox_override("normal", n)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_stylebox_override("focus", h)
	btn.add_theme_stylebox_override("pressed", p)
	wire_button_fx(btn)

func wire_button_fx(btn: BaseButton) -> void:
	if btn.has_meta("fx_wired"):
		return
	btn.set_meta("fx_wired", true)
	btn.scale = Vector2.ONE
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.mouse_entered.connect(func():
		if btn.disabled:
			return
		AudioManager.play_sfx("ui_hover", 0.03, 0.45)
		if not reduced_motion and btn.is_inside_tree():
			if btn.has_meta("_btn_tw"):
				var old_tw: Variant = btn.get_meta("_btn_tw")
				if old_tw is Tween and (old_tw as Tween).is_running():
					(old_tw as Tween).kill()
			var tw := btn.create_tween()
			btn.set_meta("_btn_tw", tw)
			tw.tween_property(btn, "self_modulate", Color(1.16, 1.20, 1.28, 1.0), 0.11).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	)
	btn.mouse_exited.connect(func():
		if not reduced_motion and btn.is_inside_tree():
			if btn.has_meta("_btn_tw"):
				var old_tw: Variant = btn.get_meta("_btn_tw")
				if old_tw is Tween and (old_tw as Tween).is_running():
					(old_tw as Tween).kill()
			var tw := btn.create_tween()
			btn.set_meta("_btn_tw", tw)
			tw.tween_property(btn, "self_modulate", Color.WHITE, 0.12).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	)
	btn.pressed.connect(func():
		AudioManager.play_sfx("ui_click", 0.03, 0.72)
		if not reduced_motion and btn.is_inside_tree():
			if btn.has_meta("_btn_tw"):
				var old_tw: Variant = btn.get_meta("_btn_tw")
				if old_tw is Tween and (old_tw as Tween).is_running():
					(old_tw as Tween).kill()
			var tw := btn.create_tween()
			btn.set_meta("_btn_tw", tw)
			tw.tween_property(btn, "self_modulate", Color(0.84, 0.94, 1.0, 1.0), 0.045)
			tw.tween_property(btn, "self_modulate", Color(1.12, 1.16, 1.24, 1.0), 0.09).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	)

func animate_entry(ctrl: Control, delay: float = 0.0, _start_scale: Vector2 = Vector2.ONE) -> void:
	if not is_instance_valid(ctrl):
		return
	ctrl.scale = Vector2.ONE
	ctrl.rotation = 0.0
	if ctrl.has_meta("_entry_tw"):
		var prev_tw: Variant = ctrl.get_meta("_entry_tw")
		if prev_tw is Tween and (prev_tw as Tween).is_running():
			(prev_tw as Tween).kill()
	if reduced_motion or not ctrl.is_inside_tree():
		ctrl.modulate.a = 1.0
		return
	ctrl.modulate.a = 0.24
	var tw := ctrl.create_tween()
	ctrl.set_meta("_entry_tw", tw)
	if delay > 0.0:
		tw.tween_interval(delay)
	tw.tween_property(ctrl, "modulate:a", 1.0, 0.16).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)

func animate_grid_stagger(container: Control, step_delay: float = 0.015, max_animated: int = 18) -> void:
	if not is_instance_valid(container):
		return
	var idx := 0
	for ch in container.get_children():
		if ch is Control and (ch as Control).visible:
			var ctrl_ch := ch as Control
			ctrl_ch.scale = Vector2.ONE
			if not reduced_motion and idx < max_animated:
				animate_entry(ctrl_ch, float(idx) * step_delay)
			else:
				ctrl_ch.modulate.a = 1.0
			idx += 1

func make_language_dropdown(compact: bool = false) -> OptionButton:
	var ob := OptionButton.new()
	ob.custom_minimum_size = Vector2(138 if compact else 210, 38)
	ob.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	for i in range(L.SUPPORTED_LANGUAGES.size()):
		var item: Dictionary = L.SUPPORTED_LANGUAGES[i]
		var label_str := "%s" % str(item["native"]) if not compact else "%s • %s" % [str(item["short"]), str(item["native"])]
		ob.add_item(label_str, i)
	ob.selected = L.get_language_index()
	ob.item_selected.connect(func(idx: int):
		if idx >= 0 and idx < L.SUPPORTED_LANGUAGES.size():
			AudioManager.play_sfx("ui_click", 0.03, 0.75)
			L.set_language(str(L.SUPPORTED_LANGUAGES[idx]["code"]), true)
	)
	L.language_changed.connect(func(_new_lang: String):
		if is_instance_valid(ob):
			ob.selected = L.get_language_index()
	)
	return ob

func apply_graphics_preset(preset: String) -> void:
	graphics_preset = preset
	var vp := get_viewport()
	if not vp:
		return
	match preset:
		"Low":
			vp.msaa_3d = Viewport.MSAA_DISABLED
			vp.scaling_3d_scale = 0.80
		"Medium":
			vp.msaa_3d = Viewport.MSAA_2X
			vp.scaling_3d_scale = 0.95
		_:
			vp.msaa_3d = Viewport.MSAA_4X
			vp.scaling_3d_scale = 1.0

# ============================================================================
# v2.1 EXPANDED PERSISTED SETTINGS STORE
# Every value below is consumed by live gameplay / presentation code paths.
# ============================================================================

var ui_scale: float = 1.0
var camera_fov: float = 65.0
var invert_y_axis: bool = false
var crosshair_opacity: float = 1.0
var screen_shake: float = 1.0
var show_hud_bars: bool = true
var achievement_toasts: bool = true
var auto_save: bool = true
var vsync_enabled: bool = true
var fps_cap: int = 120

func apply_ui_scale() -> void:
	ui_scale = clampf(ui_scale, 0.75, 1.35)
	if main_theme:
		main_theme.default_font_size = int(round(15.0 * ui_scale))
	var win := get_window()
	if win:
		win.content_scale_factor = ui_scale

func apply_display_settings() -> void:
	fps_cap = clampi(fps_cap, 30, 240)
	Engine.max_fps = fps_cap if not vsync_enabled else 0
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if vsync_enabled else DisplayServer.VSYNC_DISABLED
	)

func apply_all_settings() -> void:
	apply_ui_scale()
	apply_display_settings()
	apply_graphics_preset(graphics_preset)

func settings_snapshot() -> Dictionary:
	return {
		"graphics_preset": graphics_preset,
		"reduced_motion": reduced_motion,
		"camera_sensitivity": camera_sensitivity,
		"camera_fov": camera_fov,
		"invert_y_axis": invert_y_axis,
		"crosshair_opacity": crosshair_opacity,
		"screen_shake": screen_shake,
		"show_hud_bars": show_hud_bars,
		"achievement_toasts": achievement_toasts,
		"auto_save": auto_save,
		"vsync_enabled": vsync_enabled,
		"fps_cap": fps_cap,
		"ui_scale": ui_scale,
	}

func load_settings_snapshot(st: Dictionary) -> void:
	graphics_preset = str(st.get("graphics_preset", "High"))
	reduced_motion = bool(st.get("reduced_motion", false))
	camera_sensitivity = clampf(float(st.get("camera_sensitivity", 1.0)), 0.2, 3.0)
	camera_fov = clampf(float(st.get("camera_fov", 65.0)), 45.0, 105.0)
	invert_y_axis = bool(st.get("invert_y_axis", false))
	crosshair_opacity = clampf(float(st.get("crosshair_opacity", 1.0)), 0.15, 1.0)
	screen_shake = clampf(float(st.get("screen_shake", 1.0)), 0.0, 1.5)
	show_hud_bars = bool(st.get("show_hud_bars", true))
	achievement_toasts = bool(st.get("achievement_toasts", true))
	auto_save = bool(st.get("auto_save", true))
	vsync_enabled = bool(st.get("vsync_enabled", true))
	fps_cap = clampi(int(st.get("fps_cap", 120)), 30, 240)
	ui_scale = clampf(float(st.get("ui_scale", 1.0)), 0.75, 1.35)
	apply_all_settings()
