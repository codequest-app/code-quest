## Overview

`@code-quest/transport` 提供 isomorphic 網路實作，包含 WebSocket client、resumable socket、pipeline 與 middleware。可在 browser 和 Node.js 環境執行，依賴 `@code-quest/schemas`。

## Requirements

### Requirement: Isomorphic Runtime

所有程式碼必須在 browser 和 Node.js 均可執行，不可引入 Node.js 專用 built-in（`fs`、`child_process` 等）。

### Requirement: Contains Network Implementation

以下檔案從 `packages/shared/src/transport/` 移入：
- `ws-client.ts`、`ws-adapter.ts`、`ws-transport.ts` — WebSocket 實作
- `resumable-socket.ts` — 斷線重連
- `pipeline.ts`、`connection-loop.ts` — 連線流程
- `authenticator.ts` — 認證
- `middleware/` — auth、heartbeat、resumable middleware

### Requirement: Depends on Schemas

依賴 `@code-quest/schemas`，不可反向依賴（no circular dependency）。
