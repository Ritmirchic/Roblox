extends Node

var main_theme: Theme
var font_display: FontFile
var font_bold: FontFile
var font_body: FontFile
var font_mono: FontFile

var graphics_preset: String = "High" # Low, Medium, High, Ultra
var reduced_motion: bool = false
var camera_sensitivity: float = 1.0

func _ready() -> void:
	font_display = load("res://assets/fonts/Orbitron-Bold.ttf")
	font_bold = load("res://assets/fonts/Rajdhani-Bold.ttf")
	font_body = load("res://assets/fonts/Rajdhani-SemiBold.ttf")
	font_mono = load("res://assets/fonts/ShareTechMono-Regular.ttf")
	_build_theme()

func make_panel_style(bg: Color, border: Color, corner: int = 8, border_w: int = 2) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(border_w)
	s.set_corner_radius_all(corner)
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	s.shadow_color = Color(0.0, 0.0, 0.0, 0.45)
	s.shadow_size = 8
	return s

func _build_theme() -> void:
	main_theme = Theme.new()
	if font_body:
		main_theme.default_font = font_body
	main_theme.default_font_size = 19

	# PanelContainer & Panel
	var panel_sb := make_panel_style(Color(0.045, 0.075, 0.145, 0.94), Color(0.16, 0.62, 0.88, 0.80), 10, 2)
	main_theme.set_stylebox("panel", "PanelContainer", panel_sb)
	main_theme.set_stylebox("panel", "Panel", panel_sb)

	# Buttons
	var btn_normal := make_panel_style(Color(0.08, 0.15, 0.27, 0.96), Color(0.20, 0.72, 0.98, 0.85), 7, 2)
	var btn_hover := make_panel_style(Color(0.13, 0.26, 0.44, 0.98), Color(0.38, 0.90, 1.0, 1.0), 7, 2)
	var btn_pressed := make_panel_style(Color(0.20, 0.42, 0.64, 1.0), Color(1.0, 0.78, 0.24, 1.0), 7, 2)
	var btn_disabled := make_panel_style(Color(0.06, 0.08, 0.13, 0.70), Color(0.22, 0.28, 0.36, 0.55), 7, 1)

	for t in ["Button", "OptionButton"]:
		main_theme.set_stylebox("normal", t, btn_normal)
		main_theme.set_stylebox("hover", t, btn_hover)
		main_theme.set_stylebox("pressed", t, btn_pressed)
		main_theme.set_stylebox("focus", t, btn_hover)
		main_theme.set_stylebox("disabled", t, btn_disabled)
		if font_bold:
			main_theme.set_font("font", t, font_bold)
		main_theme.set_font_size("font_size", t, 20)
		main_theme.set_color("font_color", t, Color(0.90, 0.96, 1.0))
		main_theme.set_color("font_hover_color", t, Color(1.0, 0.92, 0.62))
		main_theme.set_color("font_pressed_color", t, Color(1.0, 1.0, 1.0))
		main_theme.set_color("font_disabled_color", t, Color(0.45, 0.52, 0.62))

	# LineEdit
	var le_sb := make_panel_style(Color(0.03, 0.05, 0.10, 0.95), Color(0.18, 0.58, 0.85, 0.85), 6, 2)
	main_theme.set_stylebox("normal", "LineEdit", le_sb)
	main_theme.set_stylebox("focus", "LineEdit", btn_hover)
	main_theme.set_color("font_color", "LineEdit", Color(0.92, 0.97, 1.0))

	# ProgressBar
	var pb_bg := make_panel_style(Color(0.03, 0.05, 0.09, 0.92), Color(0.16, 0.36, 0.54, 0.8), 5, 1)
	pb_bg.content_margin_left = 2
	pb_bg.content_margin_right = 2
	pb_bg.content_margin_top = 2
	pb_bg.content_margin_bottom = 2
	var pb_fill := make_panel_style(Color(0.16, 0.78, 0.98, 0.96), Color(0.55, 0.95, 1.0, 1.0), 4, 1)
	pb_fill.shadow_size = 0
	main_theme.set_stylebox("background", "ProgressBar", pb_bg)
	main_theme.set_stylebox("fill", "ProgressBar", pb_fill)

	# Labels
	main_theme.set_color("font_color", "Label", Color(0.89, 0.95, 1.0))

func wire_button_fx(btn: BaseButton) -> void:
	if not btn or btn.has_meta("fx_wired"):
		return
	btn.set_meta("fx_wired", true)
	btn.pivot_offset = btn.size * 0.5
	btn.mouse_entered.connect(func():
		AudioManager.play_sfx("ui_hover", 0.04, 0.55)
		if not reduced_motion and is_inside_tree():
			btn.pivot_offset = btn.size * 0.5
			var tw := btn.create_tween()
			tw.tween_property(btn, "scale", Vector2(1.03, 1.03), 0.09)
	)
	btn.mouse_exited.connect(func():
		if not reduced_motion and is_inside_tree():
			btn.pivot_offset = btn.size * 0.5
			var tw := btn.create_tween()
			tw.tween_property(btn, "scale", Vector2.ONE, 0.09)
	)
	btn.pressed.connect(func():
		AudioManager.play_sfx("ui_click", 0.04, 0.8)
	)

func style_accent_button(btn: Button, accent: Color) -> void:
	btn.add_theme_stylebox_override("normal", make_panel_style(accent.darkened(0.62), accent, 7, 2))
	btn.add_theme_stylebox_override("hover", make_panel_style(accent.darkened(0.42), accent.lightened(0.28), 7, 2))
	btn.add_theme_stylebox_override("pressed", make_panel_style(accent.darkened(0.25), Color.WHITE, 7, 2))
	wire_button_fx(btn)

func apply_graphics_preset(preset: String) -> void:
	graphics_preset = preset
	var vp := get_viewport()
	if not vp:
		return
	match preset:
		"Low":
			vp.msaa_3d = Viewport.MSAA_DISABLED
			vp.scaling_3d_scale = 0.85
		"Medium":
			vp.msaa_3d = Viewport.MSAA_DISABLED
			vp.scaling_3d_scale = 1.0
		"High":
			vp.msaa_3d = Viewport.MSAA_2X
			vp.scaling_3d_scale = 1.0
		"Ultra":
			vp.msaa_3d = Viewport.MSAA_4X
			vp.scaling_3d_scale = 1.0
