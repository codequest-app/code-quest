# Code Quest 系統索引

**版本**: v1.0
**更新日期**: 2026-02-05

---

## 📖 如何使用本索引

本索引列出 Code Quest 的 11 個核心系統設計。每個系統包含三層文檔：

```
{系統名稱}/
├── requirements.md      ← 功能需求（做什麼、為什麼）
├── ui-design.md         ← 介面設計（怎麼呈現）
└── implementation.md    ← 技術實作（怎麼做）
```

**建議閱讀順序**（新人）：
1. 閱讀 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 了解整體架構
2. 按**依賴順序**閱讀各系統（見下方標註）
3. 每個系統按 requirements → ui-design → implementation 順序閱讀

**建議閱讀順序**（開發者）：
1. 直接查看本索引找到目標系統
2. 閱讀該系統的 requirements.md 了解需求
3. 需要實作細節時閱讀 implementation.md

---

## 🗺️ 系統總覽圖

```
                    [地圖系統]
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   [商店系統]      [場景系統]      [Worktree系統]
        │               ↓
        │          [戰鬥系統]
        │          ↙    ↓    ↘
        │    [夥伴系統] [召喚獸] [非同步戰鬥]
        │               ↓
        └──────────→ [互動事件]
                        ↓
                [多模型整合] + [UI互動]
```

**依賴層級**（從基礎到高階）：
- **L0 基礎**：地圖系統、場景系統、Worktree 系統
- **L1 戰鬥**：戰鬥系統、互動事件
- **L2 擴展**：夥伴系統、召喚獸系統、商店系統
- **L3 高級**：非同步戰鬥系統、多模型整合
- **L4 呈現**：UI 互動系統

---

## 📂 系統列表

### 1. 地圖系統（Map System）
**路徑**: [`map-system/`](./map-system/)
**依賴**: 無（基礎系統）

**系統概要**：
提供 RPG 世界的空間結構，定義城鎮、野外、副本三大區域。每個場所有明確功能和限制，遭遇戰只在特定區域發生。

**核心功能**：
- 🏰 城鎮區域（安全區）：商業街、酒館、公會大廳、靜止之間
- 🌲 野外區域（危險區）：隨機遭遇戰、任務觸發戰鬥
- 🏔️ 副本區域（特殊任務）：劇情戰鬥、Boss 戰
- 地圖導航系統（場所切換、遭遇戰觸發）

**文件說明**：
- `requirements.md`：區域定義、場所列表、遭遇戰機制、導航規則
- `ui-design.md`：地圖導航介面、場所進入動畫、視覺設計
- `implementation.md`：MapManager、LocationManager、EncounterManager

**關鍵設計**：
- 解決抽象「模式」問題，提供具體「空間感」
- 符合傳統 RPG 玩家直覺

---

### 2. 場景系統（Scene System）
**路徑**: [`scene-system/`](./scene-system/)
**依賴**: 地圖系統

**系統概要**：
雙場景系統，區分「探索模式」（非戰鬥）和「戰鬥模式」。不同場景有不同 UI、規則和資源管理。

**核心功能**：
- **探索模式**：自由對話、主菜單、快速資源恢復、Worktree 管理
- **戰鬥模式**：回合制戰鬥、技能施放、慢速資源恢復
- **智能切換**：根據 Prompt 類型自動切換場景
- **Prompt 分析器**：識別對話型 vs 任務型 Prompt

**文件說明**：
- `requirements.md`：雙場景定義、觸發條件、資源規則、切換規則
- `ui-design.md`：探索/戰鬥 UI 差異、切換動畫、音效設計
- `implementation.md`：SceneManager、PromptAnalyzer、ResourceManager

**關鍵設計**：
- Prompt 類型分析（問號+問題詞 = 對話，動作詞 = 任務）
- 場景清晰分離，用戶明確知道當前狀態

---

### 3. 戰鬥系統（Battle System）
**路徑**: [`battle-system/`](./battle-system/)
**依賴**: 場景系統

**系統概要**：
將 AI 對話過程視覺化為 RPG 戰鬥。用戶 Prompt 生成敵人，使用技能造成傷害，完成任務即戰勝敵人。

**核心功能**：
- **敵人生成**：根據 Prompt 複雜度生成敵人（HP、屬性、弱點）
- **回合制戰鬥**：玩家回合 → AI 處理 → 敵人回合
- **傷害計算**：技能威力 × 屬性相性 × 隨機因子
- **戰鬥獎勵**：經驗值、金幣、道具

**文件說明**：
- `requirements.md`：戰鬥流程、敵人生成規則、傷害計算公式、獎勵系統
- `ui-design.md`：戰鬥畫面、技能選擇、動畫效果、戰鬥日誌
- `implementation.md`：BattleManager、EnemyGenerator、DamageCalculator

**關鍵設計**：
- 戰鬥是視覺化包裝，不改變 AI 核心功能
- 自動化戰鬥流程，不增加用戶負擔

---

### 4. 夥伴系統（Companion System）
**路徑**: [`companion-system/`](./companion-system/)
**依賴**: 戰鬥系統

**系統概要**：
將 Subagent 提升為戰鬥夥伴。夥伴有獨立 HP/MP、專屬技能、AI 行為，可在戰鬥中協同作戰並成長。

**核心功能**：
- **Subagent → 夥伴映射**：Agent 類型 → 職業，Memory → 經驗，Model → 能力
- **戰鬥屬性**：HP/MP、攻擊/防禦/速度/智慧
- **夥伴 AI**：自動選擇技能、支援玩家、攻擊敵人
- **成長系統**：經驗值累積、等級提升、技能解鎖

**文件說明**：
- `requirements.md`：夥伴屬性、專屬技能、AI 行為、成長規則
- `ui-design.md`：夥伴面板、召喚動畫、技能釋放、狀態顯示
- `implementation.md`：BattleCompanion 介面、CompanionAI 類、整合到戰鬥管理器

**關鍵設計**：
- 夥伴 = 長期戰友（陪伴整場戰鬥，穩定輸出）
- Subagent 的持續執行 → 夥伴持續存在

---

### 5. 召喚獸系統（Summon Beast System）
**路徑**: [`summon-beast-system/`](./summon-beast-system/)
**依賴**: 戰鬥系統、夥伴系統

**系統概要**：
提供關鍵時刻的強力支援。與夥伴不同，召喚獸是短暫、爆發型的戰術選擇。

**核心功能**：
- **4 種召喚類型**：技能召喚、組合技召喚、MCP 工具召喚、道具召喚
- **4 種行為類型**：immediate（立即）、automatic（自動）、passive（被動）、interactive（互動）
- **召喚管理**：召喚槽、持續回合、行動順序
- **戰術價值**：高 MP 消耗、強力效果、限時使用

**文件說明**：
- `requirements.md`：召喚獸分類、行為類型、召喚條件、戰術價值
- `ui-design.md`：召喚卡片、魔法陣動畫、技能效果、狀態顯示
- `implementation.md`：SummonManager、4 種行為處理器、召喚獸元數據

**關鍵設計**：
- 召喚獸 = 特殊支援（關鍵時刻使用，強力但短暫）
- 與夥伴互補，不衝突

---

### 6. 商店系統（Shop System）
**路徑**: [`shop-system/`](./shop-system/)
**依賴**: 地圖系統

**系統概要**：
將 Skills、MCP、Subagent 管理 RPG 化為 7 個商店。用戶以探索式方式發現和解鎖功能。

**核心功能**：
- **7 個商店**：
  - 🔮 技能商店（Skills 管理）
  - ⚒️ 工匠鋪（技能升級、Skill Forge）
  - 📚 魔法圖書館（知識文檔、教學）
  - 🧙 傭兵公會（Subagent 召喚）
  - 🏆 寶物庫（道具、Buff）
  - 💰 錢莊（成本追蹤、模型切換）
  - 🎯 訓練場（測試、教學）

**文件說明**：
- `requirements.md`：7 個商店的功能需求、解鎖條件、訪問限制
- `ui-design.md`：商店 UI 設計、進入動畫、購買流程
- `implementation.md`：ShopManager、SkillForge 六步驟、MCP 工具整合

**關鍵設計**：
- 所有功能管理融入 RPG 世界
- 探索式發現，而非查閱文檔

---

### 7. 互動事件系統（Interactive Events）
**路徑**: [`interactive-events/`](./interactive-events/)
**依賴**: 戰鬥系統

**系統概要**：
處理戰鬥中需要用戶互動的事件（Plan Mode、AskUserQuestion、錯誤、權限請求），用 RPG 元素包裝。

**核心功能**：
- **4 種事件類型**：
  - Plan Mode → 戰術規劃階段
  - AskUserQuestion → 魔法師詢問
  - 錯誤/警告 → 敵人特殊攻擊
  - 權限請求 → 解鎖新能力確認
- **工具 RPG 化映射**：Bash/Git/文件操作 → 魔法/武器/道具
- **並行操作偵測**：多個工具同時使用 → 組合魔法

**文件說明**：
- `requirements.md`：4 種事件定義、工具映射規則、處理流程
- `ui-design.md`：事件彈窗設計、動畫效果、用戶操作流程
- `implementation.md`：BattleEventModal 組件、ToolDetector、ToolMapper

**額外文件**：
- `tool-mappings.md`：12+ 種工具分類的詳細映射表、MP 消耗速查

**關鍵設計**：
- 保持原有功能正常運作
- 不破壞沉浸感

---

### 8. Worktree 手動管理系統
**路徑**: [`worktree-manual-system/`](./worktree-manual-system/)
**依賴**: 地圖系統（公會大廳）

**系統概要**：
將 Git Worktree 管理 RPG 化為「平行世界」系統。用戶可在公會大廳手動創建、切換、合併平行世界。

**核心功能**：
- **時空管理器（Worktree Manager）**：列表/時間線圖/看板視圖
- **世界類型**：主世界、特性世界、修復世界、實驗世界、熱修復世界
- **世界操作**：創建（MP 10）、切換（MP 5）、合併（MP 20）、刪除
- **Stash 管理**：臨時存檔、跨世界移動

**文件說明**：
- `requirements.md`：Worktree 映射、世界類型、操作流程、限制規則
- `ui-design.md`：時空管理器介面、創建/切換/合併流程、視覺設計
- `implementation.md`：WorktreeManager API、元數據管理、Git 命令封裝

**關鍵設計**：
- 探索模式專屬（城鎮 - 公會大廳）
- 戰鬥中無法操作

---

### 9. 非同步戰鬥系統（Async Battle System）
**路徑**: [`async-battle-system/`](./async-battle-system/)
**依賴**: 戰鬥系統、Worktree 系統

**系統概要**：
解決傳統 CLI 阻塞問題。複雜任務在後台執行，用戶可繼續對話或開啟新戰鬥。每個並發戰鬥自動創建獨立 Worktree。

**核心功能**：
- **智能路由（SmartRouter）**：分析任務複雜度，選擇執行路徑
  - 對話型 → 即時回應
  - 簡單任務 → 主線戰鬥
  - 複雜任務 → 後台戰鬥（自動 Worktree）
- **並發控制**：最多 3 個並發戰鬥，超出則排隊
- **三面板 UI**：主對話（20%）、主戰鬥（50%）、後台戰鬥（30%）
- **代碼隔離**：每個並發戰鬥獨立 Worktree，避免衝突

**文件說明**：
- `requirements.md`：雙軌系統、SmartRouter 算法、並發控制、資源管理
- `ui-design.md`：三面板 UI、戰鬥列表、狀態更新、切換動畫
- `implementation.md`：SmartRouter 實作、BattleInstance Pool、WebSocket 協議

**關鍵設計**：
- 用戶永不阻塞
- 自動 Worktree 管理（戰鬥開始創建，結束合併清理）

---

### 10. 多模型整合系統（Multi-Model Integration）
**路徑**: [`multi-model-integration/`](./multi-model-integration/)
**依賴**: 戰鬥系統、商店系統（錢莊）

**系統概要**：
支持 Claude 和 Gemini 多模型，提供統一抽象層。智能路由選擇最適合的模型，並追蹤成本。

**核心功能**：
- **模型抽象層**：IModelAdapter 介面，統一 API
- **智能路由**：根據任務類型、成本、能力選擇模型
  - 對話 → Gemini Flash（低成本）
  - 代碼生成 → Claude Sonnet（高質量）
  - 複雜任務 → Claude Opus（最強能力）
- **成本追蹤**：實時成本計算、預算警告、使用統計
- **UI 整合**：錢莊顯示成本面板、模型選擇器

**文件說明**：
- `requirements.md`：模型抽象需求、路由策略、成本管理規則
- `ui-design.md`：模型配置 UI、成本面板、選擇器、警告提示
- `implementation.md`：IModelAdapter、ClaudeAdapter、GeminiAdapter、ModelRegistry、MultiModelRouter、CostTracker

**關鍵設計**：
- 模型無關架構，易於擴展新模型
- 成本優化為核心目標

---

### 11. UI 互動系統（UI Interaction）
**路徑**: [`ui-interaction/`](./ui-interaction/)
**依賴**: 所有系統（呈現層）

**系統概要**：
完整 UI 規範，定義所有互動細節、動畫效果、無障礙設計。確保一致的用戶體驗。

**核心功能**：
- **6 大設計原則**：即時回饋、狀態可見、減少認知負擔、漸進式揭露、錯誤容忍、無障礙
- **完整介面規範**：狀態欄、對話區、輸入區、技能欄
- **動畫系統**：技能施放、HP/MP 變化、升級、傷害數字
- **無障礙**：鍵盤導航、螢幕閱讀器、高對比模式
- **效能優化**：虛擬滾動、lazy loading、RAF 動畫

**文件說明**：
- `requirements.md` (513 行)：核心原則、用戶流程、介面要求、特殊場景、無障礙、效能
- `ui-design.md` (176 行)：完整佈局、UI 組件、動畫時序、響應式設計
- `implementation.md` (699 行)：ProgressBar、TypewriterEffect、虛擬滾動、串流處理、錯誤處理

**關鍵設計**：
- Pixel Art 風格
- 60 FPS 流暢動畫
- WCAG AA 級無障礙

---

## 🔍 快速查找

### 按功能查找

**基礎架構**：
- 空間結構 → [地圖系統](#1-地圖系統map-system)
- 模式切換 → [場景系統](#2-場景系統scene-system)

**戰鬥相關**：
- 核心戰鬥 → [戰鬥系統](#3-戰鬥系統battle-system)
- 戰鬥夥伴 → [夥伴系統](#4-夥伴系統companion-system)
- 爆發支援 → [召喚獸系統](#5-召喚獸系統summon-beast-system)
- 戰鬥互動 → [互動事件系統](#7-互動事件系統interactive-events)
- 並發戰鬥 → [非同步戰鬥系統](#9-非同步戰鬥系統async-battle-system)

**功能管理**：
- 功能商店 → [商店系統](#6-商店系統shop-system)
- 分支管理 → [Worktree 系統](#8-worktree-手動管理系統)

**高級功能**：
- 多模型 → [多模型整合](#10-多模型整合系統multi-model-integration)
- UI 規範 → [UI 互動系統](#11-ui-互動系統ui-interaction)

### 按閱讀目的查找

**我想了解整體架構**：
1. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
2. 本索引文件
3. [地圖系統](#1-地圖系統map-system) → [場景系統](#2-場景系統scene-system)

**我想開發戰鬥功能**：
1. [場景系統](#2-場景系統scene-system)
2. [戰鬥系統](#3-戰鬥系統battle-system)
3. [互動事件系統](#7-互動事件系統interactive-events)

**我想開發 UI**：
1. [UI 互動系統](#11-ui-互動系統ui-interaction)
2. 相關系統的 `ui-design.md`

**我想擴展功能**：
1. [商店系統](#6-商店系統shop-system)
2. [夥伴系統](#4-夥伴系統companion-system) 或 [召喚獸系統](#5-召喚獸系統summon-beast-system)

---

## 📝 文檔約定

### 文件命名
- `requirements.md`：需求定義（功能、限制、場景）
- `ui-design.md`：介面設計（佈局、動畫、視覺）
- `implementation.md`：技術實作（架構、API、數據結構）
- `README.md`：系統導覽（概要、快速參考）

### 版本控制
所有文件頂部包含：
```markdown
**日期**: YYYY-MM-DD
**版本**: vX.Y
**狀態**: 設計階段 | 開發中 | 已完成
```

### 參考格式
- 系統間引用：`參見 [戰鬥系統](../battle-system/requirements.md)`
- 內部引用：`參見 [敵人生成](#敵人生成)`

---

## 🚀 下一步

### 對於新加入者
1. 閱讀 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
2. 按依賴順序閱讀系統（L0 → L1 → L2 → L3 → L4）
3. 每個系統的 requirements.md 提供核心理解

### 對於開發者
1. 查看本索引找到相關系統
2. 閱讀 `requirements.md` 了解需求
3. 閱讀 `implementation.md` 了解技術細節
4. 參考 `ui-design.md` 實作 UI

### 對於設計師
1. 閱讀系統的 `ui-design.md`
2. 參考 [UI 互動系統](./ui-interaction/) 的完整規範
3. 遵循 Pixel Art 視覺風格

---

**維護者**: Code Quest Team
**最後更新**: 2026-02-05
**總系統數**: 11
**總文件數**: 33 個核心文件 + 1 個工具映射

