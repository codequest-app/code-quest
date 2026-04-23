## Project type extension (UI)

```ts
// packages/client/src/contexts/ProjectContext.tsx
export interface Project {
  cwd: string;          // = server's path
  name: string;
  pinned: boolean;      // NEW (was: server-only field)
  lastOpenedAt: string; // NEW (was: server-only field)
  // color: string | null  ← schema has it; UI not exposed yet
}
```

Adapter `toUiProject` updated to expose `pinned` + `lastOpenedAt`. UI components
that don't care can ignore these (no breaking change).

## ProjectActions API

```ts
type ProjectMutationResult = Project | { error: string; activeSessionCount?: number };

interface ProjectActions {
  // existing
  addProject: (cwd: string) => Promise<Project | { error: string; path?: string }>;
  setActiveProject: (cwd: string) => void;
  requestActivateChannel: (cwd, channelId) => void;
  clearPendingActivate: () => void;

  // NEW
  pinProject: (cwd: string, pinned: boolean) => Promise<ProjectMutationResult>;
  renameProject: (cwd: string, name: string) => Promise<ProjectMutationResult>;
  removeProject: (cwd: string) => Promise<ProjectMutationResult>;
}
```

All three resolve to either a `Project` (success — already broadcast via
`projects:updated/removed` so state is in sync) or an `{ error }` shape.

Internally:
- `pinProject` / `renameProject` → `socket.emit('projects:update', { id, patch })`
- `removeProject` → `socket.emit('projects:remove', { id })`

Note: client passes `cwd` (UI-friendly) but the server expects `id`. Adapter
looks up `id` from the current `projects` array via `getByPath`.

## UI: Top scope switcher

Position: top header, leftmost (after brand logo).

```
┌──────────────────────────────────────────────────────────┐
│ ✦ cc-office  │ [cc-office ▾]              ⚙ 🔔        │
│              │  └─ click → dropdown                      │
│                                                          │
│   Dropdown:                                              │
│   ┌──────────────────────┐                              │
│   │ ⌕ Search…             │                              │
│   ├──────────────────────┤                              │
│   │ 📌 PINNED             │                              │
│   │   ✓ cc-office         │                              │
│   │     anthropic-cookbook│                              │
│   ├──────────────────────┤                              │
│   │ RECENT                │                              │
│   │     dq3-disasm        │                              │
│   ├──────────────────────┤                              │
│   │ + Add project         │                              │
│   └──────────────────────┘                              │
└──────────────────────────────────────────────────────────┘
```

Behavior:
- Click switcher → dropdown opens
- Click project → `setActiveProject(cwd)` + close dropdown
- Search filters projects (substring on name)
- `+ Add project` → opens existing `AddProjectDialog`
- Esc / click outside → close

This sits ALONGSIDE the existing left sidebar Projects pane (both visible). Some
users prefer sidebar (always visible), others use ⌘P (no, just click for now)
quick-switcher. Both supported.

## UI: ProjectList groups

Sidebar Projects pane re-grouped:

```
PROJECTS
─────────────────────────
📌 PINNED (n)
  📁 cc-office       ★⋯
  📁 anthropic-...   ★⋯
─────────────────────────
RECENT (m)
  📁 dq3-disasm      ☆⋯
  📁 my-app          ☆⋯
─────────────────────────
+ Add Project
```

Sort:
- Pinned: `pinned=true`, ordered by `lastOpenedAt` desc
- Recent: `pinned=false`, ordered by `lastOpenedAt` desc

`★` (pinned star, accent color) / `☆` (unpinned outline) — click toggles. Visible
on hover; pinned ones always visible (because state).

`⋯` (more) — click opens existing `ProjectContextMenu` (already used for right-
click). Now adds Rename / Remove items.

## UI: Rename dialog

Simple — single input, OK / Cancel.

```
┌────────────────────────┐
│ Rename project         │
├────────────────────────┤
│  Current: cc-office    │
│  New:    [____________]│
│                        │
│   [Cancel] [Rename]    │
└────────────────────────┘
```

- Input pre-filled with current name
- Disable Rename button if input is empty or unchanged
- Enter submits, Esc cancels
- On success: dialog closes (state updated via `projects:updated`)
- On error: toast (rare — server only fails on unknown id, which UI prevents)

## UI: Remove confirm dialog

Two states based on whether project has active sessions:

**State A — no active sessions** (clean remove):
```
┌──────────────────────────────────┐
│ Remove project                   │
├──────────────────────────────────┤
│ Remove cc-office from your list? │
│ The folder is NOT deleted.       │
│                                  │
│   [Cancel]  [Remove]             │
└──────────────────────────────────┘
```

**State B — has active sessions** (blocked):
```
┌──────────────────────────────────┐
│ Cannot remove                    │
├──────────────────────────────────┤
│ cc-office has 2 active session(s)│
│ Close them first.                │
│                                  │
│             [OK]                 │
└──────────────────────────────────┘
```

Implementation: client checks `sessions` from ProjectState first; if any session
has `projectRoot === cwd && state !== 'exited'`, show State B without server
roundtrip. If client check passes but server still rejects (race condition),
show toast.

## State management

`ProjectContext.actions` becomes the only entry point for project mutations.
Components don't `socket.emit` directly. This keeps:
- Single source of truth for ProjectActions API
- Easy to mock in component tests (override `useProjectActions`)
- Optimistic-ready (later) — actions can layer optimistic updates if needed

For now: no optimistic updates. UI waits for server response. Pin/rename are
fast (< 50ms locally) so this is fine. If perceived slow, can add later.

## What about active project after remove?

If user removes the currently active project:
- Set active to first project in list (pinned first, then recent)
- If list is empty, set active to null → empty state UI

Handled in `ProjectContext` after `projects:removed` event.

## Tests

```
ProjectContext.test.tsx (extend)
  - pinProject(true) calls projects:update with { pinned: true } + state reflects
  - pinProject(false) toggles back
  - renameProject calls projects:update with { name }
  - removeProject calls projects:remove and removes from state
  - removeProject error response surfaces
  - When active project removed, active switches to next pinned/recent

TopScopeSwitcher.test.tsx (new)
  - Renders current active project
  - Click → dropdown opens with pinned/recent groups
  - Click another project → setActiveProject called
  - Search filters list
  - + Add project → opens AddProjectDialog
  - Esc closes dropdown

ProjectList.test.tsx (extend)
  - Renders pinned/recent groups
  - Pinned projects appear first
  - Star button toggles pin state
  - ⋯ menu has Rename / Remove items

ProjectCard.test.tsx (extend)
  - Hover shows pin star + ⋯
  - Pinned card always shows star (filled)
  - Click ★ → calls pinProject

ProjectContextMenu.test.tsx (extend)
  - Has Rename / Remove items (existing tests still pass for Resume/CreateWorktree)

RenameProjectDialog.test.tsx (new)
  - Pre-filled with current name
  - Rename button disabled when empty/unchanged
  - Submit → calls renameProject + closes
  - Cancel/Esc → closes without action

RemoveProjectConfirmDialog.test.tsx (new)
  - State A: no active sessions → shows confirm with Remove button
  - State B: has active sessions → shows error state with OK only
  - Remove → calls removeProject + closes
  - Cancel → closes without action
```

## Out of scope (later)

- Top switcher worktree expansion
- Pin reordering (drag)
- Color picker UI
- Recent search via ⌘P palette
- Project archive (soft delete)
