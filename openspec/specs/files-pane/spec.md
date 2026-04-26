## ADDED Requirements

### Requirement: Files pane renders cwd file tree
`<FilesPane>` SHALL render the directory tree rooted at the active cwd, using `<FileTree>` backed by the `explorer:browse` socket event.

#### Scenario: Tree renders for non-null cwd
- **WHEN** `<FilesPane cwd="/repo/my-project" />` mounts
- **THEN** the tree shows `/repo/my-project`'s immediate children; expanding a directory lazy-loads its children via `explorer:browse`.

#### Scenario: Empty state for null cwd
- **WHEN** `<FilesPane cwd={null} />` mounts
- **THEN** the component renders an EmptyState with text "No active project" (or similar) instead of the tree.

### Requirement: Click intent routing
File nodes SHALL respond differently to modifier keys: default → preview modal, Cmd/Ctrl+click → mention, Alt+click → editor toast.

#### Scenario: Plain click opens the preview modal
- **WHEN** the user clicks a file node with no modifier
- **THEN** a `<FilePreviewModal>` opens with the clicked path.

#### Scenario: Cmd/Ctrl+click triggers the mention flow
- **WHEN** the user clicks a file node with `metaKey` or `ctrlKey` held
- **THEN** the existing mention-file feature is invoked with the clicked path; no preview modal opens.

#### Scenario: Alt+click triggers an editor toast
- **WHEN** the user clicks a file node with `altKey` held
- **THEN** a toast "Open in editor" is shown with the resolved path; no preview modal opens; no mention is inserted.

### Requirement: files:dirty invalidates the tree
The pane SHALL subscribe to `EVENTS.fs.filesDirty` and invalidate the tree when the broadcast's `cwd` matches the pane's `cwd`.

#### Scenario: Matching cwd triggers refetch
- **WHEN** the server broadcasts `files:dirty { cwd: '/repo', paths: ['src/foo.ts'] }` and the pane's cwd is `/repo`
- **THEN** the tree's data loader re-fetches; any expanded levels containing the changed paths update.

#### Scenario: Non-matching cwd is ignored
- **WHEN** the server broadcasts `files:dirty` for a different cwd
- **THEN** the pane does not refetch.

#### Scenario: Subscription cleaned up on unmount
- **WHEN** the pane unmounts OR the cwd changes
- **THEN** the previous `files:dirty` subscription is removed (no duplicated listeners).

### Requirement: File preview modal
`<FilePreviewModal>` SHALL render a modal with syntax-highlighted content plus a Mention-in-chat action and a Copy-path action. Files above 500 KB render a "File too large" fallback.

#### Scenario: Small file renders highlighted content
- **WHEN** `<FilePreviewModal path="README.md" />` opens for a 10 KB file
- **THEN** the content is fetched via `file:read` and rendered with `react-syntax-highlighter` (markdown highlighter).

#### Scenario: Large file renders fallback
- **WHEN** the target file exceeds 500 KB
- **THEN** the body shows "File too large to preview" with a Copy-path action; no content is rendered.

#### Scenario: Mention button invokes existing mention flow
- **WHEN** the user clicks the "Mention in chat" button
- **THEN** the mention-file feature is invoked with the file's path and the modal closes.

#### Scenario: Copy-path button copies the resolved path
- **WHEN** the user clicks the "Copy path" button
- **THEN** the resolved (absolute) path is written to the clipboard and a toast confirms.

#### Scenario: Close via backdrop / Esc / explicit close button
- **WHEN** any of (a) backdrop click, (b) Escape key, (c) close button is activated
- **THEN** the modal dismisses.

## MODIFIED Requirements

### Requirement: FileTree supports onActivate callback
`<FileTree>` SHALL accept an optional `onActivate?: (node, event) => void` prop in addition to the existing `onSelect`. `onActivate` fires when a file node is clicked; `onSelect` preserves its existing semantics for the mention flow and is unchanged.

#### Scenario: onActivate receives event with modifier keys
- **WHEN** the user clicks a file node
- **THEN** `onActivate(node, event)` is invoked with the original React MouseEvent; the caller reads modifier flags.

#### Scenario: Existing onSelect behavior unchanged
- **WHEN** a caller passes only `onSelect` (no `onActivate`)
- **THEN** click behavior matches the pre-change mention-file flow exactly.
