# Tasks: fix-fork-message-uuid

**TDD discipline (MANDATORY):**

- Every section is RED → GREEN. Write the test, watch it fail, then write the minimum code to pass.
- NEVER modify an existing `expect(...)` line. If an assertion no longer fits, delete the entire `it(...)` block and author a new one.
- React tests use `@testing-library/react` (renderHook or render). No setupPipeline/synthesizeStore wrappers.

## 1. Message type carries cliUuid

- [x] 1.1 RED: type-level test or runtime check — `Message` accepts optional `cliUuid: string`. Existing `id` field semantics unchanged.
- [x] 1.2 GREEN: add `cliUuid?: string` to `MessageBase` in `packages/client/src/types/ui.ts`.

## 2. applyUserContent sets cliUuid (not id)

- [x] 2.1 RED: handlers/message.test — when `message:user` payload arrives with `uuid` and content matches the last user message, the matched message's `id` SHALL remain unchanged AND its `cliUuid` SHALL equal the payload's `uuid`.
- [x] 2.2 RED: same handler test — when payload `uuid` is provided and content does NOT match the last message, a new message SHALL be appended with `cliUuid` set to the payload uuid (its `id` is fresh local random, not the CLI uuid).
- [x] 2.3 RED: when payload has no `uuid`, neither `id` nor `cliUuid` SHALL be mutated.
- [x] 2.4 GREEN: rewrite the dedup branch in `applyUserContent` to set `cliUuid` instead of `id`. The new-message branch sets `cliUuid` on the appended message.

## 4. RewindDialog filters and emits cliUuid

- [x] 4.1 RED: component test — given a message list with a mix of cliUuid-present and cliUuid-absent user messages, `RewindDialog` SHALL only show entries with `cliUuid`.
- [x] 4.2 RED: component test — clicking confirm SHALL invoke `onConfirm` with `messageId` equal to the selected message's `cliUuid`, never its `id`.
- [x] 4.3 GREEN: update `getRewindableMessages` to filter on `cliUuid`. Update `onConfirm` payload to use `selected.message.cliUuid`.

## 5. CLI emits user echo on stdout (--replay-user-messages)

- [x] 5.1 RED: protocol.test — base args contain `--replay-user-messages`.
- [x] 5.2 GREEN: add flag to `summoner/src/claude/protocol.ts` baseArgs.
- [x] 5.3 RED: transforms/user.test — fixture-driven via `s.user(text, {uuid})` produces `message:user` payload with `uuid`.
- [x] 5.4 GREEN: confirm transforms/user.ts already extracts uuid (no code change needed).
- [x] 5.5 Replace `user-text.jsonl` fixture with the real stdout-echo shape (session_id, parent_tool_use_id, isReplay) — the prior JSONL-file shape was a false-green setup.
- [x] 5.6 Update protocol snapshot for the new fixture.

## 6. Robust dedup against streaming-induced last-message drift

- [x] 6.1 RED: handler test — state has user msg "hi" (no cliUuid) AND a streamed assistant placeholder appended after it. Emit `message:user` echo with content "hi" + uuid "U". Assert: total user-msg count stays 1, that user msg gains cliUuid="U", no new user msg appended.
- [x] 6.2 RED: handler test — same as above but the user msg already has cliUuid="U". Emit again with same uuid. Assert: idempotent (no append, no mutation).
- [x] 6.3 RED: orphan echo (no matching local msg) still appends a new user message with cliUuid (fallback path remains).
- [x] 6.4 GREEN: rewrite the dedup loop in `applyUserContent` to scan from the end for the first content-matching user-text msg without cliUuid; set cliUuid there; only append if no match found.

## 7. session:created broadcast carries cwd (fork & teleport)

- [x] 7.1 RED: server fork test — assert the `session:created` event payload broadcast after `session:fork` includes a non-empty `cwd` string equal to parent's cwd.
- [x] 7.2 RED: same for teleport.
- [x] 7.3 GREEN: include `cwd` in both `emitter.broadcastAll('session:created', ...)` calls in `fork.ts`.

## 8. Validation

- [x] 5.1 `pnpm --filter @code-quest/client tsc --noEmit` clean.
- [x] 5.2 `pnpm --filter @code-quest/client test` green.
- [x] 5.3 `openspec validate fix-fork-message-uuid` passes.
- [x] 5.4 Manual: open chat, send several messages, fork from one — argv `--resume-session-at` SHALL carry the CLI's JSONL uuid; CLI SHALL accept and create the fork without "No message found" errors.
