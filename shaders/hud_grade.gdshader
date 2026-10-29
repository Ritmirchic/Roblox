shader_type canvas_item;

// Full-screen combat grade: vignette, film grain, faint scanlines and a
// chromatic aberration that only opens up on damage. Runs as a full-rect
// overlay reading the screen texture, so no HUD element moves or blurs.

uniform sampler2D screen_tex : filter_linear, hint_screen_texture, repeat_disable;

uniform float vignette_strength : hint_range(0.0, 1.2) = 0.42;
uniform float grain_amount : hint_range(0.0, 0.3) = 0.045;
uniform float scanline_amount : hint_range(0.0, 0.25) = 0.05;
uniform float damage_flash : hint_range(0.0, 1.0) = 0.0;
uniform float speed_warp : hint_range(0.0, 1.0) = 0.0;
uniform float saturation : hint_range(0.6, 1.6) = 1.06;
uniform float warmth : hint_range(-0.2, 0.2) = 0.04;
uniform vec2 center_bias = vec2(0.5, 0.52);

float hash12(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 from_c = uv - center_bias;
	float r2 = dot(from_c, from_c);

	// Chromatic aberration: near zero at rest, edges split on damage / boost.
	float ca = (0.0006 + damage_flash * 0.0052 + speed_warp * 0.0016) * (0.35 + r2 * 2.6);
	vec2 dir = ca > 0.0 ? normalize(from_c + vec2(1e-5, 0.0)) : vec2(0.0);
	vec3 col;
	col.r = texture(screen_tex, uv + dir * ca).r;
	col.g = texture(screen_tex, uv).g;
	col.b = texture(screen_tex, uv - dir * ca).b;

	// Vignette keeps focus centred without swallowing the instrument frame.
	float vig = 1.0 - vignette_strength * smoothstep(0.06, 0.62, r2);
	col *= vig;

	// Warm centre / cool edges: the cinematic split-tone.
	col += vec3(warmth, warmth * 0.35, -warmth * 0.55) * (0.5 - r2) * 0.5;

	// Gentle saturation: pull toward luminance instead of clipping colour.
	float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
	col = mix(vec3(lum), col, saturation);

	// CRT scanlines and grain, both scaled by the quality profile.
	float scan = 0.5 + 0.5 * sin(uv.y * 1120.0);
	col *= 1.0 - scanline_amount * scan;
	float grain = hash12(floor(uv * vec2(1024.0, 1024.0)) + floor(TIME * 24.0)) - 0.5;
	col += grain * grain_amount;

	// Damage flash: warm red at the edges, never a full-screen wash.
	col += vec3(0.62, 0.06, 0.05) * damage_flash * smoothstep(0.05, 0.55, r2) * 0.9;

	COLOR = vec4(max(col, vec3(0.0)), 1.0);
}
