## ADDED Requirements

### Requirement: WsServer SHALL manage WebSocket connections with a middleware pipeline and pluggable adapter

`WsServer` SHALL receive a `WsAdapter` via constructor injection, making the server runtime-agnostic. It SHALL run a composable middleware pipeline per connection, create an `RpcChannel` for each accepted connection, and deliver it to the registered connection handler. The adapter is bound for the lifetime of the `WsServer` instance.

```ts
const server = new WsServer(wsAdapter());
server.route('/ws', [auth(cookieAuth), heartbeat(opts), resume(registry)], handleBrowser);
server.route('/ws/summoner', [auth(bearerAuth), heartbeat(opts)], handleSummoner);
server.attach(httpServer);
```

#### Scenario: browser connects to /ws with middleware

- **WHEN** a browser client upgrades to WebSocket at `/ws`
- **THEN** WsServer SHALL delegate the upgrade to the adapter
- **AND** run the middleware chain configured for `/ws` (auth → heartbeat → resume)
- **AND** on success, create an RpcChannel and pass it to the `/ws` connection handler

#### Scenario: summoner connects to /ws/summoner with different middleware

- **WHEN** a summoner daemon upgrades to WebSocket at `/ws/summoner`
- **THEN** WsServer SHALL run the middleware chain configured for `/ws/summoner` (auth → heartbeat, no resume)
- **AND** on success, create an RpcChannel and pass it to the `/ws/summoner` connection handler

#### Scenario: unknown path rejected

- **WHEN** a client attempts to upgrade at an unregistered path
- **THEN** WsServer SHALL reject with HTTP 404

### Requirement: WsAdapter SHALL abstract the WebSocket runtime

`WsAdapter` SHALL be a minimal interface that handles runtime-specific WebSocket upgrade and produces `RpcSocket` instances. WsServer SHALL receive an adapter via `attach(httpServer, adapter)` and delegate all WebSocket-level operations to it.

```ts
interface WsAdapter {
  handleUpgrade(server: HttpServer, path: string, onSocket: (socket: RpcSocket, req: IncomingMessage) => void): void;
  close(): Promise<void>;
}
```

#### Scenario: wsAdapter wraps ws library

- **WHEN** `wsAdapter()` is passed to `WsServer.attach()`
- **THEN** it SHALL create a `ws.WebSocketServer` internally
- **AND** wrap each accepted WebSocket as an `RpcSocket`

#### Scenario: socketIoAdapter wraps socket.io

- **WHEN** `socketIoAdapter()` is passed to `WsServer.attach()`
- **THEN** it SHALL create a `socket.io.Server` internally
- **AND** wrap each accepted socket as an `RpcSocket`

#### Scenario: swapping adapter requires no WsServer or middleware changes

- **GIVEN** a working WsServer with `wsAdapter()`
- **WHEN** the adapter is swapped to `bunAdapter()`
- **THEN** all middleware, route definitions, and connection handlers SHALL work unchanged

### Requirement: Middleware SHALL be composable functions executed in registration order

Each middleware SHALL be a function with signature `(socket: RpcSocket, req: IncomingMessage, context: ConnectionContext, next: () => void) => void`. Middleware MAY modify the `context` object (e.g., attach auth identity), call `next()` to proceed, or reject by closing the socket / sending an HTTP error without calling `next()`.

Middleware SHALL execute in the order specified in the `route()` call. If any middleware does not call `next()`, the pipeline stops and no RpcChannel is created.

#### Scenario: auth middleware rejects invalid credentials

- **WHEN** a connection arrives with an invalid token
- **THEN** the auth middleware SHALL respond with HTTP 401 and SHALL NOT call `next()`
- **AND** no RpcChannel SHALL be created

#### Scenario: middleware chain runs in order

- **GIVEN** middleware A, B, C registered in that order
- **WHEN** a connection arrives
- **THEN** A SHALL execute before B, B before C

### Requirement: Auth middleware SHALL validate credentials at upgrade time

The `auth(authenticator)` middleware SHALL call `authenticator.authenticate(req)` during HTTP upgrade. On success, it SHALL attach the returned identity (userId, peerType) to the connection context and call `next()`. On failure, it SHALL reject with HTTP 401.

#### Scenario: cookie auth for browser

- **WHEN** a browser connects to `/ws` with a valid session cookie
- **THEN** auth middleware SHALL extract userId and attach it to context
- **AND** call `next()`

#### Scenario: bearer token auth for summoner

- **WHEN** a summoner connects to `/ws/summoner` with a valid bearer token
- **THEN** auth middleware SHALL extract userId from token and attach it to context
- **AND** call `next()`

### Requirement: Heartbeat middleware SHALL keep connections alive

The `heartbeat(opts)` middleware SHALL start a ping/pong cycle after the connection is established. If the peer fails to respond within the configured timeout, the middleware SHALL terminate the connection.

#### Scenario: idle connection stays alive via heartbeat

- **GIVEN** a connection with heartbeat middleware (intervalMs: 25000, pongTimeoutMs: 60000)
- **WHEN** no application messages flow for 25 seconds
- **THEN** the server SHALL send a ping
- **AND** the connection SHALL remain open if the peer responds with pong

#### Scenario: unresponsive peer is terminated

- **WHEN** a peer fails to respond to ping within the configured timeout
- **THEN** the heartbeat middleware SHALL terminate the WebSocket connection

### Requirement: Browser WebSocket route includes resumable middleware
The browser WebSocket route SHALL include the `resumable()` middleware in its middleware pipeline, after `auth` and `heartbeat`.

#### Scenario: browser route has resumable middleware
- **WHEN** the server starts with WebSocket transport enabled
- **THEN** the browser route (`/ws`) SHALL be configured with `[auth(...), heartbeat(...), resumable()]` middleware

### Requirement: WsServer SHALL replace WsTransport

After migration, `WsTransport` SHALL be removed. All WebSocket connections SHALL go through `WsServer` with a `WsAdapter`. `SocketIoTransport` SHALL be refactored into `socketIoAdapter()` satisfying the `WsAdapter` interface.

#### Scenario: existing browser tests pass after migration

- **WHEN** WsTransport is replaced by WsServer with equivalent middleware and wsAdapter
- **THEN** all existing browser-facing handler tests SHALL pass without modification
