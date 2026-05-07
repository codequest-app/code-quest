## Context

cc-office 現況：
- Server（Node + inversify）用 `socket.io` 當 transport 入口，handler 全部透過 `ChannelEmitter` 訂閱事件。`ChannelEmitter` 已經做了 transport 抽象：維護 `channelSockets / socketChannels / socketRefs` 三張 map，handler 完全沒碰 `io.emit`。
- Client（React）用 `socket.io-client`，被 `apps/web/src/socket/client.ts` + `rpc.ts` 包起來，上層 hooks / components 透過 `emit` / `on` / `request` API 溝通，不直接接觸 socket.io。
- 測試用 `FakeSummoner` harness，server 跑真 socket.io server、client 跑真 socket.io-client，搭配 in-memory DB 和 FakeCLI。

觸發本次 change 的長期壓力：
1. Rust summoner 即將動工（見 `rpg-roadmap` / `project-memory`）。Rust 的 socket.io 生態薄，會拖慢進度。
2. Edge runtime（Cloudflare Workers / Vercel Edge）只支援原生 ws，socket.io 的 polling fallback 無法跑。
3. 2025 年 socket.io 在新框架 / 新 runtime 的採用率相對下滑（Next.js / Hono / Cloudflare / Bun 全都推 native ws）。

## Goals / Non-Goals

**Goals:**
- Transport 層完全替換為原生 ws：server 用 `ws` library、client 用瀏覽器原生 `WebSocket`
- Handler / business code / Zod schema / UI **零改動**
- Reconnect + sequence replay + heartbeat **比 socket.io 更可靠**（socket.io 的 auto-reconnect 不保訊息不掉；本次明確補上 seq-based replay）
- 測試 harness（FakeSummoner）完整可用，既有測試全綠
- 可灰度：server 端允許兩套 transport 並存，flag 切換

**Non-Goals:**
- 不做 Rust summoner 本身（本 change 只鋪路）
- 不做 public WebSocket API 對外開放
- 不改 event name 或 payload shape
- 不引入新功能（presence / read receipts 之類放未來 change）
- 不做跨 tab 同步以外的協作功能（rooms 邏輯保留現有，多人協作留 future change）

## Decisions

### D1: 用 `ws` library（server），不用 `uWebSockets.js`

**選擇**：`ws` （weekly downloads ~1 億，Node 生態絕對主流，零依賴）

**替代**：
- `uWebSockets.js`：效能強 3–5 倍，但 API 不相容、生態小、Node 版本綁定緊
- `socket.io` 保留：就是本次要換掉的對象

**理由**：cc-office 流量離 `ws` 極限還很遠；`ws` API 穩定、和 http server 整合無痛、所有主流 library（Fastify ws、Next.js HMR、Vite、Playwright）底層都在用，維運成本最低。效能不是現在瓶頸。

### D2: Client 用原生 `WebSocket`，不裝 library

**選擇**：瀏覽器原生 `WebSocket` + 自寫 `WsClient` 包裝（reconnect / outbox / request-response / event bus）

**替代**：
- `partysocket`：封裝好 reconnect + queue，~4KB
- `reconnecting-websocket`：只解 reconnect
- `isomorphic-ws`：跨 runtime shim，但 cc-office client 只跑瀏覽器

**理由**：
- 本 change 需要 resume + lastSeq 協定跟 server 緊密配合，通用 library 做不到這層
- 自寫的 `WsClient` 正好是 transport contract 的具體實作點，未來要換 WebTransport / SSE 都從這改
- 零依賴、零 bundle 負擔
- reconnect 正確做（visibility change + backoff + resume）~50 行，可維護

### D3: Envelope 協定

統一在 `packages/shared/src/transport/envelope.ts`：

```ts
type Envelope =
  | { kind: 'event'; seq: number; event: string; data: unknown }
  | { kind: 'request'; id: string; event: string; data: unknown }
  | { kind: 'response'; id: string; ok: boolean; data?: unknown; error?: string }
  | { kind: 'ping' }
  | { kind: 'pong' }
  | { kind: 'resume'; lastSeq: number };
```

以 Zod schema 驗證，兩端共用。`event` 欄位承接現有 protocol event name，payload 不變放 `data`。

**為何要 `seq`**：socket.io 的 auto-reconnect **不保訊息不掉**。本次明確補上——server 為每個 socket 維護 ring buffer（最後 N 筆 outgoing event），client 重連時送 `resume { lastSeq }`，server 從 buffer 補送 `seq > lastSeq` 的事件。

**為何 request 單獨一種 kind**：把「一次性 request-response」跟「subscription event stream」語意分開，比 socket.io 的 ack callback 更清楚，未來換 transport 也不用重想。

### D4: 兩層抽象——`TypedSocket`（per-connection）+ `Transport`（per-protocol）

設計上劃**兩層**而非一層：

- **`TypedSocket`（已存在於 `apps/server/src/socket/types.ts`）**：單一連線的最小介面（`id` / `emit` / `on`）。socket.io 的 `Socket` 和未來的 `WsSocketAdapter` 都結構性相容。
- **`Transport`（新）**：協定整體的 contract，負責「掛上 HTTP server / 接受連線 / 產生 `TypedSocket`」。

```ts
export interface Transport {
  attach(httpServer: http.Server): TransportHandle;
}

export interface TransportHandle {
  onConnection(listener: (socket: TypedSocket) => void): () => void;
  close(): Promise<void>;
}

export class SocketIoTransport implements Transport { /* … */ }
export class WsTransport implements Transport { /* … */ }
```

`bin/server.ts` 從 config 決定要掛哪幾個 transport（可同時掛多個），全部 transport 的 `onConnection` callback 餵進**同一個** `ChannelEmitter`。Handler 完全不知道下面是誰。

**替代**：只有 `TypedSocket`，沒有 `Transport` interface。
**拒絕理由**：那樣 `bin/server.ts` 的 transport 選擇邏輯只能用 `if/else`，加新 transport 要動 boot 程式碼；有了 contract 之後 boot 變成「迴圈所有設定的 transport，attach」。

### D5: socket.io 與 ws 永久平行（不刪 socket.io）

兩個 transport 都是一等公民，**長期並存**而非「過渡 phase 後砍掉」。

理由：
1. 不同 client 可走不同 transport（瀏覽器仍用 socket.io、Rust summoner 用 ws、未來 SSE / WebTransport 同理插）
2. 任何時刻關掉 flag 就回退，零風險
3. socket.io 仍然解決 polling fallback / corp proxy 的問題；不刪掉它就不必賭未來不需要
4. 維護成本主要是「transport 適配層」幾百行，handler 共用，邊際維護成本低

**Default 切換時機**：Phase 1 ws 並存上線、staging 跑穩 → Phase 2 client 預設改走 ws → socket.io 仍保留為 fallback。沒有 Phase 3 的「砍除」。

### D5a: Authenticator 抽出 Transport

Auth 規則（cookie / JWT / OAuth / API key / 過期判斷）是 HTTP 商業邏輯，跟 transport 物理協定無關。socket.io 的 `io.use()` middleware 和 ws 的 upgrade-time 驗證拿到的都是同一個 `IncomingMessage`，餵同一個 authenticator 就能共用。

```ts
export interface Authenticator {
  authenticate(req: http.IncomingMessage): Promise<AuthContext | null>;
}
```

每個 Transport 建構子吃 authenticator，自己決定**何時**呼叫（handshake）和**如何**拒絕（HTTP 401）。Authenticator 只回答「這個 req 對應誰、過了沒」。

**理由**：未來加 OAuth、API key、IP 限制都不會動到 Transport 程式碼。

### D5b: Broadcast 在 Emitter 層，不在 Transport

`ChannelEmitter` 已經維護 `socketRefs: Map<string, TypedSocket>`。`broadcastAll` 直接迴圈這個 map 呼叫每個 socket 的 `emit`，跨 transport 自然 fan-out，無需 Transport 介面提供 `broadcast` 方法。

**理由**：
- 兩個 transport 各自實作 broadcast 等於兩份相同迴圈
- 跨 transport 的 broadcast 語意自動正確
- Transport contract 因此更瘦、更好新增實作

cc-office 流量規模不需要 socket.io rooms 那種底層優化；per-socket emit fan-out 完全夠。

### D5c: ResumableSocket wrapper（取代 transport-level replay）

Replay buffer **不放進 Transport contract**。改成獨立 wrapper：

```ts
class ResumableSocket implements TypedSocket {
  constructor(private inner: TypedSocket, private buffer: ReplayBuffer) {}
  emit(event, ...args) {
    const seq = ++this.nextSeq;
    this.buffer.push({ seq, event, args });
    this.inner.emit(event, ...args);
  }
  resume(lastSeq: number) { /* 從 buffer 補送 */ }
}
```

收到新連線時，server 依 sessionKey 找回（或新建）一個 `ResumableSocket`，把當前 transport 產生的 `TypedSocket` 設為 `inner`。

**好處**：
1. socket.io 也吃到 replay——它本身的 auto-reconnect bug（斷線期間訊息掉）也順便修好
2. Transport contract 維持瘦、只管連線生命週期
3. 任何未來 transport（SSE、WebTransport）自動相容
4. `seq` 邏輯只有一份，不會兩個 transport 各寫一遍走鐘
5. 測試時不需要 wrapper 的 service 直接吃 raw `TypedSocket` 即可，零負擔

**ws transport 多做的一件事**：envelope 協定多了 `{ kind: 'resume', lastSeq }` 訊息類型——這是 ws 特有的「client 主動回報接續點」機制。socket.io 端的 resume 觸發走 `socket.io reconnection_attempt` event + application-level resume event。兩條路徑最終都呼叫 `ResumableSocket.resume(lastSeq)`，邏輯共享。

### D6: TDD 流程

1. `envelope` schema + 單元測試（Zod parse round-trip、kind discriminator）
2. `WsClient` 單元測試（mock WebSocket）：emit / on / request / reconnect / outbox / resume
3. `WsTransport` integration test：真 `http.createServer` + `ws` + 真 client，驗證 envelope round-trip、seq replay、heartbeat、auth、斷線清理
4. `ChannelEmitter` adapter 相容性測試：既有 emitter 測試必須全綠
5. FakeSummoner 雙軌
6. 切 client.ts / rpc.ts：既有 hook / component 測試全綠
7. 移除 socket.io 依賴

**原則**：Red-Green-Refactor，每一步都有失敗測試先行。對照 `tdd-guidelines` skill。

### D7: Auth 在 handshake

Ws upgrade request 帶 `Cookie` 或 `Authorization` header，server 在 `wss.on('connection', (ws, req) => ...)` 驗證，失敗回 HTTP 401（而不是 close code）。授權通過才建立 `socketMeta`。

**替代**：連上後再發 auth event。
**拒絕理由**：多一次 round-trip、server 要處理未授權連線的 state。

### D8: Heartbeat 25 秒

Nginx / Cloudflare / AWS ALB 預設 60 秒 idle 砍 ws。取 25 秒 ping（中位值）、client 也每 25 秒 ping 一次（雙向）。

`ws` library 有 `ws.ping()`（control frame），瀏覽器原生 `WebSocket` **沒有** `ping()` API——只能在 envelope 裡跑 `{ kind: 'ping' }`。所以 server 用 control frame ping 瀏覽器，client 用 envelope ping server。兩個方向各自有效。

### D9: Sequence 保證只對 server → client 方向

**決定**：server 端維護 outgoing seq + ring buffer；client → server 方向**不做 replay**。

**理由**：client → server 訊息若掉了，client 自己知道（沒收到 response / event 變化），可以重送。而 server → client 若掉了 client 完全無感（bug 的主要來源）。聚焦在一個方向大幅簡化設計。

Ring buffer 大小預設 500 筆 / per socket，可調。

## Risks / Trade-offs

- **[Risk] Proxy / CDN 不轉發 ws upgrade** → Mitigation: 文件明確要求部署環境支援 ws；staging 灰度期監控連線失敗率
- **[Risk] Reconnect storm（server 重啟大量 client 同時 reconnect）** → Mitigation: exponential backoff 起步 500ms、上限 10s、加 random jitter ±20%
- **[Risk] Ring buffer 爆記憶體（大量離線時間 + 高吞吐 channel）** → Mitigation: 固定大小 500 筆，超過就丟舊；client 若 resume 發現 gap 過大改走 full-refresh（重新 subscribe）
- **[Risk] 沒有 polling fallback，公司 proxy 擋 ws 的使用者連不上** → Mitigation: cc-office 目前定位為開發者工具，使用者環境受控；若未來出現再加 SSE fallback
- **[Trade-off] 自寫 reconnect 比 socket.io 多 2 天工** → Accepted: 換來 seq replay 能力（socket.io 自身做不到，但被 ResumableSocket wrapper 一起補上）、透明可 debug、協定一致
- **[Trade-off] 雙 transport 永久維護** → Accepted: 適配層幾百行，handler 共用，邊際維護成本遠低於「砍 socket.io 失去 fallback」的風險
- **[Risk] socket.id 在重連後會變（ws 重連是新連線）** → Mitigation: 引入 `sessionKey`（long-lived，client 本地存），server 以 sessionKey 認回 ResumableSocket，串起重連前後的狀態
- **[Risk] 兩 transport 行為差異被 handler 觀察到** → Mitigation: 強制透過 `TypedSocket` 介面互動，Transport-specific 細節（envelope、ack callback）封死在 Transport / Adapter 層；contract test 同一份 spec 跑兩種 transport

## Migration Plan

> **戒律**：每一步都嚴格 Red-Green-Refactor。WsTransport / WsClient 先用**真 ws library + 真 http.createServer** 寫整合測試到全綠，**之後才** extract Fake 給上層 unit test 用。Fake 不是 mock 出來的玩具，是整合測試已驗證的行為的輕量替身。

1. **Phase 1 — 抽象骨架**：
   - 已完成：envelope schema (Group 1)、`TypedSocket` 抽象 (Group 3)
   - 接下來：新增 `Transport` / `TransportHandle` interface + `Authenticator` interface
   - SocketIoTransport 包裝既有 socket.io 程式碼以滿足 Transport contract（既有測試全綠 = 抽象正確）

2. **Phase 2 — WsTransport 真貨**：
   - 整合測試先行：`http.createServer()` + 真 `ws` lib + 真 client 連線，驗證 envelope round-trip / heartbeat / auth handshake / 斷線清理
   - 全綠後 extract `FakeWsTransport`（in-memory，無 http），給 channel-emitter / handlers 等上層 unit test 共用
   - ResumableSocket wrapper 獨立 TDD（包進 emitter handleConnection 流程前先單元測試）

3. **Phase 3 — Client 端**：
   - `WsClient` 用 mock WebSocket 跑 unit test（reconnect / outbox / resume / request）
   - 一個 e2e drill 用真 server + 真 browser WebSocket（不 mock）端到端
   - `client.ts` / `rpc.ts` 改走 `WsClient`，既有 hook / component 測試**零改動**全綠

4. **Phase 4 — Default 切換**：
   - `apps/server/src/config.ts` 加 `TRANSPORT` env（值 `ws` / `socketio` / `both`），預設 `ws`
   - `apps/web/src/config.ts` 對應加 client 端 transport 選擇
   - Staging 跑 ws default 1–2 天監控

5. **永久狀態**：socket.io 不刪。default = ws，socket.io 為 fallback / legacy client 通道。任一 transport 都能透過 env 開關獨立啟停。

**Rollback**：任何階段都可 revert commit 或翻 env flag。

## Open Questions

- 授權：目前 handshake 用 cookie，這邏輯跟 HTTP route 的 auth middleware 共用嗎？需要再 review `apps/server/src/routes/**` 確認，最終 `Authenticator` 實作直接重用既有 cookie 解析。
- sessionKey 產生時機：handshake query string？還是第一個 request envelope？傾向 handshake query（early validation + ResumableSocket 認回邏輯前置）。
- Ring buffer 500 筆是否足夠：需要根據實測決定，初版先跑再調，跨 transport 共用同一個 buffer 大小。
- Fake 萃取顆粒度：`FakeWsTransport` 是否需要支援多 socket？目前看單 socket 已涵蓋大部分 unit test，多 socket 場景由 `FakeSummoner` harness 提供，不重複設計。
