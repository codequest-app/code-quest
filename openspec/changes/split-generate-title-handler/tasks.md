## 1. Baseline

- [x] 1.1 Run server tests touching title generation (`pnpm --filter @code-quest/server exec vitest run src/__tests__/message.test.ts` + any session-related suites) and record the green baseline.

## 2. Extract helpers

- [x] 2.1 Add `requestTitle(ch, prompt)` — awaits `ch.sendRequest('session:generate_title', { description: prompt })`, parses with `controlGenerateTitleResponseSchema`, returns `title | null`. Must throw up on CLI error (no internal swallow).
- [x] 2.2 Add `persistTitle(channelId, title)` — fires `sessionStore.renameByChannelId(channelId, title)` and attaches `.catch` with the existing warn log. Returns `void`.
- [x] 2.3 Add `broadcastTitle(channelId, title)` — calls `channelManager.broadcastSessionState(channelId, 'idle', title)`.

## 3. Rewire orchestrator

- [x] 3.1 Rewrite `generateTitleIfNeeded`:
  - early-return on missing `ch.pendingTitlePrompt`
  - clear `ch.pendingTitlePrompt`
  - `try { title = await requestTitle(…); if (!title) return; ch.title = title; persistTitle(…); broadcastTitle(…); } catch (e) { logger.error(…, 'Failed to generate session title'); }`
- [x] 3.2 Confirm persistence remains fire-and-forget (not awaited).

## 4. Verification

- [x] 4.1 Re-run `message.test.ts` and session suites. All green, no `expect` modified.
- [x] 4.2 Full server suite green.
- [x] 4.3 Grep for any other caller of `generateTitleIfNeeded`; behaviour must remain identical.
