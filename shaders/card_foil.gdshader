shader_type canvas_item;

uniform int rarity_tier : hint_range(0, 6) = 0;
uniform float shimmer_speed : hint_range(0.0, 5.0) = 1.35;
uniform float reduced_motion : hint_range(0.0, 1.0) = 0.0;
uniform vec2 hover_uv = vec2(0.5, 0.5);
uniform float hover_amount : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec4 base = texture(TEXTURE, UV) * COLOR;
	float t = TIME * shimmer_speed * (1.0 - reduced_motion * 0.85);
	float diag = UV.x * 0.82 + UV.y * 0.68;

	// Interactive mouse-tracked collector foil sheen on hover (all rarities!)
	if (hover_amount > 0.005) {
		float h_line = (hover_uv.x * 0.82 + hover_uv.y * 0.68);
		float glint = smoothstep(0.24, 0.0, abs(diag - h_line));
		float spot = exp(-distance(UV, hover_uv) * 3.4);
		vec3 spec_col = mix(vec3(0.75, 0.92, 1.0), vec3(1.0, 0.90, 0.65), UV.x);
		base.rgb += spec_col * (glint * 0.22 + spot * 0.14) * hover_amount;
	}

	if (rarity_tier >= 2) {
		float sweep = smoothstep(0.09, 0.0, abs(fract(diag * 0.65 - t * 0.30) - 0.5));
		vec3 tint = vec3(0.26, 0.78, 1.0);
		if (rarity_tier == 3) tint = vec3(0.82, 0.38, 1.0);
		if (rarity_tier == 4) tint = vec3(1.0, 0.82, 0.26);
		if (rarity_tier == 5) {
			tint = 0.58 + 0.42 * cos(t * 1.6 + vec3(0.0, 2.1, 4.2) + UV.xyx * 3.6);
			float neb = 0.5 + 0.5 * sin(UV.x * 8.0 + t) * cos(UV.y * 6.5 - t * 0.7);
			base.rgb += tint * 0.18 * neb;
		}
		if (rarity_tier == 6) {
			float pulse = 0.5 + 0.5 * sin(t * 2.4 - length(UV - vec2(0.5)) * 9.0);
			tint = mix(vec3(1.0, 0.22, 0.50), vec3(1.0, 0.86, 0.34), pulse);
			base.rgb += tint * 0.16 * pulse;
		}
		base.rgb += tint * sweep * (0.15 + float(rarity_tier) * 0.04);
	}
	COLOR = base;
}
