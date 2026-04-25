## Why

F.html shows a "Split chat" mode: the middle column splits left/right, each half is an independent session (different cwd / branch / provider possible). The two pre-existing user scenarios:
1. One session is running a long task; user wants to manually browse code/chat in another simultaneously.
2. Compare two worktree sessions side-by-side.

The architecture already supports this cleanly: `<ChannelProvider channelId={...}>` is per-tab today, so split = render two of them. No socket / pipeline / channel changes needed.

## What Changes

- `TabContext`: add `splitTabId: string | null` + actions `enterSplit(tabId)` / `exitSplit()` / `swapHalves()`.
- `TabContainer` (or a new `<SplitChatContainer>`): when `splitTabId !== null`, render both `<TabContent>` halves with a `<PanelGroup>` (reuse react-resizable-panels) for resizable split.
- Each half shows:
  - A small header bar: project/branch label, "Active half" indicator (border-accent), `×` to close split (left half closes split entirely; right half keeps left as solo tab).
  - The full `<ChannelProvider>` + chat pipeline, untouched.
- Trigger:
  - `<LiveSessionPopover>` "Split chat here" action (depends on `live-pill-popover`; works without it via menu fallback).
  - `<TopScopeSwitcher>` or tab-strip overflow menu: "Split with [other tab]…" option.
- Keyboard:
  - `Cmd+\` toggle split with the next tab if any.
  - Click in either half makes it the "active" half (composer focus + keyboard shortcuts route there).

Out of scope:
- 3+ panes (only 2 in v1; matches F.html).
- Vertical split (top/bottom).
- Mobile / tablet (split disabled below desktop breakpoint).

## Impact

**New:**
- `<SplitChatContainer>` or extend TabContainer.
- Actions in `TabContext`.

**Modified:**
- `TabContext.tsx` — add splitTabId + actions.
- `TabContainer.tsx` — when split active, render PanelGroup with two Panels.
- Maybe a CSS adjustment so each half handles its own scroll/composer layout.

**Risk:** low-medium.
- Keyboard focus / composer routing needs careful pointer-down active-half tracking.
- When the active tab changes (e.g. user closes one half), splitTabId must reconcile.
- ChannelProvider being per-half means no cross-talk; safe by construction.
