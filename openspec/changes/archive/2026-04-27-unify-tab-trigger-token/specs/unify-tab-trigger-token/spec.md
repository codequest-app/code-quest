## ADDED Requirements

### Requirement: Shared tabTrigger token in _tokens.ts

`ui/_tokens.ts` SHALL export a `tabTrigger` string containing the shared visual classes for tab trigger active indicator and text color switching. It SHALL NOT include padding, font-size, or layout classes.

#### Scenario: Token contains active indicator classes
- **WHEN** `tabTrigger` is imported
- **THEN** it includes `border-b-2 border-transparent text-text-muted hover:text-text data-[state=active]:border-accent data-[state=active]:text-text`

### Requirement: All content-switching tab triggers use tabTrigger token

CreateWorktreeDialog, ManagePluginsDialog, RightPane, and SpecModal SHALL import `tabTrigger` from `_tokens.ts` and compose it with their own size/layout classes via `cn()`.

#### Scenario: CreateWorktreeDialog uses tabTrigger
- **WHEN** CreateWorktreeDialog renders tab triggers
- **THEN** each trigger uses `cn(tabTrigger, 'px-3 py-1.5 text-xs -mb-px')`

#### Scenario: ManagePluginsDialog uses tabTrigger
- **WHEN** ManagePluginsDialog renders tab triggers
- **THEN** each trigger uses `cn(tabTrigger, ...)` with its own size and `data-[state=active]:font-medium`

#### Scenario: RightPane uses tabTrigger
- **WHEN** RightPane renders tab triggers
- **THEN** each trigger uses `cn(tabTrigger, ...)` replacing its local `TRIGGER_BASE`

### Requirement: SpecModal migrated to Radix Tabs

SpecModal SHALL use `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` with `tabTrigger` token. Content SHALL NOT use `Tabs.Content` (async fetch driven). TabButton import SHALL be removed.

#### Scenario: SpecModal tab switching
- **WHEN** user clicks a tab trigger in SpecModal
- **THEN** Radix manages active state and the component fetches content for the selected tab

### Requirement: TabButton.tsx deleted

`worktree-dialog/TabButton.tsx` SHALL be deleted after SpecModal is migrated. No file SHALL import it.

#### Scenario: No remaining TabButton imports
- **WHEN** all consumers are migrated
- **THEN** `TabButton.tsx` is deleted and grep finds zero imports
