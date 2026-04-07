import { z } from 'zod';

export const explorerBrowsePayloadSchema = z.object({
  path: z.string().optional(),
});
export type ExplorerBrowsePayload = z.infer<typeof explorerBrowsePayloadSchema>;

export const explorerDirectorySchema = z.object({
  name: z.string(),
  path: z.string(),
});
export type ExplorerDirectory = z.infer<typeof explorerDirectorySchema>;

export const explorerBrowseResponseSchema = z.object({
  directories: z.array(explorerDirectorySchema),
});
export type ExplorerBrowseResponse = z.infer<typeof explorerBrowseResponseSchema>;
