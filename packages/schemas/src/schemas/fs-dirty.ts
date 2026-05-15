import { z } from 'zod';
import type { FileResult } from '../services/filesystem.ts';
import type { GitStatusResult } from './git.ts';

export const filesDirtyEventSchema: z.ZodObject<
  {
    cwd: z.ZodString;
    paths: z.ZodArray<z.ZodString>;
    snapshot: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  paths: z.array(z.string()),
  snapshot: z.array(z.unknown()).optional(),
});

export const gitDirtyEventSchema: z.ZodObject<
  { cwd: z.ZodString; snapshot: z.ZodOptional<z.ZodUnknown> },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  snapshot: z.unknown().optional(),
});

export type FilesDirtyEvent = Omit<z.infer<typeof filesDirtyEventSchema>, 'snapshot'> & {
  snapshot?: FileResult[];
};
export type GitDirtyEvent = Omit<z.infer<typeof gitDirtyEventSchema>, 'snapshot'> & {
  snapshot?: GitStatusResult;
};
