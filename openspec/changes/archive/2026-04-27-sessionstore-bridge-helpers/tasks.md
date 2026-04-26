## 1. RED — interface + fake contract test

- [x] 1.1 🔴 In `packages/server/src/__tests__/drizzle-session-store.test.ts` add three failing tests (must be red at first):
  - `deleteByChannelId` returns `true` and removes the row when channelId matches; returns `false` when no match
  - `renameByChannelId` updates `title` and returns `true`; returns `false` when no match
  - `updateStatusByChannelId` updates `status` and returns `true`; returns `false` when no match
  - Use real in-memory SQLite fixture (existing harness). **Do not modify existing `expect(...)` lines.**
- [x] 1.2 Confirm tests fail with "not a function" / type error (truly red).

## 2. GREEN — implement

- [x] 2.1 🟢 `packages/server/src/services/session-store.ts`: add three methods to the `SessionStore` interface.
- [x] 2.2 🟢 `packages/server/src/services/drizzle-session-store.ts`: implement each as `const r = await this.getByChannelId(cid); return r ? this.<op>(r.id, ...) : false;`.
- [x] 2.3 🟢 Run tsc — every other `SessionStore` implementer (composite / any fake) is now a type error. Fix each by delegating the same way. Record the list here:
  - `packages/server/src/services/composite-session-store.ts`
  - any `FakeSessionStore` surfaced by tsc
- [x] 2.4 Re-run tests from 1.1 — expect green.

## 3. RED — handler callsite migration

- [x] 3.1 🔴 Existing handler tests stay unchanged. They currently pass against the old 2-step pattern and will continue passing against the new helper — so this step is really "refactor under green" rather than "red-then-green". Double-check there is no test gap: add one regression test if `handleDelete` / `handleRename` / `generateTitleIfNeeded` / connect-dead-branch lacks a "not found → returns false / no-op" case.
- [x] 3.2 Any added test MUST NOT alter existing `expect(...)` lines; only add new `it(...)` blocks.

## 4. GREEN — collapse callsites

- [x] 4.1 🟢 `packages/server/src/socket/handlers/session/command.ts` `handleDelete`: replace the two-step with `await sessionStore.deleteByChannelId(channelId)`.
- [x] 4.2 🟢 Same file `handleRename`: replace with `await sessionStore.renameByChannelId(channelId, title)`.
- [x] 4.3 🟢 `packages/server/src/socket/handlers/message.ts` `generateTitleIfNeeded`: replace the `.then(record => ...)` chain with `sessionStore.renameByChannelId(channelId, title).catch(...)`.
- [x] 4.4 🟢 `packages/server/src/socket/handlers/session/connect.ts` dead-branch: replace with `sessionStore.updateStatusByChannelId(resumeChannelId, 'dead').catch(...)` — note: `connect-cli-error-constants` change will further refactor the empty catch, keep logging behavior unchanged here.

## 5. Verify & sweep

- [x] 5.1 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — clean.
- [x] 5.2 `pnpm --filter server test` — all green, zero `expect()` modifications.
- [x] 5.3 Grep `getByChannelId.*\.(delete|rename|updateStatus)\b` — expect zero hits (all collapsed).

## 6. Wrap up

- [x] 6.1 Single commit: interface + drizzle impl + fakes + 4 handler migrations.
