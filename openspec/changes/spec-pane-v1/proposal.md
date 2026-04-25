## Why

`files-git-right-pane-shell` gives us a `RightPane` with three tabs. `files-pane-v1` filled the Files tab; `git-pane-readonly` filled the Git tab. The **Spec** tab is still a "coming soon" placeholder.

This change fills the Spec tab — read-only listing of OpenSpec changes / specs in the active worktree, click → modal showing Proposal / Design / Tasks. F.html's prototype lists this as one of the three first-class right-column tabs, and we already use OpenSpec heavily in this repo, so the discoverability win is high.

We have most of the plumbing:
- The `openspec` CLI is already a dependency for the spec-driven workflow itself.
- File reading is solved (`explorer:read` from the files-pane change).
- `useActiveCwd` provides the cwd dependency.
- Dialog primitive + tab strip patterns established by `<FilePreviewModal>` and worktree dialog.

What's missing: a server-side directory listing for `openspec/changes/*` and `openspec/specs/*` (cheap — wraps `readdir`), a client `<SpecPane>`, and a `<SpecModal>` with three tabs (Proposal / Design / Tasks) reading the corresponding `.md` files.

## What Changes

- Add **`<SpecPane>`** rendered inside RightPane's Spec tab. Takes `{ cwd }`; lists active changes (under `openspec/changes/<name>/`) and shipped specs (under `openspec/specs/<capability>/`). Each row shows name + a small status badge (`active` / `archived` for changes, capability name for specs).
- Add server-side **`spec:list { cwd }`** and **`spec:read { cwd, kind, name, artifact }`** global socket events:
  - `spec:list` returns `{ changes: { name, hasProposal, hasDesign, hasTasks, taskProgress }[], specs: { capability }[] }`. Path validation against `explorerRoots`. Empty result if `openspec/` directory doesn't exist (no error — just zero rows + empty state).
  - `spec:read(kind='change'|'spec', name, artifact='proposal'|'design'|'tasks'|'spec')` returns `{ content }` or `{ error }`. Validated absolute path stays under `<cwd>/openspec/`.
- Add **`<SpecModal>`** opened on row click. Header: name + kind badge. Body: tab strip (Proposal / Design / Tasks for changes; single Spec view for shipped specs) + markdown-rendered content. Action bar: Copy path / Open file (toast for now, mirror Files pane).
- Empty states:
  - `cwd === null` → "No active project" (reuse Files pane EmptyState pattern).
  - cwd has no `openspec/` dir → "OpenSpec not initialized in this worktree" + a hint (no init CTA in v1).
  - Empty changes + empty specs → "No changes or specs yet".

Explicitly out of scope:
- Creating / archiving changes from the UI (we have the CLI; UI is a future change).
- Live refresh on `openspec/` file changes (relies on `files:dirty` once the watcher is wired here — covered as a future polish, not this change).
- Validation / `openspec validate` UI (CLI suffices for now).
- Editing artifacts in-place.

## Capabilities

### New Capabilities
- `spec-pane`: the Spec tab content inside `RightPane`. Covers OpenSpec listing, modal display, and per-artifact read.

### Modified Capabilities
- `workspace-right-pane`: Spec tab body changes from a placeholder to the real `<SpecPane>`. Files / Git tabs unaffected.

## Impact

**Affected code (new):**
- `packages/server/src/services/openspec-reader.ts` — small wrapper around `readdir` + `readFile` for the `openspec/` subtree, with path-traversal guards.
- `packages/server/src/socket/handlers/spec.ts` — handler registering `spec:list` and `spec:read`.
- `packages/shared/src/schemas/spec.ts` — payload + response schemas.
- `packages/client/src/components/SpecPane.tsx`
- `packages/client/src/components/SpecModal.tsx`
- `packages/client/src/hooks/useSpecList.ts`
- `__tests__` for each of the above.

**Affected code (modified):**
- `packages/shared/src/schemas/index.ts`, `socket-events.ts` — add new schema + event names.
- `packages/server/src/socket/server.ts` — register `spec.create(ctx)`.
- `packages/client/src/components/RightPane.tsx` — render `<SpecPane cwd={cwd} />` in Spec tab.

**Dependencies on other changes:**
- Requires `files-git-right-pane-shell` merged (for `RightPane` + `useActiveCwd`).
- Reuses the `explorerRoots` validation pattern from `explorer:read` (in `files-pane-v1`); independent of `git-pane-readonly`.

**Risk:** low.
- Pure read; no writes.
- Worst-case payload is a long Tasks file; we cap modal body height with overflow-auto and don't attempt syntax highlighting (markdown-rendered text is much lighter than code).
- If `openspec/` doesn't exist the pane shows an empty state — no crash.
