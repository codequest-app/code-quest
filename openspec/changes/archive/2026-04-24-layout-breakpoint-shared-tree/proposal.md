## Why

`WorkspaceLayout.tsx` picks the layout implementation based on a JS-side breakpoint:

```tsx
{isDesktop ? (
  <DesktopLayout ... />     // react-resizable-panels (PanelGroup)
) : (
  <NonDesktopLayout ... />  // drawer-based
)}
```

Whenever `useMediaQuery('(min-width: 1024px)')` flips, React **unmounts one component tree and mounts the other**. Everything below the switch point loses its state:

- Open chat tab (the session is still running but the React state re-initialises)
- Compose draft text
- File-tree expansion (compounded by the tab-keep-alive issue — see `right-pane-tab-keep-alive`)
- Scroll positions (chat, files, terminal)
- Resize-panel widths (desktop) / drawer open state (non-desktop) — these at least have `autoSaveId`/localStorage as a parachute
- Every open dialog / popover

This is the fundamental root cause of many "why did my UI just reset?" bugs when the window is resized across 768 px / 1024 px.

## What Changes

- **Single component tree, responsive via CSS**. Delete the `isDesktop ? Desktop : NonDesktop` branch. Render one tree that adapts via Tailwind responsive modifiers (`md:`, `lg:`) and `@container` queries. Concretely:
  - The sidebar is always a `<Panel>` on `lg:` widths (docked + resizable) and a drawer (`fixed inset-y-0 left-0 w-[min(85vw,320px)]`) on smaller widths, using the same element with responsive classes + a single `aria-hidden` prop bound to drawer state.
  - Same transformation for the right pane (`RightPane`): always rendered, but position changes (docked `<Panel>` vs slide-over drawer) via CSS.
  - The `PanelGroup` / `Panel` from `react-resizable-panels` stays — but on smaller widths the Panels are `collapsedSize={0}` + `defaultSize` conditional on a CSS variable, letting the library itself treat "drawer open" as "panel size = 85vw".
- **`useBreakpoint()` becomes advisory, not structural**. Components that need to *know* the breakpoint (e.g. topbar label) can still read it, but the layout itself does not branch on it.
- **Keyboard / focus**: Drawer-mode sidebar / right-pane traps focus when open and restores on close (already works in NonDesktopLayout — just preserve the behaviour in the unified tree).

Explicitly out of scope:
- Changing the visual design of either mode — pixel-identical output on each breakpoint.
- Moving `autoSaveId` state to server-side / cross-tab sync.
- Sub-breakpoint refinement beyond the existing 768 / 1024 thresholds.

## Capabilities

- **layout-shell**: a single responsive component tree replaces the two-tree `isDesktop` branch so that crossing viewport breakpoints preserves all in-page state.
