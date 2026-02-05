# 敵人資訊顯示 (Enemy Display)

## 畫面概述

- **功能定位**: 戰鬥中敵人的完整資訊展示
- **進入條件**: 戰鬥開始或右鍵點擊敵人
- **退出條件**: 關閉詳情面板或按 Esc
- **場景模式**: 戰鬥模式（嵌入式顯示 + 詳情彈窗）

## 完整布局

### 簡化顯示（戰鬥畫面）

```
┌────────────────────────────────────┐
│          【敵人區域】               │
│                                    │
│            💻                      │
│          Lv.5                      │  ← 浮動動畫
│        Bug 怪物                     │
│                                    │
│  HP: ▓▓▓▓▓▓▓░░░  350/500          │
│  元素: [Logic] 🧠                   │
│  弱點: code-reviewer ⭐             │
│                                    │
│            ↓                       │
│        等待行動...                  │
│                                    │
└────────────────────────────────────┘
```

### 詳細顯示（彈窗）

```
┌──────────────────────────────────────────────────────────────┐
│                    敵人詳細資訊                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     💻 Bug 怪物                              │
│                       Lv.5                                   │
│                                                              │
│  【基礎資訊】                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ HP: ▓▓▓▓▓▓▓░░░  350/500                              │   │
│  │ MP: ████░░░░░░  80/150                               │   │
│  │ 等級: 5                                              │   │
│  │ 類型: 中等挑戰                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  【元素與相性】                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 元素: [Logic] 🧠                                     │   │
│  │                                                      │   │
│  │ 弱點: ⭐                                             │   │
│  │ • code-reviewer (×1.5 傷害)                         │   │
│  │ • debug-helper (×1.8 傷害)                          │   │
│  │                                                      │   │
│  │ 抵抗: 🛡️                                             │   │
│  │ • code-generator (×0.7 傷害)                        │   │
│  │ • test-runner (×0.8 傷害)                           │   │
│  │                                                      │   │
│  │ 免疫: ❌                                             │   │
│  │ • memory-leak 技能無效                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  【能力】                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • 反擊: 每次受攻擊有 30% 機率反擊                     │   │
│  │ • 代碼腐蝕: 造成持續傷害 (3 回合)                     │   │
│  │ • 複製術: HP < 30% 時分裂出小怪                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  【獎勵預覽】                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💰 金幣: 80-120                                      │   │
│  │ ⭐ 經驗值: 150-200                                   │   │
│  │ 🎁 掉落物:                                           │   │
│  │   • Debug Token (80%)                               │   │
│  │   • Code Fragment (40%)                             │   │
│  │   • Rare Bug Core (5%)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                        [關閉]                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 區塊劃分

### 簡化顯示區塊

#### 區塊 1: 敵人圖標
- **內容**: 大號 Emoji 或圖標
- **動畫**: 浮動效果（上下 10px，2s 循環）
- **受傷**: 閃紅 + 震動

#### 區塊 2: 名稱和等級
- **格式**: `[Emoji] 名稱 Lv.X`
- **顏色**: 根據威脅等級變化

#### 區塊 3: HP 條
- **樣式**: 彩色進度條 + 數字
- **顏色**: 綠 → 黃 → 紅（根據 HP%）
- **動畫**: 平滑減少

#### 區塊 4: 元素類型
- **顯示**: 徽章形式
- **圖標**: 配合顏色

#### 區塊 5: 弱點提示
- **顯示條件**: 已發現弱點
- **樣式**: 金色星標 + 技能名稱

#### 區塊 6: 狀態指示
- **內容**: 當前行動狀態
- **例如**: "等待行動..."、"蓄力中..."、"防禦姿態"

### 詳細顯示區塊

#### 區塊 1: 基礎資訊
- HP/MP 條（完整數值）
- 等級
- 類型（簡單/中等/困難/魔王級）

#### 區塊 2: 元素與相性
- 元素類型
- 弱點列表（傷害倍率）
- 抵抗列表（減傷倍率）
- 免疫列表

#### 區塊 3: 能力列表
- 特殊能力描述
- 觸發條件
- 效果說明

#### 區塊 4: 獎勵預覽
- 金幣範圍
- 經驗值範圍
- 掉落物列表（含機率）

## 組件清單

### 共用組件（引用）
- **HP 條**: `04-components/progress-bars.md`
- **徽章**: `04-components/badges.md`
- **模態框**: `04-components/modals.md`

### 特有組件

#### 敵人卡片 (EnemyCard)
```typescript
interface EnemyCardProps {
  enemy: {
    id: string;
    name: string;
    emoji: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    element: string;
    weaknesses: Weakness[];
    resistances: Resistance[];
    immunities: string[];
    abilities: Ability[];
    discoveredWeakness: boolean;
  };
  isActionPhase: boolean;
}
```

#### HP 條組件
```css
.enemy-hp-bar {
  width: 100%;
  height: 24px;
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #555;
  position: relative;
}

.enemy-hp-fill {
  height: 100%;
  transition: width 0.5s ease-out;
  background: linear-gradient(to right, #4caf50, #8bc34a);
  border-radius: 10px;
}

.enemy-hp-fill.warning {
  background: linear-gradient(to right, #ff9800, #ffb74d);
}

.enemy-hp-fill.critical {
  background: linear-gradient(to right, #f44336, #e57373);
  animation: hp-critical-pulse 1s infinite;
}

@keyframes hp-critical-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.enemy-hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 1px 1px 2px #000;
  pointer-events: none;
}
```

#### 元素徽章
```css
.element-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.element-badge.logic {
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  color: #fff;
}

.element-badge.bug-hunt {
  background: linear-gradient(135deg, #f44336, #ef5350);
  color: #fff;
}

.element-badge.architecture {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
  color: #fff;
}

.element-badge.documentation {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  color: #000;
}

.element-badge.testing {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #fff;
}
```

#### 弱點標示
```css
.weakness-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border: 2px solid #f57f17;
  border-radius: 16px;
  color: #000;
  font-weight: bold;
  font-size: 12px;
  animation: weakness-shine 2s infinite;
}

@keyframes weakness-shine {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.9);
  }
}
```

#### 能力列表項
```typescript
interface AbilityItemProps {
  ability: {
    name: string;
    icon: string;
    description: string;
    trigger?: string;
  };
}
```

```css
.ability-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid #ff9800;
  border-radius: 4px;
  margin: 8px 0;
}

.ability-item .name {
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 4px;
}

.ability-item .description {
  color: #b0bec5;
  font-size: 14px;
}
```

## 互動設計

### 敵人動畫

#### 浮動動畫
```css
@keyframes enemy-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.enemy-emoji {
  font-size: 80px;
  display: inline-block;
  animation: enemy-float 2s ease-in-out infinite;
}
```

#### 受傷動畫
```css
@keyframes enemy-hurt {
  0% {
    transform: translateX(0);
    filter: brightness(1);
  }
  20% {
    transform: translateX(-10px);
    filter: brightness(1.8) hue-rotate(-30deg);
  }
  40% {
    transform: translateX(10px);
    filter: brightness(1.8) hue-rotate(-30deg);
  }
  60% {
    transform: translateX(-5px);
    filter: brightness(1.4);
  }
  80% {
    transform: translateX(5px);
    filter: brightness(1.2);
  }
  100% {
    transform: translateX(0);
    filter: brightness(1);
  }
}

.enemy-display.hurt {
  animation: enemy-hurt 0.3s ease-out;
}
```

#### 擊敗動畫
```css
@keyframes enemy-defeat {
  0% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  20%, 40%, 60%, 80% {
    opacity: 0.3;
  }
  10%, 30%, 50%, 70%, 90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(0.2) rotate(360deg);
  }
}

.enemy-display.defeated {
  animation: enemy-defeat 1s ease-out forwards;
}
```

### 鍵盤操作
- **I**: 查看敵人詳情（彈窗）
- **Esc**: 關閉詳情彈窗

### 滑鼠操作
- **懸停敵人**: 顯示簡要提示（HP、弱點）
- **右鍵點擊敵人**: 打開詳細資訊彈窗
- **點擊彈窗外部**: 關閉彈窗

### 觸控操作
- **點擊敵人**: 顯示簡要資訊
- **長按敵人**: 打開詳細資訊彈窗

## 狀態變化

### HP 狀態
```
HP > 50%:
▓▓▓▓▓▓▓▓░░  [綠色]

HP 20%-50%:
▓▓▓▓░░░░░░  [黃色]

HP < 20%:
▓▓░░░░░░░░  [紅色，閃爍]
```

### 威脅等級顏色
```typescript
function getThreatColor(level: number, playerLevel: number): string {
  const diff = level - playerLevel;

  if (diff >= 5) return '#ff0000';      // 非常危險 (紅)
  if (diff >= 2) return '#ff9800';      // 危險 (橙)
  if (diff >= -2) return '#ffeb3b';     // 普通 (黃)
  if (diff >= -5) return '#4caf50';     // 簡單 (綠)
  return '#9e9e9e';                     // 非常簡單 (灰)
}
```

### 弱點發現
```
未發現:
┌────────────────┐
│ 元素: Logic    │
│ 弱點: ???      │
└────────────────┘

已發現:
┌────────────────────────┐
│ 元素: Logic            │
│ 弱點: ⭐ code-reviewer │
│ 傷害: ×1.5             │
└────────────────────────┘
```

## 響應式設計

### 桌面 (1200px+)
```
完整顯示:
• 大號圖標 (80px)
• 完整 HP 條
• 所有資訊可見
```

### 平板 (768-1199px)
```
中等顯示:
• 中號圖標 (60px)
• 簡化 HP 條
• 次要資訊摺疊
```

### 手機 (<768px)
```
精簡顯示:
┌─────────────────┐
│ 💻 Bug Lv.5     │
│ HP: ████░ 70%   │
│ [點擊查看詳情]   │
└─────────────────┘
```

## 無障礙設計

### ARIA 標籤
```html
<div
  role="region"
  aria-label="敵人: Bug 怪物, 等級 5"
  class="enemy-display"
>
  <div
    role="img"
    aria-label="Bug 怪物圖標"
    class="enemy-emoji"
  >
    💻
  </div>

  <h3 id="enemy-name">Bug 怪物 Lv.5</h3>

  <div
    role="progressbar"
    aria-valuenow="350"
    aria-valuemin="0"
    aria-valuemax="500"
    aria-label="敵人 HP: 350 / 500, 70%"
  >
    <div class="enemy-hp-bar">
      <div class="enemy-hp-fill" style="width: 70%"></div>
      <span class="enemy-hp-text">350/500</span>
    </div>
  </div>

  <div
    role="status"
    aria-live="polite"
    aria-label="弱點: code-reviewer"
    class="weakness-tag"
  >
    ⭐ code-reviewer
  </div>

  <button
    aria-label="查看 Bug 怪物 詳細資訊"
    onclick="showEnemyDetails()"
  >
    詳細資訊
  </button>
</div>
```

### 螢幕閱讀器
- HP 變化時通知
- 弱點發現時優先通知
- 重要狀態變化朗讀

## 技術規格

### 資料結構

```typescript
interface Enemy {
  id: string;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  element: ElementType;
  type: 'easy' | 'medium' | 'hard' | 'boss';

  weaknesses: Weakness[];
  resistances: Resistance[];
  immunities: string[];

  abilities: Ability[];
  discoveredWeakness: boolean;

  rewards: {
    gold: { min: number; max: number };
    exp: { min: number; max: number };
    drops: DropItem[];
  };
}

interface Weakness {
  skillId: string;
  skillName: string;
  multiplier: number;
}

interface Resistance {
  skillId: string;
  skillName: string;
  multiplier: number;
}

interface Ability {
  id: string;
  name: string;
  icon: string;
  description: string;
  trigger?: string;
  cooldown?: number;
}

interface DropItem {
  itemId: string;
  name: string;
  chance: number;
}
```

### HP 更新動畫

```typescript
class EnemyHPAnimator {
  updateHP(enemy: Enemy, newHp: number, damage: number) {
    // 1. 顯示傷害數字
    this.spawnDamageNumber(damage, enemy.position);

    // 2. 播放受傷動畫
    this.playHurtAnimation(enemy);

    // 3. 平滑更新 HP 條
    this.animateHPBar(enemy.hp, newHp, 500);

    // 4. 更新數值
    enemy.hp = newHp;

    // 5. 檢查 HP 狀態
    if (newHp <= 0) {
      this.playDefeatAnimation(enemy);
    } else if (newHp < enemy.maxHp * 0.2) {
      this.triggerCriticalState(enemy);
    }
  }

  private animateHPBar(from: number, to: number, duration: number) {
    const start = performance.now();
    const diff = to - from;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      const current = from + diff * eased;
      this.updateHPBarWidth(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 威脅等級顏色
- `01-design-system/animations.md` - 敵人動畫

### 組件庫
- `04-components/progress-bars.md` - HP 條
- `04-components/badges.md` - 元素徽章
- `04-components/modals.md` - 詳情彈窗

### 相關畫面
- `battle-main.md` - 主戰鬥畫面
- `skill-selection.md` - 技能選擇

### 系統文檔
- `docs/design/battle-system/enemy-system.md` - 敵人系統
- `docs/design/battle-system/weakness-system.md` - 弱點系統
- `docs/design/battle-system/enemy-ai.md` - 敵人 AI

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
