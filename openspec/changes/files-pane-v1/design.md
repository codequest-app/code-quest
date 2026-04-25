## Context

The Files pane is the simplest of the three right-column tabs because most primitives already exist:
- Tree UI — `<FileTree>` using `@headless-tree/core + @headless-tree/react`.
- Remote fetch — `explorer:browse` socket event returns immediate children; `file:list` does fuzzy search; `file:read` reads content.
- Preview styling — `react-syntax-highlighter` already a dep (used in other areas).

This change is mostly about composition and click-intent routing.

## Goals / Non-Goals

**Goals:**
- Files pane renders the `cwd` tree; user can expand/collapse and click files.
- Click policy: default → modal preview, Cmd+click → mention, Alt+click → editor toast.
- Preview modal shows syntax-highlighted content with Mention / Copy path actions.
- `files:dirty` from the server invalidates the tree and any open modal.
- Empty state for `cwd === null`.

**Non-Goals:**
- Write operations.
- Real editor integration.
- Binary/image preview (stub message is fine).
- Persistent tree expand state across reloads (let headless-tree's default in-memory state carry it for a session; persistence is a future polish).

## Decisions

### 1. Extend `<FileTree>` via optional prop, not a new component

Alternatives considered:
- Fork FileTree into a "FileMentionTree" vs "FileExplorerTree" — duplicates the heavy lifting (async lazy loading, tree config).
- Add two callbacks (`onSelect`, `onActivate`) to one component — additive, backward-compatible.

**Decision:** keep one `<FileTree>`; add optional `onActivate?: (node) => void`. The mention feature keeps using `onSelect`. The Files pane passes `onActivate`.

### 2. Click-intent routing — capture at the node, not the tree

The node handler checks `e.metaKey || e.ctrlKey` → mention; `e.altKey` → editor; otherwise → preview. This matches F.html's prototype exactly.

Tests simulate the three combos independently; userEvent supports `{ ctrlKey: true }` etc.

### 3. `files:dirty` handling — one `useEffect` subscribing at pane level

```tsx
useEffect(() => {
  if (!cwd) return;
  const off = socket.on(EVENTS.fs.filesDirty, ({ cwd: eventCwd }) => {
    if (eventCwd === cwd) invalidateTree();
  });
  return off;
}, [cwd, socket, invalidateTree]);
```

Pane-level subscription is acceptable because:
- Only one pane exists at a time (one RightPane).
- When cwd changes, the old subscription is cleaned up.
- Server already scopes broadcasts to matching channels (from `fs-git-dirty-broadcast`), so `files:dirty` arrives only for relevant cwds in practice; the equality check is belt-and-suspenders.

### 4. Preview modal — reuse existing Dialog primitive

`<FilePreviewModal>` wraps the `Dialog` + `DialogContent` primitives already used throughout the app. Header: 📄 icon + path + close. Tabs: Preview / Diff. Body: `<SyntaxHighlighter>` from `react-syntax-highlighter` (already installed). Action bar: Mention (primary), Copy path, Alt-click hint text.

File size bound: **500 KB** (configurable constant). Above that, render a "File too large to preview" panel with a Copy-path action.

Diff tab is **disabled** if the file is not known to be modified. "Known to be modified" = we receive a `modified` marker from git pane state. **In v1 of Files pane, the Diff tab is always hidden** — it becomes discoverable only after `git-pane-readonly` provides the modification status. Ship-order allows either, no dependency conflict.

### 5. Syntax detection — extension-based, with fallbacks

`.ts / .tsx / .js / .jsx / .json / .md / .html / .css / .yaml / .sh / .py` → dedicated highlighters from `react-syntax-highlighter`.

Otherwise plain text. No deep language detection (Shiki / Monaco are heavy — future work).

### 6. Query layer

Reuse **`useQuery`-style hook** already in the codebase (`packages/client/src/features/...`), or (if simpler) a small `useExplorerBrowse(cwd)` hook that wraps the socket emit. The existing `FileTree`'s `asyncDataLoaderFeature` already has an async loader; we inject a loader that calls `explorer:browse`.

### 7. Empty state rendering

When `cwd === null`:
```
┌───────────────────────────────┐
│  📁                           │
│  No active project            │
│  Pick a project or open a     │
│  session to browse files      │
└───────────────────────────────┘
```

Reuse `<EmptyState>` primitive.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Tree goes stale if `fs-git-watch-service` not yet merged | Pane still functional; freshness gap is acknowledged. Users can close+reopen RightPane (or use a future manual refresh button) as workaround. |
| Very large directory (e.g. 10k files) slows tree | `asyncDataLoaderFeature` loads on expand, so initial render is O(root children). Deep expansion is user-initiated. |
| Preview of 500 KB+ files | Bounded; "too large" fallback. |
| Syntax highlighter bundle weight | Already in the bundle; no new cost. |
| Cmd+click on macOS vs Ctrl+click on Linux | Handle both `metaKey || ctrlKey` uniformly. |

## TDD Order

1. Red → Green: extend `<FileTree>` `onActivate` prop; update FileTree tests for the new prop.
2. Red → Green: `<FilePreviewModal>` — renders path + content, Mention / Copy buttons wire to callbacks, "too large" fallback for oversized content.
3. Red → Green: `<FilesPane>` — renders empty state for null cwd; renders `<FileTree>` for non-null; click fires preview; Cmd+click fires mention; Alt+click fires editor toast; `files:dirty` for the same cwd triggers invalidation.
4. Red → Green: wire `<FilesPane>` into `RightPane`'s Files tab body; update RightPane test.
5. Verify: full client suite green; biome + tsc clean.
