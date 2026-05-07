## Why

`DrizzleSessionStore.persist(record)` does more than its name suggests. Reading `apps/server/src/services/drizzle-session-store.ts:27-44` reveals that when a row with the same primary-key `id` already exists, `persist`:

- rebinds `channelId` to the new value (a *different* channel is now wrapping the same CLI conversation), and
- resets `status` to `'active'`, and
- conditionally overwrites `parentId` if the new record carries one.

The word "persist" suggests "write if not there yet" — a noun-ish operation. The actual semantic is upsert-with-side-effects, and callers (`connect.ts` `onSessionInit`) rely on those side-effects to make resume-into-new-channel work. A developer skimming the codebase would not expect `persist({ id: 'sess-1', channelId: 'ch-new' })` to silently migrate row ownership.

## What Changes

- Rename the method on `SessionStore` interface and `DrizzleSessionStore` implementation: `persist` → `upsert`.
- Add a one-line JSDoc on the interface method documenting rebind semantics:
  > Inserts a new row, or updates `channelId` / `status='active'` / `parentId` on an existing row keyed by `id`. The latter case is the "resume or fork with reused sessionId" path.
- Update the single caller (`apps/server/src/socket/handlers/session/connect.ts:249`, inside `onSessionInit`).
- Update all tests that call `.persist(...)` — change the method name only. **Never modify `expect(...)` lines.**

## Capabilities

### Modified Capabilities
- `server-session-store-identity` — rename the requirement entry describing this method.

## Impact

- Non-breaking at runtime — pure method rename.
- Compiler-guided migration: one interface change forces tsc to flag every caller and every fake implementation.
- Wire / client impact: none.
- DB schema impact: none.
