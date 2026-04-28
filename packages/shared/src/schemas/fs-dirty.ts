import { z } from 'zod';

export const filesDirtyEventSchema: z.ZodObject<
  { cwd: z.ZodString; paths: z.ZodArray<z.ZodString> },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  paths: z.array(z.string()),
});

export const gitDirtyEventSchema: z.ZodObject<{ cwd: z.ZodString }, z.core.$strip> = z.object({
  cwd: z.string(),
});

export type FilesDirtyEvent = z.infer<typeof filesDirtyEventSchema>;
export type GitDirtyEvent = z.infer<typeof gitDirtyEventSchema>;
