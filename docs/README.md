# RPG-CLI 文檔目錄

**專案**: RPG-CLI - RPG 風格的 AI CLI 介面
**更新日期**: 2026-02-05

---

## 📚 文檔結構

```
docs/
├── README.md                    # 📖 本文件
├── DOCS-STATUS.md               # ✅ 文檔狀態檢查報告
├── reference/                   # 📘 參考文檔
│   └── Claude-Code-Official-Guide.md
└── design/                      # 🎨 設計文檔
    ├── RPG-CLI-Architecture-v2.md
    ├── RPG-CLI-Concept.md
    ├── Feature-Planning-v2.md
    ├── UI-Interaction-Guide.md
    └── Worktree-System-Design.md
```

---

## 📘 參考文檔

### [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md)

**用途**: Claude Code Skills 和 Subagents 的官方格式參考

**內容**:
- Skills 定義、格式、位置
- Subagents 定義、格式、內建類型
- Skills vs Subagents 對比
- 官方文檔連結

**閱讀順序**: ⭐ 優先閱讀

---

## 🎨 設計文檔

### 1. [RPG-CLI 架構設計 v2.0](design/RPG-CLI-Architecture-v2.md)

**用途**: 整體系統架構設計

**內容**:
- 分層架構（Claude Code → Bridge → UI）
- Skills 和 Subagents 如何符合官方格式
- 遊戲化在 UI 層實現
- Metadata 驅動設計
- 技術堆疊

**閱讀順序**: ⭐⭐ 理解整體架構

**關鍵概念**:
```
┌─────────────────────────────────────────┐
│   RPG UI Layer (React)                  │  ← 遊戲化
│   - HP/MP/經驗值/等級                    │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│   Bridge Layer (Node.js)                │  ← 協調
│   - 追蹤 Skill/Subagent 使用             │
└─────────────────┬───────────────────────┘
                  │ child_process
┌─────────────────▼───────────────────────┐
│   Claude Code CLI                       │  ← 標準
│   - 標準 Skills (官方格式)               │
└─────────────────────────────────────────┘
```

---

### 2. [RPG-CLI 概念文檔](design/RPG-CLI-Concept.md)

**用途**: 原始概念和視覺風格

**內容**:
- RPG-CLI 的核心概念
- 遊戲機制（HP/MP/技能/任務）
- 視覺風格選擇（Pixel Art）
- 技術架構概述

**閱讀順序**: ⭐⭐⭐ 了解專案起源

---

### 3. [功能規劃 v2.0](design/Feature-Planning-v2.md)

**用途**: 完整的功能規劃和實作指南

**內容**:
- Phase 1: 核心基礎（Week 1-2）
  - Bridge Layer 實作
  - React UI 基礎
  - 3-5 個標準 Skills（完整 SKILL.md 範例）
- Phase 2: 遊戲化系統（Week 3-4）
  - skill-metadata.json 設計
  - agent-metadata.json 設計
  - 遊戲邏輯實作
  - Agent 召喚系統
- Phase 3: 進階功能（Week 5-8）
  - 組合技系統
  - 成就系統
  - Worktree 整合
  - 持久化

**閱讀順序**: ⭐⭐⭐⭐ 實作指南

**包含**:
- 5 個完整的 SKILL.md 範例
- GameEngine 完整代碼
- React 組件設計
- 詳細驗收標準

---

### 4. [UI 互動設計](design/UI-Interaction-Guide.md)

**用途**: UI/UX 互動設計與流程

**內容**:
- 主要使用流程
- 介面佈局說明（ASCII 圖）
- 技能施放互動
- 對話互動流程
- 狀態變化動畫
- 響應式設計

**閱讀順序**: ⭐⭐⭐ UI 實作參考

---

### 5. [Worktree 平行世界系統](design/Worktree-System-Design.md)

**用途**: Git Worktree 功能的 RPG 化設計

**內容**:
- 核心概念（Git → RPG 映射）
- 平行世界系統
- 時間線管理
- UI 設計
- 技術實現

**閱讀順序**: ⭐⭐ 特定功能設計

**概念映射**:
```
Git概念          →    RPG概念
─────────────────────────────────
Worktree         →    平行世界
Branch           →    任務線
Checkout         →    傳送
Merge            →    時空融合
```

---

## ✅ 文檔狀態

查看 [DOCS-STATUS.md](DOCS-STATUS.md) 了解所有文檔的檢查狀態。

**總結**: ✅ 所有文檔狀態良好，無需修改，可以開始實作。

---

## 🚀 閱讀建議

### 對於新加入者

**第一次閱讀順序**:
1. 📘 [RPG-CLI 概念文檔](design/RPG-CLI-Concept.md) - 了解是什麼
2. 📘 [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md) - 了解 Claude Code
3. 📘 [RPG-CLI 架構設計](design/RPG-CLI-Architecture-v2.md) - 了解怎麼做
4. 📘 [功能規劃](design/Feature-Planning-v2.md) - 了解實作細節

### 對於實作者

**參考順序**:
1. 📘 [功能規劃](design/Feature-Planning-v2.md) - 主要實作指南
2. 📘 [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md) - 格式參考
3. 📘 [架構設計](design/RPG-CLI-Architecture-v2.md) - 架構參考
4. 📘 [UI 互動設計](design/UI-Interaction-Guide.md) - UI 參考

### 對於特定功能

- **Skills 創建**: [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md) → [功能規劃 Phase 1](design/Feature-Planning-v2.md#phase-1-核心基礎-week-1-2)
- **Subagents 創建**: [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md) → [功能規劃 Phase 2](design/Feature-Planning-v2.md#24-agent-召喚系統)
- **UI 實作**: [UI 互動設計](design/UI-Interaction-Guide.md) → [功能規劃 Phase 1-2](design/Feature-Planning-v2.md)
- **Worktree 功能**: [Worktree 系統設計](design/Worktree-System-Design.md) → [功能規劃 Phase 3](design/Feature-Planning-v2.md#33-worktree-平行世界)

---

## 🔗 外部資源

### Claude Code 官方文檔
- [Skills](https://code.claude.com/docs/en/skills)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Plugins](https://code.claude.com/docs/en/plugins)
- [Hooks](https://code.claude.com/docs/en/hooks)

### 相關標準
- [Agent Skills Open Standard](https://agentskills.io)

---

## 📝 版本記錄

- **v2.0** (2026-02-05): 基於 Claude Code 官方文檔重新設計
  - 移除所有錯誤的 frontmatter 定義
  - 採用官方格式
  - 分層架構設計
  - 完整功能規劃

- **v1.0** (2026-02-05): 初版（已廢棄）
  - 基於錯誤理解的設計
  - 已全部刪除

---

## 🤝 貢獻

如發現文檔問題或有改進建議：
1. 檢查 [DOCS-STATUS.md](DOCS-STATUS.md)
2. 參考 [Claude Code 官方指南](reference/Claude-Code-Official-Guide.md)
3. 確保符合官方格式規範

---

**最後更新**: 2026-02-05
