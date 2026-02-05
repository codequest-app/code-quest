# 狀態列組件 (Status Bar Component)

**類別**: Core UI Components
**版本**: v1.0
**最後更新**: 2026-02-05

---

## 組件概述

狀態列組件顯示玩家的核心資源（HP、MP、EXP）及其他關鍵狀態指標。這是一個持續顯示的組件，通常固定在畫面頂部或特定區域。

### 使用時機
- ✅ 顯示玩家核心狀態（HP/MP/EXP）
- ✅ 戰鬥畫面、探索畫面的頂部狀態欄
- ✅ 角色面板的詳細狀態顯示
- ✅ 需要即時反饋狀態變化的場景

### 不使用時機
- ❌ 敵人狀態顯示（使用 enemy-card 組件）
- ❌ 背包容量顯示（使用 progress-bar 組件）
- ❌ 簡單的數值顯示（使用 text 組件）

---

## 視覺示例

### 基本狀態列
```
┌──────────────────────────────────────────────────────┐
│ ❤️ HP: ████████░░ 80/100  ⚡ MP: ██████░░░░ 60/100   │
│ ⭐ EXP: ████░░░░░░ 450/1000  Lv.15  💰 1,250 Gold    │
└──────────────────────────────────────────────────────┘
```

### 緊湊模式（戰鬥畫面頂部）
```
┌────────────────────────────────────────────────┐
│ ⚔️ 戰鬥模式      💰 450  ⚡ 75/100  💚 85/100 │
└────────────────────────────────────────────────┘
```

### 詳細模式（角色面板）
```
┌─────────────────────────────────┐
│ 👤 CodeMaster      Lv.15        │
│                                 │
│ HP: ████████░░ 80/100           │
│     ▓▓▓▓▓▓▓▓▓▓ 80%            │
│                                 │
│ MP: ██████░░░░ 60/100           │
│     ▓▓▓▓▓▓░░░░ 60%            │
│                                 │
│ EXP: ████░░░░░░ 450/1000        │
│      下一級: 550 EXP            │
└─────────────────────────────────┘
```

---

## 變體 (Variants)

### 1. 基本狀態列 (Basic)
```
HP: ████████░░ 80/100
```
- 單行顯示
- 圖標 + 進度條 + 數值
- 適用於空間有限的場景

### 2. 緊湊狀態列 (Compact)
```
💚 85/100  ⚡ 75/100  💰 450
```
- 僅顯示圖標和數值
- 無進度條
- 適用於極小空間（手機橫屏）

### 3. 詳細狀態列 (Detailed)
```
❤️ HP: 80/100
████████░░ 80%
回復: +5/回合
```
- 多行顯示
- 包含額外信息（百分比、回復速度）
- 適用於角色面板

### 4. 動態狀態列 (Animated)
```
HP: ████████░░ 80/100 [-15]
    ↑ 傷害動畫
```
- 顯示變化值
- 播放動畫效果
- 適用於戰鬥場景

---

## 屬性定義 (Props)

```typescript
interface StatusBarProps {
  // 基本屬性
  variant?: 'basic' | 'compact' | 'detailed' | 'animated';
  size?: 'small' | 'medium' | 'large';

  // 狀態數據
  hp: StatusValue;
  mp: StatusValue;
  exp?: StatusValue;
  level?: number;
  gold?: number;

  // 顯示控制
  showIcons?: boolean;
  showPercentage?: boolean;
  showLabels?: boolean;
  showTooltips?: boolean;

  // 樣式
  barHeight?: number;
  barWidth?: string | number;
  theme?: 'explore' | 'battle';

  // 動畫
  animateChanges?: boolean;
  showDamageNumbers?: boolean;

  // 事件
  onHpChange?: (newValue: number) => void;
  onMpChange?: (newValue: number) => void;
  onLevelUp?: () => void;
}

interface StatusValue {
  current: number;
  max: number;
  regen?: number; // 回復速度（每回合）
  shield?: number; // 護盾值
}
```

### 預設值
```typescript
const defaultProps: StatusBarProps = {
  variant: 'basic',
  size: 'medium',
  showIcons: true,
  showPercentage: false,
  showLabels: true,
  showTooltips: true,
  barHeight: 20,
  barWidth: '100%',
  theme: 'explore',
  animateChanges: true,
  showDamageNumbers: true,
};
```

---

## 視覺規格

### 尺寸規格
```
Small:
  Bar Height: 16px
  Font Size: 12px
  Icon Size: 16px
  Padding: 4px

Medium (預設):
  Bar Height: 20px
  Font Size: 14px
  Icon Size: 20px
  Padding: 8px

Large:
  Bar Height: 24px
  Font Size: 16px
  Icon Size: 24px
  Padding: 12px
```

### 顏色規格
【參考：01-design-system/colors-and-typography.md】

```css
/* HP 條 */
--hp-color: #4caf50;        /* 正常 (>50%) */
--hp-warning: #ffc107;      /* 警告 (20-50%) */
--hp-danger: #E74C3C;       /* 危險 (<20%) */
--hp-gradient: linear-gradient(to right, #4caf50, #8bc34a);

/* MP 條 */
--mp-color: #3498DB;
--mp-gradient: linear-gradient(to right, #2196f3, #64b5f6);

/* EXP 條 */
--exp-color: #F39C12;
--exp-gradient: linear-gradient(to right, #ffc107, #ffd54f);
--exp-levelup: #FFD700;     /* 升級閃光 */

/* 背景 */
--bar-bg: #2a2a2a;
--bar-border: #404040;
```

### 字體規格
【參考：01-design-system/colors-and-typography.md】

```css
font-family: 'Roboto Mono', monospace;
font-size: 14px;
font-weight: 400;
line-height: 1.4;

/* 數值 */
.status-value {
  font-weight: 700;
  color: #ffffff;
}

/* 標籤 */
.status-label {
  font-weight: 400;
  color: #b8b8b8;
}
```

### 佈局規格
```
┌─────────────────────────────────┐
│ [Icon] Label: [████░░] Value    │
│ ↑      ↑      ↑        ↑        │
│ 20px   auto   flex-1   80px     │
│        8px    12px     8px      │
└─────────────────────────────────┘

Padding: 8px
Gap: 8px (between elements)
Border: 2px solid #404040
Border-radius: 4px
```

---

## 狀態和行為

### 狀態定義

#### 1. 正常狀態 (Normal)
```
HP: ████████░░ 80/100
```
- HP > 50%: 綠色
- MP > 30%: 藍色
- 無動畫

#### 2. 警告狀態 (Warning)
```
HP: ████░░░░░░ 40/100  ⚠️
```
- HP 20-50%: 黃色
- MP 10-30%: 淡藍色
- 輕微脈動動畫

#### 3. 危險狀態 (Critical)
```
HP: ██░░░░░░░░ 15/100  ❗
```
- HP < 20%: 紅色閃爍
- MP < 10%: 灰色
- 強烈脈動 + 警告音效

#### 4. 滿值狀態 (Full)
```
HP: ██████████ 100/100 ✨
```
- 進度條發光
- 完成感動畫

#### 5. 變化中狀態 (Changing)
```
HP: ████████░░ 80/100 [-15]
    ↑ 減少動畫
```
- 顯示變化數值
- 平滑過渡動畫
- 浮動數字效果

#### 6. 升級狀態 (Level Up)
```
⭐ LEVEL UP! ⭐
EXP: ██████████ → 0/1500
Lv.15 → Lv.16
```
- 閃光動畫
- 粒子效果
- 音效和震動

---

## 狀態轉換

### HP/MP 變化流程
```
1. 檢測數值變化
2. 計算變化量（delta）
3. 觸發變化動畫
   - 進度條平滑過渡（300-500ms）
   - 顯示浮動數字（1000ms）
   - 播放音效
4. 檢查閾值
   - 進入警告/危險狀態
   - 觸發警告效果
5. 更新完成
```

### 升級流程
```
1. EXP 達到上限
2. 觸發升級動畫
   - 閃光效果（3次，300ms間隔）
   - 粒子爆發
3. 顯示升級面板
4. EXP 條重置
5. 更新等級顯示
```

---

## 使用者互動

### 鍵盤互動
- 無直接鍵盤互動（被動顯示組件）
- 可通過快捷鍵觸發相關操作（如 `H` 使用 HP 藥水）

### 滑鼠互動
```
Hover: 顯示詳細工具提示
  ┌─────────────────────┐
  │ HP: 80/100 (80%)    │
  │ 回復: +5/回合       │
  │ 護盾: 20            │
  │ 狀態: 健康          │
  └─────────────────────┘

Click: 打開詳細面板（可選）
```

### 觸控互動
```
Tap: 顯示完整狀態
Long Press: 顯示詳細統計
```

---

## 動畫規格

【參考：01-design-system/animation-timing.md】

### HP/MP 變化動畫
```css
@keyframes hp-change {
  0% {
    width: var(--old-width);
  }
  100% {
    width: var(--new-width);
  }
}

.hp-bar-fill {
  transition: width 500ms ease-out;
}
```

**時序**: 500ms, ease-out

### 低血量閃爍
```css
@keyframes low-hp-flash {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 20px rgba(244, 67, 54, 1);
  }
}

.hp-bar-fill.critical {
  animation: low-hp-flash 1s infinite;
}
```

**時序**: 1000ms, infinite loop

### 升級閃光
```css
@keyframes level-up-flash {
  0%, 100% {
    background: rgba(255, 215, 0, 0);
  }
  50% {
    background: rgba(255, 215, 0, 0.8);
  }
}

.status-bar.level-up {
  animation: level-up-flash 300ms ease-in-out 3;
}
```

**時序**: 300ms × 3次 = 900ms

### 浮動數字
```css
@keyframes damage-float {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-40px);
    opacity: 0;
  }
}

.damage-number {
  animation: damage-float 1000ms ease-out forwards;
}
```

**時序**: 1000ms

---

## 無障礙支援

### ARIA 屬性
```html
<div
  role="region"
  aria-label="玩家狀態"
  class="status-bar"
>
  <!-- HP -->
  <div
    role="progressbar"
    aria-label="生命值"
    aria-valuenow="80"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="80 out of 100 HP"
  >
    <span aria-hidden="true">❤️</span>
    <span class="sr-only">HP:</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 80%"></div>
    </div>
    <span>80/100</span>
  </div>

  <!-- MP -->
  <div
    role="progressbar"
    aria-label="魔力值"
    aria-valuenow="60"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="60 out of 100 MP"
  >
    <span aria-hidden="true">⚡</span>
    <span class="sr-only">MP:</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 60%"></div>
    </div>
    <span>60/100</span>
  </div>
</div>
```

### 鍵盤導航
- 不需要焦點（被動顯示組件）
- 使用 `aria-live="polite"` 通知變化

### 螢幕閱讀器
```html
<div aria-live="polite" aria-atomic="true">
  HP 從 100 減少到 85
</div>

<div aria-live="assertive" aria-atomic="true">
  警告：HP 低於 20%！
</div>
```

### 色盲友好
```
不只用顏色區分狀態：
✅ HP: ████████░░ 80/100  (正常，綠色)
⚠️ HP: ████░░░░░░ 40/100  (警告，黃色 + 圖標)
❗ HP: ██░░░░░░░░ 15/100  (危險，紅色 + 圖標 + 閃爍)
```

---

## 使用範例

### React 組件範例
```tsx
import { StatusBar } from '@/components/ui/status-bar';

function BattleScreen() {
  const [playerState, setPlayerState] = useState({
    hp: { current: 80, max: 100 },
    mp: { current: 60, max: 100 },
    exp: { current: 450, max: 1000 },
    level: 15,
    gold: 1250,
  });

  return (
    <div className="battle-screen">
      <StatusBar
        variant="compact"
        size="medium"
        theme="battle"
        hp={playerState.hp}
        mp={playerState.mp}
        gold={playerState.gold}
        animateChanges={true}
        showDamageNumbers={true}
        onHpChange={(newHp) => {
          console.log('HP changed to:', newHp);
        }}
        onLevelUp={() => {
          showLevelUpModal();
        }}
      />
    </div>
  );
}
```

### HTML/CSS 範例
```html
<div class="status-bar status-bar--basic">
  <!-- HP -->
  <div class="status-item status-item--hp">
    <span class="status-icon">❤️</span>
    <span class="status-label">HP:</span>
    <div class="status-bar-track">
      <div
        class="status-bar-fill status-bar-fill--hp"
        style="width: 80%"
        data-animate="true"
      ></div>
    </div>
    <span class="status-value">80/100</span>
  </div>

  <!-- MP -->
  <div class="status-item status-item--mp">
    <span class="status-icon">⚡</span>
    <span class="status-label">MP:</span>
    <div class="status-bar-track">
      <div
        class="status-bar-fill status-bar-fill--mp"
        style="width: 60%"
      ></div>
    </div>
    <span class="status-value">60/100</span>
  </div>
</div>
```

### CSS 樣式
```css
.status-bar {
  display: flex;
  gap: 16px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-bar-track {
  width: 120px;
  height: 20px;
  background: var(--bar-bg);
  border: 2px solid var(--bar-border);
  border-radius: 4px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  transition: width 500ms ease-out;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
}

.status-bar-fill--hp {
  background: linear-gradient(to right, #4caf50, #8bc34a);
}

.status-bar-fill--hp.warning {
  background: linear-gradient(to right, #ffc107, #ffeb3b);
}

.status-bar-fill--hp.critical {
  background: linear-gradient(to right, #f44336, #ff7961);
  animation: low-hp-flash 1s infinite;
}

.status-bar-fill--mp {
  background: linear-gradient(to right, #2196f3, #64b5f6);
}

.status-value {
  font-weight: 700;
  color: var(--text-primary);
  min-width: 60px;
  text-align: right;
}
```

---

## 實作注意事項

### 效能考量
```typescript
// ✅ 好 - 使用 CSS transitions
<div
  className="hp-bar-fill"
  style={{ width: `${hpPercentage}%` }}
/>

// ❌ 壞 - 使用 JavaScript 動畫
setInterval(() => {
  currentWidth += 1;
  element.style.width = currentWidth + '%';
}, 10);
```

### 記憶體管理
```typescript
// 清理浮動數字元素
const floatingNumber = document.createElement('div');
floatingNumber.className = 'damage-number';
container.appendChild(floatingNumber);

setTimeout(() => {
  floatingNumber.remove(); // 1秒後移除
}, 1000);
```

### 狀態同步
```typescript
// 使用 React Context 或狀態管理工具
const { playerState } = useGameContext();

useEffect(() => {
  // 監聽 HP 變化
  if (playerState.hp.current < playerState.hp.max * 0.2) {
    playWarningSound();
  }
}, [playerState.hp.current]);
```

### 瀏覽器兼容性
- CSS Grid/Flexbox: 所有現代瀏覽器
- CSS Transitions: IE10+
- CSS Animations: IE10+
- 考慮使用 Autoprefixer

### 移動端考量
- 觸控友好的工具提示（長按而非懸停）
- 較大的圖標（24px 而非 20px）
- 簡化的緊湊模式

---

## 相關組件

### 進度條組件
【參考：04-components/progress-bar.md】
- 用於非狀態相關的進度顯示
- 背包容量、下載進度等

### 敵人卡片
【參考：04-components/enemy-card.md】
- 敵人的 HP 顯示
- 不同的視覺風格

### 浮動數字
【參考：04-components/damage-number.md】
- 傷害/治療數字動畫
- 與狀態列配合使用

---

## 設計決策

### 為什麼使用進度條而非純數字？
- 視覺直觀：一眼看出剩餘百分比
- 符合 RPG 遊戲慣例
- 顏色編碼提供快速狀態識別

### 為什麼 HP 警告閾值是 20%？
- 參考經典 RPG 遊戲（FF、DQ）
- 留給玩家足夠反應時間
- 不會太早造成視覺疲勞

### 為什麼使用漸層而非純色？
- Pixel Art 風格的現代化
- 增加視覺深度
- 更好的視覺吸引力

### 未來改進
- [ ] 支援護盾值顯示（在 HP 條上方）
- [ ] 支援多段式 HP 條（大 BOSS）
- [ ] 支援自定義圖標
- [ ] 支援垂直排列模式
- [ ] 支援主題切換動畫

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
