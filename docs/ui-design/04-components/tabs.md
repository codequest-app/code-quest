# 選項卡組件 (Tabs Component)

**類別**: Core UI Components
**版本**: v1.0

## 組件概述
選項卡組件用於在同一區域顯示不同內容分類，支援圖標、計數徽章、鍵盤導航。

## 視覺示例
```
[全部] [消耗品] [寶物] [任務] [材料] [裝備]
  ▔▔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[內容區域]
```

## 屬性定義
```typescript
interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'pills';
  size?: 'small' | 'medium' | 'large';
}

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}
```

## 使用範例
```tsx
<Tabs
  items={[
    { id: 'all', label: '全部', badge: 25 },
    { id: 'consumables', label: '消耗品', icon: '🧪', badge: 8 },
    { id: 'equipment', label: '裝備', icon: '⚔️', badge: 5 },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

【參考：02-screens/management/inventory.md】
