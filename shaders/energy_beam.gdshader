shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

// Mining / lock beam. Three layers: a bright axial core, a flowing energy
// stream that travels towards the impact point, and a soft outer sheath.

uniform vec4 beam_color : source_color = vec4(0.15, 0.92, 1.0, 1.0);
uniform vec4 core_color : source_color = vec4(0.86, 0.99, 1.0, 1.0);
uniform float pulse_speed : hint_range(1.0, 30.0) = 14.0;
uniform float intensity : hint_range(0.1, 4.0) = 1.6;
uniform float flow_speed : hint_range(0.0, 6.0) = 1.3;
uniform float flow_density : hint_range(1.0, 40.0) = 14.0;
uniform float load : hint_range(0.0, 1.0) = 0.35;

void fragment() {
	float facing = clamp(abs(dot(NORMAL, VIEW)), 0.0, 1.0);
	float edge = pow(facing, 1.35);
	float core = smoothstep(0.55, 0.97, facing);
	float wave = 0.74 + 0.26 * sin(UV.y * 34.0 - TIME * pulse_speed);
	// Energy packets travel along the beam: negative TIME scroll makes them run
	// from the muzzle (UV.y 0) towards the impact (UV.y 1).
	float stream = 0.55 + 0.45 * sin(UV.y * flow_density + TIME * flow_speed * 9.0);
	float packets = smoothstep(0.55, 1.0, stream);
	vec3 col = mix(beam_color.rgb, core_color.rgb, core * 0.8);
	col *= wave * intensity * (0.75 + packets * 0.55 + load * 0.45);
	ALBEDO = col;
	ALPHA = clamp(edge * 0.9 * wave * (0.72 + packets * 0.4), 0.0, 1.0);
}
