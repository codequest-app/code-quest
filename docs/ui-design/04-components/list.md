# 列表組件 (List Component)

**類別**: Layout Components
**版本**: v1.0

## 組件概述
垂直列表組件，支援虛擬滾動、選擇、排序，適合顯示大量數據。

## 視覺示例
```
┌─────────────────────────────┐
│ [1] 任務: 修復登入 Bug      │
│ [2] 任務: 實作搜尋功能      │
│ [3] 任務: 優化性能          │
│ [4] 任務: 撰寫文檔          │
│ ...                         │
│ ▼ 滾動查看更多               │
└─────────────────────────────┘
```

## 屬性定義
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  
  // 虛擬滾動
  virtualized?: boolean;
  itemHeight?: number;
  
  // 選擇
  selectable?: boolean;
  multiSelect?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selected: string[]) => void;
  
  // 空狀態
  emptyMessage?: string;
  
  // 載入
  loading?: boolean;
  onLoadMore?: () => void;
}
```

## 使用範例
```tsx
<List
  items={quests}
  virtualized={true}
  itemHeight={80}
  selectable={true}
  multiSelect={false}
  selectedItems={[selectedQuestId]}
  onSelectionChange={handleSelectQuest}
  renderItem={(quest) => (
    <QuestCard quest={quest} variant="list" />
  )}
  keyExtractor={(quest) => quest.id}
  emptyMessage="沒有可用任務"
  onLoadMore={loadMoreQuests}
/>
```

【參考：02-screens/battle/battle-main.md】
