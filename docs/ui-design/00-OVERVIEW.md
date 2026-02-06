# Code Quest - 系統規劃總覽

**版本**: v2.0
**更新日期**: 2026-02-06
**狀態**: 設計完成，待實作

---

## 專案願景

將 Claude Code CLI 包裝成具有 RPG 遊戲風格的網頁介面，讓使用者以更有趣、更具互動性的方式與 AI 助手協作。專案代號 **Code Quest**，世界名稱 **CodeLand**。

---

## 遊戲化映射表

| 真實世界 | RPG 概念 | 說明 |
|---------|---------|------|
| 用戶 | 冒險者 / 玩家 | 操作者即主角 |
| Claude AI | NPC 導師 / 魔法師 | AI 以角色形式呈現 |
| Skills（技能檔） | 魔法技能 | 官方格式的 Skill，UI 層映射為 RPG 魔法 |
| Subagents | 戰鬥夥伴 | 持續存在的協作 Agent |
| 召喚獸 | 短暫爆發支援 | 技能/組合技/MCP 工具觸發的強力召喚 |
| 對話任務 | Quest（任務） | 每次任務型 Prompt 即一場戰鬥 |
| API 配額 | HP（生命值） | 配額耗盡 = HP 歸零 |
| 工具使用 | MP（魔力值）消耗 | 施放技能、召喚都消耗 MP |
| 經驗累積 | EXP → 等級成長 | 完成任務獲得經驗 |
| 金幣 | Gold | 用於商店購買與升級 |
| Git Worktree | 平行世界 | 每個 Worktree 是一條獨立時間線 |
| Plan Mode | 靜止之間（時間暫停的規劃室） | 深度思考的獨立空間 |
| 錯誤 / 警告 | 敵人特殊攻擊 / 反噬傷害 | 非預期情況的遊戲化呈現 |

---

## 三層架構

```
┌─────────────────────────────────────────┐
│   RPG UI Layer (React)                  │  ← 遊戲化呈現
│   - HP/MP/經驗值/等級顯示               │
│   - 技能冷卻、施放動畫                   │
│   - 角色成長、成就系統                   │
│   - 地圖導航、場景切換                   │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│   Bridge Layer (Node.js)                │  ← 協調層
│   - 攔截 Claude Code 輸出               │
│   - 追蹤 Skill/Subagent 使用            │
│   - 計算遊戲數據 (MP/EXP/Gold)          │
│   - 管理戰鬥狀態與 Worktree             │
└─────────────────┬───────────────────────┘
                  │ child_process
┌─────────────────▼───────────────────────┐
│   Claude Code CLI                       │  ← 標準 Claude
│   - 標準 Skills (符合官方 YAML 格式)     │
│   - 標準 Subagents (符合官方格式)        │
│   - 真實的 AI 功能，不做任何修改         │
└─────────────────────────────────────────┘
```

**關鍵原則**：遊戲化在 UI 層與 Bridge 層實現，**絕不修改** Claude Code 核心。Skills 和 Subagents 完全符合官方格式，RPG 元數據（MP 消耗、冷卻、動畫）存放在獨立的 JSON 配置中。

---

## 設計原則

1. **分層架構** — 遊戲化邏輯與 AI 核心嚴格分離
2. **尊重官方** — 不修改 Claude Code 核心，利用標準功能
3. **漸進增強** — 保持 Claude 原始功能，添加遊戲化樂趣
4. **可擴展性** — Metadata 驅動，易於擴展新系統與內容
5. **空間感優先** — 用具體場所取代抽象模式，符合 RPG 直覺
6. **自動化戰鬥** — 戰鬥只是視覺包裝，不增加用戶操作負擔

---

## 文件閱讀指南

本資料夾包含 18 個文件，分為三個層級：

### 頂層文件（先讀這些，建立全局觀）

| 順序 | 文件 | 內容 |
|------|------|------|
| 1 | **本文件** `00-OVERVIEW.md` | 專案願景、映射表、架構、閱讀指南 |
| 2 | `01-SYSTEM-ARCHITECTURE.md` | 11 個系統的依賴關係與層級圖 |
| 3 | `02-WORLD-MAP.md` | RPG 世界地圖：城鎮、野外、副本 |
| 4 | `03-CORE-MECHANICS.md` | HP/MP/EXP、成長公式、冷卻、組合技 |
| 5 | `04-GAME-FLOW.md` | 遊戲迴圈、場景切換、玩家旅程 |

### 系統詳述（按興趣或開發需求查閱）

位於 `systems/` 目錄，共 11 個文件，每個文件以統一格式描述一個系統：

- 系統概述 → 依賴關係 → 核心規則 → 系統內地圖 → 與其他系統的互動 → 設計決策說明

建議按依賴層級順序閱讀：L0 → L1 → L2 → L3 → L4

### 參考文件

位於 `references/` 目錄：

| 文件 | 內容 |
|------|------|
| `tool-mappings.md` | Claude Code 工具 → RPG 魔法的完整映射表 |
| `glossary.md` | 技術概念 ↔ RPG 概念對照表 |

---

## 來源文件對照

本資料夾的內容整理自 `docs/design/` 的 11 個系統設計：

| 本資料夾文件 | 主要來源 |
|-------------|---------|
| `00-OVERVIEW.md` | `PROJECT_OVERVIEW.md` |
| `01-SYSTEM-ARCHITECTURE.md` | `SYSTEMS_INDEX.md` + `DEPENDENCY_DIAGRAM.md` |
| `02-WORLD-MAP.md` | `map-system/requirements.md` + `ui-design.md` |
| `03-CORE-MECHANICS.md` | `battle-system/req` + `scene-system/req` + `PROJECT_OVERVIEW` |
| `04-GAME-FLOW.md` | `scene-system/req` + `battle-system/req` + `map-system/req` |
| `systems/01-11` | 對應系統的 `requirements.md` + `ui-design.md` |
| `references/tool-mappings.md` | `interactive-events/tool-mappings.md` |
| `references/glossary.md` | 所有文件中的概念對照整理 |
