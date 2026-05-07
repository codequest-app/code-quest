## Why

F.html shows "live session pills" in the top header — a row of small badges (one per running Claude session across all projects), with a green pulsing dot when busy, that the user can click to jump straight to that chat tab. A `⋯` opens a popover with full status, last assistant-message preview, and a "Split" button to fork a new chat into the same scope.

Today cc-office's TopBar has scope switcher + sidebar/right-pane toggles + Settings, but **no global live-session visibility**. Users have to check each project's tab strip to see if a session is busy, which breaks the global-overview promise of the three-column scope-aligned design.

We already have all the data:
- `useSession()` exposes `sessions` with `state` ('busy' / 'idle' / 'dead'), `projectRoot`, `lastMessage` etc.
- `setActiveProject` + tab activation wires "click → switch" today (used by sidebar).
- ChannelEmitter broadcasts `session:status` updates so the pill state can react in real time without polling.

Missing: a small visual component in the topbar slot, the popover content, and the "Split chat" wiring (which today exists as a hidden flow inside the chat tab; we'd just expose its trigger).

## What Changes

- Add **`<TopbarLiveSessions>`** rendered in the existing TopBar (between the scope switcher and the right-side action group).
- Each live pill:
  - Shape: small rounded badge `<project>/<worktree>` truncated, with a leading status dot.
  - Dot color: green (busy + animated pulse), grey (idle), red (dead/error).
  - Click → activate that session's tab (find tab whose `cwd === session.projectRoot`; if none in current project, switch active project + activate; if a non-current-project session, switch project first).
  - Hover → show tooltip with `last message preview` (first ~60 chars).
- Each pill has a `⋯` opening a **`<LiveSessionPopover>`**:
  - Header: full project/worktree path + provider/model badge.
  - Body: status, last assistant message (~200 chars), tokens used (if available), elapsed time.
  - Actions: "Open" (same as click), "Split chat here" (creates new chat tab in same scope), "Stop" (cancels the running session — only when busy).
- Visibility rules:
  - Show pill when `session.state === 'busy'` always.
  - Show pill when `session.state === 'idle'` AND has a tab open.
  - Hide when dead AND user has dismissed.
  - Cap visible pills to 5; overflow → `+N` chip opens a recent-sessions popover.
- Mobile / tablet:
  - On non-desktop breakpoints, collapse all pills into a single status chip showing `<busy-count> running` that opens the same popover with the full list.

Explicitly out of scope:
- New session creation from the topbar (the sidebar handles that).
- Per-pill drag-to-reorder.
- Rename / archive / delete via the popover (worktree row context menu covers these — separate change).
- Session aggregation across hosts / remote (single-server only).

## Capabilities

### New Capabilities
- `topbar-live-sessions`: live session pill row + popover in the TopBar.

### Modified Capabilities
- `workspace-topbar`: adds a new slot for live pills between scope switcher and action group; existing slots unchanged.

## Impact

**Affected code (new):**
- `apps/web/src/components/TopbarLiveSessions.tsx`
- `apps/web/src/components/LiveSessionPopover.tsx`
- `apps/web/src/components/__tests__/TopbarLiveSessions.test.tsx`
- `apps/web/src/components/__tests__/LiveSessionPopover.test.tsx`

**Affected code (modified):**
- `apps/web/src/components/WorkspaceTopbar.tsx` — accept (or render directly) `<TopbarLiveSessions>` between scope switcher and Settings/toggle group.
- Existing `useSession` consumer pattern reused (no API change).

**Affected code (possibly modified):**
- ChatTab "Split" trigger — if hidden today, expose a small public helper so the popover can call it (avoid duplicating logic).

**Dependencies on other changes:**
- Independent. Slots into the existing topbar; doesn't depend on right-pane work.

**Risk:** low to medium.
- Re-render storm if `session:status` fires very frequently — mitigate with a debounce/memoize at the pill level.
- "Find tab for session" logic: must handle the case where a session has no open tab (e.g., another machine started it). Behavior: clicking creates a new tab.
- Popover positioning on narrow viewports — reuse existing popover primitive with auto-flip.
