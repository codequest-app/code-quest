# Inventory Screen - 背包系統

**Category**: Management Screens
**Access**: Keyboard shortcut `I`, Main menu
**Last Updated**: 2026-02-05

---

## Overview

The Inventory screen displays all items owned by the player, organized by category. Players can view item details, use consumables, equip items, sort and filter, and manage their gold/currency.

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎒 背包 - Inventory                          💰 1,250 Gold │
│                                                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  容量: 25/50  ████████████░░░░░░░░░░░░  [擴充背包]         │
│                                                             │
│  [🔍 搜尋物品...]      [分類 ▼] [稀有度 ▼] [排序 ▼]        │
│                                                             │
│  ━━━━━━━━━━━━━━━ 物品分類 ━━━━━━━━━━━━━━━                │
│                                                             │
│  [全部] [消耗品] [寶物] [任務] [材料] [裝備]               │
│                                                             │
│  ━━━━━━━━━━━━━━━ 物品網格 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │🧪  │ │💎  │ │📜  │ │⚔️  │ │🛡️  │ │🎁  │               │
│  │HP藥│ │寶石│ │卷軸│ │劍  │ │盾  │ │禮物│               │
│  │×5  │ │×12 │ │×1  │ │    │ │    │ │×3  │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘               │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │💊  │ │🔑  │ │📖  │ │🧩  │ │✨  │ │    │               │
│  │MP藥│ │鑰匙│ │書籍│ │碎片│ │精華│ │空  │               │
│  │×8  │ │×1  │ │×2  │ │×4  │ │×10 │ │    │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘               │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │    │ │    │ │    │ │    │ │    │ │    │               │
│  │空  │ │空  │ │空  │ │空  │ │空  │ │空  │               │
│  │    │ │    │ │    │ │    │ │    │ │    │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘               │
│                                                             │
│  ━━━━━━━━━━━━━━━ 物品詳情 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🧪 HP恢復藥水                                   │       │
│  │                                                 │       │
│  │ 稀有度: ⭐⭐ 普通                               │       │
│  │ 類型: 消耗品                                    │       │
│  │ 數量: 5                                         │       │
│  │                                                 │       │
│  │ 描述:                                           │       │
│  │ 立即恢復 30 HP。在戰鬥中或戰鬥外都可使用。       │       │
│  │ 清涼的薄荷味，很好喝！                          │       │
│  │                                                 │       │
│  │ 效果:                                           │       │
│  │ • 恢復 30 HP                                    │       │
│  │ • 使用後有 5% 機率獲得「活力」Buff (3回合)      │       │
│  │                                                 │       │
│  │ 市場價格: 💰 25                                 │       │
│  │                                                 │       │
│  │ [使用 ×1] [使用 ×5] [丟棄] [出售]              │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [I] 關閉  |  [S] 排序  |  [F] 篩選  |  [?] 幫助           │
└─────────────────────────────────────────────────────────────┘
```

---

## Component References

### Item Grid
【參考：04-components/item-grid.md】
- 6×N grid layout
- Item icons with quantity badges
- Rarity border colors
- Empty slot placeholders
- Drag-and-drop support

### Item Card
【參考：04-components/item-card.md】
- Icon, name, rarity
- Description text
- Stats/effects display
- Action buttons
- Quantity indicator

### Capacity Bar
【參考：04-components/progress-bar.md】
- Current/max display
- Color coding (green → yellow → red)
- Smooth fill animation
- Overflow warning

### Category Tabs
【參考：04-components/tabs.md】
- Category icons with names
- Item count badges
- Active state indicator
- Keyboard navigation

---

## States & Interactions

### Item States

1. **Owned Item (Consumable)**
   - Full color icon
   - Quantity badge (×N)
   - "Use" button enabled
   - Can be sold or discarded

2. **Owned Item (Equipment)**
   - Full color icon
   - "Equip" button if not equipped
   - "Unequip" button if equipped
   - Green checkmark on equipped items

3. **Quest Item**
   - Yellow quest marker
   - Cannot be sold or discarded
   - "View related quest" button
   - Special quest icon overlay

4. **Stackable Item (Max stack)**
   - Red quantity indicator
   - "Cannot pick up more" tooltip
   - Consider selling or using

5. **Rare/Legendary Item**
   - Glowing border animation
   - Sparkle particle effects
   - Special rarity color
   - "!" indicator for new items

6. **Empty Slot**
   - Dotted border
   - Gray background
   - Click to sort/organize
   - No interactions

### Keyboard Interactions

```
I            - Toggle inventory screen
↑/↓/←/→      - Navigate item grid
Enter        - Select/use highlighted item
Space        - Quick-use consumable
Delete       - Discard selected item
S            - Toggle sort options
F            - Toggle filter options
C            - Change category
1-6          - Quick category switch
Tab          - Cycle UI sections
Esc          - Close screen
?            - Show help
```

### Mouse Interactions

```
Click Item           - Select (show details)
Double-click Item    - Quick use/equip
Right-click Item     - Context menu
Drag Item            - Move/organize
Hover Item           - Show quick tooltip
Click [使用]         - Use consumable
Click [裝備]         - Equip item
Click [出售]         - Sell item
Click [丟棄]         - Discard item
Scroll Wheel         - Scroll item grid
```

### Touch Interactions (Mobile)

```
Tap Item             - Select item
Long press Item      - Context menu
Drag Item            - Rearrange
Swipe Up/Down        - Scroll grid
Pinch Item Card      - Zoom details
Swipe Left           - Quick discard
Swipe Right          - Quick use/equip
```

---

## Item Categories

### 🧪 消耗品 (Consumables)

**Types:**
- HP 恢復藥水 (HP Potions)
- MP 恢復藥水 (MP Potion)
- 增益藥劑 (Buff Potions)
- 卷軸 (Scrolls)
- 食物 (Food)

**Actions:**
- Use (immediate effect)
- Use multiple
- Discard
- Sell

### 💎 寶物 (Treasures)

**Types:**
- 貴重寶石 (Gems)
- 古董 (Antiques)
- 藝術品 (Art)
- 收藏品 (Collectibles)

**Actions:**
- Sell (high value)
- View description
- Display in collection
- Cannot be used in combat

### 📜 任務物品 (Quest Items)

**Types:**
- 任務道具 (Quest tools)
- 證據 (Evidence)
- 鑰匙 (Keys)
- 文件 (Documents)

**Actions:**
- View related quest
- Cannot sell or discard
- Automatically removed when quest complete

### 🧩 材料 (Materials)

**Types:**
- 升級材料 (Upgrade materials)
- 合成材料 (Crafting materials)
- 稀有材料 (Rare materials)

**Actions:**
- Use in crafting
- Use in upgrades
- Sell
- Stack up to 99

### ⚔️ 裝備 (Equipment)

**Types:**
- 武器 (Weapons)
- 護甲 (Armor)
- 飾品 (Accessories)

**Actions:**
- Equip
- Unequip
- Upgrade
- Sell

---

## Animations

### Screen Transition
【參考：01-design-system/animation-timing.md】

**Opening Animation:**
```
0.0s  ├─ Backdrop fade in (200ms)
0.1s  ├─ Panel slide in from bottom (300ms)
0.2s  ├─ Gold counter count up (500ms)
0.3s  ├─ Capacity bar fill (400ms)
0.4s  ├─ Item grid fade in, stagger (30ms per item)
```

**Closing Animation:**
```
0.0s  ├─ Item grid fade out (200ms)
0.1s  ├─ Panel slide out to bottom (300ms)
0.2s  ├─ Backdrop fade out (200ms)
```

### Item Interactions

**Item Selection:**
```css
@keyframes item-select {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1.05); }
}

.item-slot.selected {
  border: 3px solid #00ccff;
  box-shadow: 0 0 20px rgba(0, 204, 255, 0.5);
  animation: item-select 300ms ease-out;
}
```

**New Item Acquired:**
```css
@keyframes new-item {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.item-slot.new {
  animation: new-item 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Sparkle effect */
@keyframes sparkle {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.item-slot.new::after {
  content: '✨';
  position: absolute;
  animation: sparkle 1.5s ease-in-out 3;
}
```

**Item Usage:**
```css
@keyframes item-use {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(0.8); opacity: 0; }
}

.item-slot.using {
  animation: item-use 500ms ease-out;
}
```

**Item Drag:**
```css
.item-slot.dragging {
  opacity: 0.5;
  transform: scale(1.1) rotate(5deg);
  cursor: grabbing;
  z-index: 1000;
}
```

### Rarity Effects

**Legendary Glow:**
```css
@keyframes legendary-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 165, 0, 0.8);
  }
}

.item-slot.legendary {
  border-color: #ffa500;
  animation: legendary-glow 2s ease-in-out infinite;
}
```

**Rare Shimmer:**
```css
@keyframes rare-shimmer {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
}

.item-slot.rare {
  border-color: #9c27b0;
  animation: rare-shimmer 3s ease-in-out infinite;
}
```

---

## Cross-References

### Related Screens
- 【參考：02-screens/management/character-status.md】 - View equipped items
- 【參考：02-screens/shops/treasury.md】 - View collectibles
- 【參考：02-screens/shops/shop-street.md】 - Buy/sell items

### Screen Transitions
【參考：03-flows/screen-transitions.md】
- From Main: Press `I` → Slide in from bottom
- To Character: Press `C` → Swap transition
- To Shop: Click [出售] → Fade to shop

### Design System
【參考：01-design-system/colors.md】 - Item rarity colors
【參考：01-design-system/icons.md】 - Item category icons
【參考：01-design-system/grid.md】 - Grid layout system

---

## Implementation Notes

### Item Data Structure

```typescript
interface Item {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  quantity: number;
  maxStack: number;

  // Display
  description: string;
  flavorText?: string;

  // Value
  value: number; // Sell price

  // Effects
  effects?: ItemEffect[];

  // Flags
  isQuestItem: boolean;
  isEquippable: boolean;
  isConsumable: boolean;
  isStackable: boolean;
  isTradeable: boolean;

  // Equipment specific
  equipSlot?: EquipSlot;
  equipStats?: EquipmentStats;

  // Meta
  acquiredDate: Date;
  isNew: boolean;
  timesUsed: number;
}

type ItemCategory =
  | 'consumable'
  | 'treasure'
  | 'quest'
  | 'material'
  | 'equipment';

type ItemRarity =
  | 'common'     // 普通 - Gray
  | 'uncommon'   // 非凡 - Green
  | 'rare'       // 稀有 - Blue
  | 'epic'       // 史詩 - Purple
  | 'legendary'; // 傳說 - Orange
```

### Inventory Management

```typescript
class InventoryManager {
  private items: Map<string, Item> = new Map();
  private capacity: number = 50;

  addItem(item: Item, quantity: number = 1): boolean {
    const existing = this.items.get(item.id);

    if (existing) {
      // Stack if possible
      if (existing.isStackable) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity <= existing.maxStack) {
          existing.quantity = newQuantity;
          this.notifyItemAdded(item, quantity);
          return true;
        }
      }
    }

    // Check capacity
    if (this.getCurrentUsedSlots() >= this.capacity) {
      this.notifyInventoryFull();
      return false;
    }

    // Add new item
    this.items.set(item.id, { ...item, quantity });
    this.notifyItemAdded(item, quantity);
    return true;
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (item.quantity <= quantity) {
      this.items.delete(itemId);
    } else {
      item.quantity -= quantity;
    }

    this.notifyItemRemoved(item, quantity);
    return true;
  }

  useItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || !item.isConsumable) return false;

    // Apply effects
    if (item.effects) {
      item.effects.forEach(effect => this.applyEffect(effect));
    }

    // Update usage stats
    item.timesUsed++;

    // Remove if consumed
    if (item.quantity > 0) {
      this.removeItem(itemId, 1);
    }

    return true;
  }

  sortItems(sortBy: SortOption): void {
    const itemArray = Array.from(this.items.values());

    itemArray.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return this.getRarityValue(b.rarity) - this.getRarityValue(a.rarity);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'value':
          return b.value - a.value;
        default:
          return 0;
      }
    });

    this.reorderItems(itemArray);
  }

  filterItems(filter: ItemFilter): Item[] {
    return Array.from(this.items.values()).filter(item => {
      if (filter.category && item.category !== filter.category) {
        return false;
      }
      if (filter.rarity && item.rarity !== filter.rarity) {
        return false;
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) ||
               item.description.toLowerCase().includes(query);
      }
      return true;
    });
  }

  getCurrentUsedSlots(): number {
    return this.items.size;
  }

  getCapacityPercentage(): number {
    return (this.getCurrentUsedSlots() / this.capacity) * 100;
  }
}
```

### Item Effects System

```typescript
interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number; // turns, if buff/debuff
  probability?: number; // 0-100%
}

type EffectType =
  | 'heal_hp'
  | 'restore_mp'
  | 'buff_attack'
  | 'buff_defense'
  | 'buff_speed'
  | 'cleanse_debuff'
  | 'revive';

class ItemEffectProcessor {
  applyEffect(effect: ItemEffect, target: Character): void {
    // Check probability
    if (effect.probability && Math.random() * 100 > effect.probability) {
      return; // Effect didn't proc
    }

    switch (effect.type) {
      case 'heal_hp':
        target.hp = Math.min(target.maxHp, target.hp + effect.value);
        this.showFloatingNumber(`+${effect.value} HP`, target, 'green');
        break;

      case 'restore_mp':
        target.mp = Math.min(target.maxMp, target.mp + effect.value);
        this.showFloatingNumber(`+${effect.value} MP`, target, 'blue');
        break;

      case 'buff_attack':
        target.applyBuff({
          type: 'attack',
          value: effect.value,
          duration: effect.duration || 3
        });
        break;

      // ... other effects
    }

    this.playEffectAnimation(effect.type, target);
    this.playEffectSound(effect.type);
  }
}
```

---

## Accessibility

### Screen Reader Support

```html
<section aria-label="Inventory Screen" role="dialog">
  <header>
    <h1 id="inventory-title">Inventory</h1>
    <div role="status" aria-live="polite">
      Capacity: 25 out of 50 slots used, 1250 gold
    </div>
  </header>

  <nav aria-label="Item categories">
    <button aria-label="All items, 25 total">All</button>
    <button aria-label="Consumables, 8 items">Consumables</button>
    <button aria-label="Treasures, 5 items">Treasures</button>
  </nav>

  <div role="grid" aria-label="Item grid">
    <div role="row">
      <div role="gridcell" aria-label="HP Potion, quantity 5, common">
        <button aria-label="Select HP Potion">
          <img src="potion.png" alt="HP Potion icon" />
          <span aria-label="Quantity">5</span>
        </button>
      </div>
      <div role="gridcell" aria-label="Empty slot">
        <div aria-label="Empty inventory slot"></div>
      </div>
    </div>
  </div>

  <aside aria-label="Item details" aria-live="polite">
    <h2>HP Recovery Potion</h2>
    <div role="status">
      Rarity: Common, Type: Consumable, Quantity: 5
    </div>
    <p>Instantly restores 30 HP. Can be used in or out of combat.</p>
    <div role="group" aria-label="Item actions">
      <button>Use 1</button>
      <button>Use 5</button>
      <button>Discard</button>
      <button>Sell</button>
    </div>
  </aside>
</section>
```

### Keyboard Navigation

**Focus Order:**
1. Close button
2. Search input
3. Category tabs
4. Filter/sort dropdowns
5. Item grid (arrow keys to navigate)
6. Item details panel
7. Action buttons

**Keyboard Shortcuts:**
```
I            - Open/close inventory
Arrow keys   - Navigate grid
Enter        - Select item
Space        - Quick use
Delete       - Discard item
1-6          - Switch categories
Tab          - Next section
Shift+Tab    - Previous section
Esc          - Close/cancel
```

### Visual Accessibility

**Color Blindness Support:**
- Rarity indicated by border style AND color
- Icons have text labels
- Quantity shown as numbers, not just color

```css
/* Rarity borders for color-blind mode */
.item-slot.common { border-style: solid; }
.item-slot.uncommon { border-style: dashed; }
.item-slot.rare { border-style: dotted; }
.item-slot.epic { border-style: double; }
.item-slot.legendary { border-style: ridge; }
```

**High Contrast Mode:**
```css
@media (prefers-contrast: high) {
  .item-slot {
    border-width: 3px;
  }

  .item-slot.selected {
    border-width: 5px;
    background: #000;
  }

  .item-slot:focus {
    outline: 4px solid #fff;
    outline-offset: 2px;
  }
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────┐
│  [Search/Filters]    [💰 Gold]        │
│  ──────────────────────────────────   │
│  [Category Tabs]                      │
│  ──────────────────────────────────   │
│  [Item Grid 6×N]    [Details Panel]   │
│  ┌──┬──┬──┬──┬──┬──┐  ┌──────────┐   │
│  │  │  │  │  │  │  │  │ Selected │   │
│  ├──┼──┼──┼──┼──┼──┤  │   Item   │   │
│  │  │  │  │  │  │  │  │          │   │
│  └──┴──┴──┴──┴──┴──┘  │ [Actions]│   │
│  (scroll down)         └──────────┘   │
└───────────────────────────────────────┘
```
- 6-column grid
- Permanent details panel
- Hover tooltips

### Tablet (768px - 1199px)

```
┌──────────────────────────────┐
│  [Search] [Filters] [💰]     │
│  [Category Tabs]             │
│  ────────────────────────    │
│  [Item Grid 4×N]             │
│  ┌───┬───┬───┬───┐           │
│  │   │   │   │   │           │
│  ├───┼───┼───┼───┤           │
│  │   │   │   │   │           │
│  └───┴───┴───┴───┘           │
│  (tap item for details)      │
└──────────────────────────────┘
```
- 4-column grid
- Modal for item details
- Touch-optimized

### Mobile (<768px)

```
┌────────────────┐
│ [🔍] [Filter]  │
│ 💰 1,250       │
│ 25/50 ████░    │
│ ───────────    │
│ [Categories]   │
│ (horizontal)   │
│ ───────────    │
│ [Grid 2×N]     │
│ ┌────┬────┐    │
│ │    │    │    │
│ ├────┼────┤    │
│ │    │    │    │
│ └────┴────┘    │
│ (scroll down)  │
└────────────────┘
```
- 2-column grid
- Bottom sheet for details
- Large touch targets
- Swipe actions

---

## Version History

- **v1.0** (2026-02-05): Initial inventory screen design
  - Item grid layout
  - Category filtering
  - Search and sort
  - Item details panel
  - Use/equip/sell/discard actions
  - Rarity system
  - Capacity management
  - Responsive layouts
  - Accessibility support
