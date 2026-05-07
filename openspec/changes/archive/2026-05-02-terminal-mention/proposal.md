## Why

目前 `@terminal` mention 功能混在 `file:list` handler 裡——`listTerminals()` 把 active session channel IDs 當作 `type: 'terminal'` 的 file result 混入回傳。這有幾個問題：

1. **語意錯誤** — terminal/session 不是 file，不應該從 `file:list` 回傳
2. **功能不完整** — 真實 Extension 的 `@terminal` 是讀取 VS Code terminal 的輸出內容（最後 100 行），讓 Claude 能看到 terminal 裡的訊息作為 context。我們目前只列出 channel ID，沒有實際讀取內容
3. **依賴 `filesystem-service` change** — 該 change 會從 `file:list` 移除 terminal 混入邏輯

需要一個獨立的 `@terminal` mention 機制，正確實作 extension 的行為。

## What Changes

### Extension 的 @terminal 行為（參考）
- `AT_MENTION_TERMINAL=true` 環境變數啟用（feature flag）
- `@terminal:xxx` 搜尋 VS Code 的 terminal tabs by name
- 選中後讀取該 terminal 的最後 100 行輸出作為 context 給 Claude
- 跟 `@browser:xxx` 類似，是 mention context sources 的一種

### 我們的實作規劃
- 新增獨立的 socket event `mention:search`，統一處理所有 mention 來源（file、terminal、未來可能加的 browser 等）
- 或：新增 `terminal:list` event 獨立列出 active sessions
- Terminal mention 選中後，讀取該 session 的最後 N 行 terminal output 作為 context
- MentionDropdown 支援多種 mention source 的 icon 和 render

### 不改動
- file:list 的 terminal 移除在 `filesystem-service` change 處理
- 現有 `terminal:read` handler 已存在，可能可以復用

## Capabilities

### New Capabilities
- `terminal-mention`: 獨立的 @terminal mention 機制——列出 active sessions、讀取 terminal 輸出、作為 Claude context

### Modified Capabilities
（無）

## Impact

### Server
- 可能新增 `mention:search` 或 `terminal:list` socket event
- 復用現有 `terminal:read` handler

### Client
- `MentionDropdown` 支援從多個 source（file + terminal）合併結果
- `ComposeInput` 的 mention 搜尋邏輯調整

### Dependencies
- 依賴 `filesystem-service` change 完成 file:list 的 terminal 移除
