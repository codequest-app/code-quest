---
name: parser-development
description: CLI stream parser development workflow. Covers the ProtocolEvent → SocketEvent pipeline, Zod schema validation, and adapter pattern. Use when creating or modifying protocol parsers, adding new event types, or debugging parse failures.
---

# Parser Development

## Architecture

```
CLI stdout (JSON line)
  ↓ ClaudeProtocol.parseLine()     → ParseResult (ok | skip | unknown | error)
  ↓ ClaudeAdapter.transform()      → AdapterOutput { events, autoResponses, controlResponses, serverActions }
  ↓ ProcessRunner._processLine()   → emit('socket_event', SocketEvent)
  ↓ Socket.IO → Client
```

## Key Types

| Type | File | Purpose |
|------|------|---------|
| `ProtocolEvent` | `packages/summoner/src/protocol/claude-schemas.ts` | Discriminated union of all CLI event types (21+) |
| `SocketEvent` | `packages/shared/src/schemas/common.ts` | `{ name: string; payload: Record<string, unknown> }` |
| `ParseResult` | `packages/summoner/src/protocol/provider-adapter.ts` | `ok \| skip \| unknown \| error` discriminated union |
| `AdapterOutput` | `packages/summoner/src/protocol/provider-adapter.ts` | events + autoResponses + controlResponses + serverActions |

## Core Files

| File | Purpose |
|------|---------|
| `packages/summoner/src/protocol/claude-schemas.ts` | Zod schemas for all event types, `getSchemaForType()`, `KNOWN_EVENT_TYPES` |
| `packages/summoner/src/protocol/claude.ts` | `ClaudeProtocol.parseLine()` — JSON parse → Zod validate → `ParseResult` |
| `packages/summoner/src/protocol/claude-adapter.ts` | `ClaudeAdapter.transform()` — dispatches on event.type → `SocketEvent[]` |
| `packages/summoner/src/protocol/provider-adapter.ts` | Abstract `ProviderAdapter` interface |
| `packages/summoner/src/protocol/server-action.ts` | `ServerAction` union: auto_respond, read_diff, forward_to_client |
| `packages/summoner/src/process-runner.ts` | Orchestrates parseLine → transform → emit |

## parseLine Flow

```typescript
parseLine(line: string): ParseResult {
  // 1. Trim + JSON.parse (skip if empty or invalid)
  // 2. Check type field exists (skip if missing)
  // 3. Skip keep_alive events
  // 4. Check KNOWN_EVENT_TYPES (return 'unknown' if not found)
  // 5. getSchemaForType(type, subtype) → Zod safeParse
  // 6. Return { status: 'ok', event } or { status: 'error', error: ZodError }
}
```

## SocketEvent Naming Convention

Events use `type:subtype` format:
- `message:assistant`, `message:user`
- `stream:chunk`, `stream:block_start`, `stream:end`
- `control:permission`, `control:elicitation`
- `system:task_started`, `system:init`
- `notification:show`
- `raw:event` (for unknown types)

## Adding a New Event Type

1. Add Zod schema in `claude-schemas.ts`
2. Add to `KNOWN_EVENT_TYPES` set and `getSchemaForType()` dispatch
3. Add to `ProtocolEvent` union type
4. Add conversion method in `claude-adapter.ts` `transform()`
5. Write tests in `packages/summoner/src/protocol/__tests__/`

## Test Pattern

```typescript
// packages/summoner/src/protocol/__tests__/claude-adapter.test.ts
function toSocketEvent(line: string) {
  const parsed = adapter.parseLine(line);
  if (parsed.status !== 'ok') return null;
  const r = adapter.transform(parsed.event);
  return r.events.length === 1 ? r.events[0] : r.events;
}
```

## Common Pitfalls

- `assistant` event content is an **array** — may contain text + tool_use simultaneously
- `user` events carry `tool_result` (CLI auto-executes tools)
- `result.usage` is nested, not at top level
- Unknown event types → `raw:event` (not errors)
