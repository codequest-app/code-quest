---
name: project-overview
description: >
  Code Quest project overview covering core concept, three-layer architecture, and design philosophy.
  Use when asking what this project does, planning architecture, reviewing design documents,
  or needing overall context for new features.
---

# Code Quest - RPG 化的 Claude Code 體驗

## 專案願景

Code Quest 是一個將 Claude Code CLI 遊戲化為 RPG 體驗的專案。它**不修改 Claude 核心功能**，而是在上層加入 RPG 包裝，讓開發工作變得更有趣。

## 核心概念：三層架構

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

**關鍵設計原則**：
- ✅ **分層架構**：遊戲化在 UI 層，不修改 Claude 核心
- ✅ **尊重官方**：Skills/Subagents 符合官方規範
- ✅ **漸進增強**：保持原始功能，添加遊戲化樂趣
- ✅ **可擴展性**：Metadata 驅動，易於擴展

## AI 功能 → RPG 元素映射

| AI 交互元素 | RPG 元素 | 說明 |
|------------|---------|------|
| 用戶 | 冒險者/玩家 | 主角 |
| Claude AI | NPC 導師/魔法師 | AI 助手 |
| Skills | 技能/魔法 | 執行功能的方式 |
| Subagents | 戰鬥夥伴 | 協同作戰的 Agent |
| 對話任務 | Quest | 任務系統 |
| API 配額 | HP | 生命值 |
| Token 消耗 | MP | 魔力值 |
| 經驗累積 | EXP/等級 | 成長系統 |
| 任務完成 | 戰鬥勝利 | 獎勵機制 |

## CodeLand 世界結構

```
CodeLand 世界
├── 🏰 城鎮區域（安全區）
│   ├── 商業街（7個商店：技能、工匠、MCP工具、傭兵、寶物、訓練、錢莊）
│   ├── 酒館（AI對話，不消耗MP）
│   ├── 靜止之間（Plan Mode）
│   ├── 公會大廳（Worktree管理）
│   └── 玩家住所（休息、設定）
│
├── 🌲 野外區域（危險區）
│   ├── 森林（Lv.5-8）
│   ├── 山脈（Lv.8-12）
│   ├── 荒野（Lv.12-15）
│   └── 火山（Lv.15+）
│
└── 🏔️ 副本區域（特殊任務）
    ├── Bug 洞窟
    ├── 架構迷宮
    ├── 測試試煉場
    └── 安全地牢
```

## 核心系統（11個）

### L0 基礎系統
1. **地圖系統**：3大區域、場所管理、遭遇戰
2. **場景系統**：探索/戰鬥模式切換
3. **商店系統**：7大商店、功能管理
4. **Worktree系統**：平行世界、分支管理

### L1-L2 核心玩法
5. **戰鬥系統**：回合制戰鬥、敵人生成
6. **夥伴系統**：Subagent映射、協同戰鬥
7. **召喚獸系統**：4種召喚、爆發支援
8. **互動事件**：戰鬥事件、工具映射

### L3-L4 進階功能
9. **非同步戰鬥**：並發戰鬥、智能路由
10. **多模型整合**：Claude/Gemini切換
11. **UI互動**：完整UI規範、動畫

## 核心機制

### 資源系統

**HP（生命值）** = API 配額
- 戰鬥中受傷消耗
- 探索模式：2 HP/秒恢復
- 戰鬥模式：0.1 HP/秒恢復

**MP（魔力值）** = Token 消耗
- 施放技能消耗
- 探索模式：1 MP/秒恢復
- 戰鬥模式：0.1 MP/秒恢復

**EXP（經驗值）** = 成長系統
- 完成任務獲得
- 升級公式：`100 * (1.5 ^ (level - 1))`

**Gold（金幣）** = 遊戲貨幣
- 完成任務獲得
- 購買道具、升級技能

### 戰鬥觸發機制

根據 Prompt 複雜度自動判斷：
- **0-2 分**：對話型 Prompt → 不觸發戰鬥（酒館模式）
- **3-7 分**：簡單任務 → 主目錄同步戰鬥
- **8+ 分**：複雜任務 → 創建 Worktree 異步戰鬥

## 視覺風格

**Pixel Art 風格**：
- 復古、輕鬆、有趣的氛圍
- 8-bit/16-bit 風格圖形
- 像素字體 (Press Start 2P)
- 像素動畫（攻擊特效、升級動畫）

**配色方案**：
- 探索模式：綠色調 (#1a4d2e)
- 戰鬥模式：紅色調 (#4d1a1a)
- HP: 綠色 (#4caf50)
- MP: 藍色 (#2196f3)
- EXP: 金色 (#ffc107)

## 技術堆疊

**前端**：
```
React 18 + TypeScript
├── Vite (構建工具)
├── Tailwind CSS (樣式)
├── Framer Motion (動畫)
├── Zustand (狀態管理)
└── Socket.io-client (實時通訊)
```

**後端**：
```
Node.js + Express
├── Socket.io (WebSocket)
├── child_process (Claude CLI)
└── Chokidar (文件監聽)
```

## 專案狀態

- ✅ **設計階段**：完成
- 🚧 **實作階段**：準備中
- 📋 **文檔位置**：
  - 設計文檔：`docs/design/`（11個系統）
  - UI設計：`docs/ui-design/`（統一規格）

## 關鍵文檔

如需深入了解特定系統，請閱讀：

- **總覽**：`docs/ui-design/00-OVERVIEW.md`
- **系統架構**：`docs/ui-design/01-SYSTEM-ARCHITECTURE.md`
- **世界地圖**：`docs/ui-design/02-WORLD-MAP.md`
- **核心機制**：`docs/ui-design/03-CORE-MECHANICS.md`
- **遊戲流程**：`docs/ui-design/04-GAME-FLOW.md`
- **戰鬥管理**：`docs/ui-design/05-BATTLE-MANAGEMENT.md`

## 使用建議

當你需要：
- **了解專案目標** → 使用此 skill
- **了解地圖系統** → 使用 `/map-system`
- **了解戰鬥管理** → 使用 `/battle-management`

記住：Code Quest 是一個**遊戲化包裝**，底層仍是標準的 Claude Code CLI。所有 Skills 和 Subagents 都符合官方規範，可以在任何 Claude Code 環境中使用。
