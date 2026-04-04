import { z } from 'zod';

// ── Actions (moved from notification.ts) ──

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
