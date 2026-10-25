extends Control

var engaged := false


func set_engaged(value: bool) -> void:
	engaged = value
	queue_redraw()


func _draw() -> void:
	var center := size * 0.5
	var color := Color(0.84, 0.87, 0.82, 0.82 if engaged else 0.5)
	var radius := 4.0 if engaged else 2.0
	draw_circle(center, radius, color)
	draw_line(center + Vector2(-9, 0), center + Vector2(-4, 0), color, 1.0, true)
	draw_line(center + Vector2(4, 0), center + Vector2(9, 0), color, 1.0, true)
	draw_line(center + Vector2(0, -9), center + Vector2(0, -4), color, 1.0, true)
	draw_line(center + Vector2(0, 4), center + Vector2(0, 9), color, 1.0, true)
