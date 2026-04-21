import type {
  ActionOpenFilePayload,
  ActionOpenUrlPayload,
  AddMarketplacePayload,
  AuthStatus,
  CancelRequestEventPayload,
  CancelRequestPayload,
  ChannelIdPayload,
  ChatAskSideQuestionPayload,
  ChatCancelAsyncMessagePayload,
  ChatCancelPayload,
  ChatHookCallbackRespondPayload,
  ChatRespondPayload,
  ChatRewindCodePayload,
  ChatSendPayload,
  ChatStopTaskPayload,
  CloseChannelPayload,
  ControlCancelPayload,
  ControlDiffReviewPayload,
  ControlElicitationPayload,
  ControlHookCallbackPayload,
  ControlMcpPayload,
  ControlPermissionPayload,
  ControlResponse,
  CreateWorktreePayload,
  CreateWorktreeResponse,
  DeleteWorktreePayload,
  DisableChromeMcpResponse,
  DisableJupyterMcpResponse,
  EnableJupyterMcpResponse,
  EnsureChromeMcpResponse,
  ErrorMessagePayload,
  ExplorerBrowsePayload,
  ExplorerBrowseResponse,
  FileListPayload,
  FileReadPayload,
  FileReadResponse,
  ForkConversationResponse,
  GenerateSessionTitleResponse,
  GetPlanCommentsResponse,
  GetProviderConfigResponse,
  GetSessionResponse,
  GitCheckoutPayload,
  GitDiffPayload,
  GitDiffResult,
  GitExecPayload,
  GitExecResponse,
  GitLogPayload,
  GitLogResult,
  GitStatusPayload,
  GitStatusResult,
  GitUpdateSkippedBranchPayload,
  InitResponse,
  ListFilesResponse,
  ListMarketplacesResponse,
  ListPluginsPayload,
  ListPluginsResponse,
  ListWorktreesPayload,
  LoginPayload,
  MarketplaceResult,
  McpAuthenticatePayload,
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
  PlanCommentPayload,
  PlanRemoveCommentPayload,
  PluginInstallPayload,
  PluginReloadPayload,
  PluginReloadRequestPayload,
  PluginReloadResult,
  PluginResult,
  PluginTogglePayload,
  PluginUninstallPayload,
  RawEventPayload,
  RawEventsResponse,
  RefreshMarketplacePayload,
  RemoveMarketplacePayload,
  RewindResult,
  RpcResult,
  SessionClosedPayload,
  SessionClosePayload,
  SessionCreatedPayload,
  SessionDeadPayload,
  SessionDeletePayload,
  SessionForkPayload,
  SessionGenerateTitlePayload,
  SessionGetPayload,
  SessionInitPayload,
  SessionJoinPayload,
  SessionJoinResponse,
  SessionLaunchPayload,
  SessionLaunchResponse,
  SessionListPayload,
  SessionListRemotePayload,
  SessionListResponse,
  SessionRenamePayload,
  SessionResumePayload,
  SessionResumeResponse,
  SessionStatesPayload,
  SessionStatusPayload,
  SessionTeleportPayload,
  SessionUpdateStatePayload,
  SettingsApplyPayload,
  SettingsGetStatePayload,
  SettingsSetModelPayload,
  SettingsSetPermissionModePayload,
  SettingsSetProactivePayload,
  SettingsSetRemoteControlPayload,
  SettingsSetThinkingLevelPayload,
  SideQuestionResult,
  SpeechToTextMessagePayload,
  StateUsagePayload,
  StreamBlockStartPayload,
  StreamChunkPayload,
  StreamEndPayload,
  StreamTextPayload,
  StreamToolSummaryPayload,
  SystemApiRetryPayload,
  SystemAvailableModelsPayload,
  SystemCompactBoundaryPayload,
  SystemExperimentGatesPayload,
  SystemHookResponsePayload,
  SystemHookStartedPayload,
  SystemMirrorErrorPayload,
  SystemRateLimitPayload,
  SystemRemoteControlPayload,
  SystemTaskNotificationPayload,
  SystemTaskProgressPayload,
  SystemTaskStartedPayload,
  TeleportSessionResponse,
  TerminalGetContentsPayload,
  TerminalGetContentsResponse,
  TerminalOpenClaudePayload,
  UpdateStatePayload,
  WorktreeListResponse,
} from './schemas/index.ts';

export interface ClientToServerEvents {
  // ── Chat Operations ──
  'chat:rewind_code': (
    payload: ChatRewindCodePayload,
    callback: (response: RpcResult<RewindResult>) => void,
  ) => void;
  'chat:ask_side_question': (
    payload: ChatAskSideQuestionPayload,
    callback: (response: RpcResult<SideQuestionResult>) => void,
  ) => void;

  // ── Aligned: Settings ──
  'settings:set_model': (
    payload: SettingsSetModelPayload,
    cb: (res: RpcResult<Record<string, never>>) => void,
  ) => void;
  'settings:set_permission_mode': (payload: SettingsSetPermissionModePayload) => void;
  'settings:set_thinking_level': (payload: SettingsSetThinkingLevelPayload) => void;
  'settings:refresh_usage': (payload: ChannelIdPayload) => void;
  'settings:apply': (
    payload: SettingsApplyPayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'settings:state': (
    payload: SettingsGetStatePayload,
    callback: (response: RpcResult<{ state: Record<string, unknown> }>) => void,
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
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'session:delete': (
    payload: SessionDeletePayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'session:update_state': (
    payload: SessionUpdateStatePayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
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
    callback: (result: RpcResult<{ authUrl?: string }>) => void,
  ) => void;
  'mcp:clear_auth': (
    payload: McpAuthenticatePayload,
    callback: (result: RpcResult<Record<string, never>>) => void,
  ) => void;
  'mcp:oauth_callback': (
    payload: McpOAuthCallbackPayload,
    callback: (result: RpcResult<Record<string, never>>) => void,
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
    payload: ChannelIdPayload,
    callback: (response: EnsureChromeMcpResponse) => void,
  ) => void;
  'mcp:disable_chrome': (
    payload: ChannelIdPayload,
    callback: (response: DisableChromeMcpResponse) => void,
  ) => void;
  'mcp:enable_jupyter': (
    payload: ChannelIdPayload,
    callback: (response: EnableJupyterMcpResponse) => void,
  ) => void;
  'mcp:disable_jupyter': (
    payload: ChannelIdPayload,
    callback: (response: DisableJupyterMcpResponse) => void,
  ) => void;
  'mcp:ask_debugger': (
    payload: ChannelIdPayload,
    callback: (response: RpcResult<{ response: { type: 'ask_debugger_help_response' } }>) => void,
  ) => void;

  // ── Explorer (global, no channel) ──
  'explorer:browse': (
    payload: ExplorerBrowsePayload,
    callback: (response: ExplorerBrowseResponse) => void,
  ) => void;

  // ── Aligned: File & Git ──
  'file:list': (payload: FileListPayload, callback: (response: ListFilesResponse) => void) => void;
  'git:checkout': (
    payload: GitCheckoutPayload,
    callback: (result: RpcResult<Record<string, never>>) => void,
  ) => void;
  'git:status': (payload: GitStatusPayload, callback: (result: GitStatusResult) => void) => void;
  'git:update_skipped_branch': (
    payload: GitUpdateSkippedBranchPayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'git:exec': (payload: GitExecPayload, callback: (response: GitExecResponse) => void) => void;

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
  'plugin:reload': (
    payload: PluginReloadRequestPayload,
    callback: (result: PluginReloadResult) => void,
  ) => void;

  // ── Aligned: Auth ──
  'auth:status': (callback: (result: AuthStatus) => void) => void;
  'auth:login': (
    payload: LoginPayload,
    callback: (result: RpcResult<{ auth?: unknown }>) => void,
  ) => void;
  'auth:oauth_code': (
    payload: OAuthCodePayload,
    callback: (result: RpcResult<Record<string, never>>) => void,
  ) => void;

  // ── Aligned: Plan ──
  'plan:comment': (
    payload: PlanCommentPayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'plan:comments': (
    payload: ChannelIdPayload,
    callback: (response: GetPlanCommentsResponse) => void,
  ) => void;
  'plan:remove_comment': (
    payload: PlanRemoveCommentPayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
  'plan:close_preview': (
    payload: ChannelIdPayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;

  // ── File Operations ──
  'file:read': (payload: FileReadPayload, callback: (response: FileReadResponse) => void) => void;

  // ── Clean relay protocol: new C→S events ──
  'session:launch': (
    payload: SessionLaunchPayload,
    callback: (response: SessionLaunchResponse) => void,
  ) => void;
  'session:close': (payload: SessionClosePayload) => void;
  'session:resume': (
    payload: SessionResumePayload,
    callback: (response: SessionResumeResponse) => void,
  ) => void;
  'session:join': (
    payload: SessionJoinPayload,
    callback: (response: SessionJoinResponse) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:cancel': (payload: ChatCancelPayload) => void;
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
    callback: (response: RpcResult<{ channelId: string }>) => void,
  ) => void;

  // ── Aligned: Speech-to-Text ──
  'speech:start': (payload: ChannelIdPayload) => void;
  'speech:stop': (payload: ChannelIdPayload) => void;

  // ── Protocol Alignment: new control_request subtypes ──
  'chat:cancel_async': (payload: ChatCancelAsyncMessagePayload) => void;
  'settings:set_proactive': (payload: SettingsSetProactivePayload) => void;
  'session:generate_title': (
    payload: SessionGenerateTitlePayload,
    callback: (response: GenerateSessionTitleResponse) => void,
  ) => void;
  'settings:set_remote_control': (payload: SettingsSetRemoteControlPayload) => void;
  'chat:hook_respond': (payload: ChatHookCallbackRespondPayload) => void;

  // ── Worktree ──
  'worktree:create': (
    payload: CreateWorktreePayload,
    callback: (response: CreateWorktreeResponse) => void,
  ) => void;
  'worktree:list': (
    payload: ListWorktreesPayload,
    callback: (response: WorktreeListResponse) => void,
  ) => void;
  'worktree:delete': (
    payload: DeleteWorktreePayload,
    callback: (response: RpcResult<Record<string, never>>) => void,
  ) => void;
}

// ── ClientMessage discriminated union ──
// Producer-side (summoner transform → server Channel) message envelope.
// Each variant binds a precise payload; runtime validation lives in the
// corresponding wire schema (or internal-only schema) exported from ./schemas.

/** Strip channelId — Channel layer injects it post-emit. */
type WireBase<K extends keyof ServerToClientEvents> = Omit<
  Parameters<ServerToClientEvents[K]>[0],
  'channelId'
>;

/** Names emitted by transforms but never sent on the wire directly — they
 * are handled by Channel/auto-respond server handlers, NOT by clients. */
interface InternalOnlyMessageMap {
  'control:open_diff': {
    requestId: string;
    originalPath: string;
    newPath: string;
  };
  'control:forward': {
    requestId: string;
    subtype: string;
    toolName?: string;
    toolUseId?: string;
    input?: unknown;
    suggestions?: unknown[];
    callbackId?: string;
  };
  'mcp:auto_respond': {
    requestId: string;
    response: { mcp_response: Record<string, unknown> };
  };
  'settings:get_settings': { requestId: string };
  'settings:model_updated': { requestId: string; input?: Record<string, unknown> };
  'settings:permission_mode_updated': { requestId: string; input?: Record<string, unknown> };
}

/** Wire events whose producer payload differs from the wire payload
 * (extra scaffolding fields consumed server-side before socket emit). */
interface ProducerOverrideMap {
  // sessionId carried for Channel.handleInternalMessage
  'session:init': Omit<WireBase<'session:init'>, 'config'> & {
    sessionId?: string;
    config?: Record<string, unknown>;
  };
  // Producer adds requestId + response scaffolding for auto-respond handler
  'notification:show': Omit<WireBase<'notification:show'>, 'severity' | 'buttons'> & {
    requestId: string;
    severity: 'info' | 'warning' | 'error';
    buttons?: unknown[];
    response: { type: 'show_notification_response' };
  };
  'action:open_url': WireBase<'action:open_url'> & {
    requestId: string;
    response: { type: 'open_url_response' };
  };
  'action:open_file': WireBase<'action:open_file'> & {
    requestId: string;
    response: { type: 'open_file_response' };
  };
  // Producer uses numeric utilization; wire RateLimitInfo has Record<string,unknown>.
  // Kept as producer-side shape here — server-side normalization converts before wire emit.
  'system:rate_limit': {
    info: {
      status: string;
      rateLimitType?: string;
      resetsAt?: string;
      utilization?: number;
      overageStatus?: string;
      isUsingOverage?: boolean;
    };
  };
}

/** Server-only events never produced by a transform — excluded from the union. */
type TransformOmittedWireEvents =
  | 'chat:cancel_request'
  | 'plan:comment_added'
  | 'plan:comment_removed'
  | 'session:close_channel'
  | 'session:created'
  | 'session:closed'
  | 'session:dead'
  | 'session:states'
  | 'control:diff_review'
  | 'settings:update'
  | 'settings:usage';

type StraightWireMap = {
  [K in Exclude<
    keyof ServerToClientEvents,
    keyof ProducerOverrideMap | TransformOmittedWireEvents
  >]: WireBase<K>;
};

export interface MessagePayloadMap
  extends InternalOnlyMessageMap,
    ProducerOverrideMap,
    StraightWireMap {}

export type ClientMessage = {
  [K in keyof MessagePayloadMap]: { name: K; payload: MessagePayloadMap[K] };
}[keyof MessagePayloadMap];

export interface ServerToClientEvents {
  // ── Per-channel broadcast events ──
  'chat:cancel_request': (payload: CancelRequestEventPayload) => void;
  'plan:comment_added': (payload: PlanCommentPayload) => void;
  'plan:comment_removed': (payload: PlanRemoveCommentPayload) => void;
  'speech:message': (payload: SpeechToTextMessagePayload) => void;

  // ── Session lifecycle ──
  'session:close_channel': (payload: CloseChannelPayload) => void;
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
  'app:experiment_gates': (payload: SystemExperimentGatesPayload) => void;
  'app:models': (payload: SystemAvailableModelsPayload) => void;
  'system:remote_control': (payload: SystemRemoteControlPayload) => void;
  'system:mirror_error': (payload: SystemMirrorErrorPayload) => void;
  'plugin:reloaded': (payload: PluginReloadPayload) => void;

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

/**
 * Centralised socket event names. Use `EVENTS.<ns>.<name>` instead of
 * bare string literals so typos are caught at type-check time and
 * renames flow through a single source.
 */
export const EVENTS = {
  action: {
    open_file: 'action:open_file',
    open_url: 'action:open_url',
  },
  app: {
    config: 'app:config',
    experiment_gates: 'app:experiment_gates',
    init: 'app:init',
    models: 'app:models',
  },
  auth: {
    login: 'auth:login',
    oauth_code: 'auth:oauth_code',
    status: 'auth:status',
  },
  chat: {
    ask_side_question: 'chat:ask_side_question',
    cancel: 'chat:cancel',
    cancel_async: 'chat:cancel_async',
    cancel_request: 'chat:cancel_request',
    hook_respond: 'chat:hook_respond',
    respond: 'chat:respond',
    rewind_code: 'chat:rewind_code',
    send: 'chat:send',
    stop_task: 'chat:stop_task',
  },
  control: {
    cancel: 'control:cancel',
    diff_review: 'control:diff_review',
    elicitation: 'control:elicitation',
    forward: 'control:forward',
    hook_callback: 'control:hook_callback',
    mcp: 'control:mcp',
    open_diff: 'control:open_diff',
    permission: 'control:permission',
  },
  error: {
    message: 'error:message',
  },
  explorer: {
    browse: 'explorer:browse',
  },
  file: {
    list: 'file:list',
    read: 'file:read',
  },
  git: {
    checkout: 'git:checkout',
    diff: 'git:diff',
    exec: 'git:exec',
    log: 'git:log',
    status: 'git:status',
    update_skipped_branch: 'git:update_skipped_branch',
  },
  mcp: {
    ask_debugger: 'mcp:ask_debugger',
    authenticate: 'mcp:authenticate',
    auto_respond: 'mcp:auto_respond',
    clear_auth: 'mcp:clear_auth',
    disable_chrome: 'mcp:disable_chrome',
    disable_jupyter: 'mcp:disable_jupyter',
    enable_jupyter: 'mcp:enable_jupyter',
    ensure_chrome: 'mcp:ensure_chrome',
    message: 'mcp:message',
    oauth_callback: 'mcp:oauth_callback',
    reconnect: 'mcp:reconnect',
    servers: 'mcp:servers',
    set_servers: 'mcp:set_servers',
    toggle: 'mcp:toggle',
  },
  message: {
    assistant: 'message:assistant',
    result: 'message:result',
    user: 'message:user',
  },
  notification: {
    auth_status: 'notification:auth_status',
    auth_url: 'notification:auth_url',
    show: 'notification:show',
    toast: 'notification:toast',
  },
  plan: {
    close_preview: 'plan:close_preview',
    comment: 'plan:comment',
    comment_added: 'plan:comment_added',
    comment_removed: 'plan:comment_removed',
    comments: 'plan:comments',
    remove_comment: 'plan:remove_comment',
  },
  plugin: {
    add_marketplace: 'plugin:add_marketplace',
    install: 'plugin:install',
    list: 'plugin:list',
    list_marketplaces: 'plugin:list_marketplaces',
    refresh_marketplace: 'plugin:refresh_marketplace',
    reload: 'plugin:reload',
    reloaded: 'plugin:reloaded',
    remove_marketplace: 'plugin:remove_marketplace',
    toggle: 'plugin:toggle',
    uninstall: 'plugin:uninstall',
  },
  raw: {
    event: 'raw:event',
  },
  session: {
    close: 'session:close',
    close_channel: 'session:close_channel',
    closed: 'session:closed',
    created: 'session:created',
    dead: 'session:dead',
    delete: 'session:delete',
    fork: 'session:fork',
    generate_title: 'session:generate_title',
    get: 'session:get',
    init: 'session:init',
    join: 'session:join',
    launch: 'session:launch',
    list: 'session:list',
    list_remote: 'session:list_remote',
    raw_events: 'session:raw_events',
    rename: 'session:rename',
    resume: 'session:resume',
    states: 'session:states',
    status: 'session:status',
    teleport: 'session:teleport',
    update_state: 'session:update_state',
  },
  settings: {
    apply: 'settings:apply',
    get_settings: 'settings:get_settings',
    model_updated: 'settings:model_updated',
    permission_mode_updated: 'settings:permission_mode_updated',
    refresh_usage: 'settings:refresh_usage',
    set_model: 'settings:set_model',
    set_permission_mode: 'settings:set_permission_mode',
    set_proactive: 'settings:set_proactive',
    set_remote_control: 'settings:set_remote_control',
    set_thinking_level: 'settings:set_thinking_level',
    state: 'settings:state',
    update: 'settings:update',
    usage: 'settings:usage',
  },
  speech: {
    message: 'speech:message',
    start: 'speech:start',
    stop: 'speech:stop',
  },
  stream: {
    block_start: 'stream:block_start',
    chunk: 'stream:chunk',
    end: 'stream:end',
    text: 'stream:text',
    tool_summary: 'stream:tool_summary',
  },
  system: {
    api_retry: 'system:api_retry',
    compact_boundary: 'system:compact_boundary',
    hook_response: 'system:hook_response',
    hook_started: 'system:hook_started',
    mirror_error: 'system:mirror_error',
    rate_limit: 'system:rate_limit',
    remote_control: 'system:remote_control',
    task_notification: 'system:task_notification',
    task_progress: 'system:task_progress',
    task_started: 'system:task_started',
  },
  terminal: {
    open_claude: 'terminal:open_claude',
    read: 'terminal:read',
  },
  worktree: {
    create: 'worktree:create',
    delete: 'worktree:delete',
    list: 'worktree:list',
  },
} as const satisfies Record<string, Record<string, string>>;
