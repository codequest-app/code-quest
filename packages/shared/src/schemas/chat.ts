import { z } from 'zod';

// --- Schemas ---

const initializeOptionsSchema = z
  .object({
    hooks: z
      .record(
        z.string(),
        z.array(
          z.object({
            matcher: z.string(),
            hookCallbackIds: z.array(z.string()),
            timeout: z.number().optional(),
          }),
        ),
      )
      .optional(),
    systemPrompt: z.string().optional(),
    appendSystemPrompt: z.string().optional(),
    jsonSchema: z.record(z.string(), z.unknown()).optional(),
    agents: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .optional();

export const launchOptionsSchema = z
  .object({
    resumeSessionId: z.string().optional(),
    continueSession: z.boolean().optional(),
    forkSession: z.boolean().optional(),
    sessionId: z.string().optional(),
    resumeSessionAt: z.string().optional(),
    noSessionPersistence: z.boolean().optional(),
    model: z.string().optional(),
    fallbackModel: z.string().optional(),
    thinking: z.union([z.literal('adaptive'), z.literal('disabled'), z.number()]).optional(),
    effort: z.enum(['high', 'medium', 'low', 'max']).optional(),
    maxTurns: z.number().optional(),
    maxBudgetUsd: z.number().optional(),
    agent: z.string().optional(),
    allowedTools: z.array(z.string()).optional(),
    disallowedTools: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    mcpConfig: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    settingSources: z.array(z.string()).optional(),
    strictMcpConfig: z.boolean().optional(),
    permissionMode: z.string().optional(),
    proactive: z.boolean().optional(),
    assistant: z.boolean().optional(),
    jsonSchema: z.record(z.string(), z.unknown()).optional(),
    betas: z.array(z.string()).optional(),
    debug: z.boolean().optional(),
    debugFile: z.string().optional(),
    debugToStderr: z.boolean().optional(),
    addDirs: z.array(z.string()).optional(),
    pluginDirs: z.array(z.string()).optional(),
  })
  .optional();

export const chatCreateSchema = z.object({
  channelId: z.string().optional(),
  resume: z.string().optional(),
  initialPrompt: z.string().optional(),
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  thinkingLevel: z.string().optional(),
  cwd: z.string().optional(),
  initOptions: initializeOptionsSchema,
  launchOptions: launchOptionsSchema,
});

export const chatSendSchema = z.object({
  channelId: z.string(),
  message: z.string().min(1),
});

export const chatInterruptSchema = z.object({
  channelId: z.string(),
});

export const chatKillSchema = z.object({
  channelId: z.string(),
});

export const chatJoinSchema = z.object({
  channelId: z.string(),
});

/** Inner permission response matching CLI's expected format:
 *  - Tool allow: { behavior: 'allow', updatedInput, updatedPermissions? }
 *  - Tool deny:  { behavior: 'deny', message, interrupt }
 *  - Hook allow: { continue: true }
 *  - Hook deny:  { continue: false }
 *  Plus optional toolUseID merged by the client. */
export const controlPermissionResponseSchema = z.union([
  z.object({
    behavior: z.literal('allow'),
    updatedInput: z.record(z.string(), z.unknown()),
    updatedPermissions: z.array(z.any()).optional(),
    toolUseID: z.string().optional(),
    userFeedback: z.string().optional(),
  }),
  z.object({
    behavior: z.literal('deny'),
    message: z.string(),
    interrupt: z.boolean(),
    toolUseID: z.string().optional(),
  }),
  z.object({
    continue: z.boolean(),
  }),
]);

export const chatSetPermissionModeSchema = z.object({
  channelId: z.string(),
  mode: z.string(),
});

export const chatSetModelSchema = z.object({
  channelId: z.string(),
  model: z.string(),
});

export const chatSetThinkingLevelSchema = z.object({
  channelId: z.string(),
  thinkingLevel: z.string(),
});

export const chatRewindCodeSchema = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
  dryRun: z.boolean().optional(),
});

export const sessionListSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const sessionGetSchema = z.object({
  channelId: z.string(),
});

export const mcpReconnectSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
});

export const mcpSetEnabledSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  enabled: z.boolean(),
});

export const mcpGetServersSchema = z.object({
  channelId: z.string(),
});

export const mcpSetServersSchema = z.object({
  channelId: z.string(),
  servers: z.record(z.string(), z.unknown()),
});

export const mcpMessageSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  message: z.record(z.string(), z.unknown()),
});

export const mcpAuthenticateSchema = z.object({ channelId: z.string(), serverName: z.string() });

export const mcpOAuthCallbackSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  callbackUrl: z.string().url(),
});
export type McpOAuthCallbackPayload = z.infer<typeof mcpOAuthCallbackSchema>;

export const sessionRenameSchema = z.object({
  channelId: z.string(),
  title: z.string().min(1).max(200),
});

export const sessionDeleteSchema = z.object({
  channelId: z.string(),
});

export const sessionForkSchema = z.object({
  forkedFromSession: z.string(),
  resumeSessionAt: z.string().optional(),
  newSessionId: z.string(),
});

export const chatStopTaskSchema = z.object({ channelId: z.string(), taskId: z.string() });

export const chatSetFastModeSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type ChatSetFastModePayload = z.infer<typeof chatSetFastModeSchema>;

export const fileListSchema = z.object({ channelId: z.string(), pattern: z.string() });
export type FileListPayload = z.infer<typeof fileListSchema>;

export const gitCheckoutSchema = z.object({ branch: z.string().min(1) });
export const gitLogSchema = z.object({ limit: z.number().min(1).max(100).optional() });
export type GitLogPayload = z.infer<typeof gitLogSchema>;

export const pluginInstallSchema = z.object({
  pluginId: z.string(),
  scope: z.enum(['user', 'workspace', 'project', 'local']).optional(),
});
export const pluginToggleSchema = z.object({ pluginId: z.string(), enabled: z.boolean() });
export const pluginUninstallSchema = z.object({ pluginId: z.string() });
export type PluginUninstallPayload = z.infer<typeof pluginUninstallSchema>;
export const addMarketplaceSchema = z.object({ source: z.string().min(1) });
export type AddMarketplacePayload = z.infer<typeof addMarketplaceSchema>;
export const removeMarketplaceSchema = z.object({ marketplaceId: z.string() });
export type RemoveMarketplacePayload = z.infer<typeof removeMarketplaceSchema>;
export const refreshMarketplaceSchema = z.object({ marketplaceId: z.string() });
export type RefreshMarketplacePayload = z.infer<typeof refreshMarketplaceSchema>;

export const sessionUpdateStateSchema = z.object({
  channelId: z.string(),
  title: z.string().optional(),
  state: z.enum(['busy', 'idle']).optional(),
});
export type SessionUpdateStatePayload = z.infer<typeof sessionUpdateStateSchema>;

/** Loose schema for chat:respond handler — accepts any response shape
 *  (permission, elicitation, MCP, diff review) */
export const chatRespondSchema = z.object({
  channelId: z.string().optional(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type ChatRespondPayload = z.infer<typeof chatRespondSchema>;

// --- Shared response schemas ---

export const successResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;

export const controlResponseSchema = z.object({
  success: z.boolean(),
  response: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type ControlResponse = z.infer<typeof controlResponseSchema>;

// --- Inferred types ---

export type ChatCreatePayload = z.infer<typeof chatCreateSchema>;
export type ChatSendPayload = z.infer<typeof chatSendSchema>;
export type ChatInterruptPayload = z.infer<typeof chatInterruptSchema>;
export type ChatKillPayload = z.infer<typeof chatKillSchema>;
export type ChatJoinPayload = z.infer<typeof chatJoinSchema>;
export type ControlPermissionResponse = z.infer<typeof controlPermissionResponseSchema>;
export type ChatSetPermissionModePayload = z.infer<typeof chatSetPermissionModeSchema>;
export type ChatSetModelPayload = z.infer<typeof chatSetModelSchema>;
export type ChatSetThinkingLevelPayload = z.infer<typeof chatSetThinkingLevelSchema>;
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodeSchema>;
export type SessionListPayload = z.infer<typeof sessionListSchema>;
export type SessionGetPayload = z.infer<typeof sessionGetSchema>;
export type McpReconnectPayload = z.infer<typeof mcpReconnectSchema>;
export type McpSetEnabledPayload = z.infer<typeof mcpSetEnabledSchema>;
export type McpGetServersPayload = z.infer<typeof mcpGetServersSchema>;
export type McpSetServersPayload = z.infer<typeof mcpSetServersSchema>;
export type McpMessagePayload = z.infer<typeof mcpMessageSchema>;
export type SessionRenamePayload = z.infer<typeof sessionRenameSchema>;
export type SessionDeletePayload = z.infer<typeof sessionDeleteSchema>;
export type SessionForkPayload = z.infer<typeof sessionForkSchema>;
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskSchema>;

export const sessionListRemoteSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});
export type SessionListRemotePayload = z.infer<typeof sessionListRemoteSchema>;

export const sessionTeleportSchema = z.object({
  remoteSessionId: z.string(),
  branch: z.string().optional(),
  newSessionId: z.string(),
});
export type SessionTeleportPayload = z.infer<typeof sessionTeleportSchema>;

export const settingsApplySchema = z.object({
  channelId: z.string(),
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsApplyPayload = z.infer<typeof settingsApplySchema>;

// --- New event schemas ---

export const chatGetStateSchema = z.object({
  channelId: z.string(),
});
export type ChatGetStatePayload = z.infer<typeof chatGetStateSchema>;

export const gitUpdateSkippedBranchSchema = z.object({
  channelId: z.string(),
  branch: z.string(),
  failed: z.boolean(),
});
export type GitUpdateSkippedBranchPayload = z.infer<typeof gitUpdateSkippedBranchSchema>;

export const gitExecSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
});
export type GitExecPayload = z.infer<typeof gitExecSchema>;

export const planCommentDataSchema = z.object({
  id: z.string(),
  selectedText: z.string(),
  sectionHeading: z.string(),
  comment: z.string(),
});
export type PlanCommentData = z.infer<typeof planCommentDataSchema>;

export const planCommentSchema = z.object({
  channelId: z.string(),
  comment: planCommentDataSchema,
});
export type PlanCommentPayload = z.infer<typeof planCommentSchema>;

export const planGetCommentsSchema = z.object({
  channelId: z.string(),
});
export type PlanGetCommentsPayload = z.infer<typeof planGetCommentsSchema>;

export const planRemoveCommentSchema = z.object({
  channelId: z.string(),
  commentId: z.string(),
});
export type PlanRemoveCommentPayload = z.infer<typeof planRemoveCommentSchema>;

export const planClosePreviewSchema = z.object({
  channelId: z.string(),
});
export type PlanClosePreviewPayload = z.infer<typeof planClosePreviewSchema>;

// ── MCP Control ──
export const chromeMcpControlSchema = z.object({ channelId: z.string() });
export type ChromeMcpControlPayload = z.infer<typeof chromeMcpControlSchema>;

export const jupyterMcpControlSchema = z.object({ channelId: z.string() });
export type JupyterMcpControlPayload = z.infer<typeof jupyterMcpControlSchema>;

// ── Protocol Alignment: Server→CLI control_requests ──
export const chatCancelAsyncMessageSchema = z.object({
  channelId: z.string(),
  messageUuid: z.string(),
});
export type ChatCancelAsyncMessagePayload = z.infer<typeof chatCancelAsyncMessageSchema>;

export const chatSetProactiveSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type ChatSetProactivePayload = z.infer<typeof chatSetProactiveSchema>;

export const chatGenerateSessionTitleSchema = z.object({
  channelId: z.string(),
  description: z.string(),
  persist: z.boolean(),
});
export type ChatGenerateSessionTitlePayload = z.infer<typeof chatGenerateSessionTitleSchema>;

export const chatSetRemoteControlSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type ChatSetRemoteControlPayload = z.infer<typeof chatSetRemoteControlSchema>;

export const chatHookCallbackRespondSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  response: z.object({ continue: z.boolean() }),
});
export type ChatHookCallbackRespondPayload = z.infer<typeof chatHookCallbackRespondSchema>;

export const debuggerHelpSchema = z.object({ channelId: z.string() });
export type DebuggerHelpPayload = z.infer<typeof debuggerHelpSchema>;

// ── Auth ──
export const loginPayloadSchema = z.object({
  method: z.enum(['api_key', 'oauth']),
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const oauthCodePayloadSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
export type OAuthCodePayload = z.infer<typeof oauthCodePayloadSchema>;

export const authResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  authUrl: z.string().optional(),
  auth: z
    .object({
      authenticated: z.boolean(),
      user: z.object({ name: z.string(), email: z.string().optional() }).optional(),
      method: z.string().optional(),
    })
    .optional(),
});
export type AuthResult = z.infer<typeof authResultSchema>;

export const authStatusSchema = z.object({
  authenticated: z.boolean(),
  user: z.object({ name: z.string(), email: z.string().optional() }).optional(),
  method: z.enum(['api_key', 'oauth']).optional(),
});
export type AuthStatus = z.infer<typeof authStatusSchema>;

export const accountInfoSchema = z.object({
  model: z.string().optional(),
  email: z.string().optional(),
  subscriptionType: z.string().optional(),
  authMethod: z.string().optional(),
  organization: z.string().optional(),
});
export type AccountInfo = z.infer<typeof accountInfoSchema>;

// ── MCP Auth Result ──
export const mcpAuthResultSchema = z.object({
  success: z.boolean(),
  authUrl: z.string().optional(),
  error: z.string().optional(),
});
export type McpAuthResult = z.infer<typeof mcpAuthResultSchema>;

// ── Plugin / Marketplace Results ──
export const pluginResultSchema = z.object({
  success: z.boolean(),
  needsRestart: z.boolean().optional(),
  error: z.string().optional(),
});
export type PluginResult = z.infer<typeof pluginResultSchema>;

export const marketplaceResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type MarketplaceResult = z.infer<typeof marketplaceResultSchema>;

// ── Model Usage ──
export const modelUsageEntrySchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
  costUSD: z.number().optional(),
  contextWindow: z.number().optional(),
  maxOutputTokens: z.number().optional(),
});
export type ModelUsageEntry = z.infer<typeof modelUsageEntrySchema>;

// ── Git ──
export const gitFileChangeSchema = z.object({
  status: z.string(),
  file: z.string(),
});
export type GitFileChange = z.infer<typeof gitFileChangeSchema>;

export const gitLogEntrySchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});
export type GitLogEntry = z.infer<typeof gitLogEntrySchema>;

// ── Notifications ──
export const notificationButtonSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type NotificationButton = z.infer<typeof notificationButtonSchema>;

export const notificationPayloadSchema = z.object({
  id: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  buttons: z.array(notificationButtonSchema).optional(),
  onlyIfNotVisible: z.boolean().optional(),
});
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

export const notificationResponseSchema = z
  .object({
    buttonValue: z.string().optional(),
  })
  .passthrough();
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

// ── Existing schemas that now get inferred types ──
export type PluginInstallPayload = z.infer<typeof pluginInstallSchema>;
export type PluginTogglePayload = z.infer<typeof pluginToggleSchema>;
export type GitCheckoutPayload = z.infer<typeof gitCheckoutSchema>;
export type McpAuthenticatePayload = z.infer<typeof mcpAuthenticateSchema>;

// ── Terminal Requests ──
export const terminalGetContentsSchema = z.object({
  channelId: z.string(),
  terminalId: z.string().optional(),
});
export type TerminalGetContentsPayload = z.infer<typeof terminalGetContentsSchema>;

export const terminalOpenClaudeSchema = z.object({
  channelId: z.string(),
  prompt: z.string().optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
});
export type TerminalOpenClaudePayload = z.infer<typeof terminalOpenClaudeSchema>;

// ── Shared payloads ──

export const channelIdPayloadSchema = z.object({ channelId: z.string() });
export type ChannelIdPayload = z.infer<typeof channelIdPayloadSchema>;

export const cancelRequestPayloadSchema = z.object({ targetRequestId: z.string() });
export type CancelRequestPayload = z.infer<typeof cancelRequestPayloadSchema>;

export const listPluginsPayloadSchema = z.object({ includeAvailable: z.boolean().optional() });
export type ListPluginsPayload = z.infer<typeof listPluginsPayloadSchema>;

export const fileReadPayloadSchema = z.object({
  channelId: z.string(),
  filePath: z.string(),
});
export type FileReadPayload = z.infer<typeof fileReadPayloadSchema>;

// ── Converted from socket-events.ts interfaces ──

export const socketEventSchema = z.object({
  name: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export type SocketEvent = z.infer<typeof socketEventSchema>;

export const channelMetaCacheSchema = z.object({
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  slashCommands: z.array(z.string()).optional(),
  fastModeState: z.unknown().optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
});
export type ChannelMetaCache = z.infer<typeof channelMetaCacheSchema>;

export const sessionSummarySchema = z.object({
  id: z.string(),
  provider: z.string(),
  command: z.string(),
  args: z.string(),
  cwd: z.string().optional(),
  mode: z.string(),
  role: z.string(),
  parentId: z.string().optional(),
  title: z.string().optional(),
  createdAt: z.string(),
  isActive: z.boolean().optional(),
  lastAssistantMessage: z.string().optional(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionStateSummarySchema = z.object({
  channelId: z.string(),
  state: z.enum(['launching', 'busy', 'idle', 'exited', 'disconnected']),
  title: z.string().optional(),
  modelSetting: z.string().optional(),
  permissionMode: z.string().optional(),
  effort: z.string().optional(),
});
export type SessionStateSummary = z.infer<typeof sessionStateSummarySchema>;

export const usageQuotaTierSchema = z.object({
  utilization: z.number(),
  resets_at: z.string().optional(),
});
export type UsageQuotaTier = z.infer<typeof usageQuotaTierSchema>;

export const usageQuotaSchema = z.object({
  five_hour: usageQuotaTierSchema.optional(),
  seven_day: usageQuotaTierSchema.optional(),
  seven_day_sonnet: usageQuotaTierSchema.optional(),
  extra_usage: z
    .object({
      is_enabled: z.boolean(),
      monthly_limit: z.number().optional(),
      used_credits: z.number().optional(),
      utilization: z.number().optional(),
      overageStatus: z.string().optional(),
    })
    .optional(),
});
export type UsageQuota = z.infer<typeof usageQuotaSchema>;

export const chatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  numTurns: z.number().optional(),
  modelUsage: z.record(z.string(), modelUsageEntrySchema).optional(),
  contextWindow: z.number().optional(),
});
export type ChatStats = z.infer<typeof chatStatsSchema>;

export const fileSearchResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory', 'terminal']),
});
export type FileSearchResult = z.infer<typeof fileSearchResultSchema>;

export const gitStatusResultSchema = z.object({
  branch: z.string(),
  isClean: z.boolean(),
  changedFiles: z.array(gitFileChangeSchema),
});
export type GitStatusResult = z.infer<typeof gitStatusResultSchema>;

export const gitLogResultSchema = z.object({
  entries: z.array(gitLogEntrySchema),
});
export type GitLogResult = z.infer<typeof gitLogResultSchema>;

export const gitDiffResultSchema = z.object({
  diff: z.string(),
});
export type GitDiffResult = z.infer<typeof gitDiffResultSchema>;

export const gitCheckoutResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type GitCheckoutResult = z.infer<typeof gitCheckoutResultSchema>;

export const pluginInfoSchema = z.object({
  id: z.string(),
  version: z.string(),
  scope: z.string(),
  enabled: z.boolean(),
  installPath: z.string(),
  installedAt: z.string(),
  lastUpdated: z.string(),
});
export type PluginInfo = z.infer<typeof pluginInfoSchema>;

export const availablePluginSchema = z.object({
  pluginId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  marketplaceName: z.string(),
  version: z.string(),
  source: z.string(),
  installCount: z.number().optional(),
});
export type AvailablePlugin = z.infer<typeof availablePluginSchema>;

export const marketplaceSourceConfigSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('npm'), package: z.string() }),
  z.object({ source: z.literal('github'), repo: z.string() }),
  z.object({ source: z.literal('git'), url: z.string() }),
  z.object({ source: z.literal('url'), url: z.string() }),
  z.object({ source: z.literal('directory'), path: z.string() }),
  z.object({ source: z.literal('file'), path: z.string() }),
  z.object({ source: z.literal('local'), path: z.string() }),
]);
export type MarketplaceSourceConfig = z.infer<typeof marketplaceSourceConfigSchema>;

export const marketplaceInfoSchema = z.object({
  name: z.string(),
  config: z.object({
    source: marketplaceSourceConfigSchema,
    installLocation: z.string(),
  }),
  pluginCount: z.number(),
  installedCount: z.number(),
});
export type MarketplaceInfo = z.infer<typeof marketplaceInfoSchema>;

export type AuthStatusValue = 'logged_in' | 'logged_out' | 'unknown';

export const chromeMcpStateSchema = z.object({
  status: z.enum(['disconnected', 'connecting', 'connected', 'error']),
});
export type ChromeMcpState = z.infer<typeof chromeMcpStateSchema>;

export const debuggerMcpStateSchema = z.object({
  status: z.enum(['inactive', 'active', 'error']),
});
export type DebuggerMcpState = z.infer<typeof debuggerMcpStateSchema>;

export const jupyterMcpStateSchema = z.object({
  status: z.enum(['inactive', 'available', 'active']),
});
export type JupyterMcpState = z.infer<typeof jupyterMcpStateSchema>;

export const openFileLocationSchema = z.object({
  startLine: z.number().optional(),
  endLine: z.number().optional(),
  searchText: z.string().optional(),
});
export type OpenFileLocation = z.infer<typeof openFileLocationSchema>;

export const updateStatePayloadSchema = z.object({
  channelId: z.string(),
  // Global fields
  authStatus: z.enum(['logged_in', 'logged_out', 'unknown']).optional(),
  accountInfo: accountInfoSchema.optional(),
  platform: z.string().optional(),
  speechToTextEnabled: z.boolean().optional(),
  showTerminalBanner: z.boolean().optional(),
  showReviewUpsellBanner: z.boolean().optional(),
  isOnboardingEnabled: z.boolean().optional(),
  isOnboardingDismissed: z.boolean().optional(),
  marketplaceType: z.string().optional(),
  chromeMcpState: chromeMcpStateSchema.optional(),
  debuggerMcpState: debuggerMcpStateSchema.optional(),
  jupyterMcpState: jupyterMcpStateSchema.optional(),
  remoteControlState: z.object({ status: z.string() }).optional(),
  browserIntegrationSupported: z.boolean().optional(),
  experimentGates: z.record(z.string(), z.boolean()).optional(),
  openNewInTab: z.boolean().optional(),
  spinnerVerbsConfig: z.array(z.string()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  claudeSettings: z.record(z.string(), z.unknown()).optional(),
  // Per-channel fields
  cwd: z.string().optional(),
  modelSetting: z.string().optional(),
  tools: z.array(z.string()).optional(),
  apiKeyStatus: z.string().optional(),
  allowDangerouslySkipPermissions: z.boolean().optional(),
  useCtrlEnterToSend: z.boolean().optional(),
  currentRepo: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  // Legacy / both
  defaultCwd: z.string().optional(),
  initialPermissionMode: z.string().optional(),
  thinkingLevel: z.string().optional(),
  mcpServers: z
    .array(z.object({ name: z.string(), status: z.string(), scope: z.string().optional() }))
    .optional(),
  effort: z.string().optional(),
  fastModeState: z.string().optional(),
});
export type UpdateStatePayload = z.infer<typeof updateStatePayloadSchema>;

// ── Response schemas ──

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSummarySchema),
  total: z.number(),
});
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;

export const getClaudeStateResponseSchema = z
  .object({
    success: z.boolean(),
    state: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GetClaudeStateResponse = z.infer<typeof getClaudeStateResponseSchema>;

export const getSessionResponseSchema = z.union([
  z
    .object({
      session: sessionSummarySchema,
      events: z.array(socketEventSchema),
      meta: channelMetaCacheSchema,
    })
    .passthrough(),
  z.object({ error: z.string() }),
]);
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;

export const teleportSessionResponseSchema = z
  .object({
    success: z.boolean(),
    channelId: z.string().optional(),
    events: z.array(socketEventSchema).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type TeleportSessionResponse = z.infer<typeof teleportSessionResponseSchema>;

export const forkConversationResponseSchema = z
  .object({
    success: z.boolean(),
    channelId: z.string().optional(),
    parentSessionId: z.string().optional(),
    events: z.array(socketEventSchema).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ForkConversationResponse = z.infer<typeof forkConversationResponseSchema>;

export const ensureChromeMcpResponseSchema = z
  .object({
    success: z.boolean(),
    response: z
      .object({ type: z.literal('ensure_chrome_mcp_enabled_response'), wasDisabled: z.boolean() })
      .optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type EnsureChromeMcpResponse = z.infer<typeof ensureChromeMcpResponseSchema>;

export const disableChromeMcpResponseSchema = z
  .object({
    success: z.boolean(),
    response: z
      .object({ type: z.literal('disable_chrome_mcp_response'), wasEnabled: z.boolean() })
      .optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type DisableChromeMcpResponse = z.infer<typeof disableChromeMcpResponseSchema>;

export const enableJupyterMcpResponseSchema = z
  .object({
    success: z.boolean(),
    response: z.object({ type: z.literal('enable_jupyter_mcp_response') }).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type EnableJupyterMcpResponse = z.infer<typeof enableJupyterMcpResponseSchema>;

export const disableJupyterMcpResponseSchema = z
  .object({
    success: z.boolean(),
    response: z.object({ type: z.literal('disable_jupyter_mcp_response') }).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type DisableJupyterMcpResponse = z.infer<typeof disableJupyterMcpResponseSchema>;

export const askDebuggerHelpResponseSchema = z
  .object({
    success: z.boolean(),
    response: z.object({ type: z.literal('ask_debugger_help_response') }).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AskDebuggerHelpResponse = z.infer<typeof askDebuggerHelpResponseSchema>;

export const listFilesResponseSchema = z
  .object({
    files: z.array(fileSearchResultSchema),
  })
  .passthrough();
export type ListFilesResponse = z.infer<typeof listFilesResponseSchema>;

export const execResponseSchema = z
  .object({
    exitCode: z.number(),
    stdout: z.string(),
    stderr: z.string(),
  })
  .passthrough();
export type ExecResponse = z.infer<typeof execResponseSchema>;

export const listPluginsResponseSchema = z
  .object({
    installed: z.array(pluginInfoSchema),
    available: z.array(availablePluginSchema),
  })
  .passthrough();
export type ListPluginsResponse = z.infer<typeof listPluginsResponseSchema>;

export const listMarketplacesResponseSchema = z
  .object({
    marketplaces: z.array(marketplaceInfoSchema),
  })
  .passthrough();
export type ListMarketplacesResponse = z.infer<typeof listMarketplacesResponseSchema>;

export const getPlanCommentsResponseSchema = z
  .object({
    comments: z.array(planCommentDataSchema),
  })
  .passthrough();
export type GetPlanCommentsResponse = z.infer<typeof getPlanCommentsResponseSchema>;

export const fileReadResponseSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);
export type FileReadResponse = z.infer<typeof fileReadResponseSchema>;

export const sessionLaunchResponseSchema = z
  .object({
    channelId: z.string(),
    slashCommands: z.array(z.string()).optional(),
    models: z.array(z.unknown()).optional(),
    account: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type SessionLaunchResponse = z.infer<typeof sessionLaunchResponseSchema>;

export const sessionJoinResponseSchema = z.union([
  z
    .object({
      channelId: z.string(),
      state: z.string(),
      meta: channelMetaCacheSchema,
      events: z.array(socketEventSchema),
    })
    .passthrough(),
  z.object({ error: z.string() }),
]);
export type SessionJoinResponse = z.infer<typeof sessionJoinResponseSchema>;

export const rawEventsResponseSchema = z
  .object({
    events: z.array(z.unknown()),
  })
  .passthrough();
export type RawEventsResponse = z.infer<typeof rawEventsResponseSchema>;

export const initResponseSchema = z
  .object({
    settings: z.record(z.string(), z.unknown()),
    sessions: z.array(sessionStateSummarySchema),
    activeSessionId: z.string().optional(),
    models: z.array(z.unknown()).optional(),
    state: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
export type InitResponse = z.infer<typeof initResponseSchema>;

export const terminalGetContentsResponseSchema = z
  .object({
    content: z.string().nullable(),
  })
  .passthrough();
export type TerminalGetContentsResponse = z.infer<typeof terminalGetContentsResponseSchema>;

export const terminalOpenClaudeResponseSchema = z
  .object({
    success: z.boolean(),
    channelId: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type TerminalOpenClaudeResponse = z.infer<typeof terminalOpenClaudeResponseSchema>;

export const generateSessionTitleResponseSchema = z
  .object({
    success: z.boolean(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GenerateSessionTitleResponse = z.infer<typeof generateSessionTitleResponseSchema>;
