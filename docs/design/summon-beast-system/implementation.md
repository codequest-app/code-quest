# Summon Beast System - Implementation

## Architecture Overview

```
召喚獸系統架構:

rpg-config/
├─ summon-metadata.json        # 召喚獸配置數據
└─ summon-synergy.json         # 協同效果配置

bridge/battle/
├─ SummonManager.js            # 召喚獸管理器
├─ BattleManager.js            # 戰鬥管理器（擴展）
└─ CompanionManager.js         # 夥伴管理器（協同）

ui/src/components/Battle/
├─ SummonDisplay.tsx           # 召喚獸顯示組件
├─ SummonAnimation.tsx         # 召喚動畫組件
├─ SummonSkillButton.tsx       # 技能按鈕組件
└─ SummonQuote.tsx             # 台詞氣泡組件

ui/src/store/
└─ summonSlice.ts              # 召喚獸 Redux Store
```

---

## Data Structures

### Summon Metadata

**File**: `rpg-config/summon-metadata.json`

```json
{
  "summon-code-dragon": {
    "id": "summon-code-dragon",
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

    "unlockRequirement": {
      "type": "player_level",
      "level": 10
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
        "animation": "fire-blast",
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

### Summon Instance

```typescript
interface SummonInstance {
  id: string;                    // 實例 ID（唯一）
  metadataId: string;            // 對應 metadata ID
  name: string;                  // 召喚獸名稱
  displayName: string;           // 顯示名稱
  icon: string;                  // 圖標
  element: string;               // 元素
  type: string;                  // 類型
  rarity: string;                // 稀有度

  behavior: {
    actionType: 'immediate' | 'automatic' | 'passive' | 'interactive';
    duration: number;
    canAct: boolean;
  };

  skills: CompanionSkill[];      // 技能列表
  passiveEffect?: PassiveEffect; // 被動效果

  remainingTurns: number;        // 剩餘回合數
  hasActed: boolean;             // 本回合是否已行動

  appearance: {
    avatar: string;
    color: string;
    animation: string;
    sound?: string;
  };

  quotes: {
    summon: string[];
    attack?: string[];
    exit: string[];
  };

  exitEffect?: {
    bonus?: {
      exp?: number;
      gold?: number;
    };
    message?: string;
  };
}
```

---

## SummonManager Class

**File**: `bridge/battle/SummonManager.js`

```javascript
const EventEmitter = require('events');

class SummonManager extends EventEmitter {
  constructor(battleManager) {
    super();
    this.battleMgr = battleManager;
    this.activeSummons = new Map(); // summonId -> SummonInstance
    this.summonMetadata = require('../../rpg-config/summon-metadata.json');
    this.cooldowns = new Map(); // metadataId -> cooldown timestamp
  }

  /**
   * 召喚
   */
  async summon(summonId, player, source = 'skill') {
    const metadata = this.summonMetadata[summonId];
    if (!metadata) {
      return { error: 'Unknown summon' };
    }

    // 檢查冷卻
    const cooldownEnd = this.cooldowns.get(summonId);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      return { error: `冷卻中（${remaining}秒）` };
    }

    // 檢查 MP
    if (player.mp < metadata.summonCost.mp) {
      return { error: 'MP 不足' };
    }

    // 檢查槽位（最多1個召喚獸）
    if (this.activeSummons.size >= 1 && metadata.behavior.actionType !== 'immediate') {
      return { error: '召喚獸槽位已滿' };
    }

    // 扣除 MP
    player.mp -= metadata.summonCost.mp;

    // 設定冷卻
    if (metadata.summonCost.cooldown) {
      this.cooldowns.set(
        summonId,
        Date.now() + metadata.summonCost.cooldown * 1000
      );
    }

    // 創建召喚獸實例
    const summonInstance = this.createSummonInstance(metadata);

    // 立即行動型不加入 activeSummons
    if (metadata.behavior.actionType !== 'immediate') {
      this.activeSummons.set(summonInstance.id, summonInstance);
    }

    // 廣播召喚事件
    this.battleMgr.broadcast({
      type: 'summon_appear',
      summon: summonInstance,
      quote: this.getRandomQuote(metadata.quotes.summon)
    });

    this.battleMgr.addLog(
      `召喚 ${metadata.displayName}!`,
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
      displayName: metadata.displayName,
      icon: metadata.icon,
      element: metadata.element,
      type: metadata.type,
      rarity: metadata.rarity,

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
        this.battleMgr.addLog(
          `${summon.displayName} 將持續 ${summon.remainingTurns} 回合`,
          'info'
        );
        break;

      case 'passive':
        this.applyPassiveEffect(summon, battle);
        this.battleMgr.addLog(
          `${summon.displayName} 提供被動效果（${summon.remainingTurns} 回合）`,
          'info'
        );
        break;

      case 'interactive':
        this.battleMgr.addLog(
          `${summon.displayName} 等待指令（持續 ${summon.remainingTurns} 回合）`,
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

    // 延遲移除（等動畫完成）
    setTimeout(() => {
      this.activeSummons.delete(summon.id);
    }, 2000);
  }

  /**
   * 執行召喚獸技能
   */
  async executeSummonSkill(summon, skill, battle) {
    const attackQuote = this.getRandomQuote(summon.quotes.attack || [skill.name]);

    this.battleMgr.addLog(
      `${summon.displayName}: ${attackQuote}`,
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

      this.battleMgr.broadcast({
        type: 'player_heal',
        amount: healAmount,
        playerHp: battle.player.hp
      });
    }

    // 護盾效果
    if (effect.shield) {
      const shield = effect.shield;
      battle.player.shield = (battle.player.shield || 0) + shield.value;

      this.battleMgr.addLog(
        `玩家獲得 ${shield.value} 護盾!`,
        'buff'
      );

      this.battleMgr.broadcast({
        type: 'player_shield',
        shield: battle.player.shield
      });
    }

    // Buff 效果
    if (effect.buff) {
      this.battleMgr.applyBuff(effect.buff);
    }

    // 復活效果
    if (effect.revive) {
      this.reviveCompanions(effect.revive, battle);
    }

    // 特殊效果
    if (effect.special) {
      await this.executeSpecialEffect(summon, skill, effect.special, battle);
    }
  }

  /**
   * 計算召喚獸傷害
   */
  calculateSummonDamage(summon, skill, battle) {
    const player = battle.player;
    const enemy = battle.enemy;
    const damageFormula = skill.effect.damage;

    // 簡化的傷害計算
    let baseDamage = 300;

    // 解析公式中的 player.level
    if (damageFormula.includes('player.level')) {
      const match = damageFormula.match(/player\.level\s*\*\s*(\d+)/);
      if (match) {
        baseDamage += player.level * parseInt(match[1]);
      }
    }

    // 相性加成
    const effectiveness = skill.effect.effectiveness?.[enemy.type] || 1.0;

    // AOE 加成
    const aoeMult = skill.effect.aoe ? 1.2 : 1.0;

    // 稀有度加成
    const rarityBonus = {
      common: 1.0,
      uncommon: 1.1,
      rare: 1.25,
      epic: 1.4,
      legendary: 1.6
    }[summon.rarity] || 1.0;

    return Math.floor(baseDamage * effectiveness * aoeMult * rarityBonus);
  }

  /**
   * 計算治療量
   */
  calculateHeal(healEffect, battle) {
    const player = battle.player;
    const value = healEffect.value;

    // 百分比治療
    if (typeof value === 'string' && value.includes('maxHp')) {
      const match = value.match(/maxHp\s*\*\s*([\d.]+)/);
      if (match) {
        return Math.floor(player.maxHp * parseFloat(match[1]));
      }
    }

    // 固定治療
    return parseInt(value) || 0;
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
      summon.hasActed = true;
    }
  }

  /**
   * 回合結束處理
   */
  onTurnEnd(battle) {
    for (const summon of this.activeSummons.values()) {
      // 重置行動標記
      summon.hasActed = false;

      // 檢查持續時間
      if (summon.remainingTurns <= 0) {
        this.dismissSummon(summon.id);
      }
    }
  }

  /**
   * 選擇最佳技能（簡單 AI）
   */
  selectBestSkill(summon, battle) {
    const skills = summon.skills;

    // 玩家 HP 低？優先治療
    if (battle.player.hp < battle.player.maxHp * 0.3) {
      const healSkill = skills.find(s => s.effect.heal);
      if (healSkill) return healSkill;
    }

    // 否則選擇第一個傷害技能
    const damageSkill = skills.find(s => s.effect.damage);
    return damageSkill || skills[0];
  }

  /**
   * 執行互動技能（玩家手動指揮）
   */
  async executeInteractiveSkill(summonId, skillId) {
    const summon = this.activeSummons.get(summonId);
    if (!summon) return { error: 'Summon not found' };

    if (summon.behavior.actionType !== 'interactive') {
      return { error: 'This summon is not interactive' };
    }

    const skill = summon.skills.find(s => s.id === skillId);
    if (!skill) return { error: 'Skill not found' };

    const battle = this.battleMgr.currentBattle;
    await this.executeSummonSkill(summon, skill, battle);

    summon.remainingTurns--;
    if (summon.remainingTurns <= 0) {
      this.dismissSummon(summonId);
    }

    return { success: true };
  }

  /**
   * 解除召喚
   */
  dismissSummon(summonId) {
    const summon = this.activeSummons.get(summonId);
    if (!summon) return;

    this.battleMgr.addLog(
      `${summon.displayName} 離去了...`,
      'summon_exit'
    );

    // 移除被動效果
    if (summon.behavior.actionType === 'passive') {
      this.removePassiveEffect(summon);
    }

    // 離去獎勵
    if (summon.exitEffect) {
      this.applyExitBonus(summon.exitEffect, this.battleMgr.currentBattle);
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

    if (effect.damageReduction) {
      battle.player.damageReduction = (battle.player.damageReduction || 0) + effect.damageReduction;
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

    if (effect.damageReduction) {
      battle.player.damageReduction -= effect.damageReduction;
    }
  }

  /**
   * 復活夥伴
   */
  reviveCompanions(reviveEffect, battle) {
    const companionMgr = this.battleMgr.companionMgr;
    const companions = Array.from(companionMgr.companions.values());

    companions.forEach(companion => {
      if (companion.status === 'ko') {
        companion.status = 'active';
        companion.hp = Math.floor(companion.maxHp * reviveEffect.hp_restore);

        this.battleMgr.addLog(
          `${companion.characterName} 復活了！`,
          'revive'
        );

        this.battleMgr.broadcast({
          type: 'companion_revive',
          companionId: companion.agentName,
          hp: companion.hp
        });
      }
    });
  }

  /**
   * 執行特殊效果
   */
  async executeSpecialEffect(summon, skill, special, battle) {
    switch (special.type) {
      case 'reset_cooldowns':
        // 重置所有技能冷卻
        battle.player.cooldowns = new Map();
        this.battleMgr.addLog('所有技能冷卻已重置！', 'info');
        break;

      case 'mcp_query':
        // 執行 MCP 查詢（未來實作）
        this.battleMgr.addLog('執行資料庫查詢...', 'info');
        break;

      case 'code_optimization':
        // 代碼優化（未來實作）
        this.battleMgr.addLog('代碼已自動優化！', 'info');
        break;
    }
  }

  /**
   * 應用離去獎勵
   */
  applyExitBonus(exitEffect, battle) {
    if (exitEffect.bonus) {
      if (exitEffect.bonus.exp) {
        battle.player.exp += exitEffect.bonus.exp;
        this.battleMgr.addLog(
          `獲得 ${exitEffect.bonus.exp} 經驗值！`,
          'reward'
        );
      }
      if (exitEffect.bonus.gold) {
        battle.player.gold += exitEffect.bonus.gold;
        this.battleMgr.addLog(
          `獲得 ${exitEffect.bonus.gold} 金幣！`,
          'reward'
        );
      }
    }

    if (exitEffect.message) {
      this.battleMgr.addLog(exitEffect.message, 'info');
    }
  }

  /**
   * 檢查協同效果
   */
  checkSynergy(battle) {
    if (this.activeSummons.size === 0) return null;

    const summon = Array.from(this.activeSummons.values())[0];
    const companions = Array.from(this.battleMgr.companionMgr.companions.values());

    // 載入協同配置
    const synergyConfig = require('../../rpg-config/summon-synergy.json');

    for (const companion of companions) {
      const synergyKey = `${companion.characterName} + ${summon.name}`;
      const synergy = synergyConfig[synergyKey];

      if (synergy) {
        return synergy;
      }
    }

    return null;
  }

  /**
   * 獲取隨機台詞
   */
  getRandomQuote(quotes) {
    if (!quotes || quotes.length === 0) return '';
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * 獲取所有已解鎖的召喚獸
   */
  getUnlockedSummons(player) {
    const unlocked = [];

    for (const [id, metadata] of Object.entries(this.summonMetadata)) {
      if (this.isUnlocked(metadata, player)) {
        unlocked.push({
          id,
          ...metadata
        });
      }
    }

    return unlocked;
  }

  /**
   * 檢查是否已解鎖
   */
  isUnlocked(metadata, player) {
    const req = metadata.unlockRequirement;
    if (!req) return true;

    switch (req.type) {
      case 'player_level':
        return player.level >= req.level;

      case 'achievement':
        return player.achievements?.includes(req.achievementId);

      case 'quest':
        return player.completedQuests?.includes(req.questId);

      case 'mcp_server':
        // 檢查 MCP Server 是否可用
        return this.battleMgr.hasMCPServer(req.serverId);

      default:
        return false;
    }
  }
}

module.exports = SummonManager;
```

---

## BattleManager Extension

**File**: `bridge/battle/BattleManager.js` (新增方法)

```javascript
class BattleManager {
  constructor() {
    // ... 現有代碼 ...

    // 新增召喚獸管理器
    this.summonMgr = new SummonManager(this);
  }

  /**
   * 回合開始處理
   */
  async onTurnStart() {
    // ... 現有代碼 ...

    // 處理召喚獸自動行動
    await this.summonMgr.onTurnStart(this.currentBattle);
  }

  /**
   * 回合結束處理
   */
  onTurnEnd() {
    // ... 現有代碼 ...

    // 處理召喚獸持續時間
    this.summonMgr.onTurnEnd(this.currentBattle);

    // 檢查協同效果
    const synergy = this.summonMgr.checkSynergy(this.currentBattle);
    if (synergy) {
      this.applySynergy(synergy);
    }
  }

  /**
   * 應用協同效果
   */
  applySynergy(synergy) {
    this.addLog(`觸發協同效果：${synergy.name}！`, 'synergy');

    if (synergy.bonus.damage_multiplier) {
      this.currentBattle.damageMultiplier = synergy.bonus.damage_multiplier;
    }

    if (synergy.bonus.defense_boost) {
      this.currentBattle.player.defense += synergy.bonus.defense_boost;
    }

    if (synergy.bonus.speed_boost) {
      this.currentBattle.player.speed += synergy.bonus.speed_boost;
    }

    if (synergy.bonus.attack_boost) {
      this.currentBattle.player.attack += synergy.bonus.attack_boost;
    }
  }
}
```

---

## React Components

### SummonDisplay Component

**File**: `ui/src/components/Battle/SummonDisplay.tsx`

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SummonInstance } from '../../types/summon';
import SummonSkillButton from './SummonSkillButton';

interface SummonDisplayProps {
  summons: SummonInstance[];
  onSkillUse: (summonId: string, skillId: string) => void;
}

const SummonDisplay: React.FC<SummonDisplayProps> = ({ summons, onSkillUse }) => {
  return (
    <div className="summon-container">
      <AnimatePresence>
        {summons.map(summon => (
          <SummonCard
            key={summon.id}
            summon={summon}
            onSkillUse={onSkillUse}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface SummonCardProps {
  summon: SummonInstance;
  onSkillUse: (summonId: string, skillId: string) => void;
}

const SummonCard: React.FC<SummonCardProps> = ({ summon, onSkillUse }) => {
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
      <div className="summon-name">{summon.displayName}</div>

      {/* 持續回合數 */}
      {summon.remainingTurns > 0 && (
        <motion.div
          className="summon-duration"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          剩餘 {summon.remainingTurns} 回合
        </motion.div>
      )}

      {/* 元素標籤 */}
      <div className={`element-badge element-${summon.element}`}>
        {summon.element}
      </div>

      {/* 技能按鈕（互動型） */}
      {summon.behavior.actionType === 'interactive' && (
        <div className="summon-skills">
          {summon.skills.map(skill => (
            <SummonSkillButton
              key={skill.id}
              skill={skill}
              onUse={() => onSkillUse(summon.id, skill.id)}
            />
          ))}
        </div>
      )}

      {/* 被動效果顯示 */}
      {summon.behavior.actionType === 'passive' && summon.passiveEffect && (
        <div className="passive-effects">
          {summon.passiveEffect.mpRegen && (
            <div className="passive-item">+{summon.passiveEffect.mpRegen} MP/回合</div>
          )}
          {summon.passiveEffect.expBonus && (
            <div className="passive-item">經驗 x{summon.passiveEffect.expBonus}</div>
          )}
          {summon.passiveEffect.goldBonus && (
            <div className="passive-item">金幣 x{summon.passiveEffect.goldBonus}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SummonDisplay;
```

### SummonAnimation Component

**File**: `ui/src/components/Battle/SummonAnimation.tsx`

```tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SummonInstance } from '../../types/summon';

interface SummonAnimationProps {
  summon: SummonInstance;
  onComplete: () => void;
}

const SummonAnimation: React.FC<SummonAnimationProps> = ({
  summon,
  onComplete
}) => {
  useEffect(() => {
    // 播放音效
    if (summon.appearance.sound) {
      const audio = new Audio(`/sounds/${summon.appearance.sound}`);
      audio.play();
    }

    // 2秒後完成動畫
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [summon, onComplete]);

  return (
    <div className="summon-animation-overlay">
      {/* 魔法陣 */}
      <motion.div
        className="magic-circle"
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{
          scale: [0, 1, 1.5],
          rotate: [0, 180, 360],
          opacity: [0, 1, 1]
        }}
        transition={{ duration: 1, times: [0, 0.5, 1] }}
      >
        <div className="circle-outer"></div>
        <div className="circle-inner"></div>
        <div className="circle-runes">✦ ✧ ✦ ✧ ✦ ✧</div>
      </motion.div>

      {/* 召喚獸出現 */}
      <motion.div
        className="summon-emergence"
        initial={{ y: 100, opacity: 0, scale: 0 }}
        animate={{
          y: [100, -20, 0],
          opacity: [0, 1, 1],
          scale: [0, 1.2, 1]
        }}
        transition={{
          delay: 0.5,
          duration: 0.8,
          times: [0, 0.6, 1]
        }}
      >
        <div
          className="summon-icon"
          style={{ color: summon.appearance.color, fontSize: '64px' }}
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
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
              opacity: 0
            }}
            transition={{
              duration: 1.5,
              delay: 0.5 + Math.random() * 0.5
            }}
            style={{
              background: `radial-gradient(circle, ${summon.appearance.color}, transparent)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SummonAnimation;
```

### SummonSkillButton Component

**File**: `ui/src/components/Battle/SummonSkillButton.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { CompanionSkill } from '../../types/summon';

interface SummonSkillButtonProps {
  skill: CompanionSkill;
  onUse: () => void;
  disabled?: boolean;
}

const SummonSkillButton: React.FC<SummonSkillButtonProps> = ({
  skill,
  onUse,
  disabled = false
}) => {
  return (
    <motion.button
      className={`summon-skill-btn ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onUse : undefined}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <div className="skill-icon">{skill.icon}</div>
      <div className="skill-name">{skill.name}</div>
      <div className="skill-description">{skill.description}</div>
    </motion.button>
  );
};

export default SummonSkillButton;
```

---

## Redux Store

**File**: `ui/src/store/summonSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SummonInstance } from '../types/summon';

interface SummonState {
  activeSummons: SummonInstance[];
  unlockedSummons: string[];
  cooldowns: Record<string, number>;
}

const initialState: SummonState = {
  activeSummons: [],
  unlockedSummons: [],
  cooldowns: {}
};

const summonSlice = createSlice({
  name: 'summon',
  initialState,
  reducers: {
    summonAppear(state, action: PayloadAction<SummonInstance>) {
      state.activeSummons.push(action.payload);
    },

    summonExit(state, action: PayloadAction<string>) {
      state.activeSummons = state.activeSummons.filter(
        s => s.id !== action.payload
      );
    },

    updateSummonTurn(state, action: PayloadAction<{ id: string; turns: number }>) {
      const summon = state.activeSummons.find(s => s.id === action.payload.id);
      if (summon) {
        summon.remainingTurns = action.payload.turns;
      }
    },

    unlockSummon(state, action: PayloadAction<string>) {
      if (!state.unlockedSummons.includes(action.payload)) {
        state.unlockedSummons.push(action.payload);
      }
    },

    setCooldown(state, action: PayloadAction<{ id: string; endTime: number }>) {
      state.cooldowns[action.payload.id] = action.payload.endTime;
    },

    clearCooldown(state, action: PayloadAction<string>) {
      delete state.cooldowns[action.payload];
    }
  }
});

export const {
  summonAppear,
  summonExit,
  updateSummonTurn,
  unlockSummon,
  setCooldown,
  clearCooldown
} = summonSlice.actions;

export default summonSlice.reducer;
```

---

## WebSocket Events

### Server → Client Events

```typescript
// 召喚獸出現
{
  type: 'summon_appear',
  summon: SummonInstance,
  quote: string
}

// 召喚獸離去
{
  type: 'summon_exit',
  summonId: string,
  animation: 'fade-out' | 'dissolve'
}

// 召喚獸造成傷害
{
  type: 'summon_damage',
  summonId: string,
  damage: number,
  enemyHp: number,
  animation: string
}

// 召喚獸技能施放
{
  type: 'summon_skill',
  summonId: string,
  skillId: string,
  targets: string[]
}
```

### Client → Server Events

```typescript
// 召喚
{
  type: 'summon',
  summonId: string
}

// 使用互動型召喚獸技能
{
  type: 'use_summon_skill',
  summonId: string,
  skillId: string
}
```

---

## Summary

召喚獸系統實作重點：

**✅ 核心管理**:
- SummonManager 管理所有召喚獸
- 4 種行為類型完整實作
- 冷卻和槽位管理

**✅ 戰鬥整合**:
- 與 BattleManager 無縫整合
- 回合處理邏輯
- 協同效果檢查

**✅ UI 組件**:
- SummonDisplay 顯示召喚獸
- SummonAnimation 華麗動畫
- SummonSkillButton 技能按鈕

**✅ 狀態管理**:
- Redux Store 管理召喚獸狀態
- WebSocket 實時通訊
- 前後端數據同步

---

**Version**: v1.0
**Last Updated**: 2026-02-05
