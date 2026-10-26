extends BaseScreen
class_name InventoryUI

var selected_idx := -1
var detail: VBoxContainer
var grid_holder: VBoxContainer
var weight_label: Label
var equip_box: VBoxContainer
var chest_box: VBoxContainer
var chest_id := ""

func _init() -> void:
	super._init("InventoryUI")

func title_text() -> String:
	return "Inventory"

func _build_body() -> void:
	chest_id = payload.get("container", "")
	var root := HBoxContainer.new()
	root.add_theme_constant_override("separation", 16)
	content.add_child(root)
	# Left column: equipment.
	var left := VBoxContainer.new()
	left.custom_minimum_size = Vector2(240, 0)
	left.add_child(UiTheme.label("EQUIPMENT", 16, UiTheme.ACCENT))
	equip_box = VBoxContainer.new()
	left.add_child(equip_box)
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left.add_child(spacer)
	left.add_child(UiTheme.label(
		"[LMB] select then Use or Drop\nOverweight slows movement.",
		13, UiTheme.TEXT_DIM))
	root.add_child(left)
	# Center: grid holder + weight.
	var center := VBoxContainer.new()
	grid_holder = VBoxContainer.new()
	center.add_child(grid_holder)
	weight_label = UiTheme.label("", 14, UiTheme.TEXT_DIM)
	center.add_child(weight_label)
	root.add_child(center)
	# Right: details + chest.
	var right := VBoxContainer.new()
	right.custom_minimum_size = Vector2(280, 0)
	detail = VBoxContainer.new()
	right.add_child(detail)
	if chest_id != "":
		right.add_child(UiTheme.label("STORAGE", 16, UiTheme.ACCENT))
		chest_box = VBoxContainer.new()
		right.add_child(chest_box)
	root.add_child(right)
	_refresh()

func _clear(node: Node) -> void:
	for c in node.get_children():
		c.free()

func _refresh() -> void:
	var p: Survivor = GameState.player
	_clear(grid_holder)
	var grid := GridContainer.new()
	grid.columns = GameInventory.COLS
	grid.add_theme_constant_override("h_separation", 2)
	grid.add_theme_constant_override("v_separation", 2)
	grid_holder.add_child(grid)
	_refill_grid(p, grid)
	_clear(equip_box)
	_refresh_equipment(p)
	_clear(detail)
	_refresh_detail(p)
	_refresh_weight(p)
	if chest_box:
		_clear(chest_box)
		_refresh_chest(p)

func _refill_grid(p: Survivor, grid: GridContainer) -> void:
	var occupancy: Dictionary = {}
	for idx in p.inventory.stacks.size():
		var s: Dictionary = p.inventory.stacks[idx]
		for r in range(int(s.row), int(s.row) + int(s.h)):
			for c in range(int(s.col), int(s.col) + int(s.w)):
				occupancy[Vector2i(c, r)] = idx
	for r in GameInventory.ROWS:
		for c in GameInventory.COLS:
			var cell := Button.new()
			cell.custom_minimum_size = Vector2(46, 46)
			cell.add_theme_font_size_override("font_size", 11)
			var key := Vector2i(c, r)
			if occupancy.has(key):
				var idx: int = occupancy[key]
				var s: Dictionary = p.inventory.stacks[idx]
				var def := ItemDB.get_def(s.id)
				cell.text = "%s\n%d" % [def.name.left(7), s.count]
				cell.add_theme_color_override("font_color",
					ItemDB.rarity_color(s.id))
				cell.add_theme_stylebox_override("normal",
					UiTheme.style(Color(0.16, 0.15, 0.13), 3))
				cell.pressed.connect(func():
					selected_idx = idx
					_refresh())
			else:
				cell.disabled = true
				cell.add_theme_stylebox_override("disabled",
					UiTheme.style(Color(0.07, 0.075, 0.08), 3))
			grid.add_child(cell)

func _refresh_equipment(p: Survivor) -> void:
	for slot in ["weapon_1", "weapon_2", "armor", "tool"]:
		var entry: Dictionary = p.equipment[slot]
		var name_text := ItemDB.display_name(entry.id) if entry.id != "" else "— empty —"
		var row := HBoxContainer.new()
		var l := UiTheme.label("%s: %s" % [slot.replace("_", " ").capitalize(),
			name_text], 14)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		if entry.id != "":
			row.add_child(UiTheme.label("%d%%" % int(entry.durability), 13,
				UiTheme.TEXT_DIM))
		equip_box.add_child(row)

func _refresh_detail(p: Survivor) -> void:
	if selected_idx < 0 or selected_idx >= p.inventory.stacks.size():
		detail.add_child(UiTheme.label("Select an item.", 14, UiTheme.TEXT_DIM))
		return
	var s: Dictionary = p.inventory.stacks[selected_idx]
	var def := ItemDB.get_def(s.id)
	detail.add_child(UiTheme.label(def.name, 19, ItemDB.rarity_color(s.id)))
	detail.add_child(UiTheme.label("x%d — %.2f kg each" % [s.count,
		float(def.weight)], 13, UiTheme.TEXT_DIM))
	detail.add_child(UiTheme.label(def.get("description",
		"No description."), 14, UiTheme.TEXT))
	var actions := HBoxContainer.new()
	detail.add_child(actions)
	var use := UiTheme.button("Use")
	use.custom_minimum_size = Vector2(120, 34)
	use.pressed.connect(func(): _use_selected(p, s.id))
	actions.add_child(use)
	var drop := UiTheme.button("Drop 1")
	drop.custom_minimum_size = Vector2(120, 34)
	drop.pressed.connect(func(): _drop_selected(p, s.id))
	actions.add_child(drop)

func _use_selected(p: Survivor, item_id: String) -> void:
	var def := ItemDB.get_def(item_id)
	match String(def.category):
		"food", "water":
			p.eat(item_id)
		"medicine":
			_use_medicine(p, item_id)
		"weapon":
			_equip(p, item_id, "weapon")
		"armor":
			_equip(p, item_id, "armor")
		"tool":
			if item_id == "backpack":
				p.inventory.carry_bonus += float(def.carry_bonus)
				p.inventory_remove(item_id, 1)
				QuestMan.toast.emit("Carry capacity increased")
			else:
				_equip(p, item_id, "tool")
		_:
			QuestMan.toast.emit("Nothing to do with that item")
	selected_idx = -1
	_refresh()

func _use_medicine(p: Survivor, item_id: String) -> void:
	if not p.consume_item(item_id):
		return
	var def := ItemDB.get_def(item_id)
	p.heal(float(def.get("heal", 0)))
	if def.get("stops_bleed", false):
		p.vitals.bleeding = 0.0
	if def.get("cures_infection", false):
		p.vitals.infection = 0.0
	if def.get("cures_fracture", false):
		p.vitals.fracture = false
	if def.has("rad_cleanse"):
		p.vitals.radiation = max(0.0,
			float(p.vitals.radiation) - float(def.rad_cleanse))
	if def.has("stamina_restore"):
		p.vitals.stamina = min(100.0,
			float(p.vitals.stamina) + float(def.stamina_restore))
	QuestMan.notify_event("craft", item_id)
	AudioMan.play_2d("craft", -6.0)

func _equip(p: Survivor, item_id: String, kind: String) -> void:
	if kind == "weapon":
		var target := "weapon_1" if p.equipment.weapon_1.id == "" else "weapon_2"
		var previous: String = p.equipment[target].id
		p.equipment[target] = {"id": item_id, "durability": 100.0}
		p.inventory_remove(item_id, 1)
		if previous != "":
			p.inventory_add(previous, 1)
		p.weapons.equip(item_id)
	else:
		var slot := "armor" if kind == "armor" else "tool"
		var previous: String = p.equipment[slot].id
		p.equipment[slot] = {"id": item_id, "durability": 100.0}
		p.inventory_remove(item_id, 1)
		if previous != "":
			p.inventory_add(previous, 1)
	QuestMan.toast.emit("Equipped " + ItemDB.display_name(item_id))

func _drop_selected(p: Survivor, item_id: String) -> void:
	p.inventory_remove(item_id, 1)
	WorldGenerator.active.spawn_pickup(item_id, 1,
		p.global_position + -p.global_transform.basis.z * 1.5)
	selected_idx = -1
	_refresh()

func _refresh_weight(p: Survivor) -> void:
	var over := p.inventory.total_weight > p.inventory.capacity()
	weight_label.text = "Weight: %.1f / %.1f kg%s" % [
		p.inventory.total_weight, p.inventory.capacity(),
		"  OVERLOADED" if over else ""]
	weight_label.add_theme_color_override("font_color",
		UiTheme.DANGER if over else UiTheme.TEXT_DIM)

func _refresh_chest(p: Survivor) -> void:
	var storage: Dictionary = GameState.container_storage.get(chest_id, {})
	if storage.is_empty():
		chest_box.add_child(UiTheme.label("Chest is empty.", 13, UiTheme.TEXT_DIM))
	for id in storage:
		var row := HBoxContainer.new()
		var l := UiTheme.label("%s x%d" % [ItemDB.display_name(id), storage[id]], 13)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		var take := UiTheme.button("Take")
		take.custom_minimum_size = Vector2(90, 30)
		take.pressed.connect(func():
			var left := p.inventory_add(id, 1)
			if left <= 0:
				storage[id] = int(storage[id]) - 1
				if int(storage[id]) <= 0:
					storage.erase(id)
				GameState.container_storage[chest_id] = storage
				_refresh())
		row.add_child(take)
		chest_box.add_child(row)
	var deposit := UiTheme.button("Deposit selected stack")
	deposit.custom_minimum_size = Vector2(240, 32)
	deposit.pressed.connect(func():
		if selected_idx < 0 or selected_idx >= p.inventory.stacks.size():
			return
		var s: Dictionary = p.inventory.stacks[selected_idx]
		var id: String = s.id
		var count: int = int(s.count)
		p.inventory_remove(id, count)
		var st: Dictionary = GameState.container_storage.get(chest_id, {})
		st[id] = int(st.get(id, 0)) + count
		GameState.container_storage[chest_id] = st
		selected_idx = -1
		_refresh())
	chest_box.add_child(deposit)
