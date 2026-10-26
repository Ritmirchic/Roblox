extends RefCounted
class_name GameInventory
## Grid-based inventory with item dimensions, weight, stacking and simple
## rectangle packing. Equipment slots live separately on the player.

const COLS := 10
const ROWS := 16

var cells: Array = []          # ROWS x COLS of null or stack id
var stacks: Array = []         # [{id, count, w, h, rotated}]
var total_weight := 0.0
var carry_bonus := 0.0
var max_weight_base := 32.0

func _empty_row() -> Array:
	var row: Array = []
	row.resize(COLS)
	for i in COLS:
		row[i] = null
	return row

func _init() -> void:
	cells.resize(ROWS)
	for r in ROWS:
		cells[r] = _empty_row()

func capacity() -> float:
	return max_weight_base + carry_bonus

func can_carry(weight: float) -> bool:
	return total_weight + weight <= capacity()

func _fits(row: int, col: int, w: int, h: int, ignore_idx := -1) -> bool:
	if row + h > ROWS or col + w > COLS:
		return false
	for r in range(row, row + h):
		for c in range(col, col + w):
			var occupant = cells[r][c]
			if occupant != null and occupant != ignore_idx:
				return false
	return true

func _find_slot(w: int, h: int, ignore_idx := -1) -> Vector2i:
	for r in ROWS:
		for c in COLS:
			if _fits(r, c, w, h, ignore_idx):
				return Vector2i(c, r)
	# Try rotated placement.
	for r in ROWS:
		for c in COLS:
			if _fits(r, c, h, w, ignore_idx):
				return Vector2i(c, r)
	return Vector2i(-1, -1)

func _occupy(stack_idx: int, row: int, col: int, w: int, h: int) -> void:
	for r in range(row, row + h):
		for c in range(col, col + w):
			cells[r][c] = stack_idx

func _release(stack_idx: int) -> void:
	for r in ROWS:
		for c in COLS:
			if cells[r][c] == stack_idx:
				cells[r][c] = null

## Returns leftover count that did not fit.
func add(item_id: String, count: int = 1) -> int:
	var def := ItemDB.get_def(item_id)
	if def.is_empty():
		return count
	var left := count
	# Merge into existing stacks first.
	if int(def.max_stack) > 1:
		for idx in stacks.size():
			var s: Dictionary = stacks[idx]
			if s.id == item_id and s.count < int(def.max_stack):
				var room: int = int(def.max_stack) - int(s.count)
				var take: int = mini(room, left)
				s.count += take
				left -= take
				total_weight += take * float(def.weight)
				if left <= 0:
					return 0
	# New stacks.
	while left > 0:
		var w: int = int(def.w)
		var h: int = int(def.h)
		var slot := _find_slot(w, h)
		if slot.x < 0:
			break
		var take := left
		if int(def.max_stack) > 1:
			take = mini(left, int(def.max_stack))
		var stack := {"id": item_id, "count": take, "w": w, "h": h,
			"rotated": false, "row": slot.y, "col": slot.x}
		var idx := stacks.size()
		stacks.append(stack)
		_occupy(idx, slot.y, slot.x, w, h)
		total_weight += take * float(def.weight)
		left -= take
	return left

func remove(item_id: String, count: int = 1) -> int:
	var remaining := count
	for idx in range(stacks.size() - 1, -1, -1):
		if remaining <= 0:
			break
		var s: Dictionary = stacks[idx]
		if s.id != item_id:
			continue
		var take: int = mini(remaining, int(s.count))
		s.count -= take
		remaining -= take
		var def := ItemDB.get_def(item_id)
		total_weight -= take * float(def.weight)
		if int(s.count) <= 0:
			_release(idx)
			stacks.remove_at(idx)
	return count - remaining

func count_of(item_id: String) -> int:
	var total := 0
	for s in stacks:
		if s.id == item_id:
			total += int(s.count)
	return total

func has_items(requirements: Dictionary) -> bool:
	for id in requirements:
		if count_of(id) < int(requirements[id]):
			return false
	return true

func consume(requirements: Dictionary) -> bool:
	if not has_items(requirements):
		return false
	for id in requirements:
		remove(id, int(requirements[id]))
	return true

func durability_step(item_id: String) -> void:
	# Weapons/armor carry durability on their equipment entry, not the stack.
	pass

func to_save_dict() -> Dictionary:
	return {"stacks": stacks.duplicate(true), "carry_bonus": carry_bonus,
		"total_weight": total_weight}

func from_save_dict(d: Dictionary) -> void:
	carry_bonus = float(d.get("carry_bonus", 0.0))
	cells = []
	cells.resize(ROWS)
	for r in ROWS:
		cells[r] = _empty_row()
	stacks = d.get("stacks", [])
	total_weight = 0.0
	for idx in stacks.size():
		var s: Dictionary = stacks[idx]
		_occupy(idx, int(s.row), int(s.col), int(s.w), int(s.h))
		total_weight += int(s.count) * float(ItemDB.get_def(s.id).weight)
