## Why

Several wire-schema fields in `packages/shared/src/schemas/session.ts` are named with `*Session*` semantics but actually carry `channelId` values at runtime (the server Channel's identifier, not the CLI's sessionId). The names are a historical carryover from before we separated the two concepts; today they just mislead readers and invite regressions.

This is a pure naming cleanup following the architectural work that removed sessionId from the client wire (`remove-session-id-from-client-wire`). Filed as a separate change because it is cosmetic, touches many call sites, and the semantic fix has already landed.

## What Changes

Wire field renames (all **BREAKING** at the wire, but client + server are the only consumers and we migrate both in this change):

- `sessionForkPayloadSchema.forkedFromSession` → `forkedFromChannelId`
- `sessionForkPayloadSchema.newSessionId` → `newChannelId`
- `sessionTeleportPayloadSchema.remoteSessionId` → `remoteChannelId`
- `sessionTeleportPayloadSchema.newSessionId` → `newChannelId`
- `sessionLaunchPayloadSchema.resume` → `resumeChannelId`
- `sessionStatesPayloadSchema.activeSessionId` → `activeChannelId`
- `initResponseSchema.activeSessionId` → `activeChannelId`
- `forkConversationResponseSchema.parentSessionId` → `parentChannelId`

Behavior unchanged — each field already carried a channelId value. Only the name changes.

Callers updated:
- Server: `socket/handlers/session/fork.ts`, `socket/handlers/session/connect.ts`
- Client: `contexts/SessionContext.tsx`, `contexts/channel/handlers/session.ts`
- Tests: `session-fork.test.ts`, `app.test.ts`, `session-connect.test.ts`

## Capabilities

### New Capabilities
<!-- None; pure rename -->

### Modified Capabilities
<!-- None at spec-repo level -->

## Impact

- **Wire**: 6 schemas in `session.ts`, 8 field renames total.
- **Server code**: 2 handlers; rename-driven compile errors fix all call sites.
- **Client code**: 2 files.
- **Tests**: 3 files, fixture inputs only. No `expect(...)` modified.
- **Protocol compatibility**: breaks any old client/server pairing. Accepted — in-repo only.
