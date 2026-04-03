## Tasks

- [x] **Task 1: Add "Rewind" to command-menu-items**
- [x] **Task 2: Create RewindDialog component**
- [x] **Task 3: Wire RewindDialog in ComposeToolbar**
- [x] **Task 4: Integration test** — 6 tests using FakeClaude + testing-library.
- [x] **Task 5: Preserve CLI uuid in summoner transforms**
- [x] **Task 6: Pass uuid through server to client Message.id**
- [x] **Task 7: RewindDialog uses CLI uuid**
- [x] **Task 8: Enable CLI file checkpointing** — Set CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING=true in spawn env.
- [ ] **Task 9: Add dry-run preview confirmation step** — After selecting message in RewindDialog, show RewindPreview dialog (existing component) with dry-run results: file changes, insertions/deletions. "Fork and rewind" title, "Continue" / "Never mind" buttons. "The code has not changed" for no changes. "Rewinding does not affect files edited manually or via bash" warning.
- [ ] **Task 10: Execute rewind + fork on Continue** — On Continue: rewindToMessage(uuid, false) → show success → forkSession(resumeAtMessageId) → open new tab. On "Never mind": close dialog.
