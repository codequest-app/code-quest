# Code Quest (RPG-CLI) - 專案總覽

**版本**: v2.0
**更新日期**: 2026-02-05
**狀態**: 設計完成，待實作

---

## 專案願景

將 Claude Code CLI 包裝成具有 RPG 遊戲風格的網頁介面，讓使用者以更有趣、更具互動性的方式與 AI 助手協作。

### 核心理念

**遊戲化映射**：
- 用戶 → 冒險者/玩家
- Claude AI → NPC 導師/魔法師
- Skills/Subagents → 技能/召喚獸
- 對話任務 → Quest
- API 配額 → HP/MP 值
- 經驗累積 → 等級成長

**設計原則**：
1. **分層架構**：遊戲化在 UI 層，Skills/Subagents 符合 Claude 官方規範
2. **尊重官方**：不修改 Claude Code 核心，利用標準功能
3. **漸進增強**：保持 Claude 原始功能，添加遊戲化樂趣
4. **可擴展性**：Metadata 驅動，易於擴展新功能

---

## 系統架構

### 分層設計

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
│   - 計算遊戲數據 (MP/EXP/Gold)          │
└─────────────────┬───────────────────────┘
                  │ child_process
┌─────────────────▼───────────────────────┐
│   Claude Code CLI                       │  ← 標準 Claude
│   - 標準 Skills (符合官方格式)           │
│   - 標準 Subagents (符合官方格式)        │
│   - 真實的 AI 功能                       │
└─────────────────────────────────────────┘
```

### 核心設計決策

**✅ 做的事**：
- Skills 和 Subagents 完全符合官方 YAML/Markdown 格式
- 遊戲化邏輯（MP 消耗、冷卻、經驗值）在 React UI 和 Bridge 實現
- Bridge 層負責資料轉換和追蹤，不修改 Claude 輸出內容

**❌ 不做的事**：
- ~~在 frontmatter 加 RPG 欄位~~（不符合官方規範）
- ~~修改 Claude Code 核心~~（保持標準）
- ~~在 system prompt 強加遊戲邏輯~~（影響 AI 品質）

---

## 技術堆疊

### 前端技術

```
React UI:
├── React 18 (UI 框架)
├── TypeScript (類型安全)
├── Vite (構建工具)
├── Tailwind CSS (樣式系統 - Pixel Art 風格)
├── Framer Motion (動畫系統)
├── Zustand (狀態管理)
└── Socket.io-client (實時通訊)
```

### 後端技術

```
Bridge Server:
├── Node.js + Express (API 服務器)
├── child_process (調用 Claude Code CLI)
├── Socket.io (WebSocket 服務器)
└── Chokidar (監聽 metadata 文件變化)
```

### 數據存儲

```
存儲方案:
├── LocalStorage (玩家狀態、設定)
├── IndexedDB (對話歷史、成就記錄)
└── JSON files (Skills/Agents metadata)
```

---

## 系統總覽

專案已完成 11 個核心系統的設計，所有文檔已統一為三層結構：

### 已完成系統

| 系統名稱 | 目錄 | 主要功能 |
|---------|------|---------|
| 1. 地圖系統 | `map-system/` | 城鎮、野外、副本場所管理 |
| 2. 互動事件 | `interactive-events/` | 戰鬥事件、工具映射、彈窗處理 |
| 3. 商店系統 | `shop-system/` | 7個商店（技能升級、道具、夥伴） |
| 4. Worktree 手動管理 | `worktree-manual-system/` | Git worktree "平行世界" |
| 5. 非同步戰鬥 | `async-battle-system/` | 多戰鬥並行、智能路由 |
| 6. 戰鬥系統 | `battle-system/` | 回合制戰鬥、敵人生成 |
| 7. 場景系統 | `scene-system/` | 探索模式 vs 戰鬥模式切換 |
| 8. 夥伴系統 | `companion-system/` | Subagent→戰鬥夥伴映射 |
| 9. 召喚獸系統 | `summon-beast-system/` | 4 種召喚類型、行為管理 |
| 10. 多模型整合 | `multi-model-integration/` | Claude/Gemini 切換、成本優化 |
| 11. UI 互動 | `ui-interaction/` | 完整 UI 規範、動畫、無障礙 |

### 文檔結構

每個系統包含三層文檔：

```
docs/design/{系統名稱}/
├── requirements.md      (功能需求 - 做什麼、為什麼)
├── ui-design.md         (介面設計 - 怎麼呈現)
└── implementation.md    (技術實作 - 怎麼做)
```

---

## Skills 和 Subagents 設計

### Skills（技能）

**官方格式示例**：

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

保持代碼簡潔、可讀、可維護。
```

**UI 層的 Metadata**（`rpg-config/skill-metadata.json`）：

```json
{
  "code-generator": {
    "displayName": "代碼生成術",
    "icon": "⚔️",
    "type": "attack",
    "mpCost": 15,
    "cooldown": 60,
    "expReward": 20,
    "goldReward": 10,
    "levelRequired": 1,
    "animation": "slash-effect",
    "flavorText": "將思緒化為代碼，創造數位世界的利刃"
  }
}
```

### Subagents（召喚夥伴）

**官方格式示例**：

```markdown
---
name: code-guardian
description: 代碼審查專家，檢查品質、安全性和最佳實踐
tools: Read, Grep, Glob
model: sonnet
memory: user
---

# Code Guardian - 代碼守護者

你是一位經驗豐富的代碼審查專家。

## 審查標準

### 🔴 Critical
- 安全漏洞（SQL Injection, XSS 等）

### 🟠 High
- 性能問題、錯誤處理缺失

### 🟡 Medium
- 命名不清晰、代碼重複

## 審查流程
1. 快速掃描識別明顯問題
2. 逐行深度分析
3. 提供具體改進建議
```

**UI 層的 Metadata**（`rpg-config/agent-metadata.json`）：

```json
{
  "code-guardian": {
    "characterName": "CodeGuard",
    "title": "代碼守護者",
    "avatar": "🛡️",
    "element": "guardian",
    "rarity": "rare",
    "summonCost": { "mp": 30, "cooldown": 300 },
    "maintainCost": { "mpPerMinute": 5 },
    "levelRequired": 5,
    "stats": {
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },
    "summonQuotes": [
      "🛡️ CodeGuard 前來！讓我守護你的代碼！"
    ]
  }
}
```

---

## 遊戲化核心機制

### 1. 資源系統

**HP（生命值）**：
- 對應 API 配額
- 戰鬥中受到傷害消耗
- 戰鬥外自動恢復（每分鐘 +1）

**MP（魔力值）**：
- 施放技能消耗
- 召喚 Agent 消耗
- 戰鬥外快速恢復（每秒 +1），戰鬥中慢速恢復（每 10 秒 +1）

**EXP（經驗值）**：
- 完成任務獲得
- 使用技能獲得
- 達到升級要求時提升等級

**Gold（金幣）**：
- 完成任務獲得
- 在商店購買道具、升級技能

### 2. 冷卻系統

每個技能使用後進入冷卻：
- 基礎技能：30-60 秒
- 進階技能：90-120 秒
- 召喚 Agent：300 秒（5 分鐘）

### 3. 組合技系統

連續使用特定技能組合觸發額外獎勵：

```json
{
  "perfect-code-chain": {
    "name": "完美代碼連擊",
    "requiredSkills": ["code-generator", "code-reviewer", "test-generator"],
    "timeWindow": 30000,
    "rewards": {
      "expMultiplier": 2.0,
      "goldMultiplier": 2.0
    }
  }
}
```

### 4. 成就系統

追蹤玩家行為，解鎖成就：
- 首次使用技能
- 累計使用 100 次技能
- 觸發組合技 5 次
- 連續使用 7 天

---

## 實作指南

### Phase 1: 核心基礎（Week 1-2）

**目標**：建立可運行的基礎系統

**任務**：
1. ✅ Bridge Layer 實作
   - 啟動 Claude Code CLI
   - 攔截 stdout/stderr
   - WebSocket 服務器建立

2. ✅ React UI 基礎
   - 對話視窗
   - 訊息列表
   - 輸入框
   - 玩家狀態顯示（HP/MP/Lv）

3. ✅ 標準 Skills 創建
   - 3-5 個符合官方格式的 SKILL.md
   - 對應的 skill-metadata.json

**驗收標準**：
```bash
# 啟動系統
npm run dev  # UI
node bridge/index.js  # Bridge

# 測試
1. UI 能連接到 Bridge ✅
2. 能發送訊息到 Claude ✅
3. Claude 回應顯示在 UI ✅
4. /code-generator 能調用 skill ✅
```

### Phase 2: 遊戲化核心（Week 3-4）

**目標**：添加 RPG 元素

**任務**：
1. ✅ Skill 系統完善
   - MP 消耗檢查
   - 冷卻計時
   - 經驗值獎勵

2. ✅ Agent 召喚基礎
   - Subagent 啟動偵測
   - 召喚動畫
   - 維持費用計算

3. ✅ 等級成長
   - 經驗值累積
   - 等級提升
   - 升級動畫

**驗收標準**：
```bash
1. 點擊 Skill → MP 減少 ✅
2. MP 不足時按鈕禁用 ✅
3. Skill 完成 → 獲得經驗值 ✅
4. 經驗值滿 → 升級動畫 ✅
5. Skill 有冷卻時間 ✅
```

### Phase 2.5: 戰鬥系統（Week 5-6）

**目標**：擴展戰鬥玩法

**任務**：
1. ✅ 敵人生成與戰鬥管理
2. ✅ 夥伴系統（Subagent 映射）
3. ✅ 召喚獸基礎

### Phase 3: 進階功能（Week 7-10）

**目標**：完善遊戲體驗

**任務**：
1. ✅ 組合技系統
2. ✅ 成就系統
3. ✅ Worktree "平行世界"
4. ✅ 持久化儲存
5. ✅ MCP 工具整合

---

## 關鍵技術實現

### Bridge Layer 追蹤

```javascript
class RPGBridge {
  detectToolUse(output) {
    const skillMatch = output.match(/Skill\(([\w-]+)\)/);
    if (skillMatch) {
      const skillName = skillMatch[1];
      this.handleSkillUse(skillName);
    }
  }

  handleSkillUse(skillName) {
    const metadata = this.loadSkillMetadata(skillName);

    // 檢查 MP
    if (this.gameState.player.mp < metadata.mpCost) {
      this.wsServer.broadcast({ type: 'skill_failed', reason: 'MP 不足' });
      return;
    }

    // 扣除 MP、啟動冷卻
    this.gameState.player.mp -= metadata.mpCost;
    this.gameState.setCooldown(skillName, metadata.cooldown);

    // 通知 UI 顯示動畫
    this.wsServer.broadcast({ type: 'skill_cast', skill: metadata });
  }
}
```

### React UI 動畫

```typescript
const SkillCastAnimation: React.FC<{ event: SkillCastEvent }> = ({ event }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="skill-cast"
    >
      <div className="skill-icon">{event.skill.icon}</div>
      <div className="skill-name">{event.skill.displayName}</div>
      <motion.div
        className="cast-effect"
        initial={{ scale: 0 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};
```

---

## 視覺風格

### Pixel Art 風格

**選定理由**：
- 復古、輕鬆、有趣的氛圍
- 開發資源相對容易製作
- 適合 RPG 主題

**主要元素**：
- 8-bit/16-bit 像素化 UI
- 像素字體
- 像素動畫（攻擊特效、升級動畫）
- 像素進度條（HP/MP/EXP）

**CSS 實現要點**：
```css
.pixel-art {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-font {
  font-family: 'Press Start 2P', cursive;
}
```

---

## 未來擴展方向

### 1. MCP 工具整合
將外部 MCP 工具映射為遊戲內裝備或召喚獸

### 2. 多人模式
- 公會系統（團隊共享 Skills）
- 排行榜

### 3. 劇情模式
- 引導式教學任務
- 解鎖新功能的故事線

### 4. 自定義編輯器
- UI 內創建和編輯 Skills
- 社群 Skill 市場

---

## 開發資源

### 設計參考

**遊戲參考**：
- Final Fantasy (IV-VI)：經典 JRPG 像素風格
- Stardew Valley：現代像素風格
- Undertale：簡潔有趣的像素 UI

**素材資源**：
- [CraftPix - Free Pixel Art UI](https://craftpix.net/freebies/)
- [Itch.io - Pixel Art Assets](https://itch.io/game-assets/tag-pixel-art)
- [GameDev Market](https://www.gamedevmarket.net/)

### 文檔索引

**核心文檔**：
- 本文檔：`docs/design/PROJECT_OVERVIEW.md`
- 系統設計：`docs/design/{系統名稱}/`
- 實作代碼：`src/` (待創建)

**外部資源**：
- [Claude Code 官方文檔](https://docs.anthropic.com/en/docs/agents)
- [React 18 文檔](https://react.dev/)
- [Framer Motion 文檔](https://www.framer.com/motion/)

---

## 常見問題

### Q1: 為什麼不直接修改 Claude Code？
**A**: 保持與官方規範的兼容性，確保未來更新不會破壞系統。遊戲化應該是"包裝"而非"入侵"。

### Q2: Skill Metadata 和 Skill 本身為何分離？
**A**: Skill 本身必須符合 Claude 官方格式（純淨的 YAML + Markdown），遊戲化數據（MP、冷卻、動畫）在單獨的 JSON 文件中維護。

### Q3: 如何處理 API 配額限制？
**A**: HP 系統映射 API 配額，當 HP 耗盡時提示用戶"休息"（等待配額恢復），或使用低成本模型（Gemini Flash）。

### Q4: 戰鬥系統會影響 AI 回應質量嗎？
**A**: 不會。戰鬥只是 UI 層的視覺呈現，實際的 AI 對話仍然使用標準的 Claude Code 流程。

---

## 版本歷史

- **v2.0** (2026-02-05): 完成 11 個系統設計，統一文檔結構
- **v1.0** (2025-12-XX): 初始構想和架構設計

---

**維護者**: Code Quest Team
**許可證**: MIT（待確定）
**專案狀態**: 設計階段完成，準備進入實作階段

