import { z } from 'zod';

// ── Notification schemas ──

export const notificationSeveritySchema: z.ZodEnum<{
  error: 'error';
  info: 'info';
  warning: 'warning';
}> = z.enum(['info', 'warning', 'error']);
export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>;

export const notificationButtonSchema: z.ZodObject<
  { label: z.ZodString; value: z.ZodString },
  z.core.$strip
> = z.object({
  label: z.string(),
  value: z.string(),
});
export type NotificationButton = z.infer<typeof notificationButtonSchema>;

export const notificationPayloadSchema: z.ZodObject<
  {
    id: z.ZodString;
    message: z.ZodString;
    severity: z.ZodOptional<z.ZodEnum<{ error: 'error'; info: 'info'; warning: 'warning' }>>;
    buttons: z.ZodOptional<
      z.ZodArray<z.ZodObject<{ label: z.ZodString; value: z.ZodString }, z.core.$strip>>
    >;
    onlyIfNotVisible: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
> = z.object({
  id: z.string(),
  message: z.string(),
  severity: notificationSeveritySchema.optional(),
  buttons: z.array(notificationButtonSchema).optional(),
  onlyIfNotVisible: z.boolean().optional(),
});
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

// ── S2C payloads ──

export const notificationToastPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; message: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string(),
});
export type NotificationToastPayload = z.infer<typeof notificationToastPayloadSchema>;

export const notificationShowPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    message: z.ZodString;
    severity: z.ZodEnum<{ error: 'error'; info: 'info'; warning: 'warning' }>;
    buttons: z.ZodOptional<z.ZodArray<z.ZodString>>;
    onlyIfNotVisible: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string(),
  severity: notificationSeveritySchema,
  buttons: z.array(z.string()).optional(),
  onlyIfNotVisible: z.boolean().optional(),
});
export type NotificationShowPayload = z.infer<typeof notificationShowPayloadSchema>;

export const notificationAuthUrlPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; url: z.ZodString; method: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  url: z.string(),
  method: z.string(),
});
export type NotificationAuthUrlPayload = z.infer<typeof notificationAuthUrlPayloadSchema>;

export const notificationAuthStatusPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    status: z.ZodString;
    output: z.ZodOptional<z.ZodString>;
    account: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  status: z.string(),
  output: z.string().optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
export type NotificationAuthStatusPayload = z.infer<typeof notificationAuthStatusPayloadSchema>;

// ── Raw ──

export const rawEventPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; rawType: z.ZodString; data: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  rawType: z.string(),
  data: z.record(z.string(), z.unknown()),
});
export type RawEventPayload = z.infer<typeof rawEventPayloadSchema>;
