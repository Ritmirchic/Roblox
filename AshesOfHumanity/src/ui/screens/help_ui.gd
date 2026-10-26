extends BaseScreen
class_name HelpUI

func _init() -> void:
	super._init("HelpUI")

func title_text() -> String:
	return "Controls & Survival"

func _build_body() -> void:
	var v := _scroll_column()
	var lines := [
		["WASD", "Move — Shift sprint, C/Ctrl crouch, Space jump"],
		["Mouse", "Look — right button aim, left fire / attack, middle melee"],
		["R", "Reload firearm"],
		["T / 1-2", "Cycle or select weapons"],
		["E", "Interact, talk, loot, confirm placement"],
		["Q", "Rotate building preview"],
		["F", "Toggle flashlight (battery drains)"],
		["H", "Use best available medical item"],
		["V", "Switch third / first person"],
		["I", "Inventory — K character, J journal, M map"],
		["B", "Crafting — G base building"],
		["F5 / F9", "Quick save / quick load — Esc pause"],
	]
	for pair in lines:
		var row := HBoxContainer.new()
		var key := UiTheme.label(pair[0], 15, UiTheme.ACCENT)
		key.custom_minimum_size.x = 130
		row.add_child(key)
		row.add_child(UiTheme.label(pair[1], 15, UiTheme.TEXT))
		v.add_child(row)
	v.add_child(Control.new())
	v.add_child(UiTheme.label("SURVIVAL", 17, UiTheme.ACCENT))
	for tip in [
		"Hunger and thirst drain constantly; empty bars cost health.",
		"Gunfire and sprinting make noise — sound-hunting mutants will come.",
		"Bleeding and fractures need bandages and splints, not time.",
		"Radiation accumulates in the wasteland; use Anti-Rad injectors.",
		"Headshots exploit every mutant's weak point. Aim carefully at night.",
		"Save often. The wasteland does not forgive overconfidence.",
	]:
		v.add_child(UiTheme.label("• " + tip, 14, UiTheme.TEXT_DIM))
