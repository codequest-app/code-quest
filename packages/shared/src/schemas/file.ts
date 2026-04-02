import { z } from 'zod';

export const fileListSchema = z.object({ channelId: z.string(), pattern: z.string() });
export type FileListPayload = z.infer<typeof fileListSchema>;

export const fileSearchResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory', 'terminal']),
});
export type FileSearchResult = z.infer<typeof fileSearchResultSchema>;

export const fileReadPayloadSchema = z.object({
  channelId: z.string(),
  filePath: z.string(),
});
export type FileReadPayload = z.infer<typeof fileReadPayloadSchema>;

// ── Response ──

export const listFilesResponseSchema = z
  .object({
    files: z.array(fileSearchResultSchema),
  })
  .passthrough();
export type ListFilesResponse = z.infer<typeof listFilesResponseSchema>;

export const fileReadResponseSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);
export type FileReadResponse = z.infer<typeof fileReadResponseSchema>;

// ── S2C ──

export const closeChannelPayloadSchema = z.object({
  channelId: z.string(),
  error: z.string().optional(),
});
export type CloseChannelPayload = z.infer<typeof closeChannelPayloadSchema>;

export const cancelRequestEventPayloadSchema = z.object({
  channelId: z.string(),
  targetRequestId: z.string(),
});
export type CancelRequestEventPayload = z.infer<typeof cancelRequestEventPayloadSchema>;
