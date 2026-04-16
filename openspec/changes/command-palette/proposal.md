## Why

The current UI has multiple scattered entry points (search button, raw panel toggle, filter popover) that create cognitive overhead. Replacing them with a unified Command Palette (⌘K) — modelled on JetBrains Search Everywhere — gives users a single keyboard-driven interface for search, panel toggles, and message visibility control. It also aligns cc-office's default message visibility with the Claude Code extension (hiding debug/hook types by default).

## What Changes

- **BREAKING**: Remove `onToggleRaw`, `rawActive`, `onOpenSpotlight` props from `HeaderBar` — replaced by single `onOpenCommandPalette`
- **BREAKING**: Remove `SpotlightSearch` component — replaced by `CommandPalette`
- **BREAKING**: Remove `SpotlightFilterBar` component — filter moved into CommandPalette Actions tab
- Remove filter icon / search icon from `HeaderBar`; keep only session title, model badge, and ⌘K icon
- Add `CommandPalette` component with three tabs: All, Messages, Actions
- Add `MessageVisibilityContext` — global state controlling which message groups are visible in `MessageList`, persisted to `localStorage`
- `MessageList` filters rendered messages based on `MessageVisibilityContext`
- Default visibility: 對話/工具/系統 on; Hooks/Debug off (matches extension behaviour)

## Capabilities

### New Capabilities
- `command-palette`: Unified ⌘K overlay with All / Messages / Actions tabs; keyboard navigation (↑↓ Enter Esc Tab); searches messages and lists action commands
- `message-visibility`: Global context + localStorage persistence for per-group message visibility; MessageList consumes it to filter rendered messages
- `actions-tab`: Actions tab inside CommandPalette listing panel toggles (Raw Event Panel) and Message Visibility group toggles with inline pill/chip expansion

### Modified Capabilities
- `header-bar`: Remove filter/search/raw-toggle buttons; single ⌘K trigger remains

## Impact

- `packages/client/src/components/HeaderBar.tsx` — props simplified
- `packages/client/src/components/ChatPanel.tsx` — wires CommandPalette, removes SpotlightSearch
- `packages/client/src/components/MessageList.tsx` — reads MessageVisibilityContext
- `packages/client/src/contexts/` — new MessageVisibilityContext
- `packages/client/src/components/SpotlightSearch.tsx` — deleted
- `packages/client/src/components/SpotlightFilterBar.tsx` — deleted
- `packages/client/src/components/__tests__/HeaderBar.test.tsx` — updated props
