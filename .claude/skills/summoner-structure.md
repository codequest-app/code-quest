---
description: >
  Summoner package structure and conventions. Summoner is an independent agent
  process that runs locally, connects back to the server via WebSocket RPC, and
  executes local operations (fs, git, spawn CLI). Use when adding providers,
  transports, connection logic, or modifying the CLI adapter pipeline.
---

# Summoner Package Structure

Summoner is a **standalone process** (not a library imported by server). It connects
to the server's `/summoner` WebSocket endpoint via `createConnectionLoop` with
bearer token auth, receives RPC calls from the server, and executes them locally.

## Deployment

```bash
# Summoner runs on the local machine, server can be remote
pnpm --filter @code-quest/summoner start --server <url> --token <token>
# Or via env vars: SUMMONER_SERVER=<url> SUMMONER_TOKEN=<token>
```

## Directory Structure

```
apps/summoner/src/
├── main.ts                      # entry point — creates WsTransport, connection loop, Agent
├── config.ts                    # CLI args + env var parsing (server, token, fsRoots)
├── index.ts                     # barrel export (public API for server-side imports)
├── types.ts                     # generic types: ProviderAdapter<E,L>, AdapterOutput, ServerAction, ParseResult, ProcessHandle, ProcessProvider
├── runner.ts                    # ProcessRunner — generic process orchestrator
├── connection/
│   └── agent.ts                 # Agent — registers RPC handlers for fs/git/process on RpcChannel
├── transports/
│   └── child-process.ts         # ChildProcessProvider (Node.js spawn)
├── filesystem/
│   ├── local.ts                 # LocalFilesystemService — implements FilesystemService
│   └── local-root-guard.ts      # path validation against allowed fsRoots
├── git/
│   └── local.ts                 # LocalGitService — implements GitService
├── claude/
│   ├── index.ts                 # barrel: ClaudeAdapter, ClaudeProtocol, LaunchOptions
│   ├── adapter.ts               # ClaudeAdapter implements ProviderAdapter<ProtocolEvent, LaunchOptions>
│   ├── protocol.ts              # ClaudeProtocol — CLI arg builder, line parser, message formatters
│   ├── schemas.ts               # Zod schemas for all Claude CLI event types
│   ├── launch-options.ts        # LaunchOptions interface (41 Claude CLI flags)
│   └── transforms/
│       ├── system.ts            # system event → SocketEvent (16 subtypes)
│       ├── assistant.ts         # assistant message → SocketEvent
│       ├── user.ts              # user message → SocketEvent
│       ├── result.ts            # result → SocketEvent
│       ├── control.ts           # control_request → SocketEvent + ServerAction (15+ subtypes)
│       └── stream.ts            # stream_event → SocketEvent (deltas, block start/stop)
└── test/
    ├── fake-claude.ts           # Segment builders for test data
    ├── fake-process-provider.ts # Test double for ProcessProvider
    ├── fake-socket.ts           # Dual-emitter fake socket
    └── index.ts                 # test barrel
```

## Connection Architecture

```
main.ts
├── WsTransport(wsAdapter())              ← shared transport layer
├── createConnectionLoop(transport, url, {
│     middleware: [bearerToken(token)],    ← auth via bearer token
│     createAgent: (rpc) => new Agent(rpc, processProvider, fs, git),
│     onConnect / onDisconnect / onReconnecting
│   })
└── Agent(rpc: RpcChannel, ...)
    ├── rpc.on('process:spawn', ...)      ← server calls summoner to spawn CLI
    ├── rpc.on('process:stdin', ...)
    ├── rpc.on('process:kill', ...)
    ├── rpc.on('fs:browse', ...)          ← server calls summoner for local fs ops
    ├── rpc.on('fs:read', ...)
    ├── rpc.on('git:root', ...)           ← server calls summoner for local git ops
    └── ... (all RPC handlers with Zod schema validation)
```

The server initiates RPC requests; summoner responds. Process stdout/stderr events
flow back via `rpc.emit()` (event envelopes with seq tracking).

## Adding a New Provider (e.g., Gemini)

1. Create `gemini/` directory at same level as `claude/`
2. Implement `ProviderAdapter<GeminiEvent, GeminiLaunchOptions>`
3. Create `gemini/schemas.ts` with Zod schemas for Gemini protocol
4. Create `gemini/protocol.ts` for CLI arg building and line parsing
5. Create `gemini/transforms/` for event conversion
6. Export from `gemini/index.ts`
7. Add to `index.ts` barrel

No changes needed to `runner.ts`, `types.ts`, or `transports/`.

## Adding a New Transport (e.g., PTY, Socket.IO)

1. Create `transports/pty.ts` or `transports/socket-io.ts`
2. Implement `ProcessProvider` interface
3. Export from `index.ts` barrel

No changes needed to `runner.ts` or provider code.

## Conventions

- Generic code (types.ts, runner.ts, transports/) must NOT import from provider dirs (claude/, gemini/)
- Each transform file exports a single function: `transformXxxEvent(event: Record<string, unknown>): SocketEvent | ...`
- Provider adapter dispatches to transforms based on `event.type`
- `ProviderAdapter<E, L>` is generic — `E` = protocol event type, `L` = launch options type
- Agent RPC handlers validate payloads with Zod schemas from `@code-quest/shared`
- Public API exposed only through `index.ts` barrel
