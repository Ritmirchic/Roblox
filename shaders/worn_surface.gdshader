shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform vec4 base_color : source_color = vec4(0.42, 0.40, 0.36, 1.0);
uniform vec4 stain_color : source_color = vec4(0.20, 0.20, 0.18, 1.0);
uniform float grain_scale = 7.0;
uniform float roughness = 0.88;
uniform float vertical_wear = 0.0;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
    vec2 p = UV * grain_scale;
    float broad = noise2(p * 0.19) * 0.62 + noise2(p * 0.83) * 0.27 + noise2(p * 3.8) * 0.11;
    float fleck = noise2(p * vec2(21.0, 15.0));
    float streak = noise2(vec2(p.x * 3.0, floor(p.y * 2.0) * 0.12));
    float wear = clamp((1.0 - UV.y) * vertical_wear, 0.0, 0.45);
    float pigment = clamp(broad * 0.78 + fleck * 0.22 - wear * (0.35 + streak * 0.5), 0.0, 1.0);
    ALBEDO = mix(stain_color.rgb, base_color.rgb, 0.54 + pigment * 0.46);
    ROUGHNESS = roughness;
    METALLIC = 0.0;
}
