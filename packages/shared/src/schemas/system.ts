import { z } from 'zod';
import { rateLimitInfoSchema, remoteControlStateInfoSchema } from './settings.ts';

// ── Model info ──

export const modelInfoSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  supportsEffort: z.boolean().optional(),
  supportedEffortLevels: z.array(z.string()).optional(),
  supportsAdaptiveThinking: z.boolean().optional(),
  supportsFastMode: z.boolean().optional(),
});
export type ModelInfo = z.infer<typeof modelInfoSchema>;

// ── Hook info ──

export const hookStartedInfoSchema = z.object({
  hookName: z.string(),
  hookId: z.string(),
  hookEvent: z.string(),
});
export type HookStartedInfo = z.infer<typeof hookStartedInfoSchema>;

export const hookResponseInfoSchema = z.object({
  hookName: z.string(),
  hookId: z.string(),
  hookEvent: z.string(),
  hookEventName: z.string().optional(),
  output: z.string().optional(),
  additionalContext: z.string().optional(),
});
export type HookResponseInfo = z.infer<typeof hookResponseInfoSchema>;

// ── S2C payloads ──

export const systemHookStartedPayloadSchema = z.object({
  channelId: z.string(),
  hook: hookStartedInfoSchema,
});
export type SystemHookStartedPayload = z.infer<typeof systemHookStartedPayloadSchema>;

export const systemHookResponsePayloadSchema = z.object({
  channelId: z.string(),
  hook: hookResponseInfoSchema,
});
export type SystemHookResponsePayload = z.infer<typeof systemHookResponsePayloadSchema>;

export const systemTaskStartedPayloadSchema = z.object({
  channelId: z.string(),
  description: z.string(),
  taskType: z.string().optional(),
});
export type SystemTaskStartedPayload = z.infer<typeof systemTaskStartedPayloadSchema>;

export const systemTaskProgressPayloadSchema = z.object({
  channelId: z.string(),
  taskId: z.string(),
  toolUseId: z.string().optional(),
  description: z.string().optional(),
  lastToolName: z.string().optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
});
export type SystemTaskProgressPayload = z.infer<typeof systemTaskProgressPayloadSchema>;

export const systemTaskNotificationPayloadSchema = z.object({
  channelId: z.string(),
  taskId: z.string(),
  toolUseId: z.string().optional(),
  status: z.string().optional(),
  outputFile: z.string().optional(),
  summary: z.string().optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
});
export type SystemTaskNotificationPayload = z.infer<typeof systemTaskNotificationPayloadSchema>;

export const systemCompactBoundaryPayloadSchema = z.object({
  channelId: z.string(),
  preservedSegment: z.boolean().optional(),
});
export type SystemCompactBoundaryPayload = z.infer<typeof systemCompactBoundaryPayloadSchema>;

export const systemRateLimitPayloadSchema = z.object({
  channelId: z.string(),
  info: rateLimitInfoSchema,
});
export type SystemRateLimitPayload = z.infer<typeof systemRateLimitPayloadSchema>;

export const systemApiRetryPayloadSchema = z.object({
  channelId: z.string(),
  attempt: z.number(),
  maxRetries: z.number(),
  retryDelayMs: z.number().optional(),
  errorStatus: z.number().optional(),
  error: z.string().optional(),
});
export type SystemApiRetryPayload = z.infer<typeof systemApiRetryPayloadSchema>;

/** system:rate_limit internal payload (runner → server, uses numeric resetsAt) */
export const rateLimitInternalPayloadSchema = z.looseObject({
  info: z.looseObject({
    status: z.string(),
    rateLimitType: z.string().optional(),
    resetsAt: z.coerce.number().optional(),
    utilization: z.number().optional(),
    overageStatus: z.string().optional(),
    isUsingOverage: z.boolean().optional(),
  }),
});
export type RateLimitInternalPayload = z.infer<typeof rateLimitInternalPayloadSchema>;

export const systemExperimentGatesPayloadSchema = z.object({
  channelId: z.string(),
  gates: z.record(z.string(), z.boolean()),
});
export type SystemExperimentGatesPayload = z.infer<typeof systemExperimentGatesPayloadSchema>;

export const systemAvailableModelsPayloadSchema = z.object({
  channelId: z.string(),
  models: z.array(z.unknown()),
});
export type SystemAvailableModelsPayload = z.infer<typeof systemAvailableModelsPayloadSchema>;

export const systemRemoteControlPayloadSchema = z.object({
  channelId: z.string(),
  info: remoteControlStateInfoSchema,
});
export type SystemRemoteControlPayload = z.infer<typeof systemRemoteControlPayloadSchema>;

// ── Hook C2S (moved from control.ts) ──

export const chatHookCallbackRespondPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  response: z.object({ continue: z.boolean() }),
});
export type ChatHookCallbackRespondPayload = z.infer<typeof chatHookCallbackRespondPayloadSchema>;

// ── Hook S2C (moved from control.ts) ──

export const controlHookCallbackPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  callbackId: z.string(),
  input: z.record(z.string(), z.unknown()).optional(),
  toolUseId: z.string().optional(),
});
export type ControlHookCallbackPayload = z.infer<typeof controlHookCallbackPayloadSchema>;
