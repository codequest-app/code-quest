## ADDED Requirements

### Requirement: Tab strip uses Radix `Tabs.Root` with controlled value

The `ChatPanel` tab strip SHALL be implemented with `@radix-ui/react-tabs`. `Tabs.Root` MUST be controlled — its `value` is sourced from `useTabState().activeTabId` and `onValueChange` calls `useTabActions().setActiveTab`. Radix manages `role="tablist"`, `role="tab"`, `aria-selected`, and roving `tabindex` automatically.

#### Scenario: Active tab matches TabContext
- **WHEN** `useTabState().activeTabId === 'tab-2'`
- **THEN** `Tabs.Root.value` resolves to `'tab-2'` and exactly one trigger has `aria-selected="true"`.

#### Scenario: User clicks an inactive tab
- **WHEN** the user clicks a `Tabs.Trigger` whose value is `'tab-3'`
- **THEN** Radix calls `onValueChange('tab-3')` which calls `setActiveTab('tab-3')`, and the next render shows `tab-3` as `aria-selected`.

#### Scenario: External state change drives Radix value
- **WHEN** `setActiveTab` is called from outside the strip (e.g. `pendingActivateChannel` intent or sessions sync)
- **THEN** `Tabs.Root.value` reflects the new active id without `onValueChange` being re-emitted by Radix.

### Requirement: Tab triggers preserve in-tab close button via `asChild`

Each `Tabs.Trigger` SHALL use `asChild` to render a `<div role="tab">` (not the default `<button>`). This allows the per-tab close `<button>` to remain nested inside the trigger element without violating HTML's button-in-button rule. Radix continues to manage `role`, `tabindex`, `aria-selected`, click activation, and keyboard navigation.

#### Scenario: Trigger element is `<div role="tab">`
- **WHEN** the strip renders
- **THEN** each tab is a `<div role="tab">`, NOT a `<button>`.

#### Scenario: Close button is valid HTML
- **WHEN** the strip renders a tab with a close ✕ control
- **THEN** the `<button>` for close is nested inside the trigger element AND validates as well-formed HTML (no button-in-button).

#### Scenario: Close click does not toggle active tab
- **WHEN** the user clicks the close ✕
- **THEN** the close handler fires AND `setActiveTab` is NOT called.

### Requirement: Tab content stays mounted across switches

`Tabs.Content` SHALL use `forceMount` plus an explicit `hidden` attribute (driven by whether `value === activeTabId`) so every tab's `ChannelProvider` subtree remains mounted while inactive. The active content's wrapper SHALL apply `display: contents` so the wrapping element does not introduce an extra flex ancestor.

#### Scenario: Inactive tab keeps its messages
- **WHEN** the user switches from tab A to tab B and back to A while A had assistant messages rendered
- **THEN** A's messages are present immediately on return without re-fetching (no replay, no "Connecting…" spinner).

#### Scenario: Streaming continues in background
- **WHEN** tab A is mid-stream and the user switches to tab B
- **THEN** A's streaming buffer continues accumulating; switching back shows the up-to-date partial content.

#### Scenario: Inactive content is hidden but in DOM
- **WHEN** tab A is active and tab B is inactive
- **THEN** B's `Tabs.Content` is in the DOM with the `hidden` attribute set; A's `Tabs.Content` is in the DOM without `hidden` and uses the `contents` display class.

### Requirement: Keyboard navigation follows ARIA APG

The tab strip SHALL support standard keyboard navigation per ARIA APG for tabs:
- `ArrowLeft` / `ArrowRight`: focus the previous/next trigger (wrap at ends).
- `Home` / `End`: focus the first/last trigger.
- `Tab`: move focus out of the tablist (roving tabindex — only the active trigger has `tabindex="0"`).
- `Enter` / `Space`: activate the focused trigger when activation mode is manual.

#### Scenario: ArrowRight cycles through triggers
- **WHEN** focus is on tab 1 of `[tab1, tab2, tab3]` and user presses `ArrowRight`
- **THEN** focus moves to tab 2.

#### Scenario: Roving tabindex
- **WHEN** the strip is rendered with active tab 2
- **THEN** tab 2's trigger has `tabindex="0"` AND tabs 1, 3 have `tabindex="-1"`.

#### Scenario: Tab key exits tablist
- **WHEN** focus is on the active trigger and user presses `Tab`
- **THEN** focus moves to the next focusable element OUTSIDE the tablist (not to the next tab trigger).

### Requirement: Visual treatment matches F.html prototype

The tab strip SHALL match the visual specification in `docs/prototype/F.html` + `docs/prototype/shared.css:148-162`:
- Strip height `36px`, `border-bottom: 1px solid border`, horizontal scroll on overflow.
- Each tab: `padding: 0 12px`, `gap: 8px`, `border-right: 1px solid border` (sibling separation), `border-bottom: 2px solid transparent`.
- Active tab: `border-bottom-color: accent` + background switches to `var(--color-bg)` + bright text color.
- Tab includes a status dot, title, optional `.scope-tag` (10px mono `proj/wt`), an optional `.provider-pill` slot, and a close `×`.
- "Add tab" `+` rendered as last item with no border, hover → accent.

#### Scenario: Active tab visual
- **WHEN** a tab is active
- **THEN** it shows a 2px accent-colored bottom border AND a `var(--color-bg)` background AND bright (`--color-text-bright`) text.

#### Scenario: Sibling tabs separated by vertical rule
- **WHEN** two tabs render side by side
- **THEN** there is a 1px right border on the left tab visually separating it from the right tab.

#### Scenario: Scope tag shows project / worktree
- **WHEN** a tab has `worktree.branch = 'feat/x'` and `projectName = 'cc-office'`
- **THEN** the tab renders `.scope-tag` text `cc-office/feat/x` in 10px monospace, subtle color.

### Requirement: Status dot retains multi-state semantics

The per-tab status dot SHALL distinguish at least: `idle` (success/green), `processing` / `connecting` / `busy` (accent + pulse animation), `cancelling` (warning + pulse), `disconnected` (danger). This requirement supersedes the F.html prototype's binary live/idle dot — the multi-state behavior is functional and MUST NOT be removed.

#### Scenario: Processing tab pulses accent
- **WHEN** tab A is in `processing` state
- **THEN** its status dot uses the accent color AND has a CSS pulse animation.

#### Scenario: Idle tab is solid green
- **WHEN** tab A is in `idle` state
- **THEN** its status dot uses the success color with no animation.

### Requirement: Provider pill slot is reserved for future feature

The tab markup SHALL reserve a `.provider-pill` element slot in the trigger DOM tree (visually empty by default). The slot exists to host a future Claude/Gemini/Codex provider switcher; this change SHALL NOT implement the switching behavior.

#### Scenario: Slot present in DOM
- **WHEN** the strip renders any tab
- **THEN** a `.provider-pill` element exists inside the trigger AND its content is empty.

#### Scenario: Slot does not affect active state
- **WHEN** the user clicks the empty `.provider-pill` element
- **THEN** the click is a no-op (no provider switch, no tab activation change beyond Radix's normal trigger click).

### Requirement: Split mode is not supported

The chat tab strip SHALL NOT support a split / side-by-side mode. Tabs are single-active. Any prior split-related state, actions, or UI affordances (e.g. `splitTabId`, `enterSplit` / `exitSplit`, shift-click to split, `<SplitHalf>`) MUST be removed.

#### Scenario: TabContext exposes no split actions
- **WHEN** a consumer reads `useTabActions()`
- **THEN** the returned object contains no `enterSplit` / `exitSplit` keys.

#### Scenario: Shift-click on tab does not split
- **WHEN** the user shift-clicks a tab trigger
- **THEN** the tab is activated normally (same as a plain click); no split UI appears.

#### Scenario: TabContainer renders single body path
- **WHEN** the user has multiple open tabs
- **THEN** `TabContainer` renders exactly one body region — never a `<PanelGroup>` with two `<SplitHalf>` panes.
