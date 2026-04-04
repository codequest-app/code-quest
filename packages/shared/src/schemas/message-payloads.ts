import { z } from 'zod';
import { contentBlockSchema } from './message-blocks.ts';
import { sessionStatsSchema } from './message-stats.ts';

const messagePayloadBaseSchema = z.object({
  channelId: z.string(),
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
});

export const messageAssistantPayloadSchema = messagePayloadBaseSchema;
export type MessageAssistantPayload = z.infer<typeof messageAssistantPayloadSchema>;

export const messageUserPayloadSchema = messagePayloadBaseSchema;
export type MessageUserPayload = z.infer<typeof messageUserPayloadSchema>;

export const messageResultPayloadSchema = z.object({
  channelId: z.string(),
  stats: sessionStatsSchema,
  errors: z.array(z.string()).optional(),
  isError: z.boolean().optional(),
  subtype: z.string().optional(),
});
export type MessageResultPayload = z.infer<typeof messageResultPayloadSchema>;
