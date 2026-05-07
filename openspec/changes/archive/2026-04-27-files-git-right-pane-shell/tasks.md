## 1. Dependency + test mock sanity

- [x] 1.1 Add `react-resizable-panels` to `apps/web/package.json` dependencies (latest 2.x compatible with React 19).
- [x] 1.2 `pnpm install` (or equivalent).
- [x] 1.3 Verify `test/setup.ts`'s existing `vi.mock('react-resizable-panels', ...)` stub still compiles against the installed version's TS types. If any new exports are needed, add to the mock.

## 2. TDD — useActiveCwd hook

- [x] 2.1 Red: new file `apps/web/src/hooks/__tests__/useActiveCwd.test.ts` with failing cases:
  - returns `null` when no project active
  - returns `activeProjectCwd` when project active but no active tab
  - returns `activeTab.cwd` when both project and active tab exist
- [x] 2.2 Green: create `apps/web/src/hooks/useActiveCwd.ts` implementing `activeTab?.cwd ?? activeProjectCwd ?? null`.
- [x] 2.3 Run hook tests — confirm green.

## 3. TDD — RightPane component

- [x] 3.1 Red: new file `apps/web/src/components/__tests__/RightPane.test.tsx`:
  - renders three tab buttons with accessible names: Files, Git, Spec
  - Files tab active by default (aria-selected or data-active)
  - clicking a tab updates which placeholder body is visible
  - placeholder body text contains "coming soon" (or a stable sentinel)
  - passes `cwd` prop down to a child slot (assert presence of a `data-cwd` attr or similar testable surface)
- [x] 3.2 Green: create `apps/web/src/components/RightPane.tsx`:
  - props: `{ cwd: string | null }`
  - internal useState for active tab
  - reuse `TabButton` from `components/worktree-dialog/TabButton.tsx` (or move it to `components/ui/TabButton.tsx` if reuse makes it clearly shared — decide by touching exactly 1 other file otherwise leave in place)
- [x] 3.3 Run RightPane tests — confirm green.

## 4. TDD — WorkspaceTopbar dual-role triggers

- [x] 4.1 Red: update `apps/web/src/components/__tests__/WorkspaceTopbar.test.tsx`:
  - rename `onOpenMenu` call-sites in existing tests → `onToggleLeft`
  - add a `onToggleRight` prop; new test: right trigger renders when provided; click invokes `onToggleRight`.
  - assert both triggers render on desktop mode (previously gated behind `onOpenMenu`-only-on-non-desktop)
  - order assertion: leftTrigger → children → rightTrigger → Settings
- [x] 4.2 Green: update `WorkspaceTopbar.tsx`:
  - rename prop `onOpenMenu` → `onToggleLeft`
  - add `onToggleRight?: () => void`
  - render right trigger with `aria-label="Toggle right pane"` (or refined copy after a11y review) immediately left of Settings
  - both triggers render on all breakpoints when their callback is provided
- [x] 4.3 Run topbar tests — confirm green.

## 5. TDD — WorkspaceLayout PanelGroup + right drawer

- [x] 5.1 Red: update `apps/web/src/components/__tests__/WorkspaceLayoutRWD.test.tsx`:
  - Desktop: `data-testid="panel-group"` (from existing mock) renders; `RightPane` renders; topbar has both `Toggle sidebar` + `Toggle right pane` buttons.
  - Desktop clicking left trigger: invokes collapse on sidebar panel — assert via a spy on a `leftPanelRef.current?.collapse` equivalent, or via observable DOM state if mock exposes it.
  - Tablet: clicking right trigger opens a new `right-drawer-panel` testid; backdrop closes it; Esc closes it.
  - Mobile: same as tablet for right drawer; existing mobile Menu flow unchanged.
  - Assert backward-compat: all previously green sidebar-drawer scenarios still pass.
- [x] 5.2 Green: edit `WorkspaceLayout.tsx`:
  - on desktop, render a `<PanelGroup direction="horizontal" autoSaveId="cc-office.workspace-panels">` with three `<Panel>` children and two `<PanelResizeHandle>`s
  - hold `leftPanelRef` + `rightPanelRef`; wire topbar callbacks to `.collapse()`/`.expand()` toggles
  - on non-desktop, render chat full-width + two overlay drawers (existing left + new right)
  - drop the `sidebarVisible` computation; use `leftDrawerOpen` / `rightDrawerOpen` states for non-desktop
- [x] 5.3 Run RWD tests — confirm green; run full client suite to catch regressions.

## 6. Verify

- [x] 6.1 `pnpm --filter @code-quest/client exec tsc --noEmit` clean.
- [x] 6.2 `pnpm --filter @code-quest/client exec vitest run` — all tests pass.
- [x] 6.3 `biome check --write` on touched files — no findings.
- [ ] 6.4 Manual smoke: start dev server; verify desktop three-column layout, drag left + right handles, topbar toggles collapse both sides, tablet/mobile right drawer opens and closes.

## 7. Finalize

- [x] 7.1 Committed as 90f38641: `feat(layout): add right pane shell + resizable/collapsible sidebar + right-pane triggers`.
- [ ] 7.2 Ready to `/opsx:archive files-git-right-pane-shell` once merged.
