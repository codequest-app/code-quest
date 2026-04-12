## Why

The server exposes the CLI provider's `sessionId` on the `session:init` socket event (`sessionInitPayloadSchema.sessionId`), which tempted the client to treat it as a reactive value and led us to build `SessionIdContext` / `useSessionId()` / `SessionIdProvider` in a previous change. In practice **no component actually uses `useSessionId()`** — the only callers are its own tests and a smoke test.

Architecturally, the client has no legitimate reason to know the CLI sessionId:
- All socket routing and state is keyed by `channelId`.
- Resume, fork, rewind, and session-list operations should pass `channelId` to the server; the server resolves to sessionId internally via the existing `sessionHistory.resolveSessionId(channelId)` bridge before calling the CLI.
- Display / debug UI for the CLI identifier is not a current requirement and can be added later as a server-resolved field if ever needed.

Exposing sessionId on the wire was an implementation detail leak. This change removes the leak and the dead-code abstractions it spawned.

## What Changes

- **Wire**: remove `sessionId: z.string()` from `sessionInitPayloadSchema` (`packages/shared/src/schemas/session.ts`). **BREAKING** for any consumer that reads `sessionId` off `session:init` payloads — there is exactly one such consumer in the repo (`SessionIdProvider`), which is being deleted in this change.
- **Server**: `buildSessionInitPayload` in `packages/server/src/socket/handlers/session/connect.ts` stops including `sessionId` in the emitted payload. The server's internal `Channel.sessionId` is unchanged; only the outgoing wire payload is trimmed.
- **Client**: delete `SessionIdContext.tsx`, `SessionIdContext.test.tsx`, and the `useSessionId()` assertions in `ChannelProvider-id-context.test.tsx`. Remove `SessionIdProvider` wrapping from `ChannelContext.tsx`. Drop `SessionIdProvider` / `useSessionId` from the `channel/index.ts` barrel.
- **Non-goal in this change**: renaming the other misnamed `*Session*` wire fields that already carry channelId values (`sessionForkPayloadSchema.forkedFromSession`, `sessionTeleportPayloadSchema.remoteSessionId`, `sessionStatesPayloadSchema.activeSessionId`, etc.). Those are cosmetic and can be cleaned up in a follow-up change.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `client-session-id-context`: **REMOVED**. Capability was added in an earlier change (`split-channel-session-id-contexts`). It codified a React context that no consumer uses and that depended on the server leaking CLI sessionId on the wire. With the leak closed, the capability has no purpose and is removed.

## Impact

- **Wire protocol**: `session:init` payload shrinks by one field (`sessionId`). No other event changes shape.
- **Server**: 1 file (`connect.ts`); deletion of one payload field; no logic change to how `Channel.sessionId` is tracked internally.
- **Client**: 2 files deleted (`SessionIdContext.tsx`, `SessionIdContext.test.tsx`); 3 files edited (`ChannelContext.tsx`, `channel/index.ts`, `ChannelProvider-id-context.test.tsx`).
- **Tests**: no new tests; removals + trimming existing. `expect(...)` lines in surviving tests stay untouched.
- **Shared types**: `SessionInitPayload` type narrows — `sessionId` field gone. Consumers migrate by deleting their read.
- **Deferred**: naming cleanup for misnamed fork/teleport/states fields — filed as follow-up in tasks.md.
