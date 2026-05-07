## Context

Server 有 pino logger 但設定不走 config.ts；summoner 沒有 logger。`WsTransport` 用自訂的 `WsTransportLogger`（只有 `warn`），與 pino 不一致。

目前 `@code-quest/shared/node` 已是 server/summoner 共用的 Node-only entry point。

## Goals / Non-Goals

**Goals:**
- 統一 Logger interface，相容 pino，取代 `WsTransportLogger`
- shared/node 提供 `parseLogConfig(env)` 解析 `LOG_LEVEL` / `LOG_PRETTY`
- server/summoner 各自 config.ts 加 log 設定、logger.ts 用 `parseLogConfig`
- .env.example 文件化

**Non-Goals:**
- shared 不加 pino dependency（各 package 自行建 pino instance）
- 不做 structured logging / log rotation / log file output
- 不改 client（瀏覽器端無 pino）

## Decisions

### 1. Logger interface 放 shared/node，不放 shared barrel

**選擇**: `@code-quest/shared/node` export `Logger` interface

**理由**: Logger interface 語義上屬於 server-side infra，client 不需要。放 barrel 會汙染 client 的 API surface。與 transport 放同一個 sub-path 一致。

### 2. parseLogConfig 而非 createLogger

**選擇**: shared/node 只 export config parsing function，不建 pino instance

**替代方案**: shared 加 pino dep 並 export `createLogger()`

**理由**: `pino(options)` 就一行，不值得讓 shared 多 runtime dependency。shared 的角色是共用 schema/type/util，不是共用 runtime service。

### 3. LOG_LEVEL=silent 取代獨立 LOG_ENABLED

**選擇**: 不新增 `LOG_ENABLED` env var

**理由**: pino 原生支援 `silent` level，功能等同 `enabled=false`。少一個 env var 少一個概念。

### 4. LOG_PRETTY 預設 false

**選擇**: 不自動偵測 dev/prod，一律預設 `false`

**理由**: 預設 JSON 輸出對 log aggregation 友好。開發者想看 pretty 自己設 `LOG_PRETTY=true`。避免 `NODE_ENV` 判斷帶來的隱式行為。

### 5. WsTransportLogger → Logger

**選擇**: 廢除 `WsTransportLogger`，`WsTransport` constructor 改接 `Logger`

**理由**: `WsTransportLogger` 只有 `warn`，太窄。統一用 `Logger` 後，`WsTransport` 內部可以自由使用 info/error/debug 不需改 interface。pino instance 天然相容 `Logger`。

## Risks / Trade-offs

- **BREAKING: `WsTransportLogger` 移除** → 只有 `server/bin/server.ts` 一處 consumer，影響極小。migration 就是刪舊 import、改用 `Logger` type。
- **pino-pretty 需要額外安裝** → 各 package 已有 pino，加 `pino-pretty` 為 devDependency 即可。不裝的話 `LOG_PRETTY=true` 會 fallback 到 JSON。
