## Tasks

- [ ] **Task 1: Lazy load ComposeToolbar dialogs** — Replace static imports of ManageMcpDialog, AccountUsageDialog, PluginsPanel, AuthDialog, ModelPickerPanel, InitOptionsDialog with React.lazy(). Wrap in Suspense with fallback={null}. Gate with conditional render.
- [ ] **Task 2: Lazy load CommandMenu** — In ChatPanel.tsx, lazy load CommandMenu. Wrap in Suspense.
- [ ] **Task 3: Lazy load DiffViewer** — In ToolUseBlock.tsx and ToolResultBlock.tsx, lazy load DiffViewer. Wrap in Suspense.
- [ ] **Task 4: Verify build produces split chunks** — Run `vite build` and verify initial chunk is smaller. Document before/after sizes.
