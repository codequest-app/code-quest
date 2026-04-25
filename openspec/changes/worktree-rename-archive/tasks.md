## 1. Shared schemas + events

- [x] 1.1 Add `worktreeRenamePayload/Result` and `worktreeArchivePayload/Result` to `schemas/worktree.ts` (archive result is a discriminated union: `{ ok: true } | { error: 'dirty' | string }`).
- [x] 1.2 Re-export from `schemas/index.ts`.
- [x] 1.3 Add `EVENTS.worktree.rename` / `archive` + ClientToServerEvents entries.
- [x] 1.4 `pnpm --filter @code-quest/shared exec tsc --noEmit` — clean.

## 2. GitService — TDD

- [x] 2.1 Red: extend FakeGitService tests — `renameWorktree(cwd, name)` updates branch on registered worktree; `archiveWorktree(cwd)` removes the worktree entry; both throw on unknown cwd.
- [x] 2.2 Green: implement on `FakeGitService`.
- [x] 2.3 Add interface methods to `GitService`; implement on `LocalGitService` (real simple-git).
- [x] 2.4 Run summoner tests — green.

## 3. Server handler — TDD

- [x] 3.1 Red: extend worktree handler test — rename success, archive success, archive returns `{error: 'dirty'}` when fake throws DirtyError, force flag bypasses.
- [x] 3.2 Green: register handlers; broadcast `worktree:branchChanged` (rename) and `worktree:removed` (archive).
- [x] 3.3 Run server tests — green.

## 4. Client actions hook + dialogs — TDD

- [x] 4.1 Add `rename` + `archive` to `useWorktreeActions`.
- [x] 4.2 Red: `RenameWorktreeDialog.test.tsx` — pre-filled input, validates name, submit fires onSubmit.
- [x] 4.3 Green: implement `<RenameWorktreeDialog>`.
- [x] 4.4 Red: `ArchiveWorktreeConfirmDialog.test.tsx` — confirm fires onConfirm, dirty error shows force option.
- [x] 4.5 Green: implement `<ArchiveWorktreeConfirmDialog>`.

## 5. Wire into WorktreeChildList

- [x] 5.1 Replace toast placeholders with dialog overlays in `WorktreeChildList.tsx` (extend the `Overlay` discriminated union).
- [x] 5.2 Run all client tests — green.

## 6. Verify

- [x] 6.1 client + server + summoner tsc + vitest — green.
- [x] 6.2 biome check on touched files.

## 7. Finalize

- [x] 7.1 Commit.
