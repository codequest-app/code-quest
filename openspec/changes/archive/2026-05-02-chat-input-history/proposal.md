## Why

Chat input has no message history across reloads — pressing ArrowUp works within a session but loses all history on refresh. Additionally, ArrowUp in a multiline input incorrectly triggers history navigation instead of moving the cursor up.

## What Changes

- Inline `useInputHistory` hook logic directly into `ComposeInput` (only one consumer)
- Initialize history from existing channel messages on first load (user messages already replayed from server)
- Fix multiline ArrowUp guard: only navigate history when cursor is on the first line
- Delete `useInputHistory` hook and its test file

## Capabilities

### New Capabilities
- `chat-input-history`: Per-channel input history initialized from replayed messages, with correct multiline cursor behavior

### Modified Capabilities

## Impact

- `apps/web/src/components/chat/compose/ComposeInput.tsx` — inline history logic, fix ArrowUp guard
- `apps/web/src/hooks/useInputHistory.ts` — deleted
- `apps/web/src/hooks/__tests__/useInputHistory.test.ts` — deleted
- No server changes, no socket events, no schema changes
