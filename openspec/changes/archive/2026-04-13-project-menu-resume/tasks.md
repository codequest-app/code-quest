# Tasks: project-menu-resume

**TDD discipline (MANDATORY):**

- Every section is RED → GREEN. Write the test, watch it fail, then write the minimum code to pass.
- NEVER modify an existing `expect(...)` line. If an assertion no longer fits, delete the entire `it(...)` block and author a new one.
- Server pipeline tests use FakeClaude + real fixture JSON.
- React tests use `@testing-library/react` (renderHook or render). No setupPipeline/synthesizeStore wrappers.
- All external payloads (socket callbacks, control responses, DB rows) pass through Zod `safeParse`. No `as` casts, no `typeof` guards.

## 1. ChannelManager alive-channel helpers

- [ ] 1.1 RED: test `aliveChannels()` returns only non-exited channels.
- [ ] 1.2 RED: test `findAliveBySessionId('X')` returns the alive channel with matching sessionId; returns `undefined` otherwise; ignores exited channels.
- [ ] 1.3 GREEN: add both methods on `ChannelManager`. Existing `getAliveChannels()`/`getFirstAlive()` untouched.

## 2. Schema additions

- [ ] 2.1 RED: `sessionResumePayloadSchema` accepts `{ sessionId: 'abc' }`; rejects missing `sessionId`.
- [ ] 2.2 RED: `sessionResumeResponseSchema` accepts `{ channelId: 'ch-1' }` and `{ error: 'boom' }` and `{}`.
- [ ] 2.3 RED: `sessionListPayloadSchema` accepts `{ excludeLive: true }`; default parse of `{}` has `excludeLive` undefined.
- [ ] 2.4 GREEN: add new schemas and the optional field in `packages/shared/src/schemas/session.ts`. Export `SessionResumePayload` / `SessionResumeResponse` types.
- [ ] 2.5 Delete any lingering reference to `sessionLaunchPayloadSchema.resumeSessionId` (the overload-launch approach is rejected — do not add it).

## 3. SessionStore.list excludeSessionIds opt

- [ ] 3.1 RED: `DrizzleSessionStore.list({ excludeSessionIds: ['a'] })` omits row with id `'a'`; `total` reflects filtered count.
- [ ] 3.2 RED: `DrizzleSessionStore.list({ excludeSessionIds: [] })` returns all rows (no `NOT IN ()` SQL error).
- [ ] 3.3 RED: `CompositeSessionStore.list` passes `excludeSessionIds` through to inner store.
- [ ] 3.4 GREEN: extend `SessionStore.list` opts; in Drizzle impl append `notInArray(sessions.id, excludeSessionIds)` to WHERE only when non-empty.

## 4. handleList excludeLive branch

- [ ] 4.1 RED: with 2 DB sessions (a, b) and `channelManager.aliveChannels()` returning one whose `sessionId === 'a'`, `session:list { excludeLive: true }` returns only `b`, `total: 1`.
- [ ] 4.2 RED: `excludeLive: false` (and omitted) still returns both.
- [ ] 4.3 RED: when no alive channels have a sessionId, `excludeLive: true` still returns all rows.
- [ ] 4.4 GREEN: in `query.handleList`, compute `aliveSessionIds` from `channelManager.aliveChannels()` and forward as `excludeSessionIds` to `sessionStore.list`.

## 5. handleResume reuse path

- [ ] 5.1 RED: register handler; `socket.emit('session:resume', { sessionId: 'X' })` with an alive channel whose `sessionId === 'X'` resolves ack with `{ channelId: existingChannelId }`.
- [ ] 5.2 RED: `channelManager.create` is NOT called in this case.
- [ ] 5.3 GREEN: in `handleResume`, call `findAliveBySessionId(sessionId)` first; short-circuit on hit.

## 6. handleResume spawn path

- [ ] 6.1 RED: with no alive channel for `X`, `session:resume { sessionId: 'X' }` calls `channelManager.create(newChannelId, { launchOptions: { resumeSessionId: 'X', ... } })`.
- [ ] 6.2 RED: runner receives `--resume X` in its argv.
- [ ] 6.3 RED: on `system:init` with `session_id === 'X'`, the sessionStore row keyed by `X` has its `channelId` updated to the new channelId (upsert semantics).
- [ ] 6.4 RED: ack resolves with `{ channelId: newChannelId }`.
- [ ] 6.5 GREEN: thread `resumeSessionId` through `buildLaunchOpts`; finalizeAndNotify on success.

## 7. handleResume dead path

- [ ] 7.1 RED: when spawn rejects with message containing `"No conversation found"` for `session:resume { sessionId: 'X' }`, `sessionStore.updateStatus('X', 'dead')` is called AND ack receives `{ error }`.
- [ ] 7.2 RED: server does not spawn a second CLI on subsequent resume attempts for the same sessionId while original is alive (sanity: reuse path already covers this; assert no double-spawn under race).
- [ ] 7.3 GREEN: in the `catch`, branch on `"No conversation found"` substring → mark dead + error callback.

## 8. ResumeProvider + useResume hook

- [ ] 8.1 RED: render `ResumeProvider` with a fake socket; `useResume().resume('sid')` emits `session:resume { sessionId: 'sid' }` and resolves with `{ channelId }` when callback fires `{ channelId: 'ch-1' }`.
- [ ] 8.2 RED: when callback returns `{ error: 'boom' }`, `resume()` rejects with `Error('boom')`.
- [ ] 8.3 RED: when callback returns a shape failing `sessionResumeResponseSchema.safeParse`, `resume()` rejects with `Error('Invalid response')`.
- [ ] 8.4 RED: `useResume()` outside Provider throws.
- [ ] 8.5 GREEN: implement `apps/web/src/contexts/ResumeContext.tsx`. Use `sessionResumeResponseSchema.safeParse` on the callback payload.

## 9. ResumePicker

- [ ] 9.1 RED: mounts → calls `listSessions({ cwd, limit: 50, excludeLive: true })` once.
- [ ] 9.2 RED: renders one row per returned session with title/preview/createdAt.
- [ ] 9.3 RED: click row → calls `useResume().resume(row.id)` → on resolve calls `onResume(channelId)`.
- [ ] 9.4 RED: on reject, renders inline error; row no longer in loading state; other rows still clickable.
- [ ] 9.5 RED: empty list with cwd → `"No resumable sessions for this project."`; without cwd → `"No resumable sessions."`; Close button calls `onCancel`.
- [ ] 9.6 GREEN: implement `apps/web/src/components/ResumePicker.tsx`.

## 10. ProjectContextMenu

- [ ] 10.1 RED: renders at `{x, y}`; single item "Resume session…"; click invokes `onSelectResume`.
- [ ] 10.2 RED: outside click calls `onClose`.
- [ ] 10.3 RED: Escape calls `onClose`.
- [ ] 10.4 GREEN: implement `apps/web/src/components/ProjectContextMenu.tsx` as fixed-position `<div>` with mousedown/keydown listeners.

## 11. ProjectContext pendingActivateChannel intent (see Decision 10)

- [ ] 11.1 RED: initial `pendingActivateChannel` is `null`.
- [ ] 11.2 RED: `requestActivateChannel('/proj', 'ch-1')` sets `pendingActivateChannel` to `{ cwd: '/proj', channelId: 'ch-1' }`.
- [ ] 11.3 RED: `clearPendingActivate()` resets `pendingActivateChannel` to `null`.
- [ ] 11.4 GREEN: extend `ProjectContext` state + actions in `apps/web/src/contexts/ProjectContext.tsx`.

## 12. TabProvider consumes pendingActivateChannel (see Decision 10)

- [ ] 12.1 RED: with `tabs` containing `ch-1` and `pendingActivateChannel === { cwd: ownCwd, channelId: 'ch-1' }`, `TabProvider` calls `setActiveTab('ch-1')` AND `clearPendingActivate()`.
- [ ] 12.2 RED: with `pendingActivateChannel.channelId` NOT yet in `tabs` (auto-`addTab` hasn't fired), `TabProvider` does NOT call `clearPendingActivate()` — it waits. Once the channel appears via the `sessions` prop effect, the activation fires and THEN clears.
- [ ] 12.3 RED: with `pendingActivateChannel.cwd !== ownCwd`, `TabProvider` ignores it (no `setActiveTab`, no clear).
- [ ] 12.4 GREEN: add a `useEffect` in `TabProvider` reading `useProjectState().pendingActivateChannel`. Note: `TabProvider` currently does not import `ProjectContext`; this dependency is intentional — document inline.

## 13. ResumeSessionsDialog + ProjectCard wiring

- [ ] 13.1 RED: `ProjectCard` right-click (`onContextMenu`) calls `preventDefault()` and opens the menu at event coords.
- [ ] 13.2 RED: clicking "Resume session…" closes the menu and opens `ResumeSessionsDialog` with `cwd={project.cwd}`.
- [ ] 13.3 RED: `ResumePicker.onResume(channelId)` triggers `setActiveProject(project.cwd)`, `requestActivateChannel(project.cwd, channelId)`, and closes the dialog.
- [ ] 13.4 RED: Escape/overlay click closes the dialog.
- [ ] 13.5 GREEN: implement `ResumeSessionsDialog.tsx`; wire `ProjectCard` (add `cwd` prop); mount `ResumeProvider` once inside `SocketProvider` tree.

## 14. Verify + sweep

- [ ] 14.1 `openspec validate project-menu-resume --strict`.
- [ ] 14.2 Run all workspace tests; confirm no prior `expect()` edited.
- [ ] 14.3 Manual smoke: right-click a project → picker shows, live sessions absent, picking dead session spawns with `--resume`, picking alive sessionId reuses existing channel, resumed channel becomes the active tab in the target project.
- [ ] 14.4 Confirm `session:dead` broadcast still removes the row from the sidebar as before.

## 15. Follow-up refactors (post-impl code review)

- [x] 15.1 **TabContext effect dep array audit** — confirmed RED via ProjectContext test (`actions object identity stable`). Fixed by wrapping ProjectActions in `useState(() => (...))` initializer. TabContext biome-ignore comment rewritten. Commit `7e7a87e7`.
- [x] 15.2 **`sessionResumeResponseSchema` → discriminated union.** Replaced with `z.discriminatedUnion('ok', ...)`. Contract tests pin both shapes + reject `{}`. Server handleResume emits tagged shape; ResumeContext's three reject branches collapsed. Commit `9c9f4f1b`.
- [x] 15.3 **Extract CLI error marker constant** — `CLI_RESUME_MISSING_MARKER` defined in connect.ts. Commit `08f061c1`.
- [x] 15.4 **Dedupe `aliveChannels()` vs `getAliveChannels()`** — dropped `aliveChannels()`, exposed `getAliveSessionIds()` that does filter+map inline. Tests updated. Commit `08f061c1`.
