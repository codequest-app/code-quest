## Context

Three components use hand-rolled tab UIs (`role="tablist"` + custom `TabButton`):

1. **CreateWorktreeDialog** — two tabs: "Checkout existing" / "Create new branch", controlled by `mode` state
2. **ManagePluginsDialog** — two tabs: "Plugins" / "Marketplaces", controlled by `activeTab` state
3. **SpecModal** — dynamic tabs (proposal/design/tasks or spec), controlled by `active` state; tab change triggers async data fetch

The project already uses `@radix-ui/react-tabs` in `TabBar`/`TabContainer` (chat session tabs). The shared `TabButton` component lives at `worktree-dialog/TabButton.tsx` and is consumed by CreateWorktreeDialog and SpecModal.

## Goals / Non-Goals

**Goals:**
- Replace hand-rolled tab state + ARIA with `Tabs.Root` / `Tabs.List` / `Tabs.Trigger`
- Gain Radix keyboard navigation (Arrow keys, Home/End) and focus management for free
- Delete `worktree-dialog/TabButton.tsx` once all consumers are migrated
- Preserve identical visual styling

**Non-Goals:**
- Changing tab visual design or layout
- Migrating `TabBar`/`TabContainer` (already on Radix)
- Using `Tabs.Content` where it doesn't fit (SpecModal — see Decisions)

## Decisions

### D1: CreateWorktreeDialog — use `Tabs.Content` for panel switching

CreateWorktreeDialog has two static content panels (`ExistingPane` / `NewPane`). This maps cleanly to `Tabs.Root` + `Tabs.Content`:

```
<Tabs.Root value={mode} onValueChange={setMode}>
  <Tabs.List>
    <Tabs.Trigger value="existing">Checkout existing</Tabs.Trigger>
    <Tabs.Trigger value="new">Create new branch</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="existing"><ExistingPane ... /></Tabs.Content>
  <Tabs.Content value="new"><NewPane ... /></Tabs.Content>
</Tabs.Root>
```

The `mode` state variable is replaced by Radix's internal controlled value. `resetAndClose` still calls `setMode('existing')` via `onValueChange` or by resetting `Tabs.Root value`.

**Priority: first** — cleanest migration, least risk.

### D2: ManagePluginsDialog — use `Tabs.Content` for panel switching

Same pattern as D1. Two static panels (`InstalledPluginList` / `MarketplaceSection`). Map `activeTab` to `Tabs.Root value`. The inline `style={{ height: '400px' }}` on the content wrapper moves to the `Tabs.Content` or a shared wrapper.

### D3: SpecModal — `Tabs.Root` + `Tabs.List` only, no `Tabs.Content`

SpecModal fetches content on tab change — there are no static panels to wrap in `Tabs.Content`. Use Radix only for the tab strip:

```
<Tabs.Root value={active} onValueChange={setActive}>
  <Tabs.List>
    {tabs.map(t => <Tabs.Trigger key={t} value={t}>{label}</Tabs.Trigger>)}
  </Tabs.List>
</Tabs.Root>
{/* content rendered separately, driven by `active` state */}
```

This still gains keyboard nav and ARIA, without forcing content into `Tabs.Content`.

### D4: Tab trigger styling

Both `TabButton` and `ManagePluginsDialog`'s inline buttons use the same visual pattern: `border-b-2` active indicator with `border-accent text-text` active / `border-transparent text-text-muted` inactive. Apply these classes directly to `Tabs.Trigger` via `data-[state=active]:` Radix data attributes:

```
className={cn(
  'px-3 py-1.5 text-xs -mb-px border-b-2 border-transparent text-text-muted',
  'data-[state=active]:border-accent data-[state=active]:text-text',
  'hover:text-text',
)}
```

This eliminates the need for an `active` prop — Radix sets `data-state="active"` automatically.

### D5: Delete TabButton after migration

`TabButton` has two consumers: `CreateWorktreeDialog` and `SpecModal`. After both migrate, delete `worktree-dialog/TabButton.tsx`. The `render-with-workspace.tsx` test helper also imports it — update or remove that import.

## Risks / Trade-offs

- **[Form nesting in CreateWorktreeDialog]** → The dialog wraps content in a `<form>`. Radix `Tabs.Root` renders a `<div>`, which nests fine inside `<form>`. No issue.
- **[ManagePluginsDialog badge styling]** → The "Plugins (3)" count badge inside tab triggers needs to stay as a child of `Tabs.Trigger`. Radix allows arbitrary children in triggers. No issue.
- **[SpecModal single-tab case]** → When `kind === 'spec'`, only one tab exists and the tablist is hidden. With Radix, still render `Tabs.Root` with a single trigger but hide the list with the same `tabs.length > 1` guard. No behavior change.
