# Tasks

每個 task 獨立一個 commit，完成後 typecheck + test 必須通過。

## chat/ — ChannelProvider 內

- [ ] chat/conversation — MessageList, MessageNodeList, ChatMessage, MessageContent, MessageActions, MessageActionsMenu, CollapsibleTimeline, SubagentChildren, ThinkingBlock, SearchBar
- [ ] chat/compose — ChatInputArea, ComposeInput, ComposeToolbar, AttachMenu, MentionDropdown, SpeechInputButton, SpeechInputContainer, ContextPieChart, OptionButton, PermissionModePicker, ModifiedFilesPanel
- [ ] chat/tool-use — ToolBlock, ToolUseBlock, ToolResultBlock, ToolPermissionCard, HookCallbackCard, PendingActionButtons, HookBlocks (from message-blocks/)
- [ ] chat/plan-review — PlanReviewBanner, PlanCommentPopover, ReviewUpsellBanner
- [ ] chat/session — SessionHistory, SessionRow, SessionHistoryPopover, RawEventPanel, RawEventFilterBar, CitationsPanel
- [ ] chat/renderers — CodeBlock, DiffViewer, JsonViewer, MarkdownContent, TruncatedContent
- [ ] chat/dialogs — ElicitationDialog, SideQuestionDialog, ContentPreviewDialog, ToolbarDialogs
- [ ] chat root — ChatPanel, HeaderBar, WorktreeBanner, OnboardingOverlay, SpinnerVerb

## components/ — ChannelProvider 外

- [ ] workspace — WorkspaceLayout, WorkspaceTopbar, DrawerAside, TabContainer, TabBar, RightPane, EmptyState, ErrorFallback, NotificationToast
- [ ] project — ProjectTree, ProjectList, ProjectRow, ProjectCard, ProjectContextMenu, WorktreeRow, WorktreeChildList, WorktreeContextMenu, BranchPopover, BranchSection, TopScopeSwitcher, AddProjectDialog, CreateWorktreeDialog, worktree-dialog/*, RemoveProjectConfirmDialog, RemoveWorktreeConfirmDialog, ArchiveWorktreeConfirmDialog, RenameProjectDialog, RenameWorktreeDialog
- [ ] git — GitPane, CommitComposer, DiffModal
- [ ] files — FilesPane, FileTree, FileTreeRow, FilePreviewModal, DeleteEntryConfirmDialog, NewEntryDialog
- [ ] spec — SpecPane, SpecModal, ArchiveChangeDialog, NewChangeDialog, TaskChecklist
- [ ] settings — SettingsDialog, ManageMcpDialog, McpServerRow, ManagePluginsDialog, InstalledPluginList, MarketplaceSection, AuthDialog, InitOptionsDialog, ModelPickerPopover
- [ ] live-session — LiveSessionPopover, TopbarLiveSessions, FilterPopover
