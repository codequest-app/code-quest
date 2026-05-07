## Overview

Refactor MessageList scroll behavior to properly handle streaming deltas, respect user scroll position, and avoid jitter.

## Architecture

All changes are within `MessageList.tsx`. No new components or contexts needed.

### Current flow

```
messages.length changes → useEffect → if (isAtBottom || hasPending) → smoothScroll()
```

### New flow

```
messages changes → useEffect → if (isAtBottom) → scrollToEnd(isStreaming ? 'instant' : 'smooth')
```

## Key Design Decisions

### 1. Track streaming state via `isProcessing`

Use existing `isProcessing` from `useChannelMessages()` to determine if streaming is active. No need for a separate streaming flag — `isProcessing === true` means CLI is working, deltas may arrive.

### 2. Observe last message content, not just count

Current trigger: `[messages.length]` — only fires on new messages.
New trigger: `[messages.length, lastMessageContent]` where `lastMessageContent = messages[messages.length - 1]?.content.length ?? 0`. This fires on streaming deltas that grow the last message.

Alternative considered: MutationObserver on DOM. Rejected — adds complexity, React state is the source of truth.

### 3. Remove `hasPending` from scroll condition

Current: `if (isAtBottomRef.current || hasPending)` — pending forces scroll.
New: `if (isAtBottomRef.current)` — only scroll if user is at bottom.

### 4. Replace setTimeout with rAF-based detection

Current: `setTimeout(() => { programmaticScrollRef.current = false }, 500)`.
New: After programmatic scroll, set `programmaticScrollRef = true`, then on next scroll event where position matches target, set it back to `false`. Simpler: just use `requestAnimationFrame` to reset after one frame for instant scrolls.

### 5. scrollToEnd helper

```ts
function scrollToEnd(behavior: 'smooth' | 'instant') {
  programmaticScrollRef.current = true;
  scrollRef.current?.scrollIntoView({ behavior });
  if (behavior === 'instant') {
    requestAnimationFrame(() => { programmaticScrollRef.current = false; });
  } else {
    setTimeout(() => { programmaticScrollRef.current = false; }, 500);
  }
}
```

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/MessageList.tsx` | Refactor scroll logic |
| `apps/web/src/components/__tests__/ScrollToBottom.test.tsx` | Update existing tests |
