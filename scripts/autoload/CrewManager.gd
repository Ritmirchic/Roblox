extends Node

signal crew_changed

# card_id -> owned quantity (>= 1)
var owned_cards: Dictionary = {}
# Ordered array of distinct equipped card_ids, strictly <= ShipGrid.get_unlocked_crew_slots()
var equipped_crew: Array[String] = []

func _ready() -> void:
	# Starter recruitment gift: 2 Common starter cards in collection (unequipped until 10 cells unlock Slot #1)
	owned_cards = {"crew_01": 1, "crew_02": 1}

func add_card_to_collection(card_id: String) -> bool:
	if not GameData.crew_by_id.has(card_id):
		return false
	var is_new := not owned_cards.has(card_id) or int(owned_cards.get(card_id, 0)) <= 0
	owned_cards[card_id] = int(owned_cards.get(card_id, 0)) + 1
	if is_new and AchievementManager:
		AchievementManager.record_event("collect_crew_card", 1)
	crew_changed.emit()
	return is_new

func get_unique_owned_count() -> int:
	var n := 0
	for k in owned_cards.keys():
		if int(owned_cards[k]) > 0 and GameData.crew_by_id.has(k):
			n += 1
	return n

func enforce_capacity() -> void:
	var max_slots := ShipGrid.get_unlocked_crew_slots()
	var clean: Array[String] = []
	for cid in equipped_crew:
		if GameData.crew_by_id.has(cid) and int(owned_cards.get(cid, 0)) > 0 and not clean.has(cid):
			if clean.size() < max_slots:
				clean.append(cid)
	if clean.size() != equipped_crew.size():
		equipped_crew = clean
		crew_changed.emit()
		ShipGrid.ship_changed.emit()

func equip_card(card_id: String) -> Dictionary:
	enforce_capacity()
	if not GameData.crew_by_id.has(card_id) or int(owned_cards.get(card_id, 0)) <= 0:
		return {"ok": false, "reason": "Card not owned in collection."}
	if equipped_crew.has(card_id):
		return {"ok": false, "reason": "Crew member is already equipped."}
	var max_slots := ShipGrid.get_unlocked_crew_slots()
	if max_slots <= 0:
		return {"ok": false, "reason": "0 Crew Slots unlocked. Purchase 10 Ship Expansion Cells to unlock Crew Slot #1!"}
	if equipped_crew.size() >= max_slots:
		return {"ok": false, "reason": "All %d unlocked Crew Slots are full. Unequip a card or buy 10 more cells." % max_slots}

	equipped_crew.append(card_id)
	crew_changed.emit()
	ShipGrid.ship_changed.emit()
	return {"ok": true}

func unequip_card(card_id: String) -> bool:
	var idx := equipped_crew.find(card_id)
	if idx < 0:
		return false
	equipped_crew.remove_at(idx)
	crew_changed.emit()
	ShipGrid.ship_changed.emit()
	return true

func get_combined_buffs() -> Dictionary:
	enforce_capacity()
	var max_slots := ShipGrid.get_unlocked_crew_slots()
	var seen: Dictionary = {}
	var buffs: Dictionary = {
		"damage_total_mult": 1.0,
		"speed_total_mult": 1.0,
		"loot_total_mult": 1.0,
	}
	var count := 0
	for cid in equipped_crew:
		if count >= max_slots:
			break
		if seen.has(cid) or not GameData.crew_by_id.has(cid):
			continue
		seen[cid] = true
		count += 1
		var cdef: Dictionary = GameData.crew_by_id[cid]
		var btype: String = cdef["buff_type"]
		var bval: float = float(cdef["buff_value"])
		if btype in ["damage_total_mult", "speed_total_mult", "loot_total_mult"]:
			buffs[btype] = float(buffs[btype]) * bval
		else:
			buffs[btype] = float(buffs.get(btype, 0.0)) + bval
	return buffs

func query_cards(search_text: String = "", rarity_filter: String = "All", sort_mode: String = "Number", owned_only: bool = false) -> Array[Dictionary]:
	var q := search_text.strip_edges().to_lower()
	var res: Array[Dictionary] = []
	for card in GameData.crew_cards:
		var cid: String = card["id"]
		var is_owned := int(owned_cards.get(cid, 0)) > 0
		if owned_only and not is_owned:
			continue
		if rarity_filter != "All" and card["rarity"] != rarity_filter:
			continue
		if not q.is_empty():
			var hay := (str(card["name"]) + " " + str(card["role"]) + " " + str(card["bonus_text"]) + " " + str(card["rarity"])).to_lower()
			if not hay.contains(q):
				continue
		res.append(card)

	res.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		match sort_mode:
			"Rarity":
				var ra := GameData.RARITY_ORDER.find(a["rarity"])
				var rb := GameData.RARITY_ORDER.find(b["rarity"])
				if ra != rb:
					return ra > rb
				return int(a["number"]) < int(b["number"])
			"Name":
				return str(a["name"]) < str(b["name"])
			"Role":
				if str(a["role"]) != str(b["role"]):
					return str(a["role"]) < str(b["role"])
				return int(a["number"]) < int(b["number"])
			"Owned":
				var oa := int(owned_cards.get(a["id"], 0))
				var ob := int(owned_cards.get(b["id"], 0))
				if (oa > 0) != (ob > 0):
					return oa > ob
				return int(a["number"]) < int(b["number"])
			_:
				return int(a["number"]) < int(b["number"])
	)
	return res
