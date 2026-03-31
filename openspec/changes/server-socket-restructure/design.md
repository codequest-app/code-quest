## Context

server/src/socket/ 有 3,085 行，87% generic，13% Claude-specific。chat-handler.ts 是 god object，handler-context.ts 混合 types 和 interface，helpers.ts 混合 domain logic 和 utilities。

## Goals / Non-Goals

**Goals:**
- 檔名準確反映內容
- Claude-specific code 集中到 claude/
- helpers.ts 消除，函式歸屬 domain
- HandlerContext 逐步瘦身
- 所有 test expect 不變或等價

**Non-Goals:**
- 不改變任何 runtime 行為
- 不加入 Gemini 實作（只預留結構）
- 不重構 handler 內部邏輯

## Decisions

### 目標結構

```
server/src/socket/
├── types.ts                          (TypedSocket, TypedServer, errMsg, ensureChannel)
├── context.ts                        (HandlerContext interface)
├── server.ts                         (SocketServer class — DI + 註冊 + buildChannelHooks)
├── channel.ts
├── channel-manager.ts
│
├── handlers/
│   ├── connection.ts
│   ├── session/
│   │   ├── index.ts
│   │   ├── management.ts
│   │   ├── lifecycle.ts             (+ persistNewSession + DEFAULT_THINKING_TOKENS)
│   │   └── fork.ts
│   ├── message.ts
│   ├── settings.ts
│   ├── file.ts                      (+ rg*)
│   ├── git.ts                       (+ execGit)
│   ├── terminal.ts
│   ├── mcp.ts                       (generic MCP operations)
│   ├── plan.ts
│   └── speech.ts
│
└── claude/
    ├── auth.ts
    ├── plugin.ts                    (+ runPluginCommand*)
    └── mcp-servers.ts               (chrome/jupyter enable/disable)
```

### 分步驟

每步改完跑全部 test 確認 expect 不變。

Phase 1: handler 檔名去 `-handler` 後綴
Phase 2: helpers.ts 拆散到各 domain
Phase 3: session/ 資料夾
Phase 4: Claude-specific 搬到 claude/
Phase 5: chat-handler.ts → server.ts（ChatHandler → SocketServer）
Phase 6: handler-context.ts → types.ts + context.ts
Phase 7: HandlerContext 瘦身

## Risks / Trade-offs

- import path 大量變動 — 但純 rename，git 追蹤正確
- DI binding 改名 — container.ts 需更新
- Phase 7 可能發現 HandlerContext 難以瘦身 — 可暫停，不影響其他 phase
