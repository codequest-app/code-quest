# Tasks: remove-broken-resume

> **TDD discipline:** for deletion changes the "RED" step is *deleting* the test that asserts on the dead behavior — there is nothing to drive new code with. Wherever an existing test would still hold meaning after deletion, leave it alone. **NEVER modify an `expect()` line; delete entire `it(...)` blocks instead.**

## 1. Audit (read-only)

- [ ] 1.1 Grep `session:resume` across the repo. Catalogue every hit. Expected sites: `schemas/session.ts`, `socket-events.ts`, `command.ts`, `SessionContext.tsx`, `ProjectContext.tsx`, plus tests.
- [ ] 1.2 Grep `resumeSession\b` (function). Catalogue: `SessionContext.tsx`, `ChatPanel.tsx`, any test using `resumeSession(...)`.
- [ ] 1.3 Grep `Resume conversation` (label) and `onResumeConversation`. Catalogue.
- [ ] 1.4 Grep `openResumeOverlay|handleResumeSelect|showResumeOverlay`. Catalogue.

## 2. RED — delete tests asserting the dead behavior

- [ ] 2.1 Delete any test block (whole `it(...)` or `describe(...)`) that:
  - subscribes to `session:resume` and expects state mutation, OR
  - calls `resumeSession(...)` and expects a socket emit, OR
  - asserts the `Resume conversation` command-menu item is rendered.
  Run the suite — these tests are simply gone, no expects edited.

## 3. GREEN — delete production code

- [ ] 3.1 Shared: `packages/shared/src/schemas/session.ts` — delete `sessionResumePayloadSchema` + `SessionResumePayload`.
- [ ] 3.2 Shared: `packages/shared/src/socket-events.ts` — delete both `'session:resume'` entries (C2S + S2C). Drop the now-unused `SessionResumePayload` import.
- [ ] 3.3 Server: `packages/server/src/socket/handlers/session/command.ts` — delete `handleResume` + `emitter.on('session:resume', handleResume)`. Drop `sessionResumePayloadSchema` import.
- [ ] 3.4 Client: `packages/client/src/contexts/SessionContext.tsx` — remove `resumeSession` from the interface and the actions object.
- [ ] 3.5 Client: `packages/client/src/contexts/ProjectContext.tsx` — remove `handleResume`, the `socket.on('session:resume', onResume)` + `socket.off` calls, and the `sessionResumePayloadSchema` import.
- [ ] 3.6 Client: `packages/client/src/components/command-menu-items.tsx` — delete the `Resume conversation` menu entry. Keep the `onResumeConversation?` callback typing on params for now (change 3 will repopulate it).
- [ ] 3.7 Client: `packages/client/src/components/ChatPanel.tsx` — delete:
  - `showResumeOverlay`, `resumeSessions`, `resumeLoading` state
  - `openResumeOverlay`, `handleResumeSelect`
  - the `<SessionDropdown … />` JSX block
  - the `onResumeConversation={openResumeOverlay}` prop on `<ChatInputArea>` (pass `undefined` or omit)
  - the `listSessions`, `resumeSession`, `renameSession`, `deleteSession` imports if they become unused

## 4. Verify

- [ ] 4.1 `pnpm exec tsc -p packages/shared` clean.
- [ ] 4.2 `pnpm --filter server test` clean.
- [ ] 4.3 `pnpm --filter client test` clean.
- [ ] 4.4 Grep `session:resume` — zero hits.
- [ ] 4.5 Grep `resumeSession\b` — zero hits.
- [ ] 4.6 Manual smoke: launch a session; nothing referencing the resume code path runs.

## 5. Wrap up

- [ ] 5.1 Single commit. Body lists the 5 file groups touched and notes "follow-up: project-menu-resume reintroduces resume via session:launch { resumeSessionId }".

## 6. Known leftovers — RESOLVED in Step 3 (chatpanel-resume-via-picker)

- [x] 6.1 **`onResumeConversation` callback prop chain** — rewired in Step 3:
      ChatPanel passes `() => setResumeOpen(true)`; command-menu-items
      re-added "Resume conversation" item that fires the callback.
- [x] 6.2 **`OnboardingOverlay.tsx:21` copy** — updated in Step 3 to point
      users at right-click on a project + chat command menu.
