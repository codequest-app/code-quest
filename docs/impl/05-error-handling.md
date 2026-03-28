# 錯誤處理規範

## 錯誤類型總覽

| 類型 | 發生位置 | 傳遞方式 |
|------|---------|---------|
| CLI spawn 失敗 | Extension Host | `close_channel` + `error` 欄位 |
| CLI 執行中斷 | CLI stdout loop 結束 | `close_channel` + `error` |
| control_request 失敗 | CLI | `control_response { subtype: "error" }` |
| WebView request 失敗 | Extension Host | `response { type: "error", message }` |
| 認證失效 | Extension Host | `update_state` + `authStatus` |
| 工具權限拒絕 | WebView 使用者操作 | `response { result: { behavior: "deny" } }` |
| Channel 不存在 | Extension Host | 拋出 Error（不通知 WebView） |

---

## CLI 層面錯誤

### spawn 失敗

```javascript
// Extension 行為
catch (err) {
  closeChannel(channelId, true, String(err))
  // → 送 { type: "close_channel", channelId, error: "錯誤訊息" } 給 WebView
}
```

**WebView 應對**：顯示錯誤訊息，允許使用者重試（重新 `launch_claude`）。

### stdout loop 異常結束

```javascript
// 正常結束（CLI 自行退出）
closeChannel(channelId, true)  // error 為 undefined

// 異常結束
closeChannel(channelId, true, String(err))  // 帶 error 訊息
```

**區分方式**：`close_channel.error` 是否存在。

### control_response error

```json
{
  "type": "control_response",
  "response": {
    "subtype": "error",
    "request_id": "xxx",
    "error": "錯誤訊息"
  }
}
```

Extension 收到後會 reject 對應的 Promise，通常轉為 WebView response error。

---

## WebView ↔ Extension 層面錯誤

### Response error 格式

```json
{
  "type": "response",
  "requestId": "xxx",
  "response": {
    "type": "error",
    "message": "錯誤描述"
  }
}
```

### 常見 Request 錯誤條件

| Request | 錯誤條件 | 錯誤訊息 |
|---------|---------|---------|
| `authenticate_mcp_server` | 無 channelId | `"channelId is required for authenticate_mcp_server"` |
| `apply_settings` | Channel 不存在 | `"Channel not found: {channelId}"` |
| `ensure_chrome_mcp_enabled` | 無 channelId | `"channelId is required for ensure_chrome_mcp_enabled"` |
| `login` | 無 AuthManager | `"Authentication is not supported in this environment"` |
| 未知 request type | — | `"Unknown message: {type}"` |

---

## 請求超時與取消

### AbortSignal 機制

`sendRequest(channelId, request, abortSignal)` 支援取消：

```
若 abortSignal.aborted 在送出前就是 true
  → 立即 reject，不送出請求

若 abortSignal 在等待回應時 abort
  → 送出 { type: "cancel_request", targetRequestId }
  → reject with "aborted"
```

**WebView 應對**：收到 `cancel_request` 時，關閉對應的等待 UI（如工具權限確認對話框）。

---

## 認證錯誤

### 認證失效流程

```
CLI 回傳認證錯誤
      │
      ▼
Extension closeAllChannelsWithCredentialChange()
  - 關閉所有 Channel
  - 清除設定快取
      │
      ▼
pushStateUpdate() → update_state
  - authStatus: { status: "logged_out" }
      │
      ▼
WebView 顯示登入畫面
```

### 憑證變更後重啟

使用者重新登入後：
1. `login_response` 回傳新 auth
2. `closeAllChannelsWithCredentialChange()` 關閉舊 channels
3. WebView 重新 `launch_claude`

---

## pending_permission_requests 批次處理

### 機制說明

當 CLI 的 `control_response` 中包含 `pending_permission_requests` 欄位時，Extension 透過事件驅動方式逐一處理權限請求。

```javascript
// 實現位置：Query.processPendingPermissionRequests()
// 觸發時機：收到 control_response 且含 pending_permission_requests 時
```

### 批次處理流程

```
CLI 回傳 control_response
  └─ 含 pending_permission_requests[]
      │
      ▼
processPendingPermissionRequests()
      │
      ▼
逐一 for-of 遍歷每個請求
      │
      ▼
對每個請求呼叫 processControlRequest()
  → 送 can_use_tool 到 WebView
  → 等待使用者回應
  → 送 control_response 回 CLI
      │
      ▼
下一個請求（序列化執行）
```

### 設計目的

- 防止多個工具同時彈出確認對話框（序列化處理）
- 確保每個請求都得到處理（不丟失）
- 事件驅動：僅在收到含 pending 請求的 response 時才觸發

---

## 邊界條件處理

### 重複 launch 同一 channelId

```javascript
if (this.channels.has(channelId))
  throw Error(`Channel already exists: ${channelId}`)
```

**WebView 應對**：不要重複使用相同 channelId，每次 `launch_claude` 都產生新的隨機 ID。

### Channel 不存在時送 io_message

```javascript
// Extension
transportMessage(channelId, message, done) {
  let channel = this.channels.get(channelId);
  if (!channel) throw Error(`Channel not found: ${channelId}`);
  ...
}
```

**WebView 應對**：在 `launch_claude` 完成（收到 `update_state`）前不送 `io_message`。

### 多個 Channel 同時存在

- 每個訊息都帶 `channelId`，Extension 自動路由
- `update_state` 用 `channelId: ""` 廣播
- `pushChannelStateUpdate(channelId)` 只更新特定 Channel

### WebSocket 模式（Terminal）

若 `claudeCode.useTerminal = true`，使用 WebSocket JSON-RPC 而非 stdio，協議格式相同但傳輸層不同。連線斷開時 Extension 應通知 WebView 並嘗試重連。

---

## 錯誤恢復建議

| 情況 | 建議做法 |
|------|---------|
| CLI spawn 失敗 | 顯示錯誤，提供「重試」按鈕（重新 `launch_claude`） |
| Channel 意外關閉 | 顯示「對話已中斷」，提供恢復選項（帶相同 sessionId 重新 launch） |
| 工具權限確認超時 | 自動 decline，通知使用者 |
| 認證失效 | 自動導向登入頁，完成後恢復對話 |
| control_request 失敗 | 記錄 log，通知使用者操作失敗，不中斷對話 |
