# Tasks: fix-fork-resume-sessionid

**TDD discipline (MANDATORY):**

- Every section is RED → GREEN. Write the test, watch it fail, then write the minimum code to pass.
- NEVER modify an existing `expect(...)` line. If an assertion no longer fits, delete the entire `it(...)` block and author a new one.
- Server pipeline tests use FakeClaude + real fixture JSON.
- All external payloads pass through Zod `safeParse`. No `as` casts.

## 1. RawEventStore.cloneEvents

- [x] 1.1 RED: unit test in `raw-event-store.test.ts` — seed rows for `sess-parent` (seq 1..3 with distinct raw). Call `cloneEvents('sess-parent', 'sess-new')`. Assert `getBySession('sess-new')` returns 3 rows with identical `raw`, `direction`, `timestamp`, `promptId`, but `sessionId === 'sess-new'` and `seq` re-sequenced from 1.
- [x] 1.2 RED: cloning when source has zero rows is a no-op (no error, no writes).
- [x] 1.3 RED: cloning with same source==dest id is rejected (throws or no-op — pick one, assert).
- [x] 1.4 GREEN: add `cloneEvents` to `RawEventStore` interface + Drizzle impl (SELECT, map, insert batch) + in-memory impl.

## 2. Fork resolves parent + pre-generates sessionId + clones events

- [x] 2.1 RED: FakeClaude test for `session:fork`. Seed sessionStore row `{ id: 'sess-parent', channelId: 'ch-parent', cwd: '/tmp/p' }` and live channel `ch-parent` with `sessionId='sess-parent'`. Seed rawEventStore with 2 parent events under `sess-parent`. Emit `session:fork { forkedFromChannelId: 'ch-parent', newChannelId: 'ch-new' }`. Assert:
  - spawn argv contains `--resume sess-parent`, `--fork-session`, and `--session-id <some-uuid>`
  - spawn cwd is `/tmp/p`
  - after handler returns, `channel('ch-new').sessionId` equals the argv's `--session-id` value
  - `rawEventStore.getBySession(<newSid>)` returns 2 rows (cloned from parent)
- [x] 2.2 RED: same setup but parent channel has already exited (only sessionStore row remains). Assert resolution still works + clone still runs.
- [x] 2.3 GREEN: update `handleFork`:
  - `parentSessionId = channelManager.resolveSessionId(forkedFromChannelId)`
  - short-circuit if resolution returns the channelId unchanged AND `sessionStore.getByChannelId` null
  - `const newSessionId = crypto.randomUUID()`
  - `await rawEventStore.cloneEvents(parentSessionId, newSessionId)`
  - `sessionStore.getById(parentSessionId)` for cwd
  - call `channelManager.create(newChannelId, { cwd, launchOptions: { resumeSessionId: parentSessionId, forkSession: true, sessionId: newSessionId, resumeSessionAt }, onBeforeSpawn: (ch) => { ch.parentId = forkedFromChannelId; ch.sessionId = newSessionId; addSocket(...) } })`

## 3. resumeSessionAt pass-through

- [x] 3.1 RED: emit `session:fork { forkedFromChannelId, resumeSessionAt: 'msg-42', newChannelId }`. Assert argv contains `--resume-session-at msg-42`.
- [x] 3.2 GREEN: confirm `initOptions: { resumeSessionAt }` pass-through still wired (should fall out of section 2 edits).

## 4. Fork rejects unknown parent

- [x] 4.1 RED: no sessionStore row and no live channel for `forkedFromChannelId`. Emit fork. Assert callback `{ success: false, error: /parent session not found/ }`. Assert `channelManager.create` was NOT called AND `rawEventStore.cloneEvents` was NOT called.
- [x] 4.2 GREEN: short-circuit before any clone or spawn.

## 5. Ack shape

- [x] 5.1 RED: successful fork ack is `{ success: true, channelId: 'ch-new', parentChannelId: 'ch-parent' }`. Assert ack does NOT contain a populated `events` array (may be omitted or empty).
- [x] 5.2 GREEN: stop passing `events: parentEvents` to callback. (Payload schema allows `events` optional — we just don't populate.)

## 6. Validation

- [x] 6.1 `pnpm --filter @code-quest/server tsc --noEmit` clean.
- [x] 6.2 `pnpm --filter @code-quest/server test` green.
- [x] 6.3 `openspec validate fix-fork-resume-sessionid` passes.
- [x] 6.4 Manual smoke: launch CLI in cwd A, fork from message M, close tab, reopen — history SHALL be visible after reload (previously broken). Send a new message in the fork; CLI SHALL respond using the preset sessionId; the forked tab's new events SHALL appear alongside the cloned parent history.
