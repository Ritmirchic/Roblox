extends Node

signal crew_changed

# card_id -> owned quantity (>= 1)
var owned_cards: Dictionary = {}
# card_id -> best finish id ever pulled for that card ("plain" is implicit)
var card_finishes: Dictionary = {}
# Ordered array of distinct equipped card_ids, strictly <= ShipGrid.get_unlocked_crew_slots()
var equipped_crew: Array[String] = []

func _ready() -> void:
	# Starter recruitment gift: 2 Common starter cards in collection (unequipped until 10 cells unlock Slot #1)
	owned_cards = {"crew_01": 1, "crew_02": 1}

func add_card_to_collection(card_id: String, finish_id: String = "") -> bool:
	return bool(grant_card(card_id, finish_id)["is_new"])


func grant_card(card_id: String, finish_id: String = "") -> Dictionary:
	## Add one copy of a card, upgrading the stored foil finish when the pulled
	## copy is rarer than anything owned. Returns is_new / finish / upgraded.
	var res := {"ok": false, "is_new": false, "finish": "plain", "upgraded": false}
	if not GameData.crew_by_id.has(card_id):
		return res
	res["ok"] = true
	var is_new := not owned_cards.has(card_id) or int(owned_cards.get(card_id, 0)) <= 0
	owned_cards[card_id] = int(owned_cards.get(card_id, 0)) + 1
	var fid := "plain" if finish_id.is_empty() or not GameData.is_valid_finish(finish_id) else str(finish_id)
	var prev := get_finish(card_id)
	if GameData.get_finish_rank(fid) > GameData.get_finish_rank(prev):
		card_finishes[card_id] = fid
		res["upgraded"] = true
	res["finish"] = get_finish(card_id)
	res["is_new"] = is_new
	if is_new and AchievementManager:
		AchievementManager.record_event("collect_crew_card", 1)
	crew_changed.emit()
	return res


func get_finish(card_id: String) -> String:
	var fid := str(card_finishes.get(card_id, "plain"))
	return fid if GameData.is_valid_finish(fid) else "plain"


func set_finish(card_id: String, finish_id: String) -> bool:
	if not GameData.crew_by_id.has(card_id) or not GameData.is_valid_finish(finish_id):
		return false
	if int(owned_cards.get(card_id, 0)) <= 0:
		card_finishes.erase(card_id)
		return false
	if str(finish_id) == "plain":
		card_finishes.erase(card_id)
	else:
		card_finishes[card_id] = str(finish_id)
	crew_changed.emit()
	return true


func get_finish_multiplier(card_id: String) -> float:
	return GameData.get_finish_buff_mult(get_finish(card_id))


func get_finish_perks() -> Dictionary:
	## Ship-wide perks granted by the *equipped* foils: market prices, radar
	## reach and nano-repair throughput. Stacked additively, then clamped so a
	## full foil loadout stays a boost instead of a exploit.
	var perks := {"market": 1.0, "radar": 1.0, "repair": 1.0}
	var mk := 0.0
	var rd := 0.0
	var rp := 0.0
	for cid in equipped_crew:
		if int(owned_cards.get(cid, 0)) <= 0:
			continue
		var f: Dictionary = GameData.get_finish(get_finish(cid))
		mk += float(f["market_mult"]) - 1.0
		rd += float(f["radar_mult"]) - 1.0
		rp += float(f["repair_mult"]) - 1.0
	perks["market"] = clampf(1.0 + mk, 1.0, 1.45)
	perks["radar"] = clampf(1.0 + rd, 1.0, 1.40)
	perks["repair"] = clampf(1.0 + rp, 1.0, 1.40)
	return perks


func get_finest_owned() -> String:
	## Card id of the rarest finish in the collection ("" when everything is plain).
	var best := ""
	var best_rank := 0
	for cid in card_finishes.keys():
		var rank := GameData.get_finish_rank(str(card_finishes[cid]))
		if rank > best_rank and int(owned_cards.get(cid, 0)) > 0:
			best_rank = rank
			best = str(cid)
	return best

func get_unique_owned_count() -> int:
	var n := 0
	for k in owned_cards.keys():
		if int(owned_cards[k]) > 0 and GameData.crew_by_id.has(k):
			n += 1
	return n

func is_owned(card_id: String) -> bool:
	return int(owned_cards.get(card_id, 0)) > 0

func get_copies(card_id: String) -> int:
	return int(owned_cards.get(card_id, 0))

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
		# the card's foil finish multiplies the bonus it contributes
		var bval := float(cdef["buff_value"]) * get_finish_multiplier(cid)
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
