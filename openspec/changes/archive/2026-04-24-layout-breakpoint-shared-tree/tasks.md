## Tasks

### 1. Baseline & safety nets
- [ ] Screenshot the current 3 breakpoints (desktop / tablet / mobile) for visual regression reference.
- [ ] Run the full client suite and record the green baseline (1578+ tests).

### 2. Strategy spike (before touching the real tree)
- [ ] Build a minimal `ResponsivePanel` POC that uses `react-resizable-panels` + Tailwind `lg:` modifiers so the same element is docked on lg and slides in as a drawer below lg. Confirm focus-trap / Esc / click-outside work in drawer mode.
- [ ] Decide whether `react-resizable-panels` can host drawer-mode reasonably, OR whether we keep Panel only on `lg:` widths and use a sibling `fixed` drawer element hidden at `lg:` — both are acceptable; pick the one with fewer edge cases.

### 3. Unify sidebar (TDD)
- [ ] Test: resizing from 1023→1025 does not remount the sidebar's project list (spy on a sub-component's mount count).
- [ ] Refactor sidebar to a single element using Tailwind responsive classes. Drop `NonDesktopLayout`'s sidebar branch.

### 4. Unify right pane (TDD)
- [ ] Test: resizing across breakpoints does not remount `<RightPane>` (when visible).
- [ ] Refactor right pane drawer vs docked to responsive CSS. Collapse `rightDrawerOpen` + `rightPanelRef` into one open/collapsed state.

### 5. Unify chat / main column (TDD)
- [ ] Test: chat compose-box draft survives a viewport resize across 1024.
- [ ] Ensure `<TabContainer>` and `<ChatPanel>` share one tree; the topbar / bottom-nav changes are CSS-only.

### 6. Delete the dead branch
- [ ] Remove `NonDesktopLayout` (now unused).
- [ ] `useBreakpoint()` kept, but grep-verify no JSX ternaries branch on it for rendering.

### 7. Verification
- [ ] Screenshot diff against step-1 baseline at all three breakpoints — pixel-identical (or intentional adjustments documented).
- [ ] `openspec validate layout-breakpoint-shared-tree --strict`.
- [ ] Full client suite green.
