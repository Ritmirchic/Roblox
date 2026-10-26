extends BaseScreen
class_name ShopUI

var shop_id := ""
var list_box: VBoxContainer
var balance_label: Label

func _init() -> void:
	super._init("ShopUI")

func title_text() -> String:
	return "Trade"

func _build_body() -> void:
	shop_id = payload.get("shop", "boris")
	var shop: Dictionary = DialogueDB.shop(shop_id)
	balance_label = UiTheme.label("", 16, UiTheme.GOOD)
	content.add_child(balance_label)
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
	var shop: Dictionary = DialogueDB.shop(shop_id)
	var currency: String = shop.get("currency", "scrap_metal")
	balance_label.text = "Your %s: %d" % [
		ItemDB.display_name(currency), p.inventory_count(currency)]
	for entry in shop.get("buy", []):
		var row := HBoxContainer.new()
		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.add_child(UiTheme.label(
			"%s x%d" % [ItemDB.display_name(entry.id), entry.qty], 15,
			ItemDB.rarity_color(entry.id)))
		info.add_child(UiTheme.label("Price: %d %s" % [
			entry.price, ItemDB.display_name(currency)], 13,
			UiTheme.TEXT_DIM))
		row.add_child(info)
		var buy := UiTheme.button("Buy")
		buy.custom_minimum_size = Vector2(110, 36)
		buy.disabled = p.inventory_count(currency) < int(entry.price)
		var e: Dictionary = entry
		buy.pressed.connect(func(): _purchase(e, currency))
		row.add_child(buy)
		list_box.add_child(row)
	# Sell section.
	list_box.add_child(UiTheme.label("SELL ITEMS (40%% value in scrap)", 15,
		UiTheme.ACCENT))
	var seen: Dictionary = {}
	for s in p.inventory.stacks:
		if seen.has(s.id):
			continue
		seen[s.id] = true
		var def := ItemDB.get_def(s.id)
		if def.category in ["material", "ammo", "food", "water", "tool",
				"electronics", "medicine"]:
			list_box.add_child(_sell_row(p, s.id, currency,
				float(shop.get("sell_rate", 0.4))))

func _purchase(entry: Dictionary, currency: String) -> void:
	var p: Survivor = GameState.player
	if p.inventory_count(currency) < int(entry.price):
		return
	p.inventory_remove(currency, int(entry.price))
	p.inventory_add(entry.id, int(entry.qty))
	AudioMan.play_2d("pickup", -6.0)
	QuestMan.toast.emit("Bought " + ItemDB.display_name(entry.id))
	_refresh()

func _sell_row(p: Survivor, item_id: String, currency: String,
		rate: float) -> Control:
	var row := HBoxContainer.new()
	var price := maxi(1, int(round(float(ItemDB.get_def(item_id).weight) * 4.0 * rate)))
	var l := UiTheme.label("%s — %d %s" % [
		ItemDB.display_name(item_id), price,
		ItemDB.display_name(currency)], 14)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(l)
	var sell := UiTheme.button("Sell 1")
	sell.custom_minimum_size = Vector2(110, 32)
	sell.pressed.connect(func():
		if p.inventory_remove(item_id, 1) > 0:
			p.inventory_add(currency, price)
			_refresh())
	row.add_child(sell)
	return row
