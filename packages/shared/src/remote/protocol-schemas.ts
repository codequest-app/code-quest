import { z } from 'zod';
import { fsEntryTypeSchema } from '../schemas/fs.ts';
import { worktreeInfoSchema } from '../schemas/worktree.ts';

// ── Process ──

export const processSpawnParamsSchema = z.object({
  sessionId: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

export const processStdinParamsSchema = z.object({
  sessionId: z.string(),
  data: z.string(),
});

export const processKillParamsSchema = z.object({
  sessionId: z.string(),
});

export const processLineEventSchema = z.object({
  sessionId: z.string(),
  line: z.string(),
});

export const processExitEventSchema = z.object({
  sessionId: z.string(),
  code: z.number().nullable(),
});

// ── Filesystem ──

export const fsBrowseDirectoriesParamsSchema = z.object({
  path: z.string().optional(),
});

export const fsBrowseEntriesParamsSchema = z.object({
  path: z.string().optional(),
  showHidden: z.boolean().optional(),
});

export const fsReadFileAbsoluteParamsSchema = z.object({
  absolutePath: z.string(),
});

export const fsWriteFileAbsoluteParamsSchema = z.object({
  absolutePath: z.string(),
  content: z.string(),
});

export const fsCreateParamsSchema = z.object({
  absolutePath: z.string(),
  kind: fsEntryTypeSchema,
});

export const fsDeleteParamsSchema = z.object({
  absolutePath: z.string(),
});

const fromToSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const fsRenameParamsSchema = fromToSchema;
export const fsCopyParamsSchema = fromToSchema;
export const fsMoveParamsSchema = fromToSchema;

export const fsListParamsSchema = z.object({
  cwd: z.string(),
  pattern: z.string(),
});

export const fsReadParamsSchema = z.object({
  cwd: z.string(),
  filePath: z.string(),
});

export const fsExistsParamsSchema = z.object({
  path: z.string(),
});

export const fsIsDirectoryParamsSchema = z.object({
  path: z.string(),
});

export const fsStatKindParamsSchema = z.object({
  path: z.string(),
});

// ── Filesystem responses ──

const directoryEntrySchema = z.object({ name: z.string(), path: z.string() });

export const fsBrowseDirectoriesResponseSchema = z.object({
  entries: z.array(directoryEntrySchema),
});

export const fsBrowseEntriesResponseSchema = z.object({
  directories: z.array(directoryEntrySchema),
  files: z.array(directoryEntrySchema),
});

const fileResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: fsEntryTypeSchema,
});

export const fsListResponseSchema = z.object({
  files: z.array(fileResultSchema),
});

export const fsExistsResponseSchema = z.object({ exists: z.boolean() });
export const fsIsDirectoryResponseSchema = z.object({ isDirectory: z.boolean() });
export const fsStatKindResponseSchema = z.object({
  kind: fsEntryTypeSchema.nullable(),
});

export const fsReadFileAbsoluteResponseSchema = z.union([
  z.object({ content: z.string(), contentType: z.string(), encoding: z.enum(['utf-8', 'base64']) }),
  z.object({ error: z.string() }),
]);

export const fsReadFileResponseSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);

// ── Git responses ──

export const gitNullableRootSchema = z.string().nullable();

export const gitBranchResultSchema = z.object({ branch: z.string() });

export const gitBranchListSchema = z.array(z.string());

export const gitWorktreeListSchema = z.array(worktreeInfoSchema);

// ── Git ──

export const gitCwdParamsSchema = z.object({
  cwd: z.string(),
});

export const gitCheckoutParamsSchema = z.object({
  cwd: z.string(),
  branch: z.string(),
});

export const gitLogParamsSchema = z.object({
  cwd: z.string(),
  limit: z.number().optional(),
});

export const gitDiffParamsSchema = z.object({
  cwd: z.string(),
  filePath: z.string().optional(),
  status: z.string().optional(),
});

export const gitAddParamsSchema = z.object({
  cwd: z.string(),
  paths: z.array(z.string()).optional(),
});

export const gitCommitParamsSchema = z.object({
  cwd: z.string(),
  message: z.string(),
});

export const gitDiscardFileParamsSchema = z.object({
  cwd: z.string(),
  file: z.string(),
});

export const gitListBranchesParamsSchema = z.object({
  repoRoot: z.string(),
});

export const gitCreateWorktreeParamsSchema = z.object({
  repoRoot: z.string(),
  opts: z
    .object({
      name: z.string().optional(),
      existingBranch: z.string().optional(),
      newBranch: z.string().optional(),
      baseBranch: z.string().optional(),
      path: z.string().optional(),
    })
    .optional(),
});

export const gitListWorktreesParamsSchema = z.object({
  repoRoot: z.string(),
});

export const gitDeleteWorktreeParamsSchema = z.object({
  repoRoot: z.string(),
  name: z.string(),
});

export const gitRenameWorktreeParamsSchema = z.object({
  worktreeCwd: z.string(),
  newBranchName: z.string(),
});

export const gitArchiveWorktreeParamsSchema = z.object({
  repoRoot: z.string(),
  name: z.string(),
  opts: z.object({ force: z.boolean().optional() }).optional(),
});
