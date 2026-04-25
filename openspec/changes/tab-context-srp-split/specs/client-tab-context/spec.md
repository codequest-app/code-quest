## ADDED Requirements

### Requirement: TabProvider is pure tab CRUD + split UI state

`packages/client/src/contexts/TabContext.tsx` `TabProvider` SHALL hold only tab CRUD operations and split-pane UI state. It MUST NOT contain effects that diff a sessions prop or consume `NavigationContext` pending intents.

#### Scenario: A new external input drives tab changes
- **WHEN** an external prop or context needs to mutate tab state via a side effect
- **THEN** the side effect lives in a dedicated hook under `contexts/tabs/`, not inside `TabProvider`

### Requirement: Sessions-prop reconciliation lives in `useSyncTabsFromSessions`

A `useSyncTabsFromSessions(sessions, actions)` hook SHALL own the diff-and-reconcile logic that opens tabs for newly arrived sessions and closes tabs for removed sessions while preserving the active selection.

#### Scenario: A session is added to the sessions prop
- **WHEN** the sessions prop gains a session that has no tab
- **THEN** the hook calls `actions.openTab(sessionId)` once

#### Scenario: A session is removed
- **WHEN** the sessions prop loses a session that has a tab
- **THEN** the hook calls `actions.closeTab(sessionId)` and the active tab moves to a still-present neighbor

### Requirement: Navigation intents are consumed by `useNavigationIntents`

A `useNavigationIntents(cwd, state, actions)` hook SHALL subscribe to `NavigationContext`'s `pendingActivateChannel` and `pendingOpenWorktree`, apply them to tab actions, and clear the intent so it fires once.

#### Scenario: `pendingActivateChannel` is set
- **WHEN** `NavigationContext` exposes a non-null `pendingActivateChannel`
- **THEN** the hook activates that tab and clears the pending field on the same render cycle
