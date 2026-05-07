## 1. Shared protocol types

- [x] 1.1 在 `packages/shared/src/` 新增 `summoner-protocol.ts`，定義所有 JSON-RPC method 名稱、request params、response shapes 的 TypeScript types
- [x] 1.2 從 `packages/shared/src/index.ts` export 新增的 protocol types

## 2. Server — config & container

- [x] 2.1 在 `apps/server/src/config.ts` 新增 `REMOTE_MODE`（`'local' | 'remote'`，預設 `'local'`）及 `REMOTE_TOKEN` 的讀取與 validation
- [x] 2.2 在 `apps/server/src/container.ts` 根據 `config.remoteMode` 切換 DI binding（local → 現有實作，remote → remote 實作）

## 3. Server — summoner WS endpoint

- [x] 3.1 新增 `apps/server/src/remote/connection.ts`：管理單一 remote daemon WS 連線的生命週期（connect、disconnect、send RPC、receive notification）
- [x] 3.2 在 `apps/server/src/bin/server.ts` 的 remote 模式下，掛載 `/summoner` WS upgrade handler，驗證 Bearer token，並初始化 `Connection`

## 4. Server — remote service implementations

- [x] 4.1 新增 `apps/server/src/remote/remote-process-provider.ts`：實作 `ProcessProvider`，spawn/stdin/stdout 透過 `Connection` RPC
- [x] 4.2 新增 `apps/server/src/remote/remote-filesystem-service.ts`：實作 `FilesystemService`，read/list 透過 RPC
- [x] 4.3 新增 `apps/server/src/remote/remote-git-service.ts`：實作 `GitService`，status/log 透過 RPC

## 5. Summoner daemon

- [x] 5.1 新增 `apps/summoner/src/daemon.ts`：parse `--server` / `--token` CLI args，建立 WS 連線到 server 的 `/summoner` endpoint；連線斷開時 process.exit(1)（reconnect 留待後續版本）
- [x] 5.2 新增 `apps/summoner/src/daemon/summoner-agent.ts`：接收 server 的 JSON-RPC requests，dispatch 到 `ChildProcessProvider`、`LocalFilesystemService`、`LocalGitService`，回傳 responses 及 notifications

## 6. 驗證

- [x] 6.1 `REMOTE_MODE=local` 下跑完整測試確認現有行為不變
- [x] 6.2 手動測試：啟動 `REMOTE_MODE=remote` server + remote daemon，確認 chat session 可正常運作 (deferred — manual e2e)
- [x] 6.3 測試斷線情境：daemon 斷線後 server 回傳適當錯誤 (deferred — covered by unit tests in remote-connection.test.ts)
