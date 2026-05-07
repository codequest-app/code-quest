## Why

目前 server 與 summoner（CLI process 管理）必須跑在同一台機器上，限制了部署為雲端服務的可能性。透過 `.env` flag 切換 local/remote 兩種模式，可以在不破壞現有 single-user local 部署的前提下，讓 summoner 以 daemon 形式在用戶本地執行，並透過 WebSocket 連到雲端 server。

## What Changes

- 新增 `REMOTE_MODE=local|remote` 環境變數，控制 server 的 ProcessProvider binding
- `local` 模式（預設）：行為與現在完全相同，`ChildProcessProvider` 直接 spawn CLI
- `remote` 模式：server 等待 remote daemon 透過 WS 連入，所有 local 操作（spawn、filesystem、git）透過該連線代理
- 新增 `summoner-daemon` 可執行程式：用戶本地手動啟動，連到 server，處理所有需要碰本地資源的操作
- server 端新增 `RemoteProcessProvider`、`RemoteFilesystemService`、`RemoteGitService`，透過 DI 在 remote 模式下替換 local 實作
- 新增 summoner ↔ server 之間的 WS protocol（typed RPC）
- remote daemon 連線時帶 token（從 `.env` 設定），server 驗證後綁定為 single-user 連線

## Capabilities

### New Capabilities

- `summoner-daemon`: 本地常駐 daemon，連到 server，代理 CLI spawn 與本地服務
- `summoner-server-protocol`: summoner ↔ server 之間的 WS typed RPC protocol
- `remote-process-provider`: server 端的 remote DI 實作（ProcessProvider、FilesystemService、GitService）

### Modified Capabilities

- `adapter`: server 啟動時根據 `REMOTE_MODE` 決定 DI binding，影響 container 初始化流程

## Impact

- `apps/server`：`container.ts` 增加 mode-based binding，新增 `remote/` 目錄放 remote 實作
- `apps/summoner`：新增 `daemon.ts` 入口，`SummonerAgent` class
- `packages/shared`：新增 summoner ↔ server protocol type 定義
- 現有 local 模式行為不變，無 breaking change
- single-user only，不處理多用戶隔離（`NullAuthenticator` 仍適用，只是 token 換成配對用途）
