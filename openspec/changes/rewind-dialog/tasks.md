## Tasks

- [x] **Task 1: Add "Rewind" to command-menu-items** — Add rewind item to context section in buildMenuItems.
- [x] **Task 2: Create RewindDialog component** — Message picker dialog with list, keyboard nav, relative time.
- [x] **Task 3: Wire RewindDialog in ComposeToolbar** — onRewind callback, rewindToMessage → forkSession → fill prompt.
- [x] **Task 4: Integration test** — 6 tests using FakeClaude + testing-library.
- [x] **Task 5: Preserve CLI uuid in summoner transforms** — Added uuid to user/assistant transform payloads. TDD: 2 new tests.
- [x] **Task 6: Pass uuid through server to client Message.id** — Added uuid to shared message schemas. Client dedup now updates Message.id to CLI uuid. New messages use CLI uuid when available.
- [x] **Task 7: RewindDialog uses CLI uuid** — Verify rewind sends CLI uuid to server, not client-generated id. TDD: integration test.
