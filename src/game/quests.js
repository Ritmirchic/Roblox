// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/quests.js — campaign (40 main quests / 8 acts), side quests,
// quest state machine, objective tracking
// ============================================================

// Objective types:
//   reach   {poi, radius}         travel to a location
//   kill    {type, count}         kill mutants of a type
//   killany {count}               kill any mutants
//   boss    {boss}                defeat a boss
//   collect {item, count}         obtain items
//   interact{poi, id}             use a world interactable
//   talk    {npc}                 speak to an NPC
//   survive {seconds}
//   explore {pois:[...]}          discover N locations
//   craft   {recipe, count}
//   build   {count}

export const ACTS = [
  { n: 1, name: 'AWAKENING', color: '#8a9a7a', desc: 'You wake up seven metres under the world with a broken flashlight and a note in your brother\'s handwriting.' },
  { n: 2, name: 'THE DEAD SUBURBS', color: '#9a8a6a', desc: 'Twelve identical streets. One of them still has people on it.' },
  { n: 3, name: 'THE FOREST SIGNAL', color: '#6a8a6a', desc: 'Blackwood swallowed the road. Something in the fog is repeating a recording of your own voice.' },
  { n: 4, name: 'INDUSTRIAL SECRETS', color: '#8a7a5a', desc: 'The foundry never stopped running. Nobody has fed it in four years.' },
  { n: 5, name: 'THE FORGOTTEN CITY', color: '#6a7a8a', desc: 'The hospital generators still hum. Somebody is keeping the lights on for a reason.' },
  { n: 6, name: 'THE EXCLUSION ZONE', color: '#6a6a6a', desc: 'Checkpoints facing inward. Orders dated after everyone was dead.' },
  { n: 7, name: 'THE RED WASTELAND', color: '#9a5a4a', desc: 'The crater is still warm. Ash falls upward on the bad nights.' },
  { n: 8, name: 'THE LAST SIGNAL', color: '#7a5a9a', desc: 'Fourteen point seven kilohertz. It has been saying your name for years.' },
];

// NOTE: kill objectives pass the mutant id as `type` in the shorthand, so it
// is renamed to `mutant` to avoid clobbering the objective type tag.
const O = (type, opts = {}) => {
  if (type === 'kill' && opts.type) {
    const { type: mutant, ...rest } = opts;
    return { type: 'kill', mutant, ...rest };
  }
  return { type, ...opts };
};
const R = (xp, items = {}, money = 0, extra = {}) => ({ xp, items, money, ...extra });

export const MAIN_QUESTS = [
  // ---------------- ACT 1: AWAKENING ----------------
  {
    id: 'm01', act: 1, name: 'Cold Start', giver: null,
    desc: 'The shelter is dark and the air is stale. Find a working light and understand where you are.',
    objectives: [O('interact', { id: 'shelter_locker', desc: 'Search the shelter lockers' }), O('interact', { id: 'shelter_console', desc: 'Read the radio console' })],
    rewards: R(120, { battery: 2, bandage: 2, water_bottle: 1 }),
    onComplete: 'The radio speaks in your brother\'s voice. It has been broadcasting for six years.',
  },
  {
    id: 'm02', act: 1, name: 'The Note', giver: null,
    desc: 'There is a note pinned to the bunk above yours. Read it.',
    objectives: [O('interact', { id: 'shelter_note', desc: 'Read Mikhail\'s note' })],
    prereq: ['m01'], rewards: R(150, { knife: 1, crackers: 2 }),
  },
  {
    id: 'm03', act: 1, name: 'Seven Metres Up', giver: null,
    desc: 'The stairwell leads to a surface hatch. Get out of Shelter 12.',
    objectives: [O('reach', { poi: 'sub_shelter', desc: 'Reach the surface hatch' })],
    prereq: ['m02'], rewards: R(200, { flashlight: 1 }),
  },
  {
    id: 'm04', act: 1, name: 'First Light', giver: null,
    desc: 'The suburbs stretch out under a grey sky. Find the nearest sign of people.',
    objectives: [O('explore', { pois: ['sub_camp', 'sub_school'], desc: 'Discover the camp and the school' })],
    prereq: ['m03'], rewards: R(260, { water_bottle: 2, jerky: 2 }),
  },
  {
    id: 'm05', act: 1, name: 'Anything That Breathes', giver: null,
    desc: 'Something is moving between the houses. Deal with it before it deals with you.',
    objectives: [O('killany', { count: 3, desc: 'Kill 3 mutants' })],
    prereq: ['m04'], rewards: R(320, { ammo_9mm: 12, pistol: 1 }, 40),
  },

  // ---------------- ACT 2: THE DEAD SUBURBS ----------------
  {
    id: 'm06', act: 2, name: 'Hollow Street', giver: 'nika',
    desc: 'Nika runs the camp on Hollow Street. She wants to know what you are before she lets you inside.',
    objectives: [O('talk', { npc: 'nika', desc: 'Speak with Nika Volkova' })],
    prereq: ['m05'], rewards: R(300, {}, 60),
  },
  {
    id: 'm07', act: 2, name: 'Water Runs', giver: 'nika',
    desc: 'The camp pump is dry and the crawlers nest in the school basement. Nika needs the valve turned at Ravenwood Elementary.',
    objectives: [O('reach', { poi: 'sub_school', desc: 'Enter Ravenwood Elementary' }),
      O('kill', { type: 'crawler', count: 4, desc: 'Clear the crawlers from the basement' }),
      O('interact', { id: 'school_valve', desc: 'Turn the water valve' })],
    prereq: ['m06'], rewards: R(420, { water_purified: 3 }, 90),
  },
  {
    id: 'm08', act: 2, name: 'The Scavenger\'s Debt', giver: 'nika',
    desc: 'A scavenger named Doran never came back from the Hollis fuel station. Nika wants him found — or his pack.',
    objectives: [O('reach', { poi: 'sub_gas', desc: 'Search the fuel station' }), O('collect', { item: 'dogtag', count: 1, desc: 'Find Doran\'s dog tags' })],
    prereq: ['m07'], rewards: R(380, { backpack_small: 1, ammo_9mm: 18 }, 120),
  },
  {
    id: 'm09', act: 2, name: 'The Choir', giver: null,
    desc: 'Nika says the Hollow gather in the old church at night, and that something down there has been organising them.',
    objectives: [O('reach', { poi: 'sub_church', desc: 'Enter St. Agnes Church' }), O('kill', { type: 'hollow', count: 5, desc: 'Survive the congregation' })],
    prereq: ['m08'], rewards: R(600, { medkit: 2, ammo_12g: 8 }, 200),
  },
  {
    id: 'm10', act: 2, name: 'THE HOLLOW KING', giver: null,
    desc: 'It wears a crown of jawbones and it knows the sound of your breathing.',
    objectives: [O('boss', { boss: 'hollow_king', desc: 'Defeat the Hollow King' })],
    prereq: ['m09'], rewards: R(1400, { warden_coat: 1, signal_core: 1, medkit: 2 }, 500),
    onComplete: 'The crown comes apart in your hands. The signal gets louder.',
  },

  // ---------------- ACT 3: THE FOREST SIGNAL ----------------
  {
    id: 'm11', act: 3, name: 'Blackwood', giver: null,
    desc: 'The forest north of the highway is the shortest route to the signal source. It is also where the recordings come from.',
    objectives: [O('reach', { poi: 'for_cabin', desc: 'Find the hunter\'s cabin' }), O('kill', { type: 'stalker', count: 2, desc: 'Kill 2 Stalkers' })],
    prereq: ['m10'], rewards: R(700, { hunting_rifle: 1, ammo_762: 15 }, 150),
  },
  {
    id: 'm12', act: 3, name: 'Research Post', giver: 'anders',
    desc: 'Doctor Anders survived in the Blackwood research post. He has been recording the signal for years.',
    objectives: [O('talk', { npc: 'anders', desc: 'Speak with Doctor Anders' })],
    prereq: ['m11'], rewards: R(500, { geiger: 1, antirad: 2 }, 80),
  },
  {
    id: 'm13', act: 3, name: 'The Recordings', giver: 'anders',
    desc: 'Three tape reels are buried in the mine adit. Anders needs them to decode the signal.',
    objectives: [O('reach', { poi: 'for_tunnel', desc: 'Enter Mine Adit 4' }), O('collect', { item: 'record_tape', count: 3, desc: 'Recover 3 tape reels' })],
    prereq: ['m12'], rewards: R(650, { electronics: 2, filter: 2 }, 120),
  },
  {
    id: 'm14', act: 3, name: 'The Nest', giver: 'anders',
    desc: 'The tapes are covered in web. Something is breeding in the low ground and it does not want the reels leaving.',
    objectives: [O('reach', { poi: 'for_nest', desc: 'Reach the nest clearing' }), O('kill', { type: 'crawler', count: 6, desc: 'Kill 6 brood crawlers' })],
    prereq: ['m13'], rewards: R(800, { medkit: 3, stim_combat: 2 }, 200),
  },
  {
    id: 'm15', act: 3, name: 'THE FOREST MATRIARCH', giver: null,
    desc: 'She was here before the forest. Everything in the nest is hers.',
    objectives: [O('boss', { boss: 'forest_matriarch', desc: 'Defeat the Forest Matriarch' })],
    prereq: ['m14'], rewards: R(1800, { crossbow: 1, ammo_bolt: 12, warden_coat: 1 }, 600),
    onComplete: 'Anders decodes the tapes: a voice repeating coordinates. The coordinates are the foundry.',
  },

  // ---------------- ACT 4: INDUSTRIAL SECRETS ----------------
  {
    id: 'm16', act: 4, name: 'Down the Line', giver: null,
    desc: 'The foundry is still running. Somebody is feeding it.',
    objectives: [O('reach', { poi: 'ind_depot', desc: 'Reach the rail depot' }), O('reach', { poi: 'ind_camp', desc: 'Find the scrapper camp' })],
    prereq: ['m15'], rewards: R(700, { gasmask: 1, filter: 2 }, 150),
  },
  {
    id: 'm17', act: 4, name: 'Scrappers', giver: null,
    desc: 'The scrappers trade in machine parts. They want the power plant unlocked before they talk.',
    objectives: [O('reach', { poi: 'ind_power', desc: 'Reach Kolmogor Power Plant' }), O('kill', { type: 'brute', count: 1, desc: 'Kill a Brute inside the plant' })],
    prereq: ['m16'], rewards: R(850, { ammo_762: 20, duct_tape: 3 }, 180),
  },
  {
    id: 'm18', act: 4, name: 'Cooling Towers', giver: null,
    desc: 'The plant runs on something that is not diesel. The towers vent green.',
    objectives: [O('collect', { item: 'artifact_shard', count: 2, desc: 'Recover 2 resonance shards' }), O('reach', { poi: 'ind_warehouse', desc: 'Search Warehouse 12' })],
    prereq: ['m17'], rewards: R(900, { hazmat_suit: 1, antirad: 3 }, 260),
  },
  {
    id: 'm19', act: 4, name: 'The Forge Wakes', giver: null,
    desc: 'The foundry pit answers to a machine that grew arms.',
    objectives: [O('reach', { poi: 'ind_foundry', desc: 'Enter the foundry pit' }), O('kill', { type: 'brute', count: 3, desc: 'Kill 3 Brutes' })],
    prereq: ['m18'], rewards: R(1200, { ammo_12g: 16, medkit: 2 }, 300),
  },
  {
    id: 'm20', act: 4, name: 'THE IRON ABOMINATION', giver: null,
    desc: 'A forging machine that grew hungry, then grew arms.',
    objectives: [O('boss', { boss: 'iron_abomination', desc: 'Defeat the Iron Abomination' })],
    prereq: ['m19'], rewards: R(2400, { assault_rifle: 1, ammo_762: 40, kevlar_vest: 1 }, 900),
    onComplete: 'Inside its chest: a Warden badge, still warm. The signal points south. The city.',
  },

  // ---------------- ACT 5: THE FORGOTTEN CITY ----------------
  {
    id: 'm21', act: 5, name: 'Street Level', giver: null,
    desc: 'Six floors of apartments and nobody in them. The hospital lights are on.',
    objectives: [O('reach', { poi: 'city_market', desc: 'Reach Vostok Supermarket' }), O('reach', { poi: 'city_school', desc: 'Search Kirov Secondary' })],
    prereq: ['m20'], rewards: R(900, { canned_food: 4, water_purified: 4 }, 200),
  },
  {
    id: 'm22', act: 5, name: 'Precinct 9', giver: null,
    desc: 'The police station has the city\'s last working radio. And its last working lockers.',
    objectives: [O('reach', { poi: 'city_police', desc: 'Enter Precinct 9' }), O('collect', { item: 'keycard', count: 1, desc: 'Find a ZONE keycard' })],
    prereq: ['m21'], rewards: R(950, { revolver: 1, ammo_38: 18 }, 250),
  },
  {
    id: 'm23', act: 5, name: 'St. Agnes General', giver: 'yelena',
    desc: 'Yelena has held the hospital for three weeks. She is not a doctor. She is a radio operator, and she has been listening.',
    objectives: [O('talk', { npc: 'yelena', desc: 'Speak with Yelena' })],
    prereq: ['m22'], rewards: R(800, { medkit: 3, antibiotics: 2 }, 150),
  },
  {
    id: 'm24', act: 5, name: 'The Sixth Floor', giver: 'yelena',
    desc: 'The generator on the sixth floor needs fuel. The stairwell is not empty.',
    objectives: [O('reach', { poi: 'city_hospital', desc: 'Reach the hospital roof' }), O('collect', { item: 'fuel', count: 2, desc: 'Deliver 2 fuel canisters' }), O('kill', { type: 'screamer', count: 2, desc: 'Silence 2 Screamers' })],
    prereq: ['m23'], rewards: R(1100, { ammo_762: 30, stim_combat: 2 }, 300),
  },
  {
    id: 'm25', act: 5, name: 'Metro Line 2', giver: 'yelena',
    desc: 'The subway tunnels run under the exclusion zone wall. Yelena knows a way through.',
    objectives: [O('reach', { poi: 'city_subway', desc: 'Enter Metro Line 2' }), O('kill', { type: 'burrower', count: 3, desc: 'Kill 3 Burrowers in the tunnels' })],
    prereq: ['m24'], rewards: R(1300, { flashlight_hd: 1, ammo_bolt: 10 }, 300),
  },

  // ---------------- ACT 6: THE EXCLUSION ZONE ----------------
  {
    id: 'm26', act: 6, name: 'Facing Inward', giver: null,
    desc: 'Every checkpoint on the perimeter faces the wrong way. Whatever they were keeping out, they failed.',
    objectives: [O('reach', { poi: 'mil_camp', desc: 'Reach Forward Post Delta' }), O('kill', { type: 'hollow', count: 8, desc: 'Clear 8 Hollow at the perimeter' })],
    prereq: ['m25'], rewards: R(1400, { kevlar_vest: 1, medkit: 2 }, 350),
  },
  {
    id: 'm27', act: 6, name: 'Kravchuk', giver: 'kravchuk',
    desc: 'Sergeant Kravchuk has been holding the armory for four years. He still takes orders from a commander who no longer exists.',
    objectives: [O('talk', { npc: 'kravchuk', desc: 'Speak with Sergeant Kravchuk' })],
    prereq: ['m26'], rewards: R(1000, { dogtag: 3, ammo_12g: 20 }, 200),
  },
  {
    id: 'm28', act: 6, name: 'Orders Dated After', giver: 'kravchuk',
    desc: 'Kravchuk needs the last written order, sealed in Barracks C. It is dated eleven months after the evacuation.',
    objectives: [O('reach', { poi: 'mil_barracks', desc: 'Search Barracks C' }), O('collect', { item: 'record_tape', count: 2, desc: 'Recover 2 order tapes' })],
    prereq: ['m27'], rewards: R(1500, { assault_rifle: 1, ammo_762: 45 }, 400),
  },
  {
    id: 'm29', act: 6, name: 'Biolab K-9', giver: 'kravchuk',
    desc: 'The lab under the armory is where the Warden programme started. It never closed.',
    objectives: [O('reach', { poi: 'mil_lab', desc: 'Enter Biolab K-9' }), O('kill', { type: 'stalker', count: 3, desc: 'Kill 3 Stalkers in the lab' }), O('collect', { item: 'green_badge', count: 1, desc: 'Take a Warden badge' })],
    prereq: ['m28'], rewards: R(1700, { antibiotics: 3, electronics: 3 }, 450),
  },
  {
    id: 'm30', act: 6, name: 'THE PALE COMMANDER', giver: null,
    desc: 'Someone signed orders here once. Then kept signing them.',
    objectives: [O('boss', { boss: 'pale_commander', desc: 'Defeat the Pale Commander' })],
    prereq: ['m29'], rewards: R(3200, { hazmat_suit: 1, warden_coat: 1, ammo_762: 60 }, 1200),
    onComplete: 'His last order reads: CONTINUE BROADCAST. DO NOT ANSWER THEM.',
  },

  // ---------------- ACT 7: THE RED WASTELAND ----------------
  {
    id: 'm31', act: 7, name: 'Ash Country', giver: null,
    desc: 'Beyond the wall the ground is red and the air tastes of copper.',
    objectives: [O('reach', { poi: 'was_camp', desc: 'Find the Ash Nomads' }), O('kill', { type: 'contaminated', count: 3, desc: 'Kill 3 Contaminated' })],
    prereq: ['m30'], rewards: R(1600, { antirad: 4, filter: 3 }, 400),
  },
  {
    id: 'm32', act: 7, name: 'Mother Ash', giver: 'mother_ash',
    desc: 'The nomad elder knows what the crater is. She wants her granddaughter\'s shard returned first.',
    objectives: [O('talk', { npc: 'mother_ash', desc: 'Speak with Mother Ash' }), O('collect', { item: 'artifact_shard', count: 3, desc: 'Return 3 shards to the nomads' })],
    prereq: ['m31'], rewards: R(1800, { hazmat_suit: 1, stim_combat: 3 }, 500),
  },
  {
    id: 'm33', act: 7, name: 'Mirror Lake', giver: 'mother_ash',
    desc: 'The lake is not water. The nomads wash their dead in it and then cannot remember their names.',
    objectives: [O('reach', { poi: 'was_lake', desc: 'Reach Mirror Lake' }), O('kill', { type: 'pale', count: 1, desc: 'Kill a Pale One' })],
    prereq: ['m32'], rewards: R(2100, { medkit: 4, ammo_bolt: 15 }, 600),
  },
  {
    id: 'm34', act: 7, name: 'Excavation Site 9', giver: 'mother_ash',
    desc: 'Someone has been digging in the red ground for a long time. The hole is deeper than the crater.',
    objectives: [O('reach', { poi: 'was_dig', desc: 'Descend into Excavation Site 9' }), O('collect', { item: 'signal_core', count: 1, desc: 'Recover a signal core' })],
    prereq: ['m33'], rewards: R(2400, { ammo_762: 50, electronics: 4 }, 700),
  },
  {
    id: 'm35', act: 7, name: 'THE CONTAMINATED TITAN', giver: null,
    desc: 'A cooling tower that stood in the wrong place on the wrong day.',
    objectives: [O('boss', { boss: 'contaminated_titan', desc: 'Defeat the Contaminated Titan' })],
    prereq: ['m34'], rewards: R(4000, { hazmat_suit: 1, antirad: 6, ammo_762: 60 }, 1500),
    onComplete: 'It falls in slow motion and the ash stops falling. The array is awake.',
  },

  // ---------------- ACT 8: THE LAST SIGNAL ----------------
  {
    id: 'm36', act: 8, name: 'The Array', giver: null,
    desc: 'Eight pylons, one core, and a hum you can feel in your teeth.',
    objectives: [O('reach', { poi: 'was_array', desc: 'Reach the Signal Array' }), O('interact', { id: 'array_console', desc: 'Access the array console' })],
    prereq: ['m35'], rewards: R(2600, { medkit: 4, stim_combat: 4 }, 800),
  },
  {
    id: 'm37', act: 8, name: 'Fourteen Point Seven', giver: null,
    desc: 'The console wants a signal core. It is very polite about it.',
    objectives: [O('collect', { item: 'signal_core', count: 1, desc: 'Insert a signal core' }), O('kill', { type: 'watcher', count: 3, desc: 'Hold the array against the Watchers' })],
    prereq: ['m36'], rewards: R(3000, { ammo_762: 60, ammo_12g: 24 }, 900),
  },
  {
    id: 'm38', act: 8, name: 'The Voice', giver: null,
    desc: 'It is not a recording. It has been answering you since the shelter.',
    objectives: [O('talk', { npc: 'signal', desc: 'Answer the signal' })],
    prereq: ['m37'], rewards: R(3200, {}, 0),
  },
  {
    id: 'm39', act: 8, name: 'Hold the Line', giver: null,
    desc: 'Everything in the wasteland heard the array wake up. Buy Yelena time to shut it down.',
    objectives: [O('killany', { count: 12, desc: 'Survive the swarm (12 kills)' }), O('survive', { seconds: 180, desc: 'Hold the array for 3 minutes' })],
    prereq: ['m38'], rewards: R(3800, { medkit: 5, stim_combat: 4 }, 1200),
  },
  {
    id: 'm40', act: 8, name: 'THE LAST SIGNAL', giver: null,
    desc: 'It is not a creature. It is the broadcast that kept everyone listening.',
    objectives: [O('boss', { boss: 'last_signal', desc: 'End the Last Signal' })],
    prereq: ['m39'], rewards: R(9000, {}, 5000),
    onComplete: 'The silence afterwards is the loudest thing you have ever heard. Then, quietly, the radio clicks on again.',
    finale: true,
  },
];

// ------------------------------------------------------------------
// SIDE QUESTS — varied objectives, no repeated fetch chains
// ------------------------------------------------------------------
export const SIDE_QUESTS = [
  { id: 's01', name: 'Still Warm', giver: null, poi: 'sub_camp', desc: 'Someone died beside the camp fire recently. Find what they were carrying.', objectives: [O('collect', { item: 'dogtag', count: 2 })], rewards: R(260, { medkit: 1 }, 60) },
  { id: 's02', name: 'The Missing Neighbour', giver: 'nika', poi: 'sub_camp', desc: 'The Kovalchuks never came out of their house. Nika wants to know why.', objectives: [O('explore', { pois: ['sub_school'] }), O('collect', { item: 'record_tape', count: 1 })], rewards: R(300, { cloth: 4 }, 80) },
  { id: 's03', name: 'Rat King', giver: null, poi: 'sub_gas', desc: 'The fuel station cellar is a crawler nest.', objectives: [O('kill', { type: 'crawler', count: 5 })], rewards: R(340, { ammo_9mm: 20 }, 90) },
  { id: 's04', name: 'Quiet Hours', giver: null, poi: 'sub_school', desc: 'The school lights turn on at night. Nobody knows who does it.', objectives: [O('survive', { seconds: 120 }), O('killany', { count: 4 })], rewards: R(400, { battery: 3 }, 100) },
  { id: 's05', name: 'Home Movies', giver: null, poi: 'sub_school', desc: 'A projector still runs in the auditorium, showing the same reel.', objectives: [O('interact', { id: 'projector' })], rewards: R(220, { electronics: 1 }, 50) },
  { id: 's06', name: 'Woodcutter', giver: null, poi: 'for_cabin', desc: 'The hunter left traps in the trees. Some still have things in them.', objectives: [O('collect', { item: 'cloth', count: 6 }), O('kill', { type: 'stalker', count: 1 })], rewards: R(420, { hunting_rifle: 1, ammo_762: 10 }, 120) },
  { id: 's07', name: 'Deep Roots', giver: null, poi: 'for_tunnel', desc: 'Something is growing in the adit that is not a mushroom.', objectives: [O('reach', { poi: 'for_tunnel' }), O('kill', { type: 'burrower', count: 3 })], rewards: R(480, { mushrooms: 5, antirad: 2 }, 130) },
  { id: 's08', name: 'Missing Reel', giver: 'anders', poi: 'for_outpost', desc: 'Anders misplaced a reel somewhere he will not talk about.', objectives: [O('kill', { type: 'mimic', count: 2 }), O('collect', { item: 'record_tape', count: 1 })], rewards: R(520, { electronics: 2 }, 140) },
  { id: 's09', name: 'Fog Line', giver: null, poi: 'for_outpost', desc: 'Mark the fog valley boundary with lamps so people stop walking into it.', objectives: [O('explore', { pois: ['for_cabin', 'for_tunnel'] })], rewards: R(360, { battery: 4 }, 90) },
  { id: 's10', name: 'The Wardens\' Cache', giver: null, poi: 'for_outpost', desc: 'A warden supply drop fell in the forest. The local mutants found it first.', objectives: [O('collect', { item: 'green_badge', count: 1 }), O('killany', { count: 6 })], rewards: R(700, { ammo_762: 25, medkit: 2 }, 200) },
  { id: 's11', name: 'Rust Line', giver: null, poi: 'ind_depot', desc: 'Get the rail yard crane running again so the scrappers can move freight.', objectives: [O('collect', { item: 'fuel', count: 1 }), O('interact', { id: 'crane_panel' })], rewards: R(520, { scrap: 8 }, 150) },
  { id: 's12', name: 'Tank Farm Sweep', giver: null, poi: 'ind_power', desc: 'Scrappers want the tank farm cleared before they siphon it.', objectives: [O('kill', { type: 'hollow', count: 6 }), O('kill', { type: 'brute', count: 1 })], rewards: R(700, { gunpowder: 6 }, 200) },
  { id: 's13', name: 'Green Water', giver: null, poi: 'ind_power', desc: 'Collect a contaminated sample without dying of it.', objectives: [O('collect', { item: 'chemicals', count: 3 })], rewards: R(480, { antirad: 2 }, 130) },
  { id: 's14', name: 'Breaker Box', giver: null, poi: 'ind_warehouse', desc: 'Restore power to Warehouse 12.', objectives: [O('interact', { id: 'warehouse_breaker' }), O('kill', { type: 'screamer', count: 1 })], rewards: R(640, { electronics: 3 }, 180) },
  { id: 's15', name: 'Missing Crew', giver: null, poi: 'ind_camp', desc: 'Three scrappers went into the foundry. Their tags are still in there.', objectives: [O('collect', { item: 'dogtag', count: 3 })], rewards: R(560, { ammo_12g: 12 }, 160) },
  { id: 's16', name: 'Chimney Watch', giver: null, poi: 'ind_foundry', desc: 'The chimney vents at night. Something climbs it.', objectives: [O('survive', { seconds: 90 }), O('kill', { type: 'stalker', count: 2 })], rewards: R(800, { stim_combat: 2 }, 220) },
  { id: 's17', name: 'Curfew', giver: 'yelena', poi: 'city_hospital', desc: 'Yelena needs the hospital doors barred before dark.', objectives: [O('interact', { id: 'hospital_barricade' }), O('killany', { count: 5 })], rewards: R(700, { medkit: 2 }, 180) },
  { id: 's18', name: 'Pharmacy Run', giver: 'yelena', poi: 'city_market', desc: 'Antibiotics are worth more than bullets in the city.', objectives: [O('collect', { item: 'antibiotics', count: 2 })], rewards: R(620, { painkillers: 4 }, 200) },
  { id: 's19', name: 'Precinct Ledger', giver: null, poi: 'city_police', desc: 'The precinct ledger names every Warden in the city. Only one is still alive.', objectives: [O('collect', { item: 'record_tape', count: 2 }), O('reach', { poi: 'city_police' })], rewards: R(660, { ammo_9mm: 30 }, 190) },
  { id: 's20', name: 'Elevator Shaft', giver: null, poi: 'city_hospital', desc: 'The roof cache is only reachable from the shaft.', objectives: [O('reach', { poi: 'city_hospital' }), O('kill', { type: 'pale', count: 1 })], rewards: R(1100, { medkit: 3, artifact_shard: 1 }, 300) },
  { id: 's21', name: 'Tunnel Rats', giver: null, poi: 'city_subway', desc: 'Clear Metro Line 2 for a supply run.', objectives: [O('kill', { type: 'burrower', count: 4 })], rewards: R(900, { ammo_bolt: 12 }, 260) },
  { id: 's22', name: 'Apartment 4B', giver: null, poi: 'city_school', desc: 'Someone locked apartment 4B from the inside. Take the hinges off.', objectives: [O('reach', { poi: 'city_school' }), O('collect', { item: 'keycard', count: 1 })], rewards: R(520, { medkit: 1, cloth: 5 }, 150) },
  { id: 's23', name: 'Overpass Nest', giver: null, poi: 'city_camp', desc: 'Crawlers have taken the overpass. The camp needs the route.', objectives: [O('kill', { type: 'crawler', count: 8 })], rewards: R(760, { ammo_9mm: 25 }, 210) },
  { id: 's24', name: 'Rooftop Garden', giver: null, poi: 'city_camp', desc: 'Help the camp expand the garden before winter.', objectives: [O('build', { count: 3 })], rewards: R(480, { canned_food: 4 }, 130) },
  { id: 's25', name: 'Dying Light', giver: null, poi: 'mil_camp', desc: 'Kravchuk\'s lamp outside the post needs a battery and a spine.', objectives: [O('collect', { item: 'battery', count: 2 }), O('interact', { id: 'delta_lamp' })], rewards: R(420, { filter: 2 }, 110) },
  { id: 's26', name: 'Wire Cutters', giver: 'kravchuk', poi: 'mil_camp', desc: 'Cut the old perimeter wire so refugees can pass.', objectives: [O('interact', { id: 'perimeter_cut' }), O('kill', { type: 'hollow', count: 4 })], rewards: R(660, { ammo_9mm: 20 }, 180) },
  { id: 's27', name: 'Armory Sweep', giver: 'kravchuk', poi: 'mil_armory', desc: 'Something got into Armory 4. Clear it quietly.', objectives: [O('kill', { type: 'stalker', count: 2 }), O('reach', { poi: 'mil_armory' })], rewards: R(900, { ammo_762: 30 }, 260) },
  { id: 's28', name: 'Deaddrop', giver: null, poi: 'mil_depot', desc: 'A Warden deaddrop is still in supply depot 3.', objectives: [O('collect', { item: 'artifact_shard', count: 2 }), O('killany', { count: 5 })], rewards: R(1000, { stim_combat: 3 }, 300) },
  { id: 's29', name: 'Cold Storage', giver: null, poi: 'mil_lab', desc: 'The lab freezer still has samples. Anders will pay for one.', objectives: [O('collect', { item: 'chemicals', count: 4 })], rewards: R(880, { antirad: 3 }, 260) },
  { id: 's30', name: 'Kravchuk\'s Last Round', giver: 'kravchuk', poi: 'mil_barracks', desc: 'He wants his service revolver back from the barracks.', objectives: [O('collect', { item: 'revolver', count: 1 })], rewards: R(760, { ammo_38: 24 }, 220) },
  { id: 's31', name: 'Ash Walk', giver: null, poi: 'was_camp', desc: 'Walk the nomad route and come back able to describe it.', objectives: [O('explore', { pois: ['was_camp', 'was_lake', 'was_dig'] })], rewards: R(900, { antirad: 3 }, 240) },
  { id: 's32', name: 'Shard Tithe', giver: 'mother_ash', poi: 'was_camp', desc: 'The nomads tithe shards to the lake. Collect three without waking it.', objectives: [O('collect', { item: 'artifact_shard', count: 3 })], rewards: R(1100, { hazmat_suit: 1 }, 320) },
  { id: 's33', name: 'Bone Garden', giver: null, poi: 'was_lake', desc: 'Clear the mutant nests around Mirror Lake.', objectives: [O('kill', { type: 'contaminated', count: 2 }), O('kill', { type: 'crawler', count: 4 })], rewards: R(1200, { medkit: 3 }, 340) },
  { id: 's34', name: 'The Digger\'s Tool', giver: null, poi: 'was_dig', desc: 'The excavator\'s control chip is in the crater rim.', objectives: [O('collect', { item: 'electronics', count: 3 }), O('reach', { poi: 'was_crater' })], rewards: R(1300, { electronics: 4 }, 360) },
  { id: 's35', name: 'Night Soil', giver: null, poi: 'was_camp', desc: 'The nomads say the Pale One takes one of them every night.', objectives: [O('kill', { type: 'pale', count: 2 })], rewards: R(1600, { ammo_bolt: 15 }, 420) },
  { id: 's36', name: 'Craft Work', giver: null, poi: 'sub_camp', desc: 'The camp always needs bandages.', objectives: [O('craft', { count: 4 })], rewards: R(280, { cloth: 6 }, 80) },
  { id: 's37', name: 'Sandbag Line', giver: null, poi: 'mil_camp', desc: 'Build defensive cover at Forward Post Delta.', objectives: [O('build', { count: 2 })], rewards: R(520, { duct_tape: 3 }, 140) },
  { id: 's38', name: 'Long Dark', giver: null, poi: 'for_cabin', desc: 'Survive a night in the forest without turning on a light.', objectives: [O('survive', { seconds: 240 })], rewards: R(1000, { stim_combat: 2 }, 300) },
  { id: 's39', name: 'Gear Check', giver: null, poi: 'ind_camp', desc: 'The scrappers want a serviceable rifle.', objectives: [O('craft', { count: 1 }), O('collect', { item: 'gunpowder', count: 3 })], rewards: R(640, { ammo_762: 20 }, 180) },
  { id: 's40', name: 'Sixteen Names', giver: null, poi: 'sub_school', desc: 'The school memorial lists sixteen names. Two are not children.', objectives: [O('collect', { item: 'dogtag', count: 4 })], rewards: R(700, { medkit: 2 }, 200) },
  { id: 's41', name: 'Signal Bleed', giver: null, poi: 'was_array', desc: 'The array leaks signal into everything nearby. Find the source of the interference.', objectives: [O('reach', { poi: 'was_array' }), O('kill', { type: 'watcher', count: 2 })], rewards: R(1800, { antirad: 4 }, 500) },
  { id: 's42', name: 'The Warden Who Left', giver: null, poi: 'mil_lab', desc: 'One Warden resigned. His letter is in the lab archive.', objectives: [O('collect', { item: 'record_tape', count: 3 })], rewards: R(1400, { electronics: 3 }, 400) },
  { id: 's43', name: 'Shelter Twelve', giver: null, poi: 'sub_shelter', desc: 'Return to where you woke up and read the last log entry.', objectives: [O('interact', { id: 'shelter_console' }), O('reach', { poi: 'sub_shelter' })], rewards: R(500, { battery: 2 }, 120) },
  { id: 's44', name: 'No One Comes Back', giver: null, poi: 'ind_foundry', desc: 'Kill three Brutes without dying once.', objectives: [O('kill', { type: 'brute', count: 3 })], rewards: R(1500, { kevlar_vest: 1 }, 450) },
  { id: 's45', name: 'Hold the Light', giver: null, poi: 'city_camp', desc: 'Keep the rooftop beacon lit through a storm.', objectives: [O('survive', { seconds: 300 }), O('build', { count: 1 })], rewards: R(900, { fuel: 1 }, 260) },
];

export const ALL_QUESTS = [...MAIN_QUESTS, ...SIDE_QUESTS];

// ------------------------------------------------------------------
export class QuestLog {
  constructor(game) {
    this.game = game;
    this.state = {}; // id -> {status:'active'|'done'|'failed', progress:[]}
    this.flags = {};
    this.tracked = null;
    this.completedCount = 0;
    this.surviveTimers = {};
  }

  get quests() { return ALL_QUESTS; }
  def(id) { return ALL_QUESTS.find((q) => q.id === id); }
  status(id) { return this.state[id]?.status || 'locked'; }
  isActive(id) { return this.status(id) === 'active'; }
  isDone(id) { return this.status(id) === 'done'; }

  canStart(id) {
    const q = this.def(id);
    if (!q) return false;
    if (this.state[id]) return false;
    if (q.prereq) for (const p of q.prereq) if (!this.isDone(p)) return false;
    return true;
  }

  start(id) {
    if (!this.canStart(id)) return false;
    const q = this.def(id);
    this.state[id] = { status: 'active', progress: q.objectives.map(() => 0), startedAt: this.game.time };
    if (!this.tracked) this.tracked = id;
    this.game.ui.notifyQuest(`New ${q.act ? 'objective' : 'task'}: ${q.name}`, q.desc);
    this.game.audio.questUpdate();
    this.game.ui.refreshJournal();
    return true;
  }

  complete(id) {
    const q = this.def(id);
    if (!q || !this.state[id]) return;
    this.state[id].status = 'done';
    this.completedCount++;
    // rewards
    const rw = q.rewards || {};
    if (rw.xp) this.game.giveXP(rw.xp, 'quest');
    if (rw.money) this.game.inventory.gold += rw.money;
    if (rw.items) for (const [k, v] of Object.entries(rw.items)) this.game.inventory.add(k, v);
    this.game.ui.notifyQuest(`Objective complete: ${q.name}`, q.onComplete || '');
    this.game.audio.questUpdate();
    if (q.finale) this.game.onFinale();
    // main story continues on its own; side tasks must be picked up by hand
    if (q.act) {
      const next = this.nextAvailableMain();
      if (next && next.id !== id) {
        this.start(next.id);
        if (this.tracked === id) this.tracked = next.id;
      }
    } else if (this.tracked === id) {
      const next = this.nextAvailableMain();
      this.tracked = next ? next.id : null;
    }
    this.game.ui.refreshJournal();
    this.game.saveGame(true);
  }

  nextAvailableMain() {
    return MAIN_QUESTS.find((q) => this.canStart(q.id));
  }

  progress(id, objIndex, amount = 1, absolute = false) {
    const st = this.state[id];
    if (!st || st.status !== 'active') return;
    const q = this.def(id);
    const obj = q.objectives[objIndex];
    if (!obj) return;
    const before = st.progress[objIndex];
    const target = obj.count || 1;
    st.progress[objIndex] = absolute ? Math.min(target, amount) : Math.min(target, before + amount);
    if (st.progress[objIndex] !== before) {
      if (obj.desc) this.game.ui.notifyObjective(q.name, obj.desc, st.progress[objIndex], target);
      this.game.audio.questUpdate();
    }
    if (st.progress.every((p, i) => p >= (q.objectives[i].count || 1))) this.complete(id);
    this.game.ui.refreshJournal();
  }

  // ---- event hooks ----
  onKill(type) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'killany') this.progress(id, i, 1);
        else if (o.type === 'kill' && (!o.mutant || o.mutant === type)) this.progress(id, i, 1);
      });
    }
  }

  onBoss(bossId) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'boss' && o.boss === bossId) this.progress(id, i, 1, true);
      });
    }
  }

  onReach(poiId) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'reach' && o.poi === poiId) this.progress(id, i, 1, true);
        if (o.type === 'explore' && o.pois && o.pois.includes(poiId)) this.flagReached(id, i, poiId);
      });
    }
  }

  flagReached(id, i, poiId) {
    const key = id + ':' + i;
    this.flags[key] = this.flags[key] || {};
    if (this.flags[key][poiId]) return;
    this.flags[key][poiId] = true;
    this.progress(id, i, 1);
  }

  onInteract(interactId) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'interact' && o.id === interactId) this.progress(id, i, 1, true);
      });
    }
  }

  onTalk(npcId) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'talk' && o.npc === npcId) this.progress(id, i, 1, true);
      });
    }
  }

  onCollect() {
    // recompute collect objectives from inventory
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type !== 'collect') return;
        const have = this.game.inventory.count(o.item);
        if (have >= (o.count || 1)) this.progress(id, i, o.count || 1, true);
        else if (have > (st.progress[i] || 0)) this.progress(id, i, 1);
      });
    }
  }

  onCraft(count = 1) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => { if (o.type === 'craft') this.progress(id, i, count); });
    }
  }

  onBuild(count = 1) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => { if (o.type === 'build') this.progress(id, i, count); });
    }
  }

  update(dt) {
    for (const [id, st] of Object.entries(this.state)) {
      if (st.status !== 'active') continue;
      const q = this.def(id);
      q.objectives.forEach((o, i) => {
        if (o.type === 'survive') {
          this.surviveTimers[id] = (this.surviveTimers[id] || 0) + dt;
          if (this.surviveTimers[id] >= o.seconds) this.progress(id, i, o.seconds, true);
        }
      });
    }
  }

  trackedQuest() {
    if (this.tracked && this.isActive(this.tracked)) return this.def(this.tracked);
    const active = Object.entries(this.state).find(([, s]) => s.status === 'active');
    return active ? this.def(active[0]) : null;
  }

  trackedObjectives() {
    const q = this.trackedQuest();
    if (!q) return [];
    const st = this.state[q.id];
    return q.objectives.map((o, i) => ({
      text: o.desc || o.type, done: st.progress[i] >= (o.count || 1), cur: st.progress[i], max: o.count || 1,
      poi: o.poi, type: o.type,
    }));
  }

  serialize() { return { state: this.state, flags: this.flags, tracked: this.tracked, completedCount: this.completedCount, surviveTimers: this.surviveTimers }; }
  deserialize(d) {
    if (!d) return;
    this.state = d.state || {};
    this.flags = d.flags || {};
    this.tracked = d.tracked || null;
    this.completedCount = d.completedCount || 0;
    this.surviveTimers = d.surviveTimers || {};
  }
}
