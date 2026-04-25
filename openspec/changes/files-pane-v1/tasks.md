## 1. FileTree onActivate extension

- [x] 1.1 Red: update `FileTree.test.tsx` — `onActivate` callback fires on file-node click with the event; `onSelect` behavior unchanged when only `onSelect` is passed.
- [x] 1.2 Green: add optional `onActivate` prop to `FileTree.tsx`; existing call-sites unaffected.
- [x] 1.3 Run FileTree tests — green.

## 2. FilePreviewModal

- [x] 2.1 Red: new `FilePreviewModal.test.tsx`:
  - renders path, close button, Mention button, Copy path button
  - Mention click invokes injected `onMention` callback with path
  - Copy path writes to clipboard (assert via `navigator.clipboard.writeText` spy)
  - Content >500 KB shows fallback text, no `file:read` call
  - Content ≤500 KB fetches via `file:read` and renders highlighted
  - Esc / backdrop / close-button all dismiss
- [x] 2.2 Green: implement `FilePreviewModal.tsx` using Dialog + DialogContent + `react-syntax-highlighter`.
- [x] 2.3 Run modal tests — green.

## 3. FilesPane

- [x] 3.1 Red: new `FilesPane.test.tsx`:
  - `cwd={null}` → EmptyState "No active project"
  - `cwd="/repo"` → FileTree renders
  - Plain click on file → preview modal opens
  - Cmd/Ctrl+click → mention fired, no modal
  - Alt+click → toast "Open in editor", no modal
  - `files:dirty { cwd: '/repo', ... }` → tree refetch (assert via mock socket emit ordering)
  - `files:dirty` for different cwd → no refetch
  - unmount cleans up subscription
- [x] 3.2 Green: implement `FilesPane.tsx`:
  - read cwd from props
  - wire `<FileTree>` with loader calling `explorer:browse`
  - handle `onActivate` with modifier routing
  - subscribe to `EVENTS.fs.filesDirty` in useEffect
- [x] 3.3 Run FilesPane tests — green.

## 4. Wire into RightPane

- [x] 4.1 Red: update `RightPane.test.tsx` — Files tab body now renders `FilesPane` (test via a sentinel `data-testid="files-pane"`).
- [x] 4.2 Green: swap placeholder for `<FilesPane cwd={useActiveCwd()} />` in RightPane.
- [x] 4.3 Run RightPane tests — green.

## 5. Verify

- [x] 5.1 `pnpm --filter @code-quest/client exec tsc --noEmit` clean.
- [x] 5.2 `pnpm --filter @code-quest/client exec vitest run` — all tests pass.
- [x] 5.3 biome check on touched files.

## 6. Manual QA (deferred)

- [~] 6.1 Open cc-office dev server; RightPane Files tab shows cc-office tree.
- [~] 6.2 Click README.md → preview modal opens with rendered markdown.
- [~] 6.3 Cmd+click a file → mention inserted in composer.
- [~] 6.4 Alt+click a file → toast fires.
- [~] 6.5 With `fs-git-watch-service` merged, externally edit a file → tree refreshes within ~200ms.

## 7. Finalize

- [x] 7.1 Commit: `feat(files-pane): browse cwd, click-to-preview / mention / editor`.
- [x] 7.2 Ready to `/opsx:archive files-pane-v1` once merged.
