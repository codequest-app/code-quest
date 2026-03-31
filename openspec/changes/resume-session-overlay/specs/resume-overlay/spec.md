## ADDED Requirements

### Requirement: /resume 觸發 session list overlay
使用者輸入 `/resume` 或從 CommandMenu 選 "Resume conversation" 時，SHALL 在 ChatPanel 內顯示 session list overlay。

#### Scenario: 輸入 /resume 顯示 overlay
- **WHEN** 使用者在輸入框輸入 `/resume` 並送出
- **THEN** ChatPanel 內顯示 session list overlay，列出按 cwd 過濾的歷史 sessions

#### Scenario: CommandMenu Resume conversation
- **WHEN** 使用者從 CommandMenu 選擇 "Resume conversation"
- **THEN** ChatPanel 內顯示 session list overlay

### Requirement: Session list 按 cwd 過濾
Overlay SHALL 只顯示與當前 cwd 相同的 sessions。

#### Scenario: 過濾結果只包含同 cwd 的 sessions
- **WHEN** overlay 顯示時，當前 cwd 為 `/projects/foo`
- **THEN** 只顯示 cwd 為 `/projects/foo` 的 sessions

### Requirement: Session list UI 對齊 extension
每個 session row SHALL 顯示 title（左）和相對日期（右），格式如 `7d`。

#### Scenario: Session row 顯示格式
- **WHEN** session list 載入完成
- **THEN** 每個 row 顯示 title（truncated）在左，相對日期（如 `7d`）在右

### Requirement: 搜尋框 filter
Overlay 頂部 SHALL 有搜尋框，輸入文字即時過濾 session title。

#### Scenario: 搜尋過濾
- **WHEN** 使用者在搜尋框輸入 "fix"
- **THEN** 只顯示 title 包含 "fix" 的 sessions

### Requirement: Hover 顯示 rename/delete
Session row hover 時 SHALL 顯示 rename 和 delete 按鈕。

#### Scenario: Hover 顯示操作按鈕
- **WHEN** 使用者 hover 在一個 session row 上
- **THEN** 該 row 右側顯示 rename 和 delete 圖示按鈕

### Requirement: 選 session 後 resume
選擇 session SHALL 走 `session:launch` + `resume: sessionId`，關閉 overlay。

#### Scenario: 點擊 session 啟動 resume
- **WHEN** 使用者點擊一個 session row
- **THEN** 發送 `session:launch { channelId, resume: selectedSessionId }`，overlay 關閉，CLI replay 歷史事件重建對話

### Requirement: 移除 WorkspaceLayout history sidebar
WorkspaceLayout 的 history sidebar SHALL 被移除，所有 session history 功能由 overlay 取代。

#### Scenario: WorkspaceLayout 不再有 history sidebar
- **WHEN** 應用程式啟動
- **THEN** WorkspaceLayout 沒有 history sidebar toggle 按鈕和側邊面板
