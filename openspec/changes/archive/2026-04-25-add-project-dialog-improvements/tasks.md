## Tasks

### 1. Disable already-added project rows
- [x] Extend `AddProjectDialog` props with `addedProjectCwds: ReadonlySet<string>`.
- [x] Extend `FileTree` props with `disabledPaths?: ReadonlySet<string>`. Forward to `FileTreeRow`.
- [x] `FileTreeRow` renders disabled rows with reduced opacity, `cursor-not-allowed`, and ignores click + double-click + highlight (right-click context menu still works for fs CRUD).
- [x] `WorkspaceLayout` passes `new Set(projects.map(p => p.cwd))` into `AddProjectDialog`.

### 2. Rename confirm button
- [x] Change `<Button>Open</Button>` → `<Button>Add</Button>` in `AddProjectDialog`.
- [x] Update tests asserting on `name: /open/i` (if any) to `/add/i`.

### 3. Verify CRUD inside dialog
- [x] Add `AddProjectDialog` test: open the dialog, right-click on a directory tree row, confirm New file… / New folder… / Rename… / Delete menu items appear.
- [x] Add follow-up test: clicking New folder… opens the NewEntryDialog (FileTree's existing flow).

### 4. Verification
- [x] `pnpm -F client test` green (incl. existing AddProjectDialog tests, FileTree tests).
- [x] `npx openspec validate add-project-dialog-improvements --strict`.
