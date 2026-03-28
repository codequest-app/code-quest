# CLI (summoner) — Protocol Adapter Layer

## 職責
將 Claude Code CLI 的 stdout JSON 轉換為應用程式 SocketEvent，管理 process 生命週期。

## 架構

```
CLI Process (stdout JSON lines)
  → ProcessRunner (parse + emit)
    → ClaudeAdapter (ProtocolEvent → SocketEvent / ServerAction / AutoResponse)
      → Channel (server)
```

## 核心模組

### ProcessRunner (`process-runner.ts`)
- 透過 `ProcessProvider` 啟動 CLI subprocess
- 逐行解析 stdout → `adapter.parseLine()`
- 發射事件：`socket_event`、`server_action`、`control_response`、`auto_response`、`exit`

### ClaudeAdapter (`protocol/claude-adapter.ts`)
- 實作 `ProviderAdapter` interface
- 將 `ProtocolEvent` 轉換為 `SocketEvent[]` + `ServerAction[]`
- 處理 streaming（content_block_delta → stream:chunk）
- 處理 control request（permission, elicitation, diff_review, mcp）

### ClaudeProtocol (`protocol/claude.ts`)
- `buildArgs()` — 組裝 CLI 啟動參數（model, thinking, permission mode 等）
- `formatMessage()` — 格式化 stdin 訊息給 CLI
- `parseLine()` — 解析 stdout JSON line

### Protocol Schemas (`protocol/claude-schemas.ts`)
- 100+ Zod schemas 定義 CLI stdout 格式
- Discriminated union: `ProtocolEvent`
- Subtypes: system, stream_event, assistant, user, result, tool_use, control_request, error

## ProtocolEvent → SocketEvent 對應

| CLI Event | Socket Event | 方向 |
|---|---|---|
| `system.init` | `session:init` | CLI→Client |
| `system.status` | `state:update` | CLI→Client |
| `stream_event.content_block_delta` | `stream:chunk` | CLI→Client |
| `assistant` | `message:assistant` | CLI→Client |
| `result` | `message:result` | CLI→Client |
| `control_request.permission` | `control:permission` | CLI→Client |
| `control_request.elicitation` | `control:elicitation` | CLI→Client |
| `control_cancel_request` | `control:cancel` | CLI→Client |

## ProcessRunner 完整事件列表

| Event | 說明 |
|---|---|
| `stdout` | Raw stdout line |
| `stdin` | Raw stdin line（for logging）|
| `socket_event` | 轉換後的 SocketEvent |
| `server_action` | 需要 server enrichment 的 action |
| `control_response` | CLI 回應 server 的 control request |
| `auto_response` | 不需 server 介入的自動回應 |
| `exit` | Process 結束 |

## ProcessRunner 方法

- `spawn()` — 啟動 CLI process
- `sendMessage(text)` — 寫 user message 到 stdin
- `sendControlRequest(subtype, input?, requestId?)` — 送 control request
- `respondToControlRequest(requestId, response)` — 回應 control request
- `write(raw)` — 寫 raw string 到 stdin
- `kill()` / `abort()` — 終止 process

## ServerAction Subtypes

| Subtype | 說明 |
|---|---|
| `auto_respond` | 自動回應（get_settings, open_url, show_notification 等）|
| `read_diff` | Server 讀取 diff 檔案後回應 |
| `forward_to_client` | 轉發未知 control request 到 client |

`SERVER_ENRICHED_SUBTYPES` — 需要 server 先 enrich 再回應的 subtypes（如 get_settings 需讀取 server 設定）

## ProviderAdapter Interface

```typescript
interface ProviderAdapter {
  command: string;
  buildArgs(options?: LaunchOptions): string[];
  parseLine(line: string): ParseResult;
  transform(event: ProtocolEvent): AdapterOutput;
  formatMessage(text: string): string;
  formatControlRequest(subtype, input?, requestId?): string;
  formatControlResponse(requestId, response): string;
  extractRespondedRequestIds(rawEntries): Set<string>;  // 從 raw entries 提取已回應的 request IDs
}
```

## Test Doubles

### FakeProcessProvider (`test/fake-claude.ts`)
- 不啟動真實 process，用 JSONL fixture 驅動
- `segments` helper 產生各種 CLI 事件（init, assistant, toolUse, controlRequest 等）
- 支持 `prepareInit()` 預設初始化回應

### FakeSocket (`test/fake-socket.ts`)
- 雙向 socket mock（client ↔ server）
- server→client: async via queueMicrotask
- client→server: sync

## 測試覆蓋
- `process-runner.test.ts` — 啟動、事件發射
- `claude-adapter.test.ts` — ProtocolEvent → SocketEvent 轉換
- `claude.test.ts` — parseLine、formatMessage
- `claude-build-args.test.ts` — 啟動參數組裝
- `fake-claude-segments.test.ts` — fixture 驅動測試
