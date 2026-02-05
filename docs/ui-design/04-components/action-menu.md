# 行動選單組件 (Action Menu Component)

**類別**: Battle Components
**版本**: v1.0

## 組件概述
戰鬥畫面的行動選單，顯示可用行動選項，支援快捷鍵和可用性檢查。

## 視覺示例
```
┌──────────────────────────────────────────────────┐
│  [⚔️ 使用技能]  [🤝 召喚夥伴]  [💼 使用道具]   │
│  [🛡️ 防禦姿態]  [🏃 逃跑]                       │
└──────────────────────────────────────────────────┘

快捷鍵:
[1] 使用技能  [2] 召喚夥伴  [3] 使用道具
[4] 防禦姿態  [5] 逃跑
```

## 屬性定義
```typescript
interface ActionMenuProps {
  actions: BattleAction[];
  onActionSelect: (action: BattleAction) => void;
  disabled?: boolean;
  variant?: 'horizontal' | 'grid';
}

interface BattleAction {
  id: string;
  type: ActionType;
  name: string;
  icon: string;
  shortcut?: string;
  available: boolean;
  mpCost?: number;
  cooldown?: number;
  tooltip?: string;
}

type ActionType = 'skill' | 'companion' | 'item' | 'defend' | 'flee';
```

## 狀態
- **Available** - 可使用，正常顏色
- **Unavailable** - 不可用（MP不足、冷卻中），灰色
- **Disabled** - 禁用（敵人回合），半透明

## 使用範例
```tsx
<ActionMenu
  actions={[
    { id: 'skill', type: 'skill', name: '使用技能', icon: '⚔️', shortcut: '1', available: true },
    { id: 'companion', type: 'companion', name: '召喚夥伴', icon: '🤝', shortcut: '2', available: true },
    { id: 'item', type: 'item', name: '使用道具', icon: '💼', shortcut: '3', available: true },
    { id: 'defend', type: 'defend', name: '防禦姿態', icon: '🛡️', shortcut: '4', available: true },
    { id: 'flee', type: 'flee', name: '逃跑', icon: '🏃', shortcut: '5', available: false },
  ]}
  onActionSelect={handleAction}
  disabled={isEnemyTurn}
/>
```

【參考：02-screens/battle/battle-main.md】
