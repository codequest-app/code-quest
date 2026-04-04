import { z } from 'zod';

// ── C2S ──

/** Inner permission response matching CLI's expected format */
export const controlPermissionResponseSchema = z.union([
  z.object({
    behavior: z.literal('allow'),
    updatedInput: z.record(z.string(), z.unknown()),
    updatedPermissions: z.array(z.unknown()).optional(),
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

// ── Internal event payloads (runner → server handler) ──

/** control:cancel / control:elicitation payload (requestId only) */
export const requestIdPayloadSchema = z.looseObject({ requestId: z.string() });
export type RequestIdPayload = z.infer<typeof requestIdPayloadSchema>;

/** control:permission payload */
export const permissionPayloadSchema = z.looseObject({
  requestId: z.string(),
  toolName: z.string(),
  toolUseId: z.string(),
});
export type PermissionPayload = z.infer<typeof permissionPayloadSchema>;

/** auto-respond payload (action:open_url, action:open_file, notification:show, mcp:auto_respond) */
export const autoRespondPayloadSchema = z.looseObject({
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type AutoRespondPayload = z.infer<typeof autoRespondPayloadSchema>;

/** control:forward payload (unknown control_request subtypes forwarded to client) */
export const controlForwardPayloadSchema = z.looseObject({
  requestId: z.string(),
  subtype: z.string(),
});
export type ControlForwardPayload = z.infer<typeof controlForwardPayloadSchema>;

/** control:open_diff internal payload */
export const controlOpenDiffPayloadSchema = z.looseObject({
  requestId: z.string(),
  originalPath: z.string(),
  newPath: z.string(),
});
export type ControlOpenDiffPayload = z.infer<typeof controlOpenDiffPayloadSchema>;
