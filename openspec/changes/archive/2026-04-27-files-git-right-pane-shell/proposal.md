## Why

F.html prototype's scope-aligned three-column layout ("Projects left · Chat middle · Files/Git/Spec right") is the target shape. We currently have two columns — Sidebar + TabContainer. To move toward the prototype we need the **outer container** for the right-side Files/Git/Spec tabs **before** we can fill those tabs with real content.

Keeping this change shell-only has two wins:

1. It's **independently mergeable** — no dependency on Files-pane or Git-pane content changes.
2. It forces us to settle the harder architectural questions (breakpoints, drawer mechanics, cwd source) once, in isolation, so subsequent content changes don't renegotiate them.

## What Changes

- Introduce **`<RightPane>`** component: a container on desktop (inside the resizable `PanelGroup`), or an overlay drawer on tablet/mobile. Hosts a Files/Git/Spec tab strip. Each tab's body is a placeholder ("coming soon") in this change.
- Modify **`WorkspaceLayout`** to wrap desktop columns in a `PanelGroup` with two `PanelResizeHandle`s: `[Sidebar | chat | RightPane]`. Sidebar becomes resizable + collapsible on desktop (previously fixed 260px). RightPane added as the third Panel.
- Add **`react-resizable-panels`** dependency (~10 KB). Its built-in `autoSaveId` handles width + collapsed-state persistence via localStorage — no zustand store required.
- Extend **`WorkspaceTopbar`**: left `☰` trigger is now shown on desktop too (toggles Sidebar collapse); add a symmetric right-side trigger (`▭` or equivalent) that on desktop toggles RightPane collapse and on tablet/mobile opens the drawer. `IconButton` reuse continues.
- Add **`useActiveCwd()`** hook: `activeTab?.cwd ?? activeProject?.cwd`. This is the **single hook** right-pane content will depend on in later changes; establishing it now keeps the data-flow decision frozen.
- RWD tests updated to cover the new three-column structure, resize-handle presence, collapse toggles from topbar, and the tablet/mobile right drawer. The existing `WorkspaceLayoutRWD.test.tsx` drawer scenarios are mirrored on the right side.

**Breakpoint decision (locked):** single `desktop ≥1024px` threshold. No additional `wide=1280` breakpoint — narrow-desktop squeeze is handled by the user via resize/collapse, whose state is persisted.

**Test-time behavior:** `test/setup.ts` already stubs `react-resizable-panels` (carried over from a previous exploration); this change starts actually using the library, so the mock becomes real coverage. Unit tests assert structure + handler wiring, not real drag math.

Explicitly out of scope:
- What's **inside** Files / Git / Spec tab bodies (those are `files-pane-v1`, `git-pane-readonly`, a future spec-pane change).
- File-watch / real-time updates (`fs-git-watch-service`).
- Per-pane header chevron collapse buttons (topbar triggers + drag-to-collapse are sufficient for v1).

## Capabilities

### New Capabilities
- `workspace-right-pane`: the outer right-column container that hosts scope-aligned worktree-level tabs (Files / Git / Spec). Breakpoint rules, tab-strip composition, drawer mechanics, and the `useActiveCwd` contract live here.

### Modified Capabilities
- `layout-shell`: desktop structure becomes three columns wrapped in a resizable `PanelGroup`; Sidebar becomes resizable + collapsible (previously fixed 260px); tablet/mobile gain a right-side drawer mirroring the existing left-side drawer pattern.
- `workspace-topbar`: the `☰` trigger is now shown on desktop too (toggles Sidebar collapse instead of opening a drawer); a symmetric right-side trigger is added with the same dual role (collapse on desktop / drawer on non-desktop).

## Impact

**Affected code:**
- `apps/web/package.json` — add `react-resizable-panels` dep.
- `apps/web/src/components/WorkspaceLayout.tsx` — wrap desktop columns in `PanelGroup`; new right-drawer state; renders `<RightPane>`.
- `apps/web/src/components/WorkspaceTopbar.tsx` — both left and right triggers now dual-role (collapse on desktop, drawer on non-desktop); add `onOpenRightPane?` prop and make existing `onOpenMenu` unconditional across breakpoints.
- `apps/web/src/components/RightPane.tsx` (new) — container + Files/Git/Spec tab strip + placeholder bodies.
- `apps/web/src/hooks/useActiveCwd.ts` (new) — the composed-cwd hook.
- Tests: `WorkspaceLayoutRWD.test.tsx` extended; new `RightPane.test.tsx` + `useActiveCwd.test.ts`.

**No server-side impact.** No API / DB / socket-event changes — this is shell only.

**Risk:** low.
- New dep `react-resizable-panels` — small, well-maintained, used by many React UIs; existing `test/setup.ts` already mocks it.
- Sidebar's width changes from fixed 260px to persisted user preference — first-run users see a 260px default, returning users see their last width (localStorage). Graceful for both.
- Topbar now has two side triggers — we keep `IconButton` conventions and matching `aria-label`s to stay a11y-clean.
