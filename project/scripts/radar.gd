class_name CoastRadar
extends Control

var world_position := Vector3.ZERO
var route := PackedVector3Array()


func _draw() -> void:
	var size := get_size()
	var center := size * 0.5
	draw_circle(center, minf(size.x, size.y) * 0.49, Color(0.025, 0.07, 0.09, 0.84))
	draw_arc(
		center, minf(size.x, size.y) * 0.49, 0, TAU, 64, Color(0.43, 0.79, 0.77, 0.68), 1.5, true
	)
	# Subtle latitude/longitude guides give the compact map a clean navigational frame.
	for i in range(1, 4):
		var x := size.x * i / 4.0
		var y := size.y * i / 4.0
		draw_line(Vector2(x, 0), Vector2(x, size.y), Color(0.27, 0.48, 0.5, 0.22), 1.0)
		draw_line(Vector2(0, y), Vector2(size.x, y), Color(0.27, 0.48, 0.5, 0.22), 1.0)
	if route.size() > 1:
		var line := PackedVector2Array()
		for point in route:
			line.append(_to_map(point, size))
		draw_polyline(line, Color("#e8ba68"), 2.2, true)
	var player := _to_map(world_position, size)
	draw_circle(player, 5.0, Color("#f6e5bd"))
	draw_circle(player, 2.6, Color("#ff6f50"))


func _to_map(point: Vector3, size: Vector2) -> Vector2:
	# Map bounds are authored around the playable Aurora Coast basin.
	var nx := inverse_lerp(-365.0, 330.0, point.x)
	var nz := inverse_lerp(-310.0, 310.0, point.z)
	return Vector2(lerpf(size.x * 0.08, size.x * 0.92, nx), lerpf(size.y * 0.08, size.y * 0.92, nz))


func update_location(point: Vector3) -> void:
	world_position = point
	queue_redraw()
