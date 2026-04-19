---
name: rpg-roadmap
description: >
  **Roadmap — 尚未實作。** Code Quest RPG vision for cc-office — CodeLand world,
  11 systems, HP/MP/EXP/Gold mechanics, battle-trigger rules, pixel-art visual
  style. Use when designing future RPG features, discussing long-term direction,
  or reading legacy docs under `docs/ui-design/`. Current architecture: see
  `project-overview`.
---

# Code Quest — RPG Roadmap（尚未實作）

> ⚠️ **這份是願景，不是現況。** cc-office 目前是 Claude Code web client（見 `project-overview`）。本 skill 描述「如果未來加上 RPG 層」該長什麼樣。遇到現況跟此處衝突：**現況優先**。

## 核心概念

把 Claude Code 使用體驗包裝成 RPG — 不修改 Claude 核心，只在 UI 層加遊戲化：

- ✅ 分層架構：遊戲化在 UI 層
- ✅ 尊重官方：Skills / Subagents 符合官方規範
- ✅ 漸進增強：保留原始功能
- ✅ Metadata 驅動：易擴展

## AI → RPG 元素映射

| AI 交互 | RPG 元素 | 說明 |
|---|---|---|
| 用戶 | 冒險者 / 玩家 | 主角 |
| Claude / Gemini | NPC 導師 / 魔法師 | AI 助手 |
| Skills | 技能 / 魔法 | 執行功能的方式 |
| Subagents | 戰鬥夥伴 | 協同作戰 |
| 對話任務 | Quest | 任務系統 |
| API 配額 | HP | 生命值 |
| Token 消耗 | MP | 魔力值 |
| 經驗累積 | EXP / 等級 | 成長系統 |
| 任務完成 | 戰鬥勝利 | 獎勵機制 |

## CodeLand 世界結構

```
CodeLand 世界
├── 🏰 城鎮區域（安全區）
│   ├── 商業街（7 商店：技能、工匠、MCP、傭兵、寶物、訓練、錢莊）
│   ├── 酒館（AI 對話，不消耗 MP）
│   ├── 靜止之間（Plan Mode）
│   ├── 公會大廳（Worktree 管理）
│   └── 玩家住所（休息、設定）
│
├── 🌲 野外區域（危險區）
│   ├── 森林 (Lv.5-8)
│   ├── 山脈 (Lv.8-12)
│   ├── 荒野 (Lv.12-15)
│   └── 火山 (Lv.15+)
│
└── 🏔️ 副本區域（特殊任務）
    ├── Bug 洞窟
    ├── 架構迷宮
    ├── 測試試煉場
    └── 安全地牢
```

## 核心系統（11 個）

### L0 基礎系統
1. **地圖系統**：三大區域、場所管理、遭遇戰
2. **場景系統**：探索 / 戰鬥模式切換
3. **商店系統**：7 大商店、功能管理
4. **Worktree 系統**：平行世界、分支管理

### L1-L2 核心玩法
5. **戰鬥系統**：回合制、敵人生成
6. **夥伴系統**：Subagent 映射、協同戰鬥
7. **召喚獸系統**：4 種召喚、爆發支援
8. **互動事件**：戰鬥事件、工具映射

### L3-L4 進階功能
9. **非同步戰鬥**：並發戰鬥、智能路由
10. **多模型整合**：Claude / Gemini 切換
11. **UI 互動**：完整 UI 規範、動畫

## 資源機制

| 資源 | 對應 | 恢復 |
|---|---|---|
| **HP**（生命值） | API 配額 | 探索 2 HP/s；戰鬥 0.1 HP/s |
| **MP**（魔力值） | Token 消耗 | 探索 1 MP/s；戰鬥 0.1 MP/s |
| **EXP**（經驗值） | 成長系統 | 任務完成；升級公式 `100 * (1.5 ^ (level - 1))` |
| **Gold**（金幣） | 遊戲貨幣 | 任務獎勵；購買道具 / 升級技能 |

## 戰鬥觸發機制

依 Prompt 複雜度自動判斷：

- **0-2 分**：對話型 → 不觸發戰鬥（酒館模式）
- **3-7 分**：簡單任務 → 主目錄同步戰鬥
- **8+ 分**：複雜任務 → 建 Worktree 異步戰鬥

## 視覺風格

**Pixel Art**：復古、8-bit/16-bit、像素字體（Press Start 2P）、像素動畫（攻擊、升級）

**配色**：

| 情境 | 色碼 |
|---|---|
| 探索模式 | 綠色 `#1a4d2e` |
| 戰鬥模式 | 紅色 `#4d1a1a` |
| HP | 綠色 `#4caf50` |
| MP | 藍色 `#2196f3` |
| EXP | 金色 `#ffc107` |

## 關鍵設計文檔

深入個別系統時參照（都是設計稿，非驗證過的 spec）：

- 總覽：`docs/ui-design/00-OVERVIEW.md`
- 系統架構：`docs/ui-design/01-SYSTEM-ARCHITECTURE.md`
- 世界地圖：`docs/ui-design/02-WORLD-MAP.md`
- 核心機制：`docs/ui-design/03-CORE-MECHANICS.md`
- 遊戲流程：`docs/ui-design/04-GAME-FLOW.md`
- 戰鬥管理：`docs/ui-design/05-BATTLE-MANAGEMENT.md`

## 相關 roadmap skill

- `battle-management` — 戰鬥系統 / AI dispatch / 多戰鬥平行化（roadmap）
- `map-system` — 雙模式地圖（2D overhead + dialogue，roadmap）

## 使用建議

- 要**實作**新功能 → 先看 `project-overview` 現況，再決定是純 client 工作還是踏入 roadmap
- 要**設計** RPG 細節 → 本 skill + `docs/ui-design/`
- 要驗證跟當前 code 的相容性 → 永遠以實際 code 為準；roadmap 不當 spec 套用
