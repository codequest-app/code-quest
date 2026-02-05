# 召喚獸系統設計

**基於**: Agent-Battle-Companion-Design.md, Battle-System-Design.md
**日期**: 2026-02-05
**狀態**: 設計階段

---

## 核心概念

### 召喚獸 vs 戰鬥夥伴

| 特性 | 戰鬥夥伴 (Companion) | 召喚獸 (Summon Beast) |
|-----|---------------------|---------------------|
| 來源 | Subagent | 技能/道具/組合技/MCP工具 |
| 持續時間 | 戰鬥全程 | 限時（1-3回合）或單次行動 |
| 成長性 | 有經驗值、升級 | 無成長，固定能力 |
| 槽位 | 夥伴槽（最多2個） | 召喚獸槽（最多1個，獨立） |
| MP消耗 | 召喚時消耗 | 每次召喚都消耗 |
| 行動方式 | 參與回合順序 | 立即行動或特定觸發 |
| 用途 | 持續戰鬥支援 | 爆發傷害、緊急支援 |

### 設計理念

```
夥伴 = 長期戰友
├─ 陪伴整場戰鬥
├─ 穩定輸出/支援
└─ 能力隨時間成長

召喚獸 = 特殊支援
├─ 關鍵時刻使用
├─ 強力但短暫
└─ 戰術性選擇
```

---

## 召喚獸分類

### 1. 技能召喚獸

通過特定 Skill 召喚，執行單一強力行動：

**範例 Skill**: `summon-code-dragon`

```yaml
---
name: summon-code-dragon
description: 召喚代碼之龍，對所有代碼相關問題造成巨大傷害。適合面對複雜代碼任務。
allowed-tools: Read, Bash, Write
---

# 代碼之龍召喚術

當用戶面對複雜的代碼任務時：

1. **召喚代碼之龍**
   - 分析問題複雜度
   - 制定解決策略
   - 執行強力代碼生成

2. **龍息攻擊**
   - 生成高質量代碼
   - 處理邊緣情況
   - 優化性能

3. **離去**
   - 留下完整的代碼
   - 提供使用說明

召喚之龍將以壓倒性的力量解決問題。
```

**對應 Metadata**: `rpg-config/summon-metadata.json`

```json
{
  "summon-code-dragon": {
    "name": "Code Dragon",
    "displayName": "代碼之龍",
    "icon": "🐉",
    "element": "arcane",
    "rarity": "legendary",
    "type": "offensive",

    "summonCost": {
      "mp": 80,
      "cooldown": 600
    },

    "appearance": {
      "avatar": "🐉",
      "color": "#ff6b00",
      "animation": "dragon-emerge",
      "sound": "roar.mp3"
    },

    "behavior": {
      "actionType": "immediate",
      "duration": 1,
      "canAct": true
    },

    "skills": [
      {
        "id": "dragon_breath",
        "name": "龍息",
        "icon": "🔥",
        "type": "special_attack",
        "description": "毀滅性的代碼龍息",
        "effect": {
          "damage": "300 + player.level * 20",
          "aoe": true,
          "effectiveness": {
            "code-task": 2.5,
            "architecture": 2.0,
            "bug-hunt": 1.5
          },
          "specialEffect": {
            "type": "code_optimization",
            "description": "自動優化生成的代碼"
          }
        }
      }
    ],

    "exitEffect": {
      "bonus": {
        "exp": 100,
        "gold": 50
      },
      "message": "代碼之龍留下了完美的解決方案！"
    },

    "quotes": {
      "summon": [
        "🐉 吾乃代碼之龍！汝之問題將化為灰燼！",
        "古老的代碼力量回應你的召喚！"
      ],
      "attack": [
        "龍息！燃燒一切 Bug！",
        "接受代碼的審判吧！"
      ],
      "exit": [
        "吾之使命已完成，再會。",
        "代碼之龍返回虛空..."
      ]
    }
  }
}
```

### 2. 組合技召喚獸

觸發組合技時自動召喚：

```json
{
  "combo-summon-phoenix": {
    "name": "Phoenix",
    "displayName": "不死鳥",
    "icon": "🔥🦅",
    "element": "rebirth",
    "type": "support",

    "triggerCondition": {
      "comboId": "perfect-code-chain",
      "chance": 0.5
    },

    "behavior": {
      "actionType": "automatic",
      "duration": 2,
      "canAct": true
    },

    "skills": [
      {
        "id": "phoenix_rebirth",
        "name": "浴火重生",
        "type": "healing",
        "effect": {
          "heal": {
            "target": "player",
            "value": "player.maxHp * 0.5"
          },
          "revive": {
            "target": "all_companions",
            "hp_restore": 0.3
          },
          "buff": {
            "target": "all_allies",
            "stat": "attack",
            "value": 30,
            "duration": 3
          }
        }
      }
    ],

    "quotes": {
      "summon": ["🔥 不死鳥降臨！重生之火將庇護你！"],
      "action": ["感受重生的力量！"],
      "exit": ["不死鳥化為星火散去..."]
    }
  }
}
```

### 3. MCP 工具召喚獸

將 MCP Server 的工具轉化為召喚獸：

```json
{
  "mcp-database-golem": {
    "name": "Database Golem",
    "displayName": "資料庫魔像",
    "icon": "🗄️",
    "element": "data",
    "rarity": "rare",
    "type": "utility",

    "mcpBinding": {
      "server": "database-mcp",
      "tool": "query_database"
    },

    "summonCost": {
      "mp": 40,
      "cooldown": 300
    },

    "behavior": {
      "actionType": "interactive",
      "duration": 3,
      "canAct": true
    },

    "skills": [
      {
        "id": "data_shield",
        "name": "資料護盾",
        "type": "defense",
        "effect": {
          "shield": {
            "target": "player",
            "value": 100,
            "duration": 3
          },
          "special": {
            "type": "mcp_query",
            "description": "執行資料庫查詢並轉化為防禦"
          }
        }
      },
      {
        "id": "data_blast",
        "name": "資料爆破",
        "type": "attack",
        "effect": {
          "damage": "150 + query_complexity * 20",
          "special": {
            "type": "mcp_result",
            "description": "查詢結果越複雜，傷害越高"
          }
        }
      }
    ]
  }
}
```

### 4. 道具召喚獸

使用特殊道具召喚（未來擴展）：

```json
{
  "item-summon-helper": {
    "name": "Helper Fairy",
    "displayName": "幫助精靈",
    "icon": "🧚",
    "element": "support",
    "rarity": "common",
    "type": "utility",

    "itemRequired": "summon_scroll_helper",

    "behavior": {
      "actionType": "passive",
      "duration": 5,
      "canAct": false
    },

    "passiveEffect": {
      "mpRegen": 5,
      "expBonus": 1.2,
      "goldBonus": 1.2
    },

    "quotes": {
      "summon": ["✨ 幫助精靈來囉！"],
      "passive": ["精靈在身邊飛舞..."],
      "exit": ["精靈回到了魔法世界~"]
    }
  }
}
```

---

## 召喚獸行為類型

### 1. Immediate Action（立即行動）

召喚後立即執行技能並離去：

```javascript
class ImmediateSummon {
  async execute(summon, battle) {
    // 召喚動畫
    await this.playAnimation(summon.appearance.animation);

    // 顯示台詞
    this.showQuote(summon.quotes.summon);

    // 執行技能
    const skill = summon.skills[0];
    await this.executeSkill(skill, battle);

    // 顯示離去台詞
    this.showQuote(summon.quotes.exit);

    // 獎勵
    this.applyExitBonus(summon.exitEffect);

    // 離去動畫
    await this.playAnimation('fade-out');
  }
}
```

**適合**:
- 強力單次攻擊
- 緊急治療
- 一次性 Buff

### 2. Automatic Action（自動行動）

在場數回合，每回合自動行動：

```javascript
class AutomaticSummon {
  constructor(summon, duration) {
    this.summon = summon;
    this.remainingTurns = duration;
  }

  async onTurnStart(battle) {
    if (this.remainingTurns <= 0) {
      this.dismiss();
      return;
    }

    // 自動選擇最佳技能
    const skill = this.selectBestSkill(battle);
    await this.executeSkill(skill, battle);

    this.remainingTurns--;
  }

  selectBestSkill(battle) {
    // 簡單 AI：選擇傷害最高的技能
    return this.summon.skills.reduce((best, current) => {
      const currentDmg = this.estimateDamage(current, battle);
      const bestDmg = this.estimateDamage(best, battle);
      return currentDmg > bestDmg ? current : best;
    });
  }
}
```

**適合**:
- 持續輸出
- 定時治療
- 持續 Buff/Debuff

### 3. Passive Effect（被動效果）

在場期間提供被動加成，不主動攻擊：

```javascript
class PassiveSummon {
  constructor(summon, duration) {
    this.summon = summon;
    this.remainingTurns = duration;
  }

  onSummon(battle) {
    // 應用被動效果
    this.applyPassive(battle);
  }

  applyPassive(battle) {
    const effect = this.summon.passiveEffect;

    // MP 恢復
    if (effect.mpRegen) {
      battle.player.mpRegenRate += effect.mpRegen;
    }

    // 經驗值加成
    if (effect.expBonus) {
      battle.player.expMultiplier *= effect.expBonus;
    }

    // 金幣加成
    if (effect.goldBonus) {
      battle.player.goldMultiplier *= effect.goldBonus;
    }
  }

  onDismiss(battle) {
    // 移除被動效果
    this.removePassive(battle);
  }
}
```

**適合**:
- 資源恢復
- 獎勵加成
- 持續保護

### 4. Interactive Action（互動行動）

在場期間，玩家可手動指揮：

```javascript
class InteractiveSummon {
  constructor(summon, duration) {
    this.summon = summon;
    this.remainingTurns = duration;
    this.availableSkills = [...summon.skills];
  }

  // 玩家可以選擇召喚獸的技能
  async onPlayerCommand(skillId, battle) {
    const skill = this.availableSkills.find(s => s.id === skillId);
    if (!skill) return;

    await this.executeSkill(skill, battle);

    this.remainingTurns--;
    if (this.remainingTurns <= 0) {
      this.dismiss();
    }
  }
}
```

**適合**:
- 戰術性技能
- 需要時機判斷
- 多功能召喚獸

---

## 召喚獸管理器

**檔案**: `bridge/battle/SummonManager.js`

```javascript
class SummonManager {
  constructor(battleManager) {
    this.battleMgr = battleManager;
    this.activeSummons = new Map(); // summonId -> SummonInstance
    this.summonMetadata = require('../../rpg-config/summon-metadata.json');
  }

  /**
   * 召喚
   */
  async summon(summonId, player, source = 'skill') {
    const metadata = this.summonMetadata[summonId];
    if (!metadata) {
      return { error: 'Unknown summon' };
    }

    // 檢查 MP
    if (player.mp < metadata.summonCost.mp) {
      return { error: 'MP 不足' };
    }

    // 扣除 MP
    player.mp -= metadata.summonCost.mp;

    // 創建召喚獸實例
    const summonInstance = this.createSummonInstance(metadata);
    this.activeSummons.set(summonInstance.id, summonInstance);

    // 廣播召喚事件
    this.battleMgr.broadcast({
      type: 'summon_appear',
      summon: summonInstance,
      quote: this.getRandomQuote(metadata.quotes.summon)
    });

    this.battleMgr.addLog(
      `召喚 ${metadata.name}!`,
      'summon'
    );

    // 根據行為類型執行
    await this.executeSummonBehavior(summonInstance);

    return { success: true, summon: summonInstance };
  }

  /**
   * 創建召喚獸實例
   */
  createSummonInstance(metadata) {
    return {
      id: `summon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadataId: metadata.id || metadata.name,
      name: metadata.name,
      icon: metadata.icon,
      element: metadata.element,
      type: metadata.type,

      behavior: metadata.behavior,
      skills: metadata.skills,
      passiveEffect: metadata.passiveEffect,

      remainingTurns: metadata.behavior.duration,
      hasActed: false,

      appearance: metadata.appearance,
      quotes: metadata.quotes,
      exitEffect: metadata.exitEffect
    };
  }

  /**
   * 執行召喚獸行為
   */
  async executeSummonBehavior(summon) {
    const battle = this.battleMgr.currentBattle;

    switch (summon.behavior.actionType) {
      case 'immediate':
        await this.executeImmediate(summon, battle);
        break;

      case 'automatic':
        // 自動行動在回合中處理
        this.battleMgr.addLog(
          `${summon.name} 將持續 ${summon.remainingTurns} 回合`,
          'info'
        );
        break;

      case 'passive':
        this.applyPassiveEffect(summon, battle);
        break;

      case 'interactive':
        this.battleMgr.addLog(
          `${summon.name} 等待指令（持續 ${summon.remainingTurns} 回合）`,
          'info'
        );
        break;
    }
  }

  /**
   * 立即行動型召喚獸
   */
  async executeImmediate(summon, battle) {
    // 執行技能
    const skill = summon.skills[0];
    await this.executeSummonSkill(summon, skill, battle);

    // 顯示離去
    this.battleMgr.addLog(
      this.getRandomQuote(summon.quotes.exit),
      'summon_exit'
    );

    // 應用離去獎勵
    if (summon.exitEffect) {
      this.applyExitBonus(summon.exitEffect, battle);
    }

    // 廣播離去動畫
    this.battleMgr.broadcast({
      type: 'summon_exit',
      summonId: summon.id,
      animation: 'fade-out'
    });

    // 移除召喚獸
    setTimeout(() => {
      this.activeSummons.delete(summon.id);
    }, 2000);
  }

  /**
   * 執行召喚獸技能
   */
  async executeSummonSkill(summon, skill, battle) {
    this.battleMgr.addLog(
      `${summon.name} 使用 ${skill.name}!`,
      'summon_skill'
    );

    const effect = skill.effect;

    // 傷害效果
    if (effect.damage) {
      const damage = this.calculateSummonDamage(summon, skill, battle);
      battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);

      this.battleMgr.addLog(
        `造成 ${damage} 傷害!`,
        'damage'
      );

      this.battleMgr.broadcast({
        type: 'summon_damage',
        summonId: summon.id,
        damage,
        enemyHp: battle.enemy.hp,
        animation: skill.animation || summon.appearance.animation
      });
    }

    // 治療效果
    if (effect.heal) {
      const healAmount = this.calculateHeal(effect.heal, battle);
      battle.player.hp = Math.min(
        battle.player.maxHp,
        battle.player.hp + healAmount
      );

      this.battleMgr.addLog(
        `玩家恢復 ${healAmount} HP!`,
        'heal'
      );
    }

    // 護盾效果
    if (effect.shield) {
      const shield = effect.shield;
      battle.player.shield = (battle.player.shield || 0) + shield.value;

      this.battleMgr.addLog(
        `玩家獲得 ${shield.value} 護盾!`,
        'buff'
      );
    }

    // Buff 效果
    if (effect.buff) {
      this.battleMgr.applyBuff(effect.buff);
    }

    // 復活效果
    if (effect.revive) {
      this.reviveCompanions(effect.revive, battle);
    }

    // MCP 特殊效果
    if (effect.special && effect.special.type === 'mcp_query') {
      await this.executeMCPEffect(summon, skill, battle);
    }
  }

  /**
   * 計算召喚獸傷害
   */
  calculateSummonDamage(summon, skill, battle) {
    const player = battle.player;
    const enemy = battle.enemy;

    // 解析傷害公式（簡化版）
    let baseDamage = 300;
    if (skill.effect.damage.includes('player.level')) {
      baseDamage += player.level * 20;
    }

    // 相性加成
    const effectiveness = skill.effect.effectiveness?.[enemy.type] || 1.0;

    // AOE 傷害（如果有多個敵人的話）
    const aoeMult = skill.effect.aoe ? 1.2 : 1.0;

    return Math.floor(baseDamage * effectiveness * aoeMult);
  }

  /**
   * 自動行動召喚獸的回合處理
   */
  async onTurnStart(battle) {
    for (const summon of this.activeSummons.values()) {
      if (summon.behavior.actionType !== 'automatic') continue;
      if (summon.remainingTurns <= 0) {
        this.dismissSummon(summon.id);
        continue;
      }

      // 自動選擇技能
      const skill = this.selectBestSkill(summon, battle);
      await this.executeSummonSkill(summon, skill, battle);

      summon.remainingTurns--;
    }
  }

  /**
   * 選擇最佳技能（簡單 AI）
   */
  selectBestSkill(summon, battle) {
    // 簡化：選擇第一個技能
    return summon.skills[0];
  }

  /**
   * 解除召喚
   */
  dismissSummon(summonId) {
    const summon = this.activeSummons.get(summonId);
    if (!summon) return;

    this.battleMgr.addLog(
      `${summon.name} 離去了...`,
      'summon_exit'
    );

    // 移除被動效果
    if (summon.behavior.actionType === 'passive') {
      this.removePassiveEffect(summon);
    }

    // 離去獎勵
    if (summon.exitEffect) {
      this.applyExitBonus(summon.exitEffect);
    }

    this.battleMgr.broadcast({
      type: 'summon_exit',
      summonId
    });

    this.activeSummons.delete(summonId);
  }

  /**
   * 應用被動效果
   */
  applyPassiveEffect(summon, battle) {
    const effect = summon.passiveEffect;
    if (!effect) return;

    if (effect.mpRegen) {
      battle.player.mpRegenRate = (battle.player.mpRegenRate || 1) + effect.mpRegen;
    }

    if (effect.expBonus) {
      battle.player.expMultiplier = (battle.player.expMultiplier || 1) * effect.expBonus;
    }

    if (effect.goldBonus) {
      battle.player.goldMultiplier = (battle.player.goldMultiplier || 1) * effect.goldBonus;
    }
  }

  /**
   * 移除被動效果
   */
  removePassiveEffect(summon) {
    const battle = this.battleMgr.currentBattle;
    const effect = summon.passiveEffect;
    if (!effect) return;

    if (effect.mpRegen) {
      battle.player.mpRegenRate -= effect.mpRegen;
    }

    if (effect.expBonus) {
      battle.player.expMultiplier /= effect.expBonus;
    }

    if (effect.goldBonus) {
      battle.player.goldMultiplier /= effect.goldBonus;
    }
  }

  /**
   * 復活夥伴
   */
  reviveCompanions(reviveEffect, battle) {
    const companions = Array.from(this.battleMgr.companions.values());

    companions.forEach(companion => {
      if (companion.status === 'ko') {
        companion.status = 'active';
        companion.hp = Math.floor(companion.maxHp * reviveEffect.hp_restore);

        this.battleMgr.addLog(
          `${companion.characterName} 復活了！`,
          'revive'
        );
      }
    });
  }

  /**
   * 應用離去獎勵
   */
  applyExitBonus(exitEffect, battle) {
    if (exitEffect.bonus) {
      if (exitEffect.bonus.exp) {
        battle.player.exp += exitEffect.bonus.exp;
      }
      if (exitEffect.bonus.gold) {
        battle.player.gold += exitEffect.bonus.gold;
      }
    }

    if (exitEffect.message) {
      this.battleMgr.addLog(exitEffect.message, 'info');
    }
  }

  getRandomQuote(quotes) {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
}

module.exports = SummonManager;
```

---

## UI 組件設計

### 召喚獸顯示

**檔案**: `ui/src/components/Battle/SummonDisplay.tsx`

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SummonDisplayProps {
  summons: SummonInstance[];
}

const SummonDisplay: React.FC<SummonDisplayProps> = ({ summons }) => {
  return (
    <div className="summon-container">
      <AnimatePresence>
        {summons.map(summon => (
          <SummonCard key={summon.id} summon={summon} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const SummonCard: React.FC<{ summon: SummonInstance }> = ({ summon }) => {
  return (
    <motion.div
      className={`summon-card rarity-${summon.rarity}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', duration: 0.8 }}
    >
      {/* 召喚獸圖示 */}
      <div
        className="summon-avatar"
        style={{ color: summon.appearance.color }}
      >
        {summon.icon}
      </div>

      {/* 召喚獸名稱 */}
      <div className="summon-name">{summon.name}</div>

      {/* 持續回合數 */}
      {summon.remainingTurns > 0 && (
        <div className="summon-duration">
          剩餘 {summon.remainingTurns} 回合
        </div>
      )}

      {/* 元素標籤 */}
      <div className={`element-badge element-${summon.element}`}>
        {summon.element}
      </div>

      {/* 技能按鈕（互動型） */}
      {summon.behavior.actionType === 'interactive' && (
        <div className="summon-skills">
          {summon.skills.map(skill => (
            <button
              key={skill.id}
              className="summon-skill-btn"
              onClick={() => onSkillUse(skill.id)}
            >
              {skill.icon} {skill.name}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SummonDisplay;
```

### 召喚動畫

**檔案**: `ui/src/components/Battle/SummonAnimation.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface SummonAnimationProps {
  summon: SummonInstance;
  onComplete: () => void;
}

const SummonAnimation: React.FC<SummonAnimationProps> = ({
  summon,
  onComplete
}) => {
  return (
    <div className="summon-animation-overlay">
      {/* 魔法陣 */}
      <motion.div
        className="magic-circle"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1.5, rotate: 360 }}
        transition={{ duration: 1 }}
      >
        <div className="circle-outer"></div>
        <div className="circle-inner"></div>
        <div className="circle-runes">✦ ✧ ✦ ✧ ✦ ✧</div>
      </motion.div>

      {/* 召喚獸出現 */}
      <motion.div
        className="summon-emergence"
        initial={{ y: 100, opacity: 0, scale: 0 }}
        animate={{ y: 0, opacity: 1, scale: 1.2 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        onAnimationComplete={onComplete}
      >
        <div
          className="summon-icon"
          style={{ color: summon.appearance.color }}
        >
          {summon.icon}
        </div>
      </motion.div>

      {/* 召喚台詞 */}
      <motion.div
        className="summon-quote"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {summon.quotes.summon[0]}
      </motion.div>

      {/* 粒子效果 */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{
              x: 0,
              y: 0,
              opacity: 1
            }}
            animate={{
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
              opacity: 0
            }}
            transition={{
              duration: 1.5,
              delay: Math.random() * 0.5
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SummonAnimation;
```

---

## 召喚獸庫範例

### 攻擊型召喚獸

```json
{
  "titan-of-refactoring": {
    "name": "Refactoring Titan",
    "displayName": "重構泰坦",
    "icon": "⚒️",
    "element": "structure",
    "rarity": "epic",
    "type": "offensive",

    "summonCost": { "mp": 60 },

    "behavior": {
      "actionType": "automatic",
      "duration": 2
    },

    "skills": [
      {
        "id": "structural_smash",
        "name": "結構粉碎",
        "effect": {
          "damage": "200 + player.level * 15",
          "effectiveness": {
            "architecture": 2.0,
            "code-task": 1.5
          },
          "debuff": {
            "target": "enemy",
            "stat": "defense",
            "value": -20,
            "duration": 2
          }
        }
      }
    ]
  }
}
```

### 支援型召喚獸

```json
{
  "healing-fairy": {
    "name": "Healing Fairy",
    "displayName": "治癒精靈",
    "icon": "🧚✨",
    "element": "life",
    "rarity": "uncommon",
    "type": "support",

    "summonCost": { "mp": 30 },

    "behavior": {
      "actionType": "automatic",
      "duration": 3
    },

    "skills": [
      {
        "id": "fairy_blessing",
        "name": "精靈祝福",
        "effect": {
          "heal": {
            "target": "player",
            "value": "player.maxHp * 0.15"
          },
          "mpRestore": {
            "target": "player",
            "value": 20
          }
        }
      }
    ]
  }
}
```

### 特殊型召喚獸

```json
{
  "time-wizard": {
    "name": "Time Wizard",
    "displayName": "時間魔導師",
    "icon": "🕰️",
    "element": "temporal",
    "rarity": "legendary",
    "type": "utility",

    "summonCost": { "mp": 100 },

    "behavior": {
      "actionType": "immediate"
    },

    "skills": [
      {
        "id": "time_rewind",
        "name": "時間倒流",
        "effect": {
          "special": {
            "type": "reset_cooldowns",
            "target": "all_skills",
            "description": "重置所有技能冷卻"
          },
          "restore": {
            "hp": "player.maxHp * 0.3",
            "mp": "player.maxMp * 0.3"
          }
        }
      }
    ],

    "exitEffect": {
      "message": "時間的齒輪停止了轉動..."
    }
  }
}
```

---

## 召喚獸與夥伴的協同

### 組合效果

```json
{
  "companion-summon-synergy": {
    "CodeGuard + Code Dragon": {
      "name": "代碼雙龍陣",
      "bonus": {
        "damage_multiplier": 1.5,
        "defense_boost": 30
      },
      "description": "CodeGuard 與代碼之龍同時在場，防禦和攻擊大幅提升"
    },

    "Speedy + Phoenix": {
      "name": "疾風烈火",
      "bonus": {
        "speed_boost": 50,
        "attack_boost": 40
      },
      "description": "速度與火焰的結合，攻擊力和速度暴增"
    }
  }
}
```

---

## 實作優先級

### Phase 2.5 擴展 (Week 5)

- [ ] 召喚獸基礎系統
  - [ ] SummonManager
  - [ ] 4 種行為類型實作
- [ ] 3-5 個基礎召喚獸
  - [ ] 攻擊型：代碼之龍
  - [ ] 支援型：治癒精靈
  - [ ] 特殊型：時間魔導師
- [ ] UI 組件
  - [ ] SummonDisplay
  - [ ] SummonAnimation
- [ ] 召喚獸 Skill 整合

### Phase 3 擴展 (Week 6-8)

- [ ] MCP 工具召喚獸
- [ ] 組合技召喚獸
- [ ] 道具召喚獸
- [ ] 召喚獸圖鑑系統
- [ ] 夥伴-召喚獸協同效果

---

## 總結

召喚獸系統為戰鬥帶來：

**✅ 戰術深度**:
- 關鍵時刻的強力支援
- 不同類型應對不同情況
- 與夥伴的協同效果

**✅ 視覺震撼**:
- 華麗的召喚動畫
- 強力技能特效
- 戲劇性的戰鬥時刻

**✅ 資源管理**:
- 高 MP 消耗
- 冷卻時間限制
- 使用時機判斷

**✅ 收集樂趣**:
- 不同稀有度
- 解鎖新召喚獸
- 圖鑑系統（未來）

---

**版本**: v1.0
**最後更新**: 2026-02-05
**整合到**: Agent-Battle-Companion-Design.md, Battle-System-Design.md
