## 1. TDD — extract WorkspaceTopbar + wire Settings + tablet hamburger

- [x] 1.1 Create `packages/client/src/components/__tests__/WorkspaceTopbar.test.tsx` — write failing tests for:
  - renders Settings button with `aria-label="Settings"`, positioned such that it is preceded by `TopScopeSwitcher` and by hamburger (when passed)
  - click on Settings invokes the `onOpenSettings` callback
  - when `onOpenMenu` prop is provided, a hamburger button with `aria-label="Menu"` renders at the left
  - when `onOpenMenu` is NOT provided, no hamburger renders
  - preserves `data-testid="desktop-topbar"` or `"mobile-topbar"` based on prop
- [x] 1.2 Run tests — confirm red.
- [x] 1.3 Create `packages/client/src/components/WorkspaceTopbar.tsx` matching the contract in `specs/workspace-topbar/spec.md`. Should accept `{ testId, onOpenSettings, onOpenMenu?, children }` (children = the existing `TopScopeSwitcher`).
- [x] 1.4 Run tests — confirm green.

## 2. TDD — rewire WorkspaceLayout to use the new topbar

- [x] 2.1 Update `packages/client/src/components/__tests__/WorkspaceLayoutRWD.test.tsx`:
  - **Remove** assertions that expect an `ActivityBar` in the DOM (all 3 breakpoints).
  - **Add** assertions: at each breakpoint the Settings button is reachable via `aria-label="Settings"` and clicking it opens `SettingsDialog`.
  - **Add** tablet-specific assertion: clicking the topbar hamburger opens the sidebar drawer (same drawer the ActivityBar used to open).
- [x] 2.2 Run tests — confirm the Settings and hamburger assertions are red (ActivityBar assertions should now be removed, not failing).
- [x] 2.3 Edit `WorkspaceLayout.tsx`:
  - Delete `<ActivityBar>` render block and `SIDEBAR_ITEMS` constant.
  - Replace inline topbar JSX with `<WorkspaceTopbar testId={isMobile ? 'mobile-topbar' : 'desktop-topbar'} onOpenSettings={…} onOpenMenu={isDesktop ? undefined : () => setDrawerOpen(true)}><TopScopeSwitcher … /></WorkspaceTopbar>`.
  - Simplify: drop `activePanel` state and `handleActivityBarToggle`; compute `sidebarVisible = isDesktop || drawerOpen`.
- [x] 2.4 Run tests — confirm green.

## 3. Delete ActivityBar

- [x] 3.1 Confirm no remaining consumers: `grep -rn "ActivityBar" packages/client/src --include='*.ts' --include='*.tsx'` should show only the files we're about to delete.
- [x] 3.2 Delete `packages/client/src/components/ActivityBar.tsx`.
- [x] 3.3 Delete `packages/client/src/components/ActivityBar.stories.tsx`.
- [x] 3.4 Delete `packages/client/src/components/__tests__/ActivityBar.test.tsx`.
- [x] 3.5 Run full client suite — confirm green.

## 4. Verify no regressions

- [x] 4.1 `pnpm --filter @code-quest/client exec tsc --noEmit` clean.
- [x] 4.2 `pnpm --filter @code-quest/client exec vitest run` — all tests pass (1476/1476).
- [x] 4.3 `pnpm --filter @code-quest/client exec biome check src/components/WorkspaceTopbar.tsx src/components/WorkspaceLayout.tsx` — no findings.
- [~] 4.4 (deferred, manual QA) Visual smoke: start dev server, verify desktop/tablet/mobile breakpoints each render the topbar correctly and Settings dialog opens from the cog.

## 5. Finalize

- [x] 5.1 Committed as `b6f91502 refactor(layout): remove ActivityBar; move Settings to workspace topbar right`.
- [ ] 5.2 Ready to `/opsx:archive` once merged.
