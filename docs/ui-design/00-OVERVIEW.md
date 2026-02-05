# Code Quest UI 設計手冊

**版本**: v2.0 (完整重組版)
**更新日期**: 2026-02-05
**狀態**: 進行中

---

## 📖 文檔目的

這是 Code Quest 的**完整 UI 設計手冊**，重組自 11 個系統的 ui-design.md 文檔。

本手冊的目標：
- ✅ **一次看到所有畫面** - 按用戶旅程組織，清楚呈現每個畫面
- ✅ **理解轉場流程** - 完整的畫面轉場圖和動畫規格
- ✅ **發現設計衝突** - 對比不同畫面的設計，確保一致性
- ✅ **方便實作參考** - 技術規格、組件庫、實作指南

---

## 🗺️ 文檔結構

```
docs/ui-design/
├── 00-OVERVIEW.md                 ← 你在這裡
│
├── 01-design-system/              ← 設計系統基礎
│   ├── colors-and-typography.md  （顏色、字體、圖標）
│   ├── spacing-and-layout.md     （間距、網格、佈局規則）
│   ├── icons-and-assets.md       （圖標庫、資源規範）
│   └── animation-timing.md       （動畫時序、緩動函數）
│
├── 02-screens/                    ← 所有畫面設計（按旅程組織）
│   ├── exploration/               ← 探索模式畫面
│   │   ├── town-square.md        （城鎮廣場 - 主場景）
│   │   ├── shopping-district.md  （商業街 - 7個商店入口）
│   │   ├── skill-shop.md         （🔮 技能商店）
│   │   ├── skill-forge.md        （⚒️ 工匠鋪）
│   │   ├── knowledge-library.md  （📚 魔法圖書館）
│   │   ├── mercenary-guild.md    （🧙 傭兵公會）
│   │   ├── treasure-vault.md     （🏆 寶物庫）
│   │   ├── cost-exchange.md      （💰 錢莊）
│   │   ├── training-ground.md    （🎯 訓練場）
│   │   ├── guild-hall.md         （公會大廳 - Worktree 管理器）
│   │   ├── tavern.md             （酒館 - AI 對話）
│   │   ├── wilderness.md         （野外場景）
│   │   └── dungeon.md            （副本入口）
│   │
│   ├── battle/                    ← 戰鬥模式畫面
│   │   ├── battle-main.md        （主戰鬥畫面 - 單線戰鬥）
│   │   ├── battle-async.md       （三面板並發戰鬥）
│   │   ├── skill-selection.md    （技能選擇介面）
│   │   ├── companion-panel.md    （夥伴面板）
│   │   ├── summon-display.md     （召喚獸顯示）
│   │   └── enemy-display.md      （敵人資訊顯示）
│   │
│   ├── management/                ← 管理介面
│   │   ├── character-status.md   （角色狀態面板）
│   │   ├── skill-management.md   （技能管理）
│   │   ├── inventory.md          （道具庫存）
│   │   ├── companion-manage.md   （夥伴管理）
│   │   └── settings.md           （遊戲設定）
│   │
│   └── events/                    ← 互動事件和彈窗
│       ├── plan-mode.md          （Plan Mode - 靜止之間）
│       ├── user-question.md      （AskUserQuestion - 魔法師詢問）
│       ├── error-handling.md     （錯誤處理 - 混亂攻擊）
│       ├── permission-request.md （權限請求 - 力量覺醒）
│       ├── level-up.md           （升級慶祝畫面）
│       └── notifications.md      （通知系統）
│
├── 03-flows/                      ← 流程和轉場
│   ├── screen-transitions.md     （畫面轉場總覽圖）
│   ├── battle-flow.md            （戰鬥完整流程）
│   ├── shop-flow.md              （商店購買流程）
│   ├── worktree-flow.md          （Worktree 操作流程）
│   ├── async-battle-flow.md      （非同步戰鬥流程）
│   └── skill-casting-flow.md     （技能施放流程）
│
├── 04-components/                 ← 共用組件庫
│   ├── layout-components.md      （布局組件：面板、容器、網格）
│   ├── status-displays.md        （狀態顯示：HP/MP/EXP 條、等級）
│   ├── cards-and-panels.md       （卡片：技能卡、商品卡、夥伴卡）
│   ├── buttons-and-inputs.md     （按鈕、輸入框、選擇器）
│   ├── modals-and-dialogs.md     （彈窗、對話框、確認框）
│   ├── animations.md             （動畫組件：粒子、過渡、效果）
│   └── typography.md             （文字組件：標題、正文、代碼）
│
├── 05-interactions/               ← 互動設計
│   ├── keyboard-navigation.md    （鍵盤導航和快捷鍵）
│   ├── mouse-interactions.md     （滑鼠點擊、懸停、拖拽）
│   ├── touch-gestures.md         （觸控手勢 - iPad/iPhone）
│   └── accessibility.md          （無障礙設計 - ARIA、高對比）
│
└── 06-specifications/             ← 技術規格
    ├── responsive-breakpoints.md （響應式設計斷點）
    ├── animation-library.md      （動畫庫規範）
    ├── performance-targets.md    （效能目標）
    └── implementation-guide.md   （實作指南）
```

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

**探索模式畫面** (12 個)：
- 城鎮廣場、商業街、7 個商店、公會大廳、酒館、野外、副本

**戰鬥模式畫面** (6 個)：
- 主戰鬥、並發戰鬥、技能選擇、夥伴面板、召喚獸顯示、敵人顯示

**管理介面** (5 個)：
- 角色狀態、技能管理、道具庫存、夥伴管理、設定

**互動事件** (6 個)：
- Plan Mode、用戶詢問、錯誤處理、權限請求、升級、通知

**總計**: 29 個主要畫面

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

### 💻 開發者視角（3-4 小時）

想了解實作細節：

1. **技術規格** - `06-specifications/` 全部文檔
2. **組件庫** - `04-components/` 了解組件 API
3. **互動設計** - `05-interactions/` 了解操作邏輯
4. **流程文檔** - `03-flows/` 了解狀態管理

### 🧪 測試和 QA 視角（2-3 小時）

想驗證設計一致性：

1. **畫面轉場** - `03-flows/screen-transitions.md`
2. **所有畫面** - `02-screens/` 逐一檢查
3. **互動設計** - `05-interactions/` 驗證操作流程
4. **無障礙** - `05-interactions/accessibility.md`

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

## 🔄 文檔版本歷史

### v2.0 (2026-02-05) - 完整重組
- ✅ 創建新的 `docs/ui-design/` 資料夾
- ✅ 按用戶旅程重組所有畫面
- ✅ 提取設計系統基礎元素
- ✅ 創建完整的轉場流程圖
- ✅ 建立共用組件庫
- ✅ 整理互動設計規範

### v1.0 (歷史版本)
- 11 個系統各自的 ui-design.md
- 路徑：`docs/design/{system}/ui-design.md`
- 保留作為歷史參考

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

- [x] 資料夾結構創建
- [ ] 設計系統基礎（進行中）
- [ ] 畫面設計重組（待開始）
- [ ] 組件庫整理（待開始）
- [ ] 流程文檔創建（待開始）
- [ ] 互動設計整理（待開始）
- [ ] 技術規格編寫（待開始）

---

**最後更新**: 2026-02-05
**維護者**: Claude
**狀態**: 🚧 進行中
