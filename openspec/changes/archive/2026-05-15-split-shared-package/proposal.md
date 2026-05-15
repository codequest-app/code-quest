## Why

`packages/shared` 是一個語義不清的 catch-all package，包含純型別契約、isomorphic 網路實作、Node.js 專用工具等性質完全不同的東西。新人不知道東西該放哪，結果持續往裡堆，維護邊界模糊。

## What Changes

- **BREAKING** 拆除 `packages/shared`，拆成三個具名 package：
  - `packages/schemas` — 純型別契約層（Zod schemas、service interfaces、socket event types、RPC protocol types），零 runtime 依賴（只有 zod）
  - `packages/transport` — isomorphic 網路實作（WsClient、resumable socket、pipeline、middleware），browser 和 Node.js 都能跑
  - `packages/node-utils` — Node.js 專用工具（pino logger、node.ts utilities）
- 所有 consumer（`apps/web`、`apps/server`、`apps/summoner`、`packages/test-kit`）的 import 從 `@code-quest/shared` 改為對應的具名 package
- `packages/shared` 完全移除

## Capabilities

### New Capabilities

- `shared-schemas`: 純契約層 package，包含 Zod schemas、service interfaces、socket event types、transport types、remote protocol types
- `shared-transport`: Isomorphic 網路實作 package，包含 WsClient、resumable socket、pipeline、middleware
- `shared-node-utils`: Node.js 專用工具 package，包含 logger（pino）、node utilities

### Modified Capabilities

- `transport`: 現有 transport spec 對應的實作從 `packages/shared/src/transport/` 移至 `packages/transport/`

## Impact

- 所有 import `@code-quest/shared` 的檔案需更新（web、server、summoner 各數十處）
- `package.json` 依賴宣告需更新
- `tsconfig` path alias 需更新
- `packages/test-kit` 依賴 `@code-quest/schemas` 而非 `@code-quest/shared`
