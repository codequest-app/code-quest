## Why

目前 Session History 只能在 ChatPanel 內透過 `ChatInputArea` 的 ☰ 按鈕打開一個浮動 overlay（`SessionDropdown`），只能 resume 到當前 tab。使用者無法總覽所有 project 的歷史 session，也無法按 project（cwd）分組瀏覽。

file-explorer-panel change 會建立 ActivityBar + Sidebar 基礎設施。在此基礎上，新增一個 Session History Panel 作為 ActivityBar 的第二個 panel，讓使用者可以按 project 分組瀏覽所有歷史 session，並選擇 resume 或開新 tab。

**前置依賴：** file-explorer-panel（提供 ActivityBar + Sidebar 基礎設施）。

## What Changes

### 新增 Session History Panel
- ActivityBar 新增 🕐 History icon
- 點擊後在左側 Sidebar 顯示 Session History Panel
- Sessions 按 `cwd`（project）分組顯示，每個 project 可展開/收合
- 支援搜尋（復用現有 `SessionHistory` component 的搜尋功能）
- Double-click session → resume 到新 tab
- Double-click project header → 在該 cwd 開新 tab

### 不改動現有 ChatInputArea 的 resume 功能
- `ChatInputArea` 的 ☰ 按鈕和 `SessionDropdown` overlay **保持不變**
- 兩者是不同用途：ChatInputArea 的 resume 是「在當前 tab 切換 session」，History Panel 是「總覽所有 project 的歷史」

### 新增 SidebarContext
- 提供 `activePanel` + `setActivePanel`，讓任何 component 都能切換 sidebar panel
- 解決 ChatInputArea 等深層 component 需要觸發 sidebar 切換的 prop drilling 問題

## Capabilities

### New Capabilities
- `session-history-panel`: Session History Panel 的完整功能——按 project 分組的 session 列表、搜尋、resume、開新 tab
- `sidebar-context`: SidebarContext 提供全域 sidebar panel 切換能力

### Modified Capabilities
（無——現有 ChatInputArea/SessionDropdown 不改動）

## Impact

### Client
- **新增 component**：`SessionHistoryPanel`（組合現有 `SessionHistory` + project 分組邏輯）
- **新增 context**：`SidebarContext`（`activePanel` + `setActivePanel`）
- **修改 WorkspaceLayout**：sidebar state 從 local state 搬到 SidebarContext，ActivityBar items 新增 History entry
- **復用現有**：`SessionHistory` component、`useSession().listSessions` hook、`SessionSummary` type（已有 `cwd` 欄位）

### Server
- 無改動（`session:list` API 已回傳 `cwd` 欄位，足夠 client 做 group by）

### Dependencies
- 依賴 file-explorer-panel 提供的 ActivityBar + Sidebar 基礎設施
