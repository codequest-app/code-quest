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
    updatedPermissions: z.array(z.record(z.string(), z.unknown())).optional(),
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

export const sessionListResponseSchema = z.object({
  sessions: z.array(z.record(z.string(), z.unknown())),
  total: z.number(),
});
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;

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
