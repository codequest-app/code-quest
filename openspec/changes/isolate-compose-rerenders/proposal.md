## Why

Typing in the chat input currently causes the whole ChatPanel subtree to re-render on every keystroke. The compose state (`value`, `cursorPos`, `hasText`, `slashOpen`, …) lives in a channel-level Context, and every consumer that reads it via `useChannelCompose()` re-renders whenever any field changes — even if that consumer only needs stable action callbacks (e.g., `focusTextarea`). At longer message lengths this produces noticeable input lag.

## What Changes

- Add `useChannelComposeActions()` hook that subscribes only to `ComposeActionsContext`. Action-only consumers use this instead of `useChannelCompose()` and stop re-rendering on keystrokes.
- Stabilize `ComposeActionsContext` value by building it once in a `useState` initializer (previous inline `registerFocus` / `registerMentionTrigger` closures forced a new object every render).
- Migrate `ChatPanel` and `ChatInputArea` — the two consumers that only use actions — to the new hook.
- Extract `insertAtMentionSite(text, pos, slashToken)` helper in `ChannelComposeContext` to dedupe the three copies of the `@`-insertion string math inside `mentionFile()`.
- Add re-render isolation test that asserts an action-only sibling does not re-render while a `Typer` component receives keystrokes.

No public API change; `useChannelCompose()` continues to work for consumers that genuinely need state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `client`: tightens the compose-context subscription model — action-only consumers must not re-render on per-keystroke state changes.

## Impact

- Affected files: `packages/client/src/contexts/channel/ChannelComposeContext.tsx`, `packages/client/src/contexts/channel/index.ts`, `packages/client/src/components/ChatPanel.tsx`, `packages/client/src/components/ChatInputArea.tsx`, `packages/client/src/contexts/__tests__/ChannelComposeProvider.test.tsx`.
- No change to server, shared, or summoner packages.
- No change to socket protocol, DB schema, or build config.
