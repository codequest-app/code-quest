## 7. 完整交互流程

### 7.1 初始化流程

```
Extension 啟動
    ↓
spawn Claude CLI process（stdin/stdout pipe）
    ↓
建立 ProcessTransport 實例
    ↓
發送 { type: "control_request", request: { subtype: "initialize", ... } }
    ↓
等待 { type: "control_response", response: { subtype: "success", ... } }
    ↓
初始化完成，開始處理使用者輸入
```

### 7.2 使用者對話流程（回應生命週期）

```
使用者在 WebView 輸入
    ↓
WebView 發送訊息到 Extension
    ↓
Extension 透過 streamInput() 轉換為
    { "type": "user", "content": [{ "type": "text", "text": "..." }] }
    ↓
寫入 processStdin
    ↓
Claude CLI 處理請求（呼叫 Anthropic API）
    ↓
CLI stdout 依序輸出以下訊息：
    ↓
Extension 讀取並透過 postMessage 回傳給 WebView 顯示
```

#### 回應生命週期的 stdout 訊息順序

| 階段 | stdout 訊息 | WebView 狀態變化 |
|------|------------|-----------------|
| **1. 開始** | `{ type: "system", subtype: "init", session_id, model, fast_mode_state }` | `busy = true`，顯示 spinner |
| **2. 狀態更新** | `{ type: "system", subtype: "status", status, permissionMode }` | 更新狀態列文字與權限模式 |
| **3. 串流回應** | `{ type: "stream_event", event: { type: "message_start" \| "content_block_start" \| "content_block_delta" \| ... }, parent_tool_use_id? }` | 即時渲染文字、工具呼叫等內容 |
| **3a. 非串流回應** | `{ type: "assistant", message: { role: "assistant", content: [...], usage: {...} }, parent_tool_use_id? }` | 一次性渲染完整回應 |
| **4. 工具權限** | `{ type: "control_request", request: { type: "can_use_tool", ... } }` | 顯示權限對話框（見 7.3） |
| **5. 結束** | `{ type: "result", total_cost_usd, modelUsage }` | `busy = false`，spinner 停止 |

#### `system` init 訊息（回應開始信號）

```json
{
  "type": "system",
  "subtype": "init",
  "session_id": "session-uuid",
  "model": "claude-sonnet-4-6-20250514",
  "fast_mode_state": "off"
}
```

WebView 處理：
- 設定 `busy = true`（開始顯示 spinner）
- 記錄 `sessionId` 和 `currentMainLoopModel`
- 設定 `fastModeState`

#### `system` status 訊息

```json
{
  "type": "system",
  "subtype": "status",
  "status": "目前狀態描述文字",
  "permissionMode": "default"
}
```

#### `stream_event` 串流事件（Anthropic Streaming API 格式）

串流模式下，CLI 將 Anthropic API 的 SSE 事件逐一轉發，外層格式為：

```json
{ "type": "stream_event", "event": { "type": "...", ... }, "parent_tool_use_id": "可選" }
```

| event.type | 說明 |
|-----------|------|
| `message_start` | 新訊息開始，包含 `message.id`、`message.usage` |
| `content_block_start` | 新內容區塊開始（text / tool_use / thinking） |
| `content_block_delta` | 內容增量（`text_delta` / `input_json_delta` / `thinking_delta` / `signature_delta` / `citations_delta`） |
| `content_block_stop` | 內容區塊結束 |
| `message_delta` | 訊息層級更新（`stop_reason`、最終 `usage`） |
| `message_stop` | 訊息結束 |

> **`parent_tool_use_id`**：當 AI 使用子代理（subagent）時，內層回應的 `stream_event` 會帶此欄位，表示該事件屬於哪個 `tool_use` 的子回應。WebView 的 assembler（`si` 類別）會據此將事件分派到正確的訊息樹，實現巢狀工具呼叫的即時渲染。

WebView 使用 `assembler`（`si` 類別）將串流事件組裝為完整訊息，即時渲染。

#### `system` compact_boundary 訊息

```json
{
  "type": "system",
  "subtype": "compact_boundary"
}
```

表示 context 被壓縮，WebView 將 `totalTokens` 重置為 0。

#### `result` 訊息（回應結束信號）

```json
{
  "type": "result",
  "total_cost_usd": 0.0123,
  "modelUsage": {
    "claude-sonnet-4-6-20250514": {
      "contextWindow": 200000,
      "maxOutputTokens": 16384
    }
  }
}
```

WebView 處理：
- 設定 `busy = false`（停止 spinner，回應完成）
- 更新 `usageData`：`totalCost`、`contextWindow`、`maxOutputTokens`

> **判斷回應是否結束的唯一方式**：收到 `type: "result"` 訊息。在此之前，即使串流暫停（例如等待工具權限），回應仍未結束。

#### 相關程式碼

```javascript
// webview/index.js — processIncomingMessage()
if ($.type === "system") {
  if (!this.sessionId.value) this.sessionId.value = $.session_id;
  if ($.subtype === "init") this.busy.value = true;    // 回應開始
} else if ($.type === "result") {
  this.busy.value = false;                              // 回應結束
}

// webview/index.js — processMessage() 中處理 result 的 usage 更新
if ($.type === "result") {
  if ($.total_cost_usd !== void 0) {
    let Z = this.currentMainLoopModel.value;
    let Y = $.modelUsage?.[Z || ""];
    this.usageData.value = {
      totalTokens: J.totalTokens,
      totalCost: $.total_cost_usd,
      contextWindow: Y?.contextWindow ?? J.contextWindow,
      maxOutputTokens: Y?.maxOutputTokens ?? J.maxOutputTokens
    };
  }
}
```

#### AI 回應中的使用者輸入處理（排隊機制）

當 `busy = true`（AI 正在回應）時，使用者仍可在輸入框中輸入文字。此時的行為取決於輸入框是否有內容：

| 使用者動作 | busy 狀態 | 輸入框有文字 | 結果 |
|-----------|----------|------------|------|
| 點擊按鈕 | `true` | 無 | **中斷**當前回應（`interrupt()`） |
| 點擊按鈕 | `true` | 有 | **排隊**訊息，AI 處理完當前回應後繼續處理 |
| 點擊按鈕 | `false` | 有 | **送出**訊息，開始新回應 |
| 點擊按鈕 | `false` | 無 | 按鈕 disabled，無反應 |

**UI 變化**：

- 送出按鈕圖示從**送出箭頭**變為**停止圖示**
- 輸入框 placeholder 變為 `"Queue another message…"`

**送出按鈕邏輯**（webview/index.js）：

```javascript
// 按鈕 disabled 條件：不在 busy 狀態 且 輸入框無文字
disabled: !$.busy.value && !X

// 點擊行為：busy 狀態下且無文字 → 中斷；否則 → 送出
onClick: (W) => {
  if ($.busy.value && !X)
    W.preventDefault(), $.interrupt();
}
```

**訊息排隊流程**：

```
WebView session.send()
    ↓
connection.sendInput(channelId, message, done=false)
    ↓ （io_message）
Extension transportMessage(channelId, message, done)
    ↓
channel.in.enqueue(message)   ← 排入 channel 的 input stream
    ↓
CLI 的 streamInput() 從 input stream 逐一讀取並寫入 stdin
```

**Extension 端排隊實作**（`extension.js` 第 49978–49983 行）：

```javascript
transportMessage(v, z, U) {
  let V = this.channels.get(v);
  if (!V) throw Error(`Channel not found: ${v}`);
  if (z.type === "user") V.in.enqueue(z);  // 直接排入佇列，不檢查 busy
  if (U) V.in.done();
}
```

> **備註**：排隊的訊息會在當前回應（收到 `result`）之後被 CLI 讀取並處理，觸發新的回應循環。

#### 中斷流程（Interrupt）

當使用者在 AI 回應中點擊停止按鈕（或 WebView 呼叫 `session.interrupt()`），觸發以下流程：

```
① WebView: session.interrupt()
    ↓
② WebView connection: send({ type: "interrupt_claude", channelId })
    ↓
③ Extension: interruptClaude(channelId)
    ↓
④ Extension: channel.query.interrupt()
    ↓
⑤ Query.interrupt(): 發送 control_request 給 CLI
    → this.request({ subtype: "interrupt" })
    ↓
⑥ Query.request(): 寫入 stdin
    → { type: "control_request", request_id: "隨機ID", request: { subtype: "interrupt" } }
    ↓
⑦ CLI 收到 interrupt，中止當前處理
    ↓
⑧ CLI 回傳 control_response（success）
    → { type: "control_response", response: { subtype: "success", request_id: "對應ID", response: {} } }
    ↓
⑨ CLI 輸出 { type: "result", ... }
    → WebView 設定 busy = false
```

**相關程式碼**：

```javascript
// webview/index.js — session.interrupt()
async interrupt() {
  if (!this.claudeChannelId || !this.connection.value) return;
  this.connection.value.interruptClaude(this.claudeChannelId);
}

// webview/index.js — connection.interruptClaude()
interruptClaude($) {
  this.send({ type: "interrupt_claude", channelId: $ });
}

// extension.js 第 49937–49948 行
async interruptClaude(z) {
  let v = this.channels.get(z);
  if (!v) { this.logger.warn(`Channel not found: ${z}`); return; }
  try {
    await v.query.interrupt();
  } catch (j) {
    this.logger.error(`Failed to interrupt Claude: ${j}`);
  }
}

// extension.js 第 31120–31122 行 — Query.interrupt()
async interrupt() {
  await this.request({ subtype: "interrupt" });
}

// extension.js 第 31149 行附近 — Query.request()
// 產生 control_request 寫入 CLI stdin，等待 control_response
request(v) {
  let z = Math.random().toString(36).substring(2, 15);
  let U = { request_id: z, type: "control_request", request: v };
  // 寫入 transport（stdin）並等待 pendingControlResponses 回調
}
```

> **備註**：`interrupt` 是透過 `control_request` 機制實現的，與 `initialize`、`set_model` 等使用相同的請求/回應模式。中斷後 CLI 會盡快結束當前處理並輸出 `result` 訊息。

### 7.3 工具權限請求流程（`can_use_tool` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 想使用某個工具（如 Edit、Write、Bash 等）時，主動詢問 Extension 是否允許。

> **⚠️ 重要：`can_use_tool` 僅在 VSCode Extension 模式下觸發**
>
> 此機制**只有**在 `spawnClaude()` 時傳入 `canUseTool` callback 才會啟用（第 30513 行附近）。
> 傳入 callback 時，SDK 會自動帶上 `--permission-prompt-tool stdio` 參數，告訴 CLI「把權限問題透過 stdout 發給外部處理」。
>
> **純 CLI stream-json 模式**（不帶 `--permission-prompt-tool stdio`）下，CLI **自己內部處理權限**（使用 TUI 提示或 `--dangerously-skip-permissions` 等機制），**不會**發出 `can_use_tool` 訊息到 stdout。
>
> 程式碼佐證（第 31033 行）：
> ```javascript
> if (!this.canUseTool) throw Error("canUseTool callback is not provided.");
> ```
> 如果沒有提供 callback，收到 `can_use_tool` 會直接 throw error。

**前提**：`spawnClaude()` 時傳入 `canUseTool` callback（第 49829 行），並帶 `--permission-prompt-tool stdio` 參數（第 30554 行），CLI 才會透過 stdio 詢問權限。

**完整觸發鏈**：

```
① CLI 想使用某工具（如 Edit）
    ↓
② CLI 透過 stdout 送出（第 31032 行觸發）：
    {
      type: "control_request",
      request_id: "xxx",
      request: {
        subtype: "can_use_tool",
        tool_name: "Edit",
        input: { file_path: "/src/app.js", old_string: "...", new_string: "..." },
        permission_suggestions: {...},
        blocked_path: "/src/app.js",
        decision_reason: "reason",
        tool_use_id: "xxx",
        agent_id: "xxx"
      }
    }
    ↓
③ Extension readMessages()（第 30948 行）判斷 type === "control_request"
    ↓
④ handleControlRequest()（第 30987 行）建立 AbortController，存入 cancelControllers Map
    ↓
⑤ processControlRequest()（第 31031 行）判斷 subtype === "can_use_tool"
    ↓
⑥ 呼叫 this.canUseTool(tool_name, input, options)
   └→ 實際是呼叫 requestToolPermission()（第 49891 行）
    ↓
⑦ requestToolPermission() 透過 postMessage 向 WebView 發送：
    {
      type: "tool_permission_request",
      toolName: "Edit",
      inputs: {...},
      suggestions: [...]
    }
    ↓
⑧ WebView 顯示權限對話框，使用者點擊「允許」或「拒絕」
    ↓
⑨ WebView 回傳結果給 Extension
    ↓
⑩ Extension 透過 stdin 寫回 control_response 給 CLI：
    {
      type: "control_response",
      response: {
        subtype: "success",
        request_id: "xxx",
        response: {
          behavior: "allow",      // 或 "deny"
          updatedInput: {...},     // 可選，修改後的輸入
          toolUseID: "xxx"
        }
      }
    }
    ↓
⑪ CLI 根據 behavior 繼續執行或中止工具呼叫
```

**相關程式碼**：

```javascript
// 第 49829-49836 行：canUseTool callback 定義
async (D, A, w) => {
  return this.requestToolPermission(v, D, A, w.suggestions || [], w.signal);
}

// 第 49891-49908 行：requestToolPermission 實作
async requestToolPermission(z, v, j, K, U) {
  // Chrome MCP 工具自動允許
  if (this.channels.get(v)?.chromeMcpState.status === "connected"
      && z.startsWith("mcp__claude-in-chrome__"))
    return { behavior: "allow", updatedInput: U };

  // 其他工具透過 WebView 詢問使用者
  let x = await this.sendRequest(v, {
    type: "tool_permission_request",
    toolName: z,
    inputs: U,
    suggestions: V,
  }, N);
  return x.result;
}
```

#### 三層架構完整實作流程圖

以下為 CLI → Extension → WebView 三層之間的完整訊息交換流程：

```
CLI process                    SDK (extension.js)                 WebView
    │                               │                               │
    │  ① stdout: control_request    │                               │
    │  { type: "control_request",   │                               │
    │    request_id: "abc",         │                               │
    │    request: {                 │                               │
    │      subtype: "can_use_tool", │                               │
    │      tool_name: "Bash",       │                               │
    │      input: {...},            │                               │
    │      permission_suggestions,  │                               │
    │      blocked_path,            │                               │
    │      decision_reason,         │                               │
    │      tool_use_id,             │                               │
    │      agent_id                 │                               │
    │    }                          │                               │
    │  }                            │                               │
    │ ─────────────────────────────>│                               │
    │                               │                               │
    │              ② readMessages() (L30948)                        │
    │              路由到 handleControlRequest()                      │
    │                               │                               │
    │              ③ processControlRequest() (L31031)               │
    │              判斷 subtype === "can_use_tool"                    │
    │              呼叫 this.canUseTool()                             │
    │                               │                               │
    │              ④ canUseTool = requestToolPermission() (L49891)  │
    │              封裝成 tool_permission_request                     │
    │                               │                               │
    │                               │  ⑤ postMessage: request       │
    │                               │  { type: "request",           │
    │                               │    request: {                 │
    │                               │      type: "tool_permission_  │
    │                               │             request",         │
    │                               │      toolName, inputs,        │
    │                               │      suggestions              │
    │                               │  }}                           │
    │                               │ ─────────────────────────────>│
    │                               │                               │
    │                               │         ⑥ 使用者點擊 Allow/Deny │
    │                               │                               │
    │                               │  ⑦ postMessage: response      │
    │                               │  { type: "response",          │
    │                               │    result: {                  │
    │                               │      behavior: "allow"/"deny",│
    │                               │      updatedPermissions:[...],│
    │                               │      updatedInput: {...}      │
    │                               │  }}                           │
    │                               │ <─────────────────────────────│
    │                               │                               │
    │              ⑧ sendRequest Promise resolve                    │
    │              回傳 { behavior, updatedPermissions, updatedInput }│
    │                               │                               │
    │  ⑨ stdin: control_response    │                               │
    │  { type: "control_response",  │                               │
    │    response: {                │                               │
    │      subtype: "success",      │                               │
    │      request_id: "abc",       │                               │
    │      response: {              │                               │
    │        behavior: "allow",     │                               │
    │        updatedInput: {...},   │                               │
    │        updatedPermissions,    │                               │
    │        toolUseID              │                               │
    │      }                        │                               │
    │    }                          │                               │
    │  }                            │                               │
    │ <─────────────────────────────│                               │
```

**步驟對應程式碼位置**：

| 步驟 | 程式碼位置 | 說明 |
|------|-----------|------|
| ① CLI 發出請求 | CLI 內部 | 帶 `--permission-prompt-tool stdio` 時，CLI 不自行處理權限，改為 stdout 輸出 `control_request` |
| ② 訊息路由 | `L30948-30960` | `readMessages()` 判斷 `type === "control_request"` → `handleControlRequest()` |
| ③ 分派處理 | `L31031-31044` | `processControlRequest()` 判斷 `subtype === "can_use_tool"` → 呼叫 `canUseTool` callback |
| ④ 轉發 WebView | `L49891-49908` | `requestToolPermission()` 封裝為 `tool_permission_request` 發給 WebView |
| ⑤⑦ WebView 通訊 | `L49909` | `sendRequest()` 用 `postMessage` 發 request，等 response Promise |
| ⑥ 使用者操作 | WebView `mi` 類別 | 使用者點擊 Allow/Deny，呼叫 `mi.accept()` 或 `mi.reject()` |
| ⑧ 回傳結果 | `L49907` | `N.result` 包含 `behavior` + `updatedPermissions` |
| ⑨ 寫回 CLI | `L30992-31006` | 包裝為 `control_response` + `subtype: "success"` 寫入 stdin |

**特殊情況：Chrome MCP 自動放行**（`L49892-49896`）：

如果工具名稱以 `mcp__claude-in-chrome__` 開頭且 Chrome MCP 已連線，`requestToolPermission()` 直接回傳 `{ behavior: "allow", updatedInput: 原始輸入 }` 而不詢問使用者。

**取消機制**（`L49920-49931`）：

`sendRequest()` 監聽 `AbortController.signal`，若被 abort（例如使用者 interrupt 或 CLI 送出 `control_cancel_request`），會：
1. 發送 `cancel_request` 給 WebView 取消權限對話框
2. Reject Promise
3. `handleControlRequest()` 的 catch 區塊將錯誤包裝為 `control_response` + `subtype: "error"` 寫回 CLI

#### `canUseTool` 回傳格式（Permission Response）

`canUseTool` callback 的回傳值即為 `control_response.response.response` 的內容。`behavior` 有 `"allow"` 和 `"deny"` 兩種值。

回傳結構由 WebView 端的 `mi` 類別（`webview/index.js`）定義：

```javascript
class mi {
  channelId; toolName; inputs; suggestions;

  accept(updatedInput = {}, updatedPermissions = []) {
    this.resolved.emit({
      behavior: "allow",
      updatedInput,
      updatedPermissions     // 權限規則陣列，可用來批量授權
    });
  }

  reject(message, interrupt) {
    this.resolved.emit({
      behavior: "deny",
      message,
      interrupt              // true = 中斷整個對話，不只拒絕這一次
    });
  }
}
```

##### 允許（allow）

```json
{
  "behavior": "allow",
  "updatedInput": { ... },           // 可選，修改後的工具輸入
  "updatedPermissions": [ ... ]      // 可選，更新的權限規則陣列
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `behavior` | `"allow"` | 允許此次工具呼叫 |
| `updatedInput` | `object` | 可選。修改後的工具輸入，覆蓋原始 input |
| `updatedPermissions` | `array` | 可選。權限規則陣列，用於批量授權（例如「永遠允許此工具」或「允許此工具存取特定路徑」），由 WebView UI 的使用者選擇產生 |

##### 拒絕（deny）

```json
{
  "behavior": "deny",
  "message": "拒絕原因",              // 可選
  "interrupt": true                   // 可選
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `behavior` | `"deny"` | 拒絕此次工具呼叫 |
| `message` | `string` | 可選。拒絕原因，會傳回給 CLI |
| `interrupt` | `boolean` | 可選。`true` = 中斷整個對話（不只拒絕這一次工具呼叫），`false`/省略 = 僅拒絕此次 |

##### 完整 control_response 包裝（寫回 CLI stdin）

由 `processControlRequest()`（第 31031–31044 行）自動附加 `toolUseID`：

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "對應的 request_id",
    "response": {
      "behavior": "allow",
      "updatedInput": { ... },
      "updatedPermissions": [ ... ],
      "toolUseID": "xxx"
    }
  }
}
```

##### 各情境的回傳值

| 情境 | 回傳值 | 位置 |
|------|--------|------|
| Chrome MCP 工具 | `{ behavior: "allow", updatedInput: 原始輸入 }` | 第 49896 行（extension.js），自動允許 |
| Config 載入模式 | `{ behavior: "deny", message: "Config loading only" }` | 第 50011 行（extension.js），固定拒絕 |
| 一般工具（使用者允許） | `{ behavior: "allow", updatedInput?, updatedPermissions? }` | WebView `mi.accept()`，使用者可同時設定權限規則 |
| 一般工具（使用者拒絕） | `{ behavior: "deny", message?, interrupt? }` | WebView `mi.reject()`，使用者可選擇中斷整個對話 |
| Abort 取消 | `{ behavior: "deny", message: "Aborted", interrupt: false }` | WebView `handleToolPermissionRequest()`，signal abort 時自動拒絕 |

##### 使用者允許的多種方式（updatedPermissions 規則格式）

當使用者在 WebView UI 中允許工具時，可透過 `updatedPermissions` 陣列附帶不同粒度的授權規則。

###### 1. `updatedPermissions` 陣列中的三種規則類型

| type | 說明 | 結構 |
|------|------|------|
| `addRules` | 添加工具允許規則 | `{ type: "addRules", rules: [{ ruleContent: "tool_name:*", toolName: "tool_name" }] }` |
| `addDirectories` | 允許存取特定目錄 | `{ type: "addDirectories", directories: ["/path/to/dir"] }` |
| `setMode` | 設定權限模式 | `{ type: "setMode", mode: "acceptEdits" \| "default", destination: "session" }` |

###### 2. destination（權限保存位置）

| destination | 說明 | 儲存位置 |
|-------------|------|---------|
| `session` | 僅此次會話 | 不儲存 |
| `localSettings` | 此專案（僅自己） | `.claude/settings.local.json`（gitignored） |
| `userSettings` | 所有專案 | `~/.claude/settings.json` |
| `projectSettings` | 此專案（團隊共享） | `.claude/settings.json` |

###### 3. UI 按鈕對應的 accept/reject 行為

| 按鈕 | 一般模式 | acceptEdits 模式 |
|------|---------|-----------------|
| **按鈕 1**（Primary） | `"Yes"` → `accept(inputs)` | `"Yes, and auto-accept"` → `accept(inputs, [{ type: "setMode", mode: "acceptEdits", destination: "session" }])` |
| **按鈕 2** | `"Yes, and don't ask again"` / `"Yes, allow [tool] for [destination]"` → `accept(inputs, updatedPermissions)` 帶規則 | `"Yes, and manually approve edits"` → `accept(inputs)` 不帶規則 |
| **按鈕 3**（Reject） | `"No"` → `reject(message, interrupt)` | `"No"` → `reject(message, interrupt)` |

###### 4. reject 的預設訊息常數

| 變數 | 訊息 |
|------|------|
| 一般拒絕 | `"The user doesn't want to proceed with this tool use. The tool use was rejected..."` |
| 保持計畫模式 | `"User chose to stay in plan mode and continue planning"` |
| 帶原因拒絕 | `"The user doesn't want to proceed... The user provided the following reason: "` + 原因 |

##### 權限規則的被動回應機制與快取行為

`can_use_tool` 是**被動回應**機制，外部程式（Extension）不需要主動送出 allow，只需在 CLI 發出 `control_request` 時回傳 `control_response`。

###### 核心原則：每次工具呼叫獨立詢問

```
CLI 想用 Bash ──→ control_request (can_use_tool) ──→ Extension 回 allow/deny
CLI 想用 Edit ──→ control_request (can_use_tool) ──→ Extension 回 allow/deny
CLI 想用 Bash ──→ control_request (can_use_tool) ──→ Extension 回 allow/deny  ← 又問一次
```

每次工具呼叫都是獨立的請求—回應循環，CLI 預設不會記住先前的授權結果。

###### `updatedPermissions` 的規則快取效果

回傳 `allow` 時附帶 `updatedPermissions`，CLI 會**記住這些規則**。後續符合規則的工具呼叫將自動放行，不再發出 `can_use_tool`：

```
第 1 次：CLI 問「可以用 Bash 嗎？」
  回傳：{
    behavior: "allow",
    updatedPermissions: [{
      type: "addRules",
      rules: [{ toolName: "Bash", ruleContent: "Bash:*" }]
    }]
  }

第 2 次：CLI 想用 Bash → 規則已匹配 → 不發 can_use_tool，自動放行 ✓
第 3 次：CLI 想用 Edit → 沒有匹配規則 → 發出 can_use_tool 詢問 ✗
```

###### 不同回應方式的效果對比

| 回應方式 | 效果 | 對應 UI 按鈕 |
|---------|------|-------------|
| `{ behavior: "allow" }` | 僅允許此次，下次同工具仍會被問 | 「Yes」 |
| `{ behavior: "allow", updatedPermissions: [addRules...] }` | 允許此次 + 記住規則，後續匹配的不再詢問 | 「Yes, and don't ask again」 |
| `{ behavior: "allow", updatedPermissions: [setMode: "acceptEdits"] }` | 允許此次 + 進入自動接受編輯模式 | 「Yes, and auto-accept」 |
| `{ behavior: "deny" }` | 拒絕此次，不影響後續 | 「No」 |

###### 規則的保存範圍（由 `destination` 控制）

| destination | 規則生命週期 | 影響範圍 |
|-------------|------------|---------|
| `session` | 當前會話結束即消失 | 僅此次對話 |
| `localSettings` | 持久化到 `.claude/settings.local.json` | 此專案、僅自己 |
| `userSettings` | 持久化到 `~/.claude/settings.json` | 所有專案 |
| `projectSettings` | 持久化到 `.claude/settings.json` | 此專案、團隊共享 |

> **實作提示**：若自行實作 `canUseTool` callback（不透過 WebView），可在外部程式中自行維護規則快取，在 callback 內直接回傳 `{ behavior: "allow" }` 而不依賴 CLI 的 `updatedPermissions` 機制。但使用 `updatedPermissions` 的好處是由 CLI 端統一管理規則匹配，減少外部程式的複雜度。

---

### 7.3.1 子代理（Subagent）巢狀流程

當 AI 使用 Task（Agent）工具時，CLI 內部會啟動子代理（subagent）來處理該工具呼叫。子代理產生的 stream 事件透過 `parent_tool_use_id` 欄位與父層 tool_use 關聯，形成巢狀訊息樹。

#### 整體流程

```
CLI 主對話
  ↓ AI 呼叫 Task tool（tool_use_id = "tu_abc"）
  ↓
CLI 啟動子代理
  ↓ 子代理的 stream_event 帶 parent_tool_use_id = "tu_abc"
  ↓
Extension 透傳 stream_event 到 WebView
  ↓
WebView assembler（si 類別）依 parent_tool_use_id 分派
  ↓ 找不到對應 assembler → 建立新的子 assembler（Kj0 實例）
  ↓ 子 assembler 獨立管理該子代理的訊息組裝
  ↓
子代理完成 → 結果回傳至父層 tool_result
```

#### stream_event 的子代理路由

WebView 的 `si` assembler 類別維護一個 `Map<parent_tool_use_id, Kj0>`：

- 主對話的事件以 `"root"` 為 key
- 子代理的事件以其 `parent_tool_use_id` 為 key
- 收到新的 `parent_tool_use_id` 時，自動建立新的 `Kj0` 子 assembler
- 每個 `Kj0` 獨立追蹤 `currentMessage`、`contentBlocks`，互不干擾

```
processMessage(msg) {
  if (msg.type === "stream_event")
    assembler.processStreamEvent(msg.event, msg.parent_tool_use_id)
    // si.processStreamEvent 內部：
    //   key = parent_tool_use_id ?? "root"
    //   若 Map 中無此 key → new Kj0(createMessage, parent_tool_use_id)
    //   委派給對應的 Kj0.processStreamEvent(event)
}
```

#### 子代理的權限請求

子代理需要使用工具時，`can_use_tool` 請求會額外帶 `agent_id` 欄位，標識請求來源：

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "can_use_tool",
    "tool_name": "Edit",
    "input": { ... },
    "tool_use_id": "xxx",
    "agent_id": "子代理的 ID"
  }
}
```

Extension 將 `agent_id` 作為 `agentID` 傳遞給 `canUseTool` callback，讓權限決策邏輯能區分主對話與子代理的請求。

#### 停止子代理

可透過 `stop_task` 控制請求停止特定子代理：

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "stop_task",
    "task_id": "子代理的 task_id"
  }
}
```

> **關鍵區分**：`tool_use_id` 是單次工具呼叫的 ID；`parent_tool_use_id` 是子代理 stream 事件歸屬的父層工具呼叫 ID；`agent_id` 是子代理本身的身份標識。三者各有用途。

---
