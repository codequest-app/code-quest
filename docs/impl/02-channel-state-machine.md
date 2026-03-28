# Channel 狀態機

## 實現說明

Channel 狀態是**隱式**的（event-driven），程式碼透過訊息類型追蹤當前狀態，而非使用 explicit 狀態變數。以下狀態圖描述的是邏輯狀態，對應到程式碼中的訊息事件流。

## 狀態定義

```
         launch_claude
IDLE ──────────────────► LAUNCHING
                              │
                    CLI spawn + initialize
                              │
                              ▼
                          ACTIVE ◄─────────────────────┐
                         /      \                       │
                        /        \                      │
              user input          interrupt             │
                 /                    \                 │
                ▼                      ▼                │
           STREAMING              CANCELLING            │
                \                      /                │
                 \                    /                 │
              result msg        interrupt done          │
                  \                  /                  │
                   ▼                ▼                   │
                   IDLE (same channel, waiting input) ──┘
                              │
                         close_channel
                              │
                              ▼
                           CLOSED
```

## 狀態說明

### IDLE（等待輸入）
- CLI 已完成一輪回應（收到 `result`），等待下一次 user input
- 或 Channel 初次建立、CLI 初始化完成後的初始等待狀態
- 可接收：`io_message`（user input）、`close_channel`、`interrupt_claude`（無作用）

### LAUNCHING（啟動中）
- `launch_claude` 已送出，CLI process 正在啟動
- CLI 尚未完成 `initialize` handshake
- **此狀態不應接收 user input**
- 等待：CLI stdout 的 `system { subtype: "init" }` 訊息

### ACTIVE（就緒）
- CLI 已初始化（`pid` Promise resolved）
- 等待 user input
- 邏輯上等同 IDLE，兩者在程式碼中無 explicit 區分

### STREAMING（串流中）
- CLI 正在生成回應
- Extension 持續將 `io_message` 推送給 WebView
- 可接收：`interrupt_claude`（觸發取消流程）

### CANCELLING（取消中）
- `interrupt` 已送給 CLI，等待 CLI 確認停止
- 不應再送 user input
- CLI 會送出 `result` 或直接關閉 stream 完成取消

### CLOSED
- Channel 已關閉，CLI process 已終止
- `channels.delete(channelId)` 已執行
- WebView 會收到 `close_channel` 通知

---

## 關鍵轉換條件

### IDLE → LAUNCHING
觸發：WebView 送出 `launch_claude`
Extension 動作：
1. 呼叫 `generateAndPushProactiveSuggestions(channelId)`（非同步，不阻塞）
2. 建立 `V1` input stream
3. spawn CLI process
4. `channels.set(channelId, { in, query, pid, ... })`
5. 呼叫 `claudeLaunched(channelId)`
6. 開始 async 讀取 CLI stdout（`for await (let msg of query)`）

### LAUNCHING → ACTIVE
觸發：CLI stdout 送出 `system { subtype: "init" }` + `initializationResult()` resolve
Extension 動作：
1. `pid` Promise resolve（取得 CLI process ID）
2. Channel 正式就緒

### ACTIVE → STREAMING
觸發：WebView 送出 `io_message`（`done: false`）
Extension 動作：
1. `channel.in.enqueue(message)`
2. CLI 開始處理，stdout 開始輸出 `stream_event`

### STREAMING → IDLE
觸發：CLI stdout 送出 `result`
Extension 動作：
1. 將 `result` 包進 `io_message` 送給 WebView
2. Channel 回到等待狀態

### ANY → CLOSED
觸發：`close_channel` 或 CLI process 異常終止
Extension 動作：
1. `channel.in.done()`
2. `channel.query.return()`
3. `channels.delete(channelId)`
4. 若需通知 WebView：送出 `{ type: "close_channel", channelId, error? }`

---

## WebView 端狀態

WebView 自行維護的狀態（透過 `io_message` 中的訊息類型判斷）：

| 狀態 | 觸發條件 |
|------|---------|
| `busy = false` | 初始，或收到 `result` |
| `busy = true` | 收到 `system { subtype: "init" }` |
| 顯示 spinner | `busy = true` |
| 串流文字 | 收到 `stream_event.content_block_delta` |
| 回應完成 | 收到 `result` |

---

## Channel 內部 MCP 子狀態

每個 Channel 除主狀態外，還有三個獨立的 MCP 子狀態，透過 `pushChannelStateUpdate(channelId)` 推送。

### chromeMcpState（Chrome 遠端偵錯）

```
disconnected
    │ 使用者啟用 Chrome MCP
    ▼
connecting
    │ 連線成功          │ 連線失敗
    ▼                   ▼
connected           error { error: "訊息" }
```

### debuggerMcpState（VS Code Debugger MCP）

```
inactive
    │ 啟動 debugger MCP
    ▼
active
    │ 啟動失敗
    ▼
error { error: "訊息" }
```

### jupyterMcpState（Jupyter Notebook MCP）

```
inactive
    │ 偵測到 Jupyter 環境
    ▼
available { notebookCount, isActiveEditorNotebook }
    │ 使用者啟用
    ▼
active
    │ 發生錯誤
    ▼
error { error: "訊息" }
```

這三個子狀態獨立於主 Channel 狀態，互不影響。Extension 透過 `pushChannelStateUpdate(channelId)` 推送給 WebView。

---

## 多 Channel 注意事項

- 多個 Channel 同時存在時，每個 `io_message` 都帶有 `channelId`
- Extension 透過 `channelId` 路由訊息到對應的 CLI process
- `pushStateUpdate()` 使用 `channelId: ""`（廣播給所有 Channel 的 WebView）
- `pushChannelStateUpdate(channelId)` 只更新特定 Channel 的狀態（含該 Channel 的 chromeMcpState 等）
