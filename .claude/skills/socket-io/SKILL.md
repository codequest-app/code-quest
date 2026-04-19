---
name: socket-io
description: >
  Socket.IO event handling patterns for server and client.
  Use when implementing socket handlers, adding real-time events,
  creating client socket hooks, or modifying handler registration.
---

# Socket.IO Conventions

## Event Naming: `type:subtype`

| Prefix | Direction | Examples |
|--------|-----------|---------|
| `session:` | C→S / S→C | `session:launch`, `session:init`, `session:created` |
| `chat:` | C→S | `chat:send`, `chat:cancel`, `chat:respond` |
| `message:` | S→C | `message:assistant`, `message:user`, `message:result` |
| `stream:` | S→C | `stream:chunk`, `stream:end`, `stream:block_start` |
| `control:` | S→C | `control:permission`, `control:elicitation` |
| `system:` | S→C | `system:task_started`, `system:hook_started` |
| `notification:` | S→C | `notification:toast`, `notification:auth_status` |
| `file:` | C→S | `file:read`, `file:list` |
| `git:` | C→S | `git:log`, `git:diff`, `git:checkout`, `git:status`, `git:exec` |
| `app:` | C→S | `app:init`, `app:get_provider_config` |
| `auth:` | C→S | `auth:login`, `auth:submit_oauth_code`, `auth:get_status` |
| `settings:` | C→S | `settings:set_model`, `settings:apply`, `settings:get_state` |
| `mcp:` | C→S | `mcp:get_servers`, `mcp:reconnect`, `mcp:authenticate` |
| `plugin:` | C→S | `plugin:install`, `plugin:list`, `plugin:list_marketplaces` |
| `plan:` | C→S | `plan:comment`, `plan:get_comments`, `plan:close_preview` |
| `speech:` | C→S | `speech:start`, `speech:stop` |
| `terminal:` | C→S | `terminal:get_contents`, `terminal:open_claude` |

All C→S events use `namespace:action` format. No bare event names.

## Session Event Payload Reference

### session:launch (C→S, callback)

**Client sends:** `socket.emit('session:launch', { channelId, cwd, ...opts }, callback)`

**Server handler:** `packages/server/src/socket/handlers/session/connect.ts` → `handleLaunch()`

**Server flow:**
1. `channelManager.create(channelId, { launchOptions, initOptions, cwd })`
2. Sends `session:initialize` to runner (CLI)
3. On `session:init` from runner → broadcasts `session:created` + `session:states`
4. Persists session to DB via `sessionStore.persist()`
5. Callback responds

**Success:** `{ channelId, slashCommands?, models?, account? }`
**Error:** `{ error: string }`
**Schema:** `sessionLaunchResponseSchema`

### session:join (C→S, callback)

**Client sends:** `socket.emit('session:join', { channelId }, callback)`

**Server handler:** `packages/server/src/socket/handlers/session/connect.ts` → `handleJoin()`

**Server flow:**
1. Checks if channel exists and is alive
2. If not alive → lazy-resume from DB via `channelManager.join(channelId)`
3. `channelManager.addSocketToChannel()`
4. Replays pending control requests
5. Emits `session:init` to socket + retrieves history
6. Callback responds

**Success:** `{ channelId, state, meta: ChannelMetaCache, events: ClientMessage[], cwd }`
**Error:** `{ error: string }`
**Schema:** `sessionJoinResponseSchema` (z.union of success | error)

### session:resume (C→S, NO callback — broadcast only)

**Client sends:** `socket.emit('session:resume', { channelId })`

**Server handler:** `packages/server/src/socket/handlers/session/command.ts` → `handleResume()`

**Server flow:** Broadcasts `session:resume` to ALL sockets (cross-window sync). No callback.

**Broadcast payload:** `{ channelId }`

**Client handling (ProjectContext):** Replaces last session's channelId with the new one (tab replacement).

### session:states (S→C, broadcast)

**Payload:**
```typescript
{
  sessions: Array<{
    channelId: string;
    state: 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected';
    title?: string; modelSetting?: string; permissionMode?: string;
    effort?: string; cwd?: string;
  }>;
  activeSessionId?: string;
}
```

**When emitted:** channel creation, state updates (`session:update_state`), session close, after resume.

### Server channel storage (in-memory)

`packages/server/src/socket/channel.ts` — per channel:
- Identity: `id`, `sessionId`, `provider`, `cwd`, `exited`, `isProcessing`
- Config: `sessionConfig { model, permissionMode, effort, thinkingLevel, tools, mcpServers }`
- Meta: `metaCache { model, tools, permissionMode, slashCommands, fastModeState, mcpServers }`
- UI: `title`, `titleGenerated`, `parentId`, `worktree`, `lastError`

**DB persisted:** `{ id, sessionId, provider, command, args, cwd, mode, role, parentId, createdAt }`

### Test timing note

- **launch flow (production):** ChannelProvider sends `session:launch` → on success renders ChannelMessagesProvider → `session:join` fires (session exists, join succeeds)
- **resume flow (no cwd, production):** ChannelProvider immediately renders ChannelMessagesProvider → `session:join` fires (session already exists)
- **renderWithChannel test timing:** render triggers `session:join` BEFORE `claude.initialize()` creates the session → join gets error. This is test-only, not production.

## Server Handler Pattern

**File:** `packages/server/src/socket/handlers/<domain>-handler.ts`

```typescript
export function register(socket: TypedSocket, ctx: HandlerContext) {
  socket.on('chat:send', (payload, callback) => {
    const { channelId, message } = chatSendSchema.parse(payload);
    // ... handle
    callback?.({ ok: true });
  });
}
```

**Registration** in `packages/server/src/socket/chat-handler.ts`:
```typescript
handleConnection(socket: TypedSocket) {
  registerSessionHandlers(socket, this);
  registerMessageHandlers(socket, this);
  registerSettingsHandlers(socket, this);
  // ... 8 handler groups total
}
```

**HandlerContext** (`packages/server/src/socket/handler-context.ts`) provides DI access:
`runnerFactory`, `channelManager`, `sessionStore`, `rawEventStore`, `settingsStore`, `usageTracker`, `io`

## Zod Validation

Schemas in `packages/shared/src/schemas/chat.ts`. Validate at handler entry:

```typescript
const { channelId, message } = chatSendSchema.parse(payload);
```

ZodError → unhandled → Socket.IO error event to client.

## Type Safety

`packages/shared/src/socket-events.ts` exports:
- `ClientToServerEvents` — 60+ typed event signatures
- `ServerToClientEvents` — 50+ typed event signatures

Both used by `TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>`.

## Client Handler Pattern

**File:** `packages/client/src/contexts/socket/handlers/<domain>.ts`

```typescript
export function createMessageHandlers(deps: HandlerDeps): Record<string, EventHandler> {
  return {
    'message:assistant': (payload) => { /* update tab state */ },
    'message:result': (payload) => { /* finalize */ },
  };
}
```

Combined in `handlers/index.ts`, attached in `SocketContext.tsx`.

**Action hooks** (`packages/client/src/hooks/use*Actions.ts`):
```typescript
socket.emit('list_sessions_request', {}, (response) => { /* callback */ });
```

## Testing with FakeClaude

```typescript
const claude = createFakeSummoner().claude();
const channelId = await claude.initialize(s.init('sess'));

// Client → Server
await claude.send('chat:send', { channelId, message: 'hello' });

// Server → Client (via CLI mock)
await claude.emit(s.assistant('Hi!'));
await claude.emit(s.result());

// Assert
expect(claude.received('message:assistant')).toHaveLength(1);
```

## Adding a New Event

1. Add type to `ClientToServerEvents` or `ServerToClientEvents` in `packages/shared/src/socket-events.ts`
2. Add Zod schema in `packages/shared/src/schemas/chat.ts`
3. Server: add handler in appropriate `*-handler.ts`, validate with schema
4. Client: add handler in `contexts/socket/handlers/` or action hook in `hooks/`
5. Test with FakeClaude
