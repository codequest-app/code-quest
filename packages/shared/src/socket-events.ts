import type {
  ContentBlock,
  HookResponseInfo,
  HookStartedInfo,
  RateLimitInfo,
  RemoteControlStateInfo,
  SessionStats,
  StreamChunk,
} from './event-types.ts';
import type {
  AddMarketplacePayload,
  AskDebuggerHelpResponse,
  AuthResult,
  AuthStatus,
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
  ControlResponse,
  DebuggerHelpPayload,
  DisableChromeMcpResponse,
  DisableJupyterMcpResponse,
  EnableJupyterMcpResponse,
  EnsureChromeMcpResponse,
  ExecResponse,
  FileListPayload,
  FileReadPayload,
  FileReadResponse,
  ForkConversationResponse,
  GenerateSessionTitleResponse,
  GetClaudeStateResponse,
  GetPlanCommentsResponse,
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
  OAuthCodePayload,
  PlanClosePreviewPayload,
  PlanCommentData,
  PlanCommentPayload,
  PlanGetCommentsPayload,
  PlanRemoveCommentPayload,
  PluginInstallPayload,
  PluginResult,
  PluginTogglePayload,
  PluginUninstallPayload,
  RawEventsResponse,
  RefreshMarketplacePayload,
  RemoveMarketplacePayload,
  SessionDeletePayload,
  SessionForkPayload,
  SessionGetPayload,
  SessionJoinResponse,
  SessionLaunchResponse,
  SessionListPayload,
  SessionListRemotePayload,
  SessionListResponse,
  SessionRenamePayload,
  SessionStateSummary,
  SessionTeleportPayload,
  SessionUpdateStatePayload,
  SettingsApplyPayload,
  SuccessResponse,
  TeleportSessionResponse,
  TerminalGetContentsPayload,
  TerminalGetContentsResponse,
  TerminalOpenClaudePayload,
  TerminalOpenClaudeResponse,
  UpdateStatePayload,
  UsageQuota,
} from './schemas/chat.ts';

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
  close_channel: (payload: { channelId: string; error?: string }) => void;
  cancel_request: (payload: { channelId: string; targetRequestId: string }) => void;
  file_updated: (payload: {
    channelId: string;
    filePath: string;
    oldContent?: string | null;
    newContent?: string | null;
  }) => void;
  plan_comment: (payload: { channelId: string; comment: PlanCommentData }) => void;
  removeComment: (payload: { channelId: string; commentId: string }) => void;

  // ── Aligned: Speech-to-Text ──
  speech_to_text_message: (payload: { channelId: string; text: string; done: boolean }) => void;

  // ── Session lifecycle ──
  'session:created': (payload: { channelId: string }) => void;
  'session:closed': (payload: { channelId: string; error?: string }) => void;
  'session:dead': (payload: { channelId: string }) => void;
  'session:states': (payload: {
    sessions: SessionStateSummary[];
    activeSessionId?: string;
  }) => void;

  // ══════════════════════════════════════════════════════════
  // Named socket events (type:subtype format)
  // Each event has its own typed payload.
  // ══════════════════════════════════════════════════════════

  // ── Messages ──
  'message:assistant': (payload: {
    channelId: string;
    content: ContentBlock[];
    parentToolUseId?: string;
  }) => void;
  'message:user': (payload: {
    channelId: string;
    content: ContentBlock[];
    parentToolUseId?: string;
  }) => void;
  'message:result': (payload: {
    channelId: string;
    stats: SessionStats;
    errors?: string[];
    isError?: boolean;
    subtype?: string;
  }) => void;

  // ── Streaming ──
  'stream:chunk': (payload: {
    channelId: string;
    chunk: StreamChunk;
    parentToolUseId?: string;
  }) => void;
  'stream:end': (payload: { channelId: string }) => void;
  'stream:text': (payload: { channelId: string; text: string }) => void;
  'stream:tool_summary': (payload: { channelId: string; toolSummary: string }) => void;
  'stream:block_start': (payload: {
    channelId: string;
    index: number;
    blockType: string;
    contentBlock?: Record<string, unknown>;
    parentToolUseId?: string;
  }) => void;

  // ── Session (extends existing session:* pattern) ──
  'session:init': (payload: {
    channelId: string;
    sessionId: string;
    model?: string;
    tools?: string[];
    permissionMode?: string;
    fastModeState?: unknown;
    slashCommands?: string[];
    mcpServers?: Array<{ name: string; status: string }>;
    config: Record<string, unknown>;
  }) => void;
  'session:status': (payload: {
    channelId: string;
    status: string;
    permissionMode?: string;
  }) => void;

  // ── Control ──
  'control:permission': (payload: {
    channelId: string;
    requestId: string;
    toolName: string;
    toolUseId?: string;
    input: unknown;
    suggestions?: unknown[];
    callbackId?: string;
    blockedPath?: string;
    decisionReason?: string;
    agentId?: string;
  }) => void;
  'control:elicitation': (payload: {
    channelId: string;
    requestId: string;
    prompt: string;
    inputType: 'text' | 'url' | 'select';
    options?: string[];
    url?: string;
    elicitationId?: string;
    mcpServerName?: string;
    requestedSchema?: Record<string, unknown>;
  }) => void;
  'control:diff_review': (payload: {
    channelId: string;
    requestId?: string;
    toolId: string;
    filePath: string;
    oldContent: string;
    newContent: string;
  }) => void;
  'control:mcp': (payload: {
    channelId: string;
    requestId: string;
    serverName: string;
    message: Record<string, unknown>;
  }) => void;
  'control:cancel': (payload: { channelId: string; requestId: string }) => void;
  'control:hook_callback': (payload: {
    channelId: string;
    requestId: string;
    callbackId: string;
    input: unknown;
    toolUseId?: string;
  }) => void;

  // ── System ──
  'system:hook_started': (payload: { channelId: string; hook: HookStartedInfo }) => void;
  'system:hook_response': (payload: { channelId: string; hook: HookResponseInfo }) => void;
  'system:task_started': (payload: {
    channelId: string;
    description: string;
    taskType?: string;
  }) => void;
  'system:task_progress': (payload: {
    channelId: string;
    taskId: string;
    toolUseId?: string;
    description?: string;
    lastToolName?: string;
    usage?: Record<string, unknown>;
  }) => void;
  'system:task_notification': (payload: {
    channelId: string;
    taskId: string;
    toolUseId?: string;
    status?: string;
    outputFile?: string;
    summary?: string;
    usage?: Record<string, unknown>;
  }) => void;
  'system:compact_boundary': (payload: { channelId: string; preservedSegment?: boolean }) => void;
  'system:rate_limit': (payload: { channelId: string; info: RateLimitInfo }) => void;
  'system:api_retry': (payload: {
    channelId: string;
    attempt: number;
    maxRetries: number;
    retryDelayMs?: number;
    errorStatus?: number;
    error?: string;
  }) => void;
  'system:file_updated': (payload: {
    channelId: string;
    filePath: string;
    oldContent?: string | null;
    newContent?: string | null;
  }) => void;
  'system:experiment_gates': (payload: {
    channelId: string;
    gates: Record<string, unknown>;
  }) => void;
  'system:available_models': (payload: { channelId: string; models: unknown[] }) => void;
  'system:remote_control': (payload: { channelId: string; info: RemoteControlStateInfo }) => void;

  // ── Notifications ──
  'notification:toast': (payload: { channelId: string; message: string }) => void;
  'notification:show': (payload: {
    channelId: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    buttons?: string[];
    onlyIfNotVisible?: boolean;
  }) => void;
  'notification:auth_url': (payload: { channelId: string; url: string; method: string }) => void;
  'notification:auth_status': (payload: {
    channelId: string;
    status: string;
    output?: string;
    account?: Record<string, unknown>;
  }) => void;

  // ── Actions ──
  'action:open_url': (payload: { channelId: string; url: string }) => void;
  'action:open_file': (payload: {
    channelId: string;
    filePath: string;
    location?: { startLine?: number; endLine?: number; searchText?: string };
  }) => void;

  // ── Error ──
  'error:message': (payload: { channelId: string; message: string }) => void;

  // ── Raw / unknown ──
  'raw:event': (payload: {
    channelId: string;
    rawType: string;
    data: Record<string, unknown>;
  }) => void;

  // ── State (replaces request-based state updates) ──
  'state:update': (payload: UpdateStatePayload) => void;
  'state:usage': (payload: { channelId: string; usage: UsageQuota }) => void;
}
