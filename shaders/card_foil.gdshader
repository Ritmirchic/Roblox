shader_type canvas_item;

uniform int rarity_tier : hint_range(0, 6) = 0;
uniform float shimmer_speed : hint_range(0.0, 5.0) = 1.4;
uniform float reduced_motion : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec4 base = texture(TEXTURE, UV) * COLOR;
	float t = TIME * shimmer_speed * (1.0 - reduced_motion * 0.85);
	float diag = UV.x * 0.85 + UV.y * 0.65;

	if (rarity_tier >= 2) {
		float sweep = smoothstep(0.08, 0.0, abs(fract(diag * 0.7 - t * 0.35) - 0.5));
		vec3 tint = vec3(0.25, 0.75, 1.0);
		if (rarity_tier == 3) tint = vec3(0.78, 0.35, 1.0);
		if (rarity_tier == 4) tint = vec3(1.0, 0.82, 0.25);
		if (rarity_tier == 5) {
			tint = 0.55 + 0.45 * cos(t * 1.8 + vec3(0.0, 2.1, 4.2) + UV.xyx * 4.0);
			float neb = 0.5 + 0.5 * sin(UV.x * 9.0 + t) * cos(UV.y * 7.0 - t * 0.8);
			base.rgb = mix(base.rgb, base.rgb + tint * 0.26 * neb, 0.75);
		}
		if (rarity_tier == 6) {
			float pulse = 0.5 + 0.5 * sin(t * 2.6 - length(UV - vec2(0.5)) * 10.0);
			tint = mix(vec3(1.0, 0.18, 0.45), vec3(1.0, 0.86, 0.32), pulse);
			base.rgb += tint * 0.22 * pulse;
		}
		base.rgb += tint * sweep * (0.18 + float(rarity_tier) * 0.05);
	}
	COLOR = base;
}
