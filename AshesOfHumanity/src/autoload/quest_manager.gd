extends Node
## Runtime quest state machine: acceptance, objective progress, completion.

signal quest_accepted(quest: Dictionary)
signal quest_updated(quest: Dictionary)
signal quest_completed(quest: Dictionary)
signal marker_added(marker: Dictionary)
signal marker_removed(id: String)
signal toast(text: String)

var active: Dictionary = {}        # quest_id -> progress dict
var completed: Array[String] = []
var available_turn_ins: Array[String] = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func can_accept(id: String) -> bool:
	var q := QuestDB.get_quest(id)
	if q.is_empty() or active.has(id) or id in completed:
		return false
	for pre in q.prereq_quests:
		if not pre in completed:
			return false
	for flag in q.prereq_flags:
		if not GameState.get_story_flag(flag):
			return false
	return true

func accept(id: String) -> bool:
	if not can_accept(id):
		return false
	var q := QuestDB.get_quest(id)
	active[id] = {"objective_progress": [0] * q.objectives.size(),
		"objectives_done": [false] * q.objectives.size()}
	for flag in q.get("start_flags", []):
		GameState.set_story_flag(flag)
	quest_accepted.emit(q)
	toast.emit("New quest: " + q.title)
	_refresh_markers()
	return true

func notify_event(event_type: String, target: String, amount: int = 1,
		data: Dictionary = {}) -> void:
	for id in active:
		var q := QuestDB.get_quest(id)
		var state: Dictionary = active[id]
		for i in q.objectives.size():
			if state.objectives_done[i]:
				continue
			var ob: Dictionary = q.objectives[i]
			if not _objective_matches(ob, event_type, target):
				continue
			state.objective_progress[i] = int(state.objective_progress[i]) + amount
			if int(state.objective_progress[i]) >= int(ob.get("amount", 1)):
				state.objectives_done[i] = true
				state.objective_progress[i] = int(ob.get("amount", 1))
				toast.emit("Objective: " + ob.label)
		quest_updated.emit(q)
		_check_completion(id)

func _objective_matches(ob: Dictionary, event_type: String, target: String) -> bool:
	if ob.type != event_type:
		return false
	if event_type == "kill_type":
		return ob.target == target or target.begins_with(ob.target)
	return ob.target == target

func _check_completion(id: String) -> void:
	var q := QuestDB.get_quest(id)
	var state: Dictionary = active[id]
	for done in state.objectives_done:
		if not done:
			return
	complete_quest(id)

func complete_quest(id: String) -> void:
	if not active.has(id):
		return
	var q := QuestDB.get_quest(id)
	active.erase(id)
	completed.append(id)
	GameState.stats.quests_done += 1
	var rewards: Dictionary = q.get("rewards", {})
	GameState.gain_xp(int(rewards.get("xp", 0)))
	for item_id in rewards.get("items", {}):
		var count: int = rewards.items[item_id]
		if GameState.player and is_instance_valid(GameState.player):
			GameState.player.inventory_add(item_id, count)
	for flag in q.get("complete_flags", []):
		GameState.set_story_flag(flag)
	quest_completed.emit(q)
	toast.emit("Quest complete: " + q.title)
	_refresh_markers()
	_auto_accept_next(id)

func _auto_accept_next(id: String) -> void:
	# Story quests chain automatically once prerequisites are met.
	for next_id in QuestDB.quests:
		var q: Dictionary = QuestDB.quests[next_id]
		if not q.get("side", false) and can_accept(next_id):
			accept(next_id)
			return

func objective_labels(id: String) -> Array:
	var q := QuestDB.get_quest(id)
	var out: Array = []
	if not active.has(id):
		return out
	var state: Dictionary = active[id]
	for i in q.objectives.size():
		var ob: Dictionary = q.objectives[i]
		var need: int = int(ob.get("amount", 1))
		if need > 1:
			out.append("%s (%d/%d)" % [ob.label,
				int(state.objective_progress[i]), need])
		else:
			out.append(("[X] " if state.objectives_done[i] else "[ ] ") + ob.label)
	return out

func active_quests() -> Array:
	return active.keys()

# ------------------------------------------------------------------ markers
func _refresh_markers() -> void:
	# World generator queries this to place 3D markers / map icons.
	marker_added.emit({"kind": "refresh"})

func to_save_dict() -> Dictionary:
	return {"active": active.duplicate(true),
		"completed": completed.duplicate()}

func from_save_dict(d: Dictionary) -> void:
	active = d.get("active", {})
	completed.assign(d.get("completed", []))
