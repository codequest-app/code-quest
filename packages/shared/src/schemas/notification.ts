import { z } from 'zod';
import { usageQuotaSchema } from './settings.ts';

// ── Notification schemas ──

export const notificationButtonSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type NotificationButton = z.infer<typeof notificationButtonSchema>;

export const notificationPayloadSchema = z.object({
  id: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  buttons: z.array(notificationButtonSchema).optional(),
  onlyIfNotVisible: z.boolean().optional(),
});
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

export const notificationResponseSchema = z.looseObject({
  buttonValue: z.string().optional(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

// ── S2C payloads ──

export const notificationToastPayloadSchema = z.object({
  channelId: z.string(),
  message: z.string(),
});
export type NotificationToastPayload = z.infer<typeof notificationToastPayloadSchema>;

export const notificationShowPayloadSchema = z.object({
  channelId: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  buttons: z.array(z.string()).optional(),
  onlyIfNotVisible: z.boolean().optional(),
});
export type NotificationShowPayload = z.infer<typeof notificationShowPayloadSchema>;

export const notificationAuthUrlPayloadSchema = z.object({
  channelId: z.string(),
  url: z.string(),
  method: z.string(),
});
export type NotificationAuthUrlPayload = z.infer<typeof notificationAuthUrlPayloadSchema>;

export const notificationAuthStatusPayloadSchema = z.object({
  channelId: z.string(),
  status: z.string(),
  output: z.string().optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
export type NotificationAuthStatusPayload = z.infer<typeof notificationAuthStatusPayloadSchema>;

// ── Actions ──

export const actionOpenUrlPayloadSchema = z.object({
  channelId: z.string(),
  url: z.string(),
});
export type ActionOpenUrlPayload = z.infer<typeof actionOpenUrlPayloadSchema>;

export const actionOpenFilePayloadSchema = z.object({
  channelId: z.string(),
  filePath: z.string(),
  location: z
    .object({
      startLine: z.number().optional(),
      endLine: z.number().optional(),
      searchText: z.string().optional(),
    })
    .optional(),
});
export type ActionOpenFilePayload = z.infer<typeof actionOpenFilePayloadSchema>;

// ── Error ──

export const errorMessagePayloadSchema = z.object({
  channelId: z.string(),
  message: z.string(),
});
export type ErrorMessagePayload = z.infer<typeof errorMessagePayloadSchema>;

// ── Raw ──

export const rawEventPayloadSchema = z.object({
  channelId: z.string(),
  rawType: z.string(),
  data: z.record(z.string(), z.unknown()),
});
export type RawEventPayload = z.infer<typeof rawEventPayloadSchema>;

// ── State ──

export const stateUsagePayloadSchema = z.object({
  channelId: z.string(),
  usage: usageQuotaSchema,
  contextUsage: z.record(z.string(), z.unknown()).optional(),
});
export type StateUsagePayload = z.infer<typeof stateUsagePayloadSchema>;

export const contextCategorySchema = z.object({
  name: z.string(),
  tokens: z.number(),
  color: z.string(),
});
export type ContextCategory = z.infer<typeof contextCategorySchema>;

export const contextUsageDataSchema = z.object({
  categories: z.array(contextCategorySchema).optional(),
  totalTokens: z.number().optional(),
  maxTokens: z.number().optional(),
  percentage: z.number().optional(),
});
export type ContextUsageData = z.infer<typeof contextUsageDataSchema>;

// ── Speech ──

export const speechToTextMessagePayloadSchema = z.object({
  channelId: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type SpeechToTextMessagePayload = z.infer<typeof speechToTextMessagePayloadSchema>;
