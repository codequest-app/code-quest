# 進度條組件 (Progress Bar Component)

**類別**: Core UI Components
**版本**: v1.0
**最後更新**: 2026-02-05

---

## 組件概述

通用進度條組件，用於顯示任何類型的進度或容量。與 status-bar 不同，這是一個更通用的組件，適用於非狀態相關的進度顯示。

### 使用時機
- ✅ 背包容量顯示
- ✅ 下載/上傳進度
- ✅ 技能冷卻時間
- ✅ 任務完成進度
- ✅ 載入進度

### 不使用時機
- ❌ HP/MP/EXP 顯示（使用 status-bar）
- ❌ 時間倒數（使用 countdown 組件）

---

## 視覺示例

### 基本進度條
```
████████░░ 80%
```

### 帶標籤的進度條
```
背包容量: ████████████░░░░░░░░░░░░  25/50
```

### 多段進度條
```
任務進度:
Step 1: ██████████ 100% ✓
Step 2: ████████░░ 80%  ⏳
Step 3: ░░░░░░░░░░ 0%   🔒
```

### 緩衝進度條
```
載入中: ▓▓▓▓▓▓▓░░░ 70% (緩衝 85%)
        ▓ 已載入
        ░ 緩衝中
        □ 未載入
```

---

## 變體 (Variants)

### 1. 基本型 (Basic)
```
████████░░ 80%
```

### 2. 標籤型 (Labeled)
```
背包: ████████░░ 25/50
```

### 3. 百分比型 (Percentage)
```
████████░░ 80%
```

### 4. 分段型 (Segmented)
```
█ █ █ █ █ █ █ █ □ □
```

### 5. 緩衝型 (Buffered)
```
▓▓▓▓▓▓▓░░░ (已載入/緩衝中)
```

### 6. 循環型 (Circular)
```
    ⌛
   ◐ 75%
```

---

## 屬性定義 (Props)

```typescript
interface ProgressBarProps {
  // 基本屬性
  value: number;
  max: number;
  min?: number;

  // 顯示模式
  variant?: 'basic' | 'labeled' | 'percentage' | 'segmented' | 'buffered' | 'circular';
  size?: 'small' | 'medium' | 'large';

  // 標籤
  label?: string;
  showValue?: boolean;
  showPercentage?: boolean;
  valueFormat?: 'number' | 'percentage' | 'time';

  // 顏色
  color?: string;
  backgroundColor?: string;
  bufferColor?: string;

  // 緩衝（用於載入進度）
  buffer?: number;

  // 分段
  segments?: number;

  // 動畫
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean; // 不確定進度

  // 狀態
  status?: 'normal' | 'warning' | 'danger' | 'success';

  // 樣式
  height?: number;
  borderRadius?: number;

  // 事件
  onChange?: (value: number) => void;
  onComplete?: () => void;
}
```

### 預設值
```typescript
const defaultProps: ProgressBarProps = {
  min: 0,
  variant: 'basic',
  size: 'medium',
  showValue: true,
  showPercentage: false,
  valueFormat: 'number',
  animated: true,
  striped: false,
  indeterminate: false,
  status: 'normal',
  height: 20,
  borderRadius: 4,
};
```

---

## 視覺規格

### 尺寸規格
```
Small:
  Height: 12px
  Font: 12px
  Padding: 2px

Medium:
  Height: 20px
  Font: 14px
  Padding: 4px

Large:
  Height: 28px
  Font: 16px
  Padding: 6px
```

### 顏色規格
```css
/* 狀態顏色 */
--progress-normal: #3498DB;
--progress-warning: #F59E0B;
--progress-danger: #EF4444;
--progress-success: #10b981;

/* 背景 */
--progress-bg: #2a2a2a;
--progress-border: #404040;
--progress-buffer: rgba(52, 152, 219, 0.3);
```

---

## 動畫規格

【參考：01-design-system/animation-timing.md】

### 進度變化動畫
```css
@keyframes progress-fill {
  from {
    width: var(--old-value);
  }
  to {
    width: var(--new-value);
  }
}

.progress-fill {
  transition: width 300ms ease-out;
}
```

### 條紋動畫（載入中）
```css
@keyframes progress-stripes {
  0% {
    background-position: 40px 0;
  }
  100% {
    background-position: 0 0;
  }
}

.progress-fill.striped {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  animation: progress-stripes 1s linear infinite;
}
```

### 不確定進度動畫
```css
@keyframes progress-indeterminate {
  0% {
    left: -40%;
    width: 40%;
  }
  100% {
    left: 100%;
    width: 40%;
  }
}

.progress-fill.indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
```

---

## 使用範例

### React 範例
```tsx
import { ProgressBar } from '@/components/ui/progress-bar';

function InventoryScreen() {
  const [capacity, setCapacity] = useState({ current: 25, max: 50 });

  return (
    <div>
      <ProgressBar
        variant="labeled"
        label="背包容量"
        value={capacity.current}
        max={capacity.max}
        status={capacity.current >= capacity.max * 0.9 ? 'warning' : 'normal'}
        showValue={true}
        onComplete={() => {
          showToast('背包已滿！');
        }}
      />
    </div>
  );
}

// 載入進度
function LoadingScreen() {
  return (
    <ProgressBar
      variant="buffered"
      value={70}
      buffer={85}
      max={100}
      striped={true}
      animated={true}
      showPercentage={true}
    />
  );
}

// 任務進度
function QuestProgress() {
  return (
    <ProgressBar
      variant="segmented"
      value={7}
      max={10}
      segments={10}
      status="normal"
    />
  );
}
```

### HTML/CSS 範例
```html
<div class="progress-bar">
  <div class="progress-label">背包容量</div>
  <div class="progress-track">
    <div
      class="progress-fill"
      style="width: 50%"
      role="progressbar"
      aria-valuenow="25"
      aria-valuemin="0"
      aria-valuemax="50"
    ></div>
  </div>
  <div class="progress-value">25/50</div>
</div>
```

```css
.progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-track {
  flex: 1;
  height: 20px;
  background: var(--progress-bg);
  border: 2px solid var(--progress-border);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--progress-normal);
  transition: width 300ms ease-out;
}

.progress-fill.warning {
  background: var(--progress-warning);
}

.progress-fill.striped {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  animation: progress-stripes 1s linear infinite;
}
```

---

## 無障礙支援

### ARIA 屬性
```html
<div
  role="progressbar"
  aria-label="背包容量"
  aria-valuenow="25"
  aria-valuemin="0"
  aria-valuemax="50"
  aria-valuetext="25 out of 50 items"
>
  <div class="progress-track">
    <div class="progress-fill" style="width: 50%"></div>
  </div>
  <span>25/50</span>
</div>
```

### 不確定進度
```html
<div
  role="progressbar"
  aria-label="載入中"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="載入中，請稍候"
  aria-busy="true"
>
  <div class="progress-fill indeterminate"></div>
</div>
```

---

## 相關組件

- 【參考：04-components/status-bar.md】- 玩家狀態顯示
- 【參考：04-components/slider.md】- 可調整的滑桿組件

---

**版本**: v1.0
**創建日期**: 2026-02-05
**狀態**: ✅ 完成
