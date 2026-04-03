## Why

MessageList auto-scroll has three issues that degrade UX during streaming:
1. `pending_action` (permission request) forces scroll to bottom even when user is reading earlier content
2. Streaming deltas modify existing message content but don't trigger auto-scroll (only `messages.length` change does), so users at bottom don't follow along
3. `smoothScroll` with `behavior: 'smooth'` fires on every message count change — during high-frequency streaming this causes scroll jitter

## What Changes

- Remove `hasPending` from auto-scroll trigger — pending actions should not override user scroll position
- Track last message content length (or use a streaming flag) to auto-scroll during streaming deltas when user is at bottom
- Replace `behavior: 'smooth'` with `behavior: 'instant'` during active streaming to prevent animation backlog; use smooth only for discrete events (new user message, scroll-to-bottom button)
- Clean up `programmaticScrollRef` setTimeout(500ms) — replace with scroll event listener for more reliable detection

## Capabilities

### New Capabilities

- `auto-scroll`: Smart auto-scroll that follows streaming content when user is at bottom, respects user scroll position otherwise, and avoids jitter during high-frequency updates

### Modified Capabilities

## Impact

- `packages/client/src/components/MessageList.tsx` — primary change target
- `packages/client/src/components/__tests__/ScrollToBottom.test.tsx` — existing scroll tests
- No API/server changes
