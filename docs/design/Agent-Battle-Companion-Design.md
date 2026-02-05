# Subagent 戰鬥夥伴系統設計

**基於**: Battle-System-Design.md, RPG-CLI-Architecture-v2.md
**日期**: 2026-02-05
**狀態**: 設計階段

---

## 核心概念

### Subagent → 戰鬥夥伴映射

將 Subagent 從單純的「召喚造成傷害」提升為「戰鬥夥伴」：

| Subagent 特性 | 戰鬥夥伴呈現 |
|--------------|------------|
| Agent 類型 | 夥伴職業/角色 |
| Agent Memory | 夥伴經驗/成長 |
| Agent Model (sonnet/opus) | 夥伴等級/能力 |
| Agent Tools | 夥伴專屬技能 |
| 持續執行 | 戰場上的持續存在 |
| Agent 完成任務 | 施放技能/攻擊 |

---

## 夥伴系統設計

### 1. 夥伴狀態與屬性

每個 Subagent 在戰鬥中作為獨立單位：

```typescript
interface BattleCompanion {
  // 基本資訊
  agentName: string;              // agent ID
  characterName: string;           // 角色名稱（如 "CodeGuard"）
  title: string;                   // 稱號（如 "代碼守護者"）
  avatar: string;                  // 頭像 emoji

  // 戰鬥屬性
  level: number;                   // 等級（基於使用次數）
  hp: number;                      // 生命值
  maxHp: number;
  mp: number;                      // 魔力值（用於施放技能）
  maxMp: number;

  // 戰鬥數據
  attack: number;                  // 攻擊力
  defense: number;                 // 防禦力
  speed: number;                   // 速度（決定行動順序）
  wisdom: number;                  // 智慧（影響技能效果）

  // 狀態
  status: 'standby' | 'active' | 'exhausted' | 'ko';
  stamina: number;                 // 體力（影響持續時間）

  // 技能
  skills: CompanionSkill[];        // 專屬技能列表
  currentCooldowns: Map<string, number>;

  // 經驗與成長
  experience: number;              // 夥伴經驗值
  expToNextLevel: number;          // 升級所需經驗（100 * 1.3^(level-1)）
  timesDeployed: number;           // 出戰次數
  battlesWon: number;              // 勝利次數
}
```

### 2. 夥伴專屬技能

每個 Agent 根據其特性擁有專屬戰鬥技能：

**範例: CodeGuard (code-guardian)**

```json
{
  "code-guardian": {
    "characterName": "CodeGuard",
    "title": "代碼守護者",
    "avatar": "🛡️",
    "element": "guardian",

    "baseStats": {
      "hp": 150,
      "mp": 100,
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },

    "battleSkills": [
      {
        "id": "security_scan",
        "name": "安全掃描",
        "icon": "🔍",
        "type": "attack",
        "mpCost": 20,
        "cooldown": 2,
        "description": "掃描敵人弱點，造成傷害並降低敵人防禦",
        "effect": {
          "damage": "60 + wisdom * 0.8",
          "debuff": {
            "target": "enemy",
            "stat": "defense",
            "value": -10,
            "duration": 2
          }
        },
        "animation": "scan-pulse",
        "effectiveness": {
          "bug-hunt": 1.5,
          "code-task": 1.2
        }
      },

      {
        "id": "shield_ally",
        "name": "守護之盾",
        "icon": "🛡️",
        "type": "support",
        "mpCost": 30,
        "cooldown": 3,
        "description": "為玩家提供護盾，減免傷害",
        "effect": {
          "shield": {
            "target": "player",
            "value": 50,
            "duration": 3
          },
          "buff": {
            "target": "player",
            "stat": "defense",
            "value": 20,
            "duration": 2
          }
        },
        "animation": "shield-appear"
      },

      {
        "id": "owasp_strike",
        "name": "OWASP 打擊",
        "icon": "⚔️",
        "type": "special",
        "mpCost": 50,
        "cooldown": 5,
        "description": "終極技：針對安全漏洞的毀滅性打擊",
        "effect": {
          "damage": "150 + wisdom * 1.5",
          "bonus": {
            "condition": "enemy.type === 'bug-hunt'",
            "multiplier": 2.0
          }
        },
        "animation": "ultimate-strike",
        "requiredLevel": 5
      }
    ],

    "passiveAbilities": [
      {
        "id": "vigilance",
        "name": "警戒",
        "description": "有 30% 機率阻擋敵人攻擊",
        "trigger": "on_player_attacked",
        "chance": 0.3,
        "effect": "block_damage"
      },
      {
        "id": "code_insight",
        "name": "代碼洞察",
        "description": "對代碼相關敵人額外 +20% 傷害",
        "trigger": "passive",
        "effect": {
          "damageBonus": {
            "target": ["code-task", "bug-hunt"],
            "multiplier": 1.2
          }
        }
      }
    ],

    "personality": {
      "aiStyle": "defensive",
      "preferredTargets": ["bug-hunt", "code-task"],
      "skillPriority": ["shield_ally", "security_scan", "owasp_strike"]
    }
  }
}
```

### 3. 夥伴資源管理

#### MP 系統

夥伴的 MP 管理與玩家不同：

```javascript
// 夥伴 MP 規則
companionMp: {
  // 戰鬥中不自動恢復
  regenInBattle: 0,

  // 戰鬥結束完全恢復
  resetOnBattleEnd: true,

  // MP 消耗
  consumption: {
    skill: "依技能 mpCost 定義"
  },

  // 初始 MP
  initialMp: "等於 maxMp"
}

// 範例：夥伴使用技能
executeCompanionSkill(companion, skill) {
  // 檢查 MP 是否足夠
  if (companion.mp < skill.mpCost) {
    return { error: 'MP 不足' };
  }

  // 扣除 MP
  companion.mp -= skill.mpCost;

  // 執行技能
  // ...
}

// 戰鬥結束恢復
onBattleEnd() {
  companion.mp = companion.maxMp;  // 完全恢復
  companion.hp = companion.maxHp;  // 完全恢復
}
```

**設計理由**:
- 簡化戰鬥系統，避免過多變數
- 夥伴作為支援角色，在戰鬥外自動準備完成
- 玩家只需關注技能選擇，不需管理夥伴 MP

### 4. 夥伴 AI 系統

夥伴在戰鬥中可以自動行動或由玩家控制：

**檔案**: `bridge/battle/CompanionAI.js`

```javascript
class CompanionAI {
  constructor(companion, battleState) {
    this.companion = companion;
    this.battle = battleState;
  }

  /**
   * 決定夥伴的行動
   */
  decideAction() {
    const { companion, battle } = this;
    const { player, enemy } = battle;

    // 檢查玩家生命值
    if (player.hp < player.maxHp * 0.3) {
      // 玩家生命危險，優先支援
      return this.findBestSupportSkill();
    }

    // 檢查敵人類型相性
    const effectiveSkills = this.findEffectiveSkills(enemy.type);
    if (effectiveSkills.length > 0) {
      return this.selectBestDamageSkill(effectiveSkills);
    }

    // 預設攻擊
    return this.findBestAttackSkill();
  }

  findBestSupportSkill() {
    const supportSkills = this.companion.skills.filter(
      s => s.type === 'support' && !this.isOnCooldown(s.id)
    );

    // 優先選擇護盾技能
    const shieldSkill = supportSkills.find(s => s.effect.shield);
    if (shieldSkill && this.companion.mp >= shieldSkill.mpCost) {
      return { type: 'skill', skillId: shieldSkill.id };
    }

    return null;
  }

  findEffectiveSkills(enemyType) {
    return this.companion.skills.filter(skill => {
      if (this.isOnCooldown(skill.id)) return false;
      if (this.companion.mp < skill.mpCost) return false;

      const effectiveness = skill.effectiveness?.[enemyType] || 1.0;
      return effectiveness >= 1.2; // 至少 1.2 倍才算有效
    });
  }

  selectBestDamageSkill(skills) {
    // 按預期傷害排序
    const ranked = skills.map(skill => ({
      skill,
      expectedDamage: this.calculateExpectedDamage(skill)
    }));

    ranked.sort((a, b) => b.expectedDamage - a.expectedDamage);

    return {
      type: 'skill',
      skillId: ranked[0].skill.id
    };
  }

  calculateExpectedDamage(skill) {
    const { companion, battle } = this;

    // 簡化版傷害計算
    let baseDamage = this.parseDamageFormula(skill.effect.damage);

    // 相性加成
    const effectiveness = skill.effectiveness?.[battle.enemy.type] || 1.0;

    return baseDamage * effectiveness;
  }

  parseDamageFormula(formula) {
    // 簡單解析 "60 + wisdom * 0.8" 這樣的公式
    const stats = {
      attack: this.companion.attack,
      defense: this.companion.defense,
      wisdom: this.companion.wisdom
    };

    // 用 eval 或安全的表達式解析器
    // 這裡簡化處理
    return 60 + stats.wisdom * 0.8;
  }

  isOnCooldown(skillId) {
    return this.companion.currentCooldowns.has(skillId);
  }
}
```

---

## 戰鬥流程整合

### 修改回合制系統

**檔案**: `bridge/battle/BattleManager.js` (擴展)

```javascript
class BattleManager {
  constructor(wsServer) {
    // ... 現有代碼
    this.companions = new Map(); // agentId -> BattleCompanion
    this.turnOrder = []; // 行動順序
  }

  /**
   * 召喚夥伴
   */
  summonCompanion(agentName, agentMetadata, player) {
    // 檢查召喚條件
    if (this.companions.has(agentName)) {
      return { error: '夥伴已在場上' };
    }

    if (player.mp < agentMetadata.summonCost.mp) {
      return { error: 'MP 不足' };
    }

    // 創建夥伴實例
    const companion = this.createCompanion(agentName, agentMetadata);
    this.companions.set(agentName, companion);

    // 扣除召喚 MP
    player.mp -= agentMetadata.summonCost.mp;

    // 更新行動順序
    this.updateTurnOrder();

    // 廣播召喚事件
    this.broadcast({
      type: 'companion_summon',
      companion,
      quote: this.getRandomQuote(agentMetadata.quotes.summon)
    });

    this.addLog(`${companion.characterName} 加入戰鬥！`, 'summon');

    return { success: true, companion };
  }

  /**
   * 創建夥伴實例
   */
  createCompanion(agentName, metadata) {
    return {
      agentName,
      characterName: metadata.characterName,
      title: metadata.title,
      avatar: metadata.avatar,
      element: metadata.element,

      level: 1,
      hp: metadata.baseStats.hp,
      maxHp: metadata.baseStats.hp,
      mp: metadata.baseStats.mp,
      maxMp: metadata.baseStats.mp,

      attack: metadata.baseStats.attack,
      defense: metadata.baseStats.defense,
      speed: metadata.baseStats.speed,
      wisdom: metadata.baseStats.wisdom,

      status: 'active',
      stamina: 100,

      skills: metadata.battleSkills,
      currentCooldowns: new Map(),

      experience: 0,
      timesDeployed: 1,
      battlesWon: 0
    };
  }

  /**
   * 更新行動順序（基於速度）
   */
  updateTurnOrder() {
    const units = [
      { type: 'player', speed: 100 },
      ...Array.from(this.companions.values()).map(c => ({
        type: 'companion',
        id: c.agentName,
        speed: c.speed
      }))
    ];

    // 按速度排序
    this.turnOrder = units.sort((a, b) => b.speed - a.speed);
  }

  /**
   * 執行戰鬥回合
   */
  async executeTurn() {
    for (const unit of this.turnOrder) {
      if (unit.type === 'player') {
        // 等待玩家操作
        await this.waitForPlayerAction();
      } else if (unit.type === 'companion') {
        // 夥伴自動行動
        await this.executeCompanionTurn(unit.id);
      }

      // 檢查戰鬥是否結束
      if (this.checkBattleEnd()) {
        break;
      }
    }

    // 回合結束，敵人回合
    if (!this.checkBattleEnd()) {
      this.enemyTurn();
    }
  }

  /**
   * 夥伴回合
   */
  async executeCompanionTurn(companionId) {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') {
      return;
    }

    this.addLog(`${companion.characterName} 的回合`, 'turn');

    // AI 決定行動
    const ai = new CompanionAI(companion, this.currentBattle);
    const action = ai.decideAction();

    if (action && action.type === 'skill') {
      await this.executeCompanionSkill(companion, action.skillId);
    } else {
      // 普通攻擊
      await this.companionBasicAttack(companion);
    }

    // 更新冷卻
    this.updateCooldowns(companion);
  }

  /**
   * 夥伴使用技能
   */
  async executeCompanionSkill(companion, skillId) {
    const skill = companion.skills.find(s => s.id === skillId);
    if (!skill) return;

    // 扣除 MP
    companion.mp -= skill.mpCost;

    // 啟動冷卻
    companion.currentCooldowns.set(skillId, skill.cooldown);

    this.addLog(
      `${companion.characterName} 使用 ${skill.name}!`,
      'companion_skill'
    );

    // 執行技能效果
    await this.applySkillEffect(companion, skill);

    // 廣播動畫
    this.broadcast({
      type: 'companion_skill',
      companion: companion.agentName,
      skill,
      animation: skill.animation
    });
  }

  /**
   * 應用技能效果
   */
  async applySkillEffect(companion, skill) {
    const effect = skill.effect;
    const battle = this.currentBattle;

    // 傷害效果
    if (effect.damage) {
      const damage = this.calculateCompanionDamage(companion, skill);
      battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);

      this.addLog(`造成 ${damage} 傷害!`, 'damage');

      this.broadcast({
        type: 'damage_dealt',
        source: 'companion',
        damage,
        enemyHp: battle.enemy.hp
      });
    }

    // 護盾效果
    if (effect.shield) {
      const shield = effect.shield;
      if (shield.target === 'player') {
        battle.player.shield = (battle.player.shield || 0) + shield.value;
        this.addLog(`玩家獲得 ${shield.value} 點護盾!`, 'buff');
      }
    }

    // Buff 效果
    if (effect.buff) {
      this.applyBuff(effect.buff);
    }

    // Debuff 效果
    if (effect.debuff) {
      this.applyDebuff(effect.debuff);
    }
  }

  /**
   * 計算夥伴技能傷害
   */
  calculateCompanionDamage(companion, skill) {
    const battle = this.currentBattle;
    const enemy = battle.enemy;

    // 解析傷害公式
    let baseDamage = this.parseDamageFormula(skill.effect.damage, companion);

    // 相性加成
    const effectiveness = skill.effectiveness?.[enemy.type] || 1.0;

    // 特殊條件加成
    let bonusMultiplier = 1.0;
    if (skill.effect.bonus) {
      // 檢查條件（簡化版）
      if (enemy.type === 'bug-hunt' && skill.effect.bonus.condition) {
        bonusMultiplier = skill.effect.bonus.multiplier;
      }
    }

    return Math.floor(baseDamage * effectiveness * bonusMultiplier);
  }

  /**
   * 夥伴普通攻擊
   */
  async companionBasicAttack(companion) {
    const damage = companion.attack;
    this.currentBattle.enemy.hp = Math.max(
      0,
      this.currentBattle.enemy.hp - damage
    );

    this.addLog(`${companion.characterName} 攻擊! 造成 ${damage} 傷害!`, 'attack');

    this.broadcast({
      type: 'companion_attack',
      companion: companion.agentName,
      damage,
      enemyHp: this.currentBattle.enemy.hp
    });
  }

  /**
   * 夥伴受傷
   */
  companionTakeDamage(companionId, damage) {
    const companion = this.companions.get(companionId);
    if (!companion) return;

    companion.hp = Math.max(0, companion.hp - damage);

    if (companion.hp === 0) {
      companion.status = 'ko';
      this.addLog(`${companion.characterName} 倒下了！`, 'ko');
      this.broadcast({
        type: 'companion_ko',
        companion: companionId
      });
    }
  }

  /**
   * 戰鬥結束後的夥伴處理
   */
  onBattleEnd(result) {
    for (const companion of this.companions.values()) {
      if (result === 'victory') {
        // 夥伴獲得經驗
        companion.experience += 50;
        companion.battlesWon++;

        // 檢查升級
        while (companion.experience >= companion.expToNextLevel) {
          this.levelUpCompanion(companion);
        }
      }

      // 恢復狀態
      companion.hp = companion.maxHp;
      companion.mp = companion.maxMp;  // MP 在戰鬥結束完全恢復（戰鬥中不自動恢復）
      companion.status = 'standby';
      companion.currentCooldowns.clear();
    }
  }

  /**
   * 夥伴升級
   */
  levelUpCompanion(companion) {
    companion.level++;
    companion.experience -= companion.expToNextLevel;

    // 更新下一等級所需經驗（夥伴升級比玩家快）
    companion.expToNextLevel = Math.floor(100 * Math.pow(1.3, companion.level - 1));

    // 提升屬性
    companion.maxHp += 20;
    companion.maxMp += 15;
    companion.attack += 5;
    companion.defense += 5;
    companion.wisdom += 5;

    this.addLog(`${companion.characterName} 升級到 Lv.${companion.level}!`, 'level_up');

    this.broadcast({
      type: 'companion_level_up',
      companion: companion.agentName,
      level: companion.level,
      newExpToNextLevel: companion.expToNextLevel
    });
  }
}
```

---

## UI 組件設計

### 夥伴顯示面板

**檔案**: `ui/src/components/Battle/CompanionPanel.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import ProgressBar from '../Common/ProgressBar';

interface CompanionPanelProps {
  companion: BattleCompanion;
  onSkillSelect?: (skillId: string) => void;
}

const CompanionPanel: React.FC<CompanionPanelProps> = ({
  companion,
  onSkillSelect
}) => {
  return (
    <motion.div
      className="companion-panel pixel-art"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
    >
      {/* 夥伴頭像 */}
      <div className="companion-avatar">
        <div className="avatar-icon">{companion.avatar}</div>
        <div className="level-badge">Lv.{companion.level}</div>
      </div>

      {/* 夥伴資訊 */}
      <div className="companion-info">
        <div className="companion-name">{companion.characterName}</div>
        <div className="companion-title">{companion.title}</div>

        {/* HP/MP 條 */}
        <div className="stats">
          <ProgressBar
            label="HP"
            value={companion.hp}
            max={companion.maxHp}
            color="green"
            size="small"
          />
          <ProgressBar
            label="MP"
            value={companion.mp}
            max={companion.maxMp}
            color="blue"
            size="small"
          />
        </div>
      </div>

      {/* 技能列表 */}
      {onSkillSelect && (
        <div className="companion-skills">
          {companion.skills.map(skill => (
            <CompanionSkillButton
              key={skill.id}
              skill={skill}
              companion={companion}
              onClick={() => onSkillSelect(skill.id)}
            />
          ))}
        </div>
      )}

      {/* 狀態指示 */}
      <div className={`status-indicator status-${companion.status}`}>
        {companion.status === 'active' && '⚡ 待命中'}
        {companion.status === 'exhausted' && '😰 疲憊'}
        {companion.status === 'ko' && '💀 倒下'}
      </div>
    </motion.div>
  );
};

const CompanionSkillButton: React.FC<{
  skill: CompanionSkill;
  companion: BattleCompanion;
  onClick: () => void;
}> = ({ skill, companion, onClick }) => {
  const isOnCooldown = companion.currentCooldowns.has(skill.id);
  const canAfford = companion.mp >= skill.mpCost;
  const canUse = !isOnCooldown && canAfford && companion.status === 'active';

  return (
    <button
      className={`companion-skill-btn ${!canUse ? 'disabled' : ''}`}
      onClick={canUse ? onClick : undefined}
      title={skill.description}
    >
      <div className="skill-icon">{skill.icon}</div>
      <div className="skill-name">{skill.name}</div>
      <div className="skill-cost">MP: {skill.mpCost}</div>

      {isOnCooldown && (
        <div className="cooldown-overlay">
          {companion.currentCooldowns.get(skill.id)}
        </div>
      )}
    </button>
  );
};

export default CompanionPanel;
```

### 夥伴施放技能動畫

**檔案**: `ui/src/components/Battle/CompanionSkillAnimation.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface CompanionSkillAnimationProps {
  companion: BattleCompanion;
  skill: CompanionSkill;
  onComplete: () => void;
}

const CompanionSkillAnimation: React.FC<CompanionSkillAnimationProps> = ({
  companion,
  skill,
  onComplete
}) => {
  return (
    <div className="skill-animation-container">
      {/* 夥伴向前移動 */}
      <motion.div
        className="companion-sprite"
        initial={{ x: 50 }}
        animate={{ x: 150 }}
        transition={{ duration: 0.3 }}
      >
        {companion.avatar}
      </motion.div>

      {/* 技能特效 */}
      <motion.div
        className={`skill-effect effect-${skill.animation}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onComplete}
      >
        {skill.icon}
      </motion.div>

      {/* 技能名稱顯示 */}
      <motion.div
        className="skill-name-display"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        {skill.name}!
      </motion.div>
    </div>
  );
};

export default CompanionSkillAnimation;
```

---

## 夥伴成長系統

### 經驗與升級

```javascript
// 夥伴獲得經驗的來源
const experienceGains = {
  battleVictory: 50,          // 戰鬥勝利
  skillUsed: 5,               // 使用技能
  damageDealt: (damage) => Math.floor(damage / 10),  // 造成傷害
  playerHealed: (amount) => Math.floor(amount / 5),  // 治療玩家
  weaknessHit: 20            // 命中弱點
};

// 升級獎勵
function onCompanionLevelUp(companion) {
  const rewards = {
    hp: 20,
    mp: 15,
    attack: 5,
    defense: 5,
    speed: 2,
    wisdom: 5
  };

  // 特殊等級解鎖新技能
  if (companion.level === 5) {
    unlockSkill(companion, 'ultimate_skill');
  }

  if (companion.level === 10) {
    unlockPassiveAbility(companion, 'mastery');
  }
}
```

### 親密度系統（可選）

```typescript
interface CompanionAffinity {
  level: number;              // 親密度等級 (1-10)
  points: number;             // 親密度點數

  bonuses: {
    statBoost: number;        // 屬性加成 %
    mpCostReduction: number;  // 技能消耗減少 %
    criticalChance: number;   // 暴擊率增加
  };

  unlockedDialogues: string[]; // 解鎖的對話
}

// 親密度獲得方式
const affinityGains = {
  summon: 10,                  // 召喚夥伴
  battleTogether: 5,           // 一起戰鬥
  victory: 15,                 // 共同勝利
  useSkill: 3,                 // 使用夥伴技能
  playerSavedByCompanion: 20   // 被夥伴救援
};
```

---

## 多夥伴系統

### 同時召喚多個夥伴

```javascript
class BattleManager {
  constructor() {
    // ...
    this.maxCompanions = 2;  // 最多同時 2 個夥伴
  }

  canSummonCompanion() {
    return this.companions.size < this.maxCompanions;
  }

  summonCompanion(agentName, agentMetadata, player) {
    if (!this.canSummonCompanion()) {
      return { error: `最多同時召喚 ${this.maxCompanions} 個夥伴` };
    }

    // ... 召喚邏輯
  }
}
```

### 夥伴配置文件擴展

**檔案**: `rpg-config/agent-metadata.json` (擴展)

```json
{
  "code-guardian": {
    "characterName": "CodeGuard",
    "title": "代碼守護者",
    "avatar": "🛡️",
    "element": "guardian",
    "rarity": "rare",
    "role": "tank",

    "summonCost": {
      "mp": 30,
      "cooldown": 300
    },

    "baseStats": {
      "hp": 150,
      "mp": 100,
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },

    "battleSkills": [
      {
        "id": "security_scan",
        "name": "安全掃描",
        "icon": "🔍",
        "type": "attack",
        "mpCost": 20,
        "cooldown": 2,
        "description": "掃描敵人弱點",
        "effect": {
          "damage": "60 + wisdom * 0.8",
          "debuff": {
            "target": "enemy",
            "stat": "defense",
            "value": -10,
            "duration": 2
          }
        },
        "effectiveness": {
          "bug-hunt": 1.5,
          "code-task": 1.2
        }
      }
    ],

    "passiveAbilities": [
      {
        "id": "vigilance",
        "name": "警戒",
        "description": "30% 機率阻擋攻擊",
        "trigger": "on_player_attacked",
        "chance": 0.3
      }
    ],

    "personality": {
      "aiStyle": "defensive",
      "preferredTargets": ["bug-hunt"],
      "skillPriority": ["shield_ally", "security_scan"]
    }
  },

  "perf-optimizer": {
    "characterName": "Speedy",
    "title": "性能優化師",
    "avatar": "⚡",
    "element": "speed",
    "rarity": "uncommon",
    "role": "attacker",

    "summonCost": {
      "mp": 25,
      "cooldown": 200
    },

    "baseStats": {
      "hp": 100,
      "mp": 120,
      "attack": 90,
      "defense": 50,
      "speed": 95,
      "wisdom": 70
    },

    "battleSkills": [
      {
        "id": "rapid_strike",
        "name": "快速打擊",
        "icon": "⚡",
        "type": "attack",
        "mpCost": 15,
        "cooldown": 1,
        "description": "高速連擊",
        "effect": {
          "damage": "40 + attack * 0.6",
          "hits": 2
        },
        "effectiveness": {
          "optimization": 1.8,
          "code-task": 1.3
        }
      },
      {
        "id": "haste",
        "name": "加速",
        "icon": "💨",
        "type": "buff",
        "mpCost": 25,
        "cooldown": 4,
        "description": "提升全體速度",
        "effect": {
          "buff": {
            "target": "all_allies",
            "stat": "speed",
            "value": 20,
            "duration": 3
          }
        }
      }
    ],

    "passiveAbilities": [
      {
        "id": "quick_feet",
        "name": "敏捷",
        "description": "永久 +10% 速度",
        "trigger": "passive",
        "effect": {
          "statBonus": {
            "speed": 10
          }
        }
      }
    ],

    "personality": {
      "aiStyle": "aggressive",
      "preferredTargets": ["optimization"],
      "skillPriority": ["rapid_strike", "haste"]
    }
  }
}
```

---

## 戰鬥畫面佈局調整

```
┌─────────────────────────────────────────────────┐
│  [玩家 HP/MP]                    [敵人資訊]      │
├─────────────────────────────────────────────────┤
│                                                 │
│   [夥伴1]    [夥伴2]         [敵人圖示]         │
│   CodeGuard  Speedy              🐛            │
│   ❤️ ███░  ❤️ ██░░         HP: ███████░░       │
│   ⭐ ██░░  ⭐ ███░                             │
│                                                 │
├─────────────────────────────────────────────────┤
│  [戰鬥日誌]                                      │
│  > CodeGuard 使用安全掃描! 造成 120 傷害!        │
│  > Speedy 使用快速打擊! 連擊 2 次!               │
│  > Bug Beast 反擊! 玩家 -15 MP                  │
├─────────────────────────────────────────────────┤
│  [行動選單]                                      │
│  [⚔️ 玩家技能] [🤝 夥伴指令] [🎒 道具]          │
│                                                 │
│  夥伴指令:                                       │
│  ├─ [🛡️ CodeGuard] → [技能1] [技能2] [技能3]   │
│  └─ [⚡ Speedy]    → [技能1] [技能2]            │
└─────────────────────────────────────────────────┘
```

---

## 驗收標準

### 基礎夥伴功能
```bash
# 1. 夥伴召喚
召喚 Agent → 夥伴加入戰場 ✅
夥伴有獨立 HP/MP ✅
夥伴顯示在戰場上 ✅

# 2. 夥伴行動
夥伴自動回合 ✅
夥伴使用技能 → 造成傷害 ✅
夥伴使用支援技能 → 玩家獲得 Buff ✅

# 3. 夥伴 AI
玩家血量低 → 夥伴使用治療/護盾 ✅
敵人有弱點 → 夥伴優先使用有效技能 ✅
```

### 進階功能
```bash
# 4. 夥伴成長
戰鬥勝利 → 夥伴獲得經驗 ✅
經驗滿 → 夥伴升級 ✅
升級 → 屬性提升 ✅

# 5. 多夥伴
同時召喚 2 個夥伴 ✅
回合順序按速度排列 ✅
夥伴協同作戰 ✅

# 6. 被動技能
夥伴被動觸發 ✅
親密度獎勵生效 ✅
```

---

## 實作優先級

### 在 Phase 2.5 中整合 (Week 4-5)

**Week 4**:
- [ ] 夥伴基礎系統
  - [ ] BattleCompanion 資料結構
  - [ ] 召喚/解除邏輯
  - [ ] 夥伴基礎 AI
- [ ] 回合制整合
  - [ ] 行動順序計算
  - [ ] 夥伴回合執行

**Week 5**:
- [ ] 夥伴技能系統
  - [ ] 技能效果實作
  - [ ] 傷害/治療/Buff 計算
- [ ] UI 組件
  - [ ] CompanionPanel
  - [ ] CompanionSkillAnimation
- [ ] 夥伴成長
  - [ ] 經驗值系統
  - [ ] 升級機制

---

## 總結

將 Subagent 設計為戰鬥夥伴帶來以下優勢:

**✅ 更豐富的策略性**:
- 不同夥伴有不同職能（坦克/輸出/輔助）
- 技能搭配產生協同效果
- 夥伴 AI 減輕玩家負擔

**✅ 更強的代入感**:
- 夥伴有個性和對話
- 成長系統帶來養成樂趣
- 親密度增加情感連結

**✅ 更深的遊戲性**:
- 夥伴搭配選擇
- 技能時機判斷
- 資源（MP）分配

**✅ 與 AI 功能的自然結合**:
- Agent 執行任務 = 夥伴施放技能
- Agent Memory = 夥伴經驗累積
- 不同 Model = 不同夥伴能力

---

**版本**: v1.0
**最後更新**: 2026-02-05
**整合到**: Battle-System-Design.md
