## Why

The "Select Project Directory" dialog has three rough edges that bite real usage:

1. **Already-added projects are still selectable.** A user can pick a path they've
   already added as a project; `projects:add` then either silently no-ops or
   surfaces a redundant duplicate-error toast. The picker should disable rows whose
   absolute path is already a tracked project root, so the dialog can't even produce
   the duplicate.
2. **Confirm button reads "Open" but the action is "Add".** "Open" implies opening
   a file/dir, but the dialog's purpose is to register the path as a project. The
   verb should match the action.
3. **No way to create / rename / delete folders inside the picker.** Setting up a
   new project sometimes means making a fresh directory first; users currently have
   to leave the app to do that. `FileTree` already has a Radix ContextMenu with the
   full CRUD set (New file… / New folder… / Rename… / Delete) wired through
   `useFsActions`. The dialog uses `<FileTree>` so the right-click menu should
   already work — but there's no test asserting it inside the dialog, and the
   "New folder…" entry point isn't surfaced beyond right-click.

## What Changes

- `AddProjectDialog` accepts an `addedProjectCwds: ReadonlySet<string>` prop and
  forwards it to `<FileTree>` as `disabledPaths`. `FileTree` renders disabled rows
  greyed out + non-interactive (no click / no highlight). Pre-existing project
  paths can't be picked.
- Confirm button label: `Open` → `Add`. (The dialog title stays "Select Project
  Directory".)
- Verify the right-click context menu (New file… / New folder… / Rename… / Delete)
  is functional inside `AddProjectDialog`; add a regression test. No new UI
  surface added beyond what FileTree already provides.

`WorkspaceLayout` passes `addedProjectCwds = new Set(projects.map(p => p.cwd))`
into the dialog.

Out of scope:
- Path-aliasing logic (e.g., symlink resolution before duplicate check). The
  duplicate check is exact-string-match on the cwd registered with
  ProjectContext; symlink edge cases are a separate concern.
- An explicit "+ New folder" button in the dialog header. The right-click menu is
  the single CRUD entry point; matches FileTree usage elsewhere in the app.

## Capabilities

- **client-add-project-dialog**: the picker disables already-added project rows,
  uses "Add" as the confirm verb, and inherits FileTree's CRUD context menu.
