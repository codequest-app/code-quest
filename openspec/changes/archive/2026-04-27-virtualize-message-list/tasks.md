## 1. Preparation

- [x] 1.1 Baseline: confirm main's `MessageList.tsx` scroll logic is restored (post-revert)
- [x] 1.2 `pnpm --filter client exec vitest run` — all 1298 tests pass
- [x] 1.3 Install `@tanstack/react-virtual`, remove `react-virtuoso` from `packages/client/package.json`
- [x] 1.4 Remove any `vi.mock('react-virtuoso')` from `packages/client/src/test/setup.ts`
- [x] 1.5 Polyfill `ResizeObserver` in `test/setup.ts` if not already present

## 2. Step A — Virtualize MessageList (scroll logic untouched)

- [x] 2.1 Import `useVirtualizer` from `@tanstack/react-virtual`
- [x] 2.2 Keep all existing scroll refs (`scrollRef`, `scrollContainerRef`, `isAtBottomRef`, `programmaticScrollRef`), handler (`handleScroll`), helper (`scrollToEnd`), effect on `[messages.length, lastContentLen]`, and `scrollToBottom`
- [x] 2.3 Inside `<div data-testid="message-content-wrapper" className="px-4 pt-5 pb-32">`, replace `<MessageNodeList nodes={tree} ... />` with virtualized rendering:
  - `const virtualizer = useVirtualizer({ count: tree.length, getScrollElement: () => scrollContainerRef.current, estimateSize: () => 80, overscan: 5 })`
  - Outer spacer: `<div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>`
  - For each `item` in `virtualizer.getVirtualItems()`:
    ```tsx
    <div
      key={tree[item.index].message.id}
      data-index={item.index}
      ref={virtualizer.measureElement}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
    >
      <MessageNodeList nodes={[tree[item.index]]} prevRole={item.index > 0 ? tree[item.index - 1].message.role : null} ... />
    </div>
    ```
- [x] 2.4 SpinnerVerb + `<div ref={scrollRef} data-testid="message-list-bottom" />` remain as siblings AFTER the spacer, inside `message-content-wrapper`
- [x] 2.5 Build id→topLevelIndex map via `useMemo` walking `tree`; used only by `scrollToMessage`
- [x] 2.6 Extend `scrollToMessage(id)`: if `querySelector('[data-message-id]')` misses (row not mounted), call `virtualizer.scrollToIndex(topLevelIndex, { align: 'center' })` then RAF-retry the query + spotlight; keep the collapsed-timeline expand path first
- [x] 2.7 Typecheck: `pnpm --filter client exec tsc --noEmit`
- [x] 2.8 Run MessageList tests: `pnpm --filter client exec vitest run src/components/__tests__/MessageList.test.tsx` (37 tests)
- [x] 2.9 Run ScrollToBottom tests: `pnpm --filter client exec vitest run src/components/__tests__/ScrollToBottom.test.tsx` (8 tests)
- [x] 2.10 If jsdom tests fail due to virtualizer rendering 0 items: add a conditional `vi.mock('@tanstack/react-virtual')` in `test/setup.ts` that returns a passthrough `useVirtualizer` rendering all items (matches pre-virtualization DOM)

## 3. Step B — Virtualize RawEventPanel

- [x] 3.1 Remove `react-virtuoso` imports; import `useVirtualizer`
- [x] 3.2 Replace `<Virtuoso data={filteredEvents} itemContent={...} />` with the same TanStack Virtual pattern: scroll container div, virtualizer on it, absolutely positioned virtual items
- [x] 3.3 Keep `autoScroll` state + `userScrolledRef`; replace `atBottomStateChange` with an `onScroll` handler on the scroll container computing atBottom via scrollHeight math
- [x] 3.4 `scrollToBottom` uses `virtualizer.scrollToIndex(events.length - 1, { align: 'end' })` OR directly `scrollContainer.scrollTop = scrollContainer.scrollHeight`
- [x] 3.5 Extract `RawEventRow` as `React.memo` (props: `event`, `index`) for row stability
- [x] 3.6 Run `pnpm --filter client exec vitest run src/components/__tests__/RawEventPanel.test.tsx` (17 tests)

## 4. Step C — Cleanup & verification

- [x] 4.1 `pnpm --filter client exec tsc --noEmit` — passes
- [x] 4.2 `pnpm --filter client exec vitest run` — all pass
- [ ] 4.3 Lint via lefthook pre-commit — passes
- [x] 4.4 Verify `react-virtuoso` is gone from lockfile (`pnpm install`)
- [ ] 4.5 Manual Storybook smoke: `MessageList.stories.tsx` + `RawEventPanel.stories.tsx` variants render, no console errors
- [ ] 4.6 Manual dev smoke:
  - Open long session (200+ messages) — renders fast, scroll stays smooth
  - Enter submit — auto-scrolls to bottom
  - Streaming text delta — follows bottom
  - Scroll up mid-stream — button appears, click returns to bottom
  - CommandPalette `scrollToMessage` jump — highlights correct message with spotlight

## 5. Profile verification

- [ ] 5.1 React DevTools Profiler: open 200-message session — initial mount commit time < 50ms
- [ ] 5.2 Same session: Enter submit — single-digit ms commit time
- [ ] 5.3 Scroll up through history — only overscan-bounded items re-render
- [ ] 5.4 Record before/after numbers in commit message
