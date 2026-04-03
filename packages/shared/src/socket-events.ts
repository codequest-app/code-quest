import type {
  ActionOpenFilePayload,
  ActionOpenUrlPayload,
  AddMarketplacePayload,
  AskDebuggerHelpResponse,
  AuthResult,
  AuthStatus,
  CancelRequestEventPayload,
  CancelRequestPayload,
  ChannelIdPayload,
  ChatCancelAsyncMessagePayload,
  ChatCreatePayload,
  ChatGenerateSessionTitlePayload,
  ChatGetStatePayload,
  ChatHookCallbackRespondPayload,
  ChatInterruptPayload,
  ChatJoinPayload,
  ChatKillPayload,
  ChatRespondPayload,
  ChatRewindCodePayload,
  ChatSendPayload,
  ChatSetModelPayload,
  ChatSetPermissionModePayload,
  ChatSetProactivePayload,
  ChatSetRemoteControlPayload,
  ChatSetThinkingLevelPayload,
  ChatStopTaskPayload,
  ChromeMcpControlPayload,
  CloseChannelPayload,
  ControlCancelPayload,
  ControlDiffReviewPayload,
  ControlElicitationPayload,
  ControlHookCallbackPayload,
  ControlMcpPayload,
  ControlPermissionPayload,
  ControlResponse,
  DebuggerHelpPayload,
  DisableChromeMcpResponse,
  DisableJupyterMcpResponse,
  EnableJupyterMcpResponse,
  EnsureChromeMcpResponse,
  ErrorMessagePayload,
  ExecResponse,
  FileListPayload,
  FileReadPayload,
  FileReadResponse,
  ForkConversationResponse,
  GenerateSessionTitleResponse,
  GetClaudeStateResponse,
  GetPlanCommentsResponse,
  GetProviderConfigResponse,
  GetSessionResponse,
  GitCheckoutPayload,
  GitCheckoutResult,
  GitDiffPayload,
  GitDiffResult,
  GitExecPayload,
  GitLogPayload,
  GitLogResult,
  GitStatusPayload,
  GitStatusResult,
  GitUpdateSkippedBranchPayload,
  InitResponse,
  JupyterMcpControlPayload,
  ListFilesResponse,
  ListMarketplacesResponse,
  ListPluginsPayload,
  ListPluginsResponse,
  LoginPayload,
  MarketplaceResult,
  McpAuthenticatePayload,
  McpAuthResult,
  McpGetServersPayload,
  McpMessagePayload,
  McpOAuthCallbackPayload,
  McpReconnectPayload,
  McpSetEnabledPayload,
  McpSetServersPayload,
  MessageAssistantPayload,
  MessageResultPayload,
  MessageUserPayload,
  NotificationAuthStatusPayload,
  NotificationAuthUrlPayload,
  NotificationShowPayload,
  NotificationToastPayload,
  OAuthCodePayload,
  PlanClosePreviewPayload,
  PlanCommentEventPayload,
  PlanCommentPayload,
  PlanGetCommentsPayload,
  PlanRemoveCommentPayload,
  PluginInstallPayload,
  PluginResult,
  PluginTogglePayload,
  PluginUninstallPayload,
  RawEventPayload,
  RawEventsResponse,
  RefreshMarketplacePayload,
  RemoveCommentPayload,
  RemoveMarketplacePayload,
  RewindResult,
  SessionClosedPayload,
  SessionCreatedPayload,
  SessionDeadPayload,
  SessionDeletePayload,
  SessionForkPayload,
  SessionGetPayload,
  SessionInitPayload,
  SessionJoinResponse,
  SessionLaunchResponse,
  SessionListPayload,
  SessionListRemotePayload,
  SessionListResponse,
  SessionRenamePayload,
  SessionResumePayload,
  SessionStatesPayload,
  SessionStatusPayload,
  SessionTeleportPayload,
  SessionUpdateStatePayload,
  SettingsApplyPayload,
  SpeechToTextMessagePayload,
  StateUsagePayload,
  StreamBlockStartPayload,
  StreamChunkPayload,
  StreamEndPayload,
  StreamTextPayload,
  StreamToolSummaryPayload,
  SuccessResponse,
  SystemApiRetryPayload,
  SystemAvailableModelsPayload,
  SystemCompactBoundaryPayload,
  SystemExperimentGatesPayload,
  SystemHookResponsePayload,
  SystemHookStartedPayload,
  SystemRateLimitPayload,
  SystemRemoteControlPayload,
  SystemTaskNotificationPayload,
  SystemTaskProgressPayload,
  SystemTaskStartedPayload,
  TeleportSessionResponse,
  TerminalGetContentsPayload,
  TerminalGetContentsResponse,
  TerminalOpenClaudePayload,
  TerminalOpenClaudeResponse,
  UpdateStatePayload,
} from './schemas/index.ts';

export interface ClientToServerEvents {
  // ── Chat Operations ──
  'chat:rewind_code': (
    payload: ChatRewindCodePayload,
    callback: (response: RewindResult) => void,
  ) => void;

  // ── Aligned: Settings ──
  'settings:set_model': (payload: ChatSetModelPayload, cb: (res: SuccessResponse) => void) => void;
  'settings:set_permission_mode': (payload: ChatSetPermissionModePayload) => void;
  'settings:set_thinking_level': (payload: ChatSetThinkingLevelPayload) => void;
  'settings:refresh_usage': (payload: ChannelIdPayload) => void;
  'settings:apply': (
    payload: SettingsApplyPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'settings:state': (
    payload: ChatGetStatePayload,
    callback: (response: GetClaudeStateResponse) => void,
  ) => void;

  // ── Aligned: Session Management ──
  'session:list': (
    payload: SessionListPayload,
    callback: (response: SessionListResponse) => void,
  ) => void;
  'session:list_remote': (
    payload: SessionListRemotePayload,
    callback: (response: SessionListResponse) => void,
  ) => void;
  'session:get': (
    payload: SessionGetPayload,
    callback: (response: GetSessionResponse) => void,
  ) => void;
  'session:teleport': (
    payload: SessionTeleportPayload,
    callback: (response: TeleportSessionResponse) => void,
  ) => void;
  'session:fork': (
    payload: SessionForkPayload,
    callback: (response: ForkConversationResponse) => void,
  ) => void;
  'session:rename': (
    payload: SessionRenamePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'session:delete': (
    payload: SessionDeletePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'session:update_state': (
    payload: SessionUpdateStatePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;

  // ── Aligned: MCP ──
  'mcp:servers': (
    payload: McpGetServersPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  'mcp:toggle': (
    payload: McpSetEnabledPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  'mcp:reconnect': (
    payload: McpReconnectPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  'mcp:authenticate': (
    payload: McpAuthenticatePayload,
    callback: (result: McpAuthResult) => void,
  ) => void;
  'mcp:clear_auth': (
    payload: McpAuthenticatePayload,
    callback: (result: SuccessResponse) => void,
  ) => void;
  'mcp:oauth_callback': (
    payload: McpOAuthCallbackPayload,
    callback: (result: SuccessResponse) => void,
  ) => void;
  'mcp:set_servers': (
    payload: McpSetServersPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  'mcp:message': (
    payload: McpMessagePayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  'mcp:ensure_chrome': (
    payload: ChromeMcpControlPayload,
    callback: (response: EnsureChromeMcpResponse) => void,
  ) => void;
  'mcp:disable_chrome': (
    payload: ChromeMcpControlPayload,
    callback: (response: DisableChromeMcpResponse) => void,
  ) => void;
  'mcp:enable_jupyter': (
    payload: JupyterMcpControlPayload,
    callback: (response: EnableJupyterMcpResponse) => void,
  ) => void;
  'mcp:disable_jupyter': (
    payload: JupyterMcpControlPayload,
    callback: (response: DisableJupyterMcpResponse) => void,
  ) => void;
  'mcp:ask_debugger': (
    payload: DebuggerHelpPayload,
    callback: (response: AskDebuggerHelpResponse) => void,
  ) => void;

  // ── Aligned: File & Git ──
  'file:list': (payload: FileListPayload, callback: (response: ListFilesResponse) => void) => void;
  'git:checkout': (
    payload: GitCheckoutPayload,
    callback: (result: GitCheckoutResult) => void,
  ) => void;
  'git:status': (payload: GitStatusPayload, callback: (result: GitStatusResult) => void) => void;
  'git:update_skipped_branch': (
    payload: GitUpdateSkippedBranchPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'git:exec': (payload: GitExecPayload, callback: (response: ExecResponse) => void) => void;

  // ── Aligned: Plugin ──
  'plugin:list': (
    payload: ListPluginsPayload,
    callback: (result: ListPluginsResponse) => void,
  ) => void;
  'plugin:install': (
    payload: PluginInstallPayload,
    callback: (result: PluginResult) => void,
  ) => void;
  'plugin:uninstall': (
    payload: PluginUninstallPayload,
    callback: (result: PluginResult) => void,
  ) => void;
  'plugin:toggle': (payload: PluginTogglePayload, callback: (result: PluginResult) => void) => void;
  'plugin:list_marketplaces': (callback: (result: ListMarketplacesResponse) => void) => void;
  'plugin:add_marketplace': (
    payload: AddMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;
  'plugin:remove_marketplace': (
    payload: RemoveMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;
  'plugin:refresh_marketplace': (
    payload: RefreshMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;

  // ── Aligned: Auth ──
  'auth:status': (callback: (result: AuthStatus) => void) => void;
  'auth:login': (payload: LoginPayload, callback: (result: AuthResult) => void) => void;
  'auth:oauth_code': (payload: OAuthCodePayload, callback: (result: AuthResult) => void) => void;

  // ── Aligned: Plan ──
  'plan:comment': (
    payload: PlanCommentPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'plan:comments': (
    payload: PlanGetCommentsPayload,
    callback: (response: GetPlanCommentsResponse) => void,
  ) => void;
  'plan:remove_comment': (
    payload: PlanRemoveCommentPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  'plan:close_preview': (
    payload: PlanClosePreviewPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;

  // ── File Operations ──
  'file:read': (payload: FileReadPayload, callback: (response: FileReadResponse) => void) => void;

  // ── Clean relay protocol: new C→S events ──
  'session:launch': (
    payload: ChatCreatePayload,
    callback: (response: SessionLaunchResponse) => void,
  ) => void;
  'session:close': (payload: ChatKillPayload) => void;
  'session:resume': (payload: SessionResumePayload) => void;
  'session:join': (
    payload: ChatJoinPayload,
    callback: (response: SessionJoinResponse) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:cancel': (payload: ChatInterruptPayload) => void;
  'chat:respond': (payload: ChatRespondPayload) => void;

  'chat:stop_task': (payload: ChatStopTaskPayload) => void;
  'session:raw_events': (
    payload: ChannelIdPayload,
    callback: (response: RawEventsResponse) => void,
  ) => void;
  'git:log': (payload: GitLogPayload, callback: (result: GitLogResult) => void) => void;
  'git:diff': (payload: GitDiffPayload, callback: (result: GitDiffResult) => void) => void;
  'app:init': (callback: (response: InitResponse) => void) => void;
  'chat:cancel_request': (payload: CancelRequestPayload) => void;
  'app:config': (
    payload: ChannelIdPayload,
    callback: (response: GetProviderConfigResponse) => void,
  ) => void;
  'terminal:read': (
    payload: TerminalGetContentsPayload,
    callback: (response: TerminalGetContentsResponse) => void,
  ) => void;
  'terminal:open_claude': (
    payload: TerminalOpenClaudePayload,
    callback: (response: TerminalOpenClaudeResponse) => void,
  ) => void;

  // ── Aligned: Speech-to-Text ──
  'speech:start': (payload: ChannelIdPayload) => void;
  'speech:stop': (payload: ChannelIdPayload) => void;

  // ── Protocol Alignment: new control_request subtypes ──
  'chat:cancel_async': (payload: ChatCancelAsyncMessagePayload) => void;
  'settings:set_proactive': (payload: ChatSetProactivePayload) => void;
  'session:generate_title': (
    payload: ChatGenerateSessionTitlePayload,
    callback: (response: GenerateSessionTitleResponse) => void,
  ) => void;
  'settings:set_remote_control': (payload: ChatSetRemoteControlPayload) => void;
  'chat:hook_respond': (payload: ChatHookCallbackRespondPayload) => void;
}

export interface ServerToClientEvents {
  // ── Per-channel broadcast events ──
  'chat:cancel_request': (payload: CancelRequestEventPayload) => void;
  'plan:comment_added': (payload: PlanCommentEventPayload) => void;
  'plan:comment_removed': (payload: RemoveCommentPayload) => void;
  'speech:message': (payload: SpeechToTextMessagePayload) => void;

  // ── Session lifecycle ──
  'session:close_channel': (payload: CloseChannelPayload) => void;
  'session:created': (payload: SessionCreatedPayload) => void;
  'session:closed': (payload: SessionClosedPayload) => void;
  'session:dead': (payload: SessionDeadPayload) => void;
  'session:resume': (payload: SessionResumePayload) => void;
  'session:states': (payload: SessionStatesPayload) => void;

  // ══════════════════════════════════════════════════════════
  // Named socket events (type:subtype format)
  // Each event has its own typed payload.
  // ══════════════════════════════════════════════════════════

  // ── Messages ──
  'message:assistant': (payload: MessageAssistantPayload) => void;
  'message:user': (payload: MessageUserPayload) => void;
  'message:result': (payload: MessageResultPayload) => void;

  // ── Streaming ──
  'stream:chunk': (payload: StreamChunkPayload) => void;
  'stream:end': (payload: StreamEndPayload) => void;
  'stream:text': (payload: StreamTextPayload) => void;
  'stream:tool_summary': (payload: StreamToolSummaryPayload) => void;
  'stream:block_start': (payload: StreamBlockStartPayload) => void;

  // ── Session (extends existing session:* pattern) ──
  'session:init': (payload: SessionInitPayload) => void;
  'session:status': (payload: SessionStatusPayload) => void;

  // ── Control ──
  'control:permission': (payload: ControlPermissionPayload) => void;
  'control:elicitation': (payload: ControlElicitationPayload) => void;
  'control:diff_review': (payload: ControlDiffReviewPayload) => void;
  'control:mcp': (payload: ControlMcpPayload) => void;
  'control:cancel': (payload: ControlCancelPayload) => void;
  'control:hook_callback': (payload: ControlHookCallbackPayload) => void;

  // ── System ──
  'system:hook_started': (payload: SystemHookStartedPayload) => void;
  'system:hook_response': (payload: SystemHookResponsePayload) => void;
  'system:task_started': (payload: SystemTaskStartedPayload) => void;
  'system:task_progress': (payload: SystemTaskProgressPayload) => void;
  'system:task_notification': (payload: SystemTaskNotificationPayload) => void;
  'system:compact_boundary': (payload: SystemCompactBoundaryPayload) => void;
  'system:rate_limit': (payload: SystemRateLimitPayload) => void;
  'system:api_retry': (payload: SystemApiRetryPayload) => void;
  'app:experiment_gates': (payload: SystemExperimentGatesPayload) => void;
  'app:models': (payload: SystemAvailableModelsPayload) => void;
  'system:remote_control': (payload: SystemRemoteControlPayload) => void;

  // ── Notifications ──
  'notification:toast': (payload: NotificationToastPayload) => void;
  'notification:show': (payload: NotificationShowPayload) => void;
  'notification:auth_url': (payload: NotificationAuthUrlPayload) => void;
  'notification:auth_status': (payload: NotificationAuthStatusPayload) => void;

  // ── Actions ──
  'action:open_url': (payload: ActionOpenUrlPayload) => void;
  'action:open_file': (payload: ActionOpenFilePayload) => void;

  // ── Error ──
  'error:message': (payload: ErrorMessagePayload) => void;

  // ── Raw / unknown ──
  'raw:event': (payload: RawEventPayload) => void;

  // ── State (replaces request-based state updates) ──
  'settings:update': (payload: UpdateStatePayload) => void;
  'settings:usage': (payload: StateUsagePayload) => void;
}
