# Companion System - Implementation

## 數據結構定義

### BattleCompanion 接口

**檔案**: `bridge/battle/types.ts`

```typescript
interface BattleCompanion {
  // 基本資訊
  agentName: string;              // agent ID
  characterName: string;           // 角色名稱
  title: string;                   // 稱號
  avatar: string;                  // 頭像 emoji

  // 戰鬥屬性
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  attack: number;
  defense: number;
  speed: number;
  wisdom: number;

  // 狀態
  status: 'standby' | 'active' | 'exhausted' | 'ko';
  stamina: number;

  // 技能
  skills: CompanionSkill[];
  currentCooldowns: Map<string, number>;

  // 成長
  experience: number;
  expToNextLevel: number;
  timesDeployed: number;
  battlesWon: number;
}

interface CompanionSkill {
  id: string;
  name: string;
  icon: string;
  type: 'attack' | 'support' | 'special';
  mpCost: number;
  cooldown: number;
  description: string;
  effect: SkillEffect;
  animation: string;
  effectiveness?: Record<string, number>;
  requiredLevel?: number;
}

interface SkillEffect {
  damage?: string;              // 傷害公式
  shield?: ShieldEffect;
  buff?: BuffEffect;
  debuff?: DebuffEffect;
  bonus?: BonusEffect;
  hits?: number;                // 連擊次數
}
```

---

## CompanionAI 類

### 完整實現

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

    // 1. 檢查玩家生命值
    if (player.hp < player.maxHp * 0.3) {
      const supportAction = this.findBestSupportSkill();
      if (supportAction) return supportAction;
    }

    // 2. 檢查敵人類型相性
    const effectiveSkills = this.findEffectiveSkills(enemy.type);
    if (effectiveSkills.length > 0) {
      return this.selectBestDamageSkill(effectiveSkills);
    }

    // 3. 預設攻擊
    return this.findBestAttackSkill();
  }

  findBestSupportSkill() {
    const supportSkills = this.companion.skills.filter(
      s => s.type === 'support' &&
           !this.isOnCooldown(s.id) &&
           this.companion.mp >= s.mpCost
    );

    if (supportSkills.length === 0) return null;

    // 優先選擇護盾技能
    const shieldSkill = supportSkills.find(s => s.effect.shield);
    if (shieldSkill) {
      return { type: 'skill', skillId: shieldSkill.id };
    }

    // 其次選擇 Buff 技能
    const buffSkill = supportSkills.find(s => s.effect.buff);
    if (buffSkill) {
      return { type: 'skill', skillId: buffSkill.id };
    }

    return null;
  }

  findEffectiveSkills(enemyType) {
    return this.companion.skills.filter(skill => {
      if (this.isOnCooldown(skill.id)) return false;
      if (this.companion.mp < skill.mpCost) return false;

      const effectiveness = skill.effectiveness?.[enemyType] || 1.0;
      return effectiveness >= 1.2;
    });
  }

  findBestAttackSkill() {
    const attackSkills = this.companion.skills.filter(
      s => s.type === 'attack' &&
           !this.isOnCooldown(s.id) &&
           this.companion.mp >= s.mpCost
    );

    if (attackSkills.length === 0) {
      return { type: 'basic_attack' };
    }

    // 選擇傷害最高的技能
    const best = attackSkills.reduce((a, b) => {
      const damageA = this.calculateExpectedDamage(a);
      const damageB = this.calculateExpectedDamage(b);
      return damageA > damageB ? a : b;
    });

    return { type: 'skill', skillId: best.id };
  }

  selectBestDamageSkill(skills) {
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
    const baseDamage = this.parseDamageFormula(skill.effect.damage);
    const effectiveness = skill.effectiveness?.[this.battle.enemy.type] || 1.0;
    return baseDamage * effectiveness;
  }

  parseDamageFormula(formula) {
    if (!formula) return 0;

    const stats = {
      attack: this.companion.attack,
      defense: this.companion.defense,
      wisdom: this.companion.wisdom
    };

    // 簡化解析 "60 + wisdom * 0.8" 格式
    try {
      return eval(formula.replace(/(\w+)/g, (match) => {
        return stats[match] !== undefined ? stats[match] : match;
      }));
    } catch (e) {
      console.error('解析傷害公式失敗:', formula, e);
      return 50; // 預設值
    }
  }

  isOnCooldown(skillId) {
    return this.companion.currentCooldowns.has(skillId) &&
           this.companion.currentCooldowns.get(skillId) > 0;
  }
}

module.exports = CompanionAI;
```

---

## BattleManager 擴展

### 夥伴管理功能

**檔案**: `bridge/battle/BattleManager.js` (擴展)

```javascript
const CompanionAI = require('./CompanionAI');

class BattleManager {
  constructor(wsServer) {
    // ... 現有代碼
    this.companions = new Map(); // agentId -> BattleCompanion
    this.turnOrder = [];
  }

  /**
   * 召喚夥伴
   */
  summonCompanion(agentName, agentMetadata, player) {
    // 檢查召喚條件
    if (this.companions.size >= 2) {
      return { error: '最多同時召喚 2 個夥伴' };
    }

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
      quote: agentMetadata.quotes?.summon || `${companion.characterName} 參戰！`
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
      expToNextLevel: 100,
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
        speed: c.speed,
        companion: c
      }))
    ];

    // 按速度降序排序
    this.turnOrder = units.sort((a, b) => b.speed - a.speed);
  }

  /**
   * 執行夥伴回合
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

    if (action.type === 'skill') {
      await this.executeCompanionSkill(companion, action.skillId);
    } else {
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

    // 獲得經驗
    this.grantCompanionExperience(companion, 5);
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

      // 處理連擊
      const hits = effect.hits || 1;
      for (let i = 0; i < hits; i++) {
        battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);
        this.addLog(`造成 ${damage} 傷害!${hits > 1 ? ` (${i+1}/${hits})` : ''}`, 'damage');

        if (battle.enemy.hp <= 0) break;
      }

      this.broadcast({
        type: 'damage_dealt',
        source: 'companion',
        damage: damage * hits,
        enemyHp: battle.enemy.hp
      });

      // 獲得經驗
      this.grantCompanionExperience(companion, Math.floor(damage / 10));
    }

    // 護盾效果
    if (effect.shield) {
      const shield = effect.shield;
      if (shield.target === 'player') {
        battle.player.shield = (battle.player.shield || 0) + shield.value;
        this.addLog(`玩家獲得 ${shield.value} 點護盾!`, 'buff');

        // 獲得經驗
        this.grantCompanionExperience(companion, Math.floor(shield.value / 5));
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
    const stats = {
      attack: companion.attack,
      defense: companion.defense,
      wisdom: companion.wisdom
    };

    let baseDamage;
    try {
      baseDamage = eval(skill.effect.damage.replace(/(\w+)/g, (match) => {
        return stats[match] !== undefined ? stats[match] : match;
      }));
    } catch (e) {
      baseDamage = 50;
    }

    // 相性加成
    const effectiveness = skill.effectiveness?.[enemy.type] || 1.0;

    // 特殊條件加成
    let bonusMultiplier = 1.0;
    if (skill.effect.bonus && skill.effect.bonus.condition) {
      // 簡化條件檢查
      if (enemy.type === 'bug-hunt') {
        bonusMultiplier = skill.effect.bonus.multiplier || 1.0;
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

    // 獲得經驗
    this.grantCompanionExperience(companion, Math.floor(damage / 10));
  }

  /**
   * 更新冷卻
   */
  updateCooldowns(companion) {
    for (const [skillId, cooldown] of companion.currentCooldowns.entries()) {
      const newCooldown = cooldown - 1;
      if (newCooldown <= 0) {
        companion.currentCooldowns.delete(skillId);
      } else {
        companion.currentCooldowns.set(skillId, newCooldown);
      }
    }
  }

  /**
   * 給予夥伴經驗
   */
  grantCompanionExperience(companion, amount) {
    companion.experience += amount;

    // 檢查升級
    while (companion.experience >= companion.expToNextLevel) {
      this.levelUpCompanion(companion);
    }
  }

  /**
   * 夥伴升級
   */
  levelUpCompanion(companion) {
    companion.level++;
    companion.experience -= companion.expToNextLevel;

    // 更新下一等級所需經驗
    companion.expToNextLevel = Math.floor(100 * Math.pow(1.3, companion.level - 1));

    // 提升屬性
    companion.maxHp += 20;
    companion.maxMp += 15;
    companion.attack += 5;
    companion.defense += 5;
    companion.speed += 2;
    companion.wisdom += 5;

    // 恢復 HP/MP
    companion.hp = companion.maxHp;
    companion.mp = companion.maxMp;

    this.addLog(`${companion.characterName} 升級到 Lv.${companion.level}!`, 'level_up');

    this.broadcast({
      type: 'companion_level_up',
      companion: companion.agentName,
      level: companion.level,
      newExpToNextLevel: companion.expToNextLevel
    });
  }

  /**
   * 戰鬥結束後的夥伴處理
   */
  onBattleEnd(result) {
    for (const companion of this.companions.values()) {
      if (result === 'victory') {
        // 夥伴獲得經驗
        this.grantCompanionExperience(companion, 50);
        companion.battlesWon++;
      }

      // 恢復狀態
      companion.hp = companion.maxHp;
      companion.mp = companion.maxMp;
      companion.status = 'standby';
      companion.currentCooldowns.clear();
    }
  }

  /**
   * 夥伴受傷
   */
  companionTakeDamage(companionId, damage) {
    const companion = this.companions.get(companionId);
    if (!companion) return;

    companion.hp = Math.max(0, companion.hp - damage);

    this.broadcast({
      type: 'companion_take_damage',
      companion: companionId,
      damage,
      hp: companion.hp
    });

    if (companion.hp === 0) {
      companion.status = 'ko';
      this.addLog(`${companion.characterName} 倒下了！`, 'ko');
      this.broadcast({
        type: 'companion_ko',
        companion: companionId
      });
    }
  }
}

module.exports = BattleManager;
```

---

## UI 組件實現

### CompanionPanel 組件

**檔案**: `ui/src/components/Battle/CompanionPanel.tsx`

```typescript
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
      {/* 頭像 */}
      <div className="companion-avatar">
        <div className="avatar-icon">{companion.avatar}</div>
        <div className="level-badge">Lv.{companion.level}</div>
      </div>

      {/* 資訊 */}
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

      {/* 狀態 */}
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
  const isUnlocked = !skill.requiredLevel || companion.level >= skill.requiredLevel;
  const canUse = !isOnCooldown && canAfford && isUnlocked && companion.status === 'active';

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

      {!canAfford && <div className="mp-insufficient">MP不足</div>}
      {!isUnlocked && <div className="locked">🔒 Lv.{skill.requiredLevel}</div>}
    </button>
  );
};

export default CompanionPanel;
```

---

## 配置文件範例

### agent-metadata.json 擴展

**檔案**: `rpg-config/agent-metadata.json`

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
        "description": "為玩家提供護盾",
        "effect": {
          "shield": {
            "target": "player",
            "value": 50,
            "duration": 3
          }
        },
        "animation": "shield-appear"
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
    },

    "quotes": {
      "summon": "讓我來守護代碼的安全！",
      "skill": ["發現漏洞！", "防禦就緒！"],
      "victory": "代碼已被守護！",
      "defeat": "抱歉...我沒能守護好..."
    }
  }
}
```

---

## 測試策略

### 單元測試

```javascript
describe('CompanionAI', () => {
  test('玩家血量低時優先使用支援技能', () => {
    const companion = createMockCompanion();
    const battle = {
      player: { hp: 25, maxHp: 100 },
      enemy: { type: 'bug-hunt' }
    };
    const ai = new CompanionAI(companion, battle);

    const action = ai.decideAction();

    expect(action.type).toBe('skill');
    expect(action.skillId).toBe('shield_ally');
  });

  test('敵人有弱點時使用有效技能', () => {
    const companion = createMockCompanion();
    const battle = {
      player: { hp: 80, maxHp: 100 },
      enemy: { type: 'bug-hunt' }
    };
    const ai = new CompanionAI(companion, battle);

    const action = ai.decideAction();

    expect(action.type).toBe('skill');
    expect(action.skillId).toBe('security_scan'); // 對bug-hunt有效
  });
});

describe('BattleManager Companion', () => {
  test('夥伴升級正確提升屬性', () => {
    const manager = new BattleManager(mockWsServer);
    const companion = createMockCompanion();

    const originalHp = companion.maxHp;
    manager.levelUpCompanion(companion);

    expect(companion.level).toBe(2);
    expect(companion.maxHp).toBe(originalHp + 20);
  });
});
```

---

## 總結

夥伴系統實現涵蓋：

**✅ 數據結構**:
- BattleCompanion 完整接口
- CompanionSkill 技能定義
- 狀態管理

**✅ AI 系統**:
- CompanionAI 智能決策
- 技能選擇邏輯
- 支援優先級

**✅ 戰鬥整合**:
- BattleManager 擴展
- 回合順序計算
- 技能效果應用

**✅ UI 組件**:
- CompanionPanel 顯示
- 技能按鈕狀態
- 動畫效果

**✅ 成長系統**:
- 經驗值獲取
- 升級機制
- 屬性提升
