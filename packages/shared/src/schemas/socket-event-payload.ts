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
