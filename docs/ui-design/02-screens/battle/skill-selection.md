# 技能選擇介面 (Skill Selection)

## 畫面概述

- **功能定位**: 戰鬥中選擇和施放技能的介面
- **進入條件**: 在戰鬥中點擊「使用技能」按鈕
- **退出條件**: 選擇技能施放、點擊返回或按 Esc
- **場景模式**: 戰鬥模式子畫面（覆蓋層）

## 完整布局

```
┌──────────────────────────────────────────────────────────────┐
│                    戰鬥畫面（背景暗化 50%）                    │
│                                                              │
│         ┌──────────────────────────────────────┐            │
│         │  🔮 選擇技能                         │            │
│         ├──────────────────────────────────────┤            │
│         │                                      │            │
│         │  MP: ████░░░░░░ 75/100               │            │
│         │                                      │            │
│         │  【可用技能】                         │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🔮 code-generator    [Ctrl+1] │ │            │
│         │  │ 造成 120-150 傷害              │ │            │
│         │  │ MP: 30  |  冷卻: ✅ 準備完成   │ │            │
│         │  │ 相性: 擅長 (×1.2) 🔵           │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │         [施放]                 │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 📦 code-reviewer     [Ctrl+2] │ │            │
│         │  │ 造成 150-200 傷害              │ │            │
│         │  │ MP: 40  |  冷卻: ✅ 準備完成   │ │            │
│         │  │ 相性: 非常擅長 (×1.5) ⭐       │ │            │
│         │  │ 🎯 弱點技能! 傷害加成!         │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │      [施放] ⭐推薦            │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🧪 debug-helper      [Ctrl+3] │ │            │
│         │  │ 造成 180-220 傷害 + 持續效果   │ │            │
│         │  │ MP: 50  |  冷卻: ✅ 準備完成   │ │            │
│         │  │ 相性: 極度擅長 (×1.8) ⭐⭐     │ │            │
│         │  │ 🎯 弱點技能! 最大傷害!         │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │      [施放] ⭐⭐最推薦         │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  【冷卻中】                           │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ ✏️ code-writer       [Ctrl+4] │ │            │
│         │  │ 造成 100-130 傷害              │ │            │
│         │  │ MP: 25  |  冷卻: ⏳ 2 回合    │ │            │
│         │  │        ┌──────────┐           │ │            │
│         │  │        │    2️⃣    │           │ │            │
│         │  │        └──────────┘           │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │         [冷卻中]              │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  【MP 不足】                          │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🚀 super-optimizer   [Ctrl+5] │ │            │
│         │  │ 造成 250-300 傷害 + 範圍效果   │ │            │
│         │  │ MP: 80  |  MP不足! (差 5 MP)  │ │            │
│         │  │ ⚠️ 當前 MP: 75                │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │      [無法使用]               │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  【未解鎖】                           │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🔒 ultimate-skill              │ │            │
│         │  │ 造成 500+ 傷害                 │ │            │
│         │  │ 需要: Lv.15                    │ │            │
│         │  │ ──────────────────────────────│ │            │
│         │  │      [未解鎖]                 │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │              [返回]                  │            │
│         │                                      │            │
│         └──────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 區塊劃分

### 區塊 1: 標題欄
- **內容**: "🔮 選擇技能"
- **樣式**: 深藍色背景，白色文字
- **固定**: 頂部

### 區塊 2: MP 狀態欄
- **內容**: 當前 MP 和最大 MP
- **格式**: 進度條 + 數字
- **顏色**: 藍色（MP > 50%）、黃色（20-50%）、紅色（< 20%）

### 區塊 3: 可用技能列表
- **內容**: 所有可以施放的技能
- **排序**: 按相性排序（最適合的在前）
- **高亮**: 弱點技能特別標示

### 區塊 4: 冷卻中技能
- **內容**: 正在冷卻的技能
- **顯示**: 剩餘回合數（大字體覆蓋）
- **樣式**: 灰度濾鏡

### 區塊 5: MP 不足技能
- **內容**: MP 不夠施放的技能
- **提示**: 顯示差多少 MP
- **樣式**: 暗紅色背景

### 區塊 6: 未解鎖技能
- **內容**: 尚未解鎖的技能
- **提示**: 顯示解鎖條件
- **樣式**: 鎖頭圖標 + 灰色

### 區塊 7: 底部操作欄
- **內容**: 返回按鈕
- **快捷鍵**: Esc

## 組件清單

### 共用組件（引用）
- **進度條**: `04-components/progress-bars.md` - MP 條
- **按鈕**: `04-components/buttons.md` - 施放按鈕
- **覆蓋層**: `04-components/modals.md` - 模態框

### 特有組件

#### 技能卡片 (SkillCard)
```typescript
interface SkillCardProps {
  skill: {
    id: string;
    name: string;
    icon: string;
    damage: { min: number; max: number };
    mpCost: number;
    cooldown: number;
    currentCooldown: number;
    affinity: number;
    isWeakness: boolean;
    description?: string;
  };
  playerMp: number;
  shortcut: string;
  onCast: () => void;
}

type SkillStatus = 'available' | 'cooldown' | 'insufficient_mp' | 'locked';
```

**可用狀態樣式**:
```css
.skill-card.available {
  background: linear-gradient(135deg, #1e3a5f, #2d5a88);
  border: 3px solid #4a90e2;
  cursor: pointer;
  transition: all 0.3s;
}

.skill-card.available:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
  border-color: #5ba3f5;
}

.skill-card.available.weakness {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  animation: glow-pulse 2s infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  }
}
```

**冷卻狀態樣式**:
```css
.skill-card.cooldown {
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
  border: 3px solid #555;
  cursor: not-allowed;
  filter: grayscale(0.7);
  opacity: 0.7;
}

.cooldown-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px #000;
  pointer-events: none;
}
```

**MP 不足樣式**:
```css
.skill-card.insufficient_mp {
  background: linear-gradient(135deg, #4d1a1a, #6d2a2a);
  border: 3px dashed #ff5252;
  cursor: not-allowed;
  opacity: 0.7;
}

.mp-warning {
  color: #ff5252;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}
```

**未解鎖樣式**:
```css
.skill-card.locked {
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border: 3px solid #333;
  cursor: not-allowed;
  opacity: 0.5;
}

.lock-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.8));
}
```

#### 相性標示 (AffinityBadge)
```typescript
interface AffinityBadgeProps {
  affinity: number;
  isWeakness: boolean;
}

// affinity 範圍:
// < 1.0: 不擅長 (❌)
// 1.0-1.2: 普通 (無標示)
// 1.2-1.3: 擅長 (🔵)
// 1.3-1.5: 非常擅長 (⭐)
// 1.5+: 極度擅長 (⭐⭐)
```

```css
.affinity-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.affinity-badge.poor {
  background: #f44336;
  color: #fff;
}

.affinity-badge.good {
  background: #2196f3;
  color: #fff;
}

.affinity-badge.great {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #000;
  animation: shimmer 2s infinite;
}

.affinity-badge.excellent {
  background: linear-gradient(135deg, #ff9800, #ffc107);
  color: #000;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}
```

#### 施放按鈕 (CastButton)
```typescript
interface CastButtonProps {
  isAvailable: boolean;
  isRecommended: boolean;
  onClick: () => void;
}
```

```css
.cast-button {
  width: 100%;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cast-button.available {
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  color: #fff;
  box-shadow: 0 3px 0 #2e7d32;
}

.cast-button.available:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 #2e7d32;
}

.cast-button.available:active {
  transform: translateY(1px);
  box-shadow: 0 1px 0 #2e7d32;
}

.cast-button.recommended {
  background: linear-gradient(to bottom, #ffd700, #ffc107);
  color: #000;
  box-shadow: 0 3px 0 #f57f17;
  animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
  0%, 100% {
    box-shadow: 0 3px 0 #f57f17, 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 3px 0 #f57f17, 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

.cast-button.disabled {
  background: #757575;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}
```

## 互動設計

### 鍵盤操作
- **Ctrl+1~9**: 直接施放技能槽 1-9
- **1~9**: 選中技能（高亮但不施放）
- **Enter/Space**: 施放當前選中的技能
- **↑/↓**: 在技能列表中上下選擇
- **Tab**: 循環選擇可用技能
- **Esc**: 返回戰鬥畫面
- **H**: 顯示幫助提示

### 滑鼠操作
- **左鍵點擊卡片**: 高亮選中技能
- **左鍵點擊「施放」按鈕**: 施放技能
- **右鍵點擊技能卡片**: 顯示技能詳情彈窗
- **懸停技能卡片**: 顯示完整描述和效果
- **滾輪**: 滾動技能列表

### 觸控操作
- **點擊卡片**: 選中技能
- **點擊「施放」按鈕**: 施放技能
- **長按卡片**: 顯示詳細資訊彈窗
- **滑動列表**: 滾動查看更多技能

### 快速施放
```
【快速施放模式】
按住 Ctrl:
┌──────────────────────────────┐
│ 快速施放模式已啟用            │
│ 按數字鍵 1-9 直接施放技能     │
│ 鬆開 Ctrl 退出               │
└──────────────────────────────┘
```

## 轉場設計

### 進入動畫
**時間軸**: 0.5s
```
0.0s  ├─ 背景暗化 (darken, 0.2s)
0.1s  ├─ 面板從下方滑入 (slideUp, 0.3s)
0.2s  ├─ 技能卡片逐個淡入 (fadeIn, stagger 0.05s)
0.5s  └─ 動畫完成
```

**動畫 CSS**:
```css
.skill-selection-overlay {
  animation: overlay-darken 0.2s ease-out forwards;
}

@keyframes overlay-darken {
  from {
    background: rgba(0, 0, 0, 0);
  }
  to {
    background: rgba(0, 0, 0, 0.5);
  }
}

.skill-selection-panel {
  animation: panel-slide-up 0.3s ease-out forwards;
}

@keyframes panel-slide-up {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.skill-card {
  opacity: 0;
  animation: skill-fade-in 0.3s ease-out forwards;
}

.skill-card:nth-child(1) { animation-delay: 0.2s; }
.skill-card:nth-child(2) { animation-delay: 0.25s; }
.skill-card:nth-child(3) { animation-delay: 0.3s; }
.skill-card:nth-child(4) { animation-delay: 0.35s; }
.skill-card:nth-child(5) { animation-delay: 0.4s; }

@keyframes skill-fade-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 退出動畫
**時間軸**: 0.3s
```
0.0s  ├─ 面板向下滑出 (slideDown, 0.3s)
0.1s  ├─ 背景淡出 (fadeOut, 0.2s)
0.3s  └─ 動畫完成
```

### 施放動畫
**時間軸**: 1.0s
```
0.0s  ├─ 選中技能卡片閃光 (flash, 0.2s)
0.2s  ├─ 面板快速淡出 (quickFadeOut, 0.2s)
0.4s  ├─ 技能圖標飛向敵人 (flyToEnemy, 0.3s)
0.7s  ├─ 技能特效播放
1.0s  └─ 返回戰鬥畫面
```

```css
@keyframes skill-flash {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 1);
  }
  50% {
    box-shadow: 0 0 30px 10px rgba(255, 215, 0, 0);
    transform: scale(1.05);
  }
}

@keyframes skill-icon-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--target-x), var(--target-y)) scale(0.5);
    opacity: 0.3;
  }
}
```

## 狀態變化

### 技能狀態轉換
```
未解鎖 (locked)
    ↓ 達到等級
可用 (available)
    ↓ 施放
冷卻中 (cooldown) → 每回合減少 → 可用 (available)

可用 (available)
    ↓ MP 不足
MP 不足 (insufficient_mp) → 恢復 MP → 可用 (available)
```

### MP 變化提示
```
MP 恢復時:
┌────────────────────────────┐
│ ✨ MP 恢復 +25             │
│ 新技能可用:                │
│ • super-optimizer          │
└────────────────────────────┘
```

### 技能冷卻倒數
```
冷卻 3 回合:
┌──────────────┐
│      3️⃣      │
│   還需 3 回合 │
└──────────────┘

冷卻 2 回合:
┌──────────────┐
│      2️⃣      │
│   還需 2 回合 │
└──────────────┘

冷卻 1 回合:
┌──────────────┐
│      1️⃣      │
│   下回合可用  │
└──────────────┘

可用:
┌──────────────┐
│      ✅      │
│   準備完成！  │
└──────────────┘
```

### 弱點發現效果
```
當發現敵人弱點時:
┌────────────────────────────────┐
│ 🎯 發現弱點！                   │
│ code-reviewer 將造成額外傷害！  │
│ 傷害加成: ×1.5                  │
└────────────────────────────────┘

對應技能卡片:
• 邊框變金色並發光
• 添加 "🎯 弱點技能！" 標籤
• 施放按鈕顯示 "⭐推薦"
```

## 響應式設計

### 桌面 (1200px+)
```
┌──────────────────────────────┐
│  技能列表 (2 列)              │
│  ┌───────┐  ┌───────┐        │
│  │ 技能1 │  │ 技能2 │        │
│  └───────┘  └───────┘        │
│  ┌───────┐  ┌───────┐        │
│  │ 技能3 │  │ 技能4 │        │
│  └───────┘  └───────┘        │
└──────────────────────────────┘
```

### 平板 (768-1199px)
```
┌────────────────────┐
│  技能列表 (1 列)    │
│  ┌──────────────┐  │
│  │    技能1     │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │    技能2     │  │
│  └──────────────┘  │
└────────────────────┘
```

### 手機 (<768px)
```
┌─────────────────┐
│  技能列表        │
│  (簡化卡片)      │
│  ┌───────────┐  │
│  │ 🔮 技能1  │  │
│  │ MP:30 ✅ │  │
│  │ [施放]    │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │ 📦 技能2  │  │
│  │ MP:40 ⭐ │  │
│  │ [施放]    │  │
│  └───────────┘  │
└─────────────────┘
```

**移動端優化**:
- 卡片高度減少到 80px
- 詳細資訊摺疊，點擊展開
- 施放按鈕放大到 48px 高
- 觸控目標至少 44×44px

## 無障礙設計

### ARIA 標籤
```html
<div
  role="dialog"
  aria-labelledby="skill-selection-title"
  aria-modal="true"
  class="skill-selection-overlay"
>

  <div class="skill-selection-panel">
    <h2 id="skill-selection-title">選擇技能</h2>

    <!-- MP 狀態 -->
    <div
      role="status"
      aria-live="polite"
      aria-label="MP 狀態"
    >
      <span>MP: 75/100</span>
    </div>

    <!-- 技能列表 -->
    <section aria-label="可用技能">
      <h3>可用技能</h3>

      <article
        role="button"
        aria-label="code-generator, 造成 120 到 150 傷害, 消耗 30 MP, 準備完成, 快捷鍵 Ctrl+1"
        aria-describedby="skill-1-details"
        tabindex="0"
        class="skill-card available"
      >
        <h4>🔮 code-generator</h4>
        <p id="skill-1-details">
          造成 120-150 傷害<br>
          MP: 30 | 冷卻: 準備完成<br>
          相性: 擅長 (×1.2)
        </p>
        <button
          aria-label="施放 code-generator"
          onclick="castSkill('skill-1')"
        >
          施放
        </button>
      </article>

      <article
        role="button"
        aria-label="code-reviewer, 弱點技能, 造成 150 到 200 傷害, 消耗 40 MP, 準備完成, 推薦使用, 快捷鍵 Ctrl+2"
        aria-describedby="skill-2-details"
        tabindex="0"
        class="skill-card available weakness"
      >
        <h4>📦 code-reviewer</h4>
        <span class="weakness-tag" role="img" aria-label="弱點技能">🎯</span>
        <p id="skill-2-details">
          造成 150-200 傷害<br>
          MP: 40 | 冷卻: 準備完成<br>
          相性: 非常擅長 (×1.5)<br>
          弱點技能! 傷害加成!
        </p>
        <button
          aria-label="施放 code-reviewer, 推薦"
          onclick="castSkill('skill-2')"
        >
          施放 ⭐推薦
        </button>
      </article>

    </section>

    <!-- 冷卻中技能 -->
    <section aria-label="冷卻中技能">
      <h3>冷卻中</h3>

      <article
        role="button"
        aria-label="code-writer, 冷卻中, 還需 2 回合, 快捷鍵 Ctrl+4"
        aria-disabled="true"
        tabindex="-1"
        class="skill-card cooldown"
      >
        <h4>✏️ code-writer</h4>
        <div
          role="status"
          aria-live="polite"
          aria-label="冷卻倒數 2 回合"
          class="cooldown-overlay"
        >
          2️⃣
        </div>
        <p>冷卻: 2 回合</p>
      </article>

    </section>

    <!-- 返回按鈕 -->
    <button
      aria-label="返回戰鬥畫面 (快捷鍵 Esc)"
      onclick="closeSkillSelection()"
    >
      返回
    </button>

  </div>

</div>
```

### 鍵盤導航
**Tab 順序**:
```
1. 可用技能 1 - 施放按鈕
2. 可用技能 2 - 施放按鈕
3. 可用技能 3 - 施放按鈕
4. (跳過冷卻中技能)
5. (跳過 MP 不足技能)
6. (跳過未解鎖技能)
7. 返回按鈕
```

**焦點指示**:
```css
.skill-card:focus {
  outline: 3px solid #ffd700;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px rgba(255, 215, 0, 0.3);
}

.cast-button:focus {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
```

### 螢幕閱讀器
- 進入面板時朗讀標題和 MP 狀態
- 選中技能時朗讀完整資訊
- 弱點技能優先朗讀
- 冷卻/MP不足/未解鎖狀態明確通知

## 技術規格

### 效能目標
- **面板開啟**: < 300ms
- **技能卡片渲染**: < 100ms
- **滾動流暢度**: 60 FPS
- **按鈕響應**: < 50ms

### 資料結構

```typescript
interface Skill {
  id: string;
  name: string;
  icon: string;
  damage: {
    min: number;
    max: number;
  };
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  affinity: number;
  element?: string;
  description: string;
  unlockLevel: number;
  effects?: SkillEffect[];
}

interface SkillEffect {
  type: 'damage' | 'buff' | 'debuff' | 'heal';
  value: number;
  duration?: number;
  target: 'enemy' | 'self';
}

interface SkillState {
  skill: Skill;
  status: 'available' | 'cooldown' | 'insufficient_mp' | 'locked';
  isWeakness: boolean;
  recommendationLevel: 0 | 1 | 2; // 0: 普通, 1: 推薦, 2: 最推薦
}

function getSkillStatus(
  skill: Skill,
  playerMp: number,
  playerLevel: number
): SkillState {
  // 未解鎖檢查
  if (playerLevel < skill.unlockLevel) {
    return { skill, status: 'locked', isWeakness: false, recommendationLevel: 0 };
  }

  // 冷卻檢查
  if (skill.currentCooldown > 0) {
    return { skill, status: 'cooldown', isWeakness: false, recommendationLevel: 0 };
  }

  // MP 檢查
  if (playerMp < skill.mpCost) {
    return { skill, status: 'insufficient_mp', isWeakness: false, recommendationLevel: 0 };
  }

  // 可用
  return {
    skill,
    status: 'available',
    isWeakness: checkWeakness(skill),
    recommendationLevel: calculateRecommendation(skill)
  };
}
```

### 狀態管理

```typescript
const useSkillSelectionStore = create<SkillSelectionState>((set, get) => ({
  isOpen: false,
  selectedSkillId: null,
  skills: [],

  open: (battleState: BattleState) => {
    const skills = getAvailableSkills(battleState);
    set({ isOpen: true, skills, selectedSkillId: null });
  },

  close: () => {
    set({ isOpen: false, selectedSkillId: null });
  },

  selectSkill: (skillId: string) => {
    set({ selectedSkillId: skillId });
  },

  castSkill: async (skillId: string) => {
    const { skills } = get();
    const skill = skills.find(s => s.id === skillId);

    if (!skill || skill.status !== 'available') {
      return;
    }

    // 播放施放動畫
    await playSkillCastAnimation(skill);

    // 關閉面板
    get().close();

    // 執行技能
    await executeBattleAction({ type: 'skill', skillId });
  }
}));
```

### 快捷鍵處理

```typescript
function handleSkillSelectionKeydown(event: KeyboardEvent) {
  // Ctrl + 數字: 快速施放
  if (event.ctrlKey && event.key >= '1' && event.key <= '9') {
    event.preventDefault();
    const index = parseInt(event.key) - 1;
    const skill = getSkillByIndex(index);
    if (skill?.status === 'available') {
      castSkill(skill.id);
    }
    return;
  }

  // 數字鍵: 選中技能
  if (event.key >= '1' && event.key <= '9') {
    event.preventDefault();
    const index = parseInt(event.key) - 1;
    selectSkillByIndex(index);
    return;
  }

  // Enter/Space: 施放選中的技能
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const selectedSkill = getSelectedSkill();
    if (selectedSkill?.status === 'available') {
      castSkill(selectedSkill.id);
    }
    return;
  }

  // Esc: 返回
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSkillSelection();
    return;
  }

  // 方向鍵: 選擇技能
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    navigateSkills(event.key === 'ArrowUp' ? -1 : 1);
    return;
  }
}
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 技能相性顏色
- `01-design-system/animations.md` - 施放動畫
- `01-design-system/icons.md` - 技能圖標

### 組件庫
- `04-components/cards.md` - 卡片組件
- `04-components/buttons.md` - 按鈕組件
- `04-components/modals.md` - 模態框組件

### 相關畫面
- `battle-main.md` - 主戰鬥畫面
- `companion-panel.md` - 夥伴面板
- `summon-display.md` - 召喚獸顯示

### 系統文檔
- `docs/design/battle-system/skill-system.md` - 技能系統
- `docs/design/battle-system/affinity-calculation.md` - 相性計算
- `docs/design/battle-system/weakness-system.md` - 弱點系統

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
