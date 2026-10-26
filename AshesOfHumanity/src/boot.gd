extends Node
## Boot entry point: validates registries, wires the UI factory and either
## runs the headless smoke test (CI) or shows the main menu.

func _ready() -> void:
	print("[AoH] Boot OK — engine ", Engine.get_version_info().string)
	print("[AoH] Items registered: ", ItemDB.items.size())
	print("[AoH] Quests registered: ", QuestDB.quests.size())
	var factory_script: Script = load("res://src/ui/ui_factory.gd")
	UIRouter.set_screen_factory(Callable(factory_script, "create_screen"))
	if OS.has_feature("headless") or DisplayServer.get_name() == "headless":
		# Smoke mode: quit after one frame so CI can validate startup.
		await get_tree().process_frame
		get_tree().quit(0)
		return
	UIRouter.open("MainMenuUI")
