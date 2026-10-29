extends RefCounted


static func menu_button(
	title: String, description: String, callback: Callable, _accent: bool = true
) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(330, 68)
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.text = "%s\n%s" % [title, description]
	button.add_theme_font_size_override("font_size", 15)
	button.add_theme_color_override("font_color", Color("f0f3ed"))
	button.add_theme_color_override("font_hover_color", Color("ffffff"))
	button.add_theme_color_override("font_pressed_color", Color("e3b974"))
	button.add_theme_stylebox_override(
		"normal", button_style(Color(0.08, 0.15, 0.17, 0.92), Color(0.2, 0.39, 0.39, 0.68))
	)
	button.add_theme_stylebox_override(
		"hover", button_style(Color(0.12, 0.26, 0.26, 0.98), Color(0.39, 0.85, 0.76, 0.95))
	)
	button.add_theme_stylebox_override(
		"pressed", button_style(Color(0.07, 0.20, 0.21, 1.0), Color(0.91, 0.67, 0.35, 0.92))
	)
	button.add_theme_stylebox_override(
		"focus", button_style(Color(0.09, 0.19, 0.20, 1.0), Color(0.88, 0.68, 0.40, 1.0))
	)
	button.add_theme_constant_override("h_separation", 12)
	button.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.35))
	button.add_theme_constant_override("shadow_offset_x", 0)
	button.add_theme_constant_override("shadow_offset_y", 1)
	button.pressed.connect(callback)
	return button


static func settings_button(
	title: String, description: String, callback: Callable, accent: bool = true
) -> Button:
	var button := menu_button(title, description, callback, accent)
	button.custom_minimum_size = Vector2(590, 56)
	return button


static func label(text: String, size: int, color: Color) -> Label:
	var result := Label.new()
	result.text = text
	result.add_theme_font_size_override("font_size", size)
	result.add_theme_color_override("font_color", color)
	result.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.36))
	result.add_theme_constant_override("shadow_offset_x", 1)
	result.add_theme_constant_override("shadow_offset_y", 1)
	result.size = result.get_combined_minimum_size()
	return result


static func spacer(height: float) -> Control:
	var result := Control.new()
	result.custom_minimum_size = Vector2(0, height)
	return result


static func panel_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 18
	style.content_margin_bottom = 18
	return style


static func button_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = 15
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style


static func glow_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color * 0.66
	material.emission_energy_multiplier = 1.2
	material.roughness = 0.32
	return material
