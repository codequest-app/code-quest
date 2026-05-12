import { z } from 'zod';
import { rateLimitInfoSchema, remoteControlStateInfoSchema } from './settings.ts';

// ── Token usage ──

export const tokenUsageSchema: z.ZodObject<
  { input_tokens: z.ZodOptional<z.ZodNumber>; output_tokens: z.ZodOptional<z.ZodNumber> },
  z.core.$strip
> = z.object({
  input_tokens: z.number().optional(),
  output_tokens: z.number().optional(),
});
export type TokenUsage = z.infer<typeof tokenUsageSchema>;

// ── Model info ──

export const modelInfoSchema: z.ZodObject<
  {
    value: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    supportsEffort: z.ZodOptional<z.ZodBoolean>;
    supportedEffortLevels: z.ZodOptional<z.ZodArray<z.ZodString>>;
    supportsAdaptiveThinking: z.ZodOptional<z.ZodBoolean>;
    supportsFastMode: z.ZodOptional<z.ZodBoolean>;
    supportsAutoMode: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
> = z.object({
  value: z.string(),
  label: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  supportsEffort: z.boolean().optional(),
  supportedEffortLevels: z.array(z.string()).optional(),
  supportsAdaptiveThinking: z.boolean().optional(),
  supportsFastMode: z.boolean().optional(),
  supportsAutoMode: z.boolean().optional(),
});
export type ModelInfo = z.infer<typeof modelInfoSchema>;

// ── S2C payloads ──

export const systemCompactBoundaryPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; preservedSegment: z.ZodOptional<z.ZodBoolean> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  preservedSegment: z.boolean().optional(),
});
export type SystemCompactBoundaryPayload = z.infer<typeof systemCompactBoundaryPayloadSchema>;

export const systemRateLimitPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    info: z.ZodObject<
      {
        status: z.ZodString;
        rateLimitType: z.ZodOptional<z.ZodString>;
        resetsAt: z.ZodOptional<z.ZodString>;
        utilization: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        overageStatus: z.ZodOptional<z.ZodString>;
        isUsingOverage: z.ZodOptional<z.ZodBoolean>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  info: rateLimitInfoSchema,
});
export type SystemRateLimitPayload = z.infer<typeof systemRateLimitPayloadSchema>;

export const systemApiRetryPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    attempt: z.ZodNumber;
    maxRetries: z.ZodNumber;
    retryDelayMs: z.ZodOptional<z.ZodNumber>;
    errorStatus: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  attempt: z.number(),
  maxRetries: z.number(),
  retryDelayMs: z.number().optional(),
  errorStatus: z.number().optional(),
  error: z.string().optional(),
});
export type SystemApiRetryPayload = z.infer<typeof systemApiRetryPayloadSchema>;

/** system:rate_limit internal payload (runner → server, uses numeric resetsAt) */
export const rateLimitInternalPayloadSchema: z.ZodObject<
  {
    info: z.ZodObject<
      {
        status: z.ZodString;
        rateLimitType: z.ZodOptional<z.ZodString>;
        resetsAt: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        utilization: z.ZodOptional<z.ZodNumber>;
        overageStatus: z.ZodOptional<z.ZodString>;
        isUsingOverage: z.ZodOptional<z.ZodBoolean>;
      },
      z.core.$loose
    >;
  },
  z.core.$loose
> = z.looseObject({
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

export const systemExperimentGatesPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; gates: z.ZodRecord<z.ZodString, z.ZodBoolean> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  gates: z.record(z.string(), z.boolean()),
});
export type SystemExperimentGatesPayload = z.infer<typeof systemExperimentGatesPayloadSchema>;

export const systemAvailableModelsPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; models: z.ZodArray<z.ZodUnknown> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  models: z.array(z.unknown()),
});
export type SystemAvailableModelsPayload = z.infer<typeof systemAvailableModelsPayloadSchema>;

export const systemRemoteControlPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    info: z.ZodObject<
      {
        state: z.ZodEnum<{ error: 'error'; disconnected: 'disconnected'; ready: 'ready' }>;
        detail: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  info: remoteControlStateInfoSchema,
});
export type SystemRemoteControlPayload = z.infer<typeof systemRemoteControlPayloadSchema>;

export const systemMirrorErrorPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; error: z.ZodString; sessionId: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  error: z.string(),
  sessionId: z.string().optional(),
});
export type SystemMirrorErrorPayload = z.infer<typeof systemMirrorErrorPayloadSchema>;

// ── Hook C2S ──

export const chatHookCallbackRespondPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodString;
    response: z.ZodObject<{ continue: z.ZodBoolean }, z.core.$strip>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
  response: z.object({ continue: z.boolean() }),
});
export type ChatHookCallbackRespondPayload = z.infer<typeof chatHookCallbackRespondPayloadSchema>;

// ── Hook S2C ──

export const controlHookCallbackPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodString;
    callbackId: z.ZodString;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    toolUseId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
  callbackId: z.string(),
  input: z.record(z.string(), z.unknown()).optional(),
  toolUseId: z.string().optional(),
});
export type ControlHookCallbackPayload = z.infer<typeof controlHookCallbackPayloadSchema>;

export const systemPostTurnSummaryPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; summary: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  summary: z.string(),
});
export type SystemPostTurnSummaryPayload = z.infer<typeof systemPostTurnSummaryPayloadSchema>;
