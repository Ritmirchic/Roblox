shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec4 holo_color : source_color = vec4(0.18, 0.85, 1.0, 0.65);

void fragment() {
	float scan = 0.72 + 0.28 * sin(UV.y * 90.0 - TIME * 5.0);
	float border_x = smoothstep(0.42, 0.5, abs(UV.x - 0.5));
	float border_y = smoothstep(0.42, 0.5, abs(UV.y - 0.5));
	float rim = max(border_x, border_y);
	float alpha = (0.20 * scan + rim * 0.65) * holo_color.a;
	ALBEDO = holo_color.rgb * (0.9 + rim * 0.9);
	ALPHA = clamp(alpha, 0.0, 0.92);
}
