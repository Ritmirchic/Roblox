// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Inventory operations (declarations).
// ============================================================================
#pragma once
#include "game/entities.h"

namespace aoh {

int  inventoryCount(const Player& p, const ItemDef& d);
int  inventoryCount(const Player& p, int defId);
bool inventoryAdd(Player& p, const ItemDatabase& db, int defId, int count);
bool inventoryRemove(Player& p, int defId, int count);
bool inventoryRemoveSlot(Player& p, int slot);
f32  inventoryWeight(const Player& p, const ItemDatabase& db);
ItemStack* inventoryAt(Player& p, int x, int y);
bool equipItem(Player& p, const ItemDatabase& db, int slot, int equipSlot);
bool unequipItem(Player& p, int equipSlot);
const ItemDef* equippedDef(const Player& p, const ItemDatabase& db, int equipSlot);

// Crafting recipes ------------------------------------------------------------
struct Recipe {
  int id = 0;
  std::string name;
  std::string desc;
  int station = 0;            // 0 = hand, 1 = workbench, 2 = chemistry, 3 = forge
  int outputItem = -1;
  int outputCount = 1;
  std::vector<std::pair<int, int>> inputs;   // item id, count
  bool known = false;
};

// Resolves the item <-> weapon link after both databases are built.
void linkWeaponItems(ItemDatabase& items, const WeaponDatabase& weapons);

// Fits an attachment to a weapon in the inventory.  Returns false when the
// attachment is missing or the slot is already occupied.
bool fitAttachment(Player& p, const ItemDatabase& items, const WeaponDatabase& weapons,
                   int attachmentIndex, int weaponSlot);
bool fitAttachmentToEquipped(Player& p, const ItemDatabase& items,
                             const WeaponDatabase& weapons, int attachmentIndex);
// The weapon definition with every fitted attachment applied.
WeaponDef effectiveWeapon(const ItemStack& stack, const ItemDatabase& items,
                           const WeaponDatabase& weapons);

class CraftingSystem {
public:
  void build(const ItemDatabase& items);
  const std::vector<Recipe>& recipes() const { return m_recipes; }
  bool canCraft(const Recipe& r, const Player& p, const ItemDatabase& items) const;
  bool craft(Player& p, const ItemDatabase& items, const Recipe& r);
  void unlock(const std::string& blueprint);
private:
  std::vector<Recipe> m_recipes;
};

} // namespace aoh
