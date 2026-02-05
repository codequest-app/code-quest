# 對話框組件 (Dialog Component)

**類別**: Core UI Components
**版本**: v1.0

## 組件概述
對話框用於確認操作、顯示警告或請求用戶決策。

## 視覺示例
```
┌─────────────────────────────────┐
│ ⚠️ 確認刪除                     │
├─────────────────────────────────┤
│                                 │
│ 確定要刪除這個物品嗎？           │
│ 此操作無法撤銷。                 │
│                                 │
├─────────────────────────────────┤
│      [取消]      [確定刪除]      │
└─────────────────────────────────┘
```

## 屬性定義
```typescript
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  
  confirmText?: string;
  cancelText?: string;
  
  confirmButtonVariant?: 'primary' | 'danger';
}
```

## 使用範例
```tsx
<Dialog
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  type="danger"
  title="確認刪除"
  message="確定要刪除這個物品嗎？此操作無法撤銷。"
  confirmText="確定刪除"
  cancelText="取消"
  confirmButtonVariant="danger"
/>
```

## 快捷鍵
- **Enter**: 確認
- **Esc**: 取消
