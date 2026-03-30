import { z } from 'zod';
import { hookResponseInfoSchema, hookStartedInfoSchema } from './control.ts';
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

export const systemFileUpdatedPayloadSchema = z.object({
  channelId: z.string(),
  filePath: z.string(),
  oldContent: z.string().nullable().optional(),
  newContent: z.string().nullable().optional(),
});
export type SystemFileUpdatedPayload = z.infer<typeof systemFileUpdatedPayloadSchema>;

export const systemExperimentGatesPayloadSchema = z.object({
  channelId: z.string(),
  gates: z.record(z.string(), z.unknown()),
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
