# 召喚獸顯示 (Summon Beast Display)

## 畫面概述

- **功能定位**: 戰鬥中召喚獸的顯示和互動區域
- **進入條件**: 玩家成功召喚召喚獸
- **退出條件**: 召喚獸持續回合結束或被擊敗
- **場景模式**: 戰鬥模式（嵌入式顯示）

## 完整布局

```
┌──────────────────────────────────────────────────────────────┐
│  ⚔️ 戰鬥畫面                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  【敵人區域】                                                 │
│  🐛 Bug 怪物  HP: ████░░░░░░  200/500                        │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                              │
│  【我方區域】                                                 │
│                                                              │
│  👤 你 (CodeMaster Lv.10)                                    │
│  HP: ████████░░ 85/100  |  MP: ████░░░░░░ 75/100            │
│                                                              │
│  🛡️ CodeGuard Lv.3      ⚡ Speedy Lv.5                       │
│  HP: ████ 50/50          HP: ███░ 70/100                     │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                              │
│  【召喚獸區域】                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ✨ 魔法陣閃爍 ✨                                   │     │
│  │                                                    │     │
│  │           🐉                                       │     │
│  │      代碼之龍 ⭐⭐                                 │     │
│  │   (Legendary Summon)                              │     │
│  │                                                    │     │
│  │  剩餘: 3 回合  🔮  元素: 奧術                      │     │
│  │  狀態: ⚡ 待命中...                                │     │
│  │                                                    │     │
│  │  行為: 自動攻擊型 (每回合自動施放技能)             │     │
│  │                                                    │     │
│  │  ┌──────────────────────────────────────┐        │     │
│  │  │ 💬 "吾乃代碼之龍！"                   │        │     │
│  │  │    "汝之問題將化為灰燼！"              │        │     │
│  │  └──────────────────────────────────────┘        │     │
│  │                                                    │     │
│  │  【可用技能】(互動型)                              │     │
│  │  ┌────────────────────────────────────┐          │     │
│  │  │ 🔥 龍息  (造成 300 傷害)            │          │     │
│  │  │ [施放]                              │          │     │
│  │  └────────────────────────────────────┘          │     │
│  │                                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [行動選單]                                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 區塊劃分

### 區塊 1: 召喚獸顯示區域
- **位置**: 我方區域下方，獨立顯示
- **內容**:
  - 召喚獸圖標（大號 Emoji）
  - 名稱和稀有度標示
  - 剩餘回合倒數
  - 元素屬性
  - 當前狀態
  - 台詞氣泡（如有）
  - 可用技能（互動型）

### 區塊 2: 魔法陣背景
- **視覺效果**: 召喚獸腳下的魔法陣
- **動畫**: 持續旋轉 + 脈動
- **顏色**: 根據元素類型變化

### 區塊 3: 技能區域（僅互動型）
- **顯示條件**: 召喚獸行為類型為 `interactive`
- **內容**: 可點擊的技能按鈕
- **狀態**: 可用/已使用

## 組件清單

### 共用組件（引用）
- **按鈕**: `04-components/buttons.md`
- **氣泡**: `04-components/speech-bubbles.md`

### 特有組件

#### 召喚獸卡片 (SummonBeastCard)
```typescript
interface SummonBeastCardProps {
  beast: {
    id: string;
    name: string;
    emoji: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    element: 'arcane' | 'life' | 'temporal' | 'data' | 'rebirth' | 'structure';
    behaviorType: 'immediate' | 'automatic' | 'passive' | 'interactive';
    remainingTurns: number;
    quote?: string;
    skills?: SummonSkill[];
  };
}
```

**稀有度樣式**:
```css
.summon-card {
  position: relative;
  background: linear-gradient(135deg, #1e3a5f, #2d5a88);
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
  transition: all 0.3s;
}

.summon-card.common {
  border: 3px solid #9e9e9e;
  box-shadow: 0 0 10px rgba(158, 158, 158, 0.3);
}

.summon-card.uncommon {
  border: 3px solid #4caf50;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
}

.summon-card.rare {
  border: 3px solid #2196f3;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
}

.summon-card.epic {
  border: 4px solid #9c27b0;
  box-shadow: 0 0 25px rgba(156, 39, 176, 0.7);
  background: linear-gradient(135deg, #4a148c, #6a1b9a);
}

.summon-card.legendary {
  border: 4px solid #ff9800;
  box-shadow: 0 0 30px rgba(255, 152, 0, 0.8);
  background: linear-gradient(135deg, #e65100, #ff6f00);
  animation: legendary-glow 2s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.8); }
  50% { box-shadow: 0 0 40px rgba(255, 152, 0, 1.0); }
}
```

#### 魔法陣 (MagicCircle)
```typescript
interface MagicCircleProps {
  element: ElementType;
  size: number;
}
```

```css
.magic-circle {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 80px;
  background: radial-gradient(
    ellipse at center,
    var(--element-color) 0%,
    transparent 70%
  );
  opacity: 0.6;
  animation: circle-rotate 6s linear infinite;
}

@keyframes circle-rotate {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}

.magic-circle::before,
.magic-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid var(--element-color);
  border-radius: 50%;
  animation: circle-pulse 2s ease-in-out infinite;
}

.magic-circle::before {
  width: 100px;
  height: 40px;
}

.magic-circle::after {
  width: 150px;
  height: 60px;
  animation-delay: 0.5s;
}

@keyframes circle-pulse {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}
```

#### 元素徽章 (ElementBadge)
```typescript
interface ElementBadgeProps {
  element: ElementType;
}
```

```css
.element-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.element-badge.arcane {
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  color: #fff;
}

.element-badge.life {
  background: linear-gradient(135deg, #388e3c, #4caf50);
  color: #fff;
}

.element-badge.temporal {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: #fff;
}

.element-badge.data {
  background: linear-gradient(135deg, #455a64, #607d8b);
  color: #fff;
}

.element-badge.rebirth {
  background: linear-gradient(135deg, #d84315, #ff5722);
  color: #fff;
}

.element-badge.structure {
  background: linear-gradient(135deg, #5d4037, #795548);
  color: #fff;
}
```

#### 回合倒數 (TurnCounter)
```typescript
interface TurnCounterProps {
  remaining: number;
  total: number;
}
```

```css
.turn-counter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  font-weight: bold;
}

.turn-counter.urgent {
  background: rgba(255, 87, 34, 0.4);
  animation: pulse-urgent 1s infinite;
}

@keyframes pulse-urgent {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 互動設計

### 行為類型

#### 1. 即時型 (Immediate)
- **特點**: 召喚後立即施放效果，然後消失
- **顯示**: 僅顯示施放動畫和效果
- **持續**: 0 回合（效果後立即消失）

```
召喚 → 施放效果 → 消失
時長: ~2 秒
```

#### 2. 自動型 (Automatic)
- **特點**: 每回合自動施放技能
- **顯示**: 完整卡片，顯示剩餘回合
- **互動**: 無需玩家操作

```
每回合開始:
  → 自動施放技能
  → 更新回合倒數
  → 回合數歸零時消失
```

#### 3. 被動型 (Passive)
- **特點**: 提供持續 Buff，不主動攻擊
- **顯示**: 簡化卡片，顯示 Buff 圖標
- **效果**: 全局增益

```
持續提供:
  • 攻擊力 +20%
  • 防禦力 +15%
  • 等回合倒數
```

#### 4. 互動型 (Interactive)
- **特點**: 玩家可以手動觸發技能
- **顯示**: 完整卡片 + 技能按鈕
- **限制**: 每個技能只能使用一次

```
玩家可選擇:
  • 何時施放技能
  • 施放後技能置灰
  • 所有技能用完或回合結束後消失
```

### 鍵盤操作
- **Z**: 施放召喚獸技能（互動型）
- **Shift+Z**: 查看召喚獸詳情

### 滑鼠操作
- **左鍵點擊技能按鈕**: 施放技能（互動型）
- **懸停召喚獸**: 顯示完整資訊提示
- **右鍵點擊**: 查看詳細資訊彈窗

### 觸控操作
- **點擊技能按鈕**: 施放技能
- **長按召喚獸**: 查看詳情

## 轉場設計

### 召喚動畫
**時間軸**: 2.0s
```
0.0s  ├─ 魔法陣出現（從小到大，旋轉）(0.5s)
0.5s  ├─ 閃光效果 (0.2s)
0.7s  ├─ 召喚獸從魔法陣中升起 (0.8s)
      │   • 從下方升起
      │   • 縮放: 0 → 1.2 → 1.0
      │   • 旋轉: 360° → 0°
1.5s  ├─ 召喚獸落地 (0.3s)
1.8s  ├─ 台詞氣泡顯示 (0.2s)
2.0s  └─ 動畫完成
```

```css
@keyframes summon-appear {
  0% {
    transform: translateY(100px) scale(0) rotate(360deg);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

.summon-emoji {
  font-size: 72px;
  display: inline-block;
  animation: summon-appear 1.5s ease-out;
}
```

### 技能施放動畫

#### 龍息 (Dragon Breath)
```
0.0s  ├─ 龍頭向後仰 (0.3s)
0.3s  ├─ 火焰蓄力特效 (0.3s)
0.6s  ├─ 龍息噴發 (0.4s)
1.0s  ├─ 火焰擊中敵人 (0.3s)
1.3s  ├─ 爆炸特效 (0.3s)
1.6s  ├─ 傷害數字彈出 (0.4s)
2.0s  └─ 動畫完成
```

#### 浴火重生 (Phoenix Rebirth)
```
0.0s  ├─ 不死鳥展翅 (0.3s)
0.3s  ├─ 火焰環繞 (0.3s)
0.6s  ├─ 閃光爆發 (0.2s)
0.8s  ├─ 治療光波擴散 (0.5s)
1.3s  ├─ 玩家/夥伴閃爍（治療）(0.3s)
1.6s  ├─ 治療數字彈出 (0.4s)
2.0s  └─ Buff 圖標顯示
```

### 消失動畫
```css
@keyframes summon-fade-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}

.summon-card.disappearing {
  animation: summon-fade-out 1s ease-in forwards;
}
```

## 狀態變化

### 回合倒數
```
3 回合剩餘:
┌──────────────┐
│ 剩餘: 3 回合  │
│ 🔮🔮🔮      │
└──────────────┘

2 回合剩餘:
┌──────────────┐
│ 剩餘: 2 回合  │
│ 🔮🔮        │
└──────────────┘

1 回合剩餘 (警告):
┌──────────────┐
│ ⚠️ 最後1回合 │
│ 🔮 [閃爍]    │
└──────────────┘
```

### 技能使用狀態（互動型）
```
可用:
┌────────────────┐
│ 🔥 龍息        │
│ 造成 300 傷害  │
│ [施放]         │
└────────────────┘

已使用:
┌────────────────┐
│ 🔥 龍息 [灰色] │
│ ✅ 已施放      │
│ [無法使用]     │
└────────────────┘
```

## 響應式設計

### 桌面 (1200px+)
```
完整卡片顯示，所有資訊可見
```

### 平板 (768-1199px)
```
簡化卡片，摺疊詳細資訊
```

### 手機 (<768px)
```
精簡顯示:
┌─────────────────┐
│ 🐉 代碼之龍 ⭐⭐│
│ 剩餘: 3 回合    │
│ [施放技能]      │
└─────────────────┘
```

## 無障礙設計

### ARIA 標籤
```html
<div
  role="region"
  aria-label="召喚獸: 代碼之龍"
  class="summon-card legendary"
>
  <h3>🐉 代碼之龍</h3>
  <span class="rarity" role="img" aria-label="傳說級">⭐⭐</span>

  <div
    role="timer"
    aria-live="polite"
    aria-label="剩餘 3 回合"
  >
    剩餘: 3 回合
  </div>

  <button
    aria-label="施放技能: 龍息, 造成 300 傷害"
    onclick="useSummonSkill('dragon-breath')"
  >
    🔥 龍息
  </button>
</div>
```

## 技術規格

### 資料結構

```typescript
interface SummonBeast {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  element: ElementType;
  behaviorType: 'immediate' | 'automatic' | 'passive' | 'interactive';
  duration: number;
  remainingTurns: number;
  quote?: string;
  skills?: SummonSkill[];
  passiveEffects?: PassiveEffect[];
}

interface SummonSkill {
  id: string;
  name: string;
  icon: string;
  damage?: number;
  heal?: number;
  effect: string;
  used: boolean;
}

interface PassiveEffect {
  type: 'attack_boost' | 'defense_boost' | 'mp_regen';
  value: number;
}
```

### 粒子效果系統

```typescript
class SummonParticleSystem {
  spawnParticles(type: 'fire' | 'heal' | 'magic', count: number) {
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(type);
      this.animateParticle(particle);
    }
  }

  private createParticle(type: string): HTMLElement {
    const particle = document.createElement('div');
    particle.className = `particle particle-${type}`;
    // 設置隨機位置和速度
    return particle;
  }
}
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 元素顏色
- `01-design-system/animations.md` - 召喚動畫

### 組件庫
- `04-components/cards.md` - 卡片組件
- `04-components/particles.md` - 粒子效果

### 相關畫面
- `battle-main.md` - 主戰鬥畫面
- `companion-panel.md` - 夥伴面板

### 系統文檔
- `docs/design/summon-beast-system/core-logic.md` - 召喚獸系統
- `docs/design/summon-beast-system/behavior-types.md` - 行為類型

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
