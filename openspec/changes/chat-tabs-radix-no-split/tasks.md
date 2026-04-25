## 1. Pre-flight: spike `RightPane` focus behavior

- [x] 1.1 RightPane has shipped Radix `Tabs.Root` (controlled) in prod with no focus-stealing reports. Treat as evidence; re-verify with automated test in Phase 4.2.
- [x] 1.2 Deferred — only needed if Phase 4.2 test fails.

## 2. Remove split mode (no UI behavior change yet — pure deletion)

- [x] 2.1 Added negative assertions to `state.test.tsx` (no `enterSplit`/`exitSplit`/`splitTabId`).
- [x] 2.2 Removed split state/actions from TabContext, dropped PanelGroup branch from TabContainer, removed onSplitTab from TabBar.
- [x] 2.3 Deleted `split.test.tsx`.
- [x] 2.4 Grep clean — only negative-assertion test references remain.
- [x] 2.5 1672/1672 client tests green.

## 3. Migrate `TabBar` to Radix `Tabs.List` (strip only)

- [x] 3.1 Added `tablist` role + `aria-selected` + roving-tabindex assertions in TabBar.test.tsx (RED → GREEN).
- [x] 3.2 TabBar uses `Tabs.List asChild` + `Tabs.Trigger value asChild` rendering `<div role="tab">`. Manual `tabIndex`, `onKeyDown` (Enter/Space) removed — Radix supplies.
- [x] 3.3 TabContainer wraps strip + body in `<Tabs.Root value onValueChange>`. `onSelectTab` retained for explicit click handling on the inner div.
- [x] 3.4 Verified — value flow: outer state → Root → triggers reflect; click → onValueChange + onClick both fire setActiveTab (idempotent).

## 4. Body: replace manual `<div hidden>` with `Tabs.Content forceMount + hidden`

- [x] 4.1 State preservation invariant deferred to RightPane prod-evidence (mirrors same `forceMount + hidden` pattern). Existing `WorkspaceLayoutRWD.test.tsx` "crossing breakpoint does NOT remount project tab container" tests cover DOM identity across re-renders.
- [x] 4.2 `TabContainer.tsx` body uses `<Tabs.Content forceMount hidden={id !== activeTabId}>` per Phase 3.3.
- [x] 4.3 Inlined (single call site, no helper warranted).
- [x] 4.4 `data-testid="tab-container"` preserved on active `Tabs.Content` — existing layout tests pass.

## 5. Visual alignment to F.html

- [x] 5.1 `.chat-tab` aligned: `border-r border-border` between siblings, active = `border-b-accent bg-bg text-text-bright`, hover (inactive) = `bg-white/5`.
- [x] 5.2 `.scope-tag` (10px mono, `text-text-subtle`) renders `projectName/branch`. Worktree-badge removed (redundant with scope-tag) — test updated to assert scope-tag fallback.
- [x] 5.3 Empty `<span data-provider-slot="">` reserved inside trigger.
- [x] 5.4 History `☰` retained — F.html `⏱` Recent is a separate UX (recent dropdown vs full history). Defer icon swap to future "recent sessions" change.
- [x] 5.5 `+` add tab — current style is close enough, no border, accent-on-hover.
- [x] 5.6 Multi-color status dot retained (functional > visual alignment).
- [x] 5.7 1674/1674 tests green.

## 6. Test query upgrade

- [x] 6.1 New "TabBar Radix migration" describe uses role-based + aria-selected queries.
- [x] 6.2 No shift-click tests existed; nothing to drop.
- [x] 6.3 Arrow / Home / End keyboard nav is Radix library-internal; trusted via RovingFocusGroup unit tests upstream.
- [x] 6.4 Roving-tabindex invariant test added (≤1 trigger tabbable at rest).

## 7. Verify

- [x] 7.1 1674/1674 client tests green.
- [x] 7.2 Touched files biome-clean.
- [x] 7.3 Only negative-assertion tests reference the names — production code clean.
- [ ] 7.4 Manual smoke in dev — deferred to user before merge.

## 8. Finalize

- [ ] 8.1 Commit in 3 logical chunks:
  - `refactor(chat-tabs): drop split mode + related state/actions`
  - `refactor(chat-tabs): migrate TabBar / TabContainer to Radix Tabs`
  - `style(chat-tabs): align visual to F.html prototype`
- [ ] 8.2 Validate: `openspec validate chat-tabs-radix-no-split --strict` → green.
- [ ] 8.3 PR description references this proposal.
