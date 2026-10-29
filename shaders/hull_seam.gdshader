shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_back, shadows_disabled, fog_disabled;

// Glowing cell seams for hull sections. BoxMesh UVs run 0..1 on every face, so
// the border of each face is exactly the edge of the 1x1 hull cell: one extra
// mesh per cell paints the whole grid, with no geometry cost and no texture.

uniform vec3 seam_color : source_color = vec3(0.24, 0.74, 1.0);
uniform float intensity = 1.15;
uniform float width = 0.055;
uniform float pulse = 0.18;
uniform float duty = 0.0;

void fragment() {
	float ex = min(UV.x, 1.0 - UV.x);
	float ey = min(UV.y, 1.0 - UV.y);
	float edge = min(ex, ey);
	float line = 1.0 - smoothstep(width * 0.45, width, edge);
	// Corner rivets: little hot spots at the four corners of each face.
	float cx = min(UV.x, 1.0 - UV.x);
	float cy = min(UV.y, 1.0 - UV.y);
	float rivet = 1.0 - smoothstep(0.0, 0.13, length(vec2(cx, cy) - vec2(0.055, 0.055)));
	float breathe = 1.0 - pulse * (0.5 + 0.5 * sin(TIME * 2.2 + UV.x * 6.0));
	float glow = clamp(line + rivet * 0.85, 0.0, 1.0) * breathe;
	// `duty` lets engines flash the same seams while boosting.
	glow += duty * 0.35 * (0.5 + 0.5 * sin(TIME * 18.0));
	ALBEDO = seam_color * glow * intensity * 2.2;
	ALPHA = clamp(glow, 0.0, 1.0);
}
