## Tasks

### 1. Shared schemas
- [ ] Add `fsCreatePayload`, `fsDeletePayload`, `fsRenamePayload`, `fsCopyPayload`, `fsMovePayload` and a unified `fsMutationResultSchema = { ok: true } | { error: string }`.
- [ ] Register `fs:create / :delete / :rename / :copy / :move` in `EVENTS.fs` + `ClientToServerEvents`.

### 2. Summoner — extend FilesystemService (TDD)
- [ ] Tests for each method (FakeFilesystemService): happy path, exists collision, path traversal rejection, missing source rejection.
- [ ] Implement `create / delete / rename / copy / move` in `LocalFilesystemService` using `node:fs/promises` (`mkdir`, `rm -r`, `rename`, `cp -r` via `cp({ recursive: true })`).
- [ ] Mirror in `FakeFilesystemService` (in-memory map mutations).

### 3. Server handlers (TDD)
- [ ] Register five `fs:*` handlers in the existing `fs.ts` handler file. Each parses payload via zod, calls service, returns result.
- [ ] Tests via FakeSummoner cover happy + invalid + traversal cases.

### 4. Client `useFsActions` (TDD)
- [ ] Add `create / delete / rename / copy / move` actions returning Promise<FsMutationResult>.
- [ ] Tests assert each round-trips with correct payload.

### 5. UI — Context menu items (TDD per item)
- [ ] Refactor existing `FileTreeContextMenu` (single `Open in New Tab` item) to a multi-item ContextMenu with `Open in New Tab` + separator + `New file…` + `New folder…` + `Rename…` + `Duplicate` + separator + `Delete`.
- [ ] Test: each menuitem fires the correct callback with the right path.

### 6. UI — Naming dialogs / inline edit (TDD)
- [ ] `NewEntryDialog` (Radix Dialog) with name input + validation + Submit. Re-used for `New file…` and `New folder…`.
- [ ] Inline rename: replace row label with `<input>`, autofocus, Enter commits, Esc cancels. Test: typing + Enter calls `rename` with new name.

### 7. UI — Delete confirm (TDD)
- [ ] `DeleteEntryConfirmDialog` shows `Delete <name>?` for files; `Delete <name>/ and N files inside?` for directories. Server-side helper to count descendants OR client-side from already-loaded tree.

### 8. Duplicate auto-naming (TDD)
- [ ] Pure helper `nextDuplicateName(siblings: string[], original: string): string` — `foo.ts` → `foo copy.ts`, `foo copy.ts` → `foo copy 2.ts`, etc. Tests cover collisions.

### 9. Verification
- [ ] Full vitest run green across summoner / server / client.
- [ ] `openspec validate files-pane-crud-actions --strict`.
- [ ] Manual smoke: create / rename / duplicate / delete a file in a real project.
