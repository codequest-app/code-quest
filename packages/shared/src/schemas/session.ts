import { z } from 'zod';
import { channelMetaCacheSchema, sessionSummarySchema, socketEventSchema } from './common.ts';

// Re-export so consumers can still import from session
export { type SessionSummary, sessionSummarySchema } from './common.ts';

// ── Internal schemas ──

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
export type ChatCreatePayload = z.infer<typeof chatCreateSchema>;

export const chatJoinSchema = z.object({
  channelId: z.string(),
});
export type ChatJoinPayload = z.infer<typeof chatJoinSchema>;

export const chatKillSchema = z.object({
  channelId: z.string(),
});
export type ChatKillPayload = z.infer<typeof chatKillSchema>;

export const sessionListSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
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

export const rawEventsResponseSchema = z
  .object({
    events: z.array(z.unknown()),
  })
  .passthrough();
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
