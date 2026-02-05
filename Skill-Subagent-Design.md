# RPG-CLI Skill & Subagent 系統設計

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 詳細設計階段

---

## 目錄

1. [核心概念](#核心概念)
2. [Skill 技能系統](#skill-技能系統)
3. [Subagent 子代理系統](#subagent-子代理系統)
4. [系統整合](#系統整合)
5. [技術實現](#技術實現)
6. [開發路線圖](#開發路線圖)

---

## 核心概念

### 設計理念

```
問題:
單純的 Prompt 模板太簡單，缺乏深度和成長感

解決方案:
Skill System（技能系統）
  ├─ 可升級的 Prompt 模板
  ├─ 技能組合（Combo）
  ├─ 技能樹（Skill Tree）
  └─ 被動技能（Passive Skills）

Subagent System（子代理系統）
  ├─ 專門化的 AI 助手
  ├─ 不同的人格和專長
  ├─ 可召喚和升級
  └─ 協作模式
```

### 概念映射

```
遊戲概念          →    實際對應
─────────────────────────────────────
技能（Skill）     →    Prompt 模板
技能等級          →    模板複雜度提升
技能組合          →    多步驟 Prompt 鏈
技能樹            →    專業化發展路徑
召喚獸/夥伴       →    專門化 AI Agent
夥伴等級          →    System Prompt 優化
夥伴技能          →    專屬 Prompt 集
組隊              →    多 Agent 協作
```

---

## Skill 技能系統

### 一、技能分類體系

#### 技能類型架構

```
技能分類樹:

📚 基礎技能（Basic Skills）- Lv.1 解鎖
├─ ⚔️  代碼生成（Code Generation）
│   └─ 快速生成基礎代碼
├─ 📜 文案撰寫（Content Writing）
│   └─ 創作各類文案內容
├─ ✨ 翻譯潤色（Translation & Polish）
│   └─ 翻譯和改善文字
├─ 💡 問題解答（Q&A）
│   └─ 回答各類問題
└─ 🔍 資訊搜尋（Information Search）
    └─ 尋找和整理資訊

🔥 進階技能（Advanced Skills）- Lv.10+ 解鎖
├─ 🛠️  代碼重構（Code Refactoring）
│   └─ 優化和重構現有代碼
├─ 🏗️  架構設計（Architecture Design）
│   └─ 系統架構規劃
├─ 📊 SEO優化（SEO Optimization）
│   └─ 內容搜尋引擎優化
├─ 🎨 品牌文案（Brand Copywriting）
│   └─ 專業品牌內容創作
└─ ⚡ 性能優化（Performance Optimization）
    └─ 代碼和系統性能提升

⚡ 組合技能（Combo Skills）- Lv.20+ 解鎖
├─ 💻 全棧開發（Full Stack Dev）
│   └─ 代碼生成 + 架構設計 + 測試生成
├─ 📝 內容行銷（Content Marketing）
│   └─ 文案撰寫 + SEO優化 + 社群貼文
├─ 🐛 Debug Master
│   └─ Bug診斷 + 代碼審查 + 修復建議
└─ 🎯 完美重構（Perfect Refactor）
    └─ 代碼審查 + 重構 + 測試生成

🌟 被動技能（Passive Skills）- 特殊解鎖
├─ 🤖 智能補全（Auto Complete）
│   └─ 自動提供代碼建議
├─ 📋 自動格式化（Auto Format）
│   └─ 自動格式化代碼
├─ ⚠️  錯誤預警（Error Detection）
│   └─ 即時檢測潛在問題
└─ 💾 智能暫存（Smart Stash）
    └─ 自動保存工作進度
```

---

### 二、技能數據結構

#### 基礎技能範例

```javascript
{
  skill: {
    // 基本資訊
    id: 'code_gen',
    name: '代碼生成',
    icon: '⚔️',
    type: 'basic',          // basic/advanced/combo/passive
    category: 'development', // development/writing/design

    // 等級與經驗
    level: 3,
    experience: 450,
    nextLevelExp: 500,
    maxLevel: 10,

    // 效果（隨等級變化）
    effects: {
      level1: {
        mpCost: 15,
        quality: 'basic',
        cooldown: 0,
        features: ['基礎代碼生成']
      },
      level2: {
        mpCost: 13,
        quality: 'good',
        cooldown: 0,
        features: ['基礎代碼生成', '加入註解']
      },
      level3: {
        mpCost: 10,
        quality: 'excellent',
        cooldown: 0,
        features: [
          '基礎代碼生成',
          '詳細註解',
          '錯誤處理',
          '基礎測試'
        ]
      },
      level5: {
        mpCost: 8,
        quality: 'superior',
        cooldown: 0,
        features: [
          '進階代碼生成',
          '完整文檔',
          '完善錯誤處理',
          '單元測試',
          '類型定義'
        ]
      },
      level10: {
        mpCost: 5,
        quality: 'legendary',
        cooldown: 0,
        features: [
          '專家級代碼生成',
          '完整文檔和範例',
          '完善錯誤處理',
          '完整測試覆蓋',
          '類型定義',
          '性能優化',
          '安全性考量'
        ]
      }
    },

    // Prompt 模板（隨等級變化）
    templates: {
      level1: '請幫我用{lang}實現{feature}',
      level3: `請幫我用{lang}實現{feature}
要求：
- 加入詳細註解說明
- 包含基本錯誤處理
- 遵循最佳實踐`,
      level5: `請幫我用{lang}實現{feature}
要求：
- 完整的代碼註解和文檔
- 完善的錯誤處理機制
- 包含單元測試
- 使用TypeScript類型定義（如適用）
- 遵循{lang}的最佳實踐和設計模式`,
      level10: `請幫我用{lang}實現{feature}
作為一個資深工程師，請提供：
1. 完整的實現代碼，包含：
   - 詳細的文檔註解（JSDoc/類似格式）
   - 完善的錯誤處理和邊界情況處理
   - 性能優化考量
   - 安全性檢查
2. 完整的單元測試（覆蓋率>80%）
3. 使用範例和說明
4. 可能的改進建議
請遵循{lang}的最佳實踐和SOLID原則`
    },

    // 參數定義
    params: [
      {
        name: 'lang',
        label: '程式語言',
        type: 'select',
        options: [
          'JavaScript',
          'TypeScript',
          'Python',
          'Java',
          'Go',
          'Rust',
          'PHP',
          'Ruby'
        ],
        default: 'JavaScript',
        required: true
      },
      {
        name: 'feature',
        label: '功能描述',
        type: 'textarea',
        placeholder: '請詳細描述要實現的功能...',
        required: true,
        minLength: 10
      }
    ],

    // 使用統計
    stats: {
      totalUses: 45,
      successRate: 0.92,
      avgTokens: 350,
      avgRating: 4.5,
      lastUsed: '2026-02-05T10:30:00Z',
      favorited: true
    },

    // 解鎖條件
    unlockRequirements: {
      level: 1,
      prerequisite: [],
      achievement: null
    },

    // 標籤（用於搜尋和分類）
    tags: ['code', 'generation', 'development', 'programming'],

    // 創建者（自定義技能）
    author: 'system',  // system 或 user_id
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-05T10:30:00Z'
  }
}
```

---

### 三、技能升級系統

#### 升級機制

```javascript
// 技能升級計算
class SkillLevelingSystem {
  // 計算升級所需經驗
  calculateExpForLevel(level) {
    // 指數增長公式
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // 獲得經驗值
  gainExperience(skill, amount) {
    skill.experience += amount;

    // 檢查是否升級
    while (skill.experience >= this.calculateExpForLevel(skill.level + 1)) {
      if (skill.level >= skill.maxLevel) {
        skill.experience = this.calculateExpForLevel(skill.maxLevel);
        break;
      }

      // 升級！
      skill.level++;
      this.triggerLevelUp(skill);
    }

    skill.nextLevelExp = this.calculateExpForLevel(skill.level + 1);
  }

  // 升級觸發
  triggerLevelUp(skill) {
    // 播放升級動畫
    this.playLevelUpAnimation(skill);

    // 顯示升級通知
    this.showLevelUpNotification(skill);

    // 解鎖新效果
    const newEffects = skill.effects[`level${skill.level}`];
    this.showNewEffects(skill, newEffects);

    // 給予獎勵
    const reward = {
      exp: skill.level * 10,
      gold: skill.level * 5
    };

    return reward;
  }

  // 計算技能使用獲得的經驗
  calculateSkillExp(usage) {
    let exp = 10; // 基礎經驗

    // 根據 token 使用量
    exp += Math.floor(usage.tokens / 100);

    // 根據用戶評分
    if (usage.userRating) {
      exp += usage.userRating * 2;
    }

    // 首次使用獎勵
    if (usage.isFirstTime) {
      exp += 20;
    }

    return exp;
  }
}
```

#### 升級效果展示

```
升級動畫流程:

1. 技能使用完成
   ↓
2. 經驗值增加動畫
   ⚔️ 代碼生成
   EXP ███████░░░ 450/500
       ↓ +60 EXP
   EXP ██████████ 510/500

3. 觸發升級
   ┌────────────────────────────┐
   │     ✨ 技能升級！✨        │
   │                            │
   │      ⚔️ 代碼生成            │
   │     Lv.2 → Lv.3            │
   │                            │
   │  新效果解鎖:                │
   │  • MP消耗: 13 → 10         │
   │  • 品質提升: Good → Excellent│
   │  ✓ 加入錯誤處理             │
   │  ✓ 加入基礎測試             │
   │                            │
   │  [太棒了！]                │
   └────────────────────────────┘

4. [音效: skill_levelup.wav]
```

---

### 四、技能鏈（Combo System）

#### Combo 概念

```
技能鏈機制:
連續使用相關技能會觸發組合效果

好處:
• 鼓勵完整的工作流程
• 提供額外獎勵
• 提升工作品質
```

#### Combo 定義

```javascript
const skillCombos = [
  {
    id: 'perfect_refactor',
    name: '完美重構',
    icon: '🎯',
    description: '完整的代碼重構流程',

    // 技能序列
    skills: [
      'code_review',    // 1. 先審查
      'refactor',       // 2. 再重構
      'test_gen'        // 3. 最後測試
    ],

    // 執行順序
    order: 'sequential',  // sequential（必須按順序）或 any（任意順序）

    // 時間窗口（秒）
    timeWindow: 300,  // 5分鐘內完成

    // 獎勵
    bonus: {
      mpRefund: 0.2,      // 退還 20% MP
      expBonus: 50,       // 額外 50 EXP
      qualityBoost: 0.1,  // 品質提升 10%
      goldBonus: 30       // 額外 30 金幣
    },

    // 解鎖條件
    unlockRequirements: {
      level: 15,
      skills: {
        'code_review': 3,
        'refactor': 3,
        'test_gen': 2
      }
    }
  },

  {
    id: 'content_marketing',
    name: '內容行銷組合',
    icon: '📝',
    description: '完整的內容行銷流程',

    skills: [
      'content_write',
      'seo_optimize',
      'social_post'
    ],

    order: 'any',
    timeWindow: 600,  // 10分鐘

    bonus: {
      mpRefund: 0.15,
      expBonus: 40,
      goldBonus: 25
    },

    unlockRequirements: {
      level: 12,
      skills: {
        'content_write': 3,
        'seo_optimize': 2,
        'social_post': 2
      }
    }
  },

  {
    id: 'full_stack_dev',
    name: '全棧開發',
    icon: '💻',
    description: '從設計到部署的完整開發流程',

    skills: [
      'architecture_design',
      'code_gen',
      'test_gen',
      'deployment_guide'
    ],

    order: 'sequential',
    timeWindow: 900,  // 15分鐘

    bonus: {
      mpRefund: 0.25,
      expBonus: 100,
      qualityBoost: 0.15,
      goldBonus: 50,
      achievement: 'full_stack_master'
    },

    unlockRequirements: {
      level: 20,
      skills: {
        'architecture_design': 3,
        'code_gen': 5,
        'test_gen': 3
      }
    }
  }
]
```

#### Combo 追蹤器

```javascript
class ComboTracker {
  constructor() {
    this.activeSequences = new Map();
  }

  // 記錄技能使用
  recordSkillUse(skillId, timestamp) {
    // 檢查所有可能的 Combo
    for (const combo of skillCombos) {
      if (!this.isComboUnlocked(combo)) continue;

      let sequence = this.activeSequences.get(combo.id);

      if (!sequence) {
        // 開始新序列
        if (combo.skills[0] === skillId) {
          sequence = {
            comboId: combo.id,
            skills: [skillId],
            timestamps: [timestamp],
            startTime: timestamp
          };
          this.activeSequences.set(combo.id, sequence);
        }
      } else {
        // 繼續現有序列
        const nextSkillIndex = sequence.skills.length;
        const expectedSkill = combo.skills[nextSkillIndex];

        if (combo.order === 'sequential') {
          // 必須按順序
          if (skillId === expectedSkill) {
            sequence.skills.push(skillId);
            sequence.timestamps.push(timestamp);
          } else {
            // 順序錯誤，重置
            this.activeSequences.delete(combo.id);
          }
        } else {
          // 任意順序
          if (combo.skills.includes(skillId) && !sequence.skills.includes(skillId)) {
            sequence.skills.push(skillId);
            sequence.timestamps.push(timestamp);
          }
        }
      }
    }

    // 檢查是否完成
    this.checkCompletedCombos(timestamp);
  }

  // 檢查完成的 Combo
  checkCompletedCombos(currentTime) {
    const completed = [];

    for (const [comboId, sequence] of this.activeSequences) {
      const combo = skillCombos.find(c => c.id === comboId);

      // 檢查時間窗口
      const elapsed = (currentTime - sequence.startTime) / 1000;
      if (elapsed > combo.timeWindow) {
        this.activeSequences.delete(comboId);
        continue;
      }

      // 檢查是否完成
      if (sequence.skills.length === combo.skills.length) {
        completed.push({
          combo,
          sequence,
          timeUsed: elapsed
        });
        this.activeSequences.delete(comboId);
      }
    }

    return completed;
  }

  // 應用 Combo 獎勵
  applyComboBonus(combo, context) {
    const bonus = combo.bonus;

    // MP 退還
    if (bonus.mpRefund) {
      const mpUsed = this.calculateMPUsed(combo.skills);
      const refund = Math.floor(mpUsed * bonus.mpRefund);
      context.user.mp += refund;

      this.showNotification({
        type: 'combo',
        message: `🎯 ${combo.name} Combo!\nMP退還: +${refund}`
      });
    }

    // 經驗值獎勵
    if (bonus.expBonus) {
      context.user.exp += bonus.expBonus;
    }

    // 金幣獎勵
    if (bonus.goldBonus) {
      context.user.gold += bonus.goldBonus;
    }

    // 成就解鎖
    if (bonus.achievement) {
      this.unlockAchievement(bonus.achievement);
    }

    // 播放 Combo 動畫
    this.playComboAnimation(combo);
  }
}
```

#### Combo 提示 UI

```
Combo 進度提示:

使用中顯示:
┌────────────────────────────┐
│ 🎯 Combo 進度              │
├────────────────────────────┤
│ 完美重構 (2/3)              │
│ ✓ 代碼審查                  │
│ ✓ 代碼重構                  │
│ ○ 測試生成 ← 下一步         │
│                            │
│ ⏱️  剩餘時間: 3:24          │
│ 🎁 完成獎勵: MP退還20%      │
└────────────────────────────┘

完成時:
┌────────────────────────────┐
│     ✨ COMBO！✨           │
│                            │
│   🎯 完美重構 達成！        │
│                            │
│  獲得獎勵:                  │
│  • MP +12 (退還20%)        │
│  • EXP +50                 │
│  • 金幣 +30                │
│  • 品質提升 +10%           │
│                            │
│  [太棒了！]                │
└────────────────────────────┘

[音效: combo.wav]
[特效: 連擊閃光動畫]
```

---

### 五、技能樹系統

#### 技能樹結構

```
開發者職業技能樹:

                    [🏗️ 架構大師] Lv.30
                          │
            ┌─────────────┼─────────────┐
            │                           │
      [⚛️ 前端專精] Lv.15         [🔧 後端專精] Lv.15
            │                           │
    ┌───────┼───────┐           ┌───────┼───────┐
    │               │           │               │
[⚛️ React      [🎨 Vue       [🌐 API        [💾 資料庫
 專家]Lv.10     專家]Lv.10    設計]Lv.10     優化]Lv.10
    │               │           │               │
┌───┼───┐       ┌───┼───┐   ┌───┼───┐       ┌───┼───┐
│       │       │       │   │       │       │       │
[組件  [狀態   [響應式 [動畫 [REST  [Graph [SQL   [NoSQL
生成]  管理]   設計]  效果]  API]   QL]   優化]  優化]
Lv.5   Lv.5    Lv.5   Lv.5  Lv.5   Lv.5  Lv.5   Lv.5


寫作者職業技能樹:

                    [✍️ 文字大師] Lv.30
                          │
            ┌─────────────┼─────────────┐
            │                           │
      [📝 內容創作] Lv.15         [📊 行銷文案] Lv.15
            │                           │
    ┌───────┼───────┐           ┌───────┼───────┐
    │               │           │               │
[📖 長文     [🎨 創意      [📈 SEO       [🎯 廣告
 寫作]        寫作]         優化]         文案]
Lv.10       Lv.10         Lv.10         Lv.10


設計師職業技能樹:

                    [🎨 設計宗師] Lv.30
                          │
            ┌─────────────┼─────────────┐
            │                           │
      [💻 UI設計] Lv.15           [🎭 UX設計] Lv.15
            │                           │
    ┌───────┼───────┐           ┌───────┼───────┐
    │               │           │               │
[🎨 視覺     [📐 Layout   [👤 用戶      [📊 數據
 設計]        設計]         研究]         分析]
Lv.10       Lv.10         Lv.10         Lv.10
```

#### 技能樹資料結構

```javascript
const skillTrees = {
  developer: {
    id: 'developer',
    name: '開發者',
    icon: '⚔️',

    // 起始技能
    rootSkill: 'code_gen',

    // 技能節點
    nodes: [
      {
        id: 'code_gen',
        name: '代碼生成',
        level: 1,
        position: { x: 0, y: 0 },
        requirements: null,
        children: ['frontend_master', 'backend_master']
      },

      {
        id: 'frontend_master',
        name: '前端專精',
        level: 15,
        position: { x: -2, y: 1 },
        requirements: {
          level: 10,
          prerequisite: ['code_gen'],
          skillLevel: { 'code_gen': 5 }
        },
        children: ['react_expert', 'vue_expert'],
        effects: {
          // 解鎖後的被動效果
          frontendCodeQuality: 1.2,  // 前端代碼品質 +20%
          frontendMPCost: 0.9        // 前端技能 MP -10%
        }
      },

      {
        id: 'react_expert',
        name: 'React專家',
        level: 10,
        position: { x: -3, y: 2 },
        requirements: {
          level: 15,
          prerequisite: ['frontend_master'],
          skillLevel: { 'code_gen': 5, 'frontend_master': 3 }
        },
        children: ['react_component', 'react_hooks', 'react_state'],
        effects: {
          reactCodeQuality: 1.3,
          reactMPCost: 0.85
        },
        // 解鎖的新技能
        unlocksSkills: [
          'react_component_gen',
          'react_hook_gen',
          'react_state_manager'
        ]
      },

      {
        id: 'backend_master',
        name: '後端專精',
        level: 15,
        position: { x: 2, y: 1 },
        requirements: {
          level: 10,
          prerequisite: ['code_gen'],
          skillLevel: { 'code_gen': 5 }
        },
        children: ['api_design', 'database_optimization'],
        effects: {
          backendCodeQuality: 1.2,
          backendMPCost: 0.9
        }
      },

      {
        id: 'architecture_master',
        name: '架構大師',
        level: 30,
        position: { x: 0, y: 3 },
        requirements: {
          level: 25,
          prerequisite: ['frontend_master', 'backend_master'],
          skillLevel: {
            'frontend_master': 5,
            'backend_master': 5
          },
          achievement: 'full_stack_warrior'
        },
        effects: {
          allCodeQuality: 1.5,
          architectureMPCost: 0.8
        },
        unlocksSkills: [
          'system_architecture',
          'microservices_design',
          'scalability_planning'
        ]
      }
    ],

    // 連接線
    connections: [
      { from: 'code_gen', to: 'frontend_master' },
      { from: 'code_gen', to: 'backend_master' },
      { from: 'frontend_master', to: 'react_expert' },
      { from: 'frontend_master', to: 'vue_expert' },
      { from: 'backend_master', to: 'api_design' },
      { from: 'backend_master', to: 'database_optimization' },
      { from: 'frontend_master', to: 'architecture_master' },
      { from: 'backend_master', to: 'architecture_master' }
    ]
  },

  writer: {
    id: 'writer',
    name: '寫作者',
    icon: '📜',
    rootSkill: 'content_write',
    nodes: [ /* 類似結構 */ ]
  },

  designer: {
    id: 'designer',
    name: '設計師',
    icon: '🎨',
    rootSkill: 'ui_design',
    nodes: [ /* 類似結構 */ ]
  }
}
```

#### 技能樹 UI

```
技能樹介面:

┌────────────────────────────────────────────────┐
│  ⚔️ 開發者技能樹              Lv.15  EXP: 2340 │
├────────────────────────────────────────────────┤
│                                                │
│                  🏗️                             │
│              架構大師 🔒                        │
│                 Lv.30                          │
│                   │                            │
│       ┌───────────┴───────────┐               │
│       │                       │               │
│      ⚛️                       🔧              │
│   前端專精 ✓               後端專精 ✓          │
│    Lv.15                    Lv.15             │
│   (3/5)                     (4/5)             │
│       │                       │               │
│   ┌───┴───┐             ┌───┴───┐           │
│   │       │             │       │           │
│  ⚛️      🎨            🌐      💾           │
│ React   Vue          API    資料庫          │
│ 專家✓   專家          設計    優化           │
│ Lv.10   🔒           🔒      🔒             │
│                                                │
│  圖例:                                         │
│  ✓ 已解鎖  🔒 未解鎖  ⭐ 可解鎖                │
│                                                │
│  [查看全部] [重置技能樹] [規劃路徑]            │
└────────────────────────────────────────────────┘

點擊節點顯示詳情:
┌────────────────────────────┐
│  ⚛️ React專家               │
├────────────────────────────┤
│  等級: Lv.10               │
│  進度: (3/5) ███░░         │
│                            │
│  解鎖條件:                  │
│  ✓ 玩家等級 Lv.15          │
│  ✓ 前置: 前端專精           │
│  ✓ 代碼生成 Lv.5           │
│                            │
│  效果:                      │
│  • React代碼品質 +30%      │
│  • React技能MP消耗 -15%    │
│                            │
│  解鎖技能:                  │
│  • React組件生成            │
│  • React Hook生成          │
│  • 狀態管理設計             │
│                            │
│  [解鎖] [查看技能]          │
└────────────────────────────┘
```

---

### 六、被動技能

```javascript
const passiveSkills = [
  {
    id: 'auto_format',
    name: '自動格式化',
    icon: '📋',
    type: 'passive',
    description: '自動格式化生成的代碼',

    effect: {
      trigger: 'on_code_generate',
      action: 'apply_prettier',
      automatic: true
    },

    unlockRequirements: {
      level: 10,
      achievement: 'code_neat_freak'
    }
  },

  {
    id: 'smart_complete',
    name: '智能補全',
    icon: '🤖',
    type: 'passive',
    description: '輸入時自動提供代碼建議',

    effect: {
      trigger: 'on_typing',
      action: 'show_suggestions',
      automatic: true
    },

    unlockRequirements: {
      level: 15,
      skillLevel: { 'code_gen': 5 }
    }
  },

  {
    id: 'error_detection',
    name: '錯誤預警',
    icon: '⚠️',
    type: 'passive',
    description: '即時檢測代碼中的潛在問題',

    effect: {
      trigger: 'on_code_display',
      action: 'highlight_issues',
      automatic: true
    },

    unlockRequirements: {
      level: 20,
      skillLevel: { 'code_review': 5 }
    }
  },

  {
    id: 'mp_regeneration',
    name: 'MP自動回復',
    icon: '⚡',
    type: 'passive',
    description: 'MP回復速度提升50%',

    effect: {
      mpRegenBonus: 0.5
    },

    unlockRequirements: {
      level: 25,
      achievement: 'marathon_coder'
    }
  }
]
```

---

## Subagent 子代理系統

### 一、核心概念

```
Subagent = 專門化的AI助手

特點:
• 獨立的人格設定
• 專門的知識領域
• 特化的 System Prompt
• 可召喚和升級
• 擁有專屬技能
```

### 二、Subagent 類型定義

#### 代碼審查專家

```javascript
const codeReviewer = {
  // 基本資訊
  id: 'code_reviewer',
  name: 'CodeGuard',
  title: '代碼守衛者',
  avatar: '🛡️',
  type: 'specialist',
  category: 'development',

  // 人格特質
  personality: {
    type: 'strict',
    traits: ['嚴格', '細心', '專業', '直接'],
    tone: 'formal'
  },

  description: '嚴格的代碼審查專家，專注於代碼品質、安全性和最佳實踐',

  // 專長領域
  specialties: [
    '代碼審查',
    '安全漏洞檢測',
    '效能分析',
    '最佳實踐建議',
    'Code Smell 識別'
  ],

  // System Prompt
  systemPrompt: `你是 CodeGuard，一位嚴格但專業的代碼審查專家。

你的審查重點：
1. 代碼品質和可讀性
   - 命名是否清晰
   - 邏輯是否簡潔
   - 是否遵循 SOLID 原則

2. 安全性
   - SQL 注入風險
   - XSS 漏洞
   - 敏感資訊洩露
   - 權限控制問題

3. 效能
   - 時間複雜度
   - 空間複雜度
   - 潛在的效能瓶頸

4. 最佳實踐
   - 設計模式應用
   - 錯誤處理
   - 測試覆蓋

審查時請：
- 使用清晰的分級（Critical/High/Medium/Low）
- 提供具體的改進建議和範例代碼
- 說明問題的影響和風險
- 保持專業但不失禮貌

回應格式：
## 審查摘要
[總體評價]

## 發現的問題
### Critical Issues
[...]

### High Priority
[...]

## 改進建議
[具體建議和範例代碼]

## 優點
[值得肯定的部分]`,

  // AI 配置
  config: {
    model: 'claude',
    temperature: 0.3,  // 較低，更嚴格一致
    maxTokens: 2500
  },

  // 等級系統
  level: 5,
  exp: 450,
  nextLevelExp: 500,
  maxLevel: 10,

  // 屬性
  stats: {
    accuracy: 8,      // 準確度 (1-10)
    speed: 6,         // 回應速度
    depth: 9,         // 分析深度
    friendliness: 4   // 友善度（嚴格所以低）
  },

  // 專屬技能
  skills: [
    {
      id: 'security_scan',
      name: '安全掃描',
      icon: '🔒',
      mpCost: 25,
      description: '深度掃描安全漏洞'
    },
    {
      id: 'performance_analysis',
      name: '效能分析',
      icon: '⚡',
      mpCost: 30,
      description: '分析代碼效能瓶頸'
    },
    {
      id: 'code_smell_detection',
      name: 'Code Smell偵測',
      icon: '👃',
      mpCost: 20,
      description: '識別代碼異味'
    },
    {
      id: 'refactor_suggestion',
      name: '重構建議',
      icon: '🔧',
      mpCost: 35,
      description: '提供重構方案'
    }
  ],

  // 召喚成本
  summonCost: {
    mp: 20,
    cooldown: 300,  // 5分鐘冷卻
    duration: 600   // 持續10分鐘
  },

  // 解鎖條件
  unlockRequirements: {
    level: 5,
    achievement: null
  },

  // 升級效果
  levelEffects: {
    level5: {
      accuracy: 8,
      speed: 6,
      newSkill: 'security_scan'
    },
    level10: {
      accuracy: 10,
      speed: 8,
      mpCostReduction: 0.2,
      newSkill: 'advanced_security_audit'
    }
  },

  // 使用統計
  stats_usage: {
    totalSummons: 23,
    totalTime: 14400,  // 秒
    avgRating: 4.6,
    favorited: true
  }
}
```

#### Debug偵探

```javascript
const debugDetective = {
  id: 'debug_detective',
  name: 'BugHunter',
  title: 'Bug獵人',
  avatar: '🔍',
  type: 'specialist',
  category: 'development',

  personality: {
    type: 'analytical',
    traits: ['邏輯', '耐心', '細緻', '偵探般'],
    tone: 'friendly'
  },

  description: '敏銳的Debug偵探，擅長追蹤和解決各種疑難雜症',

  specialties: [
    'Bug診斷',
    '錯誤追蹤',
    '日誌分析',
    '修復建議',
    '根因分析'
  ],

  systemPrompt: `你是 BugHunter，一位經驗豐富的Debug專家，像偵探一樣追查問題根源。

診斷流程：
1. 收集證據
   - 錯誤訊息分析
   - Stack trace 解讀
   - 日誌檢查

2. 推理分析
   - 可能的原因
   - 相關因素
   - 排除法

3. 驗證假設
   - 重現步驟
   - 測試方案

4. 提供解決方案
   - 修復建議
   - 預防措施

回應風格：
- 像偵探辦案一樣有條理
- 使用推理邏輯
- 提供清晰的思路
- 友善且耐心

回應格式：
## 🔍 案情分析
[錯誤訊息和症狀]

## 🕵️ 推理過程
### 線索1: [...]
### 線索2: [...]

## 💡 可能原因
1. [最可能] ...
2. [次要可能] ...

## 🔧 解決方案
### 方案1 (推薦)
[詳細步驟]

### 方案2 (替代)
[...]

## ⚠️ 預防建議
[如何避免再次發生]`,

  config: {
    model: 'claude',
    temperature: 0.4,
    maxTokens: 2500
  },

  level: 3,
  exp: 180,

  stats: {
    accuracy: 9,
    speed: 7,
    depth: 8,
    friendliness: 7
  },

  skills: [
    {
      id: 'error_analysis',
      name: '錯誤分析',
      mpCost: 20
    },
    {
      id: 'stack_trace_decode',
      name: 'Stack Trace解碼',
      mpCost: 15
    },
    {
      id: 'root_cause_finder',
      name: '根因查找',
      mpCost: 30
    },
    {
      id: 'fix_generator',
      name: '修復方案生成',
      mpCost: 25
    }
  ],

  summonCost: {
    mp: 25,
    cooldown: 300,
    duration: 600
  },

  unlockRequirements: {
    level: 3,
    achievement: null
  }
}
```

#### 創意作家

```javascript
const creativeWriter = {
  id: 'creative_writer',
  name: 'WordSmith',
  title: '文字煉金術士',
  avatar: '✍️',
  type: 'specialist',
  category: 'writing',

  personality: {
    type: 'creative',
    traits: ['創意', '熱情', '靈感', '多變'],
    tone: 'enthusiastic'
  },

  description: '富有創意的文案大師，擅長各類內容創作',

  specialties: [
    '創意文案',
    '故事撰寫',
    '廣告標語',
    '社群內容',
    '品牌塑造'
  ],

  systemPrompt: `你是 WordSmith，一位充滿創意的文案專家和故事大師。

創作理念：
- 每個字都要有靈魂
- 創意源於生活
- 打動人心比華麗辭藻更重要
- 適應不同的受眾和場景

創作流程：
1. 理解需求
   - 目標受眾
   - 內容目的
   - 情感基調

2. 激發靈感
   - 多角度思考
   - 結合生活經驗
   - 運用比喻和聯想

3. 創作內容
   - 開頭吸睛
   - 中段扣人心弦
   - 結尾餘韻無窮

4. 打磨優化
   - 精簡冗字
   - 強化節奏
   - 提升感染力

回應風格：
- 充滿熱情和活力
- 提供多個版本供選擇
- 解釋創意思路
- 給予靈感啟發

回應格式：
## ✨ 創作靈感
[創意發想過程]

## 📝 作品呈現
### 版本A (正式風格)
[...]

### 版本B (活潑風格)
[...]

### 版本C (情感風格)
[...]

## 💡 創作說明
[解釋每個版本的特點和適用場景]

## 🎨 進一步優化建議
[如何讓內容更出色]`,

  config: {
    model: 'claude',
    temperature: 0.9,  // 較高，更有創意
    maxTokens: 2000
  },

  level: 4,
  exp: 320,

  stats: {
    accuracy: 7,
    speed: 8,
    depth: 6,
    friendliness: 9
  },

  skills: [
    {
      id: 'creative_brainstorm',
      name: '創意發想',
      mpCost: 15
    },
    {
      id: 'storytelling',
      name: '故事創作',
      mpCost: 25
    },
    {
      id: 'slogan_gen',
      name: '標語生成',
      mpCost: 20
    },
    {
      id: 'tone_adjustment',
      name: '語調調整',
      mpCost: 15
    }
  ],

  summonCost: {
    mp: 15,
    cooldown: 180,
    duration: 600
  },

  unlockRequirements: {
    level: 5,
    achievement: null
  }
}
```

#### 架構顧問

```javascript
const architectAdvisor = {
  id: 'architect_advisor',
  name: 'ArchMaster',
  title: '架構宗師',
  avatar: '🏗️',
  type: 'specialist',
  category: 'development',

  personality: {
    type: 'strategic',
    traits: ['戰略', '遠見', '權衡', '全局'],
    tone: 'professional'
  },

  description: '經驗豐富的架構師，擅長系統設計和技術決策',

  specialties: [
    '系統架構',
    '技術選型',
    '擴展性設計',
    '效能優化',
    '微服務設計'
  ],

  systemPrompt: `你是 ArchMaster，一位資深系統架構師，擁有豐富的大型系統設計經驗。

設計原則：
1. 可擴展性優先
2. 權衡利弊
3. 考慮成本
4. 面向未來

架構思考：
- 需求分析
  * 功能需求
  * 非功能需求（性能、安全、可用性）
  * 擴展性需求

- 方案設計
  * 技術選型
  * 架構模式
  * 資料流設計
  * 部署策略

- 權衡分析
  * 複雜度 vs 靈活性
  * 成本 vs 效能
  * 開發速度 vs 長期維護

- 風險評估
  * 技術風險
  * 團隊能力
  * 時間限制

回應風格：
- 專業且全面
- 提供多個方案比較
- 清晰的架構圖
- 具體的實施建議

回應格式：
## 🎯 需求分析
[理解的需求和目標]

## 🏗️ 架構方案

### 方案A: [名稱]
**架構圖**
\`\`\`
[ASCII 架構圖]
\`\`\`

**優點**
- ...

**缺點**
- ...

**適用場景**
- ...

### 方案B: [名稱]
[...]

## ⚖️ 方案對比
| 維度 | 方案A | 方案B |
|------|-------|-------|
| 複雜度 | ... | ... |
| 效能 | ... | ... |
| 成本 | ... | ... |
| 擴展性 | ... | ... |

## 💡 推薦方案
[詳細說明和實施建議]

## ⚠️ 注意事項
[風險和挑戰]`,

  config: {
    model: 'claude',
    temperature: 0.5,
    maxTokens: 3000
  },

  level: 6,
  exp: 520,

  stats: {
    accuracy: 9,
    speed: 5,
    depth: 10,
    friendliness: 6
  },

  skills: [
    {
      id: 'architecture_design',
      name: '架構設計',
      mpCost: 40
    },
    {
      id: 'tech_stack_advice',
      name: '技術選型',
      mpCost: 30
    },
    {
      id: 'scalability_analysis',
      name: '擴展性分析',
      mpCost: 35
    },
    {
      id: 'trade_off_evaluation',
      name: '權衡評估',
      mpCost: 25
    }
  ],

  summonCost: {
    mp: 40,
    cooldown: 600,  // 10分鐘冷卻
    duration: 900   // 持續15分鐘
  },

  unlockRequirements: {
    level: 20,
    achievement: 'architecture_apprentice'
  }
}
```

---

### 三、Subagent 互動流程

#### 召喚流程

```
完整召喚流程:

┌──────────────┐
│ 用戶選擇任務  │
│ "審查這段代碼" │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ 系統智能推薦      │
│                  │
│ 檢測到關鍵字:     │
│ "審查代碼"        │
│                  │
│ 推薦: CodeGuard  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 顯示推薦介面      │
│                  │
│ 💡 建議召喚:     │
│ 🛡️ CodeGuard    │
│ MP: 20          │
│ 冷卻: 5分鐘      │
│                  │
│ [召喚] [手動選擇]│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 檢查召喚條件      │
│ • MP >= 20? ✓    │
│ • 冷卻完成? ✓     │
│ • 等級需求? ✓     │
└──────┬───────────┘
       │
       ├─ ❌ 條件不符
       │      │
       │      ▼
       │  ┌──────────────┐
       │  │ 提示並建議    │
       │  │ 替代方案      │
       │  └──────────────┘
       │
       └─ ✅ 條件滿足
              │
              ▼
       ┌─────────────┐
       │ 召喚動畫      │
       │              │
       │   ✨  ⭐  ✨ │
       │  ✨  🛡️  ✨│
       │   ✨  ⭐  ✨ │
       │              │
       │ [魔法陣特效]  │
       └──────┬──────┘
              │
              ▼
       ┌─────────────────┐
       │ Agent 登場       │
       │                 │
       │ 🛡️ CodeGuard    │
       │ "讓我來審查你的  │
       │  代碼！"         │
       │                 │
       │ MP -20          │
       └──────┬──────────┘
              │
              ▼
       ┌─────────────┐
       │ 執行任務      │
       │ (專門prompt)  │
       └──────┬──────┘
              │
              ▼
       ┌─────────────────┐
       │ 顯示結果         │
       │                 │
       │ 🛡️ CodeGuard:   │
       │ [審查報告]       │
       │                 │
       │ [查看詳情]       │
       │ [評分⭐⭐⭐⭐⭐]  │
       └──────┬──────────┘
              │
              ▼
       ┌─────────────┐
       │ 任務完成      │
       │ Agent EXP +15│
       │ 用戶 EXP +50 │
       │ 金幣 +20      │
       └─────────────┘

[音效序列]
召喚: summon.wav
登場: agent_intro.wav
完成: task_complete.wav
```

---

### 四、Subagent UI 設計

#### 管理介面

```
Subagent 管理中心:

┌────────────────────────────────────────────────┐
│  👥 我的夥伴                        [+召喚新夥伴] │
├────────────────────────────────────────────────┤
│  篩選: [全部▼] [開發] [寫作] [設計]  排序: [等級▼]│
├────────────────────────────────────────────────┤
│                                                │
│  ✅ 已解鎖 (4)                                  │
│  ┌──────────────────────────────────────────┐ │
│  │  🛡️  CodeGuard  Lv.5      [收藏⭐]       │ │
│  │  代碼守衛者                               │ │
│  │  ────────────────────────────────────    │ │
│  │  專長: 代碼審查 | 安全檢測 | 效能分析     │ │
│  │                                          │ │
│  │  屬性:                                    │ │
│  │  準確度: ████████░░ 8/10                │ │
│  │  速度:   ██████░░░░ 6/10                │ │
│  │  深度:   █████████░ 9/10                │ │
│  │  友善度: ████░░░░░░ 4/10                │ │
│  │                                          │ │
│  │  經驗值: ████████░░ 450/500             │ │
│  │                                          │ │
│  │  狀態: ✅ 可召喚                          │ │
│  │  消耗: MP 20  |  冷卻: 5分鐘             │ │
│  │                                          │ │
│  │  統計:                                    │ │
│  │  • 召喚次數: 23                          │ │
│  │  • 平均評分: ⭐⭐⭐⭐⭐ 4.6/5.0          │ │
│  │  • 最後召喚: 2小時前                      │ │
│  │                                          │ │
│  │  [查看技能] [召喚] [升級]                 │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  🔍  BugHunter  Lv.3                     │ │
│  │  Bug獵人                                 │ │
│  │  ────────────────────────────────────    │ │
│  │  專長: Bug診斷 | 錯誤追蹤 | 日誌分析     │ │
│  │  ...                                     │ │
│  │  狀態: ⏱️ 冷卻中 (2:35)                   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  ✍️  WordSmith  Lv.4                     │ │
│  │  文字煉金術士                             │ │
│  │  ...                                     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  🔒 未解鎖 (2)                                  │
│  ┌──────────────────────────────────────────┐ │
│  │  🏗️  ArchMaster  Lv.?                    │ │
│  │  架構宗師                                 │ │
│  │  ────────────────────────────────────    │ │
│  │  專長: 系統架構 | 技術選型 | 擴展設計     │ │
│  │                                          │ │
│  │  解鎖條件:                                │ │
│  │  • 達到 Lv.20 (當前: Lv.15)              │ │
│  │  • 完成成就「架構學徒」                   │ │
│  │                                          │ │
│  │  [查看詳情]                              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

#### 召喚介面

```
召喚選擇:

┌────────────────────────────────────────┐
│  召喚夥伴                               │
├────────────────────────────────────────┤
│                                        │
│  💡 智能推薦                            │
│  ┌────────────────────────────────┐   │
│  │ 檢測到: "代碼審查"需求          │   │
│  │                                │   │
│  │ 推薦召喚:                       │   │
│  │ 🛡️ CodeGuard (最適合)          │   │
│  │ MP: 20  |  成功率: 95%         │   │
│  │                                │   │
│  │ [一鍵召喚]                     │   │
│  └────────────────────────────────┘   │
│                                        │
│  或選擇其他夥伴:                        │
│  ┌────────────────────────────────┐   │
│  │ 🔍 BugHunter                   │   │
│  │ MP: 25  |  適合度: 60%         │   │
│  │ ⏱️ 冷卻中 (2:35)                │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ ✍️ WordSmith                   │   │
│  │ MP: 15  |  適合度: 20%         │   │
│  │ [召喚]                         │   │
│  └────────────────────────────────┘   │
│                                        │
│  [取消]                                │
└────────────────────────────────────────┘
```

---

## 系統整合

### 一、Skill + Subagent 關係

```
整合概念圖:

                    用戶
                     │
         ┌───────────┴───────────┐
         │                       │
     直接使用                   召喚
         │                       │
         ▼                       ▼
    ┌─────────┐            ┌──────────┐
    │ Skills  │            │Subagents │
    └─────────┘            └──────────┘
         │                       │
    快速、便宜              專業、深入
    通用prompt             特化prompt
         │                 帶專屬技能
         └────────┬────────┘
                  │
             協同工作
```

### 二、使用場景對比

```javascript
// 場景1: 簡單代碼生成
const scenario1 = {
  task: "寫一個計數器組件",
  bestSolution: {
    type: 'skill',
    skill: 'code_gen',
    reason: '簡單任務，快速解決',
    cost: { mp: 10 },
    time: '30秒',
    quality: 'good'
  }
}

// 場景2: 代碼審查
const scenario2 = {
  task: "審查這個複雜的認證系統",
  bestSolution: {
    type: 'subagent',
    agent: 'CodeGuard',
    reason: '需要專業深入分析',
    cost: { mp: 20 },
    time: '2分鐘',
    quality: 'excellent',
    bonus: [
      '安全漏洞檢測',
      '效能分析',
      '最佳實踐建議',
      '具體改進方案'
    ]
  }
}

// 場景3: 全棧開發
const scenario3 = {
  task: "設計一個完整的購物車系統",
  bestSolution: {
    type: 'hybrid',
    steps: [
      {
        type: 'subagent',
        agent: 'ArchMaster',
        task: '架構設計',
        cost: { mp: 40 }
      },
      {
        type: 'skill_combo',
        combo: 'full_stack_dev',
        skills: ['code_gen', 'test_gen', 'deployment'],
        cost: { mp: 30 }
      }
    ],
    totalCost: { mp: 70 },
    time: '10分鐘',
    quality: 'legendary',
    comboBonus: {
      mpRefund: 0.25,
      expBonus: 100
    }
  }
}
```

---

### 三、協作模式

#### 多 Subagent 協作

```
協作場景: 開發一個新功能

步驟1: 架構設計
  🏗️ ArchMaster
     │
     ├─ 設計系統架構
     ├─ 技術選型
     └─ 資料流設計

步驟2: 實現開發
  ⚔️ 使用技能「代碼生成」
     │
     ├─ 前端組件
     ├─ 後端API
     └─ 資料庫Schema

步驟3: 代碼審查
  🛡️ CodeGuard
     │
     ├─ 安全檢查
     ├─ 代碼品質
     └─ 效能分析

步驟4: Bug測試
  🔍 BugHunter
     │
     ├─ 整合測試
     ├─ Bug診斷
     └─ 修復建議

組隊 Bonus:
• MP 總消耗 -20%
• 品質保證 +30%
• EXP 獲得 +50%
• 解鎖成就「完美團隊」
```

#### 協作 UI

```
組隊任務介面:

┌────────────────────────────────────────┐
│  🎯 組隊任務: 開發購物車功能            │
├────────────────────────────────────────┤
│                                        │
│  任務階段:                              │
│                                        │
│  ✓ 1. 架構設計  (ArchMaster)           │
│     完成時間: 3分鐘                     │
│     獲得: 架構文檔、技術方案            │
│                                        │
│  🔄 2. 代碼實現  (技能組合)             │
│     進行中...                          │
│     ⚔️ 前端組件 ████░░░░░░ 40%        │
│     ⚔️ 後端API  ██░░░░░░░░ 20%        │
│                                        │
│  ⏸️ 3. 代碼審查  (CodeGuard)            │
│     等待步驟2完成                       │
│                                        │
│  ⏸️ 4. Bug測試  (BugHunter)             │
│     等待步驟3完成                       │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  預計消耗: MP 70 (-20% 組隊優惠)        │
│  預計時間: 15-20分鐘                    │
│  品質保證: +30%                        │
│                                        │
│  [繼續] [暫停] [取消]                   │
└────────────────────────────────────────┘
```

---

## 技術實現

### 一、Skill 引擎

```javascript
class SkillEngine {
  constructor(skills) {
    this.skills = skills;
    this.comboTracker = new ComboTracker();
    this.levelingSystem = new SkillLevelingSystem();
  }

  /**
   * 使用技能
   */
  async useSkill(skillId, params, context) {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    // 檢查條件
    if (!this.checkConditions(skill, context)) {
      throw new Error('條件不符');
    }

    // 獲取當前等級效果
    const effects = skill.effects[`level${skill.level}`];

    // 消耗MP
    context.user.mp -= effects.mpCost;

    // 生成 Prompt
    const prompt = this.generatePrompt(skill, params);

    // 追蹤 Combo
    this.comboTracker.recordSkillUse(skillId, Date.now());
    const completedCombos = this.comboTracker.checkCompletedCombos(Date.now());

    // 調用AI
    const startTime = Date.now();
    const result = await this.callAI(prompt, skill.config || {});
    const elapsed = Date.now() - startTime;

    // 計算並獲得經驗值
    const expGained = this.levelingSystem.calculateSkillExp({
      tokens: result.tokens,
      elapsed,
      userRating: null,  // 稍後用戶評分
      isFirstTime: skill.stats.totalUses === 0
    });

    this.levelingSystem.gainExperience(skill, expGained);

    // 更新統計
    skill.stats.totalUses++;
    skill.stats.lastUsed = new Date().toISOString();
    skill.stats.avgTokens = Math.floor(
      (skill.stats.avgTokens * (skill.stats.totalUses - 1) + result.tokens) /
      skill.stats.totalUses
    );

    // 應用 Combo 獎勵
    let comboRewards = null;
    if (completedCombos.length > 0) {
      comboRewards = completedCombos.map(combo => {
        return this.comboTracker.applyComboBonus(combo.combo, context);
      });
    }

    return {
      result: result.text,
      tokens: result.tokens,
      skill: {
        id: skill.id,
        name: skill.name,
        level: skill.level,
        expGained
      },
      combo: comboRewards
    };
  }

  /**
   * 生成 Prompt
   */
  generatePrompt(skill, params) {
    // 獲取當前等級的模板
    const template = skill.templates[`level${skill.level}`] || skill.templates.level1;

    let prompt = template;

    // 替換參數
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    }

    return prompt;
  }

  /**
   * 檢查使用條件
   */
  checkConditions(skill, context) {
    // 檢查等級需求
    if (context.user.level < skill.unlockRequirements.level) {
      return false;
    }

    // 檢查MP
    const effects = skill.effects[`level${skill.level}`];
    if (context.user.mp < effects.mpCost) {
      return false;
    }

    // 檢查前置技能
    if (skill.unlockRequirements.prerequisite) {
      for (const prereq of skill.unlockRequirements.prerequisite) {
        const prereqSkill = context.user.skills.find(s => s.id === prereq);
        if (!prereqSkill || !prereqSkill.unlocked) {
          return false;
        }
      }
    }

    // 檢查成就
    if (skill.unlockRequirements.achievement) {
      const achievement = context.user.achievements.find(
        a => a.id === skill.unlockRequirements.achievement
      );
      if (!achievement || !achievement.unlocked) {
        return false;
      }
    }

    return true;
  }

  /**
   * 調用 AI
   */
  async callAI(prompt, config = {}) {
    // 實際調用 Claude/Gemini CLI
    // 返回格式: { text: string, tokens: number }
  }
}
```

---

### 二、Subagent 引擎

```javascript
class SubagentEngine {
  constructor(subagents) {
    this.subagents = subagents;
    this.activeAgents = new Map();
    this.summonHistory = [];
  }

  /**
   * 召喚 Subagent
   */
  async summon(agentId, context) {
    const agent = this.subagents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent 不存在');
    }

    // 檢查召喚條件
    if (!this.canSummon(agent, context)) {
      const reasons = this.getCannotSummonReasons(agent, context);
      throw new Error(`無法召喚: ${reasons.join(', ')}`);
    }

    // 消耗MP
    context.user.mp -= agent.summonCost.mp;

    // 播放召喚動畫
    await this.playSummonAnimation(agent);

    // 啟動 Agent
    const summonData = {
      agent,
      summonedAt: Date.now(),
      cooldownUntil: Date.now() + agent.summonCost.cooldown * 1000,
      expiresAt: Date.now() + agent.summonCost.duration * 1000
    };

    this.activeAgents.set(agentId, summonData);
    this.summonHistory.push({
      agentId,
      timestamp: Date.now(),
      userId: context.user.id
    });

    // 播放登場語音
    await this.playAgentIntro(agent);

    return agent;
  }

  /**
   * 使用 Agent 執行任務
   */
  async executeWithAgent(agentId, task, context) {
    const activeAgent = this.activeAgents.get(agentId);
    if (!activeAgent) {
      throw new Error('Agent 未召喚或已過期');
    }

    // 檢查是否過期
    if (Date.now() > activeAgent.expiresAt) {
      this.activeAgents.delete(agentId);
      throw new Error('Agent 已過期，請重新召喚');
    }

    const agent = activeAgent.agent;

    // 構建消息
    const messages = [
      {
        role: 'system',
        content: agent.systemPrompt
      },
      {
        role: 'user',
        content: task
      }
    ];

    // 調用 AI（使用 Agent 配置）
    const startTime = Date.now();
    const result = await this.callAI(messages, agent.config);
    const elapsed = Date.now() - startTime;

    // Agent 獲得經驗
    const expGained = Math.floor(result.tokens / 10) + 15;
    agent.exp += expGained;

    // 檢查升級
    if (agent.exp >= agent.nextLevelExp && agent.level < agent.maxLevel) {
      await this.levelUpAgent(agent);
    }

    // 更新統計
    agent.stats_usage.totalSummons++;
    agent.stats_usage.totalTime += Math.floor(elapsed / 1000);

    // 更新 Agent 最後活動時間
    activeAgent.lastActivity = Date.now();

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        level: agent.level,
        expGained
      },
      result: result.text,
      tokens: result.tokens,
      personality: agent.personality.type,
      elapsed
    };
  }

  /**
   * 檢查是否可以召喚
   */
  canSummon(agent, context) {
    // 檢查 MP
    if (context.user.mp < agent.summonCost.mp) {
      return false;
    }

    // 檢查冷卻
    const active = this.activeAgents.get(agent.id);
    if (active && Date.now() < active.cooldownUntil) {
      return false;
    }

    // 檢查等級需求
    if (agent.unlockRequirements.level > context.user.level) {
      return false;
    }

    // 檢查成就
    if (agent.unlockRequirements.achievement) {
      const achievement = context.user.achievements.find(
        a => a.id === agent.unlockRequirements.achievement
      );
      if (!achievement || !achievement.unlocked) {
        return false;
      }
    }

    return true;
  }

  /**
   * 獲取無法召喚的原因
   */
  getCannotSummonReasons(agent, context) {
    const reasons = [];

    if (context.user.mp < agent.summonCost.mp) {
      reasons.push(`MP不足 (需要${agent.summonCost.mp}, 當前${context.user.mp})`);
    }

    const active = this.activeAgents.get(agent.id);
    if (active && Date.now() < active.cooldownUntil) {
      const remaining = Math.ceil((active.cooldownUntil - Date.now()) / 1000);
      reasons.push(`冷卻中 (剩餘${remaining}秒)`);
    }

    if (agent.unlockRequirements.level > context.user.level) {
      reasons.push(`等級不足 (需要Lv.${agent.unlockRequirements.level})`);
    }

    if (agent.unlockRequirements.achievement) {
      const achievement = context.user.achievements.find(
        a => a.id === agent.unlockRequirements.achievement
      );
      if (!achievement || !achievement.unlocked) {
        reasons.push(`需要成就: ${agent.unlockRequirements.achievement}`);
      }
    }

    return reasons;
  }

  /**
   * Agent 升級
   */
  async levelUpAgent(agent) {
    agent.level++;
    agent.exp = 0;
    agent.nextLevelExp = Math.floor(agent.nextLevelExp * 1.5);

    // 應用等級效果
    const levelEffect = agent.levelEffects[`level${agent.level}`];
    if (levelEffect) {
      Object.assign(agent.stats, levelEffect);

      // 解鎖新技能
      if (levelEffect.newSkill) {
        agent.skills.push({
          id: levelEffect.newSkill,
          unlocked: true
        });
      }
    }

    // 播放升級動畫
    await this.playAgentLevelUpAnimation(agent);

    return {
      agent,
      newLevel: agent.level,
      effects: levelEffect
    };
  }

  /**
   * 智能推薦 Agent
   */
  recommendAgent(task, context) {
    const keywords = {
      review: ['審查', '檢查', 'review', 'check'],
      debug: ['bug', '錯誤', '問題', 'error', 'debug'],
      write: ['寫作', '文案', '內容', 'write', 'content'],
      architecture: ['架構', '設計', '系統', 'architecture', 'design']
    };

    const taskLower = task.toLowerCase();

    // 檢測關鍵字
    if (keywords.review.some(k => taskLower.includes(k))) {
      return this.subagents.find(a => a.id === 'code_reviewer');
    }

    if (keywords.debug.some(k => taskLower.includes(k))) {
      return this.subagents.find(a => a.id === 'debug_detective');
    }

    if (keywords.write.some(k => taskLower.includes(k))) {
      return this.subagents.find(a => a.id === 'creative_writer');
    }

    if (keywords.architecture.some(k => taskLower.includes(k))) {
      return this.subagents.find(a => a.id === 'architect_advisor');
    }

    return null;
  }

  /**
   * 調用 AI
   */
  async callAI(messages, config) {
    // 實際調用 Claude/Gemini CLI
    // 使用 system prompt 和配置
    // 返回格式: { text: string, tokens: number }
  }
}
```

---

## 開發路線圖

### MVP 階段（Week 1-8）

```
✅ 基礎 Skill 系統
   - 5-10個預設技能
   - 簡單參數輸入
   - MP消耗機制
   - 技能使用統計

❌ 暫不實作:
   - Skill升級
   - 技能樹
   - 技能鏈
   - Subagent系統
   - 被動技能
```

### 第二階段（Week 9-12）

```
✅ Skill 深化
   - 技能使用統計
   - 簡單升級（降低MP消耗）
   - 自定義技能
   - 技能分類和搜尋

✅ Subagent 原型
   - 2-3個預設 Subagent
   - 簡單召喚機制
   - 不同 system prompt
   - 基礎冷卻系統
```

### 第三階段（Week 13+）

```
✅ 完整 Skill 系統
   - 技能樹
   - 技能鏈/Combo
   - 被動技能
   - 技能等級效果

✅ 完整 Subagent 系統
   - 多個專業 Agent
   - Agent 升級系統
   - Agent 屬性面板
   - 多 Agent 協作
   - Agent 個性化對話

✅ 整合功能
   - Skill + Agent 協同
   - 組隊任務
   - 智能推薦
   - 成就系統整合
```

---

## 成就系統整合

```javascript
const skillSubagentAchievements = [
  // Skill 相關成就
  {
    id: 'skill_master',
    name: '🎯 技能大師',
    description: '解鎖所有基礎技能',
    reward: { exp: 200, gold: 100, title: '技能大師' }
  },
  {
    id: 'first_combo',
    name: '⚡ 首次連擊',
    description: '第一次觸發技能組合',
    reward: { exp: 100, gold: 50 }
  },
  {
    id: 'combo_expert',
    name: '🎯 連擊專家',
    description: '觸發10次技能組合',
    reward: { exp: 300, gold: 150, skill: 'combo_master' }
  },
  {
    id: 'skill_tree_complete',
    name: '🌳 技能樹大師',
    description: '完成一個完整的技能樹',
    reward: { exp: 500, gold: 250, title: '樹的守護者' }
  },

  // Subagent 相關成就
  {
    id: 'first_summon',
    name: '👥 初次召喚',
    description: '第一次召喚 Subagent',
    reward: { exp: 50, gold: 25 }
  },
  {
    id: 'agent_collector',
    name: '📚 夥伴收藏家',
    description: '解鎖所有 Subagent',
    reward: { exp: 400, gold: 200, title: '召喚師' }
  },
  {
    id: 'perfect_team',
    name: '🏆 完美團隊',
    description: '使用多 Agent 協作完成任務',
    reward: { exp: 300, gold: 150, skill: 'team_coordination' }
  },
  {
    id: 'agent_loyalty',
    name: '💖 忠誠夥伴',
    description: '單個 Agent 召喚100次',
    reward: { exp: 200, gold: 100, agent_bonus: true }
  }
]
```

---

**文檔版本**:
- v1.0 (2026-02-05): 初始版本，完整 Skill & Subagent 系統設計
