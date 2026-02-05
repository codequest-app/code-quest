# RPG-CLI 功能規劃 v2.0

**基於**: RPG-CLI-Architecture-v2.md
**日期**: 2026-02-05
**原則**: 分層架構，官方格式，UI 遊戲化

---

## 實作策略總覽

```
Phase 1 (Week 1-2): Bridge + 基礎 UI + 標準 Skills
    ↓
Phase 2 (Week 3-4): 遊戲化系統 + Agent 召喚
    ↓
Phase 3 (Week 5-8): 進階功能 + 整合
```

---

## Phase 1: 核心基礎 (Week 1-2)

### 目標
建立可運行的基礎系統：Claude Code + Bridge + React UI

### 1.1 Bridge Layer 實作

**檔案**: `bridge/index.js`

```javascript
// ✅ Must Have
- [ ] 啟動 Claude Code CLI (child_process)
- [ ] 捕獲 stdout/stderr
- [ ] 轉發輸入到 Claude Code
- [ ] WebSocket server 建立
- [ ] 基礎訊息廣播

// 🔄 Nice to Have
- [ ] 錯誤處理與重啟
- [ ] 日誌記錄
```

**技術選擇**:
- Node.js 18+
- `ws` library for WebSocket
- `spawn` for child process

**驗收標準**:
```bash
node bridge/index.js
# 應該能啟動 Claude Code
# 應該能在終端看到 Claude 回應
# 應該能通過 WebSocket 連接
```

### 1.2 React UI 基礎

**檔案**: `ui/src/`

```javascript
// ✅ Must Have - 基本對話界面
- [ ] App.tsx - 主應用
- [ ] ChatWindow.tsx - 對話視窗
- [ ] MessageList.tsx - 訊息列表
- [ ] InputBar.tsx - 輸入框
- [ ] WebSocket hook (useWebSocket)

// ✅ Must Have - 玩家狀態
- [ ] PlayerStats.tsx - HP/MP/Lv 顯示
- [ ] ProgressBar.tsx - 進度條組件
- [ ] Zustand store (gameState)

// ⏸️ Skip for Now
- 動畫效果（Phase 2）
- Skill 按鈕（Phase 2）
```

**UI 框架**:
```bash
npm create vite@latest ui -- --template react-ts
npm install zustand framer-motion tailwindcss
npm install socket.io-client
```

**驗收標準**:
- 能顯示 Claude 回應（打字機效果可選）
- 能發送訊息到 Claude
- 顯示固定的 HP/MP/Lv（暫時不變化）

### 1.3 標準 Skills 創建

**目標**: 創建 3-5 個符合官方格式的 skills

**位置**: `~/.claude/skills/`

#### Skill 1: code-generator
```yaml
---
name: code-generator
description: 根據需求快速生成高品質程式碼。適合原型開發、函數實作、建立模板。
allowed-tools: Bash, Read, Write
---

# 代碼生成器

當用戶需要生成代碼時：

1. **理解需求**
   - 識別程式語言
   - 確認功能需求
   - 評估複雜度

2. **生成代碼**
   - 使用清晰的命名
   - 包含必要錯誤處理
   - 添加簡潔註解

3. **輸出說明**
   - 簡述代碼功能
   - 提供使用範例

保持代碼簡潔、可讀、可維護。
```

#### Skill 2: code-reviewer
```yaml
---
name: code-reviewer
description: 審查代碼品質、安全性和最佳實踐。適合代碼提交前的檢查。
allowed-tools: Read, Grep, Glob
---

# 代碼審查器

審查代碼時：

1. **掃描問題**
   - 安全漏洞（Critical）
   - 性能問題（High）
   - 代碼異味（Medium）
   - 風格問題（Low）

2. **提供反饋**
   - 標註嚴重程度
   - 說明問題所在
   - 提供修改建議
   - 附上代碼範例

3. **輸出格式**

\```
## 審查報告

### 🔴 Critical Issues
[列出關鍵問題...]

### 🟠 High Priority
[列出重要問題...]

### 建議
[總體改進建議...]
\```
```

#### Skill 3: doc-writer
```yaml
---
name: doc-writer
description: 撰寫清晰的技術文檔、API 說明、README。適合文檔化需求。
allowed-tools: Read, Write
---

# 文檔撰寫器

撰寫文檔時：

1. **結構組織**
   - 清晰的標題層級
   - 目錄（如需要）
   - 邏輯分段

2. **內容要素**
   - 簡潔的概述
   - 使用範例
   - API 參數說明
   - 常見問題

3. **格式規範**
   - Markdown 格式
   - 代碼高亮
   - 表格（如適用）

保持文檔簡潔、實用、易讀。
```

#### Skill 4: test-generator (Optional)
```yaml
---
name: test-generator
description: 為函數生成單元測試。包含正常情況、邊界條件、錯誤處理測試。
allowed-tools: Read, Write, Bash
---

# 測試生成器

生成測試時：

1. **分析函數**
   - 識別輸入參數
   - 理解預期行為
   - 找出邊界條件

2. **生成測試用例**
   - 正常情況測試
   - 邊界條件測試
   - 錯誤處理測試

3. **測試框架**
   - 使用專案現有框架（Jest/Mocha/等）
   - 清晰的測試描述
   - 適當的斷言

確保測試覆蓋率和可讀性。
```

#### Skill 5: debug-helper (Optional)
```yaml
---
name: debug-helper
description: 協助診斷和修復 bug。分析錯誤訊息、追蹤問題、提供解決方案。
allowed-tools: Read, Grep, Bash
---

# Debug 助手

協助除錯時：

1. **問題診斷**
   - 分析錯誤訊息
   - 檢查最近修改
   - 追蹤問題位置

2. **解決方案**
   - 說明根本原因
   - 提供修復代碼
   - 建議預防措施

3. **驗證**
   - 說明如何測試修復
   - 確認問題解決

專注於找出根本原因，而非症狀。
```

**檔案結構**:
```
~/.claude/skills/
├── code-generator/
│   └── SKILL.md
├── code-reviewer/
│   └── SKILL.md
├── doc-writer/
│   └── SKILL.md
├── test-generator/
│   └── SKILL.md
└── debug-helper/
    └── SKILL.md
```

**驗收標準**:
```bash
# 測試 skill 可用
/code-generator 建立一個計算 fibonacci 的函數

# 應該能：
# 1. Claude 載入 skill
# 2. 根據 skill 指令生成代碼
# 3. 提供使用說明
```

### 1.4 Phase 1 總結

**完成時應該有**:
- ✅ Bridge 能啟動 Claude Code
- ✅ React UI 能顯示對話
- ✅ WebSocket 通訊正常
- ✅ 3-5 個可用的標準 skills
- ✅ 基礎玩家狀態顯示（靜態）

**未實作**:
- ⏸️ MP 消耗計算
- ⏸️ 經驗值獎勵
- ⏸️ Skill 動畫
- ⏸️ Agent 召喚

---

## Phase 2: 遊戲化系統 (Week 3-4)

### 目標
添加 RPG 元素：MP 消耗、經驗值、等級、Skill 冷卻

### 2.1 Metadata 系統

**檔案**: `rpg-config/skill-metadata.json`

```json
{
  "code-generator": {
    "displayName": "代碼生成術",
    "displayNameEn": "Code Generator",
    "icon": "⚔️",
    "type": "attack",
    "category": "basic",
    "element": "creation",

    "cost": {
      "mp": 15
    },

    "cooldown": 60,

    "rewards": {
      "exp": 20,
      "gold": 10
    },

    "requirements": {
      "level": 1
    },

    "ui": {
      "color": "#ff6b6b",
      "animation": "slash",
      "sound": "skill_cast.mp3"
    },

    "description": "快速生成程式碼，適合原型開發",
    "flavorText": "將思緒化為代碼，創造數位世界的利刃"
  },

  "code-reviewer": {
    "displayName": "代碼審查術",
    "icon": "🔍",
    "type": "support",
    "category": "basic",
    "cost": { "mp": 20 },
    "cooldown": 90,
    "rewards": { "exp": 25, "gold": 15 },
    "requirements": { "level": 1 },
    "ui": {
      "color": "#4ecdc4",
      "animation": "scan"
    },
    "description": "深度審查代碼品質與安全性",
    "flavorText": "以慧眼識破代碼中的隱患"
  },

  "doc-writer": {
    "displayName": "文檔撰寫術",
    "icon": "📜",
    "type": "support",
    "category": "basic",
    "cost": { "mp": 10 },
    "cooldown": 45,
    "rewards": { "exp": 15, "gold": 8 },
    "requirements": { "level": 1 },
    "ui": {
      "color": "#95e1d3",
      "animation": "write"
    },
    "description": "撰寫清晰易懂的技術文檔",
    "flavorText": "以文字記錄知識，傳承智慧"
  }
}
```

### 2.2 Bridge Layer 遊戲邏輯

**檔案**: `bridge/game-engine.js`

```javascript
// ✅ Must Have
- [ ] 載入 skill-metadata.json
- [ ] 偵測 Skill tool 調用
- [ ] 檢查 MP 是否足夠
- [ ] 扣除 MP
- [ ] 啟動冷卻計時
- [ ] 發送 skill_cast 事件到 UI
- [ ] Skill 完成時給予獎勵
- [ ] 經驗值累積與等級計算
- [ ] MP 自動恢復 (每秒 +1)

// 🔄 Nice to Have
- [ ] 儲存/載入玩家狀態
- [ ] 冷卻持久化
```

**實作範例**:
```javascript
class GameEngine {
  constructor() {
    this.player = {
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      gold: 0
    };

    this.cooldowns = new Map(); // skillName -> endTime
    this.skillMetadata = require('../rpg-config/skill-metadata.json');
  }

  handleSkillCast(skillName) {
    const metadata = this.skillMetadata[skillName];
    if (!metadata) return { error: 'Unknown skill' };

    // 檢查等級
    if (this.player.level < metadata.requirements.level) {
      return { error: `需要等級 ${metadata.requirements.level}` };
    }

    // 檢查 MP
    if (this.player.mp < metadata.cost.mp) {
      return { error: 'MP 不足' };
    }

    // 檢查冷卻
    if (this.isOnCooldown(skillName)) {
      const remaining = this.getCooldownRemaining(skillName);
      return { error: `冷卻中 (${remaining}s)` };
    }

    // 扣除 MP
    this.player.mp -= metadata.cost.mp;

    // 啟動冷卻
    this.setCooldown(skillName, metadata.cooldown);

    return { success: true, metadata };
  }

  handleSkillComplete(skillName) {
    const metadata = this.skillMetadata[skillName];

    // 給予獎勵
    this.player.exp += metadata.rewards.exp;
    this.player.gold += metadata.rewards.gold;

    // 檢查升級
    while (this.player.exp >= this.player.expToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.player.level++;
    this.player.exp -= this.player.expToNextLevel;
    this.player.expToNextLevel = Math.floor(this.player.expToNextLevel * 1.5);

    // 提升基礎屬性
    this.player.maxHp += 10;
    this.player.maxMp += 10;
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
  }

  startMpRegen() {
    setInterval(() => {
      if (this.player.mp < this.player.maxMp) {
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
        this.broadcastPlayerState();
      }
    }, 1000);
  }
}
```

### 2.3 UI 遊戲化組件

```javascript
// ✅ Must Have
- [ ] SkillBar.tsx - 技能快捷欄
- [ ] SkillButton.tsx - 技能按鈕（含冷卻圓環）
- [ ] RewardPopup.tsx - 獎勵彈出提示
- [ ] LevelUpModal.tsx - 升級動畫
- [ ] useGameState hook - 遊戲狀態管理

// 🔄 Nice to Have
- [ ] SkillCastAnimation.tsx - 施放特效
- [ ] ParticleEffect.tsx - 粒子效果
```

**SkillButton 範例**:
```tsx
interface SkillButtonProps {
  skillName: string;
  metadata: SkillMetadata;
  onCast: () => void;
}

const SkillButton: React.FC<SkillButtonProps> = ({
  skillName,
  metadata,
  onCast
}) => {
  const { player, cooldowns } = useGameState();
  const cooldown = cooldowns.get(skillName);

  const isOnCooldown = cooldown && cooldown > Date.now();
  const canAfford = player.mp >= metadata.cost.mp;
  const canUse = !isOnCooldown && canAfford;

  return (
    <button
      className={`skill-button ${!canUse ? 'disabled' : ''}`}
      onClick={canUse ? onCast : undefined}
      title={metadata.description}
    >
      <div className="skill-icon">{metadata.icon}</div>
      <div className="skill-name">{metadata.displayName}</div>
      <div className="skill-cost">MP: {metadata.cost.mp}</div>

      {isOnCooldown && (
        <CooldownOverlay
          endTime={cooldown!}
          duration={metadata.cooldown}
        />
      )}
    </button>
  );
};
```

### 2.4 Agent 召喚系統

**創建 Subagents**:

**檔案**: `~/.claude/agents/code-guardian.md`

```markdown
---
name: code-guardian
description: 代碼審查專家，深度檢查品質、安全性、最佳實踐。適合重要功能發布前的全面審查。
tools: Read, Grep, Glob
model: sonnet
memory: user
---

# Code Guardian - 代碼守護者

你是經驗豐富的代碼審查專家，擁有多年審查經驗。

## 審查標準

### 🔴 Critical (必須修復)
- 安全漏洞：SQL Injection, XSS, CSRF 等
- 資料外洩風險
- 嚴重的邏輯錯誤

### 🟠 High (應該修復)
- 性能問題：N+1 查詢、記憶體洩漏
- 錯誤處理缺失
- 違反 SOLID 原則

### 🟡 Medium (建議修復)
- 命名不清晰
- 代碼重複
- 缺少註解

### 🟢 Low (可選改進)
- 格式不一致
- 次要風格問題

## 審查流程

1. **快速掃描**: 識別明顯問題
2. **深度分析**: 逐行審查關鍵部分
3. **提供建議**: 具體的修改方案和代碼範例

## 輸出格式

每個問題包含：
- 嚴重程度標籤
- 問題位置（檔案:行號）
- 問題說明
- 修改建議（含代碼）
- 風險說明

## Agent Memory

隨著審查經驗累積，記錄到你的 memory：
- 此專案常見的代碼模式
- 重複出現的問題類型
- 專案特定的最佳實踐
- 已解決問題的追蹤

定期更新 MEMORY.md，保持在 200 行內。
```

**Agent Metadata**:

**檔案**: `rpg-config/agent-metadata.json`

```json
{
  "code-guardian": {
    "characterName": "CodeGuard",
    "title": "代碼守護者",
    "titleEn": "Code Guardian",
    "avatar": "🛡️",
    "element": "guardian",
    "rarity": "rare",

    "summonCost": {
      "mp": 30,
      "cooldown": 300
    },

    "maintainCost": {
      "mpPerMinute": 5
    },

    "requirements": {
      "level": 5
    },

    "stats": {
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },

    "specialAbilities": [
      {
        "name": "OWASP 守護",
        "icon": "🔒",
        "description": "精通 OWASP Top 10，快速識別常見安全漏洞",
        "effect": "+30% 安全問題檢測率"
      },
      {
        "name": "品質之眼",
        "icon": "👁️",
        "description": "能看穿代碼異味和反模式",
        "effect": "+25% 代碼品質問題檢測"
      }
    ],

    "personality": "嚴謹、一絲不苟、追求完美",

    "quotes": {
      "summon": [
        "🛡️ CodeGuard 前來！讓我守護你的代碼！",
        "審查開始，任何漏洞都逃不過我的眼睛！",
        "召喚我是明智的選擇，我會確保代碼無懈可擊。"
      ],
      "working": [
        "正在掃描...發現了一些值得注意的地方。",
        "這段代碼有改進空間...",
        "讓我仔細檢查安全性..."
      ],
      "complete": [
        "審查完畢，發現了 {count} 個需要注意的地方。",
        "守護任務完成，你的代碼現在更安全了。",
        "我已盡職，接下來就看你的了。"
      ]
    },

    "ui": {
      "color": "#4a90e2",
      "summonAnimation": "portal-blue",
      "idleAnimation": "shield-pulse"
    }
  }
}
```

**Bridge 偵測 Agent**:
```javascript
handleAgentSummon(agentName) {
  const metadata = this.agentMetadata[agentName];

  // 檢查 MP
  if (this.player.mp < metadata.summonCost.mp) {
    return { error: 'MP 不足' };
  }

  // 檢查冷卻
  if (this.isAgentOnCooldown(agentName)) {
    return { error: '召喚冷卻中' };
  }

  // 扣除 MP
  this.player.mp -= metadata.summonCost.mp;

  // 記錄活躍 agent
  this.activeAgents.set(agentName, {
    summonedAt: Date.now(),
    metadata
  });

  // 啟動維持費用
  this.startMaintainCost(agentName, metadata.maintainCost.mpPerMinute);

  // 顯示召喚動畫
  this.wsServer.broadcast({
    type: 'agent_summon',
    agent: metadata,
    quote: this.getRandomQuote(metadata.quotes.summon)
  });
}
```

### 2.5 Phase 2 總結

**完成時應該有**:
- ✅ Skill 消耗 MP、有冷卻
- ✅ 完成 Skill 給經驗值、金幣
- ✅ 經驗值累積、等級提升
- ✅ MP 自動恢復
- ✅ Skill 快捷欄 UI
- ✅ 1-2 個 Subagents
- ✅ Agent 召喚動畫（基礎）
- ✅ Agent 維持費用

**未實作**:
- ⏸️ 組合技系統
- ⏸️ 成就系統
- ⏸️ 複雜動畫特效

---

## Phase 3: 進階功能 (Week 5-8)

### 3.1 組合技系統

**檔案**: `rpg-config/combo-definitions.json`

```json
{
  "perfect-code-chain": {
    "name": "完美代碼連擊",
    "nameEn": "Perfect Code Chain",
    "icon": "🌟",
    "description": "生成 → 審查 → 測試的完美流程",

    "requiredSkills": [
      "code-generator",
      "code-reviewer",
      "test-generator"
    ],

    "timeWindow": 30000,
    "mustBeSequential": true,

    "rewards": {
      "expMultiplier": 2.0,
      "goldMultiplier": 2.0,
      "bonusExp": 50,
      "bonusGold": 30,
      "badge": "perfectionist"
    },

    "ui": {
      "animation": "triple-slash",
      "color": "#ffd700",
      "sound": "combo_success.mp3"
    },

    "unlockMessage": "🌟 完美代碼連擊！經驗值與金幣雙倍獎勵！"
  },

  "security-fortress": {
    "name": "安全堡壘",
    "icon": "🏰",
    "description": "全方位安全檢查",

    "requiredSkills": [
      "code-reviewer",
      "debug-helper"
    ],

    "requiredAgent": "code-guardian",

    "timeWindow": 60000,

    "rewards": {
      "expMultiplier": 1.5,
      "specialItem": "security-certificate"
    },

    "unlockMessage": "🏰 安全堡壘！獲得安全認證徽章！"
  }
}
```

**ComboDetector 實作**:
```javascript
class ComboDetector {
  constructor(combos) {
    this.combos = combos;
    this.recentActions = []; // { type, name, timestamp }
  }

  recordAction(type, name) {
    const now = Date.now();
    this.recentActions.push({ type, name, timestamp: now });

    // 清除過期動作
    this.recentActions = this.recentActions.filter(
      a => now - a.timestamp < 60000
    );

    // 檢查所有組合技
    return this.checkCombos();
  }

  checkCombos() {
    for (const [comboId, combo] of Object.entries(this.combos)) {
      if (this.isComboTriggered(combo)) {
        return { comboId, combo };
      }
    }
    return null;
  }

  isComboTriggered(combo) {
    const now = Date.now();
    const windowStart = now - combo.timeWindow;

    // 在時間窗口內的動作
    const actionsInWindow = this.recentActions.filter(
      a => a.timestamp >= windowStart
    );

    // 檢查所需 skills
    const skills = actionsInWindow
      .filter(a => a.type === 'skill')
      .map(a => a.name);

    const hasAllSkills = combo.requiredSkills.every(
      req => skills.includes(req)
    );

    if (!hasAllSkills) return false;

    // 如果需要順序
    if (combo.mustBeSequential) {
      const indices = combo.requiredSkills.map(req =>
        skills.indexOf(req)
      );
      const isSequential = indices.every((idx, i) =>
        i === 0 || idx > indices[i - 1]
      );
      if (!isSequential) return false;
    }

    // 檢查所需 agent
    if (combo.requiredAgent) {
      const hasAgent = actionsInWindow.some(
        a => a.type === 'agent' && a.name === combo.requiredAgent
      );
      if (!hasAgent) return false;
    }

    return true;
  }
}
```

### 3.2 成就系統

**檔案**: `rpg-config/achievements.json`

```json
{
  "first_skill": {
    "id": "first_skill",
    "name": "初試啼聲",
    "icon": "🎯",
    "description": "首次使用任意 skill",
    "category": "milestone",
    "rarity": "common",

    "condition": {
      "type": "skill_count",
      "count": 1
    },

    "rewards": {
      "exp": 10,
      "gold": 5,
      "title": "新手"
    },

    "hidden": false
  },

  "skill_master": {
    "id": "skill_master",
    "name": "技能大師",
    "icon": "⭐",
    "description": "使用 skills 累計 100 次",
    "category": "progression",
    "rarity": "rare",

    "condition": {
      "type": "skill_count",
      "count": 100
    },

    "rewards": {
      "exp": 200,
      "gold": 100,
      "title": "大師",
      "unlockSkill": "advanced_combo"
    }
  },

  "guardian_alliance": {
    "id": "guardian_alliance",
    "name": "守護者聯盟",
    "icon": "🛡️",
    "description": "召喚 CodeGuard 10 次",
    "category": "agent",
    "rarity": "uncommon",

    "condition": {
      "type": "agent_summon",
      "agentName": "code-guardian",
      "count": 10
    },

    "rewards": {
      "exp": 100,
      "agentBonus": {
        "agent": "code-guardian",
        "effect": "summon_cost_-5"
      }
    }
  },

  "combo_virtuoso": {
    "id": "combo_virtuoso",
    "name": "連擊大師",
    "icon": "💫",
    "description": "觸發任意組合技 5 次",
    "category": "skill",
    "rarity": "epic",

    "condition": {
      "type": "combo_count",
      "count": 5
    },

    "rewards": {
      "exp": 300,
      "gold": 200,
      "title": "連擊大師",
      "permanentBuff": "combo_exp_+10%"
    }
  }
}
```

**AchievementTracker**:
```javascript
class AchievementTracker {
  constructor(achievements) {
    this.achievements = achievements;
    this.unlocked = new Set();
    this.progress = new Map(); // achievementId -> current count
  }

  recordEvent(eventType, data) {
    // 檢查所有成就
    for (const achievement of Object.values(this.achievements)) {
      if (this.unlocked.has(achievement.id)) continue;

      if (this.checkCondition(achievement.condition, eventType, data)) {
        this.updateProgress(achievement.id, 1);

        if (this.isAchievementComplete(achievement)) {
          this.unlockAchievement(achievement);
        }
      }
    }
  }

  checkCondition(condition, eventType, data) {
    switch (condition.type) {
      case 'skill_count':
        return eventType === 'skill_complete';

      case 'agent_summon':
        return eventType === 'agent_summon' &&
               data.agentName === condition.agentName;

      case 'combo_count':
        return eventType === 'combo_triggered';

      // ... more conditions
    }
  }

  unlockAchievement(achievement) {
    this.unlocked.add(achievement.id);

    // 給予獎勵
    this.applyRewards(achievement.rewards);

    // 顯示解鎖動畫
    this.showUnlockNotification(achievement);
  }
}
```

### 3.3 Worktree "平行世界"

基於 `Worktree-System-Design.md`，整合到遊戲化系統：

**UI 呈現**:
```tsx
const WorktreePanel: React.FC = () => {
  const { worktrees } = useGitWorktree();

  return (
    <div className="worktree-panel">
      <h3>🌍 平行世界</h3>

      {worktrees.map(wt => (
        <div key={wt.branch} className="world-card">
          <div className="world-icon">{getWorldIcon(wt.type)}</div>
          <div className="world-info">
            <h4>{wt.branch}</h4>
            <p>{wt.path}</p>
          </div>
          <button onClick={() => switchWorld(wt)}>
            進入世界
          </button>
        </div>
      ))}

      <button onClick={createNewWorld}>
        🌟 創建新世界
      </button>
    </div>
  );
};
```

**世界類型對應**:
```json
{
  "worldTypes": {
    "main": {
      "icon": "🏰",
      "name": "主世界",
      "protection": "high"
    },
    "feature": {
      "icon": "⚔️",
      "name": "冒險世界",
      "summonCost": { "mp": 10 }
    },
    "fix": {
      "icon": "🛡️",
      "name": "修復世界",
      "priority": "high"
    },
    "experiment": {
      "icon": "🔮",
      "name": "實驗世界",
      "temporary": true
    }
  }
}
```

### 3.4 持久化與儲存

**LocalStorage** - 玩家狀態:
```typescript
interface PlayerSave {
  version: '1.0';
  player: PlayerState;
  cooldowns: Map<string, number>;
  unlockedSkills: string[];
  unlockedAgents: string[];
  achievements: string[];
  statistics: {
    totalSkillsUsed: number;
    totalAgentsSummoned: number;
    totalCombos: number;
    playTime: number;
  };
  lastSaved: number;
}

class SaveManager {
  save() {
    const data: PlayerSave = {
      version: '1.0',
      player: gameState.player,
      cooldowns: gameState.cooldowns,
      // ...
      lastSaved: Date.now()
    };

    localStorage.setItem('rpg-cli-save', JSON.stringify(data));
  }

  load() {
    const saved = localStorage.getItem('rpg-cli-save');
    if (!saved) return null;

    const data = JSON.parse(saved);

    // 版本檢查與遷移
    if (data.version !== '1.0') {
      return this.migrate(data);
    }

    return data;
  }
}
```

**IndexedDB** - 對話歷史:
```typescript
// 使用 idb 或 Dexie.js
import Dexie from 'dexie';

class RPGDatabase extends Dexie {
  conversations: Dexie.Table<Conversation, number>;

  constructor() {
    super('RPGCLIDatabase');
    this.version(1).stores({
      conversations: '++id, timestamp, sessionId'
    });
  }
}

const db = new RPGDatabase();

// 儲存對話
await db.conversations.add({
  timestamp: Date.now(),
  sessionId: currentSessionId,
  messages: conversationHistory,
  playerState: gameState.player
});
```

### 3.5 Phase 3 總結

**完成時應該有**:
- ✅ 組合技系統（偵測、動畫、獎勵）
- ✅ 成就系統（追蹤、解鎖、獎勵）
- ✅ Worktree 平行世界整合
- ✅ 持久化儲存（LocalStorage + IndexedDB）
- ✅ 統計數據追蹤
- ✅ 完整的遊戲循環

---

## 驗收標準總覽

### Phase 1 驗收
```bash
# 啟動系統
npm run dev  # UI
node bridge/index.js  # Bridge

# 測試基礎功能
1. UI 能連接到 Bridge ✅
2. 能發送訊息到 Claude ✅
3. Claude 回應顯示在 UI ✅
4. 玩家狀態顯示（靜態） ✅
5. /code-generator 能調用 skill ✅
```

### Phase 2 驗收
```bash
# 測試遊戲化
1. 點擊 Skill 按鈕 → MP 減少 ✅
2. MP 不足時按鈕禁用 ✅
3. Skill 完成 → 獲得經驗值 ✅
4. 經驗值滿 → 升級動畫 ✅
5. Skill 有冷卻時間 ✅
6. MP 自動恢復 ✅
7. 召喚 Agent → 顯示動畫 ✅
```

### Phase 3 驗收
```bash
# 測試進階功能
1. 連續使用 3 個 skill → 觸發組合技 ✅
2. 解鎖成就 → 顯示通知 ✅
3. 切換 worktree → UI 更新 ✅
4. 重啟應用 → 載入上次狀態 ✅
5. 查看統計 → 顯示正確數據 ✅
```

---

## 技術債務與未來擴展

### 已知限制
- ⚠️ Bridge 目前只支持單一 Claude Code 實例
- ⚠️ 沒有多人模式
- ⚠️ 沒有雲端同步

### 未來可能擴展
- 🔮 MCP 整合（外部工具作為 "裝備"）
- 🔮 Skill 自定義編輯器（UI 內建立 skill）
- 🔮 社群 Skill 市場
- 🔮 更多 Agent 類型（攻擊系、輔助系）
- 🔮 多人協作模式（多個玩家共享 session）
- 🔮 PvE 任務系統（預設挑戰）

---

## 總結

這個規劃基於：
- ✅ **符合官方規範**的 Skills/Subagents
- ✅ **分層架構**：Claude (標準) → Bridge (追蹤) → UI (呈現)
- ✅ **漸進實作**：從基礎到進階
- ✅ **可擴展設計**：Metadata 驅動、模組化

**下一步**:
1. 開始 Phase 1 實作
2. 創建 3-5 個基礎 Skills
3. 建立 Bridge Layer 原型
4. 實作 React UI 基礎

**預期時程**: 8 週完成完整系統

---

**版本歷史**:
- v2.0 (2026-02-05): 基於新架構的完整規劃
- v1.0 (已廢棄): 基於錯誤理解的規劃
