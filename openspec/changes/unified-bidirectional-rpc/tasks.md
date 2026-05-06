## 1. Shared EnvelopeClient

- [ ] 1.1 Create `EnvelopeClient` class in `packages/shared/src/transport/envelope-client.ts` — handles send/receive request, response routing, handler map dispatch, timeout, heartbeat via `createHeartbeat`
- [ ] 1.2 Add `request(event, data): Promise<RpcResult<R>>` method with configurable timeout (default 30s)
- [ ] 1.3 Add `onRequest(event, handler)` method for registering incoming request handlers
- [ ] 1.4 Add `emit(event, data)` for fire-and-forget notifications
- [ ] 1.5 Write unit tests for EnvelopeClient (request/response pairing, timeout, handler dispatch, error responses)

## 2. Extend TypedSocket for bidirectional RPC

- [ ] 2.1 Add optional `request(event: string, data: unknown): Promise<unknown>` to TypedSocket interface
- [ ] 2.2 Update WsTransport's TypedSocket adapter to wire `request()` through EnvelopeClient
- [ ] 2.3 Write tests verifying server can call `socket.request()` on a connected peer

## 3. WsTransport multi-peer support

- [ ] 3.1 Add `/ws/summoner` path handling in WsTransport upgrade — distinguish browser vs summoner by URL path
- [ ] 3.2 Authenticate summoner connections via same Authenticator interface (bearer token)
- [ ] 3.3 Attach peer type metadata (`browser` | `summoner`) to TypedSocket
- [ ] 3.4 Write tests: browser connects to `/ws`, summoner connects to `/ws/summoner`, invalid token rejected

## 4. Summoner channel routing in ChannelEmitter

- [ ] 4.1 Add summoner channel type to ChannelEmitter — register summoner sockets keyed by userId
- [ ] 4.2 Add `getSummonerSocket(userId): TypedSocket | null` method to ChannelEmitter or ChannelManager
- [ ] 4.3 Write tests: summoner registers, routes to correct user, multiple summoners coexist

## 5. Migrate Remote*Service to use TypedSocket.request()

- [ ] 5.1 Update RemoteFilesystemService — replace `Connection.request()` with `summonerSocket.request()` using REMOTE_METHODS
- [ ] 5.2 Update RemoteGitService — same pattern
- [ ] 5.3 Update RemoteProcessProvider — replace Connection.request() and onNotification() with Envelope events
- [ ] 5.4 Update container.ts — inject summoner socket lookup instead of Connection
- [ ] 5.5 Write integration tests: Remote*Service calls route through TypedSocket to summoner

## 6. Migrate summoner daemon to Envelope protocol

- [ ] 6.1 Replace `daemon/connection.ts` — use EnvelopeClient instead of raw WebSocket + JSON-RPC
- [ ] 6.2 Rewrite Agent class — register REMOTE_METHODS handlers via `envelopeClient.onRequest()`
- [ ] 6.3 Update process notification sending — use `envelopeClient.emit()` instead of raw `ws.send()`
- [ ] 6.4 Add session resume support — send `{ kind: 'resume', lastSeq }` on reconnect
- [ ] 6.5 Write tests: Agent handles requests via Envelope, notifications flow correctly

## 7. Remove legacy JSON-RPC infrastructure

- [ ] 7.1 Remove `packages/server/src/remote/connection.ts` (JSON-RPC Connection class)
- [ ] 7.2 Remove `packages/server/src/remote/upgrade-handler.ts`
- [ ] 7.3 Remove server-side `createHeartbeat` usage in Connection (shared heartbeat stays)
- [ ] 7.4 Update `server.ts` boot — remove remoteMode branching, summoner connects via WsTransport
- [ ] 7.5 Clean up unused imports and dead code across all packages
- [ ] 7.6 Verify all existing tests pass with no JSON-RPC remnants

## 8. Remote status broadcast

- [ ] 8.1 Migrate `remote:status` broadcast — use ChannelEmitter summoner channel events instead of Connection onDisconnect
- [ ] 8.2 Write tests: browser receives `remote:status` connected/disconnected via channel events
