## 1. RED — pin upsert semantics with an explicit test

- [ ] 1.1 🔴 In `drizzle-session-store.test.ts`, add a test named `upsert rebinds channelId and resets status on duplicate id` if one does not already exist. Use FakeClaude fixtures / real in-memory SQLite.
  - Insert a row with `id='s1', channelId='ch-old', status='dead'`.
  - Call `store.upsert({ id: 's1', channelId: 'ch-new', status: 'dead', ...rest })`.
  - Assert via `getById('s1')` that the returned record has `channelId === 'ch-new'` AND `status === 'active'`.
  - This test MUST be red at first because `upsert` does not exist yet. **Do not modify existing `expect(...)` lines in other tests; only add new ones.**

## 2. GREEN — rename method

- [ ] 2.1 🟢 `packages/server/src/services/session-store.ts`: rename interface method `persist` → `upsert`. Add JSDoc:
  ```
  /** Insert a new row, or on duplicate `id`: rebind `channelId`, reset `status='active'`,
   *  and overwrite `parentId` when the new record carries one. */
  ```
- [ ] 2.2 🟢 `packages/server/src/services/drizzle-session-store.ts`: rename `async persist(...)` → `async upsert(...)`. Body unchanged.
- [ ] 2.3 🟢 `packages/server/src/services/composite-session-store.ts` (+ any fake surfaced by tsc): rename forwarded method.
- [ ] 2.4 🟢 `packages/server/src/socket/handlers/session/connect.ts` (`onSessionInit`): rename `sessionStore.persist(...)` → `sessionStore.upsert(...)`.

## 3. GREEN — test callsites

- [ ] 3.1 🟢 Grep `sessionStore\.persist\(` and `\.persist\(` (scoped to store) — rename each. Tests assert observable state, not the method name; `expect(...)` lines stay verbatim.
- [ ] 3.2 Re-run test from 1.1 — expect green.

## 4. Verify

- [ ] 4.1 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — clean.
- [ ] 4.2 `pnpm --filter server test` — green, no `expect()` modifications.
- [ ] 4.3 Grep `\.persist\(` repo-wide — zero hits on `SessionStore`-typed values.

## 5. Wrap up

- [ ] 5.1 Single commit: interface + impl + caller + fakes + test callsite renames.
