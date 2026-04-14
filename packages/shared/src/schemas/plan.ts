import { z } from 'zod';

export const planCommentDataSchema = z.object({
  id: z.string(),
  selectedText: z.string(),
  sectionHeading: z.string(),
  comment: z.string(),
});
export type PlanCommentData = z.infer<typeof planCommentDataSchema>;

export const planCommentPayloadSchema = z.object({
  channelId: z.string(),
  comment: planCommentDataSchema,
});
export type PlanCommentPayload = z.infer<typeof planCommentPayloadSchema>;

export const planRemoveCommentPayloadSchema = z.object({
  channelId: z.string(),
  commentId: z.string(),
});
export type PlanRemoveCommentPayload = z.infer<typeof planRemoveCommentPayloadSchema>;

// ── Response ──

export const getPlanCommentsResponseSchema = z.looseObject({
  comments: z.array(planCommentDataSchema),
});
export type GetPlanCommentsResponse = z.infer<typeof getPlanCommentsResponseSchema>;

// ── Plan review input (client) ──

export const planInputSchema = z.object({
  plan: z.string().optional(),
  allowedPrompts: z.array(z.record(z.string(), z.unknown())).optional(),
});
export type PlanInput = z.infer<typeof planInputSchema>;
