import { z } from 'zod';

/** message:result payload */
export const resultPayloadSchema = z
  .object({ errors: z.array(z.string()).optional() })
  .passthrough();

/** control:cancel / control:elicitation payload (requestId only) */
export const requestIdPayloadSchema = z.object({ requestId: z.string() }).passthrough();

/** control:permission payload */
export const permissionPayloadSchema = z
  .object({ requestId: z.string(), toolName: z.string(), toolUseId: z.string() })
  .passthrough();

/** control:diff_review payload */
export const diffReviewPayloadSchema = z.object({ toolId: z.string() }).passthrough();

/** system:rate_limit payload */
export const rateLimitPayloadSchema = z
  .object({
    info: z
      .object({
        status: z.string(),
        rateLimitType: z.string().optional(),
        resetsAt: z.coerce.number().optional(),
        utilization: z.number().optional(),
        overageStatus: z.string().optional(),
        isUsingOverage: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();

/** control:mcp payload */
export const mcpPayloadSchema = z
  .object({
    requestId: z.string(),
    message: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

/** auto_respond set_model action input */
export const serverActionModelSchema = z.object({ model: z.string() }).passthrough();

/** auto_respond set_permission_mode action input */
export const serverActionModeSchema = z.object({ mode: z.string() }).passthrough();
