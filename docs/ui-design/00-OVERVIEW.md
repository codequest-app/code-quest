# Code Quest UI 設計手冊

**版本**: v3.0 (最終完整版)
**更新日期**: 2026-02-06
**狀態**: ✅ 已完成

---

## 📖 文檔目的

這是 Code Quest 的**完整 UI 設計手冊**，重組自 11 個系統的 ui-design.md 文檔。

本手冊的目標：
- ✅ **一次看到所有畫面** - 按用戶旅程組織，清楚呈現每個畫面
- ✅ **理解轉場流程** - 完整的畫面轉場圖和動畫規格
- ✅ **發現設計衝突** - 對比不同畫面的設計，確保一致性
- ✅ **方便實作參考** - 技術規格、組件庫、實作指南

### 📊 文檔統計

- **總文檔數**: 93 個
- **總大小**: ~1.45 MB
- **總行數**: ~51,820 行
- **類別數**: 6 大類別 + 5 份索引/報告文檔

---

## 🎉 最終版本新增內容

### Stage 3 新增功能（2026-02-05）

**31 個共享組件** - 完整組件庫：
- 核心組件：Button, Input, Dropdown, Checkbox, Radio, Slider 等
- 卡片組件：Skill Card, Item Card, Companion Card, Enemy Card, Shop Card, Quest Card
- 佈局組件：Panel, Grid, List, Tabs, Accordion, Menu, Breadcrumb
- 戰鬥組件：Battle Log, Action Menu, Damage Number, Status Effect
- 互動組件：Modal, Dialog, Toast, Hotkey Hint
- 狀態組件：Status Bar, Progress Bar

**10 個詳細流程文檔** - 附帶 ASCII 流程圖：
- user-journey.md - 完整用戶旅程
- battle-flow.md - 戰鬥系統流程
- async-battle-flow.md - 非同步戰鬥流程
- shop-flow.md - 商店購買流程
- skill-creation-flow.md - 技能創建流程
- companion-flow.md - 夥伴系統流程
- worktree-flow.md - Worktree 操作流程
- error-recovery-flow.md - 錯誤恢復流程
- screen-transitions.md - 畫面轉場總覽

**5 個互動設計文檔**：
- keyboard-navigation.md - 完整鍵盤導航和快捷鍵
- mouse-interactions.md - 滑鼠互動模式
- touch-gestures.md - 觸控手勢支援
- accessibility.md - WCAG 2.1 AA 無障礙規範
- README.md - 互動設計總覽

**6 個技術規格文檔**：
- responsive-design.md - 響應式設計規範
- animation-library.md - 動畫庫和效果
- implementation-guide.md - 實作指南和最佳實踐
- performance-optimization.md - 效能優化指南
- browser-compatibility.md - 瀏覽器相容性
- README.md - 技術規格總覽

### Stage 4 品質報告（2026-02-06）

**4 份綜合品質報告**：
- DESIGN-CONSISTENCY-REPORT.md (20K) - 設計一致性分析
- TRANSITION-COMPLETENESS-REPORT.md (20K) - 轉場完整性驗證
- REFERENCE-VALIDATION-REPORT.md (20K) - 文檔引用驗證
- QUICK-REFERENCE.md (28K) - 快速參考手冊

**文檔索引**：
- MASTER-INDEX.md - 完整主索引（本次新增）
- 支援多種查找方式：字母順序、類別、功能、角色、標籤

---

## 🗺️ 文檔結構

```
docs/ui-design/
├── 00-OVERVIEW.md                      ← 你在這裡
├── MASTER-INDEX.md                     ← 完整主索引（多種查找方式）
├── QUICK-REFERENCE.md                  ← 快速參考手冊
│
├── 01-design-system/                   ← 設計系統基礎（2 文檔）
│   ├── colors-and-typography.md       （顏色、字體、圖標）
│   └── animation-timing.md            （動畫時序、緩動函數）
│
├── 02-screens/                         ← 所有畫面設計（32+4 文檔）
│   ├── exploration/                    ← 探索模式畫面（14 文檔）
│   │   ├── README.md                  （探索模式總覽）
│   │   ├── town-square.md            （城鎮廣場 - 主場景）
│   │   ├── shopping-district.md      （商業街 - 7個商店入口）
│   │   ├── skill-shop.md             （🔮 技能商店）
│   │   ├── skill-forge.md            （⚒️ 工匠鋪）
│   │   ├── knowledge-library.md      （📚 魔法圖書館）
│   │   ├── mercenary-guild.md        （🧙 傭兵公會）
│   │   ├── treasure-vault.md         （🏆 寶物庫）
│   │   ├── cost-exchange.md          （💰 錢莊）
│   │   ├── training-ground.md        （🎯 訓練場）
│   │   ├── guild-hall.md             （公會大廳 - Worktree 管理器）
│   │   ├── tavern.md                 （酒館 - AI 對話）
│   │   ├── wilderness.md             （野外場景）
│   │   └── dungeon.md                （副本入口）
│   │
│   ├── battle/                         ← 戰鬥模式畫面（7 文檔）
│   │   ├── README.md                  （戰鬥系統總覽）
│   │   ├── battle-main.md            （主戰鬥畫面 - 單線戰鬥）
│   │   ├── battle-async.md           （三面板並發戰鬥）
│   │   ├── skill-selection.md        （技能選擇介面）
│   │   ├── companion-panel.md        （夥伴面板）
│   │   ├── summon-display.md         （召喚獸顯示）
│   │   └── enemy-display.md          （敵人資訊顯示）
│   │
│   ├── management/                     ← 管理介面（5 文檔）
│   │   ├── character-status.md       （角色狀態面板）
│   │   ├── skill-management.md       （技能管理）
│   │   ├── inventory.md              （道具庫存）
│   │   ├── companion-manage.md       （夥伴管理）
│   │   └── settings.md               （遊戲設定）
│   │
│   └── events/                         ← 互動事件和彈窗（6 文檔）
│       ├── plan-mode.md              （Plan Mode - 靜止之間）
│       ├── user-question.md          （AskUserQuestion - 魔法師詢問）
│       ├── error-handling.md         （錯誤處理 - 混亂攻擊）
│       ├── permission-request.md     （權限請求 - 力量覺醒）
│       ├── level-up.md               （升級慶祝畫面）
│       └── notifications.md          （通知系統）
│
├── 03-flows/                           ← 流程和轉場（10 文檔）
│   ├── README.md                       （流程總覽）
│   ├── user-journey.md                 （完整用戶旅程）
│   ├── screen-transitions.md           （畫面轉場總覽圖）
│   ├── battle-flow.md                  （戰鬥完整流程）
│   ├── async-battle-flow.md            （非同步戰鬥流程）
│   ├── shop-flow.md                    （商店購買流程）
│   ├── skill-creation-flow.md          （技能創建流程）
│   ├── companion-flow.md               （夥伴系統流程）
│   ├── worktree-flow.md                （Worktree 操作流程）
│   └── error-recovery-flow.md          （錯誤恢復流程）
│
├── 04-components/                      ← 共用組件庫（31+3 文檔）
│   ├── README.md                       （組件庫總覽）
│   ├── COMPONENT-INDEX.md              （組件索引）
│   ├── COMPLETION-SUMMARY.md           （完成度總結）
│   │
│   ├── [核心組件]
│   ├── button.md                       （按鈕組件）
│   ├── input.md                        （輸入框）
│   ├── dropdown.md                     （下拉選單）
│   ├── checkbox.md                     （複選框）
│   ├── radio.md                        （單選按鈕）
│   ├── slider.md                       （滑桿）
│   │
│   ├── [卡片組件]
│   ├── skill-card.md                   （技能卡片）
│   ├── item-card.md                    （道具卡片）
│   ├── companion-card.md               （夥伴卡片）
│   ├── enemy-card.md                   （敵人卡片）
│   ├── shop-card.md                    （商店卡片）
│   ├── quest-card.md                   （任務卡片）
│   │
│   ├── [佈局組件]
│   ├── panel.md                        （面板容器）
│   ├── grid.md                         （網格佈局）
│   ├── list.md                         （列表組件）
│   ├── tabs.md                         （標籤頁）
│   ├── accordion.md                    （摺疊面板）
│   ├── menu.md                         （選單）
│   ├── breadcrumb.md                   （麵包屑導航）
│   │
│   ├── [戰鬥組件]
│   ├── battle-log.md                   （戰鬥日誌）
│   ├── action-menu.md                  （行動選單）
│   ├── damage-number.md                （傷害數字）
│   ├── status-effect.md                （狀態效果）
│   │
│   ├── [互動組件]
│   ├── modal.md                        （模態彈窗）
│   ├── dialog.md                       （對話框）
│   ├── toast.md                        （提示訊息）
│   ├── hotkey-hint.md                  （快捷鍵提示）
│   │
│   └── [狀態組件]
│       ├── status-bar.md               （狀態條 HP/MP/EXP）
│       └── progress-bar.md             （進度條）
│
├── 05-interactions/                    ← 互動設計（5 文檔）
│   ├── README.md                       （互動設計總覽）
│   ├── keyboard-navigation.md          （鍵盤導航和快捷鍵）
│   ├── mouse-interactions.md           （滑鼠點擊、懸停、拖拽）
│   ├── touch-gestures.md               （觸控手勢 - iPad/iPhone）
│   └── accessibility.md                （無障礙設計 - WCAG 2.1 AA）
│
├── 06-specifications/                  ← 技術規格（6 文檔）
│   ├── README.md                       （技術規格總覽）
│   ├── responsive-design.md            （響應式設計斷點）
│   ├── animation-library.md            （動畫庫規範）
│   ├── implementation-guide.md         （實作指南）
│   ├── performance-optimization.md     （效能優化）
│   └── browser-compatibility.md        （瀏覽器相容性）
│
└── [品質報告]                           ← 品質檢查報告（4 文檔）
    ├── DESIGN-CONSISTENCY-REPORT.md    （設計一致性分析）
    ├── TRANSITION-COMPLETENESS-REPORT.md（轉場完整性驗證）
    └── REFERENCE-VALIDATION-REPORT.md  （文檔引用驗證）
```

**總計**:
- 設計系統: 2 文檔
- 畫面設計: 32 文檔 + 4 README
- 流程文檔: 10 文檔
- 組件庫: 31 文檔 + 3 索引文檔
- 互動設計: 5 文檔
- 技術規格: 6 文檔
- 品質報告: 4 文檔
- **總共: 92 個文檔**

---

## 🎮 用戶旅程總覽

### 主要畫面流程

```
[遊戲啟動]
    ↓
┌─────────────────┐
│  城鎮廣場        │ ← 探索模式主場景
│ (Town Square)   │
└────────┬────────┘
         │
    ┌────┼────┬────────┐
    ↓    ↓    ↓        ↓
 [商業街][公會][酒館] [野外]
  7商店  Worktree AI對話 冒險
    │     │      │       │
    │     │      │       ├─ 遭遇戰
    │     │      │       └─ 任務觸發
    │     │      │           ↓
    │     │      │      [戰鬥畫面]
    │     │      │       ├─ 主戰鬥
    │     │      │       ├─ 並發戰鬥
    │     │      │       └─ 互動事件
    │     │      │           ↓
    │     │      │      [戰鬥結束]
    │     │      │           ↓
    └─────┴──────┴───────[返回探索]
```

### 畫面分類

**探索模式畫面** (13 個)：
- 城鎮廣場、商業街、7 個商店、公會大廳、酒館、野外、副本

**戰鬥模式畫面** (6 個)：
- 主戰鬥、並發戰鬥、技能選擇、夥伴面板、召喚獸顯示、敵人顯示

**管理介面** (5 個)：
- 角色狀態、技能管理、道具庫存、夥伴管理、設定

**互動事件** (6 個)：
- Plan Mode、用戶詢問、錯誤處理、權限請求、升級、通知

**其他文檔** (2 個)：
- 流程總覽 (README.md)、品質報告

**總計**: 32 個主要畫面文檔

---

## 🔍 快速查找索引

### 按功能查找

**地圖和導航**:
- 城鎮廣場: `02-screens/exploration/town-square.md`
- 野外場景: `02-screens/exploration/wilderness.md`
- 畫面轉場: `03-flows/screen-transitions.md`

**商店系統** (7 個商店):
- 商業街總覽: `02-screens/exploration/shopping-district.md`
- 技能商店: `02-screens/exploration/skill-shop.md`
- 工匠鋪: `02-screens/exploration/skill-forge.md`
- 魔法圖書館: `02-screens/exploration/knowledge-library.md`
- 傭兵公會: `02-screens/exploration/mercenary-guild.md`
- 寶物庫: `02-screens/exploration/treasure-vault.md`
- 錢莊: `02-screens/exploration/cost-exchange.md`
- 訓練場: `02-screens/exploration/training-ground.md`

**戰鬥系統**:
- 主戰鬥畫面: `02-screens/battle/battle-main.md`
- 並發戰鬥: `02-screens/battle/battle-async.md`
- 戰鬥流程: `03-flows/battle-flow.md`
- 非同步戰鬥流程: `03-flows/async-battle-flow.md`

**Worktree 系統**:
- 公會大廳 (時空管理器): `02-screens/exploration/guild-hall.md`
- Worktree 流程: `03-flows/worktree-flow.md`

**夥伴和召喚獸**:
- 夥伴面板: `02-screens/battle/companion-panel.md`
- 召喚獸顯示: `02-screens/battle/summon-display.md`
- 傭兵公會 (召喚): `02-screens/exploration/mercenary-guild.md`

**互動事件**:
- Plan Mode: `02-screens/events/plan-mode.md`
- 用戶詢問: `02-screens/events/user-question.md`
- 錯誤處理: `02-screens/events/error-handling.md`

### 按組件查找

**狀態顯示**:
- HP/MP/EXP 條: `04-components/status-displays.md`
- 進度條組件: `04-components/status-displays.md`

**卡片組件**:
- 技能卡片: `04-components/cards-and-panels.md`
- 商品卡片: `04-components/cards-and-panels.md`
- 夥伴卡片: `04-components/cards-and-panels.md`

**彈窗組件**:
- Modal 彈窗: `04-components/modals-and-dialogs.md`
- 確認對話框: `04-components/modals-and-dialogs.md`

**動畫**:
- 動畫時序規範: `01-design-system/animation-timing.md`
- 動畫組件庫: `04-components/animations.md`
- 動畫實作: `06-specifications/animation-library.md`

### 按流程查找

**購買流程**:
- 商店購買: `03-flows/shop-flow.md`

**戰鬥流程**:
- 完整戰鬥流程: `03-flows/battle-flow.md`
- 技能施放: `03-flows/skill-casting-flow.md`

**管理流程**:
- Worktree 操作: `03-flows/worktree-flow.md`

---

## 🚀 開發者快速入門

想要快速開始實作 Code Quest UI？按照以下步驟：

### 步驟 1：閱讀快速參考 (5 分鐘)
- 📖 **QUICK-REFERENCE.md** - 包含所有必要的設計 token、色彩、字體、間距、動畫時序
- 快速查找常用組件和模式

### 步驟 2：查看實作指南 (15 分鐘)
- 📖 **06-specifications/implementation-guide.md** - 技術架構和實作方法
- 了解項目結構、技術棧、開發流程

### 步驟 3：學習組件庫 (30 分鐘)
- 📖 **04-components/README.md** - 組件庫總覽
- 📖 **04-components/COMPONENT-INDEX.md** - 快速查找組件
- 瀏覽常用組件：Button, Input, Modal, Card 等

### 步驟 4：理解業務流程 (30 分鐘)
- 📖 **03-flows/user-journey.md** - 完整用戶旅程
- 📖 **03-flows/battle-flow.md** - 戰鬥系統流程（核心功能）
- 根據要實作的功能選擇對應流程文檔

### 步驟 5：查看畫面設計 (按需)
- 📖 **02-screens/** - 根據功能查看對應畫面
- 每個畫面文檔包含完整的佈局、組件、互動和技術規格

### 💡 實作提示

**前端開發者**：
1. 從設計系統開始：`01-design-system/`
2. 建立基礎組件：`04-components/`（核心組件優先）
3. 實作畫面：`02-screens/`（從簡單畫面開始）
4. 添加互動：`05-interactions/`
5. 優化效能：`06-specifications/performance-optimization.md`

**後端開發者**：
1. 理解用戶旅程：`03-flows/user-journey.md`
2. 查看業務流程：`03-flows/`（重點關注狀態管理和 API 需求）
3. 參考實作指南的 API 整合章節：`06-specifications/implementation-guide.md`

**設計師**：
1. 設計系統基礎：`01-design-system/`
2. 組件規範：`04-components/`
3. 畫面設計：`02-screens/`
4. 互動模式：`05-interactions/`

---

## 📚 閱讀建議

### 🚀 快速開始（30 分鐘）

想快速了解整體 UI 設計：

1. **閱讀用戶旅程** - 本文檔的「用戶旅程總覽」
2. **查看轉場流程圖** - `03-flows/screen-transitions.md`
3. **瀏覽主要畫面** - 城鎮廣場、戰鬥主畫面

### 🎨 設計師視角（2-3 小時）

想了解設計系統和視覺規範：

1. **設計系統基礎** - `01-design-system/` 全部文檔
2. **組件庫** - `04-components/` 了解所有可用組件
3. **主要畫面** - `02-screens/` 瀏覽所有畫面設計
4. **動畫規範** - `06-specifications/animation-library.md`

### 💻 前端開發者視角（3-4 小時）

想了解實作細節：

1. **實作指南** - `06-specifications/implementation-guide.md`（必讀）
2. **快速參考** - `QUICK-REFERENCE.md`（隨時查找）
3. **技術規格** - `06-specifications/` 全部文檔
4. **組件庫** - `04-components/` 了解組件 API
5. **互動設計** - `05-interactions/` 了解操作邏輯
6. **流程文檔** - `03-flows/` 了解狀態管理
7. **效能優化** - `06-specifications/performance-optimization.md`
8. **響應式設計** - `06-specifications/responsive-design.md`

### 🔧 後端開發者視角（1-2 小時）

關注 API 整合和業務邏輯：

1. **用戶旅程** - `03-flows/user-journey.md`（必讀）
2. **戰鬥系統** - `03-flows/battle-flow.md`（核心邏輯）
3. **非同步戰鬥** - `03-flows/async-battle-flow.md`
4. **實作指南** - `06-specifications/implementation-guide.md`（API 整合章節）
5. **其他流程** - `03-flows/`（根據功能需求選擇）

**推薦順序**：
- 先理解完整用戶流程
- 再深入各個子系統的業務邏輯
- 參考畫面設計了解前端需要的數據結構

### 🧪 QA/測試視角（2-3 小時）

想驗證設計一致性和功能完整性：

1. **快速參考** - `QUICK-REFERENCE.md`（功能概覽）
2. **用戶旅程** - `03-flows/user-journey.md`（測試路徑）
3. **畫面轉場** - `03-flows/screen-transitions.md`（轉場驗證）
4. **所有流程** - `03-flows/`（業務邏輯測試）
5. **互動設計** - `05-interactions/`（操作流程驗證）
6. **無障礙** - `05-interactions/accessibility.md`（無障礙測試）
7. **鍵盤導航** - `05-interactions/keyboard-navigation.md`（鍵盤測試）
8. **瀏覽器相容性** - `06-specifications/browser-compatibility.md`
9. **品質報告** - 了解已知問題：
   - `DESIGN-CONSISTENCY-REPORT.md`
   - `TRANSITION-COMPLETENESS-REPORT.md`
   - `REFERENCE-VALIDATION-REPORT.md`

### 📋 專案經理視角（30 分鐘）

快速了解項目範圍和狀態：

1. **本文檔** - `00-OVERVIEW.md`（項目總覽）
2. **快速參考** - `QUICK-REFERENCE.md`（功能清單）
3. **實作指南** - `06-specifications/implementation-guide.md`（實作路線圖）
4. **品質報告** - 了解項目品質和已知問題（3 份報告）
5. **用戶旅程** - `03-flows/user-journey.md`（用戶體驗流程）

---

## 🎯 設計原則

Code Quest UI 設計遵循以下核心原則：

### 1. **RPG 沉浸感**
- Pixel Art 視覺風格
- RPG 化的操作和反饋
- 統一的幻想世界觀

### 2. **即時反饋**
- 所有操作有立即反饋
- HP/MP/EXP 變化有動畫
- 技能施放有視覺效果

### 3. **狀態可見**
- 重要狀態始終可見（狀態欄）
- AI 處理狀態清晰指示
- 連線狀態實時顯示

### 4. **漸進式揭露**
- 進階功能初始隱藏
- 按需展開複雜介面
- 新手友好的引導

### 5. **無障礙優先**
- 鍵盤導航完整支援
- 螢幕閱讀器相容
- 高對比模式

### 6. **效能優化**
- 虛擬捲動（大量數據）
- 動畫 60 FPS
- 響應時間 < 200ms

---

## 📊 品質報告

為確保文檔品質和一致性，我們提供以下綜合報告：

### DESIGN-CONSISTENCY-REPORT.md (20K)
**設計一致性分析報告**

檢查項目：
- ✅ 色彩使用一致性（40+ 文檔檢查）
- ✅ 字體規格一致性
- ✅ 間距和佈局一致性
- ✅ 組件使用標準化
- ✅ 動畫時序統一性

結果：整體一致性達標，少數建議已記錄。

### TRANSITION-COMPLETENESS-REPORT.md (20K)
**畫面轉場完整性驗證**

檢查項目：
- ✅ 所有畫面的進入轉場定義
- ✅ 所有畫面的退出轉場定義
- ✅ 轉場動畫規格完整性
- ✅ 流程文檔與畫面文檔一致性

結果：主要轉場已定義，部分次要轉場可按需補充。

### REFERENCE-VALIDATION-REPORT.md (20K)
**文檔引用驗證報告**

檢查項目：
- ✅ 內部文檔引用正確性
- ✅ 組件引用有效性
- ✅ 設計系統引用一致性
- ✅ 交叉引用完整性

結果：所有重要引用已驗證，少數建議性引用待優化。

### QUICK-REFERENCE.md (28K)
**快速參考手冊**

包含內容：
- 🎨 完整設計 token（色彩、字體、間距、動畫）
- 🧩 所有組件快速查找表
- 📱 所有畫面快速索引
- ⌨️ 常用快捷鍵速查
- 🔄 重要流程速覽

用途：開發時隨時查找，無需翻閱長文檔。

---

## 🗂️ 文檔索引

除了本總覽文檔，我們還提供專門的索引文檔：

### MASTER-INDEX.md
**完整主索引 - 支援多種查找方式**

提供以下索引方式：
1. **字母順序索引** - 所有 92 個文檔按字母排序
2. **類別索引** - 按 6 大類別組織
3. **功能索引** - 按遊戲功能分組（戰鬥、技能、商店等）
4. **角色索引** - 按團隊角色推薦閱讀清單
5. **標籤索引** - 按文檔標籤查找
6. **常見問題快速查找** - "我想找..."式查找

**使用場景**：
- 不確定文檔在哪裡時
- 想按特定方式瀏覽文檔時
- 需要找某個功能相關的所有文檔時

### 其他索引文檔

- **04-components/COMPONENT-INDEX.md** - 組件專用索引
- **04-components/README.md** - 組件庫總覽
- **03-flows/README.md** - 流程文檔總覽
- **05-interactions/README.md** - 互動設計總覽
- **06-specifications/README.md** - 技術規格總覽

---

## 📝 文檔維護指南

### 何時更新文檔

**必須更新**：
- ✅ UI 設計發生變更時
- ✅ 新增畫面或組件時
- ✅ 流程邏輯改變時
- ✅ 技術規格調整時

**建議更新**：
- 📝 發現文檔描述不清時
- 📝 實作中發現遺漏細節時
- 📝 用戶反饋 UI 問題時

### 如何保持文檔同步

**開發前**：
1. 閱讀相關設計文檔
2. 確認設計規格是否完整
3. 如有疑問，先更新文檔

**開發中**：
1. 發現設計問題立即記錄
2. 實作細節與文檔不符時討論
3. 必要時更新設計文檔

**開發後**：
1. 驗證實作是否符合設計
2. 更新文檔中的實作狀態
3. 記錄實作過程中的設計決策

### 如何報告不一致

發現設計不一致時：

1. **記錄問題**：
   - 哪個文檔？哪個章節？
   - 不一致的具體內容是什麼？
   - 預期應該是什麼？

2. **提交 Issue**：
   - 標題：[UI設計] 文檔名 - 簡短描述
   - 內容：詳細說明不一致處
   - 優先級：高/中/低

3. **建議修改**：
   - 如果有修改建議，直接提供
   - 參考其他類似設計

### 版本控制

**文檔版本規則**：
- 大版本（v1.0 → v2.0）：整體重組或重大變更
- 小版本（v2.0 → v2.1）：新增章節或大量內容
- 補丁版本（v2.1.0 → v2.1.1）：錯誤修正或小更新

**更新日期**：
- 每次更新都要更新文檔頂部的日期
- 在版本歷史中記錄主要變更

**變更追蹤**：
- 重大變更記錄在版本歷史中
- 小修改可在文檔末尾添加"最後更新"註記

---

## 🔄 文檔版本歷史

### v3.0 (2026-02-06) - 最終完整版 ✨
**Stage 4: 品質檢查與優化完成**

新增內容：
- ✅ 4 份品質報告（設計一致性、轉場完整性、引用驗證、快速參考）
- ✅ MASTER-INDEX.md 完整主索引
- ✅ 更新 00-OVERVIEW.md 新增多個實用章節
- ✅ 文檔統計：92 個文檔、1.4 MB、50,485 行

改進：
- ✅ 新增"開發者快速入門"指南
- ✅ 新增"文檔維護指南"
- ✅ 新增"品質報告"章節
- ✅ 優化閱讀建議（按角色分類）
- ✅ 完善文檔結構展示

### v2.0 (2026-02-05) - 完整重組
**Stage 1-3: 基礎建設與內容創建**

完成內容：
- ✅ 創建新的 `docs/ui-design/` 資料夾結構
- ✅ 按用戶旅程重組所有 32 個畫面設計
- ✅ 提取設計系統基礎元素（2 文檔）
- ✅ 創建 10 個詳細流程文檔（附 ASCII 流程圖）
- ✅ 建立 31 個共用組件完整規格
- ✅ 整理 5 個互動設計規範文檔
- ✅ 編寫 6 個技術規格文檔
- ✅ 添加各類別 README 文檔

### v1.0 (2024-2025) - 歷史版本
**原始分散式文檔**

- 11 個系統各自的 ui-design.md
- 路徑：`docs/design/{system}/ui-design.md`
- 保留作為歷史參考
- 內容已完整遷移至 v2.0+

---

## 📝 貢獻指南

### 新增畫面設計

在 `02-screens/` 對應目錄新增文檔，使用以下模板：

```markdown
# 畫面名稱

## 畫面概述
- 功能定位
- 進入條件
- 退出條件

## 完整布局
[ASCII 藝術展示]

## 組件清單
[使用的組件，引用共用組件]

## 互動設計
[操作方式]

## 轉場設計
[進入/退出動畫]

## 狀態變化
[不同狀態下的顯示]

## 技術規格
[響應式、無障礙、效能]
```

### 新增組件

在 `04-components/` 對應文檔新增組件規格。

### 更新流程

在 `03-flows/` 更新或新增流程文檔。

---

## 🔗 相關文檔

### 系統設計文檔
- 系統總覽: `docs/design/SYSTEMS_INDEX.md`
- 依賴關係圖: `docs/design/DEPENDENCY_DIAGRAM.md`
- 專案總覽: `docs/design/PROJECT_OVERVIEW.md`

### 原始 UI 設計文檔
- 保留在 `docs/design/{system}/ui-design.md`
- 作為歷史參考

---

## ✅ 完成狀態

**所有階段已完成！** 🎉

- [x] Stage 1: 資料夾結構創建與設計系統基礎
- [x] Stage 2: 畫面設計重組（32 個畫面）
- [x] Stage 3: 組件庫（31 個）、流程文檔（10 個）、互動設計（5 個）、技術規格（6 個）
- [x] Stage 4: 品質報告（4 個）、文檔索引、最終優化

**當前狀態**：
- ✅ 文檔結構完整
- ✅ 內容覆蓋全面
- ✅ 品質檢查完成
- ✅ 索引和導航完善
- ✅ 可供實作參考

---

**最後更新**: 2026-02-06
**維護者**: Code Quest 開發團隊
**狀態**: ✅ 已完成並持續維護中
