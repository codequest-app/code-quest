## ADDED Requirements

### Requirement: Socket event names are referenced via the shared `EVENTS` constant

All code under `packages/server` and `packages/client` that registers handlers, emits, or awaits a reply on a project-defined socket event SHALL reference the event name via the `EVENTS` constant exported from `@code-quest/shared`. Bare string literals MUST NOT be used for project-defined event names.

Exemptions:
- Socket.IO transport events (`'connection'`, `'disconnect'`, `'error'`) — these are library-level and not part of the project protocol.
- Test fixtures explicitly asserting on the wire-level string (if any) — these remain as literals but MUST assert equality with `EVENTS.*` to pin the binding.

#### Scenario: Typo in an event name fails at type-check time

- **WHEN** a developer writes `socket.emit(EVENTS.session.lsit, …)` (typo)
- **THEN** TypeScript reports a missing-property error at build time, before runtime

#### Scenario: Rename of an event updates every caller via the constant

- **WHEN** `EVENTS.chat.rewind_code` is renamed to `EVENTS.chat.rewindCode` in the shared module
- **THEN** TypeScript flags every call site that still references the old key

### Requirement: `EVENTS` mirrors the existing typed socket signature

The `EVENTS` tree SHALL cover every event name currently listed in the typed socket/emitter signatures exported from `packages/shared/src/socket-events.ts`. The project MUST NOT accept a state where a typed signature references an event name that is not also present in `EVENTS`.

#### Scenario: Adding a new protocol event requires adding to `EVENTS`

- **WHEN** a new event name is introduced in a typed socket/emitter signature
- **THEN** the corresponding `EVENTS.<ns>.<name>` key MUST be added in the same change, or TypeScript rejects the addition
