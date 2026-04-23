## Context

Current shell (`WorkspaceLayout.tsx`) renders three horizontal bands:

```
┌───────────────────────────────────────────────────────┐
│ Topbar (h-9 desktop / h-11 mobile): TopScopeSwitcher  │
├────┬──────────────────────────────────────────────────┤
│ A  │                                                  │
│ c  │                                                  │
│ t  │        Sidebar (260px, shown when               │
│ i  │        activePanel !== null)                     │
│ v  │                                                  │
│ 40 │                                                  │
│    │            TabContainer (flex-1)                 │
│ ⚙  │                                                  │
└────┴──────────────────────────────────────────────────┘
```

`ActivityBar` exposes exactly one panel (`SIDEBAR_ITEMS` in `WorkspaceLayout.tsx:17` has length 1: Projects) plus a bottom Settings cog. On mobile it's hidden entirely and a topbar hamburger opens the sidebar drawer. Tablet keeps the ActivityBar visible.

After this change:

```
┌───────────────────────────────────────────────────────┐
│ Topbar: [☰?] TopScopeSwitcher ··············· [⚙]   │
├──────────┬────────────────────────────────────────────┤
│ Sidebar  │                                            │
│  (260)   │      TabContainer (flex-1)                 │
│          │                                            │
└──────────┴────────────────────────────────────────────┘
```

- Desktop: Sidebar always visible; no toggle needed.
- Tablet: Sidebar hidden by default, `[☰]` in topbar opens the same overlay drawer that exists today.
- Mobile: unchanged layout-wise; `[☰]` already present. Settings gains a home in the mobile topbar.

## Goals / Non-Goals

**Goals:**
- Remove one layer of UI indirection (the 40 px activity strip).
- Give Settings a globally-visible home (topbar right) independent of any panel.
- Keep all existing keyboard / testing affordances working; no regression in mobile drawer.
- Preserve test coverage — migrate, don't delete, meaningful assertions.
- Keep Desktop / Tablet / Mobile RWD tests green.

**Non-Goals:**
- Redesigning the Sidebar contents (Projects tree) — out of scope.
- Adding a new Sidebar collapse affordance on desktop (sidebar becomes always-on; hiding it later is a separate change if wanted).
- Touching the **per-session** `HeaderBar` component (the one inside a chat tab) — that's a different bar; we only change the **workspace topbar**.
- Any visual redesign beyond the structural move.
- **Matching F.html's full topbar** — the prototype's topbar additionally hosts a brand mark (`✦ cc-office`), live-session pills, terminal toggle, permission shield, onboarding, search, notifications, and moves `TopScopeSwitcher` out of the topbar into the sidebar. Those are separate follow-up changes. This change only does: (a) remove ActivityBar, (b) put Settings ⚙ at the topbar's rightmost slot — which aligns with F.html's ordering even though we don't add the other F-topbar actions yet.

## Decisions

### 1. Remove vs. hide ActivityBar
**Decision:** Remove (delete file, tests, story). No consumers besides `WorkspaceLayout`; keeping it around as dead code costs maintenance with no upside.

### 2. Where Settings lives in the topbar
**Decision:** Right-most slot of the existing `desktop-topbar` / `mobile-topbar` rows, with `ml-auto` or a flex spacer pushing it right. Same `<SettingsDialog>` open mechanism; only the trigger location changes.

Rationale:
- Matches F.html's "global actions live in the top strip, Settings ⚙ is the rightmost item" convention (verified against `shared.js:147–166`).
- Keeps the dialog and its state (`settingsOpen`) exactly as-is; only the button that calls `setSettingsOpen(true)` moves.
- Future F-aligned topbar actions (terminal, permission, notifications…) will slot in **to the left** of Settings, so Settings' final resting place is already correct.

### 3. Sidebar toggle on tablet
**Decision:** Tablet keeps the overlay-drawer behavior. The trigger moves from ActivityBar's Projects icon to a hamburger (`☰`) in the desktop-topbar, shown only at `tablet` breakpoint (not desktop, not mobile — mobile already has its own hamburger in `mobile-topbar`).

Why not just always show the hamburger on non-desktop? Mobile already has one; having two separate topbars (`desktop-topbar` vs `mobile-topbar`) is existing code, we just add the hamburger conditionally to the shared desktop-topbar path.

### 4. Simplify `activePanel` state
**Decision:** Drop `activePanel` state entirely on desktop (sidebar is always visible → no panel concept). Keep `drawerOpen` state for tablet/mobile overlay.

Impact: `sidebarVisible = isDesktop ? true : drawerOpen`.

### 5. Component composition of the new topbar
**Decision:** Introduce a small `<WorkspaceTopbar>` component that takes `{ onOpenSettings, onOpenMenu?, children }` so tests can render it in isolation and don't need a full workspace env. The two existing test IDs (`desktop-topbar` / `mobile-topbar`) are preserved as internal `data-testid` on the root `<div>` that `WorkspaceTopbar` renders, keeping existing tests working.

Rationale: currently the topbar JSX is inlined twice in `WorkspaceLayout`. Extracting is justified because (a) it now carries more affordances (hamburger + settings) and (b) it gains its own unit tests for the Settings-in-topbar requirement.

### 6. TDD order
1. **Red**: Add test to `WorkspaceLayoutRWD.test.tsx` asserting Settings button is reachable in the topbar at all three breakpoints; remove/update assertions that check for ActivityBar render.
2. **Red**: Unit tests for new `WorkspaceTopbar` (settings click, hamburger click on tablet, no hamburger on desktop).
3. **Green**: Extract `<WorkspaceTopbar>`, wire Settings cog, rewire drawer toggle.
4. **Red → green**: Delete `ActivityBar` + its tests + story only after the new path is green.
5. **Refactor**: Collapse `activePanel` state now that it's dead.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Hidden consumers of `ActivityBar` (e.g. in docs, stories beyond the main one) | `grep -rn "ActivityBar"` before delete; update or remove any reference. |
| Tablet users who learned to click the Projects icon to open sidebar | Replaced with `☰` in same spatial area; aria-label kept as "Menu"/"Projects" so screen readers stay sensible. |
| Settings discoverability | Cog icon top-right is a well-known convention (Gmail, GitHub, VS Code's own settings). Acceptable. |
| Spec drift — two affected specs | Both get delta edits in specs phase; `openspec sync` after archive keeps base specs coherent. |
| Layout regression on tablet | RWD test file already covers tablet scenarios; update the specific ActivityBar assertions, keep the drawer open/close assertions. |

**Trade-off accepted:** Desktop users lose the ability to hide the sidebar. This is acceptable because (a) current ActivityBar toggle is basically never used (there's only one panel, so no reason to switch), and (b) adding a collapse affordance later is cheap — a chevron button in the sidebar header — and can be a follow-up if demand surfaces.
