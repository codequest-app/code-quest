## Tasks

- [x] **Task 1: Remove hasPending from auto-scroll condition** — Remove `hasPending` from `if (isAtBottomRef.current || hasPending)`. RED test: pending_action added while user scrolled up → no auto-scroll. File: `MessageList.tsx`
- [x] **Task 2: Auto-scroll on streaming delta content changes** — Track `lastContentLen`, add to useEffect deps so streaming deltas trigger auto-scroll when at bottom. RED test: delta grows last message while at bottom → scroll triggers. File: `MessageList.tsx`
- [x] **Task 3: Use instant scroll during streaming** — Extract `scrollToEnd(behavior)` helper. Use `'instant'` when `isProcessing`, `'smooth'` otherwise. RED test: during streaming, scrollIntoView called with `behavior: 'instant'`. File: `MessageList.tsx`
- [x] **Task 4: Replace setTimeout with rAF for instant scroll detection** — In `scrollToEnd`, use `requestAnimationFrame` to reset `programmaticScrollRef` for instant scrolls instead of `setTimeout(500)`. File: `MessageList.tsx`
