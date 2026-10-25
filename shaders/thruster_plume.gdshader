shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec4 core_color : source_color = vec4(0.55, 0.95, 1.0, 1.0);
uniform vec4 outer_color : source_color = vec4(0.08, 0.52, 1.0, 1.0);
uniform float throttle : hint_range(0.0, 1.5) = 0.65;
uniform float heat_ratio : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	float along = clamp(1.0 - UV.y, 0.0, 1.0);
	float rim = pow(clamp(abs(dot(NORMAL, VIEW)), 0.0, 1.0), 1.4);
	float mach = 0.78 + 0.22 * sin(UV.y * 24.0 - TIME * 28.0);
	vec3 hot_outer = mix(outer_color.rgb, vec3(1.0, 0.38, 0.08), heat_ratio);
	vec3 col = mix(hot_outer, core_color.rgb, smoothstep(0.35, 0.9, along * rim));
	float a = along * rim * mach * clamp(throttle, 0.05, 1.4);
	ALBEDO = col * (1.2 + throttle * 0.9);
	ALPHA = clamp(a, 0.0, 0.95);
}
