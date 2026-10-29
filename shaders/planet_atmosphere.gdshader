shader_type spatial;
render_mode unshaded, cull_back, depth_draw_opaque;

// Distant gas giant / ice world used as a sky landmark. Procedural banded albedo,
// a soft terminator and a fresnel atmosphere halo. Unshaded on purpose: the body
// is hundreds of metres across and lives far beyond the lit volume, so it must
// not depend on realtime lights to look right.

uniform vec3 planet_a : source_color = vec3(0.32, 0.42, 0.62);
uniform vec3 planet_b : source_color = vec3(0.62, 0.72, 0.86);
uniform vec3 planet_c : source_color = vec3(0.88, 0.62, 0.42);
uniform vec3 atmo_color : source_color = vec3(0.35, 0.65, 1.0);
uniform vec3 sun_dir = vec3(0.55, 0.45, 0.7);
uniform float band_scale = 4.5;
uniform float turbulence = 1.6;
uniform float atmo_strength = 1.35;
uniform float surface_gain = 1.08;

float hash13(vec3 p) {
	p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	float n000 = hash13(i);
	float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
	float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
	float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
	float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
	float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
	float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
	float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
	return mix(
		mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
		mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
		f.z
	);
}

float fbm(vec3 p) {
	float a = 0.5;
	float r = 0.0;
	for (int i = 0; i < 4; i++) {
		r += a * vnoise(p);
		p *= 2.03;
		a *= 0.5;
	}
	return r;
}

void fragment() {
	vec3 p = normalize(VERTEX);
	vec3 wn = normalize((INV_VIEW_MATRIX * vec4(NORMAL, 0.0)).xyz);
	float warp = fbm(p * 2.4 + vec3(3.1, 0.0, 5.7)) - 0.5;
	float bands = sin(p.y * band_scale + warp * turbulence * 3.0);
	float t = 0.5 + 0.5 * bands;
	vec3 surf = mix(planet_a, planet_b, smoothstep(0.15, 0.85, t));
	float storms = smoothstep(0.62, 0.95, fbm(p * 7.0 + vec3(11.0, 2.0, 4.0)));
	surf = mix(surf, planet_c, storms * 0.55);

	vec3 L = normalize(sun_dir);
	float d = dot(wn, L);
	float lit = smoothstep(-0.22, 0.38, d);
	// Terminator gets a warm grazing tint, night side keeps a faint planet-shine.
	vec3 graze = mix(vec3(1.0, 0.55, 0.28), vec3(1.0), clamp(d, 0.0, 1.0));
	vec3 day = surf * graze * (0.32 + 0.78 * lit);
	vec3 night = surf * vec3(0.03, 0.045, 0.08);
	vec3 col = mix(night, day, lit);

	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.6);
	col += atmo_color * fres * atmo_strength * (0.18 + 0.82 * lit);

	ALBEDO = col * surface_gain;
}
