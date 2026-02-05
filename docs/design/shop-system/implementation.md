# 商店系統 - 實作文檔

**日期**: 2026-02-05
**版本**: v1.0

---

## 技術架構概覽

### 系統架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    RPG-CLI 商店系統                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Town Square  │◄───│ Scene System │                  │
│  │  Navigation  │    │   (探索模式)  │                  │
│  └──────┬───────┘    └──────────────┘                  │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │          Shop Manager (核心管理器)            │      │
│  ├──────────────────────────────────────────────┤      │
│  │  • Shop Navigation                           │      │
│  │  • State Management                          │      │
│  │  • Data Persistence                          │      │
│  └──────┬───────────────────────────────────────┘      │
│         │                                                │
│    ┌────┴────┬────────┬────────┬────────┬────────┐    │
│    ▼         ▼        ▼        ▼        ▼        ▼    │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐     │
│  │技能│  │工匠│  │圖書│  │公會│  │寶物│  │訓練│     │
│  │商店│  │  鋪│  │  館│  │    │  │  庫│  │  場│     │
│  └─┬──┘  └─┬──┘  └─┬──┘  └─┬──┘  └─┬──┘  └─┬──┘     │
│    │       │       │       │       │       │        │
│    ▼       ▼       ▼       ▼       ▼       ▼        │
│  ┌──────────────────────────────────────────────┐    │
│  │           Data Layer (數據層)                 │    │
│  ├──────────────────────────────────────────────┤    │
│  │  • SkillRepository                           │    │
│  │  • MCPRepository                             │    │
│  │  • SubagentRepository                        │    │
│  │  • AchievementRepository                     │    │
│  │  • CostStatistics                            │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 技術棧

**前端**:
- React 18 (UI 框架)
- TypeScript (類型安全)
- Framer Motion (動畫)
- Zustand (狀態管理)

**後端**:
- Node.js (運行環境)
- TypeScript (類型安全)
- JSON 文件存儲 (用戶數據)
- SQLite (統計數據，可選)

**集成**:
- Claude Code API (技能執行)
- MCP Protocol (工具管理)
- Subagent System (傭兵管理)

---

## 核心類設計

### ShopManager 類

**職責**: 商店系統的核心管理器，負責商店導航、狀態管理、數據持久化

```typescript
/**
 * 商店管理器
 * 負責管理所有商店的狀態和數據
 */
class ShopManager {
  private currentShop: ShopType | null = null;
  private shopStates: Map<ShopType, ShopState> = new Map();
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.initializeShops();
  }

  /**
   * 初始化所有商店
   */
  private initializeShops(): void {
    const shops: ShopType[] = [
      'skills-shop',
      'skill-forge',
      'mcp-library',
      'subagent-guild',
      'treasury',
      'training-ground',
      'bank'
    ];

    shops.forEach(shop => {
      this.shopStates.set(shop, {
        initialized: false,
        lastVisit: null,
        hasNotification: false
      });
    });
  }

  /**
   * 進入商店
   */
  enterShop(shopType: ShopType): void {
    this.currentShop = shopType;
    const state = this.shopStates.get(shopType);

    if (state) {
      state.lastVisit = new Date();
      state.hasNotification = false;

      if (!state.initialized) {
        this.loadShopData(shopType);
        state.initialized = true;
      }
    }
  }

  /**
   * 離開當前商店
   */
  exitShop(): void {
    if (this.currentShop) {
      this.saveShopData(this.currentShop);
      this.currentShop = null;
    }
  }

  /**
   * 獲取當前商店
   */
  getCurrentShop(): ShopType | null {
    return this.currentShop;
  }

  /**
   * 檢查商店是否有通知
   */
  hasNotification(shopType: ShopType): boolean {
    return this.shopStates.get(shopType)?.hasNotification || false;
  }

  /**
   * 設置商店通知
   */
  setNotification(shopType: ShopType, hasNotification: boolean): void {
    const state = this.shopStates.get(shopType);
    if (state) {
      state.hasNotification = hasNotification;
    }
  }

  /**
   * 加載商店數據
   */
  private loadShopData(shopType: ShopType): void {
    // 根據商店類型加載對應數據
    switch (shopType) {
      case 'skills-shop':
        this.dataStore.loadSkills();
        break;
      case 'mcp-library':
        this.dataStore.loadMCPTools();
        break;
      case 'subagent-guild':
        this.dataStore.loadSubagents();
        break;
      case 'treasury':
        this.dataStore.loadAchievements();
        break;
      // ... 其他商店
    }
  }

  /**
   * 保存商店數據
   */
  private saveShopData(shopType: ShopType): void {
    // 保存商店狀態到持久化存儲
    this.dataStore.saveShopState(shopType, this.shopStates.get(shopType));
  }
}

/**
 * 商店類型枚舉
 */
type ShopType =
  | 'skills-shop'
  | 'skill-forge'
  | 'mcp-library'
  | 'subagent-guild'
  | 'treasury'
  | 'training-ground'
  | 'bank';

/**
 * 商店狀態接口
 */
interface ShopState {
  initialized: boolean;
  lastVisit: Date | null;
  hasNotification: boolean;
}
```

---

### SkillShop 類

**職責**: 管理技能商店功能，包括技能查看、解鎖、升級

```typescript
/**
 * 技能商店
 * 負責技能的查看、解鎖和升級
 */
class SkillShop {
  private skillRepository: SkillRepository;
  private playerLevel: number;
  private gold: number;

  constructor(skillRepository: SkillRepository) {
    this.skillRepository = skillRepository;
  }

  /**
   * 獲取所有技能列表
   */
  getSkills(filter?: SkillFilter): Skill[] {
    let skills = this.skillRepository.findAll();

    if (filter) {
      skills = this.applyFilter(skills, filter);
    }

    return skills.sort((a, b) => {
      // 已解鎖的技能排在前面
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;

      // 同樣狀態的技能按等級排序
      return (b.level || 0) - (a.level || 0);
    });
  }

  /**
   * 獲取技能詳情
   */
  getSkillDetail(skillId: string): SkillDetail | null {
    const skill = this.skillRepository.findById(skillId);
    if (!skill) return null;

    const stats = this.skillRepository.getUsageStats(skillId);
    const upgradeInfo = this.getUpgradeInfo(skill);

    return {
      ...skill,
      stats,
      upgradeInfo
    };
  }

  /**
   * 解鎖技能
   */
  async unlockSkill(skillId: string): Promise<UnlockResult> {
    const skill = this.skillRepository.findById(skillId);
    if (!skill) {
      return { success: false, error: '技能不存在' };
    }

    if (skill.unlocked) {
      return { success: false, error: '技能已解鎖' };
    }

    // 檢查解鎖條件
    const canUnlock = this.checkUnlockRequirements(skill);
    if (!canUnlock.success) {
      return canUnlock;
    }

    // 扣除金幣
    if (skill.unlockCost) {
      this.deductGold(skill.unlockCost);
    }

    // 解鎖技能
    skill.unlocked = true;
    skill.level = 1;
    this.skillRepository.save(skill);

    return { success: true };
  }

  /**
   * 升級技能
   */
  async upgradeSkill(skillId: string): Promise<UpgradeResult> {
    const skill = this.skillRepository.findById(skillId);
    if (!skill) {
      return { success: false, error: '技能不存在' };
    }

    if (!skill.unlocked) {
      return { success: false, error: '技能未解鎖' };
    }

    const currentLevel = skill.level || 1;
    const maxLevel = skill.maxLevel || 5;

    if (currentLevel >= maxLevel) {
      return { success: false, error: '技能已達最高等級' };
    }

    // 計算升級成本
    const upgradeCost = this.calculateUpgradeCost(skill, currentLevel);

    if (this.gold < upgradeCost) {
      return { success: false, error: '金幣不足' };
    }

    // 扣除金幣
    this.deductGold(upgradeCost);

    // 升級技能
    skill.level = currentLevel + 1;
    this.applyUpgradeEffects(skill);
    this.skillRepository.save(skill);

    return {
      success: true,
      newLevel: skill.level,
      effects: this.getUpgradeEffects(skill, skill.level)
    };
  }

  /**
   * 計算升級成本
   */
  private calculateUpgradeCost(skill: Skill, currentLevel: number): number {
    const basePrice = skill.baseUpgradeCost || 50;
    return Math.floor(basePrice * Math.pow(1.5, currentLevel - 1));
  }

  /**
   * 應用升級效果
   */
  private applyUpgradeEffects(skill: Skill): void {
    const level = skill.level || 1;

    // 降低 MP 消耗（每級降低 5%）
    if (skill.mpCost) {
      const reduction = Math.floor(skill.originalMpCost * 0.05 * (level - 1));
      skill.mpCost = Math.max(1, skill.originalMpCost - reduction);
    }

    // 減少冷卻時間（每級降低 10%）
    if (skill.cooldown) {
      const reduction = Math.floor(skill.originalCooldown * 0.1 * (level - 1));
      skill.cooldown = Math.max(5, skill.originalCooldown - reduction);
    }

    // 增加傷害（每級增加 10%）
    if (skill.damage) {
      const increase = Math.floor(skill.originalDamage * 0.1 * (level - 1));
      skill.damage = skill.originalDamage + increase;
    }
  }

  /**
   * 檢查解鎖需求
   */
  private checkUnlockRequirements(skill: Skill): UnlockResult {
    // 檢查等級需求
    if (skill.requiredLevel && this.playerLevel < skill.requiredLevel) {
      return {
        success: false,
        error: `需要等級 ${skill.requiredLevel}（當前 ${this.playerLevel}）`
      };
    }

    // 檢查金幣需求
    if (skill.unlockCost && this.gold < skill.unlockCost) {
      return {
        success: false,
        error: `需要 ${skill.unlockCost} 金幣（當前 ${this.gold}）`
      };
    }

    // 檢查前置技能
    if (skill.prerequisiteSkills) {
      for (const prereqId of skill.prerequisiteSkills) {
        const prereq = this.skillRepository.findById(prereqId);
        if (!prereq || !prereq.unlocked) {
          return {
            success: false,
            error: `需要先解鎖技能：${prereq?.name || prereqId}`
          };
        }
      }
    }

    return { success: true };
  }

  /**
   * 獲取升級資訊
   */
  private getUpgradeInfo(skill: Skill): UpgradeInfo | null {
    if (!skill.unlocked) return null;

    const currentLevel = skill.level || 1;
    const maxLevel = skill.maxLevel || 5;

    if (currentLevel >= maxLevel) return null;

    const cost = this.calculateUpgradeCost(skill, currentLevel);
    const effects = this.getUpgradeEffects(skill, currentLevel + 1);

    return {
      currentLevel,
      nextLevel: currentLevel + 1,
      cost,
      effects,
      canAfford: this.gold >= cost
    };
  }

  /**
   * 獲取升級效果預覽
   */
  private getUpgradeEffects(skill: Skill, targetLevel: number): UpgradeEffect[] {
    const effects: UpgradeEffect[] = [];

    // MP 消耗變化
    if (skill.mpCost && skill.originalMpCost) {
      const newMpCost = Math.max(
        1,
        skill.originalMpCost - Math.floor(skill.originalMpCost * 0.05 * (targetLevel - 1))
      );
      effects.push({
        type: 'mp-cost',
        old: skill.mpCost,
        new: newMpCost,
        description: `MP 消耗: ${skill.mpCost} → ${newMpCost}`
      });
    }

    // 冷卻時間變化
    if (skill.cooldown && skill.originalCooldown) {
      const newCooldown = Math.max(
        5,
        skill.originalCooldown - Math.floor(skill.originalCooldown * 0.1 * (targetLevel - 1))
      );
      effects.push({
        type: 'cooldown',
        old: skill.cooldown,
        new: newCooldown,
        description: `冷卻時間: ${skill.cooldown} 秒 → ${newCooldown} 秒`
      });
    }

    // 傷害變化
    if (skill.damage && skill.originalDamage) {
      const newDamage = skill.originalDamage + Math.floor(skill.originalDamage * 0.1 * (targetLevel - 1));
      effects.push({
        type: 'damage',
        old: skill.damage,
        new: newDamage,
        description: `傷害: ${skill.damage} → ${newDamage}`
      });
    }

    return effects;
  }

  /**
   * 應用篩選條件
   */
  private applyFilter(skills: Skill[], filter: SkillFilter): Skill[] {
    return skills.filter(skill => {
      if (filter.type && skill.type !== filter.type) return false;
      if (filter.unlocked !== undefined && skill.unlocked !== filter.unlocked) return false;
      if (filter.source && skill.source !== filter.source) return false;
      return true;
    });
  }

  /**
   * 扣除金幣
   */
  private deductGold(amount: number): void {
    this.gold -= amount;
    // 觸發金幣變化事件
    // this.eventBus.emit('gold-changed', this.gold);
  }
}
```

---

## 數據結構定義

### Skill 數據結構

```typescript
/**
 * 技能數據結構
 */
interface Skill {
  // 基本資訊
  id: string;
  name: string;
  icon: string;
  description: string;
  command: string;

  // 類型和來源
  type: 'official' | 'custom';
  source: string; // 'claude-code' | 'user-created'

  // 狀態
  unlocked: boolean;
  level: number; // 1-5
  maxLevel: number;

  // 資源消耗
  mpCost: number;
  originalMpCost: number; // 用於計算升級效果
  cooldown: number; // 秒
  originalCooldown: number;

  // 戰鬥效果
  damage: number;
  originalDamage: number;
  effects?: SkillEffect[];

  // 解鎖條件
  unlockCost?: number; // 金幣
  requiredLevel?: number;
  prerequisiteSkills?: string[]; // 前置技能 ID

  // 升級相關
  baseUpgradeCost: number;

  // 統計資訊
  usageCount: number;
  successCount: number;
  lastUsed?: Date;

  // 自定義技能特有
  actualCommand?: string; // 實際執行的命令
  variables?: SkillVariable[]; // 可用變量
  animation?: string;

  // 元數據
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 技能效果
 */
interface SkillEffect {
  type: 'buff' | 'debuff' | 'heal' | 'summon' | 'dot'; // dot = damage over time
  name: string;
  description: string;
  value: number;
  probability?: number; // 觸發機率 0-1
  duration?: number; // 持續時間（秒）
}

/**
 * 技能變量
 */
interface SkillVariable {
  name: string; // 如 {input}, {file}
  description: string;
  required: boolean;
}

/**
 * 技能使用統計
 */
interface SkillUsageStats {
  totalUsage: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-100
  averageExecutionTime: number; // 毫秒
  lastUsed?: Date;
}

/**
 * 技能詳情（包含統計和升級資訊）
 */
interface SkillDetail extends Skill {
  stats: SkillUsageStats;
  upgradeInfo: UpgradeInfo | null;
}

/**
 * 升級資訊
 */
interface UpgradeInfo {
  currentLevel: number;
  nextLevel: number;
  cost: number; // 升級成本（金幣）
  effects: UpgradeEffect[]; // 升級後的效果變化
  canAfford: boolean; // 是否有足夠金幣
}

/**
 * 升級效果
 */
interface UpgradeEffect {
  type: 'mp-cost' | 'cooldown' | 'damage' | 'special';
  old: number;
  new: number;
  description: string;
}

/**
 * 技能篩選條件
 */
interface SkillFilter {
  type?: 'official' | 'custom';
  unlocked?: boolean;
  source?: string;
  minLevel?: number;
  maxLevel?: number;
}
```

---

### MCP Tool 數據結構

```typescript
/**
 * MCP 工具數據結構
 */
interface MCPTool {
  // 基本資訊
  id: string;
  name: string;
  displayName: string; // 顯示名稱（如「資料庫魔法」）
  icon: string;
  description: string;

  // 來源資訊
  author: string;
  version: string;
  license: string;
  repository?: string;

  // 安裝狀態
  installed: boolean;
  installedVersion?: string;
  installedAt?: Date;

  // 評分和統計
  rating: number; // 0-5
  reviewCount: number;
  downloadCount: number;
  activeUsers: number;

  // 功能和需求
  features: string[]; // 提供的功能列表
  tools: MCPToolFunction[]; // 提供的工具函數
  requirements: MCPRequirement[];
  size: number; // MB

  // 使用統計
  usageCount: number;
  lastUsed?: Date;

  // 配置
  config?: MCPToolConfig;
  configSchema?: JSONSchema; // 配置項的 JSON Schema

  // 評論
  reviews?: MCPReview[];

  // 元數據
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP 工具函數
 */
interface MCPToolFunction {
  name: string;
  description: string;
  parameters: JSONSchema;
}

/**
 * MCP 工具需求
 */
interface MCPRequirement {
  type: 'software' | 'library' | 'permission';
  name: string;
  version?: string;
  description: string;
}

/**
 * MCP 工具配置
 */
interface MCPToolConfig {
  [key: string]: any;
}

/**
 * MCP 工具評論
 */
interface MCPReview {
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}
```

---

### Subagent 數據結構

```typescript
/**
 * Subagent（傭兵）數據結構
 */
interface Subagent {
  // 基本資訊
  id: string;
  name: string;
  displayName: string; // 顯示名稱（如「Bash 專家」）
  icon: string;
  type: 'bash' | 'explore' | 'plan' | 'general' | 'custom';

  // RPG 屬性
  level: number; // 1-5
  job: string; // 職業（如「系統工程師」）
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;

  // 專長和技能
  specialties: string[]; // 專長列表
  skills: SubagentSkill[]; // 技能列表

  // 召喚相關
  summonCost: number; // MP 消耗
  isActive: boolean; // 是否已召喚

  // 使用統計
  usageCount: number;
  lastUsed?: Date;

  // 配置
  config?: SubagentConfig;

  // 元數據
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subagent 技能
 */
interface SubagentSkill {
  id: string;
  name: string;
  icon: string;
  mpCost: number;
  cooldown: number;
  description: string;
  effect: SkillEffect[];
}

/**
 * Subagent 配置
 */
interface SubagentConfig {
  model?: string; // 使用的模型
  maxTurns?: number;
  allowedTools?: string[];
  [key: string]: any;
}

/**
 * 隊伍配置
 */
interface TeamConfig {
  activeSubagents: string[]; // 當前隊伍的 Subagent ID
  defaultSubagent?: string; // 默認召喚的 Subagent
  autoSummon: boolean; // 戰鬥開始時自動召喚
  prioritizeHighLevel: boolean; // 優先使用高等級傭兵
  autoReplenishMP: boolean; // 自動補充 MP
}
```

---

### Achievement 數據結構

```typescript
/**
 * 成就數據結構
 */
interface Achievement {
  // 基本資訊
  id: string;
  name: string;
  icon: string;
  description: string;
  category: AchievementCategory;

  // 狀態
  unlocked: boolean;
  progress: number; // 當前進度
  target: number; // 目標值
  hidden: boolean; // 是否為隱藏成就

  // 條件
  conditions: AchievementCondition[];

  // 獎勵
  reward: AchievementReward;
  rewardClaimed: boolean;

  // 時間
  unlockedAt?: Date;
  createdAt: Date;
}

/**
 * 成就分類
 */
type AchievementCategory =
  | 'battle' // 戰鬥成就
  | 'skill' // 技能成就
  | 'exploration' // 探索成就
  | 'special' // 特殊成就
  | 'level'; // 等級成就

/**
 * 成就條件
 */
interface AchievementCondition {
  type: string; // 'battle-count' | 'skill-usage' | 'level' | 'win-streak' 等
  target: number;
  current: number;
  description: string;
}

/**
 * 成就獎勵
 */
interface AchievementReward {
  type: 'skill' | 'summon' | 'gold' | 'item' | 'title';
  value: string | number; // 獎勵的 ID 或數量
  name: string;
  description: string;
}

/**
 * 收藏品（召喚獸圖鑑）
 */
interface Collectible {
  id: string;
  name: string;
  icon: string;
  category: 'fire' | 'water' | 'earth' | 'wind' | 'special';
  unlocked: boolean;
  unlockedAt?: Date;
  description: string;
  unlockCondition?: string;
}
```

---

### Bank 數據結構

```typescript
/**
 * 金幣交易記錄
 */
interface GoldTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  source: string; // '戰鬥獎勵' | '成就獎勵' | '技能解鎖' 等
  description: string;
  timestamp: Date;
}

/**
 * 模型成本記錄
 */
interface ModelCostRecord {
  id: string;
  model: 'claude' | 'gemini' | 'other';
  usageCount: number;
  cost: number; // 美元
  timestamp: Date;
  context?: string; // 使用上下文（戰鬥、探索等）
}

/**
 * 預算配置
 */
interface BudgetConfig {
  // AI 模型預算
  aiModelDailyBudget: number; // 美元
  aiModelOnExceed: 'switch' | 'stop' | 'warn';
  aiModelPreferredCheapModel: string;

  // 金幣預算
  goldDailyBudget: number;
  goldAllowOverdraft: boolean;
  goldMaxOverdraft: number;
}

/**
 * 資源統計
 */
interface ResourceStats {
  // 金幣統計
  currentGold: number;
  todayIncome: number;
  todayExpense: number;
  todayNetIncome: number;

  // 模型成本統計
  todayModelCost: number;
  todayModelBudget: number;
  todayModelUsageRate: number; // 0-1
  modelCostBreakdown: ModelCostBreakdown[];
  costSavings: number; // 節省的成本

  // 歷史數據
  last7DaysGold: number[];
  last7DaysCost: number[];
}

/**
 * 模型成本分解
 */
interface ModelCostBreakdown {
  model: string;
  usageCount: number;
  cost: number;
  percentage: number; // 占總成本的百分比
}
```

---

## 核心算法實現

### 技能升級算法

```typescript
/**
 * 技能升級成本計算
 * 使用指數增長公式: cost = basePrice * 1.5^(level - 1)
 */
function calculateUpgradeCost(basePrice: number, currentLevel: number): number {
  return Math.floor(basePrice * Math.pow(1.5, currentLevel - 1));
}

/**
 * 升級效果計算
 */
function calculateUpgradeEffects(skill: Skill, targetLevel: number): UpgradeEffectSet {
  const levelDiff = targetLevel - 1; // 從 Lv.1 開始計算差異

  return {
    mpReduction: Math.floor(skill.originalMpCost * 0.05 * levelDiff),
    cooldownReduction: Math.floor(skill.originalCooldown * 0.1 * levelDiff),
    damageIncrease: Math.floor(skill.originalDamage * 0.1 * levelDiff),
    newMpCost: Math.max(1, skill.originalMpCost - Math.floor(skill.originalMpCost * 0.05 * levelDiff)),
    newCooldown: Math.max(5, skill.originalCooldown - Math.floor(skill.originalCooldown * 0.1 * levelDiff)),
    newDamage: skill.originalDamage + Math.floor(skill.originalDamage * 0.1 * levelDiff)
  };
}

/**
 * 升級效果集合
 */
interface UpgradeEffectSet {
  mpReduction: number;
  cooldownReduction: number;
  damageIncrease: number;
  newMpCost: number;
  newCooldown: number;
  newDamage: number;
}
```

---

### 成就檢測系統

```typescript
/**
 * 成就檢測器
 * 監聽遊戲事件並檢查成就條件
 */
class AchievementDetector {
  private achievementRepository: AchievementRepository;
  private eventBus: EventBus;

  constructor(
    achievementRepository: AchievementRepository,
    eventBus: EventBus
  ) {
    this.achievementRepository = achievementRepository;
    this.eventBus = eventBus;
    this.registerEventHandlers();
  }

  /**
   * 註冊事件處理器
   */
  private registerEventHandlers(): void {
    // 戰鬥完成事件
    this.eventBus.on('battle-completed', (data: BattleResult) => {
      this.checkBattleAchievements(data);
    });

    // 技能使用事件
    this.eventBus.on('skill-used', (data: SkillUsageEvent) => {
      this.checkSkillAchievements(data);
    });

    // 等級提升事件
    this.eventBus.on('level-up', (data: LevelUpEvent) => {
      this.checkLevelAchievements(data);
    });

    // 商店訪問事件
    this.eventBus.on('shop-visited', (data: ShopVisitEvent) => {
      this.checkExplorationAchievements(data);
    });
  }

  /**
   * 檢查戰鬥相關成就
   */
  private checkBattleAchievements(result: BattleResult): void {
    const achievements = this.achievementRepository.findByCategory('battle');

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      achievement.conditions.forEach(condition => {
        switch (condition.type) {
          case 'battle-count':
            condition.current = result.totalBattles;
            break;
          case 'win-streak':
            condition.current = result.winStreak;
            break;
          case 'total-wins':
            condition.current = result.totalWins;
            break;
        }

        // 檢查是否達成
        if (this.checkConditions(achievement.conditions)) {
          this.unlockAchievement(achievement);
        }
      });
    });
  }

  /**
   * 檢查技能相關成就
   */
  private checkSkillAchievements(event: SkillUsageEvent): void {
    const achievements = this.achievementRepository.findByCategory('skill');

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      achievement.conditions.forEach(condition => {
        if (condition.type === 'skill-usage' && condition['skillId'] === event.skillId) {
          condition.current++;
        }
      });

      if (this.checkConditions(achievement.conditions)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  /**
   * 檢查等級相關成就
   */
  private checkLevelAchievements(event: LevelUpEvent): void {
    const achievements = this.achievementRepository.findByCategory('level');

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      achievement.conditions.forEach(condition => {
        if (condition.type === 'level') {
          condition.current = event.newLevel;
        }
      });

      if (this.checkConditions(achievement.conditions)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  /**
   * 檢查探索相關成就
   */
  private checkExplorationAchievements(event: ShopVisitEvent): void {
    const achievements = this.achievementRepository.findByCategory('exploration');

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      achievement.conditions.forEach(condition => {
        if (condition.type === 'shop-visit-all') {
          // 統計已訪問的商店數量
          condition.current = event.visitedShopsCount;
        }
      });

      if (this.checkConditions(achievement.conditions)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  /**
   * 檢查所有條件是否滿足
   */
  private checkConditions(conditions: AchievementCondition[]): boolean {
    return conditions.every(condition => condition.current >= condition.target);
  }

  /**
   * 解鎖成就
   */
  private unlockAchievement(achievement: Achievement): void {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date();
    this.achievementRepository.save(achievement);

    // 觸發成就解鎖事件
    this.eventBus.emit('achievement-unlocked', achievement);

    // 顯示通知
    this.showAchievementNotification(achievement);
  }

  /**
   * 顯示成就解鎖通知
   */
  private showAchievementNotification(achievement: Achievement): void {
    // UI 通知邏輯
    console.log(`🏆 成就解鎖: ${achievement.name}`);
    console.log(`   ${achievement.description}`);
    console.log(`   獎勵: ${achievement.reward.name}`);
  }
}
```

---

## 數據持久化

### DataStore 類

```typescript
/**
 * 數據存儲類
 * 負責所有數據的讀寫和持久化
 */
class DataStore {
  private basePath: string;
  private cache: Map<string, any> = new Map();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * 加載技能數據
   */
  loadSkills(): Skill[] {
    const filePath = path.join(this.basePath, 'skills.json');

    if (!fs.existsSync(filePath)) {
      return this.initializeDefaultSkills();
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const skills = JSON.parse(data);
    this.cache.set('skills', skills);
    return skills;
  }

  /**
   * 保存技能數據
   */
  saveSkills(skills: Skill[]): void {
    const filePath = path.join(this.basePath, 'skills.json');
    fs.writeFileSync(filePath, JSON.stringify(skills, null, 2), 'utf-8');
    this.cache.set('skills', skills);
  }

  /**
   * 加載 MCP 工具數據
   */
  loadMCPTools(): MCPTool[] {
    const filePath = path.join(this.basePath, 'mcp-tools.json');

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const tools = JSON.parse(data);
    this.cache.set('mcp-tools', tools);
    return tools;
  }

  /**
   * 保存 MCP 工具數據
   */
  saveMCPTools(tools: MCPTool[]): void {
    const filePath = path.join(this.basePath, 'mcp-tools.json');
    fs.writeFileSync(filePath, JSON.stringify(tools, null, 2), 'utf-8');
    this.cache.set('mcp-tools', tools);
  }

  /**
   * 加載成就數據
   */
  loadAchievements(): Achievement[] {
    const filePath = path.join(this.basePath, 'achievements.json');

    if (!fs.existsSync(filePath)) {
      return this.initializeDefaultAchievements();
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const achievements = JSON.parse(data);
    this.cache.set('achievements', achievements);
    return achievements;
  }

  /**
   * 保存成就數據
   */
  saveAchievements(achievements: Achievement[]): void {
    const filePath = path.join(this.basePath, 'achievements.json');
    fs.writeFileSync(filePath, JSON.stringify(achievements, null, 2), 'utf-8');
    this.cache.set('achievements', achievements);
  }

  /**
   * 加載金幣交易記錄
   */
  loadGoldTransactions(period?: { start: Date; end: Date }): GoldTransaction[] {
    // 可以使用 SQLite 存儲大量交易記錄
    // 這裡簡化為 JSON 文件
    const filePath = path.join(this.basePath, 'gold-transactions.json');

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    let transactions = JSON.parse(data);

    if (period) {
      transactions = transactions.filter((t: GoldTransaction) => {
        const timestamp = new Date(t.timestamp);
        return timestamp >= period.start && timestamp <= period.end;
      });
    }

    return transactions;
  }

  /**
   * 保存金幣交易記錄
   */
  saveGoldTransaction(transaction: GoldTransaction): void {
    const transactions = this.loadGoldTransactions();
    transactions.push(transaction);

    const filePath = path.join(this.basePath, 'gold-transactions.json');
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2), 'utf-8');
  }

  /**
   * 初始化默認技能
   */
  private initializeDefaultSkills(): Skill[] {
    const defaultSkills: Skill[] = [
      {
        id: 'commit',
        name: '版本封印術',
        icon: '📦',
        description: '將代碼封印至版本庫，保護你的成果',
        command: '/commit',
        type: 'official',
        source: 'claude-code',
        unlocked: true,
        level: 1,
        maxLevel: 5,
        mpCost: 8,
        originalMpCost: 8,
        cooldown: 45,
        originalCooldown: 45,
        damage: 30,
        originalDamage: 30,
        baseUpgradeCost: 50,
        usageCount: 0,
        successCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 更多默認技能...
    ];

    this.saveSkills(defaultSkills);
    return defaultSkills;
  }

  /**
   * 初始化默認成就
   */
  private initializeDefaultAchievements(): Achievement[] {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-battle',
        name: '初出茅廬',
        icon: '🌟',
        description: '完成首次戰鬥',
        category: 'battle',
        unlocked: false,
        progress: 0,
        target: 1,
        hidden: false,
        conditions: [
          {
            type: 'battle-count',
            target: 1,
            current: 0,
            description: '完成 1 次戰鬥'
          }
        ],
        reward: {
          type: 'skill',
          value: 'quick-fix',
          name: '快速修復',
          description: '獲得技能「快速修復」'
        },
        rewardClaimed: false,
        createdAt: new Date()
      },
      // 更多默認成就...
    ];

    this.saveAchievements(defaultAchievements);
    return defaultAchievements;
  }
}
```

---

## API 設計

### REST API 端點

```typescript
/**
 * 商店 API 路由
 */
class ShopAPI {
  private router: Router;
  private shopManager: ShopManager;
  private skillShop: SkillShop;

  constructor(shopManager: ShopManager, skillShop: SkillShop) {
    this.router = Router();
    this.shopManager = shopManager;
    this.skillShop = skillShop;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 商店導航
    this.router.get('/shops', this.getShops.bind(this));
    this.router.post('/shops/:shopType/enter', this.enterShop.bind(this));
    this.router.post('/shops/exit', this.exitShop.bind(this));

    // 技能商店
    this.router.get('/skills', this.getSkills.bind(this));
    this.router.get('/skills/:skillId', this.getSkillDetail.bind(this));
    this.router.post('/skills/:skillId/unlock', this.unlockSkill.bind(this));
    this.router.post('/skills/:skillId/upgrade', this.upgradeSkill.bind(this));

    // 工匠鋪
    this.router.post('/skills/create', this.createCustomSkill.bind(this));
    this.router.put('/skills/:skillId', this.updateCustomSkill.bind(this));
    this.router.get('/skill-templates', this.getSkillTemplates.bind(this));

    // MCP 圖書館
    this.router.get('/mcp-tools', this.getMCPTools.bind(this));
    this.router.get('/mcp-tools/:toolId', this.getMCPToolDetail.bind(this));
    this.router.post('/mcp-tools/:toolId/install', this.installMCPTool.bind(this));
    this.router.post('/mcp-tools/:toolId/uninstall', this.uninstallMCPTool.bind(this));
    this.router.put('/mcp-tools/:toolId/config', this.configureMCPTool.bind(this));

    // 傭兵公會
    this.router.get('/subagents', this.getSubagents.bind(this));
    this.router.get('/subagents/:subagentId', this.getSubagentDetail.bind(this));
    this.router.post('/subagents/:subagentId/summon', this.summonSubagent.bind(this));
    this.router.get('/team', this.getTeamConfig.bind(this));
    this.router.put('/team', this.updateTeamConfig.bind(this));

    // 寶物庫
    this.router.get('/achievements', this.getAchievements.bind(this));
    this.router.post('/achievements/:achievementId/claim', this.claimAchievement.bind(this));
    this.router.get('/collectibles', this.getCollectibles.bind(this));

    // 錢莊
    this.router.get('/bank/stats', this.getResourceStats.bind(this));
    this.router.get('/bank/transactions', this.getTransactions.bind(this));
    this.router.get('/bank/budget', this.getBudgetConfig.bind(this));
    this.router.put('/bank/budget', this.updateBudgetConfig.bind(this));
  }

  // API 處理器實現...
  private async getSkills(req: Request, res: Response): Promise<void> {
    const filter = req.query as SkillFilter;
    const skills = this.skillShop.getSkills(filter);
    res.json({ success: true, data: skills });
  }

  private async unlockSkill(req: Request, res: Response): Promise<void> {
    const { skillId } = req.params;
    const result = await this.skillShop.unlockSkill(skillId);
    res.json(result);
  }

  // ... 其他 API 處理器
}
```

---

## 與戰鬥系統整合

### 技能執行集成

```typescript
/**
 * 技能執行器
 * 將商店中的技能與戰鬥系統集成
 */
class SkillExecutor {
  private skillRepository: SkillRepository;
  private battleSystem: BattleSystem;

  /**
   * 執行技能
   */
  async executeSkill(skillId: string, context: BattleContext): Promise<SkillExecutionResult> {
    const skill = this.skillRepository.findById(skillId);

    if (!skill || !skill.unlocked) {
      return { success: false, error: '技能未解鎖' };
    }

    // 檢查 MP
    if (context.currentMP < skill.mpCost) {
      return { success: false, error: 'MP 不足' };
    }

    // 檢查冷卻
    if (this.isOnCooldown(skill)) {
      return { success: false, error: '技能冷卻中' };
    }

    // 扣除 MP
    context.currentMP -= skill.mpCost;

    // 執行技能
    const result = await this.performSkillAction(skill, context);

    // 記錄統計
    this.recordSkillUsage(skill, result.success);

    // 啟動冷卻
    this.startCooldown(skill);

    return result;
  }

  /**
   * 執行技能動作
   */
  private async performSkillAction(
    skill: Skill,
    context: BattleContext
  ): Promise<SkillExecutionResult> {
    // 造成傷害
    const damage = this.calculateDamage(skill, context);
    this.battleSystem.dealDamage(damage);

    // 應用特殊效果
    if (skill.effects) {
      for (const effect of skill.effects) {
        await this.applyEffect(effect, context);
      }
    }

    return {
      success: true,
      damage,
      effects: skill.effects
    };
  }

  /**
   * 計算傷害
   */
  private calculateDamage(skill: Skill, context: BattleContext): number {
    let damage = skill.damage;

    // 考慮角色攻擊力加成
    damage += Math.floor(damage * context.attackBonus);

    // 考慮 Buff 加成
    if (context.buffs.includes('power-up')) {
      damage = Math.floor(damage * 1.2);
    }

    return damage;
  }

  /**
   * 應用效果
   */
  private async applyEffect(effect: SkillEffect, context: BattleContext): Promise<void> {
    // 檢查觸發機率
    if (effect.probability && Math.random() > effect.probability) {
      return;
    }

    switch (effect.type) {
      case 'buff':
        this.battleSystem.addBuff(effect.name, effect.duration || 30);
        break;
      case 'heal':
        this.battleSystem.heal(effect.value);
        break;
      case 'summon':
        this.battleSystem.summonCompanion(effect.name);
        break;
      case 'dot':
        this.battleSystem.applyDoT(effect.value, effect.duration || 10);
        break;
    }
  }

  /**
   * 記錄技能使用
   */
  private recordSkillUsage(skill: Skill, success: boolean): void {
    skill.usageCount++;
    if (success) {
      skill.successCount++;
    }
    skill.lastUsed = new Date();
    this.skillRepository.save(skill);
  }
}
```

---

## 測試策略

### 單元測試

```typescript
describe('SkillShop', () => {
  let skillShop: SkillShop;
  let skillRepository: SkillRepository;

  beforeEach(() => {
    skillRepository = new InMemorySkillRepository();
    skillShop = new SkillShop(skillRepository);
  });

  describe('unlockSkill', () => {
    it('should unlock skill when requirements are met', async () => {
      // 安排
      const skill = createTestSkill({
        id: 'test-skill',
        unlocked: false,
        unlockCost: 100,
        requiredLevel: 5
      });
      skillRepository.save(skill);
      skillShop.setPlayerLevel(10);
      skillShop.setGold(200);

      // 執行
      const result = await skillShop.unlockSkill('test-skill');

      // 斷言
      expect(result.success).toBe(true);
      expect(skill.unlocked).toBe(true);
      expect(skillShop.getGold()).toBe(100);
    });

    it('should fail when gold is insufficient', async () => {
      const skill = createTestSkill({
        id: 'test-skill',
        unlocked: false,
        unlockCost: 100
      });
      skillRepository.save(skill);
      skillShop.setGold(50);

      const result = await skillShop.unlockSkill('test-skill');

      expect(result.success).toBe(false);
      expect(result.error).toContain('金幣不足');
    });
  });

  describe('upgradeSkill', () => {
    it('should upgrade skill and apply effects', async () => {
      const skill = createTestSkill({
        id: 'test-skill',
        unlocked: true,
        level: 1,
        mpCost: 10,
        originalMpCost: 10
      });
      skillRepository.save(skill);
      skillShop.setGold(100);

      const result = await skillShop.upgradeSkill('test-skill');

      expect(result.success).toBe(true);
      expect(skill.level).toBe(2);
      expect(skill.mpCost).toBeLessThan(10);
    });
  });
});
```

### 集成測試

```typescript
describe('Shop System Integration', () => {
  it('should complete full skill unlock flow', async () => {
    // 1. 進入技能商店
    shopManager.enterShop('skills-shop');

    // 2. 查看技能列表
    const skills = skillShop.getSkills({ unlocked: false });
    expect(skills.length).toBeGreaterThan(0);

    // 3. 解鎖技能
    const targetSkill = skills[0];
    const unlockResult = await skillShop.unlockSkill(targetSkill.id);
    expect(unlockResult.success).toBe(true);

    // 4. 在戰鬥中使用技能
    const battleContext = createTestBattleContext();
    const executeResult = await skillExecutor.executeSkill(
      targetSkill.id,
      battleContext
    );
    expect(executeResult.success).toBe(true);

    // 5. 檢查成就
    const achievements = achievementDetector.checkAchievements();
    expect(achievements.some(a => a.id === 'first-skill-unlock')).toBe(true);
  });
});
```

---

## 性能優化

### 數據緩存

```typescript
/**
 * 緩存管理器
 */
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 分鐘

  /**
   * 獲取緩存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 檢查是否過期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * 設置緩存
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 清除緩存
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

interface CacheEntry {
  value: any;
  timestamp: number;
}
```

### 懶加載

```typescript
/**
 * 技能列表懶加載
 */
class LazySkillLoader {
  private pageSize: number = 20;

  /**
   * 加載技能頁面
   */
  loadPage(page: number, filter?: SkillFilter): SkillPage {
    const allSkills = this.skillRepository.findAll();
    const filteredSkills = filter
      ? this.applyFilter(allSkills, filter)
      : allSkills;

    const start = page * this.pageSize;
    const end = start + this.pageSize;
    const skills = filteredSkills.slice(start, end);

    return {
      skills,
      page,
      pageSize: this.pageSize,
      totalCount: filteredSkills.length,
      hasMore: end < filteredSkills.length
    };
  }
}

interface SkillPage {
  skills: Skill[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}
```

---

## 部署和監控

### 錯誤處理

```typescript
/**
 * 統一錯誤處理
 */
class ShopErrorHandler {
  handleError(error: Error, context: string): void {
    console.error(`[Shop System Error] ${context}:`, error);

    // 記錄錯誤日誌
    this.logError(error, context);

    // 顯示用戶友好的錯誤消息
    this.showUserError(this.getUserFriendlyMessage(error));
  }

  private getUserFriendlyMessage(error: Error): string {
    if (error.message.includes('insufficient gold')) {
      return '金幣不足，無法完成操作';
    }
    if (error.message.includes('skill not found')) {
      return '技能不存在';
    }
    return '操作失敗，請稍後重試';
  }

  private logError(error: Error, context: string): void {
    // 可以集成日誌服務（如 Sentry）
    // sentry.captureException(error, { tags: { context } });
  }

  private showUserError(message: string): void {
    // 顯示 UI 錯誤提示
  }
}
```

---

**版本**: v1.0
**最後更新**: 2026-02-05
