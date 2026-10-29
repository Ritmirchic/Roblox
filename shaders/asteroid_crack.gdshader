shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_back, shadows_disabled, fog_disabled;

// Glowing fracture shell for asteroids. The crack mask is built in object space,
// so it rotates with the rock. `damage` follows the real hp ratio and `heat`
// follows sustained mining-beam contact.

uniform float damage : hint_range(0.0, 1.0) = 0.0;
uniform float heat : hint_range(0.0, 1.0) = 0.0;
uniform vec3 crack_color : source_color = vec3(1.0, 0.46, 0.12);
uniform vec3 heat_color : source_color = vec3(1.0, 0.88, 0.55);
uniform float crack_scale = 3.4;
uniform float shell_pulse = 0.0;

float hash13(vec3 p) {
	p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
	float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
	float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
	float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
	float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
	float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
	float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
	float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
	float nx00 = mix(n000, n100, f.x);
	float nx10 = mix(n010, n110, f.x);
	float nx01 = mix(n001, n101, f.x);
	float nx11 = mix(n011, n111, f.x);
	return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}

// Thin fracture network: iso-lines of two noise octaves.
float crack_mask(vec3 p) {
	float a = vnoise(p * crack_scale);
	float b = vnoise(p * crack_scale * 2.35 + vec3(11.3, 5.7, 8.1));
	float line_a = 1.0 - smoothstep(0.0, 0.055, abs(a - 0.5));
	float line_b = 1.0 - smoothstep(0.0, 0.030, abs(b - 0.5));
	return clamp(max(line_a, line_b * 0.82), 0.0, 1.0);
}

void fragment() {
	vec3 obj = VERTEX * crack_scale;
	float cracks = crack_mask(obj);
		// Cracks only appear where real damage has been taken.
	float reveal = smoothstep(0.02, 0.34, damage + heat * 0.35);
	float glow = cracks * reveal;
	float pulse = 1.0 + shell_pulse * 0.35;
	vec3 tint = mix(crack_color, heat_color, clamp(heat, 0.0, 1.0));
	// Fresnel-ish falloff so the fissures read as depth, not as a flat decal.
	float rim = clamp(1.0 - abs(dot(NORMAL, VIEW)), 0.25, 1.0);
	vec3 col = tint * glow * (1.6 + heat * 2.2) * pulse * (0.55 + rim * 0.75);
	ALBEDO = col;
	ALPHA = clamp(glow * (0.55 + heat * 0.45), 0.0, 1.0);
}
