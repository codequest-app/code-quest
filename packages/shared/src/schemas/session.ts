import { z } from 'zod';
import { channelMetaCacheSchema, clientMessageSchema } from './common.ts';
import { rpcResult } from './rpc.ts';

// ── Session summary (moved from common.ts) ──

export const sessionSummarySchema = z.object({
  /** The durable sessionId (DB row PK). Use this when calling useResume(). */
  id: z.string(),
  channelId: z.string(),
  provider: z.string(),
  command: z.string(),
  args: z.string(),
  cwd: z.string().optional(),
  projectRoot: z.string(),
  mode: z.string(),
  role: z.string(),
  parentId: z.string().optional(),
  title: z.string().optional(),
  createdAt: z.string(),
  isActive: z.boolean().optional(),
  lastAssistantMessage: z.string().optional(),
  firstUserMessage: z.string().optional(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionListResponseSchema = rpcResult(
  z.object({
    sessions: z.array(sessionSummarySchema),
    total: z.number(),
  }),
);
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;

// ── Internal schemas ──

export const initializeOptionsSchema = z.looseObject({
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
  resumeSessionAt: z.string().optional(),
});
export type InitializeOptions = z.infer<typeof initializeOptionsSchema>;

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

export const sessionLaunchPayloadSchema = z.object({
  channelId: z.string().optional(),
  initialPrompt: z.string().optional(),
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  thinkingLevel: z.string().optional(),
  cwd: z.string().optional(),
  initOptions: initializeOptionsSchema.optional(),
  launchOptions: launchOptionsSchema,
});
export type SessionLaunchPayload = z.infer<typeof sessionLaunchPayloadSchema>;

export const sessionJoinPayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionJoinPayload = z.infer<typeof sessionJoinPayloadSchema>;

export const sessionClosePayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionClosePayload = z.infer<typeof sessionClosePayloadSchema>;

export const sessionListPayloadSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  cwd: z.string().optional(),
  hasParentId: z.boolean().optional(),
  /** When true, omit sessions whose sessionId currently has an alive Channel. */
  excludeLive: z.boolean().optional(),
});
export type SessionListPayload = z.infer<typeof sessionListPayloadSchema>;

export const sessionResumePayloadSchema = z.object({
  sessionId: z.string(),
});
export type SessionResumePayload = z.infer<typeof sessionResumePayloadSchema>;

export const sessionResumeResponseSchema = rpcResult(z.object({ channelId: z.string() }));
export type SessionResumeResponse = z.infer<typeof sessionResumeResponseSchema>;

export const sessionListRemotePayloadSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});
export type SessionListRemotePayload = z.infer<typeof sessionListRemotePayloadSchema>;

export const sessionGetPayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionGetPayload = z.infer<typeof sessionGetPayloadSchema>;

export const sessionRenamePayloadSchema = z.object({
  channelId: z.string(),
  title: z.string().min(1).max(200),
});
export type SessionRenamePayload = z.infer<typeof sessionRenamePayloadSchema>;

export const sessionDeletePayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionDeletePayload = z.infer<typeof sessionDeletePayloadSchema>;

export const sessionForkPayloadSchema = z.object({
  forkedFromChannelId: z.string(),
  resumeSessionAt: z.string().optional(),
  newChannelId: z.string(),
});
export type SessionForkPayload = z.infer<typeof sessionForkPayloadSchema>;

export const sessionTeleportPayloadSchema = z.object({
  remoteChannelId: z.string(),
  branch: z.string().optional(),
  newChannelId: z.string(),
});
export type SessionTeleportPayload = z.infer<typeof sessionTeleportPayloadSchema>;

export const sessionUpdateStatePayloadSchema = z.object({
  channelId: z.string(),
  title: z.string().optional(),
  state: z.enum(['busy', 'idle']).optional(),
});
export type SessionUpdateStatePayload = z.infer<typeof sessionUpdateStatePayloadSchema>;

export const sessionBroadcastStateSchema = z.enum([
  'launching',
  'busy',
  'idle',
  'exited',
  'disconnected',
]);
export type SessionBroadcastState = z.infer<typeof sessionBroadcastStateSchema>;

export const sessionStateSummarySchema = z.object({
  channelId: z.string(),
  state: sessionBroadcastStateSchema,
  title: z.string().optional(),
  modelSetting: z.string().optional(),
  permissionMode: z.string().optional(),
  effort: z.string().optional(),
  cwd: z.string().optional(),
  projectRoot: z.string(),
});
export type SessionStateSummary = z.infer<typeof sessionStateSummarySchema>;

// ── Response schemas ──

export const sessionLaunchResponseSchema = rpcResult(
  z.object({
    channelId: z.string(),
    slashCommands: z.array(z.string()).optional(),
    models: z.array(z.unknown()).optional(),
    account: z.record(z.string(), z.unknown()).optional(),
  }),
);
export type SessionLaunchResponse = z.infer<typeof sessionLaunchResponseSchema>;

export const sessionJoinResponseSchema = rpcResult(
  z.object({
    channelId: z.string(),
    state: z.string(),
    meta: channelMetaCacheSchema,
    events: z.array(clientMessageSchema),
    cwd: z.string(),
  }),
);
export type SessionJoinResponse = z.infer<typeof sessionJoinResponseSchema>;

export const getSessionResponseSchema = rpcResult(
  z.object({
    session: sessionSummarySchema,
    events: z.array(clientMessageSchema),
    meta: channelMetaCacheSchema,
  }),
);
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;

export const teleportSessionResponseSchema = rpcResult(
  z.object({
    channelId: z.string(),
    events: z.array(clientMessageSchema),
    branchCheckoutFailed: z.boolean().optional(),
    branch: z.string().optional(),
  }),
);
export type TeleportSessionResponse = z.infer<typeof teleportSessionResponseSchema>;

export const forkConversationResponseSchema = rpcResult(
  z.object({
    channelId: z.string(),
    parentChannelId: z.string(),
  }),
);
export type ForkConversationResponse = z.infer<typeof forkConversationResponseSchema>;

export const initResponseSchema = z.looseObject({
  settings: z.record(z.string(), z.unknown()),
  sessions: z.array(sessionStateSummarySchema),
  activeChannelId: z.string().optional(),
  models: z.array(z.unknown()).optional(),
  state: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.object({ worktree: z.boolean() }).optional(),
});
export type InitResponse = z.infer<typeof initResponseSchema>;

export const rawEventsResponseSchema = z.looseObject({
  events: z.array(z.unknown()),
});
export type RawEventsResponse = z.infer<typeof rawEventsResponseSchema>;

// ── S2C payloads ──

export const sessionCreatedPayloadSchema = z.object({
  channelId: z.string(),
  cwd: z.string(),
  projectRoot: z.string(),
});
export type SessionCreatedPayload = z.infer<typeof sessionCreatedPayloadSchema>;

export const sessionClosedPayloadSchema = z.object({
  channelId: z.string(),
  error: z.string().optional(),
});
export type SessionClosedPayload = z.infer<typeof sessionClosedPayloadSchema>;

export const sessionDeadPayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionDeadPayload = z.infer<typeof sessionDeadPayloadSchema>;

export const sessionStatesPayloadSchema = z.object({
  sessions: z.array(sessionStateSummarySchema),
  activeChannelId: z.string().optional(),
});
export type SessionStatesPayload = z.infer<typeof sessionStatesPayloadSchema>;

export const sessionInitPayloadSchema = z.object({
  channelId: z.string(),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  fastModeState: z.unknown().optional(),
  slashCommands: z.array(z.string()).optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
  config: z.record(z.string(), z.unknown()),
});
export type SessionInitPayload = z.infer<typeof sessionInitPayloadSchema>;

export const sessionStatusPayloadSchema = z.object({
  channelId: z.string(),
  status: z.string(),
  permissionMode: z.string().optional(),
});
export type SessionStatusPayload = z.infer<typeof sessionStatusPayloadSchema>;

/** channel:exit payload */
export const channelExitPayloadSchema = z.looseObject({
  code: z.number().nullable(),
});
export type ChannelExitPayload = z.infer<typeof channelExitPayloadSchema>;

export const closeChannelPayloadSchema = z.object({
  channelId: z.string(),
  error: z.string().optional(),
});
export type CloseChannelPayload = z.infer<typeof closeChannelPayloadSchema>;

export const cancelRequestEventPayloadSchema = z.object({
  channelId: z.string(),
  targetRequestId: z.string(),
});
export type CancelRequestEventPayload = z.infer<typeof cancelRequestEventPayloadSchema>;

// ── Session title (moved from control.ts) ──

export const sessionGenerateTitlePayloadSchema = z.object({
  channelId: z.string(),
  description: z.string(),
  persist: z.boolean(),
});
export type SessionGenerateTitlePayload = z.infer<typeof sessionGenerateTitlePayloadSchema>;

export const generateSessionTitleResponseSchema = z.looseObject({
  success: z.boolean(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});
export type GenerateSessionTitleResponse = z.infer<typeof generateSessionTitleResponseSchema>;

// ── Rewind (moved from message-payloads.ts) ──

export const fileDiffSchema = z.object({
  oldContent: z.string().nullable(),
  newContent: z.string().nullable(),
});
export type FileDiff = z.infer<typeof fileDiffSchema>;

// ── Internal stdout events (server) ──

export const errorMessageEventSchema = z.looseObject({ message: z.string() });
export type ErrorMessageEvent = z.infer<typeof errorMessageEventSchema>;

export const sessionInitEventSchema = z.looseObject({
  sessionId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  tools: z.array(z.string()).optional(),
  fastModeState: z.unknown().optional(),
  mcpServers: z.array(z.looseObject({ name: z.string(), status: z.string() })).optional(),
  slashCommands: z.array(z.string()).optional(),
});
export type SessionInitEvent = z.infer<typeof sessionInitEventSchema>;

export const sessionStatusEventSchema = z.looseObject({
  permissionMode: z.string().optional(),
});
export type SessionStatusEvent = z.infer<typeof sessionStatusEventSchema>;

export const controlRequestEventSchema = z.looseObject({ requestId: z.string() });
export type ControlRequestEvent = z.infer<typeof controlRequestEventSchema>;

export const sessionConfigSchema = z.object({
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  effort: z.string().optional(),
  thinkingLevel: z.string().optional(),
  tools: z.array(z.string()).optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
});
export type SessionConfig = z.infer<typeof sessionConfigSchema>;

/** Extract config fields from session:init. cwd extracted separately to channel.cwd. */
export const sessionInitConfigSchema = sessionConfigSchema
  .pick({
    model: true,
    permissionMode: true,
    effort: true,
  })
  .extend({ cwd: z.string().optional() });
export type SessionInitConfig = z.infer<typeof sessionInitConfigSchema>;

// ── Init response result (server connect handler) ──

export const initResponseResultSchema = z.object({
  slashCommands: z.array(z.string()).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
export type InitResponseResult = z.infer<typeof initResponseResultSchema>;

export const rewindResultSchema = z.object({
  canRewind: z.boolean(),
  filesChanged: z.array(z.string()).optional(),
  fileDiffs: z.record(z.string(), fileDiffSchema).optional(),
  insertions: z.number().optional(),
  deletions: z.number().optional(),
  error: z.string().optional(),
});
export type RewindResult = z.infer<typeof rewindResultSchema>;
