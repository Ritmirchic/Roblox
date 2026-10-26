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

# ── procedural UI skin kit (assets/ui/*.png, rendered by tools/render_ui_skin.py) ──
const SKIN_DIR := "res://assets/ui/"
## 9-slice corner size of every kit texture in px; also used as the base content
## padding so no text ever lands on a chamfered corner.
const SKIN_MARGIN := {
	"panel_main": 30, "panel_inset": 16, "header_bar": 16, "btn": 14, "tab": 14,
	"slider": 7, "slider_grab": 12, "check": 10, "bar": 6, "pill": 11,
	"card_frame": 30, "keycap": 13, "divider": 2, "backdrop": 34,
}
var _skin_tex: Dictionary = {}
var _skin_sb: Dictionary = {}

func skin_texture(key: String) -> Texture2D:
	if _skin_tex.has(key):
		return _skin_tex[key]
	var path := SKIN_DIR + key + ".png"
	var tex: Texture2D = null
	if ResourceLoader.exists(path):
		tex = load(path) as Texture2D
	_skin_tex[key] = tex
	return tex

func skin_available() -> bool:
	return skin_texture("panel_main") != null

## Chamfered plate style for the given kit texture. `pad` is extra inner padding on
## top of the corner margin; `tint` multiplies the artwork so rarity accents still
## drive the colour of a panel.
func make_skin_style(key: String, pad: int = 10, tint: Color = Color.WHITE) -> StyleBoxTexture:
	var cache_key := "%s|%d|%s" % [key, pad, tint.to_html(true)]
	if _skin_sb.has(cache_key):
		return _skin_sb[cache_key]
	var tex := skin_texture(key)
	if tex == null:
		return null
	var sb := StyleBoxTexture.new()
	sb.texture = tex
	var m: float = float(SKIN_MARGIN.get(key, 12))
	sb.texture_margin_left = m
	sb.texture_margin_right = m
	sb.texture_margin_top = m
	sb.texture_margin_bottom = m
	# STRETCH (the default) is required: TILE repeats the chamfer across the plate.
	sb.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
	sb.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
	sb.content_margin_left = m + float(pad)
	sb.content_margin_right = m + float(pad)
	sb.content_margin_top = m * 0.34 + float(pad)
	sb.content_margin_bottom = m * 0.34 + float(pad)
	sb.modulate_color = tint
	_skin_sb[cache_key] = sb
	return sb

## Multiply-only tint: the kit art is already dark armour plate, so the requested
## panel colour becomes a hue push rather than a flat fill (keeps text contrast).
func _skin_tint(bg: Color, border: Color) -> Color:
	var hue := Color(1, 1, 1).lerp(border.lightened(0.30), 0.42)
	var lum: float = clampf(bg.v * 2.6, 0.55, 1.0)
	return Color(hue.r * lum, hue.g * lum, hue.b * lum, clampf(bg.a, 0.86, 1.0))

## Etched rule used between rows/tabs (falls back to HSeparator without the kit).
func make_divider(sep_color: Color = Color(0.22, 0.72, 1.0, 0.40)) -> Control:
	if skin_available():
		var box := PanelContainer.new()
		box.name = "KitDivider"
		box.custom_minimum_size = Vector2(0, 13)
		box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		box.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var sb := make_skin_style("divider", -2)
		if sb != null:
			box.add_theme_stylebox_override("panel", sb)
			return box
	var sep := HSeparator.new()
	sep.modulate = sep_color
	return sep


## HUD gauge: the kit's chevron bar tinted to the gauge colour (hull/shield/...).
func make_hud_bar_style(col: Color, for_fill: bool = true) -> StyleBox:
	if skin_available():
		var key := "bar"
		var tint := Color(1, 1, 1, 1.0) if for_fill else Color(0.42, 0.50, 0.62, 0.85)
		if for_fill:
			tint = Color(1, 1, 1, 1.0).lerp(col.lightened(0.30), 0.55)
		var sb := make_skin_style(key, 0, tint)
		if sb != null:
			# Never mutate the cached plate: other gauges share the same artwork
			# key and would inherit these margins.
			var loose := sb.duplicate() as StyleBoxTexture
			loose.content_margin_top = 0.0
			loose.content_margin_bottom = 0.0
			return loose
	if for_fill:
		var f := StyleBoxFlat.new()
		f.bg_color = col
		f.border_color = col.lightened(0.3)
		f.set_border_width_all(1)
		f.set_corner_radius_all(4)
		return f
	var b := StyleBoxFlat.new()
	b.bg_color = Color(0.03, 0.055, 0.11, 0.9)
	b.border_color = Color(0.16, 0.38, 0.58, 0.65)
	b.set_border_width_all(1)
	b.set_corner_radius_all(5)
	return b


## Machined command rail: wraps `content` in the kit header plate.
func make_header_rail(accent: Color = COL_BORDER, pad: int = 8) -> PanelContainer:
	var box := PanelContainer.new()
	box.name = "KitHeaderRail"
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if skin_available():
		var tint := Color(0.90, 0.96, 1.00, 0.98).lerp(Color(1, 1, 1).lerp(accent.lightened(0.28), 0.5), 0.5)
		var sb := make_skin_style("header_bar", pad, tint)
		if sb != null:
			box.add_theme_stylebox_override("panel", sb)
			return box
	box.add_theme_stylebox_override("panel", make_panel_style(Color(0.045, 0.085, 0.165, 0.94), accent, 10, 1, pad))
	return box


## Big atmospheric plate for modal backgrounds (kit "backdrop" texture).
func make_modal_style(pad: int = 22, dark: float = 0.72) -> StyleBox:
	if skin_available():
		var sb := make_skin_style("backdrop", pad, Color(dark, dark * 1.02, dark * 1.12, 1.0))
		if sb != null:
			return sb
	return make_plaque_style("rare", dark, pad)


## Tab-shaped styling for the station switcher strip.
func style_nav_tab(btn: Button, selected: bool) -> void:
	if skin_available():
		var key := "tab"
		var tint := Color(1, 1, 1, 1.0) if selected else Color(0.66, 0.76, 0.90, 0.92)
		var sb := make_skin_style(key, 4, tint)
		if sb != null:
			btn.add_theme_stylebox_override("normal", sb)
			btn.add_theme_stylebox_override("hover", make_skin_style(key, 4, Color(0.90, 0.96, 1.0, 1.0)))
			btn.add_theme_stylebox_override("pressed", make_skin_style(key, 4, Color(1, 1, 1, 1.0)))
			btn.add_theme_stylebox_override("focus", make_skin_style(key, 4, Color(1, 1, 1, 1.0)))
			btn.add_theme_stylebox_override("selected", sb)
	btn.add_theme_color_override("font_color", Color(1, 1, 1) if selected else COL_MUTED)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)


## A non-interactive overlay that paints the kit frame on top of a control.
func make_skin_overlay(key: String, tint: Color = Color.WHITE) -> TextureRect:
	var tr := TextureRect.new()
	tr.texture = skin_texture(key)
	if tr.texture == null:
		tr.free()
		return null
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_SCALE
	tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tr.self_modulate = tint
	tr.name = "SkinFrame_%s" % key
	return tr

func make_panel_style(bg: Color = COL_BG_DARK, border: Color = COL_BORDER, corner: int = 12, border_w: int = 2, pad: int = 12) -> StyleBox:
	if skin_available():
		var key := "panel_main" if pad >= 11 else "panel_inset"
		var skin_sb := make_skin_style(key, pad, _skin_tint(bg, border))
		if skin_sb != null:
			return skin_sb
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

func make_pill_style(bg: Color, border: Color, corner: int = 9, pad_x: int = 12, pad_y: int = 6) -> StyleBox:
	# Badges roomy enough for the kit's left accent wedge get the chamfered pill.
	if skin_available() and pad_x >= 10 and pad_y >= 4:
		var skin_pill := make_skin_style("pill", maxi(2, pad_y - 4), _skin_tint(bg, border))
		if skin_pill != null:
			# The cache key does not carry pad_x, so copy before re-padding.
			var pill := skin_pill.duplicate() as StyleBoxTexture
			pill.content_margin_left = float(SKIN_MARGIN["pill"]) + float(pad_x)
			pill.content_margin_right = float(SKIN_MARGIN["pill"]) + float(maxi(4, pad_x - 8))
			return pill
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

	# The kit overrides the flat fallbacks above when assets/ui/ is present.
	_apply_skin_kit()

func _has_skin() -> bool:
	return skin_available()

## Wires the procedural kit into the shared Theme so every screen (menus, station
## tabs, modals, sliders, progress bars) picks up the chamfered plate language.
func _apply_skin_kit() -> void:
	if not skin_available():
		return
	var panel := make_skin_style("panel_main", 16)
	if panel != null:
		main_theme.set_stylebox("panel", "PanelContainer", panel)
		main_theme.set_stylebox("panel", "Panel", make_skin_style("panel_inset", 10))
	var b_norm := make_skin_style("btn", 8, Color(0.80, 0.88, 1.00, 0.96))
	var b_hover := make_skin_style("btn", 8, Color(1.00, 1.00, 1.00, 1.00))
	var b_press := make_skin_style("btn", 8, Color(1.00, 0.92, 0.72, 1.00))
	var b_dis := make_skin_style("btn", 8, Color(0.42, 0.48, 0.56, 0.70))
	for cls in ["Button", "MenuButton"]:
		main_theme.set_stylebox("normal", cls, b_norm)
		main_theme.set_stylebox("hover", cls, b_hover)
		main_theme.set_stylebox("pressed", cls, b_press)
		main_theme.set_stylebox("focus", cls, b_hover)
		main_theme.set_stylebox("disabled", cls, b_dis)
	var opt := make_skin_style("btn", 6, Color(0.80, 0.88, 1.00, 0.96))
	for cls2 in ["OptionButton", "CheckButton"]:
		main_theme.set_stylebox("normal", cls2, opt)
		main_theme.set_stylebox("hover", cls2, b_hover)
		main_theme.set_stylebox("pressed", cls2, b_press)
		main_theme.set_stylebox("focus", cls2, b_hover)
		main_theme.set_stylebox("disabled", cls2, b_dis)
	var tab_on := make_skin_style("tab", 6, Color(1.00, 1.00, 1.00, 1.0))
	var tab_off := make_skin_style("tab", 6, Color(0.62, 0.72, 0.86, 0.92))
	for cls3 in ["TabBar", "TabContainer"]:
		main_theme.set_stylebox("tab_selected", cls3, tab_on)
		main_theme.set_stylebox("tab_hovered", cls3, tab_on)
		main_theme.set_stylebox("tab_unselected", cls3, tab_off)
		main_theme.set_stylebox("panel", cls3, make_skin_style("panel_inset", 12))
		main_theme.set_color("font_selected_color", cls3, Color(1, 1, 1))
		main_theme.set_color("font_color", cls3, COL_MUTED)
	var sl_back := make_skin_style("slider", 2, Color(0.72, 0.84, 1.0, 1.0))
	var sl_fill := make_skin_style("slider", 2, Color(1.0, 1.0, 1.0, 1.0))
	var sl_grab := make_skin_style("slider_grab", -8, Color(1, 1, 1, 1.0))
	for cls4 in ["HSlider", "VSlider"]:
		main_theme.set_stylebox("slider", cls4, sl_back)
		main_theme.set_stylebox("grabber_area", cls4, sl_fill)
		main_theme.set_stylebox("grabber_area_highlight", cls4, sl_fill)
		if sl_grab != null:
			main_theme.set_stylebox("grabber", cls4, sl_grab)
			main_theme.set_stylebox("grabber_highlight", cls4, sl_grab)
	main_theme.set_stylebox("background", "ProgressBar", make_skin_style("bar", 0, Color(0.60, 0.74, 0.92, 1.0)))
	main_theme.set_stylebox("fill", "ProgressBar", make_skin_style("bar", 0, Color(1, 1, 1, 1.0)))
	main_theme.set_stylebox("normal", "LineEdit", make_skin_style("panel_inset", 2, Color(0.70, 0.80, 0.96, 0.98)))
	main_theme.set_stylebox("focus", "LineEdit", make_skin_style("panel_inset", 2, Color(1, 1, 1, 1.0)))
	main_theme.set_stylebox("panel", "PopupMenu", make_skin_style("panel_inset", 6))
	main_theme.set_stylebox("panel", "TooltipPanel", make_skin_style("panel_inset", 6))

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

## Button plate: the kit's chamfered button art, hue-pushed toward `accent`.
func make_button_style(accent: Color, bright: bool = false) -> StyleBox:
	if skin_available():
		var base := Color(1, 1, 1, 1.0) if bright else Color(0.84, 0.90, 0.99, 0.96)
		var tint := base.lerp(Color(1, 1, 1).lerp(accent.lightened(0.22), 0.55), 0.55)
		var s := make_skin_style("btn", 6, tint)
		if s != null:
			return s
	return make_panel_style(accent.darkened(0.62 if bright else 0.52), accent.lightened(0.18), 9, 2, 12)

func style_accent_button(btn: Button, accent: Color) -> void:
	var n := make_button_style(accent.darkened(0.34))
	var h := make_button_style(accent.lightened(0.16), true)
	var p := make_button_style(accent.lightened(0.42), true)
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
