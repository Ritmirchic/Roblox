extends Node

signal pack_opened(results: Array[Dictionary], unlocked_fifth_slot: bool)

const CARDS_PER_PACK: int = 3
const PACK_TYPES: Dictionary = {
	"standard": {
		"id": "standard",
		"name": "Standard Galactic Pack",
		"crystal_cost": 30,
		"cards_count": 3,
		"art": "res://assets/cards/pack_standard.png",
		"weights": {
			"Common": 42.0,
			"Uncommon": 26.0,
			"Rare": 16.0,
			"Epic": 9.0,
			"Legendary": 4.5,
			"Mythic": 2.0,
			"Secret": 0.5,
		}
	},
	"elite": {
		"id": "elite",
		"name": "Mythic Vault Pack",
		"crystal_cost": 90,
		"cards_count": 3,
		"art": "res://assets/cards/pack_elite.png",
		"weights": {
			"Common": 0.0,
			"Uncommon": 25.0,
			"Rare": 34.0,
			"Epic": 22.0,
			"Legendary": 11.5,
			"Mythic": 5.8,
			"Secret": 1.7,
		}
	}
}

const DUPLICATE_CREDIT_BONUS: Dictionary = {
	"Common": 150,
	"Uncommon": 320,
	"Rare": 650,
	"Epic": 1400,
	"Legendary": 3200,
	"Mythic": 7500,
	"Secret": 15000,
}

var _rng := RandomNumberGenerator.new()
var _busy_lock: bool = false

func _ready() -> void:
	_rng.randomize()

func get_probability_table(pack_id: String) -> Dictionary:
	if not PACK_TYPES.has(pack_id):
		return {}
	var w: Dictionary = PACK_TYPES[pack_id]["weights"]
	var total := 0.0
	for k in w.keys():
		total += float(w[k])
	var probs: Dictionary = {}
	for k in GameData.RARITY_ORDER:
		probs[k] = (float(w.get(k, 0.0)) / maxf(0.0001, total)) * 100.0
	var p_single := 0.0 if UpgradeManager.fifth_slot_unlocked else UpgradeManager.FIFTH_SLOT_DROP_PROBABILITY
	probs["fifth_upgrade_slot_per_roll_pct"] = p_single * 100.0
	probs["fifth_upgrade_slot_any_pct"] = (1.0 - pow(1.0 - p_single, float(CARDS_PER_PACK))) * 100.0
	return probs

func open_pack(pack_id: String) -> Dictionary:
	return purchase_and_open_pack(pack_id)

func _roll_rarity(weights: Dictionary) -> String:
	var total := 0.0
	for r in GameData.RARITY_ORDER:
		total += float(weights.get(r, 0.0))
	var pick := _rng.randf() * total
	var accum := 0.0
	for r in GameData.RARITY_ORDER:
		accum += float(weights.get(r, 0.0))
		if pick <= accum:
			return r
	return "Common"

func _roll_card_of_rarity(rarity: String) -> Dictionary:
	var pool: Array[Dictionary] = []
	for c in GameData.crew_cards:
		if c["rarity"] == rarity:
			pool.append(c)
	if pool.is_empty():
		return GameData.crew_cards[0]
	return pool[_rng.randi_range(0, pool.size() - 1)]

func purchase_and_open_pack(pack_id: String) -> Dictionary:
	if _busy_lock:
		return {"ok": false, "reason": "Transaction already in progress."}
	if not PACK_TYPES.has(pack_id):
		return {"ok": false, "reason": "Unknown pack type."}

	_busy_lock = true
	var pdef: Dictionary = PACK_TYPES[pack_id]
	var cost: int = int(pdef["crystal_cost"])
	if ShipGrid.crystals < cost:
		_busy_lock = false
		return {"ok": false, "reason": "Need %d Crystals (earn Crystals from Achievements!)." % cost}

	ShipGrid.crystals -= cost
	ShipGrid.stats_history["packs_opened"] = int(ShipGrid.stats_history.get("packs_opened", 0)) + 1

	var drawn_results: Array[Dictionary] = []
	var fifth_slot_won := false
	var weights: Dictionary = pdef["weights"]

	for _i in range(CARDS_PER_PACK):
		var rar := _roll_rarity(weights)
		var card_def := _roll_card_of_rarity(rar)
		var is_new := CrewManager.add_card_to_collection(card_def["id"])
		var dup_credits := 0
		if not is_new:
			dup_credits = int(DUPLICATE_CREDIT_BONUS.get(rar, 150))
			ShipGrid.add_credits(dup_credits)

		# Eligible roll for permanent 5th Active Upgrade Slot (1% per card roll if still locked)
		if not UpgradeManager.fifth_slot_unlocked:
			if UpgradeManager.try_roll_fifth_slot_reward(_rng):
				fifth_slot_won = true

		drawn_results.append({
			"card": card_def,
			"is_new": is_new,
			"duplicate_credits": dup_credits,
		})

	if AchievementManager:
		AchievementManager.record_event("open_pack", 1)
	ShipGrid.credits_changed.emit(ShipGrid.credits)
	_busy_lock = false
	SaveManager.autosave()
	pack_opened.emit(drawn_results, fifth_slot_won)
	return {
		"ok": true,
		"cards": drawn_results,
		"fifth_slot_unlocked": fifth_slot_won,
	}
