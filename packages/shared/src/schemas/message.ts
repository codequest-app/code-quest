import { z } from 'zod';
import { contentBlockSchema } from './message-blocks.ts';
import { sessionStatsSchema } from './message-stats.ts';

// ── History replay (client) ──

export const historyAssistantSchema: z.ZodObject<
  {
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
> = z.object({
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
});
export type HistoryAssistant = z.infer<typeof historyAssistantSchema>;

export const historyUserSchema: z.ZodObject<
  {
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
> = z.object({
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
  source: z.enum(['typed', 'skill', 'command', 'reminder']).optional(),
});
export type HistoryUser = z.infer<typeof historyUserSchema>;

export const historyResultSchema: z.ZodObject<
  {
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
  },
  z.core.$strip
> = z.object({
  stats: sessionStatsSchema,
});
export type HistoryResult = z.infer<typeof historyResultSchema>;

// ── C2S payloads ──

export const chatSendPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; message: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string().min(1),
});
export type ChatSendPayload = z.infer<typeof chatSendPayloadSchema>;

export const chatRespondPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    response: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string().optional(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type ChatRespondPayload = z.infer<typeof chatRespondPayloadSchema>;

export const chatCancelPayloadSchema: z.ZodObject<{ channelId: z.ZodString }, z.core.$strip> =
  z.object({
    channelId: z.string(),
  });
export type ChatCancelPayload = z.infer<typeof chatCancelPayloadSchema>;

export const chatRewindCodePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; userMessageId: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
});
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodePayloadSchema>;

export const chatAskSideQuestionPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; question: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  question: z.string(),
});
export type ChatAskSideQuestionPayload = z.infer<typeof chatAskSideQuestionPayloadSchema>;

export const sideQuestionResultSchema: z.ZodObject<{ answer: z.ZodString }, z.core.$strip> =
  z.object({ answer: z.string() });
export type SideQuestionResult = z.infer<typeof sideQuestionResultSchema>;

export const chatStopTaskPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; taskId: z.ZodString },
  z.core.$strip
> = z.object({ channelId: z.string(), taskId: z.string() });
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskPayloadSchema>;

export const chatCancelAsyncMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; messageUuid: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  messageUuid: z.string(),
});
export type ChatCancelAsyncMessagePayload = z.infer<typeof chatCancelAsyncMessagePayloadSchema>;

// ── Moved to separate files ──
// Message content blocks → ./message-blocks.ts
// Stats schemas → ./message-stats.ts
// Message meta schemas → ./message-meta.ts
// Stream schemas → ./message-stream.ts
// S2C payloads, fileDiff, rewindResult → ./message-payloads.ts
