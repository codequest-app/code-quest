## Why

`packages/client/src/contexts/TabContext.tsx` (~250 lines) bundles three independent concerns:

1. Tab CRUD + split-pane UI state (the actual tab-context responsibility).
2. A "sync tabs from sessions prop" effect that diffs the incoming sessions list against current tabs and reconciles.
3. Consumption of `NavigationContext`'s `pendingActivateChannel` and `pendingOpenWorktree` intents to mutate tab state.

Concerns 2 and 3 are side effects driven by external inputs; they belong in dedicated hooks so the provider stays a pure CRUD store and each side-effect can be unit-tested without mounting the whole tree.

## What Changes

- Keep `TabProvider` in `TabContext.tsx` focused on tab CRUD + split-pane UI state. Strip out the sessions-sync `useEffect` and the navigation-intent `useEffect`s.
- Add `packages/client/src/contexts/tabs/useSyncTabsFromSessions.ts` — `useSyncTabsFromSessions(sessions, actions)`. Owns the prop-diff reconciliation: opens tabs for new sessions, closes tabs for removed sessions, preserves active selection.
- Add `packages/client/src/contexts/tabs/useNavigationIntents.ts` — `useNavigationIntents(cwd, state, actions)`. Subscribes to `pendingActivateChannel` and `pendingOpenWorktree` from `NavigationContext`, applies them to tab actions, and clears the intents.
- Wire both hooks at the same place that currently mounts `TabProvider` (likely `packages/client/src/App.tsx` or a workspace shell). Each call site clearly shows the dependency surface.
- All existing TabContext tests pass; new tests cover each hook in isolation.

Out of scope:
- Renaming any tab actions or changing the split-pane data shape.
- Refactoring `NavigationContext` itself.

## Capabilities

- **client-tab-context**: keep `TabProvider` as pure tab CRUD + split UI state; extract `useSyncTabsFromSessions` for sessions-prop reconciliation and `useNavigationIntents` for `NavigationContext` pending-intent consumption.
