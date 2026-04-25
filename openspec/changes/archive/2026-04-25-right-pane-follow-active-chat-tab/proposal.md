## Why

Switching chat tabs within a project (e.g., main-branch chat → worktree chat)
does NOT update the right pane's Files/Git/Spec to the active chat's cwd.
The right pane stays on the project root cwd until the user picks a different
project.

Root cause: `RightPaneWithCwd` lives outside any `TabProvider` in the
WorkspaceLayout tree (it's in the right `<DrawerAside>`, sibling to
`<main>`). `useActiveCwd()` reads `TabStateContext` via `useContext` and
gets `null` because there's no provider above it. The fallback chain
skips the per-tab cwd entirely:

```
useActiveCwd():
  1. activeTab?.cwd      ← always null (TabProvider unreachable)
  2. selectedWorktreeCwd ← only set by sidebar interactions
  3. activeProjectCwd    ← what right pane currently shows
```

Each project owns its own `<TabProvider>` (CSS-hidden when inactive); none
of them share state with the right pane.

## What Changes

Introduce `ActiveTabCwdContext` — a tiny global context holding the active
chat tab's cwd (one slot, last-writer-wins).

- `ActiveTabCwdProvider` lives in WorkspaceLayout above both `<main>` and
  the right `<DrawerAside>`, so the writer (inside TabProvider) and the
  reader (RightPaneWithCwd) can both reach it.
- New `useActiveTabCwdPublisher()` hook called inside `<TabContainer>`
  (already inside TabProvider). When this project equals `activeProjectCwd`,
  publish the active tab's cwd; when it doesn't, no-op. Last writer (the
  active project's TabContainer) wins.
- `useActiveCwd()` reads `ActiveTabCwdContext` first, before all existing
  fallbacks.

Why publisher in TabContainer (not TabProvider): the recently-extracted
`useNavigationIntents` pattern decoupled TabProvider from external
contexts; A publisher inside the child component preserves that boundary.

Out of scope:
- Multi-pane (split-tab) cwd resolution. Split currently shows two channels
  but the right pane reflects only the primary `activeTabId`; same here.
- Reverse direction (right-pane sets the chat tab). Not requested.

## Capabilities

- **client-active-cwd-routing**: the right pane (Files/Git/Spec) follows
  the active chat tab's cwd as the user switches tabs within a project,
  not just when the project itself changes.
