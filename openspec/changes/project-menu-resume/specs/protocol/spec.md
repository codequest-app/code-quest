# Spec Delta: protocol (project-menu-resume)

## ADDED Requirements

### Requirement: session:resume event resumes a session by sessionId

The server SHALL handle a new C2S RPC event `session:resume` with payload validated by `sessionResumePayloadSchema = z.object({ sessionId: z.string() })` and ack callback validated by `sessionResumeResponseSchema = z.object({ channelId: z.string().optional(), error: z.string().optional() })`. `session:launch` payload is unchanged and MUST NOT carry a `resumeSessionId` field.

#### Scenario: resume reuses an alive channel

- GIVEN a channel is alive and `channel.sessionId === 'sess-1'`
- WHEN a client emits `session:resume { sessionId: 'sess-1' }`
- THEN the server SHALL ack with `{ channelId: <existing channelId> }`
- AND the server SHALL NOT call `channelManager.create`

#### Scenario: resume spawns a new CLI with --resume

- GIVEN no alive channel has `sessionId === 'sess-2'`
- WHEN a client emits `session:resume { sessionId: 'sess-2' }`
- THEN the server SHALL call `channelManager.create(<newChannelId>, { launchOptions: { resumeSessionId: 'sess-2', ... } })`
- AND the spawned runner SHALL receive `--resume sess-2` in its argv
- AND on `system:init` the server SHALL upsert a session row keyed by sessionId `sess-2` with the new channelId

#### Scenario: resume handles a dead session

- GIVEN the CLI spawn rejects with message containing `"No conversation found"`
- WHEN the event was `session:resume { sessionId: 'sess-3' }`
- THEN the server SHALL call `sessionStore.updateStatus('sess-3', 'dead')`
- AND ack with `{ error: <message> }`

#### Scenario: resume never double-spawns for the same sessionId

- GIVEN an alive channel with `sessionId === 'sess-4'`
- WHEN a client emits `session:resume { sessionId: 'sess-4' }`
- THEN the server SHALL NOT spawn a second CLI process against the same sessionId's JSONL

### Requirement: ChannelManager exposes alive-channel lookup helpers

`ChannelManager` SHALL expose `aliveChannels(): Channel[]` returning the full set of non-exited channels, and `findAliveBySessionId(sessionId: string): Channel | undefined` returning the alive channel whose `sessionId` matches, or `undefined`.

#### Scenario: aliveChannels excludes exited

- GIVEN two channels, one exited and one alive
- WHEN `aliveChannels()` is called
- THEN it SHALL return only the alive channel

#### Scenario: findAliveBySessionId matches by sessionId

- GIVEN an alive channel with `sessionId === 'X'`
- WHEN `findAliveBySessionId('X')` is called
- THEN it SHALL return that channel
- AND `findAliveBySessionId('Y')` SHALL return `undefined`

### Requirement: SessionStore.list accepts excludeSessionIds

`SessionStore.list` opts SHALL accept an optional `excludeSessionIds?: string[]`. The Drizzle implementation SHALL append `notInArray(sessions.id, excludeSessionIds)` to its WHERE clause ONLY when the array is non-empty. An empty array SHALL NOT be forwarded to SQL (avoids the `NOT IN ()` hazard). `CompositeSessionStore` SHALL forward the opt to the inner store.

#### Scenario: excludeSessionIds filters at DB level

- GIVEN DB rows `{ id: 'a' }` and `{ id: 'b' }`
- WHEN `list({ excludeSessionIds: ['a'] })` is called
- THEN the result SHALL be `{ sessions: [row-b], total: 1 }`

#### Scenario: empty excludeSessionIds is a no-op

- GIVEN the same DB rows
- WHEN `list({ excludeSessionIds: [] })` is called
- THEN the result SHALL include both rows
- AND no `NOT IN ()` SQL SHALL be emitted

## MODIFIED Requirements

### Requirement: session:list payload accepts excludeLive filter

The `session:list` payload SHALL accept an optional `excludeLive: boolean` field (default `false`). When `true`, the server SHALL compute `aliveSessionIds = channelManager.aliveChannels().map(c => c.sessionId).filter(Boolean)` and pass them as `excludeSessionIds` to `sessionStore.list`. `total` reflects the filtered count.

#### Scenario: excludeLive hides alive sessions

- GIVEN the DB has sessions `{ id: 'a' }` and `{ id: 'b' }`
- AND `channelManager.aliveChannels()` returns one channel with `sessionId === 'a'`
- WHEN a client emits `session:list { excludeLive: true }`
- THEN the ack SHALL return `{ sessions: [<row b>], total: 1 }`

#### Scenario: excludeLive defaults to false

- GIVEN the same fixture
- WHEN a client emits `session:list {}` (no `excludeLive`)
- THEN the ack SHALL return both sessions
