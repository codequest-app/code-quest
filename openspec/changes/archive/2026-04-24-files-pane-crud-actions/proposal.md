## Why

The Files pane today is read-only — users can browse, click to open in a tab, but cannot create / delete / rename / copy / move anything. Every file mutation requires dropping into the terminal or an external editor, which breaks the "Files pane is the project's primary file UI" promise.

The full CRUD set is the table stakes for any file tree UI (VS Code, Finder, every IDE). Implementing it also unlocks future drag-and-drop and "duplicate file" affordances.

## What Changes

- **5 new RPCs** in `@code-quest/shared` + `LocalFilesystemService` + server handlers + `FsContext` actions:
  - `fs:create { path, kind: 'file' | 'directory' }` — empty file or directory; rejects existing path; rejects parent missing.
  - `fs:delete { path }` — single file or recursive directory remove. Caller responsibility to confirm; server is non-interactive.
  - `fs:rename { from, to }` — same-parent rename (atomic). Validates `to` doesn't exist.
  - `fs:copy { from, to }` — file or recursive directory copy. Validates `to` doesn't exist.
  - `fs:move { from, to }` — cross-directory move (rename + parent change). Validates `to` doesn't exist.
- All RPCs validate paths stay under `explorerRoots`; reject `..` traversal; reject paths outside the validated cwd.
- `FsContext` exposes `useFsActions()` returning these as Promise-based methods.
- **Right-click context menu on file rows** (existing FileTree → Radix ContextMenu we added in `popover-radix-unification`):
  - `Open in New Tab` (existing)
  - separator
  - `New file…` / `New folder…` (creates inside the row's directory, or alongside if it's a file)
  - `Rename…` (opens an inline edit; submit triggers `fs:rename`)
  - `Duplicate` (auto-names `<base> copy.<ext>`; triggers `fs:copy`)
  - `Delete` (destructive — confirm dialog with file count for directories; triggers `fs:delete`)
- Directory copy / move surface a progress toast when the operation takes >300ms (server returns immediately on small ops).
- The existing `files:dirty` broadcast (already wired) drives auto-refresh — no manual list invalidation needed.

Explicitly out of scope:
- Drag-and-drop reorder / move (separate UX surface; future change).
- Cut / paste keyboard shortcuts (depends on having a clipboard model first).
- Permissions / chmod / symlink ops.
- Conflict resolution UI for `move`/`copy` to existing path (we just reject; future change can add overwrite-or-rename prompts).
- Trash / undo (sends to permanent delete; future "send to trash" change can wrap this).

## Capabilities

- **filesystem-service**: extend with create/delete/rename/copy/move primitives, same path-validation contract as existing read/browse.
- **files-pane**: file rows + directory rows expose a context menu with the 5 new actions, each gated by appropriate confirms.
