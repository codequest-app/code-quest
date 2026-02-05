# RPG-CLI 功能總覽

**版本**: v2.0
**日期**: 2026-02-05
**狀態**: 設計完成，待實作

---

## 📋 目錄

1. [系統架構](#系統架構)
2. [核心功能](#核心功能)
3. [遊戲化系統](#遊戲化系統)
4. [戰鬥系統](#戰鬥系統)
5. [夥伴系統](#夥伴系統)
6. [召喚獸系統](#召喚獸系統)
7. [進階功能](#進階功能)
8. [開發路線圖](#開發路線圖)

---

## 系統架構

### 三層架構設計

```
┌─────────────────────────────────────┐
│   UI Layer (React + TypeScript)     │  ← 遊戲化介面
│   - HP/MP/經驗值/等級視覺化          │
│   - 戰鬥畫面                         │
│   - 技能施放動畫                     │
└──────────────┬──────────────────────┘
               │ WebSocket
┌──────────────▼──────────────────────┐
│   Bridge Layer (Node.js)            │  ← 協調與遊戲邏輯
│   - 追蹤 Skill/Subagent 使用         │
│   - 遊戲引擎 (GameEngine)            │
│   - 戰鬥管理器 (BattleManager)       │
│   - 敵人生成器 (EnemyGenerator)      │
└──────────────┬──────────────────────┘
               │ child_process
┌──────────────▼──────────────────────┐
│   Claude Code CLI                   │  ← 標準 AI 功能
│   - 官方格式 Skills                  │
│   - 標準 Subagents                   │
│   - MCP 工具整合                     │
└─────────────────────────────────────┘
```

### 技術棧

**前端**:
- React 18 + TypeScript
- Vite (構建工具)
- Tailwind CSS (Pixel Art 風格)
- Framer Motion (動畫)
- Zustand (狀態管理)
- WebSocket Client

**後端**:
- Node.js 18+
- Express (API 服務)
- ws (WebSocket Server)
- child_process (CLI 整合)

---

## 核心功能

### 1. Claude Code CLI 整合

**描述**: 將 Claude Code CLI 包裝為後端服務

**功能**:
- ✅ 啟動 Claude Code CLI
- ✅ 捕獲 stdout/stderr
- ✅ 雙向通訊 (輸入/輸出)
- ✅ Streaming 支援
- ✅ 錯誤處理與重啟
- ✅ Session 管理

**技術實作**:
```javascript
// bridge/index.js
const claudeProcess = spawn('claude', ['code'], {
  stdio: ['pipe', 'pipe', 'pipe']
});
```

### 2. WebSocket 實時通訊

**描述**: Bridge 與 UI 之間的實時雙向通訊

**功能**:
- ✅ 訊息廣播 (AI 回應)
- ✅ 事件推送 (技能施放、戰鬥開始)
- ✅ 狀態同步 (HP/MP/經驗值)
- ✅ 多客戶端支援

**事件類型**:
```javascript
// UI → Bridge
- user_message        // 用戶輸入
- skill_cast          // 施放技能
- agent_summon        // 召喚 Agent

// Bridge → UI
- ai_response         // AI 回應
- player_state_update // 玩家狀態更新
- battle_start        // 戰鬥開始
- skill_cooldown      // 技能冷卻
- level_up            // 升級通知
```

### 3. 官方格式 Skills

**描述**: 符合 Claude Code 官方規範的技能系統

**位置**: `~/.claude/skills/`

**核心技能** (5個):

| Skill | 圖標 | MP | 冷卻 | 描述 |
|-------|------|-----|------|------|
| code-generator | ⚔️ | 15 | 60s | 快速生成程式碼 |
| code-reviewer | 🔍 | 20 | 90s | 審查代碼品質 |
| doc-writer | 📜 | 10 | 45s | 撰寫技術文檔 |
| debug-helper | 🐛 | 25 | 120s | 協助除錯問題 |
| test-generator | 🧪 | 18 | 75s | 生成單元測試 |

**Skill 格式**:
```yaml
---
name: code-generator
description: 根據需求快速生成高品質程式碼
allowed-tools: Bash, Read, Write
---

# 代碼生成器
[Skill 實作內容...]
```

### 4. 對話介面

**描述**: RPG 風格的 AI 對話介面

**功能**:
- ✅ 訊息顯示 (打字機效果)
- ✅ Markdown 渲染
- ✅ 代碼語法高亮
- ✅ 複製/收藏功能
- ✅ 對話歷史
- ✅ 多行輸入支援

**UI 元素**:
- 頂部狀態列 (HP/MP/等級/金幣)
- 對話視窗 (AI 回應區)
- 輸入框 (Shift+Enter 換行)
- 快捷技能列

---

## 遊戲化系統

### 1. 玩家屬性系統

**描述**: RPG 風格的角色屬性

**屬性**:
```typescript
interface Player {
  // 基本資訊
  name: string;              // 冒險者
  level: number;             // 等級 (1-50)

  // 資源
  hp: number;                // 生命值 (當前)
  maxHp: number;             // 生命值 (上限)
  mp: number;                // 魔力值 (當前)
  maxMp: number;             // 魔力值 (上限)

  // 經驗與金幣
  exp: number;               // 當前經驗值
  expToNextLevel: number;    // 升級所需經驗
  gold: number;              // 金幣

  // 統計
  totalDialogues: number;    // 總對話次數
  totalTokens: number;       // 總 Token 使用
  skillsUnlocked: string[];  // 已解鎖技能
}
```

**公式**:
```javascript
// 升級所需經驗
expToNextLevel = 100 * Math.pow(1.5, level - 1);

// 等級提升獎勵
onLevelUp() {
  maxHp += 10;
  maxMp += 10;
  unlockNewSkill();  // 特定等級解鎖新技能
}

// MP 自動恢復
mpRegen = {
  outOfBattle: 1,    // 每秒 +1 MP
  inBattle: 0.1      // 每秒 +0.1 MP
};
```

### 2. Metadata 驅動設計

**描述**: 將 RPG 元素儲存在 JSON 配置文件中

**配置文件**:

#### `rpg-config/skill-metadata.json`
```json
{
  "code-generator": {
    "displayName": "代碼生成術",
    "icon": "⚔️",
    "type": "attack",
    "category": "basic",
    "element": "creation",
    "cost": { "mp": 15 },
    "cooldown": 60,
    "rewards": { "exp": 20, "gold": 10 },
    "requirements": { "level": 1 },
    "ui": {
      "color": "#ff6b6b",
      "animation": "slash"
    }
  }
}
```

#### `rpg-config/agent-metadata.json`
```json
{
  "code-guardian": {
    "displayName": "代碼守護者",
    "characterName": "CodeGuard",
    "avatar": "🛡️",
    "role": "tank",
    "summonCost": { "mp": 30, "cooldown": 300 },
    "baseStats": {
      "hp": 150,
      "mp": 100,
      "attack": 60,
      "defense": 90,
      "speed": 50
    }
  }
}
```

### 3. 技能冷卻系統

**描述**: 技能使用後需要冷卻時間

**實作**:
```javascript
// bridge/game-engine.js
class GameEngine {
  constructor() {
    this.skillCooldowns = new Map();  // skillId → endTime
  }

  canUseSkill(skillId) {
    const now = Date.now();
    const cooldownEnd = this.skillCooldowns.get(skillId) || 0;

    if (now < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - now) / 1000);
      return {
        allowed: false,
        remaining: `${remaining}秒`
      };
    }

    return { allowed: true };
  }

  startCooldown(skillId, duration) {
    this.skillCooldowns.set(
      skillId,
      Date.now() + duration * 1000
    );
  }
}
```

### 4. 經驗值與獎勵

**描述**: 完成任務獲得經驗與金幣

**獎勵來源**:
- ✅ 使用 Skill (+經驗 +金幣)
- ✅ 召喚 Agent (+經驗)
- ✅ 完成對話 (+經驗)
- ✅ 戰鬥勝利 (+經驗 +金幣，倍率加成)
- ✅ 觸發組合技 (+額外獎勵)

---

## 戰鬥系統

### 1. 敵人生成系統

**描述**: 根據 Prompt 複雜度自動生成敵人

**敵人生成器**:
```javascript
class EnemyGenerator {
  generateEnemy(prompt) {
    const complexity = this.analyzeComplexity(prompt);
    const category = this.categorizeTask(prompt);

    return {
      name: this.generateName(category, complexity),
      level: complexity.level,        // 1-15
      hp: complexity.level * 100 * enemyType.hpMultiplier,
      weaknesses: enemyType.weaknesses,
      resistances: enemyType.resistances
    };
  }
}
```

**複雜度分析**:
- 長度因素 (prompt 長度)
- 關鍵字複雜度 ('architecture', 'refactor', 'optimize')
- 多步驟任務偵測
- 技術棧數量

**敵人類型** (7種):

| 類型 | 圖標 | HP倍率 | 弱點技能 | 特殊機制 |
|------|------|--------|----------|----------|
| code-task | 💻 | 1.0 | code-generator, code-reviewer | - |
| bug-hunt | 🐛 | 1.5 | debug-helper, test-generator | counter_attack |
| architecture | 🏰 | 2.0 | code-reviewer | multi_phase |
| documentation | 📜 | 0.8 | doc-writer | - |
| testing | 🧪 | 1.2 | test-generator | - |
| optimization | ⚡ | 1.8 | code-reviewer, debug-helper | speed_boost |
| general | ❓ | 1.0 | - | - |

### 2. 戰鬥管理器

**描述**: 回合制戰鬥流程控制

**戰鬥流程**:
```
用戶輸入 Prompt
    ↓
生成敵人 (根據複雜度)
    ↓
顯示敵人資訊 (名稱、等級、HP、弱點)
    ↓
[玩家回合]
├─ 施放 Skill → 計算傷害 → 扣除敵人 HP
├─ 召喚 Agent → 協同攻擊
└─ 使用道具 (未來)
    ↓
[AI 處理中] (Claude Code 執行)
    ↓
[敵人回合] (可選)
├─ 簡單敵人: 無反擊
├─ 精英敵人: 反擊 (消耗玩家 MP)
└─ Boss: 特殊攻擊
    ↓
檢查戰鬥結束
├─ 敵人 HP = 0 → 勝利 → 獎勵
└─ 繼續戰鬥
```

### 3. 傷害計算系統

**描述**: 基於技能、相性、弱點的傷害計算

**公式**:
```javascript
// 基礎傷害
baseDamage = 100 + (skillMetadata.cost.mp * 3) + (player.level * 10);

// 相性倍率
affinityMultiplier = affinity.getMultiplier(skill, enemy.type);
// 例: code-reviewer vs bug-hunt = 1.5x

// 弱點倍率
weakMultiplier = enemy.weaknesses.includes(skill) ? 1.5 : 1.0;

// 抗性倍率
resistMultiplier = enemy.resistances.includes(skill) ? 0.5 : 1.0;

// 最終傷害
totalDamage = baseDamage * affinityMultiplier * weakMultiplier * resistMultiplier;
```

### 4. 敵人 AI 系統

**描述**: 不同等級敵人的行為模式

**AI 類型**:

| AI 類型 | 目標優先順序 | 攻擊夥伴機率 | 特殊能力 |
|---------|-------------|-------------|----------|
| simple | ['player'] | 0% | 只攻擊玩家 |
| elite | ['lowest_defense', 'player'] | 30% | 優先攻擊低防禦目標 |
| boss | ['lowest_hp', 'highest_threat', 'player'] | 50% | 範圍攻擊 (AOE) |

---

## 夥伴系統

### 1. Subagent → 戰鬥夥伴

**描述**: 將 Subagent 轉化為戰鬥夥伴，參與戰鬥

**夥伴屬性**:
```typescript
interface BattleCompanion {
  // 基本資訊
  agentName: string;          // 'code-guardian'
  characterName: string;       // 'CodeGuard'
  title: string;              // '代碼守護者'
  avatar: string;             // '🛡️'

  // 戰鬥屬性
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;              // 決定行動順序
  wisdom: number;

  // 技能
  skills: CompanionSkill[];
  passiveAbilities: string[];

  // 經驗
  experience: number;
  expToNextLevel: number;     // 100 * 1.3^(level-1)
}
```

**夥伴角色範例**:

| 夥伴 | 職業 | 特色 | 專屬技能 |
|------|------|------|----------|
| 🛡️ CodeGuard | Tank | 高防禦、護盾 | 安全掃描、守護之盾 |
| ⚡ Speedy | Attacker | 高速度、連擊 | 快速重構、性能爆發 |
| 📚 DocMaster | Support | 輔助、增益 | 知識共享、文檔治癒 |

### 2. 夥伴 AI 系統

**描述**: 夥伴自動行動的決策邏輯

**決策流程**:
```javascript
class CompanionAI {
  decideAction() {
    // 優先級 1: 緊急支援
    if (player.hp < player.maxHp * 0.3) {
      return this.findBestSupportSkill();
    }

    // 優先級 2: 攻擊弱點
    const effectiveSkills = this.findEffectiveSkills(enemy.type);
    if (effectiveSkills.length > 0) {
      return this.selectBestDamageSkill(effectiveSkills);
    }

    // 預設: 普通攻擊
    return this.basicAttack();
  }
}
```

### 3. 夥伴成長系統

**描述**: 夥伴可以升級、獲得經驗

**經驗來源**:
- 戰鬥勝利: +50 EXP
- 使用技能: +5 EXP
- 造成傷害: damage / 10 EXP
- 命中弱點: +20 EXP

**升級獎勵**:
```javascript
onLevelUp(companion) {
  companion.maxHp += 20;
  companion.maxMp += 15;
  companion.attack += 5;
  companion.defense += 5;
  companion.speed += 2;
  companion.wisdom += 5;

  // 特殊等級解鎖
  if (companion.level === 5) unlockUltimateSkill();
  if (companion.level === 10) unlockPassiveAbility();
}
```

### 4. MP 管理

**描述**: 夥伴 MP 獨立於玩家

**規則**:
- ❌ 戰鬥中不自動恢復
- ✅ 戰鬥結束完全恢復
- ✅ 技能消耗夥伴自己的 MP
- ✅ 初始 MP = maxMp

### 5. 槽位限制

**描述**: 最多同時召喚 2 個夥伴

```javascript
maxCompanions = 2;

canSummonCompanion() {
  if (activeCompanions.length >= 2) {
    return { error: '夥伴槽位已滿（最多2個）' };
  }
  if (player.mp < summonCost) {
    return { error: 'MP 不足' };
  }
  return { allowed: true };
}
```

---

## 召喚獸系統

### 1. 召喚獸 vs 夥伴

**對比**:

| 特性 | 戰鬥夥伴 | 召喚獸 |
|-----|---------|--------|
| 來源 | Subagent | Skill/道具/組合技/MCP |
| 持續時間 | 戰鬥全程 | 1-3回合或單次 |
| 成長性 | 有 | 無 |
| 槽位 | 最多2個 | 最多1個（獨立） |
| 用途 | 穩定支援 | 爆發/緊急 |

### 2. 召喚獸分類

#### 類型 1: 技能召喚獸

**範例**: 代碼之龍 (Code Dragon)

```json
{
  "summon-code-dragon": {
    "displayName": "代碼之龍",
    "icon": "🐉",
    "type": "offensive",
    "summonCost": { "mp": 80, "cooldown": 600 },
    "behavior": {
      "actionType": "immediate",
      "duration": 1
    },
    "skills": [{
      "name": "龍息",
      "effect": {
        "damage": "300 + player.level * 20",
        "effectiveness": {
          "code-task": 2.5,
          "architecture": 2.0
        }
      }
    }]
  }
}
```

#### 類型 2: 組合技召喚獸

**範例**: 不死鳥 (Phoenix)

**觸發**: 完成組合技時 50% 機率召喚

```json
{
  "combo-summon-phoenix": {
    "displayName": "不死鳥",
    "icon": "🔥🦅",
    "type": "support",
    "behavior": {
      "actionType": "automatic",
      "duration": 2
    },
    "skills": [{
      "name": "浴火重生",
      "effect": {
        "heal": { "player": 50, "companions": 30 },
        "revival": { "chance": 1.0, "hpPercent": 50 }
      }
    }]
  }
}
```

#### 類型 3: MCP 工具召喚獸

**範例**: 資料庫魔像 (Database Golem)

**觸發**: 使用 MCP 資料庫工具時自動召喚

#### 類型 4: 道具召喚獸

**範例**: 幫助精靈 (Helper Fairy)

**觸發**: 使用召喚道具

### 3. 行為類型

| 行為類型 | 說明 | 持續 | 範例 |
|---------|------|------|------|
| immediate | 召喚後立即施放技能並離去 | 1回合 | 代碼之龍 |
| automatic | 召喚後每回合自動施放技能 | 2-3回合 | 不死鳥、治癒精靈 |
| passive | 提供被動效果 | 3回合 | 資料庫魔像 |
| interactive | 等待玩家指令 | 2回合 | 時間魔導師 |

### 4. 槽位規則

```javascript
battleSlots: {
  companions: {
    max: 2,
    independent: false
  },
  summons: {
    max: 1,
    independent: true  // 與夥伴槽位獨立
  }
}

// 最大同時在場單位
maxUnits = player(1) + companions(2) + summon(1) = 4
```

---

## 進階功能

### 1. 組合技系統

**描述**: 連續使用特定技能觸發組合技

**組合範例**:

| 組合技 | 技能組合 | 效果 |
|--------|---------|------|
| 完美代碼鏈 | code-generator → code-reviewer → test-generator | 傷害 +50%, 額外 EXP +100 |
| 品質三重奏 | code-reviewer → debug-helper → test-generator | 無視抗性, Gold +50 |
| 文檔大師 | doc-writer → doc-writer → code-reviewer | MP 消耗 -50% |

**實作**:
```javascript
class ComboTracker {
  trackSkillUse(skillId) {
    this.recentSkills.push({
      skill: skillId,
      timestamp: Date.now()
    });

    // 檢查組合
    const combo = this.detectCombo(this.recentSkills);
    if (combo) {
      this.triggerCombo(combo);
    }
  }
}
```

### 2. 成就系統

**描述**: 完成特定條件解鎖成就

**成就分類**:
- 🏆 戰鬥成就: 擊敗100個敵人、首次擊敗Boss
- ⚔️ 技能成就: 使用特定技能50次、觸發組合技
- 📈 成長成就: 達到等級10、20、30、50
- 🎯 特殊成就: 無傷擊敗Boss、單回合造成1000+傷害

**獎勵**:
- 稱號解鎖
- 特殊圖標
- 金幣獎勵
- 經驗值加成

### 3. Worktree 平行世界系統

**描述**: Git Worktree 的 RPG 化包裝

**映射**:
- Worktree → 平行世界/時間線
- Branch → 任務線/劇情線
- Checkout → 傳送/切換世界
- Merge → 時空融合

**世界類型**:

| 世界 | 圖標 | MP 消耗 | 用途 |
|------|------|---------|------|
| 主世界 (main) | 🏰 | - | 穩定生產環境 |
| 冒險世界 (feature/*) | ⚔️ | 10 | 開發新功能 |
| 修復世界 (fix/*) | 🛡️ | 15 | Bug 修復 |
| 實驗世界 (experiment/*) | 🔮 | 5 | 技術實驗 |
| 緊急世界 (hotfix/*) | 🚨 | 20 | 緊急修復 |

**資源管理**:
- ✅ 使用全局 MP（非戰鬥 MP）
- ❌ 戰鬥中禁用 Worktree 操作
- ✅ 只能查看，不能操作

**操作**:
- 創建新世界: -10 MP
- 切換世界: -5 MP
- 合併世界: -20 MP
- 刪除世界: 免費

### 4. 持久化系統

**描述**: 保存玩家進度

**儲存內容**:
```json
{
  "player": {
    "name": "冒險者",
    "level": 5,
    "hp": 80,
    "maxHp": 100,
    "mp": 60,
    "maxMp": 100,
    "exp": 350,
    "gold": 1250
  },
  "skills": {
    "unlocked": ["code-generator", "code-reviewer"],
    "cooldowns": {
      "code-generator": 1675678900000
    }
  },
  "companions": {
    "code-guardian": {
      "level": 3,
      "experience": 150
    }
  },
  "achievements": ["first_battle", "level_5"],
  "stats": {
    "totalDialogues": 128,
    "totalBattles": 45,
    "battlesWon": 42
  }
}
```

**儲存位置**:
- LocalStorage (前端緩存)
- SQLite (可選，後端持久化)
- 雲端同步 (Phase 3 可選)

---

## 開發路線圖

### Phase 1: 核心基礎 (Week 1-2)

**目標**: 建立可運行的基礎系統

✅ **完成標準**:
- Bridge Layer 可啟動 Claude Code CLI
- React UI 可顯示對話
- WebSocket 實時通訊正常
- 創建 3-5 個官方格式 Skills
- 基本 HP/MP 顯示（固定值）

**不包含**: 動畫、遊戲邏輯、戰鬥系統

---

### Phase 2: 遊戲化核心 (Week 3-4)

**目標**: 添加 RPG 元素

✅ **完成標準**:
- Metadata 系統 (skill-metadata.json, agent-metadata.json)
- GameEngine 實作（MP 消耗、經驗值、冷卻）
- UI 更新（技能按鈕、進度條動畫）
- Agent 召喚基礎（偵測 Subagent 調用）
- MP 自動恢復機制

**不包含**: 戰鬥系統、夥伴系統

---

### Phase 2.5: 戰鬥系統擴展 (Week 5-6)

**目標**: 完整戰鬥體驗

✅ **完成標準**:
- EnemyGenerator (根據 Prompt 生成敵人)
- BattleManager (戰鬥流程管理)
- DamageCalculator (傷害計算、相性系統)
- 夥伴系統基礎 (Subagent → 戰鬥夥伴)
- 召喚獸基礎 (技能召喚獸)
- 戰鬥 UI (敵人顯示、戰鬥日誌、傷害數字)

**不包含**: 組合技、成就系統

---

### Phase 3: 進階功能 (Week 7-10)

**目標**: 完善系統與整合

✅ **完成標準**:
- 組合技系統
- 成就系統
- Worktree 平行世界整合
- 召喚獸完善（組合技召喚、MCP 召喚、道具召喚）
- 持久化系統 (LocalStorage + 可選 SQLite)
- 統計與排行榜
- UI 完善與優化

---

## 驗收標準總覽

### 基礎功能驗收

```bash
# 1. 啟動系統
npm run bridge    # Bridge Layer 啟動
npm run dev       # React UI 啟動

# 2. 對話測試
輸入: "請幫我寫一個 React 組件"
預期: AI 正常回應，對話顯示

# 3. 技能測試
點擊: "代碼生成術" 按鈕
預期:
  - MP 扣除 15
  - 技能進入冷卻 60 秒
  - AI 執行 code-generator skill
  - 完成後獲得 EXP +20, Gold +10

# 4. 升級測試
獲得足夠經驗值
預期:
  - 升級動畫播放
  - MaxHP +10, MaxMP +10
  - 等級顯示更新
```

### 戰鬥系統驗收

```bash
# 5. 戰鬥觸發
輸入: "幫我重構這段複雜的代碼..."
預期:
  - 生成敵人（等級 8+）
  - 顯示敵人 HP/弱點
  - 進入戰鬥畫面

# 6. 傷害計算
使用弱點技能攻擊 Bug 怪物
預期:
  - 傷害 ×1.5 倍率
  - 顯示 "弱點攻擊！"
  - 敵人 HP 減少

# 7. 戰鬥勝利
敵人 HP = 0
預期:
  - 勝利動畫
  - EXP/Gold 獎勵 (有倍率加成)
  - 戰鬥日誌記錄
```

### 夥伴系統驗收

```bash
# 8. 召喚夥伴
召喚 CodeGuard Agent
預期:
  - MP 扣除 30
  - 夥伴加入戰鬥
  - 顯示夥伴狀態列 (HP/MP)

# 9. 夥伴自動行動
戰鬥中輪到夥伴回合
預期:
  - 夥伴 AI 自動選擇技能
  - 施放技能 (扣除夥伴 MP)
  - 造成傷害或提供支援

# 10. 夥伴升級
夥伴獲得足夠經驗
預期:
  - 夥伴升級動畫
  - 屬性提升
  - 等級 5/10 解鎖新技能
```

---

## 關鍵設計原則

### 1. 分層架構
- UI 層只負責顯示
- Bridge 層處理遊戲邏輯
- Claude Code 保持官方標準

### 2. Metadata 驅動
- RPG 元素在 JSON 配置
- 易於擴展和調整
- 不侵入 Claude Code

### 3. 漸進增強
- Phase 1 可獨立運行
- 每個 Phase 增加功能
- 向後兼容

### 4. 官方格式優先
- Skills 嚴格遵守官方規範
- Subagents 使用標準格式
- 不修改 Claude Code 行為

---

**版本**: v2.0
**最後更新**: 2026-02-05
**維護者**: RPG-CLI Team
