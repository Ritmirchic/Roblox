extends Node
## Boot entry point. Real flow is wired by the UI/world bootstrap added later;
## this minimal version validates that autoloads and imports initialize.

func _ready() -> void:
	print("[AoH] Boot OK — engine ", Engine.get_version_info().string)
	print("[AoH] Items registered: ", ItemDB.items.size())
	print("[AoH] Quests registered: ", QuestDB.quests.size())
	if OS.has_feature("headless") or DisplayServer.get_name() == "headless":
		# Smoke mode: quit after one frame so CI can validate startup.
		await get_tree().process_frame
		get_tree().quit(0)
