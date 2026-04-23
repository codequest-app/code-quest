TDD：每個 phase 先寫 test → red → 最少 code 過關 → refactor。

## Phase 1 — `Project` UI type extension

- [x] Update `Project` interface in `ProjectContext.tsx` (add `pinned`, `lastOpenedAt`)
- [x] Update `toUiProject` adapter to expose new fields
- [x] Verify existing tests still pass (no breaking — additive)

## Phase 2 — ProjectActions: pin / rename / remove

### Tests first
- [x] `ProjectContext.test.tsx`: `pinProject(true)` calls socket projects:update + state pinned=true
- [x] `pinProject(false)` toggles back
- [x] `renameProject(cwd, name)` calls socket projects:update + state name updated
- [x] `removeProject(cwd)` calls socket projects:remove + state filtered
- [x] `removeProject` returns error response when project has active session
- [x] Active project switches to next pinned/recent when removed

### Implement
- [x] Add `pinProject` / `renameProject` / `removeProject` to `ProjectActions`
- [x] Internal lookup: cwd → server id (read from current `projects` array)
- [x] On `projects:removed` event for active project, switch to next

## Phase 2.5 — Management of projects outside EXPLORER_ROOTS

Management actions (remove / pin / rename) MUST work for projects whose path
is no longer within the current EXPLORER_ROOTS. Only `projects:add` (creating
new entries) is gated by EXPLORER_ROOTS — once in the DB, the project is
manageable regardless of root scope (otherwise users can't clean up legacy
entries when admin changes .env).

### Tests first
- [x] Server: `projects:remove` succeeds for project whose path is outside roots
- [x] Server: `projects:update` (pin / unpin / name) succeeds for project outside roots
- [x] Client: ProjectCard can unpin a pinned project (regardless of root scope)
- [x] Client: ProjectCard can remove a project whose path is outside current roots

### Implement
- [x] Verify `projects:update` handler does NOT call `isWithinExplorerRoots` (intentional)
- [x] Verify `projects:remove` handler does NOT call `isWithinExplorerRoots` (intentional)
- [x] Add explicit comments in handler explaining the asymmetry (add gated, mutate not)

## Phase 3 — ProjectList grouping (Pinned / Recent)

### Tests first
- [x] `ProjectList.test.tsx`: renders 2 sections (Pinned + Recent) when projects have mix
- [x] Pinned section omitted when no pinned projects
- [x] Recent section omitted when all are pinned
- [x] Pinned projects sorted by lastOpenedAt desc
- [x] Recent projects sorted by lastOpenedAt desc

### Implement
- [x] `ProjectList` groups + sorts before render
- [x] SectionHeader for each group
- [x] Empty state when zero projects (existing)

## Phase 4 — ProjectCard pin star + ⋯ menu trigger

### Tests first
- [x] `ProjectCard.test.tsx`: pinned project shows filled star always
- [x] Unpinned project: hover shows outlined star
- [x] Click star → calls pinProject(cwd, !pinned) (covered by Outside-roots unpin test)
- [x] ⋯ button visible on hover; click triggers context menu

### Implement
- [x] Add pin star to `ProjectCard`
- [x] Add `⋯` button + wire to existing `ProjectContextMenu`
- [x] Hover styles via Tailwind (group-hover)

## Phase 5 — ProjectContextMenu: add Rename / Remove

### Tests first
- [x] `ProjectContextMenu.test.tsx`: existing items still render (Resume/CreateWorktree)
- [x] Rename item present + onClick calls onSelectRename
- [x] Remove item present + onClick calls onSelectRemove

### Implement
- [x] Add `onSelectRename` + `onSelectRemove` props
- [x] Render Rename + Remove menu items
- [x] Keep existing items

## Phase 6 — RenameProjectDialog (new)

### Tests first
- [x] `RenameProjectDialog.test.tsx`:
  - Pre-fills input with current name
  - Rename button disabled when input empty
  - Rename button disabled when input == current name
  - Submit → calls onRename(newName) + closes
  - Esc → closes
  - Cancel button → closes

### Implement
- [x] New file: `RenameProjectDialog.tsx`
- [x] Use existing `Dialog` UI primitive
- [x] Auto-focus input on open
- [x] New file: `RenameProjectDialog.stories.tsx`

## Phase 7 — RemoveProjectConfirmDialog (new)

### Tests first
- [x] `RemoveProjectConfirmDialog.test.tsx`:
  - State A (no active sessions): shows Remove button
  - State B (has active sessions, count from props): shows OK-only with warning
  - Remove → calls onConfirm
  - OK → closes (state B)
  - Cancel/Esc → closes without action

### Implement
- [x] New file: `RemoveProjectConfirmDialog.tsx`
- [x] Two visual states based on `activeSessionCount` prop
- [x] New file: `RemoveProjectConfirmDialog.stories.tsx`

## Phase 8 — Wire dialogs into ProjectCard / ContextMenu flow

### Tests first
- [x] `ProjectCard` test: clicking ⋯ → Rename → opens RenameProjectDialog
- [x] Submitting rename calls renameProject + dialog closes
- [x] `ProjectCard` test: clicking ⋯ → Remove → opens RemoveProjectConfirmDialog
- [x] If has active sessions, dialog shows warning state
- [x] Confirming remove calls removeProject + dialog closes

### Implement
- [x] `ProjectCard` manages dialog state for both
- [x] Pre-compute activeSessionCount via `useProjectState().sessions` filter
- [x] Wire to actions

## Phase 9 — TopScopeSwitcher (new)

### Tests first
- [x] `TopScopeSwitcher.test.tsx`:
  - Renders current active project name
  - Click trigger → dropdown opens
  - Dropdown shows Pinned / Recent groups
  - Click project → calls setActiveProject + dropdown closes
  - Search input filters projects (substring on name)
  - + Add project → calls onAddProject
  - Esc → dropdown closes
  - Click outside → dropdown closes

### Implement
- [x] New file: `TopScopeSwitcher.tsx`
- [x] Reuse popover styling from existing `MentionDropdown` / `ResumeSessionsDropdown`
- [x] New file: `TopScopeSwitcher.stories.tsx`

## Phase 10 — WorkspaceLayout integration

### Tests first
- [x] `WorkspaceLayout.test.tsx`: top header includes scope switcher when projects exist
- [x] Switching project updates active state
- [x] Add project from switcher opens existing dialog flow

### Implement
- [x] Render `TopScopeSwitcher` in WorkspaceLayout top area (above sidebar/main split)
- [x] Pass current active project + actions
- [x] Trigger `AddProjectDialog` from switcher's "+ Add project" item

## Phase 11 — Regression check

- [x] All client tests pass (1343 baseline + new tests)
- [x] All server tests pass (573 baseline)
- [x] `pnpm exec tsc --noEmit` clean for all packages
- [x] No biome errors
- [x] Storybook builds (if affected stories)

## Phase 12 — Manual verification

- [x] Open cc-office, see Projects sidebar with Pinned/Recent groups (initially Recent)
- [x] Click ⋯ on a project → Rename dialog opens, change name, save → name updates
- [x] Click star on a project → moves to Pinned group
- [x] Click star again → moves back to Recent
- [x] Click ⋯ → Remove → confirm dialog → Remove → project disappears
- [x] Try Remove on project with active session → shows warning, can't remove
- [x] Top scope switcher: open dropdown, see Pinned/Recent groups
- [x] Search in switcher filters list
- [x] + Add project from switcher → dialog opens
- [x] Multi-tab: rename in one tab → other tab updates
- [x] Restart server → Pin / rename / metadata preserved

## Phase 13 — Archive

- [x] `openspec verify direction-f-project-ui`
- [x] All tasks checked
- [x] Manual verification done
- [x] `openspec archive direction-f-project-ui`
