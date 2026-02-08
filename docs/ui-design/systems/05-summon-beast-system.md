# 召喚獸系統 (Summon Beast System)

**創建日期**: 2026-02-06
**版本**: v1.1
**更新日期**: 2026-02-07

💡 **快速參考**: 召喚獸為戰鬥支援，使用 `/project-overview` 了解整體機制
**來源**: `/docs/design/summon-beast-system/requirements.md`

---

## 目錄

1. [系統概述](#系統概述)
2. [依賴關係](#依賴關係)
3. [核心規則](#核心規則)
4. [內部地圖](#內部地圖)
5. [系統整合](#系統整合)
6. [設計決策](#設計決策)

---

## 系統概述

### 核心概念

召喚獸系統是 Code Quest 的重要戰鬥輔助機制，將玩家獲得的技能、MCP 工具、和道具轉化為可召喚的戰鬥助力。

**核心設計理念**：
```
技能 → 技能召喚獸（強化版技能）
MCP 工具 → 工具召喚獸（自動化助手）
稀有道具 → 特殊召喚獸（獨特效果）
組合條件 → 組合召喚獸（協同效果）
```

**四種召喚類型**：

| 類型 | 來源 | 觸發方式 | 持續時間 | 示例 |
|------|------|---------|---------|------|
| **技能召喚** | 技能升級 | 主動施放 | 戰鬥內持續 | 代碼精靈、重構巨龍 |
| **組合召喚** | 多技能組合 | 條件觸發 | 單次攻擊 | 測試守護者、文檔天使 |
| **工具召喚** | MCP 工具 | 被動/自動 | 戰鬥內持續 | 搜索蜘蛛、Git 章魚 |
| **道具召喚** | 特殊道具 | 使用道具 | 限定回合數 | 調試精靈、性能獵犬 |

### 召喚獸的價值

**對戰鬥的影響**：
1. ✅ **增強傷害**：召喚獸提供額外攻擊和技能
2. ✅ **提供 Buff**：增強玩家和夥伴的屬性
3. ✅ **自動化支援**：自動觸發有利行動
4. ✅ **戰術多樣性**：不同組合產生不同效果

**與技能的區別**：
- 技能：消耗 MP，主動使用，立即生效
- 召喚獸：消耗 MP 召喚，持續存在，提供持續效果

---

## 依賴關係

### 上游依賴

```
召喚獸系統依賴：
├─ 戰鬥系統（L2）- 提供戰鬥環境和回合機制
├─ 技能系統（L2）- 技能升級解鎖召喚獸
├─ 道具系統（L2）- 道具可召喚特殊召喚獸
└─ MCP 系統（L1）- MCP 工具轉化為工具召喚獸
```

### 下游依賴

```
影響的系統：
├─ 戰鬥 UI（L3）- 顯示召喚獸狀態和效果
├─ 技能商店（L3）- 可購買召喚相關技能
└─ 成就系統（L3）- 召喚相關成就
```

### 系統架構位置

```
L4: 展示層
    └─ 召喚獸 UI Panel
L3: 業務層
    ├─ 召喚獸商店
    └─ 召喚獸圖鑑
L2: 核心層 ⭐
    └─ 召喚獸系統（本系統）
L1: 基礎層
    └─ MCP 工具系統
L0: 數據層
    └─ 召喚獸數據結構
```

---

## 核心規則

### 規則 1：召喚獸類型與行為

#### 1.1 技能召喚獸（Skill Summon）

**獲取方式**：技能升級到 Lv.3 時解鎖

**召喚成本**：
```
summonCost = skillBaseCost * 2
// 例如：代碼生成術（10 MP）→ 代碼精靈（20 MP）
```

**行為類型**：
- **即時型（Immediate）**：召喚後立即執行一次強力效果，然後消失
- **自動型（Automatic）**：每回合自動執行動作，無需玩家操作

**示例**：
```
代碼精靈（Code Sprite）
├─ 來源：代碼生成術 Lv.3
├─ 成本：20 MP
├─ 行為：自動型
├─ 效果：每回合自動生成一段優化代碼（+15% 傷害）
└─ 持續：戰鬥結束
```

#### 1.2 組合召喚獸（Combo Summon）

**獲取方式**：滿足特定技能組合條件時觸發

**組合條件示例**：
```
// 測試守護者
condition: {
  skills: ['單元測試術', '集成測試術'],
  bothAtLeast: 'Lv.2'
}

// 文檔天使
condition: {
  skills: ['注釋術', 'README生成術', 'API文檔術'],
  anyAtLeast: 'Lv.2',
  count: 2  // 至少2個技能達標
}
```

**召喚成本**：
```
comboCost = Math.floor((skill1Cost + skill2Cost + ...) * 1.5)
// 例如：單元測試（8 MP）+ 集成測試（12 MP）= 30 MP
```

**行為類型**：即時型（召喚後執行一次強力協同攻擊）

**示例**：
```
測試守護者（Test Guardian）
├─ 組合：單元測試術 + 集成測試術
├─ 成本：30 MP
├─ 行為：即時型
├─ 效果：全面掃描敵人弱點，發動精準打擊（2.5x 傷害）
└─ 持續：單次攻擊
```

#### 1.3 工具召喚獸（MCP Tool Summon）

**獲取方式**：從知識圖書館購買 MCP 工具

**召喚成本**：
```
toolSummonCost = toolBaseCost * 3
// 例如：文件搜索工具（5 MP）→ 搜索蜘蛛（15 MP）
```

**行為類型**：
- **被動型（Passive）**：提供持續 Buff，不主動攻擊
- **自動型（Automatic）**：在特定條件下自動觸發有益行動

**示例**：
```
搜索蜘蛛（Search Spider）
├─ 來源：Grep 工具
├─ 成本：15 MP
├─ 行為：被動型
├─ 效果：所有搜索類技能成功率 +20%，MP 消耗 -10%
└─ 持續：戰鬥結束

Git 章魚（Git Octopus）
├─ 來源：Git 工具集
├─ 成本：25 MP
├─ 行為：自動型
├─ 效果：每回合自動執行一次代碼提交（+10 防禦）
└─ 持續：戰鬥結束
```

#### 1.4 道具召喚獸（Item Summon）

**獲取方式**：從商店購買特殊道具，或戰鬥掉落

**召喚成本**：使用道具（消耗道具，不消耗 MP）

**行為類型**：
- **互動型（Interactive）**：需要玩家指令才執行動作
- **即時型（Immediate）**：召喚後立即執行效果

**持續時間限制**：
```
duration = {
  Common: 2,      // 普通：2 回合
  Rare: 3,        // 稀有：3 回合
  Epic: 5,        // 史詩：5 回合
  Legendary: 8    // 傳說：8 回合
}
```

**示例**：
```
調試精靈（Debug Fairy）
├─ 來源：調試燈籠（稀有道具）
├─ 成本：使用道具（無 MP 消耗）
├─ 行為：互動型
├─ 效果：指定一個錯誤位置，立即修復（100% 成功率）
└─ 持續：3 回合

性能獵犬（Performance Hound）
├─ 來源：性能分析器（史詩道具）
├─ 成本：使用道具
├─ 行為：被動型
├─ 效果：所有技能執行速度 +30%，CD 減少 1 回合
└─ 持續：5 回合
```

---

### 規則 2：戰場單位數量限制

**總單位數上限：5 個**

```
戰鬥單位配置:
├─ 玩家: 1 個（固定）
├─ 夥伴: 最多 2 個
└─ 召喚獸: 最多 2 個（動態）
```

**召喚獸數量限制（動態）**:

| 夥伴數量 | 召喚獸上限 | 總單位數 | 說明 |
|---------|----------|---------|------|
| 2 個夥伴 | 最多 1 個召喚獸 | 1+2+1 = 4 | 夥伴優先配置 |
| 1 個夥伴 | 最多 2 個召喚獸 | 1+1+2 = 4 | 平衡配置 |
| 無夥伴 | 最多 2 個召喚獸 | 1+0+2 = 3 | 召喚獸優先配置 |

**回合順序**:
```
行動順序（按速度排序）:
玩家 → 夥伴1 → 夥伴2 → 召喚獸1 → 召喚獸2 → 敵人
```

**召喚規則**:
- 召喚新召喚獸時，如果已達上限，會解除最早的召喚獸
- 立即行動型召喚獸不占用槽位（使用後立即消失）
- 被動型召喚獸占用槽位但不參與回合行動
- 自動型召喚獸占用槽位並參與回合行動

---

### 規則 3：召喚獸屬性與稀有度

#### 2.1 稀有度系統

```
rarity = {
  Common: {
    color: '#9E9E9E',
    icon: '⚪',
    mpCost: 20,
    powerMultiplier: 1.0
  },
  Rare: {
    color: '#2196F3',
    icon: '🔵',
    mpCost: 40,
    powerMultiplier: 1.5
  },
  Epic: {
    color: '#9C27B0',
    icon: '🟣',
    powerMultiplier: 2.0,
    mpCost: 80
  },
  Legendary: {
    color: '#FF9800',
    icon: '🟠',
    mpCost: 120,
    powerMultiplier: 3.0
  }
}
```

**稀有度影響**：
- MP 消耗：越高越貴
- 效果強度：越高越強（傷害/Buff 倍數）
- 持續時間：越高越久
- 特殊能力：高稀有度有獨特效果

#### 2.2 召喚獸屬性

```typescript
interface Summon {
  // 基本資訊
  id: string;
  name: string;
  type: 'skill' | 'combo' | 'tool' | 'item';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';

  // 視覺
  icon: string;        // Emoji 圖標
  sprite: string;      // 像素藝術精靈
  color: string;       // 主題顏色

  // 召喚條件
  unlockCondition: {
    type: 'skill_level' | 'skill_combo' | 'tool_owned' | 'item_used';
    requirements: any;
  };

  // 成本
  mpCost: number;

  // 行為
  behavior: 'immediate' | 'automatic' | 'passive' | 'interactive';

  // 效果
  effect: {
    type: 'damage' | 'buff' | 'heal' | 'utility';
    power: number;      // 效果強度
    target: 'enemy' | 'self' | 'companion' | 'all';
    duration: number;   // 持續回合數（-1 = 戰鬥結束）
  };

  // 特殊能力
  special?: {
    name: string;
    description: string;
    trigger: 'on_summon' | 'per_turn' | 'on_condition';
    effect: any;
  };

  // 描述
  description: string;
  lore: string;        // 背景故事
}
```

---

### 規則 3：召喚獸戰鬥行為

#### 3.1 即時型（Immediate）

**觸發時機**：召喚後立即執行

**執行流程**：
```
1. 玩家召喚 → 扣除 MP
2. 召喚動畫（1 秒）
3. 執行效果（傷害/Buff/治療）
4. 召喚獸消失
```

**典型用途**：
- 高傷害爆發攻擊
- 緊急治療
- 強力 Buff 增益
- 移除 Debuff

**示例效果**：
```
// 重構巨龍（Refactor Dragon）
onSummon: () => {
  const damage = 300 + (player.level * 20);
  enemy.takeDamage(damage * 2.0);  // 雙倍傷害
  player.addBuff('重構光環', { attack: +30 }, 3);  // 3回合 Buff
  summon.remove();  // 立即消失
}
```

#### 3.2 自動型（Automatic）

**觸發時機**：每回合開始時自動執行

**執行流程**：
```
1. 玩家召喚 → 扣除 MP → 召喚獸進入戰場
2. 每回合開始：
   2.1 檢查召喚獸是否還在
   2.2 執行自動行動
   2.3 播放動畫和音效
3. 戰鬥結束：召喚獸消失
```

**典型用途**：
- 持續傷害輸出
- 自動化支援
- 資源回復
- 狀態維護

**示例效果**：
```
// 代碼精靈（Code Sprite）
onTurnStart: () => {
  if (summon.isActive) {
    const damage = 50 + (summon.power * 10);
    enemy.takeDamage(damage);
    battleLog.add(`代碼精靈自動生成優化代碼，造成 ${damage} 傷害！`);
  }
}
```

#### 3.3 被動型（Passive）

**觸發時機**：召喚後持續提供 Buff

**執行流程**：
```
1. 玩家召喚 → 扣除 MP → 召喚獸進入戰場
2. 添加持續 Buff 到玩家/夥伴
3. Buff 在召喚獸存在期間持續生效
4. 戰鬥結束或召喚獸消失時，Buff 移除
```

**典型用途**：
- 屬性增強（攻擊/防禦/速度）
- 技能增強（成功率/傷害/MP消耗）
- 抗性提升（減傷/免疫）
- 經驗加成

**示例效果**：
```
// 搜索蜘蛛（Search Spider）
onSummon: () => {
  player.addBuff('搜索強化', {
    searchSkillSuccess: +20,  // 搜索技能成功率 +20%
    searchSkillCost: -10      // MP 消耗 -10%
  }, -1);  // -1 = 直到召喚獸消失
}

onRemove: () => {
  player.removeBuff('搜索強化');
}
```

#### 3.4 互動型（Interactive）

**觸發時機**：需要玩家主動指令

**執行流程**：
```
1. 玩家召喚 → 召喚獸進入待命狀態
2. 玩家回合：可選擇指令召喚獸執行動作
3. 執行動作：消耗召喚獸的使用次數
4. 使用次數耗盡或持續時間結束：召喚獸消失
```

**典型用途**：
- 精準控制技能
- 戰術選擇
- 資源管理
- 組合技能

**示例效果**：
```
// 調試精靈（Debug Fairy）
interface: {
  commands: [
    {
      name: '定位錯誤',
      cost: 1,  // 消耗 1 次使用
      effect: () => {
        const bugLocation = detectBug();
        highlightCode(bugLocation);
        return `發現錯誤：${bugLocation.file}:${bugLocation.line}`;
      }
    },
    {
      name: '修復錯誤',
      cost: 2,
      effect: () => {
        fixBug();
        return '錯誤已修復！獲得 +50 經驗';
      }
    }
  ],
  maxUses: 3  // 總共可使用 3 次
}
```

---

### 規則 4：召喚獸協同效果

#### 4.1 與夥伴的協同

**協同加成**：
```
// 協同條件判斷
if (companion.type === 'Warrior' && summon.type === 'damage') {
  summon.damage *= 1.3;  // 戰士夥伴 + 傷害召喚獸 = +30% 傷害
}

if (companion.type === 'Healer' && summon.type === 'buff') {
  summon.duration += 2;  // 治療師夥伴 + Buff召喚獸 = 持續時間 +2 回合
}

if (companion.type === 'Mage' && summon.behavior === 'automatic') {
  summon.frequency *= 2;  // 法師夥伴 + 自動召喚獸 = 觸發頻率 x2
}
```

**協同技組合**：
```
玩家技能 + 夥伴技能 + 召喚獸 = 組合技
例如：
- 代碼生成術 + 夥伴重構術 + 代碼精靈 = 「完美代碼」（3x 傷害 + 無 Bug）
- 單元測試術 + 夥伴調試術 + 測試守護者 = 「全面測試」（100% 覆蓋率）
```

#### 4.2 多召喚獸協同

**協同規則**：
- 最多同時存在 2 個召喚獸
- 相同類型召喚獸效果不疊加（取最高）
- 不同類型召喚獸效果完全疊加

**協同效果表**：

| 召喚獸 A | 召喚獸 B | 協同效果 |
|---------|---------|---------|
| 代碼精靈 | 測試守護者 | 生成的代碼自動通過測試（+50% 質量分） |
| 搜索蜘蛛 | Git 章魚 | 搜索結果自動提交（省略手動操作） |
| 性能獵犬 | 調試精靈 | 性能優化 + 錯誤修復同時進行 |

**協同觸發條件**：
```typescript
interface SynergyCondition {
  summons: string[];  // 需要的召喚獸 ID
  effect: {
    type: 'bonus_damage' | 'extra_buff' | 'special_ability';
    power: number;
    description: string;
  };
}

// 示例
const codeSynergy: SynergyCondition = {
  summons: ['code_sprite', 'test_guardian'],
  effect: {
    type: 'bonus_damage',
    power: 50,  // +50% 傷害
    description: '完美代碼：生成的代碼質量極高，造成額外 50% 傷害'
  }
};
```

---

### 規則 5：召喚獸成長與升級

#### 5.1 召喚獸經驗

**經驗獲取**：
```
summon.exp += {
  onSummon: 10,           // 每次召喚 +10 EXP
  onDefeat: 20,           // 擊敗敵人 +20 EXP
  onVictory: 50,          // 戰鬥勝利 +50 EXP
  onPerfect: 100          // 完美勝利 +100 EXP
}
```

**升級公式**：
```
expToNextLevel = 200 * Math.pow(1.4, level - 1)
// Lv.1 → Lv.2: 200 EXP
// Lv.2 → Lv.3: 280 EXP
// Lv.3 → Lv.4: 392 EXP
```

#### 5.2 升級獎勵

**每次升級獲得**：
```
onLevelUp: {
  power: +10,            // 效果強度 +10
  mpCost: -2,            // MP 消耗 -2（最低降至原值的 70%）
  duration: +1,          // 持續時間 +1 回合

  // 每 5 級解鎖新能力
  specialUnlock: level % 5 === 0 ? true : false
}
```

**特殊能力解鎖**：
```
Lv.5 → 解鎖第一個特殊能力
Lv.10 → 解鎖第二個特殊能力（更強）
Lv.15 → 解鎖終極能力
```

**示例**：
```
代碼精靈 Lv.1
├─ 傷害：50/回合
├─ 成本：20 MP
└─ 能力：自動生成代碼

代碼精靈 Lv.5
├─ 傷害：90/回合（+40）
├─ 成本：16 MP（-4）
└─ 能力：自動生成代碼 + 代碼優化（新能力）

代碼精靈 Lv.10
├─ 傷害：140/回合（+90）
├─ 成本：14 MP（-6）
└─ 能力：自動生成代碼 + 代碼優化 + 智能重構（新能力）
```

---

### 規則 6：召喚獸管理與限制

#### 6.1 召喚限制

**數量限制**：
```
maxActiveSummons = {
  default: 2,           // 默認最多 2 個
  withCompanion: 1,     // 有夥伴時只能 1 個
  withoutCompanion: 3   // 無夥伴時可以 3 個
}
```

**類型限制**：
```
// 相同類型不能重複召喚
if (activeSummons.find(s => s.id === newSummon.id)) {
  return { error: '此召喚獸已在場上！' };
}

// 相同效果類型只生效最強的
if (activeSummons.find(s => s.effect.type === newSummon.effect.type)) {
  const existing = activeSummons.find(s => s.effect.type === newSummon.effect.type);
  if (newSummon.effect.power > existing.effect.power) {
    existing.remove();  // 移除舊的
  } else {
    return { error: '已有更強的同類召喚獸！' };
  }
}
```

#### 6.2 召喚獸替換

**替換規則**：
1. 達到數量上限時，新召喚獸會提示替換
2. 玩家選擇要替換的召喚獸
3. 舊召喚獸消失，新召喚獸進場
4. 替換不退還舊召喚獸的 MP

**替換 UI**：
```
┌────────────────────────────────────────┐
│  召喚獸數量已達上限（2/2）             │
│                                        │
│  選擇要替換的召喚獸：                  │
│                                        │
│  [1] 代碼精靈 Lv.3                     │
│      傷害：70/回合 | 剩餘：5 回合       │
│                                        │
│  [2] 搜索蜘蛛 Lv.2                     │
│      Buff：搜索 +20% | 剩餘：戰鬥結束  │
│                                        │
│  [取消召喚]                            │
└────────────────────────────────────────┘
```

#### 6.3 召喚獸圖鑑

**圖鑑系統**：
```typescript
interface SummonDex {
  totalSummons: number;        // 總召喚獸數量
  discovered: number;          // 已發現數量
  maxLevel: number;            // 最高等級

  entries: {
    [summonId: string]: {
      discovered: boolean;     // 是否已發現
      level: number;           // 當前等級
      exp: number;             // 當前經驗
      timesUsed: number;       // 使用次數
      victories: number;       // 參與勝利次數
      totalDamage: number;     // 總傷害
      favorite: boolean;       // 是否收藏
    }
  };
}
```

**圖鑑獎勵**：
```
dexRewards = {
  10: { gold: 500, title: '見習召喚師' },
  25: { gold: 1500, title: '召喚師' },
  50: { gold: 5000, title: '大召喚師' },
  100: { gold: 20000, title: '傳說召喚師', special: '所有召喚獸 MP 消耗 -20%' }
}
```

---

### 規則 7：召喚獸 MP 成本設計

#### 7.1 成本計算公式

**基礎成本**：
```
// 基於稀有度
baseCost = {
  Common: 20,
  Rare: 40,
  Epic: 80,
  Legendary: 120
}

// 基於行為類型
behaviorMultiplier = {
  immediate: 1.0,      // 即時型不調整
  automatic: 1.3,      // 自動型 +30%
  passive: 1.5,        // 被動型 +50%（持續增益強）
  interactive: 0.8     // 互動型 -20%（需要操作）
}

// 基於效果強度
powerMultiplier = effect.power / 100  // 效果強度百分比

// 最終成本
finalCost = Math.floor(baseCost * behaviorMultiplier * powerMultiplier)
```

**成本調整因素**：
```
// 等級折扣
if (summon.level >= 10) {
  finalCost *= 0.85;  // Lv.10+ 降低 15%
}

// 夥伴協同折扣
if (hasCompatibleCompanion) {
  finalCost *= 0.9;  // 降低 10%
}

// 圖鑑獎勵
if (dex.completionRate >= 0.5) {
  finalCost *= 0.8;  // 圖鑑完成 50% 以上，降低 20%
}
```

#### 7.2 成本平衡

**設計目標**：
- 強力召喚獸應該有高 MP 成本
- 玩家需要在多個召喚獸間做選擇
- 戰術深度：何時召喚、召喚哪個

**成本範例**：

| 召喚獸 | 稀有度 | 行為 | 基礎成本 | 最終成本 |
|-------|--------|------|---------|---------|
| 代碼精靈 | Common | 自動 | 20 | 26 MP |
| 搜索蜘蛛 | Rare | 被動 | 40 | 60 MP |
| 測試守護者 | Epic | 即時 | 80 | 80 MP |
| 重構巨龍 | Legendary | 即時 | 120 | 120 MP |

---

## 內部地圖

### 召喚獸類型圖

```
召喚獸系統
├─ 技能召喚獸（Skill Summon）
│  ├─ 代碼精靈（Code Sprite）- 自動生成代碼
│  ├─ 重構巨龍（Refactor Dragon）- 高傷害重構攻擊
│  ├─ 測試幼龍（Test Drake）- 自動化測試
│  └─ 文檔天使（Doc Angel）- 自動生成文檔
│
├─ 組合召喚獸（Combo Summon）
│  ├─ 測試守護者（Test Guardian）- 單元測試 + 集成測試
│  ├─ 完美代碼（Perfect Code）- 代碼生成 + 重構 + 測試
│  └─ CI/CD 精靈（CI/CD Spirit）- Git + 測試 + 部署
│
├─ 工具召喚獸（MCP Tool Summon）
│  ├─ 搜索蜘蛛（Search Spider）- Grep 工具
│  ├─ Git 章魚（Git Octopus）- Git 工具集
│  ├─ 文件守衛（File Guardian）- 文件操作工具
│  └─ 網絡獵犬（Web Hound）- HTTP 請求工具
│
└─ 道具召喚獸（Item Summon）
   ├─ 調試精靈（Debug Fairy）- 調試燈籠道具
   ├─ 性能獵犬（Performance Hound）- 性能分析器道具
   ├─ 安全衛士（Security Guard）- 安全掃描器道具
   └─ 備份巨龜（Backup Turtle）- 自動備份器道具
```

### 召喚獸管理 UI

```
┌─────────────────────────────────────────────────────────┐
│                   召喚獸面板                             │
├─────────────────────────────────────────────────────────┤
│  已激活召喚獸（2/2）                                     │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ 🧚 代碼精靈 Lv.3     │  │ 🕷️ 搜索蜘蛛 Lv.2     │   │
│  │                      │  │                      │   │
│  │ [████████░░] 70/回合 │  │ Buff: 搜索 +20%      │   │
│  │ 剩餘：5 回合         │  │ 剩餘：戰鬥結束       │   │
│  │                      │  │                      │   │
│  │ [移除] [詳情]        │  │ [移除] [詳情]        │   │
│  └──────────────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  可召喚列表                                              │
│                                                         │
│  🔵 測試守護者 [40 MP] - 組合召喚                       │
│  ⚪ 文檔天使 [26 MP] - 技能召喚                         │
│  🟣 重構巨龍 [80 MP] - 技能召喚                        │
│  🟠 完美代碼 [120 MP] - 組合召喚（未解鎖）              │
│                                                         │
│  [召喚獸圖鑑] [排序：稀有度▼] [篩選：全部]             │
└─────────────────────────────────────────────────────────┘
```

### 召喚動畫流程

```
召喚動畫序列：

1. 準備階段（0.3s）
   ┌────────────────┐
   │  玩家舉起手    │
   │  ✋ → ✨       │
   └────────────────┘

2. 召喚陣展開（0.5s）
   ┌────────────────┐
   │   ◯ ◯ ◯       │
   │  ◯ ⭐ ◯       │
   │   ◯ ◯ ◯       │
   │  魔法陣旋轉    │
   └────────────────┘

3. 召喚獸出現（0.4s）
   ┌────────────────┐
   │      💫        │
   │    🧚 ✨       │
   │  代碼精靈出現  │
   └────────────────┘

4. 效果激活（0.3s）
   ┌────────────────┐
   │   💚 HP+20     │
   │   💙 MP-20     │
   │  ⭐ Buff 激活  │
   └────────────────┘

總時長：1.5 秒
音效：召喚咒語 → 魔法陣旋轉 → 出現音效 → 效果音
```

### 召喚獸圖鑑 UI

```
┌─────────────────────────────────────────────────────────┐
│                 召喚獸圖鑑 📖                            │
├─────────────────────────────────────────────────────────┤
│  收集進度：24/50 (48%)                                  │
│  [██████████░░░░░░░░░░]                                │
│                                                         │
│  篩選：[全部] [技能] [組合] [工具] [道具]               │
│  排序：[稀有度] [等級] [使用次數]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚪ 代碼精靈 Lv.3      🔵 測試守護者 Lv.2               │
│  使用 45 次            使用 12 次                        │
│  勝率 89%              勝率 100%                        │
│  [詳情]                [詳情]                           │
│                                                         │
│  🟣 重構巨龍 Lv.5      🟠 完美代碼 ???                 │
│  使用 8 次             未解鎖                           │
│  勝率 100%             需要：代碼生成 Lv.5              │
│  [詳情]                [查看條件]                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  圖鑑獎勵：                                              │
│  ✅ 10 個 - 見習召喚師 (+500 金幣)                      │
│  ✅ 25 個 - 召喚師 (+1500 金幣)                         │
│  🔒 50 個 - 大召喚師 (+5000 金幣 + 特殊能力)            │
└─────────────────────────────────────────────────────────┘
```

### 召喚獸詳情視圖

```
┌─────────────────────────────────────────────────────────┐
│  🧚 代碼精靈 (Code Sprite)                              │
│  稀有度：⚪ Common | 類型：技能召喚                      │
├─────────────────────────────────────────────────────────┤
│  等級：Lv.3 [████████░░] 280/392 EXP                   │
│                                                         │
│  ├─ 傷害：70/回合（基礎 50 + 等級加成 20）              │
│  ├─ MP 成本：24（原始 26 - 等級折扣 2）                 │
│  ├─ 行為：自動型（每回合自動攻擊）                      │
│  └─ 持續：戰鬥結束                                      │
│                                                         │
│  特殊能力：                                              │
│  ✅ Lv.1 - 代碼生成（自動生成優化代碼）                 │
│  ✅ Lv.5 - 代碼優化（生成代碼質量 +20%）                │
│  🔒 Lv.10 - 智能重構（需要 220 EXP）                   │
│                                                         │
│  統計資訊：                                              │
│  ├─ 使用次數：45 次                                     │
│  ├─ 參與戰鬥：38 場                                     │
│  ├─ 勝利次數：34 場（勝率 89%）                         │
│  └─ 總傷害：15,200                                      │
│                                                         │
│  解鎖條件：                                              │
│  ✅ 代碼生成術 Lv.3                                     │
│                                                         │
│  背景故事：                                              │
│  由純粹的代碼能量凝聚而成的精靈，擅長自動生成           │
│  高質量代碼。據說它們是從第一行 "Hello World"           │
│  中誕生的...                                            │
│                                                         │
│  [返回] [設為最愛 ⭐] [分享]                           │
└─────────────────────────────────────────────────────────┘
```

---

## 系統整合

### 與戰鬥系統整合

**戰鬥流程中的召喚**：

```
// 1. 戰鬥回合開始
function onTurnStart() {
  // 觸發自動型召喚獸
  activeSummons
    .filter(s => s.behavior === 'automatic')
    .forEach(summon => {
      summon.executeAction();
      battleLog.add(`${summon.name} 自動執行動作！`);
    });
}

// 2. 玩家回合
function onPlayerTurn() {
  // 玩家可選擇：
  // - 使用技能
  // - 召喚新召喚獸
  // - 指令互動型召喚獸
  // - 移除現有召喚獸（釋放位置）
}

// 3. 召喚獸檢查
function checkSummons() {
  activeSummons.forEach(summon => {
    // 檢查持續時間
    if (summon.duration > 0) {
      summon.duration--;
    }

    // 時間到，移除召喚獸
    if (summon.duration === 0) {
      removeSummon(summon);
      battleLog.add(`${summon.name} 消失了...`);
    }
  });
}

// 4. 戰鬥結束
function onBattleEnd() {
  // 記錄召喚獸經驗
  activeSummons.forEach(summon => {
    summon.exp += victory ? 50 : 20;
    checkSummonLevelUp(summon);
  });

  // 清除所有召喚獸
  clearAllSummons();
}
```

### 與技能系統整合

**技能解鎖召喚獸**：

```
// 技能升級時檢查
function onSkillLevelUp(skill) {
  if (skill.level === 3) {
    // 解鎖對應的技能召喚獸
    const summon = unlockSkillSummon(skill.id);
    showNotification(`解鎖新召喚獸：${summon.name}！`);
    updateSummonDex(summon.id, 'discovered', true);
  }
}

// 技能組合檢查
function checkComboSummons() {
  comboSummons.forEach(combo => {
    const requirements = combo.unlockCondition.requirements;

    // 檢查是否滿足所有條件
    const unlocked = requirements.every(req => {
      const skill = player.skills[req.skillId];
      return skill && skill.level >= req.level;
    });

    if (unlocked && !combo.discovered) {
      unlockComboSummon(combo.id);
      showNotification(`發現組合召喚：${combo.name}！`);
    }
  });
}
```

### 與夥伴系統整合

**夥伴協同加成**：

```
// 計算召喚獸效果時考慮夥伴
function calculateSummonEffect(summon, companion) {
  let effect = summon.baseEffect;

  // 檢查協同效果
  const synergy = checkSynergy(summon, companion);

  if (synergy) {
    effect.power *= synergy.multiplier;
    effect.duration += synergy.bonusDuration;
    battleLog.add(`${companion.name} 與 ${summon.name} 產生協同效果！`);
  }

  return effect;
}

// 協同效果表
const synergyTable = {
  'warrior+damage_summon': {
    multiplier: 1.3,
    bonusDuration: 0,
    message: '戰士的力量增幅了召喚獸的攻擊！'
  },
  'healer+buff_summon': {
    multiplier: 1.0,
    bonusDuration: 2,
    message: '治療師延長了召喚獸的增益效果！'
  },
  'mage+automatic_summon': {
    multiplier: 1.5,
    bonusDuration: 0,
    message: '法師的魔力增強了召喚獸的自動能力！'
  }
};
```

### 與商店系統整合

**召喚獸相關商品**：

```
// 技能商店
skillShop.addCategory('召喚技能', [
  {
    name: '高級召喚術',
    price: 1200,
    effect: '召喚獸數量上限 +1',
    requiredLevel: 10
  },
  {
    name: '召喚強化',
    price: 800,
    effect: '所有召喚獸效果 +20%',
    requiredLevel: 8
  }
]);

// 道具商店
itemShop.addCategory('召喚道具', [
  {
    name: '調試燈籠',
    price: 500,
    rarity: 'Rare',
    effect: '召喚調試精靈（3回合）'
  },
  {
    name: '性能分析器',
    price: 1500,
    rarity: 'Epic',
    effect: '召喚性能獵犬（5回合）'
  }
]);

// 知識圖書館
mcpLibrary.addCategory('工具召喚', [
  {
    name: 'Grep 工具包',
    price: 300,
    effect: '解鎖搜索蜘蛛召喚'
  },
  {
    name: 'Git 工具集',
    price: 600,
    effect: '解鎖 Git 章魚召喚'
  }
]);
```

### 與成就系統整合

**召喚獸相關成就**：

```
achievements.register([
  {
    id: 'first_summon',
    name: '初次召喚',
    description: '首次成功召喚召喚獸',
    reward: { gold: 100, exp: 50 },
    trigger: 'on_first_summon'
  },
  {
    id: 'summon_master',
    name: '召喚大師',
    description: '同時擁有 2 個以上活躍召喚獸',
    reward: { gold: 500, title: '召喚大師' },
    trigger: 'on_multiple_summons'
  },
  {
    id: 'dex_collector',
    name: '圖鑑收藏家',
    description: '發現 25 種不同的召喚獸',
    reward: { gold: 1500, special: '召喚獸 MP 消耗 -10%' },
    trigger: 'on_dex_milestone'
  },
  {
    id: 'synergy_expert',
    name: '協同專家',
    description: '觸發 10 次召喚獸協同效果',
    reward: { gold: 800, title: '協同專家' },
    trigger: 'on_synergy_count'
  },
  {
    id: 'legendary_summoner',
    name: '傳說召喚師',
    description: '收集所有傳說級召喚獸',
    reward: { gold: 5000, title: '傳說召喚師', special: '傳說召喚獸 MP 消耗 -30%' },
    trigger: 'on_all_legendary'
  }
]);
```

---

## 設計決策

### 決策 1：為什麼有四種召喚類型？

**背景**：
召喚獸系統需要多樣性，讓玩家有不同的獲取和使用方式。

**考慮方案**：
1. **單一類型**：只有技能召喚
   - ✅ 簡單易懂
   - ❌ 缺乏多樣性
   - ❌ 無法整合其他系統

2. **兩種類型**：技能召喚 + 道具召喚
   - ✅ 有基礎多樣性
   - ❌ 未充分利用遊戲系統
   - ❌ MCP 工具缺乏用途

3. **四種類型**：技能 + 組合 + 工具 + 道具 ⭐
   - ✅ 高度多樣性
   - ✅ 整合多個遊戲系統
   - ✅ 獎勵玩家探索和組合
   - ⚠️ 複雜度稍高

**最終決定**：採用四種類型

**理由**：
1. 技能召喚：獎勵技能升級
2. 組合召喚：鼓勵技能組合，增加深度
3. 工具召喚：給 MCP 工具實際遊戲價值
4. 道具召喚：提供短期爆發能力，增加戰術選擇

### 決策 2：為什麼需要四種行為模式？

**背景**：
召喚獸不應該都是「被動存在」，需要不同的互動方式。

**考慮方案**：
1. **全自動**：所有召喚獸都自動執行
   - ✅ 簡單
   - ❌ 缺乏玩家控制感
   - ❌ 戰術深度低

2. **全手動**：所有召喚獸需要玩家指令
   - ✅ 玩家控制感強
   - ❌ 操作負擔重
   - ❌ 可能打斷戰鬥節奏

3. **四種模式混合**：即時/自動/被動/互動 ⭐
   - ✅ 滿足不同玩家偏好
   - ✅ 戰術深度高
   - ✅ 不同召喚獸有獨特性
   - ⚠️ 需要清楚的 UI 說明

**最終決定**：四種行為模式

**理由**：
- 即時型：適合爆發傷害和緊急情況
- 自動型：減少操作負擔，提供持續輸出
- 被動型：提供長期增益，不打斷節奏
- 互動型：給高級玩家更多控制和深度

### 決策 3：為什麼限制召喚數量？

**背景**：
需要平衡召喚獸的強度和資源管理。

**考慮方案**：
1. **無限制**：想召喚多少就多少
   - ✅ 玩家自由度高
   - ❌ 完全失衡
   - ❌ 無戰術選擇

2. **固定 1 個**：只能有 1 個召喚獸
   - ✅ 簡單平衡
   - ❌ 無法組合
   - ❌ 缺乏協同效果

3. **動態限制（2-3 個）** ⭐
   - ✅ 允許組合和協同
   - ✅ 強制戰術選擇
   - ✅ 與夥伴系統平衡
   - ✅ 鼓勵替換和管理

**最終決定**：動態限制（有夥伴 1 個，無夥伴 2-3 個）

**理由**：
1. 限制數量強制玩家做選擇（戰術深度）
2. 2 個允許協同效果
3. 與夥伴系統平衡（避免太多單位）
4. 可通過技能升級增加上限（成長感）

### 決策 4：為什麼召喚獸可以升級？

**背景**：
召喚獸是否應該有成長系統？

**考慮方案**：
1. **固定不變**：召喚獸屬性不變
   - ✅ 簡單
   - ❌ 缺乏長期目標
   - ❌ 後期吸引力低

2. **跟隨玩家等級**：自動隨玩家成長
   - ✅ 不需要額外操作
   - ❌ 缺乏投資感
   - ❌ 無法個性化培養

3. **獨立升級系統** ⭐
   - ✅ 給玩家長期目標
   - ✅ 增加投資感和情感連結
   - ✅ 解鎖新能力（Lv.5, Lv.10）
   - ⚠️ 增加系統複雜度

**最終決定**：獨立升級系統

**理由**：
1. 獎勵頻繁使用的召喚獸
2. 提供長期成長目標
3. 解鎖特殊能力增加深度
4. 增強玩家與召喚獸的情感連結

### 決策 5：為什麼需要召喚獸圖鑑？

**背景**：
如何鼓勵玩家收集和嘗試不同召喚獸？

**考慮方案**：
1. **無收集系統**：僅顯示已擁有的
   - ✅ 簡單
   - ❌ 缺乏收集動力
   - ❌ 無法預覽未解鎖內容

2. **簡單列表**：僅列出所有召喚獸
   - ✅ 可以預覽
   - ❌ 缺乏成就感
   - ❌ 無獎勵機制

3. **完整圖鑑系統** ⭐
   - ✅ 提供收集進度和成就
   - ✅ 顯示詳細資訊和背景故事
   - ✅ 里程碑獎勵
   - ✅ 增加遊戲可玩性
   - ⚠️ 需要額外 UI 開發

**最終決定**：完整圖鑑系統

**理由**：
1. 增加收集動力和長期目標
2. 里程碑獎勵鼓勵探索
3. 背景故事增強世界觀
4. 統計資訊給玩家成就感
5. 參考成功案例（Pokemon, Monster Hunter）

---

**文檔完成日期**: 2026-02-06
**總字數**: ~5,800
**章節**: 6
**來源文件**: `/docs/design/summon-beast-system/requirements.md` (701 lines)
