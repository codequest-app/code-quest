import { z } from 'zod';
import { channelMetaCacheSchema, clientMessageSchema } from './common.ts';

// ── Session summary (moved from common.ts) ──

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
  firstUserMessage: z.string().optional(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSummarySchema),
  total: z.number(),
});
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;

// ── Internal schemas ──

const initializeOptionsSchema = z
  .looseObject({
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

export const sessionLaunchSchema = z.object({
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
export type SessionLaunchPayload = z.infer<typeof sessionLaunchSchema>;

export const sessionJoinSchema = z.object({
  channelId: z.string(),
});
export type SessionJoinPayload = z.infer<typeof sessionJoinSchema>;

export const sessionCloseSchema = z.object({
  channelId: z.string(),
});
export type SessionClosePayload = z.infer<typeof sessionCloseSchema>;

export const sessionListSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  cwd: z.string().optional(),
  hasParentId: z.boolean().optional(),
});
export type SessionListPayload = z.infer<typeof sessionListSchema>;

export const sessionListRemoteSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});
export type SessionListRemotePayload = z.infer<typeof sessionListRemoteSchema>;

export const sessionGetSchema = z.object({
  channelId: z.string(),
});
export type SessionGetPayload = z.infer<typeof sessionGetSchema>;

export const sessionRenameSchema = z.object({
  channelId: z.string(),
  title: z.string().min(1).max(200),
});
export type SessionRenamePayload = z.infer<typeof sessionRenameSchema>;

export const sessionDeleteSchema = z.object({
  channelId: z.string(),
});
export type SessionDeletePayload = z.infer<typeof sessionDeleteSchema>;

export const sessionForkSchema = z.object({
  forkedFromSession: z.string(),
  resumeSessionAt: z.string().optional(),
  newSessionId: z.string(),
});
export type SessionForkPayload = z.infer<typeof sessionForkSchema>;

export const sessionTeleportSchema = z.object({
  remoteSessionId: z.string(),
  branch: z.string().optional(),
  newSessionId: z.string(),
});
export type SessionTeleportPayload = z.infer<typeof sessionTeleportSchema>;

export const sessionUpdateStateSchema = z.object({
  channelId: z.string(),
  title: z.string().optional(),
  state: z.enum(['busy', 'idle']).optional(),
});
export type SessionUpdateStatePayload = z.infer<typeof sessionUpdateStateSchema>;

export const sessionStateSummarySchema = z.object({
  channelId: z.string(),
  state: z.enum(['launching', 'busy', 'idle', 'exited', 'disconnected']),
  title: z.string().optional(),
  modelSetting: z.string().optional(),
  permissionMode: z.string().optional(),
  effort: z.string().optional(),
});
export type SessionStateSummary = z.infer<typeof sessionStateSummarySchema>;

// ── Response schemas ──

export const sessionLaunchResponseSchema = z.looseObject({
  channelId: z.string(),
  slashCommands: z.array(z.string()).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type SessionLaunchResponse = z.infer<typeof sessionLaunchResponseSchema>;

export const sessionJoinResponseSchema = z.union([
  z.looseObject({
    channelId: z.string(),
    state: z.string(),
    meta: channelMetaCacheSchema,
    events: z.array(clientMessageSchema),
  }),
  z.object({ error: z.string() }),
]);
export type SessionJoinResponse = z.infer<typeof sessionJoinResponseSchema>;

export const getSessionResponseSchema = z.union([
  z.looseObject({
    session: sessionSummarySchema,
    events: z.array(clientMessageSchema),
    meta: channelMetaCacheSchema,
  }),
  z.object({ error: z.string() }),
]);
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;

export const teleportSessionResponseSchema = z.looseObject({
  success: z.boolean(),
  channelId: z.string().optional(),
  events: z.array(clientMessageSchema).optional(),
  error: z.string().optional(),
});
export type TeleportSessionResponse = z.infer<typeof teleportSessionResponseSchema>;

export const forkConversationResponseSchema = z.looseObject({
  success: z.boolean(),
  channelId: z.string().optional(),
  parentSessionId: z.string().optional(),
  events: z.array(clientMessageSchema).optional(),
  error: z.string().optional(),
});
export type ForkConversationResponse = z.infer<typeof forkConversationResponseSchema>;

export const initResponseSchema = z.looseObject({
  settings: z.record(z.string(), z.unknown()),
  sessions: z.array(sessionStateSummarySchema),
  activeSessionId: z.string().optional(),
  models: z.array(z.unknown()).optional(),
  state: z.record(z.string(), z.unknown()).optional(),
});
export type InitResponse = z.infer<typeof initResponseSchema>;

export const rawEventsResponseSchema = z.looseObject({
  events: z.array(z.unknown()),
});
export type RawEventsResponse = z.infer<typeof rawEventsResponseSchema>;

// ── S2C payloads ──

export const sessionCreatedPayloadSchema = z.object({
  channelId: z.string(),
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

export const sessionResumePayloadSchema = z.object({
  channelId: z.string(),
});
export type SessionResumePayload = z.infer<typeof sessionResumePayloadSchema>;

export const sessionStatesPayloadSchema = z.object({
  sessions: z.array(sessionStateSummarySchema),
  activeSessionId: z.string().optional(),
});
export type SessionStatesPayload = z.infer<typeof sessionStatesPayloadSchema>;

export const sessionInitPayloadSchema = z.object({
  channelId: z.string(),
  sessionId: z.string(),
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

export const sessionGenerateTitleSchema = z.object({
  channelId: z.string(),
  description: z.string(),
  persist: z.boolean(),
});
export type SessionGenerateTitlePayload = z.infer<typeof sessionGenerateTitleSchema>;

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

export const rewindResultSchema = z.object({
  canRewind: z.boolean(),
  filesChanged: z.array(z.string()).optional(),
  fileDiffs: z.record(z.string(), fileDiffSchema).optional(),
  insertions: z.number().optional(),
  deletions: z.number().optional(),
  error: z.string().optional(),
});
export type RewindResult = z.infer<typeof rewindResultSchema>;
