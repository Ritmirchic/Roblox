shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled, shadows_disabled, fog_disabled;

// Soft volumetric-looking light shaft: a cone whose alpha fades along its
// length and towards the silhouette rim, with slow drifting noise so it reads
// as dust in a beam instead of a plastic cone.

uniform vec3 shaft_color : source_color = vec3(0.55, 0.82, 1.0);
uniform float intensity = 0.42;
uniform float drift_speed = 0.12;
uniform float noise_scale = 3.0;
uniform float rim_power = 1.6;

float hash13(vec3 p) {
	p = fract(p * 0.3183099 + vec3(0.13, 0.07, 0.19));
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
			mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
		mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
			mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
		f.z);
}

void fragment() {
	float along = clamp(UV.y, 0.0, 1.0);
	float length_fade = smoothstep(0.0, 0.22, along) * smoothstep(1.0, 0.55, along);
	float rim = pow(1.0 - clamp(abs(dot(NORMAL, VIEW)), 0.0, 1.0), rim_power);
	vec3 np = vec3(UV.x * noise_scale * 6.2831, along * noise_scale * 1.7 - TIME * drift_speed, UV.y * 2.0);
	float dust = 0.68 + 0.32 * vnoise(np);
	float a = length_fade * rim * dust * intensity;
	ALBEDO = shaft_color * (1.6 + dust * 0.9);
	ALPHA = clamp(a, 0.0, 1.0);
}
