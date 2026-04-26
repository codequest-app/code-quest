## ADDED Requirements

### Requirement: CreateWorktreeDialog tab switching uses Radix Tabs

CreateWorktreeDialog SHALL use `@radix-ui/react-tabs` (`Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`) instead of hand-rolled `TabButton` + `role="tablist"`. The `mode` state SHALL be controlled via `Tabs.Root value` / `onValueChange`. Visual styling SHALL remain identical (border-b-2 active indicator with accent color).

#### Scenario: Switch between existing and new branch tabs
- **WHEN** user clicks the "Create new branch" tab trigger
- **THEN** the tab strip shows "Create new branch" as active (`data-state="active"`) and renders `NewPane` content

#### Scenario: Keyboard navigation between tabs
- **WHEN** user focuses a tab trigger and presses ArrowRight
- **THEN** focus moves to the next tab trigger (Radix built-in behavior)

#### Scenario: Dialog reset on close
- **WHEN** user closes the dialog
- **THEN** the active tab resets to "existing" (first tab)

### Requirement: ManagePluginsDialog tab switching uses Radix Tabs

ManagePluginsDialog SHALL use `@radix-ui/react-tabs` instead of hand-rolled tab buttons. The `activeTab` state SHALL be controlled via `Tabs.Root value` / `onValueChange`. Badge counts inside tab triggers SHALL remain as children of `Tabs.Trigger`.

#### Scenario: Switch between plugins and marketplaces tabs
- **WHEN** user clicks the "Marketplaces" tab trigger
- **THEN** the tab strip shows "Marketplaces" as active and renders `MarketplaceSection` content

#### Scenario: Tab trigger displays badge count
- **WHEN** there are 3 installed plugins
- **THEN** the "Plugins" tab trigger shows a badge with count "3"

### Requirement: SpecModal tab switching uses Radix Tabs

SpecModal SHALL use `Tabs.Root` and `Tabs.List` / `Tabs.Trigger` for the tab strip. Content SHALL NOT use `Tabs.Content` because tab changes trigger async data fetching. The `active` state SHALL be controlled via `Tabs.Root value` / `onValueChange`.

#### Scenario: Switch between change artifact tabs
- **WHEN** user clicks the "Design" tab trigger in a change modal
- **THEN** the tab strip shows "Design" as active and the component fetches design content

#### Scenario: Single-tab spec hides tab strip
- **WHEN** `kind` is "spec" (only one tab)
- **THEN** the tab list is not rendered (same `tabs.length > 1` guard)

### Requirement: TabButton component is deleted after migration

`worktree-dialog/TabButton.tsx` SHALL be deleted once all consumers (CreateWorktreeDialog, SpecModal) are migrated. Any test helpers importing `TabButton` SHALL be updated.

#### Scenario: No remaining imports of TabButton
- **WHEN** all three components are migrated
- **THEN** `TabButton.tsx` is deleted and no file imports it

### Requirement: Tab trigger styling uses Radix data attributes

Tab triggers SHALL use `data-[state=active]:` Tailwind variants instead of an `active` prop for conditional styling. Active state: `border-accent text-text`. Inactive state: `border-transparent text-text-muted hover:text-text`.

#### Scenario: Active tab trigger appearance
- **WHEN** a tab trigger has `data-state="active"` (set by Radix)
- **THEN** it renders with `border-accent` bottom border and `text-text` color
