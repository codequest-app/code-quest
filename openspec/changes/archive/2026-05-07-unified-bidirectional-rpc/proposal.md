## Why

The server currently uses two separate WebSocket protocols: Envelope (browser ↔ server) and JSON-RPC (server ↔ summoner daemon). Both do the same thing (upgrade, auth, heartbeat, request/response pairing) but with different wire formats and separate implementations.

The root cause: WsTransport mixes transport concerns (upgrade, auth, heartbeat, resume) with RPC concerns (Envelope parsing, request/response pairing) in one class. Extracting the RPC layer into a reusable `RpcChannel` and rebuilding the transport as `WsServer` with a pluggable adapter + middleware pipeline makes browser and summoner connections share the same infrastructure. This also unblocks future multi-summoner support (separate change).

## What Changes

- **New `RpcChannel` class** — bidirectional request/response + event, using Envelope wire format. Replaces both the Envelope parsing inside WsTransport and the JSON-RPC Connection class.
- **New `WsServer` class** — WebSocket server with composable middleware pipeline (auth, heartbeat, resume). Replaces WsTransport. Each connection gets an RpcChannel.
- **Summoner connects through `WsServer`** at `/ws/summoner` path, sharing the same middleware (auth, heartbeat) as browser connections at `/ws`.
- **Remove** `WsTransport`, `Connection` (JSON-RPC), `upgrade-handler.ts` — replaced by `WsServer` + `RpcChannel`. `SocketIoTransport` becomes `socketIoAdapter()`.
- **BREAKING**: Summoner wire protocol changes from JSON-RPC to Envelope.

## Capabilities

### New Capabilities
- `ws-server`: WebSocket server with pluggable adapter + middleware pipeline (auth, heartbeat, resume) and per-connection RpcChannel. Replaces WsTransport.
- `rpc-channel`: Bidirectional RPC over Envelope protocol — request/response pairing, handler dispatch, fire-and-forget events. Used by both server and summoner sides.

### Modified Capabilities
- `transport`: WsTransport replaced by WsServer. SocketIoTransport refactored to socketIoAdapter. Transport interface updated.
- `protocol`: RpcResult contract extends to cover server→summoner requests, not just client→server.

## Impact

- **packages/shared**: New `RpcChannel` class, Envelope schema unchanged (already supports bidirectional request/response)
- **packages/server**: WsTransport → WsServer; SocketIoTransport → socketIoAdapter; Remote services switch from Connection.request() to RpcChannel.request(); upgrade-handler and Connection class removed
- **packages/summoner**: daemon uses RpcChannel directly — Agent registers handlers via `rpcChannel.onRequest()`
- **packages/client**: Minimal — may switch from custom WS wrapper to RpcChannel client-side
- **Tests**: ~15 test files need updated for new transport API
