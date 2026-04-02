import { z } from 'zod';

export const planCommentDataSchema = z.object({
  id: z.string(),
  selectedText: z.string(),
  sectionHeading: z.string(),
  comment: z.string(),
});
export type PlanCommentData = z.infer<typeof planCommentDataSchema>;

export const planCommentSchema = z.object({
  channelId: z.string(),
  comment: planCommentDataSchema,
});
export type PlanCommentPayload = z.infer<typeof planCommentSchema>;

export const planGetCommentsSchema = z.object({
  channelId: z.string(),
});
export type PlanGetCommentsPayload = z.infer<typeof planGetCommentsSchema>;

export const planRemoveCommentSchema = z.object({
  channelId: z.string(),
  commentId: z.string(),
});
export type PlanRemoveCommentPayload = z.infer<typeof planRemoveCommentSchema>;

export const planClosePreviewSchema = z.object({
  channelId: z.string(),
});
export type PlanClosePreviewPayload = z.infer<typeof planClosePreviewSchema>;

// ── Response ──

export const getPlanCommentsResponseSchema = z.looseObject({
  comments: z.array(planCommentDataSchema),
});
export type GetPlanCommentsResponse = z.infer<typeof getPlanCommentsResponseSchema>;

// ── S2C ──

export const planCommentEventPayloadSchema = z.object({
  channelId: z.string(),
  comment: planCommentDataSchema,
});
export type PlanCommentEventPayload = z.infer<typeof planCommentEventPayloadSchema>;

export const removeCommentPayloadSchema = z.object({
  channelId: z.string(),
  commentId: z.string(),
});
export type RemoveCommentPayload = z.infer<typeof removeCommentPayloadSchema>;
