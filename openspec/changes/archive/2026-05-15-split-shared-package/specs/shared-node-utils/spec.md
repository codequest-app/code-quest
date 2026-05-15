## Overview

`@code-quest/node-utils` 提供 Node.js 專用工具，只在 server 和 summoner 環境使用，不進 web bundle。

## Requirements

### Requirement: Node.js Only

只在 Node.js 環境執行。Web bundle 不可依賴此 package。

### Requirement: Contains Node-Specific Utilities

以下檔案從 `packages/shared` 移入：
- `logger.ts` — pino logger
- `node.ts` — Node.js specific utilities

### Requirement: Glue Files Assigned by Nature

`packages/shared` 剩餘的 `topic-emitter.ts`、`validators/`、`errors.ts`、`utils/` 按性質分散：
- 純 type/無副作用 → `@code-quest/schemas`
- Isomorphic runtime → `@code-quest/transport`
- Node.js only → `@code-quest/node-utils`
