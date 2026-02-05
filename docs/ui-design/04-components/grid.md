# 網格布局組件 (Grid Component)

**類別**: Layout Components
**版本**: v1.0

## 組件概述
響應式網格布局，用於組織卡片、物品等元素，支援拖放和自動排列。

## 視覺示例
```
┌──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  6列
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┘
```

## 屬性定義
```typescript
interface GridProps<T> {
  items: T[];
  columns?: number | 'auto';
  gap?: number;
  minColumnWidth?: number;
  
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  
  // 拖放
  draggable?: boolean;
  onReorder?: (items: T[]) => void;
  
  // 響應式
  responsive?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}
```

## 使用範例
```tsx
<Grid
  items={items}
  columns={6}
  gap={16}
  responsive={{
    mobile: 2,
    tablet: 4,
    desktop: 6,
  }}
  draggable={true}
  renderItem={(item) => (
    <ItemCard item={item} />
  )}
  keyExtractor={(item) => item.id}
  onReorder={handleReorder}
/>
```

【參考：02-screens/management/inventory.md】
