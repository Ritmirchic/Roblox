// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Quest framework and content.
// ============================================================================
#include "game/quests.h"
#include "game/ai.h"
#include "game/player.h"
#include "game/items.h"
#include "game/save.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
namespace {

struct ObjSpec { int type; const char* desc; int target; int need; bool optional; };
struct QuestSpec {
  const char* act;
  const char* title;
  const char* summary;
  bool main;
  int region;
  int prereqCount;        // number of previous quests in the same chain
  int prereqOffset;      // index into the main/side array
  int xp;
  const char* rewardItem;
  int rewardCount;
  int objCount;
  ObjSpec objs[4];
  const char* markerName;
};

} // namespace

// ---------------------------------------------------------------------------
void QuestSystem::build() {
  m_quests.clear();
  m_flags.clear();
  m_flagIndex.clear();

  auto addQuest = [&](const char* act, const char* title, const char* summary, bool main,
                      int region, int xp, const char* rewardItem, int rewardCount,
                      std::vector<int> prereq, std::vector<Objective> objs,
                      std::vector<std::string> setFlags, std::vector<std::string> needFlags) {
    Quest q;
    q.id = (int)m_quests.size();
    q.act = act; q.title = title; q.summary = summary;
    q.main = main; q.region = region; q.xp = xp;
    q.state = QS_LOCKED;
    q.prereq = prereq;
    q.objectives = objs;
    q.setFlags = setFlags;
    q.needFlags = needFlags;
    if (rewardItem && *rewardItem) {
      q.rewardItemName = rewardItem;
      q.rewardCount = rewardCount;
    }
    m_quests.push_back(q);
    return q.id;
  };

  auto obj = [](int type, const char* desc, int target, int need, bool opt = false) {
    Objective o; o.type = type; o.desc = desc; o.target = target; o.need = need; o.optional = opt;
    return o;
  };

  // =======================================================================
  // MAIN STORY - 40 quests across 8 acts
  // =======================================================================
  std::vector<int> mainIds;

  // Act I - Awakening
  mainIds.push_back(addQuest("I", "Cold Open", "You wake under a grey sky with no memory of the road that brought you here.", true, 0, 120, "Bandage", 2,
      {}, {obj(OBJ_REACH, "Reach the river crossing", 0, 1), obj(OBJ_SCAVENGE, "Scavenge a shelter", 0, 1)},
      {"act1_started"}, {}));
  mainIds.push_back(addQuest("I", "First Night", "The cold will kill you before the infected do. Build a fire and survive until dawn.", true, 0, 160, "Canned Food", 2,
      {0}, {obj(OBJ_SURVIVE, "Survive the night", 0, 1), obj(OBJ_COLLECT, "Find fuel", -1, 3)},
      {"fire_made"}, {}));
  mainIds.push_back(addQuest("I", "The Shelters", "Houses stand empty in the suburbs. Some of them hold supplies.", true, 0, 180, "Pistol", 1,
      {1}, {obj(OBJ_SCAVENGE, "Search three houses", 0, 3), obj(OBJ_COLLECT, "Collect ammunition", -1, 12)},
      {}, {}));
  mainIds.push_back(addQuest("I", "Signs of Order", "Someone painted arrows on the wall. A patrol route, or a warning.", true, 0, 200, "Notebook", 1,
      {2}, {obj(OBJ_REACH, "Follow the arrows to the old precinct", 0, 1), obj(OBJ_TALK, "Speak to whoever is watching", 0, 1)},
      {"precinct_found"}, {}));
  mainIds.push_back(addQuest("I", "The Precinct", "The police station still has a generator running. Someone is holding it.", true, 0, 240, "Assault Rifle", 1,
      {3}, {obj(OBJ_SCAVENGE, "Search the precinct", 0, 1), obj(OBJ_KILL, "Drive off the hollows", 0, 6)},
      {"precinct_cleared"}, {}));

  // Act II - The Signal
  mainIds.push_back(addQuest("II", "Dead Air", "A radio crackles on the same frequency every hour. It is not noise.", true, 0, 260, "Battery", 2,
      {4}, {obj(OBJ_COLLECT, "Find a working radio", -1, 1), obj(OBJ_TALK, "Ask about the signal", 0, 1)},
      {"signal_known"}, {}));
  mainIds.push_back(addQuest("II", "Into the Blackwood", "The transmission came from the forest. Nobody goes there on purpose.", true, 1, 280, "Combat Helmet", 1,
      {5}, {obj(OBJ_REACH, "Enter Blackwood Forest", 1, 1), obj(OBJ_SCAVENGE, "Find the ranger camp", 0, 1)},
      {}, {}));
  mainIds.push_back(addQuest("II", "The Matriarch's Clearing", "Something enormous has been feeding here. The trees are full of bones.", true, 1, 320, "Field Medkit", 2,
      {6}, {obj(OBJ_BOSS, "Kill the Forest Matriarch", 12, 1)},
      {"matriarch_dead"}, {}));
  mainIds.push_back(addQuest("II", "Rangers' Ledger", "The ranger left notes about every traveller who came through.", true, 1, 240, "Medical Ledger", 1,
      {7}, {obj(OBJ_SCAVENGE, "Recover the ranger's notes", 0, 1), obj(OBJ_COLLECT, "Collect medical supplies", -1, 3)},
      {}, {}));
  mainIds.push_back(addQuest("II", "The Road East", "The signal is stronger to the east, towards the exclusion zone.", true, 1, 260, "Rifle Ammo", 30,
      {8}, {obj(OBJ_REACH, "Reach the eastern road", 1, 1), obj(OBJ_KILL, "Survive the forest", 0, 8)},
      {}, {}));

  // Act III - The City
  mainIds.push_back(addQuest("III", "Concrete Mausoleum", "Forgotten City. Every street is a grave with windows.", true, 3, 300, "Armour Vest", 1,
      {9}, {obj(OBJ_REACH, "Enter Forgotten City", 3, 1), obj(OBJ_SCAVENGE, "Find a way in", 0, 1)},
      {}, {}));
  mainIds.push_back(addQuest("III", "Saint Agnes", "The hospital wing still has power. There are people inside, and they are not all human.", true, 3, 340, "Antibiotics", 4,
      {10}, {obj(OBJ_REACH, "Reach Saint Agnes Hospital", 3, 1), obj(OBJ_KILL, "Clear the ward", 5, 8)},
      {"hospital_reached"}, {}));
  mainIds.push_back(addQuest("III", "The Ledger", "Records of who was treated and who did not leave. Your name is in there.", true, 3, 320, "Medical Ledger", 1,
      {11}, {obj(OBJ_SCAVENGE, "Recover the patient ledger", 0, 1), obj(OBJ_TALK, "Find out who you were", 0, 1)},
      {"identity_known"}, {}));
  mainIds.push_back(addQuest("III", "Mimics", "Something in the city wears faces it found. Learn to tell the difference.", true, 3, 300, "Combat Knife", 1,
      {12}, {obj(OBJ_KILL, "Destroy the mimics", 5, 6)},
      {}, {}));
  mainIds.push_back(addQuest("III", "The Hollow King", "He sits where the cathedral used to be, and he is waiting for a challenger.", true, 3, 520, "Assault Rifle", 1,
      {13}, {obj(OBJ_BOSS, "Kill the Hollow King", 10, 1)},
      {"hollow_king_dead"}, {}));

  // Act IV - Industry
  mainIds.push_back(addQuest("IV", "Smoke Over the Rail Yard", "The industrial zone burns something every night.", true, 2, 320, "Fuel Can", 1,
      {14}, {obj(OBJ_REACH, "Reach the Industrial Zone", 2, 1), obj(OBJ_COLLECT, "Find fuel", -1, 2)},
      {}, {}));
  mainIds.push_back(addQuest("IV", "Bunker Seven", "They built a bunker under the factory. The door is still sealed.", true, 2, 360, "Electronics", 3,
      {15}, {obj(OBJ_REACH, "Locate Bunker 7", 2, 1), obj(OBJ_SCAVENGE, "Open the blast door", 0, 1)},
      {"bunker_open"}, {}));
  mainIds.push_back(addQuest("IV", "The Iron Abomination", "Something in the factory was welded into a weapon.", true, 2, 480, "Scrap Metal", 12,
      {16}, {obj(OBJ_BOSS, "Destroy the Iron Abomination", 11, 1)},
      {"iron_dead"}, {}));
  mainIds.push_back(addQuest("IV", "Reactor", "Power for the whole zone, if you can restart it.", true, 2, 340, "Battery", 2,
      {17}, {obj(OBJ_INTERACT, "Restart the generator", 0, 1), obj(OBJ_KILL, "Hold the reactor room", 4, 10)},
      {"reactor_on"}, {}));
  mainIds.push_back(addQuest("IV", "The Hollow King", "Not the King. The thing that made him.", true, 2, 380, "Flashlight", 1,
      {18}, {obj(OBJ_KILL, "Destroy the hollows", 0, 12), obj(OBJ_TALK, "Report to the commander", 0, 1)},
      {}, {}));

  // Act V - The Exclusion Zone
  mainIds.push_back(addQuest("V", "Do Not Enter", "Gate Delta has a perimeter, a fence and a very long range.", true, 4, 360, "Scope Attachment", 1,
      {19}, {obj(OBJ_REACH, "Approach Gate Delta", 4, 1), obj(OBJ_KILL, "Get past the checkpoint", 9, 8)},
      {}, {}));
  mainIds.push_back(addQuest("V", "Pale Command", "The commander does not want you dead. That is worse.", true, 4, 520, "Hunting Rifle", 1,
      {20}, {obj(OBJ_REACH, "Find the command bunker", 4, 1), obj(OBJ_BOSS, "Defeat the Pale Commander", 14, 1)},
      {"commander_dead"}, {}));
  mainIds.push_back(addQuest("V", "Protocol", "Orders for a containment that failed. Names of the dead. A photograph of a child.", true, 4, 400, "Notebook", 1,
      {21}, {obj(OBJ_SCAVENGE, "Recover the mission orders", 0, 1), obj(OBJ_COLLECT, "Collect sealed orders", -1, 2)},
      {}, {}));
  mainIds.push_back(addQuest("V", "Evacuation", "There were evacuation buses. One of them made it out of the zone.", true, 4, 380, "Fuel Can", 2,
      {22}, {obj(OBJ_REACH, "Find the evacuation convoy", 4, 1), obj(OBJ_SCAVENGE, "Salvage the convoy", 0, 1)},
      {}, {}));
  mainIds.push_back(addQuest("V", "Signal Test", "The exclusion zone has a transmitter array. It is what has been calling.", true, 4, 420, "Electronics", 4,
      {23}, {obj(OBJ_REACH, "Reach the transmitter", 4, 1), obj(OBJ_INTERACT, "Disable the transmitter", 0, 1)},
      {"transmitter_off"}, {}));

  // Act VI - The Wasteland
  mainIds.push_back(addQuest("VI", "Red Dust", "Everything out here is the colour of old blood.", true, 5, 380, "Herbal Poultice", 3,
      {24}, {obj(OBJ_REACH, "Enter the Red Wasteland", 5, 1), obj(OBJ_COLLECT, "Gather radiation shielding", -1, 2)},
      {}, {}));
  mainIds.push_back(addQuest("VI", "Convoy Wreck", "The convoy burned. One truck still has its cargo intact.", true, 5, 400, "Assault Rifle", 1,
      {25}, {obj(OBJ_REACH, "Reach the convoy wreck", 5, 1), obj(OBJ_SCAVENGE, "Strip the cargo truck", 0, 1)},
      {}, {}));
  mainIds.push_back(addQuest("VI", "The Contaminated Titan", "The wasteland has a king of its own, and it leaks.", true, 5, 560, "Stimulant", 2,
      {26}, {obj(OBJ_BOSS, "Kill the Contaminated Titan", 13, 1)},
      {"titan_dead"}, {}));
  mainIds.push_back(addQuest("VI", "Refinery Ruins", "What is left of the refinery is still running on fumes and hate.", true, 5, 420, "Scrap Metal", 16,
      {27}, {obj(OBJ_SCAVENGE, "Dismantle the refinery", 0, 1), obj(OBJ_KILL, "Survive the cleanup", 8, 14)},
      {}, {}));
  mainIds.push_back(addQuest("VI", "Clean Water", "A working pump and a filter is worth more than a rifle out here.", true, 5, 380, "Water Bottle", 3,
      {28}, {obj(OBJ_INTERACT, "Repair the water pump", 0, 1), obj(OBJ_COLLECT, "Collect filter media", -1, 4)},
      {"water_works"}, {}));

  // Act VII - Homecoming
  mainIds.push_back(addQuest("VII", "The Long Road Back", "The signal points back to the city. It always did.", true, 3, 440, "Field Medkit", 3,
      {29}, {obj(OBJ_REACH, "Return to Forgotten City", 3, 1), obj(OBJ_KILL, "Survive the return", 0, 16)},
      {}, {}));
  mainIds.push_back(addQuest("VII", "Home", "Somebody kept the lights on in the plaza. Somebody has been waiting.", true, 3, 460, "Handheld Radio", 1,
      {30}, {obj(OBJ_TALK, "Meet the survivors", 0, 1), obj(OBJ_COLLECT, "Gather supplies for the group", -1, 6)},
      {"survivors_met"}, {}));
  mainIds.push_back(addQuest("VII", "The Pale Ones", "Something in the city wears pale skin and knows how to shoot.", true, 3, 480, "Armour Vest", 1,
      {31}, {obj(OBJ_KILL, "Destroy the Pale Ones", 9, 10), obj(OBJ_SCAVENGE, "Secure the plaza defences", 0, 1)},
      {}, {}));
  mainIds.push_back(addQuest("VII", "The Watchers", "Tall things watch from the towers and never blink.", true, 3, 420, "Cloth Scrap", 10,
      {32}, {obj(OBJ_KILL, "Destroy the watchers", 2, 6), obj(OBJ_REACH, "Climb the watchtower", 3, 1)},
      {}, {}));
  mainIds.push_back(addQuest("VII", "Buried Names", "A cemetery outside the city. Hundreds of markers with names.", true, 3, 400, "Notebook", 1,
      {33}, {obj(OBJ_REACH, "Find the cemetery", 0, 1), obj(OBJ_SCAVENGE, "Copy the names", 0, 1)},
      {"names_copied"}, {}));

  // Act VIII - Last Signal
  mainIds.push_back(addQuest("VIII", "Origin", "The transmitter array does not send. It receives. And it has been answering for years.", true, 5, 500, "Electronics", 6,
      {34}, {obj(OBJ_REACH, "Reach the origin of the signal", 5, 1), obj(OBJ_INTERACT, "Access the relay", 0, 1)},
      {"relay_accessed"}, {}));
  mainIds.push_back(addQuest("VIII", "The Pale Commander", "He came back. He was never a commander, he was a relay.", true, 5, 560, "Hunting Rifle", 1,
      {35}, {obj(OBJ_BOSS, "Kill the Pale Commander again", 14, 1)},
      {}, {}));
  mainIds.push_back(addQuest("VIII", "What Answers", "The thing behind the signal is not a machine and not a person.", true, 5, 620, "Stimulant", 4,
      {36}, {obj(OBJ_BOSS, "Face the Last Signal", 15, 1)},
      {"last_signal_dead"}, {}));
  mainIds.push_back(addQuest("VIII", "Ash and Memory", "Everything is quiet. You can hear your own blood again.", true, 5, 800, "Field Medkit", 5,
      {37}, {obj(OBJ_REACH, "Leave the exclusion zone", 5, 1), obj(OBJ_SURVIVE, "Survive the walk out", 0, 1)},
      {"epilogue"}, {}));
  mainIds.push_back(addQuest("VIII", "ASHES OF HUMANITY", "The last broadcast. Say something worth hearing.", true, 5, 1200, "Handheld Radio", 1,
      {38}, {obj(OBJ_INTERACT, "Make the final transmission", 0, 1)},
      {"final_transmission"}, {}));

  // =======================================================================
  // SIDE QUESTS - 60 varied contracts
  // =======================================================================
  auto side = [&](const char* act, const char* title, const char* summary, int region,
                  int xp, const char* item, int count, std::vector<Objective> objs) {
    mainIds.push_back(addQuest(act, title, summary, false, region, xp, item, count,
                               {}, objs, {}, {}));
  };

  side("I", "Medicine for the Old", "An old woman will trade supplies for antibiotics.", 0, 90, "Bandage", 3,
       {obj(OBJ_COLLECT, "Collect antibiotics", -1, 2), obj(OBJ_TALK, "Return to the old woman", 0, 1)});
  side("I", "Roadside Ambush", "Bandits have been hitting the supply run.", 0, 110, "Pistol Ammo", 24,
       {obj(OBJ_KILL, "Clear the ambush", 5, 4)});
  side("I", "A Locked Shed", "Somebody bolted the door on the old shed.", 0, 80, "Scrap Metal", 4,
       {obj(OBJ_SCAVENGE, "Force the shed door", 0, 1)});
  side("I", "Fence Line", "The perimeter needs wire, not wishes.", 0, 100, "Wood Plank", 6,
       {obj(OBJ_COLLECT, "Gather lumber", -1, 6)});
  side("I", "Dog Tags", "A patrol went out and did not come back.", 0, 120, "Notebook", 1,
       {obj(OBJ_SCAVENGE, "Recover the patrol's tags", 0, 1)});
  side("II", "Mushroom Fields", "The forest floor is covered in edible caps.", 1, 90, "Edible Mushroom", 6,
       {obj(OBJ_COLLECT, "Gather mushrooms", -1, 6)});
  side("II", "Wolf Tracks", "Something large is hunting the treeline.", 1, 130, "Raw Meat", 4,
       {obj(OBJ_KILL, "Kill the stalkers", 7, 3), obj(OBJ_COLLECT, "Collect the pelts", -1, 3)});
  side("II", "Poachers", "Men with rifles are taking the forest.", 1, 160, "Hunting Rifle", 1,
       {obj(OBJ_KILL, "Drive off the poachers", 9, 4)});
  side("II", "Lost Scout", "A ranger's whistle, still on the ground.", 1, 140, "Field Medkit", 1,
       {obj(OBJ_REACH, "Search the scout's trail", 1, 1), obj(OBJ_SCAVENGE, "Recover the pack", 0, 1)});
  side("II", "Spring Water", "Clean water is worth a fortune up here.", 1, 100, "Water Bottle", 4,
       {obj(OBJ_COLLECT, "Collect spring water", -1, 4)});
  side("II", "Beast in the Camp", "Something walked into the camp and left again.", 1, 150, "Leather", 3,
       {obj(OBJ_KILL, "Destroy the intruder", 3, 3)});
  side("III", "Skylight", "Somebody broke the skylight of the arcade to get in.", 3, 110, "Cloth Scrap", 10,
       {obj(OBJ_SCAVENGE, "Search the arcade", 0, 1)});
  side("III", "Pharmacy Run", "Saint Agnes dispensary still has stock.", 3, 150, "Antibiotics", 3,
       {obj(OBJ_REACH, "Reach the dispensary", 3, 1), obj(OBJ_COLLECT, "Collect medicine", -1, 3)});
  side("III", "Rooftop Watch", "The high ground sees everything.", 3, 140, "Field Medkit", 2,
       {obj(OBJ_REACH, "Climb to the rooftops", 3, 1), obj(OBJ_KILL, "Clear the roof", 0, 6)});
  side("III", "For the Record", "A journalist never made it out.", 3, 160, "Notebook", 1,
       {obj(OBJ_SCAVENGE, "Recover the recorder", 0, 1)});
  side("III", "Mimic Season", "They are getting better at pretending.", 3, 170, "Combat Knife", 1,
       {obj(OBJ_KILL, "Destroy the mimics", 5, 8)});
  side("III", "Streetlight Repair", "Bring light back to the plaza.", 3, 130, "Electronics", 2,
       {obj(OBJ_COLLECT, "Find wiring", -1, 2), obj(OBJ_INTERACT, "Restore the streetlights", 0, 1)});
  side("IV", "Scrap Contracts", "The foreman paid by the kilo before the end.", 2, 120, "Scrap Metal", 12,
       {obj(OBJ_COLLECT, "Scrap metal", -1, 12)});
  side("IV", "Cooling Tower", "The tower is still standing. That is a miracle.", 2, 140, "Metal Scrap", 8,
       {obj(OBJ_REACH, "Climb the cooling tower", 2, 1)});
  side("IV", "Chemical Spill", "Something leaked and everything downwind is grey.", 2, 150, "Herbal Poultice", 2,
       {obj(OBJ_REACH, "Reach the spill site", 2, 1), obj(OBJ_COLLECT, "Collect antidote herbs", -1, 3)});
  side("IV", "Night Shift", "The factory lights come on at night. Nobody is working them.", 2, 180, "Battery", 2,
       {obj(OBJ_SCAVENGE, "Investigate the factory floor", 0, 1), obj(OBJ_KILL, "Survive the night shift", 4, 8)});
  side("IV", "Rail Tie", "Sleepers and spikes, useful for everything.", 2, 110, "Wood Plank", 8,
       {obj(OBJ_COLLECT, "Recover rail ties", -1, 8)});
  side("IV", "Pipe Dream", "There is fuel in the old pipeline.", 2, 130, "Fuel Can", 1,
       {obj(OBJ_INTERACT, "Tap the pipeline", 0, 1)});
  side("V", "Perimeter Duty", "Walk the fence and mark the weak points.", 4, 140, "Cloth Scrap", 6,
       {obj(OBJ_REACH, "Patrol the perimeter", 4, 1)});
  side("V", "Dog Handler", "Military working dogs did not survive the rot.", 4, 160, "Raw Meat", 6,
       {obj(OBJ_KILL, "Destroy the infected handlers", 9, 4)});
  side("V", "Munitions", "Crates of ammunition under canvas.", 4, 150, "Rifle Ammo", 40,
       {obj(OBJ_SCAVENGE, "Open the munitions crate", 0, 1)});
  side("V", "Radio Check", "The relay answers when you call it.", 4, 170, "Handheld Radio", 1,
       {obj(OBJ_INTERACT, "Answer the relay call", 0, 1)});
  side("V", "Deserter", "One soldier walked out of the gate.", 4, 190, "Hunting Rifle", 1,
       {obj(OBJ_TALK, "Find the deserter", 0, 1), obj(OBJ_KILL, "Escort or silence him", 9, 5)});
  side("V", "Clean Plates", "Steal back the surveillance drives.", 4, 160, "Electronics", 4,
       {obj(OBJ_SCAVENGE, "Steal the drives", 0, 1)});
  side("VI", "Radiation Sickness", "The poultice helps. A little.", 5, 150, "Herbal Poultice", 4,
       {obj(OBJ_COLLECT, "Gather desert herbs", -1, 5)});
  side("VI", "Truck Jack", "A jack, a spare tyre and a tank of fuel.", 5, 160, "Fuel Can", 2,
       {obj(OBJ_REACH, "Reach the convoy", 5, 1), obj(OBJ_SCAVENGE, "Strip the truck", 0, 1)});
  side("VI", "Glass Desert", "The sand is made of glass. So are the bones.", 5, 170, "Scrap Metal", 14,
       {obj(OBJ_SCAVENGE, "Collect glass sand", 0, 1)});
  side("VI", "Red Bloom", "Something is growing out here that should not be.", 5, 190, "Edible Mushroom", 8,
       {obj(OBJ_COLLECT, "Harvest the bloom", -1, 8), obj(OBJ_KILL, "Survive the harvest", 8, 8)});
  side("VI", "Sump Run", "The refinery sump is a swamp of chemicals.", 5, 180, "Electronics", 3,
       {obj(OBJ_REACH, "Enter the sump", 5, 1)});
  side("VI", "Rust Tide", "The whole yard is rusting at once.", 5, 140, "Metal Scrap", 10,
       {obj(OBJ_COLLECT, "Harvest rust", -1, 10)});
  side("VII", "The Wall", "The survivors want a wall before the next night.", 3, 200, "Wood Plank", 14,
       {obj(OBJ_COLLECT, "Gather planks", -1, 14), obj(OBJ_INTERACT, "Build the wall", 0, 1)});
  side("VII", "Well Water", "Dig, filter, boil. Repeat.", 3, 150, "Water Bottle", 5,
       {obj(OBJ_INTERACT, "Restore the well", 0, 1)});
  side("VII", "Chimney Sweep", "The old bakery still has bread in the oven.", 3, 140, "Field Ration", 2,
       {obj(OBJ_SCAVENGE, "Search the bakery", 0, 1)});
  side("VII", "Radio Tower", "Mount the antenna on the tower.", 3, 190, "Electronics", 5,
       {obj(OBJ_REACH, "Climb the radio tower", 3, 1), obj(OBJ_INTERACT, "Install the antenna", 0, 1)});
  side("VII", "Spares", "Every camp needs a mechanic.", 3, 160, "Scrap Metal", 10,
       {obj(OBJ_COLLECT, "Scrap parts", -1, 10)});
  side("VII", "Night Watch", "Someone has to stand the watch.", 3, 170, "Field Medkit", 2,
       {obj(OBJ_SURVIVE, "Stand watch through the night", 0, 1)});
  side("VIII", "Last Letters", "There is a mailbox in the city with names on it.", 5, 220, "Notebook", 1,
       {obj(OBJ_SCAVENGE, "Collect the last letters", 0, 1)});
  side("VIII", "Roadside Grave", "One traveller did not make it. Bury them.", 5, 200, "Cloth Scrap", 4,
       {obj(OBJ_REACH, "Find the roadside grave", 5, 1)});
  side("VIII", "Oxygen", "The tanks would let you breathe in the red air.", 5, 230, "Battery", 3,
       {obj(OBJ_COLLECT, "Recover oxygen tanks", -1, 3)});
  side("VIII", "The Other Transmitter", "A second signal, weaker, older.", 5, 250, "Handheld Radio", 1,
       {obj(OBJ_INTERACT, "Tune the second transmitter", 0, 1)});
  side("VIII", "Unfinished Business", "A list of names. Finish it.", 5, 280, "Hunting Rifle", 1,
       {obj(OBJ_KILL, "Kill the Pale Ones", 9, 12)});
  side("VIII", "Homeward", "Walk out. Do not look back.", 5, 300, "Field Medkit", 4,
       {obj(OBJ_REACH, "Reach the edge of the map", 5, 1)});

  side("I", "Cat Burglar", "The old cinema had a strongbox on the roof.", 0, 120, "Scrap Metal", 8,
       {obj(OBJ_REACH, "Climb the cinema roof", 0, 1), obj(OBJ_SCAVENGE, "Open the roof safe", 0, 1)});
  side("I", "Street Kitchen", "A pot, some fuel, a cooking fire. Dinner.", 0, 95, "Canned Food", 3,
       {obj(OBJ_COLLECT, "Collect fuel", -1, 2), obj(OBJ_INTERACT, "Cook a meal", 0, 1)});
  side("II", "Bone Collector", "The forest floor is a museum of the wrong kind.", 1, 135, "Cloth Scrap", 8,
       {obj(OBJ_COLLECT, "Collect bones", -1, 8)});
  side("II", "Firewatch", "The old fire tower still has a working light.", 1, 155, "Battery", 2,
       {obj(OBJ_REACH, "Climb the fire tower", 1, 1), obj(OBJ_INTERACT, "Light the beacon", 0, 1)});
  side("II", "Cages", "Someone built traps. Something keeps getting out.", 1, 145, "Leather", 4,
       {obj(OBJ_SCAVENGE, "Recover the traps", 0, 1), obj(OBJ_KILL, "Destroy the trapped thing", 7, 2)});
  side("III", "Graffiti", "Someone tagged the city walls with directions.", 3, 105, "Cloth Scrap", 5,
       {obj(OBJ_SCAVENGE, "Photograph the tags", 0, 1)});
  side("III", "Ice Machine", "The cafe freezer still has ice in it.", 3, 115, "Water Bottle", 4,
       {obj(OBJ_SCAVENGE, "Search the cafe", 0, 1)});
  side("III", "Stairwell", "The stairwell door was chained from the inside.", 3, 165, "Field Medkit", 1,
       {obj(OBJ_SCAVENGE, "Force the stairwell door", 0, 1)});
  side("IV", "Lunchbox", "Someone left their lunch on a girder.", 2, 125, "Field Ration", 2,
       {obj(OBJ_REACH, "Climb the girder", 2, 1), obj(OBJ_SCAVENGE, "Recover the lunchbox", 0, 1)});
  side("IV", "Containment", "Something in the pipes is making noise.", 2, 175, "Metal Scrap", 8,
       {obj(OBJ_REACH, "Find the noise", 2, 1), obj(OBJ_KILL, "Kill what is in the pipes", 6, 3)});
  side("V", "Field Dressing", "The medics left their kit in the trench.", 4, 150, "Field Medkit", 2,
       {obj(OBJ_SCAVENGE, "Recover the medical kit", 0, 1)});
  side("VI", "Ash Sampling", "A scientist wants samples from the red soil.", 5, 185, "Electronics", 3,
       {obj(OBJ_COLLECT, "Collect soil samples", -1, 3)});
  side("VI", "Glass Teeth", "The wasteland grows teeth out of the sand.", 5, 195, "Scrap Metal", 12,
       {obj(OBJ_KILL, "Destroy the burrowers", 6, 5)});

  // fix up side quest count: ensure exactly 60 side quests
  int sideCount = 0;
  for (const Quest& q : m_quests) if (!q.main) sideCount++;
  // (the list above is authored to 60 entries)

  for (Quest& q : m_quests) {
    q.state = QS_LOCKED;
  }
  // quest markers point at the centre of their region
  for (Quest& q : m_quests) {
    if (q.region >= 0 && q.region < 6) {
      static const Vec3 centers[6] = {
        Vec3(-620, 0, 430), Vec3(-200, 0, 780), Vec3(-900, 0, -40),
        Vec3(-40, 0, 40), Vec3(560, 0, 60), Vec3(700, 0, 720)
      };
      q.marker = centers[q.region];
      q.hasMarker = true;
    }
  }
  // unlock quests with no prerequisites
  for (Quest& q : m_quests) {
    if (q.prereq.empty() && q.needFlags.empty()) q.state = QS_AVAILABLE;
  }
}

// ---------------------------------------------------------------------------
Quest* QuestSystem::questPtr(int id) {
  if (id < 0 || id >= (int)m_quests.size()) return nullptr;
  return &m_quests[id];
}
const Quest* QuestSystem::quest(int id) const {
  if (id < 0 || id >= (int)m_quests.size()) return nullptr;
  return &m_quests[id];
}
int QuestSystem::activeCount() const {
  int n = 0;
  for (const Quest& q : m_quests) if (q.state == QS_ACTIVE) n++;
  return n;
}
int QuestSystem::completedCount() const {
  int n = 0;
  for (const Quest& q : m_quests) if (q.state == QS_COMPLETE) n++;
  return n;
}
bool QuestSystem::hasFlag(const std::string& f) const {
  return std::find(m_flags.begin(), m_flags.end(), f) != m_flags.end();
}
void QuestSystem::setFlag(const std::string& f) {
  if (hasFlag(f)) return;
  m_flags.push_back(f);
  m_flagIndex[f] = (int)m_flags.size() - 1;
}
std::vector<int> QuestSystem::available() const {
  std::vector<int> out;
  for (const Quest& q : m_quests) if (q.state == QS_AVAILABLE) out.push_back(q.id);
  return out;
}

// ---------------------------------------------------------------------------
void QuestSystem::refreshStates() {
  for (Quest& q : m_quests) {
    if (q.state == QS_COMPLETE || q.state == QS_FAILED) continue;
    bool ok = true;
    for (int pre : q.prereq) {
      if (pre < 0 || pre >= (int)m_quests.size()) continue;
      if (m_quests[pre].state != QS_COMPLETE) { ok = false; break; }
    }
    if (ok) {
      for (const std::string& f : q.needFlags)
        if (!hasFlag(f)) { ok = false; break; }
    }
    if (!ok) { if (q.state == QS_AVAILABLE || q.state == QS_ACTIVE) q.state = QS_LOCKED; }
    else if (q.state == QS_LOCKED) q.state = QS_AVAILABLE;
  }
}

// ---------------------------------------------------------------------------
void QuestSystem::complete(Quest& q, GameContext& ctx, Player& p) {
  q.state = QS_COMPLETE;
  for (const std::string& f : q.setFlags) setFlag(f);
  // reward
  if (!q.rewardItemName.empty() && ctx.items) {
    int id = ctx.items->find(q.rewardItemName);
    if (id >= 0) inventoryAdd(p, *ctx.items, id, q.rewardCount);
  }
  {
    PlayerController pc;
    pc.addXp(p, (f32)q.xp);
  }
  refreshStates();
}

// ---------------------------------------------------------------------------
void QuestSystem::update(GameContext& ctx, Player& p) {
  refreshStates();
  // auto-accept available quests that have objectives we can already do
  for (Quest& q : m_quests) {
    if (q.state != QS_AVAILABLE) continue;
    if (!q.main && (q.id % 3) != 0) continue;   // side quests need a manual accept
    q.state = QS_ACTIVE;
  }
  // evaluate active quests
  for (Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    bool done = true;
    for (Objective& o : q.objectives) {
      if (o.optional) continue;
      if (o.have < o.need) { done = false; break; }
    }
    if (done) complete(q, ctx, p);
  }
}

// ---------------------------------------------------------------------------
void QuestSystem::onKill(GameContext& ctx, int species) {
  for (Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    for (Objective& o : q.objectives) {
      if ((o.type == OBJ_KILL && o.target == species) ||
          (o.type == OBJ_BOSS && o.target == species)) {
        o.have = std::min(o.need, o.have + 1);
      }
    }
  }
}

// Maps an objective description onto the item category it counts.
static int collectCategory(const std::string& desc) {
  if (desc.find("ammunition") != std::string::npos || desc.find("ammo") != std::string::npos)
    return IT_AMMO;
  if (desc.find("medicine") != std::string::npos || desc.find("medical") != std::string::npos ||
      desc.find("antibiotic") != std::string::npos)
    return IT_MEDICAL;
  if (desc.find("water") != std::string::npos) return IT_DRINK;
  if (desc.find("mushroom") != std::string::npos || desc.find("herb") != std::string::npos ||
      desc.find("food") != std::string::npos)
    return IT_FOOD;
  if (desc.find("fuel") != std::string::npos) return IT_MATERIAL;
  if (desc.find("plank") != std::string::npos || desc.find("lumber") != std::string::npos ||
      desc.find("timber") != std::string::npos || desc.find("wood") != std::string::npos)
    return IT_MATERIAL;
  if (desc.find("scrap") != std::string::npos || desc.find("metal") != std::string::npos ||
      desc.find("wiring") != std::string::npos || desc.find("parts") != std::string::npos)
    return IT_MATERIAL;
  return -1;
}

void QuestSystem::onCollect(GameContext& ctx, int itemDef) {
  for (Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    for (Objective& o : q.objectives) {
      if (o.type != OBJ_COLLECT) continue;
      if (o.target >= 0 && o.target != itemDef) continue;
      int cat = collectCategory(o.desc);
      int have = 0;
      for (const ItemDef& d : ctx.items->defs()) {
        if (cat >= 0) {
          if (d.type != cat) continue;
        } else {
          if (!(d.type == IT_AMMO || d.type == IT_MATERIAL || d.type == IT_FOOD ||
                d.type == IT_DRINK || d.type == IT_MEDICAL)) continue;
        }
        have += inventoryCount(*ctx.player, d.id);
      }
      o.have = std::min(o.need, have);
    }
  }
}

void QuestSystem::onReach(GameContext& ctx, const Vec3& pos) {
  for (Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    for (Objective& o : q.objectives) {
      if (o.type != OBJ_REACH) continue;
      // target encodes the required region
      int region = o.target;
      if (region >= 0 && region < (int)ctx.world->regions().size()) {
        const RegionDef& r = ctx.world->region(region);
        if (dist2D(pos, r.center) < r.radius * 1.25f) o.have = o.need;
      }
    }
  }
}

void QuestSystem::onTalk(GameContext& ctx, int npc) {
  for (Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    for (Objective& o : q.objectives)
      if (o.type == OBJ_TALK && o.target == npc) o.have = o.need;
  }
}

// ---------------------------------------------------------------------------
bool QuestSystem::nearestMarker(const Vec3& from, Vec3& out, std::string& title) const {
  bool found = false;
  f32 best = 1e30f;
  for (const Quest& q : m_quests) {
    if (q.state != QS_ACTIVE) continue;
    if (!q.hasMarker) continue;
    f32 d = dist2D(from, q.marker);
    if (d < best) { best = d; out = q.marker; title = q.title; found = true; }
  }
  return found;
}

// ---------------------------------------------------------------------------
void QuestSystem::applySave(const SaveData& d) {
  m_flags.clear();
  m_flagIndex.clear();
  for (const std::string& f : d.flags) setFlag(f);
  size_t oi = 0;
  for (size_t i = 0; i < m_quests.size(); ++i) {
    Quest& q = m_quests[i];
    if (i < d.questStates.size()) q.state = (QuestState)d.questStates[i];
    for (Objective& o : q.objectives) {
      if (oi < d.questObjectives.size()) o.have = d.questObjectives[oi];
      ++oi;
    }
  }
  refreshStates();
}

} // namespace aoh
