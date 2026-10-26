// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Item, weapon and inventory systems.
// ============================================================================
#include "game/items.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
// Databases
// ---------------------------------------------------------------------------
int ItemDatabase::find(const std::string& name) const {
  auto it = m_byName.find(name);
  return it == m_byName.end() ? -1 : it->second;
}

const ItemDef* ItemDatabase::weaponItem(int weaponId) const {
  for (const ItemDef& d : m_defs)
    if (d.weaponId == weaponId) return &d;
  return nullptr;
}

void ItemDatabase::build() {
  m_defs.clear();
  m_byName.clear();
  auto add = [&](const char* name, const char* desc, int type, int w, int h, f32 weight,
                 int stack, f32 dur, int rarity, const char* mesh, f32 value,
                 bool usable = false, int effect = 0, int ammoType = -1) -> int {
    ItemDef d;
    d.id = (int)m_defs.size();
    d.name = name; d.desc = desc; d.type = type;
    d.w = w; d.h = h; d.weight = weight; d.stack = stack;
    d.durability = dur; d.rarity = rarity; d.mesh = mesh; d.value = value;
    d.usable = usable; d.effect = effect; d.ammoType = ammoType;
    m_byName[d.name] = d.id;
    m_defs.push_back(d);
    return d.id;
  };

  // --- medical -----------------------------------------------------------
  add("Field Medkit", "Sealed trauma kit. Restores health and stops bleeding.",
      IT_MEDICAL, 2, 2, 1.4f, 1, 0.0f, R_UNCOMMON, "item_medkit", 180.0f, true, 1);
  add("Bandage", "Sterile gauze roll. Stops bleeding at a wounded site.",
      IT_MEDICAL, 1, 1, 0.1f, 8, 0.0f, R_COMMON, "item_bandage", 25.0f, true, 2);
  add("Antibiotics", "Broad spectrum pills. Slows infection.",
      IT_MEDICAL, 1, 1, 0.1f, 6, 0.0f, R_UNCOMMON, "item_pills", 90.0f, true, 3);
  add("Stimulant", "Adrenaline shot. Raises stamina and alertness.",
      IT_MEDICAL, 1, 1, 0.1f, 4, 0.0f, R_RARE, "item_pills", 120.0f, true, 4);
  add("Analgesic", "Painkillers. Reduces stress and blood loss.",
      IT_MEDICAL, 1, 1, 0.1f, 6, 0.0f, R_COMMON, "item_pills", 45.0f, true, 5);

  // --- food / drink ------------------------------------------------------
  add("Water Bottle", "Filtered water. Thirst relief.",
      IT_DRINK, 1, 2, 0.5f, 3, 0.0f, R_COMMON, "item_water_bottle", 15.0f, true, 10);
  add("Canned Food", "Ten years past date. Still counts.",
      IT_FOOD, 1, 1, 0.4f, 6, 0.0f, R_COMMON, "item_can_food", 20.0f, true, 11);
  add("Field Ration", "Vacuum packed. Tastes of cardboard, works.",
      IT_FOOD, 2, 1, 0.6f, 4, 0.0f, R_UNCOMMON, "item_ration", 45.0f, true, 12);
  add("Raw Meat", "Fresh. Risky without cooking, filling anyway.",
      IT_FOOD, 1, 1, 0.3f, 4, 0.0f, R_COMMON, "item_meat_raw", 8.0f, true, 13);
  add("Edible Mushroom", "Pale caps found in the forest. Nutritious.",
      IT_FOOD, 1, 1, 0.1f, 10, 0.0f, R_COMMON, "item_mushroom", 12.0f, true, 14);
  add("Herbal Poultice", "Wild herb mash. Lowers radiation slightly.",
      IT_FOOD, 1, 1, 0.1f, 8, 0.0f, R_UNCOMMON, "item_herb", 35.0f, true, 15);

  // --- ammo --------------------------------------------------------------
  add("Pistol Ammo", "9x19mm. Common military issue.",
      IT_AMMO, 1, 1, 0.012f, 120, 0.0f, R_COMMON, "item_ammo_pile", 3.0f, false, 0, 0);
  add("Rifle Ammo", "7.62x39. Heavy, reliable, loud.",
      IT_AMMO, 1, 1, 0.016f, 120, 0.0f, R_COMMON, "item_ammo_pile", 4.0f, false, 0, 1);
  add("Shotgun Shells", "12 gauge. Eight pellets per trigger pull.",
      IT_AMMO, 1, 1, 0.05f, 40, 0.0f, R_COMMON, "item_ammo_box", 8.0f, false, 0, 2);
  add("SMG Ammo", "9x19 in magazines.",
      IT_AMMO, 1, 1, 0.012f, 120, 0.0f, R_COMMON, "item_ammo_box", 3.0f, false, 0, 3);
  add("Crossbow Bolts", "Wooden shafts, steel tips.",
      IT_AMMO, 1, 1, 0.03f, 30, 0.0f, R_UNCOMMON, "item_ammo_pile", 14.0f, false, 0, 4);

  // --- materials ---------------------------------------------------------
  add("Scrap Metal", "Bent sheet and rebar.",
      IT_MATERIAL, 1, 1, 0.6f, 20, 0.0f, R_COMMON, "item_metal_scrap", 6.0f);
  add("Wood Plank", "Splintered lumber.",
      IT_MATERIAL, 2, 1, 0.8f, 20, 0.0f, R_COMMON, "item_wood_plank", 5.0f);
  add("Electronics", "Dead circuit boards, a working coil.",
      IT_MATERIAL, 1, 1, 0.4f, 20, 0.0f, R_UNCOMMON, "item_electronics", 30.0f);
  add("Cloth Scrap", "Torn fabric. Clean it first, still useful.",
      IT_MATERIAL, 1, 1, 0.1f, 30, 0.0f, R_COMMON, "item_cloth", 4.0f);
  add("Battery", "Car battery. Powers a lot of things.",
      IT_MATERIAL, 2, 2, 8.0f, 4, 0.0f, R_UNCOMMON, "item_battery", 60.0f);
  add("Fuel Can", "Twenty litres of something flammable.",
      IT_MATERIAL, 2, 2, 9.0f, 2, 0.0f, R_RARE, "item_jerrycan", 110.0f);

  // --- tools / misc ------------------------------------------------------
  add("Flashlight", "Heavy duty LED. Still bright.",
      IT_TOOL, 1, 2, 0.4f, 1, 100.0f, R_UNCOMMON, "item_flashlight", 70.0f, true, 20);
  add("Handheld Radio", "Handset with a cracked crystal. Finds the signal.",
      IT_TOOL, 1, 2, 0.5f, 1, 100.0f, R_RARE, "item_radio", 240.0f, true, 21);
  add("Notebook", "Someone's notes. Names, dates, a map.",
      IT_MISC, 1, 1, 0.2f, 1, 0.0f, R_RARE, "item_notebook", 150.0f, true, 22);
  add("Medical Ledger", "Hospital records with dosages.",
      IT_VALUABLE, 1, 1, 0.3f, 1, 0.0f, R_EPIC, "item_notebook", 400.0f);

  // --- armour ------------------------------------------------------------
  add("Combat Helmet", "Steel shell, cracked liner.",
      IT_ARMOR, 2, 2, 1.2f, 1, 100.0f, R_UNCOMMON, "item_helmet", 120.0f);
  add("Armour Vest", "Plates and straps. Heavy but protective.",
      IT_ARMOR, 2, 3, 4.5f, 1, 100.0f, R_RARE, "item_armor_vest", 300.0f);
  add("Backpack", "Forty litres of canvas.",
      IT_ARMOR, 2, 3, 1.4f, 1, 100.0f, R_COMMON, "item_backpack", 80.0f);

  // --- weapons (item form) ----------------------------------------------
  add("Knife", "A sharp piece of the old world.",
      IT_WEAPON, 1, 1, 0.2f, 1, 60.0f, R_COMMON, "weapon_knife", 40.0f, false, 0);
  add("Combat Knife", "Folding blade, blood groove.",
      IT_WEAPON, 1, 1, 0.25f, 1, 80.0f, R_UNCOMMON, "weapon_combat_knife", 90.0f);
  add("Machete", "Long, wide, unhoned for years.",
      IT_WEAPON, 1, 3, 0.8f, 1, 120.0f, R_UNCOMMON, "weapon_machete", 110.0f);
  add("Fire Axe", "Red handle, split head.",
      IT_WEAPON, 1, 3, 1.6f, 1, 150.0f, R_UNCOMMON, "weapon_axe", 120.0f);
  add("Pipe Bat", "Lead pipe, taped grip.",
      IT_WEAPON, 1, 3, 1.2f, 1, 100.0f, R_COMMON, "weapon_pipe_bat", 45.0f);
  add("Pistol", "Service sidearm, 9x19.",
      IT_WEAPON, 2, 1, 0.9f, 1, 120.0f, R_COMMON, "weapon_pistol", 160.0f);
  add("Revolver", "Six shots, heavy cylinder.",
      IT_WEAPON, 1, 2, 1.1f, 1, 140.0f, R_UNCOMMON, "weapon_revolver", 220.0f);
  add("Shotgun", "Pump action, 12 gauge.",
      IT_WEAPON, 2, 3, 3.4f, 1, 160.0f, R_UNCOMMON, "weapon_shotgun", 280.0f);
  add("Assault Rifle", "7.62x39, wood furniture, no safety.",
      IT_WEAPON, 3, 2, 3.6f, 1, 200.0f, R_RARE, "weapon_rifle_ak", 520.0f);
  add("Hunting Rifle", "Scoped bolt action.",
      IT_WEAPON, 3, 2, 3.2f, 1, 200.0f, R_RARE, "weapon_hunting_rifle", 480.0f);
  add("Submachine Gun", "Compact, 9x19, very loud.",
      IT_WEAPON, 3, 2, 2.9f, 1, 180.0f, R_RARE, "weapon_smg", 420.0f);
  add("Crossbow", "Quiet, slow, one bolt at a time.",
      IT_WEAPON, 3, 2, 2.2f, 1, 150.0f, R_RARE, "weapon_crossbow", 350.0f);
  add("Improvised Spear", "Pipe, rag, sharpened rod.",
      IT_WEAPON, 1, 4, 1.8f, 1, 90.0f, R_COMMON, "weapon_spear", 70.0f);

  // --- attachments (item form) ------------------------------------------
  add("Red Dot Sight", "Compact reflex sight. Faster aim.",
      IT_MISC, 1, 1, 0.25f, 1, 60.0f, R_RARE, "item_flashlight", 140.0f);
  add("Combat Scope", "Magnifying optic with a reticle.",
      IT_MISC, 1, 2, 0.45f, 1, 70.0f, R_RARE, "item_flashlight", 220.0f);
  add("Suppressor", "Bottle can. Quieter, slightly weaker.",
      IT_MISC, 1, 1, 0.55f, 1, 80.0f, R_EPIC, "weapon_pipe_bat", 260.0f);
  add("Extended Magazine", "Longer magazine, slower reload.",
      IT_MISC, 1, 2, 0.30f, 1, 90.0f, R_UNCOMMON, "item_ammo_box", 120.0f);
  add("Vertical Grip", "Better control, less recoil climb.",
      IT_MISC, 1, 1, 0.20f, 1, 70.0f, R_UNCOMMON, "item_scrap", 90.0f);

  // Link the weapon items to the weapon table (the names must match).
  {
    static const char* weaponNames[] = {
      "Knife", "Combat Knife", "Machete", "Fire Axe", "Pipe Bat",
      "Pistol", "Revolver", "Shotgun", "Assault Rifle", "Hunting Rifle",
      "Submachine Gun", "Crossbow", "Improvised Spear"
    };
    for (const char* wn : weaponNames) {
      int id = find(wn);
      if (id < 0) continue;
      m_defs[id].type = IT_WEAPON;
      m_defs[id].weaponId = -2;   // resolved once the weapon table exists
    }
  }
}

void WeaponDatabase::build() {
  m_weapons.clear();
  m_attachments.clear();
  m_byName.clear();
  auto add = [&](const char* name, const char* desc, int kind, f32 dmg, f32 rpm,
                 int mag, f32 reload, f32 spread, f32 spreadMove, f32 recoil,
                 f32 fallStart, f32 fallEnd, f32 range, int pellets, int ammo,
                 f32 dur, f32 weight, f32 zoom, const char* mesh, int mode) {
    WeaponDef w;
    w.id = (int)m_weapons.size();
    w.name = name; w.desc = desc; w.kind = kind;
    w.damage = dmg; w.rpm = rpm; w.magSize = mag; w.reloadTime = reload;
    w.spread = spread; w.spreadMove = spreadMove; w.recoil = recoil;
    w.falloffStart = fallStart; w.falloffEnd = fallEnd; w.range = range;
    w.pellets = pellets; w.ammoType = ammo; w.durability = dur; w.weight = weight;
    w.adsZoom = zoom; w.mesh = mesh; w.fireMode = mode;
    w.clipCapacity = 4;
    m_byName[w.name] = w.id;
    m_weapons.push_back(w);
  };

  add("Knife", "Silent, close, brutal up close.", WK_MELEE, 34, 70, 0, 0.0f,
      0, 0, 0, 0, 0, 1.9f, 1, -1, 60, 0.2f, 1.0f, "weapon_knife", 0);
  add("Combat Knife", "Folding combat blade.", WK_MELEE, 42, 80, 0, 0.0f,
      0, 0, 0, 0, 0, 2.0f, 1, -1, 80, 0.25f, 1.0f, "weapon_combat_knife", 0);
  add("Machete", "Cleaves. Slows you down.", WK_MELEE, 58, 58, 0, 0.0f,
      0, 0, 0, 0, 0, 2.4f, 1, -1, 120, 0.8f, 1.0f, "weapon_machete", 0);
  add("Fire Axe", "Slow, heavy, devastating.", WK_MELEE, 78, 46, 0, 0.0f,
      0, 0, 0, 0, 0, 2.6f, 1, -1, 150, 1.6f, 1.0f, "weapon_axe", 0);
  add("Pipe Bat", "Improvised, everywhere.", WK_MELEE, 40, 72, 0, 0.0f,
      0, 0, 0, 0, 0, 1.8f, 1, -1, 100, 1.2f, 1.0f, "weapon_pipe_bat", 0);
  add("Pistol", "Standard issue 9mm sidearm.", WK_PISTOL, 26, 320, 15, 1.7f,
      0.011f, 0.030f, 0.016f, 22, 65, 90, 1, 0, 120, 0.9f, 1.25f, "weapon_pistol", 0);
  add("Revolver", "Heavy, accurate, six rounds.", WK_PISTOL, 48, 160, 6, 3.1f,
      0.008f, 0.026f, 0.030f, 30, 90, 120, 1, 0, 140, 1.1f, 1.35f, "weapon_revolver", 0);
  add("Shotgun", "Pump action. Eight pellets.", WK_SHOTGUN, 16, 75, 6, 3.4f,
      0.045f, 0.070f, 0.055f, 8, 32, 45, 8, 1, 160, 3.4f, 1.1f, "weapon_shotgun", 0);
  add("Assault Rifle", "7.62. Full auto, brutal recoil.", WK_RIFLE, 34, 600, 30, 2.6f,
      0.012f, 0.042f, 0.024f, 55, 160, 220, 1, 1, 200, 3.6f, 1.5f, "weapon_rifle_ak", 1);
  add("Hunting Rifle", "Scoped. One shot, one problem.", WK_RIFLE, 78, 55, 5, 3.0f,
      0.004f, 0.020f, 0.040f, 90, 240, 320, 1, 1, 200, 3.2f, 2.6f, "weapon_hunting_rifle", 0);
  add("Submachine Gun", "Compact 9mm, sprays and swears.", WK_SMG, 21, 800, 32, 2.3f,
      0.016f, 0.052f, 0.019f, 20, 60, 90, 1, 3, 180, 2.9f, 1.2f, "weapon_smg", 1);
  add("Crossbow", "Silent single shots at range.", WK_BOW, 62, 45, 1, 2.4f,
      0.003f, 0.010f, 0.012f, 40, 110, 160, 1, 4, 150, 2.2f, 2.2f, "weapon_crossbow", 0);
  add("Improvised Spear", "Reach and a point.", WK_MELEE, 50, 50, 0, 0.0f,
      0, 0, 0, 0, 0, 3.0f, 1, -1, 90, 1.8f, 1.0f, "weapon_spear", 0);

  auto addAtt = [&](const char* name, const char* desc, int slot, f32 sp, f32 rc,
                    f32 dm, f32 zm, int cap, bool sup, const char* mesh) {
    AttachmentDef a;
    a.id = (int)m_attachments.size();
    a.name = name; a.desc = desc; a.slot = slot;
    a.spreadMod = sp; a.recoilMod = rc; a.damageMod = dm; a.zoomMod = zm;
    a.ammoCapacityMod = cap; a.suppressor = sup; a.mesh = mesh;
    m_attachments.push_back(a);
  };
  addAtt("Red Dot Sight", "Fast target acquisition.", 0, 0.0f, 0.0f, 0.0f, 0.25f, 0, false, "item_flashlight");
  addAtt("Combat Scope", "Magnifies. Adds weight.", 0, 0.0f, 0.02f, 0.0f, 0.9f, 0, false, "item_flashlight");
  addAtt("Suppressor", "Quieter. Less damage past 40 metres.", 1, 0.0f, -0.15f, -0.05f, 0.0f, 0, true, "weapon_pipe_bat");
  addAtt("Vertical Grip", "Tames vertical recoil.", 2, -0.20f, -0.30f, 0.0f, 0.0f, 0, false, "item_flashlight");
  addAtt("Extended Magazine", "More rounds, slower reload.", 3, 0.0f, 0.0f, 0.0f, 0.0f, 10, false, "item_ammo_box");
}

int WeaponDatabase::find(const std::string& name) const {
  auto it = m_byName.find(name);
  return it == m_byName.end() ? -1 : it->second;
}

// ---------------------------------------------------------------------------
// Inventory operations
// ---------------------------------------------------------------------------
int  inventoryCount(const Player& p, const ItemDef& d);
int  inventoryCount(const Player& p, int defId);
bool inventoryAdd(Player& p, const ItemDatabase& db, int defId, int count);
bool inventoryRemove(Player& p, int defId, int count);
bool inventoryRemoveSlot(Player& p, int slot);
f32  inventoryWeight(const Player& p, const ItemDatabase& db);
bool inventoryMove(Player& p, int fromX, int fromY, int toX, int toY);
ItemStack* inventoryAt(Player& p, int x, int y);
bool equipItem(Player& p, const ItemDatabase& db, int slot, int equipSlot);
bool unequipItem(Player& p, int equipSlot);
const ItemDef* equippedDef(const Player& p, const ItemDatabase& db, int equipSlot);

namespace {

bool fits(const ItemStack* grid, const ItemDef& d, int w, int h, int x, int y) {
  for (int j = 0; j < d.h; ++j)
    for (int i = 0; i < d.w; ++i) {
      int cx = x + i, cy = y + j;
      if (cx < 0 || cy < 0 || cx >= Player::INV_W || cy >= Player::INV_H) return false;
      if (grid[cy * Player::INV_W + cx].defId >= 0) return false;
    }
  return true;
}

void place(ItemStack* grid, const ItemDef& d, int x, int y, const ItemStack& st) {
  for (int j = 0; j < d.h; ++j)
    for (int i = 0; i < d.w; ++i)
      grid[(y + j) * Player::INV_W + (x + i)] = st;
}

} // namespace

int  inventoryCount(const Player& p, const ItemDef& d);
int  inventoryCount(const Player& p, int defId);
bool inventoryAdd(Player& p, const ItemDatabase& db, int defId, int count);
bool inventoryRemove(Player& p, int defId, int count);
bool inventoryRemoveSlot(Player& p, int slot);
f32  inventoryWeight(const Player& p, const ItemDatabase& db);
bool inventoryMove(Player& p, int fromX, int fromY, int toX, int toY);
ItemStack* inventoryAt(Player& p, int x, int y);
bool equipItem(Player& p, const ItemDatabase& db, int slot, int equipSlot);
bool unequipItem(Player& p, int equipSlot);
const ItemDef* equippedDef(const Player& p, const ItemDatabase& db, int equipSlot);

int inventoryCount(const Player& p, int defId) {
  int n = 0;
  for (int i = 0; i < Player::INV_W * Player::INV_H; ++i)
    if (p.inv[i].defId == defId) n += p.inv[i].count;
  for (int i = 0; i < EQ_COUNT; ++i)
    if (p.equip[i].defId == defId) n += p.equip[i].count;
  return n;
}

int inventoryCount(const Player& p, const ItemDef& d) { return inventoryCount(p, d.id); }

bool inventoryAdd(Player& p, const ItemDatabase& db, int defId, int count) {
  if (defId < 0 || defId >= (int)db.defs().size() || count <= 0) return false;
  const ItemDef& d = db.def(defId);
  int remaining = count;
  // top up existing stacks first
  if (d.stack > 1) {
    for (int i = 0; i < Player::INV_W * Player::INV_H && remaining > 0; ++i) {
      ItemStack& s = p.inv[i];
      if (s.defId != defId || s.count >= d.stack) continue;
      int add = std::min(remaining, d.stack - s.count);
      s.count += add;
      remaining -= add;
    }
  }
  while (remaining > 0) {
    bool placed = false;
    for (int y = 0; y < Player::INV_H && remaining > 0 && !placed; ++y)
      for (int x = 0; x < Player::INV_W && remaining > 0 && !placed; ++x) {
        if (!fits(p.inv, d, Player::INV_W, Player::INV_H, x, y)) continue;
        int add = std::min(remaining, d.stack);
        ItemStack st; st.defId = defId; st.count = add;
        st.durability = (d.durability > 0.0f) ? 1.0f : 0.0f;
        place(p.inv, d, x, y, st);
        remaining -= add;
        placed = true;
      }
    if (!placed) break;
  }
  return remaining < count;
}

ItemStack* inventoryAt(Player& p, int x, int y) {
  if (x < 0 || y < 0 || x >= Player::INV_W || y >= Player::INV_H) return nullptr;
  ItemStack& s = p.inv[y * Player::INV_W + x];
  return (s.defId < 0) ? nullptr : &s;
}

bool inventoryRemoveSlot(Player& p, int slot) {
  if (slot < 0 || slot >= Player::INV_W * Player::INV_H) return false;
  ItemStack& s = p.inv[slot];
  if (s.defId < 0) return false;
  s.defId = -1; s.count = 0;
  return true;
}

bool inventoryRemove(Player& p, int defId, int count) {
  if (count <= 0) return true;
  int have = inventoryCount(p, defId);
  if (have < count) return false;
  int remaining = count;
  for (int i = Player::INV_W * Player::INV_H - 1; i >= 0 && remaining > 0; --i) {
    ItemStack& s = p.inv[i];
    if (s.defId != defId) continue;
    int take = std::min(s.count, remaining);
    s.count -= take;
    remaining -= take;
    if (s.count <= 0) s.defId = -1;
  }
  return remaining == 0;
}

f32 inventoryWeight(const Player& p, const ItemDatabase& db) {
  f32 w = 0.0f;
  for (int i = 0; i < Player::INV_W * Player::INV_H; ++i) {
    if (p.inv[i].defId < 0) continue;
    const ItemDef& d = db.def(p.inv[i].defId);
    w += d.weight * p.inv[i].count;
  }
  for (int i = 0; i < EQ_COUNT; ++i) {
    if (p.equip[i].defId < 0) continue;
    const ItemDef& d = db.def(p.equip[i].defId);
    w += d.weight * p.equip[i].count;
  }
  return w;
}

bool inventoryMove(Player& p, int fromX, int fromY, int toX, int toY) {
  ItemStack* src = inventoryAt(p, fromX, fromY);
  if (!src) return false;
  // find the item definition size via a temporary lookup is not possible here;
  // the caller supplies the definition through the returned stack.
  return false;
}

bool equipItem(Player& p, const ItemDatabase& db, int slot, int equipSlot) {
  if (slot < 0 || slot >= Player::INV_W * Player::INV_H) return false;
  ItemStack s = p.inv[slot];
  if (s.defId < 0) return false;
  const ItemDef& d = db.def(s.defId);
  int target = equipSlot;
  if (target < 0) {
    switch (d.type) {
      case IT_ARMOR: target = EQ_TORSO; break;
      case IT_WEAPON: target = EQ_MAIN; break;
      default: return false;
    }
  }
  if (target < 0 || target >= EQ_COUNT) return false;
  ItemStack old = p.equip[target];
  p.equip[target] = s;
  p.inv[slot].defId = -1;
  p.inv[slot].count = 0;
  if (old.defId >= 0) {
    if (!inventoryAdd(p, db, old.defId, old.count)) {
      // drop on the floor is handled by the caller; keep it in the pack
      p.equip[target] = old;
      p.inv[slot].defId = s.defId;
      p.inv[slot].count = s.count;
      return false;
    }
  }
  return true;
}

bool unequipItem(Player& p, int equipSlot) {
  if (equipSlot < 0 || equipSlot >= EQ_COUNT) return false;
  ItemStack& s = p.equip[equipSlot];
  if (s.defId < 0) return false;
  s.defId = -1; s.count = 0;
  return true;
}

const ItemDef* equippedDef(const Player& p, const ItemDatabase& db, int equipSlot) {
  if (equipSlot < 0 || equipSlot >= EQ_COUNT) return nullptr;
  if (p.equip[equipSlot].defId < 0) return nullptr;
  return &db.def(p.equip[equipSlot].defId);
}

// ---------------------------------------------------------------------------
void linkWeaponItems(ItemDatabase& items, const WeaponDatabase& weapons) {
  for (size_t i = 0; i < items.defs().size(); ++i) {
    ItemDef& d = items.mutableDef((int)i);
    if (d.weaponId != -2) continue;
    d.weaponId = weapons.find(d.name);
  }
}

// ---------------------------------------------------------------------------
bool fitAttachment(Player& p, const ItemDatabase& items, const WeaponDatabase& weapons,
                   int attachmentIndex, int weaponSlot) {
  if (attachmentIndex < 0 || attachmentIndex >= (int)weapons.attachments().size()) return false;
  const AttachmentDef& ad = weapons.attachments()[(size_t)attachmentIndex];
  int itemId = items.find(ad.name);
  if (itemId < 0) return false;
  if (inventoryCount(p, itemId) <= 0) return false;
  if (weaponSlot < 0 || weaponSlot >= Player::INV_W * Player::INV_H) return false;
  ItemStack& w = p.inv[weaponSlot];
  if (w.defId < 0) return false;
  int slot = ad.slot;
  if (slot < 0 || slot > 3) return false;
  if (w.att[slot] >= 0) return false;     // slot already taken
  if (!inventoryRemove(p, itemId, 1)) return false;
  w.att[slot] = attachmentIndex;
  return true;
}

// ---------------------------------------------------------------------------
bool fitAttachmentToEquipped(Player& p, const ItemDatabase& items,
                             const WeaponDatabase& weapons, int attachmentIndex) {
  ItemStack& w = p.equip[EQ_MAIN];
  if (w.defId < 0) return false;
  if (attachmentIndex < 0 || attachmentIndex >= (int)weapons.attachments().size()) return false;
  const AttachmentDef& ad = weapons.attachments()[(size_t)attachmentIndex];
  int itemId = items.find(ad.name);
  if (itemId < 0) return false;
  if (inventoryCount(p, itemId) <= 0) return false;
  int slot = ad.slot;
  if (slot < 0 || slot > 3) return false;
  if (w.att[slot] >= 0) return false;
  if (!inventoryRemove(p, itemId, 1)) return false;
  w.att[slot] = attachmentIndex;
  return true;
}

// ---------------------------------------------------------------------------
WeaponDef effectiveWeapon(const ItemStack& stack, const ItemDatabase& items,
                           const WeaponDatabase& weapons) {
  if (stack.defId < 0) return WeaponDef();
  const ItemDef& idef = items.def(stack.defId);
  if (idef.weaponId < 0) return WeaponDef();
  WeaponDef w = weapons.def(idef.weaponId);
  for (int i = 0; i < 4; ++i) {
    int ai = stack.att[i];
    if (ai < 0 || ai >= (int)weapons.attachments().size()) continue;
    const AttachmentDef& a = weapons.attachments()[(size_t)ai];
    w.spread = std::max(0.0f, w.spread + a.spreadMod);
    w.recoil = std::max(0.0f, w.recoil + a.recoilMod);
    w.damage = std::max(1.0f, w.damage + a.damageMod);
    w.adsZoom += a.zoomMod;
    w.magSize = std::max(1, w.magSize + a.ammoCapacityMod);
  }
  return w;
}

// ---------------------------------------------------------------------------
// Crafting
// ---------------------------------------------------------------------------
void CraftingSystem::build(const ItemDatabase& items) {
  m_recipes.clear();
  auto add = [&](const char* name, const char* desc, int station, const char* out, int outCount,
                 std::vector<std::pair<int, int>> ins, bool known) {
    Recipe r;
    r.id = (int)m_recipes.size();
    r.name = name; r.desc = desc; r.station = station;
    r.outputItem = items.find(out);
    r.outputCount = outCount;
    r.inputs = ins;
    r.known = known;
    m_recipes.push_back(r);
  };
  auto id = [&](const char* n) { return items.find(n); };

  add("Bandage", "Tear cloth into strips.", 0, "Bandage", 1,
      { { id("Cloth Scrap"), 2 } }, true);
  add("Improvised Splint", "Wood and cloth. Stabilises a fracture.", 0, "Bandage", 2,
      { { id("Wood Plank"), 1 }, { id("Cloth Scrap"), 2 } }, false);
  add("Repair Kit", "Patch a damaged weapon.", 1, "Scrap Metal", 2,
      { { id("Scrap Metal"), 3 }, { id("Electronics"), 1 } }, true);
  add("Improvised Ammo", "Melt, cast, reload. It will work.", 1, "Pistol Ammo", 12,
      { { id("Scrap Metal"), 4 } }, false);
  add("Field Splint", "Splint a broken limb properly.", 1, "Field Medkit", 1,
      { { id("Bandage"), 2 }, { id("Wood Plank"), 1 }, { id("Antibiotics"), 1 } }, false);
  add("Water Filter", "Charcoal, cloth and gravel.", 1, "Water Bottle", 1,
      { { id("Cloth Scrap"), 2 }, { id("Scrap Metal"), 1 } }, false);
  add("Fire Kit", "Flint, steel and tinder.", 0, "Wood Plank", 2,
      { { id("Wood Plank"), 2 }, { id("Scrap Metal"), 1 } }, true);
  add("Tripwire Alarm", "A wire, a can and a lot of noise.", 1, "Scrap Metal", 2,
      { { id("Scrap Metal"), 2 }, { id("Electronics"), 1 } }, false);
  add("Signal Flare", "Burns red for thirty seconds.", 2, "Fuel Can", 1,
      { { id("Fuel Can"), 1 }, { id("Cloth Scrap"), 2 } }, false);
  add("Antidote", "Counteracts radiation exposure.", 2, "Antibiotics", 2,
      { { id("Mushroom"), 2 }, { id("Herb"), 2 }, { id("Electronics"), 1 } }, false);
  add("Reinforced Barricade", "Plates welded to a frame.", 2, "Scrap Metal", 8,
      { { id("Scrap Metal"), 6 }, { id("Wood Plank"), 4 } }, false);
  add("Field Cooker", "Burns fuel, boils water, cooks meat.", 1, "Wood Plank", 3,
      { { id("Scrap Metal"), 3 }, { id("Wood Plank"), 2 } }, false);
  add("Medicated Bandage", "Antibiotics sealed into gauze.", 2, "Antibiotics", 2,
      { { id("Bandage"), 2 }, { id("Antibiotics"), 1 } }, false);
}

bool CraftingSystem::canCraft(const Recipe& r, const Player& p, const ItemDatabase& items) const {
  if (!r.known || r.outputItem < 0) return false;
  for (const auto& in : r.inputs) {
    if (inventoryCount(p, in.first) < in.second) return false;
  }
  return true;
}

bool CraftingSystem::craft(Player& p, const ItemDatabase& items, const Recipe& r) {
  if (!canCraft(r, p, items)) return false;
  for (const auto& in : r.inputs) {
    if (!inventoryRemove(p, in.first, in.second)) return false;
  }
  inventoryAdd(p, items, r.outputItem, r.outputCount);
  return true;
}

void CraftingSystem::unlock(const std::string& blueprint) {
  for (Recipe& r : m_recipes) {
    if (r.name == blueprint) r.known = true;
  }
}

} // namespace aoh
