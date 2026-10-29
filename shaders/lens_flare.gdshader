shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled, shadows_disabled, fog_disabled;

// Billboard star flare: hot core, soft corona and four anamorphic streaks.
// Drawn as a camera-facing quad at a very long distance so it can never be
// occluded by the field the player fights in.

uniform vec3 core_color : source_color = vec3(1.0, 0.95, 0.82);
uniform vec3 halo_color : source_color = vec3(1.0, 0.62, 0.28);
uniform float intensity = 2.4;
uniform float core_size = 0.055;
uniform float streak_strength = 0.55;
uniform float flicker = 0.06;

float hash11(float n) {
	return fract(sin(n) * 43758.5453);
}

void fragment() {
	vec2 uv = UV - 0.5;
	float r = length(uv) * 2.0;
	float core = smoothstep(core_size * 2.2, 0.0, r);
	float corona = pow(clamp(1.0 - r, 0.0, 1.0), 3.2);
	float wide = pow(clamp(1.0 - r * 0.55, 0.0, 1.0), 1.5);
	float streak = exp(-abs(uv.y) * 62.0) * clamp(1.0 - abs(uv.x) * 2.1, 0.0, 1.0);
	streak += exp(-abs(uv.x) * 62.0) * clamp(1.0 - abs(uv.y) * 2.1, 0.0, 1.0) * 0.6;
	float twinkle = 1.0 + flicker * (hash11(floor(TIME * 12.0)) - 0.5) * 2.0;
	vec3 col = core_color * (core * 2.6 + corona * 1.5) + halo_color * (wide * 0.7 + streak * streak_strength);
	ALBEDO = col * intensity * twinkle;
	ALPHA = clamp(core + corona * 0.9 + wide * 0.55 + streak * streak_strength * 0.7, 0.0, 1.0);
}
