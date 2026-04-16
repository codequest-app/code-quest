## Context

cc-office currently has scattered UI entry points: a search button opening SpotlightSearch, a raw-panel toggle in HeaderBar, and a filter popover in SpotlightSearch. The goal is to consolidate into a single ⌘K Command Palette (JetBrains Search Everywhere style) with three tabs: All, Messages, Actions.

## Goals / Non-Goals

**Goals:**
- Single keyboard entry point (⌘K) for search + panel control + visibility control
- MessageList filters by group visibility (matching extension defaults)
- Per-type override via pill/chip expansion in Actions tab
- Visibility persisted to localStorage

**Non-Goals:**
- Not replacing RawEventPanel's own inline filter bar (RawEventFilterBar stays)
- Not adding new message types or changing server protocol

## Decisions

### Component tree
```
ChatPanel
├── HeaderBar (onOpenCommandPalette only)
├── CommandPalette (new, replaces SpotlightSearch)
│   ├── tab: All   → flat actions + recent messages
│   ├── tab: Messages → message search (existing SpotlightSearch logic)
│   └── tab: Actions  → ActionsTab (panels + message visibility groups)
│       └── VisibilityGroupRow (toggle + chevron + pill expansion)
├── MessageVisibilityContext (new)
└── MessageList (reads MessageVisibilityContext)
```

### MessageVisibilityContext
```ts
type GroupId = 'conversation' | 'tools' | 'system' | 'hooks' | 'debug';

interface VisibilityState {
  // per-type enabled map, derived from group defaults + overrides
  enabledTypes: Set<string>;
  toggleGroup: (id: GroupId) => void;
  toggleType: (type: string) => void;
  groupState: (id: GroupId) => 'all' | 'partial' | 'none';
}
```

Groups and their types match `GroupedFilterPopover.tsx` GROUPS const exactly.
Default: conversation/tools/system = all on; hooks/debug = all off.
Persisted as JSON to `localStorage` key `cc-office:message-visibility`.

### CommandPalette tabs
- **All**: mixed list — pinned action rows (flat, no chevron) above recent 8 messages. Filtered by search query if present.
- **Messages**: existing SpotlightSearch search logic. Searches only visible messages (respects MessageVisibilityContext).
- **Actions**: two sections — "Panels" (Raw Event Panel toggle) and "Message Visibility" (expandable group rows with pills).

### VisibilityGroupRow interaction
- Left: `[●/○/∂]` button → toggleGroup (whole group flip)
- Right: `▶/▼` chevron button → expand/collapse inline pill list
- Pills: each type as a chip, filled = on, outline = off, click = toggleType
- Expand state is local to the row (not persisted)

### TDD approach
All new components tested with fakeSummoner + real JSON + @testing-library/react:
- `CommandPalette.test.tsx` — open/close, tab switching, keyboard nav, message search
- `MessageVisibilityContext.test.tsx` — renderWithChannel, toggle group, toggle type, localStorage round-trip
- `MessageList.test.tsx` — existing tests pass + new: hidden groups don't render
- `HeaderBar.test.tsx` — existing tests updated (remove rawActive/onToggleRaw tests, add onOpenCommandPalette)

### Deletions
- `SpotlightSearch.tsx` + test
- `SpotlightFilterBar.tsx` + test
- `HeaderBar` props: `onToggleRaw`, `rawActive`, `onOpenSpotlight`

## Risks / Trade-offs

- **Breaking HeaderBar props**: ChatPanel and any embedder must update. Low risk — internal only.
- **MessageList filtering**: messages hidden by visibility still exist in context; only rendering is gated. Search (Messages tab) only searches visible messages — acceptable since user opted those types out.
- **SpotlightSearch deletion**: all existing SpotlightSearch tests replaced by CommandPalette tests.
