import { z } from 'zod';

const cwdField = { cwd: z.string().optional() };

export const gitStatusSchema = z.object({ ...cwdField });
export type GitStatusPayload = z.infer<typeof gitStatusSchema>;

export const gitCheckoutSchema = z.object({ branch: z.string().min(1), ...cwdField });
export type GitCheckoutPayload = z.infer<typeof gitCheckoutSchema>;

export const gitLogSchema = z.object({ limit: z.number().min(1).max(100).optional(), ...cwdField });
export type GitLogPayload = z.infer<typeof gitLogSchema>;

export const gitDiffSchema = z.object({ ...cwdField });
export type GitDiffPayload = z.infer<typeof gitDiffSchema>;

export const gitExecSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  ...cwdField,
});
export type GitExecPayload = z.infer<typeof gitExecSchema>;

export const gitUpdateSkippedBranchSchema = z.object({
  channelId: z.string(),
  branch: z.string(),
  failed: z.boolean(),
});
export type GitUpdateSkippedBranchPayload = z.infer<typeof gitUpdateSkippedBranchSchema>;

export const gitFileChangeSchema = z.object({
  status: z.string(),
  file: z.string(),
});
export type GitFileChange = z.infer<typeof gitFileChangeSchema>;

export const gitLogEntrySchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});
export type GitLogEntry = z.infer<typeof gitLogEntrySchema>;

export const gitStatusResultSchema = z.object({
  branch: z.string(),
  isClean: z.boolean(),
  changedFiles: z.array(gitFileChangeSchema),
});
export type GitStatusResult = z.infer<typeof gitStatusResultSchema>;

export const gitLogResultSchema = z.object({
  entries: z.array(gitLogEntrySchema),
});
export type GitLogResult = z.infer<typeof gitLogResultSchema>;

export const gitDiffResultSchema = z.object({
  diff: z.string(),
});
export type GitDiffResult = z.infer<typeof gitDiffResultSchema>;

export const gitCheckoutResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type GitCheckoutResult = z.infer<typeof gitCheckoutResultSchema>;

export const execResponseSchema = z.looseObject({
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
});
export type ExecResponse = z.infer<typeof execResponseSchema>;
