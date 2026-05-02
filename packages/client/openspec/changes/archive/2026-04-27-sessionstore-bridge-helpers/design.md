## Context

The `sessions` row has two identifiers: `id` (CLI sessionId, primary key) and `channelId` (server-side `Channel.channelId`). Mutation methods on `SessionStore` (`rename`, `updateStatus`, `delete`) key by `id`, but socket handlers always have a `channelId` in hand — they never have a sessionId directly. The gap was bridged ad-hoc at each callsite:

```ts
const record = await sessionStore.getByChannelId(channelId);
const success = record ? await sessionStore.delete(record.id) : false;
```

This duplicates four times and has a subtle footgun: a missing `if (record)` turns into an `await undefined.delete(...)` crash.

## Goals / Non-Goals

**Goals**
- Centralize the bridge inside `SessionStore` so handlers stay one-liners.
- Preserve the boolean "found?" return semantic — handlers already branch on it.

**Non-Goals**
- Remove `getByChannelId` — it still has read-path users (`query.ts` projection, `session-history.ts` lookup).
- Remove the per-`id` methods — fakes and tests may prefer the direct variant.
- Change the primary-key layout.

## Decisions

**Decision: Add three `*ByChannelId` methods, not a single generic `withRecord(channelId, cb)`.**

Alternatives considered:
- **A. Pass a callback**: `sessionStore.withByChannelId(cid, (rec) => sessionStore.delete(rec.id))`. Rejected — the callback has to know about `.id`, so the bridge still leaks; also awkward typing.
- **B. Change existing methods to accept either id**: `delete(channelIdOrId)`. Rejected — ambiguous, and the resolver order is a footgun.
- **C (chosen). Explicit helpers.** Three short methods, each one line of composition. Names are verbose but self-documenting, and TypeScript catches mistakes at the callsite.

**Decision: Implement in interface + DrizzleSessionStore, not as free functions.**

Keeping them as interface methods means any future `InMemorySessionStore` / `FakeSessionStore` also carries the helper, so handlers don't need to know which implementation they have.

## Risks

- **Fake / in-memory session stores** (if any exist in tests) need the new methods. Mitigated by compiler — adding to the interface forces every implementer to update.
- Cosmetic: `sessionStore.renameByChannelId(cid, title)` vs `sessionStore.rename(record.id, title)` — slightly longer method name, but the call is shorter overall because the `getByChannelId + branch` plumbing disappears.

## Migration

1. Add methods to the interface (type error everywhere `SessionStore` is implemented).
2. Implement on `DrizzleSessionStore`.
3. Implement on any test fake (likely `CompositeSessionStore` or `InMemorySessionStore` — discovered by tsc).
4. Migrate the 4 handler callsites.
5. Verify tests still green — behavior is unchanged.
