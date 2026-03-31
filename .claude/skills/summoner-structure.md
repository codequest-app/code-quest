---
description: Summoner package structure and conventions. Use when adding new providers, transports, or modifying the CLI adapter pipeline.
---

# Summoner Package Structure

```
packages/summoner/src/
├── index.ts                     # barrel export (public API)
├── types.ts                     # generic types: ProviderAdapter<E,L>, AdapterOutput, ServerAction, ParseResult, ProcessHandle, ProcessProvider
├── runner.ts                    # ProcessRunner — generic process orchestrator
├── transports/
│   └── child-process.ts         # ChildProcessProvider (Node.js spawn)
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
- Public API exposed only through `index.ts` barrel
