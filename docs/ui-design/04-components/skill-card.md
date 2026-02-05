# 技能卡片組件 (Skill Card Component)

**類別**: Card Components
**版本**: v1.0
**最後更新**: 2026-02-05

---

## 組件概述

技能卡片用於顯示玩家技能的詳細信息，包括技能圖標、名稱、MP 消耗、冷卻時間、描述和效果。

### 使用時機
- ✅ 技能選擇畫面
- ✅ 技能管理界面
- ✅ 戰鬥中的技能選單
- ✅ 技能商店

### 不使用時機
- ❌ 簡單的技能圖標顯示（使用 icon + tooltip）
- ❌ 快捷技能欄（使用簡化版）

---

## 視覺示例

### 基本技能卡片
```
┌────────────────────────┐
│ 🔮 Code Generator      │
│                        │
│ MP: 30  CD: 2回合      │
│ ━━━━━━━━━━━━━━━━━━━  │
│                        │
│ 生成高質量代碼，對敵   │
│ 人造成 80-120 傷害。   │
│                        │
│ 元素: code-task 💙     │
│                        │
│ [使用] [詳情]          │
└────────────────────────┘
```

### 緊湊模式（戰鬥中）
```
┌──────────────┐
│ 🔮 生成術    │
│ MP: 30       │
└──────────────┘
```

### 詳細模式
```
┌─────────────────────────────────┐
│ 🔮 Code Generator               │
│ ⭐⭐⭐ 稀有                      │
│                                 │
│ MP 消耗: 30                     │
│ 冷卻時間: 2 回合                │
│ 施法時間: 即時                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│ 描述:                           │
│ 召喚代碼生成之力，創造高質量     │
│ 代碼攻擊敵人。代碼質量決定       │
│ 傷害大小。                      │
│                                 │
│ 效果:                           │
│ • 造成 80-120 點傷害            │
│ • 50% 機率附加「代碼審查」Debuff│
│ • 對 bug-hunt 類型敵人 +20%     │
│                                 │
│ 元素: code-task 💙              │
│ 弱點: architecture 💜            │
│                                 │
│ 已學習: Lv.5                    │
│ 使用次數: 42                    │
│                                 │
│ [使用] [升級] [設為快捷鍵]      │
└─────────────────────────────────┘
```

---

## 屬性定義 (Props)

```typescript
interface SkillCardProps {
  skill: Skill;
  variant?: 'compact' | 'basic' | 'detailed';
  size?: 'small' | 'medium' | 'large';

  // 狀態
  available?: boolean;
  onCooldown?: boolean;
  cooldownRemaining?: number;
  equipped?: boolean;

  // 互動
  onClick?: () => void;
  onUse?: () => void;
  onViewDetails?: () => void;
  onSetHotkey?: () => void;

  // 顯示控制
  showActions?: boolean;
  showStats?: boolean;
  showDescription?: boolean;

  // 主題
  theme?: 'explore' | 'battle';
}

interface Skill {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  rarity: SkillRarity;

  // 消耗和冷卻
  mpCost: number;
  cooldown: number;
  castTime: 'instant' | 'channeled';

  // 分類
  element: ElementType;
  type: SkillType;

  // 描述
  description: string;
  effects: SkillEffect[];

  // 數據
  damage?: DamageRange;
  healing?: number;
  buffs?: Buff[];
  debuffs?: Debuff[];

  // 進度
  level: number;
  maxLevel: number;
  exp: number;
  timesUsed: number;

  // 需求
  requiredLevel: number;
  requiredSkills?: string[];
}

type SkillRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type ElementType = 'code-task' | 'bug-hunt' | 'architecture' | 'documentation' | 'testing' | 'optimization';
type SkillType = 'attack' | 'heal' | 'buff' | 'debuff' | 'summon' | 'utility';
```

---

## 狀態定義

### 1. 可用狀態 (Available)
```
┌────────────────────────┐
│ 🔮 Code Generator      │  ← 正常顏色
│ MP: 30  CD: Ready      │  ← 綠色文字
└────────────────────────┘
```

### 2. MP 不足 (Insufficient MP)
```
┌────────────────────────┐
│ 🔮 Code Generator      │  ← 灰色
│ MP: 30  ⚠️ MP 不足    │  ← 紅色警告
└────────────────────────┘
opacity: 0.5
cursor: not-allowed
```

### 3. 冷卻中 (On Cooldown)
```
┌────────────────────────┐
│ 🔮 Code Generator      │  ← 半透明
│ MP: 30  CD: 2回合      │  ← 倒數計時
└────────────────────────┘
overlay: 遮罩顯示剩餘回合
```

### 4. 已裝備 (Equipped)
```
┌────────────────────────┐
│ 🔮 Code Generator  ✓   │  ← 綠色勾選
│ MP: 30  快捷鍵: [1]    │  ← 快捷鍵提示
└────────────────────────┘
border: 2px solid #00ccff
```

### 5. 未解鎖 (Locked)
```
┌────────────────────────┐
│ 🔒 ？？？              │  ← 完全遮蔽
│ 需要 Lv.10             │
└────────────────────────┘
```

---

## 動畫規格

【參考：01-design-system/animation-timing.md】

### 卡片懸停
```css
@keyframes skill-card-hover {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-4px) scale(1.02);
  }
}

.skill-card:hover {
  animation: skill-card-hover 200ms ease-out forwards;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}
```

### 使用技能動畫
```css
@keyframes skill-use {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.skill-card.using {
  animation: skill-use 500ms ease-out;
}
```

### 冷卻倒數動畫
```css
@keyframes cooldown-overlay {
  from {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  to {
    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  }
}

.skill-card-cooldown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  animation: cooldown-overlay var(--cooldown-duration) linear;
}
```

---

## 使用範例

### React 範例
```tsx
import { SkillCard } from '@/components/ui/skill-card';

function SkillSelectionScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [playerMp, setPlayerMp] = useState(75);

  const handleUseSkill = (skill: Skill) => {
    if (playerMp >= skill.mpCost) {
      // 使用技能
      performSkill(skill);
      setPlayerMp(mp => mp - skill.mpCost);
    } else {
      showToast('MP 不足！', 'error');
    }
  };

  return (
    <div className="skill-grid">
      {skills.map(skill => (
        <SkillCard
          key={skill.id}
          skill={skill}
          variant="basic"
          available={playerMp >= skill.mpCost}
          onCooldown={skill.cooldownRemaining > 0}
          cooldownRemaining={skill.cooldownRemaining}
          equipped={skill.equippedSlot !== null}
          onClick={() => showSkillDetails(skill)}
          onUse={() => handleUseSkill(skill)}
          onSetHotkey={() => assignHotkey(skill)}
          showActions={true}
        />
      ))}
    </div>
  );
}
```

---

## 無障礙支援

```html
<article
  class="skill-card"
  role="button"
  aria-label="技能: Code Generator, 消耗 30 MP, 冷卻 2 回合, 可用"
  tabindex="0"
>
  <div class="skill-card-header">
    <span class="skill-icon" aria-hidden="true">🔮</span>
    <h3 class="skill-name">Code Generator</h3>
  </div>

  <div class="skill-stats">
    <span aria-label="MP 消耗">MP: 30</span>
    <span aria-label="冷卻時間">CD: 2回合</span>
  </div>

  <p class="skill-description">
    生成高質量代碼，對敵人造成 80-120 傷害。
  </p>

  <div class="skill-actions" role="group">
    <button
      aria-label="使用技能 Code Generator"
      onClick={handleUse}
    >
      使用
    </button>
    <button
      aria-label="查看技能詳情"
      onClick={handleViewDetails}
    >
      詳情
    </button>
  </div>
</article>
```

---

## 相關組件

- 【參考：04-components/item-card.md】- 物品卡片
- 【參考：04-components/action-menu.md】- 行動選單
- 【參考：04-components/tooltip.md】- 工具提示

---

**版本**: v1.0
**創建日期**: 2026-02-05
**狀態**: ✅ 完成
