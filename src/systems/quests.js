/**
 * Quest framework + campaign content.
 * Objectives are driven by real gameplay events (kills, looting, reaching
 * locations, crafting, boss kills) and persist through the save system.
 */
import { clamp, clamp01 } from '../engine/util.js';

export const ACTS = [
  { id: 0, name: 'ACT I - AWAKENING', color: '#c8b48a', x: 0, z: 0 },
  { id: 1, name: 'ACT II - THE DEAD SUBURBS', color: '#a8926a', x: -1050, z: -1050 },
  { id: 2, name: 'ACT III - THE FOREST SIGNAL', color: '#7a9a5a', x: -420, z: -1080 },
  { id: 3, name: 'ACT IV - INDUSTRIAL SECRETS', color: '#9a8a70', x: -40, z: -330 },
  { id: 4, name: 'ACT V - THE FORGOTTEN CITY', color: '#8a96a2', x: 760, z: -260 },
  { id: 5, name: 'ACT VI - THE EXCLUSION ZONE', color: '#7c8a62', x: 430, z: 720 },
  { id: 6, name: 'ACT VII - THE RED WASTELAND', color: '#b0603a', x: 1130, z: 1090 },
  { id: 7, name: 'ACT VIII - THE LAST SIGNAL', color: '#d8c070', x: 1270, z: 1260 },
];

const Q = (id, act, title, desc, objectives, rewards = {}, opts = {}) => ({
  id, act, title, desc, objectives, rewards, ...opts,
});

/** Main story: 40 quests across 8 acts. Coordinates are resolved at runtime. */
export const MAIN_QUESTS = [
  // ---------------- ACT I - AWAKENING ----------------
  Q('m01', 0, 'Wake Up',
    'You wake on a cot in a sealed shelter. Your head is pounding. A handwritten note on the desk is addressed to you.',
    [{ type: 'search', profile: 'camp', count: 1, hint: 'Search the desk beside the cot', x: 0.1, z: 2.4, r: 4 }],
    { xp: 60, items: [['quest_note', 1], ['tool_flashlight', 1]] }, { start: true }),
  Q('m02', 0, 'The Note',
    'The note says the broadcasts began three weeks ago. Someone named M. tells you the answer is in the suburbs, and to trust the radio more than the men holding it.',
    [{ type: 'talk', target: 'shelterRadio', hint: 'Use the shelter radio' }, { type: 'reach', target: 'shelterExit', hint: 'Reach the shelter exit', x: 0, z: -14, r: 6 }],
    { xp: 80, scrip: 20 },
  ),
  Q('m03', 0, 'Daylight',
    'The blast door grinds open for the first time in months. Cold air, ash, and the smell of wet concrete. The Dead Suburbs are close.',
    [{ type: 'reach', target: 'suburbs', hint: 'Leave the shelter and head north-east to the suburbs', x: -900, z: -900, r: 90 }],
    { xp: 120, items: [['ammo_pistol', 12]] },
  ),
  Q('m04', 0, 'First Blood',
    'Something moves between the houses. The Hollow are drawn to sound - including yours.',
    [{ type: 'kill', target: 'hollow', count: 2, hint: 'Deal with the Hollow in the suburbs' }],
    { xp: 180, items: [['med_bandage', 2]] },
  ),
  Q('m05', 0, 'The Kettle',
    'A campfire burns in the ruins - the first human light you have seen. Survivors have made a home here.',
    [{ type: 'talk', target: 'Sera', hint: 'Speak with Sera at the survivor camp' }, { type: 'reach', target: 'camp', hint: 'Find the survivor camp', x: -1010, z: -900, r: 40 }],
    { xp: 200, items: [['water_bottle', 2], ['food_canned', 2]] },
  ),
  // ---------------- ACT II - THE DEAD SUBURBS ----------------
  Q('m06', 1, 'Not Ours Anymore',
    'Sera wants the generator on the east side of the camp restored. Without power, the water pump dies by winter.',
    [{ type: 'reach', target: 'generatorSite', hint: 'Reach the generator house', x: -830, z: -960, r: 22 }, { type: 'collect', item: 'electronics_circuit', count: 2, hint: 'Find 2 circuit boards' }],
    { xp: 260, scrip: 60 },
  ),
  Q('m07', 1, 'Loose Wires',
    'The generator needs wiring. Vasily knows where the old hardware store is - and what nests inside it.',
    [{ type: 'search', profile: 'factory', count: 2, hint: 'Search the hardware store and garages' }, { type: 'craft', recipe: 'repair_kit', count: 1, hint: 'Craft a repair kit at a workbench' }],
    { xp: 280, items: [['med_medkit', 1]] },
  ),
  Q('m08', 1, 'Repair the Generator',
    'Parts in hand. Restore the camp generator and bring the lights back on.',
    [{ type: 'reach', target: 'generatorSite', hint: 'Return to the generator house', x: -830, z: -960, r: 6 }],
    { xp: 320, scrip: 80 }, { requires: ['m07'] }),
  Q('m09', 1, 'The Hollow Nest',
    'The generator hum drew them out. A nest has taken root in the cul-de-sac. Clear it before it grows.',
    [{ type: 'kill', target: 'hollow', count: 5, hint: 'Kill the Hollow at the nest' }, { type: 'search', profile: 'nest', count: 1, hint: 'Search the nest' }],
    { xp: 420, items: [['ammo_pistol', 20]] },
  ),
  Q('m10', 1, 'The Hollow King',
    'Sera says every scream in the suburbs belongs to the Hollow King. Kill him, and the camp will breathe again.',
    [{ type: 'boss', target: 'hollowKing', hint: 'Kill the Hollow King in his nest under the water tower' }],
    { xp: 1400, items: [['rifle', 1], ['ammo_rifle', 20]], scrip: 260 }, { boss: 'hollowKing' }),

  // ---------------- ACT III - THE FOREST SIGNAL ----------------
  Q('m11', 2, 'Into Blackwood',
    'A second signal repeaters from the north. The forest is dense enough to swallow a convoy.',
    [{ type: 'reach', target: 'forest', hint: 'Travel into Blackwood Forest', x: -420, z: -1080, r: 120 }],
    { xp: 380 },
  ),
  Q('m12', 2, 'Outpost Blackwood',
    'A research outpost sits in the trees. Its antenna is still powered - powered by something.',
    [{ type: 'reach', target: 'outpost', hint: 'Find Outpost Blackwood', x: -400, z: -1060, r: 26 }, { type: 'search', profile: 'lab', count: 2, hint: 'Search the outpost lab' }],
    { xp: 420, items: [['quest_radio_part', 1]] },
  ),
  Q('m13', 2, 'The Matriarch',
    'Crawler tracks lead to a collapsed hunting lodge. The forest has a queen, and she is not happy about the noise.',
    [{ type: 'boss', target: 'forestMatriarch', hint: 'Kill the Forest Matriarch at the hunting lodge' }],
    { xp: 1700, items: [['crossbow', 1], ['ammo_bolt', 12]], scrip: 320 }, { boss: 'forestMatriarch' }),
  Q('m14', 2, 'The Cave Network',
    'The Matriarch was guarding a way down. These tunnels were not dug by animals.',
    [{ type: 'search', profile: 'cave', count: 3, hint: 'Search the caves in the forest' }, { type: 'collect', item: 'quest_sample', count: 2, hint: 'Collect 2 mutant tissue samples' }],
    { xp: 520, items: [['med_antirad', 2]] },
  ),
  Q('m15', 2, 'Triangulation',
    'Vasily can triangulate the broadcast if you bring back the trail data from three forest markers.',
    [{ type: 'reach', target: 'tri1', hint: 'Reach the north relay', x: -520, z: -1270, r: 18 }, { type: 'reach', target: 'tri2', hint: 'Reach the east relay', x: -240, z: -1130, r: 18 }, { type: 'reach', target: 'tri3', hint: 'Reach the west relay', x: -610, z: -980, r: 18 }],
    { xp: 600, scrip: 200 },
  ),

  // ---------------- ACT IV - INDUSTRIAL SECRETS ----------------
  Q('m16', 3, 'Foundry Road',
    'The broadcast originates south, beyond the forests: the Industrial Zone. Factories that never officially existed.',
    [{ type: 'reach', target: 'industrial', hint: 'Travel to the Industrial Zone', x: -40, z: -330, r: 150 }],
    { xp: 550 },
  ),
  Q('m17', 3, 'The Iron Abomination',
    'The foundry is not empty. Something wearing machine parts has made the assembly hall its throne.',
    [{ type: 'boss', target: 'ironAbomination', hint: 'Kill the Iron Abomination in the foundry' }],
    { xp: 2000, items: [['assaultRifle', 1], ['ammo_intermediate', 60]], scrip: 420 }, { boss: 'ironAbomination' }),
  Q('m18', 3, 'Production Records',
    'The factory was building something for the army. The records survived in the manager\'s office.',
    [{ type: 'search', profile: 'police', count: 2, hint: 'Search offices in the Industrial Zone' }, { type: 'collect', item: 'quest_docs', count: 1, hint: 'Recover 1 classified document' }],
    { xp: 700, items: [['equip_vest', 1]] },
  ),
  Q('m19', 3, 'Chemical Spill',
    'The chemical plant is leaking. The pools glow at night, and things drink from them.',
    [{ type: 'kill', target: 'contaminated', count: 3, hint: 'Kill contaminated mutants' }, { type: 'collect', item: 'med_antirad', count: 2, hint: 'Find anti-radiation tablets' }],
    { xp: 760, items: [['equip_gasmask', 1]] },
  ),
  Q('m20', 3, 'Paper Trail',
    'Every document points at a facility named SUBSTRATE. The city records were moved underground.',
    [{ type: 'reach', target: 'city', hint: 'Head for the Forgotten City', x: 760, z: -260, r: 160 }],
    { xp: 800, scrip: 250 },
  ),

  // ---------------- ACT V - THE FORGOTTEN CITY ----------------
  Q('m21', 4, 'The Forgotten City',
    'Skyscrapers with no lights. An evacuation that never finished. The city is a graveyard with streets.',
    [{ type: 'reach', target: 'cityCentre', hint: 'Reach the city centre', x: 760, z: -260, r: 60 }],
    { xp: 780 },
  ),
  Q('m22', 4, 'Hospital Run',
    'Antibiotics are running out at the camp. Central Hospital still has a pharmacy wing - and a morgue.',
    [{ type: 'search', profile: 'hospital', count: 4, hint: 'Search the hospital' }, { type: 'collect', item: 'med_antidote', count: 3, hint: 'Collect 3 boxes of antibiotics' }],
    { xp: 900, items: [['med_medkit', 2]], scrip: 200 },
  ),
  Q('m23', 4, 'Line 4',
    'The city subway runs deeper than the streets. SUBSTRATE had a station there, off the maps.',
    [{ type: 'reach', target: 'subway', hint: 'Find the subway entrance', x: 460, z: -10, r: 40 }, { type: 'search', profile: 'locker', count: 2, hint: 'Search subway lockers' }],
    { xp: 950, items: [['quest_keycard', 1]] },
  ),
  Q('m24', 4, 'The Watcher in the Windows',
    'Something has been following you through the city, never closer than a rooftop. It does not attack. It watches.',
    [{ type: 'kill', target: 'watcher', count: 2, hint: 'Kill the Watchers' }, { type: 'kill', target: 'mimic', count: 2, hint: 'Kill the Mimics' }],
    { xp: 1000, items: [['med_stim', 2]] },
  ),
  Q('m25', 4, 'City Keycard',
    'A Level 3 keycard opens the military checkpoints. The police evidence lockup should have one.',
    [{ type: 'search', profile: 'safe', count: 1, hint: 'Open the police evidence safe' }, { type: 'reach', target: 'policeHQ', hint: 'Reach the police HQ', x: 1040, z: 40, r: 30 }],
    { xp: 1100, items: [['quest_keycard', 1]] },
  ),

  // ---------------- ACT VI - THE EXCLUSION ZONE ----------------
  Q('m26', 5, 'The Exclusion Zone',
    'The military sealed this place before the collapse. Now the seal is only wire and warning signs.',
    [{ type: 'reach', target: 'military', hint: 'Enter the Military Exclusion Zone', x: 430, z: 720, r: 170 }],
    { xp: 1200 },
  ),
  Q('m27', 5, 'Bunker K-9',
    'K-9 was a command bunker. Its door is still locked from the inside.',
    [{ type: 'reach', target: 'bunker', hint: 'Reach Bunker K-9', x: 430, z: 720, r: 24 }, { type: 'search', profile: 'military', count: 3, hint: 'Search the bunker supplies' }],
    { xp: 1300, items: [['ammo_intermediate', 60]] },
  ),
  Q('m28', 5, 'Facility SUBSTRATE',
    'The facility is real. The elevator still works. Someone has been maintaining it.',
    [{ type: 'search', profile: 'lab', count: 4, hint: 'Search SUBSTRATE laboratories' }, { type: 'collect', item: 'quest_docs', count: 1, hint: 'Recover SUBSTRATE documents' }],
    { xp: 1500, items: [['equip_cbrn', 1]] },
  ),
  Q('m29', 5, 'The Pale Commander',
    'The commander of the garrison never left. It wears the uniform still - and it remembers how to fight.',
    [{ type: 'boss', target: 'paleCommander', hint: 'Kill the Pale Commander' }],
    { xp: 2800, items: [['revolver', 1], ['ammo_magnum', 24]], scrip: 600 }, { boss: 'paleCommander' }),
  Q('m30', 5, 'Project Last Signal',
    'The documents name the project: LAST SIGNAL. Population reduction authorised. The signal is not a distress call - it is a lure.',
    [{ type: 'talk', target: 'Sera', hint: 'Bring the documents to Sera' }],
    { xp: 1800, scrip: 300 }, { requires: ['m28'] }),

  // ---------------- ACT VII - THE RED WASTELAND ----------------
  Q('m31', 6, 'Red Horizon',
    'The last transmission comes from beyond the Exclusion Zone: a place the maps mark only in red.',
    [{ type: 'reach', target: 'wasteland', hint: 'Cross into the Red Wasteland', x: 1130, z: 1090, r: 200 }],
    { xp: 2000 },
  ),
  Q('m32', 6, 'The Dead Forest',
    'Nothing grows here. The trees died standing, and something nests between them.',
    [{ type: 'search', profile: 'cave', count: 4, hint: 'Search the nests' }, { type: 'kill', target: 'brute', count: 2, hint: 'Kill 2 Brutes' }],
    { xp: 2200, items: [['med_antirad', 4]] },
  ),
  Q('m33', 6, 'Lake of Poison',
    'The lakes here glow. The water is not water.',
    [{ type: 'collect', item: 'quest_sample', count: 4, hint: 'Collect 4 tissue samples' }, { type: 'kill', target: 'contaminated', count: 5, hint: 'Kill 5 contaminated mutants' }],
    { xp: 2400, items: [['med_stim', 3]] },
  ),
  Q('m34', 6, 'The Contaminated Titan',
    'Something immense stands in the middle of the lake. It was a man once. Now it is a reactor with legs.',
    [{ type: 'boss', target: 'contaminatedTitan', hint: 'Kill the Contaminated Titan' }],
    { xp: 3600, items: [['equip_cbrn', 1], ['med_antirad', 3]], scrip: 700 }, { boss: 'contaminatedTitan' }),
  Q('m35', 6, 'The Source',
    'Beyond the wasteland: a reactor ruin with a signal that never stopped broadcasting.',
    [{ type: 'reach', target: 'reactor', hint: 'Reach the Reactor Ruin', x: 1270, z: 1260, r: 40 }, { type: 'collect', item: 'quest_core', count: 1, hint: 'Recover a reactor core fragment' }],
    { xp: 3000, items: [['quest_keycard', 1]] },
  ),

  // ---------------- ACT VIII - THE LAST SIGNAL ----------------
  Q('m36', 7, 'Broadcast',
    'The signal has a name. It has been repeating it for three weeks, waiting for someone to answer.',
    [{ type: 'talk', target: 'Sera', hint: 'Speak with Sera about the core' }],
    { xp: 2600 },
  ),
  Q('m37', 7, 'All the Way Down',
    'There is one place left: the reactor hall itself. The Last Signal is down there, and it knows you are coming.',
    [{ type: 'reach', target: 'reactorHall', hint: 'Descend into the reactor hall', x: 1270, z: 1260, r: 18 }],
    { xp: 3000, items: [['ammo_intermediate', 90], ['med_medkit', 3]] },
  ),
  Q('m38', 7, 'THE LAST SIGNAL',
    'Kill it. Or answer it. Either way, the broadcast ends tonight.',
    [{ type: 'boss', target: 'lastSignal', hint: 'Defeat the Last Signal' }],
    { xp: 6000, items: [['quest_signal_key', 1]], scrip: 1200 }, { boss: 'lastSignal' }),
  Q('m39', 7, 'Silence',
    'The reactor hall is quiet for the first time in three weeks. The silence is worse than the noise.',
    [{ type: 'talk', target: 'Sera', hint: 'Return to Sera' }],
    { xp: 4000, scrip: 500 },
  ),
  Q('m40', 7, 'Ashes of Humanity',
    'The camp burns its lamps low. There is a world left, and someone has to walk it. The signal is gone. You are still here.',
    [{ type: 'reach', target: 'camp', hint: 'Return to the survivor camp', x: -1010, z: -900, r: 30 }, { type: 'survive', seconds: 180, hint: 'Survive in the wasteland for 3 minutes' }],
    { xp: 5000, items: [['val_watch', 1]] }, { end: true }),
];

// ---------------------------------------------------------------------------
// Side quests (60). Template families referenced by real world systems.
// ---------------------------------------------------------------------------
const SIDE_TEMPLATES = [
  { family: 'rescue', title: 'Missing Scout', desc: 'A scout went looking for supplies and did not come back. Their radio is still warm.', objective: (x, z) => ({ type: 'reach', x, z, r: 20, hint: 'Find the scout\'s last position' }) },
  { family: 'investigate', title: 'Strange Signal', desc: 'A short burst on the emergency band, repeated every nine minutes. Source is close.', objective: (x, z) => ({ type: 'search', profile: 'electronics', count: 1, hint: 'Find the source of the signal', x, z, r: 25 }) },
  { family: 'exploration', title: 'No One Has Been Here', desc: 'A building on the old survey map. Nobody has looted it yet, as far as anyone knows.', objective: (x, z) => ({ type: 'reach', x, z, r: 18, hint: 'Reach the location' }) },
  { family: 'recovery', title: 'Family Heirloom', desc: 'A survivor wants something back from a place they cannot return to.', objective: (x, z) => ({ type: 'search', profile: 'house', count: 2, hint: 'Search the house', x, z, r: 30 }) },
  { family: 'combat', title: 'Hunt Order', desc: 'The camp is paying for corpses. Any mutant will do, but a big one pays better.', objective: (x, z) => ({ type: 'kill', target: 'hollow', count: 4, hint: 'Kill 4 mutants' }) },
  { family: 'repair', title: 'Broken Radio', desc: 'The camp relay needs parts. Circuits, mostly.', objective: (x, z) => ({ type: 'collect', item: 'electronics_circuit', count: 2, hint: 'Find 2 circuit boards', x, z, r: 30 }) },
  { family: 'gathering', title: 'Water Run', desc: 'The barrels are empty and the pump is dry. Find clean water.', objective: (x, z) => ({ type: 'collect', item: 'water_bottle', count: 4, hint: 'Collect 4 bottles of water' }) },
  { family: 'aid', title: 'Field Medicine', desc: 'A survivor is bleeding out. Bandages and antibiotics are the difference between a name and a grave.', objective: (x, z) => ({ type: 'collect', item: 'med_bandage', count: 3, hint: 'Collect 3 bandages', x, z, r: 15 }) },
  { family: 'discovery', title: 'Hidden Cache', desc: 'A scavenger left a coded note about a cache. The marker is a bent weather vane.', objective: (x, z) => ({ type: 'search', profile: 'safe', count: 1, hint: 'Open the hidden cache', x, z, r: 25 }) },
  { family: 'kill', title: 'Clean the Road', desc: 'The road is the only supply line. Something has been using it as a pantry.', objective: (x, z) => ({ type: 'kill', target: 'crawler', count: 3, hint: 'Kill 3 Crawlers' }) },
];

const SIDE_NAMES = [
  'Missing Scout', 'The Nine Minute Signal', 'The Unlooted House', 'A Photograph and a Name', 'Bounty: Hollow',
  'Relay Parts', 'Water Run', 'Field Medicine', 'The Bent Weather Vane', 'Clean the Road',
  'Crawler Tracks', 'The Locked Ward', 'Snow in the Attic', 'A Soldier\'s Watch', 'Rust and Ash',
  'The Orphan Radio', 'Bad Blood', 'The Last Bus', 'Tunnel rat', 'Fever Dream',
  'The Miller House', 'A Quiet Street', 'Noise Complaint', 'The Long Way Around', 'Concrete Garden',
  'Old Vasily\'s Debt', 'The Missing Bell', 'Grave Goods', 'A Letter Home', 'The Night Shift',
  'Burned Photo Album', 'The Cellar Door', 'Fungal Bloom', 'The Sealed Depot', 'Six Rounds',
  'The Broken Compass', 'What the River Took', 'The Surveyor\'s Map', 'The Quarantine List', 'A Child\'s Boot',
  'Static on Channel 4', 'The Dead Broadcast', 'Gas Mask Trade', 'The Rat King', 'Pale Horse',
  'Ammo Arithmetic', 'The Salt Line', 'The Ferryman', 'House of Mirrors', 'The Last Cigarette',
  'Spare Parts', 'The Deep Freeze', 'A Debt Paid', 'The Watchtower', 'Bones in the Yard',
  'The Pale Dog', 'Signal Flare', 'The Blue Door', 'The Long Silence', 'Two Graves',
];

const SIDE_SPOTS = [
  { x: -980, z: -1120, name: 'suburb' }, { x: -1120, z: -980, name: 'suburb' }, { x: -900, z: -880, name: 'suburb' },
  { x: -1150, z: -1160, name: 'suburb' }, { x: -770, z: -1030, name: 'suburb' },
  { x: -520, z: -1180, name: 'forest' }, { x: -330, z: -980, name: 'forest' }, { x: -420, z: -1270, name: 'forest' },
  { x: -250, z: -1130, name: 'forest' }, { x: -600, z: -960, name: 'forest' },
  { x: -190, z: -430, name: 'industrial' }, { x: 80, z: -280, name: 'industrial' }, { x: -120, z: -180, name: 'industrial' },
  { x: 40, z: -520, name: 'industrial' }, { x: -260, z: -300, name: 'industrial' },
  { x: 640, z: -160, name: 'city' }, { x: 880, z: -340, name: 'city' }, { x: 720, z: -470, name: 'city' },
  { x: 1000, z: -120, name: 'city' }, { x: 560, z: -360, name: 'city' }, { x: 1030, z: 30, name: 'city' },
  { x: 340, z: 620, name: 'military' }, { x: 540, z: 800, name: 'military' }, { x: 300, z: 830, name: 'military' },
  { x: 580, z: 610, name: 'military' }, { x: 430, z: 900, name: 'military' },
  { x: 1010, z: 980, name: 'wasteland' }, { x: 1240, z: 900, name: 'wasteland' }, { x: 1180, z: 1220, name: 'wasteland' },
  { x: 980, z: 1180, name: 'wasteland' }, { x: 1300, z: 1030, name: 'wasteland' },
  { x: -1040, z: -1060, name: 'suburb' }, { x: -700, z: -640, name: 'shelter' },
];

export const SIDE_QUESTS = SIDE_NAMES.map((name, i) => {
  const family = SIDE_TEMPLATES[i % SIDE_TEMPLATES.length];
  const spot = SIDE_SPOTS[i % SIDE_SPOTS.length];
  const act = spot.name === 'suburb' ? 1 : spot.name === 'forest' ? 2 : spot.name === 'industrial' ? 3 : spot.name === 'city' ? 4 : spot.name === 'military' ? 5 : 6;
  const tier = Math.min(3, Math.floor(i / 20));
  return {
    id: `s${String(i + 1).padStart(2, '0')}`,
    act,
    title: name,
    family: family.family,
    desc: family.desc,
    side: true,
    tier,
    objectives: [family.objective(spot.x, spot.z)],
    rewards: { xp: 120 + tier * 120, scrip: 25 + tier * 20, items: tier > 0 ? [['med_bandage', 2]] : [] },
    x: spot.x,
    z: spot.z,
  };
});

export class QuestSystem {
  constructor(game, world) {
    this.game = game;
    this.world = world;
    this.active = new Map(); // id -> {def, progress, complete, started}
    this.completed = new Set();
    this.failed = new Set();
    this.currentAct = 0;
    this.tracked = null;
    this.journalOpen = false;
    this.notifications = [];
    this.sideOffered = new Set();
    this.seenLoot = new Set();
    this.totalMain = MAIN_QUESTS.length;
    this.totalSide = SIDE_QUESTS.length;
  }

  allDefs() {
    return [...MAIN_QUESTS, ...SIDE_QUESTS];
  }

  def(id) {
    return MAIN_QUESTS.find((q) => q.id === id) || SIDE_QUESTS.find((q) => q.id === id) || null;
  }

  start(id, { silent = false } = {}) {
    if (this.active.has(id) || this.completed.has(id)) return null;
    const def = this.def(id);
    if (!def) return null;
    if (def.requires && !def.requires.every((r) => this.completed.has(r))) return null;
    const q = { def, progress: {}, started: performance.now(), complete: false };
    for (let i = 0; i < def.objectives.length; i++) q.progress[i] = { count: 0, done: false };
    this.active.set(id, q);
    if (!silent) {
      this.game.hud?.questToast(def.title, 'NEW OBJECTIVE');
      this.game.audio?.play('questComplete');
    }
    if (!this.tracked) this.tracked = id;
    this.currentAct = Math.max(this.currentAct, def.act);
    this.checkAutoStart();
    return q;
  }

  checkAutoStart() {
    // start the next main quest if all requirements are met and it's the next in order
    for (const def of MAIN_QUESTS) {
      if (this.active.has(def.id) || this.completed.has(def.id)) continue;
      if (def.requires && !def.requires.every((r) => this.completed.has(r))) continue;
      const idx = MAIN_QUESTS.indexOf(def);
      const prev = idx > 0 ? MAIN_QUESTS[idx - 1] : null;
      if (prev && !this.completed.has(prev.id)) continue;
      if (this.active.has(def.id)) continue;
      this.start(def.id, { silent: !!def.start });
      break;
    }
  }

  completeObjective(qid, index) {
    const q = this.active.get(qid);
    if (!q) return;
    const p = q.progress[index];
    if (!p || p.done) return;
    p.done = true;
    p.count = q.def.objectives[index].count || 1;
    this.game.audio?.play('questComplete');
    this.game.hud?.questToast(`${q.def.objectives[index].hint}`, 'OBJECTIVE COMPLETE');
    if (q.def.objectives.every((_, i) => q.progress[i].done)) this.complete(qid);
    this.game.save?.autosave('objective');
  }

  progressObjective(qid, index, amount = 1) {
    const q = this.active.get(qid);
    if (!q) return;
    const obj = q.def.objectives[index];
    const p = q.progress[index];
    if (!p || p.done) return;
    p.count = Math.min(obj.count || 1, p.count + amount);
    this.game.hud?.questProgress(qid, index, p.count, obj.count || 1);
    if (p.count >= (obj.count || 1)) {
      p.done = true;
      this.game.audio?.play('questComplete');
      if (q.def.objectives.every((_, i) => q.progress[i].done)) this.complete(qid);
    }
  }

  complete(qid) {
    const q = this.active.get(qid);
    if (!q) return;
    q.complete = true;
    this.active.delete(qid);
    this.completed.add(qid);
    const def = q.def;
    // rewards
    const r = def.rewards || {};
    if (r.xp) this.game.progression.awardXp(r.xp, def.title);
    if (r.scrip) this.game.inventory.add('val_currency', r.scrip);
    for (const [itemId, qty] of r.items || []) {
      this.game.inventory.add(itemId, qty);
    }
    this.game.hud?.questComplete(def.title, r.xp || 0);
    this.game.audio?.play('questComplete');
    this.game.save?.autosave('quest');
    // chain next
    const idx = MAIN_QUESTS.indexOf(def);
    if (idx >= 0 && MAIN_QUESTS[idx + 1]) {
      const next = MAIN_QUESTS[idx + 1];
      if (next.requires) {
        if (next.requires.every((rid) => this.completed.has(rid))) this.start(next.id);
      } else {
        this.start(next.id);
      }
    }
    if (def.boss) this.game.quests.onBossKilled?.(def.boss);
    if (def.end) {
      this.game.onCampaignComplete?.();
    }
    this.checkAutoStart();
  }

  // ---- event hooks -------------------------------------------------------
  onKill(mutantId, name) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'kill' && (o.target === mutantId || o.target === name)) this.progressObjective(qid, i, 1);
      });
    }
  }

  onBossKilled(bossId) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'boss' && o.target === bossId) this.completeObjective(qid, i);
      });
    }
  }

  onLoot(profile) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'search' && !q.progress[i].done) {
          const objProfile = o.profile;
          if (objProfile === profile || (o.profile === 'cave' && profile === 'cave') || (o.profile === 'safe' && profile === 'safe')) {
            // location check for side quests
            if (o.x !== undefined) {
              const p = this.game.player.position;
              if (Math.hypot(p.x - o.x, p.z - o.z) > (o.r || 30)) return;
            }
            this.progressObjective(qid, i, 1);
          }
        }
      });
    }
  }

  onPickup(itemId) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'collect' && o.item === itemId && !q.progress[i].done) {
          const have = this.game.inventory.count(o.item);
          if (o.x !== undefined) {
            const p = this.game.player.position;
            if (Math.hypot(p.x - o.x, p.z - o.z) > (o.r || 30)) return;
          }
          if (have >= (o.count || 1)) this.completeObjective(qid, i);
          else this.progressObjective(qid, i, 1);
        }
      });
    }
  }

  onTalk(npcName) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'talk' && o.target === npcName) this.completeObjective(qid, i);
        if (o.type === 'talk' && o.target === 'shelterRadio' && npcName === 'shelterRadio') this.completeObjective(qid, i);
      });
    }
  }

  onCraft(recipeId) {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'craft' && o.recipe === recipeId) this.progressObjective(qid, i, 1);
      });
    }
  }

  onBuild() {
    for (const [qid, q] of this.active) {
      q.def.objectives.forEach((o, i) => {
        if (o.type === 'build') this.progressObjective(qid, i, 1);
      });
    }
  }

  onLevelUp(level) {
    // side quests unlock progressively by level
    this.offerSideQuests();
  }

  offerSideQuests() {
    const level = this.game.progression.level;
    for (const q of SIDE_QUESTS) {
      if (this.sideOffered.has(q.id) || this.completed.has(q.id)) continue;
      if (q.tier > Math.floor(level / 12)) continue;
      this.sideOffered.add(q.id);
      if (q.tier <= 1) this.start(q.id);
      else this.game.hud?.notify(`New side contract available: ${q.title}`, 'quest');
    }
  }

  /** Called each frame: handles reach + survive objectives. */
  update(dt) {
    const p = this.game.player.position;
    for (const [qid, q] of [...this.active]) {
      q.def.objectives.forEach((o, i) => {
        if (q.progress[i].done) return;
        if (o.type === 'reach' && o.x !== undefined) {
          if (Math.hypot(p.x - o.x, p.z - o.z) < (o.r || 12)) {
            this.completeObjective(qid, i);
            // auto-complete matching "collect" location objectives
          }
        } else if (o.type === 'survive') {
          q.surviveTimer = (q.surviveTimer || 0) + dt;
          if (q.surviveTimer >= (o.seconds || 60)) this.completeObjective(qid, i);
        }
      });
    }
    // radio objective: proximity to shelter radio
    const radio = (this.game.radioPlaylist || [])[0];
    if (radio) {
      for (const [qid, q] of this.active) {
        q.def.objectives.forEach((o, i) => {
          if (o.type === 'talk' && o.target === 'shelterRadio' && !q.progress[i].done) {
            if (Math.hypot(p.x - radio.x, p.z - radio.z) < 3) this.completeObjective(qid, i);
          }
        });
      }
    }
    // periodic check for collect objectives already satisfied
    this.collectCheckTimer = (this.collectCheckTimer || 0) + dt;
    if (this.collectCheckTimer > 1.5) {
      this.collectCheckTimer = 0;
      for (const [qid, q] of this.active) {
        q.def.objectives.forEach((o, i) => {
          if (q.progress[i].done) return;
          if (o.type === 'collect' && this.game.inventory.count(o.item) >= (o.count || 1)) {
            if (o.x !== undefined) {
              if (Math.hypot(p.x - o.x, p.z - o.z) > (o.r || 30)) return;
            }
            this.completeObjective(qid, i);
          }
        });
      }
    }
  }

  /** Marker for the HUD compass: nearest active objective. */
  getTrackedMarker() {
    const q = this.tracked ? this.active.get(this.tracked) : null;
    const target = q || [...this.active.values()][0];
    if (!target) return null;
    for (let i = 0; i < target.def.objectives.length; i++) {
      const o = target.def.objectives[i];
      if (target.progress[i].done) continue;
      if (o.x !== undefined) return { x: o.x, z: o.z, title: o.hint || target.def.title, distance: Math.hypot(this.game.player.position.x - o.x, this.game.player.position.z - o.z) };
      if (o.type === 'talk' || o.type === 'kill') {
        // radios, NPCs, then named locations, then the nearest camp
        const radio = (this.game.radioPlaylist || []).find((r) => r.id === o.target);
        if (radio) {
          const d = Math.hypot(this.game.player.position.x - radio.x, this.game.player.position.z - radio.z);
          if (d < 120) return { x: radio.x, z: radio.z, title: o.hint || target.def.title, distance: d };
        }
        const npc = this.world.npcs?.find((n) => n.name === o.target);
        if (npc) {
          const d = Math.hypot(this.game.player.position.x - npc.position.x, this.game.player.position.z - npc.position.z);
          return { x: npc.position.x, z: npc.position.z, title: o.hint || target.def.title, distance: d };
        }
        const loc = this.world.locations.find((l) => l.name === o.target) || this.world.locations.find((l) => l.type === 'camp');
        if (loc) return { x: loc.x, z: loc.z, title: o.hint || target.def.title, distance: Math.hypot(this.game.player.position.x - loc.x, this.game.player.position.z - loc.z) };
      }
    }
    return null;
  }

  serialize() {
    return {
      active: [...this.active.entries()].map(([id, q]) => ({ id, progress: q.progress, surviveTimer: q.surviveTimer, started: q.started })),
      completed: [...this.completed],
      tracked: this.tracked,
      currentAct: this.currentAct,
      sideOffered: [...this.sideOffered],
    };
  }

  deserialize(d) {
    if (!d) return;
    this.active.clear();
    for (const a of d.active || []) {
      const def = this.def(a.id);
      if (!def) continue;
      this.active.set(a.id, { def, progress: a.progress || {}, surviveTimer: a.surviveTimer || 0, started: a.started || 0 });
    }
    this.completed = new Set(d.completed || []);
    this.tracked = d.tracked || null;
    this.currentAct = d.currentAct || 0;
    this.sideOffered = new Set(d.sideOffered || []);
  }
}
