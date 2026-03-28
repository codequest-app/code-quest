# Architecture Overview

## End-to-End Event Flow

### User 送訊息 → Claude 回應

```
User types "fix the bug" + Enter
  │
  ▼
Client: ComposeInput → ChannelCompose.submit()
  │ socket.emit('chat:send', { channelId, message })
  ▼
Server: message-handler
  │ channel.runner.sendMessage(formatted)
  ▼
CLI Process (stdin): { type: "user", message: "fix the bug" }
  │
  │ ... Claude thinking ...
  │
  ▼ (stdout JSON lines)
CLI: { type: "assistant", message: { content: [{ type: "text", text: "I'll fix..." }] } }
  │
  ▼
Summoner: ClaudeAdapter.transform() → SocketEvent { name: "message:assistant", payload }
  │
  ▼
Server: channel-hooks → socket.emit('message:assistant', payload) to all joined sockets
  │
  ▼
Client: ChannelMessagesContext onAssistant handler → setState({ messages: [...prev, newMsg] })
  │
  ▼
React: MessageList re-render → ChatMessage → "I'll fix..."
```

### Streaming（text_delta 累積）

```
CLI stdout: { type: "content_block_delta", delta: { type: "text_delta", text: "I'll " } }
CLI stdout: { type: "content_block_delta", delta: { type: "text_delta", text: "fix " } }
CLI stdout: { type: "content_block_delta", delta: { type: "text_delta", text: "the bug" } }
  │
  ▼ (each line)
Summoner: → SocketEvent { name: "stream:chunk", payload: { type: "text_delta", text: "..." } }
  │
  ▼
Server: broadcast to client
  │
  ▼
Client: ChannelMessagesContext
  │ accumulates: streamingText.current += delta.text
  │ updates message in-place (mutable ref for perf)
  │
  ▼
React: MessageList → "I'll fix the bug" (progressive render)
  │
CLI stdout: { type: "message_stop" }
  │
  ▼
Client: finalize streaming message → immutable state update
```

### Permission Flow（Tool 使用審批）

```
CLI: control_request { subtype: "can_use_tool", tool: "Bash", input: { command: "rm -rf /tmp" } }
  │
  ▼
Summoner: → SocketEvent { name: "control:permission" } + ServerAction { type: "auto_respond" }
  │
  ▼
Server: channel-hooks
  │ check SERVER_ENRICHED_SUBTYPES → not auto-respond for permission
  │ channel.trackControlRequest(requestId)
  │ socket.emit('control:permission', { requestId, tool, input })
  ▼
Client: ChannelControlContext → setPendingControls([...prev, request])
  │
  ▼
React: PendingActionBanner → "Bash: rm -rf /tmp" [Yes] [No]
  │
  │ User clicks [Yes]
  ▼
Client: socket.emit('chat:respond', { channelId, requestId, response: { allow: true } })
  │
  ▼
Server: message-handler → channel.resolveControlRequest(requestId)
  │ runner.respondToControlRequest(requestId, response)
  ▼
CLI (stdin): { type: "control_response", request_id: "...", response: { allow: true } }
  │
  │ ... tool executes ...
  ▼
CLI: { type: "tool_result", tool_use_id: "...", content: "Done" }
```

### Session Launch

```
Client: TabContext.createNewTab()
  │ socket.emit('session:launch', { channelId, initialPrompt? })
  ▼
Server: session-handler
  │ 1. Create Channel
  │ 2. channel.spawn(runner) → ProcessRunner.spawn()
  │ 3. Wire channel-hooks (runner events → socket broadcast)
  │ 4. Wait for CLI system/init
  ▼
CLI stdout: { type: "system", subtype: "init", ... }
  │
  ▼
Summoner: → SocketEvent { name: "session:init", payload: { model, tools, slashCommands, mcpServers } }
  │
  ▼
Server: socket.emit('session:init', payload) to requesting socket only (not broadcast)
  │ socket.emit('session:created', { channelId }) to all
  ▼
Client:
  │ TabContext: session:created → addTab(channelId)
  │ ChannelConfigContext: session:init → setConfig({ model, tools, ... })
  │ ChannelComposeContext: ready for input
```

## Package 依賴關係

```
                    ┌─────────────┐
                    │   shared    │  ← types, schemas, socket events
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │  summoner  │ │ server │ │  client  │
        │ (protocol) │ │(adapter)│ │(frontend)│
        └─────┬──────┘ └───┬────┘ └──────────┘
              │            │
              └────────────┘
              server imports summoner
```

### Import 方向

| From → To | Import Path | 用途 |
|---|---|---|
| server → shared | `@code-quest/shared` | Socket event types, schemas |
| server → summoner | `@code-quest/summoner` | ProcessRunner, ClaudeProtocol, adapters |
| client → shared | `@code-quest/shared` | Types (ContentBlock, ModelInfo, etc.) |
| client → summoner | `@code-quest/summoner/test` | segments, createFakeSocket (test only) |
| client → server | `@code-quest/server/test` | FakeClaude (test only) |

### Runtime 依賴（production）

```
client ──socket.io──→ server ──ProcessRunner──→ CLI process
  │                     │
  └── @code-quest/shared (types only, no runtime)
                        │
                        └── @code-quest/summoner (runtime: parse + transform)
                        └── @code-quest/shared (runtime: schema validation)
```

### Test 依賴

```
client tests → @code-quest/server/test (FakeClaude)
             → @code-quest/summoner/test (segments, createFakeSocket)

server tests → @code-quest/summoner/test (FakeProcessProvider)
             → @code-quest/shared (schemas for validation)
```

## 已知技術債

### P1（建議改善）

| # | 位置 | 問題 | 影響 |
|---|---|---|---|
| 1 | client: ChannelMessagesContext | 927 行，管太多（streaming + messages + submit + abort + stats + notifications） | 改動風險高，但拆分需要大量 test 搬移 |
| 2 | client: CommandMenu buildMenuItems | 207 行 pure function，21 個參數 | 可讀性差，但是 pure function 所以不影響正確性 |
| 3 | client: ComposeInput handleKeyDown | 68 行，7 個 if 分支 | 可讀性差，但邏輯正確 |
| 4 | client: MessageContent renderBody | 77 行 switch，23 種 type | 可改 component registry，但目前能 work |
| 5 | client: GitContext | 零 consumer，GitStatusPanel 已刪除 | Dead code，可刪除 |
| 6 | client: clsx | 只有 ToggleSwitch 1 個檔案用，28 個檔案仍用 inline ternary | 風格不一致，但不影響功能 |
| 7 | client: terminalSessions | ChannelState 有欄位但永遠空 array，無 create mechanism | Dead field |

### P2（可選）

| # | 位置 | 問題 |
|---|---|---|
| 8 | client: EffortSwitch | Magic numbers（76px, 14px, 2px）|
| 9 | client: 22 components | 無獨立測試（透過 parent 間接覆蓋）|
| 10 | server: SettingsStore | 每次 getAll() readFileSync，無 cache |
| 11 | server: ChannelManager findByRequestId | O(n) 遍歷所有 channels |
| 12 | server: 12 處 silent .catch(() => {}) | 吞錯誤，但多為 fire-and-forget |
| 13 | shared: schemas/chat.ts | 60+ schemas 在單一檔案 |
