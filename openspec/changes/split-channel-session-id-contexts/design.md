## Context

The client today exposes `channelId` through four rich contexts. That works but forces anyone who wants `channelId` to pay for subscribing to one of the rich contexts. More importantly, we're about to introduce `sessionId` on the client for the first time; it must be reactive (the socket delivers it asynchronously after launch) and scoped per channel (each `ChannelProvider` instance owns its own).

The server already sends `sessionId` in the `session:init` socket event per `sessionInitPayloadSchema.sessionId: z.string()`. No server changes are needed.

This change is intentionally narrow and additive: two new tiny contexts, wrapped around the existing sub-provider stack. The rich contexts keep their current `channelId` field. A later change can deduplicate.

## Goals / Non-Goals

**Goals:**
- `ChannelIdContext` + `useChannelId()` available to any descendant of `ChannelProvider`.
- `SessionIdContext` + `useSessionId()` available to any descendant, returning `null` until the first `session:init` and the server-assigned id afterwards.
- `SessionIdProvider` listens to `session:init` scoped to its own `channelId`, cleans up on unmount or `channelId` change.
- TDD: tests for both contexts written and red before implementation lands.

**Non-Goals:**
- No changes to existing rich contexts, their props, their context values, or their consumers.
- No server-side or protocol work.
- No zustand — per-channel scope makes Context the correct tool here.
- No attempt to migrate existing `HeaderBar`, `ChatPanel`, etc. to the new `useChannelId()` hook in this change. They continue reading from `useChannelMessages()` as today.

## Decisions

**Decision 1 — Two separate contexts, not one merged `{ channelId, sessionId }` value.**
A merged object's reference changes when `sessionId` flips, forcing every consumer to re-render — the exact trap we're escaping.

**Decision 2 — `SessionIdContext` value type is `string | null`.**
`null` is the explicit "not yet known" signal. `''` is a footgun. `undefined` conflicts with the "no provider" sentinel.

**Decision 3 — `useChannelId()` throws outside a provider; `useSessionId()` returns `null` before the first `session:init`.**
Calling `useChannelId` outside a channel is a programmer error. Calling `useSessionId` pre-init is a legitimate state components must handle.

**Decision 4 — Additive only.**
Keep the four rich contexts exactly as they are today, including their `channelId` field on the value. Deduplication can happen in a dedicated later change when we have clearer signals on consumer call sites.

**Decision 5 — Provider layering:**
```
<ChannelIdContext.Provider value={channelId}>
  <SessionIdProvider channelId={channelId}>
    <ChannelMessagesProvider channelId={channelId}>
      ... (existing stack unchanged) ...
    </ChannelMessagesProvider>
  </SessionIdProvider>
</ChannelIdContext.Provider>
```
`ChannelProvider` still passes `channelId` to the existing rich providers (they still take it as a prop). The new providers sit outside, fed from the same `channelId`.

**Decision 6 — `SessionIdProvider` uses the existing `useSocket()` hook to register a scoped `session:init` listener in a `useEffect` keyed by `[socket, channelId]`.**
Consistent with how other channel handlers in `contexts/channel/handlers/` wire themselves.

## Risks / Trade-offs

- **[Risk]** Duplication: `channelId` now lives both on `ChannelIdContext` and on each rich context value. **Trade-off accepted**: cheap duplication, opt-in migration later.
- **[Risk]** `session:init` arrives multiple times (resume/reconnect). **Accepted**: latest payload's `sessionId` wins; that's correct.
- **[Risk]** Listener leak on channel change. **Mitigation**: `useEffect` cleanup removes the listener when `channelId` or socket changes / unmount.
- **[Risk]** Test harness that mounts sub-providers in isolation doesn't wrap `ChannelIdContext`. **N/A in this change** — sub-providers don't read `useChannelId()` yet (they still take the prop).

## Migration Plan

1. Branch from current feature branch.
2. TDD step 1 — write `ChannelIdContext` tests (red), implement, green.
3. TDD step 2 — write `SessionIdContext` tests (red), implement `SessionIdProvider`, green.
4. Wire both into `ChannelContext.tsx` orchestrator.
5. Verify existing client test suite stays green (no consumer changes, so it should).
6. Lint clean. Commit. No rollout gating; rollback = `git revert`.
