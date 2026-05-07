## Context

`ComposeInput.handleSubmitKeyDown` → `compose.submit()` (in `ChannelComposeContext`) → `sendMessage(trimmed)` → `messageActions.sendMessage` (in `handlers/message.ts`). Without intervention, the following all happen in the same React event handler batch:

1. `channelEmit(socket, channelId, 'chat:send', ...)` — fire-and-forget socket emit
2. `setChannelState` appending the user message + flipping status to processing
3. `setState` clearing the compose textarea value

React 18 batches #2 and #3 into one commit. Because `MessageList` subscribes to `channelState.messages`, React must re-render every visible `ChatMessage` in that commit. Each `ChatMessage` runs Markdown parsing + Shiki / Prism highlighting + Tailwind reflow — ~1-5 ms per row. At 100 messages the commit costs 100-500 ms and the textarea visibly freezes mid-clear.

## Goals / Non-Goals

**Goals:**
- Enter → textarea empty on next paint, always
- User's submitted message still appears in MessageList promptly (no extra perceived delay on the "new message shows up" beat)
- Socket message still leaves the client immediately

**Non-Goals:**
- MessageList virtualization (tracked separately as `virtualize-message-list`)
- Memoization audits of ChatMessage / MessageContent
- Any change to server, protocol, queueing, or attachment encoding

## Decisions

### Decision: Use `flushSync` on the textarea clear
**Chosen**: wrap `setState({ value: '', slashOpen: false })` with `flushSync(...)` from `react-dom` so the clear commits on its own frame; the browser paints the empty textarea before `sendMessage` (and the subsequent heavy `MessageList` re-render) runs.
**Alternative considered**: rely on React batching + microtask ordering alone.
**Rationale**: without `flushSync`, React batches both setStates and cannot paint the clear until the full commit (including MessageList) is done. `flushSync` is the standard React API for paint-before-heavy-work and adds exactly one extra commit — a negligible cost for guaranteed instant feedback.

### Decision: Do NOT wrap the messages update in `startTransition`
**Chosen**: `setChannelState` (messages append + status change) runs at default priority.
**Alternative considered** and **rejected**: wrap it in `startTransition` to deprioritize the MessageList re-render.
**Rationale** (empirical): transition on the messages update *slowed perceived responsiveness*. With `flushSync` already handling the clear, transition added latency to the visible appearance of the user's own message — the list would briefly appear empty of the just-submitted text while the transition was scheduled, then pop in. Users read that as "the app didn't register my action." Default priority gives immediate visible feedback; any real long-conversation cost is addressed by `virtualize-message-list` (change C).

### Decision: Keep socket emit out of any scheduling wrapper
**Chosen**: `channelEmit(...)` runs synchronously inside `sendMessage` as today — unaffected by `flushSync` (it's a side effect, not a React update).
**Rationale**: server needs the message regardless of client render scheduling. Semantically separate concerns.

### Decision: Attachment path shares the same clear-first ordering
**Chosen**: `flushSync` runs before the `if (files.length > 0) { ... } else { sendMessage(...) }` branch in `submit`. Attached-file submissions now also see the textarea empty on the same early paint.
**Alternative considered**: `flushSync` only in the no-attachment branch.
**Rationale**: consistent UX. Attachments add their own async work (base64), so getting the clear out early matters even more for that path.

## Risks / Trade-offs

- **Risk**: `flushSync` shouts at you in dev when called during lifecycle methods → **Mitigation**: we call it inside an event handler (`submit` invoked from `onKeyDown`), which is the supported use case. No warning will fire.

- **Risk**: Extra commit means one additional React render pass per Enter → **Mitigation**: compose state changes are lightweight (three subscribers: ComposeInput, ComposeToolbar, CommandMenu); the cost is sub-millisecond and dwarfed by the value it buys.

- **Risk**: If a future change adds more work to `ChannelComposeContext` subscribers, `flushSync` could itself become slow → **Mitigation**: watch profiler traces when modifying compose consumers; split subscription or memoize if it grows.

- **Trade-off**: We considered but rejected `startTransition` for the messages update. That tradeoff is documented in the "Do NOT wrap" decision above.

## Open Questions

- Does `virtualize-message-list` (change C) make this change redundant? No — virtualization lowers the cost of the long-conversation commit, but the core "clear should paint before heavy work" invariant remains valuable regardless of list size. Both are complementary.
