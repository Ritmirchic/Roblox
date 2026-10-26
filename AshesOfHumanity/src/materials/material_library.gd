extends Node
class_name MaterialLibrary
## Builds and caches all PBR materials from the generated texture library
## plus procedural solids, emissives and special surfaces.

static var _cache: Dictionary = {}
static var _tex_cache: Dictionary = {}

const TEX_DIR := "res://assets/textures"

static func _tex(file: String) -> Texture2D:
	if _tex_cache.has(file):
		return _tex_cache[file]
	var t: Texture2D = load("%s/%s" % [TEX_DIR, file])
	_tex_cache[file] = t
	return t

static func pbr(surface: String, uv_scale: float = 1.0,
		tint: Color = Color.WHITE) -> StandardMaterial3D:
	var key := "%s_%f_%s" % [surface, uv_scale, tint]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_texture = _tex("%s_albedo.png" % surface)
	m.albedo_color = tint
	m.normal_texture = _tex("%s_normal.png" % surface)
	m.roughness_texture = _tex("%s_rough.png" % surface)
	m.roughness = 1.0
	m.metallic = 0.05
	m.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
	m.texture_repeat = true
	m.ao_texture = m.roughness_texture
	m.ao_light_affect = 0.25
	_cache[key] = m
	return m

static func solid(color: Color, rough: float = 0.7, metal: float = 0.0,
		emission: Color = Color(0, 0, 0), emission_energy: float = 0.0
		) -> StandardMaterial3D:
	var key := "solid_%s_%f_%f_%s_%f" % [color, rough, metal, emission, emission_energy]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = metal
	if emission_energy > 0.0:
		m.emission_enabled = true
		m.emission = emission
		m.emission_energy_multiplier = emission_energy
	_cache[key] = m
	return m

static func glass() -> StandardMaterial3D:
	if _cache.has("glass"):
		return _cache["glass"]
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.12, 0.16, 0.18, 0.35)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.08
	m.metallic = 0.1
	m.refraction_enabled = false
	_cache["glass"] = m
	return m

static func water() -> StandardMaterial3D:
	if _cache.has("water"):
		return _cache["water"]
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.08, 0.16, 0.18, 0.8)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.12
	m.metallic = 0.3
	m.normal_scale = 0.4
	_cache["water"] = m
	return m

static func toxic_water() -> StandardMaterial3D:
	if _cache.has("toxic"):
		return _cache["toxic"]
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.25, 0.45, 0.15, 0.85)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.2
	m.emission_enabled = true
	m.emission = Color(0.3, 0.8, 0.15)
	m.emission_energy_multiplier = 0.9
	_cache["toxic"] = m
	return m

static func named(surface_id: String) -> StandardMaterial3D:
	# Named lookup used by base building and other runtime spawners.
	match surface_id:
		"concrete":
			return pbr("concrete", 3.0)
		"wood_dark":
			return pbr("wood", 2.0, Color(0.62, 0.55, 0.45))
		"metal_rust":
			return pbr("rust_metal", 2.0)
		"metal_dark":
			return pbr("metal_panel", 2.0, Color(0.55, 0.58, 0.6))
		"fabric":
			return pbr("fabric", 3.0, Color(0.7, 0.68, 0.6))
		_:
			return solid(Color(0.4, 0.4, 0.38), 0.85)

static func ground_for(biome: String) -> StandardMaterial3D:
	match biome:
		"forest":
			return pbr("dirt", 24.0, Color(0.85, 0.9, 0.8))
		"industrial", "exclusion":
			return pbr("asphalt", 20.0, Color(0.8, 0.8, 0.85))
		"city":
			return pbr("concrete", 22.0)
		"wasteland":
			return pbr("scorched", 26.0)
		_:
			return pbr("dirt", 22.0, Color(0.95, 0.95, 0.9))
