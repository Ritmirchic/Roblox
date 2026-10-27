/**
 * Dialogue system. Conversations are data-driven trees with conditions and
 * side effects (quest handoff, trade, healing, lore flags). NPCs remember what
 * the player has already been told.
 */
import { ITEMS } from '../data/items.js';

const ROLE_LABEL = {
  trader: 'QUARTERMASTER',
  guard: 'CAMP GUARD',
  lore: 'SURVIVOR - HISTORIAN',
  medic: 'MEDIC',
  mechanic: 'ENGINEER',
};

export class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.flags = new Set();
    this.lastTopic = new Map();
  }

  roleLabel(npc) {
    return ROLE_LABEL[npc.role] || 'SURVIVOR';
  }

  /** Build the conversation tree for an NPC based on the current world state. */
  tree(npc) {
    const q = this.game.quests;
    const name = npc.name;
    const node = (text, choices, opts = {}) => ({ text, choices, ...opts });
    const close = { label: 'Leave.', action: () => false };
    const tryStart = (questId) => {
      const def = q.def(questId);
      if (!def) return false;
      if (q.completed.has(questId) || q.active.has(questId)) return false;
      q.start(questId);
      return true;
    };

    if (name === 'Sera') {
      const active = [...q.active.values()].filter((x) => x.def.act <= 3);
      const lines = {
        root: node(
          'Sera keeps the kettle boiling even when there is nothing in it. "You are awake. Good. That is one less body to bury."',
          [
            { label: 'What is this place?', next: 'place' },
            { label: 'What is the signal?', next: 'signal' },
            { label: 'I need work.', next: 'work' },
            { label: 'I need supplies.', next: 'trade' },
            { label: 'Can you patch me up?', next: 'heal' },
            closes(),
          ],
        ),
        place: node(
          '"The Kettle. Twelve of us, down from forty. We hold the high street because the Hollow do not like open ground, and because Vasily still knows how to fix a radio." She glances at the generator. "Mostly."',
          [{ label: 'Who is Vasily?', next: 'vasily' }, closes()],
        ),
        signal: node(
          '"Three weeks ago every band went dead, then one came back. Nine minutes of static, then a woman saying ' + "'Project Last Signal is active'" + '. Then it repeats. Vasily says it comes from the north, past Blackwood. I say nothing good broadcasts for three weeks without wanting to be found."',
          [{ label: 'And if it wants to be found?', next: 'signal2' }, closes()],
        ),
        signal2: node(
          '"Then we do not go quietly. That is all the plan I have." She sets her jaw. "But someone has to go. It is not going to be the children."',
          [{ label: 'I will look into it.', action: () => { this.flags.add('sera_signal'); this.game.quests?.onTalk('Sera'); return false; } }, closes()],
        ),
        vasily: node(
          '"Old Vasily. Before the collapse he was a broadcast engineer. Now he is a man who talks to a radio like it owes him money. He will want to meet you. Bring questions, not opinions."',
          [{ label: 'Understood.', next: 'root' }, closes()],
        ),
        work: node(
          active.length
            ? '"You already have work. Finish it, then come back."'
            : this.flags.has('generator_fixed')
              ? '"The lights are on because of you. The nest under the water tower is still there, and it is still screaming at night."'
              : '"The generator is dead and the pump dies with it. Get circuits and wire from the hardware store. Then we talk about the rest."',
          [
            { label: 'Tell me about the generator.', next: 'generator' },
            { label: 'Is there anything else?', next: 'rumours' },
            closes(),
          ],
        ),
        generator: node(
          '"East side of the camp, the concrete hut. It needs two circuits and new wiring. There is a hardware store by the cul-de-sac - but something nests there. Take the rifle if you can shoot, the axe if you cannot."',
          [{ label: 'I will get the parts.', action: () => { tryStart('m06'); return false; } }, { label: 'Not yet.', next: 'work' }],
        ),
        rumours: node(
          '"The forest has more trees than sense, the factories never made anything legal, and the city is a graveyard with streets. The Exclusion Zone is worse. Do not go past the wire until you have a reason and a rifle."',
          [{ label: 'Noted.', next: 'work' }, closes()],
        ),
        trade: node(
          '"Take what you can carry. Leave the scrip on the table."',
          [
            { label: 'Buy: 3 bandages (25 scrip)', action: () => this.trade(['med_bandage', 3], 25) },
            { label: 'Buy: 2 cans of meat (20 scrip)', action: () => this.trade(['food_canned', 2], 20) },
            { label: 'Buy: 12 pistol rounds (30 scrip)', action: () => this.trade(['ammo_pistol', 12], 30) },
            { label: 'Buy: gas mask filter (40 scrip)', action: () => this.trade(['equip_filter', 1], 40) },
            { label: 'Sell: mutant tissue (12 scrip each)', action: () => this.sell('quest_sample', 12) },
            { label: 'Back.', next: 'root' },
          ],
        ),
        heal: node(
          (() => {
            const cost = 20;
            const has = this.game.inventory.count('val_currency') >= cost;
            return has
              ? '"Sit down. This will hurt, which means it is working."'
              : '"I can patch you up, but not for free. Twenty scrip, or bring me cloth and iodine."';
          })(),
          [
            { label: 'Patch me up (20 scrip)', action: () => this.heal(20) },
            { label: 'Back.', next: 'root' },
          ],
        ),
      };
      // resolve string links ('root', 'place', ...) into real nodes
      for (const n of Object.values(lines)) {
        for (const c of n.choices || []) {
          if (typeof c.next === 'string') c.next = lines[c.next] || null;
          if (typeof c.next === 'string' || c.next === undefined) delete c.next;
        }
      }
      lines.root.__tree = lines;
      return lines.root;
    }

    if (name === 'Old Vasily') {
      return {
        text: 'Vasily has a soldering iron in one hand and a cigarette in the other, and is using neither. "You. Good. Come here. Listen." He taps the radio. "This is not a distress call. Distress calls repeat on a loop and they sound like people. This sounds like a machine pretending to be a person."',
        choices: [
          { label: 'What do you mean?', next: {
            text: '"Nine minutes of carrier, then eleven words. Every time. No breathing, no panic, no name. Machines do not get tired. People do. Whatever is broadcasting has been doing it for three weeks without sleeping."',
            choices: [
              { label: 'Where is it coming from?', next: {
                text: '"North. The bearing puts it past the forest, past the dead suburbs, somewhere in the industrial belt. That is two days on foot and one bad night in the open. I can narrow it down if you bring me the trail data from the forest relays."',
                choices: [
                  { label: 'I can do that.', action: () => { this.flags.add('vasily_triangulation'); this.game.quests?.onTalk('Old Vasily'); return false; } },
                  { label: 'What do you get out of it?', next: {
                    text: '"A working radio and the first good night of sleep since I was thirty. If the signal stops, I stop hearing her." He does not elaborate on who "her" is.',
                    choices: [
                      { label: 'I will find it.', action: () => { this.flags.add('vasily_triangulation'); this.game.quests?.onTalk('Old Vasily'); return false; } },
                      { label: 'Later.' },
                    ],
                  } },
                ],
              } },
              { label: 'You are afraid of a sound.', next: {
                text: '"I have been afraid of sounds since 1986. The difference is that this one is not in my head."',
                choices: [{ label: 'Fair enough.' }],
              } },
            ],
          } },
          { label: 'Tell me about the war.', next: {
            text: '"There was no war. That is the joke. Nobody declared anything. One morning the evacuation order came from a building that was already empty. The army sealed the Exclusion Zone, the radio went quiet, and eleven million people walked out of the cities in the wrong direction." He shrugs. "You are breathing, so someone got it wrong enough for you to be here."',
            choices: [{ label: 'Who sealed it?', next: {
              text: '"Project Last Signal sealed it. I have seen the paperwork. Grey stamps, no names, no departments. It was written to be forgotten."',
              choices: [{ label: 'I will remember it.' }],
            } }, { label: 'I should go.' }],
          } },
          { label: 'Can you repair my gear?', action: () => this.repairGear() },
          { label: 'Leave.' },
        ],
      };
    }

    if (name === 'Mara') {
      const threat = this.game.enemies.countAliveNear(this.game.player.position, 40);
      return {
        text: threat > 0
          ? 'Mara keeps her rifle pointed at the treeline. "Something out there is smart enough to stay in cover. Stay behind the sandbags, or get comfortable dying."'
          : 'Mara lowers the rifle a little. "You are the one Sera keeps talking about. If you are going past the barricade, keep your noise down. The Hollow hunt by sound, not by sight."',
        choices: [
          { label: 'How do I fight the Hollow?', next: {
            text: '"Aim for the chest, then the head. They get back up. Do not let one get behind you - they are slow in front and fast behind." She racks the bolt. "And do not fight more than three at a time. You will lose."',
            choices: [{ label: 'Thanks.' }, { label: 'And larger mutants?', next: {
              text: '"Run. If you cannot run, shoot the big joints. Knees, elbows, throat. It buys you a few seconds. Few seconds is a long time."',
              choices: [{ label: 'Understood.' }],
            } }],
          } },
          { label: 'Can you spare ammunition?', action: () => this.maraAmmo() },
          { label: 'Leave.' },
        ],
      };
    }

    // generic NPC tree
    return {
      text: `${name} looks up, exhausted but alive. "Not many new faces these days. What do you need?"`,
      choices: [
        { label: 'Any news?', next: { text: '"The radio kept us up all night again. Nine minutes, same words. If you are going out there, bring back something useful for once."', choices: [{ label: 'I will.' }] } },
        { label: 'Stay safe.', action: () => false },
      ],
    };
  }

  // ---- actions -----------------------------------------------------------
  trade(output, price) {
    if (this.game.inventory.count('val_currency') < price) {
      this.game.notify('Not enough scrip.', 'danger', 'TRADE');
      return false;
    }
    this.game.inventory.removeById('val_currency', price);
    const left = this.game.inventory.add(output[0], output[1]);
    if (left > 0) this.game.notify('No room for the goods.', 'danger', 'TRADE');
    this.game.audio?.play('trade');
    this.game.notify(`Bought ${ITEMS[output[0]]?.name || output[0]} x${output[1]}`, 'item', 'TRADE');
    return false;
  }

  sell(itemId, price) {
    if (this.game.inventory.count(itemId) < 1) {
      this.game.notify('You have none to sell.', 'danger', 'TRADE');
      return false;
    }
    this.game.inventory.removeById(itemId, 1);
    this.game.inventory.add('val_currency', price);
    this.game.audio?.play('trade');
    this.game.notify(`Sold ${ITEMS[itemId]?.name || itemId} for ${price} scrip`, 'item', 'TRADE');
    return false;
  }

  heal(price) {
    if (this.game.inventory.count('val_currency') < price) {
      this.game.notify('Not enough scrip.', 'danger', 'TRADE');
      return false;
    }
    this.game.inventory.removeById('val_currency', price);
    const p = this.game.player;
    p.heal(p.healthMax * 0.65);
    p.bleeding = 0;
    p.pain = Math.max(0, p.pain - 30);
    p.infection = Math.max(0, p.infection - 20);
    this.game.audio?.play('heal');
    this.game.notify('Patched up.', 'item', 'MEDICAL');
    return false;
  }

  repairGear() {
    const inv = this.game.inventory;
    let repaired = 0;
    let cost = 0;
    for (const it of inv.items) {
      const def = ITEMS[it.id];
      if (!def || def.type !== 'weapon') continue;
      if (it.durability == null) continue;
      if (it.durability >= (def.durability || 100)) continue;
      it.durability = def.durability || 100;
      repaired++;
      cost += 8;
    }
    if (!repaired) {
      this.game.notify('Nothing needs repair.', 'info', 'WORKSHOP');
      return false;
    }
    inv.removeById('val_currency', Math.min(cost, inv.count('val_currency')));
    this.game.audio?.play('repair');
    this.game.notify(`${repaired} weapon${repaired > 1 ? 's' : ''} repaired.`, 'item', 'WORKSHOP');
    return false;
  }

  maraAmmo() {
    if (this.flags.has('mara_ammo')) {
      this.game.notify('"You already took my spare mag. Do not ask twice."', 'danger', 'MARA');
      return false;
    }
    this.flags.add('mara_ammo');
    this.game.inventory.add('ammo_pistol', 16);
    this.game.audio?.play('pickup');
    this.game.notify('Mara gives you 16 pistol rounds.', 'item', 'MARA');
    return false;
  }

  serialize() {
    return { flags: [...this.flags] };
  }

  deserialize(d) {
    if (!d) return;
    this.flags = new Set(d.flags || []);
  }
}

function closes() {
  return { label: 'Leave.' };
}
