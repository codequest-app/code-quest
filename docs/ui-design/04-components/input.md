# 輸入框組件 (Input Component)

**類別**: Core UI Components
**版本**: v1.0
**最後更新**: 2026-02-05

## 組件概述

通用文字輸入組件，支援單行/多行輸入、驗證、搜尋等功能。

### 使用時機
- ✅ 表單輸入
- ✅ 搜尋框
- ✅ 聊天輸入
- ✅ 命令輸入

## 視覺示例

### 基本輸入框
```
┌────────────────────────────────┐
│ 請輸入你的問題...              │
└────────────────────────────────┘
```

### 帶標籤
```
玩家名稱:
┌────────────────────────────────┐
│ CodeMaster                     │
└────────────────────────────────┘
```

### 搜尋框
```
┌────────────────────────────────┐
│ 🔍 搜尋物品...                  │
└────────────────────────────────┘
```

### 錯誤狀態
```
MP 消耗:
┌────────────────────────────────┐
│ abc                      ❌    │
└────────────────────────────────┘
  ⚠️ 請輸入有效數字
```

## 屬性定義

```typescript
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  placeholder?: string;
  label?: string;
  
  // 驗證
  error?: string;
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  
  // 狀態
  disabled?: boolean;
  readOnly?: boolean;
  
  // 樣式
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  
  // 圖標
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // 自動完成
  autoComplete?: string[];
  
  // 事件
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: () => void;
}
```

## 狀態

1. **Normal** - 預設狀態
2. **Focus** - 焦點狀態，藍色邊框發光
3. **Error** - 錯誤狀態，紅色邊框
4. **Disabled** - 禁用狀態，灰色
5. **ReadOnly** - 唯讀狀態

## 使用範例

```tsx
<Input
  label="玩家名稱"
  value={name}
  onChange={setName}
  placeholder="請輸入名稱"
  required={true}
  minLength={3}
  maxLength={20}
  error={nameError}
/>

<Input
  type="search"
  placeholder="搜尋物品..."
  icon={<SearchIcon />}
  iconPosition="left"
  autoComplete={recentSearches}
/>
```

【參考：01-design-system/colors-and-typography.md】
