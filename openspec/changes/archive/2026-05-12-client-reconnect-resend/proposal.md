# Reliable Transport Layer — Plugin Architecture

## Why

WS 斷線時三個方向都會丟訊息：

1. **Client → Server**：使用者送出的 message 沒到 server
2. **Server → Client**：server push 的 events 沒到 client
3. **Summoner → Server**：CLI 繼續跑但 events 沒進 DB

目前完全沒有 delivery guarantee。這應該在 transport 層透明處理，app 層無感。

## What Changes

### 核心設計：Connection Plugin 機制

現有 `ChannelEmitter` 負責 socket tracking + event dispatch。
改為支援 plugins — 每個 plugin 獨立處理一個 cross-cutting concern。

Connection 功能拆成 plugins：
- **AckPlugin** — offset 追蹤，知道 client 讀到哪
- **BufferPlugin** — 斷線期間暫存 events，reconnect 後 replay
- **未來**：CompressionPlugin, LoggingPlugin, RateLimitPlugin

### ACK 機制

Server → Client 的每個 event 帶 offset。Client 定期 ACK「我收到到 offset X」。
Server 知道每個 client 的 last ACK offset → 斷線後只需 replay offset X+1 之後的 events。

```
Server emit({ event, offset: 42 }) → Client
Client → ACK({ offset: 42 })
Server 記住: socket.lastAckOffset = 42

斷線...
Server 繼續產生 events (offset 43, 44, 45) → 進 buffer

Reconnect...
Server: "上次 ACK 42，buffer 有 43-45" → replay
```

### Pluggable Buffer Storage

Buffer 的 storage 可抽換：

```ts
interface BufferStore {
  push(channelId: string, event: BufferedEvent): Promise<void>;
  getAfter(channelId: string, offset: string): Promise<BufferedEvent[]>;
  ack(channelId: string, offset: string): Promise<void>;
  prune(channelId: string, beforeOffset: string): Promise<void>;
}
```

| 實作 | 適用場景 |
|---|---|
| MemoryBufferStore | dev / test / 短暫斷線 |
| RedisBufferStore | production / 多 server 實例 |
| DatabaseBufferStore | fallback / 長時間斷線 / server restart |

### Plugin Interface

```ts
interface ConnectionPlugin {
  name: string;
  onEmit?(event: OutgoingEvent): OutgoingEvent | null;
  onReceive?(event: IncomingEvent): IncomingEvent | null;
  onConnect?(socket: TypedSocket): void;
  onDisconnect?(socket: TypedSocket): void;
  onReconnect?(socket: TypedSocket): void;
}
```

- `onEmit` — event 送出前攔截（加 offset、存 buffer）
- `onReceive` — event 收到時攔截（ACK 處理）
- `onConnect/Disconnect/Reconnect` — lifecycle hooks（buffer flush、offset reset）

### 架構圖

```
App Layer (handlers, channels, tasks)
    │  不知道 plugins 存在
    ↕
ChannelEmitter (dispatch + plugin pipeline)
    │
    ├─ AckPlugin (offset tracking)
    ├─ BufferPlugin (store: Memory | Redis | DB)
    └─ [future plugins]
    │
    ↕
Socket.io (transport, auto-reconnect)
    ↕
Network
```

### Client 端

同樣 pattern — `ReliableSocket` wrapper with plugins：
- **OutboxPlugin** — 斷線時 buffer outgoing messages，reconnect flush
- **AckPlugin** — 回報 last received offset

```
App Layer (useChannelMessages, handlers)
    │  不知道 plugins 存在
    ↕
ReliableSocket (plugin pipeline)
    ├─ OutboxPlugin (buffer outgoing on disconnect)
    ├─ AckPlugin (emit ACK for received events)
    └─ [future plugins]
    ↕
Socket.io client
```

### Summoner 端

同樣 pattern：
- 偵測 WS 斷線 → BufferPlugin 暫存 CLI stdout events
- Reconnect → flush buffer → server stores in DB

## Why Plugin not Middleware

| | Middleware | Plugin |
|---|---|---|
| 結構 | 線性 pipeline，每個 event 必經 | 各自獨立，可選 |
| 抽換 | 整條換 | 單獨換一個（如 buffer strategy） |
| 測試 | 模擬整條鏈 | 獨立單元測試 |
| 配置 | 順序敏感 | 組合自由 |
| 運行時 | 固定 | 可動態 enable/disable |

## Recovery Fallback

| 情境 | 處理 |
|---|---|
| 短暫斷線 < buffer duration | BufferPlugin replay（自動） |
| 長時間斷線 / buffer overflow | AckPlugin detect gap → session:join 全量 replay |
| Server restart（memory buffer lost） | DatabaseBufferStore fallback → replay from DB |
| Summoner 斷線 | Summoner BufferPlugin → reconnect flush → DB |

## Scope

- `ConnectionPlugin` interface definition
- `AckPlugin` — offset tracking + ACK protocol
- `BufferPlugin` — pluggable store (MemoryBufferStore first)
- `ChannelEmitter` 改造支援 plugin pipeline
- Client: `ReliableSocket` + OutboxPlugin + AckPlugin
- Summoner: BufferPlugin for CLI events
- App 層: 不改

## Out of scope

- RedisBufferStore / DatabaseBufferStore（未來需要時加）
- Server clustering
- Conflict resolution
- Message ordering guarantee beyond single channel
