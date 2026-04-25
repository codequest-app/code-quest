import { z } from 'zod';

export const filesDirtyEventSchema = z.object({
  cwd: z.string(),
  paths: z.array(z.string()),
});

export const gitDirtyEventSchema = z.object({
  cwd: z.string(),
});

export type FilesDirtyEvent = z.infer<typeof filesDirtyEventSchema>;
export type GitDirtyEvent = z.infer<typeof gitDirtyEventSchema>;
