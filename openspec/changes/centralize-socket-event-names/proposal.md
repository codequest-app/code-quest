## Why

Socket event names (e.g. `'chat:rewind_code'`, `'session:list'`, `'session:generate_title'`, `'worktree:create'`) appear as bare string literals in ~40 call sites across `packages/client/**` and `packages/server/**`. Typos are only caught at runtime (wrong event → silent drop), and renaming an event requires grep-and-replace across packages with no compiler backstop. The shared `packages/shared/src/socket-events.ts` already defines the protocol shape; event names should live alongside it as a single source of truth.

## What Changes

- Add a frozen `EVENTS` constant tree to `packages/shared/src/socket-events.ts`, organised by namespace (e.g. `EVENTS.session.list`, `EVENTS.worktree.create`, `EVENTS.chat.rewind_code`).
- Derive the event-name type from the constant (`type EventName = FlattenEventValues<typeof EVENTS>`) so the existing typed socket signatures keep working with no API change.
- Re-export `EVENTS` from `@code-quest/shared` barrel.
- Migrate `emitter.on(...)`, `emitter.broadcastAll(...)`, `emitter.broadcast(...)`, `socket.emit(...)`, `socket.on(...)`, and `ch.sendRequest(...)` call sites in `packages/server` and `packages/client` to use `EVENTS.<ns>.<name>` instead of string literals.
- Leave Socket.IO built-in events (`'connection'`, `'disconnect'`) as string literals — they are not part of this protocol.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `protocol`: tightens the event-name contract — event names are a closed set exposed as a typed constant, not ad-hoc strings.

## Impact

- Affected files:
  - `packages/shared/src/socket-events.ts` (defines `EVENTS`).
  - `packages/shared/src/index.ts` (re-export).
  - `packages/server/src/socket/**/*.ts` and test files — ~20+ files.
  - `packages/client/src/**/*.{ts,tsx}` — ~15+ files.
- Tests: existing suites must pass unchanged; this is a pure rename-with-types refactor.
- No runtime behaviour, payload, or transport change.

## Risks

- Large diff surface across two packages; coordinate the landing as one atomic change to avoid `EVENTS.x` referring to a not-yet-added key.
