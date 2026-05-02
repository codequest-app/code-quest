## Why

The client has **seven** floating-UI surfaces, six of them hand-rolled with `position: fixed` + `getBoundingClientRect()`:

| Component | Kind | Trigger |
|---|---|---|
| `BranchPopover` | popover (filter + list) | GitPane "switch ⌄" click |
| `LiveSessionPopover` | popover | TopbarLiveSessions click |
| `WorktreeContextMenu` | dropdown + context | sidebar row ⋯ / right-click |
| `MessageActionsMenu` | dropdown | message ⋯ button |
| `ProjectContextMenu` | context menu | ProjectCard right-click |
| FileTree inline menu (in `FileTree.tsx`) | context menu | file row right-click |
| `PlanCommentPopover` | popover | already on `@floating-ui/react` |

All six hand-rolled surfaces clip at viewport edges (no flip / shift / collision padding), lack focus trap / Esc / click-outside consistency, and each reimplements portal + positioning differently. We already ship `@radix-ui/react-dialog`; Radix uses `@floating-ui/react` internally and provides the matching primitives.

Unifying on Radix gives one mental model across the app (`Root` / `Trigger` / `Portal` / `Content`), automatic collision-aware placement, and free a11y (menuitem role, typeahead, arrow-key nav).

## What Changes

- Add dependencies: `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-context-menu`.
- **Popover primitive** (`@radix-ui/react-popover`) — migrate:
  - `BranchPopover` — keep custom filter `<input>` + arrow-key nav inside `Popover.Content` (Radix Popover content is fully user-controlled).
  - `LiveSessionPopover`
  - `PlanCommentPopover` — migrate off `@floating-ui/react` direct usage for consistency (Radix uses floating-ui under the hood).
- **DropdownMenu primitive** (`@radix-ui/react-dropdown-menu`) — migrate:
  - `MessageActionsMenu`
  - `WorktreeContextMenu` ⋯ icon trigger path.
- **ContextMenu primitive** (`@radix-ui/react-context-menu`) — migrate right-click triggers:
  - `WorktreeContextMenu` right-click path (same items shared with DropdownMenu above via one `<MenuItems>` render prop).
  - `ProjectContextMenu`
  - `FileTree` inline context menu → extract into `FileTreeContextMenu.tsx`.
- Update trigger sites (`GitPane`, `TopbarLiveSessions`, `WorktreeRow`, `ProjectCard`, `FileTree`) to remove manual `getBoundingClientRect` coord capture; wire buttons as `<Trigger asChild>` or wrap rows in `<ContextMenu.Trigger>`.
- Preserve external visual design (border, bg, font-mono, colors).
- Preserve existing test semantics: `role="menu" | "menuitem"`, item text, callbacks (Radix emits these automatically).

Explicitly out of scope:
- Restyling.
- Adding new items or behaviors to any menu/popover.
- `@radix-ui/react-dialog` usages (`DiffModal`, `SpecModal`, etc. — already Radix).
- `EffortSwitch` (not a floating surface).

## Design Decisions

### Dual Root for rows with both right-click and ⋯ button

`ProjectCard` and `WorktreeRow` accept both right-click **and** a ⋯ icon button to open the same menu items. The implementation mounts **two independent Radix Roots per row** — one `ContextMenu.Root` wrapping the row, one `DropdownMenu.Root` around the ⋯ button — sharing a single `buildItems()` helper so the item list lives in one place.

This is Radix-idiomatic, not a compromise:
- `ContextMenu` anchors at the mouse cursor (right-click coords); `DropdownMenu` anchors at the trigger element. The two primitives exist precisely because the positioning semantics differ.
- Reference codebases (shadcn/ui, Mantine, cal.com) use the same two-Root pattern for this UX.
- A single controlled `open` state with manual anchor switching would reimplement the cursor-vs-element positioning logic Radix already handles — regressing to the hand-rolled approach this change is meant to eliminate.
- Concurrent opens are not a real concern: Radix's outside-click dismissal auto-closes the previous menu when a second trigger fires.

Do not refactor to "merge" the two Roots.

## Capabilities

- **client-ui**: replace six hand-rolled floating surfaces with three Radix primitives for consistent collision-aware placement, portal behavior, and a11y.
