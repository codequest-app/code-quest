# 模態框組件 (Modal Component)

**類別**: Core UI Components
**版本**: v1.0

## 組件概述
模態框是覆蓋在主內容上的彈出層，用於顯示詳細信息或執行操作。

## 視覺示例
```
[背景遮罩 opacity: 0.8]

    ┌─────────────────────────────┐
    │ 物品詳情           [✕]      │
    ├─────────────────────────────┤
    │                             │
    │ [詳細內容]                   │
    │                             │
    ├─────────────────────────────┤
    │        [確定]  [取消]        │
    └─────────────────────────────┘
```

## 屬性定義
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  
  footer?: React.ReactNode;
}
```

## 使用範例
```tsx
<Modal
  isOpen={showItemDetails}
  onClose={() => setShowItemDetails(false)}
  title="物品詳情"
  size="medium"
  closeOnBackdrop={true}
  closeOnEsc={true}
>
  <ItemDetails item={selectedItem} />
</Modal>
```

## 焦點陷阱
Modal 必須實現焦點陷阱，Tab 鍵只能在 Modal 內循環。

【參考：01-design-system/animation-timing.md】
