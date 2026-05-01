import { z } from 'zod';

// ── C2S ──

/** Inner permission response matching CLI's expected format */
export const controlPermissionResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        behavior: z.ZodLiteral<'allow'>;
        updatedInput: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        updatedPermissions: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
        toolUseID: z.ZodOptional<z.ZodString>;
        userFeedback: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        behavior: z.ZodLiteral<'deny'>;
        message: z.ZodString;
        interrupt: z.ZodBoolean;
        toolUseID: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >,
    z.ZodObject<{ continue: z.ZodBoolean }, z.core.$strip>,
  ]
> = z.union([
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

export const controlPermissionPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodString;
    toolName: z.ZodString;
    toolUseId: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    suggestions: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    callbackId: z.ZodOptional<z.ZodString>;
    blockedPath: z.ZodOptional<z.ZodString>;
    decisionReason: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
  toolName: z.string(),
  toolUseId: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  suggestions: z.array(z.record(z.string(), z.unknown())).optional(),
  callbackId: z.string().optional(),
  blockedPath: z.string().optional(),
  decisionReason: z.string().optional(),
  agentId: z.string().optional(),
});
export type ControlPermissionPayload = z.infer<typeof controlPermissionPayloadSchema>;

export const elicitationInputTypeSchema: z.ZodEnum<{
  text: 'text';
  url: 'url';
  select: 'select';
}> = z.enum(['text', 'url', 'select']);
export type ElicitationInputType = z.infer<typeof elicitationInputTypeSchema>;

export const controlElicitationPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodString;
    prompt: z.ZodString;
    inputType: z.ZodEnum<{ url: 'url'; text: 'text'; select: 'select' }>;
    options: z.ZodOptional<z.ZodArray<z.ZodString>>;
    url: z.ZodOptional<z.ZodString>;
    elicitationId: z.ZodOptional<z.ZodString>;
    mcpServerName: z.ZodOptional<z.ZodString>;
    requestedSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
  prompt: z.string(),
  inputType: elicitationInputTypeSchema,
  options: z.array(z.string()).optional(),
  url: z.string().optional(),
  elicitationId: z.string().optional(),
  mcpServerName: z.string().optional(),
  requestedSchema: z.record(z.string(), z.unknown()).optional(),
});
export type ControlElicitationPayload = z.infer<typeof controlElicitationPayloadSchema>;

export const controlDiffReviewPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
    toolId: z.ZodString;
    filePath: z.ZodString;
    oldContent: z.ZodString;
    newContent: z.ZodString;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string().optional(),
  toolId: z.string(),
  filePath: z.string(),
  oldContent: z.string(),
  newContent: z.string(),
});
export type ControlDiffReviewPayload = z.infer<typeof controlDiffReviewPayloadSchema>;

export const controlMcpPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    requestId: z.ZodString;
    serverName: z.ZodString;
    message: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
  serverName: z.string(),
  message: z.record(z.string(), z.unknown()),
});
export type ControlMcpPayload = z.infer<typeof controlMcpPayloadSchema>;

export const controlCancelPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; requestId: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  requestId: z.string(),
});
export type ControlCancelPayload = z.infer<typeof controlCancelPayloadSchema>;

// ── Internal event payloads (runner → server handler) ──

/** control:cancel / control:elicitation payload (requestId only) */
export const requestIdPayloadSchema: z.ZodObject<{ requestId: z.ZodString }, z.core.$loose> =
  z.looseObject({ requestId: z.string() });
export type RequestIdPayload = z.infer<typeof requestIdPayloadSchema>;

/** control:permission payload */
export const permissionPayloadSchema: z.ZodObject<
  { requestId: z.ZodString; toolName: z.ZodString; toolUseId: z.ZodString },
  z.core.$loose
> = z.looseObject({
  requestId: z.string(),
  toolName: z.string(),
  toolUseId: z.string(),
});
export type PermissionPayload = z.infer<typeof permissionPayloadSchema>;

/** auto-respond payload (action:open_url, action:open_file, notification:show, mcp:auto_respond) */
export const autoRespondPayloadSchema: z.ZodObject<
  { requestId: z.ZodString; response: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$loose
> = z.looseObject({
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type AutoRespondPayload = z.infer<typeof autoRespondPayloadSchema>;

/** control:forward payload (unknown control_request subtypes forwarded to client) */
export const controlForwardPayloadSchema: z.ZodObject<
  {
    requestId: z.ZodString;
    subtype: z.ZodString;
    toolName: z.ZodOptional<z.ZodString>;
    toolUseId: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodUnknown>;
    suggestions: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    callbackId: z.ZodOptional<z.ZodString>;
  },
  z.core.$loose
> = z.looseObject({
  requestId: z.string(),
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
  input: z.unknown().optional(),
  suggestions: z.array(z.unknown()).optional(),
  callbackId: z.string().optional(),
});
export type ControlForwardPayload = z.infer<typeof controlForwardPayloadSchema>;

/** Client-side pending control request state */
export const pendingControlSchema: z.ZodObject<
  {
    requestId: z.ZodString;
    subtype: z.ZodString;
    toolName: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    toolUseId: z.ZodOptional<z.ZodString>;
    permissionSuggestions: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    callbackId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  requestId: z.string(),
  subtype: z.string(),
  toolName: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  toolUseId: z.string().optional(),
  permissionSuggestions: z.array(z.record(z.string(), z.unknown())).optional(),
  callbackId: z.string().optional(),
});
export type PendingControl = z.infer<typeof pendingControlSchema>;

/** control:open_diff internal payload */
export const controlOpenDiffPayloadSchema: z.ZodObject<
  { requestId: z.ZodString; originalPath: z.ZodString; newPath: z.ZodString },
  z.core.$loose
> = z.looseObject({
  requestId: z.string(),
  originalPath: z.string(),
  newPath: z.string(),
});
export type ControlOpenDiffPayload = z.infer<typeof controlOpenDiffPayloadSchema>;

/** chat:respond response payload (server parses user response to control_request). */
export const controlRespondPayloadSchema: z.ZodObject<
  {
    behavior: z.ZodOptional<z.ZodString>;
    updatedInput: z.ZodOptional<z.ZodUnknown>;
    updatedPermissions: z.ZodOptional<z.ZodUnknown>;
    message: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  behavior: z.string().optional(),
  updatedInput: z.unknown().optional(),
  updatedPermissions: z.unknown().optional(),
  message: z.string().optional(),
});
export type ControlRespondPayload = z.infer<typeof controlRespondPayloadSchema>;

/** Resolved control_response shape (CLI → server, after transform). */
export const resolvedControlResponseSchema: z.ZodObject<
  {
    requestId: z.ZodString;
    success: z.ZodBoolean;
    response: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  requestId: z.string(),
  success: z.boolean(),
  response: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type ResolvedControlResponse = z.infer<typeof resolvedControlResponseSchema>;
