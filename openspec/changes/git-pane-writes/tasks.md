## Scope (v1)
Ship the 80% loop: **Stage all → Commit → Push**.
Defer Fetch/Pull to a follow-up — non-FF / merge-conflict UX needs design.
Per-file staging + Discard also deferred.

## 1. Shared schemas + events
- [x] 1.1 Add `git:stageAll`, `git:commit`, `git:push` ByCwd-style payload/result schemas in `git.ts`.
- [x] 1.2 Re-export + add to EVENTS.git + ClientToServerEvents.

## 2. GitService — TDD
- [x] 2.1 Red: FakeGitService tests — stageAll bumps a counter; commit returns `{ ok, hash }` or `{ error: 'nothing-to-commit' }`; push returns `{ ok }` or typed error.
- [x] 2.2 Green: Fake impls.
- [x] 2.3 Add to GitService interface; implement on LocalGitService (simple-git).

## 3. Server handler
- [x] 3.1 Add handlers; broadcast `git:dirty` after stageAll/commit so the pane refetches.
- [x] 3.2 Server tests pass.

## 4. Client UI
- [x] 4.1 `<CommitComposer>` (collapsed → expand on click): subject input + optional body + Commit button (disabled until subject + status not clean).
- [x] 4.2 GitPane: replace Push placeholder button with real handler + spinner; keep Fetch/Pull as disabled placeholders (label + Coming soon tooltip).
- [x] 4.3 "Stage all" button above changes list.
- [x] 4.4 Commit success toast; error toast for typed errors.

## 5. Verify + commit
