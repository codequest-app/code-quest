## Phase 1 — Radix migration cleanup

- [x] Consolidate SessionHistoryPopover (remove duplicate resume logic from ChatPanel)
- [x] Remove redundant open/onOpenChange props from SessionHistoryPopover
- [x] Make onResumed required, remove optional callback + default navigation
- [x] Remove unnecessary exports (BuildMenuItemsParams, HeaderBarProps, PermissionModePickerProps)
- [x] Tests: aria-selected over className, semantic queries, describe blocks

## Phase 2 — Component responsibility cleanup

- [x] ComposeToolbar: extract MCP server logic to module-level functions
- [x] CommandMenu: split sub-components (MenuItemRow, MenuSection), extract navigation + local feature assembly to module-level functions
- [x] RawEventPanel: extract event tracking to module-level functions (raw-event-utils.ts)
- [x] QuestionContent: extract notifyAnswers validation/transform to module-level function (buildAnswers)
- [x] WorkspaceLayout: extract dialog management to module-level functions (formatAddProjectError)
