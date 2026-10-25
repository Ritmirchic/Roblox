shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec4 shield_color : source_color = vec4(0.18, 0.78, 1.0, 0.55);
uniform float hit_flash : hint_range(0.0, 1.0) = 0.0;
uniform float shield_ratio : hint_range(0.0, 1.0) = 1.0;

void fragment() {
	float fresnel = pow(1.0 - clamp( abs(dot(NORMAL, VIEW)), 0.0, 1.0 ), 2.6);
	vec2 hex_uv = UV * vec2(26.0, 14.0);
	float gx = abs(fract(hex_uv.x) - 0.5);
	float gy = abs(fract(hex_uv.y + TIME * 0.35) - 0.5);
	float lattice = smoothstep(0.42, 0.49, max(gx, gy));
	float scan = 0.5 + 0.5 * sin(UV.y * 28.0 - TIME * 4.5);
	float alpha = (fresnel * 0.72 + lattice * 0.25 * scan + hit_flash * 0.65) * shield_ratio;
	vec3 col = mix(shield_color.rgb, vec3(0.88, 0.98, 1.0), hit_flash * 0.7 + lattice * 0.3);
	ALBEDO = col * clamp(alpha * 1.6, 0.0, 2.0);
	ALPHA = clamp(alpha, 0.0, 0.92);
}
