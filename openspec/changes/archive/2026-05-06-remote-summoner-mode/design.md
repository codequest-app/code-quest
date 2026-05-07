## Context

現在 server 直接透過 `ChildProcessProvider`（來自 `@code-quest/summoner`）在本地 spawn CLI process，所有 local 服務（FilesystemService、GitService 等）也在同一 process 內執行。DI container（Inversify）已經抽象了 `ProcessProvider` 的 binding，為切換提供了天然的擴充點。

目標是在不改動現有 local 模式的前提下，讓 server 可以切換到 remote 模式，由本地的 remote daemon 透過 WS 連線處理所有需要碰本地資源的操作。

## Goals / Non-Goals

**Goals:**
- `REMOTE_MODE=local`（預設）行為與現在完全相同
- `REMOTE_MODE=remote` 下，server 透過 WS 連線代理所有 local 操作
- remote daemon 是獨立的可執行程式，用戶手動啟動
- single-user：一個 server 對應一個 remote daemon 連線

**Non-Goals:**
- 多用戶隔離（userId scoping）
- summoner 自動安裝或自動啟動
- NAT 穿透（summoner 主動連 server，不需要）
- 斷線重連的 session 保全（MVP 不處理）

## Decisions

**決策 1：DI binding 在 container.ts 根據 REMOTE_MODE 切換**

- Option A：runtime if/else 在每個 service 內部 → 散落各處，難維護
- Option B：container.ts 統一根據 mode bind 不同實作 ✓

選 B。所有切換邏輯集中在一個地方，新增 provider 時只需要在 container 加一行。

**決策 2：summoner ↔ server protocol 用 typed JSON-RPC over WebSocket**

- Option A：自訂 event 格式（類似 Claude CLI 的 stream-json）
- Option B：JSON-RPC 2.0 over WS ✓

選 B。JSON-RPC 2.0 有清楚的 request/response/notification 語意，request ID 配對是內建的，不需要自己實作。Codex app-server 也用同樣的設計。

**決策 3：server 端新增 `/summoner` WS endpoint 專供 daemon 連入**

與 browser 的 Socket.IO endpoint 分開，避免混用。summoner 連入時帶 `Authorization: Bearer <token>`，server 驗證後記錄這條連線為 "the summoner"。

**決策 4：Remote 實作放在 `apps/server/src/remote/`**

- `RemoteProcessProvider`：實作 `ProcessProvider`，把 spawn/stdin/stdout 透過 WS RPC 轉發
- `RemoteFilesystemService`：實作 `FilesystemService`，read/list 透過 WS RPC
- `RemoteGitService`：實作 `GitService`，git 操作透過 WS RPC

**決策 5：remote daemon 放在 `apps/summoner/src/daemon.ts`**

不新增獨立 package，daemon 是 summoner package 的一個入口點。執行方式：`node apps/summoner/dist/daemon.js --server wss://... --token <token>`

## Risks / Trade-offs

- [Risk] WS 斷線時 in-flight CLI session 狀態遺失 → Mitigation: MVP 不處理，記錄為已知限制；斷線時 server 關閉相關 channel
- [Risk] remote 模式下 latency 增加（每個 fs/git call 多一個 WS round-trip）→ Mitigation: 對 chat 應用影響不大，可接受
- [Risk] token 明文在 .env → Mitigation: single-user 環境可接受，未來加 OAuth 時替換

## Migration Plan

1. `REMOTE_MODE` 預設 `local`，現有部署無需任何改動
2. 想切 remote 的用戶：在 server `.env` 設 `REMOTE_MODE=remote` + `REMOTE_TOKEN=<secret>`，在本地執行 remote daemon
3. Rollback：改回 `REMOTE_MODE=local` 重啟 server

## Open Questions

- remote daemon 的 binary 要怎麼分發？npm package？直接 `npx`？（MVP 先假設用戶自己從 repo build）
- WS protocol 的 message 定義要放在 `packages/shared` 還是 `apps/server`？（建議 shared，因為 daemon 和 server 雙方都要 import）
