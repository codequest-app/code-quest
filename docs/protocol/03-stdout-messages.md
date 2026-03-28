## 2. Subprocess stdout 接收的訊息格式

### 2.1 基礎讀取機制

**位置**：第 27285–27308 行

- 使用 `readline` 模組按行讀取 stdout
- 每行必須是有效的 JSON，空行忽略

---

### 2.2 Control Response 訊息（Claude CLI → Extension）

#### 成功響應

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "對應的 request_id",
    "response": {}
  }
}
```

#### 錯誤響應

```json
{
  "type": "control_response",
  "response": {
    "subtype": "error",
    "request_id": "對應的 request_id",
    "error": "錯誤訊息"
  }
}
```

---

### 2.3 所有 stdout 訊息類型

**位置**：第 30948–30985 行（`readMessages()` 方法）

| Type | 描述 | 處理方式 |
|------|------|---------|
| `control_response` | 控制請求的回應 | 由 `pendingControlResponses` 處理 |
| `control_request` | CLI 發起的控制請求 | 呼叫 `handleControlRequest()` |
| `control_cancel_request` | 取消請求 | 呼叫 `handleControlCancelRequest()` |
| `keep_alive` | 保活訊號 | 忽略 |
| `streamlined_text` | 精簡文字 | 忽略 |
| `streamlined_tool_use_summary` | 工具使用摘要 | 忽略 |
| `system` | 系統訊息（含 `subtype`：`init` 回應開始 / `status` 狀態更新 / `compact_boundary` context 壓縮） | 入隊到 `inputStream`；`init` 時設定 `busy = true` |
| `stream_event` | Anthropic Streaming API 事件（`message_start` / `content_block_delta` / `message_stop` 等） | 入隊到 `inputStream`，由 assembler 組裝為完整訊息 |
| `result` | **回應結束信號**，包含 `total_cost_usd`（費用）和 `modelUsage`（context window / max output tokens） | 入隊到 `inputStream`；設定 `busy = false`，更新 usage 統計 |
| `user` | 使用者訊息 | 入隊到 `inputStream` |
| `assistant` | 助手回應（非串流模式，一次性完整訊息） | 入隊到 `inputStream` |
| `tool_use` | 工具呼叫 | 入隊到 `inputStream` |
| `error` | 錯誤訊息 | 入隊到 `inputStream` |

#### `system` 訊息子類型（`subtype`）

| subtype | 說明 | 附帶欄位 | WebView 效果 |
|---------|------|---------|-------------|
| `init` | 回應開始 | `session_id`、`model`、`fast_mode_state` | `busy = true`，記錄 session 與模型 |
| `status` | 狀態更新 | `status`（文字）、`permissionMode` | 更新狀態列文字與權限模式 |
| `compact_boundary` | Context 壓縮完成 | （無） | `totalTokens` 重置為 0 |

#### `stream_event` 事件子類型（`event.type`）

遵循 [Anthropic Streaming API](https://docs.anthropic.com/en/api/messages-streaming) 格式，外層包裝為 `{ type: "stream_event", event: {...}, parent_tool_use_id? }`。

| event.type | 說明 | 內容 |
|-----------|------|------|
| `message_start` | 新訊息開始 | `message`（含 `id`、`usage`） |
| `content_block_start` | 新內容區塊開始 | `content_block`（`text` / `tool_use` / `server_tool_use` / `thinking`） |
| `content_block_delta` | 內容增量 | `delta`（`text_delta` / `input_json_delta` / `thinking_delta` / `signature_delta` / `citations_delta`） |
| `content_block_stop` | 內容區塊結束 | `index` |
| `message_delta` | 訊息層級更新 | `delta.stop_reason`、`delta.stop_sequence`、`usage`（最終 token 統計） |
| `message_stop` | 訊息結束 | （無） |

> **`parent_tool_use_id`**：當 AI 使用子代理（subagent）時，內層回應的 `stream_event` 會帶此欄位，表示該事件屬於哪個 tool_use 的子回應。WebView 的 assembler 會據此將事件分派到正確的訊息樹。

---

### 2.4 CLI 發起的 Control Request（CLI → Extension）

CLI 主動發起的 control request，由 Extension 的 `handleControlRequest()` 處理，需回傳 control response。

#### elicitation（MCP Elicitation 互動）

當 MCP 伺服器需要向使用者索取資訊（URL 輸入或表單填寫）時，CLI 向 Extension 發送此請求：

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "elicitation",
    "mcp_server_name": "server_name",
    "message": "請輸入 OAuth 授權 URL",
    "mode": "url | form",
    "url": "https://...",
    "elicitation_id": "xxx",
    "requested_schema": {}
  }
}
```

**Extension 回應格式：**
```json
{ "action": "decline" }
```
若無 `onElicitation` 處理器，預設回傳 `{ "action": "decline" }`。

---

### 2.5 Control Cancel Request 訊息

```json
{
  "type": "control_cancel_request",
  "request_id": "要取消的 request_id"
}
```

---

