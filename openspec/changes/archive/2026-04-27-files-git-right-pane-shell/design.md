## Context

After `remove-activity-bar` landed, the workspace shell is:

```
Topbar: [☰?] TopScopeSwitcher ············ [⚙]
├─ Sidebar 260 (fixed) ─ TabContainer (flex-1) ─┤
```

- `☰` only appears on tablet/mobile, where it opens the sidebar overlay drawer.
- On desktop, sidebar is always visible at 260px; no toggle.
- No right-side column exists.

F.html's prototype is three-column with Files/Git/Spec on the right, scoped to the active worktree. This change introduces that third column as an empty shell — tab strip only, bodies are placeholders.

We also take the opportunity to make **both** columns resizable + collapsible on desktop, since the act of introducing a `PanelGroup` makes this nearly free and the narrow-desktop squeeze (1024–1279px) forces some form of user control anyway.

## Goals / Non-Goals

**Goals:**
- Third column ships as an empty but real container with visible Files/Git/Spec tab strip.
- Both left and right columns on desktop are resizable + collapsible; state persists across reloads.
- Symmetric topbar triggers: left `☰` for sidebar, right `▭` for right-pane. On desktop they collapse; on tablet/mobile they open drawers.
- `useActiveCwd()` hook exists and is tested, ready for `files-pane-v1` / `git-pane-readonly` to consume.
- All existing RWD semantics preserved (tablet/mobile drawers, backdrop close, Esc, etc.).
- Existing `WorkspaceLayoutRWD.test.tsx` scenarios continue to pass (with minor updates where behavior changed).

**Non-Goals:**
- Files / Git / Spec tab **content** — placeholder bodies only.
- File watching / real-time updates.
- Per-pane chevron buttons (topbar triggers + drag-to-collapse is enough).
- Animated collapse (library handles reasonable transitions; no custom work).
- Vertical split / bottom panel layout.
- Zustand store for pane sizes — `PanelGroup autoSaveId` handles localStorage natively.

## Decisions

### 1. Which resizable library

**Decision:** Add `react-resizable-panels` as a production dep.

Alternatives considered:
- **Build our own drag handle** — deceptively hard. Handling touch, pointer capture, min/max bounds, collapse snapping, SSR-safe measurements, keyboard-accessible resize (Home/End, arrow keys), and focus management is ~300 lines plus a11y traps. Not worth rolling for two handles.
- **`allotment`, `re-resizable`** — less-maintained / less-idiomatic for React 19. `react-resizable-panels` is actively maintained, React 19 compatible, used by shadcn and many production React stacks.

We already have `test/setup.ts` with a `vi.mock('react-resizable-panels', ...)` stub. It's a dead stub today (no consumer), but a harmless one — when this change lands, the stub becomes useful and the prod dep becomes real. The mock strips real drag behavior from tests, which is what we want (tests assert structure and wiring; drag math is library territory).

### 2. Persistence — library-native, not zustand

**Decision:** Use `PanelGroup`'s `autoSaveId="cc-office.workspace-panels"`.

This serializes each panel's size + collapsed state to `localStorage` automatically. Reasons not to route through our zustand `persistStorage` helper:

- The layout state is pure UI presentation with zero consumers outside the layout. No need to expose it as app state.
- The library's format is opinionated and self-contained. Trying to shoehorn it into our `memoryPersist` abstraction adds friction without benefit.
- Tests already swap the real lib for a stub (setup.ts), so the test-mode DI we set up for zustand doesn't apply here — the lib never touches localStorage in tests.

Minor trade-off: one more localStorage key outside our test-controlled `memoryBackend`. Acceptable because tests never exercise real drag/collapse.

### 3. Topbar trigger behavior — dual role by breakpoint

The same `☰` button does **different things at different widths**:

| Breakpoint | Click `☰` (left) | Click `▭` (right) |
|---|---|---|
| Desktop ≥1024 | Toggle Sidebar collapse via Panel API | Toggle RightPane collapse via Panel API |
| Tablet/Mobile | Open Sidebar drawer (existing) | Open RightPane drawer (new) |

Why not two separate icons per breakpoint? Because the **semantic action is identical** — "toggle the visibility of the left/right pane". The implementation mechanism (Panel collapse vs overlay drawer) is an internal detail.

Implementation: `WorkspaceTopbar` accepts callbacks `onToggleLeft` / `onToggleRight`; `WorkspaceLayout` wires the right behavior per breakpoint. Icons don't change across breakpoints.

We can't simply swap the existing `onOpenMenu` prop — it's currently only passed on non-desktop. The cleanest migration is to:
- Rename `onOpenMenu` → `onToggleLeft` (always passed on desktop AND tablet/mobile; caller decides what that means).
- Add `onToggleRight` symmetric to it.

### 4. Collapse semantics — "drag to collapse" + topbar toggle

`react-resizable-panels` supports `collapsible: true` with `collapsedSize={0}`. The library auto-collapses when the user drags below a threshold. We combine with topbar toggles so new users discover the collapse affordance without learning drag tricks.

**imperative collapse API**: each Panel has a ref exposing `panel.collapse()` / `panel.expand()` / `panel.isCollapsed()`. `WorkspaceLayout` holds refs; topbar callbacks call the appropriate method. No state-up-top needed — library owns the state.

### 5. Drawer vs Panel mount — not both at once

**Decision:** On tablet/mobile, the `PanelGroup` is not mounted; only the chat area + drawers render. On desktop, drawers don't exist; only `PanelGroup` renders.

```tsx
{isDesktop ? (
  <PanelGroup ...>
    <Panel>Sidebar</Panel>
    <Handle/>
    <Panel>Chat</Panel>
    <Handle/>
    <Panel>RightPane</Panel>
  </PanelGroup>
) : (
  <>
    <Chat/>
    {leftDrawerOpen && <SidebarDrawer/>}
    {rightDrawerOpen && <RightPaneDrawer/>}
  </>
)}
```

This avoids complex conditional-collapse-state-preservation across breakpoint changes (rare in practice — nobody resizes window across 1024 while using the app). The simpler "remount on breakpoint change" behavior is fine; `autoSaveId` restores sizes when desktop re-enters.

### 6. `useActiveCwd` placement — `src/hooks/`

**Decision:** new file `apps/web/src/hooks/useActiveCwd.ts`.

Implementation is one-liner:
```ts
export function useActiveCwd(): string | null {
  const { activeProjectCwd } = useProjectState();
  const { activeTabId, tabs } = useTabState();
  const activeTab = activeTabId ? tabs[activeTabId] : null;
  return activeTab?.cwd ?? activeProjectCwd;
}
```

Unit-testable with `renderHook` + wrapped providers. Future Files/Git pane code imports this and **never** touches TabContext/ProjectContext directly, keeping the data-flow contract crisp.

### 7. Tab strip inside RightPane — reuse existing `TabButton`

We already have a `TabButton` component in `components/worktree-dialog/` used by the `CreateWorktreeDialog`'s Existing/New tabs. Reuse it. Move it to a more general location (`components/ui/TabButton.tsx`) if its current placement no longer makes sense after reuse. Otherwise import-across-subdir is fine.

### 8. Test mock — keep existing stub, verify structure not drag

`test/setup.ts`'s `vi.mock('react-resizable-panels', ...)` stubs `Group`, `Panel`, `Separator` into plain divs with a `data-testid`. This change keeps that mock exactly as-is. Tests assert:

- `<RightPane>` renders the Files/Git/Spec tab strip.
- Topbar's two triggers call the right callbacks when clicked.
- On tablet/mobile, clicking `☰` / `▭` opens the correct drawer.
- On desktop, clicking a trigger invokes a `onToggleLeft` / `onToggleRight` handler (wiring only; the real collapse is a library concern).
- `useActiveCwd` returns `activeTab?.cwd ?? activeProject?.cwd` for representative fixtures.

We do **not** test: actual drag resizing, width percentages, localStorage serialization, or animation — all library-owned.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Users don't notice desktop collapse is possible | Topbar triggers make it discoverable. Drag handles are visible thin dividers (library default). |
| Persisted widths break layout after a major layout change | `autoSaveId` is versioned in the key; bumping `"cc-office.workspace-panels"` → `"...-v2"` in a future change forces clean defaults. |
| Library mismatch with React 19 | `react-resizable-panels` ≥2.x is React 19 compatible (confirmed in their changelog). We pin to a specific ≥2 version. |
| Test mock drifts from library API | Mock is tiny (3 exports). Library API is stable. If lib adds a new export and we start using it, add to mock. Low churn risk. |
| Existing mobile `Menu` button a11y label change | Keep `aria-label="Menu"` unchanged; only callback name changes internally (`onOpenMenu` → `onToggleLeft`). |
| Narrow desktop (1024–1279) still cramped on first run | Sidebar/RightPane default sizes chosen to leave chat ≥~500px at 1024: sidebar 18%, right 22%, chat 60% → 1024 * 0.60 = 614px. Users can tune and persist. |

## TDD Order

1. **Red:** write failing test for `useActiveCwd` (3 cases: no project, project only, project + active tab).
2. **Green:** implement hook.
3. **Red:** `RightPane.test.tsx` — tab strip renders Files/Git/Spec buttons, clicking each shows the corresponding placeholder.
4. **Green:** implement `<RightPane>`.
5. **Red:** update `WorkspaceTopbar.test.tsx` — two dual-role toggle buttons present; `onToggleLeft`/`onToggleRight` callbacks wire correctly.
6. **Green:** rename/add topbar props; update all call sites.
7. **Red:** update `WorkspaceLayoutRWD.test.tsx` — three-column on desktop, drawer scenarios on tablet/mobile for both sides, right drawer opens via right trigger.
8. **Green:** rewire `WorkspaceLayout` to use `PanelGroup` + RightPane + two drawer states.
9. **Refactor:** `test/setup.ts` mock — verify still works; trim if redundant.
10. **Ship:** all suites green; biome + tsc clean.
