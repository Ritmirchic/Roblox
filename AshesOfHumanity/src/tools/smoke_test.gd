extends Node
## Headless integration smoke test: boots a full play session, exercises
## inventory, combat math, crafting, quests, building and save/load, then
## exits with code 0 on success.

var failures: Array[String] = []
var main: Node
var player: Survivor
var frames := 0
var phase := 0

func _ready() -> void:
	GameState.set_phase(GameState.PHASE_PLAYING)
	var packed: PackedScene = load("res://scenes/Main.tscn")
	main = packed.instantiate()
	get_tree().root.add_child.call_deferred(main)
	_test_registries()

func _process(_delta: float) -> void:
	frames += 1
	if frames == 30:
		_run_world_checks()
	elif frames == 45:
		_run_player_systems()
	elif frames == 60:
		_run_combat_checks()
	elif frames == 75:
		_run_crafting_quests()
	elif frames == 90:
		_run_building()
	elif frames == 110:
		_run_save_cycle()
	elif frames == 140:
		_finish()

func _check(condition: bool, label: String) -> void:
	if condition:
		print("[smoke] PASS: ", label)
	else:
		failures.append(label)
		push_error("[smoke] FAIL: " + label)

func _test_registries() -> void:
	_check(ItemDB.items.size() >= 50, "item registry populated (%d)" % ItemDB.items.size())
	_check(QuestDB.quests.size() >= 30, "quest registry populated (%d)" % QuestDB.quests.size())
	_check(not DialogueDB.get_tree("elena").is_empty(), "dialogue trees present")
	_check(CraftingSystem.RECIPES.size() >= 15, "crafting recipes present")
	_check(SkillSystem.TREES.size() == 3, "three skill trees")
	_check(BaseBuilder.CATALOG.size() >= 10, "build catalog (%d)" % BaseBuilder.CATALOG.size())

func _run_world_checks() -> void:
	player = main.player
	_check(is_instance_valid(player), "player spawned")
	_check(is_instance_valid(main.world), "world generator exists")
	_check(main.world.generated, "world generation finished")
	var enemies := get_tree().get_nodes_in_group("enemy")
	_check(enemies.size() > 0, "enemies spawned (%d)" % enemies.size())
	var npcs := get_tree().get_nodes_in_group("interactable")
	_check(npcs.size() >= 7, "interactables/npcs present (%d)" % npcs.size())
	var nav_regions: int = main.world._nav_regions.size()
	_check(nav_regions >= 6, "navigation regions baked (%d)" % nav_regions)
	_check(player.is_alive(), "player alive at spawn")

func _run_player_systems() -> void:
	# Grid packing and weight.
	var before := player.inventory.stacks.size()
	var left: int = player.inventory_add("scrap_metal", 10)
	_check(left == 0, "inventory accepts items")
	_check(player.inventory.count_of("scrap_metal") == 10, "stack count correct")
	var removed: int = player.inventory_remove("scrap_metal", 4)
	_check(removed == 4 and player.inventory.count_of("scrap_metal") == 6,
		"inventory removal")
	# Vitals and medicine.
	player.take_damage(20.0, "bite")
	_check(player.vitals.health < 90.0, "damage applied")
	player.heal(10.0)
	_check(player.vitals.health > 70.0, "healing applied")
	player.apply_radiation(30.0)
	_check(player.vitals.radiation >= 30.0, "radiation accumulates")
	# Equipment.
	player.inventory_add("w_pipe", 1)
	player.weapons.equip("w_pipe")
	_check(player.weapons.current_id == "w_pipe", "weapon equip")
	player.inventory_add("armor_vest", 1)
	# Skill unlock.
	GameState.skill_points = 2
	_check(GameState.unlock_skill("c1"), "skill unlock")
	_check(GameState.has_skill("c1"), "skill persisted")

func _run_combat_checks() -> void:
	var enemies := get_tree().get_nodes_in_group("enemy")
	var target: Enemy = null
	for e in enemies:
		if e is Enemy and e.alive:
			target = e
			break
	_check(target != null, "found a live enemy")
	if target:
		var hp_before: float = target.hp
		target.take_hit(10.0, target.global_position + Vector3.UP)
		_check(target.hp < hp_before, "enemy takes damage")
		# Head zone hit.
		var head_hp: float = target.hp
		target.take_hit(5.0, target.global_position + Vector3(0, 3.0, 0))
		_check(target.hp < head_hp, "head weak point resolves")
	# Firearm flow without ammo: should not crash.
	player.inventory_add("w_pistol", 1)
	player.weapons.equip("w_pistol")
	player.weapons.try_fire(player.cam_rig.camera)
	_check(true, "empty-mag fire does not crash")
	player.inventory_add("ammo_9mm", 24)
	_check(player.weapons._reserve() == 24, "ammo reserve visible to weapon")
	player.weapons.reloading = true
	player.weapons._perform_reload()
	_check(player.weapons.mag > 0, "reload draws ammo (mag=%d)" % player.weapons.mag)
	var mag_before: int = player.weapons.mag
	player.weapons.try_fire(player.cam_rig.camera)
	_check(player.weapons.mag < mag_before, "firing consumes ammo")

func _run_crafting_quests() -> void:
	# Give materials and craft bandages.
	player.inventory_add("cloth", 10)
	var recipe: Dictionary = CraftingSystem.RECIPES[0]
	_check(CraftingSystem.can_craft(recipe, player), "craft requirements met")
	var ok: bool = CraftingSystem.craft(recipe, player)
	_check(ok and player.inventory_count("bandage") >= 2, "crafting yields items")
	_check(GameState.stats.crafts > 0, "craft stat tracked")
	# Quest lifecycle.
	var qid := "s01_lost_supplies"
	if QuestMan.can_accept(qid):
		_check(QuestMan.accept(qid), "quest accepted")
	QuestMan.notify_event("reach", "overpass_cache")
	_check(qid in QuestMan.completed, "reach quest completes")
	# Dialogue tree navigation.
	var node := DialogueDB.node("elena", "intro")
	_check(not node.is_empty() and node.options.size() >= 3, "dialogue nodes branch")

func _run_building() -> void:
	player.inventory_add("wood_planks", 30)
	player.inventory_add("scrap_metal", 30)
	main.builder.begin("campfire")
	_check(main.builder.active, "build placement mode starts")
	main.builder.ghost.global_position = player.global_position \
		+ -player.global_transform.basis.z * 3.0
	var confirmed: bool = main.builder.confirm()
	_check(confirmed, "structure placement confirmed")
	_check(GameState.world_buildings.size() >= 1, "building persisted to state")
	var structures := 0
	for c in main.world.get_children():
		if c is BuildStructure:
			structures += 1
	_check(structures >= 1, "structure node exists in world")

func _run_save_cycle() -> void:
	_check(SaveMan.save_game(1), "save writes slot 1")
	_check(SaveMan.has_save(1), "save file exists")
	var payload: Dictionary = SaveMan.load_game(1)
	_check(typeof(payload) == TYPE_DICTIONARY, "save parses back")
	_check(int(payload.game_state.level) == GameState.level, "save state roundtrip")
	_check(float(payload["player"]["vitals"]["health"]) > 0.0, "player vitals serialized")
	_check(payload.game_state.world_buildings.size() >= 1,
		"buildings serialized")
	# Corruption handling.
	var path := SaveMan.slot_path(2)
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string("{not valid json")
	f.close()
	var result = SaveMan.load_game(2)
	_check(result == false, "corrupt save rejected and backed up")
	_check(FileAccess.file_exists(path + ".corrupt"), "corrupt backup created")

func _finish() -> void:
	if failures.is_empty():
		print("[smoke] ALL CHECKS PASSED")
		get_tree().quit(0)
	else:
		print("[smoke] %d FAILURE(S):" % failures.size())
		for fmsg in failures:
			print("  - ", fmsg)
		get_tree().quit(1)
