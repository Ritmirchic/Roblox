shader_type canvas_item;

uniform int rarity_tier : hint_range(0, 6) = 0;
uniform float shimmer_speed : hint_range(0.0, 5.0) = 1.35;
uniform float reduced_motion : hint_range(0.0, 1.0) = 0.0;
uniform vec2 hover_uv = vec2(0.5, 0.5);
uniform float hover_amount : hint_range(0.0, 1.0) = 0.0;

// Foil finish mutations (v2.3.0): silver / holo / glitter / glow treatments.
uniform float finish_sheen : hint_range(0.0, 1.0) = 0.0;
uniform float finish_prism : hint_range(0.0, 1.0) = 0.0;
uniform float finish_sparkle : hint_range(0.0, 1.0) = 0.0;
uniform float finish_glow : hint_range(0.0, 1.0) = 0.0;
uniform float finish_metal : hint_range(0.0, 1.0) = 0.0;
uniform vec3 finish_tint = vec3(1.0);

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

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
	// ── finish mutations ────────────────────────────────────────────────────
	float lum = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
	if (finish_metal > 0.003) {
		// silvered frames read as brushed metal: desaturated, cooler, brighter
		vec3 silver = mix(base.rgb, vec3(lum) * vec3(0.92, 0.96, 1.04), finish_metal);
		silver += vec3(0.05, 0.07, 0.09) * finish_metal * smoothstep(0.55, 1.0, lum);
		base.rgb = silver;
	}
	if (finish_sheen > 0.003) {
		float band = smoothstep(0.30, 0.0, abs(fract(diag * 0.42 - t * 0.22) - 0.5));
		base.rgb += vec3(0.85, 0.93, 1.0) * band * band * finish_sheen * 0.20;
	}
	if (finish_prism > 0.003) {
		// holographic: a thin rainbow sweep that follows the pointer like real foil
		float ph = diag * 7.4 + t * 0.35 + hover_amount * 5.2;
		vec3 holo = 0.5 + 0.5 * cos(ph + vec3(0.0, 2.09, 4.19));
		float mask = 0.42 + 0.58 * smoothstep(0.0, 1.0, sin(diag * 3.1 - t * 0.45));
		base.rgb += holo * finish_prism * mask * 0.22;
	}
	if (finish_sparkle > 0.003) {
		vec2 cell = floor(UV * vec2(56.0, 68.0));
		float seed = hash21(cell);
		float tw = fract(seed * 7.13) + t * (0.16 + 0.30 * hover_amount);
		float fl = pow(max(0.0, 1.0 - abs(fract(tw) - 0.5) * 3.4), 3.0);
		vec2 f = fract(UV * vec2(56.0, 68.0)) - 0.5;
		float dot_m = exp(-dot(f, f) * 26.0);
		base.rgb += vec3(1.0, 0.98, 0.92) * fl * fl * dot_m * finish_sparkle * 1.35;
	}
	if (finish_glow > 0.003) {
		float breathe = 0.72 + 0.28 * sin(t * 1.75 - length(UV - vec2(0.5, 0.55)) * 6.0);
		vec3 gcol = vec3(0.42, 1.0, 0.84);
		base.rgb += gcol * finish_glow * breathe * 0.16;
		float edge = smoothstep(0.62, 0.0, min(min(UV.x, 1.0 - UV.x), min(UV.y, 1.0 - UV.y)));
		base.rgb += gcol * edge * finish_glow * (0.30 + 0.16 * breathe);
	}
	base.rgb *= finish_tint;
	COLOR = base;
}
