## Why

`files-git-right-pane-shell` gives us a right-column `RightPane` with three empty tabs. This change fills the **Files** tab so users can browse the current worktree, open file previews, and mention files in chat — the functionality F.html prescribes for the right column's Files scope.

We already have most of the plumbing:
- `packages/client/src/components/FileTree.tsx` — headless-tree based tree UI, currently wired only for the file-mention feature.
- `explorer:browse` / `file:list` / `file:read` socket events on the server.
- `useActiveCwd` hook (from the shell change).

What's missing is the connector: a Files pane that uses the hook, reuses (and slightly generalizes) `FileTree`, and wires click-to-preview / Cmd+click-to-mention / Alt+click-to-editor. Real-time freshness arrives when the client starts listening to the `files:dirty` broadcast from `fs-git-watch-service`.

## What Changes

- Add **`<FilesPane>`** component rendered inside RightPane's Files tab. Takes `{ cwd }` from the shell; queries `explorer:browse` for the tree; subscribes to `files:dirty` for invalidation.
- Generalize **`<FileTree>`** to accept an optional `onActivate` prop (click handler on a file node) while preserving its existing `onSelect` mention flow for backward compat.
- Add **`<FilePreviewModal>`** — same structure as F.html's modal: syntax-highlighted content, Preview/Diff tabs (Diff only for modified files, populated from `git:diff` once `git-pane-readonly` ships), action bar (Mention / Copy path / Open in editor shortcut hint).
- Wire click policy on a file node:
  - **default click** → open `<FilePreviewModal>`
  - **Cmd/Ctrl+click** → invoke existing mention flow (reuses existing feature)
  - **Alt+click** → toast "Open in editor" with the resolved path (no real editor invocation yet — that's a future editor-integration change)
- On receipt of `files:dirty { cwd, paths }` matching the pane's `cwd`, invalidate the tree query and refetch.
- Empty state: when `cwd === null` (no active project/tab) render "Pick a project or open a session to browse files".

Explicitly out of scope:
- Creating / renaming / deleting files (needs `FilesystemService` write APIs — future change).
- Real editor integration (URL handler / protocol scheme — future change).
- Image / binary preview (`<FilePreviewModal>` falls back to "not previewable" for now).
- File search within the pane (future: reuse existing `file:list` fuzzy).

## Capabilities

### New Capabilities
- `files-pane`: the Files tab content inside `RightPane`. Covers tree rendering, `files:dirty` invalidation, click-to-preview / mention / editor, and the preview modal.

### Modified Capabilities
- `workspace-right-pane`: the Files tab body changes from a placeholder to the real `<FilesPane>`. (Other tabs remain placeholders in this change.)

## Impact

**Affected code (new):**
- `packages/client/src/components/FilesPane.tsx`
- `packages/client/src/components/FilePreviewModal.tsx`
- `packages/client/src/components/__tests__/FilesPane.test.tsx`
- `packages/client/src/components/__tests__/FilePreviewModal.test.tsx`

**Affected code (modified):**
- `packages/client/src/components/FileTree.tsx` — add optional `onActivate` prop; existing callers unaffected.
- `packages/client/src/components/RightPane.tsx` (from shell change) — render `<FilesPane cwd={cwd} />` inside the Files tab body.
- Relevant existing FileTree tests — confirm no regression; add one new case for `onActivate`.

**Dependencies on other changes:**
- Requires `files-git-right-pane-shell` merged (for `RightPane` + `useActiveCwd`).
- Requires `fs-git-watch-service` merged for real-time freshness; **without** it, this pane works but goes stale until re-render. Ship-order can allow either (watch becomes a silent upgrade once available).

**Risk:** low.
- `<FileTree>` API widening is additive; no breaking change for the existing mention feature.
- Preview modal for a large file could be slow — we bound to 500 KB initially, surface "File too large — open in editor" otherwise.
- Syntax highlighting for unknown extensions falls back to plain text (reuse existing `react-syntax-highlighter` already a dep).
