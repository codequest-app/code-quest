## Why

`generateTitleIfNeeded` in `apps/server/src/socket/handlers/message.ts` conflates three concerns — requesting a title from the CLI, persisting it to `sessionStore`, and broadcasting the new session state — inside a single function with inline error handling. The persistence call is a fire-and-forget `.catch()`, making it easy to miss that a title can appear in the UI before (or without) landing in the DB. Splitting the concerns makes the side-effects explicit and individually testable.

## What Changes

- Split `generateTitleIfNeeded` into three named functions:
  - `requestTitle(ch, prompt): Promise<string | null>` — one-shot CLI round-trip + zod-validated response, returns the title or `null`.
  - `persistTitle(channelId, title)` — wraps `sessionStore.renameByChannelId` with the existing logger warning on failure.
  - `broadcastTitle(channelId, title)` — wraps `channelManager.broadcastSessionState(channelId, 'idle', title)`.
- `generateTitleIfNeeded` becomes the orchestrator: early-return if no pending prompt, clear the prompt, call the three steps in order.
- Preserve the existing top-level error handler that logs `'Failed to generate session title'`.
- No change to the CLI protocol (`session:generate_title`), callback, or event schema.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `protocol`: clarifies the title-generation side-effect contract. Observable behaviour unchanged.

## Impact

- Affected file: `apps/server/src/socket/handlers/message.ts`.
- Tests: `apps/server/src/__tests__/message.test.ts` (and any other test exercising title generation) must stay green without `expect` modification.
- No client / shared / summoner changes.
