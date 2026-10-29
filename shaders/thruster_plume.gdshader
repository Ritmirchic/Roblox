shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded, fog_disabled;

// Engine exhaust: a hot nozzle throat, repeating shock diamonds where the plume
// re-compresses, and a turbulent tail. Heat and throttle both feed the colour.

uniform vec4 core_color : source_color = vec4(0.62, 0.97, 1.0, 1.0);
uniform vec4 outer_color : source_color = vec4(0.08, 0.52, 1.0, 1.0);
uniform float throttle : hint_range(0.0, 1.5) = 0.65;
uniform float heat_ratio : hint_range(0.0, 1.0) = 0.0;
uniform float flicker : hint_range(0.0, 0.5) = 0.16;

float hash11(float n) {
	return fract(sin(n * 12.9898) * 43758.5453);
}

void fragment() {
	// UV.y runs from the nozzle (1.0) to the tip (0.0) on CylinderMesh.
	float along = clamp(1.0 - UV.y, 0.0, 1.0);
	float facing = clamp(abs(dot(NORMAL, VIEW)), 0.0, 1.0);
	float throat = smoothstep(0.55, 1.0, facing);
	float mach = 0.76 + 0.24 * sin(UV.y * 26.0 - TIME * 30.0);
	float diamonds = 0.55 + 0.45 * smoothstep(-0.2, 0.9, sin(along * 34.0));
	float flick = 1.0 - flicker * hash11(floor(TIME * 38.0)) ;
	vec3 hot_outer = mix(outer_color.rgb, vec3(1.0, 0.34, 0.06), heat_ratio);
	vec3 col = mix(hot_outer, core_color.rgb, smoothstep(0.25, 0.85, along * throat));
	// The throat itself is nearly white: that is what sells "real" thrust.
	col += vec3(1.0, 0.98, 0.94) * throat * smoothstep(0.82, 1.0, along) * 0.85;
	float a = along * throat * mach * diamonds * flick * clamp(throttle, 0.05, 1.4);
	ALBEDO = col * (1.35 + throttle * 1.15);
	ALPHA = clamp(a, 0.0, 0.96);
}
