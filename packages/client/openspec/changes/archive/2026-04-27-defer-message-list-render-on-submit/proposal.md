## Why

Users report perceivable lag between pressing Enter and seeing the textarea clear. Root cause: `sendMessage` in `createMessageActions` appends the new user message to `channelState.messages`, and the textarea clear in `ChannelComposeContext.submit` runs in the same React event handler. React batches both updates into a single commit — the textarea cannot paint as empty until every `ChatMessage` in `MessageList` finishes rendering. On long conversations each `ChatMessage` runs Markdown + Shiki/Prism (~1-5 ms), so the clear sits behind 100-500 ms of work.

The fix: force the textarea clear to commit on its own frame with `flushSync`, then let the messages update run in the normal React commit that follows.

An earlier iteration also wrapped the messages update in `startTransition`. In practice that slowed the *visible* feedback — the user's own message didn't appear in `MessageList` until the transition committed, which felt worse than the original lag (user sees empty list after pressing Enter). `flushSync` on the clear alone, no transition on the messages update, is the approach that improved perceived responsiveness and is what ships.

## What Changes

- Wrap the `setState({ value: '', slashOpen: false })` inside `ChannelComposeContext.submit` with `flushSync(...)` from `react-dom` — commits the clear and allows the browser to paint before `sendMessage` runs
- Keep `sendMessage` at default priority — the user's own message appears as quickly as React can render it; no transition wrap
- Socket emit (`channelEmit(...chat:send)`) remains synchronous — server receives the message regardless of render scheduling

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `client`: Enter-to-submit SHALL clear the textarea on its own paint, independent of how long `MessageList` takes to re-render

## Impact

- **Affected code**: `packages/client/src/contexts/channel/ChannelComposeContext.tsx` (one `setState` wrapped with `flushSync` + import from `react-dom`)
- **No new dependencies**
- **No protocol / server / socket change**
- **Risk**: low — `flushSync` forces one extra commit per Enter. Standard React API for the paint-before-heavy-work pattern.
