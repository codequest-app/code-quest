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
  ChatSetFastModePayload,
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
  FileUpdatedPayload,
  ForkConversationResponse,
  GenerateSessionTitleResponse,
  GetClaudeStateResponse,
  GetPlanCommentsResponse,
  GetProviderConfigResponse,
  GetSessionResponse,
  GitCheckoutPayload,
  GitCheckoutResult,
  GitDiffResult,
  GitExecPayload,
  GitLogPayload,
  GitLogResult,
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
  SystemFileUpdatedPayload,
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
  rewind_code: (
    payload: ChatRewindCodePayload,
    callback: (response: ControlResponse) => void,
  ) => void;

  // ── Aligned: Settings ──
  set_model: (payload: ChatSetModelPayload, cb: (res: SuccessResponse) => void) => void;
  set_permission_mode: (payload: ChatSetPermissionModePayload) => void;
  set_thinking_level: (payload: ChatSetThinkingLevelPayload) => void;
  request_usage_update: (payload: ChannelIdPayload) => void;
  apply_settings: (
    payload: SettingsApplyPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  get_claude_state: (
    payload: ChatGetStatePayload,
    callback: (response: GetClaudeStateResponse) => void,
  ) => void;

  // ── Aligned: Session Management ──
  list_sessions_request: (
    payload: SessionListPayload,
    callback: (response: SessionListResponse) => void,
  ) => void;
  list_remote_sessions: (
    payload: SessionListRemotePayload,
    callback: (response: SessionListResponse) => void,
  ) => void;
  get_session_request: (
    payload: SessionGetPayload,
    callback: (response: GetSessionResponse) => void,
  ) => void;
  teleport_session: (
    payload: SessionTeleportPayload,
    callback: (response: TeleportSessionResponse) => void,
  ) => void;
  fork_conversation: (
    payload: SessionForkPayload,
    callback: (response: ForkConversationResponse) => void,
  ) => void;
  rename_session: (
    payload: SessionRenamePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  delete_session: (
    payload: SessionDeletePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  update_session_state: (
    payload: SessionUpdateStatePayload,
    callback: (response: SuccessResponse) => void,
  ) => void;

  // ── Aligned: MCP ──
  get_mcp_servers: (
    payload: McpGetServersPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  set_mcp_server_enabled: (
    payload: McpSetEnabledPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  reconnect_mcp_server: (
    payload: McpReconnectPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  authenticate_mcp_server: (
    payload: McpAuthenticatePayload,
    callback: (result: McpAuthResult) => void,
  ) => void;
  clear_mcp_server_auth: (
    payload: McpAuthenticatePayload,
    callback: (result: SuccessResponse) => void,
  ) => void;
  submit_mcp_oauth_callback_url: (
    payload: McpOAuthCallbackPayload,
    callback: (result: SuccessResponse) => void,
  ) => void;
  mcp_set_servers: (
    payload: McpSetServersPayload,
    callback: (response: ControlResponse) => void,
  ) => void;
  mcp_message: (payload: McpMessagePayload, callback: (response: ControlResponse) => void) => void;
  ensure_chrome_mcp_enabled: (
    payload: ChromeMcpControlPayload,
    callback: (response: EnsureChromeMcpResponse) => void,
  ) => void;
  disable_chrome_mcp: (
    payload: ChromeMcpControlPayload,
    callback: (response: DisableChromeMcpResponse) => void,
  ) => void;
  enable_jupyter_mcp: (
    payload: JupyterMcpControlPayload,
    callback: (response: EnableJupyterMcpResponse) => void,
  ) => void;
  disable_jupyter_mcp: (
    payload: JupyterMcpControlPayload,
    callback: (response: DisableJupyterMcpResponse) => void,
  ) => void;
  ask_debugger_help: (
    payload: DebuggerHelpPayload,
    callback: (response: AskDebuggerHelpResponse) => void,
  ) => void;

  // ── Aligned: File & Git ──
  list_files_request: (
    payload: FileListPayload,
    callback: (response: ListFilesResponse) => void,
  ) => void;
  checkout_branch: (
    payload: GitCheckoutPayload,
    callback: (result: GitCheckoutResult) => void,
  ) => void;
  check_git_status: (callback: (result: GitStatusResult) => void) => void;
  update_skipped_branch: (
    payload: GitUpdateSkippedBranchPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  exec: (payload: GitExecPayload, callback: (response: ExecResponse) => void) => void;

  // ── Aligned: Plugin ──
  list_plugins: (
    payload: ListPluginsPayload,
    callback: (result: ListPluginsResponse) => void,
  ) => void;
  install_plugin: (payload: PluginInstallPayload, callback: (result: PluginResult) => void) => void;
  uninstall_plugin: (
    payload: PluginUninstallPayload,
    callback: (result: PluginResult) => void,
  ) => void;
  set_plugin_enabled: (
    payload: PluginTogglePayload,
    callback: (result: PluginResult) => void,
  ) => void;
  list_marketplaces: (callback: (result: ListMarketplacesResponse) => void) => void;
  add_marketplace: (
    payload: AddMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;
  remove_marketplace: (
    payload: RemoveMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;
  refresh_marketplace: (
    payload: RefreshMarketplacePayload,
    callback: (result: MarketplaceResult) => void,
  ) => void;

  // ── Aligned: Auth ──
  get_auth_status: (callback: (result: AuthStatus) => void) => void;
  login: (payload: LoginPayload, callback: (result: AuthResult) => void) => void;
  submit_oauth_code: (payload: OAuthCodePayload, callback: (result: AuthResult) => void) => void;

  // ── Aligned: Plan ──
  comment: (payload: PlanCommentPayload, callback: (response: SuccessResponse) => void) => void;
  get_plan_comments: (
    payload: PlanGetCommentsPayload,
    callback: (response: GetPlanCommentsResponse) => void,
  ) => void;
  remove_plan_comment: (
    payload: PlanRemoveCommentPayload,
    callback: (response: SuccessResponse) => void,
  ) => void;
  close_plan_preview: (
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
  'session:join': (
    payload: ChatJoinPayload,
    callback: (response: SessionJoinResponse) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:cancel': (payload: ChatInterruptPayload) => void;
  'chat:respond': (payload: ChatRespondPayload) => void;

  'chat:stop_task': (payload: ChatStopTaskPayload) => void;
  'chat:set_fast_mode': (payload: ChatSetFastModePayload) => void;
  'session:raw_events': (
    payload: ChannelIdPayload,
    callback: (response: RawEventsResponse) => void,
  ) => void;
  'git:log': (payload: GitLogPayload, callback: (result: GitLogResult) => void) => void;
  'git:diff': (callback: (result: GitDiffResult) => void) => void;
  init: (callback: (response: InitResponse) => void) => void;
  cancel_request: (payload: CancelRequestPayload) => void;
  get_provider_config: (
    payload: ChannelIdPayload,
    callback: (response: GetProviderConfigResponse) => void,
  ) => void;
  'terminal:get_contents': (
    payload: TerminalGetContentsPayload,
    callback: (response: TerminalGetContentsResponse) => void,
  ) => void;
  'terminal:open_claude': (
    payload: TerminalOpenClaudePayload,
    callback: (response: TerminalOpenClaudeResponse) => void,
  ) => void;

  // ── Aligned: Speech-to-Text ──
  start_speech_to_text: (payload: ChannelIdPayload) => void;
  stop_speech_to_text: (payload: ChannelIdPayload) => void;

  // ── Protocol Alignment: new control_request subtypes ──
  cancel_async_message: (payload: ChatCancelAsyncMessagePayload) => void;
  set_proactive: (payload: ChatSetProactivePayload) => void;
  generate_session_title: (
    payload: ChatGenerateSessionTitlePayload,
    callback: (response: GenerateSessionTitleResponse) => void,
  ) => void;
  set_remote_control: (payload: ChatSetRemoteControlPayload) => void;
  hook_callback_respond: (payload: ChatHookCallbackRespondPayload) => void;
}

export interface ServerToClientEvents {
  // ── Direct streaming events (per-channel content) ──
  close_channel: (payload: CloseChannelPayload) => void;
  cancel_request: (payload: CancelRequestEventPayload) => void;
  file_updated: (payload: FileUpdatedPayload) => void;
  plan_comment: (payload: PlanCommentEventPayload) => void;
  removeComment: (payload: RemoveCommentPayload) => void;

  // ── Aligned: Speech-to-Text ──
  speech_to_text_message: (payload: SpeechToTextMessagePayload) => void;

  // ── Session lifecycle ──
  'session:created': (payload: SessionCreatedPayload) => void;
  'session:closed': (payload: SessionClosedPayload) => void;
  'session:dead': (payload: SessionDeadPayload) => void;
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
  'system:file_updated': (payload: SystemFileUpdatedPayload) => void;
  'system:experiment_gates': (payload: SystemExperimentGatesPayload) => void;
  'system:available_models': (payload: SystemAvailableModelsPayload) => void;
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
  'state:update': (payload: UpdateStatePayload) => void;
  'state:usage': (payload: StateUsagePayload) => void;
}
