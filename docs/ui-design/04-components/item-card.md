# 物品卡片組件 (Item Card Component)

**類別**: Card Components
**版本**: v1.0

## 組件概述
物品卡片用於顯示遊戲物品信息，包括圖標、名稱、數量、稀有度和快速操作。

## 視覺示例
```
┌────────────────────┐
│ 🧪                 │
│ HP恢復藥水         │
│ ×5                 │
│ ⭐⭐ 普通          │
└────────────────────┘
```

## 屬性定義
```typescript
interface ItemCardProps {
  item: Item;
  variant?: 'grid' | 'list' | 'detailed';
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onClick?: () => void;
  onUse?: () => void;
  onContextMenu?: () => void;
}

interface Item {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  quantity: number;
  maxStack: number;
  description: string;
  value: number;
  isQuestItem: boolean;
  isNew: boolean;
}

type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
```

## 稀有度顏色
```css
.item-card.common { border-color: #9e9e9e; }
.item-card.uncommon { border-color: #4caf50; }
.item-card.rare { border-color: #2196f3; }
.item-card.epic { border-color: #9c27b0; }
.item-card.legendary { border-color: #ffa500; }
```

## 使用範例
```tsx
<ItemCard
  item={potion}
  variant="grid"
  size="medium"
  selected={selectedItem === potion.id}
  onClick={() => showItemDetails(potion)}
  onUse={() => useItem(potion)}
/>
```

【參考：02-screens/management/inventory.md】
