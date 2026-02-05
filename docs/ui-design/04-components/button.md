# 按鈕組件 (Button Component)

**類別**: Core UI Components
**版本**: v1.0
**最後更新**: 2026-02-05

---

## 組件概述

按鈕是最基本的互動組件，用於觸發動作和導航。RPG-CLI 使用 Pixel Art 風格的按鈕設計，具有 3D 深度效果和按壓動畫。

### 使用時機
- ✅ 確認/取消操作
- ✅ 表單提交
- ✅ 導航觸發
- ✅ 行動選單
- ✅ 工具列功能

### 不使用時機
- ❌ 純文字連結（使用 Link 組件）
- ❌ 切換開關（使用 Toggle 組件）
- ❌ 選項卡（使用 Tabs 組件）

---

## 視覺示例

### 基本按鈕
```
┌─────────┐
│ 確定    │
└─────────┘
```

### 帶圖標按鈕
```
┌──────────────┐
│ ⚔️ 使用技能 │
└──────────────┘
```

### 按鈕狀態
```
Normal:    ┌─────────┐
           │ 確定    │
           └─────────┘

Hover:     ┌─────────┐  ↑ 上移 2px
           │ 確定    │  陰影加深
           └─────────┘

Active:    ┌─────────┐  ↓ 下移 2px
           │ 確定    │  陰影減少
           └─────────┘

Disabled:  ┌─────────┐
           │ 確定    │  灰色、半透明
           └─────────┘

Loading:   ┌─────────┐
           │ ⏳ 處理中│  動畫
           └─────────┘
```

---

## 變體 (Variants)

### 1. Primary（主要按鈕）
```
┌──────────────┐
│ 確定        │  綠色/藍色
└──────────────┘
```
- 用於主要操作（確認、提交、繼續）
- 探索模式：綠色
- 戰鬥模式：紅色

### 2. Secondary（次要按鈕）
```
┌──────────────┐
│ 取消        │  灰色
└──────────────┘
```
- 用於次要操作（取消、返回）

### 3. Danger（危險按鈕）
```
┌──────────────┐
│ 刪除        │  紅色
└──────────────┘
```
- 用於破壞性操作（刪除、丟棄）

### 4. Success（成功按鈕）
```
┌──────────────┐
│ 完成        │  綠色
└──────────────┘
```
- 用於完成操作

### 5. Icon Button（圖標按鈕）
```
┌────┐
│ ⚙️ │
└────┘
```
- 僅圖標，無文字
- 用於工具列

### 6. Text Button（文字按鈕）
```
[ 查看詳情 ]
```
- 無邊框，僅文字
- 用於次要連結

### 7. Ghost Button（幽靈按鈕）
```
┌──────────────┐
│ 跳過        │  透明背景
└──────────────┘
```
- 透明背景，僅邊框
- 用於低優先級操作

---

## 屬性定義 (Props)

```typescript
interface ButtonProps {
  // 基本屬性
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;

  // 變體
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';

  // 圖標
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;

  // 狀態
  loading?: boolean;
  active?: boolean;

  // 樣式
  fullWidth?: boolean;
  theme?: 'explore' | 'battle';

  // 快捷鍵
  shortcut?: string;
  showShortcut?: boolean;

  // 事件
  onClick?: (e: React.MouseEvent) => void;
  onLongPress?: () => void;

  // 其他
  className?: string;
  'aria-label'?: string;
}
```

### 預設值
```typescript
const defaultProps: ButtonProps = {
  type: 'button',
  disabled: false,
  variant: 'primary',
  size: 'medium',
  iconPosition: 'left',
  iconOnly: false,
  loading: false,
  active: false,
  fullWidth: false,
  theme: 'explore',
  showShortcut: true,
};
```

---

## 視覺規格

### 尺寸規格
```
Small:
  Height: 32px
  Padding: 8px 16px
  Font Size: 12px
  Icon Size: 16px

Medium (預設):
  Height: 40px
  Padding: 12px 24px
  Font Size: 14px
  Icon Size: 20px

Large:
  Height: 48px
  Padding: 16px 32px
  Font Size: 16px
  Icon Size: 24px
```

### 顏色規格

【參考：01-design-system/colors-and-typography.md】

```css
/* Primary (Explore) */
--btn-primary-bg: linear-gradient(to bottom, #4caf50, #388e3c);
--btn-primary-border: #2e7d32;
--btn-primary-shadow: #1b5e20;
--btn-primary-text: #ffffff;

/* Primary (Battle) */
--btn-battle-bg: linear-gradient(to bottom, #f44336, #d32f2f);
--btn-battle-border: #b71c1c;
--btn-battle-shadow: #7f0000;
--btn-battle-text: #ffffff;

/* Secondary */
--btn-secondary-bg: linear-gradient(to bottom, #757575, #616161);
--btn-secondary-border: #424242;
--btn-secondary-shadow: #212121;
--btn-secondary-text: #ffffff;

/* Danger */
--btn-danger-bg: linear-gradient(to bottom, #ef4444, #dc2626);
--btn-danger-border: #b91c1c;
--btn-danger-shadow: #7f1d1d;
--btn-danger-text: #ffffff;

/* Disabled */
--btn-disabled-bg: #757575;
--btn-disabled-text: #bdbdbd;
--btn-disabled-opacity: 0.5;
```

### 字體規格
```css
font-family: 'Press Start 2P', monospace;
font-size: 14px;
font-weight: 400;
text-transform: none;
letter-spacing: 0.5px;
text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
```

### 陰影規格
```css
/* Normal */
box-shadow: 0 4px 0 var(--btn-shadow-color);

/* Hover */
box-shadow: 0 6px 0 var(--btn-shadow-color);

/* Active */
box-shadow: 0 2px 0 var(--btn-shadow-color);

/* Disabled */
box-shadow: none;
```

---

## 狀態和行為

### 狀態定義

#### 1. Normal（正常）
```
┌──────────────┐
│ 確定        │
└──────────────┘
```
- 預設狀態
- 可點擊

#### 2. Hover（懸停）
```
┌──────────────┐  ↑ transform: translateY(-2px)
│ 確定        │  陰影: 0 6px
└──────────────┘
```
- 滑鼠懸停
- 輕微上移
- 陰影加深

#### 3. Active（按下）
```
┌──────────────┐  ↓ transform: translateY(2px)
│ 確定        │  陰影: 0 2px
└──────────────┘
```
- 滑鼠按下或鍵盤按下
- 向下移動
- 陰影減少

#### 4. Focus（焦點）
```
┌──────────────┐
│ 確定        │  ← 邊框發光
└──────────────┘
   outline: 3px solid #00ccff
```
- 鍵盤導航焦點
- 藍色發光邊框

#### 5. Disabled（禁用）
```
┌──────────────┐
│ 確定        │  灰色、半透明
└──────────────┘
   opacity: 0.5
   cursor: not-allowed
```
- 不可點擊
- 灰色顯示

#### 6. Loading（載入中）
```
┌──────────────┐
│ ⏳ 處理中... │  旋轉動畫
└──────────────┘
```
- 顯示載入指示器
- 禁用點擊

---

## 動畫規格

【參考：01-design-system/animation-timing.md】

### Hover 動畫
```css
.button {
  transition: all 150ms ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--btn-shadow-color);
}
```

### Active 動畫
```css
.button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--btn-shadow-color);
  transition: all 100ms ease;
}
```

### Loading 動畫
```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.button-loading-icon {
  animation: spin 1s linear infinite;
}
```

---

## 使用者互動

### 鍵盤操作
```
Enter / Space: 觸發按鈕
Tab:           焦點移到下一個按鈕
Shift+Tab:     焦點移到上一個按鈕
Esc:           移除焦點
```

### 滑鼠操作
```
Click:       觸發按鈕
Hover:       顯示 hover 狀態
Long Press:  觸發長按事件（可選）
```

### 觸控操作
```
Tap:         觸發按鈕
Long Press:  觸發長按事件
```

### 快捷鍵顯示
```
┌──────────────────┐
│ 確定      [Enter]│
└──────────────────┘

┌──────────────────┐
│ ⚔️ 技能      [1] │
└──────────────────┘
```

---

## 使用範例

### React 範例
```tsx
import { Button } from '@/components/ui/button';

function BattleScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAttack = async () => {
    setIsLoading(true);
    await performAttack();
    setIsLoading(false);
  };

  return (
    <div>
      {/* Primary button */}
      <Button
        variant="primary"
        size="large"
        icon={<span>⚔️</span>}
        onClick={handleAttack}
        loading={isLoading}
        shortcut="1"
      >
        使用技能
      </Button>

      {/* Secondary button */}
      <Button
        variant="secondary"
        onClick={handleCancel}
        shortcut="Esc"
      >
        取消
      </Button>

      {/* Danger button */}
      <Button
        variant="danger"
        onClick={handleDiscard}
        disabled={!canDiscard}
      >
        丟棄
      </Button>

      {/* Icon only button */}
      <Button
        variant="ghost"
        size="small"
        iconOnly={true}
        icon={<span>⚙️</span>}
        aria-label="設定"
      />

      {/* Full width button */}
      <Button
        variant="success"
        fullWidth={true}
      >
        完成
      </Button>
    </div>
  );
}
```

### HTML/CSS 範例
```html
<button
  class="button button--primary button--medium"
  type="button"
>
  <span class="button-icon">⚔️</span>
  <span class="button-text">使用技能</span>
  <span class="button-shortcut">[1]</span>
</button>
```

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: 3px solid var(--btn-border);
  border-radius: 0;
  background: var(--btn-bg);
  color: var(--btn-text);
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 0 var(--btn-shadow);
  cursor: pointer;
  transition: all 150ms ease;
  user-select: none;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--btn-shadow);
}

.button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--btn-shadow);
}

.button:focus {
  outline: 3px solid #00ccff;
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 0 var(--btn-shadow);
}

.button--primary {
  --btn-bg: linear-gradient(to bottom, #4caf50, #388e3c);
  --btn-border: #2e7d32;
  --btn-shadow: #1b5e20;
  --btn-text: #ffffff;
}

.button--secondary {
  --btn-bg: linear-gradient(to bottom, #757575, #616161);
  --btn-border: #424242;
  --btn-shadow: #212121;
  --btn-text: #ffffff;
}

.button-shortcut {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.7;
}
```

---

## 無障礙支援

### ARIA 屬性
```html
<!-- 基本按鈕 -->
<button
  type="button"
  aria-label="確定"
>
  確定
</button>

<!-- 圖標按鈕 -->
<button
  type="button"
  aria-label="設定"
>
  <span aria-hidden="true">⚙️</span>
</button>

<!-- Loading 按鈕 -->
<button
  type="button"
  aria-busy="true"
  aria-label="處理中，請稍候"
  disabled
>
  <span class="spinner" aria-hidden="true">⏳</span>
  處理中...
</button>

<!-- 快捷鍵提示 -->
<button
  type="button"
  aria-keyshortcuts="Enter"
>
  確定 <span aria-hidden="true">[Enter]</span>
</button>
```

### 焦點管理
```typescript
// 自動焦點（對話框打開時）
useEffect(() => {
  if (isModalOpen) {
    primaryButtonRef.current?.focus();
  }
}, [isModalOpen]);

// 焦點陷阱（模態框內）
function trapFocus(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    // 限制焦點在模態框內
  }
}
```

---

## 相關組件

- 【參考：04-components/input.md】- 表單輸入組件
- 【參考：04-components/dialog.md】- 對話框組件
- 【參考：04-components/tabs.md】- 選項卡組件

---

## 設計決策

### 為什麼使用 3D 深度效果？
- 符合 Pixel Art 風格
- 增強可點擊感
- 提供即時視覺反饋

### 為什麼顯示快捷鍵？
- 提高操作效率
- 幫助用戶學習快捷鍵
- 符合遊戲 UI 慣例

---

**版本**: v1.0
**創建日期**: 2026-02-05
**狀態**: ✅ 完成
