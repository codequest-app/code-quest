## 1. shared/node — Logger interface + parseLogConfig

- [x] 1.1 新增 `Logger` interface 和 `NOOP_LOGGER` 常數到 shared，從 node.ts export
- [x] 1.2 新增 `parseLogConfig(env)` function，含 level 驗證和 pretty parsing
- [x] 1.3 為 `parseLogConfig` 寫單元測試（default / valid level / invalid level / pretty）

## 2. WsTransport — 替換 WsTransportLogger

- [x] 2.1 `ws-transport.ts` 移除 `WsTransportLogger`，constructor 改接 `Logger`，default 用 `NOOP_LOGGER`
- [x] 2.2 更新 node.ts export（移除 `WsTransportLogger`）
- [x] 2.3 確認 server `bin/server.ts` 傳入 pino logger 仍正常（型別相容）

## 3. server — config + logger 整合

- [x] 3.1 `config.ts` 的 `AppConfig` 加 `log: { level: string; pretty: boolean }`，用 `parseLogConfig`
- [x] 3.2 `logger.ts` 改用 `config.log` 建立 pino instance
- [x] 3.3 `.env.example` 加 `LOG_LEVEL` / `LOG_PRETTY` 說明

## 4. summoner — config + logger

- [x] 4.1 `config.ts` 的 `RemoteConfig` 加 `log: { level: string; pretty: boolean }`，用 `parseLogConfig`
- [x] 4.2 新增 `logger.ts`，export pino logger
- [x] 4.3 `.env.example` 加 `LOG_LEVEL` / `LOG_PRETTY` 說明

## 5. server — 補 error/warn log（silent catch）

- [x] 5.1 `claude/auth.ts` — catch block 加 `logger.error`
- [x] 5.2 `handlers/mcp.ts` — catch block 加 `logger.error`
- [x] 5.3 `control-request-tracker.ts` — timeout/disconnect reject 加 `logger.warn`
- [x] 5.4 `container.ts` — throw Error 前加 `logger.error`
- [x] 5.5 `remote/git-service.ts` — 錯誤由 caller 處理，無需加 log
- [x] 5.6 `remote/filesystem-service.ts` — 錯誤由 caller 處理，無需加 log

## 6. server — 補 info log（lifecycle/state transitions）

- [x] 6.1 `handlers/session/connect.ts` — session create/join/close 加 `logger.info`
- [x] 6.2 `handlers/session/fork.ts` — session fork 加 `logger.info`
- [x] 6.3 `channel-manager.ts` — channel create/destroy 加 `logger.info`
- [x] 6.4 `channel.ts` — CLI process start/exit 加 `logger.info`
- [x] 6.5 `transport/socket-io-transport.ts` — socket connect/disconnect 加 `logger.info`
- [x] 6.6 `handlers/mcp.ts` — MCP toggle/reconnect 加 `logger.info`
- [x] 6.7 `remote/reconnectable-rpc.ts` — remote daemon connect/disconnect 加 `logger.info`

## 7. summoner — 遷移 console.* 到 logger

- [x] 7.1 `main.ts` — console.log/warn/error 改 logger.info/warn/error
- [x] 7.2 `transports/child-process.ts` — console.error 改 logger.error
- [x] 7.3 `fs-watch/local.ts` — console.error 改 logger.error
- [x] 7.4 `claude/plugin-cli.ts` — console.error 改 logger.error
- [x] 7.5 `runner.ts` — console.debug 改 logger.debug
- [x] 7.6 `git/git-runner.ts` — console.debug 改 logger.debug
- [x] 7.7 `filesystem/local.ts` — console.debug 改 logger.debug/warn
- [x] 7.8 `claude/protocol.ts` — 無 console.* 呼叫，跳過

## 8. summoner — 補 info log（lifecycle）

- [x] 8.1 `connection/agent.ts` — agent create/dispose、process spawn/exit 加 logger.info
- [x] 8.2 `git/worktree.ts` — worktree create/delete 加 logger.info
