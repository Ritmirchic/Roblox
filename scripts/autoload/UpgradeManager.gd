extends Node

signal upgrades_changed

const DEFAULT_SLOTS: int = 3
const MAX_SLOTS: int = 5
const FOURTH_SLOT_CREDIT_COST: int = 18000
const FOURTH_SLOT_CRYSTAL_COST: int = 120
const FIFTH_SLOT_DROP_PROBABILITY: float = 0.01 # Exact 1% per eligible roll

var fourth_slot_unlocked: bool = false
var fifth_slot_unlocked: bool = false

var owned_upgrades: Array[String] = ["upg_01"]
var active_equipped: Array[String] = ["upg_01"]

func get_unlocked_slots() -> int:
	var slots := DEFAULT_SLOTS
	if fourth_slot_unlocked:
		slots += 1
	if fifth_slot_unlocked:
		slots += 1
	return mini(MAX_SLOTS, slots)

func purchase_fourth_slot() -> Dictionary:
	if fourth_slot_unlocked:
		return {"ok": false, "reason": "4th Active Upgrade Slot is already permanently unlocked."}
	if ShipGrid.credits < FOURTH_SLOT_CREDIT_COST:
		return {"ok": false, "reason": "Requires %d Credits." % FOURTH_SLOT_CREDIT_COST}
	if ShipGrid.crystals < FOURTH_SLOT_CRYSTAL_COST:
		return {"ok": false, "reason": "Requires %d Crystals." % FOURTH_SLOT_CRYSTAL_COST}

	ShipGrid.credits -= FOURTH_SLOT_CREDIT_COST
	ShipGrid.crystals -= FOURTH_SLOT_CRYSTAL_COST
	fourth_slot_unlocked = true
	ShipGrid.credits_changed.emit(ShipGrid.credits)
	upgrades_changed.emit()
	return {"ok": true}

func try_roll_fifth_slot_reward(rng: RandomNumberGenerator = null) -> bool:
	# Prevent duplicate permanent unlock
	if fifth_slot_unlocked:
		return false
	var r := rng.randf() if rng != null else randf()
	if r < FIFTH_SLOT_DROP_PROBABILITY:
		fifth_slot_unlocked = true
		upgrades_changed.emit()
		return true
	return false

func buy_upgrade(upg_id: String) -> Dictionary:
	if not GameData.upgrades_by_id.has(upg_id):
		return {"ok": false, "reason": "Invalid upgrade."}
	if owned_upgrades.has(upg_id):
		return {"ok": false, "reason": "Upgrade already owned."}
	var cost: int = int(GameData.upgrades_by_id[upg_id]["price"])
	if ShipGrid.credits < cost:
		return {"ok": false, "reason": "Insufficient Credits."}

	ShipGrid.credits -= cost
	owned_upgrades.append(upg_id)
	if active_equipped.size() < get_unlocked_slots():
		active_equipped.append(upg_id)
	ShipGrid.credits_changed.emit(ShipGrid.credits)
	upgrades_changed.emit()
	ShipGrid.ship_changed.emit()
	return {"ok": true}

func toggle_equip_upgrade(upg_id: String) -> Dictionary:
	if not owned_upgrades.has(upg_id):
		return {"ok": false, "reason": "Upgrade not owned."}
	var idx := active_equipped.find(upg_id)
	if idx >= 0:
		active_equipped.remove_at(idx)
		upgrades_changed.emit()
		ShipGrid.ship_changed.emit()
		return {"ok": true, "equipped": false}

	if active_equipped.size() >= get_unlocked_slots():
		return {"ok": false, "reason": "All %d Active Upgrade Slots are in use. Unequip one first." % get_unlocked_slots()}

	active_equipped.append(upg_id)
	upgrades_changed.emit()
	ShipGrid.ship_changed.emit()
	return {"ok": true, "equipped": true}

func enforce_slot_cap() -> void:
	var cap := get_unlocked_slots()
	var clean: Array[String] = []
	for uid in active_equipped:
		if owned_upgrades.has(uid) and GameData.upgrades_by_id.has(uid) and not clean.has(uid):
			if clean.size() < cap:
				clean.append(uid)
	active_equipped = clean

func get_combined_buffs() -> Dictionary:
	enforce_slot_cap()
	var out: Dictionary = {}
	for uid in active_equipped:
		if GameData.upgrades_by_id.has(uid):
			var def: Dictionary = GameData.upgrades_by_id[uid]
			var st: String = def["stat"]
			out[st] = float(out.get(st, 0.0)) + float(def["value"])
	return out
