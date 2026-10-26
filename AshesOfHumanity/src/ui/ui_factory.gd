extends RefCounted
## Builds the HUD and every routed screen from their script classes.

const SCREENS := {
	"MainMenuUI": "res://src/ui/screens/main_menu.gd",
	"SettingsUI": "res://src/ui/screens/settings_ui.gd",
	"LoadUI": "res://src/ui/screens/load_ui.gd",
	"PauseUI": "res://src/ui/screens/pause_ui.gd",
	"DeathUI": "res://src/ui/screens/death_ui.gd",
	"VictoryUI": "res://src/ui/screens/victory_ui.gd",
	"InventoryUI": "res://src/ui/screens/inventory_ui.gd",
	"CharacterUI": "res://src/ui/screens/character_ui.gd",
	"JournalUI": "res://src/ui/screens/journal_ui.gd",
	"MapUI": "res://src/ui/screens/map_ui.gd",
	"CraftingUI": "res://src/ui/screens/crafting_ui.gd",
	"BuildUI": "res://src/ui/screens/build_ui.gd",
	"DialogueUI": "res://src/ui/screens/dialogue_ui.gd",
	"ShopUI": "res://src/ui/screens/shop_ui.gd",
	"HelpUI": "res://src/ui/screens/help_ui.gd",
}

static func create_hud(player: Node) -> CanvasLayer:
	var hud := Hud.new()
	hud.setup(player)
	return hud

static func create_screen(screen_id: String, _payload: Dictionary = {}) -> Control:
	if not SCREENS.has(screen_id):
		push_error("Unknown screen: " + screen_id)
		return null
	var script: Script = load(SCREENS[screen_id])
	var node: Control = script.new()
	return node
