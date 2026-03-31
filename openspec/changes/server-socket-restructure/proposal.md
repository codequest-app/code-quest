## Why

server/src/socket/ 的 handler 檔名帶冗餘 `-handler` 後綴、helpers.ts 混合 domain logic 和 utilities、Claude-specific code 散落各 handler、HandlerContext 是 god object、chat-handler.ts 名不副實。加入 Gemini 前需要先分離 provider-specific code。

## What Changes

- handler 檔名去 `-handler` 後綴（handlers/ 資料夾已說明）
- session handler 拆成 session/ 資料夾（management + lifecycle + fork）
- helpers.ts 消除，每個函式歸屬它的 domain
- Claude-specific handlers 搬到 claude/（auth, plugin, mcp-servers）
- chat-handler.ts → server.ts（class ChatHandler → SocketServer）
- handler-context.ts → types.ts + context.ts
- HandlerContext 瘦身（移除 chromeMcpState, pluginCache 到 claude/ 專屬 state）
- 純重構，行為完全不變，所有 test expect 不變或等價

## Capabilities

### New Capabilities

（無新功能，純重構）

### Modified Capabilities

（無行為變更）

## Impact

- packages/server/src/socket/ 所有檔案重新組織
- test 檔案 import path 更新
- DI binding 更新（ChatHandler → SocketServer）
- 外部消費者（bin/server.ts, container.ts）import path 更新
