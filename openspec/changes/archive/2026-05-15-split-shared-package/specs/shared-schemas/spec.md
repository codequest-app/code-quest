## Overview

`@code-quest/schemas` 是純契約層 package，提供 Zod schemas、TypeScript interfaces 與 socket event type 定義。任何環境（browser、Node.js）均可 import，零 runtime 依賴（除 zod 外）。

## Requirements

### Requirement: Zero Runtime Dependencies

package 只允許依賴 zod。不可引入任何 Node.js built-in（`fs`、`path`、`net` 等）或第三方 runtime library。

### Requirement: Contains Shared Contracts

以下檔案從 `packages/shared` 移入：
- `schemas/` — 所有 Zod schema 定義與推導型別
- `services/` — FilesystemService、GitService 等 service interfaces
- `socket-events.ts` — ClientToServerEvents、ServerToClientEvents
- `content-types.ts` — MIME enum
- `transport/types.ts`、`transport/transport.ts`、`transport/agent-transport.ts` — transport interfaces
- `transport/envelope.ts` — Envelope data shape
- `transport/rpc-channel.ts` — RPC channel type
- `remote/protocol.ts`、`remote/protocol-schemas.ts`、`remote/methods.ts` — JSON-RPC protocol types

### Requirement: Named Exports via Index

`src/index.ts` 以 named export 重新匯出所有公開 API，不使用 wildcard re-export（`export * from`）。
