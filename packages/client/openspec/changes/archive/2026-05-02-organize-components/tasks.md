# Tasks

每個 task 獨立一個 commit，完成後 typecheck + test 必須通過。

## chat/ — ChannelProvider 內

- [x] chat/conversation — MessageList, MessageNodeList, ChatMessage, MessageContent, MessageActions, MessageActionsMenu, CollapsibleTimeline, SubagentChildren, ThinkingBlock, SearchBar
- [x] chat/compose — ChatInputArea, ComposeInput, ComposeToolbar, AttachMenu, MentionDropdown, SpeechInputButton, SpeechInputContainer, ContextPieChart, OptionButton, PermissionModePicker, ModifiedFilesPanel
- [x] chat/tool-use — ToolBlock, ToolUseBlock, ToolResultBlock, ToolPermissionCard, HookCallbackCard, PendingActionButtons, HookBlocks (from message-blocks/)
- [x] chat/plan-review — PlanReviewBanner, PlanCommentPopover, ReviewUpsellBanner
- [x] chat/session — SessionHistory, SessionRow, SessionHistoryPopover, RawEventPanel, RawEventFilterBar, CitationsPanel
- [x] chat/renderers — CodeBlock, DiffViewer, JsonViewer, MarkdownContent, TruncatedContent
- [x] chat/dialogs — ElicitationDialog, SideQuestionDialog, ContentPreviewDialog, ToolbarDialogs
- [x] chat root — ChatPanel, HeaderBar, WorktreeBanner, OnboardingOverlay, SpinnerVerb

## components/ — ChannelProvider 外

- [x] workspace — WorkspaceLayout, WorkspaceTopbar, DrawerAside, TabContainer, TabBar, RightPane, EmptyState, ErrorFallback, NotificationToast
- [x] project — ProjectTree, ProjectList, ProjectRow, ProjectCard, ProjectContextMenu, WorktreeRow, WorktreeChildList, WorktreeContextMenu, BranchPopover, BranchSection, TopScopeSwitcher, AddProjectDialog, CreateWorktreeDialog, worktree-dialog/*, RemoveProjectConfirmDialog, RemoveWorktreeConfirmDialog, ArchiveWorktreeConfirmDialog, RenameProjectDialog, RenameWorktreeDialog
- [x] git — GitPane, CommitComposer, DiffModal
- [x] files — FilesPane, FileTree, FileTreeRow, FilePreviewModal, DeleteEntryConfirmDialog, NewEntryDialog
- [x] spec — SpecPane, SpecModal, ArchiveChangeDialog, NewChangeDialog, TaskChecklist
- [x] settings — SettingsDialog, ManageMcpDialog, McpServerRow, ManagePluginsDialog, InstalledPluginList, MarketplaceSection, AuthDialog, InitOptionsDialog, ModelPickerPopover
- [x] live-session — LiveSessionPopover, TopbarLiveSessions, FilterPopover
