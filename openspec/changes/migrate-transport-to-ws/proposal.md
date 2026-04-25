## Why

cc-office 目前以 socket.io 作為 browser ↔ server 的 realtime transport。短期功能夠用，但三個壓力正在累積：未來 Rust summoner 落地時 socket.io 在 Rust 生態支援薄弱（`rust-socketio` 維護零星、協定相容性常落後）；協定不一致會讓後續開 public API 或新增 runtime（Bun / edge）的成本倍增；client bundle 多揹 ~40KB。

現在是最便宜的遷移時機——server 端 `ChannelEmitter` 已把 handler 層跟 transport 完全隔離（見 `packages/server/src/socket/channel-emitter.ts`），所以這次改動只觸及 transport 邊界，20+ 個 handler 全部零改動。錯過這扇窗再往下加功能，抽象會被稀釋，成本只會變高。

## What Changes

- 新增 `transport` capability：定義 `Transport` interface、`Authenticator` interface、`TypedSocket` 抽象、`ResumableSocket` wrapper（跨 transport 共用的 seq + replay）、ws envelope 協定（event / request / response / ping / pong / resume）
- **socket.io 與 ws 永久平行**：default transport 改為 ws（透過 `TRANSPORT` env 切換 `'ws' | 'socketio' | 'both'`），socket.io 保留為 fallback / legacy 通道，**不刪除**
- Server 新增 `WsTransport`（基於 `ws` library）、`SocketIoTransport`（包裝既有 socket.io 程式碼）；兩者都 implements 同一個 `Transport` contract
- 既有 `ChannelEmitter` / `ChannelManager` / handlers API 不變（`TypedSocket` 抽象已就位）
- Client 改寫 `packages/client/src/socket/client.ts` + `rpc.ts`：依 client 端 `TRANSPORT` config 選擇底層 client（原生 `WebSocket` 自寫的 `WsClient`，或既有的 `socket.io-client`）；對外 hook API 維持完全相容
- Shared 新增 `transport/envelope.ts`（Envelope 型別 + Zod schema），ws transport 專用 wire format
- Authenticator 抽出，HTTP-layer 邏輯由兩個 transport 共用同一份實作
- ResumableSocket wrapper 套在每個 `TypedSocket` 上，讓 socket.io 的「auto-reconnect 期間訊息會掉」bug 一併修好
- FakeSummoner（server + client）改造為跨 transport 的 harness
- Handler business code、Zod event schemas、UI 零改動

## Capabilities

### New Capabilities
- `transport`: Browser ↔ server 的 realtime transport 契約——envelope 協定、序列補償、心跳、重連、授權交握、channel 路由語意。獨立於具體實作（目前是 ws，未來可以是 WebTransport / SSE）。

### Modified Capabilities
- `protocol`: 現有 event name / Zod schema 不變，但需註記「envelope 是 transport 層外殼，protocol event 放在 envelope.data」
- `fake-summoner`: 測試 harness 底層從 socket.io server/client 換成 ws；對外 API（renderWithWorkspace 等）不變
- `client`: client-side socket 模組實作換底，對外的 socket/rpc hook 介面維持

## Impact

### Code
- `packages/server/src/socket/server.ts` — transport 入口換 WsTransport
- `packages/server/src/socket/channel-emitter.ts` — `TypedSocket` 改用自家介面，不再 import socket.io 型別
- `packages/server/src/socket/channel-manager.ts` — `register(io)` 參數型別換
- `packages/server/src/socket/types.ts` — socket.io 型別替換
- `packages/server/src/socket/ws-transport.ts` — **新增**
- `packages/client/src/socket/client.ts` — 重寫
- `packages/client/src/socket/rpc.ts` — 重寫
- `packages/shared/src/transport/envelope.ts` — **新增**
- `packages/server/src/test/fake-summoner.ts`（和 client 對應檔案）— 換底
- 所有 handler files（`packages/server/src/socket/handlers/**`）— **零改動**

### Dependencies
- 新增：`ws`（server）、`@types/ws`
- **不移除** `socket.io` / `socket.io-client`（保留為 fallback transport）
- Client default 走 ws 時不載入 `socket.io-client`（dynamic import 或條件 bundle，視 client config）

### Wire protocol
- 新增 ws JSON envelope wire format（在 `/ws` 路徑）
- 保留 socket.io Engine.IO framing（在 `/socket.io` 路徑）
- 兩個路徑同時可用，由 `TRANSPORT` env 控制

### Out of scope
- Handler 業務邏輯不動
- Zod event schemas 名稱與欄位不動
- UI 不動
- Rust summoner 本身不在本次 change（這次是為它鋪路：給它一個 ws transport 可以用）
- 「砍除 socket.io」不在本次 change；如果未來真的要砍是另一個獨立 change
