extends BaseScreen
class_name MapUI

var map_canvas: Control

func _init() -> void:
	super._init("MapUI")

func title_text() -> String:
	return "Regional Map"

func _build_body() -> void:
	map_canvas = Control.new()
	map_canvas.custom_minimum_size = Vector2(820, 560)
	map_canvas.draw.connect(_draw_map)
	content.add_child(map_canvas)
	content.add_child(UiTheme.label(
		"Orange dots: landmarks   White dot: you   Red dots: boss grounds",
		13, UiTheme.TEXT_DIM))

func _draw_map() -> void:
	var bounds := WorldGenerator.BOUNDS
	var size := map_canvas.size
	var pad := 24.0
	var scale_x := (size.x - pad * 2.0) / bounds.size.x
	var scale_y := (size.y - pad * 2.0) / bounds.size.y
	var sc := minf(scale_x, scale_y)
	var to_map := func(p: Vector3) -> Vector2:
		return Vector2(pad + (p.x - bounds.position.x) * sc,
			pad + (p.z - bounds.position.y) * sc)
	# Regions.
	for region in RegionData.regions():
		var c: Vector3 = region.center
		var s: Vector2 = region.size
		var top_left := to_map(Vector3(c.x - s.x * 0.5, 0, c.z - s.y * 0.5))
		var rect := Rect2(top_left, Vector2(s.x * sc, s.y * sc))
		var discovered: bool = GameState.discovered_locations.get(
			region.id, false)
		var fill: Color = region.fog if discovered else Color(0.08, 0.08, 0.09)
		fill.a = 0.55
		map_canvas.draw_rect(rect, fill, true)
		map_canvas.draw_rect(rect, Color(0.3, 0.28, 0.24), false, 2.0)
		if discovered:
			map_canvas.draw_string(ThemeDB.fallback_font,
				rect.position + Vector2(8, 22), region.name,
				HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.9, 0.85, 0.7))
	# Landmarks (only discovered regions show detail).
	for lm in RegionData.landmarks():
		if not GameState.discovered_locations.get(lm.region, false):
			continue
		var mp: Vector2 = to_map(lm.pos)
		var is_boss := String(lm.id).ends_with("arena")
		map_canvas.draw_circle(mp, 5.0,
			Color(0.8, 0.2, 0.15) if is_boss else Color(0.85, 0.6, 0.3))
	# Player.
	if GameState.player and is_instance_valid(GameState.player):
		var pp: Vector2 = to_map(GameState.player.global_position)
		map_canvas.draw_circle(pp, 7.0, Color(0.95, 0.95, 0.95))
		map_canvas.draw_arc(pp, 11.0, 0, TAU, 24, Color(0.1, 0.1, 0.1), 2.0)
