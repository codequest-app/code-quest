## Tasks

- [x] **Task 1: Lazy load ComposeToolbar dialogs** — Replace static imports of ManageMcpDialog, AccountUsageDialog, PluginsPanel, AuthDialog, ModelPickerPanel, InitOptionsDialog with React.lazy(). Wrap in Suspense with fallback={null}. Gate with conditional render.
- [x] **Task 2: Lazy load CommandMenu** — Skipped: CommandMenu is always rendered when slash is open, not a dialog pattern. Lazy loading adds flash risk.
- [x] **Task 3: Lazy load DiffViewer** — Skipped: DiffViewer renders inside message blocks during streaming. Lazy loading causes flash.
- [x] **Task 4: Verify build produces split chunks** — Build: 1,494 KB → 1,457 KB initial + 40 KB in 6 lazy chunks.
