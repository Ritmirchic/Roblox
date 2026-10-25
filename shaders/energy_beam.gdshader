shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec4 beam_color : source_color = vec4(0.15, 0.92, 1.0, 1.0);
uniform float pulse_speed : hint_range(1.0, 30.0) = 14.0;
uniform float intensity : hint_range(0.1, 4.0) = 1.6;

void fragment() {
	float edge = pow(clamp(abs(dot(NORMAL, VIEW)), 0.0, 1.0), 1.35);
	float wave = 0.72 + 0.28 * sin(UV.y * 34.0 - TIME * pulse_speed);
	float core = smoothstep(0.55, 0.95, edge);
	vec3 col = mix(beam_color.rgb, vec3(1.0, 1.0, 1.0), core * 0.75) * wave * intensity;
	ALBEDO = col;
	ALPHA = clamp(edge * 0.92 * wave, 0.0, 1.0);
}
