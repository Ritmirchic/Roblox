extends Control

var route: Array = []
var player_position := Vector3.ZERO
var map_center := Vector2.ZERO
var map_scale := 0.55
var show_route := false


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, Color(0.025, 0.06, 0.085, 0.86), true)
	draw_rect(rect, Color(0.30, 0.80, 0.76, 0.72), false, 2.0)
	if route.size() > 1:
		var points := PackedVector2Array()
		for p in route:
			points.append(_map_point(p))
		draw_polyline(points, Color(0.93, 0.77, 0.52, 0.9), 2.0, true)
	var player := _map_point(player_position)
	draw_circle(player, 6.5, Color("5de4d5"))
	draw_arc(player, 10, 0, TAU, 32, Color("effaf4"), 1.5)


func _map_point(world_pos: Vector3) -> Vector2:
	var delta := Vector2(world_pos.x - map_center.x, world_pos.z - map_center.y) * map_scale
	return Vector2(size.x * 0.5 + delta.x, size.y * 0.5 + delta.y)
