import { z } from 'zod';

/** control:cancel / control:elicitation payload (requestId only) */
export const requestIdPayloadSchema = z.looseObject({ requestId: z.string() });

/** control:permission payload */
export const permissionPayloadSchema = z.looseObject({
  requestId: z.string(),
  toolName: z.string(),
  toolUseId: z.string(),
});

/** control:diff_review payload */
export const diffReviewPayloadSchema = z.looseObject({ toolId: z.string() });

/** system:rate_limit payload */
export const rateLimitPayloadSchema = z.looseObject({
  info: z.looseObject({
    status: z.string(),
    rateLimitType: z.string().optional(),
    resetsAt: z.coerce.number().optional(),
    utilization: z.number().optional(),
    overageStatus: z.string().optional(),
    isUsingOverage: z.boolean().optional(),
  }),
});

/** control:mcp payload */
export const mcpPayloadSchema = z.looseObject({
  requestId: z.string(),
  message: z.record(z.string(), z.unknown()).optional(),
});

/** auto_respond set_model action input */
export const serverActionModelSchema = z.looseObject({ model: z.string() });

/** auto_respond set_permission_mode action input */
export const serverActionModeSchema = z.looseObject({ mode: z.string() });

/** auto-respond payload (action:open_url, action:open_file, notification:show, mcp:auto_respond) */
export const autoRespondPayloadSchema = z.looseObject({
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});

/** CLI-initiated settings update (settings:model_updated, settings:permission_mode_updated) */
export const settingsUpdatedPayloadSchema = z.looseObject({
  requestId: z.string(),
  input: z.unknown(),
});

/** control:forward payload (unknown control_request subtypes forwarded to client) */
export const controlForwardPayloadSchema = z.looseObject({
  requestId: z.string(),
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
  input: z.unknown().optional(),
  suggestions: z.array(z.unknown()).optional(),
  callbackId: z.string().optional(),
});

/** control:open_diff payload */
export const controlOpenDiffPayloadSchema = z.looseObject({
  requestId: z.string(),
  originalPath: z.string(),
  newPath: z.string(),
});

/** channel:exit payload */
export const channelExitPayloadSchema = z.looseObject({
  code: z.number().nullable(),
});
