## Why

The server currently uses two separate WebSocket protocols: Envelope (browser ↔ server) and JSON-RPC (server ↔ summoner daemon). As the architecture evolves to support multiple summoner daemons — each belonging to a different user — the summoner connections need channel routing, identity management, and session resume. These capabilities already exist in the Envelope/ChannelEmitter stack. Building them again for JSON-RPC would duplicate infrastructure.

## What Changes

- Extend the Envelope protocol with **server → peer request** capability (currently only client → server requests exist), enabling bidirectional RPC over a single protocol
- Replace the summoner's raw JSON-RPC `Connection` class with an Envelope-based transport, so summoner daemons connect as first-class transport peers alongside browsers
- Introduce a **summoner channel type** in ChannelEmitter so each daemon gets its own channel with identity, routing, and lifecycle management
- Remove `packages/server/src/remote/connection.ts` (JSON-RPC layer) and `packages/server/src/remote/upgrade-handler.ts` — their responsibilities merge into the unified transport
- **BREAKING**: Summoner daemon wire protocol changes from JSON-RPC to Envelope; existing summoner binaries must be updated

## Capabilities

### New Capabilities
- `bidirectional-envelope-rpc`: Extend Envelope protocol to support server-initiated requests and peer responses, enabling true bidirectional RPC over a single WebSocket connection
- `summoner-channel-routing`: Register summoner daemons as channel peers in ChannelEmitter with identity-based routing, so browser requests reach the correct user's daemon

### Modified Capabilities
- `transport`: Envelope schema gains server-to-peer request/response kinds; WsTransport accepts both browser and summoner connections
- `protocol`: RpcResult contract extends to cover server→summoner requests, not just client→server

## Impact

- **packages/shared**: Envelope schema extended, REMOTE_METHODS may be expressed as Envelope events
- **packages/server**: Remote services (RemoteFilesystemService, RemoteGitService, RemoteProcessProvider) switch from Connection.request() to Envelope-based RPC; upgrade-handler and Connection class removed
- **packages/summoner**: daemon/agent.ts and daemon/connection.ts rewritten to speak Envelope protocol; Agent becomes an Envelope event handler instead of JSON-RPC dispatcher
- **packages/client**: No changes — browser already uses Envelope
- **Tests**: ~10 test files need updated fixtures for new wire format
