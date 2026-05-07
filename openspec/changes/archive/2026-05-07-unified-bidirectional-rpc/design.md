## Context

The project has two WebSocket transport implementations (`WsTransport` and `SocketIoTransport`) on the server side, and a hand-rolled WebSocket client in the summoner daemon. All three do overlapping things: connection management, auth, heartbeat, reconnect, message framing.

### Current architecture (after Steps 1-8)

```
Server:
  WsTransport(wsAdapter())  → [auth, heartbeat] → Envelope → TypedSocket → ChannelEmitter
  SocketIoTransport          → [io.use auth]     → socket.io → TypedSocket → ChannelEmitter

Summoner client:
  daemon/connection.ts       → raw ws + reconnect + heartbeat → wrapWs → RpcChannel → Agent
```

### Target architecture

```
WsTransport(wsAdapter())    — unified server + client, onion middleware

Server mode:
  transport.route('/ws', [auth(cookieAuth), heartbeat(opts), resume(registry)], handler)
  transport.route('/summoner', [auth(bearerAuth), heartbeat(opts)], handler)
  transport.attach(httpServer)

Client mode:
  transport.connect('ws://server/summoner', [token(secret), heartbeat(opts)], { reconnect })
  → returns RpcChannel

SocketIoTransport           — kept as-is (separate protocol)
```

## Goals / Non-Goals

**Goals:**
- `WsTransport` supports both server mode (accept connections) and client mode (initiate connections)
- `WsAdapter` interface covers both server and client WebSocket operations
- Onion middleware model — `next()` before = pre-connect, `next()` after = post-connect, shared between server and client
- Summoner daemon's connection management (reconnect, heartbeat) moves into WsTransport client mode
- `RpcChannel` handles bidirectional RPC for both sides
- Swap runtime by swapping adapter: `wsAdapter()` → `bunAdapter()`

**Non-Goals:**
- Changing the Envelope wire format
- Changing handler registration API (ChannelEmitter.on() stays the same)
- Rewriting SocketIoTransport — it stays as a separate Transport implementation
- Browser client changes (browser already uses standard WebSocket + Envelope)

## Decisions

### 1. Three layers: WsTransport (lifecycle) + WsAdapter (runtime) + RpcChannel (protocol)

**Decision**: Clean separation of concerns:

```
┌──────────────────────────────────────────────────────────────┐
│ WsTransport(adapter)          ← adapter injected at build    │
│                                                               │
│  Server mode:                                                 │
│    route(path, middleware[], handler)                          │
│    attach(httpServer)                                         │
│                                                               │
│  Client mode:                                                 │
│    connect(url, middleware[], options) → RpcChannel            │
│                                                               │
│  ┌──────────────────────┐                                    │
│  │ WsAdapter            │  ← injected, swappable per runtime │
│  │                      │                                     │
│  │  Server:             │                                     │
│  │    attach(server,    │     ws.WebSocketServer              │
│  │      onUpgrade)      │     Bun.serve websocket             │
│  │                      │                                     │
│  │  Client:             │                                     │
│  │    createSocket(url, │     new ws.WebSocket(url)           │
│  │      options)        │     new Bun.WebSocket(url)          │
│  │        → RpcSocket   │     new WebSocket(url) (standard)   │
│  │                      │                                     │
│  └──────────────────────┘                                    │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────────┐                                    │
│  │ RpcChannel           │  ← per connection, bidirectional   │
│  │  request()           │                                     │
│  │  emit()              │                                     │
│  │  onRequest()         │                                     │
│  │  on()                │                                     │
│  └──────────────────────┘                                    │
│           │                                                   │
│           ▼                                                   │
│     TypedSocket → ChannelEmitter (server)                     │
│     RpcChannel → Agent (client/summoner)                      │
└──────────────────────────────────────────────────────────────┘
```

### 2. Onion middleware — next() is the connection boundary

**Decision**: Middleware is a single function. `next()` is the boundary between pre-connect and post-connect. Before `next()` the socket doesn't exist yet; after `next()` the socket is live in `context.socket`.

```ts
type Middleware = (
  context: ConnectionContext,
  next: () => void | Promise<void>,
) => void | Promise<void>;
```

`context` carries shared state across the middleware chain:

```ts
interface ConnectionContext {
  // Pre-connect (available before next())
  req?: IncomingMessage;                    // server only
  headers?: Record<string, string>;         // client only, mutable
  // Post-connect (available after next())
  socket?: RpcSocket;
  // Shared
  [key: string]: unknown;
}
```

Not calling `next()` = reject. On server this means HTTP 401 (destroy raw socket before upgrade). On client this means abort connection.

Onion model — each middleware wraps the next:

```
auth        → [validate headers]
  token     → [add Authorization header]
    ════════ next() = establish WebSocket ════════
  heartbeat → [start ping/pong on context.socket]
auth        → [cleanup if needed]
```

Built-in middleware:

```ts
// Server: validate incoming credentials
function auth(authenticator): Middleware {
  return async (context, next) => {
    const result = await authenticator.authenticate(context.req);
    if (!result) return; // don't call next = reject
    context.auth = result;
    await next();
  };
}

// Client: set outgoing credentials
function token(secret): Middleware {
  return (context, next) => {
    context.headers = { ...context.headers, Authorization: `Bearer ${secret}` };
    next();
  };
}

// Shared: ping/pong keepalive (runs after connection)
function heartbeat(opts): Middleware {
  return async (context, next) => {
    await next(); // wait for socket
    startPingPong(context.socket, opts);
  };
}

// Server: session resume (runs after connection)
function resume(registry): Middleware {
  return async (context, next) => {
    await next();
    registry.acceptOrRebind(context.socket);
  };
}
```

**Alternative**: Two-phase object `{ beforeConnect, afterConnect }`. Rejected — more complex API, harder to compose, can't do cleanup after next().

**Alternative**: Single-phase function without onion (current implementation). Rejected — forces heartbeat into route options instead of middleware. Server and client can't share the same middleware.

### 3. WsAdapter interface covers server + client

**Decision**: Adapter handles both directions:

```ts
interface WsAdapter {
  // Server: accept incoming upgrades
  attach(
    server: HttpServer,
    onUpgrade: (req, rawSocket, head, accept) => void,
  ): void;

  // Client: initiate outgoing connection
  createSocket(
    url: string,
    options?: { headers?: Record<string, string> },
  ): RpcSocket;

  close(): Promise<void>;
}
```

`wsAdapter()` implements both:
- Server: `ws.WebSocketServer` with `handleUpgrade`
- Client: `new ws.WebSocket(url, { headers })`

`bunAdapter()` would implement:
- Server: `Bun.serve` websocket handler
- Client: `new WebSocket(url, { headers })` (Bun native, supports headers)

### 4. WsTransport.connect() for client mode

**Decision**:

```ts
const transport = new WsTransport(wsAdapter());
const rpc = transport.connect('ws://server/summoner', [
  token(config.token),
  heartbeat({ intervalMs: 30_000, pongTimeoutMs: 60_000 }),
], {
  reconnect: { initialDelayMs: 1000, maxDelayMs: 30000 },
  onConnect: () => console.log('connected'),
  onDisconnect: () => console.log('disconnected'),
});
```

Server mode uses the same middleware:

```ts
transport.route('/ws', [
  auth(cookieAuth),
  heartbeat({ intervalMs: 25_000, pongTimeoutMs: 60_000 }),
  resume(registry),
], handler);

transport.route('/summoner', [
  auth(bearerAuth),
  heartbeat({ intervalMs: 30_000, pongTimeoutMs: 60_000 }),
], handler);
```

`connect()` returns an `RpcChannel` that:
- Auto-reconnects with exponential backoff
- Re-runs full middleware chain on each reconnect (token re-applied, heartbeat restarted)
- Wraps the adapter's `createSocket()` output as RpcSocket → RpcChannel

### 5. RpcChannel takes RpcSocket, not raw WebSocket

(Unchanged)

```ts
interface RpcSocket {
  send(data: string): void;
  onMessage(fn: (data: string) => void): void;
  onClose(fn: () => void): void;
}
```

### 6. Summoner daemon simplifies to WsTransport.connect()

**Decision**:

```ts
const transport = new WsTransport(wsAdapter());
const rpc = transport.connect(config.server, [
  token(config.token),
  heartbeat({ intervalMs: 30_000, pongTimeoutMs: 60_000 }),
], {
  reconnect: { initialDelayMs: 1000, maxDelayMs: 30000 },
});
const agent = new Agent(rpc);
```

`daemon/connection.ts` is deleted — reconnect handled by WsTransport, auth and heartbeat are middleware.

### 7. SocketIoTransport remains independent

**Decision**: SocketIoTransport stays as-is. Different protocol (Engine.IO), different auth model (`io.use()`), different heartbeat. Implements `Transport` interface independently.

```
WsTransport      → Envelope protocol (server + client)
SocketIoTransport → socket.io protocol (server only, legacy)
```

### 8. Remote*Service uses RemoteRpc interface with ReconnectableRpc

(Unchanged)

`ReconnectableRpc` wraps a mutable RpcChannel reference. On reconnect, `replace()` swaps to the new channel.

## Risks / Trade-offs

- **[Breaking change]** Current middleware signature changes from `(req, context, next, reject)` to onion `(context, next)`. All existing middleware needs updating.
- **[Async middleware]** Onion model requires `next()` to be awaitable. Middleware that does work after `next()` must be async.
- **[Adapter surface area]** Each new runtime needs `createSocket()` in addition to `attach()`. Still minimal — ~10 lines per method.
- **[Client mode complexity]** WsTransport now manages both server accept and client connect with reconnect. → Mitigation: connect() is a separate code path, shares adapter and middleware.

## Open Questions

- Should `connect()` return `RpcChannel` directly, or return a `{ rpc: RpcChannel, close: () => void }` handle for lifecycle management?
- Should reconnect logic live in WsTransport or in a separate `ReconnectingRpcChannel` wrapper?
