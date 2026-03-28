import type {
  ContentBlock,
  HookResponseInfo,
  HookStartedInfo,
  RateLimitInfo,
  RemoteControlStateInfo,
  SessionStats,
  SocketEvent,
  StreamChunk,
} from './event-types.ts';
import type {
  ChatCreatePayload,
  ChatGetStatePayload,
  ChatInterruptPayload,
  ChatJoinPayload,
  ChatKillPayload,
  ChatRewindCodePayload,
  ChatSendPayload,
  ChatSetFastModePayload,
  ChatSetModelPayload,
  ChatSetPermissionModePayload,
  ChatSetThinkingLevelPayload,
  ChatStopTaskPayload,
  ChromeMcpControlPayload,
  DebuggerHelpPayload,
  GitExecPayload,
  GitUpdateSkippedBranchPayload,
  JupyterMcpControlPayload,
  McpGetServersPayload,
  McpMessagePayload,
  McpOAuthCallbackPayload,
  McpReconnectPayload,
  McpSetEnabledPayload,
  McpSetServersPayload,
  PlanClosePreviewPayload,
  PlanCommentData,
  PlanCommentPayload,
  PlanGetCommentsPayload,
  PlanRemoveCommentPayload,
  SessionDeletePayload,
  SessionForkPayload,
  SessionGetPayload,
  SessionListPayload,
  SessionListRemotePayload,
  SessionRenamePayload,
  SessionTeleportPayload,
  SessionUpdateStatePayload,
  SettingsApplyPayload,
} from './schemas/chat.ts';

export interface ModelUsageEntry {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  costUSD?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  numTurns?: number;
  modelUsage?: Record<string, ModelUsageEntry>;
  contextWindow?: number;
}

export interface NotificationButton {
  label: string;
  value: string;
}

export interface NotificationPayload {
  id: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
  buttons?: NotificationButton[];
  onlyIfNotVisible?: boolean;
}

export interface NotificationResponse {
  buttonValue?: string;
  [key: string]: unknown;
}

export interface SessionSummary {
  id: string;
  provider: string;
  command: string;
  args: string;
  cwd?: string;
  mode: string;
  role: string;
  parentId?: string;
  title?: string;
  createdAt: string;
  isActive?: boolean;
  firstUserMessage?: string;
  lastAssistantMessage?: string;
}

export interface UsageQuotaTier {
  utilization: number;
  resets_at?: string;
}

export interface UsageQuota {
  five_hour?: UsageQuotaTier;
  seven_day?: UsageQuotaTier;
  seven_day_sonnet?: UsageQuotaTier;
  extra_usage?: {
    is_enabled: boolean;
    monthly_limit?: number;
    used_credits?: number;
    utilization?: number;
    overageStatus?: string;
  };
}

export interface FileSearchResult {
  path: string;
  name: string;
  type: 'file' | 'directory' | 'terminal';
}

export interface GitFileChange {
  status: string; // M, A, D, etc.
  file: string;
}

export interface GitStatusResult {
  branch: string;
  isClean: boolean;
  changedFiles: GitFileChange[];
}

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitLogResult {
  entries: GitLogEntry[];
}

export interface GitDiffResult {
  diff: string;
}

export interface GitCheckoutPayload {
  branch: string;
}

export interface GitCheckoutResult {
  success: boolean;
  error?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: { name: string; email?: string };
  method?: 'api_key' | 'oauth';
}

export interface AccountInfo {
  model?: string;
  email?: string;
  subscriptionType?: string;
  authMethod?: string;
  organization?: string;
}

export interface LoginPayload {
  method: 'api_key' | 'oauth';
}

export interface OAuthCodePayload {
  code: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  authUrl?: string;
  auth?: {
    authenticated: boolean;
    user?: { name: string; email?: string };
    method?: string;
  };
}

export interface McpAuthenticatePayload {
  channelId: string;
  serverName: string;
}
export interface McpAuthResult {
  success: boolean;
  authUrl?: string;
  error?: string;
}

export interface PluginInfo {
  id: string;
  version: string;
  scope: string;
  enabled: boolean;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

export interface AvailablePlugin {
  pluginId: string;
  name: string;
  description?: string;
  marketplaceName: string;
  version: string;
  source: string;
  installCount?: number;
}

export interface PluginInstallPayload {
  pluginId: string;
  scope?: 'user' | 'project' | 'local' | 'workspace';
}

export interface PluginTogglePayload {
  pluginId: string;
  enabled: boolean;
}

export interface PluginResult {
  success: boolean;
  needsRestart?: boolean;
  error?: string;
}

export type MarketplaceSourceConfig =
  | { source: 'npm'; package: string }
  | { source: 'github'; repo: string }
  | { source: 'git'; url: string }
  | { source: 'url'; url: string }
  | { source: 'directory'; path: string }
  | { source: 'file'; path: string }
  | { source: 'local'; path: string };

export interface MarketplaceInfo {
  name: string;
  config: {
    source: MarketplaceSourceConfig;
    installLocation: string;
  };
  pluginCount: number;
  installedCount: number;
}
export interface MarketplaceResult {
  success: boolean;
  error?: string;
}

export interface ClientToServerEvents {
  // ── Chat Operations ──
  rewind_code: (
    payload: ChatRewindCodePayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;

  // ── Aligned: Settings ──
  set_model: (
    payload: ChatSetModelPayload,
    cb: (res: { success: boolean; error?: string }) => void,
  ) => void;
  set_permission_mode: (payload: ChatSetPermissionModePayload) => void;
  set_thinking_level: (payload: ChatSetThinkingLevelPayload) => void;
  request_usage_update: (payload: { channelId: string }) => void;
  apply_settings: (
    payload: SettingsApplyPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  get_claude_state: (
    payload: ChatGetStatePayload,
    callback: (response: {
      success: boolean;
      state?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;

  // ── Aligned: Session Management ──
  list_sessions_request: (
    payload: SessionListPayload,
    callback: (response: { sessions: SessionSummary[]; total: number }) => void,
  ) => void;
  list_remote_sessions: (
    payload: SessionListRemotePayload,
    callback: (response: { sessions: SessionSummary[]; total: number }) => void,
  ) => void;
  get_session_request: (
    payload: SessionGetPayload,
    callback: (
      response:
        | {
            session: SessionSummary;
            events: SocketEvent[];
            meta: ChannelMetaCache;
          }
        | { error: string },
    ) => void,
  ) => void;
  teleport_session: (
    payload: SessionTeleportPayload,
    callback: (response: {
      success: boolean;
      channelId?: string;
      events?: SocketEvent[];
      error?: string;
    }) => void,
  ) => void;
  fork_conversation: (
    payload: SessionForkPayload,
    callback: (response: {
      success: boolean;
      channelId?: string;
      parentSessionId?: string;
      events?: SocketEvent[];
      error?: string;
    }) => void,
  ) => void;
  rename_session: (
    payload: SessionRenamePayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  delete_session: (
    payload: SessionDeletePayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  update_session_state: (
    payload: SessionUpdateStatePayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  // ── Aligned: MCP ──
  get_mcp_servers: (
    payload: McpGetServersPayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;
  set_mcp_server_enabled: (
    payload: McpSetEnabledPayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;
  reconnect_mcp_server: (
    payload: McpReconnectPayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;
  authenticate_mcp_server: (
    payload: McpAuthenticatePayload,
    callback: (result: McpAuthResult) => void,
  ) => void;
  clear_mcp_server_auth: (
    payload: McpAuthenticatePayload,
    callback: (result: { success: boolean; error?: string }) => void,
  ) => void;
  submit_mcp_oauth_callback_url: (
    payload: McpOAuthCallbackPayload,
    callback: (result: { success: boolean; error?: string }) => void,
  ) => void;
  mcp_set_servers: (
    payload: McpSetServersPayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;
  mcp_message: (
    payload: McpMessagePayload,
    callback: (response: {
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }) => void,
  ) => void;
  ensure_chrome_mcp_enabled: (
    payload: ChromeMcpControlPayload,
    callback: (response: {
      success: boolean;
      response?: { type: 'ensure_chrome_mcp_enabled_response'; wasDisabled: boolean };
      error?: string;
    }) => void,
  ) => void;
  disable_chrome_mcp: (
    payload: ChromeMcpControlPayload,
    callback: (response: {
      success: boolean;
      response?: { type: 'disable_chrome_mcp_response'; wasEnabled: boolean };
      error?: string;
    }) => void,
  ) => void;
  enable_jupyter_mcp: (
    payload: JupyterMcpControlPayload,
    callback: (response: {
      success: boolean;
      response?: { type: 'enable_jupyter_mcp_response' };
      error?: string;
    }) => void,
  ) => void;
  disable_jupyter_mcp: (
    payload: JupyterMcpControlPayload,
    callback: (response: {
      success: boolean;
      response?: { type: 'disable_jupyter_mcp_response' };
      error?: string;
    }) => void,
  ) => void;
  ask_debugger_help: (
    payload: DebuggerHelpPayload,
    callback: (response: {
      success: boolean;
      response?: { type: 'ask_debugger_help_response' };
      error?: string;
    }) => void,
  ) => void;

  // ── Aligned: File & Git ──
  list_files_request: (
    payload: { channelId: string; pattern: string },
    callback: (response: { files: FileSearchResult[] }) => void,
  ) => void;
  checkout_branch: (
    payload: GitCheckoutPayload,
    callback: (result: GitCheckoutResult) => void,
  ) => void;
  check_git_status: (callback: (result: GitStatusResult) => void) => void;
  update_skipped_branch: (
    payload: GitUpdateSkippedBranchPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  exec: (
    payload: GitExecPayload,
    callback: (response: { exitCode: number; stdout: string; stderr: string }) => void,
  ) => void;

  // ── Aligned: Plugin ──
  list_plugins: (
    payload: { includeAvailable?: boolean },
    callback: (result: { installed: PluginInfo[]; available: AvailablePlugin[] }) => void,
  ) => void;
  install_plugin: (payload: PluginInstallPayload, callback: (result: PluginResult) => void) => void;
  uninstall_plugin: (
    payload: { pluginId: string },
    callback: (result: PluginResult) => void,
  ) => void;
  set_plugin_enabled: (
    payload: PluginTogglePayload,
    callback: (result: PluginResult) => void,
  ) => void;
  list_marketplaces: (callback: (result: { marketplaces: MarketplaceInfo[] }) => void) => void;
  add_marketplace: (
    payload: { source: string },
    callback: (result: MarketplaceResult) => void,
  ) => void;
  remove_marketplace: (
    payload: { marketplaceId: string },
    callback: (result: MarketplaceResult) => void,
  ) => void;
  refresh_marketplace: (
    payload: { marketplaceId: string },
    callback: (result: MarketplaceResult) => void,
  ) => void;

  // ── Aligned: Auth ──
  get_auth_status: (callback: (result: AuthStatus) => void) => void;
  login: (payload: LoginPayload, callback: (result: AuthResult) => void) => void;
  submit_oauth_code: (payload: OAuthCodePayload, callback: (result: AuthResult) => void) => void;

  // ── Aligned: Plan ──
  comment: (
    payload: PlanCommentPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  get_plan_comments: (
    payload: PlanGetCommentsPayload,
    callback: (response: { comments: PlanCommentData[] }) => void,
  ) => void;
  remove_plan_comment: (
    payload: PlanRemoveCommentPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  close_plan_preview: (
    payload: PlanClosePreviewPayload,
    callback: (response: { success: boolean }) => void,
  ) => void;

  // ── File Operations ──
  'file:read': (
    payload: { channelId: string; filePath: string },
    callback: (response: { content: string } | { error: string }) => void,
  ) => void;

  // ── Clean relay protocol: new C→S events ──
  'session:launch': (
    payload: ChatCreatePayload,
    callback: (response: {
      channelId: string;
      slashCommands?: string[];
      models?: unknown[];
      account?: Record<string, unknown>;
    }) => void,
  ) => void;
  'session:close': (payload: ChatKillPayload) => void;
  'session:join': (
    payload: ChatJoinPayload,
    callback: (
      response:
        | {
            channelId: string;
            state: string;
            meta: ChannelMetaCache;
            events: SocketEvent[];
          }
        | { error: string },
    ) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:cancel': (payload: ChatInterruptPayload) => void;
  'chat:respond': (payload: { channelId: string; requestId: string; response: unknown }) => void;

  'chat:stop_task': (payload: ChatStopTaskPayload) => void;
  'chat:set_fast_mode': (payload: ChatSetFastModePayload) => void;
  'session:raw_events': (
    payload: { channelId: string },
    callback: (response: { events: unknown[] }) => void,
  ) => void;
  'git:log': (payload: { limit?: number }, callback: (result: GitLogResult) => void) => void;
  'git:diff': (callback: (result: GitDiffResult) => void) => void;
  init: (
    callback: (response: {
      settings: Record<string, unknown>;
      sessions: SessionStateSummary[];
      activeSessionId?: string;
      models?: unknown[];
      state?: Record<string, unknown>;
    }) => void,
  ) => void;
  cancel_request: (payload: { targetRequestId: string }) => void;
  'terminal:get_contents': (
    payload: { channelId: string; terminalId?: string },
    callback: (response: { content: string | null }) => void,
  ) => void;
  'terminal:open_claude': (
    payload: { channelId: string; prompt?: string; args?: string[]; cwd?: string },
    callback: (response: { success: boolean; channelId?: string; error?: string }) => void,
  ) => void;

  // ── Aligned: Speech-to-Text ──
  start_speech_to_text: (payload: { channelId: string }) => void;
  stop_speech_to_text: (payload: { channelId: string }) => void;

  // ── Protocol Alignment: new control_request subtypes ──
  cancel_async_message: (payload: { channelId: string; messageUuid: string }) => void;
  set_proactive: (payload: { channelId: string; enabled: boolean }) => void;
  generate_session_title: (
    payload: { channelId: string; description: string; persist: boolean },
    callback: (response: { success: boolean; result?: unknown; error?: string }) => void,
  ) => void;
  set_remote_control: (payload: { channelId: string; enabled: boolean }) => void;
  hook_callback_respond: (payload: {
    channelId: string;
    requestId: string;
    response: { continue: boolean };
  }) => void;
}

export interface ChannelMetaCache {
  model?: string;
  tools?: string[];
  permissionMode?: string;
  slashCommands?: string[];
  fastModeState?: unknown;
  mcpServers?: Array<{ name: string; status: string }>;
}

export interface SessionStateSummary {
  channelId: string;
  state: 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected';
  title?: string;
  modelSetting?: string;
  permissionMode?: string;
  effort?: string;
}

// ── update_state enum types ──────────────────────────────────────────────────
export type AuthStatusValue = 'logged_in' | 'logged_out' | 'unknown';
export interface ChromeMcpState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}
export interface DebuggerMcpState {
  status: 'inactive' | 'active' | 'error';
}
export interface JupyterMcpState {
  status: 'inactive' | 'available' | 'active';
}

// ── MCP control request/response types ───────────────────────────────────────
export interface EnsureChromeMcpEnabledRequest {
  type: 'ensure_chrome_mcp_enabled';
}
export interface EnsureChromeMcpEnabledResponse {
  type: 'ensure_chrome_mcp_enabled_response';
  success: boolean;
  reason?: string;
}
export interface DisableChromeMcpRequest {
  type: 'disable_chrome_mcp';
}
export interface DisableChromeMcpResponse {
  type: 'disable_chrome_mcp_response';
  success: boolean;
  reason?: string;
}
export interface EnableJupyterMcpRequest {
  type: 'enable_jupyter_mcp';
}
export interface EnableJupyterMcpResponse {
  type: 'enable_jupyter_mcp_response';
  success: boolean;
  reason?: string;
}
export interface DisableJupyterMcpRequest {
  type: 'disable_jupyter_mcp';
}
export interface DisableJupyterMcpResponse {
  type: 'disable_jupyter_mcp_response';
  success: boolean;
  reason?: string;
}
export interface AskDebuggerHelpRequest {
  type: 'ask_debugger_help';
}
export interface AskDebuggerHelpResponse {
  type: 'ask_debugger_help_response';
  cancelled: boolean;
}

// ── Open URL / Open File types ────────────────────────────────────────────────
export interface OpenUrlRequest {
  type: 'open_url';
  url: string;
}
export interface OpenUrlResponse {
  type: 'open_url_response';
}
export interface OpenFileLocation {
  startLine?: number;
  endLine?: number;
  searchText?: string;
}
export interface OpenFileRequest {
  type: 'open_file';
  filePath: string;
  location?: OpenFileLocation;
}
export interface OpenFileResponse {
  type: 'open_file_response';
}

/** Full state snapshot pushed by the Extension via `update_state`.
 *  `channelId = ""` → global broadcast; non-empty → per-channel update.
 *  All fields are optional because the extension may send partial updates. */
export interface UpdateStatePayload {
  channelId: string;
  // ── Global fields (channelId = "") ────────────────────────────────────────
  authStatus?: AuthStatusValue;
  accountInfo?: AccountInfo;
  platform?: string;
  speechToTextEnabled?: boolean;
  showTerminalBanner?: boolean;
  showReviewUpsellBanner?: boolean;
  isOnboardingEnabled?: boolean;
  isOnboardingDismissed?: boolean;
  marketplaceType?: string;
  chromeMcpState?: ChromeMcpState;
  debuggerMcpState?: DebuggerMcpState;
  jupyterMcpState?: JupyterMcpState;
  remoteControlState?: { status: string };
  browserIntegrationSupported?: boolean;
  experimentGates?: Record<string, boolean>;
  openNewInTab?: boolean;
  spinnerVerbsConfig?: string[];
  settings?: Record<string, unknown>;
  claudeSettings?: Record<string, unknown>;
  // ── Per-channel fields (channelId = specific ID) ──────────────────────────
  cwd?: string;
  modelSetting?: string;
  tools?: string[];
  apiKeyStatus?: string;
  allowDangerouslySkipPermissions?: boolean;
  useCtrlEnterToSend?: boolean;
  currentRepo?: string | null;
  config?: Record<string, unknown>;
  // ── Legacy / both ─────────────────────────────────────────────────────────
  defaultCwd?: string;
  initialPermissionMode?: string;
  thinkingLevel?: string;
  mcpServers?: Array<{ name: string; status: string; scope?: string }>;
  effort?: string;
  fastModeState?: string;
}

/** Discriminated union of all server-initiated push types, matching the Extension protocol. */
export type ServerPushRequest =
  | { type: 'update_state'; state: UpdateStatePayload }
  | {
      type: 'usage_update';
      utilization: UsageQuota;
      error?: { type: string; message: string };
    }
  | { type: 'auth_url'; url: string; method: string }
  | { type: 'session_states_update'; sessions: SessionStateSummary[]; activeSessionId?: string }
  | {
      type: 'tool_permission_request';
      toolName: string;
      inputs: unknown;
      suggestions?: unknown[];
    }
  | {
      type: 'show_notification';
      message: string;
      severity: 'error' | 'warning' | 'info';
      buttons?: string[];
      onlyIfNotVisible?: boolean;
    }
  | { type: 'proactive_suggestions_update'; suggestions: string[] }
  | {
      type: 'elicitation_request';
      requestId: string;
      prompt: string;
      inputType: 'text' | 'url' | 'select';
      options?: string[];
      url?: string;
    }
  | {
      type: 'diff_review_request';
      toolId: string;
      oldContent: string;
      newContent: string;
      filePath: string;
    }
  | {
      type: 'mcp_message';
      requestId: string;
      serverName: string;
      message: Record<string, unknown>;
    }
  | { type: 'open_url'; url: string }
  | { type: 'open_file'; filePath: string; location?: OpenFileLocation }
  | {
      type: 'unknown_control_request';
      requestId: string;
      subtype: string;
      toolName?: string;
      toolUseId?: string;
      input?: unknown;
      suggestions?: unknown[];
      callbackId?: string;
    };

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
