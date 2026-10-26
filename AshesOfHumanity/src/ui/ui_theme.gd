extends RefCounted
class_name UiTheme
## Dark industrial UI styling shared by every screen and the HUD.

const BG := Color(0.045, 0.05, 0.055, 0.96)
const PANEL := Color(0.09, 0.1, 0.11, 0.95)
const PANEL_LIGHT := Color(0.14, 0.15, 0.16, 0.95)
const ACCENT := Color(0.82, 0.42, 0.2)
const ACCENT_COLD := Color(0.45, 0.62, 0.78)
const TEXT := Color(0.86, 0.85, 0.8)
const TEXT_DIM := Color(0.55, 0.56, 0.55)
const DANGER := Color(0.8, 0.2, 0.15)
const GOOD := Color(0.45, 0.7, 0.4)

static func style(color: Color, radius := 4, border_w := 0,
		border_color := Color(0.25, 0.22, 0.18)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left = radius
	s.corner_radius_top_right = radius
	s.corner_radius_bottom_left = radius
	s.corner_radius_bottom_right = radius
	s.border_width_left = border_w
	s.border_width_right = border_w
	s.border_width_top = border_w
	s.border_width_bottom = border_w
	s.border_color = border_color
	s.content_margin_left = 10
	s.content_margin_right = 10
	s.content_margin_top = 6
	s.content_margin_bottom = 6
	return s

static func label(text: String, size := 16, color := TEXT,
		align := HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.horizontal_alignment = align
	return l

static func button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(180, 42)
	b.add_theme_stylebox_override("normal", style(PANEL_LIGHT, 4, 1))
	b.add_theme_stylebox_override("hover", style(
		Color(0.2, 0.18, 0.15), 4, 1, ACCENT))
	b.add_theme_stylebox_override("pressed", style(
		Color(0.28, 0.2, 0.12), 4, 1, ACCENT))
	b.add_theme_color_override("font_color", TEXT)
	b.add_theme_color_override("font_hover_color", Color(1, 0.9, 0.75))
	b.add_theme_font_size_override("font_size", 17)
	b.pressed.connect(func(): AudioMan.play_2d("ui_click", -10.0))
	return b

static func panel() -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", style(PANEL, 6, 1))
	return p

static func bar(value: float, color: Color,
		bg := Color(0.08, 0.08, 0.08)) -> ProgressBar:
	var b := ProgressBar.new()
	b.min_value = 0
	b.max_value = 100
	b.value = clampf(value * 100.0, 0.0, 100.0)
	b.custom_minimum_size = Vector2(190, 14)
	b.show_percentage = false
	b.add_theme_stylebox_override("background", style(bg, 2))
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	fill.corner_radius_top_left = 2
	fill.corner_radius_top_right = 2
	fill.corner_radius_bottom_left = 2
	fill.corner_radius_bottom_right = 2
	b.add_theme_stylebox_override("fill", fill)
	return b

static func header(text: String) -> Label:
	var l := label(text, 28, Color(0.95, 0.85, 0.65))
	return l

static func refresh_bar(bar_node: ProgressBar, fraction: float) -> void:
	bar_node.value = clampf(fraction * 100.0, 0.0, 100.0)
