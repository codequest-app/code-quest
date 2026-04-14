import { z } from 'zod';
import { rpcResult } from './rpc.ts';

export const fileListPayloadSchema = z.object({ channelId: z.string(), pattern: z.string() });
export type FileListPayload = z.infer<typeof fileListPayloadSchema>;

export const fileSearchResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory']),
});
export type FileSearchResult = z.infer<typeof fileSearchResultSchema>;

export const fileReadPayloadSchema = z.object({
  channelId: z.string(),
  filePath: z.string(),
});
export type FileReadPayload = z.infer<typeof fileReadPayloadSchema>;

// ── Response ──

export const listFilesResponseSchema = rpcResult(
  z.object({ files: z.array(fileSearchResultSchema) }),
);
export type ListFilesResponse = z.infer<typeof listFilesResponseSchema>;

export const fileReadResponseSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);
export type FileReadResponse = z.infer<typeof fileReadResponseSchema>;
