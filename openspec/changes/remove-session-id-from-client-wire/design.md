## Context

In an earlier change (`split-channel-session-id-contexts`), we added `SessionIdContext` / `useSessionId()` / `SessionIdProvider` on the client to surface the CLI's `sessionId` without causing re-render spillover. The architectural framing at the time was: "sessionId is a per-channel reactive value that arrives via `session:init`, so it needs its own Context to avoid tainting other consumers."

Review revealed a deeper issue: **client has no legitimate need for the CLI sessionId at all**. Every use-case (resume, fork, rewind, session-list operations) should pass `channelId` to the server, which already owns the bridge `sessionHistory.resolveSessionId(channelId)` to translate into CLI sessionId at the protocol boundary. The earlier change solved a re-render problem that existed only because we accepted a protocol leak.

This change reverses that decision at the source: the `session:init` wire payload stops carrying `sessionId`, and the client-side abstractions we built around it are deleted.

## Goals / Non-Goals

**Goals:**
- `sessionInitPayloadSchema` drops `sessionId` from its shape.
- `Channel.sessionId` server-internal state is unchanged; only the outgoing wire payload is trimmed.
- `SessionIdContext` ecosystem deleted. No consumer breaks because nothing real consumes it.
- Full test suite stays green; no `expect(...)` modified.

**Non-Goals:**
- Not renaming misnamed wire fields (`forkedFromSession`, `remoteSessionId`, `newSessionId`, `parentSessionId`, `activeSessionId`, `sessionLaunchPayloadSchema.resume`). Those already hold channelId-semantic values; the names just haven't caught up. Filed as follow-up.
- Not changing how the server persists or resolves CLI sessionId. `sessionStore.channelId ↔ sessionId` mapping stays.
- Not changing `rawEventStore` keying. Internal persistence stays sessionId-keyed.

## Decisions

**Decision 1 — Remove, don't deprecate.**
`sessionId` on `session:init` has exactly one consumer in the repo (`SessionIdProvider`), which is also going away. A deprecation cycle serves no real consumer; keep the wire tight.

**Decision 2 — Delete `SessionIdContext` rather than keep as forward-compat stub.**
The abstraction has no client consumer. Keeping a "just in case" stub invites revival without need. If a future UI genuinely needs to display the CLI sessionId, add a scoped read through a dedicated query — not a global reactive context.

**Decision 3 — Keep the `sessionInitPayloadSchema.channelId` field.**
Other fields on `session:init` (model, tools, permissionMode, etc.) remain. Only `sessionId` is removed. Tests that simulate `session:init` via `s.init('sess-x', {...})` in FakeClaude still work — the FakeClaude segment produces the CLI-level `system:init` message with its own sessionId; the server consumes that into `Channel.sessionId` and emits the trimmed wire payload.

**Decision 4 — TDD order:**
1. Adjust the ChannelProvider smoke test to only assert `useChannelId()` (delete the `useSessionId()` assertion).
2. Delete `SessionIdContext.test.tsx` entirely.
3. Run suite — expect failures driven by still-exported `SessionIdProvider` / `useSessionId` referenced in `ChannelContext.tsx` / `channel/index.ts`.
4. Delete `SessionIdContext.tsx`, remove imports / wrappings / exports.
5. Trim `sessionInitPayloadSchema.sessionId`; surface any server test that built payloads including `sessionId`; fix fixture inputs.
6. Green.

## Risks / Trade-offs

- **[Risk]** A story / storybook decorator references `SessionIdProvider`. **Mitigation**: the Storybook story-decorator only wraps `ChannelIdProvider` + the four rich providers (from the previous refactor); no `SessionIdProvider` there.
- **[Risk]** An extension protocol log shows `session:init` with `sessionId` and a downstream analyzer depends on it. **Not applicable**: those logs are opaque to production; we own both ends of this protocol.
- **[Trade-off]** We delete code we just wrote. Accepted — better than carrying unused abstractions and a wire leak.

## Migration Plan

1. Branch from current feature branch.
2. Trim the ChannelProvider smoke test down to channelId-only assertions.
3. Delete `SessionIdContext.test.tsx`.
4. Delete `SessionIdContext.tsx`; remove references in `ChannelContext.tsx` + `channel/index.ts`.
5. Edit `sessionInitPayloadSchema`; run `pnpm --filter server test` — fix any fixture that over-specifies.
6. Edit `connect.ts` `buildSessionInitPayload`.
7. Run both suites clean; lint clean.
8. Single commit summarizing the removal.
