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
    content: z.ZodArray<
      z.ZodUnion<
        readonly [
          z.ZodObject<{ type: z.ZodLiteral<'text'>; text: z.ZodString }, z.core.$strip>,
          z.ZodObject<{ type: z.ZodLiteral<'thinking'>; thinking: z.ZodString }, z.core.$strip>,
          z.ZodObject<
            {
              type: z.ZodLiteral<'tool_use'>;
              toolId: z.ZodString;
              toolName: z.ZodString;
              input: z.ZodUnknown;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              type: z.ZodLiteral<'tool_result'>;
              toolUseId: z.ZodString;
              toolName: z.ZodOptional<z.ZodString>;
              content: z.ZodUnknown;
              isError: z.ZodOptional<z.ZodBoolean>;
            },
            z.core.$strip
          >,
        ]
      >
    >;
    parentToolUseId: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = messagePayloadBaseSchema;
export type MessageAssistantPayload = z.infer<typeof messageAssistantPayloadSchema>;

export const userSourceSchema: z.ZodEnum<{
  command: 'command';
  typed: 'typed';
  skill: 'skill';
  reminder: 'reminder';
}> = z.enum(['typed', 'skill', 'command', 'reminder']);
export type UserSource = z.infer<typeof userSourceSchema>;

export const messageUserPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    content: z.ZodArray<
      z.ZodUnion<
        readonly [
          z.ZodObject<{ type: z.ZodLiteral<'text'>; text: z.ZodString }, z.core.$strip>,
          z.ZodObject<{ type: z.ZodLiteral<'thinking'>; thinking: z.ZodString }, z.core.$strip>,
          z.ZodObject<
            {
              type: z.ZodLiteral<'tool_use'>;
              toolId: z.ZodString;
              toolName: z.ZodString;
              input: z.ZodUnknown;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              type: z.ZodLiteral<'tool_result'>;
              toolUseId: z.ZodString;
              toolName: z.ZodOptional<z.ZodString>;
              content: z.ZodUnknown;
              isError: z.ZodOptional<z.ZodBoolean>;
            },
            z.core.$strip
          >,
        ]
      >
    >;
    parentToolUseId: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<
      z.ZodEnum<{ command: 'command'; typed: 'typed'; skill: 'skill'; reminder: 'reminder' }>
    >;
  },
  z.core.$strip
> = messagePayloadBaseSchema.extend({
  source: userSourceSchema.optional(),
});
export type MessageUserPayload = z.infer<typeof messageUserPayloadSchema>;

export const messageResultPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    stats: z.ZodObject<
      {
        costUsd: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        numTurns: z.ZodOptional<z.ZodNumber>;
        modelUsage: z.ZodOptional<
          z.ZodRecord<
            z.ZodString,
            z.ZodObject<
              {
                inputTokens: z.ZodOptional<z.ZodNumber>;
                outputTokens: z.ZodOptional<z.ZodNumber>;
                cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
                cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
                costUSD: z.ZodOptional<z.ZodNumber>;
                contextWindow: z.ZodOptional<z.ZodNumber>;
                maxOutputTokens: z.ZodOptional<z.ZodNumber>;
              },
              z.core.$strip
            >
          >
        >;
        contextWindow: z.ZodOptional<z.ZodNumber>;
        totalCostUsd: z.ZodOptional<z.ZodNumber>;
        cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
        cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
      },
      z.core.$strip
    >;
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
