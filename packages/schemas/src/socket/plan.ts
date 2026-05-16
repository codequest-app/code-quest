import { z } from 'zod';

export const planCommentDataSchema: z.ZodObject<
  { id: z.ZodString; selectedText: z.ZodString; sectionHeading: z.ZodString; comment: z.ZodString },
  z.core.$strip
> = z.object({
  id: z.string(),
  selectedText: z.string(),
  sectionHeading: z.string(),
  comment: z.string(),
});
export type PlanCommentData = z.infer<typeof planCommentDataSchema>;

export const planCommentPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    comment: z.ZodObject<
      {
        id: z.ZodString;
        selectedText: z.ZodString;
        sectionHeading: z.ZodString;
        comment: z.ZodString;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  comment: planCommentDataSchema,
});
export type PlanCommentPayload = z.infer<typeof planCommentPayloadSchema>;

export const planRemoveCommentPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; commentId: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  commentId: z.string(),
});
export type PlanRemoveCommentPayload = z.infer<typeof planRemoveCommentPayloadSchema>;

// ── Response ──

export const getPlanCommentsResponseSchema: z.ZodObject<
  {
    comments: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          selectedText: z.ZodString;
          sectionHeading: z.ZodString;
          comment: z.ZodString;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$loose
> = z.looseObject({
  comments: z.array(planCommentDataSchema),
});
export type GetPlanCommentsResponse = z.infer<typeof getPlanCommentsResponseSchema>;

// ── Plan review input (client) ──

export const planInputSchema: z.ZodObject<
  {
    plan: z.ZodOptional<z.ZodString>;
    allowedPrompts: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
  },
  z.core.$strip
> = z.object({
  plan: z.string().optional(),
  allowedPrompts: z.array(z.record(z.string(), z.unknown())).optional(),
});
export type PlanInput = z.infer<typeof planInputSchema>;
