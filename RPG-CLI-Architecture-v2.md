# RPG-CLI 架構設計 v2.0

**基於**: Claude Code 官方文檔（2026-02-05）
**原則**: 遊戲化在 UI 層，Skills/Subagents 符合官方規範

---

## 核心概念

### 分層架構

```
┌─────────────────────────────────────────┐
│   RPG UI Layer (React)                  │  ← 遊戲化呈現
│   - HP/MP/經驗值/等級                    │
│   - 技能冷卻、施放動畫                   │
│   - 角色成長、成就系統                   │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│   Bridge Layer (Node.js)                │  ← 協調層
│   - 攔截 Claude Code 輸出                │
│   - 追蹤 Skill/Subagent 使用             │
│   - 計算遊戲數據                         │
└─────────────────┬───────────────────────┘
                  │ child_process
┌─────────────────▼───────────────────────┐
│   Claude Code CLI                       │  ← 標準 Claude
│   - 標準 Skills (符合官方格式)           │
│   - 標準 Subagents (符合官方格式)        │
│   - 真實的 AI 功能                       │
└─────────────────────────────────────────┘
```

### 關鍵設計決策

**✅ 做的事**:
- Skills 和 Subagents 完全符合官方格式
- 遊戲化邏輯在 React UI 實現
- Bridge 層負責資料轉換和追蹤

**❌ 不做的事**:
- ~~在 frontmatter 加 RPG 欄位~~ (不符合官方規範)
- ~~修改 Claude Code 核心~~ (保持標準)
- ~~在 system prompt 強加遊戲邏輯~~ (影響 AI 品質)

---

## Skills 設計

### 官方格式 Skills

Skills 使用**標準官方格式**，無 RPG 專屬欄位：

```yaml
---
name: code-generator
description: 快速生成高品質程式碼。適合原型開發、函數實作、模板建立。
allowed-tools: Bash, Read, Write
---

# 代碼生成器

當用戶需要生成代碼時：

1. 理解需求和上下文
2. 選擇適當的設計模式
3. 生成乾淨、可維護的代碼
4. 提供使用說明

**輸出格式**:
- 使用適當的語言和框架
- 包含必要的錯誤處理
- 添加清晰的註解
```

### UI 層的 Skill 映射

在 `skill-metadata.json` 定義遊戲化元數據：

```json
{
  "code-generator": {
    "displayName": "代碼生成術",
    "icon": "⚔️",
    "type": "attack",
    "category": "basic",
    "mpCost": 15,
    "cooldown": 60,
    "expReward": 20,
    "goldReward": 10,
    "levelRequired": 1,
    "comboTags": ["code", "attack", "create"],
    "flavorText": "將思緒化為代碼，創造數位世界的利刃",
    "animation": "slash-effect"
  }
}
```

### Skills 目錄結構

```
~/.claude/skills/                      # 全局 skills
├── code-generator/
│   └── SKILL.md                       # 官方格式
├── code-reviewer/
│   └── SKILL.md
└── architecture-design/
    └── SKILL.md

/Users/.../cc-office/                  # 專案配置
├── rpg-config/
│   ├── skill-metadata.json            # UI 遊戲化資料
│   ├── agent-metadata.json            # Agent 遊戲化資料
│   └── combo-definitions.json         # 組合技定義
└── .claude/skills/                    # 專案 skills
    └── project-specific/
        └── SKILL.md
```

---

## Subagents 設計

### 官方格式 Subagents

Subagents 同樣使用**標準官方格式**：

```markdown
---
name: code-guardian
description: 代碼審查專家，檢查品質、安全性和最佳實踐。適合重要功能發布前的全面審查。
tools: Read, Grep, Glob
model: sonnet
memory: user
---

# Code Guardian - 代碼守護者

你是一位經驗豐富的代碼審查專家。

## 審查標準

### 🔴 Critical
- 安全漏洞（SQL Injection, XSS 等）
- 資料外洩風險

### 🟠 High
- 性能問題
- 錯誤處理缺失

### 🟡 Medium
- 命名不清晰
- 代碼重複

### 🟢 Low
- 格式不一致
- 次要風格問題

## 審查流程

1. 快速掃描識別明顯問題
2. 逐行深度分析
3. 提供具體改進建議和代碼範例

每個問題包含：
- 嚴重程度
- 問題說明
- 修改建議
- 風險說明

**重要**: 隨著審查經驗累積，更新你的 agent memory，記錄：
- 常見問題模式
- 專案特定慣例
- 最佳實踐案例
```

### UI 層的 Agent 映射

```json
{
  "code-guardian": {
    "characterName": "CodeGuard",
    "title": "代碼守護者",
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
    "levelRequired": 5,
    "stats": {
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },
    "specialAbilities": [
      {
        "name": "OWASP 守護",
        "description": "精通 OWASP Top 10，快速識別安全漏洞",
        "bonus": "+30% 安全問題檢測率"
      }
    ],
    "summonQuotes": [
      "🛡️ CodeGuard 前來！讓我守護你的代碼！",
      "審查開始，任何漏洞都逃不過我的眼睛！"
    ],
    "completionQuotes": [
      "審查完畢，發現了 {issue_count} 個需要注意的地方。",
      "守護任務完成，你的代碼現在更安全了。"
    ]
  }
}
```

---

## 遊戲化實現

### 1. Bridge Layer 追蹤

```javascript
// bridge.js - 攔截 Claude Code 輸出
class RPGBridge {
  constructor() {
    this.claudeProcess = null;
    this.gameState = new GameState();
    this.wsServer = new WebSocketServer();
  }

  async start() {
    // 啟動 Claude Code
    this.claudeProcess = spawn('claude', [...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 監聽輸出
    this.claudeProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // 偵測 Skill/Subagent 調用
      this.detectToolUse(output);

      // 轉發給 Claude Code
      process.stdout.write(data);

      // 同時發送給 UI
      this.wsServer.broadcast({
        type: 'claude_output',
        data: output
      });
    });
  }

  detectToolUse(output) {
    // 解析 Claude Code 輸出，偵測工具使用
    const skillMatch = output.match(/Skill\(([\w-]+)\)/);
    const agentMatch = output.match(/Task\(([\w-]+)\)/);

    if (skillMatch) {
      const skillName = skillMatch[1];
      this.handleSkillUse(skillName);
    }

    if (agentMatch) {
      const agentName = agentMatch[1];
      this.handleAgentSummon(agentName);
    }
  }

  handleSkillUse(skillName) {
    const metadata = this.loadSkillMetadata(skillName);

    // 檢查遊戲條件
    if (this.gameState.player.mp < metadata.mpCost) {
      this.wsServer.broadcast({
        type: 'skill_failed',
        reason: 'MP 不足',
        skillName
      });
      return;
    }

    // 扣除 MP
    this.gameState.player.mp -= metadata.mpCost;

    // 啟動冷卻
    this.gameState.setCooldown(skillName, metadata.cooldown);

    // 通知 UI 顯示施放動畫
    this.wsServer.broadcast({
      type: 'skill_cast',
      skill: metadata,
      player: this.gameState.player
    });

    // Skill 完成後給予獎勵（監聽 Claude 回應結束）
    this.onSkillComplete(skillName, () => {
      this.gameState.player.exp += metadata.expReward;
      this.gameState.player.gold += metadata.goldReward;

      this.wsServer.broadcast({
        type: 'skill_complete',
        rewards: {
          exp: metadata.expReward,
          gold: metadata.goldReward
        }
      });
    });
  }

  loadSkillMetadata(skillName) {
    // 從 rpg-config/skill-metadata.json 讀取
    return require('./rpg-config/skill-metadata.json')[skillName];
  }
}
```

### 2. React UI 遊戲化顯示

```typescript
// SkillCastAnimation.tsx
interface SkillCastEvent {
  skill: SkillMetadata;
  player: PlayerState;
}

const SkillCastAnimation: React.FC<{ event: SkillCastEvent }> = ({ event }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="skill-cast"
    >
      <div className="skill-icon">{event.skill.icon}</div>
      <div className="skill-name">{event.skill.displayName}</div>

      {/* 施放特效 */}
      <motion.div
        className="cast-effect"
        initial={{ scale: 0 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* MP 消耗動畫 */}
      <div className="mp-cost">-{event.skill.mpCost} MP</div>
    </motion.div>
  );
};

// PlayerStats.tsx
const PlayerStats: React.FC = () => {
  const { player } = useGameState();

  return (
    <div className="player-stats pixel-art">
      <div className="stat-bar">
        <span>❤️ HP</span>
        <ProgressBar
          value={player.hp}
          max={player.maxHp}
          color="red"
        />
      </div>

      <div className="stat-bar">
        <span>⭐ MP</span>
        <ProgressBar
          value={player.mp}
          max={player.maxMp}
          color="blue"
        />
      </div>

      <div className="level-info">
        Lv.{player.level} {player.className}
      </div>
    </div>
  );
};
```

### 3. 組合技系統

```json
// rpg-config/combo-definitions.json
{
  "code-review-chain": {
    "name": "代碼審查連擊",
    "icon": "🌟",
    "requiredSkills": [
      "code-generator",
      "code-reviewer",
      "security-scanner"
    ],
    "timeWindow": 30000,
    "rewards": {
      "expMultiplier": 2.0,
      "goldMultiplier": 2.0,
      "bonusItem": "quality-badge"
    },
    "animation": "triple-slash"
  }
}
```

```javascript
// ComboDetector.js
class ComboDetector {
  constructor() {
    this.recentSkills = [];
    this.combos = require('./rpg-config/combo-definitions.json');
  }

  addSkill(skillName, timestamp) {
    this.recentSkills.push({ skillName, timestamp });

    // 清除過期技能
    const now = Date.now();
    this.recentSkills = this.recentSkills.filter(
      s => now - s.timestamp < 30000
    );

    // 檢查組合技
    return this.checkCombos();
  }

  checkCombos() {
    const usedSkills = this.recentSkills.map(s => s.skillName);

    for (const [comboId, combo] of Object.entries(this.combos)) {
      if (combo.requiredSkills.every(req => usedSkills.includes(req))) {
        return { comboId, combo };
      }
    }

    return null;
  }
}
```

---

## 技術堆疊

### Backend (Bridge Layer)
- **Node.js**: 主程序
- **child_process**: 啟動 Claude Code
- **ws**: WebSocket server
- **chokidar**: 監聽檔案變化（metadata 更新）

### Frontend (RPG UI)
- **React 18**: UI 框架
- **Vite**: 構建工具
- **Framer Motion**: 動畫效果
- **Zustand**: 狀態管理
- **Socket.io-client**: WebSocket 客戶端
- **Tailwind CSS**: 樣式（Pixel Art 風格）

### Storage
- **LocalStorage**: 玩家數據、設定
- **IndexedDB**: 對話歷史、成就記錄
- **JSON files**: Skills/Agents 元數據

---

## 實作優先級

### Phase 1: 核心功能 (Week 1-2)
1. ✅ Bridge Layer 基礎
   - 啟動 Claude Code
   - 攔截輸出
   - WebSocket 通訊

2. ✅ 基礎 UI
   - 對話界面
   - 玩家狀態顯示（HP/MP/Lv）
   - Skill 快捷按鈕

3. ✅ 3-5 個基礎 Skills
   - 符合官方格式的 SKILL.md
   - 對應的 metadata.json

### Phase 2: 遊戲化增強 (Week 3-4)
1. ✅ Skill 系統完善
   - 冷卻計時
   - MP 消耗
   - 經驗值獎勵

2. ✅ Agent 召喚系統
   - Subagent 啟動偵測
   - 召喚動畫
   - 維持費用計算

3. ✅ 等級成長
   - 經驗值累積
   - 等級提升
   - 解鎖新 Skills

### Phase 3: 進階功能 (Week 5-8)
1. ✅ 組合技系統
2. ✅ 成就系統
3. ✅ 持久記憶整合（利用 Subagent memory）
4. ✅ Worktree "平行世界"

---

## 設計哲學

### 1. 尊重官方規範
- Skills 和 Subagents 完全符合官方格式
- 不修改 Claude Code 核心行為
- 利用標準功能（memory, hooks 等）

### 2. 分離關注點
- **Claude Code**: 提供 AI 能力（標準）
- **Bridge Layer**: 追蹤和轉換（中介）
- **React UI**: 遊戲化呈現（視覺）

### 3. 可擴展性
- Metadata 驅動（新增 Skill 只需加 JSON）
- 插件式架構（未來可加 MCP）
- 模組化設計（每層獨立）

### 4. 用戶體驗
- 保持 Claude 的原始功能
- 添加遊戲化樂趣
- 不干擾正常工作流程

---

## 下一步

1. **創建實際 Skills**
   - 3-5 個常用 skills（符合官方格式）
   - 對應的 metadata.json

2. **創建 Subagents**
   - 2-3 個專門化 agents
   - 對應的 metadata.json

3. **實作 Bridge Layer**
   - 基礎攔截和轉發
   - Skill/Agent 偵測
   - WebSocket 通訊

4. **建立 UI 原型**
   - 基本對話界面
   - 玩家狀態顯示
   - Skill 快捷欄

---

**版本歷史**:
- v2.0 (2026-02-05): 基於 Claude Code 官方文檔重新設計
- v1.0 (已廢棄): 基於錯誤理解的初版設計
