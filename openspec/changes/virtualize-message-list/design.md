## Context

`MessageList` on `main` is a hand-rolled scroll container. `buildMessageTree(messages)` produces a tree; top-level nodes are rendered via `MessageNodeList`, subagent replies nest inside their parent `tool_use` row. Auto-scroll, stick-to-bottom, scroll-to-bottom button, and `scrollToMessage(id)` + spotlight are all implemented with `scrollIntoView`, a `scrollContainerRef.onScroll` handler tracking `isAtBottomRef`, and a `programmaticScrollRef` flag to ignore scroll events during programmatic moves.

That scroll logic **works**. It is only the per-render cost of mapping all N messages that is expensive (each `ChatMessage` runs Markdown + Shiki).

Two Virtuoso attempts were reverted. The second revert is the direct trigger for this design: Virtuoso owns scroll behavior, its chat-mode is janky in open-source (documented in issue #175), and any workaround ends up fighting its atBottom detection. TanStack Virtual is **headless** — it exposes a virtualizer object that answers "which items, positioned where" and leaves scroll mechanics to us.

## Goals / Non-Goals

**Goals:**
- O(visible) render cost at initial mount, scroll, new-message, streaming delta
- Scroll/stick-to-bottom/scrollToMessage behavior unchanged from main
- All existing tests pass unchanged — including `ScrollToBottom.test.tsx`, MessageList scroll tests, and spotlight tests
- Same pattern applied to `RawEventPanel`

**Non-Goals:**
- Not changing `buildMessageTree`, `MessageNodeList`, `SubagentChildren`, or `CollapsibleTimeline`
- Not touching `PaletteMessageList` (capped at 50 results)
- Not touching the `pb-32` spacer / InputArea overlay / SpinnerVerb positioning

## Decisions

### Decision: `@tanstack/react-virtual`
Most popular + actively maintained (2026). Headless, works for variable-height rows via `measureElement`. Bundle ≈ 3.5 KB gzip. Stable API (v3).

### Decision: Virtualize top-level rows, not the entire tree
Each virtual row = one top-level `MessageNode` from `buildMessageTree`. Subagent children and collapsible-timeline groups render **inside** their row via existing `SubagentChildren` / `MessageNodeList` — same as today. The measured height of each row naturally includes its expanded children.

### Decision: Scroll logic is 100% unchanged from main
The file still has:
- `scrollRef`, `scrollContainerRef`, `isAtBottomRef`, `programmaticScrollRef`
- `handleScroll` computing `atBottom` via `scrollHeight - scrollTop - clientHeight < 50`
- `scrollToEnd` helper using `scrollRef.current?.scrollIntoView`
- `useEffect` on `[messages.length, lastContentLen]` that calls `scrollToEnd` when at bottom
- `scrollToBottom` handler for the button
- `scrollToMessage` via `container.querySelector('[data-message-id]')` + `scrollIntoView` + spotlight class

What changes: inside the wrapper div, instead of `<MessageNodeList nodes={tree} />`, we render TanStack Virtual's visible-items. `scrollRef` (the bottom sentinel) still lives at the bottom of the wrapper (outside the virtualizer's inner spacer but still inside the scroll container) so `scrollIntoView` still works.

### Decision: scrollToMessage — scroll virtualizer first, then spotlight
If the target row is already in DOM (visible + overscan), `querySelector` finds it, `scrollIntoView(block:'center')` works, spotlight applied. If it's not mounted, call `virtualizer.scrollToIndex(topLevelIndex, { align: 'center' })` first, then RAF-delay the `querySelector` + spotlight. Same two-branch pattern as today's collapsed-timeline expand path.

### Decision: SpinnerVerb + bottom sentinel stay outside the virtualizer
SpinnerVerb and `<div ref={scrollRef} data-testid="message-list-bottom" />` render as siblings **after** the virtualizer's spacer div, inside the `message-content-wrapper`. They're not virtualized (they're 0–1 items). `pb-32` stays on `message-content-wrapper`. This matches main's layout exactly.

### Decision: estimateSize via a simple heuristic
`estimateSize: () => 80` — rough average. `measureElement` refines to actual height on mount. The only cost of a bad estimate is a one-time jitter when a row first becomes visible; overscan=5 absorbs it.

### Decision: Top-level index map for scrollToMessage
`buildMessageTree` returns top-level nodes. Walk each top-level node + its descendants once into `Map<messageId, topLevelIndex>`. Used only by `scrollToMessage`. Recomputed when `tree` changes (`useMemo`).

## Implementation plan

### Step A — MessageList with TanStack Virtual, scroll logic untouched
- Add `@tanstack/react-virtual`, remove `react-virtuoso`
- Keep all main's scroll refs/handlers/effects
- Inside the existing wrapper, replace `<MessageNodeList nodes={tree}>` with:
  - Flat array of top-level nodes from `buildMessageTree`
  - `useVirtualizer({ count, getScrollElement: () => scrollContainerRef.current, estimateSize: () => 80, overscan: 5 })`
  - Outer spacer `<div style={{ height: getTotalSize(), position: 'relative' }}>`
  - Inner items absolutely positioned via `transform: translateY(item.start)` and `ref={virtualizer.measureElement}` with `data-index={item.index}`
  - Each item wraps one `MessageNodeList` pass over **only that single node** so timeline-grouping and subagent nesting still work for per-row nested children
- SpinnerVerb + `scrollRef` sentinel stay as siblings after the spacer
- Add id→topLevelIndex memo; scrollToMessage uses it to call `virtualizer.scrollToIndex` when row not in DOM
- **Verify**: typecheck + MessageList tests (37) + ScrollToBottom tests (8) all pass unchanged

### Step B — RawEventPanel
- Replace Virtuoso `<Virtuoso data={filteredEvents} itemContent={...} />` with the same TanStack Virtual pattern
- `autoScroll` / `userScrolledRef` logic stays; `atBottom` detection via `handleScroll` equivalent
- **Verify**: RawEventPanel tests (17) pass unchanged

### Step C — Cleanup
- Remove `react-virtuoso` from `package.json` + lockfile
- Remove any `vi.mock('react-virtuoso')` from `test/setup.ts`
- `pnpm --filter client exec tsc --noEmit`
- Full client test suite

## Risks / Trade-offs

- **jsdom has no layout** — TanStack Virtual calls `getBoundingClientRect()` returning zeros. Default behavior: virtualizer renders 0 items until measured. Mitigation: in test env, force `estimateSize` to a value such that `getTotalSize > viewport` AND set an initial virtualizer `initialRect` via jsdom-friendly override. Simpler alternative: if tests break, mock `useVirtualizer` to render all items in test env (same strategy as the v1 Virtuoso mock).
- **ResizeObserver in jsdom** — not natively available but TanStack Virtual gracefully degrades; if not, polyfill via `global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }` in setup.
- **Rollback**: if Step A breaks tests, revert just that step. RawEventPanel swap (Step B) is independent of MessageList and can be skipped/reverted separately.
