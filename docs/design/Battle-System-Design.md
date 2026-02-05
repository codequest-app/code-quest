# RPG-CLI 戰鬥系統設計

**基於**: RPG-CLI-Architecture-v2.md, Feature-Planning-v2.md
**日期**: 2026-02-05
**狀態**: 設計階段
**實作階段**: Phase 2.5 (Week 4-5)

---

## 核心概念

### 戰鬥系統映射

將 AI 對話過程轉化為 RPG 戰鬥體驗：

| AI 交互元素 | 戰鬥系統元素 | 說明 |
|-----------|------------|------|
| 用戶 Prompt | 遭遇敵人 | 每個任務/問題生成對應敵人 |
| 任務複雜度 | 敵人等級/HP | 複雜任務 = 強力敵人 |
| 使用 Skill | 攻擊技能 | Skills 造成傷害 |
| 召喚 Agent | 召喚隊友 | Agents 協同戰鬥 |
| AI 處理過程 | 戰鬥回合 | Streaming 輸出 = 回合進行 |
| Token 消耗 | MP 消耗 | 資源管理 |
| 任務完成 | 戰鬥勝利 | 獲得獎勵 |
| 任務失敗/錯誤 | 受到傷害 | HP 減少 |

### 設計哲學

**✅ 保持簡潔**:
- 戰鬥是視覺化包裝，不改變 AI 核心功能
- 自動化戰鬥流程，不增加用戶負擔
- 保留直接對話模式（可選關閉戰鬥模式）

**✅ 增強體驗**:
- 任務難度視覺化
- 進度反饋更直觀
- 增加成就感和樂趣

**✅ 鼓勵策略**:
- 技能相性系統
- 組合技在戰鬥中更有價值
- 資源管理更重要

---

## 系統架構

### 戰鬥流程圖

```
用戶輸入 Prompt
    ↓
[敵人生成器] 分析 Prompt
    ├─ 複雜度計算
    ├─ 任務分類
    └─ 生成敵人數據
    ↓
[戰鬥初始化]
    ├─ 顯示敵人資訊
    ├─ 分析弱點/抵抗
    └─ 進入戰鬥界面
    ↓
[玩家回合] 選擇行動
    ├─ 施放 Skill → 計算傷害 → 扣除敵人 HP
    ├─ 召喚 Agent → 協同攻擊
    └─ 使用道具 (未來擴展)
    ↓
[AI 處理] Claude Code 執行
    ├─ Streaming 輸出 → 視覺化為攻擊動畫
    └─ 更新戰鬥日誌
    ↓
[敵人回合] (可選)
    ├─ 複雜任務 → 敵人反擊 (消耗 MP/HP)
    ├─ 簡單任務 → 無反擊
    └─ 更新戰鬥日誌
    ↓
[檢查戰鬥結束]
    ├─ 敵人 HP = 0 → 勝利 → 獎勵
    ├─ 玩家 HP = 0 → 失敗 → 重試/跳過
    └─ 繼續戰鬥 → 下一回合
```

### 組件架構

```
bridge/
├── battle/
│   ├── EnemyGenerator.js       # 敵人生成器
│   ├── BattleManager.js         # 戰鬥管理器
│   ├── DamageCalculator.js      # 傷害計算
│   └── AffinitySystem.js        # 相性系統

ui/src/components/Battle/
├── BattleScreen.tsx             # 戰鬥主畫面
├── EnemyDisplay.tsx             # 敵人展示
├── BattleLog.tsx                # 戰鬥日誌
├── ActionMenu.tsx               # 行動選單
├── DamageNumber.tsx             # 傷害數字動畫
└── VictoryScreen.tsx            # 勝利畫面

rpg-config/
├── battle-system.json           # 戰鬥系統配置
├── enemy-types.json             # 敵人類型定義
└── affinities.json              # 相性表
```

---

## 敵人生成系統

### 複雜度分析

**檔案**: `bridge/battle/EnemyGenerator.js`

```javascript
class EnemyGenerator {
  constructor() {
    this.enemyTypes = require('../../rpg-config/enemy-types.json');
  }

  /**
   * 根據 Prompt 生成敵人
   */
  generateEnemy(prompt) {
    const complexity = this.analyzeComplexity(prompt);
    const category = this.categorizeTask(prompt);
    const enemyType = this.enemyTypes[category.type];

    return {
      id: this.generateId(),
      name: this.generateName(category, complexity),
      type: category.type,
      icon: category.icon,
      element: category.element,

      level: complexity.level,
      hp: complexity.level * 100 * enemyType.hpMultiplier,
      maxHp: complexity.level * 100 * enemyType.hpMultiplier,

      weaknesses: enemyType.weaknesses,
      resistances: enemyType.resistances,

      mechanics: this.selectMechanics(complexity, enemyType),

      rewards: {
        exp: complexity.level * 30,
        gold: complexity.level * 15,
        multiplier: enemyType.rewards.expMultiplier
      }
    };
  }

  /**
   * 分析 Prompt 複雜度
   */
  analyzeComplexity(prompt) {
    let score = 0;

    // 長度因素
    const length = prompt.length;
    if (length > 200) score += 3;
    else if (length > 100) score += 2;
    else score += 1;

    // 關鍵字複雜度
    const complexKeywords = [
      'architecture', '架構', 'refactor', '重構',
      'optimize', '優化', 'design pattern', '設計模式'
    ];
    const mediumKeywords = [
      'implement', '實作', 'create', '創建',
      'review', '審查', 'test', '測試'
    ];

    complexKeywords.forEach(kw => {
      if (prompt.toLowerCase().includes(kw)) score += 2;
    });

    mediumKeywords.forEach(kw => {
      if (prompt.toLowerCase().includes(kw)) score += 1;
    });

    // 多步驟任務
    if (/and|then|after|before|以及|然後/.test(prompt)) {
      score += 2;
    }

    // 技術棧複雜度
    const techStackCount = (prompt.match(/React|Vue|Node|Python|Java|TypeScript/gi) || []).length;
    score += techStackCount;

    // 計算等級 (1-15)
    const level = Math.min(15, Math.max(1, Math.floor(score / 2) + 1));

    return {
      score,
      level,
      difficulty: this.getDifficulty(level)
    };
  }

  /**
   * 任務分類
   */
  categorizeTask(prompt) {
    const categories = [
      {
        type: 'code-task',
        keywords: ['code', '程式', 'function', '函數', 'class', 'implement'],
        icon: '💻',
        element: 'logic'
      },
      {
        type: 'bug-hunt',
        keywords: ['bug', 'debug', '錯誤', 'fix', '修復', 'error'],
        icon: '🐛',
        element: 'chaos'
      },
      {
        type: 'architecture',
        keywords: ['architecture', '架構', 'design', '設計', 'pattern', 'refactor'],
        icon: '🏰',
        element: 'wisdom'
      },
      {
        type: 'documentation',
        keywords: ['document', '文檔', 'readme', 'comment', '註解', 'explain'],
        icon: '📜',
        element: 'knowledge'
      },
      {
        type: 'testing',
        keywords: ['test', '測試', 'unit test', 'integration', 'coverage'],
        icon: '🧪',
        element: 'precision'
      },
      {
        type: 'optimization',
        keywords: ['optimize', '優化', 'performance', '性能', 'speed', 'efficiency'],
        icon: '⚡',
        element: 'power'
      }
    ];

    const promptLower = prompt.toLowerCase();

    for (const cat of categories) {
      for (const kw of cat.keywords) {
        if (promptLower.includes(kw)) {
          return cat;
        }
      }
    }

    // 預設為通用任務
    return {
      type: 'general',
      icon: '❓',
      element: 'neutral'
    };
  }

  /**
   * 生成敵人名稱
   */
  generateName(category, complexity) {
    const prefixes = {
      1: ['微弱的', '小型', '初級'],
      5: ['中等的', '狡猾的', '進階'],
      10: ['強大的', '精英', '高級'],
      15: ['傳說的', '終極', '史詩']
    };

    const baseNames = {
      'code-task': ['代碼挑戰', 'Logic Beast', '程式魔物'],
      'bug-hunt': ['Bug 怪物', 'Error Demon', '錯誤惡魔'],
      'architecture': ['架構巨龍', 'Design Titan', '設計泰坦'],
      'documentation': ['知識守護者', 'Doc Golem', '文檔魔像'],
      'testing': ['測試審判者', 'QA Sentinel', '品質哨兵'],
      'optimization': ['性能惡魔', 'Speed Wraith', '效能幽靈'],
      'general': ['未知挑戰', 'Mystery Beast', '神秘生物']
    };

    const level = complexity.level;
    let prefixTier = 1;
    if (level >= 10) prefixTier = 15;
    else if (level >= 7) prefixTier = 10;
    else if (level >= 4) prefixTier = 5;

    const prefix = prefixes[prefixTier][Math.floor(Math.random() * 3)];
    const baseName = baseNames[category.type][Math.floor(Math.random() * 3)];

    return `${prefix}${baseName}`;
  }

  /**
   * 選擇特殊機制
   */
  selectMechanics(complexity, enemyType) {
    const mechanics = [];

    // Boss 等級敵人
    if (complexity.level >= 10) {
      mechanics.push('multi_phase'); // 多階段戰鬥
      mechanics.push('special_attack'); // 特殊攻擊
    }

    // 中等難度
    if (complexity.level >= 5) {
      mechanics.push('counter_attack'); // 反擊
    }

    // 類型特殊機制
    if (enemyType.specialMechanic) {
      mechanics.push(enemyType.specialMechanic);
    }

    return mechanics;
  }

  getDifficulty(level) {
    if (level <= 3) return 'simple';
    if (level <= 7) return 'medium';
    if (level <= 12) return 'hard';
    return 'boss';
  }

  generateId() {
    return `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = EnemyGenerator;
```

---

## 戰鬥管理器

**檔案**: `bridge/battle/BattleManager.js`

```javascript
const DamageCalculator = require('./DamageCalculator');
const AffinitySystem = require('./AffinitySystem');

class BattleManager {
  constructor(wsServer) {
    this.wsServer = wsServer;
    this.currentBattle = null;
    this.damageCalc = new DamageCalculator();
    this.affinity = new AffinitySystem();
  }

  /**
   * 開始戰鬥
   */
  startBattle(enemy, player) {
    this.currentBattle = {
      id: `battle_${Date.now()}`,
      enemy,
      player,
      turn: 0,
      log: [],
      startTime: Date.now(),
      status: 'ongoing'
    };

    this.broadcast({
      type: 'battle_start',
      battle: this.currentBattle
    });

    this.addLog(`遭遇敵人: ${enemy.name} Lv.${enemy.level}!`, 'encounter');

    // 顯示弱點提示
    if (enemy.weaknesses.length > 0) {
      const weaknessNames = enemy.weaknesses.map(w => this.getSkillDisplayName(w)).join(', ');
      this.addLog(`弱點: ${weaknessNames}`, 'info');
    }
  }

  /**
   * 玩家使用技能
   */
  playerUseSkill(skillName, skillMetadata) {
    if (!this.currentBattle) return;

    const battle = this.currentBattle;
    battle.turn++;

    // 計算傷害
    const damage = this.damageCalc.calculate({
      skill: skillName,
      skillMetadata,
      player: battle.player,
      enemy: battle.enemy,
      affinity: this.affinity
    });

    // 扣除敵人 HP
    battle.enemy.hp = Math.max(0, battle.enemy.hp - damage.total);

    // 記錄日誌
    this.addLog(
      `使用 ${skillMetadata.displayName}! 造成 ${damage.total} 傷害!`,
      'player_attack'
    );

    if (damage.isWeak) {
      this.addLog('弱點攻擊! 傷害加成!', 'critical');
    }

    // 廣播傷害
    this.broadcast({
      type: 'damage_dealt',
      damage: damage.total,
      isWeak: damage.isWeak,
      enemyHp: battle.enemy.hp
    });

    // 檢查戰鬥結束
    if (battle.enemy.hp <= 0) {
      this.endBattle('victory');
    } else {
      // 敵人回合
      this.enemyTurn();
    }
  }

  /**
   * 召喚 Agent
   */
  summonAgent(agentName, agentMetadata) {
    if (!this.currentBattle) return;

    const battle = this.currentBattle;

    // Agent 加入戰鬥
    this.addLog(`召喚 ${agentMetadata.title}!`, 'summon');

    // Agent 協同攻擊
    const damage = this.damageCalc.calculateAgentDamage({
      agent: agentName,
      agentMetadata,
      player: battle.player,
      enemy: battle.enemy
    });

    battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);

    this.addLog(`${agentMetadata.title} 造成 ${damage} 傷害!`, 'agent_attack');

    this.broadcast({
      type: 'agent_damage',
      damage,
      enemyHp: battle.enemy.hp
    });

    if (battle.enemy.hp <= 0) {
      this.endBattle('victory');
    }
  }

  /**
   * 敵人回合
   */
  enemyTurn() {
    const battle = this.currentBattle;
    const enemy = battle.enemy;

    // 檢查是否有反擊機制
    if (!enemy.mechanics.includes('counter_attack')) {
      return; // 簡單敵人不反擊
    }

    // 計算反擊傷害
    const counterDamage = Math.floor(enemy.level * 5);

    // 敵人反擊
    this.addLog(`${enemy.name} 反擊! 消耗 ${counterDamage} MP!`, 'enemy_attack');

    // 消耗玩家 MP (而非 HP，避免真正失敗)
    battle.player.mp = Math.max(0, battle.player.mp - counterDamage);

    this.broadcast({
      type: 'enemy_counter',
      damage: counterDamage,
      playerMp: battle.player.mp
    });
  }

  /**
   * 戰鬥結束
   */
  endBattle(result) {
    const battle = this.currentBattle;
    battle.status = result;

    if (result === 'victory') {
      const rewards = battle.enemy.rewards;
      const finalExp = Math.floor(rewards.exp * rewards.multiplier);
      const finalGold = Math.floor(rewards.gold * rewards.multiplier);

      this.addLog(`✨ 勝利!`, 'victory');
      this.addLog(`獲得 EXP +${finalExp}, Gold +${finalGold}`, 'reward');

      this.broadcast({
        type: 'battle_end',
        result: 'victory',
        rewards: {
          exp: finalExp,
          gold: finalGold
        },
        battle
      });

      // 返回獎勵給 GameEngine
      return {
        exp: finalExp,
        gold: finalGold
      };
    } else if (result === 'defeat') {
      this.addLog('💀 失敗...', 'defeat');

      this.broadcast({
        type: 'battle_end',
        result: 'defeat',
        battle
      });
    }

    // 清除當前戰鬥
    setTimeout(() => {
      this.currentBattle = null;
    }, 3000);
  }

  /**
   * 添加戰鬥日誌
   */
  addLog(message, type = 'normal') {
    if (!this.currentBattle) return;

    const logEntry = {
      turn: this.currentBattle.turn,
      timestamp: Date.now(),
      message,
      type
    };

    this.currentBattle.log.push(logEntry);

    this.broadcast({
      type: 'battle_log',
      entry: logEntry
    });
  }

  broadcast(data) {
    this.wsServer.broadcast(data);
  }

  getSkillDisplayName(skillName) {
    // 從 metadata 獲取顯示名稱
    const metadata = require('../../rpg-config/skill-metadata.json');
    return metadata[skillName]?.displayName || skillName;
  }
}

module.exports = BattleManager;
```

---

## 傷害計算系統

**檔案**: `bridge/battle/DamageCalculator.js`

```javascript
class DamageCalculator {
  /**
   * 計算技能傷害
   */
  calculate({ skill, skillMetadata, player, enemy, affinity }) {
    // 基礎傷害
    let baseDamage = 100;

    // 技能 MP 消耗影響傷害
    baseDamage += skillMetadata.cost.mp * 3;

    // 玩家等級加成
    baseDamage += player.level * 10;

    // 相性加成
    const affinityMultiplier = affinity.getMultiplier(skill, enemy.type);

    // 弱點判定
    const isWeak = enemy.weaknesses.includes(skill);
    const weakMultiplier = isWeak ? 1.5 : 1.0;

    // 抗性判定
    const isResist = enemy.resistances.includes(skill);
    const resistMultiplier = isResist ? 0.5 : 1.0;

    // 計算最終傷害
    const totalDamage = Math.floor(
      baseDamage * affinityMultiplier * weakMultiplier * resistMultiplier
    );

    return {
      base: baseDamage,
      total: totalDamage,
      affinityMultiplier,
      isWeak,
      isResist
    };
  }

  /**
   * 計算 Agent 傷害
   */
  calculateAgentDamage({ agent, agentMetadata, player, enemy }) {
    // Agent 基礎傷害
    let baseDamage = 150;

    // Agent 屬性加成
    baseDamage += agentMetadata.stats.attack;
    baseDamage += agentMetadata.stats.wisdom;

    // 玩家等級加成
    baseDamage += player.level * 5;

    return Math.floor(baseDamage);
  }

  /**
   * 計算組合技傷害
   */
  calculateComboDamage({ combo, player, enemy, skillsUsed }) {
    // 組合技基礎傷害
    let baseDamage = 300;

    // 技能數量加成
    baseDamage += skillsUsed.length * 50;

    // 玩家等級加成
    baseDamage += player.level * 20;

    // 組合技獎勵倍率
    baseDamage *= combo.rewards.expMultiplier;

    return Math.floor(baseDamage);
  }
}

module.exports = DamageCalculator;
```

---

## 相性系統

**檔案**: `bridge/battle/AffinitySystem.js`

```javascript
class AffinitySystem {
  constructor() {
    // 相性表: skill → enemy type → 倍率
    this.affinityTable = {
      // 代碼生成類技能
      'code-generator': {
        'code-task': 1.2,      // 擅長
        'documentation': 1.1,
        'bug-hunt': 0.8,       // 不擅長
        'testing': 0.9
      },

      // 審查類技能
      'code-reviewer': {
        'bug-hunt': 1.5,       // 非常擅長
        'code-task': 1.2,
        'optimization': 1.1,
        'architecture': 0.9
      },

      // Debug 類技能
      'debug-helper': {
        'bug-hunt': 1.8,       // 極度擅長
        'optimization': 1.2,
        'code-task': 1.0
      },

      // 測試類技能
      'test-generator': {
        'bug-hunt': 1.3,
        'code-task': 1.1,
        'testing': 1.5
      },

      // 文檔類技能
      'doc-writer': {
        'documentation': 1.5,
        'architecture': 1.2,
        'code-task': 0.9
      }
    };
  }

  /**
   * 獲取相性倍率
   */
  getMultiplier(skill, enemyType) {
    if (!this.affinityTable[skill]) {
      return 1.0; // 無特殊相性
    }

    return this.affinityTable[skill][enemyType] || 1.0;
  }

  /**
   * 獲取推薦技能
   */
  getRecommendedSkills(enemyType) {
    const recommendations = [];

    for (const [skill, affinities] of Object.entries(this.affinityTable)) {
      const multiplier = affinities[enemyType];
      if (multiplier && multiplier >= 1.2) {
        recommendations.push({
          skill,
          multiplier,
          effectiveness: this.getEffectivenessLabel(multiplier)
        });
      }
    }

    // 排序：倍率高的優先
    recommendations.sort((a, b) => b.multiplier - a.multiplier);

    return recommendations;
  }

  getEffectivenessLabel(multiplier) {
    if (multiplier >= 1.5) return 'extremely_effective';
    if (multiplier >= 1.3) return 'very_effective';
    if (multiplier >= 1.1) return 'effective';
    return 'normal';
  }
}

module.exports = AffinitySystem;
```

---

## 配置文件

### 敵人類型定義

**檔案**: `rpg-config/enemy-types.json`

```json
{
  "code-task": {
    "name": "代碼挑戰",
    "nameEn": "Code Task",
    "description": "需要編寫程式碼的任務",
    "icon": "💻",
    "element": "logic",
    "hpMultiplier": 1.0,
    "baseSpeed": 40,
    "speedVariance": 10,
    "weaknesses": ["code-generator", "code-reviewer"],
    "resistances": ["doc-writer"],
    "specialMechanic": null,
    "aiType": "simple",
    "rewards": {
      "expMultiplier": 1.2,
      "goldMultiplier": 1.0
    }
  },

  "bug-hunt": {
    "name": "Bug 怪物",
    "nameEn": "Bug Beast",
    "description": "需要除錯和修復的問題",
    "icon": "🐛",
    "element": "chaos",
    "hpMultiplier": 1.5,
    "baseSpeed": 35,
    "speedVariance": 5,
    "weaknesses": ["debug-helper", "test-generator", "code-reviewer"],
    "resistances": ["code-generator"],
    "specialMechanic": "counter_attack",
    "aiType": "elite",
    "rewards": {
      "expMultiplier": 1.5,
      "goldMultiplier": 1.3
    }
  },

  "architecture": {
    "name": "架構挑戰",
    "nameEn": "Architecture Challenge",
    "description": "系統設計和架構任務",
    "icon": "🏰",
    "element": "wisdom",
    "hpMultiplier": 2.0,
    "baseSpeed": 30,
    "speedVariance": 5,
    "weaknesses": ["code-reviewer"],
    "resistances": ["test-generator"],
    "specialMechanic": "multi_phase",
    "aiType": "boss",
    "rewards": {
      "expMultiplier": 2.0,
      "goldMultiplier": 1.8
    }
  },

  "documentation": {
    "name": "文檔任務",
    "nameEn": "Documentation Task",
    "description": "撰寫和維護文檔",
    "icon": "📜",
    "element": "knowledge",
    "hpMultiplier": 0.8,
    "baseSpeed": 45,
    "speedVariance": 10,
    "weaknesses": ["doc-writer"],
    "resistances": ["debug-helper"],
    "specialMechanic": null,
    "aiType": "simple",
    "rewards": {
      "expMultiplier": 1.0,
      "goldMultiplier": 0.8
    }
  },

  "testing": {
    "name": "測試挑戰",
    "nameEn": "Testing Challenge",
    "description": "編寫和執行測試",
    "icon": "🧪",
    "element": "precision",
    "hpMultiplier": 1.2,
    "baseSpeed": 50,
    "speedVariance": 10,
    "weaknesses": ["test-generator"],
    "resistances": ["doc-writer"],
    "specialMechanic": null,
    "aiType": "simple",
    "rewards": {
      "expMultiplier": 1.3,
      "goldMultiplier": 1.1
    }
  },

  "optimization": {
    "name": "優化挑戰",
    "nameEn": "Optimization Challenge",
    "description": "性能優化和改進",
    "icon": "⚡",
    "element": "power",
    "hpMultiplier": 1.8,
    "baseSpeed": 55,
    "speedVariance": 15,
    "weaknesses": ["code-reviewer", "debug-helper"],
    "resistances": ["doc-writer"],
    "specialMechanic": "speed_boost",
    "aiType": "elite",
    "rewards": {
      "expMultiplier": 1.8,
      "goldMultiplier": 1.5
    }
  },

  "general": {
    "name": "通用任務",
    "nameEn": "General Task",
    "description": "一般問題或諮詢",
    "icon": "❓",
    "element": "neutral",
    "hpMultiplier": 1.0,
    "baseSpeed": 40,
    "speedVariance": 10,
    "weaknesses": [],
    "resistances": [],
    "specialMechanic": null,
    "aiType": "simple",
    "rewards": {
      "expMultiplier": 1.0,
      "goldMultiplier": 1.0
    }
  }
}
```

### 戰鬥系統配置

**檔案**: `rpg-config/battle-system.json`

```json
{
  "version": "1.0",

  "settings": {
    "enableBattleMode": true,
    "autoStartBattle": true,
    "showDamageNumbers": true,
    "enableEnemyCounter": true,
    "battleAnimationSpeed": "normal"
  },

  "difficulties": {
    "simple": {
      "levelRange": [1, 3],
      "hpMultiplier": 1.0,
      "expMultiplier": 1.0,
      "enemyCounterChance": 0.0
    },
    "medium": {
      "levelRange": [4, 7],
      "hpMultiplier": 1.5,
      "expMultiplier": 1.3,
      "enemyCounterChance": 0.3
    },
    "hard": {
      "levelRange": [8, 12],
      "hpMultiplier": 2.0,
      "expMultiplier": 1.6,
      "enemyCounterChance": 0.5
    },
    "boss": {
      "levelRange": [13, 15],
      "hpMultiplier": 3.0,
      "expMultiplier": 2.0,
      "enemyCounterChance": 0.8
    }
  },

  "mechanics": {
    "counter_attack": {
      "name": "反擊",
      "description": "敵人會在被攻擊後反擊",
      "mpCost": "5 * enemy.level"
    },
    "multi_phase": {
      "name": "多階段",
      "description": "敵人 HP 降到 50% 時進入第二階段",
      "phases": [
        { "hpThreshold": 1.0, "damageMultiplier": 1.0 },
        { "hpThreshold": 0.5, "damageMultiplier": 1.5 }
      ]
    },
    "speed_boost": {
      "name": "加速",
      "description": "敵人有機會連續攻擊",
      "chance": 0.3
    },
    "special_attack": {
      "name": "特殊攻擊",
      "description": "Boss 級敵人的強力攻擊",
      "cooldown": 3,
      "damage": "20 * enemy.level"
    }
  },

  "enemyAI": {
    "simple": {
      "description": "簡單敵人只攻擊玩家",
      "targetPriority": ["player"],
      "ignoreCompanions": true,
      "companionAttackChance": 0.0
    },
    "elite": {
      "description": "精英敵人會優先攻擊低防禦目標",
      "targetPriority": ["lowest_defense", "player"],
      "ignoreCompanions": false,
      "companionAttackChance": 0.3
    },
    "boss": {
      "description": "Boss 會智能選擇目標，並可能使用範圍攻擊",
      "targetPriority": ["lowest_hp", "highest_threat", "player"],
      "ignoreCompanions": false,
      "companionAttackChance": 0.5,
      "aoeAttacks": true,
      "aoeChance": 0.2
    }
  },

  "damageFormula": {
    "base": 100,
    "mpCostMultiplier": 3,
    "levelMultiplier": 10,
    "weaknessMultiplier": 1.5,
    "resistanceMultiplier": 0.5
  },

  "ui": {
    "battleTransition": "fade",
    "damageNumberDuration": 1000,
    "criticalShakeIntensity": 10,
    "victoryAnimationDelay": 1500
  }
}
```

---

## UI 組件設計

### 戰鬥畫面

**檔案**: `ui/src/components/Battle/BattleScreen.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../../hooks/useGameState';
import EnemyDisplay from './EnemyDisplay';
import BattleLog from './BattleLog';
import ActionMenu from './ActionMenu';
import VictoryScreen from './VictoryScreen';
import DamageNumber from './DamageNumber';

interface BattleScreenProps {
  battle: Battle;
  onSkillCast: (skillName: string) => void;
  onSummonAgent: (agentName: string) => void;
}

const BattleScreen: React.FC<BattleScreenProps> = ({
  battle,
  onSkillCast,
  onSummonAgent
}) => {
  const { player } = useGameState();
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [showVictory, setShowVictory] = useState(false);

  useEffect(() => {
    if (battle.status === 'victory') {
      setTimeout(() => setShowVictory(true), 1500);
    }
  }, [battle.status]);

  const handleDamageDealt = (damage: number, isWeak: boolean) => {
    const popup: DamagePopup = {
      id: Date.now(),
      value: damage,
      isWeak,
      position: { x: 300, y: 200 }
    };

    setDamagePopups(prev => [...prev, popup]);

    // 1 秒後移除
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== popup.id));
    }, 1000);
  };

  return (
    <div className="battle-screen pixel-art">
      {/* 背景 */}
      <div className="battle-background" />

      {/* 敵人區域 */}
      <motion.div
        className="enemy-area"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <EnemyDisplay enemy={battle.enemy} />
      </motion.div>

      {/* 傷害數字 */}
      <AnimatePresence>
        {damagePopups.map(popup => (
          <DamageNumber
            key={popup.id}
            value={popup.value}
            isWeak={popup.isWeak}
            position={popup.position}
          />
        ))}
      </AnimatePresence>

      {/* 戰鬥日誌 */}
      <div className="battle-log-container">
        <BattleLog entries={battle.log} />
      </div>

      {/* 行動選單 */}
      <motion.div
        className="action-menu-container"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ActionMenu
          player={player}
          enemy={battle.enemy}
          onSkillCast={onSkillCast}
          onSummonAgent={onSummonAgent}
        />
      </motion.div>

      {/* 勝利畫面 */}
      <AnimatePresence>
        {showVictory && (
          <VictoryScreen
            rewards={battle.enemy.rewards}
            onClose={() => setShowVictory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleScreen;
```

### 敵人顯示

**檔案**: `ui/src/components/Battle/EnemyDisplay.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import ProgressBar from '../Common/ProgressBar';

interface EnemyDisplayProps {
  enemy: Enemy;
}

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy }) => {
  const hpPercentage = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div className="enemy-display">
      {/* 敵人圖示 */}
      <motion.div
        className="enemy-sprite"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="enemy-icon">{enemy.icon}</div>
      </motion.div>

      {/* 敵人資訊 */}
      <div className="enemy-info">
        <div className="enemy-name-level">
          <span className="enemy-name">{enemy.name}</span>
          <span className="enemy-level">Lv.{enemy.level}</span>
        </div>

        {/* HP 條 */}
        <div className="enemy-hp">
          <ProgressBar
            value={enemy.hp}
            max={enemy.maxHp}
            color="red"
            showNumbers
          />
        </div>

        {/* 元素類型 */}
        <div className="enemy-element">
          <span className="element-badge" data-element={enemy.element}>
            {enemy.element}
          </span>
        </div>

        {/* 弱點提示 */}
        {enemy.weaknesses.length > 0 && (
          <div className="enemy-weaknesses">
            <span className="label">弱點:</span>
            {enemy.weaknesses.map(w => (
              <span key={w} className="weakness-tag">{w}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnemyDisplay;
```

### 戰鬥日誌

**檔案**: `ui/src/components/Battle/BattleLog.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

const BattleLog: React.FC<BattleLogProps> = ({ entries }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 自動滾動到最新
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  const getLogClass = (type: string) => {
    const classes: Record<string, string> = {
      encounter: 'log-encounter',
      player_attack: 'log-player',
      agent_attack: 'log-agent',
      enemy_attack: 'log-enemy',
      critical: 'log-critical',
      victory: 'log-victory',
      defeat: 'log-defeat',
      info: 'log-info',
      reward: 'log-reward'
    };
    return classes[type] || 'log-normal';
  };

  return (
    <div className="battle-log" ref={logRef}>
      <AnimatePresence initial={false}>
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.turn}-${index}`}
            className={`log-entry ${getLogClass(entry.type)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="log-turn">[{entry.turn}]</span>
            <span className="log-message">{entry.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BattleLog;
```

### 傷害數字動畫

**檔案**: `ui/src/components/Battle/DamageNumber.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface DamageNumberProps {
  value: number;
  isWeak: boolean;
  position: { x: number; y: number };
}

const DamageNumber: React.FC<DamageNumberProps> = ({
  value,
  isWeak,
  position
}) => {
  return (
    <motion.div
      className={`damage-number ${isWeak ? 'weak-hit' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y
      }}
      initial={{ opacity: 1, y: 0, scale: isWeak ? 1.2 : 1 }}
      animate={{
        opacity: 0,
        y: -80,
        scale: isWeak ? 1.5 : 1
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {value}
      {isWeak && <span className="weak-indicator">!</span>}
    </motion.div>
  );
};

export default DamageNumber;
```

---

## 整合到現有系統

### 修改 Bridge Layer

**檔案**: `bridge/index.js` (修改)

```javascript
const EnemyGenerator = require('./battle/EnemyGenerator');
const BattleManager = require('./battle/BattleManager');

class RPGBridge {
  constructor() {
    // ... 現有代碼
    this.enemyGen = new EnemyGenerator();
    this.battleMgr = new BattleManager(this.wsServer);
  }

  async handleUserPrompt(prompt) {
    // 生成敵人
    const enemy = this.enemyGen.generateEnemy(prompt);

    // 開始戰鬥
    this.battleMgr.startBattle(enemy, this.gameState.player);

    // 繼續正常處理 Claude Code
    // ...
  }

  handleSkillUse(skillName) {
    const metadata = this.loadSkillMetadata(skillName);

    // ... 現有遊戲邏輯檢查

    // 戰鬥中使用技能
    if (this.battleMgr.currentBattle) {
      this.battleMgr.playerUseSkill(skillName, metadata);
    }

    // ... 其餘代碼
  }

  handleAgentSummon(agentName) {
    const metadata = this.loadAgentMetadata(agentName);

    // ... 現有檢查

    // 戰鬥中召喚
    if (this.battleMgr.currentBattle) {
      this.battleMgr.summonAgent(agentName, metadata);
    }

    // ... 其餘代碼
  }
}
```

### UI 狀態管理

**檔案**: `ui/src/stores/gameStore.ts` (擴展)

```typescript
interface GameState {
  // ... 現有狀態

  // 新增戰鬥狀態
  currentBattle: Battle | null;
  battleHistory: Battle[];
  battleMode: 'auto' | 'manual' | 'off';
}

const useGameStore = create<GameState>((set) => ({
  // ... 現有 actions

  // 戰鬥相關 actions
  setBattle: (battle: Battle | null) => set({ currentBattle: battle }),

  toggleBattleMode: () => set((state) => ({
    battleMode: state.battleMode === 'off' ? 'auto' : 'off'
  })),

  addBattleHistory: (battle: Battle) => set((state) => ({
    battleHistory: [...state.battleHistory, battle]
  }))
}));
```

---

## 實作優先級

### Phase 2.5: 戰鬥系統 (Week 4-5)

**Week 4**:
- [ ] 實作 EnemyGenerator
  - [ ] 複雜度分析算法
  - [ ] 任務分類
  - [ ] 敵人名稱生成
- [ ] 實作 BattleManager
  - [ ] 戰鬥流程
  - [ ] 回合管理
  - [ ] 勝利/失敗判定
- [ ] 配置文件
  - [ ] enemy-types.json
  - [ ] battle-system.json

**Week 5**:
- [ ] 實作 DamageCalculator
  - [ ] 傷害公式
  - [ ] 相性計算
- [ ] 實作 AffinitySystem
  - [ ] 相性表
  - [ ] 推薦系統
- [ ] UI 組件
  - [ ] BattleScreen
  - [ ] EnemyDisplay
  - [ ] BattleLog
  - [ ] DamageNumber
  - [ ] VictoryScreen
- [ ] 整合測試

---

## 驗收標準

### 基礎功能
```bash
# 1. 敵人生成
輸入簡單 prompt → 生成 Lv.1-3 敵人 ✅
輸入複雜 prompt → 生成 Lv.8+ 敵人 ✅

# 2. 戰鬥流程
開始對話 → 顯示敵人資訊 ✅
使用 Skill → 敵人扣血 ✅
敵人 HP = 0 → 顯示勝利 ✅

# 3. 傷害計算
使用弱點技能 → 傷害 ×1.5 ✅
使用抵抗技能 → 傷害 ×0.5 ✅

# 4. UI 動畫
傷害數字飄出 ✅
HP 條平滑減少 ✅
勝利動畫播放 ✅
```

### 進階功能
```bash
# 5. 敵人機制
Bug 怪物 → 反擊消耗 MP ✅
Boss 級敵人 → 多階段戰鬥 ✅

# 6. 組合技整合
觸發組合技 → 造成更高傷害 ✅
組合技在戰鬥中有特效 ✅

# 7. 統計記錄
查看戰鬥歷史 ✅
勝率統計 ✅
```

---

## 未來擴展

### 可能的增強功能

1. **裝備系統**:
   - Prompt 模板作為"武器"
   - MCP 工具作為"裝備"
   - 提供屬性加成

2. **地城系統**:
   - 連續任務視為地城
   - 每層一個敵人
   - 最終層為 Boss

3. **多人協作戰鬥**:
   - 多個玩家協同
   - 共享戰鬥進度
   - 組隊獎勵

4. **每日 Boss**:
   - 每日特殊挑戰
   - 高獎勵
   - 排行榜

5. **戰鬥回放**:
   - 記錄戰鬥過程
   - 分享精彩時刻
   - 學習優秀策略

---

## 總結

戰鬥系統通過以下方式增強 RPG-CLI 體驗：

**✅ 視覺化進度**:
- 任務難度 → 敵人等級
- 處理過程 → 戰鬥回合
- 完成度 → HP 減少

**✅ 增強互動性**:
- 技能選擇更有策略性
- 弱點系統鼓勵嘗試
- 戰鬥日誌提供反饋

**✅ 提升成就感**:
- 擊敗強敵的滿足感
- 勝利獎勵更豐富
- 戰績記錄可追蹤

**✅ 保持靈活性**:
- 可選開關戰鬥模式
- 不影響核心 AI 功能
- 漸進式功能增強

---

**版本**: v1.0
**最後更新**: 2026-02-05
**下一步**: Phase 2.5 實作 (Week 4-5)
