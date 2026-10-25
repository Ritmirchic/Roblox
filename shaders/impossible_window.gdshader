shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_opaque;

float hash21(vec2 p) {
	p = fract(p * vec2(127.1, 311.7));
	p += dot(p, p + 39.7);
	return fract(p.x * p.y);
}

void fragment() {
	vec2 grid = UV * vec2(31.0, 19.0);
	vec2 cell = floor(grid);
	vec2 local = fract(grid);
	float seed = hash21(cell);
	vec2 star_center = vec2(hash21(cell + vec2(3.1, 1.7)), hash21(cell + vec2(8.2, 4.4)));
	float star = step(0.989, seed) * (1.0 - smoothstep(0.025, 0.09, distance(local, star_center)));
	float haze = 0.5 + 0.5 * sin(UV.y * 15.0 + UV.x * 7.0);
	vec3 night = mix(vec3(0.006, 0.014, 0.021), vec3(0.018, 0.062, 0.073), haze * 0.34);
	ALBEDO = night + vec3(0.38, 0.57, 0.62) * star;
	EMISSION = vec3(0.08, 0.22, 0.25) * haze + vec3(0.45, 0.65, 0.74) * star;
}
