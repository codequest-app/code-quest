## ADDED Requirements

### Requirement: Right pane displays a pane-bar with current scope and follow/pin toggle

The `RightPane` SHALL render a pane-bar at its top containing: (a) a scope label showing the current `📁 project · ⎇ branch`, (b) a follow/pin toggle (radix `Switch` with `role="switch"` + `aria-checked`), (c) a close/collapse button. The pane-bar SHALL be present on every breakpoint where the right pane is visible.

#### Scenario: Pane-bar shows current scope
- **WHEN** the right pane is visible and a worktree is active
- **THEN** the pane-bar displays the active worktree's project name and branch label

#### Scenario: Pane-bar shows empty state when no worktree active
- **WHEN** the right pane is visible but no worktree is active
- **THEN** the pane-bar shows a placeholder (e.g. "— no scope —") and the toggle is disabled

#### Scenario: Toggle is keyboard accessible
- **WHEN** the user focuses the follow/pin toggle and presses Space
- **THEN** the toggle's `aria-checked` flips and `data-state` switches between `unchecked` (follow) and `checked` (pinned)

### Requirement: Right pane scope can be pinned to a specific worktree

The right pane SHALL support two scope modes: **follow** (default — scope tracks the active chat tab's worktree via `useActiveCwd()`) and **pinned** (scope locked to a specific worktree, independent of which chat tab is active). The user SHALL toggle between modes via the pane-bar toggle.

#### Scenario: Default mode is follow
- **WHEN** the application loads and `RightPaneScopeProvider` mounts with no prior session storage
- **THEN** the scope mode is `follow`
- **AND** the toggle reads "⇆ follow" with `aria-checked="false"`

#### Scenario: Pin to current worktree
- **WHEN** the user is in `follow` mode with worktree X active and toggles the pane-bar switch
- **THEN** the mode changes to `pinned` with `cwd = X`
- **AND** the toggle visually shifts to "📌 pinned" with `aria-checked="true"`

#### Scenario: Pinned scope ignores chat tab changes
- **WHEN** the right pane is `pinned` to worktree X and the user activates a different worktree Y in the chat
- **THEN** `useRightPaneCwd()` continues to return X
- **AND** the pane-bar continues to show "X" as its scope label
- **AND** the right pane's Files / Git / Spec tabs continue to display X's contents

#### Scenario: Unpin returns to follow
- **WHEN** the right pane is `pinned` and the user toggles the switch off
- **THEN** the mode changes back to `follow`
- **AND** `useRightPaneCwd()` immediately returns the active chat tab's cwd

#### Scenario: Pin while no worktree active is a no-op
- **WHEN** `activeCwd` is null and the user toggles the switch
- **THEN** the mode remains `follow` (cannot pin to nothing)

### Requirement: Pinned scope persists across remount via sessionStorage

The right pane scope SHALL persist in `sessionStorage` (key: `right-pane-scope`) so that pin survives in-tab navigation / hot reload but NOT browser-tab-level reopens. localStorage MUST NOT be used for this state.

#### Scenario: Pin persists across remount
- **WHEN** the user pins to worktree X, then the `RightPaneScopeProvider` unmounts and remounts (e.g. parent re-renders with key change)
- **THEN** the scope mode reads back as `pinned` with `cwd = X` from sessionStorage

#### Scenario: Browser tab close clears pin
- **WHEN** the user pins to worktree X and closes the browser tab, then reopens the app in a new tab
- **THEN** the new tab starts in `follow` mode (sessionStorage is per-tab)

#### Scenario: Corrupted sessionStorage falls back to follow
- **WHEN** sessionStorage contains an invalid value at key `right-pane-scope`
- **THEN** `RightPaneScopeProvider` initializes mode to `follow` without throwing

### Requirement: Right pane close affordance is breakpoint-appropriate

The pane-bar's close button SHALL adapt its label and behaviour to the breakpoint:
- At `≥ 768px` (tablet & desktop): label `—`, behaviour: invoke `onCollapse` callback (parent typically sets `rightOpen=false` to collapse the docked column / drawer)
- At `< 768px` (mobile): label `✕`, behaviour: invoke `onBack` callback (parent typically dismisses the workspace overlay / returns to chat)

The close button SHALL always be present, providing an unambiguous "way back" from the right pane regardless of viewport.

#### Scenario: Tablet/desktop close invokes onCollapse
- **WHEN** the viewport is `≥ 768px` and the user clicks the pane-bar close button
- **THEN** `onCollapse` is called once
- **AND** the right pane subtree remains mounted in the DOM (parent decides visibility)

#### Scenario: Mobile close invokes onBack
- **WHEN** the viewport is `< 768px` and the user clicks the pane-bar close button
- **THEN** `onBack` is called once
- **AND** the right pane subtree remains mounted in the DOM
