## Why

Server 的 logger 直接讀 `process.env.LOG_LEVEL`，不走 `config.ts`；summoner 完全沒有 logger。`WsTransport` 自定義了只有 `warn` 的 `WsTransportLogger` interface，太窄且與 pino 不一致。需要統一 log 設定管道、共用 Logger interface、讓兩個 package 都能透過 `.env` 控制 log level 和格式。

## What Changes

- shared/node 新增通用 `Logger` interface（相容 pino），取代 `WsTransportLogger`
- shared/node 新增 `parseLogConfig(env)` utility，統一解析 `LOG_LEVEL` / `LOG_PRETTY`
- server `config.ts` 加入 log 設定，`logger.ts` 改用 `parseLogConfig`
- summoner `config.ts` 加入 log 設定，新增 `logger.ts`
- **BREAKING**: `WsTransportLogger` 廢除，改用 `Logger`
- `.env.example` 加入 `LOG_LEVEL` / `LOG_PRETTY` 說明

## Capabilities

### New Capabilities
- `logger-config`: 統一 Logger interface、log config parsing、env 變數設計

### Modified Capabilities

## Impact

- `packages/shared/src/node.ts` — 新增 `Logger` interface + `parseLogConfig` export
- `packages/shared/src/transport/ws-transport.ts` — `WsTransportLogger` → `Logger`
- `packages/server/src/config.ts` — `AppConfig` 加 `log` 欄位
- `packages/server/src/logger.ts` — 改用 `parseLogConfig`
- `packages/summoner/src/config.ts` — `RemoteConfig` 加 `log` 欄位
- `packages/summoner/src/logger.ts` — 新增
- `packages/server/.env.example` / `packages/summoner/.env.example` — 加文件
