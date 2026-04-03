## Tasks

- [x] **Task 1: Add "Rewind" to command-menu-items**
- [x] **Task 2: Create RewindDialog component**
- [x] **Task 3: Wire RewindDialog in ComposeToolbar**
- [x] **Task 4: Integration test** — 7 tests using FakeClaude + testing-library.
- [x] **Task 5: Preserve CLI uuid in summoner transforms**
- [x] **Task 6: Pass uuid through server to client Message.id**
- [x] **Task 7: RewindDialog uses CLI uuid**
- [x] **Task 8: Enable CLI file checkpointing** — Set CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING=true in spawn env.
- [x] **Task 9: Add dry-run preview confirmation step** — Two-phase dialog: picker → "Fork and rewind" confirmation with dry-run results, file changes, Continue/Never mind buttons.
- [x] **Task 10: Execute rewind + fork on Continue** — ComposeToolbar onConfirm: rewindToMessage(false) → forkSession → fill prompt.
