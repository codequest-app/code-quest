# Reliable Transport — Design

## Plugin Interface

```ts
interface OutgoingEvent {
  name: string;
  payload: unknown;
  channelId: string;
  offset?: string;
}

interface IncomingEvent {
  name: string;
  payload: unknown;
  channelId?: string;
}

interface ConnectionPlugin {
  name: string;
  onEmit?(event: OutgoingEvent, socket: TypedSocket): OutgoingEvent | null;
  onReceive?(event: IncomingEvent, socket: TypedSocket): IncomingEvent | null;
  onConnect?(socket: TypedSocket): void;
  onDisconnect?(socket: TypedSocket): void;
  onReconnect?(socket: TypedSocket): void;
  dispose?(): void;
}
```

## BufferStore Interface

```ts
interface BufferedEvent {
  offset: string;
  channelId: string;
  name: string;
  payload: unknown;
  timestamp: number;
}

interface BufferStore {
  push(channelId: string, event: BufferedEvent): Promise<void>;
  getAfter(channelId: string, offset: string): Promise<BufferedEvent[]>;
  ack(channelId: string, socketId: string, offset: string): Promise<void>;
  getLastAck(channelId: string, socketId: string): Promise<string | null>;
  prune(channelId: string, beforeOffset: string): Promise<void>;
}
```

## AckPlugin

### Server Side

```ts
class ServerAckPlugin implements ConnectionPlugin {
  name = 'ack';
  private offsets = new Map<string, string>(); // socketId → lastAckOffset

  onEmit(event: OutgoingEvent): OutgoingEvent {
    // 給每個 outgoing event 標上 offset
    event.offset = generateOffset();
    return event;
  }

  onReceive(event: IncomingEvent, socket: TypedSocket): IncomingEvent | null {
    // Client 送來的 ACK
    if (event.name === 'transport:ack') {
      this.offsets.set(socket.id, event.payload.offset);
      return null; // 吃掉，不傳給 app
    }
    return event;
  }

  getLastAck(socketId: string): string | null {
    return this.offsets.get(socketId) ?? null;
  }
}
```

### Client Side

```ts
class ClientAckPlugin implements ConnectionPlugin {
  name = 'ack';
  private lastOffset: string | null = null;
  private ackTimer: ReturnType<typeof setInterval> | null = null;

  onReceive(event: IncomingEvent): IncomingEvent {
    if (event.payload?.offset) {
      this.lastOffset = event.payload.offset;
    }
    return event;
  }

  onConnect(socket: TypedSocket) {
    // 定期 batch ACK（不是每個 event 都 ACK）
    this.ackTimer = setInterval(() => {
      if (this.lastOffset) {
        socket.emit('transport:ack', { offset: this.lastOffset });
      }
    }, 5000);
  }

  onDisconnect() {
    if (this.ackTimer) clearInterval(this.ackTimer);
  }
}
```

## BufferPlugin

### Server Side

```ts
class ServerBufferPlugin implements ConnectionPlugin {
  name = 'buffer';

  constructor(
    private store: BufferStore,
    private ackPlugin: ServerAckPlugin,
  ) {}

  onEmit(event: OutgoingEvent, socket: TypedSocket): OutgoingEvent {
    // 每個 emit 都存 buffer（直到被 ACK prune）
    this.store.push(event.channelId, {
      offset: event.offset!,
      channelId: event.channelId,
      name: event.name,
      payload: event.payload,
      timestamp: Date.now(),
    });
    return event;
  }

  async onReconnect(socket: TypedSocket) {
    // 找到 client 上次 ACK 的位置，replay 之後的
    const lastAck = this.ackPlugin.getLastAck(socket.id);
    if (!lastAck) return; // 沒有 ACK 記錄 → 靠 session:join

    const channelId = getSocketChannel(socket);
    const missed = await this.store.getAfter(channelId, lastAck);
    for (const event of missed) {
      socket.emit(event.name, event.payload);
    }
  }
}
```

### Client Side (OutboxPlugin)

```ts
class ClientOutboxPlugin implements ConnectionPlugin {
  name = 'outbox';
  private buffer: Array<{ event: string; payload: unknown }> = [];
  private connected = true;

  onEmit(event: OutgoingEvent): OutgoingEvent | null {
    if (!this.connected) {
      this.buffer.push({ event: event.name, payload: event.payload });
      return null; // 不送，buffer 住
    }
    return event;
  }

  onDisconnect() {
    this.connected = false;
  }

  onReconnect(socket: TypedSocket) {
    this.connected = true;
    for (const msg of this.buffer) {
      socket.emit(msg.event, msg.payload);
    }
    this.buffer = [];
  }
}
```

## ChannelEmitter Plugin 支援

```ts
class ChannelEmitter {
  private plugins: ConnectionPlugin[] = [];

  use(plugin: ConnectionPlugin): void {
    this.plugins.push(plugin);
  }

  emit(socket: TypedSocket, channelId: string, event: string, payload: unknown): void {
    let outgoing: OutgoingEvent | null = { name: event, payload, channelId };

    for (const plugin of this.plugins) {
      if (!outgoing) break;
      outgoing = plugin.onEmit?.(outgoing, socket) ?? outgoing;
    }

    if (outgoing) {
      socket.emit(outgoing.name, outgoing.payload);
    }
  }

  receive(socket: TypedSocket, event: string, payload: unknown): unknown | null {
    let incoming: IncomingEvent | null = { name: event, payload };

    for (const plugin of this.plugins) {
      if (!incoming) return null;
      incoming = plugin.onReceive?.(incoming, socket) ?? incoming;
    }

    return incoming?.payload;
  }

  notifyConnect(socket: TypedSocket): void {
    for (const plugin of this.plugins) plugin.onConnect?.(socket);
  }

  notifyDisconnect(socket: TypedSocket): void {
    for (const plugin of this.plugins) plugin.onDisconnect?.(socket);
  }

  notifyReconnect(socket: TypedSocket): void {
    for (const plugin of this.plugins) plugin.onReconnect?.(socket);
  }
}
```

## MemoryBufferStore

```ts
class MemoryBufferStore implements BufferStore {
  private buffers = new Map<string, BufferedEvent[]>();
  private acks = new Map<string, string>(); // `${channelId}:${socketId}` → offset

  async push(channelId: string, event: BufferedEvent) {
    const buf = this.buffers.get(channelId) ?? [];
    buf.push(event);
    this.buffers.set(channelId, buf);
  }

  async getAfter(channelId: string, offset: string) {
    const buf = this.buffers.get(channelId) ?? [];
    const idx = buf.findIndex((e) => e.offset === offset);
    return idx < 0 ? buf : buf.slice(idx + 1);
  }

  async ack(channelId: string, socketId: string, offset: string) {
    this.acks.set(`${channelId}:${socketId}`, offset);
  }

  async getLastAck(channelId: string, socketId: string) {
    return this.acks.get(`${channelId}:${socketId}`) ?? null;
  }

  async prune(channelId: string, beforeOffset: string) {
    const buf = this.buffers.get(channelId) ?? [];
    const idx = buf.findIndex((e) => e.offset === beforeOffset);
    if (idx > 0) this.buffers.set(channelId, buf.slice(idx));
  }
}
```

## Offset 生成

```ts
let counter = 0;
function generateOffset(): string {
  return `${Date.now()}-${++counter}`;
}
```

單調遞增、unique、可比較大小。

## 不動的部分

- App 層 handlers（task.ts, streaming.ts, system.ts 等）
- ChannelState / zustand store
- UI components
- session:join / session:history（作為 fallback 完整保留）
