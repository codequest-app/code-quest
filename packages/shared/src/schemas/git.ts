import { z } from 'zod';

export const gitStatusPayloadSchema = z.object({});
export type GitStatusPayload = z.infer<typeof gitStatusPayloadSchema>;

export const gitCheckoutPayloadSchema = z.object({ branch: z.string().min(1) });
export type GitCheckoutPayload = z.infer<typeof gitCheckoutPayloadSchema>;

export const gitLogPayloadSchema = z.object({
  cwd: z.string(),
  limit: z.number().min(1).max(100).optional(),
});
export type GitLogPayload = z.infer<typeof gitLogPayloadSchema>;

export const gitDiffPayloadSchema = z.object({});
export type GitDiffPayload = z.infer<typeof gitDiffPayloadSchema>;

export const gitExecPayloadSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
});
export type GitExecPayload = z.infer<typeof gitExecPayloadSchema>;

export const gitUpdateSkippedBranchPayloadSchema = z.object({
  channelId: z.string(),
  branch: z.string(),
  failed: z.boolean(),
});
export type GitUpdateSkippedBranchPayload = z.infer<typeof gitUpdateSkippedBranchPayloadSchema>;

/** Two-letter porcelain status codes from `git status --porcelain`. The
 *  first char is the index state, the second is the working-tree state;
 *  '??' marks untracked. Schema is plain `string` — porcelain codes are an
 *  open set (e.g. 'AM', '?M', ' M'); the UI only branches on the leading
 *  char. A bare enum here would cause spurious parse failures. */
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
  /** Commits ahead of upstream (0 when no upstream or up-to-date). */
  ahead: z.number().int().nonnegative().optional(),
  /** Commits behind upstream (0 when no upstream or up-to-date). */
  behind: z.number().int().nonnegative().optional(),
  /** True when the branch is tracking a remote (i.e. ahead/behind are meaningful). */
  hasUpstream: z.boolean().optional(),
});
export type GitStatusResult = z.infer<typeof gitStatusResultSchema>;

export const gitLogResultSchema = z.union([
  z.object({ entries: z.array(gitLogEntrySchema) }),
  z.object({ error: z.string() }),
]);
export type GitLogResult = z.infer<typeof gitLogResultSchema>;

export const gitDiffResultSchema = z.object({
  diff: z.string(),
});
export type GitDiffResult = z.infer<typeof gitDiffResultSchema>;

// ── Global by-cwd variants (no channel) ──

export const gitStatusByCwdPayloadSchema = z.object({ cwd: z.string() });
export type GitStatusByCwdPayload = z.infer<typeof gitStatusByCwdPayloadSchema>;

export const gitStatusByCwdResultSchema = z.union([
  gitStatusResultSchema,
  z.object({ notARepo: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type GitStatusByCwdResult = z.infer<typeof gitStatusByCwdResultSchema>;

export const gitDiffByCwdPayloadSchema = z.object({ cwd: z.string() });
export type GitDiffByCwdPayload = z.infer<typeof gitDiffByCwdPayloadSchema>;

export const gitDiffByCwdResultSchema = z.union([
  gitDiffResultSchema,
  z.object({ error: z.string() }),
]);
export type GitDiffByCwdResult = z.infer<typeof gitDiffByCwdResultSchema>;

// ── Write ops (global by-cwd) ──

export const gitAddPayloadSchema = z.object({
  cwd: z.string(),
  /** Omit (or empty) to stage all changes (`git add -A`). Pass paths to
   *  stage only those files. */
  paths: z.array(z.string()).optional(),
});
export type GitAddPayload = z.infer<typeof gitAddPayloadSchema>;

export const gitAddResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type GitAddResult = z.infer<typeof gitAddResultSchema>;

export const gitCommitPayloadSchema = z.object({
  cwd: z.string(),
  message: z.string().min(1),
});
export type GitCommitPayload = z.infer<typeof gitCommitPayloadSchema>;

export const gitCommitResultSchema = z.union([
  z.object({ ok: z.literal(true), hash: z.string() }),
  z.object({ error: z.string() }),
]);
export type GitCommitResult = z.infer<typeof gitCommitResultSchema>;

export const gitPushPayloadSchema = z.object({ cwd: z.string() });
export type GitPushPayload = z.infer<typeof gitPushPayloadSchema>;

export const gitPushResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type GitPushResult = z.infer<typeof gitPushResultSchema>;

export const gitFetchPayloadSchema = z.object({ cwd: z.string() });
export type GitFetchPayload = z.infer<typeof gitFetchPayloadSchema>;

export const gitFetchResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type GitFetchResult = z.infer<typeof gitFetchResultSchema>;

export const gitPullPayloadSchema = z.object({ cwd: z.string() });
export type GitPullPayload = z.infer<typeof gitPullPayloadSchema>;

/** Pull result. `fastForwarded: false` means already up to date (no-op FF).
 *  `error: 'non-ff'` means remote has diverging commits — the UI tells the
 *  user to rebase/merge manually (we don't do in-app conflict resolution). */
export const gitPullResultSchema = z.union([
  z.object({ ok: z.literal(true), fastForwarded: z.boolean() }),
  z.object({ error: z.string() }),
]);
export type GitPullResult = z.infer<typeof gitPullResultSchema>;

export const gitDiscardFilePayloadSchema = z.object({
  cwd: z.string(),
  /** Repo-relative file path (as reported by git status). */
  file: z.string(),
});
export type GitDiscardFilePayload = z.infer<typeof gitDiscardFilePayloadSchema>;

export const gitDiscardFileResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type GitDiscardFileResult = z.infer<typeof gitDiscardFileResultSchema>;

export const gitExecResponseSchema = z.looseObject({
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
});
export type GitExecResponse = z.infer<typeof gitExecResponseSchema>;
