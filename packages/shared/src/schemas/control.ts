import { z } from 'zod';

// ── C2S ──

/** Inner permission response matching CLI's expected format */
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
export type ControlPermissionResponse = z.infer<typeof controlPermissionResponseSchema>;

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

// ── S2C payloads ──

export const controlPermissionPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  toolName: z.string(),
  toolUseId: z.string().optional(),
  input: z.unknown(),
  suggestions: z.array(z.unknown()).optional(),
  callbackId: z.string().optional(),
  blockedPath: z.string().optional(),
  decisionReason: z.string().optional(),
  agentId: z.string().optional(),
});
export type ControlPermissionPayload = z.infer<typeof controlPermissionPayloadSchema>;

export const controlElicitationPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  prompt: z.string(),
  inputType: z.enum(['text', 'url', 'select']),
  options: z.array(z.string()).optional(),
  url: z.string().optional(),
  elicitationId: z.string().optional(),
  mcpServerName: z.string().optional(),
  requestedSchema: z.record(z.string(), z.unknown()).optional(),
});
export type ControlElicitationPayload = z.infer<typeof controlElicitationPayloadSchema>;

export const controlDiffReviewPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string().optional(),
  toolId: z.string(),
  filePath: z.string(),
  oldContent: z.string(),
  newContent: z.string(),
});
export type ControlDiffReviewPayload = z.infer<typeof controlDiffReviewPayloadSchema>;

export const controlMcpPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  serverName: z.string(),
  message: z.record(z.string(), z.unknown()),
});
export type ControlMcpPayload = z.infer<typeof controlMcpPayloadSchema>;

export const controlCancelPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
});
export type ControlCancelPayload = z.infer<typeof controlCancelPayloadSchema>;

export const controlHookCallbackPayloadSchema = z.object({
  channelId: z.string(),
  requestId: z.string(),
  callbackId: z.string(),
  input: z.unknown(),
  toolUseId: z.string().optional(),
});
export type ControlHookCallbackPayload = z.infer<typeof controlHookCallbackPayloadSchema>;

// ── Response schemas ──

export const generateSessionTitleResponseSchema = z
  .object({
    success: z.boolean(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GenerateSessionTitleResponse = z.infer<typeof generateSessionTitleResponseSchema>;

export const getClaudeStateResponseSchema = z
  .object({
    success: z.boolean(),
    state: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GetClaudeStateResponse = z.infer<typeof getClaudeStateResponseSchema>;

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
