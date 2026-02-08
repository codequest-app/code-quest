# Code Quest 實作規劃總覽

**創建日期**: 2026-02-07
**版本**: v1.0
**基於**: Code Quest UI 設計規格 v2.x

---

## 📚 文檔說明

本實作規劃基於以下設計文檔產生：
- **Skills**: `/project-overview`, `/map-system`, `/battle-management`
- **UI 設計**: `docs/ui-design/` (11個系統完整規格)
- **系統架構**: `docs/ui-design/01-SYSTEM-ARCHITECTURE.md`

**閱讀順序建議**:
1. 本文件（總覽）- 理解整體規劃
2. `phase-0-foundation.md` - 專案基礎架構
3. 根據開發階段閱讀對應 Phase 文檔

---

## 🎯 專案目標

**Code Quest** 是一個 RPG 遊戲化的 Claude Code CLI 包裝器，核心設計原則：

```
✅ 三層架構        - UI層遊戲化，不修改 Claude 核心
✅ Dragon Quest 風格 - 單一焦點、選單驅動、沉浸式體驗
✅ 11 個核心系統    - 從地圖到 UI，完整的遊戲生態
✅ 雙模式探索      - 2D 地圖模式 + 對話模式
✅ 多 AI 並行      - Haiku/Sonnet/Opus 同時運作
```

---

## 🏗️ 系統架構

### 三層架構

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

### 11 個核心系統（依賴層級 L0-L4）

| 層級 | 系統 | 優先級 | UI 複雜度 |
|------|------|--------|----------|
| **L0** | 場景系統、地圖系統、商店系統、Worktree系統 | P0 | 中-高 |
| **L1** | 戰鬥系統 | P0 | 很高 |
| **L2** | 夥伴系統、召喚獸系統、互動事件系統 | P1 | 中-高 |
| **L3** | 非同步戰鬥系統、多模型整合系統 | P2 | 很高 |
| **L4** | UI 互動系統 | P3 | 最高 |

---

## 📅 實作階段規劃

### Phase 0: 專案基礎 (2 週)
**目標**: 建立開發環境、Bridge Layer、型別系統

- [x] Monorepo 結構設定 (pnpm + Turborepo)
- [x] TypeScript 型別定義完整覆蓋
- [x] Bridge Layer: CLI 進程管理
- [x] WebSocket 通訊層
- [x] 開發工具鏈 (Vite, ESLint, Prettier, Vitest)

**交付**: 可啟動 Claude CLI 並監聽事件的基礎架構

**文檔**: [`phase-0-foundation.md`](./phase-0-foundation.md)

---

### Phase 1: L0-L1 核心系統 (4 週)
**目標**: 實作場景、地圖、基礎戰鬥系統

**Week 1-2**: 場景與地圖系統
- [ ] 場景系統 (探索/戰鬥模式切換)
- [ ] 地圖系統 - **對話模式優先**
  - [ ] 城鎮 5 場所
  - [ ] 野外 4 區域
  - [ ] 副本 4 個
- [ ] 場所導航與移動邏輯

**Week 3-4**: 戰鬥系統基礎
- [ ] SmartRouter (複雜度分析 0-15分)
- [ ] Dialog Track (簡單對話)
- [ ] Main Sync (同步戰鬥)
- [ ] 敵人生成系統
- [ ] HP/MP/EXP 計算與顯示

**交付**: 可進行簡單戰鬥的遊戲原型

**文檔**: [`phase-1-core-systems.md`](./phase-1-core-systems.md)

---

### Phase 2: L2 擴展系統 (4 週)
**目標**: 豐富戰鬥體驗和策略深度

**Week 1**: 夥伴系統
- [ ] Subagent → RPG 夥伴映射
- [ ] 夥伴召喚與管理 UI
- [ ] 夥伴戰鬥邏輯（最多 2 個）

**Week 2**: 召喚獸系統
- [ ] 工具並行 → 召喚獸映射
- [ ] 4 種召喚類型 (被動/互動/即時/爆發)
- [ ] 召喚獸效果與動畫

**Week 3**: 商店系統
- [ ] 7 個商店完整實作
  - 技能商店、工具商店、道具商店
  - 傭兵公會、知識圖書館、鍛造所、訓練場
- [ ] 購買限制與冷卻機制

**Week 4**: 互動事件系統
- [ ] Plan Mode RPG 化（戰術規劃）
- [ ] AskUserQuestion 敵人發問
- [ ] 工具執行動畫與 MP 消耗視覺化
- [ ] 錯誤處理 RPG 化

**交付**: 完整的戰鬥策略系統和商店生態

**文檔**: [`phase-2-extended-systems.md`](./phase-2-extended-systems.md)

---

### Phase 3: L3 高級系統 (4 週)
**目標**: 多 AI 並行和進階功能

**Week 1-2**: 非同步戰鬥系統
- [ ] Battle Async 執行路徑
- [ ] 最多 3 個並發戰鬥管理
- [ ] Worktree 自動創建與隔離
- [ ] 戰鬥狀態追蹤

**Week 2-3**: 戰鬥管理 UI
- [ ] DQ 風格快速選單（Tab 彈出）
- [ ] 派遣系統 (6 步驟流程)
- [ ] 監控模式（完全背景/觀察/即時）
- [ ] 通知系統（需決策/完成/錯誤）

**Week 3-4**: 多模型整合
- [ ] Haiku/Sonnet/Opus 切換
- [ ] **路由規則待實作時定義** ⚠️
- [ ] 成本追蹤與顯示
- [ ] Worktree 手動管理 UI

**交付**: 完整支援多 AI 並行的進階系統

**文檔**: [`phase-3-advanced-systems.md`](./phase-3-advanced-systems.md)

---

### Phase 4: L4 UI 完善 (3 週)
**目標**: DQ 風格視覺和動畫

**Week 1**: Dragon Quest 風格 UI
- [ ] 金色邊框、黑色背景選單
- [ ] Pixel Art 字體 (Press Start 2P)
- [ ] 配色方案（探索綠/戰鬥紅）

**Week 2**: 動畫系統
- [ ] 戰鬥動畫（攻擊、技能、傷害數字）
- [ ] 場景切換動畫
- [ ] HP/MP 條動態變化
- [ ] 升級動畫

**Week 3**: 2D 俯視地圖模式（可選）
- [ ] Pixel Art 地圖繪製
- [ ] 角色移動動畫
- [ ] 建築互動視覺效果
- [ ] 與對話模式的無縫切換

**交付**: 視覺達到遊戲級品質

**文檔**: [`phase-4-ui-polish.md`](./phase-4-ui-polish.md)

---

### Phase 5: 新手引導 (2 週)
**目標**: 降低學習曲線

- [ ] 首次啟動教學流程
- [ ] 互動式教學關卡
- [ ] 提示系統（Hint System）
- [ ] 遊戲內說明文檔
- [ ] 快捷鍵參考卡

**交付**: 新手友好的引導體驗

**文檔**: [`phase-5-tutorial.md`](./phase-5-tutorial.md)

---

### Phase 6: 成就與優化 (2 週)
**目標**: 長期動力和穩定性

- [ ] 成就系統（定義、觸發、通知）
- [ ] 性能優化（動畫、記憶體）
- [ ] 錯誤處理與日誌
- [ ] 大型專案壓力測試

**交付**: 穩定的 v1.0 版本

**文檔**: [`phase-6-achievements.md`](./phase-6-achievements.md)

---

## 📁 檔案結構

```
code-quest/
├── apps/
│   ├── electron/                    # Electron 主進程
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   └── bridge/                  # Bridge Layer
│   │       ├── cli-manager.ts
│   │       ├── event-transformer.ts
│   │       └── websocket-server.ts
│   │
│   └── web/                         # React 前端
│       ├── src/
│       │   ├── systems/             # 11 個遊戲系統
│       │   │   ├── scene/
│       │   │   ├── map/
│       │   │   ├── battle/
│       │   │   ├── companion/
│       │   │   ├── summon/
│       │   │   ├── shop/
│       │   │   ├── events/
│       │   │   ├── async-battle/
│       │   │   ├── multi-model/
│       │   │   ├── worktree/
│       │   │   └── ui/
│       │   │
│       │   ├── components/          # UI 組件
│       │   ├── stores/              # Zustand 狀態
│       │   ├── hooks/
│       │   └── assets/
│       │
│       └── package.json
│
├── packages/
│   ├── types/                       # TypeScript 型別
│   │   ├── game.ts
│   │   ├── cli.ts
│   │   └── events.ts
│   │
│   ├── constants/                   # 遊戲常數
│   │   ├── game-config.ts
│   │   ├── formulas.ts
│   │   └── tool-mappings.ts
│   │
│   └── utils/                       # 共用工具
│       ├── smart-router.ts
│       └── formula-calculator.ts
│
├── docs/
│   ├── design/                      # 原始設計文檔
│   ├── ui-design/                   # UI 設計規格
│   └── implementation/              # 實作規劃（本目錄）
│
├── tests/
├── package.json
├── tsconfig.json
└── turbo.json
```

---

## 🛠️ 技術棧（待最終確認）

### 方案 A: Electron + React (推薦)
```yaml
前端: React 18, TypeScript, TailwindCSS, Framer Motion, Zustand
桌面: Electron
Bridge: Node.js 20+, ws, node-pty
工具: Vite, Vitest, ESLint, Prettier
```

**優勢**: 成熟生態、完整桌面權限、直接本地檔案存取

### 方案 B: Tauri + Next.js (輕量)
```yaml
前端: Next.js 14, TypeScript, TailwindCSS
桌面: Tauri (Rust)
Bridge: 同方案 A
```

**優勢**: 極小體積 (~10MB)、更好性能、現代技術棧

**決策點**: Phase 0 開始前需確認 ⚠️

---

## 🎯 關鍵決策點

### 決策 1: 技術棧選擇
- **時間點**: Phase 0 開始前
- **狀態**: ⚠️ 待討論
- **選項**: Electron vs Tauri vs Web App
- **影響**: 整個專案架構

### 決策 2: 地圖實作優先順序
- **時間點**: Phase 1
- **狀態**: ✅ 已確認
- **決定**: 對話模式優先，2D 地圖 Phase 4 可選

### 決策 3: 多模型路由規則
- **時間點**: Phase 3 開始前
- **狀態**: ⚠️ 待定義
- **需討論**:
  - 自動路由邏輯（任務類型？成本？）
  - 手動選擇 UI
  - Fallback 策略

### 決策 4: 音效與音樂
- **時間點**: Phase 4
- **狀態**: ⚠️ 待討論
- **選項**: 使用現有音效庫 vs 原創 vs 暫不實作

---

## 📊 里程碑與時程

| 里程碑 | 預計週數 | 累計 | 交付內容 |
|--------|---------|------|---------|
| M0: 專案啟動 | Week 0 | 0 | 技術棧確認、環境設置 |
| M1: 基礎架構 | Week 1-2 | 2 | Bridge Layer 可運行 |
| M2: 核心原型 | Week 3-6 | 6 | 可進行簡單戰鬥 |
| M3: 完整戰鬥 | Week 7-10 | 10 | 夥伴、召喚獸、商店 |
| M4: 多 AI 支援 | Week 11-14 | 14 | 並行戰鬥、派遣系統 |
| M5: 視覺完善 | Week 15-17 | 17 | DQ 風格、動畫 |
| M6: 新手引導 | Week 18-19 | 19 | 教學系統 |
| M7: v1.0 發布 | Week 20-21 | 21 | 成就、優化、穩定 |

**總預計時間**: 21 週 (約 5 個月)

**團隊假設**: 1-2 位全職開發者

---

## 🚀 開發流程

### Git 工作流
```
main              # 穩定版本
  └── develop     # 開發主線
       ├── feature/phase-1-scene
       ├── feature/phase-1-map
       └── feature/phase-2-companion
```

### Commit 規範
```
feat(scene): 實作場景系統基礎架構
fix(battle): 修復 HP 計算錯誤
docs(impl): 更新 Phase 1 實作文檔
test(map): 新增地圖系統單元測試
```

### 測試策略
- **單元測試**: 核心邏輯、公式計算、工具函數
- **整合測試**: 系統間互動、Bridge Layer 通訊
- **E2E 測試**: 完整遊戲流程、戰鬥循環

---

## 📚 相關文檔索引

### Skills (快速理解)
- `/project-overview` - 專案總覽與核心概念
- `/map-system` - 地圖與探索系統
- `/battle-management` - 戰鬥管理與 AI 派遣

### UI 設計文檔
- `docs/ui-design/00-OVERVIEW.md` - 總覽
- `docs/ui-design/01-SYSTEM-ARCHITECTURE.md` - 系統架構
- `docs/ui-design/02-WORLD-MAP.md` - 世界地圖
- `docs/ui-design/03-CORE-MECHANICS.md` - 核心機制
- `docs/ui-design/04-GAME-FLOW.md` - 遊戲流程
- `docs/ui-design/05-BATTLE-MANAGEMENT.md` - 戰鬥管理詳細設計
- `docs/ui-design/systems/` - 11 個系統詳細規格

### 實作文檔（本目錄）
- `00-OVERVIEW.md` (本文) - 總覽
- `phase-0-foundation.md` - Phase 0 詳細規劃
- `phase-1-core-systems.md` - Phase 1 詳細規劃
- `phase-2-extended-systems.md` - Phase 2 詳細規劃
- `phase-3-advanced-systems.md` - Phase 3 詳細規劃
- `phase-4-ui-polish.md` - Phase 4 詳細規劃
- `phase-5-tutorial.md` - Phase 5 詳細規劃
- `phase-6-achievements.md` - Phase 6 詳細規劃

---

## ✅ 下一步行動

1. **技術棧決策會議** - 確認 Electron vs Tauri
2. **閱讀 `phase-0-foundation.md`** - 了解基礎架構細節
3. **環境設置** - 安裝依賴、配置工具鏈
4. **開始 Phase 0** - 建立專案骨架

---

**提示**: 本文檔基於 Code Quest 完整設計規格產生，確保實作與設計一致性。
開始實作前請務必通過 skills 理解專案核心概念！
