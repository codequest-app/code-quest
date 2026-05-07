## Why

`MessageList` maps every message to a `ChatMessage` on every render. Each `ChatMessage` runs Markdown + Shiki/Prism syntax highlight (~1–5 ms). At 200+ messages, any state change triggers O(N) work measured in hundreds of ms. The recent memoization pass (ChatMessage + TabContent + EditorArea `React.memo`, `useSession` `useMemo`, SpinnerVerb DOM-ref animation) cut incremental cost when existing messages don't change, but the **initial mount of a session with N existing messages still pays O(N)** — every ChatMessage is called once regardless of memo.

Virtualization is the only way to make render cost O(visible).

## History: Two prior attempts with Virtuoso — both reverted

**v1**: Reverted because the surrounding baseline was noisy (SpinnerVerb 8–25 commits/sec, TabProvider cascades, ChatMessage without memo). Chased scroll symptoms in 10+ commits without stability.

**v2 (this branch, just reverted)**: Baseline was clean this time. Virtuoso integration compiled and tests passed, but:
- `followOutput` did not reliably stick to bottom even with official `"auto"` + `initialTopMostItemIndex` + `alignToBottom` + `atBottomThreshold`
- `scrollToIndex({ index: 'LAST' })` stopped short of true bottom (estimated item heights)
- Sending a message from "visually at bottom" would not auto-scroll because the `components.Footer` sentinel extended `scrollHeight` past the visual bottom, so Virtuoso's `atBottom=false`

Official react-virtuoso docs confirm: open-source Virtuoso's chat-mode scroll behavior is known-janky (GitHub issue #175). Virtuoso's own answer is the paid `@virtuoso.dev/message-list` product. We don't want paid, and **we don't actually need Virtuoso's scroll behavior at all** — `main` already has working hand-rolled scroll (auto-scroll-on-at-bottom, scroll-to-bottom button, scrollToMessage spotlight).

## What Changes

Switch to **TanStack Virtual** (`@tanstack/react-virtual`) — a **headless** virtualizer. It only computes "which items are visible" and "where to position them"; it does not own scroll behavior. We keep `main`'s hand-rolled scroll logic untouched.

- Rewrite `MessageList.tsx`:
  - Preserve `message-list` / `message-list-scroll` / `message-content-wrapper` DOM structure
  - Preserve all scroll refs (`scrollRef`, `scrollContainerRef`, `isAtBottomRef`, `programmaticScrollRef`, `handleScroll`, `scrollToEnd`) from main
  - Replace `MessageNodeList` full-tree map with:
    - Flatten `buildMessageTree(...)` into top-level rows
    - `useVirtualizer({ count, getScrollElement: () => scrollContainerRef.current, estimateSize, overscan: 5, measureElement })`
    - Render `virtualizer.getVirtualItems()` absolutely positioned inside a spacer div of height `virtualizer.getTotalSize()`
  - `scrollToMessage(id)` still uses `querySelector('[data-message-id]')` — but first `virtualizer.scrollToIndex(topLevelIndex, { align: 'center' })` so row is mounted, then RAF-delay spotlight
- Rewrite `RawEventPanel.tsx` the same way (remove Virtuoso, use TanStack Virtual)
- Remove `react-virtuoso` package; add `@tanstack/react-virtual`

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `client`: MessageList and RawEventPanel SHALL virtualize off-screen rows so render cost is independent of total item count. Scroll/stick-to-bottom behavior is unchanged from the pre-virtualization hand-rolled implementation.

## Impact

- **Affected code**:
  - `packages/client/src/components/MessageList.tsx` — add virtualizer around the existing scroll container
  - `packages/client/src/components/RawEventPanel.tsx` — swap Virtuoso for TanStack Virtual
  - `packages/client/package.json` — remove `react-virtuoso`, add `@tanstack/react-virtual`
  - `test/setup.ts` — remove `react-virtuoso` mock if present; TanStack Virtual works with jsdom given a mocked `ResizeObserver`
- **Risk**: low. Scroll logic is unchanged (already working on main). Only the DOM inside the scroll container changes. Existing tests that assert scroll behavior (`ScrollToBottom.test.tsx`, MessageList scroll tests) keep passing because scroll code is untouched.
