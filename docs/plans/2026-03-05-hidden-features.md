# Hidden / Incomplete Features

**Branch:** `feature/chat-streaming-enhancements`
**Date:** 2026-03-05

記錄目前已實作但暫時隱藏、或功能存在但 UI 尚未完整接入的功能。
每個項目附有現有實作說明與 UI 設計方向。

---

## 1. GitStatusPanel（暫時停用）

**狀態：** 已實作，暫時在 ChatPanel 中 comment out

**現有實作：**
- `GitStatusPanel.tsx` — 完整 component，顯示 branch name、clean/dirty 狀態、changed files 列表
- `HeaderBar.tsx` — 無入口按鈕（直接在 MessageList 下方 auto-render）
- Server：`git:status`、`git:log`、`git:diff`、`git:checkout` socket events 均已實作

**停用原因：** 自動顯示在訊息下方，位置和時機不合適，需要重新設計進入方式

**UI 設計方向：**
- 在 `HeaderBar` 右側加 "Git" 按鈕（類似 History / MCP / Raw 的模式）
- 點擊後在左側 side panel 顯示 `GitStatusPanel`（`showGit` state 控制）
- panel 顯示：當前 branch、clean/dirty、changed files 列表
- 操作：Log（最近 commit 列表）、Diff（顯示 diff）、Checkout（輸入 branch 名稱切換）

**恢復方式：** 在 `ChatPanel.tsx` 找到被 comment 的 `GitStatusPanel`，調整為 side panel 模式

---

## 2. ReviewUpsellBanner（Gate 控制，預設隱藏）

**狀態：** 已實作，由 `review_upsell` experiment gate 控制，預設不顯示

**現有實作：**
- `ReviewUpsellBanner.tsx` — banner 元件，顯示「Try the new code review feature」
- 支援 dismiss（儲存在 store `isReviewUpsellDismissed`）
- 已在 `ChatPanel` 的 MessageList 上方 render（gate 關閉時直接 return null）

**UI 設計方向：**
- Banner 放在 MessageList 頂部，accent 色邊框，右側有 Dismiss 按鈕
- Gate 開啟時才顯示，dismiss 後不再出現
- 點擊 banner 主體應導向 code review 功能（目前無 onClick 動作，待補）

**待補：** banner 本體的點擊動作（navigate to review feature）

---

## 3. SessionListPage（`?mode=sessions` URL 參數）

**狀態：** 已實作，透過 URL query string `?mode=sessions` 啟用，非預設模式

**現有實作：**
- `SessionListPage.tsx` — 全螢幕 session 列表頁，使用 `SessionHistory` component
- 支援分頁（每頁 20 筆）、Load More
- 已在 `ChatPanel` 中：`isSessionsMode` 判斷後 render

**UI 設計方向：**
- 訪問 `/?mode=sessions` 時顯示全頁 session 列表，取代 chat 主界面
- 點擊 session 後呼叫 `resumeSession`，切換回正常 chat 模式
- 適合作為獨立的 session 管理入口頁（例如 deep link 或 launcher 頁面）

**待補：** 無明顯的從 chat 界面進入此模式的 UI 入口

---

## 4. SettingsPanel（已刪除，見 orphaned-components.md）

**功能說明：** 讓使用者用 JSON textarea 編輯應用設定，有 JSON parse 驗證。

**Server 端：**
- `settings:get` — 取得目前設定
- `settings:update` — 更新設定
- Hook：`useSettingsActions`（`getSettings`, `updateSettings`）均已實作

**UI 設計方向：**
- 在 HeaderBar 右側加 "Settings" ⚙ 按鈕（或整合進 InitOptionsDialog）
- 點擊後在 side panel 或 Dialog 顯示 JSON textarea
- 有 JSON parse 即時驗證，錯誤時顯示 parse error，正確才允許儲存

---

## 5. TelemetryPanel（已刪除，見 orphaned-components.md）

**功能說明：** 顯示 telemetry events 列表，有 Refresh / Close 按鈕。

**Server 端：**
- `settings:get_telemetry` — 取得 telemetry 資料
- Hook：`useSettingsActions`（`getTelemetry`）已實作

**UI 設計方向：**
- 在 HeaderBar 加 "Telemetry" 按鈕（或整合進 Raw Events panel）
- 顯示 event 列表，支援 Refresh 重新載入
- 可考慮整合進 `RawEventPanel`，作為另一個 tab

---

## 6. PluginPanel（已刪除，見 orphaned-components.md）

**功能說明：** Plugin 安裝 / 解安裝 / 啟用停用管理，含 marketplace 操作。

**Server 端：**
- Hook：`usePluginActions`（`listPlugins`, `installPlugin`, `uninstallPlugin`, `togglePlugin`, `listMarketplaces`, `addMarketplace`, `removeMarketplace`, `refreshMarketplace`）均已實作

**UI 設計方向：**
- 在 HeaderBar 加 "Plugins" 按鈕，點擊後在 side panel 顯示
- 分兩區塊：已安裝 plugins（on/off toggle + uninstall）、Marketplace（browse + install）
- 需先 `listPlugins` 取得已安裝列表，`listMarketplaces` 取得可用 marketplace
