import { z } from 'zod';

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

// actionOpenUrlPayloadSchema, actionOpenFilePayloadSchema — moved to actions.ts
// errorMessagePayloadSchema — moved to common.ts
// stateUsagePayloadSchema, contextCategorySchema, contextUsageDataSchema — moved to settings.ts
// speechToTextMessagePayloadSchema — moved to common.ts

// ── Raw ──

export const rawEventPayloadSchema = z.object({
  channelId: z.string(),
  rawType: z.string(),
  data: z.record(z.string(), z.unknown()),
});
export type RawEventPayload = z.infer<typeof rawEventPayloadSchema>;
