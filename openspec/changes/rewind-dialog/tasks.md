## Tasks

- [x] **Task 1: Add "Rewind" to command-menu-items** — Add rewind item to context section in buildMenuItems. Calls `callbacks.onRewind`. TDD: add test to command-menu-items.test.ts verifying rewind item exists and calls callback.
- [x] **Task 2: Create RewindDialog component** — New component: message picker dialog with list, keyboard nav, relative time. TDD: write tests for rendering messages, keyboard navigation, empty state.
- [x] **Task 3: Wire RewindDialog in ComposeToolbar** — Add showRewindDialog state, pass onRewind callback to CommandMenu, mount RewindDialog. On select: rewindToMessage → forkSession → fill prompt.
- [x] **Task 4: Integration test** — Tests cover full flow: Command Menu → Rewind → Dialog → select message. 3 integration tests using FakeClaude + testing-library.
