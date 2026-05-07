## Why

The left-side **ActivityBar** (40px strip) currently hosts exactly **one** panel button (Projects) plus a Settings cog at the bottom. A whole vertical strip dedicated to one toggle is:

- **Wasteful of horizontal space** (40 px × viewport height) given it only represents a single panel concept.
- **Inconsistent with the F.html prototype**, which treats the left column as the sidebar itself rather than a bar-plus-sidebar.
- **A redundant layer of indirection** — users click ActivityBar → Sidebar opens → click again to close. The Sidebar could just be always-on (desktop) with a collapse affordance.

Settings is a global action (not project- or session-scoped), so its natural home is the top-right of the **TopBar** (next to other global affordances like future profile/help), not buried at the bottom of a vertical strip.

## What Changes

- **Remove `ActivityBar` component** and its usage from `WorkspaceLayout`.
- **Sidebar becomes always-visible on desktop** (no toggle needed since there's only one panel). On tablet the existing overlay-drawer pattern stays, but the trigger moves from ActivityBar to a hamburger button in the desktop-topbar (consistent with mobile).
- **Settings button moves to TopBar right-side** — the strip currently rendered by `WorkspaceLayout` (`data-testid="desktop-topbar"` / `"mobile-topbar"`). Opens the same `SettingsDialog`.
- **Mobile unchanged** — it already uses a hamburger in the topbar; Settings there was only in ActivityBar (hidden on mobile) so mobile gains access to Settings via topbar for the first time.

Visual: TopBar becomes `[hamburger? | TopScopeSwitcher | ────── | Settings cog]`.

## Capabilities

### New Capabilities
- `workspace-topbar`: the outer topbar that wraps the workspace (not the per-session `HeaderBar`). Previously untracked — its contents were inlined inside `WorkspaceLayout`. This change extracts the topbar, preserves its existing contents, and formalises the Settings-right + tablet-hamburger additions as explicit scenarios.

### Modified Capabilities
- `layout-shell`: removes the "ActivityBar (40px) + Sidebar" two-layer structure; sidebar becomes direct and always-visible on desktop. Tablet overlay-drawer trigger relocates to the topbar.

## Impact

**Affected code:**
- `apps/web/src/components/WorkspaceLayout.tsx` — drop `<ActivityBar>` render, drop `activePanel` state (or simplify), add Settings button to topbar, add tablet hamburger to topbar.
- `apps/web/src/components/ActivityBar.tsx` + `.stories.tsx` + `__tests__/ActivityBar.test.tsx` — **delete** (no other consumers).
- `apps/web/src/components/__tests__/WorkspaceLayoutRWD.test.tsx` — update assertions that currently verify ActivityBar presence.
- `openspec/specs/layout-shell/spec.md` — rewrite the Desktop/Tablet sections.
- `openspec/specs/workspace-topbar/spec.md` — **new** capability spec (the outer workspace topbar was previously untracked; this change formalises it).

**No server-side impact.**
**No storage / DB impact.**
**No breaking API changes** — purely an internal UI restructure.

**Risk:** low. ActivityBar has a single use site; Settings already has a working dialog; the panel concept had only one item so removing the toggle is a simplification, not a feature loss.
