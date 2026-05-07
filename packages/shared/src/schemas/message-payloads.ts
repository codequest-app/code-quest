import { z } from 'zod';
import { contentBlockSchema } from './message-blocks.ts';
import { sessionStatsSchema } from './message-stats.ts';

const messagePayloadBaseSchema = z.object({
  channelId: z.string(),
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
});

export const messageAssistantPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    content: z.ZodArray<typeof contentBlockSchema>;
    parentToolUseId: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = messagePayloadBaseSchema;
export type MessageAssistantPayload = z.infer<typeof messageAssistantPayloadSchema>;

export const messageUserPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    content: z.ZodArray<typeof contentBlockSchema>;
    parentToolUseId: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
    history: z.ZodOptional<z.ZodBoolean>;
    renderAs: z.ZodOptional<z.ZodEnum<{ markdown: 'markdown'; plain: 'plain' }>>;
  },
  z.core.$strip
> = messagePayloadBaseSchema.extend({
  history: z.boolean().optional(),
  renderAs: z.enum(['markdown', 'plain']).optional(),
});
export type MessageUserPayload = z.infer<typeof messageUserPayloadSchema>;

export const messageResultPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    stats: typeof sessionStatsSchema;
    errors: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isError: z.ZodOptional<z.ZodBoolean>;
    subtype: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  stats: sessionStatsSchema,
  errors: z.array(z.string()).optional(),
  isError: z.boolean().optional(),
  subtype: z.string().optional(),
});
export type MessageResultPayload = z.infer<typeof messageResultPayloadSchema>;
