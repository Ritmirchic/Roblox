extends BaseScreen
class_name CharacterUI

var xp_bar: ProgressBar
var points_label: Label
var attr_box: VBoxContainer
var perk_box: VBoxContainer
var tree_select: OptionButton

func _init() -> void:
	super._init("CharacterUI")

func title_text() -> String:
	return "Character & Skills"

func _build_body() -> void:
	var top := HBoxContainer.new()
	top.add_child(UiTheme.label("Level %d" % GameState.level, 22,
		Color(0.95, 0.85, 0.65)))
	xp_bar = UiTheme.bar(GameState.xp_progress(), UiTheme.ACCENT)
	xp_bar.custom_minimum_size = Vector2(380, 18)
	xp_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(xp_bar)
	points_label = UiTheme.label("", 17, UiTheme.GOOD)
	top.add_child(points_label)
	content.add_child(top)
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 18)
	content.add_child(body)
	attr_box = VBoxContainer.new()
	attr_box.custom_minimum_size = Vector2(330, 0)
	body.add_child(attr_box)
	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tree_select = OptionButton.new()
	for tree in SkillSystem.TREES.keys():
		tree_select.add_item(tree)
	tree_select.item_selected.connect(func(_i): _refresh_perks())
	right.add_child(tree_select)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	perk_box = VBoxContainer.new()
	perk_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(perk_box)
	right.add_child(scroll)
	body.add_child(right)
	_refresh()

func _refresh() -> void:
	xp_bar.value = GameState.xp_progress() * 100.0
	points_label.text = "Skill points: %d" % GameState.skill_points
	for c in attr_box.get_children():
		c.free()
	attr_box.add_child(UiTheme.label("ATTRIBUTES (cap 10)", 16, UiTheme.ACCENT))
	for attr in GameState.attributes:
		var row := HBoxContainer.new()
		var l := UiTheme.label(attr.capitalize(), 15)
		l.custom_minimum_size.x = 130
		row.add_child(l)
		row.add_child(UiTheme.label(str(GameState.attributes[attr]), 15,
			UiTheme.ACCENT_COLD))
		var plus := UiTheme.button("Train (1 pt)")
		plus.custom_minimum_size = Vector2(130, 32)
		plus.disabled = GameState.skill_points <= 0 \
			or int(GameState.attributes[attr]) >= 10
		var attr_id: String = attr
		plus.pressed.connect(func():
			GameState.attributes[attr_id] = int(
				GameState.attributes[attr_id]) + 1
			GameState.skill_points -= 1
			GameState.skill_points_changed.emit(GameState.skill_points)
			_refresh())
		row.add_child(plus)
		attr_box.add_child(row)
	_refresh_perks()

func _refresh_perks() -> void:
	for c in perk_box.get_children():
		c.free()
	var tree_name: String = tree_select.get_item_text(tree_select.selected)
	for perk in SkillSystem.TREES[tree_name]:
		var panel := UiTheme.panel()
		var v := VBoxContainer.new()
		panel.add_child(v)
		var owned: bool = GameState.has_skill(perk.id)
		var req_met: bool = perk.req == "" or GameState.has_skill(perk.req)
		v.add_child(UiTheme.label(perk.name + ("  [LEARNED]" if owned else ""),
			16, UiTheme.GOOD if owned else UiTheme.TEXT))
		v.add_child(UiTheme.label(perk.desc, 13, UiTheme.TEXT_DIM))
		if not owned:
			var b := UiTheme.button("Unlock (1 point)")
			b.custom_minimum_size = Vector2(180, 32)
			b.disabled = not req_met or GameState.skill_points <= 0
			var perk_id: String = perk.id
			b.pressed.connect(func():
				if SkillSystem.unlock(perk_id):
					AudioMan.play_2d("level_up", -4.0)
					_refresh())
			v.add_child(b)
			if not req_met:
				v.add_child(UiTheme.label("Requires: " + perk.req, 12,
					UiTheme.DANGER))
		perk_box.add_child(panel)
