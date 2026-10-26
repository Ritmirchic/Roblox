extends BaseScreen
class_name CraftingUI

var station := ""
var list_box: VBoxContainer
var progress: ProgressBar
var busy := false

func _init() -> void:
	super._init("CraftingUI")

func title_text() -> String:
	return "Crafting — %s" % (station.capitalize() if station != "" else "Field")

func _build_body() -> void:
	station = payload.get("station", "")
	progress = UiTheme.bar(0.0, UiTheme.ACCENT)
	progress.visible = false
	content.add_child(progress)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list_box = VBoxContainer.new()
	list_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(list_box)
	content.add_child(scroll)
	_refresh()

func _refresh() -> void:
	for c in list_box.get_children():
		c.free()
	var p: Survivor = GameState.player
	var recipes: Array = CraftingSystem.recipes_for_station(station)
	if recipes.is_empty():
		list_box.add_child(UiTheme.label(
			"No recipes at this station.", 14, UiTheme.TEXT_DIM))
	for recipe in recipes:
		var row := HBoxContainer.new()
		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var def := ItemDB.get_def(recipe.out)
		info.add_child(UiTheme.label("%s x%d" % [def.name, recipe.qty], 16,
			ItemDB.rarity_color(recipe.out)))
		var cost := CraftingSystem.adjusted_cost(recipe)
		var cost_text := ""
		for id in cost:
			var have: int = p.inventory_count(id)
			var need: int = int(cost[id])
			cost_text += "%s %d/%d   " % [ItemDB.display_name(id), have, need]
		info.add_child(UiTheme.label(cost_text, 13,
			UiTheme.GOOD if CraftingSystem.can_craft(recipe, p)
			else UiTheme.DANGER))
		info.add_child(UiTheme.label("Craft time: %.1fs" % recipe.time, 12,
			UiTheme.TEXT_DIM))
		row.add_child(info)
		var craft := UiTheme.button("Craft")
		craft.custom_minimum_size = Vector2(120, 40)
		craft.disabled = not CraftingSystem.can_craft(recipe, p) or busy
		var r: Dictionary = recipe
		craft.pressed.connect(func(): _start_craft(r))
		row.add_child(craft)
		list_box.add_child(row)

func _start_craft(recipe: Dictionary) -> void:
	var p: Survivor = GameState.player
	if not CraftingSystem.can_craft(recipe, p):
		return
	busy = true
	progress.visible = true
	var duration: float = float(recipe.time) * SkillSystem.craft_time_mult()
	var t := 0.0
	while t < duration:
		await get_tree().process_frame
		t += get_process_delta_time()
		progress.value = clampf(t / duration * 100.0, 0.0, 100.0)
	if CraftingSystem.craft(recipe, p):
		QuestMan.toast.emit("Crafted " + ItemDB.display_name(recipe.out))
	progress.visible = false
	progress.value = 0.0
	busy = false
	_refresh()
