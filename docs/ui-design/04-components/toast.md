# Toast 通知組件 (Toast Component)

**類別**: Core UI Components
**版本**: v1.0

## 組件概述
Toast 是一種輕量級的浮動通知，用於提供即時反饋，自動消失。

## 視覺示例
```
位置: 右上角

┌────────────────────────┐
│ ✅ 操作成功！          │
│ 物品已添加到背包       │
└────────────────────────┘
  [3秒後自動消失]

┌────────────────────────┐
│ ⚠️ MP 不足！           │
│ 請使用 MP 藥水恢復     │
└────────────────────────┘

┌────────────────────────┐
│ ❌ 操作失敗             │
│ 請稍後重試             │
└────────────────────────┘
```

## 屬性定義
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number; // ms, 0 = 不自動關閉
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  closable?: boolean;
  icon?: React.ReactNode;
  onClose?: () => void;
}

// 使用函數式 API
function showToast(props: ToastProps): void;
```

## 使用範例
```tsx
// 成功通知
showToast({
  type: 'success',
  message: '操作成功！',
  description: '物品已添加到背包',
  duration: 3000,
  position: 'top-right',
});

// 錯誤通知
showToast({
  type: 'error',
  message: '操作失敗',
  description: '請稍後重試',
  duration: 5000,
});

// 永久通知（需手動關閉）
showToast({
  type: 'info',
  message: '系統維護通知',
  description: '系統將於 10 分鐘後維護',
  duration: 0,
  closable: true,
});
```

## Toast 堆疊
多個 Toast 會自動堆疊顯示，間距 8px。

【參考：01-design-system/animation-timing.md】
