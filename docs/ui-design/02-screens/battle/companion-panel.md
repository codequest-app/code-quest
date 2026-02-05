# 夥伴面板（戰鬥中）(Companion Panel in Battle)

## 畫面概述

- **功能定位**: 戰鬥中管理和召喚夥伴的介面
- **進入條件**: 在戰鬥中點擊「召喚夥伴」按鈕
- **退出條件**: 選擇夥伴行動、返回或按 Esc
- **場景模式**: 戰鬥模式子畫面（覆蓋層）

## 完整布局

```
┌──────────────────────────────────────────────────────────────┐
│                    戰鬥畫面（背景暗化 50%）                    │
│                                                              │
│         ┌──────────────────────────────────────┐            │
│         │  🤝 夥伴管理                         │            │
│         ├──────────────────────────────────────┤            │
│         │                                      │            │
│         │  【已召喚夥伴】 (2/3)                 │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🛡️ CodeGuard  Lv.3   [待命]   │ │            │
│         │  │ 代碼守護者                     │ │            │
│         │  │                                │ │            │
│         │  │ HP: ████████░░ 85/100          │ │            │
│         │  │ MP: ████░░░░░░ 42/80           │ │            │
│         │  │                                │ │
          │  │ 狀態: ⚡ 待命中                  │ │            │
│         │  │                                │ │            │
│         │  │ 【可用技能】                    │ │            │
│         │  │ ┌──────────────────────────┐  │ │            │
│         │  │ │ 🔍 安全掃描  MP: 20       │  │ │            │
│         │  │ │ 造成傷害 + 降低防禦       │  │ │            │
│         │  │ │ [施放]                   │  │ │            │
│         │  │ └──────────────────────────┘  │ │            │
│         │  │ ┌──────────────────────────┐  │ │            │
│         │  │ │ 🛡️ 守護之盾  MP: 30       │  │ │            │
│         │  │ │ 冷卻: 2 回合  [冷卻中]    │  │ │            │
│         │  │ └──────────────────────────┘  │ │            │
│         │  │                                │ │            │
│         │  │ [查看詳情] [解除召喚]          │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ ⚡ Speedy  Lv.5      [待命]    │ │            │
│         │  │ 極速助手                        │ │            │
│         │  │                                │ │            │
│         │  │ HP: ███░░░░░░░ 70/100          │ │            │
│         │  │ MP: ███░░░░░░░ 60/120          │ │            │
│         │  │                                │ │            │
│         │  │ 狀態: ⚡ 待命中                  │ │            │
│         │  │                                │ │            │
│         │  │ 【可用技能】                    │ │            │
│         │  │ ┌──────────────────────────┐  │ │            │
│         │  │ │ 💨 快速打擊  MP: 15       │  │ │            │
│         │  │ │ 連擊 2 次                 │  │ │            │
│         │  │ │ [施放]                   │  │ │            │
│         │  │ └──────────────────────────┘  │ │            │
│         │  │                                │ │            │
│         │  │ [查看詳情] [解除召喚]          │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │            │
│         │                                      │            │
│         │  【可召喚夥伴】                       │            │
│         │                                      │            │
│         │  ┌────────────────────────────────┐ │            │
│         │  │ 🧙 PlanMaster  Lv.4            │ │            │
│         │  │ 計劃大師                        │ │            │
│         │  │                                │ │            │
│         │  │ HP: 80/80  MP: 60/60           │ │            │
│         │  │ 技能: 策略分析、資源優化        │ │            │
│         │  │                                │ │            │
│         │  │ 召喚消耗: 20 MP                │ │            │
│         │  │                                │ │            │
│         │  │      [召喚] (消耗 20 MP)       │ │            │
│         │  └────────────────────────────────┘ │            │
│         │                                      │            │
│         │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │            │
│         │                                      │            │
│         │  插槽: ■■□ (2/3 已用，1 空位)      │            │
│         │                                      │            │
│         │              [返回]                  │            │
│         │                                      │            │
│         └──────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 區塊劃分

### 區塊 1: 標題欄
- **內容**: "🤝 夥伴管理"
- **樣式**: 深藍綠色背景，白色文字
- **固定**: 頂部

### 區塊 2: 已召喚夥伴區域
- **內容**: 當前戰鬥中的夥伴列表
- **顯示**: 每個夥伴的完整資訊卡片
- **最多**: 3 個夥伴
- **可滾動**: 如果超過顯示範圍

### 區塊 3: 可召喚夥伴區域
- **內容**: 可以召喚的夥伴列表
- **篩選**: 排除已召喚的夥伴
- **顯示**: 簡化資訊 + 召喚按鈕

### 區塊 4: 插槽指示器
- **內容**: 視覺化顯示夥伴插槽使用情況
- **格式**: ■■□ (已用/總數)

### 區塊 5: 底部操作欄
- **內容**: 返回按鈕
- **快捷鍵**: Esc

## 組件清單

### 共用組件（引用）
- **HP/MP 條**: `04-components/progress-bars.md`
- **按鈕**: `04-components/buttons.md`
- **覆蓋層**: `04-components/modals.md`

### 特有組件

#### 夥伴卡片 (CompanionCard)
```typescript
interface CompanionCardProps {
  companion: {
    id: string;
    name: string;
    title: string;
    emoji: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    status: 'standby' | 'active' | 'exhausted' | 'ko';
    skills: CompanionSkill[];
  };
  isActive: boolean;
  onUseSkill: (skillId: string) => void;
  onDismiss: () => void;
  onViewDetails: () => void;
}
```

**已召喚樣式**:
```css
.companion-card {
  background: linear-gradient(135deg, #1e3a5f, #2d5a88);
  border: 3px solid #4a90e2;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.companion-card.standby {
  border-color: #4caf50;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

.companion-card.active {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  animation: active-glow 2s infinite;
}

@keyframes active-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  }
}

.companion-card.exhausted {
  border-color: #ff9800;
  opacity: 0.7;
  filter: grayscale(0.3);
}

.companion-card.ko {
  border-color: #757575;
  opacity: 0.5;
  filter: grayscale(1);
}
```

#### 夥伴頭像 (CompanionAvatar)
```typescript
interface CompanionAvatarProps {
  emoji: string;
  level: number;
  status: CompanionStatus;
}
```

```css
.companion-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  font-size: 60px;
  text-align: center;
  line-height: 80px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.level-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: linear-gradient(135deg, #ffc107, #ff9800);
  color: #000;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.status-indicator {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.status-indicator.standby {
  background: #4caf50;
  animation: pulse-green 2s infinite;
}

.status-indicator.active {
  background: #ffd700;
  animation: pulse-gold 1s infinite;
}

.status-indicator.exhausted {
  background: #ff9800;
}

.status-indicator.ko {
  background: #757575;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 1); }
  50% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
}

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 1); }
  50% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
}
```

#### 夥伴技能按鈕 (CompanionSkillButton)
```typescript
interface CompanionSkillButtonProps {
  skill: {
    id: string;
    name: string;
    icon: string;
    mpCost: number;
    cooldown: number;
    currentCooldown: number;
    description: string;
  };
  companionMp: number;
  onUse: () => void;
}
```

```css
.companion-skill-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  border: 2px solid #1565c0;
  border-radius: 8px;
  padding: 10px;
  margin: 6px 0;
  cursor: pointer;
  transition: all 0.2s;
}

.companion-skill-btn:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.companion-skill-btn.cooldown {
  background: linear-gradient(135deg, #616161, #424242);
  border-color: #333;
  cursor: not-allowed;
  opacity: 0.6;
}

.companion-skill-btn.insufficient_mp {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  border-color: #7f0000;
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### 召喚夥伴卡片 (SummonCompanionCard)
```typescript
interface SummonCompanionCardProps {
  companion: {
    id: string;
    name: string;
    title: string;
    emoji: string;
    level: number;
    maxHp: number;
    maxMp: number;
    skills: string[];
  };
  summonCost: number;
  playerMp: number;
  canSummon: boolean;
  onSummon: () => void;
}
```

```css
.summon-companion-card {
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
  border: 2px dashed #4a90e2;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.summon-companion-card:hover {
  border-style: solid;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  transform: translateY(-2px);
}

.summon-companion-card.cannot_summon {
  opacity: 0.5;
  cursor: not-allowed;
}

.summon-button {
  width: 100%;
  padding: 10px;
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.summon-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.summon-button.insufficient_mp {
  background: linear-gradient(to bottom, #757575, #616161);
  cursor: not-allowed;
}
```

#### 插槽指示器 (SlotIndicator)
```typescript
interface SlotIndicatorProps {
  used: number;
  total: number;
}
```

```css
.slot-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin: 16px 0;
}

.slot {
  width: 40px;
  height: 40px;
  border: 3px solid #4a90e2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s;
}

.slot.filled {
  background: linear-gradient(135deg, #4caf50, #388e3c);
  border-color: #2e7d32;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.slot.empty {
  background: transparent;
  border-style: dashed;
  opacity: 0.5;
}

.slot-label {
  font-size: 14px;
  color: #b0bec5;
  margin-left: 8px;
}
```

## 互動設計

### 鍵盤操作
- **1~3**: 選中已召喚夥伴 1-3
- **A**: 選中第一個可召喚夥伴
- **Enter**: 召喚選中的夥伴
- **D**: 解除選中的夥伴
- **↑/↓**: 在夥伴列表中上下選擇
- **Tab**: 循環選擇夥伴
- **Esc**: 返回戰鬥畫面

### 滑鼠操作
- **左鍵點擊技能按鈕**: 施放夥伴技能
- **左鍵點擊「召喚」**: 召喚選中的夥伴
- **左鍵點擊「解除召喚」**: 解除夥伴並釋放插槽
- **右鍵點擊夥伴卡片**: 查看夥伴詳細資訊
- **懸停卡片**: 顯示技能詳情提示
- **滾輪**: 滾動夥伴列表

### 觸控操作
- **點擊技能按鈕**: 施放技能
- **點擊「召喚」**: 召喚夥伴
- **長按夥伴卡片**: 顯示詳細資訊彈窗
- **滑動列表**: 滾動查看更多夥伴

## 轉場設計

### 進入動畫
**時間軸**: 0.6s
```
0.0s  ├─ 背景暗化 (darken, 0.2s)
0.1s  ├─ 面板從右側滑入 (slideInRight, 0.3s)
0.2s  ├─ 夥伴卡片逐個淡入 (fadeIn, stagger 0.1s)
0.6s  └─ 動畫完成
```

```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.companion-card {
  opacity: 0;
  animation: companion-fade-in 0.3s ease-out forwards;
}

.companion-card:nth-child(1) { animation-delay: 0.2s; }
.companion-card:nth-child(2) { animation-delay: 0.3s; }
.companion-card:nth-child(3) { animation-delay: 0.4s; }

@keyframes companion-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 召喚動畫
**時間軸**: 2.0s
```
0.0s  ├─ 播放召喚音效
0.0s  ├─ 召喚陣出現（從小到大）(0.5s)
0.5s  ├─ 閃光效果 (0.2s)
0.7s  ├─ 夥伴從召喚陣中升起 (0.8s)
1.5s  ├─ 夥伴落地，添加到戰鬥 (0.3s)
1.8s  ├─ 召喚台詞顯示 (0.2s)
2.0s  └─ 動畫完成
```

```css
.summon-circle {
  animation: summon-circle-appear 0.5s ease-out;
}

@keyframes summon-circle-appear {
  from {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.companion-emerge {
  animation: companion-emerge 0.8s ease-out 0.7s;
}

@keyframes companion-emerge {
  0% {
    transform: translateY(100px) scale(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
```

### 技能施放動畫
不同技能有不同動畫，參考 `summon-display.md`

## 狀態變化

### 夥伴狀態
```
待命中 (standby)
    ↓ 施放技能
活躍中 (active) → 行動完成 → 待命中 (standby)
    ↓ 受到大量傷害
疲憊 (exhausted) → 休息回合 → 待命中 (standby)
    ↓ HP 歸零
倒下 (ko) → 戰鬥結束復活 → 待命中 (standby)
```

### 各狀態顯示

#### 待命中 (standby)
```
┌────────────────────────────┐
│ 🛡️ CodeGuard  Lv.3         │
│ 狀態: ⚡ 待命中              │
│ [綠色邊框，正常顯示]        │
└────────────────────────────┘
```

#### 活躍中 (active)
```
┌────────────────────────────┐
│ 🛡️ CodeGuard  Lv.3         │
│ 狀態: ✨ 活躍中！           │
│ [金色邊框，發光效果]        │
└────────────────────────────┘
```

#### 疲憊 (exhausted)
```
┌────────────────────────────┐
│ 🛡️ CodeGuard  Lv.3         │
│ 狀態: 😰 疲憊中             │
│ [橙色邊框，半灰度]          │
└────────────────────────────┘
```

#### 倒下 (ko)
```
┌────────────────────────────┐
│ 🛡️ CodeGuard  Lv.3         │
│ 狀態: 💔 已倒下             │
│ [灰色邊框，完全灰度]        │
│ [所有按鈕禁用]              │
└────────────────────────────┘
```

### 插槽已滿提示
```
┌────────────────────────────┐
│ ⚠️ 插槽已滿 (3/3)           │
│ 請先解除一個夥伴再召喚      │
└────────────────────────────┘
```

### MP 不足提示
```
┌────────────────────────────┐
│ ⚠️ MP 不足                  │
│ 召喚需要: 20 MP             │
│ 當前 MP: 15                 │
│ 差: 5 MP                    │
└────────────────────────────┘
```

## 響應式設計

### 桌面 (1200px+)
```
┌──────────────────────────────┐
│  夥伴管理面板 (450px 寬)      │
│  ┌────────────────────────┐  │
│  │ 已召喚夥伴 (完整資訊)   │  │
│  │ • 夥伴 1               │  │
│  │ • 夥伴 2               │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 可召喚夥伴             │  │
│  │ • 夥伴 3               │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 平板 (768-1199px)
```
┌────────────────────────────┐
│  夥伴管理 (全寬)            │
│  ┌──────────────────────┐  │
│  │ 已召喚 (簡化)         │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 可召喚 (列表)         │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### 手機 (<768px)
```
┌─────────────────┐
│  夥伴管理        │
│  [Tab 切換]      │
│  [已召喚][可召喚]│
│                 │
│  當前顯示區域    │
│                 │
│  (簡化卡片)      │
└─────────────────┘
```

## 無障礙設計

### ARIA 標籤
```html
<div
  role="dialog"
  aria-labelledby="companion-panel-title"
  aria-modal="true"
  class="companion-panel"
>

  <h2 id="companion-panel-title">夥伴管理</h2>

  <!-- 已召喚夥伴 -->
  <section aria-label="已召喚夥伴">
    <h3>已召喚夥伴 (2/3)</h3>

    <article
      role="region"
      aria-label="CodeGuard, 等級 3, 待命中"
      class="companion-card standby"
    >
      <h4>🛡️ CodeGuard Lv.3</h4>
      <div
        role="progressbar"
        aria-valuenow="85"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="HP 85%"
      >
        HP: 85/100
      </div>

      <button
        aria-label="施放技能: 安全掃描, 消耗 20 MP"
        onclick="useCompanionSkill('skill-1')"
      >
        🔍 安全掃描 MP: 20
      </button>

      <button
        aria-label="解除召喚 CodeGuard"
        onclick="dismissCompanion('companion-1')"
      >
        解除召喚
      </button>
    </article>

  </section>

  <!-- 可召喚夥伴 -->
  <section aria-label="可召喚夥伴">
    <h3>可召喚夥伴</h3>

    <article
      role="button"
      aria-label="PlanMaster, 等級 4, 召喚消耗 20 MP"
      tabindex="0"
      class="summon-companion-card"
    >
      <h4>🧙 PlanMaster Lv.4</h4>
      <p>召喚消耗: 20 MP</p>
      <button
        aria-label="召喚 PlanMaster, 消耗 20 MP"
        onclick="summonCompanion('companion-3')"
      >
        召喚 (消耗 20 MP)
      </button>
    </article>

  </section>

  <!-- 插槽指示 -->
  <div
    role="status"
    aria-label="夥伴插槽: 已使用 2 個, 共 3 個, 剩餘 1 個空位"
    class="slot-indicator"
  >
    插槽: ■■□ (2/3 已用，1 空位)
  </div>

</div>
```

### 鍵盤導航和螢幕閱讀器
- 夥伴狀態變化時通知
- 召喚成功/失敗時優先通知
- 技能施放結果朗讀

## 技術規格

### 資料結構

```typescript
interface Companion {
  id: string;
  name: string;
  title: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  status: 'standby' | 'active' | 'exhausted' | 'ko';
  skills: CompanionSkill[];
  summonCost: number;
}

interface CompanionSkill {
  id: string;
  name: string;
  icon: string;
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  effect: {
    type: 'damage' | 'heal' | 'buff' | 'debuff';
    value: number;
    target: 'enemy' | 'player' | 'all_companions';
  };
}

interface CompanionState {
  active: Companion[];
  available: Companion[];
  maxSlots: number;
}
```

### 狀態管理

```typescript
const useCompanionStore = create<CompanionState>((set, get) => ({
  active: [],
  available: [],
  maxSlots: 3,

  summonCompanion: async (companionId: string) => {
    const { active, available, maxSlots } = get();

    if (active.length >= maxSlots) {
      showNotification('插槽已滿', 'error');
      return;
    }

    const companion = available.find(c => c.id === companionId);
    if (!companion) return;

    // 檢查 MP
    if (playerMp < companion.summonCost) {
      showNotification('MP 不足', 'error');
      return;
    }

    // 播放召喚動畫
    await playSummonAnimation(companion);

    // 添加到戰鬥
    set({
      active: [...active, companion],
      available: available.filter(c => c.id !== companionId)
    });

    // 扣除 MP
    consumeMp(companion.summonCost);
  },

  dismissCompanion: (companionId: string) => {
    const { active, available } = get();
    const companion = active.find(c => c.id === companionId);

    if (companion) {
      set({
        active: active.filter(c => c.id !== companionId),
        available: [...available, companion]
      });
    }
  },

  useCompanionSkill: async (companionId: string, skillId: string) => {
    // 執行技能邏輯
    await executeCompanionSkill(companionId, skillId);
  }
}));
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 夥伴狀態顏色
- `01-design-system/animations.md` - 召喚動畫

### 組件庫
- `04-components/cards.md` - 卡片組件
- `04-components/progress-bars.md` - HP/MP 條

### 相關畫面
- `battle-main.md` - 主戰鬥畫面
- `skill-selection.md` - 技能選擇
- `summon-display.md` - 召喚獸顯示

### 系統文檔
- `docs/design/companion-system/core-logic.md` - 夥伴系統邏輯
- `docs/design/companion-system/skill-system.md` - 夥伴技能

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
